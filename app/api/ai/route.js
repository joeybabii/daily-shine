import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const FREE_AI_LIMIT = 3;
const PRO_TEST_EMAILS = (process.env.PRO_TEST_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // No AI key means the client should use its built-in local fallback.
  if (!apiKey) {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }

  if (!supabaseAdmin) {
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

    // Pro status comes only from server-owned entitlements.
    const { data: entitlement } = await supabaseAdmin
      .from('user_entitlements')
      .select('is_premium')
      .eq('user_id', user.id)
      .maybeSingle();

    const isTestUser = !!user.email && PRO_TEST_EMAILS.includes(user.email.toLowerCase());
    const isPremium = isTestUser || !!entitlement?.is_premium;

    if (!isPremium) {
      const usageDate = new Date().toISOString().slice(0, 10);
      const { data: usageResult, error: usageError } = await supabaseAdmin
        .rpc('consume_ai_usage', {
          p_user_id: user.id,
          p_usage_date: usageDate,
          p_limit: FREE_AI_LIMIT,
        })
        .single();

      if (usageError || !usageResult) {
        console.error('AI usage limit error:', usageError);
        return NextResponse.json({ fallback: true }, { status: 200 });
      }

      if (!usageResult.allowed) {
        return NextResponse.json({ limitReached: true, fallback: true }, { status: 200 });
      }
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
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('AI route error:', error);
    return NextResponse.json({ fallback: true }, { status: 200 });
  }
}
