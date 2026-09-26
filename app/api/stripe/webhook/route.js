import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

async function updatePremiumStatus(userId, isPremium, stripeCustomerId = null) {
  if (!supabaseAdmin || !userId) {
    console.error('Supabase admin client or user ID missing');
    return;
  }

  const payload = {
    user_id: userId,
    is_premium: isPremium,
    updated_at: new Date().toISOString(),
  };

  if (stripeCustomerId) {
    payload.stripe_customer_id = stripeCustomerId;
  }

  const { error } = await supabaseAdmin
    .from('user_entitlements')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    throw error;
  }
}

async function findUserByCustomer(stripeCustomerId) {
  if (!supabaseAdmin || !stripeCustomerId) return null;

  const { data, error } = await supabaseAdmin
    .from('user_entitlements')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  if (error) throw error;
  return data?.user_id || null;
}

async function grantFromCheckout(session) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) return;

  // Do not grant access for an unpaid delayed-payment Checkout session.
  if (session.payment_status === 'unpaid') return;

  await updatePremiumStatus(userId, true, session.customer);
}

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !supabaseAdmin) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        await grantFromCheckout(event.data.object);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = await findUserByCustomer(subscription.customer);
        if (userId) {
          const isActive = ['active', 'trialing'].includes(subscription.status);
          await updatePremiumStatus(userId, isActive, subscription.customer);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = await findUserByCustomer(subscription.customer);
        if (userId) {
          await updatePremiumStatus(userId, false, subscription.customer);
        }
        break;
      }

      case 'checkout.session.async_payment_failed':
        // No entitlement was granted, so there is nothing to revoke here.
        break;
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
