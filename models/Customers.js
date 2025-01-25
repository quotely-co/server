const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true }, 
    logo_url: { type: String }, 
    brand_color: { type: String }, 
    email: { type: String, required: true, unique: true },
    address: { type: String, required: true }, 
    phone_number: { type: String, required: true }, 
    preferences: { type: String }, 
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Customer", customerSchema);
