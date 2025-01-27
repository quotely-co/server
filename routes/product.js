const express = require("express");
const { addProduct, getProduct, deleteProduct } = require("../controllers/ProductController");
const verifyTokenMiddleware = require("../middleware/verifyTokenMiddleware");

const router = express.Router();

// Add Product 
router.post("/" ,verifyTokenMiddleware, addProduct)
router.get('/' , getProduct)
router.delete('/:id' , deleteProduct)

module.exports = router;
