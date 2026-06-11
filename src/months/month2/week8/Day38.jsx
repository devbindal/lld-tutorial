import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: Web vs tower ============ */
function WebVsTower() {
  const [mode, setMode] = useState('web')
  const [n, setN] = useState(4)

  const planes = Array.from({ length: n }, (_, i) => {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2
    return { x: 160 + 110 * Math.cos(ang), y: 130 + 95 * Math.sin(ang), id: i }
  })
  const pairCount = (n * (n - 1)) / 2

  return (
    <div className="panel">
      <div className="ptitle">Live demo · who must know whom, up there?</div>
      <div className="modbtns">
        <button className={mode === 'web' ? 'on' : ''} onClick={() => setMode('web')}>😱 planes talk pairwise</button>
        <button className={mode === 'tower' ? 'on' : ''} onClick={() => setMode('tower')}>🗼 everything through the tower</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => setN((x) => Math.min(x + 1, 7))} disabled={n >= 7}>✈️ a new plane enters the airspace</button>
        <button className="ghost act" onClick={() => setN(4)}>reset (4 planes)</button>
      </div>
      <svg viewBox="0 0 320 270" style={{ width: 320, maxWidth: '100%', background: '#Eef3f8', border: '1px solid var(--line)', borderRadius: 10 }}>
        {mode === 'web'
          ? planes.flatMap((a) => planes.filter((b) => b.id > a.id).map((b) => (
              <line key={`${a.id}-${b.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#D9534F" strokeWidth="1.5" opacity="0.65" />
            )))
          : planes.map((a) => (
              <line key={a.id} x1={a.x} y1={a.y} x2="160" y2="130" stroke="#2E9E6B" strokeWidth="2" opacity="0.8" />
            ))}
        {mode === 'tower' && <text x="160" y="138" textAnchor="middle" style={{ fontSize: 26 }}>🗼</text>}
        {planes.map((p) => (
          <text key={p.id} x={p.x} y={p.y + 7} textAnchor="middle" style={{ fontSize: 22 }}>✈️</text>
        ))}
      </svg>
      <div className="statbar" style={{ background: mode === 'web' && n >= 6 ? '#FDECEC' : '#FFF6E8', marginTop: 8 }}>
        {mode === 'web'
          ? <span>📡 <span>{n} planes =</span> <b>{pairCount} radio channels</b> <span>— each pilot tracks {n - 1} others while flying. The next plane adds {n} MORE channels: N(N−1)/2 growth.</span></span>
          : <span>🗼 <span>{n} planes =</span> <b>{n} channels</b> <span>— each pilot knows ONE callsign: the tower. A new plane adds exactly one line, and only the tower learns its name.</span></span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: The smart checkout form ============ */
function SmartForm() {
  const [diffAddr, setDiffAddr] = useState(false)
  const [address, setAddress] = useState('')
  const [payment, setPayment] = useState('wallet')
  const [log, setLog] = useState([])

  const say = (m) => setLog((l) => [...l.slice(-2), m])

  const addressEnabled = diffAddr
  const validateEnabled = diffAddr && address.trim().length > 3
  const walletEnabled = payment !== 'cod'

  function toggleAddr() {
    const v = !diffAddr
    setDiffAddr(v)
    if (!v) setAddress('')
    say(`☑️ checkbox → mediator.notify(checkbox, ${v ? 'CHECKED' : 'UNCHECKED'}) → mediator ${v ? 'ENABLES address field' : 'disables + clears address, disables validate'}`)
  }
  function typeAddr(v) {
    setAddress(v)
    say(`⌨️ addressField → mediator.notify(field, CHANGED) → mediator sets validateBtn.${diffAddr && v.trim().length > 3 ? 'enable()' : 'disable()'} (needs > 3 chars)`)
  }
  function pickPayment(p) {
    setPayment(p)
    say(p === 'cod'
      ? '🔘 codRadio → mediator.notify(radio, COD) → mediator DISABLES wallet dropdown + shows ₹20 fee note'
      : '🔘 walletRadio → mediator.notify(radio, WALLET) → mediator re-enables wallet dropdown, hides fee')
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · four widgets, zero widget-to-widget wires — the mediator runs the show</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 250, border: '1px solid var(--line)', borderRadius: 10, padding: 14, background: '#fff' }}>
          <label style={{ display: 'block', fontSize: 14, marginBottom: 8, cursor: 'pointer' }} onClick={toggleAddr}>
            {diffAddr ? '☑️' : '⬜'} deliver to a different address
          </label>
          <input className="txt" style={{ width: '90%', marginBottom: 8, opacity: addressEnabled ? 1 : 0.4 }}
            disabled={!addressEnabled} value={address} placeholder={addressEnabled ? 'street, city…' : '(disabled)'}
            onChange={(e) => typeAddr(e.target.value)} aria-label="address" />
          <div style={{ marginBottom: 8 }}>
            <button className="act" style={{ fontSize: 12.5, opacity: validateEnabled ? 1 : 0.4 }} disabled={!validateEnabled}>
              validate address
            </button>
          </div>
          <div style={{ fontSize: 13.5, marginBottom: 6 }}>
            <span style={{ cursor: 'pointer' }} onClick={() => pickPayment('wallet')}>{payment === 'wallet' ? '🔘' : '⚪'} wallet</span>
            {'  '}
            <span style={{ cursor: 'pointer' }} onClick={() => pickPayment('cod')}>{payment === 'cod' ? '🔘' : '⚪'} cash on delivery</span>
          </div>
          <select disabled={!walletEnabled} style={{ opacity: walletEnabled ? 1 : 0.4, fontFamily: 'IBM Plex Sans', padding: 4 }} aria-label="wallet">
            <option>PayBuddy</option><option>QuickPe</option>
          </select>
          {payment === 'cod' && <div style={{ fontSize: 12, color: '#B97A14', marginTop: 6 }}>+ ₹20 COD handling fee</div>}
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="statbar" style={{ display: 'block' }}>
            {log.length === 0
              ? <span>👆 Touch any widget. Every reaction routes through ONE object — no widget ever names another widget.</span>
              : log.map((l, i) => <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{l}</div>)}
          </div>
        </div>
      </div>
      <div className="statbar">
        🧠 <span>The interaction rules ("COD disables wallet", "validate needs 4+ chars") live in ONE mediator file — not smeared across four widgets that import each other.</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: The chat room ============ */
const EXTRA_USERS = ['Kabir', 'Zoya']

function ChatRoom() {
  const [users, setUsers] = useState(['Asha', 'Ravi', 'Meera'])
  const [sender, setSender] = useState('Asha')
  const [text, setText] = useState('hello everyone!')
  const [inbox, setInbox] = useState({})
  const [note, setNote] = useState(null)

  function send() {
    const msg = text.trim()
    if (!msg) return
    if (msg.toLowerCase().includes('password')) {
      setNote(`🚫 room blocked the message — house rule: no credentials in chat. Only ${sender} was told; nobody else ever saw it. ONE rule, ONE place.`)
      return
    }
    setNote(null)
    setInbox((b) => {
      const next = { ...b }
      users.filter((u) => u !== sender).forEach((u) => {
        next[u] = [...(next[u] || []).slice(-1), `${sender}: ${msg}`]
      })
      return next
    })
  }
  function addUser() {
    const candidate = EXTRA_USERS.find((u) => !users.includes(u))
    if (candidate) setUsers((u) => [...u, candidate])
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · users know the ROOM; the room knows everyone</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13 }}>sender:</span>
        {users.map((u) => (
          <span key={u} className="chip" onClick={() => setSender(u)}
            style={{ cursor: 'pointer', ...(sender === u ? { background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)' } : {}) }}>{u}</span>
        ))}
        <button className="ghost act" onClick={addUser} disabled={users.length >= 5}>+ user joins</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <input className="txt" style={{ minWidth: 220 }} value={text} onChange={(e) => setText(e.target.value)} aria-label="message" />
        <button className="act" onClick={send}>room.send(sender, msg)</button>
      </div>
      {note && <div className="statbar" style={{ background: '#FDECEC', marginBottom: 8 }}><span style={{ fontSize: 13.5 }}>{note}</span></div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {users.map((u) => (
          <div className="obj" key={u} style={{ minWidth: 160 }}>
            <div className="oref">💬 {u}{u === sender ? ' (sending)' : ''}</div>
            {(inbox[u] || []).length === 0
              ? <div className="ofield" style={{ color: '#9aa3b5' }}>no messages yet</div>
              : inbox[u].map((m, i) => <div className="ofield" key={i}>{m}</div>)}
            <div className="ofield" style={{ fontSize: 11, color: '#9aa3b5' }}>knows: the Room. Nothing else.</div>
          </div>
        ))}
      </div>
      <div className="statbar">
        🏠 <span>Try "my password is 1234" — and notice a joining user needed ZERO changes to existing users: they address the room, never each other.</span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Mediator pattern\'s intent is…',
    o: ['To broadcast to unknown subscribers', 'To define ONE object that encapsulates HOW a set of colleagues interact — they hold only the mediator, never each other, and it runs the conversation rules', 'To simplify a subsystem for outsiders', 'To iterate participants'], a: 1,
    e: 'Planes never call planes. Widgets never wire widgets. Each colleague reports events to the hub; the hub decides who reacts and how — interaction logic gets ONE home.',
    w: { 0: 'Anonymous broadcast is Observer (32) — mediator coordinates KNOWN colleagues, both directions.',
         2: 'One-way simplification for outsiders is Facade (29).',
         3: 'Walking elements is Iterator (37).' },
    r: { id: 's1', label: 'Section 1 — the control tower' } },
  { q: 'The math that motivates the tower?',
    o: ['N connections either way', 'Pairwise: N colleagues need N(N−1)/2 channels and each knows N−1 others; with a mediator: N channels, each colleague knows exactly ONE name. Growth: +N per newcomer vs +1', 'Mediators double connections', 'No difference for small N'], a: 1,
    e: '7 planes pairwise = 21 channels; through the tower = 7. The newcomer cost is the killer: pairwise, plane #8 means briefing seven pilots; with the tower, only the tower learns.',
    w: { 0: 'Pairwise is quadratic, not linear.',
         2: 'It collapses them.',
         3: 'Even at N=4 the web is 6 vs 4 — and growing differently.' },
    r: { id: 's4', label: 'Section 4 — web vs tower' } },
  { q: 'What does a COLLEAGUE know and do in this pattern?',
    o: ['Everything about its peers', 'It holds one mediator reference, reports its own events (mediator.notify(this, event)), and obeys instructions — it never names, queries or commands a sibling', 'It maintains the rule table', 'It subscribes to all peers'], a: 1,
    e: 'Colleagues become deliberately DUMB about each other — which is what makes them reusable: the same address field works in any form, because it never knew which form it was in.',
    w: { 0: 'Peer knowledge is the disease being cured.',
         2: 'Rules live in the MEDIATOR — that locality is the point.',
         3: 'Peer subscriptions rebuild the web with observer syntax.' },
    r: { id: 's3', label: 'Section 3 — the structure' } },
  { q: 'Mediator vs Observer — the Day 32 question, settled?',
    o: ['Identical', 'Observer: ONE subject broadcasts outward to an anonymous, changing list — no coordination rules. Mediator: a hub that KNOWS its colleagues and encodes multi-party rules ("if checkbox then disable that") — two-way switchboard vs one-way megaphone', 'Mediator has no events', 'Observer needs more classes'], a: 1,
    e: 'And they stack: colleagues often notify the mediator VIA observer machinery. The distinction is who-knows-whom and where the RULES live.',
    w: { 0: 'Megaphone vs switchboard.',
         2: 'Events are usually the transport INTO the mediator.',
         3: 'Class count is incidental.' },
    r: { id: 's8', label: 'Section 8 — the family table' } },
  { q: 'Mediator vs Facade — the Day 29 question, settled?',
    o: ['Same pattern', 'Facade: one-way — OUTSIDERS get a simple door; subsystem classes neither know the facade nor talk through it. Mediator: INSIDERS route their mutual conversation through the hub, and they know it', 'Facade is bidirectional', 'Mediator is for files'], a: 1,
    e: 'Concierge vs air-traffic controller: the concierge simplifies the hotel FOR YOU; the tower coordinates the planes WITH each other. Direction of knowledge is the test.',
    w: { 0: 'Different direction, different clients.',
         2: 'Facade\'s subsystem never calls back through it.',
         3: 'No. 🙂' },
    r: { id: 's8', label: 'Section 8 — vs facade' } },
  { q: 'The honest COST of Mediator?',
    o: ['There is none', 'The interaction complexity does not vanish — it RELOCATES into the mediator, which can bloat into a god object; the win is ONE auditable, testable home instead of a smear across N colleagues', 'It slows messages', 'It prevents adding colleagues'], a: 1,
    e: 'A 2,000-line FormMediator is the pattern\'s failure mode (Day 11 alarm). Cure: split by interaction cluster (AddressMediator, PaymentMediator) — SRP applies to hubs too.',
    w: { 0: 'Every centralization has a bill.',
         2: 'A method hop is nothing.',
         3: 'Adding colleagues is exactly what gets EASIER.' },
    r: { id: 's9', label: 'Section 9 — the god-mediator' } },
  { q: 'In the chat room, what made the "no passwords" rule elegant?',
    o: ['Each user filters their own messages', 'It lives ONCE in the room: every present and future user is covered automatically — centralized rules are the mediator\'s superpower (and DRY, Day 16)', 'The compiler enforced it', 'Users vote on it'], a: 1,
    e: 'Pairwise chat would need the rule in every client (and trust them all). The hub is WHERE policy belongs — same reason the tower spaces the planes rather than pilots negotiating.',
    w: { 0: 'Per-user filtering = N copies of policy drifting apart.',
         2: 'It\'s runtime logic, not types.',
         3: 'Democracy is not a pattern. 🙂' },
    r: { id: 's7', label: 'Section 7 — the chat room' } },
  { q: 'The architecture-scale version of mediator-vs-observer?',
    o: ['Monolith vs microservices', 'ORCHESTRATION (a workflow service explicitly directs each step — mediator) vs CHOREOGRAPHY (services react to each other\'s events — observer). Same trade-offs: central auditable rules vs decentralized evolution', 'REST vs GraphQL', 'SQL vs NoSQL'], a: 1,
    e: 'The Saga-pattern debate in every system-design interview IS Day 38 vs Day 32 at service scale: orchestrators risk god-services; choreography risks event-soup (Day 32 Trap 5). Knowing the mapping is senior gold.',
    w: { 0: 'Independent axis.',
         2: 'API styles, unrelated.',
         3: 'Storage, unrelated.' },
    r: { id: 's8', label: 'Section 8 — orchestration vs choreography' } },
]

/* ============ The page ============ */
export default function Day38() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 8 · Day 38 · Behavioral Patterns II</div>
        <h1>Mediator:<br />The Air-Traffic Controller</h1>
        <p>Five planes approach one runway. They do NOT phone each other — every word goes through the tower.
           Today: the pattern that collapses N² mutual wiring into N spokes, runs every smart form you have
           filled, and scales up into the orchestration-vs-choreography debate. Click everything.</p>
        <div className="chips">
          {['mediator', 'colleagues', 'N² → N', 'interaction rules', 'smart forms', 'orchestration'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The control tower</h2>
        <p>Why don't pilots coordinate landings among themselves? Each would track every other plane (briefing
          every pilot whenever anyone enters the airspace), and safety rules would live in twenty cockpits at
          once. Instead: <strong>every plane knows ONE callsign — the tower — and the tower knows
          everything.</strong></p>
        <Note><strong>Mediator's intent:</strong> define an object that <strong>encapsulates how a set of
          objects interact</strong>. Colleagues never refer to each other explicitly — they talk to the
          mediator, which runs the conversation rules. Loose coupling among peers, by central switchboard.</Note>
        <Code html={`   PAIRWISE WEB 😱                          THE TOWER 🗼

   ✈️━━✈️      every plane wired           ✈️   ✈️   ✈️
   ┃╲ ╱┃      to every plane:               ╲   │   ╱
   ┃ ╳ ┃      N(N−1)/2 channels              ╲  │  ╱
   ┃╱ ╲┃      newcomer = brief them ALL        🗼        N channels
   ✈️━━✈️                                    ╱  │  ╲     newcomer = +1 line
                                            ✈️   ✈️       rules live in ONE place`} />
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The crime: widgets that import widgets</h2>
        <Code html={`<span class="cm">// the checkout form, wired pairwise — GoF's original horror story:</span>
<span class="kw">class</span> DifferentAddressCheckbox {
    AddressField addressField;        <span class="cm">// knows widget #2</span>
    ValidateButton validateBtn;       <span class="cm">// knows widget #3</span>
    <span class="kw">void</span> onToggle() {
        addressField.setEnabled(checked);
        <span class="kw">if</span> (!checked) { addressField.clear(); validateBtn.disable(); }   <span class="cm">// whose rule is this??</span>
    }
}
<span class="cm">// …and AddressField knows ValidateButton, and CodRadio knows WalletDropdown
// and the fee note… 4 widgets, ~6 mutual wires — and NONE of these widgets
// can be reused in another form, because they carry THIS form's rules inside.</span>`} />
        <p>Diagnosis with Month 1 vocabulary: the interaction rules are smeared across colleagues (cohesion
          shredded, Day 17), every widget is coupled to specific siblings (reuse dead), and each new widget
          edits several existing ones (Day 12 weeping). The rules deserve a home of their own.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The structure (dumb colleagues, one smart hub)</h2>
        <Code html={`<span class="cm">// the MEDIATOR contract — colleagues report; it decides:</span>
<span class="kw">public interface</span> FormMediator {
    <span class="kw">void</span> notify(Component sender, String event);
}

<span class="cm">// COLLEAGUES hold one reference and stay deliberately dumb:</span>
<span class="kw">public class</span> Checkbox <span class="kw">extends</span> Component {
    <span class="kw">void</span> onToggle() { mediator.notify(<span class="kw">this</span>, <span class="str">"TOGGLED"</span>); }   <span class="cm">// report. That's all.</span>
}

<span class="cm">// the CONCRETE MEDIATOR — the ONLY class that knows the cast AND the script:</span>
<span class="kw">public class</span> CheckoutFormMediator <span class="kw">implements</span> FormMediator {
    <span class="kw">private final</span> Checkbox diffAddr;          <span class="cm">// it knows everyone…</span>
    <span class="kw">private final</span> AddressField address;
    <span class="kw">private final</span> ValidateButton validate;

    <span class="kw">public void</span> notify(Component sender, String event) {
        <span class="kw">if</span> (sender == diffAddr && event.equals(<span class="str">"TOGGLED"</span>)) {
            address.setEnabled(diffAddr.isChecked());      <span class="cm">// …and runs the rules,</span>
            <span class="kw">if</span> (!diffAddr.isChecked()) {                   <span class="cm">// ALL of them, HERE</span>
                address.clear();
                validate.disable();
            }
        }
        <span class="cm">// rules for typing, payment radios… one readable script</span>
    }
}`} />
        <p>The trade made explicit: colleagues lose all peer knowledge (reusable anywhere); the mediator gains
          all of it — concentrated, readable, testable with mock colleagues. Coupling was not destroyed; it was
          <strong> relocated and shrunk</strong> (N² wires → N spokes + one script).</p>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🗼 Play: Web vs tower</h2>
        <p>Grow the airspace in both modes and watch the channel counter:</p>
        <WebVsTower />
        <Good><strong>What you should notice:</strong> ① The web turns red-spaghetti by 6 planes (15 channels);
          the tower stays a clean star. ② The NEWCOMER cost is the real story: +N channels vs +1. ③ This is
          Day 17's dependency-web demo with a cure attached — the tower is a deliberately created high-fan-in
          stable center.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>📋 Play: The smart checkout form</h2>
        <p>The GoF original, working. Touch widgets and read the mediator's log:</p>
        <SmartForm />
        <Good><strong>What you should notice:</strong> ① Every log line has the same shape: widget reports →
          mediator orchestrates OTHERS. No widget ever named a sibling. ② The rules read like a script in one
          place — "COD disables wallet" is one line you could show a product manager. ③ Each widget is now
          reusable in any form, because its only opinion is "tell the mediator what happened to me."</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Where the rules live (the real estate question)</h2>
        <ul>
          <li><strong>Colleagues:</strong> own their OWN state and widget mechanics (a checkbox knows how to be
            checked) — nothing about siblings.</li>
          <li><strong>Mediator:</strong> owns the INTERACTION protocol — who reacts to whom, in what order,
            under what conditions. It is the one file you open to answer "why did the button grey out?"</li>
          <li><strong>Testing dividend:</strong> instantiate the mediator with mock colleagues and unit-test
            the entire interaction script without a UI — the rules became testable the moment they became
            one object (Day 15's testability ⇔ good seams, again).</li>
        </ul>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>💬 Play: The chat room</h2>
        <p>Users address the room; the room addresses users. Try the forbidden word, and add a user mid-chat:</p>
        <ChatRoom />
        <Good><strong>What you should notice:</strong> ① Senders never iterate users — delivery fan-out is the
          ROOM's job. ② The password rule executed once, centrally — every present and future user covered.
          ③ Kabir joined and zero existing users changed: the +1 newcomer cost, demonstrated.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>The family table — and the architecture-scale version</h2>
        <table className="matrix">
          <thead>
            <tr><th>vs</th><th>the one-line difference</th></tr>
          </thead>
          <tbody>
            <tr><td>📡 Observer (32)</td><td>megaphone vs switchboard: subject broadcasts to anonymous many, no rules; mediator coordinates KNOWN colleagues with central rules — and often receives events via observer machinery (they stack)</td></tr>
            <tr><td>🛎️ Facade (29)</td><td>direction: facade = one-way simple door for OUTSIDERS (subsystem unaware); mediator = the hub INSIDERS knowingly talk through, both ways</td></tr>
            <tr><td>🚌 Event bus</td><td>the hybrid: bus transport (anonymous, observer-ish) but if one component encodes reaction RULES, that component is your mediator wearing a bus pass</td></tr>
          </tbody>
        </table>
        <Reveal summary="Orchestration vs choreography — today's pattern at microservice scale. Click to reveal.">
          <p>Distributed sagas come in two flavors: an <strong>orchestrator</strong> service explicitly
            commanding each step (book flight → charge card → email) — a mediator, with its god-service risk —
            versus <strong>choreography</strong>, where services react to each other's events — observer, with
            its event-soup risk (Day 32, Trap 5). Every system-design interview that says "Saga" is asking you
            to choose between Day 38 and Day 32. Same forces, bigger boxes.</p>
        </Reveal>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — The god-mediator</h3>
        <p>Every interaction in the app routed through ONE hub until it is a 3,000-line script nobody dares
          touch — the pattern's own failure mode. Cure: one mediator per interaction CLUSTER (checkout form,
          search panel), not per application. SRP (Day 11) governs hubs too.</p>
        <h3>Trap 2 — Colleagues sneaking direct wires</h3>
        <p>One "quick fix" where the checkbox pokes the button directly, and the web starts regrowing under
          the tower. The discipline is binary: colleagues speak ONLY to the mediator — review for imports.</p>
        <h3>Trap 3 — The mediator doing colleagues' jobs</h3>
        <p>Validation logic, formatting, state mechanics migrating INTO the hub turns colleagues anemic
          (Day 11's anemia, again). The mediator coordinates; colleagues still do their own work.</p>
        <h3>Trap 4 — Notification cycles</h3>
        <p>Mediator updates field → field fires CHANGED → mediator updates field… (Day 32's reentrancy, hub
          edition). Guard: colleagues report only USER-initiated events, or the mediator suppresses
          notifications while it is the one mutating.</p>
        <h3>Trap 5 — Mediator-itis</h3>
        <p>Two objects with one simple interaction do not need a hub between them (Day 16). The pattern earns
          its file at three-plus colleagues with genuine cross-rules — the web must exist before you build a
          tower over it.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> one hub encapsulates HOW colleagues interact; peers hold only the mediator. N(N−1)/2 wires → N spokes; newcomer cost +1.</li>
          <li><strong>Structure:</strong> Mediator interface (notify(sender, event)) · concrete mediator = knows the cast + owns the script · colleagues = own mechanics, report events, obey.</li>
          <li><strong>Wins:</strong> rules in one auditable/testable file · reusable colleagues · cheap newcomers. <strong>Cost:</strong> complexity relocates — god-mediator risk; split by cluster.</li>
          <li><strong>Family:</strong> vs Observer (megaphone/switchboard — they stack) · vs Facade (outsiders/insiders) · event bus = hybrid · sagas: orchestration (=mediator) vs choreography (=observer).</li>
          <li>Traps: god hub · sneaky direct wires · anemic colleagues · notification cycles · mediator-itis for two objects.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Where did GoF find this pattern?">
          <p>Smalltalk/ET++ dialog boxes — exactly today's form demo: font dialogs where the list, entry field
            and buttons enable/disable each other. The original motivating diagram in the book IS a widget
            wiring mess. Forms remain the pattern's natural habitat forty years later.</p>
        </Reveal>
        <Reveal summary="Q: Is an MVC controller a mediator?">
          <p>Closest in MVP/presenter flavors: the presenter mediates between view widgets and model — view
            stays dumb, rules centralize. Classic MVC is muddier (views observe models directly — observer).
            The honest answer names the spectrum rather than forcing a label, and that nuance reads senior.</p>
        </Reveal>
        <Reveal summary="Q: How do you TEST interaction rules with a mediator that you couldn't before?">
          <p>Before: rules lived in widgets — testing "COD disables wallet" needed a rendered UI. After: new
            CheckoutFormMediator(mockCheckbox, mockField, mockButton); fire notify(); verify the mock calls.
            Pure-JVM tests for UI LOGIC — the practical reason teams adopt the pattern beyond aesthetics.</p>
        </Reveal>
        <Reveal summary="Q: Mediator + Observer stacked — what does the wiring look like?">
          <p>Colleagues expose generic events (Day 32); the mediator subscribes to ALL of them and is often the
            only listener. Transport = observer; intelligence = mediator. Bonus: colleagues then need no
            mediator field at all — maximally dumb, reusable even outside mediated forms.</p>
        </Reveal>
        <Reveal summary="Q: How does a mediator avoid instanceof/sender== chains as colleagues grow?">
          <p>Three ladders: separate methods per colleague (addressChanged(), codSelected() — simple, explicit) ·
            an event-object hierarchy with a registry map (Day 31) · or split into smaller mediators before the
            dispatch gets clever. A growing notify() switch is the god-mediator's first symptom.</p>
        </Reveal>
        <Reveal summary="Q: Name a JDK-adjacent mediator.">
          <p>java.util.concurrent.Executor coordinating producers and worker threads is mediator-ish
            (submitters never know workers); historically GoF cite wmediators in toolkits. Honest answer: the
            JDK has fewer pure mediators than other patterns — its home is APPLICATION wiring (forms,
            workflows, game rooms), which is itself a useful observation.</p>
        </Reveal>
        <Reveal summary="Q: Chat room at WhatsApp scale — what does the mediator become?">
          <p>The room/server: fan-out, ordering, membership, moderation — all hub jobs. Scaled: the mediator
            shards (room per group), persists (message log — Day 33's command log!), and replicates. The LLD
            chat-room interview question is "design a mediator with persistence and presence" in disguise.</p>
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
        <strong>Day 38 complete?</strong> Homework: the auction house.
        <C> AuctionMediator</C> with colleagues <C>Bidder</C> (name, budget) — bidders call
        <C> mediator.placeBid(this, amount)</C> and NEVER reference each other. The mediator: rejects bids below
        current + ₹100 (rule in ONE place), notifies all OTHER bidders of the new high bid, and declares the
        winner on <C>close()</C>. ① Three bidders, a bidding war in main, then a fourth joins mid-auction —
        count edits to existing bidders (target: zero). ② Unit-test the increment rule with mock bidders — no
        bidding war needed. ③ One sentence: which TWO patterns from this month would you add to log every bid
        and undo a mistaken one?
        <br /><br />
        Next: <strong>Day 39 — Memento</strong>: bottling an object's private state without breaking
        encapsulation — the missing piece Day 33's undo stack was quietly borrowing.
      </div>
    </div>
  )
}
