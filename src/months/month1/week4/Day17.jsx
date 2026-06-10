import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The coupling ladder ============ */
const COUPLING_LEVELS = {
  content: {
    label: 'content (worst)',
    temp: 4,
    code: `<span class="cm">// reaching INSIDE another object and editing its organs</span>
account.balance = account.balance - fee;     <span class="cm">// bypasses every rule withdraw() enforces</span>`,
    story: <span><b>Content coupling</b> 🔓 — one module surgically edits another's internals. Every invariant the
      victim class guards (Day 2!) can be bypassed. Any change to its fields breaks you. This is why fields are
      private — content coupling is what encapsulation exists to forbid.</span>,
  },
  global: {
    label: 'common (global state)',
    temp: 3,
    code: `<span class="kw">public class</span> Globals {
    <span class="kw">public static</span> User currentUser;      <span class="cm">// everyone reads AND writes this</span>
    <span class="kw">public static</span> String lastError;
}`,
    story: <span><b>Common coupling</b> 🌐 — modules share writable global state. Who set <C>currentUser</C>?
      Anyone. When? No idea. Every reader is invisibly coupled to every writer; tests can't run in parallel;
      bugs appear in module A because module Z wrote first. Constants (<C>static final</C>) are fine — it's the
      <i>mutable</i> sharing that burns.</span>,
  },
  control: {
    label: 'control (flags)',
    temp: 2,
    code: `<span class="cm">// the caller steers the callee's INTERNAL logic with a flag</span>
printer.print(report, <span class="kw">true</span>);   <span class="cm">// true = …admin mode? draft? color?? read the source 😬</span>

<span class="kw">void</span> print(Report r, <span class="kw">boolean</span> isAdmin) {
    <span class="kw">if</span> (isAdmin) { <span class="cm">/* one behavior */</span> } <span class="kw">else</span> { <span class="cm">/* another */</span> }
}`,
    story: <span><b>Control coupling</b> 🎛️ — passing flags that tell another module <i>which</i> of its internal
      paths to take. The caller must know the callee's insides to choose the flag — and the boolean reads as
      a riddle at every call site. Often better: two well-named methods, or polymorphism (Day 12).</span>,
  },
  data: {
    label: 'data (plain values)',
    temp: 1,
    code: `<span class="cm">// just the values needed — nothing more</span>
<span class="kw">double</span> tax = taxCalculator.calculate(amount, state);`,
    story: <span><b>Data coupling</b> 📦 — modules talk by passing the simple values they need. No internals, no
      globals, no steering flags. The dependency is visible in the signature and nowhere else. Healthy,
      everyday coupling.</span>,
  },
  message: {
    label: 'interface (best)',
    temp: 0,
    code: `<span class="cm">// depends only on a small contract — not even on WHO is behind it</span>
<span class="kw">private final</span> OrderStore store;     <span class="cm">// any implementation welcome (Day 15)</span>
store.save(order);`,
    story: <span><b>Interface/message coupling</b> 🔌 — the caller knows a lean contract, not a concrete class.
      Implementations swap freely, tests inject fakes. This is the loosest practical coupling — the wall socket
      from Day 15. (Zero coupling would mean the modules can't cooperate at all.)</span>,
  },
}
const COUPLING_KEYS = ['content', 'global', 'control', 'data', 'message']

function CouplingLadder() {
  const [lvl, setLvl] = useState('content')
  const d = COUPLING_LEVELS[lvl]
  return (
    <div className="panel">
      <div className="ptitle">Live demo · climb the coupling ladder, worst → best</div>
      <div className="modbtns">
        {COUPLING_KEYS.map((k) => (
          <button key={k} className={lvl === k ? 'on' : ''} onClick={() => setLvl(k)}>{COUPLING_LEVELS[k].label}</button>
        ))}
      </div>
      <Code html={d.code} />
      <div className="statbar">
        🌡️ <span>tightness:</span>
        <b>{'█'.repeat(d.temp + 1)}{'░'.repeat(4 - d.temp)} {['loosest — the goal', 'loose', 'medium', 'tight', 'WELDED'][d.temp]}</b>
      </div>
      <div className="modexplain">{d.story}</div>
    </div>
  )
}

/* ============ Interactive 2: The cohesion grader ============ */
const COHESION_ITEMS = [
  { d: 'class HelperUtils { formatDate(), calculateGst(), shuffleArray(), isValidEmail() }',
    a: 'coincidental', why: 'Four methods with NOTHING in common except homelessness. The class name confesses it ("Utils"). This is a junk drawer — each method belongs near the data it serves.' },
  { d: 'class AppStartup { openDbConnection(), loadConfig(), warmCache(), startScheduler() } — they run together at boot.',
    a: 'temporal', why: 'Grouped only because they happen at the same TIME. Tolerable for a thin startup script — but the real logic of each step should live in its own module, and AppStartup should only call out.' },
  { d: 'class Exporters { exportPdf(), exportCsv(), exportXml() } — "they are all exports, so they live together."',
    a: 'logical', why: 'Grouped because they are the same KIND of thing, usually selected by a flag or switch. Smells like Day 12: an Exporter interface with one class per format serves clients better than a bundle.' },
  { d: 'class OrderValidator { checkItems(), checkAddress(), checkStock() } — all called by validate(Order o), all reading the same order.',
    a: 'functional', why: 'Every member contributes to ONE job on ONE piece of data: validating an order. This is the gold standard — the class can be named with a single honest noun-verb phrase.' },
  { d: 'class Invoice { items; addItem(), subTotal(), withGst() } — data plus the operations on that data.',
    a: 'functional', why: 'Data and the behavior that guards and uses it, together (Days 1–2 + Information Expert). Highest cohesion there is — the textbook reason classes exist.' },
  { d: 'class MiscManager { log(), retryNetworkCall(), todaysDate(), deepCopy() }',
    a: 'coincidental', why: 'Another junk drawer wearing a "Manager" badge. Watch the names: Misc, Common, Shared, Util, Helper — they all mean "we never decided where this belongs".' },
]
const COHESION_CHOICES = [
  ['coincidental', '🗑️ coincidental (junk drawer)'],
  ['logical', '🏷️ logical (same kind)'],
  ['temporal', '⏰ temporal (same time)'],
  ['functional', '🏆 functional (one job)'],
]

function CohesionGrader() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= COHESION_ITEMS.length
  const cur = COHESION_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · grade the glue — what holds this class together?</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {COHESION_ITEMS.length}</b>{score === COHESION_ITEMS.length ? ' — you can smell a junk drawer from across the room.' : '. The names (Utils, Manager, Misc) are the biggest hints — replay.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            🧪 <span>class {idx + 1} of {COHESION_ITEMS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'IBM Plex Mono' }}>{cur.d}</p>
          <div className="modbtns">
            {COHESION_CHOICES.map(([k, label]) => (
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
                <button className="ghost act" onClick={next}>Next class →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: The dependency web (blast radius) ============ */
const WEBS = {
  tangled: {
    label: '🕸️ tangled system',
    nodes: {
      UI: [300, 40], Orders: [160, 130], Payments: [440, 130],
      Reports: [90, 250], DB: [300, 250], Email: [510, 250],
    },
    // A → B means "A depends on B" (A breaks when B changes)
    edges: [
      ['UI', 'Orders'], ['UI', 'Reports'], ['Orders', 'Payments'], ['Payments', 'Orders'],
      ['Orders', 'DB'], ['Payments', 'DB'], ['Orders', 'Email'], ['Email', 'Orders'],
      ['Reports', 'DB'], ['Reports', 'Orders'], ['Payments', 'Email'],
    ],
  },
  clean: {
    label: '🧹 layered system',
    nodes: {
      UI: [220, 40], Reports: [420, 40], OrderService: [220, 130],
      'PayPort 🔌': [90, 220], 'StorePort 🔌': [320, 220], 'NotifPort 🔌': [520, 220],
      PayImpl: [90, 300], DbImpl: [320, 300], EmailImpl: [520, 300],
    },
    edges: [
      ['UI', 'OrderService'], ['OrderService', 'PayPort 🔌'], ['OrderService', 'StorePort 🔌'],
      ['OrderService', 'NotifPort 🔌'], ['Reports', 'StorePort 🔌'],
      ['PayImpl', 'PayPort 🔌'], ['DbImpl', 'StorePort 🔌'], ['EmailImpl', 'NotifPort 🔌'],
    ],
  },
}

function dependentsOf(target, edges) {
  // everyone who (transitively) depends on target = breaks when target changes
  const hit = new Set()
  let grew = true
  while (grew) {
    grew = false
    for (const [a, b] of edges) {
      if ((b === target || hit.has(b)) && !hit.has(a) && a !== target) {
        hit.add(a); grew = true
      }
    }
  }
  return hit
}

function DependencyWeb() {
  const [web, setWeb] = useState('tangled')
  const [sel, setSel] = useState(null)
  const W = WEBS[web]
  const blast = sel ? dependentsOf(sel, W.edges) : new Set()

  return (
    <div className="panel">
      <div className="ptitle">Live demo · click a module = "this module just changed" — red = must re-check</div>
      <div className="modbtns">
        {Object.keys(WEBS).map((k) => (
          <button key={k} className={web === k ? 'on' : ''} onClick={() => { setWeb(k); setSel(null) }}>{WEBS[k].label}</button>
        ))}
      </div>
      <svg viewBox="0 0 620 350" style={{ width: '100%', background: '#fff', border: '1px solid var(--line)', borderRadius: 10 }}>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9aa3b5" />
          </marker>
        </defs>
        {W.edges.map(([a, b], i) => {
          const [x1, y1] = W.nodes[a]; const [x2, y2] = W.nodes[b]
          const lit = sel && (a === sel || blast.has(a)) && (b === sel || blast.has(b) || b === sel)
          return <line key={i} x1={x1} y1={y1 + 14} x2={x2} y2={y2 - 14}
            stroke={lit ? '#D9534F' : '#c9cdd6'} strokeWidth={lit ? 2.2 : 1.4}
            strokeDasharray={web === 'clean' && (b.includes('🔌')) && a.includes('Impl') ? '5,4' : 'none'}
            markerEnd="url(#arr)" />
        })}
        {Object.entries(W.nodes).map(([n, [x, y]]) => {
          const isSel = sel === n
          const isHit = blast.has(n)
          return (
            <g key={n} onClick={() => setSel(n)} style={{ cursor: 'pointer' }}>
              <rect x={x - 52} y={y - 14} width="104" height="28" rx="8"
                fill={isSel ? '#2D5BFF' : isHit ? '#FFE0DE' : '#fff'}
                stroke={isSel ? '#2D5BFF' : isHit ? '#D9534F' : '#1B2A4A'} strokeWidth="1.6" />
              <text x={x} y={y + 4} textAnchor="middle"
                style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, fill: isSel ? '#fff' : '#1B2A4A' }}>{n}</text>
            </g>
          )
        })}
      </svg>
      <div className="statbar">
        {sel
          ? <span>💥 <span><b>{sel}</b> changed → blast radius:</span> <b>{blast.size} module{blast.size === 1 ? '' : 's'} {blast.size ? `(${[...blast].join(', ')})` : '— nobody depends on it. Change it fearlessly. 🎉'}</b></span>
          : <span>👆 <span>Click any module to simulate changing it. Try <b>DB</b> in the tangled web, then <b>DbImpl</b> in the layered one.</span></span>}
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'Coupling and cohesion measure, respectively…',
    o: ['Speed and memory', 'How much modules depend on EACH OTHER, and how strongly things INSIDE one module belong together', 'Lines of code and file count', 'Inheritance depth and interface count'], a: 1,
    e: 'Coupling = the ropes BETWEEN boxes. Cohesion = the glue INSIDE a box. They are the two forces every design rule this month has been managing.',
    w: { 0: 'Both are structural measures, not performance ones.',
         2: 'Counting artifacts misses the point — it\'s about RELATIONSHIPS.',
         3: 'Those are narrow metrics; coupling/cohesion are the general forces.' },
    r: { id: 's1', label: 'Section 1 — the office floor' } },
  { q: 'The universal design goal is…',
    o: ['High coupling, high cohesion', 'Low coupling, low cohesion', 'LOW coupling between modules, HIGH cohesion inside each module', 'Zero coupling everywhere'], a: 2,
    e: 'Loose, few, visible ropes between boxes; tightly related contents within each box. Note: ZERO coupling is impossible — modules must talk to cooperate. The goal is loose and visible, not none.',
    w: { 0: 'High coupling = every change ripples everywhere.',
         1: 'Low cohesion = junk drawers everywhere.',
         3: 'Zero coupling = modules that can\'t even cooperate — a pile of hermits, not a system.' },
    r: { id: 's1', label: 'Section 1 — the slogan' } },
  { q: 'account.balance = account.balance - fee; (from another class) is which coupling level?',
    o: ['Data coupling — it passes data', 'Content coupling — reaching into another object\'s internals, the worst level', 'Interface coupling', 'No coupling'], a: 1,
    e: 'Editing another module\'s insides bypasses every rule its methods enforce. This is the disease encapsulation (Day 2) exists to prevent — the bottom of the ladder.',
    w: { 0: 'Data coupling passes simple VALUES through parameters — this reaches into organs.',
         2: 'Interface coupling is the ladder\'s TOP — this is its bottom.',
         3: 'Very much coupling — the strongest, most invasive kind.' },
    r: { id: 's3', label: 'Section 3 — the coupling ladder' } },
  { q: 'printer.print(report, true) — what is the smell, and its name?',
    o: ['Too few arguments', 'Control coupling: a flag steers the callee\'s internal logic, and the caller must know its insides to pick the flag', 'Temporal cohesion', 'Content coupling'], a: 1,
    e: 'Booleans that select internal behavior couple the caller to the callee\'s implementation AND read as riddles at call sites. Prefer two named methods or polymorphism.',
    w: { 0: 'Argument count isn\'t the issue — MEANING is.',
         2: 'Temporal cohesion is about grouping by time inside a module.',
         3: 'Content coupling touches internals directly — this steers them via a flag.' },
    r: { id: 's3', label: 'Section 3 — control coupling' } },
  { q: 'class Utils { formatDate(), calcTax(), shuffle() } exhibits which cohesion?',
    o: ['Functional — they are all useful', 'Coincidental — the members share nothing but an address; it\'s a junk drawer', 'Temporal', 'Sequential'], a: 1,
    e: 'The weakest cohesion: unrelated things living together because nobody decided where they belong. Each method should move next to the data it actually serves.',
    w: { 0: '"All useful" describes every method ever written — usefulness isn\'t glue.',
         2: 'Temporal = grouped by WHEN they run (init); these share nothing at all.',
         3: 'Sequential = output feeds input; no such chain here.' },
    r: { id: 's4', label: 'Section 4 — the cohesion ladder' } },
  { q: 'The smell "one small business change forces edits in 9 files" is called ______, and signals ______.',
    o: ['Divergent change; high cohesion', 'Shotgun surgery; the knowledge for that change is scattered — cohesion failed for that concern', 'Feature envy; good layering', 'Dead code; YAGNI'], a: 1,
    e: 'Shotgun surgery = one reason-to-change sprayed across many modules. Its mirror twin, divergent change (one class edited for many unrelated reasons), is the SRP god class. Both are cohesion diseases.',
    w: { 0: 'Divergent change is the MIRROR image — one class, many reasons.',
         2: 'Feature envy is a method coveting another object\'s data (Day 18).',
         3: 'Dead code and YAGNI are about unused things, not scattered edits.' },
    r: { id: 's8', label: 'Section 8 — diagnosing symptoms' } },
  { q: 'How do SRP and DIP map onto today\'s two forces?',
    o: ['Both are coupling rules', 'SRP is a COHESION rule (one reason to change = strong glue); DIP is a COUPLING rule (point your ropes at stable abstractions)', 'Both are cohesion rules', 'Neither relates'], a: 1,
    e: 'Almost every principle resolves to one of the two forces: SRP/ISP push cohesion; OCP/LSP/DIP/Demeter manage coupling. Coupling & cohesion are the physics; the principles are the engineering.',
    w: { 0: 'SRP is the textbook COHESION rule.',
         2: 'DIP is the textbook COUPLING rule.',
         3: 'They map cleanly — that mapping is the day\'s big reveal.' },
    r: { id: 's6', label: 'Section 6 — the principles → forces table' } },
  { q: 'In the layered system, NOBODY depended on DbImpl (blast radius 0), while StorePort had several dependents. Why is that the healthy shape?',
    o: ['It is a bug — impls should be depended on', 'Volatile details (impls) should have few dependents so they can change freely; many dependents should rest only on STABLE things (small interfaces)', 'Ports should depend on impls', 'Blast radius should be equal everywhere'], a: 1,
    e: 'Depend-on-stable is the rule: interfaces change rarely, so they can afford many dependents. Implementations churn, so nothing should sit on them. That asymmetry IS Day 15\'s inversion, seen as a graph.',
    w: { 0: 'Zero dependents on an impl is the GOAL, not a bug.',
         2: 'Ports depending on impls would re-invert the arrows the wrong way.',
         3: 'Equal blast radius everywhere would mean no stable center exists.' },
    r: { id: 's7', label: 'Section 7 — the blast radius machine' } },
]

/* ============ The page ============ */
export default function Day17() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 4 · Day 17</div>
        <h1>Coupling &amp; Cohesion:<br />The Two Forces Behind Every Rule</h1>
        <p>For sixteen days you've been told "do this, avoid that." Today you meet the physics underneath all of
           it: two measurable forces that every principle — encapsulation, SOLID, DRY — has secretly been
           managing. See them once, and you can derive the rules yourself. Click everything.</p>
        <div className="chips">
          {['coupling', 'cohesion', 'blast radius', 'coupling ladder', 'junk drawer', 'shotgun surgery'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The office floor</h2>
        <p>Picture an office floor with several <strong>departments</strong> (your classes/modules). Two
          properties decide whether work flows or jams:</p>
        <ul>
          <li><strong>Inside each department — cohesion.</strong> A great department contains people who all work
            on <em>one</em> mission and constantly need each other. A terrible one is a random room of an
            accountant, a chef and a security guard who just happen to share a door.</li>
          <li><strong>Between departments — coupling.</strong> Healthy: a few official request forms (small
            interfaces). Sick: walking into another department, opening their drawers, rearranging their files
            (touching internals), or 40 meetings a day where everyone needs everyone.</li>
        </ul>
        <Code html={`        the two dials of every design

   COHESION = the glue INSIDE a box        COUPLING = the ropes BETWEEN boxes
   (want it HIGH)                          (want them FEW, THIN, VISIBLE)

   ┌─────────────────┐                     ┌─────────┐ ════════ ┌─────────┐
   │ ●●●●  one job,  │       GOOD          │  box A  │──────────│  box B  │  BAD: thick ropes,
   │ ●●●●  one team, │                     └─────────┘ ════════ └─────────┘  many ropes, hidden
   │ used together   │                          one thin rope               ropes (globals!)
   └─────────────────┘                          (an interface)
   vs: 🗑️ the junk drawer — unrelated stuff sharing an address ("Utils")`} />
        <Note><strong>The slogan to tattoo:</strong> <em>low coupling, high cohesion.</em> Things that change
          together live together (cohesion); things that change separately touch only through small stable
          contracts (coupling). Every rule from Days 1–16 is a special case of this sentence.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Coupling — what it really costs</h2>
        <p>Coupling is not abstract evil; it has a precise price: <strong>when module B changes, every module
          coupled to B might break, must be re-checked, and might need edits.</strong> The sum of those modules
          is B's <em>blast radius</em>. High coupling = every change is expensive = the codebase slowly
          freezes ("we don't touch that part").</p>
        <p>But coupling comes in <strong>grades</strong> — and the grades matter more than the count. The ladder
          below runs from "welded together" to "barely touching":</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🪜 Play: The coupling ladder</h2>
        <p>Climb from worst to best. At each rung, note WHO must know WHAT about WHOM — that knowledge is the
          coupling.</p>
        <CouplingLadder />
        <Good><strong>What you should notice:</strong> ① Each rung you climb, the caller knows LESS about the
          callee — from its organs (content) to just a tiny contract (interface). ② The worst three rungs are
          exactly what Day 2 (encapsulation), avoid-globals folklore, and Day 12 (no flag-switches) banned —
          now you know the underlying reason. ③ The ladder's top is not zero coupling; it's <em>visible, thin</em>
          coupling.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Cohesion — what holds a class together?</h2>
        <p>Look at any class and ask: <strong>why do these members share a file?</strong> The possible answers
          form a ladder too, from shameful to gold:</p>
        <table className="matrix">
          <thead>
            <tr><th>grade</th><th>the members are together because…</th><th>example</th><th>verdict</th></tr>
          </thead>
          <tbody>
            <tr><td>coincidental</td><td>…no reason. A junk drawer.</td><td><C>Utils</C>, <C>Misc</C>, <C>Common</C></td><td className="no">refactor</td></tr>
            <tr><td>logical</td><td>…they're the same KIND of thing (picked by a flag)</td><td><C>Exporters</C> with pdf/csv/xml</td><td className="no">often → Day 12 interface</td></tr>
            <tr><td>temporal</td><td>…they run at the same TIME</td><td><C>init()</C>, <C>shutdown()</C></td><td>tolerable, keep thin</td></tr>
            <tr><td>sequential</td><td>…output of one feeds the next</td><td>fetch → compute → format</td><td>decent</td></tr>
            <tr><td className="yes">functional</td><td>…they all serve ONE job on ONE concept</td><td><C>OrderValidator</C>, <C>Invoice</C></td><td className="yes">the gold standard</td></tr>
          </tbody>
        </table>
        <Warn><strong>The junk-drawer magnet:</strong> once a <C>Utils</C> class exists, every homeless function
          moves in — it only grows. The fix is rehoming: each method moves next to the data it serves
          (Information Expert, Day 10). The few that truly are generic (a date formatter) get a SPECIFIC home:
          <C> DateFormat</C>, not <C>Utils</C>.</Warn>
        <Reveal summary="A 10-second cohesion test for any class — click to reveal.">
          <p>Try to describe the class in one sentence <strong>without using "and" or "various"</strong>
            (Day 11's test). Then check: do most methods use most fields? High overlap = high cohesion. If half
            the methods use fields A&amp;B and the other half only C&amp;D, two classes are sharing a coat.</p>
        </Reveal>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🧪 Play: Grade the glue</h2>
        <p>Six classes from a real-looking codebase. Name what holds each together — the class names themselves
          are evidence.</p>
        <CohesionGrader />
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The big reveal: the whole month was these two forces</h2>
        <p>Lay the last sixteen days on today's two dials and watch everything click into one picture:</p>
        <table className="matrix">
          <thead>
            <tr><th>rule you learned</th><th>which force it manages</th><th>how</th></tr>
          </thead>
          <tbody>
            <tr><td>Encapsulation (Day 2)</td><td>coupling ↓</td><td>outlaws content coupling — no touching organs</td></tr>
            <tr><td>Composition over inheritance (Day 7)</td><td>coupling ↓</td><td>inheritance is the tightest rope; has-a is thinner</td></tr>
            <tr><td>SRP (Day 11)</td><td className="yes">cohesion ↑</td><td>one reason to change = functional cohesion</td></tr>
            <tr><td>OCP (Day 12)</td><td>coupling ↓</td><td>clients hold a rope to the interface, not to each variant</td></tr>
            <tr><td>LSP (Day 13)</td><td>coupling ↓</td><td>keeps the thin rope TRUSTWORTHY (no instanceof patches)</td></tr>
            <tr><td>ISP (Day 14)</td><td>both</td><td>cohesive contracts; clients hold the thinnest possible rope</td></tr>
            <tr><td>DIP (Day 15)</td><td>coupling ↓</td><td>ropes point at stable abstractions, never at churning details</td></tr>
            <tr><td>DRY (Day 16)</td><td className="yes">cohesion ↑</td><td>one piece of knowledge = one home</td></tr>
          </tbody>
        </table>
        <Note><strong>Why this matters for interviews:</strong> when asked "why is this design better?", junior
          answers name a pattern; senior answers name the force: <em>"it lowers coupling — the payment change no
          longer touches ordering"</em> or <em>"it raises cohesion — all pricing rules now live in one
          place."</em> Forces are the reasons; principles are just their famous applications.</Note>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🕸️ Play: The blast radius machine</h2>
        <p>Two systems with the same six-ish responsibilities, wired differently. Click a module to change it
          and watch who turns red (= must be re-checked). Try <strong>DB</strong> in the tangle, then
          <strong> DbImpl</strong> in the layered version.</p>
        <DependencyWeb />
        <Good><strong>What you should notice:</strong> ① In the tangle, changing the DB lights up almost the whole
          floor — and the Orders↔Payments cycle means they can never change separately again. ② In the layered
          web, implementations have blast radius ZERO — nothing rests on them, so they can change daily.
          ③ The ports 🔌 have many dependents — and that's fine, BECAUSE they are small and stable. Let many
          things rest only on what rarely moves.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Diagnosing your own code (the symptoms)</h2>
        <ul>
          <li><strong>Shotgun surgery</strong> 💥 — one small business change forces edits in 9 files. The
            knowledge for that concern is scattered: cohesion failed. Gather it into one home.</li>
          <li><strong>Divergent change</strong> 🌪️ — one class keeps being edited for unrelated reasons. That's
            the god class (Day 11) in force-language. Split by actor.</li>
          <li><strong>The fear list</strong> 😨 — "don't touch OrderManager" = its coupling is so high nobody can
            predict the blast radius. Fear is a metric.</li>
          <li><strong>Test pain</strong> 🧪 — needing 12 mocks to test one class = 12 ropes. Hard-to-test IS
            high coupling (Day 15 said it; now you know why).</li>
          <li><strong>Import lists</strong> 📜 — a class importing from every package in the app has its hands in
            everything. Fan-out you can read at the top of the file.</li>
          <li><strong>Cycles</strong> 🔄 — A depends on B depends on A: they are now ONE module wearing two names.
            Break the cycle with an interface (DIP) or by moving the shared piece out.</li>
        </ul>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Chasing ZERO coupling</h3>
        <p>Modules must talk or there is no system. The goal is few, thin, <em>visible</em> ropes (signatures,
          interfaces) — never hidden ones (globals, shared files, reflection).</p>
        <h3>Trap 2 — "High cohesion" used to defend a god class</h3>
        <p>"But all 40 methods are about orders!" — at that size, "about orders" is not ONE job. Functional
          cohesion means one <em>responsibility</em> (Day 11's actor test), not one <em>topic</em>.</p>
        <h3>Trap 3 — Layering theater</h3>
        <p>Folders named controller/service/repository while every class still calls every other = the tangle
          wearing a uniform. Coupling is measured by dependencies, not by directory names.</p>
        <h3>Trap 4 — Breaking coupling by copy-paste</h3>
        <p>"I removed the dependency — I copied the code!" Now you have hidden coupling through duplicated
          knowledge (Day 16) — the worst rope is the invisible one.</p>
        <h3>Trap 5 — One giant interface to "decouple everything"</h3>
        <p>A 30-method <C>ISystemFacade</C> between layers is a fat rope with an interface costume (Day 14).
          Thin ropes are many SMALL contracts, each serving one client need.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Cohesion</strong> = glue inside a box (want HIGH). <strong>Coupling</strong> = ropes between boxes (want LOW, thin, visible). Slogan: things that change together live together; everything else talks through small stable contracts.</li>
          <li><strong>Coupling ladder</strong> (worst→best): content (organs) → common (globals) → control (flags) → data (values) → interface (contracts).</li>
          <li><strong>Cohesion ladder</strong> (worst→best): coincidental (junk drawer) → logical (same kind) → temporal (same time) → sequential → functional (one job, one concept).</li>
          <li><strong>Blast radius</strong> = who must re-check when X changes. Volatile details deserve radius ~0; only small stable interfaces may carry many dependents.</li>
          <li><strong>Symptoms:</strong> shotgun surgery (scattered knowledge) · divergent change (god class) · fear list · mock armies · giant imports · cycles.</li>
          <li>Principles → forces: SRP/ISP/DRY raise cohesion; encapsulation/OCP/LSP/DIP/composition lower coupling. Answer "why better?" with the force, not the pattern name.</li>
          <li>Traps: zero-coupling fantasy · "cohesive" god classes · layering theater · decoupling by copy-paste · fat facade ropes.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Who invented coupling & cohesion as metrics?">
          <p>Larry Constantine (with Ed Yourdon), <em>Structured Design</em>, 1970s — predating OOP entirely.
            The concepts survived three programming paradigms unchanged, which is exactly why they're the
            "physics" under every newer rule.</p>
        </Reveal>
        <Reveal summary='Q: The classic ladder has a level we simplified away: STAMP coupling. Define it.'>
          <p>Passing a whole data STRUCTURE when the callee needs one field:
            <C> printAge(Employee e)</C> instead of <C>printAge(int age)</C>. Sits between control and data
            coupling. It couples the callee to the structure's shape needlessly — the parameter-list cousin of
            Day 14's "ask for the narrowest type".</p>
        </Reveal>
        <Reveal summary="Q: The cohesion scale also had levels we compressed — name the full seven.">
          <p>Worst→best: coincidental, logical, temporal, <strong>procedural</strong> (steps of a workflow),
            <strong> communicational</strong> (operate on the same data), sequential (output feeds input),
            functional. For exams: know the seven names; for design reviews: junk-drawer vs one-job is 90% of
            the value.</p>
        </Reveal>
        <Reveal summary='Q: "Temporal coupling" has a SECOND meaning besides the cohesion grade — what is it?'>
          <p>Order-of-calls dependency: <C>init()</C> must be called before <C>process()</C>, or it breaks.
            The API allows the wrong order; only tribal knowledge prevents it. Cures: constructors that
            return ready objects, builder/staged types, or making each method self-sufficient. A favorite
            "spot the hidden coupling" question.</p>
        </Reveal>
        <Reveal summary="Q: Afferent vs efferent coupling — and the instability metric?">
          <p>Ca (afferent) = who depends ON me (incoming). Ce (efferent) = whom I depend on (outgoing).
            Instability I = Ce / (Ca + Ce): 0 = maximally stable (many dependents, few dependencies — should be
            abstract), 1 = maximally unstable (free to change). Martin's package metrics — deep-cut trivia that
            lands well in senior interviews.</p>
        </Reveal>
        <Reveal summary="Q: Why are dependency CYCLES (A→B→A) singled out as especially bad?">
          <p>The cycle is one unit: neither side can be understood, tested, versioned, or released alone — two
            names, one module. Compile order breaks, and the blast radius of either is both. Break cycles with
            an interface one side owns (DIP) or by extracting the shared piece into a third module.</p>
        </Reveal>
        <Reveal summary='Q: Interviewer: "give me a MEASURABLE definition of good design."'>
          <p>"Low coupling, high cohesion — measurable as: small blast radius per change (few files touched per
            feature), no cycles, dependencies pointing at stable abstractions, and tests needing few mocks. Every
            SOLID principle is a special case of moving those numbers." That answer compresses the whole month
            into four metrics.</p>
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
        <strong>Day 17 complete?</strong> Homework: draw your own blast-radius map. Take your Day 15 ReportApp
        (or any project), list its classes as boxes, and draw every dependency arrow (imports, field types,
        constructor params — and don't forget hidden ropes: statics and globals). Then: ① mark each box's blast
        radius; ② find your tightest rope and name its ladder rung; ③ find your worst junk drawer and rehome one
        method from it. One page of paper, honestly drawn, teaches more than ten articles.
        <br /><br />
        Next: <strong>Day 18 — Law of Demeter</strong>: coupling's most practical street rule — why
        <C> order.getCustomer().getAddress().getCity()</C> is a four-car train wreck, and how to talk only to
        your friends.
      </div>
    </div>
  )
}
