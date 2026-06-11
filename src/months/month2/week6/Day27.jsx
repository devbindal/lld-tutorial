import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The condiment explosion ============ */
const CONDIMENTS = ['Milk', 'Mocha', 'Whip', 'Caramel', 'Oat']

function CondimentExplosion() {
  const [n, setN] = useState(2)
  const [world, setWorld] = useState('subclass')
  const used = CONDIMENTS.slice(0, n)

  function combos(arr) {
    const out = []
    for (let mask = 1; mask < (1 << arr.length); mask++) out.push(arr.filter((_, i) => mask & (1 << i)))
    return out
  }
  const subclasses = combos(used)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the menu grows a condiment — count the classes</div>
      <div className="modbtns">
        {CONDIMENTS.map((c, i) => (
          <button key={c} className={i < n ? 'on' : ''} onClick={() => setN(i + 1)}>{c}</button>
        ))}
      </div>
      <div className="modbtns">
        <button className={world === 'subclass' ? 'on' : ''} onClick={() => setWorld('subclass')}>🌳 subclass world</button>
        <button className={world === 'decorator' ? 'on' : ''} onClick={() => setWorld('decorator')}>🎁 decorator world</button>
      </div>
      <div className="heap">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {world === 'subclass' ? (
            <>
              <span className="chip">Espresso</span>
              {subclasses.slice(0, 18).map((c) => (
                <span className="chip" key={c.join('')}>{c.join('') + 'Espresso'}</span>
              ))}
              {subclasses.length > 18 && <span className="chip">…+{subclasses.length - 18} more</span>}
            </>
          ) : (
            <>
              <span className="chip">Espresso</span>
              {used.map((c) => <span className="chip" key={c}>{c}Decorator</span>)}
            </>
          )}
        </div>
      </div>
      <div className="statbar" style={{ background: world === 'subclass' && n >= 3 ? '#FDECEC' : '#FFF6E8' }}>
        {world === 'subclass'
          ? <span>💥 <span>{subclasses.length + 1} classes for {n} condiments (2ⁿ, Day 7's explosion) — and "DOUBLE mocha"? That needs MochaMochaEspresso. The tree literally cannot say "twice".</span></span>
          : <span>🎁 <span>{n + 1} classes total — one per condiment. Any combination, any ORDER, any REPEAT (double mocha = wrap Mocha twice) is assembled at runtime, not compiled in advance.</span></span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: The wrapping station ============ */
const TOPPINGS = {
  Milk: { price: 20, color: '#E8E3D8', emoji: '🥛' },
  Mocha: { price: 30, color: '#D9C2A7', emoji: '🍫' },
  Whip: { price: 25, color: '#F3E9F7', emoji: '🍦' },
}

function WrappingStation() {
  const [layers, setLayers] = useState([]) // outermost last
  const [trace, setTrace] = useState(false)

  const total = 80 + layers.reduce((s, l) => s + TOPPINGS[l].price, 0)
  const desc = [...layers].reverse().reduce((acc, l) => `${l}(${acc})`, 'Espresso')

  function nested() {
    let node = (
      <div style={{ border: '2px solid #6B4F2A', borderRadius: 8, padding: '8px 12px', background: '#FFF8EE', fontFamily: 'IBM Plex Mono', fontSize: 12.5, textAlign: 'center' }}>
        ☕ Espresso · ₹80
      </div>
    )
    layers.forEach((l) => {
      node = (
        <div style={{ border: '2px dashed #8a7a5c', borderRadius: 12, padding: 10, background: TOPPINGS[l].color }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, marginBottom: 6 }}>{TOPPINGS[l].emoji} {l}Decorator (+₹{TOPPINGS[l].price}) wraps ↓</div>
          {node}
        </div>
      )
    })
    return node
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one espresso, infinite outfits — wrap it live</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.entries(TOPPINGS).map(([t, v]) => (
          <button key={t} className="act" onClick={() => { if (layers.length < 5) { setLayers((ls) => [...ls, t]); setTrace(false) } }}>
            {v.emoji} wrap in {t} (+₹{v.price})
          </button>
        ))}
        <button className="ghost act" onClick={() => { setLayers([]); setTrace(false) }}>plain espresso</button>
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 230, flex: 1 }}>{nested()}</div>
        <div style={{ flex: 1, minWidth: 250 }}>
          <Code html={`Coffee order =
  ${[...layers].reverse().reduce((acc, l) => `<span class="kw">new</span> ${l}(${acc})`, '<span class="kw">new</span> Espresso()')};
<span class="cm">// reads inside-out, like all wrapping</span>`} />
          <button className="act" style={{ marginBottom: 8 }} onClick={() => setTrace(true)} disabled={layers.length === 0}>
            ▶ order.cost()
          </button>
          {trace && (
            <div className="statbar" style={{ display: 'block' }}>
              {[...layers].reverse().map((l, i) => (
                <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, paddingLeft: i * 14 }}>
                  {TOPPINGS[l].emoji} {l}.cost() = {TOPPINGS[l].price} + inner.cost() ↓
                </div>
              ))}
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, paddingLeft: layers.length * 14 }}>
                ☕ Espresso.cost() = 80   ← the chain bottoms out
              </div>
              <div style={{ marginTop: 6 }}>🧾 unwinds to: <b>₹{total}</b></div>
            </div>
          )}
        </div>
      </div>
      <div className="statbar">
        🧾 <span>{desc} →</span> <b>₹{total}</b>
        <span>{layers.filter((l) => l === 'Mocha').length >= 2 ? ' — DOUBLE mocha, impossible in subclass world! 🎉' : ''}</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: The stream pipeline assembler ============ */
const STREAM_WRAPS = {
  BufferedInputStream: { gain: 'reads 8KB chunks — ~100× fewer disk calls', },
  GZIPInputStream: { gain: 'decompresses bytes on the fly', },
  DataInputStream: { gain: 'typed reads: readInt(), readDouble()', },
}

function StreamAssembler() {
  const [stack, setStack] = useState([])

  const code = stack.reduce((acc, w) => `<span class="kw">new</span> ${w}(\n  ${acc.replace(/\n/g, '\n  ')}\n)`,
    `<span class="kw">new</span> FileInputStream(<span class="str">"data.gz"</span>)`)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · assemble a real java.io pipeline — every layer IS an InputStream</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.keys(STREAM_WRAPS).map((w) => (
          <button key={w} className="act" onClick={() => { if (stack.length < 3 && !stack.includes(w)) setStack((s) => [...s, w]) }}
            disabled={stack.includes(w)}>
            + wrap in {w}
          </button>
        ))}
        <button className="ghost act" onClick={() => setStack([])}>bare file</button>
      </div>
      <Code html={code + ';'} />
      <div className="heap">
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>📄 FileInputStream — raw bytes from disk (the component)</div>
        {stack.map((w) => (
          <div key={w} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>🎁 {w} — {STREAM_WRAPS[w].gain}</div>
        ))}
      </div>
      <div className="statbar">
        {stack.length === 0
          ? <span>🐢 <span>Bare file: every read() = one disk call, compressed gibberish, byte-by-byte. Wrap it!</span></span>
          : <span>🔌 <span>They snap together because every wrapper <b>extends InputStream</b> AND <b>holds an InputStream</b> — same interface in, same interface out. This is the pattern you've used since your first file read.</span></span>}
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Decorator pattern\'s intent is…',
    o: ['To translate one interface into another', 'To attach additional responsibilities to an object DYNAMICALLY, keeping the same interface — a flexible alternative to subclassing', 'To guarantee one instance', 'To copy expensive objects'], a: 1,
    e: 'Wrap the object, add a delta of behavior, keep its interface so the result is usable anywhere the original was — and wrappable again.',
    w: { 0: 'Interface translation is Adapter (Day 26).',
         2: 'One instance is Singleton.',
         3: 'Copying is Prototype.' },
    r: { id: 's1', label: 'Section 1 — back at the coffee shop' } },
  { q: 'Why is "same interface as the thing it wraps" the load-bearing rule?',
    o: ['It saves typing', 'It makes decorators STACKABLE: a decorator can wrap a decorator can wrap the component — any depth, assembled at runtime', 'Java requires it', 'It improves performance'], a: 1,
    e: 'Whip wraps a Coffee. A Mocha-wrapped Espresso IS a Coffee. So Whip can wrap THAT. Lose the shared interface and the chain stops at depth one.',
    w: { 0: 'Typing is irrelevant.',
         2: 'No language rule — a design necessity.',
         3: 'Each layer adds a tiny call cost, if anything.' },
    r: { id: 's6', label: 'Section 6 — why it stacks' } },
  { q: 'The abstract decorator base class typically…',
    o: ['extends the concrete component', 'implements the Component interface AND holds a Component field, forwarding calls to it', 'is a static utility', 'has no relation to Component'], a: 1,
    e: 'Both relationships at once: IS-A Component (so clients and other decorators accept it) and HAS-A Component (the thing it wraps) — Day 7\'s composition with a costume.',
    w: { 0: 'Extending Espresso would tie decorators to ONE concrete drink.',
         2: 'Static utilities transform values; decorators stand in as objects.',
         3: 'Both relations to Component are the whole trick.' },
    r: { id: 's4', label: 'Section 4 — the structure' } },
  { q: 'How does cost() compute ₹155 for Whip(Mocha(Espresso))?',
    o: ['The outermost layer stores the total', 'Each decorator returns its own delta PLUS inner.cost() — the call recurses inward, bottoms out at Espresso, and sums on the way back', 'A static price table', 'The JVM adds them'], a: 1,
    e: '25 + (30 + (80)) — a recursive unwind down the wrapper chain. No layer knows the total; each knows only its delta and its neighbor.',
    w: { 0: 'No layer knows the whole — that\'s the elegance.',
         2: 'A table would have to enumerate every combo — the explosion again.',
         3: 'The JVM executes; YOUR delegation chain adds.' },
    r: { id: 's5', label: 'Section 5 — the wrapping station trace' } },
  { q: 'In new BufferedReader(new InputStreamReader(socket.getInputStream())) — identify the patterns.',
    o: ['Two decorators', 'InputStreamReader is an ADAPTER (bytes→chars interface change); BufferedReader is a DECORATOR (same Reader interface, adds buffering + readLine)', 'Two adapters', 'A builder and a factory'], a: 1,
    e: 'The most famous line in java.io contains BOTH wrapper patterns — and telling them apart on it is a beloved interview move. Judge by interface: changed = adapter, kept = decorator.',
    w: { 0: 'InputStreamReader CHANGES the interface — that\'s adaptation.',
         2: 'BufferedReader keeps Reader and adds powers — decoration.',
         3: 'No staged construction or creation choice anywhere.' },
    r: { id: 's7', label: 'Section 7 — java.io' } },
  { q: 'Decorator vs Proxy — both wrap with the SAME interface. The difference?',
    o: ['No difference', 'Intent: decorator ADDS capabilities and clients knowingly stack them; proxy CONTROLS ACCESS (guard/cache/lazy) and clients usually don\'t know it\'s there', 'Proxies are faster', 'Decorators are only for streams'], a: 1,
    e: 'Same silhouette, different job: decorator = gift wrap chosen by the client; proxy = bodyguard standing in unannounced (full story Day 29).',
    w: { 0: 'GoF lists them separately for intent reasons.',
         2: 'Speed isn\'t the axis.',
         3: 'Streams are just the famous showcase.' },
    r: { id: 's8', label: 'Section 8 — the family table' } },
  { q: 'After Coffee c = new Mocha(espresso); — what breaks about identity?',
    o: ['Nothing ever', 'c != espresso, c.equals(espresso) is false by default, and instanceof Espresso fails — wrapped objects are DIFFERENT objects, so identity-based lookups miss', 'The GC collects espresso', 'Mocha and Espresso merge'], a: 1,
    e: 'A decorator is a new object in front of the old one. Code that relied on finding the ORIGINAL (in a Set, by ==, via instanceof) now misses. Design rule: decorate at creation, before anyone keeps references.',
    w: { 0: 'Identity is THE classic decorator gotcha.',
         2: 'espresso lives on — referenced by the wrapper.',
         3: 'Objects never merge.' },
    r: { id: 's9', label: 'Section 9 — Trap 1: identity' } },
  { q: 'Collections.unmodifiableList(list) is a decorator that THROWS on add(). Healthy or a Day 13 crime?',
    o: ['A crime — delete it from the JDK', 'A documented trade-off: it\'s an intentional read-only VIEW, with the same optional-operations escape hatch as Arrays.asList — know both the utility and the LSP criticism', 'Not a decorator at all', 'It silently ignores add()'], a: 1,
    e: 'It wraps a List, keeps the interface, modifies behavior (rejecting writes). Compile-time List ≠ guaranteed add — the same deliberate, criticized design Day 13 discussed. Naming both sides is the senior answer.',
    w: { 0: 'It\'s enormously useful — defensive views everywhere (Day 2!).',
         2: 'Same interface + held inner list + changed behavior = decorator anatomy.',
         3: 'It throws loudly — silent ignoring would be far worse.' },
    r: { id: 's7', label: 'Section 7 — Collections wrappers' } },
]

/* ============ The page ============ */
export default function Day27() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 6 · Day 27 · Structural Patterns</div>
        <h1>Decorator:<br />Same Interface, Stacked Powers</h1>
        <p>Yesterday's wrapper changed an object's interface. Today's keeps the interface and adds
           behavior — layer upon layer, at runtime, like winter clothing. It's the pattern inside every
           <C> new BufferedReader(new InputStreamReader(...))</C> you've ever typed. Click everything.</p>
        <div className="chips">
          {['decorator', 'wrap & delegate', 'stackable', 'java.io streams', 'runtime composition', 'condiments'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Back at the coffee shop (a new problem)</h2>
        <p>Remember Day 22's barista? The shop is thriving — and now customers want <em>condiments</em>: milk,
          mocha, whip, caramel… in any combination, any amount. The menu must price and describe every drink.
          Your first instinct, inheritance, walks straight into Day 7's wall:</p>
        <Code html={`        THE CONDIMENT PROBLEM

   SUBCLASS WORLD 🌳                          DECORATOR WORLD 🎁
   class MilkEspresso extends Espresso        ☕ one Espresso (the component)
   class MochaMilkEspresso extends …          🎁 one small class PER condiment
   class WhipMochaMilkEspresso extends …
   … 2ⁿ classes, frozen at compile time       order = new Whip(new Mocha(new Espresso()))
   and "DOUBLE mocha" = impossible            assembled at RUNTIME · repeats allowed
                                              every layer IS a Coffee → wrappable again`} />
        <Note><strong>Decorator's intent:</strong> attach additional responsibilities to an object
          <strong> dynamically</strong>, keeping its interface — a flexible alternative to subclassing for
          extending behavior. The client holds "a Coffee"; how many layers of wrapping stand behind that
          reference is none of its business.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The two dead ends decorators rescue you from</h2>
        <ul>
          <li><strong>Dead end #1 — the subclass explosion:</strong> one class per combination = 2ⁿ classes,
            chosen forever at compile time, and combinations-with-repeats (double mocha) are simply
            inexpressible as a class name.</li>
          <li><strong>Dead end #2 — the boolean-flag monster:</strong> one Espresso class with
            <C> hasMilk, hasMocha, hasWhip…</C> flags and a cost() full of ifs. Every new condiment EDITS the
            tested class (OCP violated, Day 12), flags can't repeat either, and the class hoards every
            condiment's pricing knowledge (SRP, Day 11).</li>
        </ul>
        <p>Both dead ends share a root cause: they pick the drink's powers <strong>before the program
          runs</strong>. Decorator moves that decision to runtime — where the customer actually orders.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>💥 Play: The condiment explosion</h2>
        <p>Grow the condiment list, compare worlds — Day 7's math, wearing whipped cream.</p>
        <CondimentExplosion />
        <Good><strong>What you should notice:</strong> ① Subclass-world doubles per condiment; decorator-world
          adds ONE small class. ② Even at 2ⁿ classes, subclass-world still can't say "double mocha" — repeats
          aren't combinations. ③ Decorator classes don't multiply because they COMPOSE — the combinations live
          in the wiring, not the type system.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The structure (four small pieces)</h2>
        <Code html={`<span class="cm">// 1 — the COMPONENT: the shared interface everyone wears</span>
<span class="kw">public interface</span> Coffee {
    <span class="kw">double</span> cost();
    String desc();
}

<span class="cm">// 2 — a CONCRETE COMPONENT: the innermost thing, stands alone</span>
<span class="kw">public class</span> Espresso <span class="kw">implements</span> Coffee {
    <span class="kw">public double</span> cost() { <span class="kw">return</span> <span class="num">80</span>; }
    <span class="kw">public</span> String desc() { <span class="kw">return</span> <span class="str">"Espresso"</span>; }
}

<span class="cm">// 3 — the DECORATOR base: IS a Coffee, HAS a Coffee (both at once!)</span>
<span class="kw">public abstract class</span> CoffeeDecorator <span class="kw">implements</span> Coffee {
    <span class="kw">protected final</span> Coffee inner;                 <span class="cm">// the thing being wrapped</span>
    <span class="kw">protected</span> CoffeeDecorator(Coffee inner) { <span class="kw">this</span>.inner = inner; }
}

<span class="cm">// 4 — CONCRETE DECORATORS: each adds its delta, then delegates inward</span>
<span class="kw">public class</span> Mocha <span class="kw">extends</span> CoffeeDecorator {
    <span class="kw">public</span> Mocha(Coffee inner) { <span class="kw">super</span>(inner); }
    <span class="kw">public double</span> cost() { <span class="kw">return</span> <span class="num">30</span> + inner.cost(); }   <span class="cm">// my delta + the rest</span>
    <span class="kw">public</span> String desc() { <span class="kw">return</span> inner.desc() + <span class="str">", mocha"</span>; }
}
<span class="kw">public class</span> Whip <span class="kw">extends</span> CoffeeDecorator {
    <span class="kw">public</span> Whip(Coffee inner) { <span class="kw">super</span>(inner); }
    <span class="kw">public double</span> cost() { <span class="kw">return</span> <span class="num">25</span> + inner.cost(); }
    <span class="kw">public</span> String desc() { <span class="kw">return</span> inner.desc() + <span class="str">", whip"</span>; }
}

<span class="cm">// the customer orders — composition happens at RUNTIME:</span>
Coffee order = <span class="kw">new</span> Whip(<span class="kw">new</span> Mocha(<span class="kw">new</span> Mocha(<span class="kw">new</span> Espresso())));  <span class="cm">// double mocha! 🎉</span>
order.cost();   <span class="cm">// 25 + 30 + 30 + 80 = 165</span>`} />
        <p>Read the decorator base twice — it's the whole pattern in two lines:
          <C> implements Coffee</C> (so it fits anywhere a Coffee fits, including inside ANOTHER decorator) and
          <C> protected final Coffee inner</C> (the delegation target, Day 7). Every concrete decorator is just
          "delta + forward".</p>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🎁 Play: The wrapping station</h2>
        <p>Wrap an espresso live — try a DOUBLE mocha — then press <C>cost()</C> and watch the recursion unwind
          through the layers.</p>
        <WrappingStation />
        <Good><strong>What you should notice:</strong> ① The nested boxes ARE the object graph — each layer holds
          exactly one inner Coffee. ② cost() visits every layer inward, then sums outward: no layer knows the
          total, each knows only its delta. ③ Clicking Mocha twice just works — runtime wiring has no
          "no repeats" rule to break.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Why it stacks (the three properties)</h2>
        <ul>
          <li><strong>Same interface ⇒ stackable.</strong> A Mocha-wrapped Espresso IS a Coffee, so Whip can wrap
            it without knowing or caring what's inside. Each wrap closes over the last — turtles all the way
            down, until the concrete component bottoms out the chain.</li>
          <li><strong>Runtime composition.</strong> The combination is data, not type: read it from the order,
            build it in a loop, change it per request. Subclasses are decided when you COMPILE; decorations when
            you RUN.</li>
          <li><strong>Order can matter.</strong> <C>desc()</C> above appends — so wrap order changes the string.
            More seriously: a CompressDecorator inside an EncryptDecorator compresses plaintext (works great);
            outside it, it tries to compress encrypted noise (achieves nothing). Layers are a pipeline; pipelines
            have direction.</li>
        </ul>
        <Warn><strong>OCP receipts (Day 12):</strong> new condiment = new decorator class. Espresso untouched,
          other decorators untouched, clients untouched. The if-flag monster from dead end #2 required editing
          the core for every single one.</Warn>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>📄 Play: You've been using this since week one — java.io</h2>
        <p>The streams library is the world's most famous decorator deployment. Assemble a real pipeline:</p>
        <StreamAssembler />
        <p>And the other JDK decorator family —the <strong>Collections wrappers</strong>:
          <C> Collections.unmodifiableList(list)</C> (same List interface, write methods now throw — your Day 2
          defensive views!), <C>synchronizedList</C> (adds locking), <C>checkedList</C> (adds runtime type
          checks). Same anatomy every time: hold the inner one, keep the interface, change the behavior.</p>
        <Good><strong>What you should notice:</strong> ① Every wrap line compiles because every layer both IS and
          HOLDS an InputStream. ② Each layer adds one orthogonal power — buffering, decompression, typed reads —
          combinable à la carte instead of a BufferedGzipDataFileInputStream class zoo. ③ You have been writing
          this pattern since your first file read; today you learned its name.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Placing Decorator in the family album</h2>
        <table className="matrix">
          <thead>
            <tr><th>vs</th><th>the one-line difference</th></tr>
          </thead>
          <tbody>
            <tr><td>🧩 Adapter (26)</td><td>adapter CHANGES the interface; decorator KEEPS it (that's why only decorators stack)</td></tr>
            <tr><td>🛡️ Proxy (29)</td><td>same shape! intent differs: decorator ADDS powers, client stacks knowingly; proxy CONTROLS access, client usually unaware</td></tr>
            <tr><td>🧱 Builder (24)</td><td>builder assembles ONE object then seals it; decorator layers BEHAVIOR around a live object</td></tr>
            <tr><td>🌳 Inheritance (3/7)</td><td>subclassing extends a CLASS at compile time, once; decoration extends an OBJECT at runtime, repeatedly</td></tr>
          </tbody>
        </table>
        <Reveal summary="Functional decoration — the lambda-age version. Click to reveal.">
          <p>When the component interface has one method, decoration collapses into function composition:
            <C> Function&lt;Order,Order&gt; pipeline = validate.andThen(applyDiscount).andThen(addTax);</C> —
            each <C>andThen</C> is a wrap. <C>UnaryOperator</C> chains, servlet <strong>filters</strong> and
            HTTP client <strong>middleware/interceptors</strong> are all decorator chains in spirit: same
            interface in and out, behavior added per layer. Recognizing this earns modern-Java points.</p>
        </Reveal>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — The identity surprise</h3>
        <p><C>new Mocha(espresso)</C> is a DIFFERENT object: <C>==</C> fails, default <C>equals</C> fails,
          <C> instanceof Espresso</C> fails. Any registry/Set/cache holding the original won't recognize the
          wrapped one. Rule: decorate at creation time, before references escape — and never write code that
          asks a Coffee "what are you really?" (Day 13's instanceof smell).</p>
        <h3>Trap 2 — The forgotten forward</h3>
        <p>A decorator overriding 3 of 7 methods and forgetting to delegate the rest = calls silently vanish
          mid-chain. The abstract base should forward EVERYTHING by default; concrete decorators override only
          what they change.</p>
        <h3>Trap 3 — Fat interfaces make miserable decorators</h3>
        <p>Decorating a 25-method interface means 25 forwarding methods per decorator. That pain is a message
          from Day 14: the component interface is too fat. Lean interfaces decorate beautifully (cost + desc:
          two lines each).</p>
        <h3>Trap 4 — Business logic between the layers</h3>
        <p>A "LoggingDecorator" that also retries, or a "CachingDecorator" that also validates — each layer
          should add ONE orthogonal power (SRP per layer), or the stack becomes an opaque lasagna nobody can
          reorder safely.</p>
        <h3>Trap 5 — Debug-ability of deep stacks</h3>
        <p>Six layers deep, a stack trace reads wrap→wrap→wrap→wrap→… Know the cost: decorate for real needs,
          name decorators by their power, and give the stack ONE assembly point (a factory, Day 22) so the
          onion's recipe is written down somewhere.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> add responsibilities to an OBJECT at runtime, same interface, stackable. The subclass-explosion and flag-monster cure.</li>
          <li><strong>Structure:</strong> Component interface · concrete component (innermost) · decorator base = <C>implements Component</C> + <C>final Component inner</C> · concrete decorators = delta + delegate.</li>
          <li>Mechanics: recursion unwinds inward to the component, sums outward. Repeats allowed. Order matters (compress-inside-encrypt!).</li>
          <li>JDK: java.io streams (with InputStreamReader as the adapter neighbor) · Collections.unmodifiable/synchronized/checked.</li>
          <li>Family: changes interface→Adapter · controls access→Proxy · builds once→Builder · compile-time→inheritance. Functional flavor: <C>andThen</C>, filters, middleware.</li>
          <li>Traps: wrapped ≠ original (identity!) · forgotten forwards · fat components · multi-job layers · deep-stack debugging.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Why is java.io often CRITICIZED despite being the famous decorator showcase?">
          <p>Usability: simple jobs need three nested constructors (the "wrapper soup"), and forgetting
            BufferedInputStream silently costs 100× performance. It's the honest counterweight: decorator buys
            flexibility at the price of assembly ceremony — which is why <C>Files.newBufferedReader(path)</C>
            (a facade-ish factory) was added later. Knowing a pattern's downsides = senior signal.</p>
        </Reveal>
        <Reveal summary="Q: The famous synchronizedList gotcha?">
          <p><C>Collections.synchronizedList</C> locks each METHOD call — but iteration is many calls, so
            <strong> you must manually synchronize the whole loop</strong> (<C>synchronized (list) {'{'} for (…) {'}'}</C>)
            or risk ConcurrentModificationException. The decorator adds locking per call, not per workflow —
            a classic Month 4 preview and a top-10 Java interview trap.</p>
        </Reveal>
        <Reveal summary="Q: Decorator and Chain of Responsibility look similar — both pass calls along. Difference?">
          <p>Decorator layers ALL run (each adds its delta and forwards — the request always reaches the
            component). Chain of Responsibility (Month 2, Week 8) nodes may HANDLE and STOP the request — it's
            a dispatch search, not an accumulation. Both are linked wrappers; the contract about "does everyone
            run?" differs.</p>
        </Reveal>
        <Reveal summary="Q: How would you add a decorator around an object that's ALREADY shared everywhere?">
          <p>You mostly can't — existing references still point at the naked object (Trap 1). Options: decorate
            at the single creation point (factory/DI container — this is exactly how Spring applies transactional
            proxies), or make holders re-fetch through an indirection you control. The honest answer is
            "decoration is a birth-time decision".</p>
        </Reveal>
        <Reveal summary="Q: Compress and Encrypt decorators — which order, and why does it matter?">
          <p>Compress INSIDE, encrypt OUTSIDE (compress-then-encrypt): compression exploits patterns, and
            well-encrypted data has none — compressing ciphertext achieves ~nothing. A real-world proof that
            decorator order is semantics, not style. (Crypto folks add: compression+encryption can even leak
            info — CRIME attack — but that nuance is beyond the exam.)</p>
        </Reveal>
        <Reveal summary="Q: Can a decorator REMOVE behavior instead of adding it?">
          <p>Yes — unmodifiableList removes write ability, a ThrottlingDecorator removes speed 🙂. GoF allows
            it, but each removal is an LSP debate (Day 13): you're narrowing the effective contract behind the
            same interface. Acceptable when documented as a VIEW; dangerous when callers can't know.</p>
        </Reveal>
        <Reveal summary="Q: Name decorator's appearances outside OOP class design.">
          <p>Middleware stacks (Express/Spring interceptors), servlet filters, Python's @decorators (same name,
            function-wrapping flavor), React higher-order components, gRPC/HTTP client interceptors. One idea —
            same-shape wrapping with added behavior — across every ecosystem. Saying this shows you see patterns
            as shapes, not Java trivia.</p>
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
        <strong>Day 27 complete?</strong> Homework: build the pizza pricing engine the RIGHT way this time.
        <C> interface Pizza {'{'} double cost(); String desc(); {'}'}</C>, <C>Margherita</C> (₹200) as the
        component, decorators <C>ExtraCheese</C> (+₹50), <C>Olives</C> (+₹40), <C>Jalapeno</C> (+₹30). ① Build
        <C> new Jalapeno(new ExtraCheese(new ExtraCheese(new Margherita())))</C> and verify ₹330 + the
        description. ② Write the assembly LOOP: <C>Pizza fromOrder(List&lt;String&gt; toppings)</C> — runtime
        composition, literally. ③ Prove the Day 24 connection: add a <C>PizzaBuilder</C> whose
        <C> withTopping(name)</C> wraps internally — builder ergonomics, decorator engine. ④ One sentence: why
        did Day 7's robot use swappable FIELDS while today uses WRAPPING? (Hint: replace vs accumulate.)
        <br /><br />
        Next: <strong>Day 28 — Composite</strong>: the pattern that lets a folder full of folders full of files
        answer <C>size()</C> with one call — treating trees of objects exactly like single objects.
      </div>
    </div>
  )
}
