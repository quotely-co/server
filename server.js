const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoute = require("./routes/User");
const paymentRoutes = require("./routes/Payment");
const productRoute = require("./routes/product");
const factoryroutes = require("./routes/factory");
require("dotenv").config();

const app = express();

connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoute);
app.use("/api/factory", factoryroutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/products", productRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
