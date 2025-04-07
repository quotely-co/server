require("dotenv").config(); // Load .env before anything else
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const Factories = require("./models/Factories");

const app = express();
connectDB();

app.use(
  cors({
    origin: "*",// Allow all subdomains of localhost
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // ✅ Enable sending cookies
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

app.get("/api/check-subdomain", async (req, res) => {
  const { subdomain } = req.query;

  if (!subdomain) return res.json({ valid: false });
  
  const shop = await Factories.findOne({ username: subdomain, status: "active" });
  if (shop) {
    res.status(200).json({ valid: true });
  } else {
    res.json({ valid: false });
  }
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
