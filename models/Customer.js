const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true }, 
    quotations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quotation" }],
    createdAt: { type: Date, default: Date.now }
  }
);

module.exports = mongoose.model("Customer", customerSchema);
