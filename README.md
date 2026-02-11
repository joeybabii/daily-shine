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
git clone https://github.com/YOUR_USERNAME/daily-shine.git
cd daily-shine

# Install dependencies
npm install

# (Optional) Add your Anthropic API key for AI features
cp .env.example .env.local
# Edit .env.local and add your key

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel (Free)

### Option 1: One-Click Deploy
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"New Project"** → Import your repo
4. Add environment variable: `ANTHROPIC_API_KEY` = your key
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

The AI-powered features (Reframe It, Self-Compassion Letter, Weekly Insight) require an [Anthropic API key](https://console.anthropic.com/). The app works perfectly fine without one — those features will simply show a friendly message.

AI calls are proxied through a server-side API route (`/api/ai`) so your key is never exposed to the browser.

## Tech Stack

- **Next.js 14** — React framework
- **PWA** — Installable, offline-capable
- **Claude API** — AI-powered features
- **localStorage** — Persistent data (moods, journal, streaks)
- **CSS-in-JS** — Zero dependencies, no build tools for styling

## License

MIT — do whatever you want with it.
