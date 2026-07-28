import { useState, useEffect } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: token bucket ============ */
const CAP = 5

function TokenBucket() {
  const [tokens, setTokens] = useState(CAP)
  const [log, setLog] = useState('Bucket full (' + CAP + ' tokens). Refills 1 token/sec. Spend a burst, then watch it throttle.')
  const [allowed, setAllowed] = useState(0)
  const [rejected, setRejected] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTokens((t) => Math.min(CAP, t + 1)), 1000)  // refill 1/sec
    return () => clearInterval(id)
  }, [])

  function send() {
    setTokens((t) => {
      if (t >= 1) { setAllowed((a) => a + 1); setLog('✅ request ALLOWED — took 1 token (' + (t - 1) + '/' + CAP + ' left).'); return t - 1 }
      setRejected((r) => r + 1); setLog('🚫 request REJECTED (429) — bucket empty. Wait ~1s for a refill.'); return t
    })
  }
  function reset() { setTokens(CAP); setAllowed(0); setRejected(0); setLog('Bucket full (' + CAP + ' tokens).') }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · token bucket — capacity {CAP}, refill 1/sec; allows bursts, then throttles to the rate</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', width: 60 }}>bucket →</span>
        {[...Array(CAP)].map((_, i) => (
          <div key={i} style={{
            width: 34, height: 38, borderRadius: 6, border: '1.5px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            background: i < tokens ? '#EAF7EF' : '#F4F3EE',
          }}>{i < tokens ? '🪙' : '·'}</div>
        ))}
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, marginLeft: 6 }}>{tokens}/{CAP}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={send}>📨 send request</button>
        <button className="ghost act" onClick={reset}>reset</button>
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono' }}>allowed {allowed} · rejected {rejected}</span>
      </div>
      <div className="statbar" style={{ display: 'block' }}><span style={{ fontSize: 12.5 }}>{log}</span></div>
      <Good style={{ marginTop: 10 }}><span style={{ fontSize: 12.5 }}>Click fast 6+ times: the first {CAP} pass (a burst), then you\'re rejected until tokens refill. Wait a few seconds and you can burst again. That\'s the token bucket: bursts up to capacity, long-run rate = the refill rate.</span></Good>
    </div>
  )
}

/* ============ Interactive 2: the fixed-window boundary burst ============ */
// 10 requests: 5 near the end of window 1 (t≈55s), 5 near the start of window 2 (t≈62s). Limit 5 / 60s.
const REQS = [
  { t: 52, w: 1 }, { t: 54, w: 1 }, { t: 56, w: 1 }, { t: 58, w: 1 }, { t: 59, w: 1 },
  { t: 61, w: 2 }, { t: 62, w: 2 }, { t: 63, w: 2 }, { t: 64, w: 2 }, { t: 65, w: 2 },
]
const LIMIT = 5

function BoundaryBurst() {
  const [mode, setMode] = useState('fixed')
  // compute allowed/rejected per algorithm
  const marks = []
  if (mode === 'fixed') {
    let c1 = 0, c2 = 0
    for (const r of REQS) {
      if (r.w === 1) { c1++; marks.push(c1 <= LIMIT) } else { c2++; marks.push(c2 <= LIMIT) }
    }
  } else {
    // sliding window log: allowed if count of allowed reqs within [t-60, t] < LIMIT
    const allowedTimes = []
    for (const r of REQS) {
      const inWindow = allowedTimes.filter((t) => t > r.t - 60).length
      if (inWindow < LIMIT) { allowedTimes.push(r.t); marks.push(true) } else marks.push(false)
    }
  }
  const allowedCount = marks.filter(Boolean).length

  return (
    <div className="panel">
      <div className="ptitle">Live demo · 10 requests across a window boundary (limit {LIMIT}/60s) — the fixed-window flaw</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        <button className={mode === 'fixed' ? 'on' : ''} onClick={() => setMode('fixed')}>Fixed Window Counter</button>
        <button className={mode === 'sliding' ? 'on' : ''} onClick={() => setMode('sliding')}>Sliding Window Log</button>
      </div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', marginBottom: 6, flexWrap: 'wrap' }}>
        {REQS.map((r, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#fff',
              background: marks[i] ? 'var(--green)' : 'var(--red)',
            }}>{marks[i] ? '✓' : '✗'}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 8.5, color: '#7c8aa5' }}>{r.t}s</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10.5, color: '#7c8aa5', marginBottom: 10 }}>
        ← window 1 (0–60s) ─┊─ window 2 (60–120s) →  (boundary at 60s)
      </div>
      <div className="statbar" style={{ display: 'block', background: mode === 'fixed' ? '#FDECEC' : '#EAF7EF' }}>
        <span style={{ fontSize: 12.5 }}>
          {mode === 'fixed'
            ? `💥 FIXED WINDOW: ${allowedCount}/10 allowed. Both windows count ≤ ${LIMIT} individually — but 10 requests landed in ~13 seconds across the boundary. The counter reset at 60s, so a client gets 2× the limit in a short span. This is the boundary-burst problem.`
            : `✅ SLIDING WINDOW: ${allowedCount}/10 allowed. It counts the last 60 seconds at every request, so the 2nd batch still "sees" the 1st batch and the excess is rejected — no boundary burst.`}
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: pick the algorithm ============ */
const ALGS = [
  { q: 'Allow short bursts (a user clicking quickly) but cap the long-run average rate. Smooth and flexible.', o: ['Token Bucket', 'Leaky Bucket', 'Fixed Window Counter'], a: 0,
    why: 'Token bucket: tokens accrue up to a capacity (the burst budget) and each request spends one; long-run rate = refill rate. Allows bursts up to capacity, then throttles. The most common general-purpose limiter.' },
  { q: 'Enforce a STRICTLY CONSTANT outflow — process exactly N/sec, no bursts (e.g. feeding a fragile downstream).', o: ['Token Bucket', 'Leaky Bucket', 'Sliding Window Log'], a: 1,
    why: 'Leaky bucket: requests enter a queue and drain at a FIXED rate, like water through a hole. It smooths bursty input into a steady stream (and drops/queues overflow). Token bucket permits bursts; leaky bucket forbids them.' },
  { q: 'Dead-simple, lowest memory, and an occasional 2× boundary burst is acceptable.', o: ['Sliding Window Log', 'Fixed Window Counter', 'Token Bucket'], a: 1,
    why: 'Fixed window counter: one counter per window, reset at the boundary — trivial and O(1) memory. Its only flaw is the boundary burst (2× the limit across an edge). Fine when approximate is good enough.' },
  { q: 'Accurate rate limiting at scale with LOW memory — the common production default.', o: ['Sliding Window Counter', 'Sliding Window Log', 'Fixed Window'], a: 0,
    why: 'Sliding window counter: blend the current window\'s count with a weighted fraction of the previous window. It approximates a true sliding window without storing every timestamp — accurate enough, O(1) memory. The usual production pick.' },
  { q: 'Perfectly exact rate limiting; memory is not a concern (low traffic, audit-grade).', o: ['Fixed Window', 'Sliding Window Log', 'Token Bucket'], a: 1,
    why: 'Sliding window log: store the timestamp of every request and count those within [now − window, now]. Perfectly accurate, but O(requests) memory — only viable at low volume or when exactness matters more than space.' },
  { q: 'The limiter is hit by every request thread at once. To be correct it must be…', o: ['Fast', 'Thread-safe: refill + take as ONE atomic step (synchronized or a CAS loop) — it is shared mutable state (Week 13)', 'Logged'], a: 1,
    why: 'A rate limiter IS shared mutable state under massive concurrency. "Check tokens, then take one" is check-then-act — it must be atomic (a lock around refill+take, or a CAS loop on (tokens, lastRefill)) or it leaks allowances under load.' },
]

function AlgChooser() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= ALGS.length
  const cur = ALGS[idx]
  function pick(i) { if (picked !== null) return; setPicked(i); if (i === cur.a) setScore((s) => s + 1) }
  return (
    <div className="panel">
      <div className="ptitle">Live demo · pick the right limiting algorithm for each requirement</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎯 Score: <b>{score} / {ALGS.length}</b> — token bucket (bursts + average), leaky bucket (constant outflow), fixed window (cheap, boundary burst), sliding window counter (accurate, cheap), sliding window log (exact, memory-heavy). And always: thread-safe.</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 10 }}>🚦 <span>requirement {idx + 1} of {ALGS.length} · score {score}</span></div>
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
  { q: 'What is a rate limiter for, and what is its core API?',
    o: ['To CAP requests per client per time window (protect a service from overload/abuse, enforce quotas/tiers) — core API: allow(clientId) → true/false, returning 429 (Too Many Requests) when over', 'To balance load across servers', 'To speed up requests', 'To cache responses'], a: 0,
    e: 'A rate limiter answers "can this client make another request right now?" per a policy (e.g. 100/min). Over the limit → reject (429), throttle, or shed. It protects the service and enforces fair use / paid tiers.',
    w: { 1: 'That\'s a load balancer.', 2: 'It throttles, not speeds up.', 3: 'Caching is a different concern.' },
    r: { id: 's1', label: 'Section 1 — the problem' } },
  { q: 'The fixed-window counter\'s notorious flaw?',
    o: ['Too much memory', 'It\'s too slow', 'The BOUNDARY BURST: the counter resets at the window edge, so a client can send the full limit just before the boundary AND just after — up to 2× the limit in a short span', 'It can\'t reset'], a: 2,
    e: 'Fixed window is O(1) and trivial, but because counts reset at the boundary, 5 requests at 0:59 and 5 at 1:01 are "within limit" for each window yet 10 requests in ~2 seconds. Sliding windows fix this.',
    w: { 0: 'It\'s the most memory-efficient.', 1: 'It\'s O(1) and fast.', 3: 'Resetting at the boundary IS the flaw.' },
    r: { id: 's3', label: 'Section 3 — fixed window' } },
  { q: 'How does the token bucket algorithm work?',
    o: ['It queues requests and drains at a fixed rate', 'It stores every timestamp', 'It counts requests per fixed minute', 'Tokens refill at a steady rate up to a CAPACITY; each request consumes one token; if the bucket is empty the request is rejected — so it ALLOWS bursts up to capacity but the long-run rate equals the refill rate'], a: 3,
    e: 'The bucket accumulates tokens (the burst budget) up to its capacity and refills continuously. A request needs a token. Bursts are fine until the bucket drains; then you\'re throttled to the refill rate. Flexible and widely used.',
    w: { 0: 'That\'s leaky bucket.', 1: 'That\'s sliding window log.', 2: 'That\'s fixed window.' },
    r: { id: 's5', label: 'Section 5 — token bucket' } },
  { q: 'Token bucket vs leaky bucket?',
    o: ['Leaky bucket allows bursts', 'Identical', 'Token bucket ALLOWS bursts (up to capacity) and caps the average; leaky bucket enforces a CONSTANT outflow (requests drain at a fixed rate, no bursts) — choose by whether bursts are acceptable', 'Token bucket has no capacity'], a: 2,
    e: 'Both smooth traffic but differently: token bucket lets a client spend a saved-up burst then throttles; leaky bucket releases at a strict steady rate regardless of input bursts (good for protecting a fragile downstream).',
    w: { 0: 'Leaky bucket forbids bursts.', 1: 'They differ on bursts.', 3: 'Token bucket\'s capacity IS the burst budget.' },
    r: { id: 's5', label: 'Section 5 — token vs leaky' } },
  { q: 'The sliding window COUNTER (vs the log) is popular in production because…',
    o: ['It allows unlimited bursts', 'It approximates a true sliding window by weight-blending the current and previous fixed-window counts — accurate ENOUGH with O(1) memory (no per-request timestamps), avoiding both the boundary burst and the log\'s memory cost', 'It is perfectly exact', 'It uses no counters'], a: 1,
    e: 'The log is exact but stores every timestamp (O(requests)). The counter blends two fixed-window counts with a time weight — smooth, no boundary burst, and tiny memory. The common production default.',
    w: { 0: 'It limits, not unlimits.', 2: 'It\'s an approximation (the log is exact).', 3: 'It uses two counters.' },
    r: { id: 's4', label: 'Section 4 — sliding window' } },
  { q: 'Why is thread-safety central to a rate limiter (the Week-13 payoff)?',
    o: ['It isn\'t', 'It is SHARED MUTABLE STATE hit by every request thread; "check tokens, then take one" is check-then-act — without atomicity (a lock around refill+take, or a CAS loop) concurrent requests over-admit past the limit', 'Single-threaded servers exist', 'Only the API matters'], a: 1,
    e: 'Every Week-13 hazard applies: many threads read-modify-write the same counter/bucket. Refill-and-take must be one atomic step (synchronized, or CAS on the bucket state) or the limiter leaks allowances under exactly the load it exists to handle.',
    w: { 0: 'It\'s the crux at scale.', 2: 'Real services are highly concurrent.', 3: 'Correctness under concurrency matters as much as the API.' },
    r: { id: 's8', label: 'Section 8 — thread-safety' } },
  { q: 'Across a fleet of servers, a single global limit per client needs…',
    o: ['A SHARED store (e.g. Redis) holding the counter/bucket so all nodes enforce ONE global limit atomically — per-node limiting alone lets the real total be N× the limit; Redis does it with INCR+expiry or a Lua/token-bucket script', 'Each node limiting independently', 'More threads', 'Nothing special'], a: 0,
    e: 'Per-node limiters multiply: 10 nodes each allowing 100/min = 1000/min globally. A shared, atomic store (Redis counters / sorted sets / a Lua-scripted token bucket) enforces one global limit. Single-node design is the LLD; distributed is the scale flag.',
    w: { 1: 'Independent nodes give N× the intended limit.', 2: 'Threads don\'t span machines.', 3: 'It requires coordination.' },
    r: { id: 's9', label: 'Section 9 — distributed' } },
  { q: 'Different algorithms behind one interface, swappable per client tier (free vs paid) — that\'s…',
    o: ['Hardcoded ifs', 'Inheritance', 'A Singleton', 'A Strategy: a RateLimiter interface with TokenBucket/SlidingWindow implementations, configured per client — a new algorithm or tier is a new class / config, not an edit (Day 31)'], a: 3,
    e: 'Limiting algorithm and per-tier limits vary → Strategy. allow(clientId) dispatches to the client\'s configured limiter; free tier gets a tight bucket, enterprise a generous one — all behind one interface.',
    w: { 0: 'The growing-if smell it replaces.', 1: 'Composition/Strategy, not a type hierarchy.', 2: 'Oneness isn\'t the point.' },
    r: { id: 's2', label: 'Section 2 — the design' } },
]

/* ============ The page ============ */
export default function Day65() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 13 · Day 65 · Advanced LLD · Concurrency</div>
        <h1>Rate Limiter:<br />Capping the Firehose, Thread-Safely</h1>
        <p>The canonical concurrency design problem — and the perfect finale to Week 13. A rate limiter caps how
           many requests a client may make per window; it\'s a small Strategy family of algorithms (token bucket,
           sliding window…) wrapped around a single hard requirement: it must be thread-safe under exactly the
           load it exists to survive. Click everything.</p>
        <div className="chips">
          {['rate limiter', 'token bucket', 'leaky bucket', 'fixed vs sliding window', 'thread-safe', 'distributed (Redis)'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The problem</h2>
        <p>A rate limiter answers one question, billions of times a day: <em>may this client make another request
          right now?</em> It exists to protect a service from overload and abuse, and to enforce quotas / paid
          tiers:</p>
        <Code html={`  THE RATE LIMITER

  allow(clientId) → true (proceed)  |  false (reject → HTTP 429 Too Many Requests)

  WHY:
   · protect the service from overload (a traffic spike, a runaway client)
   · stop abuse (brute-force, scraping, DoS)
   · enforce fairness & paid tiers (free = 100/min, enterprise = 10,000/min)

  KEYED BY: client id / API key / IP / user — usually at the gateway/middleware,
  BEFORE the request reaches your expensive logic.`} />
        <Note><strong>Two halves to get right:</strong> the ALGORITHM (how you count and decide — token bucket,
          sliding window, etc.) and the CONCURRENCY (it\'s shared mutable state hit by every request thread, so
          it must be atomic — the whole of Week 13 cashing in). Most candidates nail one and forget the other.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The design: one interface, swappable algorithms &amp; tiers</h2>
        <p>The algorithm and the per-client limit both vary — so it\'s a Strategy (Day 31):</p>
        <Code html={`<span class="kw">public interface</span> RateLimiter {
    <span class="kw">boolean</span> allow(String clientId);     <span class="cm">// true = proceed, false = reject (429)</span>
}

<span class="kw">class</span> TokenBucketLimiter <span class="kw">implements</span> RateLimiter { … }   <span class="cm">// per-client buckets</span>
<span class="kw">class</span> SlidingWindowLimiter <span class="kw">implements</span> RateLimiter { … }

<span class="cm">// per-client config (tiers): free = (100/min), enterprise = (10_000/min)</span>
<span class="cm">// allow(clientId) looks up THIS client's limiter/config and decides</span>

<span class="cm">// over the limit → reject with context the client can act on:</span>
<span class="cm">//   HTTP 429, header: Retry-After: 30   (when to try again)</span>`} />
        <Good><strong>Responses to "over the limit":</strong> REJECT (429 + <C>Retry-After</C>) is the default;
          THROTTLE/queue (delay rather than drop — leaky-bucket style); or SHED (drop low-priority traffic
          first). New algorithm or new tier = a new class / config line, never an edit — the OCP payoff.</Good>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Fixed window counter — simple, but the boundary burst</h2>
        <p>The simplest algorithm: one counter per fixed window (per minute), reset at the boundary. O(1) memory
          — but it has a famous flaw:</p>
        <Code html={`  FIXED WINDOW COUNTER (limit = 5 / minute)

  count[clientId, currentMinute]++   →  reject if > 5;  reset at each minute boundary

  THE BOUNDARY BURST:
    0:59  ▮▮▮▮▮  5 requests  → window [0:00–1:00] count = 5 ✓ (allowed)
    1:01  ▮▮▮▮▮  5 requests  → window [1:00–2:00] count = 5 ✓ (allowed)
    ────────────────────────────────────────────────────
    10 requests in ~2 seconds — DOUBLE the intended rate, both windows "legal".`} />
        <Note><strong>The trade:</strong> fixed window is trivial and O(1), and the 2× boundary burst is often
          acceptable for coarse protection. When it isn\'t, you slide the window (next section) — at some memory
          or accuracy cost.</Note>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>💥 Play: the boundary burst</h2>
        <p>Ten requests straddling a window edge. Toggle the algorithm and watch the fixed window wave through a
          2× burst that the sliding window catches:</p>
        <BoundaryBurst />
        <Good><strong>What you should notice:</strong> ① Fixed window allows all 10 — each window\'s count is ≤ 5,
          but 10 landed in ~13 seconds. ② Sliding window counts the last 60s at every request, so the second
          batch still "sees" the first and the excess is rejected. ③ Accuracy costs something — the sliding LOG
          stores every timestamp (memory); the sliding COUNTER approximates it cheaply (Section 5).</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Sliding window, token bucket &amp; leaky bucket</h2>
        <p>The rest of the family. Each makes a different trade between burst-tolerance, accuracy, and memory:</p>
        <Code html={`  SLIDING WINDOW LOG     store every request timestamp; count those in [now−W, now]
                         ✓ exact, no boundary burst   ✗ O(requests) memory

  SLIDING WINDOW COUNTER weighted blend of current + previous fixed-window counts
                         ✓ accurate enough, O(1) memory, no boundary burst   ← prod default

  TOKEN BUCKET           tokens refill at rate R up to capacity C; each request takes 1
                         ✓ ALLOWS BURSTS up to C, long-run rate = R, flexible   ← most common
                         allow(): refill by elapsed × R (cap at C); if tokens ≥ 1, take 1 → true

  LEAKY BUCKET           requests enter a queue, drain at a FIXED rate (like water)
                         ✓ strictly constant outflow, NO bursts   (protects a fragile downstream)`} />
        <Code html={`<span class="cm">// token bucket — the core of allow():</span>
<span class="kw">long</span> now = clock.now();
<span class="kw">double</span> refill = (now - lastRefill) * ratePerMs;
tokens = Math.min(capacity, tokens + refill);   <span class="cm">// lazily refill by elapsed time</span>
lastRefill = now;
<span class="kw">if</span> (tokens &gt;= <span class="num">1</span>) { tokens -= <span class="num">1</span>; <span class="kw">return true</span>; }  <span class="cm">// take a token</span>
<span class="kw">return false</span>;                                <span class="cm">// empty → reject (429)</span>`} />
        <Note><strong>Token bucket vs leaky bucket</strong> is the most-asked distinction: token bucket
          <em> allows</em> bursts (spend the accumulated tokens) and caps the average; leaky bucket
          <em> forbids</em> them (constant drain). Pick token bucket for general APIs; leaky bucket when the
          downstream must receive a steady, burst-free stream.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🪙 Play: the token bucket</h2>
        <p>Capacity {CAP}, refilling 1/sec. Spend a burst, get throttled, then watch it recover:</p>
        <TokenBucket />
        <Good><strong>What you should notice:</strong> ① You can fire a BURST of up to {CAP} immediately (the
          saved-up tokens). ② Once empty you\'re rejected (429) until tokens refill. ③ Over time your sustained
          rate can\'t exceed the refill rate — bursts up to capacity, average = the rate. That dual behavior is
          why token bucket is the default general-purpose limiter.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🚦 Play: pick the algorithm</h2>
        <p>Match each requirement to the right algorithm (including the thread-safety one):</p>
        <AlgChooser />
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Thread-safety — Week 13, cashed in</h2>
        <p>This is what makes a rate limiter a <em>concurrency</em> problem, not just an algorithm. It\'s shared
          mutable state hit by every request thread at once — and "check tokens, then take one" is check-then-act
          (Day 61). It MUST be atomic:</p>
        <Code html={`<span class="cm">// ❌ racy: two threads both see tokens == 1 and both take → over-admit (Day 61)</span>
<span class="kw">if</span> (tokens &gt;= <span class="num">1</span>) tokens--;

<span class="cm">// ✅ option A — a lock around refill + take (per client, fine-grained):</span>
<span class="kw">synchronized</span> (bucketFor(clientId)) {
    refill(); <span class="kw">if</span> (tokens &gt;= <span class="num">1</span>) { tokens--; <span class="kw">return true</span>; } <span class="kw">return false</span>;
}

<span class="cm">// ✅ option B — lock-free CAS loop on the bucket state (Day 62):</span>
<span class="kw">while</span> (<span class="kw">true</span>) {
    State cur = state.get();                       <span class="cm">// (tokens, lastRefill) as one immutable value</span>
    State next = cur.refill(now);                  <span class="cm">// compute refilled state off to the side</span>
    <span class="kw">if</span> (next.tokens &lt; <span class="num">1</span>) <span class="kw">return false</span>;
    <span class="kw">if</span> (state.compareAndSet(cur, next.takeOne())) <span class="kw">return true</span>;  <span class="cm">// retry if a racer won</span>
}`} />
        <Warn><strong>Per-client locking, not one global lock.</strong> A single lock for ALL clients serializes
          every request through one bottleneck. Lock (or CAS) per client — different clients\' buckets never
          contend (lock striping; a <C>ConcurrentHashMap&lt;clientId, Bucket&gt;</C>). Use an injected
          <C> Clock</C> so the time-based refill is testable (Day 47). This is every Week-13 lesson — atomic
          claim, CAS, lock granularity, injected time — in one small class.</Warn>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Algorithm comparison + going distributed</h2>
        <table className="matrix">
          <thead><tr><th>algorithm</th><th>bursts?</th><th>memory</th><th>note</th></tr></thead>
          <tbody>
            <tr><td>Fixed window counter</td><td>boundary burst (2×)</td><td>O(1)</td><td>simplest; coarse</td></tr>
            <tr><td>Sliding window log</td><td>none (exact)</td><td>O(requests)</td><td>exact but memory-heavy</td></tr>
            <tr><td>Sliding window counter</td><td>none (approx)</td><td>O(1)</td><td>accurate + cheap — prod default</td></tr>
            <tr><td>Token bucket</td><td>allows bursts ≤ capacity</td><td>O(1)</td><td>flexible; most common general-purpose</td></tr>
            <tr><td>Leaky bucket</td><td>none (constant outflow)</td><td>O(queue)</td><td>smooths to a steady rate</td></tr>
          </tbody>
        </table>
        <Warn><strong>The distributed flag:</strong> on a fleet, per-node limiters MULTIPLY — 10 nodes each
          allowing 100/min = 1000/min globally. For ONE global limit, keep the counter/bucket in a shared atomic
          store: Redis <C>INCR</C> + <C>EXPIRE</C> (fixed window), a sorted set of timestamps (sliding log), or a
          Lua-scripted token bucket (atomic refill+take server-side). Trade-offs: a network hop per request,
          and the store becomes a hot dependency. Single-node is the LLD; "and I\'d centralize state in Redis for
          a global limit" is the scaling sentence.</Warn>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>Ignoring thread-safety.</strong> The #1 miss — a racy check-then-act on the counter
          over-admits under load (the exact traffic it\'s meant to limit). Make refill+take atomic.</Warn>
        <Warn><strong>One global lock for all clients.</strong> Serializes every request through a single
          bottleneck. Lock/CAS per client (a ConcurrentHashMap of buckets).</Warn>
        <Warn><strong>Fixed window where bursts matter.</strong> The 2× boundary burst can defeat the purpose.
          Use a sliding window (counter) when accuracy matters.</Warn>
        <Warn><strong>Sliding window LOG at scale.</strong> Storing every timestamp is O(requests) memory — fine
          at low volume, a memory bomb at high. Use the sliding window COUNTER.</Warn>
        <Warn><strong>Per-node limiting assumed to be global.</strong> N nodes = N× the limit. Centralize state
          (Redis) for a true global cap.</Warn>
        <Warn><strong>System time / unbounded client maps.</strong> Use an injected <C>Clock</C> (testable; clock
          skew across nodes bites distributed limiters), and EVICT idle clients\' buckets (a per-client map grows
          unbounded — give buckets a TTL).</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Purpose/API:</strong> cap requests per client/window; <C>allow(clientId) → bool</C>; over → 429 + <C>Retry-After</C> (or throttle / shed). Keyed by client/IP/API-key at the gateway.</li>
          <li><strong>Design:</strong> a <C>RateLimiter</C> Strategy with per-client config (tiers); new algorithm/tier = new class/config.</li>
          <li><strong>Fixed window:</strong> O(1), simplest, but 2× BOUNDARY BURST.</li>
          <li><strong>Sliding window:</strong> log = exact but O(requests); counter = approximate, O(1), no burst — the production default.</li>
          <li><strong>Token bucket:</strong> refill to capacity, take a token — ALLOWS bursts ≤ capacity, average = rate (most common). <strong>Leaky bucket:</strong> constant outflow, no bursts.</li>
          <li><strong>Thread-safety (the crux):</strong> shared mutable state — make refill+take atomic (per-client lock or CAS loop); never one global lock; inject the Clock.</li>
          <li><strong>Distributed:</strong> per-node limiters multiply → centralize the counter/bucket in Redis (INCR+EXPIRE / sorted set / Lua token bucket) for a global limit.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Design a distributed rate limiter — what changes from the single-node one?"'>
          <p>The algorithm is identical; the STATE must be shared and updated atomically across nodes. Move the
            counter/bucket into Redis: fixed window = <C>INCR key</C> + <C>EXPIRE</C> (key = client:minute);
            sliding log = a sorted set of timestamps with <C>ZREMRANGEBYSCORE</C> to trim; token bucket = a Lua
            script that refills-and-takes atomically server-side (so the read-modify-write is one round trip and
            one atomic op). Trade-offs to name: a network hop per request (latency + Redis as a hot, must-be-HA
            dependency), and clock skew between nodes (prefer the store\'s time). Optimization: a local
            per-node limiter as a first cheap filter, with Redis as the authoritative global check.</p>
        </Reveal>
        <Reveal summary='Q: "Token bucket vs sliding window counter — when each?"'>
          <p>Token bucket when you want to ALLOW BURSTS up to a budget while capping the average (most user-facing
            APIs — a user clicking a few times fast should be fine), and when you want simple smoothing with a
            capacity knob. Sliding window counter when you need an accurate REQUESTS-PER-WINDOW cap without burst
            allowance and with minimal memory (e.g. a strict "1000 calls/hour" quota). They overlap a lot; the
            burst question usually decides — "should saved-up quota let them spike?" Yes → token bucket; no →
            sliding window.</p>
        </Reveal>
        <Reveal summary='Q: "What HTTP response and headers does a limited request get?"'>
          <p><C>429 Too Many Requests</C>, with a <C>Retry-After</C> header telling the client how long to wait
            before retrying (seconds or an HTTP date). Good limiters also return informational headers like
            <C> X-RateLimit-Limit</C>, <C>X-RateLimit-Remaining</C>, and <C>X-RateLimit-Reset</C> so clients can
            self-throttle proactively instead of hammering until rejected. The design point: make the limit
            OBSERVABLE to clients — a well-behaved client backs off, which protects you more than the rejection
            itself.</p>
        </Reveal>
        <Reveal summary='Q: "Where do you put the rate limiter in the architecture?"'>
          <p>As early as possible — at the API gateway / load balancer / middleware, BEFORE the request reaches
            expensive application logic or the database, so rejected requests cost almost nothing. It\'s usually
            the FIRST link in the request pipeline (recall Day 50/57: chain order = reject cheaply before doing
            expensive work). For tiered limits or per-endpoint rules it may also live in the service layer. The
            principle: limit at the outermost layer that has the identity (client/API key) you key on.</p>
        </Reveal>
        <Reveal summary='Q: "The limiter itself becomes a bottleneck under huge load. Fixes?"'>
          <p>Several. Shard state per client (lock striping / a ConcurrentHashMap of buckets) so different clients
            never contend. Prefer lock-free CAS over locks for the hot path. In a distributed setup, do a cheap
            LOCAL pre-check per node and only hit the shared store when near the limit, and batch/pipeline Redis
            calls. Accept slight inaccuracy for throughput (approximate limiting is usually fine — being off by a
            few requests rarely matters). And evict idle client buckets (TTL) so memory stays bounded. The meta-
            point: a rate limiter must be cheaper than the work it protects, or it defeats its own purpose.</p>
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
        <strong>Day 65 complete?</strong> Homework: build a thread-safe <C>TokenBucketLimiter</C> implementing
        <C> RateLimiter.allow(clientId)</C> — a <C>ConcurrentHashMap&lt;clientId, Bucket&gt;</C>, lazy
        time-based refill using an injected <C>Clock</C>, and refill+take made atomic (start with a per-bucket
        <C> synchronized</C>, then try a CAS loop on an immutable bucket state). Prove it: hammer it from many
        threads and confirm it NEVER admits more than capacity + rate×elapsed. Then write a
        <C> FixedWindowLimiter</C> and demonstrate its boundary burst. Stretch: sketch the Redis Lua version for
        a global limit.
        <br /><br />
        Next: <strong>Day 66 — Week 14 begins: Chess</strong> — the richest board-game design: piece movement
        as strategies, board state, check/checkmate, and move validation done cleanly.
      </div>
    </div>
  )
}
