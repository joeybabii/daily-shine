import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const PRO_TEST_EMAILS = (process.env.PRO_TEST_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

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
      return NextResponse.json({ isPremium: true, stripeCustomerId: null, testUser: true });
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

    return NextResponse.json({
      isPremium: !!data?.is_premium,
      stripeCustomerId: data?.stripe_customer_id || null,
    });
  } catch (err) {
    console.error('Premium verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
