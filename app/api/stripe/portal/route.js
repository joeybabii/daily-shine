import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY || !supabaseAdmin) {
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
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: entitlement, error: entitlementError } = await supabaseAdmin
      .from('user_entitlements')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (entitlementError || !entitlement?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing customer found' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'https://daily-shine-tau.vercel.app';
    const session = await stripe.billingPortal.sessions.create({
      customer: entitlement.stripe_customer_id,
      return_url: origin,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Portal unavailable' }, { status: 500 });
  }
}
