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
  { q: 'You need exactly one instance, reachable globally, created safely under threads. Pattern?', o: ['Singleton', 'Factory', 'Builder'], a: 0,
    why: 'Singleton: private constructor + a controlled accessor. The safe-and-simple implementations are the holder idiom and the ENUM singleton (reflection- and serialization-proof). But prefer wiring ONE instance via DI at the composition root over getInstance() everywhere.' },
  { q: 'A method should create an object but let SUBCLASSES decide which concrete class. Pattern?', o: ['Abstract Factory', 'Factory Method', 'Prototype'], a: 1,
    why: 'Factory Method: a creator class with an overridable createX() hook; subclasses pick the concrete product via dynamic dispatch. A "simple factory" (one contained switch) is the lighter cousin; Abstract Factory makes whole FAMILIES.' },
  { q: 'You must create matching FAMILIES of products (a themed Button + Checkbox + Dialog). Pattern?', o: ['Factory Method', 'Abstract Factory', 'Builder'], a: 1,
    why: 'Abstract Factory = a kit of factory methods producing a consistent family. Trade-off: adding a family member (new theme) is cheap; adding a new product TYPE is expensive (touch every factory).' },
  { q: 'A class has 8 optional fields and telescoping constructors are a mess. Pattern?', o: ['Builder', 'Prototype', 'Singleton'], a: 0,
    why: 'Builder: a fluent step-by-step assembler with a build() gate producing an immutable product — beats telescoping constructors and the half-built JavaBeans (setter) approach. Overkill for a couple of fields.' },
  { q: 'Constructing an object is expensive; you want copies of a configured one. Pattern?', o: ['Prototype', 'Factory Method', 'Singleton'], a: 0,
    why: 'Prototype: clone an existing configured instance instead of rebuilding it. In Java prefer a COPY CONSTRUCTOR over Cloneable (a broken marker interface: no constructor runs, shallow by default). Immutable objects need no copy at all.' },
  { q: 'Java\'s Integer.valueOf(127) returns a cached object. Which idea is that?', o: ['Builder', 'A static factory method (with caching) — Factory family', 'Prototype'], a: 1,
    why: 'Static factory methods (of/valueOf/getInstance) can name themselves, cache, and return subtypes — JDK sightings of the factory idea. Integer caches −128..127; List.of/Map.of are static factories too.' },
]

const QUESTIONS = [
  { q: 'What do all five CREATIONAL patterns share?',
    o: ['They make code faster', 'They control HOW objects are created — hiding/centralizing construction so client code depends on abstractions, not on new ConcreteClass()', 'They are the same pattern', 'They replace constructors entirely'], a: 1,
    e: 'Creational patterns put the knowledge of WHAT to instantiate behind a seam: Singleton (one), Factory Method/Abstract Factory (which/family), Builder (how, step by step), Prototype (clone). All reduce coupling to concrete classes.',
    w: { 0: 'They\'re about structure/coupling, not speed.', 2: 'Five distinct intents.', 3: 'They wrap construction, not abolish it.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'The safest, simplest Singleton implementations?',
    o: ['Eager static field only', 'The holder idiom (lazy, thread-safe via class loading) and the ENUM singleton (also reflection- and serialization-proof) — and double-checked locking REQUIRES volatile', 'Plain lazy init', 'A global variable'], a: 1,
    e: 'Naive lazy init has a check-then-act race; synchronized is slow; DCL needs volatile to be correct. The holder idiom and enum sidestep all of it. Best of all: avoid getInstance() — wire one instance via DI.',
    w: { 0: 'Eager works but isn\'t lazy; not the "safest+lazy" answer.', 2: 'Plain lazy is racy.', 3: 'A global is the anti-pattern Singleton is criticized for becoming.' },
    r: { id: 's2', label: 'Section 2 — Day 21' } },
  { q: 'Factory Method vs Abstract Factory?',
    o: ['Same thing', 'Factory Method = ONE product via an overridable hook (subclass decides the concrete type); Abstract Factory = a FAMILY of related products via a kit of factory methods (consistency by construction)', 'Abstract Factory is older', 'Factory Method makes families'], a: 1,
    e: 'One product vs a family. Factory Method uses inheritance (the createX hook); Abstract Factory composes several factory methods so a whole family stays consistent (all "dark theme" widgets).',
    w: { 0: 'Different scope.', 2: 'Age is irrelevant.', 3: 'That\'s Abstract Factory\'s job.' },
    r: { id: 's2', label: 'Section 2 — Days 22-23' } },
  { q: 'Abstract Factory\'s key trade-off?',
    o: ['It is always free to extend', 'Adding a new family MEMBER (theme) is cheap; adding a new product TYPE is expensive — every factory must gain a method', 'It can\'t make families', 'It needs reflection'], a: 1,
    e: 'The two-axis cost: family axis is cheap (new factory implementing the interface), product-type axis is expensive (change the interface + all factories). Choose it when families are the thing that varies.',
    w: { 0: 'One axis is expensive.', 2: 'Families are its purpose.', 3: 'No reflection needed.' },
    r: { id: 's2', label: 'Section 2 — Day 23' } },
  { q: 'The Effective Java Builder beats telescoping constructors AND JavaBeans setters because…',
    o: ['It is shorter', 'It is readable for many (optional) params AND produces an IMMUTABLE product — no half-built object (JavaBeans) and no positional/boolean-swap bugs (telescoping)', 'It avoids all constructors', 'It is required by records'], a: 1,
    e: 'Telescoping = unreadable positional args and boolean-swap bugs; JavaBeans = a mutable, temporarily-invalid object. The fluent Builder validates in build() and returns an immutable instance. Records cover the simple cases.',
    w: { 0: 'It\'s often longer — the win is safety/readability.', 2: 'It uses a private constructor.', 3: 'Records and builders are complementary.' },
    r: { id: 's2', label: 'Section 2 — Day 24' } },
  { q: 'Why prefer a copy constructor over Cloneable in Java?',
    o: ['Cloneable is faster', 'Cloneable is a broken marker interface: clone() runs NO constructor, is shallow by default, and is awkward to override correctly — a copy constructor (new Foo(other)) is explicit and safe', 'Copy constructors are required', 'They are identical'], a: 1,
    e: 'Cloneable doesn\'t even declare clone(); the default is a shallow field copy bypassing constructors. A copy constructor (or static copyOf) is clear, controls depth, and runs validation. Immutable objects need neither.',
    w: { 0: 'Speed isn\'t the issue — correctness/clarity is.', 2: 'Neither is required.', 3: 'They differ sharply in safety.' },
    r: { id: 's2', label: 'Section 2 — Day 25' } },
  { q: 'Shallow vs deep copy matters when the object holds…',
    o: ['Only primitives', 'Mutable REFERENCE fields — a shallow copy shares them (both copies see mutations); a deep copy clones them too. Immutable fields can be shared safely', 'A name', 'Nothing'], a: 1,
    e: 'Shallow copies the top level but shares referenced mutable objects (aliasing). Deep-copy mutable members; immutable members (String, Integer, your VOs) are safe to share — which is why immutability removes the whole problem.',
    w: { 0: 'Primitives copy by value — no issue.', 2: 'Strings are immutable.', 3: 'It matters with mutable refs.' },
    r: { id: 's2', label: 'Section 2 — Day 25' } },
  { q: 'The recurring criticism of Singleton (and the modern alternative)?',
    o: ['It is too fast', 'It is global mutable state — hard to test, hidden coupling; prefer wiring ONE instance via dependency injection at the composition root instead of getInstance() everywhere', 'It uses too much memory', 'It can\'t be lazy'], a: 1,
    e: 'getInstance() is a hidden global dependency that fights testing and obscures the object graph. "Oneness" is better achieved by creating one instance and injecting it — same singularity, no global access.',
    w: { 0: 'Speed isn\'t the criticism.', 2: 'One object isn\'t a memory problem.', 3: 'It can be lazy (holder idiom).' },
    r: { id: 's2', label: 'Section 2 — Day 21' } },
]

export default function RecapW5() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 2 · Week 5 · Creational Patterns</div>
        <h1>Week 5 Recap:<br />Creational Patterns</h1>
        <p>Days 21–25 in one place: the five GoF creational patterns — how to control object creation so client
           code depends on abstractions, not <C>new ConcreteClass()</C>. Cheat-sheet, rapid review, recap quiz.</p>
        <div className="chips">
          {['Singleton', 'Factory Method', 'Abstract Factory', 'Builder', 'Prototype'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  CREATIONAL PATTERNS — control HOW objects are made

  Singleton          exactly ONE instance, controlled access            Day 21
  Factory Method     a hook lets subclasses choose the concrete type    Day 22
  Abstract Factory   a kit that makes a consistent FAMILY of products   Day 23
  Builder            assemble a complex/immutable object step by step    Day 24
  Prototype          CLONE a configured instance instead of rebuilding  Day 25

  Escalation: new → simple factory (a switch) → Factory Method (a hook)
              → Abstract Factory (families). Climb only when variation demands it.
  All hide construction so clients depend on abstractions, not concretes.`} />
        <Note><strong>Why this matters:</strong> creational patterns are SOLID applied to construction — DIP
          (depend on abstractions) and OCP (add a product without editing clients). They\'re the seams the rest
          of the patterns plug into.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 21 · Singleton</h3>
        <ul>
          <li><strong>Intent:</strong> one instance, one controlled access point (private ctor + accessor).</li>
          <li><strong>The race:</strong> naive lazy init is check-then-act; synchronized is slow; double-checked locking needs <C>volatile</C>.</li>
          <li><strong>Safe idioms:</strong> the <strong>holder</strong> (lazy via class-load) and the <strong>enum</strong> singleton (reflection- &amp; serialization-proof).</li>
          <li><strong>Criticism + modern take:</strong> it\'s global mutable state (hard to test). Prefer ONE instance wired via DI at the composition root over <C>getInstance()</C> everywhere.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 22 · Factory Method</h3>
        <ul>
          <li><strong>Intent:</strong> defer WHICH concrete class to create to a subclass via an overridable <C>createX()</C> hook (dynamic dispatch).</li>
          <li><strong>Simple factory</strong> (one contained switch) is the lighter, non-GoF cousin — fine when small.</li>
          <li><strong>JDK:</strong> static factory methods (<C>of</C>/<C>valueOf</C>/<C>getInstance</C>) — can name themselves, cache (Integer −128..127), return subtypes.</li>
          <li><strong>Traps:</strong> factory-itis (a factory for everything) and parallel hierarchies.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 23 · Abstract Factory</h3>
        <ul>
          <li><strong>Intent:</strong> create FAMILIES of related products with consistency by construction (themed Button + Checkbox + Dialog).</li>
          <li><strong>Structure:</strong> a kit of factory methods on one factory interface; each concrete factory = one family.</li>
          <li><strong>Trade-off:</strong> new family member = cheap (new factory); new product TYPE = expensive (change interface + every factory).</li>
          <li><strong>Everyday use:</strong> a test-kit <C>ServiceFactory</C> swapping real vs fake collaborators.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 24 · Builder</h3>
        <ul>
          <li><strong>Intent:</strong> construct a complex object step by step; produce an IMMUTABLE product.</li>
          <li><strong>Beats:</strong> telescoping constructors (positional/boolean-swap bugs) and JavaBeans setters (mutable, half-built).</li>
          <li><strong>Effective Java form:</strong> nested static Builder, fluent <C>return this</C>, validation in <C>build()</C>.</li>
          <li><strong>JDK:</strong> StringBuilder, Stream.Builder. Records cover the simple cases; GoF Director is a footnote.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 25 · Prototype</h3>
        <ul>
          <li><strong>Intent:</strong> clone a configured instance when construction is expensive.</li>
          <li><strong>Cloneable is a minefield:</strong> marker interface, no constructor runs, shallow by default.</li>
          <li><strong>Java way:</strong> a COPY CONSTRUCTOR (<C>new Foo(other)</C>) or static <C>copyOf</C> — explicit, controls depth, validates.</li>
          <li><strong>Shallow vs deep:</strong> deep-copy mutable reference fields; immutable fields are safe to share (immutability removes the problem). A prototype registry is a template drawer.</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 The week in one table</h2>
        <table className="matrix">
          <thead><tr><th>pattern</th><th>intent</th><th>key gotcha</th></tr></thead>
          <tbody>
            <tr><td>Singleton</td><td>one instance, controlled access</td><td>lazy race / global state — prefer DI</td></tr>
            <tr><td>Factory Method</td><td>subclass chooses the concrete product</td><td>factory-itis; simple factory often enough</td></tr>
            <tr><td>Abstract Factory</td><td>a consistent FAMILY of products</td><td>new product type is expensive</td></tr>
            <tr><td>Builder</td><td>step-by-step, immutable product</td><td>overkill for few params</td></tr>
            <tr><td>Prototype</td><td>clone instead of construct</td><td>Cloneable shallow trap — use copy ctor</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>Singleton:</strong> enum/holder for safety; DI beats getInstance().</li>
          <li><strong>Factory Method = one product via a hook; Abstract Factory = a family via a kit.</strong></li>
          <li><strong>Abstract Factory:</strong> families cheap, new product types costly.</li>
          <li><strong>Builder</strong> for many optional params → immutable result.</li>
          <li><strong>Prototype:</strong> copy constructor, not Cloneable; deep-copy only mutable refs.</li>
          <li><strong>Static factory methods</strong> (of/valueOf) name + cache — JDK everywhere.</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps &amp; disambiguations</h2>
        <Warn><strong>Singleton as a global variable.</strong> getInstance() sprinkled everywhere is hidden coupling and untestable. Wire one instance via DI.</Warn>
        <Warn><strong>Lazy Singleton without correct synchronization.</strong> Naive lazy init races; DCL needs volatile. Use the holder/enum idiom.</Warn>
        <Warn><strong>Factory-itis.</strong> Not everything needs a factory. <C>new</C> is fine until the creation knowledge actually varies/spreads.</Warn>
        <Warn><strong>Choosing Abstract Factory when product types keep changing.</strong> That axis is expensive — it shines only when FAMILIES vary.</Warn>
        <Warn><strong>Builder for two fields.</strong> Overkill — a constructor or record is clearer.</Warn>
        <Warn><strong>Relying on Cloneable.</strong> Shallow, constructor-skipping, error-prone. Copy constructor instead; or make the type immutable and skip copying.</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Name the creational pattern before revealing:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across the week.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 5 revised?</strong> You can now control object creation behind abstractions — the seams
        structural and behavioral patterns plug into.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 6 · Recap</strong> — structural patterns.
      </div>
    </div>
  )
}
