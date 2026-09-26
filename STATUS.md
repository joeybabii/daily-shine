# Daily Shine — Status

Last verified: 2026-09-25

## Current state

Daily Shine is the ACTIVE BUILD.

Repository: https://github.com/joeybabii/daily-shine  
Production domain: https://daily-shine-tau.vercel.app  
Framework: Next.js 14 / React 18  
Database + Auth: Supabase  
Billing: Stripe subscriptions  
AI: Anthropic Claude  
Installable app: PWA

## Verified working

- Final repaired `main` deployment is READY in Vercel.
- Production domain returned HTTP 200 after the repair deployment.
- `/api/ai` and `/api/stripe/verify` resolve as deployed API routes.
- No Vercel runtime errors were reported in the verification window.
- Repository is connected to Vercel and production deployments build from `main`.
- Latest previously deployed production build served HTTP 200 at the production domain.
- Next.js production build compiles successfully on Vercel.
- PWA manifest, icons, and service worker are present.
- Core app UI and feature code exist for Today, Tools, Learn, Evening, and Progress.
- Supabase project `daily-shine` has been restored and is ACTIVE_HEALTHY.
- Supabase `user_data` table exists with RLS restricting rows to their authenticated owner.
- Email/password and Google auth flows are implemented.
- Local-first storage plus Supabase cloud sync is implemented.
- Stripe checkout, portal, verification, and webhook routes exist.
- Server-owned `user_entitlements` table now stores paid access.
- Server-owned `ai_usage` table plus `consume_ai_usage` function now enforce the free AI limit.
- AI requests now require an authenticated Supabase session.
- Missing `/api/ai` route has been restored.
- Pro URL/localStorage bypass regression has been removed.
- Pro UI price has been restored to $7.97/month.
- Required environment variables are documented in `.env.example`.

## Known broken / unverified

- Live Supabase sign-up/sign-in, Google OAuth, password reset, and cloud sync still need end-to-end testing after restore.
- Live Stripe checkout cannot yet be verified through the connected Stripe app; Stripe account connectivity is currently unavailable in ChatGPT.
- Stripe product/price ID, webhook endpoint, webhook secret, and production/test mode alignment still need live verification.
- Anthropic environment configuration and a real authenticated AI response still need live verification.
- iPhone Safari/PWA install and the complete core flow still need device testing.
- The current cloud sync uses a 2-second debounce; very recent writes can be lost if the app closes immediately after an edit.
- Next.js reports non-blocking metadata warnings for `themeColor` and `viewport` placement.

## Launch requirements

1. Supabase auth + cloud persistence pass end-to-end tests.
2. Anthropic AI route returns real responses for an authenticated user and server-side limits work.
3. Stripe checkout -> webhook -> entitlement -> portal flow passes in a Stripe test environment.
4. Core app flow is tested on iPhone Safari and as an installed PWA.
5. Any launch-blocking mobile/runtime bugs found in those tests are fixed.
6. Production billing configuration is confirmed before accepting real payments.

## Biggest blocker

End-to-end external-service verification, especially Stripe billing configuration. The repaired main branch is deployed and serving successfully, but auth, AI, billing, and iPhone flows still need real user-path tests.

## Next three actions

1. Test Supabase auth, cloud sync, and authenticated AI end to end.
2. Verify Stripe test checkout/webhooks/portal.
3. Run the complete iPhone Safari/PWA launch test.
