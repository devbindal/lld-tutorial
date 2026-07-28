import { useState, useMemo } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ─────────────────────────────────────────────────────────────
   Helpers shared by demos
───────────────────────────────────────────────────────────────*/

// Simple deterministic hash — produces an integer 0–359 (ring positions)
function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h) % 360
}

// Return next-clockwise server (TreeMap.ceilingEntry logic)
function getServer(ring, keyPos) {
  // ring: sorted array of { pos, server }
  for (const node of ring) {
    if (node.pos >= keyPos) return node.server
  }
  return ring[0]?.server ?? null // wrap around
}

function buildRing(servers, virtualNodes) {
  const ring = []
  for (const s of servers) {
    for (let v = 0; v < virtualNodes; v++) {
      ring.push({ pos: hashStr(s + '#' + v), server: s })
    }
  }
  ring.sort((a, b) => a.pos - b.pos)
  return ring
}

const SERVER_COLORS = {
  'Server A': '#2D5BFF',
  'Server B': '#2E9E6B',
  'Server C': '#C9A227',
  'Server D': '#D9534F',
}

const SAMPLE_KEYS = [
  'user:1', 'user:2', 'user:3', 'order:1',
  'order:2', 'item:1', 'item:2', 'item:3',
  'session:1', 'cache:1',
]

/* ─────────────────────────────────────────────────────────────
   Demo 1 — Hash Ring Visualizer
───────────────────────────────────────────────────────────────*/
function RingVisualizer() {
  const [servers, setServers] = useState(['Server A', 'Server B', 'Server C'])
  const [inputKey, setInputKey] = useState('user:42')
  const [showD, setShowD] = useState(false)
  const [prevAssignments, setPrevAssignments] = useState(null)

  const activeServers = showD ? [...servers, 'Server D'] : servers

  const ring = useMemo(() => buildRing(activeServers, 1), [activeServers])

  // For each sample key, get its server
  const assignments = useMemo(() => {
    const map = {}
    for (const k of SAMPLE_KEYS) {
      map[k] = getServer(ring, hashStr(k))
    }
    return map
  }, [ring])

  const lookupPos = hashStr(inputKey)
  const lookedUpServer = getServer(ring, lookupPos)

  function handleAddD() {
    // Capture current assignments before adding D
    const before = {}
    const oldRing = buildRing(servers, 1)
    for (const k of SAMPLE_KEYS) {
      before[k] = getServer(oldRing, hashStr(k))
    }
    setPrevAssignments(before)
    setShowD(true)
  }

  function handleReset() {
    setShowD(false)
    setPrevAssignments(null)
  }

  const movedCount = prevAssignments
    ? SAMPLE_KEYS.filter(k => prevAssignments[k] !== assignments[k]).length
    : 0

  // SVG ring rendering
  const cx = 130, cy = 130, r = 100
  function posToXY(pos) {
    // 0° at top (12 o'clock), clockwise
    const angle = (pos / 360) * 2 * Math.PI - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  const serverPositions = activeServers.map(s => ({
    name: s,
    pos: hashStr(s + '#0'),
    ...posToXY(hashStr(s + '#0')),
    color: SERVER_COLORS[s] || '#888',
  }))

  const keyDot = posToXY(lookupPos)

  // Arrow: from key dot, along ring clockwise to target server
  const targetSrv = serverPositions.find(sp => sp.name === lookedUpServer)

  return (
    <div className="panel">
      <div className="ptitle">Demo 1 · Hash ring — key lookup &amp; server add</div>
      <p style={{ fontSize: 14, marginBottom: 12 }}>
        Type a key. Watch it land on the ring and point to the next clockwise server.
        Then add Server D and see how few keys move.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        {/* SVG ring */}
        <svg width={260} height={260} style={{ flexShrink: 0, border: '1px solid var(--line)', borderRadius: 8, background: '#f8f8f5' }}>
          {/* ring circle */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#DCD9CF" strokeWidth={2} />

          {/* 0° marker */}
          <line x1={cx} y1={cy - r - 6} x2={cx} y2={cy - r + 6} stroke="#999" strokeWidth={1} />
          <text x={cx} y={cy - r - 10} textAnchor="middle" fontSize={10} fill="#999">0°</text>

          {/* server arcs (colored segments between consecutive nodes) */}
          {serverPositions.map((sp) => (
            <g key={sp.name}>
              <circle cx={sp.x} cy={sp.y} r={8} fill={sp.color} />
              <text x={sp.x} y={sp.y - 12} textAnchor="middle" fontSize={9} fill={sp.color} fontWeight="bold">
                {sp.name.replace('Server ', 'S')}
              </text>
              <text x={sp.x} y={sp.y + 20} textAnchor="middle" fontSize={8} fill="#999">
                {sp.pos}°
              </text>
            </g>
          ))}

          {/* key dot */}
          <circle cx={keyDot.x} cy={keyDot.y} r={5} fill="#D9534F" stroke="#fff" strokeWidth={1.5} />
          <text x={keyDot.x + 8} y={keyDot.y + 4} fontSize={9} fill="#D9534F" fontWeight="bold">
            {inputKey.length > 8 ? inputKey.slice(0, 8) + '…' : inputKey}
          </text>

          {/* arrow from key to target server */}
          {targetSrv && (
            <line
              x1={keyDot.x} y1={keyDot.y}
              x2={targetSrv.x} y2={targetSrv.y}
              stroke="#D9534F" strokeWidth={1.5} strokeDasharray="4 2"
            />
          )}

          {/* center label */}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fill="#7c8aa5">Hash Ring</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="#7c8aa5">0–359°</text>
        </svg>

        {/* controls + result */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Key to look up:</label>
            <input
              className="txt"
              value={inputKey}
              onChange={e => setInputKey(e.target.value || 'x')}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{
            background: '#f0f4ff', border: '1px solid #bcd', borderRadius: 6,
            padding: '8px 12px', marginBottom: 12, fontSize: 13
          }}>
            <b>hash("{inputKey}") = {lookupPos}°</b><br />
            Next clockwise server:&nbsp;
            <b style={{ color: SERVER_COLORS[lookedUpServer] || '#222' }}>{lookedUpServer}</b>
          </div>

          {!showD ? (
            <button className="act" onClick={handleAddD}>+ Add Server D</button>
          ) : (
            <button className="ghost act" onClick={handleReset}>Reset (remove D)</button>
          )}

          {prevAssignments && (
            <div style={{ marginTop: 12, fontSize: 13 }}>
              <div style={{
                background: movedCount <= 4 ? '#f0fff4' : '#fff8f0',
                border: '1px solid #b2dfdb', borderRadius: 6, padding: '8px 12px', marginBottom: 8
              }}>
                <b>Keys moved: {movedCount} / {SAMPLE_KEYS.length}</b>
                &nbsp;({Math.round(movedCount / SAMPLE_KEYS.length * 100)}%)
                <br />
                <span style={{ color: '#666' }}>
                  Modulo hashing would move ~{Math.round((1 - 3 / 4) * 100)}% (75%)
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SAMPLE_KEYS.map(k => {
                  const moved = prevAssignments[k] !== assignments[k]
                  return (
                    <span key={k} style={{
                      fontSize: 11, padding: '2px 7px', borderRadius: 10,
                      background: moved ? '#fde' : '#e8f5e9',
                      color: moved ? '#c0392b' : '#2e7d32',
                      border: `1px solid ${moved ? '#f5b7b1' : '#a5d6a7'}`,
                    }}>
                      {k}
                      {moved ? ' ↗' : ' ✓'}
                    </span>
                  )
                })}
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: '#888' }}>
                Red = moved to new server &nbsp;|&nbsp; Green = stayed
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
        {activeServers.map(s => (
          <span key={s} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
              background: SERVER_COLORS[s] || '#888'
            }} />
            {s} @ {hashStr(s + '#0')}°
          </span>
        ))}
        <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
            background: '#D9534F'
          }} />
          Key position
        </span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Demo 2 — Virtual Nodes Distribution
───────────────────────────────────────────────────────────────*/
function VirtualNodesDemo() {
  const [vNodes, setVNodes] = useState(1)
  const BASE_SERVERS = ['Server A', 'Server B', 'Server C']

  const distribution = useMemo(() => {
    const ring = buildRing(BASE_SERVERS, vNodes)
    const owned = { 'Server A': 0, 'Server B': 0, 'Server C': 0 }

    if (ring.length === 0) return owned

    for (let i = 0; i < ring.length; i++) {
      const cur = ring[i]
      const prev = ring[(i - 1 + ring.length) % ring.length]
      // arc from prev.pos+1 to cur.pos (clockwise)
      let arc = (cur.pos - prev.pos + 360) % 360
      if (arc === 0) arc = 1 // same position: count 1
      owned[cur.server] = (owned[cur.server] || 0) + arc
    }

    // Normalize to percentages
    const total = Object.values(owned).reduce((a, b) => a + b, 0)
    const pct = {}
    for (const [k, v] of Object.entries(owned)) {
      pct[k] = Math.round((v / total) * 100)
    }
    return pct
  }, [vNodes])

  const maxPct = Math.max(...Object.values(distribution))
  const minPct = Math.min(...Object.values(distribution))
  const spread = maxPct - minPct

  return (
    <div className="panel">
      <div className="ptitle">Demo 2 · Virtual nodes — ring ownership distribution</div>
      <p style={{ fontSize: 14, marginBottom: 12 }}>
        Drag the slider. With few virtual nodes, one server can dominate the ring.
        With many (≥100), each server owns roughly equal share.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Virtual nodes per server: <span style={{ color: 'var(--blue)' }}>{vNodes}</span>
        </label>
        <br />
        <input
          type="range" min={1} max={200} value={vNodes}
          onChange={e => setVNodes(Number(e.target.value))}
          style={{ width: '100%', maxWidth: 400, marginTop: 6 }}
        />
        <div style={{ fontSize: 11, color: '#888', display: 'flex', justifyContent: 'space-between', maxWidth: 400 }}>
          <span>1 (uneven)</span>
          <span>50</span>
          <span>100</span>
          <span>200 (balanced)</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
        {BASE_SERVERS.map(s => {
          const pct = distribution[s] || 0
          return (
            <div key={s}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                <span style={{ color: SERVER_COLORS[s], fontWeight: 600 }}>{s}</span>
                <span style={{ fontWeight: 600 }}>{pct}%</span>
              </div>
              <div style={{
                height: 22, background: '#eee', borderRadius: 4, overflow: 'hidden', position: 'relative'
              }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: SERVER_COLORS[s],
                  transition: 'width 0.3s ease',
                  borderRadius: 4,
                }} />
                <div style={{
                  position: 'absolute', right: pct < 95 ? `${100 - pct}%` : '4px',
                  top: 0, height: '100%', display: 'flex', alignItems: 'center',
                  paddingRight: 6, fontSize: 11, color: pct > 20 ? '#fff' : '#333',
                  pointerEvents: 'none'
                }}>
                  {pct}%
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: 13 }}>
        <span style={{
          padding: '4px 10px', borderRadius: 6,
          background: spread <= 5 ? '#e8f5e9' : spread <= 20 ? '#fff8e1' : '#fdecea',
          color: spread <= 5 ? '#2e7d32' : spread <= 20 ? '#f57c00' : '#c62828',
          border: `1px solid ${spread <= 5 ? '#a5d6a7' : spread <= 20 ? '#ffe082' : '#ef9a9a'}`,
        }}>
          Spread (max − min): {spread}%
          &nbsp;{spread <= 5 ? '✓ Balanced' : spread <= 20 ? '⚠ Somewhat uneven' : '✗ Uneven'}
        </span>
        <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
          Total ring points: {vNodes * 3} &nbsp;|&nbsp;
          {vNodes < 50 ? 'Try increasing virtual nodes above 100 for balance.' :
            'Good distribution — production systems use 100–200.'}
        </p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Demo 3 — Modulo vs Consistent Hashing Comparison
───────────────────────────────────────────────────────────────*/
const DEMO3_KEYS = [
  'user:1', 'user:2', 'user:3', 'user:4',
  'order:1', 'order:2', 'order:3', 'order:4',
  'item:1', 'item:2', 'item:3', 'item:9',
]

function ReshuffleDemo() {
  const [added, setAdded] = useState(false)

  const serversOld = ['Server A', 'Server B', 'Server C']
  const serversNew = ['Server A', 'Server B', 'Server C', 'Server D']

  // Modulo hashing
  function moduloServer(key, n) {
    return `Server ${String.fromCharCode(65 + (Math.abs(hashStr(key)) % n))}`
  }

  // Consistent hashing (1 real node per server for clarity)
  const ringOld = buildRing(serversOld, 50)
  const ringNew = buildRing(serversNew, 50)

  const moduloBefore = DEMO3_KEYS.map(k => moduloServer(k, 3))
  const moduloAfter = DEMO3_KEYS.map(k => moduloServer(k, 4))
  const consistentBefore = DEMO3_KEYS.map(k => getServer(ringOld, hashStr(k)))
  const consistentAfter = DEMO3_KEYS.map(k => getServer(ringNew, hashStr(k)))

  const moduloMoved = DEMO3_KEYS.filter((_, i) => moduloBefore[i] !== moduloAfter[i]).length
  const consistentMoved = DEMO3_KEYS.filter((_, i) => consistentBefore[i] !== consistentAfter[i]).length

  return (
    <div className="panel">
      <div className="ptitle">Demo 3 · Modulo vs Consistent hashing — adding a 4th server</div>
      <p style={{ fontSize: 14, marginBottom: 14 }}>
        Start with 3 servers, 12 keys. Click "Add Server D" and see how many keys get
        a cache miss in each approach.
      </p>

      {!added ? (
        <button className="act" onClick={() => setAdded(true)}>+ Add Server D</button>
      ) : (
        <button className="ghost act" onClick={() => setAdded(false)}>Reset (remove D)</button>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 16 }}>
        {/* Modulo panel */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{
            fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#c62828',
            borderBottom: '2px solid #ef9a9a', paddingBottom: 4
          }}>
            Modulo hashing (hash % N)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {DEMO3_KEYS.map((k, i) => {
              const before = moduloBefore[i]
              const after = moduloAfter[i]
              const moved = added && before !== after
              return (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 12, padding: '3px 8px', borderRadius: 5,
                  background: moved ? '#fde' : '#f8f8f5',
                  border: `1px solid ${moved ? '#f5b7b1' : '#eee'}`,
                  transition: 'background 0.3s',
                }}>
                  <span style={{ fontFamily: 'IBM Plex Mono' }}>{k}</span>
                  <span>
                    {added && moved ? (
                      <span>
                        <span style={{ color: '#999', textDecoration: 'line-through' }}>{before}</span>
                        {' → '}
                        <span style={{ color: SERVER_COLORS[after] || '#222', fontWeight: 600 }}>{after}</span>
                        <span style={{ color: '#c62828' }}> ✗</span>
                      </span>
                    ) : (
                      <span style={{ color: SERVER_COLORS[added ? after : before] || '#222', fontWeight: 600 }}>
                        {added ? after : before}
                        {added && ' ✓'}
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
          {added && (
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 6,
              background: '#fdecea', border: '1px solid #ef9a9a', fontSize: 13
            }}>
              <b>Cache misses: {moduloMoved} / {DEMO3_KEYS.length}</b>
              &nbsp;({Math.round(moduloMoved / DEMO3_KEYS.length * 100)}%)
            </div>
          )}
        </div>

        {/* Consistent panel */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{
            fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#2e7d32',
            borderBottom: '2px solid #a5d6a7', paddingBottom: 4
          }}>
            Consistent hashing (ring)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {DEMO3_KEYS.map((k, i) => {
              const before = consistentBefore[i]
              const after = consistentAfter[i]
              const moved = added && before !== after
              return (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 12, padding: '3px 8px', borderRadius: 5,
                  background: moved ? '#fde' : '#f8f8f5',
                  border: `1px solid ${moved ? '#f5b7b1' : '#eee'}`,
                  transition: 'background 0.3s',
                }}>
                  <span style={{ fontFamily: 'IBM Plex Mono' }}>{k}</span>
                  <span>
                    {added && moved ? (
                      <span>
                        <span style={{ color: '#999', textDecoration: 'line-through' }}>{before}</span>
                        {' → '}
                        <span style={{ color: SERVER_COLORS[after] || '#222', fontWeight: 600 }}>{after}</span>
                        <span style={{ color: '#c62828' }}> ✗</span>
                      </span>
                    ) : (
                      <span style={{ color: SERVER_COLORS[added ? after : before] || '#222', fontWeight: 600 }}>
                        {added ? after : before}
                        {added && ' ✓'}
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
          {added && (
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 6,
              background: '#e8f5e9', border: '1px solid #a5d6a7', fontSize: 13
            }}>
              <b>Cache misses: {consistentMoved} / {DEMO3_KEYS.length}</b>
              &nbsp;({Math.round(consistentMoved / DEMO3_KEYS.length * 100)}%)
            </div>
          )}
        </div>
      </div>

      {added && (
        <Good>
          Consistent hashing needed only ~1/N of keys to move. Modulo hashing reshuffled nearly every key.
          That &apos;s the difference between "a quiet scale-out" and "the database gets slammed."
        </Good>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Quiz
───────────────────────────────────────────────────────────────*/
const QUESTIONS = [
  {
    q: 'What is the main problem with using `hash(key) % N` when N changes?',
    o: [
      'The hash collisions increase dramatically',
      'Almost every key maps to a different server, causing mass cache misses',
      'It cannot handle string keys',
      'The hash function becomes slower',
    ],
    a: 1,
    e: 'When N changes (e.g., 3 → 4), the modulo result changes for most keys, sending them to different servers. All those keys are now cache misses — your database gets hammered.',
    w: {
      0: 'Collision rate depends on the hash function, not the number of servers.',
      2: 'Modulo hashing works fine with string keys; the issue is only when N changes.',
      3: 'Hash speed is unrelated to the number of servers. The problem is correctness of mapping, not performance of hashing.',
    },
    r: { id: 's1', label: 'Section 1 — The rehashing problem' },
  },
  {
    q: 'In a consistent hash ring, how do you find which server owns a key?',
    o: [
      'Pick the server whose position is closest (nearest distance on the ring)',
      'Pick the server at position hash(key) % numberOfServers',
      'Pick a random server that has spare capacity',
      'Pick the first server clockwise from the key\'s hash position',
    ],
    a: 3,
    e: 'The rule is: find the first server clockwise from where the key lands on the ring. In Java this is TreeMap.ceilingEntry(). If the key is past all servers, wrap to the first server (firstEntry).',
    w: {
      0: 'Nearest distance would be either the clockwise or counter-clockwise neighbor — consistent hashing specifically uses clockwise-only for a deterministic, consistent rule.',
      1: 'That is modulo hashing, not consistent hashing. Modulo breaks on N change.',
      2: 'Consistent hashing is deterministic — the same key always goes to the same server. Random would defeat the whole point.',
    },
    r: { id: 's2', label: 'Section 2 — The clock face analogy' },
  },
  {
    q: 'What Java data structure is used to implement the consistent hash ring lookup, and what is its time complexity?',
    o: [
      'TreeMap with ceilingKey/ceilingEntry — O(log N)',
      'LinkedList with linear scan — O(N)',
      'HashMap — O(1)',
      'PriorityQueue with poll — O(log N)',
    ],
    a: 0,
    e: 'TreeMap keeps keys in sorted order. ceilingKey(pos) returns the smallest key ≥ pos in O(log N) time — exactly the "next clockwise" operation we need.',
    w: {
      1: 'Linear scan works but is O(N) per lookup. TreeMap gives O(log N), which is much better for large rings.',
      2: 'HashMap is unordered — you cannot ask "what is the next key ≥ X?" without scanning everything.',
      3: 'PriorityQueue does not support "find ceiling key" queries efficiently and is destructive (poll removes the element).',
    },
    r: { id: 's3', label: 'Section 3 — Hash ring implementation' },
  },
  {
    q: 'Why are virtual nodes used in consistent hashing?',
    o: [
      'To allow different keys to use different hash functions',
      'To reduce the memory used by the TreeMap',
      'To speed up the ceilingKey lookup operation',
      'To spread each server across many ring positions for even load distribution',
    ],
    a: 3,
    e: 'With only one position per server, unlucky hash positions mean one server can own 60% of the ring. Virtual nodes (V positions per server) spread the ownership evenly — each server owns roughly 1/N of the ring when V is large enough (≥100).',
    w: {
      0: 'All keys use the same hash function. Virtual nodes are just multiple entries per server, not separate hash functions.',
      1: 'Virtual nodes actually increase TreeMap size (V × N entries). They cost memory; the benefit is even distribution.',
      2: 'ceilingKey is O(log(total ring size)). More virtual nodes make it slightly slower, not faster.',
    },
    r: { id: 's5', label: 'Section 5 — Virtual nodes' },
  },
  {
    q: 'If you have N servers and add one more, approximately what fraction of keys need to move?',
    o: [
      'All keys (100%)',
      '1/N of the keys',
      'No keys (0%)',
      'Half the keys (50%)',
    ],
    a: 1,
    e: 'The new server takes over a portion of the ring from its predecessor. On average it claims 1/(N+1) of the ring, so roughly 1/(N+1) ≈ 1/N of keys move. For N=3 adding a 4th server: ~25% of keys move instead of ~75% with modulo.',
    w: {
      0: 'That is what modulo hashing does. Consistent hashing exists precisely to avoid this.',
      2: 'Some keys must move — the new server needs to serve something. Zero movement is only possible if the server is added but never used.',
      3: 'Half would only happen if the new server lands exactly at the midpoint of the largest arc. On average it is 1/N.',
    },
    r: { id: 's8', label: 'Section 8 — What moves on add/remove' },
  },
  {
    q: 'Which real-world system uses consistent hashing for distributing data across nodes?',
    o: [
      'Cassandra and DynamoDB',
      'Git branching',
      'MySQL replication',
      'Apache Kafka partitioning',
    ],
    a: 0,
    e: 'Cassandra and DynamoDB both use consistent hashing to map partition keys to nodes. Redis Cluster uses a variant (16,384 hash slots). Kafka uses a different strategy (hash % partition count).',
    w: {
      1: 'Git has nothing to do with consistent hashing. Branches are version pointers, not distributed key-value mappings.',
      2: 'MySQL replication copies data to a standby — it is about durability, not distributing keys across nodes.',
      3: 'Kafka partitioning uses hash(key) % numPartitions — classic modulo hashing, not consistent hashing.',
    },
    r: { id: 's9', label: 'Section 9 — Real-world use cases' },
  },
  {
    q: 'What virtual node key format is used to generate multiple ring positions per server?',
    o: [
      'hash(serverName) repeated V times with a counter added to the result',
      'hash(serverName) * i for i in 1..V',
      'hash(serverName + "#" + i) for i in 0..V-1',
      'V random positions generated at startup and stored in a config file',
    ],
    a: 2,
    e: 'We hash the string "ServerA#0", "ServerA#1", ..., "ServerA#149" to get 150 deterministic, spread-out positions. The "#i" suffix makes each input string unique, so each hash is different.',
    w: {
      0: 'Adding a counter to the hash result (not the input) would create sequential integers, which would cluster rather than spread positions.',
      1: 'Multiplying the hash by i could overflow or produce poorly distributed results. The canonical approach hashes a unique string per virtual node.',
      3: 'Random positions at startup would give different distributions every time the server restarts, breaking consistent routing.',
    },
    r: { id: 's5', label: 'Section 5 — Virtual nodes' },
  },
  {
    q: 'What is "bounded load" consistent hashing?',
    o: [
      'A technique that bounds the number of virtual nodes per server',
      'A version of consistent hashing that limits ring size to avoid memory issues',
      'An extension that redirects requests to the next server if a node is overloaded',
      'A load balancer that caps total request throughput',
    ],
    a: 2,
    e: 'Bounded load (used by Google) adds a cap: if the target server\'s current load exceeds average × some factor (e.g., 1.25), the request falls to the next clockwise server. It fixes the "celebrity key" hotspot problem on top of consistent hashing.',
    w: {
      0: 'The number of virtual nodes is a separate configuration choice. Bounded load operates at request-routing time, not ring-construction time.',
      1: 'There is no ring size limit in bounded load. It is about per-server load caps at request time.',
      3: 'Total throughput limiting is rate limiting (Day 65). Bounded load is specifically about redirecting from overloaded individual servers.',
    },
    r: { id: 's10', label: 'Section 10 — Bounded loads + cheat sheet' },
  },
]

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────*/
export default function Day85() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 85</div>
        <h1>Consistent Hashing:<br />Scale-Out Without Cache Storms</h1>
        <p>
          Adding a server to a naive cache system invalidates nearly every key.
          Consistent hashing limits the damage to just 1/N of keys.
          One data structure — a sorted ring — is the engine behind Cassandra,
          Redis Cluster, and every serious distributed cache.
        </p>
        <div className="chips">
          {['Hash Ring', 'Virtual Nodes', 'TreeMap', '1/N Reshuffling', 'Cassandra', 'Redis Cluster'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* ── S1: The Rehashing Problem ── */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The Rehashing Problem — Modulo Hashing&apos;s Fatal Flaw</h2>

        <p>
          Suppose you have 3 cache servers. You distribute keys like this:
        </p>
        <Code html={`<span class="cm">// Simple approach: pick server by hash(key) % N</span>
<span class="kw">int</span> serverIndex = Math.abs(key.hashCode()) % <span class="num">3</span>;   <span class="cm">// 0, 1, or 2</span>

<span class="cm">// Works great with N=3:</span>
<span class="cm">// "user:1" → hash = 42 → 42 % 3 = 0 → Server A</span>
<span class="cm">// "user:2" → hash = 73 → 73 % 3 = 1 → Server B</span>
<span class="cm">// "user:3" → hash = 55 → 55 % 3 = 1 → Server B</span>`} />

        <p>
          Now you add a 4th server. Every client now computes <C>hash(key) % 4</C>.
          The results are completely different.
        </p>

        <Code html={`<span class="cm">// After adding server D: same keys, different servers!</span>
<span class="cm">// "user:1" → 42 % 4 = 2 → Server C  ← MISS (was Server A)</span>
<span class="cm">// "user:2" → 73 % 4 = 1 → Server B  ← hit (lucky)</span>
<span class="cm">// "user:3" → 55 % 4 = 3 → Server D  ← MISS (was Server B)</span>

<span class="cm">// Roughly (N-1)/N of all keys move to a different server.</span>
<span class="cm">// With N=4: about 75% of keys are now cache misses.</span>
<span class="cm">// Every miss goes to the database. The database gets hammered.</span>`} />

        <Code html={`<span class="cm">┌─────────────────────────────────────────────────────────────────┐</span>
<span class="cm">│  THE MODULO REHASH DISASTER                                      │</span>
<span class="cm">│                                                                  │</span>
<span class="cm">│  Before (N=3):                After (N=4):                       │</span>
<span class="cm">│  key → hash → % 3            key → hash → % 4                   │</span>
<span class="cm">│                                                                  │</span>
<span class="cm">│  "a" → 10 → Server A   VS    "a" → 10 → Server C  ← MISS!      │</span>
<span class="cm">│  "b" → 21 → Server C   VS    "b" → 21 → Server B  ← MISS!      │</span>
<span class="cm">│  "c" → 33 → Server A   VS    "c" → 33 → Server B  ← MISS!      │</span>
<span class="cm">│  "d" → 42 → Server C   VS    "d" → 42 → Server C  ← hit        │</span>
<span class="cm">│                                                                  │</span>
<span class="cm">│  ~75% of keys move. All those keys = database queries. 💀        │</span>
<span class="cm">└─────────────────────────────────────────────────────────────────┘</span>`} />

        <Warn>
          With modulo hashing, adding or removing even one server invalidates roughly
          (N-1)/N of your cache — often 70–90% of all cached data. For a large system
          this can cause a database meltdown.
        </Warn>

        <p>
          Consistent hashing fixes this. When you add one server to N existing servers,
          only about <strong>1/N of keys</strong> need to move. The rest stay put.
        </p>
      </section>

      {/* ── S2: The Clock Face Analogy ── */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The Clock Face Analogy — Ring, Positions, Clockwise Lookup</h2>

        <p>
          Imagine a circular clock face with positions 0 to 359. Each cache server
          sits at a specific position on this clock. When you want to store or fetch
          a key, you find its position on the clock. Then you walk clockwise until
          you hit a server. That server owns this key.
        </p>

        <Code html={`<span class="cm">                  0° / 360° (12 o'clock)</span>
<span class="cm">                      │</span>
<span class="cm">          Server C    │    Server A</span>
<span class="cm">         (270°) ──────┼────── (90°)</span>
<span class="cm">                      │</span>
<span class="cm">                 Server B</span>
<span class="cm">                   (180°)</span>
<span class="cm"></span>
<span class="cm">  Key lookup rules:</span>
<span class="cm">  key "user:42" → hash → 120° → walk clockwise → hit Server B at 180° ✓</span>
<span class="cm">  key "order:7" → hash → 300° → walk clockwise → hit Server C at 270°? No!</span>
<span class="cm">                               → 300° > 270°, keep going → hit Server A at 360°/0°... </span>
<span class="cm">                               → wrap around → Server A at 90°? No...</span>
<span class="cm">                               Actually: next clockwise from 300° = Server A at 360°/0°</span>
<span class="cm">                               (We wrap: 300° has no server after it before 360°,</span>
<span class="cm">                                so we wrap to 0°, then the first server = Server A at 90°)</span>
<span class="cm">  key "item:99"  → hash → 50° → walk clockwise → hit Server A at 90° ✓</span>`} />

        <Note>
          The "walk clockwise" rule is the key insight. It means each server owns the arc
          from the previous server (exclusive) to itself (inclusive). Removing a server
          just extends its predecessor&apos;s arc. Adding a server splits one arc into two.
          No other arcs are affected.
        </Note>

        <p>
          This is why it is called <strong>consistent</strong> hashing: the mapping of most
          keys stays consistent even as servers join or leave.
        </p>
      </section>

      {/* ── S3: Java Implementation ── */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Hash Ring in Java — TreeMap Is the Sorted Ring</h2>

        <p>
          We need a sorted data structure where we can say "give me the first position
          that is &gt;= this value". In Java, that is <C>TreeMap</C> with <C>ceilingKey()</C>
          or <C>ceilingEntry()</C>.
        </p>

        <Code html={`<span class="kw">import</span> java.util.TreeMap;
<span class="kw">import</span> java.util.Map;

<span class="kw">class</span> ConsistentHashRing {

    <span class="cm">// Sorted map: ring position (0–359) → server name</span>
    <span class="kw">private final</span> TreeMap&lt;Integer, String&gt; ring = <span class="kw">new</span> TreeMap&lt;&gt;();

    <span class="cm">// How many positions each server gets on the ring</span>
    <span class="kw">private final int</span> virtualNodes;

    ConsistentHashRing(<span class="kw">int</span> virtualNodes) {
        <span class="kw">this</span>.virtualNodes = virtualNodes;  <span class="cm">// e.g. 150</span>
    }

    <span class="cm">// Add a server: place its virtual nodes on the ring</span>
    <span class="kw">void</span> addServer(String server) {
        <span class="kw">for</span> (<span class="kw">int</span> i = <span class="num">0</span>; i &lt; virtualNodes; i++) {
            <span class="kw">int</span> pos = hash(server + <span class="str">"#"</span> + i);  <span class="cm">// unique string per virtual node</span>
            ring.put(pos, server);              <span class="cm">// place on ring</span>
        }
    }

    <span class="cm">// Remove a server: delete all its virtual nodes from the ring</span>
    <span class="kw">void</span> removeServer(String server) {
        <span class="kw">for</span> (<span class="kw">int</span> i = <span class="num">0</span>; i &lt; virtualNodes; i++) {
            <span class="kw">int</span> pos = hash(server + <span class="str">"#"</span> + i);  <span class="cm">// same formula = same positions</span>
            ring.remove(pos);                   <span class="cm">// remove from ring</span>
        }
    }

    <span class="cm">// Look up which server owns a key</span>
    String getServer(String key) {
        <span class="kw">if</span> (ring.isEmpty()) <span class="kw">throw new</span> IllegalStateException(<span class="str">"No servers"</span>);

        <span class="kw">int</span> pos = hash(key);  <span class="cm">// find key's position on ring</span>

        <span class="cm">// ceilingEntry: smallest key >= pos. That is "next clockwise server."</span>
        Map.Entry&lt;Integer, String&gt; entry = ring.ceilingEntry(pos);

        <span class="cm">// If null, key is past the last server — wrap to the first server.</span>
        <span class="kw">if</span> (entry == <span class="kw">null</span>) entry = ring.firstEntry();

        <span class="kw">return</span> entry.getValue();  <span class="cm">// server name</span>
    }

    <span class="cm">// Simple hash: produces an int 0–359 (ring position)</span>
    <span class="cm">// In production: use MurmurHash or MD5 for better distribution</span>
    <span class="kw">private int</span> hash(String key) {
        <span class="kw">return</span> Math.abs(key.hashCode()) % <span class="num">360</span>;
    }
}`} />

        <Good>
          The ring is just a <C>TreeMap&lt;Integer, String&gt;</C> — sorted integers (positions)
          mapped to server names. <C>ceilingEntry(pos)</C> is the entire lookup algorithm.
          Time complexity: O(log N) per lookup where N = total virtual nodes on the ring.
        </Good>

        <Reveal summary="What about hash collisions? Two virtual nodes at the same position?">
          <p>
            If two virtual nodes hash to the same position, <C>TreeMap.put()</C> will overwrite
            the first with the second. In practice, with a good hash function and positions
            in the range 0–2<sup>32</sup> (not just 0–359), collisions are extremely rare.
            Using a wider range like <C>Math.abs(key.hashCode()) % Integer.MAX_VALUE</C>
            reduces this further. For production, use MurmurHash3 which has excellent distribution.
          </p>
        </Reveal>

        <Reveal summary="Why TreeMap and not a sorted array with binary search?">
          <p>
            You could use a sorted <C>int[]</C> and <C>Arrays.binarySearch()</C> for O(log N)
            lookups. But adding/removing a server would require rebuilding or splicing the array
            — O(V) copy. TreeMap gives O(log N) for both lookup AND insert/delete, making
            server adds and removes cheap. This matters because production servers join/leave
            frequently.
          </p>
        </Reveal>
      </section>

      {/* ── S4: Demo 1 ── */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: Hash Ring Visualizer</h2>
        <p>
          Type any key. Watch it land on the ring as a red dot. The dashed line points
          to the next clockwise server. Then click "Add Server D" and see which of the
          10 sample keys moved servers (red) and which stayed (green). Count the moves
          — it is much less than modulo hashing would require.
        </p>
        <RingVisualizer />
        <Good>
          Notice: adding Server D only affects keys that were between Server D&apos;s position
          and its predecessor on the ring. All other keys are untouched.
        </Good>
      </section>

      {/* ── S5: Virtual Nodes ── */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Virtual Nodes — Why Real Servers Distribute Unevenly</h2>

        <p>
          With just one position per server, the ring position depends entirely on the
          hash of the server name. By luck, one server might land on a position that
          gives it a large arc, another a tiny arc.
        </p>

        <Code html={`<span class="cm">With 3 real servers, 1 position each — possible outcome:</span>
<span class="cm">  Ring: ──── Server A (90°) ─────────────────── Server B (250°) ─── Server C (310°)</span>
<span class="cm">             │←────── Arc A = 160° ──────────────→│← Arc B = 60° →│← Arc C = 140° →│</span>
<span class="cm"></span>
<span class="cm">  Server A owns 160/360 = 44% of keys</span>
<span class="cm">  Server B owns  60/360 = 17% of keys</span>
<span class="cm">  Server C owns 140/360 = 39% of keys</span>
<span class="cm"></span>
<span class="cm">  Server A is overloaded. Server B is underused. This is unfair.</span>`} />

        <p>
          <strong>Virtual nodes</strong> fix this. Instead of one position per server,
          we give each server V positions (V = 100–200 in production). Each server&apos;s
          V positions scatter around the ring, so each server owns many small arcs
          that add up to roughly 1/N of the total ring.
        </p>

        <Code html={`<span class="cm">// Each server gets V positions on the ring</span>
<span class="cm">// Format: "ServerName#virtualNodeIndex"</span>

addServer(<span class="str">"Server A"</span>):
    hash(<span class="str">"Server A#0"</span>)   → <span class="num">42</span>   → ring.put(<span class="num">42</span>,   <span class="str">"Server A"</span>)
    hash(<span class="str">"Server A#1"</span>)   → <span class="num">187</span>  → ring.put(<span class="num">187</span>,  <span class="str">"Server A"</span>)
    hash(<span class="str">"Server A#2"</span>)   → <span class="num">315</span>  → ring.put(<span class="num">315</span>,  <span class="str">"Server A"</span>)
    <span class="cm">... 150 positions total</span>

<span class="cm">// With 3 servers × 150 virtual nodes = 450 ring points</span>
<span class="cm">// Each server owns ~150 small arcs ≈ 33% of the ring in aggregate</span>

<span class="cm">// getServer() still works unchanged — the TreeMap just has more entries</span>`} />

        <Note>
          Virtual nodes also make heterogeneous clusters easy: give a more powerful server
          more virtual nodes (e.g., 300 instead of 150) and it naturally owns a larger share
          of the ring without any special-casing in the routing logic.
        </Note>

        <Reveal summary="How many virtual nodes should you use in production?">
          <p>
            Cassandra historically used 256 virtual nodes per server. A common rule of thumb
            is 100–200. Below 50, the distribution can still be noticeably uneven. Above 500,
            you are adding memory cost (each virtual node is an entry in the TreeMap) with
            diminishing returns on evenness. For a cluster of N servers, a practical formula
            is V = 100 × log2(N) — scales V with cluster size.
          </p>
        </Reveal>
      </section>

      {/* ── S6: Demo 2 ── */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>Play: Virtual Nodes Distribution</h2>
        <p>
          Drag the slider from 1 to 200 virtual nodes per server. Watch the bar chart
          update. Notice how at low V the distribution is wildly uneven, and at V ≥ 100
          all three servers own roughly equal portions.
        </p>
        <VirtualNodesDemo />
        <Good>
          At V=1, one server may own more than half the ring by pure chance of hash positions.
          At V=150+, the spread drops to single digits — statistically even. This is why
          production consistent hashing always uses virtual nodes.
        </Good>
      </section>

      {/* ── S7: Demo 3 ── */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>Play: Modulo vs Consistent — Adding a Server</h2>
        <p>
          Both panels start with 3 servers and 12 keys assigned. Click "Add Server D"
          and count the red (moved) keys in each panel. Modulo hashing moves most keys.
          Consistent hashing moves only the keys that were in the new server&apos;s arc.
        </p>
        <ReshuffleDemo />
      </section>

      {/* ── S8: What Moves on Add/Remove ── */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>What Moves When You Add or Remove a Server — The 1/N Guarantee</h2>

        <p>
          The math is simple. When you add one server to a ring with N servers,
          the new server takes over roughly 1/(N+1) ≈ 1/N of the ring from its
          clockwise neighbor. Only the keys in that stolen arc need to move.
        </p>

        <Code html={`<span class="cm">BEFORE — 3 servers:</span>
<span class="cm">Ring:  ───[A: 90°]──────────[B: 200°]────────[C: 310°]──────── (wraps)</span>
<span class="cm">Arcs:  A owns 0°–90°, B owns 91°–200°, C owns 201°–359°+wrap to 90°</span>
<span class="cm"></span>
<span class="cm">  "user:1"  → 45°  → Server A</span>
<span class="cm">  "user:2"  → 150° → Server B</span>
<span class="cm">  "user:3"  → 250° → Server C</span>
<span class="cm">  "user:4"  → 80°  → Server A</span>
<span class="cm"></span>
<span class="cm">ADD Server D at 145°:</span>
<span class="cm">Ring:  ───[A: 90°]─[D: 145°]──[B: 200°]────────[C: 310°]────── (wraps)</span>
<span class="cm"></span>
<span class="cm">  "user:1"  → 45°  → Server A  (unchanged: still before D)</span>
<span class="cm">  "user:2"  → 150° → Server B  (unchanged: past D, still reaches B first)</span>
<span class="cm">  "user:3"  → 250° → Server C  (unchanged)</span>
<span class="cm">  "user:4"  → 80°  → Server A  (unchanged)</span>
<span class="cm"></span>
<span class="cm">  Keys in the 91°–145° arc (previously owned by B) now go to D.</span>
<span class="cm">  ONLY THOSE KEYS MOVE. Everything else is unaffected.</span>
<span class="cm"></span>
<span class="cm">REMOVE a server (Server B at 200°):</span>
<span class="cm">  All of B's keys now go to the next clockwise server = Server C.</span>
<span class="cm">  Only B's keys move. A and C's other keys are unaffected.</span>`} />

        <Good>
          Add a server: ~1/N keys move FROM the clockwise neighbor TO the new server.
          Remove a server: ~1/N keys move FROM the removed server TO its clockwise neighbor.
          All other keys are untouched in both cases.
        </Good>

        <Reveal summary="Does this hold exactly or approximately?">
          <p>
            With virtual nodes, it holds approximately. Each virtual node of the removed server
            has a clockwise neighbor, which may belong to any of the other servers. The keys
            of each virtual node scatter to multiple different successors. The total fraction
            that moves averages to 1/N, but with variance that shrinks as V increases.
            With V=150, the actual fraction moved is very close to the 1/N theoretical value.
          </p>
        </Reveal>
      </section>

      {/* ── S9: Real-World Use Cases ── */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Real-World Use Cases — Where Consistent Hashing Lives</h2>

        <Code html={`<span class="cm">┌──────────────────────────┬──────────────────────────────────────────────────┐</span>
<span class="cm">│ System                   │ How consistent hashing is used                   │</span>
<span class="cm">├──────────────────────────┼──────────────────────────────────────────────────┤</span>
<span class="cm">│ Apache Cassandra         │ Partition key → ring position → replica nodes    │</span>
<span class="cm">│                          │ Default: 256 virtual nodes per server            │</span>
<span class="cm">├──────────────────────────┼──────────────────────────────────────────────────┤</span>
<span class="cm">│ Amazon DynamoDB          │ Same idea: consistent hashing across storage nodes│</span>
<span class="cm">│                          │ Inspired by Amazon's Dynamo paper (2007)         │</span>
<span class="cm">├──────────────────────────┼──────────────────────────────────────────────────┤</span>
<span class="cm">│ Redis Cluster            │ 16,384 hash slots distributed across nodes       │</span>
<span class="cm">│                          │ Variant: fixed slot ring instead of continuous   │</span>
<span class="cm">├──────────────────────────┼──────────────────────────────────────────────────┤</span>
<span class="cm">│ CDN (Akamai, Cloudflare) │ Route request to nearest/least-loaded edge node  │</span>
<span class="cm">│                          │ Adding a PoP only steals traffic from neighbors  │</span>
<span class="cm">├──────────────────────────┼──────────────────────────────────────────────────┤</span>
<span class="cm">│ Load balancer            │ Sticky sessions: same user → same backend        │</span>
<span class="cm">│                          │ No shared session store needed                   │</span>
<span class="cm">├──────────────────────────┼──────────────────────────────────────────────────┤</span>
<span class="cm">│ Memcached (client-side)  │ Clients agree on which node holds a key          │</span>
<span class="cm">│                          │ Each client independently computes the mapping   │</span>
<span class="cm">└──────────────────────────┴──────────────────────────────────────────────────┘</span>`} />

        <p>
          The Amazon Dynamo paper (2007) is the foundational reference. It describes
          consistent hashing with virtual nodes as the core technique for partitioning
          data across a cluster of commodity servers. Cassandra and DynamoDB both
          descend from this design.
        </p>

        <Reveal summary="How does Redis Cluster differ from pure consistent hashing?">
          <p>
            Redis Cluster uses 16,384 fixed "hash slots" (not a continuous ring).
            Each key is mapped to a slot by <C>CRC16(key) % 16384</C>. Slots are then
            assigned to nodes. When you add a node, you move some slots to it — the
            Redis operator controls exactly which slots move. This is easier to reason
            about than a continuous ring but the principle is the same: adding a node
            only touches a subset of slots, not all of them.
          </p>
        </Reveal>

        <Reveal summary="Client-side vs server-side consistent hashing?">
          <p>
            Memcached uses <strong>client-side</strong> consistent hashing: the client library
            (not any server) computes which cache server to talk to. There is no coordinator.
            All clients must use the same algorithm and the same server list to agree.
            This is simple but requires careful configuration management.
            Cassandra uses <strong>server-side</strong>: any node can receive a request and
            forward it to the correct owner using the shared ring map.
          </p>
        </Reveal>
      </section>

      {/* ── S10: Bounded Loads + Cheat Sheet ── */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Bounded Loads Extension + Cheat Sheet</h2>

        <h3 style={{ fontSize: 16, marginTop: 0 }}>Bounded Load Consistent Hashing</h3>

        <p>
          Standard consistent hashing still has a hotspot problem: if a single key is
          extremely popular (e.g., a celebrity&apos;s user ID on a social network), the server
          that owns that key&apos;s ring position gets hammered regardless of virtual nodes.
          Virtual nodes spread keys but cannot help if one key itself is hot.
        </p>

        <Code html={`<span class="cm">// Bounded load (Google, 2017): add a load cap</span>
String getServer(String key) {
    <span class="kw">int</span> pos = hash(key);
    Map.Entry&lt;Integer, String&gt; entry = ring.ceilingEntry(pos);
    <span class="kw">if</span> (entry == <span class="kw">null</span>) entry = ring.firstEntry();

    <span class="cm">// If target server is overloaded, try next clockwise server</span>
    <span class="kw">while</span> (isOverloaded(entry.getValue())) {   <span class="cm">// load > avg * 1.25</span>
        entry = ring.higherEntry(entry.getKey());
        <span class="kw">if</span> (entry == <span class="kw">null</span>) entry = ring.firstEntry(); <span class="cm">// wrap</span>
    }
    <span class="kw">return</span> entry.getValue();
}`} />

        <Warn>
          Bounded load changes consistency: the same key may go to different servers
          depending on current load. This is fine for load balancing but breaks
          cache locality (the key may not be in the server you route to). Use it
          for compute/request routing, not as a cache key assignment.
        </Warn>

        <h3 style={{ fontSize: 16, marginTop: 24 }}>Cheat Sheet</h3>

        <ul>
          <li><strong>Problem solved:</strong> Adding/removing servers without invalidating most cache keys.</li>
          <li><strong>Core idea:</strong> Put servers on a circular ring (0–360°). A key goes to the first server clockwise from its hash position.</li>
          <li><strong>Data structure:</strong> <C>TreeMap&lt;Integer, String&gt;</C>. Lookup = <C>ceilingEntry(pos)</C>, wrap to <C>firstEntry()</C>. Time: O(log N).</li>
          <li><strong>Keys moved on add/remove:</strong> ~1/N (not all).</li>
          <li><strong>Virtual nodes:</strong> Each server gets V positions (hash("Server#0"), ..., hash("Server#V-1")). V = 100–200 for even distribution.</li>
          <li><strong>Used by:</strong> Cassandra (256 vnodes), DynamoDB, Redis Cluster (16,384 slots), CDNs, load balancers, Memcached.</li>
          <li><strong>Bounded load:</strong> Skip to next clockwise server if target is overloaded. Google&apos;s extension for hot-key protection.</li>
          <li><strong>modulo hashing moves:</strong> ~(N-1)/N keys on resize. Consistent hashing moves: ~1/N keys on resize.</li>
        </ul>
      </section>

      {/* ── Interview Corner ── */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Interview Corner</h2>
        <p>Five minutes before the interview. Run through these.</p>

        <Reveal summary="Q1: What problem does consistent hashing solve that modulo hashing cannot?">
          <p>
            Modulo hashing (<C>hash(key) % N</C>) changes the mapping of almost every key
            when N changes. Adding or removing one server causes ~(N-1)/N cache misses —
            often 70%+ of all keys. Consistent hashing limits the disruption to ~1/N of
            keys by using a ring where only the new server&apos;s neighboring arc is affected.
          </p>
        </Reveal>

        <Reveal summary="Q2: Why do we need virtual nodes? What goes wrong without them?">
          <p>
            With one position per server, the arc sizes depend entirely on where the hash
            function places each server. By bad luck one server can own 60% of the ring
            and another only 10%. Virtual nodes (V positions per server) scatter each
            server across the ring, so each owns many small arcs averaging to ~1/N of the
            total. V = 100–200 gives near-uniform distribution. Without them, load is
            unevenly distributed even though the hashing is consistent.
          </p>
        </Reveal>

        <Reveal summary="Q3: If you have N servers and add one more, exactly what fraction of keys must move?">
          <p>
            Approximately <strong>1/(N+1) ≈ 1/N</strong> of keys. The new server takes over
            the arc from its counter-clockwise predecessor. Only keys in that arc move.
            Example: 3 servers → 4 servers, ~25% of keys move (versus ~75% with modulo hashing).
            With virtual nodes the actual fraction averages to 1/N with low variance.
          </p>
        </Reveal>

        <Reveal summary="Q4: What data structure implements the ring, and what is the lookup complexity?">
          <p>
            A <C>TreeMap&lt;Integer, String&gt;</C> (sorted map of ring position to server name).
            Lookup = <C>ceilingEntry(hash(key))</C> — find the smallest key in the map that
            is &gt;= the hash position. If null (past the last server), wrap to <C>firstEntry()</C>.
            Time complexity: O(log M) where M = total virtual nodes = V × N.
            Add/remove server: O(V log M) — V TreeMap inserts or removes.
          </p>
        </Reveal>

        <Reveal summary="Q5: What is bounded load consistent hashing and when would you use it?">
          <p>
            An extension by Google (2017) that adds a per-server load cap. When routing a
            request, if the target server&apos;s load exceeds average × 1.25, skip to the next
            clockwise server. This handles hotspot keys (e.g., a celebrity user ID that
            hashes to one node). Use it for request/compute routing. Avoid it for cache key
            assignment because the same key may route to different servers depending on load,
            defeating cache locality.
          </p>
        </Reveal>

        <Reveal summary="Q6: Name two real systems that use consistent hashing and explain how each uses it.">
          <p>
            <strong>Apache Cassandra:</strong> Uses consistent hashing with 256 virtual nodes
            per server to partition rows across nodes. The partition key is hashed to a ring
            position. The owning node (and its replicas) are the first N nodes clockwise on
            the ring.
          </p>
          <p>
            <strong>Redis Cluster:</strong> Uses a variant — 16,384 fixed hash slots distributed
            across nodes. Each key maps to a slot by <C>CRC16(key) % 16384</C>. Adding a node
            means moving some slot assignments, touching only the keys in those slots. Same
            1/N principle, different implementation (discrete slots vs continuous ring).
          </p>
        </Reveal>
      </section>

      {/* ── Quiz ── */}
      <section id="squad">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* ── Footer ── */}
      <div className="footer">
        <strong>Day 85 complete?</strong> Homework: implement <C>ConsistentHashRing</C> in Java
        from scratch. Use a <C>TreeMap&lt;Integer, String&gt;</C> with 150 virtual nodes per server.
        Add servers A, B, C. Assign 20 sample keys and print each key → server mapping.
        Then add server D and print which keys moved (compare before/after). Your output should
        show roughly 5 keys (25%) moving, not 15 (75%).
        <br /><br />
        Next: <strong>Day 86 — URL Shortener</strong>: design a system like bit.ly — encode/decode
        long URLs to short 6-character codes, handle redirects, track click analytics, and ensure
        uniqueness at scale. Combines hashing, databases, and caching.
      </div>

    </div>
  )
}
