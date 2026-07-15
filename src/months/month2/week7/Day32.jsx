import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The channel ============ */
const SUB_TYPES = [
  ['📧', 'EmailFan'], ['🔔', 'AppUser'], ['📰', 'NewsBot'],
]
let subId = 0

function TheChannel() {
  const [subs, setSubs] = useState([{ id: ++subId, icon: '📧', name: 'EmailFan', log: [] }])
  const [videos, setVideos] = useState(0)

  function subscribe(icon, name) {
    if (subs.length >= 4) return
    setSubs((s) => [...s, { id: ++subId, icon, name, log: [] }])
  }
  const unsubscribe = (id) => setSubs((s) => s.filter((x) => x.id !== id))
  function upload() {
    const n = videos + 1
    setVideos(n)
    setSubs((s) => s.map((x) => ({ ...x, log: [...x.log.slice(-2), `🔔 New video: "LLD Ep.${n}"`] })))
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one creator, many subscribers, zero name-knowing</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={upload}>📹 channel.upload()</button>
        {SUB_TYPES.map(([icon, name]) => (
          <button key={name} className="ghost act" onClick={() => subscribe(icon, name)}>+ subscribe {icon} {name}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="obj" style={{ minWidth: 210, borderColor: 'var(--blue)' }}>
          <div className="oref">📺 Channel (the SUBJECT)</div>
          <div className="ofield">videos = {videos}</div>
          <div className="ofield">subscribers = List&lt;Subscriber&gt; ({subs.length})</div>
          <div className="ofield">knows about them: the interface. Nothing else.</div>
        </div>
        {subs.map((s) => (
          <div className="obj" key={s.id} style={{ minWidth: 190 }}>
            <div className="oref">{s.icon} {s.name}#{s.id}</div>
            {s.log.length === 0
              ? <div className="ofield" style={{ color: '#9aa3b5' }}>…waiting quietly (no polling!)</div>
              : s.log.map((l, i) => <div className="ofield" key={i}>{l}</div>)}
            <button className="ghost act" style={{ fontSize: 11.5, padding: '4px 8px', marginTop: 6 }}
              onClick={() => unsubscribe(s.id)}>unsubscribe()</button>
          </div>
        ))}
      </div>
      <div className="statbar">
        📡 <span>Upload once → everyone currently on the list hears it. Unsubscribe someone, upload again — silence for them, no code changed anywhere.</span>
      </div>
    </div>
  )
}

/* ============ Interactive 2: Order events ============ */
const BASE_OBSERVERS = [
  { key: 'email', icon: '📧', name: 'EmailService', react: (n) => `sending confirmation for order #${n}` },
  { key: 'inv', icon: '📦', name: 'InventoryService', react: (n) => `decrementing stock for order #${n}` },
  { key: 'ana', icon: '📈', name: 'AnalyticsService', react: (n) => `recording revenue of order #${n}` },
]
const FRAUD = { key: 'fraud', icon: '🕵️', name: 'FraudCheckService', react: (n) => `scoring order #${n}… looks clean ✓` }

function OrderEvents() {
  const [observers, setObservers] = useState(BASE_OBSERVERS)
  const [orderNo, setOrderNo] = useState(0)
  const [logs, setLogs] = useState({})

  function place() {
    const n = orderNo + 1
    setOrderNo(n)
    setLogs((l) => {
      const next = { ...l }
      observers.forEach((o) => { next[o.key] = [...(next[o.key] || []).slice(-1), o.react(n)] })
      return next
    })
  }
  const addFraud = () => { if (!observers.some((o) => o.key === 'fraud')) setObservers((o) => [...o, FRAUD]) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · OrderService publishes; reactions subscribe — the LLD version</div>
      <Code html={`<span class="cm">// the SUBJECT — note what it does NOT know:</span>
<span class="kw">public void</span> placeOrder(Cart cart) {
    Order order = createOrder(cart);              <span class="cm">// its real job</span>
    <span class="kw">for</span> (OrderObserver o : observers)             <span class="cm">// then: tell whoever cares</span>
        o.onOrderPlaced(order);                   <span class="cm">// no emails, no stock, no analytics HERE</span>
}`} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={place}>🛒 placeOrder()</button>
        <button className="ghost act" onClick={addFraud} disabled={observers.length > 3}>
          🆕 compliance team subscribes FraudCheck (runtime!)
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {observers.map((o) => (
          <div className="obj" key={o.key} style={{ minWidth: 210, borderColor: o.key === 'fraud' ? 'var(--blue)' : undefined }}>
            <div className="oref">{o.icon} {o.name}</div>
            {(logs[o.key] || []).length === 0
              ? <div className="ofield" style={{ color: '#9aa3b5' }}>subscribed · waiting</div>
              : logs[o.key].map((l, i) => <div className="ofield" key={i}>{l}</div>)}
          </div>
        ))}
      </div>
      <div className="statbar">
        🎯 <span>FraudCheck joined WITHOUT touching OrderService — new reactions are new subscribers, not new lines in placeOrder() (OCP, Day 12, for behavior-on-events).</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: The chaos lab ============ */
function ChaosLab() {
  const [mode, setMode] = useState('naive')
  const [scenario, setScenario] = useState(null) // 'bomb' | 'ghosts'

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the two ways observer systems die in production</div>
      <div className="modbtns">
        <button className={mode === 'naive' ? 'on' : ''} onClick={() => { setMode('naive'); setScenario(null) }}>😇 naive subject</button>
        <button className={mode === 'robust' ? 'on' : ''} onClick={() => { setMode('robust'); setScenario(null) }}>🛡️ robust subject</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => setScenario('bomb')}>💣 observer B throws in update()</button>
        <button className="act" onClick={() => setScenario('ghosts')}>👻 3 screens closed WITHOUT unsubscribe</button>
      </div>
      {scenario === 'bomb' && (
        <div className="statbar" style={{ display: 'block', background: mode === 'naive' ? '#FDECEC' : '#EAF7EF' }}>
          <pre style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre-wrap', margin: 0 }}>
{mode === 'naive'
  ? `notify(): A.update() ✓
        B.update() 💥 NullPointerException — propagates UP through notify()!
        C.update() ✗ NEVER CALLED — and placeOrder() itself just crashed.
One broken subscriber took down the publisher AND every later subscriber.`
  : `notify(): A.update() ✓
        B.update() 💥 caught → log.error("observer B failed", e) → continue
        C.update() ✓
The subject isolates each observer: one bad listener can't sink the broadcast.
(try/catch PER OBSERVER inside the loop — boring, vital.)`}
          </pre>
        </div>
      )}
      {scenario === 'ghosts' && (
        <div className="statbar" style={{ display: 'block', background: mode === 'naive' ? '#FDECEC' : '#EAF7EF' }}>
          <pre style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre-wrap', margin: 0 }}>
{mode === 'naive'
  ? `subscribers = [ liveScreen, 👻 closedScreen1, 👻 closedScreen2, 👻 closedScreen3 ]
Every event still notifies 4 observers — 3 are corpses doing pointless work.
WORSE: the subject's strong references keep the dead screens (and everything
they hold) ALIVE — the GC cannot collect them. This is the famous
LAPSED LISTENER memory leak: the #1 real-world observer bug.`
  : `Screen.close() { channel.unsubscribe(this); }   ← the discipline
subscribers = [ liveScreen ]
Unsubscribe is part of the LIFECYCLE, not an optional courtesy.
(Belt-and-braces alternative: hold listeners by WeakReference.)`}
          </pre>
        </div>
      )}
      {!scenario && (
        <div className="statbar">☠️ <span>Pick a disaster. Both have taken down real products.</span></div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Observer pattern\'s intent is…',
    o: ['To swap algorithms', 'To define a ONE-TO-MANY dependency: when the subject changes, ALL registered dependents are notified automatically — without the subject knowing who they are', 'To queue requests', 'To wrap objects'], a: 1,
    e: 'The channel uploads; every current subscriber hears it. The subject holds a list of an INTERFACE — concrete observers come and go freely.',
    w: { 0: 'Swappable algorithms = Strategy (31).',
         2: 'Requests-as-objects = Command (33).',
         3: 'Wrapping = Week 6 territory.' },
    r: { id: 's1', label: 'Section 1 — the channel' } },
  { q: 'What EXACTLY does the subject know about its observers?',
    o: ['Their concrete classes and purposes', 'Only that each implements the Observer interface and is currently on the list — nothing about who they are or what they do with the news', 'Their memory addresses only', 'Everything, via reflection'], a: 1,
    e: 'That ignorance IS the decoupling: OrderService fires onOrderPlaced() into a list; email, stock, fraud — none of its business. New reactions never edit the subject.',
    w: { 0: 'Knowing concretes would re-couple the subject to every reaction.',
         2: 'It holds references, but the design point is the interface contract.',
         3: 'No reflection involved.' },
    r: { id: 's2', label: 'Section 2 — the structure' } },
  { q: 'Push vs pull notification models — define both.',
    o: ['TCP vs UDP', 'Push: the subject sends the event DATA in the call (onOrderPlaced(order)); pull: it sends only "something changed" and observers query back for what they need', 'Synchronous vs asynchronous', 'Public vs private'], a: 1,
    e: 'Push is convenient but guesses what everyone needs (fat payloads); pull keeps the signal tiny but makes observers chatty (and re-couples them to subject getters). Most real APIs push a focused event object — the middle path.',
    w: { 0: 'Networking terms, different layer.',
         2: 'Threading is an independent axis — both models can be sync or async.',
         3: 'Visibility is unrelated.' },
    r: { id: 's5', label: 'Section 5 — push vs pull' } },
  { q: 'The "lapsed listener" problem is…',
    o: ['Listeners that respond slowly', 'Observers that were never unsubscribed: the subject\'s strong references keep dead objects (closed screens!) alive forever — pointless notifications plus a memory leak', 'Too many listeners', 'A compile error'], a: 1,
    e: 'The #1 production observer bug. Fixes: make unsubscribe part of the component lifecycle (close/dispose), or hold listeners via WeakReference so the GC can reap forgotten ones.',
    w: { 0: 'Slowness is a different trap (blocking the notify loop).',
         2: 'Many LIVE listeners is fine.',
         3: 'It compiles beautifully and leaks silently.' },
    r: { id: 's8', label: 'Section 8 — the chaos lab' } },
  { q: 'Observer #2 throws inside update(). In a naive notify loop, what happens?',
    o: ['Nothing, exceptions are ignored', 'The exception rips up through notify() into the SUBJECT\'s caller, and every observer after #2 is silently never notified — one bad listener sinks the broadcast', 'Only #2 is affected', 'The JVM retries'], a: 1,
    e: 'The cure is dull and essential: try/catch around EACH observer call, log, continue. The subject\'s broadcast must not depend on every stranger\'s code quality.',
    w: { 0: 'Unhandled exceptions never self-ignore.',
         2: 'That\'s the ROBUST behavior — only after you isolate.',
         3: 'No auto-retry exists.' },
    r: { id: 's8', label: 'Section 8 — exception isolation' } },
  { q: 'Why were java.util.Observer/Observable deprecated (Java 9)?',
    o: ['Observers became illegal', 'Observable is a CLASS (steals your one extends — Day 7!), notifies with a typeless Object payload, and its setChanged/notify protocol is clunky — interfaces + your own typed events are simply better', 'They were too fast', 'Lambdas replaced all OOP'], a: 1,
    e: 'A rare official JDK admission of a design mistake. The replacement advice: roll your own listener interfaces, or use PropertyChangeListener / java.util.concurrent.Flow / framework events.',
    w: { 0: 'The PATTERN thrives; that implementation died.',
         2: 'Performance was never the issue.',
         3: 'Lambdas plug INTO listener interfaces happily.' },
    r: { id: 's6', label: 'Section 6 — Java history' } },
  { q: 'button.addActionListener(e -> save()) — which pattern, and who plays whom?',
    o: ['Strategy: the button swaps algorithms', 'Observer: the button is the SUBJECT (click = state change), your lambda is an observer on its listener list — every GUI toolkit runs on this', 'Command only', 'Adapter'], a: 1,
    e: 'Swing/JavaFX/Android/DOM events are observer systems: components keep listener lists and broadcast events. (The listener\'s BODY often wraps a command — patterns stack; Day 33 completes the picture.)',
    w: { 0: 'The button doesn\'t compute differently — it ANNOUNCES.',
         2: 'Command describes the action object; the subscription mechanism is observer.',
         3: 'Nothing is translated.' },
    r: { id: 's6', label: 'Section 6 — listeners everywhere' } },
  { q: 'In-process Observer vs a message broker (Kafka/RabbitMQ) — the honest comparison?',
    o: ['Identical things', 'Same publish-subscribe IDEA, but a broker adds: surviving restarts (durability), async delivery, retries, and publishers/subscribers with independent lifecycles and processes — at the cost of infrastructure', 'Observer is always better', 'Brokers don\'t use events'], a: 1,
    e: 'GoF observer is synchronous, in-memory, lifecycle-coupled. When subscribers live in other services or must not miss events during downtime, the pattern graduates into messaging infrastructure. Same idea, industrial strength.',
    w: { 0: 'The idea is shared; the guarantees differ hugely.',
         2: '"Always" ignores durability and scale needs.',
         3: 'Brokers are MADE of events.' },
    r: { id: 's7', label: 'Section 7 — from pattern to infrastructure' } },
]

/* ============ The page ============ */
export default function Day32() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 7 · Day 32 · Behavioral Patterns</div>
        <h1>Observer:<br />Publish, Subscribe, Never Poll</h1>
        <p>Every notification you have ever received — YouTube upload, price drop, "your order has shipped" —
           runs on today's pattern. One object announces; many objects react; nobody holds anybody's name.
           Click everything.</p>
        <div className="chips">
          {['observer', 'subject', 'subscribe/unsubscribe', 'push vs pull', 'listeners', 'lapsed listener'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The channel and its subscribers</h2>
        <p>A creator uploads a video. A million subscribers get pinged. Now the design questions: does the
          creator <em>know</em> any subscriber? No. Do subscribers <em>refresh the page all day</em> hoping?
          No. Can someone join or leave at 3 a.m.? Yes — and nothing else changes. Compare the two bad
          alternatives software keeps reinventing:</p>
        <Code html={`   ❌ POLLING ("are we there yet?")        ❌ HARDCODED CALLS                ✅ OBSERVER
   while (true) {                        void upload(Video v) {            void upload(Video v) {
     if (channel.hasNew()) …               emailFan.tell(v);    ← coupled    <span class="kw">for</span> (Subscriber s : subs)
     sleep(1000);   // 86,400              appUser.tell(v);     ← to every     s.onUpload(v);
   }                // wasted              newsBot.tell(v);     ← reaction   }
   // checks/day, per client               // new fan? EDIT ME  ← forever    // list of an INTERFACE</span>`} />
        <Note><strong>Observer's intent:</strong> define a <strong>one-to-many</strong> dependency between
          objects, so that when the SUBJECT changes state, all its registered OBSERVERS are notified
          automatically — without the subject knowing who they are.</Note>
        <Code html={`<span class="cm">// Observer pattern — core mental model</span>

┌─────────────────────────────────┐
│  Subject (Channel)              │
│─────────────────────────────────│
│ - subscribers: List&lt;Observer&gt;  │
│─────────────────────────────────│
│ + subscribe(o: Observer)        │
│ + unsubscribe(o: Observer)      │
│ + notifyAll(event: Event)       │  ← calls o.update(event) on each
└────────────┬────────────────────┘
             │ notifies (1 → many)
             ▼
    ┌────────────────────┐
    │  &lt;&lt;interface&gt;&gt;     │
    │  Observer          │
    │────────────────────│
    │ + update(e: Event) │
    └────────┬───────────┘
             │ implements
    ┌────────┴────────────────────────────────┐
    ▼                    ▼                    ▼
┌──────────┐      ┌───────────┐       ┌────────────┐
│ EmailFan │      │ AppNotify │       │  NewsBot   │
│──────────│      │───────────│       │────────────│
│update(e) │      │update(e)  │       │update(e)   │
└──────────┘      └───────────┘       └────────────┘

Key: Subject does NOT import EmailFan, AppNotify, or NewsBot.
     Each depends on the Observer INTERFACE — not on each other.`} />
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The structure (four moving parts)</h2>
        <Code html={`<span class="cm">// the OBSERVER contract — what every subscriber promises:</span>
<span class="kw">public interface</span> Subscriber {
    <span class="kw">void</span> onUpload(Video v);                  <span class="cm">// the "push" model — event data included</span>
}

<span class="cm">// the SUBJECT — owns state + the subscription book:</span>
<span class="kw">public class</span> Channel {
    <span class="kw">private final</span> List&lt;Subscriber&gt; subs = <span class="kw">new</span> ArrayList&lt;&gt;();

    <span class="kw">public void</span> subscribe(Subscriber s)   { subs.add(s); }
    <span class="kw">public void</span> unsubscribe(Subscriber s) { subs.remove(s); }   <span class="cm">// as vital as subscribe!</span>

    <span class="kw">public void</span> upload(Video v) {
        save(v);                              <span class="cm">// 1. the actual state change</span>
        <span class="kw">for</span> (Subscriber s : List.copyOf(subs))<span class="cm"> // 2. broadcast (copy: see §9!)</span>
            s.onUpload(v);
    }
}

<span class="cm">// CONCRETE observers — any class can join the audience:</span>
<span class="kw">public class</span> EmailFan <span class="kw">implements</span> Subscriber {
    <span class="kw">public void</span> onUpload(Video v) { mailer.send(<span class="str">"New: "</span> + v.title()); }
}`} />
        <p>The dependency arrows are the point (Day 17 eyes on): concrete observers depend on the subject's
          events; the subject depends on NOTHING concrete — just its own little interface. Reactions multiply;
          the publisher never reopens (Day 12).</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>📺 Play: Run the channel</h2>
        <p>Upload, subscribe, unsubscribe, upload again — watch who hears what.</p>
        <TheChannel />
        <Good><strong>What you should notice:</strong> ① Subscribers wait silently — zero polling, zero wasted
          checks. ② The membership list changes at RUNTIME; the upload code never does. ③ The channel card
          admits everything it knows: a count and an interface. That modest knowledge is the whole
          architecture.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🛒 Play: Order placed — who cares?</h2>
        <p>The same pattern doing serious LLD work: <C>placeOrder()</C> stays a pure order-creator while
          reactions accumulate around it. Mid-demo, let compliance subscribe their new fraud check:</p>
        <OrderEvents />
        <Good><strong>What you should notice:</strong> ① Look at placeOrder()'s body — no email, no stock, no
          analytics: the subject kept its single responsibility (Day 11) by EVICTING the reactions. ② FraudCheck
          arrived as a SUBSCRIPTION, not an edit — the event is an extension point (Day 12's slot, behavioral
          edition). ③ Each reaction is separately ownable, testable, removable — three teams, zero shared
          files (Day 17's blast radius).</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Push vs pull (what travels in the call?)</h2>
        <table className="matrix">
          <thead>
            <tr><th></th><th>PUSH — notify(eventData)</th><th>PULL — notify(), then ask</th></tr>
          </thead>
          <tbody>
            <tr><td>the call</td><td><C>onOrderPlaced(order)</C></td><td><C>onChanged()</C> → observer calls <C>subject.getX()</C></td></tr>
            <tr><td>good</td><td className="yes">one call, observers stay decoupled from subject getters</td><td className="yes">tiny signal; each observer fetches ONLY what it needs</td></tr>
            <tr><td>bad</td><td>subject guesses everyone's needs; payloads fatten over time</td><td>chatty; observers re-coupled to subject's query API; state may CHANGE between notify and pull!</td></tr>
          </tbody>
        </table>
        <Note><strong>The modern middle path:</strong> push a small, immutable, FOCUSED event object
          (<C>OrderPlacedEvent(orderId, total, ts)</C> — a record! Day 20). Immutability matters doubly here:
          one event instance fans out to many observers — shared state again (Day 30's rule).</Note>
      </section>

      {/* 6 — section id used by quiz r as s6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Observer all over Java (past, present, framework)</h2>
        <ul>
          <li><strong>The deprecated ancestors:</strong> <C>java.util.Observer/Observable</C> (Java 1.0,
            deprecated in 9) — Observable is a CLASS (spends your one extends, Day 7), pushes a typeless
            <C> Object</C>, and needs a clunky <C>setChanged()</C> dance. The JDK officially says: build your
            own typed listener interfaces instead. Knowing WHY it died is the interview point.</li>
          <li><strong>Every GUI ever:</strong> <C>button.addActionListener(e -&gt; save())</C> — components are
            subjects, your lambdas are observers. Swing, JavaFX, Android, the DOM: one pattern.</li>
          <li><strong>JavaBeans:</strong> <C>PropertyChangeListener/Support</C> — fine-grained "field X changed"
            observation, still alive in desktop code.</li>
          <li><strong>Frameworks:</strong> Spring <C>ApplicationEventPublisher</C> + <C>@EventListener</C>
            (today's order demo, productionized); <C>java.util.concurrent.Flow</C> — observer grown up into
            reactive streams WITH backpressure (Month 4 adjacency).</li>
          <li><strong>MVC's secret engine:</strong> the Model is a subject; Views are observers. "How do three
            views stay in sync with one model?" — they subscribe. MVC is Observer wearing an architecture
            diagram.</li>
        </ul>
      </section>

      {/* 7 — keep numbering for r pointers */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>From pattern to infrastructure</h2>
        <p>Scale the idea up: publisher and subscribers in DIFFERENT PROCESSES, events that must survive a
          crash, subscribers that were offline for an hour — now the listener list becomes a <strong>message
          broker</strong> (Kafka, RabbitMQ, SQS). Same publish-subscribe soul; added durability, async delivery,
          retries, independent lifecycles — and added infrastructure cost. The design instinct transfers
          one-to-one; only the guarantees change. (Notification System, Month 3 Week 12, builds exactly this
          bridge.)</p>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>☠️ Play: The chaos lab</h2>
        <p>Two disasters, both legendary in production. Trigger each in both worlds:</p>
        <ChaosLab />
        <Good><strong>What you should notice:</strong> ① One throwing observer, naive loop: the PUBLISHER crashes
          and later observers starve — isolation (try/catch per observer) is non-negotiable. ② Forgotten
          unsubscribes leave ghosts the GC cannot collect (strong refs!) — the lapsed listener leak. Unsubscribe
          belongs to the lifecycle; WeakReference is the safety net.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Depending on notification ORDER</h3>
        <p>"Email always fires before Analytics, so I'll sneak a dependency in…" — the list order is an
          implementation accident. If B needs A's result, that's a workflow (chain them explicitly), not two
          independent observers.</p>
        <h3>Trap 2 — Unsubscribing during notify (ConcurrentModificationException)</h3>
        <p>An observer that unsubscribes ITSELF inside update() mutates the list mid-iteration → CME. Fixes:
          iterate a COPY (<C>List.copyOf(subs)</C>, as our Channel did) or use
          <C> CopyOnWriteArrayList</C> — built precisely for listener lists (rare writes, constant reads).</p>
        <h3>Trap 3 — The notification loop (reentrancy)</h3>
        <p>Observer reacts by MUTATING the subject → which notifies → which mutates… stack overflow or
          infinite churn. Guard: subjects can suppress re-entrant notify, or observers must never write back
          synchronously. (Two subjects observing each other: same disease, two hosts.)</p>
        <h3>Trap 4 — One slow observer freezes the world</h3>
        <p>Synchronous notify means the upload waits for every subscriber's reaction — one 3-second email call
          and your checkout is 3 seconds slower. Options: keep observers trivial, or dispatch async (executor/
          event queue) — accepting that "happened" and "handled" now differ in time.</p>
        <h3>Trap 5 — Event-soup architecture</h3>
        <p>When EVERYTHING is an event, nothing has a readable flow: "who handles OrderPlaced?" returns nine
          scattered answers and debugging becomes archaeology. Observer is for genuine broadcast reactions;
          a known, required sequence (reserve → charge → ship) is a FACADE/workflow (Day 29), not a firework
          of events.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> one-to-many; subject broadcasts state changes to a runtime list of interface-typed observers. Kills polling AND hardcoded reaction calls.</li>
          <li><strong>Structure:</strong> Subject (state + subscribe/unsubscribe/notify) · Observer interface · concretes. Subject knows nothing concrete → reactions are extension points (OCP).</li>
          <li><strong>Push vs pull:</strong> data-in-call vs signal-then-query; modern default = push a small immutable event record.</li>
          <li><strong>Production armor:</strong> try/catch per observer · iterate a copy / CopyOnWriteArrayList · unsubscribe in lifecycle (lapsed listener!) · beware reentrancy · async for slow observers.</li>
          <li>Java: Observable deprecated (class, untyped, clunky) · GUI listeners · PropertyChangeListener · Spring events · Flow (reactive). MVC = model-as-subject.</li>
          <li>Scaled up: broker pub-sub (durability, async, independent lifecycles) — same soul, industrial guarantees.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: GoF's alternate names for Observer?">
          <p><strong>Publish-Subscribe</strong> and <strong>Dependents</strong>. Worth adding: many architects
            reserve "pub-sub" for the BROKERED version (publisher and subscriber don't even share a process)
            and "observer" for the in-memory GoF version — a distinction that sounds senior because it is.</p>
        </Reveal>
        <Reveal summary="Q: How exactly do WeakReferences fix the lapsed listener leak — and the catch?">
          <p>The subject stores <C>WeakReference&lt;Subscriber&gt;</C>: if nobody else references a listener,
            the GC reclaims it; the subject purges dead refs while notifying. The catch: lifetime becomes
            GC-dependent (listeners can vanish "randomly" if you forgot to hold them elsewhere) — explicit
            unsubscribe remains the primary discipline; weak refs are the safety net.</p>
        </Reveal>
        <Reveal summary="Q: Why is CopyOnWriteArrayList THE listener-list collection?">
          <p>Every write copies the whole array — expensive for hot writes, perfect for listener lists:
            subscriptions are rare, notifications constant. Iterators see a stable snapshot → no
            ConcurrentModificationException even if someone (un)subscribes mid-broadcast, and no locking on the
            read path. Textbook "know your workload" answer.</p>
        </Reveal>
        <Reveal summary="Q: Should notify() run on the caller's thread? The UI rule?">
          <p>Default GoF: yes, synchronous — simple, ordered, but couples publisher latency to subscriber speed.
            UI toolkits add a hard rule: events are delivered ON the UI thread, and slow handlers freeze the
            app — hence "do work off-thread, update UI back on it." Server-side: async dispatch via executor
            decouples, at the price of eventual handling and error-routing questions.</p>
        </Reveal>
        <Reveal summary="Q: Observer vs Mediator (Week 8) — both decouple many objects. Difference?">
          <p>Direction and knowledge: Observer = ONE subject broadcasting outward to unknown many. Mediator =
            many colleagues talking to EACH OTHER through a central hub that knows them all. Broadcast tree vs
            switchboard. (And yes — mediators often use observer internally to hear colleagues. Patterns
            stack.)</p>
        </Reveal>
        <Reveal summary="Q: An @EventListener updates a read model. The transaction rolls back. What went wrong?">
          <p>The event fired DURING the transaction; the rollback undid the order but not the reaction. That's
            why Spring has <C>@TransactionalEventListener(phase = AFTER_COMMIT)</C> — broadcast only once the
            state change is real. Deep, practical, and exactly the kind of bug that teaches the difference
            between "state changed" and "state committed".</p>
        </Reveal>
        <Reveal summary="Q: How does Observer power MVC — and what goes wrong without it?">
          <p>Model = subject; views subscribe and re-render on change. Without it, either views poll (waste +
            lag) or the model imports view classes (the dependency arrow pointing at the UI — DIP inverted the
            WRONG way, untestable model). "The model must not know the view exists; observer is how it still
            updates" is the one-sentence MVC answer.</p>
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
        <strong>Day 32 complete?</strong> Homework: build the price-drop notifier every shopping app has.
        <C> Product</C> (subject) with <C>setPrice()</C> that notifies on DECREASE only; observers
        <C> EmailAlert</C>, <C>AppPush</C>, and <C>PriceHistoryLogger</C>, receiving an immutable
        <C> PriceDropEvent(productId, oldPrice, newPrice)</C> record. Requirements: ① per-observer try/catch
        (prove it: make one observer throw, others must still fire); ② iterate a copy and demonstrate an
        observer unsubscribing itself mid-notification WITHOUT a ConcurrentModificationException; ③ a
        <C> main</C> showing subscribe → drop → unsubscribe → drop. Bonus: hold one observer via WeakReference,
        null the outside reference, force gc, and watch the ghost vanish.
        <br /><br />
        Next: <strong>Day 33 — Command</strong>: turning a method call into an OBJECT you can queue, log,
        schedule — and undo. The pattern behind every Ctrl+Z you have ever pressed.
      </div>
    </div>
  )
}
