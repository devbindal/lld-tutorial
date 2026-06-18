import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../components/ui.jsx'

function ReviewDrill({ items }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= items.length
  const cur = items[idx]
  function pick(i) { if (picked !== null) return; setPicked(i); if (i === cur.a) setScore((s) => s + 1) }
  return (
    <div className="panel">
      <div className="ptitle">Rapid review · recall the answer before you reveal it</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎯 Score: <b>{score} / {items.length}</b>. Anything you missed → reopen that day.</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Review again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 10 }}>🔁 <span>question {idx + 1} of {items.length} · score {score}</span></div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.q}</p>
          <div className="modbtns">
            {cur.o.map((o, i) => (
              <button key={i} className={picked !== null && i === cur.a ? 'on' : ''}
                style={{ fontSize: 12.5, ...(picked === i && i !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}) }}
                onClick={() => pick(i)}>{o}</button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ ' : '❌ '} <b>{cur.o[cur.a]}</b><br /><br />{cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={() => { setPicked(null); setIdx((i) => i + 1) }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const DRILL = [
  { q: 'BookMyShow: where does a seat\'s AVAILABLE/BOOKED status live?', o: ['On the physical Seat', 'On a ShowSeat(show, seat, status) — the same seat has different availability per show', 'On the Movie'], a: 1,
    why: 'Seat C4 is one piece of furniture, but "is C4 free?" has a different answer per show. Availability is per (show, seat) → a ShowSeat. Same lesson as Movie≠Show: the bookable thing is the screening, not the film.' },
  { q: 'Two users click the same free seat at the same instant. The fix?', o: ['Both get it', 'An ATOMIC claim — compareAndSet(AVAILABLE, HELD) / a conditional UPDATE — so exactly one wins; the loser is told instantly', 'First network packet wins'], a: 1,
    why: 'Naive read-then-write lets both see "free" before either writes = double booking (the recurring check-then-act race). Collapse check+set into one indivisible step. This race appears in BookMyShow, the ATM, and the wallet.' },
  { q: 'Splitwise: "what does Bob owe Alice?" should be…', o: ['A re-scan of every expense', 'A lookup of running NET balances (updated per expense), not a recomputation over the log', 'Asked of Alice'], a: 1,
    why: 'Balances are the core data structure — maintained incrementally as expenses are added. Adding an expense updates pairwise nets (excluding the payer\'s own share); "who owes whom" is an O(1) lookup.' },
  { q: 'Splitwise "settle up with fewest payments" is fundamentally…', o: ['Sorting', 'A min-cash-flow GRAPH problem: net everyone out, then greedily match biggest creditor ↔ biggest debtor (chains collapse, cycles cancel)', 'Impossible'], a: 1,
    why: 'Net each person, then match positives to negatives. A→B→C collapses to one A→C payment; a 3-cycle of equal debts nets to zero. Greedy is a near-optimal heuristic; the exact minimum is NP-hard — say so.' },
  { q: 'ATM withdrawal touches the account AND the cash tray. The non-negotiable rule?', o: ['Debit first, dispense whenever', 'Atomicity: the account is debited IF AND ONLY IF the cash is dispensed — if the dispenser jams after debit, ROLL BACK the debit', 'Keep them independent'], a: 1,
    why: 'A withdrawal is one transaction over two systems. Debit-without-dispense robs the customer; dispense-without-debit loses the bank\'s money. Validate first, then debit⟺dispense, with rollback on a jam.' },
  { q: 'A money operation times out and the client retries. Without protection…', o: ['Safe', 'It can DOUBLE-charge (the first try actually succeeded); fix with an IDEMPOTENCY KEY so a retry returns the original result', 'It is lost'], a: 1,
    why: 'A timed-out-but-succeeded request retried = a duplicate transfer/booking. An idempotency key recorded with the operation makes the retry a no-op. Essential for any booking/payment once retries exist.' },
]

const QUESTIONS = [
  { q: 'Week 11\'s unifying lesson?',
    o: ['Each big system is unique', 'They share one recurring problem — a contended resource or money claimed concurrently — solved by an ATOMIC claim, plus money correctness; BookMyShow, Splitwise, ATM are variations on it', 'They need new patterns', 'They are about UI'], a: 1,
    e: 'The big systems rhyme: two users one seat, two transfers one balance, two ATMs one account — all check-then-act on shared state. The atomic claim (Day 21) is the recurring fix; conserving money is the recurring invariant.',
    w: { 0: 'They share a deep structure.', 2: 'They reuse known tools.', 3: 'They\'re about concurrency/consistency.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'BookMyShow: the two entity splits that separate a clean design from a tangle?',
    o: ['None needed', 'Movie ≠ Show (the film vs a screening) and Seat ≠ ShowSeat (the physical seat vs its availability for one show) — booking attaches to a Show via ShowSeats', 'Just one big Booking class', 'Seat extends Show'], a: 1,
    e: 'The same seat has different availability per show, and the same film has many screenings. Modeling Show and ShowSeat as the bookable things (not Movie/Seat) is the #1 BookMyShow modeling decision.',
    w: { 0: 'These splits are the design.', 2: 'A god class loses the structure.', 3: 'A seat is not a kind of show.' },
    r: { id: 's2', label: 'Section 2 — BookMyShow' } },
  { q: 'BookMyShow: the seat lifecycle and why its expiry edge matters?',
    o: ['AVAILABLE → BOOKED only', 'AVAILABLE → HELD → BOOKED, with a TIMED HELD → AVAILABLE expiry — without it, abandoned checkouts leak seats forever (a "sold out" empty hall)', 'It never changes', 'BOOKED → AVAILABLE on a timer'], a: 1,
    e: 'The hold lets a user pay without losing the seat; the timed expiry (a sweeper or TTL) reclaims abandoned holds. The hold is acquired with an atomic compare-and-set; payment confirms HELD → BOOKED.',
    w: { 0: 'You need the HELD phase for the pay window.', 2: 'The timed edge is load-bearing.', 3: 'BOOKED is terminal (until cancel).' },
    r: { id: 's2', label: 'Section 2 — BookMyShow' } },
  { q: 'A user books 3 seats but one is taken. The booking should be…',
    o: ['Partial — hold the 2 it can', 'All-or-nothing: release the holds it acquired and fail cleanly; acquire seats in a CONSISTENT (sorted) order to avoid deadlock', 'Hold all 3 anyway', 'Queue and wait'], a: 1,
    e: 'A booking is one atomic unit. If any seat can\'t be held, release the rest and tell the user. Sorting the seat ids before acquiring prevents the A-holds-C4-waits-C5 vs B-holds-C5-waits-C4 deadlock.',
    w: { 0: 'Partial leaves a confusing charge.', 2: 'You can\'t hold a taken seat.', 3: 'Blocking can deadlock.' },
    r: { id: 's2', label: 'Section 2 — BookMyShow' } },
  { q: 'Splitwise: splitting ₹100 equally three ways — handle the remainder how?',
    o: ['33.33 each (lose a paisa)', 'Compute in paise: floor each share, distribute the leftover paise deterministically so shares sum to exactly ₹100; money is BigDecimal/Money, never double', 'Refuse non-divisible amounts', 'Use a double'], a: 1,
    e: 'The penny problem: equal shares rarely divide evenly. Work in the smallest unit, floor, and hand the remainder to the first few — shares always sum to the total. Floats drift; balances must reconcile to zero.',
    w: { 0: '33.33×3 = 99.99 — a vanishing paisa.', 2: 'Real bills aren\'t divisible; handle the remainder.', 3: 'double drifts (Day 20).' },
    r: { id: 's2', label: 'Section 2 — Splitwise' } },
  { q: 'Splitwise: split types (equal/exact/percentage) are modeled as…',
    o: ['if-else on a type string', 'A SplitStrategy interface (one class per type), with the universal invariant that shares sum to the total — a new split type is a new class', 'Three addExpense methods', 'A boolean'], a: 1,
    e: 'Splitting is a varying algorithm = Strategy (Day 31). Each strategy guarantees Σ shares == total or rejects. "By shares" or "itemized" is one more class; addExpense never changes.',
    w: { 0: 'The growing switch reopens addExpense.', 2: 'Duplicates the flow.', 3: 'Can\'t express three+ types.' },
    r: { id: 's2', label: 'Section 2 — Splitwise' } },
  { q: 'ATM: why model the hardware (CardReader, CashDispenser, Keypad) as interfaces?',
    o: ['Java requires it', 'Dependency inversion (Day 15): the ATM logic depends on abstractions, so real drivers OR fakes can be injected — a FakeCashDispenser that "jams" makes the rollback path testable with no hardware', 'For speed', 'To hide it from the bank'], a: 1,
    e: 'Hardware behind ports means the whole flow (PIN strikes, withdraw, jam-rollback) is testable with fakes — the same ports-and-adapters move as BookMyShow\'s payment gateway.',
    w: { 0: 'A design choice, not required.', 2: 'Testability, not speed.', 3: 'About swappable drivers/fakes.' },
    r: { id: 's2', label: 'Section 2 — ATM' } },
  { q: 'The "six shapes" Month 3 reduces to — name the family of BookMyShow/parking/hotel?',
    o: ['Each is unique', 'Resource + reservation + ATOMIC CLAIM ("two users, one X") — alongside scheduling/dispatch, state machine, money ledger, pipeline, and turn-based game loop', 'State machine', 'Money ledger'], a: 1,
    e: 'Recognizing the shape in minute one is the Month-3 meta-skill. Parking/BookMyShow/hotel are the resource-claim family; Splitwise/wallet are ledgers; vending/ATM are state machines; elevator/cab are dispatch; logging is a pipeline; TTT/snake are game loops.',
    w: { 0: 'They reduce to a handful of shapes.', 2: 'That\'s a different shape.', 3: 'That\'s a different shape.' },
    r: { id: 's1', label: 'Section 1 — the six shapes' } },
]

export default function RecapW11() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 3 · Week 11 · Big Systems</div>
        <h1>Week 11 Recap:<br />Big Systems &amp; the Recurring Race</h1>
        <p>Days 51–55 in one place: BookMyShow, Splitwise, and the ATM — three big systems that share one
           recurring problem (a resource or money claimed concurrently) solved by an atomic claim, plus money
           correctness. Cheat-sheet, rapid review, recap quiz — and the Month-3 "six shapes" recap.</p>
        <div className="chips">
          {['BookMyShow', 'Splitwise', 'ATM', 'atomic claim', 'money correctness', 'the six shapes'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  WEEK 11 — big systems, one recurring race

  BookMyShow   Seat≠ShowSeat / Movie≠Show · seat lifecycle (HELD+expiry) ·   Days 51-52
               the double-booking race → ATOMIC hold (compare-and-set) ·
               all-or-nothing multi-seat · PENDING→CONFIRMED · payment port
  Splitwise    SplitStrategy (sum invariant) · the penny problem · NET        Day 53
               balances (not log rescans) · settle-up = min-cash-flow graph
  ATM          State pattern · hardware behind PORTS · change-making ·        Day 54
               transaction atomicity (debit ⟺ dispense, rollback on jam)
  Drill        name the DEFINING problem; the recurring check-then-act race   Day 55

  THE THREAD: two users/one seat, two transfers/one balance, two ATMs/one
  account = the SAME race → atomic claim. Money is conserved, never a double.`} />
        <Note><strong>The six shapes (Month 3 in one line):</strong> resource+reservation+atomic-claim
          (parking / BookMyShow / hotel) · scheduling/dispatch (elevator / cab) · state machine (vending / ATM)
          · money ledger (Splitwise / wallet) · pipeline (logging) · turn-based game loop (TTT / snake).
          Recognizing the shape in minute one is the whole skill.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Problem-by-problem cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>BookMyShow (Days 51–52)</h3>
        <ul>
          <li><strong>Entity splits:</strong> Movie ≠ Show (film vs screening); Seat ≠ ShowSeat (physical vs availability-for-a-show). Booking attaches to a Show via ShowSeats. Location: City ◆ Theatre ◆ Screen ◆ Seat (also the search path).</li>
          <li><strong>Seat lifecycle:</strong> AVAILABLE →(atomic <C>tryHold</C>)→ HELD →(pay)→ BOOKED, with a TIMED HELD → AVAILABLE expiry (sweeper/TTL) — the load-bearing edge.</li>
          <li><strong>The race → atomic claim:</strong> <C>compareAndSet(AVAILABLE, HELD)</C> / conditional UPDATE; guarded <C>confirm()</C> (slow-payment-vs-expiry); all-or-nothing multi-seat with SORTED acquisition (no deadlock).</li>
          <li><strong>Booking lifecycle:</strong> PENDING → CONFIRMED/FAILED/EXPIRED (save PENDING before charging → crash-recoverable); payment behind a port; idempotency key for retries.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Splitwise (Day 53)</h3>
        <ul>
          <li><strong>Split = Strategy:</strong> Equal/Exact/Percent classes; universal invariant — shares sum to the total (or reject).</li>
          <li><strong>The penny problem:</strong> compute in paise, floor each share, distribute the remainder deterministically; Money/BigDecimal, never double.</li>
          <li><strong>Balances are the core data structure:</strong> running NET (pairwise or per-user), updated per expense (excluding the payer\'s own share) — "who owes whom" is a lookup, not a log re-scan.</li>
          <li><strong>Settle up = min cash flow:</strong> net everyone, greedily match biggest creditor ↔ biggest debtor (chains collapse, cycles cancel). Greedy is a heuristic; exact minimum is NP-hard.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>ATM (Day 54)</h3>
        <ul>
          <li><strong>State pattern (second flagship):</strong> IDLE → CARD_INSERTED → AUTHENTICATED → SELECTING → WITHDRAW → DISPENSING; states name successors; the 3-strike PIN limit is a guarded transition.</li>
          <li><strong>Hardware behind ports</strong> (CardReader/CashDispenser/Keypad/Screen/BankService) → inject fakes (a jam-simulating dispenser) → fully testable.</li>
          <li><strong>Cash dispensing = change-making</strong> (greedy denominations + inventory; <C>canDispense()</C> feasibility BEFORE any money moves; refuse, never short-change).</li>
          <li><strong>Transaction atomicity (the core):</strong> withdraw = debit + dispense as ONE unit — validate first, debit ⟺ dispense, roll back the debit on a jam; idempotent against retries.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>The Drill (Day 55)</h3>
        <ul>
          <li><strong>Name the defining problem</strong> (the shared resource or the money flow) before drawing a class.</li>
          <li><strong>The recurring race:</strong> four problems, one bug — check-then-act / lost-update on shared state → atomic claim.</li>
          <li><strong>Invariant to test:</strong> conservation (a wallet/group\'s balances sum to a constant); idempotency; non-negativity.</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 Patterns deployed this week</h2>
        <table className="matrix">
          <thead><tr><th>concern</th><th>tool</th><th>from</th></tr></thead>
          <tbody>
            <tr><td>resource ≠ reservation</td><td>noun analysis (Seat≠ShowSeat)</td><td>Day 10</td></tr>
            <tr><td>two users / one resource</td><td>atomic claim (compare-and-set / conditional UPDATE)</td><td>Day 21 → W13</td></tr>
            <tr><td>seat / ATM behavior</td><td>state machine (lifecycle / State pattern)</td><td>Days 34 · 48</td></tr>
            <tr><td>split / pricing</td><td>Strategy</td><td>Day 31</td></tr>
            <tr><td>money</td><td>Money / BigDecimal value object</td><td>Day 20</td></tr>
            <tr><td>payment / hardware</td><td>ports + adapters (+ fakes)</td><td>Days 15 · 26</td></tr>
            <tr><td>settle-up</td><td>min-cash-flow graph (greedy)</td><td>new (graph)</td></tr>
            <tr><td>retries</td><td>idempotency key</td><td>Days 52 · 54</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>The resource ≠ its reservation</strong> (Seat≠ShowSeat, Room≠RoomNight).</li>
          <li><strong>Two users, one X → atomic claim.</strong> (The race appears everywhere.)</li>
          <li><strong>Money is conserved; never a double; pennies distributed.</strong></li>
          <li><strong>Balances are running data, not log re-scans.</strong></li>
          <li><strong>Settle-up = net + greedily match creditor↔debtor.</strong></li>
          <li><strong>Debit ⟺ dispense; roll back on failure.</strong></li>
          <li><strong>Retries need idempotency keys.</strong></li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps to never repeat</h2>
        <Warn><strong>Status on the physical Seat / one Movie-Show class.</strong> Availability is per (show, seat); booking attaches to a Show.</Warn>
        <Warn><strong>Naive read-then-write claim.</strong> The double-booking / lost-update race. One atomic compare-and-set (or conditional UPDATE).</Warn>
        <Warn><strong>Holds with no expiry.</strong> Abandoned checkouts leak seats. A TTL/sweeper reclaims them.</Warn>
        <Warn><strong>double for money / vanishing penny.</strong> BigDecimal/Money; floor in minor units and distribute the remainder.</Warn>
        <Warn><strong>Re-scanning the expense log per query.</strong> Maintain running net balances.</Warn>
        <Warn><strong>Debit without rollback.</strong> A jam after debit robs the customer. Validate first; debit ⟺ dispense; reverse on failure.</Warn>
        <Warn><strong>Retries without idempotency.</strong> Double charges/bookings. An idempotency key makes them no-ops.</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Recall the answer before revealing:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across the week.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 11 revised?</strong> You can decompose a "scary" big system into a known shape, spot the
        recurring race, and keep money correct — the meta-skill Month 3 was built to give you.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 12 · Recap</strong> — data structures &amp; the buffer week (built when the week completes).
      </div>
    </div>
  )
}
