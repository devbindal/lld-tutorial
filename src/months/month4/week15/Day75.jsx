import { useState, useEffect } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: drill timer ============ */
const PHASES = [
  { until: 5 / 45, label: 'clarify & scope', nudge: '❓ Ask 4–6 design-shaping questions. Write assumed answers. Say what is OUT of scope — out loud.' },
  { until: 12 / 45, label: 'entities & enums', nudge: '📦 Noun–verb pass → entity table. Closed sets become enums. STOP modeling at the bell.' },
  { until: 35 / 45, label: 'code bottom-up', nudge: '⌨️ Bricks → core flow → wiring. Compile every ~8 minutes. Narrate every decision as you type.' },
  { until: 42 / 45, label: 'test & polish', nudge: '🧪 Drive the happy path end-to-end + ONE edge case. Fix, don\'t gold-plate.' },
  { until: 1, label: 'self-review', nudge: '📋 Pens down. Run the Section 7 rubric honestly. Write your top-2 gaps.' },
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
      <div className="ptitle">Live demo · drill clock — phase bar scales to whatever length you pick</div>
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
            ? <span>Pick a track (Section 4 or 5), pick a length, press start — and follow the bar, not your enthusiasm.</span>
            : <span style={{ fontSize: 13 }}><b>{phase.label.toUpperCase()}</b> — {phase.nudge}</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: smell hunt ============ */
const SMELLS = [
  {
    code: '// Hotel availability check\nboolean isAvailable(LocalDate reqIn, LocalDate reqOut, Reservation r) {\n    return reqIn.isAfter(r.checkOut()) || reqOut.isBefore(r.checkIn());\n}',
    o: [
      'reqOut should use isAfter instead of isBefore',
      'Wrong overlap formula — this detects NON-overlap correctly, but uses strict isBefore(checkIn) which means adjacent bookings (reqOut == checkIn) are flagged as overlapping. The correct availability test is: reqIn.isBefore(r.checkOut()) && r.checkIn().isBefore(reqOut)',
      'Should use isEqual instead of isAfter',
      'The method should be synchronized'
    ], a: 1,
    why: 'Adjacent bookings should be allowed: check-out Thursday, check-in Thursday is fine (half-open [Thu, Thu) occupies nothing). The strict isBefore means if reqOut equals r.checkIn, the condition is false — no overlap — which is actually correct for that boundary. But the overall OR logic returns "available" when reqIn == r.checkOut OR reqOut == r.checkIn, missing some overlap cases. The iron formula: overlap exists when reqIn < r.checkOut AND r.checkIn < reqOut (both strict for half-open).'
  },
  {
    code: '// In Auction.removeBid()\nvoid removeBid(String bidderId) {\n    bids.removeIf(b -> b.bidderId().equals(bidderId));\n}',
    o: [
      'removeIf needs a Predicate, not a lambda',
      'Bids must be append-only — deleting bid history is fraud; mark bid RETRACTED in a status field instead, never physically remove it',
      'The method should return a boolean',
      'bidderId comparison should use == for String interning'
    ], a: 1,
    why: 'An auction bid is an event in an audit log. Once placed, a bid changes the market — other bidders may have reacted to it. Physically deleting it corrupts the history and enables fraud. The correct design: bids is an append-only List<Bid>; retracting means appending a new Bid with status=RETRACTED. The "current highest bid" is derived from this log, ignoring retracted entries.'
  },
  {
    code: '// Social feed pagination\nList<Post> loadFeed(String userId, int page) {\n    return feedItems.stream()\n        .skip(page * PAGE_SIZE)  // offset-based!\n        .limit(PAGE_SIZE)\n        .collect(toList());\n}',
    o: [
      'PAGE_SIZE should be a constant, not a variable',
      'Offset pagination breaks on insert — a new post prepended to the feed shifts all items, so page 2 re-shows the last item of page 1; use cursor: tailMap(lastSeenId) instead',
      'collect(toList()) should be collect(toUnmodifiableList())',
      'skip() is O(n) and should be replaced with limit()'
    ], a: 1,
    why: 'When a new post arrives and is inserted at position 0, every subsequent item shifts by 1. The user on page 2 now receives items [PAGE_SIZE, 2*PAGE_SIZE), which includes the item that was at PAGE_SIZE-1 on their first load — a duplicate. Cursor-based pagination uses the last-seen item\'s ID (e.g., a timestamp or auto-increment id) and fetches items newer/older than that — stable regardless of insertions.'
  },
  {
    code: '// Task status as enum\nenum TaskStatus { TODO, IN_PROGRESS, REVIEW, DONE }\nclass Task {\n    TaskStatus status;  // user cannot add a BLOCKED column!\n}',
    o: [
      'The enum needs a display name field',
      'Columns are runtime data — users create their own column names; hardcoding as an enum makes the board inflexible (cannot add, rename, or delete columns); store columnId: String instead',
      'status should be private with a getter',
      'DONE should be a terminal state enforced by the constructor'
    ], a: 1,
    why: 'A Trello-style board lets users create arbitrary columns ("Backlog", "In Flight", "QA", "Blocked", "Shipped"). An enum compiled into the binary cannot be changed at runtime. The task stores a String columnId that references a Column entity (which has a name, board reference, and position). This is the "columns as runtime data" insight from Day 74.'
  },
  {
    code: '// Hotel nightly price\ndouble totalPrice = nights * room.pricePerNight() * (1 + weekendSurcharge);\n// e.g. 3 × 4999.99 × 1.15 = 17249.9655 shown as ₹17249.97',
    o: [
      'weekendSurcharge should be an int percentage',
      'double arithmetic causes fractional-paise errors in billing — use BigDecimal with setScale(2, HALF_UP); 3 × 4999.99 × 1.15 in double may not round to exactly ₹17249.97',
      'nights should be a Duration, not an int',
      'pricePerNight() should be declared final'
    ], a: 1,
    why: 'IEEE 754 double cannot represent most decimal fractions exactly. Multiplying and adding doubles accumulates rounding errors that appear as wrong cents/paise on bills — a real financial error, not just a display issue. Use BigDecimal("4999.99") and multiply with HALF_UP rounding. This is the Day 20 (Value Objects / Money) and Day 53 (Splitwise penny problem) rule: all money in BigDecimal or a Money wrapper.'
  },
  {
    code: '// Auction settlement\nAuctionResult settle(String auctionId) {\n    Auction a = getAuction(auctionId);\n    if (a.status() == AuctionStatus.OPEN) {  // settles OPEN auction!\n        return processWinner(a);\n    }\n    throw new IllegalStateException("Not open");\n}',
    o: [
      'processWinner should check for null bids first',
      'Settlement guard is wrong — settlement should only be allowed from CLOSED state, not OPEN; an OPEN auction can still receive bids; the state machine transition is CLOSED → SETTLED',
      'IllegalStateException should be a checked exception',
      'getAuction should throw if the auction is not found'
    ], a: 1,
    why: 'An OPEN auction is still accepting bids. Settling it now charges the current highest bidder even though bidding may continue for hours. The correct guard: status must be CLOSED (bidding window expired, no more bids accepted). Only CLOSED → SETTLED is a valid transition. This is the state machine guarded-transition rule from Day 34 — illegal inputs are rejected, not processed.'
  },
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
      <div className="ptitle">Live demo · six snippets from this week's problems, one planted smell each — name it</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Score: <b>{score} / {SMELLS.length}</b> — every smell here costs real points in real rounds, and every fix was one of this week's seams. Re-run until 6/6 feels boring.</p>
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
              <button key={i}
                className={picked !== null && i === cur.a ? 'on' : ''}
                style={{ fontSize: 12.5, ...(picked === i && i !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}) }}
                onClick={() => pick(i)}>{o.length > 65 ? o.slice(0, 62) + '…' : o}</button>
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

/* ============ Interactive 3: rubric scorecard ============ */
const RUBRIC = [
  { cat: 'Scope', revisit: 'All W15 days', items: [
    'Named the defining problem in minute 1 (date-range overlap / snipe prevention / fan-out tradeoff / columns as runtime data)',
    'Asked 4–6 design-shaping questions before touching code',
    'Said what is OUT of scope, out loud',
  ]},
  { cat: 'Model', revisit: 'Days 71–74', items: [
    'Drew entity model with correct cardinalities (Member/Plan/GymClass or PullRequest/Comment/Review)',
    'Used half-open intervals for date/time ranges — back-to-back slots do not overlap',
    'Stated overlap formula: reqIn.isBefore(existOut) AND existIn.isBefore(reqOut)',
    'Modeled CLOSING state for snipe prevention (or analogous guard for pending state)',
    'Stored column reference as String columnId (not enum) OR kept bids append-only (not mutable)',
  ]},
  { cat: 'Code', revisit: 'Days 71–74', items: [
    'It compiles and the happy path runs end-to-end',
    'Booking check and insert are inside a single synchronized block (atomic)',
    'Cancellation window check compares now vs startTime.minus(2h) correctly',
    'Merge eligibility check is a CONJUNCTION: all approvals AND no open comments',
    'Money/price stored as BigDecimal or a Money type, not double',
  ]},
  { cat: 'Concurrency & Reliability', revisit: 'Days 71–72', items: [
    'Mentioned the check-then-act race and its fix (synchronized find+book)',
    'Named at least one guard preventing illegal state transitions',
    'Mentioned idempotency or at-least-once for money/booking operations',
  ]},
  { cat: 'Communication', revisit: 'All days', items: [
    'Named at least 3 design patterns by name (Command, Strategy, Observer, State, etc.)',
    'Mentioned cursor-based vs offset pagination and justified cursor',
    'Drew at least one ASCII diagram (entity model or state machine)',
  ]},
]
const TOTAL_ITEMS = RUBRIC.reduce((n, g) => n + g.items.length, 0)

function RubricScorecard() {
  const [checked, setChecked] = useState({})
  const score = Object.values(checked).filter(Boolean).length
  const toggle = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }))
  const gaps = RUBRIC.filter((g) => g.items.some((_, i) => !checked[g.cat + i]))

  let verdict, color
  if (score >= 14) { verdict = '🟢 Hire signal — strong Week 15. Run the other track at 25 minutes for speed polish, then move to Week 16.'; color = '#EAF7EF' }
  else if (score >= 10) { verdict = '🟡 Strong maybe — restudy ONLY the flagged days below, then drill the OTHER track at full length.'; color = '#FFF1D6' }
  else if (score >= 6) { verdict = '🔴 Needs work — re-do the flagged days actively (type the code, don\'t reread), then re-drill this SAME track.'; color = '#FDECEC' }
  else { verdict = '🔴 Not ready — rebuild fundamentals; revisit the flagged days before any further drilling.'; color = '#FDECEC' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · grade your drill like an interviewer — honestly, immediately after pens-down</div>
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
  { q: 'The drill clock starts. The FIRST thing you do?',
    o: ['Name the patterns you plan to use', 'Open a Java file and start the entity classes', 'Draw a full UML class diagram', 'Write 4–6 clarifying questions on paper and state exclusions out loud — the questions shape every decision and are graded'],
    a: 3,
    e: 'The protocol is invariant: clarify before code. The domain is vague on purpose — your questions reveal the real constraints (is booking by night or hour? how many reviewers? what\'s the celebrity threshold?).',
    w: { 0: 'Pattern selection happens after scope — patterns are driven by constraints, not the other way.', 1: 'Entities before scope are entities for the wrong problem.', 2: 'A quick entity TABLE is all you need; full UML art wastes the clock.' },
    r: { id: 's1', label: 'Section 1 — the protocol' } },
  { q: 'Track A (Gym Membership): two members simultaneously call book() and both see capacity = 9/10. What happens without synchronization?',
    o: ['Both bookings succeed — capacity becomes 11/10; classic check-then-act race; fix: synchronized block covering check AND insert', 'The second booking blocks until the first completes', 'Nothing — the check is read-only so there is no race', 'A ConcurrentModificationException is thrown'],
    a: 0,
    e: 'Reading capacity and then inserting a booking are two separate steps. Both threads read 9 < 10, both proceed. Each inserts a booking — now capacity is 11. A synchronized block covering both the check and the insert collapses them into one atomic operation.',
    w: { 1: 'No synchronization means no blocking — both threads proceed in parallel.', 2: 'Read-only checks are not atomic with the subsequent write — another thread can win the race between the read and the write.', 3: 'ConcurrentModificationException is a different issue (modifying a list while iterating).' },
    r: { id: 's4', label: 'Section 4 — Track A' } },
  { q: 'Track B (Code Review): all assigned reviewers have APPROVED a PR, but two comments are still open (unresolved). Should the PR merge?',
    o: ['No — merge eligibility is a conjunction: ALL approvals AND NO open comments; one open comment blocks merge even if all reviewers approved', 'Only if the author resolves one of the two comments', 'Yes — all reviewers approved, so it merges', 'Only if a reviewer marks the PR as APPROVED again after comments are resolved'],
    a: 0,
    e: 'The merge check must be: pr.assignedReviewers.stream().allMatch(r -> pr.approvals.contains(r)) AND pr.comments.stream().noneMatch(c -> !c.resolved()). Both conditions must be true. Missing the second condition is the planted trap in Track B.',
    w: { 1: 'Resolving one of two is still one unresolved — the PR still cannot merge.', 2: 'Approvals alone are not sufficient — open comments represent unaddressed review feedback that blocks the merge.', 3: 'The approval is already recorded; re-approving is not how GitHub-style reviews work.' },
    r: { id: 's5', label: 'Section 5 — Track B' } },
  { q: 'Do two hotel reservations overlap? Reservation A: Mon–Thu. Reservation B: Thu–Sat. (Half-open intervals [checkIn, checkOut))',
    o: ['They partially overlap but it is allowed', 'No — Thursday is the check-out day for A and check-in for B; half-open means A does not occupy Thursday; the next guest can check in the same day', 'It depends on the check-out time', 'Yes — they share Thursday'],
    a: 1,
    e: 'Half-open intervals: [Mon, Thu) means the room is occupied Monday, Tuesday, Wednesday — NOT Thursday. [Thu, Sat) means occupied Thursday and Friday. They share no occupied night. Back-to-back bookings are always allowed with half-open intervals.',
    w: { 0: 'There is no partial overlap — the intervals are disjoint by design.', 2: 'In this design, check-out is the exclusive end of the interval; time-of-day is out of scope.', 3: 'If intervals were closed [Mon, Thu] and [Thu, Sat], then Thu would be double-booked. Half-open solves exactly this.' },
    r: { id: 's2', label: 'Section 2 — skills table' } },
  { q: 'An auction is in OPEN state. A bid arrives 3 minutes before the auction closes. What should the CLOSING state do?',
    o: ['Transition directly to SETTLED', 'Accept the bid and extend the endTime by 5 minutes, transitioning to CLOSING state to prevent snipe bidding', 'Accept the bid and close immediately', 'Reject the bid — the auction is almost over'],
    a: 1,
    e: 'Snipe prevention: a bid in the last 5 minutes extends the auction end time by another 5 minutes (the CLOSING state). This gives other bidders a fair chance to respond. OPEN → CLOSING happens on that late bid. The auction finally reaches CLOSED when the extended window expires with no further late bids.',
    w: { 0: 'SETTLED requires CLOSED first; the auction must finish accepting bids before settlement.', 2: 'Closing immediately after a late bid is exactly snipe bidding — the system should prevent it.', 3: 'Rejecting a bid because the auction is nearly over is unfair — the auction is still OPEN.' },
    r: { id: 's2', label: 'Section 2 — skills table' } },
  { q: 'Why does offset-based feed pagination break when a new post is inserted?',
    o: ['Because offset is an int and can overflow', 'Because the feed is sorted in reverse and skip() counts from the wrong end', 'A new post at position 0 shifts every subsequent item by 1 — the user\'s "page 2" now re-shows the last item of page 1 as a duplicate', 'Because List.stream().skip() is lazy and not cached'],
    a: 2,
    e: 'Offset means "skip N items". If a new post is inserted before item N, what was item N is now item N+1 — so skipping N items lands on what was N-1, showing a duplicate. Cursor pagination uses the last-seen item\'s stable ID, so insertions before it do not affect the next page.',
    w: { 0: 'int overflow would only happen with billions of posts — not a practical concern.', 1: 'The direction of sorting does not change the offset-shift problem.', 3: 'Laziness and caching are unrelated to the duplicate-on-insert bug.' },
    r: { id: 's2', label: 'Section 2 — skills table' } },
  { q: 'A task board user creates a new column called "Blocked". With the enum-column design, what happens?',
    o: ['The task.status field is set to null for that column', 'The system adds a new enum constant at runtime', 'The column is stored as a string but mapped to the nearest enum constant', 'It is impossible — adding a column requires recompiling the code; the board is inflexible by design'],
    a: 3,
    e: 'Enums are compile-time constants. A runtime user action cannot add a new enum constant. This is exactly why columns must be stored as data (a Column entity with a name and boardId) and tasks reference them by columnId: String. The Day 74 insight: columns are data, not code.',
    w: { 0: 'A null status would crash any code that reads the task\'s column.', 1: 'Java enums are compiled into bytecode — they cannot be extended or added at runtime.', 2: 'Mapping to the nearest enum constant loses information and produces wrong states.' },
    r: { id: 's2', label: 'Section 2 — skills table' } },
  { q: 'A user moves Task T from "In Progress" to "Review", then moves it to "Done". Then they click Undo. What happens to the redo stack?',
    o: ['Nothing — redo is cleared only by Undo, not by moves', 'The redo stack is cleared — it was cleared when the move to Done was performed as a new move', 'The redo stack contains [move to Done]', 'The redo stack contains [move to Review]'],
    a: 2,
    e: 'After Undo of "move to Done", the redo stack contains that undone move: [move to Done]. The redo stack IS cleared when a NEW move is made (to prevent branching history), but Undo only pops the history stack and pushes to redo — it does not clear redo.',
    w: { 0: 'Redo is cleared when a NEW move is made, not when Undo is called — Undo is the operation that populates redo.', 1: 'Redo is cleared by a new move, not by Undo itself. At this point no new move has been made — only Undo.', 3: 'The redo stack holds the most recently undone operation, which is "move to Done", not "move to Review".' },
    r: { id: 's2', label: 'Section 2 — skills table' } },
]

/* ============ The page ============ */
export default function Day75() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 15 · Day 75</div>
        <h1>Week 15 Drill:<br />Date Ranges, Auctions, Feeds &amp; Boards, Under the Clock</h1>
        <p>Hotel Booking, Online Auction, Social Feed, Task Board — four domains, four distinct shapes,
           all made of muscles you already have. Today you attack two fresh problems solo under a real timer,
           hunt for six planted smells, then grade yourself against the rubric. The only new skill this week
           is recognising the shape under the new label.</p>
        <div className="chips">
          {['timed drill', 'date-range overlap', 'state machine transfer', 'cursor pagination', 'columns as data', 'smell hunt', 'self-grading rubric'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* s1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The drill protocol: same rules, new domain</h2>
        <p>A drill is not study time. It is a <strong>dress rehearsal</strong>: same constraints, same pressure,
          same clock — so on interview day nothing is happening for the first time.</p>
        <Code html={`  THE DRILL PROTOCOL (unchanged from every prior drill day)

  RULES (non-negotiable):
  · real keyboard, real project, timer VISIBLE
  · no peeking at Days 71–74 until the review phase
  · the code must COMPILE when the bell rings
  · talk out loud the whole time (narration is a separate muscle)
  · when the timer ends, PENS DOWN — interviews don't grant extensions

  THE 45-MINUTE SHAPE
  ──────────────────────────────────────────────────────────────
   0– 5   clarify + scope out loud      ← the questions are graded
   5–12   entities + relationships + enums (a TABLE, not UML art)
  12–35   CODE bottom-up: bricks → core flow → wiring
                                        ← compile every ~8 minutes
  35–42   drive the happy path + ONE edge case
  42–45   self-review against the rubric (Section 7)

  WEEK 15 SHAPE-TRANSFER TELLS (say these before you start):
  Hotel Booking  → "date range = two numbers; overlap = A<D AND C<B; book = atomic"
  Online Auction → "bids are append-only; CLOSING = snipe guard; settle only from CLOSED"
  Social Feed    → "fan-out vs pull; celebrities pull; cursor not offset"
  Task Board     → "columns are data; task has columnId:String; move = Command with undo"`} />
        <Note><strong>Week 15 tells (the shape-transfer tells):</strong> Hotel / Gym share the date-range
          overlap check and atomic booking CAS (Day 51 seat-claim re-skinned). Auction / Code-Review both have
          a state machine with a gate condition before the final transition. Feed / any paginated list needs
          cursor pagination. Task Board / any list-with-order uses TaskMoveCommand with undo and redo-clear on
          new move. Spotting the shape in the first 2 minutes of scoping is the whole point of this week.</Note>
      </section>

      {/* s2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Week 15 skills inventory — what the drill actually tests</h2>
        <p>Four days, eight transferable skills. The two tracks below are new on the surface and 100% made of
          this table underneath:</p>
        <table className="matrix">
          <thead>
            <tr><th>skill</th><th>source day</th><th>interview signal</th></tr>
          </thead>
          <tbody>
            <tr><td>Date-range overlap formula (A&lt;D AND C&lt;B, half-open intervals)</td><td>Day 71</td><td>"two ranges overlap unless one ends before the other starts"</td></tr>
            <tr><td>Atomic hotel room claim (synchronized find+book to prevent double-booking)</td><td>Day 71</td><td>"check-then-act race; synchronized block covers both check and insert"</td></tr>
            <tr><td>Auction state machine with CLOSING state (snipe prevention)</td><td>Day 72</td><td>"bid in final 5 min → extend endTime, flip to CLOSING"</td></tr>
            <tr><td>Reserve price check at settlement, not during bidding</td><td>Day 72</td><td>"reserve is secret; check only when CLOSED → SETTLED"</td></tr>
            <tr><td>Fan-out-on-write vs pull-on-read, hybrid at celebrity threshold</td><td>Day 73</td><td>"regular users fan-out; celebrities pull-on-read"</td></tr>
            <tr><td>Cursor-based pagination (stable across inserts, unlike offset)</td><td>Day 73</td><td>"cursor = last seen ID; offset shifts when new items arrive"</td></tr>
            <tr><td>Columns as runtime data, not a compile-time enum</td><td>Day 74</td><td>"column names live in DB; task position = int field"</td></tr>
            <tr><td>TaskMoveCommand.execute/undo with history + redo-clear-on-new-move</td><td>Day 74</td><td>"undo pops history; new move clears redo stack"</td></tr>
          </tbody>
        </table>
      </section>

      {/* s3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>⏱ The drill clock</h2>
        <p>Use this for the real thing. The phase bar scales to the length you pick — 45 min for the full
          rehearsal, 25 min for speed reps once you are green:</p>
        <DrillTimer />
        <Good><strong>How to use it:</strong> read a track below, write your clarifying questions first, then
          press start and open that track's "interviewer's answers" reveal. The nudge line tells you what
          phase you should be in. If you're still modelling entities when it says "code bottom-up", that's
          the drill teaching you something real.</Good>
      </section>

      {/* s4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Track A · "Design a Gym Membership System."</h2>
        <p>That's the whole prompt. Write your 4–6 clarifying questions on paper <em>before</em> opening the
          answers. The shape transfer: a gym class slot is a hotel room night. The booking flow is identical.
          One of the seams has a planted concurrency trap.</p>
        <Warn><strong>Do not open the reveals until your questions are written.</strong> Reading the answers first
          turns a rep into a rerun. The clarifying muscle is what this track exists to train.</Warn>
        <Reveal summary="🔒 The interviewer's answers — open AFTER writing your questions">
          <p><strong>What does a membership plan cover?</strong> Each plan (MONTHLY, QUARTERLY, ANNUAL) grants
            access to a set of facilities: e.g. BASIC = gym floor only; PREMIUM = gym floor + pool;
            ELITE = gym floor + pool + classes.
            <br /><strong>What is a "class"?</strong> A scheduled session (yoga, spin, boxing) with a fixed
            instructor, facility type, start time, duration, and capacity limit.
            <br /><strong>Booking rules?</strong> A member can book a class only if their plan covers that
            facility type AND the class is not full.
            <br /><strong>Cancellation window?</strong> A booking can be cancelled up to 2 hours before the
            class start time. Past that window: no cancellation.
            <br /><strong>Out of scope:</strong> waitlists, recurring bookings, payment processing (plans are
            pre-paid), instructor scheduling.
            <br /><strong>Sneaky follow-up at minute 40:</strong> "add a waitlist so members can queue for a
            full class and auto-book if a cancellation opens a slot."</p>
        </Reveal>
        <Reveal summary="🔒 Model-answer skeleton + THE TRAP — open ONLY during the review phase">
          <Code html={`  TRACK A — the shape is Day 71 (Hotel Booking) / Day 51 (BookMyShow seat claim)

  ENTITY MODEL
  ────────────
  enum FacilityType { GYM_FLOOR, POOL, CLASSES }
  enum PlanTier { BASIC, PREMIUM, ELITE }
  class MembershipPlan {
      PlanTier tier;
      Set&lt;FacilityType&gt; facilities;  ← BASIC={GYM_FLOOR}, ELITE=all
      Money monthlyPrice;
      int durationDays;                ← 30/90/365
  }
  class Member {
      String id, name;
      MembershipPlan plan;
      Instant planExpiresAt;           ← checked on every booking
  }
  class GymClass {
      String id, instructorId;
      FacilityType facilityType;
      Instant startTime;
      int durationMin, capacity;
      List&lt;Booking&gt; bookings;        ← THE RESOURCE; synchronized on book()
  }
  record Booking(String id, String memberId, String classId,
                 Instant bookedAt, BookingStatus status)
  enum BookingStatus { CONFIRMED, CANCELLED }

  BOOKING FLOW
  ────────────
  1. check member.planExpiresAt.isAfter(now)   ← plan still active?
  2. check member.plan.facilities.contains(
         gymClass.facilityType)                 ← plan covers this facility?
  3. SYNCHRONIZED on gymClass {
       3a. check gymClass.bookings.size()
               &lt; gymClass.capacity            ← capacity check INSIDE lock!
       3b. create Booking(id, member, class, now, CONFIRMED)
       3c. gymClass.bookings.add(booking)
     }                                          ← lock released here
  4. return booking                             ← emit Observer event if waitlist

  CANCELLATION FLOW
  ─────────────────
  1. find booking (throw if not CONFIRMED)
  2. if now.isBefore(gymClass.startTime.minus(Duration.ofHours(2))) {
         booking.status = CANCELLED;
         gymClass.bookings.remove(booking);
         notifyWaitlist();                      ← Observer: first in queue gets it
     } else {
         throw new CancellationWindowClosedException();
     }

  ⚠ THE PLANTED TRAP: step 3a outside the synchronized block.
  Two members both see bookings.size() == 9 &lt; 10 (capacity).
  Both pass the check. Both insert a booking. Capacity = 11.
  Fix: the entire "check size + add booking" block must be
  synchronized on the GymClass object. Same pattern as:
    · BookMyShow ShowSeat.tryHold() (Day 51)
    · Hotel Room atomic booking (Day 71)
    · Locker CAS (Day 68)

  WAITLIST (minute-40 diff): add Queue&lt;String&gt; waitlist per GymClass.
  On cancellation: pop head of waitlist, create a CONFIRMED booking
  for them (still inside a synchronized block), and notify via Observer.
  The new booking skips capacity check because the slot just freed.`} />
        </Reveal>
      </section>

      {/* s5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Track B · "Design a Code Review System." (with a planted trap)</h2>
        <p>Same discipline: questions on paper first. This is Day 72 (Auction state machine) + Day 74 (Task
          Board approval aggregation) re-skinned as a software development workflow. A PR has reviewers;
          reviewers approve or request changes; there is a merge gate. Somewhere inside it, a conjunction
          check is missing. Find it during the drill.</p>
        <Reveal summary="🔒 The interviewer's answers — open AFTER writing your questions">
          <p><strong>What is a PR?</strong> A request to merge a source branch into a target branch.
            It has a title, a description, and a diff (out of scope to model in detail).
            <br /><strong>Who reviews?</strong> Authors can assign specific reviewers. Others can self-assign.
            A reviewer submits a verdict: APPROVED, CHANGES_REQUESTED, or COMMENTED.
            <br /><strong>What does it take to merge?</strong> All assigned reviewers must have submitted
            APPROVED, AND all comments must be resolved (no open threads).
            <br /><strong>Can a reviewer change their verdict?</strong> Yes — if the author pushes new commits
            after CHANGES_REQUESTED, the reviewer can re-approve.
            <br /><strong>Out of scope:</strong> CI checks, branch protection rules, actual git operations.
            <br /><strong>Sneaky follow-up at minute 40:</strong> "a reviewer approves but then the author
            force-pushes a new commit. Should the approval still count?"</p>
        </Reveal>
        <Reveal summary="🔒 Model-answer skeleton + THE TRAP — open ONLY during the review phase">
          <Code html={`  TRACK B — state machine from Day 72 (Auction) + aggregate check from Day 74

  ENTITY MODEL
  ────────────
  enum PRStatus { OPEN, IN_REVIEW, APPROVED, MERGED, CLOSED }
  enum ReviewVerdict { APPROVED, CHANGES_REQUESTED, COMMENTED }
  class PullRequest {
      String id, authorId, title, sourceBranch, targetBranch;
      PRStatus status;
      Set&lt;String&gt; assignedReviewers;        ← assigned reviewer IDs
      Map&lt;String, ReviewVerdict&gt; verdicts;  ← reviewerId → latest verdict
      List&lt;Comment&gt; comments;
  }
  record Comment(String id, String prId, String authorId,
                 String lineRef, String body, boolean resolved)
  record Review(String prId, String reviewerId,
                ReviewVerdict verdict, Instant submittedAt)

  REVIEW FLOW
  ───────────
  submitReview(prId, reviewerId, verdict):
    1. find PR (must be OPEN or IN_REVIEW)
    2. pr.verdicts.put(reviewerId, verdict)    ← overwrites old verdict
    3. if (pr.status == OPEN) pr.status = IN_REVIEW
    4. checkAndTransitionToApproved(pr)

  MERGE ELIGIBILITY CHECK
  ───────────────────────
  boolean canMerge(PullRequest pr) {
      boolean allApproved = pr.assignedReviewers.stream()
          .allMatch(r -&gt; pr.verdicts.getOrDefault(r, COMMENTED)
                            == APPROVED);
      boolean noOpenComments = pr.comments.stream()
          .noneMatch(c -&gt; !c.resolved());
      return allApproved &amp;&amp; noOpenComments;   ← CONJUNCTION: both required
  }

  ⚠ THE PLANTED TRAP: checking only allApproved and ignoring noOpenComments.
  A reviewer submits APPROVED but leaves 2 comment threads open.
  The naive check: if (allApproved) → MERGE — merges despite open comments.
  The correct check requires BOTH conditions. This is like an airport
  departure: all passengers boarded (approvals) AND all bags loaded
  (comments resolved). Either gate failing holds the flight.

  STATE MACHINE
  ─────────────
  OPEN ─[first review]──▶ IN_REVIEW
       ─[all approved + no open comments]──▶ APPROVED ─[merge()]──▶ MERGED
       ─[close()]──▶ CLOSED (from OPEN or IN_REVIEW only)
  APPROVED can revert to IN_REVIEW if author pushes new commits
  (new commit invalidates previous approvals — the minute-40 question).

  FORCE-PUSH FOLLOW-UP (minute-40 diff):
  On authorPushCommit(prId): clear pr.verdicts (all approvals reset),
  set status back to IN_REVIEW, notify all assignedReviewers (Observer).
  This is the "stale approval" problem — the reviewer approved a diff
  that no longer exists. GitHub does exactly this.`} />
          <Note><strong>Why the shapes are the same:</strong> PRStatus machine = AuctionStatus machine (Day 72).
            The merge gate = "all bidders paid AND reserve met" at settlement. The conjunction check
            (allApproved AND noOpenComments) = "all conditions must hold before the final transition". Recognising
            the gate pattern tells you where the trap lives before you even read the code.</Note>
        </Reveal>
      </section>

      {/* s6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔎 Play: the smell hunt</h2>
        <p>Warm up your reviewer's eye before grading yourself. Six snippets from this week's problems, one
          planted smell each — name it before the options tempt you:</p>
        <SmellHunt />
        <Good><strong>What you should notice:</strong> ① Every smell has a name from this week — wrong overlap
          formula, append-only violation, offset pagination, enum-as-data, double money, wrong settlement gate.
          ② The fix is always a seam, not careful typing. ③ The reviewer's eye you just used on strangers'
          code is the one Section 7 asks you to point at your own drill.</Good>
      </section>

      {/* s7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>📋 The rubric: grade yourself like an interviewer</h2>
        <p>Immediately after pens-down — while the memory is honest — check off only what you ACTUALLY did,
          not what you knew you should do:</p>
        <RubricScorecard />
        <Code html={`  THE REVIEW LOOP — the rep isn't over at pens-down

  drill (45') ──▶ rubric score ──▶ write your TOP-2 gaps
                                          │
       ▲                                  ▼
       └── re-drill (other track) ◀── restudy ONLY the gap days (actively:
            25' once you're green        type the code, don't reread the page)

  Verdict bands:  14–17 ✅  hire signal
                  10–13 🟡  strong maybe — one more targeted rep
                   6– 9 🔴  needs work — rebuild gap days first
                   < 6  🔴  not ready — pause drills, rebuild fundamentals`} />
        <Warn><strong>The rubric only works if it hurts a little.</strong> "I would have used synchronized"
          is unchecked. "I knew the conjunction check needed both conditions but forgot" is unchecked. The
          checkbox standard is: an interviewer watching your screen during the drill would have seen/heard it.</Warn>
      </section>

      {/* s8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>🕳 Drill failure modes — how good reps go bad</h2>
        <Warn><strong>Off-by-one on the overlap formula.</strong> "reqIn &lt;= existOut" instead of "&lt;" lets
          adjacent bookings block each other (check-out Thursday blocks check-in Thursday). Use strict less-than
          with half-open intervals. Write the formula on paper before the clock starts.</Warn>
        <Warn><strong>Capacity check outside the synchronized block.</strong> The gap between reading size and
          inserting the booking is the race. If you write the check and the insert as two separate statements
          with no lock, you have written the trap, not the fix.</Warn>
        <Warn><strong>Settling an OPEN auction.</strong> The CLOSING state exists for a reason. If you go
          OPEN → SETTLED directly, you missed the snipe guard and the "no more bids" guarantee. Always draw
          the state machine before the code.</Warn>
        <Warn><strong>Offset pagination in the feed.</strong> The moment you write <C>.skip(page * size)</C> in
          a real-time feed, a new post breaks the next page. Use cursor. If you forget, the smell hunt snippet
          3 is the reminder.</Warn>
        <Warn><strong>Enum columns.</strong> The first instinct is <C>enum TaskStatus {'{'} TODO, IN_PROGRESS, DONE {'}'}</C>.
          The clarifying question "can users add columns?" collapses that design in minute 2. Ask it every time.</Warn>
        <Warn><strong>The rep without the review.</strong> An ungraded drill trains your existing habits,
          including the bad ones, now faster. Ten honest minutes with the rubric is where improvement lives.</Warn>
      </section>

      {/* s9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>📋 Cheat sheet — the pocket script for Week 15 domains</h2>
        <Code html={`  WEEK 15 SHAPES AT A GLANCE

  Hotel / Gym     → overlap = reqIn < existOut AND existIn < reqOut
  (date-range)      half-open: [checkIn, checkOut); back-to-back OK
                    atomic: synchronized { check capacity + insert booking }
                    cancellation: if now < startTime.minus(2h) → allow

  Auction         → DRAFT → OPEN → CLOSING (snipe guard, bid extends window)
  (state machine)   → CLOSED → SETTLED (reserve check happens HERE, not earlier)
                    bids = append-only log; retraction = new RETRACTED bid entry

  Social Feed     → fan-out-on-write for regular users (pre-push to follower feeds)
  (pagination)      pull-on-read for celebrities (follower count > threshold)
                    cursor pagination: fetch where id > lastSeenId LIMIT N
                    never: .skip(page * size) in a live feed

  Task Board      → Column is an entity (name, boardId, position: int)
  (data model)      Task stores columnId: String + position: int
                    move = TaskMoveCommand(task, fromCol, toCol, fromPos, toPos)
                    undo = swap back; redo stack cleared on NEW move

  PRICE / MONEY everywhere: BigDecimal with HALF_UP, never double`} />
        <ul>
          <li><strong>Overlap formula (memorize):</strong> two ranges [A,B) and [C,D) overlap when A &lt; D AND C &lt; B. Non-overlap is A &gt;= D OR C &gt;= B. Half-open means equals is NOT overlap.</li>
          <li><strong>The atomic claim appears everywhere:</strong> hotel room, gym class slot, auction bid (CAS on state), code review approval — always synchronized check + action or CAS.</li>
          <li><strong>Two-condition gates:</strong> Hotel (room free AND dates valid), Auction settlement (CLOSED AND reserve met), PR merge (all approved AND no open comments). Missing one condition is the trap.</li>
          <li><strong>Cursor vs offset:</strong> offset breaks on insert; cursor (last-seen ID) is stable. Say this before every pagination problem.</li>
          <li><strong>Review loop:</strong> drill → rubric → top-2 gaps → restudy those days actively → re-drill the other track. Green twice = Week 15 is genuinely yours.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 Week 15 questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Hotel check-in is Monday, check-out Thursday — is Thursday occupied?"'>
          <p>No. The interval is half-open: [Monday, Thursday). The room is occupied Monday, Tuesday,
            Wednesday — not Thursday. Thursday is FREE for the next guest to check in. This is why half-open
            intervals matter: they allow back-to-back bookings without overlap. If you used a closed interval
            [Monday, Thursday], Thursday would be double-booked with any guest arriving that day.</p>
        </Reveal>
        <Reveal summary='Q: "A seller wants to cancel an auction after 3 bids. Can they?"'>
          <p>This is a business-policy decision, not a technical one. Technically: cancellation from OPEN state
            is possible if the system allows a CANCELLED transition. But after bids arrive, cancellation requires
            refunding all bidders — typically enforced by a <C>CancellationPolicy</C> that checks bid count and
            bid amounts before allowing the OPEN → CANCELLED transition. Most auction platforms disallow seller
            cancellation after the first bid (or charge a fee). The state machine design should reflect whatever
            policy the business chooses — the key insight is that the state machine makes the policy explicit
            and enforced, not implicit.</p>
        </Reveal>
        <Reveal summary='Q: "Two users open the same Instagram post at the same moment — one sees 100 likes, one sees 101. Why?"'>
          <p>Eventual consistency. Like counts use approximate counters — typically counter sharding or
            HyperLogLog — where different replicas may have slightly different counts at any moment. The
            count is not read from a single authoritative source; it is aggregated from distributed shards.
            One user's read hits a shard that hasn't received the latest like yet; the other hits a shard that
            has. Both views are correct in an eventually-consistent model. Exact like counts are a read-your-
            writes problem, not a strong consistency requirement. This is why social platforms trade precision
            for scale.</p>
        </Reveal>
        <Reveal summary='Q: "A Trello user deletes a column. What happens to the tasks in it?"'>
          <p>Policy decision: most boards soft-delete. The column is marked <C>deleted: true</C> (or moved to
            an "Archived" state) and its tasks become orphaned — they retain their <C>columnId</C> reference
            but the column is hidden from the board view. Tasks are accessible via search or an "Archived"
            panel until a hard-delete purge runs. Cascade-deleting tasks is destructive and usually not what
            users want (they may want to recover tasks after an accidental column deletion). The <C>columnId:
            String</C> data-model design makes soft-delete natural — no enum constant to remove.</p>
        </Reveal>
        <Reveal summary='Q: "How would you add WIP limits to the task board?"'>
          <p>Add a <C>wipLimit: int</C> field to the <C>Column</C> entity (0 = no limit). In
            <C>TaskMoveCommand.execute()</C>, before inserting the task into the target column, check:
            <br /><br />
            <code>if (targetColumn.wipLimit() &gt; 0 &amp;&amp; targetColumn.tasks().size() &gt;= targetColumn.wipLimit()) {'{'}</code>
            <br />&nbsp;&nbsp;<code>throw new WipLimitExceededException(targetColumn.name(), targetColumn.wipLimit());</code>
            <br /><code>{'}'}</code>
            <br /><br />
            The WIP limit check is inside <C>execute()</C> so that undo works correctly (moving a task
            OUT of a column never violates a WIP limit). The <C>undo()</C> method bypasses the limit check
            because it is restoring a previous valid state. This is a business-rule guard inside a Command —
            the same pattern as the booking capacity check.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s10">
        <div className="sec-label">Section 10 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Read every explanation, even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 75 complete?</strong> Homework IS the day: run <strong>Track A at 45 minutes</strong> today
        — full protocol, out loud, rubric immediately after, top-2 gaps written down. Tomorrow (or after a
        gap-day restudy if you scored red), run <strong>Track B at 45 minutes</strong> and see whether the
        planted conjunction trap catches you. Green on both = Week 15 is genuinely yours.
        <br /><br />
        Next: <strong>Week 16 — Mock Interviews, Full Course Recap &amp; Graduation</strong>: timed mock
        interviews across all four months, a complete Month 1–4 recap table, and the final graduation
        checklist. The whole course in one place.
      </div>
    </div>
  )
}
