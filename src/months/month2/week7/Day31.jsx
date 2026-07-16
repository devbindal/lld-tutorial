import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The navigator ============ */
const ROUTES = {
  fastest: { label: '🚀 FastestRoute', pts: '20,170 120,150 180,60 280,30', color: '#2D5BFF',
    stats: '32 km · 35 min · ₹120 toll', desc: 'takes the expressway — pay to fly' },
  shortest: { label: '📏 ShortestRoute', pts: '20,170 280,30', color: '#2E9E6B',
    stats: '24 km · 55 min · ₹0', desc: 'straight through the city — short but crawling' },
  noToll: { label: '💸 NoTollRoute', pts: '20,170 30,60 150,40 280,30', color: '#B97A14',
    stats: '38 km · 50 min · ₹0', desc: 'loops around every toll booth' },
  scenic: { label: '🌄 ScenicRoute', pts: '20,170 200,185 270,120 280,30', color: '#8E44AD',
    stats: '45 km · 70 min · ₹0', desc: 'the lake road — worth it on Sundays' },
}

function Navigator() {
  const [strat, setStrat] = useState('fastest')
  const r = ROUTES[strat]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · same start, same destination, same navigator — swap the brain</div>
      <div className="modbtns">
        {Object.entries(ROUTES).map(([k, v]) => (
          <button key={k} className={strat === k ? 'on' : ''} onClick={() => setStrat(k)}>{v.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <svg viewBox="0 0 300 200" style={{ width: 300, maxWidth: '100%', background: '#F4F6F0', border: '1px solid var(--line)', borderRadius: 10 }}>
          {Object.entries(ROUTES).map(([k, v]) => (
            <polyline key={k} points={v.pts} fill="none"
              stroke={k === strat ? v.color : '#d5d8cf'} strokeWidth={k === strat ? 4 : 2}
              strokeLinejoin="round" strokeLinecap="round" strokeDasharray={k === strat ? 'none' : '5,5'} />
          ))}
          <circle cx="20" cy="170" r="7" fill="#1B2A4A" />
          <text x="14" y="192" style={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}>🏠</text>
          <circle cx="280" cy="30" r="7" fill="#1B2A4A" />
          <text x="272" y="18" style={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}>🏢</text>
        </svg>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Code html={`<span class="cm">// the CONTEXT — this line NEVER changes:</span>
Route r = navigator.navigate(home, office);

<span class="cm">// only the injected brain changed:</span>
navigator.setStrategy(<span class="kw">new</span> ${r.label.split(' ')[1]}());`} />
          <div className="statbar" style={{ display: 'block' }}>
            <div>🧭 <b>{r.stats}</b></div>
            <div style={{ marginTop: 4 }}>{r.desc}</div>
          </div>
        </div>
      </div>
      <div className="statbar">
        🔄 <span>Swapped MID-APP, no recompile, no if-chains — the algorithm is an OBJECT you hand over (Day 7's hot-swap, finally wearing its GoF name).</span>
      </div>
    </div>
  )
}

/* ============ Interactive 2: The coupon registry ============ */
const COUPONS = {
  FESTIVAL20: { calc: (t) => t * 0.8, note: '20% off everything' },
  FLAT100: { calc: (t) => t - 100, note: 'flat ₹100 off' },
  BOGO: { calc: () => 600, note: 'cheapest item free (₹400 item)' },
}

function CouponEngine() {
  const [input, setInput] = useState('FESTIVAL20')
  const [result, setResult] = useState(null)

  function apply() {
    const code = input.trim().toUpperCase()
    if (code === '') { setResult({ ok: true, total: 1000, code: 'NONE', note: 'no coupon — NoDiscount strategy (a real object, not a null check!)' }) }
    else if (COUPONS[code]) setResult({ ok: true, total: COUPONS[code].calc(1000), code, note: COUPONS[code].note })
    else setResult({ ok: false, code })
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · cart ₹1000 (items: ₹600 + ₹400) — the registry picks the strategy</div>
      <Code html={`<span class="cm">// the registry — the ONLY place that maps codes → strategies (Day 22's containment):</span>
Map&lt;String, PricingStrategy&gt; registry = Map.of(
    <span class="str">"FESTIVAL20"</span>, <span class="kw">new</span> PercentOff(<span class="num">20</span>),
    <span class="str">"FLAT100"</span>,    <span class="kw">new</span> FlatOff(<span class="num">100</span>),
    <span class="str">"BOGO"</span>,       <span class="kw">new</span> CheapestFree()
);

<span class="cm">// checkout — NO switch, NO ifs. Look up, fail fast, delegate:</span>
PricingStrategy s = registry.getOrDefault(code, <span class="kw">null</span>);
<span class="kw">if</span> (s == <span class="kw">null</span>) <span class="kw">throw new</span> UnknownCouponException(code);
<span class="kw">double</span> total = s.apply(cart);`} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <input className="txt" value={input} onChange={(e) => setInput(e.target.value)} aria-label="coupon code" />
        <button className="act" onClick={apply}>apply coupon</button>
        {Object.keys(COUPONS).map((c) => (
          <span key={c} className="chip" style={{ cursor: 'pointer' }} onClick={() => setInput(c)}>{c}</span>
        ))}
      </div>
      {result && (
        <div className="statbar" style={{ background: result.ok ? '#EAF7EF' : '#FDECEC' }}>
          {result.ok
            ? <span>🧾 <span>{result.code}: {result.note} →</span> <b>₹{Math.round(result.total)}</b></span>
            : <span>💥 <b>UnknownCouponException: "{result.code}"</b> — rejected loudly at the registry (Day 19's fail-fast). Try SHIPPPED-style typos here all day; they never reach pricing.</span>}
        </div>
      )}
      <div className="statbar">
        🗝️ <span>Adding a DIWALI50 coupon = one strategy class + one registry entry. Checkout never changes — the selection switch itself is now data.</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: The Comparator playground ============ */
const PRODUCTS = [
  { name: 'Laptop', price: 72000, rating: 4.4 },
  { name: 'Mouse', price: 900, rating: 4.7 },
  { name: 'Monitor', price: 18500, rating: 4.2 },
  { name: 'Keyboard', price: 2500, rating: 4.6 },
]
const SORTS = {
  priceAsc: { label: '₹ price ↑', code: 'Comparator.comparing(Product::price)', fn: (a, b) => a.price - b.price },
  nameAz: { label: 'A→Z name', code: 'Comparator.comparing(Product::name)', fn: (a, b) => a.name.localeCompare(b.name) },
  ratingDesc: { label: '⭐ rating ↓', code: 'Comparator.comparing(Product::rating).reversed()', fn: (a, b) => b.rating - a.rating },
}

function ComparatorLab() {
  const [sort, setSort] = useState('priceAsc')
  const s = SORTS[sort]
  const sorted = [...PRODUCTS].sort(s.fn)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the strategy you call every day — Comparator</div>
      <div className="modbtns">
        {Object.entries(SORTS).map(([k, v]) => (
          <button key={k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>{v.label}</button>
        ))}
      </div>
      <Code html={`products.sort( ${s.code} );   <span class="cm">// sort() = the context. The comparator = the strategy.</span>`} />
      <div className="heap">
        {sorted.map((p) => (
          <div key={p.name} style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, padding: '3px 8px' }}>
            {p.name.padEnd(9)} · ₹{p.price.toLocaleString()} · ⭐{p.rating}
          </div>
        ))}
      </div>
      <div className="statbar">
        λ <span>sort() was written ONCE by the JDK in 199x and is closed forever — yet it sorts by rules invented decades later. That is Strategy + OCP, shipping in every Java program on Earth.</span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Strategy pattern\'s intent is…',
    o: ['To create object families', 'To define a FAMILY of interchangeable algorithms, encapsulate each one, and let the algorithm vary independently of the clients that use it', 'To give an object states', 'To wrap objects with features'], a: 1,
    e: 'One job (price the cart, pick the route, compare two items), many ways to do it — each way its own object behind one interface, swappable at runtime.',
    w: { 0: 'Families of PRODUCTS are Abstract Factory (23).',
         2: 'Self-changing behavior over a lifecycle is State (34) — the twin, next week.',
         3: 'Feature-wrapping is Decorator (27).' },
    r: { id: 's1', label: 'Section 1 — the navigator' } },
  { q: 'GoF participants: name the three.',
    o: ['Subject, Observer, Event', 'Strategy (the interface), ConcreteStrategies (one per algorithm), and Context (holds a Strategy reference and delegates to it)', 'Component, Leaf, Composite', 'Target, Adaptee, Adapter'], a: 1,
    e: 'Context owns the WHEN and the data; strategies own the HOW. The context never knows which concrete brain it holds — only the interface.',
    w: { 0: 'That cast belongs to Observer — tomorrow.',
         2: 'That is Composite (28).',
         3: 'That is Adapter (26).' },
    r: { id: 's3', label: 'Section 3 — the structure' } },
  { q: 'Why is strategy-by-composition stronger than algorithm-by-subclassing (PricingCheckout extends Checkout)?',
    o: ['It compiles faster', 'The algorithm becomes swappable at RUNTIME, combinable with any context, testable alone — and the context stays closed (Day 7 + Day 12 in one move)', 'Subclassing is deprecated', 'It uses less memory'], a: 1,
    e: 'Subclassing fixes the algorithm at construction and couples it to one context class forever. A strategy object is independent: swap it mid-session, share it, unit-test it without the context.',
    w: { 0: 'Compilation is irrelevant.',
         2: 'Subclassing is fine for true is-a — this is not that.',
         3: 'Memory is a wash (often better — see sharing).' },
    r: { id: 's3', label: 'Section 3 — why composition' } },
  { q: 'The "who picks the strategy?" problem is best solved by…',
    o: ['Every client writing its own if/else over types', 'ONE contained selector — a registry Map (code → strategy) or factory — so selection knowledge has a single home and clients just look up', 'Random selection', 'Always hardcoding one'], a: 1,
    e: 'Strategy removes the algorithm-switch; the registry removes the SELECTION-switch too. Adding a coupon = new entry, not new branches across the codebase (Days 16, 22).',
    w: { 0: 'Scattered selection re-creates the disease the pattern cured.',
         2: 'Comedy, not architecture. 🙂',
         3: 'Hardcoding one forever means you never needed Strategy (fair YAGNI outcome!).' },
    r: { id: 's5', label: 'Section 5 — the coupon registry' } },
  { q: 'Why is Comparator the world\'s most-used Strategy?',
    o: ['It is not a strategy', 'sort() is a closed context written decades ago; every Comparator you pass is a pluggable comparison ALGORITHM — millions of them invented since, zero edits to sort()', 'It uses inheritance', 'It only sorts numbers'], a: 1,
    e: 'The JDK could not foresee your Product class — so it took the comparison as a strategy parameter. Runnable, ThreadFactory and friends follow the same shape.',
    w: { 0: 'It is the canonical one.',
         2: 'Pure composition — you pass an object/lambda in.',
         3: 'It compares anything you define.' },
    r: { id: 's7', label: 'Section 7 — Comparator lab' } },
  { q: 'What did lambdas (Java 8) change about Strategy?',
    o: ['Made it obsolete', 'Collapsed the ceremony: a one-method strategy interface is a functional interface, so a strategy is now a lambda or method reference — same pattern, one line', 'Made strategies stateful', 'Removed the interface'], a: 1,
    e: 'cart -> cart.total() * 0.8 IS a PricingStrategy. The pattern survives; the boilerplate died. For multi-method or stateful-config strategies, classes still serve.',
    w: { 0: 'More alive than ever — every lambda you pass to a method is one.',
         2: 'Lambdas push the OPPOSITE way — toward stateless.',
         3: 'The functional interface IS the strategy interface.' },
    r: { id: 's6', label: 'Section 6 — the lambda era' } },
  { q: 'Strategy vs State — same UML diagram. The real differences?',
    o: ['None, same pattern', 'WHO drives change: clients/config choose a strategy (and rarely mid-flow); a State object TRANSITIONS ITSELF to the next state as events occur — and states know about each other, strategies are strangers', 'State is compile-time', 'Strategy needs enums'], a: 1,
    e: 'Strategy: pick the brain, run. State: the object\'s behavior morphs through a lifecycle (Order: PLACED→PAID→SHIPPED, Day 19!) with transition logic inside the states. Day 34 builds it.',
    w: { 0: 'The structure twins are distinguished by intent — the recurring GoF exam move.',
         2: 'Both are runtime mechanisms.',
         3: 'Enums are one implementation option, never a requirement.' },
    r: { id: 's8', label: 'Section 8 — the twins table' } },
  { q: 'Why should strategies (usually) be STATELESS — and what does that buy?',
    o: ['Statelessness is required by Java', 'No per-use mutable fields → one instance is safely shared by every cart and every thread (flyweight, Day 30) — per-call data arrives as parameters instead', 'It makes them faster to write', 'It prevents lambdas'], a: 1,
    e: 'A strategy holding "the current cart" in a field breaks the moment two checkouts share it (Day 30\'s painted forest, Day 17\'s shared state). Keep config (the 20 in PercentOff(20)) immutable; pass the cart per call.',
    w: { 0: 'No language rule — a sharing-safety rule.',
         2: 'Writing effort is similar.',
         3: 'Lambdas are naturally stateless — they encourage it.' },
    r: { id: 's9', label: 'Section 9 — Trap 1: stateful strategies' } },
]

/* ============ The page ============ */
export default function Day31() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 7 · Day 31 · Behavioral Patterns</div>
        <h1>Strategy:<br />The Swappable Brain</h1>
        <p>Welcome to behavioral week — patterns about how objects ACT and TALK. We begin with the one you have
           been building unknowingly since Day 7's robot and Day 12's discounts: today it gets its GoF name, its
           lambda-era form, and the registry trick that kills the last switch. Click everything.</p>
        <div className="chips">
          {['strategy', 'family of algorithms', 'context', 'runtime swap', 'Comparator', 'lambdas'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The navigator's four brains</h2>
        <p>Open any maps app: Home → Office. Before it draws a line, it asks YOU: fastest? shortest? avoid
          tolls? The navigation machinery — GPS, screen, voice — is identical for all four. Only the
          <strong> route-choosing algorithm</strong> differs. Four interchangeable brains, one head.</p>
        <Note><strong>Strategy's intent:</strong> define a <strong>family of algorithms</strong>, encapsulate
          each one as an object, and make them <strong>interchangeable</strong> — so the algorithm can vary
          independently of the clients (and the context) that use it.</Note>
        <Code html={`        THE STRATEGY IDEA

   CONTEXT (the head)                «interface» RouteStrategy   ← the socket (Days 12/15)
   Navigator                         plan(from, to): Route
   ├ strategy: RouteStrategy ────▶          ▲
   └ navigate(a, b) {               ┌───────┼─────────┬──────────┐
       strategy.plan(a, b)       Fastest  Shortest  NoToll   Scenic
     }                            (one small class per BRAIN — add a 5th
   never edited again ✅           tomorrow without touching anything)`} />
        <p><strong>Receipts from your own course:</strong> Day 7's robot swapping weapons, Day 12's
          <C> DiscountPolicy</C>, Day 15's injected interfaces — all were strategy-shaped. Today is less about a
          new idea and more about <em>naming and completing</em> one you already own.</p>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The crime scene (a 10-second recap)</h2>
        <Code html={`<span class="kw">double</span> total(Cart cart, String type) {
    <span class="kw">if</span> (type.equals(<span class="str">"FESTIVAL"</span>))      <span class="kw">return</span> cart.total() * <span class="num">0.8</span>;
    <span class="kw">else if</span> (type.equals(<span class="str">"LOYALTY"</span>))  <span class="kw">return</span> cart.total() - <span class="num">100</span>;
    <span class="kw">else if</span> (type.equals(<span class="str">"BOGO"</span>)) { <span class="cm">/* 15 lines */</span> }
    <span class="cm">// next sprint: +NEWUSER, +DIWALI, +EMPLOYEE… same tested method, reopened forever</span>
}`} />
        <p>You diagnosed this on Day 12 (OCP violation), and the cure's ingredients on Day 4 (dispatch) and
          Day 7 (composition). Strategy is that cure, packaged: <strong>each branch becomes a class; the chain
          becomes one delegation.</strong></p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The structure (and its three GoF names)</h2>
        <Code html={`<span class="cm">// the STRATEGY interface — one brain socket:</span>
<span class="kw">public interface</span> PricingStrategy {
    <span class="kw">double</span> apply(Cart cart);          <span class="cm">// per-call data arrives as a PARAMETER</span>
}

<span class="cm">// CONCRETE STRATEGIES — small, single-job (Day 11), stateless (see §9):</span>
<span class="kw">public class</span> PercentOff <span class="kw">implements</span> PricingStrategy {
    <span class="kw">private final double</span> percent;                 <span class="cm">// CONFIG is fine — it's immutable</span>
    <span class="kw">public</span> PercentOff(<span class="kw">double</span> p) { percent = p; }
    <span class="kw">public double</span> apply(Cart c) { <span class="kw">return</span> c.total() * (<span class="num">1</span> - percent / <span class="num">100</span>); }
}
<span class="kw">public class</span> CheapestFree <span class="kw">implements</span> PricingStrategy {
    <span class="kw">public double</span> apply(Cart c) { <span class="kw">return</span> c.total() - c.cheapestItem().price(); }
}

<span class="cm">// the CONTEXT — owns the workflow + the data; delegates the varying step:</span>
<span class="kw">public class</span> Checkout {
    <span class="kw">private</span> PricingStrategy pricing;                       <span class="cm">// the swappable brain</span>
    <span class="kw">public</span> Checkout(PricingStrategy p) { pricing = p; }   <span class="cm">// injected (Day 15)</span>
    <span class="kw">public void</span> setPricing(PricingStrategy p) { pricing = p; }  <span class="cm">// swap at runtime</span>

    <span class="kw">public</span> Receipt pay(Cart cart, Card card) {
        <span class="kw">double</span> total = pricing.apply(cart);     <span class="cm">// ← the ONE varying line</span>
        <span class="cm">// …charge, receipt, the stable 90% …</span>
    }
}`} />
        <p>Division of labor, worth saying aloud in interviews: <strong>the context owns WHEN and the data;
          strategies own HOW.</strong> Neither knows the other's internals — they meet at one lean interface
          (Day 14 approved).</p>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🧭 Play: The navigator</h2>
        <p>Same trip, four brains. Watch which line of code changes — and which never does.</p>
        <Navigator />
        <Good><strong>What you should notice:</strong> ① <C>navigator.navigate(home, office)</C> is frozen — only
          the injected strategy varies. ② Each route is a complete, self-contained algorithm with its own
          trade-offs (the stats panel) — encapsulated, comparable, swappable. ③ A fifth brain (EvRoute, avoiding
          chargers' deserts) would be one new class. Nothing else.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🗝️ Play: The coupon registry (killing the LAST switch)</h2>
        <p>Strategy moved the algorithms out — but someone still must CHOOSE one. Don't scatter that choice as
          if/else either: contain it in a registry. Type coupons, including wrong ones:</p>
        <CouponEngine />
        <Good><strong>What you should notice:</strong> ① Selection became a Map LOOKUP — the catalog of strategies
          is data with one home (Day 22's containment, Day 16's DRY). ② Unknown codes die loudly at the door
          (Day 19), never reaching money math. ③ The empty-code case returns a real <C>NoDiscount</C> strategy —
          a glimpse of the Null Object idea (no null checks downstream, ever).</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The lambda era: strategies in one line</h2>
        <p><C>PricingStrategy</C> has exactly one method — which makes it a <strong>functional interface</strong>
          (Day 5), which means since Java 8 a strategy needs no class file at all:</p>
        <Code html={`<span class="cm">// classic (still right for configured/multi-method strategies):</span>
registry.put(<span class="str">"FESTIVAL20"</span>, <span class="kw">new</span> PercentOff(<span class="num">20</span>));

<span class="cm">// lambda — the same pattern, ceremony removed:</span>
registry.put(<span class="str">"FLAT100"</span>, cart -&gt; cart.total() - <span class="num">100</span>);

<span class="cm">// method reference — an existing method BECOMES a strategy:</span>
registry.put(<span class="str">"NONE"</span>, Cart::total);`} />
        <p>And the JDK has shipped strategy sockets since 1996: <C>Comparator</C> (comparison algorithm),
          <C> Runnable</C> (the work to do), <C>ThreadFactory</C>, <C>Predicate</C> in
          <C> filter(...)</C> — every higher-order method you call takes a strategy. Day 14 called these
          "extreme ISP"; today add: <strong>extreme Strategy</strong>.</p>
        <Warn><strong>The capturing-lambda trap:</strong> a lambda that closes over a mutable local variable
          quietly turns a "stateless" strategy into a stateful one shared by every caller. If that strategy is
          registered once and reused across concurrent checkouts, one customer's data leaks into another's.
          Capture only immutable config, never mutable per-call state.</Warn>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>λ Play: The Comparator playground</h2>
        <p>The strategy pattern you have invoked thousands of times without naming it:</p>
        <ComparatorLab />
        <Good><strong>What you should notice:</strong> ① <C>sort()</C> — the context — was closed decades before
          your Product existed, yet sorts it perfectly: Strategy IS how libraries stay open (Day 12) to futures
          they can't imagine. ② Each "algorithm" here is one readable line. ③ <C>.reversed()</C> and
          <C> .thenComparing(...)</C> COMPOSE strategies — decorator thinking (Day 27) applied to strategies.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>The look-alike table (behavioral edition)</h2>
        <table className="matrix">
          <thead>
            <tr><th>vs</th><th>same-shaped because…</th><th>the difference</th></tr>
          </thead>
          <tbody>
            <tr><td>🚦 State (34)</td><td>identical UML: context holds interface</td><td>strategies are chosen by CLIENT/config and ignore each other; states TRANSITION THEMSELVES as events occur and know their successors</td></tr>
            <tr><td>📋 Template Method (35)</td><td>both vary a step of an algorithm</td><td>template varies steps via INHERITANCE (subclass overrides), fixed at construction; strategy via COMPOSITION, swappable anytime (Day 7's verdict applies)</td></tr>
            <tr><td>🌉 Bridge (30)</td><td>literally the same structure</td><td>scale & intent: strategy = one varying ALGORITHM; bridge = two whole HIERARCHIES kept independent</td></tr>
            <tr><td>🎁 Decorator (27)</td><td>both compose behavior</td><td>decorator ADDS layers around the same interface; strategy REPLACES the brain behind it (accumulate vs swap — your Day 27 homework question!)</td></tr>
          </tbody>
        </table>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — The stateful shared strategy</h3>
        <p>A strategy with a <C>currentCart</C> field, registered once in the Map, used by two simultaneous
          checkouts → cross-contamination (Day 30's painted forest, money edition). Rule: immutable config in
          fields, per-call data in parameters. Stateless strategies are shareable flyweights for free.</p>
        <h3>Trap 2 — The starving strategy</h3>
        <p>An algorithm that needs cart + user + inventory + clock ends up with a five-parameter interface that
          changes monthly. Fix: pass ONE context/parameter object (<C>apply(PricingContext ctx)</C>) — the
          interface stays stable while the context grows (and Day 14 stays happy).</p>
        <h3>Trap 3 — Strategy-itis</h3>
        <p>An interface + three files for logic with ONE variant and no second in sight. Day 12's fool-me-once
          rule governs patterns too: hard-code first, extract at the second variant. A lambda in a field is a
          nice middle step.</p>
        <h3>Trap 4 — Selection scattered anyway</h3>
        <p>Beautiful strategies… chosen by copy-pasted if/else in seven controllers. The selection knowledge is
          part of the design: registry/factory, one home.</p>
        <h3>Trap 5 — Strategies reaching back into the context</h3>
        <p>If a strategy calls <C>context.getThis()</C>, <C>context.getThat()</C> five times, it's feature envy
          (Day 18) — the boundary is misdrawn. Hand it what it needs; if "what it needs" is everything, the
          split point is wrong.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> family of interchangeable algorithm OBJECTS behind one interface; context delegates the varying step. Context = WHEN + data; strategy = HOW.</li>
          <li>Powers: runtime swap · isolated testing · OCP for the context · stateless ⇒ shareable (flyweight).</li>
          <li><strong>Selection</strong> belongs in ONE registry/factory (Map code→strategy, fail fast on unknown). NoDiscount &gt; null.</li>
          <li><strong>Lambda era:</strong> one-method strategy = functional interface = lambda/method ref. JDK strategies: Comparator, Runnable, Predicate, ThreadFactory; compose with reversed/thenComparing.</li>
          <li><strong>Twins:</strong> State (self-transitioning lifecycle) · Template Method (inheritance flavor) · Bridge (two hierarchies) · Decorator (accumulate vs replace).</li>
          <li>Traps: stateful sharing · starving interfaces (use a context object) · strategy-itis (fool-me-once) · scattered selection · feature-envious strategies.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: GoF lists an alternate name for Strategy — what is it?">
          <p><strong>Policy.</strong> You will meet it in real APIs: RetryPolicy, BackoffPolicy, EvictionPolicy,
            CachePolicy — every "-Policy" parameter in a library is the Strategy pattern saying its other name.</p>
        </Reveal>
        <Reveal summary="Q: Implement Strategy with an ENUM — how, and when is that the right call?">
          <p>Day 19's per-constant behavior: <C>enum Pricing implements PricingStrategy {'{'} FESTIVAL {'{'} apply…{'}'}, FLAT100 {'{'}…{'}'} {'}'}</C>
            — each constant overrides apply(). Right when the set is FIXED and benefits from exhaustiveness +
            built-in registry (valueOf!). Wrong when third parties must add strategies — enums are closed.</p>
        </Reveal>
        <Reveal summary="Q: How do you inject 'all strategies' in Spring without a switch?">
          <p>Inject <C>Map&lt;String, PricingStrategy&gt;</C> (or List) — Spring auto-populates it with every
            bean implementing the interface, keyed by bean name. New strategy = new @Component; the registry
            assembles itself. The DI-container version of today's coupon demo, and a very common senior-round
            answer.</p>
        </Reveal>
        <Reveal summary="Q: Strategy returns different RESULTS per algorithm — any LSP concerns?">
          <p>Subtle and good to name: all strategies must honor the INTERFACE contract (same input domain, result
            invariants like total ≥ 0, no surprise exceptions — Day 13), while being free to differ in the
            business outcome. "Interchangeable" means substitutable-without-breaking, not identical answers.</p>
        </Reveal>
        <Reveal summary="Q: Where does the Null Object pattern meet Strategy?">
          <p>The default brain: <C>NoDiscount implements PricingStrategy {'{'} return cart.total(); {'}'}</C> —
            a real object that harmlessly does the neutral thing, so the context NEVER null-checks its strategy.
            Null Object is GoF-adjacent (not in the book) and pairs with Strategy more than with anything else.</p>
        </Reveal>
        <Reveal summary="Q: Is dependency injection just Strategy everywhere?">
          <p>Sharp question. Same mechanics (interface + composition + external choice), different intent:
            Strategy varies an ALGORITHM among peers (FESTIVAL vs FLAT); DIP/DI inverts an ARCHITECTURAL
            dependency (policy vs infrastructure, Day 15). One is about which math; the other about which
            direction arrows point. Saying that cleanly is a level-up moment.</p>
        </Reveal>
        <Reveal summary="Q: When is plain if/else BETTER than Strategy?">
          <p>Two or three stable branches of trivial logic, no scheduled growth, single call site — an if-chain
            is honest, local and readable (KISS, Day 16). Strategy earns its files when variants multiply,
            arrive at runtime, need isolated tests, or third parties supply them. Patterns are bought with
            complexity; check the price.</p>
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
        <strong>Day 31 complete?</strong> Homework: the shipping engine, end to end.
        <C> interface ShippingStrategy {'{'} double cost(Order o); {'}'}</C> with <C>Standard</C> (₹40 flat),
        <C> Express</C> (₹40 + ₹15/kg), <C>FreeAbove999</C> (0 if total ≥ 999, else Standard). ① Classic
        classes + a <C>Map&lt;String, ShippingStrategy&gt;</C> registry with fail-fast lookup. ② Rewrite all
        three as lambdas in the registry — count the lines you deleted. ③ Add a JUnit-style main that tests each
        strategy ALONE (no Checkout involved — the testability receipt). ④ One sentence: why does
        <C> FreeAbove999</C> delegating to Standard NOT make it a decorator? (Intent check!)
        <br /><br />
        Next: <strong>Day 32 — Observer</strong>: the pattern that powers every notification you've ever
        received — publish, subscribe, and the art of telling a hundred objects "something happened" without
        knowing who they are.
      </div>
    </div>
  )
}
