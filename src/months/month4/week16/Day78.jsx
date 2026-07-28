import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Interactive 1: Problem Shape Identifier
   ============================================================ */
const PROBLEMS = [
  {
    name: 'Parking Lot',
    shapes: ['Resource + atomic claim'],
    reason: 'Limited spots compete for by multiple drivers simultaneously. Two cars can read "AVAILABLE" at the same time — the only safe fix is compareAndSet(AVAILABLE, OCCUPIED). Classic CAS claim.',
    day: 41,
  },
  {
    name: 'Vending Machine',
    shapes: ['State machine + lifecycle'],
    reason: 'The same button press does entirely different things depending on current state (IDLE / HAS_MONEY / DISPENSING). There is no shared resource — the problem is entirely about per-state behaviour.',
    day: 48,
  },
  {
    name: 'LRU Cache',
    shapes: ['DS for complexity target'],
    reason: 'The requirement is O(1) get AND O(1) put including eviction. A HashMap alone gives O(1) lookup but no order. A doubly-linked list alone gives O(1) reorder but O(n) lookup. Both together hit the target.',
    day: 56,
  },
  {
    name: 'Splitwise',
    shapes: ['Money + ledger'],
    reason: 'The hard parts are all financial: running net balances, the penny problem (floor + remainder), and settle-up as min-cash-flow graph. No resource claim, no state machine — pure money correctness.',
    day: 53,
  },
  {
    name: 'Elevator System',
    shapes: ['Scheduling + dispatch'],
    reason: 'Multiple requests must be assigned to cars optimally. SCAN halves average travel vs FCFS. The SchedulingStrategy seam is the load-bearing design decision — tick-based loop, not event-driven.',
    day: 46,
  },
  {
    name: 'Chess',
    shapes: ['Game loop'],
    reason: 'Turn-based play with a rules engine. Each piece owns its legalMoves() — no type switch. Win detection (checkmate/stalemate) follows from one legal-move generator. Move = Command for undo.',
    day: 66,
  },
  {
    name: 'Logging Framework',
    shapes: ['Pipeline + framework'],
    reason: 'A Logger feeds a chain of Appenders (CoR), each formatting via a Layout (Strategy). New sinks plug in at the composition root — the pipeline stays closed. SLF4J is the Facade hiding the engine.',
    day: 49,
  },
  {
    name: 'Food Delivery',
    shapes: ['State machine + lifecycle', 'Scheduling + dispatch'],
    reason: 'Two shapes at once: Order has a 6-state lifecycle (PLACED→CONFIRMED→PREPARING→READY→PICKED_UP→DELIVERED), AND the delivery agent must be dispatched to the restaurant via a MatchingStrategy.',
    day: 67,
  },
]

const ALL_SHAPES = [
  'Resource + atomic claim',
  'State machine + lifecycle',
  'Scheduling + dispatch',
  'Money + ledger',
  'Pipeline + framework',
  'Game loop',
  'DS for complexity target',
]

function ShapeIdentifier() {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState([])
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const done = idx >= PROBLEMS.length
  const cur = PROBLEMS[idx]

  function toggleShape(shape) {
    if (revealed) return
    setSelected((s) => s.includes(shape) ? s.filter((x) => x !== shape) : [...s, shape])
  }

  function check() {
    if (revealed || selected.length === 0) return
    setRevealed(true)
    setTotal((t) => t + 1)
    const correct = cur.shapes.every((s) => selected.includes(s)) && selected.length === cur.shapes.length
    if (correct) setScore((s) => s + 1)
  }

  function next() {
    setSelected([])
    setRevealed(false)
    setIdx((i) => i + 1)
  }

  function restart() {
    setIdx(0)
    setSelected([])
    setRevealed(false)
    setScore(0)
    setTotal(0)
  }

  if (done) {
    return (
      <div className="panel">
        <div className="ptitle">Live demo · shape identifier — completed</div>
        <p style={{ fontSize: 15 }}>
          Final score: <strong>{score} / {PROBLEMS.length}</strong>.{' '}
          {score === PROBLEMS.length ? 'Perfect — you own the 7 shapes.' : 'Re-run until you can name the shape before the reveal.'}
        </p>
        <button className="act" onClick={restart}>Start over</button>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · which shape(s) does this problem fit? Pick all that apply, then check.</div>
      <div className="statbar" style={{ marginBottom: 12 }}>
        problem {idx + 1} of {PROBLEMS.length} · score {score}/{total}
      </div>
      <div style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
        {cur.name}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {ALL_SHAPES.map((shape) => {
          const isSelected = selected.includes(shape)
          const isCorrect = cur.shapes.includes(shape)
          let bg = '#fff', border = 'var(--line)', color = 'var(--ink)'
          if (revealed) {
            if (isCorrect) { bg = '#EAF7EF'; border = 'var(--green)'; color = '#1a7a40' }
            else if (isSelected && !isCorrect) { bg = '#FDECEC'; border = 'var(--red)'; color = '#c0392b' }
          } else if (isSelected) {
            bg = '#EEF2FF'; border = 'var(--blue)'; color = 'var(--blue)'
          }
          return (
            <button key={shape} onClick={() => toggleShape(shape)} style={{
              fontFamily: 'IBM Plex Sans', fontSize: 13, padding: '7px 14px',
              border: `2px solid ${border}`, borderRadius: 8, background: bg, color,
              cursor: revealed ? 'default' : 'pointer', transition: 'all 0.15s',
            }}>
              {isSelected ? '☑ ' : '☐ '}{shape}
            </button>
          )
        })}
      </div>
      {!revealed && (
        <button className="act" onClick={check} disabled={selected.length === 0}>
          Check my answer
        </button>
      )}
      {revealed && (
        <div>
          <div style={{
            background: cur.shapes.every((s) => selected.includes(s)) && selected.length === cur.shapes.length ? '#EAF7EF' : '#FFF1D6',
            border: '1px solid var(--line)', borderRadius: 8, padding: '10px 14px', marginBottom: 10,
          }}>
            <strong>Correct shape(s):</strong> {cur.shapes.join(' + ')}<br />
            <span style={{ fontSize: 13.5, marginTop: 4, display: 'block' }}>{cur.reason}</span>
            <span style={{ fontSize: 12, color: '#7c8aa5', display: 'block', marginTop: 4 }}>First covered: Day {cur.day}</span>
          </div>
          <button className="ghost act" onClick={next}>Next problem →</button>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Interactive 2: Concurrency "Which Fix?" Drill
   ============================================================ */
const CONC_BUGS = [
  {
    bug: 'Two threads both read count = 5, both compute count + 1 = 6, both write 6. The counter is now 6 instead of 7.',
    options: ['volatile flag', 'AtomicInteger.incrementAndGet() or synchronized block', 'BlockingQueue', 'ReentrantReadWriteLock'],
    a: 1,
    why: 'This is the lost-update race on count++. The read-modify-write must be atomic. AtomicInteger.incrementAndGet() uses a CAS loop; synchronized makes the whole update atomic. volatile only fixes visibility — it does NOT make ++ atomic.',
  },
  {
    bug: 'Thread A reads seat.status == AVAILABLE, then Thread B reads the same, both pass the check, both claim the seat.',
    options: ['volatile on the status field', 'compareAndSet(AVAILABLE, BOOKED) — CAS collapses check+claim into one step', 'BlockingQueue between threads', 'synchronized on a different object'],
    a: 1,
    why: 'This is the check-then-act race — the classic Month-3 seat-booking bug. CAS (compareAndSet) atomically checks and updates in one operation; exactly one thread wins, the other gets false and must retry.',
  },
  {
    bug: 'A background thread sets a boolean flag stop = true but the consumer loop never sees it and spins forever.',
    options: ['volatile boolean stop — ensures write is flushed to all threads\' caches', 'AtomicBoolean', 'synchronized(this) around the read', 'ReentrantLock'],
    a: 0,
    why: 'The JMM does not guarantee that writes on one thread are visible to another without a happens-before edge. volatile establishes that edge: any write to a volatile field is visible to all subsequent reads. AtomicBoolean also works but is heavier than needed for a simple flag.',
  },
  {
    bug: 'Thread A holds Lock1 and waits for Lock2. Thread B holds Lock2 and waits for Lock1. Both wait forever.',
    options: ['volatile', 'Always acquire locks in a consistent global order (Lock1 before Lock2 everywhere)', 'AtomicInteger', 'CountDownLatch'],
    a: 1,
    why: 'This is a deadlock. The fix is consistent lock ordering: if every thread acquires Lock1 before Lock2, no circular dependency can form. tryLock with a timeout is a fallback if strict ordering is impossible.',
  },
  {
    bug: 'A producer thread puts messages into an ArrayList at full speed. A slow consumer can\'t keep up and the JVM runs out of heap memory.',
    options: ['synchronized on the ArrayList', 'Bounded BlockingQueue — put() blocks the producer when the queue is full (backpressure)', 'volatile on the list reference', 'ReentrantReadWriteLock'],
    a: 1,
    why: 'This is the unbounded-queue OOM problem. A BlockingQueue with a fixed capacity applies backpressure: when the queue is full, put() blocks the producer. This is the producer-consumer pattern from Day 63.',
  },
  {
    bug: 'A notify() call fires on a condition variable, but the waiting thread has not called wait() yet. The wakeup is lost and the waiting thread sleeps forever.',
    options: ['Always check the condition in a while loop, not an if — re-check after every wait()', 'Use volatile', 'Use AtomicInteger', 'Use CountDownLatch with count = 2'],
    a: 0,
    why: 'The while-loop idiom is the standard fix for spurious and lost wakeups: while (!condition) { wait(); }. If the notify arrives before wait, the thread checks the condition on entry and never calls wait(). This is the guarded-wait pattern from Day 63.',
  },
  {
    bug: 'A DB row has version = 5. Thread A reads it (version 5). Thread B reads and updates it (version 6). Thread A tries to update — it should fail because its read is stale.',
    options: ['Pessimistic lock (SELECT FOR UPDATE)', 'Optimistic version check: UPDATE ... WHERE id=? AND version=5 — zero rows affected means stale read, retry', 'AtomicInteger in Java', 'volatile version field'],
    a: 1,
    why: 'This is optimistic locking at the DB layer. The version column is the compare value; the WHERE clause IS the CAS. Zero rows affected → conflict detected → retry from a fresh read. Covered in Day 64.',
  },
  {
    bug: 'Thousands of requests per second hit a rate limiter. All threads share one global ReentrantLock wrapping all logic. The lock becomes a bottleneck.',
    options: ['Use volatile instead', 'Per-client lock (one lock per client ID) — threads for different clients never contend', 'Use a single AtomicInteger', 'Widen the lock to the whole class'],
    a: 1,
    why: 'Lock granularity (Day 62): one global lock serialises ALL clients. Per-client locks mean threads only contend when they are the same client — O(clients) parallelism. This is the stripe-locking principle from Day 65.',
  },
]

function ConcDrill() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= CONC_BUGS.length
  const cur = CONC_BUGS[idx]

  function pick(i) {
    if (picked !== null) return
    setPicked(i)
    if (i === cur.a) setScore((s) => s + 1)
  }

  function next() { setPicked(null); setIdx((i) => i + 1) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · concurrency drill — read the bug, pick the right fix</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>Score: <strong>{score} / {CONC_BUGS.length}</strong>.{' '}
            {score === CONC_BUGS.length ? 'Perfect — Week 13 is yours.' : 'Re-run any bugs you missed.'}
          </p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Run again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 10 }}>bug {idx + 1} of {CONC_BUGS.length} · score {score}</div>
          <div style={{ background: '#FFF8EE', border: '1px solid var(--amber)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontFamily: 'IBM Plex Sans', fontSize: 13.5 }}>
            <strong>Bug:</strong> {cur.bug}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cur.options.map((opt, i) => {
              let bg = '#fff', border = 'var(--line)', color = 'var(--ink)'
              if (picked !== null) {
                if (i === cur.a) { bg = '#EAF7EF'; border = 'var(--green)'; color = '#1a7a40' }
                else if (i === picked) { bg = '#FDECEC'; border = 'var(--red)'; color = '#c0392b' }
              }
              return (
                <button key={i} onClick={() => pick(i)} style={{
                  fontFamily: 'IBM Plex Sans', fontSize: 13.5, textAlign: 'left', padding: '8px 14px',
                  border: `1px solid ${border}`, borderRadius: 8, background: bg, color,
                  cursor: picked !== null ? 'default' : 'pointer',
                }}>{opt}</button>
              )
            })}
          </div>
          {picked !== null && (
            <div style={{ marginTop: 12, background: '#F4F3EE', borderRadius: 8, padding: '10px 14px', fontSize: 13.5 }}>
              {picked === cur.a ? '✅ Correct!' : '❌ Not quite.'} {cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={next}>Next bug →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Interactive 3: Month-by-month revision checklists
   ============================================================ */
const CHECKLISTS = {
  'Month 1 — OOP + SOLID (Days 1–20)': [
    'I can explain why public fields are dangerous and write a class with proper encapsulation',
    'I can draw the stack vs heap memory model from memory',
    'I can write a class that violates LSP (Square-Rectangle) and then fix it by splitting the hierarchy',
    'I can name all 5 SOLID principles and give one real-world example each',
    'I can explain the difference between association, aggregation, and composition with lifecycle examples',
    'I can draw a UML class diagram with all 6 arrow types and correct visibility symbols',
    'I can explain why the Law of Demeter exists and identify a train-wreck in code',
    'I can explain DRY vs false duplication and give one example of each',
  ],
  'Month 2 — GoF Patterns (Days 21–40)': [
    'I can implement Singleton in all 6 variants (eager, lazy, sync, DCL, holder, enum) and name the thread-safety pitfall of each',
    'I can draw the full GoF structure for Strategy, Observer, and State from memory',
    'I can explain when Decorator beats subclassing (runtime layering vs compile-time)',
    'I can explain the difference between Command (execute/undo) and Strategy (swap HOW)',
    'I can explain why Composite uses a single Component interface (transparency vs safety)',
    'I can describe five kinds of Proxy (virtual, protection, remote, caching, logging) and name a JDK example',
    'I can explain double dispatch in Visitor and why accept() is needed',
    'I can explain why Observer needs CME protection (CopyOnWriteArrayList) and how lapsed listeners cause memory leaks',
  ],
  'Month 3 — Classic LLD Problems (Days 41–60)': [
    'I can design a Parking Lot in 45 minutes including the SpotState enum and CAS spot claim',
    'I can implement an LRU Cache with O(1) get and put using HashMap + doubly-linked list',
    'I can explain what makes BookMyShow\'s seat-hold hard (check-then-act race) and name three fix strategies',
    'I can design Splitwise\'s settle-up algorithm (min-cash-flow greedy) and explain the penny problem',
    'I can draw the ATM state machine and explain why it is better than a switch grid',
    'I can design a Logging Framework with hierarchy, additivity, and SLF4J Facade',
    'I can design Cab Booking including spatial index, Driver + Trip state machines, and CAS driver assignment',
    'I can name the 7 problem shapes and give an example problem for each',
  ],
  'Month 4 — Advanced LLD (Days 61–80)': [
    'I can explain the 7 problem shapes and classify any new problem within 2 minutes',
    'I can explain the check-then-act race, the lost-update race, and the JMM visibility bug — with a fix for each',
    'I can explain the difference between optimistic and pessimistic locking and give a DB-layer example',
    'I can implement a token bucket rate limiter that is thread-safe per client (no global lock)',
    'I can design the Food Delivery order state machine with the 3-party lifecycle (customer/restaurant/agent)',
    'I can explain fan-out vs pull-on-read and name a use case for each',
    'I can explain what "commit offset after processing" means and why it matters for at-least-once delivery',
    'I can walk through the idempotency key pattern and explain why payment needs it',
  ],
}

function RevisionChecklists() {
  const [checked, setChecked] = useState({})
  const toggle = (key) => setChecked((c) => ({ ...c, [key]: !c[key] }))

  return (
    <div className="panel">
      <div className="ptitle">Live demo · revision checklists — tick only things you can do right now without the course</div>
      {Object.entries(CHECKLISTS).map(([month, items]) => {
        const doneCount = items.filter((_, i) => checked[month + i]).length
        const pct = Math.round((doneCount / items.length) * 100)
        return (
          <div key={month} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, color: '#7c8aa5', fontWeight: 700 }}>
                {month.toUpperCase()}
              </span>
              <span style={{
                fontFamily: 'IBM Plex Mono', fontSize: 12, padding: '2px 8px', borderRadius: 20,
                background: pct === 100 ? '#EAF7EF' : pct >= 50 ? '#FFF1D6' : '#FDECEC',
                color: pct === 100 ? '#1a7a40' : pct >= 50 ? '#a0522d' : '#c0392b',
              }}>{pct}% ready</span>
            </div>
            {items.map((item, i) => {
              const k = month + i
              return (
                <button key={k} onClick={() => toggle(k)} style={{
                  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                  fontFamily: 'IBM Plex Sans', fontSize: 13, padding: '5px 8px', marginBottom: 4,
                  border: '1px solid var(--line)', borderRadius: 6,
                  background: checked[k] ? '#EAF7EF' : '#fff',
                }}>
                  {checked[k] ? '☑' : '☐'} {item}
                </button>
              )
            })}
          </div>
        )
      })}
      <div className="statbar" style={{ display: 'block' }}>
        Honest self-assessment: gaps are just re-read targets. A gap you hide stays a gap in the interview.
      </div>
    </div>
  )
}

/* ============================================================
   Quiz data — 10 integrative questions
   ============================================================ */
const QUESTIONS = [
  {
    q: 'Two users try to book the last available seat on BookMyShow at the same millisecond. What is the correct fix?',
    o: [
      'Add a try-catch around the booking code',
      'Use a volatile field on the seat status',
      'Use compareAndSet(AVAILABLE, HELD) — the first caller wins atomically; the second gets false and must re-search',
      'Refresh the seat list and retry the UI',
    ],
    a: 2,
    e: 'This is the check-then-act race. CAS collapses the check and the claim into one atomic step. Only one thread can win compareAndSet — the other gets false back and retries. volatile only fixes visibility, not atomicity.',
    w: { 0: 'try-catch catches exceptions, not races.', 1: 'volatile makes reads fresh but does not make compareAndSet atomic — volatile++ still races.', 3: 'A UI retry does nothing about the server-side race.' },
    r: { id: 's5', label: 'Section 5 — Concurrency cheat sheet' },
  },
  {
    q: 'What is the difference between the Strategy pattern and the State pattern?',
    o: [
      'They are identical — both swap an interface at runtime',
      'Strategy is only used in sorting; State is only used in UI',
      'State is a subtype of Strategy',
      'Strategy swaps HOW something is done (algorithm); State swaps WHO the current self is (object transitions itself to a new state)',
    ],
    a: 3,
    e: 'Strategy: the context picks the algorithm; the algorithm never switches itself. State: each concrete state can trigger transitions to other states. The structure is similar but the intent and coupling direction differ completely.',
    w: { 0: 'The structure looks alike but intent and who-controls-transitions differ fundamentally.', 1: 'Both are general behavioral patterns used across many domains.', 2: 'Neither is a subtype of the other in any formal sense.' },
    r: { id: 's3', label: 'Section 3 — GoF frequency table' },
  },
  {
    q: 'Which data structure combination makes an LRU Cache O(1) for both get and put?',
    o: [
      'HashMap for O(1) lookup + doubly-linked list for O(1) move-to-front; the node stores the key so eviction can remove from both in O(1)',
      'LinkedHashMap with a synchronized wrapper',
      'TreeMap (sorted by access time)',
      'ArrayDeque + HashSet',
    ],
    a: 0,
    e: 'HashMap gives O(1) lookup by key. The DLL gives O(1) reorder (4 pointer rewires). A node stores its own key so when we evict the LRU tail, we can delete from the HashMap in O(1) too. Neither structure alone gives both guarantees.',
    w: { 1: 'LinkedHashMap.accessOrder is a valid shortcut but the question is about understanding the underlying structure.', 2: 'TreeMap is O(log n) for all operations.', 3: 'ArrayDeque gives O(n) lookup by key.' },
    r: { id: 's2', label: 'Section 2 — The 7 problem shapes' },
  },
  {
    q: 'A payment request is retried after a network timeout. The server received the first request and charged the card. What prevents a double charge?',
    o: [
      'Checking the response status code',
      'An idempotency key — the same key on the retry returns the already-stored result instead of re-executing',
      'Using HTTPS',
      'Catching the timeout exception',
    ],
    a: 1,
    e: 'An idempotency key (a unique ID per logical operation) lets the server detect replays: "I already processed key XYZ — here is the result I stored." This is the standard pattern for payment APIs and was covered in BookMyShow Part 2 (Day 52) and ATM (Day 54).',
    w: { 0: 'The status code tells you what happened last time, not how to prevent double-execution.', 2: 'HTTPS is about transport security, not idempotency.', 3: 'Catching the exception on the client side does not help if the server already processed the request.' },
    r: { id: 's5', label: 'Section 5 — Concurrency cheat sheet' },
  },
  {
    q: 'The Liskov Substitution Principle says a Square IS-A Rectangle. What actually breaks?',
    o: [
      'Nothing — Square is mathematically a rectangle',
      'Rectangle\'s contract says setWidth(5) followed by setHeight(3) gives area 15; Square breaks this silently because setWidth also sets height, giving area 9',
      'LSP only applies to abstract classes, not interfaces',
      'The Square class will not compile as a subclass of Rectangle',
    ],
    a: 1,
    e: 'LSP is about behavioral contracts, not math. A client that calls setWidth then setHeight on a Rectangle expects them to be independent. Square violates this silently — same method signature, different behavior. A subtype must satisfy the supertype\'s post-conditions.',
    w: { 0: 'Mathematical IS-A does not equal OOP IS-A. OOP IS-A requires behavioral substitutability.', 2: 'LSP applies to any type hierarchy (classes and interfaces alike).', 3: 'It compiles fine — that is the problem. The violation is invisible at compile time.' },
    r: { id: 's4', label: 'Section 4 — SOLID quick reference' },
  },
  {
    q: 'Why does a food delivery app match the delivery agent to the restaurant location, not the customer location?',
    o: [
      'The agent must first pick up the food at the restaurant — matching to customer location minimises the last mile but ignores the first (often longer) pickup leg',
      'Regulatory requirement',
      'Customer location is unknown at match time',
      'The restaurant is always closer',
    ],
    a: 0,
    e: 'The delivery flow is: agent → restaurant (pickup) → customer (dropoff). Optimising for nearest-to-customer ignores the pickup leg entirely. The assignment that minimises time-to-restaurant (or ETA to restaurant) is correct. This was a planted smell in the Day 70 drill.',
    w: { 1: 'This is a design logic issue, not a legal one.', 2: 'The customer location is known at order time.', 3: 'This is not always true and is domain-specific, not a design principle.' },
    r: { id: 's2', label: 'Section 2 — The 7 problem shapes' },
  },
  {
    q: 'A Pub-Sub consumer commits its offset BEFORE calling process(event). A crash happens inside process(). What is the outcome?',
    o: [
      'The event is replayed on restart — at-least-once delivery',
      'The dead-letter queue catches it automatically',
      'The broker re-sends the event to a different consumer',
      'The event is lost — at-most-once delivery; the offset was advanced so the consumer restarts past that message',
    ],
    a: 3,
    e: 'Commit before process → the offset is already advanced. When the consumer restarts, it reads from the committed offset — the failed event is skipped forever. This is data loss. The correct order is: process first, then commit. If commit fails, the event is re-processed (at-least-once) — consumers must be idempotent.',
    w: { 0: 'At-least-once requires committing AFTER process — not before.', 1: 'The dead-letter queue only receives events that process() throws an exception on, not events that were skipped by an early commit.', 2: 'The broker does not know processing failed — it only sees the committed offset.' },
    r: { id: 's5', label: 'Section 5 — Concurrency cheat sheet' },
  },
  {
    q: 'Why should money never be stored as a double in Java?',
    o: [
      'IEEE 754 floating-point cannot represent 0.1 exactly — rounding errors accumulate across additions, leading to incorrect totals (the famous 0.1 + 0.2 != 0.3 bug)',
      'double is slow for arithmetic',
      'Java does not support double for monetary calculations by specification',
      'double is not thread-safe',
    ],
    a: 0,
    e: '0.1 cannot be represented exactly in base-2 floating point. Summing many such values compounds the error. The fix: use BigDecimal (exact decimal arithmetic) or store amounts as integer paise/cents and display by dividing. Covered in Day 20 (Value Objects) and Day 53 (Splitwise).',
    w: { 1: 'double arithmetic is fast — speed is not the issue.', 2: 'Java has no such specification rule — this is a correctness concern, not a language rule.', 3: 'double is not the problematic part for thread safety; shared mutable state is.' },
    r: { id: 's4', label: 'Section 4 — SOLID quick reference' },
  },
  {
    q: 'When should you reach for a Decorator instead of a Subclass?',
    o: [
      'When you need to add a method that does not exist on the base class',
      'When you want to add or compose behavior at runtime per instance without a class explosion (e.g., coffee + milk + sugar)',
      'When the added behavior is always permanent',
      'Decorators are only for UI components',
    ],
    a: 1,
    e: 'Subclass adds behavior at compile time for all instances of that class. Decorator wraps a single object at runtime — you can add milk to this cup, sugar to that cup, both to a third. This avoids the 2^n subclass explosion for n combinable features. Covered in Day 27.',
    w: { 0: 'Adding new methods is better done via composition or a new interface, not Decorator.', 2: 'The whole point of Decorator is runtime-removable layering — if the behavior is permanent, a subclass or field may be simpler.', 3: 'Decorator is a general pattern; Java I/O streams, Collections.unmodifiableList, and surge pricing wrappers all use it.' },
    r: { id: 's3', label: 'Section 3 — GoF frequency table' },
  },
  {
    q: 'Which of the 7 problem shapes applies to an Amazon Locker assignment system?',
    o: [
      'Game loop — turn-based package placement',
      'Pipeline + framework — packages flow through stages',
      'Resource + atomic claim — limited locker slots that multiple couriers race to claim; CAS on slot state prevents double-assignment',
      'Money + ledger — package pricing',
    ],
    a: 2,
    e: 'A locker slot is a limited resource (like a parking spot or a seat). Multiple couriers can try to claim the same slot simultaneously. The defining constraint is the atomic CAS: compareAndSet(AVAILABLE, OCCUPIED). Exactly one courier wins. This is the same shape as Parking Lot, BookMyShow, and Hotel Booking.',
    w: { 0: 'Lockers have no turn structure or rules engine.', 1: 'The system does not process a request through a chain of handlers.', 3: 'Payment exists but the hard design problem is the atomic slot claim, not balance tracking.' },
    r: { id: 's2', label: 'Section 2 — The 7 problem shapes' },
  },
]

/* ============================================================
   The page
   ============================================================ */
export default function Day78() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 16 · Day 78</div>
        <h1>The Full Course Recap:<br />80 Days of LLD</h1>
        <p>
          This is your revision atlas. Every pattern, every shape, every system — in one dense reference.
          Read it before every interview. Use the drills at the bottom to test recall without looking.
          Click everything — the interactive demos reveal gaps that rereading hides.
        </p>
        <div className="chips">
          {['All 4 Months', '23 GoF Patterns', '7 Problem Shapes', 'Pattern Frequency', 'Interview Checklist', 'Concurrency Drill', 'Shape Identifier'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* ── s1: The 4-month arc ── */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The 4-month arc — the full journey at a glance</h2>
        <p>
          The course is built as four layers. Each month adds a new kind of thinking on top of the last.
          Month 1 gives you the language. Month 2 gives you the vocabulary. Month 3 puts the vocabulary to work.
          Month 4 adds the hardest constraints: concurrency and scale.
        </p>
        <Code html={`  THE 80-DAY LLD JOURNEY

  Month 1 — OOP Mastery + SOLID (Days 1–20)
  ─────────────────────────────────────────────────────────────
  Week 1 · Core OOP
    Day  1  Classes & Objects          blueprint → house; new, this, access modifiers
    Day  2  Encapsulation              getters/setters, final, defensive copy
    Day  3  Inheritance                extends, super, constructor chaining
    Day  4  Polymorphism               overloading vs overriding, dynamic dispatch
    Day  5  Abstraction                abstract class vs interface, default methods
  Week 2 · Relationships + UML
    Day  6  Association/Aggregation/Composition  has-a hierarchy + lifecycle + UML diamonds
    Day  7  Dependency + Composition over Inheritance  uses-a, fragile base, delegation
    Day  8  UML Class Diagrams         3-compartment box, 6 arrow types, multiplicity
    Day  9  UML Sequence Diagrams      lifelines, activation bars, alt/opt/loop
    Day 10  Requirements → Entities    noun-verb, Information Expert, god class trap
  Week 3 · SOLID (one principle per day)
    Day 11  SRP · one reason to change per class
    Day 12  OCP · add by adding files, not editing
    Day 13  LSP · subtypes must not surprise substituters
    Day 14  ISP · clients must not depend on methods they don't use
    Day 15  DIP · depend on abstractions; invert the arrow
  Week 4 · Beyond SOLID
    Day 16  DRY / KISS / YAGNI        knowledge not code; rule of three; simplest that works
    Day 17  Coupling & Cohesion        office-floor analogy; blast radius; shotgun surgery
    Day 18  Law of Demeter             paperboy/wallet; only talk to direct friends
    Day 19  Enums & Exception Design   per-constant behaviour; checked vs unchecked
    Day 20  Value Objects              Money (BigDecimal); equals+hashCode contract; records

  Month 2 — GoF Design Patterns (Days 21–40)
  ─────────────────────────────────────────────────────────────
  Week 5 · Creational
    Day 21  Singleton                  6 implementations; reflection/serialization attacks
    Day 22  Factory Method             scattered new → creator hierarchy; JDK static factories
    Day 23  Abstract Factory           furniture showroom; family consistency
    Day 24  Builder                    telescoping zoo; Effective Java nested builder
    Day 25  Prototype                  Cloneable minefield; copy constructors; registry
  Week 6 · Structural
    Day 26  Adapter                    frozen-boundary; object adapter; ports & adapters
    Day 27  Decorator                  condiments; runtime layering; java.io assembler
    Day 28  Composite                  folder-size; List<Component> as recursive type
    Day 29  Facade & Proxy             concierge vs bodyguard; 5 kinds of proxy
    Day 30  Flyweight & Bridge         stamp/remote; intrinsic/extrinsic; m×n→m+n
  Week 7 · Behavioral I
    Day 31  Strategy                   WHEN+data vs HOW; Comparator; lambda strategies
    Day 32  Observer                   channel/subscribers; push vs pull; CME/lapsed listener
    Day 33  Command                    order slip; 4 roles; two-stack undo/redo
    Day 34  State                      switch-grid disease; states name successors
    Day 35  Template Method            Hollywood Principle; final template + protected blanks
  Week 8 · Behavioral II
    Day 36  Chain of Responsibility    support-desk; fall-off policy; FilterChain
    Day 37  Iterator                   next-button; CME + modCount; fail-fast vs weakly-consistent
    Day 38  Mediator                   tower analogy; N²→N; god-mediator trap
    Day 39  Memento                    save-slot; inner-class opacity; deep-copy rules
    Day 40  Visitor                    inspector's rounds; double dispatch; accept() trampoline

  Month 3 — Classic LLD Problems (Days 41–60)
  ─────────────────────────────────────────────────────────────
  Week  9 · First Classics
    Day 41–42  Parking Lot             SpotState CAS; Ticket record; pricing Strategy
    Day 43     Tic-Tac-Toe            N×N; O(1) tally-scoreboard win check
    Day 44     Snake & Ladder          Dice strategy; overshoot/bounce toggle
    Day 45     Week 9 Drill
  Week 10 · Machines
    Day 46–47  Elevator                SCAN vs FCFS; SchedulingStrategy; fleet dispatch
    Day 48     Vending Machine         State flagship; stateless state singletons; change-making
    Day 49     Logging Framework       hierarchy CoR; SLF4J facade; async appender Decorator
    Day 50     Week 10 Drill
  Week 11 · Big Systems
    Day 51–52  BookMyShow              Seat≠ShowSeat; CAS hold; save-before-charge
    Day 53     Splitwise               min-cash-flow settle-up; paise not double
    Day 54     ATM                     State + atomicity; dispense = change-making; idempotency
    Day 55     Week 11 Drill
  Week 12 · Data Structures
    Day 56     LRU Cache               HashMap + DLL; O(1) get+put; eviction Strategy
    Day 57     Notification System     5 axes; CoR pipeline; retry/failover; MDC
    Day 58–59  Cab Booking             spatial index; 2 coupled state machines; surge Decorator
    Day 60     Week 12 Drill

  Month 4 — Advanced LLD (Days 61–80)
  ─────────────────────────────────────────────────────────────
  Week 13 · Concurrency
    Day 61     Concurrency Part 1      races: lost-update, check-then-act, JMM visibility
    Day 62     Concurrency Part 2      cures: atomic, volatile, synchronized, Lock, CAS
    Day 63     Producer–Consumer       bounded BlockingQueue; pool IS producer-consumer
    Day 64     Optimistic vs Pessimistic  version column; LEASE = CAS + TTL
    Day 65     Rate Limiter            token bucket; per-client lock; distributed Redis
  Week 14 · Advanced Problems
    Day 66     Chess                   polymorphic movement; 4-stage pipeline; Command undo
    Day 67     Food Delivery           6-state 3-party order; surge Decorator; snapshot price
    Day 68     Amazon Locker           greedy smallest-fit; CAS slot; pickup code VO
    Day 69     Pub-Sub                 append-only log; consumer offset; at-least-once
    Day 70     Week 14 Drill
  Week 15 · Machine Coding Practice
    Day 71–75  Timed solo tracks (Hotel, Auction, Social Feed, Task Board, Drill)
  Week 16 · Mocks + Recap + Graduation
    Day 76–77  Mock interviews
    Day 78     Full course recap (this page)
    Day 79     Interview day prep
    Day 80     Graduation`} />
        <Note>
          <strong>How the months build on each other:</strong> Month 1 = the OOP building blocks.
          Month 2 = names for recurring design solutions (the patterns). Month 3 = applying those patterns
          to real-world system design problems. Month 4 = what happens when multiple threads hit those systems.
          You cannot skip layers — a Month 3 seat-booking problem is just a Month 2 CAS wrapped in a Month 1 object.
        </Note>
      </section>

      {/* ── s2: The 7 problem shapes ── */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The 7 problem shapes — master taxonomy</h2>
        <p>
          Every LLD interview problem fits one or more of these seven shapes. Naming the shape in the
          first 2 minutes of clarification tells the interviewer you have seen this class of problem before.
          It also tells YOU which design decisions are load-bearing.
        </p>
        <Code html={`  THE 7 PROBLEM SHAPES

  1. RESOURCE + ATOMIC CLAIM
     What it is   : a limited resource that multiple actors compete to claim simultaneously
     Examples     : Parking Lot, BookMyShow seats, Hotel rooms, Amazon Locker slots, Gym equipment
     Defining Q   : "what happens if two users claim the last one at the same time?"
     Load-bearing : compareAndSet(AVAILABLE, HELD) — never check-then-act unsafely
     Days         : 41, 42, 51, 52, 54, 68

  2. STATE MACHINE + LIFECYCLE
     What it is   : an object that progresses through defined states with guarded transitions
     Examples     : Vending Machine, ATM, Food Delivery order, Auction, Elevator car
     Defining Q   : "what does the same action do in different states?"
     Load-bearing : canTransitionTo(); one method per event; states name their own successors
     Days         : 34, 48, 54, 66, 67, 72

  3. SCHEDULING + DISPATCH
     What it is   : assign work units (requests, jobs, packages) to workers (cars, agents, servers)
     Examples     : Elevator (SCAN), Cab Booking (nearest), Rate Limiter, Delivery agent matching
     Defining Q   : "what is the objective function? minimise travel time? maximise throughput?"
     Load-bearing : SchedulingStrategy / MatchingStrategy seam; tick-based or event-driven loop
     Days         : 46, 47, 58, 59, 65, 67

  4. MONEY + LEDGER
     What it is   : balances, transfers, fees — where correctness is more important than performance
     Examples     : Splitwise, ATM cash, Digital Wallet, BookMyShow payment, OrderItem pricing
     Defining Q   : "what is the unit of currency? how do we prevent double-charge or rounding loss?"
     Load-bearing : BigDecimal / integer paise; save-before-charge; idempotency key; snapshot price
     Days         : 20, 52, 53, 54, 59, 67

  5. PIPELINE + FRAMEWORK
     What it is   : a request passes through a chain of handlers/layers; sinks are pluggable
     Examples     : Logging (Logger→Appender→Layout), Notification, Pub-Sub delivery, Middleware
     Defining Q   : "how do I add a new sink/channel/filter without changing existing ones?"
     Load-bearing : Chain of Responsibility + Strategy for each stage; composition root wires sinks
     Days         : 36, 49, 57, 69

  6. GAME LOOP
     What it is   : turn-based or real-time play with a rules engine and win detection
     Examples     : Tic-Tac-Toe, Snake & Ladder, Chess, Connect Four
     Defining Q   : "who decides if a move is legal? who detects win/draw/loss?"
     Load-bearing : Board + Piece separation; piece owns legalMoves(); win = derived from board state
     Days         : 43, 44, 66

  7. DS FOR COMPLEXITY TARGET
     What it is   : a stated O(?) requirement that rules out naive structures
     Examples     : LRU Cache (O(1) get+put), TTL Cache (O(1) expiry), Social Feed (cursor paging)
     Defining Q   : "what is the time complexity target? work backward from the target."
     Load-bearing : state the target FIRST; then pick structures that meet it; prove it
     Days         : 56, 73`} />
        <Note>
          <strong>Multi-shape problems exist.</strong> Food Delivery = State Machine (Order lifecycle) + Scheduling (agent dispatch).
          Cab Booking = State Machine (Driver + Trip) + Scheduling (spatial dispatch) + Resource (driver claim).
          BookMyShow = Resource (seat claim) + Money (payment) + State (ShowSeat lifecycle). Naming ALL shapes is the
          signal of mastery.
        </Note>
      </section>

      {/* ── s3: GoF frequency table ── */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>GoF pattern frequency — which patterns appear most</h2>
        <p>
          Not all 23 GoF patterns are equally important in practice. The table below ranks them by how
          many times they appear across the full course. The top 5 account for 80% of all design decisions
          in real LLD interviews.
        </p>
        <table className="matrix">
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Category</th>
              <th>Times used across course</th>
              <th>Key examples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>State</strong></td><td>Behavioral</td><td>12+</td>
              <td>Vending Machine (D48), ATM (D54), Food Delivery order (D67), Auction (D72), Elevator car, Chess game status</td>
            </tr>
            <tr>
              <td><strong>Strategy</strong></td><td>Behavioral</td><td>10+</td>
              <td>Cab dispatch (D58–59), Elevator scheduling (D47), Rate Limiter (D65), Pricing (D67), Parking allocation (D42), Eviction (D56)</td>
            </tr>
            <tr>
              <td><strong>Observer</strong></td><td>Behavioral</td><td>10+</td>
              <td>Core pattern (D32), BookMyShow seat map (D51), Notification (D57), Pub-Sub (D69), Task Board (D74), Food Delivery tracking</td>
            </tr>
            <tr>
              <td><strong>Command</strong></td><td>Behavioral</td><td>6+</td>
              <td>Order slip (D33), Elevator request (D47), Chess Move with undo (D66), Task Board action (D74)</td>
            </tr>
            <tr>
              <td><strong>Adapter</strong></td><td>Structural</td><td>6+</td>
              <td>Core (D26), Payment gateways (PaymentGateway→Stripe/Razorpay), SMS providers (Twilio/MSG91), map providers</td>
            </tr>
            <tr>
              <td><strong>Decorator</strong></td><td>Structural</td><td>5+</td>
              <td>Core (D27), java.io streams, Surge pricing (D59, D67), Async appender (D49), unmodifiableList wrapper</td>
            </tr>
            <tr>
              <td><strong>Composite</strong></td><td>Structural</td><td>4+</td>
              <td>Core (D28), File system, Booking group, Task Board nested tasks (D74), Swing/DOM trees</td>
            </tr>
            <tr>
              <td><strong>Template Method</strong></td><td>Behavioral</td><td>4+</td>
              <td>Core (D35), JdbcTemplate, CoR's pass-along step (D36), Elevator step() loop (D47)</td>
            </tr>
            <tr>
              <td><strong>Facade</strong></td><td>Structural</td><td>3+</td>
              <td>Core (D29), SLF4J hiding Log4j/Logback (D49), Buy-Now simplified checkout</td>
            </tr>
            <tr>
              <td><strong>Factory Method</strong></td><td>Creational</td><td>3+</td>
              <td>Core (D22), JDK List.of / Map.of, payment gateway factory, piece factory in Chess (D66)</td>
            </tr>
            <tr>
              <td><strong>Singleton</strong></td><td>Creational</td><td>1 (intentionally)</td>
              <td>Core (D21) — named in LoggerFactory (D49), but DI is better everywhere else. Treat as anti-pattern outside narrow use cases.</td>
            </tr>
          </tbody>
        </table>
        <Good>
          <strong>Interview shortcut:</strong> if you name the right pattern, you usually also find the right structure.
          "I will use a Strategy for the allocation algorithm and inject it at construction time" signals OCP + DIP +
          testability in one sentence.
        </Good>
      </section>

      {/* ── s4: SOLID quick-reference ── */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>SOLID + principles quick reference</h2>
        <p>
          One sentence per principle. One counter-example from the course. Memorise the counter-examples —
          they prove you understand the principle, not just the name.
        </p>
        <table className="matrix">
          <thead>
            <tr><th>Principle</th><th>One sentence</th><th>Counter-example from course</th><th>Day</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>SRP</strong></td>
              <td>One class = one reason to change (one actor owns it).</td>
              <td>God class computing tax + formatting print + persisting to DB — three actors, three reasons to change.</td>
              <td>11</td>
            </tr>
            <tr>
              <td><strong>OCP</strong></td>
              <td>Add new variants by adding new classes, not editing existing ones.</td>
              <td>Growing <C>if (shape == CIRCLE) ... else if (shape == SQUARE)</C> — every new shape reopens existing code.</td>
              <td>12</td>
            </tr>
            <tr>
              <td><strong>LSP</strong></td>
              <td>A subtype must be substitutable for its supertype without surprising the caller.</td>
              <td>Square.setWidth(5) silently also sets height — violates Rectangle's post-condition (area = w × h with independent axes).</td>
              <td>13</td>
            </tr>
            <tr>
              <td><strong>ISP</strong></td>
              <td>Clients should not depend on methods they do not use.</td>
              <td>Fat <C>IMachine</C> with print+scan+fax — a printer must implement fax() and throw UnsupportedOperationException.</td>
              <td>14</td>
            </tr>
            <tr>
              <td><strong>DIP</strong></td>
              <td>High-level modules depend on abstractions, not concretions; the abstraction is owned by the high-level module.</td>
              <td>Business logic importing <C>new MySQLDatabase()</C> directly — change to PostgreSQL = edit business code.</td>
              <td>15</td>
            </tr>
            <tr>
              <td><strong>DRY</strong></td>
              <td>Don't duplicate knowledge — but false duplication (same code, different actors) is OK.</td>
              <td>Copying the same tax-calc if-block for US and EU teams — they look the same now but will diverge independently.</td>
              <td>16</td>
            </tr>
            <tr>
              <td><strong>Demeter</strong></td>
              <td>Only talk to your immediate friends — no train wrecks through intermediate objects.</td>
              <td><C>order.getCustomer().getAddress().getZip()</C> — Order knows the internal structure of Customer and Address.</td>
              <td>18</td>
            </tr>
          </tbody>
        </table>
        <Reveal summary="Bonus: The coupling ladder and cohesion ladder (Day 17)">
          <Code html={`  COUPLING (lower = better)
  Content   — class A directly modifies fields of class B
  Common    — A and B share a mutable global variable
  Control   — A passes a flag telling B which branch to take
  Data      — A passes only simple value parameters (✅ default target)
  Interface — A depends only on an interface, not a class (✅✅ best)

  COHESION (higher = better)
  Coincidental — methods grouped by accident (junk-drawer Utils class)
  Logical      — "email things" mixed together regardless of use
  Functional   — every method contributes to one well-defined purpose (✅ goal)`} />
        </Reveal>
      </section>

      {/* ── s5: Concurrency cheat sheet ── */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Concurrency cheat sheet — Month 4 Week 13</h2>
        <p>
          The three root causes of all concurrency bugs: shared state + mutable state + multiple threads.
          Remove any one of the three and the bug cannot exist. Below is the fast-reference for when you
          cannot remove any of them.
        </p>
        <table className="matrix">
          <thead>
            <tr><th>Problem</th><th>Root cause</th><th>Correct fix</th><th>Day</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Lost update (<C>count++</C>)</td>
              <td>Read-modify-write is three non-atomic operations</td>
              <td><C>AtomicInteger.incrementAndGet()</C> or <C>synchronized</C> block</td>
              <td>62</td>
            </tr>
            <tr>
              <td>Check-then-act race (seat booking)</td>
              <td>Two steps — check and act — with a gap between them</td>
              <td><C>compareAndSet(AVAILABLE, BOOKED)</C> collapses both into one atomic step</td>
              <td>51, 62</td>
            </tr>
            <tr>
              <td>Visibility bug (<C>while(!stop)</C>)</td>
              <td>JMM does not guarantee cross-thread visibility without happens-before</td>
              <td><C>volatile boolean stop</C> establishes the happens-before edge</td>
              <td>61</td>
            </tr>
            <tr>
              <td>Deadlock</td>
              <td>Thread A holds lock1, waits for lock2; Thread B holds lock2, waits for lock1</td>
              <td>Consistent global lock ordering; or <C>tryLock(timeout)</C> with retry</td>
              <td>62</td>
            </tr>
            <tr>
              <td>Unbounded queue OOM</td>
              <td>Producer outpaces consumer; no backpressure</td>
              <td>Bounded <C>BlockingQueue</C>: <C>put()</C> blocks producer when full</td>
              <td>63</td>
            </tr>
            <tr>
              <td>Double-booking (stale read)</td>
              <td>Version/state read and write are not atomic at DB level</td>
              <td>Optimistic: <C>UPDATE ... WHERE version = ?</C>; zero rows = conflict, retry</td>
              <td>64</td>
            </tr>
            <tr>
              <td>Lost wakeup</td>
              <td><C>notify()</C> fires before <C>wait()</C>; signal is lost</td>
              <td>Always guard with <C>while (!condition) {'{'} wait(); {'}'}</C></td>
              <td>63</td>
            </tr>
            <tr>
              <td>Lock bottleneck (global lock)</td>
              <td>One lock serialises all threads, even for unrelated work</td>
              <td>Per-client locks (stripe locking): threads for different keys never contend</td>
              <td>65</td>
            </tr>
          </tbody>
        </table>
        <Code html={`  CONCURRENCY CURE HIERARCHY (prefer higher = safer)

  1. IMMUTABLE     — no mutation possible → no race possible
  2. CONFINED      — only one thread ever touches the object
  3. ATOMIC        — java.util.concurrent.atomic classes (CAS loop)
  4. VOLATILE      — visibility + ordering for flags/publication; NOT for compound actions
  5. SYNCHRONIZED  — atomicity + visibility; synchronized method or block
  6. LOCK          — ReentrantLock for tryLock / conditions / fairness
  7. CONCURRENT    — ConcurrentHashMap, CopyOnWriteArrayList — built-in thread-safe collections

  When in doubt, go higher on this ladder.
  Reaching for synchronized before trying immutable/confined is over-engineering.`} />
        <Note>
          <strong>volatile is NOT a substitute for synchronized.</strong> <C>volatile int x; x++;</C> still races
          because x++ is read-modify-write (three steps). volatile only guarantees that reads see the latest
          write — it does not make compound operations atomic.
        </Note>
      </section>

      {/* ── s6: Pattern → problem mapping ── */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Pattern → problem mapping</h2>
        <p>
          A quick cross-reference: when you hear a problem name, which GoF patterns does it pull in?
          Use this during clarification to name patterns early.
        </p>
        <Code html={`  PROBLEM                 PATTERNS USED
  ──────────────────────────────────────────────────────────────
  Parking Lot             State (SpotState), Strategy (allocation), Observer (boards),
                          Template Method (park/exit flow)

  Vending Machine         State (flagship), Flyweight (stateless state singletons)

  Elevator                State (car), Strategy (SCAN/FCFS), Command (HallCall/CabinCall),
                          Template Method (step() loop)

  BookMyShow              State (ShowSeat lifecycle), Observer (live seat map),
                          Strategy (pricing), Adapter (payment gateways)

  Splitwise               Strategy (split calculation), Adapter (none — pure domain)

  ATM                     State (flagship #2), Adapter (hardware ports / BankService),
                          Strategy (denomination selection)

  LRU Cache               Strategy (EvictionPolicy), Iterator (internal)

  Notification System     Chain of Responsibility (pipeline), Strategy (Appender×Layout),
                          Adapter (Twilio/MSG91), Observer (event source decoupling)

  Cab Booking             State (Driver + Trip), Strategy (MatchingStrategy, FareStrategy),
                          Decorator (SurgePricing), Adapter (map/payment providers),
                          Observer (location pings → re-index)

  Logging Framework       Chain of Responsibility (hierarchy propagation), Strategy (Layout),
                          Decorator (AsyncAppender), Facade (SLF4J), Singleton (LoggerFactory)

  Chess                   Strategy (legalMoves per piece = polymorphism IS strategy-like),
                          Command (Move with apply/undo), State (Chess game status),
                          Factory Method (piece creation), Composite (board of squares)

  Food Delivery           State (Order, Driver, Trip), Strategy (FareStrategy, MatchingStrategy),
                          Decorator (SurgePricing), Adapter (payment, map),
                          Observer (order tracking), Command (order action)

  Amazon Locker           State (LockerSlot), Strategy (size selection), Value Object (pickup code)

  Pub-Sub                 Observer (publisher/subscriber), Chain of Responsibility (delivery retry),
                          Iterator (consumer cursor through log), Strategy (per-subscriber filter)

  Social Feed             Strategy (fan-out vs pull-on-read), Observer (new-post events),
                          Iterator (cursor-based pagination)

  Hotel Booking           State (RoomNight lifecycle), Strategy (pricing per season),
                          Adapter (payment), Observer (availability update)`} />
      </section>

      {/* ── s7: Draw from memory ── */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Draw from memory — 8 landmark diagrams</h2>
        <p>
          An interviewer watching you draw the right diagram at the right moment is a strong hire signal.
          These 8 diagrams are the ones you should be able to reproduce with a whiteboard marker, no notes.
        </p>

        <Code html={`  DIAGRAM 1 — Stack vs Heap memory model (Day 1)

  Thread Stack                     Heap (shared)
  ┌────────────────┐               ┌────────────────────────────────┐
  │ main()         │               │  ┌─────────────────────┐       │
  │  car1 ─────────┼──────────────▶│  │ Car object          │       │
  │  car2 ─────────┼──────────────▶│  │  color = "Red"      │       │
  │  x = 5 (prim.) │               │  │  speed = 100        │       │
  └────────────────┘               │  └─────────────────────┘       │
  Thread 2 Stack                   │  ┌─────────────────────┐       │
  ┌────────────────┐               │  │ Car object          │       │
  │ run()          │               │  │  color = "Blue"     │       │
  │  local = 7     │               │  └─────────────────────┘       │
  └────────────────┘               └────────────────────────────────┘
  Primitives live in the stack.    Objects live in the heap.
  Stack is per-thread.             Heap is shared — this is where races happen.`} />
        <Reveal summary="When to draw this: Stack vs Heap">
          Draw this when asked "where does an object live?" or any question about thread safety.
          It proves you know WHY shared mutable heap state is the root cause of races — not just
          that they exist. Draw it in the first minute of any concurrency discussion.
        </Reveal>

        <Code html={`  DIAGRAM 2 — UML class box with all 6 arrow types (Day 8)

  ┌──────────────────┐
  │ «interface»      │
  │ Printable        │         ◀ ─ ─ ─ ─ ─   dependency (uses-a, dashed arrow)
  ├──────────────────┤
  │ + print(): void  │
  └──────────────────┘
          △                    △ = open triangle = inheritance / realization
          │                    ──────│──── = solid line = extends or implements
  ┌───────────────────┐
  │ + name: String    │
  │ # id: int         │         + public   # protected   - private   ~ package
  │ - secret: double  │
  ├───────────────────┤
  │ + doWork(): void  │
  └───────────────────┘
       ◆────────              ◆ = filled diamond = composition (part DIES with whole)
       ◇────────              ◇ = open diamond = aggregation (part SURVIVES whole)
       ─────────▶             ▶ = open arrow = association (knows-about)
       - - - - -▶             dashed ▶ = dependency (uses temporarily)`} />
        <Reveal summary="When to draw this: UML arrow types">
          Draw this the moment the interviewer asks you to model relationships. Drawing all 6 arrow
          types and labelling them in 60 seconds proves you own UML. Do it before the entity model,
          not after — it sets the vocabulary for the rest of the session.
        </Reveal>

        <Code html={`  DIAGRAM 3 — State pattern template (Day 34)

  ┌──────────────────────────────────────────┐
  │ Context (VendingMachine / ATM / Order)   │
  │  - state: VendingState                   │
  │  + insertCoin()  ──▶ state.insertCoin()  │
  │  + pressButton() ──▶ state.pressButton() │
  │  + setState(s)                           │
  └──────────────────────────────────────────┘
               │ delegates all events
               ▼
  ┌───────────────────────┐    «interface»
  │ VendingState           │◀ ─ ─ all concrete states implement this
  │ + insertCoin(ctx)      │
  │ + pressButton(ctx)     │
  └───────────────────────┘
        △         △         △
        │         │         │
   IdleState  HasMoneyState  SoldOutState
   (no coin   (coin in,      (inventory
    inserted)  awaiting       empty)
               select)

  Each concrete state calls ctx.setState(nextState) to transition.
  The context has zero if-state logic.`} />
        <Reveal summary="When to draw this: State pattern">
          Draw this whenever a problem has an object that behaves differently depending on what
          it is currently "doing." Three warning signs: a switch on a status field, an if-else
          ladder on state, or the phrase "the button does different things depending on the mode."
          Drawing this diagram plus one concrete state's code is a complete State answer.
        </Reveal>

        <Code html={`  DIAGRAM 4 — Observer publisher/subscriber topology (Day 32)

  Publisher (Observable)              Subscribers (Observers)
  ┌─────────────────────┐            ┌──────────────────────┐
  │ OrderService        │            │ KitchenDisplay        │
  │  List<Observer>     │──notify──▶ │  + onOrderPlaced(e)   │
  │  + subscribe(obs)   │            └──────────────────────┘
  │  + notify(event)    │            ┌──────────────────────┐
  │  + placeOrder()     │──notify──▶ │ DeliveryTracker       │
  └─────────────────────┘            │  + onOrderPlaced(e)   │
                                     └──────────────────────┘
                                     ┌──────────────────────┐
                                     │ NotificationService   │──notify──▶ customer SMS
                                     └──────────────────────┘

  Publisher does NOT know the subscriber types.
  Add a new subscriber = add one line (subscribe). Zero changes to publisher.
  OCP in action.`} />
        <Reveal summary="When to draw this: Observer">
          Draw this whenever the system needs to notify multiple parties about an event without
          coupling them. Common triggers: "the customer, kitchen, and driver all need to know
          when an order is placed." The diagram proves loose coupling + extensibility in one picture.
        </Reveal>

        <Code html={`  DIAGRAM 5 — BookMyShow entity model (Day 51)

  Movie ─── has many ──▶ Show ─── has many ──▶ ShowSeat (THE atomic unit)
   title                  movie                  show
   duration               screen                 seat (physical reference)
                          startTime              type: GOLD/SILVER/PLATINUM
                          endTime                price: Money
                                                 status: AVAILABLE/HELD/BOOKED
                                                 holdExpiry: Instant

  Screen ─── has many ──▶ Seat (physical)
               capacity      row + col
               layout        type

  KEY INSIGHT: Seat ≠ ShowSeat.
  The same physical Seat exists once.
  A ShowSeat is created for EACH Show that uses that screen.
  ShowSeat.status is what gets claimed atomically.

  Race:   Thread A reads ShowSeat.status == AVAILABLE
          Thread B reads ShowSeat.status == AVAILABLE
  Fix:    compareAndSet(AVAILABLE, HELD) — one wins, one retries`} />
        <Reveal summary="When to draw this: BookMyShow entity model">
          Draw this when asked to design any ticketing or reservation system. The Seat/ShowSeat
          split is the insight that separates candidates who understand resource modeling from
          those who conflate physical resource with availability record. This diagram alone has
          made candidates receive offers.
        </Reveal>

        <Code html={`  DIAGRAM 6 — Check-then-act race + fix (Day 62)

  WITHOUT CAS (broken):
  ─────────────────────────────────────────────────────────────
  Thread A                         Thread B
  read status → AVAILABLE          read status → AVAILABLE   ← both see free
  ... (gap) ...                    ... (gap) ...
  write status = BOOKED            write status = BOOKED     ← both claim it!

  WITH CAS (correct):
  ─────────────────────────────────────────────────────────────
  Thread A                         Thread B
  compareAndSet(AVAILABLE, BOOKED) compareAndSet(AVAILABLE, BOOKED)
  → returns true (wins!)           → returns false (loses!)
  proceed with booking             loop: find next available seat

  compareAndSet is ATOMIC: check + swap happen in one CPU instruction.
  No gap. No race.`} />
        <Reveal summary="When to draw this: check-then-act race">
          Draw this the moment the interviewer asks "what if two users book at the same time?"
          It takes 30 seconds to sketch and immediately demonstrates that you understand
          concurrency at the CPU level, not just the Java API level. This is the most-asked
          technical follow-up in Month 3 system design problems.
        </Reveal>

        <Code html={`  DIAGRAM 7 — Fan-out vs pull-on-read (Day 73)

  FAN-OUT (write-time delivery):
  ┌─────────┐  new post   ┌────────────┐
  │ Creator │─────────────▶ FeedService │──▶ write to each follower's feed table
  └─────────┘             └────────────┘    (O(followers) writes per post)
  Read: O(1) — just read your pre-built feed.
  Use when: follower count is low/moderate (<1000).

  PULL-ON-READ (read-time assembly):
  ┌─────────┐  new post   ┌────────────┐
  │ Creator │─────────────▶ PostStore  │   (just write the post once)
  └─────────┘             └────────────┘
  Read: O(following) — merge latest posts from all followed users.
  Use when: creator has millions of followers (celebrity problem).

  HYBRID: celebrities → pull-on-read; regular users → fan-out.
  Identify celebrities by follower threshold (e.g. > 1M).`} />
        <Reveal summary="When to draw this: fan-out vs pull-on-read">
          Draw this for any social media / feed system question. The fan-out vs pull trade-off
          is the defining design decision for Social Feed, Twitter/X, and Instagram-like systems.
          Drawing both architectures plus the hybrid shows you know when each is appropriate —
          not just that both exist.
        </Reveal>

        <Code html={`  DIAGRAM 8 — The 7 problem shapes map

  ┌──────────────────┬──────────────────────────────────────────────┐
  │  Shape           │  Tell (the thing that names the shape)       │
  ├──────────────────┼──────────────────────────────────────────────┤
  │ Resource + claim │ "two users can take the last one"            │
  │ State machine    │ "same action, different behaviour by state"  │
  │ Scheduling       │ "assign requests to workers optimally"       │
  │ Money + ledger   │ "balances, transfers, fees — no rounding"    │
  │ Pipeline         │ "chain of handlers, pluggable sinks"         │
  │ Game loop        │ "turn-based, rules engine, win detection"    │
  │ DS + complexity  │ "O(1) get AND O(1) put — state the target"  │
  └──────────────────┴──────────────────────────────────────────────┘`} />
        <Reveal summary="When to draw this: shape map">
          Draw a small version of this 7-row table immediately after the problem statement, while
          you are still clarifying. Circle the shape(s) that apply. It signals structured thinking
          before you write a single line of code. Interviewers respond very well to this — it
          shows that you see the class of problem, not just the surface domain.
        </Reveal>
      </section>

      {/* ── s8: Shape identifier (interactive) ── */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>Play: Problem Shape Identifier</h2>
        <p>
          Pick the shape(s) for each problem. You get the reasoning and which day covered it.
          The goal: name the shape without reading the options. If you need the options, the shape
          is not yet automatic.
        </p>
        <ShapeIdentifier />
        <Good>
          <strong>What to notice:</strong> some problems have two shapes (Food Delivery = state machine + scheduling).
          Naming both is the senior signal. Naming one is acceptable. Naming none means the shape taxonomy is not yet
          automatic — re-read Section 2 and re-run this drill.
        </Good>
      </section>

      {/* ── s9: Concurrency drill ── */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>Play: Concurrency — which fix?</h2>
        <p>
          Eight classic concurrency bugs. For each one, pick the right cure. These are the bugs
          that appear in almost every LLD interview that involves shared state.
        </p>
        <ConcDrill />
        <Good>
          <strong>What to notice:</strong> volatile fixes visibility but NOT atomicity. synchronized fixes both.
          AtomicInteger is lighter than synchronized for single-variable operations. The most common mistake
          is reaching for synchronized when volatile is enough — or worse, reaching for volatile when synchronized
          is needed.
        </Good>
      </section>

      {/* ── s10: Revision checklists ── */}
      <section id="s10">
        <div className="sec-label">Section 10 · Interactive</div>
        <h2>Month-by-month revision checklists</h2>
        <p>
          Check off only things you can do <em>right now</em> without re-reading the course.
          Honest self-assessment turns gaps into re-read targets. Hidden gaps become interview losses.
        </p>
        <RevisionChecklists />
        <Warn>
          <strong>The honest rule:</strong> "I know this" = "I can explain it out loud in 60 seconds."
          Not "I read this" or "I understand it in principle." If you need to think for more than
          5 seconds before starting your answer, it is not checked yet.
        </Warn>
      </section>

      {/* ── s11: 10-minute interview prep drill ── */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>10-minute interview prep drill — 10 questions you must answer from memory</h2>
        <p>
          Answer each question in your head before revealing. These are the highest-priority topics
          across all 4 months. If you can answer all 10, you are interview-ready.
        </p>
        <Reveal summary="Q1: What is the check-then-act race? Give an example and the fix.">
          <p>
            <strong>What it is:</strong> two steps that should be atomic but are not — "check a condition,
            then act on it." A gap between the check and the act lets another thread change the condition.
          </p>
          <p>
            <strong>Example:</strong> two users both read seat.status == AVAILABLE. Both proceed. Both claim
            the seat. Now both have a booking for one seat.
          </p>
          <p>
            <strong>Fix:</strong> <C>compareAndSet(AVAILABLE, BOOKED)</C> — CAS is atomic at the CPU level.
            The check and the write happen in one instruction. Exactly one thread wins; the other gets <C>false</C>
            and retries. Covered in Days 51, 62.
          </p>
        </Reveal>
        <Reveal summary="Q2: What is the difference between State and Strategy?">
          <p>
            <strong>Strategy</strong> — the context picks an algorithm; the algorithm never changes the context's
            current "identity." It answers: "HOW is this done?" (FCFS vs SCAN, nearest vs lowest-ETA).
            Strategies are stateless and reusable.
          </p>
          <p>
            <strong>State</strong> — the current state defines behavior AND can trigger transitions to other states.
            It answers: "WHO am I right now?" (IDLE, HAS_MONEY, DISPENSING). States are aware of the lifecycle;
            strategies are not. Same structure in code (both are interface + concrete classes + delegation),
            entirely different intent and who-controls-transitions. Covered in Days 31, 34.
          </p>
        </Reveal>
        <Reveal summary="Q3: When should you use a Decorator instead of a Subclass?">
          <p>
            <strong>Subclass:</strong> adds behavior at compile time, permanently, for ALL instances of that class.
            Good when the behavior is always present and there are few combinations.
          </p>
          <p>
            <strong>Decorator:</strong> wraps a single object at runtime. You can add milk to this cup, skip it
            on that one, add both milk and sugar to a third. Avoids the 2^n subclass explosion for n combinable
            features. Also lets you add/remove behavior without changing the wrapped object's class. Rule of thumb:
            if you need to combine features per-instance at runtime, Decorator. If the feature is fixed for all
            instances of a type, subclass or interface. Covered in Day 27.
          </p>
        </Reveal>
        <Reveal summary="Q4: What is wrong with storing money as a double in Java?">
          <p>
            IEEE 754 floating-point (which <C>double</C> uses) cannot represent 0.1 exactly in base 2.
            The stored value is 0.1000000000000000055511151231257827021181583404541015625.
            Summing many such values compounds the error — you can end up with $99.9999999 instead of $100.
          </p>
          <p>
            <strong>Fix:</strong> use <C>BigDecimal</C> (exact decimal arithmetic) or store amounts as integer
            paise/cents and display by dividing at the UI layer. Never use <C>double</C> for calculations
            that will be stored or compared. Covered in Day 20 and Day 53.
          </p>
        </Reveal>
        <Reveal summary="Q5: Draw the food delivery order state machine from memory.">
          <Code html={`  PLACED ──▶ CONFIRMED ──▶ PREPARING ──▶ READY_FOR_PICKUP
                │                                         │
                │                                         ▼
             CANCELLED ◀──────────────────────   PICKED_UP ──▶ DELIVERED

  PLACED      : customer submitted order, restaurant not yet responded
  CONFIRMED   : restaurant accepted → trigger agent search (not before!)
  PREPARING   : restaurant is cooking
  READY       : food is ready at the counter
  PICKED_UP   : delivery agent collected food → no cancellation after this
  DELIVERED   : customer received order
  CANCELLED   : possible from PLACED or CONFIRMED only (before agent involvement)`} />
        </Reveal>
        <Reveal summary="Q6: Explain fan-out vs pull-on-read. When do you use each?">
          <p>
            <strong>Fan-out (write-time):</strong> when a user posts, immediately write to every follower's
            feed table. Read is O(1) — just select from your feed. But if a celebrity posts to 10 million
            followers, that is 10M writes per post — too expensive.
          </p>
          <p>
            <strong>Pull-on-read:</strong> just store the post once. When you read your feed, merge the latest
            posts from everyone you follow. Write is O(1); read is O(following). Works for celebrities but is
            slow for users who follow many accounts.
          </p>
          <p>
            <strong>Hybrid (the real answer):</strong> fan-out for regular users (&lt;1M followers); pull-on-read
            for celebrities (&gt;1M followers). Identify celebrities by a threshold and route accordingly. Covered
            in Day 73.
          </p>
        </Reveal>
        <Reveal summary="Q7: What does 'commit offset after processing' mean and why?">
          <p>
            In a Pub-Sub system, a consumer reads messages starting at its committed offset. After processing
            a message, it commits the new offset (saying "I have processed everything up to here").
          </p>
          <p>
            <strong>Commit BEFORE process</strong> = at-most-once delivery: if processing crashes, the message
            is skipped forever (data loss). Commit AFTER process = at-least-once delivery: if commit crashes,
            the message is replayed on restart (consumer must be idempotent — no problem). Data loss is
            unrecoverable; duplicate processing is manageable. Always commit after. Covered in Day 69.
          </p>
        </Reveal>
        <Reveal summary="Q8: How does the LRU Cache achieve O(1) for both get and put?">
          <p>
            Two data structures, each doing the job the other cannot:
          </p>
          <ul>
            <li><strong>HashMap&lt;K, Node&gt;</strong> — O(1) lookup: given a key, find the node instantly.</li>
            <li><strong>Doubly-linked list</strong> — O(1) reorder: given a node, unlink it and re-link at the head in 4 pointer writes. Singly-linked would be O(n) to find the previous node.</li>
          </ul>
          <p>
            The node stores its own key. So when we evict the tail (the least-recently-used item), we can
            call <C>map.remove(tail.key)</C> in O(1) — without scanning the map. Without the key in the node,
            eviction would be O(n). Covered in Day 56.
          </p>
        </Reveal>
        <Reveal summary="Q9: What is an idempotency key and why does payment need it?">
          <p>
            <strong>Idempotency key:</strong> a unique ID attached to a logical operation. If the operation
            is retried (due to network timeout, crash, etc.), the server recognises the duplicate key and
            returns the already-stored result instead of re-executing.
          </p>
          <p>
            <strong>Why payment needs it:</strong> a network timeout after a payment is charged leaves the
            client uncertain — did the charge happen or not? Without idempotency, retrying causes a double
            charge. With it, the retry returns "already processed" and the charge happens exactly once.
            Standard pattern: generate a UUID at charge initiation, include it in every retry, store it
            in the DB with the result. Covered in Days 52, 54.
          </p>
        </Reveal>
        <Reveal summary="Q10: Name all 5 SOLID principles in one sentence each.">
          <p>
            <strong>S — Single Responsibility:</strong> one class = one reason to change (one actor owns it).
          </p>
          <p>
            <strong>O — Open/Closed:</strong> open for extension (new classes), closed for modification (don't touch existing code).
          </p>
          <p>
            <strong>L — Liskov Substitution:</strong> a subtype must be substitutable for its supertype without surprising the caller.
          </p>
          <p>
            <strong>I — Interface Segregation:</strong> no client should be forced to depend on methods it doesn't use — split fat interfaces.
          </p>
          <p>
            <strong>D — Dependency Inversion:</strong> high-level modules depend on abstractions, not concretions; the abstraction is owned by the caller.
          </p>
        </Reveal>
      </section>

      {/* ── s12: Cheat sheet ── */}
      <section id="s12">
        <div className="sec-label">Section 12</div>
        <h2>Ultra-dense cheat sheet</h2>
        <Code html={`  OOP FOUNDATIONS (Month 1)
  ─────────────────────────────────────────
  · new = allocates object on heap, runs constructor, returns reference
  · this = "me" (the current object); super = "my parent class"
  · private → class only  ·  default → package  ·  protected → package + subclass  ·  public → all
  · static = belongs to class (one copy); instance = belongs to each object (own copy)
  · == compares references; .equals() compares content (override both with hashCode)
  · final field = set once in constructor, never changed (thread-safe by default)
  · Encapsulation: private fields + public getters + validation in setters
  · Inheritance: is-a. Composition: has-a. Prefer composition.
  · abstract class: partial template + shared state. interface: pure contract + multiple inheritance.
  · Method overriding (runtime dispatch) ≠ method overloading (compile-time resolution by signature)

  SOLID SUMMARY (Month 1 Week 3)
  ─────────────────────────────────────────
  S: one reason to change   O: open/closed with interfaces   L: subtypes don't surprise
  I: fat interfaces → split   D: inject abstractions not concretions
  DRY: knowledge not code   Demeter: only talk to direct friends   YAGNI: don't build speculative seams

  GoF PATTERNS QUICK-REF (Month 2)
  ─────────────────────────────────────────
  CREATIONAL
  · Singleton: private ctor + static holder or enum variant; never use as DI substitute
  · Factory Method: abstract createX() in parent; each subclass decides the concrete type
  · Abstract Factory: factory OF factories; ensures consistent family of objects
  · Builder: return this chaining; build() validates; immutable product
  · Prototype: copy constructor > Cloneable; deep copy for mutable fields

  STRUCTURAL
  · Adapter: translate interface A → interface B; wrap frozen external class
  · Decorator: is-a AND has-a; wraps same interface; adds behavior per instance at runtime
  · Composite: Component interface for both leaf and container; recursive structure
  · Facade: single simple entry point over a complex subsystem; does NOT hide the subsystem
  · Proxy: same interface; 5 kinds (virtual/protection/caching/logging/remote)
  · Flyweight: share intrinsic state; pass extrinsic state per-call; immutable shared objects
  · Bridge: separate abstraction hierarchy from implementation hierarchy; m×n → m+n

  BEHAVIORAL
  · Strategy: swap HOW (algorithm); context picks; strategy is stateless
  · Observer: notify O(n) subscribers; push vs pull; CopyOnWriteArrayList for safe iteration
  · Command: encapsulate a request as an object; supports undo (apply/undo), queuing, logging
  · State: swap WHO (current state); states name their own successors; context has zero if-state logic
  · Template Method: final algorithm skeleton; protected blanks filled by subclasses; Hollywood Principle
  · CoR: chain of handlers; each handles or passes; fall-off = 404/default; vs pipeline
  · Iterator: hasNext/next protocol; CME = modify during iteration; fail-fast via modCount
  · Mediator: N² → N; tower knows all; components know only tower; event-bus cousin
  · Memento: save/restore state; inner class for encapsulation; deep copy or immutability
  · Visitor: double dispatch; accept(v) → v.visit(this); adds operations without modifying types

  CONCURRENCY (Month 4 Week 13)
  ─────────────────────────────────────────
  · Root causes: shared + mutable + multithreaded. Eliminate any one → no race.
  · volatile: visibility + ordering. NOT atomic for compound operations (++ still races).
  · synchronized: atomicity + visibility. Lock on a private final object, not this.
  · AtomicInteger/Reference: CAS loop; lock-free for single-variable operations.
  · compareAndSet(expect, update): returns true if swap succeeded; false = retry.
  · ReentrantLock: tryLock(timeout) for deadlock avoidance; unlock in finally.
  · Deadlock fix: consistent global lock ordering.
  · BlockingQueue: put() blocks when full (backpressure); take() blocks when empty.
  · Optimistic locking: version column; WHERE version=N; zero rows = conflict, retry.
  · Idempotency key: unique UUID per logical operation; server deduplicates on retry.

  RATE LIMITER ALGORITHMS (Day 65)
  ─────────────────────────────────────────
  · Fixed window: count per [0s–59s]; boundary burst = 2× rate
  · Sliding window log: exact; O(requests) space
  · Sliding window counter: approximation; O(1) — production default
  · Token bucket: refill at rate R; allows bursts up to capacity C; per-client state
  · Leaky bucket: constant outflow; no bursts; acts like a queue

  7 PROBLEM SHAPES (Month 3–4)
  ─────────────────────────────────────────
  Resource+claim · State machine · Scheduling · Money+ledger · Pipeline · Game loop · DS+complexity`} />
      </section>

      {/* ── Interview corner ── */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Capstone rapid-fire — 8 questions they ask in final rounds</h2>
        <p>Answer each in your head before revealing.</p>
        <Reveal summary='Q: "Name all 23 GoF patterns by category — you have 2 minutes."'>
          <p>
            <strong>Creational (5):</strong> Singleton, Factory Method, Abstract Factory, Builder, Prototype.
          </p>
          <p>
            <strong>Structural (7):</strong> Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy.
          </p>
          <p>
            <strong>Behavioral (11):</strong> Chain of Responsibility, Command, Interpreter, Iterator, Mediator,
            Memento, Observer, State, Strategy, Template Method, Visitor.
          </p>
          <p>
            Memory hook for Behavioral: <em>CoC-IMMOS-STV</em> (CoR, Command, Iterator, Mediator, Memento,
            Observer, State, Strategy, Template, Visitor — 10; Interpreter is the 11th).
          </p>
        </Reveal>
        <Reveal summary='Q: "What is the Dependency Inversion Principle, and how does it relate to Dependency Injection?"'>
          <p>
            <strong>DIP (the principle):</strong> high-level modules should depend on abstractions, not concretions.
            AND the abstraction should be owned by the high-level module, not the low-level one (the arrow inverts).
          </p>
          <p>
            <strong>DI (the technique):</strong> passing dependencies into a class rather than having it create them
            with <C>new</C>. DI is one way to satisfy DIP — but DIP is the goal, DI is a tool toward it.
          </p>
          <p>
            <strong>IoC (the ecosystem):</strong> Inversion of Control — a framework calls your code instead of
            your code calling the framework. Spring is IoC; it wires DI automatically. The three are related but
            distinct. Covered in Day 15.
          </p>
        </Reveal>
        <Reveal summary='Q: "Why is the Singleton pattern considered an anti-pattern by many?"'>
          <p>
            Four reasons: (1) <strong>Global state</strong> — anything can access and modify it, making behavior
            hard to reason about. (2) <strong>Tight coupling</strong> — callers depend on the concrete class, not
            an abstraction. (3) <strong>Untestable</strong> — you can't inject a fake singleton; tests share the
            same instance and bleed into each other. (4) <strong>Thread safety is complex</strong> — all six
            implementation variants have trade-offs. The fix: use DI + a scope annotation (e.g., Spring's
            @Singleton) — your class stays testable; the framework manages the lifecycle. Covered in Day 21.
          </p>
        </Reveal>
        <Reveal summary='Q: "Two elevator cars serve 30 floors. A request arrives on floor 15 going up. How do you dispatch?"'>
          <p>
            This is a Scheduling + Dispatch problem. The dispatcher scores each car and picks the winner:
          </p>
          <ul>
            <li>ETA to serve the request = current floor distance + direction penalty if going the wrong way.</li>
            <li>Car 1 on floor 12 going up: cost ≈ 3 floors (it will pass floor 15 naturally).</li>
            <li>Car 2 on floor 20 going down: cost ≈ 5 floors (wrong direction, must finish down sweep then come back).</li>
            <li>Assign to Car 1. Add the request to Car 1's sorted request queue (LOOK algorithm).</li>
          </ul>
          <p>
            Key seam: <C>SchedulingStrategy</C> is injected into the <C>Dispatcher</C>. The dispatcher calls
            <C>strategy.score(car, request)</C> for each car and takes the minimum. Covered in Days 46–47.
          </p>
        </Reveal>
        <Reveal summary='Q: "Explain the half-open interval convention for date ranges and why it matters for Hotel Booking."'>
          <p>
            A stay check-in=June 10, check-out=June 12 represents nights 10 and 11 (not 12). The half-open
            interval [check-in, check-out) is natural for date math: duration = check-out - check-in = 2 nights.
          </p>
          <p>
            <strong>Overlap check</strong> (two bookings overlap if and only if): <C>A.checkIn &lt; B.checkOut &amp;&amp; B.checkIn &lt; A.checkOut</C>.
            This works correctly for all edge cases including adjacent stays. Using closed intervals [a,b] requires
            careful +1/-1 adjustments that are error-prone. The convention is used in Java's <C>LocalDate</C> API and
            SQL date arithmetic. Covered in Day 71.
          </p>
        </Reveal>
        <Reveal summary='Q: "What is the Expression Problem? How does Visitor solve it?"'>
          <p>
            The Expression Problem: you have a type hierarchy (Node, AddNode, MulNode) and a set of operations
            (eval, print, typeCheck). Adding a new type is easy (add a class) but adding a new operation requires
            touching all existing classes. Adding a new operation is easy (add a method) but adding a new type
            requires touching all operations. You cannot make BOTH dimensions open/closed simultaneously in standard
            OOP.
          </p>
          <p>
            <strong>Visitor solution:</strong> separate operations from types. Each new operation is a new Visitor
            class. Types only need to implement <C>accept(v) {'{'} v.visit(this); {'}'}</C> once. Adding a new operation =
            adding one Visitor file (open/closed for operations). Adding a new type still requires all visitors to
            add a method (the remaining axis stays open). Modern Java: sealed classes + pattern matching in switch
            partially solve the type-axis too. Covered in Day 40.
          </p>
        </Reveal>
        <Reveal summary='Q: "A rate limiter using a fixed window allows 100 req/min. What is the boundary burst attack?"'>
          <p>
            <strong>Attack:</strong> send 100 requests in the last second of minute 1 (window fills). Send 100 more
            in the first second of minute 2 (new window, counter resets). In a 2-second span, 200 requests pass
            through — 2× the stated rate.
          </p>
          <p>
            <strong>Fix:</strong> sliding window. Two variants: (1) <em>log</em> — store the timestamp of every
            request; count those in the past 60 seconds on each arrival. O(requests) space, exact. (2) <em>counter</em>
            — keep the current-window count and previous-window count; interpolate based on elapsed position in
            current window. O(1) space, approximate (±error up to 1/window). Production uses the counter
            approximation. Covered in Day 65.
          </p>
        </Reveal>
        <Reveal summary={`Q: "What makes Composite's List<Component> field the key to the pattern?"`}>
          <p>
            The field type is <C>List&lt;Component&gt;</C> — the same interface as the container itself.
            This makes the structure recursive: a folder can contain other folders because a folder IS a Component,
            and folders hold <C>List&lt;Component&gt;</C>. A leaf also IS a Component but has no children field.
          </p>
          <p>
            Without this, you would need <C>List&lt;FileOrFolder&gt;</C> — a mixed type that requires instanceof
            checks everywhere. The shared Component interface is what makes client code work uniformly on both
            leaves and containers without knowing which it has. Covered in Day 28.
          </p>
        </Reveal>
      </section>

      {/* ── Quiz ── */}
      <section id="s13">
        <div className="sec-label">Section 13 · Test yourself</div>
        <h2>Capstone quiz — 10 integrative questions</h2>
        <p>
          These questions cross months. Each tests a concept where candidates lose points in final rounds.
          Read every explanation, even when correct — the nuance in the explanation is often more valuable
          than the answer itself.
        </p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 78 complete?</strong> Homework: open a blank document. Write — from memory, no notes —
        the 7 problem shapes with one example each, all 5 SOLID principles with one counter-example each,
        and the concurrency cure hierarchy in order. This is not copy-paste work: the act of recall from
        memory is what converts reading into lasting knowledge. Cross-check against this page when done.
        <br /><br />
        Next: <strong>Day 79 — The Interview Day</strong>: everything you need in the 24 hours before
        your LLD interview — the final pre-interview checklist, the first-2-minutes script, what to do
        when you are stuck, how to handle follow-ups, and the post-interview debrief loop.
      </div>
    </div>
  )
}
