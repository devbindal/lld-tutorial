# CLAUDE.md — Build Guide for the Java LLD Tutorials App

> **Read this first, every time.** This file is the single source of truth for building new
> tutorial pages. Claude Code loads it automatically. Your job is to add new "day" pages that
> match the existing **Day 1** page exactly in structure, quality, and style. Day 1 is the gold
> standard — when in doubt, open `src/days/Day1.jsx` and copy its patterns.

---

## 0. What this project is

An interactive, browser-based course for learning **Low-Level Design (LLD) in Java**, for a
beginner working toward an advanced level over 4 months. Built with **React 18 + Vite**, runs
locally at `http://localhost:5173`. Each "day" is one self-contained, highly interactive lesson
page. The learner navigates between days from a sidebar and a home grid.

Run commands:
```bash
npm install     # first time
npm run dev     # local dev server with hot reload
npm run build   # production build (must pass before you consider a day done)
```

---

## 1. The quality bar (NON-NEGOTIABLE — apply to every day)

Every day page MUST satisfy ALL of these. This is what the learner explicitly asked for:

1. **Interactive.** At least **2–3 working interactive demos** built with real React `useState`
   — not static pictures. The learner clicks, types, toggles, and watches state change. Day 1
   has: an Object Factory (create objects, watch the heap fill), a click-to-compare access-modifier
   matrix, and a static-vs-instance demo with shared state. Every new day needs demos of equivalent
   richness, themed to that day's concept.
2. **Visual.** Use ASCII diagrams inside `<Code>` blocks (e.g. the stack/heap diagram in Day 1),
   colored callout boxes, tables, and the interactive panels themselves as the visuals. A learner
   should be able to *see* the concept, not just read it.
3. **In-depth — cover every corner.** Nothing important about the concept may be left out.
   Include the obvious teaching AND the edge cases, the "why", the gotchas, the interview trivia,
   and bonus `<Reveal>` sections for deeper points. Assume the learner wants mastery, not a summary.
4. **Very low-level / simple English.** Write like you're teaching a smart beginner who is not a
   native English speaker. Short sentences. One idea per sentence. Use a single concrete real-world
   analogy and carry it through (Day 1 uses "blueprint → house"). Every code line gets a plain-English
   comment. Avoid jargon unless you define it immediately.
5. **Examples in Java.** All code is Java. Realistic, runnable-in-spirit snippets. Heavy inline comments.
6. **A quiz** at the end (6–8 questions) with an explanation for every answer, using the shared `<Quiz>` component.
7. **A homework footer** that gives a concrete coding task and names the next day's topic.

If any of these is missing, the day is not done.

---

## 2. The full LLD roadmap (so you know where each day fits)

The course is 4 months. **Right now we are building Month 1, Week 1.** The roadmap below is the
complete plan; use it to keep terminology consistent and to reference future/past topics correctly
(e.g. Day 1 mentions "Builder pattern, Month 2" and "Singleton, Month 2 Week 5").

### MONTH 1 — OOP Mastery + SOLID + Design Fundamentals
- **Week 1 · Core OOP**
  - Day 1 — Classes & Objects: blueprint vs building, fields/methods, `new`, constructors (default/parameterized/overloaded/copy + chaining), `this`, access modifiers (private/default/protected/public), static vs instance, stack vs heap, GC, `==` vs `.equals()`, common traps. **(BUILT — gold standard)**
  - Day 2 — Encapsulation: why getters/setters exist, validation in setters, immutability, `final`, defensive copying, why public fields are bad.
  - Day 3 — Inheritance: `is-a`, `extends`, method overriding, `super` (fields, methods, constructor), constructor chaining up the hierarchy, why deep hierarchies are bad, `Object` class.
  - Day 4 — Polymorphism: compile-time (overloading) vs runtime (overriding), dynamic dispatch, how vtables work under the hood, upcasting/downcasting, `instanceof`.
  - Day 5 — Abstraction: abstract classes vs interfaces, when to use which, default & static methods in interfaces, multiple inheritance of type.
- **Week 2 · Relationships, UML & Object Modeling**: association vs aggregation vs composition; dependency; composition over inheritance; UML class & sequence diagrams; requirements → entities.
- **Week 3 · SOLID**: one principle per day (S, O, L, I, D) with refactoring exercises.
- **Week 4 · Beyond SOLID + buffer**: DRY/KISS/YAGNI, coupling & cohesion, Law of Demeter, enums, exception design, value objects.

### MONTH 2 — Design Patterns (GoF)
- **Week 5 · Creational**: Singleton, Factory Method, Abstract Factory, Builder, Prototype.
- **Week 6 · Structural**: Adapter, Decorator, Composite, Facade, Proxy, Flyweight, Bridge.
- **Week 7 · Behavioral I**: Strategy, Observer, Command, State, Template Method.
- **Week 8 · Behavioral II + buffer**: Chain of Responsibility, Iterator, Mediator, Memento, Visitor.

### MONTH 3 — Classic LLD Problems
- **Week 9**: Parking Lot, Tic-Tac-Toe, Snake & Ladder.
- **Week 10**: Elevator System, Vending Machine, Logging Framework.
- **Week 11**: BookMyShow, Splitwise, ATM.
- **Week 12 · + buffer**: LRU Cache, Notification System, Cab Booking.

### MONTH 4 — Advanced LLD
- **Week 13 · Concurrency**: threads, race conditions, locks, thread-safe Singleton, producer-consumer, optimistic vs pessimistic locking, Rate Limiter.
- **Week 14 · Advanced problems**: Chess, Food Delivery, Inventory/Amazon Locker, Pub-Sub queue.
- **Week 15 · Machine coding (timed)**: practice rounds.
- **Week 16 · Mocks + revision + buffer**.

> **Pacing note:** the learner studies ~5 days/week and may miss days for personal reasons.
> Days 6–7 of each week are buffer; the last 3 days of each month are catch-up. This is why the
> course is organized by discrete, independent days — never write a day that hard-depends on the
> learner having done the previous day on schedule. Each day stands alone.

This roadmap also lives in machine-readable form in `src/data/roadmap.js`. Keep the two in sync.

---

## 3. Project file map

```
lld-tutorials/
├─ CLAUDE.md                  ← this file
├─ README.md                  ← human run instructions
├─ package.json
├─ vite.config.js
├─ index.html
└─ src/
   ├─ main.jsx                ← React entry (don't touch)
   ├─ App.jsx                 ← hash router + day registration  ← EDIT to add a day
   ├─ index.css               ← global design system (all classes live here)
   ├─ data/
   │  └─ roadmap.js           ← course outline + `ready` flags   ← EDIT to add a day
   ├─ components/
   │  ├─ Sidebar.jsx          ← auto-built from roadmap.js (don't touch)
   │  ├─ Home.jsx             ← auto-built from roadmap.js (don't touch)
   │  └─ ui.jsx               ← SHARED building blocks (use these, don't reinvent)
   └─ days/
      ├─ Day1.jsx             ← GOLD STANDARD — copy its patterns
      └─ Day2.jsx ...         ← new days go here  ← CREATE
```

---

## 4. The shared component API (`src/components/ui.jsx`)

**Always import these and use them. Do not hand-roll your own.** From inside `src/days/DayN.jsx`:

```jsx
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../components/ui.jsx'
//                                                       ^^ note the ../ — days/ is one level down
```

| Component | Use for | Example |
|---|---|---|
| `<Code html={`...`} />` | A syntax-highlighted code/diagram block. Pass an **HTML string** built with the highlight spans (see §6). | `<Code html={\`<span class="kw">int</span> x;\`} />` |
| `<C>text</C>` | Inline code chip inside prose. | `the <C>new</C> keyword` |
| `<Reveal summary={...}>children</Reveal>` | Collapsible "click to reveal" block for bonus depth or quiz-style checks. `summary` can be a string or JSX. | bonus facts, "what is X? click to reveal" |
| `<Note>` / `<Warn>` / `<Good>` | Colored callout boxes (blue note / amber warning / green good-practice). | key rules, traps, golden habits |
| `<Quiz questions={QUESTIONS} />` | The end-of-day quiz. See data shape in §7. | one per day |

---

## 5. The design system (classes available in `index.css`)

Use these existing classes — they keep every day visually consistent. **Do not add new global CSS
unless a genuinely new interactive widget needs it**; if you must, add it to `index.css` and keep
to the token palette below.

**Design tokens (CSS vars):** `--ink` (#1B2A4A navy text), `--blue` (#2D5BFF accent),
`--paper` (#FAFAF7 bg), `--line` (#DCD9CF borders), `--amber`, `--green`, `--red`, plus code-block
colors `--kw --str --cm --num`. Fonts: `Space Grotesk` (headings), `IBM Plex Sans` (body),
`IBM Plex Mono` (code/labels).

**Layout classes you will reuse:**
- `.scrollarea` — the outer wrapper of every day page (max-width column).
- `.hero` — the blueprint-grid hero banner at the top. Inside: `.eyebrow`, `<h1>`, `<p>`, `.chips` > `.chip`.
- `section` + `.sec-label` — each numbered section. Pattern: `<section id="sN"><div className="sec-label">Section N</div><h2>...</h2>...`.
- `.panel` + `.ptitle` — the white card that wraps an interactive demo.
- `.note .warn .good` — callouts (use the components, which apply these).
- `.footer` — the homework footer.

**Interactive-demo classes (reuse for new demos where they fit):**
- `.obj` — an "object card" (navy bordered card with shadow) showing a heap object; `.oref` (blue ref line), `.ofield` (field line).
- `.heap` — the dashed heap container; `.empty` for its empty state.
- `.class-card` / `.cname` — the dashed-blue "blueprint" card.
- `.statbar` — the amber bar for showing shared/static state.
- `.matrix` (table) with `td.yes` / `td.no` — comparison tables.
- `.modbtns` — a row of toggle buttons (`.on` for the selected one).
- `button.act` (solid blue) and `button.act.ghost` (outline) — demo buttons.
- `input.txt` — text input.

Look at how Day 1 composes these before inventing anything.

---

## 6. Syntax highlighting convention (IMPORTANT)

`<Code>` receives a raw HTML string. Wrap tokens in these spans to color them:

- `<span class="kw">...</span>` → keywords/types: `public class int void new this static return if`
- `<span class="str">...</span>` → string literals: `"Red"`
- `<span class="cm">...</span>` → comments (rendered italic grey): `// like this`
- `<span class="num">...</span>` → number literals: `10`

Everything else stays plain. **Always comment code lines in plain English** — the comments are the
teacher. Use ASCII box-drawing for diagrams inside a `<Code>` block (see Day 1's stack/heap diagram).

Example:
```jsx
<Code html={`<span class="kw">public class</span> Car {
    <span class="kw">private</span> String color;   <span class="cm">// 🔒 hidden from outside</span>
    <span class="kw">public</span> Car(String color) {
        <span class="kw">this</span>.color = color; <span class="cm">// this.color = my field</span>
    }
}`} />
```

---

## 7. Anatomy of a day page (the exact Day 1 pattern to follow)

A `DayN.jsx` file is structured like this, in order:

```jsx
import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../components/ui.jsx'

/* ===== Interactive demo components (2–3 of them), each using useState ===== */
function DemoOne() { /* ...real React state, themed to the concept... */ }
function DemoTwo() { /* ... */ }

/* ===== Quiz data (6–8 questions) ===== */
const QUESTIONS = [
  { q: 'Question text?', o: ['option A', 'option B', 'option C'], a: 1, e: 'Explanation of why B is right.' },
  // a = index of correct option; e = explanation shown after answering
]

/* ===== The page ===== */
export default function DayN() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month X · Week Y · Day N</div>
        <h1>Concept Title:<br />A Memorable Subtitle</h1>
        <p>1–2 sentence motivating intro. Tell them why this matters and to click everything.</p>
        <div className="chips">{['keyword','keyword2'].map(c => <span className="chip" key={c}>{c}</span>)}</div>
      </div>

      {/* NUMBERED SECTIONS — each is <section id="sN"> with a .sec-label */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Plain-English heading</h2>
        <p>Teach with the running analogy...</p>
        <Code html={`...`} />
        <Note>key rule</Note>
        <Reveal summary="bonus: click to reveal">deeper point</Reveal>
      </section>

      {/* ...more sections. Put each interactive demo in its own "Interactive" section... */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🏭 Play: ...</h2>
        <p>Tell them what to do and what to notice.</p>
        <DemoOne />
        <Good>What you should notice: ...</Good>
      </section>

      {/* CHEAT SHEET section near the end — bulleted recap */}
      <section id="sX">
        <div className="sec-label">Section X</div>
        <h2>📋 Cheat sheet</h2>
        <ul>...</ul>
      </section>

      {/* QUIZ section */}
      <section id="sY">
        <div className="sec-label">Section Y · Test yourself</div>
        <h2>🧠 Quiz</h2>
        <p>Click an answer; explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* HOMEWORK FOOTER */}
      <div className="footer">
        <strong>Day N complete?</strong> Homework: ...concrete Java coding task...
        <br /><br />
        Next: <strong>Day N+1 — Topic</strong>: short preview.
      </div>
    </div>
  )
}
```

**Recommended section count: 8–11.** Day 1 has 11. Roughly: intro → core mechanics →
interactive demo → memory/under-the-hood → more mechanics → another interactive demo →
common traps → cheat sheet → quiz. Adapt the middle to the concept, but keep intro,
≥2 interactive sections, a "common traps/mistakes" section, a cheat sheet, a quiz, and the footer.

---

## 8. Interactive demo pattern (copy this skeleton)

Each demo is a small component with `useState`. Theme it to the day's concept. Skeleton:

```jsx
function MyDemo() {
  const [value, setValue] = useState(initial)
  return (
    <div className="panel">
      <div className="ptitle">Live demo · what it shows</div>
      {/* controls: button.act / button.ghost.act / input.txt */}
      <button className="act" onClick={() => setValue(v => /* update */)}>Do thing</button>
      {/* visual reaction to state — use .obj / .heap / .statbar / .matrix as fits */}
    </div>
  )
}
```

Good demo ideas per concept type:
- **State changes** → cards that visibly update (like Day 1's speed).
- **Comparisons** (X vs Y) → a toggle (`.modbtns`) that switches a `.matrix` table or two side-by-side `.obj` cards.
- **Shared vs per-object** → multiple `.obj` cards + one `.statbar`.
- **Sequences/lifecycles** (great for State pattern, constructors, method calls) → step buttons that advance a highlighted state.
- **Before/after refactor** (great for SOLID) → two code panels with a toggle.

Make the learner **predict then click**: tell them in the surrounding prose what to watch for.

---

## 9. JSX gotchas (these WILL bite you — they bit the first build)

1. **Import path from `days/`:** it's `'../components/ui.jsx'` (one level up). Getting this wrong fails the build.
2. **Curly braces in JSX text** must be escaped: write `static {'{'} ... {'}'}` not `static { ... }`.
   (Inside a `<Code html={`...`} />` template string, braces are fine — the issue is only in plain JSX text.)
3. **`<` and `>` in JSX text** must be escaped as `&lt;` `&gt;` (or kept inside a `<Code>` string).
   Inside `<Code html={`...`} />` template strings, raw `<=` and `<` are fine.
4. **Always give `key` props** when mapping arrays.
5. The `html` prop of `<Code>` is rendered with `dangerouslySetInnerHTML` — that's intentional and
   safe here because the content is author-written and static. Don't put user input through it.

---

## 10. How to register a new day so it goes live (3 edits)

After creating `src/days/DayN.jsx`:

**Edit 1 — `src/App.jsx`:** import it and add to the map.
```jsx
import DayN from './days/DayN.jsx'
const DAY_COMPONENTS = { 1: Day1, /* ... */ N: DayN }
```

**Edit 2 — `src/data/roadmap.js`:** find that day and set `ready: true`.

**Edit 3 — nothing else.** The sidebar, home grid, and routing update automatically from the data.

Then run `npm run build` and confirm it passes with no errors before declaring the day done.

---

## 11. Per-day build checklist (run through this before finishing)

- [ ] Hero with eyebrow (Month/Week/Day), title, subtitle, intro, chips.
- [ ] 8–11 numbered sections, each with `.sec-label` + `<h2>`.
- [ ] Running real-world analogy used consistently in simple English.
- [ ] **≥2 working interactive demos** with `useState`, each in a `.panel`, themed to the concept.
- [ ] ASCII diagram(s) where a visual helps (inside `<Code>`).
- [ ] Every code snippet is Java and every line is commented in plain English.
- [ ] Highlight spans (`kw/str/cm/num`) used in all code blocks.
- [ ] `<Note>/<Warn>/<Good>` callouts for rules, traps, golden habits.
- [ ] At least one "Common traps / mistakes" section — cover the corners.
- [ ] `<Reveal>` blocks for bonus depth (interview trivia, under-the-hood).
- [ ] Cheat-sheet section.
- [ ] `<Quiz>` with 6–8 questions, each with an explanation.
- [ ] Homework footer with a concrete Java task + preview of next day.
- [ ] Registered in `App.jsx` and `roadmap.js` (`ready: true`).
- [ ] `npm run build` passes.

---

## 12. Workflow: one day = one file = one session

The learner wants each concept easy to navigate and revisit independently. Mirror that here:
**build one day per Claude Code session, in its own file.** Each `DayN.jsx` is fully standalone, so
you never need context from other day files — only this `CLAUDE.md` and `Day1.jsx` as the template.

**Copy-paste prompt the learner can use to start any new day:**

> Read `CLAUDE.md` and use `src/days/Day1.jsx` as the gold-standard template. Build **Day N — [Concept]**
> as `src/days/DayN.jsx`, matching Day 1's structure and quality bar exactly: interactive React demos,
> ASCII visuals, simple beginner English, in-depth coverage of every corner, Java examples with
> commented lines, a cheat sheet, a quiz, and a homework footer. Then register it in `App.jsx` and set
> `ready: true` in `roadmap.js`, and confirm `npm run build` passes.

---

*Keep this file and `src/data/roadmap.js` in sync whenever the plan changes. Day 1 is the bar — never ship a day below it.*