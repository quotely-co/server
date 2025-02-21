const mongoose = require('mongoose');

const QuotationSchema = new mongoose.Schema({
  quotationNumber: { type: String, required: true, unique: true }, // Unique Quotation ID (e.g., QTN-20240217-001)
  quotationDate: { type: Date, default: Date.now }, // Date of quotation creation
  expiryDate: { type: Date, required: true }, // Expiry date of the quotation

  // References instead of embedding details
  factory: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory', required: true }, // Reference to Factory model
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }, // Reference to Customer model

  // Products List
  products: [
    {
      productName: { type: String, required: true },
      description: { type: String },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      totalPrice: { type: Number, required: true }, // quantity * unitPrice
    }
  ],

  // Pricing Details
  subTotal: { type: Number, required: true }, // Sum of all product totalPrice
  discount: { type: Number, default: 0 }, // Discount amount
  tax: { type: Number, default: 0 }, // Tax amount (GST, VAT, etc.)
  grandTotal: { type: Number, required: true }, // Final amount after discount & tax

  // Payment Terms
  paymentMethod: { type: String, enum: ['Bank Transfer', 'UPI', 'PayPal', 'Cash'], required: true },
  paymentDueDate: { type: Date, required: true },
  advancePayment: { type: Number, default: 0 }, // Optional advance payment amount

  // Status (Pending, Accepted, Rejected)
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },

  // Notes & Terms
  notes: { type: String },
  termsAndConditions: { type: String },

  // Actions & Timestamps
  isSent: { type: Boolean, default: false }, // Whether the quotation has been emailed
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quotation', QuotationSchema);
