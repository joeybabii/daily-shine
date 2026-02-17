import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Use service role key for webhook (bypasses RLS)
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

async function updatePremiumStatus(userId, isPremium, stripeCustomerId = null) {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not configured');
    return;
  }

  // Get existing user data
  const { data: existing } = await supabaseAdmin
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .single();

  const currentData = existing?.data || {};

  // Update premium status in the user's data blob
  const updatedData = {
    ...currentData,
    'shine-premium': isPremium,
    'shine-stripe-customer': stripeCustomerId,
  };

  await supabaseAdmin
    .from('user_data')
    .upsert({
      user_id: userId,
      data: updatedData,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });
}

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
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
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        if (userId) {
          await updatePremiumStatus(userId, true, session.customer);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const isActive = ['active', 'trialing'].includes(subscription.status);
        // Look up user by stripe customer ID
        if (supabaseAdmin) {
          const { data: users } = await supabaseAdmin
            .from('user_data')
            .select('user_id, data')
            .filter('data->>shine-stripe-customer', 'eq', subscription.customer);
          
          if (users?.[0]) {
            await updatePremiumStatus(users[0].user_id, isActive, subscription.customer);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        if (supabaseAdmin) {
          const { data: users } = await supabaseAdmin
            .from('user_data')
            .select('user_id, data')
            .filter('data->>shine-stripe-customer', 'eq', subscription.customer);
          
          if (users?.[0]) {
            await updatePremiumStatus(users[0].user_id, false, subscription.customer);
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
