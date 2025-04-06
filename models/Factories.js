const mongoose = require("mongoose");

const factorySchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 100,
      match: /^[a-zA-Z0-9\s\-\&\,\.]+$/,
    }, // Example: "Prive Gems Pvt Ltd"
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    }, // Unique shop name or the subdomain for the factory
    // Example: "privegems"
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    }, // Email validation
    phone_number: {
      type: String,
      required: true,
      // match: /^\+?[1-9]\d{1,14}$/, // Supports international formats
    },
    address: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
    logo_url: {
      type: String,
      trim: true,
      match: /^(https?:\/\/.*\.(?:png|jpg|jpeg|svg|webp))$/, // Ensures valid image URL
    },
    brand_color: {
      type: String,
      trim: true,
      match: /^#([0-9A-F]{3}){1,2}$/i, // Validates hex color codes
    },
    productIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],
    isVerified: {
      type: Boolean,
      default: false, // Set default to false for verification control
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("Factory", factorySchema);
