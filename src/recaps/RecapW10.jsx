import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../components/ui.jsx'

function ReviewDrill({ items }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= items.length
  const cur = items[idx]
  function pick(i) { if (picked !== null) return; setPicked(i); if (i === cur.a) setScore((s) => s + 1) }
  return (
    <div className="panel">
      <div className="ptitle">Rapid review · recall the answer before you reveal it</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎯 Score: <b>{score} / {items.length}</b>. Anything you missed → reopen that day.</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Review again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 10 }}>🔁 <span>question {idx + 1} of {items.length} · score {score}</span></div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.q}</p>
          <div className="modbtns">
            {cur.o.map((o, i) => (
              <button key={i} className={picked !== null && i === cur.a ? 'on' : ''}
                style={{ fontSize: 12.5, ...(picked === i && i !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}) }}
                onClick={() => pick(i)}>{o}</button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ ' : '❌ '} <b>{cur.o[cur.a]}</b><br /><br />{cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={() => { setPicked(null); setIdx((i) => i + 1) }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const DRILL = [
  { q: 'Elevator: the ▲ hall button and the cabin "5" button should create…', o: ['The same Request(5)', 'Two types: HallCall(floor, Direction) — a pickup with direction — and CabinCall(floor) — a committed stop', 'Nothing; poll the floors'], a: 1,
    why: 'A hall call says WHICH WAY; a cabin call says WHERE. Collapse them into Request(floor) and a down-bound car stops uselessly for an up-bound rider — the scheduler can only be as smart as the requests are honest.' },
  { q: 'The single most important guard in the elevator car\'s state machine?', o: ['No moving on weekends', 'startMoving() throws while DOORS_OPEN — motion with open doors must be structurally impossible', 'Max 10 requests'], a: 1,
    why: 'A state machine earns its keep by making the one rule that matters unrepresentable: never move with the doors open. Defense in depth — the loop closes doors first AND the car re-checks the guard.' },
  { q: 'FCFS served [9,2,8,3,7] in 30 floors; SCAN did it in 8. The design conclusion?', o: ['FCFS is a bug', '"Which floor next" is a varying ALGORITHM with huge outcome differences → an injected SchedulingStrategy (FCFS/SCAN/LOOK)', 'Always hardcode SCAN'], a: 1,
    why: 'FCFS is fair, not broken — just usually the wrong trade. Fairness vs throughput is a policy choice → put it behind a Strategy interface; the controller never changes when you swap brains.' },
  { q: 'Vending machine: a switch(state) inside every event method is which disease, cured by which pattern?', o: ['Nothing wrong; State pattern', 'Switch-grid / shotgun surgery → the State pattern (one class per state, states name successors)', 'God class; Singleton'], a: 1,
    why: 'A switch on the same state in insert/select/dispense/refund means a new state edits all four (and a forgotten case fails silently). The State pattern makes each state one cohesive class — a new state is an added file.' },
  { q: 'In the State pattern, where does the balance/inventory live — states or context?', o: ['In each state object', 'In the CONTEXT; states are stateless behavior holders (can be shared singletons) that read/mutate it', 'In a global'], a: 1,
    why: 'Behavior in the states, DATA in the context. Money in a state would vanish on every transition. Stateless states can be flyweight singletons; a transition is just setState(...).' },
  { q: 'A logger\'s name hierarchy (com.shop.payment.X) propagating an event up to ancestors\' appenders is which pattern?', o: ['Observer', 'Chain of Responsibility — the event travels up the parent chain; each link may append and pass along (additivity)', 'Decorator'], a: 1,
    why: 'Config inherits DOWN the dotted-name tree (set com.shop=DEBUG once); events propagate UP through ancestors\' appenders — classic CoR. additivity=false stops the chain. (The async appender, separately, is a Decorator.)' },
]

const QUESTIONS = [
  { q: 'Week 10\'s theme?',
    o: ['Databases', 'Only the State pattern', 'Machines & frameworks: state machines (Elevator, Vending Machine) and a framework (Logging) — heavy on State, Strategy, Observer, and Chain of Responsibility', 'Random problems'], a: 2,
    e: 'Three problems centered on stateful behavior and pluggable policy: the elevator (state + scheduling Strategy), the vending machine (State pattern flagship), and a logging framework (CoR + Strategy + Facade).',
    w: { 0: 'Not about storage.', 1: 'State is central but not alone.', 3: 'A clear theme.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'Elevator: brain vs body?',
    o: ['The controller ASKS an injected SchedulingStrategy for the next stop (decide); the car only EXECUTES guarded transitions (do) — so brains are swappable and the body is simple enough to trust', 'The building decides', 'The car does everything', 'Whoever pressed first'], a: 0,
    e: 'Deciding and doing are different responsibilities (Day 11). A self-scheduling car is a god-object that can\'t be given a smarter brain. The controller owns pending calls + the strategy; the car obeys guards (doors!).',
    w: { 1: '"The building" is a god-noun.', 2: 'The god-car is the anti-pattern.', 3: 'That\'s FCFS smuggled in as physics.' },
    r: { id: 's2', label: 'Section 2 — Elevator' } },
  { q: 'Elevator scheduling: why is the SchedulingStrategy a PURE function of a snapshot?',
    o: ['For speed', 'To hide the floor', 'It reads a read-only CarSnapshot + pending calls and RETURNS a floor — it cannot move the car or mutate state, which keeps every strategy trivially unit-testable and the brain/body line clean', 'Java requires it'], a: 2,
    e: 'Passing an immutable snapshot means the strategy decides but cannot do. Purity = testability; the tick-based simulation harness then asserts visit order/floor count with no threads or sleeps.',
    w: { 0: 'Testability, not speed.', 1: 'It exposes the floor read-only.', 3: 'A design choice.' },
    r: { id: 's2', label: 'Section 2 — Elevator' } },
  { q: 'Why does the vending machine CLIMB to full State classes when the elevator stayed at enum+guards?',
    o: ['Enums can\'t hold money', 'Per-state BEHAVIOR multiplies: the same events (insert/select/dispense/refund) do completely different things in each state — that\'s the ladder\'s climbing condition (Day 34)', 'State classes are always better', 'Vending is more important'], a: 1,
    e: 'The elevator\'s states differ mainly in which transitions are legal (guards); the vending machine\'s states give every event a different meaning. When behavior, not just labels, varies per state, one-class-per-state pays off.',
    w: { 0: 'Money lives in the context.', 2: 'Pattern-by-reflex is a smell — the enum rung was right for the elevator.', 3: 'Importance is irrelevant.' },
    r: { id: 's2', label: 'Section 2 — Vending Machine' } },
  { q: 'Vending machine: the change-making sub-problem can FAIL (no exact change). Correct behavior?',
    o: ['Dispense anyway and keep the extra', 'Refuse the sale up front (refund) — "exact change only" is a real pre-condition checked BEFORE dispensing, never a short-change after the coins are swallowed', 'Crash', 'Round to nearest coin'], a: 1,
    e: 'Greedy change-making with limited coin inventory can be infeasible. A correct machine detects this before committing and refuses/refunds — never traps coins or short-changes (money math = exact units, Day 20).',
    w: { 0: 'Keeping the extra is theft.', 2: 'A predictable shortfall is handled, not crashed on.', 3: 'Rounding cheats someone every time.' },
    r: { id: 's2', label: 'Section 2 — Vending Machine' } },
  { q: 'Logging: the four nouns to keep separate?',
    o: ['Logger + String', 'Just a Logger', 'Level + Message', 'LogEvent (WHAT happened, immutable) · Logger (filters + routes) · Appender (WHERE it goes) · Layout (HOW it\'s formatted) — separating them makes new sinks/formats additive'], a: 3,
    e: 'WHAT vs WHERE vs HOW vary independently. A KafkaAppender with a JsonLayout, a ConsoleAppender with a SimpleLayout — any combination, all additive (Strategy ×3). Tangle them and you get the println-only logger nobody can extend.',
    w: { 0: 'Too coarse.', 1: 'Four distinct concerns.', 2: 'Those live on the LogEvent.' },
    r: { id: 's2', label: 'Section 2 — Logging' } },
  { q: 'Logging: log.debug("x=" + serialize(big)) is a performance trap because…',
    o: ['The argument is BUILT before debug() can check the level, so the expensive serialize runs even when DEBUG is filtered out — use parameterized logging (log.debug("x={}", big)) to defer it', 'debug() is synchronized', 'It allocates a logger', 'Strings are slow'], a: 0,
    e: 'Java evaluates arguments eagerly, so the message is constructed and then discarded. Parameterized logging (or a lambda supplier) formats only after the level check passes.',
    w: { 1: 'Not synchronization.', 2: 'No logger allocated.', 3: 'Needless work, not string speed.' },
    r: { id: 's2', label: 'Section 2 — Logging' } },
  { q: 'SLF4J vs Logback/Log4j2?',
    o: ['Competitors — pick one', 'SLF4J is deprecated', 'Logback is SLF4J renamed', 'SLF4J is a FACADE/API you code against; Logback/Log4j2 are implementations bound at deploy time — depend on the abstraction (Day 15) and swap the backend without changing a single log call'], a: 3,
    e: 'Your code calls the SLF4J interface; the engine is chosen by which jar is on the classpath — Facade + Dependency Inversion. Application code never names a concrete logger, so backends are swappable.',
    w: { 0: 'They\'re layers, used together.', 1: 'It\'s the standard facade.', 2: 'Distinct: an API vs an implementation.' },
    r: { id: 's2', label: 'Section 2 — Logging' } },
]

export default function RecapW10() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 3 · Week 10 · Machines &amp; Frameworks</div>
        <h1>Week 10 Recap:<br />Machines &amp; Frameworks</h1>
        <p>Days 46–50 in one place: the Elevator (state machine + scheduling Strategy), the Vending Machine (the
           State pattern\'s flagship), and a Logging framework (Chain of Responsibility + pluggable appenders).
           Cheat-sheet, rapid review, recap quiz.</p>
        <div className="chips">
          {['Elevator', 'Vending Machine', 'Logging', 'State pattern', 'Strategy', 'Chain of Responsibility'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  WEEK 10 — stateful behavior & pluggable policy

  Elevator         hall vs cabin calls · 4-state car (DOORS invariant) ·     Days 46-47
                   scheduling = injected Strategy (FCFS/SCAN/LOOK) ·
                   controller=brain / car=body · pure strategy + sim harness ·
                   multi-car dispatch = scheduling one level up
  Vending Machine  State pattern FLAGSHIP: switch-grid → one class per state · Day 48
                   states name successors · data in context · change-making
  Logging          four nouns (Event/Logger/Appender/Layout) · levels=enum ·  Day 49
                   hierarchy = Chain of Responsibility · SLF4J facade · async
  Drill            state-machine tell → draw the state×event GRID first       Day 50`} />
        <Note><strong>Why this matters:</strong> this week is where State, Strategy, Observer, and CoR stop
          being definitions and become the backbone of real machines. The brain/body split (elevator) and the
          State-pattern climb (vending) are the headline judgments.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Problem-by-problem cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Elevator (Days 46–47)</h3>
        <ul>
          <li><strong>Requests are two types:</strong> <C>HallCall(floor, Direction)</C> (pickup) vs <C>CabinCall(floor)</C> (committed stop) — collapsing them blinds the scheduler.</li>
          <li><strong>Car state machine:</strong> IDLE / MOVING_UP / MOVING_DOWN / DOORS_OPEN with the sacred invariant — <C>startMoving()</C> throws while DOORS_OPEN (defense in depth).</li>
          <li><strong>Scheduling = Strategy:</strong> FCFS (fair, ping-pongs: 30 floors) vs SCAN/LOOK (sweep: 8). Brain (controller asks the strategy) vs body (car executes guards).</li>
          <li><strong>Pure strategy</strong> (read-only snapshot → OptionalInt) → a tick-based simulation harness tests it deterministically; multi-car = a Dispatcher scoring ETA cost (scheduling one level up). Buttons-vs-loop is a concurrency flag.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Vending Machine (Day 48)</h3>
        <ul>
          <li><strong>State pattern flagship:</strong> the same buttons mean different things per state → one class per state (Idle/HasMoney/Dispensing/SoldOut); the context just forwards (no <C>switch(state)</C>).</li>
          <li><strong>States name their successors</strong> (<C>m.setState(...)</C>); illegal events are refused BY the state.</li>
          <li><strong>Data in the context, behavior in (stateless) states</strong> → states can be flyweight singletons; a transition is just <C>setState</C>.</li>
          <li><strong>Change-making</strong> (greedy + coin inventory) can fail → refuse/refund up front ("exact change only"), never short-change. State vs Strategy: same structure, but States transition themselves.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Logging Framework (Day 49)</h3>
        <ul>
          <li><strong>Four nouns:</strong> <C>LogEvent</C> (WHAT) · <C>Logger</C> (filter + route) · <C>Appender</C> (WHERE) · <C>Layout</C> (HOW). Levels = an ordered enum with a rank field (never persist <C>ordinal()</C>).</li>
          <li><strong>Logger hierarchy = Chain of Responsibility:</strong> config inherits DOWN the dotted-name tree; events propagate UP through ancestors\' appenders (additivity stops it).</li>
          <li><strong>Appender × Layout = Strategy</strong> (any sink × any format, additive). Eager-argument trap → parameterized logging.</li>
          <li><strong>SLF4J = Facade + DIP</strong> (engine bound at deploy); the async appender is a Decorator wrapping a sink (loss/ordering/backpressure flags).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>The Drill (Day 50)</h3>
        <ul>
          <li><strong>State-machine tell:</strong> modes that react differently to the same inputs → write the state×event GRID before any class.</li>
          <li><strong>Pick the rung and justify it:</strong> enum+guards (elevator) vs full State classes (vending) — say WHY.</li>
          <li><strong>Pipeline discipline:</strong> in a chain, every passing link forwards (or deliberately short-circuits); order encodes policy.</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 Patterns deployed this week</h2>
        <table className="matrix">
          <thead><tr><th>concern</th><th>tool</th><th>from</th></tr></thead>
          <tbody>
            <tr><td>car / vending mode behavior</td><td>state machine (enum+guards vs State classes)</td><td>Days 34 · 46 · 48</td></tr>
            <tr><td>which floor next / which format</td><td>injected Strategy (pure function)</td><td>Days 31 · 47 · 49</td></tr>
            <tr><td>displays, chimes</td><td>Observer</td><td>Day 32</td></tr>
            <tr><td>logger hierarchy propagation</td><td>Chain of Responsibility</td><td>Days 36 · 49</td></tr>
            <tr><td>SLF4J API over engines</td><td>Facade + Dependency Inversion</td><td>Days 29 · 15</td></tr>
            <tr><td>async appender</td><td>Decorator wrapping a sink</td><td>Day 27</td></tr>
            <tr><td>buttons-vs-loop / last spot</td><td>atomic claim (flagged → W13)</td><td>Day 21</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>Hall call = direction; cabin call = destination.</strong></li>
          <li><strong>Never move with doors open</strong> (the one guard).</li>
          <li><strong>Brain (controller asks the strategy) vs body (car obeys guards).</strong></li>
          <li><strong>Climb to State classes when behavior (not just labels) varies per state.</strong></li>
          <li><strong>States name successors; data in the context.</strong></li>
          <li><strong>Logging = Event/Logger/Appender/Layout;</strong> hierarchy = CoR; SLF4J = facade.</li>
          <li><strong>Parameterized logging</strong> dodges the eager-argument cost.</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps to never repeat</h2>
        <Warn><strong>One Request(floor) type.</strong> Direction evaporates; a down-car stops for up-bound riders.</Warn>
        <Warn><strong>The god-car / if-else scheduler.</strong> Brain welded into the body. Inject a SchedulingStrategy; the car only obeys guards.</Warn>
        <Warn><strong>switch(state) in every method.</strong> Switch-grid disease → the State pattern (one class per state).</Warn>
        <Warn><strong>Data inside state objects / transitions in the context.</strong> Data in the context; states name their own successors.</Warn>
        <Warn><strong>Dispense-then-check-change.</strong> Refuse/refund before committing; never short-change.</Warn>
        <Warn><strong>Eager log arguments / string levels.</strong> Parameterized logging; ordered enum levels (never ordinal()).</Warn>
        <Warn><strong>Synchronous network/file appender on the hot path.</strong> Wrap with an async appender (flag loss/ordering).</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Recall the answer before revealing:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across the week.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 10 revised?</strong> State machines, scheduling strategies, and framework-style pipelines
        are now in your hands — the backbone of the big systems next.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 11 · Recap</strong> — big systems.
      </div>
    </div>
  )
}
