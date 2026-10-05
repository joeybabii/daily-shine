# Daily Shine — Decisions

Last updated: 2026-10-05

## Product / release

- Daily Shine is the current ACTIVE BUILD.
- Finish and ship the existing product before adding new features or redesigning working screens.
- Current Pro display price: **$7.97/month**.
- Free users receive the local/non-API versions of AI-style tools, so Free usage does not incur Anthropic API cost.
- Pro receives **300 AI credits per month**; one successful AI response costs one credit.
- Failed AI generations refund the reserved credit.
- The app remains a web/PWA release path for the current launch.

## Architecture

- GitHub repository `joeybabii/daily-shine` is the code source of truth.
- Vercel is the deployment platform.
- The supported runtime baseline is Node.js 20.9 or newer.
- Use Next.js 15.5.24 with a patched PostCSS 8.5.x override for the current launch; avoid a broader Next.js 16/React migration unless it becomes necessary.
- Supabase provides authentication and cloud data persistence.
- `user_data` remains user-owned and writable under RLS for journal/app state.
- `user_data` grants only authenticated select/insert/update access; anonymous and destructive table privileges are revoked.
- Paid entitlement must **not** be trusted from localStorage or user-writable `user_data`.
- Paid entitlement lives in server-owned `user_entitlements`, inaccessible to normal client roles.
- AI usage enforcement lives server-side in `ai_usage`, not only in localStorage.
- AI and billing API requests must authenticate the Supabase access token and derive user identity server-side.
- Stripe webhook signature verification is mandatory and is the authority that changes paid entitlement.
- Stripe clients are created only inside configured requests so missing secrets fail gracefully and never break the production build.
- Stripe return URLs come from `NEXT_PUBLIC_APP_URL` (with the production domain as a fallback), never from an untrusted request header.
- Protected-route smoke tests use Node.js and the existing Next.js runtime; no separate test framework is required for the launch baseline.
- Secrets stay in environment configuration and never in source control.

## Cost

- Prefer current free tiers and existing services.
- Supabase is currently on its free plan.
- Do not upgrade Supabase solely for leaked-password protection without Joey's approval; the feature is limited to paid plans.
- Do not enable a new paid dependency without Joey's approval.
- AI calls use Claude Haiku by default to keep inference cost low.

## Deferred

- Rewarded ads / earn-extra-credit mechanics are post-launch. Do not add an ad SDK before the core subscription flow is shipped and real usage economics are known.

- Large component refactors, design-system cleanup, performance refactors, and new feature ideas are post-launch unless they become a verified launch blocker.
