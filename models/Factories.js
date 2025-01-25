const mongoose = require("mongoose");

const factorySchema = new mongoose.Schema(
  {
    factoryName: { type: String, required: true }, // Factory's display name
    logo_url: { type: String }, // URL to the factory's logo
    brand_color: { type: String }, // Hex color code for branding
    email: { type: String, required: true }, // Factory email
    phone_number: { type: String, required: true }, // Factory contact number
    address: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Reference to the User model
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Factory", factorySchema);
