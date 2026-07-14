import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Order lifecycle stepper
   ============================================================ */
const ORDER_STEPS = [
  {
    state: 'PLACED', color: '#E3F2FD', icon: '📱', label: 'Order placed',
    customer:    'You tap "Place Order." Payment is authorised (held, not yet charged).',
    restaurant:  'Receives a new-order alert. Has a short window to accept or reject.',
    agent:       'No agent yet — the system waits for the restaurant to confirm first.',
  },
  {
    state: 'CONFIRMED', color: '#E8F5E9', icon: '✅', label: 'Restaurant confirmed',
    customer:    '"Your order is confirmed!" You see an estimated delivery time.',
    restaurant:  'Taps Accept in their app. Commits to making the order.',
    agent:       'System NOW searches: find the nearest AVAILABLE agent to the restaurant. Agent is ASSIGNED.',
  },
  {
    state: 'PREPARING', color: '#FFF8E1', icon: '👨‍🍳', label: 'Kitchen preparing',
    customer:    'App shows a timer — "Chef is cooking your food."',
    restaurant:  'Kitchen is at work. Bags the order when done.',
    agent:       'Heads toward the restaurant. Will arrive close to when food is ready.',
  },
  {
    state: 'READY_FOR_PICKUP', color: '#F3E5F5', icon: '🛍️', label: 'Ready at restaurant',
    customer:    '"Your order is packed and waiting for the rider."',
    restaurant:  'Order is sealed. Waiting at the pickup counter.',
    agent:       'Arrives at the restaurant, verifies the order, and picks up the bag.',
  },
  {
    state: 'PICKED_UP', color: '#E8EAF6', icon: '🏍️', label: 'Agent picked up',
    customer:    'Live map shows the agent moving toward your address.',
    restaurant:  'Order is off their hands. Revenue will be settled by platform.',
    agent:       'En route to customer. Cannot be reassigned until delivered.',
  },
  {
    state: 'DELIVERED', color: '#E8F5E9', icon: '🎉', label: 'Delivered!',
    customer:    'Receives food. Can now rate the restaurant AND the agent.',
    restaurant:  'Payout is triggered (minus platform fee).',
    agent:       'Status flips back to AVAILABLE. Ready for the next order.',
  },
]

function OrderLifecycleDemo() {
  const [step, setStep] = useState(0)
  const s = ORDER_STEPS[step]
  return (
    <div className="panel">
      <div className="ptitle">Live demo · step through the order lifecycle — see what each party does at every state</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
        {ORDER_STEPS.map((os, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            fontSize: 11, padding: '5px 10px', cursor: 'pointer', border: 'none', borderRadius: 5,
            background: i === step ? 'var(--ink)' : i < step ? '#c8d8e8' : '#eee',
            color: i === step ? '#fff' : '#333'
          }}>{os.state}</button>
        ))}
      </div>
      <div style={{ background: s.color, borderRadius: 8, padding: 16, marginBottom: 12 }}>
        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
          {s.icon} {s.label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[['👤 Customer', s.customer], ['🍽️ Restaurant', s.restaurant], ['🏍️ Agent', s.agent]].map(([title, text]) => (
            <div key={title} style={{ background: 'rgba(255,255,255,0.75)', borderRadius: 6, padding: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 11.5, marginBottom: 6, color: 'var(--ink)' }}>{title}</div>
              <div style={{ fontSize: 12.5 }}>{text}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="act ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>← Prev</button>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5' }}>{step + 1} / {ORDER_STEPS.length}</span>
        <button className="act" disabled={step === ORDER_STEPS.length - 1} onClick={() => setStep(s => s + 1)}>Next →</button>
      </div>
    </div>
  )
}

/* ============================================================
   Demo 2 — Delivery agent matching
   ============================================================ */
const GS = 8
const REST = { x: 4, y: 3 }
const INIT_AGENTS = [
  { id: 'A1', name: 'Ravi',  x: 1, y: 1, status: 'AVAILABLE' },
  { id: 'A2', name: 'Priya', x: 6, y: 1, status: 'AVAILABLE' },
  { id: 'A3', name: 'Sam',   x: 3, y: 6, status: 'ON_DELIVERY' },
  { id: 'A4', name: 'Dev',   x: 7, y: 4, status: 'AVAILABLE' },
  { id: 'A5', name: 'Meena', x: 2, y: 3, status: 'AVAILABLE' },
]
const md = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

function AgentMatchingDemo() {
  const [agents, setAgents] = useState(INIT_AGENTS)
  const [chosen, setChosen] = useState(null)
  const [log, setLog] = useState([])

  function find() {
    const avail = agents.filter(a => a.status === 'AVAILABLE')
    if (!avail.length) { setLog(['⚠ No available agents!']); return }
    const sorted = [...avail].sort((a, b) => md(a, REST) - md(b, REST))
    const w = sorted[0]
    setChosen(w.id)
    setAgents(prev => prev.map(a => a.id === w.id ? { ...a, status: 'ASSIGNED' } : a))
    setLog([
      'Available agents ranked by distance to restaurant:',
      ...sorted.map(a => `  ${a.name} (${a.id}) @ (${a.x},${a.y})  dist=${md(a, REST)}${a.id === w.id ? '  ← ASSIGNED ✅' : ''}`)
    ])
  }

  function reset() { setAgents(INIT_AGENTS); setChosen(null); setLog([]) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · find the nearest AVAILABLE agent to the RESTAURANT (not the customer)</div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${GS}, 36px)`, gap: 1, background: '#ddd', border: '1px solid #ccc', marginBottom: 8 }}>
            {[...Array(GS * GS)].map((_, i) => {
              const x = i % GS, y = Math.floor(i / GS)
              const isR = x === REST.x && y === REST.y
              const ag = agents.find(a => a.x === x && a.y === y)
              const bg = isR ? '#FFD54F'
                : ag?.id === chosen ? '#81C784'
                : ag?.status === 'ON_DELIVERY' ? '#FFCDD2'
                : ag?.status === 'ASSIGNED' ? '#81C784'
                : ag ? '#90CAF9'
                : (x + y) % 2 === 0 ? '#FAFAF7' : '#F0EDE6'
              return (
                <div key={i} style={{ width: 36, height: 36, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                  {isR ? '🍽️' : ag ? (ag.status === 'ON_DELIVERY' ? '🔴' : ag.status === 'ASSIGNED' ? '✅' : '🟢') : ''}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#666', flexWrap: 'wrap' }}>
            <span>🍽️ Restaurant</span><span>🟢 Available</span><span>🔴 On delivery</span><span>✅ Assigned</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          {agents.map(a => (
            <div key={a.id} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, marginBottom: 5,
              color: a.id === chosen ? '#2a7a3a' : a.status === 'ON_DELIVERY' ? '#c00' : '#333' }}>
              {a.name} ({a.id}) @ ({a.x},{a.y}) — {a.status} — d={md(a, REST)}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="act" disabled={!!chosen} onClick={find}>Find nearest</button>
            <button className="act ghost" onClick={reset}>Reset</button>
          </div>
          {log.length > 0 && (
            <div style={{ marginTop: 10, background: '#f5f5f2', borderRadius: 6, padding: 8 }}>
              {log.map((l, i) => <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 10.5, marginBottom: 2 }}>{l}</div>)}
            </div>
          )}
        </div>
      </div>
      <Note style={{ marginTop: 12 }}>
        <span style={{ fontSize: 12.5 }}>The agent minimizes time <b>before pickup</b>, which is the main bottleneck.
        The customer's address only matters after pickup — matching to the customer would maximize both wait times.</span>
      </Note>
    </div>
  )
}

/* ============================================================
   Demo 3 — Menu builder + pricing breakdown
   ============================================================ */
const MENU = [
  { id: 'm1', name: 'Butter Chicken', cat: 'Main',    price: 280, avail: true },
  { id: 'm2', name: 'Garlic Naan',    cat: 'Bread',   price:  50, avail: true },
  { id: 'm3', name: 'Dal Makhani',    cat: 'Main',    price: 220, avail: true },
  { id: 'm4', name: 'Masala Fries',   cat: 'Snack',   price: 120, avail: true },
  { id: 'm5', name: 'Mango Lassi',    cat: 'Drink',   price:  90, avail: true },
  { id: 'm6', name: 'Rasgulla',       cat: 'Dessert', price:  80, avail: false },
]

function MenuPricingDemo() {
  const [cart, setCart] = useState({})
  const [surge, setSurge] = useState(false)
  const add = id => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const rem = id => setCart(c => { const n = { ...c }; n[id] > 1 ? n[id]-- : delete n[id]; return n })

  const sub  = MENU.reduce((s, m) => s + (cart[m.id] || 0) * m.price, 0)
  const dFee = sub > 0 ? (surge ? Math.round(40 * 1.5) : 40) : 0
  const sFee = Math.round(sub * 0.05)
  const tax  = Math.round(sub * 0.05)
  const total = sub + dFee + sFee + tax

  return (
    <div className="panel">
      <div className="ptitle">Live demo · build an order and see how subtotal, fees, and surge compose into a total</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, fontFamily: 'Space Grotesk' }}>🍛 Spice Garden — Menu</div>
          {MENU.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, opacity: m.avail ? 1 : 0.4 }}>
              <div style={{ flex: 1, fontSize: 13 }}>
                {m.name} <span style={{ color: '#7c8aa5', fontSize: 10.5 }}>{m.cat}</span>
              </div>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, minWidth: 44 }}>₹{m.price}</span>
              {m.avail
                ? <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button className="act ghost" style={{ padding: '2px 9px' }} disabled={!cart[m.id]} onClick={() => rem(m.id)}>−</button>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, minWidth: 16, textAlign: 'center' }}>{cart[m.id] || 0}</span>
                    <button className="act" style={{ padding: '2px 9px' }} onClick={() => add(m.id)}>+</button>
                  </div>
                : <span style={{ fontSize: 11, color: '#c00' }}>Unavailable</span>
              }
            </div>
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12.5, cursor: 'pointer' }}>
            <input type="checkbox" checked={surge} onChange={e => setSurge(e.target.checked)} />
            Peak-hour surge (1.5× delivery fee)
          </label>
        </div>
        <div style={{ minWidth: 195, background: '#f8f8f5', borderRadius: 8, padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, fontFamily: 'Space Grotesk' }}>🧾 Bill</div>
          {sub === 0
            ? <div style={{ color: '#7c8aa5', fontSize: 12.5 }}>Add items to see the bill</div>
            : <>
                {MENU.filter(m => cart[m.id]).map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 3 }}>
                    <span>{m.name} ×{cart[m.id]}</span><span>₹{m.price * cart[m.id]}</span>
                  </div>
                ))}
                <hr style={{ margin: '8px 0', borderColor: 'var(--line)' }} />
                {[
                  ['Subtotal', sub],
                  [`Delivery fee${surge ? ' (1.5×)' : ''}`, dFee],
                  ['Service fee (5%)', sFee],
                  ['GST (5%)', tax],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3, color: '#666' }}>
                    <span>{l}</span><span>₹{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: '2px solid var(--ink)', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}>
                  <span>Total</span><span>₹{total}</span>
                </div>
              </>
          }
        </div>
      </div>
      <Good style={{ marginTop: 12 }}>
        <span style={{ fontSize: 12.5 }}>Surge pricing is a <b>Decorator</b> (Day 27) wrapping the base <C>PricingCalculator</C>.
        The base calculator is unchanged — the wrapper multiplies only the delivery fee, then returns.
        Toggle the checkbox above and watch the delivery fee change.</span>
      </Good>
    </div>
  )
}

/* ============================================================
   Quiz
   ============================================================ */
const QUESTIONS = [
  {
    q: 'When should the delivery agent be matched to an order?',
    o: [
      'When the customer places the order (PLACED)',
      'After the restaurant confirms the order (CONFIRMED)',
      'After the food is ready for pickup (READY_FOR_PICKUP)',
      'Only after the previous delivery is done',
    ],
    a: 1,
    e: 'At CONFIRMED: the restaurant has committed to the order, so we know it will actually be made. Assigning early (during PREPARING) means the agent can arrive at the restaurant right when the food is ready — minimizing total delivery time.',
    w: {
      0: 'At PLACED, the restaurant might still reject the order — assigning an agent before confirmation wastes the agent and may require expensive reassignment.',
      2: 'Waiting until READY_FOR_PICKUP is too late — the food sits getting cold while the agent is still far away.',
      3: 'Waiting for the previous delivery to finish would mean serializing all orders — many agents can work in parallel.',
    },
    r: { id: 's6', label: 'Section 6 — Delivery matching' },
  },
  {
    q: 'The delivery agent should be matched to which location?',
    o: [
      'The customer\'s address',
      'The restaurant\'s location',
      'The midpoint between customer and restaurant',
      'The geographic center of the city',
    ],
    a: 1,
    e: 'The agent must go to the RESTAURANT first to pick up the food, then to the customer. Matching by proximity to the restaurant minimizes time before pickup — the main bottleneck in hot-food delivery.',
    w: {
      0: 'The customer\'s address is the final destination, not the pickup point. Matching there would put agents near customers but far from the food.',
      2: 'A midpoint ignores that the journey is sequential: restaurant first, then customer. You can\'t "half pick up" food.',
      3: 'City center has no relation to either the restaurant or the customer — it would maximize both wait times.',
    },
    r: { id: 's6', label: 'Section 6 — Delivery matching' },
  },
  {
    q: 'Which design pattern best models the Order\'s state progression (PLACED → CONFIRMED → PREPARING → …)?',
    o: ['Strategy', 'State', 'Observer', 'Command'],
    a: 1,
    e: 'The State pattern (Day 34) is the right fit: behavior differs per state (who can trigger transitions), transitions are guarded (can\'t skip states), and states name their own valid successors.',
    w: {
      0: 'Strategy swaps an algorithm — it\'s about HOW something is done, not WHAT STATE the object is in.',
      2: 'Observer notifies subscribers of events — it complements State here (each transition fires a notification) but doesn\'t model the lifecycle itself.',
      3: 'Command models operations you can undo — it could wrap individual order actions, but the lifecycle state machine is best captured by State.',
    },
    r: { id: 's4', label: 'Section 4 — The order state machine' },
  },
  {
    q: 'At which Order state can a customer NO LONGER cancel?',
    o: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP'],
    a: 3,
    e: 'Once the agent has physically picked up the food and is en route, the order cannot be cancelled — the food is already in transit. Most apps stop accepting cancellations even earlier (at PREPARING), but the absolute hard stop is PICKED_UP.',
    w: {
      0: 'At CONFIRMED the restaurant has just accepted but not started cooking — cancellation is still low-cost.',
      1: 'At PREPARING some apps allow cancellation with a fee, since the restaurant has invested effort but the food isn\'t yet on its way.',
      2: 'At READY_FOR_PICKUP the food is ready but still at the restaurant counter — technically still cancellable (food is wasted, but possible to reverse the delivery).',
    },
    r: { id: 's4', label: 'Section 4 — The order state machine' },
  },
  {
    q: 'Why should a MenuItem\'s price be stored as Money (or BigDecimal) rather than double?',
    o: [
      'double is slower than BigDecimal on modern JVMs',
      'double has floating-point rounding errors that cause billing discrepancies',
      'Money is a required Java interface for financial systems',
      'double cannot store values above ₹999.99',
    ],
    a: 1,
    e: 'IEEE 754 double precision cannot represent many decimal fractions exactly. 0.1 + 0.2 = 0.30000000000000004 in Java. Across thousands of transactions, rounding errors accumulate into real billing bugs — exactly what Day 20\'s Money Value Object solves.',
    w: {
      0: 'double is actually faster than BigDecimal for CPU arithmetic. The reason to avoid it here is correctness, not performance.',
      2: 'There is no such Java interface — Money is a design pattern (Value Object) described in Day 20, not a built-in type.',
      3: 'double can store arbitrarily large values (up to ~10^308). Its problem is precision, not range.',
    },
    r: { id: 's8', label: 'Section 8 — Pricing and the menu model' },
  },
  {
    q: 'Which pattern models "apply a surge multiplier on top of the base delivery fee at peak hours"?',
    o: ['Factory Method', 'Decorator', 'Template Method', 'Composite'],
    a: 1,
    e: 'Decorator (Day 27): a SurgePricingDecorator wraps the base PricingCalculator and multiplies the result. The base is unchanged; the wrapper adds the multiplier layer. This lets you compose: base → surge → promo discount, each as a separate layer.',
    w: {
      0: 'Factory Method decides WHICH object to create — it\'s about construction, not about adding behavior at runtime.',
      2: 'Template Method defines a skeleton algorithm for subclasses to fill in — it doesn\'t model the concept of wrapping an existing calculator with a multiplier.',
      3: 'Composite treats a tree of objects as one — it\'s about hierarchies, not about adding a wrapping multiplier.',
    },
    r: { id: 's8', label: 'Section 8 — Pricing and the menu model' },
  },
  {
    q: 'An order has a quantity of 2 for "Butter Chicken" at ₹280. The restaurant later raises the price to ₹320. What should the order record show?',
    o: [
      '₹640 — always reflect the current menu price',
      '₹560 — the price at the time of order (price snapshot)',
      '₹600 — an average of the old and new price',
      'An error, because menu prices must never change',
    ],
    a: 1,
    e: '₹560 — the order item stores a SNAPSHOT of the price at the time of ordering (Day 20: Value Objects are immutable). The menu price can change later without affecting existing orders. This is the standard for any e-commerce system.',
    w: {
      0: 'Using the current menu price would change the customer\'s bill retroactively — a major billing error and a violation of consumer trust.',
      2: 'An average has no business or legal meaning and would confuse both customer and restaurant.',
      3: 'Menu prices change all the time — the design must handle it gracefully by snapshotting, not by preventing changes.',
    },
    r: { id: 's3', label: 'Section 3 — Core entities' },
  },
  {
    q: 'What is the "defining problem" that makes food delivery harder than cab booking (Day 58)?',
    o: [
      'Food delivery requires a mobile app; cab booking does not',
      'Three-party coordination: restaurant must prepare the order before the agent can deliver it',
      'Food delivery handles more orders per second than cab booking',
      'Food delivery requires real-time GPS tracking',
    ],
    a: 1,
    e: 'Cab booking is two-party (rider + driver): the driver picks up and drops off. Food delivery adds a THIRD party (restaurant) whose preparation step must complete before the agent can even pick up. This creates a dependent state machine with more guards and notifications.',
    w: {
      0: 'Both systems typically need a mobile app — the technical infrastructure difference is not the core design challenge.',
      2: 'Throughput is a scaling concern, not a design structure difference. Both systems handle high order volumes.',
      3: 'Cab booking also requires real-time GPS tracking for the driver. GPS is not unique to food delivery.',
    },
    r: { id: 's1', label: 'Section 1 — The three-way coordination problem' },
  },
]

/* ============================================================
   Page
   ============================================================ */
export default function Day67() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 14 · Day 67</div>
        <h1>Food Delivery:<br />Coordinating the Three-Party Flow</h1>
        <p>
          The hard part is not menus or maps — it is making a customer, a restaurant, and a
          delivery agent all agree on the same order state. Click through every demo and
          interaction to see how the design handles it.
        </p>
        <div className="chips">
          {['Order State Machine','Delivery Matching','Menu Model','Three-Party Coordination','Pricing','Decorator Surge'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The three-way coordination problem</h2>
        <p>
          Think of it as a relay race with three runners and one baton (the order).
          Runner 1 (customer) passes the baton to Runner 2 (restaurant), who passes it to
          Runner 3 (agent), who brings it home. Every handoff is a state transition, and
          a different party triggers each one.
        </p>
        <Code html={`<span class="cm">── Who triggers which transition ──────────────────────────────────</span>

  CUSTOMER       SYSTEM              RESTAURANT         AGENT
     │               │                   │                 │
     │── place ──────►                   │                 │
     │               │── notify ─────────►                 │
     │               │                   │── confirm ──►   │
     │               │◄── confirmed ─────│                 │
     │◄── confirmed ─│                   │                 │
     │               │── find nearest ───────────────────►[ASSIGNED]
     │               │                   │── preparing ──► │
     │◄── preparing ─│                   │                 │── en route to restaurant
     │               │                   │── ready ──────► │
     │               │◄── ready ─────────│                 │── picks up
     │               │                   │            [PICKED_UP]
     │               │                   │                 │── en route to customer
     │◄── delivered ─│                   │             [DELIVERED]

<span class="cm">── What makes this hard ─────────────────────────────────────────</span>

  Cab booking (Day 58)  → two parties: rider places, driver picks up & delivers.
  Food delivery          → THREE parties: restaurant must PREPARE before agent picks up.
  The preparation step creates a DEPENDENT state machine:
  agent cannot pick up until restaurant reaches READY_FOR_PICKUP.`} />
        <Note>
          The three parties do not talk to each other directly. The <b>Order object</b> is the
          single source of truth. Every party reads and writes the order state through the system.
          This is the Information Expert principle (Day 10) applied system-wide.
        </Note>
      </section>

      {/* S2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Clarifying questions (ask these in an interview)</h2>
        <p>
          Before drawing any class diagram, ask these. Each answer changes the design.
        </p>
        <table className="matrix" style={{ width: '100%', fontSize: 13 }}>
          <thead>
            <tr><th style={{ textAlign: 'left', padding: '6px 8px' }}>Question</th><th style={{ textAlign: 'left', padding: '6px 8px' }}>Why it matters</th><th style={{ textAlign: 'left', padding: '6px 8px' }}>Simple-first answer</th></tr>
          </thead>
          <tbody>
            {[
              ['Can one agent carry multiple orders?', 'Adds "batching" to MatchingStrategy — agent has a list of orders, not one', 'No — one order per agent (add batching later)'],
              ['Can a restaurant reject an order?', 'Adds CANCELLED from PLACED; triggers refund', 'Yes — restaurant can reject within a window'],
              ['Can customers cancel?', 'Adds CANCELLED from PLACED/CONFIRMED/PREPARING', 'Yes, before PICKED_UP'],
              ['Do we support menu customizations?', 'OrderItem needs a customizations: List<String>', 'No customizations for now (add field later)'],
              ['Real-time location tracking?', 'Adds location-ping endpoint + Observer push to customer', 'Yes — agent location visible after PICKED_UP'],
              ['How is payment handled?', 'Needs PaymentGateway port (Adapter, Day 26)', 'Hold at order time, charge at DELIVERED'],
              ['Scheduled orders?', 'Adds scheduledFor: Instant to Order; matching deferred', 'No — on-demand only for now'],
            ].map(([q, why, ans]) => (
              <tr key={q}>
                <td style={{ padding: '6px 8px' }}>{q}</td>
                <td style={{ padding: '6px 8px', color: '#666' }}>{why}</td>
                <td style={{ padding: '6px 8px', color: 'var(--blue)' }}>{ans}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* S3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Core entities</h2>
        <Code html={`<span class="cm">── Entity model (read this like a UML class diagram) ───────────</span>

  ┌─────────────────┐       ┌──────────────────────────┐       ┌────────────────────┐
  │   Customer      │       │          Order            │       │    Restaurant      │
  │─────────────────│ 1   * │──────────────────────────│ *   1 │────────────────────│
  │ id              │───────│ id                       │───────│ id                 │
  │ name            │       │ customer: Customer        │       │ name               │
  │ defaultAddress  │       │ restaurant: Restaurant   │       │ location: Location  │
  │ paymentMethod   │       │ items: List&lt;OrderItem&gt;    │       │ menu: List&lt;MenuItem&gt;│
  └─────────────────┘       │ state: OrderState        │       │ status             │
                            │ agent: DeliveryAgent     │       └────────────────────┘
  ┌─────────────────┐       │ totalAmount: Money       │
  │  DeliveryAgent  │ 0..1  │ placedAt: Instant        │       ┌────────────────────┐
  │─────────────────│───────│ deliveredAt: Instant     │       │    MenuItem        │
  │ id              │       └──────────┬───────────────┘       │────────────────────│
  │ name            │                  │ contains 1..*         │ id                 │
  │ location        │          ┌───────▼──────────────┐        │ name               │
  │ status          │          │      OrderItem        │        │ category           │
  └─────────────────┘          │──────────────────────│  *   1 │ price: Money       │◄──┐
                               │ menuItem: MenuItem   │────────│ available: boolean │   │
                               │ quantity: int        │        └────────────────────┘   │
                               │ unitPrice: Money     │◄──── snapshot! see Note ────────┘
                               │ lineTotal(): Money   │
                               └──────────────────────┘`} />
        <Note>
          <b>Price snapshot:</b> <C>OrderItem</C> stores <C>unitPrice</C> at the time the order is placed —
          not a reference to <C>MenuItem.price</C>. If the restaurant later changes the menu price, existing
          orders are unaffected. This is the Value Object / immutability principle from Day 20.
        </Note>
        <Code html={`<span class="cm">// Key entities in Java</span>

<span class="kw">enum</span> RestaurantStatus { OPEN, CLOSED, BUSY }

<span class="kw">enum</span> AgentStatus { AVAILABLE, ASSIGNED, ON_DELIVERY, OFFLINE }

<span class="kw">class</span> MenuItem {
    <span class="kw">private final</span> String id, name, category;
    <span class="kw">private final</span> Money price;       <span class="cm">// BigDecimal-backed — never double (Day 20)</span>
    <span class="kw">private</span> <span class="kw">boolean</span> available;       <span class="cm">// restaurant can toggle at runtime</span>
}

<span class="kw">class</span> OrderItem {
    <span class="kw">private final</span> MenuItem menuItem;
    <span class="kw">private final</span> <span class="kw">int</span> quantity;
    <span class="kw">private final</span> Money unitPrice;    <span class="cm">// snapshot of price at order time</span>

    <span class="kw">public</span> Money lineTotal() {
        <span class="kw">return</span> unitPrice.multiply(quantity);   <span class="cm">// e.g. ₹280 × 2 = ₹560</span>
    }
}

<span class="kw">class</span> Order {
    <span class="kw">private final</span> String id;
    <span class="kw">private final</span> Customer customer;
    <span class="kw">private final</span> Restaurant restaurant;
    <span class="kw">private final</span> List&lt;OrderItem&gt; items;
    <span class="kw">private</span> OrderState state;               <span class="cm">// mutable — transitions drive the system</span>
    <span class="kw">private</span> DeliveryAgent agent;            <span class="cm">// null until CONFIRMED</span>
    <span class="kw">private</span> Money totalAmount;
    <span class="kw">private</span> Instant placedAt, deliveredAt;
}`} />
      </section>

      {/* S4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The order state machine</h2>
        <p>
          The most important design in a food delivery system is the order state machine.
          Every state has exactly one set of valid next states — and a different party
          triggers each transition. Guard these transitions or bugs appear immediately
          (imagine an order jumping from PLACED to DELIVERED because someone called the
          wrong method).
        </p>
        <Code html={`<span class="cm">── Order state machine ────────────────────────────────────────────</span>

        customer places order
               │
         ┌─────▼──────┐
         │   PLACED   │ ──── restaurant rejects ──► CANCELLED
         └─────╥──────┘
               ║ restaurant accepts (CONFIRMED event)
         ┌─────▼──────────┐
         │  CONFIRMED     │ ──── customer cancels ──► CANCELLED
         └─────╥──────────┘      (agent search begins NOW)
               ║ kitchen starts cooking
         ┌─────▼──────────┐
         │  PREPARING     │ ──── customer cancels ──► CANCELLED (with fee)
         └─────╥──────────┘
               ║ food is sealed and ready
         ┌─────▼────────────────┐
         │  READY_FOR_PICKUP    │  ← agent should be arriving now
         └─────╥────────────────┘
               ║ agent physically picks up bag
         ┌─────▼──────────┐
         │  PICKED_UP     │  ← NO CANCELLATION PAST THIS POINT
         └─────╥──────────┘
               ║ agent arrives at customer
         ┌─────▼──────────┐
         │  DELIVERED     │
         └────────────────┘`} />
        <Code html={`<span class="cm">// Guarded transitions — the State pattern applied to an enum</span>

<span class="kw">enum</span> OrderState {
    PLACED, CONFIRMED, PREPARING, READY_FOR_PICKUP, PICKED_UP, DELIVERED, CANCELLED;

    <span class="cm">// Each state declares what it allows — no transition is valid by default</span>
    <span class="kw">boolean</span> canTransitionTo(OrderState next) {
        <span class="kw">return switch</span> (<span class="kw">this</span>) {
            <span class="kw">case</span> PLACED           -> next == CONFIRMED   || next == CANCELLED;
            <span class="kw">case</span> CONFIRMED        -> next == PREPARING   || next == CANCELLED;
            <span class="kw">case</span> PREPARING        -> next == READY_FOR_PICKUP || next == CANCELLED;
            <span class="kw">case</span> READY_FOR_PICKUP -> next == PICKED_UP;    <span class="cm">// no cancel once agent is there</span>
            <span class="kw">case</span> PICKED_UP        -> next == DELIVERED;
            <span class="kw">default</span>              -> <span class="kw">false</span>;                <span class="cm">// DELIVERED, CANCELLED are terminal</span>
        };
    }
}

<span class="cm">// In Order — one method protects ALL transitions</span>
<span class="kw">public synchronized void</span> transitionTo(OrderState next) {
    <span class="kw">if</span> (!state.canTransitionTo(next))
        <span class="kw">throw new</span> IllegalStateException(state + <span class="str">" → "</span> + next + <span class="str">" is not allowed"</span>);
    <span class="kw">this</span>.state = next;
    notifyObservers(next);   <span class="cm">// Observer (Day 32) — push update to all three parties</span>
}`} />
        <Warn>
          Never let callers set <C>order.state = X</C> directly (public field or unrestricted setter).
          All transitions MUST go through <C>transitionTo()</C> so the guard always runs. This is the
          same encapsulation lesson as Day 2.
        </Warn>
      </section>

      {/* S5 — Interactive */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>📦 Play: the order lifecycle</h2>
        <p>
          Step through the six order states. Notice that the agent is not assigned until
          CONFIRMED — and that there is no going back once PICKED_UP.
        </p>
        <OrderLifecycleDemo />
        <Good>
          Key insight: the agent assignment happens at CONFIRMED, not at PLACED. This is
          intentional — the restaurant might reject the order. Assigning an agent before
          confirmation wastes the agent and requires an expensive reassignment.
        </Good>
      </section>

      {/* S6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Delivery matching — nearest agent to the restaurant</h2>
        <p>
          The matching problem in food delivery is almost identical to cab booking (Day 58) —
          but the target location is different. The agent must go to the RESTAURANT first.
          The customer's address only matters after the agent picks up the food.
        </p>
        <Code html={`<span class="cm">// MatchingStrategy — same interface as cab booking (Day 58-59)</span>
<span class="kw">interface</span> MatchingStrategy {
    Optional&lt;DeliveryAgent&gt; findBest(Location pickup, List&lt;DeliveryAgent&gt; agents);
}

<span class="cm">// Nearest agent by Manhattan distance (simplified; real = geohash/quadtree)</span>
<span class="kw">class</span> NearestAgentStrategy <span class="kw">implements</span> MatchingStrategy {
    @Override
    <span class="kw">public</span> Optional&lt;DeliveryAgent&gt; findBest(Location pickup, List&lt;DeliveryAgent&gt; agents) {
        <span class="kw">return</span> agents.stream()
            .filter(a -> a.status() == AgentStatus.AVAILABLE)     <span class="cm">// must be free</span>
            .min(Comparator.comparingInt(a -> distance(a.location(), pickup)));
    }
    <span class="kw">private int</span> distance(Location a, Location b) {
        <span class="kw">return</span> Math.abs(a.x() - b.x()) + Math.abs(a.y() - b.y());
    }
}

<span class="cm">// Assignment is atomic — prevent two orders claiming the same agent (Day 62)</span>
<span class="kw">public boolean</span> tryAssignAgent(DeliveryAgent agent, Order order) {
    <span class="cm">// compareAndSet: only succeeds if agent is still AVAILABLE</span>
    <span class="kw">if</span> (agent.status().compareAndSet(AgentStatus.AVAILABLE, AgentStatus.ASSIGNED)) {
        order.setAgent(agent);
        <span class="kw">return true</span>;
    }
    <span class="kw">return false</span>;  <span class="cm">// agent was claimed by another order — retry with next nearest</span>
}`} />
        <Note>
          <b>Prep time matters for matching ETA.</b> A smarter <C>MatchingStrategy</C> (like
          the <C>LowestEtaStrategy</C> in Day 59) can factor in the restaurant's estimated prep
          time — assign an agent who will arrive at the restaurant just as the food is ready,
          not one who will wait 15 minutes at the counter.
        </Note>
        <Reveal summary="What about agent state — is a full State class needed here?">
          <p>
            Agent status has only four values (AVAILABLE, ASSIGNED, ON_DELIVERY, OFFLINE) and very
            little per-state behaviour beyond guarded transitions. An enum with a
            <C>canTransitionTo()</C> guard (like <C>OrderState</C> above) is the right tool here.
            A full State-class hierarchy (Day 34's vending machine rung) is overkill — there are
            no per-state methods that need different implementations.
          </p>
        </Reveal>
      </section>

      {/* S7 — Interactive */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🗺️ Play: delivery agent matching</h2>
        <p>
          Click "Find nearest" to run the matching algorithm. Notice which agent is
          chosen and how the distances are calculated. The busy agent (🔴) is skipped
          regardless of distance.
        </p>
        <AgentMatchingDemo />
      </section>

      {/* S8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Pricing and the menu model</h2>
        <p>
          Pricing has four components: subtotal (items × quantities), delivery fee,
          service fee (platform cut), and tax. Surge pricing wraps the delivery fee
          using a Decorator — the base calculator is unchanged.
        </p>
        <Code html={`<span class="cm">// Base pricing calculator</span>
<span class="kw">class</span> PricingCalculator {
    <span class="kw">public</span> Bill calculate(Order order, <span class="kw">int</span> distanceKm) {
        Money subtotal = order.items().stream()
            .map(OrderItem::lineTotal)
            .reduce(Money.ZERO, Money::add);         <span class="cm">// sum all line totals</span>
        Money deliveryFee = Money.ofRupees(<span class="num">40</span>);        <span class="cm">// flat fee; or base+per-km</span>
        Money serviceFee = subtotal.multiply(<span class="num">0.05</span>);   <span class="cm">// 5% platform fee</span>
        Money tax = subtotal.multiply(<span class="num">0.05</span>);         <span class="cm">// 5% GST</span>
        <span class="kw">return new</span> Bill(subtotal, deliveryFee, serviceFee, tax);
    }
}

<span class="cm">// Surge pricing = Decorator (Day 27) — wraps any PricingCalculator</span>
<span class="kw">class</span> SurgePricingDecorator <span class="kw">extends</span> PricingCalculator {
    <span class="kw">private final</span> PricingCalculator base;
    <span class="kw">private final double</span> multiplier;     <span class="cm">// e.g. 1.5 at peak hours</span>

    @Override
    <span class="kw">public</span> Bill calculate(Order order, <span class="kw">int</span> distanceKm) {
        Bill bill = base.calculate(order, distanceKm);
        Money surgedFee = bill.deliveryFee().multiply(multiplier);
        <span class="kw">return</span> bill.withDeliveryFee(surgedFee);  <span class="cm">// only delivery fee changes</span>
    }
}

<span class="cm">// Compose at runtime — one line swap for surge vs normal hours</span>
PricingCalculator pricing = isPeakHour()
    ? <span class="kw">new</span> SurgePricingDecorator(base, <span class="num">1.5</span>)
    : base;`} />
        <Warn>
          <b>Never store money as <C>double</C></b> — see Day 20. <C>0.1 + 0.2 = 0.30000000000000004</C>
          in Java. Across thousands of transactions, rounding errors compound into real billing bugs.
          Use <C>BigDecimal</C> or a <C>Money</C> value object with integer paise internally.
        </Warn>
        <Reveal summary="How does the payment gateway fit in?">
          <p>
            Use the Adapter pattern (Day 26): define a <C>PaymentGateway</C> interface with
            <C>charge(Money, String customerId)</C> and <C>refund(String transactionId)</C>.
            Implement <C>RazorpayAdapter</C> and <C>StripeAdapter</C> behind it. The Order flow
            calls the interface — swapping providers requires zero changes to Order logic.
            Inject a <C>FakePaymentGateway</C> in tests (Day 52 pattern).
          </p>
        </Reveal>
      </section>

      {/* S9 — Interactive */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>🛒 Play: menu and pricing</h2>
        <p>
          Add items to see the bill breakdown. Then toggle peak-hour surge and watch
          only the delivery fee change — the Decorator at work.
        </p>
        <MenuPricingDemo />
      </section>

      {/* S10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps</h2>

        <Warn>
          <b>Trap 1 — Matching agent to the customer's address.</b> The agent must go to the
          RESTAURANT first to pick up the food. Matching to the customer's address puts agents
          near customers but far from restaurants — maximizing wait time in both directions.
          Always match to the pickup location (restaurant).
        </Warn>

        <Warn>
          <b>Trap 2 — No state guards on the Order.</b> Without <C>canTransitionTo()</C>, any
          code can call <C>order.setState(DELIVERED)</C> from PLACED. In a real system this means
          the delivery fee is charged, revenue is settled, and the agent is freed — for food that
          hasn't been cooked. Always protect transitions through a single gated method.
        </Warn>

        <Warn>
          <b>Trap 3 — Agent assigned at PLACED, before restaurant confirms.</b> If the restaurant
          rejects the order, you now have an assigned agent doing nothing. Assign after CONFIRMED —
          only when you know the order is real.
        </Warn>

        <Warn>
          <b>Trap 4 — Not snapshotting the price on OrderItem.</b> If <C>OrderItem</C> holds
          a reference to <C>MenuItem</C> instead of a copied <C>unitPrice</C>, a restaurant's
          price update retroactively changes a customer's bill. Always snapshot price at order time.
        </Warn>

        <Warn>
          <b>Trap 5 — Storing price as <C>double</C>.</b> Floating-point rounding causes billing
          discrepancies at scale. Use <C>BigDecimal</C> or a paise-integer Money value object (Day 20).
        </Warn>

        <Warn>
          <b>Trap 6 — Allowing cancellation after PICKED_UP.</b> Once the agent is physically
          carrying the food, the order cannot be reversed — the food exists in the real world.
          The state machine must block this transition explicitly.
        </Warn>

        <Reveal summary="How do the patterns from earlier months appear here?">
          <table className="matrix" style={{ fontSize: 12.5, width: '100%' }}>
            <thead><tr><th style={{ textAlign: 'left', padding: '5px 8px' }}>Pattern</th><th style={{ textAlign: 'left', padding: '5px 8px' }}>Day</th><th style={{ textAlign: 'left', padding: '5px 8px' }}>Where it appears</th></tr></thead>
            <tbody>
              {[
                ['State', '34', 'Order lifecycle state machine with guarded transitions'],
                ['Observer', '32', 'Notify customer, restaurant, and agent on every state change'],
                ['Strategy', '31', 'MatchingStrategy — NearestAgent vs LowestEta'],
                ['Decorator', '27', 'SurgePricingDecorator wraps PricingCalculator'],
                ['Adapter', '26', 'PaymentGateway port — Razorpay/Stripe behind one interface'],
                ['Value Object', '20', 'Money for prices; Location for GPS coordinates'],
                ['CAS (Day 62)', '62', 'Atomic agent assignment prevents two orders grabbing the same agent'],
                ['Observer (push)', '58', 'Agent location pings re-index the spatial structure'],
              ].map(([p, d, w]) => (
                <tr key={p}><td style={{ padding: '5px 8px' }}><b>{p}</b></td><td style={{ padding: '5px 8px', color: '#7c8aa5' }}>Day {d}</td><td style={{ padding: '5px 8px' }}>{w}</td></tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </section>

      {/* S11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><b>Three parties</b> — Customer, Restaurant, DeliveryAgent. The Order is the shared state they all read and write through the system.</li>
          <li><b>Order states</b> — PLACED → CONFIRMED → PREPARING → READY_FOR_PICKUP → PICKED_UP → DELIVERED. CANCELLED reachable from PLACED/CONFIRMED/PREPARING only.</li>
          <li><b>Agent matched at CONFIRMED</b> — after the restaurant commits. Never at PLACED (restaurant might reject).</li>
          <li><b>Match to the restaurant's location</b>, not the customer's — agent picks up food there first.</li>
          <li><b>Price snapshot</b> — <C>OrderItem.unitPrice</C> is set at order time; later menu-price changes do not affect existing orders.</li>
          <li><b>Money is BigDecimal</b> — never <C>double</C>. Use integer paise internally. Value Object (Day 20).</li>
          <li><b>Surge = Decorator</b> — <C>SurgePricingDecorator</C> wraps <C>PricingCalculator</C> and multiplies only the delivery fee.</li>
          <li><b>State machine guards</b> — <C>canTransitionTo()</C> in the enum; all changes go through <C>order.transitionTo()</C>.</li>
          <li><b>Agent CAS race</b> — two orders may compete for the same nearest agent. Use <C>compareAndSet(AVAILABLE, ASSIGNED)</C>; loser re-matches (Day 62).</li>
          <li><b>Observer for notifications</b> — every <C>transitionTo()</C> fires push updates to all three parties (Day 32).</li>
        </ul>
      </section>

      {/* INTERVIEW */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>

        <Reveal summary="Q: Can an agent carry multiple orders at the same time? How does that change the design?">
          <p>
            Yes — this is called "batching" or "stacking." It changes <C>MatchingStrategy</C>: instead
            of assigning the agent to one order, the strategy checks if the agent's current route is
            close enough to the new pickup. The agent now has a <C>List&lt;Order&gt;</C> instead of one
            order reference. The core Order state machine is unchanged — each order still transitions
            independently through PICKED_UP → DELIVERED.
          </p>
        </Reveal>

        <Reveal summary="Q: What happens if the restaurant rejects the order?">
          <p>
            The system calls <C>order.transitionTo(CANCELLED)</C> from PLACED. This triggers:
            (1) a notification to the customer, (2) a refund (or hold release) via the PaymentGateway,
            (3) no agent was assigned yet (assignment happens at CONFIRMED), so no agent reassignment needed.
            The customer may be shown alternative restaurants.
          </p>
        </Reveal>

        <Reveal summary="Q: How do you prevent two concurrent orders from being assigned to the same agent?">
          <p>
            Atomic compare-and-set (Day 62): <C>agent.status().compareAndSet(AVAILABLE, ASSIGNED)</C>.
            Only one thread wins; the other gets <C>false</C> and retries with the next nearest available
            agent. In a distributed system this is a Redis <C>SET NX EX</C> on the agent ID (Day 64).
          </p>
        </Reveal>

        <Reveal summary="Q: Why is ETA hard to calculate in food delivery?">
          <p>
            ETA = prep time + agent travel time. Both are uncertain. Prep time depends on the
            restaurant's current queue and order complexity. Agent travel time depends on live traffic.
            Real systems model these as probabilistic estimates and update the ETA continuously as the
            order progresses. The design seam is a <C>EtaEstimator</C> interface injected into the system —
            you can swap a simple fixed-time model for an ML model later.
          </p>
        </Reveal>

        <Reveal summary="Q: What if the agent goes offline after being ASSIGNED but before picking up the food?">
          <p>
            The agent's status becomes OFFLINE. A background sweeper (similar to the HoldExpirySweeper in
            Day 52) detects agents that have been ASSIGNED but sent no location ping for N minutes. It
            calls <C>agentService.unassign(agent)</C> and re-runs <C>MatchingStrategy</C> for the
            affected order. The order state stays at CONFIRMED (or PREPARING) — only the agent reference
            changes. The restaurant is notified that a new agent is being found.
          </p>
        </Reveal>

        <Reveal summary="Q: How would you add a 'scheduled order' feature (order for 7 PM, placed at noon)?">
          <p>
            Add <C>scheduledFor: Instant</C> to Order. On CONFIRMED, instead of immediately running
            MatchingStrategy, enqueue a delayed task: "run matching at scheduledFor minus agent-travel-time."
            The restaurant is notified at an appropriate prep start time. The rest of the state machine
            is unchanged — this is the open-for-extension principle from Day 12 (OCP): add a field and
            a delayed trigger without touching the core Order lifecycle.
          </p>
        </Reveal>

        <Reveal summary="Q: How does rating both the restaurant and the agent work? What data model supports it?">
          <p>
            Both are running averages, updated atomically after DELIVERED. A <C>Rating</C> value object
            holds <C>totalScore</C> and <C>count</C>; <C>average()</C> returns the mean.
            <C>Restaurant.updateRating(newScore)</C> and <C>DeliveryAgent.updateRating(newScore)</C> are
            synchronized or use CAS on the count+total pair. The Order record stores the customer's ratings
            for audit — you can recalculate the average from raw scores if needed.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="s13">
        <div className="sec-label">Section 13 · Test yourself</div>
        <h2>🧠 Quiz</h2>
        <p>Click an answer — explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 67 complete?</strong> Homework: model a food delivery system in Java.
        Create the enum <C>OrderState</C> with <C>canTransitionTo()</C>, write a basic
        <C>Order.transitionTo()</C> method that throws on invalid transitions, and add a
        simple <C>NearestAgentStrategy</C> that filters AVAILABLE agents and picks the one
        with the smallest Manhattan distance to a given restaurant location. Test all guarded
        transitions — including the case where PICKED_UP cannot transition back to CANCELLED.
        <br /><br />
        Next: <strong>Day 68 — Amazon Locker</strong>: assigning packages to physical locker
        slots by size, generating pickup codes, handling expiry — a state machine with
        physical-world constraints and a resource-claim problem at its core.
      </div>

    </div>
  )
}
