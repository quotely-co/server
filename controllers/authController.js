const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Factories = require("../models/Factories");
const Otp = require("../models/Otp");
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
    const { email, is_customer } = req.body;

    // for factory
    try {
        const user = await Factories.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.status !== "active") {
            return res.status(400).json({ message: "User not active" });
        }

        // send otp mail
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

        // Save OTP to DB
        await Otp.create({
            email: email,
            otp: otp,
            expiresAt: otpExpiry,
        });

        await sendOTPEmail(email, otp);
        console.log(otp);


        const token = jwt.sign({ user: user._id, factoryId: factoryRecord._id, role: "factory" }, process.env.JWT_SECRET, {
        });

        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


exports.google = async (req, res) => {

    try {
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
    } catch (error) {
        logger.error("Google OAuth error:", error);
        res.status(500).send("Auth failed");
    }

}

exports.googleCallback = async (req, res) => {
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
}

exports.check_factory = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required", exists: false });
        }

        const factoryRecord = await Factories.findOne({ email });

        if (!factoryRecord) {
            return res.status(404).json({ message: "Factory not found", exists: false });
        }

        if (factoryRecord.status !== "active") {
            return res.status(400).json({ message: "Factory not active", exists: false });
        }

        return res.status(200).json({
            message: "Factory found",
            exists: true,
            factoryId: factoryRecord._id
        });
    } catch (error) {
        console.error("Error in check_factory:", error);
        return res.status(500).json({ message: "Server error", exists: false });
    }
};


exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

        // Save OTP to DB
        await Otp.create({
            email: email,
            otp: otp,
            expiresAt: otpExpiry,
        });
        // Send OTP email
        await sendOTPEmail(email, otp);
        console.log(otp);
        res.status(200).json({ message: "OTP sent successfully", otp: otp });

    } catch (error) {
        console.log(error)
    }
}

exports.verifyFactoryOTP = async (req, res) => {
    const { email, userEnteredOTP } = req.body;

    try {
        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: "No OTP found for this email" });
        }
        const savedFactory = await Factories.findOne({ email });
        if (!savedFactory) {
            return res.status(400).json({ message: "Factory not found" });
        }

        // Check if OTP matches and is within the expiry time
        if (otpRecord.otp !== userEnteredOTP) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ message: "OTP expired" });
        }

        // Mark user as verified
        await Factories.findOneAndUpdate({ email }, { status: "active" }, { new: true });
        await Otp.deleteOne({ email });
        // jwt

        const token = jwt.sign(
            { factoryId: savedFactory._id, role: "factory" },
            process.env.JWT_SECRET
        );


        res.status(200).json({
            message: "User verified successfully",
            email,
            token,
            subdomain: savedFactory.username,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}