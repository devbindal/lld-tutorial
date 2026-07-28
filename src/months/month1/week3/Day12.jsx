import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The feature-add simulator ============ */
const EXTRA_METHODS = ['PayPal', 'Crypto', 'GiftCard']

function buildIfElseHtml(added) {
  const base = [
    '<span class="kw">public void</span> processPayment(String type, <span class="kw">double</span> amt) {',
    '    <span class="kw">if</span> (type.equals(<span class="str">"CARD"</span>)) {',
    '        <span class="cm">// card logic… (tested ✓)</span>',
    '    } <span class="kw">else if</span> (type.equals(<span class="str">"UPI"</span>)) {',
    '        <span class="cm">// UPI logic… (tested ✓)</span>',
  ]
  const extra = added.flatMap((m) => [
    `    } <span class="kw">else if</span> (type.equals(<span class="str">"${m.toUpperCase()}"</span>)) {   <span class="cm">// ← NEW EDIT inside old code!</span>`,
    `        <span class="cm">// ${m} logic… (everything above must be retested 😬)</span>`,
  ])
  return [...base, ...extra, '    }', '}'].join('\n')
}

function FeatureAddSim() {
  const [world, setWorld] = useState('ifelse')
  const [added, setAdded] = useState([])

  function add() {
    if (added.length >= EXTRA_METHODS.length) return
    setAdded((a) => [...a, EXTRA_METHODS[a.length]])
  }
  const reset = () => setAdded([])

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the boss keeps shouting "add a payment method!"</div>
      <div className="modbtns">
        <button className={world === 'ifelse' ? 'on' : ''} onClick={() => setWorld('ifelse')}>😬 if-else world</button>
        <button className={world === 'ocp' ? 'on' : ''} onClick={() => setWorld('ocp')}>😌 OCP world</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={add} disabled={added.length >= EXTRA_METHODS.length}>
          📣 boss: "add {EXTRA_METHODS[added.length] || '…nothing left'}!"
        </button>
        <button className="ghost act" onClick={reset}>reset</button>
      </div>
      {world === 'ifelse' ? (
        <div>
          <Code html={buildIfElseHtml(added)} />
          <div className="statbar">
            ✏️ <span>PaymentService.java edited</span>
            <b>{added.length} time{added.length === 1 ? '' : 's'} after release{added.length >= 2 ? ' — and the if-chain keeps growing…' : ''}</b>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div className="obj" style={{ minWidth: 230 }}>
              <div className="oref">class PaymentService  (the console)</div>
              <div className="ofield">pay(PaymentMethod m, amt)</div>
              <div className="ofield">{'{'} m.pay(amt); {'}'} ← never changes</div>
              <div className="ofield" style={{ marginTop: 6, color: 'var(--green)' }}>✏️ edits after release: 0 🔒</div>
            </div>
            {['Card', 'Upi', ...added].map((m) => (
              <div className="obj" key={m} style={{ minWidth: 150, borderColor: added.includes(m) ? 'var(--blue)' : undefined }}>
                <div className="oref">class {m}Payment</div>
                <div className="ofield">implements PaymentMethod</div>
                <div className="ofield">pay(amt) {'{ … }'}</div>
                {added.includes(m) && <div className="ofield" style={{ color: 'var(--blue)' }}>🆕 brand-new file</div>}
              </div>
            ))}
          </div>
          <div className="statbar">
            🔌 <span>Each request = one NEW cartridge class. The tested core stays sealed:</span>
            <b>0 old lines touched</b>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 2: The discount engine builder ============ */
const POLICIES = [
  { name: 'FestivalDiscount', desc: 'price * 0.80   // 20% off', fn: (p) => p * 0.8 },
  { name: 'LoyaltyDiscount', desc: 'price - 100     // flat ₹100 off', fn: (p) => p - 100 },
  { name: 'NewUserDiscount', desc: 'price * 0.50    // half price!', fn: (p) => p * 0.5 },
]

function DiscountBuilder() {
  const [installed, setInstalled] = useState([{ name: 'NoDiscount', desc: 'price          // unchanged', fn: (p) => p }])
  const [active, setActive] = useState('NoDiscount')
  const price = 1000

  function install() {
    const next = POLICIES[installed.length - 1]
    if (!next) return
    setInstalled((arr) => [...arr, next])
    setActive(next.name)
  }
  const activePolicy = installed.find((p) => p.name === active)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · ship new discount policies without opening Checkout.java</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={install} disabled={installed.length > POLICIES.length}>
          🆕 write next policy class
        </button>
      </div>
      <div className="factory-grid">
        <div>
          <div className="class-card">
            <div className="cname">class Checkout  (closed 🔒)</div>
            double pay(DiscountPolicy p) {'{'}<br />
            &nbsp;&nbsp;return p.apply(price);<br />
            {'}'}<br /><br />
            <span style={{ color: '#2E9E6B' }}>last modified: NEVER ✅</span>
          </div>
          <div style={{ marginTop: 10, fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5' }}>
            PICK THE POLICY OBJECT PASSED IN:
          </div>
          <div className="modbtns">
            {installed.map((p) => (
              <button key={p.name} className={active === p.name ? 'on' : ''} onClick={() => setActive(p.name)}>{p.name}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>
            INSTALLED POLICY CLASSES (the open part)
          </div>
          <div className="heap">
            {installed.map((p) => (
              <div className="obj" key={p.name} style={{ borderColor: active === p.name ? 'var(--blue)' : undefined }}>
                <div className="oref">class {p.name} implements DiscountPolicy</div>
                <div className="ofield">apply(price) → {p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="statbar">
        🧾 <span>checkout.pay(new {active}()) on a ₹{price} cart →</span>
        <b>₹{Math.round(activePolicy.fn(price))}</b>
        <span>— Checkout.java still untouched.</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: Reviewer game — OCP ok or violation? ============ */
const OCP_ITEMS = [
  { d: 'AreaCalculator: if (shape instanceof Circle) {…} else if (shape instanceof Square) {…} — a new Triangle means editing this method.',
    a: 'bad', why: 'The instanceof chain must be reopened for every new shape. Fix: interface Shape { double area(); } — then Triangle is just a new class.' },
  { d: 'interface Shape { double area(); } with Circle and Square implementing it. AreaCalculator just calls shape.area().',
    a: 'ok', why: 'Textbook OCP: the calculator is closed, the shape family is open. Adding Triangle touches zero existing files.' },
  { d: 'A switch over the built-in DayOfWeek enum, handling all 7 days, in a payroll method.',
    a: 'ok', why: 'Nuance! OCP protects against LIKELY change. The week will not grow an 8th day — a fixed, exhaustive set is fine to switch on. Don\'t build cartridge slots for a set that can never grow.' },
  { d: 'NotificationService.send(): if (type == EMAIL) {…} else if (type == SMS) {…} — and the backlog already mentions adding WhatsApp and Push.',
    a: 'bad', why: 'The change is not just likely, it is SCHEDULED. Each new channel reopens tested code. Fix: Channel interface (you built exactly this in Day 7\'s homework!).' },
  { d: 'Checkout receives a PaymentMethod interface in its constructor and calls method.pay(amount).',
    a: 'ok', why: 'Closed core + injected abstraction = OCP via composition (Day 7\'s loose-coupling recipe doing double duty).' },
  { d: 'ReportExporter.export(format): if (format == PDF) {…} else if (format == CSV) {…} else if (format == XLSX) {…} — grew three branches in two months.',
    a: 'bad', why: 'Three edits in two months IS the evidence: this axis of change is hot. Extract an Exporter interface; each format becomes a class. History of edits is the best OCP detector.' },
]

function OcpReview() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= OCP_ITEMS.length
  const cur = OCP_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · code review time — closed enough, or needs a cartridge slot?</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {OCP_ITEMS.length}</b>{score === OCP_ITEMS.length ? ' — perfectly calibrated!' : '. The enum one fools almost everyone.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            🧐 <span>case {idx + 1} of {OCP_ITEMS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.d}</p>
          <div className="modbtns">
            <button className={picked !== null && cur.a === 'ok' ? 'on' : ''}
              style={picked === 'ok' && cur.a !== 'ok' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('ok')}>✅ fine as is</button>
            <button className={picked !== null && cur.a === 'bad' ? 'on' : ''}
              style={picked === 'bad' && cur.a !== 'bad' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('bad')}>🚨 OCP violation</button>
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
  { q: '"Open for extension, closed for modification" means…',
    o: ['Classes must be open-source', 'All classes must be final', 'You should be able to add new behavior by ADDING code, without EDITING existing tested code', 'Methods must be public'], a: 2,
    e: 'Open = new features can plug in (new classes). Closed = the existing, tested core does not get reopened and re-risked for each addition.',
    w: { 0: 'Open-source is licensing — different universe.',
         1: 'final classes are CLOSED to extension — nearly the opposite of the goal.',
         3: 'Visibility modifiers are Day 1 material, unrelated to OCP.' },
    r: { id: 's1', label: 'Section 1 — the game console rule' } },
  { q: 'Why is editing existing, working code considered risky?',
    o: ['Every edit can break behavior that already worked, forces retesting everything around it, and risks merge conflicts', 'Old code is read-only in Java', 'The compiler forbids it', 'It is slow to type'], a: 0,
    e: 'Working code has earned trust through testing and production use. Reopening it puts that trust back to zero for everything in the blast radius. Adding a NEW file risks nothing that already works.',
    w: { 1: 'No such read-only rule exists — discipline does this, not the language.',
         2: 'The compiler happily lets you edit anything.',
         3: 'Typing time is trivial — re-validation time is the real bill.' },
    r: { id: 's2', label: 'Section 2 — the growing if-else' } },
  { q: 'Which Java mechanism is the engine that makes OCP possible?',
    o: ['Polymorphism through interfaces/abstract classes (dynamic dispatch)', 'Garbage collection', 'try/catch blocks', 'The static keyword'], a: 0,
    e: 'The closed core calls method.pay() against an abstraction; dynamic dispatch (Day 4!) routes to whichever new class you plugged in. No abstraction → no plug point → no OCP.',
    w: { 1: 'GC manages memory — it can\'t route method calls.',
         2: 'Exceptions handle failures, not extension.',
         3: 'static is dispatch\'s OPPOSITE — bound at compile time.' },
    r: { id: 's4', label: 'Section 4 — carving the slot' } },
  { q: 'In an OCP-compliant payment design, "add Crypto payments" means…',
    o: ['Recompiling the JVM', 'Adding an else-if to processPayment()', 'Editing every payment class', 'Creating class CryptoPayment implements PaymentMethod — and touching nothing else'], a: 3,
    e: 'New requirement = new class implementing the existing interface. The service, the other payments, and their tests all stay sealed.',
    w: { 0: 'The JVM needs no recompiling for your features. 🙂',
         1: 'The else-if IS the violation — reopening tested code per feature.',
         2: 'Other payment classes have no reason to know Crypto exists.' },
    r: { id: 's4', label: 'Section 4 — the fix' } },
  { q: 'A switch over a truly fixed set (DayOfWeek, CardinalDirection) inside one method is…',
    o: ['Only legal in C', 'A Liskov violation', 'Acceptable — OCP guards against LIKELY change, and these sets cannot grow', 'Always an OCP violation — switch is banned'], a: 2,
    e: 'OCP is insurance, and insurance costs (extra interfaces, indirection). For a set that can never gain members, the premium buys nothing. Spend abstraction where change is real.',
    w: { 0: 'Java\'s switch is alive and well (and got better with expressions).',
         1: 'LSP is about substitution contracts — different principle.',
         3: 'No keyword is banned — only misapplied. Switch on a frozen set is honest code.' },
    r: { id: 's7', label: 'Section 7 — the judgment call' } },
  { q: 'What is "speculative generality"?',
    o: ['Using generics in Java', 'Adding interfaces and plug points for changes that never come — paying OCP\'s cost with no benefit', 'A type of unit test', 'A useful design pattern'], a: 1,
    e: 'Abstracting everything "just in case" buries simple code under indirection. The pragmatic rule: hard-code the first case, maybe the second — by the third variation, the change axis is proven: now extract the interface.',
    w: { 0: 'Generics are a tool — this smell is about unused flexibility of any kind.',
         2: 'Unit tests are unrelated.',
         3: 'It\'s a SMELL from Fowler\'s catalog, not a pattern.' },
    r: { id: 's7', label: 'Section 7 — fool-me-once rule' } },
  { q: 'You\'ve edited ReportExporter three times this quarter, each time adding an output format. The best response is…',
    o: ['Delete the feature', 'Make the method static', 'Keep adding else-ifs; it works', 'Extract an Exporter interface and move each format into its own class — the edit history proves this axis changes often'], a: 3,
    e: 'Real change history is the best evidence for where OCP is worth it. A hot axis of change deserves a plug point; the next format then becomes a new file instead of a fourth edit.',
    w: { 0: 'Deleting features is rarely on the menu. 🙂',
         1: 'static changes nothing about the reopening problem.',
         2: '"It works" ignores the trend — the fourth format is already scheduled somewhere.' },
    r: { id: 's7', label: 'Section 7 — evidence-based slots' } },
  { q: 'How do OCP and SRP (yesterday) reinforce each other?',
    o: ['SRP only applies to interfaces', 'Small single-purpose classes are easier to close; and OCP\'s "new feature = new class" keeps each class single-purpose', 'They are unrelated', 'OCP replaces SRP'], a: 1,
    e: 'A god class can never be closed — someone always needs to reopen it. Split by responsibility (SRP), and each piece can be sealed behind an abstraction (OCP). The principles compound.',
    w: { 0: 'SRP is about classes/modules primarily.',
         2: 'They interlock tightly — SOLID is a system, not five islands.',
         3: 'Neither replaces the other; they work different angles (cohesion vs sealing).' },
    r: { id: 's4', label: 'Section 4 — the SRP bonus' } },
]

/* ============ The page ============ */
export default function Day12() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 3 · Day 12</div>
        <h1>Open/Closed Principle:<br />New Cartridges, Sealed Console</h1>
        <p>Yesterday you gave every class one job. Today: how to add brand-new features <em>without editing
           the code that already works</em>. This is the principle behind every plugin system you have ever
           used — and the reason design patterns exist. Click everything.</p>
        <div className="chips">
          {['OCP', 'open for extension', 'closed for modification', 'polymorphism', 'plug points', 'YAGNI balance'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The game console rule</h2>
        <p>Think of a <strong>game console</strong>. When you want a new game, you buy a <strong>cartridge</strong>
          and click it into the slot. You do NOT open the console with a screwdriver and solder the new game onto
          the motherboard. The console was designed once, sealed, tested — and it gained a <em>slot</em> so new
          games can arrive forever without reopening it.</p>
        <Code html={`        THE GAME CONSOLE RULE

   the console (core code)              the cartridges (extensions)
   sealed · tested · CLOSED 🔒          new ones forever · OPEN 🔌

   ┌──────────────────────┐         ┌─────────┐ ┌─────────┐ ┌─────────┐
   │   PaymentService     │         │  Card   │ │  UPI    │ │ Crypto  │
   │                      │         │ Payment │ │ Payment │ │ Payment │
   │  pay(PaymentMethod m)│         └────┬────┘ └────┬────┘ └────┬────┘
   │     { m.pay(amt); }  │◀━━ slot ━━━━━┷━━━━━━━━━━━┷━━━━━━━━━━━┘
   └──────────────────────┘         the slot = an INTERFACE
   never opened again               new feature = new cartridge class`} />
        <p>That is the <strong>Open/Closed Principle</strong> (the O of SOLID):</p>
        <Note><strong>Software should be open for extension, but closed for modification.</strong> You should be
          able to add new behavior by <em>adding new code</em>, not by <em>editing old code</em>. The slot that
          makes this possible is an <strong>abstraction</strong> (interface or abstract class).</Note>
        <Reveal summary="Interview trivia: who invented OCP, and how did its meaning change? Click to reveal.">
          <p>Bertrand Meyer coined it in 1988, originally meaning: extend via <em>inheritance</em> from a finished
            class. The modern meaning (Robert Martin's "polymorphic OCP") is the one used today: keep a stable
            <em> interface</em>, and let new implementations plug in. Same slogan, better mechanism — composition
            and interfaces instead of inheriting from concrete classes (exactly Day 7's lesson).</p>
        </Reveal>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The crime scene: the growing if-else</h2>
        <p>Here is how OCP gets violated in every young codebase. Version 1 shipped with cards and UPI:</p>
        <Code html={`<span class="kw">public class</span> PaymentService {
    <span class="kw">public void</span> processPayment(String type, <span class="kw">double</span> amt) {
        <span class="kw">if</span> (type.equals(<span class="str">"CARD"</span>)) {
            <span class="cm">// 30 lines of card logic — tested, in production ✓</span>
        } <span class="kw">else if</span> (type.equals(<span class="str">"UPI"</span>)) {
            <span class="cm">// 25 lines of UPI logic — tested, in production ✓</span>
        }
    }
}`} />
        <p>Then the boss says "add PayPal". The only way in this design: <strong>reopen the method, add a
          branch</strong>. Then crypto. Then gift cards. Each time:</p>
        <ul>
          <li>You edit a method that <strong>already worked</strong> — and might break card payments while adding crypto.</li>
          <li>QA must <strong>retest every branch</strong>, not just the new one.</li>
          <li>The method grows toward a <strong>500-line monster</strong> that everyone fears.</li>
          <li>Adding a feature requires understanding ALL existing branches first.</li>
        </ul>
        <Warn><strong>The tell-tale smell:</strong> a chain of <C>if/else if</C> or <C>switch</C> over a "type"
          — especially <C>instanceof</C> chains — where the list of types keeps growing. Every new type reopens
          the file. That chain is begging to become an interface.</Warn>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>📣 Play: The boss keeps adding payment methods</h2>
        <p>Press the boss button a few times in the <strong>if-else world</strong> and watch the tested method
          swell with edits. Then reset, switch to the <strong>OCP world</strong>, and press the same button.
          Same requirements — opposite blast radius.</p>
        <FeatureAddSim />
        <Good><strong>What you should notice:</strong> ① In if-else world, the SAME file gets reopened for every
          request, and the chain grows without limit. ② In OCP world the core's edit counter stays at
          <strong> zero forever</strong> — each request becomes a separate new file. ③ The cartridges all have the
          same shape: that shared shape IS the interface.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The fix: carve a slot (abstraction + polymorphism)</h2>
        <p>Three moves, always the same:</p>
        <ol>
          <li><strong>Name the thing that varies.</strong> Here: the payment method.</li>
          <li><strong>Carve the slot:</strong> an interface capturing what the core needs from any variant.</li>
          <li><strong>One class per variant.</strong> The core talks only to the interface.</li>
        </ol>
        <Code html={`<span class="cm">// 1+2 — the SLOT: what every payment method must be able to do</span>
<span class="kw">public interface</span> PaymentMethod {
    <span class="kw">void</span> pay(<span class="kw">double</span> amount);
}

<span class="cm">// 3 — cartridges: one small class per variant</span>
<span class="kw">public class</span> CardPayment <span class="kw">implements</span> PaymentMethod {
    <span class="kw">public void</span> pay(<span class="kw">double</span> amt) { <span class="cm">/* card logic only */</span> }
}
<span class="kw">public class</span> UpiPayment <span class="kw">implements</span> PaymentMethod {
    <span class="kw">public void</span> pay(<span class="kw">double</span> amt) { <span class="cm">/* UPI logic only */</span> }
}

<span class="cm">// the CONSOLE — closed. It will never list payment types again.</span>
<span class="kw">public class</span> PaymentService {
    <span class="kw">public void</span> processPayment(PaymentMethod method, <span class="kw">double</span> amt) {
        method.pay(amt);     <span class="cm">// dynamic dispatch picks the right cartridge (Day 4!)</span>
    }
}

<span class="cm">// next month: "add Crypto!" → ONE new file, zero edits:</span>
<span class="kw">public class</span> CryptoPayment <span class="kw">implements</span> PaymentMethod {
    <span class="kw">public void</span> pay(<span class="kw">double</span> amt) { <span class="cm">/* crypto logic */</span> }
}`} />
        <p>Under the hood this runs on two things you already own: <strong>polymorphism + dynamic dispatch</strong>
          (Day 4) choose the right <C>pay()</C> at runtime, and <strong>injected interfaces</strong> (Day 7's
          loose-coupling recipe) let the caller hand in any cartridge. OCP is not a new mechanism — it is a
          <em> reason</em> to use the mechanisms you have.</p>
        <p>Notice the SRP bonus: each payment class now has one actor (the card team, the UPI team…). <strong>SRP
          makes classes small enough to close; OCP keeps them closed.</strong></p>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🧾 Play: Ship discounts without opening Checkout.java</h2>
        <p>The marketing team invents a new discount every festival. <C>Checkout</C> has a
          <C> DiscountPolicy</C> slot. Write new policy classes, then click between them and watch the price —
          while Checkout's "last modified" stays at <strong>never</strong>.</p>
        <DiscountBuilder />
        <Good><strong>What you should notice:</strong> ① Every new policy is a new class — Checkout cannot even
          tell how many exist. ② Swapping the active policy is just passing a different object (runtime choice —
          inheritance-based designs choose at compile time, Day 7). ③ You have quietly built the
          <strong> Strategy pattern</strong> — Month 2, Week 7 will simply give this shape its official name.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The three standard slot-carving tools</h2>
        <ul>
          <li><strong>Interface + implementations</strong> (what we did): best when variants share no code.
            → becomes <em>Strategy</em>, <em>Observer</em>, <em>Command</em>… (Month 2).</li>
          <li><strong>Abstract class + hooks:</strong> the parent owns the fixed skeleton; children fill in the
            varying steps (Day 5's abstract methods). Best when variants share most code.
            → becomes <em>Template Method</em>.</li>
          <li><strong>Composition + injection:</strong> the core holds a slot-typed field and someone outside
            chooses what to plug in (Day 7). This is also how tests plug in fakes.
            → becomes <em>Dependency Injection</em>, and meets you again on Day 15 (the D of SOLID).</li>
        </ul>
        <Reveal summary="Where you have already seen OCP in the wild — click to reveal.">
          <p><C>java.util.Comparator</C>: <C>list.sort(...)</C> is closed, your comparator is the cartridge.
            <C> Runnable</C>: the thread machinery is closed, your task plugs in. JDBC drivers: <C>java.sql</C>
            interfaces are closed, every database vendor ships a cartridge. Browser extensions, VS Code plugins,
            Minecraft mods — all of them are OCP with marketing names.</p>
        </Reveal>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The judgment call: don't build slots for everything</h2>
        <p>Here is the part juniors miss: <strong>OCP is insurance, and insurance has a premium.</strong> Every
          slot adds an interface, extra files, and indirection ("where IS the actual code?!"). Buying insurance
          against changes that never come is its own disease — <strong>speculative generality</strong>.</p>
        <p>How to decide where to carve a slot:</p>
        <ul>
          <li><strong>Proven heat:</strong> you have already edited this axis 2–3 times (the exporter that gained
            PDF, then CSV, then XLSX). History is evidence — extract the interface NOW.</li>
          <li><strong>Scheduled change:</strong> the backlog literally lists "add WhatsApp channel". Carve it today.</li>
          <li><strong>Truly fixed sets:</strong> days of the week, compass directions, chess piece colors — these
            cannot grow. A plain exhaustive <C>switch</C> on such an enum is FINE. No cartridge slot needed for a
            console that can never get new games.</li>
          <li><strong>Everything else:</strong> write the simple version first. The third variation will tell you
            where the slot belongs (and you'll carve it better, because you've seen real variants).</li>
        </ul>
        <Note><strong>Fool-me-once rule:</strong> first variant — hard-code it. Second — tolerate the if, feel the
          itch. Third — the axis of change is proven: refactor to an interface. This keeps you safe from both
          diseases: rigid code AND abstraction soup.</Note>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🧐 Play: Closed enough, or needs a slot?</h2>
        <p>Six review cases — including the enum nuance from Section 7 that trips up almost everyone.
          <strong> Predict, then click.</strong></p>
        <OcpReview />
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — "Closed" taken literally</h3>
        <p>OCP does not mean you may never edit a class again. Bug fixes go INTO the class — OCP is about
          <em> new features</em> not requiring edits. And until the design stabilizes, refactoring is normal.</p>
        <h3>Trap 2 — Interfaces for everything on day one</h3>
        <Code html={`<span class="kw">interface</span> IUserNameGetter { String getName(); }   <span class="cm">// ❌ a slot nobody will ever plug into</span>`} />
        <p>One implementation forever = the interface is noise. Wait for the second variant (fool-me-once rule).</p>
        <h3>Trap 3 — The hidden if-else relapse</h3>
        <p>You built the PaymentMethod interface… and then wrote
          <C> if (m instanceof CryptoPayment) {'{'} extraKycCheck(); {'}'}</C> in the core. The chain crept back in
          disguise. If the core asks "which cartridge are you?", the slot has failed — push that behavior into the
          cartridge itself.</p>
        <h3>Trap 4 — One slot, wrong axis</h3>
        <p>You abstracted payment <em>methods</em>, but the actual changes keep hitting payment <em>currencies</em>.
          A slot only pays off on the axis that really varies. Watch where the change requests actually land.</p>
        <h3>Trap 5 — Letting the cartridge list leak into the core</h3>
        <p>A factory method with <C>switch (type) {'{'} case "CARD" → new CardPayment(); … {'}'}</C> somewhere is
          normal and contained — ONE small place knows the list. But if five different files enumerate all payment
          types, adding one cartridge edits five files. Keep the list in exactly one place (a factory — Month 2, Week 5).</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>OCP:</strong> add features by <strong>adding code</strong> (new classes), not by <strong>editing tested code</strong>. Console sealed, cartridges forever.</li>
          <li>The slot = an <strong>abstraction</strong> (interface / abstract class). The engine = <strong>polymorphism + dynamic dispatch</strong> (Day 4) + <strong>injection</strong> (Day 7).</li>
          <li>Recipe: name what varies → carve the interface → one class per variant → core talks only to the interface.</li>
          <li><strong>Smell:</strong> growing if/else-if or switch on a type, instanceof chains, "add X" edits the same file every sprint.</li>
          <li><strong>Nuance:</strong> exhaustive switch over a truly fixed enum (DayOfWeek) is fine — OCP insures against <em>likely</em> change only.</li>
          <li><strong>Fool-me-once rule:</strong> 1st variant hard-code · 2nd tolerate · 3rd extract the interface. Avoids speculative generality.</li>
          <li>Keep the "list of all cartridges" in ONE place (a factory) — never scattered.</li>
          <li>SRP makes classes closable; OCP keeps them closed; Strategy/Template Method/DI are this principle wearing pattern costumes.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Meyer's OCP vs Martin's OCP — what changed?">
          <p>Bertrand Meyer (1988): extend a finished class via <strong>inheritance</strong>. Robert Martin's
            "polymorphic OCP" (1996): keep a stable <strong>interface</strong>, plug in implementations — extend
            via composition + abstraction. Same slogan, different mechanism; the modern answer is Martin's.</p>
        </Reveal>
        <Reveal summary="Q: Is fixing a bug inside a class an OCP violation?">
          <p>No. OCP targets NEW FEATURES requiring edits to working code. Bug fixes correct the existing
            behavior to its intended contract — they go in. (Also fine: refactoring before the design has
            stabilized. OCP protects mature, shipped axes of change.)</p>
        </Reveal>
        <Reveal summary="Q: OCP has a GRASP twin — name it.">
          <p><strong>Protected Variations</strong>: "identify points of predicted variation and create a stable
            interface around them." Same idea, different catalog (Larman). Mentioning the pair shows you read
            beyond one book.</p>
        </Reveal>
        <Reveal summary="Q: What language feature (Java 17) lets you have a CLOSED set of subclasses AND exhaustive switches?">
          <p><strong>Sealed classes/interfaces</strong>: <C>sealed interface Shape permits Circle, Square</C>.
            The compiler then checks switch exhaustiveness over the subtypes — pattern matching over a
            deliberately closed hierarchy. It's the type-system answer to "this set will NOT grow"; OCP-style
            open sets stay unsealed.</p>
        </Reveal>
        <Reveal summary='Q: "Speculative generality" — whose term, and the symptom list?'>
          <p>From Fowler's refactoring smell catalog. Symptoms: interfaces with one forever-implementation,
            abstract classes with one child, unused parameters/hooks "for the future", generic types never
            instantiated twice. Cure: collapse it; re-abstract when the second variant ARRIVES (fool-me-once).</p>
        </Reveal>
        <Reveal summary="Q: Strategy vs Template Method as OCP tools — the one-line contrast?">
          <p>Both carve a slot for variation. Strategy = the slot is an injected OBJECT (composition, swappable
            at runtime). Template Method = the slot is an overridable METHOD (inheritance, fixed at construction).
            Composition's flexibility usually wins (Day 7) — and both get full days in Week 7.</p>
        </Reveal>
        <Reveal summary="Q: Your factory still has a switch over types. Defend it against an OCP purist.">
          <p>"The catalog must exist somewhere; OCP's win is that it exists ONCE, behind an interface, so N
            clients stay closed. Adding a variant = one new class + one case line — O(1) edits instead of O(N)."
            Bonus: mention registry/reflection-based factories as the zero-switch escalation if even that line
            becomes contested.</p>
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
        <strong>Day 12 complete?</strong> Homework: in your IDE, take this OCP violator and fix it —
        <C>ShippingCalculator</C> with <C>if (type.equals("STANDARD")) return weight * 5; else if ("EXPRESS")
        return weight * 12; else if ("OVERNIGHT") return weight * 25;</C>. Carve a <C>ShippingStrategy</C>
        interface, write the three cartridge classes, keep the calculator closed — then prove it by adding a
        fourth strategy (<C>DRONE</C>, weight × 40) without touching any existing file. Bonus: where is the ONE
        allowed place that knows the full list of strategies?
        <br /><br />
        Next: <strong>Day 13 — Liskov Substitution Principle</strong>: the rule that decides whether your
        inheritance is real or fake — starring the famous penguin that couldn't fly and the square that
        wasn't quite a rectangle.
      </div>
    </div>
  )
}
