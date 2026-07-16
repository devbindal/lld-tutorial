import { useState, useEffect, useRef } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ========================================================
   Demo 1 — Event Sourcing Time Travel
   ======================================================== */
const ORDER_EVENTS = [
  {
    name: 'OrderPlaced',
    fields: { orderId: '#42', items: '2x Widget', total: '$120.00' },
    state: { status: 'PLACED', trackingId: null, deliveredAt: null, amount: null },
  },
  {
    name: 'PaymentTaken',
    fields: { amount: '$120.00', method: 'card' },
    state: { status: 'PAID', trackingId: null, deliveredAt: null, amount: '$120.00' },
  },
  {
    name: 'ItemShipped',
    fields: { trackingId: 'ABC-123' },
    state: { status: 'SHIPPED', trackingId: 'ABC-123', deliveredAt: null, amount: '$120.00' },
  },
  {
    name: 'OrderDelivered',
    fields: { deliveredAt: '2024-01-15 14:30' },
    state: { status: 'DELIVERED', trackingId: 'ABC-123', deliveredAt: '2024-01-15 14:30', amount: '$120.00' },
  },
]

const PAYMENT_FAILED_EVENTS = [
  {
    name: 'OrderPlaced',
    fields: { orderId: '#42', items: '2x Widget', total: '$120.00' },
    state: { status: 'PLACED', trackingId: null, deliveredAt: null, amount: null },
  },
  {
    name: 'PaymentFailed',
    fields: { reason: 'Insufficient funds' },
    state: { status: 'PAYMENT_FAILED', trackingId: null, deliveredAt: null, amount: null },
  },
]

const STATUS_COLORS = {
  PLACED: '#2D5BFF',
  PAID: '#2E9E6B',
  SHIPPED: '#C9A227',
  DELIVERED: '#2E9E6B',
  PAYMENT_FAILED: '#D9534F',
}

function EventSourcingDemo() {
  const [cursor, setCursor] = useState(0)
  const [isReplaying, setIsReplaying] = useState(false)
  const [whatIf, setWhatIf] = useState(false)
  const replayRef = useRef(null)

  const events = whatIf ? PAYMENT_FAILED_EVENTS : ORDER_EVENTS
  const maxIdx = events.length - 1
  const currentState = events[Math.min(cursor, maxIdx)].state
  const statusColor = STATUS_COLORS[currentState.status] || '#7c8aa5'

  function replay() {
    setIsReplaying(true)
    setCursor(0)
    let i = 0
    function step() {
      i += 1
      if (i <= maxIdx) {
        setCursor(i)
        replayRef.current = setTimeout(step, 700)
      } else {
        setIsReplaying(false)
      }
    }
    replayRef.current = setTimeout(step, 700)
  }

  useEffect(() => {
    return () => { if (replayRef.current) clearTimeout(replayRef.current) }
  }, [])

  function toggleWhatIf() {
    if (replayRef.current) clearTimeout(replayRef.current)
    setIsReplaying(false)
    setCursor(0)
    setWhatIf(w => !w)
  }

  return (
    <div className="panel">
      <div className="ptitle">Event Sourcing · Time-travel demo — Order #42</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button
          className="act"
          onClick={replay}
          disabled={isReplaying}
        >
          {isReplaying ? 'Replaying…' : '▶ Replay All'}
        </button>
        <button
          className={whatIf ? 'act' : 'ghost act'}
          onClick={toggleWhatIf}
        >
          {whatIf ? '✕ Back to happy path' : '💥 What if payment failed?'}
        </button>
      </div>

      {/* Event log — append-only */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 6 }}>
          EVENT STORE — append-only log (order_events table)
        </div>
        {events.map((ev, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 10px',
              marginBottom: 4,
              borderRadius: 6,
              border: `2px solid ${i === cursor ? '#2D5BFF' : '#DCD9CF'}`,
              background: i <= cursor ? '#f0f4ff' : '#FAFAF7',
              opacity: i <= cursor ? 1 : 0.45,
              transition: 'all 0.3s',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: i <= cursor ? '#2D5BFF' : '#DCD9CF',
              color: '#fff', fontFamily: 'IBM Plex Mono', fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
              <b style={{ color: i <= cursor ? '#1B2A4A' : '#999' }}>{ev.name}</b>
              <span style={{ color: '#7c8aa5', marginLeft: 8 }}>
                {'{'}  {Object.entries(ev.fields).map(([k, v]) => `${k}: "${v}"`).join(', ')}  {'}'}
              </span>
            </div>
            {i === cursor && (
              <div style={{
                marginLeft: 'auto', fontSize: 10, color: '#2D5BFF',
                fontFamily: 'IBM Plex Mono', background: '#e8eeff',
                padding: '2px 7px', borderRadius: 4, flexShrink: 0,
              }}>
                ← current
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 14 }}>
        <input
          type="range"
          min={0}
          max={maxIdx}
          value={cursor}
          onChange={e => setCursor(Number(e.target.value))}
          disabled={isReplaying}
          style={{ width: '100%' }}
        />
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', textAlign: 'center' }}>
          ← drag to time-travel → (showing state after event {cursor + 1} of {events.length})
        </div>
      </div>

      {/* Reconstructed state */}
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 6 }}>
        RECONSTRUCTED ORDER STATE (replay events 1–{cursor + 1})
      </div>
      <div className="obj" style={{ maxWidth: 340 }}>
        <div className="oref">Order #42</div>
        <div className="ofield">
          status = <b style={{ color: statusColor }}>{currentState.status}</b>
        </div>
        <div className="ofield">
          amount = {currentState.amount ?? <span style={{ color: '#999' }}>null</span>}
        </div>
        <div className="ofield">
          trackingId = {currentState.trackingId ?? <span style={{ color: '#999' }}>null</span>}
        </div>
        <div className="ofield">
          deliveredAt = {currentState.deliveredAt ?? <span style={{ color: '#999' }}>null</span>}
        </div>
      </div>
      <Good>
        Notice: the event store never updates a row — it only appends. The current state is
        always computed by replaying events. At event 1, no payment or tracking exists yet.
        Drag the slider backward to "time-travel" to any past state.
      </Good>
    </div>
  )
}

/* ========================================================
   Demo 2 — CQRS Projection Builder
   ======================================================== */
const CQRS_EVENTS_SEQUENCE = [
  {
    name: 'OrderPlaced',
    description: 'Order #42 placed — 2x Widget @ $60 each',
    orderView: { id: '#42', status: 'PLACED', items: '2x Widget', total: '$120.00' },
    userStatsDelta: { orders: 1, spend: 120 },
    inventoryDelta: { stock: -2 },
  },
  {
    name: 'PaymentTaken',
    description: 'Payment of $120.00 collected',
    orderView: { id: '#42', status: 'PAID', items: '2x Widget', total: '$120.00' },
    userStatsDelta: { orders: 0, spend: 0 },
    inventoryDelta: { stock: 0 },
  },
  {
    name: 'ItemShipped',
    description: 'Package sent — tracking ABC-123',
    orderView: { id: '#42', status: 'SHIPPED', items: '2x Widget', total: '$120.00', tracking: 'ABC-123' },
    userStatsDelta: { orders: 0, spend: 0 },
    inventoryDelta: { stock: 0 },
  },
]

function CQRSDemo() {
  const [eventsPublished, setEventsPublished] = useState(0)
  const [orderView, setOrderView] = useState(null)
  const [userStats, setUserStats] = useState({ orders: 0, spend: 0 })
  const [inventory, setInventory] = useState({ stock: 10 })
  const [lastQuery, setLastQuery] = useState(null)
  const [firing, setFiring] = useState(null)

  function publishNext() {
    const idx = eventsPublished
    if (idx >= CQRS_EVENTS_SEQUENCE.length) return
    const ev = CQRS_EVENTS_SEQUENCE[idx]
    setFiring(ev.name)
    setTimeout(() => {
      setOrderView(ev.orderView)
      setUserStats(s => ({ orders: s.orders + ev.userStatsDelta.orders, spend: s.spend + ev.userStatsDelta.spend }))
      setInventory(s => ({ stock: s.stock + ev.inventoryDelta.stock }))
      setEventsPublished(n => n + 1)
      setFiring(null)
    }, 500)
  }

  function reset() {
    setEventsPublished(0)
    setOrderView(null)
    setUserStats({ orders: 0, spend: 0 })
    setInventory({ stock: 10 })
    setLastQuery(null)
    setFiring(null)
  }

  function queryOrder() {
    if (!orderView) { setLastQuery('No data yet — publish events first!'); return }
    setLastQuery(`READ from order_view WHERE id='#42' → ${JSON.stringify(orderView)}`)
  }

  const nextEvent = CQRS_EVENTS_SEQUENCE[eventsPublished]

  return (
    <div className="panel">
      <div className="ptitle">CQRS · Command side publishes events → consumers update their own read models</div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>

        {/* Left: command side */}
        <div style={{ flex: '0 0 220px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 8 }}>
            COMMAND SIDE (Event Store)
          </div>
          <div className="class-card" style={{ marginBottom: 10 }}>
            <div className="cname">Event Store</div>
            {CQRS_EVENTS_SEQUENCE.map((ev, i) => (
              <div key={i} style={{
                fontFamily: 'IBM Plex Mono', fontSize: 11,
                color: i < eventsPublished ? '#2E9E6B' : '#bbb',
                marginBottom: 2,
              }}>
                {i < eventsPublished ? '✓' : '○'} {ev.name}
              </div>
            ))}
          </div>
          <button
            className="act"
            style={{ width: '100%', marginBottom: 6 }}
            onClick={publishNext}
            disabled={eventsPublished >= CQRS_EVENTS_SEQUENCE.length || firing !== null}
          >
            {firing
              ? `Publishing ${firing}…`
              : nextEvent
              ? `Publish: ${nextEvent.name}`
              : '✓ All events published'}
          </button>
          <button className="ghost act" style={{ width: '100%', marginBottom: 10 }} onClick={reset}>Reset</button>

          <button className="act" style={{ width: '100%', background: '#2E9E6B', border: 'none' }} onClick={queryOrder}>
            Query Order #42
          </button>
          {lastQuery && (
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 10, marginTop: 8,
              padding: 8, background: '#f0fff4', border: '1px solid #2E9E6B',
              borderRadius: 6, wordBreak: 'break-all', color: '#1B2A4A',
            }}>
              {lastQuery}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#7c8aa5', marginTop: 6 }}>
            ↑ Reads from OrderView — NOT the event store directly
          </div>
        </div>

        {/* Right: consumers */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 8 }}>
            QUERY SIDE (read-model consumers — each updates independently)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* OrderView */}
            <div style={{
              border: '2px solid #2D5BFF', borderRadius: 8, padding: 10,
              background: '#f8f9ff',
            }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#2D5BFF', marginBottom: 6 }}>
                OrderView Consumer → PostgreSQL (orders_view table)
              </div>
              {orderView ? (
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
                  {Object.entries(orderView).map(([k, v]) => (
                    <div key={k} className="ofield" style={{ margin: '2px 0' }}>
                      {k}: <b>{v}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#bbb', fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
                  (empty — no events yet)
                </div>
              )}
            </div>

            {/* UserStats */}
            <div style={{
              border: '2px solid #C9A227', borderRadius: 8, padding: 10,
              background: '#fffdf0',
            }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#C9A227', marginBottom: 6 }}>
                UserStats Consumer → Redis (user:alice:stats)
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
                <div className="ofield">total_orders: <b>{userStats.orders}</b></div>
                <div className="ofield">total_spend: <b>${userStats.spend}.00</b></div>
              </div>
            </div>

            {/* Inventory */}
            <div style={{
              border: '2px solid #2E9E6B', borderRadius: 8, padding: 10,
              background: '#f0fff6',
            }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#2E9E6B', marginBottom: 6 }}>
                Inventory Consumer → MySQL (product_stock table)
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
                <div className="ofield">widget_stock: <b>{inventory.stock}</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ========================================================
   Demo 3 — Saga with Compensating Transactions
   ======================================================== */
const SAGA_STEPS_HAPPY = [
  { name: 'Reserve Inventory', service: 'InventoryService', compensate: 'Release Inventory' },
  { name: 'Charge Payment', service: 'PaymentService', compensate: 'Refund Payment' },
  { name: 'Confirm Order', service: 'OrderService', compensate: null },
]

const STATUS_STYLE = {
  PENDING:      { bg: '#f5f5f5', border: '#DCD9CF', text: '#999' },
  IN_PROGRESS:  { bg: '#e8eeff', border: '#2D5BFF', text: '#2D5BFF' },
  SUCCESS:      { bg: '#f0fff4', border: '#2E9E6B', text: '#2E9E6B' },
  FAILED:       { bg: '#fff0f0', border: '#D9534F', text: '#D9534F' },
  COMPENSATED:  { bg: '#fff8e0', border: '#C9A227', text: '#C9A227' },
}

function SagaDemo() {
  const [stepStatuses, setStepStatuses] = useState(['PENDING', 'PENDING', 'PENDING'])
  const [sagaState, setSagaState] = useState('NOT_STARTED')
  const [failAt, setFailAt] = useState(null) // null=no fail, 1=step index
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState([])
  const timerRef = useRef([])

  function clearTimers() {
    timerRef.current.forEach(t => clearTimeout(t))
    timerRef.current = []
  }

  function addLog(msg) {
    setLog(l => [...l, msg])
  }

  function reset() {
    clearTimers()
    setStepStatuses(['PENDING', 'PENDING', 'PENDING'])
    setSagaState('NOT_STARTED')
    setRunning(false)
    setLog([])
  }

  function setStatus(idx, status) {
    setStepStatuses(s => s.map((v, i) => i === idx ? status : v))
  }

  function runSaga() {
    if (running) return
    reset()
    setRunning(true)
    setSagaState('STARTED')

    const delays = []
    let time = 300

    // Step 0
    delays.push(setTimeout(() => {
      setStatus(0, 'IN_PROGRESS')
      addLog('→ Step 1: Reserving inventory…')
    }, time)); time += 700

    delays.push(setTimeout(() => {
      if (failAt === 0) {
        setStatus(0, 'FAILED')
        addLog('✗ Step 1 FAILED (inventory out of stock)')
        setSagaState('FAILED')
        addLog('Saga ended — nothing to compensate.')
        setRunning(false)
      } else {
        setStatus(0, 'SUCCESS')
        addLog('✓ Step 1 SUCCESS — inventory reserved')
      }
    }, time)); time += 700

    if (failAt !== 0) {
      // Step 1
      delays.push(setTimeout(() => {
        setStatus(1, 'IN_PROGRESS')
        addLog('→ Step 2: Charging payment…')
      }, time)); time += 700

      delays.push(setTimeout(() => {
        if (failAt === 1) {
          setStatus(1, 'FAILED')
          addLog('✗ Step 2 FAILED (payment declined)')
          setSagaState('COMPENSATING')
          addLog('↩ Compensating Step 1: releasing inventory…')
        } else {
          setStatus(1, 'SUCCESS')
          addLog('✓ Step 2 SUCCESS — $120 charged')
        }
      }, time)); time += 700

      if (failAt === 1) {
        delays.push(setTimeout(() => {
          setStatus(0, 'COMPENSATED')
          setSagaState('FAILED')
          addLog('✓ Step 1 COMPENSATED — inventory released')
          addLog('Saga FAILED — all compensations complete.')
          setRunning(false)
        }, time))
      } else {
        // Step 2
        delays.push(setTimeout(() => {
          setStatus(2, 'IN_PROGRESS')
          addLog('→ Step 3: Confirming order…')
        }, time)); time += 700

        delays.push(setTimeout(() => {
          if (failAt === 2) {
            setStatus(2, 'FAILED')
            addLog('✗ Step 3 FAILED (order service down)')
            setSagaState('COMPENSATING')
            addLog('↩ Compensating Step 2: refunding payment…')
          } else {
            setStatus(2, 'SUCCESS')
            setSagaState('COMPLETED')
            addLog('✓ Step 3 SUCCESS — order confirmed!')
            addLog('🎉 Saga COMPLETED successfully.')
            setRunning(false)
          }
        }, time)); time += 700

        if (failAt === 2) {
          delays.push(setTimeout(() => {
            setStatus(1, 'COMPENSATED')
            addLog('✓ Step 2 COMPENSATED — $120 refunded')
            addLog('↩ Compensating Step 1: releasing inventory…')
          }, time)); time += 700

          delays.push(setTimeout(() => {
            setStatus(0, 'COMPENSATED')
            setSagaState('FAILED')
            addLog('✓ Step 1 COMPENSATED — inventory released')
            addLog('Saga FAILED — all compensations complete.')
            setRunning(false)
          }, time))
        }
      }
    }

    timerRef.current = delays
  }

  useEffect(() => {
    return () => clearTimers()
  }, [])

  const sagaStateColors = {
    NOT_STARTED: '#999',
    STARTED: '#2D5BFF',
    COMPENSATING: '#C9A227',
    COMPLETED: '#2E9E6B',
    FAILED: '#D9534F',
  }

  return (
    <div className="panel">
      <div className="ptitle">Saga Pattern · PlaceOrder saga with compensating transactions</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={runSaga} disabled={running}>
          {running ? 'Running…' : '▶ Run Saga'}
        </button>
        <button className="ghost act" onClick={reset} disabled={running}>Reset</button>
      </div>

      {/* Fail-at toggle */}
      <div style={{ marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#7c8aa5' }}>Fail at:</span>
        {[
          { label: 'No failure (happy path)', val: null },
          { label: 'Step 1 (Inventory)', val: 0 },
          { label: 'Step 2 (Payment)', val: 1 },
          { label: 'Step 3 (Order)', val: 2 },
        ].map(opt => (
          <button
            key={String(opt.val)}
            className={failAt === opt.val ? 'act' : 'ghost act'}
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => { if (!running) { reset(); setFailAt(opt.val) } }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {SAGA_STEPS_HAPPY.map((step, i) => {
          const status = stepStatuses[i]
          const style = STATUS_STYLE[status]
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 8,
                border: `2px solid ${style.border}`,
                background: style.bg,
                transition: 'all 0.3s',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: style.border, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'IBM Plex Mono', fontSize: 13, fontWeight: 700,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{step.name}</div>
                <div style={{ fontSize: 12, color: '#7c8aa5' }}>{step.service}</div>
                {step.compensate && (
                  <div style={{ fontSize: 11, color: '#C9A227' }}>
                    ↩ compensation: {step.compensate}
                  </div>
                )}
              </div>
              <div style={{
                fontFamily: 'IBM Plex Mono', fontSize: 12,
                color: style.text, fontWeight: 700,
                minWidth: 100, textAlign: 'right',
              }}>
                {status}
              </div>
            </div>
          )
        })}
      </div>

      {/* Saga state machine */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 6 }}>
          SAGA STATE MACHINE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {['NOT_STARTED', 'STARTED', 'COMPENSATING', 'COMPLETED', 'FAILED'].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                padding: '4px 10px', borderRadius: 20,
                background: sagaState === s ? sagaStateColors[s] : '#f0f0f0',
                color: sagaState === s ? '#fff' : '#999',
                fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 600,
                transition: 'all 0.3s',
              }}>
                {s}
              </div>
              {s !== 'COMPLETED' && s !== 'FAILED' && (
                <span style={{ color: '#bbb', fontSize: 12 }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div style={{
          fontFamily: 'IBM Plex Mono', fontSize: 12,
          background: '#1B2A4A', color: '#a9f0b8',
          padding: 12, borderRadius: 8, maxHeight: 200, overflowY: 'auto',
        }}>
          {log.map((line, i) => (
            <div key={i} style={{ marginBottom: 3 }}>{line}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ========================================================
   Quiz data
   ======================================================== */
const QUESTIONS = [
  {
    q: 'What does Event Sourcing store in the database?',
    o: [
      'The current state of each entity as a single row, updated in place',
      'Every event that changed the entity, in an append-only log',
      'A snapshot of state taken every hour',
      'Only the most recent command that was sent',
    ],
    a: 1,
    e: 'Event Sourcing stores every change as an immutable event. The current state is derived by replaying all events in order — the database never mutates a row, it only appends new ones.',
    w: {
      0: 'That is traditional CRUD — Event Sourcing is the opposite: never update, always append.',
      2: 'Snapshots can be used as an optimization on top of Event Sourcing, but the primary store is the event log itself.',
      3: 'Event Sourcing stores events (things that happened), not commands (things requested). Commands can be rejected; events already occurred.',
    },
    r: { id: 's3', label: 'Section 3 — Event Sourcing' },
  },
  {
    q: 'In CQRS, what does "query side" mean?',
    o: [
      'The code that validates and executes business rules when a user sends a command',
      'A separate read-optimized data model updated by consuming events',
      'A cache layer in front of the main database',
      'The part of the code that queries the event store directly',
    ],
    a: 1,
    e: 'The query side maintains its own read-optimized projections (e.g. a denormalized view, a Redis counter, an Elasticsearch index). These are updated by consuming published events — completely separate from the command side.',
    w: {
      0: 'That describes the command side, not the query side. CQRS splits the two.',
      2: 'A cache is a performance trick on the same model. CQRS creates a genuinely separate model with different storage.',
      3: 'Querying the event store directly is possible but defeats the purpose — you would replay events on every read. The query side maintains ready-to-serve projections.',
    },
    r: { id: 's5', label: 'Section 5 — CQRS' },
  },
  {
    q: 'What is a "compensating transaction" in a Saga?',
    o: [
      'A database rollback that undoes all changes atomically',
      'A retry of the failed step with different input',
      'A business-level action that semantically reverses a previously completed step',
      'A 2PC coordinator that locks all participants before committing',
    ],
    a: 2,
    e: 'A compensating transaction is a real business operation that undoes the effect of a previous step. For example, if inventory was reserved, the compensation is to release it. It is NOT a database rollback — the original step already committed.',
    w: {
      0: 'Database rollbacks are not available across services. Each service committed its own transaction. Compensation must be a new forward action.',
      1: 'Retrying is for transient failures. Compensation is for business logic rollback when a subsequent step fails permanently.',
      3: 'Two-Phase Commit (2PC) is exactly what Sagas avoid — 2PC requires locking across services and is impractical in microservices.',
    },
    r: { id: 's7', label: 'Section 7 — Saga Pattern' },
  },
  {
    q: 'What is the key advantage of "temporal decoupling" in event-driven architecture?',
    o: [
      'Events are processed faster because they skip validation',
      'The publisher does not wait for consumers — they process the event when ready',
      'All services share the same database transaction',
      'Events are delivered exactly once, in strict order',
    ],
    a: 1,
    e: 'Temporal decoupling means the publisher (producer) does not block waiting for subscribers (consumers). The publisher fires and forgets. Each consumer processes the event independently at its own pace. This is the newspaper vs. phone-call distinction.',
    w: {
      0: 'Validation still happens — it moves to the command handler, not away entirely.',
      2: 'Sharing a database transaction is the opposite of event-driven — that is a tightly coupled monolith.',
      3: 'Exactly-once delivery is extremely hard to guarantee and most systems settle for at-least-once. Strict ordering requires extra infrastructure.',
    },
    r: { id: 's1', label: 'Section 1 — Temporal Decoupling' },
  },
  {
    q: 'Which of the following is true about events vs. commands?',
    o: [
      'Both can be rejected if validation fails',
      'A command is a record of something that happened; an event is a request',
      'An event can be rejected; a command cannot',
      'A command is a request that can be rejected; an event is a fact that already occurred',
    ],
    a: 3,
    e: 'Commands are requests ("PlaceOrder") — they can be rejected if business rules fail. Events are facts ("OrderPlaced") — they record something that already happened and cannot be rejected or undone. This distinction is critical for event-sourced systems.',
    w: {
      0: 'Only commands can be rejected. Once an event exists in the store, it is immutable.',
      1: 'This has the definitions backwards: a command is the request, an event is the fact.',
      2: 'An event cannot be rejected because it already happened. You can issue a compensating event, but not reject the original.',
    },
    r: { id: 's2', label: 'Section 2 — Event vs Command vs Query' },
  },
  {
    q: 'In a Saga, what is the difference between choreography and orchestration?',
    o: [
      'Choreography uses a central coordinator; orchestration uses peer-to-peer events',
      'Orchestration uses a central coordinator; choreography uses peer-to-peer events',
      'Choreography is synchronous; orchestration is asynchronous',
      'There is no difference — both terms describe the same pattern',
    ],
    a: 1,
    e: 'In orchestration, a central Saga Orchestrator tells each service what to do and waits for replies. In choreography, each service reacts to events published by others — no central brain. Orchestration is easier to monitor; choreography is more decoupled.',
    w: {
      0: 'This has the two definitions swapped. Orchestration has the coordinator, choreography is peer-to-peer.',
      2: 'Both can be asynchronous. The distinction is about whether there is a central coordinator, not about sync/async.',
      3: 'They are meaningfully different — orchestration gives you a single place to trace the saga; choreography distributes the logic across services.',
    },
    r: { id: 's7', label: 'Section 7 — Saga Pattern' },
  },
  {
    q: 'What is "eventual consistency" in event-driven systems?',
    o: [
      'All services see the same data at exactly the same moment',
      'A guarantee that data is never lost, just delayed',
      'Read models may be slightly stale after a write — they catch up when events are processed',
      'The event store is written last, after all consumers have updated',
    ],
    a: 2,
    e: 'Eventual consistency means that after a write (command), the read models will be updated asynchronously by consumers. For a brief window, queries may return stale data. Eventually (milliseconds to seconds later), all consumers catch up and the system is consistent.',
    w: {
      0: 'That is strong consistency, which requires distributed locking and sacrifices availability. Event-driven systems trade strong consistency for decoupling.',
      1: 'Eventual consistency says nothing about data loss — it is about the timing of propagation across read models.',
      3: 'The event store is written first (by the command handler). Consumers read from it asynchronously afterward.',
    },
    r: { id: 's9', label: 'Section 9 — When to use EDA' },
  },
  {
    q: 'How does an "idempotent consumer" handle receiving the same event twice?',
    o: [
      'It throws an exception to signal a duplicate event',
      'It processes the event twice, which is harmless because events are small',
      'It tracks event IDs and skips processing if the event was already handled',
      'It sends an acknowledgement to the broker to prevent re-delivery',
    ],
    a: 2,
    e: 'An idempotent consumer checks whether it has already processed a given event ID. If yes, it skips. This handles at-least-once delivery: even if the broker delivers an event multiple times (due to retries or network issues), the consumer only applies its effect once.',
    w: {
      0: 'Throwing an exception would stop the consumer and may cause the broker to retry, making the problem worse.',
      1: 'Processing twice is rarely harmless — charging a payment twice, sending two emails, or decrementing inventory twice are all serious bugs.',
      3: 'Acknowledging prevents future delivery from the broker, but does not protect against the same event arriving before the ack is processed (the at-least-once window).',
    },
    r: { id: 's10', label: 'Section 10 — Idempotent consumers' },
  },
]

/* ========================================================
   Page
   ======================================================== */
export default function Day90() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 90</div>
        <h1>Event-Driven Architecture:<br />Event Sourcing, CQRS &amp; Sagas</h1>
        <p>
          Direct service calls are phone calls — you block and wait. Events are newspapers — publish
          once, many subscribers react when ready. This day covers the three patterns that make
          event-driven systems robust: Event Sourcing, CQRS, and Sagas.
        </p>
        <div className="chips">
          {['Event Sourcing', 'CQRS', 'Saga', 'Temporal Decoupling', 'Compensating Transactions', 'Choreography', 'Orchestration'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* ── SECTION 1 ── Temporal Decoupling */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Newspaper vs. Phone Call — Temporal Decoupling</h2>
        <p>
          Imagine two ways to tell a million people the latest news.
        </p>
        <p>
          A <strong>phone call</strong> is synchronous. You dial. You wait for them to answer.
          You talk. They have to be available right now. If they are busy, you wait longer. If
          there are a million people to call, you are blocked for a very long time.
        </p>
        <p>
          A <strong>newspaper</strong> is asynchronous. You print once. A million readers each
          pick it up when they are ready. Some read it at 7am, some at noon, some tomorrow. You
          do not wait for any of them.
        </p>
        <Note>
          <strong>Temporal decoupling</strong> means the publisher does not wait for the
          subscriber. They are independent in time. The publisher fires and forgets. Each
          subscriber processes when it is ready.
        </Note>
        <p>
          In a traditional system, Service A calls Service B directly. A is blocked until B
          responds. If B is slow, A is slow. If B is down, A fails. They are tightly coupled.
        </p>
        <p>
          In an event-driven system, Service A publishes an <strong>OrderPlaced</strong> event
          to a message bus. Services B and C subscribe. A continues immediately. B and C each
          process the event independently. If C is slow, B is unaffected. If C crashes and
          restarts, it can replay missed events.
        </p>
        <Code html={`<span class="cm">// Synchronous — A blocks until B and C respond</span>
<span class="kw">void</span> placeOrder(Order order) {
    inventoryService.reserve(order);   <span class="cm">// blocks here</span>
    paymentService.charge(order);      <span class="cm">// then blocks here</span>
    notifyService.sendEmail(order);    <span class="cm">// then blocks here</span>
}

<span class="cm">// Event-driven — A fires and continues; B and C react on their own</span>
<span class="kw">void</span> placeOrder(Order order) {
    eventBus.publish(<span class="kw">new</span> OrderPlaced(order));  <span class="cm">// done. returns immediately.</span>
}
<span class="cm">// InventoryConsumer, PaymentConsumer, NotifyConsumer each handle the event independently</span>`} />
        <Reveal summary="What about ordering? Do subscribers always get events in sequence?">
          <p>
            It depends on your message broker. Apache Kafka guarantees order within a partition.
            RabbitMQ without special configuration does not guarantee order across consumers.
            Most event-driven designs accept that consumers may see events slightly out of order
            and design accordingly (using event timestamps or version numbers to detect and
            handle this).
          </p>
        </Reveal>
      </section>

      {/* ── SECTION 2 ── Terminology */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Event vs. Command vs. Query — The Vocabulary</h2>
        <p>
          These three words are used everywhere in event-driven design. They sound similar but
          they mean very different things.
        </p>
        <Code html={`<span class="cm">// COMMAND — a request. It CAN be rejected.</span>
<span class="kw">record</span> PlaceOrder(String userId, List&lt;Item&gt; items) {}
<span class="cm">// Can fail: "user has no balance", "item out of stock"</span>

<span class="cm">// EVENT — a fact. It CANNOT be rejected. It already happened.</span>
<span class="kw">record</span> OrderPlaced(String orderId, Instant at, List&lt;Item&gt; items) {}
<span class="cm">// Never fails — it is an immutable record of history</span>

<span class="cm">// QUERY — a question. No side effects. Just returns data.</span>
<span class="kw">interface</span> OrderQuery {
    Order getById(String orderId);
    List&lt;Order&gt; getByUser(String userId);
}`} />
        <table className="matrix" style={{ marginTop: 14, width: '100%' }}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Example</th>
              <th>Can be rejected?</th>
              <th>Side effects?</th>
              <th>Who creates it?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Command</strong></td>
              <td><code>PlaceOrder</code></td>
              <td className="yes">YES</td>
              <td className="yes">YES</td>
              <td>Client / UI</td>
            </tr>
            <tr>
              <td><strong>Event</strong></td>
              <td><code>OrderPlaced</code></td>
              <td className="no">NO (it happened)</td>
              <td>Triggers consumers</td>
              <td>Command handler</td>
            </tr>
            <tr>
              <td><strong>Query</strong></td>
              <td><code>GetOrder</code></td>
              <td className="no">NO</td>
              <td className="no">NO</td>
              <td>Client / UI</td>
            </tr>
          </tbody>
        </table>
        <Note>
          A command is a request: it might succeed or fail. An event is a statement that something
          already happened: it is immutable and never rejected. This distinction matters because
          you store events, not commands.
        </Note>
      </section>

      {/* ── SECTION 3 ── Event Sourcing */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Event Sourcing — The Append-Only Log</h2>
        <p>
          Traditional databases store the <strong>current state</strong>. One row per entity.
          When the order ships, you update the row. When it is delivered, you update again. The
          history is gone.
        </p>
        <p>
          Event Sourcing stores <strong>the sequence of changes</strong> instead. The row never
          gets updated. Each change appends a new event row. The current state is computed by
          replaying all events from the start.
        </p>
        <Code html={`<span class="cm">// TRADITIONAL (current-state storage)</span>
<span class="cm">// orders table:</span>
<span class="cm">// id | status    | tracking_id | delivered_at</span>
<span class="cm">// 42 | DELIVERED | ABC-123     | 2024-01-15   ← one row, mutated many times</span>

<span class="cm">// EVENT SOURCED (append-only log)</span>
<span class="cm">// order_events table (never updated — only appended):</span>
<span class="cm">// id | order_id | event_type    | payload</span>
<span class="cm">//  1 |       42 | OrderPlaced   | {items:[...], total:120.00}</span>
<span class="cm">//  2 |       42 | PaymentTaken  | {amount:120.00, method:"card"}</span>
<span class="cm">//  3 |       42 | ItemShipped   | {trackingId:"ABC-123"}</span>
<span class="cm">//  4 |       42 | OrderDelivered| {deliveredAt:"2024-01-15T14:30Z"}</span>

<span class="cm">// Current state = replay events 1→4 in order</span>`} />
        <p>Here is how this looks in Java:</p>
        <Code html={`<span class="cm">// Every event is a sealed record (immutable fact)</span>
<span class="kw">sealed interface</span> OrderEvent <span class="kw">permits</span> OrderPlaced, PaymentTaken, ItemShipped, OrderDelivered {
    Instant occurredAt();
    String orderId();
}

<span class="kw">record</span> OrderPlaced(String orderId, List&lt;Item&gt; items, Money total, Instant occurredAt)
    <span class="kw">implements</span> OrderEvent {}

<span class="kw">record</span> PaymentTaken(String orderId, Money amount, String method, Instant occurredAt)
    <span class="kw">implements</span> OrderEvent {}

<span class="kw">record</span> ItemShipped(String orderId, String trackingId, Instant occurredAt)
    <span class="kw">implements</span> OrderEvent {}

<span class="kw">class</span> Order {
    <span class="kw">private</span> OrderStatus status;
    <span class="kw">private</span> String trackingId;
    <span class="kw">private</span> Money amount;

    <span class="cm">// Rebuild state by replaying the event list</span>
    <span class="kw">static</span> Order reconstitute(List&lt;OrderEvent&gt; events) {
        Order order = <span class="kw">new</span> Order();
        <span class="kw">for</span> (OrderEvent e : events) order.apply(e);  <span class="cm">// each event evolves state</span>
        <span class="kw">return</span> order;
    }

    <span class="kw">private void</span> apply(OrderPlaced e)    { status = PLACED; }
    <span class="kw">private void</span> apply(PaymentTaken e)   { status = PAID; amount = e.amount(); }
    <span class="kw">private void</span> apply(ItemShipped e)    { status = SHIPPED; trackingId = e.trackingId(); }
    <span class="kw">private void</span> apply(OrderDelivered e) { status = DELIVERED; }
}`} />
        <Good>
          Benefits of Event Sourcing: full audit log (legally valuable), time travel (replay to
          any past state to debug), event-driven integration (events can be published to other
          services), and no update anomalies (append-only is simpler to reason about).
        </Good>
        <Warn>
          Trade-off: querying current state is more expensive (you must replay events). For
          high-volume systems, use <strong>snapshots</strong>: periodically save the computed
          state as a checkpoint. To load Order #42, load the latest snapshot (say, after event
          100) then replay only events 101+.
        </Warn>
        <Reveal summary="What if an event is wrong? Can I delete it?">
          <p>
            No. Events are immutable facts. If you made a mistake (wrong price entered, wrong
            user charged), you append a <em>correcting</em> event: <code>PriceCorrection</code>,
            <code>RefundIssued</code>. The audit trail shows exactly what happened and when it
            was corrected — which is exactly what banks, healthcare, and legal systems need.
          </p>
        </Reveal>
      </section>

      {/* ── SECTION 4 ── Event Sourcing Demo */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: Event Sourcing Time Travel</h2>
        <p>
          Order #42 has 4 events. Drag the slider backward to time-travel to any past state.
          Click "Replay All" to watch the events apply one by one. Toggle "What if payment
          failed?" to replace the PaymentTaken event with PaymentFailed and see how the
          reconstructed state changes.
        </p>
        <EventSourcingDemo />
      </section>

      {/* ── SECTION 5 ── CQRS */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>CQRS — Separate Read and Write Models</h2>
        <p>
          CQRS stands for <strong>Command Query Responsibility Segregation</strong>. The idea is
          simple: the model you use to <em>write</em> data does not have to be the same model
          you use to <em>read</em> data.
        </p>
        <p>
          Why split them? A write model is optimized for transactions and business rules: it is
          normalized, consistent, and enforces invariants. A read model is optimized for
          queries: it is denormalized, fast, and shaped for the UI. These two goals often
          conflict. CQRS solves the conflict by having two separate models.
        </p>
        <Code html={`<span class="cm">// COMMAND SIDE — handles business logic, saves events</span>
<span class="kw">class</span> PlaceOrderHandler {
    <span class="kw">void</span> handle(PlaceOrder cmd) {
        validate(cmd);                                 <span class="cm">// check business rules</span>
        OrderPlaced event = <span class="kw">new</span> OrderPlaced(...);
        eventStore.append(event);                     <span class="cm">// save to event store</span>
        eventBus.publish(event);                      <span class="cm">// notify consumers</span>
    }
}

<span class="cm">// QUERY SIDE — multiple consumers each maintaining their own read model</span>
<span class="kw">class</span> OrderViewConsumer {                          <span class="cm">// reads from: orders_view table (PostgreSQL)</span>
    <span class="kw">void</span> on(OrderPlaced e) { orderViewRepo.upsert(toRow(e)); }
    <span class="kw">void</span> on(ItemShipped e)  { orderViewRepo.updateStatus(e.orderId(), SHIPPED); }
}

<span class="kw">class</span> UserStatsConsumer {                          <span class="cm">// reads from: Redis user stats</span>
    <span class="kw">void</span> on(OrderPlaced e) {
        redis.incr(<span class="str">"user:"</span> + e.userId() + <span class="str">":order_count"</span>);
        redis.incrByFloat(<span class="str">"user:"</span> + e.userId() + <span class="str">":total_spend"</span>, e.total().amount());
    }
}

<span class="kw">class</span> InventoryConsumer {                          <span class="cm">// reads from: inventory MySQL table</span>
    <span class="kw">void</span> on(OrderPlaced e) {
        e.items().forEach(item -&gt; inventoryRepo.decrement(item.sku(), item.qty()));
    }
}`} />
        <Code html={`<span class="cm">┌─────────────┐    command     ┌──────────────────┐</span>
<span class="cm">│   Client    │ ──────────────▶│  Command Handler │</span>
<span class="cm">│             │                └────────┬─────────┘</span>
<span class="cm">│             │                         │ saves event</span>
<span class="cm">│             │                         ▼</span>
<span class="cm">│             │                ┌──────────────────┐</span>
<span class="cm">│             │                │   Event Store    │ ← append-only log</span>
<span class="cm">│             │                └────────┬─────────┘</span>
<span class="cm">│             │                         │ publishes</span>
<span class="cm">│             │                         ▼</span>
<span class="cm">│             │                ┌──────────────────┐</span>
<span class="cm">│             │                │    Event Bus     │</span>
<span class="cm">│             │                └──┬────────────┬──┘</span>
<span class="cm">│             │           ────────┘            └────────</span>
<span class="cm">│             │           ▼                            ▼</span>
<span class="cm">│  query ─────────▶ Order View            User Stats (Redis)</span>
<span class="cm">│             │     (PostgreSQL)           Inventory (MySQL)</span>
└─────────────┘</span>`} />
        <Note>
          The key insight: each consumer owns its own storage. One consumer might use
          Elasticsearch for full-text search, another Redis for counters, another PostgreSQL for
          structured reports. Reads never touch the event store directly — they hit the
          pre-computed read model.
        </Note>
        <Reveal summary="Does CQRS require Event Sourcing?">
          <p>
            No. CQRS and Event Sourcing are independent patterns. You can use CQRS with a
            traditional database (the command side writes normalized rows, the query side
            maintains separate denormalized views via database triggers or application logic).
            However, Event Sourcing and CQRS are naturally complementary: events are a great
            mechanism for updating read-model projections.
          </p>
        </Reveal>
      </section>

      {/* ── SECTION 6 ── CQRS Demo */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>Play: CQRS Projection Builder</h2>
        <p>
          Click "Publish: OrderPlaced" three times to fire the event sequence. Watch each
          consumer panel update independently. Notice that the inventory changes on the first
          event (OrderPlaced), but the UserStats counter only increments once. The "Query Order
          #42" button reads from the OrderView — not the event store directly.
        </p>
        <CQRSDemo />
      </section>

      {/* ── SECTION 7 ── Saga */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Saga Pattern — Distributed Transactions Without 2PC</h2>
        <p>
          Suppose placing an order requires three steps: reserve inventory, charge the payment,
          and confirm the order. In a monolith, one database transaction covers all three — if
          step 3 fails, steps 1 and 2 roll back atomically.
        </p>
        <p>
          In microservices, each step lives in a different service with its own database. You
          cannot use a database transaction across services. The classic solution is
          Two-Phase Commit (2PC) — but 2PC requires all services to be locked simultaneously,
          which is slow, fragile, and impractical at scale.
        </p>
        <p>
          A <strong>Saga</strong> is the alternative. It is a sequence of local transactions,
          each in its own service. If a step fails, previously completed steps are undone by
          running <strong>compensating transactions</strong> in reverse order.
        </p>
        <Code html={`<span class="cm">PlaceOrder Saga — three steps, each in its own service</span>
<span class="cm">─────────────────────────────────────────────────────────────</span>
<span class="cm">Step 1: InventoryService.reserve()  ──success──▶ Step 2</span>
<span class="cm">                                    ──fail──────▶ Saga FAILED (nothing to compensate)</span>

<span class="cm">Step 2: PaymentService.charge()     ──success──▶ Step 3</span>
<span class="cm">                                    ──fail──────▶ Compensate Step 1: release inventory</span>
<span class="cm">                                                  Saga FAILED</span>

<span class="cm">Step 3: OrderService.confirm()      ──success──▶ Saga COMPLETED ✓</span>
<span class="cm">                                    ──fail──────▶ Compensate Step 2: refund payment</span>
<span class="cm">                                                  Compensate Step 1: release inventory</span>
<span class="cm">                                                  Saga FAILED</span>`} />
        <h3 style={{ marginTop: 22, marginBottom: 8 }}>Choreography vs. Orchestration</h3>
        <p>
          There are two ways to coordinate a saga:
        </p>
        <table className="matrix" style={{ width: '100%', marginBottom: 14 }}>
          <thead>
            <tr>
              <th>Style</th>
              <th>How it works</th>
              <th>Pros</th>
              <th>Cons</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Choreography</strong></td>
              <td>Each service reacts to events published by others. No central brain.</td>
              <td>Fully decoupled. No single point of failure.</td>
              <td>Hard to visualize the full flow. Logic is scattered across services.</td>
            </tr>
            <tr>
              <td><strong>Orchestration</strong></td>
              <td>A central Saga Orchestrator sends commands to each service and waits for replies.</td>
              <td>Easy to monitor. Single place to trace progress. Explicit compensation logic.</td>
              <td>The orchestrator is a central coordinator — it can become a bottleneck.</td>
            </tr>
          </tbody>
        </table>
        <Code html={`<span class="cm">// ORCHESTRATION — a central orchestrator drives the saga</span>
<span class="kw">class</span> PlaceOrderSaga {

    <span class="kw">void</span> start(Order order) {
        setState(STARTED);
        inventoryService.reserve(order);           <span class="cm">// send command, await reply</span>
    }

    <span class="kw">void</span> onInventoryReserved(InventoryReserved e) {
        setState(INVENTORY_RESERVED);
        paymentService.charge(order);              <span class="cm">// next step</span>
    }

    <span class="kw">void</span> onPaymentFailed(PaymentFailed e) {
        setState(COMPENSATING);
        inventoryService.release(order);           <span class="cm">// compensate step 1</span>
    }

    <span class="kw">void</span> onInventoryReleased(InventoryReleased e) {
        setState(FAILED);                          <span class="cm">// saga is done — failed</span>
    }
}`} />
        <Note>
          A compensating transaction is NOT a database rollback. The original transaction already
          committed. Compensation is a new forward business action that semantically reverses the
          previous step: "inventory was reserved" is undone by "inventory is released."
        </Note>
      </section>

      {/* ── SECTION 8 ── Saga Demo */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>Play: Saga with Compensating Transactions</h2>
        <p>
          Select a failure scenario using the buttons, then click "Run Saga" to watch the
          saga execute. On the happy path, all three steps succeed. If payment fails (step 2),
          watch the saga compensate step 1 in reverse. If the order service fails (step 3),
          both steps 2 and 1 are compensated. Watch the saga state machine at the bottom
          update in real time.
        </p>
        <SagaDemo />
      </section>

      {/* ── SECTION 9 ── When to use EDA */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>When to Use Event-Driven Architecture</h2>
        <p>
          EDA is powerful, but it adds complexity. Use it when the benefits outweigh the costs.
        </p>
        <table className="matrix" style={{ width: '100%', marginBottom: 14 }}>
          <thead>
            <tr>
              <th>Use EDA when…</th>
              <th>Avoid EDA when…</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Multiple services need to react to the same event independently</td>
              <td>Your system is a simple CRUD app with one service</td>
            </tr>
            <tr>
              <td>You need a full audit log (banking, healthcare, legal)</td>
              <td>You need strong consistency (both reads and writes must be instantly consistent)</td>
            </tr>
            <tr>
              <td>Services have different scaling needs (notifications spike, orders do not)</td>
              <td>The team is small and the domain is simple — EDA adds operational overhead</td>
            </tr>
            <tr>
              <td>You need time travel / debugging capability (replay events)</td>
              <td>Your consumers cannot tolerate duplicate events (and cannot be made idempotent)</td>
            </tr>
          </tbody>
        </table>
        <Warn>
          <strong>Eventual consistency is the main trade-off.</strong> After a write, read models
          are updated asynchronously. For a brief window (milliseconds to seconds), a user who
          just placed an order might not see it in their order list if the query hits a stale
          read model. Design your UI to handle this (optimistic updates, "processing…" states).
        </Warn>
        <Reveal summary="What about event schema evolution? What if I add a field to OrderPlaced?">
          <p>
            This is one of the hardest problems in Event Sourcing. Old events in the store do not
            have the new field. You have three options:
          </p>
          <ol>
            <li><strong>Upcasting</strong>: when reading old events, transform them to add the
            missing field with a default value. Applied on the way in, before the apply() method.</li>
            <li><strong>Versioned events</strong>: publish <code>OrderPlacedV1</code> and
            <code>OrderPlacedV2</code> side by side. Consumers handle both versions.</li>
            <li><strong>Additive changes only</strong>: only add optional fields; never remove or
            rename fields. This is the safest default.</li>
          </ol>
        </Reveal>
      </section>

      {/* ── BONUS ── CAP theorem: the law behind "eventual consistency" */}
      <section id="cap">
        <div className="sec-label">Bonus deep-dive · The CAP theorem</div>
        <h2>CAP — why "eventually consistent" is a choice, not a bug</h2>
        <p>
          Everything above kept saying "eventual consistency is the trade-off." There is a theorem
          that explains WHY a trade-off exists at all, and interviewers expect you to know it by name:
          the <strong>CAP theorem</strong> (Eric Brewer, 2000).
        </p>
        <Code html={`<span class="cm">// The three properties:</span>
<span class="cm">//   C — Consistency:          every read sees the latest write (or an error)</span>
<span class="cm">//   A — Availability:         every request gets a (non-error) response</span>
<span class="cm">//   P — Partition tolerance:  the system survives the network splitting in two</span>

<span class="cm">// The theorem: during a network partition, you can keep C or A — not both.</span>

<span class="cm">//        [Node 1] ═══╳═══ [Node 2]        the network cable is "cut" (partition)</span>
<span class="cm">//            │                │</span>
<span class="cm">//         write x=5        read x?</span>
<span class="cm">//</span>
<span class="cm">// Node 2 cannot know about x=5. It has exactly two options:</span>
<span class="cm">//   CP: refuse to answer until the partition heals  → consistent but UNAVAILABLE</span>
<span class="cm">//   AP: answer with its stale value                 → available but INCONSISTENT</span>`} />
        <p>
          Two things people get wrong — say these out loud in the interview and you're ahead of most
          candidates:
        </p>
        <ul>
          <li><strong>P is not optional.</strong> Networks WILL partition (a switch dies, a garbage-collection
            pause makes a node look dead). "CA" systems only exist on a single node. The real choice is
            always CP vs AP — and only DURING a partition. In normal operation you can have both C and A.</li>
          <li><strong>It's per-operation, not per-system.</strong> A booking system can be CP for seat
            claims (never double-sell — refuse requests if unsure) and AP for the seat-map display (show
            slightly stale availability rather than an error page). Day 51's BookMyShow does exactly this.</li>
        </ul>
        <table className="matrix">
          <thead>
            <tr><th>Choice</th><th>During a partition…</th><th>Typical examples</th><th>Fits when…</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>CP</strong></td>
              <td>Some requests fail/block rather than return stale data</td>
              <td>ZooKeeper, etcd, bank core ledgers, seat/inventory claims</td>
              <td>A wrong answer costs money or corrupts state</td>
            </tr>
            <tr>
              <td><strong>AP</strong></td>
              <td>Every node keeps answering; conflicts reconciled later</td>
              <td>DNS, Cassandra (tunable), shopping carts, social feeds, this day's read models</td>
              <td>A stale answer is annoying but harmless</td>
            </tr>
          </tbody>
        </table>
        <Note>
          <strong>The refinement worth naming: PACELC.</strong> "If Partition then A-or-C; Else
          Latency-or-Consistency." Even with NO partition, strong consistency costs latency — every write
          must reach replicas before acknowledging. That is why Day 99's trade-off compass has a
          consistency slider at all: you pay for C in latency every single day, not just during outages.
        </Note>
        <Reveal summary="How does CAP connect to everything this day taught?">
          <p>
            Event-driven architecture is a deliberate AP choice on the read path: the write model accepts
            the command immediately, and read models catch up asynchronously. Sagas exist because a CP-style
            distributed transaction (2PC) sacrifices availability — every participant blocks while the
            coordinator decides. When you say "I'll use a Saga here," you are saying "I choose availability
            and repair inconsistency with compensations." Being able to narrate that chain — CAP → 2PC's
            cost → Saga as the AP answer — is a senior-level moment.
          </p>
        </Reveal>
      </section>

      {/* ── SECTION 10 ── Idempotency + Cheat Sheet */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Idempotent Consumers, Exactly-Once &amp; Cheat Sheet</h2>
        <h3 style={{ marginTop: 14, marginBottom: 8 }}>Idempotent Consumers</h3>
        <p>
          Message brokers (Kafka, RabbitMQ, SQS) typically guarantee <strong>at-least-once
          delivery</strong>: if a consumer crashes before acknowledging, the broker re-delivers
          the event. This means a consumer may receive the same event twice.
        </p>
        <p>
          An <strong>idempotent consumer</strong> handles duplicates safely. The simplest way:
          store the event ID in a processed-events table. Before processing, check if the ID is
          already there. If yes, skip. If no, process and insert the ID in the same transaction.
        </p>
        <Code html={`<span class="kw">class</span> IdempotentOrderConsumer {
    <span class="kw">void</span> on(OrderPlaced event) {
        <span class="kw">if</span> (processedEvents.contains(event.eventId())) {
            <span class="kw">return</span>;     <span class="cm">// already handled — skip silently</span>
        }
        db.transaction(() -&gt; {
            applyEvent(event);                           <span class="cm">// do the real work</span>
            processedEvents.insert(event.eventId());     <span class="cm">// mark as done atomically</span>
        });
    }
}`} />
        <h3 style={{ marginTop: 20, marginBottom: 8 }}>Exactly-Once Semantics</h3>
        <p>
          True exactly-once delivery across a distributed system is extremely hard. In practice:
        </p>
        <ul>
          <li><strong>At-most-once</strong>: fire and forget. Events may be lost. Acceptable for
          metrics/logging.</li>
          <li><strong>At-least-once</strong>: retry until acknowledged. Events may duplicate. Fix
          with idempotent consumers.</li>
          <li><strong>Effectively-exactly-once</strong>: at-least-once + idempotent consumers.
          The event is delivered multiple times, but the effect happens only once. This is what
          most production systems use.</li>
        </ul>
        <h3 style={{ marginTop: 20, marginBottom: 8 }}>Cheat Sheet</h3>
        <ul>
          <li><strong>Temporal decoupling</strong>: publisher does not wait for subscribers.</li>
          <li><strong>Command</strong>: a request that can fail. <strong>Event</strong>: a fact
          that already happened. <strong>Query</strong>: a question with no side effects.</li>
          <li><strong>Event Sourcing</strong>: store events, not current state. Current state =
          replay events. Benefits: audit log, time travel, event-driven integration.</li>
          <li><strong>CQRS</strong>: write model (command side) and read model (query side) are
          separate. Read models are projections updated by consuming events.</li>
          <li><strong>Saga</strong>: distributed transaction via a sequence of local transactions
          + compensating transactions for rollback. No 2PC needed.</li>
          <li><strong>Choreography saga</strong>: peer-to-peer, each service reacts to events.
          <strong>Orchestration saga</strong>: central coordinator drives the steps.</li>
          <li><strong>Eventual consistency</strong>: reads may be stale briefly after a write.</li>
          <li><strong>Idempotent consumer</strong>: safe to process same event twice — use an
          event ID deduplication table.</li>
        </ul>
      </section>

      {/* ── INTERVIEW CORNER ── */}
      <section id="interview">
        <div className="sec-label">Section 11 · Interview corner · Rapid fire</div>
        <h2>Interview Corner</h2>
        <p>
          Six common interview questions on event-driven architecture. Try to answer before
          clicking to reveal.
        </p>

        <Reveal summary="Q1: What is Event Sourcing and how does it differ from storing current state?">
          <p>
            Traditional systems store the <em>current state</em> of an entity as a mutable row —
            updated in place on every change. Event Sourcing stores the <em>sequence of changes
            (events)</em> in an append-only log. Current state is computed by replaying events.
            Key benefits: full audit log, time travel (replay to any point in history), and
            easy event-driven integration (events are already there to publish).
          </p>
          <p>
            Key cost: reading current state is more expensive (requires a replay or a cached
            snapshot). Snapshot optimization: periodically save the computed state so you only
            replay events since the last snapshot.
          </p>
        </Reveal>

        <Reveal summary="Q2: What is CQRS and why separate read and write models?">
          <p>
            CQRS (Command Query Responsibility Segregation) uses a separate model for writes
            (command side: enforces business rules, saves events) and reads (query side:
            maintains denormalized projections optimized for specific queries).
          </p>
          <p>
            Why separate? The optimal data model for writes (normalized, transactional) is
            often terrible for reads (requires expensive joins, aggregations). By maintaining
            separate read models (an order-list view in PostgreSQL, a count in Redis, a search
            index in Elasticsearch), each query is served from a pre-computed, perfectly shaped
            dataset. Writes are still fast because they just append an event and publish it.
          </p>
        </Reveal>

        <Reveal summary="Q3: What is a Saga and why can't you just use a database transaction across services?">
          <p>
            A Saga is a sequence of local transactions across multiple services, where each step
            publishes an event (or receives a command) to trigger the next. If a step fails,
            previously completed steps are undone by <em>compensating transactions</em> — real
            business operations that semantically reverse the previous step.
          </p>
          <p>
            You cannot use a distributed database transaction (2PC) across microservices because:
            (1) each service owns its own database; (2) 2PC requires locking all participants
            simultaneously — this is slow, and if any participant is unavailable, everything
            blocks; (3) it creates tight coupling between services that should be independent.
            Sagas trade atomicity for availability and decoupling.
          </p>
        </Reveal>

        <Reveal summary="Q4: Choreography vs. orchestration saga — when would you use each?">
          <p>
            <strong>Choreography</strong>: each service reacts to events published by others.
            No central coordinator. Use when: the flow is simple, you want maximum decoupling,
            and the number of steps is small. Con: the full saga flow is implicit — it lives
            across N services, so tracing a failure is hard.
          </p>
          <p>
            <strong>Orchestration</strong>: a central Saga Orchestrator sends explicit commands
            to each service and waits for replies. Use when: the flow has many steps, you need
            to visualize or monitor the saga as a whole, or compensations are complex. Con: the
            orchestrator becomes a central bottleneck and single point of failure.
          </p>
          <p>
            Rule of thumb: start with choreography for simple 2–3 step sagas. Introduce an
            orchestrator when the flow becomes hard to trace or compensations are difficult.
          </p>
        </Reveal>

        <Reveal summary="Q5: What is eventual consistency and what problems does it cause?">
          <p>
            Eventual consistency means that after a write (command), the read models are updated
            asynchronously by consumers. For a brief window, a read may return stale data.
            Eventually (when events are processed), all read models converge to the correct state.
          </p>
          <p>
            Problems it causes: (1) A user places an order, then immediately refreshes their
            order list — the order might not appear yet. (2) Inventory check returns "in stock"
            but the order was placed a fraction of a second before the inventory consumer
            processed the decrement event. (3) Debugging is harder because the system state
            is spread across multiple asynchronous consumers.
          </p>
          <p>
            Mitigations: optimistic UI updates (show the order immediately client-side, before
            the read model catches up), read-your-own-writes (route reads to the command side
            briefly after a write), and designing the UX to tolerate a small delay.
          </p>
        </Reveal>

        <Reveal summary="Q6: How do you handle duplicate event delivery (idempotent consumers)?">
          <p>
            At-least-once delivery means a consumer may receive the same event more than once
            (broker re-delivers if the consumer crashes before acknowledging). An idempotent
            consumer handles this safely: it tracks the IDs of events it has already processed
            (in a <code>processed_events</code> table or a Redis set). Before processing a new
            event, it checks this store. If the ID is already there, it skips. If not, it
            processes the event and records the ID in the <em>same atomic operation</em> (same
            database transaction).
          </p>
          <p>
            This achieves <em>effectively-exactly-once</em> semantics: the event may be
            delivered multiple times, but the business effect is applied exactly once.
          </p>
        </Reveal>
      </section>

      {/* ── QUIZ ── */}
      <section id="squiz">
        <div className="sec-label">Section 12 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* HOMEWORK FOOTER */}
      <div className="footer">
        <strong>Day 90 complete!</strong> Homework: Design an event-sourced shopping cart in Java.
        Define three event types as records: <code>CartItemAdded(cartId, itemSku, qty, price,
        Instant)</code>, <code>CartItemRemoved(cartId, itemSku, qty, Instant)</code>, and
        <code>CartCleared(cartId, Instant)</code>. Write a <code>Cart</code> class with a static
        <code>reconstitute(List&lt;CartEvent&gt; events)</code> method that replays the event list to
        compute the current item map and total price. Write a test that fires
        AddItem/AddItem/RemoveItem/Clear events and asserts the resulting cart is empty.
        <br /><br />
        That completes the bonus section — keep building, keep designing. Every pattern you have
        learned across these 90 days is a tool: use the right tool for the right problem, and
        you will design systems that are clear, robust, and a joy to extend.
      </div>
    </div>
  )
}
