import { useState, useEffect } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the counter race (lost update) ============ */
const COUNTER_STEPS = [
  { t1: 'read count → 0', t2: '', count: 0, note: 'Thread 1 reads the shared count: it sees 0. count++ is really THREE steps: read, add, write.' },
  { t1: '', t2: 'read count → 0', count: 0, note: 'Before T1 writes back, Thread 2 ALSO reads count — and also sees 0. Both now hold a stale value.' },
  { t1: 'compute 0+1, write 1', t2: '', count: 1, note: 'T1 computes 0+1=1 and writes it. count is now 1. Correct so far.' },
  { t1: '', t2: 'compute 0+1, write 1', count: 1, boom: true, note: '💥 T2 computes 0+1=1 (from its stale read) and writes 1 — overwriting T1. TWO increments happened, but count = 1, not 2. A LOST UPDATE.' },
]

function CounterRace() {
  const [step, setStep] = useState(-1)
  const [bulk, setBulk] = useState(null)
  const started = step >= 0
  const done = step >= COUNTER_STEPS.length - 1
  const cur = started ? COUNTER_STEPS[step] : null

  function runBulk(racy) {
    const N = 100000, threads = 2
    if (!racy) { setBulk({ racy, result: N * threads }); return }
    // simulate lost updates: a random fraction of increments collide
    const lost = Math.floor(N * threads * (0.08 + Math.random() * 0.22))
    setBulk({ racy, result: N * threads - lost, lost })
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · two threads each do count++ — watch an increment vanish</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 56px', gap: 6, marginBottom: 10 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#2D5BFF', fontWeight: 700, textAlign: 'center' }}>🧵 Thread 1</div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#D33', fontWeight: 700, textAlign: 'center' }}>🧵 Thread 2</div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', textAlign: 'center' }}>count</div>
        {COUNTER_STEPS.slice(0, step + 1).map((s, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, padding: '5px 7px', borderRadius: 5, minHeight: 14, background: s.t1 ? '#E5EBFF' : 'transparent', border: s.t1 ? '1px solid var(--line)' : 'none' }}>{s.t1}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, padding: '5px 7px', borderRadius: 5, minHeight: 14, background: s.t2 ? (s.boom ? '#FDECEC' : '#FDE8E8') : 'transparent', border: s.t2 ? '1px solid var(--line)' : 'none' }}>{s.t2}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, textAlign: 'center', fontWeight: 700, color: s.boom ? 'var(--red)' : 'var(--ink)' }}>{s.count}</div>
          </div>
        ))}
      </div>
      {cur && <div className="statbar" style={{ display: 'block', marginBottom: 8, background: cur.boom ? '#FDECEC' : undefined }}><span style={{ fontSize: 12.5 }}>{cur.note}</span></div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {!done ? <button className="act" onClick={() => setStep((x) => x + 1)}>{started ? 'next step →' : '▶ interleave the threads'}</button>
               : <button className="ghost act" onClick={() => setStep(-1)}>reset</button>}
      </div>
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>now at scale — 2 threads × 100,000 increments (expected 200,000):</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="act" style={{ fontSize: 12 }} onClick={() => runBulk(true)}>run racy (count++)</button>
          <button className="ghost act" style={{ fontSize: 12 }} onClick={() => runBulk(false)}>run atomic (Part 2 fix)</button>
          {bulk && (
            <span className="chip" style={{ fontFamily: 'IBM Plex Mono', background: bulk.racy ? '#FDECEC' : '#EAF7EF' }}>
              result: {bulk.result.toLocaleString()}{bulk.racy ? ` — ${bulk.lost.toLocaleString()} updates LOST 💥` : ' ✓ exact'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============ Interactive 2: check-then-act (the Month-3 race) ============ */
const CTA_STEPS = [
  { t1: 'if (seat.isAvailable()) → true', t2: '', note: 'Thread 1 (rider A) checks seat C4: it\'s AVAILABLE. ✓' },
  { t1: '', t2: 'if (seat.isAvailable()) → true', note: 'At (almost) the same instant, Thread 2 (rider B) checks C4 — also AVAILABLE. Neither has booked yet.' },
  { t1: 'seat.book(A)', t2: '', note: 'T1 books C4 for rider A. Success — ticket issued.' },
  { t1: '', t2: 'seat.book(B)', boom: true, note: '💥 T2 books C4 for rider B too — its check passed BEFORE T1\'s write. Two tickets, one seat. The exact double-booking from BookMyShow.' },
]

function CheckThenAct() {
  const [step, setStep] = useState(-1)
  const started = step >= 0
  const done = step >= CTA_STEPS.length - 1
  const cur = started ? CTA_STEPS[step] : null
  return (
    <div className="panel">
      <div className="ptitle">Live demo · "check, then act" — the SAME race you flagged all through Month 3</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#2D5BFF', fontWeight: 700, textAlign: 'center' }}>🧵 Rider A</div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#D33', fontWeight: 700, textAlign: 'center' }}>🧵 Rider B</div>
        {CTA_STEPS.slice(0, step + 1).map((s, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, padding: '5px 7px', borderRadius: 5, minHeight: 14, background: s.t1 ? '#E5EBFF' : 'transparent', border: s.t1 ? '1px solid var(--line)' : 'none' }}>{s.t1}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, padding: '5px 7px', borderRadius: 5, minHeight: 14, background: s.t2 ? (s.boom ? '#FDECEC' : '#FDE8E8') : 'transparent', border: s.t2 ? '1px solid var(--line)' : 'none' }}>{s.t2}</div>
          </div>
        ))}
      </div>
      {cur && <div className="statbar" style={{ display: 'block', marginBottom: 8, background: cur.boom ? '#FDECEC' : undefined }}><span style={{ fontSize: 12.5 }}>{cur.note}</span></div>}
      <div style={{ display: 'flex', gap: 8 }}>
        {!done ? <button className="act" onClick={() => setStep((x) => x + 1)}>{started ? 'next step →' : '▶ run the race'}</button>
               : <button className="ghost act" onClick={() => setStep(-1)}>reset</button>}
      </div>
      <Good style={{ marginTop: 10 }}><span style={{ fontSize: 12.5 }}>This is parking\'s two-gates/one-spot, the elevator\'s two-buttons/last-spot, the ATM\'s two-withdrawals/one-account, the wallet\'s two-transfers/one-balance — ALL the same check-then-act race. The gap between the check and the act is the bug.</span></Good>
    </div>
  )
}

/* ============ Interactive 3: the visibility problem ============ */
function VisibilityDemo() {
  const [mode, setMode] = useState('plain')
  const [ticks, setTicks] = useState(0)
  const [running, setRunning] = useState(false)
  const [signaled, setSignaled] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTicks((t) => t + 1), 180)
    return () => clearInterval(id)
  }, [running])

  function start() { setTicks(0); setSignaled(false); setRunning(true) }
  function signalStop() {
    setSignaled(true)
    if (mode === 'volatile') setRunning(false)   // the worker SEES the write and stops
    // plain mode: nothing — the worker never observes stop=true
  }
  function reset() { setRunning(false); setTicks(0); setSignaled(false) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · main sets stop=true — does the worker thread ever SEE it?</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        <button className={mode === 'plain' ? 'on' : ''} onClick={() => { setMode('plain'); reset() }}>plain field (no visibility)</button>
        <button className={mode === 'volatile' ? 'on' : ''} onClick={() => { setMode('volatile'); reset() }}>volatile field</button>
      </div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
        <div>{mode === 'volatile' ? 'private volatile boolean stop = false;' : 'private boolean stop = false;   // plain field'}</div>
        <div style={{ color: '#7c8aa5' }}>// worker: while (!stop) {'{'} doWork(); {'}'}    main (later): stop = true;</div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" style={{ fontSize: 12 }} onClick={start} disabled={running}>▶ start worker</button>
        <button className="act" style={{ fontSize: 12, borderColor: 'var(--red)' }} onClick={signalStop} disabled={!running || signaled}>main: stop = true</button>
        <button className="ghost act" style={{ fontSize: 12 }} onClick={reset}>reset</button>
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono' }}>worker loops: {ticks} {running ? '🌀 spinning' : '⏹ stopped'}</span>
      </div>
      <div className="statbar" style={{ display: 'block', background: signaled ? (running ? '#FDECEC' : '#EAF7EF') : undefined }}>
        <span style={{ fontSize: 12.5 }}>
          {!signaled
            ? 'Start the worker, then press "stop = true". Watch whether the loop actually stops.'
            : mode === 'plain'
              ? '💥 stop=true was written by main — but the worker keeps spinning. It cached stop=false in a CPU register/local cache and never re-reads main\'s write. Without a visibility guarantee, the update is INVISIBLE — an infinite loop. (Switch to volatile.)'
              : '✅ With volatile, every read of stop goes to main memory, so the worker SEES main\'s write and exits. volatile guarantees VISIBILITY (Part 2).'}
        </span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The single root cause of (almost) every concurrency bug?',
    o: ['Too many threads', 'SHARED MUTABLE STATE accessed by multiple threads without coordination — remove sharing OR mutability OR add coordination and the bug class disappears', 'Slow CPUs', 'Using ExecutorService'], a: 1,
    e: 'Concurrency bugs need three things: sharing, mutation, and multiple threads. Kill any one — confine the data to one thread, make it immutable, or coordinate access — and the race is gone. Immutability is the cleanest fix.',
    w: { 0: 'Even two threads on one variable is enough.', 2: 'Speed doesn\'t cause races (it changes the odds).', 3: 'Executors are the recommended tool, not the cause.' },
    r: { id: 's1', label: 'Section 1 — the root cause' } },
  { q: 'Why is count++ NOT atomic?',
    o: ['It is atomic', 'It\'s really THREE operations — read count, add 1, write back — and another thread can interleave between them, so two increments can both read the same value and one update is LOST', 'Java makes it atomic', 'Only doubles have this problem'], a: 1,
    e: 'count++ is read-modify-write. If T1 and T2 both read 5 before either writes, both write 6 — two increments, one effective. This "lost update" is why a racy counter ends below its expected total.',
    w: { 0: 'It compiles to multiple bytecodes; not atomic.', 2: 'The JVM does not make ++ atomic.', 3: 'It affects ints, longs, references — anything read-modify-write.' },
    r: { id: 's3', label: 'Section 3 — lost update' } },
  { q: 'Two threads both check "seat available?" then both book it. This race is called…',
    o: ['Lost update', 'Check-then-act — the gap between the CHECK and the ACT lets both pass the check before either acts; it\'s the exact double-booking / two-gates-one-spot race from all of Month 3', 'Deadlock', 'Starvation'], a: 1,
    e: 'Check-then-act: a decision made on a value that another thread changes before you act on it. Parking\'s two gates, BookMyShow\'s two riders, the ATM\'s two withdrawals — every Month-3 "atomic claim" flag was this race.',
    w: { 0: 'Lost update is read-modify-write on a counter; related but distinct.', 2: 'Deadlock is mutual waiting, not this.', 3: 'Starvation is a thread never getting to run.' },
    r: { id: 's5', label: 'Section 5 — check-then-act' } },
  { q: 'A worker loops while(!stop); main sets stop=true but the worker never exits. The hazard?',
    o: ['A logic bug', 'VISIBILITY — without synchronization/volatile, the worker may read a cached copy of stop and never see main\'s write (CPU caches + JIT optimization under the Java Memory Model)', 'A deadlock', 'A lost update'], a: 1,
    e: 'Atomicity isn\'t the only hazard. Visibility: one thread\'s write may never become visible to another without a memory barrier. The JIT can even hoist the read out of the loop. volatile (or synchronized) fixes it.',
    w: { 0: 'The code is logically fine; it\'s a memory-visibility issue.', 2: 'Nothing is mutually waiting.', 3: 'No update is lost — it\'s never seen.' },
    r: { id: 's7', label: 'Section 7 — visibility' } },
  { q: 'The three concurrency hazards under the Java Memory Model?',
    o: ['Speed, memory, disk', 'ATOMICITY (an operation interrupted mid-way), VISIBILITY (a write not seen by other threads), and ORDERING (the compiler/CPU reordering instructions) — synchronization addresses all three', 'Only race conditions', 'Only deadlock'], a: 1,
    e: 'Threads can break in three ways: a compound op interleaves (atomicity), a write stays invisible (visibility), and instructions are reordered (ordering). The JMM and "happens-before" define when you\'re safe.',
    w: { 0: 'Those are performance, not correctness hazards.', 2: 'Races are one symptom; the hazards are three.', 3: 'Deadlock is a liveness failure, not the full set.' },
    r: { id: 's7', label: 'Section 7 — the three hazards' } },
  { q: 'Best practice for running concurrent tasks in Java?',
    o: ['new Thread(...).start() everywhere', 'An ExecutorService / thread pool — reuse a bounded set of threads, submit tasks, get Futures; hand-rolling and unbounded threads exhaust resources and are hard to manage', 'One giant thread', 'Recursion'], a: 1,
    e: 'Creating a thread per task is expensive and unbounded (resource exhaustion). A thread pool (Executors / ThreadPoolExecutor) reuses threads, bounds concurrency, and returns Futures. Threads are a costly resource — pool them.',
    w: { 0: 'Unbounded thread creation exhausts the machine.', 2: 'One thread isn\'t concurrent.', 3: 'Unrelated.' },
    r: { id: 's2', label: 'Section 2 — threads in Java' } },
  { q: 'Why are concurrency bugs so notoriously hard to find?',
    o: ['They are not', 'They are NON-DETERMINISTIC ("Heisenbugs"): they depend on timing/interleaving, so they pass thousands of times, fail rarely in production, and often vanish under a debugger — you can\'t reliably reproduce them', 'They cause compile errors', 'They always crash immediately'], a: 1,
    e: 'A race might surface once in a million runs, only under load, and disappear when you add logging (which changes timing). This is why you DESIGN for thread-safety rather than test for it — and why the atomic-claim flags mattered.',
    w: { 0: 'They are famously hard.', 2: 'They compile fine.', 3: 'They usually corrupt data silently, not crash.' },
    r: { id: 's9', label: 'Section 9 — why so hard' } },
  { q: 'Two threads each grab two locks in OPPOSITE order and both wait forever. This is…',
    o: ['A lost update', 'DEADLOCK — T1 holds A waiting for B while T2 holds B waiting for A; neither proceeds. A liveness failure (cured in Part 2 by a consistent lock order / tryLock)', 'A visibility bug', 'Starvation'], a: 1,
    e: 'Deadlock is mutual circular waiting on held resources. The classic fix is acquiring locks in a CONSISTENT global order (the sorted-acquisition you used for multi-seat booking) or timed tryLock. Full treatment in Part 2.',
    w: { 0: 'No update is lost; threads are stuck.', 2: 'It\'s a liveness, not visibility, failure.', 3: 'Starvation is unfair scheduling, not mutual waiting.' },
    r: { id: 's9', label: 'Section 9 — deadlock teaser' } },
]

/* ============ The page ============ */
export default function Day61() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 13 · Day 61 · Advanced LLD · Concurrency</div>
        <h1>Concurrency — Part 1:<br />Threads &amp; What Goes Wrong</h1>
        <p>Month 4 begins, and so does the concurrency you\'ve been FLAGGING all through Month 3. Every "atomic
           claim" note — two gates/one spot, two riders/one seat, two withdrawals/one account — was the same
           bug. Today we diagnose the disease (races: atomicity, visibility, ordering); Part 2 builds the cures
           (locks, synchronized, atomics, volatile). Click everything.</p>
        <div className="chips">
          {['threads', 'race conditions', 'lost update', 'check-then-act', 'visibility', 'the Java Memory Model'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The one root cause</h2>
        <p>All of concurrency\'s horror stories trace to a single setup. Remember it and you can reason about any
          of them:</p>
        <Code html={`  THE ROOT CAUSE OF (ALMOST) EVERY CONCURRENCY BUG

       SHARED   +   MUTABLE   +   MULTIPLE THREADS   (with no coordination)
        │            │              │
        │            │              └─ more than one thread touches it
        │            └─ at least one thread CHANGES it
        └─ the same data is reachable from those threads

  Kill ANY one leg and the bug class vanishes:
    · not SHARED   → confine the data to one thread (thread-local, a copy)
    · not MUTABLE  → make it IMMUTABLE (the cleanest fix — Day 2 / Day 20)
    · coordinate   → synchronize / atomics / locks  (Part 2)`} />
        <Note><strong>Why this matters now:</strong> Month 3 kept saying "this needs an atomic claim — Month 4."
          That moment is here. Every booking/parking/ATM race was shared mutable state touched by two threads.
          The whole of Week 13 is learning to remove a leg or coordinate access.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Threads in Java (and how to actually run tasks)</h2>
        <p>A thread is an independent path of execution. You CAN make them by hand, but in real code you submit
          tasks to a <strong>thread pool</strong>:</p>
        <Code html={`<span class="cm">// the low-level way (know it, rarely use it directly):</span>
Thread t = <span class="kw">new</span> Thread(() -&gt; doWork());   <span class="cm">// a Runnable</span>
t.start();                                <span class="cm">// start() runs it on a NEW thread; run() would NOT</span>

<span class="cm">// the real way — a bounded, reusable POOL (threads are expensive; don't make one per task):</span>
ExecutorService pool = Executors.newFixedThreadPool(<span class="num">8</span>);
Future&lt;Integer&gt; f = pool.submit(() -&gt; compute());  <span class="cm">// returns a Future (a result you can await)</span>
pool.shutdown();

<span class="cm">// thread states: NEW → RUNNABLE → (BLOCKED / WAITING / TIMED_WAITING) → TERMINATED</span>`} />
        <Warn><strong>Two beginner traps:</strong> calling <C>run()</C> instead of <C>start()</C> (runs on the
          SAME thread — no concurrency at all), and <C>new Thread()</C> per task (unbounded thread creation
          exhausts the machine). Submit tasks to an <C>ExecutorService</C>; let it reuse a bounded set of
          threads and hand you <C>Future</C>s.</Warn>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Race #1 — the lost update (count++ is not atomic)</h2>
        <p>The most basic race. <C>count++</C> looks like one step but is <strong>three</strong>, and two threads
          can interleave between them:</p>
        <Code html={`  count++  IS REALLY  THREE OPERATIONS:

    1. READ   count  (into a register)
    2. ADD    1
    3. WRITE  the result back

  INTERLEAVING (count starts at 0):
    T1: read 0 ─┐
    T2: read 0 ─┤   both saw 0 before either wrote
    T1: write 1 ┤
    T2: write 1 ┘   T2 overwrites T1 — TWO increments, count = 1 (a LOST UPDATE)

  Run 2 threads × 100,000 increments on a plain int and you get
  SOMETHING LESS THAN 200,000 — and a different number every run.`} />
        <Note><strong>This is "atomicity":</strong> an operation that must happen all-or-nothing but can be
          interrupted halfway. <C>count++</C>, <C>x = x + 1</C>, <C>list.add(...)</C> — all read-modify-write
          (or multi-step) and all racy on shared state. Part 2 fixes this with atomics / synchronization.</Note>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🔢 Play: the counter race</h2>
        <p>Step through one lost update, then run it at scale and watch increments vanish:</p>
        <CounterRace />
        <Good><strong>What you should notice:</strong> ① Both threads read the same value before either writes —
          that\'s the lost update. ② At scale the racy counter lands below 200,000, and differently each run
          (non-determinism). ③ The "atomic" version is exact — that\'s the Part-2 fix previewed.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Race #2 — check-then-act (THE Month-3 race)</h2>
        <p>The race you\'ve met a dozen times already. You CHECK a condition, then ACT on it — but another thread
          changes the world in the gap between:</p>
        <Code html={`  CHECK-THEN-ACT (the atomic-claim race, finally named)

    if (seat.isAvailable()) {     ← CHECK   (T1 and T2 both pass this…)
        seat.book(rider);          ← ACT    (…then both do this)
    }

  Same shape, every Month-3 problem:
    · parking:    two gates check the last spot is free → both park
    · BookMyShow: two riders check seat C4 → both book it
    · ATM:        two withdrawals check the balance → both dispense
    · wallet:     two transfers read the balance → one update lost

  THE BUG IS THE GAP between the check and the act. The fix (Part 2):
  make check-and-act ONE indivisible step (compare-and-set / a lock).`} />
        <Warn><strong>Every "I\'d make this an atomic claim — Month 4" flag was this exact race.</strong> A
          decision made on a value that\'s stale by the time you act. The cure is to collapse the check and the
          act so no other thread can slip between them — exactly the compare-and-set you sketched for seats and
          balances.</Warn>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🎟 Play: check-then-act</h2>
        <p>Two riders, one seat — the double-booking from BookMyShow, now seen as a pure thread race:</p>
        <CheckThenAct />
        <Good><strong>What you should notice:</strong> ① Both checks return "available" before either books —
          the classic gap. ② This is byte-for-byte the parking/booking/ATM race; recognizing it as ONE pattern
          is the point. ③ The fix isn\'t "check more carefully" — it\'s making check+act atomic (Part 2).</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The three hazards: atomicity, visibility, ordering</h2>
        <p>Atomicity (Race #1) is only one of three ways threads break. The other two are subtler and live in the
          <strong> Java Memory Model</strong>:</p>
        <Code html={`  THE THREE CONCURRENCY HAZARDS (the JMM)

  ① ATOMICITY   a compound op (count++) is interrupted mid-way → lost update
  ② VISIBILITY  one thread's write is NOT seen by another → it reads a stale,
                cached copy (CPU caches, registers; the JIT may even hoist a
                read out of a loop). Classic: while(!stop) that never stops.
  ③ ORDERING    the compiler/CPU may REORDER instructions for speed; another
                thread can observe them out of order → broken assumptions

  "HAPPENS-BEFORE": synchronization (synchronized, volatile, locks) establishes
  an ordering guarantee — if A happens-before B, B sees A's writes, in order.
  Without it, you have NO guarantee at all.`} />
        <Note><strong>Visibility is the one that surprises everyone.</strong> Your code can be logically perfect
          and still hang forever because a thread never sees another\'s write. <C>volatile</C> guarantees
          visibility (and prevents that reordering) for a single field; <C>synchronized</C>/locks give both
          visibility AND atomicity for a block. Part 2 makes this concrete.</Note>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>👁 Play: the visibility problem</h2>
        <p>A worker loops <C>while(!stop)</C>; main sets <C>stop=true</C>. With a plain field the worker may
          never see it. Run both modes:</p>
        <VisibilityDemo />
        <Good><strong>What you should notice:</strong> ① In plain mode, <C>stop=true</C> is written but the
          worker spins forever — the update is invisible to it. ② <C>volatile</C> forces every read to go to
          main memory, so the worker sees the write and exits. ③ Nothing was "atomic" here — a single boolean
          write — yet it still broke. Visibility is a separate hazard from atomicity.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Two more failures + why these bugs are nightmares</h2>
        <p>Beyond races, threads have <strong>liveness</strong> failures — and all of it is brutally hard to
          debug:</p>
        <Code html={`  DEADLOCK (a Part-2 topic, teased here)
    T1: lock A … then wants B        T1 holds A, waits for B ─┐
    T2: lock B … then wants A        T2 holds B, waits for A ─┘  both wait FOREVER
    Fix: acquire locks in a CONSISTENT global order (the sorted-seat trick!)
         or use a timed tryLock.

  OTHER LIVENESS FAILURES:  livelock (busy but no progress) · starvation
  (a thread never gets scheduled).`} />
        <Warn><strong>Why concurrency bugs are "Heisenbugs":</strong> they\'re NON-DETERMINISTIC — they depend
          on exact timing/interleaving, so they pass 999,999 times, fail once in production under load, and
          often vanish when you attach a debugger or add a log line (which changes the timing). You cannot
          reliably TEST them away — you must DESIGN for thread-safety. That\'s why Month 3 planted the flags
          instead of hoping.</Warn>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>Assuming a single statement is atomic.</strong> <C>count++</C>, <C>x += 1</C>, lazy-init
          checks — all multi-step and racy on shared state.</Warn>
        <Warn><strong>Ignoring visibility.</strong> Correct logic can still hang/misbehave if writes aren\'t
          published. A non-volatile flag may never be seen.</Warn>
        <Warn><strong><C>run()</C> instead of <C>start()</C>.</strong> Runs on the current thread — zero
          concurrency, and a confusing "why no parallelism?".</Warn>
        <Warn><strong>A thread per task.</strong> Unbounded creation exhausts memory/OS limits. Use a bounded
          pool (ExecutorService).</Warn>
        <Warn><strong>"It passed my tests, so it\'s thread-safe."</strong> Races are non-deterministic; passing
          tests prove almost nothing. Reason about it; design it safe.</Warn>
        <Warn><strong>Sprinkling <C>synchronized</C> randomly.</strong> Wrong/over-locking gives false safety,
          deadlocks, or kills throughput. Part 2 is about doing it deliberately.</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Root cause:</strong> shared + mutable + multi-threaded (no coordination). Remove sharing, remove mutability (immutability!), or coordinate.</li>
          <li><strong>Run tasks</strong> via an <C>ExecutorService</C> (bounded pool, <C>Future</C>s) — not a thread per task; <C>start()</C> not <C>run()</C>.</li>
          <li><strong>Lost update:</strong> <C>count++</C> is read-modify-write (3 steps) → interleave → lost increments.</li>
          <li><strong>Check-then-act:</strong> the Month-3 atomic-claim race — the gap between CHECK and ACT. Fix = make it one indivisible step.</li>
          <li><strong>Three hazards (JMM):</strong> atomicity, visibility, ordering. Synchronization establishes happens-before (visibility + ordering); locks/atomics also give atomicity.</li>
          <li><strong>Visibility:</strong> without volatile/synchronized, one thread may never see another\'s write (the <C>while(!stop)</C> that never stops).</li>
          <li><strong>Liveness:</strong> deadlock (mutual waiting — fix with a consistent lock order), livelock, starvation. Bugs are non-deterministic Heisenbugs → design for safety, don\'t test for it.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "What&apos;s the difference between a race condition and a data race?"'>
          <p>Related but not identical. A DATA RACE is the low-level JMM violation: two threads access the same
            non-final field, at least one writes, with no happens-before ordering — undefined behavior. A RACE
            CONDITION is the higher-level correctness bug: the result depends on timing/interleaving (e.g.
            check-then-act double-booking). You can have a race condition WITHOUT a data race (e.g. two atomic
            ops that still interleave wrongly) and a data race that happens to not corrupt anything yet. In
            interviews: data race = memory-model term, race condition = logic-correctness term.</p>
        </Reveal>
        <Reveal summary='Q: "Concurrency vs parallelism — are they the same?"'>
          <p>No. CONCURRENCY is structuring a program as multiple independent tasks that may be IN PROGRESS at
            once (interleaved on one core or spread over many) — it\'s about dealing with many things. PARALLELISM
            is actually EXECUTING multiple things simultaneously on multiple cores — about doing many things at
            once. You can have concurrency on a single core (time-slicing). The hazards (races, visibility) come
            from concurrency — they bite even on one core because the OS can preempt a thread mid-operation.</p>
        </Reveal>
        <Reveal summary='Q: "Is reading/writing a long or double atomic in Java?"'>
          <p>Not guaranteed for non-volatile <C>long</C>/<C>double</C> — the JLS permits a 64-bit write to be
            done as two 32-bit writes, so another thread could see a "torn" half-updated value. ints, shorter
            types, and references ARE written atomically. Marking the field <C>volatile</C> makes long/double
            reads and writes atomic (and visible). It\'s a classic gotcha: even a single assignment can be
            non-atomic for 64-bit primitives.</p>
        </Reveal>
        <Reveal summary='Q: "Can a race condition occur on a single-core machine?"'>
          <p>Yes. The OS scheduler can PREEMPT a thread between any two bytecodes — so T1 can be paused after
            reading count but before writing it, T2 runs and writes, then T1 resumes and overwrites. No
            parallelism needed; interleaving alone causes the lost update. (Visibility issues are subtler on one
            core but reordering and caching can still bite.) The lesson: don\'t assume "one core = safe".</p>
        </Reveal>
        <Reveal summary='Q: "Why can&apos;t I just test my way to thread-safety?"'>
          <p>Because the bugs are non-deterministic: a race may need a precise interleaving that occurs once in
            millions of runs, only under production load, on specific hardware. Tests run a tiny, benign slice of
            the interleaving space and usually pass; adding logging or a debugger changes the timing and hides
            the bug (a Heisenbug). Tools help (stress tests, race detectors, jcstress), but the real answer is to
            DESIGN for safety — confine, make immutable, or coordinate — which is exactly why every Month-3
            problem flagged its race up front instead of relying on tests.</p>
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
        <strong>Day 61 complete?</strong> Homework: write the bug, then watch it. Create a shared
        <C> int count</C>, submit 2 tasks to an <C>ExecutorService</C> that each do <C>count++</C> 100,000 times,
        <C> shutdown()</C>, <C>awaitTermination</C>, and print count — run it several times and see it land below
        200,000, differently each run. Then write the <C>while(!stop)</C> visibility bug with a plain boolean and
        confirm the worker can hang. (Don\'t fix them yet — feel the disease.) Note which of the three hazards
        each one is.
        <br /><br />
        Next: <strong>Day 62 — Concurrency, Part 2</strong>: the cures — <C>synchronized</C>, explicit
        <C> Lock</C>s, atomic classes (the real compare-and-set), and <C>volatile</C> — and finally building the
        atomic claim you\'ve flagged all course.
      </div>
    </div>
  )
}
