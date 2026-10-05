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
- The Vercel preview for the hardening branch reached READY and served the app, manifest, and service worker with HTTP 200.
- Stripe sandbox has one active `Daily Shine Pro` recurring price at exactly $7.97 USD per month.
- The Stripe sandbox webhook endpoint is enabled at the production webhook URL for checkout completion and subscription update/deletion events.
- Supabase migration `harden_user_data_privileges` is applied: anonymous access is revoked and authenticated users only receive select/insert/update privileges, still restricted to their own row by RLS.
- Supabase is ACTIVE_HEALTHY with email and Google users present; server-owned entitlement/usage tables remain inaccessible to normal client roles.
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

- Hardening commits through `bd48636` are verified on a non-production branch/preview but have not yet been promoted to production; production remains on the last verified pre-hardening release.
- Live Supabase sign-up/sign-in, Google OAuth, password reset, and cloud sync still need end-to-end testing after restore.
- Stripe Customer Portal has no sandbox configuration yet, and the sandbox product description still incorrectly says “Unlimited AI.” Correcting these sandbox billing settings requires explicit billing-change approval.
- Stripe signing-secret alignment and the full checkout -> webhook -> entitlement -> portal -> cancellation path still need an authenticated end-to-end test.
- `ANTHROPIC_API_KEY` is not present in Vercel, so real authenticated AI cannot work until a credential is added.
- Supabase has no `user_data`, `user_entitlements`, or `ai_usage` rows yet, so cross-device sync and credit accounting still lack real user-path evidence.
- Supabase leaked-password protection is unavailable on the current Free plan; enabling it would require paid-plan approval.
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

1. Approve creation of the Stripe sandbox Customer Portal configuration and correction of the stale sandbox product copy.
2. Promote the verified hardening branch, then run checkout -> signed webhook -> Pro entitlement -> Customer Portal -> cancellation.
3. Add an Anthropic key and test Pro credit accounting, then finish the remaining Supabase auth/cloud-sync edge-case tests.
