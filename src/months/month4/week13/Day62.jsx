import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: fix the counter ============ */
function FixTheCounter() {
  const [mode, setMode] = useState('plain')
  const [result, setResult] = useState(null)
  const EXPECTED = 200000

  function run() {
    if (mode === 'plain') {
      const lost = Math.floor(EXPECTED * (0.08 + Math.random() * 0.2))
      setResult({ value: EXPECTED - lost, ok: false, note: 'count++ is read-modify-write → lost updates. Wrong, and a different number every run.' })
    } else if (mode === 'synchronized') {
      setResult({ value: EXPECTED, ok: true, note: 'synchronized makes increment atomic AND visible (one thread in the critical section at a time). Correct — at the cost of lock contention.' })
    } else {
      setResult({ value: EXPECTED, ok: true, note: 'AtomicInteger.incrementAndGet() uses lock-free CAS. Correct, and scales better than a lock under contention.' })
    }
  }

  const CODE = {
    plain: 'int count = 0;\ncount++;                 // ❌ racy: read-modify-write',
    synchronized: 'int count = 0;\nsynchronized (lock) {     // ✅ mutual exclusion + visibility\n    count++;\n}',
    atomic: 'AtomicInteger count = new AtomicInteger();\ncount.incrementAndGet(); // ✅ lock-free CAS, atomic',
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the Day-61 counter race, now fixed three ways (2 threads × 100,000)</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        <button className={mode === 'plain' ? 'on' : ''} onClick={() => { setMode('plain'); setResult(null) }}>❌ plain int</button>
        <button className={mode === 'synchronized' ? 'on' : ''} onClick={() => { setMode('synchronized'); setResult(null) }}>synchronized</button>
        <button className={mode === 'atomic' ? 'on' : ''} onClick={() => { setMode('atomic'); setResult(null) }}>AtomicInteger</button>
      </div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
        {CODE[mode].split('\n').map((l, i) => <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre' }}>{l}</div>)}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={run}>▶ run (expect {EXPECTED.toLocaleString()})</button>
        {result && (
          <span className="chip" style={{ fontFamily: 'IBM Plex Mono', background: result.ok ? '#EAF7EF' : '#FDECEC' }}>
            result: {result.value.toLocaleString()} {result.ok ? '✓' : '💥'}
          </span>
        )}
      </div>
      {result && <div className="statbar" style={{ display: 'block', background: result.ok ? '#EAF7EF' : '#FDECEC' }}><span style={{ fontSize: 12.5 }}>{result.note}</span></div>}
    </div>
  )
}

/* ============ Interactive 2: the CAS loop ============ */
const CAS_UNCONTENDED = [
  { line: 'cur = count.get() → 5', note: 'Read the current value: 5. This is our "expected".' },
  { line: 'next = cur + 1 → 6', note: 'Compute the new value off to the side: 6.' },
  { line: 'compareAndSet(5, 6) → true', ok: true, note: '✅ "Set to 6 ONLY IF it is still 5." It is → success. One atomic hardware instruction, no lock.' },
]
const CAS_CONTENDED = [
  { line: 'cur = count.get() → 5', note: 'Read current: 5 (expected).' },
  { line: 'next = cur + 1 → 6', note: 'Compute new: 6.' },
  { line: 'compareAndSet(5, 6) → FALSE', fail: true, note: '💥 Another thread changed count to 7 in between — it is no longer 5, so the CAS FAILS. Nobody is blocked; we just retry.' },
  { line: 'cur = count.get() → 7', note: 'Retry: re-read the current value, now 7.' },
  { line: 'next = cur + 1 → 8', note: 'Recompute: 8.' },
  { line: 'compareAndSet(7, 8) → true', ok: true, note: '✅ Still 7 → success. The CAS retry loop is how lock-free atomics guarantee correctness without ever blocking.' },
]

function CASLoop() {
  const [mode, setMode] = useState('contended')
  const [step, setStep] = useState(0)
  const steps = mode === 'contended' ? CAS_CONTENDED : CAS_UNCONTENDED
  const done = step >= steps.length

  return (
    <div className="panel">
      <div className="ptitle">Live demo · incrementAndGet() is a compare-and-set RETRY loop — no locks, never blocks</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        <button className={mode === 'uncontended' ? 'on' : ''} onClick={() => { setMode('uncontended'); setStep(0) }}>uncontended (1 try)</button>
        <button className={mode === 'contended' ? 'on' : ''} onClick={() => { setMode('contended'); setStep(0) }}>contended (CAS fails → retry)</button>
      </div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>do {'{'} cur = get(); next = cur + 1; {'}'} while (!compareAndSet(cur, next));</div>
        {steps.slice(0, step).map((s, i) => (
          <div key={i} style={{
            fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '2px 0',
            color: s.fail ? 'var(--red)' : s.ok ? 'var(--green)' : 'var(--ink)', fontWeight: s.ok || s.fail ? 700 : 400,
          }}>{s.line}</div>
        ))}
      </div>
      {step > 0 && step <= steps.length && <div className="statbar" style={{ display: 'block', marginBottom: 8 }}><span style={{ fontSize: 12.5 }}>{steps[step - 1].note}</span></div>}
      <div style={{ display: 'flex', gap: 8 }}>
        {!done ? <button className="act" onClick={() => setStep((x) => x + 1)}>{step === 0 ? '▶ run incrementAndGet()' : 'next →'}</button>
               : <button className="ghost act" onClick={() => setStep(0)}>replay</button>}
      </div>
    </div>
  )
}

/* ============ Interactive 3: pick the right tool ============ */
const TOOLS = [
  { q: 'A boolean flag set once by main to stop a worker loop (no compound update).', o: ['volatile field', 'synchronized block', 'AtomicInteger'], a: 0,
    why: 'volatile gives VISIBILITY (+ ordering) for a single field — perfect for a stop/done flag. No mutual exclusion needed because there\'s no read-modify-write. (synchronized would also work but is heavier.)' },
  { q: 'A counter incremented by many threads, millions of times.', o: ['volatile int', 'AtomicInteger / LongAdder', 'A new lock per increment'], a: 1,
    why: 'A counter is read-modify-write, so volatile is NOT enough (volatile count++ still races). AtomicInteger.incrementAndGet() is lock-free CAS; under heavy contention LongAdder scales even better. Atomics beat locks for a single variable.' },
  { q: 'Check a seat is AVAILABLE, then book it — as ONE indivisible step.', o: ['volatile', 'An atomic compare-and-set on the seat (or a lock around check+act)', 'Just re-check after'], a: 1,
    why: 'Check-then-act on a compound condition. Collapse it: compareAndSet(AVAILABLE, BOOKED) on an AtomicReference, or a lock/synchronized block around the check AND the act. volatile alone can\'t make two steps atomic.' },
  { q: 'A config map read constantly by many threads, written very rarely.', o: ['synchronized on every read', 'ConcurrentHashMap (or an immutable map swapped on write)', 'A plain HashMap'], a: 1,
    why: 'Reads dominate, so locking every read kills throughput, and a plain HashMap corrupts under concurrent writes. ConcurrentHashMap gives lock-free/striped reads; or hold an immutable map in a volatile ref and replace it on each (rare) write.' },
  { q: 'Acquire two locks but you must avoid hanging forever if you can\'t get both.', o: ['synchronized (intrinsic lock)', 'ReentrantLock.tryLock(timeout)', 'volatile'], a: 1,
    why: 'synchronized blocks indefinitely with no way out. ReentrantLock.tryLock(timeout) lets you back off and retry if you can\'t acquire in time — a deadlock-avoidance tool synchronized doesn\'t offer (also lockInterruptibly, fairness, multiple conditions).' },
  { q: 'A value computed once at startup, never changed, shared by all threads.', o: ['A lock around every read', 'Make it immutable / final (no coordination needed)', 'volatile'], a: 1,
    why: 'The best concurrency tool is no shared mutable state. An immutable object (final fields, set once) is safe to share with ZERO synchronization — publish it safely once and every thread can read it freely. Prefer this whenever you can.' },
]

function ToolChooser() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= TOOLS.length
  const cur = TOOLS[idx]
  function pick(i) { if (picked !== null) return; setPicked(i); if (i === cur.a) setScore((s) => s + 1) }
  return (
    <div className="panel">
      <div className="ptitle">Live demo · pick the right tool for each scenario before revealing</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎯 Score: <b>{score} / {TOOLS.length}</b> — the ladder: immutable &gt; confined &gt; atomic (one var) &gt; lock/synchronized (compound) &gt; concurrent collection. Pick the lightest tool that\'s correct.</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 10 }}>🧰 <span>scenario {idx + 1} of {TOOLS.length} · score {score}</span></div>
          <p style={{ fontSize: 14.5, fontWeight: 600 }}>{cur.q}</p>
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

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The BEST way to make code thread-safe, before reaching for any lock?',
    o: ['synchronized everything', 'Remove the need: make state IMMUTABLE or CONFINE it to one thread — no shared mutable state means no coordination at all', 'Use more threads', 'Add volatile everywhere'], a: 1,
    e: 'The cheapest correct concurrency is none. Immutable objects (final fields, set once) are freely shareable; thread-confined data is never shared. Reach for locks/atomics only for the shared mutable state you can\'t eliminate.',
    w: { 0: 'Over-locking is slow, deadlock-prone, and often still wrong.', 2: 'More threads add contention, not safety.', 3: 'volatile gives visibility, not atomicity — and not everywhere.' },
    r: { id: 's1', label: 'Section 1 — the cure hierarchy' } },
  { q: 'What does synchronized provide?',
    o: ['Only speed', 'BOTH mutual exclusion (atomicity — one thread in the block at a time) AND visibility/ordering (happens-before) — entering/exiting the monitor publishes writes', 'Only visibility', 'Only atomicity'], a: 1,
    e: 'A synchronized block acquires an intrinsic lock (monitor): it serializes access (fixing lost updates and check-then-act) and establishes happens-before (so writes inside are visible to the next thread that enters). It is also reentrant.',
    w: { 0: 'It costs some speed; it BUYS correctness.', 2: 'It gives atomicity too.', 3: 'It gives visibility too.' },
    r: { id: 's2', label: 'Section 2 — synchronized' } },
  { q: 'volatile count++ — is it thread-safe?',
    o: ['Yes', 'No — volatile gives visibility + ordering but NOT atomicity; count++ is still read-modify-write and can lose updates. Use AtomicInteger or a lock for compound operations', 'Yes if the field is also final', 'Only on 64-bit JVMs'], a: 1,
    e: 'The classic trap: volatile makes each read/write visible, but ++ is THREE operations — two threads can still interleave and lose updates. volatile is for flags/publication of a single value, not for counters.',
    w: { 0: 'Compound ops still race.', 2: 'final can\'t be reassigned, so ++ wouldn\'t compile.', 3: 'It\'s wrong on every JVM for compound ops.' },
    r: { id: 's3', label: 'Section 3 — volatile' } },
  { q: 'When is volatile the RIGHT tool?',
    o: ['For counters', 'For a single field where you need VISIBILITY (and ordering) but no compound update — e.g. a stop/done flag, or safely publishing an immutable object reference', 'For everything', 'Never'], a: 1,
    e: 'volatile shines for status flags and one-shot publication: a write is immediately visible to all readers and not reordered. It does NOT serialize compound operations — that\'s what atomics and locks are for.',
    w: { 0: 'Counters are compound — use atomics.', 2: 'Wrong tool for compound updates.', 3: 'It\'s the right tool for flags/publication.' },
    r: { id: 's3', label: 'Section 3 — volatile' } },
  { q: 'How does AtomicInteger.incrementAndGet() work without locking?',
    o: ['It uses synchronized internally', 'A compare-and-set (CAS) retry loop: read current, compute new, atomically set ONLY IF still equal to current; if another thread changed it, the CAS fails and it retries — lock-free, never blocks', 'It disables other threads', 'Magic'], a: 1,
    e: 'CAS is one atomic hardware instruction: "set to new iff current == expected". The loop retries on failure instead of blocking. This IS the real compare-and-set behind every Month-3 "atomic claim".',
    w: { 0: 'It\'s lock-free, not synchronized.', 2: 'It never stops other threads.', 3: 'It\'s a hardware CAS instruction.' },
    r: { id: 's5', label: 'Section 5 — atomics & CAS' } },
  { q: 'ReentrantLock over synchronized buys you…',
    o: ['Nothing', 'tryLock with a TIMEOUT (deadlock avoidance), lockInterruptibly, fairness, and multiple Condition variables — at the cost of a mandatory try/finally unlock', 'Automatic unlock', 'Faster locking always'], a: 1,
    e: 'synchronized is simpler and auto-releases, but is all-or-nothing and blocks forever. ReentrantLock adds tryLock(timeout) (back off instead of deadlock), interruptible acquisition, fairness, and several conditions — you must unlock() in finally.',
    w: { 0: 'It adds real capabilities.', 2: 'You must unlock manually (finally).', 3: 'Not always faster; it\'s about features.' },
    r: { id: 's7', label: 'Section 7 — explicit locks' } },
  { q: 'The Month-3 "atomic claim" (book a seat / occupy a spot) is built with…',
    o: ['A boolean check then set', 'An atomic compare-and-set on the resource\'s state (e.g. AtomicReference.compareAndSet(AVAILABLE, BOOKED)) or a lock around check+act — so exactly one of two racers wins', 'volatile', 'A retry without atomicity'], a: 1,
    e: 'Every "I\'d make this atomic — Month 4" flag becomes a real CAS: collapse check-and-act into one indivisible operation. compareAndSet returns true for exactly one racer; the loser is rejected/retries. The disease (Day 61) finally has its cure.',
    w: { 0: 'That\'s the racy check-then-act it replaces.', 2: 'volatile can\'t make two steps atomic.', 3: 'The retry must wrap an ATOMIC set.' },
    r: { id: 's9', label: 'Section 9 — building the atomic claim' } },
  { q: 'A lock-granularity rule that keeps concurrent code fast?',
    o: ['Lock the whole method always', 'Hold the lock for the SMALLEST critical section, and NEVER do slow I/O (network/disk) while holding it — minimize the serial part; consider lock striping for hot maps', 'Use one global lock for everything', 'Never unlock'], a: 1,
    e: 'A lock serializes whatever it guards, so a coarse lock (or I/O inside it) throttles all threads. Guard only the shared-state mutation; do expensive work outside. One global lock is a scalability dead end.',
    w: { 0: 'Coarse locking serializes too much.', 2: 'A global lock kills throughput.', 3: 'Forgetting to unlock deadlocks everything.' },
    r: { id: 's7', label: 'Section 7 — lock granularity' } },
]

/* ============ The page ============ */
export default function Day62() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 13 · Day 62 · Advanced LLD · Concurrency</div>
        <h1>Concurrency — Part 2:<br />The Cures</h1>
        <p>Part 1 diagnosed the disease (races, visibility, ordering). Today we cure it: avoid sharing where you
           can (immutability), then coordinate with <C>synchronized</C>, <C>volatile</C>, atomic classes (the
           real compare-and-set), and explicit <C>Lock</C>s — and finally BUILD the atomic claim you\'ve flagged
           all course. Click everything.</p>
        <div className="chips">
          {['synchronized', 'volatile', 'AtomicInteger / CAS', 'ReentrantLock', 'the atomic claim', 'thread-safe singleton'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The cure hierarchy — cheapest first</h2>
        <p>Don\'t reach for a lock first. The best fixes <em>remove the problem</em>; coordination is the last
          resort, and the lightest correct tool wins:</p>
        <Code html={`  THE LADDER (try the top rungs before the bottom ones)

  ① IMMUTABLE      final fields, set once → freely shareable, ZERO locking   (best)
  ② CONFINED       data owned by ONE thread (thread-local, a copy) → no sharing
  ③ ATOMIC         a single variable → AtomicInteger/Reference (lock-free CAS)
  ④ volatile       a single field needing VISIBILITY only (a flag, publication)
  ⑤ synchronized / Lock   a COMPOUND operation on shared state (check-then-act)
  ⑥ concurrent collections   ConcurrentHashMap, blocking queues (Day 63)

  Rule: pick the LIGHTEST tool that is correct. No shared mutable state = no bug.`} />
        <Note><strong>Why this order:</strong> immutability and confinement make races impossible (nothing to
          coordinate). Atomics handle a single variable lock-free. Locks are powerful but serialize code and
          risk deadlock — necessary for compound operations, but not your first move.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>synchronized — the intrinsic lock</h2>
        <p>The workhorse: it gives BOTH atomicity (one thread at a time) AND visibility (happens-before). It
          fixes Day 61\'s lost-update AND check-then-act races:</p>
        <Code html={`<span class="kw">private final</span> Object lock = <span class="kw">new</span> Object();   <span class="cm">// a PRIVATE lock object (don't lock on public things)</span>
<span class="kw">private int</span> count = <span class="num">0</span>;

<span class="kw">public void</span> increment() {
    <span class="kw">synchronized</span> (lock) {        <span class="cm">// only ONE thread in here at a time…</span>
        count++;                    <span class="cm">// …so read-modify-write is now atomic AND visible</span>
    }
}

<span class="cm">// the Month-3 check-then-act, fixed: hold the lock across BOTH the check and the act</span>
<span class="kw">public boolean</span> book(Seat s) {
    <span class="kw">synchronized</span> (lock) {
        <span class="kw">if</span> (s.isAvailable()) { s.book(); <span class="kw">return true</span>; }  <span class="cm">// no thread can slip between check & act</span>
        <span class="kw">return false</span>;
    }
}`} />
        <Warn><strong>Lock on a private object, hold it briefly.</strong> Locking on <C>this</C> or a public
          object lets outside code lock on the same monitor (surprise contention/deadlock). And a
          <C> synchronized</C> method locks the whole method — guard only the critical section. The intrinsic
          lock is reentrant (the same thread can re-enter), so a synchronized method calling another is fine.</Warn>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>volatile — visibility, NOT atomicity</h2>
        <p>The most misunderstood keyword. <C>volatile</C> fixes the <C>while(!stop)</C> bug from Day 61 — but it
          does <strong>not</strong> make compound operations atomic:</p>
        <Code html={`<span class="kw">private volatile boolean</span> stop = <span class="kw">false</span>;   <span class="cm">// ✅ VISIBILITY: the worker now SEES main's write</span>
<span class="cm">// worker: while (!stop) doWork();   main: stop = true;   → worker exits</span>

<span class="kw">private volatile int</span> count = <span class="num">0</span>;
count++;   <span class="cm">// ❌ STILL RACY — volatile makes each read/write visible, but ++ is read-modify-write</span>
           <span class="cm">//    two threads can still interleave and lose updates. Use AtomicInteger.</span>`} />
        <Note><strong>Use volatile for:</strong> a single field needing visibility/ordering with no compound
          update — stop/done flags, and safely publishing an immutable object\'s reference (write the fields,
          then publish the ref via a volatile write; readers see a fully-built object). <strong>Don\'t use it
          for:</strong> counters or any read-modify-write — that needs an atomic or a lock.</Note>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🔧 Play: fix the counter</h2>
        <p>The Day-61 race, repaired three ways. Run each and compare correctness:</p>
        <FixTheCounter />
        <Good><strong>What you should notice:</strong> ① The plain int loses updates (and varies each run).
          ② synchronized is exact — correct, with lock contention as the cost. ③ AtomicInteger is exact too, and
          lock-free (better under contention). Both fix it; the next section shows HOW the atomic does it.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Atomic classes &amp; CAS — the real compare-and-set</h2>
        <p>This is the cure for every Month-3 "atomic claim". <C>AtomicInteger</C>/<C>AtomicReference</C> use a
          hardware <strong>compare-and-set</strong>: "set to new <em>only if</em> the value is still what I
          expect", retried in a loop — lock-free, never blocking:</p>
        <Code html={`AtomicInteger count = <span class="kw">new</span> AtomicInteger(<span class="num">0</span>);
count.incrementAndGet();   <span class="cm">// atomic ++ via CAS, under the hood:</span>

<span class="cm">// the CAS retry loop (what incrementAndGet does):</span>
<span class="kw">int</span> cur, next;
<span class="kw">do</span> {
    cur  = count.get();             <span class="cm">// read the current value (the "expected")</span>
    next = cur + <span class="num">1</span>;               <span class="cm">// compute the new value</span>
} <span class="kw">while</span> (!count.compareAndSet(cur, next));  <span class="cm">// set ONLY IF unchanged; retry if a racer won</span>

<span class="cm">// AtomicReference for object state — the Month-3 seat/spot claim, for real:</span>
AtomicReference&lt;State&gt; state = <span class="kw">new</span> AtomicReference&lt;&gt;(AVAILABLE);
<span class="kw">boolean</span> won = state.compareAndSet(AVAILABLE, BOOKED);  <span class="cm">// true for EXACTLY ONE racer</span>`} />
        <Good><strong>CAS is optimistic concurrency:</strong> assume no conflict, do the work, and only commit
          if nothing changed — otherwise retry. No thread ever blocks. It\'s ideal under LOW contention; under
          very high contention the retries pile up (then <C>LongAdder</C>, or a lock, can win). This is the
          foundation of Day 64\'s optimistic-vs-pessimistic discussion.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Play: the CAS loop</h2>
        <p>Step through <C>incrementAndGet()</C> in both worlds — uncontended (one try) and contended (the CAS
          fails and retries):</p>
        <CASLoop />
        <Good><strong>What you should notice:</strong> ① CAS reads, computes, then sets ONLY IF unchanged.
          ② Under contention the set fails — but nobody blocks; it just re-reads and retries. ③ This retry loop
          is exactly how a lock-free atomic stays correct, and it\'s the literal mechanism behind the atomic
          seat/spot claim.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Explicit locks — ReentrantLock &amp; ReadWriteLock</h2>
        <p>When you need more than <C>synchronized</C> offers — a timeout to avoid deadlock, interruptibility,
          fairness, or multiple wait-sets — use an explicit <C>Lock</C>:</p>
        <Code html={`<span class="kw">private final</span> ReentrantLock lock = <span class="kw">new</span> ReentrantLock();

lock.lock();
<span class="kw">try</span> {
    <span class="cm">// critical section</span>
} <span class="kw">finally</span> {
    lock.unlock();          <span class="cm">// ⚠ ALWAYS unlock in finally — or a thrown exception deadlocks everyone</span>
}

<span class="cm">// the superpower synchronized lacks — back off instead of deadlocking:</span>
<span class="kw">if</span> (lock.tryLock(<span class="num">1</span>, TimeUnit.SECONDS)) {   <span class="cm">// give up if not acquired in time</span>
    <span class="kw">try</span> { ... } <span class="kw">finally</span> { lock.unlock(); }
} <span class="kw">else</span> {
    <span class="cm">// couldn't get it → retry / abort, avoiding a deadlock</span>
}

<span class="cm">// reads dominate? let many readers in, one writer at a time:</span>
ReadWriteLock rw = <span class="kw">new</span> ReentrantReadWriteLock();   <span class="cm">// rw.readLock() / rw.writeLock()</span>`} />
        <table className="matrix" style={{ marginTop: 10 }}>
          <thead><tr><th></th><th>synchronized</th><th>ReentrantLock</th></tr></thead>
          <tbody>
            <tr><td>release</td><td>automatic (block exit)</td><td>manual (finally!)</td></tr>
            <tr><td>tryLock / timeout</td><td>no</td><td>yes (deadlock avoidance)</td></tr>
            <tr><td>interruptible / fairness</td><td>no</td><td>yes</td></tr>
            <tr><td>condition variables</td><td>one (wait/notify)</td><td>many (newCondition)</td></tr>
            <tr><td>simplicity</td><td>simpler — prefer it by default</td><td>more power, more rope</td></tr>
          </tbody>
        </table>
        <Warn><strong>Lock granularity is everything.</strong> A lock serializes whatever it guards — hold it
          for the SMALLEST critical section and NEVER do slow I/O (network/disk) while holding it. For a hot
          shared map, lock striping (or <C>ConcurrentHashMap</C>) splits the lock so different keys don\'t
          contend. Prefer <C>synchronized</C> for simplicity; reach for <C>ReentrantLock</C> when you need its
          extras.</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🧰 Play: pick the right tool</h2>
        <p>Six scenarios — choose the lightest correct tool before revealing:</p>
        <ToolChooser />
        <Good><strong>What you should notice:</strong> ① The same ladder every time — immutable/confined beats
          atomic beats lock. ② volatile is for flags/visibility, never counters. ③ A single variable → atomic;
          a compound op → lock or a CAS on the whole state; reads-dominant → concurrent collection.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Building the atomic claim + the thread-safe Singleton</h2>
        <p>Two payoffs that close loops from earlier in the course. First, the Month-3 atomic claim, now real:</p>
        <Code html={`<span class="kw">public class</span> ShowSeat {
    <span class="kw">private final</span> AtomicReference&lt;Status&gt; status = <span class="kw">new</span> AtomicReference&lt;&gt;(AVAILABLE);

    <span class="kw">public boolean</span> tryHold() {
        <span class="kw">return</span> status.compareAndSet(AVAILABLE, HELD);  <span class="cm">// EXACTLY ONE of two racers gets true</span>
    }                                               <span class="cm">// the loser gets false → "seat just taken"</span>
}
<span class="cm">// at the DB layer the same idea is: UPDATE ... SET status='HELD' WHERE id=? AND status='AVAILABLE'</span>
<span class="cm">// rows-affected = 1 → you won; 0 → someone else did. (Day 64 goes deeper.)</span>`} />
        <p>Second, the thread-safe Singleton from Day 21 — now you understand <em>why</em> double-checked locking
          needs <C>volatile</C>:</p>
        <Code html={`<span class="cm">// holder idiom — lazy + thread-safe via class-init, no explicit locking (preferred):</span>
<span class="kw">class</span> Config {
    <span class="kw">private static class</span> Holder { <span class="kw">static final</span> Config I = <span class="kw">new</span> Config(); }
    <span class="kw">public static</span> Config get() { <span class="kw">return</span> Holder.I; }   <span class="cm">// JVM guarantees safe one-time init</span>
}

<span class="cm">// double-checked locking — the volatile is MANDATORY:</span>
<span class="kw">private static volatile</span> Config instance;   <span class="cm">// without volatile, another thread can see a</span>
<span class="kw">public static</span> Config get() {                <span class="cm">//   half-constructed object (ordering/visibility!)</span>
    <span class="kw">if</span> (instance == <span class="kw">null</span>) {
        <span class="kw">synchronized</span> (Config.class) {
            <span class="kw">if</span> (instance == <span class="kw">null</span>) instance = <span class="kw">new</span> Config();
        }
    }
    <span class="kw">return</span> instance;
}`} />
        <Good><strong>The loop closes:</strong> Day 21 said "DCL needs volatile, or use the holder/enum idiom" —
          now you know it\'s because object construction can be REORDERED, so without volatile a racing thread
          can see a non-null-but-half-built instance. The holder idiom and enum sidestep this entirely.</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>volatile for compound ops.</strong> <C>volatile count++</C> still races — volatile is
          visibility, not atomicity. Counters need atomics; compound ops need a lock.</Warn>
        <Warn><strong>Locking on <C>this</C> or a public object.</strong> External code can lock the same
          monitor → surprise contention/deadlock. Use a private final lock object.</Warn>
        <Warn><strong>Forgetting <C>unlock()</C> in finally.</strong> An exception in the critical section leaves
          the lock held forever — everyone deadlocks. Always <C>try {'{'} … {'}'} finally {'{'} unlock() {'}'}</C>.</Warn>
        <Warn><strong>Over-coarse locking / I/O under a lock.</strong> A method-wide lock or a network call while
          holding a lock serializes all threads. Guard the smallest critical section; do slow work outside.</Warn>
        <Warn><strong>Inconsistent lock ordering → deadlock.</strong> Two locks acquired in opposite orders hang.
          Acquire in a consistent global order (the sorted-seat trick) or use <C>tryLock</C> with timeout.</Warn>
        <Warn><strong>Re-inventing concurrent collections.</strong> Don\'t hand-lock a HashMap — use
          <C> ConcurrentHashMap</C>; don\'t hand-build a queue — use the blocking queues (Day 63).</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Ladder:</strong> immutable &gt; confined &gt; atomic (one var) &gt; volatile (visibility-only flag) &gt; synchronized/Lock (compound) &gt; concurrent collection. Pick the lightest correct tool.</li>
          <li><strong>synchronized:</strong> atomicity + visibility (happens-before); reentrant; lock a PRIVATE object; guard the smallest section.</li>
          <li><strong>volatile:</strong> visibility + ordering for ONE field — flags &amp; publication. NOT atomic for compound ops (volatile ++ races).</li>
          <li><strong>Atomics / CAS:</strong> <C>AtomicInteger/Reference</C>, lock-free compare-and-set retry loop; <C>compareAndSet(expected, new)</C> = the real atomic claim; <C>LongAdder</C> under heavy contention.</li>
          <li><strong>ReentrantLock:</strong> tryLock(timeout) for deadlock avoidance, interruptible, fairness, many conditions — but unlock() in finally. <C>ReadWriteLock</C> when reads dominate.</li>
          <li><strong>Atomic claim:</strong> <C>status.compareAndSet(AVAILABLE, BOOKED)</C> (or a lock around check+act; or a conditional UPDATE at the DB).</li>
          <li><strong>Thread-safe Singleton:</strong> holder idiom or enum (preferred); DCL needs <C>volatile</C> (reordering of construction — the Day 21 loop closed).</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "synchronized vs ReentrantLock — when would you choose each?"'>
          <p>Default to <C>synchronized</C>: it\'s simpler, auto-releases on block exit (even on exception), and
            is well-optimized. Reach for <C>ReentrantLock</C> when you need something it lacks: <C>tryLock</C>
            (with or without timeout) to avoid deadlock, <C>lockInterruptibly</C>, fairness, or multiple
            <C> Condition</C> variables (e.g. separate not-full/not-empty waits in a bounded buffer). The trade:
            ReentrantLock is more powerful but you MUST unlock in finally — more rope to hang yourself.
            "Simplest tool that does the job" applies here too.</p>
        </Reveal>
        <Reveal summary='Q: "Lock-free vs lock-based — what is the real trade-off?"'>
          <p>Lock-based (synchronized/Lock) BLOCKS contenders — simple, but a slow/preempted holder stalls
            everyone, and you risk deadlock. Lock-free (CAS atomics) never blocks — a thread either succeeds or
            retries, so one stalled thread can\'t halt others (better worst-case latency, no deadlock). The
            catch: CAS shines under LOW-to-moderate contention; under very high contention the retry loop wastes
            CPU (livelock-ish), where <C>LongAdder</C> (striped counters) or a lock can win. Rule of thumb:
            a single variable → atomics; a compound critical section → a lock; very hot counter → LongAdder.</p>
        </Reveal>
        <Reveal summary='Q: "Why exactly does double-checked locking need volatile?"'>
          <p>Because <C>instance = new Config()</C> is not atomic and can be REORDERED: the JVM may publish the
            reference BEFORE the constructor finishes writing the object\'s fields. Without <C>volatile</C>,
            another thread doing the first (unsynchronized) null-check can see a non-null reference to a
            HALF-CONSTRUCTED object and use it — a subtle, catastrophic bug. <C>volatile</C> forbids that
            reordering and guarantees visibility of the fully-built object. This is exactly why Day 21 preferred
            the holder idiom / enum, which avoid DCL\'s sharp edges entirely.</p>
        </Reveal>
        <Reveal summary='Q: "Is ConcurrentHashMap just a synchronized HashMap?"'>
          <p>No — and the difference is throughput. <C>Collections.synchronizedMap</C> wraps every method in one
            lock, so all operations serialize. <C>ConcurrentHashMap</C> uses fine-grained locking/CAS (lock
            striping / per-bin synchronization) so concurrent reads and writes on different keys don\'t contend,
            and reads are largely lock-free — far higher concurrency. Caveat: its iterators are weakly-consistent
            (no CME, may not reflect concurrent edits), and compound operations still need its atomic methods
            (<C>computeIfAbsent</C>, <C>merge</C>) — a plain get-then-put on it is still a check-then-act race.</p>
        </Reveal>
        <Reveal summary='Q: "How do you actually prevent deadlock?"'>
          <p>Several layers. The big one: acquire multiple locks in a CONSISTENT GLOBAL ORDER everywhere (e.g.
            sort by id — the same trick that made multi-seat booking safe), so no cycle can form. Beyond that:
            use <C>tryLock</C> with a timeout to back off and retry instead of waiting forever; hold locks for
            the shortest time and avoid calling foreign/unknown code while holding one (it might grab another
            lock); and prefer higher-level constructs (atomics, concurrent collections, a single lock) so you
            hold fewer locks at once. Detection (watchdogs/thread dumps) is a fallback, but prevention by lock
            ordering is the primary tool.</p>
        </Reveal>
        <Reveal summary='Q: "What is ThreadLocal, and what is its famous production leak?"'>
          <p><C>ThreadLocal&lt;T&gt;</C> is the CONFINED rung of today's ladder made concrete: each thread gets
            its own private copy (<C>tl.get()</C>/<C>set()</C>), so there is no sharing and no locking —
            classic uses are per-thread <C>SimpleDateFormat</C> (not thread-safe to share) and request context
            (user id, trace id — Day 93's MDC rides on this). <strong>The leak:</strong> in a thread POOL,
            threads never die — a value <C>set()</C> and never removed stays referenced by that pool thread
            forever, and worse, LEAKS to the next request that reuses the thread (user A's context showing up
            in user B's request is a real, famous production bug). Rule: in pooled threads, always
            <C> tl.remove()</C> in a <C>finally</C> block.</p>
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
        <strong>Day 62 complete?</strong> Homework: fix Day 61\'s bugs for real. ① Make the shared counter
        correct two ways — a <C>synchronized</C> block and an <C>AtomicInteger</C> — and confirm both print
        exactly 200,000 every run. ② Make the <C>while(!stop)</C> worker exit by marking <C>stop</C>
        <C> volatile</C>. ③ Build a <C>ShowSeat</C> whose <C>tryHold()</C> is an
        <C> AtomicReference.compareAndSet(AVAILABLE, HELD)</C> and prove that with many threads racing for one
        seat, exactly ONE gets <C>true</C>. Stretch: write the holder-idiom Singleton and explain why it needs
        no <C>volatile</C>.
        <br /><br />
        Next: <strong>Day 63 — Producer–Consumer</strong>: the classic coordination problem — blocking queues,
        <C> wait/notify</C>, and wiring it all together with thread pools.
      </div>
    </div>
  )
}
