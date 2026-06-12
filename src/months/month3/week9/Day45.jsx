import { useState, useEffect } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the drill timer ============ */
const PHASES = [
  { until: 5 / 45, label: 'clarify & scope', nudge: '❓ Ask 4–6 design-shaping questions. Write the assumed answers. Say what is OUT — out loud.' },
  { until: 12 / 45, label: 'entities & enums', nudge: '📦 Noun–verb pass → entity table. Closed sets become enums, open sets stay data. STOP modeling at the bell.' },
  { until: 35 / 45, label: 'code bottom-up', nudge: '⌨️ Bricks → core flow → wiring. Compile every ~8 minutes. Narrate every decision as you type.' },
  { until: 42 / 45, label: 'test & polish', nudge: '🧪 Drive the happy path end-to-end + ONE edge (the winning-final-move class of bug). Fix, don\'t gold-plate.' },
  { until: 1, label: 'self-review', nudge: '📋 Stop typing. Run the Section 7 rubric honestly. Write down your top-2 gaps.' },
]

function fmt(s) {
  const m = Math.floor(s / 60), ss = s % 60
  return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss
}

function DrillTimer() {
  const [duration, setDuration] = useState(45 * 60)
  const [left, setLeft] = useState(45 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || left === 0) return
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running, left])

  const elapsed = duration - left
  const progress = elapsed / duration
  const phaseIdx = left === 0 ? PHASES.length - 1 : PHASES.findIndex((p) => progress < p.until)
  const phase = PHASES[phaseIdx === -1 ? PHASES.length - 1 : phaseIdx]

  function preset(min) { setDuration(min * 60); setLeft(min * 60); setRunning(false) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · an actual drill clock — phases scale to whatever length you pick</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {[25, 45, 60].map((m) => (
          <button key={m} className={duration === m * 60 ? 'on' : ''} onClick={() => preset(m)}>{m} min</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 38, fontWeight: 700, color: left === 0 ? 'var(--red)' : 'var(--ink)' }}>
          {fmt(left)}
        </span>
        {!running
          ? <button className="act" onClick={() => left > 0 && setRunning(true)}>{elapsed > 0 && left > 0 ? '▶ resume' : '▶ start the drill'}</button>
          : <button className="ghost act" onClick={() => setRunning(false)}>⏸ pause</button>}
        <button className="ghost act" onClick={() => preset(duration / 60)}>reset</button>
      </div>
      <div style={{ display: 'flex', width: '100%', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 8 }}>
        {PHASES.map((p, i) => {
          const start = i === 0 ? 0 : PHASES[i - 1].until
          const w = (p.until - start) * 100
          const active = i === (phaseIdx === -1 ? PHASES.length - 1 : phaseIdx) && elapsed > 0
          const past = progress >= p.until
          return (
            <div key={i} style={{
              width: w + '%', padding: '6px 2px', textAlign: 'center',
              fontFamily: 'IBM Plex Mono', fontSize: 10.5, whiteSpace: 'nowrap', overflow: 'hidden',
              background: active ? '#FFF1D6' : past ? '#EAF7EF' : '#fff',
              borderRight: i < PHASES.length - 1 ? '1px solid var(--line)' : 'none',
              fontWeight: active ? 700 : 400,
            }}>{p.label}</div>
          )
        })}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {left === 0
          ? <span>⏰ <b>Pens down.</b> However far you got is the data. Straight to the rubric (Section 7) — the review is half the rep.</span>
          : elapsed === 0
            ? <span>Pick a track below (Section 4 or 5), pick a length, press start — and follow the bar, not your enthusiasm.</span>
            : <span style={{ fontSize: 13 }}><b>{phase.label.toUpperCase()}</b> — {phase.nudge}</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: the smell hunt ============ */
const SMELLS = [
  { code: 'class Snake extends Jumper {\n  void apply(Player p) { p.setPos(to); }\n}\nclass Ladder extends Jumper {\n  void apply(Player p) { p.setPos(to); }\n}',
    o: ['Missing a JumperFactory', 'Subclass ceremony: the two bodies are IDENTICAL — snakes and ladders differ in data, not behavior. One Jumper record + one map (Day 44)', 'Should be an interface, not classes', 'Snake should extend Ladder'], a: 1,
    why: 'When every subclass body is the same line, the hierarchy is pure ceremony. The variation (direction) is a sign bit on the data, not a type.' },
  { code: 'public int roll() {\n  return new Random().nextInt(6) + 1;\n}',
    o: ['Off-by-one error', 'Buried randomness: with new Random() inline, no test can ever assert a specific game — inject the Random (or a Dice), and ScriptedDice makes matches replayable (Days 15 & 44)', 'Random is too slow for games', 'roll() should be static'], a: 1,
    why: 'Randomness is a dependency, like time. Behind a seam it is swappable; buried, it makes every test run a different game.' },
  { code: 'if (movesPlayed == n * n) { status = DRAW; return; }\nif (checker.recordAndCheck(s, r, c)) { status = WON; }',
    o: ['The tally check is too slow', 'Draw checked before win: a winning FINAL move is declared a draw — the referee steals a victory exactly once per full board (Day 43)', 'movesPlayed should be a long', 'Missing an else branch'], a: 1,
    why: 'Order is part of correctness. The rules rank win above draw, so the win check must run first — and your test suite needs the "winning final move" case.' },
  { code: 'double fee = billedHours * 20.10;   // hourly rate',
    o: ['20.10 should be a named constant', 'double for money: 20.10 is not representable in binary — fees drift by paise until the day\'s totals stop balancing. Money with BigDecimal (Days 20 & 42)', 'Should be float for memory', 'Missing an explicit cast'], a: 1,
    why: 'The constant naming is cosmetic; the type is the crime. Binary floats cannot hold most decimal fractions — money math needs BigDecimal behind a Money value object.' },
  { code: 'public char[][] getGrid() {\n  return grid;   // for rendering\n}',
    o: ['Should return List instead of array', 'Aliasing leak: the caller now holds the REAL array and can write cells past every guard — the tallies and status silently rot. Expose at(r,c) or a copy (Days 2 & 43)', 'Arrays are slower than maps', 'Needs a null check'], a: 1,
    why: '"For rendering" is how it starts; grid[0][0]=\'X\' is how it ends. Reads via at(), writes via place() — no exceptions is what makes it a rule.' },
  { code: '// inside ExitGate:\nswitch (vehicle.type()) {\n  case CAR   -> fee = 20 * hours;\n  case BIKE  -> fee = 10 * hours;\n  case TRUCK -> fee = 40 * hours;\n}',
    o: ['Missing a default branch', 'Pricing knowledge leaked into the gate: every new rate or rule reopens this switch — inject a PricingStrategy and the gate never recompiles (Days 12 & 42)', 'Arrow syntax needs braces', 'Should iterate a list instead'], a: 1,
    why: 'The growing switch (Day 12) in a parking uniform. Weekend rates, passes, EV surcharges — each would edit the gate. The strategy interface is the door all pricing walks through.' },
]

function SmellHunt() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= SMELLS.length
  const cur = SMELLS[idx]

  function pick(i) {
    if (picked !== null) return
    setPicked(i)
    if (i === cur.a) setScore((s) => s + 1)
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · six snippets from this week's problems, each hiding one planted smell — name it</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Score: <b>{score} / {SMELLS.length}</b> — every smell here costs real points in real rounds, and every fix was one of this week's seams. Re-run until 6/6 feels boring.</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Hunt again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 10 }}>🔎 <span>snippet {idx + 1} of {SMELLS.length} · score {score}</span></div>
          <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
            {cur.code.split('\n').map((l, i) => (
              <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre', overflowX: 'auto' }}>{l}</div>
            ))}
          </div>
          <div className="modbtns">
            {cur.o.map((o, i) => (
              <button key={i} className={picked !== null && i === cur.a ? 'on' : ''}
                style={{ fontSize: 12.5, ...(picked === i && i !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}) }}
                onClick={() => pick(i)}>{o.length > 60 ? o.slice(0, 57) + '…' : o}</button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ ' : '❌ '} <b>{cur.o[cur.a]}</b><br /><br />{cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={() => { setPicked(null); setIdx((i) => i + 1) }}>Next snippet →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: the rubric scorecard ============ */
const RUBRIC = [
  { cat: 'Scope', revisit: 'Day 41', items: [
    'Asked 4–6 design-shaping questions before touching code',
    'Said what is OUT of scope, out loud',
    'Named rule variants (overshoot, chains, rounding…) instead of silently picking one',
  ]},
  { cat: 'Model', revisit: 'Days 41 & 43', items: [
    'Entities came from a noun–verb pass, filtered — not from memory of "the usual classes"',
    'Enums only for closed sets; open sets stayed data on records',
    'No god class: rules, state and I/O live in separate classes',
    'Ownership stated: what is composition (◆), what is uses-a',
  ]},
  { cat: 'Code', revisit: 'Days 42–44', items: [
    'It compiles, and the happy path runs end-to-end',
    'Guards run BEFORE any state changes; failures are loud, with context',
    'No println inside core classes — facts returned, the runner renders',
    'Time / randomness / money sit behind Clock, Dice, Money seams',
  ]},
  { cat: 'Extensibility', revisit: 'Day 42', items: [
    'Proved one follow-up = new class + one wiring line (actually did it, not claimed it)',
    'Named the seams out loud: strategy slots, observer points, the composition root',
  ]},
  { cat: 'Communication', revisit: 'Days 41 & 44', items: [
    'Narrated decisions while typing, citing the principle ("strategy here — pricing varies")',
    'Flagged concurrency / scale in one sentence each, without being asked',
  ]},
]
const TOTAL_ITEMS = RUBRIC.reduce((n, g) => n + g.items.length, 0)

function RubricScorecard() {
  const [checked, setChecked] = useState({})
  const score = Object.values(checked).filter(Boolean).length
  const toggle = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }))
  const gaps = RUBRIC.filter((g) => g.items.some((_, i) => !checked[g.cat + i]))

  let verdict, color
  if (score >= 13) { verdict = '🟢 Interview-ready. Do one more rep at 25 minutes for speed, then move to Week 10.'; color = '#EAF7EF' }
  else if (score >= 9) { verdict = '🟡 One more rep needed. Restudy ONLY the flagged days below, then drill the OTHER track at full length.'; color = '#FFF1D6' }
  else { verdict = '🔴 Rebuild first. Re-do the flagged days actively (type the code, don\'t read it), then re-drill this SAME track.'; color = '#FDECEC' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · grade your drill like an interviewer would — honestly, immediately after pens-down</div>
      {RUBRIC.map((g) => (
        <div key={g.cat} style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>
            {g.cat.toUpperCase()} <span style={{ opacity: 0.7 }}>· taught on {g.revisit}</span>
          </div>
          {g.items.map((item, i) => {
            const k = g.cat + i
            return (
              <button key={k} onClick={() => toggle(k)} style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                fontFamily: 'IBM Plex Sans', fontSize: 13.5, padding: '5px 8px', marginBottom: 3,
                border: '1px solid var(--line)', borderRadius: 6,
                background: checked[k] ? '#EAF7EF' : '#fff',
              }}>{checked[k] ? '☑' : '☐'} {item}</button>
            )
          })}
        </div>
      ))}
      <div className="statbar" style={{ display: 'block', background: score > 0 ? color : undefined }}>
        <span style={{ fontSize: 13.5 }}>
          <b>score: {score} / {TOTAL_ITEMS}</b>{score > 0 && <> — {verdict}</>}
          {score > 0 && score < TOTAL_ITEMS && gaps.length > 0 && (
            <><br />gap days to restudy: <b>{gaps.map((g) => g.cat + ' → ' + g.revisit).join(' · ')}</b></>
          )}
        </span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The drill clock starts. Minutes 0–5 are for…',
    o: ['Typing the entity classes while ideas are fresh', 'Clarifying questions + scope said out loud — including exclusions and rule variants; the questions are graded, and their answers shape everything after', 'Setting up the project and IDE', 'Drawing full UML for every class'], a: 1,
    e: 'Day 41\'s ritual is now muscle memory under a clock: the prompt is vague on purpose, and classes written before scope are classes rewritten at minute 20.',
    w: { 0: 'Entities before scope = entities for the wrong problem.',
         2: 'Project setup happens before the timer starts — that\'s part of drill discipline.',
         3: 'Full UML is a design-round artifact; machine coding wants a quick entity table, then code.' },
    r: { id: 's1', label: 'Section 1 — the protocol' } },
  { q: 'Connect Four: win = 4 in a row on a 6×7 board. Your Day 43 tally scoreboard…',
    o: ['Works exactly as-is', 'Is INVALID here — the win length (4) is SHORTER than the lines, so tallies count non-consecutive pieces; you need the directional scan: 4 directions from the landed cell, walk ≤3 steps each way, count the run', 'Just needs bigger arrays', 'Only fails on the diagonals'], a: 1,
    e: 'This is Day 43\'s gomoku warning, planted as a live trap. A row tally of 4 means "four of my pieces SOMEWHERE in the row" — not four touching. Knowing when your optimization breaks is the skill being drilled.',
    w: { 0: 'Four scattered pieces in one row would be declared a win.',
         2: 'Array size was never the issue — consecutiveness is.',
         3: 'It fails on rows and columns just as hard.' },
    r: { id: 's5', label: 'Section 5 — Track B\'s planted trap' } },
  { q: 'In the bike-rental track, the fee is computed…',
    o: ['At rent-out, stored on the ticket', 'At RETURN, by an injected PricingStrategy reading the ticket\'s immutable start time — the parking-lot shape (resource + ticket + exit-time pricing), re-skinned', 'Inside the Bike class', 'By a static PriceUtil'], a: 1,
    e: 'The transfer test: duration is unknown until return, so pricing is an exit-time strategy fed by frozen facts — exactly Day 42 wearing a helmet. Recognizing shapes across problems is what the drill measures.',
    w: { 0: 'The duration doesn\'t exist yet — Day 42\'s fee-at-entry trap, relocated.',
         2: 'Bikes are resources; they carry data, not billing policy.',
         3: 'Static utils are unswappable — weekend rates would mean editing it (Day 12).' },
    r: { id: 's4', label: 'Section 4 — Track A' } },
  { q: 'Drill rule: "compile every ~8 minutes." Which build order makes that painless?',
    o: ['Top-down from main()', 'Bottom-up: bricks first (enums, records, Board) — every layer only calls code that already exists, so the project is green at every checkpoint', 'The biggest class first, to de-risk it', 'Order doesn\'t matter with a good IDE'], a: 1,
    e: 'Day 42\'s build order is also a compile-discipline trick: bottom-up means no stubs and no forward references, so "compile every 8 minutes" costs nothing and catches typos while they\'re one minute old.',
    w: { 0: 'main() wires classes that don\'t exist yet — you\'d stub for ten minutes.',
         2: 'The biggest class depends on everything; it compiles LAST by nature.',
         3: 'The IDE finds errors; the order determines whether there\'s anything runnable to check.' },
    r: { id: 's1', label: 'Section 1 — the protocol' } },
  { q: 'You scored 10/15, all misses in Extensibility. The review loop says…',
    o: ['Move on to Week 10 — passing score', 'Restudy ONLY the flagged material (Day 42\'s seams and composition root), then re-drill the OTHER track at full length', 'Redo all of Weeks 1–9', 'Lower the rubric to 10 items'], a: 1,
    e: 'Targeted reps: the rubric exists to point at specific gap days, not to issue a grade. Re-drilling the other track checks the gap is fixed in general, not memorized for one problem.',
    w: { 0: '9–12 means the gap is real; carrying it into Week 10 compounds it.',
         2: 'Untargeted re-study is how drills turn into rereading — train the gap, not the syllabus.',
         3: 'Adjusting the measuring stick is the one move that guarantees no improvement. 🙂' },
    r: { id: 's7', label: 'Section 7 — the review loop' } },
  { q: 'Which of these clarifying questions is the clock-burner?',
    o: ['"Do electric bikes price differently?"', '"What color is the rental ticket printed in?" — zero design impact; Day 41\'s lesson at drill speed', '"One shop, or multiple branches someday?"', '"Is pricing hourly, daily, or both?"'], a: 1,
    e: 'The other three each move the design: a pricing axis (strategy), a scaling axis (registry vs singleton), a rate model. Ticket color moves nothing — and the interviewer is watching your question-quality ratio.',
    w: { 0: 'That question creates the surcharge-wrapper decision — pure design fuel.',
         2: 'That answer decides whether a composition root or a lot/shop registry is needed.',
         3: 'That answer shapes the entire PricingStrategy family.' },
    r: { id: 's4', label: 'Section 4 — Track A' } },
  { q: 'Why talk out loud even when drilling alone at your desk?',
    o: ['No reason — it\'s embarrassing', 'Narration is a separate muscle: citing the principle AS you decide ("strategy here, pricing varies") must be automatic by interview day — silent reps train silent interviews', 'To memorize a fixed script word-for-word', 'Because interviewers can\'t read code'], a: 1,
    e: 'In the real round you design, type AND explain simultaneously. If you\'ve only ever done two of the three, the third steals capacity from the others. Drills are where the combination becomes cheap.',
    w: { 0: 'Mild embarrassment now, or silence in the round that counts.',
         2: 'Not a script — a habit of attaching the WHY to each decision, in your own words.',
         3: 'They read code fine; they grade whether YOU can explain it while writing it.' },
    r: { id: 's8', label: 'Section 8 — failure modes' } },
  { q: 'public char[][] getGrid() { return grid; } — the smell, and where you learned it?',
    o: ['A performance problem', 'An aliasing leak (Days 2 & 43): the caller holds the real array and can write cells past every guard — expose at(r,c) or a defensive copy', 'A naming-convention issue', 'A missing null check'], a: 1,
    e: 'One of the six planted smells from the hunt: handing out the internal array makes every guard optional. If this one got past you in Section 6, Day 2 and Day 43\'s board section are your revisit stops.',
    w: { 0: 'Returning a reference is fast — that was never the issue.',
         2: 'Rename it anything; the leak remains.',
         3: 'grid is never null here; the danger is what callers can DO with it.' },
    r: { id: 's6', label: 'Section 6 — the smell hunt' } },
]

/* ============ The page ============ */
export default function Day45() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 9 · Day 45 · Classic LLD Problems</div>
        <h1>Week 9 Drill:<br />Dress Rehearsal, With the Clock Running</h1>
        <p>No new concepts today — that's the point. A skill you've only read about is a skill you don't have
           yet. Today you attack two FRESH problems solo, under a real timer, then grade yourself with the
           same rubric an interviewer carries in their head. One of the problems contains a trap this week
           warned you about. Click everything — then close the laptop lid and drill.</p>
        <div className="chips">
          {['timed drill', 'two fresh problems', 'self-grading rubric', 'smell hunt', 'review loop'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The drill protocol: rehearse like it counts</h2>
        <p>A drill is not study time. It is a <strong>dress rehearsal</strong>: same constraints, same
          pressure, same clock — so that on interview day, nothing is happening for the first time.</p>
        <Code html={`  THE DRILL PROTOCOL

  RULES (non-negotiable):
  · real keyboard, real project, timer VISIBLE
  · no peeking at Days 41–44 until the review phase
  · the code must COMPILE when the bell rings
  · talk out loud the whole time (yes, alone — narration is a muscle)
  · when the timer ends, pens down. Interviews don't grant extensions.

  THE 45-MINUTE SHAPE (machine-coding cut — scales to 25' and 60')
  ──────────────────────────────────────────────────────────────
   0– 5   clarify + scope out loud      ← the questions are graded
   5–12   entities + relationships + enums (a TABLE, not UML art)
  12–35   CODE bottom-up: bricks → core flow → wiring
                                        ← compile every ~8 minutes
  35–42   drive the happy path + ONE edge case
  42–45   self-review against the rubric (Section 7)`} />
        <Note><strong>Why bottom-up survives the clock (Day 42's order, now a survival skill):</strong> enums
          and records compile alone, so the project is green at every checkpoint. The candidate who codes
          top-down meets ALL their typos at minute 40, at once, in a file that imports everything.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The week in one map — what the drill actually tests</h2>
        <p>Four days, ten transferable skills. The drill problems below are new on the surface and 100% made
          of this table underneath:</p>
        <table className="matrix">
          <thead>
            <tr><th>skill</th><th>born on</th><th>drill checkpoint</th></tr>
          </thead>
          <tbody>
            <tr><td>clarify &amp; scope ritual</td><td>Day 41</td><td>4–6 questions; exclusions said out loud</td></tr>
            <tr><td>noun–verb entity pass</td><td>Day 41</td><td>entity table exists before any class file</td></tr>
            <tr><td>enum for closed sets, data for open</td><td>Days 43 · 19</td><td>Status enum; types/symbols as data</td></tr>
            <tr><td>bottom-up build order</td><td>Day 42</td><td>bricks compile before the core exists</td></tr>
            <tr><td>exit-time pricing via Strategy</td><td>Day 42</td><td>fee computed at return, behind one interface</td></tr>
            <tr><td>guards before state, fail fast</td><td>Days 42–43</td><td>exceptions with context; no half-applied moves</td></tr>
            <tr><td>counters over scans (when valid!)</td><td>Day 43</td><td>movesPlayed draw; tallies ONLY when K == N</td></tr>
            <tr><td>the game-loop skeleton</td><td>Day 44</td><td>the two swap slots named out loud</td></tr>
            <tr><td>injected Clock / Dice / Random</td><td>Days 42 · 44</td><td>a deterministic test is POSSIBLE</td></tr>
            <tr><td>facts out, not printouts</td><td>Day 44</td><td>core returns records; the runner renders</td></tr>
          </tbody>
        </table>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>⏱ The drill clock</h2>
        <p>Use this for the real thing. The phase bar scales to the length you pick — 45' for the full
          rehearsal, 25' for speed reps once you're scoring green:</p>
        <DrillTimer />
        <Good><strong>How to use it:</strong> read a track below, write your clarifying questions FIRST, then
          press start and open that track's "interviewer's answers" reveal. The nudge line tells you what
          phase you should be in — if you're still modeling when it says "code bottom-up", that's the drill
          teaching you something.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Track A · "Design a bike rental shop." (the resource-shaped rep)</h2>
        <p>That's the whole prompt — eleven words, vague on purpose, exactly like Day 41's. Write your 4–6
          clarifying questions on paper <em>before</em> opening the answers. Then drill.</p>
        <Warn><strong>Do not open the reveals until your questions are written.</strong> Reading the answers
          first turns a rep into a rerun — the clarifying muscle is the one this track exists to train.</Warn>
        <Reveal summary="🔒 The interviewer's answers — open AFTER writing your questions">
          <p><strong>Bike types?</strong> City, mountain, electric — counts of each in inventory.
            <br /><strong>Renting?</strong> Customer asks for a TYPE, gets a specific bike + a ticket; fee is
            settled at return.
            <br /><strong>Pricing?</strong> Hourly, per type. Electric bikes add a per-hour battery surcharge.
            "Day passes maybe next season."
            <br /><strong>Multiple branches?</strong> One shop today — "but we're opening two more next year."
            <br /><strong>Out of scope:</strong> reservations, damage claims, payments (assume success).
            <br /><strong>Sneaky follow-up at minute 40:</strong> "weekend rates are 1.5× — show me the diff."</p>
        </Reveal>
        <Reveal summary="🔒 Model-answer skeleton — open ONLY during the review phase">
          <Code html={`  TRACK A — the shape you hopefully drew (it is Day 42 wearing a helmet)

  enum BikeType { CITY, MOUNTAIN, ELECTRIC }          ← closed set → enum
  record Bike(String id, BikeType type)               ← resource, immutable identity
  record RentalTicket(String id, Bike bike, Instant start)   ← frozen facts (Day 20)

  interface PricingStrategy { Money price(RentalTicket t, Instant returnTime); }
      HourlyRate(EnumMap rates) · ElectricSurcharge(base)    ← the Day 42 family, re-skinned
      WeekendAwarePricing(base)                              ← the minute-40 diff: ONE new file

  class RentalShop {
      Map<BikeType, Deque<Bike>> available;     ← free-list per type — Day 41's
      Map<String, RentalTicket> open;              "10,000 spots" answer, reused!
      Clock clock;                              ← injected (deterministic fee tests)
      RentalTicket rentOut(BikeType wanted)     ← poll free list · guard empty · stamp time
      Receipt takeBack(String ticketId)         ← find(throws) → price → close → bike
  }                                                back to the free list. Idempotent: closed
                                                   ticket throws on a second return.
  main() = composition root: shop + pricing wired; every swap is one line.

  SELF-CHECK: if your version computed the fee at rent-out, priced inside the
  shop with a switch, or used getInstance() — those are Days 42, 12 and 21
  calling. The shape (resource + ticket + exit-time pricing) is the lesson.`} />
        </Reveal>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Track B · "Design Connect Four." (the game-shaped rep — with a planted trap)</h2>
        <p>Same discipline: questions on paper first. This one looks like Day 43 with gravity — and somewhere
          inside it, something you learned this week quietly stops working. Find it <em>during</em> the drill,
          not after.</p>
        <Reveal summary="🔒 The interviewer's answers — open AFTER writing your questions">
          <p><strong>Board?</strong> 6 rows × 7 columns, classic.
            <br /><strong>Players?</strong> Two — "but don't weld 2 into the types."
            <br /><strong>Moves?</strong> A player chooses a COLUMN; the piece falls to the lowest empty cell
            (gravity decides the row — the player doesn't).
            <br /><strong>Win?</strong> Four in a row: horizontal, vertical, either diagonal.
            <br /><strong>Draw?</strong> Board full. <strong>Full column?</strong> Illegal move — guard it.
            <br /><strong>Sneaky follow-up at minute 40:</strong> "add undo."</p>
        </Reveal>
        <Reveal summary="🔒 Model-answer skeleton + THE TRAP — open ONLY during the review phase">
          <Code html={`  TRACK B — the skeleton, and the landmine

  class Board {
      int drop(int col, char sym)    ← gravity: find lowest EMPTY row in col,
                                       place, RETURN the row (caller needs it!)
                                       guard: ColumnFullException
  }
  class Game {                       ← Day 44's loop, slot ① = "choose a column"
      move(player, col): ① game over? ② col in range? ③ your turn?
                         → row = board.drop(col, sym)
                         → win check from (row, col) → draw → rotate queue
  }

  ⚠ THE TRAP: win length K = 4, but rows are 7 and columns are 6 wide → K < N.
  Day 43's tally scoreboard is INVALID here — a row tally of 4 means four
  pieces SOMEWHERE in the row, not four TOUCHING. If your drill used tallies,
  the gomoku warning just collected its fee.
  The correct check: from the landed cell, walk 4 directions (—, |, \\, /)
  up to 3 steps each way, counting the consecutive run. O(K) per move.

  UNDO (the minute-40 diff): a stack of (col, row); pop → clear cell →
  movesPlayed-- → rotate queue backward → status = IN_PROGRESS (Days 33 & 43).`} />
        </Reveal>
        <Note><strong>Why two tracks:</strong> Track A tests whether the parking-lot <em>shape</em> transferred
          (resources, tickets, exit-time pricing). Track B tests whether the game <em>skeleton</em> transferred
          — AND whether you remember the fine print on your own optimizations. Different muscles; drill
          both.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔎 Play: the smell hunt</h2>
        <p>Warm up your reviewer's eye before grading yourself. Six snippets from this week's problems, one
          planted smell each:</p>
        <SmellHunt />
        <Good><strong>What you should notice:</strong> ① Every smell is a SEAM that's missing — the fix is
          never "be more careful", it's an interface, a record, or a constructor guard. ② You will see these
          exact six in other people's code reviews for the rest of your career. ③ The reviewer's eye you just
          used on strangers' code is the one Section 7 asks you to point at your own.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>📋 The rubric: grade yourself like an interviewer</h2>
        <p>Immediately after pens-down — while the memory is honest — check off only what you ACTUALLY did,
          not what you knew you should do:</p>
        <RubricScorecard />
        <Code html={`  THE REVIEW LOOP — the rep isn't over at pens-down

  drill (45') ──▶ rubric score ──▶ write your TOP-2 gaps
                                          │
       ▲                                  ▼
       └── re-drill (other track) ◀── restudy ONLY the gap days (actively:
            25' once you're green        type the code, don't reread the page)

  One honest loop beats five untimed, ungraded "practice sessions".
  The drill finds the gap; the review names it; the targeted rep closes it.`} />
        <Warn><strong>The rubric only works if it hurts a little.</strong> "I would have asked about scope"
          is unchecked. "I mentioned the race condition in my head" is unchecked. The checkbox standard is:
          an interviewer watching the recording would have seen/heard it.</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>🕳 Drill failure modes — how good reps go bad</h2>
        <Warn><strong>The blank-page freeze.</strong> Cure is mechanical, not motivational: write the noun
          list. Nouns → entity table → enums → first record file. By the third noun you're moving. The script
          exists precisely so minute 1 never requires inspiration.</Warn>
        <Warn><strong>Gold-plating the model.</strong> Twenty minutes on the entity diagram is a design round
          habit in a machine-coding drill. The bell at minute 12 is a hard cutover: a good-enough model in
          code beats a perfect model on paper, every time the clock is real.</Warn>
        <Warn><strong>Silent coding.</strong> If the rep is silent, the narration muscle stays untrained, and
          in the real round talking will STEAL capacity from thinking. Feel silly at your desk now, or go
          quiet at minute 25 in the round that counts.</Warn>
        <Warn><strong>Compiling once, at the end.</strong> Forty minutes of typing meets all its typos at
          once, in the wiring file. Bottom-up + compile-every-8-minutes means errors arrive one at a time,
          one minute old, in a file you just touched.</Warn>
        <Warn><strong>"Just five more minutes."</strong> The timer IS the constraint being trained. Extending
          it converts a rehearsal into a leisurely refactor — pleasant, and useless as practice. Pens down,
          rubric out, gaps written.</Warn>
        <Warn><strong>The rep without the review.</strong> An ungraded drill mostly trains your existing
          habits — including the bad ones, now faster. The 10 minutes with the rubric is where the
          improvement actually lives.</Warn>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>📋 Cheat sheet — the pocket script (carry this into every round)</h2>
        <ul>
          <li><strong>Phases:</strong> 5' clarify (questions + exclusions + variants) → 7' entity table + enums → 23' code bottom-up, compiling every 8' → 7' happy path + one edge → 3' review. Scale, don't skip.</li>
          <li><strong>First file = the easiest brick:</strong> an enum. It compiles, it pins the model, it breaks the blank page.</li>
          <li><strong>Standing decisions (defaults until a reason appears):</strong> closed set → enum · open set → record data · varying algorithm → injected strategy · time/randomness → Clock/Dice seams · money → Money · facts out, runner renders.</li>
          <li><strong>Guards before state, win before draw, validate config at construction</strong> — the three orderings this week kept paying for.</li>
          <li><strong>Counters over scans</strong> — and say the fine print: tallies only when K == N; otherwise directional scan from the last move.</li>
          <li><strong>One sentence each, unprompted:</strong> the concurrency flag, the scale answer (free lists per type), the seams the follow-ups will land in.</li>
          <li><strong>The review loop:</strong> drill → rubric → top-2 gaps → restudy those days actively → re-drill the other track. Green twice = move on.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 Machine-coding round logistics — asked in every prep chat</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Can I use my IDE, autocomplete, and Google in the real round?"'>
          <p>Usually your own machine and IDE: yes — autocomplete and quick doc lookups are normal.
            AI assistants and copy-paste from the internet: almost always no, and increasingly checked. The
            drill rule that follows: practice in EXACTLY the conditions you'll face, ask the recruiter what's
            allowed beforehand, and never let a drill depend on a tool the round will take away.</p>
        </Reveal>
        <Reveal summary='Q: "Do I need unit tests in a 45-minute round?"'>
          <p>A <C>main()</C> that drives the happy path end-to-end is the expected minimum — it proves the
            code RUNS, which beats any claimed test coverage. One or two real JUnit tests (the winning-final-move
            case; a deterministic ScriptedDice match) is a visible level-up, and your seams made them cheap.
            Full TDD in 45 minutes is a pacing mistake dressed as virtue.</p>
        </Reveal>
        <Reveal summary='Q: "Working-but-ugly versus beautiful-but-unfinished — which loses less?"'>
          <p>Working thin slice wins, decisively — WITH the caveat that "ugly" must mean unpolished, not
            unprincipled: a god class is not a time-saving measure, it's a finding. The strongest position at
            the bell: core flow runs end-to-end, seams named out loud, and a one-sentence map of what you'd
            do with thirty more minutes.</p>
        </Reveal>
        <Reveal summary='Q: "What if the interviewer changes a requirement at minute 30?"'>
          <p>Celebrate, quietly — that\'s the OCP exam arriving on schedule, and you planted seams for it.
            Say where it lands BEFORE coding it ("new strategy + one wiring line"), then do exactly that. If
            it does NOT land cleanly, name the missing seam and the refactor you'd make — visible self-awareness
            outscores a silent scramble.</p>
        </Reveal>
        <Reveal summary='Q: "How is a machine-coding round graded differently from a design round?"'>
          <p>Design rounds (parking lot, Day 41) weight the conversation: scope, trade-offs, diagrams,
            decision narration. Machine coding weights the artifact: does it run, is it modeled cleanly, do
            the guards hold, can it absorb one change. Same skills, different mix — which is why this week
            drilled both shapes, and why the rubric has both code and communication rows.</p>
        </Reveal>
        <Reveal summary='Q: "How many practice problems before I&apos;m ready?"'>
          <p>Fewer, deeper: each classic drilled twice with honest reviews beats ten problems skimmed.
            The shapes repeat — resource+ticket (parking, bikes, lockers), turn-based game (TTT, Connect
            Four, chess), state machine (vending, elevator — next week). Once you see a new prompt and think
            "shape #2, with one twist", you're ready. The rubric going green twice in a row is the
            measurable version.</p>
        </Reveal>
        <Reveal summary='Q: "What if I genuinely don&apos;t know a domain (never seen an elevator algorithm)?"'>
          <p>Domains are not the test — modeling is. Say so: "I haven't designed this domain; here's how I'd
            decompose it", then run the script (questions → nouns → entities → seams). Interviewers regularly
            pick odd domains ON PURPOSE to watch the method, not the memory. The candidate who recites a
            memorized elevator design to slightly different requirements scores worse than the one who
            derives a fresh one.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s10">
        <div className="sec-label">Section 10 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 45 complete?</strong> Homework IS the day: run <strong>Track A at 45 minutes</strong> today
        with the timer above — full protocol, out loud, rubric immediately after, top-2 gaps written down.
        Tomorrow (or after a gap-day restudy if you scored red), run <strong>Track B at 45</strong> and see if
        the planted trap catches you. Green on both = Week 9 is genuinely yours, and you've completed the
        first classic-problems week of the course.
        <br /><br />
        Next: <strong>Day 46 — Elevator System, Part 1</strong>: Week 10 begins with the most asked
        state-machine problem there is — floors, requests, doors, and the famous question hiding inside:
        "which floor should the car go to next?"
      </div>
    </div>
  )
}
