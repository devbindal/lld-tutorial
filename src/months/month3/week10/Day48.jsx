import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the switch-grid disease ============ */
const STATES = ['IDLE', 'HAS_MONEY', 'DISPENSING', 'SOLD_OUT']
const EVENTS = ['insertCoin', 'selectItem', 'dispense', 'refund']
/* what each (state,event) should do — the truth table the switch must encode */
const GRID = {
  IDLE:       { insertCoin: '→ HAS_MONEY', selectItem: 'error: pay first', dispense: 'error: nothing selected', refund: 'error: no money' },
  HAS_MONEY:  { insertCoin: 'add to balance', selectItem: '→ DISPENSING (if affordable & in stock)', dispense: 'error: select first', refund: '→ IDLE (return coins)' },
  DISPENSING: { insertCoin: 'error: busy', selectItem: 'error: busy', dispense: 'drop item + change → IDLE/SOLD_OUT', refund: 'error: too late' },
  SOLD_OUT:   { insertCoin: 'reject coin', selectItem: 'error: sold out', dispense: 'error', refund: '→ IDLE (return coins)' },
}

function SwitchGrid() {
  const [view, setView] = useState('grid')   // grid | added
  return (
    <div className="panel">
      <div className="ptitle">Live demo · the truth table a naive switch must hand-code — every cell is a branch waiting to rot</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}>4 states × 4 events = 16 cells</button>
        <button className={view === 'added' ? 'on' : ''} onClick={() => setView('added')}>add MAINTENANCE state →</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="matrix" style={{ fontSize: 11.5 }}>
          <thead>
            <tr>
              <th>state \ event</th>
              {EVENTS.map((e) => <th key={e}>{e}()</th>)}
            </tr>
          </thead>
          <tbody>
            {STATES.map((s) => (
              <tr key={s}>
                <td style={{ fontWeight: 700, fontFamily: 'IBM Plex Mono' }}>{s}</td>
                {EVENTS.map((e) => (
                  <td key={e} style={{ fontFamily: 'IBM Plex Mono', fontSize: 10.5 }}>{GRID[s][e]}</td>
                ))}
              </tr>
            ))}
            {view === 'added' && (
              <tr style={{ background: '#FDECEC' }}>
                <td style={{ fontWeight: 700, fontFamily: 'IBM Plex Mono' }}>MAINTENANCE 🔧</td>
                {EVENTS.map((e) => (
                  <td key={e} style={{ fontFamily: 'IBM Plex Mono', fontSize: 10.5, color: 'var(--red)' }}>NEW branch ⚠</td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="statbar" style={{ display: 'block', marginTop: 10 }}>
        {view === 'grid'
          ? <span>A switch-based machine encodes all 16 cells as <C>switch(state){'{'}case IDLE: switch(event)…{'}'}</C>. It compiles. Now press "add MAINTENANCE".</span>
          : <span style={{ color: 'var(--red)' }}>⚠ One new state = <b>4 new branches scattered across 4 different switch blocks</b> (one per event method). Miss one and the bug is silent. THIS is the shotgun surgery the State pattern cures — each state becomes one class you add, not 4 cells you hunt down.</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: the live vending machine ============ */
const CATALOG = [
  { code: 'A1', name: 'Cola', price: 25, icon: '🥤' },
  { code: 'A2', name: 'Water', price: 15, icon: '💧' },
  { code: 'B1', name: 'Chips', price: 35, icon: '🍟' },
  { code: 'B2', name: 'Candy', price: 20, icon: '🍫' },
]

function VendingMachine() {
  const [stock, setStock] = useState({ A1: 2, A2: 1, B1: 0, B2: 3 })   // B1 sold out from the start
  const [balance, setBalance] = useState(0)
  const [selected, setSelected] = useState(null)
  const [state, setState] = useState('IDLE')
  const [log, setLog] = useState('🟢 IDLE — insert coins to begin.')

  const COINS = [5, 10, 25]

  function insertCoin(c) {
    if (state === 'DISPENSING') { setLog('⛔ insertCoin() rejected — machine is DISPENSING. The state itself refuses; no outer if-guard needed.'); return }
    const nb = balance + c
    setBalance(nb); setState('HAS_MONEY')
    setLog(`💰 +₹${c} → balance ₹${nb}. State: HAS_MONEY. The HasMoneyState handled this; IDLE would have done the same and transitioned itself.`)
  }

  function select(item) {
    if (state === 'DISPENSING') { setLog('⛔ busy dispensing.'); return }
    if (balance === 0) { setLog(`⛔ selectItem(${item.code}) in IDLE → "insert money first." The IDLE state owns this rejection.`); return }
    if (stock[item.code] === 0) { setLog(`⛔ ${item.name} is SOLD OUT — pick another or refund.`); setSelected(item.code); return }
    if (balance < item.price) { setLog(`⛔ ₹${balance} < ₹${item.price} for ${item.name}. Need ₹${item.price - balance} more. Still HAS_MONEY.`); setSelected(item.code); return }
    setSelected(item.code); setState('DISPENSING')
    setLog(`🎯 ${item.name} selected, ₹${balance} ≥ ₹${item.price} → DISPENSING. Now only dispense() is legal.`)
  }

  function dispense() {
    if (state !== 'DISPENSING') { setLog('⛔ dispense() only works in DISPENSING. Select an affordable item first.'); return }
    const item = CATALOG.find((i) => i.code === selected)
    const change = balance - item.price
    const newStock = { ...stock, [selected]: stock[selected] - 1 }
    setStock(newStock)
    const soldOutNow = Object.values(newStock).every((q) => q === 0)
    setBalance(0); setSelected(null)
    setState(soldOutNow ? 'SOLD_OUT' : 'IDLE')
    setLog(`✅ ${item.icon} ${item.name} dropped${change > 0 ? ` + ₹${change} change` : ''}. ` +
      `${soldOutNow ? 'Everything gone → SOLD_OUT.' : 'Back to IDLE.'} The DispensingState decided which successor to name.`)
  }

  function refund() {
    if (state === 'DISPENSING') { setLog('⛔ too late — already dispensing.'); return }
    if (balance === 0) { setLog('⛔ no money to refund.'); return }
    setLog(`↩️ refunded ₹${balance}. → IDLE.`)
    setBalance(0); setSelected(null); setState('IDLE')
  }

  function restock() {
    setStock({ A1: 2, A2: 1, B1: 0, B2: 3 }); setBalance(0); setSelected(null); setState('IDLE')
    setLog('🔧 restocked (B1 still 0) → IDLE.')
  }

  const stateColor = { IDLE: '#EAF7EF', HAS_MONEY: '#FFF1D6', DISPENSING: '#E5EBFF', SOLD_OUT: '#FDECEC' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · a working machine — every button is an event the CURRENT state decides how to handle</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 80px)', gap: 6, marginBottom: 8 }}>
            {CATALOG.map((item) => (
              <button key={item.code} onClick={() => select(item)} style={{
                padding: '8px 4px', borderRadius: 8, border: '1.5px solid var(--line)', cursor: 'pointer',
                background: selected === item.code ? '#FFF1D6' : stock[item.code] === 0 ? '#FDECEC' : '#fff',
                fontFamily: 'IBM Plex Mono', fontSize: 11,
              }}>
                <div style={{ fontSize: 20 }}>{item.icon}</div>
                <div style={{ fontWeight: 700 }}>{item.code} · ₹{item.price}</div>
                <div style={{ color: stock[item.code] === 0 ? 'var(--red)' : '#7c8aa5' }}>
                  {stock[item.code] === 0 ? 'SOLD OUT' : `${stock[item.code]} left`}
                </div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {COINS.map((c) => <button key={c} className="ghost act" style={{ fontSize: 12 }} onClick={() => insertCoin(c)}>+₹{c}</button>)}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="act" style={{ fontSize: 12 }} onClick={dispense}>dispense</button>
            <button className="ghost act" style={{ fontSize: 12 }} onClick={refund}>refund</button>
            <button className="ghost act" style={{ fontSize: 12 }} onClick={restock}>🔧 restock</button>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <span className="chip" style={{ fontFamily: 'IBM Plex Mono', background: stateColor[state], outline: '2px solid var(--line)' }}>state: {state}</span>
            <span className="chip" style={{ fontFamily: 'IBM Plex Mono' }}>balance: ₹{balance}</span>
          </div>
          <div className="statbar" style={{ display: 'block', minHeight: 70 }}>
            <span style={{ fontSize: 12.5 }}>{log}</span>
          </div>
        </div>
      </div>
      <Good style={{ marginTop: 0 }}><span style={{ fontSize: 12.5 }}>Try the illegal moves: <b>select before paying</b>, <b>dispense in IDLE</b>, <b>insert while dispensing</b>. Each is refused by the STATE — not by a pile of if-checks in one giant method.</span></Good>
    </div>
  )
}

/* ============ Interactive 3: change-making (greedy vs exact) ============ */
function makeChange(amount, coins, counts) {
  // greedy with limited inventory
  const result = {}
  let remaining = amount
  for (const c of coins) {            // coins assumed sorted desc
    let use = Math.min(Math.floor(remaining / c), counts[c])
    if (use > 0) { result[c] = use; remaining -= use * c }
  }
  return remaining === 0 ? result : null   // null = cannot make exact change
}

function ChangeLab() {
  const coins = [10, 5, 1]
  const [counts, setCounts] = useState({ 10: 2, 5: 0, 1: 3 })
  const [due, setDue] = useState(8)
  const result = makeChange(due, coins, counts)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the change problem hiding inside every vending machine</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>coin inventory</div>
          {coins.map((c) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', width: 36 }}>₹{c} ×</span>
              <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => setCounts((x) => ({ ...x, [c]: Math.max(0, x[c] - 1) }))}>−</button>
              <span style={{ fontFamily: 'IBM Plex Mono', width: 20, textAlign: 'center' }}>{counts[c]}</span>
              <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => setCounts((x) => ({ ...x, [c]: x[c] + 1 }))}>+</button>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>change due</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => setDue((d) => Math.max(0, d - 1))}>−</button>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 20, width: 40, textAlign: 'center' }}>₹{due}</span>
            <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => setDue((d) => d + 1)}>+</button>
          </div>
        </div>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {result
          ? <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>✅ change ₹{due} = {Object.entries(result).map(([c, n]) => `${n}×₹${c}`).join(' + ') || 'nothing'}. Greedy worked here.</span>
          : <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, color: 'var(--red)' }}>❌ CANNOT make ₹{due} from this inventory. Real machines must REFUSE the sale up front (refund instead of trapping the coins) — "exact change only" is a STATE, not a crash.</span>}
      </div>
      <Note style={{ marginTop: 8 }}><span style={{ fontSize: 12.5 }}>Set ₹5 to 0, due to ₹8: greedy grabs 10? no (too big), then needs 8×₹1 but only 3 exist → fails. The lesson: change-making is a real sub-problem with inventory limits, and "can't make change" must be handled BEFORE dispensing, never after the coins are swallowed.</span></Note>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The elevator (Day 46) stayed at the enum-and-guards rung. Why does the vending machine CLIMB to full State classes?',
    o: ['State classes are always better than enums', 'Per-state BEHAVIOUR genuinely multiplies here: the SAME four events (insert/select/dispense/refund) do completely different things in each state — Day 34\'s ladder says climb exactly when behaviour, not just labels, varies per state', 'Vending machines are more important', 'Enums can\'t hold money'], a: 1,
    e: 'The ladder\'s climbing condition (Day 34) is per-state behaviour. The elevator\'s states mostly differ in guards; the vending machine\'s states each give every event a different meaning — that\'s the tipping point where one-class-per-state pays off.',
    w: { 0: 'Pattern-by-reflex is factory-itis\'s cousin — the enum rung was right for the elevator.',
         2: 'Importance is irrelevant; the amount of per-state behaviour is the deciding factor.',
         3: 'Money lives in the context (the machine), not the state — and enums could hold it fine.' },
    r: { id: 's2', label: 'Section 2 — why climb the ladder' } },
  { q: 'The disease the State pattern cures, shown by "add a MAINTENANCE state" to a switch-based machine?',
    o: ['Slow performance', 'Shotgun surgery: one new state means new branches scattered across EVERY event\'s switch block — miss one and the bug is silent; with State classes you ADD one class and touch nothing existing (Day 12)', 'Too much memory', 'Compile errors'], a: 1,
    e: 'A switch(state) inside each of insert/select/dispense/refund means a new state edits all four methods. State classes invert this: each state is one cohesive class, so adding MAINTENANCE is additive, not invasive.',
    w: { 0: 'Both designs are instant at runtime; maintainability is the cost.',
         2: 'Memory is identical; the cost is scattered edits.',
         3: 'A forgotten branch compiles fine and fails silently — worse than a compile error.' },
    r: { id: 's3', label: 'Section 3 — switch-grid disease' } },
  { q: 'In the State pattern, who decides the NEXT state after handling an event?',
    o: ['The context (VendingMachine) with a big if-else', 'The current state object itself: e.g. DispensingState.dispense() calls machine.setState(soldOut ? SOLD_OUT : IDLE) — states name their own successors, keeping each transition with the behaviour that triggers it', 'A central StateManager', 'The client code'], a: 1,
    e: 'Each state owns both its event handling AND its transitions. DispensingState knows that after a drop it goes to IDLE (or SOLD_OUT if empty). The transition logic lives next to the behaviour that causes it — that locality is the pattern\'s point.',
    w: { 0: 'Putting transitions back in the context recreates the switch-grid you were escaping.',
         2: 'A central manager is the switch in a trench coat — same scattered knowledge.',
         3: 'Clients press buttons (fire events); they must not know the state graph.' },
    r: { id: 's4', label: 'Section 4 — states name successors' } },
  { q: 'selectItem() is pressed while the machine is in IDLE (no money). The cleanest design?',
    o: ['The context checks if(balance==0) before calling the state', 'IdleState.selectItem() itself rejects it ("insert money first") — every state implements every event, so illegal moves are refused BY the state, with no outer guards in the context', 'Throw a generic exception from one place', 'Disable the buttons in IDLE'], a: 1,
    e: 'The whole point of one-class-per-state is that each state gives a definitive answer to every event — including "no". The context just forwards events to the current state; it holds zero if-state checks.',
    w: { 0: 'An if(balance==0) in the context is the switch-grid leaking back in.',
         2: 'One central throw still needs to KNOW the state — same coupling.',
         3: 'UI disabling is a nice extra, but the MODEL must still refuse illegal events authoritatively.' },
    r: { id: 's4', label: 'Section 4 — every state, every event' } },
  { q: 'Where do the balance, inventory, and coin reserves live — in the states or the context?',
    o: ['In each state object', 'In the context (the VendingMachine): states are usually stateLESS behaviour holders that READ and MUTATE the context\'s data — so they can be shared/singletons, and switching state doesn\'t lose the balance', 'In the client', 'In a global'], a: 1,
    e: 'States encode "how to behave"; the context holds "what is true right now" (money, stock). This split lets states be flyweight singletons (one IdleState shared by all) and means a transition never copies data — it just points the context at a new behaviour.',
    w: { 0: 'Per-state data would be lost on every transition and forces a new object each time.',
         2: 'The client triggers events; it owns none of the machine\'s data.',
         3: 'A global is the singleton-as-global-variable anti-pattern (Day 21).' },
    r: { id: 's5', label: 'Section 5 — context vs state data' } },
  { q: '"Exact change only" — the machine can\'t make change for a sale. Correct handling?',
    o: ['Dispense anyway and keep the extra', 'Refuse the sale UP FRONT (refund the coins) — "can\'t make change" is a real pre-condition checked before dispensing, often surfaced as an "exact change only" state/flag, never a crash after the coins are swallowed', 'Crash', 'Round to the nearest coin'], a: 1,
    e: 'Change-making with limited coin inventory can FAIL. A correct machine detects this before committing the sale and either refuses (refunds) or signals exact-change-only — the coins are never trapped and the customer is never short-changed.',
    w: { 0: 'Keeping the customer\'s extra money is theft, not a design choice.',
         2: 'A predictable shortfall must be handled gracefully, not crashed on.',
         3: 'Silently rounding cheats someone every time — money math (Day 20) forbids it.' },
    r: { id: 's7', label: 'Section 7 — the change problem' } },
  { q: 'Why is the State pattern often paired with making each state a flyweight singleton?',
    o: ['To save typing', 'Because states are stateLESS behaviour (all mutable data is in the context), so ONE IdleState/HasMoneyState instance can be shared across the machine — no reason to allocate a new state object per transition (Day 30 flyweight)', 'Singletons are required by the pattern', 'To make them thread-safe automatically'], a: 1,
    e: 'When behaviour holders carry no per-instance data, identical instances are wasteful — one shared instance per state suffices. This is the flyweight idea (Day 30) applied to the State pattern; transitions just re-point the context.',
    w: { 0: 'It\'s about avoiding needless allocation, not typing.',
         2: 'The pattern works with fresh instances too; flyweight is an optimization, not a rule.',
         3: 'Sharing stateless objects is incidentally safe, but singleton-ness doesn\'t MAKE anything thread-safe.' },
    r: { id: 's5', label: 'Section 5 — stateless states' } },
  { q: 'State pattern vs Strategy — both inject behaviour behind an interface. The real difference?',
    o: ['They\'re identical', 'WHO swaps it and WHEN: a Strategy is chosen ONCE (usually by the client/wiring) and stays; States swap THEMSELVES at runtime in response to events, forming a graph where each state picks the next — same structure, opposite control of transitions', 'Strategy uses interfaces, State uses classes', 'State is faster'], a: 1,
    e: 'Structurally twins (context delegates to a swappable behaviour object). The distinction is transition control: Strategy is set externally and fixed; State machines transition internally and continuously, with states naming successors.',
    w: { 0: 'Structurally similar, but transition control differs sharply.',
         2: 'Both use interfaces with concrete implementations.',
         3: 'Performance is identical; intent differs.' },
    r: { id: 's8', label: 'Section 8 — State vs Strategy' } },
]

/* ============ The page ============ */
export default function Day48() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 10 · Day 48 · Classic LLD Problems</div>
        <h1>Vending Machine:<br />Where the State Pattern Finally Earns Its Keep</h1>
        <p>Day 46 climbed Day 34's ladder partway — the elevator stayed at enum-and-guards. Today's machine is
           the problem that tips it over: the SAME four buttons mean completely different things depending on
           where the machine is, and one giant switch becomes a maintenance nightmare. This is the State
           pattern's flagship interview problem. Click everything.</p>
        <div className="chips">
          {['vending machine', 'State pattern', 'state machine', 'switch-grid disease', 'change-making', 'State vs Strategy'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The same buttons, four meanings</h2>
        <p>A vending machine has a tiny interface — insert a coin, pick an item, take your snack, or get a
          refund. But press the SAME button in different situations and the right answer changes completely:</p>
        <Code html={`  ONE BUTTON, ANSWERS THAT DEPEND ON "WHERE WE ARE"

  press "select B1" when…
    · no money inserted   → "please insert money first"
    · money in, affordable → dispense B1, make change
    · money in, too little → "₹10 more, please"
    · already dispensing   → "please wait"
    · B1 sold out          → "choose another"

  The BEHAVIOUR is a function of (event, current state). That is the textbook
  definition of a state machine — and when each state gives EVERY event a
  different answer, you've hit the State pattern's home turf.`} />
        <Note><strong>The running idea:</strong> the machine is a context that <em>delegates</em> every button
          press to a "mode" object representing where it currently is. IDLE mode, HasMoney mode, Dispensing
          mode, SoldOut mode — each is a small class that knows how to answer all four buttons, and which mode
          to become next.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The ladder, revisited: elevator stayed, vending climbs</h2>
        <p>Day 34 gave us a ladder for modelling states; Day 46 deliberately stopped at the enum rung. Today we
          climb — and the reason is precise:</p>
        <table className="matrix">
          <thead>
            <tr><th>rung</th><th>good when</th><th>which problem</th></tr>
          </thead>
          <tbody>
            <tr><td>if/else flags (isMoving, hasCoin)</td><td>2 states, trivial logic</td><td>throwaway scripts</td></tr>
            <tr><td>enum + guarded transitions</td><td>few states, behaviour mostly = guards</td><td><b>elevator (Day 46)</b> — states differ in what\'s LEGAL, not much else</td></tr>
            <tr><td>State pattern (one class per state)</td><td>each state answers EVERY event differently; states grow</td><td><b>vending machine (today)</b> — every event has 4 distinct meanings</td></tr>
            <tr><td>state-chart libraries</td><td>dozens of states, nested/parallel</td><td>workflow engines, protocols</td></tr>
          </tbody>
        </table>
        <Good><strong>The interview line:</strong> "I\'d use the State pattern here, not an enum — unlike the
          elevator, every event does something genuinely different in each state, so one-class-per-state keeps
          each mode cohesive and makes new states (MAINTENANCE, EXACT_CHANGE_ONLY) additive." Naming WHY you
          climbed is the senior signal — same skill as Day 46\'s "I\'d stay at the enum rung."</Good>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🦠 Play: the switch-grid disease</h2>
        <p>Before the cure, feel the disease. Here is the truth table a naive <C>switch(state)</C> machine must
          encode by hand — then watch what one new state costs:</p>
        <SwitchGrid />
        <Warn><strong>The naive machine</strong> puts a <C>switch(state)</C> inside EACH event method
          (<C>insertCoin</C>, <C>selectItem</C>, <C>dispense</C>, <C>refund</C>). Adding MAINTENANCE means
          editing all four methods and not forgetting any case — classic <em>shotgun surgery</em> (Day 17), and
          a forgotten case fails silently. The State pattern turns "edit 4 scattered switch blocks" into "add 1
          class".</Warn>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The cure: one class per state, states name their successors</h2>
        <p>Every state implements the same interface — all four events — and each state object decides both how
          to respond AND which state to become next:</p>
        <Code html={`<span class="kw">public interface</span> VendingState {            <span class="cm">// every state must answer EVERY event</span>
    <span class="kw">void</span> insertCoin(VendingMachine m, <span class="kw">int</span> coin);
    <span class="kw">void</span> selectItem(VendingMachine m, String code);
    <span class="kw">void</span> dispense(VendingMachine m);
    <span class="kw">void</span> refund(VendingMachine m);
}

<span class="kw">public class</span> IdleState <span class="kw">implements</span> VendingState {
    <span class="kw">public void</span> insertCoin(VendingMachine m, <span class="kw">int</span> coin) {
        m.addBalance(coin);                       <span class="cm">// money is in the CONTEXT, not here</span>
        m.setState(m.hasMoney());                 <span class="cm">// ← this state names its successor</span>
    }
    <span class="kw">public void</span> selectItem(VendingMachine m, String code) {
        m.display(<span class="str">"insert money first"</span>);          <span class="cm">// IDLE refuses selection — no outer guard needed</span>
    }
    <span class="kw">public void</span> dispense(VendingMachine m) { m.display(<span class="str">"nothing selected"</span>); }
    <span class="kw">public void</span> refund(VendingMachine m)   { m.display(<span class="str">"no money to refund"</span>); }
}

<span class="kw">public class</span> DispensingState <span class="kw">implements</span> VendingState {
    <span class="kw">public void</span> insertCoin(VendingMachine m, <span class="kw">int</span> c) { m.display(<span class="str">"please wait"</span>); }  <span class="cm">// busy: reject</span>
    <span class="kw">public void</span> selectItem(VendingMachine m, String s) { m.display(<span class="str">"please wait"</span>); }
    <span class="kw">public void</span> dispense(VendingMachine m) {
        Item item = m.selectedItem();
        m.dropItem(item);                          <span class="cm">// hardware action via the context</span>
        m.returnChange(m.balance() - item.price());
        m.clearBalance();
        m.setState(m.isEmpty() ? m.soldOut() : m.idle());  <span class="cm">// ← picks IDLE or SOLD_OUT</span>
    }
    <span class="kw">public void</span> refund(VendingMachine m) { m.display(<span class="str">"too late to refund"</span>); }
}`} />
        <Code html={`  THE STATE GRAPH (each arrow lives INSIDE the state it leaves)

         insertCoin                selectItem (affordable, in stock)
   IDLE ──────────▶ HAS_MONEY ──────────────────────▶ DISPENSING
    ▲                  │  ▲                                 │
    │ refund / dispense│  │ insertCoin (add more)           │ dispense()
    └──────────────────┘  └─────────────────────────────────┘ drops item,
              │                                                 makes change
              │ (when last item leaves)                          │
              └────────────── SOLD_OUT ◀────────────────────────┘
                                  │  refund / restock
                                  └──▶ IDLE`} />
        <Good><strong>The key inversion:</strong> there is NO <C>switch(state)</C> anywhere. The
          <C> VendingMachine</C> context just forwards: <C>void insertCoin(int c) {'{'} state.insertCoin(this,
          c); {'}'}</C>. All the per-state knowledge — behaviour AND transitions — lives in the state classes,
          where it\'s cohesive and where a new state is a new file.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Context vs state: who holds what</h2>
        <p>A clean split makes the states sharable and the transitions cheap:</p>
        <Code html={`<span class="kw">public class</span> VendingMachine {                  <span class="cm">// the CONTEXT — holds all the mutable truth</span>
    <span class="kw">private</span> VendingState state;                  <span class="cm">// the current behaviour (a pointer, swapped on transition)</span>
    <span class="kw">private int</span> balance;                          <span class="cm">// money in right now — DATA lives here, not in states</span>
    <span class="kw">private final</span> Inventory inventory;            <span class="cm">// stock counts per item</span>
    <span class="kw">private final</span> CoinReserve reserve;             <span class="cm">// coins available to make change</span>
    <span class="kw">private</span> String selectedCode;

    <span class="cm">// states are STATELESS singletons — one shared instance each (flyweight, Day 30)</span>
    <span class="kw">private final</span> VendingState idle = <span class="kw">new</span> IdleState();
    <span class="kw">private final</span> VendingState hasMoney = <span class="kw">new</span> HasMoneyState();
    <span class="kw">private final</span> VendingState dispensing = <span class="kw">new</span> DispensingState();
    <span class="kw">private final</span> VendingState soldOut = <span class="kw">new</span> SoldOutState();

    <span class="cm">// the public API just FORWARDS to the current state — zero if-state logic</span>
    <span class="kw">public void</span> insertCoin(<span class="kw">int</span> c) { state.insertCoin(<span class="kw">this</span>, c); }
    <span class="kw">public void</span> selectItem(String code) { state.selectItem(<span class="kw">this</span>, code); }
    <span class="kw">public void</span> dispense() { state.dispense(<span class="kw">this</span>); }
    <span class="kw">public void</span> refund() { state.refund(<span class="kw">this</span>); }

    <span class="cm">// states call these to read/mutate the context and to transition</span>
    <span class="kw">void</span> setState(VendingState s) { <span class="kw">this</span>.state = s; }
    <span class="kw">void</span> addBalance(<span class="kw">int</span> c) { balance += c; }
    VendingState idle() { <span class="kw">return</span> idle; }   VendingState hasMoney() { <span class="kw">return</span> hasMoney; }
    <span class="cm">// …etc</span>
}`} />
        <Note><strong>Why states are stateless:</strong> they hold no per-instance data — they READ and MUTATE
          the context. So one <C>IdleState</C> instance serves the whole machine (flyweight, Day 30), and a
          transition is just <C>setState(...)</C> — no copying, and the balance survives because it never lived
          in the state to begin with. "Behaviour in the state, data in the context" is the whole discipline.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🥤 Play: the working machine</h2>
        <p>A real machine driven by the State pattern. Buy something the happy way, then deliberately try
          illegal moves and watch the current state refuse them:</p>
        <VendingMachine />
        <Good><strong>What you should notice:</strong> ① Every illegal move (select before paying, dispense in
          IDLE, insert while dispensing) is refused — and in real code that refusal lives in the relevant
          STATE class, not in a tangle of context guards. ② Buying the last B2 flips the machine to SOLD_OUT —
          the DispensingState named that successor. ③ The balance lives in the machine (context); transitions
          just re-point which behaviour is active.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The sub-problem hiding inside: making change</h2>
        <p>Dispensing isn\'t just "drop the snack" — it\'s "drop the snack AND return the right coins from a
          limited reserve." That reserve can run dry, and a correct machine must notice <em>before</em> it
          swallows your money:</p>
        <Code html={`<span class="kw">public</span> Optional&lt;List&lt;Coin&gt;&gt; makeChange(<span class="kw">int</span> amount) {   <span class="cm">// greedy, with INVENTORY limits</span>
    List&lt;Coin&gt; out = <span class="kw">new</span> ArrayList&lt;&gt;();
    <span class="kw">int</span> remaining = amount;
    <span class="kw">for</span> (Coin coin : Coin.descending()) {           <span class="cm">// ₹10, ₹5, ₹1 — biggest first</span>
        <span class="kw">while</span> (remaining &gt;= coin.value() &amp;&amp; reserve.has(coin)) {
            out.add(coin); reserve.take(coin); remaining -= coin.value();
        }
    }
    <span class="kw">return</span> remaining == <span class="num">0</span> ? Optional.of(out) : Optional.empty();  <span class="cm">// empty = can\'t make exact change</span>
}

<span class="cm">// In the buy flow, CHECK change feasibility BEFORE committing the sale:</span>
<span class="kw">if</span> (makeChange(balance - item.price()).isEmpty()) {
    m.display(<span class="str">"exact change only"</span>);              <span class="cm">// refuse up front…</span>
    m.refund();                                     <span class="cm">// …and give the coins back — never trap them</span>
    <span class="kw">return</span>;
}`} />
        <Warn><strong>Greedy change-making can FAIL with limited coins</strong> — and even gives wrong answers
          for some coin systems (the classic ₹1/₹3/₹4 making ₹6 puzzle). For real coin denominations greedy is
          usually fine, but the inventory limit is the real trap: if you can\'t make exact change, REFUND, don\'t
          dispense-and-shortchange. "Exact change only" is a legitimate machine state/flag, not a crash.</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🪙 Play: the change lab + State vs Strategy</h2>
        <p>First, feel the change problem — shrink the coin reserve until exact change becomes impossible:</p>
        <ChangeLab />
        <p style={{ marginTop: 16 }}>Now the question every interviewer asks after you say "State pattern":
          how is it different from Strategy (Day 31)? They look identical — a context delegating to a swappable
          behaviour object:</p>
        <table className="matrix">
          <thead>
            <tr><th></th><th>Strategy (Day 31)</th><th>State (today)</th></tr>
          </thead>
          <tbody>
            <tr><td>structure</td><td>context → interface → impls</td><td>context → interface → impls <em>(same!)</em></td></tr>
            <tr><td>who swaps it</td><td>client / wiring, ONCE</td><td>the states themselves, at runtime</td></tr>
            <tr><td>when</td><td>chosen up front, then fixed</td><td>continuously, in response to events</td></tr>
            <tr><td>transitions</td><td>none — one strategy for the job</td><td>a GRAPH — each state names successors</td></tr>
            <tr><td>intent</td><td>"do this job a different WAY"</td><td>"behave differently as I CHANGE"</td></tr>
          </tbody>
        </table>
        <Good><strong>The one-liner:</strong> structurally twins, but Strategy is set <em>from outside and
          stays</em>, while State <em>swaps itself</em> in response to events, forming a graph. Elevator
          scheduling (Day 47) was a Strategy — picked once at wiring. The vending machine\'s modes are States —
          they hand control to each other as events arrive.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>The giant switch(state).</strong> A <C>switch</C> inside every event method = shotgun
          surgery on every new state, with silent forgotten-case bugs. One class per state instead.</Warn>
        <Warn><strong>Transitions in the context.</strong> If the VendingMachine decides the next state with
          if-else, you\'ve rebuilt the switch-grid. States must name their own successors.</Warn>
        <Warn><strong>Data in the states.</strong> Putting balance/stock inside state objects loses it on every
          transition and forces fresh allocations. Data in the context; states are stateless behaviour.</Warn>
        <Warn><strong>Context guards before delegating.</strong> <C>if (balance == 0) return; state.selectItem()</C>
          — the if leaks state knowledge back into the context. Let each state refuse illegal events itself.</Warn>
        <Warn><strong>Dispense-then-check-change.</strong> Swallowing coins and only THEN discovering you can\'t
          make change shortchanges the customer. Check change feasibility before committing; refund if
          impossible.</Warn>
        <Warn><strong>double for money / prices.</strong> Day 20, again — prices and coin values are integer
          minor units or BigDecimal Money, never floating point. A vending machine that loses a paise per sale
          loses real money at scale.</Warn>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Climb the ladder (Day 34) when</strong> each state answers EVERY event differently — vending does, elevator didn\'t. Say WHY you climbed.</li>
          <li><strong>State pattern shape:</strong> <C>VendingState</C> interface with all events; one class per state (Idle/HasMoney/Dispensing/SoldOut); context forwards <C>state.event(this, …)</C> with zero if-state logic.</li>
          <li><strong>States name successors:</strong> each state\'s event handler calls <C>m.setState(...)</C> — transitions live next to the behaviour that triggers them.</li>
          <li><strong>Data in context, behaviour in states:</strong> balance/inventory/coin reserve in the VendingMachine; states are stateless → flyweight singletons (Day 30).</li>
          <li><strong>Illegal moves refused BY the state</strong> (e.g. <C>IdleState.dispense()</C> → "nothing selected") — no central guards.</li>
          <li><strong>Change-making</strong> is a real sub-problem: greedy with inventory limits can fail → check BEFORE dispensing, refund if impossible ("exact change only"), money as integers/BigDecimal.</li>
          <li><strong>State vs Strategy:</strong> same structure; Strategy is set once from outside, State swaps itself at runtime forming a graph.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Add a MAINTENANCE mode (technician opens the machine). Walk the change."'>
          <p>One new class: <C>MaintenanceState implements VendingState</C> — it rejects all customer events
            ("out of service") and exposes technician actions (restock, empty cash). The context gains a way to
            enter it (a keyed switch → <C>setState(maintenance)</C>) and the technician\'s "close" transitions
            back to IDLE or SOLD_OUT. Crucially: <em>zero existing states change</em>. Contrast that with the
            switch-grid version, where MAINTENANCE means new cases in all four event methods. This additivity
            is the entire reason you picked the State pattern — make sure to say so.</p>
        </Reveal>
        <Reveal summary='Q: "Two people use the machine concurrently. Is your design safe?"'>
          <p>A single physical machine is inherently single-user at the hardware (one coin slot, one product
            chute), so the realistic answer is: serialize access — the machine processes one transaction at a
            time, and concurrent button presses queue or are rejected while DISPENSING. If you must handle
            concurrent <em>method calls</em> (e.g. a software simulation), guard the context\'s state
            transitions with synchronization, because <C>state.event(this)</C> reads and mutates shared
            context data — the same check-then-act race as Day 21. Name the race; don\'t hand-wave it.</p>
        </Reveal>
        <Reveal summary='Q: "Where do you persist state if the machine reboots mid-transaction?"'>
          <p>The CONTEXT is what you persist (balance, selected item, inventory, coin reserve, current state
            name) — because that\'s where all the data lives. On reboot, reconstruct the context and
            <C> setState(stateFor(savedStateName))</C>. This is exactly why data-in-context / behaviour-in-states
            matters: states are stateless code you can recreate; only the context needs saving. A mid-dispense
            crash is a business policy (refund on reboot? complete the drop?) — ask which.</p>
        </Reveal>
        <Reveal summary='Q: "Isn&apos;t one class per state a lot of boilerplate? When is an enum-with-behaviour enough?"'>
          <p>Honest answer: yes, and for a SMALL machine an <C>enum VendingState</C> with abstract methods per
            constant (Java enums can have per-constant method bodies — Day 19) is a lovely middle rung — it
            keeps each state\'s behaviour together without four separate files. Full classes win when states
            need their own fields/dependencies, get unit-tested in isolation, or are numerous. The senior move
            is knowing both and picking by size: enum-with-behaviour for ~4 simple states, classes when they
            grow. (This also nicely echoes Day 46\'s "I\'d climb when behaviour multiplies.")</p>
        </Reveal>
        <Reveal summary='Q: "How do you unit-test this?"'>
          <p>Two layers. State classes: instantiate one, pass a mock/real context, fire an event, assert it
            called the right context methods and transitioned correctly — e.g. <C>idle.selectItem(ctx, "A1")</C>
            displays "insert money first" and does NOT change state. Context flows: drive a real machine through
            a scenario (insert, select, dispense) and assert balance/stock/state after each step. Because
            states are stateless and the context is plain data, both are trivial — no time, no threads, like
            every testable design this month.</p>
        </Reveal>
        <Reveal summary='Q: "Could you model this with the elevator&apos;s enum-and-guards instead? Why didn&apos;t you?"'>
          <p>You could, but it fights you: the elevator\'s states differ mostly in which transitions are
            <em> legal</em> (guards), while the vending machine\'s states differ in what every event
            <em> does</em> (behaviour). Enum-and-guards centralizes behaviour in the context (good when there\'s
            little of it); the State pattern distributes it into cohesive per-state classes (good when there\'s
            a lot). Picking the rung by "how much per-state behaviour exists" — and being able to articulate
            that — is the actual skill Day 34\'s ladder was teaching.</p>
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
        <strong>Day 48 complete?</strong> Homework: build the machine with the State pattern — the
        <C> VendingState</C> interface, all four state classes (Idle/HasMoney/Dispensing/SoldOut), a
        <C> VendingMachine</C> context holding balance/inventory/coin reserve, and a <C>makeChange()</C> that
        returns <C>Optional</C> and refunds when it can\'t. Prove it: write tests that (a) selecting in IDLE is
        refused, (b) buying the last item flips to SOLD_OUT, (c) "exact change only" refunds instead of
        short-changing. Stretch: add a MAINTENANCE state and confirm NO existing state class changed.
        <br /><br />
        Next: <strong>Day 49 — Logging Framework</strong>: Chain of Responsibility for log levels, pluggable
        appenders (console/file/network), and how the framework you use every day is built — the last new
        problem before Week 10\'s drill.
      </div>
    </div>
  )
}
