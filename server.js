require("dotenv").config();  // Load .env before anything else
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Connect to MongoDB
connectDB();  // Ensure this is called after .env is loaded

// Middleware 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple Test Routes
app.get("/", (req, res) => {
  res.send("Hello, server is running!");
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/User"));
app.use("/api/factory", require("./routes/factory"));
app.use("/api/payment", require("./routes/Payment"));
app.use("/api/products", require("./routes/product"));

// Start Server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
