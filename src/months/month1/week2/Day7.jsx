import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: Coupling Picker ============ */
const WIRE_DATA = {
  extend: {
    label: 'extends',
    code: 'class Shop extends SmtpSender { ... }',
    coupling: 3,
    swap: 0, test: 0, isa: 0,
    story: <span><b>Inheritance for reuse</b> 🔗 — the tightest wire of all. A Shop <i>is not</i> a kind of
      email sender, so the is-a test already fails. Shop now inherits every method and every future change
      of SmtpSender, forever, and Java allows only ONE extends — you just spent it on a utility.</span>,
  },
  newInside: {
    label: 'new inside',
    code: 'class Shop { private SmtpSender mail = new SmtpSender(); }',
    coupling: 2,
    swap: 0, test: 0, isa: 1,
    story: <span><b>Hard-wired composition</b> 🔩 — better shape (has-a), but Shop personally chose the
      concrete class with <C>new</C>. Want Gmail instead of SMTP? Edit Shop's source. Want to test Shop
      without sending real emails? You can't — the real sender is welded in.</span>,
  },
  concreteParam: {
    label: 'concrete param',
    code: 'class Shop { Shop(SmtpSender mail) { this.mail = mail; } }',
    coupling: 1,
    swap: 0, test: 1, isa: 1,
    story: <span><b>Injected, but concrete</b> 🔧 — someone outside passes the sender in (this is
      <i> dependency injection</i> in its simplest form). Tests can pass a subclassed fake. But the
      parameter type is still the concrete SmtpSender — switching to Gmail still breaks the signature.</span>,
  },
  interfaceParam: {
    label: 'interface param',
    code: 'class Shop { Shop(EmailSender mail) { this.mail = mail; } }',
    coupling: 0,
    swap: 1, test: 1, isa: 1,
    story: <span><b>Injected interface</b> 🌟 — the loosest wire. Shop only knows the contract
      (<C>EmailSender</C>, Day 5!). Pass SmtpSender today, GmailSender tomorrow, a FakeSender in tests —
      Shop never changes. This is the wiring style every design pattern in Month 2 assumes.</span>,
  },
}
const WIRE_KEYS = ['extend', 'newInside', 'concreteParam', 'interfaceParam']

function CouplingPicker() {
  const [wire, setWire] = useState('extend')
  const d = WIRE_DATA[wire]
  return (
    <div className="panel">
      <div className="ptitle">Live demo · 4 ways to wire Shop → email, from worst to best</div>
      <div className="modbtns">
        {WIRE_KEYS.map((k) => (
          <button key={k} className={wire === k ? 'on' : ''} onClick={() => setWire(k)}>
            {WIRE_DATA[k].label}
          </button>
        ))}
      </div>
      <Code html={d.code} />
      <table className="matrix">
        <thead>
          <tr><th>Question</th><th>Answer</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Passes the is-a / has-a smell test?</td>
            <td className={d.isa ? 'yes' : 'no'}>{d.isa ? '✔ yes — has-a' : '✘ no — Shop is not a sender!'}</td>
          </tr>
          <tr>
            <td>Can tests use a fake sender?</td>
            <td className={d.test ? 'yes' : 'no'}>{d.test ? '✔ yes — inject a fake' : '✘ no — real one is welded in'}</td>
          </tr>
          <tr>
            <td>Swap to Gmail without editing Shop?</td>
            <td className={d.swap ? 'yes' : 'no'}>{d.swap ? '✔ yes — Shop only knows the contract' : '✘ no — Shop must be edited'}</td>
          </tr>
        </tbody>
      </table>
      <div className="statbar">
        🌡️ <span>Coupling level:</span>
        <b>{['LOOSE — the goal 🎉', 'medium', 'tight', 'WELDED 🔥'][d.coupling]}</b>
      </div>
      <div className="modexplain">{d.story}</div>
    </div>
  )
}

/* ============ Interactive 2: Class Explosion ============ */
const ABILITIES = ['Fly', 'Swim', 'Shoot', 'Dig']

function subsets(arr) {
  // all non-empty combinations of the chosen abilities
  const out = []
  const n = arr.length
  for (let mask = 1; mask < (1 << n); mask++) {
    out.push(arr.filter((_, i) => mask & (1 << i)))
  }
  return out
}

function ClassExplosion() {
  const [on, setOn] = useState(['Fly', 'Swim'])
  const [world, setWorld] = useState('inheritance')

  function toggle(a) {
    setOn((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))
  }
  const combos = subsets(on)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · add abilities, count the classes you must write</div>
      <p style={{ fontSize: 14.5, marginBottom: 10 }}>
        Robots may have any mix of these abilities. Tick abilities, then switch worlds and compare the class count.
      </p>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {ABILITIES.map((a) => (
          <button key={a} className={on.includes(a) ? 'on' : ''} onClick={() => toggle(a)}>
            {on.includes(a) ? '✔ ' : ''}{a}
          </button>
        ))}
      </div>
      <div className="modbtns">
        <button className={world === 'inheritance' ? 'on' : ''} onClick={() => setWorld('inheritance')}>🌳 inheritance world</button>
        <button className={world === 'composition' ? 'on' : ''} onClick={() => setWorld('composition')}>🧩 composition world</button>
      </div>
      {world === 'inheritance' ? (
        <div>
          <div className="heap">
            {combos.length === 0 ? (
              <div className="empty">No abilities ticked. Tick some above ↑</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="chip">Robot</span>
                {combos.map((c) => (
                  <span className="chip" key={c.join('')}>{c.join('') + 'Robot'}</span>
                ))}
              </div>
            )}
          </div>
          <div className="statbar">
            💥 <span>subclasses to write &amp; maintain:</span>
            <b>{combos.length + 1} classes for {on.length} abilities — and adding ability #{on.length + 1} doubles it!</b>
          </div>
        </div>
      ) : (
        <div>
          <div className="heap">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className="chip">Robot (holds a List of Ability)</span>
              {on.map((a) => (
                <span className="chip" key={a}>{a}Ability</span>
              ))}
            </div>
          </div>
          <div className="statbar">
            🧩 <span>classes to write &amp; maintain:</span>
            <b>{on.length + 1} classes — adding ability #{on.length + 1} adds exactly ONE more</b>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: Hot-swap the robot's parts ============ */
const WEAPONS = {
  Sword:  { out: '🗡️ slash! (damage 20, range 1m)' },
  Laser:  { out: '🔫 pew pew! (damage 35, range 50m)' },
  Nothing:{ out: '🤷 ...the robot waves politely. No weapon installed.' },
}
const MOVERS = {
  Wheels: { out: '🛞 rolls forward smoothly' },
  Legs:   { out: '🦿 walks step by step, can climb stairs' },
  Rotor:  { out: '🚁 lifts off and flies' },
}

function HotSwap() {
  const [weapon, setWeapon] = useState('Sword')
  const [mover, setMover] = useState('Wheels')
  const [log, setLog] = useState([])

  function act(line) {
    setLog((l) => [...l.slice(-3), line]) // keep the last few lines
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · swap parts while the robot is running</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div className="obj" style={{ minWidth: 250 }}>
          <div className="oref">r → Robot@4f2a   (same object the whole time!)</div>
          <div className="ofield">weapon → <b>{weapon}</b>{weapon !== 'Nothing' ? '@' + (weapon.length * 1337).toString(16) : ' (null)'}</div>
          <div className="ofield">mover&nbsp;&nbsp;→ <b>{mover}</b>@{(mover.length * 2741).toString(16)}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="act" style={{ fontSize: 12, padding: '6px 10px' }}
              onClick={() => act('r.attack()  →  ' + WEAPONS[weapon].out)}>r.attack()</button>
            <button className="act" style={{ fontSize: 12, padding: '6px 10px' }}
              onClick={() => act('r.move()    →  ' + MOVERS[mover].out)}>r.move()</button>
          </div>
        </div>
        <div style={{ minWidth: 220 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>
            SPARE PARTS SHELF (setters)
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {Object.keys(WEAPONS).map((w) => (
              <button key={w} className={'ghost act' + (weapon === w ? '' : '')}
                style={{ fontSize: 12, padding: '5px 9px', ...(weapon === w ? { background: '#EEF2FF' } : {}) }}
                onClick={() => { setWeapon(w); act('r.setWeapon(new ' + w + '())   // swapped at runtime!') }}>
                set {w}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.keys(MOVERS).map((m) => (
              <button key={m} className="ghost act"
                style={{ fontSize: 12, padding: '5px 9px', ...(mover === m ? { background: '#EEF2FF' } : {}) }}
                onClick={() => { setMover(m); act('r.setMover(new ' + m + '())    // swapped at runtime!') }}>
                set {m}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {log.length === 0
          ? <span>🖥️ console output will appear here — press the robot's buttons</span>
          : log.map((l, i) => <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{l}</div>)}
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'OrderService receives a PdfWriter as a method parameter, uses it inside that one method, and never stores it. This relationship is…',
    o: ['Association', 'Dependency', 'Aggregation', 'Composition'], a: 1,
    e: 'Not kept as a field = not association/aggregation/composition. Borrowed briefly inside a method = dependency (uses-a), drawn as a dashed arrow in UML.',
    w: { 0: 'Association requires a stored FIELD — this PdfWriter evaporates when the method returns.',
         2: 'Aggregation is whole-part with a field — neither applies here.',
         3: 'Composition is the strongest stored bond — this is the weakest unstored one. Opposite ends of the ladder.' },
    r: { id: 's2', label: 'Section 2 — dependency (uses-a)' } },
  { q: 'Java\'s own java.util.Stack extends Vector. Why do experts call this a famous design mistake?',
    o: ['A Stack now inherits insert/remove-at-any-position methods, so code can break the "top only" rule', 'Vector is too slow', 'Stack should have extended ArrayList instead', 'extends is deprecated'], a: 0,
    e: 'A stack must only push/pop at the top. By inheriting from Vector, every Vector method (like insertElementAt in the middle) became part of Stack\'s public API forever. is-a was false: a stack is not usable-as-a vector.',
    w: { 1: 'Vector\'s speed (or slowness) is beside the point — the inherited API is the wound.',
         2: 'ArrayList would inherit the SAME rule-breaking methods — the fix is composition: Stack HAS a list.',
         3: 'extends is alive and well — misusing it is the issue.' },
    r: { id: 's4', label: 'Section 4 — why inheritance cracks' } },
  { q: 'You have 5 independent robot abilities, any mix allowed. Roughly how many classes does each approach need?',
    o: ['Inheritance: 5, Composition: 32', 'Both need 32', 'Both need 6', 'Inheritance: up to 32 subclasses, Composition: about 6 classes'], a: 3,
    e: 'Every combination needs its own subclass: 2⁵ = 32. With composition you write 5 ability classes + 1 Robot that holds them — about 6. Each new ability doubles one world and adds +1 to the other.',
    w: { 0: 'Reversed — inheritance is the exploding one (2ⁿ), composition the linear one (n+1).',
         1: 'Composition never explodes: abilities are parts, combos are runtime wiring.',
         2: 'Inheritance can\'t stay at 6 — every COMBINATION must be its own class.' },
    r: { id: 's5', label: 'Section 5 — the class explosion' } },
  { q: 'A subclass overrode addAll() AND add() to count insertions, but the count comes out double. The base class\'s addAll() secretly calls add() internally. This problem is called…',
    o: ['Method overloading', 'Class explosion', 'The fragile base class problem', 'Garbage collection'], a: 2,
    e: 'The subclass accidentally depends on the base class\'s hidden internals. If the base class changes how addAll works, the subclass silently breaks. Inheritance opens the white box; composition stays outside the black box.',
    w: { 0: 'Overloading is same-name-different-params — this is about internal self-calls leaking.',
         1: 'Class explosion is the 2ⁿ subclass-count disease — different problem.',
         3: 'GC manages memory, not double-counting.' },
    r: { id: 's4', label: 'Section 4 — the fragile base class' } },
  { q: 'Can a Java object change its CLASS at runtime? And what is the composition way to get "changeable behavior"?',
    o: ['Yes — with the changeClass() method', 'No — but you can reassign a composed field, e.g. setWeapon(new Laser())', 'No — behavior can never change at runtime', 'Yes — by calling the constructor again'], a: 1,
    e: 'An object\'s class is fixed forever at new. But a field holding a behavior object can be reassigned any time — that is how composition gives runtime flexibility (and it grows into the Strategy pattern in Month 2).',
    w: { 0: 'No changeClass() exists in Java — type is sealed at birth.',
         2: 'Behavior CAN change — by swapping the composed part, not the class.',
         3: 'Constructors run once per object; calling again creates a DIFFERENT object.' },
    r: { id: 's7', label: 'Section 7 — hot-swapping parts' } },
  { q: 'Which constructor gives Shop the LOOSEST coupling to its email mechanism?',
    o: ['Shop(EmailSender mail)  // an interface', 'class Shop extends SmtpSender', 'Shop(SmtpSender mail)', 'Shop() { mail = new SmtpSender(); }'], a: 0,
    e: 'Depend on the contract, not the concrete class. With an interface parameter, Shop never changes when you switch SMTP → Gmail → a fake for tests. Injected + interface = loosest.',
    w: { 1: 'extends is the tightest coupling possible — and a false is-a on top.',
         2: 'Injected but CONCRETE — better, yet still breaks when the vendor changes.',
         3: 'new inside = welded: untestable and unswappable without editing Shop.' },
    r: { id: 's3', label: 'Section 3 — the coupling thermometer' } },
  { q: 'When IS inheritance the right choice?',
    o: ['Whenever you want to reuse code from another class', 'Never — it is deprecated', 'When you need more than one base class', 'When the subclass truly IS a kind of the parent and can be used anywhere the parent is expected'], a: 3,
    e: 'Inheritance is for genuine is-a with full substitutability (that rule has a name — Liskov, Week 3). Reusing code alone is not a reason; that is what composition is for.',
    w: { 0: 'Wanting code is the #1 WRONG reason — that\'s what has-a fields are for.',
         1: 'Far from deprecated — just reserved for true family relationships.',
         2: 'Java forbids multiple base classes entirely.' },
    r: { id: 's8', label: 'Section 8 — when extends is right' } },
  { q: 'What is "delegation"?',
    o: ['A class with only static methods', 'Copying code from another class', 'Holding another object as a field and forwarding work to it', 'A subclass calling super()'], a: 2,
    e: 'Delegation = "I don\'t do this myself; my part does it." robot.attack() just calls weapon.use(). It is the engine inside composition — and inside half the design patterns of Month 2.',
    w: { 0: 'All-static classes are utilities — no parts, no forwarding.',
         1: 'Copying is duplication (Day 16\'s enemy) — delegation REUSES by pointing, not pasting.',
         3: 'super() chains constructors upward — delegation forwards work sideways to a held object.' },
    r: { id: 's6', label: 'Section 6 — composition + delegation' } },
]

/* ============ The page ============ */
export default function Day7() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 2 · Day 7</div>
        <h1>Dependency &amp; Composition over Inheritance:<br />Snap Parts, Don't Grow Trees</h1>
        <p>Yesterday you learned the bonds between objects. Today you learn the most quoted design rule in
           software: <em>"favor composition over inheritance."</em> You will see exactly why inheritance trees
           crack, and how snapping parts together fixes it. Click everything.</p>
        <div className="chips">
          {['uses-a', 'coupling', 'fragile base class', 'class explosion', 'delegation', 'composition > inheritance'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Two ways to build a robot</h2>
        <p>Imagine a <strong>robot workshop</strong>. There are two ways to make new robot models:</p>
        <ul>
          <li><strong>The family-tree way (inheritance):</strong> every new model is a <em>child</em> of an older model.
            FlyingRobot extends Robot. SwimmingFlyingRobot extends FlyingRobot. Each child is born with its
            parent's parts <strong>welded on, forever</strong>. Want a flying robot without the parent's heavy armor? Too bad — it is welded.</li>
          <li><strong>The LEGO way (composition):</strong> there is ONE Robot body with <em>sockets</em>. You snap in a
            weapon, a mover, a battery. Any combination. Pull a part out, snap a different one in — <strong>even while
            the robot is running</strong>.</li>
        </ul>
        <Code html={`   THE FAMILY-TREE WAY (welded)          THE LEGO WAY (sockets)

   Robot                                 ┌────────────────────┐
     △                                   │       Robot        │
     │ extends                           │   ┌────────────┐   │
   FlyingRobot                           │   │ weapon ○───┼───┼──▶ 🗡️ or 🔫
     △                                   │   ├────────────┤   │
     │ extends                           │   │ mover  ○───┼───┼──▶ 🛞 / 🦿 / 🚁
   SwimmingFlyingRobot                   │   └────────────┘   │
     △                                   └────────────────────┘
     │ extends
   LaserSwimmingFlyingRobot              ONE class. Parts snap in
                                         and out — even at runtime.
   every new mix = a NEW class,
   parts welded on at birth`} />
        <p>Both reuse code. The difference is <strong>flexibility</strong> and <strong>coupling</strong> — how hard the
          pieces are glued to each other. Today's rule, straight from the Design Patterns book (the "Gang of Four",
          your Month 2 textbook):</p>
        <Note><strong>Favor composition over inheritance.</strong> Reach for a has-a field first.
          Use <C>extends</C> only when something truly IS a kind of something else. has-a is a socket; is-a is a weld.</Note>
        <Reveal summary="Wait — Week 1 taught me inheritance is great. Was that wrong? Click to reveal.">
          <p>No! Inheritance is the right tool for true is-a with shared behavior (Dog IS an Animal), and it powers
            polymorphism (Day 4). The problem is using it as a <em>code-reuse shortcut</em> between things that are
            not really parent and child. Today is about spotting that misuse — Section 8 gives the checklist for
            when <C>extends</C> is still the right call.</p>
        </Reveal>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Dependency — the "uses-a" you met briefly yesterday</h2>
        <p>First, let's finish the relationship ladder. <strong>Dependency</strong> is the weakest link:
          one class <em>uses</em> another for a moment, without keeping it. In code it appears in exactly three shapes:</p>
        <Code html={`<span class="kw">public class</span> ReportService {

    <span class="cm">// shape 1: METHOD PARAMETER — borrowed, used, returned</span>
    <span class="kw">public void</span> export(PdfWriter writer) {
        writer.write(<span class="str">"report data"</span>);   <span class="cm">// used right here…</span>
    }                                     <span class="cm">// …and forgotten. Not a field!</span>

    <span class="cm">// shape 2: LOCAL VARIABLE — created, used, dies with the method</span>
    <span class="kw">public void</span> backup() {
        ZipTool zip = <span class="kw">new</span> ZipTool();    <span class="cm">// lives only inside this method</span>
        zip.compress(<span class="str">"report.pdf"</span>);
    }

    <span class="cm">// shape 3: RETURN TYPE — I produce one, but don't keep it</span>
    <span class="kw">public</span> Invoice generateInvoice() {
        <span class="kw">return new</span> Invoice();
    }
}`} />
        <p>UML draws all three the same way: a <strong>dashed arrow</strong> <C>ReportService ┄┄▶ PdfWriter</C>.
          Read it as: "if PdfWriter changes, ReportService <em>might</em> need to change."</p>
        <Warn><strong>Every arrow is a cost.</strong> Each class you depend on is one more reason your class might
          break tomorrow. Good LLD is largely the art of having <em>few, weak, one-directional</em> arrows.
          That cost has a name: <strong>coupling</strong>.</Warn>
        <p><strong>Coupling</strong> = how tightly two classes are glued. The relationship ladder from Day 6 is really
          a coupling scale: dependency (loosest) → association → aggregation → composition → <strong>inheritance
          (tightest of all!)</strong>. Inheritance glues the child to the parent's <em>insides</em>, as you are about to see.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🌡️ Play: The coupling thermometer</h2>
        <p>A <C>Shop</C> needs to send emails. Below are <strong>4 ways to wire it</strong> to the email code.
          Click each one, left to right, and watch the three test questions and the thermometer. This exact
          progression — from <em>extends</em> to <em>injected interface</em> — is the single most useful refactor
          you will ever learn.</p>
        <CouplingPicker />
        <Good><strong>What you should notice:</strong> ① <C>extends</C> fails even the smell test — Shop is not a
          kind of email sender. ② Moving <C>new</C> out of the class (letting someone pass the object in) is what
          unlocks testing. ③ Changing the parameter type to an <strong>interface</strong> is what unlocks swapping.
          Injected + interface = the loose-coupling recipe.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Why inheritance cracks: the welded problems</h2>
        <p>Here is what goes wrong when <C>extends</C> is used just to reuse code.</p>
        <h3>Problem 1 — The fragile base class</h3>
        <p>You extend a class and override two methods to count insertions:</p>
        <Code html={`<span class="kw">public class</span> CountingList <span class="kw">extends</span> ArrayList&lt;String&gt; {
    <span class="kw">private int</span> addCount = <span class="num">0</span>;

    <span class="kw">public boolean</span> add(String s) {
        addCount++;                          <span class="cm">// count single adds</span>
        <span class="kw">return super</span>.add(s);
    }
    <span class="kw">public boolean</span> addAll(Collection&lt;String&gt; c) {
        addCount += c.size();                <span class="cm">// count bulk adds</span>
        <span class="kw">return super</span>.addAll(c);
    }
}

list.addAll(List.of(<span class="str">"a"</span>, <span class="str">"b"</span>, <span class="str">"c"</span>));
System.out.println(list.getAddCount());      <span class="cm">// prints 6, not 3!! 😱</span>`} />
        <p>Why 6? Because <strong>inside</strong> ArrayList, <C>addAll()</C> happens to call <C>add()</C> for each
          element — so every item is counted twice. Your subclass silently depends on the parent's <em>hidden
          internals</em>. If a future Java version changes how <C>addAll</C> works, your class breaks <strong>without
          you touching a line</strong>. That is the <strong>fragile base class problem</strong> (this exact example is
          from the book <em>Effective Java</em>).</p>
        <h3>Problem 2 — You inherit everything, wanted or not</h3>
        <p>Java's own library has the famous scar: <C>java.util.Stack extends Vector</C>. A stack must only
          push/pop at the top — but because it inherited from Vector, you can legally call
          <C>stack.insertElementAt(x, 2)</C> and stab an element into the middle. The rule of the class is
          breakable through its own inherited API, forever (it cannot be removed without breaking old programs).</p>
        <h3>Problem 3 — One parent only, chosen forever</h3>
        <p>Java allows ONE <C>extends</C> (Day 5). Spend it on code reuse and it is gone. And the choice is made
          at <strong>compile time</strong> — an object can never change its class while running. A welded part
          stays welded.</p>
        <Reveal summary="Interview trivia: why does inheritance 'break encapsulation'? Click to reveal.">
          <p>Encapsulation (Day 2) means: outsiders see only your public API, never your internals. But a subclass
            is half-inside: <C>protected</C> fields, <C>super</C> calls, and self-call patterns (like addAll→add)
            all expose the parent's <em>implementation details</em> to children. The parent can no longer change its
            insides freely — every subclass is secretly watching. That is why the saying goes:
            <strong> "inheritance breaks encapsulation."</strong></p>
        </Reveal>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>💥 Play: The class explosion</h2>
        <p>Robots can fly, swim, shoot, dig — <strong>any mix</strong>. In the inheritance world, every combination
          needs its own subclass. Tick abilities one by one and watch the family tree explode; then switch to the
          composition world and count again. <strong>Predict first:</strong> 4 abilities — how many subclasses?</p>
        <ClassExplosion />
        <Good><strong>What you should notice:</strong> ① Each new ability <em>doubles</em> the inheritance world
          (2 → 4 → 8 → 16: combinations of n abilities = 2ⁿ) but adds exactly <em>one</em> class to the composition
          world. ② The subclass names themselves (<C>FlySwimDigRobot</C>…) are the smell — names made of glued
          features mean the hierarchy is doing a job sockets should do.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The fix: composition + delegation</h2>
        <p>Here is the LEGO version of the robot. One body, two sockets, parts snapped in from outside:</p>
        <Code html={`<span class="cm">// The SOCKETS are interfaces (Day 5) — contracts, not concrete parts</span>
<span class="kw">public interface</span> Weapon { String use(); }
<span class="kw">public interface</span> Mover  { String go();  }

<span class="cm">// The PARTS — small classes, one job each (write once, combine forever)</span>
<span class="kw">public class</span> Sword <span class="kw">implements</span> Weapon {
    <span class="kw">public</span> String use() { <span class="kw">return</span> <span class="str">"slash!"</span>; }
}
<span class="kw">public class</span> Laser <span class="kw">implements</span> Weapon {
    <span class="kw">public</span> String use() { <span class="kw">return</span> <span class="str">"pew pew!"</span>; }
}
<span class="kw">public class</span> Rotor <span class="kw">implements</span> Mover {
    <span class="kw">public</span> String go()  { <span class="kw">return</span> <span class="str">"flying"</span>; }
}

<span class="cm">// ONE robot class. No subclasses. Ever.</span>
<span class="kw">public class</span> Robot {
    <span class="kw">private</span> Weapon weapon;   <span class="cm">// 🧩 socket 1</span>
    <span class="kw">private</span> Mover  mover;    <span class="cm">// 🧩 socket 2</span>

    <span class="kw">public</span> Robot(Weapon w, Mover m) {  <span class="cm">// parts injected at birth</span>
        <span class="kw">this</span>.weapon = w;
        <span class="kw">this</span>.mover  = m;
    }

    <span class="kw">public</span> String attack() { <span class="kw">return</span> weapon.use(); }  <span class="cm">// ← DELEGATION:</span>
    <span class="kw">public</span> String move()   { <span class="kw">return</span> mover.go();   }  <span class="cm">//   forward the work to my part</span>

    <span class="kw">public void</span> setWeapon(Weapon w) { <span class="kw">this</span>.weapon = w; }  <span class="cm">// 🔄 swap at RUNTIME!</span>
}

Robot r = <span class="kw">new</span> Robot(<span class="kw">new</span> Sword(), <span class="kw">new</span> Rotor());
r.attack();                  <span class="cm">// "slash!"</span>
r.setWeapon(<span class="kw">new</span> Laser());    <span class="cm">// mid-battle upgrade — same object, new behavior</span>
r.attack();                  <span class="cm">// "pew pew!"</span>`} />
        <p>The key move is <strong>delegation</strong>: <C>attack()</C> does not do the work itself — it
          <strong> forwards</strong> the call to the part it holds. "I don't fight; my weapon does." Compare the
          coupling: Robot knows only two tiny <em>interfaces</em>. It cannot be hurt by Sword's internals the way
          CountingList was hurt by ArrayList's.</p>
        <Note><strong>This is the recipe behind half of Month 2.</strong> Swappable behavior object = the
          <strong> Strategy pattern</strong>. Wrapping to add features = <strong>Decorator</strong>. Forwarding with
          a changed face = <strong>Adapter</strong>. Learn delegation once, get five patterns cheap.</Note>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🔄 Play: Hot-swap the robot's parts</h2>
        <p>The robot below is <strong>one object that never changes class</strong> — watch its address stay
          <C>Robot@4f2a</C> the whole time. Press <C>attack()</C>, then swap the weapon from the parts shelf and press
          <C>attack()</C> again. Inheritance could never do this: an object's class is fixed at <C>new</C>, forever.</p>
        <HotSwap />
        <Good><strong>What you should notice:</strong> ① Same object, same address — only the <em>field</em> points to
          a different part object after each swap. ② <C>r.attack()</C> never changed its code; the behavior changed
          because the part behind it changed. ③ "set Nothing" shows the cost: with sockets, you must decide what
          happens when a socket is empty (here: a polite wave instead of a NullPointerException).</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>So when IS <code style={{ fontFamily: 'IBM Plex Mono' }}>extends</code> the right call?</h2>
        <p>Composition over inheritance does not mean "never inherit." Run this checklist — <strong>all four</strong> should be yes:</p>
        <ol>
          <li><strong>True is-a in plain English.</strong> "A Dog is an Animal" ✅. "A Shop is an SmtpSender" ❌.</li>
          <li><strong>Substitutable everywhere.</strong> Any code expecting the parent must work perfectly when handed
            the child — no surprises, no disabled methods. (This rule is the <strong>L in SOLID — Liskov</strong>, full day in Week 3.)</li>
          <li><strong>You want the parent's whole contract.</strong> Not just one handy method — everything, including
            future additions.</li>
          <li><strong>The relationship is permanent.</strong> A Dog never becomes a Cat at runtime. If the role can
            change (weapon, payment method, sorting order) — that is a socket, use composition.</li>
        </ol>
        <p>Healthy uses of inheritance you have already seen: <C>Dog extends Animal</C> with real shared behavior
          (Day 3), abstract base classes that own a skeleton algorithm (Day 5 — and the Template Method pattern,
          Month 2), exceptions extending <C>Exception</C>.</p>
        <Reveal summary="The one-question tiebreaker interviewers love — click to reveal.">
          <p>Ask: <strong>"do I want to reuse this class's code, or do I want to BE this class?"</strong> Reuse →
            composition (hold it as a field, delegate). Be → inheritance (and then Liskov must hold). If you hesitate
            on "be", the answer is composition — un-welding a hierarchy later is one of the most painful refactors
            in software.</p>
        </Reveal>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Extending just to grab one method</h3>
        <Code html={`<span class="kw">class</span> ReportService <span class="kw">extends</span> StringUtils { }   <span class="cm">// ❌ "I wanted capitalize()..."</span>
<span class="kw">class</span> ReportService { <span class="cm">/* call StringUtils.capitalize(s) or hold a field */</span> } <span class="cm">// ✅</span>`} />
        <h3>Trap 2 — newing your dependencies deep inside</h3>
        <p><C>new SmtpSender()</C> buried in a method = invisible welded wire: no test can replace it, and the class
          quietly couples to a concrete vendor. Accept it as a constructor parameter instead — let the caller choose.</p>
        <h3>Trap 3 — Subclassing to "switch off" parent behavior</h3>
        <Code html={`<span class="kw">class</span> Penguin <span class="kw">extends</span> FlyingBird {
    <span class="kw">public void</span> fly() { <span class="kw">throw new</span> UnsupportedOperationException(); } <span class="cm">// ❌ alarm bells!</span>
}`} />
        <p>If a child must disable a parent method, the is-a claim was false. This exact smell becomes the
          star of the Liskov day in Week 3.</p>
        <h3>Trap 4 — Deep towers of extends</h3>
        <p><C>A extends B extends C extends D extends E</C>: to understand A you now read five files, and a change in
          E can break A invisibly (fragile base, multiplied). Rule of thumb: hierarchies 1–2 levels deep; if you need
          more variety, switch to sockets.</p>
        <h3>Trap 5 — Hearing "composition" and forgetting Day 6's meaning</h3>
        <p>In "composition over inheritance", the word is used loosely — it really means <em>any has-a wiring</em>
          (aggregation included), not strictly the filled-diamond, dies-together bond. Context tells you which sense
          is meant. Interviewers use both senses freely.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Dependency</strong> (uses-a, dashed ┄▶): parameter, local variable, or return type — used, not stored. Weakest link.</li>
          <li><strong>Coupling</strong> = how glued two classes are. Ladder: dependency → association → aggregation → composition → <strong>inheritance (tightest)</strong>. Fewer/weaker arrows = better design.</li>
          <li><strong>Loose-coupling recipe:</strong> depend on an <strong>interface</strong>, and let the object be <strong>passed in</strong> (injected), not <C>new</C>-ed inside.</li>
          <li><strong>Inheritance cracks:</strong> fragile base class (subclass breaks when parent internals change), inherit-everything (Stack extends Vector), one extends spent forever, behavior locked at compile time, breaks encapsulation.</li>
          <li><strong>Class explosion:</strong> n mixable features = 2ⁿ subclasses, but only n part-classes + 1 host with composition.</li>
          <li><strong>Delegation:</strong> hold a part, forward the call — <C>attack() {'{'} return weapon.use(); {'}'}</C>. Swap parts at runtime with a setter.</li>
          <li><strong>extends checklist (all 4 must be yes):</strong> true is-a · substitutable (Liskov) · want the whole contract · permanent role.</li>
          <li>Tiebreaker question: reuse it → has-a; be it → is-a.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: Who coined "favor composition over inheritance" — and what does it NOT mean?'>
          <p>The <strong>Gang of Four</strong> (Design Patterns, 1994) — it's one of their two foundational
            principles (the other: "program to an interface, not an implementation"). It does NOT mean "never
            inherit" — it means inheritance must pass the is-a + substitutability bar, not just "I want that
            code".</p>
        </Reveal>
        <Reveal summary="Q: Define the fragile base class problem in one sentence.">
          <p>A subclass silently depends on its parent's <em>implementation details</em> (like which methods call
            which internally), so an apparently safe change to the base class breaks subclasses without
            touching them. Canonical demo: extending a collection and double-counting because
            <C> addAll()</C> internally calls <C>add()</C>.</p>
        </Reveal>
        <Reveal summary='Q: Why do people say "inheritance breaks encapsulation"?'>
          <p>Because the child sees what outsiders can't: <C>protected</C> members, <C>super</C> behavior, and
            the parent's self-call patterns. The parent can no longer change its internals freely — every
            subclass is coupled to them. Inheritance is the strongest coupling in the language (Day 17's
            ladder top).</p>
        </Reveal>
        <Reveal summary="Q: Name the two famous JDK inheritance mistakes — and why they can't be fixed.">
          <p><C>Stack extends Vector</C> and <C>Properties extends Hashtable</C> — both inherit APIs that let
            callers violate the subclass's rules (insert mid-stack; put non-String keys into Properties).
            Unfixable because removing inherited methods would break decades of compiled client code — public
            inheritance is FOREVER. That permanence is the interview point.</p>
        </Reveal>
        <Reveal summary="Q: Forwarding vs delegation — is there a difference?">
          <p>Pedantically yes: <strong>forwarding</strong> = the wrapper calls the inner object as a separate
            object. <strong>True delegation</strong> = the inner call operates as if on behalf of the wrapper
            (receives its identity). In everyday/pattern usage the words are used interchangeably for
            "hold a field, pass the call on" — but knowing the nuance exists impresses.</p>
        </Reveal>
        <Reveal summary="Q: With n independent boolean features, how many classes in each approach? (math)">
          <p>Inheritance: up to <strong>2ⁿ subclasses</strong> (every combination its own class). Composition:
            <strong> n behavior classes + 1 host</strong>. n=10 → 1024 vs 11. The exponential-vs-linear contrast
            is the quantitative argument worth quoting.</p>
        </Reveal>
        <Reveal summary="Q: Can a class be designed to FORBID inheritance — and why would you?">
          <p>Yes: mark it <C>final</C> (String does), or make constructors private + static factories. Why:
            protect immutability/invariants from subclass sabotage, keep LSP trivially true, allow safe caching.
            Effective Java: "design and document for inheritance, or else prohibit it."</p>
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
        <strong>Day 7 complete?</strong> Homework: build a <C>Notifier</C> system in your IDE — an interface
        <C>Channel</C> with <C>send(String msg)</C>, three parts (<C>EmailChannel</C>, <C>SmsChannel</C>,
        <C>PushChannel</C>), and a <C>Notifier</C> class that receives a <C>Channel</C> in its constructor and
        delegates. Add <C>setChannel(...)</C> and prove in <C>main</C> that one Notifier object can switch from
        email to SMS at runtime. Bonus: write the inheritance version (<C>EmailNotifier extends Notifier</C>…)
        and a one-paragraph comment on which felt better and why.
        <br /><br />
        Next: <strong>Day 8 — UML Class Diagrams</strong>: boxes, arrows, diamonds and multiplicity — drawing
        everything from Days 1–7 on one page, the way interviews expect.
      </div>
    </div>
  )
}
