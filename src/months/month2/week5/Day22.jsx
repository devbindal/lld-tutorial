import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The scattered-new hunter ============ */
const SCATTER_FILES = ['Checkout.java', 'Signup.java', 'Reminders.java', 'PasswordReset.java', 'MarketingBlast.java']

function ScatteredNew() {
  const [world, setWorld] = useState('scattered')
  const [fired, setFired] = useState(false)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · five features send notifications — then the boss adds WhatsApp</div>
      <div className="modbtns">
        <button className={world === 'scattered' ? 'on' : ''} onClick={() => { setWorld('scattered'); setFired(false) }}>🌪️ scattered new</button>
        <button className={world === 'factory' ? 'on' : ''} onClick={() => { setWorld('factory'); setFired(false) }}>🏭 factory world</button>
      </div>
      <Code html={world === 'scattered'
        ? `<span class="cm">// …repeated, with variations, in all five files:</span>
Notification n;
<span class="kw">if</span> (channel.equals(<span class="str">"EMAIL"</span>))    n = <span class="kw">new</span> EmailNotification(smtpHost);
<span class="kw">else if</span> (channel.equals(<span class="str">"SMS"</span>)) n = <span class="kw">new</span> SmsNotification(gatewayKey);
n.send(msg);`
        : `<span class="cm">// in all five files — they know NO concrete class, just the counter:</span>
Notification n = NotificationFactory.create(channel);
n.send(msg);

<span class="cm">// NotificationFactory.java — the ONE file allowed to say new:</span>
<span class="kw">public static</span> Notification create(String channel) {
    <span class="kw">return switch</span> (channel) {
        <span class="kw">case</span> <span class="str">"EMAIL"</span> -> <span class="kw">new</span> EmailNotification(smtpHost);
        <span class="kw">case</span> <span class="str">"SMS"</span>   -> <span class="kw">new</span> SmsNotification(gatewayKey);
        <span class="kw">default</span>      -> <span class="kw">throw new</span> UnknownChannelException(channel);
    };
}`} />
      <button className="act" onClick={() => setFired(true)} style={{ marginBottom: 12 }}>
        📣 boss: "add WhatsApp notifications!"
      </button>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[...SCATTER_FILES, 'NotificationFactory.java'].map((f) => {
          const isFactory = f === 'NotificationFactory.java'
          if (world === 'scattered' && isFactory) return null
          const lit = fired && (world === 'scattered' ? !isFactory : isFactory)
          return (
            <span key={f} className="chip" style={lit
              ? { background: '#FFE0DE', borderColor: 'var(--red)', color: '#8F2B24' }
              : fired ? { opacity: 0.5 } : {}}>
              {f}{lit ? ' ✏️' : ''}
            </span>
          )
        })}
      </div>
      {fired && (
        <div className="statbar">
          💥 <span>files to edit:</span>
          <b>{world === 'scattered'
            ? '5 — and each has its own slightly different if-chain to get subtly wrong.'
            : '1 — add one case line (+ the new WhatsAppNotification class). The five clients never hear about it.'}</b>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 2: The barista (simple factory) ============ */
const MENU = {
  ESPRESSO: { emoji: '☕', recipe: 'shot of espresso', cls: 'Espresso' },
  LATTE: { emoji: '🥛', recipe: 'espresso + steamed milk', cls: 'Latte' },
  CAPPUCCINO: { emoji: '🫧', recipe: 'espresso + milk + foam', cls: 'Cappuccino' },
}
const SECRET = { MOCHA: { emoji: '🍫', recipe: 'espresso + chocolate + milk', cls: 'Mocha' } }

function Barista() {
  const [menu, setMenu] = useState(MENU)
  const [cups, setCups] = useState([])

  function order(key) {
    if (cups.length >= 5) { setCups([]); return }
    const addr = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')
    setCups((c) => [...c, { ...menu[key], key, addr }])
  }
  const addMocha = () => setMenu((m) => ({ ...m, ...SECRET }))

  return (
    <div className="panel">
      <div className="ptitle">Live demo · you order by NAME — the barista runs the machines</div>
      <Code html={`<span class="cm">// the client — you — knows only the counter and the menu names:</span>
Coffee cup = CoffeeShop.order(<span class="str">"LATTE"</span>);   <span class="cm">// no new. No machine knowledge.</span>`} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.keys(menu).map((k) => (
          <button key={k} className="act" onClick={() => order(k)}>order("{k}")</button>
        ))}
        {!menu.MOCHA && (
          <button className="ghost act" onClick={addMocha}>🆕 shop adds MOCHA to the menu</button>
        )}
      </div>
      <div className="heap">
        {cups.length === 0 ? (
          <div className="empty">No cups yet. Order something ↑ (the counter clears after 5)</div>
        ) : (
          cups.map((c, i) => (
            <div className="obj" key={i}>
              <div className="oref">cup{i + 1} → {c.cls}@{c.addr}</div>
              <div className="ofield">{c.emoji} {c.recipe}</div>
              <div className="ofield">implements Coffee ✓</div>
            </div>
          ))
        )}
      </div>
      <div className="statbar">
        {menu.MOCHA
          ? <span>🆕 <span>MOCHA appeared on the menu — and YOUR ordering code did not change by one character. New product, same counter.</span></span>
          : <span>☕ <span>Each order returns a different concrete class — but you only ever hold the <b>Coffee</b> interface.</span></span>}
      </div>
    </div>
  )
}

/* ============ Interactive 3: Factory Method dispatcher ============ */
const BRANCHES = {
  RoadLogistics: { product: 'Truck 🚚', detail: 'drives the highway, 80 km/h', addr: 'a1f4' },
  SeaLogistics: { product: 'Ship 🚢', detail: 'sails the route, 5000 containers', addr: 'b7c9' },
  AirLogistics: { product: 'Plane ✈️', detail: 'flies direct, fastest + priciest', addr: 'c3e2' },
}

function FmDispatcher() {
  const [branch, setBranch] = useState('RoadLogistics')
  const [step, setStep] = useState(-1)
  const b = BRANCHES[branch]

  const TRACE = [
    { line: `logistics.planDelivery(order)`, who: 'client', note: 'The client calls the PUBLIC method — defined once, in the abstract Logistics base class.' },
    { line: `Logistics.planDelivery: validate(order)  ✓`, who: 'base', note: 'The base class runs the steps common to every branch — written once.' },
    { line: `Logistics.planDelivery: Transport t = createTransport();`, who: 'base', note: 'THE FACTORY METHOD CALL. The base class asks "give me a transport" — without knowing which one. Dynamic dispatch (Day 4!) routes this call…' },
    { line: `${branch}.createTransport()  →  new ${b.product.split(' ')[0]}()  →  ${b.product.split(' ')[0]}@${b.addr}`, who: 'sub', note: `…to the SUBCLASS you picked. ${branch} is the only class that knows ${b.product.split(' ')[0]} exists. This one overridden method IS the pattern.` },
    { line: `Logistics.planDelivery: t.deliver(order)  →  ${b.detail}`, who: 'base', note: 'Back in the base class: it uses the product through the Transport interface, never caring what arrived. Template logic + plugged-in creation.' },
  ]
  const cur = step >= 0 ? TRACE[step] : null

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one delivery algorithm, three branches — watch who creates what</div>
      <div className="modbtns">
        {Object.keys(BRANCHES).map((k) => (
          <button key={k} className={branch === k ? 'on' : ''} onClick={() => { setBranch(k); setStep(-1) }}>{k}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={() => setStep((s) => Math.min(s + 1, TRACE.length - 1))} disabled={step >= TRACE.length - 1}>
          {step < 0 ? '▶ planDelivery(order)' : 'next →'}
        </button>
        <button className="ghost act" onClick={() => setStep(-1)}>reset</button>
      </div>
      <div className="heap">
        {TRACE.slice(0, step + 1).map((t, i) => (
          <div key={i} style={{
            fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '4px 8px', borderRadius: 6,
            background: i === step ? (t.who === 'sub' ? '#FFF1D6' : '#EEF2FF') : 'transparent',
            fontWeight: i === step ? 700 : 400,
          }}>
            {t.who === 'base' ? '🏛️ ' : t.who === 'sub' ? '🏭 ' : '👤 '}{t.line}
          </div>
        ))}
        {step < 0 && <div className="empty">Pick a branch, then press play to trace the call.</div>}
      </div>
      {cur && <div className="statbar">💡 <span>{cur.note}</span></div>}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'Why is a scattered `new EmailNotification(...)` in ten files a design liability?',
    o: ['new is slow', 'Each new couples that file to a concrete class and its constructor details — adding/changing products means hunting and editing every site', 'Objects leak memory', 'Constructors are deprecated'], a: 1,
    e: 'new names a concrete class — the tightest possible knowledge. Scatter it and the "what products exist" knowledge has ten homes (DRY, Day 16) and every addition is shotgun surgery (Day 17).',
    w: { 0: 'new is as fast as it gets — knowledge, not speed, is the liability.',
         2: 'GC handles memory fine.',
         3: 'Constructors are core Java — their PLACEMENT is the design question.' },
    r: { id: 's1', label: 'Section 1 — the coffee counter' } },
  { q: 'A SIMPLE FACTORY is…',
    o: ['A GoF pattern with subclasses', 'One class/static method that centralizes creation: clients pass a key, the factory owns the switch and returns the interface type', 'A factory with no methods', 'Another name for Singleton'], a: 1,
    e: 'Not officially in the GoF book, but the everyday workhorse: NotificationFactory.create(channel). The switch still exists — in exactly ONE authorized place. That containment is the whole win.',
    w: { 0: 'Subclass-based creation is the GoF Factory METHOD — the next level up.',
         2: 'A factory with no methods creates nothing. 🙂',
         3: 'Singleton manages instance COUNT; factories manage instance CHOICE.' },
    r: { id: 's2', label: 'Section 2 — the simple factory' } },
  { q: 'The GoF FACTORY METHOD pattern differs from a simple factory because…',
    o: ['It has more ifs', 'Creation is deferred to SUBCLASSES: an abstract creator defines an abstract createX() hook; each subclass overrides it to choose the product — selection by inheritance, not by switch', 'It can only create one object', 'It requires reflection'], a: 1,
    e: 'Logistics declares createTransport(); RoadLogistics returns a Truck, SeaLogistics a Ship. Choosing the subclass chooses the products — no switch anywhere.',
    w: { 0: 'if-count is not a pattern criterion.',
         2: 'It creates one product per call — but any number of times.',
         3: 'No reflection — plain old overriding.' },
    r: { id: 's5', label: 'Section 5 — GoF Factory Method' } },
  { q: 'Inside Logistics.planDelivery(), the call createTransport() reaches RoadLogistics\'s version via…',
    o: ['Reflection', 'Dynamic dispatch (Day 4): the base class calls an overridable method on this, and the runtime routes to the actual subclass', 'A switch statement', 'Static binding'], a: 1,
    e: 'The factory method is just an overridden method called from the parent — the same vtable machinery from Day 4, used to plug CREATION into a fixed algorithm (a taste of Template Method, Week 7).',
    w: { 0: 'No reflection involved — ordinary overriding.',
         2: 'The pattern\'s entire point is having NO switch.',
         3: 'Static binding would always run the parent\'s version — the opposite of the trick.' },
    r: { id: 's6', label: 'Section 6 — the dispatcher trace' } },
  { q: 'Integer.valueOf(42) and List.of(...) are examples of…',
    o: ['Constructors', 'Static factory methods — named creation that can cache, return subtypes, and refuse', 'Abstract factories', 'Builders'], a: 1,
    e: 'The JDK is full of them. valueOf caches small Integers (-128..127 return the SAME object!), List.of returns hidden immutable implementations. Constructors can do none of that.',
    w: { 0: 'Constructors are called WITH new — these methods replace that call.',
         2: 'Abstract Factory is an OBJECT with several create methods (tomorrow).',
         3: 'Builders accumulate steps then build() — different shape.' },
    r: { id: 's7', label: 'Section 7 — static factories in the JDK' } },
  { q: 'Which is NOT one of the classic advantages of a static factory over a constructor?',
    o: ['It has a meaningful NAME (Money.zero(INR) vs new Money(…))', 'It can return a cached instance instead of always allocating', 'It can return any SUBTYPE of the declared return type', 'It runs faster than constructors in all cases'], a: 3,
    e: 'The three real wins are naming, instance control (caching — even singletons!), and subtype freedom (clients see the interface). Speed is not the argument.',
    w: { 0: 'Naming IS a classic advantage — readable creation.',
         1: 'Caching/instance control IS one too (valueOf!).',
         2: 'Subtype returns IS the third (List.of\'s hidden classes).' },
    r: { id: 's7', label: 'Section 7 — Effective Java Item 1' } },
  { q: '"But the factory still contains a switch — isn\'t that an OCP violation?"',
    o: ['Yes — factories are anti-patterns', 'No — Day 12\'s rule was that the cartridge list must live in ONE contained place; the factory IS that place. Adding a product edits one case line, not N client files', 'Yes, unless you use reflection', 'Switches are illegal in Java'], a: 1,
    e: 'Someone must know the catalog. The pattern\'s promise is not "no switch exists" but "exactly one, behind a door, with all clients depending only on the interface".',
    w: { 0: 'Factories are among the most-used patterns in existence — hardly anti.',
         2: 'Reflection/registries can remove even that switch, but they\'re an escalation, not a requirement.',
         3: 'Switches are core Java — and got nicer with switch expressions.' },
    r: { id: 's2', label: 'Section 2 — the contained switch' } },
  { q: 'What is "factory-itis"?',
    o: ['A JVM error', 'Wrapping EVERY new in a factory, even for simple value objects with one obvious implementation — ceremony without a varying axis (YAGNI, Day 16)', 'Using two factories', 'A naming convention'], a: 1,
    e: 'new Money(amount, INR) needs no factory — nothing varies, nothing is hidden. Factories earn their keep where the concrete type varies, construction is complex, or the catalog must be contained.',
    w: { 0: 'No JVM errors here — only design ones. 🙂',
         2: 'Two factories can be fine; ZERO varying axes is the disease.',
         3: 'It\'s an anti-pattern name, not a convention.' },
    r: { id: 's9', label: 'Section 9 — Trap 1: factory-itis' } },
]

/* ============ The page ============ */
export default function Day22() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 5 · Day 22 · Creational Patterns</div>
        <h1>Factory Method:<br />Order by Name, Never Run the Machines</h1>
        <p>Day 12 left a question hanging: if clients must not know the concrete cartridge classes…
           <em> someone</em> has to. Today you meet that someone. From the everyday simple factory to the true
           GoF Factory Method — plus the static factories hiding all over the JDK. Click everything.</p>
        <div className="chips">
          {['factory', 'simple factory', 'factory method', 'static factories', 'new is a liability', 'creation in one place'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The coffee counter</h2>
        <p>At a coffee shop you say one word — <em>"cappuccino"</em> — at the counter. You do NOT walk behind the
          bar, pick the right machine, grind, tamp, steam and foam. The <strong>barista</strong> knows the
          machines; you know the <strong>menu</strong>. And when the shop adds a new drink, your ordering ritual
          doesn't change — the menu just gets longer.</p>
        <p>In code, <C>new EmailNotification(smtpHost, port, retries)</C> is you operating the espresso machine
          yourself: you must know the concrete class, its constructor's demands, in every file that needs a
          notification. A <strong>factory</strong> is the counter:</p>
        <Code html={`   WITHOUT A FACTORY 🌪️                    WITH A FACTORY 🏭

   every file runs the machines:          one counter knows the machines:
   Checkout.java   new EmailNotif(…)      ┌────────────────────────┐
   Signup.java     new EmailNotif(…)      │  NotificationFactory   │ ← the ONLY
   Reminders.java  new SmsNotif(…)        │  create(channel)       │   file that
   …each with its own if-chain            └───────────┬────────────┘   says new
                                                      ▼
   add WhatsApp = edit ALL of them        clients receive Notification
                                          (the interface — Day 12's slot)`} />
        <Note><strong>The idea in one line:</strong> <C>new</C> is a point of <em>knowledge</em> — whoever writes
          it knows a concrete class. Factories gather all that knowledge behind ONE door, so clients hold only
          interfaces. (This is Day 12's "keep the cartridge list in one place" — promoted from footnote to
          pattern.)</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Level 1 — the simple factory (the everyday workhorse)</h2>
        <Code html={`<span class="cm">// the products — Day 12's cartridges, unchanged:</span>
<span class="kw">public interface</span> Notification { <span class="kw">void</span> send(String msg); }
<span class="kw">public class</span> EmailNotification <span class="kw">implements</span> Notification { <span class="cm">/* SMTP details */</span> }
<span class="kw">public class</span> SmsNotification   <span class="kw">implements</span> Notification { <span class="cm">/* gateway details */</span> }

<span class="cm">// the counter — ONE home for the catalog and the constructor mess:</span>
<span class="kw">public class</span> NotificationFactory {
    <span class="kw">public static</span> Notification create(String channel) {
        <span class="kw">return switch</span> (channel) {
            <span class="kw">case</span> <span class="str">"EMAIL"</span> -> <span class="kw">new</span> EmailNotification(Config.smtpHost());
            <span class="kw">case</span> <span class="str">"SMS"</span>   -> <span class="kw">new</span> SmsNotification(Config.gatewayKey());
            <span class="kw">default</span>      -> <span class="kw">throw new</span> UnknownChannelException(channel);  <span class="cm">// fail fast (Day 19)</span>
        };
    }
}

<span class="cm">// every client, everywhere — one honest line:</span>
Notification n = NotificationFactory.create(channel);
n.send(msg);`} />
        <p>Honesty checkpoint: <strong>yes, the switch still exists.</strong> That is not a failure — it is the
          design. Someone must know the catalog; the win is that it's <em>exactly one someone</em>, the clients
          depend only on the <C>Notification</C> interface, and an unknown channel fails loudly in one place
          instead of five quiet if-chains drifting apart.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🌪️ Play: Hunt the scattered new</h2>
        <p>Five features create notifications. Fire the WhatsApp request in both worlds and count the edits.</p>
        <ScatteredNew />
        <Good><strong>What you should notice:</strong> ① The scattered world repeats the if-chain five times —
          five chances for one of them to be subtly different (the EMAIL branch that forgot retries…). ② In
          factory world, the change = one new class + one case line. ③ This is the Day 12 + Day 16 combo:
          OCP for the clients, DRY for the catalog.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>☕ Play: The barista machine</h2>
        <p>Order drinks by name and watch concrete objects come back as the plain <C>Coffee</C> interface. Then
          have the shop add MOCHA — and check whether YOUR side of the counter changed.</p>
        <Barista />
        <Good><strong>What you should notice:</strong> ① The client never names a concrete class — it can't even
          tell a Latte object from an Espresso except through the interface. ② Menu grew; ordering code froze.
          ③ The factory also gets to centralize constructor mess (recipes) — clients ordered with one string
          while the counter handled the ingredients.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Level 2 — the GoF Factory Method (creation by inheritance)</h2>
        <p>The simple factory picks products with a <em>switch on data</em>. The true <strong>Factory Method
          pattern</strong> picks them with <em>inheritance</em>: a base class owns an algorithm but leaves one
          step — <strong>"create the thing"</strong> — as a hook for subclasses:</p>
        <Code html={`<span class="cm">// the product slot:</span>
<span class="kw">public interface</span> Transport { <span class="kw">void</span> deliver(Order o); }
<span class="kw">public class</span> Truck <span class="kw">implements</span> Transport { <span class="cm">/* roads */</span> }
<span class="kw">public class</span> Ship  <span class="kw">implements</span> Transport { <span class="cm">/* sea */</span> }

<span class="cm">// the CREATOR: owns the algorithm, delegates the creation</span>
<span class="kw">public abstract class</span> Logistics {

    <span class="cm">// the fixed algorithm — written ONCE for all branches:</span>
    <span class="kw">public void</span> planDelivery(Order o) {
        validate(o);
        Transport t = createTransport();   <span class="cm">// ← THE FACTORY METHOD (the hook)</span>
        t.deliver(o);
        notifyCustomer(o);
    }

    <span class="cm">// each subclass answers ONE question: "what do you drive?"</span>
    <span class="kw">protected abstract</span> Transport createTransport();
}

<span class="kw">public class</span> RoadLogistics <span class="kw">extends</span> Logistics {
    <span class="kw">protected</span> Transport createTransport() { <span class="kw">return new</span> Truck(); }   <span class="cm">// 🚚</span>
}
<span class="kw">public class</span> SeaLogistics <span class="kw">extends</span> Logistics {
    <span class="kw">protected</span> Transport createTransport() { <span class="kw">return new</span> Ship(); }    <span class="cm">// 🚢</span>
}

<span class="cm">// the client picks a BRANCH — and thereby, invisibly, all its products:</span>
Logistics logistics = <span class="kw">new</span> SeaLogistics();
logistics.planDelivery(order);            <span class="cm">// a Ship sails. No switch anywhere.</span>`} />
        <p>Look at the trick: <C>planDelivery</C> in the BASE class calls <C>createTransport()</C> — and dynamic
          dispatch (Day 4's vtables!) routes it to whichever subclass the object really is. The parent wrote the
          recipe; the child supplies one ingredient. (A fixed algorithm with overridable steps also has its own
          pattern name — Template Method, coming in Week 7.)</p>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🚚 Play: One algorithm, three fleets</h2>
        <p>Pick a branch, then trace <C>planDelivery()</C> tick by tick. Watch exactly where control jumps from
          the base class (🏛️) into the subclass (🏭) and back.</p>
        <FmDispatcher />
        <Good><strong>What you should notice:</strong> ① Steps 1–2 and 5 are IDENTICAL for every branch — the
          algorithm lives once in the base. ② Only step 4 differs, and it's the subclass's one overridden method.
          ③ Switching fleets = picking a different subclass at construction time — creation chosen by TYPE, with
          zero switches.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The JDK is full of factories (static factory methods)</h2>
        <p>Day 22's third face — the one you'll use most often without noticing. Compare:</p>
        <Code html={`List&lt;String&gt; names = List.of(<span class="str">"a"</span>, <span class="str">"b"</span>);     <span class="cm">// returns a hidden immutable class</span>
Optional&lt;User&gt; u = Optional.empty();         <span class="cm">// returns the SAME cached instance every time</span>
Integer n = Integer.valueOf(<span class="num">42</span>);             <span class="cm">// -128..127 are CACHED — same object back!</span>
LocalDate d = LocalDate.of(<span class="num">2026</span>, <span class="num">6</span>, <span class="num">15</span>);     <span class="cm">// named, validating creation</span>`} />
        <p>Why the JDK (and <em>Effective Java</em>, Item 1) prefer these over public constructors:</p>
        <ul>
          <li><strong>They have names.</strong> <C>Money.zero(INR)</C> and <C>DateRange.of(a, b)</C> read like the
            domain; six overloaded constructors read like a puzzle.</li>
          <li><strong>They control instances.</strong> A constructor MUST allocate; a factory may return a cached
            object (<C>valueOf</C>, <C>Optional.empty</C>) — or, taken to the limit, always the same one.
            <em> Yesterday's getInstance() was a static factory all along.</em></li>
          <li><strong>They can return subtypes.</strong> <C>List.of</C> hands you specialized hidden classes;
            you hold the interface, free to be upgraded forever (LSP earning its keep).</li>
          <li><strong>They can refuse.</strong> Validation + a domain exception before any object exists
            (Day 19's fail-fast at the source).</li>
        </ul>
        <Reveal summary="Naming conventions worth recognizing — click to reveal.">
          <p><C>of(…)</C> — aggregating values (<C>List.of</C>) · <C>from(x)</C> — conversion
            (<C>Date.from(instant)</C>) · <C>valueOf</C> — like of, often caching · <C>getInstance()</C> —
            possibly shared instance · <C>newInstance()</C> — guaranteed fresh · <C>parse(s)</C> — from text
            (your Day 20 Email!). Spotting these tells you instantly that creation is being managed, not raw.</p>
        </Reveal>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Which level do I reach for? (the decision guide)</h2>
        <table className="matrix">
          <thead>
            <tr><th>situation</th><th>tool</th><th>why</th></tr>
          </thead>
          <tbody>
            <tr><td>one class, but creation deserves a name / validation / caching</td><td>static factory method on the class</td><td><C>Money.of(…)</C>, <C>Email.parse(…)</C> — smallest hammer</td></tr>
            <tr><td>several products behind one interface, chosen by runtime data</td><td className="yes">simple factory</td><td>the contained switch; covers ~80% of real cases</td></tr>
            <tr><td>a whole ALGORITHM is shared, only the created type varies per family/subclass</td><td>GoF Factory Method</td><td>creation hook + inheritance; frameworks love it</td></tr>
            <tr><td>multiple RELATED products must match each other (a kit)</td><td>Abstract Factory</td><td>tomorrow's pattern — factories of factories</td></tr>
          </tbody>
        </table>
        <Note><strong>Interview phrasing that lands:</strong> "I'd start with a simple factory — it contains the
          catalog in one place. If I notice each variant also needs its own surrounding behavior, I'd graduate to
          Factory Method subclasses. If products come in matching families, Abstract Factory." Escalation, not
          decoration.</Note>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Factory-itis</h3>
        <p><C>PointFactory.createPoint(x, y)</C> wrapping a plain <C>new Point(x, y)</C> — nothing varies, nothing
          is hidden, one more file to read. Factories earn their keep only where there's a varying axis or messy
          construction (YAGNI, Day 16).</p>
        <h3>Trap 2 — The factory that returns concrete types</h3>
        <p><C>public EmailNotification create(…)</C> gives the secret away — clients couple to the concrete class
          anyway and the whole containment is theater. Factories return the INTERFACE.</p>
        <h3>Trap 3 — The god factory</h3>
        <p>One <C>ObjectFactory.create(String anything)</C> making notifications, reports and database rows = a
          junk drawer (Day 17) with a switch. One factory per product FAMILY.</p>
        <h3>Trap 4 — Leaky parameters</h3>
        <p>If clients must pass <C>smtpHost</C> through the factory, they still carry concrete knowledge.
          Construction details come from config/composition root — the client passes only the CHOICE
          (<C>"EMAIL"</C>), not the recipe.</p>
        <h3>Trap 5 — Parallel hierarchy tax (the honest cost of GoF Factory Method)</h3>
        <p>Every new product can demand a new creator subclass too (Truck+RoadLogistics, Drone+DroneLogistics…)
          — two hierarchies growing in lockstep. If the surrounding algorithm does NOT vary by branch, a simple
          factory gets the same containment for half the classes.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Why factories:</strong> every <C>new</C> couples its file to a concrete class. Gather creation behind one door; clients hold interfaces.</li>
          <li><strong>Simple factory:</strong> static <C>create(key)</C> + contained switch + fail-fast default. Not GoF, used daily. The switch existing ONCE is the feature.</li>
          <li><strong>GoF Factory Method:</strong> abstract creator owns the algorithm; <C>protected abstract createX()</C> hook; subclasses pick the product via dynamic dispatch. No switch — selection by type.</li>
          <li><strong>Static factory methods</strong> (Effective Java #1): names, caching/instance control, subtype returns, validation. <C>of / from / valueOf / parse / getInstance</C>.</li>
          <li><strong>Escalation:</strong> static factory → simple factory → Factory Method → Abstract Factory (families, tomorrow).</li>
          <li>Traps: factory-itis · returning concretes · god factory · leaky construction params · parallel hierarchies.</li>
          <li>Family ties: delivers Day 12's "one place knows the list" · uses Day 4's dispatch · Day 19's fail-fast default · Singleton's getInstance() is a static factory with instance control.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary={<>Q: <C>Integer a = 127, b = 127;</C> then <C>a == b</C>? And with 128? (the classic!)</>}>
          <p>127 → <strong>true</strong>; 128 → <strong>false</strong>! Autoboxing calls
            <C> Integer.valueOf()</C>, which CACHES −128..127 — same object back. Outside the range, fresh
            objects → different addresses. The exam point: a static factory silently controlling instances is
            why <C>==</C> on wrappers is russian roulette. Always <C>.equals()</C>.</p>
        </Reveal>
        <Reveal summary="Q: Recite Effective Java Item 1 — the four advantages of static factories.">
          <p>① They have NAMES (<C>Money.zero(INR)</C>) · ② not required to create a NEW object (caching,
            singletons, flyweights) · ③ can return a SUBTYPE of the declared type (hidden implementations) ·
            ④ the returned class can vary by arguments (EnumSet picks RegularEnumSet vs JumboEnumSet by size —
            the showpiece example!). Disadvantage worth adding: classes without public constructors can't be
            subclassed.</p>
        </Reveal>
        <Reveal summary="Q: Simple Factory is not in the GoF book — so what IS the GoF 'Factory Method'?">
          <p>GoF Factory Method = <em>"define an interface for creating an object, but let SUBCLASSES decide
            which class to instantiate."</em> The defining ingredient is the inherited creation HOOK
            (createTransport()), not a switch. Calling a static create() "the Factory Method pattern" is the
            most common pattern-vocabulary mistake — examiners listen for it.</p>
        </Reveal>
        <Reveal summary={<>Q: Is <C>Collection.iterator()</C> a factory method?</>}>
          <p>Yes — a textbook GoF one: the abstract Collection algorithm needs an Iterator but each subclass
            decides WHICH (ArrayList's, HashSet's…). Same with <C>Calendar.getInstance()</C>,
            <C> NumberFormat.getInstance()</C>. Naming a JDK example unprompted beats defining the pattern
            twice.</p>
        </Reveal>
        <Reveal summary="Q: How does a factory cooperate with constructors being private?">
          <p>Make the constructor private and the factory (static method or sibling class in the same package)
            the ONLY door — now you can enforce caching, validation, subtype choice, and even refuse creation.
            Day 21's singleton, Day 20's Email.parse, Day 24's build() are all this one move with different
            policies.</p>
        </Reveal>
        <Reveal summary="Q: The parallel-hierarchy criticism of Factory Method — explain + the escape.">
          <p>Every new Product tends to demand a new Creator subclass (Truck+RoadLogistics, Drone+DroneLogistics)
            — two class trees growing in lockstep, double maintenance. Escapes: simple factory (if only creation
            varies), or parameterized factory method (one creator, argument picks product). Knowing a pattern's
            COST is what separates reciting from understanding.</p>
        </Reveal>
        <Reveal summary="Q: When would you use a registry-based factory (map of suppliers) over a switch?">
          <p>When variants must be added WITHOUT recompiling the factory: <C>Map&lt;String, Supplier&lt;Notification&gt;&gt;</C>
            + <C>register("EMAIL", EmailNotification::new)</C>. Plugins self-register; create() is one map
            lookup. Trade-off: registration order/discovery becomes runtime behavior — fail-fast on unknown
            keys matters even more.</p>
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
        <strong>Day 22 complete?</strong> Homework: upgrade your Day 12 <C>ShippingCalculator</C>. ① Add a
        <C> ShippingStrategyFactory.create(String type)</C> simple factory with a fail-fast default, and convert
        all call sites to use it. ② Then build the GoF version: abstract <C>ShippingLabel</C> printer whose
        <C> printLabel()</C> algorithm is fixed but calls <C>protected abstract ShippingStrategy
        createStrategy()</C> — with <C>StandardLabel</C> and <C>DroneLabel</C> subclasses. ③ Write one paragraph:
        which version fits this problem better, and why? (Hint: does anything BESIDES creation vary per type?)
        <br /><br />
        Next: <strong>Day 23 — Abstract Factory</strong>: what happens when products come in matching FAMILIES —
        and mixing a Victorian chair with a Modern sofa must be made impossible.
      </div>
    </div>
  )
}
