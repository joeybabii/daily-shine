# Daily Shine — Decisions

Last updated: 2026-09-25

## Product / release

- Daily Shine is the current ACTIVE BUILD.
- Finish and ship the existing product before adding new features or redesigning working screens.
- Current Pro display price: **$7.97/month**.
- Free users receive **3 AI uses per day**; Pro receives unlimited AI access.
- The app remains a web/PWA release path for the current launch.

## Architecture

- GitHub repository `joeybabii/daily-shine` is the code source of truth.
- Vercel is the deployment platform.
- Supabase provides authentication and cloud data persistence.
- `user_data` remains user-owned and writable under RLS for journal/app state.
- Paid entitlement must **not** be trusted from localStorage or user-writable `user_data`.
- Paid entitlement lives in server-owned `user_entitlements`, inaccessible to normal client roles.
- AI usage enforcement lives server-side in `ai_usage`, not only in localStorage.
- AI and billing API requests must authenticate the Supabase access token and derive user identity server-side.
- Stripe webhook signature verification is mandatory and is the authority that changes paid entitlement.
- Secrets stay in environment configuration and never in source control.

## Cost

- Prefer current free tiers and existing services.
- Supabase is currently on its free plan.
- Do not enable a new paid dependency without Joey's approval.
- AI calls use Claude Haiku by default to keep inference cost low.

## Deferred

- Large component refactors, design-system cleanup, performance refactors, and new feature ideas are post-launch unless they become a verified launch blocker.
