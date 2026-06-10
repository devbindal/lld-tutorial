import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: abstract class vs interface chooser ============ */
const AVI_ROWS = [
  ['Can have instance fields (state)',            { abs: 1, intf: 0 }],
  ['Can have constructors',                       { abs: 1, intf: 0 }],
  ['Can have method bodies',                      { abs: 1, intf: 1 }],
  ['Methods with NO body (must be implemented)',  { abs: 1, intf: 1 }],
  ['A class can extend/implement MANY of these',  { abs: 0, intf: 1 }],
  ['Can be instantiated with new',                { abs: 0, intf: 0 }],
  ['Fields are automatically public static final',{ abs: 0, intf: 1 }],
  ['Carries an is-a identity + shared state',     { abs: 1, intf: 0 }],
]
const AVI_STORIES = {
  abs: <span><b>abstract class</b> 🏗️ — a half-built house. The foundation and walls are done (real fields, constructors, method bodies), but some rooms are marked "finish this yourself" (abstract methods). A child <C>extends</C> it, inherits the built parts, and must finish the rest. You can only extend <b>one</b> — it is your single identity.</span>,
  intf: <span><b>interface</b> 📜 — a signed contract. It says <i>what</i> you promise to do (<C>canFly()</C>, <C>swim()</C>), not <i>how</i>, and holds no state of its own. A class can sign <b>many</b> contracts at once with <C>implements</C> — that is how Java does multiple inheritance of <i>type</i>.</span>,
}

function AbsVsIntf() {
  const [side, setSide] = useState('abs')
  return (
    <div className="panel">
      <div className="ptitle">Live demo · click to compare the two tools</div>
      <div className="modbtns">
        <button className={side === 'abs' ? 'on' : ''} onClick={() => setSide('abs')}>abstract class</button>
        <button className={side === 'intf' ? 'on' : ''} onClick={() => setSide('intf')}>interface</button>
      </div>
      <table className="matrix">
        <thead>
          <tr><th>Capability</th><th>abstract class</th><th>interface</th></tr>
        </thead>
        <tbody>
          {AVI_ROWS.map(([label, vals]) => (
            <tr key={label}>
              <td>{label}</td>
              {['abs', 'intf'].map((k) => {
                const yes = vals[k] === 1
                const focused = k === side
                return (
                  <td key={k} className={yes ? 'yes' : 'no'}
                      style={{ opacity: focused ? 1 : 0.25, outline: focused ? '2px solid var(--ink)' : 'none' }}>
                    {yes ? '✔' : '✘'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="modexplain">{AVI_STORIES[side]}</div>
    </div>
  )
}

/* ============ Interactive 2: build a class from contracts ============ */
const CONTRACTS = {
  Flyer:   { method: 'fly()',   emoji: '🪽' },
  Swimmer: { method: 'swim()',  emoji: '🏊' },
  Walker:  { method: 'walk()',  emoji: '🚶' },
}

function ContractBuilder() {
  const [picked, setPicked] = useState(['Walker'])
  const [out, setOut] = useState([])

  function toggle(name) {
    setPicked((p) => p.includes(name) ? p.filter((x) => x !== name) : [...p, name])
    setOut([])
  }
  function call(name) {
    const c = CONTRACTS[name]
    if (picked.includes(name)) {
      setOut((o) => [{ ok: true, t: `duck.${c.method}  →  runs Duck's implementation ${c.emoji} ✓` }, ...o].slice(0, 5))
    } else {
      setOut((o) => [{ ok: false, t: `duck.${c.method}  →  ❌ compile error: Duck never signed the ${name} contract` }, ...o].slice(0, 5))
    }
  }

  const header = picked.length
    ? `class Duck implements ${picked.join(', ')}`
    : 'class Duck  (no contracts signed)'

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one class, many contracts (multiple inheritance of type)</div>
      <p style={{ fontSize: 14.5, marginBottom: 10 }}>Toggle which interfaces <C>Duck</C> signs, then try to call each ability:</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.keys(CONTRACTS).map((name) => (
          <button key={name} className={picked.includes(name) ? 'act' : 'ghost act'} onClick={() => toggle(name)}>
            {picked.includes(name) ? '✓ ' : ''}implements {name}
          </button>
        ))}
      </div>
      <div className="class-card" style={{ marginBottom: 12 }}>
        <div className="cname">{header}</div>
        {picked.length === 0 && <span style={{ color: '#7c8aa5' }}>// just a plain class — no promises made</span>}
        {picked.map((name) => (
          <div key={name}>
            public void {CONTRACTS[name].method} {'{'} ... {'}'} &nbsp;
            <span style={{ color: '#7c8aa5' }}>// required by {name}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.entries(CONTRACTS).map(([name, c]) => (
          <button key={name} className="ghost act" onClick={() => call(name)}>duck.{c.method}</button>
        ))}
      </div>
      {out.length === 0 ? (
        <div className="empty">Un-tick <b>Flyer</b>, then press <b>duck.fly()</b> — the compiler stops you. Sign the contract and try again.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {out.map((e, i) => (
            <div key={i} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 13, padding: '7px 10px', borderRadius: 7,
              background: e.ok ? '#E8F6EE' : '#FDECEC', color: e.ok ? '#1d7a4d' : '#b23535',
              border: `1px solid ${e.ok ? '#bfe6cd' : '#f3c9c9'}`,
            }}>{e.ok ? '✅' : '🚫'} {e.t}</div>
          ))}
        </div>
      )}
      <div className="statbar">
        📜 <span>Duck currently has <b>{picked.length}</b> type{picked.length === 1 ? '' : 's'} beyond its class:
        {picked.length ? ' it can be passed anywhere a ' + picked.join(' / ') + ' is expected.' : ' it can only be used as a Duck.'}</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: Template Method preview (abstract class at work) ============ */
const DRINKS = {
  Tea:    { brew: 'steep the tea bag 🍵', extra: 'add lemon' },
  Coffee: { brew: 'filter hot water through grounds ☕', extra: 'add milk & sugar' },
}
const STEPS = ['boilWater()', 'brew()  ← abstract', 'pourInCup()', 'addExtras()  ← abstract']

function TemplateDemo() {
  const [drink, setDrink] = useState('Tea')
  const [step, setStep] = useState(-1)
  const done = step >= STEPS.length - 1
  const d = DRINKS[drink]

  const detail = (i) => {
    if (i === 0) return 'boil water (same for everyone — written ONCE in the parent)'
    if (i === 1) return d.brew + '  (child decides)'
    if (i === 2) return 'pour into cup (same for everyone — parent code)'
    return d.extra + '  (child decides)'
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the parent owns the recipe, children fill the blanks</div>
      <div className="modbtns" style={{ marginBottom: 12 }}>
        {Object.keys(DRINKS).map((k) => (
          <button key={k} className={drink === k ? 'on' : ''} onClick={() => { setDrink(k); setStep(-1) }}>new {k}()</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {STEPS.map((s, i) => {
          const isAbstract = s.includes('abstract')
          const active = i === step
          const ran = i < step || done && i === step
          return (
            <div key={s} className="obj" style={{
              margin: 0, transition: 'all .15s',
              borderColor: active ? 'var(--blue)' : 'var(--line)',
              background: active ? '#EAF0FF' : (i <= step ? '#E8F6EE' : '#fff'),
              borderStyle: isAbstract ? 'dashed' : 'solid',
            }}>
              <div className="oref" style={{ marginBottom: 2 }}>
                step {i + 1} · {s}
                {i <= step && <span style={{ color: '#1d7a4d', float: 'right' }}>{active && !ran ? '' : '✓'}</span>}
              </div>
              {i <= step && <div className="ofield" style={{ fontSize: 12.5 }}>{detail(i)}</div>}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="act" disabled={done} style={{ opacity: done ? 0.5 : 1 }}
          onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}>
          {step < 0 ? `${drink.toLowerCase()}.prepare() ▶ Step` : 'Step ▶'}
        </button>
        <button className="ghost act" onClick={() => setStep(-1)}>reset</button>
      </div>
      {done && (
        <div className="statbar" style={{ marginTop: 10 }}>
          🏗️ <span>The <b>order</b> of steps lives once in the abstract parent. Only the dashed (abstract) steps differ per child.
          You just previewed the <b>Template Method pattern</b> (Month 2, Week 7)!</span>
        </div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'What is abstraction, in one line?',
    o: ['Hiding data behind private fields', 'Exposing WHAT something does while hiding HOW it does it', 'Copying methods between classes', 'Making all methods static'], a: 1,
    e: 'Abstraction = show the essential "what", hide the messy "how". (Encapsulation, Day 2, hides the DATA; abstraction hides the COMPLEXITY.)' },
  { q: 'Can you write: Animal a = new Animal(); if Animal is abstract?',
    o: ['Yes, abstract only affects methods', 'No — abstract classes cannot be instantiated, only extended', 'Only inside the Animal class itself', 'Yes, but the abstract methods return null'], a: 1,
    e: 'new on an abstract class is a compile error. The class is deliberately incomplete — only concrete children can be instantiated. (You CAN declare references of the abstract type.)' },
  { q: 'A class extends an abstract class but implements only some of its abstract methods. What must be true?',
    o: ['Java fills in the rest with empty bodies', 'It must itself be declared abstract', 'Compile error always', 'The missing methods throw exceptions at runtime'], a: 1,
    e: 'Unfinished children stay abstract: if any abstract method remains unimplemented, the class itself must be marked abstract, and only a fully-finished descendant can be instantiated.' },
  { q: 'How many interfaces can one class implement, and how many classes can it extend?',
    o: ['One interface, one class', 'Many interfaces, many classes', 'Many interfaces, one class', 'One interface, many classes'], a: 2,
    e: 'Java allows single inheritance of implementation (one extends) but multiple inheritance of TYPE (many implements). That combination avoids the diamond problem for state while keeping flexibility.' },
  { q: 'Fields declared in an interface are implicitly…',
    o: ['private', 'protected', 'public static final (constants)', 'normal instance fields'], a: 2,
    e: 'Interfaces hold no per-object state. Any field you write there is a public static final constant — set once, shared, unchangeable.' },
  { q: 'What problem do default methods (Java 8+) in interfaces solve?',
    o: ['They make interfaces faster', 'You can add a new method to a published interface without breaking every existing implementer', 'They allow private fields in interfaces', 'They replace abstract classes completely'], a: 1,
    e: 'Before default methods, adding a method to an interface broke every class implementing it. A default method ships a fallback body, so old implementers keep compiling. (That’s how forEach was added to Collection.)' },
  { q: 'Two interfaces both give Duck the SAME default method sound(). What must Duck do?',
    o: ['Nothing, Java picks one randomly', 'Override sound() itself (it may call InterfaceName.super.sound() to choose one)', 'It cannot implement both interfaces', 'Rename one interface'], a: 1,
    e: 'That’s the diamond conflict. Java forces Duck to override the method and decide — optionally delegating with Flyer.super.sound(). Explicit beats silent surprise.' },
  { q: 'You need shared state (fields) and a constructor in the common parent. Which tool?',
    o: ['Interface — contracts are cleaner', 'Abstract class — interfaces cannot hold instance state or constructors', 'Either works the same', 'A static utility class'], a: 1,
    e: 'Rule of thumb: shared state/partial implementation → abstract class. Pure capability contract (Comparable, Runnable…) → interface. When unsure, start with an interface — it commits you to less.' },
]

/* ============ The page ============ */
export default function Day5() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 1 · Day 5</div>
        <h1>Abstraction:<br />Show the What, Hide the How</h1>
        <p>The final pillar of OOP — and the one that turns the last four days into real design power. Today you learn the two tools
           Java gives you for describing an <em>idea</em> instead of a thing: <strong>abstract classes</strong> and
           <strong> interfaces</strong> — and exactly when to reach for which. Click everything.</p>
        <div className="chips">
          {['abstraction', 'abstract class', 'interface', 'implements', 'default methods', 'static methods', 'multiple inheritance of type'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What is abstraction?</h2>
        <p>Think about a <strong>car dashboard</strong>. You see a steering wheel, two pedals, a speedometer. You do NOT see the
          fuel injection timing, the gear ratios, the engine control unit. The dashboard shows you <strong>what you can do</strong>
          (steer, speed up, brake) and hides <strong>how it happens</strong>. Millions of people drive without ever opening the hood.</p>
        <p>That is <strong>abstraction</strong>: expose the essential operations, hide the implementation. We carry this
          <strong> dashboard vs engine</strong> picture all day.</p>
        <p>How is this different from Day 2?</p>
        <ul>
          <li><strong>Encapsulation</strong> hides the <em>data</em> (the fuel level variable is private; you read it through a gauge).</li>
          <li><strong>Abstraction</strong> hides the <em>complexity</em> (you press "brake"; you don’t orchestrate the hydraulics).</li>
        </ul>
        <p>You have already used abstraction every day: when you call <C>list.sort()</C> you neither know nor care which sorting
          algorithm runs. The <strong>what</strong> is stable; the <strong>how</strong> is free to change.</p>
        <Note><strong>One-line memory trick:</strong> Abstraction = a <em>promise of behavior</em> with the machinery hidden.
          Dashboard public, engine private.</Note>
        <Reveal summary={<>Why do designers care so much? Click to reveal.</>}>
          <p>Because <strong>callers can only depend on what they can see.</strong> If callers see only a small, stable "what",
            you can rewrite the "how" forever without breaking them. Every framework, every library, every design pattern is built
            on this bargain. Week 3’s Dependency Inversion Principle is literally "depend on abstractions, not concretions."</p>
        </Reveal>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Abstract classes — the half-built house</h2>
        <p>Yesterday’s zoo had a problem we politely ignored: <C>new Animal()</C> makes no sense. What sound does "an animal in
          general" make? None — <em>Animal</em> is an idea, not a thing. Java lets you say that out loud with <C>abstract</C>:</p>
        <Code html={`<span class="kw">public abstract class</span> Animal {          <span class="cm">// abstract = cannot be instantiated</span>
    <span class="kw">protected</span> String name;                 <span class="cm">// ✅ real state — children inherit it</span>

    <span class="kw">public</span> Animal(String name) {           <span class="cm">// ✅ constructor — runs via super(...)</span>
        <span class="kw">this</span>.name = name;
    }

    <span class="kw">public void</span> sleep() {                  <span class="cm">// ✅ normal method with a body — shared by all</span>
        System.out.println(name + <span class="str">" zzz..."</span>);
    }

    <span class="kw">public abstract</span> String makeSound();    <span class="cm">// ⛔ NO body. Children MUST implement this.</span>
}

<span class="kw">public class</span> Dog <span class="kw">extends</span> Animal {
    <span class="kw">public</span> Dog(String name) { <span class="kw">super</span>(name); }

    <span class="kw">@Override</span>
    <span class="kw">public</span> String makeSound() { <span class="kw">return</span> <span class="str">"Woof!"</span>; }  <span class="cm">// the blank is filled ✓</span>
}

Animal a = <span class="kw">new</span> Animal(<span class="str">"x"</span>);   <span class="cm">// ❌ compile error — can't build an idea</span>
Animal d = <span class="kw">new</span> Dog(<span class="str">"Rex"</span>);    <span class="cm">// ✅ reference of the abstract type is fine</span>`} />
        <p>The rules, in plain words:</p>
        <ul>
          <li>An <strong>abstract method</strong> has a signature but <strong>no body</strong> — it is a blank the child must fill.</li>
          <li>One abstract method anywhere → the whole class must be marked <C>abstract</C>.</li>
          <li>You can never <C>new</C> an abstract class — but references of its type are normal and useful (Day 4!).</li>
          <li>A child that doesn’t fill <em>all</em> the blanks must itself be declared <C>abstract</C> — the house is still unfinished.</li>
          <li>Everything else is regular class machinery: fields, constructors, normal methods, even <C>private</C> helpers.</li>
        </ul>
        <Warn><strong>Compiler as bodyguard:</strong> marking <C>makeSound()</C> abstract doesn’t just allow children to override —
          it <strong>forces</strong> every concrete child to. Forgetting is a compile error, not a 3 a.m. production surprise.</Warn>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Interfaces — the signed contract</h2>
        <p>An <strong>interface</strong> goes one step further: it drops the house entirely and keeps only the contract. No fields,
          no constructors — just a list of promises:</p>
        <Code html={`<span class="kw">public interface</span> Flyer {
    <span class="kw">int</span> MAX_ALTITUDE = <span class="num">10000</span>;   <span class="cm">// fields here are implicitly public static final (constants)</span>

    <span class="kw">void</span> fly();                  <span class="cm">// implicitly public abstract — no body, pure promise</span>
}

<span class="kw">public class</span> Duck <span class="kw">implements</span> Flyer {   <span class="cm">// "implements" = I sign this contract</span>
    <span class="kw">@Override</span>
    <span class="kw">public void</span> fly() {                  <span class="cm">// must be public — you can't weaken a promise</span>
        System.out.println(<span class="str">"flap flap 🦆"</span>);
    }
}`} />
        <p>Why is this so powerful? Because a class can sign <strong>many</strong> contracts:</p>
        <Code html={`<span class="kw">public class</span> Duck <span class="kw">extends</span> Bird <span class="kw">implements</span> Flyer, Swimmer, Walker {
    <span class="cm">// ONE parent class (single identity)…</span>
    <span class="cm">// …but MANY capabilities. Duck can be handed to any code</span>
    <span class="cm">// expecting a Flyer, a Swimmer, OR a Walker. Four types in one object!</span>
}`} />
        <p>This is <strong>multiple inheritance of type</strong>: Java forbids extending two classes (whose <em>fields</em> would
          collide — the diamond problem), but happily lets one class carry many <em>types</em>, because pure contracts have no state
          to collide.</p>
        <Note><strong>Real Java runs on this:</strong> <C>Comparable</C> ("I can be ordered"), <C>Runnable</C> ("I can be executed"),
          <C>Serializable</C> ("I can be saved") — tiny capability contracts that any class, anywhere in any hierarchy, can sign.</Note>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>📜 Play: sign and break contracts</h2>
        <p>Below, <C>Duck</C> can sign up to three interfaces. Toggle them, then try calling each ability. Notice the compiler’s
          point of view: <strong>no signature, no call</strong> — even if you "know" a duck can fly.</p>
        <ContractBuilder />
        <Good><strong>What you should notice:</strong> ① Each signed contract adds a method Duck must implement — and a <strong>type</strong>
          Duck can act as. ② Unsigned ability → compile error, caught before the program ever runs. ③ Three contracts at once is
          perfectly legal — that’s the multiple inheritance of type that classes alone can’t give you.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>default &amp; static methods — interfaces grew up (Java 8+)</h2>
        <p>For 20 years interfaces were pure promise lists. Then Java hit a wall: it wanted to add <C>forEach</C> to the
          <C> Collection</C> interface — but that would <strong>break every collection class ever written</strong>, because each would
          suddenly miss a method. The fix: let an interface ship a <strong>fallback body</strong>.</p>
        <Code html={`<span class="kw">public interface</span> Notifier {
    <span class="kw">void</span> send(String message);                 <span class="cm">// classic abstract promise</span>

    <span class="cm">// default = a method WITH a body. Implementers get it for free, may override it.</span>
    <span class="kw">default void</span> sendUrgent(String message) {
        send(<span class="str">"🚨 URGENT: "</span> + message);        <span class="cm">// note: it can call the abstract method!</span>
    }

    <span class="cm">// static = a helper that belongs to the interface itself</span>
    <span class="kw">static</span> Notifier silent() {
        <span class="kw">return</span> msg -> {};                      <span class="cm">// call as Notifier.silent() — not on an object</span>
    }
}`} />
        <ul>
          <li><strong><C>default</C> method</strong> — has a body; every implementer inherits it; any implementer may override it.
            Its superpower: <strong>evolving a published interface without breaking old code</strong>.</li>
          <li><strong><C>static</C> method</strong> — a utility pinned to the interface name (<C>Notifier.silent()</C>). Not inherited
            by implementers; just a well-placed helper/factory.</li>
          <li>Since Java 9, interfaces may also have <strong><C>private</C> methods</strong> — shared plumbing for their defaults.</li>
        </ul>
        <Reveal summary={<>The diamond returns: two interfaces give me the SAME default method. Now what? Click to reveal.</>}>
          <p>If <C>Flyer</C> and <C>Swimmer</C> both declare <C>default String sound()</C>, a class implementing both gets a
            <strong> compile error</strong> until it overrides <C>sound()</C> itself and settles the argument:</p>
          <Code html={`<span class="kw">public class</span> Duck <span class="kw">implements</span> Flyer, Swimmer {
    <span class="kw">@Override</span>
    <span class="kw">public</span> String sound() {
        <span class="kw">return</span> Flyer.<span class="kw">super</span>.sound();   <span class="cm">// explicitly pick one (or write your own)</span>
    }
}`} />
          <p>Java never guesses. The conflict is yours to resolve, in code, visibly. Great interview question.</p>
        </Reveal>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>⚖️ Play: abstract class vs interface — the decision table</h2>
        <p>Both tools describe incomplete things that others must finish. Click each side and study what only it can do:</p>
        <AbsVsIntf />
        <h3>The decision rule (memorize this)</h3>
        <ul>
          <li>Need <strong>shared state, constructors, or partial implementation</strong> for a family of related classes →
            <strong> abstract class</strong>. ("These things all <em>are</em> Animals and share a name field.")</li>
          <li>Need a <strong>capability</strong> that unrelated classes can plug into → <strong>interface</strong>.
            ("A Bird, a Plane, and a Superhero can all be <C>Flyer</C>s.")</li>
          <li>Unsure? <strong>Start with an interface.</strong> It commits you to nothing — you can always slot an abstract class
            behind it later (<C>interface List</C> ← <C>abstract class AbstractList</C> ← <C>class ArrayList</C> is exactly how the
            JDK does it).</li>
        </ul>
        <Good><strong>They cooperate more than they compete:</strong> the classic Java shape is interface on top (the contract),
          abstract class in the middle (shared plumbing), concrete classes at the bottom (the real things).</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🏗️ Play: an abstract class running the show</h2>
        <p>Here is the move that makes abstract classes shine. A <C>CaffeineBeverage</C> parent owns the <strong>recipe order</strong> —
          boil, brew, pour, add extras — as a normal method. The two middle steps are <strong>abstract blanks</strong>. Pick a drink
          and step through: the order never changes, only the blanks do.</p>
        <TemplateDemo />
        <Code html={`<span class="kw">public abstract class</span> CaffeineBeverage {
    <span class="cm">// the recipe: fixed order, written ONCE. final = children can't reorder it.</span>
    <span class="kw">public final void</span> prepare() {
        boilWater();
        brew();          <span class="cm">// ← blank #1, filled by the child</span>
        pourInCup();
        addExtras();     <span class="cm">// ← blank #2, filled by the child</span>
    }
    <span class="kw">private void</span> boilWater() { System.out.println(<span class="str">"boiling water"</span>); }
    <span class="kw">private void</span> pourInCup() { System.out.println(<span class="str">"pouring"</span>); }

    <span class="kw">protected abstract void</span> brew();        <span class="cm">// what children must decide</span>
    <span class="kw">protected abstract void</span> addExtras();
}`} />
        <Good><strong>What you should notice:</strong> the parent calls methods that <em>don’t exist yet</em> — the children supply
          them later, and dynamic dispatch (Day 4) wires it together. You just met the <strong>Template Method pattern</strong> a
          full month early. This is what "abstraction + polymorphism" buys: stable skeleton, swappable steps.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Trying to <C>new</C> an abstract class or interface</h3>
        <Code html={`Animal a = <span class="kw">new</span> Animal(<span class="str">"x"</span>);  <span class="cm">// ❌ compile error — Animal is abstract</span>
Flyer f = <span class="kw">new</span> Flyer();         <span class="cm">// ❌ same story — you can only new a CONCRETE class</span>
Flyer ok = <span class="kw">new</span> Duck();         <span class="cm">// ✅ concrete class behind an abstract reference</span>`} />
        <h3>Trap 2 — Weakening visibility when implementing</h3>
        <p>Interface methods are implicitly <C>public</C>. Implementing one with default or <C>protected</C> visibility is a compile
          error — a promise can’t become quieter than it was made.</p>
        <h3>Trap 3 — Expecting interface fields to behave like instance fields</h3>
        <Code html={`<span class="kw">interface</span> Config { <span class="kw">int</span> LIMIT = <span class="num">10</span>; }  <span class="cm">// secretly: public static final int LIMIT</span>
Config.LIMIT = <span class="num">20</span>;   <span class="cm">// ❌ it's a constant — there is no per-object state in interfaces</span>`} />
        <h3>Trap 4 — "Constants interface" abuse</h3>
        <p>Don’t create an interface that holds <em>only</em> constants and "implement" it just to import them — that pollutes your
          type with a fake contract. Use a final class with <C>static final</C> fields, or a proper <C>enum</C> (Week 4).</p>
        <h3>Trap 5 — Abstract class with zero abstract methods… or an interface with twelve</h3>
        <p>Both are smells. An abstract class with no blanks usually just wants to block <C>new</C> — fine occasionally, but ask why.
          A fat interface forces implementers to fill methods they don’t need — Week 3’s Interface Segregation Principle exists
          precisely to stop this.</p>
        <h3>Trap 6 — Forgetting that abstract classes DO have constructors</h3>
        <p>You can’t <C>new</C> them, but their constructors run every time a child is born, via <C>super(...)</C> — Day 3’s chain,
          unchanged. Put your shared validation there.</p>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>The four pillars — one screen, one story</h2>
        <p>Week 1 is complete. Watch how the pillars stack — each one needs the previous:</p>
        <Code html={`   ┌──────────────────────────────────────────────────────────────┐
   │  Day 1  CLASSES &amp; OBJECTS   "things exist"                   │
   │         blueprints → real objects in the heap                │
   ├──────────────────────────────────────────────────────────────┤
   │  Day 2  ENCAPSULATION       "things protect their own state" │
   │         private data + guarded doors                         │
   ├──────────────────────────────────────────────────────────────┤
   │  Day 3  INHERITANCE         "things form families"           │
   │         is-a, extends, super, Object at the root             │
   ├──────────────────────────────────────────────────────────────┤
   │  Day 4  POLYMORPHISM        "one call, many behaviors"       │
   │         dynamic dispatch via vtables                         │
   ├──────────────────────────────────────────────────────────────┤
   │  Day 5  ABSTRACTION         "depend on ideas, not machines"  │
   │         abstract classes &amp; interfaces                        │
   └──────────────────────────────────────────────────────────────┘
            ▲ every design pattern in Month 2 is a combination
              of rows 3, 4 and 5 with a good name attached.`} />
        <Note><strong>Looking ahead:</strong> Week 2 turns these pillars into <em>modeling skill</em> — association vs aggregation vs
          composition, UML diagrams, and turning requirements into classes. From here on you are doing design, not just syntax.</Note>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Abstraction</strong> = expose <em>what</em>, hide <em>how</em>. Encapsulation hides data; abstraction hides complexity.</li>
          <li><strong>abstract class:</strong> can hold fields, constructors, normal methods, and bodiless <C>abstract</C> methods. Cannot be <C>new</C>-ed. One abstract method → class must be abstract. Unfinished child → also abstract.</li>
          <li><strong>interface:</strong> a pure contract. Methods implicitly <C>public abstract</C>; fields implicitly <C>public static final</C>. No constructors, no instance state.</li>
          <li><strong>extends one, implements many</strong> — multiple inheritance of <em>type</em>, not of state.</li>
          <li><strong><C>default</C> methods</strong> (Java 8+): bodies in interfaces → evolve published APIs without breaking implementers. Conflicting defaults must be overridden (<C>Flyer.super.sound()</C> to delegate).</li>
          <li><strong><C>static</C> interface methods</strong>: helpers/factories called on the interface name; not inherited.</li>
          <li><strong>Choosing:</strong> shared state/partial code → abstract class · capability for unrelated classes → interface · unsure → interface first. JDK shape: interface → abstract class → concrete class.</li>
          <li>Implementing methods can’t reduce visibility; interface constants can’t be reassigned.</li>
          <li>Abstract parent + fixed skeleton + abstract blanks = <strong>Template Method pattern</strong> (Month 2 preview).</li>
        </ul>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 5 complete — and with it, Week 1! 🎉</strong> Homework: design a payment system. Write an interface
        <C> PaymentMethod</C> with <C>pay(double amount)</C> and a <C>default</C> method <C>payWithReceipt(double amount)</C> that
        calls <C>pay</C> and prints a receipt. Then an abstract class <C>CardPayment implements PaymentMethod</C> holding shared
        state (<C>cardNumber</C>, masked printing, a constructor that validates length) and an abstract <C>authorize()</C>. Finish
        with concrete <C>CreditCard</C> and <C>DebitCard</C>, plus an unrelated <C>UpiPayment</C> that implements the interface
        directly. In <C>main</C>, put all three in a <C>PaymentMethod[]</C> and run one polymorphic loop.
        <br /><br />
        Next: <strong>Week 2 — Relationships, UML &amp; Object Modeling</strong>: association vs aggregation vs composition, and turning
        requirements into classes.
      </div>
    </div>
  )
}
