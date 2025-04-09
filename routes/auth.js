const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
const jwt = require('jsonwebtoken');
const { registerUser, loginUser, verifyToken,verifyFactoryOTP, verifyOTP ,sendOtp, google, googleCallback, check_factory ,logout} = require("../controllers/authController");
const User = require("../models/User");

const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI = "https://api.quotely.shop/api/auth/google/callback";

// auth for factory
// router.post("/register", registerUser); // register facory is done in factory.js
router.post("/verify-otp", verifyOTP);
router.post("/factory/login", loginUser);
router.post("/check_factory", check_factory);
router.post('/send-otp' , sendOtp)
router.post("/factory/verify-otp", verifyFactoryOTP);
router.post('/logout' , logout)

// google auth and user creation
router.get("/google", google)
router.get("/google/callback", googleCallback);




module.exports = router;
