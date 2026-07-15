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
    q: 'Cache-aside write rule: what do you do to the cache after writing to the DB?',
    o: ['Update the cache entry to match what you wrote to the DB', 'Delete (invalidate) the cache entry', 'Leave the cache alone — it will expire via TTL eventually', 'Write to the cache first, then the DB'],
    a: 1,
    why: 'Delete, never update. If two threads race to update the cache after a DB write, they can write values out of order — one stale value wins and sits in cache until TTL. Deleting is safe: the next read will miss, go to DB, and get the fresh value. TTL alone is acceptable staleness tolerance, not an invalidation strategy.'
  },
  {
    q: 'Why does autocomplete get FASTER as the user types more characters?',
    o: ['The server caches the full word list and returns faster on repeat queries', 'A longer prefix walks deeper into the Trie — the subtree below the prefix node is smaller, so DFS collects fewer results', 'The network payload is smaller for longer prefixes', 'The browser handles completion locally after the first character'],
    a: 1,
    why: 'Trie search time is proportional to the size of the subtree below the prefix node. Typing one character leaves a large subtree (all words starting with that letter). Typing six characters leaves a tiny subtree. Fewer nodes to visit = fewer steps = faster.'
  },
  {
    q: 'What is content-addressable storage?',
    o: ['Storage where content is sorted alphabetically for fast lookup', 'The storage key IS the hash of the content — same bytes anywhere produce the same key, making deduplication automatic', 'A storage system that indexes files by their MIME type', 'Storage that compresses content before writing'],
    a: 1,
    why: 'SHA-256(content) produces a unique fingerprint. If two different users upload the same 4 MB chunk, both get back the same chunk ID — the block store only holds one copy. No dedup logic needed: identity is content identity.'
  },
  {
    q: 'Why does retry go INSIDE the circuit breaker, not outside?',
    o: ['Because retry is faster when placed before the circuit breaker in the stack', 'Retry attempts count as failure attempts toward the circuit breaker trip threshold — retry inside means the breaker sees all attempts', 'Because circuit breakers only work on the final attempt', 'Retry outside would cause infinite retries when the circuit is OPEN'],
    a: 1,
    why: 'If retry is outside the circuit breaker, the breaker only sees one logical "attempt" per call — after all retries are exhausted. An outage would need N×retries failures before the breaker trips, which is dangerously slow. Retry inside means each individual retry counts, so the breaker trips much faster when a service is down.'
  },
  {
    q: 'What is HALF_OPEN in a circuit breaker and why can you not skip it?',
    o: ['A degraded mode where the circuit passes 50% of requests', 'A probe state: after resetTimeout, let a small number of requests through to test if the service recovered', 'A logging mode that records failures without blocking requests', 'A synonym for bulkhead isolation'],
    a: 1,
    why: 'You cannot jump from OPEN straight back to CLOSED because you would be guessing the service is healthy. HALF_OPEN lets a single probe request through. If it succeeds → CLOSED (service recovered). If it fails → back to OPEN (still down). Without HALF_OPEN, a recovered service stays blocked forever or an unrecovered service lets traffic through immediately.'
  },
  {
    q: 'When is a file chunk deleted from the block store?',
    o: ['When all FileVersions that reference it are deleted', 'Only when its reference count reaches zero — no FileVersion anywhere points to that chunk hash', 'When it has not been accessed for 30 days', 'When the owning user deletes their account'],
    a: 1,
    why: 'Chunks are shared across FileVersions (possibly across users via dedup). Deleting on the last FileVersion reference could delete a chunk another FileVersion still needs. The safe rule: decrement refCount on every delete; only remove from block store when refCount hits exactly 0.'
  },
  {
    q: 'What is the thundering herd problem in a distributed cache?',
    o: ['Many servers competing to write to the same database row', 'A popular cache key expires and thousands of concurrent requests all miss, flooding the DB at the same moment', 'A circuit breaker that opens for too many services at once', 'Too many Trie nodes being created during peak traffic'],
    a: 1,
    why: 'When a hot key\'s TTL expires, every request that was relying on it gets a cache miss simultaneously. All of them call the DB to rebuild the value at the same instant. The fix: a mutex (Redis SET NX EX) so only one thread rebuilds; the rest wait. Probabilistic early recompute (refresh before expiry) also prevents the thundering moment.'
  },
  {
    q: 'Resilience stack order — which is innermost and which is outermost?',
    o: ['Circuit Breaker → Retry → Timeout → Bulkhead → Fallback', 'Timeout → Retry → Circuit Breaker → Bulkhead → Fallback (innermost to outermost)', 'Bulkhead → Circuit Breaker → Retry → Timeout → Fallback', 'Fallback → Bulkhead → Circuit Breaker → Retry → Timeout'],
    a: 1,
    why: 'Timeout is per-call (innermost): it caps how long one attempt takes. Retry wraps Timeout: it retries failed/timed-out attempts. Circuit Breaker wraps Retry: it counts failures across attempts and fast-fails when tripped. Bulkhead is outermost per-downstream: it caps total concurrent calls to a service. Fallback is the catch-all around everything.'
  },
]

const QUESTIONS = [
  {
    q: 'After updating a user\'s profile in the database, what should you do to the cache entry?',
    o: [
      'Update the cache entry to match the DB write — keep them in sync',
      'Delete (invalidate) the cache entry so the next read fetches fresh data from DB',
      'Leave the cache alone until TTL expires — it is close enough',
      'Write a new cache entry with a versioned key (e.g. profile:v2:userId)'
    ],
    a: 1,
    e: 'In cache-aside, the application controls cache reads (miss → DB → cache) and invalidations (write DB → delete cache key). Updating the cache at write time risks a race: two threads writing different values can land out of order, leaving a stale value that outlasts any TTL. Delete is always safe: the worst case is one extra DB read on the next cache miss.',
    w: {
      0: 'Write-through (updating both atomically) is a different pattern and requires both writes to succeed together. In cache-aside you do NOT control cache writes — only invalidation. Updating after a DB write creates a race where stale values can win.',
      2: 'TTL is a staleness safety net, not an invalidation strategy. Leaving a stale entry until TTL means users see wrong data for the entire TTL window after every write.',
      3: 'A versioned key is useful for rolling deploys but not for cache invalidation. The old key stays in cache indefinitely; code that still reads the old key will get stale data forever.'
    },
    r: { id: 's2', label: 'Section 2 — Day 81 cheat sheet' }
  },
  {
    q: 'A Trie stores words: "cat", "car", "card", "care". The user has typed "car". How many Trie nodes must the DFS visit to collect all completions?',
    o: [
      'All nodes in the entire Trie (the DFS always starts from root)',
      'Only the nodes in the subtree below the "car" prefix node — 4 nodes for "d", "e", and the "car" isEnd node itself',
      'Exactly 3 nodes (one per character in "car")',
      'The number of nodes equals the number of words in the dictionary'
    ],
    a: 1,
    e: 'Trie search first walks to the prefix node in O(prefix length). Then DFS only explores the subtree rooted at that node — completely ignoring the rest of the Trie. For "car": the subtree contains "car" (isEnd), "card", and "care" — a small sub-tree. The longer the prefix the smaller the subtree and the faster the completion.',
    w: {
      0: 'The root-to-prefix walk is O(prefix length) but then DFS is confined to the subtree below the prefix node. The rest of the Trie is never visited.',
      2: '3 nodes are walked during the prefix descent. DFS then continues from the "r" node into its children — more nodes are visited during collection.',
      3: 'DFS visits nodes in the subtree, not all words. If the prefix filters to a small subtree, DFS visits far fewer nodes than the total dictionary size.'
    },
    r: { id: 's2', label: 'Section 2 — Day 82 cheat sheet' }
  },
  {
    q: 'Two users upload the exact same 4 MB PDF file. How many times is the chunk stored in the block store?',
    o: [
      'Twice — one copy per user for isolation and quota accounting',
      'Once — the chunk hash is the same for identical content; the block store deduplicates automatically',
      'Once per version — if either user uploads a new version, a second copy is stored',
      'It depends on whether the users are in the same organization'
    ],
    a: 1,
    e: 'SHA-256(content) is deterministic. Both uploads produce the same chunk ID. The block store\'s write path checks: does a chunk with this ID already exist? Yes → skip the write, increment the refCount. The single copy is shared. Both users\' FileVersion records point to the same chunk hash. Quota is charged only for the NEW bytes each user adds.',
    w: {
      0: 'Storing per-user would break the whole point of content-addressing. Isolation is handled by the metadata layer (FileVersion, refCount, permissions), not by duplicating bytes in the block store.',
      2: 'New versions only store chunks whose hash CHANGED from the previous version. Unchanged chunks (same hash) are reused at zero extra storage cost.',
      3: 'Deduplication is purely content-based (hash equality). Organization membership is a permission concept, not a storage concept.'
    },
    r: { id: 's2', label: 'Section 2 — Day 83 cheat sheet' }
  },
  {
    q: 'A circuit breaker is OPEN. A request arrives. What happens?',
    o: [
      'The request is queued until the circuit closes',
      'The request is fast-failed immediately without calling the downstream service',
      'The request is forwarded to a backup service automatically',
      'The circuit transitions to HALF_OPEN and lets this request through as a probe'
    ],
    a: 1,
    e: 'When OPEN the circuit breaker short-circuits: it throws an exception (or invokes the fallback) immediately without making the downstream call. This is the entire point — protect both the caller (no wasted wait time) and the downstream service (no extra load while it is struggling). The circuit stays OPEN until resetTimeout expires, then moves to HALF_OPEN for a single probe.',
    w: {
      0: 'Queueing would accumulate work and still hammer the downstream service when it recovers, potentially causing a second outage. Fast-fail is the correct response.',
      2: 'Fallback is a separate layer outside the circuit breaker. The CB itself only fast-fails; what the caller does with that failure (fallback, stale cache, error response) is the fallback layer\'s concern.',
      3: 'Transition to HALF_OPEN happens after resetTimeout, not on the very next request. While OPEN, every request is fast-failed.'
    },
    r: { id: 's2', label: 'Section 2 — Day 84 cheat sheet' }
  },
  {
    q: 'Which retry scenario is DANGEROUS without an idempotency key?',
    o: [
      'Retrying a GET /user/profile endpoint after a network timeout',
      'Retrying a POST /payments/charge endpoint after a network timeout',
      'Retrying a GET /search?q=coffee after a 503 response',
      'Retrying a DELETE /cache/key after a timeout'
    ],
    a: 1,
    e: 'POST /payments/charge is non-idempotent: calling it twice charges the user twice. A network timeout means the server may have already processed the first request — retrying blindly causes a double charge. The fix: include an idempotency key (unique per intent) so the server can detect and ignore the duplicate. GET and DELETE /cache/key are safe to retry (GET is read-only; a cache key delete is naturally idempotent).',
    w: {
      0: 'GET requests are read-only and idempotent by HTTP spec. Retrying a GET is always safe.',
      2: 'GET /search is also read-only. Retrying on 503 is correct and safe — the server explicitly said it is unavailable.',
      3: 'Deleting a cache key that is already gone is a no-op. DELETE /cache/key is idempotent: same result whether called once or N times.'
    },
    r: { id: 's2', label: 'Section 2 — Day 84 cheat sheet' }
  },
  {
    q: 'You need to serve autocomplete suggestions in under 10 ms for millions of queries per second. Which Trie design is correct?',
    o: [
      'Walk to the prefix node, then run DFS and sort the results by frequency at query time',
      'Store the top-K words by frequency at every Trie node; return the stored list in O(K) without DFS at query time',
      'Rebuild the Trie on every request from a sorted word list',
      'Use a flat HashMap from prefix string to word list — the Trie is only for learning'
    ],
    a: 1,
    e: 'Storing top-K at each node trades write cost for read speed. A query walks the prefix (O(prefix length)) then reads the pre-sorted list directly (O(K)). No DFS, no sorting at query time. Writes (new word or frequency update) must update stored top-K at every ancestor node on the path — acceptable because reads vastly outnumber writes in a search product.',
    w: {
      0: 'DFS + sort at query time is O(M log M) where M is the subtree size. Too slow at millions of QPS. This is the naive solution that motivates storing top-K.',
      2: 'Rebuilding the Trie per request is O(dictionary size) — completely impractical for any production workload.',
      3: 'A flat HashMap works for exact prefix lookup but uses more memory (one entry per distinct prefix) and does not support prefix completion efficiently the way a Trie does.'
    },
    r: { id: 's2', label: 'Section 2 — Day 82 cheat sheet' }
  },
  {
    q: 'The bulkhead pattern uses separate thread pools per downstream service. What failure does this prevent?',
    o: [
      'It prevents the downstream service from receiving too many requests',
      'It prevents one slow downstream service from exhausting the shared thread pool and starving unrelated services',
      'It prevents duplicate requests from being sent to the same service',
      'It prevents the circuit breaker from tripping too quickly'
    ],
    a: 1,
    e: 'Without bulkhead, all downstream calls share one thread pool. If the payment service becomes slow, all threads are busy waiting on it — the search service, the recommendation service, and every other downstream call also starve, even though they are healthy. Separate pools (bulkheads) limit the blast radius: payment slowness can only consume the payment pool. The naming comes from watertight compartments on ships.',
    w: {
      0: 'Rate limiting controls how many requests a downstream receives. Bulkhead controls how many threads the CALLER allocates to a given downstream — it protects the caller from self-inflicted thread exhaustion, not the downstream from overload.',
      2: 'Idempotency keys prevent duplicate processing. Bulkhead is about thread isolation, not deduplication.',
      3: 'The circuit breaker trip threshold is a separate concern. Bulkhead prevents thread starvation; the circuit breaker prevents repeated calls to a failing service. They are complementary layers.'
    },
    r: { id: 's2', label: 'Section 2 — Day 84 cheat sheet' }
  },
  {
    q: 'A user deletes version 3 of a file. Version 3 and Version 4 share two chunks (A and B). Version 3 alone owns chunk C. What is deleted from the block store?',
    o: [
      'Chunks A, B, and C — all chunks owned by version 3',
      'Only chunk C — its refCount reaches 0; chunks A and B still have refCount ≥ 1 from version 4',
      'Nothing — file chunks are never deleted, only marked inactive',
      'Chunks A and C — the shared chunk B is kept because it appears in multiple versions'
    ],
    a: 1,
    e: 'On version 3 deletion, the system decrements the refCount of each chunk it references. Chunks A and B each had refCount ≥ 2 (referenced by versions 3 and 4); after decrement they are ≥ 1 — not deleted. Chunk C had refCount = 1 (only version 3 referenced it); after decrement it reaches 0 — deleted from the block store. This is the same algorithm as JVM garbage collection.',
    w: {
      0: 'Deleting shared chunks would corrupt version 4, which still references A and B. The refCount system exists precisely to prevent this.',
      2: 'Block store GC does delete chunks — when their refCount hits 0. The system does not keep chunks forever; that would defeat the purpose of deletion.',
      3: 'The logic is symmetric for all chunks: decrement refCount, delete only if it reaches 0. Chunk B follows the same rule as A — both are kept because version 4 still references them.'
    },
    r: { id: 's2', label: 'Section 2 — Day 83 cheat sheet' }
  },
]

export default function RecapW17() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Revision</div>
        <h1>Week 17 Recap:<br />Distributed Cache, Autocomplete, File Storage &amp; Resilience</h1>
        <p>Days 81–84 in one place: cache invalidation patterns, Trie top-K design, content-addressed
           chunk deduplication, and the full resilience stack. Cheat-sheet, rapid review, recap quiz.</p>
        <div className="chips">
          {['cache-aside invalidate', 'Trie top-K at node', 'SHA-256 chunk IDs', 'refCount GC', 'circuit breaker states', 'retry + idempotency', 'bulkhead isolation', 'resilience stack'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  WEEK 17 (BONUS) — four advanced topics, four complementary muscles

  Day 81  DISTRIBUTED  Cache-aside: read-miss→DB→cache; write→DB→DELETE key   (caching patterns)
  CACHE               Write-through: write cache AND DB synchronously (fresh/slow)
                      TTL = staleness budget; eviction = allkeys-lru (pure cache)
                      Hot-key: L1 in-process LRU + L2 Redis (95% bypass)
                      Stampede: Redis SET NX EX mutex → one filler, rest wait
                      Race: thread A reads stale → B invalidates → A writes stale back
                      Fix: always DELETE on write (never update cache in cache-aside)

  Day 82  SEARCH       Trie node: Map&lt;Char,TrieNode&gt; children + isEnd + frequency  (Trie + top-K)
  AUTO-               Insert O(len); prefix walk O(len); DFS collect O(subtree)
  COMPLETE            Top-K at each node = production: O(K) read, O(K×L) write
                      Radix/compressed Trie: collapse single-child chains → space
                      Scale: prefix sharding by first char(s); nightly offline rebuild
                      Personalization = Decorator wrapping global Trie result

  Day 83  FILE         Chunk = fixed-size slice (e.g. 4 MB); ID = SHA-256(content) (content-CAS)
  STORAGE             Dedup: client sends hashes on init; upload only missing chunks
  SYSTEM              Two stores: metadata DB (File/Folder/Version rows) + block store
                      Upload commit: quota on NEW chunks only; create FileVersion; bump refCounts
                      Delta sync: compare hash manifest; transfer only changed chunks
                      RefCount GC: decrement on version delete; block delete when refCount = 0
                      Versioning is free: unchanged chunks reuse same hash → 0 extra bytes

  Day 84  CIRCUIT      Timeout: P99 × 3 rule of thumb; every remote call must have one  (resilience)
  BREAKER             Retry: transient only; exponential backoff + jitter; never non-idempotent
  &amp;                   CB states: CLOSED (count fails) → OPEN at threshold (fast-fail)
  RESILIENCE            → HALF_OPEN after resetTimeout (probe) → CLOSED on success
                      Fallback: stale cache / default / degraded — always plan B
                      Bulkhead: separate thread pools per downstream (blast radius limit)
                      Stack (inside-out): Timeout → Retry → CB → Bulkhead → Fallback
                      Retry INSIDE CB: each retry counts toward trip threshold`} />
        <Note><strong>The big idea:</strong> All four days share one meta-theme — <em>protect shared state under load</em>.
          Caching protects the DB. The Trie's top-K stores protect query latency. Chunk deduplication protects
          storage under concurrent uploads. The resilience stack protects services from each other. Week 17
          is about designing systems that degrade gracefully instead of collapsing.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 81 · Distributed Cache</h3>
        <ul>
          <li><strong>Cache-aside read:</strong> check cache → miss → query DB → write result to cache → return. Hit ratio determines DB load.</li>
          <li><strong>Cache-aside write:</strong> write DB → <em>DELETE</em> the cache key. Never update the cache entry at write time — two concurrent writes can land out of order, leaving a stale value permanently.</li>
          <li><strong>Write-through:</strong> write cache AND DB synchronously every time. Guarantees freshness; write latency doubles. Use when reads need guaranteed freshness and write volume is low.</li>
          <li><strong>TTL:</strong> the acceptable staleness window. Shorter = more misses + fresher. Longer = fewer misses + staler. TTL is a safety net, not an invalidation strategy.</li>
          <li><strong>Eviction policies:</strong> <C>allkeys-lru</C> for a pure cache (evict LRU when memory full); <C>noeviction</C> for a session store (never discard — accept errors instead).</li>
          <li><strong>Hot-key fix:</strong> L1 = in-process LRU (HashMap + DLL, Day 56 pattern); L2 = Redis. 95% of reads for hot keys never leave the JVM.</li>
          <li><strong>Cache stampede fix:</strong> <C>SET lock:key "" NX EX 5</C> — only the thread that acquires the lock fills the cache. All others poll or wait on a condition.</li>
          <li><strong>Redis data structures:</strong> String (simple value/counter), Hash (object fields), List (queue/timeline), SortedSet (leaderboard/rate-limiter), Set (unique memberships).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 82 · Search Autocomplete</h3>
        <ul>
          <li><strong>Trie node:</strong> <C>Map&lt;Character, TrieNode&gt; children</C>, <C>boolean isEnd</C>, <C>int frequency</C>.</li>
          <li><strong>Insert:</strong> O(word length) — walk/create one node per character, mark <C>isEnd = true</C> at last node.</li>
          <li><strong>Prefix search (naive):</strong> walk to prefix node → DFS collect all <C>isEnd</C> descendants → sort by frequency. O(M log M) — too slow for production.</li>
          <li><strong>Top-K at each node (production):</strong> each node stores its top K completions sorted by frequency. Query = walk prefix O(L) + return stored list O(K). Writes update stored lists at all ancestors.</li>
          <li><strong>Radix / compressed Trie:</strong> collapse single-child chains into one node holding the concatenated label. Same lookup speed, far less memory.</li>
          <li><strong>Scale:</strong> shard by first 1–2 characters (all words starting with "ca" go to one shard). Frequency data is aggregated from query logs offline; Trie is rebuilt nightly.</li>
          <li><strong>Personalization:</strong> a Decorator wraps the global Trie result and re-ranks or appends personal history (Day 27 pattern — same interface, extra behaviour).</li>
          <li><strong>Key insight:</strong> autocomplete gets FASTER as the user types more — longer prefix → smaller subtree → fewer nodes to visit.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 83 · File Storage System</h3>
        <ul>
          <li><strong>Chunking:</strong> split each file into fixed-size slices (e.g. 4 MB). Chunk <C>id = SHA-256(chunkBytes)</C>.</li>
          <li><strong>Upload protocol:</strong> client sends list of chunk hashes → server responds with which hashes are missing → client uploads only those chunks. Already-known hashes are free.</li>
          <li><strong>Two-store architecture:</strong> <em>metadata DB</em> (File, Folder, Share, FileVersion, chunk reference list) + <em>block store</em> (raw bytes keyed by chunk hash).</li>
          <li><strong>Upload commit:</strong> quota check counts only NEW chunks (deduped chunks are shared). Create <C>FileVersion</C> row. Increment <C>refCount</C> for each chunk in this version.</li>
          <li><strong>Delta sync:</strong> client hashes all local chunks → diffs against server manifest → uploads changed chunks / downloads missing ones. Only bytes that actually changed cross the wire.</li>
          <li><strong>Reference-count GC:</strong> when a <C>FileVersion</C> is deleted, decrement <C>refCount</C> for each of its chunks. Delete the chunk from the block store only when <C>refCount == 0</C>.</li>
          <li><strong>Versioning is cheap:</strong> unchanged chunks share the same hash across versions. Uploading a new version of a 1 GB file with one small edit stores only the changed chunks.</li>
          <li><strong>Restore to old version:</strong> create a new <C>FileVersion</C> pointing to the old chunk IDs. Zero new bytes written if all chunks still exist.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 84 · Circuit Breaker &amp; Resilience</h3>
        <ul>
          <li><strong>Timeout:</strong> every remote call must have a deadline. Rule of thumb: P99 latency × 3. Without timeout, a slow downstream hangs threads forever.</li>
          <li><strong>Retry:</strong> for transient failures only (network blip, 503). Use exponential backoff (100 ms → 200 ms → 400 ms). Add jitter (random offset) to prevent thundering-herd retries. NEVER retry non-idempotent calls without an idempotency key.</li>
          <li><strong>Circuit Breaker states:</strong> <C>CLOSED</C> (normal — count failures) → <C>OPEN</C> when failure rate exceeds threshold (fast-fail all requests) → <C>HALF_OPEN</C> after <C>resetTimeout</C> (let one probe through) → <C>CLOSED</C> on probe success or back to <C>OPEN</C> on probe failure.</li>
          <li><strong>Fallback:</strong> what to do when the circuit is OPEN or the call fails. Options: return stale cached data, return a safe default, return a degraded response. Always design a plan B.</li>
          <li><strong>Bulkhead:</strong> give each downstream service its own thread pool. Payment pool saturation cannot starve the search pool. Named after watertight ship compartments.</li>
          <li><strong>Stack order (inside-out):</strong> Timeout → Retry → Circuit Breaker → Bulkhead → Fallback. Timeout is innermost (per attempt); Fallback is outermost (last resort).</li>
          <li><strong>Retry inside CB:</strong> each retry attempt is a separate call — it counts as a failure toward the CB trip threshold. Retry outside CB means the breaker sees only the final logical failure, which makes it much slower to detect outages.</li>
          <li><strong>Resilience4j:</strong> Java library — <C>@CircuitBreaker</C>, <C>@Retry</C>, <C>@TimeLimiter</C>, <C>@Bulkhead</C> annotations apply the same concepts declaratively.</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 The week in one table</h2>
        <table className="matrix">
          <thead>
            <tr>
              <th>day · topic</th>
              <th>key insight</th>
              <th>core pattern / structure</th>
              <th>interview signal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>81 · Distributed Cache</td>
              <td>Invalidate (DELETE) cache on write — never update in cache-aside</td>
              <td>L1 in-process + L2 Redis; SET NX EX stampede lock</td>
              <td>"I use cache-aside with DELETE on write and TTL as a safety net"</td>
            </tr>
            <tr>
              <td>82 · Search Autocomplete</td>
              <td>Autocomplete gets faster as you type — longer prefix, smaller subtree</td>
              <td>Trie + top-K stored at each node; radix compression; prefix sharding</td>
              <td>"Store top-K at each node — O(1) suggestion read vs O(M log M) DFS+sort"</td>
            </tr>
            <tr>
              <td>83 · File Storage System</td>
              <td>Chunk ID = SHA-256(content) → dedup is structural, not algorithmic</td>
              <td>Metadata DB + block store; refCount GC; delta sync by hash manifest</td>
              <td>"Only new chunks cost quota; restoring old versions writes zero bytes"</td>
            </tr>
            <tr>
              <td>84 · Circuit Breaker &amp; Resilience</td>
              <td>CLOSED→OPEN→HALF_OPEN is a state machine, not a boolean flag</td>
              <td>Timeout→Retry→CB→Bulkhead→Fallback stack; retry inside CB</td>
              <td>"Retry goes inside the circuit breaker so each attempt counts toward the trip"</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>Cache-aside write rule:</strong> delete the cache key on write — never write to cache and DB in two separate steps. Two steps = race condition. Delete = safe invalidation.</li>
          <li><strong>Trie lookup gets faster as you type:</strong> more characters → deeper prefix walk → smaller subtree below the prefix node → fewer nodes to visit.</li>
          <li><strong>Chunk ID is content:</strong> SHA-256(same bytes anywhere) = same ID = same chunk = automatic dedup. No dedup algorithm needed — identity is content identity.</li>
          <li><strong>HALF_OPEN exists to verify, not guess:</strong> you cannot jump OPEN → CLOSED without proof the service recovered. HALF_OPEN lets one probe through to verify.</li>
          <li><strong>Bulkhead = ship compartments:</strong> one compartment flooding does not sink the ship. One slow downstream does not starve unrelated services.</li>
          <li><strong>Retry + jitter:</strong> without jitter, all clients retry at exactly t = 100 ms together — thundering herd of retries. Jitter adds a random offset (e.g. 0–50 ms) to spread them out.</li>
          <li><strong>RefCount GC:</strong> a chunk is never deleted while any FileVersion references it. decrement → delete only when count == 0. Same as JVM garbage collection.</li>
          <li><strong>Resilience stack order:</strong> Timeout is innermost (per call). Retry wraps it (per intent). Circuit Breaker wraps that (across intents). Bulkhead is outermost (across services). Fallback catches everything.</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps to never repeat</h2>
        <Warn><strong>Updating the cache instead of invalidating it.</strong> Two threads can race to write stale values after a DB write — one wins and sits in cache past its TTL. In cache-aside, always DELETE on write. Never update.</Warn>
        <Warn><strong>Retrying non-idempotent calls without an idempotency key.</strong> POST /payments/charge retried after a timeout can double-charge the user. The server may have already processed the first call. Always check idempotency before adding retry.</Warn>
        <Warn><strong>Treating the circuit breaker as a boolean flag (on/off).</strong> Without HALF_OPEN, you re-open immediately on the first failure after timeout — causing an infinite OPEN → CLOSED → OPEN loop. HALF_OPEN is the probe that proves recovery before fully re-opening.</Warn>
        <Warn><strong>Storing chunk bytes in the metadata DB.</strong> BLOBs in the metadata store kill query performance and prevent independent scaling of file bytes vs file records. The block store is separate for exactly this reason.</Warn>
        <Warn><strong>One global Redis connection pool for all services.</strong> Like one global thread pool, it becomes a bottleneck. Use a connection pool per downstream service, or at minimum use connection pooling (Lettuce, Jedis pool) with sensible per-service limits.</Warn>
        <Warn><strong>Skipping jitter on retry backoff.</strong> All service instances fail at the same time and retry at the same intervals — thundering-herd retries amplify the original outage. Add random jitter to each backoff interval.</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Bonus depth</div>
        <h2>💡 Corner cases and interview depth</h2>
        <Reveal summary="Cache invalidation race: how it actually breaks">
          <p>Thread A reads a value → cache miss → queries DB (gets value V1) → before A writes to cache, thread B writes a new value V2 to DB and deletes the cache key → thread A writes V1 to cache. Now the cache holds stale V1 and the DB holds V2. TTL is the only safety net. Short TTL catches this; long TTL leaves stale data until expiry. Write-through (write cache and DB atomically) eliminates the race but at write latency cost.</p>
        </Reveal>
        <Reveal summary="Why radix compression matters for Trie memory">
          <p>A naive Trie for English words stores a node per character. A word like "strawberry" needs 10 nodes. Most of those nodes have exactly one child — they are just pass-through. A radix Trie collapses the chain "s→t→r→a→w→b→e→r→r→y" into a single node holding the string "strawberry". For a dictionary with many long words, radix compression can reduce node count by 60–80%.</p>
        </Reveal>
        <Reveal summary="Why NOT to use double for money — the chunk quota case">
          <p>Chunk sizes are stored as longs (bytes). Quota is accumulated as a long (total bytes). Fine. But if you compute PRICE per GB using double arithmetic (chunkBytes / 1_073_741_824.0 * pricePerGB), you introduce floating-point rounding. Multiply that by millions of chunks and you get billing errors. Always compute billing in integer units (e.g. paise, cents) using BigDecimal or long arithmetic.</p>
        </Reveal>
        <Reveal summary="Circuit breaker threshold tuning">
          <p>Trip threshold (e.g. 50% failure rate over 10 calls) must be tuned to the service's normal error rate. A service with 5% baseline errors needs a threshold above 5% or it trips constantly. resetTimeout must be longer than the service's typical recovery time — too short and you probe a still-sick service repeatedly. HALF_OPEN probe count (1 vs N requests) trades recovery speed against safety: 1 probe is conservative; N probes are faster but risk more load on a recovering service.</p>
        </Reveal>
        <Reveal summary="Chunk dedup across user boundaries — security implications">
          <p>If user A and user B upload the same file, they share the same chunk in the block store. User A's permissions should NOT give them access to user B's file — permissions are enforced at the metadata layer (FileVersion, Share rows), not the block store. The block store only knows chunk hashes, not who owns what. This design is safe as long as the metadata layer is correct — but it means the block store cannot enforce access control by itself.</p>
        </Reveal>
        <Reveal summary="Retry + idempotency key implementation">
          <p>Idempotency key = client-generated UUID tied to one logical intent (e.g. "charge this card for this order"). On the server side: before processing, check a table: <C>idempotency_keys(key, status, response_body)</C>. If key exists and status = COMPLETED, return the cached response. If key exists and status = IN_PROGRESS, return 409. If key does not exist, insert it (IN_PROGRESS), process, update to COMPLETED. This makes any endpoint safe to retry regardless of verb.</p>
        </Reveal>
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Recall the answer before revealing — if you hesitate on any card, that is the day to reopen:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s8">
        <div className="sec-label">Section 8 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across all four days of Week 17.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 17 revised?</strong> You can now explain the cache-aside invalidation rule and why
        you delete instead of update, describe the Trie top-K design and why autocomplete speeds up as you
        type, model a content-addressed chunk store with reference-count GC, and layer the full resilience
        stack — Timeout → Retry → Circuit Breaker → Bulkhead → Fallback — with retry placed inside the
        circuit breaker. That is the Week 17 muscle in full.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        You have completed the bonus week. Review any day that felt shaky and then tackle mock interviews
        with full-system design questions combining Month 3 classics with the Month 4 resilience layer.
      </div>
    </div>
  )
}
