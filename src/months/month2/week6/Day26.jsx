import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The travel plug ============ */
function TravelPlug() {
  const [state, setState] = useState('idle') // idle | direct | adapted

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Indian laptop charger, American wall — two attempts</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button className="act" onClick={() => setState('direct')}>🔌 plug in directly</button>
        <button className="act" onClick={() => setState('adapted')}>🧩 plug in through the adapter</button>
        <button className="ghost act" onClick={() => setState('idle')}>reset</button>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="obj" style={{ minWidth: 150 }}>
          <div className="oref">your charger 🔌</div>
          <div className="ofield">pins: ROUND (Indian)</div>
          <div className="ofield">expects: 3 round holes</div>
        </div>
        {state === 'adapted' && (
          <div className="obj" style={{ minWidth: 160, borderColor: 'var(--blue)' }}>
            <div className="oref">the adapter 🧩</div>
            <div className="ofield">front: 3 round holes ✓</div>
            <div className="ofield">back: 2 flat pins ✓</div>
            <div className="ofield">changes NO electricity</div>
          </div>
        )}
        <div className="obj" style={{ minWidth: 150 }}>
          <div className="oref">US wall socket 🇺🇸</div>
          <div className="ofield">slots: FLAT</div>
          <div className="ofield">offers: 110V power</div>
        </div>
        <div style={{ fontSize: 34, minWidth: 50 }}>
          {state === 'direct' && '❌'}
          {state === 'adapted' && '💡'}
        </div>
      </div>
      <div className="statbar" style={{ background: state === 'direct' ? '#FDECEC' : state === 'adapted' ? '#EAF7EF' : '#FFF6E8' }}>
        {state === 'idle' && <span>🔋 The charger works. The wall has power. They just don't FIT. Try both buttons.</span>}
        {state === 'direct' && <span>❌ <span>Round pins, flat slots — physically incompatible. Note what you did NOT consider: rewiring the hotel, or buying a new laptop. Both sides are fine; only the SHAPES disagree.</span></span>}
        {state === 'adapted' && <span>💡 <span>Power flows! The adapter changed neither the charger nor the wall — it only TRANSLATES one shape into the other. That, exactly, is today's pattern.</span></span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: The legacy rescue trace ============ */
const RESCUE_TRACE = [
  { line: 'alertService.notifyOps("Server down!")', who: 'client',
    note: 'Your app code runs. It was written against YOUR Notifier interface months ago — and it will not be rewritten today.' },
  { line: 'notifier.send("Server down!")   // notifier is typed as Notifier', who: 'client',
    note: 'The client speaks its own language: one method, send(msg). It has no idea Slack exists.' },
  { line: 'SlackAdapter.send("Server down!")   // the adapter IS a Notifier', who: 'adapter',
    note: 'Dynamic dispatch lands in the adapter — it implements Notifier, so it fits the socket your code expects.' },
  { line: 'translate: channel = "#alerts" · prefix = "🚨" · text = msg', who: 'adapter',
    note: 'THE TRANSLATION STEP — the adapter\'s whole job. It maps your one-argument world onto Slack\'s three-argument world: fills the channel, picks the emoji, reshapes the text.' },
  { line: 'slackClient.postToChannel("#alerts", "🚨 Server down!")', who: 'adaptee',
    note: 'The vendor\'s class is called in ITS native tongue — completely unmodified. It never learns your Notifier interface exists.' },
  { line: '💬 #alerts: 🚨 Server down!', who: 'result',
    note: 'Message delivered. Tomorrow you buy a TeamsClient? Write TeamsAdapter — your app and the vendors all stay untouched (OCP, Day 12).' },
]

function LegacyRescue() {
  const [world, setWorld] = useState('without')
  const [step, setStep] = useState(-1)
  const cur = step >= 0 ? RESCUE_TRACE[step] : null

  return (
    <div className="panel">
      <div className="ptitle">Live demo · your app speaks Notifier; the new Slack jar speaks Slack-ish</div>
      <div className="modbtns">
        <button className={world === 'without' ? 'on' : ''} onClick={() => { setWorld('without'); setStep(-1) }}>❌ without adapter</button>
        <button className={world === 'with' ? 'on' : ''} onClick={() => { setWorld('with'); setStep(-1) }}>🧩 with adapter</button>
      </div>
      {world === 'without' ? (
        <div>
          <Code html={`<span class="cm">// your interface (frozen: 40 call sites)     // the vendor's class (frozen: it's a jar)</span>
<span class="kw">interface</span> Notifier { <span class="kw">void</span> send(String msg); } <span class="kw">class</span> SlackClient { <span class="kw">void</span> postToChannel(String ch, String text) {…} }

Notifier notifier = <span class="kw">new</span> SlackClient();   <span class="cm">// ❌ COMPILE ERROR:</span>
<span class="cm">// incompatible types: SlackClient cannot be converted to Notifier</span>`} />
          <div className="statbar" style={{ background: '#FDECEC' }}>
            🧱 <span>Right method, wrong shape. You can't edit the jar, and editing 40 call sites is shotgun surgery (Day 17). Switch worlds →</span>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button className="act" onClick={() => setStep((s) => Math.min(s + 1, RESCUE_TRACE.length - 1))} disabled={step >= RESCUE_TRACE.length - 1}>
              {step < 0 ? '▶ alert ops!' : 'next →'}
            </button>
            <button className="ghost act" onClick={() => setStep(-1)}>reset</button>
          </div>
          <div className="heap">
            {RESCUE_TRACE.slice(0, step + 1).map((t, i) => (
              <div key={i} style={{
                fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '4px 8px', borderRadius: 6,
                background: i === step ? (t.who === 'adapter' ? '#FFF1D6' : t.who === 'adaptee' ? '#EAF7EF' : '#EEF2FF') : 'transparent',
                fontWeight: i === step ? 700 : 400,
              }}>
                {t.who === 'client' ? '🏠 ' : t.who === 'adapter' ? '🧩 ' : t.who === 'adaptee' ? '📦 ' : '💬 '}{t.line}
              </div>
            ))}
            {step < 0 && <div className="empty">Press play and watch the message cross the language border.</div>}
          </div>
          {cur && <div className="statbar">💡 <span>{cur.note}</span></div>}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: Which wrapper is it? ============ */
const WRAPPER_ITEMS = [
  { d: 'new InputStreamReader(inputStream) — wraps a byte stream so code expecting a character Reader can use it.',
    a: 'adapter', why: 'Different INTERFACE on the outside (Reader) than the inside (InputStream): bytes are translated to characters. The JDK\'s most famous adapter — its javadoc even says "a bridge from byte streams to character streams".' },
  { d: 'new BufferedInputStream(inputStream) — wraps a byte stream and returns… another InputStream, now with buffering.',
    a: 'decorator', why: 'SAME interface in and out — what changed is BEHAVIOR (buffering added). Adding features while keeping the interface = Decorator, tomorrow\'s pattern.' },
  { d: 'class CheckoutFront { placeOrder(cart) { inventory.reserve(...); payment.charge(...); shipping.book(...); } } — one simple door to three subsystems.',
    a: 'facade', why: 'Nothing is translated and nothing is added — MANY complex classes are hidden behind ONE simple entry point. That\'s Facade (Day 29).' },
  { d: 'class SecureDocumentAccess implements DocumentStore — checks the caller\'s permissions, then forwards the same calls to the real DocumentStore.',
    a: 'proxy', why: 'Same interface, no new features — it CONTROLS ACCESS to the real object (guarding, lazy-loading, caching are classic proxy jobs). Day 29\'s second pattern.' },
  { d: 'Your code defines JsonSource { JsonNode fetch(); } and you write a small class wrapping a third-party XML library to implement it.',
    a: 'adapter', why: 'A foreign interface (XML lib) translated into the one YOUR clients expect — including converting the data format. Bonus: you also applied Day 14\'s ISP move (own narrow interface + adapt the alien).' },
  { d: 'You wrap your OWN OrderService — whose source you freely edit — in an OrderServiceWrapper that just renames two methods.',
    a: 'none', why: 'You own both sides! Just RENAME the methods (one refactor, IDE does it). Adapters are for boundaries you cannot change — wrapping your own editable code is indirection without cause (YAGNI/KISS, Day 16).' },
]
const WRAPPER_CHOICES = [['adapter', '🧩 Adapter'], ['decorator', '🎁 Decorator'], ['facade', '🚪 Facade'], ['proxy', '🛡️ Proxy'], ['none', '✋ none — just refactor']]

function WrapperGame() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= WRAPPER_ITEMS.length
  const cur = WRAPPER_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · four wrappers walk into a code review — name each one</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {WRAPPER_ITEMS.length}</b>{score === WRAPPER_ITEMS.length ? ' — you can tell the wrapper family apart by INTENT.' : '. Re-read the family table and replay — this exact distinction is an interview staple.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            🕵️ <span>wrapper {idx + 1} of {WRAPPER_ITEMS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.d}</p>
          <div className="modbtns">
            {WRAPPER_CHOICES.map(([k, label]) => (
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
                <button className="ghost act" onClick={next}>Next wrapper →</button>
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
  { q: 'The Adapter pattern\'s intent is…',
    o: ['To add new features to an object', 'To convert the interface of an existing class into the interface clients expect — making incompatibles work together without modifying either', 'To hide a whole subsystem', 'To create families of objects'], a: 1,
    e: 'Both sides stay untouched: the client keeps its expected interface, the adaptee keeps its native one, and the adapter translates between them — the travel plug.',
    w: { 0: 'Adding features with the SAME interface is Decorator (tomorrow).',
         2: 'Hiding a subsystem behind one door is Facade (Day 29).',
         3: 'Families are Abstract Factory (Day 23).' },
    r: { id: 's1', label: 'Section 1 — the travel plug' } },
  { q: 'When is Adapter the RIGHT tool (vs just changing the code)?',
    o: ['Whenever two classes talk', 'When you cannot or should not modify either side: vendor jars, legacy frozen code, or interfaces with many existing clients', 'Only for streams', 'When both classes are yours and editable'], a: 1,
    e: 'Adapters live at boundaries you don\'t control. If you own both sides and can edit freely, a rename/refactor is simpler and honest (the game\'s trap question).',
    w: { 0: 'Most collaborations need no translation at all.',
         2: 'Streams are one famous example, not the definition.',
         3: 'Owning both sides = just refactor; an adapter there is ceremony.' },
    r: { id: 's2', label: 'Section 2 — the boundary problem' } },
  { q: 'The OBJECT adapter\'s structure is…',
    o: ['extends the adaptee and overrides everything', 'implements the TARGET interface and HOLDS the adaptee as a field, delegating with translation', 'A static utility class of conversion methods', 'A subclass of the client'], a: 1,
    e: 'implements Notifier + private SlackClient field: the adapter IS what the client wants and HAS what actually does the work — Day 7\'s composition + delegation, with a translation step inside.',
    w: { 0: 'Pure extension is the class-adapter flavor — and it can\'t also BE the target in Java unless the target is an interface.',
         2: 'Static converters transform DATA; adapters stand in as OBJECTS.',
         3: 'Clients are never subclassed — they stay untouched.' },
    r: { id: 's4', label: 'Section 4 — the structure' } },
  { q: 'Why does Java favor the object adapter over the GoF class adapter (which inherits from the adaptee)?',
    o: ['Objects are faster than classes', 'Java has single class inheritance — and composition keeps the adaptee\'s full API hidden, swappable, and lets one adapter wrap any subclass of the adaptee', 'Class adapters are deprecated', 'The JVM forbids inheritance across jars'], a: 1,
    e: 'Class adapters spend your one extends, leak every public adaptee method through the adapter, and bind to ONE concrete class. Composition (Day 7!) avoids all three.',
    w: { 0: 'Performance is identical.',
         2: 'Nothing deprecated — just disadvantaged.',
         3: 'Cross-jar inheritance is fine technically.' },
    r: { id: 's6', label: 'Section 6 — class vs object adapter' } },
  { q: 'Which JDK class is the canonical Adapter?',
    o: ['ArrayList', 'InputStreamReader — it makes a byte InputStream usable wherever a character Reader is expected', 'System.out', 'HashMap'], a: 1,
    e: 'Its own documentation calls it "a bridge from byte streams to character streams": foreign interface in, expected interface out, with real translation (charset decoding) inside.',
    w: { 0: 'ArrayList is a plain collection.',
         2: 'System.out is a PrintStream field.',
         3: 'HashMap stores pairs — wraps nothing.' },
    r: { id: 's7', label: 'Section 7 — JDK sightings' } },
  { q: 'Adapter vs Decorator — the one-line distinction?',
    o: ['They are identical', 'Adapter CHANGES the interface (translation); Decorator KEEPS the interface and adds behavior', 'Adapter is newer', 'Decorator only works on streams'], a: 1,
    e: 'Both wrap. Judge by what the CLIENT sees: a different interface than the wrapped thing = adapter; the same interface with extra powers = decorator.',
    w: { 0: 'Same shape, different intent — the family table exists because people confuse them.',
         2: 'Both are 1994 GoF patterns.',
         3: 'Streams just happen to showcase both.' },
    r: { id: 's8', label: 'Section 8 — the wrapper family' } },
  { q: 'How much logic belongs INSIDE an adapter?',
    o: ['As much as needed — it\'s a class like any other', 'Translation only: mapping names, formats, units, defaults. Business rules in an adapter hide policy in a place nobody looks', 'None — adapters must be empty', 'All validation for the whole app'], a: 1,
    e: 'An adapter is a power plug: change the shape, never the electricity. The moment it makes BUSINESS decisions (discounts, retries-policy, filtering), that policy is buried where no one will find or test it.',
    w: { 0: '"Any logic anywhere" is how policy gets lost in plumbing.',
         2: 'Empty would mean nothing translated — defaults and format mapping ARE its job.',
         3: 'App-wide validation belongs at the domain boundary (Day 20\'s parse-don\'t-validate).' },
    r: { id: 's9', label: 'Section 9 — Trap 1: the smuggling adapter' } },
  { q: 'How do Adapter and ISP (Day 14) combine at a messy boundary?',
    o: ['They conflict — pick one', 'Define YOUR OWN narrow role interface for what you actually need, then write a small adapter from the fat/alien API to it — clients depend only on the lean contract', 'Implement the vendor\'s interface everywhere', 'Copy the vendor\'s code into your repo'], a: 1,
    e: 'Day 14 promised this combo: the narrow interface keeps your modules clean (ISP), the adapter quarantines the vendor\'s shape at the edge (and DIP smiles too — you own the abstraction).',
    w: { 0: 'They\'re a famous duo, not rivals.',
         2: 'Spreading the vendor\'s interface couples your whole app to it.',
         3: 'Vendoring code copies the problem in.' },
    r: { id: 's7', label: 'Section 7 — the ISP + Adapter combo' } },
]

/* ============ The page ============ */
export default function Day26() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 6 · Day 26 · Structural Patterns</div>
        <h1>Adapter:<br />The Travel Plug of Software</h1>
        <p>Welcome to Week 6 — structural patterns: the creational week asked "who makes the objects?";
           this week asks "how do existing objects FIT together?" We start with the pattern you'll write
           within your first month at any job: making yesterday's incompatible class fit today's socket —
           without rewiring either. Click everything.</p>
        <div className="chips">
          {['adapter', 'wrapper', 'target/adaptee', 'object vs class adapter', 'InputStreamReader', 'legacy rescue'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The travel plug</h2>
        <p>You land in America with an Indian laptop charger. Round pins; the wall has flat slots. Notice the
          three things you do NOT do: you don't rewire the hotel, you don't buy a new laptop, and you don't give
          up. You buy a <strong>₹200 adapter</strong> — a dumb little block whose front speaks "round pins" and
          whose back speaks "flat slots". It changes <em>no electricity</em>. It only translates shapes.</p>
        <Note><strong>Adapter's intent:</strong> convert the interface of an existing class into the interface
          clients expect — so two incompatibles cooperate <strong>without modifying either one</strong>.
          GoF's alternate name for it: <em>Wrapper</em>.</Note>
        <Code html={`        THE ADAPTER IDEA

   YOUR CLIENT CODE                 THE ADAPTER 🧩                THE FOREIGN CLASS
   speaks: Notifier            front: implements Notifier        speaks: Slack-ish
   notifier.send(msg)  ──────▶ send(msg) {                  ┌──▶ postToChannel(ch, text)
                               translate: pick channel,     │    (vendor jar — frozen)
   (frozen: 40 call sites)     reshape text ───────────────-┘
                               }
   nobody changed ✅            ~20 lines, all translation     nobody changed ✅`} />
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The boundary problem (why "just change it" fails)</h2>
        <p>Your app has a <C>Notifier</C> interface with 40 call sites. The company adopts Slack; you add the
          vendor's jar and find <C>SlackClient.postToChannel(channel, text)</C>. Two doors are locked:</p>
        <ul>
          <li><strong>Can't change the adaptee:</strong> it's a compiled jar (or legacy code nobody dares touch,
            or another team's API with its own roadmap).</li>
          <li><strong>Shouldn't change the clients:</strong> editing 40 call sites to speak Slack-ish is shotgun
            surgery (Day 17) — and couples your whole app to one vendor (bye-bye DIP, Day 15).</li>
        </ul>
        <p>Both classes work perfectly. Only their <strong>shapes</strong> disagree — and shapes are exactly what
          adapters fix.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🔌 Play: The hotel wall</h2>
        <p>Try the direct plug first.</p>
        <TravelPlug />
        <Good><strong>What you should notice:</strong> ① Neither side was broken — incompatibility is about
          INTERFACES, not abilities. ② The adapter changed nothing about the power, only the shape. ③ It's
          small, dumb and disposable — exactly the qualities a good code adapter has.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The structure (object adapter — the one you'll write)</h2>
        <Code html={`<span class="cm">// the TARGET — the interface your clients already speak (frozen):</span>
<span class="kw">public interface</span> Notifier {
    <span class="kw">void</span> send(String message);
}

<span class="cm">// the ADAPTEE — the foreign class (vendor jar, frozen):</span>
<span class="kw">public class</span> SlackClient {
    <span class="kw">public void</span> postToChannel(String channel, String text) { <span class="cm">/* vendor magic */</span> }
}

<span class="cm">// the ADAPTER — the only new code. Implements the target, HOLDS the adaptee:</span>
<span class="kw">public class</span> SlackAdapter <span class="kw">implements</span> Notifier {
    <span class="kw">private final</span> SlackClient slack;        <span class="cm">// composition (Day 7) — has-a, not is-a</span>
    <span class="kw">private final</span> String channel;

    <span class="kw">public</span> SlackAdapter(SlackClient slack, String channel) {
        <span class="kw">this</span>.slack = slack;
        <span class="kw">this</span>.channel = channel;
    }

    @Override
    <span class="kw">public void</span> send(String message) {
        <span class="cm">// 🔁 THE TRANSLATION — the adapter's entire reason to exist:</span>
        String slackText = <span class="str">"🚨 "</span> + message;          <span class="cm">// reshape the format</span>
        slack.postToChannel(channel, slackText);     <span class="cm">// speak the native tongue</span>
    }
}

<span class="cm">// wiring, at the composition root (Day 15):</span>
Notifier notifier = <span class="kw">new</span> SlackAdapter(<span class="kw">new</span> SlackClient(), <span class="str">"#alerts"</span>);`} />
        <p>GoF participant names, worth using out loud: <strong>Target</strong> (the expected interface),
          <strong> Adaptee</strong> (the foreign class), <strong>Adapter</strong> (the translator),
          <strong> Client</strong> (your unchanged code). And note: translation is often more than renaming —
          reordering parameters, converting <strong>formats and units</strong> (XML→JSON, bytes→chars,
          paise→Money), supplying defaults the adaptee demands.</p>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🚨 Play: The legacy rescue</h2>
        <p>First see the compile error the adapter exists to cure — then trace one alert across the language
          border, step by step.</p>
        <LegacyRescue />
        <Good><strong>What you should notice:</strong> ① The client's line never mentions Slack — it still speaks
          Notifier. ② The highlighted translation step is the adapter's WHOLE value: channel chosen, format
          reshaped. ③ The vendor class ran completely unmodified. Three parties, one new ~20-line file.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Class adapter vs object adapter (the GoF footnote)</h2>
        <p>GoF describes two flavors. The <strong>class adapter</strong> INHERITS from the adaptee (and
          implements the target); the <strong>object adapter</strong> — what you just built — composes it.
          Java's verdict is firmly for composition:</p>
        <table className="matrix">
          <thead>
            <tr><th></th><th>class adapter (extends)</th><th>object adapter (holds)</th></tr>
          </thead>
          <tbody>
            <tr><td>your single <C>extends</C></td><td className="no">spent on a vendor 💸</td><td className="yes">free</td></tr>
            <tr><td>adaptee's public API</td><td className="no">leaks through the adapter</td><td className="yes">fully hidden</td></tr>
            <tr><td>works for adaptee's subclasses?</td><td className="no">one fixed class only</td><td className="yes">any — even swapped at runtime</td></tr>
            <tr><td>Day 7's verdict</td><td className="no">is-a lie ("an adapter IS a SlackClient"?)</td><td className="yes">honest has-a</td></tr>
          </tbody>
        </table>
        <Reveal summary="Two-way adapters — click to reveal.">
          <p>An adapter can implement BOTH interfaces (<C>class Converter implements Notifier, SlackPoster</C>),
            letting each side treat it as one of their own — useful when two old systems must call each other.
            Rare, but knowing the term "two-way adapter" closes out the topic in interviews.</p>
        </Reveal>
        <Warn><strong>Class adapter's hidden cost:</strong> Java only allows one <C>extends</C>. A class adapter
          spends your single inheritance slot on the vendor class — you can no longer extend anything of your
          own. This is the real reason object adapters win in Java, not just style preference.</Warn>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Adapters all around you (and the ISP combo)</h2>
        <ul>
          <li><C>InputStreamReader</C> — THE canonical one: byte <C>InputStream</C> in, character <C>Reader</C>
            interface out, charset decoding as the translation. (<C>OutputStreamWriter</C> is its twin.)</li>
          <li><C>Arrays.asList(array)</C> — an array wearing a <C>List</C> interface (with the Day 13 scar that
            add() throws — an adapter whose target contract it can't fully honor).</li>
          <li><C>Collections.enumeration(col)</C> / <C>Collections.list(enum)</C> — adapters between the 1995
            <C> Enumeration</C> world and the modern <C>Iterator</C> world: thirty years of compatibility via
            adapters.</li>
        </ul>
        <Note><strong>The professional combo (Day 14's promise, delivered):</strong> at any messy boundary,
          ① define YOUR OWN narrow role interface (<C>JsonSource</C>, <C>PaymentGateway</C>) shaped by what your
          clients need (ISP) — ② write one small adapter from the vendor's fat API to it. Your modules depend on
          a lean contract you own (DIP!), and the vendor's strangeness is quarantined in one file you can swap.
          This is also why hexagonal architecture is literally called <strong>"ports &amp; adapters"</strong> —
          your interfaces are the ports; these classes are the adapters.</Note>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🕵️ Play: The wrapper line-up</h2>
        <p>Four patterns share the same silhouette — a class holding another class. Intent tells them apart,
          and interviewers test exactly this:</p>
        <table className="matrix">
          <thead>
            <tr><th>wrapper</th><th>interface seen by client</th><th>its job</th><th>day</th></tr>
          </thead>
          <tbody>
            <tr><td>🧩 Adapter</td><td className="yes">DIFFERENT from the wrapped one</td><td>translate shapes</td><td>today</td></tr>
            <tr><td>🎁 Decorator</td><td>same</td><td>add behavior, stackable</td><td>27</td></tr>
            <tr><td>🚪 Facade</td><td>new, simpler</td><td>one door to many classes</td><td>29</td></tr>
            <tr><td>🛡️ Proxy</td><td>same</td><td>control access (guard, cache, lazy)</td><td>29</td></tr>
          </tbody>
        </table>
        <WrapperGame />
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — The smuggling adapter</h3>
        <p>Business rules creeping into the translation: the SlackAdapter that decides WHICH alerts are
          important, retries with backoff, or filters duplicates. That's policy hidden in plumbing — nobody will
          look for it there, and it dies when you swap vendors. Adapters translate; policy lives in the domain.</p>
        <h3>Trap 2 — Adapter chains</h3>
        <p><C>A→B</C> adapter wrapping a <C>B→C</C> adapter wrapping… Each hop is a place meaning quietly bends
          (defaults applied twice, encodings re-converted). One chain link is fine; three means the interfaces
          themselves need renegotiating.</p>
        <h3>Trap 3 — The leaky adapter</h3>
        <p><C>getSlackClient()</C> on the adapter, or Slack types in its method signatures. The moment adaptee
          types escape, every "translated" client is coupled to the vendor anyway — the plug has a bare wire
          sticking out.</p>
        <h3>Trap 4 — Adapting what you own</h3>
        <p>If both sides are yours and editable, RENAME the method — one IDE refactor, zero new classes.
          Adapters earn their keep only at boundaries you can't move (the game's final trap).</p>
        <h3>Trap 5 — The dishonest target (LSP echo)</h3>
        <p>If the adaptee genuinely cannot honor part of the target contract, don't fake it with
          UnsupportedOperationException (Day 13's penguin, Day 14's lie) — <C>Arrays.asList</C> carries exactly
          this scar. Shrink the target interface (ISP) or rethink the fit.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> convert an existing class's interface into the one clients expect — neither side changes. AKA Wrapper. Use at FROZEN boundaries (jars, legacy, 40-call-site interfaces).</li>
          <li><strong>Structure (object adapter):</strong> <C>implements Target</C> + holds Adaptee + translation inside (names, parameter shapes, formats, units, defaults). Participants: Target · Adaptee · Adapter · Client.</li>
          <li><strong>Class adapter</strong> (extends adaptee): spends your inheritance, leaks the adaptee's API, fixes one concrete class — composition wins (Day 7).</li>
          <li>JDK: <C>InputStreamReader</C> · <C>Arrays.asList</C> · <C>Collections.enumeration</C>. Architecture: ports &amp; adapters = your ISP interfaces + these classes.</li>
          <li><strong>Wrapper family by intent:</strong> Adapter translates · Decorator adds (same interface) · Facade simplifies many · Proxy controls access.</li>
          <li>Traps: business logic smuggled in · adapter chains · leaking adaptee types · adapting your own editable code · faking unhonorable contracts.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: GoF lists an alternate name for Adapter — what is it, and why is that confusing?">
          <p><strong>Wrapper.</strong> Confusing because Decorator is ALSO casually called a wrapper — so in
            interviews, disambiguate by intent: "wrapper that changes the interface = adapter; wrapper that
            keeps it and adds behavior = decorator." Saying that unprompted usually ends the question.</p>
        </Reveal>
        <Reveal summary="Q: Where does the 'adapter' in 'ports & adapters' (hexagonal architecture) come from?">
          <p>From this pattern, directly. Ports = the narrow interfaces your domain OWNS (Day 15's sockets);
            adapters = the edge classes translating real technology (DB drivers, HTTP, vendors) into those
            ports. Alistair Cockburn's architecture is Day 14 + Day 15 + Day 26 industrialized.</p>
        </Reveal>
        <Reveal summary="Q: Does an adapter violate LSP by standing in for the Target?">
          <p>No — as long as it FULLY honors the target's contract, it's a perfectly legal substitute (that's
            the point). It violates LSP only when the adaptee can't actually deliver and the adapter fakes it
            (throws, no-ops) — the Arrays.asList scar. Then the fix is a narrower target, not a braver lie.</p>
        </Reveal>
        <Reveal summary="Q: Adapter vs Bridge — both have 'two sides'. Difference?">
          <p>Timing and intent: Adapter is RETROFIT — glue for incompatibles that already exist. Bridge (Day 30)
            is DESIGNED-IN from the start — deliberately splitting abstraction from implementation so both can
            evolve. GoF's own line: adapter makes things work AFTER they're designed; bridge makes them work
            BEFORE.</p>
        </Reveal>
        <Reveal summary="Q: How do you unit-test an adapter?">
          <p>Two cheap layers: ① translation tests — call <C>send("x")</C> with a mock adaptee and assert
            <C> postToChannel("#alerts", "🚨 x")</C> was received (the mapping IS the logic); ② optionally one
            integration test against the real vendor sandbox. If the adapter needs more than this, it's
            smuggling business logic (Trap 1).</p>
        </Reveal>
        <Reveal summary="Q: A lambda can be an adapter — how?">
          <p>When the target is a functional interface, the adapter shrinks to one line:
            <C> Notifier n = msg -&gt; slack.postToChannel("#alerts", "🚨 " + msg);</C> — same pattern, zero
            ceremony. Method references adapt too: <C>Runnable r = queue::poll</C> adapts a signature on the
            spot. Patterns are shapes, not class counts.</p>
        </Reveal>
        <Reveal summary="Q: Name a famous NON-JDK adapter layer every Java dev uses.">
          <p>JDBC drivers: your code speaks the <C>java.sql</C> interfaces (the target), each vendor ships a
            driver translating to its wire protocol (adaptee). Also: SLF4J — an adapter layer over Log4j/JUL/
            Logback so libraries can log without choosing your logging framework for you.</p>
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
        <strong>Day 26 complete?</strong> Homework: rescue a legacy. You have
        <C> class OldThermometer {'{'} double getFahrenheit() {'}'}</C> (pretend it's a sealed jar) and a modern
        dashboard that consumes <C>interface TempSensor {'{'} double celsius(); {'}'}</C>. ① Write
        <C> ThermometerAdapter</C> (composition + the °F→°C translation — a UNIT conversion, not just a rename).
        ② Write the translation unit test with a fake thermometer. ③ Then the one-liner: re-do the adapter as a
        lambda. ④ Bonus: add <C>WeatherApiClient.tempKelvin()</C> and prove your dashboard handles both sources
        without one edited line (OCP receipts!).
        <br /><br />
        Next: <strong>Day 27 — Decorator</strong>: the wrapper that keeps the interface and STACKS — how
        <C> new BufferedReader(new InputStreamReader(...))</C> works, and why it beats subclass explosions.
      </div>
    </div>
  )
}
