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
  { q: 'Why is count++ not thread-safe?', o: ['It is', 'It is read-modify-write (3 steps); threads interleave → lost update', 'Only doubles race'], a: 1,
    why: 'count++ = read, add, write. Two threads can both read the same value before either writes, so one increment is lost. Fix: AtomicInteger (CAS) or a lock.' },
  { q: 'A worker loops while(!stop); main sets stop=true but it never exits. The hazard + fix?', o: ['Atomicity; synchronized', 'Visibility; make stop volatile (or synchronize)', 'Deadlock; tryLock'], a: 1,
    why: 'Visibility: without volatile, the worker may read a cached stop=false forever (CPU caches / JIT). volatile forces reads/writes to main memory → the worker sees the update. Not an atomicity problem (a single bool write).' },
  { q: 'Is volatile count++ thread-safe?', o: ['Yes', 'No — volatile gives visibility, not atomicity; ++ is still read-modify-write', 'Yes on 64-bit'], a: 1,
    why: 'The classic trap. volatile makes each read/write visible but does NOT make the 3-step ++ atomic. Use AtomicInteger or a lock for compound operations.' },
  { q: 'Producer–consumer: why must the buffer be BOUNDED?', o: ['Speed', 'Backpressure — a bound makes a fast producer block; unbounded grows until OOM', 'It is not'], a: 1,
    why: 'A bounded BlockingQueue forces a fast producer to wait when consumers fall behind. Unbounded hides the imbalance until memory runs out. Bound the queue (and thread-pool queues).' },
  { q: 'Low vs high contention — optimistic or pessimistic?', o: ['Always pessimistic', 'Low → optimistic (no lock overhead); High → pessimistic (optimistic retries thrash)', 'Always optimistic'], a: 1,
    why: 'Optimistic (version/CAS) skips locking and retries on the rare conflict — great when conflicts are rare. Under heavy contention retries pile up (near-livelock); a lock serializing once is cheaper.' },
  { q: 'The atomic claim (book a seat) is built with…', o: ['if(available) book()', 'compareAndSet(AVAILABLE, BOOKED) / a lock around check+act / conditional UPDATE WHERE', 'volatile'], a: 1,
    why: 'Collapse check-then-act into ONE indivisible step: CAS in memory, a lock around both, or UPDATE ... WHERE status=AVAILABLE in the DB. Exactly one racer wins; the loser is rejected/retries.' },
  { q: 'A rate limiter that lets short bursts but caps the average rate?', o: ['Fixed window', 'Token bucket', 'Leaky bucket'], a: 1,
    why: 'Token bucket: tokens refill to a capacity; each request takes one. Allows bursts up to capacity, long-run rate = refill rate. (Leaky bucket = constant outflow, no bursts; fixed window = boundary burst.)' },
]

const QUESTIONS = [
  { q: 'The arc of Week 13?',
    o: ['Random concurrency facts', 'DIAGNOSE the disease (races: atomicity/visibility/ordering) → CURE it (immutable/atomics/locks/volatile) → COORDINATE (producer-consumer) → CHOOSE a locking strategy → APPLY it all (rate limiter)', 'Only locks', 'Only the JMM'], a: 1,
    e: 'Week 13 builds: Day 61 names the hazards, Day 62 the fixes, Day 63 the producer-consumer pattern, Day 64 optimistic-vs-pessimistic, Day 65 the rate limiter that uses everything.',
    w: { 0: 'It\'s a deliberate build.', 2: 'Locks are one of several tools.', 3: 'The JMM is the foundation, not the whole.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'The three concurrency hazards (the Java Memory Model)?',
    o: ['Speed, memory, disk', 'ATOMICITY (a compound op interrupted), VISIBILITY (a write not seen by other threads), ORDERING (instructions reordered) — synchronization establishes happens-before to address them', 'Only races', 'Only deadlock'], a: 1,
    e: 'Threads break three ways. synchronized/locks give atomicity + visibility + ordering; volatile gives visibility + ordering (not atomicity); atomics give atomic single-variable ops.',
    w: { 0: 'Those are performance, not correctness.', 2: 'Races are a symptom of the three.', 3: 'Deadlock is a liveness failure, separate.' },
    r: { id: 's2', label: 'Section 2 — Day 61' } },
  { q: 'The cure hierarchy (cheapest correct tool first)?',
    o: ['Always synchronized', 'immutable > confined > atomic (one var) > volatile (visibility-only flag) > synchronized/Lock (compound) > concurrent collection', 'Always a lock', 'volatile everywhere'], a: 1,
    e: 'No shared mutable state = no bug, so immutability/confinement win first. Atomics handle a single variable lock-free; locks are for compound critical sections; concurrent collections for shared maps/queues.',
    w: { 0: 'Over-locking is slow and deadlock-prone.', 2: 'Locks are a last resort, not first.', 3: 'volatile isn\'t atomic.' },
    r: { id: 's2', label: 'Section 2 — Day 62' } },
  { q: 'synchronized vs volatile vs AtomicInteger — pick correctly:',
    o: ['They are interchangeable', 'synchronized = atomicity + visibility for a COMPOUND section; volatile = visibility for a single FLAG (not atomic); AtomicInteger = lock-free atomic for a single VARIABLE (CAS)', 'volatile is for counters', 'AtomicInteger needs a lock'], a: 1,
    e: 'Flag needing visibility → volatile. Single counter → AtomicInteger (CAS). A multi-step critical section (check-then-act) → synchronized/Lock. Matching the tool to the shape is the skill.',
    w: { 0: 'They solve different problems.', 2: 'volatile count++ races.', 3: 'Atomics are lock-free.' },
    r: { id: 's2', label: 'Section 2 — Day 62' } },
  { q: 'Producer–consumer the RIGHT way?',
    o: ['Hand-rolled wait/notify', 'A bounded BlockingQueue (put blocks when full, take blocks when empty) — and a thread pool IS this pattern (submit = produce, workers = consume)', 'A plain list', 'volatile array'], a: 1,
    e: 'BlockingQueue encapsulates the bounded buffer + locking + signaling. Hand-rolled wait/notify is error-prone (while-loops, notifyAll, lost wakeups). ExecutorService is producer-consumer packaged — bound its queue.',
    w: { 0: 'Use the library unless you must hand-roll.', 2: 'Not thread-safe/blocking.', 3: 'Doesn\'t coordinate put/take.' },
    r: { id: 's2', label: 'Section 2 — Day 63' } },
  { q: 'wait() must be called inside a WHILE loop because…',
    o: ['Style', 'To RE-CHECK the condition on wake — spurious wakeups happen, and another thread may have taken the item; an if would proceed on a false condition', 'while is faster', 'if won\'t compile'], a: 1,
    e: 'The guarded-wait idiom: while(!condition) wait(). On waking, re-acquire the lock and re-test. Prefer notifyAll() over notify() when waiters wait on different conditions (lost-wakeup risk).',
    w: { 0: 'A correctness rule.', 2: 'Speed is irrelevant.', 3: 'Both compile; if is wrong.' },
    r: { id: 's2', label: 'Section 2 — Day 63' } },
  { q: 'Optimistic vs pessimistic locking — the deciding axis (and the third option)?',
    o: ['Pessimistic is always safer', 'CONTENTION decides: low → optimistic (version/CAS, no lock, retry); high → pessimistic (lock & serialize). For operations spanning user think-time, use a LEASE (atomic claim + TTL)', 'Optimistic is always faster', 'They are the same'], a: 1,
    e: 'Optimistic assumes rare conflicts (check-on-commit, retry); pessimistic assumes likely (lock-and-hold). A lease (the seat hold: atomic claim + expiry) reserves across think-time without a held lock.',
    w: { 0: 'Pessimistic over-serializes when conflicts are rare.', 2: 'Optimistic thrashes under contention.', 3: 'Opposite bets.' },
    r: { id: 's2', label: 'Section 2 — Day 64' } },
  { q: 'A rate limiter\'s single hardest requirement?',
    o: ['Choosing the algorithm', 'THREAD-SAFETY: it is shared mutable state hit by every request; refill+take is check-then-act and must be atomic (per-client lock or CAS) — pick the algorithm (token bucket/sliding window), but the concurrency is the crux', 'Logging 429s', 'Caching'], a: 1,
    e: 'The algorithm (token bucket, sliding window) is the easy half; the limiter is hammered by every thread, so its check-then-act must be atomic per client (never one global lock). Distributed: centralize state in Redis.',
    w: { 0: 'Important, but the concurrency is harder.', 2: 'Observability, not the crux.', 3: 'Different concern.' },
    r: { id: 's2', label: 'Section 2 — Day 65' } },
]

export default function RecapW13() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 4 · Week 13 · Concurrency</div>
        <h1>Week 13 Recap:<br />Concurrency, End to End</h1>
        <p>Days 61–65 in one place: the hazards (atomicity, visibility, ordering), the cures (immutable, atomics,
           synchronized, volatile, locks), producer–consumer, optimistic vs pessimistic locking, and the rate
           limiter that uses it all. Cheat-sheet, rapid review, recap quiz.</p>
        <div className="chips">
          {['races & the JMM', 'synchronized/volatile/atomics/locks', 'producer-consumer', 'optimistic vs pessimistic', 'rate limiter'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  WEEK 13 — diagnose → cure → coordinate → choose → apply

  Day 61  DIAGNOSE   shared+mutable+multithreaded → races: atomicity,        (the disease)
                     visibility, ordering (the JMM); check-then-act = the Month-3 race
  Day 62  CURE       immutable > confined > atomic > volatile > synchronized  (the tools)
                     /Lock > concurrent collections; CAS = the atomic claim
  Day 63  COORDINATE producer–consumer: bounded BlockingQueue + backpressure; (the pattern)
                     wait/notify (while!); thread pools ARE producer-consumer
  Day 64  CHOOSE     optimistic (version/CAS, retry) vs pessimistic (lock);   (the strategy)
                     contention decides; LEASE = atomic claim + TTL (the seat hold)
  Day 65  APPLY      rate limiter: token bucket / sliding window, made        (the capstone)
                     THREAD-SAFE (atomic refill+take per client)`} />
        <Note><strong>The big idea:</strong> Month 3 kept flagging "atomic claim — Month 4". This week is the
          payoff — you can now diagnose any race, pick the lightest correct cure, coordinate threads with
          bounded queues, choose a locking strategy by contention, and build the canonical rate limiter.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 61 · Concurrency, Part 1 (the disease)</h3>
        <ul>
          <li><strong>Root cause:</strong> shared + mutable + multi-threaded (no coordination). Remove a leg (immutable/confined) or coordinate.</li>
          <li><strong>Lost update:</strong> <C>count++</C> is read-modify-write → interleave → updates vanish.</li>
          <li><strong>Check-then-act:</strong> the Month-3 atomic-claim race — the gap between CHECK and ACT.</li>
          <li><strong>Three hazards (JMM):</strong> atomicity, visibility (<C>while(!stop)</C> hangs), ordering. Bugs are non-deterministic Heisenbugs → DESIGN for safety. Run tasks via an <C>ExecutorService</C>.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 62 · Concurrency, Part 2 (the cures)</h3>
        <ul>
          <li><strong>Cure ladder:</strong> immutable &gt; confined &gt; atomic &gt; volatile &gt; synchronized/Lock &gt; concurrent collection. Lightest correct tool.</li>
          <li><strong>synchronized:</strong> atomicity + visibility; private lock; reentrant; smallest section.</li>
          <li><strong>volatile:</strong> visibility/ordering for ONE field (flags/publication) — NOT atomicity (<C>volatile ++</C> races).</li>
          <li><strong>Atomics/CAS:</strong> lock-free compare-and-set retry loop; <C>compareAndSet(expected, new)</C> = the real atomic claim. <strong>ReentrantLock:</strong> tryLock-timeout, conditions; unlock in finally. Thread-safe Singleton: holder/enum; DCL needs volatile.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 63 · Producer–Consumer</h3>
        <ul>
          <li><strong>Pattern:</strong> producers → bounded buffer → consumers; decouples speeds, gives BACKPRESSURE (full blocks producers, empty blocks consumers).</li>
          <li><strong>Bound the buffer</strong> — unbounded = OOM.</li>
          <li><strong>wait/notify (hard way):</strong> hold the monitor; <C>wait()</C> in a WHILE loop; prefer <C>notifyAll()</C>. <strong>Right way:</strong> a <C>BlockingQueue</C> (put/take).</li>
          <li><strong>Thread pools ARE producer-consumer:</strong> submit = produce, workers = consume; build a <C>ThreadPoolExecutor</C> with a BOUNDED queue + a rejection policy (order: core → queue → max → reject).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 64 · Optimistic vs Pessimistic Locking</h3>
        <ul>
          <li><strong>Pessimistic:</strong> assume conflict likely → lock &amp; hold (synchronized/Lock/SELECT FOR UPDATE). No retries; blocking + deadlock risk.</li>
          <li><strong>Optimistic:</strong> assume rare → read a version, work, commit ONLY IF unchanged, retry. CAS / DB version column / ETag — same idea, three layers.</li>
          <li><strong>Contention decides:</strong> low → optimistic; high → pessimistic. Optimistic can livelock; pessimistic can deadlock (consistent lock order).</li>
          <li><strong>Lease:</strong> atomic claim + TTL — the seat hold; reserve across think-time without a held lock (Redis <C>SET NX EX</C>).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 65 · Rate Limiter</h3>
        <ul>
          <li><strong>API:</strong> <C>allow(clientId) → bool</C>; over → 429 + <C>Retry-After</C>. A <C>RateLimiter</C> Strategy with per-tier config.</li>
          <li><strong>Algorithms:</strong> fixed window (O(1), 2× boundary burst) · sliding window log (exact, O(requests)) · sliding window counter (accurate, O(1) — prod default) · token bucket (allows bursts, average = rate) · leaky bucket (constant outflow).</li>
          <li><strong>Thread-safety is the crux:</strong> shared mutable state — refill+take must be atomic per client (lock or CAS), never one global lock; inject the Clock.</li>
          <li><strong>Distributed:</strong> per-node multiplies → centralize in Redis (INCR+EXPIRE / sorted set / Lua token bucket).</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 The week in one table</h2>
        <table className="matrix">
          <thead><tr><th>tool</th><th>gives you</th><th>use for</th></tr></thead>
          <tbody>
            <tr><td>immutable / confined</td><td>no shared mutable state</td><td>the best fix — no coordination needed</td></tr>
            <tr><td>volatile</td><td>visibility + ordering (1 field)</td><td>flags, safe publication (NOT counters)</td></tr>
            <tr><td>AtomicInteger / CAS</td><td>lock-free atomic (1 var)</td><td>counters, the atomic claim</td></tr>
            <tr><td>synchronized / Lock</td><td>atomicity + visibility (block)</td><td>compound critical sections</td></tr>
            <tr><td>BlockingQueue</td><td>bounded buffer + backpressure</td><td>producer–consumer, thread pools</td></tr>
            <tr><td>optimistic (version/CAS)</td><td>no-lock + conflict detect</td><td>low contention</td></tr>
            <tr><td>pessimistic (lock)</td><td>serialize, conflict-free</td><td>high contention, short sections</td></tr>
            <tr><td>lease (claim + TTL)</td><td>reserve across think-time</td><td>seat/inventory holds</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>Shared + mutable + threads = race.</strong> Kill a leg or coordinate.</li>
          <li><strong>count++ is three steps; volatile ++ still races.</strong></li>
          <li><strong>volatile = visibility; atomic = one-var; lock = compound section.</strong></li>
          <li><strong>Bound the buffer (backpressure); BlockingQueue, not hand-rolled wait/notify.</strong></li>
          <li><strong>Low contention → optimistic; high → pessimistic; think-time → lease.</strong></li>
          <li><strong>The atomic claim = compareAndSet (or lock around check+act).</strong></li>
          <li><strong>A rate limiter is shared mutable state — make refill+take atomic per client.</strong></li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps to never repeat</h2>
        <Warn><strong>Assuming a statement is atomic.</strong> count++, x+=1, lazy-init checks are multi-step and racy.</Warn>
        <Warn><strong>Ignoring visibility.</strong> Correct logic can hang — a non-volatile flag may never be seen.</Warn>
        <Warn><strong>volatile for compound ops / one global lock.</strong> volatile isn\'t atomic; a global lock serializes everything (lock per resource/client).</Warn>
        <Warn><strong>Unbounded queue / if-not-while wait / notify with mixed waiters.</strong> OOM; acts on a false condition; lost wakeup.</Warn>
        <Warn><strong>Optimistic on a hot row (livelock) / pessimistic multi-lock without order (deadlock).</strong> Match strategy to contention; order locks consistently.</Warn>
        <Warn><strong>Forgetting idempotency on retry.</strong> Optimistic retries and client re-sends must not double-apply.</Warn>
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
        <strong>Week 13 revised?</strong> You can now diagnose any race, apply the lightest correct cure,
        coordinate threads with bounded queues, choose a locking strategy by contention, and build a thread-safe
        rate limiter — the concurrency every Month-3 problem was waiting for.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 14 · Recap</strong> — advanced problems (built when the week completes).
      </div>
    </div>
  )
}
