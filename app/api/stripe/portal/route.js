import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { stripeCustomerId } = body;

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No customer ID' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'https://daily-shine-tau.vercel.app';

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: origin,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
