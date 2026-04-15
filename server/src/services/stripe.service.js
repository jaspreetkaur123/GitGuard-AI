const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

/**
 * Create a Stripe Checkout Session for upgrading to Pro
 */
const createCheckoutSession = async (user) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'GitGuard AI Pro Plan',
              description: 'Unlimited PR reviews, priority analysis, and advanced security checks.',
            },
            unit_amount: 1900, // $19.00
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/upgrade?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user._id.toString(),
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating Stripe session:', error.message);
    throw error;
  }
};

/**
 * Handle Stripe Webhook events
 */
const handleStripeWebhook = async (event) => {
  const session = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      // Payment successful, upgrade the user
      const userId = session.metadata.userId;
      await User.findByIdAndUpdate(userId, { 
        subscriptionLevel: 'pro',
        stripeCustomerId: session.customer
      });
      console.log(`User ${userId} upgraded to Pro via Stripe.`);
      break;
    
    case 'customer.subscription.deleted':
      // Subscription cancelled
      const customerId = session.customer;
      await User.findOneAndUpdate({ stripeCustomerId: customerId }, { subscriptionLevel: 'free' });
      console.log(`Subscription cancelled for customer ${customerId}.`);
      break;

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }
};

module.exports = {
  createCheckoutSession,
  handleStripeWebhook,
};
