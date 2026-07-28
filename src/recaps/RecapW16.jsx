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
  {
    q: 'What are the two resource models in Digital Library?',
    o: [
      'State machine (physical copies) + counter (digital licenses)',
      'Singleton (one library) + Observer (member notifications)',
      'Queue (waiting list) + Cache (popular books)',
    ],
    a: 0,
    why: 'Physical copies have individual status (AVAILABLE/CHECKED_OUT/DAMAGED) — a state machine per Copy. Digital licenses are a shared counter: currentLoans < maxConcurrent. These two models coexist in the same system and must not be confused.',
  },
  {
    q: 'What is the first thing to draw in an LLD interview?',
    o: [
      'A sequence diagram showing the request flow',
      'The entity model — 4–6 class boxes with fields and cardinalities',
      'The state machine for the primary entity',
    ],
    a: 1,
    why: 'The entity model is the shared vocabulary. Without it, every method you write is unanchored — the interviewer has no context. Draw entities first; everything else derives from them.',
  },
  {
    q: 'Name the 7 LLD problem shapes from Month 3–4.',
    o: [
      'CRUD, search, auth, notification, payment, reporting, admin',
      'Resource+claim, State machine, Scheduling, Money+ledger, Pipeline, Game loop, DS-for-complexity',
      'Singleton, Factory, Observer, Strategy, Command, State, Composite',
    ],
    a: 1,
    why: 'The 7 shapes are the meta-patterns of LLD: Resource+claim (Parking, BookMyShow), State machine (Vending, ATM), Scheduling (Elevator), Money+ledger (Splitwise, Wallet), Pipeline (Logging, Notifications), Game loop (Chess, Snake), DS-for-complexity (LRU, Rate Limiter). Every new problem slots into one.',
  },
  {
    q: 'What does "commit offset after processing" mean in a pub-sub system?',
    o: [
      'Store the message ID before reading the message — prevents duplicate reads',
      'Process the message first, then commit the offset — crash before commit = re-read (at-least-once), not skip',
      'Commit the offset at the same time as processing — exactly-once delivery',
    ],
    a: 1,
    why: 'At-least-once: process first, commit second. If the consumer crashes between processing and committing, it re-reads the same message on restart — possible duplicate, never a skip. Commit-before-process would be at-most-once (could skip). Simultaneous is not achievable without distributed transactions.',
  },
  {
    q: 'What do you say when stuck on which entities to start with?',
    o: [
      '"I need a moment" — then stay silent for 90 seconds',
      '"Let me think out loud" + noun scan of the problem statement for entities, then start drawing boxes',
      'Ask the interviewer "Can you give me a hint about the main classes?"',
    ],
    a: 1,
    why: 'The noun-scan recovery always works. Every problem statement contains its entities as nouns. Read it aloud, underline every noun, and those are your starting classes. "Let me think out loud" keeps the channel open while you buy yourself 30 seconds. Silence reads as panic.',
  },
  {
    q: 'What is a fine in Digital Library calculated from?',
    o: [
      'daysOverdue × ratePerDay, computed at RETURN time, using BigDecimal',
      'Hours overdue × hourlyRate, computed at checkout, using double',
      'Fixed fee regardless of how late — stored at checkout time',
    ],
    a: 0,
    why: 'The fine is computed at RETURN time: daysLate = returnDate.toEpochDay() - dueDate.toEpochDay(). Fine = daysLate × ratePerDay using BigDecimal with HALF_UP. Computed at checkout would be wrong — you cannot know the late date in advance. Double would accumulate rounding errors over many days.',
  },
  {
    q: 'How do you prevent two members borrowing the last physical copy simultaneously?',
    o: [
      'Check copy.status == AVAILABLE before lending — if two threads check at the same time, both will pass',
      'synchronized block covering findAvailableCopy() + copy.setStatus(CHECKED_OUT) atomically — one thread waits while the other completes',
      'Use a volatile flag on the Copy object to signal availability',
    ],
    a: 1,
    why: 'The check-then-act race: two threads both read AVAILABLE, both pass, both lend. The fix is a synchronized block that covers BOTH the availability check AND the status update — collapsing two steps into one atomic operation. volatile only fixes visibility, not atomicity.',
  },
  {
    q: 'What are the 5 sentences that signal senior engineer in an interview?',
    o: [
      '"I will use Kafka, Redis, and a CDN for this problem."',
      'Clarify first · entity model first · name the race · name the pattern · mention one scale concern',
      'Name all 23 GoF patterns in the first 5 minutes',
    ],
    a: 1,
    why: 'The 5 signals: (1) "Before I start, let me ask a few questions." (2) "I will draw the entity model first." (3) "There is a check-then-act race here — I need to make this atomic." (4) "I am using [Pattern] because [one reason]." (5) "At scale, [X] would be the bottleneck." These show process, habit, concurrency awareness, vocabulary, and systems thinking.',
  },
]

const QUESTIONS = [
  {
    q: 'A member checks out the last physical copy. A second member simultaneously calls checkout() and sees status == AVAILABLE. What prevents the double-loan?',
    o: [
      'An AtomicBoolean on the Copy object swapped with CAS.',
      'A synchronized block that covers both findAvailableCopy() and copy.setStatus(CHECKED_OUT) — the two steps are atomic.',
      'The second thread will throw ConcurrentModificationException.',
      'The Copy.status field is declared volatile — visibility ensures only one thread sees AVAILABLE.',
    ],
    a: 1,
    e: 'The gap between reading status (AVAILABLE) and writing status (CHECKED_OUT) is the check-then-act race. volatile fixes visibility but not atomicity — both threads can still see AVAILABLE and both proceed. synchronized covers both steps as one atomic unit.',
    w: { 0: 'AtomicBoolean CAS works but requires careful rollback if findAvailableCopy() is a separate step outside the CAS. synchronized is simpler here.', 2: 'ConcurrentModificationException is for structural modification of collections during iteration — not for field updates.', 3: 'volatile makes the latest write visible, but both threads can still read AVAILABLE before either writes CHECKED_OUT. Visibility is not atomicity.' },
    r: { id: 's2', label: 'Section 2 — Digital Library' },
  },
  {
    q: 'In the Online Exam System, when does autoGrade() run?',
    o: [
      'At exam creation — answers are pre-scored.',
      'When the teacher manually triggers grading.',
      'After each answer is saved — so the student gets instant feedback per question.',
      'Once, when the Attempt transitions to SUBMITTED or EXPIRED.',
    ],
    a: 3,
    e: 'Auto-grading on every answer save leaks whether each choice is right or wrong — a student can probe correct answers one by one before submitting. Grading runs once, when the attempt is complete. This is both a correctness and a security requirement.',
    w: { 0: 'Pre-scoring is impossible without the student answers.', 1: 'MCQ auto-grading requires no human involvement — waiting for the teacher is wasteful and creates delay.', 2: 'Per-save grading is an information leak — the student can probe all correct answers before submitting.' },
    r: { id: 's2', label: 'Section 2 — Online Exam System' },
  },
  {
    q: 'A pub-sub consumer processes a message and then crashes before committing the offset. What happens when it restarts?',
    o: [
      'An exception is thrown — the broker detects the crash and removes the message.',
      'The consumer starts from the beginning of the topic.',
      'The message is re-delivered — the uncommitted offset causes the broker to re-send from the last committed position.',
      'The message is skipped — the broker assumes it was processed.',
    ],
    a: 2,
    e: 'Commit-after-process is at-least-once delivery. If the consumer crashes before committing, the broker does not know the message was processed. On restart, it re-delivers from the last committed offset — causing a potential duplicate, but never a skip. Consumers must be idempotent.',
    w: { 0: 'Brokers do not detect consumer crashes at the message level — they rely on offset commits to know progress.', 1: 'Restart from the beginning would happen only if no committed offset exists at all (new consumer group). Existing committed offsets are preserved across restarts.', 3: 'The broker has no way to know the consumer processed it — it only knows about committed offsets.' },
    r: { id: 's2', label: 'Section 2 — Day 69' },
  },
  {
    q: 'A candidate draws 11 classes in the entity model by minute 15 of a 45-minute interview. What is the likely outcome?',
    o: [
      'They will run out of time for implementation — 11 classes in 10 minutes means 55 seconds per class with no fields, types, or cardinalities.',
      'They should add more classes to cover every edge case.',
      'Positive signal — more classes shows more thorough thinking.',
      'Neutral — interviewers do not count classes.',
    ],
    a: 0,
    e: '4–7 classes is the target for 45 minutes. At 11 classes in 10 minutes, each class got under a minute — no field list, no cardinality, no reasoning. And now 35 minutes remain for implementation of 11 classes. The session cannot recover from this. Over-modelling is as harmful as under-modelling.',
    w: { 1: 'Adding more to an already over-large model makes the implementation even harder to complete.', 2: 'More classes signals over-engineering or poor grouping — not thoroughness. An interviewer who sees 11 classes will ask "do you really need all of these?" and expect a good answer for each.', 3: 'Interviewers absolutely note whether the entity count is reasonable for the time allotted.' },
    r: { id: 's3', label: 'Section 3 — Week in table' },
  },
  {
    q: 'Which Month 1 principle says "a class should have only one reason to change"?',
    o: [
      'Single Responsibility Principle',
      'Open/Closed Principle',
      'Liskov Substitution Principle',
      'Law of Demeter',
    ],
    a: 0,
    e: 'SRP (Day 11): one reason to change = one actor. A class that handles tax calculation, printing, and database storage has three actors (tax authority, UI team, DBA) — three reasons to change. Split it. The other options: OCP = open for extension, closed for modification; LSP = subclasses must be substitutable; LoD = do not reach through chains.',
    w: { 1: 'OCP (Day 12) says new variants should not require changing existing code — different from single responsibility.', 2: 'LSP (Day 13) says subclasses must be usable wherever the parent is used. A violation means the subclass breaks the parent\'s contract.', 3: 'Law of Demeter (Day 18) says only talk to your direct collaborators — do not chain method calls through foreign objects.' },
    r: { id: 's2', label: 'Section 2 — Day 76 context' },
  },
  {
    q: 'In a Rate Limiter, why must the refill and take operations be atomic?',
    o: [
      'Because the Rate Limiter uses a timer that fires asynchronously.',
      'Because the token count is stored as a double and needs rounding.',
      'Because two threads could both read "tokens = 1", both decide to allow a request, both decrement — leaving tokens at -1. The counter must be modified atomically.',
      'Because Java does not support concurrent HashMap operations.',
    ],
    a: 2,
    e: 'The same check-then-act race from Month 3 appears in the Rate Limiter: two threads both see tokens > 0, both decide to allow, both take — tokens go negative. Fix: synchronized block covering read-decide-decrement, or AtomicLong CAS loop. This is the Week 13 payoff: you recognise the same race in a new costume.',
    w: { 0: 'The timer is for refilling — a separate concern. The atomicity issue is on the take (decrement) path.', 1: 'Token counts are integers, not doubles. Rounding is not the issue.', 3: 'ConcurrentHashMap makes individual map operations atomic — but here the issue is a compound read-modify-write on the counter itself.' },
    r: { id: 's2', label: 'Section 2 — Day 65' },
  },
  {
    q: 'A candidate is at minute 28 and discovers their park() method returns void instead of Ticket. What is the best move?',
    o: [
      'Stop the interview and ask for extra time.',
      'Ignore it and hope the interviewer does not notice.',
      'Erase the method and rewrite it from scratch.',
      'Circle the method, say "I see a return type issue — should be Ticket, not void — I will fix this at minute 38", and keep coding the next method.',
    ],
    a: 3,
    e: 'Circle-and-narrate is the professional recovery. It shows you caught your own bug (positive signal), you prioritise coverage over perfection, and you keep the interview moving. Erasing at minute 28 costs 5 minutes and risks panic. Ignoring it signals carelessness. Coming back at minute 38 to fix it is valid and expected.',
    w: { 0: 'Stopping to ask for time is not an option in a real interview. Work within the constraint.', 1: 'Interviewers notice every signature mismatch. Not addressing it signals you missed it — worse than flagging it.', 2: 'Erasing and rewriting at minute 28 loses 5 minutes and breaks flow. The session may not recover.' },
    r: { id: 's5', label: 'Section 5 — interview traps' },
  },
  {
    q: 'The Visitor pattern solves which problem that none of the other 22 GoF patterns address directly?',
    o: [
      'Notifying multiple objects when one object changes state.',
      'Adding operations to a class hierarchy without modifying the classes — solving the Expression Problem for the "add operation" axis.',
      'Providing a simplified interface to a complex subsystem.',
      'Creating families of related objects without specifying their concrete classes.',
    ],
    a: 1,
    e: 'The Expression Problem has two axes: add a new type (easy with subclasses) or add a new operation (requires modifying every existing class). Visitor solves the second axis: each new operation is a new Visitor class with one visit() per existing type. No existing class is touched. The double-dispatch trick (accept() calling visitor.visit(this)) makes the right visit() overload run at runtime.',
    w: { 0: 'Notifying multiple objects on state change describes Observer (Day 32) — not Visitor.', 2: 'Providing a simplified interface describes Facade (Day 29) — not Visitor.', 3: 'Creating families of related objects describes Abstract Factory (Day 23) — not Visitor.' },
    r: { id: 's2', label: 'Section 2 — Day 40 (Visitor)' },
  },
]

export default function RecapW16() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 4 · Week 16 · Final Week</div>
        <h1>Week 16 Recap:<br />Mocks, Mastery &amp; Graduation</h1>
        <p>Days 76–80 in one place: Online Exam System, Digital Library, the 7 problem shapes,
          interview protocol, and the skills you carry out of 80 days. Cheat-sheet, rapid review,
          final integrative quiz.</p>
        <div className="chips">
          {['state machine flags', 'physical vs digital', '7 problem shapes', '45-min protocol', 'entity-first', 'recovery scripts', 'graduation'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  WEEK 16 — prove it, see it, own it

  Day 76  ONLINE EXAM    AttemptStatus state machine (IN_PROGRESS → SUBMITTED/EXPIRED
  SYSTEM                 → PENDING_MANUAL → FULLY_GRADED)
                         Server-side expiry on every submitAnswer() call
                         autoGrade() runs once on SUBMIT/EXPIRE — never per-save
                         correctOption NOT in exam-fetch API response
                         Two guards: hasActiveAttempt() + canRetake()
                         Exam LOCKED on first attempt start (teacher cannot edit)

  Day 77  DIGITAL        Two resource models coexist:
  LIBRARY                · Physical Copy: per-copy state machine (AVAILABLE/CHECKED_OUT/DAMAGED)
                         · Digital license: shared counter (currentLoans < maxConcurrent)
                         Fine = daysLate × ratePerDay computed at RETURN time (BigDecimal)
                         Reservation queue: first in line gets next available copy
                         Atomic claim: synchronized { findAvailableCopy + setStatus }
                         Renewal guard: no overdue fines outstanding + no one in queue

  Day 78  FULL-COURSE    7 problem shapes + 23 GoF pattern inventory + interview drill
  RECAP                  10 flashcards for rapid revision · pattern frequency table
                         (if Day 78 covered a different topic, adapt as needed)

  Day 79  THE INTERVIEW  45-minute phase breakdown (clarify/entity/core/edge/wrap-up)
  DAY                    Entity-first rule — always before first line of code
                         5 narration types + 5 hire-signal sentences
                         3 recovery scripts (stuck-on-entities / stuck-on-pattern / bug-in-code)
                         Interviewer rubric: concurrency + entity-first = HIGH weight
                         8 failure modes to avoid

  Day 80  GRADUATION     80-day skill inventory · course map · portfolio projects
                         4-week post-course interview plan · resources for what comes next

  WEEK THEME: The final week is not about new content — it is about proving you can
  perform what you already know. The mock interview days test the WHOLE course under
  pressure. The graduation day is the receipt.`} />
        <Note><strong>The defining lesson of Week 16:</strong> Interview performance is a separate skill from
          design knowledge. You can know every pattern and still fail if you go silent, code before the entity
          model, or never name a race condition. Week 16 is where the knowledge becomes performance.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 76 · Online Exam System</h3>
        <ul>
          <li><strong>Entities:</strong> <C>Exam</C> (status, timeLimit, maxAttempts), <C>Question</C> (type: MCQ|ESSAY, points, correctOption?), <C>Attempt</C> (startedAt, status, answers), <C>Answer</C> (questionId, selectedOption?, essayText?).</li>
          <li><strong>Exam state machine:</strong> DRAFT → PUBLISHED → LOCKED → ARCHIVED. Exam locks on first Attempt start — teacher cannot edit questions after this.</li>
          <li><strong>Attempt state machine:</strong> IN_PROGRESS → SUBMITTED/EXPIRED → PENDING_MANUAL/FULLY_GRADED.</li>
          <li><strong>Server-side expiry:</strong> <C>startedAt.plus(timeLimit).isBefore(Instant.now())</C> — checked on every <C>submitAnswer()</C> call, not just in a scheduled sweeper.</li>
          <li><strong>Auto-grading:</strong> runs once on SUBMIT or EXPIRE. Never on per-save. MCQ: automatic; essay: flagged for manual. <C>correctOption</C> must NOT appear in the exam-fetch API response.</li>
          <li><strong>Two guards:</strong> <C>hasActiveAttempt()</C> prevents concurrent attempts; <C>canRetake()</C> counts completed (not IN_PROGRESS) attempts against <C>maxAttempts</C>.</li>
          <li><strong>Answer updates:</strong> changing an MCQ answer = update <C>selectedOption</C> in place. Never delete the Answer record.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 77 · Digital Library</h3>
        <ul>
          <li><strong>Entities:</strong> <C>Book</C> (isbn, title), <C>Copy</C> (copyId, bookId, status), <C>DigitalLicense</C> (bookId, maxConcurrent, currentLoans), <C>Loan</C> (copyId|licenseId, memberId, dueDate), <C>Reservation</C> (bookId, memberId, requestedAt, status).</li>
          <li><strong>Two resource models:</strong> physical copies = state machine per <C>Copy</C> (AVAILABLE/CHECKED_OUT/RESERVED/DAMAGED). Digital = shared counter (<C>currentLoans &lt; maxConcurrent</C>).</li>
          <li><strong>Atomic physical checkout:</strong> <C>synchronized {'{'} findAvailableCopy() + copy.setStatus(CHECKED_OUT) {'}'}</C> — covers the check-then-act race for last copy.</li>
          <li><strong>Fine calculation:</strong> at RETURN time. <C>daysLate = returnDate.toEpochDay() - dueDate.toEpochDay()</C>. Fine = <C>daysLate × ratePerDay</C> in <C>BigDecimal</C>. Pay-at-return, not pay-at-checkout.</li>
          <li><strong>Reservation queue:</strong> FIFO. When a copy is returned, the first PENDING reservation is promoted — copy goes RESERVED for that member. They get N days to pick it up.</li>
          <li><strong>Renewal guard:</strong> two conditions must pass: (1) no outstanding overdue fine, (2) no one ahead in the reservation queue for this book.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 78 · Full-Course Recap and Flashcards</h3>
        <ul>
          <li><strong>7 problem shapes:</strong> Resource+claim · State machine · Scheduling/dispatch · Money+ledger · Pipeline/framework · Game loop · DS-for-complexity.</li>
          <li><strong>Pattern frequency by shape:</strong> Resource+claim = State+CAS. Scheduling = Strategy. Money = Value Object+BigDecimal. Pipeline = CoR+Strategy. Game = Command+Composite. DS = depends on complexity target.</li>
          <li><strong>23 GoF patterns completed:</strong> 5 Creational (W5) + 7 Structural (W6) + 11 Behavioral (W7–W8).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 79 · The Interview Day</h3>
        <ul>
          <li><strong>5 phases:</strong> Clarify (0–5) → Entity model (5–15) → Core flow (15–30) → Edge cases (30–38) → Wrap-up (38–45).</li>
          <li><strong>Entity-first rule:</strong> always draw 4–6 class boxes before the first line of code. No exceptions.</li>
          <li><strong>5 narration types:</strong> Decision · Trade-off · Pattern · Concurrency · Simplification.</li>
          <li><strong>5 hire-signal sentences:</strong> clarify first · entity model first · name the race · name the pattern · mention scale concern.</li>
          <li><strong>3 recovery scripts:</strong> stuck on entities → noun scan; stuck on pattern → name the trade-off space; bug in code → circle and keep moving.</li>
          <li><strong>High-weight signals:</strong> naming the defining problem at minute 1 · entity-first · talking through trade-offs · naming the concurrency race.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 80 · Graduation</h3>
        <ul>
          <li>Skill inventory across all 4 months: OOP, 23 patterns, 14 systems, concurrency, interview skills.</li>
          <li>6 portfolio project ideas that demonstrate the full course in code.</li>
          <li>4-week post-course interview preparation plan.</li>
          <li>Reading list: Kleppmann, Clean Code, APOSD, Head First, open-source Java.</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The week in one table</h2>
        <table className="matrix">
          <thead>
            <tr><th>Day · Domain</th><th>Key insight</th><th>Interview signal</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>76 · Online Exam</td>
              <td>Two state machines (Exam + Attempt); server-side expiry on every answer call; autoGrade runs once on SUBMIT not per-save</td>
              <td>correctOption NOT in exam-fetch response; hasActiveAttempt() as separate guard from canRetake()</td>
            </tr>
            <tr>
              <td>77 · Digital Library</td>
              <td>Physical copies = state machine per copy; digital = shared counter; fine computed at return time with BigDecimal</td>
              <td>synchronized on findAvailableCopy+setStatus; reservation queue promotes on return</td>
            </tr>
            <tr>
              <td>78 · Full-Course Recap</td>
              <td>7 problem shapes slot every LLD problem; 23 patterns categorised by use</td>
              <td>Naming the shape in minute 1 is the highest interview signal</td>
            </tr>
            <tr>
              <td>79 · Interview Day</td>
              <td>Entity-first always; 5 phases; talk every decision; never go silent &gt;2 min</td>
              <td>Name the race condition; circle bugs and keep moving; invite questions at the end</td>
            </tr>
            <tr>
              <td>80 · Graduation</td>
              <td>80 days = 23 patterns + 14 systems + concurrency + interview performance</td>
              <td>Build one portfolio project to completion; keep naming patterns in daily code review</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Memory hooks — for the interview room</h2>
        <ul>
          <li><strong>Server-side expiry = check on every call.</strong> The sweeper is cleanup. The per-call guard is enforcement. You need both, but the per-call guard is the one that blocks cheating.</li>
          <li><strong>Two guards, not one.</strong> hasActiveAttempt() asks "are you mid-attempt right now?". canRetake() asks "do you have attempts left?" Different questions. Both must pass.</li>
          <li><strong>Physical = state machine. Digital = counter.</strong> Copying the physical state machine for digital resources is the most common mistake in Library design. They are different models for a reason.</li>
          <li><strong>Fine at return, not at checkout.</strong> You cannot know how late someone will be when they check out. Fine = daysLate × rate, computed when the copy comes back.</li>
          <li><strong>Entity model before first line of code.</strong> This rule has no exceptions. In 45 minutes there is no faster way to lose the interview than to start coding without context.</li>
          <li><strong>"Let me think out loud" is always the right first word when stuck.</strong> It keeps the channel open. Silence reads as giving up.</li>
          <li><strong>Concurrency = HIGH weight.</strong> Naming a check-then-act race and its fix takes 10 seconds. It is the single highest-signal move in the interview.</li>
          <li><strong>The 7 shapes are the meta-patterns.</strong> Parking Lot = resource+claim. ATM = state machine. Elevator = scheduling. Splitwise = money+ledger. Logging = pipeline. Chess = game loop. LRU = DS-for-complexity.</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Traps that end good candidacies</h2>
        <Warn><strong>Silence for more than 2 minutes.</strong> The interview does not have to end when you are stuck — it ends when you go silent. "I am thinking through the state machine" is not silence. Say what you are doing. Always.</Warn>
        <Warn><strong>Code before the entity model.</strong> Even if you know the solution, the interviewer does not have context yet. A park() method with no entity model around it is unreadable. Entity model first, always.</Warn>
        <Warn><strong>Trusting the client-side timer for the Online Exam.</strong> A student can pause JavaScript or change their system clock. The server must check startedAt + timeLimit on every submitAnswer() call. The scheduled sweeper is not a substitute.</Warn>
        <Warn><strong>Using double for money.</strong> daysLate × ratePerDay in double accumulates rounding errors. Fine = BigDecimal(daysLate).multiply(ratePerDay).setScale(2, HALF_UP). Every money computation in the course uses BigDecimal. This rule does not have exceptions.</Warn>
        <Warn><strong>Deleting answer records.</strong> Changing an MCQ answer = update selectedOption in place. Deleting the old record loses audit history. Creating a second Answer record for the same question causes grading ambiguity. Update, never delete.</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>Rapid review — 8 cards across the whole course</h2>
        <p>These cards span all four months. If you hesitate on any card, that is the day to revisit before the interview:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>Final quiz — 8 integrative questions spanning all 4 months</h2>
        <p>These questions are not specific to Week 16 — they span the full 80-day course. If you can answer
          them all from memory, you are ready for the interview.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 16 revised?</strong> You can now name the defining problem of Online Exam System
        (server-side expiry + two separate retake guards), Digital Library (physical state machine vs digital
        counter), and every one of the 7 LLD problem shapes. You know the 45-minute interview protocol,
        the 5 hire-signal sentences, and the recovery script for every stuck moment.
        <br /><br />
        That is 80 days of design — complete.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        You have reached the end of the course. Go build something great.
      </div>
    </div>
  )
}
