const Product = require("../models/Products");
const Factory = require("../models/Factories");
const mongoose = require("mongoose");

/**
 * Add a new product
 * @route POST /api/products
 * @access Private - Factory owner only
 */
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
    const requiredFields = { name, moq, category, leadTime, increment };
    const missingFields = Object.keys(requiredFields).filter(
      field => !requiredFields[field]
    );
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        details: missingFields 
      });
    }

    // Validate variations array
    if (!Array.isArray(variations) || variations.length === 0) {
      return res.status(400).json({
        error: "At least one size variation is required"
      });
    }

    const invalidVariations = variations.filter(v => !v.size || v.basePrice === undefined);
    if (invalidVariations.length > 0) {
      return res.status(400).json({
        error: "All variations must have both size and base price"
      });
    }

    // Validate fees array (optional but must be properly formatted if present)
    if (fees && Array.isArray(fees)) {
      const invalidFees = fees.filter(fee => !fee.name || fee.amount === undefined);
      if (invalidFees.length > 0) {
        return res.status(400).json({
          error: "All fees must have both name and amount"
        });
      }
    }

    // Validate CBM rates array (optional but must be properly formatted if present)
    if (cbmRates && Array.isArray(cbmRates)) {
      const invalidCbmRates = cbmRates.filter(rate => !rate.quantity || rate.cbm === undefined);
      if (invalidCbmRates.length > 0) {
        return res.status(400).json({
          error: "All CBM rates must have both quantity and CBM value"
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
      moq: Number(moq),
      increment: Number(increment),
      cbmRates: cbmRates || [],
      category,
      leadTime: Number(leadTime),
      unit: unit || "pcs",
      image: image || "",
      factoryId
    });

    const savedProduct = await newProduct.save();

    return res.status(201).json({
      message: "Product added successfully",
      product: savedProduct
    });
  } catch (error) {
    console.error("Error saving product:", error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: "Validation Error",
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    return res.status(500).json({ 
      error: "Failed to save product", 
      message: error.message 
    });
  }
};

/**
 * Get products with optional filtering
 * @route GET /api/products
 * @access Public
 */
exports.getProduct = async (req, res) => {
  try {
    let products;
    const { id, shopname } = req.query;

    if (id) {
      // Validate MongoDB ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid factory ID format" });
      }
      
      products = await Product.find({ factoryId: id });
      
      if (!products || products.length === 0) {
        return res.status(404).json({ message: "No products found for this factory" });
      }
    } else if (shopname) {
      // Fetch products by shop name
      const factory = await Factory.findOne({ username: shopname });
      
      if (!factory) {
        return res.status(404).json({ message: "Factory not found" });
      }
      
      products = await Product.find({ factoryId: factory._id });
      
      if (products.length === 0) {
        return res.status(200).json([]);
      }
    } else {
      // Get all products with pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      products = await Product.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
        
      const total = await Product.countDocuments();
      
      return res.status(200).json({
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      });
    }

    // Respond with the retrieved product(s)
    return res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ 
      error: "Failed to fetch products", 
      message: error.message 
    });
  }
};

/**
 * Delete a product by ID
 * @route DELETE /api/products/:id
 * @access Private - Factory owner only
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID format" });
    }
    
    // Check if user has permission to delete the product
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Verify the product belongs to the user's factory
    if (product.factoryId.toString() !== req.user.factoryId.toString()) {
      return res.status(403).json({ message: "You don't have permission to delete this product" });
    }

    await Product.findByIdAndDelete(id);
    
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ 
      error: "Failed to delete product", 
      message: error.message 
    });
  }
};

/**
 * Get a single product by ID
 * @route GET /api/products/:id
 * @access Public
 */
exports.getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID format" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching single product:", error);
    return res.status(500).json({ 
      error: "Failed to fetch product", 
      message: error.message 
    });
  }
};

/**
 * Update a product
 * @route PUT /api/products/:id
 * @access Private - Factory owner only
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID format" });
    }
    
    // Check if product exists
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Verify the product belongs to the user's factory
    if (product.factoryId.toString() !== req.user.factoryId.toString()) {
      return res.status(403).json({ message: "You don't have permission to update this product" });
    }
    
    // Validate request body fields
    const updateData = { ...req.body };
    
    if (updateData.variations) {
      const invalidVariations = updateData.variations.filter(v => !v.size || v.basePrice === undefined);
      if (invalidVariations.length > 0) {
        return res.status(400).json({
          error: "All variations must have both size and base price"
        });
      }
    }
    
    if (updateData.fees) {
      const invalidFees = updateData.fees.filter(fee => !fee.name || fee.amount === undefined);
      if (invalidFees.length > 0) {
        return res.status(400).json({
          error: "All fees must have both name and amount"
        });
      }
    }
    
    if (updateData.cbmRates) {
      const invalidCbmRates = updateData.cbmRates.filter(rate => !rate.quantity || rate.cbm === undefined);
      if (invalidCbmRates.length > 0) {
        return res.status(400).json({
          error: "All CBM rates must have both quantity and CBM value"
        });
      }
    }
    
    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error("Error updating product:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: "Validation Error",
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    return res.status(500).json({ 
      error: "Failed to update product", 
      message: error.message 
    });
  }
};
