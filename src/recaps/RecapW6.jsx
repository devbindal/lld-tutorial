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
  { q: 'You have a class with the wrong interface and can\'t change it; you need it to fit your code. Pattern?', o: ['Adapter', 'Decorator', 'Facade'], a: 0,
    why: 'Adapter (the travel plug): wrap the adaptee and TRANSLATE its interface to the Target your client expects. Object adapter (composition) is preferred over class adapter (inheritance). It changes the interface, not the behavior.' },
  { q: 'You want to add features to an object at runtime, stackably, without subclass explosion. Pattern?', o: ['Adapter', 'Decorator', 'Proxy'], a: 1,
    why: 'Decorator: implement the SAME interface AND wrap one (is-a AND has-a), adding behavior around the call. Stacks recursively (java.io: new BufferedReader(new FileReader(...))). Order matters; same interface, enhanced behavior.' },
  { q: 'You want to treat a single object and a TREE of objects uniformly (folder size). Pattern?', o: ['Composite', 'Decorator', 'Bridge'], a: 0,
    why: 'Composite: Leaf and Composite both implement Component; a Composite holds List<Component>, so client code recurses without instanceof. Whole-part trees treated uniformly (Swing, DOM, expression trees).' },
  { q: 'You want ONE simple entry point over a messy subsystem of many classes. Pattern?', o: ['Facade', 'Adapter', 'Proxy'], a: 0,
    why: 'Facade (the concierge): a thin, non-exclusive front door that simplifies a subsystem. It doesn\'t hide the subsystem (you can still use it directly) and adds no new interface contract — just convenience. Beware the god-facade.' },
  { q: 'A stand-in with the SAME interface controls access / adds lazy-loading or security to the real object. Pattern?', o: ['Decorator', 'Proxy', 'Facade'], a: 1,
    why: 'Proxy (the bodyguard): same interface as the subject, but controls access — virtual/lazy, protection, remote, smart-reference. Decorator ADDS behavior for the client\'s benefit; Proxy CONTROLS access on the subject\'s behalf.' },
  { q: 'A forest of 1,000,000 trees would OOM if each stored its texture/mesh. Pattern?', o: ['Flyweight', 'Bridge', 'Composite'], a: 0,
    why: 'Flyweight: split INTRINSIC (shared, e.g. the tree species mesh/texture) from EXTRINSIC (per-instance, e.g. position) and share the intrinsic objects. JDK: the String pool, Integer cache. Saves memory by sharing.' },
]

const QUESTIONS = [
  { q: 'What do STRUCTURAL patterns do?',
    o: ['Define algorithms', 'Manage threads', 'Compose objects/classes into larger structures — adapting interfaces, adding behavior, building trees, simplifying or controlling access, sharing state, splitting hierarchies', 'Create objects'], a: 2,
    e: 'Structural patterns are about composition: Adapter (fit), Decorator (enhance), Composite (tree), Facade (simplify), Proxy (control), Flyweight (share), Bridge (split). They assemble objects, not create or run them.',
    w: { 0: 'That\'s behavioral.', 1: 'Unrelated.', 3: 'That\'s creational.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'Adapter vs Decorator vs Facade vs Proxy — the one-line distinction?',
    o: ['All the same wrapper', 'They differ only in name', 'Only Adapter wraps', 'Adapter CHANGES the interface; Decorator ADDS behavior (same interface); Facade SIMPLIFIES a subsystem (new, smaller interface); Proxy CONTROLS access (same interface)'], a: 3,
    e: 'All four wrap, but with different intents: change interface (Adapter), add behavior (Decorator), provide a simple front (Facade), control access (Proxy). This disambiguation is the most-asked structural question.',
    w: { 0: 'Same shape, different intent.', 1: 'Intent differs.', 2: 'All four wrap something.' },
    r: { id: 's5', label: 'Section 5 — disambiguation' } },
  { q: 'Object adapter vs class adapter?',
    o: ['Class adapter is better', 'Object adapter uses COMPOSITION (holds the adaptee) — flexible, preferred; class adapter uses INHERITANCE (extends adaptee) — single-inheritance limited', 'Object adapter needs reflection', 'Identical'], a: 1,
    e: 'Object adapter holds the adaptee as a field and delegates — works with any subclass, composition-friendly. Class adapter extends the adaptee (Java single inheritance limits it). Prefer object adapter.',
    w: { 0: 'Object adapter is usually preferred.', 2: 'No reflection needed.', 3: 'They differ in mechanism.' },
    r: { id: 's2', label: 'Section 2 — Day 26' } },
  { q: 'In java.io, new BufferedReader(new InputStreamReader(in)) is which two patterns?',
    o: ['Two adapters', 'InputStreamReader is an ADAPTER (bytes→chars, changing the interface); BufferedReader is a DECORATOR (adds buffering, same Reader interface)', 'Composite + Proxy', 'Two decorators'], a: 1,
    e: 'A classic combo: the adapter converts a byte stream to a character Reader (interface change); the decorator wraps a Reader to add buffering (behavior added, same interface). Recognizing both in one line is the skill.',
    w: { 0: 'Only one changes the interface.', 2: 'Neither is a tree/access-control.', 3: 'InputStreamReader changes the interface (adapter).' },
    r: { id: 's2', label: 'Section 2 — Days 26-27' } },
  { q: 'Composite\'s "transparency vs safety" trade-off?',
    o: ['Transparent (GoF): add/remove live on the Component so leaves and composites share one type, but leaves must reject child ops; Safe: child ops only on Composite, so you must downcast/instanceof to add children', 'No trade-off', 'Composite needs no Component type', 'Safety is always chosen'], a: 0,
    e: 'Put add(child)/remove(child) on the common Component (transparent — uniform type, but a Leaf.add() is nonsensical) vs only on Composite (safe — but clients must know the concrete type to build the tree). A real design choice.',
    w: { 1: 'It\'s a genuine trade.', 2: 'The Component type is the whole point.', 3: 'GoF leans transparent.' },
    r: { id: 's2', label: 'Section 2 — Day 28' } },
  { q: 'Facade vs Proxy — both can sit in front of something. The difference?',
    o: ['Facade controls access', 'Proxy simplifies subsystems', 'Identical', 'Facade SIMPLIFIES a whole subsystem behind a new, smaller interface (and is non-exclusive); Proxy has the SAME interface as ONE subject and CONTROLS access to it (lazy/security/remote)'], a: 3,
    e: 'Facade = many classes → one convenient door (you can still bypass it). Proxy = a same-interface stand-in for ONE object, governing access. Different scope and intent.',
    w: { 0: 'That\'s Proxy.', 1: 'That\'s Facade.', 2: 'Different intent.' },
    r: { id: 's2', label: 'Section 2 — Day 29' } },
  { q: 'Flyweight splits state into…',
    o: ['Big and small', 'Static and instance', 'INTRINSIC (shared, context-free — stored in the flyweight, e.g. glyph shape) and EXTRINSIC (context-dependent — passed in by the client, e.g. position/color)', 'Public and private'], a: 2,
    e: 'Flyweight shares the intrinsic (the same "A" glyph or tree species) across many uses and pushes the extrinsic (where/how it appears) out to the caller. The String pool and Integer cache are flyweights.',
    w: { 0: 'Not about size.', 1: 'Not about static.', 3: 'Not about visibility.' },
    r: { id: 's2', label: 'Section 2 — Day 30' } },
  { q: 'Bridge solves which problem, and how?',
    o: ['A class hierarchy exploding along TWO independent axes (m shapes × n renderers): split abstraction from implementation into TWO hierarchies joined by composition, turning m×n into m+n', 'Wrong interface', 'Adding behavior at runtime', 'Sharing memory'], a: 0,
    e: 'Bridge decouples an abstraction (Shape) from its implementation (Renderer) so each varies independently — Shape HAS-A Renderer. Avoids the combinatorial subclass blowup. (Strategy-twin in structure; the intent is splitting hierarchies.)',
    w: { 1: 'That\'s Adapter.', 2: 'That\'s Decorator.', 3: 'That\'s Flyweight.' },
    r: { id: 's2', label: 'Section 2 — Day 30' } },
]

export default function RecapW6() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 2 · Week 6 · Structural Patterns</div>
        <h1>Week 6 Recap:<br />Structural Patterns</h1>
        <p>Days 26–30 in one place: how to COMPOSE objects — fit (Adapter), enhance (Decorator), build trees
           (Composite), simplify (Facade), control access (Proxy), share (Flyweight), split hierarchies
           (Bridge). The disambiguations are the exam. Cheat-sheet, rapid review, recap quiz.</p>
        <div className="chips">
          {['Adapter', 'Decorator', 'Composite', 'Facade', 'Proxy', 'Flyweight', 'Bridge'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  STRUCTURAL PATTERNS — compose objects into bigger structures

  Adapter     make an incompatible interface FIT (translate)           Day 26
  Decorator   ADD behavior at runtime, stackably (same interface)      Day 27
  Composite   treat a single object and a TREE uniformly               Day 28
  Facade      one SIMPLE front door over a messy subsystem             Day 29
  Proxy       same-interface stand-in that CONTROLS access             Day 29
  Flyweight   SHARE intrinsic state across many objects (save memory)  Day 30
  Bridge      SPLIT abstraction from implementation (m×n → m+n)        Day 30

  The wrapper family (Adapter/Decorator/Facade/Proxy) looks alike — the
  INTENT differs: change / add / simplify / control.`} />
        <Note><strong>Why this matters:</strong> structural patterns are how you reuse and combine existing
          types without rewriting them — the everyday glue between the creational seams (Week 5) and the
          behavioral algorithms (Weeks 7–8).</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 26 · Adapter</h3>
        <ul>
          <li><strong>Intent:</strong> make an existing class\'s interface fit what the client expects (the travel plug). Roles: Target / Adaptee / Adapter / Client.</li>
          <li><strong>Object adapter (composition, preferred)</strong> vs class adapter (inheritance, single-inheritance limited).</li>
          <li><strong>Translates</strong> formats and units, not behavior. JDK: <C>InputStreamReader</C>, <C>Arrays.asList</C>.</li>
          <li><strong>Ports &amp; adapters:</strong> pairs with ISP — depend on a narrow port, adapt the vendor to it.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 27 · Decorator</h3>
        <ul>
          <li><strong>Intent:</strong> add responsibilities at runtime without subclass explosion. <strong>is-a AND has-a</strong>: implement the interface AND wrap one.</li>
          <li><strong>Stacks recursively</strong> (java.io: <C>new BufferedReader(new FileReader(...))</C>); cost/behavior unwinds through the layers.</li>
          <li><strong>Order matters</strong> (compress-then-encrypt ≠ encrypt-then-compress).</li>
          <li><strong>Traps:</strong> identity (<C>==</C> breaks after wrapping); use functional decoration (<C>andThen</C>) for simple cases.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 28 · Composite</h3>
        <ul>
          <li><strong>Intent:</strong> treat individual objects (Leaf) and compositions (a tree) uniformly via a shared <C>Component</C> type.</li>
          <li><strong>The magic field:</strong> a Composite holds <C>List&lt;Component&gt;</C> → operations recurse without <C>instanceof</C>.</li>
          <li><strong>Transparency vs safety:</strong> add/remove on Component (uniform, but Leaf must reject) vs only on Composite (safe, but clients downcast).</li>
          <li><strong>Sightings:</strong> Swing components, the DOM, expression trees. Traps: cycles, DAGs, parent pointers, caching.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 29 · Facade &amp; Proxy</h3>
        <ul>
          <li><strong>Facade (concierge):</strong> a thin, NON-exclusive front door simplifying a subsystem (you can still use it directly). Trap: the god-facade that grows into the subsystem.</li>
          <li><strong>Proxy (bodyguard):</strong> SAME interface as the subject, controlling access. Five kinds: virtual/lazy, protection, remote, smart-reference, caching.</li>
          <li><strong>Real-world:</strong> Spring <C>@Transactional</C> (a proxy) — self-invocation bypasses it; <C>LazyInitializationException</C> from a lazy proxy after the session closes.</li>
          <li><strong>Dynamic proxies</strong> generate the stand-in at runtime.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 30 · Flyweight &amp; Bridge</h3>
        <ul>
          <li><strong>Flyweight:</strong> share INTRINSIC (context-free) state; pass EXTRINSIC (context) state in. Saves memory (forest of trees). JDK: String pool, Integer cache (−128..127).</li>
          <li><strong>Bridge:</strong> split an abstraction from its implementation into two hierarchies joined by composition — m×n subclasses → m+n. Universal-remote analogy.</li>
          <li><strong>Disambiguation:</strong> Bridge is Strategy\'s structural twin (intent differs: split hierarchies vs swap algorithm); Adapter adapts an EXISTING interface (after the fact), Bridge is designed up front.</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 The wrapper-family disambiguation</h2>
        <table className="matrix">
          <thead><tr><th>pattern</th><th>interface</th><th>intent</th></tr></thead>
          <tbody>
            <tr><td>Adapter</td><td>CHANGES it</td><td>make an incompatible thing fit</td></tr>
            <tr><td>Decorator</td><td>SAME</td><td>add behavior, stackably</td></tr>
            <tr><td>Facade</td><td>NEW, smaller</td><td>simplify a subsystem</td></tr>
            <tr><td>Proxy</td><td>SAME</td><td>control access to one subject</td></tr>
            <tr><td>Composite</td><td>SAME (Component)</td><td>part-whole trees, treated uniformly</td></tr>
            <tr><td>Bridge</td><td>two hierarchies</td><td>split abstraction from implementation</td></tr>
            <tr><td>Flyweight</td><td>shared instances</td><td>save memory via intrinsic/extrinsic split</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>Adapter changes, Decorator adds, Facade simplifies, Proxy controls.</strong></li>
          <li><strong>Decorator = is-a AND has-a;</strong> order of wrapping matters.</li>
          <li><strong>Composite = List&lt;Component&gt;</strong> → recursion without instanceof.</li>
          <li><strong>Facade is non-exclusive; Proxy shares the subject\'s interface.</strong></li>
          <li><strong>Flyweight: intrinsic shared, extrinsic passed in.</strong></li>
          <li><strong>Bridge: m×n → m+n by splitting into two hierarchies.</strong></li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps &amp; disambiguations</h2>
        <Warn><strong>Calling everything a "wrapper".</strong> Adapter/Decorator/Facade/Proxy all wrap — say the INTENT (change/add/simplify/control) to identify which.</Warn>
        <Warn><strong>Class adapter over object adapter.</strong> Inheritance is rigid (single-inheritance). Prefer composition (object adapter).</Warn>
        <Warn><strong>Decorator order ignored.</strong> compress↔encrypt etc. are not commutative; and <C>==</C> identity breaks after wrapping.</Warn>
        <Warn><strong>instanceof-and-recurse instead of Composite.</strong> The shared Component + List&lt;Component&gt; removes the type checks.</Warn>
        <Warn><strong>The god-facade.</strong> A facade that absorbs subsystem logic becomes the subsystem. Keep it thin.</Warn>
        <Warn><strong>Confusing Bridge and Strategy.</strong> Same structure (composition), different intent: split two hierarchies vs swap one algorithm.</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Name the structural pattern before revealing:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across the week.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 6 revised?</strong> You can now compose and reuse types without rewriting them — and tell
        the wrapper family apart on sight.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 7 · Recap</strong> — behavioral patterns I.
      </div>
    </div>
  )
}
