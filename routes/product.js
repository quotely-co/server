const express = require("express");
const {
  addProduct,
  getProduct,
  deleteProduct,
  getSingleProduct, // optional: if you want to support /:id for fetching one
} = require("../controllers/productController");

const verifyTokenMiddleware = require("../middleware/verifyTokenMiddleware");

const router = express.Router();

// Add Product (POST /api/products)
router.post("/", verifyTokenMiddleware, addProduct);

// Get All Products (GET /api/products)
router.get("/", getProduct);

// Get Product by ID (GET /api/products/:id)
router.get("/:id", getSingleProduct); // Optional route for detail page

// Delete Product (DELETE /api/products/:id)
router.delete("/:id", deleteProduct);

module.exports = router;
