require("dotenv").config(); // Load .env before anything else
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const Factories = require("./models/Factories");

const app = express();
connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://shamil.localhost:3000/products",
  "https://quotely.shop",
  "https://www.quotely.shop",
  /\.quotely\.shop$/
];



// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps, curl, Postman)
//     if (!origin) return callback(null, true);

//     try {
//       const parsedOrigin = new URL(origin);
      
//       // Allow localhost ports (3000, 5173, etc.)
//       const isLocalhost = parsedOrigin.hostname.endsWith("localhost");

//       // Allow *.quotely.shop domains
//       const isQuotelySubdomain = /\.quotely\.shop$/.test(parsedOrigin.hostname);

//       // Allow shamil.localhost (or any subdomain of localhost)
//       const isCustomLocalSubdomain = /\.localhost$/.test(parsedOrigin.hostname);

//       if (isLocalhost || isCustomLocalSubdomain || isQuotelySubdomain) {
//         return callback(null, true);
//       }

//       callback(new Error("Not allowed by CORS"));
//     } catch (error) {
//       callback(new Error("Invalid origin"));
//     }
//   },
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// }));

app.use(cors({
  origin: true, // or use "*", but "true" works better with credentials
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


// app.options("*", cors({
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, true);
//     const isAllowed = allowedOrigins.some((allowed) =>
//       allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
//     );
//     callback(null, isAllowed ? true : new Error("Not allowed by CORS"));
//   },
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// }));

app.options("*", cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));



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
