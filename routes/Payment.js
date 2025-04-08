const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

router.options("*", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.sendStatus(200);
  });
  
// Stripe payment
router.post("/create-payment-intent", paymentController.createStripePaymentIntent);
router.post("/create-checkout-session", paymentController.createCheckoutSession);

// Razorpay payment
router.post("/create-order", paymentController.createRazorpayOrder);

// PayPal payment
router.post("/create-paypal-order", paymentController.createPayPalOrder);

module.exports = router;