const express = require("express");
const { registerUser, loginUser, verifyToken, verifyOTP } = require("../controllers/authController");

const router = express.Router();

// auth for factory
router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/login", loginUser);



module.exports = router;
