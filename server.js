require("dotenv").config(); // Load .env before anything else
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();


connectDB();

// ✅ Configure CORS properly
app.use(
  cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow credentials (cookies, auth headers)
  })
);


// ✅ Handle CORS preflight requests
app.options("*", cors());

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  res.send("Hello, server is running!");
});


app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/User"))
app.use("/api/factory", require("./routes/factory"));
app.use("/api/payment", require("./routes/Payment"));
app.use("/api/products", require("./routes/product"));


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
