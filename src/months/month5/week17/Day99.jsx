import { useState, useEffect, useRef } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ─────────────────────────────────────────────
   DEMO 1 — 45-minute interview timer drill
───────────────────────────────────────────── */
const STEPS = [
  {
    name: 'Step 1 · Clarify Requirements',
    minutes: 5,
    color: '#2D5BFF',
    checklist: [
      'Who are the users? (consumers, businesses, internal team?)',
      'How many DAU? What peak QPS do you expect?',
      'Read-heavy or write-heavy? (ratio matters for caching + replicas)',
      'Which features are in scope? (do NOT design everything)',
      'Consistency need: strong or eventual?',
      'Latency SLA: real-time (<100 ms) or batch OK?',
      'Global or single-region?',
    ],
    reveal: [
      '"Design Twitter" → ask: mobile or web? just posting or also timeline? global or domestic? how many DAU?',
      '"Design a parking lot" → ask: how many floors? online booking or walk-in? payments? multiple entry gates?',
      'Never start drawing until you have at least 3–4 answered questions.',
    ],
  },
  {
    name: 'Step 2 · Define Scope',
    minutes: 5,
    color: '#059669',
    checklist: [
      'State WHAT you will design (2–3 core features only)',
      'State what you will NOT design (ads, DMs, notifications — wave your hand)',
      'Write down the scale numbers: DAU, QPS read, QPS write, storage/day',
      'Derive the 10:1 or 100:1 read:write ratio — it drives caching choices',
      'State your consistency choice and justify it in one sentence',
    ],
    reveal: [
      '"I will focus on: posting tweets and home timeline. I will skip: ads, DMs, notifications."',
      '"100M DAU, ~1000 QPS write, ~10,000 QPS read, ~100 GB/day storage."',
      'Scoping prevents the interviewer saying "you forgot X" at minute 35.',
    ],
  },
  {
    name: 'Step 3 · High-Level Design',
    minutes: 10,
    color: '#7C3AED',
    checklist: [
      'Draw the standard boxes: Client → CDN → API Gateway → Services → Cache → DB',
      'Name each service and its one job (User Service, Tweet Service, Timeline Service)',
      'Show the happy-path data flow for the primary use case (end-to-end)',
      'Choose SQL vs NoSQL and justify it (one sentence)',
      'Show where you would put a message queue (Kafka) if writes are heavy',
      'Label read vs write paths if they differ',
    ],
    reveal: [
      'Common mistake: spending all 45 minutes here. Boxes + arrows take 10 min max.',
      'Naming services shows you think in bounded contexts (from DDD).',
      'SQL = strong schema, joins, ACID. NoSQL = flexible schema, horizontal scale, eventual.',
    ],
  },
  {
    name: 'Step 4 · Deep Dive',
    minutes: 10,
    color: '#DC2626',
    checklist: [
      'Identify the 1–2 hardest sub-problems (say them out loud)',
      'For timeline: fan-out on write vs fan-out on read trade-off',
      'For booking: compare-and-set for double-booking prevention',
      'For search: trie vs inverted index trade-off',
      'For real-time: WebSocket vs SSE vs polling',
      'Show the data model for the hardest entity (fields, types, indexes)',
    ],
    reveal: [
      'The interviewer often guides: "How would you handle the hot celebrity problem?" — go there.',
      'Fan-out on write: precompute timeline at write time. Fast reads, expensive writes.',
      'Fan-out on read: compute timeline at read time. Slow reads, cheap writes. Hybrid for celebs.',
    ],
  },
  {
    name: 'Step 5 · Scale & Bottlenecks',
    minutes: 10,
    color: '#D97706',
    checklist: [
      'Ask: "What breaks at 10x current load?" — walk through each layer',
      'DB: add read replicas, then sharding by user_id or entity_id',
      'Cache: Redis cluster, TTL policy, cache-aside vs write-through',
      'Services: horizontal scaling behind load balancer, stateless design',
      'Async: what can be done async via Kafka to reduce synchronous latency?',
      'CDN: what is cacheable? Static assets always. Dynamic with TTL or purge.',
    ],
    reveal: [
      'Sharding key choice is critical: shard by user_id to keep user data together.',
      'Never shard by time — hotspot on the latest shard.',
      'Read replica lag matters: accept stale reads or pay the primary for strong reads.',
    ],
  },
  {
    name: 'Step 6 · Edge Cases & Failures',
    minutes: 5,
    color: '#0891B2',
    checklist: [
      'What if a service crashes mid-request? (idempotency key + retry)',
      'What if the DB is slow? (circuit breaker, fallback to cache)',
      'What if a Kafka message is processed twice? (idempotent consumer)',
      'What if the cache is cold after a deploy? (cache warming strategy)',
      'Monitoring: what metrics do you track? (latency p99, error rate, saturation)',
      'Distributed trace: how do you debug a slow request across 5 services?',
    ],
    reveal: [
      'Not mentioning failure modes is the #1 signal of junior-level thinking.',
      'Circuit breaker: after N failures, open the circuit and return a fast fallback.',
      'Idempotency: same request processed twice must produce same result — use a dedup key.',
    ],
  },
]

function TimerDrill() {
  const [activeStep, setActiveStep] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const intervalRef = useRef(null)

  function startStep(idx) {
    clearInterval(intervalRef.current)
    setActiveStep(idx)
    setSecondsLeft(STEPS[idx].minutes * 60)
    setRunning(true)
    setShowChecklist(false)
  }

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0 }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, activeStep])

  const step = activeStep !== null ? STEPS[activeStep] : null
  const totalSec = step ? step.minutes * 60 : 1
  const pct = step ? Math.round((secondsLeft / totalSec) * 100) : 100
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const overTime = secondsLeft === 0 && activeStep !== null && !running

  return (
    <div className="panel">
      <div className="ptitle">Live demo · 45-minute interview timer</div>
      <p style={{ marginBottom: 12, fontSize: 14, color: 'var(--ink)' }}>
        <strong>Prompt:</strong> "Design a URL Shortener." Click each step to start its countdown.
        Work through the checklist before time runs out.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {STEPS.map((s, i) => (
          <button
            key={i}
            className="act"
            style={{
              background: activeStep === i ? s.color : '#e5e7eb',
              color: activeStep === i ? '#fff' : 'var(--ink)',
              fontSize: 12,
              padding: '6px 10px',
            }}
            onClick={() => startStep(i)}
          >
            {i + 1}. {s.name.split(' · ')[1]} ({s.minutes}m)
          </button>
        ))}
      </div>

      {activeStep !== null && (
        <>
          <div style={{
            background: overTime ? '#fee2e2' : '#f0f4ff',
            border: `2px solid ${overTime ? '#DC2626' : step.color}`,
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: step.color, fontSize: 15 }}>{step.name}</strong>
              <span style={{
                fontSize: 28,
                fontFamily: 'IBM Plex Mono',
                color: overTime ? '#DC2626' : step.color,
                fontWeight: 700,
              }}>
                {overTime ? '⏰ TIME!' : `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`}
              </span>
            </div>
            <div style={{ marginTop: 8, background: '#e5e7eb', borderRadius: 4, height: 8 }}>
              <div style={{
                width: `${pct}%`,
                background: pct < 20 ? '#DC2626' : step.color,
                height: 8,
                borderRadius: 4,
                transition: 'width 1s linear',
              }} />
            </div>
          </div>
          <button
            className="act ghost"
            style={{ marginBottom: 12 }}
            onClick={() => setShowChecklist(c => !c)}
          >
            {showChecklist ? 'Hide checklist' : 'Show checklist for this step'}
          </button>
          {showChecklist && (
            <ul style={{ marginBottom: 12 }}>
              {step.checklist.map((item, i) => (
                <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>{item}</li>
              ))}
            </ul>
          )}
          <Reveal summary={`Reveal: what a strong answer covers for "${step.name}"`}>
            <ul>
              {step.reveal.map((r, i) => <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>{r}</li>)}
            </ul>
          </Reveal>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   DEMO 2 — Pattern picker
───────────────────────────────────────────── */
const PATTERN_CARDS = [
  { scenario: '10M users want real-time sports scores pushed to their phones.', pattern: 'WebSocket + Redis Pub/Sub', day: 'Day 88', explain: 'Server pushes updates over a persistent connection. Redis Pub/Sub fans the update to all connected app servers.' },
  { scenario: 'Two users try to book the last hotel room at the same moment.', pattern: 'Optimistic locking (compare-and-set)', day: 'Day 64', explain: 'Read-then-CAS: only one UPDATE succeeds because it checks the version column. The other retries.' },
  { scenario: 'A search box must show prefix suggestions as the user types each letter.', pattern: 'Trie', day: 'Day 82', explain: 'A trie stores all word prefixes. Each character navigates one level and returns all children.' },
  { scenario: 'DB queries for the home feed are taking 800 ms. You need them under 50 ms.', pattern: 'Cache (Redis)', day: 'Day 81', explain: 'Precompute and store the feed in Redis. Reads hit cache in <1 ms. Invalidate on write.' },
  { scenario: 'You need 5 services to each independently replay the same order event.', pattern: 'Kafka consumer groups', day: 'Day 94', explain: 'Each service has its own consumer group. Kafka replays the event independently to every group.' },
  { scenario: 'Your app must route each user to the same server in a cluster even as servers come and go.', pattern: 'Consistent hashing', day: 'Day 85', explain: 'Consistent hashing maps users to servers on a ring. Adding/removing a server only remaps a small fraction.' },
  { scenario: 'A downstream payment service fails 30% of the time. Your app keeps crashing.', pattern: 'Circuit breaker', day: 'Day 84', explain: 'After N failures the circuit opens. Calls return a fast fallback instead of waiting and failing.' },
  { scenario: 'You need to place DB write and event publish in one atomic operation.', pattern: 'Outbox pattern', day: 'Day 95', explain: 'Write event to an outbox table in the same DB transaction. A relay reads the outbox and publishes.' },
  { scenario: 'Find the 3 nearest available drivers to a given GPS location instantly.', pattern: 'Spatial index (grid/geohash)', day: 'Day 58', explain: 'Divide the map into cells. Only scan drivers in adjacent cells — not all N drivers.' },
  { scenario: 'Show a real-time leaderboard of the top 100 players by score.', pattern: 'Redis sorted set (ZADD / ZREVRANGE)', day: 'Day 89', explain: 'ZADD player score in O(log N). ZREVRANGE 0 99 returns the top 100 instantly.' },
]

function PatternPicker() {
  const [shuffled] = useState(() => [...PATTERN_CARDS].sort(() => Math.random() - 0.5))
  const [picks, setPicks] = useState({})
  const [revealed, setRevealed] = useState({})
  const options = [...new Set(PATTERN_CARDS.map(c => c.pattern))].sort()

  function guess(idx, val) {
    if (picks[idx] !== undefined) return
    setPicks(p => ({ ...p, [idx]: val }))
  }

  const answered = Object.keys(picks).length
  const correct = Object.entries(picks).filter(([i, v]) => v === shuffled[i].pattern).length

  return (
    <div className="panel">
      <div className="ptitle">Pattern picker · 10 scenarios</div>
      <p style={{ fontSize: 14, marginBottom: 12 }}>
        Read each scenario. Pick the right pattern from the dropdown. Then reveal the full answer.
        Score: <strong>{correct}/{answered}</strong>
      </p>
      {shuffled.map((card, i) => {
        const picked = picks[i]
        const isCorrect = picked === card.pattern
        const isAnswered = picked !== undefined
        return (
          <div key={i} style={{
            border: `1.5px solid ${isAnswered ? (isCorrect ? '#059669' : '#DC2626') : 'var(--line)'}`,
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 10,
            background: isAnswered ? (isCorrect ? '#f0fdf4' : '#fef2f2') : '#fff',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              {i + 1}. {card.scenario}
            </div>
            {!isAnswered ? (
              <select
                style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid var(--line)', fontSize: 13, width: '100%' }}
                defaultValue=""
                onChange={e => { if (e.target.value) guess(i, e.target.value) }}
              >
                <option value="" disabled>Select a pattern…</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <div style={{ fontSize: 13 }}>
                <div>{isCorrect ? '✅' : '❌'} <strong>You picked:</strong> {picked}</div>
                {!isCorrect && <div style={{ marginTop: 4 }}>✅ <strong>Correct:</strong> {card.pattern} ({card.day})</div>}
                <button className="act ghost" style={{ marginTop: 8, fontSize: 12 }} onClick={() => setRevealed(r => ({ ...r, [i]: true }))}>
                  Explain →
                </button>
                {revealed[i] && <div style={{ marginTop: 8, color: '#374151', fontSize: 13 }}>{card.explain} — <em>{card.day}</em></div>}
              </div>
            )}
          </div>
        )
      })}
      {answered === shuffled.length && (
        <div className="good">Final score: {correct}/{shuffled.length} — {correct >= 8 ? 'Excellent! Patterns are solid.' : 'Review the ones you missed and come back.'}</div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   DEMO 3 — Trade-off compass
───────────────────────────────────────────── */
function getRecommendation(consistency, readSpeed, simplicity) {
  const lines = []

  // Consistency axis
  if (consistency >= 70) {
    lines.push('Strong consistency required → use pessimistic locking (SELECT FOR UPDATE) or two-phase commit (2PC). Accept higher latency.')
  } else if (consistency <= 30) {
    lines.push('Eventual consistency OK → use Saga + compensating transactions. High availability. Lower latency.')
  } else {
    lines.push('Moderate consistency → use optimistic locking (version column). Retry on conflict. Good balance.')
  }

  // Read speed axis
  if (readSpeed >= 70) {
    lines.push('Read-heavy → add Redis cache (cache-aside, TTL). Add read replicas. Add CDN for static content. Read:write ratio drives cache hit rate.')
  } else if (readSpeed <= 30) {
    lines.push('Write-heavy → use Kafka for async writes. Batch inserts. Write-behind cache. Avoid synchronous write amplification.')
  } else {
    lines.push('Balanced read/write → consider write-through cache. Tune DB pool size. Monitor p99 on both paths.')
  }

  // Simplicity axis
  if (simplicity <= 30) {
    lines.push('High scale needed → decompose into microservices. Add API gateway (Day 97). Use consistent hashing (Day 85) for sharding. Add observability (Day 93).')
  } else if (simplicity >= 70) {
    lines.push('Keep it simple → monolith first. Single PostgreSQL. Add Redis only when DB is the bottleneck. Premature distribution is complexity you don\'t need yet.')
  } else {
    lines.push('Moderate complexity → modular monolith with clear service boundaries. Extract services when you hit specific bottlenecks.')
  }

  return lines
}

function TradeoffCompass() {
  const [consistency, setConsistency] = useState(50)
  const [readSpeed, setReadSpeed] = useState(50)
  const [simplicity, setSimplicity] = useState(50)

  const recs = getRecommendation(consistency, readSpeed, simplicity)

  return (
    <div className="panel">
      <div className="ptitle">Trade-off compass · adjust sliders to get architecture advice</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Consistency need', left: 'Eventual (AP)', right: 'Strong (CP)', val: consistency, set: setConsistency },
          { label: 'Traffic shape', left: 'Write-heavy', right: 'Read-heavy', val: readSpeed, set: setReadSpeed },
          { label: 'Architecture scale', left: 'High complexity', right: 'Keep simple', val: simplicity, set: setSimplicity },
        ].map(({ label, left, right, val, set }) => (
          <div key={label}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#6b7280', minWidth: 80, textAlign: 'right' }}>{left}</span>
              <input
                type="range" min={0} max={100} value={val}
                onChange={e => set(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 12, color: '#6b7280', minWidth: 80 }}>{right}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#f8fafc', borderRadius: 8, padding: '14px 16px', border: '1.5px solid var(--line)' }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--blue)' }}>Recommended architecture:</div>
        {recs.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 13 }}>
            <span style={{ color: 'var(--blue)', fontWeight: 700 }}>→</span>
            <span>{r}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>
        Try extremes: all the way to strong+read-heavy+complex, then flip each slider and watch the advice change.
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Quiz
───────────────────────────────────────────── */
const QUESTIONS = [
  {
    q: 'An interviewer says "Design Instagram." What should you do first?',
    o: [
      'Start drawing boxes: Client → API Gateway → Services → DB',
      'Ask clarifying questions: DAU, which features, read vs write ratio, consistency need',
      'Pick your tech stack: PostgreSQL, Redis, Kafka, CDN',
      'Calculate storage math: photos per day × average size',
    ],
    a: 1,
    e: 'Clarifying questions come before any drawing. Without scale and scope, your design has no constraints to optimize for.',
    w: {
      0: 'Drawing first is tempting because it feels productive, but boxes without scale assumptions can be completely wrong for the given load.',
      2: 'Tech stack selection is Step 3 or 4. Picking it first shows you\'re solution-first, not problem-first.',
      3: 'Storage math is important but it belongs in Step 2 (scope), after you know what you\'re designing.',
    },
    r: { id: 's2', label: 'Section 2 — Step 1: Clarify Requirements' },
  },
  {
    q: 'In which step do you say "I will focus on posting tweets and home timeline. I will skip ads and DMs"?',
    o: ['Step 1 — Clarify Requirements', 'Step 2 — Define Scope', 'Step 3 — High-Level Design', 'Step 4 — Deep Dive'],
    a: 1,
    e: 'Defining scope is Step 2. You state what is in and what is out. This prevents the interviewer saying "you forgot monetization" at minute 40.',
    w: {
      0: 'Step 1 is about asking questions, not making decisions about scope.',
      2: 'Step 3 is drawing boxes. You need scope defined first so you know which services to draw.',
      3: 'Step 4 is deep-diving into one hard sub-problem. Scope must be set before you go deep.',
    },
    r: { id: 's2', label: 'Section 2 — Step 2: Define Scope' },
  },
  {
    q: 'You have 100M DAU. Each user makes 10 requests per day. What is the average QPS?',
    o: ['100', '1,157', '10,000', '100,000'],
    a: 1,
    e: '100M × 10 = 1B requests/day. 1B / 86,400 seconds ≈ 11,574 QPS ≈ 1,157 after rounding. Peak is typically 2–3× average.',
    w: {
      0: '100 is way too low. You divided by 1M instead of seconds in a day.',
      2: '10,000 forgets to divide by seconds in a day (86,400). You can\'t just divide by DAU.',
      3: '100,000 is the peak-of-peak estimate, not the average. Average is ~1,157.',
    },
    r: { id: 's2', label: 'Section 2 — Step 2: Scale math' },
  },
  {
    q: 'Which step is about picking 1–2 hard sub-problems and going deep on the trade-offs?',
    o: ['Step 2 — Define Scope', 'Step 3 — High-Level Design', 'Step 4 — Deep Dive', 'Step 5 — Scale'],
    a: 2,
    e: 'Step 4 (Deep Dive) is where you pick the hardest sub-problem — e.g., fan-out on write vs read — and show you understand the trade-offs.',
    w: {
      1: 'Step 3 is drawing the overall architecture. It\'s intentionally high-level — not a trade-off discussion.',
      0: 'Step 2 is defining what you will and won\'t design. It\'s about scope, not depth.',
      3: 'Step 5 is about stressing the existing design at 10× scale. Deep dive on the algorithm is Step 4.',
    },
    r: { id: 's5', label: 'Section 5 — Step 4: Deep Dive' },
  },
  {
    q: 'An interviewer asks "how would you handle a hot celebrity posting to 100M followers?" This is a cue for which Step 4 trade-off?',
    o: [
      'Cache eviction policy — LRU vs LFU',
      'Fan-out on write vs fan-out on read',
      'SQL vs NoSQL choice',
      'Sharding by user_id vs by post_id',
    ],
    a: 1,
    e: 'Fan-out on write precomputes timelines at post-creation time (expensive for 100M followers). Fan-out on read computes at query time. Hybrid: fan-out on write for normal users, fan-out on read for celebrities.',
    w: {
      0: 'Cache eviction policy is a Step 5 (scale) concern, not the core algorithmic trade-off for celebrity timelines.',
      2: 'SQL vs NoSQL is a Step 3 choice. The celebrity problem is about write amplification, not data model.',
      3: 'Sharding key is a Step 5 concern. The celebrity hot-spot problem is specifically about fan-out strategy.',
    },
    r: { id: 's5', label: 'Section 5 — Step 4: Deep Dive' },
  },
  {
    q: 'You\'re in Step 5. Your DB can handle 5,000 QPS but you need 50,000 QPS reads. What\'s the first thing you add?',
    o: ['Shard the database into 10 shards', 'Add a Redis cache to absorb reads', 'Add 10 read replicas', 'Switch from SQL to NoSQL'],
    a: 1,
    e: 'A cache is the cheapest, fastest win. Most reads hit cache (80–95% hit rate), so you only need DB for cache misses. Add replicas and sharding only if cache is not enough.',
    w: {
      0: 'Sharding is expensive and complex. Try cache first — sharding is the last resort for write scaling, not read scaling.',
      2: 'Read replicas help but each replica still runs every query. Cache absorbs 80–95% of reads before they hit any DB.',
      3: 'Switching databases is a massive migration for a problem that a cache can often solve. NoSQL doesn\'t automatically make you faster.',
    },
    r: { id: 's6', label: 'Section 6 — Step 5: Scale' },
  },
  {
    q: 'In Step 6, what is the correct response to "what happens if the payment service crashes mid-checkout"?',
    o: [
      'The transaction rolls back automatically because databases have ACID.',
      'We use an idempotency key: if the payment retries, the key prevents double-charging.',
      'We add a circuit breaker to skip payment entirely on failure.',
      'We log the error and alert the user to try again.',
    ],
    a: 1,
    e: 'An idempotency key (UUID per checkout attempt) ensures retries are safe. The payment service deduplicates on the key, so a retry returns the original result instead of charging twice.',
    w: {
      0: 'ACID applies within one DB. Cross-service transactions (checkout → payment service) are NOT covered by ACID. This is the distributed transactions problem.',
      2: 'A circuit breaker prevents the call from being made — it doesn\'t handle the case where the call was in flight when the crash happened.',
      3: 'Logging + user alert is the fallback of last resort. A good system retries safely using idempotency before bothering the user.',
    },
    r: { id: 's6', label: 'Section 6 — Step 6: Edge cases' },
  },
  {
    q: 'Which pattern should you use when you need to write to a DB AND publish an event, and they must both succeed or both fail?',
    o: ['Two-phase commit (2PC)', 'Outbox pattern', 'Saga pattern', 'Kafka transaction'],
    a: 1,
    e: 'The outbox pattern writes the event to an outbox table in the same DB transaction. A relay (poller or CDC) reads the outbox and publishes. No distributed coordinator needed.',
    w: {
      0: '2PC works but requires a distributed coordinator (XA) and blocks all participants until they vote. It\'s slow and fragile — avoided in modern systems.',
      2: 'Saga coordinates a sequence of compensating transactions across services. It doesn\'t solve the single-service write+publish atomicity problem.',
      3: 'Kafka transactions exist but couple your app to Kafka\'s transactional producer, require idempotent producers, and are complex to configure correctly.',
    },
    r: { id: 's7', label: 'Section 7 — Patterns library' },
  },
]

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function Day99() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 99</div>
        <h1>System Design Interview Synthesis:<br />The 6-Step Framework</h1>
        <p>
          You have 45 minutes. You must design a system used by millions. The interviewer is
          watching. This day gives you an opening book — a repeatable framework so you never
          freeze, never forget scale, and never spend all 45 minutes on boxes.
        </p>
        <div className="chips">
          {['6-Step Framework','Clarify','High-Level Design','Deep Dive','Scale','Failure Modes','Trade-offs','Patterns Library'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 — CHESS OPENING BOOK ANALOGY */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The chess opening book analogy</h2>
        <p>
          A chess grandmaster does not improvise from move one. They have memorized openings.
          An opening is not cheating — it is preparation. It puts you in a strong position quickly.
          Then you play the middle game with skill.
        </p>
        <p>
          A system design interview is the same. The first 10 minutes are your "opening."
          If you freeze, ask the wrong questions, or start drawing before you know the scale,
          you lose those 10 minutes and never recover.
        </p>
        <p>
          The 6-step framework is your opening book. Follow it and you will never freeze.
          The middle game — the deep technical trade-offs — is where you show real skill.
          But you have to get there first.
        </p>
        <Code html={`<span class="cm">// The 6-step framework at a glance</span>
<span class="cm">// ────────────────────────────────────────────────────────────</span>
<span class="cm">//  Step 1  (5 min)  Clarify requirements   — ask questions</span>
<span class="cm">//  Step 2  (5 min)  Define scope           — state what is in / out</span>
<span class="cm">//  Step 3 (10 min)  High-level design      — boxes + arrows, happy path</span>
<span class="cm">//  Step 4 (10 min)  Deep dive              — 1-2 hard sub-problems</span>
<span class="cm">//  Step 5 (10 min)  Scale + bottlenecks    — stress-test at 10x</span>
<span class="cm">//  Step 6  (5 min)  Edge cases + failures  — what breaks, how to handle it</span>
<span class="cm">// ────────────────────────────────────────────────────────────</span>
<span class="cm">//  Total: 45 minutes. Every minute is accounted for.</span>`} />
        <Note>
          The framework does NOT tell you what to design. It tells you HOW to structure the
          conversation. The hard technical work — the trade-offs, the data models, the algorithms —
          happens inside steps 4 and 5.
        </Note>
        <Reveal summary="What separates a strong answer from a weak one?">
          <p>
            A weak answer draws boxes for 30 minutes, says "I'd add a cache," and never explains
            what the cache stores, how you invalidate it, or what the hit rate is.
          </p>
          <p>
            A strong answer asks 4 good questions, states the scale, names the hardest sub-problem
            out loud, explains two trade-offs with pros/cons, and mentions at least one failure mode.
          </p>
          <p>
            Interviewers grade on reasoning, not on memorized architectures. Show your thinking.
          </p>
        </Reveal>
      </section>

      {/* S2 — STEPS 1 & 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Steps 1 & 2 — Clarify requirements and define scope</h2>
        <p>
          These two steps take 10 minutes total. They feel slow. They are the most important
          part of the interview.
        </p>
        <h3 style={{ marginTop: 16 }}>Step 1: Clarifying questions (5 min)</h3>
        <p>Ask before drawing anything. The question bank:</p>
        <Code html={`<span class="cm">// ── WHO & SCALE ──────────────────────────────────────────</span>
<span class="cm">// "Who are the users?" (consumers, businesses, internal team)</span>
<span class="cm">// "How many daily active users (DAU)?"</span>
<span class="cm">// "What is the peak QPS? Is traffic bursty or flat?"</span>

<span class="cm">// ── FEATURES ─────────────────────────────────────────────</span>
<span class="cm">// "What is the most important feature? What should I skip?"</span>
<span class="cm">// "Mobile, web, or both?"</span>

<span class="cm">// ── NON-FUNCTIONAL ───────────────────────────────────────</span>
<span class="cm">// "What consistency level? Strong or eventual?"</span>
<span class="cm">// "What is the latency SLA? Real-time or batch OK?"</span>
<span class="cm">// "Single region or global?"</span>

<span class="cm">// Example for "Design Twitter":</span>
<span class="cm">// You ask:  "Mobile or web?"</span>
<span class="cm">// They say: "Both."</span>
<span class="cm">// You ask:  "Post + home timeline, or also DMs, ads, search?"</span>
<span class="cm">// They say: "Just post and home timeline for now."</span>
<span class="cm">// You ask:  "How many DAU?"</span>
<span class="cm">// They say: "100M DAU."</span>
<span class="cm">// Now you know what to design.</span>`} />
        <h3 style={{ marginTop: 20 }}>Step 2: Define scope (5 min)</h3>
        <Code html={`<span class="cm">// State out loud: what you WILL design</span>
<span class="cm">// "I will focus on: posting tweets and home timeline generation."</span>
<span class="cm">// "I will skip: ads, DMs, notifications, analytics."</span>

<span class="cm">// Then write the scale numbers on the board:</span>
<span class="cm">// ── Scale math ───────────────────────────────────────────</span>
<span class="cm">// DAU            = 100M</span>
<span class="cm">// QPS write      = 100M × 10 writes/day / 86,400 sec ≈ 11,574 QPS</span>
<span class="cm">// QPS read       = 100M × 100 reads/day / 86,400 sec ≈ 115,740 QPS</span>
<span class="cm">// Read:write     = ~10:1  → read-heavy → cache is critical</span>
<span class="cm">// Storage/day    = 11,574 tweets/sec × 300 bytes ≈ 300 GB/day</span>
<span class="cm">// Storage/year   = 300 GB × 365 ≈ 110 TB → need sharding</span>

<span class="cm">// Now state your consistency choice:</span>
<span class="cm">// "Home timeline can be eventually consistent — it's fine if you see</span>
<span class="cm">//  a tweet 2 seconds late. Post creation must be durable (ACKed to DB)."</span>`} />
        <Warn>
          Never skip scale math. The interviewer is judging whether you know that a 10:1 read:write
          ratio means you need a cache, and that 110 TB/year means you need sharding. These are not
          tricks — they are the constraints that drive every design decision.
        </Warn>
        <Reveal summary="What if the interviewer says 'just assume 1M users' without more info?">
          <p>
            Still ask 2–3 more questions. "1M users" is a scale number, not a feature list.
            Ask: "Which features?" and "What is the latency SLA?" Even with small scale,
            you still need to know what you're building.
          </p>
        </Reveal>
      </section>

      {/* S3 — STEP 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Step 3 — High-level design (10 min)</h2>
        <p>
          Now you draw. Not code — boxes and arrows. Show the standard components, the data flow
          for the primary use case, and name each service's job.
        </p>
        <Code html={`<span class="cm">// Standard high-level architecture (most systems fit this shape)</span>
<span class="cm">// ────────────────────────────────────────────────────────────────</span>
<span class="cm">//                                                              </span>
<span class="cm">//  [Mobile/Web Client]                                         </span>
<span class="cm">//         │                                                    </span>
<span class="cm">//         ▼                                                    </span>
<span class="cm">//     [CDN]  ──── static assets (JS, images, videos)          </span>
<span class="cm">//         │                                                    </span>
<span class="cm">//         ▼                                                    </span>
<span class="cm">//  [API Gateway]  ── auth, rate limiting, routing             </span>
<span class="cm">//     │       │                                               </span>
<span class="cm">//     ▼       ▼                                               </span>
<span class="cm">// [User    [Tweet    [Timeline                                 </span>
<span class="cm">//  Service] Service]  Service]                                </span>
<span class="cm">//     │        │          │                                   </span>
<span class="cm">//     │        ▼          ▼                                   </span>
<span class="cm">//     │    [Kafka]  ── async fan-out                          </span>
<span class="cm">//     │        │                                               </span>
<span class="cm">//     ▼        ▼          ▼                                   </span>
<span class="cm">// [User DB] [Tweet DB] [Redis Cache]  ← feeds precomputed      </span>
<span class="cm">// (PostgreSQL) (Cassandra) (sorted set)                       </span>
<span class="cm">//                                                              </span>
<span class="cm">// Happy path: user POSTs /tweet → Tweet Service → Tweet DB    </span>
<span class="cm">//  → Kafka event → Timeline Service → fan out to followers    </span>
<span class="cm">//  → store in Redis per-user feed → user GETs /timeline       </span>
<span class="cm">//  → Timeline Service reads from Redis → returns in <50ms     </span>`} />
        <Good>
          This is the template. Adapt it: replace services with the ones your system needs.
          The key skills are naming services correctly and showing the data flow end-to-end
          for the primary use case.
        </Good>
        <Reveal summary="SQL vs NoSQL — a one-line decision guide">
          <ul>
            <li><strong>SQL (PostgreSQL):</strong> need joins, transactions, strong schema, ACID. User accounts, orders, payments.</li>
            <li><strong>NoSQL (Cassandra):</strong> need horizontal scale, flexible schema, write-heavy append. Timelines, activity logs, IoT.</li>
            <li><strong>Redis:</strong> need in-memory speed. Caches, leaderboards, rate limiter counters, session store.</li>
            <li><strong>Rule:</strong> use SQL by default. Switch to NoSQL only when SQL is the proven bottleneck.</li>
          </ul>
        </Reveal>
      </section>

      {/* S4 — TIMER DEMO */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Practice: the 45-minute timer drill</h2>
        <p>
          Click each step to start its countdown. Work through the checklist before time runs out.
          Use this to simulate a real interview with a given prompt.
        </p>
        <TimerDrill />
        <Good>
          The timer is not just a clock. The real skill is recognizing which step you are in and
          what output is expected from that step. If you are still clarifying at minute 15, you
          are off track.
        </Good>
      </section>

      {/* S5 — STEP 4 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Step 4 — Deep dive on the hard parts (10 min)</h2>
        <p>
          This is the step that separates senior from junior candidates. After drawing the
          high-level boxes, you pick the hardest sub-problem and go deep. Say it out loud:
        </p>
        <p>
          "The hardest part of this design is home timeline generation because each tweet
          potentially needs to be delivered to 100 million followers. Let me talk through
          the trade-offs."
        </p>
        <Code html={`<span class="cm">// ── Fan-out on WRITE (push model) ─────────────────────────</span>
<span class="cm">// When a user posts, immediately copy the tweet to each</span>
<span class="cm">// follower's timeline cache.</span>
<span class="cm">//</span>
<span class="cm">// PRO: reads are O(1) — just read your pre-built feed</span>
<span class="cm">// CON: a celebrity with 100M followers = 100M writes on one post</span>
<span class="cm">// → write amplification, backpressure on Kafka</span>

<span class="cm">// ── Fan-out on READ (pull model) ──────────────────────────</span>
<span class="cm">// When a user opens the app, query DB for all people they</span>
<span class="cm">// follow, merge their latest tweets, sort by time.</span>
<span class="cm">//</span>
<span class="cm">// PRO: writes are O(1) — just write to your own feed</span>
<span class="cm">// CON: reads are O(K × N) — expensive when following 1000 accounts</span>

<span class="cm">// ── Hybrid (Twitter's actual solution) ───────────────────</span>
<span class="cm">// Regular users  → fan-out on write  (precompute timelines)</span>
<span class="cm">// Celebrity users → fan-out on read   (merge at read time)</span>
<span class="cm">// Threshold: >10,000 followers = celebrity mode</span>
<span class="cm">//</span>
<span class="cm">// This is the answer that earns the "senior" label.</span>`} />
        <Note>
          The interviewer often tells you which sub-problem to deep-dive on.
          If they ask "how would you handle the hot celebrity problem?" — go there immediately.
          Do not finish your current thought if it is less interesting.
        </Note>
        <Reveal summary="How do you spot the hardest sub-problem yourself?">
          <p>
            Look for the step in the happy path where two things must be perfectly coordinated:
          </p>
          <ul>
            <li><strong>Two users → same resource:</strong> booking, seat reservation, inventory decrement</li>
            <li><strong>One event → millions of fans:</strong> timeline fan-out, push notifications</li>
            <li><strong>Fast search over huge data:</strong> autocomplete, full-text search</li>
            <li><strong>Real-time updates to millions:</strong> live scores, chat, collaborative editing</li>
            <li><strong>Money movement:</strong> payment, wallet transfer, refund</li>
          </ul>
          <p>
            Any of these in your system is the sub-problem you deep-dive on.
          </p>
        </Reveal>
      </section>

      {/* S6 — STEPS 5 & 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Steps 5 & 6 — Scale, bottlenecks, and failure modes</h2>
        <h3>Step 5: Scale (10 min)</h3>
        <p>
          Ask: "What breaks at 10× current load?" Walk through each layer of your design
          and say what you would change.
        </p>
        <Code html={`<span class="cm">// Walk through each layer and stress-test it:</span>
<span class="cm">//</span>
<span class="cm">// DB layer</span>
<span class="cm">// ─────────────────────────────────────────────────</span>
<span class="cm">// Q: can one PostgreSQL handle 50,000 QPS reads?</span>
<span class="cm">// A: No. Add Redis cache → absorbs 90% of reads.</span>
<span class="cm">//    Still not enough → add read replicas (synchronous replication).</span>
<span class="cm">//    Writes too hot  → shard by user_id (consistent hashing, Day 85).</span>
<span class="cm">//</span>
<span class="cm">// Service layer</span>
<span class="cm">// ─────────────────────────────────────────────────</span>
<span class="cm">// Q: can one Timeline Service handle peak load?</span>
<span class="cm">// A: Services are stateless → add instances behind a load balancer.</span>
<span class="cm">//    Stateless = any instance can handle any request.</span>
<span class="cm">//    Session state lives in Redis, not in the service.</span>
<span class="cm">//</span>
<span class="cm">// Async</span>
<span class="cm">// ─────────────────────────────────────────────────</span>
<span class="cm">// Q: what can we make async to reduce synchronous latency?</span>
<span class="cm">// A: Fan-out → Kafka. Email/SMS → Kafka. Analytics → Kafka.</span>
<span class="cm">//    Anything that doesn't need to complete before the HTTP 200.</span>
<span class="cm">//</span>
<span class="cm">// CDN</span>
<span class="cm">// ─────────────────────────────────────────────────</span>
<span class="cm">// Q: what is cacheable?</span>
<span class="cm">// A: JS bundles, images, videos → CDN always.</span>
<span class="cm">//    Profile photos → CDN with long TTL.</span>
<span class="cm">//    Home timeline → NOT cacheable (personalized per user).</span>`} />
        <h3 style={{ marginTop: 20 }}>Step 6: Edge cases and failure modes (5 min)</h3>
        <Code html={`<span class="cm">// Ask yourself: "what can go wrong?"</span>
<span class="cm">//</span>
<span class="cm">// Service crashes mid-request</span>
<span class="cm">// → Use idempotency key on every write operation.</span>
<span class="cm">//   Retry is safe because duplicate = same result.</span>
<span class="cm">//</span>
<span class="cm">// Downstream service is slow or down</span>
<span class="cm">// → Circuit breaker (Day 84): open after N failures.</span>
<span class="cm">//   Return a fast fallback instead of waiting 30 seconds.</span>
<span class="cm">//</span>
<span class="cm">// Kafka message processed twice</span>
<span class="cm">// → Idempotent consumer: check if event_id already processed.</span>
<span class="cm">//   Store processed event_ids in Redis with TTL.</span>
<span class="cm">//</span>
<span class="cm">// Cache cold after a deploy</span>
<span class="cm">// → Warm the cache before cutting traffic over.</span>
<span class="cm">//   Or accept a cache miss spike and let the cache fill naturally.</span>
<span class="cm">//</span>
<span class="cm">// "How do you debug a slow request?"</span>
<span class="cm">// → Distributed tracing (Day 93): every request gets a trace_id.</span>
<span class="cm">//   Each service logs trace_id + span duration.</span>
<span class="cm">//   You can see exactly which service added the 800 ms.</span>`} />
        <Good>
          Mentioning at least one failure mode and one observability strategy (metrics, tracing,
          or alerting) is what makes an answer production-grade. It shows you have actually shipped
          and debugged systems.
        </Good>
      </section>

      {/* S7 — PATTERNS LIBRARY */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The patterns library — 20 patterns in one table</h2>
        <p>
          Every pattern below is a proven solution to a specific problem. Know which problem
          each solves and which Day in this course covers it.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="matrix" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>Problem you have</th>
                <th>Pattern to use</th>
                <th>Day</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Need many more read replicas', 'DB read replicas', 'DB basics'],
                ["Can't fit data in one DB", 'Database sharding', 'Day 91'],
                ['DB queries are too slow', 'Cache (Redis, LRU)', 'Day 81'],
                ['Cache invalidation is hard', 'TTL + surrogate keys', 'Day 96'],
                ['Write to DB + publish event atomically', 'Outbox pattern', 'Day 95'],
                ['Need event ordering', 'Kafka partition key', 'Day 94'],
                ['Multiple services must all succeed or none', 'Saga + compensations', 'Day 90'],
                ['Real-time push to clients', 'WebSocket + Redis Pub/Sub', 'Day 88'],
                ['Rank millions of users by score', 'Redis sorted set (ZADD)', 'Day 89'],
                ['Find nearest available resource by location', 'Spatial index (geohash)', 'Day 58'],
                ['Prefix/autocomplete search', 'Trie', 'Day 82'],
                ['Serve static content globally fast', 'CDN', 'Day 96'],
                ['One server cannot handle traffic', 'Load balancer', 'Day 97'],
                ['Route to the right server consistently', 'Consistent hashing', 'Day 85'],
                ['Same request must never cause duplicate side effects', 'Idempotency key + dedup store', 'Day 95'],
                ['Downstream service is unreliable', 'Circuit breaker', 'Day 84'],
                ['Debug a slow request across 5 services', 'Distributed tracing', 'Day 93'],
                ['Multiple consumers must replay the same event independently', 'Kafka consumer groups', 'Day 94'],
                ['Reduce load on origin server for static content', 'CDN + origin shield', 'Day 96'],
                ['Duplicate Kafka message hits a consumer', 'Idempotent consumer', 'Day 94'],
              ].map(([prob, pat, day]) => (
                <tr key={prob}>
                  <td>{prob}</td>
                  <td><strong>{pat}</strong></td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--blue)' }}>{day}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Warn>
          Do NOT name a pattern without justifying why it fits. Say: "I'd use Kafka here because
          we need multiple consumers to replay the same event independently and we need the audit
          log for compliance." One sentence of justification turns a name-drop into an answer.
        </Warn>
      </section>

      {/* S8 — PATTERN PICKER + COMPASS */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>Pattern picker + trade-off compass</h2>
        <p>
          First: the pattern picker. Read the scenario, select the right pattern, then reveal
          the explanation. Then: adjust the trade-off compass and read the architecture advice.
        </p>
        <PatternPicker />
        <div style={{ marginTop: 32 }}>
          <TradeoffCompass />
        </div>
        <Good>
          The compass is not a substitute for thinking — it is a prompt. In a real interview,
          you say: "This system is read-heavy and can tolerate eventual consistency, so I'd lean
          toward a Redis cache + read replicas and accept stale reads."
        </Good>
      </section>

      {/* COMMON MISTAKES */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Common mistakes — and how to avoid them</h2>
        <ul>
          <li style={{ marginBottom: 10 }}>
            <strong>Drawing before clarifying scale.</strong> Your 10K QPS design is different
            from your 10M QPS design. Ask first. Always.
          </li>
          <li style={{ marginBottom: 10 }}>
            <strong>Spending all 45 minutes on Step 3 (boxes).</strong> Boxes are cheap. Trade-off
            reasoning is expensive. Move to Step 4 after 10 minutes even if your diagram is imperfect.
          </li>
          <li style={{ marginBottom: 10 }}>
            <strong>Not saying "it depends."</strong> Every design decision has trade-offs. If you
            say "use Redis" without saying "because the read:write ratio is 10:1 and our reads need
            sub-5ms latency," it sounds like memorization, not understanding.
          </li>
          <li style={{ marginBottom: 10 }}>
            <strong>Ignoring the hard part.</strong> "I'd add a cache" is one sentence. A strong
            answer adds: what the cache key is, what the TTL is, what the eviction policy is,
            and what happens on a cache miss.
          </li>
          <li style={{ marginBottom: 10 }}>
            <strong>No failure mode discussion.</strong> Production systems fail. Not mentioning
            idempotency, circuit breakers, or retries signals inexperience.
          </li>
          <li style={{ marginBottom: 10 }}>
            <strong>Picking a pattern without justifying it.</strong> "I'd use Kafka" needs to be
            followed by why Kafka and not a simple job queue or a direct HTTP call.
          </li>
        </ul>
      </section>

      {/* CHEAT SHEET */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Cheat sheet — the 6-step framework</h2>
        <ul>
          <li><strong>Step 1 (5 min):</strong> Ask who, how many DAU, which features, read or write heavy, consistency level, latency SLA.</li>
          <li><strong>Step 2 (5 min):</strong> State in/out scope. Write scale math (QPS, storage). State consistency choice and justify it.</li>
          <li><strong>Step 3 (10 min):</strong> Draw Client → CDN → API Gateway → Services → Cache → DB. Show happy-path data flow. Name every service.</li>
          <li><strong>Step 4 (10 min):</strong> Name the hardest sub-problem out loud. Go deep on 1–2 trade-offs. Show the data model.</li>
          <li><strong>Step 5 (10 min):</strong> Ask "what breaks at 10×?" Walk through: cache, read replicas, sharding, async Kafka, CDN.</li>
          <li><strong>Step 6 (5 min):</strong> Failure modes: idempotency, circuit breaker, monitoring, distributed tracing.</li>
          <li><strong>Pattern → Justification:</strong> always name a pattern AND justify why it fits this problem.</li>
          <li><strong>"It depends":</strong> say it, then explain what it depends on and how each option fares.</li>
        </ul>
      </section>

      {/* INTERVIEW CORNER */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>5 questions interviewers always ask</h2>

        <Reveal summary="Q1: What questions do you ask in the first 5 minutes of any system design interview?">
          <p><strong>The 7 core questions:</strong></p>
          <ol>
            <li>Who are the users? (consumer, business, internal?)</li>
            <li>How many daily active users (DAU)?</li>
            <li>What features are in scope? What can I skip?</li>
            <li>Read-heavy or write-heavy? (drives caching + replica strategy)</li>
            <li>What consistency level? Strong or eventual?</li>
            <li>Latency SLA? (real-time &lt;100ms or batch OK?)</li>
            <li>Single region or global?</li>
          </ol>
          <p>
            You don't need all 7 every time. You need enough to set your constraints.
            Stop asking when you have: scale, core features, and consistency level.
          </p>
        </Reveal>

        <Reveal summary="Q2: How do you know which sub-problem to deep-dive on in Step 4?">
          <p>
            Look for the step in the happy path where two conflicting goals must be satisfied
            simultaneously. The most common ones:
          </p>
          <ul>
            <li><strong>Concurrency conflict:</strong> two users → same resource (seat, slot, inventory)</li>
            <li><strong>Fan-out:</strong> one event → millions of recipients (timelines, notifications)</li>
            <li><strong>Search:</strong> fast prefix or full-text over billions of records</li>
            <li><strong>Real-time:</strong> sub-second updates to millions of clients</li>
            <li><strong>Money:</strong> two accounts, one atomic debit+credit</li>
          </ul>
          <p>
            If the interviewer asks "how would you handle X?" — go there immediately. That is
            their signal about what they want to hear.
          </p>
        </Reveal>

        <Reveal summary="Q3: How do you calculate QPS and storage in your head?">
          <p><strong>QPS math:</strong></p>
          <ul>
            <li>Seconds in a day ≈ 86,400. Round to 100,000 for mental math.</li>
            <li>100M users × 10 requests/day = 1B requests/day ÷ 100K ≈ 10,000 QPS (average)</li>
            <li>Peak = 2–3× average. So plan for 30,000 QPS.</li>
          </ul>
          <p><strong>Storage math:</strong></p>
          <ul>
            <li>1 tweet = 300 bytes. 10K tweets/sec = 3 MB/sec = ~260 GB/day.</li>
            <li>1 photo = 200 KB. 1M photos/day = 200 GB/day.</li>
            <li>Always state assumptions. The interviewer cares about the reasoning, not the exact number.</li>
          </ul>
        </Reveal>

        <Reveal summary="Q4: What does 'it depends' actually mean in a system design interview?">
          <p>
            "It depends" is not a cop-out. It is the right answer when you follow it with:
            what it depends on, and how each option performs under those conditions.
          </p>
          <p>Good example:</p>
          <p>
            "Should I use SQL or NoSQL here? It depends. If we need strong consistency and joins
            between users and payments, SQL is better. If we need to write 50,000 events/second
            and can tolerate eventual consistency, Cassandra is better. For this design with
            100M DAU and simple key-value lookups, I'd start with PostgreSQL and move to
            Cassandra if write throughput becomes the bottleneck."
          </p>
          <p>
            The formula: state the dependency → explain both options → pick one for this context.
          </p>
        </Reveal>

        <Reveal summary="Q5: What do you do when the interviewer says 'just assume X' about a constraint?">
          <p>
            Accept it immediately, write it down, and continue. Do not push back.
          </p>
          <p>
            Then, at the end of your design (Step 6 or in Q&A), you can revisit:
            "You mentioned to assume X. Just to close the loop — if X were not true,
            I'd handle it by doing Y. Would you like me to go deeper on that?"
          </p>
          <p>
            This shows you can work within constraints while still demonstrating awareness
            of the edge case. It is a maturity signal.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="s11">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz — the 6-step framework</h2>
        <p>Click an answer. Explanations and revisit links appear on wrong picks.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 99 complete?</strong> Homework: pick any system from the list below.
        Set a 45-minute timer. Work through all 6 steps. Write down your answers (not code —
        boxes, bullets, trade-offs). Record yourself explaining step 4 out loud.
        <br /><br />
        <strong>Suggested systems:</strong> URL Shortener · Ride-hailing · Food Delivery ·
        Social Media Feed · Video Streaming · Hotel Booking · Live Auction.
        <br /><br />
        Next: <strong>Day 100 — Grand Finale</strong>: 100 days of LLD and system design.
        The complete journey, the master patterns map, and what to build next.
      </div>
    </div>
  )
}
