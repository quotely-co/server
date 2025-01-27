const express = require("express");
const multer = require("multer");
const Onboarding = require("../models/Onboarding");
const router = express.Router();

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Step 1: Branding Details
router.post("/branding", upload.single("logo"), async (req, res) => {
  try {
    const { businessName, brandColor } = req.body;
    const logo = req.file ? req.file.path : null;

    const onboarding = new Onboarding({
      businessName,
      logo,
      brandColor,
    });

    await onboarding.save();
    res.status(201).json({ message: "Branding details saved", data: onboarding });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 2: Contact Information
router.put("/contact/:id", async (req, res) => {
  try {
    const { email, phone, address } = req.body;
    const onboarding = await Onboarding.findByIdAndUpdate(
      req.params.id,
      { email, phone, address },
      { new: true }
    );
    res.status(200).json({ message: "Contact information updated", data: onboarding });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 3: Admin Account Setup
router.put("/admin/:id", async (req, res) => {
  try {
    const { adminName, adminEmail, password } = req.body;
    const onboarding = await Onboarding.findByIdAndUpdate(
      req.params.id,
      { adminName, adminEmail, password },
      { new: true }
    );
    res.status(200).json({ message: "Admin account setup completed", data: onboarding });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Onboarding Data
router.get("/:id", async (req, res) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id);
    if (!onboarding) {
      return res.status(404).json({ message: "Data not found" });
    }
    res.status(200).json(onboarding);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
