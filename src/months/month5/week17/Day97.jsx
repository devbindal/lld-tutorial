import { useState, useEffect, useRef } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ================================================================
   DEMO 1 — Algorithm comparison
   4 servers, 20 requests (some "heavy"), four algorithm tabs
   ================================================================ */
const SERVERS_INIT = [
  { id: 1, name: 'S1', weight: 3, capacity: 10, active: 0, total: 0, healthy: true },
  { id: 2, name: 'S2', weight: 1, capacity: 10, active: 0, total: 0, healthy: true },
  { id: 3, name: 'S3', weight: 2, capacity: 10, active: 0, total: 0, healthy: true },
  { id: 4, name: 'S4', weight: 1, capacity: 10, active: 0, total: 0, healthy: true },
]

// 20 requests: some are "heavy" (take 3× longer)
const REQUESTS = [
  { id: 1, heavy: false }, { id: 2, heavy: false }, { id: 3, heavy: true  },
  { id: 4, heavy: false }, { id: 5, heavy: false }, { id: 6, heavy: false },
  { id: 7, heavy: true  }, { id: 8, heavy: false }, { id: 9, heavy: false },
  { id: 10, heavy: false },{ id: 11, heavy: true  },{ id: 12, heavy: false },
  { id: 13, heavy: false },{ id: 14, heavy: false },{ id: 15, heavy: true  },
  { id: 16, heavy: false },{ id: 17, heavy: false },{ id: 18, heavy: false },
  { id: 19, heavy: false },{ id: 20, heavy: false },
]

function algorithmRoute(algo, servers, rrIndex, clientIps) {
  // Returns array of {reqId, serverId} assignments
  const healthy = servers.filter(s => s.healthy)
  if (healthy.length === 0) return []
  const result = []
  let rr = rrIndex

  // Weighted round-robin: expand weights
  const weighted = []
  for (const s of healthy) {
    for (let i = 0; i < s.weight; i++) weighted.push(s.id)
  }

  // Simulate active connections for least-connections
  const conns = {}
  healthy.forEach(s => { conns[s.id] = 0 })

  REQUESTS.forEach((req, idx) => {
    let chosen
    if (algo === 'round') {
      chosen = healthy[rr % healthy.length].id
      rr++
    } else if (algo === 'weighted') {
      chosen = weighted[idx % weighted.length]
    } else if (algo === 'least') {
      chosen = Object.entries(conns).sort((a, b) => a[1] - b[1])[0][0]
      // heavy requests hold the slot for 3 ticks
      conns[chosen] += req.heavy ? 3 : 1
    } else if (algo === 'iphash') {
      const ip = clientIps[idx]
      chosen = healthy[ip % healthy.length].id
    }
    result.push({ reqId: req.id, serverId: chosen, heavy: req.heavy })
  })
  return result
}

function AlgoDemo() {
  const [algo, setAlgo] = useState('round')
  const [ran, setRan] = useState(false)
  const [assignments, setAssignments] = useState([])
  const clientIps = useRef(REQUESTS.map(() => Math.floor(Math.random() * 4)))

  const ALGOS = [
    { key: 'round',    label: 'Round-Robin' },
    { key: 'weighted', label: 'Weighted RR' },
    { key: 'least',    label: 'Least Connections' },
    { key: 'iphash',   label: 'IP Hash' },
  ]

  function runSim() {
    const result = algorithmRoute(algo, SERVERS_INIT, 0, clientIps.current)
    setAssignments(result)
    setRan(true)
  }

  function reset() { setAssignments([]); setRan(false) }

  // Count per server
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 }
  assignments.forEach(a => { counts[a.serverId] = (counts[a.serverId] || 0) + 1 })
  const max = Math.max(...Object.values(counts), 1)
  const evenness = ran
    ? (100 - (Math.max(...Object.values(counts)) - Math.min(...Object.values(counts))) * 5).toFixed(0)
    : null

  const algoDescriptions = {
    round: 'Requests rotate: S1 → S2 → S3 → S4 → S1... Heavy requests pile up on whichever server gets them — no adaptation.',
    weighted: 'S1 has weight 3, so it gets 3× more requests than S2/S4. Good when servers have different capacities.',
    least: 'Each request goes to the server with the fewest active connections. Heavy requests reduce that server\'s attractiveness — traffic naturally shifts away.',
    iphash: 'hash(clientIP) % 4 → same client always goes to the same server. Distribution depends on how many unique IPs you have.',
  }

  return (
    <div className="panel">
      <div className="ptitle">Algorithm comparison · 20 requests (red = heavy, takes 3× longer)</div>

      <div className="modbtns" style={{ marginBottom: 12 }}>
        {ALGOS.map(a => (
          <button key={a.key} className={algo === a.key ? 'on' : ''}
            onClick={() => { setAlgo(a.key); reset() }}>{a.label}</button>
        ))}
      </div>

      <p style={{ fontSize: 13.5, color: '#555', marginBottom: 12 }}>{algoDescriptions[algo]}</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button className="act" onClick={runSim} disabled={ran}>Distribute 20 requests</button>
        <button className="act ghost" onClick={reset}>Reset</button>
      </div>

      {/* Server columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        {SERVERS_INIT.map(s => {
          const count = counts[s.id] || 0
          const pct = ran ? Math.round((count / max) * 100) : 0
          const myReqs = assignments.filter(a => a.serverId === s.id)
          return (
            <div key={s.id} style={{ border: '2px solid var(--line)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontWeight: 700, fontFamily: 'IBM Plex Mono', marginBottom: 4 }}>
                {s.name} {algo === 'weighted' ? <span style={{ fontSize: 11, color: '#888' }}>(w={s.weight})</span> : null}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Requests: <b>{count}</b></div>
              <div style={{ height: 8, background: '#eee', borderRadius: 4, marginBottom: 8 }}>
                <div style={{ height: 8, background: 'var(--blue)', borderRadius: 4, width: pct + '%', transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {myReqs.map(r => (
                  <span key={r.reqId} style={{
                    fontSize: 10, padding: '1px 5px', borderRadius: 3,
                    background: r.heavy ? '#fde8e8' : '#e8f0fe',
                    color: r.heavy ? '#c0392b' : '#2D5BFF',
                    border: `1px solid ${r.heavy ? '#f5c6c6' : '#bcd1fc'}`
                  }}>R{r.reqId}{r.heavy ? '★' : ''}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {ran && (
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <span>Distribution: <b>S1={counts[1]} S2={counts[2]} S3={counts[3]} S4={counts[4]}</b></span>
          <span>Balance score: <b style={{ color: Number(evenness) >= 80 ? '#2E9E6B' : '#c0392b' }}>{evenness}/100</b></span>
        </div>
      )}
      <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>★ = heavy request (3× slower)</div>
    </div>
  )
}

/* ================================================================
   DEMO 2 — Health check and failover
   3 servers, health ticker every 2s, kill/revive toggle
   ================================================================ */
function HealthCheckDemo() {
  const [servers, setServers] = useState([
    { id: 1, name: 'Server A', healthy: true, failCount: 0, inRotation: true },
    { id: 2, name: 'Server B', healthy: true, failCount: 0, inRotation: true },
    { id: 3, name: 'Server C', healthy: true, failCount: 0, inRotation: true },
  ])
  const [killed, setKilled] = useState(null) // which server is "killed"
  const [log, setLog] = useState([])
  const [reqCount, setReqCount] = useState(0)
  const [tick, setTick] = useState(0)
  const rrRef = useRef(0)
  const timerRef = useRef(null)
  const [running, setRunning] = useState(false)

  function addLog(msg, color) {
    setLog(l => [...l.slice(-14), { msg, color, id: Date.now() + Math.random() }])
  }

  function startStop() {
    if (running) {
      clearInterval(timerRef.current)
      setRunning(false)
    } else {
      setRunning(true)
    }
  }

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [running])

  // On each tick: send a request + do health check every 2 ticks
  useEffect(() => {
    if (!running || tick === 0) return

    setServers(prev => {
      const next = prev.map(s => {
        const isKilled = s.id === killed
        if (tick % 2 === 0) {
          // health check tick
          if (isKilled) {
            const newFail = s.failCount + 1
            const nowDown = newFail >= 2
            if (newFail === 1) addLog(`Health check: ${s.name} FAIL (1/2)`, '#c0392b')
            if (newFail === 2) addLog(`Health check: ${s.name} FAIL (2/2) → REMOVED from rotation`, '#c0392b')
            return { ...s, failCount: newFail, healthy: false, inRotation: nowDown ? false : s.inRotation }
          } else if (!s.healthy) {
            // recovering
            const newFail = Math.max(0, s.failCount - 1)
            if (newFail === 0) {
              addLog(`Health check: ${s.name} PASS → REJOINED rotation`, '#2E9E6B')
              return { ...s, failCount: 0, healthy: true, inRotation: true }
            }
            addLog(`Health check: ${s.name} PASS (${2 - newFail}/2 needed)`, '#2E9E6B')
            return { ...s, failCount: newFail }
          } else {
            addLog(`Health check: ${s.name} OK`, '#2E9E6B')
          }
        }
        return s
      })

      // Send a request on every tick
      const inRotation = next.filter(s => s.inRotation)
      if (inRotation.length > 0) {
        const chosen = inRotation[rrRef.current % inRotation.length]
        rrRef.current++
        setReqCount(c => c + 1)
        addLog(`Request → ${chosen.name}`, '#2D5BFF')
      } else {
        addLog('ERROR: No healthy servers!', '#c0392b')
      }

      return next
    })
  }, [tick, running, killed])

  function killServer(id) {
    setKilled(id)
    addLog(`Server ${['', 'A', 'B', 'C'][id]} going dark...`, '#c0392b')
  }

  function reviveServer(id) {
    setKilled(null)
    setServers(prev => prev.map(s => s.id === id ? { ...s, failCount: 0 } : s))
    addLog(`Server ${['', 'A', 'B', 'C'][id]} restarted, waiting for health checks...`, '#C9A227')
  }

  function reset() {
    clearInterval(timerRef.current)
    setRunning(false)
    setServers([
      { id: 1, name: 'Server A', healthy: true, failCount: 0, inRotation: true },
      { id: 2, name: 'Server B', healthy: true, failCount: 0, inRotation: true },
      { id: 3, name: 'Server C', healthy: true, failCount: 0, inRotation: true },
    ])
    setKilled(null)
    setLog([])
    setReqCount(0)
    setTick(0)
    rrRef.current = 0
  }

  return (
    <div className="panel">
      <div className="ptitle">Health check &amp; failover · health probe every 2 ticks, 2 failures = removed</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button className="act" onClick={startStop}>{running ? 'Pause' : 'Start simulation'}</button>
        <button className="act ghost" onClick={reset}>Reset</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
        {servers.map(s => {
          const isKilled = s.id === killed
          return (
            <div key={s.id} style={{
              border: `2px solid ${s.healthy ? '#2E9E6B' : '#c0392b'}`,
              borderRadius: 8, padding: 12,
              background: s.healthy ? '#f0faf5' : '#fef0f0',
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: s.healthy ? '#2E9E6B' : '#c0392b',
                  boxShadow: s.healthy ? '0 0 6px #2E9E6B' : '0 0 6px #c0392b'
                }} />
                <b style={{ fontFamily: 'IBM Plex Mono' }}>{s.name}</b>
              </div>
              <div style={{ fontSize: 12, marginBottom: 6 }}>
                Status: <b style={{ color: s.healthy ? '#2E9E6B' : '#c0392b' }}>
                  {s.healthy ? (s.inRotation ? 'HEALTHY ✓' : 'RECOVERING') : 'DOWN ✗'}
                </b>
              </div>
              <div style={{ fontSize: 12, marginBottom: 8 }}>
                In rotation: <b>{s.inRotation ? 'YES' : 'NO'}</b>
              </div>
              {s.healthy && !isKilled && (
                <button className="act ghost" style={{ fontSize: 11, padding: '4px 8px' }}
                  onClick={() => killServer(s.id)}>Kill this server</button>
              )}
              {isKilled && s.inRotation && (
                <button className="act" style={{ fontSize: 11, padding: '4px 8px', background: '#c0392b', border: 'none', color: '#fff' }}
                  onClick={() => reviveServer(s.id)}>Revive</button>
              )}
              {isKilled && !s.inRotation && (
                <button className="act" style={{ fontSize: 11, padding: '4px 8px', background: '#2E9E6B', border: 'none', color: '#fff' }}
                  onClick={() => reviveServer(s.id)}>Revive</button>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 12.5, marginBottom: 8, color: '#555' }}>
        Total requests dispatched: <b>{reqCount}</b>
      </div>

      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, background: '#1B2A4A', color: '#c9d6f0',
        borderRadius: 8, padding: 12, maxHeight: 200, overflowY: 'auto' }}>
        {log.length === 0 && <div style={{ color: '#7c8aa5' }}>Press "Start simulation" to begin...</div>}
        {log.map(entry => (
          <div key={entry.id} style={{ color: entry.color, marginBottom: 2 }}>{'> '}{entry.msg}</div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   DEMO 3 — Sticky sessions vs shared cache
   ================================================================ */
function StickyVsRedisDemo() {
  const [mode, setMode] = useState('sticky')
  const [requests, setRequests] = useState([])
  const [deployed, setDeployed] = useState(false)
  const [session, setSession] = useState(null) // which server holds session (sticky mode)

  function makeRequest() {
    if (requests.length >= 6) return
    const reqNum = requests.length + 1

    if (mode === 'sticky') {
      if (deployed) {
        // Server 1 is down; if user was stuck to it — session lost!
        setRequests(r => [...r, {
          id: reqNum,
          server: 'Server 2',
          status: session === 1 ? 'SESSION LOST ❌' : 'OK ✓',
          detail: session === 1 ? 'Server 1 is down. Session data was in Server 1 memory — gone!' : 'User happened to be on Server 2.'
        }])
      } else {
        // First request: pick server, pin user there
        const srv = session || 1
        if (!session) setSession(1)
        setRequests(r => [...r, {
          id: reqNum,
          server: `Server ${srv}`,
          status: 'OK ✓',
          detail: `SERVERID=s${srv} cookie set. All future requests go to Server ${srv}.`
        }])
      }
    } else {
      // Shared cache (Redis) mode
      const servers = deployed ? [2, 3] : [1, 2, 3]
      const srv = servers[(reqNum - 1) % servers.length]
      setRequests(r => [...r, {
        id: reqNum,
        server: `Server ${srv}`,
        status: 'OK ✓',
        detail: deployed && srv !== 1
          ? 'Server 1 is down, but session data is in Redis. Any server can serve this user.'
          : 'Session data stored in Redis, shared by all servers.'
      }])
    }
  }

  function deploy() {
    setDeployed(true)
  }

  function reset() {
    setRequests([])
    setDeployed(false)
    setSession(null)
  }

  return (
    <div className="panel">
      <div className="ptitle">Sticky sessions vs shared cache (Redis)</div>

      <div className="modbtns" style={{ marginBottom: 12 }}>
        <button className={mode === 'sticky' ? 'on' : ''} onClick={() => { setMode('sticky'); reset() }}>
          Sticky Sessions (cookie)
        </button>
        <button className={mode === 'redis' ? 'on' : ''} onClick={() => { setMode('redis'); reset() }}>
          Shared Cache (Redis)
        </button>
      </div>

      {mode === 'sticky' ? (
        <Note>Sticky mode: the first request sets a cookie <C>SERVERID=s1</C>. All future requests go to Server 1. If Server 1 dies, the session is lost.</Note>
      ) : (
        <Good>Redis mode: session data is in Redis, shared by all servers. Any server can handle any request. Server failures do not affect the session.</Good>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <button className="act" onClick={makeRequest} disabled={requests.length >= 6}>
          Send request {requests.length + 1}
        </button>
        {!deployed && (
          <button className="act" style={{ background: '#c0392b', border: 'none', color: '#fff' }} onClick={deploy}>
            Deploy (take Server 1 offline)
          </button>
        )}
        <button className="act ghost" onClick={reset}>Reset</button>
      </div>

      {deployed && (
        <Warn>Server 1 is OFFLINE (deployment in progress). {mode === 'sticky' ? 'Users pinned to Server 1 will lose their session!' : 'Redis still has all session data — no impact.'}</Warn>
      )}

      {/* Server status */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{
            padding: '6px 14px', borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: 12,
            background: (deployed && n === 1) ? '#fef0f0' : '#f0faf5',
            border: `1px solid ${(deployed && n === 1) ? '#c0392b' : '#2E9E6B'}`,
            color: (deployed && n === 1) ? '#c0392b' : '#2E9E6B'
          }}>
            Server {n} {(deployed && n === 1) ? '✗ DOWN' : '✓ UP'}
          </div>
        ))}
        {mode === 'redis' && (
          <div style={{ padding: '6px 14px', borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: 12,
            background: '#fff8e1', border: '1px solid #C9A227', color: '#8B6914' }}>
            Redis ✓ UP (session store)
          </div>
        )}
      </div>

      {/* Request log */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {requests.map(req => (
          <div key={req.id} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '8px 12px', borderRadius: 6,
            background: req.status.includes('LOST') ? '#fef0f0' : '#f4f7ff',
            border: `1px solid ${req.status.includes('LOST') ? '#f5c6c6' : '#c5d5fa'}`
          }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, minWidth: 55 }}>Req #{req.id}</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, minWidth: 80, color: '#2D5BFF' }}>{req.server}</span>
            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 130,
              color: req.status.includes('LOST') ? '#c0392b' : '#2E9E6B' }}>{req.status}</span>
            <span style={{ fontSize: 12, color: '#555', flex: 1 }}>{req.detail}</span>
          </div>
        ))}
        {requests.length === 0 && (
          <div style={{ color: '#888', fontSize: 13 }}>Press "Send request 1" to begin.</div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   QUIZ DATA
   ================================================================ */
const QUESTIONS = [
  {
    q: 'What is the key difference between L4 and L7 load balancing?',
    o: [
      'L7 only works with HTTPS; L4 works with both HTTP and HTTPS',
      'L4 is used for databases; L7 is used only for web servers',
      'L4 and L7 are the same thing — they both distribute HTTP requests',
      'L4 is faster because it operates at the TCP layer and does not read HTTP content; L7 is slower but can route by URL, header, or cookie',
    ],
    a: 3,
    e: 'L4 sees only IP/port (TCP layer) — it cannot read the HTTP content, so it is fast but cannot route by URL. L7 reads the full HTTP request, so it can route /api/users to one service and /api/orders to another, but with more overhead.',
    w: {
      0: 'L7 works with both HTTP and HTTPS (it does TLS termination). The distinction is about what it can read, not which protocol it supports.',
      1: 'L4/L7 do not distinguish between databases and web servers — these terms refer to which OSI layer the load balancer operates on.',
      2: 'L4 and L7 are very different OSI layers. L4 sees TCP connections; L7 sees HTTP messages. They have different routing capabilities.',
    },
    r: { id: 's2', label: 'Section 2 — L4 vs L7 load balancing' },
  },
  {
    q: 'You have servers with different capacities: Server A can handle 3× more traffic than Server B. Which algorithm handles this best?',
    o: [
      'IP hash, because it pins each client to one server',
      'Weighted round-robin, because you assign Server A a higher weight',
      'Round-robin, because it evenly distributes requests',
      'Least connections, because it always picks the least busy server',
    ],
    a: 1,
    e: 'Weighted round-robin lets you assign weights based on server capacity. If Server A has weight 3 and Server B has weight 1, Server A receives 3× as many requests — matching its extra capacity.',
    w: {
      0: 'IP hash is about session affinity, not capacity. It does not help when servers have different capacities.',
      2: 'Round-robin does not account for server capacity. It sends equal requests to all servers, overloading the weaker one.',
      3: 'Least connections adapts to current load, but does not know that Server A can handle 3× more. Weighted round-robin is the explicit way to configure capacity differences.',
    },
    r: { id: 's3', label: 'Section 3 — Load balancing algorithms' },
  },
  {
    q: 'Why is least-connections better than round-robin when some requests take much longer than others?',
    o: [
      'Least-connections does TLS termination, which reduces connection time',
      'It is not better — round-robin is always the safest choice',
      'Round-robin counts connections; least-connections counts requests, so it is more accurate',
      'Least-connections routes new requests away from the server handling a long-running request, so no server gets a pile of slow work',
    ],
    a: 3,
    e: 'Round-robin blindly rotates, so one server can accumulate many slow requests while others are idle. Least-connections checks active connection count right now — a server with a long-running request shows a high count, so new requests go elsewhere.',
    w: {
      0: 'TLS termination is a feature of L7 load balancers, not of the least-connections algorithm. The algorithm only decides which server to send the next request to.',
      1: 'Round-robin is simple but ignores actual server load. Least-connections is genuinely better for uneven request durations.',
      2: 'It is the opposite: round-robin just counts turns (it does not count connections). Least-connections tracks active connections.',
    },
    r: { id: 's3', label: 'Section 3 — Load balancing algorithms' },
  },
  {
    q: 'A load balancer uses "active health checks." What does this mean?',
    o: [
      'The load balancer watches for errors in real traffic and marks servers down based on error rate',
      'Servers send heartbeat messages to the load balancer every second',
      'The load balancer periodically sends a probe (e.g. GET /health) to each server; consecutive failures mark it as down',
      'Active health checks are only possible with L4 load balancers',
    ],
    a: 2,
    e: 'Active health checks mean the load balancer itself probes each server (e.g., every 5 seconds with GET /health). If a server fails N consecutive checks, it is removed from the pool. This is different from passive checks, which observe real traffic.',
    w: {
      0: 'That describes passive health checks (monitoring real traffic error rates). Active means the load balancer initiates the probe itself, independent of real traffic.',
      1: 'In active health checks, the load balancer probes the servers, not the other way around. Servers do not send heartbeats to the LB in this model.',
      3: 'Both L4 and L7 load balancers can do active health checks. The check is a network probe, not tied to HTTP layer specifics.',
    },
    r: { id: 's5', label: 'Section 5 — Health checks' },
  },
  {
    q: 'What is the main reason to avoid sticky sessions and use Redis for session storage instead?',
    o: [
      'If the pinned server goes down, the user\'s session is lost. Redis externalizes session state so any server can serve any client',
      'Sticky sessions require cookies, and some browsers block cookies',
      'Redis is faster than any web server, so all requests should go to Redis',
      'Sticky sessions only work with L4 load balancers, not L7',
    ],
    a: 0,
    e: 'Sticky sessions store session data in a specific server\'s memory. If that server crashes or is taken offline for deployment, all pinned users lose their sessions. Redis stores session data outside any server, so traffic can be freely rerouted without any data loss.',
    w: {
      1: 'Cookie blocking is a minor edge case. The main problem with sticky sessions is that server failures or deployments cause session loss.',
      2: 'Redis is a cache/store, not a web server. Requests still go to application servers — Redis just stores the shared session data.',
      3: 'Sticky sessions work with both L4 (IP hash) and L7 (cookie-based). The problem is not which layer — it is the coupling between a user and a specific server instance.',
    },
    r: { id: 's7', label: 'Section 7 — Sticky sessions' },
  },
  {
    q: 'What is connection draining?',
    o: [
      'Flushing the load balancer\'s connection table every hour',
      'Reducing the maximum number of connections a server accepts',
      'Marking a server as DRAINING so no new requests go to it, but letting existing in-flight requests finish before shutting it down',
      'Stopping all active connections immediately when a server is removed',
    ],
    a: 2,
    e: 'Connection draining (or deregistration delay) gracefully removes a server from the pool. The server stops receiving new requests but continues processing requests that are already in flight, up to a timeout. This prevents dropping requests during rolling deployments.',
    w: {
      0: 'Load balancers do not routinely flush connection tables on a timer. Draining is a per-server lifecycle operation during deployments.',
      1: 'That describes rate limiting or connection limits, not draining. Draining is about gracefully removing a server from the rotation.',
      3: 'Stopping all connections immediately drops in-flight requests — that is the opposite of graceful. Draining specifically avoids this.',
    },
    r: { id: 's9', label: 'Section 9 — Connection draining' },
  },
  {
    q: 'Which load balancing algorithm is most likely to cause an uneven distribution when many clients share the same NAT IP address?',
    o: [
      'Round-robin',
      'IP hash',
      'Least connections',
      'Weighted round-robin',
    ],
    a: 1,
    e: 'IP hash routes clients based on hash(clientIP) % numServers. If thousands of users share a single NAT IP (common in corporate networks or mobile carriers), they all hash to the same server, overloading it while others sit idle.',
    w: {
      0: 'Round-robin rotates regardless of IP address, so NAT does not affect its distribution.',
      2: 'Least connections picks the server with the fewest active connections — it does not use client IPs at all.',
      3: 'Weighted round-robin rotates with bias based on server weights, not client IPs. NAT does not affect it.',
    },
    r: { id: 's3', label: 'Section 3 — Load balancing algorithms' },
  },
  {
    q: 'You see the term "TLS termination at the load balancer." What does this mean and why is it good?',
    o: [
      'The load balancer decrypts HTTPS once, then forwards plain HTTP to backend servers — reducing per-server CPU cost and centralizing certificate management',
      'Each backend server must handle TLS encryption independently',
      'The load balancer blocks all non-HTTPS traffic',
      'TLS termination means the load balancer stores the session key in Redis',
    ],
    a: 0,
    e: 'TLS handshake and decryption is CPU-intensive. By terminating TLS at the load balancer, backend servers receive plain HTTP — they do not need to handle certificates or decryption. This simplifies certificate management (one place) and reduces CPU load on many backend servers.',
    w: {
      1: 'That is the opposite of TLS termination. Termination means the LB handles decryption so backend servers do not have to.',
      2: 'TLS termination does not block non-HTTPS traffic — that is a firewall rule. Termination is about where decryption happens.',
      3: 'TLS termination has nothing to do with Redis. Redis is used for session storage; TLS termination is about where HTTPS decryption happens.',
    },
    r: { id: 's2', label: 'Section 2 — L4 vs L7 load balancing' },
  },
]

/* ================================================================
   PAGE
   ================================================================ */
export default function Day97() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 97</div>
        <h1>Load Balancing:<br />Distributing Traffic Across Servers</h1>
        <p>
          One server handles 10,000 requests per second. One million users hit your site. You need
          more servers — and something smart in front to share the work. That is a load balancer.
          Click every demo below and watch how traffic decisions get made in real time.
        </p>
        <div className="chips">
          {['Load Balancer','Round-Robin','Least Connections','L4 vs L7',
            'Health Check','Sticky Sessions','Connection Draining','Consistent Hashing']
            .map(c => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      {/* SECTION 1 — Why load balancing */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The supermarket checkout analogy</h2>
        <p>
          Imagine a supermarket with 100 customers arriving at once. If there is only one
          checkout register, the line is 100 people long. The store manager opens more registers.
          But if the manager just says "go to any register," customers still pile up at one.
          A smart manager watches every register and says: <em>"Register 3 is empty — go there."</em>
        </p>
        <p>
          A <strong>load balancer</strong> is that smart manager. It sits in front of your servers
          and routes each incoming request to the best available server.
        </p>

        <Code html={`<span class="cm">// Without a load balancer (all 100,000 req/s hit one server)</span>
<span class="cm">// Client → Server A (overloaded, crashes at 10,000 req/s)</span>

<span class="cm">// With a load balancer</span>
<span class="cm">// Client → Load Balancer → Server A (33,333 req/s)</span>
<span class="cm">//                       → Server B (33,333 req/s)</span>
<span class="cm">//                       → Server C (33,333 req/s)</span>

<span class="cm">// Each server now handles a manageable share.</span>`} />

        <Note>
          A load balancer has five jobs: (1) distribute traffic, (2) health-check servers and
          stop sending to dead ones, (3) TLS termination (decrypt HTTPS once), (4) sticky sessions
          if needed, and (5) connection draining during deployments.
        </Note>

        <Code html={`<span class="cm">// Architecture picture</span>

  Clients (browsers, apps)
       |
       v
  [ Load Balancer ]          &lt;-- the "supermarket manager"
  /       |       \\
 v        v        v
[S1]    [S2]    [S3]         &lt;-- backend servers (same code, many copies)
  \\       |       /
   v      v      v
  [ Database / Cache ]       &lt;-- shared data layer`} />

        <Reveal summary="Why not just use DNS round-robin instead of a dedicated LB?">
          <p>
            DNS round-robin gives each client a different server IP. It is simple but has problems:
          </p>
          <ul>
            <li>DNS responses are cached — a dead server keeps getting traffic for minutes.</li>
            <li>No health checks. Dead servers are not removed.</li>
            <li>No session affinity or TLS termination.</li>
            <li>Client caches break the distribution.</li>
          </ul>
          <p>A real load balancer fixes all of these.</p>
        </Reveal>
      </section>

      {/* SECTION 2 — L4 vs L7 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>L4 vs L7 — packet-level vs HTTP-level</h2>
        <p>
          The OSI model has 7 layers. Layer 4 is the transport layer (TCP/UDP). Layer 7 is the
          application layer (HTTP/HTTPS). Load balancers work at one of these two levels.
        </p>

        <Code html={`<span class="cm">// L4 Load Balancer (TCP level)</span>
<span class="cm">// Sees: source IP, destination IP, port number</span>
<span class="cm">// Does NOT see: HTTP method, URL path, headers, cookies</span>
<span class="cm">// Decision: based only on IP and port</span>
<span class="cm">// Speed: very fast (no HTTP parsing)</span>

Client: TCP SYN from 192.168.1.5:54321 to port 443
L4 LB: "I'll forward this TCP stream to Server A"
       (It does not know if this is GET /api/orders or GET /api/users)


<span class="cm">// L7 Load Balancer (HTTP level)</span>
<span class="cm">// Sees: full HTTP request — method, URL, headers, cookies, body</span>
<span class="cm">// Can route based on ANY of those fields</span>
<span class="cm">// Higher overhead (must parse HTTP), but very flexible</span>

Client: GET /api/orders/42  Host: myapp.com  Cookie: session=abc
L7 LB: "URL starts with /api/orders → route to Order Service pool"
        "Cookie session=abc → this user is pinned to Server B"
        "POST /api/payments → route to Payment Service pool"`} />

        <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
          <table className="matrix">
            <thead>
              <tr>
                <th>Feature</th>
                <th>L4 Load Balancer</th>
                <th>L7 Load Balancer</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>OSI layer</td><td>Transport (TCP/UDP)</td><td>Application (HTTP)</td></tr>
              <tr><td>Routing basis</td><td>IP + port only</td><td>URL, headers, cookies, body</td></tr>
              <tr><td>Speed</td><td className="yes">Very fast</td><td>Slower (parses HTTP)</td></tr>
              <tr><td>TLS termination</td><td>No (or passthrough)</td><td className="yes">Yes</td></tr>
              <tr><td>Path-based routing</td><td className="no">No</td><td className="yes">Yes</td></tr>
              <tr><td>Sticky sessions by cookie</td><td className="no">No</td><td className="yes">Yes</td></tr>
              <tr><td>Best for</td><td>TCP services, very high throughput</td><td>HTTP microservices, APIs</td></tr>
              <tr><td>Examples</td><td>AWS NLB, HAProxy TCP mode</td><td>AWS ALB, Nginx, HAProxy HTTP</td></tr>
            </tbody>
          </table>
        </div>

        <Good>
          TLS termination at the L7 LB means backend servers receive plain HTTP — no certificate
          management per server, no decryption CPU cost on each server. Certificates live in one place.
        </Good>

        <Reveal summary="What is path-based routing? Give a concrete example.">
          <p>
            With an L7 LB you can run multiple microservices behind one domain:
          </p>
          <Code html={`<span class="cm">// Nginx L7 routing config (simplified)</span>
location /api/users    { proxy_pass http://user-service-pool;    }
location /api/orders   { proxy_pass http://order-service-pool;   }
location /api/payments { proxy_pass http://payment-service-pool; }
location /             { proxy_pass http://frontend-pool;        }

<span class="cm">// The client hits one domain. The LB routes each request</span>
<span class="cm">// to the right microservice pool based on the URL path.</span>`} />
        </Reveal>
      </section>

      {/* SECTION 3 — Algorithms */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Six load balancing algorithms</h2>
        <p>
          The most important decision the load balancer makes is: <em>which server gets this
          request?</em> Six algorithms answer this differently.
        </p>

        <Code html={`<span class="cm">─────────────────────────────────────────────────────</span>
<span class="cm">  Algorithm 1: Round-Robin</span>
<span class="cm">─────────────────────────────────────────────────────</span>
<span class="cm">  Rotate in order: S1 → S2 → S3 → S1 → S2 → S3 ...</span>
<span class="cm">  Simple. Even for equal-size requests.</span>
<span class="cm">  Problem: a slow request blocks S1 while S2/S3 are idle.</span>

<span class="cm">─────────────────────────────────────────────────────</span>
<span class="cm">  Algorithm 2: Weighted Round-Robin</span>
<span class="cm">─────────────────────────────────────────────────────</span>
<span class="cm">  S1 weight=3, S2 weight=1 → sequence: S1 S1 S1 S2 S1 S1 S1 S2 ...</span>
<span class="cm">  S1 gets 3× more requests. Good for heterogeneous servers.</span>
<span class="cm">  Still does not adapt to actual current load.</span>

<span class="cm">─────────────────────────────────────────────────────</span>
<span class="cm">  Algorithm 3: Least Connections</span>
<span class="cm">─────────────────────────────────────────────────────</span>
<span class="cm">  New request → go to the server with fewest active connections NOW.</span>
<span class="cm">  Adapts dynamically. S1 processing a slow request? Its count rises.</span>
<span class="cm">  Next request goes to S2 or S3 instead. Natural load adaptation.</span>

<span class="cm">─────────────────────────────────────────────────────</span>
<span class="cm">  Algorithm 4: Least Response Time</span>
<span class="cm">─────────────────────────────────────────────────────</span>
<span class="cm">  Route to the server with the lowest average response time.</span>
<span class="cm">  Most adaptive. Requires the LB to measure response times.</span>
<span class="cm">  Good for varied server performance (CPU, memory, GC pauses).</span>

<span class="cm">─────────────────────────────────────────────────────</span>
<span class="cm">  Algorithm 5: IP Hash</span>
<span class="cm">─────────────────────────────────────────────────────</span>
<span class="cm">  hash(clientIP) % numServers → always the same server for same IP.</span>
<span class="cm">  Simple sticky sessions. No cookie needed.</span>
<span class="cm">  Problem: NAT → many users share one IP → one server overloads.</span>
<span class="cm">  Problem: server removed → all those clients suddenly reroute.</span>

<span class="cm">─────────────────────────────────────────────────────</span>
<span class="cm">  Algorithm 6: Consistent Hashing (ring)</span>
<span class="cm">─────────────────────────────────────────────────────</span>
<span class="cm">  Place servers and keys on a ring. Key → nearest server clockwise.</span>
<span class="cm">  Adding/removing one server reroutes only 1/N of keys, not all.</span>
<span class="cm">  Used in caches (cache affinity), distributed DBs, not raw LBs.</span>
<span class="cm">─────────────────────────────────────────────────────</span>`} />

        <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
          <table className="matrix">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Adapts to load?</th>
                <th>Handles capacity diff?</th>
                <th>Sticky sessions?</th>
                <th>Best for</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Round-robin</td><td className="no">No</td><td className="no">No</td><td className="no">No</td><td>Uniform requests, equal servers</td></tr>
              <tr><td>Weighted RR</td><td className="no">No</td><td className="yes">Yes</td><td className="no">No</td><td>Mixed server capacities</td></tr>
              <tr><td>Least connections</td><td className="yes">Yes</td><td className="no">No</td><td className="no">No</td><td>Variable request durations</td></tr>
              <tr><td>Least response time</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="no">No</td><td>Performance-varied servers</td></tr>
              <tr><td>IP hash</td><td className="no">No</td><td className="no">No</td><td className="yes">Simple</td><td>Simple affinity, no cookies</td></tr>
              <tr><td>Consistent hashing</td><td className="no">No</td><td className="no">No</td><td className="yes">Cache</td><td>Cache affinity, distributed systems</td></tr>
            </tbody>
          </table>
        </div>

        <Warn>
          Round-robin is the default in most systems. Switch to least-connections if requests have
          very different durations. Switch to weighted round-robin if servers have different capacities.
        </Warn>
      </section>

      {/* SECTION 4 — Demo 1 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: algorithm comparison</h2>
        <p>
          Four servers, 20 requests (red starred ones are "heavy" — they take 3× longer).
          Pick an algorithm tab and press "Distribute 20 requests." Watch how requests are
          spread across servers. Notice how least-connections naturally avoids piling work
          on the server stuck with a heavy request.
        </p>
        <AlgoDemo />
        <Good>
          Notice: with round-robin, heavy requests (★) land on whichever server's turn it is —
          no relief. With least-connections, after a heavy request lands on S1, S1's active-connection
          count rises, so the next few requests go to S2/S3/S4 instead.
        </Good>
      </section>

      {/* SECTION 5 — Health checks */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Health checks — detect and remove dead servers</h2>
        <p>
          A server can crash at any moment. If the load balancer keeps sending requests to a
          dead server, every one of those requests fails. Health checks solve this.
        </p>

        <Code html={`<span class="cm">// Active health check: LB probes each server every 5 seconds</span>
<span class="kw">class</span> HealthChecker <span class="kw">implements</span> Runnable {
    <span class="kw">private final</span> List&lt;Server&gt; servers;  <span class="cm">// all servers in the pool</span>
    <span class="kw">private final</span> HttpClient http;       <span class="cm">// HTTP client for probing</span>
    <span class="kw">private final int</span> failThreshold = <span class="num">2</span>; <span class="cm">// 2 consecutive failures = DOWN</span>

    <span class="kw">public void</span> run() {
        <span class="kw">for</span> (Server s : servers) {
            <span class="kw">try</span> {
                <span class="kw">int</span> status = http.get(s.url() + <span class="str">"/health"</span>)
                                   .statusCode();           <span class="cm">// probe the health endpoint</span>
                <span class="kw">if</span> (status == <span class="num">200</span>) {
                    s.resetFailCount();                     <span class="cm">// it responded — reset counter</span>
                    s.setHealthy(<span class="kw">true</span>);                  <span class="cm">// put back in rotation</span>
                } <span class="kw">else</span> {
                    s.incrementFailCount();                 <span class="cm">// bad response code</span>
                    <span class="kw">if</span> (s.failCount() &gt;= failThreshold) s.setHealthy(<span class="kw">false</span>);
                }
            } <span class="kw">catch</span> (Exception e) {
                s.incrementFailCount();                     <span class="cm">// connection refused / timeout</span>
                <span class="kw">if</span> (s.failCount() &gt;= failThreshold) {
                    s.setHealthy(<span class="kw">false</span>);                <span class="cm">// 2 failures → remove from pool</span>
                }
            }
        }
    }
}

<span class="cm">// The load balancer only routes to healthy servers</span>
<span class="kw">class</span> LoadBalancer {
    Server next() {
        <span class="kw">return</span> servers.stream()
            .filter(Server::isHealthy)  <span class="cm">// skip unhealthy servers</span>
            .findFirst()
            .orElseThrow(NoHealthyServersException::<span class="kw">new</span>);
    }
}`} />

        <Note>
          <strong>Active vs passive health checks:</strong> Active = LB sends probes on its own schedule
          (GET /health every 5s). Passive = LB watches real traffic — if error rate for a server exceeds
          a threshold, it marks the server down. Active detects failures faster; passive generates no
          extra traffic.
        </Note>

        <Code html={`<span class="cm">// Health check timeline for one server</span>

t=0s   Probe → 200 OK          failCount=0  status=HEALTHY  in rotation: YES
t=5s   Probe → 200 OK          failCount=0  status=HEALTHY  in rotation: YES
t=10s  Probe → timeout         failCount=1  status=HEALTHY  in rotation: YES  (still in)
t=15s  Probe → timeout         failCount=2  status=DOWN     in rotation: NO   ← removed!
        (new requests stop going here)
t=20s  Probe → 200 OK          failCount=1  status=RECOVERING
t=25s  Probe → 200 OK          failCount=0  status=HEALTHY  in rotation: YES  ← rejoined!`} />

        <Good>
          The <strong>fail threshold</strong> (usually 2–3 consecutive failures) prevents a single
          slow probe from removing a healthy server. The <strong>recovery threshold</strong> prevents
          a flapping server from causing instability.
        </Good>
      </section>

      {/* SECTION 6 — Demo 2 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>Play: health check and failover</h2>
        <p>
          Three servers are live. Press "Start simulation" — watch the health check ticker probe
          each server. Then press "Kill this server" on one of them. After 2 failed checks it
          turns red and leaves the rotation. Press "Revive" to watch it recover and rejoin.
          Notice the live request log — requests automatically avoid the dead server.
        </p>
        <HealthCheckDemo />
        <Good>
          Key observation: there is a brief window (up to 2 probe intervals) where requests still
          go to a dead server before the LB detects the failure. This is why probe intervals should
          be short (2–5s) and timeouts tight.
        </Good>
      </section>

      {/* SECTION 7 — Sticky sessions */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Sticky sessions — and why to avoid them</h2>
        <p>
          Some applications store user session data in server memory (not a shared database).
          This creates a problem: if the user is routed to a different server on the next request,
          that server does not have the session. The user gets logged out.
        </p>
        <p>
          <strong>Sticky sessions</strong> (session affinity) solve this by always routing the
          same client to the same server.
        </p>

        <Code html={`<span class="cm">// How cookie-based sticky sessions work (L7 LB)</span>

<span class="cm">// Step 1: First request — LB picks a server, sets a cookie</span>
User sends:   GET /dashboard
LB response:  HTTP/1.1 200 OK
              Set-Cookie: SERVERID=s2; Path=/; HttpOnly

<span class="cm">// Step 2: All future requests — LB reads cookie, routes to same server</span>
User sends:   GET /profile
              Cookie: SERVERID=s2        &lt;-- browser sends it automatically
LB action:    "SERVERID=s2 → always route to Server 2"
              (ignores load on other servers!)

<span class="cm">// The problem: Server 2 crashes</span>
User sends:   GET /checkout
              Cookie: SERVERID=s2
LB action:    "Server 2 is DOWN... route to Server 3"
              Server 3 does not have this user's session!
Result:       User is logged out. Session data is gone.</span>`} />

        <Code html={`<span class="cm">// IP hash sticky sessions (L4)</span>
<span class="kw">class</span> IpHashLoadBalancer {
    Server next(String clientIp) {
        <span class="kw">int</span> hash = clientIp.hashCode();          <span class="cm">// hash the client IP</span>
        <span class="kw">int</span> idx  = Math.abs(hash) % servers.size(); <span class="cm">// pick a server by hash</span>
        <span class="kw">return</span> servers.get(idx);                 <span class="cm">// same IP → same server always</span>
        <span class="cm">// Problem: if one server goes down, 1/N clients suddenly reroute</span>
        <span class="cm">// Problem: corporate NAT → 10,000 employees share one IP → one server</span>
    }
}`} />

        <Warn>
          Sticky sessions couple your users to specific server instances. This breaks rolling
          deployments (taking servers down one by one) and auto-scaling (new servers don't get
          existing sessions). The modern solution is to externalize session state.
        </Warn>

        <Code html={`<span class="cm">// The better approach: externalize session state to Redis</span>
<span class="kw">class</span> SessionService {
    <span class="kw">private final</span> RedisClient redis;   <span class="cm">// Redis is shared by all servers</span>

    <span class="kw">public void</span> save(String sessionId, UserSession data) {
        redis.set(sessionId, serialize(data), Duration.ofHours(<span class="num">1</span>)); <span class="cm">// store in Redis</span>
    }

    <span class="kw">public</span> UserSession load(String sessionId) {
        <span class="kw">return</span> deserialize(redis.get(sessionId)); <span class="cm">// any server reads from Redis</span>
    }
}

<span class="cm">// Now any server can serve any user — no sticky sessions needed.</span>
<span class="cm">// Scale up, scale down, deploy freely.</span>
<span class="cm">// Server 2 crashes? User goes to Server 3, loads session from Redis — fine.</span>`} />

        <Good>
          Externalizing session state to Redis (or a database) is the correct long-term design.
          It lets you treat all servers as interchangeable — no user is "owned" by any server.
          This is a prerequisite for proper horizontal scaling.
        </Good>
      </section>

      {/* SECTION 8 — Demo 3 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>Play: sticky sessions vs shared cache</h2>
        <p>
          Send several requests. Then press "Deploy" to take Server 1 offline.
          In Sticky Sessions mode, a user pinned to Server 1 loses their session.
          In Shared Cache (Redis) mode, any server can continue — no data loss.
        </p>
        <StickyVsRedisDemo />
        <Good>
          The key moment: after "Deploy" in sticky mode, the user pinned to Server 1 gets
          "SESSION LOST." In Redis mode, the same deployment causes zero disruption.
        </Good>
      </section>

      {/* SECTION 9 — Connection draining */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Connection draining — graceful deregistration</h2>
        <p>
          Every week you deploy new code. The deploy process removes the old server and starts
          a new one. Without draining, all in-flight requests on the old server are dropped —
          users see errors mid-checkout.
        </p>
        <p>
          <strong>Connection draining</strong> makes this graceful:
        </p>

        <Code html={`<span class="cm">// Connection draining — 4 steps</span>

Step 1 — DEREGISTER from LB
  Mark server as DRAINING.
  LB stops sending NEW requests here.
  Existing in-flight requests are still processing.

Step 2 — WAIT for in-flight requests to finish
  Wait up to 30 seconds (configurable "deregistration delay").
  New requests go to other servers.
  Long-running requests (e.g. file upload) get to complete.

Step 3 — TIMEOUT
  After 30s, any remaining connections are closed forcefully.
  (Usually 30s is enough for HTTP requests to finish.)

Step 4 — SHUTDOWN
  Process exits. New server (with new code) starts up.
  LB health check passes → new server joins rotation.

<span class="cm">// AWS ALB: "deregistration delay" = 300s default, configurable down to 0</span>
<span class="cm">// GCP LB:  "connection draining timeout" = 300s default</span>
<span class="cm">// Nginx:   worker_shutdown_timeout directive</span>`} />

        <Note>
          During draining, the server shows as DRAINING (not HEALTHY, not DOWN) in the LB console.
          Monitoring should not alert on this state — it is expected during a deploy.
        </Note>

        <Code html={`<span class="cm">// Rolling deployment with draining (zero-downtime deploy)</span>

Fleet: [S1 v1.0] [S2 v1.0] [S3 v1.0]

Step 1: Drain S1 (30s) → deploy v2.0 → health check passes → S1 rejoins
Fleet: [S1 v2.0] [S2 v1.0] [S3 v1.0]

Step 2: Drain S2 (30s) → deploy v2.0 → health check passes → S2 rejoins
Fleet: [S1 v2.0] [S2 v2.0] [S3 v1.0]

Step 3: Drain S3 (30s) → deploy v2.0 → health check passes → S3 rejoins
Fleet: [S1 v2.0] [S2 v2.0] [S3 v2.0]

<span class="cm">// Users: zero dropped requests. Always at least 2 of 3 servers running.</span>`} />

        <Good>
          Connection draining is free in all major cloud load balancers — just configure the
          deregistration delay. For short HTTP requests, 30s is more than enough. For long
          streaming requests, increase it.
        </Good>
      </section>

      {/* SECTION 10 — Cloud LBs + cheat sheet */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Cloud load balancers + cheat sheet</h2>

        <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
          <table className="matrix">
            <thead>
              <tr>
                <th>Product</th>
                <th>Layer</th>
                <th>Path routing</th>
                <th>TLS termination</th>
                <th>WebSockets</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>AWS ALB</td><td>L7</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td><td>Standard for HTTP microservices on AWS</td></tr>
              <tr><td>AWS NLB</td><td>L4</td><td className="no">No</td><td>Pass-through</td><td className="yes">Yes</td><td>Ultra-low latency, static IP</td></tr>
              <tr><td>GCP HTTP(S) LB</td><td>L7</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td><td>Global anycast, built-in CDN</td></tr>
              <tr><td>Nginx</td><td>L4+L7</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td><td>Self-hosted, highly configurable</td></tr>
              <tr><td>HAProxy</td><td>L4+L7</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td><td>Very high performance, industry standard</td></tr>
            </tbody>
          </table>
        </div>

        <Code html={`<span class="cm">// Global load balancing — GeoDNS</span>
<span class="cm">// Users in India → data center in Mumbai</span>
<span class="cm">// Users in USA   → data center in Virginia</span>
<span class="cm">// Implemented via DNS: the DNS response depends on the client's geographic IP.</span>
<span class="cm">// AWS Route 53 "Latency routing" and "Geolocation routing" do this.</span>
<span class="cm">// GCP uses anycast: the same IP routes to the nearest GCP PoP automatically.</span>`} />

        <h3 style={{ marginTop: '1.5rem' }}>Cheat sheet</h3>
        <ul>
          <li><strong>Load balancer</strong> = sits in front of servers, distributes requests, health-checks servers.</li>
          <li><strong>L4</strong> = routes by IP/port only. Fast. No HTTP awareness. (AWS NLB)</li>
          <li><strong>L7</strong> = routes by URL/header/cookie. TLS termination. Path-based routing. (AWS ALB, Nginx)</li>
          <li><strong>Round-robin</strong> = rotate. Simple, even, but no adaptation.</li>
          <li><strong>Weighted RR</strong> = rotate with server-capacity weights.</li>
          <li><strong>Least connections</strong> = route to server with fewest active connections. Adapts to slow requests.</li>
          <li><strong>IP hash</strong> = same client IP → same server. Simple affinity, fragile with NAT or server removal.</li>
          <li><strong>Consistent hashing</strong> = ring-based. Only 1/N keys reroute when a server changes.</li>
          <li><strong>Active health check</strong> = LB probes /health endpoint. N consecutive failures → server removed.</li>
          <li><strong>Passive health check</strong> = LB monitors real traffic error rates.</li>
          <li><strong>Sticky sessions</strong> = pin user to one server. Fragile. Avoid by externalizing session to Redis.</li>
          <li><strong>Connection draining</strong> = mark server DRAINING → no new requests → wait for in-flight → shut down.</li>
          <li><strong>TLS termination</strong> = decrypt HTTPS once at LB; forward plain HTTP to backends.</li>
          <li><strong>GeoDNS / anycast</strong> = route users to nearest data center globally.</li>
        </ul>

        <Reveal summary="Java skeleton: round-robin and least-connections in full">
          <Code html={`<span class="kw">import</span> java.util.*;
<span class="kw">import</span> java.util.concurrent.atomic.*;

<span class="cm">// Round-Robin — thread-safe with AtomicInteger</span>
<span class="kw">class</span> RoundRobinLoadBalancer {
    <span class="kw">private final</span> List&lt;Server&gt; servers;
    <span class="kw">private final</span> AtomicInteger counter = <span class="kw">new</span> AtomicInteger(<span class="num">0</span>);

    Server next() {
        List&lt;Server&gt; healthy = servers.stream()
            .filter(Server::isHealthy)             <span class="cm">// only healthy servers</span>
            .collect(Collectors.toList());
        <span class="kw">if</span> (healthy.isEmpty()) <span class="kw">throw new</span> NoHealthyServersException();
        <span class="cm">// getAndIncrement returns old value; % gives a valid index</span>
        <span class="kw">return</span> healthy.get(counter.getAndIncrement() % healthy.size());
    }
}

<span class="cm">// Least-Connections — pick server with fewest active connections</span>
<span class="kw">class</span> LeastConnectionsLoadBalancer {
    <span class="kw">private final</span> List&lt;Server&gt; servers;

    <span class="kw">synchronized</span> Server next() {   <span class="cm">// synchronized: connection counts change</span>
        <span class="kw">return</span> servers.stream()
            .filter(Server::isHealthy)
            .min(Comparator.comparingInt(Server::activeConnections)) <span class="cm">// fewest first</span>
            .orElseThrow(NoHealthyServersException::<span class="kw">new</span>);
    }
}

<span class="cm">// Weighted Round-Robin — expand weights into a rotation list</span>
<span class="kw">class</span> WeightedRoundRobinLoadBalancer {
    <span class="kw">private final</span> List&lt;Server&gt; rotation;  <span class="cm">// e.g., [S1,S1,S1,S2] for weights 3,1</span>
    <span class="kw">private final</span> AtomicInteger counter = <span class="kw">new</span> AtomicInteger(<span class="num">0</span>);

    WeightedRoundRobinLoadBalancer(List&lt;Server&gt; servers) {
        rotation = <span class="kw">new</span> ArrayList&lt;&gt;();
        <span class="kw">for</span> (Server s : servers) {
            <span class="kw">for</span> (<span class="kw">int</span> i = <span class="num">0</span>; i &lt; s.weight(); i++) {
                rotation.add(s);   <span class="cm">// repeat each server by its weight</span>
            }
        }
    }

    Server next() {
        <span class="kw">return</span> rotation.get(counter.getAndIncrement() % rotation.size());
    }
}`} />
        </Reveal>
      </section>

      {/* INTERVIEW CORNER */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Tricky questions interviewers love</h2>

        <Reveal summary="Q1: What is the difference between L4 and L7 load balancing?">
          <p>
            <strong>L4</strong> operates at the TCP/UDP layer. It sees only IP addresses and ports
            — not HTTP content. It forwards TCP streams to backend servers without reading what is
            inside. Fast, low overhead.
          </p>
          <p>
            <strong>L7</strong> operates at the HTTP layer. It parses the full HTTP request — URL,
            headers, cookies, body. It can route <C>/api/orders</C> to one service and <C>/api/users</C>
            to another. It can do TLS termination and cookie-based sticky sessions. Higher overhead.
          </p>
          <p>
            Use L4 for high-throughput TCP services. Use L7 for HTTP microservices where you need
            path-based routing, TLS termination, or header inspection.
          </p>
        </Reveal>

        <Reveal summary="Q2: Which algorithm should you use when servers have different capacities?">
          <p>
            <strong>Weighted round-robin.</strong> Assign a weight to each server proportional to
            its capacity. A server with weight 3 receives 3× more requests than a server with weight 1.
          </p>
          <p>
            If you also need to adapt to real-time load (a powerful server is temporarily slow due
            to a GC pause), use <strong>least connections</strong> or <strong>least response time</strong>
            instead — these adapt dynamically without needing static weights.
          </p>
        </Reveal>

        <Reveal summary="Q3: What is the least-connections algorithm and when is it better than round-robin?">
          <p>
            Least connections routes each new request to the server with the fewest active connections
            at that moment. It requires the LB to track connection counts — slightly more overhead than
            round-robin.
          </p>
          <p>
            It is better than round-robin when <strong>requests have very different durations</strong>.
            Example: some requests take 1ms (trivial), some take 2s (DB-heavy). With round-robin, the
            server that gets the 2s request is stuck while others are idle. With least connections, the
            stuck server shows a high count, so the next few requests go to other servers naturally.
          </p>
        </Reveal>

        <Reveal summary="Q4: What are sticky sessions and why should you avoid them?">
          <p>
            Sticky sessions (session affinity) force the load balancer to always route the same client
            to the same server. This is needed when session data is stored in server memory — otherwise
            the user's session is lost when routed elsewhere.
          </p>
          <p>
            Why avoid them:
          </p>
          <ul>
            <li>If the pinned server goes down, the user's session is lost.</li>
            <li>Rolling deployments (taking servers down one by one) break pinned users.</li>
            <li>New servers do not get traffic from existing users — auto-scaling is less effective.</li>
            <li>Distribution becomes uneven if some users are very active.</li>
          </ul>
          <p>
            The correct alternative: store session data in <strong>Redis</strong> or a shared database.
            Then any server can handle any user and you need no stickiness at all.
          </p>
        </Reveal>

        <Reveal summary="Q5: What is connection draining and why does it matter during deployments?">
          <p>
            Connection draining (also called deregistration delay) is the process of gracefully removing
            a server from the load balancer pool without dropping in-flight requests.
          </p>
          <p>Steps: (1) Mark server as DRAINING — stop sending new requests. (2) Wait for existing
            in-flight requests to complete (up to a configurable timeout, e.g., 30s). (3) Force-close
            any remaining connections. (4) Shut down the server.</p>
          <p>
            Without draining: any request in the middle of processing (e.g., a payment) is dropped
            when the server is taken offline. Users see errors. During rolling deployments, draining
            ensures zero dropped requests.
          </p>
        </Reveal>

        <Reveal summary="Q6: How does a load balancer detect that a server has failed?">
          <p>Two methods:</p>
          <p>
            <strong>Active health checks:</strong> The LB periodically sends a probe request (e.g.,
            <C>GET /health</C> every 5 seconds) to each server. If the server fails to respond or
            returns a non-200 status for N consecutive checks (e.g., 2 failures), the LB marks it
            DOWN and stops sending traffic. When the server passes health checks again (e.g., 2
            consecutive passes), it is added back.
          </p>
          <p>
            <strong>Passive health checks:</strong> The LB monitors real traffic. If a server's error
            rate (5xx responses, timeouts) exceeds a threshold, the LB marks it DOWN. No extra probe
            traffic, but detection is slower because it relies on real requests hitting the bad server.
          </p>
          <p>
            Production systems often use both: active probes for fast detection, passive monitoring
            for catching degraded-but-not-dead servers.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="squiz">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear immediately for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 97 complete?</strong> Homework: implement a <C>LoadBalancer</C> class in Java
        that supports pluggable <C>RoutingStrategy</C> (round-robin and least-connections as two
        implementations). Add a <C>HealthChecker</C> that runs on a scheduled thread and marks
        servers up/down. Test: start 3 "servers" (mock objects), mark one DOWN, verify no requests
        go to it. Then mark it UP and verify it rejoins. Bonus: add weighted round-robin as a
        third strategy.
        <br /><br />
        Next: <strong>Day 98 — Microservices Patterns</strong>: service decomposition, API gateway,
        inter-service communication (sync REST vs async messaging), service discovery, and the
        circuit breaker pattern.
      </div>

    </div>
  )
}
