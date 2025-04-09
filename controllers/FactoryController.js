const jwt = require("jsonwebtoken");
const Factory = require("../models/Factories");
const PDFDocument = require("pdfkit");
const Factories = require("../models/Factories");
const axios = require('axios');
const User = require("../models/User");
require("dotenv").config();

exports.AddFactory = async (req, res) => {
    try {
        const { formData } = req.body;
        const { businessName, brandColor, logo, phone, email, address, username } = formData;

        // Ensure all required fields are present
        if (!businessName || !brandColor || !phone || !email || !address) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingFactory = await Factory.findOne({ name: businessName });

        if (existingFactory) {
            return res.status(400).json({ success: false, message: "Factory name already exists" });
        }

        const newFactory = new Factory({
            businessName,
            username,
            brand_color: brandColor,
            logo_url: logo,
            phone_number: phone,
            email,
            address,
            status: "inactive",
        });

        // Save the factory to the database
        const savedFactory = await newFactory.save();

        // Generate a JWT token
        const token = jwt.sign(
            { factoryId: savedFactory._id, role: "factory" },
            process.env.JWT_SECRET
        );

        // Set token to cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: true, 
            sameSite: "Lax", 
            domain: ".quotely.shop", 
            maxAge: 14 * 24 * 60 * 60 * 1000,
          });
          

        res.status(200).json({
            message: "Branding details saved successfully",
            factoryId: savedFactory._id,
            token,
            subdomain: username
        });
    } catch (error) {
        console.error("Error in AddFactory:", error);
        res.status(500).json({ message: "Error saving branding details" });
    }
};


exports.getFactory = async (req, res) => {
    try {
        const { shopName } = req.query;
        if (shopName) {
            // Fetch factory by ID
            const factory = await Factory.find({ username: shopName });
            if (!factory) {
                return res.status(404).json({ message: "Factory not found" });
            }
            return res.status(200).json(factory);
        }
        if (req.query.id) {
            const factory = await Factory.find({ _id: req.query.id });
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

        if (!factory) {
            return res.status(404).json({ message: "Factory not found" });
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${factory.name.replace(/\s+/g, "_")}_quotation.pdf`
        );
        doc.pipe(res);

        // Background Color (Light Gray for contrast)
        doc.save()
            .fillColor('#f5f5f5') // Light gray
            .rect(0, 0, doc.page.width, doc.page.height)
            .fill();
        doc.restore();

        // Fetch and display the logo
        if (factory.logo_url) {
            try {
                const logoResponse = await axios.get(factory.logo_url, { responseType: 'arraybuffer' });
                const logoBuffer = Buffer.from(logoResponse.data, 'binary');
                doc.image(logoBuffer, 50, 50, { width: 80, height: 80 });
            } catch (logoError) {
                console.error("Error loading logo:", logoError);
            }
        }

        // Factory Information
        doc.font('Helvetica-Bold').fontSize(18).text(factory.name, { align: 'right' });
        doc.font('Helvetica').fontSize(10)
            .text(`Email: ${factory.email}`, { align: 'right' })
            .text(`Phone: ${factory.phone_number}`, { align: 'right' })
            .text(`Address: ${factory.address}`, { align: 'right' })
            .moveDown(1);

        doc.moveTo(50, 150).lineTo(550, 150).stroke(); // Divider line

        // Table headers
        let yPosition = 170;
        doc.font('Helvetica-Bold').fontSize(12)
            .text('Image', 50, yPosition)
            .text('Product', 150, yPosition)
            .text('Variation', 300, yPosition)
            .text('Quantity', 400, yPosition)
            .text('Unit Price', 460, yPosition)
            .text('Total', 520, yPosition);
        doc.moveTo(50, 185).lineTo(550, 185).stroke();

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

        yPosition = 200;
        let grandTotal = 0;

        quotationData.forEach((item, index) => {
            if (yPosition > 700) { // Add new page if content overflows
                doc.addPage();
                yPosition = 50;
            }

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
                .text(item.name, 150, yPosition)
                .text(item.selectedVariation.size, 300, yPosition)
                .text(item.quantity.toString(), 400, yPosition)
                .text(`$${item.selectedVariation.basePrice.toFixed(2)}`, 460, yPosition)
                .text(`$${productTotal.toFixed(2)}`, 520, yPosition);

            yPosition += 60;
        });

        // Grand Total
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 10;
        doc.font('Helvetica-Bold').fontSize(14)
            .text(`Grand Total: $${grandTotal.toFixed(2)}`, 400, yPosition);

        // Thank You Note
        doc.font('Helvetica').fontSize(10)
            .text('Thank you for your business!', 50, doc.page.height - 80, { align: 'center' });

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

exports.activateAccount = async (req, res) => {
    const { sessionId } = req.body;

    try {
        if (!sessionId) {
            return res.status(400).json({ success: false, message: "Missing session ID." });
        }

        const userId = req.Factory?._id; // From authMiddleware
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        // ✅ Find and update the user
        const user = await Factories.findByIdAndUpdate(
            userId,
            {
                status: "active",
                paymentVerified: true,
                paymentSessionId: sessionId,
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.status(200).json({
            success: true,
            message: "Account activated successfully.",
            user,
        });
    } catch (error) {
        console.error("Activate Account Error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while activating the account.",
        });
    }
};
