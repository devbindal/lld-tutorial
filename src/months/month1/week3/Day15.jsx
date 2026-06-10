import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The arrow flipper ============ */
function ArrowFlipper() {
  const [world, setWorld] = useState('naive')
  const [swapped, setSwapped] = useState(false)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the boss says: "we're moving from MySQL to Mongo!"</div>
      <div className="modbtns">
        <button className={world === 'naive' ? 'on' : ''} onClick={() => { setWorld('naive'); setSwapped(false) }}>😱 naive arrows</button>
        <button className={world === 'dip' ? 'on' : ''} onClick={() => { setWorld('dip'); setSwapped(false) }}>🔌 inverted arrows</button>
      </div>
      <button className="act" onClick={() => setSwapped(true)} style={{ marginBottom: 12 }} disabled={swapped}>
        📣 swap the database!
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <div className="obj" style={{ minWidth: 280, borderColor: world === 'naive' && swapped ? 'var(--red)' : undefined }}>
          <div className="oref">class OrderService  (HIGH level — business policy)</div>
          {world === 'naive' ? (
            <div className="ofield" style={swapped ? { background: '#FFE0DE', borderRadius: 5 } : {}}>
              private {swapped ? 'MongoDatabase db = new MongoDatabase();' : 'MySqlDatabase db = new MySqlDatabase();'}
              {swapped && ' ← EDITED! 💥'}
            </div>
          ) : (
            <div className="ofield">private OrderStore store;  // just the interface — knows no vendor</div>
          )}
          <div className="ofield">placeOrder() {'{'} …rules… {world === 'naive' ? 'db' : 'store'}.save(order); {'}'}</div>
          {world === 'dip' && swapped && (
            <div className="ofield" style={{ color: 'var(--green)' }}>✏️ edits during the swap: 0 🔒</div>
          )}
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: '#7c8aa5', paddingLeft: 30 }}>
          {world === 'naive' ? '│ depends on ▼  (policy is hostage to the detail)' : '│ depends on ▼'}
        </div>
        {world === 'dip' && (
          <>
            <div className="class-card" style={{ minWidth: 240 }}>
              <div className="cname">«interface» OrderStore</div>
              void save(Order o);  <span style={{ color: '#2E9E6B' }}>← owned by the POLICY side</span>
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: '#7c8aa5', paddingLeft: 30 }}>
              ▲ implements  (the detail looks UP at the abstraction)
            </div>
          </>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="obj" style={{ minWidth: 200, opacity: world === 'naive' && swapped ? 0.4 : 1 }}>
            <div className="oref">class MySqlDatabase  (LOW level — detail)</div>
            <div className="ofield">{world === 'dip' ? 'implements OrderStore' : 'vendor SQL stuff'}</div>
          </div>
          {swapped && (
            <div className="obj" style={{ minWidth: 200, borderColor: 'var(--blue)' }}>
              <div className="oref">class MongoDatabase {world === 'dip' ? ' 🆕' : ''}</div>
              <div className="ofield">{world === 'dip' ? 'implements OrderStore  ← just a NEW file' : 'different API → forced the edit above'}</div>
            </div>
          )}
        </div>
      </div>
      <div className="statbar">
        {world === 'naive'
          ? (swapped
            ? <span>💥 <span>The business-rules class was EDITED because a storage vendor changed. The most important code in the app bowed to the least important.</span></span>
            : <span>⬇️ <span>The arrow points from policy down to a concrete vendor class. Press the swap and see who pays.</span></span>)
          : (swapped
            ? <span>🔌 <span>New cartridge, sealed console (Day 12 déjà vu) — the policy never heard about the migration.</span></span>
            : <span>🔁 <span>Both classes now point at the interface in the middle. Press the swap — predict who changes.</span></span>)}
      </div>
    </div>
  )
}

/* ============ Interactive 2: The test bench ============ */
function TestBench() {
  const [world, setWorld] = useState('naive')
  const [ran, setRan] = useState(false)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · try to unit-test the business rules</div>
      <div className="modbtns">
        <button className={world === 'naive' ? 'on' : ''} onClick={() => { setWorld('naive'); setRan(false) }}>😱 naive world</button>
        <button className={world === 'dip' ? 'on' : ''} onClick={() => { setWorld('dip'); setRan(false) }}>🔌 DIP world</button>
      </div>
      <Code html={world === 'naive'
        ? `<span class="cm">// the test wants to check ONE business rule…</span>
@Test <span class="kw">void</span> rejectsEmptyOrders() {
    OrderService s = <span class="kw">new</span> OrderService();   <span class="cm">// …but the constructor
                                            //    news up a REAL MySqlDatabase 😬</span>
    s.placeOrder(emptyOrder);
}`
        : `<span class="cm">// the fake is 5 lines, lives in the test folder:</span>
<span class="kw">class</span> FakeStore <span class="kw">implements</span> OrderStore {
    List&lt;Order&gt; saved = <span class="kw">new</span> ArrayList&lt;&gt;();
    <span class="kw">public void</span> save(Order o) { saved.add(o); }
}

@Test <span class="kw">void</span> rejectsEmptyOrders() {
    OrderService s = <span class="kw">new</span> OrderService(<span class="kw">new</span> FakeStore());  <span class="cm">// plug in the fake 🔌</span>
    s.placeOrder(emptyOrder);
}`} />
      <button className="act" onClick={() => setRan(true)} style={{ marginBottom: 10 }}>▶ run the test</button>
      {ran && (
        <div className="statbar" style={{ display: 'block', background: world === 'naive' ? '#FDECEC' : '#EAF7EF' }}>
          <pre style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre-wrap', margin: 0 }}>
            {world === 'naive'
              ? `Connecting to MySQL at prod-db:3306 …
❌ SQLException: Connection refused
   TEST FAILED after 30.0s — and your business rule was never even reached.
   (To test one if-statement you now need a database server. 🤡)`
              : `FakeStore ready (0 ms)
placeOrder(emptyOrder) → rejected ✓
✅ 1 test passed in 0.01s — pure business logic, zero infrastructure.`}
          </pre>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: The plug board (composition root) ============ */
const STORES = { InMemoryStore: 'kept in a HashMap (great for demos)', MySqlStore: 'saved to MySQL', MongoStore: 'saved to MongoDB' }
const NOTIFIERS = { EmailNotifier: '📧 email sent', SmsNotifier: '📱 SMS sent', PushNotifier: '🔔 push sent' }

function PlugBoard() {
  const [store, setStore] = useState('InMemoryStore')
  const [notifier, setNotifier] = useState('EmailNotifier')
  const [booted, setBooted] = useState(false)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · main() is the plug board — wire the app, boot it</div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 4 }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>PICK AN OrderStore</div>
          <div className="modbtns">
            {Object.keys(STORES).map((s) => (
              <button key={s} className={store === s ? 'on' : ''} onClick={() => { setStore(s); setBooted(false) }}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>PICK A Notifier</div>
          <div className="modbtns">
            {Object.keys(NOTIFIERS).map((n) => (
              <button key={n} className={notifier === n ? 'on' : ''} onClick={() => { setNotifier(n); setBooted(false) }}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      <Code html={`<span class="cm">// the composition root — the ONE place that knows concrete names:</span>
<span class="kw">public static void</span> main(String[] args) {
    OrderStore store    = <span class="kw">new</span> ${store}();
    Notifier   notifier = <span class="kw">new</span> ${notifier}();
    OrderService app    = <span class="kw">new</span> OrderService(store, notifier);  <span class="cm">// inject!</span>
    app.placeOrder(order42);
}`} />
      <button className="act" onClick={() => setBooted(true)} style={{ marginBottom: 10 }}>🚀 boot the app</button>
      {booted && (
        <div className="statbar" style={{ display: 'block' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
            placeOrder(#42) → rules checked ✓ → {STORES[store]} → {NOTIFIERS[notifier]}
          </div>
          <div style={{ marginTop: 6 }}>
            🔒 <b>OrderService.java edits across all 9 wirings: 0.</b> Only main() — the plug board — knows which
            plugs are in.
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Dependency Inversion Principle has two clauses. They are…',
    o: ['Use frameworks; avoid main()', 'High-level modules should not depend on low-level modules — both depend on abstractions; and abstractions should not depend on details — details depend on abstractions', 'Never use new; never use static', 'All classes need interfaces; all interfaces need factories'], a: 1,
    e: 'Both halves matter: policy and detail meet at an interface, and the interface bends toward the POLICY (it expresses what the business needs, not what the vendor offers).',
    w: { 0: 'Frameworks and main() are implementation choices — not the principle.',
         2: '"Never new/static" are crude bans; DIP is about dependency DIRECTION.',
         3: 'Blanket interfaces/factories = speculative generality, not DIP.' },
    r: { id: 's1', label: 'Section 1 — the wall socket' } },
  { q: '"High-level" vs "low-level" modules means…',
    o: ['Top vs bottom of the file', 'Business policy/rules (valuable, stable) vs mechanisms like DB, email, files (replaceable details)', 'Public vs private classes', 'Fast vs slow code'], a: 1,
    e: 'High-level = WHAT your app does (pricing rules, order flow). Low-level = HOW bytes move (MySQL, SMTP, file system). DIP says the WHAT must never bow to the HOW.',
    w: { 0: 'File position means nothing — it\'s an importance/stability axis.',
         2: 'Visibility is Day 1 vocabulary, unrelated.',
         3: 'Performance is not the axis either.' },
    r: { id: 's2', label: 'Section 2 — policy vs detail' } },
  { q: 'What exactly gets "inverted" in dependency inversion?',
    o: ['The class names', 'The direction of the source-code arrow: instead of policy → detail, the detail now points UP at an abstraction owned by the policy side', 'The order of method parameters', 'The inheritance hierarchy'], a: 1,
    e: 'Naively, OrderService imports MySqlDatabase. Inverted: MySqlDatabase implements OrderStore — the detail now depends on the policy\'s interface. The arrow flipped; that flip is the whole principle.',
    w: { 0: 'Names don\'t move — dependencies do.',
         2: 'Parameter order is cosmetic.',
         3: 'Inheritance trees aren\'t flipped — source-dependency arrows are.' },
    r: { id: 's3', label: 'Section 3 — the arrow flipper' } },
  { q: 'DIP vs dependency injection (DI) — what is the difference?',
    o: ['They are the same thing', 'DIP is the PRINCIPLE (depend on abstractions); DI is one TECHNIQUE for it (hand dependencies in from outside, e.g. via constructor)', 'DI is the principle, DIP is the tool', 'DIP only works with Spring'], a: 1,
    e: 'DIP says what the arrows should look like; constructor injection is the everyday tool that makes it happen. Frameworks (Spring) just automate the injecting — you can do DIP with plain new in main().',
    w: { 0: 'Same family, different jobs: principle vs technique.',
         2: 'Backwards — DIP is the principle.',
         3: 'No framework needed; main() can wire everything by hand.' },
    r: { id: 's6', label: 'Section 6 — DIP vs DI vs IoC' } },
  { q: 'The "composition root" is…',
    o: ['The deepest class in the hierarchy', 'The one place at the edge of the app (e.g. main) where concrete classes are chosen, new-ed, and wired together', 'The database schema', 'The root folder of the project'], a: 1,
    e: 'SOMEBODY has to say new MySqlStore(). DIP doesn\'t eliminate that — it quarantines it to one boring file at the edge, so the valuable middle of the app stays abstract.',
    w: { 0: 'Depth in the hierarchy is unrelated — the root is at the EDGE of the app.',
         2: 'Database schemas live elsewhere.',
         3: 'Folders don\'t wire objects.' },
    r: { id: 's6', label: 'Section 6 — the composition root' } },
  { q: 'Why does DIP make unit testing dramatically easier?',
    o: ['Tests run on the GPU', 'Business classes accept interfaces, so tests inject tiny fakes — no real DB/SMTP server needed to test a rule', 'It removes the need for tests', 'JUnit requires it'], a: 1,
    e: 'A 5-line FakeStore replaces a database server. If you cannot test a class without booting infrastructure, its dependencies point the wrong way.',
    w: { 0: 'GPUs are innocent here. 🙂',
         2: 'DIP makes testing EASIER, never unnecessary.',
         3: 'JUnit has no such requirement — good design does.' },
    r: { id: 's5', label: 'Section 5 — the test bench' } },
  { q: 'Where is DIP worth its cost?',
    o: ['Everywhere — wrap String in an interface too', 'At the boundaries where volatile details live: database, network, email, file system, clock, randomness', 'Only in getters', 'Nowhere in small apps'], a: 1,
    e: 'Invert at the doors of your system — the things that get swapped, mocked, or fail in tests. new ArrayList() or new Money(…) inside logic is fine: stable value objects are not "details" in DIP\'s sense.',
    w: { 0: 'IString is the parody version — stable values need no socket.',
         2: 'Getters are not boundaries.',
         3: 'Small apps still need testable seams at their few doors.' },
    r: { id: 's8', label: 'Section 8 — where to invert' } },
  { q: 'How does DIP complete the rest of SOLID week?',
    o: ['It contradicts OCP', 'It supplies the abstractions that OCP\'s slots and Day 7\'s injection rely on — the final arrow-flip that makes the other principles practical', 'It replaces SRP', 'It only matters for UML'], a: 1,
    e: 'OCP needs a slot (interface) to stay closed; ISP shapes the slot; LSP keeps plugs honest; SRP keeps the pieces small — and DIP points all the arrows at those abstractions. Five principles, one design style.',
    w: { 0: 'OCP and DIP are teammates: slots + arrow direction.',
         2: 'Nothing replaces SRP — small pieces stay step one.',
         3: 'DIP shapes the whole architecture, far beyond diagrams.' },
    r: { id: 's10', label: 'Section 10 — the SOLID recap table' } },
]

/* ============ The page ============ */
export default function Day15() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 3 · Day 15</div>
        <h1>Dependency Inversion:<br />The Lamp Never Bows to the Power Plant</h1>
        <p>The grand finale of SOLID. One last arrow to flip: why your business rules — the most valuable code
           you own — must never depend on database drivers and email servers. Finish today and the whole week
           snaps together into one picture. Click everything.</p>
        <div className="chips">
          {['DIP', 'high-level policy', 'low-level detail', 'abstractions', 'dependency injection', 'composition root'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The wall socket</h2>
        <p>Your <strong>lamp</strong> is not soldered to the power plant. Between them sits a humble hero: the
          <strong> wall socket</strong> — a standard shape that both sides agree on. The lamp plugs into the
          socket. The power plant (through miles of wiring) serves the socket. Swap coal for solar tomorrow —
          the lamp never finds out. Buy a new lamp — the grid never finds out.</p>
        <p>Notice something subtle: the socket's shape was designed for the <strong>appliances</strong> — the
          users — not for the power plant. The plant must conform to what users need, never the reverse. Hold
          that thought; it is the "inversion".</p>
        <Note><strong>DIP in two lines (memorize both):</strong> ① High-level modules (business policy) should not
          depend on low-level modules (details) — <strong>both should depend on abstractions</strong>.
          ② Abstractions should not depend on details — <strong>details should depend on abstractions</strong>.</Note>
        <Code html={`   NAIVE — arrow points DOWN 😱            INVERTED — arrows meet at the socket 🔌

   OrderService   (policy)                 OrderService   (policy)
        │                                       │
        │ imports                               │ depends on
        ▼                                       ▼
   MySqlDatabase  (detail)               «interface» OrderStore  ← the socket,
                                                ▲        shaped by what POLICY needs
   the business rules know a                    │ implements
   vendor's name. The valuable             MySqlDatabase  (detail)
   code is hostage to the                  the detail now serves the policy.
   replaceable code.                       THE ARROW FLIPPED — that's the inversion.`} />
        <Reveal summary="Why is this the 'final boss' of SOLID? Click to reveal.">
          <p>Because the other four quietly assume it. OCP's sealed console needs a slot — DIP supplies it.
            ISP shapes that slot lean. LSP keeps every plug honest. SRP keeps each plug small. DIP is the rule
            about <em>which way the arrows point</em> once all those pieces exist — and arrows are what make a
            design rigid or flexible. Uncle Bob calls the combination "the heart of clean architecture".</p>
        </Reveal>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The crime: policy bowing to detail</h2>
        <Code html={`<span class="kw">public class</span> OrderService {                <span class="cm">// HIGH level: the rules of the business</span>
    <span class="kw">private</span> MySqlDatabase db = <span class="kw">new</span> MySqlDatabase();   <span class="cm">// ❌ a vendor, hard-wired</span>
    <span class="kw">private</span> SmtpEmailer mail = <span class="kw">new</span> SmtpEmailer();     <span class="cm">// ❌ another one</span>

    <span class="kw">public void</span> placeOrder(Order o) {
        <span class="kw">if</span> (o.items().isEmpty()) <span class="kw">throw new</span> IllegalArgumentException();
        db.insertRow(<span class="str">"orders"</span>, o.toRow());   <span class="cm">// policy speaks SQL-ish 😬</span>
        mail.smtpSend(o.confirmation());      <span class="cm">// policy speaks SMTP-ish 😬</span>
    }
}`} />
        <p>Read the dependency arrows: the <strong>most valuable</strong> class in the app (the business rules)
          depends on the <strong>most replaceable</strong> classes (a SQL driver, a mail client). Consequences:</p>
        <ul>
          <li><strong>Swaps hurt:</strong> MySQL → Mongo means editing business rules (Day 12's crime, at the architecture level).</li>
          <li><strong>Tests need servers:</strong> you cannot check "reject empty orders" without a database running.</li>
          <li><strong>Reuse is dead:</strong> want the same rules in a demo app with in-memory storage? Impossible — MySQL comes welded in.</li>
          <li><strong>Vocabulary leaks:</strong> the policy starts talking in rows and SMTP — detail language creeping up into the rules.</li>
        </ul>
        <Warn><strong>The deeper point:</strong> source-code arrows are <em>commitment</em>. Whatever you depend on
          can force you to change. So point your arrows at things that are <strong>stable</strong> (abstractions
          you own) — never at things that churn (vendors, drivers, formats).</Warn>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🔁 Play: Flip the arrow, swap the database</h2>
        <p>Run the same migration in both worlds. Before pressing the swap, <strong>predict</strong> which files
          change in each.</p>
        <ArrowFlipper />
        <Good><strong>What you should notice:</strong> ① In the naive world the EDIT lands inside OrderService —
          policy paid for a detail's decision. ② In the inverted world the swap is a brand-new class implementing
          <C> OrderStore</C>; the policy's edit count stays 0. ③ The interface sits with the POLICY and speaks the
          policy's language (<C>save(Order)</C>), not the vendor's (<C>insertRow</C>).</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The fix, line by line</h2>
        <Code html={`<span class="cm">// 1 — the SOCKET: an interface owned by the policy side,
//     speaking the policy's language ("save an order", not "insert a row")</span>
<span class="kw">public interface</span> OrderStore { <span class="kw">void</span> save(Order o); }
<span class="kw">public interface</span> Notifier   { <span class="kw">void</span> notify(Order o); }

<span class="cm">// 2 — the POLICY: depends only on the sockets, receives them injected</span>
<span class="kw">public class</span> OrderService {
    <span class="kw">private final</span> OrderStore store;
    <span class="kw">private final</span> Notifier notifier;

    <span class="kw">public</span> OrderService(OrderStore store, Notifier notifier) {  <span class="cm">// 💉 injection</span>
        <span class="kw">this</span>.store = store;
        <span class="kw">this</span>.notifier = notifier;
    }
    <span class="kw">public void</span> placeOrder(Order o) {
        <span class="kw">if</span> (o.items().isEmpty()) <span class="kw">throw new</span> IllegalArgumentException();
        store.save(o);          <span class="cm">// pure policy language ✅</span>
        notifier.notify(o);
    }
}

<span class="cm">// 3 — the DETAILS: plugs that conform to the sockets</span>
<span class="kw">public class</span> MySqlStore <span class="kw">implements</span> OrderStore {
    <span class="kw">public void</span> save(Order o) { <span class="cm">/* SQL lives here, quarantined */</span> }
}
<span class="kw">public class</span> EmailNotifier <span class="kw">implements</span> Notifier {
    <span class="kw">public void</span> notify(Order o) { <span class="cm">/* SMTP lives here, quarantined */</span> }
}`} />
        <p>Two inversions happened at once — name them both in interviews:</p>
        <ul>
          <li><strong>The arrow inverted:</strong> <C>MySqlStore</C> now imports the policy's interface; the policy
            imports no vendor. Low points at high.</li>
          <li><strong>The ownership inverted:</strong> the interface belongs to the <em>policy's</em> package and
            expresses the policy's needs. It is not a wrapper around MySQL's API — it is a statement of what the
            business requires. (That is why clause ② says abstractions must not depend on details.)</li>
        </ul>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🧪 Play: The test bench</h2>
        <p>The fastest way to FEEL DIP: try to unit-test one business rule in each world.</p>
        <TestBench />
        <Good><strong>What you should notice:</strong> ① In the naive world the test fails on infrastructure before
          your rule even runs. ② In the DIP world a 5-line fake makes the test instant and deterministic.
          ③ Testability is not a bonus feature of DIP — it is the same property as swappability, seen from the
          test's point of view. <strong>Hard to test = arrows point the wrong way.</strong></Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>DIP vs DI vs IoC — three names, one family</h2>
        <ul>
          <li><strong>DIP (principle):</strong> arrows must point at abstractions; policy never at detail.</li>
          <li><strong>Dependency Injection (technique):</strong> instead of a class <C>new</C>-ing its
            dependencies, they are handed in from outside — usually through the constructor (you've done this
            since Day 7).</li>
          <li><strong>Inversion of Control / frameworks (automation):</strong> Spring & friends just automate the
            injecting at scale. <strong>Using Spring ≠ following DIP</strong> — a Spring app whose service
            injects a concrete <C>MySqlDatabase</C> still violates the principle.</li>
        </ul>
        <p>But if nobody calls <C>new MySqlStore()</C>… who does? Answer: <strong>the composition root</strong> —
          one boring file at the edge of the app (usually <C>main</C>) whose only job is choosing plugs and
          wiring them:</p>
        <Code html={`<span class="kw">public static void</span> main(String[] args) {
    <span class="cm">// the ONLY place that knows concrete names — the plug board:</span>
    OrderStore store    = <span class="kw">new</span> MySqlStore();
    Notifier   notifier = <span class="kw">new</span> EmailNotifier();
    OrderService app    = <span class="kw">new</span> OrderService(store, notifier);
    app.run();
}`} />
        <Note><strong><C>new</C> is not evil — homeless <C>new</C> is.</strong> Creating volatile dependencies deep
          inside business logic welds the arrows the wrong way. Creating them at the composition root (or for
          stable value objects like <C>Money</C>, <C>ArrayList</C> — anywhere) is perfectly fine.</Note>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🔌 Play: The plug board</h2>
        <p>Wire the app nine different ways. Watch <C>main()</C> change — and count how many times
          <C>OrderService</C> changes.</p>
        <PlugBoard />
        <Good><strong>What you should notice:</strong> ① Every combination only rewrites <C>main()</C> — the one
          file whose JOB is to change. ② This wiring point is exactly where a future framework (or a factory,
          Month 2) slots in. ③ Combine with Day 12: each plug family is an OCP cartridge rack, and DIP decides
          where the racks face.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Where to invert (and where NOT to)</h2>
        <p>DIP earns its cost at the <strong>volatile boundaries</strong> of your system — the places that get
          swapped, mocked, or fail in tests:</p>
        <table className="matrix">
          <thead>
            <tr><th>boundary</th><th>abstraction</th><th>why</th></tr>
          </thead>
          <tbody>
            <tr><td>database / storage</td><td><C>OrderStore</C></td><td>vendors change; tests need fakes</td></tr>
            <tr><td>network / other services</td><td><C>PaymentGateway</C></td><td>flaky, slow, costs money in tests</td></tr>
            <tr><td>email / SMS / push</td><td><C>Notifier</C></td><td>you do NOT want tests emailing customers 😅</td></tr>
            <tr><td>time</td><td><C>Clock</C> (java.time has it built in!)</td><td>"orders expire after 30 min" is untestable with the real clock</td></tr>
            <tr><td>randomness</td><td><C>Random</C> injected</td><td>deterministic tests for dice, shuffles, IDs</td></tr>
          </tbody>
        </table>
        <p>And where NOT to: stable, boring things. <C>String</C>, <C>ArrayList</C>, your own <C>Money</C> value
          object — wrapping these in interfaces is speculative generality (Day 12's disease) with zero payoff.
          They never get swapped and never block a test.</p>
        <Reveal summary="The Clock trick — tiny example interviewers love. Click to reveal.">
          <Code html={`<span class="kw">public class</span> OfferService {
    <span class="kw">private final</span> Clock clock;                    <span class="cm">// 💉 inject time itself!</span>
    <span class="kw">public</span> OfferService(Clock clock) { <span class="kw">this</span>.clock = clock; }

    <span class="kw">public boolean</span> isHappyHour() {
        <span class="kw">int</span> h = LocalTime.now(clock).getHour();   <span class="cm">// asks OUR clock, not the wall</span>
        <span class="kw">return</span> h >= <span class="num">17</span> && h < <span class="num">19</span>;
    }
}
<span class="cm">// prod:  new OfferService(Clock.systemDefaultZone());
// test:  new OfferService(Clock.fixed(at_6pm, zone));   // happy hour, forever 🍹</span>`} />
        </Reveal>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Interface shaped like the vendor</h3>
        <p><C>interface Database {'{'} insertRow(table, row); runSql(q); {'}'}</C> is MySQL wearing a mask — the
          abstraction depends on the detail (clause ② violated). The socket must speak policy
          (<C>save(Order)</C>), or swapping vendors will still break everything.</p>
        <h3>Trap 2 — Interface for everything</h3>
        <p><C>IString</C>, <C>IMoney</C>, <C>IOrderIdGenerator</C> with one forever-implementation each = ceremony
          without benefit. Invert at volatile boundaries, not on stable values.</p>
        <h3>Trap 3 — "We use Spring, so we follow DIP"</h3>
        <p>Injection of a CONCRETE class is still a wrong-way arrow, framework or not. The principle is about
          types in your signatures, not about who calls new.</p>
        <h3>Trap 4 — The hidden new</h3>
        <p>Constructor takes <C>OrderStore</C>… but line 3 of some method quietly does
          <C> new SmtpEmailer().send(…)</C>. One hidden <C>new</C> of a volatile thing re-welds the arrow. Hunt them.</p>
        <h3>Trap 5 — Service locator "fix"</h3>
        <p><C>ServiceLocator.get("store")</C> hides dependencies instead of inverting them — now the constructor
          lies about what the class needs, and tests must set up a global registry. Prefer honest constructor
          parameters.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet — and the whole SOLID week on one screen</h2>
        <ul>
          <li><strong>DIP:</strong> policy never depends on detail; both meet at an abstraction <strong>owned by the policy</strong> and speaking its language. The arrow flip IS the inversion.</li>
          <li><strong>DI</strong> = the technique (constructor injection). <strong>Composition root</strong> = the one edge file that picks concrete plugs. Frameworks automate it, never replace the principle.</li>
          <li>Invert at volatile boundaries: storage, network, notifications, <strong>clock, randomness</strong>. Don't wrap stable values.</li>
          <li>Smells: vendor-shaped interfaces · hidden <C>new</C> in logic · service locators · "untestable without a server".</li>
          <li>Hard to test ⇔ arrows point the wrong way. Same property, two views.</li>
        </ul>
        <table className="matrix">
          <thead>
            <tr><th>day</th><th>principle</th><th>one line</th><th>its job in the machine</th></tr>
          </thead>
          <tbody>
            <tr><td>11</td><td><b>S</b>RP</td><td>one reason to change</td><td>keeps every piece small & honest</td></tr>
            <tr><td>12</td><td><b>O</b>CP</td><td>extend, don't edit</td><td>seals the console, adds cartridge slots</td></tr>
            <tr><td>13</td><td><b>L</b>SP</td><td>subtypes keep promises</td><td>guarantees every cartridge fits the slot</td></tr>
            <tr><td>14</td><td><b>I</b>SP</td><td>lean role contracts</td><td>shapes the slots so nobody must lie</td></tr>
            <tr><td>15</td><td><b>D</b>IP</td><td>arrows point at abstractions</td><td>decides which way the slots face</td></tr>
          </tbody>
        </table>
        <p>Five rules, one design style: <strong>small honest pieces, plugged into lean sockets, with all arrows
          pointing at the stable middle.</strong> Every pattern in Month 2 is a named, reusable arrangement of
          exactly this.</p>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Recite both clauses of DIP word-perfect.">
          <p>① High-level modules should not depend on low-level modules; both should depend on abstractions.
            ② Abstractions should not depend on details; details should depend on abstractions. Most candidates
            only know clause ① — clause ② (the interface speaks POLICY language, owned by the policy side) is
            the differentiator.</p>
        </Reveal>
        <Reveal summary="Q: Constructor vs setter vs field injection — rank them and justify.">
          <p><strong>Constructor</strong> wins: dependencies are explicit, can be <C>final</C>, object is born
            complete (no half-wired window), trivially testable with fakes. Setter injection: for genuinely
            optional/reconfigurable deps only. <strong>Field injection</strong> (annotation directly on a
            private field) loses: hides dependencies, needs reflection, can't be final, hard to construct in
            plain tests.</p>
        </Reveal>
        <Reveal summary="Q: Why is Service Locator considered an anti-pattern next to DI?">
          <p>It inverts visibility the WRONG way: the class's true dependencies vanish from its constructor into
            lookup calls scattered in method bodies. Constructors lie, tests must bootstrap a global registry,
            and compile-time checking of "is everything wired?" is lost. DI declares; a locator conceals.</p>
        </Reveal>
        <Reveal summary='Q: "We use Spring, so we follow DIP" — destroy this claim in two sentences.'>
          <p>Spring automates INJECTION, not INVERSION: injecting a concrete MySqlRepository still points the
            policy at a detail. DIP is satisfied by the TYPES in your signatures (depend on the abstraction),
            regardless of who performs the wiring — framework or a hand-written main.</p>
        </Reveal>
        <Reveal summary="Q: Who should OWN the OrderStore interface — the orders package or the database package?">
          <p>The <strong>orders (policy) package</strong>. If the persistence package owns it, the abstraction
            belongs to the detail — clause ② violated, and the policy still transitively depends on the
            detail's module. Interface ownership is the subtlest, most senior DIP question; the package-level
            answer ("ports live with the domain") is the heart of hexagonal/clean architecture.</p>
        </Reveal>
        <Reveal summary="Q: DIP vs IoC vs DI — three terms, one breath.">
          <p>DIP = the PRINCIPLE about dependency direction. IoC = the broader idea of frameworks calling your
            code ("don't call us, we'll call you" — also covers event loops, templates). DI = one concrete IoC
            technique: dependencies handed in from outside. DIP can be honored with zero frameworks; frameworks
            can be used while violating DIP.</p>
        </Reveal>
        <Reveal summary='Q: Why do we say "testability and swappability are the same property"?'>
          <p>Both are substitutions through the same seam: a test substitutes a Fake where production
            substitutes a Mongo. If a fake can't be injected, a new vendor can't either — one seam, two
            customers. Hence the diagnostic: "hard to unit test" ⇔ "arrows point at concretions."</p>
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
        <strong>Day 15 complete — and SOLID week with it! 🎉</strong> Homework (the capstone): build
        <C> ReportApp</C> twice. Version A (naive): <C>ReportService</C> news up <C>MySqlDb</C> and
        <C> ConsolePrinter</C> directly. Version B (inverted): <C>ReportSource</C> and <C>ReportOutput</C>
        interfaces, <C>ReportService</C> takes both in its constructor, <C>main()</C> wires
        <C> MySqlDb + ConsolePrinter</C>. Then prove the win twice: ① add a <C>FileOutput</C> without touching
        <C> ReportService</C>; ② write a unit test for the report logic using a <C>FakeSource</C> — no database.
        Label each file HIGH / LOW / SOCKET / PLUG BOARD in a comment.
        <br /><br />
        Next: <strong>Week 4 — Beyond SOLID</strong>, starting with <strong>Day 16 — DRY, KISS &amp; YAGNI</strong>:
        the three everyday habits that decide whether all these principles produce clean code… or over-engineered
        soup.
      </div>
    </div>
  )
}
