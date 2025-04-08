require("dotenv").config(); // Load .env before anything else
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const Factories = require("./models/Factories");

const app = express();
connectDB();

app.use(
  cors({
    origin: ["https://www.quotely.shop", "http://localhost:5173"], // Allow only your frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // ✅ Enable sending cookies
  })
);


// ✅ Handle CORS preflight requests properly
app.options("*", (req, res) => {
  const allowedOrigins = ["https://www.quotely.shop", "http://localhost:5173"];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});



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

app.use((req, res, next) => {
  console.log("Incoming Request:", req.method, req.url);
  console.log("Origin:", req.headers.origin);
  next();
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
