const mongoose = require("mongoose");

const factorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
  shopName: { type: String, required: true, unique: true }, 
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }, 
  address: { type: String, required: true },
  logoUrl: { type: String }, 
  brandColor: { type: String }, 
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  role: { type: String, default: "factory" }, 
  isVerified: { type: Boolean, default: false }, 
  otp: { type: String }, 
  otpExpiry: { type: Date }, 
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model("Factory", factorySchema);
