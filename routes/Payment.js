const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

// Stripe payment
router.post("/create-payment-intent", paymentController.createStripePaymentIntent);
router.post("/create-checkout-session", paymentController.createCheckoutSession);

// Razorpay payment
router.post("/create-order", paymentController.createRazorpayOrder);

// PayPal payment
router.post("/create-paypal-order", paymentController.createPayPalOrder);

module.exports = router;