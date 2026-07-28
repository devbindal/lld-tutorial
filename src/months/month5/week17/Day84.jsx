import { useState, useEffect, useRef } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Circuit Breaker state machine live simulator
   ============================================================ */
const CB_THRESHOLD = 5          // failures before tripping
const CB_RESET_MS  = 8000       // reset timeout (8s, sped up for demo)
const CB_HALF_PROBES = 1        // probes allowed in HALF_OPEN

function CircuitBreakerDemo() {
  const [cbState, setCbState]         = useState('CLOSED')   // CLOSED | OPEN | HALF_OPEN
  const [failCount, setFailCount]     = useState(0)
  const [probeCount, setProbeCount]   = useState(0)
  const [countdown, setCountdown]     = useState(0)
  const [serviceDown, setServiceDown] = useState(false)
  const [log, setLog]                 = useState([])
  const [totalReqs, setTotalReqs]     = useState(0)
  const timerRef = useRef(null)
  const openTimeRef = useRef(null)

  // countdown ticker when OPEN
  useEffect(() => {
    if (cbState === 'OPEN') {
      openTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - openTimeRef.current
        const remaining = Math.max(0, Math.ceil((CB_RESET_MS - elapsed) / 1000))
        setCountdown(remaining)
        if (elapsed >= CB_RESET_MS) {
          clearInterval(timerRef.current)
          setCbState('HALF_OPEN')
          setProbeCount(0)
          setCountdown(0)
          addLog('⏱ Reset timeout elapsed → circuit is now HALF_OPEN (probe mode)', '#7c3aed')
        }
      }, 200)
      return () => clearInterval(timerRef.current)
    }
  }, [cbState])

  function addLog(msg, color) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLog(prev => [{ ts, msg, color }, ...prev].slice(0, 12))
  }

  function makeRequest() {
    setTotalReqs(t => t + 1)

    if (cbState === 'OPEN') {
      addLog('⚡ CIRCUIT OPEN — fast-fail, returning fallback (no network call made)', '#ef4444')
      return
    }

    // In HALF_OPEN, allow only CB_HALF_PROBES probe(s)
    if (cbState === 'HALF_OPEN' && probeCount >= CB_HALF_PROBES) {
      addLog('⚡ HALF_OPEN probe quota used — returning fallback', '#f97316')
      return
    }

    const callFails = serviceDown

    if (cbState === 'HALF_OPEN') {
      setProbeCount(p => p + 1)
      if (callFails) {
        addLog('🔴 Probe FAILED → circuit re-opens, timer resets', '#ef4444')
        setCbState('OPEN')
        setFailCount(0)
      } else {
        addLog('🟢 Probe SUCCEEDED → circuit CLOSED, service restored!', '#16a34a')
        setCbState('CLOSED')
        setFailCount(0)
        setProbeCount(0)
      }
      return
    }

    // CLOSED state
    if (callFails) {
      setFailCount(prev => {
        const next = prev + 1
        if (next >= CB_THRESHOLD) {
          addLog(`🔴 FAILURE #${next} — threshold reached → circuit OPENS (fast-fail for ${CB_RESET_MS / 1000}s)`, '#ef4444')
          setCbState('OPEN')
          return 0
        }
        addLog(`🔴 FAILURE #${next}/${CB_THRESHOLD} — counting failures`, '#f97316')
        return next
      })
    } else {
      setFailCount(0)
      addLog('🟢 SUCCESS — response returned, failure count reset', '#16a34a')
    }
  }

  function reset() {
    clearInterval(timerRef.current)
    setCbState('CLOSED')
    setFailCount(0)
    setProbeCount(0)
    setCountdown(0)
    setLog([])
    setTotalReqs(0)
    setServiceDown(false)
  }

  const stateColors = { CLOSED: '#16a34a', OPEN: '#ef4444', HALF_OPEN: '#d97706' }
  const stateDescs  = {
    CLOSED:    'All calls pass through. Counting failures.',
    OPEN:      countdown > 0 ? `Fast-failing all calls. Probe in ${countdown}s.` : 'Fast-failing. Transitioning…',
    HALF_OPEN: 'Allowing probe call. Waiting to see if service recovered.',
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · circuit breaker simulator — fail the service and watch CLOSED → OPEN → HALF_OPEN → CLOSED</div>

      {/* State indicator */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        {['CLOSED','OPEN','HALF_OPEN'].map(s => (
          <div key={s} style={{
            padding: '6px 14px', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 700,
            background: cbState === s ? stateColors[s] : '#F4F3EE',
            color: cbState === s ? '#fff' : '#999',
            border: `2px solid ${cbState === s ? stateColors[s] : '#ddd'}`,
            transition: 'all 0.3s',
          }}>{s}</div>
        ))}
        <span style={{ fontSize: 12.5, color: '#555', fontStyle: 'italic' }}>{stateDescs[cbState]}</span>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 16, fontFamily: 'IBM Plex Mono', fontSize: 11.5, marginBottom: 10, flexWrap: 'wrap' }}>
        <span>failures: <strong style={{ color: failCount > 0 ? '#ef4444' : '#16a34a' }}>{failCount}/{CB_THRESHOLD}</strong></span>
        <span>total requests: <strong>{totalReqs}</strong></span>
        {cbState === 'OPEN' && countdown > 0 && <span style={{ color: '#d97706' }}>reset in: <strong>{countdown}s</strong></span>}
        {cbState === 'HALF_OPEN' && <span style={{ color: '#7c3aed' }}>probes used: <strong>{probeCount}/{CB_HALF_PROBES}</strong></span>}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={makeRequest}>📨 Make Request</button>
        <button
          className={serviceDown ? 'act' : 'ghost act'}
          style={{ borderColor: serviceDown ? '#ef4444' : undefined, color: serviceDown ? '#ef4444' : undefined }}
          onClick={() => setServiceDown(d => !d)}
        >
          {serviceDown ? '🔴 Service DOWN (click to heal)' : '🟢 Service UP (click to kill)'}
        </button>
        <button className="ghost act" onClick={reset}>reset</button>
      </div>

      {/* Failure meter */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: '#7c8aa5', marginBottom: 3 }}>
          failure window ({CB_THRESHOLD} trips the breaker):
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {[...Array(CB_THRESHOLD)].map((_, i) => (
            <div key={i} style={{
              width: 28, height: 18, borderRadius: 4,
              background: i < failCount ? '#ef4444' : '#F4F3EE',
              border: '1.5px solid #ddd', transition: 'background 0.2s',
            }} />
          ))}
        </div>
      </div>

      {/* Log */}
      <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 12px', minHeight: 80, maxHeight: 200, overflowY: 'auto' }}>
        {log.length === 0
          ? <div style={{ color: '#475569', fontFamily: 'IBM Plex Mono', fontSize: 11.5 }}>Click "Make Request" to start…</div>
          : log.map((entry, i) => (
            <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, color: entry.color || '#94a3b8', marginBottom: 3 }}>
              <span style={{ color: '#475569', marginRight: 8 }}>{entry.ts}</span>{entry.msg}
            </div>
          ))
        }
      </div>
      <Good>
        <strong>What to try:</strong> (1) Click "Make Request" a few times while service is UP — green successes, CLOSED state. (2) Click "Service DOWN" then keep making requests — watch failure count fill up and the breaker OPEN. (3) Notice subsequent requests fast-fail immediately (no network call). (4) Wait for the countdown → HALF_OPEN. (5) Click "Service UP", then "Make Request" once — probe succeeds → CLOSED again.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 2 — Retry with exponential backoff + jitter visualizer
   ============================================================ */
function RetryDemo() {
  const [jitter, setJitter]       = useState(true)
  const [flaky, setFlaky]         = useState(true)     // ~70% fail rate
  const [running, setRunning]     = useState(false)
  const [attempts, setAttempts]   = useState([])       // { delay, result, label }
  const [multiMode, setMultiMode] = useState(false)    // single vs 10-client view
  const [clients, setClients]     = useState([])       // for multi-client view
  const seed = useRef(42)

  function pseudoRand() {
    seed.current = (seed.current * 1664525 + 1013904223) & 0xffffffff
    return (seed.current >>> 0) / 0xffffffff
  }

  function simulateSingle() {
    setRunning(true)
    setAttempts([])
    const maxRetries = 4
    const baseMs = 100
    let delay = 0
    const result = []
    let succeeded = false

    for (let i = 0; i < maxRetries; i++) {
      const fails = flaky ? pseudoRand() < 0.70 : false
      const waitMs = i === 0 ? 0 : baseMs * Math.pow(2, i - 1)
      const jitterMs = jitter && i > 0 ? Math.floor(pseudoRand() * waitMs * 0.5) : 0
      const totalWait = waitMs + jitterMs
      delay += totalWait

      result.push({
        attempt: i + 1,
        wait: totalWait,
        cumulativeMs: delay,
        success: !fails,
        label: i === 0 ? 'immediate' : `+${totalWait}ms (base ${waitMs}ms${jitter ? ` + jitter ${jitterMs}ms` : ''})`,
      })

      if (!fails) { succeeded = true; break }
    }

    setAttempts(result)
    setRunning(false)
    return succeeded
  }

  function simulateMulti() {
    setRunning(true)
    setClients([])
    const numClients = 10
    const maxRetries = 3
    const baseMs = 100
    const allClients = []

    for (let c = 0; c < numClients; c++) {
      const retryPoints = []
      let delay = 0
      for (let i = 1; i < maxRetries + 1; i++) {
        const waitMs = baseMs * Math.pow(2, i - 1)
        const jitterMs = jitter ? Math.floor(pseudoRand() * waitMs * 0.5) : 0
        delay += waitMs + jitterMs
        retryPoints.push(delay)
      }
      allClients.push({ id: c + 1, retryPoints })
    }

    setClients(allClients)
    setRunning(false)
  }

  // x-axis scale: 0 to ~800ms
  const TIMELINE_W = 420
  const MAX_MS = 800
  function xPos(ms) { return Math.min(TIMELINE_W - 4, (ms / MAX_MS) * TIMELINE_W) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · retry + exponential backoff — single-request trace AND thundering-herd visualizer</div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
        <div className="modbtns">
          <button className={!multiMode ? 'on' : ''} onClick={() => { setMultiMode(false); setAttempts([]); setClients([]) }}>Single request</button>
          <button className={multiMode ? 'on' : ''} onClick={() => { setMultiMode(true); setAttempts([]); setClients([]) }}>10 clients (herd)</button>
        </div>
        <button
          className={jitter ? 'act' : 'ghost act'}
          onClick={() => { setJitter(j => !j); setAttempts([]); setClients([]) }}
          style={{ fontSize: 12 }}
        >
          Jitter: {jitter ? 'ON' : 'OFF'}
        </button>
        {!multiMode && (
          <button
            className={flaky ? 'act' : 'ghost act'}
            style={{ fontSize: 12, borderColor: flaky ? '#f97316' : undefined, color: flaky ? '#f97316' : undefined }}
            onClick={() => { setFlaky(f => !f); setAttempts([]) }}
          >
            Service: {flaky ? '70% failure' : 'always OK'}
          </button>
        )}
      </div>

      {!multiMode ? (
        <>
          <button className="act" onClick={simulateSingle} disabled={running} style={{ marginBottom: 12 }}>
            ▶ Send Request
          </button>
          {attempts.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: '#7c8aa5', marginBottom: 6 }}>
                attempt timeline (ms from first call):
              </div>
              {attempts.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 60, fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', flexShrink: 0 }}>
                    attempt {a.attempt}
                  </div>
                  <div style={{ position: 'relative', width: TIMELINE_W, height: 22, background: '#F4F3EE', borderRadius: 4, flexShrink: 0 }}>
                    <div style={{
                      position: 'absolute', left: xPos(a.cumulativeMs) - 6, top: 3,
                      width: 16, height: 16, borderRadius: '50%',
                      background: a.success ? '#16a34a' : '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: '#fff', fontWeight: 700,
                    }}>{a.success ? '✓' : '✗'}</div>
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10.5, color: '#555', flexShrink: 0 }}>
                    {a.label}
                  </div>
                </div>
              ))}
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, marginTop: 6, color: attempts[attempts.length - 1]?.success ? '#16a34a' : '#ef4444' }}>
                {attempts[attempts.length - 1]?.success
                  ? `✅ Succeeded on attempt ${attempts.length} after ${attempts[attempts.length - 1].cumulativeMs}ms total wait`
                  : `❌ All ${attempts.length} attempts failed — throwing to caller`}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <button className="act" onClick={simulateMulti} disabled={running} style={{ marginBottom: 12 }}>
            ▶ Simulate 10 clients retrying
          </button>
          {clients.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: '#7c8aa5', marginBottom: 6 }}>
                retry points for 10 clients on the same timeline — {jitter ? 'WITH jitter (spread out)' : 'WITHOUT jitter (thundering herd!)'}:
              </div>
              {clients.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 44, fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#7c8aa5', flexShrink: 0 }}>
                    client {c.id}
                  </div>
                  <div style={{ position: 'relative', width: TIMELINE_W, height: 14, background: '#F4F3EE', borderRadius: 3, flexShrink: 0 }}>
                    {c.retryPoints.map((pt, j) => (
                      <div key={j} style={{
                        position: 'absolute', left: xPos(pt) - 3, top: 1,
                        width: 12, height: 12, borderRadius: '50%',
                        background: ['#3b82f6','#8b5cf6','#ec4899'][j],
                        fontSize: 7, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                      }}>{j + 1}</div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontFamily: 'IBM Plex Mono', fontSize: 10 }}>
                {['retry 1','retry 2','retry 3'].map((lbl, i) => (
                  <span key={i} style={{ color: ['#3b82f6','#8b5cf6','#ec4899'][i] }}>● {lbl}</span>
                ))}
                <span style={{ color: '#999' }}>timeline: 0 → {MAX_MS}ms</span>
              </div>
              {!jitter
                ? <Warn>Without jitter all 10 clients retry at the EXACT SAME millisecond (100ms, 200ms, 400ms…). The server sees 10 simultaneous spikes — the thundering herd. This often crashes the recovering service.</Warn>
                : <Good>With jitter each client picks a random offset inside each window. The retries spread out across the window — the server sees a gentle trickle instead of synchronized spike. This is why all real retry logic adds jitter.</Good>
              }
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ============================================================
   Demo 3 — Bulkhead isolation
   ============================================================ */
function BulkheadDemo() {
  const [mode, setMode]           = useState('bulkhead')   // 'bulkhead' | 'shared'
  const [payDelay, setPayDelay]   = useState(3)            // seconds
  const [running, setRunning]     = useState(false)
  const [results, setResults]     = useState(null)

  function simulate() {
    setRunning(true)
    setResults(null)

    // Pool config
    const payPool  = mode === 'bulkhead' ? 5  : 8           // threads for payment
    const searchPool = mode === 'bulkhead' ? 10 : 7         // threads for search (shared gives more to pay)
    const totalPool  = mode === 'shared'   ? 15 : null

    const PAY_REQS    = 5
    const SEARCH_REQS = 10
    const SEARCH_MS   = 200    // search is fast
    const PAY_MS      = payDelay * 1000

    // Payment: each thread takes payDelay seconds, we have payPool threads
    // All 5 payment reqs saturate if payPool <= 5
    const payBatches  = Math.ceil(PAY_REQS / payPool)
    const payTotalMs  = payBatches * PAY_MS

    // Without bulkhead: payment monopolizes most threads, search gets few
    // With bulkhead: search has its own pool, payment slowness doesn't touch it
    let searchThreadsAvail, searchBatches, searchTotalMs

    if (mode === 'shared') {
      // shared: 5 pay requests eat 5 threads (or all if pool <= 5)
      // remaining = totalPool - min(PAY_REQS, payPool) threads for search
      // But payment holds threads for payDelay seconds, so during that time search is starved
      const threadsLockedByPay = Math.min(PAY_REQS, totalPool)
      searchThreadsAvail = Math.max(1, totalPool - threadsLockedByPay)
      searchBatches = Math.ceil(SEARCH_REQS / searchThreadsAvail)
      // search must wait for payment threads to free up PLUS its own time
      searchTotalMs = (payDelay >= 1 ? PAY_MS * 0.8 : 0) + searchBatches * SEARCH_MS
    } else {
      searchThreadsAvail = searchPool
      searchBatches = Math.ceil(SEARCH_REQS / searchPool)
      searchTotalMs = searchBatches * SEARCH_MS     // totally independent of payment
    }

    // Simulate with a small delay for UX
    setTimeout(() => {
      setResults({
        mode,
        payTotalMs,
        searchTotalMs: Math.round(searchTotalMs),
        payPoolUsed: Math.min(PAY_REQS, payPool),
        searchPoolUsed: Math.min(SEARCH_REQS, searchThreadsAvail),
        searchThreadsAvail,
        payPool,
        searchPool,
        totalPool,
      })
      setRunning(false)
    }, 600)
  }

  const r = results

  return (
    <div className="panel">
      <div className="ptitle">Live demo · bulkhead isolation — payment slowness should NOT starve search threads</div>

      <div className="modbtns" style={{ marginBottom: 12 }}>
        <button className={mode === 'bulkhead' ? 'on' : ''} onClick={() => { setMode('bulkhead'); setResults(null) }}>With Bulkhead</button>
        <button className={mode === 'shared' ? 'on' : ''} onClick={() => { setMode('shared'); setResults(null) }}>No Bulkhead (shared pool)</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#555' }}>
          Payment call duration: <strong>{payDelay}s</strong> (simulating slowdown)
          <input type="range" min={1} max={10} value={payDelay}
            onChange={e => { setPayDelay(+e.target.value); setResults(null) }}
            style={{ marginLeft: 10, width: 140, verticalAlign: 'middle' }} />
        </label>
      </div>

      {/* Pool visualization */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        {mode === 'bulkhead' ? (
          <>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>
                Payment pool (5 threads)
              </div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{
                    width: 24, height: 24, borderRadius: 4, fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i < 5 ? '#fde68a' : '#F4F3EE', border: '1.5px solid #ddd',
                  }}>💳</div>
                ))}
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#d97706', marginTop: 3 }}>
                isolated — slowness stays here
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>
                Search pool (10 threads)
              </div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {[...Array(10)].map((_, i) => (
                  <div key={i} style={{
                    width: 24, height: 24, borderRadius: 4, fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#dcfce7', border: '1.5px solid #ddd',
                  }}>🔍</div>
                ))}
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#16a34a', marginTop: 3 }}>
                unaffected by payment pool
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>
              Shared pool (15 threads — payment and search compete)
            </div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {[...Array(15)].map((_, i) => (
                <div key={i} style={{
                  width: 24, height: 24, borderRadius: 4, fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < 5 ? '#fde68a' : '#dcfce7', border: '1.5px solid #ddd',
                }}>{ i < 5 ? '💳' : '🔍'}</div>
              ))}
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#ef4444', marginTop: 3 }}>
              💳 locked for {payDelay}s → search threads queued behind them
            </div>
          </div>
        )}
      </div>

      <button className="act" onClick={simulate} disabled={running} style={{ marginBottom: 12 }}>
        {running ? '⏳ Simulating…' : '▶ Send 15 requests (5 Payment + 10 Search)'}
      </button>

      {r && (
        <div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 10 }}>
            <div style={{ flex: 1, minWidth: 180, background: '#FFF9F0', border: '1.5px solid #f97316', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#d97706', marginBottom: 4 }}>Payment completion</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#c2410c' }}>{(r.payTotalMs / 1000).toFixed(1)}s</div>
              <div style={{ fontSize: 11, color: '#666', fontFamily: 'IBM Plex Mono' }}>
                {r.payPoolUsed} threads × {payDelay}s each
              </div>
            </div>
            <div style={{
              flex: 1, minWidth: 180,
              background: r.mode === 'bulkhead' ? '#F0FDF4' : '#FEF2F2',
              border: `1.5px solid ${r.mode === 'bulkhead' ? '#16a34a' : '#ef4444'}`,
              borderRadius: 8, padding: '10px 14px'
            }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: r.mode === 'bulkhead' ? '#16a34a' : '#dc2626', marginBottom: 4 }}>Search P50 latency</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: r.mode === 'bulkhead' ? '#15803d' : '#b91c1c' }}>
                {r.searchTotalMs}ms
              </div>
              <div style={{ fontSize: 11, color: '#666', fontFamily: 'IBM Plex Mono' }}>
                {r.searchThreadsAvail} threads available
                {r.mode === 'shared' && payDelay >= 2 ? ' (starved!)' : ''}
              </div>
            </div>
          </div>
          {r.mode === 'shared'
            ? <Warn><strong>No bulkhead:</strong> payment calls lock threads for {payDelay}s. Search gets only {r.searchThreadsAvail} of 15 threads — latency balloons to {r.searchTotalMs}ms. A payment outage cascades into search being slow or unavailable. This is cascading failure.</Warn>
            : <Good><strong>With bulkhead:</strong> payment pool is isolated — even if all 5 payment threads are locked for {payDelay}s, search has its own 10-thread pool and completes in just {r.searchTotalMs}ms. The flood in one compartment does not sink the ship.</Good>
          }
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Quiz data
   ============================================================ */
const QUESTIONS = [
  {
    q: 'A circuit breaker is in OPEN state. A request arrives. What happens?',
    o: [
      'The request is sent to the downstream service normally',
      'The request is fast-failed immediately — the circuit breaker returns a fallback without making any network call',
      'The circuit switches to HALF_OPEN immediately to probe',
      'The circuit waits until the request either succeeds or times out',
    ],
    a: 1,
    e: 'In OPEN state the whole point is to stop calling the failing service entirely. The circuit breaker returns a fallback (cached data, default value, or error) immediately — no network hop. This protects both the caller (no latency) and the downstream (no more load while it recovers).',
    w: {
      0: 'That is what CLOSED state does — OPEN state exists precisely to stop those calls.',
      2: 'The transition to HALF_OPEN happens only after the reset timeout elapses, not immediately.',
      3: 'Waiting still consumes a thread and adds latency; OPEN means instant rejection, not waiting.',
    },
    r: { id: 's4', label: 'Section 4 — Circuit Breaker states' },
  },
  {
    q: 'Why does Retry sit INSIDE the Circuit Breaker (not outside)?',
    o: [
      'Retry should be outside so it can bypass the circuit breaker when needed',
      'Because the circuit breaker adds latency that would interfere with retry timing',
      'Because retries should also count as failure attempts toward the circuit breaker threshold — if a call fails and retries also fail, those are real failures that should help trip the breaker',
      'It does not matter — the two patterns are independent',
    ],
    a: 2,
    e: 'If Retry were outside the Circuit Breaker, repeated retries would all be blocked by an open circuit (wasted calls). More importantly, we want each failed attempt — including retries — to count toward the failure threshold. Retry inside means: attempt → (retry on transient error) → if ultimately fails, CB counts it. CB outside means retry storms can open the breaker appropriately.',
    w: {
      0: 'Bypassing the circuit breaker would defeat its entire purpose of protecting the downstream.',
      1: 'Latency is not the reason — the semantics of what counts as a failure are.',
      3: 'The nesting order determines whether retries count as failures and whether retries even hit the network when the circuit is open.',
    },
    r: { id: 's10', label: 'Section 10 — Resilience stack' },
  },
  {
    q: 'What is the thundering herd problem in retries, and how does jitter fix it?',
    o: [
      'Jitter randomizes which service endpoint to retry against',
      'Without jitter, all clients retry at identical times (100ms, 200ms…) creating synchronized bursts that hammer the recovering service; jitter adds a random offset so retries spread across the window',
      'The recovering service gets too few requests — jitter increases the request rate',
      'Too many retries exhaust the retry budget — jitter adds more retries',
    ],
    a: 1,
    e: 'Exponential backoff without jitter is deterministic — 100 clients all wait exactly 100ms then all fire simultaneously. The recovering service sees a spike as large as the original failure. Jitter adds a random offset in each window (e.g. wait = base + rand(0, base/2)), spreading retries over time instead of synchronizing them.',
    w: {
      0: 'Jitter is about TIMING within a delay window, not endpoint selection.',
      2: 'The issue is TOO MANY requests at the same moment, not too few.',
      3: 'The problem is synchronization, not retry count. Jitter spreads timing, not adds retries.',
    },
    r: { id: 's3', label: 'Section 3 — Retry and jitter' },
  },
  {
    q: 'You must retry a failed HTTP POST /payments call. What critical check must you do first?',
    o: [
      'Check that the operation is idempotent — retrying a non-idempotent payment without an idempotency key will double-charge the customer',
      'Make sure the retry delay is exponential, not linear',
      'Verify the timeout value is correct',
      'Confirm the circuit breaker is in CLOSED state',
    ],
    a: 0,
    e: 'Retrying a non-idempotent operation is dangerous. A payment that succeeded but whose response was lost will be charged again on retry. The fix: include an idempotency key (a stable UUID per payment intent) in the request — the server deduplicates and returns the original result safely. Only retry when the operation is idempotent or made idempotent with a key.',
    w: {
      1: 'Delay strategy matters for timing but not for correctness of the operation itself.',
      2: 'Timeout matters, but the idempotency question is safety-critical and comes first.',
      3: 'Circuit breaker state affects whether the call goes through, but a closed circuit does not make a double-charge safe.',
    },
    r: { id: 's3', label: 'Section 3 — Retry and idempotency' },
  },
  {
    q: 'What is a bulkhead and which real-world analogy explains it?',
    o: [
      'A fast-fail mechanism named after circuit breakers in electrical panels',
      'A queue that leaks requests at a fixed rate to prevent burst traffic',
      'Isolated resource pools (e.g. separate thread pools per downstream service) named after ship compartments — flooding one compartment does not sink the whole ship',
      'A configuration layer that sets per-client rate limits',
    ],
    a: 2,
    e: 'Ship bulkheads are watertight compartments — if one floods the others stay dry. Software bulkheads isolate resource pools: payment service gets its own 5-thread pool, search gets its own 10-thread pool. A payment outage can saturate the payment pool but cannot starve search threads. Without bulkheads, one slow service can consume the entire shared thread pool, cascading failure to all other services.',
    w: {
      0: 'That describes the circuit breaker pattern. Bulkhead is about RESOURCE isolation, not fast-failing.',
      1: 'That describes the leaky bucket rate-limiting algorithm.',
      3: 'That describes a rate limiter with tiers, not a bulkhead.',
    },
    r: { id: 's8', label: 'Section 8 — Bulkhead' },
  },
  {
    q: 'What is the difference between a timeout and a circuit breaker?',
    o: [
      'A circuit breaker is faster than a timeout',
      'A timeout works across multiple calls; a circuit breaker works per call',
      'They are the same thing — a timeout trips the circuit breaker',
      'A timeout is a per-call deadline (give up on THIS call after N seconds); a circuit breaker tracks a PATTERN of failures across many calls and stops making calls entirely when failures exceed a threshold',
    ],
    a: 3,
    e: 'A timeout operates on a single call — if this call takes more than 5 seconds, abort. A circuit breaker watches many calls over time — if 5 of the last 10 calls failed, open the circuit and stop calling for 30 seconds. You need both: timeout per call (so threads are not blocked forever), circuit breaker across calls (so you stop hammering a service that is clearly down).',
    w: {
      0: 'Speed is not the distinction — scope (per-call vs across-calls) is.',
      1: 'This is the exact reversal of the truth.',
      2: 'A timeout can cause a failure that the circuit breaker counts, but they are distinct mechanisms.',
    },
    r: { id: 's2', label: 'Section 2 — Timeout' },
  },
  {
    q: 'In the correct resilience stack ordering (innermost to outermost), what is the order?',
    o: [
      'Timeout → Retry → Circuit Breaker → Bulkhead → Fallback (timeout innermost, fallback outermost)',
      'Fallback → Bulkhead → Circuit Breaker → Retry → Timeout',
      'Circuit Breaker → Retry → Timeout → Bulkhead → Fallback',
      'Retry → Timeout → Fallback → Circuit Breaker → Bulkhead',
    ],
    a: 0,
    e: 'Innermost executes first, outermost last. Timeout wraps the actual call (each attempt has its own deadline). Retry wraps Timeout (retry the timed call). Circuit Breaker wraps Retry (if retries keep failing, the CB counts those and may open). Bulkhead wraps CB (limits how many concurrent calls even reach the CB). Fallback wraps everything (if all else fails, return something). Order matters: Retry inside CB means retries count as failures toward the threshold.',
    w: {
      1: 'This is the outermost-to-innermost description — the execution order when a request arrives is the reverse of this list.',
      2: 'Circuit Breaker cannot wrap Timeout because the CB needs to count timed-out calls as failures — Timeout must be the innermost layer.',
      3: 'Retry must be inside Circuit Breaker, not outside, so that repeated retries count toward the failure threshold.',
    },
    r: { id: 's10', label: 'Section 10 — Resilience stack' },
  },
  {
    q: 'Why is HALF_OPEN state necessary? Why not just go directly from OPEN back to CLOSED after the timeout?',
    o: [
      'HALF_OPEN is just an implementation detail with no practical benefit',
      'To reset the failure counter before the full load returns',
      'To allow more than one probe call at a time',
      'Because the timeout only tells you the waiting period is over — not that the service recovered. HALF_OPEN sends one probe call to verify. If the probe fails the circuit re-opens; if it succeeds the circuit closes. Skipping HALF_OPEN would flood a still-broken service immediately after the timeout.',
    ],
    a: 3,
    e: 'The reset timeout says "enough time has passed that the service might be healthy." But "might" is not certainty. HALF_OPEN sends one (or a few) probe calls as a health check. A successful probe confirms recovery → CLOSED. A failed probe means the service is still down → OPEN again with a fresh timer. Without HALF_OPEN, after 30 seconds all backed-up traffic would hit the still-broken service simultaneously, causing a second outage.',
    w: {
      0: 'HALF_OPEN is the entire safety mechanism between "maybe recovered" and "confirmed recovered."',
      1: 'Resetting the failure counter is a side effect, not the reason HALF_OPEN exists.',
      2: 'Typically HALF_OPEN allows a very small number of probes (often 1), not more.',
    },
    r: { id: 's4', label: 'Section 4 — Circuit Breaker states' },
  },
]

/* ============================================================
   The page
   ============================================================ */
export default function Day84() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 84</div>
        <h1>Circuit Breaker &amp; Resilience:<br />Fail Safely, Recover Gracefully</h1>
        <p>Every system you design will eventually call a service that goes down. This day is about
           what happens THEN. Timeouts, retries, circuit breakers, bulkheads — the complete toolkit
           for services that degrade gracefully instead of cascading catastrophically. Click everything.</p>
        <div className="chips">
          {['Circuit Breaker','Timeout','Retry','Exponential Backoff','Bulkhead','Fallback','Resilience Stack'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* ── Section 1 ── Why services fail */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Why services fail — and why that is normal</h2>
        <p>Any service call you make can fail. Networks drop. Downstream services overload.
           Deployments introduce bugs. Database connections time out. In a system of N services,
           the probability of ALL of them being healthy at once is less than 100% to the power of N.</p>
        <Code html={`  THE RELIABILITY REALITY

  System with 3 downstream services, each 99.9% available:
  Combined availability = 0.999 × 0.999 × 0.999 = 99.7%
  → 0.3% downtime = ~26 minutes/month of cascading unavailability

  Without resilience patterns:
    Service A calls Service B (which is slow)
    → A's threads pile up waiting for B
    → A's thread pool exhausts
    → A becomes unavailable
    → Service C (which calls A) also fails
    → CASCADING FAILURE: B's problem kills C too

  With resilience patterns:
    Service B is slow → A's circuit breaker opens
    → A fast-fails and returns a fallback
    → A stays healthy, C stays healthy
    → B recovers, A's circuit closes → system heals`} />
        <p>The electrical circuit breaker is the perfect analogy. When a circuit in your home
           overloads, the breaker <em>trips</em> (opens) and stops current flow — preventing a fire.
           You do not immediately flip it back. You wait for the problem to cool down, then
           cautiously reset it. Software circuit breakers work exactly the same way.</p>
        <Note><strong>The core insight:</strong> a failing downstream is not the problem — the problem is
          <em> continuing to call a failing downstream</em>. Every call to a dead service is a wasted
          thread, wasted latency, and more load on an already-struggling system. Stop calling it.</Note>
      </section>

      {/* ── Section 2 ── Timeout */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Timeout — the first line of defense</h2>
        <p>The simplest resilience pattern. Never wait forever for a remote call. Every network
           call must have a deadline. Without a timeout, one slow service can make your threads
           hang indefinitely, draining the entire thread pool.</p>
        <Code html={`<span class="cm">// ❌ No timeout: thread blocks forever if payment service is dead</span>
<span class="kw">String</span> result = paymentService.charge(amount);  <span class="cm">// hangs indefinitely</span>

<span class="cm">// ✅ With timeout: fail fast after 5 seconds</span>
<span class="kw">try</span> {
    String result = CompletableFuture
        .supplyAsync(() -&gt; paymentService.charge(amount))
        .get(<span class="num">5</span>, TimeUnit.SECONDS);               <span class="cm">// throws TimeoutException after 5s</span>
} <span class="kw">catch</span> (TimeoutException e) {
    <span class="kw">return</span> fallback();                           <span class="cm">// return something useful instead</span>
}

<span class="cm">// Or with an executor that enforces its own timeout:</span>
executor.invokeAny(List.of(task), <span class="num">5</span>, TimeUnit.SECONDS);`} />
        <Code html={`  TIMEOUT RULE OF THUMB

  timeout = P99 latency of the healthy service × 3

  Example: healthy payment service P99 = 800ms
  → timeout = 2400ms (~2.4 seconds)

  Why × 3? Allows for some natural variance while still catching
  hangs and failures quickly. Infinity is never acceptable.

  Different timeouts for different calls:
  - Database query:       100ms–500ms
  - Internal microservice: 1s–3s
  - External payment API:  5s–10s
  - File upload:           30s–120s (size-dependent)`} />
        <Warn><strong>The "timeout is enough" trap.</strong> A timeout protects one call. But if the
          downstream is consistently failing, you will keep making calls, each timing out, each wasting
          a thread for the full timeout period. That is why you need a circuit breaker on top of timeouts
          — the circuit tracks the <em>pattern</em> of failures and stops making calls at all.</Warn>
      </section>

      {/* ── Section 3 ── Retry */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Retry with exponential backoff</h2>
        <p>Many failures are <em>transient</em> — brief network hiccups, a brief GC pause in the
           downstream, a momentary resource spike. These often succeed on the next attempt. Retry
           handles transient failures. But how you retry matters enormously.</p>
        <Code html={`<span class="cm">// ❌ Immediate retry: useless if the service is still starting or paused</span>
<span class="kw">for</span> (<span class="kw">int</span> i = <span class="num">0</span>; i &lt; <span class="num">3</span>; i++) result = paymentService.charge(amount); <span class="cm">// 3 calls in 1ms</span>

<span class="cm">// ✅ Exponential backoff with jitter</span>
<span class="kw">int</span> maxRetries = <span class="num">3</span>;
<span class="kw">long</span> baseDelayMs = <span class="num">100</span>;     <span class="cm">// start with 100ms</span>

<span class="kw">for</span> (<span class="kw">int</span> attempt = <span class="num">0</span>; attempt &lt; maxRetries; attempt++) {
    <span class="kw">try</span> {
        <span class="kw">return</span> paymentService.charge(amount);   <span class="cm">// try the call</span>
    } <span class="kw">catch</span> (TransientException e) {
        <span class="kw">if</span> (attempt == maxRetries - <span class="num">1</span>) <span class="kw">throw</span> e;      <span class="cm">// last attempt: give up</span>
        <span class="kw">long</span> delay = baseDelayMs * (<span class="num">1L</span> &lt;&lt; attempt);   <span class="cm">// 100ms, 200ms, 400ms…</span>
        <span class="kw">long</span> jitter = ThreadLocalRandom.current()
                          .nextLong(<span class="num">0</span>, delay / <span class="num">2</span>);         <span class="cm">// random offset (0..50ms, 0..100ms…)</span>
        Thread.sleep(delay + jitter);                    <span class="cm">// wait before next attempt</span>
    }
}`} />
        <Code html={`  EXPONENTIAL BACKOFF SCHEDULE (base 100ms, no jitter):
  Attempt 1:  immediate
  Attempt 2:  +100ms
  Attempt 3:  +200ms
  Attempt 4:  +400ms
  Total time: ~700ms before giving up

  WITH JITTER (each window gets a random offset):
  Attempt 2:  +100ms + rand(0,50ms)   = ~137ms
  Attempt 3:  +200ms + rand(0,100ms)  = ~261ms
  Attempt 4:  +400ms + rand(0,200ms)  = ~483ms
  → No two clients retry at exactly the same millisecond`} />
        <Warn><strong>NEVER retry non-idempotent operations without an idempotency key.</strong> If a
          payment call SUCCEEDS but the response is lost, retrying will double-charge the customer.
          Always include an idempotency key (a stable UUID per payment intent) so the server can detect
          and deduplicate repeated requests. <C>POST /payments?idempotencyKey=uuid-1234</C> — the server
          returns the original result if it already processed this key. See Day 52 (BookMyShow Part 2).</Warn>
        <Good><strong>What to retry:</strong> transient network errors, 429 (rate limited), 503 (service
          unavailable). What NOT to retry: 400 (bad request — retrying will always fail), 401/403 (auth
          failure — retrying just wastes calls), and non-idempotent writes without a key.</Good>
      </section>

      {/* ── Section 4 ── Circuit Breaker */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Circuit Breaker — the flagship pattern</h2>
        <p>The circuit breaker is the State pattern (Day 34) applied to resilience. It has three
           states. Each state controls how requests are handled — and each state has rules for
           transitioning to the next.</p>
        <Code html={`  CIRCUIT BREAKER STATE MACHINE

   ┌──────────────────────────────────────────────────────────────┐
   │                        CLOSED                                 │
   │         (normal operation — all calls pass through)           │
   │                                                               │
   │  On each call: attempt the real network call                  │
   │  On success:   reset failure count                            │
   │  On failure:   increment failure count                        │
   │  If failures &gt;= threshold (e.g. 5 in last 10 calls):         │
   │       ──────────────────────────────────────────▶  OPEN      │
   └──────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────┐
   │                          OPEN                                 │
   │         (fast-fail — no calls made to the service)            │
   │                                                               │
   │  On every call: IMMEDIATELY return fallback                   │
   │                 (no network call — protects the downstream)   │
   │  After resetTimeout (e.g. 30s) elapses:                       │
   │       ──────────────────────────────────────────▶ HALF_OPEN  │
   └──────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────┐
   │                       HALF_OPEN                               │
   │         (probe mode — allow a small number of calls)          │
   │                                                               │
   │  Allow 1 probe call through                                   │
   │  If probe SUCCEEDS:  ────────────────────────────▶  CLOSED   │
   │  If probe FAILS:     ────────────────────────────▶  OPEN     │
   │                      (resets the timer)                        │
   └──────────────────────────────────────────────────────────────┘`} />
        <Code html={`<span class="kw">class</span> CircuitBreaker {
    <span class="kw">enum</span> State { CLOSED, OPEN, HALF_OPEN }

    <span class="kw">private</span> State state = State.CLOSED;         <span class="cm">// starts closed (traffic flows)</span>
    <span class="kw">private int</span> failureCount = <span class="num">0</span>;               <span class="cm">// failures in the current window</span>
    <span class="kw">private final int</span> threshold = <span class="num">5</span>;            <span class="cm">// trip after 5 failures</span>
    <span class="kw">private long</span> lastOpenedAt = <span class="num">0</span>;             <span class="cm">// when did the circuit open?</span>
    <span class="kw">private final long</span> resetTimeoutMs = <span class="num">30_000</span>; <span class="cm">// wait 30s before probing</span>

    <span class="kw">synchronized</span> &lt;T&gt; T call(Supplier&lt;T&gt; fn, Supplier&lt;T&gt; fallback) {
        <span class="kw">if</span> (state == State.OPEN) {
            <span class="kw">long</span> elapsed = System.currentTimeMillis() - lastOpenedAt;
            <span class="kw">if</span> (elapsed &gt; resetTimeoutMs) {
                state = State.HALF_OPEN;           <span class="cm">// timeout elapsed: allow a probe</span>
            } <span class="kw">else</span> {
                <span class="kw">return</span> fallback.get();            <span class="cm">// still open: fast-fail</span>
            }
        }
        <span class="kw">try</span> {
            T result = fn.get();                   <span class="cm">// attempt the real call</span>
            onSuccess();
            <span class="kw">return</span> result;
        } <span class="kw">catch</span> (Exception e) {
            onFailure();
            <span class="kw">if</span> (state == State.OPEN) <span class="kw">return</span> fallback.get(); <span class="cm">// just tripped: fallback</span>
            <span class="kw">throw</span> e;                              <span class="cm">// CLOSED: let the exception propagate</span>
        }
    }

    <span class="kw">private void</span> onSuccess() {
        failureCount = <span class="num">0</span>;                        <span class="cm">// reset the failure window</span>
        state = State.CLOSED;                      <span class="cm">// probe succeeded → reclose</span>
    }

    <span class="kw">private void</span> onFailure() {
        failureCount++;
        <span class="kw">if</span> (failureCount &gt;= threshold || state == State.HALF_OPEN) {
            state = State.OPEN;                    <span class="cm">// threshold crossed → trip</span>
            lastOpenedAt = System.currentTimeMillis();
            failureCount = <span class="num">0</span>;                   <span class="cm">// reset for the next window</span>
        }
    }
}`} />
        <Note><strong>This is the State pattern (Day 34) directly:</strong> each state controls how the
          same method behaves, and states name their own successors. The circuit breaker transitions are
          guarded (threshold check, timeout check) — exactly the pattern from the vending machine and ATM
          days, now applied to infrastructure resilience.</Note>
        <Reveal summary="Why synchronized? Isn't that slow?">
          <p>The circuit breaker is shared mutable state (state, failureCount, lastOpenedAt) accessed by
             many concurrent request threads — exactly the Week 13 hazard. Without synchronization,
             two threads could both see <C>failureCount == 4</C> and both increment to 5, causing a
             double-trip. Or one thread transitions to HALF_OPEN while another resets the timer. The
             synchronized block makes state transitions atomic. In production libraries like Resilience4j,
             atomic references and lock-free techniques replace the coarse lock — but the invariant is the
             same: state transitions must be atomic.</p>
        </Reveal>
      </section>

      {/* ── Section 5 ── Interactive Demo 1 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>Play: circuit breaker state machine</h2>
        <p>This demo runs a live circuit breaker. The threshold is 5 failures, and the reset timeout
           is 8 seconds (sped up from the real 30s). Toggle the service down, fire requests, watch
           the breaker trip. Heal the service, wait for HALF_OPEN, then probe your way back to CLOSED.</p>
        <CircuitBreakerDemo />
      </section>

      {/* ── Section 6 ── Fallback */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Fallback — degrade gracefully, not catastrophically</h2>
        <p>When a call fails (or the circuit is open), you have options. The worst option is to
           crash or throw an unhandled exception. The best option is to return something useful
           — a <em>fallback</em>. There are three kinds:</p>
        <Code html={`  THREE FALLBACK STRATEGIES

  1. STALE DATA  — return the last cached result
     "Showing search results from 5 minutes ago (live results unavailable)"
     Use when: the data ages slowly and showing stale is better than nothing.
     Risk: stale data shown to users — must communicate clearly.

  2. DEFAULT / EMPTY — return a safe default
     "No recommendations available right now" → show popular items instead
     "Pricing service unavailable" → show base price without discounts
     Use when: partial function is better than total failure.

  3. DEGRADED MODE — skip non-critical features entirely
     Booking still works even if the email-notification service is down
     Checkout still works even if the recommendations panel fails
     Use when: the failing service is a non-critical enrichment, not core.`} />
        <Code html={`<span class="cm">// circuit breaker with a fallback supplier</span>
<span class="kw">class</span> ProductService {
    <span class="kw">private final</span> CircuitBreaker cb = <span class="kw">new</span> CircuitBreaker();
    <span class="kw">private</span> List&lt;Product&gt; cachedProducts = Collections.emptyList();  <span class="cm">// stale cache</span>

    List&lt;Product&gt; search(String query) {
        <span class="kw">return</span> cb.call(
            () -&gt; {
                List&lt;Product&gt; live = remoteSearch(query);   <span class="cm">// real call</span>
                cachedProducts = live;                       <span class="cm">// update cache on success</span>
                <span class="kw">return</span> live;
            },
            () -&gt; cachedProducts      <span class="cm">// fallback: stale results when circuit is open</span>
        );
    }
}`} />
        <Good><strong>Design principle:</strong> identify which services are in the critical path (without
          them you cannot complete the core action) vs which are enrichments (nice to have but optional).
          Enrichments should ALWAYS have a fallback. Critical-path services need circuit breakers AND
          fallbacks AND perhaps an entirely offline mode.</Good>
      </section>

      {/* ── Section 7 ── Interactive Demo 2 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>Play: retry backoff + thundering herd</h2>
        <p>Switch between single-request trace (watch delays grow exponentially) and 10-client view
           (toggle jitter off to see the thundering herd — all 10 clients retry at identical
           milliseconds — then turn jitter on to see them spread out).</p>
        <RetryDemo />
      </section>

      {/* ── Section 8 ── Bulkhead */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Bulkhead — isolate resource pools</h2>
        <p>A ship's hull is divided into watertight compartments called bulkheads. If one compartment
           floods, the others stay dry — the ship does not sink. In software, a bulkhead means giving
           each downstream service its own separate resource pool (thread pool, connection pool,
           semaphore). A failing service can only consume its own pool — not yours.</p>
        <Code html={`<span class="cm">// ❌ No bulkhead: one shared pool. Payment slowness starves search.</span>
ExecutorService shared = Executors.newFixedThreadPool(<span class="num">20</span>);
<span class="cm">// Payment calls slow to 10s → 20 threads locked → search queued → search times out</span>

<span class="cm">// ✅ Bulkheads: separate pools, separate failure domains</span>
ExecutorService paymentPool = Executors.newFixedThreadPool(<span class="num">5</span>);   <span class="cm">// max 5 threads for payments</span>
ExecutorService searchPool  = Executors.newFixedThreadPool(<span class="num">10</span>);  <span class="cm">// separate pool for search</span>
ExecutorService reviewPool  = Executors.newFixedThreadPool(<span class="num">3</span>);   <span class="cm">// separate pool for reviews</span>
<span class="cm">// Now: payment outage saturates paymentPool (5 threads), searchPool unaffected (10 free)</span>

<span class="cm">// Thread-pool bulkhead for a single call:</span>
<span class="kw">Future</span>&lt;Payment&gt; future = paymentPool.submit(() -&gt; paymentService.charge(amount));
<span class="kw">try</span> {
    <span class="kw">return</span> future.get(<span class="num">5</span>, TimeUnit.SECONDS);    <span class="cm">// timeout per call</span>
} <span class="kw">catch</span> (Exception e) {
    <span class="kw">return</span> fallback();                         <span class="cm">// pool exhausted or timed out</span>
}`} />
        <Code html={`  HOW CASCADING FAILURE HAPPENS (without bulkheads):

  Service B is slow (10s per call)
       │
       ▼
  Service A's 20 shared threads → all waiting on B (10s each)
       │
       ▼
  A's thread pool is FULL — new requests queue up
       │
       ▼
  Service C calls A → A's queue overflows → C gets errors
       │
       ▼
  B's problem has now killed A AND C. This is cascading failure.

  WITH BULKHEADS:
  Payment pool (5 threads) → all waiting on B (10s each) → saturated
  Search pool  (10 threads) → completely unaffected → normal latency
  B's problem is CONTAINED to the payment pool.`} />
        <Note><strong>Bulkhead sizing:</strong> the pool size is the maximum concurrent calls you want
          to allow to that service. If payment calls take 2 seconds each and you want to handle 10
          concurrent payments, size the pool at 10. A pool that is too small creates artificial queuing;
          too large defeats the bulkhead purpose. Start with: pool size = (target concurrency) ×
          (call timeout / average call duration), then tune with load testing.</Note>
      </section>

      {/* ── Section 9 ── Interactive Demo 3 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>Play: bulkhead isolation vs shared pool</h2>
        <p>Drag the payment call duration to simulate a slow payment service. Send 15 requests
           (5 Payment + 10 Search). Watch how a shared pool lets payment slowness bleed into
           search latency — and how bulkheads contain the damage.</p>
        <BulkheadDemo />
      </section>

      {/* ── Section 10 ── Resilience stack + Resilience4j */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>The resilience stack — combining all patterns</h2>
        <p>Each pattern solves a different problem. In production you combine them. The order matters.</p>
        <Code html={`  THE FULL RESILIENCE STACK (innermost executes first)

  ┌─ Fallback ──────────────────────────────────────────┐
  │  ┌─ Bulkhead ─────────────────────────────────────┐ │
  │  │  ┌─ Circuit Breaker ────────────────────────┐  │ │
  │  │  │  ┌─ Retry with backoff ───────────────┐  │  │ │
  │  │  │  │  ┌─ Timeout ──────────────────┐    │  │  │ │
  │  │  │  │  │   paymentService.charge()  │    │  │  │ │
  │  │  │  │  │   (the actual call)        │    │  │  │ │
  │  │  │  │  └────────────────────────────┘    │  │  │ │
  │  │  │  └───────────────────────────────────┘  │  │ │
  │  │  └─────────────────────────────────────────┘  │ │
  │  └────────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────┘

  Execution flow on a request:
  1. Bulkhead: is there a thread available in this pool?        → reject if full
  2. Circuit Breaker: is the circuit open?                       → fast-fail if open
  3. Retry: on failure, retry up to N times with backoff
  4. Timeout: each attempt has its own deadline                  → abort if exceeded
  5. Fallback: if ALL of the above fail, return something safe

  KEY RULE: Retry is INSIDE Circuit Breaker.
  Why: retries count as failure attempts toward the CB threshold.
  If you put Retry outside CB, all retries would be blocked by an open circuit.
  If you put CB outside Retry, repeated retries could trip the breaker (intended).`} />
        <Code html={`  RESILIENCE4J — the Java library that implements all of this

  @CircuitBreaker(name = <span class="str">"payment"</span>, fallbackMethod = <span class="str">"chargeDefault"</span>)
  @Retry(name = <span class="str">"payment"</span>)              <span class="cm">// configured: 3 attempts, exponential backoff</span>
  @TimeLimiter(name = <span class="str">"payment"</span>)         <span class="cm">// configured: 5s timeout per attempt</span>
  @Bulkhead(name = <span class="str">"payment"</span>)            <span class="cm">// configured: 5 concurrent calls max</span>
  <span class="kw">public</span> CompletableFuture&lt;Payment&gt; charge(Amount amount) {
      <span class="kw">return</span> CompletableFuture.supplyAsync(() -&gt; remotePayment.charge(amount));
  }

  <span class="cm">// fallback method signature must match</span>
  <span class="kw">public</span> CompletableFuture&lt;Payment&gt; chargeDefault(Amount amount, Throwable t) {
      <span class="kw">return</span> CompletableFuture.completedFuture(Payment.pending(amount)); <span class="cm">// queue for retry</span>
  }

  <span class="cm">// application.yml configuration (all the magic numbers in one place)</span>
  resilience4j:
    circuitbreaker:
      instances:
        payment:
          failureRateThreshold: <span class="num">50</span>          <span class="cm"># trip if 50% of last 10 calls fail</span>
          waitDurationInOpenState: <span class="num">30</span>s
          permittedNumberOfCallsInHalfOpenState: <span class="num">3</span>
    retry:
      instances:
        payment:
          maxAttempts: <span class="num">3</span>
          waitDuration: <span class="num">100</span>ms
          enableExponentialBackoff: <span class="kw">true</span>`} />

        <h3 style={{ marginTop: 20 }}>📋 Cheat sheet</h3>
        <ul>
          <li><strong>Timeout:</strong> per-call deadline. Every remote call must have one. Rule: P99 × 3. Never infinity.</li>
          <li><strong>Retry:</strong> for transient failures. Exponential backoff + jitter. Never retry non-idempotent calls without an idempotency key.</li>
          <li><strong>Circuit Breaker:</strong> tracks failure patterns across calls. CLOSED (pass through) → OPEN (fast-fail) → HALF_OPEN (probe) → CLOSED. This is the State pattern.</li>
          <li><strong>Fallback:</strong> when all else fails, return stale data, a default, or degraded mode. Never crash.</li>
          <li><strong>Bulkhead:</strong> separate thread pools per downstream. Failure in one pool cannot starve others. Named after ship compartments.</li>
          <li><strong>Resilience stack order (innermost to outermost):</strong> Timeout → Retry → Circuit Breaker → Bulkhead → Fallback.</li>
          <li><strong>Thundering herd:</strong> all clients retrying at the same millisecond. Jitter fixes this.</li>
          <li><strong>Resilience4j:</strong> Java library implementing all patterns as annotations backed by configuration.</li>
          <li><strong>Cascading failure:</strong> one slow service starves your thread pool → you fail → your callers fail. Bulkheads + circuit breakers contain it.</li>
        </ul>

        <table className="matrix">
          <thead>
            <tr><th>Pattern</th><th>Protects against</th><th>Mechanism</th><th>Key config</th></tr>
          </thead>
          <tbody>
            <tr><td>Timeout</td><td>Slow calls hanging threads forever</td><td>Deadline per call</td><td>P99 × 3</td></tr>
            <tr><td>Retry</td><td>Transient failures (network hiccups)</td><td>Re-attempt with growing delay + jitter</td><td>maxAttempts, baseDelay, jitter</td></tr>
            <tr><td>Circuit Breaker</td><td>Sustained downstream failure</td><td>Count failures → trip → probe</td><td>threshold, resetTimeout</td></tr>
            <tr><td>Fallback</td><td>Any failure reaching the caller</td><td>Return stale / default / degrade</td><td>fallback supplier</td></tr>
            <tr><td>Bulkhead</td><td>Resource starvation / cascading failure</td><td>Isolated thread pools per service</td><td>pool size per downstream</td></tr>
          </tbody>
        </table>
      </section>

      {/* ── Interview corner ── */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>The questions they actually ask</h2>
        <p>Answer each in your head before revealing.</p>

        <Reveal summary='Q: "Why does Retry go INSIDE the Circuit Breaker, not outside?"'>
          <p>Two reasons. First, retries should count toward the circuit breaker's failure threshold — if
             you retry 3 times and all fail, those are 3 genuine failures that should help trip the breaker.
             Putting Retry outside means each retry is blocked by an open circuit (wasted structure) OR the
             retries bypass the circuit's protection. Second, in HALF_OPEN state we only want one probe — if
             Retry is inside, a failed probe counts as one failure (which re-opens the circuit). If Retry
             were outside, a probe could retry 3 times, all landing in HALF_OPEN, masking the failure count.
             The rule: each resilience layer wraps the one inside it.</p>
        </Reveal>

        <Reveal summary='Q: "What is the thundering herd problem and how does jitter fix it?"'>
          <p>When a service fails and recovers, all clients that experienced the failure will retry. Without
             jitter, exponential backoff is deterministic: if 100 clients all use a 100ms base delay, they
             all retry at exactly t=100ms, then at t=200ms, then t=400ms. The recovering service sees
             synchronized spikes — exactly 100 requests at each retry interval. This often crashes the
             recovering service (a second outage from the retry storm). Jitter adds a random offset within
             each delay window. Instead of all retrying at 100ms, clients retry between 100ms and 150ms
             (if jitter = 50%). The spike becomes a gentle trickle spread over the window. Real
             implementations use "full jitter" (rand(0, delay)) or "equal jitter" (delay/2 + rand(0, delay/2))
             — both spread the load effectively.</p>
        </Reveal>

        <Reveal summary='Q: "When should you NOT retry a failed call?"'>
          <p>Never retry: (1) non-idempotent operations without an idempotency key — charging a payment
             twice or placing a duplicate order. (2) 4xx client errors — 400 Bad Request, 401 Unauthorized,
             403 Forbidden, 404 Not Found. These will not succeed on retry because the request itself is
             wrong. (3) When the circuit breaker is open — stop generating load on the struggling service.
             (4) When you are already in a retry loop called BY a retry loop — nested retries compound
             into exponential request counts (100 requests become 100 × 3 × 3 = 900). Only retry:
             transient errors (network timeouts, 429, 503) on idempotent operations or operations with
             idempotency keys.</p>
        </Reveal>

        <Reveal summary='Q: "What is HALF_OPEN and why not just go directly from OPEN to CLOSED?"'>
          <p>The reset timeout tells you "enough time has passed that the service might be healthy." It does
             not tell you it IS healthy. Going directly from OPEN to CLOSED would instantly route full traffic
             to a service that is still recovering — potentially triggering a second outage. HALF_OPEN is a
             cautious health check: allow one (or a few) probe calls through. If a probe succeeds, the service
             is healthy and we safely close the circuit. If a probe fails, the service is still broken — open
             the circuit again and reset the timer. HALF_OPEN trades a tiny amount of latency (one slow probe)
             for the guarantee that you only send full traffic to a verified-healthy service.</p>
        </Reveal>

        <Reveal summary='Q: "How does a bulkhead prevent cascading failure?"'>
          <p>Cascading failure happens when a slow downstream holds threads, exhausting the caller's thread
             pool, making the caller unable to serve any requests (including unrelated ones), which then fails
             its callers, and so on. A bulkhead prevents this by giving each downstream service its own
             isolated resource pool. Service B being slow can saturate its own dedicated pool (say, 5 threads)
             but cannot touch the pool used for Service C (10 threads). The failure domain is contained.
             Compare it to circuit breakers: a circuit breaker stops making new calls to a failing service;
             a bulkhead limits how many threads can be blocked by that service simultaneously. You need both:
             bulkheads contain the resource impact while the circuit breaker is deciding to trip.</p>
        </Reveal>

        <Reveal summary={`Q: "What is the difference between a timeout and a circuit breaker — aren't they the same thing?"`}>
          <p>They are complementary but different in scope. A timeout is per-call: "if THIS particular call
             takes more than 5 seconds, abort." A circuit breaker is across-calls over time: "if the pattern
             of calls to this service shows more than 50% failures in the last 10 calls, stop calling it
             entirely for 30 seconds." A timeout protects one thread from hanging forever. A circuit breaker
             protects your entire system from continuing to hammer a service that is clearly broken. They work
             together: a timed-out call counts as a failure toward the circuit breaker threshold. Timeout gives
             you per-call safety; circuit breaker gives you systemic resilience.</p>
        </Reveal>
      </section>

      {/* ── Quiz ── */}
      <section id="s11">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz — 8 questions</h2>
        <p>Click an answer. Explanations appear for every choice — read them even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* ── Footer ── */}
      <div className="footer">
        <strong>Day 84 complete?</strong> Homework: implement a <C>CircuitBreaker</C> class in Java with
        the three states (<C>CLOSED</C>, <C>OPEN</C>, <C>HALF_OPEN</C>), a configurable failure
        threshold (e.g. 5), and a configurable reset timeout (e.g. 30 seconds). Wrap a simulated
        payment service call with it (the simulated service fails deterministically for the first 5
        calls, then succeeds). Observe the breaker trip to OPEN, fast-fail subsequent calls, transition
        to HALF_OPEN after the timeout, and close on a successful probe. Then add a <C>Retry</C> wrapper
        inside the circuit breaker with exponential backoff and jitter. Stretch: add a bulkhead that
        limits the circuit breaker to 3 concurrent calls maximum (use a <C>Semaphore</C>).
        <br /><br />
        Next: <strong>Day 85 — CQRS &amp; Event Sourcing</strong>: separating read and write models
        for high-scale systems, event logs as the source of truth, and rebuilding state from events.
      </div>
    </div>
  )
}
