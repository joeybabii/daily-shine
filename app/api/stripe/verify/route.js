import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const PRO_MONTHLY_AI_CREDITS = 300;
const PRO_TEST_EMAILS = (process.env.PRO_TEST_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

function getMonthStart() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

async function getCreditsRemaining(userId) {
  const { data, error } = await supabaseAdmin
    .from('ai_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('usage_date', getMonthStart())
    .maybeSingle();

  if (error) throw error;
  return Math.max(0, PRO_MONTHLY_AI_CREDITS - (data?.count || 0));
}

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

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

    if (user.email && PRO_TEST_EMAILS.includes(user.email.toLowerCase())) {
      const creditsRemaining = await getCreditsRemaining(user.id);
      return NextResponse.json({
        isPremium: true,
        stripeCustomerId: null,
        testUser: true,
        aiCreditsRemaining: creditsRemaining,
        monthlyCreditLimit: PRO_MONTHLY_AI_CREDITS,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('user_entitlements')
      .select('is_premium, stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Premium verify error:', error);
      return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }

    const isPremium = !!data?.is_premium;
    const creditsRemaining = isPremium ? await getCreditsRemaining(user.id) : 0;

    return NextResponse.json({
      isPremium,
      stripeCustomerId: data?.stripe_customer_id || null,
      aiCreditsRemaining: creditsRemaining,
      monthlyCreditLimit: PRO_MONTHLY_AI_CREDITS,
    });
  } catch (err) {
    console.error('Premium verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
