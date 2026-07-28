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
      <div className="ptitle">Rapid review · recall the idea before you read the answer</div>
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
  { q: 'Two methods look identical today but belong to different actors (tax vs shipping). DRY them up?', o: ['Yes — extract a shared method', 'No — that\'s FALSE duplication; they change for different reasons and will diverge'], a: 1,
    why: 'DRY is about a single source of KNOWLEDGE, not identical code. Code that looks the same but serves different actors is coincidental duplication — coupling them creates a fragile shared method. Apply DRY on the third REAL repeat (rule of three).' },
  { q: 'order.getCustomer().getAddress().getCity() — what rule does this break?', o: ['DRY', 'Law of Demeter (talk to friends, not strangers)', 'KISS', 'YAGNI'], a: 1,
    why: 'A train wreck: reaching THROUGH objects couples you to their internals and cascades nulls. Tell, Don\'t Ask: order.shipCity() (the order asks its own collaborators). Note: fluent builders/streams are not LoD violations — they return the same/value type.' },
  { q: 'Two modules share a global mutable variable. Where on the coupling ladder?', o: ['Data coupling (best)', 'Common coupling (bad) — shared global state', 'Interface coupling'], a: 1,
    why: 'Coupling ladder, worst→best: content → common (shared globals) → control (flag args) → data (plain params) → interface. Shared mutable globals are near the bottom; aim for passing data/interfaces.' },
  { q: 'You store an order status as the String "SHIPPED". Better?', o: ['Keep the String', 'An enum OrderStatus { ... } — fixed set, compiler-checked, no typos', 'An int code'], a: 1,
    why: 'Magic strings invite "SHIPED" typos and have no fixed domain. An enum is a closed set the compiler enforces; Java enums can even carry per-constant behavior. (Don\'t persist ordinal() — reordering breaks it.)' },
  { q: 'Should 950.0 (a price) be a double passed around everywhere?', o: ['Yes', 'No — wrap it in a Money value object (BigDecimal + currency, equals/hashCode) to avoid float drift and unit mix-ups'], a: 1,
    why: 'Primitive obsession: a bare double loses currency, drifts (0.1 isn\'t representable), and mixes units. A small immutable Value Object (Money) makes illegal states unrepresentable and math exact.' },
  { q: 'A NullPointerException deep in a call chain is best prevented by…', o: ['try/catch everywhere', 'FAIL FAST: validate inputs at the boundary and throw a clear domain exception with context, so bad state never propagates', 'Returning null', 'Ignoring it'], a: 1,
    why: 'Fail fast: reject invalid input where it enters, with a meaningful exception (not a generic NPE three layers deep). Use checked exceptions for recoverable conditions, unchecked for programming errors; add context to the message.' },
]

const QUESTIONS = [
  { q: 'The theme of Week 4?',
    o: ['Keep code small, honest, and loosely connected: DRY/KISS/YAGNI as counterweights, low coupling + high cohesion, Law of Demeter, proper enums & exceptions, and value objects', 'Everything from Week 3 again', 'More rules for the sake of rules', 'Only about exceptions'], a: 0,
    e: 'Week 4 rounds out the fundamentals: habits that keep code minimal and clear (DRY/KISS/YAGNI), the forces behind every rule (coupling/cohesion), how objects should talk (Demeter), and how to model fixed sets, failures, and small values well.',
    w: { 1: 'It builds beyond SOLID.', 2: 'Each earns its place by reducing change-cost.', 3: 'Exceptions are one of five topics.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'DRY is really about…',
    o: ['Copy-paste being illegal', 'A single source of truth for each piece of KNOWLEDGE — beware FALSE duplication (same code, different actors) and apply on the third real repeat (rule of three)', 'Never writing similar-looking code', 'Short files'], a: 1,
    e: 'DRY targets duplicated knowledge, not duplicated characters. Code that coincidentally matches but changes for different reasons should stay separate. Premature DRY couples unrelated things.',
    w: { 0: 'Some duplication is correct.', 2: 'Similar-looking ≠ same knowledge.', 3: 'File length is unrelated.' },
    r: { id: 's2', label: 'Section 2 — Day 16' } },
  { q: 'KISS and YAGNI together push you to…',
    o: ['Use the cleverest solution', 'Add every feature now', 'Prefer the simplest thing that works and DON\'T build for speculative future needs — add the seam when a real second case appears, not before', 'Write more abstractions upfront'], a: 2,
    e: 'KISS: clear beats clever. YAGNI: you aren\'t gonna need it — speculative generality is waste and risk. Build proven seams, not imagined ones (the counterweight to over-applying OCP).',
    w: { 0: 'Clever is a KISS violation.', 1: 'YAGNI says the opposite.', 3: 'Upfront abstractions are the speculation YAGNI warns against.' },
    r: { id: 's2', label: 'Section 2 — Day 16' } },
  { q: 'Coupling and cohesion — the goal?',
    o: ['Both low', 'High coupling, low cohesion', 'LOW coupling (modules depend on each other minimally, via data/interfaces) + HIGH cohesion (each module\'s parts serve one clear purpose)', 'Both high'], a: 2,
    e: 'The two forces behind every design rule. Low coupling shrinks blast radius; high cohesion means a class is about one thing. Smells: shotgun surgery (one change, many files = high coupling), divergent change & junk-drawer Utils (low cohesion).',
    w: { 0: 'Low cohesion is bad.', 1: 'That\'s the worst case.', 3: 'High coupling is bad.' },
    r: { id: 's2', label: 'Section 2 — Day 17' } },
  { q: 'The Law of Demeter says a method should only talk to…',
    o: ['Any object it can reach', 'Only static methods', 'The database', 'Its immediate "friends": this, its own fields, its parameters, and objects it creates — not strangers reached by chaining through others'], a: 3,
    e: 'Talk to friends, not strangers. a.getB().getC().doX() reaches through B to a stranger C — coupling you to B\'s internals and cascading nulls. Tell, Don\'t Ask: let a do it. (Fluent/stream chains returning the same/value type are fine — it\'s not dot-counting.)',
    w: { 0: 'That\'s exactly the train-wreck it forbids.', 1: 'Unrelated.', 2: 'Unrelated.' },
    r: { id: 's2', label: 'Section 2 — Day 18' } },
  { q: 'Why model a fixed set (order statuses, directions) as an enum, not strings/ints?',
    o: ['Strings are faster', 'Ints use less memory', 'Enums are shorter', 'A closed, compiler-checked domain: no typos, exhaustive switches, and Java enums can carry per-constant behavior/state — but never persist ordinal() (reordering breaks it)'], a: 3,
    e: 'Enums make a fixed set explicit and type-safe; the compiler catches a missing case. They can even be mini state machines (per-constant methods). The ordinal trap: storing the position breaks if constants are reordered.',
    w: { 0: 'Speed is irrelevant.', 1: 'Memory is irrelevant.', 2: 'Brevity isn\'t the win — safety is.' },
    r: { id: 's2', label: 'Section 2 — Day 19' } },
  { q: 'An Entity vs a Value Object — the distinction?',
    o: ['Entities are immutable', 'An Entity has identity that persists through change (a Customer #42); a Value Object is defined entirely by its values and is immutable (Money ₹50 == any other ₹50) with equals/hashCode by value', 'No difference', 'VOs are bigger'], a: 1,
    e: 'Banknote (VO — interchangeable by value) vs passport (Entity — identity matters). VOs are small, immutable, compared by value (records fit perfectly), and cure primitive obsession (Money, Address, DateRange). Parse, don\'t validate.',
    w: { 0: 'Entities usually change over time.', 2: 'They model different things.', 3: 'VOs are typically small.' },
    r: { id: 's2', label: 'Section 2 — Day 20' } },
  { q: 'Checked vs unchecked exceptions — the guidance?',
    o: ['Checked for recoverable conditions the caller should handle; unchecked (RuntimeException) for programming errors/bugs — and always fail fast with a clear, context-rich domain exception', 'Always unchecked', 'Always checked', 'Never throw'], a: 0,
    e: 'Model failures deliberately: a domain exception with context beats a generic NPE deep in the stack. Validate at the boundary (fail fast); don\'t swallow exceptions or use them for control flow.',
    w: { 1: 'Unchecked-everywhere loses recoverable signaling.', 2: 'Checked-everywhere is noisy and often wrong for bugs.', 3: 'Failures must be signaled.' },
    r: { id: 's2', label: 'Section 2 — Day 19' } },
]

export default function RecapW4() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 1 · Week 4 · Beyond SOLID</div>
        <h1>Week 4 Recap:<br />Small, Honest, Loosely Coupled</h1>
        <p>Days 16–20 in one place: the habits that keep code minimal (DRY/KISS/YAGNI), the two forces behind
           every rule (coupling &amp; cohesion), how objects should talk (Demeter), and how to model fixed sets,
           failures, and small values. Cheat-sheet, rapid review, recap quiz — and the end of Month 1.</p>
        <div className="chips">
          {['DRY/KISS/YAGNI', 'coupling & cohesion', 'Law of Demeter', 'enums & exceptions', 'value objects'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  WEEK 4 — finishing the fundamentals

  ① DRY / KISS / YAGNI   one source of knowledge · simplest thing ·         Day 16
        │                 don't build for imagined futures (SOLID's counterweight)
        ▼
  ② COUPLING & COHESION  LOW coupling + HIGH cohesion = the forces           Day 17
        │                 behind every other rule (blast radius vs focus)
        ▼
  ③ LAW OF DEMETER       talk to friends, not strangers; Tell Don't Ask     Day 18
        ▼
  ④ ENUMS & EXCEPTIONS   model fixed sets (enums) & failures (fail fast,     Day 19
        │                 domain exceptions, checked vs unchecked) properly
        ▼
  ⑤ VALUE OBJECTS        small immutable types (Money, Address) cure          Day 20
                         primitive obsession; equals/hashCode by value`} />
        <Note><strong>The throughline:</strong> these reduce the COST OF CHANGE — less duplicated knowledge,
          fewer connections, clearer talk, illegal states made unrepresentable. They\'re the everyday discipline
          that makes SOLID and patterns pay off.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 16 · DRY, KISS &amp; YAGNI</h3>
        <ul>
          <li><strong>DRY = one source of KNOWLEDGE</strong> (not "no similar-looking code"). Beware FALSE duplication (same code, different actors).</li>
          <li><strong>Rule of three:</strong> abstract on the third real repeat, not the first.</li>
          <li><strong>KISS:</strong> clear beats clever; the simplest thing that works.</li>
          <li><strong>YAGNI:</strong> don\'t build speculative seams — add them when a real second case appears. (The counterweight to over-applying OCP.)</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 17 · Coupling &amp; Cohesion</h3>
        <ul>
          <li><strong>Low coupling + high cohesion</strong> — the two forces behind every design rule.</li>
          <li><strong>Coupling ladder (worst→best):</strong> content → common (shared globals) → control (flag args) → data (plain params) → interface.</li>
          <li><strong>Cohesion ladder (worst→best):</strong> coincidental → … → functional (everything serves one purpose).</li>
          <li><strong>Smells:</strong> shotgun surgery (one change touches many files = high coupling); divergent change &amp; junk-drawer <C>Utils</C> (low cohesion).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 18 · Law of Demeter</h3>
        <ul>
          <li><strong>Talk to friends, not strangers:</strong> use <C>this</C>, your fields, your parameters, and objects you create — not objects reached by chaining through others.</li>
          <li><strong>Train wreck:</strong> <C>a.getB().getC().doX()</C> couples you to B\'s internals and cascades nulls (and forces mock-of-mock tests).</li>
          <li><strong>Tell, Don\'t Ask</strong> + watch for feature envy (a method more interested in another object\'s data).</li>
          <li><strong>Nuance:</strong> fluent builders, streams, and value chains are NOT violations — it\'s not dot-counting.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 19 · Enums &amp; Exception Design</h3>
        <ul>
          <li><strong>Enums for fixed sets:</strong> compiler-checked, no magic-string typos, exhaustive switches; can carry per-constant behavior (mini state machines).</li>
          <li><strong>Ordinal trap:</strong> never persist/rely on <C>ordinal()</C> — reordering constants silently breaks it.</li>
          <li><strong>Exceptions:</strong> the Throwable tree; <strong>checked</strong> for recoverable conditions, <strong>unchecked</strong> for programming errors.</li>
          <li><strong>Fail fast</strong> at the boundary with a clear DOMAIN exception carrying context — don\'t swallow exceptions or use them for control flow.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 20 · Value Objects</h3>
        <ul>
          <li><strong>Entity vs Value Object:</strong> entity has lasting identity (Customer #42); a VO is defined by its values and is immutable (any ₹50 == any ₹50).</li>
          <li><strong>Cure primitive obsession:</strong> wrap <C>double</C> money/strings into <C>Money</C>, <C>Address</C>, <C>DateRange</C> — illegal states become unrepresentable.</li>
          <li><strong>Money:</strong> BigDecimal + currency, guarded; <C>equals</C> + <C>hashCode</C> by value (records fit perfectly, with compact constructors for validation).</li>
          <li><strong>Parse, don\'t validate:</strong> turn raw input into a valid typed value once, at the edge.</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 The week in one table</h2>
        <table className="matrix">
          <thead><tr><th>idea</th><th>the one thing to remember</th></tr></thead>
          <tbody>
            <tr><td>DRY</td><td>one source of knowledge; beware false (coincidental) duplication</td></tr>
            <tr><td>KISS / YAGNI</td><td>simplest thing; don\'t build for imagined futures</td></tr>
            <tr><td>coupling</td><td>low is the goal; ladder content→common→control→data→interface</td></tr>
            <tr><td>cohesion</td><td>high is the goal; one class, one clear purpose</td></tr>
            <tr><td>Law of Demeter</td><td>talk to friends, not strangers; Tell Don\'t Ask</td></tr>
            <tr><td>enums</td><td>closed, type-safe sets; never persist ordinal()</td></tr>
            <tr><td>exceptions</td><td>fail fast, domain exception with context; checked=recoverable</td></tr>
            <tr><td>value objects</td><td>small, immutable, equals-by-value; cure primitive obsession</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>DRY is about knowledge, not keystrokes.</strong></li>
          <li><strong>Rule of three</strong> — wait for the third real repeat.</li>
          <li><strong>YAGNI beats "might need it later".</strong></li>
          <li><strong>Low coupling, high cohesion</strong> — every rule serves these two.</li>
          <li><strong>Talk to friends, not strangers</strong> (and Tell, Don\'t Ask).</li>
          <li><strong>Fixed set → enum; bad input → fail fast with a domain exception.</strong></li>
          <li><strong>Money is not a double.</strong> Wrap small values; compare by value.</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps to never repeat</h2>
        <Warn><strong>Over-DRYing coincidental duplication.</strong> Coupling code that only LOOKS the same (different actors) makes a fragile shared method. Wait for real, repeated knowledge.</Warn>
        <Warn><strong>Speculative abstraction (YAGNI).</strong> Building seams for futures that never arrive — clutter and risk. Add on the second real case.</Warn>
        <Warn><strong>Train wrecks.</strong> <C>a.getB().getC()...</C> couples to internals and cascades nulls. Tell, Don\'t Ask.</Warn>
        <Warn><strong>Magic strings/ints for fixed sets.</strong> Typos and no domain. Use enums.</Warn>
        <Warn><strong>Persisting <C>ordinal()</C>.</strong> Reordering enum constants silently corrupts stored data — store the name.</Warn>
        <Warn><strong>Swallowing exceptions / generic NPEs.</strong> Fail fast at the boundary with context. Don\'t use exceptions for control flow.</Warn>
        <Warn><strong>Primitive obsession.</strong> A bare double for money drifts and mixes units. Use a Money value object.</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Name the idea (and the fix) before revealing:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across the week.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 4 revised?</strong> That completes <strong>Month 1 — the OOP &amp; design fundamentals</strong>.
        You now have the grammar (Week 1), the modeling (Week 2), the principles (Week 3), and the everyday
        discipline (Week 4) that every design pattern and classic problem builds on.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 5 · Recap</strong> — the creational design patterns.
      </div>
    </div>
  )
}
