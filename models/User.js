const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true }, 
    password: { type: String, required: true }, 
    isVerified: { type: Boolean, default: false }, 
    otp: { type: String }, 
    otpExpiry: { type: Date }, 
    role: { type: String, required: true }, // User's role (e.g., "factory" or "customer")
    
    // Dynamic reference based on role
    factoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Factory", 
      required: function () {
        return this.role === "factory"; 
      },
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: function () {
        return this.role === "customer"; 
      },
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("User", UserSchema);
