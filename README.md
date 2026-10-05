# ☀️ Daily Shine — Your Positivity Companion

A beautiful, full-featured positivity web app with daily affirmations, mood tracking, gratitude journaling, AI-powered thought reframing, breathing exercises, a content library, and a visual garden that grows with your progress.

![Daily Shine](https://img.shields.io/badge/Daily_Shine-PWA-E8976B?style=for-the-badge)

## Features

### ☀️ Today
- Daily rotating affirmation
- Mood check-in with responsive feedback
- Daily micro-challenge with completion tracking
- Gratitude journal prompt
- Quote of the day

### 🧰 Tools
- **Box Breathing** — Guided 4-4-4-4 breathing exercise with animation
- **3 Wins Today** — Log your daily victories
- **🔄 Reframe It** (AI) — Type a negative thought, get a CBT-based reframe
- **💌 Self-Compassion Letter** (AI) — Get a personalized letter from your kinder self
- **Random Act of Kindness** — Generator for daily kind acts

### 📖 Learn
- 8 in-depth guides: Negative Self-Talk, Mindfulness, Gratitude, Confidence, Sleep, Boundaries, Anxiety, Self-Compassion
- Filterable by category
- Step-by-step format with actionable tips

### 🌙 Evening
- Day rating (1-10)
- Evening reflection
- "Let It Go" — release what's weighing on you
- Tomorrow's intention setting

### 🌱 Progress
- **Positivity Garden** — Visual garden that grows as you use the app
- Mood trend line chart (7/14/30 day views)
- **AI Weekly Insight** — Personalized analysis of your patterns
- Stats dashboard
- Full journal history with expandable entries

## Quick Start

```bash
# Clone the repo
git clone https://github.com/joeybabii/daily-shine.git
cd daily-shine

# Install dependencies
npm ci

# Configure the services you want to use
cp .env.example .env.local
# Keep real keys in .env.local or the deployment environment, never in Git

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel (Free)

### Option 1: One-Click Deploy
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"New Project"** → Import your repo
4. Add the environment variables listed in `.env.example`
5. Click **Deploy**

You'll get a live URL like `daily-shine.vercel.app` in ~60 seconds.

### Option 2: Vercel CLI
```bash
npm i -g vercel
vercel
# Follow the prompts
# Add your API key in the Vercel dashboard under Settings → Environment Variables
```

### Custom Domain
In Vercel dashboard → Settings → Domains → Add your domain.

## PWA (Install on Phone)

Once deployed, visit your URL on mobile:
- **iOS**: Tap Share → "Add to Home Screen"
- **Android**: Tap the install prompt or Menu → "Add to Home Screen"

The app works offline and feels like a native app.

## AI Features

Free accounts use Daily Shine's local/non-API tool responses, so Free usage does not incur Anthropic cost. Pro is **$7.97/month** and includes **300 server-counted AI credits each month**. One successful Anthropic response consumes one credit; failed generations refund the reserved credit.

AI calls are proxied through the authenticated server-side `/api/ai` route so the Anthropic key is never exposed to the browser. AI usage and paid entitlement are enforced in server-owned Supabase records. If AI is unavailable or the account cannot use a credit, the client falls back to the local response.

## Verification

```bash
# Protected Stripe-route smoke tests (uses local dummy configuration)
npm test

# Production build; succeeds even when service secrets are absent
npm run build

# Dependency security report
npm audit
```

Live Stripe, Anthropic, and Supabase flows still require their real sandbox credentials and must be verified separately before launch.

## Tech Stack

- **Next.js 15** — React framework
- **PWA** — Installable, offline-capable
- **Claude API** — AI-powered features
- **Supabase** — Authentication + cloud-synced user data
- **localStorage** — Offline/local-first cache for app data
- **Stripe** — Pro subscriptions
- **CSS-in-JS** — Zero dependencies, no build tools for styling

## License

MIT — do whatever you want with it.
