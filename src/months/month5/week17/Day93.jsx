import { useState, useEffect, useRef } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Metrics Dashboard (RED method)
   ============================================================ */

function MetricsDashboard() {
  const [spike, setSpike] = useState(false)
  const [errorMode, setErrorMode] = useState(false)
  const [slowDb, setSlowDb] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 800)
    return () => clearInterval(id)
  }, [])

  const baseRps = 120
  const rps = spike ? baseRps * 4 + Math.round(Math.sin(tick * 0.8) * 40) : baseRps + Math.round(Math.sin(tick * 0.5) * 8)
  const errorRate = errorMode ? 14 + Math.round(Math.sin(tick * 1.2) * 3) : 0.1 + Math.round(Math.random() * 0.1 * 10) / 10
  const p99 = slowDb ? 780 + Math.round(Math.sin(tick * 0.7) * 60) : 48 + Math.round(Math.sin(tick * 0.4) * 8)

  const errorAlert = errorRate > 5
  const latencyAlert = p99 > 500

  function Gauge({ label, value, unit, warn, max, color }) {
    const pct = Math.min(100, (value / max) * 100)
    const barColor = warn ? '#D9534F' : color
    return (
      <div style={{ flex: 1, minWidth: 180, padding: '14px 18px', borderRadius: 10, background: warn ? '#fff4f4' : '#f8f9ff', border: `2px solid ${warn ? '#D9534F' : '#dcd9cf'}`, transition: 'all 0.4s' }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'IBM Plex Mono', color: warn ? '#D9534F' : '#1B2A4A' }}>
          {typeof value === 'number' && value < 10 ? value.toFixed(1) : Math.round(value)}
          <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 4 }}>{unit}</span>
        </div>
        <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: '#e5e5e5', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.4s' }} />
        </div>
        {warn && <div style={{ fontSize: 11, color: '#D9534F', marginTop: 4, fontWeight: 600 }}>ALERT</div>}
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · RED method metrics dashboard</div>
      <p style={{ margin: '0 0 14px', fontSize: 14, color: '#555' }}>
        Toggle scenarios and watch the gauges update in real time. Alerts fire when error rate &gt; 5% or P99 &gt; 500ms.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button className={spike ? 'act' : 'ghost act'} onClick={() => setSpike(s => !s)}>
          {spike ? '📈 Traffic spike ON' : 'Traffic spike OFF'}
        </button>
        <button className={errorMode ? 'act' : 'ghost act'} style={errorMode ? { background: '#D9534F', borderColor: '#D9534F' } : {}} onClick={() => setErrorMode(e => !e)}>
          {errorMode ? '🔴 Errors ON (15%)' : 'Introduce errors'}
        </button>
        <button className={slowDb ? 'act' : 'ghost act'} style={slowDb ? { background: '#C9A227', borderColor: '#C9A227' } : {}} onClick={() => setSlowDb(d => !d)}>
          {slowDb ? '🐢 Slow DB ON' : 'Slow DB'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Gauge label="R — Rate (req/sec)" value={rps} unit="rps" warn={false} max={600} color="#2D5BFF" />
        <Gauge label="E — Error rate" value={errorRate} unit="%" warn={errorAlert} max={30} color="#2E9E6B" />
        <Gauge label="D — Duration P99" value={p99} unit="ms" warn={latencyAlert} max={1200} color="#2E9E6B" />
      </div>

      {(errorAlert || latencyAlert) && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fff0f0', border: '2px solid #D9534F', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div style={{ fontWeight: 700, color: '#D9534F', marginBottom: 2 }}>ALERT: SLO breach</div>
            <div style={{ fontSize: 13, color: '#555' }}>
              {errorAlert && <span>Error rate {errorRate.toFixed(1)}% exceeds 5% threshold. </span>}
              {latencyAlert && <span>P99 latency {Math.round(p99)}ms exceeds 500ms SLO.</span>}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#f5f5f5', fontSize: 13, fontFamily: 'IBM Plex Mono', color: '#555' }}>
        RED = <strong>R</strong>ate (requests/sec) · <strong>E</strong>rror rate (%) · <strong>D</strong>uration (P99 latency)
      </div>
    </div>
  )
}

/* ============================================================
   Demo 2 — Trace Waterfall Visualizer
   ============================================================ */

const BASE_SPANS = [
  { name: 'Gateway',        service: 'gateway',      start: 0,   baseDur: 250, color: '#2D5BFF', depth: 0 },
  { name: 'UserService',    service: 'user-svc',     start: 5,   baseDur: 42,  color: '#2E9E6B', depth: 1 },
  { name: 'OrderService',   service: 'order-svc',    start: 52,  baseDur: 148, color: '#C9A227', depth: 1 },
  { name: 'DB query',       service: 'postgres',     start: 57,  baseDur: 130, color: '#D97B29', depth: 2 },
  { name: 'PaymentService', service: 'payment-svc',  start: 205, baseDur: 42,  color: '#7B61FF', depth: 1 },
]

function TraceWaterfall() {
  const [slowDb, setSlowDb] = useState(false)
  const [showCritical, setShowCritical] = useState(false)

  const spans = BASE_SPANS.map((s, i) => {
    let dur = s.baseDur
    if (slowDb && s.service === 'postgres') dur = 300
    if (slowDb && s.service === 'order-svc') dur = s.baseDur + (300 - 130)
    if (slowDb && s.service === 'gateway') dur = s.baseDur + (300 - 130)
    return { ...s, dur }
  })

  const totalMs = spans[0].dur
  const SCALE = 380 / totalMs  // px per ms

  // Critical path: gateway -> order -> db (the slowest chain)
  const criticalIds = new Set([0, 2, 3])

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Distributed trace waterfall</div>
      <p style={{ margin: '0 0 14px', fontSize: 14, color: '#555' }}>
        Each horizontal bar is one <strong>span</strong> — one unit of work in one service.
        The width = duration. Bars are positioned on a shared timeline (total = {totalMs}ms).
        Toggle "Slow DB" to watch the bottleneck ripple up the trace.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={slowDb ? 'act' : 'ghost act'} onClick={() => setSlowDb(d => !d)}>
          {slowDb ? '🐢 DB is slow (300ms)' : 'Make DB slow'}
        </button>
        <button className={showCritical ? 'act' : 'ghost act'} onClick={() => setShowCritical(c => !c)}>
          {showCritical ? '🔴 Critical path ON' : 'Show critical path'}
        </button>
      </div>

      <div style={{ marginBottom: 8, fontSize: 12, color: '#888', fontFamily: 'IBM Plex Mono', paddingLeft: 130 }}>
        0ms {' '.repeat(10)} {Math.round(totalMs / 2)}ms {' '.repeat(10)} {totalMs}ms
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {spans.map((s, i) => {
          const left = s.start * SCALE
          const width = Math.max(s.dur * SCALE, 8)
          const isCritical = criticalIds.has(i)
          const opacity = showCritical ? (isCritical ? 1 : 0.3) : 1
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <div style={{ width: 130, paddingRight: 8, fontSize: 12, textAlign: 'right', fontFamily: 'IBM Plex Mono', color: '#555', paddingLeft: s.depth * 14 }}>
                {s.name}
              </div>
              <div style={{ flex: 1, position: 'relative', height: 28, background: '#f0f0f0', borderRadius: 4, overflow: 'visible' }}>
                <div style={{
                  position: 'absolute', left: left, width: width, height: '100%',
                  background: s.color, borderRadius: 4, opacity,
                  transition: 'all 0.5s', display: 'flex', alignItems: 'center', paddingLeft: 6,
                  boxShadow: showCritical && isCritical ? `0 0 0 2px #D9534F` : 'none'
                }}>
                  <span style={{ fontSize: 11, color: '#fff', fontFamily: 'IBM Plex Mono', whiteSpace: 'nowrap' }}>
                    {s.dur}ms
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: 13, color: '#555', padding: '10px 14px', background: '#f8f9ff', borderRadius: 8, fontFamily: 'IBM Plex Mono' }}>
        traceId: <strong>abc-123-xyz</strong> · Total: <strong>{totalMs}ms</strong>
        {slowDb && <span style={{ color: '#D97B29', marginLeft: 12 }}>⚠ DB query is the bottleneck ({spans[3].dur}ms of {totalMs}ms total)</span>}
      </div>
      <Good style={{ marginTop: 10 }}>
        Without traces, you would look at average latency for each service and guess.
        With traces, the slow DB span is immediately visible — you know exactly which
        service and which operation to fix.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 3 — Log Correlation
   ============================================================ */

const ALL_LOGS = [
  { ts: '14:32:01.001', svc: 'gateway',     tid: 'abc123', level: 'INFO',  msg: 'Received GET /api/orders/42 from client 10.0.0.5' },
  { ts: '14:32:01.003', svc: 'gateway',     tid: 'xyz789', level: 'INFO',  msg: 'Received GET /api/users/7 from client 10.0.0.9' },
  { ts: '14:32:01.008', svc: 'order-svc',   tid: 'abc123', level: 'INFO',  msg: 'Loading order id=42 for user id=8' },
  { ts: '14:32:01.010', svc: 'user-svc',    tid: 'xyz789', level: 'INFO',  msg: 'Loading profile for user id=7' },
  { ts: '14:32:01.058', svc: 'order-svc',   tid: 'abc123', level: 'INFO',  msg: 'Querying DB: SELECT * FROM orders WHERE id=42' },
  { ts: '14:32:01.059', svc: 'user-svc',    tid: 'xyz789', level: 'INFO',  msg: 'Cache hit for user id=7, returning cached profile' },
  { ts: '14:32:01.190', svc: 'order-svc',   tid: 'abc123', level: 'WARN',  msg: 'DB query took 132ms (threshold: 100ms)' },
  { ts: '14:32:01.192', svc: 'order-svc',   tid: 'abc123', level: 'INFO',  msg: 'Order loaded. Calling payment-svc to check hold status.' },
  { ts: '14:32:01.205', svc: 'payment-svc', tid: 'abc123', level: 'INFO',  msg: 'Checking hold for order id=42, user id=8' },
  { ts: '14:32:01.245', svc: 'payment-svc', tid: 'abc123', level: 'ERROR', msg: 'Hold expired for order id=42. Returning EXPIRED status.' },
  { ts: '14:32:01.247', svc: 'order-svc',   tid: 'abc123', level: 'ERROR', msg: 'Payment hold expired — returning 409 Conflict to client' },
  { ts: '14:32:01.249', svc: 'gateway',     tid: 'abc123', level: 'INFO',  msg: 'Response 409 to client 10.0.0.5 in 248ms' },
  { ts: '14:32:01.250', svc: 'gateway',     tid: 'xyz789', level: 'INFO',  msg: 'Response 200 to client 10.0.0.9 in 247ms' },
]

const LEVEL_COLORS = { INFO: '#2E9E6B', WARN: '#C9A227', ERROR: '#D9534F', DEBUG: '#7B61FF' }
const SVC_COLORS   = { gateway: '#2D5BFF', 'order-svc': '#C9A227', 'user-svc': '#2E9E6B', 'payment-svc': '#7B61FF' }

function LogCorrelation() {
  const [filter, setFilter] = useState('')

  const shown = filter.trim()
    ? ALL_LOGS.filter(l => l.tid === filter.trim())
    : ALL_LOGS

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Log correlation by traceId</div>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: '#555' }}>
        Below is the raw mixed log stream from 3 services. Type a <strong>traceId</strong> to
        filter and see only logs for that one request — across all services, in order.
        Try: <strong>abc123</strong> (the failing order) or <strong>xyz789</strong> (the succeeding user request).
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          className="txt"
          placeholder="Filter by traceId (e.g. abc123)"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ width: 280 }}
        />
        {filter && <button className="ghost act" onClick={() => setFilter('')}>Clear filter</button>}
      </div>

      {filter && (
        <div style={{ marginBottom: 10, padding: '8px 12px', background: '#e8f0ff', borderRadius: 6, fontSize: 13, fontFamily: 'IBM Plex Mono' }}>
          Showing {shown.length} log lines for traceId: <strong>{filter}</strong>
        </div>
      )}

      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {shown.map((l, i) => (
          <div key={i} style={{
            display: 'flex', gap: 8, padding: '5px 10px', borderRadius: 5, alignItems: 'flex-start',
            background: l.tid === 'abc123' && l.level === 'ERROR' ? '#fff4f4' : l.tid === 'abc123' && l.level === 'WARN' ? '#fffbe8' : '#f9f9f9',
            border: `1px solid ${l.level === 'ERROR' ? '#f5c6c6' : '#ebebeb'}`
          }}>
            <span style={{ color: '#999', minWidth: 88, flexShrink: 0 }}>{l.ts}</span>
            <span style={{ minWidth: 90, flexShrink: 0, padding: '1px 6px', borderRadius: 3, background: SVC_COLORS[l.svc] + '22', color: SVC_COLORS[l.svc], fontWeight: 600 }}>
              {l.svc}
            </span>
            <span style={{ minWidth: 44, flexShrink: 0, color: LEVEL_COLORS[l.level], fontWeight: 600 }}>{l.level}</span>
            <span style={{ color: '#333' }}>{l.msg}</span>
            {!filter && (
              <span style={{
                marginLeft: 'auto', padding: '1px 6px', borderRadius: 3, flexShrink: 0,
                background: '#f0f0f0', color: '#888', fontSize: 11
              }}>{l.tid}</span>
            )}
          </div>
        ))}
      </div>

      {shown.length === 0 && (
        <div style={{ padding: 16, color: '#999', textAlign: 'center' }}>No logs match traceId "{filter}"</div>
      )}
      <Good style={{ marginTop: 12 }}>
        Without a filter: a mix of two interleaved requests — impossible to read.
        With traceId "abc123": the exact story of what happened to that one failing order,
        spanning gateway, order-svc, and payment-svc, in chronological order.
      </Good>
    </div>
  )
}

/* ============================================================
   Quiz data
   ============================================================ */

const QUESTIONS = [
  {
    q: 'What are the three pillars of observability?',
    o: [
      'Logs, Metrics, and Alerts',
      'Logs, Metrics, and Traces',
      'Dashboards, Alerts, and Traces',
      'Latency, Errors, and Throughput',
    ],
    a: 1,
    e: 'The three pillars are logs (what happened, event-by-event), metrics (aggregate numbers over time like request rate and latency), and traces (the path and timing of one specific request across services). Alerts and dashboards are tools built on top of these three, not pillars themselves.',
    w: {
      0: 'Alerts are built on top of metrics — they are not a separate pillar of observability.',
      2: 'Dashboards visualize metrics and traces but are not a source of observability data themselves.',
      3: 'Latency, errors, and throughput (the RED method) are categories of metrics — they are one pillar (metrics), not three pillars.',
    },
    r: { id: 's2', label: 'Section 2 — the three pillars overview' },
  },
  {
    q: 'A request travels through 8 microservices and takes 3 seconds. You want to know WHICH service is slow. Which observability pillar answers this best?',
    o: [
      'CPU usage dashboards for each service',
      'Metrics (P99 latency per service)',
      'Structured logs from each service',
      'Distributed traces (a waterfall showing timing of each service call)',
    ],
    a: 3,
    e: 'A distributed trace shows the exact path a specific request took and how long each service call took. It is a waterfall: you can instantly see which span (service) was slow. Metrics show aggregate averages — they tell you a service is slow on average, not that your specific request was slow because of one DB query. Logs tell you what happened but not the relative timing across services.',
    w: {
      0: 'CPU dashboards show resource usage, not call durations between services. A service can be slow while CPU is normal (e.g. waiting on DB I/O).',
      1: 'Metrics give you aggregate P99 latency per service, which is useful for general trends, but they cannot tell you the breakdown for one specific slow request.',
      2: 'Logs from each service describe events but are not correlated into a single timeline with accurate relative timing. You would have to manually reconstruct the sequence.',
    },
    r: { id: 's6', label: 'Section 6 — distributed tracing and spans' },
  },
  {
    q: 'What is a correlation ID (traceId) and why does every log line need one?',
    o: [
      'A unique ID for each service instance in the cluster',
      'A database primary key for the log storage system',
      'A unique ID generated per request and included in every log line so you can filter all logs for one specific request across all services',
      'A cryptographic signature to verify log integrity',
    ],
    a: 2,
    e: 'A correlation ID (often called traceId) is generated at the gateway when a request arrives. It is passed to every downstream service (via headers). Every log line emitted anywhere in the system for that request includes this ID. When debugging, you filter logs by traceId to see the complete story of one request across all services.',
    w: {
      0: 'Service instance IDs are separate infrastructure concerns. A traceId belongs to a request, not a machine.',
      1: 'A traceId is a random string generated per request by the calling code. It has nothing to do with the log storage system\'s database keys.',
      3: 'Cryptographic signatures are for log integrity/tamper detection, which is a separate security concern unrelated to correlation.',
    },
    r: { id: 's3', label: 'Section 3 — structured logging and correlation IDs' },
  },
  {
    q: 'What is the RED method for monitoring a service?',
    o: [
      'Rate (requests/sec), Errors (error rate %), Duration (latency P99)',
      'Reliability, Efficiency, Durability',
      'Resources (CPU/memory), Events (log count), Dependencies (downstream calls)',
      'Read rate, Error count, Data volume',
    ],
    a: 0,
    e: 'RED stands for Rate (how many requests per second is the service handling), Errors (what percentage of those requests fail), and Duration (how long do they take — typically P99 latency). These three numbers together give you a quick health signal for any service.',
    w: {
      1: 'Reliability, Efficiency, Durability is not an observability method — it describes system qualities.',
      2: 'Resources, Events, and Dependencies describe a different framing. RED specifically measures the behavior of requests through a service, not resource consumption.',
      3: 'Read rate and data volume are not standard RED metrics. RED specifically covers traffic rate, error rate, and latency.',
    },
    r: { id: 's4', label: 'Section 4 — metrics and the RED method' },
  },
  {
    q: 'What is a histogram metric type, and why is P99 latency more useful than average latency?',
    o: [
      'A histogram counts unique values; average is always better because it uses all data points',
      'A histogram is only for integer values; average works for floating point too',
      'A histogram records the distribution of values (buckets); P99 shows the worst 1% of requests which is what users actually experience during slowdowns',
      'P99 and average are always the same value for latency data',
    ],
    a: 2,
    e: 'A histogram buckets values into ranges (e.g. 0–50ms, 50–100ms, etc.) and counts how many values fall in each bucket. This lets you compute percentiles. P99 (the 99th percentile) means 99% of requests finished faster than this number — it exposes the "tail" latency that 1% of users experience. Average hides outliers: if 99 requests take 10ms and 1 takes 9 seconds, the average is ~100ms which sounds fine, but one user waited 9 seconds.',
    w: {
      0: 'Averages hide outliers. A single very slow request raises the average slightly but P99 captures it exactly.',
      1: 'Histogram bucket boundaries can use any numeric type. The integer/float distinction is not relevant here.',
      3: 'P99 and average diverge significantly when latency has a long tail (a few very slow requests). This is extremely common in distributed systems.',
    },
    r: { id: 's4', label: 'Section 4 — metrics: Counter, Gauge, Histogram' },
  },
  {
    q: 'In a distributed trace, what is the relationship between traceId, spanId, and parentSpanId?',
    o: [
      'traceId is the same across all spans of one request; spanId is unique per unit of work; parentSpanId links a child span to the service that called it',
      'All three are random UUIDs with no relationship to each other',
      'traceId identifies one service, spanId identifies the request, parentSpanId is the database row ID',
      'traceId changes at each service boundary; spanId stays the same throughout the request',
    ],
    a: 0,
    e: 'A trace is a tree of spans. The traceId is shared by every span in the tree — it represents the entire end-to-end request. Each span (one unit of work in one service) has its own spanId. The parentSpanId links a child span to the span that caused it (the caller). Together they let you reconstruct the full call tree and waterfall timeline.',
    w: {
      1: 'They are not random with no relation. The structure (traceId shared, parentSpanId linking spans) is essential for reconstructing the call tree.',
      2: 'traceId identifies a request, not a service. Each service gets its own spanId inside that request\'s trace.',
      3: 'The traceId never changes — it stays the same from the first service to the last. That consistency is what makes the trace useful.',
    },
    r: { id: 's6', label: 'Section 6 — spans, traceId, spanId, parentSpanId' },
  },
  {
    q: 'What is OpenTelemetry and why does it matter?',
    o: [
      'A Java framework for building microservices',
      'A vendor-neutral SDK and specification for instrumenting code to emit logs, metrics, and traces — with pluggable exporters so you can switch backends without changing code',
      'A paid cloud service for storing logs and traces',
      'A specific database for storing time-series metrics',
    ],
    a: 1,
    e: 'OpenTelemetry (OTel) is the industry-standard open-source SDK. You instrument your code once with OTel. Then you plug in the exporter you want: Jaeger for traces, Prometheus for metrics, Loki for logs. If you switch from Jaeger to Zipkin, you change the exporter — not the instrumentation code. It solves vendor lock-in for observability.',
    w: {
      0: 'OpenTelemetry is an instrumentation library and protocol, not a microservice framework.',
      2: 'OpenTelemetry is open-source and vendor-neutral. It is not a paid service and does not store data itself.',
      3: 'OpenTelemetry is not a database. It is an SDK that collects telemetry and sends it to databases/backends of your choice.',
    },
    r: { id: 's8', label: 'Section 8 — OpenTelemetry: one SDK, pluggable backends' },
  },
  {
    q: 'You are debugging a customer complaint: "my order at 14:32 failed." What is the fastest path to root cause?',
    o: [
      'Look at average CPU usage for all services in a dashboard',
      'Restart all services and hope the problem does not recur',
      'Add more logging to every service and wait for the problem to happen again',
      'Find the traceId for that request from gateway logs, search all service logs by that traceId, then open the trace in Jaeger to see which span failed',
    ],
    a: 3,
    e: 'This is the observability workflow in practice. Step 1: find traceId from gateway logs (filter by timestamp 14:32 and that customer\'s user ID). Step 2: search all service logs with that traceId to read the narrative. Step 3: open the trace in Jaeger — the waterfall shows which service and which operation failed or was slow. You have your answer in minutes, not hours.',
    w: {
      0: 'Average CPU is an aggregate metric. It says nothing about one specific request from one customer at one specific time.',
      1: 'Restarting services destroys in-memory state and does not explain what caused the failure. The problem may recur.',
      2: 'Adding logging after the fact does not help with the current incident. Good observability means having the data already when you need it.',
    },
    r: { id: 's3', label: 'Section 3 — correlation IDs and the debugging workflow' },
  },
]

/* ============================================================
   Page
   ============================================================ */

export default function Day93() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 93</div>
        <h1>Observability:<br />Logs, Metrics &amp; Distributed Traces</h1>
        <p>
          When a request takes 3 seconds and your system has 10 microservices, which one is slow?
          Observability gives you the tools to answer questions like this from the outside —
          without restarting or adding print statements. Click every demo to feel the difference.
        </p>
        <div className="chips">
          {['Logs','Metrics','Traces','Correlation ID','RED Method','OpenTelemetry','Jaeger','Structured Logging'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 — Black box analogy */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The flight data recorder — why observability matters</h2>
        <p>
          When an airplane has a problem, investigators do not guess. They replay the exact
          sequence of events from the <strong>flight data recorder</strong> — the black box.
          It records everything: speed, altitude, control inputs, cockpit audio. Even for events
          that happened hours ago, the complete picture is there.
        </p>
        <p>
          In a distributed system, <strong>observability</strong> is your black box.
          It is the ability to understand what is happening inside your system by looking at
          the data it outputs to the outside — even if you were not watching at the time.
        </p>
        <p>
          Without observability, debugging a production problem looks like this:
          "Orders are failing. We have 12 microservices. Let me SSH into each one and read log files..."
          Hours later, you are still guessing.
        </p>
        <p>
          With good observability, it looks like this:
          "Order failed at 14:32. Let me find the traceId. Here are all logs for that request
          across all services. The payment-svc returned EXPIRED. The trace shows the DB query in
          order-svc took 132ms, which caused the hold to expire before payment was charged. Fixed."
        </p>
        <Note>
          Observability is not just for bugs. It is for understanding normal behavior too:
          what is the busiest time of day, which endpoints are slowest, which users are hitting errors.
          You cannot improve what you cannot measure.
        </Note>
      </section>

      {/* S2 — Three pillars overview */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The three pillars — logs, metrics, and traces</h2>
        <Code html={`<span class="cm">┌────────────────────────────────────────────────────────────────────────┐</span>
<span class="cm">│                    THREE PILLARS OF OBSERVABILITY                       │</span>
<span class="cm">├─────────────────┬──────────────────────┬───────────────────────────────┤</span>
<span class="cm">│   LOGS          │   METRICS            │   TRACES                       │</span>
<span class="cm">│   "What happened"│  "How much/fast"    │   "Which path, how long"       │</span>
<span class="cm">├─────────────────┼──────────────────────┼───────────────────────────────┤</span>
<span class="cm">│ Discrete events  │ Aggregate numbers    │ End-to-end request journey     │</span>
<span class="cm">│ per timestamp    │ over time            │ as a tree of timed spans       │</span>
<span class="cm">│                  │                      │                                 │</span>
<span class="cm">│ 14:32:01 INFO   │ 120 req/sec          │ Gateway 250ms                  │</span>
<span class="cm">│ Order 42 loaded  │ 0.1% error rate      │  └─ UserSvc 42ms               │</span>
<span class="cm">│                  │ P99 = 48ms           │  └─ OrderSvc 148ms             │</span>
<span class="cm">│ 14:32:01 ERROR  │                      │       └─ DB query 130ms ← SLOW │</span>
<span class="cm">│ Hold expired     │                      │  └─ PaymentSvc 42ms            │</span>
<span class="cm">├─────────────────┼──────────────────────┼───────────────────────────────┤</span>
<span class="cm">│ Best for:        │ Best for:            │ Best for:                      │</span>
<span class="cm">│ "What exactly    │ "Is the system       │ "Which service caused this     │</span>
<span class="cm">│  happened to     │  healthy right now?" │  specific request to be slow?" │</span>
<span class="cm">│  order 42?"      │ Alerting + SLOs      │ Root-cause in N-service calls  │</span>
<span class="cm">└─────────────────┴──────────────────────┴───────────────────────────────┘</span>`} />
        <p>
          You need all three. They answer different questions and you use them together.
          A metric alert fires: "P99 latency is 800ms." You open a trace to find which
          service is slow. You look at that service's logs to read the exact error message.
        </p>
        <Good>
          Metrics tell you <em>something is wrong</em>.
          Traces tell you <em>where the problem is</em>.
          Logs tell you <em>what exactly happened</em>.
        </Good>
      </section>

      {/* S3 — Structured logging */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Structured logging and correlation IDs</h2>
        <p>
          A plain text log message is hard to search. A structured log is a JSON object —
          machines can parse it, index it, and filter it by any field.
        </p>
        <Code html={`<span class="cm">// BAD: plain text — impossible to filter by orderId or parse duration</span>
log.error(<span class="str">"Payment failed for order 42 after 450ms"</span>);

<span class="cm">// GOOD: structured JSON — every field is queryable</span>
log.error(<span class="str">"Payment failed"</span>, Map.of(
    <span class="str">"orderId"</span>,     <span class="str">"42"</span>,
    <span class="str">"duration_ms"</span>, <span class="num">450</span>,
    <span class="str">"traceId"</span>,     MDC.get(<span class="str">"traceId"</span>),    <span class="cm">// MDC = Mapped Diagnostic Context (Day 49)</span>
    <span class="str">"service"</span>,     <span class="str">"payment-svc"</span>,
    <span class="str">"errorCode"</span>,   <span class="str">"INSUFFICIENT_FUNDS"</span>
));
<span class="cm">// Output: {"level":"ERROR","msg":"Payment failed","orderId":"42",</span>
<span class="cm">//          "duration_ms":450,"traceId":"abc123","service":"payment-svc",</span>
<span class="cm">//          "errorCode":"INSUFFICIENT_FUNDS","ts":"2026-06-24T14:32:01Z"}</span>`} />
        <p>
          The <strong>correlation ID</strong> (or traceId) is the key insight. It is a random
          unique string generated at the API Gateway when a request arrives. It is passed to
          every downstream service in an HTTP header (<C>traceparent</C> or <C>X-Trace-Id</C>).
          Every service includes it in every log line it writes.
        </p>
        <Code html={`<span class="cm">// At the API Gateway: generate a traceId for this request</span>
<span class="kw">String</span> traceId = UUID.randomUUID().toString();   <span class="cm">// e.g. "abc123-..."</span>

<span class="cm">// Store it in MDC — all log calls in this thread will include it automatically</span>
MDC.put(<span class="str">"traceId"</span>, traceId);

<span class="cm">// Forward to upstream services via header</span>
req.addHeader(<span class="str">"X-Trace-Id"</span>, traceId);

<span class="cm">// At each downstream service: read the traceId from the incoming request</span>
<span class="kw">String</span> traceId = req.header(<span class="str">"X-Trace-Id"</span>);
MDC.put(<span class="str">"traceId"</span>, traceId);   <span class="cm">// every log line will include this from now on</span>
<span class="cm">// ... handle the request ...</span>
MDC.clear();   <span class="cm">// clean up when the request is done (thread pool reuse!)</span>`} />
        <Warn>
          Always clear MDC at the end of a request (<C>MDC.clear()</C>). Thread pools reuse threads.
          If you forget to clear, the next request handled by the same thread inherits the previous
          request's traceId. Every log line for the new request will have the wrong traceId.
        </Warn>
        <Reveal summary="Bonus: what log levels mean in production">
          <p>
            DEBUG: very detailed, for development only (method entry/exit, variable values).
            Never enable in production — too much volume.
            INFO: normal events worth recording (request received, order created, user logged in).
            WARN: something unexpected but the system handled it (a retry succeeded, a cache miss).
            ERROR: something failed and needs human attention (payment failed, DB unreachable).
            In production: set the log level to INFO. You see WARN and ERROR automatically.
            Never log sensitive data (passwords, card numbers, full request bodies from financial APIs).
          </p>
        </Reveal>
      </section>

      {/* S4 — Metrics */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Metrics — measuring the health of your system over time</h2>
        <p>
          Metrics are <strong>aggregate numbers</strong> sampled over time. They are stored in a
          time-series database (Prometheus, InfluxDB). You can graph them, set alerts on them, and
          compute SLOs (Service Level Objectives) from them.
        </p>
        <p>Three metric types you need to know:</p>
        <Code html={`<span class="cm">// COUNTER: only ever increases. Total events since startup.</span>
<span class="cm">// Reset to 0 on restart. Good for: total requests, total errors.</span>
Counter requests = Counter.build()
    .name(<span class="str">"http_requests_total"</span>)
    .labelNames(<span class="str">"path"</span>, <span class="str">"status"</span>)   <span class="cm">// label = dimension for filtering</span>
    .register();

<span class="cm">// GAUGE: current value, can go up and down.</span>
<span class="cm">// Good for: active connections, queue depth, memory usage.</span>
Gauge queueSize = Gauge.build()
    .name(<span class="str">"message_queue_depth"</span>)
    .register();
queueSize.set(<span class="num">42</span>);   <span class="cm">// set to current value</span>
queueSize.inc();       <span class="cm">// or increment</span>
queueSize.dec();       <span class="cm">// or decrement</span>

<span class="cm">// HISTOGRAM: distribution of values. Lets you compute percentiles.</span>
<span class="cm">// Good for: request latency, response size.</span>
Histogram latency = Histogram.build()
    .name(<span class="str">"http_request_duration_seconds"</span>)
    .labelNames(<span class="str">"path"</span>)
    .buckets(<span class="num">0.01</span>, <span class="num">0.05</span>, <span class="num">0.1</span>, <span class="num">0.5</span>, <span class="num">1.0</span>, <span class="num">5.0</span>)   <span class="cm">// bucket edges in seconds</span>
    .register();

<span class="kw">void</span> handle(Request req) {
    Histogram.Timer timer = latency.labels(req.path()).startTimer();
    <span class="kw">try</span> {
        process(req);
        requests.labels(req.path(), <span class="str">"200"</span>).inc();   <span class="cm">// count a 200 success</span>
    } <span class="kw">catch</span> (Exception e) {
        requests.labels(req.path(), <span class="str">"500"</span>).inc();   <span class="cm">// count a 500 error</span>
    } <span class="kw">finally</span> {
        timer.observeDuration();   <span class="cm">// records latency regardless of success or failure</span>
    }
}`} />
        <p>
          The <strong>RED method</strong> distils all service metrics into three numbers you check first:
        </p>
        <table className="matrix" style={{ width: '100%' }}>
          <thead>
            <tr><th>Letter</th><th>Metric</th><th>Why it matters</th><th>Example alert</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontSize: 18, fontWeight: 700, color: '#2D5BFF' }}>R</td>
              <td>Rate — requests/sec</td>
              <td>Is the service receiving traffic? Sudden drop = upstream failure or deploy gone wrong</td>
              <td>Rate drops by 50% vs 5-min ago</td>
            </tr>
            <tr>
              <td style={{ fontSize: 18, fontWeight: 700, color: '#D9534F' }}>E</td>
              <td>Errors — % of requests that fail</td>
              <td>Are users getting errors? Even 1% error rate on 10k rps = 100 errors/sec</td>
              <td>Error rate &gt; 1% for 5 minutes</td>
            </tr>
            <tr>
              <td style={{ fontSize: 18, fontWeight: 700, color: '#C9A227' }}>D</td>
              <td>Duration — P99 latency</td>
              <td>Are requests slow? P99 captures the tail — the worst 1% that users notice</td>
              <td>P99 &gt; 500ms for 2 minutes</td>
            </tr>
          </tbody>
        </table>
        <Note>
          Use P99 (99th percentile), not average latency, for alerting. Average hides outliers.
          If 99 requests finish in 10ms and 1 request takes 9 seconds, the average is about 100ms —
          which sounds acceptable. P99 = 9 seconds — which reveals the real problem.
        </Note>
      </section>

      {/* S5 — Interactive: metrics dashboard */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>Play: RED method metrics dashboard</h2>
        <p>
          Toggle the scenarios to watch the RED gauges change in real time.
          Notice how alerts fire when a threshold is breached. This is exactly what
          an on-call engineer sees in Grafana / Datadog at 2 AM.
        </p>
        <MetricsDashboard />
      </section>

      {/* S6 — Distributed tracing */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Distributed tracing — following a request across services</h2>
        <p>
          A <strong>trace</strong> is the complete journey of one request across all services.
          It is a tree of <strong>spans</strong>. Each span = one unit of work in one service.
        </p>
        <Code html={`<span class="cm">A span has these fields:</span>
<span class="cm">  traceId       = "abc123"   ← same for every span in this request</span>
<span class="cm">  spanId        = "span-3"   ← unique for this one span</span>
<span class="cm">  parentSpanId  = "span-1"   ← the span that called me (null for root)</span>
<span class="cm">  startTime     = 14:32:01.055Z</span>
<span class="cm">  endTime       = 14:32:01.190Z</span>
<span class="cm">  duration_ms   = 135</span>
<span class="cm">  serviceName   = "order-svc"</span>
<span class="cm">  operationName = "loadOrder"</span>
<span class="cm">  tags          = { "orderId": "42", "status": "success" }</span>

<span class="cm">The full trace looks like a tree:</span>
<span class="cm">  Gateway        (span-1, 0–250ms)       — root span</span>
<span class="cm">    └─ UserSvc   (span-2, 5–47ms)        — child of span-1</span>
<span class="cm">    └─ OrderSvc  (span-3, 52–200ms)      — child of span-1</span>
<span class="cm">         └─ DB   (span-4, 57–192ms) ← SLOW  — child of span-3</span>
<span class="cm">    └─ PaymentSvc(span-5, 205–247ms)     — child of span-1</span>`} />
        <p>
          Spans are transmitted between services using the <strong>W3C Trace Context</strong> standard:
          a <C>traceparent</C> header in every HTTP call.
        </p>
        <Code html={`<span class="cm">// W3C traceparent header format:</span>
<span class="cm">// traceparent: 00-{traceId}-{parentSpanId}-01</span>
<span class="cm">// e.g.:  traceparent: 00-abc123xyz-span-1-01</span>

<span class="cm">// In your service (using a TracingFilter or interceptor):</span>
<span class="kw">class</span> TracingFilter {
    Tracer tracer;

    <span class="kw">void</span> doFilter(Request req, FilterChain chain) {
        <span class="cm">// 1. Extract the parent context from the incoming header</span>
        SpanContext parent = tracer.extract(req.headers());

        <span class="cm">// 2. Start a child span linked to the parent</span>
        Span span = tracer.buildSpan(<span class="str">"handleRequest"</span>)
            .asChildOf(parent)   <span class="cm">// set parentSpanId</span>
            .withTag(<span class="str">"service"</span>, <span class="str">"order-svc"</span>)
            .start();

        <span class="kw">try</span> {
            chain.doFilter(req);    <span class="cm">// handle the request (more spans may be created inside)</span>
        } <span class="kw">finally</span> {
            span.finish();          <span class="cm">// record end time, send to trace collector (Jaeger)</span>
        }
    }
}

<span class="cm">// When calling a downstream service, inject the current span context into the outgoing header:</span>
tracer.inject(span.context(), outgoingHeaders);
<span class="cm">// → sets traceparent: 00-abc123-current-spanId-01</span>
<span class="cm">// The downstream service reads this and creates a child span automatically</span>`} />
        <Note>
          In practice, you almost never write this boilerplate manually. OpenTelemetry auto-instrumentation
          intercepts popular HTTP client libraries (OkHttp, Apache HttpClient) and server frameworks
          (Spring Boot, Micronaut) and injects/extracts trace headers automatically.
          You add one agent JAR to your deployment and traces appear with zero code changes.
        </Note>
      </section>

      {/* S7 — Interactive: trace waterfall */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>Play: distributed trace waterfall</h2>
        <p>
          This is what Jaeger or Zipkin shows you. Each bar is one span.
          Toggle "Make DB slow" to watch the bottleneck ripple up the trace —
          OrderService waits for DB, Gateway waits for OrderService, total request time jumps.
          Toggle "Show critical path" to highlight the spans on the slowest route through the trace.
        </p>
        <TraceWaterfall />
      </section>

      {/* S8 — OpenTelemetry */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>OpenTelemetry — one SDK to rule all three pillars</h2>
        <p>
          Before OpenTelemetry, every observability tool had its own SDK. You wanted to switch
          from Jaeger to Zipkin? Rewrite all your tracing instrumentation. You wanted to add
          Prometheus metrics? Use a completely different API. Three pillars = three separate SDKs.
        </p>
        <p>
          <strong>OpenTelemetry (OTel)</strong> standardises all three pillars with one API.
          You instrument your code once. You plug in exporters for any backend you want.
        </p>
        <Code html={`<span class="cm">┌── Your Service Code ─────────────────────────────────────────────────┐</span>
<span class="cm">│                                                                        │</span>
<span class="cm">│   OpenTelemetry SDK (one dependency)                                   │</span>
<span class="cm">│   ┌──────────┐  ┌──────────┐  ┌──────────┐                           │</span>
<span class="cm">│   │  Traces  │  │ Metrics  │  │   Logs   │                           │</span>
<span class="cm">│   └────┬─────┘  └────┬─────┘  └────┬─────┘                           │</span>
<span class="cm">│        │              │              │                                  │</span>
<span class="cm">└────────┼──────────────┼──────────────┼──────────────────────────────────┘</span>
<span class="cm">         │              │              │</span>
<span class="cm">  OTLP Exporter  OTLP Exporter  OTLP Exporter   ← pluggable backends</span>
<span class="cm">         │              │              │</span>
<span class="cm">         ▼              ▼              ▼</span>
<span class="cm">     Jaeger/       Prometheus/      Loki/</span>
<span class="cm">     Zipkin        Datadog          Elastic</span>
<span class="cm">  (trace UI)    (metrics + alerts)  (log search)</span>

<span class="cm">Switch from Jaeger to Zipkin? Change the exporter, not your code.</span>
<span class="cm">Switch from Prometheus to Datadog? Change the exporter, not your code.</span>`} />
        <Code html={`<span class="cm">// OpenTelemetry Java example (manual span creation)</span>
<span class="kw">import</span> io.opentelemetry.api.GlobalOpenTelemetry;
<span class="kw">import</span> io.opentelemetry.api.trace.*;

Tracer tracer = GlobalOpenTelemetry.getTracer(<span class="str">"order-service"</span>);

<span class="kw">void</span> processOrder(String orderId) {
    <span class="cm">// Create a span for this operation</span>
    Span span = tracer.spanBuilder(<span class="str">"processOrder"</span>).startSpan();

    <span class="kw">try</span> (Scope scope = span.makeCurrent()) {   <span class="cm">// scopes the span to this thread</span>
        span.setAttribute(<span class="str">"orderId"</span>, orderId);

        loadOrder(orderId);         <span class="cm">// child spans created inside here appear automatically</span>
        chargePayment(orderId);     <span class="cm">// as children of this span</span>

        span.setStatus(StatusCode.OK);
    } <span class="kw">catch</span> (Exception e) {
        span.recordException(e);            <span class="cm">// attach the exception to the span</span>
        span.setStatus(StatusCode.ERROR);
        <span class="kw">throw</span> e;
    } <span class="kw">finally</span> {
        span.end();   <span class="cm">// always end the span — records duration and sends to collector</span>
    }
}`} />
        <Reveal summary="Bonus: auto-instrumentation — zero code change to get traces">
          <p>
            OpenTelemetry provides a Java agent JAR. You add it to your startup command:
            <C>java -javaagent:opentelemetry-javaagent.jar -jar myapp.jar</C>.
            The agent automatically instruments Spring Boot, gRPC, JDBC, OkHttp, Redis clients,
            and many more frameworks. You get traces, metrics, and logs from all of them
            without writing a single line of instrumentation code. This is how most teams start.
          </p>
        </Reveal>
      </section>

      {/* S9 — Interactive: log correlation */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>Play: log correlation by traceId</h2>
        <p>
          Below is the raw mixed log stream from 3 services. Without filtering it is a mess.
          Type <strong>abc123</strong> to isolate the failing order request, or <strong>xyz789</strong>
          to see the successful user profile request. Notice how the story becomes completely clear once filtered.
        </p>
        <LogCorrelation />
      </section>

      {/* S10 — Alerting, sampling, cheat sheet */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Alerting, sampling, and the full picture</h2>

        <h3 style={{ marginTop: 20 }}>Alerting — when to wake someone up</h3>
        <p>
          Alerts are built on top of metrics. A good alert fires when a user is actually affected.
          Bad alerts fire too often (alert fatigue) or not at all.
        </p>
        <table className="matrix" style={{ width: '100%', marginBottom: 16 }}>
          <thead><tr><th>Condition</th><th>Severity</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td>Error rate &gt; 5% for 5 min</td><td style={{ color: '#D9534F', fontWeight: 700 }}>P1 — page immediately</td><td>Users are getting errors right now</td></tr>
            <tr><td>P99 latency &gt; 500ms for 2 min</td><td style={{ color: '#D9534F', fontWeight: 700 }}>P1 — page immediately</td><td>Users experiencing slowness</td></tr>
            <tr><td>Error rate &gt; 1% for 15 min</td><td style={{ color: '#C9A227', fontWeight: 700 }}>P2 — urgent Slack</td><td>Elevated errors but not critical yet</td></tr>
            <tr><td>Disk usage &gt; 80%</td><td style={{ color: '#2E9E6B', fontWeight: 700 }}>P3 — ticket</td><td>Plan ahead before it fills</td></tr>
          </tbody>
        </table>

        <h3>Sampling — not every trace needs to be recorded</h3>
        <p>
          A busy service handles 10,000 requests/sec. Recording a trace for every request would
          generate terabytes of data per day and cost a fortune to store and query.
          <strong> Sampling</strong> = record only a fraction of traces.
        </p>
        <Code html={`<span class="cm">Head sampling: decide at the start of the request</span>
<span class="cm">  - Always sample: errors, slow requests (&gt;1s), specific users (debugging)</span>
<span class="cm">  - Sample 1% of normal requests randomly</span>
<span class="cm">  → Problem: you decided "don't sample" before you knew the request would be slow</span>

<span class="cm">Tail sampling: decide at the END of the request</span>
<span class="cm">  - Buffer all spans, decide after the trace is complete</span>
<span class="cm">  - Always keep: errors, slow traces, traces with specific tags</span>
<span class="cm">  - Drop: healthy fast traces (sample 1%)</span>
<span class="cm">  → Better quality: you always capture the interesting traces</span>
<span class="cm">  → More complex: need a collector that buffers full traces before deciding</span>`} />

        <h2 style={{ marginTop: 32 }}>Cheat sheet</h2>
        <table className="matrix" style={{ width: '100%' }}>
          <thead><tr><th>Concept</th><th>One sentence</th></tr></thead>
          <tbody>
            <tr><td>Logs</td><td>Discrete structured events per timestamp; use JSON so machines can query them</td></tr>
            <tr><td>Metrics</td><td>Aggregate numbers over time (counters, gauges, histograms); used for alerting and SLOs</td></tr>
            <tr><td>Traces</td><td>A tree of timed spans for one request across all services; reveals which service/operation is slow</td></tr>
            <tr><td>Correlation ID</td><td>Random string generated at the gateway, included in every log line, passed in every HTTP header to link all logs for one request</td></tr>
            <tr><td>Span</td><td>One unit of work (one service call, one DB query); has traceId + spanId + parentSpanId + start/end time</td></tr>
            <tr><td>RED method</td><td>Rate, Errors, Duration — the three metrics to check first for any service</td></tr>
            <tr><td>P99 latency</td><td>99% of requests are faster than this — use for alerts, not average (which hides outliers)</td></tr>
            <tr><td>OpenTelemetry</td><td>One SDK for all three pillars; pluggable exporters; switch backends without changing code</td></tr>
            <tr><td>MDC</td><td>Mapped Diagnostic Context — stores traceId per thread so every log line includes it automatically; clear it after each request</td></tr>
            <tr><td>Structured logging</td><td>Log as JSON with named fields (orderId, traceId, duration_ms) so you can filter and aggregate without regex</td></tr>
          </tbody>
        </table>
      </section>

      {/* INTERVIEW CORNER */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>5 questions interviewers love to ask</h2>

        <Reveal summary="Q1: What are the three pillars of observability and what does each tell you?">
          <p>
            <strong>Logs</strong> — what happened, event by event, with timestamps. Structured logs
            (JSON) are queryable by any field. Best for: "what exactly happened to order 42?"
          </p>
          <p>
            <strong>Metrics</strong> — aggregate numbers over time (request rate, error rate, latency percentiles).
            Stored in a time-series database. Best for: "is the system healthy right now?" and alerting.
          </p>
          <p>
            <strong>Traces</strong> — the path and timing of one specific request as it crosses service
            boundaries. A tree of spans. Best for: "which service caused this specific request to be slow?"
          </p>
          <p>
            They work together: a metric alert tells you something is wrong, a trace shows you where,
            the logs explain what happened.
          </p>
        </Reveal>

        <Reveal summary="Q2: What is a distributed trace and what problem does it solve that logs alone cannot?">
          <p>
            A distributed trace is a tree of timed spans representing one request's journey across all
            services. Each span records which service, which operation, and exactly how long it took.
            Spans are linked by traceId (shared) and parentSpanId (who called whom).
          </p>
          <p>
            The problem logs alone cannot solve: logs from Service A say "called Service B at 14:32:01.055"
            and logs from Service B say "returned at 14:32:01.190". You can compute 135ms manually,
            but across 8 services with hundreds of calls, this is impossible. A trace renders this as
            a waterfall instantly — you see which span is wide (slow) at a glance.
          </p>
        </Reveal>

        <Reveal summary="Q3: What is a correlation ID and how do you propagate it across services?">
          <p>
            A correlation ID (traceId) is a unique random string generated at the API Gateway when
            a request arrives. It is included in every log line from every service for that request.
          </p>
          <p>
            Propagation: the gateway generates it and stores it in MDC. When making a downstream HTTP
            call, the calling service adds it to the request header (e.g. <C>X-Trace-Id: abc123</C>
            or the W3C standard <C>traceparent</C> header). The receiving service reads the header and
            puts it in its own MDC. Every log call in any service for this request will automatically
            include the traceId. Without this, you cannot filter logs across services for one request.
          </p>
        </Reveal>

        <Reveal summary="Q4: What is the RED method for monitoring a service?">
          <p>
            RED stands for Rate, Errors, Duration. For any service, these are the first three
            numbers you check.
          </p>
          <p>
            <strong>Rate</strong>: how many requests per second is the service receiving?
            A sudden drop means upstream is broken or a deploy went wrong.
            <strong>Errors</strong>: what percentage of requests are failing?
            Even 1% on a high-traffic service means many users are getting errors.
            <strong>Duration</strong>: how long are requests taking? Use P99, not average,
            because average hides the worst-case that users actually experience.
          </p>
          <p>
            Check these three in order during an incident. They narrow down the problem fast.
          </p>
        </Reveal>

        <Reveal summary="Q5: What is OpenTelemetry and why does it matter?">
          <p>
            OpenTelemetry (OTel) is a vendor-neutral open-source SDK and protocol for instrumenting
            code to emit logs, metrics, and traces. Before OTel, every observability vendor (Jaeger,
            Datadog, Zipkin, Prometheus) had its own SDK. Switching vendors meant rewriting all
            your instrumentation.
          </p>
          <p>
            With OTel, you instrument your code once using the OTel API. You plug in exporter
            configurations to send data to whatever backend you want — Jaeger for traces, Prometheus
            for metrics, Loki for logs. Changing backends is a configuration change, not a code change.
          </p>
          <p>
            OTel also provides a Java agent that auto-instruments popular frameworks (Spring Boot, JDBC,
            gRPC, Redis clients) with zero code changes — you get traces and metrics out of the box
            by adding one agent JAR at startup.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="quiz">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 93 complete?</strong> Homework: pick any system you have designed in this course
        (BookMyShow, ATM, Cab Booking — anything from Month 3 onward). Add structured logging to it.
        Every log line must include: <C>traceId</C>, <C>serviceName</C>, <C>operationName</C>, and
        <C>duration_ms</C>. Then define the three RED metrics for one of its core services and write
        the alert thresholds you would set for a production deployment.
        <br /><br />
        Keep observing, keep improving.
      </div>
    </div>
  )
}
