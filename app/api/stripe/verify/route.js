import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    : null;

// Comma-separated list of emails that get Pro for free (for testing)
const PRO_TEST_EMAILS = (process.env.PRO_TEST_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

export async function POST(request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    try {
        const { userId, email } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Test user bypass — these emails always get Pro
        if (email && PRO_TEST_EMAILS.includes(email.toLowerCase())) {
            return NextResponse.json({ isPremium: true, stripeCustomerId: null, testUser: true });
        }

        const { data, error } = await supabaseAdmin
            .from('user_data')
            .select('data')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return NextResponse.json({ isPremium: false, stripeCustomerId: null });
        }

        return NextResponse.json({
            isPremium: !!data.data?.['shine-premium'],
            stripeCustomerId: data.data?.['shine-stripe-customer'] || null,
        });
    } catch (err) {
        console.error('Premium verify error:', err);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
