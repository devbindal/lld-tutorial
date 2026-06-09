# Java LLD Tutorials — Interactive Course

An interactive, browser-based course for learning Low-Level Design in Java.
Built with React + Vite. Runs locally on `http://localhost:5173`.

## ▶️ How to run

You need **Node.js 18+** installed ([download here](https://nodejs.org)). Then, in this folder:

```bash
npm install      # first time only — downloads dependencies
npm run dev      # starts the local server and opens your browser
```

That's it. The app opens at **http://localhost:5173**. Edits you make to files
reload instantly (hot reload).

To stop the server: press `Ctrl + C` in the terminal.

To make a static build you can host anywhere:

```bash
npm run build    # output goes to /dist
npm run preview  # preview the built version
```

## 🗺️ How it's organized

- **Home page** — a grid of all concepts/days.
- **Sidebar** — always-visible navigation. Click any unlocked day.
- Each day is one file in `src/days/` (e.g. `Day1.jsx`).
- The course outline lives in `src/data/roadmap.js`.

## ➕ How to add a new day (Day 2, Day 3, ...)

1. Create `src/days/Day2.jsx` (ask Claude to generate it in this same style).
2. Open `src/App.jsx` and register it:
   ```js
   import Day2 from './days/Day2.jsx'
   const DAY_COMPONENTS = { 1: Day1, 2: Day2 }
   ```
3. Open `src/data/roadmap.js` and set that day's `ready: true`.

The sidebar, home grid, and routing update automatically.

## 🎨 Shared building blocks

`src/components/ui.jsx` gives you reusable pieces so every day looks consistent:
`<Code html="..." />`, `<C>` (inline code), `<Reveal>`, `<Note>/<Warn>/<Good>` callouts,
and `<Quiz questions={[...]} />`.

---

Current content: **Month 1 · Week 1 · Day 1 — Classes & Objects** (fully interactive).
Days 2–5 are scaffolded and marked "coming soon".
