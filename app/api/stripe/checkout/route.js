import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getAppOrigin, getStripeClient } from '../../../lib/serverConfig';

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function POST(request) {
  const stripe = getStripeClient(Stripe);
  if (!stripe || !process.env.STRIPE_PRICE_ID || !supabaseAdmin) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 500 });
  }

  try {
    const authorization = request.headers.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const origin = getAppOrigin();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${origin}?upgraded=true`,
      cancel_url: `${origin}?upgraded=false`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
