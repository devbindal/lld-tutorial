import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the bounded buffer ============ */
const CAP = 5
let seq = 1

function BoundedBuffer() {
  const [items, setItems] = useState([])
  const [log, setLog] = useState('Empty bounded buffer · capacity ' + CAP + '. Produce to fill, consume to drain.')

  function produce() {
    if (items.length >= CAP) { setLog('⛔ producer BLOCKS — buffer is FULL. It waits for a consumer to make space. This is BACKPRESSURE: a slow consumer throttles a fast producer.'); return }
    const id = seq++
    setItems((q) => [...q, id])
    setLog(`📦 produced item #${id} → buffer ${items.length + 1}/${CAP}` + (items.length + 1 === CAP ? ' (now FULL — next produce blocks)' : ''))
  }
  function consume() {
    if (items.length === 0) { setLog('⛔ consumer BLOCKS — buffer is EMPTY. It waits for a producer to add work (no busy-spinning).'); return }
    const [head, ...rest] = items
    setItems(rest)
    setLog(`✅ consumed item #${head} → buffer ${rest.length}/${CAP}` + (rest.length === 0 ? ' (now EMPTY — next consume blocks)' : ''))
  }
  function reset() { setItems([]); setLog('Empty bounded buffer · capacity ' + CAP + '.') }

  const full = items.length >= CAP
  const empty = items.length === 0

  return (
    <div className="panel">
      <div className="ptitle">Live demo · a fixed-capacity buffer — full blocks producers, empty blocks consumers</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', width: 64 }}>buffer →</span>
        {[...Array(CAP)].map((_, i) => {
          const item = items[i]
          return (
            <div key={i} style={{
              width: 44, height: 40, borderRadius: 6, border: '1.5px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono', fontSize: 12,
              background: item !== undefined ? '#E5EBFF' : '#F4F3EE', color: item !== undefined ? 'var(--ink)' : '#bbb',
            }}>{item !== undefined ? '#' + item : '·'}</div>
          )
        })}
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: full ? 'var(--red)' : empty ? 'var(--amber)' : '#7c8aa5', marginLeft: 6 }}>
          {items.length}/{CAP}{full ? ' FULL' : empty ? ' EMPTY' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" style={{ borderColor: full ? 'var(--red)' : undefined }} onClick={produce}>📦 producer.put()</button>
        <button className="act" style={{ borderColor: empty ? 'var(--amber)' : undefined }} onClick={consume}>✅ consumer.take()</button>
        <button className="ghost act" onClick={reset}>reset</button>
      </div>
      <div className="statbar" style={{ display: 'block' }}><span style={{ fontSize: 12.5 }}>{log}</span></div>
      <Good style={{ marginTop: 10 }}><span style={{ fontSize: 12.5 }}>Fill it to {CAP} and press put again → the producer blocks (backpressure). Drain to 0 and press take → the consumer blocks. The buffer DECOUPLES the two: they run at their own speeds, only blocking at the limits.</span></Good>
    </div>
  )
}

/* ============ Interactive 2: the guarded-wait idiom ============ */
const WAIT_STEPS = [
  { actor: 'consumer', line: 'synchronized (lock) {', note: 'Consumer enters the monitor to safely check the buffer.' },
  { actor: 'consumer', line: '  while (queue.isEmpty())   // ← WHILE, not if', note: 'It checks the condition in a WHILE loop. The buffer is empty…' },
  { actor: 'consumer', line: '    lock.wait();', note: 'wait() RELEASES the lock and parks the thread — no busy-spinning, and other threads can now enter.' },
  { actor: 'producer', line: 'synchronized (lock) { queue.add(x);', note: 'A producer acquires the lock and adds an item.' },
  { actor: 'producer', line: '  lock.notifyAll(); }', note: 'notifyAll() wakes ALL waiting threads. (notify() wakes just one — risky if waiters wait on different conditions → lost-wakeup.)' },
  { actor: 'consumer', line: '  // re-acquires lock, RE-checks while', recheck: true, note: '★ The consumer wakes, re-acquires the lock, and RE-CHECKS the while condition — because another consumer may have grabbed the item first, or it was a spurious wakeup. THIS is why it must be while, not if.' },
  { actor: 'consumer', line: '  x = queue.remove(); }', ok: true, note: '✅ The condition now holds (an item exists), so the consumer takes it and exits. Guarded wait = check-in-a-loop, wait, recheck.' },
]

function GuardedWait() {
  const [step, setStep] = useState(0)
  const done = step >= WAIT_STEPS.length
  return (
    <div className="panel">
      <div className="ptitle">Live demo · the guarded-wait idiom — why you ALWAYS wait() inside a while loop</div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
        {WAIT_STEPS.slice(0, step).map((s, i) => (
          <div key={i} style={{
            fontFamily: 'IBM Plex Mono', fontSize: 12, padding: '2px 6px', borderRadius: 4, whiteSpace: 'pre',
            color: s.actor === 'producer' ? '#C75000' : '#2D5BFF',
            background: s.recheck ? '#FFF1D6' : s.ok ? '#EAF7EF' : 'transparent',
            fontWeight: s.recheck || s.ok ? 700 : 400,
          }}>{s.actor === 'producer' ? '🟠 ' : '🔵 '}{s.line}</div>
        ))}
      </div>
      {step > 0 && step <= WAIT_STEPS.length && <div className="statbar" style={{ display: 'block', marginBottom: 8 }}><span style={{ fontSize: 12.5 }}>{WAIT_STEPS[step - 1].note}</span></div>}
      <div style={{ display: 'flex', gap: 8 }}>
        {!done ? <button className="act" onClick={() => setStep((x) => x + 1)}>{step === 0 ? '▶ run consumer.take()' : 'next →'}</button>
               : <button className="ghost act" onClick={() => setStep(0)}>replay</button>}
      </div>
    </div>
  )
}

/* ============ Interactive 3: thread-pool saturation ============ */
const POOL = { core: 2, queueCap: 3, max: 4 }

function ThreadPool() {
  const [running, setRunning] = useState(0)
  const [queued, setQueued] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [rejected, setRejected] = useState(0)
  const [log, setLog] = useState('core=2, queue=3, max=4. Submit tasks faster than they complete to see saturation.')

  function submit() {
    // ThreadPoolExecutor order: core threads → queue → extra threads (up to max) → reject
    if (running < POOL.core) { setRunning((r) => r + 1); setLog('▶ running on a CORE thread (' + (running + 1) + '/' + POOL.core + ' core busy).') }
    else if (queued < POOL.queueCap) { setQueued((q) => q + 1); setLog('⏳ all core threads busy → task QUEUED (' + (queued + 1) + '/' + POOL.queueCap + ').') }
    else if (running < POOL.max) { setRunning((r) => r + 1); setLog('▶ queue full → spin up an EXTRA thread (' + (running + 1) + '/' + POOL.max + ' total).') }
    else { setRejected((x) => x + 1); setLog('🚫 pool saturated (max threads + full queue) → task REJECTED by the rejection policy (AbortPolicy throws; CallerRunsPolicy makes the submitter run it).') }
  }
  function complete() {
    if (running === 0) { setLog('nothing running to complete.'); return }
    setCompleted((c) => c + 1)
    if (queued > 0) { setQueued((q) => q - 1); setLog('✅ a thread finished → it picks up a QUEUED task (running stays ' + running + ').') }
    else { setRunning((r) => r - 1); setLog('✅ a thread finished → idle (running ' + (running - 1) + ').') }
  }
  function reset() { setRunning(0); setQueued(0); setCompleted(0); setRejected(0); setLog('core=2, queue=3, max=4.') }

  const cell = (label, val, color) => (
    <div style={{ textAlign: 'center', minWidth: 70 }}>
      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color }}>{val}</div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10.5, color: '#7c8aa5' }}>{label}</div>
    </div>
  )

  return (
    <div className="panel">
      <div className="ptitle">Live demo · a ThreadPoolExecutor saturating — core → queue → extra threads → reject</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10, justifyContent: 'center' }}>
        {cell('running / ' + POOL.max, running, running >= POOL.max ? 'var(--red)' : 'var(--green)')}
        {cell('queued / ' + POOL.queueCap, queued, queued >= POOL.queueCap ? 'var(--red)' : 'var(--amber)')}
        {cell('completed', completed, 'var(--ink)')}
        {cell('rejected', rejected, rejected > 0 ? 'var(--red)' : '#bbb')}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, justifyContent: 'center' }}>
        <button className="act" onClick={submit}>submit task</button>
        <button className="act" onClick={complete}>complete a task</button>
        <button className="ghost act" onClick={reset}>reset</button>
      </div>
      <div className="statbar" style={{ display: 'block' }}><span style={{ fontSize: 12.5 }}>{log}</span></div>
      <Note style={{ marginTop: 10 }}><span style={{ fontSize: 12.5 }}>Submit ~8 without completing any: 2 run on core, 3 queue, 2 spin up extra threads (→max 4), then the rest are REJECTED. The order (core → queue → max → reject) is the ThreadPoolExecutor rule — and the BOUNDED queue + rejection policy is what gives backpressure.</span></Note>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'What problem does producer–consumer solve?',
    o: ['Making code faster', 'DECOUPLING producers and consumers that work at different/variable rates, via a shared buffer — so neither waits on the other except at the buffer\'s limits, with backpressure built in', 'Removing all threads', 'Sorting data'], a: 1,
    e: 'A buffer between producers and consumers lets each run at its own pace; the only coordination is "block when full / block when empty". This smooths bursts and provides backpressure.',
    w: { 0: 'It\'s about coordination, not raw speed.', 2: 'It uses multiple threads.', 3: 'Unrelated.' },
    r: { id: 's1', label: 'Section 1 — the problem' } },
  { q: 'Why must the buffer be BOUNDED?',
    o: ['To save typing', 'Backpressure: a bounded queue forces a fast producer to slow down (block) when consumers fall behind. An UNBOUNDED queue hides the imbalance until it exhausts memory (OOM)', 'Bounded is faster', 'Unbounded is illegal'], a: 1,
    e: 'An unbounded queue lets a fast producer pile up work forever — memory grows until the JVM dies. A bound makes the producer block (or tasks get rejected), surfacing the imbalance instead of crashing.',
    w: { 0: 'It\'s about backpressure, not effort.', 2: 'Speed isn\'t the reason.', 3: 'Unbounded is legal — and dangerous.' },
    r: { id: 's1', label: 'Section 1 — backpressure' } },
  { q: 'Why must wait() be called inside a WHILE loop, not an if?',
    o: ['Style', 'To RE-CHECK the condition after waking — a thread can wake from a spurious wakeup, or another consumer may have already taken the item, so the condition might be false again; while re-checks, if would proceed wrongly', 'while is faster', 'if doesn\'t compile'], a: 1,
    e: 'The guarded-wait idiom: while(!condition) wait(). On wake you re-acquire the lock and re-test, because the wakeup may be spurious or another thread changed the state first. An if would skip the recheck and act on a false condition.',
    w: { 0: 'It\'s a correctness rule, not style.', 2: 'Speed is irrelevant.', 3: 'Both compile; if is just wrong.' },
    r: { id: 's4', label: 'Section 4 — while not if' } },
  { q: 'notify() vs notifyAll()?',
    o: ['Identical', 'notify() wakes ONE waiting thread (which may be waiting on a different condition → lost-wakeup risk); notifyAll() wakes all so the right one can proceed — prefer notifyAll unless you are certain all waiters are interchangeable', 'notifyAll is deprecated', 'notify wakes all'], a: 1,
    e: 'With a single condition and interchangeable waiters, notify() is fine and cheaper. But if waiters block on different conditions, notify() can wake the wrong one and the right one never runs (lost wakeup). notifyAll() is the safe default.',
    w: { 0: 'They differ.', 2: 'Neither is deprecated.', 3: 'Reversed.' },
    r: { id: 's4', label: 'Section 4 — notifyAll' } },
  { q: 'The right way to do producer–consumer in Java (instead of hand-rolling wait/notify)?',
    o: ['synchronized + wait/notify by hand', 'A BlockingQueue (ArrayBlockingQueue / LinkedBlockingQueue): put() blocks when full, take() blocks when empty — the buffer, the locking, and the signaling are all handled for you', 'A plain ArrayList', 'A volatile array'], a: 1,
    e: 'BlockingQueue encapsulates the bounded buffer with put()/take() that block correctly. Hand-rolled wait/notify is error-prone (while-loops, notifyAll, lost wakeups) — use the library unless you have a special reason.',
    w: { 0: 'Hand-rolling is the error-prone way the library replaces.', 2: 'A plain list isn\'t thread-safe or blocking.', 3: 'A volatile array doesn\'t coordinate put/take.' },
    r: { id: 's6', label: 'Section 6 — BlockingQueue' } },
  { q: 'How is a thread pool (ExecutorService) a producer–consumer system?',
    o: ['It is not', 'submit(task) PRODUCES work onto an internal BlockingQueue; the pool\'s worker threads are the CONSUMERS that take and run tasks — it IS the pattern, packaged', 'It uses one thread', 'It sorts tasks'], a: 1,
    e: 'A ThreadPoolExecutor is the canonical producer-consumer: submitters produce tasks into a work queue, worker threads consume them. That\'s why the async appender (Day 49) and notification dispatcher (Day 57) are thread pools.',
    w: { 0: 'It is exactly this pattern.', 2: 'A pool has many workers.', 3: 'It runs tasks, doesn\'t sort.' },
    r: { id: 's7', label: 'Section 7 — thread pools' } },
  { q: 'A ThreadPoolExecutor with core=2, a bounded queue=3, max=4 receives 8 quick tasks. What happens to the last ones?',
    o: ['All 8 run at once', '2 run on core threads, 3 wait in the queue, 2 more spin up extra threads (to max 4), and the remaining ones are REJECTED by the rejection (saturation) policy', 'They all queue', 'They are dropped silently'], a: 1,
    e: 'The TPE order: fill core threads → fill the queue → add threads up to max → then reject. A bounded queue + a rejection policy (AbortPolicy throws; CallerRunsPolicy runs it on the caller, applying backpressure) is how the pool resists overload.',
    w: { 0: 'Concurrency is capped at max threads.', 2: 'The queue is bounded (3).', 3: 'Rejection is explicit, via a policy — not silent.' },
    r: { id: 's7', label: 'Section 7 — saturation' } },
  { q: 'How do you stop consumer threads gracefully when work is done?',
    o: ['Thread.stop()', 'A POISON PILL (a sentinel item that means "shut down" when taken) or ExecutorService.shutdown() + awaitTermination (and respond to interruption) — never the deprecated, unsafe Thread.stop()', 'Kill the JVM', 'An infinite loop'], a: 1,
    e: 'Signal completion cleanly: enqueue a poison-pill sentinel per consumer so each exits on taking it, or shutdown() the executor (stops accepting, drains, then terminates) and handle InterruptedException. Thread.stop() is deprecated and corrupts state.',
    w: { 0: 'Thread.stop() is unsafe/deprecated.', 2: 'Killing the JVM isn\'t graceful.', 3: 'That never stops.' },
    r: { id: 's9', label: 'Section 9 — graceful shutdown' } },
]

/* ============ The page ============ */
export default function Day63() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 13 · Day 63 · Advanced LLD · Concurrency</div>
        <h1>Producer–Consumer:<br />Decoupling Threads with a Buffer</h1>
        <p>The classic coordination pattern: producers make work, consumers process it, at different speeds — a
           bounded buffer between them keeps both busy and provides backpressure. We\'ll do it the hard way
           (<C>wait</C>/<C>notify</C>), the right way (<C>BlockingQueue</C>), and discover that every thread pool
           IS this pattern. Click everything.</p>
        <div className="chips">
          {['producer-consumer', 'bounded buffer', 'backpressure', 'wait / notify', 'BlockingQueue', 'thread pools'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The problem: different speeds, one buffer</h2>
        <p>Producers and consumers rarely run at the same rate. Wire them directly and the fast one constantly
          waits on the slow one. Put a <strong>bounded buffer</strong> between them and each runs freely until a
          limit:</p>
        <Code html={`  PRODUCER ──put()──▶ [ bounded buffer ] ──take()──▶ CONSUMER
   (fast/bursty)        capacity = N            (slow/steady)

  · buffer has SPACE  → producer puts and moves on
  · buffer FULL       → producer BLOCKS until a consumer frees space  ← backpressure
  · buffer has ITEMS  → consumer takes and works
  · buffer EMPTY      → consumer BLOCKS until a producer adds work     (no busy-spin)

  The bound is the whole point: it forces a fast producer to slow down
  instead of piling up work forever (an UNBOUNDED queue grows until OOM).`} />
        <Note><strong>Backpressure is the headline.</strong> A bounded buffer turns "consumer can\'t keep up"
          into "producer slows down" — a graceful, self-regulating system. An unbounded queue hides the
          imbalance until memory runs out. You\'ve already met this: the async log appender (Day 49) and the
          notification dispatcher (Day 57) are producer-consumer with a bounded queue + workers.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The hard way: synchronized + wait/notify</h2>
        <p>The low-level mechanism behind blocking. A thread that can\'t proceed calls <C>wait()</C> (releasing
          the lock and parking); another thread calls <C>notify()</C>/<C>notifyAll()</C> to wake it:</p>
        <Code html={`<span class="kw">class</span> BoundedBuffer&lt;T&gt; {
    <span class="kw">private final</span> Queue&lt;T&gt; q = <span class="kw">new</span> LinkedList&lt;&gt;();
    <span class="kw">private final int</span> capacity;
    <span class="kw">private final</span> Object lock = <span class="kw">new</span> Object();

    <span class="kw">public void</span> put(T x) <span class="kw">throws</span> InterruptedException {
        <span class="kw">synchronized</span> (lock) {
            <span class="kw">while</span> (q.size() == capacity)   <span class="cm">// ★ WHILE, not if (re-check on wake)</span>
                lock.wait();               <span class="cm">// release lock, park until notified — no busy-spin</span>
            q.add(x);
            lock.notifyAll();              <span class="cm">// wake consumers waiting on "empty"</span>
        }
    }
    <span class="kw">public</span> T take() <span class="kw">throws</span> InterruptedException {
        <span class="kw">synchronized</span> (lock) {
            <span class="kw">while</span> (q.isEmpty())            <span class="cm">// ★ WHILE, not if</span>
                lock.wait();
            T x = q.remove();
            lock.notifyAll();              <span class="cm">// wake producers waiting on "full"</span>
            <span class="kw">return</span> x;
        }
    }
}`} />
        <Warn><strong>Three rules that make or break wait/notify:</strong> ① <C>wait()</C> in a <strong>while</strong>
          loop (re-check the condition on wake), never an <C>if</C>; ② call <C>wait/notify</C> only while holding
          the monitor; ③ prefer <C>notifyAll()</C> over <C>notify()</C> when waiters may be waiting on different
          conditions (else a lost wakeup hangs the right thread). Most people get one of these wrong — which is
          exactly why you should use the library (Section 6).</Warn>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>📦 Play: the bounded buffer</h2>
        <p>Produce and consume by hand. Fill it to capacity and watch the producer block; drain it and watch the
          consumer block:</p>
        <BoundedBuffer />
        <Good><strong>What you should notice:</strong> ① When full, producing blocks — backpressure on a fast
          producer. ② When empty, consuming blocks — the consumer waits instead of busy-spinning. ③ In between,
          both run freely. The buffer decouples their speeds; only the two limits force coordination.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The guarded-wait idiom: why WHILE, not if</h2>
        <p>The single most important rule of <C>wait()</C>. When a thread wakes, the condition it waited for may
          <em> not</em> hold — so it must re-check:</p>
        <Code html={`  WHY while(!condition) wait();  AND NOT  if(!condition) wait();

  1. SPURIOUS WAKEUPS: the JVM is allowed to wake a thread for no reason.
  2. STOLEN CONDITION: notifyAll() wakes 3 consumers; only 1 item arrived.
     The first consumer takes it; the other two wake to an EMPTY buffer.
  3. So on wake you MUST re-test: while loops back and waits again;
     an if would fall through and remove() from an empty queue → bug.

  GUARDED WAIT = "check in a loop, wait, re-check on wake."`} />
        <Note><strong>notifyAll over notify.</strong> <C>notify()</C> wakes exactly one arbitrary waiter — fine
          only if all waiters are interchangeable (same condition). If producers and consumers wait on the SAME
          lock for DIFFERENT conditions, <C>notify()</C> can wake a producer when you needed a consumer →
          everyone stalls (lost wakeup). <C>notifyAll()</C> wakes all; the right one proceeds, the rest re-wait.
          (Explicit <C>Lock</C> + multiple <C>Condition</C>s let you target precisely — Day 62.)</Note>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>⏳ Play: the guarded wait</h2>
        <p>Step through a consumer that finds the buffer empty, waits, and is woken by a producer — watch the
          all-important re-check:</p>
        <GuardedWait />
        <Good><strong>What you should notice:</strong> ① <C>wait()</C> releases the lock and parks the thread
          (no spinning). ② <C>notifyAll()</C> from the producer wakes it. ③ On waking it RE-CHECKS the while
          condition before acting — the step that an <C>if</C> would skip, and the reason guarded wait is
          correct.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The right way: BlockingQueue</h2>
        <p>Almost never hand-roll wait/notify. The JDK gives you a correct bounded buffer with blocking
          <C> put()</C> and <C>take()</C> — the locking and signaling are done for you:</p>
        <Code html={`<span class="kw">BlockingQueue</span>&lt;Task&gt; queue = <span class="kw">new</span> ArrayBlockingQueue&lt;&gt;(<span class="num">100</span>);  <span class="cm">// BOUNDED → backpressure</span>

<span class="cm">// producer thread(s):</span>
queue.put(task);          <span class="cm">// blocks if full — clean backpressure</span>

<span class="cm">// consumer thread(s):</span>
Task t = queue.take();    <span class="cm">// blocks if empty — no busy-spin</span>
process(t);

<span class="cm">// non-blocking / timed variants when you can't block forever:</span>
<span class="kw">boolean</span> added = queue.offer(task, <span class="num">1</span>, TimeUnit.SECONDS);  <span class="cm">// give up after a timeout</span>`} />
        <table className="matrix" style={{ marginTop: 10 }}>
          <thead><tr><th>BlockingQueue</th><th>use it for</th></tr></thead>
          <tbody>
            <tr><td>ArrayBlockingQueue(n)</td><td>a fixed bound (array-backed) — the default bounded buffer</td></tr>
            <tr><td>LinkedBlockingQueue(n)</td><td>optionally bounded, linked nodes; higher throughput, separate put/take locks</td></tr>
            <tr><td>SynchronousQueue</td><td>no capacity — a hand-off; put waits for a take (direct producer→consumer)</td></tr>
            <tr><td>PriorityBlockingQueue</td><td>consumers take highest-priority first (unbounded — careful)</td></tr>
          </tbody>
        </table>
        <Good><strong>Rule:</strong> reach for a bounded <C>BlockingQueue</C> first. It eliminates the
          wait/notify footguns (while-loops, notifyAll, lost wakeups) and gives backpressure for free. Hand-roll
          only to learn, or for a genuinely special data structure.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Thread pools ARE producer–consumer</h2>
        <p>The big reveal: an <C>ExecutorService</C> is exactly this pattern, packaged. <C>submit()</C> produces
          a task onto an internal queue; worker threads consume and run them:</p>
        <Code html={`  ExecutorService = producer–consumer, built in

  you: pool.submit(task)  ──▶ [ internal work queue ] ──▶ [ worker threads run tasks ]
        (the PRODUCER)         (the bounded buffer)          (the CONSUMERS)

  ThreadPoolExecutor knobs (the real constructor):
    corePoolSize       threads kept alive even when idle
    maximumPoolSize    hard cap on threads
    workQueue          a BlockingQueue (BOUND it!)
    rejectedExecutionHandler   what to do when saturated

  SUBMISSION ORDER under load:
    fill core threads → enqueue → add threads up to max → REJECT (policy)`} />
        <Warn><strong>Bound the queue and choose a rejection policy.</strong> An <C>Executors.newFixedThreadPool</C>
          uses an UNBOUNDED queue — a flood of tasks grows memory until OOM (no backpressure). Build a
          <C> ThreadPoolExecutor</C> with a bounded queue and a rejection policy: <C>AbortPolicy</C> (throws —
          the default), <C>CallerRunsPolicy</C> (the submitter runs the task itself → natural backpressure),
          <C> DiscardPolicy</C>/<C>DiscardOldestPolicy</C> (drop). Sizing: CPU-bound ≈ #cores; I/O-bound can be
          higher (threads spend time waiting).</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🧵 Play: thread-pool saturation</h2>
        <p>core=2, queue=3, max=4. Submit faster than tasks complete and watch the pool fill, grow, and finally
          reject:</p>
        <ThreadPool />
        <Good><strong>What you should notice:</strong> ① Tasks fill core threads first, THEN the queue, THEN
          extra threads up to max — the exact ThreadPoolExecutor order (a common surprise). ② Once max threads +
          a full queue are reached, new tasks are REJECTED by the policy. ③ The bounded queue + rejection policy
          IS the backpressure — without a bound, it would just grow until OOM.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Graceful shutdown + where you\'ve already used this</h2>
        <p>Consumers loop forever waiting for work — so stopping them cleanly takes a deliberate signal:</p>
        <Code html={`  STOPPING CONSUMERS GRACEFULLY (never Thread.stop() — deprecated, corrupts state)

  · POISON PILL: enqueue a sentinel; a consumer that takes it exits.
        for (each consumer) queue.put(POISON);   // one pill per consumer
        // consumer: T t = queue.take(); if (t == POISON) return;

  · EXECUTOR shutdown:
        pool.shutdown();                 // stop accepting; finish queued tasks
        pool.awaitTermination(30, SECONDS);
        pool.shutdownNow();              // interrupt running tasks (last resort)
        // tasks should check Thread.interrupted() / handle InterruptedException`} />
        <Good><strong>You\'ve been using producer–consumer all along:</strong> the async log appender (Day 49)
          enqueues log events for a background writer; the notification dispatcher (Day 57) enqueues sends for
          worker threads; rate limiters and request pipelines queue work. All are bounded-queue + worker-pool
          producer-consumers — now you can build the engine, not just name it.</Good>
      </section>

      {/* bonus: the rest of java.util.concurrent you must know */}
      <section id="coordination">
        <div className="sec-label">Bonus deep-dive · Coordination &amp; modern async</div>
        <h2>🧰 Latches, semaphores, CompletableFuture — and virtual threads</h2>
        <p>
          BlockingQueue hands work BETWEEN threads. Three more <C>java.util.concurrent</C> tools
          coordinate threads AROUND work — and interviews treat all three as assumed knowledge:
        </p>
        <Code html={`<span class="cm">// ── CountDownLatch — "wait until N things have happened" (one-shot) ──</span>
CountDownLatch ready = <span class="kw">new</span> CountDownLatch(<span class="num">3</span>);   <span class="cm">// 3 services must start</span>
<span class="cm">// each service thread, when initialized:</span>
ready.countDown();                                <span class="cm">// −1, never blocks</span>
<span class="cm">// main thread:</span>
ready.await();                                    <span class="cm">// blocks until count hits 0</span>
<span class="cm">// classic uses: start-line for load tests, wait-for-startup, fan-out/fan-in</span>
<span class="cm">// one-shot: the count never resets — for reuse you want CyclicBarrier</span>

<span class="cm">// ── Semaphore — "at most N inside at once" (permits) ──</span>
Semaphore permits = <span class="kw">new</span> Semaphore(<span class="num">10</span>);          <span class="cm">// 10 DB connections max</span>
permits.acquire();                                <span class="cm">// take a permit (blocks if 0 left)</span>
<span class="kw">try</span> { useConnection(); }
<span class="kw">finally</span> { permits.release(); }                   <span class="cm">// ALWAYS give it back</span>
<span class="cm">// a Semaphore(1) is a lock; a Semaphore(N) is a BULKHEAD (Day 84 uses exactly this)</span>

<span class="cm">// ── CyclicBarrier — "everyone meets here, then we all continue" (reusable) ──</span>
CyclicBarrier round = <span class="kw">new</span> CyclicBarrier(<span class="num">4</span>, () -&gt; mergeResults());
<span class="cm">// each of 4 workers, at the end of a phase:</span>
round.await();    <span class="cm">// blocks until all 4 arrive → barrier action runs → all released</span>
<span class="cm">// unlike a latch it RESETS — perfect for iterative simulations, phased computation</span>`} />
        <h3 style={{ marginTop: 24 }}>CompletableFuture — producer–consumer without the queue ceremony</h3>
        <p>
          You saw <C>CompletableFuture</C> used in the resilience stack (Day 84) and the BFF composer
          (Day 98). Here is the model: it is a <strong>promise of a future value</strong> that you compose
          with callbacks instead of blocking:
        </p>
        <Code html={`<span class="cm">// fan out two independent calls IN PARALLEL, combine when both finish:</span>
CompletableFuture&lt;User&gt;  userF  = CompletableFuture.supplyAsync(() -&gt; users.fetch(id));
CompletableFuture&lt;Order&gt; orderF = CompletableFuture.supplyAsync(() -&gt; orders.fetch(id));

CompletableFuture&lt;Page&gt; page =
    userF.thenCombine(orderF, (user, order) -&gt; render(user, order));
<span class="cm">//        └ runs only when BOTH complete — no thread blocks while waiting</span>

<span class="cm">// the composition vocabulary:</span>
<span class="cm">//   thenApply(f)     transform the result           (map)</span>
<span class="cm">//   thenCompose(f)   chain another async call       (flatMap — avoids Future&lt;Future&gt;)</span>
<span class="cm">//   thenCombine(o,f) merge two independent futures</span>
<span class="cm">//   allOf(f1..fn)    wait for all  ·  anyOf: first one wins</span>
<span class="cm">//   exceptionally(f) the catch-block of the async world</span>

<span class="cm">// TRAP: supplyAsync with no executor runs on ForkJoinPool.commonPool() —</span>
<span class="cm">// shared by the whole JVM. Blocking calls there starve parallel streams and</span>
<span class="cm">// other futures. For I/O work, ALWAYS pass your own executor:</span>
CompletableFuture.supplyAsync(() -&gt; users.fetch(id), ioPool);`} />
        <h3 style={{ marginTop: 24 }}>Virtual threads (Java 21+) — what changed, what didn't</h3>
        <p>
          Since Java 21, <C>Thread.ofVirtual()</C> / <C>Executors.newVirtualThreadPerTaskExecutor()</C>
          give you threads so cheap you can have millions: when a virtual thread blocks on I/O, the JVM
          parks it and reuses the carrier OS thread. That rewrites one chapter of this day and leaves
          another untouched:
        </p>
        <ul>
          <li><strong>What changed:</strong> pool sizing for I/O-bound work. The whole "how many threads for
            blocking calls?" dance disappears — spawn one virtual thread per task and let them block cheaply.
            Simple blocking code becomes the right style again.</li>
          <li><strong>What didn't:</strong> backpressure. A million cheap threads all hammering one database
            is still a flood — you still need the bounded buffer (this day's core lesson) or a Semaphore to
            cap concurrent access. Virtual threads remove the THREAD bottleneck, not the RESOURCE bottleneck.</li>
          <li><strong>The gotcha to name:</strong> pinning — a virtual thread that blocks inside a
            <C> synchronized</C> block pins its carrier OS thread (fixed in Java 24, but the interview question
            survives). Prefer <C>ReentrantLock</C> around blocking calls in virtual-thread code.</li>
        </ul>
        <Note><strong>Interview framing:</strong> "for CPU-bound work, a fixed pool of ~core-count platform
          threads; for I/O-bound work on 21+, virtual threads per task plus a Semaphore for backpressure;
          below 21, a bounded ThreadPoolExecutor sized by Little's law." That one sentence covers forty
          years of threading advice.</Note>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>Unbounded queue.</strong> No backpressure — a fast producer grows memory until OOM.
          <C> Executors.newFixedThreadPool</C> hides an unbounded queue; build a bounded <C>ThreadPoolExecutor</C>.</Warn>
        <Warn><strong><C>if</C> instead of <C>while</C> around wait().</strong> Spurious wakeups / stolen
          conditions make the thread act on a false condition (take from an empty buffer). Always a while loop.</Warn>
        <Warn><strong><C>notify()</C> with mixed waiters.</strong> Can wake the wrong thread → lost wakeup →
          stall. Use <C>notifyAll()</C> (or explicit Locks with separate Conditions).</Warn>
        <Warn><strong>Busy-waiting (<C>while(empty) {'{}'}</C>).</strong> Burns a CPU core doing nothing. Block
          on <C>wait()</C> / <C>take()</C> instead.</Warn>
        <Warn><strong>Blocking tasks in a too-small pool with a bounded queue.</strong> If tasks block waiting on
          OTHER tasks that can\'t be scheduled (pool full, queue full), you deadlock the pool. Size pools for
          their workload; don\'t submit interdependent blocking tasks to a tiny pool.</Warn>
        <Warn><strong>Forgetting to shut down.</strong> Non-daemon pool threads keep the JVM alive; un-drained
          work is lost on a hard exit. Use a poison pill or <C>shutdown()</C> + <C>awaitTermination</C>.</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Pattern:</strong> producers → bounded buffer → consumers; decouples speeds, gives backpressure (full blocks producers, empty blocks consumers).</li>
          <li><strong>Bound the buffer</strong> — unbounded = OOM, no backpressure.</li>
          <li><strong>wait/notify (the hard way):</strong> hold the monitor; <C>wait()</C> in a <strong>while</strong> loop (spurious wakeups / stolen conditions); prefer <C>notifyAll()</C>.</li>
          <li><strong>BlockingQueue (the right way):</strong> <C>put()</C>/<C>take()</C> block correctly; ArrayBlockingQueue (bounded), LinkedBlockingQueue, SynchronousQueue (hand-off), PriorityBlockingQueue.</li>
          <li><strong>ExecutorService IS producer-consumer:</strong> submit = produce, workers = consume. Build a <C>ThreadPoolExecutor</C> with a BOUNDED queue + a rejection policy (AbortPolicy / CallerRunsPolicy for backpressure).</li>
          <li><strong>Submission order:</strong> core threads → queue → max threads → reject.</li>
          <li><strong>Graceful shutdown:</strong> poison pill or <C>shutdown()</C> + <C>awaitTermination</C> (+ handle interruption). Never <C>Thread.stop()</C>.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Implement a bounded blocking queue from scratch."'>
          <p>Two methods guarded by one lock: <C>put</C> does <C>while (size == cap) notFull.await();</C> add,
            <C> notEmpty.signal();</C> and <C>take</C> does <C>while (size == 0) notEmpty.await();</C> remove,
            <C> notFull.signal();</C>. With intrinsic locks it\'s <C>synchronized</C> + <C>wait()</C> in while
            loops + <C>notifyAll()</C>. With a <C>ReentrantLock</C> you get TWO Conditions (notFull/notEmpty) so
            you can signal precisely instead of waking everyone — that\'s the textbook win of explicit Locks. Key
            points to say: while-loops for the waits, signal the OPPOSITE condition, and bound the capacity.</p>
        </Reveal>
        <Reveal summary='Q: "How do you size a thread pool?"'>
          <p>By the workload. CPU-BOUND tasks: roughly the number of cores (+1) — more threads just thrash the
            CPU with context switches. I/O-BOUND tasks: more than the core count, because threads spend most of
            their time waiting (a rough model: threads ≈ cores × (1 + wait-time/compute-time)). Always measure.
            And separate pools for different workloads (don\'t let slow I/O tasks starve CPU tasks). The deeper
            point: an unbounded pool or queue is the real danger — bound them and pick a rejection policy so
            overload degrades gracefully instead of OOMing.</p>
        </Reveal>
        <Reveal summary='Q: "Executors.newFixedThreadPool / newCachedThreadPool — why are they discouraged for production?"'>
          <p><C>newFixedThreadPool</C> uses an UNBOUNDED <C>LinkedBlockingQueue</C> — under overload the queue
            grows until OOM, with no backpressure. <C>newCachedThreadPool</C> uses a <C>SynchronousQueue</C> with
            an effectively UNBOUNDED thread count — a flood spawns unlimited threads until the machine dies.
            Both trade a hidden unbounded resource for convenience. Production code should construct a
            <C> ThreadPoolExecutor</C> directly with an explicit bounded queue, sensible core/max sizes, and a
            chosen <C>RejectedExecutionHandler</C> — so saturation is handled deliberately.</p>
        </Reveal>
        <Reveal summary='Q: "What is a lost wakeup, and how do you avoid it?"'>
          <p>A lost wakeup is when a notification fires but no thread is waiting yet (or the wrong thread is
            woken), so a thread that later waits is never signaled and sleeps forever. Causes: checking the
            condition OUTSIDE the lock (you can miss a notify in the gap), using <C>notify()</C> when waiters
            wait on different conditions, or signaling before waiting. Avoid it by: always check-and-wait while
            holding the lock, use the while-loop guard, and prefer <C>notifyAll()</C> (or distinct
            <C> Condition</C>s). This is precisely why a battle-tested <C>BlockingQueue</C> is safer than rolling
            your own.</p>
        </Reveal>
        <Reveal summary='Q: "CallerRunsPolicy — how does it provide backpressure?"'>
          <p>When the pool is saturated (max threads + full queue), <C>CallerRunsPolicy</C> makes the SUBMITTING
            thread execute the rejected task itself, inline. While the submitter is busy running that task, it
            can\'t submit more — so the production rate automatically throttles to the consumption rate. It\'s
            elegant self-regulating backpressure without throwing or dropping: the producer is forced to slow
            down by being conscripted as a temporary worker. The trade-off: the submitting thread (e.g. a
            request handler) stalls on that task, so it suits batch/ingest pipelines more than latency-critical
            request paths.</p>
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
        <strong>Day 63 complete?</strong> Homework: build it twice. ① Hand-roll a <C>BoundedBuffer&lt;T&gt;</C>
        with <C>synchronized</C> + <C>wait()</C> (in while loops) + <C>notifyAll()</C>; run 2 producers + 3
        consumers and confirm no item is lost or double-taken. ② Throw it away and redo it with an
        <C> ArrayBlockingQueue</C> — note how much disappears. ③ Build a <C>ThreadPoolExecutor</C> with core=2,
        a bounded queue=4, max=4, and <C>CallerRunsPolicy</C>; flood it and watch backpressure. Stretch: add a
        poison-pill shutdown.
        <br /><br />
        Next: <strong>Day 64 — Optimistic vs Pessimistic Locking</strong>: two philosophies for the atomic
        claim — version/CAS retry vs lock-and-hold — and exactly when to use each.
      </div>
    </div>
  )
}
