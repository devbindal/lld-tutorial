import { useState, useEffect } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the drill timer ============ */
const PHASES = [
  { until: 5 / 45, label: 'clarify & scope', nudge: '❓ Ask 4–6 questions. For a big system: find the DEFINING problem (shared resource? money?). Say what is OUT.' },
  { until: 12 / 45, label: 'entities + the hard part', nudge: '📦 Entity model with multiplicities + name the concurrency/atomicity point out loud (the "two users, one X").' },
  { until: 35 / 45, label: 'code bottom-up', nudge: '⌨️ Bricks → atomic claim / ledger / state → service → wiring. Compile every ~8 min. Narrate decisions.' },
  { until: 42 / 45, label: 'test & polish', nudge: '🧪 Happy path + the RACE/atomicity case (two concurrent claims, or a failed half-transaction). Fix, don\'t gold-plate.' },
  { until: 1, label: 'self-review', nudge: '📋 Stop typing. Run the Section 7 rubric honestly. Write down your top-2 gaps.' },
]

function fmt(s) {
  const m = Math.floor(s / 60), ss = s % 60
  return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss
}

function DrillTimer() {
  const [duration, setDuration] = useState(45 * 60)
  const [left, setLeft] = useState(45 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || left === 0) return
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running, left])

  const elapsed = duration - left
  const progress = elapsed / duration
  const phaseIdx = left === 0 ? PHASES.length - 1 : PHASES.findIndex((p) => progress < p.until)
  const phase = PHASES[phaseIdx === -1 ? PHASES.length - 1 : phaseIdx]

  function preset(min) { setDuration(min * 60); setLeft(min * 60); setRunning(false) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · an actual drill clock — phases scale to whatever length you pick</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {[25, 45, 60].map((m) => (
          <button key={m} className={duration === m * 60 ? 'on' : ''} onClick={() => preset(m)}>{m} min</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 38, fontWeight: 700, color: left === 0 ? 'var(--red)' : 'var(--ink)' }}>
          {fmt(left)}
        </span>
        {!running
          ? <button className="act" onClick={() => left > 0 && setRunning(true)}>{elapsed > 0 && left > 0 ? '▶ resume' : '▶ start the drill'}</button>
          : <button className="ghost act" onClick={() => setRunning(false)}>⏸ pause</button>}
        <button className="ghost act" onClick={() => preset(duration / 60)}>reset</button>
      </div>
      <div style={{ display: 'flex', width: '100%', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 8 }}>
        {PHASES.map((p, i) => {
          const start = i === 0 ? 0 : PHASES[i - 1].until
          const w = (p.until - start) * 100
          const active = i === (phaseIdx === -1 ? PHASES.length - 1 : phaseIdx) && elapsed > 0
          const past = progress >= p.until
          return (
            <div key={i} style={{
              width: w + '%', padding: '6px 2px', textAlign: 'center',
              fontFamily: 'IBM Plex Mono', fontSize: 10.5, whiteSpace: 'nowrap', overflow: 'hidden',
              background: active ? '#FFF1D6' : past ? '#EAF7EF' : '#fff',
              borderRight: i < PHASES.length - 1 ? '1px solid var(--line)' : 'none',
              fontWeight: active ? 700 : 400,
            }}>{p.label}</div>
          )
        })}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {left === 0
          ? <span>⏰ <b>Pens down.</b> However far you got is the data. Straight to the rubric (Section 7) — the review is half the rep.</span>
          : elapsed === 0
            ? <span>Pick a track below (Section 4 or 5), pick a length, press start — and follow the bar, not your enthusiasm.</span>
            : <span style={{ fontSize: 13 }}><b>{phase.label.toUpperCase()}</b> — {phase.nudge}</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: the smell hunt ============ */
const SMELLS = [
  { code: 'if (seat.isAvailable()) {\n  seat.book(user);   // confirmed!\n}',
    o: ['Missing an else branch', 'Check-then-act race (Days 21, 51): two users both pass isAvailable() before either books → double-booking. Use ONE atomic compare-and-set (or conditional UPDATE … WHERE status=\'AVAILABLE\')', 'isAvailable should be cached', 'book() should return void'], a: 1,
    why: 'The gap between checking and acting is the whole double-booking bug. Collapse the test and the set into one indivisible operation so exactly one of two racers wins.' },
  { code: 'double total = 999.99;\ndouble each = total / 3;   // split 3 ways',
    o: ['999.99 should be a constant', 'double for money (Day 20): 999.99/3 drifts and 333.33×3 loses a paisa — use integer minor units / BigDecimal Money and distribute the remainder deterministically', 'Should use float', 'Division is slow'], a: 1,
    why: 'Binary floats cannot represent most decimal money exactly, and naive equal-split silently drops cents. Compute in paise with a deterministic remainder so shares sum to the total.' },
  { code: 'account.debit(amount);\ndispenser.dispense(amount);   // hand out cash',
    o: ['Should log the amount', 'No atomicity/rollback (Day 54): if dispense JAMS after the debit, the customer is charged for cash they never got — validate first, and roll back the debit if the dispense fails', 'debit should be async', 'Missing a null check'], a: 1,
    why: 'A withdrawal spans two systems (account + cash). They must move together or neither: debit ⟺ dispense. A jam after debit must reverse the debit.' },
  { code: 'class Seat {\n  int row, col;\n  SeatStatus status;   // AVAILABLE / BOOKED\n}',
    o: ['status should be an enum (it is)', 'Status on the PHYSICAL seat (Day 51): the same seat has different availability per show — availability belongs on ShowSeat(show, seat, status), not the seat itself', 'Missing a seat id', 'row/col should be private'], a: 1,
    why: 'Seat C4 is one piece of furniture but "is C4 free?" differs per show. Put status on a ShowSeat (seat-for-a-show); the physical Seat only describes location and type.' },
  { code: 'switch (splitType) {\n  case "EQUAL": ...\n  case "EXACT": ...\n  case "PERCENT": ...\n}',
    o: ['Missing a default case', 'if-else/switch on a type string (Days 12, 53): every new split type reopens this — use a SplitStrategy interface with one class per type; new type = new class, not an edit', 'Strings are slow to switch', 'Should be an enum'], a: 1,
    why: 'A growing switch on a type is the OCP smell. A SplitStrategy interface makes each split type a cohesive, addable class and leaves addExpense untouched.' },
  { code: 'long bal = wallet.getBalance();\nwallet.setBalance(bal - amount);   // transfer out',
    o: ['Should use int not long', 'Lost-update race (Day 21): two concurrent transfers both read the same balance and one write overwrites the other → money created or destroyed. Use an atomic conditional update (UPDATE … SET bal=bal-amt WHERE bal>=amt)', 'getBalance should cache', 'Missing a toString'], a: 1,
    why: 'Read-modify-write on a shared balance loses updates under concurrency. An atomic decrement (or conditional UPDATE) keeps the balance correct and rejects overdrafts in one step.' },
]

function SmellHunt() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= SMELLS.length
  const cur = SMELLS[idx]

  function pick(i) {
    if (picked !== null) return
    setPicked(i)
    if (i === cur.a) setScore((s) => s + 1)
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · six snippets from this week's problems, each hiding one planted smell — name it</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Score: <b>{score} / {SMELLS.length}</b> — four of these six are the SAME bug (check-then-act / lost-update) in different costumes. Spotting the race anywhere is the Week 11 superpower. Re-run until 6/6 is boring.</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Hunt again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 10 }}>🔎 <span>snippet {idx + 1} of {SMELLS.length} · score {score}</span></div>
          <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
            {cur.code.split('\n').map((l, i) => (
              <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre', overflowX: 'auto' }}>{l}</div>
            ))}
          </div>
          <div className="modbtns">
            {cur.o.map((o, i) => (
              <button key={i} className={picked !== null && i === cur.a ? 'on' : ''}
                style={{ fontSize: 12.5, ...(picked === i && i !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}) }}
                onClick={() => pick(i)}>{o.length > 64 ? o.slice(0, 61) + '…' : o}</button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ ' : '❌ '} <b>{cur.o[cur.a]}</b><br /><br />{cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={() => { setPicked(null); setIdx((i) => i + 1) }}>Next snippet →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: the rubric scorecard ============ */
const RUBRIC = [
  { cat: 'Scope', revisit: 'Day 51', items: [
    'Asked 4–6 design-shaping questions before touching code',
    'Named the DEFINING problem out loud (the shared resource / the money flow)',
    'Said what is OUT of scope (payments? multi-region? scale?)',
  ]},
  { cat: 'Model', revisit: 'Days 51 & 53', items: [
    'Split the right entities (the "thing" vs the "thing-for-a-context", e.g. Seat vs ShowSeat)',
    'Money is a Money/BigDecimal value, never double; pennies are conserved',
    'Balances/state are running data structures, not logs you re-scan per query',
    'Payer ≠ participant, resource ≠ reservation — independent concepts modeled separately',
  ]},
  { cat: 'Code', revisit: 'Days 52 & 54', items: [
    'It compiles, and the happy path runs end-to-end',
    'The shared claim is ATOMIC (compare-and-set / conditional update), not check-then-act',
    'Multi-system changes are atomic: all-or-nothing, with rollback on partial failure',
    'External deps (payment, hardware, bank) behind ports → a deterministic test is POSSIBLE',
  ]},
  { cat: 'Extensibility', revisit: 'Days 52–54', items: [
    'Proved one follow-up = new class + one wiring line (actually did it)',
    'Named the seams: strategy slots (pricing/split), ports (payment/hardware), state classes',
  ]},
  { cat: 'Communication', revisit: 'Days 51 & 54', items: [
    'Narrated decisions while typing, citing the pattern and the race it prevents',
    'Flagged concurrency, idempotency, and crash-recovery in one sentence each',
  ]},
]
const TOTAL_ITEMS = RUBRIC.reduce((n, g) => n + g.items.length, 0)

function RubricScorecard() {
  const [checked, setChecked] = useState({})
  const score = Object.values(checked).filter(Boolean).length
  const toggle = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }))
  const gaps = RUBRIC.filter((g) => g.items.some((_, i) => !checked[g.cat + i]))

  let verdict, color
  if (score >= 15) { verdict = '🟢 Interview-ready. Do one more rep at 25 minutes for speed, then you have finished Month 3.'; color = '#EAF7EF' }
  else if (score >= 11) { verdict = '🟡 One more rep needed. Restudy ONLY the flagged days below, then drill the OTHER track at full length.'; color = '#FFF1D6' }
  else { verdict = '🔴 Rebuild first. Re-do the flagged days actively (type the code, don\'t read it), then re-drill this SAME track.'; color = '#FDECEC' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · grade your drill like an interviewer would — honestly, immediately after pens-down</div>
      {RUBRIC.map((g) => (
        <div key={g.cat} style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>
            {g.cat.toUpperCase()} <span style={{ opacity: 0.7 }}>· taught on {g.revisit}</span>
          </div>
          {g.items.map((item, i) => {
            const k = g.cat + i
            return (
              <button key={k} onClick={() => toggle(k)} style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                fontFamily: 'IBM Plex Sans', fontSize: 13.5, padding: '5px 8px', marginBottom: 3,
                border: '1px solid var(--line)', borderRadius: 6,
                background: checked[k] ? '#EAF7EF' : '#fff',
              }}>{checked[k] ? '☑' : '☐'} {item}</button>
            )
          })}
        </div>
      ))}
      <div className="statbar" style={{ display: 'block', background: score > 0 ? color : undefined }}>
        <span style={{ fontSize: 13.5 }}>
          <b>score: {score} / {TOTAL_ITEMS}</b>{score > 0 && <> — {verdict}</>}
          {score > 0 && score < TOTAL_ITEMS && gaps.length > 0 && (
            <><br />gap days to restudy: <b>{gaps.map((g) => g.cat + ' → ' + g.revisit).join(' · ')}</b></>
          )}
        </span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'You get a big-system prompt (booking, payments, inventory). After scope, the FIRST thing to nail?',
    o: ['The class diagram', 'The DEFINING problem — usually a shared resource claimed concurrently or money that must stay consistent — name it out loud, because the whole design bends around it', 'The database schema', 'The REST endpoints'], a: 1,
    e: 'Every Week 11 system had a defining problem: two users one seat, balances that must reconcile, debit ⟺ dispense. Naming it early (like "which floor next?" for the elevator) steers every later decision.',
    w: { 0: 'A class diagram without the hard problem identified is boxes around the wrong center.',
         2: 'Schema is downstream of knowing what must stay consistent.',
         3: 'Endpoints are the surface; the concurrency/atomicity core is the test.' },
    r: { id: 's1', label: 'Section 1 — the protocol' } },
  { q: 'Track A is a hotel booking system. The entity split that mirrors Seat ≠ ShowSeat?',
    o: ['Room and Hotel are the same', 'Room (physical) ≠ RoomNight (a room\'s availability for a specific date) — the same room has different availability per night, so you claim a RoomNight, not a Room (Day 51)', 'Room extends Booking', 'One Room object per guest'], a: 1,
    e: 'Identical shape to BookMyShow: the physical Room is shared; availability is per (room, date). You atomically claim RoomNights for the stay\'s date range — booking a room for June 5 says nothing about June 6.',
    w: { 0: 'A hotel HAS rooms; collapsing them loses per-night availability.',
         2: 'A room is-a booking fails the is-a test — different concepts.',
         3: 'A room is reused across guests on different nights; not one per guest.' },
    r: { id: 's4', label: 'Section 4 — Track A' } },
  { q: 'Track B is a digital wallet. The planted trap in a money transfer is…',
    o: ['Using too much memory', 'Lost-update / non-atomic transfer (Days 21, 54): read-modify-write on a balance loses concurrent updates, and a debit without a matching credit creates or destroys money — use an atomic conditional update and make debit+credit one unit', 'Slow database queries', 'Missing input validation'], a: 1,
    e: 'A transfer is the ATM lesson again: two-sided and concurrent. balance = balance − amt as read-modify-write races; and debit-then-credit must be atomic or money leaks. This is the trap the track is built to catch.',
    w: { 0: 'Memory isn\'t the issue; correctness under concurrency is.',
         2: 'Speed is secondary to never losing money.',
         3: 'Validation matters but isn\'t the planted concurrency/atomicity trap.' },
    r: { id: 's5', label: 'Section 5 — Track B\'s planted trap' } },
  { q: 'Across Week 11, four different problems shared ONE underlying bug. Which?',
    o: ['Off-by-one errors', 'Check-then-act / lost-update races on shared state — seat booking, wallet balance, account debit, inventory claim are all the same race in different costumes (Day 21)', 'Memory leaks', 'Null pointer exceptions'], a: 1,
    e: 'Two gates/one spot, two users/one seat, two transfers/one balance, two ATMs/one account — all check-then-act on shared mutable state. Recognizing the race anywhere is the week\'s core skill.',
    w: { 0: 'Off-by-one is unrelated to the shared-state theme.',
         2: 'Memory leaks weren\'t the recurring issue.',
         3: 'NPEs are generic; the recurring bug is the concurrency race specifically.' },
    r: { id: 's6', label: 'Section 6 — the smell hunt' } },
  { q: 'Both tracks need a deterministic test of the hard part. The shared technique?',
    o: ['Run it in production and watch', 'Drive the race/atomicity case explicitly: for concurrency, fire two claims and assert exactly one wins; for atomicity, inject a fake that fails mid-transaction and assert the rollback — fakes + controlled inputs, no real money, no flakiness', 'Add lots of logging', 'Test only the happy path'], a: 1,
    e: 'The Day 52/54 move: inject a FakePaymentGateway/FakeDispenser that fails on cue and assert state stays consistent; for races, invoke the atomic claim twice and assert one true / one false. The hard part is the part you must test.',
    w: { 0: 'Production is the worst place to first learn your atomicity is broken.',
         2: 'Logs describe; they don\'t assert or fail a build.',
         3: 'The happy path is the entry ticket; the race/rollback is the grade.' },
    r: { id: 's2', label: 'Section 2 — the week\'s skills' } },
  { q: 'A transfer request times out — the client retries. Without protection, what happens, and the fix?',
    o: ['Nothing — retries are safe', 'It can double-charge (the first request actually succeeded); fix with an IDEMPOTENCY key so a retry with the same key returns the original result instead of transferring again (Days 52, 54)', 'The database rejects it automatically', 'The user is logged out'], a: 1,
    e: 'A timed-out-but-succeeded request retried = two transfers. An idempotency key recorded with the operation makes the retry a no-op that returns the first result — essential for any money/booking operation.',
    w: { 0: 'Money operations are NOT naturally safe to retry — that\'s the whole point.',
         2: 'Nothing rejects a second valid-looking request without an idempotency check.',
         3: 'Logout is unrelated to transfer idempotency.' },
    r: { id: 's5', label: 'Section 5 — Track B' } },
  { q: 'You scored 12/17, all misses in Code (the atomic-claim and rollback rows). The review loop says…',
    o: ['Move on — passing score', 'Restudy ONLY the flagged material (the atomic hold in Day 52, the rollback in Day 54), then re-drill the OTHER track at full length', 'Redo all of Weeks 1–11', 'Lower the rubric'], a: 1,
    e: 'Targeted reps: the rubric points at specific gap days. Missing the Code rows means the atomicity didn\'t stick — restudy Days 52/54 actively (type it), then re-drill to confirm it generalizes.',
    w: { 0: '11–14 means a real gap in the most important rows; carrying it forward compounds it.',
         2: 'Untargeted re-study is rereading — train the gap, not the syllabus.',
         3: 'Adjusting the measuring stick guarantees no improvement. 🙂' },
    r: { id: 's7', label: 'Section 7 — the review loop' } },
  { q: 'It\'s the end of Month 3. What should a "classic LLD problem" feel like now?',
    o: ['A unique puzzle each time', 'A SHAPE you recognize: resource+reservation+atomic-claim, money ledger, state machine — plus the defining problem named in minute one, the patterns reached for by name, and the race/atomicity tested deliberately', 'Something to memorize per problem', 'Mostly about the database'], a: 1,
    e: 'Twelve classics in, the prompts rhyme: parking/elevator/booking/hotel are the same resource-claim shape; Splitwise/wallet are ledgers; vending/ATM are state machines. Recognizing the shape and the defining problem fast is the skill the whole month built.',
    w: { 0: 'They look unique but reduce to a handful of shapes — that\'s the payoff.',
         2: 'Memorizing solutions fails on a twist; recognizing shapes generalizes.',
         3: 'The LLD round grades modeling and concurrency, not schema design.' },
    r: { id: 's8', label: 'Section 8 — what should feel automatic' } },
]

/* ============ The page ============ */
export default function Day55() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 11 · Day 55 · Classic LLD Problems</div>
        <h1>Week 11 Drill:<br />Big Systems, Races &amp; Money, On the Clock</h1>
        <p>Day 54 was the last new problem of the week — and of Month 3. Now you prove the big-systems skills
           stuck: two FRESH problems solo, under a real timer, graded with an interviewer\'s rubric. One claims
           a shared resource (the booking shape); one moves money (the ledger + atomicity shape) — and it hides
           the race this whole week trained you to see. Click everything, then close the lid and drill.</p>
        <div className="chips">
          {['timed drill', 'booking track', 'wallet track', 'self-grading rubric', 'race hunt', 'review loop'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The drill protocol: find the hard part first</h2>
        <p>Same rules as Days 45 and 50 — a dress rehearsal, not study time. The twist for big systems: after
          scope, your job is to <strong>name the defining problem</strong> (the shared resource or the money
          flow) before drawing a single class, because the whole design bends around it.</p>
        <Code html={`  THE DRILL PROTOCOL (Week 11 edition)

  RULES (non-negotiable):
  · real keyboard, real project, timer VISIBLE
  · no peeking at Days 51–54 until the review phase
  · the code must COMPILE when the bell rings
  · talk out loud — name the RACE and how your design prevents it
  · pens down at zero. Interviews don't grant extensions.

  THE 45-MINUTE SHAPE
  ──────────────────────────────────────────────────────────────
   0– 5   clarify + scope; NAME the defining problem (shared resource / money)
   5–12   entity model + the concurrency/atomicity point, out loud
  12–35   CODE bottom-up: atomic claim / ledger / state → service → wiring
                                        ← compile every ~8 minutes
  35–42   happy path + the RACE or rollback case (the part that's actually graded)
  42–45   self-review against the rubric (Section 7)`} />
        <Note><strong>The big-system tell:</strong> if the prompt has a resource many people want at once
          (seats, rooms, inventory) or money that must stay consistent (balances, transfers), that\'s your
          defining problem. Find it in minute one — graders probe it with "what if two people…?" or "what if
          it fails halfway?"</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The week in one map — what the drill actually tests</h2>
        <table className="matrix">
          <thead>
            <tr><th>skill</th><th>born on</th><th>drill checkpoint</th></tr>
          </thead>
          <tbody>
            <tr><td>name the defining problem early</td><td>Day 51</td><td>stated in the first 5 minutes</td></tr>
            <tr><td>resource ≠ reservation (Seat ≠ ShowSeat)</td><td>Day 51</td><td>the right entity split drawn</td></tr>
            <tr><td>atomic claim (compare-and-set)</td><td>Days 51 · 52</td><td>no check-then-act anywhere</td></tr>
            <tr><td>all-or-nothing + rollback</td><td>Days 52 · 54</td><td>partial failure leaves clean state</td></tr>
            <tr><td>money as Money, pennies conserved</td><td>Days 53 · 54</td><td>no double; balances sum to zero</td></tr>
            <tr><td>running balances, not log re-scans</td><td>Day 53</td><td>"who owes/has what" is a lookup</td></tr>
            <tr><td>state machine + guarded transitions</td><td>Day 54</td><td>states own transitions; no switch-grid</td></tr>
            <tr><td>external deps behind ports</td><td>Days 52 · 54</td><td>payment/hardware injectable + fakeable</td></tr>
            <tr><td>idempotency on retries</td><td>Days 52 · 54</td><td>a retried op doesn\'t double-charge</td></tr>
            <tr><td>deterministic test of the hard part</td><td>Days 52 · 54</td><td>race / rollback asserted with fakes</td></tr>
          </tbody>
        </table>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>⏱ The drill clock</h2>
        <p>Use this for the real thing. Read a track, write your scope + entity model + the named race FIRST,
          then press start:</p>
        <DrillTimer />
        <Good><strong>How to use it:</strong> the moment you finish scope, write one sentence: "the defining
          problem is ___, and I\'ll prevent it with ___." If you can\'t fill that in by minute 5, the drill just
          found your gap — keep clarifying until you can.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Track A · "Design a hotel room booking system." (the shared-resource rep)</h2>
        <p>Eleven words, vague on purpose. Write your 4–6 clarifying questions, the entity model, AND the named
          race on paper <em>before</em> opening the answers. Then drill.</p>
        <Warn><strong>Do not open the reveals until your model is written.</strong> Reading first turns a rep
          into a rerun — the "spot the resource-claim shape" muscle is what this track trains.</Warn>
        <Reveal summary="🔒 The interviewer's answers — open AFTER writing your model">
          <p><strong>Scale?</strong> Many hotels, each with many rooms of a few room TYPES (standard, deluxe).
            <br /><strong>Booking unit?</strong> A room for a date RANGE (check-in to check-out).
            <br /><strong>Hold while paying?</strong> Yes — a short hold, like seat booking.
            <br /><strong>The hard case?</strong> Two guests booking the last deluxe room for overlapping dates
            — must be impossible (the double-booking race).
            <br /><strong>Pricing?</strong> Per room type, varies by date (weekend/season) — a strategy.
            <br /><strong>Out of scope:</strong> payments (assume a gateway), reviews, loyalty.
            <br /><strong>Sneaky follow-up at minute 40:</strong> "a guest books 3 nights; one night is taken —
            all-or-nothing?"</p>
        </Reveal>
        <Reveal summary="🔒 Model-answer skeleton — open ONLY during the review phase">
          <Code html={`  TRACK A — BookMyShow, re-skinned (resource + reservation + atomic claim)

  Room (physical: id, type)          ≠   RoomNight(room, date, status)  ← Seat≠ShowSeat!
  enum RoomStatus { AVAILABLE, HELD, BOOKED }   status lives on RoomNight, per DATE
  Hotel ◆ Room ;  search: city → hotels → rooms of type, available for [in,out)

  tryHoldStay(room, checkIn, checkOut):
      for each night in [checkIn, checkOut):          ← all-or-nothing over the range
          if !roomNight.compareAndSet(AVAILABLE, HELD) → release acquired, FAIL
      (acquire nights in date order → no deadlock)    ← Day 52's sorted-acquire

  Booking{guest, room, range, status PENDING→CONFIRMED/FAILED/EXPIRED}
  PricingStrategy per (roomType, date)               ← Day 53/42 pricing family
  hold expiry sweeper ; payment behind a port        ← Day 52

  SELF-CHECK: status on Room not RoomNight? check-then-act hold? partial-stay
  booking? double for money? Each is Days 51/52/53 calling. The SHAPE is the lesson.`} />
        </Reveal>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Track B · "Design a digital wallet." (the money-ledger rep — with a planted trap)</h2>
        <p>Users hold balances and transfer money to each other. Same discipline — questions, entity model, and
          the named race on paper first. This one looks simple, and it hides the exact bug this week hammered.</p>
        <Reveal summary="🔒 The interviewer's answers — open AFTER writing your model">
          <p><strong>Operations?</strong> Add money, withdraw, transfer wallet-to-wallet, view balance + history.
            <br /><strong>Overdraft?</strong> No — a transfer must fail if the balance is insufficient.
            <br /><strong>The hard case?</strong> Two transfers from the same wallet at the same instant, and a
            transfer that must move money out of one wallet and into another without ever losing or creating a
            rupee.
            <br /><strong>Retries?</strong> Clients retry on timeout — must not double-charge.
            <br /><strong>Out of scope:</strong> KYC, real bank rails, currencies (one currency).
            <br /><strong>Sneaky follow-up at minute 40:</strong> "show me the transfer is safe under
            concurrency AND under a retry."</p>
        </Reveal>
        <Reveal summary="🔒 Model-answer skeleton + THE TRAP — open ONLY during the review phase">
          <Code html={`  TRACK B — the skeleton, and the landmine

  Wallet{id, Money balance}   Transaction{id, from, to, Money amt, status, idempotencyKey}
  (balance is Money/BigDecimal — NEVER double; history is an append-only log)

  transfer(from, to, amount, idemKey):
      if seen(idemKey) return priorResult        ← IDEMPOTENT: retry-safe (Day 52/54)
      atomically:                                ← ATOMIC across BOTH wallets
          debit  from  (only if balance ≥ amount)   ← conditional update, not read-modify-write
          credit to
          record Transaction(COMPLETED, idemKey)
      (on any failure → nothing moves; money conserved)

  ⚠ THE TRAP #1: long b = w.getBalance(); w.setBalance(b - amt);
     two concurrent transfers both read b → one write lost → money created/destroyed.
     Fix: atomic decrement / UPDATE … SET bal = bal - amt WHERE bal >= amt.
  ⚠ THE TRAP #2: debit succeeds, credit throws, no rollback → money vanishes.
     Fix: debit ⟺ credit as ONE unit (transaction), like ATM debit⟺dispense (Day 54).
  INVARIANT to test: sum of all wallet balances is constant across any transfer.`} />
        </Reveal>
        <Note><strong>Why two tracks:</strong> Track A tests whether the resource-claim shape transferred
          (resource ≠ reservation, atomic hold, all-or-nothing over a range). Track B tests the money-ledger +
          two-sided-atomicity shape — and whether the check-then-act / lost-update race is now something you
          catch on sight. Different muscles; drill both.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔎 Play: the smell hunt</h2>
        <p>Warm up your reviewer\'s eye before grading yourself. Six snippets from this week\'s problems, one
          planted smell each — and four of them are the same race wearing different clothes:</p>
        <SmellHunt />
        <Good><strong>What you should notice:</strong> ① Seat booking, wallet transfer, account debit, inventory
          claim — all check-then-act / lost-update. ② The fix is always the same shape: one atomic operation
          (compare-and-set / conditional update), not "be more careful". ③ The non-race smells (double for
          money, status-on-Seat, switch-on-type) are the modeling misses this week also warned about.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>📋 The rubric: grade yourself like an interviewer</h2>
        <p>Immediately after pens-down — while the memory is honest — check off only what you ACTUALLY did, not
          what you knew you should do:</p>
        <RubricScorecard />
        <Code html={`  THE REVIEW LOOP — the rep isn't over at pens-down

  drill (45') ──▶ rubric score ──▶ write your TOP-2 gaps
                                          │
       ▲                                  ▼
       └── re-drill (other track) ◀── restudy ONLY the gap days (actively:
            25' once you're green        type the code, don't reread the page)

  One honest loop beats five untimed, ungraded "practice sessions".
  The drill finds the gap; the review names it; the targeted rep closes it.`} />
        <Warn><strong>The rubric only works if it hurts a little.</strong> "I would have made the claim atomic"
          is unchecked. "I mentioned idempotency in my head" is unchecked. The standard: an interviewer watching
          the recording would have seen or heard it.</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Month 3 in the rearview — the shapes you now own</h2>
        <p>Twelve classics, three weeks. Step back and see how few SHAPES they actually were — recognizing the
          shape in minute one is the whole skill:</p>
        <table className="matrix">
          <thead>
            <tr><th>shape</th><th>defining problem</th><th>problems</th></tr>
          </thead>
          <tbody>
            <tr><td>resource + reservation + atomic claim</td><td>"two users, one X"</td><td>parking, BookMyShow, hotel (Track A)</td></tr>
            <tr><td>scheduling / dispatch behind a strategy</td><td>"which one next?"</td><td>elevator, (cab next week)</td></tr>
            <tr><td>state machine (one class per state)</td><td>"same input, different meaning per state"</td><td>vending, ATM</td></tr>
            <tr><td>money ledger</td><td>"balances must reconcile, pennies conserved"</td><td>Splitwise, wallet (Track B)</td></tr>
            <tr><td>pipeline / handler chain</td><td>"pass it down the line"</td><td>logging</td></tr>
            <tr><td>turn-based game loop</td><td>"who moves, apply rules, check end"</td><td>tic-tac-toe, snake &amp; ladder</td></tr>
          </tbody>
        </table>
        <Good><strong>The meta-skill of Month 3:</strong> a new prompt should trigger "that\'s shape #1 with a
          twist" within a minute, then the patterns (Strategy, State, Observer, atomic-claim) come by name with
          their triggers and trade-offs ready. That recognition — not memorized solutions — is what carries you
          into Month 4\'s advanced problems and the mock rounds.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>📋 Cheat sheet — the pocket script for big-system problems</h2>
        <ul>
          <li><strong>Big-system tell:</strong> a contended resource (seats/rooms/inventory) or money (balances/transfers) → that\'s the defining problem; name it in minute one.</li>
          <li><strong>Entity split:</strong> the physical thing ≠ its reservation/availability (Seat ≠ ShowSeat, Room ≠ RoomNight). Claim the reservation, not the thing.</li>
          <li><strong>Atomic claim:</strong> compare-and-set / conditional update (UPDATE … WHERE status='AVAILABLE'). Never check-then-act or read-modify-write.</li>
          <li><strong>Multi-step/multi-system = atomic + rollback:</strong> all-or-nothing holds; debit ⟺ credit / debit ⟺ dispense; reverse on partial failure; acquire in a consistent order (no deadlock).</li>
          <li><strong>Money:</strong> Money/BigDecimal, never double; conserve pennies; balances are running data + an append-only log; the group/system sum is an invariant to test.</li>
          <li><strong>Idempotency:</strong> an idempotency key per money/booking op so retries don\'t double-apply.</li>
          <li><strong>Ports for externals</strong> (payment, hardware, bank) → inject fakes → test the race and the rollback deterministically. Review loop: drill → rubric → top-2 gaps → re-drill.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 Big-system round questions</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Where exactly should the atomic guarantee live — in my service code or the database?"'>
          <p>At the authoritative store, not scattered in service code. A synchronized block in one JVM doesn\'t
            help when two app servers run the same code — so the atomic claim belongs where the data lives: a
            DB conditional UPDATE / unique constraint / row lock, or an atomic op in Redis (SET NX). Your service
            issues the atomic operation; the store enforces it. "I push the atomicity down to the store so it
            holds across many app instances" is the answer that shows you\'ve thought past a single process.</p>
        </Reveal>
        <Reveal summary='Q: "Optimistic or pessimistic locking — how do you choose under the clock?"'>
          <p>By contention. High contention on a hot row (the last deluxe room, a flash-sale item) → pessimistic
            lock or a serialized claim, because optimistic would thrash on retries. Low contention (most rooms,
            most wallets) → optimistic (version/CAS, retry on conflict) to avoid holding locks. Say the trade
            and pick by the expected hot-spot — there\'s no universal winner, and naming WHY is the senior
            signal (Day 51\'s locking table).</p>
        </Reveal>
        <Reveal summary='Q: "Prove your wallet transfer is correct. What&apos;s the one invariant?"'>
          <p>The sum of all balances is conserved across any transfer (no money created or destroyed) — assert
            it in a test that fires many concurrent transfers and checks the total is unchanged at the end.
            Plus: no balance ever goes negative (overdraft rejected), and a retried transfer with the same
            idempotency key leaves balances identical to a single application. Those three properties —
            conservation, non-negativity, idempotency — are the whole correctness story, and stating them as
            testable invariants is far stronger than "I used a transaction".</p>
        </Reveal>
        <Reveal summary='Q: "An all-or-nothing booking spans 3 nights and night 2 is taken. Walk it."'>
          <p>Acquire holds night by night in date order; the moment night 2\'s <C>compareAndSet(AVAILABLE,HELD)</C>
            fails, release the holds already acquired (night 1) and fail the whole request with "those dates
            aren\'t all available." Never leave the guest holding 2 of 3 nights or charged for a partial stay.
            Date-order acquisition also avoids deadlock when two guests want overlapping ranges. This is Day 52\'s
            tryHoldAll with dates instead of seats — same shape, and saying "same as multi-seat booking" shows
            the transfer landed.</p>
        </Reveal>
        <Reveal summary='Q: "How do these single-machine designs survive going distributed?"'>
          <p>The correctness primitive (the atomic claim) must move to a shared authoritative store — DB or
            distributed cache — because in-process locks don\'t span machines. Then PARTITION so each contended
            resource has one owner: shard seats/rooms by show/hotel, wallets by account id, so all operations on
            one resource route to one place and the single-writer guarantee holds without distributed locks.
            Cross-resource operations (a transfer touching two wallets in different shards) need a real
            distributed transaction or a saga — flag it as the hard part. "Partition by the contended resource;
            avoid distributed locks where you can" is the framing; the deep dive is distributed systems.</p>
        </Reveal>
        <Reveal summary='Q: "Month 3 is done. Am I ready for the advanced problems and mocks?"'>
          <p>You\'re ready if a fresh prompt triggers shape-recognition fast: "resource claim → atomic hold,"
            "money → ledger + conservation invariant," "modes → state machine," and you name the defining
            problem and the race in the first few minutes. The green-twice rubric across both tracks here is the
            measurable check. Month 4 (concurrency deep dive, advanced problems, timed mocks) builds directly on
            this: it takes the flags you\'ve been PLANTING all month — atomic claims, idempotency, rollback —
            and makes them the main event. If the shapes feel familiar and the race jumps out at you, you\'re
            ready.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s10">
        <div className="sec-label">Section 10 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 55 complete?</strong> Homework IS the day: run <strong>Track A at 45 minutes</strong> today
        with the timer above — full protocol, entity model + named race first, out loud, rubric immediately
        after, top-2 gaps written down. Tomorrow (or after a gap-day restudy if you scored red), run
        <strong> Track B at 45</strong> and see if the lost-update trap catches you. Green on both = Week 11 is
        yours — and you\'ve completed Month 3, the classic LLD problems.
        <br /><br />
        Next: <strong>Day 56 — LRU Cache</strong>: Week 12 opens with the most-asked data-structure design —
        O(1) get and put with a HashMap + doubly-linked list, and the eviction policy made pluggable.
      </div>
    </div>
  )
}
