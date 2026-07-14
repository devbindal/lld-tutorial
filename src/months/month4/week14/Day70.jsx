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
    code: '// In Game.java\nString moves = "";\nif (piece instanceof Rook) moves = rookMoves(from);\nelse if (piece instanceof Bishop) moves = bishopMoves(from);\nelse if (piece instanceof Knight) moves = knightMoves(from);',
    o: [
      'Missing a null check on piece',
      'Type-switch violates OCP/polymorphism — piece.legalMoves(board, from) knows its own rules. Each new piece type opens this switch. The fix: abstract Piece.legalMoves() (Day 66)',
      'The variable should be a List, not a String',
      'rookMoves should be static'
    ], a: 1,
    why: 'When behavior depends on the type of an object, polymorphism is the cure. Each piece class overrides legalMoves() — adding a new piece = adding one file, not editing the switch.'
  },
  {
    code: '// Find nearest delivery agent\nagents.stream()\n  .filter(a -> a.status() == AVAILABLE)\n  .min(comparing(a -> distance(a.location(),\n       order.customer().address())));  // matching to customer!',
    o: [
      'filter should use equals(), not ==',
      'Matching agent to CUSTOMER address — the agent needs to PICK UP food at the restaurant first. Match to order.restaurant().location() instead (Day 67)',
      'Stream.min returns an Optional, need .get()',
      'AVAILABLE should be a String'
    ], a: 1,
    why: 'The delivery flow is: agent → restaurant → customer. Nearest to the customer minimises the last mile but ignores the pickup leg. The assignment that minimises restaurant distance (or restaurant ETA) is correct.'
  },
  {
    code: '// Amazon Locker slot assignment\nOptional<LockerSlot> slot = slots.stream()\n  .filter(s -> s.state() == AVAILABLE\n           && s.size().fits(pkg.size()))\n  .min(comparing(s -> s.size().rank()));\nslot.ifPresent(s -> s.setState(OCCUPIED));  // NOT atomic!',
    o: [
      'Should use findFirst(), not min()',
      'Check-then-act race: two couriers can both pass the filter simultaneously and both claim the same slot. Wrap the filter+setState in a synchronized block, or use compareAndSet on the slot state (Days 68, 62)',
      'The lambda is missing a return type',
      'fits() should be called on size, not pkg'
    ], a: 1,
    why: 'The gap between finding the slot and setting it OCCUPIED is the classic check-then-act race. CAS or a lock collapses those two steps into one atomic operation — exactly one courier wins.'
  },
  {
    code: '// Consumer processing loop\nfor (Message m : broker.read(topic, offset, 10)) {\n  broker.commitOffset(topic, groupId, offset + 1);  // committed BEFORE processing!\n  process(m);\n  offset++;\n}',
    o: [
      'offset should be a long, not an int',
      'Offset committed BEFORE processing — if process(m) throws, the message is marked done but was never handled (at-most-once / data loss). Always process first, THEN commit the offset (Day 69)',
      'broker.read() should use a while loop',
      'groupId should be final'
    ], a: 1,
    why: 'The commit order is the entire point of the offset model. Process → commit gives at-least-once (may replay, but nothing is lost). Commit → process gives at-most-once (data loss on crash). Interviewers plant exactly this.'
  },
  {
    code: '// OrderItem holds a reference to the live MenuItem\nclass OrderItem {\n  MenuItem menuItem;  // live reference!\n  int quantity;\n  Money lineTotal() {\n    return menuItem.price().multiply(quantity);  // uses LIVE price\n  }\n}',
    o: [
      'quantity should be a double',
      'Price not snapshotted — if the restaurant changes the menu price later, every existing order\'s total changes retroactively. Capture unitPrice: Money at order creation time (Days 67, 20)',
      'Should override toString()',
      'menuItem should be private'
    ], a: 1,
    why: 'An OrderItem must be immutable in its financial meaning. The price at order time is what the customer agreed to pay. Store unitPrice as a Money field, set in the constructor. This is the Value Object / price-snapshot pattern (Day 20).'
  },
  {
    code: '// Greedy locker assignment\nOptional<LockerSlot> best = slots.stream()\n  .filter(s -> s.state() == AVAILABLE)\n  .filter(s -> s.size().name().compareTo(\n               pkg.size().name()) >= 0)  // alphabetical!\n  .min(comparing(s -> s.size().name()));  // alphabetical ordering',
    o: [
      'name() should be toLowerCase()',
      'Alphabetical ordering of size names is wrong — LARGE < MEDIUM < SMALL alphabetically, so this ranks backwards (or incorrectly for any ordering). Use an explicit rank int field on the size enum (Days 68, 19 enum design)',
      'compareTo returns boolean, will not compile',
      'Should use Comparator.naturalOrder()'
    ], a: 1,
    why: 'Enum ordinal-trap variant: lexicographic sort on SMALL/MEDIUM/LARGE gives the wrong order (L < M < S alphabetically). An explicit rank field (SMALL=1, MEDIUM=2, LARGE=3) makes size ordering unambiguous and refactor-safe.'
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
      <div className="ptitle">Live demo · six snippets from this week's problems, each hiding one planted smell — name it</div>
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
  { cat: 'Scope', revisit: 'All W14 days', items: [
    'Named the defining problem in minute 1 (polymorphic movement / 3-party coordination / resource-sizing / append-only log)',
    'Asked 4–6 design-shaping questions before touching code',
    'Said what is OUT of scope, out loud',
  ]},
  { cat: 'Model', revisit: 'Days 66–69', items: [
    'Drew entity model with correct cardinalities (Board/Piece/Square; Order/Trip/MenuItem; Package/LockerSlot; Message/Channel/ConsumerGroup)',
    'Used enum or State classes for state machines — not raw strings',
    'Guarded all state transitions (canTransitionTo / illegal actions rejected)',
    'Matched delivery agent to restaurant location, not customer address',
    'Made pickup code / reservation an immutable Value Object or record',
  ]},
  { cat: 'Code', revisit: 'Days 66–69', items: [
    'It compiles and the happy path runs end-to-end',
    'Used polymorphism for piece movement (no type switch / instanceof chain)',
    'Chose greedy smallest-fitting slot (not random or largest)',
    'Snapshotted prices / data at order creation time (not live references)',
    'Used atomic CAS to prevent double-assignment (slot or agent)',
    'Committed consumer offset AFTER successful processing',
  ]},
  { cat: 'Pub-Sub correctness', revisit: 'Day 69', items: [
    'Distinguished push vs pull consumer model and justified choice',
    'Modeled consumer group (one message delivered to exactly one consumer in group)',
    'Mentioned dead-letter queue for failed messages',
  ]},
  { cat: 'Communication', revisit: 'All days', items: [
    'Named at least 3 design patterns used (Strategy, State, Command, Decorator, VO…)',
    'Mentioned a concurrency trap and its fix (CAS / atomic offset commit)',
    'Drew at least one ASCII diagram (board, state machine, or topic log)',
  ]},
]
const TOTAL_ITEMS = RUBRIC.reduce((n, g) => n + g.items.length, 0)

function RubricScorecard() {
  const [checked, setChecked] = useState({})
  const score = Object.values(checked).filter(Boolean).length
  const toggle = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }))
  const gaps = RUBRIC.filter((g) => g.items.some((_, i) => !checked[g.cat + i]))

  let verdict, color
  if (score >= 14) { verdict = '🟢 Hire signal — strong Week 14. Run the other track at 25 minutes for speed polish, then move to Week 15.'; color = '#EAF7EF' }
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
    o: ['Open a new Java file and start the Board class', 'Write 4–6 clarifying questions on paper and state exclusions out loud — the questions are graded and shape every decision after', 'Draw a full class diagram', 'Set up the project structure'],
    a: 1,
    e: 'The protocol is invariant: clarify before code. The domain is vague on purpose; the best questions reveal the real constraints (which pieces? how many players? pull or push consumers?).',
    w: { 0: 'Entities before scope are entities for the wrong problem.', 2: 'A quick entity TABLE is all you need; full UML art wastes the clock.', 3: 'Project setup happens before the timer.' },
    r: { id: 's1', label: 'Section 1 — the protocol' } },
  { q: 'Track A (Library Borrowing): a member has 2 active loans. Two threads simultaneously call borrowBook() and both pass the activeLoans.size() < 3 check. What happens?',
    o: ['Nothing — size() is atomic', 'The member ends up with 4 loans — classic check-then-act race; fix: synchronize on the member object or use an AtomicInteger loanCount with compareAndSet', 'A ConcurrentModificationException is thrown', 'The second borrow blocks until the first finishes'],
    a: 1,
    e: 'Reading size() and then adding a loan are two separate steps — another thread can win the race in between. CAS on an AtomicInteger (loanCount.incrementAndGet(); if count > 3 → decrement and reject) collapses it to one atomic op.',
    w: { 0: 'size() is not atomic with the subsequent add.', 2: 'ConcurrentModificationException is a different issue (modifying a collection while iterating).', 3: 'No synchronization → no blocking.' },
    r: { id: 's4', label: 'Section 4 — Track A' } },
  { q: 'Track B (Event Stream): you commit the consumer offset BEFORE calling process(event). A crash occurs during processing. What breaks?',
    o: ['Nothing — the offset was saved', 'At-most-once delivery / data loss — the event is marked done but was never processed. Always process FIRST, then commit (at-least-once)', 'The consumer re-reads from the beginning', 'The dead-letter queue catches it'],
    a: 1,
    e: 'Commit before process → if process crashes, the event is gone forever (at-most-once). Commit AFTER process → if commit crashes, you re-process (at-least-once, possibly duplicate). Consumers handle duplicates via idempotency; losing data is unrecoverable.',
    w: { 0: 'The offset was saved but the event was never processed — a silent data loss.', 2: 'The consumer restarts from the COMMITTED offset, which already skipped the failed event.', 3: 'Dead-letter is for exceptions inside process(), not for events that were never processed.' },
    r: { id: 's5', label: 'Section 5 — Track B' } },
  { q: 'Chess: adding a new piece (Amazon piece — moves like a Queen + Knight). With the polymorphism design, how many files change?',
    o: ['Every file that mentions piece types', 'One new file (Amazon.java extends Piece, implements legalMoves) + one wiring line in the factory/registry — zero other changes', 'Game.java must add a case', 'Board.java must add special handling'],
    a: 1,
    e: 'Polymorphism = OCP in action. The 4-stage validation pipeline calls piece.legalMoves() without knowing the type. A new piece is a new class — the pipeline, the board, and the game loop are unchanged.',
    w: { 0: 'There are no type-checks to update — that was the smell we removed.', 2: 'Game.java has no switch on piece type.', 3: 'Board.java works on squares, not piece types.' },
    r: { id: 's6', label: 'Section 6 — smell hunt (snippet 1)' } },
  { q: 'Which locker slot assignment strategy wastes least large-slot space?',
    o: ['Find the largest slot that fits (most space wasted)', 'Greedy smallest-fitting: filter slots where size.fits(pkg), sort by rank ASC, take the first — wastes least space, leaves larger slots available for larger packages', 'Assign randomly to balance load', 'Assign the newest slot'],
    a: 1,
    e: 'Putting a small package in the smallest slot that still fits maximises the availability of large slots for future large packages. This is the greedy first-fit approach from Day 68.',
    w: { 0: 'Largest-fitting is the opposite — it wastes the most precious space.', 2: 'Random ignores size; a small package in a large slot wastes capacity.', 3: 'Recency has no bearing on fitness.' },
    r: { id: 's2', label: 'Section 2 — Week 14 skills' } },
  { q: 'Food delivery: when is the delivery agent assigned to an order?',
    o: ['When the order is PLACED', 'After the order is CONFIRMED — the restaurant might reject a PLACED order, so assigning an agent before confirmation wastes an agent on a doomed order', 'When the agent arrives at the restaurant', 'When the customer pays'],
    a: 1,
    e: 'PLACED → CONFIRMED is the restaurant accepting. Only after CONFIRMED does it make sense to trigger agent search. This is why the state machine has a CONFIRMED → ASSIGNING transition, not PLACED → ASSIGNING.',
    w: { 0: 'Assigning at PLACED wastes an agent if the restaurant rejects.', 2: 'Agent arrival is a physical event, not the assignment trigger.', 3: 'Payment is a separate flow; agent assignment is about logistics.' },
    r: { id: 's2', label: 'Section 2 — skills table' } },
  { q: 'Consumer group in a Pub-Sub system means…',
    o: ['All consumers in the group receive every message (fan-out)', 'Each message is delivered to exactly ONE consumer in the group — the group collectively processes the topic at its own pace, enabling load balancing across instances', 'The group has higher priority than solo consumers', 'Messages are batched per group'],
    a: 1,
    e: 'Consumer groups provide load balancing: 3 consumers in a group → each gets ~1/3 of the messages. This differs from broadcast (each consumer gets every message). Multiple groups can each get all messages independently.',
    w: { 0: 'That is broadcast / multiple independent subscribers, not a consumer group.', 2: 'Priority is not part of the consumer group concept.', 3: 'Batching is a read-size optimization, not the group semantics.' },
    r: { id: 's5', label: 'Section 5 — Track B' } },
  { q: 'You scored 11/17 on the rubric, with all misses in Pub-Sub correctness. The review loop says…',
    o: ['Move on — 11/17 is passing', 'Restudy ONLY Day 69 (the flagged day), actively type the channel/consumer code, then re-drill Track B at full length to verify the gap closed', 'Re-do all of Week 14', 'Lower the rubric threshold'],
    a: 1,
    e: 'Targeted reps: the rubric is a gap-finder, not a grade. Re-drilling Track B after Day 69 confirms you fixed the gap in a new context, not just memorized the answer from this drill.',
    w: { 0: '10–13 is strong maybe — the Pub-Sub gap is real and will cost you on Day-69-shaped questions.', 2: 'Re-studying only the gap days is more effective than blanket review.', 3: 'Adjusting the measuring stick guarantees no improvement.' },
    r: { id: 's7', label: 'Section 7 — the rubric' } },
]

/* ============ The page ============ */
export default function Day70() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 14 · Day 70</div>
        <h1>Week 14 Drill:<br />Advanced Problems, Under the Clock</h1>
        <p>Chess, Food Delivery, Amazon Locker, Pub-Sub — four very different surfaces, all the same
           underlying muscles. Today you attack two fresh problems solo, under a real timer, then grade
           yourself against the same rubric an interviewer carries. One track hides a planted trap from
           this week. Click everything — then close the laptop and drill.</p>
        <div className="chips">
          {['timed drill', 'polymorphism transfer', 'state machine transfer', 'pub-sub transfer', 'smell hunt', 'self-grading rubric'].map((c) => (
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
  · no peeking at Days 66–69 until the review phase
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

  TWO SIGNALS the interviewer watches in Week 14 domains:
  "did they let each piece own its movement rule?" (polymorphism)
  "did they commit offset BEFORE or AFTER processing?" (at-least-once)`} />
        <Note><strong>Week 14 tells (the shape-transfer tells):</strong> Chess/Food-Delivery/Locker all share a
          resource-claim seam (atomic CAS). Food-Delivery/Pub-Sub both have a state machine with guarded
          transitions. Locker/Library both use greedy-first-fit. Recognising the shape in a new domain in the
          first 2 minutes of scoping is what the drill trains.</Note>
      </section>

      {/* s2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Week 14 skills inventory — what the drill actually tests</h2>
        <p>Four days, eight transferable skills. The two tracks below are new on the surface and 100% made of
          this table underneath:</p>
        <table className="matrix">
          <thead>
            <tr><th>skill</th><th>source day</th><th>interview signal</th></tr>
          </thead>
          <tbody>
            <tr><td>Model movement as polymorphism — no type switch</td><td>Day 66</td><td>"each piece owns its rule"</td></tr>
            <tr><td>Draw the order state machine (6 states, 3 parties)</td><td>Day 67</td><td>"CONFIRMED triggers agent search"</td></tr>
            <tr><td>Match delivery agent to restaurant, not customer</td><td>Day 67</td><td>"agent picks up food there first"</td></tr>
            <tr><td>Greedy smallest-fitting slot assignment</td><td>Day 68</td><td>"filter fits, sort by size ASC, take first"</td></tr>
            <tr><td>Atomic CAS to prevent double-assignment</td><td>Days 67–68</td><td>"compareAndSet prevents double-claim"</td></tr>
            <tr><td>Price snapshot on OrderItem — not a live reference</td><td>Day 67</td><td>"immutable at order time"</td></tr>
            <tr><td>Append-only topic log with consumer offsets</td><td>Day 69</td><td>"read(fromOffset) doesn't remove"</td></tr>
            <tr><td>Commit consumer offset AFTER processing</td><td>Day 69</td><td>"at-least-once = never commit early"</td></tr>
          </tbody>
        </table>
      </section>

      {/* s3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>⏱ The drill clock</h2>
        <p>Use this for the real thing. The phase bar scales to the length you pick — 45 min for the full
          rehearsal, 25 min for speed reps once you're green:</p>
        <DrillTimer />
        <Good><strong>How to use it:</strong> read a track below, write your clarifying questions first, then
          press start and open that track's "interviewer's answers" reveal. The nudge line tells you what
          phase you should be in. If you're still modeling entities when it says "code bottom-up", that's
          the drill teaching you something real.</Good>
      </section>

      {/* s4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Track A · "Design a Library Book Borrowing System."</h2>
        <p>That's the whole prompt. Write your 4–6 clarifying questions on paper <em>before</em> opening the
          answers. The shape transfer: Locker (resource sizing + atomic claim) + Food Delivery (state machine).
          One of the seams has a planted concurrency trap.</p>
        <Warn><strong>Do not open the reveals until your questions are written.</strong> Reading the answers first
          turns a rep into a rerun. The clarifying muscle is what this track exists to train.</Warn>
        <Reveal summary="🔒 The interviewer's answers — open AFTER writing your questions">
          <p><strong>What's a "book" here?</strong> A title (metadata — author, ISBN) with one or more physical
            copies. A member borrows a copy, not just a title.
            <br /><strong>Borrow duration?</strong> 14 days per copy.
            <br /><strong>Member limits?</strong> At most 3 active loans at once.
            <br /><strong>Overdue fines?</strong> Yes — a fixed rate per day past the due date.
            <br /><strong>Out of scope:</strong> reservations (holds for unavailable books), renewals, payment
            processing (assume fines are tracked, not charged in real-time).
            <br /><strong>Sneaky follow-up at minute 40:</strong> "add a wait-list so a member can request the
            next available copy of a title they can't borrow now."</p>
        </Reveal>
        <Reveal summary="🔒 Model-answer skeleton + THE TRAP — open ONLY during the review phase">
          <Code html={`  TRACK A — the shape is Day 68 (resource + state + atomic claim) re-skinned

  ENTITY MODEL
  ────────────
  Book(String isbn, String title, String author)       ← metadata, immutable
  enum CopyState { AVAILABLE, BORROWED, RESERVED }     ← closed set
  BookCopy(String id, Book book, CopyState state)      ← the physical resource
  record Loan(String id, BookCopy copy, Member member,
              Instant borrowedAt, Instant dueAt,
              Instant returnedAt)                      ← frozen facts; returnedAt = null until returned
  Member(String id, String name,
         List&lt;Loan&gt; activeLoans,                     ← at most 3 active
         Money fineBalance)                            ← running total

  BORROW FLOW
  ───────────
  1. check member.activeLoans.size() &lt; 3         ← must be atomic! (see trap below)
  2. find any BookCopy where state == AVAILABLE
     for the requested Book
  3. CAS: copy.compareAndSet(AVAILABLE, BORROWED)  ← exactly Day 68's slot claim
  4. create Loan(id, copy, member,
                 now, now + 14 days, null)
  5. add to member.activeLoans

  RETURN FLOW
  ───────────
  1. find the open Loan for this copy+member        ← throw if not found (idempotent: second return ignored)
  2. set returnedAt = now
  3. compute fine: if now &gt; dueAt → fine = days * ratePerDay → add to member.fineBalance
  4. set copy.state = AVAILABLE

  ⚠ THE PLANTED TRAP: step 1 of the borrow flow is check-then-act!
  Two concurrent threads both call borrowBook() for the same member.
  Both read activeLoans.size() == 2 &lt; 3 and both proceed.
  The member ends up with 4 active loans. Fix options:
    · synchronized (member) { check size + add loan as one unit }
    · AtomicInteger member.loanCount; loanCount.incrementAndGet() then
      if (loanCount.get() &gt; 3) { loanCount.decrementAndGet(); reject }
      (same CAS-retry pattern as Day 62)

  WAIT-LIST (minute-40 diff): add Queue&lt;Member&gt; waitlist per Book.
  When a copy is returned and waitlist is non-empty, pop the head,
  notify them (Observer) and reserve the copy for them (RESERVED state).
  Pattern: Observer applied to resource availability.`} />
        </Reveal>
      </section>

      {/* s5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Track B · "Design an Event Stream Processor." (with a planted trap)</h2>
        <p>Same discipline: questions on paper first. This is Day 69 (Pub-Sub) re-skinned as a processing
          framework. Somewhere inside it, the most famous Pub-Sub trap is planted. Find it during the drill.</p>
        <Reveal summary="🔒 The interviewer's answers — open AFTER writing your questions">
          <p><strong>What is an "event"?</strong> A named message with a type (string) and a JSON payload.
            <br /><strong>Channels?</strong> Named streams. Producers publish to a channel; consumers subscribe.
            <br /><strong>Multiple consumers?</strong> Yes — each consumer service processes events independently,
            at its own pace.
            <br /><strong>Restart after crash?</strong> A consumer must resume exactly where it left off — no
            reprocessing old events unnecessarily.
            <br /><strong>Failed events?</strong> Should not be silently dropped. The consumer should be able to
            inspect and retry them.
            <br /><strong>Sneaky follow-up at minute 40:</strong> "add a consumer group — multiple instances of
            the same service should share the load, not duplicate work."</p>
        </Reveal>
        <Reveal summary="🔒 Model-answer skeleton + THE TRAP — open ONLY during the review phase">
          <Code html={`  TRACK B — direct transfer from Day 69 (Channel = Topic, same append-only model)

  ENTITY MODEL
  ────────────
  record EventRecord(long offset, String type, String payload, Instant ts)
  class Channel {
      List&lt;EventRecord&gt; log = new ArrayList&lt;&gt;();        ← append-only; offsets are indices
      long append(String type, String payload)          ← add to log, return offset
      List&lt;EventRecord&gt; read(long fromOffset, int max)  ← read [fromOffset, fromOffset+max)
  }                                                      NEVER removes from the log
  class ConsumerService {
      String consumerId;
      Channel channel;
      long offset = 0;                                  ← loaded from storage on restart
      DeadLetterChannel dlq;

      void poll() {
          List&lt;EventRecord&gt; batch = channel.read(offset, 10);
          for (EventRecord e : batch) {
              try {
                  process(e);                           ← business logic
                  commitOffset(offset + 1);             ← AFTER processing (at-least-once)
              } catch (Exception ex) {
                  dlq.enqueue(e, ex.getMessage());      ← failed → DLQ; don't lose it
              }
              offset++;
          }
      }
      void commitOffset(long o) { /* persist to storage (Map / Redis / DB) */ }
  }
  class DeadLetterChannel { List&lt;FailedEvent&gt; entries; }
  record FailedEvent(EventRecord event, String error, Instant failedAt)

  ⚠ THE PLANTED TRAP: the commit-before-process ordering:
  commitOffset(offset + 1);   ← committed!
  process(e);                  ← crashes here
  Result: event is GONE. Next restart reads from offset+1. Silent data loss.
  This is the single most asked Pub-Sub interview question. The correct order:
  process(e) first → if it succeeds → commitOffset(). If commit crashes after
  a successful process, you re-process on restart — consumers must be idempotent.

  CONSUMER GROUP (minute-40 diff):
  Add a GroupOffsetStore (Map&lt;groupId, long committedOffset&gt;) shared by all
  instances. Each poll() call: one instance wins (they race to claim the next
  batch via CAS on the offset). Same CAS-claim pattern from Day 62.`} />
          <Note><strong>Why the shapes are the same:</strong> Channel = Topic (Day 69). The commit-before-process
            trap is identical to Day 69's "at-least-once" explanation — only the surrounding domain changed.
            Recognising the shape tells you the trap is coming before you even read the code.</Note>
        </Reveal>
      </section>

      {/* s6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔎 Play: the smell hunt</h2>
        <p>Warm up your reviewer's eye before grading yourself. Six snippets from this week's problems, one
          planted smell each:</p>
        <SmellHunt />
        <Good><strong>What you should notice:</strong> ① Every smell has a name from this week — type-switch,
          wrong-match-target, check-then-act race, commit-before-process, live-reference, ordinal-ordering.
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
        <Warn><strong>The rubric only works if it hurts a little.</strong> "I would have used CAS" is unchecked.
          "I knew the commit order was wrong but ran out of time" is unchecked. The checkbox standard is: an
          interviewer watching your screen during the drill would have seen/heard it.</Warn>
      </section>

      {/* s8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>🕳 Drill failure modes — how good reps go bad</h2>
        <Warn><strong>Modelling too long.</strong> Twenty minutes on the entity diagram is a design-round habit.
          At minute 12, cutover hard — a good-enough model in code beats a perfect model on paper when the
          clock is real.</Warn>
        <Warn><strong>Silent coding.</strong> "I'll narrate in the real round." You won't — narration steals
          capacity from thinking unless it's automatic. Feel silly at your desk now, or go quiet at minute 25
          in the round that counts.</Warn>
        <Warn><strong>The type-switch reflex.</strong> Reaching for <C>instanceof</C> chains is a language habit.
          Catch it at minute 1 of the code phase: if you're asking "what type is this?", you want
          polymorphism.</Warn>
        <Warn><strong>Committing before processing.</strong> This is the trap interviewers plant most in Pub-Sub
          problems. Say the order out loud: "process first, then commit." If you say it, you won't flip it.</Warn>
        <Warn><strong>Compiling once, at the end.</strong> Bottom-up + compile-every-8-minutes means errors
          arrive one at a time, one minute old. Compiling at the end means all errors arrive at once, at
          minute 44.</Warn>
        <Warn><strong>The rep without the review.</strong> An ungraded drill trains your existing habits,
          including the bad ones, now faster. Ten honest minutes with the rubric is where improvement lives.</Warn>
      </section>

      {/* s9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>📋 Cheat sheet — the pocket script for Week 14 domains</h2>
        <Code html={`  WEEK 14 SHAPES AT A GLANCE

  Chess / board game       → abstract Piece.legalMoves(); 4-stage pipeline;
                             Move as Command (undo stack); check = simulate+test
  Food delivery            → 6-state order machine; match agent to RESTAURANT;
                             price snapshot on OrderItem; surge as Decorator
  Amazon Locker / resource → greedy smallest-fitting (rank field on enum size);
                             CAS atomic slot claim; pickup code = immutable VO
  Pub-Sub / stream         → append-only log + consumer offset; pull model;
                             process THEN commit (at-least-once);
                             consumer group = one message per group;
                             dead-letter queue for failures`} />
        <ul>
          <li><strong>Phases (invariant):</strong> 5' clarify → 7' entity table + enums → 23' code bottom-up, compile every 8' → 7' happy path + one edge → 3' review.</li>
          <li><strong>First file:</strong> an enum. It compiles, pins the model, breaks the blank page.</li>
          <li><strong>Standing decisions (Week 14 defaults):</strong> varying movement rule → polymorphism · resource state → enum/State · varying price → Strategy or Decorator · topic consumers → pull + offset · size ordering → explicit rank field, not ordinal.</li>
          <li><strong>The atomic claim appears everywhere:</strong> locker slot, delivery agent, book copy, consumer group offset — CAS or synchronized block around check+act, every time.</li>
          <li><strong>The commit order is load-bearing:</strong> process first, commit after. Say it out loud once before every Pub-Sub problem.</li>
          <li><strong>Review loop:</strong> drill → rubric → top-2 gaps → restudy those days actively → re-drill the other track. Green twice = Week 14 is genuinely yours.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 Week 14 questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "What is the difference between a Chess game state machine and a Food Delivery order state machine?"'>
          <p>Chess game state is <strong>ephemeral</strong> — it lives in memory for one session; Game.status()
            (IN_PROGRESS/CHECK/CHECKMATE/DRAW) is recomputed from the board after every move. Food Delivery order
            state is <strong>persistent business state</strong> — it survives server restarts, is stored in a
            database, and transitions are triggered by external actors (restaurant, agent, customer). Chess state
            = a derived read; Order state = a durable, auditable record. Both use guarded transitions, but the
            stakes and persistence requirements are entirely different.</p>
        </Reveal>
        <Reveal summary='Q: "Two courier apps call assignSlot() for the same locker slot simultaneously. What happens?"'>
          <p>Without protection: both see the slot AVAILABLE, both call <C>setState(OCCUPIED)</C>, and the slot
            is double-assigned. With CAS (<C>compareAndSet(AVAILABLE, OCCUPIED)</C>): one call wins atomically,
            the other gets <C>false</C> back and must re-search for the next available slot. This is exactly the
            seat-booking race from BookMyShow (Day 51) and the driver-assignment race from Cab Booking (Day 58)
            — the same atomic-claim primitive re-appears in every resource-assignment problem.</p>
        </Reveal>
        <Reveal summary='Q: "A Pub-Sub consumer crashes after processing 3 of 10 messages in a batch. Where does it restart?"'>
          <p>At offset 3 (the last committed offset), assuming the consumer commits after each message.
            Messages 0–2 were processed and committed. Messages 3–9 will be re-delivered. Messages 3–9 may be
            processed <em>again</em> (at-least-once delivery) — this is expected. Consumers must be idempotent
            (processing the same message twice has the same effect as once) to handle this safely. If the
            consumer commits in batches (commit once after all 10), it restarts at 0 and reprocesses everything
            — a trade between commit overhead and re-processing scope.</p>
        </Reveal>
        <Reveal summary='Q: "Can a food delivery order be cancelled after the agent has picked it up?"'>
          <p>No — the state machine blocks this. Once the order reaches PICKED_UP, the only valid transition is
            to DELIVERED. A cancellation transition from PICKED_UP would require the agent to return the food,
            which is a physical impossibility the system should not model. The state machine enforces reality:
            CONFIRMED → AGENT_ASSIGNED → PICKED_UP → DELIVERED, with CANCELLED only reachable from PLACED or
            CONFIRMED (before the agent is involved). This is why guarded transitions and explicit state models
            matter — they encode the business rules.</p>
        </Reveal>
        <Reveal summary='Q: "Why does Chess piece movement use polymorphism instead of a switch statement?"'>
          <p>Open/Closed Principle (Day 12): adding a new piece type means adding one new class that overrides
            <C>legalMoves()</C>. With a type-switch, adding a new piece means opening the switch — and every
            place in the codebase that switches on piece type must be updated. Information Expert (Day 10):
            the piece is the expert on its own movement rules; that knowledge should live with the piece, not
            in a central dispatcher. The 4-stage validation pipeline can call <C>piece.legalMoves(board, from)</C>
            without knowing what kind of piece it is — classic polymorphic dispatch.</p>
        </Reveal>
        <Reveal summary='Q: "How would you add a wait-list for the Amazon Locker when all slots of the right size are full?"'>
          <p>A wait-list queue per slot size: <C>Map&lt;SlotSize, Queue&lt;WaitRequest&gt;&gt; waitlists</C>.
            When a courier submits a package and no slot fits, create a <C>WaitRequest(courierId, pkg, notifyCallback)</C>
            and enqueue it for the appropriate size. When a slot is freed (pickup or expiry sweep), check the
            waitlist for that size — if non-empty, pop the head and atomically reserve the slot for them (CAS),
            then notify the courier. This is the Observer pattern (Day 32) applied to resource availability,
            the same pattern as a library book wait-list. Key: the notification is async; the slot reservation
            is still atomic to prevent two wait-list entries both getting the same slot.</p>
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
        <strong>Day 70 complete?</strong> Homework IS the day: run <strong>Track A at 45 minutes</strong> today
        — full protocol, out loud, rubric immediately after, top-2 gaps written down. Tomorrow (or after a
        gap-day restudy if you scored red), run <strong>Track B at 45 minutes</strong> and see if the planted
        offset-commit trap catches you. Green on both = Week 14 is genuinely yours.
        <br /><br />
        Next: <strong>Week 15 — Machine Coding Rounds</strong>: timed solo practice at interview pace, with new
        domains you haven't seen before. The full Month 4 course wraps up in <strong>Week 16</strong> with
        mock interviews and final revision.
      </div>
    </div>
  )
}
