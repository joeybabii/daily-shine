# Daily Shine — Status

Last verified: 2026-10-05

## Current state

Daily Shine is the ACTIVE BUILD.

- Repository: https://github.com/joeybabii/daily-shine
- Production domain: https://daily-shine-tau.vercel.app
- Framework: Next.js 15.5.24 / React 18
- Database + Auth: Supabase
- Billing: Stripe subscriptions
- AI: Anthropic Claude
- Installable app: PWA

## Verified working

- Local hardening commit `67de2de` upgrades Next.js to 15.5.24, applies patched transitive dependencies, and produces an `npm audit` result of zero vulnerabilities.
- A clean production build succeeds with service environment variables absent; missing Stripe configuration is now handled by the API routes instead of crashing the build.
- `npm test` starts the real app with dummy service configuration and verifies checkout, portal, and entitlement routes reject unauthenticated requests and the webhook rejects an unsigned request.
- Stripe Checkout and Customer Portal return URLs use the configured app URL instead of trusting the request `Origin` header.
- Next.js viewport/theme metadata is exported through the supported API and no longer produces build warnings.
- iPhone Free-version smoke test passed: account flow, core tracking/journaling, local-mode tools, persistence, Pro pricing/credit copy, and Add to Home Screen all appeared to work in Joey's test.
- Free-local / 300-credit Pro model is deployed in the production bundle.
- Production bundle no longer contains the old 3-free-AI / unlimited-AI messaging.
- Final repaired `main` deployment is READY in Vercel.
- Production domain returned HTTP 200 after the repair deployment.
- `/api/ai` and `/api/stripe/verify` resolve as deployed API routes.
- No Vercel runtime errors were reported in the verification window.
- Repository is connected to Vercel and production deployments build from `main`.
- Latest previously deployed production build served HTTP 200 at the production domain.
- The currently deployed production build compiles and serves successfully on Vercel.
- PWA manifest, icons, and service worker are present.
- Core app UI and feature code exist for Today, Tools, Learn, Evening, and Progress.
- Supabase project `daily-shine` has been restored and is ACTIVE_HEALTHY.
- Supabase `user_data` table exists with RLS restricting rows to their authenticated owner.
- Email/password and Google auth flows are implemented.
- Local-first storage plus Supabase cloud sync is implemented.
- Stripe checkout, portal, verification, and webhook routes exist.
- Server-owned `user_entitlements` table now stores paid access.
- Server-owned `ai_usage` tracking now enforces the Pro monthly AI credit allowance.
- AI requests now require an authenticated Supabase session.
- Free accounts use local/non-API tool responses and do not call Anthropic.
- Pro accounts receive 300 AI credits per month; one successful AI response uses one credit.
- Failed AI generations refund their reserved credit.
- Missing `/api/ai` route has been restored.
- Pro URL/localStorage bypass regression has been removed.
- Pro UI price has been restored to $7.97/month.
- Required environment variables are documented in `.env.example`.

## Known broken / unverified

- Hardening commit `67de2de` is locally verified but has not yet been promoted to the production deployment; production remains on the last verified pre-hardening release.
- Live Supabase sign-up/sign-in, Google OAuth, password reset, and cloud sync still need end-to-end testing after restore.
- Live Stripe checkout cannot yet be verified through the connected Stripe app; Stripe account connectivity is currently unavailable in ChatGPT.
- Stripe product/price ID, webhook endpoint, webhook secret, and production/test mode alignment still need live verification.
- Anthropic environment configuration and a real authenticated AI response still need live verification.
- The current cloud sync uses a 2-second debounce; very recent writes can be lost if the app closes immediately after an edit.

## Launch requirements

1. Supabase auth + cloud persistence pass end-to-end tests.
2. Anthropic AI route returns real responses for an authenticated user and server-side limits work.
3. Stripe checkout -> webhook -> entitlement -> portal flow passes in a Stripe test environment.
4. Core Free-version flow has passed on iPhone Safari and as an installed PWA.
5. Any launch-blocking mobile/runtime bugs found in those tests are fixed.
6. Production billing configuration is confirmed before accepting real payments.

## Biggest blocker

End-to-end external-service verification, especially Stripe billing configuration. The Free iPhone/PWA flow is verified; paid checkout, webhook entitlement, portal, and authenticated Pro AI still need real user-path tests.

## Next three actions

1. Review and promote the verified hardening commit, then confirm the new Vercel deployment is READY and repeat the public smoke checks.
2. Verify Stripe sandbox checkout -> signed webhook -> Pro entitlement -> Customer Portal -> cancellation, including the exact $7.97/month price.
3. Test authenticated Pro AI credit accounting, then finish the remaining Supabase auth/cloud-sync edge-case tests.
