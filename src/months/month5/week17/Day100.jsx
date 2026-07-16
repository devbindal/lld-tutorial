import { useState } from 'react'
import { Code, C, Reveal, Note, Good } from '../../../components/ui.jsx'

/* ============ Interactive 1: bonus-block skill snapshot (Days 81–99) ============ */
const SKILL_CATEGORIES = [
  {
    cat: 'Caching & Data Tier (81–83, 85–87, 89, 91, 96)',
    skills: [
      'I can explain cache-aside and why you DELETE on write, never update.',
      'I can design autocomplete with a Trie storing top-K at each node.',
      'I can design content-addressable file storage with refCount GC.',
      'I can explain why consistent hashing moves only 1/N keys and modulo moves ~80%.',
      'I can justify 302 over 301 for a URL shortener in one sentence.',
      'I can describe the inverted index and preprocessing symmetry.',
      'I can build a leaderboard with Redis sorted sets (ZADD / ZINCRBY / ZREVRANGE).',
      'I can pick a shard key and explain what makes one shard hot.',
      'I can set Cache-Control headers correctly for CDN vs sensitive data.',
    ],
  },
  {
    cat: 'Resilience & Async (84, 88, 90, 94, 95)',
    skills: [
      'I can draw the circuit breaker state machine and explain HALF_OPEN.',
      'I can order the resilience stack: Timeout → Retry → CB → Bulkhead → Fallback.',
      'I can design real-time chat with WebSocket + Redis Pub/Sub + offline inbox.',
      'I can distinguish Event Sourcing from CQRS and explain a Saga.',
      'I can route Kafka messages by key for per-entity ordering.',
      'I can explain the Outbox pattern and why 2PC across DB + Kafka is impractical.',
      'I can convert at-least-once delivery to effectively exactly-once with idempotency keys.',
    ],
  },
  {
    cat: 'Infrastructure & Architecture (92, 93, 97, 98)',
    skills: [
      'I can explain gateway = north-south vs service mesh = east-west.',
      'I can instrument a service with the three pillars: logs, metrics, traces.',
      'I can pick the right load balancing algorithm for a given traffic shape.',
      'I can explain why sticky sessions break deploys and how Redis fixes it.',
      'I can decompose a monolith along bounded contexts with a Strangler Fig migration.',
      'I can defend database-per-service and name the patterns that replace cross-DB transactions.',
    ],
  },
  {
    cat: 'The Interview (99)',
    skills: [
      'I can run the 6-step framework from memory: clarify → scope → design → deep dive → scale → failures.',
      'I can do QPS and storage math in my head with the 86,400-seconds shortcut.',
      'I can name the hardest sub-problem of a system out loud in the first 15 minutes.',
      'I can say "it depends" and follow it with what it depends on.',
    ],
  },
]

function SkillSnapshot() {
  const [checked, setChecked] = useState({})
  const toggle = (cat, i) => setChecked((c) => ({ ...c, [`${cat}-${i}`]: !c[`${cat}-${i}`] }))

  const total = SKILL_CATEGORIES.reduce((n, g) => n + g.skills.length, 0)
  const done = Object.values(checked).filter(Boolean).length

  const catCounts = SKILL_CATEGORIES.map((g) => ({
    cat: g.cat,
    done: g.skills.filter((_, i) => checked[`${g.cat}-${i}`]).length,
    total: g.skills.length,
  }))

  let msg = ''
  if (done === total) msg = 'The full stack — LLD to system design — is yours. Nothing left to fear in that room.'
  else if (done >= total * 0.8) msg = 'Nearly there. One review pass over the unchecked items closes it out.'
  else if (done >= total * 0.6) msg = 'Strong core. The unchecked days are your Week 17 revision list.'
  else if (done > 0) msg = 'Honest start. Reopen the days behind the unchecked boxes — they are all one click away.'

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the bonus-block skill snapshot — check what you truly own</div>
      {SKILL_CATEGORIES.map((g) => {
        const cc = catCounts.find((x) => x.cat === g.cat)
        return (
          <div key={g.cat} style={{ marginBottom: 14 }}>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>{g.cat.toUpperCase()}</span>
              <span style={{ color: cc.done === cc.total ? '#1d7a3a' : '#7c8aa5' }}>{cc.done}/{cc.total}</span>
            </div>
            {g.skills.map((skill, i) => {
              const key = `${g.cat}-${i}`
              return (
                <button key={i} onClick={() => toggle(g.cat, i)} style={{
                  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                  fontFamily: 'IBM Plex Sans', fontSize: 13.5, padding: '6px 8px', marginBottom: 4,
                  border: '1px solid var(--line)', borderRadius: 6,
                  background: checked[key] ? '#EAF7EF' : '#fff',
                }}>
                  {checked[key] ? '☑' : '☐'} {skill}
                </button>
              )
            })}
          </div>
        )
      })}
      <div className="statbar" style={{ display: 'block', background: done === total ? '#EAF7EF' : undefined }}>
        <b>{done} / {total}</b> skills confident
        {msg && <span style={{ marginLeft: 8, color: '#444' }}>— {msg}</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: the challenge generator ============ */
const SYSTEMS = [
  { name: 'Design Twitter/X', hard: 'Timeline fan-out for celebrity accounts', days: 'Days 90, 94, 99' },
  { name: 'Design WhatsApp', hard: 'Message ordering + offline delivery at scale', days: 'Days 88, 94' },
  { name: 'Design Uber', hard: 'Nearest-driver matching + the assignment race', days: 'Days 58–59, 64' },
  { name: 'Design BookMyShow', hard: 'Two users, one seat — atomic hold with TTL', days: 'Days 51–52, 64' },
  { name: 'Design a URL Shortener', hard: 'Sub-10ms redirects + collision-free codes', days: 'Days 81, 86' },
  { name: 'Design Dropbox', hard: 'Chunked dedup sync across devices', days: 'Day 83' },
  { name: 'Design Google Search autocomplete', hard: 'Top-K prefix suggestions at keystroke speed', days: 'Day 82' },
  { name: 'Design a payment system', hard: 'Exactly-once money movement across services', days: 'Days 90, 95' },
  { name: 'Design a live sports leaderboard', hard: 'Millions of concurrent score updates, instant top-100', days: 'Day 89' },
  { name: 'Design a rate limiter', hard: 'Atomic refill+take under concurrency, distributed counters', days: 'Days 64–65' },
  { name: 'Design Netflix video delivery', hard: 'Global low-latency delivery + origin protection', days: 'Days 96–97' },
  { name: 'Design a notification system', hard: 'Multi-channel dispatch with retries and dedup', days: 'Days 57, 95' },
]

const STEP_LINE = [
  '① Clarify (5m) — DAU? features? read:write? consistency? latency? region?',
  '② Scope (5m) — what is in, what is out, and the scale math on the board',
  '③ High-level (10m) — Client → CDN → Gateway → Services → Cache → DB, happy path',
  '④ Deep dive (10m) — THE hard sub-problem below, trade-offs out loud',
  '⑤ Scale (10m) — what breaks at 10×: cache, replicas, sharding, async, CDN',
  '⑥ Failures (5m) — idempotency, circuit breaker, monitoring, tracing',
]

function ChallengeGenerator() {
  const [pick, setPick] = useState(null)
  const [revealed, setRevealed] = useState(false)

  function spin() {
    let next = Math.floor(Math.random() * SYSTEMS.length)
    if (pick !== null && next === pick) next = (next + 1) % SYSTEMS.length
    setPick(next)
    setRevealed(false)
  }

  const sys = pick !== null ? SYSTEMS[pick] : null

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the challenge generator — your interviewer for today</div>
      <p style={{ fontSize: 14, marginBottom: 12 }}>
        Press the button. Set a 45-minute timer. Work the 6 steps on paper before revealing
        the hard part. This is how you keep the muscle alive after the course ends.
      </p>
      <button className="act" onClick={spin}>🎲 Give me a system to design</button>
      {sys && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            padding: '18px 22px', border: '2px solid var(--blue)', borderRadius: 10,
            background: '#F0F4FF', marginBottom: 12,
          }}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
              "{sys.name}."
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginTop: 6 }}>
              You have 45 minutes. The whiteboard is yours.
            </div>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, lineHeight: 2, color: '#444' }}>
            {STEP_LINE.map((s) => <div key={s}>{s}</div>)}
          </div>
          {!revealed ? (
            <button className="ghost act" style={{ marginTop: 12 }} onClick={() => setRevealed(true)}>
              Reveal the hard sub-problem (only after your attempt)
            </button>
          ) : (
            <div className="good" style={{ marginTop: 12 }}>
              <strong>The Step-4 deep dive interviewers expect:</strong> {sys.hard}.
              <br />Revise: <strong>{sys.days}</strong>.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ The page ============ */
export default function Day100() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 100</div>
        <h1>Grand Finale:<br />100 Days of Design</h1>
        <p>Day 80 graduated you in Low-Level Design. Then you kept going — 19 more days, from
          Redis caches to Kafka, from consistent hashing to the interview framework itself.
          Today the whole journey fits on one page.</p>
      </div>

      {/* s1: what the bonus block added */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What Days 81–99 added on top of graduation</h2>
        <p>The core course made you dangerous inside one process: classes, patterns, state machines,
          threads. The bonus block made you dangerous <em>between</em> processes:</p>
        <ul style={{ lineHeight: 2 }}>
          <li>You can put a cache in front of any hot read path and invalidate it correctly (delete, never update).</li>
          <li>You can shard, hash, and route data so that adding a server moves 1/N keys, not 80% of them.</li>
          <li>You can wrap every remote call in the full resilience stack and explain each layer's job.</li>
          <li>You can move money and events between services without losing either — Outbox, Saga, idempotency keys.</li>
          <li>You can read a Kafka topology and know exactly what is ordered, what is parallel, and what can duplicate.</li>
          <li>You can stand at a whiteboard, hear "Design X," and run a 45-minute conversation with a repeatable structure.</li>
        </ul>
        <Good>Day 1 was <C>class Car</C>. Day 99 was fan-out strategies for 100 million followers.
          Same course. Same you, 100 days apart.</Good>
      </section>

      {/* s2: the complete 100-day map */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The complete 100-day map</h2>
        <Code html={`  THE 100-DAY COURSE — complete map
  ══════════════════════════════════════════════════════════════════════════

   MONTH 1 · OOP MASTERY + SOLID            Days 1–20
   ────────────────────────────────────────────────────────────────────────
   Classes → Encapsulation → Inheritance → Polymorphism → Abstraction
   Relationships &amp; UML → SOLID (one principle a day) → DRY/KISS/YAGNI
   Coupling/Cohesion → Law of Demeter → Enums/Exceptions → Value Objects

   MONTH 2 · GOF DESIGN PATTERNS (23)       Days 21–40
   ────────────────────────────────────────────────────────────────────────
   Creational: Singleton · Factory · Abstract Factory · Builder · Prototype
   Structural: Adapter · Decorator · Composite · Facade/Proxy · Flyweight/Bridge
   Behavioral: Strategy · Observer · Command · State · Template Method
               CoR · Iterator · Mediator · Memento · Visitor

   MONTH 3 · CLASSIC LLD PROBLEMS           Days 41–60
   ────────────────────────────────────────────────────────────────────────
   Parking Lot · Tic-Tac-Toe · Snake &amp; Ladder · Elevator · Vending Machine
   Logging Framework · BookMyShow · Splitwise · ATM · LRU Cache
   Notification System · Cab Booking · + 4 timed mock drills

   MONTH 4 · ADVANCED LLD                   Days 61–80
   ────────────────────────────────────────────────────────────────────────
   Concurrency (races → cures → producer-consumer → locking → rate limiter)
   Chess · Food Delivery · Amazon Locker · Pub-Sub Queue · Hotel · Auction
   Social Feed · Task Board · Online Exam · Library · Interview Day
   Day 80: GRADUATION 🎓

   BONUS · ADVANCED SYSTEM DESIGN           Days 81–100
   ────────────────────────────────────────────────────────────────────────
   Distributed Cache · Autocomplete · File Storage · Circuit Breaker
        81               82              83              84
   Consistent Hashing · URL Shortener · Search Engine · Real-time Chat
        85                  86              87               88
   Leaderboard · Event-Driven Arch · Sharding · Gateway/Mesh · Observability
        89              90                 91          92            93
   Kafka · Distributed Txns · CDN · Load Balancing · Microservices
     94          95            96         97               98
   Interview Synthesis · GRAND FINALE 🏁
          99                  100

  ══════════════════════════════════════════════════════════════════════════
   23 GoF patterns · 14 LLD systems · 19 system-design topics
   7 mock drills · 17 weekly recaps · 100 days · 1 engineer, transformed
  ══════════════════════════════════════════════════════════════════════════`} />
        <Note>Nothing on this map is decoration. Every day has working demos, a quiz you fought with,
          and a homework you (hopefully) shipped. This map is not what you read — it is what you built.</Note>
      </section>

      {/* s3: the master patterns map */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The master patterns map — one table to rule them all</h2>
        <p>The single most useful artifact of 100 days: when you hear a <em>problem</em>, this is the
          <em> solution vocabulary</em> you now reach for, and where to relearn each one.</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="matrix" style={{ fontSize: 13 }}>
            <thead>
              <tr><th>When the problem is…</th><th>Reach for…</th><th>Day</th></tr>
            </thead>
            <tbody>
              {[
                ['A class does too many unrelated things', 'SRP — split by actor', '11'],
                ['Every new variant means editing old code', 'OCP — interface + class per variant', '12'],
                ['Construction logic is scattered or complex', 'Factory / Builder', '22, 24'],
                ['One object, many optional behaviors stacking', 'Decorator', '27'],
                ['Same-shaped things nest inside each other', 'Composite', '28'],
                ['An algorithm should be swappable at runtime', 'Strategy', '31'],
                ['Many parts must react when one thing changes', 'Observer', '32'],
                ['Behavior changes completely with lifecycle phase', 'State', '34, 48'],
                ['A request should pass through processing stages', 'Chain of Responsibility', '36, 49'],
                ['Undo/redo, queues, or scheduled operations', 'Command (+ Memento)', '33, 39'],
                ['Two users race for one resource', 'Atomic compare-and-set / locking', '51–52, 62, 64'],
                ['O(1) reads AND writes with eviction', 'HashMap + doubly-linked list (LRU)', '56'],
                ['Threads share mutable state', 'The cure ladder: immutable → confined → atomic → locks', '61–62'],
                ['Producers outpace consumers', 'Bounded blocking queue (backpressure)', '63'],
                ['Too many requests from one client', 'Rate limiter (token bucket)', '65'],
                ['DB reads are the bottleneck', 'Cache-aside Redis + read replicas', '81'],
                ['Prefix search must be instant', 'Trie with top-K at each node', '82'],
                ['A downstream dependency keeps failing', 'Circuit breaker + resilience stack', '84'],
                ['Adding a server reshuffles everything', 'Consistent hashing', '85'],
                ['Events must reach many services reliably', 'Kafka + consumer groups', '94'],
                ['DB write + event publish must be atomic', 'Outbox pattern', '95'],
                ['Retries might duplicate side effects', 'Idempotency keys', '95'],
                ['Static content is slow globally', 'CDN + cache headers + URL hashing', '96'],
                ['One server cannot take the traffic', 'Load balancer (least-connections)', '97'],
                ['The monolith must become services safely', 'Strangler Fig + bounded contexts', '98'],
                ['"Design X" with a whiteboard and 45 minutes', 'The 6-step framework', '99'],
              ].map(([prob, sol, day]) => (
                <tr key={prob}>
                  <td>{prob}</td>
                  <td><strong>{sol}</strong></td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--blue)' }}>{day}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Reveal summary="How to use this table forever">
          <p>Bookmark it mentally as a <strong>problem-first index</strong>. Interviews, code reviews, and
            design docs all start with a problem, never with a pattern name. The engineers who misuse patterns
            memorized the solutions column; the ones who use them well memorized the problems column and let
            it point to the solution. You built this table left-to-right — keep reading it that way.</p>
        </Reveal>
      </section>

      {/* s4: skill snapshot */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>The bonus-block skill snapshot</h2>
        <p>Day 80 measured your LLD confidence. This one measures the system-design layer — Days 81–99.
          Same rule as before: check only what you could explain to a colleague right now.</p>
        <SkillSnapshot />
      </section>

      {/* s5: what to build next */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>What to build next — the system-design portfolio</h2>
        <p>Day 80's projects proved your LLD. These four prove the bonus block — each one forces a
          distributed-systems concept out of the slides and into running code:</p>
        <table className="matrix">
          <thead>
            <tr><th>Project</th><th>What it proves</th><th>Days to review first</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>URL shortener with real Redis</strong></td>
              <td>Cache-aside reads, base-62 counters, 302 vs 301, async click analytics — a complete miniature production service</td>
              <td>Days 81, 86</td>
            </tr>
            <tr>
              <td><strong>Order pipeline with Kafka + Outbox</strong></td>
              <td>Docker-compose Kafka, an outbox table with a relay, an idempotent consumer — the hardest concepts of the block made concrete</td>
              <td>Days 90, 94–95</td>
            </tr>
            <tr>
              <td><strong>Mini load balancer (Java, sockets)</strong></td>
              <td>Round-robin and least-connections in front of 3 toy servers, active health checks, connection draining on shutdown</td>
              <td>Days 84, 97</td>
            </tr>
            <tr>
              <td><strong>Real-time leaderboard + chat</strong></td>
              <td>WebSockets, Redis sorted sets and Pub/Sub, presence heartbeats — the full real-time toolkit in one app</td>
              <td>Days 88–89</td>
            </tr>
          </tbody>
        </table>
        <Good><strong>Same rule as Day 80: pick ONE and finish it.</strong> A working Kafka outbox demo
          with a README that explains the crash-recovery story is a better interview asset than any
          certificate.</Good>
      </section>

      {/* s6: challenge generator */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>The challenge generator — practice forever</h2>
        <p>The course ends today; the practice does not have to. One button, one random system,
          one 45-minute timer. Do this once a week and the 6-step framework never rusts.</p>
        <ChallengeGenerator />
      </section>

      {/* s7: final message */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The final message</h2>
        <div style={{
          padding: '28px 32px', border: '2px solid var(--blue)', borderRadius: 12,
          background: 'linear-gradient(135deg, #F0F4FF 0%, #FAFAF7 100%)',
          fontFamily: 'Space Grotesk', fontSize: 17, lineHeight: 2, color: 'var(--ink)',
        }}>
          <p style={{ margin: '0 0 14px' }}>
            On Day 1, an object was a mystery and <C>new</C> was magic.
          </p>
          <p style={{ margin: '0 0 14px' }}>
            On Day 100, you can design the systems that run the apps in your pocket.
          </p>
          <p style={{ margin: '0 0 14px' }}>
            Nobody handed you that. You clicked every demo, failed every quiz once,
            and came back the next day. A hundred times.
          </p>
          <p style={{ margin: '0 0 14px' }}>
            That habit — showing up, one day, one concept — is the real graduation gift.
            It works on everything, not just design.
          </p>
          <p style={{ margin: 0, fontWeight: 700 }}>
            The course is over. The engineer is just getting started. 🏁
          </p>
        </div>
      </section>

      {/* footer — grand finale */}
      <div className="footer" style={{ textAlign: 'center', fontSize: 16, lineHeight: 1.9 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏁</div>
        <strong>100 / 100 — the course is complete.</strong>
        <br /><br />
        Final homework: pick one portfolio project from Section 5, create the repo today,
        and make the first commit before you close this tab.
        <br /><br />
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: '#7c8aa5' }}>
          Days 1–100 · 23 Patterns · 14 Systems · 19 System-Design Topics · 1 Engineer, Transformed
        </span>
      </div>
    </div>
  )
}
