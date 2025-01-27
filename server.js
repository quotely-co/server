const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoute = require("./routes/User");
const paymentRoutes = require("./routes/Payment");
const productRoute = require("./routes/product");
const factoryroutes = require("./routes/factory");
// Port configuration
const port = process.env.PORT || 4000;

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!')
})


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




app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
