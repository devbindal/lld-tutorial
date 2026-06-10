import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: Class Box Builder ============ */
const VIS_ORDER = ['-', '+', '#', '~']
const VIS_MEANING = {
  '-': 'private — only this class sees it',
  '+': 'public — everyone sees it',
  '#': 'protected — package + subclasses',
  '~': 'package-private (default) — same package only',
}

function ClassBoxBuilder() {
  const [absClass, setAbsClass] = useState(false)
  const [statics, setStatics] = useState({ totalAccounts: true })
  const [vis, setVis] = useState({ balance: '-', owner: '-', totalAccounts: '-', deposit: '+', getBalance: '+' })
  const [lastClicked, setLastClicked] = useState('balance')

  function cycle(name) {
    setLastClicked(name)
    setVis((v) => ({ ...v, [name]: VIS_ORDER[(VIS_ORDER.indexOf(v[name]) + 1) % VIS_ORDER.length] }))
  }
  const row = (name, label, isStatic) => (
    <div key={name} onClick={() => cycle(name)} title="click to cycle visibility"
      style={{ cursor: 'pointer', padding: '2px 10px', borderRadius: 6, background: lastClicked === name ? '#EEF2FF' : 'transparent' }}>
      {vis[name]} <span style={{ textDecoration: isStatic ? 'underline' : 'none' }}>{label}</span>
    </div>
  )

  return (
    <div className="panel">
      <div className="ptitle">Live demo · build a UML class box — click any member to cycle its visibility</div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13.5, border: '2px solid var(--ink)', borderRadius: 4, minWidth: 250, background: '#fff' }}>
          <div style={{ borderBottom: '2px solid var(--ink)', textAlign: 'center', padding: '6px 10px', fontWeight: 700 }}>
            {absClass && <div style={{ fontWeight: 400, fontSize: 12 }}>«abstract»</div>}
            <span style={{ fontStyle: absClass ? 'italic' : 'normal' }}>BankAccount</span>
          </div>
          <div style={{ borderBottom: '2px solid var(--ink)', padding: '6px 0' }}>
            {row('balance', 'balance: double', false)}
            {row('owner', 'owner: String', false)}
            {row('totalAccounts', 'totalAccounts: int', statics.totalAccounts)}
          </div>
          <div style={{ padding: '6px 0' }}>
            {row('deposit', 'deposit(amount: double): void', false)}
            {row('getBalance', 'getBalance(): double', false)}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <button className="ghost act" style={{ fontSize: 12, padding: '6px 10px' }}
              onClick={() => setAbsClass((a) => !a)}>{absClass ? 'make concrete' : 'make abstract'}</button>
            <button className="ghost act" style={{ fontSize: 12, padding: '6px 10px' }}
              onClick={() => setStatics((s) => ({ totalAccounts: !s.totalAccounts }))}>
              {statics.totalAccounts ? 'make totalAccounts non-static' : 'make totalAccounts static'}
            </button>
          </div>
          <div className="statbar" style={{ display: 'block' }}>
            <div>👆 <b>{lastClicked}</b> is now <b>{vis[lastClicked]}</b> → {VIS_MEANING[vis[lastClicked]]}</div>
            <div style={{ marginTop: 6 }}>
              {statics.totalAccounts ? '— underlined member = static (lives on the class)' : '— no static members right now'}
              {absClass ? ' · italic name + «abstract» = abstract class' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============ Interactive 2: Code → Arrow game ============ */
const ARROWS = [
  { key: 'inheritance', label: 'inheritance ──▷' },
  { key: 'realization', label: 'realization ┄┄▷' },
  { key: 'association', label: 'association ──▶' },
  { key: 'aggregation', label: 'aggregation ◇──' },
  { key: 'composition', label: 'composition ◆──' },
  { key: 'dependency', label: 'dependency ┄┄▶' },
]
const ARROW_ROUNDS = [
  { code: 'class Dog extends Animal { ... }',
    a: 'inheritance', why: 'extends = is-a between two CLASSES: solid line, hollow triangle ▷ pointing at the parent.' },
  { code: 'class Sword implements Weapon { ... }',
    a: 'realization', why: 'implements = realizing an INTERFACE: same hollow triangle, but the line is dashed.' },
  { code: 'void export(PdfWriter w) { w.write(data); }   // not stored',
    a: 'dependency', why: 'Used only inside a method, never kept as a field = dependency: dashed arrow ┄┄▶.' },
  { code: 'class Library { private final List<Shelf> shelves = new ArrayList<>(); }  // built inside, never leaked',
    a: 'composition', why: 'Parts created inside, owned, die with the whole = composition: FILLED diamond ◆ on the Library side.' },
  { code: 'class Team { void addPlayer(Player p) { players.add(p); } }  // players exist outside, survive the team',
    a: 'aggregation', why: 'Whole–part, but parts come from outside and outlive the whole = aggregation: HOLLOW diamond ◇ on the Team side.' },
  { code: 'class Student { private Teacher mentor; }   // two peers, no whole-part feeling',
    a: 'association', why: 'A stored reference between independent peers = plain association: solid line, open arrow for direction.' },
]

function ArrowGame() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= ARROW_ROUNDS.length
  const cur = ARROW_ROUNDS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · read the Java, draw the arrow (in your head, then click)</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {ARROW_ROUNDS.length}</b>{score === ARROW_ROUNDS.length ? ' — you speak fluent UML!' : '. Replay the ones you missed.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            ✏️ <span>Round {idx + 1} of {ARROW_ROUNDS.length} · score {score}</span>
          </div>
          <Code html={cur.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')} />
          <div className="modbtns">
            {ARROWS.map((ar) => (
              <button key={ar.key} className={picked !== null && ar.key === cur.a ? 'on' : ''}
                style={picked !== null && picked === ar.key && ar.key !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
                onClick={() => pick(ar.key)}>
                {ar.label}
              </button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ Correct! ' : <span>❌ Not quite — it is <b>{ARROWS.find((x) => x.key === cur.a).label}</b>. </span>}
              {cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={next}>Next round →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: Multiplicity playground ============ */
const MULTS = ['1', '0..1', '*', '1..*']
const ENGLISH = {
  '1': 'exactly one',
  '0..1': 'zero or one (optional)',
  '*': 'any number, including zero',
  '1..*': 'one or more (at least one)',
}
function javaHint(side, m) {
  if (m === '1') return `a plain required field: private ${side} ${side.toLowerCase()};`
  if (m === '0..1') return `a field that may be null (or Optional<${side}>)`
  return `a collection: private List<${side}> ${side.toLowerCase()}s;`
}

function MultiplicityPlay() {
  const [left, setLeft] = useState('1')   // how many Teams per Player
  const [right, setRight] = useState('1..*') // how many Players per Team
  return (
    <div className="panel">
      <div className="ptitle">Live demo · set the numbers on each end, read the sentence</div>
      <Code html={`        Team ${left.padStart(4)} ◇──────────────── ${right.padEnd(4)} Player
             ↑                            ↑
   read NEAR Player's end            read NEAR Player
   for "Teams per Player"            for "Players per Team"`} />
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>TEAMS PER PLAYER (left end)</div>
          <div className="modbtns">
            {MULTS.map((m) => (
              <button key={m} className={left === m ? 'on' : ''} onClick={() => setLeft(m)}>{m}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>PLAYERS PER TEAM (right end)</div>
          <div className="modbtns">
            {MULTS.map((m) => (
              <button key={m} className={right === m ? 'on' : ''} onClick={() => setRight(m)}>{m}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        <div>🗣️ <b>Reading:</b> each Team has <b>{ENGLISH[right]}</b> Player(s) · each Player belongs to <b>{ENGLISH[left]}</b> Team(s).</div>
        <div style={{ marginTop: 6, fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
          In Team.java → {javaHint('Player', right)}
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
          In Player.java → {javaHint('Team', left)} <span style={{ color: '#7c8aa5' }}>(only if you need that direction)</span>
        </div>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'In a UML class box, what do the three compartments contain, top to bottom?',
    o: ['Methods, fields, name', 'Name, fields (attributes), methods (operations)', 'Name, constructors, fields', 'Package, name, everything else'], a: 1,
    e: 'Always: ① class name, ② attributes/fields, ③ operations/methods. Empty compartments may be hidden, but the order never changes.',
    w: { 0: 'Methods-first feels natural to code readers, but UML fixed the order: name, data, behavior.',
         2: 'Constructors (when shown) live INSIDE the methods compartment, not in their own shelf.',
         3: 'Packages are drawn as folders around classes — never inside the box.' },
    r: { id: 's2', label: 'Section 2 — the class box' } },
  { q: 'What does the symbol # mean in front of a UML member?',
    o: ['private', 'public', 'protected', 'static'], a: 2,
    e: 'The four visibility marks: − private, + public, # protected, ~ package-private. (Same four levels you mastered on Day 1!)',
    w: { 0: 'private is the minus sign − ("kept from you").',
         1: 'public is the plus + ("open to all").',
         3: 'static is shown by UNDERLINING, not by a symbol.' },
    r: { id: 's2', label: 'Section 2 — visibility symbols' } },
  { q: 'A member name is UNDERLINED in a class box. This means…',
    o: ['It is abstract', 'It is static — owned by the class, not by objects', 'It is final', 'It is deprecated'], a: 1,
    e: 'Underline = static (class-level). Italics = abstract. Two easy-to-confuse marks — interviewers love asking the difference.',
    w: { 0: 'Abstract is ITALICS — the eternal mix-up this question exists to cure.',
         2: 'final has no standard UML text style (a {readOnly}/{leaf} property note is used).',
         3: 'Deprecation isn\'t a UML concept at all.' },
    r: { id: 's3', label: 'Section 3 — the box builder demo' } },
  { q: 'Both inheritance and interface realization use a hollow triangle ▷. How do you tell them apart?',
    o: ['You cannot — context decides', 'Inheritance uses a solid line; realization uses a dashed line', 'Realization uses a filled triangle', 'Inheritance points at the child'], a: 1,
    e: 'Solid line + ▷ = extends (class to class). Dashed line + ▷ = implements (class to interface). The triangle ALWAYS points at the parent/interface.',
    w: { 0: 'You CAN tell — line style is the differentiator, and it\'s always graded.',
         2: 'Filled triangles don\'t exist in standard UML class diagrams.',
         3: 'Triangles point UP the family tree, at the parent — never at the child.' },
    r: { id: 's5', label: 'Section 5 — the six arrows' } },
  { q: 'On which side of an aggregation/composition line does the diamond sit?',
    o: ['On the part (Player, Room)', 'On the whole/owner (Team, House)', 'In the middle', 'On whichever side has multiplicity *'], a: 1,
    e: 'The diamond always touches the WHOLE — Team ◇── Player, House ◆── Room. Drawing it on the part silently reverses your design (Day 6 trap!).',
    w: { 0: 'Diamond-on-the-part reverses the ownership claim — the classic hand-slip.',
         2: 'Middle placement isn\'t valid notation.',
         3: 'Diamond side is fixed by OWNERSHIP, never by multiplicity.' },
    r: { id: 's5', label: 'Section 5 — diamonds on the owner' } },
  { q: 'The multiplicity 1..* written near Player on the line Team ◇── 1..* Player means…',
    o: ['Each Player has 1 or more Teams', 'Each Team has 1 or more Players', 'There can only be one Player ever', 'Teams are optional'], a: 1,
    e: 'You read the multiplicity written at the FAR end, from the other class\'s point of view: "a Team has 1..* Players". To know Teams-per-Player, read the number near Team.',
    w: { 0: 'Reading it backwards (player\'s teams) is THE multiplicity trap — read the number at the far end.',
         2: 'Multiplicity counts instances per relationship, not a global object limit.',
         3: 'Optionality would be 0..1 or 0..* — 1..* demands at least one.' },
    r: { id: 's7', label: 'Section 7 — multiplicity' } },
  { q: 'An open arrow Student ──▶ Teacher on an association means…',
    o: ['Teacher is the parent class', 'Student stores a reference to Teacher; Teacher does not know Student', 'Student creates Teacher', 'They are the same package'], a: 1,
    e: 'The arrow shows NAVIGABILITY (direction of knowing): Student has a Teacher field, not the other way. No arrowhead on either end usually means both directions (or "not decided yet").',
    w: { 0: 'Parenthood needs a hollow TRIANGLE — an open arrow is just "knows about".',
         2: 'Creation is a dashed «create» dependency — different arrow entirely.',
         3: 'Packages aren\'t shown on association lines.' },
    r: { id: 's5', label: 'Section 5 — association & navigability' } },
  { q: 'In an interview, which of these should you usually LEAVE OUT of your class diagram?',
    o: ['Relationships between core classes', 'Multiplicities on important lines', 'Every getter, setter and toString of every class', 'Interface names'], a: 2,
    e: 'Diagrams are for THINKING, not for completeness. Getters/setters/toString are noise — show fields, the few meaningful methods, and spend your ink on relationships and multiplicities.',
    w: { 0: 'Relationships are the diagram\'s main cargo — never omit them.',
         1: 'Multiplicities encode key decisions — keep them.',
         3: 'Interface names carry design meaning — keep them too. Only the accessor noise goes.' },
    r: { id: 's9', label: 'Section 9 — drawing traps' } },
]

/* ============ The page ============ */
export default function Day8() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 2 · Day 8</div>
        <h1>UML Class Diagrams:<br />The Architect's Drawing of Your Code</h1>
        <p>For seven days you built ideas in Java. Today you learn to <em>draw</em> them — the exact picture
           language used on interview whiteboards. Everything from Days 1–7 (classes, interfaces, is-a, has-a,
           diamonds) gets its official symbol. Click everything, then grab real paper.</p>
        <div className="chips">
          {['class box', '+ − # ~', 'arrows', '◇ vs ◆', 'multiplicity', 'whiteboard skills'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Why draw at all?</h2>
        <p>Remember Day 1's analogy: a class is a <strong>blueprint</strong> and objects are houses. Today we go one
          level up. Before builders draw detailed blueprints, the <strong>architect draws the site plan</strong>:
          one page showing every building and how they connect — no bricks, no wiring, just shapes and lines.</p>
        <p><strong>UML</strong> (Unified Modeling Language) is that site plan for software. A <strong>class
          diagram</strong> shows your classes as boxes and their relationships as lines — one page that answers
          "what exists, and how is it connected?" without reading a single line of code.</p>
        <ul>
          <li><strong>In interviews:</strong> for LLD rounds (Parking Lot, BookMyShow — Month 3) you are often judged
            on the diagram <em>before</em> any code. It IS the deliverable.</li>
          <li><strong>In teams:</strong> a 10-box diagram explains in 30 seconds what 5,000 lines cannot.</li>
          <li><strong>For yourself:</strong> if you cannot draw it simply, you have not designed it yet.</li>
        </ul>
        <Note><strong>Scope check:</strong> UML has ~14 diagram types. For LLD you need exactly two:
          the <strong>class diagram</strong> (today — structure) and the <strong>sequence diagram</strong>
          (tomorrow — behavior over time). Ignore the rest guilt-free.</Note>
        <Reveal summary="Do real engineers still use UML? Honest answer — click to reveal.">
          <p>Few teams keep formal, always-updated UML documents anymore. But <em>informal</em> class diagrams on
            whiteboards, napkins and design docs are everywhere, every day — and interviews absolutely expect them.
            Learn the notation properly once; then use it loosely forever. Tools people sketch with:
            paper, draw.io, Excalidraw, PlantUML/Mermaid (diagrams from text).</p>
        </Reveal>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The class box — three shelves</h2>
        <p>One class = one rectangle with <strong>three compartments</strong>, always in this order:</p>
        <Code html={`  ┌─────────────────────────────┐
  │         BankAccount         │   ① NAME
  ├─────────────────────────────┤
  │ - balance: double           │   ② FIELDS (attributes)
  │ - owner: String             │      format →  visibility name: Type
  ├─────────────────────────────┤
  │ + deposit(amount: double):  │   ③ METHODS (operations)
  │               void          │      format →  visibility name(param: Type): ReturnType
  │ + getBalance(): double      │
  └─────────────────────────────┘`} />
        <p>Two things look backwards compared to Java — get used to them now:</p>
        <ul>
          <li><strong>Type comes AFTER the name</strong>, separated by a colon: <C>balance: double</C>, not <C>double balance</C>.</li>
          <li><strong>Visibility is a symbol</strong>, not a word. The four marks map exactly to Day 1's modifiers:</li>
        </ul>
        <table className="matrix">
          <thead>
            <tr><th>UML symbol</th><th>Java keyword</th><th>memory hook</th></tr>
          </thead>
          <tbody>
            <tr><td><C>-</C></td><td>private</td><td>minus = kept from you</td></tr>
            <tr><td><C>+</C></td><td>public</td><td>plus = open to all</td></tr>
            <tr><td><C>#</C></td><td>protected</td><td>fence # = family only</td></tr>
            <tr><td><C>~</C></td><td>(default / package)</td><td>~ roughly visible — same package</td></tr>
          </tbody>
        </table>
        <p>Two more marks carry meaning through <em>styling</em>:</p>
        <ul>
          <li><strong><u>Underline</u> = static.</strong> <C><u>totalAccounts: int</u></C> lives on the class (Day 1's notice board).</li>
          <li><strong><em>Italics</em> = abstract.</strong> An <em>italic class name</em> (or <C>«abstract»</C> above it) = abstract class; an italic method = abstract method (Day 5).</li>
        </ul>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🧱 Play: Build the class box</h2>
        <p>Click any member in the box to cycle its visibility symbol (<C>-</C> → <C>+</C> → <C>#</C> → <C>~</C>),
          and use the buttons to toggle <em>abstract</em> and <em>static</em>. Watch how the box's <em>look</em>
          (underline, italics, «abstract») encodes meaning with zero words.</p>
        <ClassBoxBuilder />
        <Good><strong>What you should notice:</strong> ① The symbols are pure Day 1 knowledge wearing new clothes.
          ② static = underline, abstract = italics — styling IS information in UML. ③ A good default box looks like
          this one: fields <C>-</C> private, the few public methods <C>+</C> — exactly the golden habit from Day 1.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Interfaces and abstract classes in the diagram</h2>
        <p>Interfaces (Day 5) get their own box with a marker on top:</p>
        <Code html={`  ┌─────────────────────────┐        ┌─────────────────────────┐
  │      «interface»        │        │       «abstract»        │
  │        Weapon           │        │     <i>PaymentMethod</i>       │
  ├─────────────────────────┤        ├─────────────────────────┤
  │                         │        │ - amount: double        │
  ├─────────────────────────┤        ├─────────────────────────┤
  │ + use(): String         │        │ + <i>pay(): void</i>           │ ← italic = abstract method
  └─────────────────────────┘        │ + printReceipt(): void  │ ← normal = has a body
                                     └─────────────────────────┘`} />
        <ul>
          <li>The word in <C>«guillemets»</C> is called a <strong>stereotype</strong> — a label that says what kind of
            box this is. You will mostly use <C>«interface»</C> and <C>«abstract»</C>.</li>
          <li>Interface members are public by definition (Day 5), so the <C>+</C> is often left off.</li>
          <li>Constructors, when shown, sit first in the methods shelf: <C>+ BankAccount(owner: String)</C>.</li>
        </ul>
        <Reveal summary="How do I show an enum? And constants? Click to reveal.">
          <p>Enums get the stereotype <C>«enumeration»</C> with the values listed in the second shelf
            (<C>RED</C>, <C>GREEN</C>…). Constants are static finals, so: underline + CAPS, e.g.
            <C><u>+ MAX_SPEED: int = 240</u></C>. You can even show a default value with <C>= value</C>, like
            <C>- speed: int = 0</C>.</p>
        </Reveal>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The six arrows — your whole vocabulary</h2>
        <p>Every relationship from this week has one official line. This chart is the heart of today —
          screenshot it, draw it from memory tomorrow:</p>
        <Code html={`  RELATIONSHIP        DRAW IT                            JAVA SMELL TEST
  ─────────────────────────────────────────────────────────────────────────────
  inheritance         Dog ────────────▷ Animal           class Dog extends Animal
  (is-a)              solid line, hollow triangle        triangle points at PARENT

  realization         Sword ┄┄┄┄┄┄┄┄┄▷ «interface»       class Sword implements Weapon
  (implements)        dashed line, hollow triangle              Weapon

  dependency          Service ┄┄┄┄┄┄┄▶ PdfWriter         parameter / local var only,
  (uses-a)            dashed line, open arrow            never stored as a field

  association         Student ────────▶ Teacher          private Teacher mentor;
  (knows-a)           solid line, open arrow             peers — no whole-part feeling

  aggregation         Team ◇────────── Player            parts passed in from outside,
  (has-a, weak)       HOLLOW diamond at the WHOLE        they survive the whole

  composition         House ◆────────── Room             parts created inside, owned,
  (part-of, strong)   FILLED diamond at the WHOLE        they die with the whole`} />
        <p>Three memory rules that prevent 90% of drawing mistakes:</p>
        <ul>
          <li><strong>Triangles point UP the family tree</strong> — always at the parent/interface, never at the child.</li>
          <li><strong>Diamonds sit on the OWNER</strong> — the whole holds the diamond like a wallet.</li>
          <li><strong>Dashed = weaker.</strong> Dashed lines (dependency, realization) mean "no object actually stored / no code inherited" — a lighter touch than solid.</li>
        </ul>
        <Warn><strong>Direction trap:</strong> beginners draw <C>Animal ──▷ Dog</C> because "Animal comes first".
          Read every arrow out loud before moving on: "Dog IS-A Animal — triangle on Animal" ✅.</Warn>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🎯 Play: Read the Java, pick the arrow</h2>
        <p>Six rounds. Each shows a Java snippet from this week's lessons. Apply the smell tests from the chart
          above — <strong>predict the arrow before clicking</strong>. This is exactly the translation your brain
          must do live on a whiteboard.</p>
        <ArrowGame />
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Multiplicity — putting numbers on the lines</h2>
        <p>A line says "connected". <strong>Multiplicity</strong> says <em>how many</em>. The numbers sit at the
          <strong> ends</strong> of the line, and you read the number at the <strong>far end</strong> from each side:</p>
        <Code html={`     Team 0..1 ◇─────────────── 1..* Player

  reading from Team's side:   "a Team has 1..* Players"     (read the number NEAR Player)
  reading from Player's side: "a Player has 0..1 Team"      (read the number NEAR Team)`} />
        <table className="matrix">
          <thead>
            <tr><th>mark</th><th>means</th><th>typical Java shape</th></tr>
          </thead>
          <tbody>
            <tr><td><C>1</C></td><td>exactly one, required</td><td>a plain field, set in the constructor</td></tr>
            <tr><td><C>0..1</C></td><td>optional — zero or one</td><td>a field that may be <C>null</C> / <C>Optional</C></td></tr>
            <tr><td><C>*</C></td><td>any number (0 or more)</td><td><C>List&lt;Player&gt;</C></td></tr>
            <tr><td><C>1..*</C></td><td>at least one</td><td><C>List</C> + constructor guarantees one</td></tr>
            <tr><td><C>2..4</C></td><td>a custom range</td><td><C>List</C> + validation in setters (Day 2!)</td></tr>
          </tbody>
        </table>
        <p>You can also write a <strong>role name</strong> at a line end to say what the neighbor is <em>called</em>
          from this side: <C>Student ──── mentor ▶ Teacher</C> — the field name in your code, on the diagram.</p>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🔢 Play: The multiplicity machine</h2>
        <p>Set each end of the Team—Player line and read the generated English sentence and the matching Java
          fields. Try the football combo (<C>0..1</C> teams per player, <C>1..*</C> players per team), then try to
          build "many-to-many" (students ↔ courses style).</p>
        <MultiplicityPlay />
        <Good><strong>What you should notice:</strong> ① Each end is read from the OTHER side — the number near
          Player answers "players per team". ② Multiplicity directly dictates your field types: <C>*</C> means a
          <C>List</C>, <C>0..1</C> means nullable, <C>1</C> means required-in-constructor. The diagram IS the code plan.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Reading a full diagram (everything at once)</h2>
        <p>Here is a small library system using every symbol from today. Read it slowly, line by line, out loud:</p>
        <Code html={`   ┌──────────────────┐ 1     1..* ┌──────────────────┐
   │     Library      │◆───────────│      Shelf       │
   ├──────────────────┤            ├──────────────────┤
   │ - name: String   │            │ - number: int    │
   ├──────────────────┤            └──────────────────┘
   │ + addBook(b)     │ 1
   └──────────────────┘◇─────────┐
                                 │ *
                        ┌──────────────────┐         ┌──────────────────┐
                        │       Book       │    ┌───▷│    «abstract»    │
                        ├──────────────────┤    │    │      <i>Media</i>       │
                        │ - title: String  │────┘    ├──────────────────┤
                        │ - isbn: String   │         │ + <i>describe()</i>     │
                        └──────────────────┘         └──────────────────┘
                                 ▲ borrows *
                                 │
   ┌──────────────────┐          │          ┌─────────────────────┐
   │      Member      │──────────┘          │     «interface»     │
   ├──────────────────┤                     │      Printable      │
   │ - id: String     │┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄▷├─────────────────────┤
   └──────────────────┘                     │ + print(): void     │
                                            └─────────────────────┘`} />
        <p>Out loud: "A Library <strong>is composed of</strong> 1..* Shelves (they die with it). It
          <strong> aggregates</strong> any number of Books (books survive). Book <strong>extends</strong> the abstract
          Media. A Member <strong>knows</strong> the Books they borrow. Member <strong>implements</strong> Printable."
          — If you followed that, you can read any LLD diagram on the internet.</p>
        <h3>🪤 Common drawing traps</h3>
        <ul>
          <li><strong>Triangle at the child / diamond at the part</strong> — reverses the meaning. Say the sentence out loud as you draw.</li>
          <li><strong>Listing every getter/setter/toString</strong> — noise. Show fields and the few methods that matter.</li>
          <li><strong>Solid vs dashed confusion</strong> — <C>implements</C> and dependency are <em>dashed</em>; extends and association are <em>solid</em>.</li>
          <li><strong>No multiplicities</strong> — a line without numbers hides the most important design decision. At minimum mark the <C>*</C> ends.</li>
          <li><strong>Drawing every class you can think of</strong> — in an interview, 5–8 core classes beat 20 boxes of spaghetti. Start small, grow on request.</li>
        </ul>
        <Reveal summary="Bonus: diagrams from text — PlantUML / Mermaid. Click to reveal.">
          <p>You can generate diagrams from plain text — great for keeping them in git next to code. In Mermaid:
            <C>Library "1" *-- "1..*" Shelf</C> (composition), <C>Team "1" o-- "*" Player</C> (aggregation),
            <C>Dog --|&gt; Animal</C> (inheritance), <C>Member ..|&gt; Printable</C> (realization). Same symbols,
            typed: <C>*--</C> ◆, <C>o--</C> ◇, <C>--|&gt;</C> ▷, <C>..|&gt;</C> dashed ▷.</p>
        </Reveal>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Class box:</strong> 3 shelves — name / fields / methods. Format: <C>visibility name: Type</C>, methods <C>name(param: Type): Return</C>.</li>
          <li><strong>Visibility:</strong> <C>-</C> private · <C>+</C> public · <C>#</C> protected · <C>~</C> package. <u>Underline</u> = static. <em>Italics</em> = abstract. <C>«interface»</C>/<C>«abstract»</C> stereotypes on top.</li>
          <li><strong>Arrows:</strong> solid ▷ extends · dashed ▷ implements · dashed ▶ dependency · solid ▶ association · ◇ aggregation · ◆ composition.</li>
          <li>Triangles point at the <strong>parent</strong>; diamonds sit on the <strong>whole</strong>; dashed = weaker.</li>
          <li><strong>Multiplicity</strong> at line ends, read from the far side: <C>1</C>, <C>0..1</C>, <C>*</C>, <C>1..*</C>, <C>n..m</C>. <C>*</C> → <C>List</C>, <C>0..1</C> → nullable, <C>1</C> → constructor-required.</li>
          <li>Role names on line ends = your field names.</li>
          <li>Interview style: 5–8 core boxes, no getter noise, multiplicities on every important line, say each arrow out loud as you draw.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: The 4-way arrow quiz: solid▷, dashed▷, solid▶, dashed▶ — name all four.">
          <p>Solid + hollow triangle ▷ = <strong>extends</strong> (generalization). Dashed + hollow triangle ▷ =
            <strong> implements</strong> (realization). Solid + open arrow ▶ = <strong>association</strong>
            (navigability). Dashed + open arrow ▶ = <strong>dependency</strong>. Two seconds each — examiners
            run exactly this drill.</p>
        </Reveal>
        <Reveal summary="Q: Underline, italics, and «guillemets» — what does each encode?">
          <p><u>Underline</u> = static (class-level member). <em>Italics</em> = abstract (class name or method).
            <C> «stereotype»</C> = the box's kind: «interface», «abstract», «enumeration». Styling IS semantics
            in UML — a plain-looking diagram can be wrong purely through formatting.</p>
        </Reveal>
        <Reveal summary="Q: Class diagram vs OBJECT diagram — what's the difference? (exam classic)">
          <p>A class diagram shows TYPES (Customer, one box, timeless). An <strong>object diagram</strong> shows
            a snapshot of INSTANCES at one moment: boxes titled <C><u>asha: Customer</u></C> (underlined!) with
            actual values, and plain links instead of multiplicities. Underlined name:Type = instance — same
            convention sequence diagrams use for participants.</p>
        </Reveal>
        <Reveal summary="Q: Can BOTH ends of an association carry multiplicity? How do you read N..M?">
          <p>Yes — and usually should: <C>Author 1..* ──── * Book</C>. Read each number from the OPPOSITE end's
            perspective. <C>2..4</C> = at least 2, at most 4. <C>*</C> alone = 0..*. Missing multiplicity ≠ 1 —
            it means "unspecified", which in an interview means "you forgot".</p>
        </Reveal>
        <Reveal summary="Q: How do you draw a class's dependency on something it only instantiates?">
          <p>Dashed arrow with the optional stereotype <C>«create»</C>: <C>Factory ┄┄«create»┄┄▶ Product</C>.
            Other named dependency stereotypes worth recognizing: <C>«use»</C>, <C>«call»</C>. They refine WHY
            the dashed arrow exists.</p>
        </Reveal>
        <Reveal summary="Q: What's a role name vs an association name?">
          <p>An association NAME labels the line itself ("teaches"), read with a direction triangle. A
            <strong> role name</strong> sits at an END and names what the neighbor is to this class
            (<C>mentor</C>, <C>employer</C>) — and usually matches your field name. Role names beat association
            names in practice because they map 1:1 to code.</p>
        </Reveal>
        <Reveal summary="Q: Should you show getters/setters/constructors in every class box?">
          <p>No — standard practice is to OMIT obvious accessors and default constructors; show fields with
            visibility and only the methods that carry design meaning. UML's own spec allows suppressing any
            compartment. A diagram is an argument, not an inventory.</p>
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
        <strong>Day 8 complete?</strong> Homework: on real paper (yes, paper!), draw the full class diagram for your
        Day 7 <C>Notifier</C> homework — <C>Notifier</C>, the <C>Channel</C> interface, its three implementations,
        plus a <C>User</C> who has <C>0..1</C> Notifier. Every box: 3 shelves with visibility marks. Every line:
        correct arrow + multiplicity. Then check yourself against the Section 5 chart. Bonus: redo it in
        Mermaid or draw.io.
        <br /><br />
        Next: <strong>Day 9 — UML Sequence Diagrams</strong>: class diagrams show <em>what exists</em>; sequence
        diagrams show <em>who calls whom, in what order</em> — the other half of the interview whiteboard.
      </div>
    </div>
  )
}
