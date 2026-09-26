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

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // No AI key means the client should use its built-in local fallback.
  if (!apiKey || !supabaseAdmin) {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }

  try {
    const authorization = request.headers.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) {
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) {
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    const { data: entitlement } = await supabaseAdmin
      .from('user_entitlements')
      .select('is_premium')
      .eq('user_id', user.id)
      .maybeSingle();

    const isTestUser = !!user.email && PRO_TEST_EMAILS.includes(user.email.toLowerCase());
    const isPremium = isTestUser || !!entitlement?.is_premium;

    // Free users get the local/non-API versions of Daily Shine's AI-style tools.
    if (!isPremium) {
      return NextResponse.json({
        fallback: true,
        upgradeRequired: true,
        creditsRemaining: 0,
      }, { status: 200 });
    }

    const usageDate = getMonthStart();
    // Reserve one credit atomically before calling Anthropic so parallel
    // requests cannot exceed the monthly allowance.
    const { data: usageResult, error: usageError } = await supabaseAdmin
      .rpc('consume_ai_usage', {
        p_user_id: user.id,
        p_usage_date: usageDate,
        p_limit: PRO_MONTHLY_AI_CREDITS,
      })
      .single();

    if (usageError || !usageResult) {
      console.error('AI usage consume error:', usageError);
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    if (!usageResult.allowed) {
      // consume_ai_usage increments before reporting the limit, so refund the
      // rejected reservation immediately.
      await supabaseAdmin.rpc('refund_ai_usage', {
        p_user_id: user.id,
        p_usage_date: usageDate,
      });

      return NextResponse.json({
        fallback: true,
        limitReached: true,
        creditsRemaining: 0,
        monthlyCreditLimit: PRO_MONTHLY_AI_CREDITS,
      }, { status: 200 });
    }

    const body = await request.json();
    const model = body.model || 'claude-haiku-4-5-20251001';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: Math.min(body.max_tokens || 500, 800),
        system: body.system,
        messages: body.messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      await supabaseAdmin.rpc('refund_ai_usage', {
        p_user_id: user.id,
        p_usage_date: usageDate,
      });
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    return NextResponse.json({
      ...data,
      creditsRemaining: Math.max(0, PRO_MONTHLY_AI_CREDITS - usageResult.new_count),
      monthlyCreditLimit: PRO_MONTHLY_AI_CREDITS,
    });
  } catch (error) {
    console.error('AI route error:', error);
    return NextResponse.json({ fallback: true }, { status: 200 });
  }
}
