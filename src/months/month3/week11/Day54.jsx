import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the ATM state machine ============ */
function ATMSim() {
  const [phase, setPhase] = useState('idle')   // idle | card | menu | withdraw | dispensing
  const [tries, setTries] = useState(0)
  const [balance, setBalance] = useState(10000)
  const [log, setLog] = useState('🟢 IDLE — insert your card to begin.')

  function insertCard() {
    setPhase('card'); setTries(0)
    setLog('💳 card read → CARD_INSERTED. Enter your PIN (the keypad now means "PIN digits", nothing else).')
  }
  function pin(correct) {
    if (correct) { setPhase('menu'); setLog('🔓 PIN ok → AUTHENTICATED. Choose a transaction.') }
    else {
      const t = tries + 1
      setTries(t)
      if (t >= 3) { setPhase('idle'); setLog('🚫 3rd wrong PIN → card RETAINED, back to IDLE. The state machine enforces the strike limit, not scattered ifs.') }
      else setLog(`❌ wrong PIN (${t}/3). Still CARD_INSERTED. ${3 - t} attempt(s) left.`)
    }
  }
  function withdraw(amt) {
    if (amt > balance) { setLog(`⛔ ₹${amt} > balance ₹${balance} → declined. Back to the menu, account untouched.`); return }
    setPhase('dispensing')
    setLog(`⏳ DISPENSING ₹${amt}… (debit + dispense as ONE transaction — §8)`)
    setTimeout(() => {
      setBalance((b) => b - amt)
      setPhase('menu')
      setLog(`💵 dispensed ₹${amt} → balance ₹${balance - amt}. Back to the menu.`)
    }, 600)
  }

  const btn = (label, onClick, ghost) => (
    <button className={ghost ? 'ghost act' : 'act'} style={{ fontSize: 12 }} onClick={onClick}>{label}</button>
  )

  return (
    <div className="panel">
      <div className="ptitle">Live demo · a working ATM — the SAME machine, but each state allows different actions</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {['idle', 'card', 'menu', 'withdraw', 'dispensing'].map((s) => (
          <span key={s} className="chip" style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11,
            background: s === phase ? '#FFF1D6' : '#fff',
            outline: s === phase ? '2px solid var(--amber)' : 'none', fontWeight: s === phase ? 700 : 400,
          }}>{s === phase ? '▶ ' : ''}{s.toUpperCase()}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, minHeight: 32 }}>
        {phase === 'idle' && btn('💳 insert card', insertCard)}
        {phase === 'card' && (<>{btn('enter correct PIN', () => pin(true))}{btn('enter wrong PIN', () => pin(false), true)}{btn('eject card', () => { setPhase('idle'); setLog('↩️ card ejected → IDLE.') }, true)}</>)}
        {phase === 'menu' && (<>{btn('withdraw', () => { setPhase('withdraw'); setLog('Choose an amount.') })}{btn('check balance', () => setLog(`💰 balance: ₹${balance}. (read-only — still AUTHENTICATED)`), true)}{btn('eject card', () => { setPhase('idle'); setLog('↩️ card ejected → IDLE. Always end clean.') }, true)}</>)}
        {phase === 'withdraw' && (<>{[500, 2000, 5000, 12000].map((a) => <span key={a}>{btn(`₹${a}`, () => withdraw(a))}</span>)}{btn('back', () => { setPhase('menu'); setLog('Back to the menu.') }, true)}</>)}
        {phase === 'dispensing' && <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5' }}>…dispensing (no other action accepted)…</span>}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        <span style={{ fontSize: 12.5 }}>{log}</span>
      </div>
      <Good style={{ marginTop: 10 }}><span style={{ fontSize: 12.5 }}>Try the illegal moves you can\'t even SEE: there is no "withdraw" button in IDLE or CARD_INSERTED, because those states don\'t offer it. Each state exposes only its legal actions — that\'s the State pattern (Day 48) guarding the flow, not a pile of if-checks.</span></Good>
    </div>
  )
}

/* ============ Interactive 2: the cash dispenser ============ */
const DENOMS = [2000, 500, 100]

function dispense(amount, inv) {
  const give = {}
  let rem = amount
  for (const d of DENOMS) {
    const use = Math.min(Math.floor(rem / d), inv[d])
    if (use > 0) { give[d] = use; rem -= use * d }
  }
  return rem === 0 ? give : null     // null = cannot dispense exactly with this inventory
}

function CashDispenser() {
  const [amount, setAmount] = useState(3700)
  const [inv, setInv] = useState({ 2000: 5, 500: 10, 100: 20 })
  const result = dispense(amount, inv)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · which notes does the ATM hand out? — greedy over denominations, limited by inventory</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>amount</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => setAmount((a) => Math.max(0, a - 100))}>−100</button>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 18, fontWeight: 700, width: 70, textAlign: 'center' }}>₹{amount}</span>
            <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => setAmount((a) => a + 100)}>+100</button>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>ATM note inventory</div>
          {DENOMS.map((d) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, width: 48 }}>₹{d} ×</span>
              <button className="ghost act" style={{ padding: '1px 7px' }} onClick={() => setInv((x) => ({ ...x, [d]: Math.max(0, x[d] - 1) }))}>−</button>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, width: 24, textAlign: 'center' }}>{inv[d]}</span>
              <button className="ghost act" style={{ padding: '1px 7px' }} onClick={() => setInv((x) => ({ ...x, [d]: x[d] + 1 }))}>+</button>
            </div>
          ))}
        </div>
      </div>
      <div className="statbar" style={{ display: 'block', background: result ? '#EAF7EF' : '#FDECEC' }}>
        {result
          ? <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>✅ dispense ₹{amount} = {Object.entries(result).map(([d, n]) => `${n}×₹${d}`).join(' + ') || 'nothing'}</span>
          : <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>❌ CANNOT dispense ₹{amount} with this inventory. The ATM must REFUSE before debiting — never short-change. (Try: empty the ₹100 tray, then ask for ₹300.)</span>}
      </div>
      <Note style={{ marginTop: 8 }}><span style={{ fontSize: 12.5 }}>Greedy (biggest note first) works for standard currency denominations and is the same shape as Day 48\'s change-making — but with INVENTORY limits it can fail, so feasibility must be checked BEFORE any money moves.</span></Note>
    </div>
  )
}

/* ============ Interactive 3: transaction atomicity ============ */
const FAILURES = {
  none: 'everything works',
  nsf: 'account has insufficient funds',
  atm_empty: 'ATM cannot dispense (no notes)',
  jam: 'dispenser JAMS mid-dispense',
}

function AtomicitySim() {
  const [fail, setFail] = useState('none')
  const [ran, setRan] = useState(false)
  const amount = 3000
  const startBal = 10000, startCash = 50000

  let steps = []
  let finalBal = startBal, finalCash = startCash, ok = false
  if (fail === 'nsf') {
    steps = [
      '① validate: amount ₹3000 ≤ balance? balance is ₹2000 → NO',
      '✋ REFUSE up front — no debit, no dispense. Account & ATM untouched.',
    ]
    finalBal = 2000
  } else if (fail === 'atm_empty') {
    steps = [
      '① validate: amount ≤ balance ✓ AND ATM can dispense ₹3000? → NO (no notes)',
      '✋ REFUSE up front — no debit, no dispense. Account & ATM untouched.',
    ]
  } else if (fail === 'jam') {
    steps = [
      '① validate: balance ✓, dispensable ✓',
      '② debit account: ₹10000 → ₹7000 (tentative, inside the transaction)',
      '③ dispense ₹3000 → 💥 DISPENSER JAMS',
      '④ ROLLBACK the debit: ₹7000 → ₹10000. The transaction failed atomically.',
      '✅ result: account ₹10000, ATM cash unchanged. Not a single rupee lost.',
    ]
    finalBal = startBal; finalCash = startCash
  } else {
    steps = [
      '① validate: balance ✓, dispensable ✓',
      '② debit account: ₹10000 → ₹7000',
      '③ dispense ₹3000 (notes leave the tray)',
      '④ COMMIT: both succeeded together.',
      '✅ result: account ₹7000, ATM cash ₹47000. Debit and dispense moved as ONE unit.',
    ]
    finalBal = 7000; finalCash = 47000; ok = true
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · withdraw ₹3000 = debit account + dispense cash as ONE transaction</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {Object.entries(FAILURES).map(([k, v]) => (
          <button key={k} className={fail === k ? 'on' : ''} style={{ fontSize: 11.5 }} onClick={() => { setFail(k); setRan(false) }}>{v}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className="act" onClick={() => setRan(true)}>▶ run withdrawal</button>
        <button className="ghost act" onClick={() => setRan(false)}>reset</button>
      </div>
      {ran && (
        <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 12, padding: '2px 0',
              color: s.includes('💥') ? 'var(--red)' : s.includes('ROLLBACK') ? 'var(--amber)' : s.includes('✅') ? 'var(--green)' : 'var(--ink)',
              fontWeight: s.includes('✅') || s.includes('💥') ? 700 : 400,
            }}>{s}</div>
          ))}
        </div>
      )}
      <div className="statbar" style={{ display: 'block', background: ran ? (ok ? '#EAF7EF' : '#FFF1D6') : undefined }}>
        <span style={{ fontSize: 12.5 }}>
          {ran
            ? <>Final: account <b>₹{finalBal}</b>, ATM cash <b>₹{finalCash}</b>. {ok ? 'Success — both sides moved together.' : 'No partial state: the account is never debited unless the cash truly left the tray.'}</>
            : <>Pick a failure mode and run it. The rule that must NEVER break: the account is debited if and only if the cash is dispensed.</>}
        </span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'An ATM and a vending machine (Day 48) are both flagship problems for which pattern, and why?',
    o: ['Singleton — there is one ATM', 'Strategy — they swap algorithms', 'Observer — they notify users', 'State pattern: the SAME inputs (keypad, card, buttons) mean different things in each state, and every state gives every event a different answer — so one class per state beats a giant switch (Day 48)'], a: 3,
    e: 'Insert-card, enter-PIN, select-transaction — each is only legal in certain states, and the meaning of "OK" changes per state. That per-state behaviour is exactly when the State pattern earns its keep, just like the vending machine.',
    w: { 0: 'Oneness is incidental and is wiring (Day 21), not the core modeling.',
         1: 'Cash-dispensing is a strategy-ish sub-part, but the overall structure is a state machine.',
         2: 'Observer is about notifying subscribers, not modeling modes.' },
    r: { id: 's3', label: 'Section 3 — the state machine' } },
  { q: 'In the AUTHENTICATED state, who decides that "withdraw" is allowed but "enter PIN" is not?',
    o: ['The bank server', 'A central switch in the ATM controller', 'The state object itself: each state exposes/handles only its legal actions and names its successor — so illegal actions are refused BY the state, with no scattered if-checks in the controller', 'The keypad hardware'], a: 2,
    e: 'The State pattern puts each state\'s legal actions and transitions inside that state class. AUTHENTICATED offers transactions; CARD_INSERTED offers PIN entry. The controller just forwards the event to the current state.',
    w: { 0: 'The bank authorizes accounts; it doesn\'t drive the ATM\'s UI state.',
         1: 'A central switch is the switch-grid disease the State pattern cures (Day 48).',
         3: 'Hardware reads keys; it doesn\'t know which actions are legal in which state.' },
    r: { id: 's3', label: 'Section 3 — states own transitions' } },
  { q: 'Why model CardReader, CashDispenser, Keypad, and Screen as interfaces (ports)?',
    o: ['Java requires interfaces', 'Dependency inversion (Day 15): the ATM logic depends on abstractions, so real hardware drivers OR fakes can be injected — making the entire flow testable without a physical machine', 'To hide the hardware from the bank', 'Interfaces are faster'], a: 1,
    e: 'Hardware behind ports means tests inject a FakeCashDispenser (that can simulate a jam) and a fake keypad — you verify the whole PIN/withdraw flow with no real ATM. Same ports-and-adapters move as payment gateways.',
    w: { 0: 'Nothing requires it; it\'s a testability/DIP choice.',
         2: 'The point is swappable drivers + fakes, not hiding from the bank.',
         3: 'Indirection doesn\'t speed up hardware I/O.' },
    r: { id: 's5', label: 'Section 5 — hardware behind ports' } },
  { q: 'Dispensing ₹3700 from {₹2000, ₹500, ₹100} notes is fundamentally…',
    o: ['Impossible without exact notes', 'A sorting problem', 'A unique problem', 'The change-making problem again (Day 48): greedy biggest-note-first works for standard denominations, but with INVENTORY limits it can fail — so feasibility must be checked before any money moves'], a: 3,
    e: 'Selecting notes for an amount is denomination change-making with limited stock. Greedy (largest first) suits real currency, but a depleted tray can make an amount undeliverable — which must be detected up front.',
    w: { 0: 'Many amounts ARE dispensable; the issue is checking feasibility, not impossibility.',
         1: 'Sorting denominations is a step, not the problem.',
         2: 'It\'s the same shape as vending-machine change (Day 48), not new.' },
    r: { id: 's6', label: 'Section 6 — cash dispensing' } },
  { q: 'The ATM can\'t make the requested amount with its current notes. Correct behavior?',
    o: ['Refuse the withdrawal up front (before any debit) and tell the user — never debit the account or hand out a different amount than requested', 'Round down to the nearest ₹500', 'Debit anyway and owe the user', 'Dispense the closest amount it can'], a: 0,
    e: 'Feasibility is a pre-condition. If the inventory can\'t form the exact amount, the transaction is rejected before touching the account — the user gets a clear message, not a surprise amount or a phantom debit.',
    w: { 1: 'Silently changing the amount cheats the user\'s intent.',
         2: 'Debiting without dispensing is the cardinal ATM sin — money lost.',
         3: 'Handing out a different amount than requested is a correctness and trust failure.' },
    r: { id: 's6', label: 'Section 6 — refuse, don\'t short-change' } },
  { q: 'A withdrawal touches the account balance AND the ATM cash inventory. The non-negotiable rule?',
    o: ['Debit first, dispense whenever', 'They must change together or not at all (atomicity): the account is debited IF AND ONLY IF the cash is dispensed — if dispensing fails after a debit, roll the debit back', 'Keep them independent for speed', 'Dispense first, debit later'], a: 1,
    e: 'A withdrawal is one transaction spanning two systems. Either both effects happen or neither. A debit without a dispense steals from the user; a dispense without a debit loses the bank\'s money — both are unacceptable.',
    w: { 0: 'Debit-then-maybe-dispense risks debiting without dispensing (a jam).',
         2: 'Independence is exactly what causes lost money — they must be coupled.',
         3: 'Dispense-then-maybe-debit risks giving cash for free.' },
    r: { id: 's8', label: 'Section 8 — transaction atomicity' } },
  { q: 'The dispenser JAMS after the account was already debited. What must happen?',
    o: ['Roll back the debit so the balance is restored — the failed dispense means the transaction did not complete, and the account must reflect that no cash left', 'Keep the debit — it is the bank\'s policy', 'Retry forever', 'Charge a jam fee'], a: 0,
    e: 'A jam after debit is the classic partial-failure. The transaction failed, so its tentative debit is reversed and the balance returns to its pre-withdrawal value. No cash left the tray, so no money should leave the account.',
    w: { 1: 'Keeping a debit for undelivered cash robs the customer.',
         2: 'Blind infinite retries can double-dispense or hang; reverse and report.',
         3: '🙂 The user did nothing wrong — restore their money.' },
    r: { id: 's8', label: 'Section 8 — rollback on failure' } },
  { q: 'Three wrong PINs in a row should…',
    o: ['Let the user keep trying', 'Lower the withdrawal limit', 'Trigger a state transition to a terminal/locked outcome (retain card or block, → IDLE) — the strike limit is a guarded transition in the state machine, not an ad-hoc counter check sprinkled in the controller', 'Email the user'], a: 2,
    e: 'The attempt limit is part of the CARD_INSERTED state\'s behaviour: count attempts, and on the third failure transition to card-retained/IDLE. Keeping it inside the state keeps the security rule cohesive and testable.',
    w: { 0: 'Unlimited PIN attempts is a brute-force hole.',
         1: 'The response to bad PINs is lockout/retention, not a limit change.',
         3: 'Email is a side effect, not the security transition.' },
    r: { id: 's3', label: 'Section 3 — guarded transitions' } },
]

/* ============ The page ============ */
export default function Day54() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 11 · Day 54 · Classic LLD Problems</div>
        <h1>ATM:<br />The State Machine That Hands You Cash</h1>
        <p>An ATM is the State pattern\'s other flagship (alongside the vending machine) — and it adds two things
           with real stakes: a cash-dispensing problem (which notes to give from a limited tray) and
           transactions that must NEVER lose a rupee. Card → PIN → select → dispense, where every step is a
           state and every withdrawal is atomic. Click everything.</p>
        <div className="chips">
          {['ATM', 'State pattern', 'PIN & security', 'cash dispensing', 'transaction atomicity', 'hardware ports'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What an ATM must never get wrong</h2>
        <p>The flow is familiar: insert card, enter PIN, pick a transaction, take your cash. Underneath, two
          things must be airtight — and they map to two ideas from earlier weeks:</p>
        <Code html={`  THE ATM, AND ITS TWO NON-NEGOTIABLES

  insert card → enter PIN → select txn → withdraw → dispense → eject

       ▲ STATE CORRECTNESS                    ▲ MONEY ATOMICITY
       each step is a state; an action is     a withdrawal touches the ACCOUNT
       only legal in the right state, and     and the ATM CASH — both change
       the PIN strike limit is a guarded      together or NEITHER does. Never
       transition (State pattern, Day 48)     debit without dispensing, ever.

  Plus a familiar sub-problem: choosing which NOTES to dispense from a
  limited tray — change-making again (Day 48), now with banknotes.`} />
        <Note><strong>The shape, recognized:</strong> ATM = the State pattern (the flow) + an atomic
          transaction (the money) + change-making (the notes). Two of those three you already built on Day 48;
          today adds the atomicity that makes it a <em>money</em> machine, not a snack machine.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The clarifying questions</h2>
        <table className="matrix">
          <thead>
            <tr><th>question</th><th>typical answer</th><th>what it shapes</th></tr>
          </thead>
          <tbody>
            <tr><td>"Which transactions?"</td><td>"Withdraw, balance, maybe deposit"</td><td>the menu / transaction states</td></tr>
            <tr><td>"PIN attempt limit?"</td><td>"3 strikes → retain card"</td><td>guarded transition in CARD_INSERTED</td></tr>
            <tr><td>"What note denominations?"</td><td>"₹2000, ₹500, ₹100"</td><td>the cash-dispensing problem</td></tr>
            <tr><td>"What if dispensing fails mid-way?"</td><td>"Customer must not be debited"</td><td>transaction atomicity / rollback</td></tr>
            <tr><td>"Talk to a real bank backend?"</td><td>"Assume a Bank service exists"</td><td>BankService port (DIP)</td></tr>
            <tr><td>"Model the hardware?"</td><td>"Abstract it — must be testable"</td><td>CardReader/Dispenser/Keypad ports</td></tr>
          </tbody>
        </table>
        <p>Noun-verb survivors: <em>ATM, Card, Account, Transaction, CashDispenser, CardReader, Keypad, Screen,
          BankService, state classes</em>. Filtered (Day 10): <em>"the user"</em> is external, <em>"money"</em>
          is a <C>Money</C> value + note inventory, <em>"the bank"</em> is a port, not an entity you build.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The state machine (the State pattern, second flagship)</h2>
        <p>Like the vending machine (Day 48), the same inputs mean different things in different states — so it\'s
          one class per state, each owning its legal actions and naming its successors:</p>
        <Code html={`  ATM STATE MACHINE

   IDLE ──insert card──▶ CARD_INSERTED ──PIN ok──▶ AUTHENTICATED
    ▲                       │  │ wrong PIN              │   │
    │ eject / retain        │  └──(3 strikes)──────────┼───┘ retain card
    │                       │                          │
    │                       ▼                          ▼  select txn
    └──────────────── (card retained) ◀──────  SELECTING ──▶ WITHDRAW ──▶ DISPENSING
                                                   │  ▲                       │
                                       balance ◀───┘  └───────────────────────┘
                                                          back to menu / eject

  · each state exposes only its legal actions (no "withdraw" in IDLE)
  · the 3-strike PIN limit is a GUARDED transition inside CARD_INSERTED
  · DISPENSING accepts no input until the transaction resolves`} />
        <Code html={`<span class="kw">public interface</span> ATMState {                       <span class="cm">// every state answers every event (Day 48)</span>
    <span class="kw">void</span> insertCard(ATM atm, Card card);
    <span class="kw">void</span> enterPin(ATM atm, String pin);
    <span class="kw">void</span> selectTransaction(ATM atm, TxnType type);
    <span class="kw">void</span> eject(ATM atm);
}

<span class="kw">public class</span> CardInsertedState <span class="kw">implements</span> ATMState {
    <span class="kw">public void</span> enterPin(ATM atm, String pin) {
        <span class="kw">if</span> (atm.bank().verifyPin(atm.card(), pin)) {
            atm.setState(atm.authenticated());            <span class="cm">// ← names its successor</span>
        } <span class="kw">else if</span> (atm.recordFailedPin() &gt;= <span class="num">3</span>) {     <span class="cm">// guarded transition…</span>
            atm.retainCard();
            atm.setState(atm.idle());                     <span class="cm">// 3 strikes → card retained → IDLE</span>
        } <span class="kw">else</span> {
            atm.screen().show(<span class="str">"wrong PIN, try again"</span>);    <span class="cm">// stay in CARD_INSERTED</span>
        }
    }
    <span class="kw">public void</span> selectTransaction(ATM atm, TxnType t) { atm.screen().show(<span class="str">"enter PIN first"</span>); }
    <span class="cm">// …every other event handled (refused) here too</span>
}`} />
        <Good><strong>Data in the context, behaviour in the states</strong> (Day 48 discipline): the ATM context
          holds the inserted card, the failed-PIN count, the screen/dispenser ports; the state classes hold the
          behaviour and transitions. The controller never has a <C>switch(state)</C> — it just forwards events
          to <C>currentState</C>.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🏧 Play: the ATM</h2>
        <p>A working flow. The correct PIN is "correct" (use the buttons); try three wrong PINs and watch the
          card get retained:</p>
        <ATMSim />
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The hardware behind ports (so it\'s testable)</h2>
        <p>An ATM is full of hardware — but the LOGIC shouldn\'t depend on real devices. Put each behind an
          interface (Day 15) and you can inject fakes, including one that simulates a jam:</p>
        <Code html={`<span class="kw">public interface</span> CardReader   { Card read(); <span class="kw">void</span> eject(); <span class="kw">void</span> retain(); }
<span class="kw">public interface</span> Keypad       { String readPin(); <span class="kw">int</span> readAmount(); }
<span class="kw">public interface</span> Screen       { <span class="kw">void</span> show(String message); }
<span class="kw">public interface</span> CashDispenser{ <span class="kw">void</span> dispense(Map&lt;Integer, Integer&gt; notes); <span class="kw">boolean</span> canDispense(<span class="kw">int</span> amount); }
<span class="kw">public interface</span> BankService  { <span class="kw">boolean</span> verifyPin(Card c, String pin); <span class="kw">void</span> debit(Account a, Money m); <span class="kw">void</span> credit(Account a, Money m); }

<span class="kw">public class</span> ATM {
    <span class="kw">private</span> ATMState state;
    <span class="kw">private final</span> CardReader reader;       <span class="cm">// all injected at the composition root…</span>
    <span class="kw">private final</span> CashDispenser dispenser;
    <span class="kw">private final</span> BankService bank;          <span class="cm">// …so tests inject fakes (FakeDispenser can "jam")</span>
    <span class="cm">// + screen, keypad, inserted card, failed-PIN count (the context's data)</span>
}`} />
        <Note><strong>The payoff is testability.</strong> Inject a <C>FakeCashDispenser</C> that throws on
          <C> dispense()</C> and you can test the jam-rollback path (§8) with no hardware. Inject a fake
          <C> BankService</C> and you test the whole PIN/withdraw flow deterministically. Same ports-and-adapters
          move as BookMyShow\'s payment gateway (Day 52) — hardware is just another external dependency.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The cash-dispensing problem (change-making, with banknotes)</h2>
        <p>"Give me ₹3700" becomes "which notes, from a limited tray?" — the same change-making problem as the
          vending machine (Day 48), now over denominations with inventory:</p>
        <Code html={`<span class="kw">public</span> Optional&lt;Map&lt;Integer, Integer&gt;&gt; selectNotes(<span class="kw">int</span> amount) {   <span class="cm">// greedy, biggest note first</span>
    Map&lt;Integer, Integer&gt; give = <span class="kw">new</span> LinkedHashMap&lt;&gt;();
    <span class="kw">int</span> rem = amount;
    <span class="kw">for</span> (<span class="kw">int</span> note : List.of(<span class="num">2000</span>, <span class="num">500</span>, <span class="num">100</span>)) {        <span class="cm">// denominations, descending</span>
        <span class="kw">int</span> use = Math.min(rem / note, inventory.count(note));   <span class="cm">// limited by what's in the tray</span>
        <span class="kw">if</span> (use &gt; <span class="num">0</span>) { give.put(note, use); rem -= use * note; }
    }
    <span class="kw">return</span> rem == <span class="num">0</span> ? Optional.of(give) : Optional.empty();   <span class="cm">// empty = can't form this amount</span>
}`} />
        <Warn><strong>Check feasibility BEFORE moving any money.</strong> A depleted tray can make an amount
          undeliverable (no ₹100s left, asked for ₹300). The ATM must <C>canDispense(amount)</C> first and
          refuse the whole withdrawal up front — never debit the account and then discover it can\'t hand out the
          cash, and never substitute a different amount. (Greedy suits standard currency; like Day 48, it can be
          suboptimal for pathological denomination sets — note that and move on.)</Warn>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>💵 Play: the cash dispenser</h2>
        <p>Pick an amount and adjust the tray. Watch greedy note selection — and watch it refuse when the
          inventory can\'t form the amount:</p>
        <CashDispenser />
        <Good><strong>What you should notice:</strong> ① Greedy hands out the fewest notes (biggest first).
          ② Empty the ₹100 tray and ask for ₹300 — it can\'t be formed from ₹2000/₹500, so the ATM refuses.
          ③ Refusal happens at note-selection time, BEFORE any debit — feasibility is a pre-condition of the
          transaction.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Transaction atomicity: never lose a rupee</h2>
        <p>This is what makes an ATM different from a vending machine: a withdrawal spans <strong>two</strong>
          systems — the bank account and the ATM\'s cash. They must move together or not at all:</p>
        <Code html={`  WITHDRAW = ONE TRANSACTION OVER TWO SYSTEMS

  ① validate:  amount ≤ balance  AND  dispenser.canDispense(amount)   ← fail here = no changes
  ② debit account (tentative, inside the transaction)
  ③ dispense the notes
  ④ commit  ── both succeeded → done
            ── ③ failed (jam)? → ROLLBACK the debit → balance restored

  THE INVARIANT:  account is debited  ⟺  cash is dispensed
  · debit without dispense  = stole from the customer
  · dispense without debit  = gave away the bank's money
  Both are unacceptable, so the two effects are bound into one atomic unit.`} />
        <Code html={`<span class="kw">public</span> Result withdraw(Account account, <span class="kw">int</span> amount) {
    <span class="kw">if</span> (account.balance().lessThan(Money.of(amount))) <span class="kw">return</span> DECLINED_NSF;     <span class="cm">// ① pre-checks…</span>
    <span class="kw">if</span> (!dispenser.canDispense(amount))               <span class="kw">return</span> DECLINED_NO_CASH;  <span class="cm">//    …before any change</span>

    bank.debit(account, Money.of(amount));            <span class="cm">// ② tentative debit</span>
    <span class="kw">try</span> {
        dispenser.dispense(selectNotes(amount).get()); <span class="cm">// ③ hand out the cash</span>
    } <span class="kw">catch</span> (DispenseException jam) {
        bank.credit(account, Money.of(amount));        <span class="cm">// ④ ROLLBACK — restore the balance</span>
        <span class="kw">return</span> FAILED_DISPENSE;
    }
    <span class="kw">return</span> SUCCESS;                                   <span class="cm">// both happened — committed</span>
}`} />
        <Warn><strong>Order and rollback are the whole point.</strong> Validate everything first (so most
          failures happen before any state changes), and if the dispense fails after the debit, reverse the
          debit. In a real system this is a proper transaction with the bank (with idempotency so a retry after
          a network blip doesn\'t double-debit) — the same "what failure am I protecting against?" reasoning as
          BookMyShow\'s save-before-charge (Day 52).</Warn>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>⚖️ Play: transaction atomicity</h2>
        <p>Run a ₹3000 withdrawal under four conditions and watch the account + ATM cash stay consistent in
          every one:</p>
        <AtomicitySim />
        <Good><strong>What you should notice:</strong> ① NSF and empty-tray fail at validation — nothing moves.
          ② The jam fails AFTER the debit, so the debit is rolled back and the balance is restored. ③ In every
          outcome, the account is debited if and only if the cash was dispensed — the invariant never breaks.
          That consistency, not the happy path, is what the design is really for.</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>A giant switch(state).</strong> The switch-grid disease (Day 48) — one new state edits
          every event method. One class per state; states own their transitions.</Warn>
        <Warn><strong>Debit then dispense with no rollback.</strong> A jam after debit leaves the customer
          robbed. Validate first; if dispense fails after debit, reverse it. Account ⟺ cash, always.</Warn>
        <Warn><strong>Dispensing before checking feasibility.</strong> Debiting then discovering the tray can\'t
          form the amount. <C>canDispense(amount)</C> is a pre-condition — refuse up front.</Warn>
        <Warn><strong>Unlimited PIN attempts.</strong> No strike limit is a brute-force hole. The 3-strike
          lockout is a guarded transition in CARD_INSERTED, not an afterthought.</Warn>
        <Warn><strong>Hardware hardcoded into the logic.</strong> <C>new RealDispenser()</C> inside the ATM
          makes the jam path untestable. Ports + injected fakes (one that simulates a jam).</Warn>
        <Warn><strong>double for money.</strong> Day 20, still true — balances and amounts are <C>Money</C>;
          note math is in whole rupees/denominations. Floats lose money at scale.</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>State pattern (Day 48), second flagship:</strong> IDLE → CARD_INSERTED → AUTHENTICATED → SELECTING → WITHDRAW → DISPENSING. One class per state; each exposes only its legal actions and names its successor; no switch(state).</li>
          <li><strong>Data in context, behaviour in states:</strong> the ATM holds card, failed-PIN count, and the hardware ports; state classes hold the transitions.</li>
          <li><strong>Security:</strong> 3-strike PIN limit = a guarded transition in CARD_INSERTED → retain card → IDLE.</li>
          <li><strong>Hardware = ports (Day 15):</strong> CardReader, CashDispenser, Keypad, Screen, BankService as interfaces → inject real drivers or fakes (a jam-simulating dispenser) → fully testable.</li>
          <li><strong>Cash dispensing = change-making (Day 48):</strong> greedy biggest-note-first over denominations, limited by inventory; <C>canDispense()</C> feasibility check BEFORE any money moves; refuse, never short-change.</li>
          <li><strong>Atomicity (the core):</strong> withdraw = debit account + dispense cash as ONE unit. Validate first; debit ⟺ dispense; roll back the debit if the dispense fails. Idempotent against retries.</li>
          <li><strong>Money is Money</strong> (Day 20); note counts are integers.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "ATM vs vending machine — same pattern, so what is genuinely different?"'>
          <p>Both are State-pattern machines with a change-making sub-problem, so the structure rhymes. The
            genuine additions in the ATM are: (1) atomicity across TWO systems (bank account + cash tray) —
            a vending machine only moves its own coins, while an ATM must keep an external account in sync;
            (2) security (PIN, strike limit, card retention); and (3) the money stakes — a vending bug loses a
            chocolate, an ATM bug loses real rupees and trust. So: same skeleton, but the transaction and
            security layers are where the ATM earns its difficulty.</p>
        </Reveal>
        <Reveal summary='Q: "The network to the bank drops mid-withdrawal. What happens?"'>
          <p>This is the partial-failure case the atomicity design exists for. If the debit request times out,
            you do NOT know whether the bank applied it — so you must NOT dispense (dispensing on an uncertain
            debit risks free cash). On reconnection, reconcile: query the transaction by an idempotency id to
            learn whether the debit committed, then either complete (dispense / mark done) or reverse. The keys
            are: an idempotency id per withdrawal (so retries don\'t double-debit) and a reconciliation step.
            "Don\'t dispense on an uncertain debit, reconcile by idempotency id" is the answer.</p>
        </Reveal>
        <Reveal summary='Q: "Two ATMs, same account, simultaneous withdrawals. Race?"'>
          <p>Yes — classic check-then-act (Day 21) on the account balance: both read ₹10000, both approve
            ₹8000, both dispense → overdrawn. The balance must be debited atomically at the AUTHORITATIVE store
            (the bank), e.g. a conditional update "debit 8000 WHERE balance ≥ 8000" or a row lock — whichever
            ATM\'s debit lands second fails and that withdrawal is declined before dispensing. The ATM is just a
            client; the atomicity guarantee lives at the bank, exactly like seat-booking\'s atomic claim lived
            at the seat store (Day 52).</p>
        </Reveal>
        <Reveal summary='Q: "How would you unit-test the jam-rollback without a real ATM?"'>
          <p>Inject a <C>FakeCashDispenser</C> whose <C>dispense()</C> throws a <C>DispenseException</C>, plus a
            fake <C>BankService</C> that tracks debit/credit calls. Run <C>withdraw(account, 3000)</C> and
            assert: the bank saw a debit of 3000 THEN a credit of 3000 (the rollback), the final balance equals
            the start, and the result is FAILED_DISPENSE. Because every device and the bank are ports, the
            entire money-safety contract is verifiable with fakes — no hardware, no flakiness. This is the whole
            reason §5 put hardware behind interfaces.</p>
        </Reveal>
        <Reveal summary='Q: "Add deposit. What changes in the state machine?"'>
          <p>A new transaction branch from SELECTING: a DEPOSIT state that accepts cash/cheque, validates it
            (note counting / cheque hold), and CREDITS the account — the mirror of withdraw, with its own
            atomicity (accept the cash into the tray AND credit the account, or neither). Structurally it\'s
            additive: a new state class + a new <C>TxnType</C>, no existing state changes — the State pattern
            payoff (Day 48). The interesting wrinkle to mention: deposited cash often isn\'t available
            immediately (a hold policy), which is a business rule, not a state-machine change.</p>
        </Reveal>
        <Reveal summary='Q: "Where does the idle/timeout behavior live — user walks away after entering PIN?"'>
          <p>A timeout is an event like any other, handled per state: AUTHENTICATED/SELECTING on a timeout
            event ejects the card and returns to IDLE (you never leave a session open on an unattended machine).
            Model it as a <C>timeout()</C> method on the state interface (or a scheduled event the context
            fires), so each state decides its timeout response — most go to "eject + IDLE", DISPENSING ignores
            it until the dispense resolves. Keeping timeout as a first-class event per state (not a global hack)
            is the clean answer, and it\'s the same "every state answers every event" discipline from Day 48.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s12">
        <div className="sec-label">Section 12 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 54 complete?</strong> Homework: build it — an <C>ATMState</C> interface with Idle /
        CardInserted / Authenticated / Dispensing classes (states name successors; CARD_INSERTED enforces the
        3-strike limit), hardware <C>ports</C> (CardReader, CashDispenser, Keypad, Screen, BankService) with
        fakes, a greedy <C>selectNotes()</C> returning <C>Optional</C>, and a <C>withdraw()</C> that validates
        first, debits, dispenses, and rolls back on a jam. Prove it: (a) three wrong PINs retains the card;
        (b) a <C>FakeCashDispenser</C> that jams leaves the balance unchanged; (c) emptying the ₹100 tray makes
        ₹300 be refused before any debit. Stretch: add an idempotency id so a retried withdraw never
        double-debits.
        <br /><br />
        Next: <strong>Day 55 — Week 11 Machine-Coding Drill</strong>: the timed dress rehearsal for the
        big-systems week — two fresh problems, the self-grading rubric, and the concurrency / atomicity / state
        patterns put under the clock.
      </div>
    </div>
  )
}
