const DEFAULT_APP_ORIGIN = 'https://daily-shine-tau.vercel.app';

export function getStripeClient(Stripe) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  return secretKey ? new Stripe(secretKey) : null;
}

export function getAppOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_ORIGIN;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return DEFAULT_APP_ORIGIN;
  }
}
