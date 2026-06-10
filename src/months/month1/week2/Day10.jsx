import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: X-ray the requirement ============ */
// t: 'n' = noun (candidate class/attribute), 'v' = verb (candidate method/relationship)
const TOKENS = [
  { w: 'Customers', t: 'n', verdict: 'CLASS ✅', reason: 'Has identity (which customer?) and behavior (places orders). A core entity.' },
  { w: 'place', t: 'v', verdict: 'METHOD → placeOrder()', reason: 'A verb done BY a customer — becomes a method, probably Customer.placeOrder(...) creating an Order.' },
  { w: 'orders', t: 'n', verdict: 'CLASS ✅', reason: 'Has identity, data (items, status) and a lifecycle. Definitely a class.' },
  { w: 'at' }, { w: 'restaurants.', t: 'n', verdict: 'CLASS ✅', reason: 'Identity + data (menu, address) + behavior. Core entity.' },
  { w: 'An' }, { w: 'order', t: 'n', verdict: 'duplicate — same as Orders', reason: 'Same concept appearing twice with different words. One class, one name: Order. Always merge synonyms first.' },
  { w: 'contains', t: 'v', verdict: 'RELATIONSHIP → composition ◆', reason: '"contains" is a whole–part signal. Order ◆── OrderItem: the lines die with the order (Day 6!).' },
  { w: 'one' }, { w: 'or' }, { w: 'more' },
  { w: 'items,', t: 'n', verdict: 'CLASS ✅ (OrderItem)', reason: 'It has its own data (name, price) and the order holds MANY of them — needs its own class.' },
  { w: 'and' }, { w: 'each' }, { w: 'item' }, { w: 'has', t: 'v', verdict: 'ATTRIBUTE signal', reason: '"X has a <simple value>" usually marks attributes, not new classes.' },
  { w: 'a' }, { w: 'name', t: 'n', verdict: 'attribute 🏷️', reason: 'Just a String value with no behavior or identity of its own → field: name: String inside OrderItem.' },
  { w: 'and' }, { w: 'a' },
  { w: 'price.', t: 'n', verdict: 'attribute 🏷️', reason: 'A single value (double / Money). No identity → attribute of OrderItem.' },
  { w: 'A' }, { w: 'delivery agent', t: 'n', verdict: 'CLASS ✅', reason: 'Identity + behavior (picks up, delivers). Core entity — name it DeliveryAgent.' },
  { w: 'picks up', t: 'v', verdict: 'METHOD → pickUp(order)', reason: 'A verb done by the agent to an order → DeliveryAgent.pickUp(Order o). Also creates an association between them.' },
  { w: 'the' }, { w: 'order' }, { w: 'and' },
  { w: 'delivers', t: 'v', verdict: 'METHOD → deliver()', reason: 'Another DeliveryAgent behavior. Verbs cluster onto the class that performs them.' },
  { w: 'it' }, { w: 'to' }, { w: 'the' }, { w: "customer's" },
  { w: 'address.', t: 'n', verdict: 'attribute 🏷️ (maybe a small class)', reason: 'Start as a field: address: String inside Customer. If it grows (street, city, pincode + validation) promote it to a small Address class later.' },
]

function XrayDemo() {
  const [mode, setMode] = useState('plain')
  const [sel, setSel] = useState(null)

  const colorFor = (t) =>
    t === 'n' ? { background: '#E5EBFF', border: '1px solid #C9D6FF' }
    : { background: '#FFF1D6', border: '1px solid #EDD9A3' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · X-ray one requirement — then click any highlighted word</div>
      <div className="modbtns">
        {[['plain', 'plain text'], ['n', 'highlight NOUNS'], ['v', 'highlight VERBS'], ['both', 'both']].map(([k, label]) => (
          <button key={k} className={mode === k ? 'on' : ''} onClick={() => { setMode(k); setSel(null) }}>{label}</button>
        ))}
      </div>
      <div style={{ fontSize: 15.5, lineHeight: 2.1, background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 16px' }}>
        {TOKENS.map((tk, i) => {
          const lit = tk.t && (mode === 'both' || mode === tk.t)
          if (!lit) return <span key={i}>{tk.w} </span>
          return (
            <span key={i}>
              <span onClick={() => setSel(i)}
                style={{ ...colorFor(tk.t), borderRadius: 6, padding: '2px 6px', cursor: 'pointer',
                  outline: sel === i ? '2px solid var(--ink)' : 'none' }}>
                {tk.w}
              </span>{' '}
            </span>
          )
        })}
      </div>
      <div className="modexplain">
        {sel === null
          ? <span>👆 Switch on the highlights, then click a colored word to see its fate. Blue = noun, amber = verb.</span>
          : <span><b>{TOKENS[sel].w.replace(/[.,]$/, '')}</b> → <b>{TOKENS[sel].verdict}</b>. {TOKENS[sel].reason}</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: Sort the nouns ============ */
const SORT_ITEMS = [
  { n: 'Member', a: 'class', why: 'Identity ("which member?"), data, behavior (buys memberships). Core entity.' },
  { n: 'Membership', a: 'class', why: 'Has its own data (start date, type) and lifecycle (active/expired). A real class, not just a field of Member.' },
  { n: 'start date', a: 'attribute', why: 'One value, no behavior → field: startDate: LocalDate inside Membership.' },
  { n: 'type (monthly/yearly)', a: 'attribute', why: 'A fixed set of values → an enum! type: MembershipType where MembershipType { MONTHLY, YEARLY }. Enums are attributes with a guard rail.' },
  { n: 'Trainer', a: 'class', why: 'Identity + behavior (runs sessions). Core entity.' },
  { n: 'capacity', a: 'attribute', why: 'Just an int on the session. No identity, no behavior → capacity: int.' },
  { n: 'the gym', a: 'ignore', why: 'It is the SYSTEM ITSELF — the program you are building. Modeling a "Gym" or "System" class that does everything creates a god class. Leave it out (or keep it as a thin entry point only).' },
  { n: 'email text', a: 'ignore', why: 'A detail of the notification mechanism, not a domain entity here. If reminders become a real feature, you would add a Notification class — not today (YAGNI).' },
]
const SORT_CHOICES = [['class', '📦 Class'], ['attribute', '🏷️ Attribute'], ['ignore', '🗑️ Ignore']]

function SortGame() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= SORT_ITEMS.length
  const cur = SORT_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · gym system nouns — sort each one into its bucket</div>
      <p style={{ fontSize: 14, color: '#555', marginBottom: 10 }}>
        Requirement: <em>"Members buy memberships. Each membership has a start date and a type (monthly or
        yearly). Trainers run sessions; each session has a capacity. The gym sends reminder emails."</em>
      </p>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {SORT_ITEMS.length}</b>{score === SORT_ITEMS.length ? ' — perfect filtering!' : '. The explanations are the real lesson — replay the misses.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            🔍 <span>noun {idx + 1} of {SORT_ITEMS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'IBM Plex Mono' }}>"{cur.n}"</p>
          <div className="modbtns">
            {SORT_CHOICES.map(([k, label]) => (
              <button key={k} className={picked !== null && k === cur.a ? 'on' : ''}
                style={picked !== null && picked === k && k !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
                onClick={() => pick(k)}>
                {label}
              </button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ Correct! ' : <span>❌ It is <b>{cur.a}</b>. </span>}
              {cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={next}>Next noun →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: The assembly line (requirements → diagram) ============ */
const LINE_STEPS = [
  {
    title: 'STEP 0 · The raw requirement',
    body: `"Build a parking lot with multiple floors. Each floor has parking
spots of two sizes: compact and large. A driver gets a ticket when
entering; the ticket records the spot and the entry time. When
leaving, the driver pays a fee based on hours parked."`,
    explain: 'Read it twice before touching a pen. This is a mini version of the REAL Parking Lot interview problem you will design fully in Month 3 — today we extract its skeleton.',
  },
  {
    title: 'STEP 1 · Underline the nouns',
    body: `parking lot · floors · parking spots · sizes (compact, large)
driver · ticket · spot · entry time · fee · hours`,
    explain: 'Ten candidate nouns. Do NOT make ten classes! Next step: filter them through the three buckets (class / attribute / ignore).',
  },
  {
    title: 'STEP 2 · Filter: class, attribute, or ignore?',
    body: `CLASS      → ParkingLot, Floor, Spot, Ticket, Driver
ATTRIBUTE  → size: SpotSize (enum COMPACT, LARGE)   ← "two sizes" = fixed set
             entryTime: LocalDateTime  (inside Ticket)
IGNORE     → fee, hours  → not things, just numbers a method computes`,
    explain: 'Identity + data + behavior → class. Single value → attribute. A fixed set of values ("compact and large") → enum. Computed numbers → just a method\'s return value.',
  },
  {
    title: 'STEP 3 · Verbs → methods (give each verb an owner)',
    body: `"gets a ticket when entering" → ParkingLot.issueTicket(driver): Ticket
"the ticket records ..."       → Ticket's constructor stores spot + entryTime
"pays a fee based on hours"    → Ticket.calculateFee(exitTime): double
                                 ParkingLot.checkout(ticket): double`,
    explain: 'Who owns calculateFee? The object that HAS the data it needs — Ticket holds entryTime, so Ticket computes. "Give the job to the one holding the information" — a rule called the Information Expert.',
  },
  {
    title: 'STEP 4 · Relationships + multiplicity from the words',
    body: `"lot WITH multiple floors"   → ParkingLot ◆── 1..* Floor   (parts of it)
"each floor HAS spots"        → Floor      ◆── 1..* Spot
"ticket RECORDS the spot"     → Ticket     ──▶ 1 Spot        (knows it)
"driver GETS a ticket"        → Driver     ──▶ 0..1 Ticket   (knows it)`,
    explain: 'The requirement\'s own words choose the arrows: "with/has" on parts that die with the whole → composition ◆. "records/gets" → plain association. "multiple", "each" → multiplicities.',
  },
  {
    title: 'STEP 5 · The diagram falls out',
    body: `┌────────────┐ 1..* ┌─────────┐ 1..* ┌──────────────────┐
│ ParkingLot │◆─────│  Floor  │◆─────│       Spot       │
├────────────┤      └─────────┘      ├──────────────────┤
│+issueTicket│                       │ - size: SpotSize │
│+checkout   │                       └──────────────────┘
└────────────┘                                ▲ 1
                                              │
┌────────────┐ 0..1 ┌─────────────────────────┴┐    «enumeration»
│   Driver   │─────▶│          Ticket          │    SpotSize
└────────────┘      ├──────────────────────────┤    ─────────
                    │ - entryTime: LocalDateTime│    COMPACT
                    │ + calculateFee(): double  │    LARGE
                    └──────────────────────────┘`,
    explain: 'Five classes, one enum, four labeled relationships — extracted from four sentences with zero guessing. THIS is the Week 2 superpower: text in, design out. (Compare with Month 3 when we add elevators… er, gates, payments and strategies to this same skeleton!)',
  },
]

function AssemblyLine() {
  const [step, setStep] = useState(0)
  const cur = LINE_STEPS[step]
  return (
    <div className="panel">
      <div className="ptitle">Live demo · the assembly line: same text, five passes</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="ghost act" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>← back</button>
        <button className="act" onClick={() => setStep((s) => Math.min(s + 1, LINE_STEPS.length - 1))} disabled={step === LINE_STEPS.length - 1}>
          {step === 0 ? '▶ start extracting' : step === LINE_STEPS.length - 1 ? 'done!' : 'next pass →'}
        </button>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 6 }}>
          {LINE_STEPS.map((_, i) => (
            <span key={i} onClick={() => setStep(i)}
              style={{ width: 10, height: 10, borderRadius: '50%', cursor: 'pointer',
                background: i === step ? 'var(--blue)' : i < step ? 'var(--ink)' : '#d8d5ca' }} />
          ))}
        </div>
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>{cur.title}</div>
      <Code html={cur.body.replace(/</g, '&lt;').replace(/>/g, '&gt;')} />
      <div className="statbar">💡 <span>{cur.explain}</span></div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'In noun–verb analysis of a requirement, nouns and verbs become (roughly)…',
    o: ['Nouns → methods, verbs → classes', 'Nouns → candidate classes/attributes, verbs → candidate methods/relationships', 'Nouns → packages, verbs → interfaces', 'Both become classes'], a: 1,
    e: 'Nouns name THINGS → candidate classes (or attributes). Verbs name ACTIONS → candidate methods, and linking verbs like "has/contains" hint at relationships. Then you FILTER — not every noun survives.' },
  { q: '"Each item has a name and a price." In your model, price should be…',
    o: ['A Price class with its own file', 'An attribute (field) of the item class', 'A separate database table class', 'A subclass of Item'], a: 1,
    e: 'A single value with no identity or behavior of its own = an attribute: price: double. Promote a noun to a class only when it has identity, several fields, or behavior.' },
  { q: 'A beginner creates one big class: SystemManager, with methods bookSeat(), payBill(), sendEmail(), addUser()… What is this called and why is it bad?',
    o: ['A facade — it is good design', 'A god class — one class doing every job, impossible to maintain or test', 'A singleton — required for systems', 'An entity class'], a: 1,
    e: 'A god class hoards every responsibility. Changes anywhere force edits here; nothing is reusable or testable alone. Spread behavior to the entities that own the data (and meet SRP — next week!).' },
  { q: '"An order contains one or more items." The multiplicity on the Order ◆── OrderItem line, at the item end, is…',
    o: ['1', '0..1', '*', '1..*'], a: 3,
    e: '"One or more" translates directly to 1..*. Requirement words map to numbers: "exactly one"→1, "optional"→0..1, "many/any number"→*, "at least one"→1..*.' },
  { q: 'Ticket stores entryTime. ParkingLot stores floors. Who should own calculateFee(exitTime), and by what rule?',
    o: ['ParkingLot — it is the biggest class', 'Ticket — it holds the data the calculation needs (Information Expert)', 'Driver — drivers pay', 'A static FeeUtils class, always'], a: 1,
    e: 'Give the job to whoever holds the information: the fee needs entryTime, which lives in Ticket. This "Information Expert" instinct keeps data and behavior together — the heart of OOP.' },
  { q: '"A spot is either COMPACT or LARGE." The cleanest model for this is…',
    o: ['Two subclasses: CompactSpot and LargeSpot, always', 'A String field: size = "compact"', 'An enum: SpotSize { COMPACT, LARGE } as a field of Spot', 'Two boolean fields: isCompact, isLarge'], a: 2,
    e: 'A fixed set of named values = enum. Strings allow typos ("Compactt"), two booleans allow illegal states (both true). Subclasses are only justified when the sizes BEHAVE differently in many ways.' },
  { q: 'The requirement says "users can pay for the order" — nothing more. Your best FIRST move in an interview:',
    o: ['Silently design a full payment gateway with refunds and EMI', 'Ask clarifying questions: which payment methods? refunds in scope? what happens on failure?', 'Skip payment entirely without saying anything', 'Add an abstract PaymentFactory immediately'], a: 1,
    e: 'Requirements are always incomplete — discovering scope IS the skill being tested. Ask, agree on scope out loud, then model only what was agreed (YAGNI for the rest).' },
  { q: 'Which noun from "The gym sends reminder emails to members" should you usually NOT turn into a class on day one?',
    o: ['member', 'the gym (the system itself)', 'Both should be classes immediately', 'Neither should ever be a class'], a: 1,
    e: '"The gym" is the system you are building — modeling it as one class invites a god class. Members are real entities. (Reminders might become a Notification class later, when that feature is truly in scope.)' },
]

/* ============ The page ============ */
export default function Day10() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 2 · Day 10</div>
        <h1>Requirements → Entities:<br />From Plain English to a Design</h1>
        <p>The final skill of Week 2 — and the one every LLD interview starts with. You get a paragraph of
           plain English; you must produce classes, relationships and diagrams. Today you learn the
           detective's method: highlight the clues, filter the suspects, assemble the case. Click everything.</p>
        <div className="chips">
          {['noun–verb analysis', 'class vs attribute', 'enums', 'multiplicity from words', 'god class', 'YAGNI'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>You are a detective now</h2>
        <p>Think of a <strong>detective reading a witness statement</strong>. The witness talks and talks. The
          detective underlines: <em>names of people</em> (suspects), <em>actions</em> ("entered", "paid", "left").
          Then they filter: who matters to THIS case? Finally they pin photos on a board and draw strings between
          them.</p>
        <p>Turning requirements into a design is exactly this job:</p>
        <ul>
          <li>The <strong>requirement paragraph</strong> = the witness statement.</li>
          <li><strong>Nouns</strong> = suspects → candidate <strong>classes</strong> (some end up as mere attributes, some get dismissed).</li>
          <li><strong>Verbs</strong> = actions → candidate <strong>methods</strong> and <strong>relationships</strong>.</li>
          <li>The <strong>board with strings</strong> = your class diagram (Day 8), and each scenario walked through = a sequence diagram (Day 9).</li>
        </ul>
        <p>The full assembly line — memorize these five passes:</p>
        <Code html={`  requirement text
       │
  ① underline NOUNS  ──────────▶ candidate things
  ② FILTER each noun ──────────▶ class 📦 / attribute 🏷️ / ignore 🗑️
  ③ assign VERBS     ──────────▶ methods, owned by the right class
  ④ wire RELATIONSHIPS ────────▶ ◆ ◇ ──▶ + multiplicities, from the wording
  ⑤ DRAW it          ──────────▶ class diagram + one sequence per scenario`} />
        <Note><strong>Nothing new today!</strong> Every pass uses a previous day: classes (Day 1), is-a/has-a
          (Days 3–7), diagrams (Days 8–9). Today only adds the <em>starting point</em>: raw English.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2 · Interactive</div>
        <h2>🔦 Play: X-ray a real requirement</h2>
        <p>Below is a requirement for a food-delivery app. First read it plain. Then switch on the noun
          highlights, then the verbs. <strong>Click every highlighted word</strong> — each shows its fate and the
          reasoning. Notice: not all nouns survive as classes!</p>
        <XrayDemo />
        <Good><strong>What you should notice:</strong> ① "order" appears twice with different words — synonyms merge
          into ONE class. ② "name", "price", "address" are nouns but become mere <em>fields</em>.
          ③ Verbs split into two kinds: action verbs (place, deliver) → methods; linking verbs (contains, has) →
          relationships/attributes.</Good>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The filter: class 📦 vs attribute 🏷️ vs ignore 🗑️</h2>
        <p>The filtering pass is where beginners drown — they make a class for every noun. Use these three
          questions on each noun, in order:</p>
        <ol>
          <li><strong>Does it have identity?</strong> Do we ask "WHICH one?" about it? ("Which customer?" yes →
            class-ish. "Which price?" no — a price is just a value.)</li>
          <li><strong>Does it have its own data AND behavior?</strong> Several fields, things it <em>does</em> →
            class. One bare value → attribute.</li>
          <li><strong>Does THIS problem need it?</strong> The requirement mentions "the chef cooks the food" — but
            if the app never tracks chefs, there is no Chef class. Out of scope → ignore.</li>
        </ol>
        <table className="matrix">
          <thead>
            <tr><th>noun smells like…</th><th>verdict</th><th>example</th></tr>
          </thead>
          <tbody>
            <tr><td>identity + data + behavior</td><td className="yes">class 📦</td><td>Customer, Order, Ticket</td></tr>
            <tr><td>one simple value</td><td>attribute 🏷️</td><td>name, price, entryTime</td></tr>
            <tr><td>a fixed set of named values</td><td>attribute 🏷️ as an <strong>enum</strong></td><td>SpotSize {'{'} COMPACT, LARGE {'}'}, OrderStatus</td></tr>
            <tr><td>synonym of an existing noun</td><td>merge 🔁</td><td>"order" / "purchase" → Order</td></tr>
            <tr><td>the system itself / out of scope</td><td className="no">ignore 🗑️</td><td>"the gym", "the app", Chef (untracked)</td></tr>
          </tbody>
        </table>
        <Warn><strong>The god-class trap:</strong> nouns like "the system", "the app", "the manager" tempt you into
          one giant class with twenty methods (<C>SystemManager.doEverything()</C>). Resist. Behavior belongs on the
          entities that own the data. A god class fails every principle you will learn next week.</Warn>
        <Reveal summary="When does an attribute deserve a promotion to class? Click to reveal.">
          <p>Watch for an attribute that starts <strong>collecting friends</strong>: address was one String, but now
            requirements mention street, city, pincode, and "validate the pincode" — that is identity-less but has
            structure + behavior → promote it to a small <C>Address</C> class (a <em>value object</em> — proper
            treatment in Week 4). Same for Money (amount + currency) vs a bare double. Rule: one value = field;
            structured value with rules = small class.</p>
        </Reveal>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🗂️ Play: Sort the nouns</h2>
        <p>A gym-membership requirement, eight nouns, three buckets. Run each noun through the three filter
          questions from Section 3 — <strong>predict, then click</strong>.</p>
        <SortGame />
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Verbs → methods (and who gets the job)</h2>
        <p>After nouns, hunt the verbs. Each action verb becomes a method — but the crucial question is
          <strong> which class owns it?</strong> The answer that keeps designs clean:</p>
        <Note><strong>Information Expert (plain version):</strong> give the job to the class that
          <strong> holds the data the job needs</strong>. Fee depends on entryTime → <C>Ticket.calculateFee()</C>.
          Cart total depends on the items → <C>Cart.getTotal()</C>. Don't make a stranger reach in and grab the
          data (that grabbing is exactly the encapsulation-breaking from Day 2).</Note>
        <Code html={`<span class="cm">// ❌ a stranger does the math with stolen data</span>
<span class="kw">double</span> fee = FeeUtils.calc(ticket.getEntryTime(), exitTime);

<span class="cm">// ✅ the data owner does its own math</span>
<span class="kw">public class</span> Ticket {
    <span class="kw">private</span> LocalDateTime entryTime;     <span class="cm">// the data lives here…</span>

    <span class="kw">public double</span> calculateFee(LocalDateTime exit) {
        <span class="kw">long</span> hours = Duration.between(entryTime, exit).toHours();
        <span class="kw">return</span> Math.max(<span class="num">1</span>, hours) * <span class="num">20.0</span>;  <span class="cm">// …so the logic lives here too</span>
    }
}`} />
        <p>Linking verbs are different — they wire <strong>relationships</strong>, not methods:</p>
        <ul>
          <li><C>has / contains / consists of</C> → whole–part: ◆ or ◇ (apply the Day 6 lifecycle test).</li>
          <li><C>uses</C> → dependency ┄▶ (Day 7).</li>
          <li><C>knows / refers to / is assigned to</C> → association ──▶.</li>
          <li><C>is a / is a kind of</C> → inheritance ──▷ (then run Day 7's checklist before believing it!).</li>
        </ul>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Multiplicity hides in the wording</h2>
        <p>Requirement writers tell you the numbers without knowing it. Train your eye on these phrases:</p>
        <table className="matrix">
          <thead>
            <tr><th>the requirement says…</th><th>multiplicity</th><th>Java shape</th></tr>
          </thead>
          <tbody>
            <tr><td>"each order belongs to <strong>exactly one</strong> customer"</td><td><C>1</C></td><td>required field, set in constructor</td></tr>
            <tr><td>"a member <strong>may</strong> have a personal trainer"</td><td><C>0..1</C></td><td>nullable field / <C>Optional</C></td></tr>
            <tr><td>"a customer can place <strong>any number of</strong> orders"</td><td><C>*</C></td><td><C>List&lt;Order&gt;</C></td></tr>
            <tr><td>"an order has <strong>one or more</strong> items"</td><td><C>1..*</C></td><td><C>List</C> + constructor demands ≥1</td></tr>
            <tr><td>"a team has <strong>up to 11</strong> players"</td><td><C>0..11</C></td><td><C>List</C> + a guard in <C>addPlayer</C> (Day 2 validation!)</td></tr>
          </tbody>
        </table>
        <Reveal summary="What if the requirement doesn't say? Click to reveal.">
          <p>Then it is a <strong>clarifying question</strong> — and asking it scores points: <em>"Can a book have
            multiple authors, or always one?"</em> The answer changes your model (field vs List), so it is worth
            ten seconds. Never silently guess on a multiplicity that shapes your classes; say your assumption out
            loud if you must move on.</p>
        </Reveal>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🏗️ Play: The full assembly line</h2>
        <p>Watch one requirement go through all five passes — this is a mini <strong>Parking Lot</strong>, the most
          famous LLD interview problem (you will design the full version in Month 3). Step through; at each pass,
          try to do it in your head <em>before</em> reading the panel.</p>
        <AssemblyLine />
        <Good><strong>What you should notice:</strong> ① Ten nouns shrank to five classes + one enum — the filter
          is doing real work. ② Every relationship and every multiplicity was justified by a literal word in the
          text ("with", "each", "one or more"). ③ <C>calculateFee</C> landed on Ticket because that's where
          entryTime lives — Information Expert in action.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — A class for every noun</h3>
        <p>"name", "price", "date" as classes = a diagram with 25 boxes and no meaning. Filter ruthlessly:
          most nouns are attributes.</p>
        <h3>Trap 2 — The god class</h3>
        <p>"The system shall…" sentences seduce you into <C>class System</C> with every method inside. Spread the
          verbs to the data owners instead.</p>
        <h3>Trap 3 — Modeling the real world instead of the problem</h3>
        <p>A real restaurant has chefs, ovens, waiters, gas cylinders. Your food-delivery app tracks none of them.
          <strong> Model the problem, not the universe.</strong> If no requirement reads or writes it, it does not exist (YAGNI —
          "You Aren't Gonna Need It", full treatment in Week 4).</p>
        <h3>Trap 4 — Premature patterns</h3>
        <p>Jumping to "I'll use AbstractFactoryBuilderSingleton here" before entities exist. Patterns (Month 2)
          solve <em>specific</em> problems that appear AFTER the basic model is drawn. Entities first, patterns later.</p>
        <h3>Trap 5 — Freezing on vague requirements</h3>
        <p>Requirements are ALWAYS incomplete — that is by design in interviews. The move is never silence: ask
          the question, or state your assumption out loud ("I'll assume one payment per order") and continue.</p>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>The 5 passes:</strong> ① nouns ② filter (class/attribute/ignore) ③ verbs → methods ④ relationships + multiplicity ⑤ draw.</li>
          <li><strong>Filter questions:</strong> identity? data+behavior? needed by THIS problem? One value → field. Fixed value set → <strong>enum</strong>. Synonyms → merge. "The system" → not a class.</li>
          <li><strong>Information Expert:</strong> the class holding the data does the related work — <C>Ticket.calculateFee()</C>, not <C>FeeUtils</C>.</li>
          <li><strong>Linking verbs wire arrows:</strong> has/contains → ◆/◇ · uses → ┄▶ · knows → ──▶ · is-a → ──▷ (verify with Day 7's checklist).</li>
          <li><strong>Wording → multiplicity:</strong> exactly one → 1 · may → 0..1 · any number → * · one or more → 1..* · up to n → 0..n (+ guard in code).</li>
          <li>Vague? <strong>Ask, or state your assumption out loud.</strong> Asking is scored positively.</li>
          <li>Scope discipline: model the problem, not the world. No patterns before entities.</li>
          <li>Deliverables: a class diagram + one sequence diagram per key scenario — Days 8 &amp; 9, every time.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: The noun-verb technique has an official name and author — what are they?">
          <p><strong>Textual analysis</strong> (or "Abbott's heuristic") — Russell Abbott, 1983, later
            popularized by Grady Booch. Saying "I'll run a quick Abbott-style textual analysis" in a design
            interview is a power move — just be ready to actually do it.</p>
        </Reveal>
        <Reveal summary="Q: Information Expert comes from which catalog? Name two siblings.">
          <p><strong>GRASP</strong> (General Responsibility Assignment Software Patterns) — Craig Larman's
            catalog. Siblings worth name-dropping: <strong>Creator</strong> (who should instantiate X? whoever
            aggregates/contains it), <strong>Controller</strong>, <strong>Low Coupling / High Cohesion</strong>
            (Day 17 as named patterns), <strong>Protected Variations</strong> (≈ OCP).</p>
        </Reveal>
        <Reveal summary='Q: The god class anti-pattern has another famous name — and a "detector"?'>
          <p>Also called <strong>The Blob</strong>. Detectors: a class named Manager/System/Processor, far more
            methods than its neighbors, every change request landing in it (divergent change, Day 17), and
            "the class everyone is afraid to touch."</p>
        </Reveal>
        <Reveal summary="Q: Where does YAGNI come from?">
          <p><strong>Extreme Programming</strong> (Kent Beck / Ron Jeffries, late 1990s) — "You Aren't Gonna
            Need It," a core XP practice alongside "do the simplest thing that could possibly work." Knowing
            it's an XP term (not GoF, not SOLID) is a small but real trivia point.</p>
        </Reveal>
        <Reveal summary='Q: Requirement says "the system shall calculate fees". Does "system" become a class?'>
          <p>No — "the system" IS the program; modeling it as a class births the god object. The verb
            ("calculate fees") gets assigned to the entity holding the needed data (Information Expert).
            "The system/the app/the platform" are scope words, not entities.</p>
        </Reveal>
        <Reveal summary='Q: "Status: pending, paid, shipped" — enum or subclasses? The decision rule?'>
          <p>Enum when the values differ only as DATA/labels and transitions (state machine, Day 19). Subclasses
            (State pattern, Month 2) when each status carries genuinely different BEHAVIOR of meaningful size.
            Start with the enum; graduate when the switch-on-status blocks multiply (Day 12's fool-me-once).</p>
        </Reveal>
        <Reveal summary="Q: Interviewer stays silent after giving you vague requirements. What are they testing?">
          <p>Whether you ASK. Scope discovery is the evaluated skill: clarify actors, core flows, in/out of
            scope, multiplicities ("can an order have multiple payments?") — THEN model. Diving straight into
            classes on vague input is the most common LLD interview fail.</p>
        </Reveal>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 10 complete — and so is Week 2! 🎉</strong> Homework (the big one): run the full assembly line on
        this requirement, on paper, end to end: <em>"Build an online bookstore. Customers browse books; each book
        has a title, a price and one or more authors. A customer adds books to a cart and checks out, creating an
        order with a status (PLACED, SHIPPED, DELIVERED). Each order has exactly one shipping address."</em>
        Produce: the noun table (with verdicts), the class diagram with multiplicities, and one sequence diagram
        for "customer checks out".
        <br /><br />
        Next: <strong>Week 3 — SOLID</strong>, starting with <strong>Day 11 — Single Responsibility Principle</strong>:
        now that you can find your classes, the next five days teach you the five rules that keep them healthy.
      </div>
    </div>
  )
}
