const bcrypt = require("bcryptjs");
const User = require("../models/User");

exports.allUser = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }

};

exports.Branding1 = async (req, res) => {
    try {
        const { businessName, brandColor, logo } = req.body;

        // const newBrand = new Branding({
        //   businessName,
        //   brandColor,
        //   logoUrl: logo,
        // });

        // await newBrand.save();
        res.status(200).json({ message: "Branding details saved successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error saving branding details" });
    }
};



exports.getSingleUser = async (req, res) => {
    try {
        // Validate user ID
        if (!req.user || !req.user.id) {
            return res.status(400).json({ message: "Invalid or missing user ID." });
        }

        // Find the user
        const user = await User.findById(req.user.id).select('email username')

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Send user data (email and name) as response
        res.status(200).json(user);


    } catch (error) {
        console.error("Error in getSingleUser:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

