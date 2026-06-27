import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const isStripeConfigured = Boolean(
  stripeSecretKey && stripeSecretKey.startsWith("sk_test_")
);

export const stripe = isStripeConfigured
  ? new Stripe(stripeSecretKey)
  : null;