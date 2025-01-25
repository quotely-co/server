const mongoose = require("mongoose");

const BrandingSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User or Client model
    required: true,
    unique: true, // Ensure each client has only one branding entry
  },
  businessName: {
    type: String,
    required: true,
  },
  logoUrl: {
    type: String,
  },
  brandColor: {
    type: String,
    required: true,
    default: "#000000", // Default color if not provided
  },
  email:{
    type:String
  },
  phone:{
    type:String
  },
  address:{
    type:String
  },
  faviconUrl: {
    type: String,
    required: false, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add a pre-save hook to update `updatedAt` before saving
BrandingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Branding", BrandingSchema);
