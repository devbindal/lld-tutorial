import { useState, useEffect, useRef } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Gateway Filter Pipeline
   ============================================================ */

const FILTERS = [
  { name: 'TLS Termination',   icon: '🔒', desc: 'Decrypt HTTPS → plain HTTP internally' },
  { name: 'Authentication',    icon: '🪪', desc: 'Verify JWT signature and expiry' },
  { name: 'Rate Limiting',     icon: '🚦', desc: 'Check token bucket per API key' },
  { name: 'Routing',           icon: '🗺️', desc: 'Match path prefix → upstream URL' },
  { name: 'Load Balancing',    icon: '⚖️', desc: 'Pick an upstream instance (round-robin)' },
  { name: 'Circuit Breaker',   icon: '⚡', desc: 'Skip failing upstream, return fallback' },
  { name: 'Proxy',             icon: '📡', desc: 'Forward request, relay response' },
]

const SCENARIOS = {
  happy:   { label: 'Happy path (valid JWT)',  failAt: -1,   code: 200, msg: '200 OK — response from UserService' },
  badJwt:  { label: 'Bad JWT token',           failAt: 1,    code: 401, msg: '401 Unauthorized — invalid token' },
  rateExc: { label: 'Rate limit exceeded',     failAt: 2,    code: 429, msg: '429 Too Many Requests — Retry-After: 15' },
  cbOpen:  { label: 'Upstream circuit open',   failAt: 5,    code: 503, msg: '503 Service Unavailable — fallback response' },
}

function GatewayPipelineDemo() {
  const [scenario, setScenario] = useState('happy')
  const [step, setStep] = useState(-1)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)

  function startRequest() {
    if (running) return
    setStep(-1)
    setDone(false)
    setRunning(true)
  }

  useEffect(() => {
    if (!running) return
    const sc = SCENARIOS[scenario]
    let current = 0
    intervalRef.current = setInterval(() => {
      setStep(current)
      if (current === sc.failAt || current === FILTERS.length - 1) {
        clearInterval(intervalRef.current)
        setRunning(false)
        setDone(true)
      } else {
        current++
      }
    }, 420)
    return () => clearInterval(intervalRef.current)
  }, [running, scenario])

  function reset() {
    clearInterval(intervalRef.current)
    setStep(-1)
    setDone(false)
    setRunning(false)
  }

  const sc = SCENARIOS[scenario]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Gateway filter pipeline</div>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: '#555' }}>
        Choose a scenario and click <strong>Send Request</strong>. Watch the request move through each filter.
        When a filter rejects, the chain short-circuits immediately — no further filters run.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(SCENARIOS).map(([key, val]) => (
          <button
            key={key}
            className={scenario === key ? 'act' : 'ghost act'}
            style={{ fontSize: 13 }}
            onClick={() => { setScenario(key); reset() }}
          >
            {val.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className="act" onClick={startRequest} disabled={running}>Send Request</button>
        <button className="ghost act" onClick={reset}>Reset</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FILTERS.map((f, i) => {
          const isActive = step === i
          const isPassed = step > i && (sc.failAt === -1 || i < sc.failAt)
          const isFailed = step === i && sc.failAt === i
          const isSkipped = sc.failAt !== -1 && i > sc.failAt && step >= sc.failAt
          let bg = '#f5f5f5'
          let border = '1.5px solid #dcd9cf'
          let label = ''
          if (isActive && !isFailed) { bg = '#e8f0ff'; border = '2px solid #2D5BFF'; label = '▶ processing…' }
          if (isPassed)  { bg = '#edfaf3'; border = '1.5px solid #2E9E6B'; label = '✔ passed' }
          if (isFailed)  { bg = '#fff0f0'; border = '2px solid #D9534F'; label = `✘ rejected → ${sc.code}` }
          if (isSkipped) { bg = '#fafafa'; border = '1px dashed #ccc'; label = '— skipped' }
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              borderRadius: 8, background: bg, border, transition: 'all 0.25s'
            }}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{f.desc}</div>
              </div>
              {label && <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'IBM Plex Mono', color: isFailed ? '#D9534F' : isPassed ? '#2E9E6B' : '#2D5BFF' }}>{label}</span>}
            </div>
          )
        })}
      </div>

      {done && (
        <div style={{
          marginTop: 16, padding: '12px 16px', borderRadius: 8,
          background: sc.failAt === -1 ? '#edfaf3' : '#fff0f0',
          border: `2px solid ${sc.failAt === -1 ? '#2E9E6B' : '#D9534F'}`,
          fontFamily: 'IBM Plex Mono', fontSize: 14, fontWeight: 600
        }}>
          {sc.failAt === -1 ? '✅' : '❌'} Response: {sc.msg}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Demo 2 — Routing Table Editor
   ============================================================ */

const DEFAULT_ROUTES = [
  { id: 1, pattern: '/api/users',    upstream: 'http://user-service:8080',    canary: false },
  { id: 2, pattern: '/api/orders',   upstream: 'http://order-service:8080',   canary: false },
  { id: 3, pattern: '/api/payments', upstream: 'http://payment-service:8080', canary: true  },
  { id: 4, pattern: '/api/products', upstream: 'http://product-service:8080', canary: false },
]

function RoutingTableDemo() {
  const [routes, setRoutes] = useState(DEFAULT_ROUTES)
  const [testPath, setTestPath] = useState('/api/orders/123')
  const [newPattern, setNewPattern] = useState('')
  const [newUpstream, setNewUpstream] = useState('')
  const [history, setHistory] = useState([])
  const nextId = useRef(5)

  function addRoute() {
    if (!newPattern.trim() || !newUpstream.trim()) return
    setRoutes(r => [...r, { id: nextId.current++, pattern: newPattern.trim(), upstream: newUpstream.trim(), canary: false }])
    setNewPattern('')
    setNewUpstream('')
  }

  function removeRoute(id) { setRoutes(r => r.filter(x => x.id !== id)) }
  function toggleCanary(id) { setRoutes(r => r.map(x => x.id === id ? { ...x, canary: !x.canary } : x)) }

  function sendRequest() {
    const matched = routes.find(r => testPath.startsWith(r.pattern))
    let result
    if (!matched) {
      result = { path: testPath, upstream: null, status: 404, isV2: false }
    } else if (matched.canary) {
      const isV2 = Math.random() < 0.10
      result = { path: testPath, upstream: matched.upstream + (isV2 ? ' [v2 — canary 10%]' : ' [v1 — 90%]'), status: 200, isV2 }
    } else {
      result = { path: testPath, upstream: matched.upstream, status: 200, isV2: false }
    }
    setHistory(h => [{ ...result, id: Date.now() }, ...h].slice(0, 6))
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Routing table editor</div>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: '#555' }}>
        Add/remove routes. Toggle "Canary" to simulate 90%/10% traffic split.
        Type a test path and click <strong>Send</strong> to match it.
      </p>

      <table className="matrix" style={{ width: '100%', marginBottom: 14 }}>
        <thead>
          <tr><th>Path prefix</th><th>Upstream URL</th><th>Canary split</th><th>Remove</th></tr>
        </thead>
        <tbody>
          {routes.map(r => (
            <tr key={r.id}>
              <td style={{ fontFamily: 'IBM Plex Mono', fontSize: 13 }}>{r.pattern}</td>
              <td style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#555' }}>{r.upstream}</td>
              <td style={{ textAlign: 'center' }}>
                <button
                  className={r.canary ? 'act' : 'ghost act'}
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => toggleCanary(r.id)}
                >{r.canary ? '90%/10% v2' : 'Off'}</button>
              </td>
              <td style={{ textAlign: 'center' }}>
                <button className="ghost act" style={{ fontSize: 12, padding: '3px 8px', color: '#D9534F' }}
                  onClick={() => removeRoute(r.id)}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input className="txt" placeholder="/api/new-route" value={newPattern} onChange={e => setNewPattern(e.target.value)} style={{ width: 180 }} />
        <input className="txt" placeholder="http://new-service:8080" value={newUpstream} onChange={e => setNewUpstream(e.target.value)} style={{ width: 240 }} />
        <button className="act" onClick={addRoute}>Add route</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="txt" value={testPath} onChange={e => setTestPath(e.target.value)} placeholder="/api/..." style={{ width: 260 }} />
        <button className="act" onClick={sendRequest}>Send test request</button>
      </div>

      {history.length > 0 && (
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: '#555' }}>Request log:</div>
          {history.map(h => (
            <div key={h.id} style={{
              padding: '6px 10px', borderRadius: 6, marginBottom: 4,
              background: h.status === 200 ? (h.isV2 ? '#fff8e0' : '#edfaf3') : '#fff0f0',
              border: `1px solid ${h.status === 200 ? (h.isV2 ? '#C9A227' : '#2E9E6B') : '#D9534F'}`
            }}>
              <span style={{ color: '#555' }}>GET {h.path}</span>
              {' → '}
              {h.status === 200
                ? <span style={{ color: h.isV2 ? '#B97A14' : '#2E9E6B' }}>{h.upstream} [{h.status}]</span>
                : <span style={{ color: '#D9534F' }}>404 Not Found — no route matched</span>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Demo 3 — Per-client Rate Limiting
   ============================================================ */

const MAX_TOKENS = 5
const REFILL_RATE_MS = 800  // 1 token every 800ms for demo speed

function RateLimitDemo() {
  const [clients, setClients] = useState(() =>
    ['Client A', 'Client B', 'Client C', 'Client D', 'Client E'].map((name, i) => ({
      name, tokens: MAX_TOKENS, log: []
    }))
  )
  const refillRef = useRef(null)

  useEffect(() => {
    refillRef.current = setInterval(() => {
      setClients(cs => cs.map(c => ({
        ...c,
        tokens: Math.min(MAX_TOKENS, c.tokens + 1)
      })))
    }, REFILL_RATE_MS)
    return () => clearInterval(refillRef.current)
  }, [])

  function sendOne(idx) {
    setClients(cs => cs.map((c, i) => {
      if (i !== idx) return c
      const allowed = c.tokens > 0
      const entry = allowed
        ? { status: 200, msg: '200 OK' }
        : { status: 429, msg: '429 — Retry-After: 1s' }
      return { ...c, tokens: allowed ? c.tokens - 1 : c.tokens, log: [entry, ...c.log].slice(0, 4) }
    }))
  }

  function burst(idx) {
    setClients(cs => cs.map((c, i) => {
      if (i !== idx) return c
      let tokens = c.tokens
      const log = []
      for (let n = 0; n < 8; n++) {
        if (tokens > 0) { log.push({ status: 200, msg: '200 OK' }); tokens-- }
        else            { log.push({ status: 429, msg: '429 — Retry-After: 1s' }) }
      }
      return { ...c, tokens, log: log.slice(0, 4) }
    }))
  }

  function reset() {
    setClients(cs => cs.map(c => ({ ...c, tokens: MAX_TOKENS, log: [] })))
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Per-client token bucket</div>
      <p style={{ margin: '0 0 14px', fontSize: 14, color: '#555' }}>
        Each client has <strong>5 tokens</strong>. Tokens refill at 1 per second.
        Click <strong>Send 1</strong> for a single request. Click <strong>Burst (8)</strong> on Client A
        to see the first 5 succeed and the rest get 429. Other clients are completely unaffected.
      </p>
      <button className="ghost act" style={{ marginBottom: 16 }} onClick={reset}>Reset all tokens</button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {clients.map((c, idx) => {
          const pct = (c.tokens / MAX_TOKENS) * 100
          const barColor = pct > 50 ? '#2E9E6B' : pct > 20 ? '#C9A227' : '#D9534F'
          return (
            <div key={c.name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ width: 80, fontWeight: 600, fontSize: 14, paddingTop: 4 }}>{c.name}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, height: 14, borderRadius: 7, background: '#eee', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, minWidth: 60 }}>{c.tokens}/{MAX_TOKENS} tkns</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {c.log.map((entry, j) => (
                    <span key={j} style={{
                      fontSize: 11, padding: '2px 7px', borderRadius: 4, fontFamily: 'IBM Plex Mono',
                      background: entry.status === 200 ? '#edfaf3' : '#fff0f0',
                      color: entry.status === 200 ? '#2E9E6B' : '#D9534F',
                      border: `1px solid ${entry.status === 200 ? '#2E9E6B' : '#D9534F'}`
                    }}>{entry.msg}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="act" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => sendOne(idx)}>Send 1</button>
                {idx === 0 && <button className="ghost act" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => burst(idx)}>Burst (8)</button>}
              </div>
            </div>
          )
        })}
      </div>
      <Good style={{ marginTop: 16 }}>Notice: when Client A hits its rate limit, Clients B–E are completely unaffected. Per-client isolation is the whole point.</Good>
    </div>
  )
}

/* ============================================================
   Quiz data
   ============================================================ */

const QUESTIONS = [
  {
    q: 'What is the primary job of an API Gateway?',
    o: [
      'Store data for microservices',
      'Handle cross-cutting concerns (auth, rate limiting, routing) at the edge',
      'Run business logic so services stay small',
      'Replace the database layer',
    ],
    a: 1,
    e: 'The gateway is the "front door" — it handles concerns every service would otherwise have to repeat: TLS termination, auth, rate limiting, routing, logging. Services then focus on business logic only.',
    w: {
      0: 'A gateway never stores business data — that would couple it to every service.',
      2: 'Business logic belongs inside the individual service, not the gateway. Putting it there creates a god-gateway.',
      3: 'Gateways proxy requests; they never replace storage layers.',
    },
    r: { id: 's1', label: 'Section 1 — the hotel concierge analogy' },
  },
  {
    q: 'After the API Gateway verifies a JWT, how does a downstream service know who the user is?',
    o: [
      'The service re-verifies the JWT itself using the same secret',
      'The gateway adds a trusted header like X-User-Id: 42 to the internal request',
      'The service queries the auth database directly',
      'The JWT is forwarded unchanged and the service parses it',
    ],
    a: 1,
    e: 'The gateway is the trust boundary. After verifying the JWT, it strips the original token and adds a plain trusted header (X-User-Id: 42). Downstream services trust this header because only the gateway (inside the network) can set it.',
    w: {
      0: 'Re-verifying in every service defeats the purpose of the gateway pattern — it spreads auth logic everywhere.',
      2: 'Direct DB queries from every service create tight coupling and are slow.',
      3: 'Forwarding the JWT unchanged means every service must know how to verify it — the same duplication problem.',
    },
    r: { id: 's3', label: 'Section 3 — JWT auth and downstream trust' },
  },
  {
    q: 'Which design pattern does the API Gateway filter pipeline (TLS → Auth → Rate Limit → Routing → …) implement?',
    o: [
      'Strategy',
      'Observer',
      'Chain of Responsibility',
      'Decorator',
    ],
    a: 2,
    e: 'Each filter is a handler in a Chain of Responsibility (Day 36). A request passes through the chain; any filter can short-circuit by returning a response (401, 429, 503) instead of calling next.',
    w: {
      0: 'Strategy selects one algorithm at a time — it does not pipe a request through multiple handlers in sequence.',
      1: 'Observer broadcasts an event to multiple listeners — there is no sequential pipeline or short-circuit.',
      3: 'Decorator wraps behavior by enhancing an object, not by deciding whether to pass a request forward.',
    },
    r: { id: 's6', label: 'Section 6 — routing and the filter chain (CoR)' },
  },
  {
    q: 'A client sends 8 rapid requests and its token bucket has capacity 5. What happens?',
    o: [
      'All 8 succeed because the gateway is lenient on bursts',
      'All 8 fail to protect the upstream',
      'The first 5 succeed and the next 3 get 429 Too Many Requests',
      'The gateway queues the extra 3 and processes them when tokens refill',
    ],
    a: 2,
    e: 'Token bucket: you have 5 tokens, each request costs 1 token. Requests 1–5 consume the bucket. Requests 6–8 find 0 tokens and receive 429. The gateway queues nothing — it rejects immediately.',
    w: {
      0: 'The gateway does not relax limits for bursts — that would let a misbehaving client starve others.',
      1: 'The first requests should succeed; only the excess is rejected.',
      3: 'API Gateways reject excess requests with 429; they do not silently queue them (that would hide backpressure from the client).',
    },
    r: { id: 's5', label: 'Section 5 — rate limiting with token bucket' },
  },
  {
    q: 'What is the key difference between an API Gateway and a load balancer?',
    o: [
      'A load balancer handles auth; a gateway handles traffic distribution',
      'A gateway operates at layer 7 and handles cross-cutting concerns; a load balancer distributes traffic across instances of the same service',
      'They are the same thing with different names',
      'A gateway only works with REST; a load balancer works with any protocol',
    ],
    a: 1,
    e: 'A load balancer distributes traffic across multiple instances of one service (layer 4 or 7). A gateway operates at layer 7 and routes to different services based on path, plus handles auth, rate limiting, etc. A gateway often includes a load balancer internally.',
    w: {
      0: 'It is the opposite — the gateway handles auth; the load balancer just picks an instance.',
      2: 'They serve very different purposes — a gateway is not just a renamed load balancer.',
      3: 'Both can work with any protocol. A gateway can translate protocols (REST to gRPC), but protocol restriction is not the defining difference.',
    },
    r: { id: 's9', label: 'Section 9 — Service Mesh and the gateway vs mesh distinction' },
  },
  {
    q: 'What traffic does a Service Mesh handle that an API Gateway does not?',
    o: [
      'Traffic from external clients (internet → cluster)',
      'Traffic between services inside the cluster (east-west)',
      'TLS termination for HTTPS',
      'JWT verification for all requests',
    ],
    a: 1,
    e: 'A gateway handles north-south traffic (external clients entering the cluster). A service mesh handles east-west traffic (service A calling service B inside the cluster) via sidecar proxies on every service instance.',
    w: {
      0: 'External client traffic is exactly what the API Gateway handles — this is north-south, not east-west.',
      2: 'TLS termination is a gateway responsibility, not a mesh-exclusive feature.',
      3: 'JWT verification is done at the gateway. The mesh typically uses mTLS (mutual TLS) for service-to-service authentication, not JWT.',
    },
    r: { id: 's9', label: 'Section 9 — Service Mesh: east-west vs north-south' },
  },
  {
    q: 'In path-prefix routing, a request to /api/users/42/orders would match which route?',
    o: [
      '/api/users/42 (exact path match)',
      '/api/users (prefix match — longest matching prefix wins)',
      '/api (shortest prefix always wins)',
      'The routing engine returns 404 because no route exactly matches',
    ],
    a: 1,
    e: 'Path-prefix routing uses the longest matching prefix. /api/users matches /api/users/42/orders more specifically than /api alone, so the request goes to user-service. Exact-path matching would reject it since the full path is not defined.',
    w: {
      0: '/api/users/42 is not a registered route in the table — only /api/users is. Prefix routing does not require exact full-path registration.',
      2: 'Shortest prefix wins is the wrong heuristic. We want the most specific (longest) prefix so different services can share a path root.',
      3: 'Path-prefix routing does not require an exact match. It only requires the request path to start with the registered prefix.',
    },
    r: { id: 's6', label: 'Section 6 — routing and path-prefix matching' },
  },
  {
    q: 'A sidecar proxy in a service mesh is injected next to every service instance. What does it enable?',
    o: [
      'The service code can now skip writing any business logic',
      'Automatic mTLS encryption, retries, circuit breaking, and distributed tracing for all service-to-service calls — without changing service code',
      'Services no longer need to connect to a database',
      'The gateway can be removed because the mesh replaces it',
    ],
    a: 1,
    e: 'The sidecar proxy (e.g. Envoy) intercepts all inbound and outbound network traffic. The mesh control plane configures it centrally. Services get mTLS, retries, circuit breakers, and trace headers injected without changing one line of service code.',
    w: {
      0: 'The sidecar handles networking concerns, not business logic. The service still implements all its domain behavior.',
      2: 'The sidecar handles service-to-service communication. Database connections are a separate concern inside the service.',
      3: 'The gateway and mesh serve different traffic layers. A mesh handles internal east-west calls; a gateway handles the external north-south entry point. Both are needed.',
    },
    r: { id: 's9', label: 'Section 9 — Service Mesh: sidecar proxy and mTLS' },
  },
]

/* ============================================================
   Page
   ============================================================ */

export default function Day92() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 92</div>
        <h1>API Gateway &amp; Service Mesh:<br />The Front Door to Your System</h1>
        <p>
          Every client request hits your system somewhere. That somewhere is the API Gateway —
          the single front door that handles auth, rate limiting, routing, and a dozen other
          concerns so individual services never have to. Click every demo below to see the gateway in action.
        </p>
        <div className="chips">
          {['API Gateway','JWT Auth','Rate Limiting','Routing','Filter Chain','Service Mesh','Sidecar Proxy','mTLS'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 — Hotel concierge analogy */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The hotel concierge — why you need a front door</h2>
        <p>
          Imagine a large hotel. Guests don't wander directly into kitchens, storerooms, or
          staff offices. Everyone arrives at <strong>one place</strong>: the front desk.
          The concierge checks credentials ("are you a guest?"), handles requests
          ("I need a taxi" → routes to taxi service, "I need room service" → routes to kitchen),
          and enforces rules ("non-guests cannot pass this point").
        </p>
        <p>
          The individual rooms (microservices) focus on one thing: delivering a great stay.
          They never worry about who is at the door. That is the concierge's job.
        </p>
        <p>
          An <strong>API Gateway</strong> is your digital concierge. Every client request —
          from a mobile app, web browser, or third-party API consumer — hits the gateway first.
          The gateway handles the "front desk" concerns. Individual services handle the "room" concerns.
        </p>
        <Note>
          Without a gateway, every service must implement auth, rate limiting, logging, and TLS
          termination itself. That is the same code copied 20 times. It breaks DRY, it creates
          20 places to update when a rule changes, and it is a security risk if one service forgets.
        </Note>
      </section>

      {/* S2 — Gateway responsibilities diagram */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>What the gateway actually does — 10 responsibilities</h2>
        <p>
          These are the cross-cutting concerns that every API gateway handles. You do not implement
          all of them on day one, but you need to know they all belong here, not inside individual services.
        </p>
        <Code html={`<span class="cm">┌─── Client (mobile app, browser, third-party) ───────────────────────┐</span>
<span class="cm">│                     HTTPS request                                   │</span>
<span class="cm">└──────────────────────────┬──────────────────────────────────────────┘</span>
                           │
                           ▼
<span class="cm">┌─── API Gateway ─────────────────────────────────────────────────────┐</span>
<span class="cm">│                                                                      │</span>
<span class="cm">│  1. TLS termination   HTTPS → plain HTTP inside the cluster          │</span>
<span class="cm">│  2. Authentication    Verify JWT signature + expiry                  │</span>
<span class="cm">│  3. Authorization     Does this role have access to this endpoint?   │</span>
<span class="cm">│  4. Rate limiting     Token bucket per API key (Day 65)              │</span>
<span class="cm">│  5. Request routing   /api/users → user-service:8080                │</span>
<span class="cm">│  6. Load balancing    Round-robin across healthy instances           │</span>
<span class="cm">│  7. Request logging   Correlation ID + full request/response log     │</span>
<span class="cm">│  8. Response caching  Cache static or slow-changing responses        │</span>
<span class="cm">│  9. Circuit breaker   If upstream is failing, return fallback fast   │</span>
<span class="cm">│ 10. Protocol translate REST ↔ gRPC, WebSocket upgrade, etc.          │</span>
<span class="cm">│                                                                      │</span>
<span class="cm">└──────┬───────────────────┬───────────────────────┬──────────────────┘</span>
       │                   │                       │
       ▼                   ▼                       ▼
<span class="cm">  User Service       Order Service          Payment Service</span>
<span class="cm">  (business logic)  (business logic)       (business logic)</span>`} />
        <Note>
          Real-world gateways: <strong>AWS API Gateway</strong>, <strong>Kong</strong>,
          <strong>Nginx</strong>, <strong>Envoy</strong>, <strong>Spring Cloud Gateway</strong>.
          You configure them with rules, not custom code, for most concerns. You write custom filters
          (plugins) only for your own business rules.
        </Note>
      </section>

      {/* S3 — Auth at the gateway */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Authentication at the gateway — JWT and the downstream trust header</h2>
        <p>
          The gateway is the <strong>trust boundary</strong>. It is the only place that talks
          directly to external clients. Everything inside the cluster trusts the gateway.
        </p>
        <p>
          A <strong>JWT (JSON Web Token)</strong> is a signed token the user gets when they log in.
          It contains: user ID, roles, expiry time. The signature proves it was issued by your auth server
          and has not been tampered with.
        </p>
        <Code html={`<span class="cm">// Filter: runs for every incoming request</span>
<span class="kw">class</span> AuthFilter <span class="kw">implements</span> GatewayFilter {
    JwtVerifier jwtVerifier;   <span class="cm">// knows the auth server's public key</span>

    FilterResult filter(Request req) {
        <span class="cm">// 1. Read the Authorization header</span>
        String header = req.header(<span class="str">"Authorization"</span>);
        <span class="kw">if</span> (header == <span class="kw">null</span> || !header.startsWith(<span class="str">"Bearer "</span>)) {
            <span class="kw">return</span> Response.unauthorized(<span class="str">"Missing token"</span>);
        }
        String token = header.substring(<span class="num">7</span>);  <span class="cm">// strip "Bearer " prefix</span>

        <span class="kw">try</span> {
            <span class="cm">// 2. Verify signature AND expiry — throws if invalid</span>
            Claims claims = jwtVerifier.verify(token);

            <span class="cm">// 3. Add trusted header so downstream services know WHO this is</span>
            <span class="cm">//    Downstream services trust X-User-Id because only the gateway</span>
            <span class="cm">//    (inside the network) can set it — external clients cannot fake it</span>
            req.addHeader(<span class="str">"X-User-Id"</span>,    claims.subject());   <span class="cm">// e.g. "42"</span>
            req.addHeader(<span class="str">"X-User-Role"</span>,  claims.role());      <span class="cm">// e.g. "ADMIN"</span>

            <span class="kw">return</span> FilterResult.CONTINUE;   <span class="cm">// pass to the next filter</span>
        } <span class="kw">catch</span> (JwtException e) {
            <span class="kw">return</span> Response.unauthorized(<span class="str">"Invalid or expired token"</span>);
        }
    }
}`} />
        <Good>
          Downstream services (UserService, OrderService) read <C>X-User-Id</C> from the
          request header. They never touch the JWT. If the header is present, they trust it —
          because only the gateway (inside the trusted internal network) can have set it.
        </Good>
        <Reveal summary="Bonus: what about API keys for machine-to-machine calls?">
          <p>
            Human users authenticate with JWT (short-lived, user-scoped). Machine clients
            (other services, partner APIs) authenticate with API keys (long-lived, revocable strings).
            The gateway checks API keys against a key store (Redis or DB). The pattern is identical:
            the gateway validates, adds an <C>X-Client-Id</C> header, and passes the request downstream.
          </p>
        </Reveal>
      </section>

      {/* S4 — Interactive: filter pipeline */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: gateway filter pipeline</h2>
        <p>
          Try all four scenarios. Notice how a failure at any stage short-circuits the chain —
          no filters after the failing one run at all. This is exactly the
          Chain of Responsibility pattern from Day 36.
        </p>
        <GatewayPipelineDemo />
      </section>

      {/* S5 — Rate limiting */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Rate limiting at the gateway — protecting your services</h2>
        <p>
          The gateway sees every request. It is the natural place to enforce per-client limits.
          We use a <strong>token bucket per API key</strong> (same algorithm as Day 65).
        </p>
        <Code html={`<span class="cm">// Filter runs after auth (we need the API key / user ID)</span>
<span class="kw">class</span> RateLimitFilter <span class="kw">implements</span> GatewayFilter {
    RateLimiter limiter;   <span class="cm">// one token bucket per client, backed by Redis</span>

    FilterResult filter(Request req) {
        <span class="cm">// Use API key or user ID as the bucket key</span>
        String clientId = req.header(<span class="str">"X-Api-Key"</span>);

        <span class="kw">if</span> (!limiter.allow(clientId)) {
            <span class="cm">// 429 = "Too Many Requests" — the correct HTTP status</span>
            <span class="kw">return</span> Response
                .status(<span class="num">429</span>)
                .header(<span class="str">"Retry-After"</span>, <span class="str">"15"</span>)           <span class="cm">// seconds to wait</span>
                .header(<span class="str">"X-RateLimit-Limit"</span>, <span class="str">"100"</span>)      <span class="cm">// max requests per window</span>
                .header(<span class="str">"X-RateLimit-Remaining"</span>, <span class="str">"0"</span>)  <span class="cm">// tokens left</span>
                .body(<span class="str">"Rate limit exceeded. Try again in 15 seconds."</span>);
        }
        <span class="kw">return</span> FilterResult.CONTINUE;
    }
}`} />
        <Warn>
          In a distributed system (multiple gateway instances), each instance has its own in-memory
          bucket. Client A can get 5 requests per gateway instance, effectively multiplying the limit
          by the number of instances. The fix is to store buckets in a shared store (Redis).
          Redis's Lua scripts make the check-and-decrement operation atomic.
        </Warn>
        <Reveal summary="Bonus: different limits for different tiers">
          <p>
            Most APIs offer rate limit tiers: free (100 req/min), pro (1000 req/min), enterprise (unlimited).
            The gateway reads the tier from the JWT claims or API key record and picks the correct
            bucket capacity at request time. You can also set per-endpoint limits separately from global limits.
          </p>
        </Reveal>
      </section>

      {/* S6 — Routing */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Routing — matching paths to upstream services</h2>
        <p>
          Routing is path-prefix matching. The gateway keeps a table: "any request starting
          with /api/users goes to user-service, /api/orders goes to order-service."
        </p>
        <Code html={`<span class="cm">// Simple path-prefix router</span>
<span class="kw">class</span> RoutingFilter <span class="kw">implements</span> GatewayFilter {
    <span class="cm">// Key = path prefix, Value = upstream base URL</span>
    Map&lt;String, String&gt; routes = Map.of(
        <span class="str">"/api/users"</span>,    <span class="str">"http://user-service:8080"</span>,
        <span class="str">"/api/orders"</span>,   <span class="str">"http://order-service:8080"</span>,
        <span class="str">"/api/payments"</span>, <span class="str">"http://payment-service:8080"</span>
    );

    FilterResult filter(Request req) {
        <span class="cm">// Find the longest matching prefix (most specific route wins)</span>
        String best = routes.keySet().stream()
            .filter(prefix -&gt; req.path().startsWith(prefix))
            .max(Comparator.comparingInt(String::length))   <span class="cm">// longest prefix</span>
            .orElse(<span class="kw">null</span>);

        <span class="kw">if</span> (best == <span class="kw">null</span>) <span class="kw">return</span> Response.notFound();

        req.setUpstream(routes.get(best));   <span class="cm">// tell the proxy filter where to forward</span>
        <span class="kw">return</span> FilterResult.CONTINUE;
    }
}`} />
        <p>
          The complete filter chain is a <strong>Chain of Responsibility</strong> (Day 36).
          Each concern is one filter. The filters are composed in a pipeline at startup.
          Order matters — auth must run before rate limiting (you need a client ID from auth
          to pick the right bucket).
        </p>
        <Code html={`<span class="cm">// Composition root: wire the pipeline once at startup</span>
<span class="kw">class</span> GatewayPipeline {
    List&lt;GatewayFilter&gt; filters = List.of(
        <span class="kw">new</span> TlsFilter(),           <span class="cm">// 1. decrypt HTTPS</span>
        <span class="kw">new</span> AuthFilter(),           <span class="cm">// 2. verify JWT, add X-User-Id</span>
        <span class="kw">new</span> RateLimitFilter(),      <span class="cm">// 3. check token bucket per client</span>
        <span class="kw">new</span> RoutingFilter(),        <span class="cm">// 4. match path → upstream URL</span>
        <span class="kw">new</span> LoadBalancerFilter(),   <span class="cm">// 5. pick healthy instance</span>
        <span class="kw">new</span> CircuitBreakerFilter(), <span class="cm">// 6. skip if upstream is failing</span>
        <span class="kw">new</span> ProxyFilter()           <span class="cm">// 7. forward request, relay response</span>
    );

    Response handle(Request req) {
        <span class="kw">for</span> (GatewayFilter f : filters) {
            FilterResult result = f.filter(req);
            <span class="kw">if</span> (result.isTerminate()) {
                <span class="kw">return</span> result.response();  <span class="cm">// short-circuit: 401/429/503 etc.</span>
            }
        }
        <span class="kw">return</span> proxyToUpstream(req);    <span class="cm">// all filters passed — proxy the request</span>
    }
}`} />
        <Note>
          Adding a new cross-cutting concern is one new filter class inserted in the right position.
          This is Open/Closed (Day 12): the pipeline is open for extension, closed for modification.
        </Note>
      </section>

      {/* S7 — Interactive: routing table */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>Play: routing table editor</h2>
        <p>
          Add routes, remove routes, and toggle the canary split on any route.
          Then type different request paths and see which upstream they match.
          Enable canary on a route and click Send ten times — about one in ten goes to v2.
        </p>
        <RoutingTableDemo />
        <Good>
          Canary deployments let you send 10% of real traffic to a new version (v2) while the
          rest stays on v1. If v2 has a bug, only 10% of users are affected. You gradually
          shift the split (10% → 50% → 100%) as confidence grows.
        </Good>
      </section>

      {/* S8 — Interactive: rate limiting */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>Play: per-client token bucket rate limiting</h2>
        <p>
          Click <strong>Burst (8)</strong> on Client A to send 8 rapid requests.
          Watch: 5 succeed (green 200), 3 get rejected (red 429). Click other clients —
          they are completely unaffected. Tokens refill automatically about once per second.
        </p>
        <RateLimitDemo />
      </section>

      {/* S9 — Service Mesh + cheat sheet */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Service Mesh — controlling traffic inside the cluster</h2>
        <p>
          An API Gateway handles <strong>north-south traffic</strong>: requests coming in from
          external clients, entering the cluster. But what about service-to-service calls inside
          the cluster? OrderService calling PaymentService, for example. That is <strong>east-west traffic</strong>.
        </p>
        <Code html={`<span class="cm">North-South (API Gateway handles this):</span>
<span class="cm">  Internet client  ──▶  API Gateway  ──▶  Services inside cluster</span>

<span class="cm">East-West (Service Mesh handles this):</span>
<span class="cm">  Order Service  ──▶  Payment Service  (both inside the cluster)</span>

<span class="cm">Service Mesh architecture (each service gets a sidecar proxy):</span>

<span class="cm">  ┌── Pod A ─────────────────┐    ┌── Pod B ─────────────────┐</span>
<span class="cm">  │  [Order Service]         │    │  [Payment Service]        │</span>
<span class="cm">  │  [Envoy Sidecar A] ──────┼────┼▶ [Envoy Sidecar B]        │</span>
<span class="cm">  └──────────────────────────┘    └──────────────────────────┘</span>
<span class="cm">           │                                   │</span>
<span class="cm">           └───────────── mTLS ────────────────┘</span>
<span class="cm">                (encrypted + mutually authenticated)</span>

<span class="cm">  Control plane (Istio / Linkerd) configures ALL sidecars centrally:</span>
<span class="cm">  - mTLS between every service pair (no code changes needed)</span>
<span class="cm">  - Retry + circuit breaker policies</span>
<span class="cm">  - Traffic splitting: 90% → v1, 10% → v2 (canary inside the mesh)</span>
<span class="cm">  - Distributed trace headers injected automatically</span>`} />
        <p>
          The sidecar proxy (e.g. <strong>Envoy</strong>) intercepts all network traffic
          for its service instance. The control plane pushes configuration to all sidecars.
          Your service code makes a plain HTTP call to "payment-service" — the sidecar handles
          mTLS, retries, tracing, and traffic splitting transparently.
        </p>
        <Good>
          Key insight: Gateway = external clients → cluster (north-south). Mesh = inside cluster,
          service to service (east-west). In practice you need both: the gateway for the front
          door, the mesh for internal call management.
        </Good>

        <h2 style={{ marginTop: 32 }}>Cheat sheet</h2>
        <table className="matrix" style={{ width: '100%' }}>
          <thead><tr><th>Concern</th><th>Where it lives</th><th>Why</th></tr></thead>
          <tbody>
            <tr><td>TLS termination</td><td className="yes">API Gateway</td><td>Decrypt once at the edge; internal traffic is plain HTTP on the private network</td></tr>
            <tr><td>JWT auth</td><td className="yes">API Gateway</td><td>Single trust boundary; downstream services get a trusted header, not a token to verify</td></tr>
            <tr><td>Rate limiting</td><td className="yes">API Gateway</td><td>Every external request passes here; easy to enforce per-client limits</td></tr>
            <tr><td>Path routing</td><td className="yes">API Gateway</td><td>Map URL prefixes to upstream services</td></tr>
            <tr><td>mTLS (service auth)</td><td className="yes">Service Mesh</td><td>Authenticates service-to-service calls; gateway doesn't see east-west traffic</td></tr>
            <tr><td>Internal retries</td><td className="yes">Service Mesh</td><td>Sidecar retries transparently without the calling service knowing</td></tr>
            <tr><td>Canary (internal)</td><td className="yes">Service Mesh</td><td>Split traffic between versions of a service inside the cluster</td></tr>
            <tr><td>Business logic</td><td className="yes">Individual service</td><td>Belongs only here; never in the gateway or mesh</td></tr>
          </tbody>
        </table>
      </section>

      {/* INTERVIEW CORNER */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>5 questions interviewers love to ask</h2>

        <Reveal summary="Q1: What does an API gateway do that individual services should not have to do themselves?">
          <p>
            Cross-cutting concerns: TLS termination, JWT authentication, rate limiting, request logging
            with correlation IDs, response caching, circuit breaking, and protocol translation. These
            concerns apply to every request regardless of which service handles it. If each service
            implements them independently you get duplication, inconsistency, and 20 places to update
            when a security rule changes. The gateway centralises them once.
          </p>
        </Reveal>

        <Reveal summary="Q2: Why verify the JWT at the gateway and not at each individual service?">
          <p>
            Because the gateway is the single trust boundary. Every external request passes through it.
            After the gateway verifies the JWT, it adds a trusted header (e.g. <C>X-User-Id: 42</C>)
            that downstream services read without re-verifying. If you verify in each service,
            every service needs the auth server's public key and JWT parsing logic — that spreads
            a security-critical concern across 20 services. A bug or misconfiguration in one service
            becomes a security hole. Centralising at the gateway makes the attack surface one place wide.
          </p>
        </Reveal>

        <Reveal summary="Q3: What is the difference between an API gateway and a load balancer?">
          <p>
            A load balancer distributes traffic across multiple instances of the <em>same</em> service
            (layer 4 or 7). It picks "which of the 5 user-service pods handles this request?"
            An API gateway routes to <em>different</em> services based on the request path (/api/users
            → user-service, /api/orders → order-service). It also handles auth, rate limiting, TLS, etc.
            A gateway typically includes a load balancer internally for each upstream. Think of it this way:
            the load balancer answers "which instance?" while the gateway answers "which service?" plus
            "is this caller allowed in?"
          </p>
        </Reveal>

        <Reveal summary="Q4: What is a service mesh and how does it differ from an API gateway?">
          <p>
            A gateway handles north-south traffic: requests coming in from external clients.
            A service mesh handles east-west traffic: service A calling service B inside the cluster.
            The mesh deploys a sidecar proxy (e.g. Envoy) next to every service instance. The mesh
            control plane (e.g. Istio) configures all sidecars centrally. Capabilities: mutual TLS
            between every service pair, automatic retries, circuit breakers, traffic splitting for
            canary deployments, and distributed trace header injection — all without changing service code.
            You need both: gateway for the front door, mesh for inside the house.
          </p>
        </Reveal>

        <Reveal summary="Q5: Which design pattern does the gateway filter pipeline implement, and why is order important?">
          <p>
            Chain of Responsibility (Day 36). Each filter is a handler. A request travels down the chain;
            any filter can terminate it early (returning 401, 429, 503) without running subsequent filters.
            Order matters because filters produce information that later filters consume. Auth must run
            before rate limiting because the rate limiter needs the client ID that auth extracts from the JWT.
            Routing must run before load balancing because the load balancer needs the upstream URL that
            routing sets. Circuit breaker must run just before the proxy so it can skip the upstream call
            and return a fallback without making a network request.
          </p>
        </Reveal>
        <Reveal summary="Q6: What is actually INSIDE the JWT the gateway keeps validating?">
          <p>
            Three base64url-encoded parts joined by dots: <strong>header.payload.signature</strong>. The
            header names the signing algorithm (<C>{'{'}"alg":"RS256"{'}'}</C>). The payload carries the
            claims — <C>sub</C> (user id), <C>exp</C> (expiry), <C>iss</C> (issuer), roles. The signature is
            the first two parts signed with the issuer's key. Two facts interviewers probe: ① the payload
            is <strong>encoded, not encrypted</strong> — anyone can base64-decode and read it, so never put
            secrets in a JWT; ② validation is pure math — signature check + expiry check — which is exactly
            why the gateway can do it with NO database call, and why stateless auth scales.
          </p>
        </Reveal>
        <Reveal summary="Q7: Sessions vs JWTs — and if JWTs can't be revoked, how does logout work?">
          <p>
            <strong>Session:</strong> server stores state, browser holds an opaque id; every request costs a
            session-store lookup, but revocation is instant (delete the row). <strong>JWT:</strong> server
            stores nothing, the token IS the state; validation is free, but you cannot un-sign a token —
            it stays valid until <C>exp</C>. The production compromise: a <strong>short-lived access
            token</strong> (5–15 min) plus a <strong>long-lived refresh token</strong> that IS stored
            server-side. "Logout" and "account compromised" revoke the refresh token; the stolen access
            token then dies within minutes on its own. Bonus point: a gateway-side denylist of revoked
            token ids (<C>jti</C> claim) in Redis covers the paranoid window — at the cost of reintroducing
            a lookup, which is the whole trade-off restated.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="quiz">
        <div className="sec-label">Section 10 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 92 complete?</strong> Homework: sketch a gateway filter chain for a fictional
        e-commerce API. List at least 6 filters in order, explain why each one is in that position,
        and describe what header or attribute each filter adds for the next one. For the rate limiter,
        describe how you would handle the distributed (multi-instance gateway) problem.
        <br /><br />
        Next: <strong>Day 93 — Observability: Logs, Metrics &amp; Distributed Traces</strong> —
        when a request spans 10 services and something is slow, how do you find which one?
        Structured logging, metrics (RED method), and distributed tracing with OpenTelemetry.
      </div>
    </div>
  )
}
