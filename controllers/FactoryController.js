const jwt = require("jsonwebtoken");
const Factory = require("../models/Factories");
const PDFDocument = require("pdfkit");
const Factories = require("../models/Factories");
const axios = require('axios');
const User = require("../models/User");
require("dotenv").config();

exports.AddFactory = async (req, res) => {
    try {
        const { formData, userID } = req.body;
        const userRecord = await User.findById(userID);

        if (userRecord) {
          console.log("User found:");
        } else {
          console.log("User not found");
          throw new Error("User not found");
        }
        
        const { businessName, brandColor, logo, phone, email, address } = formData;

        // Ensure all required fields are present
        if (!businessName || !brandColor || !logo || !phone || !email || !address || !userID) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newFactory = new Factory({
            factoryName: businessName,
            brand_color: brandColor,
            logo_url: logo,
            phone_number: phone,
            email,
            address,
            user: userID,
        });

        // Save the factory to the database
        const savedFactory = await newFactory.save();

        // Generate a JWT token
        const token = jwt.sign(
            { factoryId: savedFactory._id, user: userID , role:"factory" },
            process.env.JWT_SECRET
        );

        res.status(200).json({
            message: "Branding details saved successfully",
            factoryId: savedFactory._id,
            token,
        });
    } catch (error) {
        console.error("Error in AddFactory:", error);
        res.status(500).json({ message: "Error saving branding details" });
    }
};


exports.getFactory = async (req, res) => {
    try {
        const { id } = req.query;
        if (id) {
            // Fetch factory by ID
            const factory = await Factory.findById(id);
            if (!factory) {
                return res.status(404).json({ message: "Factory not found" });
            }
            return res.status(200).json(factory);
        }

        // If 'id' is not provided, fetch all factories
        const factories = await Factory.find();
        return res.status(200).json(factories);
    } catch (error) {
        console.error("Error in getFactory:", error);
        res.status(500).json({ message: "Error fetching factory details" });
    }
};

exports.generatePdf = async (req, res) => {
    try {
        const factoryId = req.user.factoryId;
        const factory = await Factories.findById(factoryId);
        const quotationData = req.query.data ? JSON.parse(req.query.data) : [];

        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${factory.factoryName.replace(/\s+/g, "_")}_quotation.pdf`);
        doc.pipe(res);

        // Add background color
        doc.save()
            .fillColor('#ffffff')  // White background
            .rect(0, 0, doc.page.width, doc.page.height)
            .fill();

        // Fetch and display the logo
        if (factory.logo_url) {
            try {
                const logoResponse = await axios.get(factory.logo_url, { responseType: 'arraybuffer' });
                const logoBuffer = Buffer.from(logoResponse.data, 'binary');
                doc.image(logoBuffer, 50, 50, { width: 100, height: 100 });
            } catch (logoError) {
                console.error("Error loading logo:", logoError);
            }
        }

        doc.restore();

        // Add factory details and table
        doc.font('Helvetica-Bold').fontSize(20).text(factory.factoryName, { align: 'center' });
        doc.font('Helvetica').fontSize(10)
            .text(`Email: ${factory.email}`, { align: 'center' })
            .text(`Phone: ${factory.phone_number}`, { align: 'center' })
            .text(`Address: ${factory.address}`, { align: 'center' })
            .moveDown(1);

        // Table headers
        doc.font('Helvetica-Bold').fontSize(12)
            .text('Product', 50, 200)
            .text('Variation', 200, 200)
            .text('Quantity', 300, 200)
            .text('Unit Price', 400, 200)
            .text('Total', 500, 200);
        doc.moveTo(50, 215).lineTo(550, 215).stroke();

        // Fetch product images asynchronously
        const imageBuffers = await Promise.all(
            quotationData.map(async (item) => {
                if (item.image) {
                    try {
                        const response = await axios.get(item.image, { responseType: 'arraybuffer' });
                        return Buffer.from(response.data, 'binary');
                    } catch (error) {
                        console.error(`Error fetching image for ${item.name}:`, error);
                        return null;
                    }
                }
                return null;
            })
        );

        let yPosition = 230;
        let grandTotal = 0;

        quotationData.forEach((item, index) => {
            const imageBuffer = imageBuffers[index];
            if (imageBuffer) {
                try {
                    doc.image(imageBuffer, 50, yPosition, { width: 50, height: 50 });
                } catch (error) {
                    console.error("Error adding product image:", error);
                }
            }

            const productTotal = item.selectedVariation.basePrice * item.quantity;
            grandTotal += productTotal;

            doc.font('Helvetica').fontSize(10)
                .text(item.name, 200, yPosition)
                .text(item.selectedVariation.size, 200, yPosition + 15)
                .text(item.quantity.toString(), 300, yPosition)
                .text(`$${item.selectedVariation.basePrice.toFixed(2)}`, 400, yPosition)
                .text(`$${productTotal.toFixed(2)}`, 500, yPosition);

            yPosition += 60;
        });

        doc.font('Helvetica-Bold').fontSize(14)
            .text(`Grand Total: $${grandTotal.toFixed(2)}`, 400, yPosition + 20);

        doc.font('Helvetica').fontSize(8)
            .text('Thank you for your business!', 50, doc.page.height - 100, { align: 'center' });

        doc.end();
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ message: "Error while generating the PDF" });
    }
};


exports.getAllFactory = async (req, res) => {
    try {
        const factories = await Factory.find(); // Fetch all factories from the database
        res.status(200).json(factories); // Send the list of factories in JSON format
    } catch (error) {
        console.error('Error fetching factories:', error);
        res.status(500).json({ message: 'Internal Server Error' }); // Handle any errors
    }
};


exports.deleteFactory = async (req, res) => {
    const { id } = req.params; // Extract the factory ID from the request parameters

    try {
        const deletedFactory = await Factory.findByIdAndDelete(id); // Find and delete the factory by ID

        if (!deletedFactory) {
            return res.status(404).json({ message: 'Factory not found' }); // Handle case when the factory does not exist
        }

        res.status(200).json({ message: 'Factory deleted successfully', factory: deletedFactory });
    } catch (error) {
        console.error('Error deleting factory:', error);
        res.status(500).json({ message: 'Internal Server Error' }); // Handle any server errors
    }
};
