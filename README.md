# Daily Habits Tracker

A creative, calendar-synced dashboard for tracking your daily habits. Every habit gets a checkmark — check it off and it turns **green** ✅, leave it and it stays **red** ❌. Click any day on the calendar to see (or back-fill) that day's checklist, track streaks, and watch your progress build up over a 12-week heatmap.

No build step, no backend, no account — just open `index.html`.

## Features

- **Calendar view** — every day is color-coded: green (all habits done), amber (partial), red (missed), gray (future / no data yet). Click a date to open its checklist.
- **Green/red checkmarks** — tap a habit to toggle it between done (✓ green) and not done (✕ red).
- **12-week heatmap** — a GitHub-style activity heatmap of your last ~3 months.
- **Streaks & insights** — current perfect-day streak, 30-day completion rate, all-time perfect days, and a per-habit streak counter.
- **Scoring & levels** — every completed habit earns 10 points. Points accumulate into a benchmark tier — 🌱 Seedling → 🥉 Bronze → 🥈 Silver → 🥇 Gold → 💎 Platinum → 👑 Legend — shown with a progress bar and how many points to the next level.
- **Monthly goal tracking** — set a target completion % for the month (default 80%); a progress bar and status line show your actual average and whether you've hit the goal, updated live as you check things off.
- **Daily notes** — an optional free-text box per day for reflections or blockers.
- **Fully customizable habits** — add, archive, restore, or delete habits at any time from **⚙️ Manage Habits**. Archiving preserves history; deleting removes it.
- **Light / dark theme** toggle.
- **Export / Import (JSON)** — back up your data or move it to another browser/device.

## Default habits included

Chosen as a strong, well-rounded starting set based on common self-improvement goals — edit freely.

**Health & Fitness**
- 💧 Drink 4 Litres of Water
- 🚶 Morning Walk
- 🧘 Meditate 10 Minutes
- 😴 Sleep 7+ Hours

**Learning & Growth**
- 📖 Study 15 Pages
- 🛠️ Work on a New Skill
- 🤖 Learn AI
- 🔐 Learn Cybersecurity
- 💼 Interview Preparation

**Break Free**
- 🚫 Self-Control (No PMO)
- 🚭 No Smoking
- 🍷 No Alcohol

For every habit, checking it off always means "I succeeded today" — including the *Break Free* habits, where success means you stayed clean.

## Getting started

1. Open `index.html` in any modern browser (double-click it, or serve the folder with any static file server).
2. Today's date is selected by default — tap the checkmarks as you complete habits through the day.
3. Use the calendar to jump to any past day and back-fill it, or to review how a week/month went.
4. Open **⚙️ Manage Habits** to add your own (name, emoji, category), or archive/delete ones you don't need.
5. Click **⬇ Export** every so often to save a JSON backup, and **⬆ Import** to restore it (e.g. on a new device or browser).

## Data & privacy

All data is stored locally in your browser's `localStorage` — nothing is sent to a server. This means:
- Your data is private to this browser/device.
- Clearing browser data will erase it — export a backup regularly.
- To sync across multiple devices, export from one and import into the other (or host the app and layer in a backend of your choice — see below).

## Customizing further

This is intentionally a simple, dependency-free static app (`index.html` + `style.css` + `app.js`) so it's easy to extend. Ideas if you want to keep going:

- **New habit categories or icons** — edit `DEFAULT_HABITS` and `CATEGORY_ORDER` in `app.js`.
- **Numeric targets** (e.g. track litres of water instead of a simple check) — extend the habit object with a `target` field and swap the checkbox for a stepper input.
- **Reminders/notifications** — add the Notifications API or a service worker.
- **Real cross-device sync** — connect the app to a small backend (Firebase, Supabase, or your own API) and swap `localStorage` calls for network calls; the state shape (`{ habits, logs, notes, settings, startDate }`) is already backend-friendly.
- **Weekly/monthly email or chart reports** — the `logs` object (`{ "YYYY-MM-DD": { habitId: true/false } }`) has everything needed to generate charts or summaries.
- **Multiple people/profiles** — namespace the `localStorage` key per user.
- **Tune the scoring benchmark** — adjust `POINTS_PER_HABIT` or the `LEVELS` tier thresholds in `app.js` to change how fast levels are earned, or add more tiers.

The `state` object structure:

```json
{
  "habits": [
    { "id": "water", "name": "Drink 4 Litres of Water", "icon": "💧", "category": "Health & Fitness", "type": "build", "archived": false }
  ],
  "logs": {
    "2026-08-25": { "water": true, "walk": false }
  },
  "notes": {
    "2026-08-25": "Felt great after the walk."
  },
  "settings": {
    "goalPct": 80
  },
  "startDate": "2026-08-25"
}
```

`startDate` marks when you started tracking — days before it are shown as neutral (no data) instead of being unfairly counted as "missed" in your stats and goal progress.
