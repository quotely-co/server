const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Factories = require("../models/Factories");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,  // Disable certificate verification (use cautiously)
    },
});


// Generate a random 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOTP = generateOTP;

// Send OTP to the user's email
const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for registration",
        text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("OTP sent to email:", email);
    } catch (error) {
        console.error("Error sending OTP:", error);
    }
};
exports.sendOTPEmail = sendOTPEmail;

// Register a new user
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;
  

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Generate OTP and send it to user's email
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Initialize user object
        let user;
        if (req.query.type === "factory") {
            user = new User({
                username,
                email,
                password: hashedPassword,
                isVerified: false,
                otp,
                otpExpiry,
                role: "Factory"
            });
        } else {
            user = new User({
                username,
                email,
                password: hashedPassword,
                isVerified: false,
                otp,
                otpExpiry,
                role: "customer"
            });
        }

        const savedUser = await user.save();
        const token = jwt.sign(
            { userId: savedUser._id, role: savedUser.role },  // Payload containing user info
            process.env.JWT_SECRET,  // Your secret key (ensure you have this in your .env file)
            { expiresIn: '1h' }  // Set expiration time (1 hour here)
        );
        // Send OTP email
        await sendOTPEmail(email, otp);
        console.log(otp);
        

        res.status(201).json({
            success: true,
            message: "OTP Sent Successfully",
            user: { username: savedUser.username, email: savedUser.email, id: savedUser._id },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


// Verify OTP
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Check if OTP matches and is within the expiry time
        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ message: "OTP expired" });
        }

        // Mark user as verified
        user.isVerified = true;
        user.otp = undefined; // Clear OTP after verification
        user.otpExpiry = undefined; // Clear OTP expiry time
        await user.save();

        // Generate a JWT token
        const token = jwt.sign({ id: user._id, }, JWT_SECRET, { expiresIn: "7d" });
        res.status(200).json({
            message: "User verified successfully",
            token,
            id: user._id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


exports.loginUser = async (req, res) => {
    const { email, password, is_customer } = req.body;

    // for customer
    if (is_customer) {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            const token = jwt.sign({ id: user._id, role: "customer" }, process.env.JWT_SECRET, {
            });

            res.status(200).json({ message: "Login successful", token });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    } else {

        // for factory
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const factoryRecord = await Factories.findOne({ user: user._id });
            if (!factoryRecord) {
                return res.status(404).json({ message: "No corresponding record in the factory database" });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            if (!user.isVerified) {
                return res.status(400).json({ message: "User not verified" });
            }

            const token = jwt.sign({ user: user._id, factoryId: factoryRecord._id, role: "factory" }, process.env.JWT_SECRET, {
            });

            res.status(200).json({ message: "Login successful", token });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }

};
