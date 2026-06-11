import { useState, useRef } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The Buy-Now machine room (Facade) ============ */
const SUBSYSTEMS = [
  ['📦 InventoryService', 'reserve(cart)'],
  ['💳 PaymentGateway', 'charge(card, total)'],
  ['🚚 ShippingService', 'bookPickup(address)'],
  ['📧 EmailService', 'sendConfirmation(order)'],
]

function BuyNow() {
  const [world, setWorld] = useState('without')
  const [active, setActive] = useState(-1)
  const timers = useRef([])

  function run() {
    timers.current.forEach(clearTimeout)
    setActive(-1)
    timers.current = SUBSYSTEMS.map((_, i) => setTimeout(() => setActive(i), 350 * (i + 1)))
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one "Buy Now" click — who has to know the machine room?</div>
      <div className="modbtns">
        <button className={world === 'without' ? 'on' : ''} onClick={() => { setWorld('without'); setActive(-1) }}>😵 client does everything</button>
        <button className={world === 'facade' ? 'on' : ''} onClick={() => { setWorld('facade'); setActive(-1) }}>🛎️ through the facade</button>
      </div>
      <Code html={world === 'without'
        ? `<span class="cm">// inside CheckoutButton.onClick — the CLIENT knows all four machines:</span>
inventory.reserve(cart);                    <span class="cm">// import #1</span>
payment.charge(card, cart.total());        <span class="cm">// import #2 (and the right ORDER!)</span>
shipping.bookPickup(user.address());       <span class="cm">// import #3</span>
email.sendConfirmation(order);             <span class="cm">// import #4 — repeated in 3 other screens…</span>`
        : `<span class="cm">// inside CheckoutButton.onClick — the client knows ONE door:</span>
orderFacade.placeOrder(cart, card);

<span class="cm">// OrderFacade.java — the concierge, written ONCE:</span>
<span class="kw">public</span> Order placeOrder(Cart cart, Card card) {
    inventory.reserve(cart);
    payment.charge(card, cart.total());
    Shipment s = shipping.bookPickup(cart.owner().address());
    Order o = <span class="kw">new</span> Order(cart, s);
    email.sendConfirmation(o);
    <span class="kw">return</span> o;
}`} />
      <button className="act" onClick={run} style={{ marginBottom: 12 }}>🛒 Buy Now</button>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {world === 'facade' && (
          <div className="obj" style={{ minWidth: 170, borderColor: 'var(--blue)' }}>
            <div className="oref">🛎️ OrderFacade</div>
            <div className="ofield">placeOrder(cart, card)</div>
            <div className="ofield">the only door the client sees</div>
          </div>
        )}
        {SUBSYSTEMS.map(([name, op], i) => (
          <div className="obj" key={name} style={{ minWidth: 165, borderColor: active >= i ? 'var(--green)' : undefined, opacity: active >= i ? 1 : 0.55 }}>
            <div className="oref">{name}</div>
            <div className="ofield">{op}{active >= i ? ' ✓' : ''}</div>
          </div>
        ))}
      </div>
      <div className="statbar">
        {world === 'without'
          ? <span>😵 <span>The client imports <b>4 subsystem classes</b>, knows their call ORDER, and this block is copy-pasted into every screen that sells anything (mobile, admin, retry job…).</span></span>
          : <span>🛎️ <span>The client imports <b>1 class</b>. The choreography lives ONCE, in the facade — and the subsystems are still there, fully usable directly by power users who need them.</span></span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: The bodyguard (Proxy) ============ */
function Bodyguard() {
  const [loaded, setLoaded] = useState(false)
  const [log, setLog] = useState([])

  const add = (line) => setLog((l) => [...l.slice(-4), line])

  function preview() {
    add('proxy.preview() → answered from cached metadata: "Q3 Report, 142 pages" · 0 ms · real object NOT touched 🛡️')
  }
  function render() {
    if (!loaded) {
      setLoaded(true)
      add('proxy.render() → first call! creating RealReport… parsing 500 MB… 2300 ms 🐢 → forwarding render()')
    } else {
      add('proxy.render() → real already exists → forward → 3 ms ⚡')
    }
  }
  function del() {
    add('intern calls proxy.delete() → role check: INTERN ✋ AccessDeniedException — the real object never even heard about it')
  }
  function reset() { setLoaded(false); setLog([]) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the 500 MB report and its bodyguard</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={preview}>preview()</button>
        <button className="act" onClick={render}>render()</button>
        <button className="ghost act" onClick={del}>😈 intern: delete()</button>
        <button className="ghost act" onClick={reset}>new ReportProxy() (reset)</button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="obj" style={{ minWidth: 230, borderColor: 'var(--blue)' }}>
          <div className="oref">proxy → ReportProxy@a1 (created in 0 ms)</div>
          <div className="ofield">implements Report ✓ (same interface)</div>
          <div className="ofield">metadata = "Q3 Report, 142 pages" (cached)</div>
          <div className="ofield">real → {loaded ? 'RealReport@b2' : 'null  ← nothing loaded yet'}</div>
        </div>
        {loaded && (
          <div className="obj" style={{ minWidth: 200 }}>
            <div className="oref">RealReport@b2</div>
            <div className="ofield">500 MB parsed in memory</div>
            <div className="ofield">created ONLY when truly needed</div>
          </div>
        )}
      </div>
      <div className="statbar" style={{ display: 'block', marginTop: 10 }}>
        {log.length === 0
          ? <span>👆 Try preview() and delete() FIRST — see how much the bodyguard handles without ever waking the star.</span>
          : log.map((l, i) => <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{l}</div>)}
      </div>
    </div>
  )
}

/* ============ Interactive 3: The wrapper graduation exam ============ */
const EXAM_ITEMS = [
  { d: 'Spring sees @Transactional on your service and hands clients a generated class that opens a transaction, calls your method, then commits/rolls back.',
    a: 'proxy', why: 'Same interface, invisible to the caller, CONTROLS how/when the real call happens (wrapping it in transaction management). Spring AOP is dynamic proxies industrialized.' },
  { d: 'JdbcTemplate.query(sql, mapper) — one call replacing the open-connection / create-statement / execute / loop-resultset / close-everything ritual of raw JDBC.',
    a: 'facade', why: 'Nothing translated, nothing intercepted — a whole SUBSYSTEM\'s ceremony condensed into one friendly door. (Raw JDBC remains available beneath it.)' },
  { d: 'Collections.unmodifiableList(list) — same List interface back, but writes now throw.',
    a: 'decorator', why: 'Same interface, one wrapped object, behavior modified (write ability removed) — Day 27\'s Collections wrapper family.' },
  { d: 'new InputStreamReader(socketStream, UTF_8) — bytes go in one side, chars come out the other.',
    a: 'adapter', why: 'The INTERFACE changes (InputStream → Reader) with real translation inside (charset decoding) — Day 26\'s canonical example.' },
  { d: 'A Hibernate query returns an Order whose customer field is a generated stand-in; the SQL for the customer runs only if you call order.getCustomer().getName().',
    a: 'proxy', why: 'Virtual proxy: same Customer interface, real object fetched lazily on first real use. (And the famous LazyInitializationException is this proxy outliving its session.)' },
  { d: 'panel.add(button); frame.add(panel); — and frame.repaint() redraws everything inside, however deep.',
    a: 'composite', why: 'Containers holding Components (including other Containers), with operations propagating down the tree — Day 28, in the UI toolkit where GoF found it.' },
]
const EXAM_CHOICES = [['adapter', '🧩 Adapter'], ['decorator', '🎁 Decorator'], ['facade', '🛎️ Facade'], ['proxy', '🛡️ Proxy'], ['composite', '🌳 Composite']]

function WrapperExam() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= EXAM_ITEMS.length
  const cur = EXAM_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the structural graduation exam — real Java, name the pattern</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {EXAM_ITEMS.length}</b>{score === EXAM_ITEMS.length ? ' — you can read framework internals now.' : '. Re-read the family table — intent is the differentiator, never the shape.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            🎓 <span>case {idx + 1} of {EXAM_ITEMS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.d}</p>
          <div className="modbtns">
            {EXAM_CHOICES.map(([k, label]) => (
              <button key={k} className={picked !== null && k === cur.a ? 'on' : ''}
                style={picked !== null && picked === k && k !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
                onClick={() => pick(k)}>
                {label}
              </button>
            ))}
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
  { q: 'The Facade pattern\'s intent is…',
    o: ['To control access to one object', 'To provide ONE unified, simplified interface to a whole SUBSYSTEM of classes — an easy door, not a locked one', 'To convert interfaces', 'To stack behaviors'], a: 1,
    e: 'A facade condenses a multi-class ritual into a friendly entry point. Crucially it does not forbid direct subsystem access — it just makes the common path easy.',
    w: { 0: 'Controlling access to ONE object is Proxy — today\'s second act.',
         2: 'Interface conversion is Adapter (26).',
         3: 'Stacking behaviors is Decorator (27).' },
    r: { id: 's3', label: 'Section 3 — facade structure & rules' } },
  { q: 'How much LOGIC may a healthy facade contain?',
    o: ['All the business rules of the subsystem', 'Thin orchestration only: call order, wiring results between subsystem calls — the real work stays in the subsystem classes', 'None — it must be empty', 'Database access only'], a: 1,
    e: 'The concierge BOOKS the tour; he doesn\'t drive the bus. A facade that starts computing discounts and validating inventory is becoming a god object wearing a nice name.',
    w: { 0: 'Absorbing the rules creates the god class (Day 11) with a pattern\'s blessing.',
         2: 'Zero logic = zero value; sequencing IS its job.',
         3: 'Persistence belongs in the subsystem it fronts.' },
    r: { id: 's5', label: 'Section 5 — the god-facade trap' } },
  { q: 'Facade vs Adapter in one line?',
    o: ['Identical', 'Adapter makes something fit an interface CLIENTS ALREADY EXPECT (translation, usually 1-to-1); Facade invents a NEW, simpler interface over MANY classes (simplification)', 'Facade is for files only', 'Adapter is newer'], a: 1,
    e: 'Different problems: "wrong shape" → adapter; "too many knobs" → facade. One translates, the other condenses.',
    w: { 0: 'Different intent, different cardinality.',
         2: 'Files are irrelevant.',
         3: 'Same 1994 book.' },
    r: { id: 's5', label: 'Section 5 — facade boundaries' } },
  { q: 'The Proxy pattern\'s intent is…',
    o: ['To simplify many classes', 'To provide a SURROGATE with the SAME interface that CONTROLS access to the real object — guarding, delaying, caching, or remoting it', 'To add condiments', 'To copy objects'], a: 1,
    e: 'The bodyguard: clients think they\'re talking to the star. The proxy decides if (protection), when (virtual/lazy), and at what cost (cache, remote) the real object gets involved.',
    w: { 0: 'Simplifying many is Facade — this morning\'s pattern.',
         2: 'Adding powers knowingly is Decorator.',
         3: 'Copying is Prototype (25).' },
    r: { id: 's6', label: 'Section 6 — proxy intent & kinds' } },
  { q: 'A VIRTUAL proxy earns its keep by…',
    o: ['Encrypting calls', 'Deferring creation of an expensive real object until a call truly needs it — answering cheap questions (metadata, previews) from its own cache meanwhile', 'Making more instances', 'Running faster bytecode'], a: 1,
    e: 'The app "opened" the 500 MB report in 0 ms because only the proxy existed. Hibernate\'s lazy entities and image placeholders work exactly this way.',
    w: { 0: 'Encryption isn\'t the job (a protection proxy guards by AUTHORIZATION, not crypto).',
         2: 'Fewer/later real instances is the point.',
         3: 'Bytecode is unchanged.' },
    r: { id: 's8', label: 'Section 8 — the bodyguard demo' } },
  { q: 'Proxy vs Decorator — same interface, both wrap. The deepest differences?',
    o: ['None', 'Decorator ADDS features, client stacks them knowingly, always delegates inward; Proxy CONTROLS access, is usually invisible to the client, may answer or REFUSE without ever calling the real object — and often manages the real object\'s lifecycle itself', 'Proxies are compile-time only', 'Decorators need reflection'], a: 1,
    e: 'A decorator never says no — it enriches and forwards. A proxy can deny (AccessDenied), substitute (cache hit), or delay (lazy) — the real call is at ITS discretion. Also: clients pick decorators; infrastructure installs proxies.',
    w: { 0: 'GoF separates them by intent — and interviews live on this question.',
         2: 'Both are runtime objects (proxies often GENERATED at runtime!).',
         3: 'Reflection is the proxy\'s trick (java.lang.reflect.Proxy), not the decorator\'s.' },
    r: { id: 's10', label: 'Section 10 — the family table' } },
  { q: 'The famous Spring @Transactional self-invocation trap is…',
    o: ['Transactions are slow', 'this.otherMethod() inside the same class BYPASSES the proxy — the transaction advice lives on the wrapper, and internal calls never cross it, so @Transactional silently does nothing', 'Spring forbids two transactions', 'A compiler error'], a: 1,
    e: 'Clients hold the proxy; but inside the real object, this IS the real object. Internal calls skip the bodyguard entirely. Fixes: split the class, inject yourself, or use the surrounding method\'s transaction.',
    w: { 0: 'Speed is not the trap.',
         2: 'Nested transactions are configurable.',
         3: 'It compiles — and fails SILENTLY, which is why it\'s famous.' },
    r: { id: 's9', label: 'Section 9 — proxies in the wild' } },
  { q: 'Hibernate throws LazyInitializationException when…',
    o: ['SQL has a typo', 'You touch a lazy proxy AFTER its session closed — the stand-in finally needs to fetch, but the database connection that could do it is gone', 'The entity has no id', 'Too many rows return'], a: 1,
    e: 'The virtual proxy deferred the query; the session (its lifeline to the DB) ended; first real access then has no way to load. The exception IS the proxy pattern\'s deferred cost arriving late — understanding that makes the fix (fetch eagerly, or extend scope) obvious.',
    w: { 0: 'SQL never ran — that\'s the point.',
         2: 'Ids are fine.',
         3: 'No rows were fetched at all.' },
    r: { id: 's9', label: 'Section 9 — lazy-loading\'s bill' } },
]

/* ============ The page ============ */
export default function Day29() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 6 · Day 29 · Structural Patterns · Double Bill</div>
        <h1>Facade &amp; Proxy:<br />The Concierge and the Bodyguard</h1>
        <p>Two patterns that both "stand in front of" other code — with opposite job descriptions. The
           concierge makes a complicated hotel SIMPLE for you. The bodyguard decides whether you reach the
           star at all. Learn both, and you can read Spring's source code. Click everything.</p>
        <div className="chips">
          {['facade', 'proxy', 'one simple door', 'virtual / protection / caching', '@Transactional', 'lazy loading'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Two people standing in front</h2>
        <Code html={`   🛎️ THE CONCIERGE (Facade)                  🛡️ THE BODYGUARD (Proxy)

   you: "book me a city tour"                you: "Mr. Star, sign this!"
   he calls: tour operator, taxi,            the guard — wearing the star's badge —
   ticket office, restaurant…                decides: deny you (protection),
   ONE simple request → FOUR                 answer himself (cache), or wake the
   subsystems choreographed                  star only if truly needed (lazy)

   simplifies MANY classes                   controls access to ONE object
   new, easier interface                     the SAME interface as the real thing
   you know he's a middleman                 you may never know he exists`} />
        <Note><strong>Today's two intents:</strong> <strong>Facade</strong> — one unified, simplified interface
          to a whole subsystem (an easy door, never a locked one). <strong>Proxy</strong> — a surrogate with the
          <em> same</em> interface that controls access to the real object: guarding, delaying, caching,
          or remoting it.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Facade's crime scene: the client who knows too much</h2>
        <p>"Buy Now" sounds like one action. Behind it: reserve stock, charge the card, book the courier, email
          the receipt — four services, in a specific order, with results threaded between them. Without a
          facade, that choreography lives in the CLIENT — and then in every other client that sells anything:
          web checkout, mobile checkout, admin manual-order screen, the retry job…</p>
        <p>Count the damage in Day-17 terms: every screen is coupled to four subsystems (fan-out ×4), and the
          ordering knowledge is duplicated per screen (DRY, Day 16). Change "email before shipping" → shotgun
          surgery across every checkout.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The facade (almost embarrassingly simple)</h2>
        <Code html={`<span class="kw">public class</span> OrderFacade {
    <span class="kw">private final</span> InventoryService inventory;   <span class="cm">// the subsystems, injected (Day 15)</span>
    <span class="kw">private final</span> PaymentGateway payment;
    <span class="kw">private final</span> ShippingService shipping;
    <span class="kw">private final</span> EmailService email;

    <span class="cm">// the ONE door — pure orchestration, no business math:</span>
    <span class="kw">public</span> Order placeOrder(Cart cart, Card card) {
        inventory.reserve(cart);
        payment.charge(card, cart.total());
        Shipment s = shipping.bookPickup(cart.owner().address());
        Order o = <span class="kw">new</span> Order(cart, s);
        email.sendConfirmation(o);
        <span class="kw">return</span> o;
    }
}`} />
        <p>Three house rules keep it healthy:</p>
        <ul>
          <li><strong>Thin:</strong> sequencing and wiring only — the WORK stays in the subsystems. (The concierge
            books the bus; he doesn't drive it.)</li>
          <li><strong>Non-exclusive:</strong> the subsystems stay public. Power users with unusual needs go
            direct; the facade serves the common 90%.</li>
          <li><strong>Layer boundary:</strong> a facade is the natural "front door of a module" — the rest of the
            app talks to <C>billing.BillingFacade</C>, not to billing's seventeen internals (coupling cut at the
            package level, Day 17).</li>
        </ul>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🛎️ Play: Buy Now, two ways</h2>
        <p>Press Buy Now in both worlds — the same four machines run either way. Watch what the CLIENT has to
          know.</p>
        <BuyNow />
        <Good><strong>What you should notice:</strong> ① The machine room is identical in both worlds — facade
          changes who KNOWS about it, not what happens. ② Client imports drop 4 → 1, and the call-order
          knowledge now exists exactly once. ③ The facade card sits in FRONT of the subsystems, not instead of
          them.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Facades in the wild — and the one way they go bad</h2>
        <ul>
          <li><C>Files.newBufferedReader(path)</C> — the JDK's apology for Day 27's wrapper soup: one call
            performing the open-decode-buffer ritual.</li>
          <li>Spring's <C>JdbcTemplate</C> — raw JDBC is 8 steps of ceremony with try-finally everywhere;
            <C> template.query(sql, mapper)</C> is the door.</li>
          <li>Every SDK's "client" object (<C>S3Client</C>, <C>StripeClient</C>) — facades over HTTP, auth,
            retries, serialization.</li>
        </ul>
        <Warn><strong>The god-facade trap:</strong> orchestration creep. First placeOrder, then "just a little"
          discount logic, then inventory rules… two years later OrderFacade is the god class (Day 11) every
          team fears. The discipline: a facade DELEGATES every decision; the moment it makes business decisions,
          extract them down into the subsystem.</Warn>
        <Reveal summary="Facade vs Mediator (Week 8 preview) — click to reveal.">
          <p>Both reduce coupling among many classes. Direction differs: a facade is ONE-WAY simplification for
            OUTSIDERS (subsystem classes don't know the facade exists). A Mediator coordinates colleagues that
            talk to each other THROUGH it (they know it, both directions). Concierge vs air-traffic controller.</p>
        </Reveal>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Enter the bodyguard: Proxy's intent and its five day-jobs</h2>
        <table className="matrix">
          <thead>
            <tr><th>kind</th><th>controls…</th><th>everyday example</th></tr>
          </thead>
          <tbody>
            <tr><td>🐢 virtual</td><td>WHEN the expensive real object is created</td><td>Hibernate lazy entities, image placeholders</td></tr>
            <tr><td>🚫 protection</td><td>WHO may call what</td><td>role checks before admin operations</td></tr>
            <tr><td>⚡ caching</td><td>WHETHER the real call happens at all</td><td>memoized results, HTTP caches</td></tr>
            <tr><td>🌐 remote</td><td>WHERE the real object lives</td><td>RMI/gRPC stubs — a local stand-in for a server object</td></tr>
            <tr><td>📋 logging/metrics</td><td>WHAT we learn about each call</td><td>timing wrappers, audit trails</td></tr>
          </tbody>
        </table>
        <p>One structure serves all five: <C>implements Subject</C> + a reference to (or recipe for) the real
          subject + a decision before/instead of forwarding. The non-negotiable: <strong>same interface</strong>
          — that's what makes the stand-in undetectable.</p>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The proxy in Java (lazy + guard in 25 lines)</h2>
        <Code html={`<span class="kw">public interface</span> Report {
    String preview();
    <span class="kw">void</span> render();
    <span class="kw">void</span> delete();
}

<span class="kw">public class</span> RealReport <span class="kw">implements</span> Report {
    <span class="kw">public</span> RealReport(Path file) { <span class="cm">/* parse 500 MB… 2.3s 🐢 */</span> }
    <span class="cm">/* the real work lives here */</span>
}

<span class="kw">public class</span> ReportProxy <span class="kw">implements</span> Report {     <span class="cm">// same interface — undetectable</span>
    <span class="kw">private final</span> Path file;
    <span class="kw">private final</span> String cachedMeta;             <span class="cm">// cheap facts, kept locally</span>
    <span class="kw">private final</span> User caller;
    <span class="kw">private</span> RealReport real;                     <span class="cm">// null until truly needed</span>

    <span class="kw">public</span> String preview() {
        <span class="kw">return</span> cachedMeta;                       <span class="cm">// ⚡ CACHING: never wakes the star</span>
    }
    <span class="kw">public void</span> render() {
        <span class="kw">if</span> (real == <span class="kw">null</span>) real = <span class="kw">new</span> RealReport(file);  <span class="cm">// 🐢 VIRTUAL: created on demand</span>
        real.render();                                     <span class="cm">// then forward</span>
    }
    <span class="kw">public void</span> delete() {
        <span class="kw">if</span> (!caller.isAdmin()) <span class="kw">throw new</span> AccessDeniedException();  <span class="cm">// 🚫 PROTECTION</span>
        <span class="kw">if</span> (real == <span class="kw">null</span>) real = <span class="kw">new</span> RealReport(file);
        real.delete();
    }
}`} />
        <p>Note what a decorator would never do: <C>preview()</C> answers WITHOUT delegating, and
          <C> delete()</C> can refuse outright. The proxy owns the relationship with the real object — including
          its very existence (<C>real == null</C>). That lifecycle ownership is the deepest structural
          difference from Day 27.</p>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🛡️ Play: The bodyguard at work</h2>
        <p>Open the report app — and note the order: try <C>preview()</C> and the intern's <C>delete()</C>
          BEFORE ever calling <C>render()</C>.</p>
        <Bodyguard />
        <Good><strong>What you should notice:</strong> ① The proxy was "the report" for two whole operations
          while the 500 MB object didn't exist — that's virtual + caching. ② The intern was refused without the
          real object hearing a whisper — protection means the guarded thing never even wakes. ③ Second
          render() is instant: the proxy remembers. One small class, three of the five day-jobs.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Proxies run the Java world (and two famous bites)</h2>
        <ul>
          <li><strong>Spring AOP:</strong> <C>@Transactional</C>, <C>@Cacheable</C>, <C>@Async</C> — Spring hands
            your clients a GENERATED proxy that wraps each call with the advice. You annotated a method;
            a bodyguard was hired.</li>
          <li><strong>Hibernate/JPA:</strong> lazy relations return proxies; SQL runs at first real access
            (virtual proxy verbatim).</li>
          <li><strong>java.lang.reflect.Proxy:</strong> the JDK will fabricate a proxy class for any interface
            at runtime — one <C>InvocationHandler</C> receives every call. (Interface required; libraries like
            CGLIB/ByteBuddy subclass concrete classes instead — that's how Spring proxies class types.)</li>
        </ul>
        <Warn><strong>Bite #1 — self-invocation:</strong> inside the real object, <C>this.otherMethod()</C>
          never crosses the proxy — internal calls bypass the bodyguard, so a nested <C>@Transactional</C>
          silently doesn't apply. <strong>Bite #2 — the deferred bill:</strong> touch a lazy proxy after its
          session is gone → <C>LazyInitializationException</C>. Both bites are the SAME lesson: a proxy is a
          separate object with its own lifecycle — invisible until the day it isn't.</Warn>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10 · Interactive</div>
        <h2>🎓 The wrapper family — graduation exam</h2>
        <p>All five structural shapes you now own, told apart by INTENT:</p>
        <table className="matrix">
          <thead>
            <tr><th>pattern</th><th>interface</th><th>wraps</th><th>job</th></tr>
          </thead>
          <tbody>
            <tr><td>🧩 Adapter (26)</td><td>DIFFERENT</td><td>one</td><td>translate shapes</td></tr>
            <tr><td>🎁 Decorator (27)</td><td>same</td><td>one (stackable)</td><td>add powers, client chooses</td></tr>
            <tr><td>🌳 Composite (28)</td><td>same</td><td>MANY children</td><td>trees act like single objects</td></tr>
            <tr><td>🛎️ Facade (29)</td><td>new & simpler</td><td>a subsystem</td><td>one easy door</td></tr>
            <tr><td>🛡️ Proxy (29)</td><td>same</td><td>one (controls it)</td><td>guard/delay/cache access</td></tr>
          </tbody>
        </table>
        <WrapperExam />
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Facade:</strong> one simplified door to a SUBSYSTEM. Thin orchestration · non-exclusive · natural module boundary. Sightings: Files.newBufferedReader, JdbcTemplate, SDK clients. Trap: orchestration creep → god facade.</li>
          <li><strong>Proxy:</strong> same-interface surrogate CONTROLLING access to one object. Five jobs: virtual (when created) · protection (who) · caching (whether) · remote (where) · logging (what we learn). May answer or refuse WITHOUT delegating; often owns the real object’s lifecycle.</li>
          <li><strong>vs Decorator:</strong> decorator enriches and always forwards, client stacks knowingly; proxy decides, often invisible, installed by infrastructure.</li>
          <li>Java reality: Spring AOP (@Transactional = generated proxy; self-invocation bypasses it!) · Hibernate lazy proxies (LazyInitializationException = the deferred bill) · java.lang.reflect.Proxy + InvocationHandler (interfaces) / CGLIB (classes).</li>
          <li>The five wrappers differ by INTENT — the graduation table above is the interview answer key.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Does Facade reduce coupling or just relocate it?">
          <p>Genuinely reduces: N clients × M subsystems = N×M edges become N + M (clients→facade,
            facade→subsystems) — Day 17 blast-radius math. The choreography knowledge also deduplicates from N
            copies to 1. What it does NOT do is decouple the subsystems from each other — that's Mediator's
            job.</p>
        </Reveal>
        <Reveal summary="Q: Should a facade EXPOSE subsystem types in its signatures?">
          <p>Ideally no — returning a raw <C>Shipment</C> from the shipping subsystem re-couples clients to it
            (the leaky-facade smell, cousin of Day 26's leaky adapter). Return your own simple results
            (OrderResult). Pragmatic exception: domain types shared across the whole app are fine; internal
            machinery types are not.</p>
        </Reveal>
        <Reveal summary="Q: Write a dynamic proxy by hand — what are the two ingredients?">
          <p><C>Proxy.newProxyInstance(loader, new Class[]{'{'} Report.class {'}'}, handler)</C> + an
            <C> InvocationHandler</C> whose single <C>invoke(proxy, method, args)</C> receives EVERY call —
            log/guard/route there, then <C>method.invoke(real, args)</C>. Limit: interfaces only (JDK proxies
            extend Proxy, and Java is single-inheritance — hence CGLIB subclassing for classes, and why Spring
            warns on final methods).</p>
        </Reveal>
        <Reveal summary="Q: Fixes for the @Transactional self-invocation trap?">
          <p>① Move the transactional method to ANOTHER bean (calls cross the proxy boundary again — the clean
            fix). ② Inject the bean into itself and call through the injected reference. ③ Let the OUTER method
            carry the annotation. Naming the trap AND a clean fix is a senior-level Spring answer.</p>
        </Reveal>
        <Reveal summary="Q: Proxy and equals/== — what breaks?">
          <p>Day 27’s identity trap, intensified: proxy != real, and a generated proxy’s getClass() is a weird
            synthetic class. Hibernate entities famously need equals() based on business id, NOT getClass()
            comparison (proxy class ≠ entity class!) — instanceof works, getClass() == fails. A real-world bug
            farm.</p>
        </Reveal>
        <Reveal summary="Q: API Gateway, CDN, reverse proxy — same pattern?">
          <p>Conceptually yes — the pattern at network scale: same interface (HTTP), controlling access
            (auth = protection), caching (CDN = caching proxy), hiding location (remote). Even the names match.
            Drawing that line shows you think in patterns above the class level.</p>
        </Reveal>
        <Reveal summary="Q: Could one class be facade AND proxy at once?">
          <p>Sure — a module front door that also rate-limits and authorizes is facade (simplify many) wearing
            proxy duties (control access). Patterns compose; names describe INTENTS, and one class may carry
            two. The skill is naming which lines of it serve which intent.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s12">
        <div className="sec-label">Section 12 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 29 complete?</strong> Homework, both halves: ① FACADE — build <C>TripFacade.bookTrip(from,
        to, date)</C> orchestrating <C>FlightService</C>, <C>HotelService</C>, <C>CabService</C> (each a tiny
        class printing what it does); then write the same booking WITHOUT the facade in main and count the
        lines + imports you saved. ② PROXY — build <C>VideoProxy implements Video</C> over a
        <C> RealVideo</C> whose constructor sleeps 2 seconds: title() from cached metadata, play() lazy-creates,
        download() throws unless <C>user.isPremium()</C>. Time both paths with
        <C> System.currentTimeMillis()</C> and print the receipts. ③ One sentence: which of the two could Spring
        generate FOR you, and why that one?
        <br /><br />
        Next: <strong>Day 30 — Flyweight &amp; Bridge</strong>: the Week 6 finale — sharing the heavy parts so a
        million objects fit in memory, and splitting hierarchies so they stop multiplying each other.
      </div>
    </div>
  )
}
