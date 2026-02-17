import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
    try {
        const { userId, email } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Check if this is a test user via environment variable
        const PRO_TEST_EMAILS = (process.env.PRO_TEST_EMAILS || '')
            .split(',')
            .map(e => e.trim().toLowerCase())
            .filter(Boolean);

        if (email && PRO_TEST_EMAILS.includes(email.toLowerCase())) {
            return NextResponse.json({ isPremium: true, stripeCustomerId: null, testUser: true });
        }

        // Verify against Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data, error } = await supabase
            .from('user_data')
            .select('data')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return NextResponse.json({ isPremium: false, stripeCustomerId: null });
        }

        const userData = data.data || {};
        const isPremium = userData['shine-premium'] === 'true' || userData['shine-premium'] === true;
        const stripeCustomerId = userData['shine-stripe-customer'] || null;

        return NextResponse.json({ isPremium, stripeCustomerId });
    } catch (err) {
        console.error('Verify error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
