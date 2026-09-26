# Daily Shine — TODO

Last updated: 2026-09-25

## P0 — Launch blockers

- [x] Confirm latest `main` commit deploys successfully to Vercel.
- [x] Smoke-test production domain after deployment.
- [ ] Test email sign-up, confirmation, sign-in, sign-out, and password reset.
- [ ] Test Google OAuth redirect and return flow.
- [ ] Verify new user can create/update `user_data` and another user cannot read/write it.
- [ ] Verify cloud data persists across sign-out/sign-in and a second device/browser.
- [ ] Test authenticated `/api/ai` with Anthropic configured.
- [ ] Verify Free users stay entirely on local/non-API AI-style tools.
- [ ] Verify Pro/test users receive 300 server-counted AI credits per month.
- [ ] Verify one successful AI response deducts one credit and failed responses refund the reservation.
- [ ] Verify Pro falls back to local mode when monthly credits reach zero.
- [ ] Verify Stripe environment variables exist in Vercel.
- [ ] Verify Stripe Price is $7.97/month and matches the UI.
- [ ] Verify Stripe webhook endpoint + signing secret.
- [ ] Run Stripe test subscription: checkout -> webhook -> Pro entitlement.
- [ ] Verify subscription cancellation/update revokes or preserves access correctly.
- [ ] Verify Customer Portal only opens for the authenticated user's Stripe customer.
- [ ] Test full core flow on Joey's iPhone in Safari.
- [ ] Test Add to Home Screen / standalone PWA behavior.
- [ ] Fix any launch-blocking issues found above.

## P1 — Reliability before/at launch

- [ ] Flush pending cloud sync when the app is backgrounded/closed so the 2-second debounce cannot lose the last edit.
- [ ] Add a small automated smoke test for auth-protected API routes.
- [ ] Move Next.js `viewport` / `themeColor` to the supported viewport export.
- [ ] Confirm service-worker offline behavior on iPhone after a production update.
- [ ] Add basic production error monitoring if a free option is available.

## FUTURE / POST-LAUNCH

- [ ] Evaluate rewarded ads or another opt-in way for users to earn extra AI credits after launch; only add if economics and ad-network policy make sense.
- [ ] Consider optional paid credit top-ups only after real usage data shows they are needed.

- [ ] Split the large `DailyShine.js` file into smaller tab components.
- [ ] Prune date-keyed localStorage entries older than the retention window.
- [ ] Memoize heavy Progress/Garden calculations if performance becomes measurable.
- [ ] Centralize repeated theme constants.
- [ ] Improve modal and icon-button accessibility.
- [ ] Add additional features only after the current product is shipped and stable.
