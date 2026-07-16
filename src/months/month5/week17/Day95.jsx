import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* =====================================================================
   Demo 1 — Two-Phase Commit simulator
   ===================================================================== */
const SERVICES_INIT = [
  { id: 'order',     label: 'Order Service',     state: 'idle' },
  { id: 'payment',   label: 'Payment Service',   state: 'idle' },
  { id: 'inventory', label: 'Inventory Service', state: 'idle' },
]

function TwoPCDemo() {
  const [phase, setPhase]           = useState('idle')   // idle | prepare | commit | rollback | indoubt
  const [paymentFails, setPaymentFails] = useState(false)
  const [coordCrash, setCoordCrash]    = useState(false)
  const [services, setServices]     = useState(SERVICES_INIT)
  const [log, setLog]               = useState([])
  const [lockTimer, setLockTimer]   = useState(0)
  const [timerHandle, setTimerHandle] = useState(null)

  function addLog(msg) {
    setLog(prev => [...prev, msg])
  }

  function reset() {
    if (timerHandle) clearInterval(timerHandle)
    setPhase('idle')
    setServices(SERVICES_INIT)
    setLog([])
    setLockTimer(0)
    setTimerHandle(null)
  }

  function runPrepare() {
    reset()
    setPhase('prepare')
    setLog(['[Coordinator] Sending PREPARE to all participants...'])
    setTimeout(() => {
      const updated = SERVICES_INIT.map(s => {
        if (s.id === 'payment' && paymentFails) {
          return { ...s, state: 'abort' }
        }
        return { ...s, state: 'ready' }
      })
      setServices(updated)
      addLog('[Order Service] → READY ✓')
      if (paymentFails) {
        addLog('[Payment Service] → ABORT ✗  (insufficient funds)')
      } else {
        addLog('[Payment Service] → READY ✓')
      }
      addLog('[Inventory Service] → READY ✓')

      const allReady = !paymentFails

      if (coordCrash && allReady) {
        // coordinator crashes after prepare — in-doubt state
        setPhase('indoubt')
        addLog('[Coordinator] *** CRASH *** — coordinator has failed!')
        addLog('[All services] Status: IN-DOUBT. Locks held. Waiting for coordinator to recover...')
        let t = 0
        const h = setInterval(() => {
          t += 1
          setLockTimer(t)
        }, 1000)
        setTimerHandle(h)
      } else if (allReady) {
        setTimeout(() => {
          setPhase('commit')
          addLog('[Coordinator] All READY → sending COMMIT to all...')
          setServices(SERVICES_INIT.map(s => ({ ...s, state: 'committed' })))
          addLog('[Order Service] → COMMITTED ✓')
          addLog('[Payment Service] → COMMITTED ✓')
          addLog('[Inventory Service] → COMMITTED ✓')
          addLog('[Coordinator] Transaction complete.')
        }, 800)
      } else {
        setTimeout(() => {
          setPhase('rollback')
          addLog('[Coordinator] Payment said ABORT → sending ROLLBACK to all...')
          setServices(SERVICES_INIT.map(s => ({ ...s, state: 'rolledback' })))
          addLog('[Order Service] → ROLLED BACK')
          addLog('[Payment Service] → ROLLED BACK')
          addLog('[Inventory Service] → ROLLED BACK')
          addLog('[Coordinator] Transaction rolled back. Nothing changed.')
        }, 800)
      }
    }, 900)
  }

  const stateColor = {
    idle: '#9ca3af',
    ready: '#f59e0b',
    abort: '#ef4444',
    committed: '#10b981',
    rolledback: '#6b7280',
  }

  const stateLabel = {
    idle: 'IDLE',
    ready: 'READY (locks held)',
    abort: 'ABORT',
    committed: 'COMMITTED ✓',
    rolledback: 'ROLLED BACK',
  }

  const phaseLabels = {
    idle: '—',
    prepare: 'Phase 1: PREPARE',
    commit: 'Phase 2: COMMIT',
    rollback: 'Phase 2: ROLLBACK',
    indoubt: 'IN-DOUBT (coordinator crashed!)',
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Two-Phase Commit step-by-step</div>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <button className="act" onClick={runPrepare} disabled={phase === 'prepare'}>
          Start 2PC
        </button>
        <button className="ghost act" onClick={reset}>Reset</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={paymentFails} onChange={e => setPaymentFails(e.target.checked)} />
          Make Payment Service fail
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={coordCrash} onChange={e => setCoordCrash(e.target.checked)} />
          Crash coordinator after PREPARE
        </label>
      </div>

      {/* Coordinator box */}
      <div style={{
        border: '2px solid #2D5BFF',
        borderRadius: 8,
        padding: '10px 16px',
        marginBottom: 14,
        background: phase === 'indoubt' ? '#fff7ed' : '#f0f4ff',
        fontSize: 14,
      }}>
        <strong>Coordinator</strong>
        <span style={{ marginLeft: 12, color: phase === 'indoubt' ? '#ef4444' : '#2D5BFF' }}>
          {phaseLabels[phase]}
        </span>
        {phase === 'indoubt' && (
          <span style={{ marginLeft: 12, color: '#ef4444', fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
            Locks held for: {lockTimer}s
          </span>
        )}
      </div>

      {/* Service cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        {services.map(s => (
          <div key={s.id} style={{
            border: `2px solid ${stateColor[s.state] || '#ddd'}`,
            borderRadius: 8,
            padding: '12px 10px',
            textAlign: 'center',
            background: '#fff',
            transition: 'border-color 0.3s',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: stateColor[s.state] || '#888' }}>
              {stateLabel[s.state] || 'IDLE'}
            </div>
            {s.state === 'ready' && (
              <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>
                row locked — waiting
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div style={{
          background: '#0f172a',
          borderRadius: 6,
          padding: '10px 14px',
          fontFamily: 'IBM Plex Mono',
          fontSize: 12,
          color: '#94a3b8',
          maxHeight: 180,
          overflowY: 'auto',
        }}>
          {log.map((line, i) => (
            <div key={i} style={{
              color: line.includes('COMMIT') ? '#10b981'
                   : line.includes('ABORT') || line.includes('CRASH') || line.includes('IN-DOUBT') ? '#ef4444'
                   : line.includes('ROLLBACK') || line.includes('ROLLED') ? '#6b7280'
                   : '#94a3b8',
              marginBottom: 2,
            }}>{line}</div>
          ))}
        </div>
      )}

      {phase === 'indoubt' && (
        <Warn>
          All three services are holding row locks — no other transaction can modify those rows. They will stay
          locked until the coordinator restarts and recovers from its log. This is the "in-doubt" problem.
        </Warn>
      )}
      {phase === 'commit' && (
        <Good>All three services committed atomically — consistent state everywhere.</Good>
      )}
      {phase === 'rollback' && (
        <Note>Payment aborted → coordinator sent ROLLBACK to all. Nothing changed anywhere.</Note>
      )}
    </div>
  )
}

/* =====================================================================
   Demo 2 — Outbox pattern flow
   ===================================================================== */
function OutboxDemo() {
  // mode: 'outbox' | 'naive'
  const [mode, setMode]         = useState('outbox')
  const [step, setStep]         = useState(0)    // 0=idle, 1=placed, 2=relay, 3=consumer
  const [crashed, setCrashed]   = useState(false) // naive crash between DB and Kafka

  // In naive mode with crash, step 1 = DB written, crash happens, Kafka never gets it
  // In naive mode without crash, step 1 = DB written, step 2 = Kafka published, step 3 = consumer reads
  // In outbox mode, step 1 = DB tx (orders+outbox), step 2 = relay reads outbox + publishes, step 3 = consumer reads

  function reset() { setStep(0); setCrashed(false) }

  function doStep() {
    if (mode === 'naive' && step === 1 && crashed) {
      // already crashed, can't continue
      return
    }
    setStep(s => s + 1)
  }

  const naiveCrashBetween = mode === 'naive' && crashed && step >= 1

  const orderRow = step >= 1
  const outboxRow = mode === 'outbox' && step >= 1
  const outboxPublished = mode === 'outbox' && step >= 2
  const kafkaHasMsg = (mode === 'outbox' && step >= 2) || (mode === 'naive' && !crashed && step >= 2)
  const consumerRead = step >= 3

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Outbox pattern vs naive approach</div>

      {/* Mode toggle */}
      <div className="modbtns" style={{ marginBottom: 14 }}>
        <button className={mode === 'outbox' ? 'on' : ''} onClick={() => { setMode('outbox'); reset() }}>
          Outbox Pattern (safe)
        </button>
        <button className={mode === 'naive' ? 'on' : ''} onClick={() => { setMode('naive'); reset() }}>
          Naive (broken)
        </button>
      </div>

      {mode === 'naive' && step === 0 && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', marginBottom: 10 }}>
          <input type="checkbox" checked={crashed} onChange={e => setCrashed(e.target.checked)} />
          Crash process between DB write and Kafka publish
        </label>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Left: DB */}
        <div style={{ border: '2px solid #2D5BFF', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#2D5BFF' }}>Order Service DB</div>

          {/* orders table */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>
              TABLE: orders
            </div>
            <div style={{
              border: '1px solid #dcd9cf',
              borderRadius: 4,
              padding: '6px 8px',
              fontFamily: 'IBM Plex Mono',
              fontSize: 12,
              background: orderRow ? '#ecfdf5' : '#f8f8f6',
              color: orderRow ? '#065f46' : '#aaa',
              transition: 'background 0.4s',
            }}>
              {orderRow
                ? 'id=42, item="Book", status=PLACED'
                : '(empty)'}
            </div>
          </div>

          {/* outbox table — only in outbox mode */}
          {mode === 'outbox' && (
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>
                TABLE: outbox
              </div>
              <div style={{
                border: '1px solid #dcd9cf',
                borderRadius: 4,
                padding: '6px 8px',
                fontFamily: 'IBM Plex Mono',
                fontSize: 11,
                background: outboxRow ? (outboxPublished ? '#f0fdf4' : '#fffbeb') : '#f8f8f6',
                color: outboxRow ? (outboxPublished ? '#065f46' : '#92400e') : '#aaa',
                transition: 'background 0.4s',
              }}>
                {outboxRow
                  ? `event=ORDER_CREATED, payload={id:42}, status=${outboxPublished ? 'PUBLISHED' : 'PENDING'}`
                  : '(empty)'}
              </div>
              {outboxRow && (
                <div style={{ fontSize: 11, color: '#7c8aa5', marginTop: 4 }}>
                  {outboxPublished ? 'Relay marked as PUBLISHED' : 'Both rows written in one DB transaction'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Kafka + Consumer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ border: '2px solid #f59e0b', borderRadius: 8, padding: 12, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#b45309' }}>Kafka Topic</div>
            <div style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: 11,
              padding: '6px 8px',
              background: kafkaHasMsg ? '#fffbeb' : '#f8f8f6',
              borderRadius: 4,
              border: '1px solid #dcd9cf',
              color: kafkaHasMsg ? '#92400e' : '#aaa',
              transition: 'background 0.4s',
            }}>
              {kafkaHasMsg ? 'offset 0: ORDER_CREATED {id:42}' : '(no messages)'}
            </div>
          </div>
          <div style={{ border: '2px solid #10b981', borderRadius: 8, padding: 12, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#065f46' }}>Inventory Consumer</div>
            <div style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: 11,
              padding: '6px 8px',
              background: consumerRead && kafkaHasMsg ? '#ecfdf5' : '#f8f8f6',
              borderRadius: 4,
              border: '1px solid #dcd9cf',
              color: consumerRead && kafkaHasMsg ? '#065f46' : '#aaa',
              transition: 'background 0.4s',
            }}>
              {consumerRead && kafkaHasMsg
                ? 'Processed ORDER_CREATED → decremented stock'
                : '(waiting for events)'}
            </div>
          </div>
        </div>
      </div>

      {/* Step buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        {step === 0 && (
          <button className="act" onClick={doStep}>Step 1: Place Order</button>
        )}
        {step === 1 && !naiveCrashBetween && (
          <button className="act" onClick={doStep}>
            {mode === 'outbox' ? 'Step 2: Relay runs' : 'Step 2: Publish to Kafka'}
          </button>
        )}
        {step === 2 && !naiveCrashBetween && (
          <button className="act" onClick={doStep}>Step 3: Consumer reads</button>
        )}
        <button className="ghost act" onClick={reset}>Reset</button>
      </div>

      {/* Crash indicator */}
      {naiveCrashBetween && step === 1 && (
        <Warn>
          Process crashed after the DB write but before Kafka publish. The order row exists in the DB, but the
          event was never published. Inventory Consumer never learns about this order — inconsistent state!
        </Warn>
      )}

      {mode === 'outbox' && step === 1 && (
        <Good>
          Both the order row and the outbox row were written in ONE local DB transaction. If the process crashes
          now, the outbox row survives. The relay will publish it on next run.
        </Good>
      )}
      {mode === 'outbox' && step >= 2 && (
        <Note>
          The relay reads PENDING outbox rows, publishes to Kafka, then marks them PUBLISHED. If the relay
          crashes after Kafka publish but before marking PUBLISHED, it will publish again — consumers must be
          idempotent.
        </Note>
      )}
      {mode === 'naive' && !crashed && step >= 2 && (
        <Note>Without a crash, naive works too. The danger is the crash window between the two writes.</Note>
      )}
    </div>
  )
}

/* =====================================================================
   Demo 3 — Idempotency key deduplication
   ===================================================================== */
function IdempotencyDemo() {
  const [enabled, setEnabled] = useState(false)
  const [stock, setStock]     = useState(10)
  const [processed, setProcessed] = useState(new Set())
  const [log, setLog]         = useState([])
  const [deliveries, setDeliveries] = useState(0)

  function reset() {
    setStock(10)
    setProcessed(new Set())
    setLog([])
    setDeliveries(0)
  }

  function deliver(eventId) {
    const count = deliveries + 1
    setDeliveries(count)
    const newLog = [...log]
    newLog.push(`[Delivery #${count}] Received ORDER_CREATED eventId=${eventId}`)

    if (enabled && processed.has(eventId)) {
      newLog.push(`  → Idempotency check: eventId already processed. SKIP.`)
      setLog(newLog)
      return
    }

    // process it
    newLog.push(`  → Processing: decrement stock`)
    const newStock = stock - 1
    setStock(newStock)
    newLog.push(`  → Stock: ${stock} → ${newStock}`)

    if (enabled) {
      const newProcessed = new Set(processed)
      newProcessed.add(eventId)
      setProcessed(newProcessed)
      newLog.push(`  → Stored eventId=${eventId} in idempotency store.`)
    }
    setLog(newLog)
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Idempotency key deduplication</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          Enable idempotency check
        </label>
        <button className="ghost act" onClick={reset}>Reset</button>
      </div>

      {/* Scenario explanation */}
      <Note>
        Scenario: relay published ORDER_CREATED (eventId=evt-001) twice — once normally, once after a
        crash-and-retry. Without idempotency, the consumer decrements stock twice. With idempotency, only
        the first delivery is processed.
      </Note>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '14px 0' }}>
        {/* Stock display */}
        <div style={{ border: '2px solid #2D5BFF', borderRadius: 8, padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#7c8aa5', marginBottom: 8 }}>Inventory Stock</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 36, fontWeight: 700, color: stock < 8 ? '#ef4444' : '#10b981' }}>
            {stock}
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>units remaining</div>
        </div>

        {/* Idempotency store */}
        <div style={{ border: '2px solid #f59e0b', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 13, color: '#92400e', marginBottom: 8 }}>
            Idempotency Store {enabled ? '(active)' : '(disabled)'}
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
            {enabled && processed.size > 0
              ? [...processed].map(id => <div key={id} style={{ color: '#065f46' }}>✓ {id}</div>)
              : <div style={{ color: '#aaa' }}>(empty)</div>}
          </div>
        </div>
      </div>

      {/* Delivery buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => deliver('evt-001')}>
          Deliver #1 (eventId=evt-001)
        </button>
        <button className="act" onClick={() => deliver('evt-001')}>
          Deliver #2 (eventId=evt-001, duplicate!)
        </button>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div style={{
          background: '#0f172a',
          borderRadius: 6,
          padding: '10px 14px',
          fontFamily: 'IBM Plex Mono',
          fontSize: 12,
          maxHeight: 180,
          overflowY: 'auto',
        }}>
          {log.map((line, i) => (
            <div key={i} style={{
              color: line.includes('SKIP') ? '#f59e0b'
                   : line.includes('Stock') ? '#10b981'
                   : line.includes('Stored') ? '#60a5fa'
                   : '#94a3b8',
              marginBottom: 2,
            }}>{line}</div>
          ))}
        </div>
      )}

      {deliveries >= 2 && stock <= 8 && (
        enabled
          ? <Good style={{ marginTop: 10 }}>
              Idempotency check caught the duplicate — stock decremented only once. Exactly-once semantics achieved.
            </Good>
          : <Warn style={{ marginTop: 10 }}>
              No idempotency check — stock decremented twice from one logical order. Enable idempotency to fix this.
            </Warn>
      )}
    </div>
  )
}

/* =====================================================================
   Quiz data
   ===================================================================== */
const QUESTIONS = [
  {
    q: 'What is the "in-doubt" problem in Two-Phase Commit?',
    o: [
      'Participants do not know how to roll back',
      'Participants hold locks indefinitely when the coordinator crashes after PREPARE',
      'The coordinator sends COMMIT before all participants reply READY',
      'Participants can vote ABORT without a reason',
    ],
    a: 1,
    e: 'After all participants reply READY, they hold locks and wait for COMMIT or ROLLBACK from the coordinator. If the coordinator crashes at that moment, participants are stuck — they cannot unilaterally commit or abort. They stay in the "in-doubt" state, locks held, until the coordinator recovers.',
    w: {
      0: 'Rollback procedure is well-defined in 2PC — participants wrote redo/undo logs before replying READY.',
      2: 'The coordinator only sends COMMIT after all participants reply READY — that sequencing is the point of the prepare phase.',
      3: 'Participants can vote ABORT for any reason (insufficient funds, lock timeout, etc.) — that is expected and handled.',
    },
    r: { id: 's2', label: 'Section 2 — Two-Phase Commit' },
  },
  {
    q: 'Which statement best describes the Outbox pattern?',
    o: [
      'Write to Kafka first, then write to the local DB',
      'Use a distributed transaction to span the DB and Kafka',
      'Write the event into an outbox table inside the same local DB transaction as the business data',
      'Call the downstream service directly and let it handle its own DB write',
    ],
    a: 2,
    e: 'The outbox pattern writes the event as a row in an outbox table in the same local DB transaction as the business entity. A separate relay process reads the outbox and publishes to Kafka. This makes the two writes atomic via the DB, avoiding the dual-write problem.',
    w: {
      0: 'Writing to Kafka first has the same problem in reverse — if the DB write fails, the event was already published.',
      1: 'Kafka does not support XA / two-phase commit with standard databases in practice, and even if it did, this pattern avoids that complexity.',
      3: 'Calling the downstream service synchronously creates tight coupling and still does not solve atomicity between your DB write and the call.',
    },
    r: { id: 's6', label: 'Section 6 — Outbox Pattern' },
  },
  {
    q: 'Why must consumers that use the Outbox pattern be idempotent?',
    o: [
      'Because the outbox table can lose rows',
      'Because the relay may publish the same event more than once after a crash',
      'Because Kafka does not guarantee ordered delivery',
      'Because the outbox table uses optimistic locking',
    ],
    a: 1,
    e: 'The relay publishes to Kafka and then marks the outbox row as PUBLISHED. If it crashes between those two steps, on restart it will find the row still PENDING and publish again. So the same event can arrive at the consumer twice. Idempotency (checking the eventId before processing) prevents double-processing.',
    w: {
      0: 'The outbox row is in the same DB as the business data — it is as durable as any other DB row.',
      2: 'Kafka partitions do guarantee ordering within a partition; the duplication issue comes from the relay crash, not from ordering.',
      3: 'The outbox pattern does not inherently use optimistic locking — it uses a simple status column updated by the relay.',
    },
    r: { id: 's8', label: 'Section 8 — Idempotency Keys' },
  },
  {
    q: 'In terms of consistency, how does the Saga pattern differ from Two-Phase Commit?',
    o: [
      'Saga gives strong ACID guarantees; 2PC gives eventual consistency',
      '2PC gives strong ACID guarantees; Saga gives eventual consistency with compensations',
      'Both give strong ACID guarantees but Saga is faster',
      'Both give eventual consistency but 2PC uses a coordinator',
    ],
    a: 1,
    e: '2PC locks all participants and commits atomically — strong consistency, no intermediate visible state. Saga commits each step independently; if a later step fails, compensating transactions undo the earlier ones. Intermediate states (e.g. money debited but order not yet created) are visible briefly — that is eventual consistency.',
    w: {
      0: 'This is backwards. Saga is the eventually consistent approach; 2PC is the strongly consistent one.',
      2: 'Saga does not give ACID — it deliberately sacrifices isolation (I) for performance and fault tolerance.',
      3: '2PC achieves strong consistency, not eventual consistency. Using a coordinator is how it achieves that.',
    },
    r: { id: 's5', label: 'Section 5 — Saga vs 2PC' },
  },
  {
    q: 'What is CDC (Change Data Capture) in the context of the Outbox pattern?',
    o: [
      'A way to encrypt the outbox table',
      'A technique that reads the database write-ahead log to stream outbox inserts to Kafka automatically',
      'A two-phase commit protocol for Kafka',
      'A method to deduplicate Kafka messages',
    ],
    a: 1,
    e: 'Tools like Debezium read the database WAL (write-ahead log), which records every insert and update. When the relay sees a new outbox row in the WAL, it publishes the event to Kafka immediately — no polling, no extra DB scan load, lower latency.',
    w: {
      0: 'CDC has nothing to do with encryption — it is about change propagation, not security.',
      2: 'CDC is an alternative to polling the outbox table; it is not a commit protocol for Kafka.',
      3: 'Deduplication is handled by idempotency keys on the consumer side, not by CDC.',
    },
    r: { id: 's6', label: 'Section 6 — Outbox Pattern' },
  },
  {
    q: 'A payment service and an order service run in separate JVMs with separate databases. What is the fundamental reason a regular Java DB transaction cannot span both?',
    o: [
      'Java does not support multi-threaded database access',
      'Each service has its own database connection and transaction context — there is no shared transaction manager',
      'Database commits are too slow for microservices',
      'JDBC does not support autocommit=false',
    ],
    a: 1,
    e: 'A DB transaction is scoped to a single database connection. Each service holds connections to its own database only. There is no shared transaction context that can atomically commit changes in two separate databases at once — that is exactly the distributed transactions problem.',
    w: {
      0: 'Java supports multi-threaded DB access fine; the issue is separate databases, not threads.',
      2: 'Commit speed is a performance concern, not the fundamental reason transactions cannot span services.',
      3: 'JDBC absolutely supports autocommit=false — that is how single-service transactions work.',
    },
    r: { id: 's1', label: 'Section 1 — The distributed atomicity problem' },
  },
  {
    q: 'When should you prefer 2PC over Saga?',
    o: [
      'Always — 2PC is strictly better in every situation',
      'When services are geographically distributed and high throughput is required',
      'For short-lived transactions within a tightly controlled cluster where strong consistency is required',
      'When you cannot afford to write compensating transactions',
    ],
    a: 2,
    e: '2PC works well for short-lived transactions (short lock time) within a tightly controlled cluster (reliable sync connections), such as database nodes in the same data center. When strong consistency is non-negotiable (e.g. financial settlement), 2PC is the right choice. It is inappropriate for long workflows or cross-internet service boundaries.',
    w: {
      0: '2PC is not strictly better — it blocks participants, requires a reliable coordinator, and does not scale to cross-service internet scenarios.',
      1: 'High throughput across geographically distributed services is exactly where 2PC is the worst choice — network latency and locking make it impractical.',
      3: 'Avoiding compensating transaction work is not a technical reason to prefer 2PC — in fact 2PC has its own operational complexity.',
    },
    r: { id: 's5', label: 'Section 5 — Saga vs 2PC' },
  },
  {
    q: 'An idempotency store using Redis stores processed event IDs. After the TTL expires, what risk does this create?',
    o: [
      'The event will be reprocessed if delivered again after the TTL, breaking idempotency',
      'Redis will delete the event from Kafka as well',
      'The consumer will crash on the next delivery',
      'The idempotency key becomes a lock, causing deadlocks',
    ],
    a: 0,
    e: 'Once the TTL expires, the event ID is gone from Redis. If the same event is delivered again (very late replay, re-delivery), the idempotency check will miss it and process the event again. The TTL must be set long enough to outlast the maximum possible retry window of your message bus.',
    w: {
      1: 'Redis and Kafka are independent systems — deleting a key from Redis has no effect on Kafka messages.',
      2: 'The consumer will not crash — it will simply not find the key and process the event again, which is the correctness risk.',
      3: 'Idempotency keys are simple lookups, not locks — they do not cause deadlocks.',
    },
    r: { id: 's8', label: 'Section 8 — Idempotency Keys' },
  },
]

/* =====================================================================
   Page
   ===================================================================== */
export default function Day95() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 95</div>
        <h1>Distributed Transactions:<br />2PC, Saga &amp; the Outbox Pattern</h1>
        <p>
          One database transaction is easy. Two services, two databases, one logical operation — that is the
          hard part of distributed systems. Learn the three main tools: Two-Phase Commit, Saga, and the
          Outbox Pattern. Click every demo to see exactly where each approach succeeds and where it breaks.
        </p>
        <div className="chips">
          {['Two-Phase Commit', 'Saga', 'Outbox Pattern', 'CDC', 'Idempotency Key', 'At-Least-Once', 'Eventual Consistency'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* ── SECTION 1 ── The problem */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The Notary Problem: Atomicity Across Services</h2>
        <p>
          Imagine buying a house. The buyer pays. The seller transfers the deed. Both must happen, or neither
          must happen — you cannot pay money and receive no deed, and you cannot receive a deed without paying.
        </p>
        <p>
          When a single notary is in the room with both parties, this is easy. But when the buyer's bank is in
          Singapore, the seller's title company is in London, and the notary is in New York — any party can
          lose internet at the worst moment. That is exactly the distributed transactions problem.
        </p>

        <Code html={`<span class="cm">// Monolith: one database, one connection — atomicity is FREE</span>
<span class="kw">connection</span>.setAutoCommit(<span class="kw">false</span>);
debitAccount(buyerId, amount);    <span class="cm">// local DB write — in the same transaction</span>
creditAccount(sellerId, amount);  <span class="cm">// local DB write — in the same transaction</span>
<span class="kw">connection</span>.commit();              <span class="cm">// ATOMIC: both committed, or neither</span>

<span class="cm">// ──────────────────────────────────────────────────────────────────────</span>

<span class="cm">// Distributed: two services, two separate databases — NO shared transaction</span>
<span class="cm">// Order Service writes to its own DB (MySQL on server A)</span>
orderDb.execute(<span class="str">"INSERT INTO orders ..."</span>);   <span class="cm">// committed immediately to orderDb</span>

<span class="cm">// Payment Service writes to its own DB (Postgres on server B)</span>
paymentDb.execute(<span class="str">"UPDATE accounts ..."</span>);   <span class="cm">// separate transaction, separate DB</span>

<span class="cm">// If Order commits and Payment crashes → Order row exists, no payment → inconsistent!</span>
<span class="cm">// There is no single .commit() that spans both. This is the problem.</span>`} />

        <Note>
          The root cause is simple: a database transaction is scoped to one database connection. Two services
          have two separate connections to two separate databases. No shared commit is possible without a
          distributed protocol.
        </Note>

        <Code html={`<span class="cm">// ASCII: the gap between services</span>

<span class="cm">┌─────────────────────────┐         ┌─────────────────────────┐</span>
<span class="cm">│     Order Service       │         │    Payment Service       │</span>
<span class="cm">│  ┌─────────────────┐   │         │  ┌─────────────────┐   │</span>
<span class="cm">│  │  orders table   │   │  ????   │  │  accounts table │   │</span>
<span class="cm">│  │  id=42 PLACED   │   │ ──────► │  │  balance -$99   │   │</span>
<span class="cm">│  └─────────────────┘   │         │  └─────────────────┘   │</span>
<span class="cm">│     (its own DB)        │         │     (its own DB)        │</span>
<span class="cm">└─────────────────────────┘         └─────────────────────────┘</span>
<span class="cm">        ▲                                       ▲</span>
<span class="cm">        │  No wire connects these two commits   │</span>
<span class="cm">        └───────────────────────────────────────┘</span>
<span class="cm">              How do we keep them in sync?</span>`} />
      </section>

      {/* ── SECTION 2 ── 2PC */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Two-Phase Commit (2PC): The Locking Protocol</h2>
        <p>
          2PC introduces a <strong>coordinator</strong> — a process that orchestrates all participants.
          It runs two phases:
        </p>
        <ul>
          <li>
            <strong>Phase 1 — Prepare:</strong> the coordinator sends PREPARE to every participant.
            Each participant writes its change to a local redo log, acquires locks on the rows it wants to modify,
            and replies READY (or ABORT if something is wrong).
          </li>
          <li>
            <strong>Phase 2 — Commit/Rollback:</strong> if ALL replied READY, the coordinator sends COMMIT
            to all. If ANY replied ABORT, the coordinator sends ROLLBACK to all.
          </li>
        </ul>

        <Code html={`<span class="cm">// Two-Phase Commit — ASCII flow diagram</span>

<span class="cm">┌────────────────────────────────────────────────────────────────┐</span>
<span class="cm">│                  PHASE 1 — PREPARE                            │</span>
<span class="cm">│                                                                │</span>
<span class="cm">│  Coordinator ──PREPARE──► Order Service  → writes redo log   │</span>
<span class="cm">│  Coordinator ──PREPARE──► Payment Svc   → writes redo log   │</span>
<span class="cm">│  Coordinator ──PREPARE──► Inventory Svc → writes redo log   │</span>
<span class="cm">│                                                                │</span>
<span class="cm">│  Order Service  ──READY──► Coordinator                       │</span>
<span class="cm">│  Payment Svc    ──READY──► Coordinator                       │</span>
<span class="cm">│  Inventory Svc  ──READY──► Coordinator                       │</span>
<span class="cm">│                                                                │</span>
<span class="cm">│  (all said READY — coordinator decides to COMMIT)             │</span>
<span class="cm">├────────────────────────────────────────────────────────────────┤</span>
<span class="cm">│                  PHASE 2 — COMMIT                             │</span>
<span class="cm">│                                                                │</span>
<span class="cm">│  Coordinator ──COMMIT──► Order Service  → applies, unlocks   │</span>
<span class="cm">│  Coordinator ──COMMIT──► Payment Svc   → applies, unlocks   │</span>
<span class="cm">│  Coordinator ──COMMIT──► Inventory Svc → applies, unlocks   │</span>
<span class="cm">│                                                                │</span>
<span class="cm">│  All services reply ACK. Transaction complete.                │</span>
<span class="cm">└────────────────────────────────────────────────────────────────┘</span>

<span class="cm">// If Payment replied ABORT instead:</span>
<span class="cm">│  Coordinator ──ROLLBACK──► All services → discard, unlock    │</span>
<span class="cm">│  Nothing committed anywhere. Consistent.                       │</span>`} />

        <p>
          The key insight: once a participant replies READY, it has <em>promised</em> it can commit.
          It must not crash and lose that promise. That is why it writes to a redo log before replying.
          If it restarts, it reads the log and completes the commit.
        </p>

        <Reveal summary="What happens when the coordinator crashes after PREPARE?">
          <p>
            All participants replied READY. All are holding row locks. The coordinator crashes before sending
            COMMIT or ROLLBACK. Now what?
          </p>
          <p>
            Participants cannot unilaterally decide. If they commit on their own, they might be inconsistent
            with a participant the coordinator actually rolled back. If they rollback on their own, they might
            undo a transaction the coordinator actually committed.
          </p>
          <p>
            So they wait. Locks held. Blocking all other transactions that need those rows. This can last
            minutes or hours until the coordinator is restored and reads its own log to decide. This is the
            <strong> in-doubt state</strong> — arguably 2PC's biggest flaw.
          </p>
        </Reveal>
      </section>

      {/* ── SECTION 3 ── 2PC problems */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>2PC Problems: Blocking, SPOF, and XA</h2>
        <p>
          2PC works. It is used in practice — most relational databases support it via the <strong>XA
          protocol</strong> (a standard interface for distributed transactions). But it comes with real costs.
        </p>

        <table className="matrix" style={{ marginBottom: 16 }}>
          <thead>
            <tr>
              <th>Problem</th>
              <th>Explanation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Blocking</strong></td>
              <td>Participants hold locks between Phase 1 and Phase 2. If the coordinator is slow or crashes, those locks block all other transactions needing the same rows.</td>
            </tr>
            <tr>
              <td><strong>Coordinator SPOF</strong></td>
              <td>The coordinator is a single point of failure. You can run a backup coordinator, but recovery logic is complex.</td>
            </tr>
            <tr>
              <td><strong>Two round-trips</strong></td>
              <td>Every transaction requires two full network round-trips between coordinator and all participants. High latency, especially across data centers.</td>
            </tr>
            <tr>
              <td><strong>Not microservice-friendly</strong></td>
              <td>XA assumes reliable, synchronous connections. Cross-internet services time out, flake, and operate on different infrastructure you do not control.</td>
            </tr>
          </tbody>
        </table>

        <Good>
          XA / 2PC is appropriate for database cluster nodes in the same data center, or services you fully
          own and control with reliable sync connections. It is the wrong tool for cross-service internet calls.
        </Good>

        <Reveal summary="What is the XA protocol exactly?">
          <p>
            XA is an Open Group standard that defines how a Transaction Manager (coordinator) talks to Resource
            Managers (databases). Java exposes it via <C>javax.transaction.xa.XAResource</C>. When you use a
            Java EE application server (JBoss, WebLogic) with JTA (Java Transaction API), the server acts as
            the coordinator and your datasources are XA-aware resources.
          </p>
          <Code html={`<span class="cm">// Java XA skeleton (simplified)</span>
<span class="kw">UserTransaction</span> utx = context.lookup(<span class="str">"java:comp/UserTransaction"</span>);
utx.begin();  <span class="cm">// coordinator starts the distributed transaction</span>

<span class="cm">// Both datasources automatically enlist in the same XA transaction</span>
orderDb.execute(<span class="str">"INSERT INTO orders ..."</span>);    <span class="cm">// XA-aware: sends PREPARE at commit time</span>
paymentDb.execute(<span class="str">"UPDATE accounts ..."</span>);  <span class="cm">// XA-aware: sends PREPARE at commit time</span>

utx.commit();  <span class="cm">// coordinator runs full 2PC across both DBs</span>`} />
        </Reveal>
      </section>

      {/* ── SECTION 4 ── Interactive 2PC */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: Two-Phase Commit Simulator</h2>
        <p>
          Click <strong>Start 2PC</strong> to watch the coordinator send PREPARE, collect READY votes, and
          send COMMIT. Toggle <em>Make Payment Service fail</em> to see the ABORT path. Toggle <em>Crash
          coordinator after PREPARE</em> to witness the in-doubt state — services stuck holding locks
          with a live timer.
        </p>
        <TwoPCDemo />
      </section>

      {/* ── SECTION 5 ── Saga vs 2PC */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Saga vs 2PC: ACID vs Eventual Consistency</h2>
        <p>
          The Saga pattern (covered in depth in Day 90) takes the opposite approach. Instead of locking
          everything and committing atomically, a Saga runs a <strong>sequence of local transactions</strong>.
          Each step commits immediately to its own DB and publishes an event. If a later step fails,
          <strong> compensating transactions</strong> undo the earlier ones.
        </p>

        <Code html={`<span class="cm">// 2PC: lock everything, commit atomically</span>
<span class="cm">┌──────────────────────────────────────────────────────┐</span>
<span class="cm">│  PREPARE (all locked, no intermediate state visible) │</span>
<span class="cm">│  ── Order: READY  Payment: READY  Inventory: READY   │</span>
<span class="cm">│  COMMIT ──► all unlock, all visible simultaneously  │</span>
<span class="cm">│                                                      │</span>
<span class="cm">│  OR crash ──► in-doubt, locks held indefinitely     │</span>
<span class="cm">└──────────────────────────────────────────────────────┘</span>

<span class="cm">// Saga: step by step, each step immediately visible</span>
<span class="cm">┌──────────────────────────────────────────────────────┐</span>
<span class="cm">│  Step 1: Order created  → COMMITTED (visible now)   │</span>
<span class="cm">│  Step 2: Payment done   → COMMITTED (visible now)   │</span>
<span class="cm">│  Step 3: Inventory dec  → COMMITTED (visible now)   │</span>
<span class="cm">│  Done ✓ — no global lock, high throughput           │</span>
<span class="cm">│                                                      │</span>
<span class="cm">│  Step 3 fails → compensate Step 2 (refund payment)  │</span>
<span class="cm">│             → compensate Step 1 (cancel order)      │</span>
<span class="cm">└──────────────────────────────────────────────────────┘</span>`} />

        <table className="matrix" style={{ marginBottom: 16 }}>
          <thead>
            <tr>
              <th>Property</th>
              <th>2PC</th>
              <th>Saga</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Consistency</strong></td>
              <td className="yes">Strong (ACID)</td>
              <td className="no">Eventual (BASE)</td>
            </tr>
            <tr>
              <td><strong>Locks</strong></td>
              <td className="no">Global locks during phases</td>
              <td className="yes">No global locks</td>
            </tr>
            <tr>
              <td><strong>Intermediate state</strong></td>
              <td className="yes">Never visible</td>
              <td className="no">Visible (e.g. payment taken but order not confirmed)</td>
            </tr>
            <tr>
              <td><strong>Failure handling</strong></td>
              <td className="yes">Coordinator sends ROLLBACK</td>
              <td className="no">Must write compensating transactions manually</td>
            </tr>
            <tr>
              <td><strong>Cross-internet services</strong></td>
              <td className="no">Impractical</td>
              <td className="yes">Designed for it</td>
            </tr>
            <tr>
              <td><strong>Long-running workflows</strong></td>
              <td className="no">Terrible (holds locks the whole time)</td>
              <td className="yes">Perfect</td>
            </tr>
          </tbody>
        </table>

        <Note>
          The consistency spectrum: <strong>2PC</strong> is at the strong end (like a bank vault — nothing
          moves until everyone agrees). <strong>Saga</strong> is at the eventual end (like a courier — the
          package moves step by step, with a return label if something goes wrong). Neither is universally
          better — the choice depends on your tolerance for brief inconsistency and your need for throughput.
        </Note>
      </section>

      {/* ── SECTION 6 ── Outbox */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The Outbox Pattern: Atomic Event Publishing</h2>
        <p>
          Even if you choose Saga or a simple event-driven design, you face a daily practical problem:
          how do you <strong>atomically write to your local DB AND publish an event to Kafka?</strong>
        </p>
        <p>
          These are two different systems. Writing to both in one shot is not possible without a distributed
          transaction. And the naive approach — write to DB, then publish to Kafka — has a crash window.
        </p>

        <Code html={`<span class="cm">// NAIVE (broken) — write DB then publish Kafka</span>
<span class="kw">connection</span>.setAutoCommit(<span class="kw">false</span>);
db.execute(<span class="str">"INSERT INTO orders ..."</span>);    <span class="cm">// step 1: write to DB</span>
<span class="kw">connection</span>.commit();                         <span class="cm">// DB committed ✓</span>
<span class="cm">// *** CRASH HERE ***  ← process dies between these two lines</span>
kafka.publish(<span class="str">"ORDER_CREATED"</span>, payload);    <span class="cm">// step 2: never happens!</span>
<span class="cm">// Order exists in DB. Event never published. Downstream never informed. ✗</span>

<span class="cm">// ──────────────────────────────────────────────────────────────────────</span>

<span class="cm">// OUTBOX PATTERN (correct) — write event INTO the same DB transaction</span>
<span class="kw">connection</span>.setAutoCommit(<span class="kw">false</span>);
db.execute(<span class="str">"INSERT INTO orders (id, item, status) VALUES (42, 'Book', 'PLACED')"</span>);
db.execute(<span class="str">"INSERT INTO outbox (event_type, payload, status) "</span> +
           <span class="str">"VALUES ('ORDER_CREATED', '{\"orderId\":42}', 'PENDING')"</span>);
<span class="kw">connection</span>.commit();  <span class="cm">// BOTH rows committed atomically — orders AND outbox</span>
<span class="cm">// If crash happens here, both rows exist. Relay will find and publish later. ✓</span>

<span class="cm">// ──────────────────────────────────────────────────────────────────────</span>

<span class="cm">// RELAY PROCESS (runs separately, periodically)</span>
<span class="kw">List</span>&lt;OutboxEvent&gt; pending =
    db.query(<span class="str">"SELECT * FROM outbox WHERE status = 'PENDING'"</span>);

<span class="kw">for</span> (OutboxEvent e : pending) {
    kafka.publish(e.eventType(), e.payload());  <span class="cm">// publish to Kafka</span>
    db.execute(<span class="str">"UPDATE outbox SET status='PUBLISHED' WHERE id=?"</span>, e.id());
    <span class="cm">// If crash between these two lines: publishes again on next run</span>
    <span class="cm">// → at-least-once delivery → consumers must be idempotent</span>
}`} />

        <Note>
          <strong>CDC (Change Data Capture)</strong> with tools like <strong>Debezium</strong> is better than
          polling. Debezium reads the database WAL (write-ahead log) — the internal record of every change
          the database makes. When it sees a new row in the outbox table, it immediately streams that event
          to Kafka. No polling lag. No extra DB scan load. Production systems prefer CDC over polling.
        </Note>

        <Code html={`<span class="cm">// Outbox pattern — ASCII architecture diagram</span>

<span class="cm">  ┌──────────────────────────────┐</span>
<span class="cm">  │     Order Service            │</span>
<span class="cm">  │                              │</span>
<span class="cm">  │  ┌─────────┐ ┌──────────┐  │</span>
<span class="cm">  │  │ orders  │ │ outbox   │  │  ← ONE DB transaction writes BOTH tables</span>
<span class="cm">  │  │ id=42   │ │ PENDING  │  │</span>
<span class="cm">  │  └─────────┘ └──────────┘  │</span>
<span class="cm">  │          (same DB)          │</span>
<span class="cm">  └──────────────┬───────────────┘</span>
<span class="cm">                 │ WAL / polling</span>
<span class="cm">  ┌──────────────▼───────────────┐</span>
<span class="cm">  │  Relay / Debezium (CDC)      │  ← reads outbox, publishes to Kafka</span>
<span class="cm">  └──────────────┬───────────────┘</span>
<span class="cm">                 │</span>
<span class="cm">  ┌──────────────▼───────────────┐</span>
<span class="cm">  │  Kafka Topic: order-events   │</span>
<span class="cm">  └──────────────┬───────────────┘</span>
<span class="cm">                 │</span>
<span class="cm">  ┌──────────────▼───────────────┐</span>
<span class="cm">  │  Inventory Consumer          │  ← idempotent: checks eventId first</span>
<span class="cm">  └──────────────────────────────┘</span>`} />
      </section>

      {/* ── SECTION 7 ── Interactive Outbox */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>Play: Outbox Pattern vs Naive Dual Write</h2>
        <p>
          Toggle between <strong>Outbox Pattern</strong> and <strong>Naive</strong> mode, then step through the
          flow. In Naive mode, enable the crash toggle and watch what happens when the process dies between the
          DB write and the Kafka publish. Switch to Outbox mode to see how the two-table trick fixes it.
        </p>
        <OutboxDemo />
      </section>

      {/* ── SECTION 8 ── Idempotency */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Idempotency Keys: At-Least-Once + Dedup = Exactly-Once</h2>
        <p>
          The Outbox relay guarantees <strong>at-least-once delivery</strong>: every event will eventually
          arrive, but may arrive more than once. Consumers must handle duplicates — otherwise a double delivery
          could decrement stock twice, charge the customer twice, or send two confirmation emails.
        </p>
        <p>
          The fix is an <strong>idempotency key</strong>: a unique ID per event that the consumer records after
          the first successful processing. On any re-delivery, it checks the key first.
        </p>

        <Code html={`<span class="cm">// Idempotency store — Java implementation</span>
<span class="kw">public class</span> InventoryConsumer {

    <span class="kw">private final</span> IdempotencyStore store;   <span class="cm">// Redis SET or DB table</span>

    <span class="kw">public void</span> onOrderCreated(OrderCreatedEvent event) {
        <span class="cm">// Check FIRST, before doing any work</span>
        <span class="kw">if</span> (store.alreadyProcessed(event.eventId())) {
            log.info(<span class="str">"Duplicate event, skipping: {}"</span>, event.eventId());
            <span class="kw">return</span>;   <span class="cm">// nothing else happens — safe to ignore</span>
        }

        <span class="cm">// Do the actual work</span>
        inventory.decrement(event.itemId(), event.quantity());

        <span class="cm">// Record the key AFTER successful processing</span>
        store.markProcessed(event.eventId());
        <span class="cm">// TTL must be longer than your message bus's max retry window</span>
    }
}

<span class="cm">// Redis implementation (SET NX EX — set if not exists, with expiry)</span>
<span class="kw">public class</span> RedisIdempotencyStore {
    <span class="kw">private final</span> RedisClient redis;
    <span class="kw">private static final int</span> TTL_SECONDS = <span class="num">86400</span>; <span class="cm">// 24 hours — outlast retries</span>

    <span class="kw">public boolean</span> alreadyProcessed(String eventId) {
        <span class="cm">// Redis GET: if key exists, we already processed it</span>
        <span class="kw">return</span> redis.get(<span class="str">"idem:"</span> + eventId) != <span class="kw">null</span>;
    }

    <span class="kw">public void</span> markProcessed(String eventId) {
        <span class="cm">// SET key "1" NX EX 86400 — atomic, only sets if absent</span>
        redis.set(<span class="str">"idem:"</span> + eventId, <span class="str">"1"</span>, SetArgs.Builder.nx().ex(TTL_SECONDS));
    }
}`} />

        <Warn>
          The TTL on the idempotency key must be <strong>longer than your maximum retry window</strong>. If
          your message bus retries for up to 7 days, the key must live at least 7 days. If the key expires
          early and the same event is delivered again, the dedup check misses it.
        </Warn>

        <Reveal summary="Idempotency key vs exactly-once semantics: what is the difference?">
          <p>
            <strong>Exactly-once</strong> means the consumer processes each event exactly once, with no
            duplicates and no drops. In distributed systems, true exactly-once is impossible to guarantee
            without coordination overhead.
          </p>
          <p>
            What we actually achieve with at-least-once + idempotency is <strong>effectively
            exactly-once</strong>: the event may be delivered more than once, but the consumer's
            <em>side effect</em> (the inventory decrement, the charge) happens exactly once. That is
            sufficient for almost all real use cases.
          </p>
        </Reveal>
      </section>

      {/* ── SECTION 9 ── Interactive Idempotency */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>Play: Idempotency Deduplication Lab</h2>
        <p>
          Press <strong>Deliver #1</strong> then <strong>Deliver #2</strong> (the same event delivered
          twice — like the relay retrying after a crash). Without idempotency, stock drops by 2 from one
          logical order. Enable the checkbox and try again — the second delivery is caught and skipped.
        </p>
        <IdempotencyDemo />
      </section>

      {/* ── SECTION 10 ── Decision guide + cheat sheet */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Decision Guide and Cheat Sheet</h2>

        <h3 style={{ marginTop: 0, fontSize: 17 }}>When to use which approach</h3>
        <table className="matrix" style={{ marginBottom: 20 }}>
          <thead>
            <tr>
              <th>Situation</th>
              <th>Best choice</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Same company's DB cluster nodes, short transactions, need strong consistency</td>
              <td><strong>2PC / XA</strong></td>
              <td>Reliable sync connections, short lock windows, ACID required</td>
            </tr>
            <tr>
              <td>Long-running multi-step business workflow (order → payment → shipping)</td>
              <td><strong>Saga</strong></td>
              <td>Steps take seconds or minutes; cannot hold locks that long</td>
            </tr>
            <tr>
              <td>Need to publish a Kafka event atomically with a DB write</td>
              <td><strong>Outbox Pattern</strong></td>
              <td>Atomic via same-DB transaction; relay handles async publishing</td>
            </tr>
            <tr>
              <td>Cross-company service calls (third-party payment gateway)</td>
              <td><strong>Saga + Outbox + Idempotency</strong></td>
              <td>Cannot trust external services to participate in your 2PC</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ fontSize: 17 }}>Cheat sheet</h3>
        <ul>
          <li>
            <strong>2PC:</strong> coordinator runs Prepare (get READY votes, acquire locks) then Commit/Rollback.
            Strong consistency. Blocking if coordinator crashes (in-doubt state). XA is the Java standard.
            Best for same-cluster DB nodes.
          </li>
          <li>
            <strong>Saga:</strong> sequence of local commits + events. Compensations undo on failure.
            Eventual consistency. No global locks. Best for long-running cross-service workflows.
          </li>
          <li>
            <strong>Outbox Pattern:</strong> write event to outbox table in same DB transaction as business
            data. Relay reads outbox and publishes to Kafka. Guarantees at-least-once. No dual-write window.
          </li>
          <li>
            <strong>CDC (Debezium):</strong> reads DB write-ahead log instead of polling outbox.
            Lower latency, zero extra DB scan load. Production default for outbox relay.
          </li>
          <li>
            <strong>Idempotency key:</strong> unique event ID stored after first processing. On duplicate
            delivery, skip. Set TTL longer than max retry window. Achieves effectively-exactly-once.
          </li>
          <li>
            <strong>Consistency spectrum:</strong> 2PC (strong, ACID, blocking) ←—→ Saga (eventual, BASE, non-blocking).
          </li>
        </ul>

        <Good>
          In practice, most microservice systems use Saga + Outbox + Idempotency together. Each piece solves
          one layer: Saga for the workflow, Outbox for atomic event publishing, Idempotency for safe retry.
        </Good>
      </section>

      {/* ── INTERVIEW CORNER ── */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Tricky Questions for Interviews</h2>

        <Reveal summary="Why can't you just use a single DB transaction across two microservices?">
          <p>
            A DB transaction is scoped to a single database connection and a single database. Each
            microservice has its own database with its own connection pool. There is no shared connection,
            and therefore no shared transaction context. You would need a distributed protocol (XA / 2PC)
            to coordinate commits across two separate databases — and even then, both databases must support
            XA, which many modern managed cloud databases do not.
          </p>
        </Reveal>

        <Reveal summary="What are the two phases of 2PC, and what is the in-doubt problem?">
          <p>
            <strong>Phase 1 (Prepare):</strong> coordinator sends PREPARE to all participants. Each writes
            to a redo log, acquires locks, replies READY or ABORT.
          </p>
          <p>
            <strong>Phase 2 (Commit/Rollback):</strong> if all READY → COMMIT; if any ABORT → ROLLBACK.
          </p>
          <p>
            <strong>In-doubt:</strong> if the coordinator crashes after all participants replied READY but
            before it sends COMMIT or ROLLBACK, participants are stuck. They cannot decide on their own.
            They hold all their locks indefinitely until the coordinator recovers.
          </p>
        </Reveal>

        <Reveal summary="What is the Outbox pattern and exactly what problem does it solve?">
          <p>
            <strong>Problem:</strong> you cannot atomically write to a DB and publish to Kafka — they are
            separate systems. If you write to DB then publish to Kafka, a crash between the two leaves
            your DB updated but the event never published. Downstream services never know about the change.
          </p>
          <p>
            <strong>Solution:</strong> write the event as a row into an <C>outbox</C> table
            <em> in the same local DB transaction</em> as your business data. A separate relay process
            reads PENDING outbox rows and publishes them to Kafka, then marks them PUBLISHED. The
            atomicity of the two DB writes (business + outbox) is guaranteed by the local DB transaction.
          </p>
        </Reveal>

        <Reveal summary="Why must outbox consumers be idempotent, and how do you implement it?">
          <p>
            The relay guarantees at-least-once delivery. If the relay publishes to Kafka and then crashes
            before marking the outbox row PUBLISHED, on restart it will find the row still PENDING and
            publish again. The consumer receives the same event twice.
          </p>
          <p>
            <strong>Implementation:</strong> give every event a unique ID. The consumer checks the ID
            against a store (Redis SET with TTL, or a <C>processed_events</C> DB table) before
            processing. If already there, skip. After processing, store the ID. TTL must exceed the
            maximum retry window.
          </p>
        </Reveal>

        <Reveal summary="Strong consistency (2PC) vs eventual consistency (Saga) — what is the difference?">
          <p>
            <strong>Strong consistency (2PC):</strong> all participants lock their data and commit
            atomically. No intermediate state is ever visible to other transactions. Either all changes
            are visible simultaneously or none are.
          </p>
          <p>
            <strong>Eventual consistency (Saga):</strong> each step commits independently to its own DB.
            Intermediate states are visible — for example, a payment may be deducted before the order is
            confirmed. If a later step fails, compensating transactions correct the earlier ones. The
            system is briefly inconsistent but converges to a consistent state eventually.
          </p>
        </Reveal>

        <Reveal summary="What is CDC and why is it better than polling the outbox table?">
          <p>
            <strong>CDC (Change Data Capture)</strong> is a technique that reads the database's write-ahead
            log (WAL) — the internal log the DB uses to guarantee durability. Tools like <strong>Debezium</strong>
            tail this log and emit a stream of changes in real time.
          </p>
          <p>
            <strong>Polling</strong>: your relay runs a <C>SELECT * FROM outbox WHERE status='PENDING'</C>
            every N seconds. This scans the table on every poll, adds read load to the DB, and has up to
            N seconds of delivery latency.
          </p>
          <p>
            <strong>CDC</strong>: Debezium detects the outbox insert as soon as it appears in the WAL
            and streams it to Kafka immediately. Zero polling latency, no extra DB scan, and it works even
            if the outbox table grows large. Production systems strongly prefer CDC.
          </p>
        </Reveal>
        <Reveal summary="Which HTTP methods are idempotent by contract — and how does that connect to idempotency keys?">
          <p>
            The HTTP spec itself divides the verbs: <strong>GET, PUT, DELETE are idempotent by
            contract</strong> — calling them N times must equal calling them once (PUT replaces the whole
            resource with the same body; DELETE of a deleted thing is still deleted). <strong>POST is
            not</strong> — each POST may create another resource. That is exactly why this day's
            idempotency keys exist: they are how you MANUFACTURE idempotency for POST. The client generates
            a UUID per logical operation, sends it as an <C>Idempotency-Key</C> header, and the server
            dedupes on it — a retried <C>POST /payments</C> returns the original result instead of charging
            twice. Two interview follow-ups: ① idempotent ≠ safe — DELETE changes state but is idempotent;
            only GET/HEAD are "safe" (read-only); ② the contract is about <em>server state</em>, not the
            response — a second DELETE may return 404 instead of 204 and still be idempotent. Naming
            "retries are only safe against idempotent operations, so we design operations to be idempotent"
            ties Day 84's retry stack, Kafka's at-least-once (Day 94), and this day into one sentence.
          </p>
        </Reveal>
      </section>

      {/* ── QUIZ ── */}
      <section id="quiz">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice — including why wrong answers tempt people.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 95 complete?</strong> Homework: Implement a minimal Outbox pattern in Java. Create an
        <C>orders</C> table and an <C>outbox</C> table. Write a service method that inserts into both in one
        JDBC transaction. Write a relay class that polls the outbox, prints the event (simulating Kafka publish),
        and marks the row PUBLISHED. Then add idempotency: create a <C>processed_events</C> set, and make
        your relay skip already-published events on restart.
        <br /><br />
        Next: <strong>Day 96 — CDN &amp; Edge Caching</strong>: how content delivery networks cache your
        responses at the network edge, what cache-control headers control, and when to invalidate.
      </div>

    </div>
  )
}
