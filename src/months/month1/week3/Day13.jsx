import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The flight simulator ============ */
const BIRDS = {
  Sparrow: { flies: true, out: '🐦 Sparrow flaps its little wings and takes off!' },
  Eagle: { flies: true, out: '🦅 Eagle soars majestically!' },
  Penguin: { flies: false, out: '💥 UnsupportedOperationException: penguins cannot fly!\n   at Penguin.fly(Penguin.java:4)\n   at TravelApp.makeItFly(TravelApp.java:9)   ← client code CRASHED' },
}

function FlightSim() {
  const [world, setWorld] = useState('naive')
  const [log, setLog] = useState(null)

  function run(name) {
    const b = BIRDS[name]
    if (world === 'naive') {
      setLog({ name, ok: b.flies, text: b.out, compile: true })
    } else {
      if (b.flies) setLog({ name, ok: true, text: b.out, compile: true })
      else setLog({ name, ok: true, compile: false, text: '✋ COMPILE ERROR: incompatible types — Penguin is not a FlyingBird.\n   The mistake is caught BEFORE the program ever runs. 🎉' })
    }
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the client method trusts its parameter type — should it?</div>
      <div className="modbtns">
        <button className={world === 'naive' ? 'on' : ''} onClick={() => { setWorld('naive'); setLog(null) }}>😇 naive hierarchy</button>
        <button className={world === 'fixed' ? 'on' : ''} onClick={() => { setWorld('fixed'); setLog(null) }}>🛠️ fixed hierarchy</button>
      </div>
      <Code html={world === 'naive'
        ? `<span class="cm">// every Bird promises fly() — says the naive hierarchy</span>
<span class="kw">void</span> makeItFly(Bird b) {
    b.fly();              <span class="cm">// I trust ANY Bird handed to me…</span>
}`
        : `<span class="cm">// only FlyingBird promises fly() — honest hierarchy</span>
<span class="kw">void</span> makeItFly(FlyingBird b) {
    b.fly();              <span class="cm">// every FlyingBird really CAN fly ✅</span>
}`} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {Object.keys(BIRDS).map((n) => (
          <button key={n} className="act" onClick={() => run(n)}>makeItFly(new {n}())</button>
        ))}
      </div>
      {log && (
        <div className="statbar" style={{ display: 'block', background: log.ok ? (log.compile ? '#FFF6E8' : '#EAF7EF') : '#FDECEC' }}>
          <pre style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre-wrap', margin: 0 }}>{log.text}</pre>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 2: Square vs Rectangle lab ============ */
function RectLab() {
  const [result, setResult] = useState(null)

  function run(kind) {
    if (kind === 'rect') {
      setResult({ kind, w: 4, h: 5, area: 20, pass: true })
    } else {
      // Square keeps width == height: each setter sets BOTH sides
      setResult({ kind, w: 5, h: 5, area: 25, pass: false })
    }
  }

  const box = result && (
    <div style={{
      width: result.w * 26, height: result.h * 26, background: result.pass ? '#DCE7FF' : '#FFE0DE',
      border: `2px solid ${result.pass ? 'var(--blue)' : 'var(--red)'}`, borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'IBM Plex Mono', fontSize: 12,
    }}>{result.w}×{result.h}</div>
  )

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one client test, two "rectangles"</div>
      <Code html={`<span class="cm">// the client's totally reasonable expectation of ANY Rectangle:</span>
<span class="kw">void</span> clientTest(Rectangle r) {
    r.setWidth(<span class="num">4</span>);
    r.setHeight(<span class="num">5</span>);
    assert r.area() == <span class="num">20</span>;   <span class="cm">// width and height are independent… right?</span>
}`} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={() => run('rect')}>clientTest(new Rectangle())</button>
        <button className="act" onClick={() => run('square')}>clientTest(new Square())</button>
      </div>
      {result && (
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          {box}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="statbar" style={{ display: 'block', background: result.pass ? '#EAF7EF' : '#FDECEC' }}>
              {result.kind === 'rect' ? (
                <span>✅ <b>PASS.</b> setWidth(4) → 4×5. setHeight(5) → 4×5. area = 20, as promised.</span>
              ) : (
                <span>💥 <b>ASSERTION FAILED: expected 20, got 25.</b> Square's setWidth(4) secretly set BOTH sides
                  to 4; then setHeight(5) set BOTH to 5. The client's assumption — "width and height are
                  independent" — was a promise Rectangle made and Square broke.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: The contract checker ============ */
const CONTRACT_ITEMS = [
  { d: 'Parent\'s save(File f) accepts any writable file. Child\'s override throws if the file is not .xml — for inputs the parent accepted fine.',
    a: 'bad', why: 'The child STRENGTHENED the precondition — it demands more than the parent did. Clients who satisfied the parent\'s contract now explode. Children may demand LESS, never more.' },
  { d: 'Parent\'s sort() uses bubble sort. Child overrides it with quicksort — same ordering result, just faster.',
    a: 'ok', why: 'The contract is about BEHAVIOR visible to the client (a sorted list), not the algorithm inside. Faster with the same promises = perfect substitution.' },
  { d: 'Parent\'s getShape() returns Shape. The child\'s override returns Circle (a subtype of Shape).',
    a: 'ok', why: 'Returning something MORE specific is allowed — every Circle is a usable Shape, so no client can be surprised. (Java supports this: covariant return types.)' },
  { d: 'Parent\'s withdraw(amount) promises: balance decreases by amount. Child SilentAccount\'s override does nothing when amount > 1000 — no error, no withdrawal.',
    a: 'bad', why: 'A do-nothing override silently breaks the postcondition (balance changed). Worse than throwing: the client thinks it worked. Postconditions may be strengthened, never weakened.' },
  { d: 'Parent\'s parse(String s) accepts only digits. Child\'s override accepts digits AND spaces (it trims them).',
    a: 'ok', why: 'The child WEAKENED the precondition — it accepts everything the parent did, plus more. No existing client can break. Demanding less is always safe.' },
  { d: 'Parent\'s getItems() never returns null (at worst an empty list). The child\'s override returns null when there are no items.',
    a: 'bad', why: 'Clients were promised "never null" and wrote loops without null checks. The child weakened the postcondition → NullPointerExceptions in code that was correct before.' },
]

function ContractChecker() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= CONTRACT_ITEMS.length
  const cur = CONTRACT_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · you are the contract lawyer — legal substitution or breach?</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {CONTRACT_ITEMS.length}</b>{score === CONTRACT_ITEMS.length ? ' — honor the contract, always.' : '. Re-read the pre/post rules and replay.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            ⚖️ <span>case {idx + 1} of {CONTRACT_ITEMS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.d}</p>
          <div className="modbtns">
            <button className={picked !== null && cur.a === 'ok' ? 'on' : ''}
              style={picked === 'ok' && cur.a !== 'ok' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('ok')}>✅ legal substitute</button>
            <button className={picked !== null && cur.a === 'bad' ? 'on' : ''}
              style={picked === 'bad' && cur.a !== 'bad' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('bad')}>🚨 contract breach</button>
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ Correct! ' : '❌ Not quite. '}
              {cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={next}>Next case →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Liskov Substitution Principle says…',
    o: ['Subclasses must be smaller than parents', 'Anywhere the parent type is expected, ANY subtype must work without the client noticing or breaking', 'All classes need interfaces', 'Inheritance is forbidden'], a: 1,
    e: 'Substitutability is the whole point of inheritance: client code written against Bird must keep working for every Bird subclass, today\'s and tomorrow\'s. If a subtype surprises the client, the is-a was a lie.' },
  { q: 'class Penguin extends Bird overrides fly() to throw UnsupportedOperationException. What is the LSP-correct fix?',
    o: ['Catch the exception in every client', 'Restructure: Bird without fly(); FlyingBird extends Bird adds fly(); Penguin extends plain Bird', 'Delete the Penguin class', 'Make fly() static'], a: 1,
    e: 'The parent promised too much. Move the promise (fly) down into a FlyingBird type, so only birds that CAN fly make it. Clients needing flight ask for FlyingBird — and the compiler keeps penguins out.' },
  { q: 'Mathematically every square IS a rectangle. Why does Square extends Rectangle still fail LSP?',
    o: ['Java cannot model squares', 'Rectangle\'s contract implies setWidth and setHeight are independent; Square must break that to stay square — behavior, not math, decides is-a', 'Squares have no area method', 'Rectangles are final'], a: 1,
    e: 'LSP is about BEHAVIORAL substitution. The mutable Rectangle promises independent sides; a Square cannot keep that promise. (Make both immutable value objects and the conflict disappears — no setters, no broken promise.)' },
  { q: 'Which change is a child override ALLOWED to make?',
    o: ['Demand stricter inputs than the parent (strengthen precondition)', 'Deliver less than the parent promised (weaken postcondition)', 'Accept MORE inputs and/or deliver MORE than promised', 'Throw brand-new exceptions for valid inputs'], a: 2,
    e: 'The memory rule: children may demand LESS and deliver MORE — never the reverse. Weaker preconditions ✅, stronger postconditions ✅, preserved invariants ✅, no new surprise exceptions ✅.' },
  { q: 'Arrays.asList("a","b").add("c") throws UnsupportedOperationException at runtime. What does this illustrate?',
    o: ['A bug in Java', 'A real-world LSP violation: it claims to be a List but refuses part of List\'s contract', 'Correct use of generics', 'An OCP violation'], a: 1,
    e: 'It compiles — the type system is satisfied — but the object breaks the behavioral contract of List.add. Even the JDK has LSP scars; that is why "compiles" ≠ "substitutable".' },
  { q: 'You find this in client code: if (account instanceof SavingsAccount) { …special handling… }. What does it usually signal?',
    o: ['Good defensive programming', 'An LSP smell: subtypes are NOT truly substitutable, so clients must check who they really got', 'A performance optimization', 'Required Java syntax'], a: 1,
    e: 'If clients must ask "which child are you?" before trusting the parent type, substitution has already failed. Fix the hierarchy (or use polymorphism) instead of patching every client with instanceof.' },
  { q: 'A child overrides a parent method with an EMPTY body (the parent\'s version did real work). This is…',
    o: ['Fine — overriding allows anything', 'An LSP violation: the postcondition silently disappears, and clients believe work happened', 'Recommended for performance', 'Only a problem if it throws'], a: 1,
    e: 'Silent no-op overrides are the sneakiest violation — nothing crashes, data just quietly diverges. If a child needs to "turn off" parent behavior, the is-a relationship is fake.' },
  { q: 'How does LSP connect to Day 7\'s inheritance checklist?',
    o: ['It doesn\'t', 'LSP IS checklist item 2 — "substitutable everywhere" — the formal test for whether is-a is real; if it fails, use composition instead', 'LSP replaces composition', 'LSP only applies to interfaces'], a: 1,
    e: 'Day 7 said: extend only if the child is substitutable. LSP is that rule with a name and precise contract terms. Fails LSP → don\'t inherit → compose (has-a) or split the type.' },
]

/* ============ The page ============ */
export default function Day13() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 3 · Day 13</div>
        <h1>Liskov Substitution:<br />The Stand-In Must Know the Whole Act</h1>
        <p>The L of SOLID is the rule that decides whether your inheritance is real or fake. Starring the
           famous penguin that couldn't fly and the square that wasn't quite a rectangle. After today you will
           never trust an <em>extends</em> without interrogating it first. Click everything.</p>
        <div className="chips">
          {['LSP', 'substitutability', 'contracts', 'penguin problem', 'square–rectangle', 'behavioral is-a'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The stand-in actor rule</h2>
        <p>Think of a <strong>stand-in actor</strong> in a long-running play. The lead is sick; the stand-in goes
          on. The deal is absolute: the stand-in performs <strong>every scene in the script, the way the script
          promises</strong>. The audience (who bought tickets for the play, not the actor) must not notice or
          care. A stand-in who skips Act 2, or suddenly demands the other actors speak louder, ruins the show
          for an audience that did nothing wrong.</p>
        <p>In code: the <strong>parent type is the script</strong>, every <strong>subclass is a stand-in</strong>,
          and the <strong>client code is the audience</strong>:</p>
        <Note><strong>LSP in one line:</strong> anywhere the parent type is expected, <em>any</em> subtype must
          work — without the client knowing, checking, or breaking. A child must honor <strong>every promise</strong>
          the parent's contract makes.</Note>
        <Code html={`   "IT COMPILES" vs "IT SUBSTITUTES" — two different bars

   compiler checks SIGNATURES ✅        only YOU check BEHAVIOR ⚠️
   (same method names & types)         (same promises kept)

          client:  <span class="kw">void</span> makeItFly(Bird b) { b.fly(); }
                                  ▲
                 ┌────────────────┼────────────────┐
              Sparrow ✅        Eagle ✅         Penguin 💥
              flies as          flies as        compiles fine…
              promised          promised        then EXPLODES at runtime`} />
        <Reveal summary="Who is Liskov? (interviewers love this) Click to reveal.">
          <p><strong>Barbara Liskov</strong>, MIT professor and Turing Award winner (2008), stated the idea in 1987.
            The formal version: if S is a subtype of T, then objects of T may be replaced by objects of S without
            altering any desirable property of the program. The casual version you should say in interviews:
            <em> "a subclass must be usable through the parent's interface without the client knowing the
            difference."</em></p>
        </Reveal>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The crime: a penguin in the cast</h2>
        <p>Every Java beginner writes this hierarchy — it reads like a biology textbook, what could go wrong:</p>
        <Code html={`<span class="kw">public class</span> Bird {
    <span class="kw">public void</span> fly() { System.out.println(<span class="str">"flying!"</span>); }   <span class="cm">// "all birds fly" — promise made</span>
}

<span class="kw">public class</span> Sparrow <span class="kw">extends</span> Bird { }    <span class="cm">// fine — keeps the promise</span>

<span class="kw">public class</span> Penguin <span class="kw">extends</span> Bird {     <span class="cm">// biology says is-a… </span>
    @Override
    <span class="kw">public void</span> fly() {
        <span class="kw">throw new</span> UnsupportedOperationException(<span class="str">"penguins cannot fly!"</span>);
    }                                       <span class="cm">// ❌ promise BROKEN, loudly</span>
}`} />
        <p>The compiler is perfectly happy — Penguin has a <C>fly()</C> with the right signature. But the
          <strong> signature was never the promise</strong>; the promise was <em>"calling fly() makes me fly."</em>
          Now every client written against <C>Bird</C> carries a hidden landmine, and the client is the one who
          explodes — code that was correct when written, broken by a class added later, in another file,
          by another person.</p>
        <Warn><strong>That is what makes LSP violations evil:</strong> the bug appears in the CLIENT's stack trace,
          far from the real culprit (the dishonest subclass). You debug <C>TravelApp</C> for an hour before
          suspecting <C>Penguin.java</C>.</Warn>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🐧 Play: The flight simulator</h2>
        <p>Pass each bird to the client method. Then switch to the <strong>fixed hierarchy</strong> and try the
          penguin again — notice <em>when</em> the error happens in each world.</p>
        <FlightSim />
        <Good><strong>What you should notice:</strong> ① In the naive world the penguin compiles and then crashes
          <em> at runtime, inside client code</em>. ② In the fixed world the same mistake is caught at
          <em> compile time</em> — it cannot even be written. Good hierarchies turn runtime surprises into
          compile errors. ③ Sparrow and Eagle never noticed the refactor — honest subtypes are unaffected.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The fix: move the promise, don't break it</h2>
        <p>The parent promised too much. The repair is always one of these:</p>
        <Code html={`<span class="cm">// FIX 1 — restructure: push the ability DOWN to those who really have it</span>
<span class="kw">public abstract class</span> Bird {
    <span class="kw">public void</span> eat()  { <span class="cm">/* all birds eat */</span> }
    <span class="cm">// note: NO fly() here. Bird no longer promises flight.</span>
}

<span class="kw">public abstract class</span> FlyingBird <span class="kw">extends</span> Bird {
    <span class="kw">public abstract void</span> fly();          <span class="cm">// the promise lives here now</span>
}

<span class="kw">public class</span> Sparrow <span class="kw">extends</span> FlyingBird {
    <span class="kw">public void</span> fly() { <span class="cm">/* flap flap */</span> }
}
<span class="kw">public class</span> Penguin <span class="kw">extends</span> Bird {     <span class="cm">// a Bird, honestly — just not a flying one</span>
    <span class="kw">public void</span> swim() { <span class="cm">/* 🏊 what penguins ACTUALLY do */</span> }
}

<span class="cm">// clients now ask for exactly what they need:</span>
<span class="kw">void</span> makeItFly(FlyingBird b) { b.fly(); }   <span class="cm">// penguins rejected by the COMPILER ✅</span>`} />
        <ul>
          <li><strong>Fix 1 — split the hierarchy</strong> (above): create a more honest intermediate type. Promise
            only what every member can keep.</li>
          <li><strong>Fix 2 — capability interfaces:</strong> <C>interface Flyer {'{'} void fly(); {'}'}</C> —
            classes implement only the abilities they truly have. (This becomes tomorrow's principle — ISP.)</li>
          <li><strong>Fix 3 — composition:</strong> if the is-a was never real, stop inheriting. A
            <C> ToyPenguin</C> shouldn't extend <C>Robot</C> to reuse motors — it should <em>have</em> a motor (Day 7).</li>
        </ul>
        <Note><strong>The design lesson:</strong> base classes and interfaces should promise the
          <strong> intersection</strong> of what ALL members can do — never the union of what SOME can do.
          Small honest promises scale; big optimistic promises breed penguins.</Note>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The square–rectangle paradox</h2>
        <p>The penguin was loud — it threw. The scarier violations are <strong>silent</strong>. The most famous:
          mathematically, every square IS a rectangle. So this should be fine… right?</p>
        <Code html={`<span class="kw">public class</span> Rectangle {
    <span class="kw">protected int</span> w, h;
    <span class="kw">public void</span> setWidth(<span class="kw">int</span> w)  { <span class="kw">this</span>.w = w; }
    <span class="kw">public void</span> setHeight(<span class="kw">int</span> h) { <span class="kw">this</span>.h = h; }
    <span class="kw">public int</span> area() { <span class="kw">return</span> w * h; }
}

<span class="kw">public class</span> Square <span class="kw">extends</span> Rectangle {
    @Override <span class="kw">public void</span> setWidth(<span class="kw">int</span> w)  { <span class="kw">this</span>.w = w; <span class="kw">this</span>.h = w; }  <span class="cm">// must stay square!</span>
    @Override <span class="kw">public void</span> setHeight(<span class="kw">int</span> h) { <span class="kw">this</span>.w = h; <span class="kw">this</span>.h = h; }  <span class="cm">// must stay square!</span>
}`} />
        <p>Square did the only thing it could to remain a square — and in doing so it broke Rectangle's
          <em> unwritten promise</em>: "width and height change independently." No exception, no crash — just
          clients silently computing wrong areas. Run the experiment:</p>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🟥 Play: The area assertion</h2>
        <p>The client sets width 4, height 5, and expects area 20 — a fair reading of Rectangle's contract.
          Run it with both shapes and watch the drawn result.</p>
        <RectLab />
        <Good><strong>What you should notice:</strong> ① Rectangle passes; Square fails the SAME test — so Square
          is not substitutable, so behaviorally <strong>Square is NOT a Rectangle</strong>, whatever math says.
          ② is-a in LLD means <em>"behaves-as"</em>, not <em>"is classified as in the real world"</em> — modeling
          the world (Day 10) still has to respect behavior. ③ The paradox vanishes if both are
          <strong> immutable</strong>: no setters → no promise about independent sides → nothing to break.
          (Immutability quietly fixes another principle — remember Day 2.)</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The contract, precisely (the rules of substitution)</h2>
        <p>Every method has an implicit <strong>contract</strong>: what it requires before
          (<strong>precondition</strong>), what it guarantees after (<strong>postcondition</strong>), and what
          must always stay true about the object (<strong>invariant</strong>). A child override must obey:</p>
        <table className="matrix">
          <thead>
            <tr><th>contract part</th><th>child may…</th><th>child may NOT…</th></tr>
          </thead>
          <tbody>
            <tr><td><b>precondition</b> (what I require)</td><td className="yes">demand LESS (accept more inputs)</td><td className="no">demand MORE (reject inputs the parent accepted)</td></tr>
            <tr><td><b>postcondition</b> (what I promise)</td><td className="yes">deliver MORE (stronger guarantee, more specific return)</td><td className="no">deliver LESS (weaker result, null, no-op)</td></tr>
            <tr><td><b>invariants</b> (what stays true)</td><td className="yes">preserve them all</td><td className="no">break any (Square broke "sides independent")</td></tr>
            <tr><td><b>exceptions</b></td><td className="yes">throw fewer / more specific</td><td className="no">throw NEW surprises for valid inputs (Penguin!)</td></tr>
          </tbody>
        </table>
        <Note><strong>Memory trick:</strong> a good stand-in <strong>demands less and delivers more</strong> —
          never the reverse. Easier to call, richer in result, zero new surprises.</Note>
        <Reveal summary="How Java itself enforces a little of this — click to reveal.">
          <p>Java bakes two contract rules into the compiler: an override may <strong>return a subtype</strong>
            (covariant returns — delivering more ✅) and may <strong>not throw broader checked exceptions</strong>
            than the parent declares ✅. But preconditions, postconditions and invariants live in javadoc and in
            heads — no compiler checks them. That's why LSP is a <em>design</em> principle, not a language feature.</p>
        </Reveal>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>⚖️ Play: The contract lawyer</h2>
        <p>Six override cases. Judge each with the table above: did the stand-in demand less and deliver more —
          or breach the contract? <strong>Predict, then click.</strong></p>
        <ContractChecker />
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Smells in the wild (and real JDK scars)</h2>
        <h3>Smell 1 — instanceof checks in client code</h3>
        <Code html={`<span class="kw">if</span> (bird <span class="kw">instanceof</span> Penguin) { <span class="cm">/* skip the flying part */</span> }   <span class="cm">// ❌ clients sorting out dishonest children</span>`} />
        <p>If clients must ask "which child did I really get?", substitution is already dead. Fix the hierarchy,
          not the client.</p>
        <h3>Smell 2 — UnsupportedOperationException in overrides</h3>
        <p>A method that exists only to refuse = a promise the class should never have made. Real JDK example:
          <C> Arrays.asList(...)</C> returns a <C>List</C> whose <C>add()</C> throws — it compiles as a List but
          won't behave as one. Even the JDK has scars (you met <C>Stack extends Vector</C> on Day 7).</p>
        <h3>Smell 3 — silent no-op overrides</h3>
        <p>Worse than throwing: <C>@Override public void audit() {'{ }'}</C> — clients believe auditing happened.
          Data corruption with no stack trace.</p>
        <h3>Smell 4 — overrides that "almost" match</h3>
        <p>Child rounds differently, returns null instead of empty, treats edge cases "its own way". Each tiny
          divergence is a broken postcondition some client depends on.</p>
        <h3>Smell 5 — base classes that keep growing promises</h3>
        <p>Every method added to a base class is a new promise EVERY subclass must keep, forever. Before adding
          <C> fly()</C> to <C>Bird</C>, ask: can <em>all</em> current and future birds keep it?</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>LSP:</strong> any subtype must work wherever the parent is expected — client never knows, checks, or breaks. is-a means <strong>behaves-as</strong>.</li>
          <li>Compiles ≠ substitutes: the compiler checks signatures; YOU check promises.</li>
          <li><strong>Contract rules:</strong> preconditions may weaken, postconditions may strengthen, invariants preserved, no new exceptions. "Demand less, deliver more."</li>
          <li><strong>Penguin (loud violation):</strong> override that throws → split the hierarchy (FlyingBird), capability interfaces, or composition.</li>
          <li><strong>Square (silent violation):</strong> override that breaks an unwritten invariant → silent wrong results; immutability dissolves it.</li>
          <li><strong>Smells:</strong> instanceof in clients · UnsupportedOperationException · empty overrides · null where parent never returned null · Arrays.asList().add().</li>
          <li>Base types promise the <strong>intersection</strong> of all members' abilities, never the union.</li>
          <li>LSP = Day 7's checklist item 2, formalized. Fails LSP → don't inherit → compose.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Recite Liskov's formal 1987 definition (fill the blanks).">
          <p><em>"If S is a subtype of T, then objects of type T may be replaced with objects of type S without
            altering any of the desirable properties of the program."</em> Barbara Liskov, MIT, Turing Award
            2008 (with the behavioral-subtyping paper co-authored by Jeannette Wing, 1994).</p>
        </Reveal>
        <Reveal summary="Q: The contract rules have fancy variance names — what are they?">
          <p>Preconditions may only weaken = <strong>contravariance</strong> of requirements. Postconditions may
            only strengthen = <strong>covariance</strong> of promises. Java enforces the return-type half
            (covariant returns OK) but NOT parameter contravariance — changing a parameter type creates an
            overload, not an override. Dropping these terms correctly is an instant level-up.</p>
        </Reveal>
        <Reveal summary='Q: What is the "history constraint" — the LSP rule everyone forgets?'>
          <p>Liskov & Wing's extra rule: a subtype must not allow STATE CHANGES the parent's contract forbids.
            A MutablePoint extending ImmutablePoint violates it even with identical method signatures — clients
            of the parent assume the object never changes over time ("history"). Square/Rectangle is partly a
            history-constraint story too.</p>
        </Reveal>
        <Reveal summary="Q: Give the three accepted resolutions of the square–rectangle paradox.">
          <p>① Make both immutable values (no setters → no broken promise — preferred). ② Keep them as separate
            types under a common Shape interface (no is-a between them). ③ Keep Rectangle-only and treat squares
            as a runtime condition (width == height), not a type. "Inherit anyway and document it" is the one
            WRONG answer.</p>
        </Reveal>
        <Reveal summary="Q: Java collections throw UnsupportedOperationException by DESIGN — defend or attack?">
          <p>The framework calls add/remove "optional operations" so one List interface covers mutable AND
            immutable implementations — pragmatic, but it trades away LSP (compile-time List ≠ guaranteed add).
            Knowing it's a deliberate, documented, criticized trade-off — not an accident — is the senior take.
            (C# chose differently with separate read-only interfaces.)</p>
        </Reveal>
        <Reveal summary="Q: Does LSP apply to interfaces too, or only class inheritance?">
          <p>Fully applies — every implements is a substitutability claim against the interface's documented
            contract. Arrays.asList's add() proves an interface can be "implemented" yet behaviorally violated.
            LSP is about CONTRACTS, and interfaces are pure contract.</p>
        </Reveal>
        <Reveal summary="Q: An override is 10x slower than the parent's version. LSP violation?">
          <p>Gray zone — and a great discussion answer: signatures and results comply, but if the parent's
            contract implies performance characteristics (documented O(1) access, like RandomAccess lists),
            grossly different complexity CAN break clients. Strict LSP says contracts include documented
            behavior; in practice, flag extreme cases. The point is recognizing contracts go beyond
            types.</p>
        </Reveal>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 13 complete?</strong> Homework: in your IDE, build the broken world first —
        <C>Account</C> with <C>withdraw(amount)</C>, then <C>FixedDepositAccount extends Account</C> whose
        <C> withdraw()</C> throws <C>UnsupportedOperationException</C> (no withdrawals before maturity!). Write a
        client <C>payRent(Account a)</C> and watch it explode. Then fix it LSP-style: split into
        <C>Account</C> (no withdraw promise) and <C>WithdrawableAccount</C>, move <C>payRent</C> to demand
        <C> WithdrawableAccount</C>, and confirm the compiler now rejects the fixed deposit. Bonus: which of the
        four contract rules did the original design break?
        <br /><br />
        Next: <strong>Day 14 — Interface Segregation Principle</strong>: today's "capability interfaces" fix, grown
        into a full principle — why one fat interface forces classes to lie, and how to slice it.
      </div>
    </div>
  )
}
