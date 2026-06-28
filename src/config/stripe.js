import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

export const isStripeConfigured = Boolean(
  stripeSecretKey &&
    (stripeSecretKey.startsWith("sk_test_") ||
      stripeSecretKey.startsWith("sk_live_"))
);

export const stripe = isStripeConfigured
  ? new Stripe(stripeSecretKey)
  : null;
