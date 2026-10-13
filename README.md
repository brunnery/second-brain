# Second Brain v2

Personal PWA for **training, cardio, mobility, food and money** — one app on iPhone, iPad and laptop.
React + Vite, no backend except a single Supabase table for sync. Works offline.

## What it does

| Area | Highlights |
|---|---|
| **Today** | Today's lifting day, cardio suggestion, evening routine, calories/protein, creatine, money snapshot |
| **Train → Lifts** | Weekly plan generated from goal + phase, editable (swap / add / reorder / sets × reps), one-off day moves, weekly volume check, 6-week blocks with deload |
| **Workout logger** | Prefilled weights, double-progression hints, rest timer, PR detection |
| **Train → Cardio** | Weekly suggestions for your machines (Stairmaster, Erg, bike, air bike, incline walk, run …), "other idea" shuffle, guided interval player, logging with kcal estimates. Whatever you log replaces that day's suggestion |
| **Train → Mobility** | Back Mobility · Core & Stability · Stretching (accepted versions, unchanged) with guided player + streak |
| **Train → Exercises** | ~170 exercises (muscles, equipment, spine load, cues) + your own |
| **Food** | Calorie/macro targets from goal, 7-day plan from **your own meals** (or mix / new ideas), "cook something else" builder that sizes each ingredient to what's still open today, top-up (shake / nuts / oats) after the main meals, swap/lock/move/resize, logging, shopping list, food database + own foods, weight-trend check-in |
| **Money – shared costs** | Mark each expense Need / Want / Unnecessary; split a bill with named people — ticking "paid back" reduces the expense; "Owed" tab |
| **Money** | Expenses/income, good/neutral/bad categories with budgets + instant feedback, recurring items (auto-booked), accounts, savings goals, net worth, monthly & 12-month report |
| **More** | Goals & setup, body weight, cloud sync, calendar (.ics download or live feed), backup, reset |

## The "smart" part (rule-based, offline)

- **Goal** (bulk · lean bulk · recomp · cut · maintain) → calorie surplus/deficit, protein g/kg, fat g/kg, weekly weight-change target, cardio amount.
- **Phase** (muscle growth · strength · fitness · hybrid) → rep ranges, sets, RIR, rest, number of accessories, finishers, cardio mix.
- **Back care** (on by default, Scheuermann) → avoids high spinal-load lifts unless it is a main lift in a strength/hybrid phase; pull days always have a posture slot.
- Energy: Mifflin-St Jeor × everyday activity + planned training. Cardio kcal: Compendium of Physical Activities (2024) METs, ACSM equations for walking/running/cycling.
- Check-in: compares the 7-day-average weight trend with the goal's target and suggests ±150 kcal.

All rules live in `src/features/*/engine` and `src/features/profile/goals.js` — easy to tune.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests for all engines
npm run build    # production build into dist/
```

## Deploy

Push to `main` → Netlify builds automatically (`netlify.toml`). No environment variables needed:
the Supabase URL and anon key are in `src/config.js` (the anon key is public by design; Row Level
Security protects the data). Optional overrides: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

### One-time setup

1. **Netlify** → your site `unique-mandazi-236276` → *Site configuration → Build & deploy → Link repository* → GitHub → `brunnery/second-brain`, branch `main`. Build command and publish dir come from `netlify.toml`.
2. **Supabase** → SQL Editor → run `supabase/schema.sql` (drops the old data, creates `app_state`).
3. **Supabase → Authentication → URL Configuration**: Site URL = your Netlify URL.
4. In the app: *More → Cloud sync* → sign in on each device.
5. *(optional)* Calendar feed: Edge Functions → new function `calendar` → paste `supabase/functions/calendar/index.ts` → deploy → disable **Verify JWT** → add secret `FEED_TOKEN`. Then *More → Calendar* builds the link.

## Project structure

```
src/
  App.jsx                 shell + tab bar
  app/router.js           hash router
  config.js               Supabase + app constants
  styles/                 tokens.css (all colours) + base.css (all components)
  lib/                    storage, sync, dates, format, backup, ics, device helpers
  components/             ui primitives, charts, StepPlayer (guided timer)
  features/
    coach.js              ← the only place that combines modules (targets, cardio week, plan rebuilds, calendar snapshot)
    profile/              goals & phases, onboarding, goals sheet
    training/             data/ (exercises, splits) · engine/ (plan, progression) · screens
    cardio/               data/ (machines, workouts) · engine/ (planner, kcal) · CardioView
    routines/             evening routines (fixed) + view
    nutrition/            data/ (foods, meals) · engine/ (targets, meal planner) · screens
    body/                 weight log
    finance/              engine + screens
    home/, settings/
supabase/                 schema.sql, functions/calendar
```

Each feature owns one synced store key (`profile`, `training`, `cardio`, `routines`, `nutrition`, `body`, `finance`, `feed`).
Stores are shallow-merged with their defaults on load, so new fields can be added safely.

## Icons

`public/icon.svg` is the source. Re-render PNGs with `npx -y playwright@1 install chromium && node scripts/icons.mjs`.
