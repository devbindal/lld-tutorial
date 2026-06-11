import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: Telescoping constructor zoo ============ */
function TelescopeZoo() {
  const [optionals, setOptionals] = useState(3)
  const [swapped, setSwapped] = useState(false)

  const names = ['cheese', 'lettuce', 'tomato', 'sauce', 'egg', 'jalapeno', 'onion']
  const used = names.slice(0, optionals)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one constructor per combination — watch the zoo grow</div>
      <p style={{ fontSize: 14.5, marginBottom: 8 }}>
        A Burger has a required <C>size</C> plus optional toppings. Add toppings to the menu and count the
        constructors you'd need to cover the combinations people actually order:
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={() => setOptionals((n) => Math.min(n + 1, 7))} disabled={optionals >= 7}>
          🆕 add topping: {names[optionals] || '—'}
        </button>
        <button className="ghost act" onClick={() => { setOptionals(3); setSwapped(false) }}>reset</button>
      </div>
      <Code html={[
        `<span class="cm">// the "telescope" — each constructor calls the next bigger one:</span>`,
        `Burger(String size)`,
        ...used.map((_, i) => `Burger(String size, ${used.slice(0, i + 1).map((u) => `<span class="kw">boolean</span> ${u}`).join(', ')})`),
      ].join('\n')} />
      <div className="statbar" style={{ marginBottom: 10 }}>
        🔭 <span>constructors in the telescope:</span>
        <b>{optionals + 1} — and they only cover prefixes! "Just egg, nothing else" still forces the full monster ↓</b>
      </div>
      <Code html={`<span class="cm">// want ONLY ${used[used.length - 1] || 'egg'}? Pay the full toll, count the falses very carefully:</span>
Burger b = <span class="kw">new</span> Burger(<span class="str">"M"</span>, ${used.map((u, i) => (i === used.length - 1 ? '<span class="kw">true</span>' : '<span class="kw">false</span>')).join(', ')});`} />
      <button className="act" onClick={() => setSwapped(true)} style={{ marginTop: 4, marginBottom: 10 }} disabled={swapped}>
        😈 new intern swaps two of the booleans
      </button>
      {swapped && (
        <div className="statbar" style={{ background: '#FDECEC' }}>
          💥 <span>It COMPILES — booleans are interchangeable to the compiler. The bug ships, and a customer somewhere
            bites into a {used[Math.max(0, used.length - 2)]} burger they never ordered. Positional flags are unreadable AND unreviewable.</span>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 2: The burger builder counter ============ */
const TOPPINGS = [
  ['cheese', '🧀'], ['paneer', '🟫'], ['lettuce', '🥬'], ['tomato', '🍅'], ['sauce', '🟥'], ['egg', '🍳'],
]

function BurgerCounter() {
  const [size, setSize] = useState(null)
  const [picked, setPicked] = useState([])
  const [result, setResult] = useState(null)

  function toggle(t) {
    setResult(null)
    setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
  }
  function build() {
    if (!size) {
      setResult({ ok: false })
    } else {
      setResult({ ok: true })
    }
  }
  function reset() { setSize(null); setPicked([]); setResult(null) }

  const chain = `Burger.builder()${size ? `\n    .size(<span class="str">"${size}"</span>)` : ''}${picked.map((t) => `\n    .${t}()`).join('')}\n    .build();`

  return (
    <div className="panel">
      <div className="ptitle">Live demo · walk the counter — any order, then "wrap it up"</div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>SIZE (required)</div>
          <div className="modbtns">
            {['S', 'M', 'L'].map((s) => (
              <button key={s} className={size === s ? 'on' : ''} onClick={() => { setSize(s); setResult(null) }}>.size("{s}")</button>
            ))}
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', margin: '8px 0 6px' }}>TOPPINGS (optional, any order)</div>
          <div className="modbtns">
            {TOPPINGS.map(([t, e]) => (
              <button key={t} className={picked.includes(t) ? 'on' : ''} onClick={() => toggle(t)}>{e} .{t}()</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="act" onClick={build}>🔔 .build()</button>
            <button className="ghost act" onClick={reset}>reset</button>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Code html={chain} />
          {result && (result.ok ? (
            <div className="obj" style={{ borderColor: 'var(--green)' }}>
              <div className="oref">burger → Burger@f00d  (immutable ✅)</div>
              <div className="ofield" style={{ fontSize: 20, letterSpacing: 2 }}>
                🍞{picked.map((t) => TOPPINGS.find(([n]) => n === t)[1]).join('')}🥩🍞
              </div>
              <div className="ofield">size = "{size}" · no setters exist · born complete</div>
            </div>
          ) : (
            <div className="statbar" style={{ display: 'block', background: '#FDECEC' }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
                💥 IllegalStateException: size is required{'\n'}— build() is the quality gate: NO half-built burger ever leaves the counter.
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="statbar">
        🥪 <span>Notice: every line names what it sets, order doesn't matter, you skip what you don't want — and nothing exists until build() says it's complete.</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: Builder or overkill? ============ */
const JUDGE_ITEMS = [
  { d: 'ServerConfig: 2 required fields (host, port) + 9 optionals (timeouts, TLS, retries, pool sizes, proxy…).',
    a: 'builder', why: 'The textbook case: many optionals, mostly defaulted. A builder names every choice, skips the rest, and build() validates the combination. Telescoping here would need a zoo of constructors.' },
  { d: 'Point(x, y) — two required ints, no validation beyond existing.',
    a: 'ctor', why: 'Two required params, nothing optional: new Point(3, 4) is perfect. A builder here is pure ceremony (Day 16\'s KISS) — Point.builder().x(3).y(4).build() helps nobody.' },
  { d: 'Money(amount, currency) — both required, validated, immutable (your Day 20 class).',
    a: 'ctor', why: 'Two required fields with guards = constructor (or a named static factory like Money.of). Builders shine on OPTIONALITY, and Money has none.' },
  { d: 'An HTTP request: URL required; method, headers, timeout, body all optional with sensible defaults.',
    a: 'builder', why: 'So textbook that the JDK itself ships it: HttpRequest.newBuilder(uri).timeout(…).header(…).GET().build(). Required in the entry call, optionals fluent, build() seals it.' },
  { d: 'ReportOptions: 12 boolean flags (showHeader, landscape, colorMode, pageNumbers…).',
    a: 'builder', why: 'Twelve positional booleans is the intern-swap disaster from demo 1 at maximum power. A builder turns new ReportOptions(true,false,true,…) into self-reviewing lines: .landscape().pageNumbers().' },
  { d: 'DateRange(start, end) — both required, with one rule: start must be ≤ end.',
    a: 'ctor', why: 'Validation alone does NOT demand a builder — a constructor guard (or compact record constructor, Day 20) enforces start ≤ end perfectly. Builders are about many-optional construction, not about having rules.' },
]

function JudgeGame() {
  const [idx, setIdx] = useState(0)
  const [pickedA, setPickedA] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= JUDGE_ITEMS.length
  const cur = JUDGE_ITEMS[idx]

  function pick(k) {
    if (pickedA !== null) return
    setPickedA(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPickedA(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPickedA(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the API design desk — builder, or plain constructor?</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {JUDGE_ITEMS.length}</b>{score === JUDGE_ITEMS.length ? ' — you size the tool to the job.' : '. Rule of thumb: count the OPTIONALS, not the rules.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            📐 <span>case {idx + 1} of {JUDGE_ITEMS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.d}</p>
          <div className="modbtns">
            <button className={pickedA !== null && cur.a === 'builder' ? 'on' : ''}
              style={pickedA === 'builder' && cur.a !== 'builder' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('builder')}>🧱 builder</button>
            <button className={pickedA !== null && cur.a === 'ctor' ? 'on' : ''}
              style={pickedA === 'ctor' && cur.a !== 'ctor' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('ctor')}>🔨 constructor / static factory</button>
          </div>
          {pickedA !== null && (
            <div className="modexplain">
              {pickedA === cur.a ? '✅ Correct! ' : '❌ Not quite. '}
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
  { q: 'The "telescoping constructor" problem is…',
    o: ['Constructors that are too long to read', 'A chain of overloads (2, 3, 4… params) that still can\'t express arbitrary combinations — forcing monster calls full of positional flags', 'Constructors that call themselves', 'A JVM limitation'], a: 1,
    e: 'Overloads only cover prefixes of the parameter list. Want just the 7th optional? Pass falses for the other six — unreadable, unreviewable, and swap-prone since the compiler can\'t tell booleans apart.',
    w: { 0: 'Length alone isn\'t it — the overload-chain structure is.',
         2: 'Constructors calling each other is healthy this(...) chaining (Day 1).',
         3: 'No JVM limit involved.' },
    r: { id: 's2', label: 'Section 2 — the telescope' } },
  { q: 'The JavaBeans alternative (empty constructor + setters) trades the telescope for which two sins?',
    o: ['Slowness and memory', 'A window where the object EXISTS but is half-built/invalid, and permanent mutability — anyone can setX() forever', 'Too many imports', 'It cannot compile'], a: 1,
    e: 'Between new Burger() and the last setter, an invalid object is visible (and a forgotten setter ships silently). And the setters never disappear — your Day 2/20 immutability is gone for good.',
    w: { 0: 'Setters are no slower — speed isn\'t the sin.',
         2: 'Imports are fine. 🙂',
         3: 'It compiles beautifully — that\'s exactly the danger.' },
    r: { id: 's4', label: 'Section 4 — the setter "fix"' } },
  { q: 'In a fluent builder, each method like .cheese() ends with `return this;` — why?',
    o: ['Java requires it', 'It returns the SAME builder so calls chain: builder.size("M").cheese().tomato() — the Day 1 method-chaining trick, applied to construction', 'It creates a copy each time', 'It returns the burger'], a: 1,
    e: 'Day 1 listed "return this for chaining — the Builder pattern lives on this trick." Paid in full today: each call mutates the builder and hands it back for the next link.',
    w: { 0: 'Java requires no return convention — fluency is a design choice.',
         2: 'Copies each step would be wasteful (though some functional builders do!).',
         3: 'Only build() returns the burger — steps return the COUNTER.' },
    r: { id: 's5', label: 'Section 5 — the Builder, properly' } },
  { q: 'Where do REQUIRED vs OPTIONAL parameters go in an Effective-Java-style builder?',
    o: ['All in build()', 'Required → the builder\'s constructor/entry method (can\'t start without them); optional → fluent methods you may skip', 'All optional', 'Required as setters on the product'], a: 1,
    e: 'Burger.builder("M") or .size() validated in build — but the cleanest form demands requireds up front so an incomplete start is impossible, while optionals stay skippable.',
    w: { 0: 'All-in-build() works but finds the gap at runtime, late.',
         2: 'All-optional means nothing is guaranteed — invalid by default.',
         3: 'Setters on the PRODUCT would reopen the sealed sandwich.' },
    r: { id: 's5', label: 'Section 5 — required vs optional' } },
  { q: 'What makes build() the most important line of the pattern?',
    o: ['It prints the object', 'It is the single validation gate: cross-field checks run there, and only a COMPLETE, immutable product is ever released (fail fast, Day 19)', 'It clears memory', 'It calls super()'], a: 1,
    e: 'Until build(), nothing exists for other code to see. At build(), all rules run at once (size set? vegan + egg contradiction?). After build(), the product is immutable. No half-built window, ever.',
    w: { 0: 'Printing is incidental.',
         2: 'Memory is the GC\'s business.',
         3: 'super() belongs to constructors, not builders.' },
    r: { id: 's6', label: 'Section 6 — the build() gate' } },
  { q: 'Which JDK lines are builders you have already used?',
    o: ['Math.max and Math.min', 'new StringBuilder().append(…).append(…).toString() and HttpRequest.newBuilder(uri).timeout(…).build()', 'System.out.println', 'Integer.parseInt'], a: 1,
    e: 'StringBuilder is a builder by name and nature (mutable accumulator → final String). HttpRequest is the full modern pattern: required URI up front, fluent optionals, sealed by build().',
    w: { 0: 'Math methods are pure functions, no accumulation.',
         2: 'println is output.',
         3: 'parseInt converts — single-shot, no steps.' },
    r: { id: 's7', label: 'Section 7 — builders you already use' } },
  { q: 'The original GoF Builder (with a Director) differs from the everyday Effective-Java builder because…',
    o: ['It has no methods', 'GoF aims at building DIFFERENT REPRESENTATIONS via a builder interface driven by a Director; the everyday version just tames many-parameter construction of one class', 'It is newer', 'It cannot validate'], a: 1,
    e: 'GoF: Director runs the recipe, swappable ConcreteBuilders produce HTML vs PDF vs Text. Know it exists for interviews — but 95% of builders in the wild are the nested-static-class flavor.',
    w: { 0: 'It has the same step methods — plus a Director orchestrating them.',
         2: 'Age isn\'t the difference; intent is (representations vs parameter taming).',
         3: 'Both flavors can validate.' },
    r: { id: 's7', label: 'Section 7 — the GoF footnote' } },
  { q: 'When is a builder OVERKILL?',
    o: ['More than 5 fields', 'Few required params, no optionals — new Point(3,4) or Money.of(…) say it all; builders earn their keep on OPTIONALITY, not on mere existence of rules', 'Whenever records exist', 'Never'], a: 1,
    e: 'Count optionals. Zero or one → constructor/static factory. Many, mostly defaulted → builder. Validation alone is a constructor guard\'s job (DateRange taught that in the game).',
    w: { 0: 'Field COUNT isn\'t the trigger — five required fields can still suit a constructor.',
         2: 'Records and builders compose, not compete.',
         3: '"Never overkill" ignores Point.builder().x(3) absurdity.' },
    r: { id: 's8', label: 'Section 8 — builder or overkill' } },
]

/* ============ The page ============ */
export default function Day24() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 5 · Day 24 · Creational Patterns</div>
        <h1>Builder:<br />The Sandwich Counter Protocol</h1>
        <p>Some objects have two fields. Others have fourteen, eleven of them optional. Today: the pattern that
           turns the nine-parameter constructor nightmare into a readable, skippable, validated assembly line —
           and finally pays off Day 1's <C>return this</C> promise. Click everything.</p>
        <div className="chips">
          {['builder', 'telescoping constructors', 'fluent API', 'return this', 'build() gate', 'immutable product'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The sandwich counter</h2>
        <p>Watch how a sandwich shop builds your order. You walk the counter: bread? <em>multigrain.</em>
          Cheese? <em>yes.</em> Olives? <em>skip.</em> Sauce? <em>two of them.</em> Each question is asked
          <strong> by name</strong>, you answer in any order that comes up, you skip freely — and crucially,
          <strong> no half-made sandwich is ever handed across the counter.</strong> Only at the end —
          "wrap it up!" — does a complete, sealed sandwich exist.</p>
        <Code html={`   THREE WAYS TO ORDER A COMPLEX OBJECT

   ☎️ TELESCOPING CTOR              🔧 SETTERS (JavaBeans)         🥪 BUILDER
   one phone call, all at           sandwich handed over           walk the counter,
   once, in exact order:            EMPTY, then stuffed            choose by NAME,
   "M,true,false,false,             bite by bite — while           any order, skip
   true,false,true"  😵             you're already eating it 😬    freely — sealed at
                                                                   "wrap it up" ✅
   unreadable, swap-prone           half-built object visible,
   2ⁿ combos uncoverable            mutable forever`} />
        <Note><strong>Builder's intent:</strong> construct complex objects <strong>step by step</strong>, with
          named, skippable, order-free steps — and release only a <strong>complete, validated, immutable</strong>
          product. The counter (builder) is mutable scratch space; the sandwich (product) is sealed.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Crime scene #1: the telescope</h2>
        <p>It always starts innocently — a Burger with a size. Then cheese happens. Then lettuce…</p>
        <Code html={`<span class="kw">public</span> Burger(String size) { … }
<span class="kw">public</span> Burger(String size, <span class="kw">boolean</span> cheese) { … }
<span class="kw">public</span> Burger(String size, <span class="kw">boolean</span> cheese, <span class="kw">boolean</span> lettuce) { … }
<span class="kw">public</span> Burger(String size, <span class="kw">boolean</span> cheese, <span class="kw">boolean</span> lettuce, <span class="kw">boolean</span> tomato) { … }
<span class="cm">// …the telescope extends with every topping the menu adds</span>

<span class="cm">// and at the call site, six months later:</span>
Burger b = <span class="kw">new</span> Burger(<span class="str">"M"</span>, <span class="kw">true</span>, <span class="kw">false</span>, <span class="kw">true</span>, <span class="kw">false</span>, <span class="kw">false</span>, <span class="kw">true</span>);
<span class="cm">// quick: which true is the egg? Could you catch a swap in code review?</span>`} />
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🔭 Play: Grow the telescope</h2>
        <p>Add toppings to the menu and watch the constructor list stretch — then let the intern loose on the
          boolean soup.</p>
        <TelescopeZoo />
        <Good><strong>What you should notice:</strong> ① Overloads only cover PREFIXES — "just egg" still forces
          the full call with every false spelled out. ② The swap compiled silently: positional same-typed
          arguments are invisible to both compiler and reviewer. ③ Every new optional makes every call site
          longer. The API punishes its users for the class's growth.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Crime scene #2: the setter "fix"</h2>
        <p>The classic escape is JavaBeans style — empty constructor, then setters. Readable! But look at what
          it costs:</p>
        <Code html={`Burger b = <span class="kw">new</span> Burger();        <span class="cm">// ⚠️ b EXISTS now — empty, invalid, visible</span>
b.setSize(<span class="str">"M"</span>);
b.setCheese(<span class="kw">true</span>);
<span class="cm">// …phone rings, dev forgets setSauce()…</span>
kitchen.cook(b);                  <span class="cm">// 💥 half-built burger shipped — and it COMPILED</span>`} />
        <ul>
          <li><strong>The invalid window:</strong> between <C>new</C> and the last setter, an incomplete object
            exists. Pass it somewhere (or share it across threads) and the window becomes a production bug.
            There is no single moment where "is it complete?" can be checked.</li>
          <li><strong>Mutability forever:</strong> the setters don't expire. Your burger can be re-sauced by any
            code, any time — everything Day 2 and Day 20 taught you to prevent.</li>
        </ul>
        <Warn><strong>The deep problem with both crime scenes:</strong> construction knowledge is smeared — across
          overloads in one, across time in the other. What we want is ONE gathering place where the object comes
          together, gets validated, and is sealed. That place is the builder.</Warn>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The Builder, properly (Effective Java style)</h2>
        <Code html={`<span class="kw">public class</span> Burger {
    <span class="cm">// the PRODUCT: all final — no setters will ever exist (Day 2 ✅)</span>
    <span class="kw">private final</span> String size;
    <span class="kw">private final boolean</span> cheese, lettuce, tomato, egg;

    <span class="cm">// private! the ONLY way in is through the builder (Day 21's trick, reused)</span>
    <span class="kw">private</span> Burger(Builder b) {
        <span class="kw">this</span>.size = b.size;  <span class="kw">this</span>.cheese = b.cheese;
        <span class="kw">this</span>.lettuce = b.lettuce; <span class="kw">this</span>.tomato = b.tomato; <span class="kw">this</span>.egg = b.egg;
    }

    <span class="kw">public static</span> Builder builder() { <span class="kw">return new</span> Builder(); }

    <span class="cm">// the BUILDER: mutable scratch space, fluent steps</span>
    <span class="kw">public static class</span> Builder {
        <span class="kw">private</span> String size;                        <span class="cm">// required — checked at build()</span>
        <span class="kw">private boolean</span> cheese, lettuce, tomato, egg;  <span class="cm">// optionals, default off</span>

        <span class="kw">public</span> Builder size(String s) { <span class="kw">this</span>.size = s; <span class="kw">return this</span>; }  <span class="cm">// ← Day 1's</span>
        <span class="kw">public</span> Builder cheese()       { cheese = <span class="kw">true</span>;  <span class="kw">return this</span>; }  <span class="cm">//   return this,</span>
        <span class="kw">public</span> Builder tomato()       { tomato = <span class="kw">true</span>;  <span class="kw">return this</span>; }  <span class="cm">//   finally paid!</span>
        <span class="kw">public</span> Builder egg()          { egg = <span class="kw">true</span>;     <span class="kw">return this</span>; }

        <span class="cm">// 🔔 the QUALITY GATE — the most important method of the pattern:</span>
        <span class="kw">public</span> Burger build() {
            <span class="kw">if</span> (size == <span class="kw">null</span>) <span class="kw">throw new</span> IllegalStateException(<span class="str">"size is required"</span>);
            <span class="cm">// cross-field rules live here too: if (vegan && egg) throw …</span>
            <span class="kw">return new</span> Burger(<span class="kw">this</span>);     <span class="cm">// complete or nothing</span>
        }
    }
}

<span class="cm">// the call site — reads like the order ticket:</span>
Burger b = Burger.builder()
        .size(<span class="str">"M"</span>)
        .cheese()
        .egg()
        .build();`} />
        <p>Trace the design wins: <strong>named steps</strong> (no positional flags), <strong>any order, skip
          freely</strong> (no telescope), <strong>no half-built window</strong> (the Burger constructor runs only
          inside <C>build()</C>), <strong>one validation gate</strong> (fail fast, Day 19), and a product that is
          <strong> immutable for life</strong> (Day 20). The builder absorbs all the mess so the product can be
          pristine.</p>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🍔 Play: The burger counter</h2>
        <p>Build your order — watch the fluent chain write itself. Then try ringing the bell WITHOUT picking a
          size.</p>
        <BurgerCounter />
        <Good><strong>What you should notice:</strong> ① Toppings toggle in any order and the chain stays readable
          — each line says what it does. ② <C>build()</C> without size throws IMMEDIATELY with a named error —
          compare that to the setter world's silent half-burger. ③ The product card has no setter in sight:
          mutable counter, sealed sandwich.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Builders you already use (and the GoF footnote)</h2>
        <ul>
          <li><C>new StringBuilder().append("a").append("b").toString()</C> — the name says it: mutable
            accumulator, fluent steps, sealed by <C>toString()</C>. (Also Day 18's example of a LEGAL chain.)</li>
          <li><C>HttpRequest.newBuilder(uri).timeout(d).header("k","v").GET().build()</C> — the modern JDK
            showpiece: required URI up front, optionals fluent, <C>build()</C> seals.</li>
          <li><C>Stream.builder()</C>, <C>Locale.Builder</C>, Lombok's <C>@Builder</C> (generates today's whole
            section 5 from one annotation), and every test-data builder you'll ever write:
            <C> aUser().withAge(17).build()</C>.</li>
        </ul>
        <Reveal summary="The original GoF Builder (Director + builder interface) — click to reveal.">
          <p>The 1994 original solves a different, rarer problem: one construction RECIPE producing different
            REPRESENTATIONS. A <C>Director</C> runs the steps (<C>buildHeader(); buildBody(); buildFooter()</C>)
            against a <C>DocumentBuilder</C> interface — plug in <C>HtmlBuilder</C> or <C>PdfBuilder</C> and the
            same recipe yields different documents. Elegant, worth recognizing in interviews — but 95% of
            builders in real code are the Effective-Java nested-class flavor you built today.</p>
        </Reveal>
        <Reveal summary="What about records — don't they solve this? Click to reveal.">
          <p>Records (Day 20) nail <em>small, all-required</em> value objects. But a record with 11 components
            is still a positional 11-argument call — the telescope returns! The patterns compose instead:
            a <strong>builder that produces a record</strong> gives named optional steps AND an immutable
            value-semantics product. Use the right tool per axis: records for value semantics, builders for
            construction ergonomics.</p>
        </Reveal>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>📐 Play: Builder or overkill?</h2>
        <p>Six construction sites. The rule of thumb you're training: <strong>count the optionals, not the
          rules.</strong> Two cases are deliberate traps.</p>
        <JudgeGame />
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — The two-field builder</h3>
        <p><C>Point.builder().x(3).y(4).build()</C> — four lines to avoid <C>new Point(3, 4)</C>. Builders are
          for optionality and growth; ceremony on tiny types is KISS-debt (Day 16).</p>
        <h3>Trap 2 — Builder on top, setters below</h3>
        <p>A beautiful fluent builder… and the product still has public setters "for flexibility". You built the
          quality gate and left the back door open. Sealed product or nothing.</p>
        <h3>Trap 3 — build() that's just `return new`</h3>
        <p>No required-field checks, no cross-field rules — then the gate is decoration and half-built objects
          just acquired better syntax. Put the validation where the object is born.</p>
        <h3>Trap 4 — Reusing one builder for many products</h3>
        <p>After <C>build()</C>, the builder still holds old state — call <C>.egg().build()</C> again and you get
          yesterday's burger plus egg. Either make <C>build()</C> reset/invalidate the builder, or treat builders
          as one-shot (the common convention).</p>
        <h3>Trap 5 — Required fields hiding among the optionals</h3>
        <p>If <C>size</C> can only be discovered missing at runtime, consider forcing it earlier:
          <C> Burger.builder("M")</C> — requireds as entry arguments, optionals fluent. (Advanced teams go
          further with staged/step builders that make the compiler enforce the sequence — know the term.)</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Problem:</strong> many params, mostly optional → telescope (positional flags, 2ⁿ combos) or setters (half-built window + eternal mutability). Both smear construction.</li>
          <li><strong>Builder:</strong> nested static class · fluent steps with <C>return this</C> · requireds up front (or checked) · optionals skippable · <strong><C>build()</C> = single validation gate</strong> → immutable product with a private constructor.</li>
          <li>Counter mutable, sandwich sealed. No object exists until it's complete.</li>
          <li><strong>Rule of thumb:</strong> count optionals. 0–1 → constructor/static factory. Many → builder. Validation alone ≠ builder (guards do that).</li>
          <li>Sightings: StringBuilder, HttpRequest.newBuilder, Stream.builder, Lombok @Builder, test-data builders. GoF Director variant = same recipe, different representations (rare).</li>
          <li>Records + builders compose: builder for ergonomics, record for value semantics.</li>
          <li>Traps: 2-field ceremony · setters on the product · hollow build() · builder reuse · requireds lost among optionals.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Telescoping constructor" — whose coinage, which book/item?'>
          <p>Joshua Bloch, <em>Effective Java</em> Item 2: "Consider a builder when faced with many constructor
            parameters." His rule-of-thumb threshold: four or more parameters, especially with several optional.
            Citing the item number is the flex.</p>
        </Reveal>
        <Reveal summary="Q: StringBuilder vs StringBuffer — the one-line exam answer?">
          <p>Same API; StringBuffer's methods are <C>synchronized</C> (thread-safe, slower, legacy 1.0),
            StringBuilder (1.5+) is unsynchronized — use it in the 99% single-threaded case. Bonus: both exist
            because String concatenation in loops creates O(n²) garbage — the builder accumulates.</p>
        </Reveal>
        <Reveal summary="Q: Is a Builder thread-safe? Is its product?">
          <p>Builders are deliberately MUTABLE scratch space → not thread-safe, and shouldn't be shared. The
            PRODUCT (all-final, sealed at build()) is immutable → freely shareable across threads. "Confine the
            builder, share the product" — one sentence covering both halves.</p>
        </Reveal>
        <Reveal summary="Q: In the GoF version, what exactly does the Director do — and who keeps the product?">
          <p>The Director owns the RECIPE (order of buildPartA/buildPartB calls) and works against the Builder
            interface; the ConcreteBuilder accumulates and exposes <C>getResult()</C> — the Director never
            touches the product type. That separation lets one recipe produce HTML/PDF/Text. In the everyday EJ
            flavor, the calling code IS the director.</p>
        </Reveal>
        <Reveal summary='Q: What is a "fluent interface" — and is every builder fluent / every fluent thing a builder?'>
          <p>Fowler &amp; Evans' term for APIs designed to read as chained sentences via <C>return this</C>.
            Builders are usually fluent, but fluency ≠ building: <C>stream().filter().map()</C> is fluent
            transformation, mockito's <C>when().thenReturn()</C> is fluent stubbing. Builder = fluency +
            accumulation + a terminal build() gate.</p>
        </Reveal>
        <Reveal summary="Q: How would you make REQUIRED fields compile-time-safe in a builder?">
          <p>Staged (step) builders: each step returns a DIFFERENT interface —
            <C> builder().size("M")</C> returns a type that only then offers toppings/build(). Skipping a
            required step doesn't compile. Cost: lots of interfaces — used where misconstruction is expensive.
            Knowing the name "staged builder" is usually enough.</p>
        </Reveal>
        <Reveal summary="Q: What does Lombok @Builder actually generate — and one thing to watch?">
          <p>The whole EJ apparatus: static builder(), fluent setters, build(), optionally
            <C> toBuilder()</C> (Prototype-flavored copies). Watch-outs: no validation unless you add it
            (hollow-gate trap), and <C>@Singular</C> needed for collection fields to avoid sharing a caller's
            list (defensive-copy concern, Day 2).</p>
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
        <strong>Day 24 complete?</strong> Homework: build <C>Pizza</C> with the full pattern — required
        <C> size</C>, optionals <C>cheese, mushrooms, olives, extraSauce, glutenFreeBase</C>, all-final fields,
        private constructor, nested <C>Builder</C>, and a <C>build()</C> that enforces TWO rules: size is
        required, and <C>glutenFreeBase</C> is unavailable for size "XL" (cross-field validation!). Write a main
        that ① builds a valid pizza, ② triggers both failures and prints the messages, ③ proves immutability by
        trying to change the result (what do you find?). Bonus: rewrite the call with the requireds-up-front
        style — <C>Pizza.builder("L")</C> — and note which you prefer.
        <br /><br />
        Next: <strong>Day 25 — Prototype</strong>: the last creational pattern — when building from scratch is
        expensive and the fastest factory is a photocopier. Plus Java's cloning minefield, and Week 5 wrapped.
      </div>
    </div>
  )
}
