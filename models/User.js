const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    role: { type: String, required: true }, // User's role (e.g., "factory" or "customer")
    username: { type: String },

    // Dynamic reference based on role
    factoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Factory",
      required: function () {
        return this.role === "factory";
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
