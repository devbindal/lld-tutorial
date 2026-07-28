import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The beverage machine ============ */
function BeverageMachine() {
  const [drink, setDrink] = useState('tea')
  const [condiments, setCondiments] = useState(true)
  const [trace, setTrace] = useState(null)

  function run() {
    const child = drink === 'tea'
      ? { brew: '🍃 steeping the tea bag 3 min', cond: '🍋 adding lemon' }
      : { brew: '☕ dripping coffee through filter', cond: '🥛 adding milk & sugar' }
    setTrace([
      { who: 'parent', line: 'boilWater() — 100°C, same for everyone' },
      { who: 'child', line: `brew() — ${child.brew}` },
      { who: 'parent', line: 'pourInCup() — same for everyone' },
      condiments
        ? { who: 'hook', line: `customerWantsCondiments() → true → addCondiments() — ${child.cond}` }
        : { who: 'hook', line: 'customerWantsCondiments() → false → step SKIPPED (the hook said no)' },
    ])
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one recipe skeleton, two drinks, one optional step</div>
      <div className="modbtns">
        <button className={drink === 'tea' ? 'on' : ''} onClick={() => { setDrink('tea'); setTrace(null) }}>🍵 new Tea()</button>
        <button className={drink === 'coffee' ? 'on' : ''} onClick={() => { setDrink('coffee'); setTrace(null) }}>☕ new Coffee()</button>
        <button className={condiments ? 'on' : ''} onClick={() => { setCondiments((c) => !c); setTrace(null) }}>
          {condiments ? '✅' : '⬜'} hook: wants condiments
        </button>
      </div>
      <button className="act" onClick={run} style={{ marginBottom: 10 }}>▶ prepareRecipe()</button>
      {trace && (
        <div className="heap">
          {trace.map((t, i) => (
            <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '4px 8px', borderRadius: 6,
              background: t.who === 'child' ? '#FFF1D6' : t.who === 'hook' ? '#E5EBFF' : 'transparent' }}>
              {t.who === 'parent' ? '🏛️ ' : t.who === 'child' ? '🧒 ' : '🪝 '}{t.line}
            </div>
          ))}
        </div>
      )}
      <div className="statbar">
        🏛️ <span>parent steps (fixed) · 🧒 child steps (the blanks) · 🪝 hook (optional). The ORDER never varies — that is the template's promise.</span>
      </div>
    </div>
  )
}

/* ============ Interactive 2: The exporter builder ============ */
const FETCHES = {
  DbFetch: '🗄️ SELECT * FROM orders — 1,204 rows',
  ApiFetch: '🌐 GET /api/orders — 1,204 rows (3 pages)',
  CsvFetch: '📄 parsing legacy_orders.csv — 1,204 rows',
}
const WRITES = {
  PdfWrite: '📕 rendering 14-page PDF',
  ExcelWrite: '📊 writing orders.xlsx with totals row',
}

function ExporterBuilder() {
  const [fetch_, setFetch] = useState('DbFetch')
  const [write, setWrite] = useState('PdfWrite')
  const [trace, setTrace] = useState(null)
  const [reorder, setReorder] = useState(false)

  function run() {
    setReorder(false)
    setTrace([
      { who: 'child', line: `fetchData() — ${FETCHES[fetch_]}` },
      { who: 'parent', line: 'transform() — sort, dedupe, MASK EMAILS (written once, audited once)' },
      { who: 'child', line: `write() — ${WRITES[write]}` },
      { who: 'hook', line: 'onComplete() — (default empty hook — nobody overrode it)' },
    ])
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · "write a subclass" = pick the blanks. The skeleton is HQ's.</div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>BLANK 1 — fetchData()</div>
          <div className="modbtns">
            {Object.keys(FETCHES).map((k) => (
              <button key={k} className={fetch_ === k ? 'on' : ''} onClick={() => { setFetch(k); setTrace(null) }}>{k}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>BLANK 2 — write()</div>
          <div className="modbtns">
            {Object.keys(WRITES).map((k) => (
              <button key={k} className={write === k ? 'on' : ''} onClick={() => { setWrite(k); setTrace(null) }}>{k}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={run}>▶ export()</button>
        <button className="ghost act" onClick={() => { setReorder(true); setTrace(null) }}>😈 subclass tries: write() BEFORE transform()</button>
      </div>
      {reorder && (
        <div className="statbar" style={{ background: '#FDECEC', marginBottom: 8 }}>
          ❌ <span><b>Cannot override export() — it is FINAL.</b> Subclasses fill blanks; they do not reorder the ceremony. (Imagine unmasked emails shipping because one branch "optimized" the order.)</span>
        </div>
      )}
      {trace && (
        <div className="heap">
          {trace.map((t, i) => (
            <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '4px 8px', borderRadius: 6,
              background: t.who === 'child' ? '#FFF1D6' : t.who === 'hook' ? '#E5EBFF' : 'transparent' }}>
              {t.who === 'parent' ? '🏛️ ' : t.who === 'child' ? '🧒 ' : '🪝 '}{t.line}
            </div>
          ))}
        </div>
      )}
      <div className="statbar">
        🏛️ <span>3 fetchers × 2 writers = 6 exporters from 5 small classes — and the dangerous middle step exists exactly once.</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: The constructor trap ============ */
const TRAP_STEPS = [
  { line: 'new SmsNotifier("+91-98xxx")', note: 'Child constructor called… but Java runs the PARENT constructor first (Day 3 chain!).', phone: 'not yet assigned' },
  { line: 'Notifier() { this.init(); }   // parent constructor', note: 'The parent constructor calls init() — an OVERRIDABLE method. Dynamic dispatch (Day 4) routes to the CHILD override… now.', phone: 'not yet assigned' },
  { line: 'SmsNotifier.init() { register(phone.length()); }', note: 'The child override runs — but child field initializers and constructor body HAVE NOT executed yet.', phone: 'null  😱' },
  { line: '💥 NullPointerException: phone is null', note: 'The object exploded while half-born: the template called the blank before the blank had materials.', phone: 'null' },
  { line: '(never reached) this.phone = "+91-98xxx";', note: 'The saving assignment was always going to run AFTER the parent constructor. Order is law.', phone: '—' },
]
const FIX_STEPS = [
  { line: 'new SmsNotifier("+91-98xxx")', note: 'Constructors now construct ONLY: child assigns phone; nobody calls overridables.', phone: '"+91-98xxx" ✓' },
  { line: 'notifier.start();   // the template, AFTER birth', note: 'The template runs on a FULLY built object.', phone: '"+91-98xxx" ✓' },
  { line: 'SmsNotifier.init() → register(13) ✓', note: 'Same code, safe timing. Rule: constructors call only final/private/static methods (Effective Java). Start templates explicitly, or from a factory (Day 22).', phone: '"+91-98xxx" ✓' },
]

function ConstructorTrap() {
  const [world, setWorld] = useState('broken')
  const [step, setStep] = useState(-1)
  const steps = world === 'broken' ? TRAP_STEPS : FIX_STEPS
  const cur = step >= 0 ? steps[Math.min(step, steps.length - 1)] : null

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the famous self-destructing constructor</div>
      <div className="modbtns">
        <button className={world === 'broken' ? 'on' : ''} onClick={() => { setWorld('broken'); setStep(-1) }}>💣 template runs IN the constructor</button>
        <button className={world === 'fixed' ? 'on' : ''} onClick={() => { setWorld('fixed'); setStep(-1) }}>🛡️ template runs AFTER construction</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))} disabled={step >= steps.length - 1}>
          {step < 0 ? '▶ run it' : 'next →'}
        </button>
        <button className="ghost act" onClick={() => setStep(-1)}>reset</button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="heap">
            {steps.slice(0, step + 1).map((t, i) => (
              <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '4px 8px', borderRadius: 6,
                background: i === step ? (t.line.includes('💥') ? '#FFE0DE' : '#EEF2FF') : 'transparent',
                fontWeight: i === step ? 700 : 400 }}>{t.line}</div>
            ))}
            {step < 0 && <div className="empty">Press play and watch WHEN each piece runs.</div>}
          </div>
        </div>
        <div className="obj" style={{ minWidth: 200 }}>
          <div className="oref">the half-born object</div>
          <div className="ofield">phone = {cur ? cur.phone : '…'}</div>
        </div>
      </div>
      {cur && <div className="statbar">💡 <span>{cur.note}</span></div>}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Template Method pattern\'s intent is…',
    o: ['To give objects lifecycles', 'To swap whole algorithms at runtime', 'To freeze requests as objects', 'To define an algorithm\'s SKELETON in a base-class method, deferring specific STEPS to subclasses — they redefine steps without changing the structure'], a: 3,
    e: 'The parent owns the ceremony (order + invariant steps); children fill named blanks. One algorithm, written once, with sockets at chosen points.',
    w: { 0: 'Lifecycles are State (34).',
         1: 'Whole-algorithm swap is Strategy (31) — here only STEPS vary inside a fixed frame.',
         2: 'Frozen requests are Command (33).' },
    r: { id: 's1', label: 'Section 1 — the franchise manual' } },
  { q: 'The Hollywood Principle — meaning?',
    o: ['Always use callbacks', 'Make code dramatic', '"Don\'t call us, we\'ll call you": the PARENT calls the child\'s overrides at the right moments — inversion of control via inheritance; children never orchestrate', 'Never use inheritance'], a: 2,
    e: 'Subclasses wait by the phone: brew() runs when prepareRecipe() decides. The same inversion frameworks use (Day 15\'s IoC) — implemented with a vtable instead of a container.',
    w: { 0: 'Callbacks are ONE other way to be called; the principle is broader.',
         1: 'Tempting, but no. 🙂',
         3: 'TM is inheritance used WELL, not banned.' },
    r: { id: 's2', label: 'Section 2 — the structure' } },
  { q: 'Why should the template method itself be FINAL?',
    o: ['To prevent lambdas', 'The skeleton IS the contract — order and invariants (mask before write!). If subclasses could override it, the one guarantee the pattern sells evaporates', 'Java requires it', 'final runs faster'], a: 1,
    e: 'Subclasses get named, intentional sockets — nothing more. The rogue branch reordering write() before transform() is exactly what final forbids.',
    w: { 0: 'Lambdas are unrelated.',
         2: 'No language rule — a design rule.',
         3: 'JIT speed is a footnote.' },
    r: { id: 's4', label: 'Section 4 — three kinds of methods' } },
  { q: 'Abstract step vs HOOK?',
    o: ['Synonyms', 'Hooks are static', 'Abstract step: subclass MUST implement. Hook: optional override with a sensible default (often empty, or a boolean like customerWantsCondiments) — subclasses MAY plug in', 'Abstract steps return void only'], a: 2,
    e: 'Minimize MUSTs (every abstract method taxes all subclasses — Day 14 instinct); offer MAYs where variation is plausible. The hook is the polite extension point.',
    w: { 0: 'Must vs may IS the design decision.',
         1: 'static cannot be overridden (Day 4).',
         3: 'Return types are free in both.' },
    r: { id: 's4', label: 'Section 4 — abstract vs hook' } },
  { q: 'HttpServlet.service() dispatching to your doGet() override is…',
    o: ['Observer', 'Template Method verbatim: the parent owns the skeleton (parse, dispatch by verb); you fill the blank for your verb — the framework calls YOU', 'Adapter', 'Builder'], a: 1,
    e: 'Extend HttpServlet, override doGet, never call it yourself. AbstractList (implement get+size, inherit the whole List API), InputStream, JUnit lifecycles — frameworks are template farms.',
    w: { 0: 'Nobody subscribes — the parent dispatches to its own overridable.',
         2: 'No interface translation.',
         3: 'Nothing is constructed stepwise.' },
    r: { id: 's6', label: 'Section 6 — sightings' } },
  { q: 'Why is calling an OVERRIDABLE method from a CONSTRUCTOR a famous bug?',
    o: ['The parent constructor runs BEFORE child field initializers (Day 3) — the child\'s override executes against null/zero fields: a half-born object answering the phone', 'It deadlocks', 'Compile error', 'It skips the parent constructor'], a: 0,
    e: 'Dynamic dispatch does not wait for construction to finish. Effective Java: constructors may call only final/private/static methods. Start templates AFTER birth.',
    w: { 1: 'No threads needed.',
         2: 'It compiles cheerfully — that is the danger.',
         3: 'The parent constructor is exactly what IS running.' },
    r: { id: 's8', label: 'Section 8 — the constructor trap' } },
  { q: 'Template Method vs Strategy — the decision guide?',
    o: ['Always TM', 'They cannot do the same jobs', 'Always Strategy', 'TM (inheritance): variants share skeleton + protected state, known at compile time, vary in 1–2 steps. Strategy (composition): runtime swap, free combination, isolated testing — the modern default; TM still owns framework base classes'], a: 3,
    e: 'Day 7\'s verdict applies: reach for Strategy first; accept TM where a framework hands you a base class or the shared skeleton + state genuinely lives in a parent.',
    w: { 0: '"Always TM" re-buys the inheritance taxes daily.',
         1: 'They overlap heavily — hence the comparison.',
         2: '"Always" ignores AbstractList and every framework you use.' },
    r: { id: 's7', label: 'Section 7 — the showdown' } },
  { q: 'What is the "template CALLBACK" (Spring JdbcTemplate) twist?',
    o: ['The skeleton stays (connect, loop, close, translate errors) but the varying step arrives as a LAMBDA parameter instead of a subclass override — Template Method rebuilt with composition', 'An XML feature', 'A deprecated API', 'A new thread per query'], a: 0,
    e: 'query(sql, (rs, n) -> new Order(rs)) — no subclass, same guarantee (you cannot forget to close the connection). The lambda age moved many templates from extends to parameters; the idea survived the syntax.',
    w: { 1: 'No XML anywhere. 🙂',
         2: 'Alive in every Spring app.',
         3: 'Threading is unrelated.' },
    r: { id: 's6', label: 'Section 6 — the template callback' } },
]

/* ============ The page ============ */
export default function Day35() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 7 · Day 35 · Behavioral Patterns · FINALE</div>
        <h1>Template Method:<br />The Skeleton With Named Blanks</h1>
        <p>The Week 7 finale — inheritance's last great pattern. A parent writes the ceremony once and calls
           YOU at the right moments to fill the blanks: the Hollywood Principle. Plus the constructor bug that
           has failed a thousand interviews. Click everything.</p>
        <div className="chips">
          {['template method', 'hooks', 'final skeleton', 'Hollywood principle', 'doGet/doPost', 'constructor trap'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The franchise manual</h2>
        <p>Every outlet of a famous pizza chain makes pizza the SAME way: knead → sauce → top → bake → box.
          HQ wrote that manual once, and no branch may reorder it. But step 3 — the toppings — is a
          <strong> named blank</strong>: Mumbai fills it with paneer tikka, Tokyo with teriyaki. The ceremony
          is law; the blanks are local.</p>
        <Note><strong>Template Method's intent:</strong> define the <strong>skeleton</strong> of an algorithm in
          a base-class method, deferring some <strong>steps</strong> to subclasses — which redefine those steps
          <em> without changing the algorithm's structure</em>. Motto: the <strong>Hollywood Principle</strong> —
          "don't call us, we'll call you."</Note>
        <Code html={`        THE TEMPLATE IDEA

   <span class="kw">abstract class</span> PizzaProcess
   ┌────────────────────────────────┐
   │ <u>final</u> make() {                 │  ← the CEREMONY: final, ordered, HQ's
   │    knead();       ← concrete   │
   │    addSauce();    ← concrete   │
   │    addToppings(); ← ABSTRACT 🧒 │  ← the named blank
   │    bake();        ← concrete   │
   │    celebrate();   ← hook 🪝     │  ← optional blank (default: nothing)
   │ }                              │
   └────────────────────────────────┘
            ▲                ▲
     MumbaiPizza        TokyoPizza      ← children wait to BE CALLED`} />
        <p>Sound familiar? Day 22's <C>Logistics.planDelivery()</C> calling <C>createTransport()</C> was this
          exact shape — GoF classifies Factory Method as a Template Method whose blank happens to CREATE
          something. Today you get the general pattern.</p>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The structure (tea, coffee, one ceremony)</h2>
        <Code html={`<span class="kw">public abstract class</span> CaffeineBeverage {

    <span class="cm">// THE TEMPLATE — final: the ceremony is not negotiable</span>
    <span class="kw">public final void</span> prepareRecipe() {
        boilWater();                       <span class="cm">// concrete — shared</span>
        brew();                            <span class="cm">// abstract — the blank 🧒</span>
        pourInCup();                       <span class="cm">// concrete — shared</span>
        <span class="kw">if</span> (customerWantsCondiments())     <span class="cm">// hook 🪝 — child may flip it</span>
            addCondiments();               <span class="cm">// abstract — the other blank</span>
    }

    <span class="kw">private void</span> boilWater() { <span class="cm">/* 100°C, once, audited */</span> }
    <span class="kw">private void</span> pourInCup() { <span class="cm">/* … */</span> }

    <span class="kw">protected abstract void</span> brew();               <span class="cm">// MUST fill</span>
    <span class="kw">protected abstract void</span> addCondiments();      <span class="cm">// MUST fill</span>
    <span class="kw">protected boolean</span> customerWantsCondiments() { <span class="kw">return true</span>; }  <span class="cm">// MAY override</span>
}

<span class="kw">public class</span> Tea <span class="kw">extends</span> CaffeineBeverage {
    <span class="kw">protected void</span> brew()          { steepTeaBag(); }
    <span class="kw">protected void</span> addCondiments() { addLemon(); }
}
<span class="kw">public class</span> Coffee <span class="kw">extends</span> CaffeineBeverage {
    <span class="kw">protected void</span> brew()          { dripThroughFilter(); }
    <span class="kw">protected void</span> addCondiments() { addMilkAndSugar(); }
    <span class="kw">protected boolean</span> customerWantsCondiments() { <span class="kw">return</span> askCustomer(); }
}`} />
        <p>Note the access discipline (Day 1's modifiers earning rent): the template is <C>public final</C>;
          shared steps are <C>private</C>; the blanks are <C>protected</C> — visible to children, invisible to
          the world. Nobody outside can call <C>brew()</C> out of ceremony.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🍵 Play: The beverage machine</h2>
        <p>Switch drinks, toggle the hook, run the ceremony:</p>
        <BeverageMachine />
        <Good><strong>What you should notice:</strong> ① The parent lines are identical for both drinks; only
          the amber CHILD lines change. ② The hook makes a STEP optional without touching the skeleton —
          Coffee asks the customer; Tea keeps the default. ③ The child never calls anything — it is called.
          Hollywood.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The three kinds of methods (the whole pattern in one table)</h2>
        <table className="matrix">
          <thead>
            <tr><th>kind</th><th>modifier</th><th>subclass may…</th><th>example</th></tr>
          </thead>
          <tbody>
            <tr><td>template</td><td><C>public final</C></td><td className="no">touch NOTHING — it is the contract</td><td>prepareRecipe()</td></tr>
            <tr><td>concrete step</td><td><C>private</C> (or final)</td><td className="no">not override — shared invariants</td><td>boilWater()</td></tr>
            <tr><td>abstract step</td><td><C>protected abstract</C></td><td className="yes">MUST implement</td><td>brew()</td></tr>
            <tr><td>hook</td><td><C>protected</C> + default body</td><td className="yes">MAY override</td><td>customerWantsCondiments()</td></tr>
          </tbody>
        </table>
        <Warn><strong>Design pressure:</strong> every abstract step is a tax on ALL subclasses (Day 14's
          instinct). Keep MUSTs minimal, offer hooks where variation is merely plausible — and keep the
          template final, or the one guarantee you sell (the order) is gone.</Warn>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>📤 Play: The exporter factory floor</h2>
        <p>Two blanks, six combinations — and one rebellious subclass:</p>
        <ExporterBuilder />
        <Good><strong>What you should notice:</strong> ① The sensitive middle step (masking emails) is written
          once, privately — no subclass can skip or reorder it. ② Blanks multiply combinations without
          multiplying skeletons. ③ The rebellion fails at COMPILE time — final is the lock on the manual.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Template farms you already live in (and the lambda twist)</h2>
        <ul>
          <li><strong><C>HttpServlet</C>:</strong> <C>service()</C> parses and dispatches; you override
            <C> doGet()/doPost()</C>. THE classic.</li>
          <li><strong><C>AbstractList</C> / <C>AbstractMap</C>:</strong> implement <C>get()</C> + <C>size()</C> —
            inherit contains, indexOf, iterator, equals… an entire API generated from two blanks.</li>
          <li><strong>JUnit:</strong> the runner's fixed lifecycle calls your <C>@BeforeEach/@Test</C> methods —
            Hollywood with annotations.</li>
          <li><strong>java.io:</strong> <C>InputStream.read(byte[])</C> is a template looping over the one
            abstract <C>read()</C> you provide.</li>
        </ul>
        <Reveal summary="The TEMPLATE CALLBACK — how Spring rebuilt this pattern with lambdas. Click to reveal.">
          <p><C>jdbc.query(sql, (rs, n) -&gt; new Order(rs))</C>: the skeleton (get connection, execute, loop,
            close, translate exceptions) is a CLOSED method; the varying step arrives as a <strong>lambda
            parameter</strong> instead of a subclass override. Same guarantee, no inheritance — Template Method
            re-implemented with Strategy (Day 31) underneath. Modern Java leans this way; recognize both
            spellings.</p>
        </Reveal>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The showdown: Template Method vs Strategy</h2>
        <table className="matrix">
          <thead>
            <tr><th></th><th>📋 Template Method</th><th>🧠 Strategy (31)</th></tr>
          </thead>
          <tbody>
            <tr><td>mechanism</td><td>inheritance — override protected steps</td><td>composition — inject an object/lambda</td></tr>
            <tr><td>varies</td><td>1–2 STEPS inside a fixed skeleton</td><td>the WHOLE algorithm behind one interface</td></tr>
            <tr><td>chosen</td><td>at compile time (which subclass)</td><td>at runtime, swappable, per call if you like</td></tr>
            <tr><td>state sharing</td><td className="yes">parent fields, protected access — easy</td><td>passed explicitly — cleaner, more ceremony</td></tr>
            <tr><td>taxes</td><td className="no">single extends spent; fragile-base risk (Day 7)</td><td className="yes">none of those — the modern default</td></tr>
          </tbody>
        </table>
        <Note><strong>The honest guidance:</strong> reach for Strategy/composition first (Day 7's verdict).
          Accept Template Method gladly when a framework hands you a base class, or when the skeleton plus
          shared protected state genuinely belongs in a parent — TM is the <em>disciplined</em>, contract-shaped
          use of inheritance that keeps the fragile base at bay.</Note>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>💣 Play: The constructor trap</h2>
        <p>The most famous way Template Method thinking goes wrong — calling the blanks too early:</p>
        <ConstructorTrap />
        <Good><strong>What you should notice:</strong> ① Day 3's construction order plus Day 4's dynamic dispatch
          combine into a half-born object running child code. ② The fix is timing, not cleverness: templates
          start AFTER construction. ③ Quote the rule in interviews: "constructors call only final, private or
          static methods" — instant credibility.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — The non-final template</h3>
        <p>An overridable template = subclasses can rewrite the ceremony — and one day, one will. The pattern's
          entire product is the guaranteed order; <C>final</C> is its packaging.</p>
        <h3>Trap 2 — Too many blanks</h3>
        <p>Seven abstract steps = every subclass writes seven methods to make one drink. That is not a
          template; it is an interface with extra steps. Most algorithms have 1–2 genuinely varying points —
          find them (Day 12's "name what varies").</p>
        <h3>Trap 3 — Hooks doing load-bearing work</h3>
        <p>A "hook" that every subclass MUST override to avoid broken behavior is an abstract step in disguise —
          with the compiler's must-implement safety silently removed. Defaults must be genuinely safe.</p>
        <h3>Trap 4 — Skeleton and steps sharing mutable parent fields chaotically</h3>
        <p>Protected fields scribbled by steps and skeleton alike re-create the fragile base class (Day 7).
          Prefer passing data through step parameters/returns; keep protected state minimal and documented
          (<C>@implSpec</C> javadoc exists exactly for "which method calls what").</p>
        <h3>Trap 5 — Template Method where Strategy was due</h3>
        <p>Needing to change behavior at runtime, combine variants, or unit-test a step alone — and finding
          yourself subclass-locked. The table above is the checklist; switching later costs a hierarchy.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet — and the Week 7 graduation</h2>
        <ul>
          <li><strong>Intent:</strong> final skeleton in the parent; subclasses fill named blanks. Hollywood: the parent calls YOU.</li>
          <li><strong>Method kinds:</strong> template (public final) · concrete steps (private) · abstract steps (protected, MUST) · hooks (protected + default, MAY). Minimize MUSTs.</li>
          <li><strong>Rules:</strong> never call overridables from constructors · keep protected state lean (@implSpec) · final the template.</li>
          <li>Sightings: HttpServlet, AbstractList, JUnit, InputStream. Lambda twist: template CALLBACK (JdbcTemplate) = same skeleton, step as parameter.</li>
          <li>vs Strategy: steps-by-inheritance vs algorithm-by-composition — Strategy first, TM for frameworks & shared-state skeletons. Factory Method (22) = TM whose blank creates.</li>
        </ul>
        <table className="matrix">
          <thead>
            <tr><th>pattern</th><th>day</th><th>one-liner</th></tr>
          </thead>
          <tbody>
            <tr><td>🧠 Strategy</td><td>31</td><td>swap the interchangeable brain behind one interface</td></tr>
            <tr><td>📡 Observer</td><td>32</td><td>one announces; a runtime list of strangers reacts</td></tr>
            <tr><td>📄 Command</td><td>33</td><td>freeze a request into an object: queue, log, undo</td></tr>
            <tr><td>🚦 State</td><td>34</td><td>behavior changes as the lifecycle advances itself</td></tr>
            <tr><td>📋 Template Method</td><td>35</td><td>fixed skeleton calls subclass-filled blanks</td></tr>
          </tbody>
        </table>
        <p>Five answers to "how do objects ACT and TALK?" — next week finishes the GoF catalog: Chain of
          Responsibility, Iterator, Mediator, Memento, Visitor.</p>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Why are the step methods PROTECTED rather than public?">
          <p>So only the family can see the blanks: outsiders must enter through the public final template —
            nobody can call brew() without boiling water first. Access modifiers (Day 1) enforcing ceremony
            order: protected = "for overriding, not for calling."</p>
        </Reveal>
        <Reveal summary="Q: What is @implSpec and why does Template Method need it?">
          <p>The javadoc tag for SELF-USE documentation: "this method calls size() then get(i)…" — added in
            Java 8 for exactly this pattern. Effective Java demands it: subclass authors must know WHICH
            methods the skeleton calls, or they override blind and the fragile base bites (Day 7).</p>
        </Reveal>
        <Reveal summary="Q: Factory Method vs Template Method — relationship in one line?">
          <p>Factory Method IS a Template Method specialization: a skeleton whose deferred step happens to
            CREATE an object (createTransport() inside planDelivery(), Day 22). All factory methods are
            template steps; not all template steps are factories.</p>
        </Reveal>
        <Reveal summary="Q: Can default methods in INTERFACES express Template Method?">
          <p>Partially: a default method calling the interface's abstract methods is a mini-template
            (Comparator.thenComparing builds on compare). Missing: final (defaults can be re-overridden!),
            private state, and protected visibility — so interface templates can't LOCK the ceremony. Fine for
            conveniences; abstract classes for contracts.</p>
        </Reveal>
        <Reveal summary="Q: A deep-cut JDK example beyond servlets?">
          <p><C>AbstractQueuedSynchronizer</C> — the engine under ReentrantLock and friends: acquire() is a
            sophisticated final-ish skeleton (queueing, parking, fairness) that calls your tryAcquire()
            override. Doug Lea's masterpiece is a Template Method — naming it in an interview is a flex with
            substance (and a Month 4 preview).</p>
        </Reveal>
        <Reveal summary="Q: How do you TEST a template's subclass step in isolation?">
          <p>Three options: ① test through the template (integration-ish, often fine); ② widen the step to
            package-private and test directly (pragmatic); ③ if isolation pressure is high, that's the design
            telling you the step wants to be a STRATEGY — extract it. Test pain as an architecture signal
            (Day 15's lesson, again).</p>
        </Reveal>
        <Reveal summary="Q: GoF says Template Method and Strategy differ in 'granularity' — explain.">
          <p>TM varies PARTS of an algorithm while reusing its frame (fine-grained); Strategy varies the WHOLE
            algorithm as one unit (coarse-grained). Corollary: they nest — a template's step can delegate to an
            injected strategy, giving a fixed ceremony with runtime-swappable blanks. Best of both, common in
            real frameworks.</p>
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
        <strong>Day 35 complete — and Week 7 with it! 🏆</strong> Homework: the report pipeline.
        <C> abstract class ReportJob</C> with <C>public final run()</C> calling: <C>connect()</C> (private),
        <C> fetch()</C> (abstract), <C>summarize()</C> (private — counts rows), <C>deliver()</C> (abstract),
        and hook <C>notifyOnEmpty()</C> (default false). Subclasses: <C>SalesPdfJob</C> (DB fetch → PDF) and
        <C> InventoryEmailJob</C> (CSV fetch → email, overrides the hook to true). ① Prove the order is fixed —
        try overriding run() and read the compiler error aloud. ② Demonstrate the constructor trap: call
        fetch() from the abstract constructor, watch the NPE, then fix it. ③ Bonus: convert ONE subclass to the
        template-callback style — <C>run(Supplier&lt;Data&gt; fetch, Consumer&lt;Data&gt; deliver)</C> — and
        write a sentence on what you gained and lost.
        <br /><br />
        Next: <strong>Week 8 — Behavioral Patterns II</strong>, beginning with <strong>Day 36 — Chain of
        Responsibility</strong>: the request that walks down a line of handlers until one says "mine" — support
        tickets, middleware, and approval workflows, formalized.
      </div>
    </div>
  )
}
