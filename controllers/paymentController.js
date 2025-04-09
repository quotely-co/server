const Stripe = require("stripe");
const Razorpay = require("razorpay");
const paypal = require("paypal-rest-sdk");
const dotenv = require("dotenv");
dotenv.config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // ✅ this line was the issue

// Razorpay setup
const razorpay = new Razorpay({
    key_id: "rzp_test_QfDFimO0v4f1xA",
    key_secret: "g5WRd9NIcDVJ5O3P4QsKVexe",
});

// PayPal setup
paypal.configure({
    mode: "sandbox", // Change to 'live' for production
    client_id: "your_client_id",
    client_secret: "your_client_secret",
});

// Create Payment Intent for Stripe
exports.createStripePaymentIntent = async (req, res) => {
    try {
        const { amount, currency, planId } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            metadata: { planId },
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Stripe Payment Intent Error:", error.message);
        res.status(500).json({ error: "Failed to create payment intent." });
    }
};

// Create Checkout Session for Stripe
exports.createCheckoutSession = async (req, res) => {
    try {
        const { selectedPlan } = req.body;
        const priceId = selectedPlan?.priceId;

        // Create Checkout Session - rename the result variable to 'session'
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        });
        
        res.status(200).json({ sessionId: session });
    } catch (error) {
        console.error("Stripe Checkout Session Error:", error.message);
        res.status(500).json({ error: "Failed to create checkout session." });
    }
};

// Create Order for Razorpay
exports.createRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency, planId } = req.body;

        // Attempt to create the Razorpay order
        const order = await razorpay.orders.create({
            amount,               // Amount in paise (1 INR = 100 paise)
            currency,             // Currency (e.g., INR)
            receipt: `receipt_${planId}_${Date.now()}`,  // Unique receipt ID
        });

        // Check if the order was successfully created
        if (order && order.id) {
            // Return the order details
            res.status(200).json(order);
        } else {
            // Handle case where order creation failed
            res.status(500).json({ error: "Failed to create Razorpay order." });
        }
    } catch (error) {
        // Log the error for debugging
        console.error("Razorpay Order Creation Error:", error);

        res.status(500).json({ error: "Failed to create Razorpay order." });
    }
};

// Create Order for PayPal
exports.createPayPalOrder = async (req, res) => {
    try {
        const { amount, currency, planId } = req.body;

        const createPaymentJson = {
            intent: "sale",
            payer: {
                payment_method: "paypal",
            },
            transactions: [
                {
                    amount: {
                        currency,
                        total: (amount / 100).toFixed(2),
                    },
                    description: `Subscription Plan - ${planId}`,
                },
            ],
            redirect_urls: {
                return_url: "http://localhost:3000/payment/success",
                cancel_url: "http://localhost:3000/payment/cancel",
            },
        };

        paypal.payment.create(createPaymentJson, (error, payment) => {
            if (error) {
                console.error("PayPal Order Creation Error:", error.response);
                res.status(500).json({ error: "Failed to create PayPal order." });
            } else {
                res.status(200).json({ approvalUrl: payment.links[1].href });
            }
        });
    } catch (error) {
        console.error("PayPal Order Error:", error.message);
        res.status(500).json({ error: "Failed to create PayPal order." });
    }
};