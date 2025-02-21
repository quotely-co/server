const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Factories = require("../models/Factories");
const PDFDocument = require("pdfkit");
const axios = require('axios');
require("dotenv").config();
const nodemailer = require("nodemailer");

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
        const { factoryId, data, email } = req.body; // You can pass the recipient email address here
        const factory = await Factories.findById(factoryId);
        const quotationData = Array.isArray(data) ? data : [];

        if (!factory) {
            return res.status(404).json({ message: "Factory not found" });
        }

        // Use brand color or default to green
        const brandColor = factory.brand_color || "#006837";
        
        // Create PDF with A4 size and reduced margins for more space
        const doc = new PDFDocument({ 
            margin: 30, 
            size: 'A4',
            info: {
                Title: `${factory.name} - Quotation`,
                Author: factory.name
            }
        });

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${factory.name.replace(/\s+/g, "_")}_quotation.pdf`);
        doc.pipe(res);

        // Helper function to create table cell
        const createTableCell = (x, y, width, height, text, options = {}) => {
            const defaultOptions = {
                fontSize: 9,
                font: 'Helvetica',
                align: 'center',
                valign: 'center',
                padding: 5,
                backgroundColor: options.header ? brandColor : null,
                textColor: options.header ? '#ffffff' : '#000000'
            };
            const opts = { ...defaultOptions, ...options };

            if (opts.backgroundColor) {
                doc.fillColor(opts.backgroundColor)
                   .rect(x, y, width, height)
                   .fill();
            }

            doc.fillColor(opts.textColor)
               .font(opts.font)
               .fontSize(opts.fontSize);

            const textWidth = doc.widthOfString(text);
            const textHeight = doc.currentLineHeight();
            const textX = x + (width - textWidth) / 2;
            const textY = y + (height - textHeight) / 2;

            doc.text(text, textX, textY);
        };

        // Add header with logo and company details
        if (factory.logo_url) {
            try {
                const logoResponse = await axios.get(factory.logo_url, { responseType: 'arraybuffer' });
                const logoBuffer = Buffer.from(logoResponse.data, 'binary');
                doc.image(logoBuffer, 30, 30, { width: 150 });
            } catch (error) {
                console.error("Error loading logo:", error);
            }
        }

        // Company details on the right
        doc.font('Helvetica-Bold').fontSize(16)
           .text(factory.name, 250, 30, { align: 'right' });
        
        doc.font('Helvetica').fontSize(10)
           .text('Business', 250, 55, { align: 'right' })
           .text(`Date: ${new Date().toLocaleDateString()}`, 250, 70, { align: 'right' })
           .text(`Email: ${factory.email}`, 250, 85, { align: 'right' })
           .text(`Tel: ${factory.phone_number}`, 250, 100, { align: 'right' });

        // Add green separator line
        doc.strokeColor(brandColor).lineWidth(2)
           .moveTo(30, 140).lineTo(565, 140).stroke();

        // Table headers
        const startY = 160;
        const headers = [
            { text: 'Description', width: 120 },
            { text: 'Size', width: 80 },
            { text: 'Material Weight', width: 70 },
            { text: 'Print/Color', width: 60 },
            { text: 'Qty', width: 50 },
            { text: 'CTNS', width: 40 },
            { text: 'Unit Price', width: 60 },
            { text: 'Total', width: 55 }
        ];

        let currentX = 30;
        headers.forEach(header => {
            createTableCell(currentX, startY, header.width, 30, header.text, { header: true });
            currentX += header.width;
        });

        // Table rows
        let currentY = startY + 30;
        let grandTotal = 0;

        // Fetch product images
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

        quotationData.forEach((item, index) => {
            const rowHeight = 25;
            currentX = 30;
            const rowData = [
                { text: item.name, width: headers[0].width },
                { text: item.selectedVariation.size, width: headers[1].width },
                { text: `${item.weight || '-'}`, width: headers[2].width },
                { text: item.color || '-', width: headers[3].width },
                { text: item.quantity.toString(), width: headers[4].width },
                { text: item.cartons || '-', width: headers[5].width },
                { text: `$${item.selectedVariation.basePrice.toFixed(3)}`, width: headers[6].width },
                { text: `$${(item.selectedVariation.basePrice * item.quantity).toFixed(2)}`, width: headers[7].width }
            ];

            rowData.forEach(cell => {
                createTableCell(currentX, currentY, cell.width, rowHeight, cell.text, { 
                    backgroundColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff'
                });
                currentX += cell.width;
            });

            grandTotal += item.selectedVariation.basePrice * item.quantity;

            // Add product image if available
            const imageBuffer = imageBuffers[index];
            if (imageBuffer) {
                try {
                    doc.image(imageBuffer, 30, currentY + 5, { width: 50, height: 50 });
                } catch (error) {
                    console.error("Error adding product image:", error);
                }
            }

            currentY += rowHeight;
        });

        // Add totals
        currentY += 20;
        doc.font('Helvetica-Bold').fontSize(11)
           .text(`Grand Total: $${grandTotal.toFixed(2)}`, 400, currentY);

        // Add payment terms
        currentY += 40;
        doc.font('Helvetica-Bold').fontSize(11)
           .text('Payment Terms:', 30, currentY);
        doc.font('Helvetica').fontSize(10)
           .text('50% advance payment', 120, currentY)
           .text('50% balance payment against B/L copy', 30, currentY + 20);

        // Add footer
        const footerY = doc.page.height - 50;
        doc.font('Helvetica').fontSize(8)
           .text(factory.address, 30, footerY, { align: 'center' })
           .text(`Tel: ${factory.phone_number} | Email: ${factory.email}`, 30, footerY + 15, { align: 'center' });

        doc.end();

        // Send email with PDF attachment
      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
          tls: {
              rejectUnauthorized: false,  // Disable certificate verification (use cautiously)
          },
      });
      
        const mailOptions = {
            from: 'shamilamiyan@gmail.com',
            to: factory.email, // Recipient email
            subject: `${factory.name} - Quotation`,
            text: `Please find the attached quotation for ${factory.name}.`,
            attachments: [
                {
                    filename: `${factory.name.replace(/\s+/g, "_")}_quotation.pdf`,
                    content: doc
                }
            ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ message: "Error while generating the PDF" });
    }
};
