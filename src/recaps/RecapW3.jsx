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
      <div className="ptitle">Rapid review · recall the principle before you read the answer</div>
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
  { q: 'A class both formats a report AND saves it to a database. Which SOLID letter does it violate?', o: ['S — Single Responsibility', 'O — Open/Closed', 'L — Liskov', 'D — Dependency Inversion'], a: 0,
    why: 'Two reasons to change (formatting rules vs persistence) = two responsibilities = two actors. SRP says split them. Tell: the word "and" in a class description, or names like Helper/Manager/Util.' },
  { q: 'Every new payment type means editing a big switch in PaymentProcessor. Which letter?', o: ['S', 'O — Open/Closed', 'I', 'D'], a: 1,
    why: 'OCP: open for extension, closed for modification. The growing if-else/switch is the smell. Fix: a PaymentMethod interface + a class per type; the processor dispatches polymorphically and never reopens.' },
  { q: 'Square extends Rectangle but setWidth also changes height, breaking code that assumed independence. Which letter?', o: ['L — Liskov Substitution', 'O', 'I', 'S'], a: 0,
    why: 'LSP: a subtype must honor the base\'s contract so it can substitute freely. Square silently breaks Rectangle\'s invariant. Smells: instanceof checks and throwing UnsupportedOperationException in overrides.' },
  { q: 'A Printable interface forces a basic printer to implement scan() and fax() it can\'t do. Which letter?', o: ['I — Interface Segregation', 'S', 'L', 'D'], a: 0,
    why: 'ISP: many small interfaces beat one fat one. Split into Printable / Scannable / Faxable so clients depend only on what they use. The forced empty/throwing methods are the "forced lie".' },
  { q: 'OrderService does new MySqlRepository() inside it. Which letter, and the fix?', o: ['D — Dependency Inversion: depend on a Repository interface, injected', 'O', 'S', 'L'], a: 0,
    why: 'DIP: depend on abstractions, not concretions. High-level OrderService shouldn\'t name a concrete DB. Inject a Repository interface (wired at the composition root) → swappable + testable with a fake.' },
  { q: 'DIP, DI, and IoC — are they the same thing?', o: ['Yes', 'No: DIP is the PRINCIPLE (depend on abstractions); DI is one TECHNIQUE (pass dependencies in); IoC is the broader idea (a framework calls you)'], a: 1,
    why: 'DIP = the goal. Dependency Injection = a common way to achieve it (constructor/setter injection). Inversion of Control = the general pattern where the framework/runtime drives your code. Related, not synonyms.' },
]

const QUESTIONS = [
  { q: 'SOLID in one breath?',
    o: ['S: one reason to change · O: extend without modifying · L: subtypes substitute safely · I: small focused interfaces · D: depend on abstractions — together they make code changeable without ripple', 'Five unrelated rules', 'Always use interfaces', 'Rules only for big teams'], a: 0,
    e: 'SOLID is five forces that keep a design open to change: responsibilities split, behavior added by extension, substitutable types, lean interfaces, and dependencies pointing at abstractions.',
    w: { 1: 'They reinforce each other toward changeability.', 2: 'Interfaces are a tool, not the principle set.', 3: 'They help any size codebase.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'The precise definition of a "responsibility" in SRP?',
    o: ['A method', 'A class', 'A reason to change, i.e. a single ACTOR/stakeholder — group code that changes for the same reason and for the same people', 'A line of code'], a: 2,
    e: 'SRP is about reasons to change. Tax rules, report formatting, and persistence change for different actors — so they belong in different classes. Steps of one task are NOT separate responsibilities.',
    w: { 0: 'A method is too granular.', 1: 'A class can legitimately hold one responsibility.', 3: 'Far too granular.' },
    r: { id: 's2', label: 'Section 2 — Day 11' } },
  { q: 'OCP\'s "closed for modification" is achieved by…',
    o: ['Polymorphism: a stable abstraction (interface/abstract method) that new variants EXTEND as new classes, so adding behavior doesn\'t reopen tested code', 'final on everything', 'Comments', 'Never editing code'], a: 0,
    e: 'You add a class implementing the interface; the engine (polymorphic dispatch) picks it up. The growing switch is the anti-pattern. Caveat: a truly fixed enum + switch can be fine (fool-me-once vs speculative generality).',
    w: { 1: 'final restricts, it doesn\'t enable extension.', 2: 'Comments don\'t close anything.', 3: 'You still write code — new classes, not edits to old ones.' },
    r: { id: 's2', label: 'Section 2 — Day 12' } },
  { q: 'LSP\'s contract rules (a subtype may…)?',
    o: ['Throw any exception', 'Demand LESS and deliver MORE: weaken preconditions, strengthen postconditions, preserve invariants, and not throw new checked exceptions — so callers of the base never break', 'Strengthen preconditions', 'Do anything'], a: 1,
    e: '"Be substitutable": a subtype can accept more inputs (weaker preconditions) and guarantee more (stronger postconditions), but never the reverse. Breaking this is the penguin/square-rectangle bug.',
    w: { 0: 'New checked exceptions break callers.', 2: 'Strengthening preconditions breaks callers.', 3: 'It\'s tightly constrained by the base contract.' },
    r: { id: 's2', label: 'Section 2 — Day 13' } },
  { q: 'A class is forced to implement interface methods it can\'t support (empty or throwing). The principle + fix?',
    o: ['LSP; add instanceof', 'OCP; add a switch', 'ISP; split the fat interface into small role interfaces (Printable/Scannable/…) so clients depend only on what they use', 'SRP; merge classes'], a: 2,
    e: 'Forced empty/throwing methods = a fat interface (ISP violation). Segregate into focused -able interfaces; the basic printer implements only Printable. Bonus: it reduces client coupling blast radius.',
    w: { 0: 'instanceof is an LSP smell, not a fix here.', 1: 'A switch doesn\'t address the forced lie.', 3: 'Merging makes it fatter.' },
    r: { id: 's2', label: 'Section 2 — Day 14' } },
  { q: 'DIP says high-level modules and low-level modules should both depend on…',
    o: ['Each other', 'The database', 'Concrete classes', 'ABSTRACTIONS (and abstractions shouldn\'t depend on details) — invert the arrow so the policy owns the interface and the detail implements it, wired at a composition root'], a: 3,
    e: 'Both clauses: (1) high-level shouldn\'t depend on low-level; both depend on abstractions; (2) abstractions don\'t depend on details. The interface is owned by the high-level policy; concretes are injected.',
    w: { 0: 'Mutual concrete dependence is the tight coupling DIP removes.', 1: 'The DB is a detail.', 2: 'Concrete dependence is exactly what to avoid.' },
    r: { id: 's2', label: 'Section 2 — Day 15' } },
  { q: 'Why does DIP make code testable?',
    o: ['It doesn\'t', 'Swappability: depending on an interface lets a test inject a FAKE (FakeClock, FakeRepository, FakePaymentGateway) — testability and swappability are the same property', 'It runs faster', 'It adds logging'], a: 1,
    e: 'If OrderService takes a Repository interface, a unit test passes an in-memory fake. The boundaries to invert are the sneaky ones: Clock, Random, I/O, third-party SDKs (the composition root wires the real ones).',
    w: { 0: 'It directly enables it.', 2: 'Speed isn\'t the point.', 3: 'Unrelated.' },
    r: { id: 's2', label: 'Section 2 — Day 15' } },
  { q: 'The SOLID smells you should recognize instantly?',
    o: ['Short variable names', 'Comments', 'Long methods only', 'A class doing X "and" Y (SRP) · a growing switch on a type (OCP) · instanceof / UnsupportedOperationException in overrides (LSP) · forced empty interface methods (ISP) · new ConcreteClass() inside high-level code (DIP)'], a: 3,
    e: 'Each principle has a tell. Spotting the smell is faster than reciting the definition — and the fix follows directly (split, extend, restructure the hierarchy, segregate, inject).',
    w: { 0: 'Naming is unrelated.', 1: 'Comments aren\'t SOLID smells.', 2: 'Length is a different smell.' },
    r: { id: 's5', label: 'Section 5 — traps' } },
]

export default function RecapW3() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 1 · Week 3 · SOLID</div>
        <h1>Week 3 Recap:<br />The Five Principles</h1>
        <p>Days 11–15 in one place: SOLID, each as a smell you can spot and a fix you can apply. Cheat-sheet,
           rapid review, and a recap quiz. These five forces underpin every design pattern in Month 2.</p>
        <div className="chips">
          {['SRP', 'OCP', 'LSP', 'ISP', 'DIP'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  SOLID — five forces that keep a design open to change

  S  Single Responsibility   one reason to change (one actor)        Day 11
  O  Open/Closed             extend by ADDING, not MODIFYING         Day 12
  L  Liskov Substitution     subtypes substitute without surprises   Day 13
  I  Interface Segregation   many small interfaces > one fat one     Day 14
  D  Dependency Inversion    depend on ABSTRACTIONS, not concretes   Day 15

  Each has a SMELL → a FIX:
    "and" in a class / Helper-Util names   → split (SRP)
    growing switch on a type               → interface + class per variant (OCP)
    instanceof / UnsupportedOperation      → fix the hierarchy / capabilities (LSP)
    forced empty interface methods         → segregate into -able roles (ISP)
    new Concrete() inside policy code       → inject an interface (DIP)`} />
        <Note><strong>Why this matters:</strong> the GoF patterns (Month 2) are largely SOLID made concrete —
          Strategy is OCP+DIP, Observer is OCP, Adapter rescues LSP/ISP at a boundary. Learn the smells and the
          patterns become obvious.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 11 · Single Responsibility (SRP)</h3>
        <ul>
          <li><strong>One reason to change = one actor/stakeholder.</strong> Group code that changes together, for the same people.</li>
          <li><strong>Split the god class:</strong> tax calc / report formatting / persistence are three responsibilities → three classes.</li>
          <li><strong>Steps ≠ responsibilities</strong> — a single task\'s sub-steps can live together.</li>
          <li><strong>Smells:</strong> "this class does X <em>and</em> Y", and vague names (Helper, Manager, Util) that attract everything.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 12 · Open/Closed (OCP)</h3>
        <ul>
          <li><strong>Open for extension, closed for modification:</strong> add behavior by adding a class, not editing tested code.</li>
          <li><strong>Smell:</strong> a growing <C>if-else</C>/<C>switch</C> on a type that you reopen for every new variant.</li>
          <li><strong>Fix:</strong> an interface + one class per variant; polymorphic dispatch is the engine.</li>
          <li><strong>Nuance:</strong> a genuinely FIXED set (enum + switch) can be fine — don\'t add speculative generality (fool-me-once rule).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 13 · Liskov Substitution (LSP)</h3>
        <ul>
          <li><strong>A subtype must be usable wherever the base is</strong> — no surprises for callers.</li>
          <li><strong>Contract rules:</strong> demand LESS (weaker preconditions), deliver MORE (stronger postconditions), preserve invariants, don\'t add new checked exceptions.</li>
          <li><strong>Classic violations:</strong> Square extends Rectangle (breaks an invariant); Penguin extends Bird with fly() throwing.</li>
          <li><strong>Smells:</strong> <C>instanceof</C> branching on subtype, and overrides that throw <C>UnsupportedOperationException</C>.</li>
          <li><strong>Fixes:</strong> split the hierarchy, use capability interfaces, or compose instead of extend.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 14 · Interface Segregation (ISP)</h3>
        <ul>
          <li><strong>Many small role interfaces beat one fat one</strong> — clients depend only on what they use.</li>
          <li><strong>Smell:</strong> a class forced to implement methods it can\'t support (empty bodies / throws) — the "forced lie".</li>
          <li><strong>Fix:</strong> split (e.g. Machine → Printable / Scannable / Faxable); name roles with <C>-able</C>.</li>
          <li><strong>Bonus:</strong> accept the narrowest interface a method needs (smaller blast radius when things change).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 15 · Dependency Inversion (DIP)</h3>
        <ul>
          <li><strong>Depend on abstractions, not concretions</strong> — both clauses: high-level doesn\'t depend on low-level (both depend on abstractions); abstractions don\'t depend on details.</li>
          <li><strong>Invert the arrow:</strong> the high-level POLICY owns the interface; the low-level detail implements it.</li>
          <li><strong>DIP vs DI vs IoC:</strong> DIP = the principle; DI = passing dependencies in; IoC = the framework calls you.</li>
          <li><strong>Composition root:</strong> wire the concrete graph in ONE place at the edge.</li>
          <li><strong>Testability ⇔ swappability:</strong> inject interfaces → inject fakes. Invert the sneaky boundaries: Clock, Random, I/O, vendor SDKs.</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 The week in one table</h2>
        <table className="matrix">
          <thead><tr><th>letter</th><th>principle</th><th>smell → fix</th></tr></thead>
          <tbody>
            <tr><td>S</td><td>one reason to change (one actor)</td><td>"and" / Util names → split</td></tr>
            <tr><td>O</td><td>extend without modifying</td><td>growing switch → interface + class per variant</td></tr>
            <tr><td>L</td><td>subtypes substitute safely</td><td>instanceof / UnsupportedOperation → fix hierarchy</td></tr>
            <tr><td>I</td><td>small focused interfaces</td><td>forced empty methods → segregate into -able roles</td></tr>
            <tr><td>D</td><td>depend on abstractions</td><td>new Concrete() in policy → inject an interface</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>SRP:</strong> if you say "and" describing a class, split it.</li>
          <li><strong>OCP:</strong> add a class, don\'t edit the switch.</li>
          <li><strong>LSP:</strong> demand less, deliver more; no surprises for callers.</li>
          <li><strong>ISP:</strong> no client should be forced to depend on methods it never calls.</li>
          <li><strong>DIP:</strong> high-level owns the interface; concretes are injected at the root.</li>
          <li><strong>Testable = swappable.</strong> If you can\'t inject a fake, a boundary is missing.</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps to never repeat</h2>
        <Warn><strong>"SRP = one method per class".</strong> No — one reason to change. Cohesive steps belong together.</Warn>
        <Warn><strong>Speculative OCP.</strong> Don\'t build extension points for variation that may never come (YAGNI, Week 4). Abstract on the second real case.</Warn>
        <Warn><strong>instanceof ladders.</strong> Branching on subtype is an LSP/OCP smell — use polymorphism.</Warn>
        <Warn><strong>Fat "do-everything" interfaces.</strong> They force empty methods and couple every client to every change. Segregate.</Warn>
        <Warn><strong><C>new ConcreteClass()</C> deep inside business logic.</strong> Hidden coupling; untestable. Inject the abstraction.</Warn>
        <Warn><strong>Reciting definitions, missing smells.</strong> In review/interviews you spot the smell first, then name the principle and the fix.</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Name the violated principle (and the fix) before revealing:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across the week.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 3 revised?</strong> SOLID is the vocabulary the rest of the course speaks — the GoF
        patterns (Month 2) are these principles made concrete.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 4 · Recap</strong> — DRY/KISS/YAGNI, coupling, Demeter, enums, value objects.
      </div>
    </div>
  )
}
