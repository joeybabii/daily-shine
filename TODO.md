# Daily Shine — TODO

Last updated: 2026-10-06

## P0 — Launch blockers

- [x] Upgrade Next.js from vulnerable 14.2.35 to patched 15.5.24 and clear the dependency audit.
- [x] Make the production build succeed without Stripe or other service secrets present.
- [x] Stop trusting the request `Origin` header for Stripe return URLs.
- [x] Verify the hardening branch in a READY Vercel preview.
- [ ] Promote hardening commits through `bd48636` and verify the resulting Vercel production deployment.
- [x] Credit model code is deployed: Free stays local-only; Pro has 300 monthly AI credits.
- [x] Confirm latest `main` commit deploys successfully to Vercel.
- [x] Smoke-test production domain after deployment.
- [ ] Test email sign-up, confirmation, sign-in, sign-out, and password reset.
- [ ] Test Google OAuth redirect and return flow.
- [x] Set the Supabase Auth Site URL to the production domain and allow production, Vercel preview, and localhost redirect URLs.
- [ ] Verify Google OAuth and password-reset redirects return to the protected hardening preview, then sign out/revoke the exposed OAuth test session.
- [ ] Verify new user can create/update `user_data` and another user cannot read/write it.
- [ ] Verify cloud data persists across sign-out/sign-in and a second device/browser.
- [ ] Test authenticated `/api/ai` with Anthropic configured.
- [ ] Verify Free users stay entirely on local/non-API AI-style tools.
- [ ] Verify Pro/test users receive 300 server-counted AI credits per month.
- [ ] Verify one successful AI response deducts one credit and failed responses refund the reservation.
- [ ] Verify Pro falls back to local mode when monthly credits reach zero.
- [x] Verify Stripe/Supabase environment configuration passes the deployed route configuration gates.
- [x] Verify the active Stripe sandbox price is exactly $7.97/month and matches the UI.
- [x] Verify the Stripe sandbox webhook URL and core enabled events.
- [ ] Verify the deployed Stripe webhook signing secret with a signed sandbox event.
- [x] Create the Stripe sandbox Customer Portal configuration and make it the active default.
- [x] Replace the stale “Unlimited AI” Stripe product description with “300 AI credits/month.”
- [ ] Run Stripe test subscription: checkout -> webhook -> Pro entitlement.
- [ ] Verify subscription cancellation/update revokes or preserves access correctly.
- [ ] Verify Customer Portal only opens for the authenticated user's Stripe customer.
- [x] Restrict `user_data` table grants to authenticated select/insert/update and apply the migration.
- [x] Test full core Free-version flow on Joey's iPhone in Safari.
- [x] Test Add to Home Screen / standalone PWA behavior.
- [ ] Fix any launch-blocking issues found above.

## P1 — Reliability before/at launch

- [ ] Flush pending cloud sync when the app is backgrounded/closed so the 2-second debounce cannot lose the last edit.
- [x] Add a small automated smoke test for auth-protected Stripe API routes.
- [x] Move Next.js `viewport` / `themeColor` to the supported viewport export.
- [x] Correct README setup, Free/Pro pricing, and AI-credit documentation.
- [ ] Confirm service-worker offline behavior on iPhone after a production update.
- [ ] Add basic production error monitoring if a free option is available.
- [ ] Add `ANTHROPIC_API_KEY` to Vercel after Joey provides or approves the credential.

## FUTURE / POST-LAUNCH

- [ ] Evaluate rewarded ads or another opt-in way for users to earn extra AI credits after launch; only add if economics and ad-network policy make sense.
- [ ] Consider optional paid credit top-ups only after real usage data shows they are needed.
- [ ] Revisit Supabase leaked-password protection only if a paid plan is approved; it is not available on the Free plan.

- [ ] Split the large `DailyShine.js` file into smaller tab components.
- [ ] Prune date-keyed localStorage entries older than the retention window.
- [ ] Memoize heavy Progress/Garden calculations if performance becomes measurable.
- [ ] Centralize repeated theme constants.
- [ ] Improve modal and icon-button accessibility.
- [ ] Add additional features only after the current product is shipped and stable.
