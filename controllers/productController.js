const Product = require("../models/Products")
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      variations,
      fees,
      moq,
      increment,
      cbmRates,
      category,
      leadTime,
      unit,
      image,
    } = req.body;

    // Validate required fields
    if (!name || !moq || !category || !leadTime || !increment) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Validate variations array
    if (!Array.isArray(variations) || variations.length === 0 ||
      !variations.every(v => v.size && v.basePrice)) {
      return res.status(400).json({
        error: "At least one size variation with size and base price is required."
      });
    }

    // Validate fees array (optional but must be properly formatted if present)
    if (fees && Array.isArray(fees)) {
      const invalidFees = fees.some(fee => !fee.name || !fee.amount);
      if (invalidFees) {
        return res.status(400).json({
          error: "All fees must have both name and amount."
        });
      }
    }

    // Validate CBM rates array (optional but must be properly formatted if present)
    if (cbmRates && Array.isArray(cbmRates)) {
      const invalidCbmRates = cbmRates.some(rate => !rate.quantity || !rate.cbm);
      if (invalidCbmRates) {
        return res.status(400).json({
          error: "All CBM rates must have both quantity and CBM value."
        });
      }
    }

    const factoryId = req.user.factoryId;

    // Create and save the product
    const newProduct = new Product({
      name,
      description: description || "",
      variations,
      fees: fees || [],
      moq,
      increment,
      cbmRates: cbmRates || [],
      category,
      leadTime,
      unit: unit || "pcs",
      image: image || "",
      factoryId
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      message: "Product added successfully.",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Error saving product:", error.message);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: "Validation Error",
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ error: "Failed to save product." });
  }
};


exports.getProduct = async (req, res) => {
  try {
    let products;

    if (req.query.id) {
      products = await Product.find({factoryId:req.query.id});

      if (!products) {
        return res.status(404).json({ error: "Product not found" });
      }
    } else {
      // Fetch all products
      products = await Product.find();
    }

    // Respond with the retrieved product(s)
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: "Failed to fetch products." });
  }
};



exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    res.status(500).json({ error: "Failed to delete product." });
  }
};
