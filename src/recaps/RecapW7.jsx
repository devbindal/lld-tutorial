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
      <div className="ptitle">Rapid review · name the pattern before you read the answer</div>
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
  { q: 'You want to swap a sorting/pricing ALGORITHM at runtime behind one interface. Pattern?', o: ['Strategy', 'State', 'Template Method'], a: 0,
    why: 'Strategy: a context holds an interchangeable algorithm object. Comparator is the JDK poster child; lambdas make strategies one-liners. Chosen once from outside and kept (contrast State, which swaps itself).' },
  { q: 'Many objects must react when one object changes, without it knowing who they are. Pattern?', o: ['Observer', 'Mediator', 'Command'], a: 0,
    why: 'Observer: a subject publishes events; observers subscribe. Never poll. Push (send data) vs pull (observer fetches). Watch: exception isolation, lapsed-listener leaks, CME → CopyOnWriteArrayList, reentrancy.' },
  { q: 'You want to package a request as an object to queue it, log it, or UNDO it. Pattern?', o: ['Command', 'Strategy', 'Observer'], a: 0,
    why: 'Command: reify a request (command + receiver + invoker + client). Enables queues (Runnable/executor), macros (composite), and undo/redo (two stacks; inverse op or Memento snapshot). The invoker stays ignorant of what it runs.' },
  { q: 'An object behaves completely differently depending on its mode, and modes transition. Pattern?', o: ['Strategy', 'State', 'Template Method'], a: 1,
    why: 'State: one class per state, each handling every event and naming its successor; the context delegates. Cures the switch-grid. Same structure as Strategy but the states swap THEMSELVES in response to events (a graph).' },
  { q: 'You have a fixed algorithm skeleton with a few steps that subclasses fill in. Pattern?', o: ['Strategy', 'Template Method', 'Command'], a: 1,
    why: 'Template Method: a final template() defines the invariant steps and calls abstract/hook methods subclasses override. Hollywood Principle ("don\'t call us, we\'ll call you"). Inheritance-based (vs Strategy\'s composition).' },
  { q: 'Strategy vs State — both are a context delegating to a swappable object. The difference?', o: ['Identical', 'Strategy is set ONCE from outside and stays; State swaps ITSELF at runtime in response to events (a transition graph)'], a: 1,
    why: 'Structurally twins. Strategy = "do this job a different WAY", chosen by the client and fixed. State = "behave differently as I CHANGE", with states naming successors and transitioning continuously.' },
]

const QUESTIONS = [
  { q: 'What do BEHAVIORAL patterns address?',
    o: ['Object creation', 'How objects INTERACT and distribute responsibility — algorithms, notifications, requests, state-driven behavior, and reusable skeletons', 'Memory layout', 'Compilation'], a: 1,
    e: 'Behavioral patterns are about communication and responsibility: Strategy (swap algorithm), Observer (notify), Command (reify requests), State (mode-driven behavior), Template Method (fixed skeleton, variable steps).',
    w: { 0: 'That\'s creational.', 2: 'Unrelated.', 3: 'Unrelated.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'Strategy\'s division of labor?',
    o: ['Strategy does everything', 'The CONTEXT decides WHEN to act and holds the data; the STRATEGY decides HOW (the algorithm). Swap strategies without touching the context (OCP + DIP)', 'The context picks the algorithm with if-else', 'They are the same object'], a: 1,
    e: 'Context owns the trigger + data and delegates the varying algorithm to an injected Strategy. Lambdas/Comparator are lightweight strategies. A selection switch inside the context is the smell Strategy removes.',
    w: { 0: 'It only knows HOW, not WHEN.', 2: 'That if-else is the anti-pattern.', 3: 'They\'re separate roles.' },
    r: { id: 's2', label: 'Section 2 — Day 31' } },
  { q: 'Observer: push vs pull, and the classic hazards?',
    o: ['No hazards', 'Push sends the changed data in the event; pull lets observers query the subject. Hazards: one observer\'s exception breaking the rest (isolate), lapsed-listener memory leaks (unsubscribe), CME during iteration (CopyOnWriteArrayList), and reentrancy', 'Always poll', 'Observers must know each other'], a: 1,
    e: 'Push vs pull is a real design choice (immutable event records are clean). The chaos lab: isolate observer exceptions, remove dead listeners, iterate a safe copy, and beware notifications triggering more notifications.',
    w: { 0: 'Several real hazards.', 2: 'Polling is the anti-pattern Observer replaces.', 3: 'Observers are decoupled from each other.' },
    r: { id: 's2', label: 'Section 2 — Day 32' } },
  { q: 'Command\'s four roles?',
    o: ['Just a function', 'Command (the request object) · Receiver (does the work) · Invoker (triggers it, stays ignorant) · Client (wires command→receiver) — enabling queues, macros, and undo/redo', 'Subject + observers', 'Context + strategy'], a: 1,
    e: 'Reifying a request as an object decouples the invoker (a button, a queue) from the receiver. Undo = store the inverse or a Memento snapshot; macro = a composite command; queue = Runnable on an executor.',
    w: { 0: 'It has explicit roles enabling undo/queue/macro.', 2: 'That\'s Observer.', 3: 'That\'s Strategy.' },
    r: { id: 's2', label: 'Section 2 — Day 33' } },
  { q: 'State pattern: who decides the next state?',
    o: ['The context with a switch', 'Each state object names its successor (calls context.setState(...)) — one class per state, every state handles every event; the context just delegates, no switch-grid', 'A central manager', 'The client'], a: 1,
    e: 'States own both behavior and transitions, keeping each mode cohesive. Adding a state = a new class (the vending machine / ATM flagship). Climb the ladder (ifs → enum → State classes) when per-state behavior multiplies.',
    w: { 0: 'A switch in the context is the disease State cures.', 2: 'A manager is the switch in disguise.', 3: 'Clients fire events; they don\'t know the graph.' },
    r: { id: 's2', label: 'Section 2 — Day 34' } },
  { q: 'Template Method vs Strategy?',
    o: ['Identical', 'Template Method varies steps via INHERITANCE (subclass overrides hook methods inside a fixed skeleton); Strategy varies the whole algorithm via COMPOSITION (inject a different object)', 'Template Method uses composition', 'Strategy uses inheritance'], a: 1,
    e: 'Both let behavior vary, but Template Method bakes the skeleton into a base class and overrides steps (compile-time, inheritance); Strategy composes an interchangeable object (runtime, composition). Hollywood Principle defines Template Method.',
    w: { 0: 'Different mechanism.', 2: 'It uses inheritance.', 3: 'Strategy uses composition.' },
    r: { id: 's2', label: 'Section 2 — Day 35' } },
  { q: 'The Template Method "constructor trap"?',
    o: ['Constructors are banned', 'If the base constructor calls an overridable step, it runs against a HALF-BUILT subclass (subclass fields not yet initialized) — don\'t call overridable methods from constructors', 'Templates can\'t have constructors', 'It needs reflection'], a: 1,
    e: 'During base construction the subclass isn\'t fully initialized, so an overridden step sees default/null fields. Keep the template invocation out of the constructor; trigger it explicitly afterward.',
    w: { 0: 'Constructors are fine, just don\'t call overridable steps from them.', 2: 'They can.', 3: 'No reflection involved.' },
    r: { id: 's2', label: 'Section 2 — Day 35' } },
  { q: 'You see a growing switch(currentMode) repeated inside several methods. Which pattern fixes it?',
    o: ['Strategy', 'State — one class per state replaces the scattered switches; adding a mode becomes adding a class, not editing every method', 'Observer', 'Template Method'], a: 1,
    e: 'The switch-grid disease (a switch on the same mode in every event method) is the State pattern\'s calling card. State classes make each mode cohesive and new modes additive.',
    w: { 0: 'Strategy is set once externally; this is mode-driven self-transition.', 2: 'Observer is notification.', 3: 'Template Method is a fixed skeleton.' },
    r: { id: 's5', label: 'Section 5 — disambiguation' } },
]

export default function RecapW7() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 2 · Week 7 · Behavioral Patterns I</div>
        <h1>Week 7 Recap:<br />Behavioral Patterns I</h1>
        <p>Days 31–35 in one place: how objects share work and talk — Strategy, Observer, Command, State,
           Template Method. The Strategy-vs-State and Template-vs-Strategy distinctions are the exam.
           Cheat-sheet, rapid review, recap quiz.</p>
        <div className="chips">
          {['Strategy', 'Observer', 'Command', 'State', 'Template Method'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  BEHAVIORAL PATTERNS I — how objects interact & share responsibility

  Strategy         swap an ALGORITHM behind one interface (set once)    Day 31
  Observer         publish/subscribe; react to change, never poll        Day 32
  Command          package a REQUEST as an object (queue/undo/macro)     Day 33
  State            behavior changes with state; states swap THEMSELVES   Day 34
  Template Method  fixed SKELETON, subclasses fill the steps            Day 35

  Twin alert:  Strategy vs State — same shape, but Strategy is chosen
               from OUTSIDE and stays; State transitions ITSELF.
               Template Method (inheritance) vs Strategy (composition).`} />
        <Note><strong>Why this matters:</strong> these five are the workhorses of real designs — the elevator
          (Strategy), the parking boards (Observer), undo systems (Command), the vending machine (State), and
          framework callbacks (Template Method) all live in Month 3.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 31 · Strategy</h3>
        <ul>
          <li><strong>Intent:</strong> swap an interchangeable algorithm behind one interface; the context holds a strategy.</li>
          <li><strong>Division:</strong> context = WHEN + data; strategy = HOW. A selection switch inside the context is the smell it removes.</li>
          <li><strong>Java:</strong> <C>Comparator</C> is the poster child; lambdas make strategies one-liners.</li>
          <li><strong>vs others:</strong> chosen once from outside (vs State); composition (vs Template Method). Corners: stateless sharing, Null Object, enum-strategy.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 32 · Observer</h3>
        <ul>
          <li><strong>Intent:</strong> a subject notifies subscribers of change; they react. Never poll.</li>
          <li><strong>Push vs pull:</strong> send the data in the event (push) or let observers query (pull). Immutable event records are clean.</li>
          <li><strong>Java:</strong> GUI listeners, Spring events, <C>java.util.concurrent.Flow</C> (legacy <C>Observable</C> deprecated).</li>
          <li><strong>Hazards:</strong> isolate observer exceptions; remove lapsed listeners (leak); iterate a safe copy / <C>CopyOnWriteArrayList</C> (CME); watch reentrancy &amp; event-soup.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 33 · Command</h3>
        <ul>
          <li><strong>Intent:</strong> reify a request as an object so it can be queued, logged, or undone.</li>
          <li><strong>Four roles:</strong> Command · Receiver (does the work) · Invoker (triggers, stays ignorant) · Client (wires them).</li>
          <li><strong>Powers:</strong> macros (composite command), kitchen queue (Runnable/executor), two-stack undo/redo (inverse op or Memento snapshot), event sourcing.</li>
          <li><strong>Trap:</strong> the fat command that becomes the receiver; impossible-undo (use a snapshot then).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 34 · State</h3>
        <ul>
          <li><strong>Intent:</strong> an object\'s behavior changes with its state; one class per state.</li>
          <li><strong>States name successors</strong> (<C>context.setState(...)</C>); the context just delegates — no <C>switch(state)</C>.</li>
          <li><strong>Cures the switch-grid disease;</strong> adding a state = adding a class.</li>
          <li><strong>Ladder:</strong> ifs → enum+guards → State classes → statechart. Climb when per-state behavior multiplies. vs Strategy: states transition themselves.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 35 · Template Method</h3>
        <ul>
          <li><strong>Intent:</strong> a <C>final</C> template defines the fixed steps; subclasses fill abstract steps / override hooks.</li>
          <li><strong>Hollywood Principle:</strong> "don\'t call us, we\'ll call you" — the base controls the flow.</li>
          <li><strong>Parts:</strong> the template (final) · private invariant steps · protected abstract blanks · optional hooks.</li>
          <li><strong>vs Strategy:</strong> inheritance + compile-time (vs composition + runtime). Java: <C>JdbcTemplate</C> (template callback). Trap: calling overridable steps from the constructor (half-built object).</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 The week in one table</h2>
        <table className="matrix">
          <thead><tr><th>pattern</th><th>varies</th><th>mechanism / tell</th></tr></thead>
          <tbody>
            <tr><td>Strategy</td><td>the algorithm</td><td>composition; set once from outside</td></tr>
            <tr><td>Observer</td><td>who reacts to change</td><td>subject publishes; subscribers react</td></tr>
            <tr><td>Command</td><td>the request itself</td><td>reified request; queue/undo/macro</td></tr>
            <tr><td>State</td><td>behavior per mode</td><td>one class per state; self-transitions</td></tr>
            <tr><td>Template Method</td><td>steps of a fixed flow</td><td>inheritance; base calls your hooks</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>Strategy = swap HOW (chosen from outside, fixed).</strong></li>
          <li><strong>Observer = publish, don\'t poll.</strong></li>
          <li><strong>Command = a request you can store, queue, and undo.</strong></li>
          <li><strong>State = one class per mode; states pick the next state.</strong></li>
          <li><strong>Template Method = base owns the flow, you fill the blanks (Hollywood).</strong></li>
          <li><strong>Strategy vs State:</strong> set-from-outside vs swaps-itself.</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps &amp; disambiguations</h2>
        <Warn><strong>Strategy vs State.</strong> Same structure; Strategy is chosen once and stays, State transitions itself in response to events.</Warn>
        <Warn><strong>Selection switch inside a Strategy context.</strong> Move the choice out (a registry/factory); the context shouldn\'t pick.</Warn>
        <Warn><strong>Observer leaks &amp; CME.</strong> Unsubscribe lapsed listeners; iterate a copy / CopyOnWriteArrayList; isolate observer exceptions.</Warn>
        <Warn><strong>Switch-grid disease.</strong> A switch on the same mode in every method = use the State pattern.</Warn>
        <Warn><strong>Template Method vs Strategy.</strong> Inheritance/skeleton vs composition/whole-algorithm — don\'t conflate.</Warn>
        <Warn><strong>Calling overridable steps from a constructor.</strong> The subclass is half-built — defer the template call.</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Name the behavioral pattern before revealing:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across the week.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 7 revised?</strong> These five are the workhorses you\'ll deploy all through Month 3\'s
        classic problems.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 8 · Recap</strong> — behavioral patterns II (completes the GoF catalog).
      </div>
    </div>
  )
}
