const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoute = require("./routes/User");
const paymentRoutes = require("./routes/Payment");
const productRoute = require("./routes/product");
const factoryroutes = require("./routes/factory");


const app = express();

// Connect to the database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoute);
app.use("/api/factory", factoryroutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/products", productRoute);

// Deployment setup
if (process.env.NODE_ENV === "production") {
  const path = require("path");
  app.use(express.static(path.join(__dirname, "client/build")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  );
}

// Port configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
