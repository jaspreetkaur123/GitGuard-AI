const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

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
              description:
                'Unlimited PR reviews, priority analysis, and advanced security checks.',
            },
            unit_amount: 1900,
            recurring: {
              interval: 'month',
            },
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
    console.error('Stripe error FULL:', error); // 👈 important
    throw error;
  }
};
module.exports = {
  createCheckoutSession,
};