import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Shard Key Comparison
   ============================================================ */
const SHARD_COLORS = ['#2D5BFF', '#2E9E6B', '#C9A227', '#D9534F']
const SHARD_NAMES = ['Shard 0', 'Shard 1', 'Shard 2', 'Shard 3']
const TOTAL_USERS = 20

function getShardRange(userId) {
  if (userId < 500) return 0
  if (userId < 1000) return 1
  if (userId < 1500) return 2
  return 3
}

function getShardHash(userId, n) {
  return Math.abs((userId * 2654435761) >>> 0) % n
}

function getShardDirectory(userId) {
  return userId % 4
}

function buildUsers(burst) {
  const base = Array.from({ length: TOTAL_USERS }, (_, i) => ({ id: i * 50, label: `u${i * 50}` }))
  if (burst) {
    for (let i = 0; i < 10; i++) {
      base.push({ id: 2000 + i * 100, label: `u${2000 + i * 100}` })
    }
  }
  return base
}

function ShardKeyDemo() {
  const [mode, setMode] = useState('range')
  const [burst, setBurst] = useState(false)
  const [lookup, setLookup] = useState(null)

  const users = buildUsers(burst)
  const shardCount = 4

  function assignShard(u) {
    if (mode === 'range') return getShardRange(u.id)
    if (mode === 'hash') return getShardHash(u.id, shardCount)
    return getShardDirectory(u.id)
  }

  const shardBuckets = [[], [], [], []]
  users.forEach(u => {
    const s = assignShard(u)
    if (s >= 0 && s < 4) shardBuckets[s].push(u)
  })

  const maxCount = Math.max(...shardBuckets.map(b => b.length), 1)

  function handleDirClick(u) {
    setLookup({ userId: u.id, shard: getShardDirectory(u.id) })
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · shard key strategy comparison</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {['range', 'hash', 'directory'].map(m => (
          <button key={m} className={`act${mode === m ? '' : ' ghost'}`}
            onClick={() => { setMode(m); setLookup(null) }}>
            {m.charAt(0).toUpperCase() + m.slice(1)} sharding
          </button>
        ))}
        <button
          className={`act${burst ? '' : ' ghost'}`}
          style={{ background: burst ? '#D9534F' : undefined }}
          onClick={() => setBurst(b => !b)}>
          {burst ? 'Remove burst' : 'Write burst (10 high-ID users)'}
        </button>
      </div>

      {mode === 'range' && (
        <Note>
          Range sharding: <strong>userId &lt; 500 &rarr; Shard 0</strong>, 500&ndash;999 &rarr; Shard 1,
          1000&ndash;1499 &rarr; Shard 2, 1500+ &rarr; Shard 3.
          Click &ldquo;Write burst&rdquo; to see a hotspot &mdash; all new high-ID users pile into Shard 3.
        </Note>
      )}
      {mode === 'hash' && (
        <Good>
          Hash sharding: <strong>shard = hash(userId) % 4</strong>. Even distribution even during a burst.
          But range queries (&ldquo;users 0&ndash;500&rdquo;) must scatter-gather all shards.
        </Good>
      )}
      {mode === 'directory' && (
        <Note>
          Directory sharding: a lookup table maps each userId to a shard.
          Click a user card below to simulate the lookup step.
        </Note>
      )}

      {mode === 'directory' && lookup && (
        <div style={{ padding: '10px 14px', marginBottom: 10, background: '#f0f4ff', borderRadius: 8,
          fontFamily: 'IBM Plex Mono', fontSize: 13, border: '1px solid #2D5BFF' }}>
          SELECT shard_id FROM shard_map WHERE userId = <strong>{lookup.userId}</strong>
          &nbsp;&rarr; <strong>Shard {lookup.shard}</strong>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 8 }}>
        {shardBuckets.map((bucket, si) => {
          const fill = bucket.length / maxCount
          const isHot = burst && mode === 'range' && si === 3
          return (
            <div key={si} style={{ border: `2px solid ${isHot ? '#D9534F' : SHARD_COLORS[si]}`,
              borderRadius: 10, padding: 10, background: isHot ? '#fff5f5' : '#fafaf7' }}>
              <div style={{ fontWeight: 700, color: isHot ? '#D9534F' : SHARD_COLORS[si],
                fontFamily: 'IBM Plex Mono', fontSize: 13, marginBottom: 6 }}>
                {SHARD_NAMES[si]} {isHot ? '(HOT)' : ''}
              </div>
              <div style={{ height: 8, background: '#eee', borderRadius: 4, marginBottom: 8 }}>
                <div style={{ width: `${fill * 100}%`, height: '100%',
                  background: isHot ? '#D9534F' : SHARD_COLORS[si], borderRadius: 4,
                  transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>{bucket.length} users</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {bucket.slice(0, 14).map(u => (
                  <span key={u.id}
                    style={{ fontSize: 11, padding: '2px 5px', borderRadius: 4,
                      background: isHot && u.id >= 2000 ? '#ffcccc' : '#e8edff',
                      color: '#1B2A4A', cursor: mode === 'directory' ? 'pointer' : 'default',
                      border: lookup && lookup.userId === u.id ? '1px solid #2D5BFF' : '1px solid transparent' }}
                    onClick={() => mode === 'directory' && handleDirClick(u)}>
                    {u.label}
                  </span>
                ))}
                {bucket.length > 14 && (
                  <span style={{ fontSize: 11, color: '#888' }}>+{bucket.length - 14} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <Good style={{ marginTop: 12 }}>
        Notice: Hash distributes evenly even during the burst. Range creates a hotspot on the highest shard.
        Directory adds a lookup step before routing.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 2 — Cross-Shard Query and Resharding Visualizer
   ============================================================ */
function CrossShardQueryDemo() {
  const [queryType, setQueryType] = useState(null)
  const [reshardMode, setReshardMode] = useState(null)

  const shards = ['Shard 0', 'Shard 1', 'Shard 2', 'Shard 3']
  const targetShard = 2

  function runQuery(type) {
    setQueryType(type)
    setReshardMode(null)
  }

  function runReshard(mode) {
    setReshardMode(mode)
    setQueryType(null)
  }

  const isActive = (si) => {
    if (queryType === 'single') return si === targetShard
    if (queryType === 'scatter') return true
    return false
  }

  const movedColor = reshardMode === 'hash' ? '#D9534F' : '#2E9E6B'
  const movedDesc = reshardMode === 'hash'
    ? 'Almost every key must move: hash(key) % 5 differs from hash(key) % 4 for most keys.'
    : 'Only 1/5 of keys move. The new shard claims one arc of the consistent hash ring.'

  return (
    <div className="panel">
      <div className="ptitle">Live demo &middot; cross-shard queries &amp; resharding</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button className="act ghost" onClick={() => runQuery('single')}>Find user 42 (single shard)</button>
        <button className="act ghost" onClick={() => runQuery('scatter')}>Top 5 spenders (scatter-gather)</button>
        <button className="act ghost"
          style={{ background: '#fff3cd', color: '#7a5a00', border: '1px solid #C9A227' }}
          onClick={() => runReshard('hash')}>Add shard (hash % N)</button>
        <button className="act ghost"
          style={{ background: '#d4f5e4', color: '#1a6b42', border: '1px solid #2E9E6B' }}
          onClick={() => runReshard('consistent')}>Add shard (consistent hash)</button>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {shards.map((name, si) => {
          const active = isActive(si)
          return (
            <div key={si} style={{
              flex: 1, minWidth: 80, border: `2px solid ${active ? '#2D5BFF' : '#DCD9CF'}`,
              borderRadius: 10, padding: 12, textAlign: 'center',
              background: active ? '#eef2ff' : '#fafaf7',
              transition: 'all 0.3s',
              boxShadow: active ? '0 2px 12px #2D5BFF33' : 'none' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>&#128451;</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 700,
                color: active ? '#2D5BFF' : '#7c8aa5' }}>{name}</div>
              {active && queryType === 'single' && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#2D5BFF' }}>queried</div>
              )}
              {active && queryType === 'scatter' && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#2D5BFF' }}>fan-out</div>
              )}
              {reshardMode && (
                <div style={{ marginTop: 6, fontSize: 11, color: movedColor }}>
                  {reshardMode === 'hash' ? '~80% moves' : '~20% moves'}
                </div>
              )}
            </div>
          )
        })}

        {reshardMode && (
          <div style={{
            flex: 1, minWidth: 80, border: `2px solid ${movedColor}`,
            borderRadius: 10, padding: 12, textAlign: 'center',
            background: reshardMode === 'hash' ? '#fff5f5' : '#d4f5e4' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>&#128195;</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 700, color: movedColor }}>
              Shard 4 (new)
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: movedColor }}>
              {reshardMode === 'hash' ? 'receives ~80%' : 'receives ~20%'}
            </div>
          </div>
        )}
      </div>

      {queryType === 'single' && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#eef2ff',
          borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
          hash(42) % 4 = <strong>2</strong> &rarr; query only <strong>Shard 2</strong>.
          Result in <strong>1 network hop</strong>. Fast.
        </div>
      )}
      {queryType === 'scatter' && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#fff3cd',
          borderRadius: 8, fontSize: 13 }}>
          Must query <strong>all 4 shards in parallel</strong>, then merge and re-sort the top-5 from each.
          Cost = <strong>4 &times; (query latency)</strong> + merge overhead. Gets worse as you add shards.
        </div>
      )}
      {reshardMode && (
        <div style={{ marginTop: 14, padding: '10px 14px',
          background: reshardMode === 'hash' ? '#fff5f5' : '#d4f5e4',
          borderRadius: 8, fontSize: 13, borderLeft: `4px solid ${movedColor}` }}>
          <strong>{reshardMode === 'hash' ? '% N resharding' : 'Consistent hashing'}:</strong> {movedDesc}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Demo 3 — Hot Shard Mitigation
   ============================================================ */
const MITIGATION_INFO = {
  subshard: {
    label: 'Add sub-shards',
    desc: 'Spread celebrity writes across 10 sub-keys (userId_0 through userId_9). Reads must query all 10 sub-keys and aggregate. Helps writes; read fan-out is small (only 10 sub-shards, not all shards).',
    fix: 'writes'
  },
  dedicated: {
    label: 'Dedicated shard',
    desc: 'Move the celebrity user to a new high-capacity shard. Full isolation — no other users affected. Best when one entity permanently dominates traffic.',
    fix: 'reads AND writes'
  },
  cache: {
    label: 'Cache reads',
    desc: 'Put Redis in front of the hot shard. Most reads are served from cache; the shard only sees cache misses. Helps reads; writes still hit the shard.',
    fix: 'reads'
  }
}

function HotShardDemo() {
  const [celebrity, setCelebrity] = useState(false)
  const [mitigation, setMitigation] = useState(null)

  function shardLoad(si) {
    if (si !== 2) return 18 + si * 2
    if (!celebrity) return 22
    if (mitigation === 'dedicated') return 20
    if (mitigation === 'subshard') return 38
    if (mitigation === 'cache') return 30
    return 82
  }

  function heatColor(load) {
    if (load >= 70) return '#D9534F'
    if (load >= 45) return '#C9A227'
    if (load >= 30) return '#2D5BFF'
    return '#2E9E6B'
  }

  const loads = [0, 1, 2, 3].map(shardLoad)
  const maxLoad = Math.max(...loads, 1)

  return (
    <div className="panel">
      <div className="ptitle">Live demo &middot; hot shard mitigation</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          className={`act${celebrity ? '' : ' ghost'}`}
          style={{ background: celebrity ? '#D9534F' : undefined }}
          onClick={() => { setCelebrity(c => !c); setMitigation(null) }}>
          {celebrity ? 'Remove celebrity' : 'Celebrity joins (10 000x writes)'}
        </button>
        {celebrity && Object.entries(MITIGATION_INFO).map(([key, info]) => (
          <button key={key} className={`act${mitigation === key ? '' : ' ghost'}`}
            onClick={() => setMitigation(mitigation === key ? null : key)}>
            {info.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {loads.map((load, si) => {
          const color = heatColor(load)
          const isHot = si === 2 && celebrity && mitigation === null
          return (
            <div key={si} style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
              {celebrity && mitigation === 'cache' && si === 2 && (
                <div style={{ marginBottom: 4, fontSize: 11, padding: '3px 8px',
                  background: '#e8f5e9', border: '1px solid #2E9E6B', borderRadius: 6,
                  color: '#1a6b42', fontWeight: 600 }}>
                  Redis cache
                </div>
              )}
              <div style={{
                height: Math.max(load / maxLoad * 120, 8),
                background: color, borderRadius: '6px 6px 0 0',
                width: '100%', transition: 'all 0.5s', position: 'relative' }}>
                {isHot && (
                  <div style={{ position: 'absolute', top: 4, left: '50%',
                    transform: 'translateX(-50%)', fontSize: 16 }}>
                    &#128293;
                  </div>
                )}
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, marginTop: 4,
                color: color, fontWeight: 700 }}>{load}%</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Shard {si}</div>
            </div>
          )
        })}

        {celebrity && mitigation === 'dedicated' && (
          <div style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
            <div style={{ height: 36, background: '#2D5BFF', borderRadius: '6px 6px 0 0',
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14 }}>
              &#11088;
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, marginTop: 4,
              color: '#2D5BFF', fontWeight: 700 }}>20%</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Shard 4 (celeb)</div>
          </div>
        )}

        {celebrity && mitigation === 'subshard' && (
          <div style={{ flex: 2, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Sub-shards (celebrity):</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{ flex: 1, height: 40,
                  background: '#C9A227', borderRadius: '4px 4px 0 0' }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
              userId_0 &hellip; userId_4 (5 of 10 sub-keys shown)
            </div>
          </div>
        )}
      </div>

      {celebrity && !mitigation && (
        <Warn>
          Shard 2 is overloaded. All celebrity writes hash to this shard. Choose a mitigation above.
        </Warn>
      )}
      {celebrity && mitigation && (
        <div style={{ marginTop: 14, padding: '10px 14px',
          background: '#f0f4ff', borderRadius: 8, fontSize: 13,
          borderLeft: '4px solid #2D5BFF' }}>
          <strong>{MITIGATION_INFO[mitigation].label}:</strong>{' '}
          {MITIGATION_INFO[mitigation].desc}
          <div style={{ marginTop: 6, fontSize: 12, color: '#555' }}>
            Fixes: <strong>{MITIGATION_INFO[mitigation].fix}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

/* ===== Quiz data ===== */
const QUESTIONS = [
  {
    q: 'You shard a users table by userId using hash(userId) % 4. You add a 5th shard. What is the main problem?',
    o: [
      'The directory service must be rebuilt from scratch',
      'Almost every key maps to a different shard — you must move roughly 80% of all data',
      'Range queries become impossible',
      'The hash function becomes slower with 5 shards'
    ],
    a: 1,
    e: 'With modulo hashing, changing N from 4 to 5 changes the result of hash(key) % N for most keys. You must migrate those records to their new shard — an enormously expensive data migration.',
    w: {
      0: 'Directory services are irrelevant to hash-based sharding. The problem is the modulo remapping of keys.',
      2: 'Range queries are already scatter-gather with hash sharding. Adding a shard does not change that property.',
      3: 'Hash function speed does not depend on N — it is a trivial calculation. The problem is data migration, not CPU cost.'
    },
    r: { id: 's6', label: 'Section 6 — Resharding and the % N problem' }
  },
  {
    q: 'Which shard key would be the WORST choice for a social media app where 80% of users are in the United States?',
    o: ['email address hash', 'timestamp of account creation', 'userId (UUID)', 'country_code'],
    a: 3,
    e: 'Sharding by country_code puts 80% of all data and writes on the "US" shard while other shards sit nearly idle. This is a classic hotspot caused by low cardinality and skewed data distribution.',
    w: {
      0: 'Email hashes are also well-distributed and high-cardinality — a reasonable shard key choice.',
      1: 'Timestamp can cause a sequential write hotspot but is still far better than a low-cardinality key like country.',
      2: 'UUID is a near-perfect shard key — very high cardinality, uniformly distributed, no hotspots.'
    },
    r: { id: 's3', label: 'Section 3 — Choosing the shard key' }
  },
  {
    q: 'A "scatter-gather" query in a sharded system means:',
    o: [
      'A query is sent to all shards in parallel and results are merged by the caller',
      'The database automatically replicates writes to all shards',
      'Data is gathered from replicas before being scattered to primary shards',
      'The consistent hash ring gathers all virtual nodes before routing'
    ],
    a: 0,
    e: 'Scatter-gather is the pattern for queries that cannot be routed to a single shard. Every shard runs the query locally, and the caller merges all partial results — adding latency proportional to N shards.',
    w: {
      1: 'Replication is a separate mechanism. Scatter-gather is about querying, not write propagation.',
      2: 'This inverts the meaning. There is no "scattering to primaries" step in normal sharding.',
      3: 'The consistent hash ring finds which single shard owns a key — the opposite of scatter-gather.'
    },
    r: { id: 's5', label: 'Section 5 — Cross-shard queries' }
  },
  {
    q: 'You have a users table and an orders table. To avoid cross-shard joins when listing a user\'s orders, you should:',
    o: [
      'Use a directory service to map each orderId to the correct shard',
      'Shard both tables by userId so a user\'s data co-locates on the same shard',
      'Shard users by userId and orders by orderId',
      'Keep users sharded and orders in one un-sharded database'
    ],
    a: 1,
    e: 'Co-locating related data on the same shard is the standard fix for cross-shard joins. If both users and orders are sharded by userId, "all orders for user X" always lives on one shard — no fan-out.',
    w: {
      0: 'A directory service maps keys to shards but does not help if related data is spread across different shards.',
      2: 'Sharding orders by orderId spreads a user\'s orders across all shards. Every order query becomes a scatter-gather — exactly the problem we are trying to avoid.',
      3: 'Keeping orders un-sharded defeats the purpose of horizontal scaling for a table that is often larger than users.'
    },
    r: { id: 's5', label: 'Section 5 — Cross-shard queries and denormalization' }
  },
  {
    q: 'What is a "virtual shard" and why does it help with resharding?',
    o: [
      'A temporary shard used only during the migration window',
      'A replica of a shard used to serve read traffic',
      'A shard that stores only soft-deleted records until garbage collected',
      'A logical partition layer between keys and physical servers, so adding a server only reassigns virtual shard ranges without remapping individual keys'
    ],
    a: 3,
    e: 'Virtual shards (e.g., 1024 fixed slots) form a stable mapping layer. Physical servers own ranges of virtual shards. Adding a server means moving some virtual shard ranges — a bounded, predictable operation — rather than recomputing hash(key) % N for every key.',
    w: {
      0: 'Virtual shards are permanent, not temporary. They are the stable indirection layer that never changes in count.',
      1: 'That describes a read replica, which is a separate concept.',
      2: 'This describes a soft-delete pattern, not virtual shards.'
    },
    r: { id: 's6', label: 'Section 6 — Virtual shards' }
  },
  {
    q: 'Which technique helps most when a single WRITE-heavy celebrity user overwhelms one shard?',
    o: [
      'Append a random suffix (sub-sharding) to spread writes across multiple sub-keys',
      'Switch from hash sharding to range sharding',
      'Move the celebrity to a dedicated shard',
      'Add a Redis cache in front of the hot shard'
    ],
    a: 0,
    e: 'Sub-sharding (userId_0 through userId_9) spreads writes across 10 sub-keys, each hashing to a potentially different shard. This directly reduces write pressure. The trade-off: reads must query all 10 sub-keys and aggregate.',
    w: {
      1: 'Switching sharding strategies is extremely expensive and does not fix the celebrity problem, which is about write concentration for one key.',
      2: 'A dedicated shard isolates the problem but does not distribute writes — the dedicated shard still receives all celebrity writes and hits the same ceiling.',
      3: 'Redis cache absorbs read traffic, not write traffic. A write-heavy user still overwhelms the shard even with a cache.'
    },
    r: { id: 's8', label: 'Section 8 — Hot shard mitigation' }
  },
  {
    q: 'When should you NOT shard your database?',
    o: [
      'When your application uses an ORM like Hibernate',
      'When you are using a relational database like PostgreSQL',
      'When your data fits on one server and read replicas handle your query load',
      'When you have more than 1 million rows'
    ],
    a: 2,
    e: 'Sharding is a last resort because it adds enormous operational complexity: cross-shard queries, difficult transactions, complex resharding. If a single powerful server with read replicas handles your load, that is almost always the better choice.',
    w: {
      0: 'ORM usage is irrelevant to the sharding decision. Many sharding setups use ORMs.',
      1: 'Relational databases like PostgreSQL can absolutely be sharded (tools like Citus exist). The type of database does not determine whether sharding is needed.',
      3: '1 million rows is tiny by modern database standards. A single PostgreSQL server can easily handle hundreds of millions of rows with proper indexing.'
    },
    r: { id: 's10', label: 'Section 10 — When NOT to shard' }
  },
  {
    q: 'Consistent hashing helps with resharding because:',
    o: [
      'It converts range queries into single-shard queries',
      'It eliminates the need for a shard key entirely',
      'When a shard is added or removed, only 1/N of keys need to move on average',
      'It guarantees each shard has exactly the same number of keys'
    ],
    a: 2,
    e: 'Consistent hashing places both keys and servers on a ring. A new server claims one arc of the ring, and only the keys in that arc move. With N servers, adding one moves roughly 1/N of keys — far better than naive modulo hashing which remaps almost everything.',
    w: {
      0: 'Range queries are still scatter-gather with consistent hashing — the hash function scrambles key ordering by design.',
      1: 'You still need a shard key. Consistent hashing changes HOW the key maps to a shard, not whether a key is needed.',
      3: 'Consistent hashing does not guarantee equal key distribution. Virtual nodes are added on top to improve balance.'
    },
    r: { id: 's6', label: 'Section 6 — Consistent hashing and resharding' }
  }
]

/* ===== Day 91 Page ===== */
export default function Day91() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus &middot; Week 17 &middot; Day 91</div>
        <h1>Database Sharding:<br />Partitioning, Shard Keys &amp; Hotspots</h1>
        <p>
          One database server has a ceiling. Sharding breaks data across many servers &mdash; each owns
          a slice. The challenge is not splitting the data; it is choosing HOW to split it so reads stay
          fast, writes stay balanced, and adding a new server does not move everything.
        </p>
        <div className="chips">
          {['Horizontal Scaling', 'Shard Key', 'Hash Sharding', 'Range Sharding',
            'Hot Shard', 'Resharding', 'Virtual Shards', 'Scatter-Gather']
            .map(c => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      {/* ── SECTION 1 ── Library analogy + vertical vs horizontal ── */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The Library with Multiple Buildings</h2>
        <p>
          Imagine a city library. When it runs out of shelf space, it has two choices:
          build a taller building (vertical scaling) or open a second building across the street
          (horizontal scaling). The second building holds books for a specific alphabetical range:
          Building A covers A&ndash;M, Building B covers N&ndash;Z. To find &ldquo;Java Programming&rdquo;
          (starts with J): go straight to Building A. You never search both buildings.
        </p>
        <p>
          Each building is a <strong>shard</strong> &mdash; a separate, fully independent database server.
          It has its own CPU, its own RAM, its own disk. No shared resources. Pure horizontal scaling.
        </p>
        <Code html={`<span class="cm">// VERTICAL SCALING (scale up) — make one server bigger</span>
  Before: <span class="num">1</span> server, <span class="num">32</span> GB RAM,  <span class="num">8</span> CPU,  <span class="num">2</span> TB disk
  After:  <span class="num">1</span> server, <span class="num">256</span> GB RAM, <span class="num">64</span> CPU, <span class="num">20</span> TB disk
  Limit:  hardware ceiling; single point of failure; exponential cost

<span class="cm">// HORIZONTAL SCALING (scale out / sharding)</span>
  Before: <span class="num">1</span> server,  <span class="num">100</span>M rows, all writes hit one machine
  After:  <span class="num">4</span> servers,   <span class="num">25</span>M rows each, writes split across machines
  Limit:  cross-shard queries; resharding complexity; operational overhead

<span class="cm">// The path most teams take (in order):</span>
  1. Add indexes                          ← free, try first
  2. Query optimization                   ← also free
  3. Add read replicas                    ← handle read-heavy load
  4. Vertical scaling (bigger server)     ← handles most startups
  5. Sharding                             ← last resort; huge complexity`} />
        <Note>
          Most apps never need sharding. Before you shard, exhaust indexes, caching, and read replicas.
          Sharding is an operational commitment you cannot easily undo.
        </Note>
        <Reveal summary="How many rows before you should consider sharding?">
          There is no magic number, but rough heuristics: if a single table has more than ~500 million rows
          and write throughput is maxing out a vertically-scaled server, sharding becomes worth discussing.
          Instagram ran on a single PostgreSQL server until they had tens of millions of users.
          The complexity cost of sharding is very real &mdash; do not pay it early.
        </Reveal>
      </section>

      {/* ── SECTION 2 ── Three shard key strategies ── */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Three Shard Key Strategies</h2>
        <p>
          The <strong>shard key</strong> is the column (or columns) used to decide which shard a row
          belongs to. There are three main strategies for how to map key values to shards.
        </p>
        <Code html={`<span class="cm">// ── 1. RANGE-BASED SHARDING ──────────────────────────────</span>
<span class="cm">// Split by value range of the shard key.</span>
  Shard 0:  userId       0 – 9,999,999
  Shard 1:  userId  10M  – 19,999,999
  Shard 2:  userId  20M  – 29,999,999
  Shard 3:  userId  30M+

  PRO:  range queries within one shard are fast
        "all users created in January" → Shard 0 only
  CON:  HOTSPOT RISK — new users get high IDs,
        so Shard 3 gets all writes; Shards 0–2 sit idle

<span class="cm">// ── 2. HASH-BASED SHARDING ───────────────────────────────</span>
<span class="cm">// shard = hash(userId) % N</span>
  hash(<span class="num">1001</span>) % <span class="num">4</span> = <span class="num">2</span>  → Shard 2
  hash(<span class="num">1002</span>) % <span class="num">4</span> = <span class="num">3</span>  → Shard 3
  hash(<span class="num">1003</span>) % <span class="num">4</span> = <span class="num">0</span>  → Shard 0

  PRO:  uniform distribution — no hotspots
  CON:  range queries are scatter-gather (must query ALL shards)
        resharding requires moving most data (% N changes)

<span class="cm">// ── 3. DIRECTORY-BASED SHARDING ──────────────────────────</span>
<span class="cm">// A separate lookup table maps each key to its shard.</span>
  shard_map table:
    userId 1001  →  Shard 2
    userId 1002  →  Shard 0
    userId 1003  →  Shard 1   (can be moved any time)

  PRO:  flexible — move individual rows between shards
  CON:  the directory is a bottleneck + single point of failure
        must be cached (e.g., Redis) to stay fast`} />

        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table className="matrix">
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Distribution</th>
                <th>Range queries</th>
                <th>Resharding cost</th>
                <th>Extra component</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Range</strong></td>
                <td className="no">Uneven (hotspot risk)</td>
                <td className="yes">Fast (1 shard)</td>
                <td className="no">Split one shard</td>
                <td className="yes">None</td>
              </tr>
              <tr>
                <td><strong>Hash</strong></td>
                <td className="yes">Even</td>
                <td className="no">Scatter-gather</td>
                <td className="no">Remap most keys</td>
                <td className="yes">None</td>
              </tr>
              <tr>
                <td><strong>Directory</strong></td>
                <td className="yes">Flexible</td>
                <td className="no">Scatter-gather</td>
                <td className="yes">Update lookup table</td>
                <td className="no">Lookup service</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── SECTION 3 ── Choosing the shard key ── */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Choosing the Shard Key &mdash; the Most Important Decision</h2>
        <p>
          A bad shard key causes one or more of three failure modes: hotspots, cross-shard queries,
          and uneven data distribution. Choose once &mdash; changing later requires migrating all your data.
        </p>
        <Code html={`<span class="cm">// THREE RULES for a good shard key</span>

<span class="cm">// Rule 1: HIGH CARDINALITY — many distinct values</span>
  Good:  userId (millions of unique users)
  Bad:   gender (<span class="str">"M"</span>/<span class="str">"F"</span>/<span class="str">"Other"</span> — only 3 shards useful)

<span class="cm">// Rule 2: EVEN DISTRIBUTION — no single value dominates</span>
  Good:  random UUID
  Bad:   country_code (80% of users → "US" shard)

<span class="cm">// Rule 3: ACCESS PATTERN ALIGNMENT</span>
<span class="cm">// Queries that belong together should hit one shard.</span>
  If your app mostly queries "all orders by customer":
    Shard key = customerId  ← customer + orders co-locate
  NOT orderId              ← customer's orders scatter everywhere

<span class="cm">// REAL EXAMPLE: Twitter-like app</span>
  Option A: shard tweets by tweetId
    → "get all tweets by user X" hits ALL shards (bad)

  Option B: shard tweets by userId
    → "get all tweets by user X" hits ONE shard (fast)
    → but @BarackObama's shard gets millions of writes (hotspot)
    → fix: sub-sharding for celebrities (Section 8)`} />
        <Warn>
          The shard key decision is permanent. Changing it later means rewriting every row in your
          database. Get it right upfront by modeling your most common queries first.
        </Warn>
        <Reveal summary="What about composite shard keys?">
          Sometimes no single column makes a perfect shard key, so you combine two columns.
          For example: <C>(tenantId, userId)</C> is common in multi-tenant SaaS apps.
          All data for one tenant stays on the same shard, but large tenants can still be
          split by userId within the tenant prefix. The trade-off is a more complex routing layer.
        </Reveal>
      </section>

      {/* ── SECTION 4 ── Interactive: Shard key comparison ── */}
      <section id="s4">
        <div className="sec-label">Section 4 &middot; Interactive</div>
        <h2>Play: Compare Shard Key Strategies</h2>
        <p>
          Watch 20 users being routed to 4 shards under each strategy.
          Switch between Range, Hash, and Directory tabs.
          Then click &ldquo;Write burst&rdquo; to add 10 high-ID users and watch what happens to each strategy.
          In Directory mode, click a user card to simulate the lookup table query.
        </p>
        <ShardKeyDemo />
        <Good>
          Key insight: Hash sharding distributes the burst evenly. Range sharding creates a hotspot on
          Shard 3. Directory sharding adds an extra lookup round-trip per write.
        </Good>
      </section>

      {/* ── SECTION 5 ── Cross-shard queries ── */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Cross-Shard Queries &mdash; the Main Cost of Sharding</h2>
        <p>
          When a query needs data from more than one shard, it must fan out to all shards,
          collect partial results, and merge them. This is called <strong>scatter-gather</strong>.
          It is slower and more complex than a single-shard query, and it gets worse as you add shards.
        </p>
        <Code html={`<span class="cm">// BEFORE sharding — one database, one query</span>
List&lt;User&gt; topSpenders = db.query(
    <span class="str">"SELECT * FROM users ORDER BY total_spend DESC LIMIT 10"</span>);
<span class="cm">// cost: O(1 query)</span>

<span class="cm">// AFTER sharding — must query ALL N shards</span>
List&lt;User&gt; topSpenders = shards.parallelStream()
    .flatMap(shard -&gt;
        shard.query(<span class="str">"SELECT * FROM users ORDER BY total_spend DESC LIMIT 10"</span>)
             .stream())
    .sorted(Comparator.comparingLong(User::totalSpend).reversed())
    .limit(<span class="num">10</span>)
    .collect(toList());
<span class="cm">// cost: O(N × K) across N shards, plus merge step</span>

<span class="cm">// CROSS-SHARD JOINS — often impossible in a single query</span>
<span class="cm">// "Find all orders with the buyer's email address"</span>
<span class="cm">// users on Shard A, orders on Shard B — cannot JOIN across servers</span>

<span class="cm">// FIX: denormalize — copy the email onto the orders table</span>
<span class="kw">class</span> Order {
    <span class="kw">long</span> orderId;
    <span class="kw">long</span> userId;
    String buyerEmail;   <span class="cm">// copied from users table — no join needed</span>
    Money amount;
}`} />
        <Note>
          The rule of thumb: shard both related tables by the same key (e.g., both <C>users</C> and
          <C>orders</C> by <C>userId</C>) so they co-locate. A query for &ldquo;all orders by user X&rdquo;
          then hits exactly one shard. This is called <strong>co-location</strong>.
        </Note>
        <Reveal summary="What about distributed transactions across shards?">
          Transactions that touch multiple shards require a <strong>two-phase commit (2PC)</strong> protocol.
          2PC is slow, complex, and has failure modes (coordinator crashes, blocking).
          Most sharded systems avoid cross-shard transactions entirely by co-locating related data,
          or they use eventual consistency patterns (event sourcing, saga pattern) instead.
        </Reveal>
      </section>

      {/* ── SECTION 6 ── Resharding ── */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Resharding &mdash; What Happens When You Add a Shard</h2>
        <p>
          Adding a shard is painful with naive hash sharding. With 4 shards, a key goes to
          <C>hash(key) % 4</C>. With 5 shards, it goes to <C>hash(key) % 5</C>.
          For most keys, these give different results. You must physically move those rows to their
          new shard &mdash; often 70&ndash;85% of all data. Hours of downtime, or a complex online migration.
        </p>
        <Code html={`<span class="cm">// NAIVE RESHARDING: add 1 shard to 4 → must move most data</span>
hash(<span class="num">42</span>) % <span class="num">4</span> = <span class="num">2</span>   <span class="cm">// currently on Shard 2</span>
hash(<span class="num">42</span>) % <span class="num">5</span> = <span class="num">2</span>   <span class="cm">// stays (lucky)</span>
hash(<span class="num">43</span>) % <span class="num">4</span> = <span class="num">3</span>   <span class="cm">// currently on Shard 3</span>
hash(<span class="num">43</span>) % <span class="num">5</span> = <span class="num">3</span>   <span class="cm">// stays (lucky)</span>
hash(<span class="num">44</span>) % <span class="num">4</span> = <span class="num">0</span>   <span class="cm">// currently on Shard 0</span>
hash(<span class="num">44</span>) % <span class="num">5</span> = <span class="num">4</span>   <span class="cm">// MOVES to new Shard 4 ← expensive!</span>
<span class="cm">// On average, (N-1)/N of all keys must move ≈ 75% for N=4→5</span>

<span class="cm">// CONSISTENT HASHING: keys and servers on a ring</span>
<span class="cm">// Adding a server only takes its "arc" of keys</span>
Ring: [──────── Server A ────────][────── Server B ──────][── Server C ──]
Add D: [── Server A ──][──D──][── Server B ──][──D──][── Server C ──][D]
<span class="cm">// Only the keys in D's claimed arcs move ≈ 1/N of all keys</span>

<span class="cm">// VIRTUAL SHARDS: stable indirection layer</span>
<span class="cm">// Map keys to 1024 fixed virtual shards; physical servers own ranges.</span>
Virtual shards <span class="num">0</span>–<span class="num">1023</span>:
  Server A owns:  <span class="num">0</span>–<span class="num">511</span>
  Server B owns:  <span class="num">512</span>–<span class="num">1023</span>

Add Server C:
  Server A owns:  <span class="num">0</span>–<span class="num">255</span>
  Server B owns:  <span class="num">512</span>–<span class="num">767</span>
  Server C owns:  <span class="num">256</span>–<span class="num">511</span>, <span class="num">768</span>–<span class="num">1023</span>  ← took half from each
<span class="cm">// Virtual shard count (1024) never changes — only the server assignment</span>`} />
        <Good>
          Virtual shards give you the best of both worlds: simple modulo routing to virtual shards
          (no ring needed), plus cheap resharding (move virtual shard ranges, not individual keys).
          Cassandra and DynamoDB use variants of this idea.
        </Good>
        <Reveal summary="What is the difference between consistent hashing and virtual shards?">
          Consistent hashing places keys and servers on a continuous ring; key-to-server mapping
          uses the ring walk. Virtual shards use a fixed table: <C>hash(key) % 1024</C> gives a
          virtual shard index, and a separate table says which physical server owns that index.
          Both achieve ~1/N data movement on node changes. Virtual shards are simpler to reason about
          but require a config store for the virtual&rarr;physical mapping.
        </Reveal>
      </section>

      {/* ── SECTION 7 ── Interactive: Cross-shard query + resharding ── */}
      <section id="s7">
        <div className="sec-label">Section 7 &middot; Interactive</div>
        <h2>Play: Cross-Shard Queries &amp; Resharding</h2>
        <p>
          Click &ldquo;Find user 42&rdquo; to see a single-shard lookup &mdash; one server lights up.
          Click &ldquo;Top 5 spenders&rdquo; to see scatter-gather &mdash; all servers light up.
          Then try adding a 5th shard with both naive hash modulo and consistent hashing,
          and compare how much data moves.
        </p>
        <CrossShardQueryDemo />
        <Good>
          Single-shard queries are the goal. Scatter-gather is sometimes unavoidable but always
          more expensive. Consistent hashing dramatically reduces migration cost when adding shards.
        </Good>
      </section>

      {/* ── SECTION 8 ── Hot shard mitigation ── */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Hot Shard Mitigation</h2>
        <p>
          Even with a perfect shard key, a single very popular entity can overwhelm one shard.
          A celebrity with 50 million followers generates thousands of writes per second;
          all those writes hash to the same shard. Here are three ways to fix it.
        </p>
        <Code html={`<span class="cm">// TECHNIQUE 1: Sub-sharding (random suffix)</span>
<span class="cm">// Spread writes across 10 sub-keys for the hot entity</span>
<span class="kw">int</span> suffix = ThreadLocalRandom.current().nextInt(<span class="num">10</span>); <span class="cm">// 0–9</span>
String subKey = userId + <span class="str">"_"</span> + suffix;  <span class="cm">// e.g., "celeb_3"</span>
db.write(subKey, data);

<span class="cm">// Reading: query all 10 sub-keys and aggregate</span>
List&lt;Data&gt; result = IntStream.range(<span class="num">0</span>, <span class="num">10</span>)
    .mapToObj(i -&gt; db.read(userId + <span class="str">"_"</span> + i))
    .flatMap(Collection::stream)
    .collect(toList());

<span class="cm">// TECHNIQUE 2: Dedicated shard for the celebrity</span>
<span class="cm">// A directory entry overrides the hash assignment</span>
shard_map.put(celebUserId, CELEBRITY_SHARD); <span class="cm">// high-spec server</span>

<span class="cm">// TECHNIQUE 3: Cache the reads on the hot shard</span>
<span class="cm">// Redis absorbs the read traffic; shard only handles writes</span>
String cached = redis.get(<span class="str">"profile:"</span> + celebUserId);
<span class="kw">if</span> (cached == <span class="kw">null</span>) {
    cached = shard.read(celebUserId); <span class="cm">// cache miss — hits shard</span>
    redis.setex(<span class="str">"profile:"</span> + celebUserId, <span class="num">300</span>, cached);
}
<span class="cm">// 99% of reads served from Redis — shard barely touched</span>`} />

        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table className="matrix">
            <thead>
              <tr>
                <th>Technique</th>
                <th>Helps writes?</th>
                <th>Helps reads?</th>
                <th>Trade-off</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Sub-sharding</strong></td>
                <td className="yes">Yes (10x spread)</td>
                <td className="no">No (fan-out reads)</td>
                <td>Read aggregation complexity</td>
              </tr>
              <tr>
                <td><strong>Dedicated shard</strong></td>
                <td className="yes">Yes</td>
                <td className="yes">Yes</td>
                <td>Extra infrastructure; one key still hot</td>
              </tr>
              <tr>
                <td><strong>Cache reads</strong></td>
                <td className="no">No</td>
                <td className="yes">Yes (cache hit rate)</td>
                <td>Cache invalidation complexity</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Note>
          In practice you combine techniques: cache reads to absorb the read load, and
          sub-shard or use a dedicated shard to absorb writes. The right mix depends on the
          read-to-write ratio of the hot entity.
        </Note>
      </section>

      {/* ── SECTION 9 ── Interactive: Hot shard demo ── */}
      <section id="s9">
        <div className="sec-label">Section 9 &middot; Interactive</div>
        <h2>Play: Hot Shard Mitigation</h2>
        <p>
          Start with 4 balanced shards. Click &ldquo;Celebrity joins&rdquo; to overload Shard 2.
          Then try each mitigation technique and see which metric it fixes.
          Notice: caching drops the load meter but only for reads; sub-sharding spreads write load
          but creates a read fan-out; a dedicated shard isolates completely.
        </p>
        <HotShardDemo />
      </section>

      {/* ── SECTION 10 ── When NOT to shard + cheat sheet ── */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>When NOT to Shard &mdash; and a Cheat Sheet</h2>
        <p>
          Sharding is powerful but expensive. Most teams should not shard until they have exhausted
          all simpler options. Here is the full decision ladder, then a quick reference.
        </p>
        <Code html={`<span class="cm">// BEFORE sharding, try these in order:</span>
<span class="num">1</span>. Add the right indexes           ← often fixes slow queries entirely
<span class="num">2</span>. Optimize slow queries            ← EXPLAIN ANALYZE is your friend
<span class="num">3</span>. Cache hot reads (Redis)          ← absorbs 80%+ of read traffic
<span class="num">4</span>. Add read replicas               ← scales reads linearly
<span class="num">5</span>. Partition pruning (table partitions) ← one DB, multiple files, fast scans
<span class="num">6</span>. Vertical scaling (bigger machine) ← expensive but simple
<span class="num">7</span>. Sharding                         ← only here`} />
        <Note>
          <strong>Partition pruning</strong> is a middle ground: split one table into
          range-based partitions on a single database server. The DB automatically skips irrelevant
          partitions on queries. No cross-shard complexity, no resharding. Works up to a few billion rows.
        </Note>
        <h3 style={{ marginTop: 24 }}>Cheat sheet</h3>
        <ul>
          <li><strong>Shard</strong> &mdash; a single database server holding a partition of your data.</li>
          <li><strong>Shard key</strong> &mdash; the column that determines which shard a row belongs to.</li>
          <li><strong>Range sharding</strong> &mdash; routes by value range; fast range queries; hotspot risk on sequential keys.</li>
          <li><strong>Hash sharding</strong> &mdash; routes by <C>hash(key) % N</C>; even distribution; scatter-gather range queries; expensive resharding.</li>
          <li><strong>Directory sharding</strong> &mdash; lookup table maps key to shard; flexible; extra latency + single point of failure without caching.</li>
          <li><strong>Scatter-gather</strong> &mdash; fan out a query to all shards, merge results; cost grows with N.</li>
          <li><strong>Co-location</strong> &mdash; shard related tables by the same key so joins stay within one shard.</li>
          <li><strong>Hot shard</strong> &mdash; one shard receives disproportionate traffic; fix with sub-sharding, dedicated shard, or caching.</li>
          <li><strong>Consistent hashing</strong> &mdash; key-to-server mapping via a ring; adding/removing a server moves only ~1/N keys.</li>
          <li><strong>Virtual shards</strong> &mdash; stable indirection layer (e.g., 1024 slots); resharding = reassigning virtual shard ranges, not remapping individual keys.</li>
          <li><strong>Resharding</strong> &mdash; splitting or moving shards when capacity changes; hardest operational task in sharded systems.</li>
          <li><strong>Denormalization</strong> &mdash; copying data to avoid cross-shard joins; trades storage for query simplicity.</li>
        </ul>
        <Reveal summary="Java: complete shard router skeleton">
          <Code html={`<span class="kw">class</span> HashShardRouter {
    <span class="kw">private final</span> List&lt;DataSource&gt; shards;

    HashShardRouter(List&lt;DataSource&gt; shards) {
        <span class="kw">this</span>.shards = shards; <span class="cm">// inject the shard connections</span>
    }

    DataSource getShardFor(<span class="kw">long</span> userId) {
        <span class="kw">int</span> idx = (<span class="kw">int</span>)(Math.abs(userId) % shards.size());
        <span class="kw">return</span> shards.get(idx); <span class="cm">// O(1) routing</span>
    }

    <span class="cm">// Scatter-gather: run query on ALL shards, merge results</span>
    &lt;T&gt; List&lt;T&gt; scatterGather(Function&lt;DataSource, List&lt;T&gt;&gt; query) {
        <span class="kw">return</span> shards.parallelStream()
            .flatMap(shard -&gt; query.apply(shard).stream())
            .collect(Collectors.toList());
    }
}`} />
        </Reveal>
      </section>

      {/* ── BONUS ── Replication & quorums: sharding's sibling */}
      <section id="replication">
        <div className="sec-label">Bonus deep-dive · Replication &amp; quorums</div>
        <h2>Replication — the other half of "scale the database"</h2>
        <p>
          Interviewers love asking "sharding vs replication?" because candidates constantly mix them up.
          They solve different problems: <strong>sharding splits</strong> the data (each server holds a
          different slice — more capacity), <strong>replication copies</strong> the data (each server holds
          the same data — more read throughput and fault tolerance). Production systems do BOTH: each shard
          is itself a small replica set.
        </p>
        <Code html={`<span class="cm">// Leader-follower replication (the default everywhere: Postgres, MySQL, MongoDB)</span>
<span class="cm">//</span>
<span class="cm">//                    writes</span>
<span class="cm">//                      │</span>
<span class="cm">//                      ▼</span>
<span class="cm">//                  [LEADER]  ── the only node that accepts writes</span>
<span class="cm">//                   /     \\      (one writer = no write conflicts)</span>
<span class="cm">//        replication       replication</span>
<span class="cm">//                 /           \\</span>
<span class="cm">//        [FOLLOWER 1]     [FOLLOWER 2]  ── serve reads; take over if leader dies</span>
<span class="cm">//              ▲                ▲</span>
<span class="cm">//            reads            reads</span>
<span class="cm">//</span>
<span class="cm">// SYNC replication:  leader waits for followers to confirm before ACKing the write</span>
<span class="cm">//                    → zero data loss on failover, but every write pays the wait</span>
<span class="cm">// ASYNC replication: leader ACKs immediately, followers catch up behind</span>
<span class="cm">//                    → fast writes, but followers LAG (ms to seconds)</span>
<span class="cm">//                    → leader dies before shipping? those writes are LOST</span>`} />
        <p>
          Async lag creates the classic bug every interviewer probes: <strong>read-your-own-writes</strong>.
          A user updates their profile (write → leader), the page reloads (read → lagging follower), and
          their change is "gone." Standard fixes, in preference order:
        </p>
        <ul>
          <li><strong>Pin the author to the leader</strong> for a short window after their write (e.g. 10 s), or for reads of data they themselves own.</li>
          <li><strong>Session timestamp:</strong> client remembers its last-write time; reads go to a replica only if the replica has caught up past it.</li>
          <li><strong>Accept it</strong> where staleness is harmless (view counts, someone else's profile) — this is Day 90's CAP trade made at the replica level.</li>
        </ul>
        <h3 style={{ marginTop: 24 }}>Quorums — replication without a fixed leader</h3>
        <Code html={`<span class="cm">// Leaderless systems (Cassandra, DynamoDB) replace "the leader knows best"</span>
<span class="cm">// with ARITHMETIC. With N replicas, pick W and R such that:</span>
<span class="cm">//</span>
<span class="cm">//        W + R &gt; N      →  every read set OVERLAPS every write set</span>
<span class="cm">//                           by at least one node → the read always</span>
<span class="cm">//                           touches at least one up-to-date copy</span>
<span class="cm">//</span>
<span class="cm">// N=3, W=2, R=2:  2+2 &gt; 3 ✅  balanced (the common default)</span>
<span class="cm">// N=3, W=3, R=1:  fast reads, writes block if ANY replica is down</span>
<span class="cm">// N=3, W=1, R=1:  1+1 &lt; 3 ❌  fast everything — and stale reads possible</span>
<span class="cm">//                              (this is choosing AP with your eyes open)</span>`} />
        <Warn>
          <strong>The failover trap — split brain:</strong> when the leader dies, a follower is promoted.
          But if the OLD leader was merely unreachable (network partition, long GC pause) and comes back,
          you briefly have TWO leaders accepting writes — conflicting data that no automatic process can
          merge. Real systems prevent it with a quorum vote for promotion and by "fencing" the old leader
          (revoking its ability to write). Naming "split brain" and "fencing" in an interview is a strong
          senior signal.
        </Warn>
        <Reveal summary="How replication and sharding compose in a real deployment">
          <p>
            A large system shards users across, say, 8 shards by <C>hash(user_id)</C> — and each shard is a
            3-node replica set (1 leader + 2 followers). Writes for a user go to their shard's leader; reads
            can hit that shard's followers. Losing any single machine loses nothing: a follower is promoted
            inside that one shard while the other 7 shards never notice. That sentence — "shard for capacity,
            replicate each shard for availability" — is the complete answer to "how does the database scale?"
          </p>
        </Reveal>
      </section>

      {/* ── INTERVIEW CORNER ── */}
      <section id="interview">
        <div className="sec-label">Interview corner &middot; Rapid fire</div>
        <h2>Interview Corner</h2>
        <p>
          These are the questions interviewers ask about sharding. Each answer is hidden &mdash; try
          to answer first, then reveal.
        </p>

        <Reveal summary="What is database sharding and when do you actually need it?">
          <p>
            Sharding is horizontal partitioning of data across multiple database servers, each called a shard.
            Each shard is a fully independent server owning a subset of rows.
          </p>
          <p>
            You need it when: (1) write throughput exceeds what one server can handle even after vertical
            scaling, or (2) the total data size exceeds what one server can store affordably.
            Before sharding, exhaust indexes, caching, read replicas, and vertical scaling.
            Sharding adds enormous operational complexity and should be a last resort.
          </p>
        </Reveal>

        <Reveal summary="What makes a good shard key? Name three rules.">
          <ol>
            <li>
              <strong>High cardinality</strong> &mdash; many distinct values so data spreads across many
              shards. <C>userId</C> (millions of values): good. <C>gender</C> (3 values): terrible.
            </li>
            <li>
              <strong>Even distribution</strong> &mdash; no single value dominates traffic.
              Random UUID: good. <C>country_code</C> when 80% of users are US: bad (hotspot on US shard).
            </li>
            <li>
              <strong>Access pattern alignment</strong> &mdash; queries that logically belong together
              should hit one shard. If you mostly query &ldquo;all orders by customer&rdquo;,
              shard by <C>customerId</C>, not <C>orderId</C>.
            </li>
          </ol>
          <p>The shard key decision is effectively permanent. Changing it requires rewriting all data.</p>
        </Reveal>

        <Reveal summary="What is a hot shard? Give three ways to fix it.">
          <p>
            A hot shard is a shard receiving disproportionate traffic &mdash; usually because a single entity
            (e.g., a celebrity user) generates far more reads or writes than average.
            Even with a good shard key overall, a specific key can be anomalous.
          </p>
          <ol>
            <li>
              <strong>Sub-sharding</strong>: write to <C>userId_0</C> through <C>userId_9</C>
              (random suffix). Spreads writes 10x. Reads must aggregate all 10 sub-keys.
            </li>
            <li>
              <strong>Dedicated shard</strong>: move the hot entity to its own high-capacity shard
              via a directory override. Isolates fully but needs extra infrastructure.
            </li>
            <li>
              <strong>Cache reads</strong>: put Redis in front of the hot shard. 99% of reads
              served from cache; shard only handles cache misses and writes.
            </li>
          </ol>
        </Reveal>

        <Reveal summary="Why is resharding expensive with naive hash sharding, and how does consistent hashing help?">
          <p>
            With naive <C>hash(key) % N</C>: changing N from 4 to 5 makes most keys evaluate to a
            different shard index. You must physically move ~75&ndash;85% of all rows. On a multi-TB database
            this takes hours and risks downtime.
          </p>
          <p>
            Consistent hashing places both keys and servers on a circular ring. A key belongs to the
            first server clockwise from it. Adding one server = it claims one arc of the ring. Only the
            keys in that arc need to move &mdash; approximately 1/N of total data. With N=10 shards,
            adding a shard moves ~10% of data instead of ~90%.
          </p>
        </Reveal>

        <Reveal summary="What is a cross-shard join and why is it painful?">
          <p>
            A cross-shard join happens when a query needs to combine rows from two tables that live on
            different shards. For example: <C>users</C> sharded by <C>userId</C> and <C>orders</C>
            sharded by <C>orderId</C>. To get &ldquo;all orders with the buyer name&rdquo; you cannot do a
            SQL JOIN across servers.
          </p>
          <p>Solutions:</p>
          <ul>
            <li><strong>Co-location</strong>: shard both tables by the same key (<C>userId</C>). Data that belongs together lands on the same shard.</li>
            <li><strong>Denormalization</strong>: copy the buyer name into the orders table. No join needed at query time.</li>
            <li><strong>Application-side join</strong>: query each shard separately, join in Java code. Only practical for small result sets.</li>
          </ul>
        </Reveal>

        <Reveal summary="What are virtual shards and how do they make resharding easier?">
          <p>
            Virtual shards (also called virtual nodes or vnodes in Cassandra) add a stable indirection
            layer between keys and physical servers. Instead of mapping <C>hash(key) % N</C> directly
            to physical servers (where N changes on resharding), you map <C>hash(key) % 1024</C> to
            a fixed set of 1024 virtual shards. A separate table maps physical servers to virtual shard
            ranges.
          </p>
          <p>
            Adding a physical server means reassigning some virtual shard ranges to the new server &mdash;
            a configuration change, not a full key remapping. The 1024 virtual shard count never changes.
            Only a subset of virtual shard ranges (and the data in them) move to the new server.
            This makes resharding a predictable, incremental operation.
          </p>
        </Reveal>
      </section>

      {/* ── QUIZ ── */}
      <section id="squiz">
        <div className="sec-label">Section 11 &middot; Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations and revisit links appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* HOMEWORK FOOTER */}
      <div className="footer">
        <strong>Day 91 complete?</strong> Homework: design a sharding strategy for a messaging
        app with 500 million users. Which column(s) would you shard by? How would you handle a
        group chat where all participants need the same messages? Write the shard router class and
        document your co-location decisions.
        <br /><br />
        Next: <strong>Day 92 &mdash; API Gateway &amp; Service Mesh</strong>: how traffic enters
        a microservices system, what an API gateway does (rate limiting, auth, routing, logging),
        and how a service mesh handles service-to-service communication (mTLS, circuit breaking,
        retries, observability).
      </div>

    </div>
  )
}
