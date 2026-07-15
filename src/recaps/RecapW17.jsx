import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../components/ui.jsx'

/* ===== Rapid-review widget ===== */
function ReviewDrill({ items }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= items.length
  const cur = items[idx]
  function pick(i) {
    if (picked !== null) return
    setPicked(i)
    if (i === cur.a) setScore((s) => s + 1)
  }
  return (
    <div className="panel">
      <div className="ptitle">Rapid review · recall the concept before you read the answer</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>Score: <b>{idx + 1 > items.length ? items.length : score} / {items.length}</b>. Anything you missed — reopen that day. Re-run until it is automatic.</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Review again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 10 }}>question {idx + 1} of {items.length} · score {score}</div>
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
    q: 'Cache-aside write rule: after writing to the DB, what do you do to the cache?',
    o: ['Update the cache to match what you wrote', 'Delete (invalidate) the cache key', 'Leave it — TTL will expire it eventually', 'Write cache first, then DB'],
    a: 1,
    why: 'Delete, never update. Two threads can race to update the cache after a DB write and land out of order — one stale value wins until TTL. Deleting is always safe: the next read misses, hits DB, and caches the fresh value.'
  },
  {
    q: 'What fixes a cache stampede when a hot key expires?',
    o: ['Increase the TTL so it expires less often', 'Use SET NX EX to acquire a mutex — only one thread rebuilds; the rest wait', 'Switch to write-through so the key never expires', 'Add more Redis nodes'],
    a: 1,
    why: 'A hot key expiring causes every concurrent reader to miss and flood the DB simultaneously. Redis SET NX EX (set if not exists with expiry) gives the first thread a "rebuild lock"; all others see the lock exists and wait or serve a stale value until the key is rebuilt.'
  },
  {
    q: 'Why does autocomplete get faster as the user types more characters?',
    o: ['The server caches popular prefixes after the first call', 'A longer prefix walks deeper into the Trie — the subtree below is smaller, so DFS visits fewer nodes', 'The network payload is smaller for longer prefixes', 'The browser handles it locally after the first character'],
    a: 1,
    why: 'Trie search is proportional to the subtree size below the prefix node. One character leaves a huge subtree; six characters leave a tiny one. Fewer nodes to visit = faster.'
  },
  {
    q: 'What is content-addressable storage (used in the file storage system)?',
    o: ['Files stored sorted alphabetically for fast lookup', 'The storage key IS the hash of the content — same bytes anywhere produce the same key, making dedup automatic', 'Files compressed before writing', 'Files indexed by MIME type'],
    a: 1,
    why: 'SHA-256(content) is deterministic. Two users uploading the same 4 MB chunk get back the same chunk ID — the block store holds one copy. No dedup logic needed: identity is content identity.'
  },
  {
    q: 'When is a chunk deleted from the block store?',
    o: ['When all versions of a file that reference it are deleted', 'Only when its refCount reaches zero — no FileVersion anywhere points to that chunk hash', 'After 30 days without access', 'When the owning user deletes their account'],
    a: 1,
    why: 'Chunks are shared across FileVersions (and across users via dedup). Decrement refCount on every version delete; remove the chunk only when refCount hits exactly 0. Same as JVM garbage collection.'
  },
  {
    q: 'What is HALF_OPEN in a circuit breaker?',
    o: ['A degraded mode passing 50% of requests', 'A probe state: after resetTimeout, let a small number of requests through to test if the service recovered', 'A logging mode that records failures without blocking', 'A synonym for bulkhead'],
    a: 1,
    why: 'You cannot jump from OPEN straight to CLOSED — that would be guessing recovery. HALF_OPEN lets a single probe through. Success → CLOSED. Failure → back to OPEN.'
  },
  {
    q: 'Resilience stack order — innermost to outermost?',
    o: ['Circuit Breaker → Retry → Timeout → Bulkhead → Fallback', 'Timeout → Retry → Circuit Breaker → Bulkhead → Fallback', 'Bulkhead → Circuit Breaker → Retry → Timeout → Fallback', 'Fallback → Bulkhead → Circuit Breaker → Retry → Timeout'],
    a: 1,
    why: 'Timeout is per-call (innermost). Retry wraps it (per intent). Circuit Breaker wraps Retry (across intents). Bulkhead is outermost per-downstream (caps concurrent calls). Fallback catches everything.'
  },
  {
    q: 'Adding 1 server to a 4-server consistent hash ring: how many keys move?',
    o: ['All keys are redistributed equally', 'Approximately 1/5 of keys — only the arc stolen from the adjacent server', 'Half the keys move', 'No keys move'],
    a: 1,
    why: 'The new server steals only the arc immediately counter-clockwise from its ring position. With 5 servers, each arc is ~1/5 of the ring. Compare with modulo hashing where adding 1 server moves ~(N-1)/N = 80% of all keys.'
  },
  {
    q: 'Why use 302 redirect instead of 301 in a URL shortener?',
    o: ['302 is faster because it skips DNS', '301 is permanently cached by browsers — all future visits bypass your service, breaking click analytics; 302 forces the browser to check your server every time', '302 works for HTTPS while 301 only works for HTTP', '301 requires a Content-Type header that is hard to set'],
    a: 1,
    why: '301 = Moved Permanently. Browsers cache it indefinitely. After the first visit the browser goes straight to the long URL — you never see the click and cannot update the destination. 302 = Found (temporary), always checks your server.'
  },
  {
    q: 'What is preprocessing symmetry in a search engine?',
    o: ['Crawlers and indexers using the same number of machines', 'Index-time and query-time must apply the same tokenization, lowercasing, stop-word removal, and stemming — or query terms will not match stored terms', 'Documents and queries must have the same maximum length', 'TF and IDF being computed with symmetric formulas'],
    a: 1,
    why: 'If you stem "running" to "run" at index time but not at query time, the query "running" never matches the indexed token "run". Both pipelines must be identical: same steps, same order.'
  },
  {
    q: 'In the inverted index, what is the key and what is the value?',
    o: ['docId → list of words (forward index)', 'word → list of (docId, positions) (inverted index)', 'word → IDF score', 'docId → TF-IDF score'],
    a: 1,
    why: 'Forward index (docId → words) answers "what words are in doc X?" Inverted index (word → doc list) answers "which docs contain this word?" — exactly what search needs. O(1) term lookup vs O(N) full scan without it.'
  },
  {
    q: 'WebSocket vs long polling: what is the key structural difference?',
    o: ['WebSocket is stateless; long polling is stateful', 'WebSocket is a persistent full-duplex TCP connection; long polling is repeated HTTP requests that the server holds open until it has data', 'WebSocket works only on HTTP/2; long polling works on HTTP/1.1', 'They are the same at the transport level'],
    a: 1,
    why: 'WebSocket upgrades an HTTP request to a persistent, bidirectional TCP connection — one connection, messages flow both ways. Long polling makes a new HTTP request each cycle and the server holds it until data arrives. WebSocket is far more efficient for real-time chat.'
  },
  {
    q: 'Redis ZADD / ZINCRBY / ZREVRANGE: what data structure do these commands target?',
    o: ['Redis Hash (field → value)', 'Redis Sorted Set (member → score, kept sorted by score)', 'Redis List (doubly-linked queue)', 'Redis Bloom Filter'],
    a: 1,
    why: 'Sorted Set = each member has a floating-point score; members are kept in sorted order. ZADD adds a member with a score. ZINCRBY increments a score atomically. ZREVRANGE returns top-K members by score descending — perfect for leaderboards.'
  },
  {
    q: 'What is the difference between Event Sourcing and CQRS?',
    o: ['They are the same pattern with different names', 'Event Sourcing = the state IS the append-only log of events (replay to rebuild); CQRS = read model and write model are separate services/tables optimized independently', 'Event Sourcing = the command side; CQRS = the query side', 'CQRS requires Event Sourcing to work'],
    a: 1,
    why: 'Event Sourcing stores every state change as an immutable event; current state is computed by replaying events. CQRS splits the write path (commands that mutate state) from the read path (queries that project state). They complement each other but are independent patterns.'
  },
  {
    q: 'What is a hot shard in database sharding and how do you prevent it?',
    o: ['A shard that runs on a physically hot machine', 'A shard that receives disproportionately more traffic because the shard key maps many popular rows to it — fix by choosing a high-cardinality shard key or adding virtual shards', 'A shard that holds more rows than the others', 'A shard that is replicated more frequently'],
    a: 1,
    why: 'If your shard key is low-cardinality (e.g. country) or a popular user ID, one shard gets much more traffic than others. Fix: use a high-cardinality key (user_id hash), add a random suffix for extreme hot-spots, or use virtual shards to spread load.'
  },
  {
    q: 'API Gateway filter chain: which design pattern does it implement?',
    o: ['Strategy — the gateway picks one filter per request', 'Chain of Responsibility — each filter processes the request and calls next, or short-circuits', 'Observer — filters subscribe to request events', 'Facade — one filter handles everything'],
    a: 1,
    why: 'Each filter (auth, rate-limit, logging, routing) has a handle(request, next) method. It does its work and either calls next to pass along or short-circuits (e.g. returns 401). This is CoR from Day 36: a chain of handlers, each deciding pass-along or stop.'
  },
  {
    q: 'RED method for metrics: what does each letter stand for?',
    o: ['Reliability, Efficiency, Durability', 'Rate (requests/sec), Errors (error rate), Duration (latency distribution)', 'Requests, Events, Data', 'Response time, Error budget, Demand'],
    a: 1,
    why: 'RED = Rate (how many requests per second), Errors (what fraction fail), Duration (how long they take, ideally as a histogram with P50/P99). These three metrics describe the health of any service from the caller\'s perspective.'
  },
  {
    q: 'What is a distributed trace and what does a span represent?',
    o: ['A trace is a single log line; a span is a field within it', 'A trace is the end-to-end journey of one request across all services; a span is one unit of work within that trace (e.g. one service call or DB query)', 'A trace is an error stack; a span is one stack frame', 'A trace is a metrics histogram; a span is one bucket'],
    a: 1,
    why: 'One trace = one request ID that follows a request from the browser through API gateway, service A, service B, and DB. Each hop or sub-operation creates a span with start time, duration, parent span ID, and tags. Assembling all spans for a trace ID shows the full call graph.'
  },
  {
    q: 'Saga pattern vs two-phase commit (2PC): when do you choose Saga?',
    o: ['2PC is always preferred because it is simpler', 'Saga when services are owned by different teams or when 2PC availability cost is too high — each step has a compensating transaction; 2PC when you need strict synchronous atomicity across a small number of services you own', 'Saga only works with Event Sourcing', 'They solve different problems: 2PC is for reads, Saga is for writes'],
    a: 1,
    why: '2PC blocks all participants until the coordinator decides commit/abort — high availability cost, coordinator is a SPOF. Saga breaks the transaction into local steps each with a compensating action (undo). If step 3 fails, compensations run in reverse. Saga trades strict atomicity for availability and independence.'
  },
]

const QUESTIONS = [
  {
    q: 'After updating a user profile in the DB, what should you do to the Redis cache entry in a cache-aside setup?',
    o: [
      'Update the cache entry to match the DB write immediately',
      'Delete (invalidate) the cache key — the next read will re-populate it from DB',
      'Leave it alone and let TTL expire it naturally',
      'Write a versioned key so old and new coexist'
    ],
    a: 1,
    e: 'In cache-aside, delete on write is always safe. If two threads race to update the cache after a DB write, they can land in the wrong order and a stale value wins until TTL. Deleting is atomic and race-safe: the worst case is one extra DB read on the next miss.',
    w: {
      0: 'Updating cache at write time introduces a race: thread A reads V1 from DB, thread B writes V2 to DB and deletes cache, thread A writes stale V1 back to cache. Now cache holds V1 while DB holds V2.',
      2: 'TTL is a staleness safety net, not an invalidation strategy. Stale data sits in cache for the entire TTL window after every write.',
      3: 'Versioned keys require all readers to use the new key. Old code reading the old key gets stale data indefinitely.'
    },
    r: { id: 'day81', label: 'Day 81 — Distributed Cache' }
  },
  {
    q: 'A Trie stores top-K completions at every node instead of running DFS at query time. What is the trade-off?',
    o: [
      'Reads are O(1) per suggestion but every insert/frequency update must update stored top-K at all ancestor nodes',
      'Reads and writes are both O(1) — no trade-off',
      'Reads are slower because you must sort the stored list before returning it',
      'Writes are O(1) but reads require a full DFS of the prefix subtree'
    ],
    a: 0,
    e: 'Storing top-K at each node makes reads O(K) — just return the pre-sorted list. But writes must propagate: a frequency change to a word may update the top-K list of every ancestor node from leaf to root. That is O(K × word-length) per write. Acceptable because reads vastly outnumber writes.',
    w: {
      1: 'There is a real trade-off: writes become more expensive when you push sorting work to write time instead of read time.',
      2: 'The list is already sorted at each node — that is the point. No sort at read time.',
      3: 'This describes the naive DFS approach, which is what storing top-K is designed to replace.'
    },
    r: { id: 'day82', label: 'Day 82 — Search Autocomplete' }
  },
  {
    q: 'Two users upload the exact same 4 MB chunk. How many times is it stored in the block store?',
    o: [
      'Twice — one per user for isolation',
      'Once — SHA-256(same bytes) produces the same key; the block store keeps one copy and increments refCount',
      'Once per FileVersion that references it',
      'It depends on whether the users are in the same organization'
    ],
    a: 1,
    e: 'SHA-256 is deterministic. Both uploads hash to the same chunk ID. The block store checks: does a chunk with this ID exist? Yes — skip the write, bump refCount. The metadata layer enforces who can see what; the block store only knows hashes.',
    w: {
      0: 'Per-user copies would defeat the whole point of content-addressing. Isolation is a metadata concern (permissions, FileVersion rows), not a storage concern.',
      2: 'The chunk is stored once regardless of how many FileVersions reference it. refCount tracks the number of references.',
      3: 'Dedup is purely content-based (hash equality). Organization membership is irrelevant.'
    },
    r: { id: 'day83', label: 'Day 83 — File Storage System' }
  },
  {
    q: 'A circuit breaker is OPEN. A new request arrives. What happens?',
    o: [
      'The request is queued until the circuit closes',
      'The request is fast-failed immediately without calling the downstream service',
      'The circuit transitions to HALF_OPEN and lets this request through as a probe',
      'The request is forwarded to a fallback service automatically'
    ],
    a: 1,
    e: 'When OPEN, the circuit breaker short-circuits: it throws or invokes the fallback immediately, without making the downstream call. The circuit stays OPEN until resetTimeout expires, then moves to HALF_OPEN for a single probe request.',
    w: {
      0: 'Queueing still accumulates work and risks hammering the downstream service when it recovers. Fast-fail is the correct response.',
      2: 'Transition to HALF_OPEN happens only after resetTimeout, not on the very next request. While OPEN, every request is fast-failed.',
      3: 'Fallback is a separate layer wrapping the circuit breaker. The CB itself only fast-fails; the fallback is what the caller does with that failure.'
    },
    r: { id: 'day84', label: 'Day 84 — Circuit Breaker and Resilience' }
  },
  {
    q: 'You add a 5th server to a 4-server consistent hash ring. With modulo hashing instead, what fraction of keys would have moved?',
    o: [
      '1/5 — the same as consistent hashing',
      '4/5 — the modulo base changed from 4 to 5, remapping almost all keys',
      '1/2 — only keys above the midpoint move',
      '0 — existing keys stay on existing servers'
    ],
    a: 1,
    e: 'With modulo hashing, changing N from 4 to 5 changes hash(key) % N for ~(N-1)/N = 80% of all keys. This causes a massive cache miss storm. Consistent hashing moves only ~1/N = 20% of keys by stealing only the adjacent arc.',
    w: {
      0: '1/5 is the consistent hashing result. Modulo hashing is much worse because the divisor itself changes.',
      2: 'There is no "midpoint" concept in modulo hashing — the fraction is (N-1)/N for any N.',
      3: 'Changing the modulo base invalidates the mapping for nearly all keys.'
    },
    r: { id: 'day85', label: 'Day 85 — Consistent Hashing' }
  },
  {
    q: 'A URL shortener uses 301 redirect instead of 302. What is the most serious consequence?',
    o: [
      'The short URL stops resolving after 24 hours',
      'Browsers permanently cache the destination — click analytics are lost and destination updates are impossible',
      'Search engines de-index the short URL immediately',
      'The redirect stops working for HTTPS URLs'
    ],
    a: 1,
    e: '301 = Moved Permanently. Browsers cache it forever. After the first visit, the browser navigates directly to the long URL without contacting your shortener — zero analytics recorded, and you cannot change the destination. 302 = Found (temporary), always checks your server.',
    w: {
      0: '301 does not expire — it is permanent and works indefinitely. The problem is that it is cached too aggressively.',
      2: 'Search engines may transfer page rank via 301, but that is not an analytics problem.',
      3: '301 and 302 both work for HTTPS. The issue is browser caching behavior, not protocol.'
    },
    r: { id: 'day86', label: 'Day 86 — URL Shortener' }
  },
  {
    q: 'A user sends a chat message and goes offline. The recipient is also offline. How does a real-time chat system deliver the message later?',
    o: [
      'The message is lost — WebSocket delivery is best-effort only',
      'The message is stored in an offline delivery queue (e.g. per-user inbox in DB); when the recipient reconnects, the server flushes undelivered messages',
      'The sender must retry when the recipient comes online',
      'The message is stored in Redis pub/sub and delivered within 24 hours'
    ],
    a: 1,
    e: 'Redis Pub/Sub is ephemeral — if no subscriber is listening, the message is dropped. For offline delivery, messages are written to a persistent store (DB or message queue) keyed by recipient. On reconnect, the client requests messages since its last ack. This is the SENT/DELIVERED/READ receipt flow.',
    w: {
      0: 'Best-effort applies only if you use only Pub/Sub without a persistent store. A production chat system writes to a durable store before acknowledging the sender.',
      2: 'Retrying is the sender\'s fallback, not the design. The server stores messages so the sender does not need to know the recipient is offline.',
      3: 'Redis Pub/Sub is in-memory and not persistent. Messages not consumed at publish time are lost. It is used for fan-out to online users, not for offline delivery.'
    },
    r: { id: 'day88', label: 'Day 88 — Real-time Chat' }
  },
  {
    q: 'What is the difference between Event Sourcing and CQRS?',
    o: [
      'They are the same pattern with different names',
      'Event Sourcing stores state as an append-only log of events (replay to rebuild); CQRS splits read and write models into separate paths optimized independently',
      'Event Sourcing is the command side; CQRS is the query side',
      'CQRS requires Event Sourcing to function'
    ],
    a: 1,
    e: 'Event Sourcing: every state change is an immutable event in a log; current state = replay of all events. CQRS: the write side accepts commands and updates the write model; the read side maintains denormalized read projections. They complement each other but are independent. You can use CQRS without Event Sourcing.',
    w: {
      0: 'They are genuinely different. Event Sourcing is about how state is stored; CQRS is about how reads and writes are separated.',
      2: 'Event Sourcing covers both command processing AND state storage. CQRS defines the read/write split, not a side.',
      3: 'CQRS can be used with a traditional mutable database. Event Sourcing is one common implementation strategy for the write side of CQRS.'
    },
    r: { id: 'day90', label: 'Day 90 — Event-Driven Architecture' }
  },
  {
    q: 'What is a hot shard in database sharding and what is the primary fix?',
    o: [
      'A shard running on an overheating server — fix by moving it to a cooler rack',
      'A shard receiving disproportionately more traffic because the shard key maps many popular rows to it — fix by choosing a high-cardinality shard key or adding virtual shards',
      'A shard that holds more rows than the others — fix by redistributing rows evenly',
      'A shard with more replicas than others — fix by removing extra replicas'
    ],
    a: 1,
    e: 'If the shard key is low-cardinality (e.g. country) or maps to a single celebrity user, one shard gets a huge fraction of traffic. Fix: use a high-cardinality key (hashed user_id), add a random suffix for extreme hot spots, or use virtual shards (fine-grained partitions) so hot partitions can be moved independently.',
    w: {
      0: 'Hot shard is a traffic/load imbalance problem, not a thermal one.',
      2: 'Hot shard is about traffic, not row count. A shard can have few rows but receive enormous traffic (e.g. a celebrity account).',
      3: 'Replication topology is unrelated to the hot shard problem.'
    },
    r: { id: 'day91', label: 'Day 91 — Database Sharding' }
  },
  {
    q: 'The API Gateway filter chain implements which classic design pattern?',
    o: [
      'Strategy — the gateway picks one filter per request type',
      'Chain of Responsibility — each filter does its work and either calls next or short-circuits the chain',
      'Observer — filters subscribe to request events',
      'Composite — all filters run in parallel and results are merged'
    ],
    a: 1,
    e: 'Each filter (auth, rate-limit, logging, routing) has a handle(request, chain) method. It does its work and either calls chain.next() to pass along or returns early (e.g. 401 Unauthorized). This is Chain of Responsibility from Day 36: a chain of handlers, each deciding pass-along or stop.',
    w: {
      0: 'Strategy picks one algorithm from a set. The gateway runs ALL filters in sequence — a chain, not a selection.',
      2: 'Observer is event notification. Filters are not notified of events; they are invoked sequentially in a chain.',
      3: 'Composite aggregates children of the same type. The filter chain is sequential processing, not parallel aggregation.'
    },
    r: { id: 'day92', label: 'Day 92 — API Gateway and Service Mesh' }
  },
]

export default function RecapW17() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17</div>
        <h1>Week 17 Recap:<br />13 Days of Advanced System Design</h1>
        <p>Days 81–93 in one place: caching, search, file storage, resilience, consistent hashing, URL shortener,
           search engine, real-time chat, leaderboards, event-driven architecture, sharding, API gateway, and
           observability. Cheat-sheet, rapid review, recap quiz.</p>
        <div className="chips">
          {[
            'Distributed Cache', 'Search Autocomplete', 'File Storage', 'Circuit Breaker',
            'Consistent Hashing', 'URL Shortener', 'Search Engine', 'Real-time Chat',
            'Leaderboard & Top-K', 'Event Sourcing', 'CQRS', 'Sagas',
            'Database Sharding', 'API Gateway', 'Service Mesh', 'Observability'
          ].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      {/* ===== SECTION 1 — Week in one picture ===== */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  WEEK 17 (BONUS) — 13 advanced system-design topics, grouped by concern

  ┌─────────────────────────── CACHING LAYER ───────────────────────────────┐
  │  Day 81  DISTRIBUTED CACHE  cache-aside / write-through / TTL           │
  │                              eviction (LRU/LFU) / hot-key / stampede    │
  │  Day 82  SEARCH AUTOCOMPLETE Trie + top-K at node / radix tree          │
  │  Day 86  URL SHORTENER       base-62 counter / 302 / async analytics    │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────── DATA TIER ───────────────────────────────────┐
  │  Day 83  FILE STORAGE        chunking / SHA-256 CAS / refCount GC       │
  │  Day 85  CONSISTENT HASHING  TreeMap ring / virtual nodes / 1/N move    │
  │  Day 87  SEARCH ENGINE       inverted index / TF-IDF / postings merge   │
  │  Day 89  LEADERBOARD &amp; TOP-K  Redis sorted set / min-heap / time bucket│
  │  Day 91  DATABASE SHARDING   range/hash/directory / virtual shards      │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────── RESILIENCE ──────────────────────────────────┐
  │  Day 84  CIRCUIT BREAKER     CLOSED→OPEN→HALF_OPEN / retry+jitter       │
  │                              bulkhead / timeout / resilience stack       │
  │  Day 92  API GATEWAY         filter chain (CoR) / JWT / rate limit      │
  │          SERVICE MESH        sidecar / mTLS / observability              │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────── ASYNC / EVENT-DRIVEN ────────────────────────┐
  │  Day 88  REAL-TIME CHAT      WebSocket / Redis Pub-Sub / offline queue  │
  │  Day 90  EVENT-DRIVEN ARCH   Event Sourcing (log+replay) / CQRS         │
  │                              Saga + compensating transactions            │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────── OBSERVABILITY ───────────────────────────────┐
  │  Day 93  OBSERVABILITY       logs (structured + correlation ID)          │
  │                              metrics (Counter/Gauge/Histogram, RED)      │
  │                              traces (spans / W3C traceparent)            │
  │                              OpenTelemetry as the unifying SDK           │
  └─────────────────────────────────────────────────────────────────────────┘`} />
        <Note><strong>The meta-theme of Week 17:</strong> protect shared state and user experience under load — across
          caches, file stores, service calls, event streams, databases, and network boundaries. Every day adds one
          more layer to building systems that degrade gracefully instead of collapsing.</Note>
      </section>

      {/* ===== SECTION 2 — Day-by-day cheat sheet ===== */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 81 · Distributed Cache</h3>
        <ul>
          <li><strong>Cache-aside read:</strong> check cache → miss → query DB → write result to cache → return. Hit ratio determines DB load.</li>
          <li><strong>Cache-aside write:</strong> write DB → DELETE the cache key. Never update the cache entry — two concurrent writes can land out of order and leave a stale value until TTL.</li>
          <li><strong>Write-through:</strong> write cache AND DB synchronously. Guarantees freshness; write latency doubles. Use when reads need guaranteed freshness and write volume is low.</li>
          <li><strong>Hot-key fix:</strong> L1 = in-process LRU (HashMap + DLL, Day 56 pattern); L2 = Redis. 95% of reads for hot keys never leave the JVM.</li>
          <li><strong>Cache stampede fix:</strong> Redis <C>SET lock:key "" NX EX 5</C> — only the thread that wins the lock fills the cache. All others poll or serve a stale value.</li>
          <li><strong>Eviction policies:</strong> <C>allkeys-lru</C> for a pure cache; <C>noeviction</C> for a session store (reject new writes when full).</li>
        </ul>
        <Code html={`<span class="cm">// Cache-aside: always DELETE on write, never update</span>
<span class="kw">void</span> updateUser(User u) {
    db.save(u);                       <span class="cm">// 1. write DB first</span>
    redis.del(<span class="str">"user:"</span> + u.id);         <span class="cm">// 2. invalidate cache key</span>
}                                     <span class="cm">// 3. next read will miss and re-populate</span>`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 82 · Search Autocomplete</h3>
        <ul>
          <li><strong>Trie node:</strong> <C>Map&lt;Character, TrieNode&gt; children</C>, <C>boolean isEnd</C>, <C>int frequency</C>.</li>
          <li><strong>Naive prefix search:</strong> walk to prefix node → DFS collect all isEnd descendants → sort by frequency. O(M log M) — too slow.</li>
          <li><strong>Top-K at each node (production):</strong> each node pre-stores top-K completions sorted by frequency. Query = walk prefix O(L) + return list O(K). Writes update all ancestors.</li>
          <li><strong>Radix / compressed Trie:</strong> collapse single-child chains into one node. Same lookup speed, far less memory.</li>
          <li><strong>Scale:</strong> shard by first 1–2 characters. Rebuild Trie nightly from offline frequency aggregation.</li>
          <li><strong>Key insight:</strong> autocomplete gets FASTER as the user types — longer prefix → smaller subtree → fewer nodes to visit.</li>
        </ul>
        <Code html={`<span class="cm">// Top-K stored at each node — O(K) read vs O(M log M) DFS+sort</span>
<span class="kw">class</span> TrieNode {
    Map&lt;Character, TrieNode&gt; children = <span class="kw">new</span> HashMap&lt;&gt;();
    List&lt;String&gt; topK = <span class="kw">new</span> ArrayList&lt;&gt;(); <span class="cm">// pre-sorted by frequency</span>
    <span class="kw">boolean</span> isEnd;
    <span class="kw">int</span> frequency;
}`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 83 · File Storage System</h3>
        <ul>
          <li><strong>Chunking:</strong> split each file into fixed-size slices (e.g. 4 MB). Chunk <C>id = SHA-256(chunkBytes)</C>.</li>
          <li><strong>Upload protocol:</strong> client sends list of chunk hashes → server responds which are missing → client uploads only those. Known hashes are free.</li>
          <li><strong>Two-store architecture:</strong> metadata DB (File/Folder/FileVersion rows + chunk reference list) + block store (raw bytes keyed by chunk hash).</li>
          <li><strong>Upload commit:</strong> quota counts only NEW chunks. Create FileVersion row. Increment refCount for each chunk in this version.</li>
          <li><strong>Delta sync:</strong> client hashes local chunks → diffs against server manifest → uploads changed / downloads missing. Only changed bytes cross the wire.</li>
          <li><strong>Reference-count GC:</strong> delete FileVersion → decrement refCount for each chunk. Delete chunk from block store only when refCount == 0.</li>
        </ul>
        <Code html={`<span class="cm">// Dedup: chunk ID is its content hash — same bytes = same ID anywhere</span>
<span class="kw">String</span> chunkId = sha256(chunkBytes);      <span class="cm">// deterministic key</span>
<span class="kw">if</span> (!blockStore.exists(chunkId)) {
    blockStore.put(chunkId, chunkBytes);   <span class="cm">// only write if not already there</span>
}
refCountTable.increment(chunkId);          <span class="cm">// track every FileVersion using this chunk</span>`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 84 · Circuit Breaker &amp; Resilience</h3>
        <ul>
          <li><strong>Timeout:</strong> every remote call must have a deadline. Rule of thumb: P99 latency × 3. Without timeout, slow services hang threads forever.</li>
          <li><strong>Retry:</strong> transient failures only. Exponential backoff (100 ms → 200 ms → 400 ms) + jitter (random offset) to prevent thundering-herd retries. Never retry non-idempotent calls without an idempotency key.</li>
          <li><strong>Circuit Breaker states:</strong> CLOSED (count failures) → OPEN at threshold (fast-fail all requests) → HALF_OPEN after resetTimeout (let one probe through) → CLOSED on probe success, or back to OPEN on failure.</li>
          <li><strong>Bulkhead:</strong> separate thread pool per downstream service. Payment pool saturation cannot starve the search pool.</li>
          <li><strong>Stack order (inside-out):</strong> Timeout → Retry → Circuit Breaker → Bulkhead → Fallback.</li>
          <li><strong>Retry inside CB:</strong> each retry counts toward the CB trip threshold. Retry outside CB means the breaker sees only the final logical failure — much slower to detect outages.</li>
        </ul>
        <Code html={`<span class="cm">// Resilience stack (inside-out). Timeout is innermost — per attempt.</span>
Fallback.wrap(
  Bulkhead.wrap(
    CircuitBreaker.wrap(
      Retry.wrap(
        TimeLimiter.wrap(remoteCall)   <span class="cm">// innermost</span>
      )
    )
  )
)                                       <span class="cm">// Fallback is outermost — last resort</span>`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 85 · Consistent Hashing</h3>
        <ul>
          <li><strong>Problem with modulo:</strong> adding 1 server changes N in hash(key) % N → ~(N-1)/N ≈ 80% of keys must move. Cache miss storm.</li>
          <li><strong>Consistent hashing:</strong> adding or removing 1 server moves only ~1/N of keys. All other keys stay put.</li>
          <li><strong>Ring structure:</strong> <C>TreeMap&lt;Integer, String&gt;</C> mapping ring position → server name.</li>
          <li><strong>Lookup:</strong> <C>map.ceilingEntry(hash(key))</C> — first server clockwise from the key. Wrap to first entry if null. O(log N).</li>
          <li><strong>Virtual nodes:</strong> hash("ServerA#0") … hash("ServerA#149") — 150 positions per server. Gives approximately equal arc distribution. V=1 is severely skewed.</li>
          <li><strong>Use cases:</strong> Cassandra (data partitioning), Redis Cluster (16,384 hash slots), CDN routing, sticky load balancing.</li>
        </ul>
        <Code html={`TreeMap&lt;Integer, String&gt; ring = <span class="kw">new</span> TreeMap&lt;&gt;();

<span class="cm">// Add server with V virtual nodes</span>
<span class="kw">for</span> (<span class="kw">int</span> i = <span class="num">0</span>; i &lt; V; i++) {
    ring.put(hash(<span class="str">"ServerA#"</span> + i), <span class="str">"ServerA"</span>);
}

<span class="cm">// Lookup: clockwise from key hash, wrap at end</span>
Map.Entry&lt;Integer,String&gt; e = ring.ceilingEntry(hash(key));
<span class="kw">return</span> e != <span class="kw">null</span> ? e.getValue() : ring.firstEntry().getValue();`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 86 · URL Shortener</h3>
        <ul>
          <li><strong>Short-code strategies:</strong> random base-62 (collision risk grows), counter+base-62 (no collisions — production default), hash of long URL (deterministic, no per-click analytics).</li>
          <li><strong>Base-62 encoding:</strong> charset = [0-9a-zA-Z]. 62^6 ≈ 56 billion unique codes from 6 characters. Build digits right-to-left: N % 62, divide by 62.</li>
          <li><strong>302 not 301:</strong> 302 = Found (temporary) — browser checks your server every time. 301 = Moved Permanently — browser caches forever, breaks analytics and destination updates.</li>
          <li><strong>Redirect latency:</strong> must be under 10 ms. Redis cache-aside: GET shortCode → longUrl. Never hit DB on every click.</li>
          <li><strong>Analytics:</strong> async fire-and-forget. On redirect, publish ClickEvent to a queue. Consumer writes to analytics DB. Never block the redirect on analytics.</li>
          <li><strong>Expiry:</strong> store expiresAt timestamp. Return 410 Gone if expired. Background sweeper GCs expired entries.</li>
        </ul>
        <Code html={`<span class="cm">// Counter + base-62: no collisions by construction</span>
<span class="kw">static final</span> String ALPHABET = <span class="str">"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"</span>;

String encode(<span class="kw">long</span> n) {
    StringBuilder sb = <span class="kw">new</span> StringBuilder();
    <span class="kw">while</span> (n &gt; <span class="num">0</span>) { sb.insert(<span class="num">0</span>, ALPHABET.charAt((<span class="kw">int</span>)(n % <span class="num">62</span>))); n /= <span class="num">62</span>; }
    <span class="kw">return</span> sb.toString();   <span class="cm">// pad to 6 chars with leading zeros if needed</span>
}`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 87 · Search Engine</h3>
        <ul>
          <li><strong>Forward index:</strong> docId → list of words. Useful for "what words are in doc X?" — not for search.</li>
          <li><strong>Inverted index:</strong> word → list of (docId, positions). Makes "which docs contain this word?" an O(1) lookup.</li>
          <li><strong>Preprocessing symmetry:</strong> tokenize → lowercase → remove stop words → stem — applied identically at index time AND at query time. If they differ, queries produce zero results for valid words.</li>
          <li><strong>TF-IDF score:</strong> TF = termCount/docLength (frequent in this doc). IDF = log(totalDocs/docsWithTerm) (rare across corpus). TF-IDF = TF × IDF. High = relevant.</li>
          <li><strong>AND query postings merge:</strong> sort each term's postings by docId. Walk both lists with two pointers, emit docIds in both. O(m + n).</li>
          <li><strong>Crawl pipeline:</strong> seed URLs → fetch → parse links → frontier (Bloom filter dedup) → fetch → index. Robots.txt and politeness delays apply.</li>
        </ul>
        <Code html={`<span class="cm">// Inverted index: word → [(docId, position)]</span>
Map&lt;String, List&lt;Posting&gt;&gt; index = <span class="kw">new</span> HashMap&lt;&gt;();

<span class="cm">// AND query: two-pointer merge on sorted postings</span>
List&lt;Posting&gt; a = index.get(<span class="str">"java"</span>);   <span class="cm">// sorted by docId</span>
List&lt;Posting&gt; b = index.get(<span class="str">"tutorial"</span>);
<span class="cm">// walk a and b together, emit only docIds present in both — O(m+n)</span>`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 88 · Real-time Chat</h3>
        <ul>
          <li><strong>WebSocket:</strong> a persistent full-duplex TCP connection. One handshake, then messages flow both ways with no HTTP overhead per message. Ideal for real-time chat.</li>
          <li><strong>Redis Pub/Sub fan-out:</strong> when a message is sent, publish to a channel. All chat servers subscribed to that channel forward it to connected recipients. Ephemeral — if no subscriber, message is dropped.</li>
          <li><strong>Offline delivery queue:</strong> messages written to a persistent DB inbox before ack to sender. On recipient reconnect, flush undelivered messages since last ack.</li>
          <li><strong>Receipt states:</strong> SENT (server stored) → DELIVERED (recipient device received) → READ (recipient opened). Each state transition sends a receipt back to the sender.</li>
          <li><strong>Group chat fan-out:</strong> for small groups, fan out at the message service. For large groups (thousands), fan out at read time from a shared message store.</li>
          <li><strong>Presence:</strong> heartbeat (periodic ping) to track online/offline. Store in Redis with TTL; absence of heartbeat = offline.</li>
        </ul>
        <Code html={`<span class="cm">// Fan-out: sender → server → Redis Pub/Sub → recipient servers → WebSockets</span>
<span class="cm">// Offline: if recipient is not connected, write to inbox table</span>
<span class="kw">void</span> sendMessage(Message msg) {
    db.save(msg);                           <span class="cm">// 1. persist first</span>
    redis.publish(<span class="str">"chat:"</span> + msg.chatId, msg); <span class="cm">// 2. fan-out to online users</span>
    <span class="cm">// offline recipients pick it up on reconnect via inbox query</span>
}`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 89 · Leaderboard &amp; Top-K</h3>
        <ul>
          <li><strong>Redis Sorted Set:</strong> members kept sorted by a floating-point score. <C>ZADD key score member</C>, <C>ZINCRBY key delta member</C>, <C>ZREVRANGE key 0 K-1 WITHSCORES</C>. O(log N) per add, O(K) per top-K read.</li>
          <li><strong>Min-heap for top-K in Java:</strong> maintain a min-heap of size K. For each element: if heap.size() &lt; K → add. Else if element &gt; heap.peek() → poll + add. O(N log K).</li>
          <li><strong>Time-bucket sliding window:</strong> divide time into fixed buckets (e.g. 1-minute). Keep a circular buffer of bucket counts. Drop buckets older than the window. Sum remaining buckets for the current total.</li>
          <li><strong>Leaderboard at scale:</strong> shard by region or game. Aggregate shards for a global leaderboard (scatter-gather). Cache the top-1000 with a short TTL.</li>
          <li><strong>Percentile leaderboard:</strong> use a histogram (count of scores per bucket) to compute rank percentile without storing every score.</li>
        </ul>
        <Code html={`<span class="cm">// Redis sorted set: real-time leaderboard</span>
redis.zadd(<span class="str">"scores"</span>, score, userId);          <span class="cm">// add or update score</span>
redis.zincrby(<span class="str">"scores"</span>, delta, userId);        <span class="cm">// increment atomically</span>
List top10 = redis.zrevrange(<span class="str">"scores"</span>, <span class="num">0</span>, <span class="num">9</span>); <span class="cm">// top-10 O(K)</span>

<span class="cm">// Java min-heap for top-K from a stream</span>
PriorityQueue&lt;Integer&gt; heap = <span class="kw">new</span> PriorityQueue&lt;&gt;(); <span class="cm">// min at top</span>
<span class="kw">for</span> (<span class="kw">int</span> x : stream) {
    heap.offer(x);
    <span class="kw">if</span> (heap.size() &gt; K) heap.poll(); <span class="cm">// evict smallest</span>
}`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 90 · Event-Driven Architecture</h3>
        <ul>
          <li><strong>Event Sourcing:</strong> state is stored as an append-only log of immutable events. Current state = replay of all events. Audit log is free; time-travel is possible; rebuild any projection.</li>
          <li><strong>CQRS (Command Query Responsibility Segregation):</strong> write path (commands) and read path (queries) are separate services/tables optimized independently. Read models are denormalized projections rebuilt from events.</li>
          <li><strong>Saga pattern:</strong> a long-running distributed transaction broken into local steps, each with a compensating transaction (undo). If step N fails, compensations run in reverse from N-1 to 1.</li>
          <li><strong>Choreography vs Orchestration:</strong> choreography = services react to events from each other (no central coordinator). Orchestration = a saga coordinator tells each service what to do (easier to reason about but SPOF risk).</li>
          <li><strong>Eventual consistency:</strong> writes propagate asynchronously; read models may lag. Design for it: show "updating…" instead of stale data, use idempotent consumers.</li>
        </ul>
        <Code html={`<span class="cm">// Event Sourcing: state = replay of immutable events</span>
<span class="kw">interface</span> Event { Instant occurredAt(); }
<span class="kw">record</span> OrderPlaced(String orderId, Money amount, Instant occurredAt) <span class="kw">implements</span> Event {}
<span class="kw">record</span> PaymentConfirmed(String orderId, Instant occurredAt) <span class="kw">implements</span> Event {}

<span class="cm">// Saga: each step has a compensating action (undo) if a later step fails</span>
<span class="cm">// Step 1: reserve inventory  — compensate: release inventory</span>
<span class="cm">// Step 2: charge payment     — compensate: refund payment</span>
<span class="cm">// Step 3: dispatch shipment  — compensate: cancel shipment</span>`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 91 · Database Sharding</h3>
        <ul>
          <li><strong>Why shard:</strong> a single DB node cannot handle the write throughput or data volume of a large system. Sharding partitions data across multiple nodes.</li>
          <li><strong>Range sharding:</strong> keys 0–999 on shard A, 1000–1999 on shard B. Simple, supports range scans. Risk: sequential inserts all hit one shard (hot shard).</li>
          <li><strong>Hash sharding:</strong> shard = hash(key) % N. Even distribution, no range scans. Adding/removing nodes moves (N-1)/N of keys — use consistent hashing instead.</li>
          <li><strong>Directory sharding:</strong> a lookup table maps key ranges to shard IDs. Maximum flexibility; the directory is a SPOF if not replicated.</li>
          <li><strong>Shard key rules:</strong> high cardinality, uniform distribution, queries include the shard key (avoid scatter-gather), immutable once set.</li>
          <li><strong>Virtual shards:</strong> create 1,000 logical shards mapped to N physical nodes. Adding a physical node = reassign some virtual shards. No key rehashing needed.</li>
        </ul>
        <Code html={`<span class="cm">// Hash sharding: determine which shard holds a key</span>
<span class="kw">int</span> shardId = Math.abs(key.hashCode()) % NUM_SHARDS;
DataSource ds = shards.get(shardId);

<span class="cm">// Virtual shards: logical partition → physical node mapping</span>
<span class="cm">// virtualShard = hash(key) % 1000  (fixed, never changes)</span>
<span class="cm">// physicalNode = lookupTable[virtualShard]  (reassign without rehashing)</span>`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 92 · API Gateway &amp; Service Mesh</h3>
        <ul>
          <li><strong>API Gateway:</strong> single entry point for all client requests. Responsibilities: authentication (JWT), authorization, rate limiting per client, request routing, response aggregation, SSL termination, logging.</li>
          <li><strong>Filter chain:</strong> each concern is a filter (Chain of Responsibility, Day 36). A request passes through auth → rate-limit → logging → routing → backend call → response filters in order.</li>
          <li><strong>JWT validation at gateway:</strong> the gateway validates the token signature and expiry; upstream services trust the gateway-forwarded user identity without re-validating.</li>
          <li><strong>Service Mesh:</strong> a sidecar proxy (e.g. Envoy) injected next to every service instance. Handles mTLS, retries, circuit breaking, tracing, and load balancing transparently — without code changes.</li>
          <li><strong>Gateway vs Service Mesh:</strong> gateway = north-south traffic (client → services). Service mesh = east-west traffic (service → service).</li>
          <li><strong>Rate limiting at gateway:</strong> per-client token bucket or sliding window counter, stored in Redis so all gateway instances share state. Return 429 with Retry-After header.</li>
        </ul>
        <Code html={`<span class="cm">// API Gateway filter chain — Chain of Responsibility (Day 36)</span>
<span class="kw">interface</span> Filter {
    <span class="kw">void</span> handle(Request req, FilterChain chain);
}

<span class="kw">class</span> AuthFilter <span class="kw">implements</span> Filter {
    <span class="kw">public void</span> handle(Request req, FilterChain chain) {
        <span class="kw">if</span> (!jwt.isValid(req.token)) { req.respond(<span class="num">401</span>); <span class="kw">return</span>; }
        chain.next(req);   <span class="cm">// pass to next filter in chain</span>
    }
}`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 93 · Observability</h3>
        <ul>
          <li><strong>Three pillars:</strong> Logs (what happened), Metrics (how much / how fast), Traces (where time was spent across services).</li>
          <li><strong>Structured logs:</strong> emit JSON with fixed fields (timestamp, level, service, traceId, message). Machine-parseable and searchable. Correlation ID ties all logs for one request together.</li>
          <li><strong>Metrics types:</strong> Counter (monotonically increasing — requests total), Gauge (current value — heap used), Histogram (distribution — latency buckets, P50/P95/P99).</li>
          <li><strong>RED method:</strong> Rate (requests/sec), Errors (error rate), Duration (latency). Three numbers that describe the health of any service from the outside.</li>
          <li><strong>Distributed traces:</strong> a trace ID follows a request across all services. Each service creates a span with parent span ID, start time, duration, and tags. Assembling spans for one trace shows the full call graph.</li>
          <li><strong>OpenTelemetry:</strong> vendor-neutral SDK and wire protocol for all three pillars. Instrument once, export to any backend (Prometheus, Jaeger, Datadog, etc.).</li>
        </ul>
        <Code html={`<span class="cm">// W3C traceparent header — propagated across every service hop</span>
<span class="cm">// traceparent: 00-{traceId}-{spanId}-{flags}</span>
<span class="cm">// e.g.  traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01</span>

<span class="cm">// RED metrics for a service</span>
Counter requests  = Counter.build(<span class="str">"http_requests_total"</span>).register();
Counter errors    = Counter.build(<span class="str">"http_errors_total"</span>).register();
Histogram latency = Histogram.build(<span class="str">"http_duration_seconds"</span>)
                             .buckets(<span class="num">0.01</span>, <span class="num">0.05</span>, <span class="num">0.1</span>, <span class="num">0.5</span>, <span class="num">1.0</span>).register();`} />
      </section>

      {/* ===== SECTION 3 — The week in a table ===== */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The week in one table</h2>
        <table className="matrix">
          <thead>
            <tr>
              <th>Day · Topic</th>
              <th>Core pattern</th>
              <th>Key Java class / tool</th>
              <th>Gotcha to remember</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>81 · Distributed Cache</td>
              <td>Cache-aside with DELETE on write</td>
              <td>Redis String, Hash, SortedSet; SET NX EX</td>
              <td>Never UPDATE cache in cache-aside — always DELETE to avoid stale-write race</td>
            </tr>
            <tr>
              <td>82 · Search Autocomplete</td>
              <td>Trie + top-K stored at every node</td>
              <td><C>Map&lt;Character, TrieNode&gt;</C>; <C>PriorityQueue</C> for top-K</td>
              <td>Top-K write updates ALL ancestor nodes — O(K×L) per insert</td>
            </tr>
            <tr>
              <td>83 · File Storage</td>
              <td>Content-addressable chunks + refCount GC</td>
              <td>SHA-256 MessageDigest; metadata DB + block store</td>
              <td>Delete a chunk ONLY when refCount reaches 0 — not when any one FileVersion is deleted</td>
            </tr>
            <tr>
              <td>84 · Circuit Breaker</td>
              <td>CLOSED → OPEN → HALF_OPEN state machine</td>
              <td>Resilience4j <C>@CircuitBreaker</C>, <C>@Retry</C>, <C>@TimeLimiter</C></td>
              <td>Retry goes INSIDE the circuit breaker so each attempt counts toward the trip threshold</td>
            </tr>
            <tr>
              <td>85 · Consistent Hashing</td>
              <td>TreeMap ring + virtual nodes</td>
              <td><C>TreeMap&lt;Integer,String&gt;</C>; <C>ceilingEntry()</C></td>
              <td>V=1 virtual nodes = severely skewed arcs; use V=150+ for even distribution</td>
            </tr>
            <tr>
              <td>86 · URL Shortener</td>
              <td>Counter + base-62 encoding; 302 redirect</td>
              <td>Redis GET for redirect; async queue for analytics</td>
              <td>301 = browsers cache forever, analytics broken; always use 302</td>
            </tr>
            <tr>
              <td>87 · Search Engine</td>
              <td>Inverted index + TF-IDF; preprocessing symmetry</td>
              <td><C>Map&lt;String,List&lt;Posting&gt;&gt;</C>; two-pointer merge</td>
              <td>Index-time and query-time preprocessing MUST be identical or nothing matches</td>
            </tr>
            <tr>
              <td>88 · Real-time Chat</td>
              <td>WebSocket + Redis Pub/Sub + offline inbox</td>
              <td>WebSocket API; Redis PUBLISH/SUBSCRIBE</td>
              <td>Redis Pub/Sub is ephemeral — always write to DB before publishing for offline delivery</td>
            </tr>
            <tr>
              <td>89 · Leaderboard &amp; Top-K</td>
              <td>Redis Sorted Set; min-heap O(N log K)</td>
              <td>Redis ZADD/ZINCRBY/ZREVRANGE; <C>PriorityQueue</C></td>
              <td>ZINCRBY is atomic — safe for concurrent score updates without a separate lock</td>
            </tr>
            <tr>
              <td>90 · Event-Driven Architecture</td>
              <td>Event Sourcing (log+replay) + CQRS + Saga</td>
              <td>Kafka / EventStore; immutable event records</td>
              <td>Read models may lag — design for eventual consistency, not immediate reads after writes</td>
            </tr>
            <tr>
              <td>91 · Database Sharding</td>
              <td>Hash / range / directory sharding; virtual shards</td>
              <td>Consistent hashing ring; directory lookup table</td>
              <td>The shard key must be chosen once and is effectively immutable — wrong choice = hot shard forever</td>
            </tr>
            <tr>
              <td>92 · API Gateway &amp; Service Mesh</td>
              <td>Filter chain (Chain of Responsibility, Day 36)</td>
              <td>Spring Cloud Gateway; Envoy sidecar; JWT libraries</td>
              <td>Gateway = north-south (client ↔ services); service mesh = east-west (service ↔ service)</td>
            </tr>
            <tr>
              <td>93 · Observability</td>
              <td>Logs + Metrics + Traces; RED method</td>
              <td>OpenTelemetry SDK; Prometheus; Jaeger / Zipkin</td>
              <td>Correlation ID must be propagated in EVERY outbound call or traces break mid-chain</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ===== SECTION 4 — Memory hooks ===== */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Memory hooks — one line per day</h2>
        <ul>
          <li><strong>Day 81 — Cache-aside write:</strong> DELETE the key, never update it — two threads updating in the wrong order leave stale data forever.</li>
          <li><strong>Day 82 — Trie autocomplete:</strong> the longer the prefix the smaller the subtree — autocomplete speeds up as you type.</li>
          <li><strong>Day 83 — Content-addressed storage:</strong> SHA-256(same bytes anywhere) = same key = same chunk = zero-cost dedup, automatic.</li>
          <li><strong>Day 84 — HALF_OPEN:</strong> you cannot jump OPEN → CLOSED without proof — HALF_OPEN is the probe that verifies recovery before trusting it.</li>
          <li><strong>Day 85 — Consistent hashing:</strong> add 1 server, only its neighbor's arc moves — compare with modulo hashing where ~80% of keys move.</li>
          <li><strong>Day 86 — 302 not 301:</strong> 301 = browsers cache forever = analytics broken forever. Always 302 for any link you want to track or update.</li>
          <li><strong>Day 87 — Preprocessing symmetry:</strong> index "running" as "run" but forget to stem the query → zero results for a valid search. Both pipelines must be identical.</li>
          <li><strong>Day 88 — Redis Pub/Sub is ephemeral:</strong> write to DB first, then publish — or offline recipients never get the message.</li>
          <li><strong>Day 89 — ZINCRBY is atomic:</strong> no locks needed for concurrent leaderboard updates — Redis handles it.</li>
          <li><strong>Day 90 — Event Sourcing state:</strong> current state = replay of the append-only log. Delete nothing; travel in time for free.</li>
          <li><strong>Day 91 — Shard key is immutable:</strong> choose once, get it right — resharding costs enormous migration effort.</li>
          <li><strong>Day 92 — Gateway = north-south, mesh = east-west:</strong> gateway faces clients; mesh faces services.</li>
          <li><strong>Day 93 — Correlation ID in every hop:</strong> propagate the trace ID in every outbound call or distributed traces break mid-chain.</li>
        </ul>
      </section>

      {/* ===== SECTION 5 — Traps ===== */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Traps to never repeat</h2>
        <Warn><strong>Updating the cache instead of invalidating it (Day 81).</strong> Two threads racing to update cache after a DB write can land in the wrong order — a stale value wins until TTL. In cache-aside, always DELETE on write. Never update the entry.</Warn>
        <Warn><strong>Retrying non-idempotent calls without an idempotency key (Day 84).</strong> POST /payments/charge retried after a timeout can double-charge the user. Always add an idempotency key before enabling retry on a state-mutating endpoint.</Warn>
        <Warn><strong>Placing retry OUTSIDE the circuit breaker (Day 84).</strong> The breaker then sees only one logical failure per intent, not individual attempts — it trips far too slowly during an outage. Retry must be INSIDE the CB.</Warn>
        <Warn><strong>Using V=1 virtual nodes in consistent hashing (Day 85).</strong> One virtual node per server creates wildly unequal arc sizes. Use V=150 or more for approximately equal load distribution.</Warn>
        <Warn><strong>Using 301 redirects in a URL shortener (Day 86).</strong> Browsers cache 301 permanently. After one visit the browser bypasses your shortener forever — analytics are broken and destination updates are invisible.</Warn>
        <Warn><strong>Asymmetric preprocessing in search (Day 87).</strong> If you stem at index time but not at query time (or vice versa), valid queries produce zero results. Both pipelines must be identical: same steps, same order, both directions.</Warn>
        <Warn><strong>Relying on Redis Pub/Sub for offline delivery (Day 88).</strong> Pub/Sub is in-memory and ephemeral — messages not consumed at publish time are lost. Always write to a persistent DB inbox before publishing.</Warn>
        <Warn><strong>Choosing a low-cardinality shard key (Day 91).</strong> Sharding by country (200 distinct values) puts a large portion of traffic on the "US" shard. A shard key must be high-cardinality (hashed user_id) and evenly distributed.</Warn>
        <Warn><strong>Dropping the correlation ID on the first outbound call (Day 93).</strong> Every service must read the incoming trace ID from the W3C traceparent header and propagate it in every outgoing call. One service forgetting to forward it breaks the entire distributed trace.</Warn>
        <Warn><strong>Storing file chunks as BLOBs in the metadata DB (Day 83).</strong> Mixing binary data with relational rows kills query performance and prevents independent scaling. The block store is separate for exactly this reason.</Warn>
      </section>

      {/* ===== SECTION 6 — Bonus depth ===== */}
      <section id="s6">
        <div className="sec-label">Section 6 · Bonus depth</div>
        <h2>Corner cases and interview depth</h2>

        <Reveal summary="Cache invalidation race: how it actually breaks (Day 81)">
          <p>Thread A reads cache — miss. Thread A queries DB (gets V1). Thread B writes V2 to DB and deletes the cache key. Thread A writes V1 to cache. Now cache holds stale V1 while DB holds V2. TTL is the only safety net. Write-through avoids this by making the cache write synchronous with the DB write, but at double the write latency.</p>
        </Reveal>

        <Reveal summary="Why chunk dedup can cross user boundaries safely (Day 83)">
          <p>If user A and user B upload identical files, they share chunks in the block store. This is safe because permissions are enforced at the metadata layer (FileVersion, Share rows), not the block store. The block store knows only hashes, not owners. No access control logic belongs in the block store.</p>
        </Reveal>

        <Reveal summary="Circuit breaker threshold tuning (Day 84)">
          <p>Trip threshold must be above the service's baseline error rate or the breaker trips constantly on normal traffic. resetTimeout must be longer than the service's typical recovery time — too short and you probe a still-sick service repeatedly. HALF_OPEN probe count (1 vs N) trades recovery speed against safety: 1 is conservative, N is faster but risks extra load on a recovering service.</p>
        </Reveal>

        <Reveal summary="Consistent hashing: worked example with V=1 vs V=150 (Day 85)">
          <p>3 servers, V=1. Server A at position 100, B at 300, C at 700 on a ring of 1000. Arc sizes: A=400, B=200, C=400. B handles half the load of A. With V=150, each server has 150 random positions; arc sizes average ~333 each. Adding a 4th server inserts 150 more positions and each existing server loses ~1/4 of its arcs — smooth rebalancing.</p>
        </Reveal>

        <Reveal summary="Event Sourcing: when replay is too slow (Day 90)">
          <p>For an account with 10 million events, replaying every event to get current balance is impractical. Solution: periodic snapshots. Store a snapshot of the current state every N events (e.g. every 1,000). On load, start from the latest snapshot and replay only events after it. Snapshots are an optimization — the source of truth is still the event log.</p>
        </Reveal>

        <Reveal summary="Database sharding: cross-shard queries and scatter-gather (Day 91)">
          <p>If a query does not include the shard key, it must fan out to all shards (scatter), collect results from each (gather), merge, and re-sort. This is expensive. Design queries so the shard key is almost always present. For queries that must span shards, aggregate on the application side or use a separate denormalized read model.</p>
        </Reveal>

        <Reveal summary="Service mesh vs API gateway: do you need both? (Day 92)">
          <p>Yes, in large systems. Gateway handles north-south: it is the public-facing edge — it does auth, rate-limiting, SSL termination, and routes external traffic. The service mesh handles east-west: mTLS between services, per-service retries, circuit breaking, and latency-based load balancing — all transparently via sidecars. They solve different layers of the network problem.</p>
        </Reveal>

        <Reveal summary="OpenTelemetry: one SDK, any backend (Day 93)">
          <p>Before OpenTelemetry, instrumenting an app for Datadog meant Datadog SDK; switching to Jaeger meant rewriting all tracing code. OpenTelemetry defines one API and one wire format (OTLP). You instrument once; you configure an exporter to send to any backend. This decouples instrumentation from the observability vendor — exactly the Dependency Inversion principle applied to infrastructure.</p>
        </Reveal>
      </section>

      {/* ===== SECTION 7 — Rapid review ===== */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>Rapid review</h2>
        <p>Recall the answer before revealing — if you hesitate on any card, that is the day to reopen:</p>
        <ReviewDrill items={DRILL} />
      </section>

      {/* ===== SECTION 8 — Quiz ===== */}
      <section id="s8">
        <div className="sec-label">Section 8 · Test yourself</div>
        <h2>Recap quiz — 10 integrative questions</h2>
        <p>Questions cross multiple days. Click an answer; explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 17 revised?</strong> You can now explain the cache-aside invalidation rule and why
        you delete instead of update, describe Trie top-K design and why autocomplete speeds up as you type,
        model a content-addressed chunk store with reference-count GC, layer the full resilience
        stack (Timeout → Retry → CB → Bulkhead → Fallback) with retry inside the circuit breaker,
        explain why consistent hashing moves only 1/N keys, choose 302 over 301 for trackable redirects,
        describe preprocessing symmetry for search, build a real-time chat system with WebSocket and offline
        delivery, use Redis sorted sets for leaderboards, distinguish Event Sourcing from CQRS and explain
        Sagas, apply the right sharding strategy and shard key rules, design an API Gateway filter chain
        using Chain of Responsibility, and instrument a service with the three pillars of observability.
        <br /><br />
        Back to the <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> —
        review any day that felt shaky, then tackle mock interviews combining Month 3 classics with the
        Month 4 resilience and observability layer.
      </div>
    </div>
  )
}
