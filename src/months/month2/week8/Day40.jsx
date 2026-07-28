import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The double-dispatch machine ============ */
const DD_RESULTS = {
  'Circle|Area': 'area = π·r² = 78.5',
  'Circle|Svg': '<circle cx="0" cy="0" r="5"/>',
  'Square|Area': 'area = s² = 25.0',
  'Square|Svg': '<rect width="5" height="5"/>',
}

function DispatchMachine() {
  const [elem, setElem] = useState('Circle')
  const [vis, setVis] = useState('Area')
  const [trace, setTrace] = useState(null)

  function run() {
    setTrace([
      { line: `shape.accept(visitor)   // static type of shape: Shape`, note: 'DISPATCH #1 — dynamic (Day 4): the JVM looks at the OBJECT and runs ' + elem + '.accept().' },
      { line: `${elem}.accept(Visitor v) { v.visit(this); }`, note: `Inside ${elem}.accept, the compiler KNOWS this is a ${elem} — so the overload visit(${elem}) is chosen. DISPATCH #2, done at compile time on a now-known type.` },
      { line: `${vis}Visitor.visit(${elem} c) → ${DD_RESULTS[`${elem}|${vis}`]}`, note: 'Both types participated: WHICH element (runtime) × WHICH operation (the visitor object). Java has single dispatch; accept() is the trampoline that fakes double dispatch.' },
    ])
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · two dispatches, one trampoline — the trick at the heart of Visitor</div>
      <div className="modbtns">
        {['Circle', 'Square'].map((e) => (
          <button key={e} className={elem === e ? 'on' : ''} onClick={() => { setElem(e); setTrace(null) }}>{e === 'Circle' ? '⚪' : '⬜'} {e}</button>
        ))}
        {['Area', 'Svg'].map((v) => (
          <button key={v} className={vis === v ? 'on' : ''} onClick={() => { setVis(v); setTrace(null) }}>{v === 'Area' ? '📐' : '🖼️'} {v}Visitor</button>
        ))}
      </div>
      <table className="matrix">
        <thead>
          <tr><th>accept ▼ / visit ▶</th><th>📐 Area</th><th>🖼️ Svg</th></tr>
        </thead>
        <tbody>
          {['Circle', 'Square'].map((e) => (
            <tr key={e}>
              <td>{e}</td>
              {['Area', 'Svg'].map((v) => (
                <td key={v} className={trace && e === elem && v === vis ? 'yes' : ''}
                  style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5 }}>
                  {trace && e === elem && v === vis ? DD_RESULTS[`${e}|${v}`] : '·'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button className="act" onClick={run} style={{ marginBottom: 8 }}>▶ shape.accept(visitor)</button>
      {trace && (
        <div className="heap">
          {trace.map((t, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, fontWeight: 700 }}>{i + 1}. {t.line}</div>
              <div style={{ fontSize: 12.5, color: '#555', paddingLeft: 18 }}>{t.note}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 2: The two-axis blast ============ */
function TwoAxisBlast() {
  const [world, setWorld] = useState('methods')
  const [fired, setFired] = useState(null) // 'op' | 'type'

  const chips = (() => {
    if (!fired) return []
    if (world === 'methods') {
      return fired === 'op'
        ? [['Circle.java', 'edit'], ['Square.java', 'edit'], ['Triangle.java', 'edit']]
        : [['Pentagon.java', 'new'], ['Circle.java', 'safe'], ['Square.java', 'safe'], ['Triangle.java', 'safe']]
    }
    return fired === 'op'
      ? [['SvgExportVisitor.java', 'new'], ['Circle.java', 'safe'], ['Square.java', 'safe'], ['AreaVisitor', 'safe']]
      : [['Pentagon.java', 'new'], ['interface ShapeVisitor + visit(Pentagon)', 'edit'], ['AreaVisitor', 'edit'], ['SvgExportVisitor', 'edit'], ['AuditVisitor', 'edit']]
  })()

  return (
    <div className="panel">
      <div className="ptitle">Live demo · two growth requests, two architectures — count the edits BOTH ways</div>
      <div className="modbtns">
        <button className={world === 'methods' ? 'on' : ''} onClick={() => { setWorld('methods'); setFired(null) }}>🏛️ operations as methods (classic OOP)</button>
        <button className={world === 'visitor' ? 'on' : ''} onClick={() => { setWorld('visitor'); setFired(null) }}>🧳 operations as visitors</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => setFired('op')}>📣 add an OPERATION: exportSvg()</button>
        <button className="act" onClick={() => setFired('type')}>📣 add a TYPE: Pentagon</button>
      </div>
      {fired && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {chips.map(([n, kind]) => (
              <span key={n} className="chip" style={
                kind === 'new' ? { background: '#EAF7EF', borderColor: 'var(--green)', color: '#1F6B43' }
                : kind === 'edit' ? { background: '#FFE0DE', borderColor: 'var(--red)', color: '#8F2B24' }
                : { opacity: 0.5 }}>
                {kind === 'new' ? '🆕 ' : kind === 'edit' ? '✏️ ' : ''}{n}
              </span>
            ))}
          </div>
          <div className="statbar" style={{ background: chips.some(([, k]) => k === 'edit') ? '#FDECEC' : '#EAF7EF' }}>
            {world === 'methods'
              ? (fired === 'op'
                ? <span>💥 <span>New operation = REOPEN every shape class (and there are 14 in the real codebase). Classic OOP is CLOSED on the operation axis.</span></span>
                : <span>😌 <span>New type = one new class carrying its own behavior. Classic OOP is OPEN on the type axis.</span></span>)
              : (fired === 'op'
                ? <span>😌 <span>New operation = ONE new visitor file; shapes never touched. Visitor is OPEN on the operation axis — the whole reason it exists.</span></span>
                : <span>💥 <span>New type = the Visitor interface grows visit(Pentagon) — so EVERY visitor in every team’s repo must implement it. Visitor is CLOSED on the type axis. Day 23’s trade-off table has a twin.</span></span>)}
          </div>
        </div>
      )}
      <div className="statbar">
        ⚖️ <span>This two-axis tension has a name — the EXPRESSION PROBLEM: pick which axis grows cheaply, because (in plain Java) you cannot have both.</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: The file-tree auditor ============ */
const TREE = {
  name: '📁 Projects', kids: [
    { name: '📁 lld-app', kids: [
      { name: '📄 Main.java', size: 4 },
      { name: '📄 Order.java', size: 6 },
      { name: '📁 docs', kids: [{ name: '📄 readme.md', size: 2 }] },
    ]},
    { name: '📄 notes.txt', size: 1 },
  ],
}

function runVisitor(kind) {
  const out = []
  function walk(n, depth) {
    if (kind === 'print') out.push(`${'  '.repeat(depth)}${n.name}`)
    if (!n.kids) {
      if (kind === 'search' && n.name.endsWith('.java')) out.push(`🎯 found: ${n.name} (${n.size} KB)`)
      return n.size
    }
    let total = 0
    n.kids.forEach((k) => { total += walk(k, depth + 1) })
    if (kind === 'size') out.push(`${n.name} → ${total} KB`)
    return total
  }
  const total = walk(TREE, 0)
  if (kind === 'size') out.push(`TOTAL: ${total} KB`)
  if (kind === 'search' && out.length === 0) out.push('no matches')
  return out
}

function TreeAuditor() {
  const [kind, setKind] = useState(null)
  const out = kind ? runVisitor(kind) : []

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Day 28’s tree, three NEW operations — File.java and Folder.java untouched</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className={kind === 'size' ? 'on act' : 'act'} onClick={() => setKind('size')}>📊 tree.accept(new SizeVisitor())</button>
        <button className={kind === 'search' ? 'on act' : 'act'} onClick={() => setKind('search')}>🔎 accept(new SearchVisitor(".java"))</button>
        <button className={kind === 'print' ? 'on act' : 'act'} onClick={() => setKind('print')}>🖨️ accept(new PrintVisitor())</button>
      </div>
      {kind && (
        <div className="heap">
          {out.map((l, i) => (
            <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre' }}>{l}</div>
          ))}
        </div>
      )}
      <div className="statbar">
        🌳 <span>Three operations the tree classes never heard of — each visitor carries its own logic AND its own accumulating state (totals, matches, indent). Day 28’s homework question ("how would you add toLatex() without editing the nodes?") — answered.</span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Visitor pattern\'s intent is…',
    o: ['To iterate a collection', 'To represent an OPERATION on an object structure as its own class — letting you add NEW operations without modifying the element classes', 'To chain handlers', 'To snapshot state'], a: 1,
    e: 'The shapes (or AST nodes, or files) stay frozen; each new concern — export, audit, pricing — arrives as one new visitor class that knows what to do at every element type.',
    w: { 0: 'Walking elements is Iterator (37) — visitors often RIDE an iteration.',
         2: 'Handler chains are CoR (36).',
         3: 'Snapshots are Memento (39).' },
    r: { id: 's1', label: 'Section 1 — the inspector’s rounds' } },
  { q: 'Why doesn\'t plain overloading — visitor.visit(shape) — work without accept()?',
    o: ['Overload selection is COMPILE-TIME, by the STATIC type: with Shape s, visit(s) binds to visit(Shape) forever, never to visit(Circle) — the runtime type is invisible to overload resolution (Day 4!)', 'It does work', 'Overloads are slow', 'visit is a keyword'], a: 0,
    e: 'Java dispatches dynamically on ONE thing only: the receiver. Arguments dispatch statically. That asymmetry is exactly the hole accept() plugs.',
    w: { 1: 'Try it: visit(Shape) wins every time — the classic confusion.',
         2: 'Speed is irrelevant.',
         3: 'No such keyword.' },
    r: { id: 's3', label: 'Section 3 — why accept exists' } },
  { q: 'Explain the accept() one-liner\'s magic.',
    o: ['It clones the visitor', 'It logs the visit', 'Inside Circle.accept(v), the call v.visit(this) sees this with COMPILE-TIME type Circle — so the right overload binds. Dispatch #1 (dynamic, picks WHOSE accept) + dispatch #2 (overload on the now-known this) = simulated double dispatch', 'It uses reflection'], a: 2,
    e: 'The element lends its own statically-known this to fix the overload. Two lines of boilerplate per element class buy dispatch on TWO types in a single-dispatch language.',
    w: { 0: 'Nothing is cloned.',
         1: 'No logging.',
         3: 'Zero reflection — that\'s the elegance.' },
    r: { id: 's4', label: 'Section 4 — the dispatch machine' } },
  { q: 'Visitor\'s trade-off axes — state them like Day 23\'s table.',
    o: ['Open everywhere', 'Closed everywhere', 'Only about speed', 'OPEN on the operation axis (new visitor = one file, elements untouched) but CLOSED on the type axis (new element = edit the Visitor interface AND every visitor) — the inverse of classic OOP, and a named dilemma: the Expression Problem'], a: 3,
    e: 'Choose Visitor when the element set is STABLE and operations multiply (ASTs, file nodes, documents). Choose methods-on-classes when types multiply and operations are stable.',
    w: { 0: 'No design is open on both axes in plain Java.',
         1: 'It IS open — on one axis.',
         2: 'Speed never enters it.' },
    r: { id: 's5', label: 'Section 5 — the two-axis blast' } },
  { q: 'Visitor + Composite (Day 28) — why are they soulmates?',
    o: ['Composite gives a stable TREE of heterogeneous nodes; Visitor adds unlimited OPERATIONS over it without touching node classes — compilers do exactly this: one AST, dozens of visitor passes', 'Both use recursion keywords', 'They share an interface', 'GoF requires pairing them'], a: 0,
    e: 'javac\'s own API ships TreeVisitor/ElementVisitor: type-checking, code-gen and linting are all visitors over one syntax tree. Your IDE\'s inspections? Visitors.',
    w: { 1: 'Recursion is incidental.',
         2: 'Different interfaces, cooperative roles.',
         3: 'GoF suggests, never requires.' },
    r: { id: 's7', label: 'Section 7 — trees + visitors' } },
  { q: 'Is a visitor that ACCUMULATES state (running total, list of matches) doing it wrong?',
    o: ['State belongs in the elements', 'No — collecting results across visits is the NORMAL visitor style: the visitor is a per-traversal object, born for one walk, queried at the end (total(), matches())', 'Only with synchronized', 'Yes — visitors must be stateless'], a: 1,
    e: 'Unlike shared strategies (Day 31) or flyweight states (Day 34), a visitor typically lives for ONE traversal — its fields are the operation\'s working memory. Create fresh, walk, read answer, discard.',
    w: { 0: 'Pushing op-results into elements re-pollutes them — the disease again.',
         2: 'Concurrency is orthogonal.',
         3: 'That rule belongs to SHARED objects; visitors are usually single-use.' },
    r: { id: 's8', label: 'Section 8 — the auditor demo' } },
  { q: 'The MODERN Java alternative to Visitor — and the catch?',
    o: ['There is none', 'Reflection visitors', 'instanceof chains are fine now', 'sealed interface + pattern-matching switch (Java 21): exhaustive over a closed type set, no accept() boilerplate — but it requires owning/sealing the hierarchy, and "add a type" still edits every switch (same axis, compiler-found)'], a: 3,
    e: 'switch (shape) { case Circle c -> …; case Square s -> … } with sealed Shape: the compiler enforces the same completeness the Visitor interface did. The Expression Problem remains; the boilerplate dies. Knowing BOTH spellings is the 2026 answer.',
    w: { 0: 'Java 17–21 changed this story significantly.',
         1: 'Reflection trades type safety for pain.',
         2: 'Unchecked instanceof chains still rot — sealing + exhaustiveness is what redeems the switch.' },
    r: { id: 's9', label: 'Section 9 — the modern verdict' } },
  { q: 'GoF lists 23 patterns; this course taught 22. The missing one — and why skipping it is defensible?',
    o: ['Bridge — too hard', 'Observer — deprecated', 'Interpreter: define a grammar and evaluate sentences via a class per rule — rarely used directly, and structurally it is Composite (an expression tree, Day 28\'s homework!) plus per-node evaluate/visitors. You have effectively built it', 'Singleton — too famous'], a: 2,
    e: 'Interpreter = an AST (Composite) where each node knows evaluate() — your (3+4)×2 calculator WAS one. Modern practice reaches for parser generators/DSL libraries instead. Naming this shows catalog command, not a gap.',
    w: { 0: 'Day 30 says hello.',
         1: 'Day 32 is very alive.',
         3: 'Day 21 says hello.' },
    r: { id: 's10', label: 'Section 10 — the graduation table' } },
]

/* ============ The page ============ */
export default function Day40() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 8 · Day 40 · FINALE — the GoF catalog completes</div>
        <h1>Visitor:<br />New Operations, Untouched Classes</h1>
        <p>The trickiest pattern, saved for last: how compilers run dozens of passes over one syntax tree, how
           Day 28’s homework question gets answered, and how Java fakes dispatching on TWO types at once.
           Finish today and Month 2 — all of design patterns — is yours. Click everything.</p>
        <div className="chips">
          {['visitor', 'double dispatch', 'accept()', 'expression problem', 'AST passes', 'sealed + switch'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The inspector’s rounds</h2>
        <p>An insurance inspector visits three buildings in one morning: at the <strong>house</strong> she
          checks smoke alarms, at the <strong>factory</strong> chemical storage, at the <strong>office</strong>
          fire exits. The buildings don’t learn inspection law — each just <strong>opens the door</strong>
          (accept) and the visitor applies the right checklist for THAT building type. Next month a
          <em> tax assessor</em> makes the same rounds with a different checklist — and no building changed.</p>
        <Note><strong>Visitor’s intent:</strong> represent an operation on the elements of an object
          structure as its <strong>own class</strong> — so you can define NEW operations without changing the
          classes of the elements they operate on.</Note>
        <Code html={`        THE TWO GROWTH AXES (the Expression Problem)

                      add a TYPE ↓          add an OPERATION →
   classic OOP        😌 one new class       💥 edit EVERY class
   (ops as methods)      (behavior inside)      (14 shapes reopened)

   VISITOR            💥 edit every visitor  😌 one new visitor class
   (ops as classes)      (+ the interface)      (elements frozen)

   pick the axis your domain actually grows on — shapes stable, ops multiplying? → Visitor`} />
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The crime: operations colonizing the elements</h2>
        <Code html={`<span class="kw">public class</span> Circle <span class="kw">implements</span> Shape {
    <span class="kw">double</span> area()        { … }     <span class="cm">// geometry — fine, this is its job</span>
    String toSvg()       { … }     <span class="cm">// rendering knowledge invades 🎨</span>
    String toLatex()     { … }     <span class="cm">// document knowledge invades 📄</span>
    <span class="kw">double</span> auditScore()  { … }     <span class="cm">// compliance knowledge invades 🕵️</span>
    <span class="cm">// …every new concern edits Circle AND Square AND Triangle AND…
    // SRP (Day 11): how many ACTORS own this class now? Four and counting.</span>
}`} />
        <p>The alternative without any pattern is worse: instanceof chains in every operation site (Day 13’s
          smell at scale). The question Visitor answers: <strong>where do cross-cutting operations live when
          they don’t belong inside the elements?</strong> Answer: each operation becomes a class of its own.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Why the obvious thing fails (the overloading trap)</h2>
        <Code html={`<span class="kw">class</span> AreaVisitor {
    <span class="kw">double</span> visit(Circle c) { … }
    <span class="kw">double</span> visit(Square s) { … }
}

Shape s = <span class="kw">new</span> Circle(<span class="num">5</span>);
visitor.visit(s);        <span class="cm">// ❌ COMPILE ERROR (or binds to visit(Shape) if one exists)</span>
<span class="cm">// Overload resolution is STATIC: it sees the declared type Shape — never the
// runtime Circle. Java dispatches dynamically ONLY on the receiver (Day 4),
// never on arguments. We need dispatch on TWO types. Java gives us one.</span>`} />
        <p>The fix is a beautiful two-line trampoline — the element donates its own statically-known
          <C> this</C>:</p>
        <Code html={`<span class="kw">public interface</span> Shape { <span class="kw">double</span> accept(ShapeVisitor v); }

<span class="kw">public class</span> Circle <span class="kw">implements</span> Shape {
    <span class="kw">public double</span> accept(ShapeVisitor v) {
        <span class="kw">return</span> v.visit(<span class="kw">this</span>);     <span class="cm">// HERE, 'this' is a Circle at COMPILE time →
                                  //   the visit(Circle) overload binds. Trampoline complete.</span>
    }
}`} />
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🎯 Play: The double-dispatch machine</h2>
        <p>Pick a cell of the element × operation matrix and watch both dispatches fire:</p>
        <DispatchMachine />
        <Good><strong>What you should notice:</strong> ① Dispatch #1 is Day 4’s ordinary dynamic dispatch —
          picking WHOSE accept runs. ② Dispatch #2 is overload resolution made safe, because inside
          Circle.accept the type of this is certain. ③ The executed cell = (element type × visitor type) —
          behavior chosen by TWO types in a single-dispatch language. That is the whole trick.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>⚖️ Play: The two-axis blast</h2>
        <p>Fire both growth requests in both architectures — Visitor’s honest price tag, measured:</p>
        <TwoAxisBlast />
        <Good><strong>What you should notice:</strong> ① The matrices are mirror images — neither world wins
          both axes (the Expression Problem is a law, not a failure). ② Visitor’s sweet spot is loud:
          STABLE element set, MULTIPLYING operations — ASTs, file nodes, document parts. ③ The Visitor
          interface listing visit(X) per type is simultaneously the cost (edit on new type) and a feature:
          the compiler lists every visitor needing attention — exhaustiveness as a to-do list (Day 19’s
          superpower, again).</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The full structure (shapes, frozen; operations, arriving)</h2>
        <Code html={`<span class="kw">public interface</span> ShapeVisitor&lt;R&gt; {          <span class="cm">// generic result type — modern touch</span>
    R visit(Circle c);
    R visit(Square s);
}

<span class="cm">// OPERATION #1 — geometry, in its own file:</span>
<span class="kw">public class</span> AreaVisitor <span class="kw">implements</span> ShapeVisitor&lt;Double&gt; {
    <span class="kw">public</span> Double visit(Circle c) { <span class="kw">return</span> Math.PI * c.r() * c.r(); }
    <span class="kw">public</span> Double visit(Square s) { <span class="kw">return</span> s.side() * s.side(); }
}

<span class="cm">// OPERATION #7, added two years later — zero shape files touched:</span>
<span class="kw">public class</span> SvgExportVisitor <span class="kw">implements</span> ShapeVisitor&lt;String&gt; {
    <span class="kw">public</span> String visit(Circle c) { <span class="kw">return</span> <span class="str">"&lt;circle r='"</span> + c.r() + <span class="str">"'/&gt;"</span>; }
    <span class="kw">public</span> String visit(Square s) { <span class="kw">return</span> <span class="str">"&lt;rect …/&gt;"</span>; }
}

<span class="cm">// client:</span>
<span class="kw">double</span> a = shape.accept(<span class="kw">new</span> AreaVisitor());
String svg = shape.accept(<span class="kw">new</span> SvgExportVisitor());`} />
        <p>One honest tension to name: visitors live OUTSIDE the elements, so they can only use what elements
          expose — sometimes forcing accessors that pure encapsulation would refuse (Day 2 grumbles). Records
          (Day 20) ease this: transparent value-ish elements suit visitors perfectly.</p>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Visitor’s natural habitat: trees (Day 28’s promise, kept)</h2>
        <p>The pairing that justifies the pattern: <strong>Composite builds a stable heterogeneous tree;
          Visitor multiplies operations over it.</strong> The canonical citizen is the compiler: ONE syntax
          tree, then type-checking pass, constant-folding pass, code-gen pass, lint passes — each a visitor,
          none touching the node classes. javac ships this as public API
          (<C>com.sun.source.util.TreeVisitor</C>); your IDE’s inspections are visitors over your code.</p>
        <p>And note the working style: tree visitors usually <strong>accumulate state</strong> — a running
          total, a match list, an indent level. That is correct visitor form: one visitor instance per
          traversal, fields as working memory, answer collected at the end.</p>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🌳 Play: The file-tree auditor</h2>
        <p>Day 28’s tree, three operations it has never heard of:</p>
        <TreeAuditor />
        <Good><strong>What you should notice:</strong> ① Three genuinely different concerns — aggregation,
          search, rendering — and File/Folder were never reopened. ② Each visitor carried private working
          state (totals, matches, depth) — born for one walk, discarded after. ③ This is Day 28’s homework
          answer running: toLatex() would be visitor #4, one new file.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>The modern verdict: sealed types + pattern matching</h2>
        <Code html={`<span class="cm">// Java 21 — the visitor's job, without accept():</span>
<span class="kw">sealed interface</span> Shape <span class="kw">permits</span> Circle, Square { }

<span class="kw">double</span> area(Shape s) {
    <span class="kw">return switch</span> (s) {
        <span class="kw">case</span> Circle c -&gt; Math.PI * c.r() * c.r();
        <span class="kw">case</span> Square sq -&gt; sq.side() * sq.side();
        <span class="cm">// no default needed: SEALED = compiler knows the whole family
        // add Pentagon → every such switch becomes a COMPILE ERROR until handled ✅</span>
    };
}`} />
        <ul>
          <li><strong>What it keeps:</strong> operations outside elements; compiler-enforced exhaustiveness
            (the Visitor interface’s real gift) — now via sealing (Day 12’s corner, full circle).</li>
          <li><strong>What it drops:</strong> the accept() boilerplate and the interface ceremony.</li>
          <li><strong>When classic Visitor still wins:</strong> you don’t own the hierarchy (can’t seal
            it, CAN add accept once and let others write visitors as plugins), pre-17 codebases, or when
            visitors carry rich traversal state/machinery worth a class.</li>
        </ul>
        <Warn><strong>The Expression Problem survives both spellings:</strong> sealed-switch is still closed on
          the type axis — adding Pentagon edits every switch. The improvement is that the COMPILER finds them
          all. Choose the axis; the dilemma is permanent.</Warn>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet — and the Month 2 graduation 🏆</h2>
        <ul>
          <li><strong>Intent:</strong> operations as classes over a stable element structure. accept(v) {'{'} v.visit(this); {'}'} = the double-dispatch trampoline (dynamic receiver + statically-known this).</li>
          <li><strong>Axes:</strong> open on operations, closed on types — the Expression Problem. Sweet spot: ASTs, trees (Composite’s soulmate), documents. Accumulating per-traversal state is proper form.</li>
          <li><strong>Modern:</strong> sealed + pattern-matching switch = visitor semantics, less ceremony; classic Visitor for unowned/pluggable hierarchies.</li>
        </ul>
        <table className="matrix">
          <thead>
            <tr><th>week</th><th>family</th><th>patterns</th></tr>
          </thead>
          <tbody>
            <tr><td>5</td><td>Creational — who calls new?</td><td>Singleton · Factory Method · Abstract Factory · Builder · Prototype</td></tr>
            <tr><td>6</td><td>Structural — how do objects fit?</td><td>Adapter · Decorator · Composite · Facade · Proxy · Flyweight · Bridge</td></tr>
            <tr><td>7</td><td>Behavioral I — how do they act?</td><td>Strategy · Observer · Command · State · Template Method</td></tr>
            <tr><td>8</td><td>Behavioral II — how do they talk?</td><td>Chain of Responsibility · Iterator · Mediator · Memento · Visitor</td></tr>
          </tbody>
        </table>
        <p>22 of the 23 — the missing <strong>Interpreter</strong> is, structurally, Composite + evaluate()
          per grammar node: your Day 28 expression calculator already was one (the quiz makes it official).
          You now hold the complete GoF vocabulary. <strong>Month 3 stops teaching tools and starts the real
          game: Parking Lot, BookMyShow, Splitwise — the classic LLD interview problems, solved with
          everything from Days 1–40.</strong></p>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: The "Expression Problem" — whose term, and the precise statement?'>
          <p>Philip Wadler (1998): define a datatype by cases, then add BOTH new cases and new functions over
            them, without recompiling existing code and keeping static type safety. OOP nails new cases;
            FP/visitors nail new functions; doing both is the famous open challenge. Dropping the name +
            statement in a Visitor discussion is instant depth.</p>
        </Reveal>
        <Reveal summary="Q: Why exactly does Java have SINGLE dispatch — and what would double dispatch mean natively?">
          <p>The vtable (Day 4) is indexed by the RECEIVER’s runtime class only; argument types are
            compile-time facts. Native double dispatch (CLOS, Julia multimethods) selects on the runtime types
            of multiple arguments. accept() is the standard simulation; pattern-matching switch is the modern
            sidestep.</p>
        </Reveal>
        <Reveal summary="Q: How do you write a PARTIAL visitor (only care about Circles)?">
          <p>Default methods on the visitor interface: every visit(X) defaults to a no-op (or to a
            visitDefault(Element)) — concrete visitors override only what they care about. The trade: you
            surrender the all-cases compile check, deliberately. (javac’s SimpleTreeVisitor is exactly
            this shape.)</p>
        </Reveal>
        <Reveal summary="Q: Who owns TRAVERSAL — the elements, the visitor, or an iterator?">
          <p>Three valid designs: elements walk themselves (Composite’s accept recurses into children —
            common), the visitor steers (needed for order control: post-order for code-gen, pre-order for
            printing), or an external iterator feeds a flat visitor (Day 37 + 40). Name the choice explicitly;
            mixed ownership is how subtrees get visited twice.</p>
        </Reveal>
        <Reveal summary="Q: Visitor vs Strategy — both are operations-as-objects. Difference?">
          <p>Strategy: ONE algorithm slot on ONE context, variants interchangeable (Day 31). Visitor: one
            operation spread over MANY element types (a visit method per type), dispatched by element identity.
            A strategy answers "which way?"; a visitor answers "what does this operation do at EACH node
            kind?".</p>
        </Reveal>
        <Reveal summary="Q: Real visitor APIs you can name-drop?">
          <p><C>com.sun.source.util.TreeVisitor</C> (javac AST), <C>javax.lang.model.element.ElementVisitor</C>
            (annotation processing), <C>java.nio.file.FileVisitor</C> (Files.walkFileTree — the file-tree
            auditor, in the JDK!), ASM’s ClassVisitor (bytecode). Spotting FileVisitor as "Day 40 over
            Day 28’s tree" is a lovely interview moment.</p>
        </Reveal>
        <Reveal summary="Q: 20-second LLD answer — pricing a heterogeneous cart (items, bundles, subscriptions)?">
          <p>"Stable element family (CartItem types, possibly Composite bundles), multiplying operations
            (price, tax, discount-eligibility, invoice-line rendering): operations as visitors — or sealed +
            switch on Java 21. New regulation = new visitor file; cart classes frozen since 2024." Pattern,
            axis justification, modern variant — done.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s11">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 40 complete — MONTH 2 COMPLETE! 🏆 The GoF catalog is yours.</strong> Homework (the
        graduation piece): take your Day 28 expression tree (<C>Num</C>, <C>Add</C>, <C>Multiply</C>) and
        visitor-ize it: <C>interface ExprVisitor&lt;R&gt; {'{'} R visit(Num n); R visit(Add a); R visit(Mul m); {'}'}</C>
        + <C>accept()</C> on each node. Write THREE visitors without touching the nodes:
        <C> EvalVisitor</C> (→ 14.0), <C>PrintVisitor</C> (→ "((3+4)*2)"), and <C>DepthVisitor</C> (→ tree
        height). Then the 2026 flourish: rewrite EvalVisitor as a sealed-interface pattern-matching switch and
        write one sentence on which spelling you’d ship and why. Congratulations — you came in knowing
        what a class was, and you leave having reimplemented javac’s architecture in miniature.
        <br /><br />
        Next: <strong>MONTH 3 — Classic LLD Problems.</strong> Week 9 begins with <strong>Day 41 — Parking
        Lot, Part 1</strong>: the most famous LLD interview question on Earth, attacked with the full Day 1–40
        toolbox — requirements → entities → patterns → code.
      </div>
    </div>
  )
}
