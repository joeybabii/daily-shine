# Daily Shine — Issue Fix Plan

## Branch: `claude/code-review-28fYe`

---

## Phase 1 — Critical (Security & Data Integrity)

### 1.1 Server-side AI rate limiting
**Problem:** `shine-ai-usage-YYYY-MM-DD` is stored in localStorage. Anyone can clear it to bypass the 3/day free limit.

**Fix:** Move usage tracking to the `/api/ai` route.
- Add a `user_id` field to the POST body (sent from client)
- In `api/ai/route.js`: read+increment a usage counter stored in Supabase (`ai_usage` table, keyed by `user_id + date`)
- Return `{ limitReached: true }` if non-premium user exceeds 3 calls today
- Premium status verified via Supabase row (not localStorage)
- New Supabase table: `ai_usage (user_id, date, count)`

**Files:** `app/api/ai/route.js`, `app/DailyShine.js`

---

### 1.2 Flush pending cloud sync on tab close
**Problem:** The 2-second debounce means data written just before tab close never reaches Supabase.

**Fix:** Add a `visibilitychange` event listener that immediately flushes any pending sync.
- In `storage.set()`, track whether a sync is pending
- On `visibilitychange` (document hidden), cancel the debounce timer and call `saveUserData` synchronously using `navigator.sendBeacon` (or `fetch` with `keepalive: true`)
- Apply inside the `useEffect` that sets `storage._userId` in `DailyShine.js`

**Files:** `app/DailyShine.js` (storage object + useEffect), `app/lib/cloudStorage.js` (add a `flushSync` export)

---

## Phase 2 — Reliability & Maintainability

### 2.1 localStorage cleanup for old entries
**Problem:** `getLocalData()` in `cloudStorage.js` reads 90 days × 7 keys = 630 potential localStorage reads on every sync. Old entries accumulate forever.

**Fix:** Add a `pruneOldEntries()` function that removes date-keyed entries older than 90 days.
- Run once on app init (inside the initial `useEffect` in `DailyShine.js`)
- Iterate all `localStorage` keys matching `shine-*-YYYY-MM-DD` and delete those older than 90 days

**Files:** `app/lib/cloudStorage.js` (new export), `app/DailyShine.js` (call on mount)

---

### 2.2 Split DailyShine.js into tab components
**Problem:** 3,131 lines in one file makes navigation, testing, and collaboration difficult.

**Fix:** Extract each tab into its own component file under `app/components/`.
- `TodayTab.js` — mood check-in, challenge, gratitude, affirmation, quote
- `ToolsTab.js` — box breathing, 3 wins, reframe it, compassion letter, kindness
- `LearnTab.js` — guide list + filters
- `EveningTab.js` — rating, reflection, let it go, tomorrow's intention
- `HistoryTab.js` — garden, mood chart, weekly insight, journal history
- `AccountTab.js` — profile, stats, sign out
- `DailyShine.js` keeps shared state, routing logic, and renders the active tab component

Each tab component receives its needed state + setters as props. No new abstraction layers; just a mechanical split.

**Files:** New `app/components/*.js`, updated `app/DailyShine.js`

---

### 2.3 Memoize expensive renders
**Problem:** The garden visualization and mood chart recalculate on every render triggered by any state change.

**Fix:** Wrap the two heaviest computations in `useMemo`:
- Garden plant array (depends only on `moodHistory`, `journalEntries`, `streak`)
- Mood chart data array (depends only on `moodHistory`, `moodViewRange`)

**Files:** `app/DailyShine.js` (or `HistoryTab.js` after split)

---

## Phase 3 — Polish

### 3.1 Centralize theme constants
**Problem:** Colors like `#E8976B`, `#D4764A`, `#FFF8F0`, `#4A3F35` are repeated hundreds of times across inline styles.

**Fix:** Create `app/lib/theme.js` exporting a `COLORS` and `RADII` object.
- Import in each component file
- Do a find-and-replace pass on the most common values

**Files:** New `app/lib/theme.js`, all component files

---

### 3.2 Accessibility basics
**Problem:** No `aria-label` on interactive elements; no keyboard navigation for modals.

**Fix (scoped — don't over-engineer):**
- Add `aria-label` to icon-only buttons (breathing start/stop, tab bar items, modal close)
- Add `role="dialog"` + `aria-modal="true"` to upgrade modal
- Trap focus in modal (simple `useRef`-based approach, no library)

**Files:** `app/DailyShine.js` (or per-tab components after split)

---

## Execution Order

| Step | Phase | Est. Scope |
|------|-------|------------|
| 1. Sync flush on tab close | 1.2 | Small — ~30 lines |
| 2. Server-side AI rate limit | 1.1 | Medium — new Supabase table + API route changes |
| 3. localStorage pruning | 2.1 | Small — ~20 lines |
| 4. Component split | 2.2 | Large — mechanical refactor, no logic changes |
| 5. Memoization | 2.3 | Small — 2 `useMemo` calls |
| 6. Theme constants | 3.1 | Medium — repetitive but safe |
| 7. Accessibility | 3.2 | Small — targeted aria additions |

Each step is committed independently so it can be reviewed or reverted in isolation.
