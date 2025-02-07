const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Factories = require("../models/Factories");
const PDFDocument = require("pdfkit");
const axios = require('axios');

exports.allUser = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }

};

exports.Branding1 = async (req, res) => {
    try {
        const { businessName, brandColor, logo } = req.body;

        // const newBrand = new Branding({
        //   businessName,
        //   brandColor,
        //   logoUrl: logo,
        // });

        // await newBrand.save();
        res.status(200).json({ message: "Branding details saved successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error saving branding details" });
    }
};



exports.getSingleUser = async (req, res) => {
    try {
        // Validate user ID
        if (!req.user || !req.user.id) {
            return res.status(400).json({ message: "Invalid or missing user ID." });
        }

        // Find the user
        const user = await User.findById(req.user.id).select('email username')

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Send user data (email and name) as response
        res.status(200).json(user);


    } catch (error) {
        console.error("Error in getSingleUser:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

exports.generatePdf = async (req, res) => {
    try {
        const { factoryId, data } = req.body; 
        console.log(factoryId);
        
        const factory = await Factories.findById(factoryId);
        const quotationData = Array.isArray(data) ? data : []; 
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${factory.name.replace(/\s+/g, "_")}_quotation.pdf`);
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
        doc.font('Helvetica-Bold').fontSize(20).text(factory.name, { align: 'center' });
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

