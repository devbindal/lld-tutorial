import { useState, useEffect } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the drill timer ============ */
const PHASES = [
  { until: 5 / 45, label: 'clarify & scope', nudge: '❓ Ask 4–6 design-shaping questions. For a state machine: list the STATES and EVENTS out loud. Say what is OUT.' },
  { until: 12 / 45, label: 'states/handlers + enums', nudge: '📦 State machine? Draw the state×event grid. Pipeline? List the handlers and their ORDER. Closed sets → enums.' },
  { until: 35 / 45, label: 'code bottom-up', nudge: '⌨️ Bricks → state/handler classes → context/loop → wiring. Compile every ~8 minutes. Narrate every decision.' },
  { until: 42 / 45, label: 'test & polish', nudge: '🧪 Drive the happy path + ONE illegal event (must be REFUSED by the state, not crash). Fix, don\'t gold-plate.' },
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
  { code: 'void selectItem(String code) {\n  switch (state) {\n    case IDLE: display("pay first"); break;\n    case HAS_MONEY: /* ... */ break;\n    case DISPENSING: display("wait"); break;\n  }\n}',
    o: ['Missing a default case', 'Switch-grid disease: a switch(state) inside EVERY event method — adding a state means editing all of them and risking a forgotten case. One class per state instead (Day 48)', 'Should use if-else not switch', 'Needs more cases'], a: 1,
    why: 'A switch on state inside each event method is shotgun surgery waiting to happen — a new state edits every method. The State pattern makes each state one cohesive class you ADD.' },
  { code: 'class ElevatorCar {\n  int pickNextStop() {\n    // 60 lines of scheduling logic\n    if (...) return nearestUp();\n    else return nearestDown();\n  }\n}',
    o: ['pickNextStop is too long', 'The god-car: scheduling (brain) welded into the car (body) — it can\'t be swapped or unit-tested. Inject a SchedulingStrategy; the car only executes guarded moves (Days 46–47)', 'Should cache the result', 'Missing null checks'], a: 1,
    why: 'Deciding and doing are different responsibilities. A car that schedules itself can never be given a smarter brain — extract the policy behind a strategy interface.' },
  { code: 'log.debug("order " + orderId + " state " + serialize(fullOrder));',
    o: ['orderId should be final', 'Eager-argument trap: serialize(fullOrder) runs on EVERY call even when DEBUG is filtered out — use parameterized logging log.debug("order {} state {}", orderId, fullOrder) (Day 49)', 'Strings are slow', 'Should log at INFO'], a: 1,
    why: 'Java evaluates arguments before debug() can check the level, so the expensive serialize runs and is thrown away. Parameterized logging defers formatting until the level check passes.' },
  { code: 'class HasMoneyState {\n  private int balance;   // money lives here\n  void insertCoin(int c) { balance += c; }\n}',
    o: ['balance should be long', 'Data in the state: balance belongs in the CONTEXT, not the state object — putting it here loses it on every transition and stops states being shared singletons (Day 48)', 'Missing a constructor', 'insertCoin needs validation'], a: 1,
    why: 'States are stateless behaviour; the context holds the data. Money in the state vanishes when you transition to DispensingState — it must live in the machine.' },
  { code: 'if (event.getLevel().equals("ERROR") ||\n    event.getLevel().equals("WARN")) {\n  appender.append(event);\n}',
    o: ['Should use == not equals', 'Levels as strings: no ordering, and "EROR" typos compile fine. Use an ordered enum and event.level.isAtLeast(threshold) — the rank comparison IS the filter (Days 19, 49)', 'Missing INFO level', 'Too many conditions'], a: 1,
    why: 'String levels have no order and invite typos. An ordered enum with a rank turns the whole filter into one comparison and makes the names compiler-checked.' },
  { code: 'class AuthHandler implements Handler {\n  void handle(Request r) {\n    if (!r.isAuthed()) { reject(r); return; }\n    // forgot: next.handle(r);\n  }\n}',
    o: ['reject should throw', 'Broken chain (Day 36): an authed request is silently dropped because handle() never calls next.handle(r) — the deleted-link gap, and there\'s no compiler error to catch it', 'Should log the rejection', 'isAuthed should be cached'], a: 1,
    why: 'In a Chain of Responsibility, every handler that passes a request MUST forward to the next link. Forgetting next.handle() silently swallows valid requests — a classic, invisible pipeline bug.' },
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
          <p style={{ fontSize: 15 }}>🎉 Score: <b>{score} / {SMELLS.length}</b> — every smell here costs real points in real rounds, and every fix was one of this week's patterns. Re-run until 6/6 feels boring.</p>
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
                onClick={() => pick(i)}>{o.length > 62 ? o.slice(0, 59) + '…' : o}</button>
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
  { cat: 'Scope', revisit: 'Day 46', items: [
    'Asked 4–6 design-shaping questions before touching code',
    'For a state machine: listed STATES and EVENTS out loud before coding',
    'Said what is OUT of scope (and named future states/handlers)',
  ]},
  { cat: 'Model', revisit: 'Days 46 & 48', items: [
    'Chose the right state rung and SAID WHY (enum+guards vs full State classes)',
    'Closed sets are enums (with rank if ordered); data lives in the context, not the states',
    'Illegal events are refused BY the state/handler, not by central if-checks',
    'Separated the axes: WHAT happened vs WHERE it goes vs HOW (event/sink/format)',
  ]},
  { cat: 'Code', revisit: 'Days 47 & 49', items: [
    'It compiles, and the happy path runs end-to-end',
    'States name their own successors; handlers forward down the chain (no deleted links)',
    'Behaviour swappable behind an interface (Strategy/State), wired at the composition root',
    'Time / randomness / I/O behind seams; a deterministic test is POSSIBLE',
  ]},
  { cat: 'Extensibility', revisit: 'Days 47–49', items: [
    'Proved one follow-up = new class + one wiring line (actually did it)',
    'A new state / handler / appender is ADDITIVE — touched no existing class',
  ]},
  { cat: 'Communication', revisit: 'Days 46 & 49', items: [
    'Narrated decisions while typing, citing the pattern ("State here — every event differs")',
    'Flagged concurrency (shared mutable state, async I/O) in one sentence each',
  ]},
]
const TOTAL_ITEMS = RUBRIC.reduce((n, g) => n + g.items.length, 0)

function RubricScorecard() {
  const [checked, setChecked] = useState({})
  const score = Object.values(checked).filter(Boolean).length
  const toggle = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }))
  const gaps = RUBRIC.filter((g) => g.items.some((_, i) => !checked[g.cat + i]))

  let verdict, color
  if (score >= 14) { verdict = '🟢 Interview-ready. Do one more rep at 25 minutes for speed, then move to Week 11.'; color = '#EAF7EF' }
  else if (score >= 10) { verdict = '🟡 One more rep needed. Restudy ONLY the flagged days below, then drill the OTHER track at full length.'; color = '#FFF1D6' }
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
  { q: 'You\'re given a state-machine prompt. The FIRST modeling artifact to produce (out loud)?',
    o: ['The class diagram', 'The states and the events, then the state × event grid — what each event does in each state, including which are illegal — because that grid IS the design and exposes missing states immediately', 'The main() method', 'The database schema'], a: 1,
    e: 'For elevator and vending, the state×event grid was the heart of the design. Listing states and events first surfaces illegal transitions and forgotten states before you write a single class.',
    w: { 0: 'A class diagram without the state grid is boxes with no behaviour — draw the grid first.',
         2: 'main() wires things that don\'t exist yet — bottom-up, not top-down.',
         3: 'Schema is persistence; the behaviour model comes first.' },
    r: { id: 's1', label: 'Section 1 — the protocol' } },
  { q: 'Track A is a traffic-signal controller. Timing plans (rush-hour vs night) should be…',
    o: ['Stored as magic numbers', 'A separate controller subclass per plan', 'if (isRushHour) hardcoded in the controller', 'An injected SignalTimingStrategy — the state machine drives transitions; HOW LONG each state lasts is a swappable policy, so a new plan is a new class, controller untouched (Days 46–47)'], a: 3,
    e: 'The transfer from elevator: the state machine (body) and the timing policy (brain) are separate. Timing is a varying algorithm → Strategy, injected, so plans plug in without reopening the controller.',
    w: { 0: 'Magic numbers scattered in the controller are Day 19\'s trap and unswappable.',
         1: 'A subclass per plan explodes combinatorially and welds timing into type.',
         2: 'if(isRushHour) is the growing-switch smell (Day 12) — next comes if(isWeekend), if(holiday).' },
    r: { id: 's4', label: 'Section 4 — Track A' } },
  { q: 'Track B is a request middleware pipeline. A handler that processes a request but forgets next.handle(r)…',
    o: ['Throws a compile error', 'Logs a warning', 'Is automatically retried', 'Silently drops every downstream handler — the deleted-link gap (Day 36): valid requests vanish with no error, the single nastiest bug in chain-of-responsibility code'], a: 3,
    e: 'A chain only works if each passing link forwards to the next. Forgetting next.handle() compiles fine and silently swallows requests — exactly the planted trap, and why a pipeline test must assert the request reached the end.',
    w: { 0: 'The compiler can\'t know you MEANT to forward — it sees a valid void method.',
         1: 'No warning fires — the absence of a call is invisible at runtime.',
         2: 'Nothing retries it; it\'s just gone.' },
    r: { id: 's5', label: 'Section 5 — Track B\'s planted trap' } },
  { q: 'In the pipeline, ORDER matters: auth, logging, rate-limit, routing. The defensible ordering and why?',
    o: ['Any order works', 'Alphabetical', 'Rate-limit and auth BEFORE expensive work (routing/handling): reject early to protect resources, and authenticate before logging user-specific data — ordering is a design decision to STATE, not stumble into', 'Routing first, it\'s most important'], a: 2,
    e: 'Chain order encodes policy: cheap rejections (rate-limit, auth) go first so you never do expensive routing for a request you\'ll drop. Naming the ordering rationale is the senior move — there isn\'t one universal order, but there IS a reasoned one.',
    w: { 0: 'Order changes behaviour and cost — logging unauthenticated noise, or routing before rate-limiting, are real bugs.',
         1: 'Alphabetical is arbitrary; order must follow cost/dependency logic.',
         3: 'Routing first means you do the expensive work before checking if the request is even allowed.' },
    r: { id: 's5', label: 'Section 5 — Track B' } },
  { q: 'You scored 11/17, all misses in Extensibility. The review loop says…',
    o: ['Redo all of Weeks 1–10', 'Lower the rubric to 11 items', 'Restudy ONLY the flagged material (the strategy/handler seams from Days 47–49), then re-drill the OTHER track at full length', 'Move on to Week 11 — passing score'], a: 2,
    e: 'Targeted reps: the rubric points at specific gap days, not a grade. Re-drilling the other track checks the gap is fixed in general, not memorized for one problem.',
    w: { 0: 'Untargeted re-study turns a drill into rereading — train the gap, not the syllabus.',
         1: 'Adjusting the measuring stick guarantees no improvement. 🙂',
         3: '10–13 means the gap is real; carrying it into Week 11 compounds it.' },
    r: { id: 's7', label: 'Section 7 — the review loop' } },
  { q: 'Both tracks need a deterministic test. The shared technique?',
    o: ['Use lots of print statements', 'Drive the machine with explicit ticks/events and a fixed clock, then assert on recorded state/output — no Thread.sleep, no real time, fully repeatable (the elevator harness + ScriptedDice idea)', 'Run it and eyeball the output', 'Test only the happy path manually'], a: 1,
    e: 'The simulation-harness move from Day 47: because the machine advances on explicit calls, a test pumps events and asserts the resulting states/transitions instantly and stably. Time and randomness are injected, never real.',
    w: { 0: 'Prints are debugging, not assertions; nothing fails automatically.',
         2: 'Eyeballing isn\'t a test — it can\'t catch a regression next week.',
         3: 'Manual happy-path checks miss the illegal-event cases that matter most.' },
    r: { id: 's2', label: 'Section 2 — the week\'s skills' } },
  { q: 'A traffic light completes RED → GREEN → YELLOW → RED. Who decides the next state?',
    o: ['Each state names its successor (State pattern) OR an enum encodes next() — transitions live with the state, so adding a flashing-RED or all-RED state is additive, not a controller rewrite (Day 48)', 'A central StateManager switch', 'The controller with a big if-else', 'The timing strategy'], a: 0,
    e: 'States naming successors keeps each transition next to its behaviour. The timing strategy decides HOW LONG; the state decides WHAT\'S NEXT — two clean responsibilities, both extensible.',
    w: { 1: 'A central manager switch is the same scattered knowledge in a different class.',
         2: 'A controller if-else over states is the switch-grid you\'re escaping (Day 48).',
         3: 'The timing strategy owns duration, not the transition graph — don\'t conflate them.' },
    r: { id: 's4', label: 'Section 4 — Track A' } },
  { q: 'Why narrate "this is the State pattern because every event differs per state" while coding alone in a drill?',
    o: ['Citing the pattern AND its trigger as you decide must be automatic by interview day — and it forces you to verify you actually picked the right rung (vs enum+guards), catching mis-modeling early', 'To memorize a script', 'It\'s not necessary', 'Because the interviewer can\'t read code'], a: 0,
    e: 'Narration is a muscle and a check: saying "State pattern because behaviour multiplies per state" both trains the interview habit and makes you confirm the choice fits — the same self-test Day 46 used to JUSTIFY staying at the enum rung.',
    w: { 1: 'Not a script — a habit of attaching the WHY (and verifying it) to each choice.',
         2: 'Silent reps train silent interviews — the narration is half the skill being drilled.',
         3: 'They read code fine; they grade whether you can justify it as you write.' },
    r: { id: 's8', label: 'Section 8 — failure modes' } },
]

/* ============ The page ============ */
export default function Day50() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 10 · Day 50 · Classic LLD Problems</div>
        <h1>Week 10 Drill:<br />State Machines &amp; Pipelines, On the Clock</h1>
        <p>Day 49 was the last new problem. Now you prove the week stuck: two FRESH problems solo, under a real
           timer, graded with an interviewer\'s rubric. One is a state machine (elevator/vending shape); one is
           a pipeline (logging/Chain-of-Responsibility shape) — and it hides a trap this week warned you about.
           Halfway through the course. Click everything, then close the lid and drill.</p>
        <div className="chips">
          {['timed drill', 'state machine track', 'pipeline track', 'self-grading rubric', 'smell hunt', 'review loop'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The drill protocol: rehearse like it counts</h2>
        <p>Same rules as Day 45 — a dress rehearsal, not study time. The one twist for this week: most prompts
          are <strong>state machines or pipelines</strong>, so your first artifact is a <em>grid</em> or a
          <em> handler list</em>, not a class diagram.</p>
        <Code html={`  THE DRILL PROTOCOL (Week 10 edition)

  RULES (non-negotiable):
  · real keyboard, real project, timer VISIBLE
  · no peeking at Days 46–49 until the review phase
  · the code must COMPILE when the bell rings
  · talk out loud — cite the PATTERN and its trigger as you choose it
  · pens down at zero. Interviews don't grant extensions.

  THE 45-MINUTE SHAPE
  ──────────────────────────────────────────────────────────────
   0– 5   clarify + scope; for a state machine, LIST states & events
   5–12   the state × event GRID  (or the handler list + ORDER)
  12–35   CODE bottom-up: bricks → state/handler classes → context/loop → wiring
                                        ← compile every ~8 minutes
  35–42   happy path + ONE illegal event (must be REFUSED, not crash)
  42–45   self-review against the rubric (Section 7)`} />
        <Note><strong>The state-machine tell:</strong> if the prompt has "modes", "statuses", or "phases" that
          react differently to the same inputs, write the state×event grid FIRST. It surfaces missing states
          and illegal transitions in two minutes — exactly what graders probe with "what happens if…?".</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The week in one map — what the drill actually tests</h2>
        <p>Four days, ten transferable skills. The drill problems below are new on the surface and built
          entirely from this table underneath:</p>
        <table className="matrix">
          <thead>
            <tr><th>skill</th><th>born on</th><th>drill checkpoint</th></tr>
          </thead>
          <tbody>
            <tr><td>state×event grid before code</td><td>Days 46 · 48</td><td>grid drawn in the modeling phase</td></tr>
            <tr><td>pick the state rung &amp; justify it</td><td>Days 34 · 46 · 48</td><td>enum+guards vs State classes, said out loud</td></tr>
            <tr><td>states name their own successors</td><td>Day 48</td><td>no switch(state) in the context</td></tr>
            <tr><td>data in context, behaviour in states</td><td>Day 48</td><td>no fields inside state objects</td></tr>
            <tr><td>varying policy behind a Strategy</td><td>Days 47 · 49</td><td>timing/scheduling/layout injected</td></tr>
            <tr><td>Chain of Responsibility + forwarding</td><td>Days 36 · 49</td><td>every link calls next; order justified</td></tr>
            <tr><td>separate WHAT / WHERE / HOW</td><td>Day 49</td><td>event vs sink vs format are distinct</td></tr>
            <tr><td>injected Clock / pure functions</td><td>Days 47 · 49</td><td>a deterministic test is POSSIBLE</td></tr>
            <tr><td>tick/event simulation harness</td><td>Day 47</td><td>pump events, assert states — no sleeps</td></tr>
            <tr><td>concurrency flags planted</td><td>Days 46 · 49</td><td>shared mutable state / async I/O named</td></tr>
          </tbody>
        </table>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>⏱ The drill clock</h2>
        <p>Use this for the real thing. The phase bar scales to the length you pick — 45' for the full
          rehearsal, 25' for speed reps once you\'re scoring green:</p>
        <DrillTimer />
        <Good><strong>How to use it:</strong> read a track below, write your clarifying questions and the
          state grid / handler list FIRST, then press start and open that track\'s "interviewer\'s answers"
          reveal. If you\'re still modeling when the bar says "code bottom-up", that\'s the drill teaching you
          your pacing.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Track A · "Design a traffic-signal controller." (the state-machine rep)</h2>
        <p>Eleven words, vague on purpose. Write your 4–6 clarifying questions AND the state×event grid on
          paper <em>before</em> opening the answers. Then drill.</p>
        <Warn><strong>Do not open the reveals until your questions and grid are written.</strong> Reading the
          answers first turns a rep into a rerun — the state-modeling muscle is the one this track trains.</Warn>
        <Reveal summary="🔒 The interviewer's answers — open AFTER writing your questions & grid">
          <p><strong>How many signals?</strong> One intersection, 4 directions — but model ONE signal cleanly
            first, coordinate after.
            <br /><strong>States?</strong> RED → GREEN → YELLOW → RED (and "maybe a flashing-RED night mode
            later").
            <br /><strong>What drives transitions?</strong> Timers — each state lasts a configurable duration.
            <br /><strong>Timing plans?</strong> Rush-hour (long greens), off-peak, night (flashing) — "expect
            to switch plans without redeploying".
            <br /><strong>Displays?</strong> The physical lights + a count-down display react to state changes.
            <br /><strong>Out of scope:</strong> sensors/adaptive timing, pedestrian buttons (name them as
            future events), full 4-way coordination.
            <br /><strong>Sneaky follow-up at minute 40:</strong> "add an all-RED safety phase between every
            transition."</p>
        </Reveal>
        <Reveal summary="🔒 Model-answer skeleton — open ONLY during the review phase">
          <Code html={`  TRACK A — the shape you hopefully drew (elevator/vending state machine, re-skinned)

  enum Light { RED, GREEN, YELLOW }              ← closed set → enum
  interface SignalState {                        ← one class per state (Day 48)
      void onTick(SignalController c);              each names its SUCCESSOR
  }  RedState · GreenState · YellowState         (Green→Yellow→Red→Green)

  interface TimingStrategy { Duration durationFor(Light light); }  ← Strategy (Day 47)
      RushHourTiming · OffPeakTiming · NightTiming   ← swap the PLAN, not the machine

  class SignalController {                        ← the context
      SignalState state;  TimingStrategy timing;     (timing INJECTED at the root)
      Clock clock;                               ← injected → deterministic tests (Day 47)
      List<SignalObserver> displays;             ← Observer (Day 32): lights + countdown
      void tick() { state.onTick(this); }        ← forwards; NO switch(state)
  }

  SELF-CHECK: switch(state) in the controller? data inside state objects? timing
  hardcoded with if(rushHour)? Each is Days 48/47/12 calling. The all-RED follow-up
  = ONE new state class + each state names it as its successor. Nothing else changes.`} />
        </Reveal>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Track B · "Design a request middleware pipeline." (the framework rep — with a planted trap)</h2>
        <p>Think an HTTP server\'s handler chain: a request flows through auth, rate-limiting, logging, then
          routing. Same discipline — questions and the handler list (with ORDER) on paper first. This one looks
          like Day 49\'s logging chain, and it hides a bug this week named explicitly.</p>
        <Reveal summary="🔒 The interviewer's answers — open AFTER writing your questions & handler list">
          <p><strong>What handlers?</strong> Authentication, rate-limiting, request logging, routing to the
            endpoint — "and we add more over time".
            <br /><strong>Can a handler stop the chain?</strong> Yes — auth rejects, rate-limit rejects; a
            rejected request must NOT reach routing.
            <br /><strong>Order configurable?</strong> Yes — the chain is assembled at startup, order matters.
            <br /><strong>Shared context?</strong> A request/response object flows through; handlers may read
            and annotate it.
            <br /><strong>Out of scope:</strong> the actual HTTP parsing, async I/O (name it as a flag).
            <br /><strong>Sneaky follow-up at minute 40:</strong> "add a caching handler that short-circuits
            with a cached response."</p>
        </Reveal>
        <Reveal summary="🔒 Model-answer skeleton + THE TRAP — open ONLY during the review phase">
          <Code html={`  TRACK B — the skeleton, and the landmine

  interface Handler {                            ← Chain of Responsibility (Days 36, 49)
      void handle(Request req, Response res, Chain chain);
  }
  class Chain {                                  ← holds the ordered handlers
      void next(Request req, Response res) { ... advance to the next handler ... }
  }
  // AuthHandler · RateLimitHandler · LoggingHandler · RoutingHandler (the terminal link)
  // assembled at the composition root: new Chain(auth, rateLimit, logging, routing)

  ⚠ THE TRAP: a handler that processes the request but FORGETS chain.next(...)
  silently drops it — the request never reaches routing, no error, no log.
  This is Day 36's deleted-link gap. Your pipeline TEST must assert the request
  reached the terminal handler (e.g. a RoutingHandler that records it).

  ORDER IS DESIGN: rate-limit & auth BEFORE routing (reject cheaply, don't do
  expensive work for a request you'll drop). The caching follow-up = a new
  handler near the FRONT that calls res.send(cached) and does NOT call next().
  (Yes — sometimes NOT forwarding is correct. Knowing WHEN is the skill.)`} />
        </Reveal>
        <Note><strong>Why two tracks:</strong> Track A tests whether the state-machine shape transferred
          (states, successors, injected policy, context-holds-data). Track B tests whether the chain/framework
          shape transferred — AND whether you remember that forwarding is mandatory unless you deliberately
          short-circuit. Different muscles; drill both.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔎 Play: the smell hunt</h2>
        <p>Warm up your reviewer\'s eye before grading yourself. Six snippets from this week\'s problems, one
          planted smell each:</p>
        <SmellHunt />
        <Good><strong>What you should notice:</strong> ① Every smell is a pattern MISSED — switch-grid instead
          of State, god-car instead of Strategy, broken chain instead of forwarding. ② The fixes are this
          week\'s exact lessons, not "be more careful". ③ The reviewer\'s eye you just used on strangers\' code
          is the one Section 7 asks you to point at your own.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>📋 The rubric: grade yourself like an interviewer</h2>
        <p>Immediately after pens-down — while the memory is honest — check off only what you ACTUALLY did, not
          what you knew you should do:</p>
        <RubricScorecard />
        <Code html={`  THE REVIEW LOOP — the rep isn't over at pens-down

  drill (45') ──▶ rubric score ──▶ write your TOP-2 gaps
                                          │
       ▲                                  ▼
       └── re-drill (other track) ◀── restudy ONLY the gap days (actively:
            25' once you're green        type the code, don't reread the page)

  One honest loop beats five untimed, ungraded "practice sessions".
  The drill finds the gap; the review names it; the targeted rep closes it.`} />
        <Warn><strong>The rubric only works if it hurts a little.</strong> "I would have used the State
          pattern" is unchecked. "I mentioned the async flag in my head" is unchecked. The standard: an
          interviewer watching the recording would have seen or heard it.</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>🕳 Drill failure modes — how good reps go bad</h2>
        <Warn><strong>Coding before the grid.</strong> For a state machine, jumping into classes without the
          state×event grid means discovering a missing state at minute 30. The grid is two minutes that saves
          twenty.</Warn>
        <Warn><strong>Picking a pattern by reflex.</strong> Slapping the State pattern on a 2-state problem is
          as wrong as a switch-grid on a 6-state one. Say the rung AND why — the justification IS the
          skill (Day 46 vs Day 48).</Warn>
        <Warn><strong>Silent coding.</strong> If the rep is silent, the narrate-the-pattern muscle stays
          untrained, and in the real round talking will steal capacity from thinking. Feel silly now or go
          quiet at minute 25.</Warn>
        <Warn><strong>Compiling once at the end.</strong> Bottom-up + compile-every-8-minutes means errors
          arrive one at a time, one minute old. Top-down meets all its typos at once in the wiring file.</Warn>
        <Warn><strong>Forgetting the illegal-event test.</strong> The happy path is the entry ticket; the
          grade is in "what happens on an illegal event?" — it must be REFUSED by the state/handler, with
          context, not crash or silently pass.</Warn>
        <Warn><strong>The rep without the review.</strong> An ungraded drill trains your existing habits,
          including the bad ones, now faster. The 10 minutes with the rubric is where improvement lives.</Warn>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>📋 Cheat sheet — the pocket script for machine/framework problems</h2>
        <ul>
          <li><strong>State-machine tell:</strong> modes/statuses that react differently to the same inputs → write the state×event grid FIRST.</li>
          <li><strong>Pick the rung &amp; justify:</strong> enum+guards when states differ mainly in what\'s legal (elevator); full State classes when every event differs per state (vending). Say which and why.</li>
          <li><strong>State pattern discipline:</strong> states name their successors; data in the context, behaviour in (stateless, sharable) states; no switch(state) anywhere.</li>
          <li><strong>Pipeline/CoR discipline:</strong> every passing link calls next(); order encodes policy (reject cheaply before expensive work); short-circuit ONLY deliberately (caching, rejection).</li>
          <li><strong>Varying policy → Strategy, injected</strong> (timing, scheduling, layout). A new plan/handler/appender is a new class + one wiring line.</li>
          <li><strong>Testability:</strong> inject Clock/randomness, keep decisions pure, drive with explicit ticks/events → deterministic assertions, no sleeps.</li>
          <li><strong>Flags to plant:</strong> shared mutable state under concurrency; async/blocking I/O on the hot path. One sentence each.</li>
          <li><strong>Review loop:</strong> drill → rubric → top-2 gaps → restudy those days actively → re-drill the other track. Green twice = move on.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 State-machine &amp; framework round questions</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "How do I know whether to use enum+guards or the full State pattern?"'>
          <p>Count the per-state BEHAVIOUR. If states differ mainly in which transitions are legal and the
            logic is thin, enum-and-guards is cleaner (the elevator). If every event does something genuinely
            different in each state and states keep growing, the State pattern\'s one-class-per-state keeps each
            mode cohesive (the vending machine). The honest middle rung is an enum with per-constant method
            bodies (Day 19). Say which you picked and why — interviewers grade the justification, not the
            choice.</p>
        </Reveal>
        <Reveal summary='Q: "In a chain, when is NOT calling next() correct vs a bug?"'>
          <p>Not forwarding is a BUG when the handler merely processed and should pass along (logging, auth that
            PASSED). It\'s CORRECT when the handler deliberately terminates the chain: a rejection (auth failed,
            rate-limit exceeded) or a short-circuit (cache hit returns a response). The design tell: a handler
            either calls next() OR produces a terminal response — never silently does neither. Your test asserts
            the request either reached the end or was explicitly terminated.</p>
        </Reveal>
        <Reveal summary='Q: "Does chain order matter? Give an example where it changes behaviour."'>
          <p>Hugely. Auth before logging → you don\'t log unauthenticated junk and you can log the user id.
            Rate-limit before routing → you reject floods before doing expensive work. Caching before auth →
            you might serve a cached private response to the wrong user (a security bug!). Order encodes policy
            and cost; there\'s no universal order, but there is a reasoned one for each pipeline — and stating
            the rationale is the senior signal.</p>
        </Reveal>
        <Reveal summary='Q: "Both my tracks need persistence across a restart. What do you save?"'>
          <p>The CONTEXT, because that\'s where the data lives. For the signal controller: current state name,
            elapsed time in state, active timing plan. For the pipeline: usually stateless per-request, but any
            cross-request state (rate-limit counters) is the context to persist. States/handlers are stateless
            code you recreate; only the data needs saving. This is exactly why "data in context, behaviour in
            states" matters — it makes persistence obvious.</p>
        </Reveal>
        <Reveal summary='Q: "Where&apos;s the concurrency risk in each, in one sentence?"'>
          <p>Signal controller: the tick thread mutates state while a config thread swaps the timing plan —
            guard the shared state. Pipeline: handlers share a mutable request/response and run on many request
            threads simultaneously, plus cross-request counters (rate-limit) are shared mutable state — the
            same check-then-act race as Day 21. Name it, propose atomic/synchronized access, note Month 4 for
            the deep dive. Creating an asynchronous machine and NOT noticing the race is the miss.</p>
        </Reveal>
        <Reveal summary='Q: "We&apos;re halfway through the course. What should machine-coding feel like by now?"'>
          <p>Pattern-recognition first, code second: a new prompt should trigger "that\'s a state machine →
            grid first" or "that\'s a pipeline → handler chain" within the first minute, and the patterns
            (State, Strategy, CoR, Observer) should be tools you reach for by name, with their triggers and
            trade-offs ready. The shapes repeat across the whole course — resource+ticket, turn-based game,
            state machine, pipeline. If you can name the shape and justify the rung, the code is just typing.
            That fluency, not memorized solutions, is what the back half builds on.</p>
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
        <strong>Day 50 complete?</strong> Homework IS the day: run <strong>Track A at 45 minutes</strong> today
        with the timer above — full protocol, state×event grid first, out loud, rubric immediately after, top-2
        gaps written down. Tomorrow (or after a gap-day restudy if you scored red), run <strong>Track B at
        45</strong> and see if the deleted-link trap catches you. Green on both = Week 10 is genuinely yours —
        and you\'ve reached the halfway mark of the course.
        <br /><br />
        Next: <strong>Day 51 — BookMyShow, Part 1</strong>: Week 11 opens the big systems — movie/seat booking,
        the entity model, and the question that defines it: how do two people NOT book the same seat at the same
        instant?
      </div>
    </div>
  )
}
