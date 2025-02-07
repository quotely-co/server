const mongoose = require("mongoose");

const factorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
  // shopName: { type: String, required: true, unique: true }, 
  email: { type: String, required: true, unique: true },
  phone_number: { type: String, required: true },
  address: { type: String, required: true },
  logo_url: { type: String }, 
  brand_color: { type: String }, 
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  isVerified: { type: Boolean, default: true }, 
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model("Factory", factorySchema);
