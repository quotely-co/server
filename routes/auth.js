const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
const jwt = require('jsonwebtoken');
const { registerUser, loginUser, verifyToken, verifyOTP } = require("../controllers/authController");
const User = require("../models/User");

const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI = "https://api.quotely.shop/api/auth/google/callback";

// auth for factory
router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/login", loginUser);

router.get("/google", (req, res) => {
    console.log("Google Auth Request:", req.query);

    const scope = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" ");

    const authUrl =
        "https://accounts.google.com/o/oauth2/v2/auth?" +
        querystring.stringify({
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            response_type: "code",
            scope,
            access_type: "offline",
            prompt: "consent",
        });

    res.redirect(authUrl);
});

router.get("/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
        // Exchange code for access token
        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code",
        });

        const { access_token } = tokenRes.data;

        // Get user info
        const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const user = userRes.data;
        const userData = {
            name: user.name,
            email: user.email,
            avatar: user.picture,
            isVerified: true,
            role: "customer", 
        };
        // Check if user exists
        let existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
            existingUser = await User.create(userData);
          }
    
          const token = jwt.sign(
            { id: existingUser._id, email: existingUser.email, role: "customer", },
            process.env.JWT_SECRET,
           
            { expiresIn: "7d" }
          );

          res.redirect(`https://quotely.shop/customer/login/success?token=${token}`);
    } catch (err) {
        console.error("Google OAuth error:", err);
        res.status(500).send("Auth failed");
    }
});




module.exports = router;
