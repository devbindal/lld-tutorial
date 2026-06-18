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
      <div className="ptitle">Rapid review · recall the concept before you read the answer</div>
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
  { q: 'A Car HAS an Engine that is built with it and dies with it. Which relationship?', o: ['Association (knows-a)', 'Aggregation (has-a, shared)', 'Composition (part-of, owned)'], a: 2,
    why: 'Composition = the part\'s lifecycle is bound to the whole (engine created with the car, gone when the car is). UML: a FILLED diamond ◆. Aggregation (hollow ◇) is for shared parts that outlive the whole (e.g. a Team and Players).' },
  { q: 'A method takes a Logger as a parameter and uses it locally. That is…', o: ['Inheritance', 'Composition', 'A dependency (uses-a)'], a: 2,
    why: 'uses-a = a transient dependency (parameter, local, or return type) — the weakest coupling. Composition is a long-lived has-a field; inheritance is is-a.' },
  { q: 'In a UML class box, an underlined member means…', o: ['private', 'static', 'abstract', 'final'], a: 1,
    why: 'Underline = static (belongs to the class). Italics = abstract. Visibility uses symbols: + public, − private, # protected, ~ package.' },
  { q: 'In a sequence diagram, the activation bar on a lifeline represents…', o: ['A field', 'That the object is active on the call stack (executing/awaiting a return)', 'A loop', 'A comment'], a: 1,
    why: 'The thin rectangle = the period the object is doing work / on the call stack. Synchronous calls are solid arrows; returns are dashed; alt/opt/loop are fragment boxes.' },
  { q: 'Turning requirements into entities, the word "the system shall notify the user" — "the system" is…', o: ['A class', 'An attribute', 'Ignored (a vague god-noun, not an entity)'], a: 2,
    why: 'Filter nouns: a class has identity + state + behavior; an attribute is just data; "the system / the application" is a vague catch-all you ignore (modeling it is the god-class trap). "notify" is a verb → a method; "user" is a class.' },
  { q: 'You need to reuse behavior across unrelated classes. Inheritance or composition?', o: ['Inheritance — extend a shared base', 'Composition — delegate to an injected collaborator'], a: 1,
    why: 'Composition over inheritance: deep/forced hierarchies are fragile (fragile base class) and explode combinatorially. Delegate to a has-a collaborator (ideally behind an interface) — reuse without the is-a lie.' },
]

const QUESTIONS = [
  { q: 'The one-line arc of Week 2?',
    o: ['Draw lots of diagrams', 'Model how objects RELATE (association/aggregation/composition), prefer composition over inheritance, DRAW it (class + sequence UML), and DERIVE entities from requirements via noun-verb analysis', 'Inheritance solves everything', 'UML is mandatory in all code'], a: 1,
    e: 'Week 2 turns words into a design: relationships → composition-first reuse → UML to communicate it → requirements-to-entities to start it.',
    w: { 0: 'Diagrams are a tool for thinking/communicating, not the goal.', 2: 'Composition usually beats inheritance (Day 7).', 3: 'UML is a communication aid, used as needed.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'Aggregation vs composition — the deciding test?',
    o: ['Aggregation is bigger', 'Does the PART share/outlive the whole (aggregation, hollow ◇) or is it owned and die with the whole (composition, filled ◆)?', 'They are identical', 'Composition has no multiplicity'], a: 1,
    e: 'Lifecycle is the test. Players outlive a Team (aggregation); an Order\'s LineItems die with the order (composition). UML: hollow vs filled diamond.',
    w: { 0: 'Size is irrelevant — lifecycle ownership decides.', 2: 'They model different ownership.', 3: 'Both carry multiplicities.' },
    r: { id: 's2', label: 'Section 2 — Day 6' } },
  { q: 'The coupling ladder, loosest to tightest?',
    o: ['Inheritance < composition < dependency', 'Dependency (uses-a) < composition/delegation < inheritance (is-a) — inheritance is the TIGHTEST coupling', 'They are all equal', 'Composition is tightest'], a: 1,
    e: 'A transient dependency couples least; a composed collaborator more; inheritance most (the subclass is bound to the base\'s internals). Prefer the loosest that does the job.',
    w: { 0: 'Reversed — inheritance is tightest.', 2: 'They differ sharply.', 3: 'Inheritance, not composition, is tightest.' },
    r: { id: 's2', label: 'Section 2 — Day 7' } },
  { q: 'The six UML class-diagram arrows include inheritance and realization. How do they differ visually?',
    o: ['They look the same', 'Both use a hollow triangle head, but inheritance (extends) is a SOLID line and realization (implements) is a DASHED line', 'Inheritance is dashed', 'Realization uses a diamond'], a: 1,
    e: 'Hollow triangle = "is-a-type-of". Solid line = class extends class; dashed line = class implements interface. (The others: association, aggregation ◇, composition ◆, dependency dashed-arrow.)',
    w: { 0: 'The line style distinguishes them.', 2: 'Inheritance is solid.', 3: 'Diamonds are for aggregation/composition.' },
    r: { id: 's2', label: 'Section 2 — Day 8' } },
  { q: 'A sequence diagram\'s "alt" fragment represents…',
    o: ['A loop', 'An if/else branch (alternative paths based on a guard)', 'Object creation', 'A return'], a: 1,
    e: 'alt = alternative branches (if/else); opt = a single optional block (if); loop = repetition. Activation bars show stack activity; «create»/X show lifecycle.',
    w: { 0: 'That\'s loop.', 2: 'That\'s «create».', 3: 'Returns are dashed arrows.' },
    r: { id: 's2', label: 'Section 2 — Day 9' } },
  { q: 'In noun-verb analysis, "Information Expert" means…',
    o: ['Hire an expert', 'Assign a responsibility to the class that already HAS the data needed to fulfill it', 'Add a Manager class', 'Make everything static'], a: 1,
    e: 'Information Expert (a GRASP principle): the object holding the relevant data should own the behavior that uses it — e.g. a Ticket with entryTime computes its own duration. It keeps logic next to its data.',
    w: { 0: '🙂 It\'s a design heuristic.', 2: 'Manager/god classes are the trap it avoids.', 3: 'Static has nothing to do with it.' },
    r: { id: 's2', label: 'Section 2 — Day 10' } },
  { q: 'A bidirectional association (both sides reference each other) mainly costs you…',
    o: ['Nothing', 'Consistency maintenance — both references must be kept in sync, and it tightens coupling; add it only when a real operation needs both directions', 'Compile errors', 'Memory only'], a: 1,
    e: 'Two-way links must be updated together (add to both sides, remove from both). Default to one direction; justify a back-pointer with a concrete use case (Day 6).',
    w: { 0: 'It has a real maintenance/coupling cost.', 2: 'It compiles fine.', 3: 'The bug risk (drift), not memory, is the cost.' },
    r: { id: 's2', label: 'Section 2 — Day 6' } },
  { q: 'The biggest requirements-modeling trap?',
    o: ['Too few classes', 'The GOD CLASS (a "Manager/System" that does everything) and over-modeling (YAGNI) — model the nouns the problem actually needs, with behavior distributed by Information Expert', 'Using enums', 'Drawing UML'], a: 1,
    e: 'Cramming all behavior into one class (or inventing entities the requirements never mention) are the twin traps. Filter nouns honestly and distribute responsibilities.',
    w: { 0: 'Too FEW well-chosen classes is fine; the trap is one doing everything.', 2: 'Enums are good for fixed sets.', 3: 'UML helps, not hurts.' },
    r: { id: 's5', label: 'Section 5 — traps' } },
]

export default function RecapW2() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 1 · Week 2 · Relationships, UML &amp; Modeling</div>
        <h1>Week 2 Recap:<br />From Words to a Design</h1>
        <p>Days 6–10 in one place: how objects relate, why composition beats inheritance, how to draw a design
           in UML (class + sequence), and how to turn a problem statement into entities. Cheat-sheet, rapid
           review, and a recap quiz.</p>
        <div className="chips">
          {['association/aggregation/composition', 'composition over inheritance', 'UML class', 'UML sequence', 'requirements → entities'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  WEEK 2: TURNING REQUIREMENTS INTO A DESIGN

  ① RELATE     how objects connect: association (knows-a) /                Day 6
        │       aggregation (has-a, shared ◇) / composition (part-of ◆)
        │       + multiplicity (1, 0..1, 1..*, *) + lifecycles
        ▼
  ② USES-A     dependency (param/local/return); prefer COMPOSITION         Day 7
        │       over inheritance (avoid fragile base class + class explosion)
        ▼
  ③ DRAW IT    UML class diagram: 3-box, visibility (+ − # ~), 6 arrows,   Day 8
        │       multiplicity, «stereotypes», underline=static, italics=abstract
        ▼
  ④ TRACE IT   UML sequence diagram: lifelines, activation = call stack,   Day 9
        │       sync/return/self messages, alt/opt/loop fragments
        ▼
  ⑤ DERIVE IT  requirements → nouns (classes/attributes) + verbs (methods) Day 10
               → FILTER (class? attribute? ignore?) → enums, Information Expert`} />
        <Note><strong>Why this matters:</strong> Week 1 gave you a single class; Week 2 connects many of them
          and teaches you to derive and communicate a whole design — the prerequisite for SOLID (Week 3) and
          every classic problem in Month 3.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 6 · Association, Aggregation &amp; Composition</h3>
        <ul>
          <li><strong>Association = knows-a</strong> (references/uses another object).</li>
          <li><strong>Aggregation = has-a, shared</strong> — parts have an INDEPENDENT lifecycle (Team ◇ Players); UML hollow diamond ◇.</li>
          <li><strong>Composition = part-of, owned</strong> — parts DIE with the whole (Order ◆ LineItems); UML filled diamond ◆.</li>
          <li><strong>The test:</strong> does the part outlive the whole? aggregation. die with it? composition.</li>
          <li><strong>Multiplicity:</strong> 1, 0..1, 1..*, * at each end. <strong>Bidirectional</strong> links must be kept in sync (a cost — justify them).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 7 · Dependency &amp; Composition over Inheritance</h3>
        <ul>
          <li><strong>uses-a = dependency</strong> (a parameter, local variable, or return type) — the weakest coupling.</li>
          <li><strong>Coupling ladder (loose→tight):</strong> dependency &lt; composition/delegation &lt; inheritance.</li>
          <li><strong>Composition over inheritance:</strong> has-a + delegate beats is-a for reuse; dodges the fragile base class and class explosion.</li>
          <li><strong>Inject interfaces</strong> for swappability (DIP preview). Use <C>extends</C> only for a true, LSP-safe is-a.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 8 · UML Class Diagrams</h3>
        <ul>
          <li><strong>3 compartments:</strong> name / fields / methods.</li>
          <li><strong>Visibility:</strong> <C>+</C> public, <C>−</C> private, <C>#</C> protected, <C>~</C> package.</li>
          <li><strong>Underline = static; italics = abstract; «interface»/«abstract» stereotypes.</strong></li>
          <li><strong>The six arrows:</strong> inheritance (hollow triangle, solid) · realization/implements (hollow triangle, dashed) · association (line) · aggregation (◇) · composition (◆) · dependency (dashed arrow).</li>
          <li><strong>Multiplicity</strong> + <strong>role names</strong> at the ends.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 9 · UML Sequence Diagrams</h3>
        <ul>
          <li><strong>Lifelines</strong> (vertical dashed) per participant; <strong>activation bars</strong> = time on the call stack.</li>
          <li><strong>Messages:</strong> synchronous (solid filled arrow), return (dashed), self-message (loop to self), «create» / destroy (X).</li>
          <li><strong>Fragments:</strong> <C>alt</C> (if/else), <C>opt</C> (if), <C>loop</C> (repeat).</li>
          <li><strong>Maps to code:</strong> the diagram is the call order — write the method calls top to bottom.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 10 · Requirements → Entities</h3>
        <ul>
          <li><strong>Noun-verb pass:</strong> nouns → candidate classes/attributes; verbs → methods.</li>
          <li><strong>Filter each noun:</strong> a class (identity + state + behavior) · an attribute (just data) · or ignore (vague/UI/"the system").</li>
          <li><strong>Enums</strong> for fixed sets; <strong>multiplicity</strong> read from wording ("a lot has many spots").</li>
          <li><strong>Information Expert:</strong> give a responsibility to the class that holds the data for it.</li>
          <li><strong>Traps:</strong> the god class ("Manager/System" does everything) and YAGNI (modeling what isn\'t asked).</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 The week in one table</h2>
        <table className="matrix">
          <thead><tr><th>concept</th><th>the one thing to remember</th></tr></thead>
          <tbody>
            <tr><td>association</td><td>knows-a — a reference/use</td></tr>
            <tr><td>aggregation ◇</td><td>has-a, shared — part outlives the whole</td></tr>
            <tr><td>composition ◆</td><td>part-of, owned — part dies with the whole</td></tr>
            <tr><td>dependency</td><td>uses-a (param/local/return) — weakest coupling</td></tr>
            <tr><td>composition over inheritance</td><td>delegate to a has-a; inheritance is the tightest coupling</td></tr>
            <tr><td>UML visibility</td><td>+ public − private # protected ~ package</td></tr>
            <tr><td>UML decorations</td><td>underline=static, italics=abstract, «stereotype»</td></tr>
            <tr><td>UML arrows</td><td>extends=solid triangle, implements=dashed triangle, ◇/◆ diamonds, dashed=dependency</td></tr>
            <tr><td>sequence diagram</td><td>activation = call stack; alt/opt/loop fragments</td></tr>
            <tr><td>requirements → entities</td><td>nouns→classes/attrs, verbs→methods, filter the rest</td></tr>
            <tr><td>Information Expert</td><td>behavior goes where the data lives</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>Dies with the whole = composition (◆); outlives it = aggregation (◇).</strong></li>
          <li><strong>uses-a &lt; has-a &lt; is-a</strong> in coupling — favor the left.</li>
          <li><strong>Composition over inheritance</strong> — delegate, don\'t extend (unless true is-a).</li>
          <li><strong>Solid triangle = extends, dashed triangle = implements.</strong></li>
          <li><strong>Activation bar = "I\'m on the stack right now".</strong></li>
          <li><strong>Nouns become classes; verbs become methods; "the system" gets ignored.</strong></li>
          <li><strong>Behavior lives where its data lives</strong> (Information Expert).</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps to never repeat</h2>
        <Warn><strong>Reaching for inheritance to reuse code.</strong> It\'s the tightest coupling and breeds fragile base classes + class explosion. Compose and delegate.</Warn>
        <Warn><strong>Confusing aggregation and composition.</strong> The lifecycle test settles it: owned-and-dies-together = composition.</Warn>
        <Warn><strong>Bidirectional links "just in case".</strong> They must be kept consistent and tighten coupling — add only for a real operation.</Warn>
        <Warn><strong>Mixing UML arrows.</strong> extends = solid triangle; implements = dashed triangle; dependency = dashed open arrow.</Warn>
        <Warn><strong>The god class.</strong> A "Manager/System" that holds all behavior. Distribute by Information Expert.</Warn>
        <Warn><strong>Over-modeling (YAGNI).</strong> Don\'t invent entities the requirements never mention.</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Predict each answer before revealing:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across the week.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 2 revised?</strong> You can now relate objects, choose composition wisely, draw a design,
        and derive one from requirements — the toolkit SOLID refines next.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 3 · Recap</strong> — SOLID.
      </div>
    </div>
  )
}
