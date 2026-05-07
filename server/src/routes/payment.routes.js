const express = require('express');
const router = express.Router();

const {
  createCheckoutSession,
  handleStripeWebhook,
} = require('../services/stripe.service');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

//
// ========================================
// CREATE CHECKOUT SESSION
// ========================================
//
router.post('/create-checkout-session', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Please login to upgrade' });
  }

  try {
    const session = await createCheckoutSession(req.user);

    // ✅ return session ID (for redirectToCheckout)
    return res.json({ url: session.url });

  } catch (error) {
    console.error('Checkout session error:', error);
    return res.status(500).json({ error: error.message });
  }
});

//
// ========================================
// CUSTOMER PORTAL
// ========================================
//
router.post('/customer-portal', async (req, res) => {
  if (!req.user || !req.user.stripeCustomerId) {
    return res.status(400).json({ error: 'No active subscription found' });
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
    });

    return res.json({ url: portalSession.url });

  } catch (error) {
    console.error('Customer portal error:', error);
    return res.status(500).json({ error: error.message });
  }
});

//
// ========================================
// STRIPE WEBHOOK (RAW BODY REQUIRED)
// ========================================
//
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // ✅ CRITICAL
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await handleStripeWebhook(event);
      return res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

module.exports = router;