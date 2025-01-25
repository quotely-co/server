const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    variations: [
      {
        size: { type: String, required: true },
        basePrice: { type: Number, required: true },
      },
    ],
    fees: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    moq: { type: Number, required: true },
    increment: { type: Number, required: true },
    cbmRates: [
      {
        quantity: { type: Number, required: true },
        cbm: { type: Number, required: true }, 
      },
    ],
    category: { type: String, required: true },
    leadTime: { type: Number, required: true }, 
    unit: { type: String, default: "pcs" },
    factoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Factory", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
