const express = require('express');
const router = express.Router();
const { createCheckoutSession, handleStripeWebhook } = require('../services/stripe.service');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Create Stripe Checkout Session
// @route   POST /api/payments/create-checkout-session
router.post('/create-checkout-session', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Please login to upgrade' });
  }

  try {
    const session = await createCheckoutSession(req.user);
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Redirect to Stripe Customer Portal
// @route   POST /api/payments/customer-portal
router.post('/customer-portal', async (req, res) => {
  if (!req.user || !req.user.stripeCustomerId) {
    return res.status(400).json({ error: 'No active subscription found' });
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
    });
    res.json({ url: portalSession.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Stripe Webhook Handler
// @route   POST /api/payments/webhook
// NOTE: This route needs raw body for signature verification. 
// Handled in index.js via separate mounting before global json() middleware.
router.post('/webhook', async (req, res) => {
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
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
