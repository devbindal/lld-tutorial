import { useState, useEffect, useRef } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Cache-aside simulator
   DB: Alice / Bob / Carol with version numbers
   Cache: starts empty, entries get TTL countdown
   ============================================================ */

const DB_DATA = {
  alice: { name: 'Alice', age: 30, city: 'New York' },
  bob:   { name: 'Bob',   age: 25, city: 'London'   },
  carol: { name: 'Carol', age: 28, city: 'Tokyo'    },
}

const TTL_SECONDS = 12   // short so the learner can watch it expire

function CacheAsideDemo() {
  // cache: { [key]: { value: string, expiresAt: number } }
  const [cache, setCache]   = useState({})
  const [log, setLog]       = useState([])
  const [now, setNow]       = useState(Date.now)
  const [dbVersion, setDbVersion] = useState({ alice: 1, bob: 1, carol: 1 })

  // tick every second so TTL countdown updates
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  function addLog(msg, type = 'info') {
    setLog(prev => [{ msg, type, id: Date.now() + Math.random() }, ...prev].slice(0, 8))
  }

  function getUser(userId) {
    const entry = cache[userId]
    if (entry && entry.expiresAt > Date.now()) {
      addLog(`GET ${userId} → CACHE HIT (+2 ms)`, 'hit')
      return
    }
    // cache miss — read from "DB"
    const latency = 150
    addLog(`GET ${userId} → CACHE MISS — reading DB (+${latency} ms)...`, 'miss')
    setTimeout(() => {
      const value = JSON.stringify(DB_DATA[userId])
      setCache(prev => ({
        ...prev,
        [userId]: { value, expiresAt: Date.now() + TTL_SECONDS * 1000 },
      }))
      addLog(`  cached ${userId} (TTL ${TTL_SECONDS}s)`, 'info')
    }, 300)
  }

  function updateUser(userId) {
    // write to DB first, then invalidate cache
    setDbVersion(prev => ({ ...prev, [userId]: prev[userId] + 1 }))
    setCache(prev => {
      const next = { ...prev }
      delete next[userId]
      return next
    })
    addLog(`UPDATE ${userId} → wrote DB v${dbVersion[userId] + 1} → INVALIDATED cache key`, 'evict')
  }

  const users = ['alice', 'bob', 'carol']
  const logColors = { hit: '#1a7a3c', miss: '#b05000', info: '#2D5BFF', evict: '#c0002a' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · cache-aside — miss populates cache, update invalidates it, TTL auto-expires</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {users.map(u => (
          <button key={u} className="act" style={{ fontSize: 12 }} onClick={() => getUser(u)}>
            GET {u}
          </button>
        ))}
        {users.map(u => (
          <button key={u + 'u'} className="ghost act" style={{ fontSize: 12 }} onClick={() => updateUser(u)}>
            UPDATE {u}
          </button>
        ))}
        <button className="ghost act" style={{ fontSize: 12 }} onClick={() => { setCache({}); setLog([]) }}>
          reset
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        {/* Database panel */}
        <div style={{ flex: '1 1 180px', border: '1.5px solid var(--line)', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: '#7c8aa5', marginBottom: 6 }}>DATABASE (source of truth)</div>
          {users.map(u => (
            <div key={u} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, marginBottom: 3 }}>
              {u}: v{dbVersion[u]} · {DB_DATA[u].city}
            </div>
          ))}
        </div>

        {/* Cache panel */}
        <div style={{ flex: '1 1 220px', border: '1.5px dashed #2D5BFF', borderRadius: 8, padding: 10, background: '#f4f7ff' }}>
          <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: '#2D5BFF', marginBottom: 6 }}>REDIS CACHE</div>
          {users.map(u => {
            const entry = cache[u]
            const valid = entry && entry.expiresAt > now
            const ttlLeft = valid ? Math.max(0, Math.ceil((entry.expiresAt - now) / 1000)) : 0
            return (
              <div key={u} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, marginBottom: 4,
                color: valid ? '#1a7a3c' : '#aaa' }}>
                {valid
                  ? `${u}: ${JSON.parse(entry.value).city} · TTL ${ttlLeft}s`
                  : `${u}: — (not cached)`}
              </div>
            )
          })}
          {Object.keys(cache).length === 0 && (
            <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'IBM Plex Mono' }}>(empty)</div>
          )}
        </div>
      </div>

      {/* Log */}
      <div style={{ background: '#1B2A4A', borderRadius: 8, padding: 10, minHeight: 80 }}>
        {log.length === 0 && (
          <div style={{ color: '#555', fontFamily: 'IBM Plex Mono', fontSize: 11 }}>click GET or UPDATE to see the log...</div>
        )}
        {log.map(l => (
          <div key={l.id} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: logColors[l.type] || '#ccc', marginBottom: 2 }}>
            {l.msg}
          </div>
        ))}
      </div>

      <Good>Click GET alice twice — first is a miss (+150 ms), second is a hit (+2 ms). Then UPDATE alice and GET again: the cache was invalidated, so you get another miss. Wait {TTL_SECONDS}s and GET again: TTL expired, miss again.</Good>
    </div>
  )
}

/* ============================================================
   Demo 2 — Eviction policy comparison (LRU vs LFU)
   capacity = 3, show a sequence of accesses that causes them
   to disagree on the eviction victim
   ============================================================ */

function lruEvict(cache, key) {
  // cache = array of { key, freq, order } — order = last access time
  let next = cache.filter(e => e.key !== key)
  const existing = cache.find(e => e.key === key)
  next = [{ key, freq: (existing ? existing.freq : 0) + 1, order: Date.now() + Math.random() }, ...next]
  let evicted = null
  if (next.length > 3) {
    // LRU: evict smallest order (oldest access)
    const victim = next.reduce((a, b) => a.order < b.order ? a : b)
    evicted = victim.key
    next = next.filter(e => e.key !== victim.key)
  }
  return { next, evicted }
}

function lfuEvict(cache, key) {
  let next = cache.filter(e => e.key !== key)
  const existing = cache.find(e => e.key === key)
  next = [{ key, freq: (existing ? existing.freq : 0) + 1, order: Date.now() + Math.random() }, ...next]
  let evicted = null
  if (next.length > 3) {
    // LFU: evict smallest freq (ties broken by oldest order)
    const victim = next.reduce((a, b) => {
      if (a.freq !== b.freq) return a.freq < b.freq ? a : b
      return a.order < b.order ? a : b
    })
    evicted = victim.key
    next = next.filter(e => e.key !== victim.key)
  }
  return { next, evicted }
}

const POLICY_SEQUENCE = [
  { key: 'B', label: 'Access B (3×)', multi: 3 },
  { key: 'A', label: 'Access A' },
  { key: 'C', label: 'Access C' },
  { key: 'D', label: 'Access D → eviction!' },
]

function EvictionDemo() {
  const [lruCache, setLruCache] = useState([])
  const [lfuCache, setLfuCache] = useState([])
  const [step, setStep]         = useState(0)
  const [lastEvict, setLastEvict] = useState({ lru: null, lfu: null })

  function applyStep(idx) {
    const s = POLICY_SEQUENCE[idx]
    const times = s.multi || 1

    let curLru = [...lruCache]
    let curLfu = [...lfuCache]
    let lruEvicted = null
    let lfuEvicted = null

    for (let i = 0; i < times; i++) {
      const r1 = lruEvict(curLru, s.key); curLru = r1.next; if (r1.evicted) lruEvicted = r1.evicted
      const r2 = lfuEvict(curLfu, s.key); curLfu = r2.next; if (r2.evicted) lfuEvicted = r2.evicted
    }

    setLruCache(curLru)
    setLfuCache(curLfu)
    setLastEvict({ lru: lruEvicted, lfu: lfuEvicted })
    setStep(idx + 1)
  }

  function reset() {
    setLruCache([]); setLfuCache([]); setStep(0); setLastEvict({ lru: null, lfu: null })
  }

  const CacheView = ({ items, evicted, label, color }) => (
    <div style={{ flex: '1 1 160px', border: `1.5px solid ${color}`, borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color, marginBottom: 8 }}>{label}</div>
      {items.length === 0 && <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'IBM Plex Mono' }}>(empty)</div>}
      {items.map(e => (
        <div key={e.key} style={{ display: 'flex', justifyContent: 'space-between',
          fontFamily: 'IBM Plex Mono', fontSize: 12, marginBottom: 4,
          background: '#f8f8f8', borderRadius: 5, padding: '3px 8px' }}>
          <span><b>{e.key}</b></span>
          <span style={{ color: '#888', fontSize: 10 }}>freq={e.freq}</span>
        </div>
      ))}
      {evicted && (
        <div style={{ marginTop: 6, fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#c0002a',
          background: '#FDECEC', borderRadius: 5, padding: '3px 8px' }}>
          evicted: <b>{evicted}</b>
        </div>
      )}
    </div>
  )

  return (
    <div className="panel">
      <div className="ptitle">Live demo · LRU vs LFU — follow the sequence to see them disagree</div>

      <div style={{ marginBottom: 10, fontSize: 13, color: '#444' }}>
        Sequence: B accessed 3× (high frequency), then A, then C, then D (triggers eviction).
        <br />LRU cares about <b>recency</b>. LFU cares about <b>frequency</b>. Who gets evicted?
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {POLICY_SEQUENCE.map((s, i) => (
          <button key={i} className={step > i ? 'ghost act' : 'act'}
            style={{ fontSize: 12, opacity: step > i ? 0.5 : 1 }}
            disabled={step > i || (i > 0 && step < i)}
            onClick={() => applyStep(i)}>
            {step > i ? '✓ ' : ''}{s.label}
          </button>
        ))}
        <button className="ghost act" style={{ fontSize: 12 }} onClick={reset}>reset</button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <CacheView items={lruCache} evicted={lastEvict.lru} label="LRU (evicts least-recently-used)" color="#2D5BFF" />
        <CacheView items={lfuCache} evicted={lastEvict.lfu} label="LFU (evicts least-frequently-used)" color="#1a7a3c" />
      </div>

      <Note>After the final step: LRU evicts <b>C</b> (accessed furthest back). LFU evicts <b>A or C</b> (both freq=1, B has freq=3 and is protected). This is the key difference: LFU protects frequently-accessed "hot" items even if they weren't accessed recently.</Note>
    </div>
  )
}

/* ============================================================
   Demo 3 — Cache stampede / hot-key + mutex lock
   ============================================================ */

function StampedeDemo() {
  const [concurrency, setConcurrency] = useState(5)
  const [mutexEnabled, setMutexEnabled]  = useState(false)
  const [running, setRunning]           = useState(false)
  const [threads, setThreads]           = useState([])   // { id, state: 'waiting'|'db'|'cached'|'queued' }
  const [dbHits, setDbHits]             = useState(0)
  const [log, setLog]                   = useState([])
  const lockRef = useRef(false)

  function addLog(msg, type = 'info') {
    setLog(prev => [{ msg, type, id: Date.now() + Math.random() }, ...prev].slice(0, 10))
  }

  async function simulate() {
    setRunning(true)
    lockRef.current = false
    setDbHits(0)
    setLog([])
    addLog('TTL expired — cache key gone!', 'evict')

    const ids = Array.from({ length: concurrency }, (_, i) => i + 1)
    setThreads(ids.map(id => ({ id, state: 'waiting' })))

    await new Promise(r => setTimeout(r, 300))

    addLog(`${concurrency} concurrent requests all see a cache MISS`, 'miss')

    if (!mutexEnabled) {
      // no lock — all hit DB
      setThreads(ids.map(id => ({ id, state: 'db' })))
      await new Promise(r => setTimeout(r, 600))
      setDbHits(concurrency)
      addLog(`All ${concurrency} threads hit the database simultaneously!`, 'miss')
      if (concurrency > 9) {
        addLog('DB OVERLOAD — query queue backs up, latency spikes!', 'warn')
      }
      await new Promise(r => setTimeout(r, 400))
      setThreads(ids.map(id => ({ id, state: 'cached' })))
      addLog('Cache filled — future requests will hit cache', 'hit')
    } else {
      // with mutex lock — thread 1 gets lock, rest wait
      const [winner, ...waiters] = ids
      setThreads(ids.map(id => id === winner ? { id, state: 'db' } : { id, state: 'queued' }))
      setDbHits(1)
      addLog(`Thread ${winner} acquired mutex lock → fetching from DB`, 'info')
      addLog(`${waiters.length} threads waiting on lock...`, 'info')
      await new Promise(r => setTimeout(r, 700))
      setThreads(ids.map(id => ({ id, state: 'cached' })))
      addLog('Thread 1 filled cache + released lock → all others served from cache', 'hit')
      addLog(`DB hit count: 1 (vs ${concurrency} without lock)`, 'hit')
    }

    setRunning(false)
  }

  const stateColor = { waiting: '#aaa', db: '#c0002a', cached: '#1a7a3c', queued: '#b05000' }
  const stateLabel = { waiting: 'MISS', db: 'DB', cached: 'CACHE', queued: 'WAIT' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · cache stampede — all threads see a miss at once</div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontFamily: 'IBM Plex Mono', display: 'block', marginBottom: 4 }}>
            Concurrent requests: <b>{concurrency}</b>
          </label>
          <input type="range" min={1} max={30} value={concurrency}
            onChange={e => setConcurrency(Number(e.target.value))}
            style={{ width: 160 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
            <input type="checkbox" checked={mutexEnabled} onChange={e => setMutexEnabled(e.target.checked)}
              style={{ marginRight: 6 }} />
            Enable mutex lock (Redis SET NX EX)
          </label>
        </div>
        <button className="act" style={{ fontSize: 12 }} onClick={simulate} disabled={running}>
          {running ? 'simulating...' : 'Simulate TTL expiry'}
        </button>
      </div>

      {/* Thread visualization */}
      {threads.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {threads.map(t => (
            <div key={t.id} style={{
              width: 44, height: 36, borderRadius: 6, fontSize: 10,
              fontFamily: 'IBM Plex Mono', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: stateColor[t.state] + '22',
              border: `1.5px solid ${stateColor[t.state]}`,
              color: stateColor[t.state],
            }}>
              <span>T{t.id}</span>
              <span style={{ fontSize: 8 }}>{stateLabel[t.state]}</span>
            </div>
          ))}
        </div>
      )}

      {dbHits > 0 && concurrency > 9 && !mutexEnabled && (
        <div className="warn" style={{ marginBottom: 10 }}>
          DB Overload: {dbHits} simultaneous queries. At production scale (10k RPS) this causes a cascading failure.
        </div>
      )}

      {/* Log */}
      <div style={{ background: '#1B2A4A', borderRadius: 8, padding: 10, minHeight: 60 }}>
        {log.length === 0 && (
          <div style={{ color: '#555', fontFamily: 'IBM Plex Mono', fontSize: 11 }}>click "Simulate TTL expiry" above...</div>
        )}
        {log.map(l => (
          <div key={l.id} style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11, marginBottom: 2,
            color: l.type === 'hit' ? '#4ade80' : l.type === 'miss' ? '#f87171' :
                   l.type === 'warn' ? '#fbbf24' : l.type === 'evict' ? '#f472b6' : '#93c5fd'
          }}>
            {l.msg}
          </div>
        ))}
      </div>

      <Good>Try concurrency = 20 without the lock — notice the DB gets 20 hits at once. Enable the lock and try again: exactly 1 DB hit, 19 threads served from cache. This is why Redis SET NX EX (set-if-not-exists with TTL) is used as a distributed lock.</Good>
    </div>
  )
}

/* ============================================================
   Quiz data
   ============================================================ */
const QUESTIONS = [
  {
    q: 'You update a user record in the database. What should you do with the Redis cache key for that user?',
    o: ['Update the cache key with the new value immediately', 'Delete (invalidate) the cache key', 'Do nothing — the TTL will expire it eventually', 'Write to cache first, then write to the database'],
    a: 1,
    e: 'Invalidate (delete) the key. Writing the new value looks safe but creates a race: another thread may read the DB between your write and your cache-set and overwrite your update with stale data. Deletion forces the next read to go to the DB (which now has the correct value).',
    w: {
      0: 'Updating the cache looks atomic but is not: between DB write and cache update, another thread can read a stale value from the DB and then overwrite your fresh cache entry.',
      2: 'Relying only on TTL means every reader sees stale data until the TTL fires. For correctness-critical data this window is unacceptable.',
      3: 'Write-cache-first is write-behind pattern; if the DB write fails, you have fresh data in cache but stale data in DB — the source of truth is wrong.',
    },
    r: { id: 's3', label: 'Section 3 — caching patterns' },
  },
  {
    q: 'What is a cache stampede?',
    o: [
      'When the cache evicts too many keys at once due to a full eviction run',
      'When multiple threads all see a cache miss at the same moment and all hit the database simultaneously',
      'When a hot key receives more writes than the cache can handle',
      'When a Redis node fails and all traffic falls back to another node',
    ],
    a: 1,
    e: 'Cache stampede (thundering herd) happens when a popular key expires and many concurrent requests all miss the cache at the same instant, flooding the database with identical queries.',
    w: {
      0: 'Mass eviction is a different problem (capacity/eviction policy). A stampede is specifically about concurrent misses hitting the DB.',
      2: 'Hot key with too many writes is a different problem — a write-amplification issue, not a stampede.',
      3: 'Node failure is a Redis cluster failover scenario, not a stampede.',
    },
    r: { id: 's8', label: 'Section 8 — cache stampede' },
  },
  {
    q: 'In cache-aside pattern, when does the cache get populated?',
    o: ['On every write to the database', 'Only when a cache miss occurs (lazy loading)', 'At application startup (eager loading)', 'Redis populates it automatically by reading the DB'],
    a: 1,
    e: 'Cache-aside is lazy: the application checks the cache first. On a miss it fetches from the database and writes to the cache. The cache is only populated for data that is actually read, which is why it is the most common pattern.',
    w: {
      0: 'Populating on every DB write is write-through, not cache-aside. Cache-aside only populates on a read miss.',
      2: 'Startup loading (cache warming) can be added on top, but the defining characteristic of cache-aside is the on-miss population during reads.',
      3: 'In cache-aside the application drives all logic. Redis itself has no connection to your database.',
    },
    r: { id: 's3', label: 'Section 3 — caching patterns' },
  },
  {
    q: 'You have a key "celebrity:profile" that receives 200,000 requests per second on a single Redis node. The node is struggling. What is the best first fix?',
    o: [
      'Increase the TTL so the key stays cached longer',
      'Use write-through instead of cache-aside',
      'Add an in-process L1 cache in each app instance so only a fraction of requests reach Redis',
      'Switch to LFU eviction policy',
    ],
    a: 2,
    e: 'The hot-key problem is solved by an L1 (in-process, per-JVM) cache in front of Redis. If 100 app instances each cache the key locally, 95%+ of reads never touch Redis — they are served from RAM inside the process in nanoseconds.',
    w: {
      0: 'Longer TTL reduces miss-driven DB load but does nothing about the per-second Redis hit rate — the hot key is still accessed 200k times/s.',
      1: 'Write-through affects write path. The hot-key problem is a read-path issue.',
      3: 'LFU eviction decides which key to remove when the cache is full. It does not affect per-second request load on a specific key.',
    },
    r: { id: 's7', label: 'Section 7 — hot-key problem' },
  },
  {
    q: 'What does Redis `SET lock:seat123 "thread-A" NX EX 10` do?',
    o: [
      'Sets the key unconditionally and expires it in 10 seconds',
      'Sets the key only if it does not already exist, and expires it in 10 seconds',
      'Gets the key and returns it if it expires within 10 seconds',
      'Sets the key only if its current value is not "thread-A"',
    ],
    a: 1,
    e: 'NX means "set only if Not eXists" (atomic check-and-set). EX 10 means expire in 10 seconds. Together they are the standard atomic distributed lock acquire: only one caller wins the race; losers get null back. The TTL prevents a dead lock if the holder crashes.',
    w: {
      0: 'Without NX, SET is unconditional — multiple threads would all succeed, defeating the mutual exclusion. NX is the key ingredient.',
      2: 'GET is for reading. SET NX EX is a write with a conditional guard.',
      3: 'The check is on existence, not on the current value. Checking the value atomically requires a Lua script or WATCH+MULTI+EXEC.',
    },
    r: { id: 's8', label: 'Section 8 — distributed lock' },
  },
  {
    q: 'When should you use LFU eviction instead of LRU in Redis?',
    o: [
      'When all keys have equal access frequency and you want to evict the oldest',
      'When your workload has "hot" keys that are accessed very often but not necessarily recently — LFU protects them from eviction',
      'When keys have no TTL set and you want to evict the ones set longest ago',
      'LFU is always better than LRU — there is no trade-off',
    ],
    a: 1,
    e: 'LFU is better when some keys are permanently popular (a product catalog, a celebrity profile). If a hot key is not accessed for a short period but is globally popular, LRU might evict it while LFU protects it based on its long-term frequency. For uniform access or truly recency-driven workloads, LRU is simpler and equally good.',
    w: {
      0: 'Equal frequency plus oldest key is more like FIFO — LFU would still track frequency and behave differently from FIFO in that case.',
      2: 'Evicting the key set longest ago regardless of access is FIFO, not LFU or LRU.',
      3: 'LFU has more overhead (frequency counters) and is wrong for access patterns where recent = important (news feed, trending page). There is always a trade-off.',
    },
    r: { id: 's5', label: 'Section 5 — eviction policies' },
  },
  {
    q: 'Write-through caching doubles write latency. Why would you choose it over cache-aside?',
    o: [
      'You would not — write-through is strictly worse and should never be used',
      'Your workload is write-heavy and reads are rare, so write latency matters less than read freshness',
      'You need zero staleness: every read after a write must return the latest value immediately, even on the first read',
      'Write-through reduces memory usage compared to cache-aside',
    ],
    a: 2,
    e: 'Write-through guarantees the cache is always consistent with the database. The first read after a write hits the cache (not the DB) and returns the fresh value. This is worth the doubled write latency when stale reads are unacceptable — e.g., financial balances, inventory counts.',
    w: {
      0: 'Write-through is a legitimate pattern when read freshness matters more than write latency. Calling it "never use" is wrong.',
      1: 'Write-heavy read-rare workloads are a case AGAINST write-through — you pay write cost to populate a cache nobody reads (cold-write problem). Cache-aside would be cheaper.',
      3: 'Write-through and cache-aside use the same amount of memory. Eviction policy — not the write strategy — controls memory.',
    },
    r: { id: 's3', label: 'Section 3 — caching patterns' },
  },
  {
    q: 'You store a user session in Redis with no TTL and `maxmemory-policy noeviction`. The Redis instance fills up. What happens?',
    o: [
      'Redis silently drops old sessions to make room',
      'Redis starts evicting keys with the shortest remaining TTL',
      'Redis returns an OOM error on new write commands — no new data can be added',
      'Redis automatically increases its memory limit',
    ],
    a: 2,
    e: '`noeviction` means Redis will not remove any key when full. Instead it returns an OOM (out of memory) error on any write. This is correct behavior for session stores or rate-limiter state where you never want silent data loss — but it means your writes fail loudly, which you must handle in the application.',
    w: {
      0: 'Silent drop of old sessions would be `allkeys-lru` or `volatile-lru`. `noeviction` does the opposite — it refuses to evict anything.',
      1: 'Evicting by shortest remaining TTL is `volatile-ttl`. `noeviction` does not evict anything regardless of TTL.',
      3: 'Redis does not auto-scale memory. The `maxmemory` setting is a hard cap enforced by the policy you configure.',
    },
    r: { id: 's5', label: 'Section 5 — eviction policies' },
  },
]

/* ============================================================
   Page
   ============================================================ */
export default function Day81() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 81</div>
        <h1>Distributed Cache:<br />Redis Patterns at Scale</h1>
        <p>
          Day 56 built an LRU cache in one JVM's memory. This day asks: what happens when one
          server's RAM isn't enough? Redis, the four caching patterns, hot-key problems, and the
          race conditions nobody warns you about — click everything below.
        </p>
        <div className="chips">
          {['Cache-Aside', 'Write-Through', 'TTL', 'Eviction', 'Hot Key', 'Two-Level Cache', 'Stampede', 'Distributed Lock'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* ── S1: Why in-process isn't enough ── */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>From Day 56 to Redis — why one JVM isn't enough</h2>
        <p>
          Day 56's LRU cache lives inside the JVM heap. It is fast (nanosecond lookups), but it has
          three hard limits that hit you as soon as you run more than one server.
        </p>

        <Code html={`<span class="cm">// Day 56 approach: cache lives inside the process</span>
<span class="kw">class</span> UserService {
    <span class="kw">private final</span> LruCache&lt;String, User&gt; cache = <span class="kw">new</span> LruCache&lt;&gt;(<span class="num">1000</span>);

    User getUser(String id) {
        User u = cache.get(id);      <span class="cm">// nanoseconds — perfect</span>
        <span class="kw">if</span> (u != <span class="kw">null</span>) <span class="kw">return</span> u;
        u = database.findById(id);   <span class="cm">// milliseconds</span>
        cache.put(id, u);
        <span class="kw">return</span> u;
    }
}

<span class="cm">// Problem 1: 10 app instances → 10 separate caches → 10x memory,</span>
<span class="cm">//            inconsistent — instance A has fresh data, instance B has stale</span>
<span class="cm">// Problem 2: restart = cold cache, every user gets a DB hit until warm</span>
<span class="cm">// Problem 3: JVM heap limits (~4–8 GB typical); you need 50 GB of hot data</span>`} />

        <Note>
          A distributed cache like Redis runs as a <strong>separate service</strong>. All app instances share one cache.
          It survives restarts (with persistence), scales independently, and can hold far more data than any one JVM heap.
          The cost: network latency (microseconds instead of nanoseconds) and a new failure mode (Redis goes down).
        </Note>

        <Code html={`<span class="cm">// The fundamental contract — never forget this:</span>
<span class="cm">// Cache = a COPY of data. The database is the source of truth.</span>
<span class="cm">//</span>
<span class="cm">// Two questions define every caching strategy:</span>
<span class="cm">//   1. When do you populate the cache?    (on read miss? on write? at startup?)</span>
<span class="cm">//   2. When do you invalidate the cache?  (on write? by TTL? never?)</span>
<span class="cm">//</span>
<span class="cm">// That's it. Every pattern below answers those two questions differently.</span>`} />
      </section>

      {/* ── S2: Analogy + vocabulary ── */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The prep kitchen — analogy + core vocabulary</h2>
        <p>
          Imagine a restaurant. The <strong>kitchen</strong> (database) can cook anything but takes 10 minutes
          per dish. The <strong>prep kitchen</strong> (cache) holds pre-cut vegetables and pre-made sauces —
          common ingredients ready in 10 seconds. When a customer orders, the waiter (application) checks the
          prep kitchen first. If the ingredient is there: fast. If not: full kitchen, slow.
        </p>
        <p>
          If the prep kitchen burns down (Redis crashes), the restaurant still works — just slower. The prep
          kitchen is never the source of truth. The full kitchen always has the recipe.
        </p>

        <Code html={`<span class="cm">Vocabulary you will see everywhere:</span>

  Cache HIT   — you asked for a key and it was there. Fast. (~1 ms over local network)
  Cache MISS  — key was not in cache. Slow path: go to database (~10–100 ms)
  TTL         — Time-To-Live. Each key auto-deletes after N seconds. Bounded staleness.
  Eviction    — cache is full; a key is removed to make room (LRU / LFU / etc.)
  Invalidation — you explicitly delete a key because the underlying data changed
  Cold cache  — cache is empty (after startup / crash). 100% miss rate until warmed.
  Cache warm  — pre-loading expected-hot keys at startup to avoid cold-start misses`} />

        <Good>
          Memorize the difference between <strong>eviction</strong> (capacity-driven, automatic) and
          <strong> invalidation</strong> (correctness-driven, manual). Confusing them causes bugs in write paths.
        </Good>
      </section>

      {/* ── S3: Four caching patterns ── */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The four caching patterns</h2>
        <p>
          Every caching strategy is one of these four. Cache-aside is the default for most systems. The others
          are specialised tools with real trade-offs.
        </p>

        <Code html={`<span class="cm">────────────────────────────────────────────────────</span>
<span class="cm">PATTERN 1: CACHE-ASIDE  (lazy loading — the default)</span>
<span class="cm">────────────────────────────────────────────────────</span>
<span class="cm">READ path:</span>
  App ──read──▶ Cache ──HIT──▶ return value
                    └──MISS──▶ Database ──▶ App ──write──▶ Cache ──▶ return

<span class="cm">WRITE path:</span>
  App ──write──▶ Database  (write DB first — it is the truth)
             └──▶ redis.del(key)  (INVALIDATE cache, do NOT update it)

  Pro:  only caches data that is actually read
  Pro:  cache failure does not block writes
  Con:  first read after cold start or invalidation pays DB latency (miss penalty)
  Con:  short window of stale data between write+del and next miss+refresh

<span class="cm">────────────────────────────────────────────────────</span>
<span class="cm">PATTERN 2: WRITE-THROUGH  (synchronous — write both)</span>
<span class="cm">────────────────────────────────────────────────────</span>
  App ──write──▶ Cache ──write──▶ Database   (both in the same request path)
  READ:          Cache always has fresh data ─▶ return

  Pro:  cache is always consistent — zero stale reads
  Con:  every write is slower (two blocking network calls)
  Con:  cold-write problem: you cache data nobody ever reads (wasted memory)
  Use when: stale reads are unacceptable (bank balances, inventory counts)

<span class="cm">────────────────────────────────────────────────────</span>
<span class="cm">PATTERN 3: WRITE-BEHIND  (async — write cache, flush DB later)</span>
<span class="cm">────────────────────────────────────────────────────</span>
  App ──write──▶ Cache ──ack──▶ caller    (fast! returns immediately)
                     └── async batch ──▶ Database  (flushed every N ms / N writes)

  Pro:  very low write latency
  Con:  data loss if Redis crashes before flush
  Con:  complex ordering / consistency guarantees
  Use when: write speed is critical and occasional loss is acceptable (analytics counts)

<span class="cm">────────────────────────────────────────────────────</span>
<span class="cm">PATTERN 4: READ-THROUGH  (cache is in front, DB is behind it)</span>
<span class="cm">────────────────────────────────────────────────────</span>
  App ──read──▶ Cache ──HIT──▶ return value
                    └──MISS──▶ Cache fetches DB itself ──▶ fills self ──▶ return

  Looks like cache-aside, but the cache object owns the DB-fetch logic
  In Java/Redis setups the APP drives the logic (cache-aside).
  Read-through is common in ORM-level caches (Hibernate 2nd-level cache)`} />

        <Warn>
          <strong>Why invalidate, not update, on write in cache-aside?</strong> If Thread A reads the DB and
          Thread B writes + updates the cache — both at the same time — Thread A might overwrite B's fresh
          value with stale data. Deleting the key forces the next read to re-fetch from the DB (which is
          already correct). The delete is always safe; the update is not.
        </Warn>
      </section>

      {/* ── S4: Interactive — cache-aside sim ── */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: cache-aside in action</h2>
        <p>
          The demo has a fake database (three users) and a Redis cache that starts empty. Click GET to see
          miss vs hit. Click UPDATE to see invalidation. Watch the TTL countdown — when it hits 0 the key
          disappears and the next GET becomes a miss again.
        </p>
        <CacheAsideDemo />
      </section>

      {/* ── S5: TTL + eviction policies ── */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>TTL and eviction policies</h2>
        <p>
          Every cached key should have a TTL. Without one, a key lives forever — and stale data
          accumulates silently. TTL is your safety net: even if you forget to invalidate on a write,
          the data becomes fresh again after the TTL window.
        </p>

        <Code html={`<span class="cm">// Setting a key with TTL in Redis (Jedis library)</span>
redis.setex(<span class="str">"user:alice"</span>, <span class="num">300</span>, jsonString);
<span class="cm">// "user:alice" will auto-delete after 300 seconds (5 minutes)</span>

<span class="cm">// Reading with TTL awareness — check if key exists</span>
String cached = redis.get(<span class="str">"user:alice"</span>);
<span class="kw">if</span> (cached == <span class="kw">null</span>) {              <span class="cm">// null = miss OR expired (same code path)</span>
    cached = database.findUser(<span class="str">"alice"</span>);
    redis.setex(<span class="str">"user:alice"</span>, <span class="num">300</span>, cached);
}

<span class="cm">// Rule of thumb for choosing TTL:</span>
<span class="cm">//   TTL = acceptable staleness window for your use case</span>
<span class="cm">//   User profile → 5 minutes (changes rarely)</span>
<span class="cm">//   Seat availability → 30 seconds (changes fast)</span>
<span class="cm">//   Exchange rate → 10 seconds (very volatile)</span>
<span class="cm">//   Static config → 1 hour (almost never changes)</span>`} />

        <p>
          When the cache is full, Redis must evict a key to make room. Which key depends on the
          <strong> eviction policy</strong> you configure.
        </p>

        <Code html={`<span class="cm">Redis eviction policies (set in redis.conf):</span>

  noeviction       — reject all writes when full. Good for session stores.
                     Never use for a pure cache (writes will fail).

  allkeys-lru      — evict any key by LRU. ← most common for pure caches.
                     Even keys with no TTL can be evicted.

  volatile-lru     — evict only keys that HAVE a TTL, by LRU.
                     Protects permanent/pinned keys from eviction.

  allkeys-lfu      — evict any key by LFU (least-frequently-used).
                     Better when hot keys must survive even if not recent.

  volatile-lfu     — LFU but only among keys with a TTL set.

  allkeys-random   — evict a random key. Rarely useful.

  volatile-ttl     — evict the key with the smallest remaining TTL first.
                     Good if you want "nearly expired anyway" keys out first.

<span class="cm">Quick guide:</span>
<span class="cm">  Pure cache (all data recreatable from DB)  → allkeys-lru or allkeys-lfu</span>
<span class="cm">  Mixed (some permanent keys + cached data)  → volatile-lru</span>
<span class="cm">  Session store / rate-limiter state         → noeviction (never lose it silently)</span>`} />

        <Note>
          LRU vs LFU in one sentence: LRU evicts what you <em>accessed furthest back in time</em>. LFU evicts
          what you <em>accessed least often overall</em>. Choose LFU when your cache has permanently popular keys
          (celebrity profile, top-10 products) that might not be accessed for a short window but are globally hot.
        </Note>
      </section>

      {/* ── S6: Interactive — eviction comparison ── */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>Play: LRU vs LFU disagree</h2>
        <p>
          Follow the four steps in order. B is accessed 3 times (high frequency), then A and C once each.
          When D arrives and the capacity-3 cache must evict, watch LRU and LFU make different choices.
        </p>
        <EvictionDemo />
      </section>

      {/* ── S7: Hot-key + two-level cache ── */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Hot-key problem + two-level cache</h2>
        <p>
          A <strong>hot key</strong> is one key that receives a huge fraction of all requests.
          Example: a celebrity's profile page during a live event. A single Redis node is single-threaded
          for commands — it can handle roughly 100,000 simple commands per second. A hot key can saturate
          that all by itself.
        </p>

        <Code html={`<span class="cm">// The hot-key problem illustrated</span>
<span class="kw">void</span> loadPage(String userId) {
    String key = <span class="str">"user:"</span> + userId;          <span class="cm">// "user:celebrity123"</span>
    String data = redis.get(key);            <span class="cm">// 200,000 calls/second → one Redis node</span>
    <span class="cm">// Redis saturates. P99 latency explodes. Timeouts start.</span>
}

<span class="cm">// Fix: L1 (in-process) + L2 (Redis) two-level cache</span>
<span class="kw">class</span> TwoLevelCache&lt;K, V&gt; {
    <span class="kw">private final</span> LruCache&lt;K, V&gt; l1;        <span class="cm">// in-process; nanosecond lookups; small</span>
    <span class="kw">private final</span> RedisClient l2;            <span class="cm">// shared across instances; microseconds; large</span>

    V get(K key) {
        V v = l1.get(key);                   <span class="cm">// L1 check: in-process, no network</span>
        <span class="kw">if</span> (v != <span class="kw">null</span>) <span class="kw">return</span> v;             <span class="cm">// L1 hit → done (nanoseconds)</span>

        v = l2.get(key);                     <span class="cm">// L2 check: Redis over network</span>
        <span class="kw">if</span> (v != <span class="kw">null</span>) {
            l1.put(key, v);                  <span class="cm">// promote to L1 for next time</span>
            <span class="kw">return</span> v;                        <span class="cm">// L2 hit → done (microseconds)</span>
        }

        v = database.find(key);              <span class="cm">// L2 miss: hit the DB (milliseconds)</span>
        l2.set(key, v, TTL_SECONDS);         <span class="cm">// fill L2</span>
        l1.put(key, v);                      <span class="cm">// fill L1</span>
        <span class="kw">return</span> v;
    }
    <span class="cm">// Invalidation: delete from BOTH layers on write</span>
    <span class="kw">void</span> invalidate(K key) {
        l1.remove(key);                      <span class="cm">// clear this instance's L1</span>
        l2.del(key);                         <span class="cm">// clear shared L2</span>
        <span class="cm">// Other instances' L1s will serve stale data until their local TTL expires</span>
        <span class="cm">// — this is the trade-off of L1 caching. Keep L1 TTL short (e.g. 5s)</span>
    }
}`} />

        <Good>
          With 100 app instances each caching hot keys locally for 5 seconds, roughly 95% of reads never
          reach Redis. The Redis node goes from 200k req/s to ~10k req/s — well within its capacity.
          The trade-off: each instance's L1 can be up to 5 seconds stale after an invalidation.
        </Good>

        <Reveal summary="Key sharding — another hot-key fix">
          <p>
            Instead of one key <C>celebrity:profile</C>, store N copies across N Redis nodes:
            <C>celebrity:profile:0</C>, <C>celebrity:profile:1</C>, …, <C>celebrity:profile:N-1</C>.
            On read, pick a random shard: <C>shard = random.nextInt(N)</C>. Writes must update all N shards.
            This spreads reads across N nodes at the cost of N-write amplification. L1 caching is usually
            simpler and preferred — use key sharding for write-heavy hot keys.
          </p>
        </Reveal>
      </section>

      {/* ── S8: Stampede + distributed lock ── */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Cache stampede + distributed lock</h2>
        <p>
          A <strong>cache stampede</strong> (also called thundering herd) happens when a popular key expires
          and many concurrent requests all see a miss at the same moment. They all go to the database at once.
          At production scale (10,000 requests/second hitting one key) the database gets crushed.
        </p>

        <Code html={`<span class="cm">// The stampede: 10,000 threads, all see miss at time T</span>
<span class="kw">void</span> getProduct(String id) {
    String v = redis.get(id);    <span class="cm">// 10,000 threads: all return null (TTL just expired)</span>
    <span class="kw">if</span> (v == <span class="kw">null</span>) {
        v = database.find(id);   <span class="cm">// 10,000 threads: all hit the DB simultaneously!</span>
        redis.setex(id, <span class="num">300</span>, v); <span class="cm">// all 10,000 write the same value to cache</span>
    }
    <span class="kw">return</span> v;
}

<span class="cm">// Fix 1: Mutex lock using Redis SET NX EX (atomic)</span>
<span class="cm">// NX = only set if Not eXists  |  EX = expire in N seconds</span>
<span class="kw">void</span> getProductSafe(String id) {
    String v = redis.get(id);
    <span class="kw">if</span> (v != <span class="kw">null</span>) <span class="kw">return</span> v;

    String lockKey = <span class="str">"lock:"</span> + id;
    String owner   = UUID.randomUUID().toString();  <span class="cm">// unique per thread</span>

    <span class="cm">// Atomic: SET lock:id {owner} NX EX 5</span>
    <span class="cm">// Only ONE thread gets "OK"; the rest get null</span>
    <span class="kw">boolean</span> gotLock = <span class="str">"OK"</span>.equals(redis.set(lockKey, owner, <span class="str">"NX"</span>, <span class="str">"EX"</span>, <span class="num">5</span>));

    <span class="kw">if</span> (gotLock) {
        v = database.find(id);       <span class="cm">// only this thread hits the DB</span>
        redis.setex(id, <span class="num">300</span>, v);
        releaseLock(lockKey, owner); <span class="cm">// must verify we own it before deleting</span>
    } <span class="kw">else</span> {
        <span class="cm">// other threads: brief sleep, retry — by then cache is filled</span>
        Thread.sleep(<span class="num">50</span>);
        <span class="kw">return</span> getProductSafe(id);   <span class="cm">// recursive retry (add max-retries in production)</span>
    }
    <span class="kw">return</span> v;
}

<span class="kw">void</span> releaseLock(String lockKey, String owner) {
    String current = redis.get(lockKey);
    <span class="kw">if</span> (owner.equals(current)) {
        redis.del(lockKey);          <span class="cm">// safe: we own it</span>
    }
    <span class="cm">// In production use a Lua script for atomic check-and-delete</span>
    <span class="cm">// to avoid a race between get(lockKey) and del(lockKey)</span>
}`} />

        <Note>
          <strong>Why NX + EX together?</strong> NX makes the set atomic (only one winner). EX gives it a TTL
          so if the winner crashes before releasing the lock, it auto-expires in 5 seconds instead of being held
          forever (dead lock). Never use NX without EX for distributed locks.
        </Note>

        <Reveal summary="Fix 2: probabilistic early recomputation (no locking)">
          <p>
            Instead of waiting for TTL to hit zero, each reader has a small random chance of refreshing
            the key <em>before</em> it expires, proportional to how close the expiry is. If 100 readers
            are hitting a key with 2 seconds left, one of them (randomly) refreshes it early. The key never
            expires for everyone at once. This is called "XFetch" or probabilistic early expiry.
          </p>
          <Code html={`<span class="cm">// Probabilistic early recomputation</span>
<span class="kw">boolean</span> shouldRefresh(String key, <span class="kw">double</span> beta, <span class="kw">long</span> computeMs) {
    <span class="kw">long</span> ttlMs = redis.pttl(key);   <span class="cm">// remaining TTL in milliseconds</span>
    <span class="kw">if</span> (ttlMs &lt;= <span class="num">0</span>) <span class="kw">return true</span>;    <span class="cm">// already expired — always refresh</span>
    <span class="cm">// probability increases as TTL decreases</span>
    <span class="kw">double</span> rnd = Math.random();
    <span class="kw">return</span> rnd &lt; beta * computeMs / ttlMs;
}`} />
        </Reveal>

        <Reveal summary="The invalidation race in cache-aside (concurrent write)">
          <Code html={`<span class="cm">// The cache-aside race condition (rare but real):</span>
<span class="cm">//</span>
<span class="cm">// Thread A: reads DB → value = 1 (gets context-switched here)</span>
<span class="cm">// Thread B: writes DB → value = 2 → redis.del(key)</span>
<span class="cm">// Thread A: redis.set(key, 1)   ← stale value now in cache!</span>
<span class="cm">//</span>
<span class="cm">// Result: cache says 1, database says 2. Inconsistent.</span>
<span class="cm">//</span>
<span class="cm">// Fixes:</span>
<span class="cm">//  1. Write-through (cache+DB in one transaction) — eliminates the race</span>
<span class="cm">//  2. Short TTL — stale window bounded by TTL, not indefinite</span>
<span class="cm">//  3. Versioned writes: only cache.set(key, v) if version &gt; cached version</span>`} />
        </Reveal>
      </section>

      {/* ── S9: Interactive — stampede ── */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>Play: cache stampede visualizer</h2>
        <p>
          Drag the concurrency slider up to 20–30, then click "Simulate TTL expiry" without the mutex lock.
          Watch all threads hit the database at once. Then enable the lock and simulate again — only one
          thread fetches from the DB.
        </p>
        <StampedeDemo />
      </section>

      {/* ── S10: Redis data structures + consistency ── */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Redis data structures + consistency</h2>
        <p>
          Redis is not just a string cache. It has six built-in data structures, each optimised for a
          different access pattern. Picking the right one avoids round-trips and serialization overhead.
        </p>

        <Code html={`<span class="cm">Redis data structure quick-reference:</span>

  String   → <span class="kw">GET</span>/<span class="kw">SET</span>/<span class="kw">INCR</span>/<span class="kw">DECR</span>
             Use for: JSON blobs, counters, feature flags, lock keys
             INCR is atomic (rate limiting, stock counters)

  Hash     → <span class="kw">HGET</span>/<span class="kw">HSET</span>/<span class="kw">HDEL</span>/<span class="kw">HGETALL</span>
             Use for: user profile fields (update one field without fetching all)
             redis.hset("user:alice", "city", "Paris")  ← update city only

  List     → <span class="kw">LPUSH</span>/<span class="kw">RPOP</span>/<span class="kw">LRANGE</span>
             Use for: task queues (Day 63), activity feeds (latest N items)
             LPUSH + RPOP = FIFO queue; LPUSH + LPOP = LIFO stack

  Sorted   → <span class="kw">ZADD</span>/<span class="kw">ZRANGE</span>/<span class="kw">ZREVRANGE</span>/<span class="kw">ZRANK</span>
  Set        Use for: leaderboards (score = rank), sliding window rate limiter (Day 65)
             redis.zadd("leaderboard", score, userId)
             redis.zrevrange("leaderboard", 0, 9)  ← top 10

  Set      → <span class="kw">SADD</span>/<span class="kw">SISMEMBER</span>/<span class="kw">SUNION</span>/<span class="kw">SINTER</span>
             Use for: unique visitor counts, deduplication, tag sets
             redis.sismember("seen:sessionIds", id)  ← already processed?

  Bitmap / → advanced; skip for now
  HyperLogLog`} />

        <Note>
          Redis is <strong>single-threaded for command execution</strong> — commands are serialized.
          A single <C>GET</C> or <C>SET</C> is always atomic. But two separate commands (<C>GET</C> then
          <C>SET</C>) are NOT atomic together — another client can run between them. Use Lua scripts or
          <C>WATCH</C>+<C>MULTI</C>+<C>EXEC</C> for multi-command atomicity.
        </Note>

        <Code html={`<span class="cm">// Multi-command atomicity: the check-then-set race</span>
<span class="cm">// WRONG: GET and SET are two separate commands — another client can write between them</span>
String val = redis.get(<span class="str">"counter"</span>);
redis.set(<span class="str">"counter"</span>, String.valueOf(Integer.parseInt(val) + <span class="num">1</span>));  <span class="cm">// RACE</span>

<span class="cm">// RIGHT option 1: INCR is a single atomic command</span>
redis.incr(<span class="str">"counter"</span>);          <span class="cm">// atomic read-increment-write in one step</span>

<span class="cm">// RIGHT option 2: Lua script (runs as one atomic unit in Redis)</span>
<span class="cm">// redis.eval("local v = redis.call('GET', KEYS[1]) ...")</span>

<span class="cm">// RIGHT option 3: WATCH + MULTI + EXEC (optimistic transaction)</span>
redis.watch(<span class="str">"mykey"</span>);           <span class="cm">// watch for concurrent modification</span>
redis.multi();                   <span class="cm">// start transaction</span>
redis.set(<span class="str">"mykey"</span>, newValue);
<span class="kw">boolean</span> ok = redis.exec() != <span class="kw">null</span>;  <span class="cm">// null = concurrent change detected → retry</span>`} />

        <Reveal summary="RDB vs AOF persistence — when to use each">
          <p>
            Redis has two persistence modes. <strong>RDB</strong> (Redis Database Backup) takes periodic
            snapshots. Fast restarts; some data loss since last snapshot. <strong>AOF</strong> (Append-Only
            File) logs every write command. Near-zero data loss; slower restarts and more disk I/O.
          </p>
          <p>
            For a <em>pure cache</em> (all data recreatable from DB): disable both. A cold start after crash
            is fine — the cache just refills from the DB on the first miss wave.
          </p>
          <p>
            For a <em>session store</em> or <em>rate-limiter state</em>: enable AOF. Losing a user session
            on every Redis restart is unacceptable.
          </p>
        </Reveal>
      </section>

      {/* ── INTERVIEW CORNER ── */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Interview corner</h2>
        <p>Classic questions about distributed caching. Click to reveal full answers.</p>

        <Reveal summary="Cache-aside vs write-through — trade-off in one sentence each">
          <p>
            <strong>Cache-aside:</strong> only caches data that is actually read (no cold-write waste), but
            the first read after a miss or invalidation pays DB latency and there is a brief stale window
            between write and invalidation.
          </p>
          <p>
            <strong>Write-through:</strong> cache is always fresh (zero stale reads after a write) because
            writes go to both cache and DB synchronously, but every write is slower (two blocking calls) and
            you cache data nobody reads (cold-write problem).
          </p>
        </Reveal>

        <Reveal summary="Why invalidate (delete) the cache key on write instead of updating it?">
          <p>
            Updating the cache on write creates a race: Thread A reads the DB (old value), Thread B writes
            the DB (new value) and deletes the cache key, then Thread A writes the cache with the old value.
            Now the cache is stale. Deleting the key instead forces the next read to re-fetch from the DB,
            which already has the correct value. The delete is always safe; the update is not.
          </p>
        </Reveal>

        <Reveal summary="What is a cache stampede? Give two fixes.">
          <p>
            A cache stampede (thundering herd) happens when a popular key's TTL expires and many concurrent
            requests all see a cache miss at the same moment. They all fall through to the database simultaneously.
          </p>
          <p><strong>Fix 1 — Mutex lock:</strong> Use <C>SET lock:key uuid NX EX 5</C> in Redis. Only one thread
            wins the lock, fetches from DB, fills the cache, releases the lock. Others wait briefly and retry
            (the key is now filled).</p>
          <p><strong>Fix 2 — Probabilistic early recomputation:</strong> Each reader has a random chance of
            refreshing the key before it expires, weighted by how close the expiry is. The key is refreshed
            before it ever goes to zero, so no stampede occurs.</p>
        </Reveal>

        <Reveal summary="How does Redis SET NX EX prevent double-work on a cache miss?">
          <p>
            <C>SET lock:id owner NX EX 5</C> is a single atomic Redis command. <C>NX</C> (Not eXists) means
            the set only succeeds if the key does not already exist. Of all concurrent threads, exactly one
            gets the <C>"OK"</C> response — the lock. The others get <C>null</C> and know to wait.
            <C>EX 5</C> gives the key a 5-second TTL so if the winner crashes, the lock auto-releases and
            does not get stuck forever. The combination gives you a distributed mutual exclusion primitive
            with a dead-lock safety net — in one command.
          </p>
        </Reveal>

        <Reveal summary="When should you use LFU eviction instead of LRU?">
          <p>
            Use LFU when your cache contains "permanently popular" keys that are accessed very frequently
            overall but may not have been accessed in the last few minutes. Example: top-10 product pages
            during a flash sale — they are accessed millions of times per day but might have a quiet 2-minute
            window. LRU would evict them during that quiet window; LFU would protect them based on their long
            history of high frequency. For workloads where recency equals importance (news feeds, trending
            pages), LRU is simpler and equally good.
          </p>
        </Reveal>

        <Reveal summary="What happens to a pure Redis cache on restart? What about a session store?">
          <p>
            <strong>Pure cache (no persistence):</strong> On restart, Redis starts with an empty keyspace
            (cold cache). The first wave of requests all miss and hit the database — a controlled stampede.
            This is acceptable because all data is recreatable from the DB. The cache warms up naturally
            over the next few minutes.
          </p>
          <p>
            <strong>Session store (AOF persistence enabled):</strong> On restart, Redis replays the AOF log
            and restores all session keys. Users do not have to log in again. AOF incurs more disk I/O and
            slower restarts, but for sessions, losing them on every restart is a bad user experience.
          </p>
        </Reveal>
      </section>

      {/* ── CHEAT SHEET ── */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>Cheat sheet</h2>
        <ul>
          <li><strong>Cache = copy.</strong> Database is always the source of truth. Cache can be wrong; DB cannot.</li>
          <li><strong>Cache-aside:</strong> check cache → miss → read DB → write cache. Write: write DB → delete cache. Default pattern.</li>
          <li><strong>Write-through:</strong> write cache + DB together. Fresh reads, slower writes. Use for zero-staleness requirements.</li>
          <li><strong>Write-behind:</strong> write cache, flush DB async. Fast writes, risk of data loss. Rare in Java services.</li>
          <li><strong>TTL:</strong> every cache key should have one. TTL = acceptable staleness window for that data.</li>
          <li><strong>Eviction:</strong> <C>allkeys-lru</C> for pure caches. <C>noeviction</C> for session/rate-limiter stores. <C>allkeys-lfu</C> when hot keys must survive.</li>
          <li><strong>Hot key:</strong> add an L1 in-process cache (Day 56's LRU) in front of Redis. 95% of reads stay in the JVM.</li>
          <li><strong>Stampede:</strong> <C>SET lock:key owner NX EX 5</C> — atomic distributed lock. One winner, rest wait.</li>
          <li><strong>Invalidate, not update:</strong> deleting the key on write is always safe; updating it can lose a concurrent write.</li>
          <li><strong>Redis is single-threaded per command</strong> — single commands are atomic. Multi-command operations need Lua or WATCH+MULTI+EXEC.</li>
          <li><strong>Data structures:</strong> Hash for partial updates, Sorted Set for leaderboards, List for queues, Set for dedup.</li>
          <li><strong>Persistence:</strong> disable both for pure caches (cold start is fine). Enable AOF for session/rate-limiter state.</li>
        </ul>
      </section>

      {/* ── QUIZ ── */}
      <section id="s12">
        <div className="sec-label">Section 12 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* HOMEWORK FOOTER */}
      <div className="footer">
        <strong>Day 81 complete?</strong> Homework: Implement a two-level cache in Java.
        Create an <C>LruCache&lt;K,V&gt;</C> (from Day 56) as L1 and a stub <C>RedisCache&lt;K,V&gt;</C>
        (backed by a <C>HashMap</C> + a per-key timestamp for TTL simulation) as L2. Wire them together:
        on <C>get</C> check L1 → check L2 (reject if timestamp expired) → hit the DB. On <C>update</C>:
        write DB → remove from both L1 and L2. Test that after an update, the next <C>get</C> misses both
        layers and fetches fresh data from the DB.
        <br /><br />
        Next: <strong>Day 82 — Search Autocomplete</strong>: Trie data structure, top-K suggestions,
        frequency-ranked completions, and how Google-style "instant search" works under the hood.
      </div>
    </div>
  )
}
