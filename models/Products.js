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

    specifications: {
      length: { type: String, default: "" },
      width: { type: String, default: "" },
      height: { type: String, default: "" },
      capacity: { type: String, default: "" },
      materialType: { type: String, default: "" },
      gsm: { type: String, default: "" },
      colorOptions: { type: [String], default: [] },
      printingTechnique: { type: String, default: "" },
      customFinish: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

// Add a method to the schema to get the product's full name
module.exports = mongoose.model("Product", productSchema);
