import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ================================================================
   Demo 1 — Partition Routing Visualizer
   Shows key-based vs round-robin routing and consumer-group rebalance
   ================================================================ */
function PartitionRoutingDemo() {
  const NUM_PARTITIONS = 4
  const [mode, setMode] = useState('keyed')      // 'keyed' | 'roundrobin'
  const [messages, setMessages] = useState([])   // { id, key, partition, color }
  const [nextKey, setNextKey] = useState(1)
  const [crashed, setCrashed] = useState(false)  // consumer 1 crashed

  const MSG_COLORS = ['#2D5BFF','#2E9E6B','#D97B29','#9B59B6','#D9534F','#C9A227']

  function hashKey(k) {
    // simple djb2-style hash for visualization
    let h = 5381
    for (let i = 0; i < k.length; i++) h = ((h * 33) ^ k.charCodeAt(i)) >>> 0
    return h % NUM_PARTITIONS
  }

  function sendMessage() {
    const key = `order-${nextKey}`
    const partition = mode === 'keyed'
      ? hashKey(key)
      : messages.length % NUM_PARTITIONS   // round-robin
    const color = MSG_COLORS[nextKey % MSG_COLORS.length]
    setMessages(m => [...m.slice(-20), { id: nextKey, key, partition, color }])
    setNextKey(k => k + 1)
  }

  function reset() {
    setMessages([])
    setNextKey(1)
    setCrashed(false)
  }

  // Which consumer owns which partition
  // Normal: Consumer A → 0,1   Consumer B → 2,3
  // Crashed Consumer A: Consumer B → 0,1,2,3
  function ownerOf(p) {
    if (crashed) return 'B'
    return p <= 1 ? 'A' : 'B'
  }

  const partitions = Array.from({ length: NUM_PARTITIONS }, (_, i) => ({
    id: i,
    msgs: messages.filter(m => m.partition === i)
  }))

  return (
    <div className="panel">
      <div className="ptitle">Live demo · partition routing &amp; consumer rebalance</div>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:14 }}>
        <div className="modbtns">
          <button className={mode === 'keyed' ? 'on' : ''} onClick={() => { setMode('keyed'); reset() }}>
            Key-based (same key → same partition)
          </button>
          <button className={mode === 'roundrobin' ? 'on' : ''} onClick={() => { setMode('roundrobin'); reset() }}>
            Round-robin (no key)
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:14 }}>
        <button className="act" onClick={sendMessage}>Send message (key: order-{nextKey})</button>
        <button className="ghost act" onClick={reset}>Reset</button>
        <button
          className={`act${crashed ? ' ghost' : ''}`}
          style={{ background: crashed ? '#D9534F22' : '#D9534F', borderColor:'#D9534F', color: crashed ? '#D9534F' : '#fff' }}
          onClick={() => setCrashed(c => !c)}
        >
          {crashed ? 'Restore Consumer A' : 'Crash Consumer A → rebalance'}
        </button>
      </div>

      {crashed && (
        <div className="warn" style={{ marginBottom:12 }}>
          <b>Rebalance triggered!</b> Consumer A crashed. Consumer B now owns ALL 4 partitions.
          In a real cluster, consumption pauses briefly while Kafka reassigns partitions.
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {partitions.map(p => (
          <div key={p.id} style={{
            border:`2px solid ${crashed ? '#D9534F' : ownerOf(p.id) === 'A' ? '#2D5BFF' : '#2E9E6B'}`,
            borderRadius:8, padding:10, minHeight:120
          }}>
            <div style={{ fontFamily:'IBM Plex Mono', fontSize:12, fontWeight:700, marginBottom:6 }}>
              Partition {p.id}
              <span style={{
                marginLeft:6, fontSize:10, padding:'2px 6px', borderRadius:10,
                background: ownerOf(p.id) === 'A' ? '#2D5BFF22' : '#2E9E6B22',
                color: ownerOf(p.id) === 'A' ? '#2D5BFF' : '#2E9E6B'
              }}>
                Consumer {ownerOf(p.id)}
              </span>
            </div>
            {p.msgs.length === 0 ? (
              <div style={{ fontSize:11, color:'#aaa' }}>empty</div>
            ) : (
              p.msgs.map((m, idx) => (
                <div key={m.id} style={{
                  fontFamily:'IBM Plex Mono', fontSize:10, padding:'2px 4px',
                  borderRadius:4, marginBottom:3,
                  background: m.color + '22', borderLeft:`3px solid ${m.color}`
                }}>
                  [{idx}] {m.key}
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      {mode === 'keyed' && messages.length > 0 && (
        <Good>
          Notice: the same key always lands in the same partition (e.g. order-1 is always in partition {hashKey('order-1')}).
          This guarantees that all events for one order are processed in order.
        </Good>
      )}
      {mode === 'roundrobin' && messages.length > 0 && (
        <Note>
          Round-robin spreads load evenly but loses ordering guarantees — order-1 and order-2 may go to different
          partitions and be processed in parallel by different consumers.
        </Note>
      )}
    </div>
  )
}

/* ================================================================
   Demo 2 — Consumer Group Offset Tracker
   One partition, two independent consumer groups
   ================================================================ */
function OffsetTrackerDemo() {
  const LOG = [
    { offset: 0, value: 'OrderCreated(id=101)' },
    { offset: 1, value: 'OrderCreated(id=102)' },
    { offset: 2, value: 'PaymentReceived(id=101)' },
    { offset: 3, value: 'OrderShipped(id=101)' },
    { offset: 4, value: 'PaymentReceived(id=102)' },
    { offset: 5, value: 'OrderShipped(id=102)' },
  ]
  const [analyticsOffset, setAnalyticsOffset] = useState(0)
  const [billingOffset, setBillingOffset] = useState(0)
  const [extraMsgs, setExtraMsgs] = useState([])  // new arrivals appended

  const fullLog = [...LOG, ...extraMsgs]

  function advanceAnalytics() {
    setAnalyticsOffset(o => Math.min(o + 1, fullLog.length))
  }
  function advanceBilling() {
    setBillingOffset(o => Math.min(o + 1, fullLog.length))
  }
  function resetAnalytics() {
    setAnalyticsOffset(0)
  }
  function addMessage() {
    const next = fullLog.length
    setExtraMsgs(m => [...m, { offset: next, value: `NewEvent(offset=${next})` }])
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · two consumer groups, independent offsets</div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        <button className="act" style={{ background:'#2D5BFF' }} onClick={advanceAnalytics}>
          Analytics reads next (offset {analyticsOffset})
        </button>
        <button className="act" style={{ background:'#2E9E6B' }} onClick={advanceBilling}>
          Billing reads next (offset {billingOffset})
        </button>
        <button className="ghost act" onClick={resetAnalytics}>Reset analytics to 0 (replay)</button>
        <button className="ghost act" onClick={addMessage}>New message arrives</button>
      </div>

      <div style={{ fontFamily:'IBM Plex Mono', fontSize:12, marginBottom:6, color:'#7c8aa5' }}>
        Partition 0 — immutable log (append-only)
      </div>

      <div style={{ border:'1px solid var(--line)', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
        {fullLog.map((entry, i) => {
          const analyticsRead = i < analyticsOffset
          const billingRead = i < billingOffset
          const isAnalyticsCursor = i === analyticsOffset
          const isBillingCursor = i === billingOffset
          return (
            <div key={entry.offset} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'7px 12px',
              background: (isAnalyticsCursor || isBillingCursor) ? '#FFFBE6' : i % 2 === 0 ? '#fafaf7' : '#fff',
              borderBottom: i < fullLog.length - 1 ? '1px solid var(--line)' : 'none'
            }}>
              <span style={{ fontFamily:'IBM Plex Mono', fontSize:11, color:'#aaa', minWidth:60 }}>
                offset {entry.offset}
              </span>
              <span style={{ flex:1, fontFamily:'IBM Plex Mono', fontSize:12 }}>{entry.value}</span>
              {/* Analytics indicator */}
              <span style={{
                padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                background: analyticsRead ? '#2D5BFF22' : isAnalyticsCursor ? '#2D5BFF' : 'transparent',
                color: analyticsRead ? '#2D5BFF' : isAnalyticsCursor ? '#fff' : 'transparent'
              }}>
                {isAnalyticsCursor ? '← Analytics' : analyticsRead ? 'A✓' : ''}
              </span>
              {/* Billing indicator */}
              <span style={{
                padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                background: billingRead ? '#2E9E6B22' : isBillingCursor ? '#2E9E6B' : 'transparent',
                color: billingRead ? '#2E9E6B' : isBillingCursor ? '#fff' : 'transparent'
              }}>
                {isBillingCursor ? '← Billing' : billingRead ? 'B✓' : ''}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:10 }}>
        <div style={{ padding:'10px 16px', borderRadius:8, background:'#2D5BFF11', border:'2px solid #2D5BFF' }}>
          <div style={{ fontWeight:700, color:'#2D5BFF', fontSize:13 }}>analytics-service</div>
          <div style={{ fontFamily:'IBM Plex Mono', fontSize:12 }}>
            next offset: {analyticsOffset} / {fullLog.length}
          </div>
          <div style={{ fontSize:11, color:'#7c8aa5' }}>
            {analyticsOffset === 0 ? 'At beginning — will replay from start' :
             analyticsOffset === fullLog.length ? 'Caught up!' :
             `${fullLog.length - analyticsOffset} message(s) to process`}
          </div>
        </div>
        <div style={{ padding:'10px 16px', borderRadius:8, background:'#2E9E6B11', border:'2px solid #2E9E6B' }}>
          <div style={{ fontWeight:700, color:'#2E9E6B', fontSize:13 }}>billing-service</div>
          <div style={{ fontFamily:'IBM Plex Mono', fontSize:12 }}>
            next offset: {billingOffset} / {fullLog.length}
          </div>
          <div style={{ fontSize:11, color:'#7c8aa5' }}>
            {billingOffset === 0 ? 'At beginning' :
             billingOffset === fullLog.length ? 'Caught up!' :
             `${fullLog.length - billingOffset} message(s) to process`}
          </div>
        </div>
      </div>

      <Good>
        Key insight: each consumer group has its own offset pointer.
        Resetting analytics to 0 replays all messages — billing is unaffected.
        Both groups see new messages when they advance past the old end.
      </Good>
    </div>
  )
}

/* ================================================================
   Demo 3 — Delivery Semantics Lab
   Three tabs with animated process → crash simulation
   ================================================================ */
function DeliveryLab() {
  const [tab, setTab] = useState('atleast')   // 'atmost' | 'atleast' | 'exactly'
  const [crashOn, setCrashOn] = useState(false)
  const [runs, setRuns] = useState([])        // { id, outcome }
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(null)      // current animated step label

  const TABS = [
    { id: 'atmost',   label: 'At-most-once' },
    { id: 'atleast',  label: 'At-least-once' },
    { id: 'exactly',  label: 'Exactly-once' },
  ]

  const STEPS = {
    atmost:  ['1. Read message', '2. Commit offset', '3. Process message'],
    atleast: ['1. Read message', '2. Process message', '3. Commit offset'],
    exactly: ['1. Begin transaction', '2. Process message', '3. Commit offset + transaction'],
  }

  // Which step index does "crash" affect
  const CRASH_AFTER = {
    atmost:  1,   // crash after step 2 (commit), before step 3 (process) → lost
    atleast: 2,   // crash after step 3 (process), before step 3 (commit) → duplicate
    exactly: 1,   // crash after step 2 (process), before commit → rollback, no loss
  }

  async function runOnce() {
    if (running) return
    setRunning(true)
    const steps = STEPS[tab]
    const crashAfter = CRASH_AFTER[tab]
    let outcome = 'ok'

    for (let i = 0; i < steps.length; i++) {
      setStep(steps[i])
      await new Promise(r => setTimeout(r, 600))
      if (crashOn && i + 1 === crashAfter) {
        setStep('CRASH!')
        await new Promise(r => setTimeout(r, 700))
        outcome = tab === 'atmost' ? 'lost' : tab === 'atleast' ? 'duplicate' : 'rollback'
        break
      }
    }

    if (outcome === 'ok') setStep('Done!')
    await new Promise(r => setTimeout(r, 400))
    setRuns(r => [...r, { id: r.length + 1, outcome }])
    setStep(null)
    setRunning(false)
  }

  function reset() { setRuns([]); setStep(null) }

  const counts = {
    ok:        runs.filter(r => r.outcome === 'ok').length,
    lost:      runs.filter(r => r.outcome === 'lost').length,
    duplicate: runs.filter(r => r.outcome === 'duplicate').length,
    rollback:  runs.filter(r => r.outcome === 'rollback').length,
  }

  const OUTCOME_COLOR = {
    ok:        '#2E9E6B',
    lost:      '#D9534F',
    duplicate: '#C9A227',
    rollback:  '#9B59B6',
  }
  const OUTCOME_LABEL = {
    ok:        'Processed',
    lost:      'LOST',
    duplicate: 'DUPLICATE',
    rollback:  'Rolled back (safe)',
  }

  const DESC = {
    atmost: {
      title: 'At-most-once',
      desc: 'Offset is committed BEFORE processing. If crash happens after commit but before processing → message is lost forever. Fast but unsafe.',
      color: '#D9534F',
    },
    atleast: {
      title: 'At-least-once',
      desc: 'Offset is committed AFTER processing. If crash happens after processing but before commit → message is replayed (duplicate). Most common. Requires idempotent consumer.',
      color: '#C9A227',
    },
    exactly: {
      title: 'Exactly-once',
      desc: 'A Kafka transaction wraps both processing and commit. If crash → the whole transaction rolls back. No loss, no duplicate. Requires enable.idempotence=true and heavier setup.',
      color: '#2E9E6B',
    },
  }

  const d = DESC[tab]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · delivery semantics lab</div>

      <div className="modbtns" style={{ marginBottom:14 }}>
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => { setTab(t.id); reset() }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'10px 16px', borderRadius:8, marginBottom:14, background:d.color+'11', borderLeft:`4px solid ${d.color}` }}>
        <div style={{ fontWeight:700, color:d.color, marginBottom:4 }}>{d.title}</div>
        <div style={{ fontSize:14 }}>{d.desc}</div>
      </div>

      <div style={{ marginBottom:14 }}>
        <span style={{ marginRight:16, fontWeight:600 }}>Crash simulation:</span>
        <button
          className={crashOn ? 'act' : 'ghost act'}
          style={{ background: crashOn ? '#D9534F' : undefined, borderColor:'#D9534F', color: crashOn ? '#fff' : '#D9534F' }}
          onClick={() => setCrashOn(c => !c)}
        >
          {crashOn ? 'Crash ON (mid-run)' : 'Crash OFF'}
        </button>
      </div>

      {/* Steps display */}
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {STEPS[tab].map((s, i) => (
          <div key={i} style={{
            padding:'8px 14px', borderRadius:20, fontSize:13, fontWeight:600,
            background: step === s ? d.color : step === 'CRASH!' && i + 1 === CRASH_AFTER[tab] ? '#D9534F22' : '#f0f0f0',
            color: step === s ? '#fff' : '#555',
            border: `2px solid ${step === s ? d.color : '#ddd'}`,
            transition: 'all 0.3s'
          }}>
            {s}
          </div>
        ))}
        {step === 'CRASH!' && (
          <div style={{ padding:'8px 14px', borderRadius:20, fontSize:13, fontWeight:700, background:'#D9534F', color:'#fff', border:'2px solid #D9534F' }}>
            CRASH!
          </div>
        )}
        {step === 'Done!' && (
          <div style={{ padding:'8px 14px', borderRadius:20, fontSize:13, fontWeight:700, background:'#2E9E6B', color:'#fff' }}>
            Done!
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:14 }}>
        <button className="act" onClick={runOnce} disabled={running}>
          {running ? 'Running...' : 'Run once'}
        </button>
        <button className="ghost act" onClick={reset}>Reset tally</button>
      </div>

      {/* Tally */}
      {runs.length > 0 && (
        <div>
          <div style={{ fontWeight:700, marginBottom:8 }}>Tally after {runs.length} run(s):</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
            {Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => (
              <div key={k} style={{
                padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:700,
                background: OUTCOME_COLOR[k] + '22', color: OUTCOME_COLOR[k], border:`1px solid ${OUTCOME_COLOR[k]}`
              }}>
                {OUTCOME_LABEL[k]}: {v}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {runs.map(r => (
              <div key={r.id} style={{
                width:28, height:28, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, fontWeight:700, background: OUTCOME_COLOR[r.outcome]+'22',
                color: OUTCOME_COLOR[r.outcome], border:`1px solid ${OUTCOME_COLOR[r.outcome]}`
              }} title={OUTCOME_LABEL[r.outcome]}>
                {r.id}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   Quiz data
   ================================================================ */
const QUESTIONS = [
  {
    q: 'What is the key difference between Kafka and a traditional message queue like RabbitMQ?',
    o: [
      'RabbitMQ supports more consumers per topic than Kafka',
      'Kafka is faster than RabbitMQ in all scenarios',
      'Kafka retains messages in an immutable log; multiple consumer groups can replay independently',
      'Kafka automatically deletes messages after they are consumed',
    ],
    a: 2,
    e: 'Kafka is a distributed log — messages persist for a configurable retention period and each consumer group tracks its own offset. Traditional queues delete messages after delivery to one consumer.',
    w: {
      0: 'RabbitMQ does not inherently support more consumers; the models are fundamentally different (work-queue vs distributed-log).',
      1: 'Speed is not the defining difference; Kafka trades some latency for durability and fan-out, and is not universally faster.',
      3: 'This describes traditional queues. Kafka keeps messages and lets each consumer group replay from any offset.',
    },
    r: { id: 's1', label: 'Section 1 — newspaper analogy & Kafka vs traditional queue' },
  },
  {
    q: 'You want all events for the same userId to be processed in order. Which producer configuration achieves this in Kafka?',
    o: [
      'Use userId as the message key so hash(key) % N always routes to the same partition',
      'Use a single partition for the entire topic',
      'Set auto.offset.reset=earliest on the consumer',
      'Set enable.idempotence=true on the producer',
    ],
    a: 0,
    e: 'Kafka guarantees ordering within a partition. Using the userId as the key ensures all events for that user go to the same partition via hash(key) % numPartitions, giving FIFO per user.',
    w: {
      1: 'A single partition works but kills horizontal scalability — the whole point of partitions is to parallelise.',
      2: 'auto.offset.reset controls where a new consumer group starts reading, not how the producer routes messages.',
      3: 'enable.idempotence prevents duplicate writes from the producer but does not control which partition a message goes to.',
    },
    r: { id: 's3', label: 'Section 3 — producers & ordering guarantee per key' },
  },
  {
    q: 'A consumer group has 3 consumers and the topic has 6 partitions. How does Kafka assign partitions?',
    o: [
      'Each consumer is assigned 2 partitions so that no partition is read by more than one consumer in the group',
      'Each partition is broadcast to all 3 consumers',
      'Partitions are assigned randomly each time a message arrives',
      'All 6 partitions are assigned to the fastest consumer',
    ],
    a: 0,
    e: 'Kafka assigns each partition to exactly one consumer within a consumer group. 6 partitions / 3 consumers = 2 partitions each, enabling parallel consumption without duplicate processing.',
    w: {
      1: 'Broadcasting every message to all consumers is what a fan-out pattern does, not a consumer group. Consumer groups are for parallel work-distribution.',
      2: 'Partition assignment is determined during group coordination (rebalance), not per message.',
      3: 'Kafka does not measure consumer speed for assignment; it distributes partitions as evenly as possible.',
    },
    r: { id: 's2', label: 'Section 2 — core concepts: consumer group & partition assignment' },
  },
  {
    q: 'At-least-once delivery commits the offset AFTER processing. What is the risk?',
    o: [
      'Messages are never replayed, even after a reset',
      'Only one consumer group can use at-least-once semantics',
      'Messages may be permanently lost if the consumer crashes',
      'The same message may be processed more than once if the consumer crashes after processing but before committing',
    ],
    a: 3,
    e: 'With at-least-once, if the consumer crashes after doing the work but before committing the offset, Kafka replays that message on restart — causing a duplicate. The fix is an idempotent consumer that deduplicates by eventId.',
    w: {
      0: 'Messages are definitely replayed in at-least-once — that is the whole point of committing after processing.',
      1: 'Delivery semantics are per consumer group and any number of groups can use at-least-once.',
      2: 'Message loss is the risk of at-MOST-once (commit before processing). At-least-once errs on the side of replaying.',
    },
    r: { id: 's7', label: 'Section 7 — delivery semantics & commit timing' },
  },
  {
    q: 'What is log compaction in Kafka?',
    o: [
      'Compressing messages with gzip to save disk space',
      'Merging multiple partitions into one to reduce broker count',
      'Deleting all messages older than the retention period simultaneously',
      'Retaining only the latest message per key, discarding older values for the same key',
    ],
    a: 3,
    e: 'Log compaction keeps the most recent value for each key and removes earlier values. It is used when you care about the current state per entity (like a user profile), not every historical event.',
    w: {
      0: 'Compression is a separate producer/broker setting (compression.type). Log compaction is about which messages to keep, not their encoding.',
      1: 'Kafka does not merge partitions; that would break ordering and consumer assignments.',
      2: 'Time-based deletion is normal retention. Log compaction is key-based, not time-based.',
    },
    r: { id: 's9', label: 'Section 9 — log compaction' },
  },
  {
    q: 'What happens during a Kafka consumer group rebalance?',
    o: [
      'The consumer group is permanently dissolved and must be recreated',
      'Consumers stop consuming briefly while Kafka redistributes partitions among the group',
      'The broker deletes all messages that were not yet committed',
      'A new topic is created to hold unprocessed messages',
    ],
    a: 1,
    e: 'A rebalance redistributes partition ownership — triggered when a consumer joins or leaves the group. In older Kafka versions this was stop-the-world. Modern Kafka (2.4+) uses incremental cooperative rebalancing to minimise the pause.',
    w: {
      0: 'The consumer group persists; only partition assignments change.',
      2: 'Kafka does not delete uncommitted messages during rebalance; the log is immutable and offsets are just pointers.',
      3: 'No new topics are created; partitions are simply reassigned to the remaining consumers.',
    },
    r: { id: 's10', label: 'Section 10 — rebalancing & when to use Kafka' },
  },
  {
    q: 'You want to replay all events from the beginning of a Kafka topic in a new analytics service. What do you do?',
    o: [
      'Delete and recreate the topic to start fresh',
      'Tell existing consumers to stop so the new service can read',
      'Use a new consumer group with auto.offset.reset=earliest',
      'Set retention.ms=0 to force Kafka to resend all messages',
    ],
    a: 2,
    e: 'A new consumer group has no committed offset. Setting auto.offset.reset=earliest tells Kafka to start from offset 0. Existing consumers are completely unaffected — each group has its own offset.',
    w: {
      0: 'Deleting and recreating the topic destroys all existing data; that is the opposite of replaying.',
      1: 'Existing consumers do not need to stop. Consumer groups are independent; one reading does not block another.',
      3: 'retention.ms=0 would delete messages immediately, not replay them.',
    },
    r: { id: 's5', label: 'Section 5 — consumer groups & offset tracking' },
  },
  {
    q: 'Which Kafka concept is most similar to the "page offset" in a database cursor?',
    o: ['Partition', 'Offset', 'Topic', 'Consumer Group'],
    a: 1,
    e: 'The offset is a sequential integer that marks the consumer\'s position in a partition log — exactly like a cursor position. To replay, set it back to 0. To skip old messages, set it to the latest offset.',
    w: {
      0: 'A partition is the physical log shard, like a table shard — not the position within it.',
      2: 'A topic is the named category, like a table name — not a position.',
      3: 'A consumer group is a set of consumers sharing work — not a position concept.',
    },
    r: { id: 's2', label: 'Section 2 — core concepts: offset' },
  },
]

/* ================================================================
   Day 94 Page
   ================================================================ */
export default function Day94() {
  return (
    <div className="scrollarea">

      {/* ── HERO ── */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 94</div>
        <h1>Kafka &amp; Distributed Messaging:<br />Topics, Partitions &amp; Consumer Groups</h1>
        <p>
          Kafka is not just a faster queue — it is a <strong>distributed log</strong>.
          Messages are written once and read by many services, each at their own pace.
          Click every demo to see why this changes everything.
        </p>
        <div className="chips">
          {['Kafka','Topic','Partition','Consumer Group','Offset','At-Least-Once','Log Compaction','Rebalancing']
            .map(c => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      {/* ── S1: Analogy + Traditional Queue vs Kafka ── */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The Newspaper Printing Press Analogy</h2>
        <p>
          Imagine a big newspaper company. Every morning the press prints today's paper.
          Thousands of readers each pick up their own copy at their own time.
          The press keeps back-issues for 7 days — miss today? Get the archive copy.
          The press does not care what you do with the paper.
        </p>
        <p>
          Kafka is that printing press. The press is the <strong>broker</strong>.
          Today's paper is a <strong>topic</strong>. Each reader is a <strong>consumer group</strong>.
          The archive shelf is the <strong>retained log</strong>.
        </p>

        <Note>
          A traditional message queue (like RabbitMQ) is a <strong>post office</strong> — one letter,
          one recipient, then the letter is destroyed. Kafka is a <strong>printing press</strong> —
          one original, unlimited independent readers, archive kept.
        </Note>

        <Code html={`<span class="cm">Traditional Queue (RabbitMQ, SQS):</span>

  Producer → [Queue] → Consumer A   (message deleted after delivery)
                       Consumer B   (never sees it — too late)

  <span class="cm">One consumer, one delivery, message gone.</span>


<span class="cm">Kafka (Distributed Log):</span>

  Producer → [Partition Log: offset 0, 1, 2, 3, 4 ...]
                 │                         │
          ConsumerGroup "analytics"  ConsumerGroup "billing"
             (offset pointer: 3)        (offset pointer: 1)
             reads at own pace          reads at own pace

  <span class="cm">Messages retained for N days (default 7).</span>
  <span class="cm">Each group tracks its own position. Neither blocks the other.</span>
  <span class="cm">Either group can replay by resetting offset to 0.</span>`} />

        <Good>
          Rule of thumb: use a traditional queue when you want <em>work distribution</em> (one task, one worker).
          Use Kafka when you want <em>event fan-out</em> (one event, many independent consumers)
          or <em>replay</em>.
        </Good>
      </section>

      {/* ── S2: Core Concepts ── */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Core Concepts: Topic, Partition, Offset, Consumer Group, Broker</h2>

        <p><strong>Topic</strong> — a named category of events. Like a database table name. Example: <C>order-events</C>, <C>user-signups</C>.</p>
        <p><strong>Partition</strong> — a topic is split into N ordered, immutable sub-logs. Each partition lives on one broker. Partitions allow horizontal scaling.</p>
        <p><strong>Offset</strong> — each message in a partition gets a sequential integer (0, 1, 2 ...). A consumer tracks its offset to know where it is. To replay: reset to 0.</p>
        <p><strong>Consumer Group</strong> — a set of consumers that jointly read a topic. Kafka assigns each partition to exactly one consumer in the group at a time. No partition is read by two consumers in the same group simultaneously.</p>
        <p><strong>Broker</strong> — a Kafka server. A cluster has many brokers. Each partition has one <em>leader</em> broker (handles reads/writes) and N-1 <em>replica</em> brokers for fault tolerance.</p>

        <Code html={`<span class="cm">Topic: "order-events",  4 partitions,  2-replica cluster</span>

  Partition 0:  [msg@0] [msg@1] [msg@2] [msg@3] ...  ← leader: Broker 1
  Partition 1:  [msg@0] [msg@1] [msg@2] ...           ← leader: Broker 2
  Partition 2:  [msg@0] [msg@1] ...                   ← leader: Broker 1
  Partition 3:  [msg@0] [msg@1] [msg@2] [msg@3] [msg@4]  ← leader: Broker 2

  Consumer Group "analytics"  (3 consumers):
    Consumer A  →  Partition 0,  Partition 1
    Consumer B  →  Partition 2
    Consumer C  →  Partition 3

  Consumer Group "billing"  (1 consumer):
    Consumer X  →  ALL four partitions   (one consumer can own many)`} />

        <Reveal summary="Why does having more partitions than consumers waste nothing?">
          <p>
            A single consumer can own multiple partitions and reads them all sequentially.
            You only lose parallelism if you have <em>fewer</em> partitions than consumers — extra
            consumers sit idle. More partitions always means more throughput potential,
            but each partition is a file on disk, so don't create thousands unnecessarily.
          </p>
        </Reveal>
      </section>

      {/* ── S3: Producers ── */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Producers: Routing Messages to Partitions</h2>
        <p>
          The producer decides which partition a message goes to.
          It has three strategies:
        </p>
        <ul>
          <li><strong>Key-based (most common)</strong> — <C>hash(key) % numPartitions</C>. The same key always goes to the same partition. Use when you need ordering per entity (e.g. all events for one order must be in order).</li>
          <li><strong>Round-robin</strong> — no key provided. Messages spread evenly across partitions. Best for maximum throughput when order doesn't matter.</li>
          <li><strong>Custom partitioner</strong> — your own Java class implementing <C>Partitioner</C>. Rare.</li>
        </ul>

        <Warn>
          Kafka only guarantees ordering <strong>within a partition</strong>.
          Across partitions, there is no ordering guarantee.
          If you need event A to be processed before event B, they must go to the same partition.
        </Warn>

        <Code html={`<span class="cm">// Producer — sends OrderEvents to "order-events" topic</span>
<span class="kw">Properties</span> props = <span class="kw">new</span> Properties();
props.put(<span class="str">"bootstrap.servers"</span>,  <span class="str">"kafka1:9092,kafka2:9092"</span>); <span class="cm">// cluster entry points</span>
props.put(<span class="str">"key.serializer"</span>,      <span class="str">"...StringSerializer"</span>);      <span class="cm">// serialize key to bytes</span>
props.put(<span class="str">"value.serializer"</span>,    <span class="str">"...JsonSerializer"</span>);        <span class="cm">// serialize value to bytes</span>
props.put(<span class="str">"enable.idempotence"</span>,  <span class="str">"true"</span>);                      <span class="cm">// retry without duplicates</span>

<span class="kw">KafkaProducer</span>&lt;String, OrderEvent&gt; producer = <span class="kw">new</span> <span class="kw">KafkaProducer</span>&lt;&gt;(props);

<span class="cm">// Key = order.id()  →  hash("order-42") % 4  →  always same partition</span>
producer.send(
    <span class="kw">new</span> <span class="kw">ProducerRecord</span>&lt;&gt;(
        <span class="str">"order-events"</span>,   <span class="cm">// topic</span>
        order.id(),        <span class="cm">// key   ← determines partition</span>
        orderEvent         <span class="cm">// value ← the payload</span>
    ),
    (metadata, ex) -&gt; {
        <span class="kw">if</span> (ex != <span class="kw">null</span>)
            log.error(<span class="str">"Send failed"</span>, ex);
        <span class="kw">else</span>
            log.info(<span class="str">"partition={} offset={}"</span>,
                metadata.partition(), metadata.offset());
    }
);</pre>

<pre><span class="cm">Ordering guarantee per key:</span>

  order-42 events:  Created → PaymentReceived → Shipped
                    (all go to Partition 2, processed in FIFO order)

  order-99 events:  Created → PaymentReceived → Shipped
                    (all go to Partition 0, processed in FIFO order)

  <span class="cm">Partition 0 and Partition 2 are consumed in parallel — no cross-order guarantee.</span>`} />
      </section>

      {/* ── S4: Demo 1 ── */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: Partition Routing + Consumer Rebalance</h2>
        <p>
          Send messages with keys and watch where they land. Toggle to round-robin to see the difference.
          Then crash Consumer A and watch Kafka rebalance partitions to Consumer B.
        </p>
        <PartitionRoutingDemo />
        <Note>
          Notice that the same key (e.g. order-3) always lands in the same partition, no matter how many messages you send.
          This is the ordering guarantee. In round-robin mode, consecutive messages scatter across all partitions.
        </Note>
      </section>

      {/* ── S5: Consumer Groups + Offset ── */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Consumer Groups: Independent Consumption &amp; Offset Management</h2>
        <p>
          Each consumer group has its own offset for each partition it reads.
          Groups are completely independent. One group reading fast does not slow down another.
          One group replaying from offset 0 does not affect any other group.
        </p>

        <Code html={`<span class="cm">// Consumer — reads "order-events" topic</span>
<span class="kw">Properties</span> cProps = <span class="kw">new</span> Properties();
cProps.put(<span class="str">"bootstrap.servers"</span>,    <span class="str">"kafka1:9092,kafka2:9092"</span>);
cProps.put(<span class="str">"group.id"</span>,             <span class="str">"analytics-service"</span>);   <span class="cm">// consumer group name</span>
cProps.put(<span class="str">"enable.auto.commit"</span>,   <span class="str">"false"</span>);             <span class="cm">// we commit manually</span>
cProps.put(<span class="str">"auto.offset.reset"</span>,    <span class="str">"earliest"</span>);          <span class="cm">// if no offset saved, start from 0</span>
cProps.put(<span class="str">"key.deserializer"</span>,     <span class="str">"...StringDeserializer"</span>);
cProps.put(<span class="str">"value.deserializer"</span>,   <span class="str">"...JsonDeserializer"</span>);

<span class="kw">KafkaConsumer</span>&lt;String, OrderEvent&gt; consumer = <span class="kw">new</span> <span class="kw">KafkaConsumer</span>&lt;&gt;(cProps);
consumer.subscribe(List.of(<span class="str">"order-events"</span>));

<span class="kw">while</span> (<span class="kw">true</span>) {
    <span class="cm">// poll() asks Kafka for a batch of messages (max 100ms wait)</span>
    ConsumerRecords&lt;String, OrderEvent&gt; records = consumer.poll(Duration.ofMillis(<span class="num">100</span>));

    <span class="kw">for</span> (ConsumerRecord&lt;String, OrderEvent&gt; record : records) {
        log.info(<span class="str">"partition={} offset={} key={}"</span>,
            record.partition(), record.offset(), record.key());
        process(record.value());   <span class="cm">// do the actual work</span>
    }

    consumer.commitSync();         <span class="cm">// commit after processing the whole batch</span>
                                   <span class="cm">// at-least-once: offset committed after work done</span>
}`} />

        <Reveal summary="auto.offset.reset: earliest vs latest — what is the difference?">
          <p>
            <C>earliest</C>: if this consumer group has no saved offset (brand-new group, or topic deleted),
            start reading from the very first message in the partition.
            This is replay mode for new services.
          </p>
          <p>
            <C>latest</C>: if no saved offset, start from the <em>newest</em> message — ignore history.
            This is the right choice when historical events are not relevant (e.g. real-time metrics).
          </p>
        </Reveal>

        <Reveal summary="What is the difference between auto-commit and manual commit?">
          <p>
            <C>enable.auto.commit=true</C> commits offsets in a background thread every 5 seconds.
            Simple but risky — the offset may be committed before you finish processing the messages
            in that batch (at-most-once behaviour by accident).
          </p>
          <p>
            <C>enable.auto.commit=false</C> gives you control: call <C>consumer.commitSync()</C> after
            processing each batch. This gives at-least-once semantics. Almost all production code uses manual commit.
          </p>
        </Reveal>
      </section>

      {/* ── S6: Demo 2 ── */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>Play: Consumer Group Offset Tracker</h2>
        <p>
          One partition, two consumer groups. Advance each independently.
          Reset analytics to 0 to replay — notice billing is unaffected.
          Add a new message and watch both groups see it when they advance.
        </p>
        <OffsetTrackerDemo />
        <Good>
          This is why Kafka is called a "distributed log" and not a "queue".
          The log is permanent (within retention). The consumer's position is just a pointer.
          Moving the pointer back = replay. Moving it forward = skip.
        </Good>
      </section>

      {/* ── S7: Delivery Semantics ── */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Delivery Semantics: At-Most-Once, At-Least-Once, Exactly-Once</h2>
        <p>
          The question is: <em>when do you commit the offset?</em>
          The answer determines what happens when the consumer crashes mid-run.
        </p>

        <Code html={`<span class="cm">At-most-once  (commit BEFORE processing):</span>
  1. Read message at offset 5
  2. Commit offset → now saved as 6       ← if crash here ...
  3. Process message                       ← ... this never happens → LOST

<span class="cm">At-least-once  (commit AFTER processing — most common):</span>
  1. Read message at offset 5
  2. Process message                       ← if crash here (after processing) ...
  3. Commit offset → now saved as 6       ← ... offset still 5 → replayed → DUPLICATE

<span class="cm">Exactly-once  (Kafka transaction):</span>
  1. Begin transaction
  2. Process message
  3. Commit offset + transaction atomically  ← crash = rollback → no loss, no duplicate`} />

        <Note>
          <strong>At-least-once + idempotent consumer = effectively exactly-once</strong> without the heavy
          transaction machinery. The idempotent consumer deduplicates by <C>eventId</C>: if the same event
          is replayed, it is a no-op. This is the most common production pattern.
        </Note>

        <Code html={`<span class="cm">// Idempotent consumer — handles at-least-once duplicates safely</span>
<span class="kw">private</span> Set&lt;String&gt; processedEventIds = <span class="kw">new</span> HashSet&lt;&gt;(); <span class="cm">// or use Redis/DB</span>

<span class="kw">void</span> processEvent(OrderEvent event) {
    <span class="cm">// if we already processed this event, skip it (it is a replay)</span>
    <span class="kw">if</span> (processedEventIds.contains(event.eventId())) {
        log.info(<span class="str">"Skipping duplicate event: {}"</span>, event.eventId());
        <span class="kw">return</span>;
    }

    doActualWork(event);                       <span class="cm">// the real business logic</span>
    processedEventIds.add(event.eventId());    <span class="cm">// remember we handled it</span>
    <span class="cm">// offset committed by the caller after this method returns</span>
}`} />

        <table className="matrix" style={{ marginTop: 16 }}>
          <thead>
            <tr><th>Semantic</th><th>Offset committed</th><th>Risk</th><th>Cost</th><th>When to use</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>At-most-once</strong></td>
              <td>Before processing</td>
              <td className="no">Message loss</td>
              <td className="yes">Low</td>
              <td>Metrics where loss is OK</td>
            </tr>
            <tr>
              <td><strong>At-least-once</strong></td>
              <td>After processing</td>
              <td className="no">Duplicates</td>
              <td className="yes">Medium</td>
              <td>Most services (idempotent consumer)</td>
            </tr>
            <tr>
              <td><strong>Exactly-once</strong></td>
              <td>In a transaction</td>
              <td className="yes">None</td>
              <td className="no">High</td>
              <td>Financial transfers, critical dedup</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── S8: Demo 3 ── */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>Play: Delivery Semantics Lab</h2>
        <p>
          Pick a semantic. Toggle the crash simulation on. Run it several times and watch the tally.
          Notice how at-most-once loses messages, at-least-once creates duplicates, and exactly-once rolls back safely.
        </p>
        <DeliveryLab />
        <Warn>
          In the real world, exactly-once requires <C>enable.idempotence=true</C> on the producer plus
          transactional API calls. The heavy machinery means lower throughput. Use at-least-once + idempotent consumer
          for the best balance in most systems.
        </Warn>
      </section>

      {/* ── S9: Log Compaction ── */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Log Compaction: Keep the Latest Value Per Key</h2>
        <p>
          Normal Kafka retention says: <em>delete messages older than N days</em>.
          Log compaction says: <em>keep the latest message per key, forever</em>. Older values for the same key are removed.
        </p>
        <p>
          Think of it as a key-value store where Kafka has compressed all the updates into just the current state.
        </p>

        <Code html={`<span class="cm">Before compaction  (time-ordered log, key:value):</span>

  offset 0:  user42 → "Alice"
  offset 1:  user99 → "Bob"
  offset 2:  user42 → "Alice M."      <span class="cm">// same key as offset 0 — will replace it</span>
  offset 3:  user99 → "Bob S."        <span class="cm">// same key as offset 1 — will replace it</span>
  offset 4:  user42 → "Alice Morgan"  <span class="cm">// again — latest for user42</span>

<span class="cm">After compaction  (only latest per key survives):</span>

  user42 → "Alice Morgan"    <span class="cm">// offsets 0, 2 deleted</span>
  user99 → "Bob S."          <span class="cm">// offset 1 deleted</span>

<span class="cm">Use cases:</span>
  - User profile updates (only current profile matters)
  - Shopping cart state (only current cart matters)
  - Database change-data-capture (CDC) — final state per row`} />

        <Note>
          A <strong>tombstone</strong> is a message with a key and a <C>null</C> value.
          It tells the compactor: "delete this key entirely". Used when an entity is deleted.
          After compaction, the tombstone itself is also removed.
        </Note>

        <Reveal summary="Log compaction vs event sourcing — what is the connection?">
          <p>
            Event sourcing stores every state change as an immutable event (the full log).
            Log compaction gives you a shortcut: instead of replaying 10,000 events to rebuild
            current state, a new consumer can start from the compacted log (just the latest values)
            and then catch up from the real-time tail.
            This is exactly how Kafka Streams and Flink bootstrap state from changelog topics.
          </p>
        </Reveal>
      </section>

      {/* ── S10: Kafka vs Others, Rebalancing, When to Use, Cheat Sheet ── */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Kafka vs Other Queues, Rebalancing &amp; Cheat Sheet</h2>

        <h3 style={{ marginTop: 0 }}>Kafka vs RabbitMQ vs AWS SQS</h3>
        <table className="matrix">
          <thead>
            <tr><th>Feature</th><th>Kafka</th><th>RabbitMQ</th><th>AWS SQS</th></tr>
          </thead>
          <tbody>
            <tr><td>Message model</td><td>Immutable log</td><td>Work queue</td><td>Work queue</td></tr>
            <tr><td>Multiple consumers</td><td className="yes">Yes (consumer groups)</td><td className="no">One consumer per message</td><td className="no">One consumer per message</td></tr>
            <tr><td>Replay</td><td className="yes">Yes (reset offset)</td><td className="no">No (message gone after delivery)</td><td className="no">No</td></tr>
            <tr><td>Retention</td><td>Configurable (days/weeks)</td><td>Until delivered</td><td>Up to 14 days</td></tr>
            <tr><td>Throughput</td><td className="yes">Millions/sec</td><td>Thousands/sec</td><td>Thousands/sec</td></tr>
            <tr><td>Ordering</td><td>Per partition</td><td>Per queue</td><td>FIFO queues only</td></tr>
            <tr><td>Setup</td><td className="no">Complex</td><td>Medium</td><td className="yes">Managed (easy)</td></tr>
          </tbody>
        </table>

        <h3>Rebalancing</h3>
        <p>
          A <strong>rebalance</strong> happens when any consumer in a group joins, leaves, or crashes.
          Kafka needs to redistribute partitions. In older Kafka, all consumers paused during this
          (stop-the-world). Modern Kafka (2.4+) uses <em>incremental cooperative rebalancing</em>:
          only partitions that need to move are reassigned; the rest keep consuming.
        </p>
        <Warn>
          Frequent rebalances are a symptom of consumers taking too long per message (exceeding
          <C>max.poll.interval.ms</C>). Kafka interprets silence as a crash. Fix: process faster
          or increase the timeout.
        </Warn>

        <h3>When to use Kafka</h3>
        <ul>
          <li>You need <strong>multiple services</strong> to consume the same event stream (fan-out).</li>
          <li>You need <strong>replay</strong> — replay history for a new service, reprocess after a bug fix.</li>
          <li>You need <strong>very high throughput</strong> (millions of events/second).</li>
          <li>You are building <strong>event sourcing</strong> or a <strong>data pipeline</strong>.</li>
          <li>You need an <strong>audit log</strong> — Kafka's immutable log is a natural audit trail.</li>
        </ul>
        <Note>
          <strong>When NOT to use Kafka:</strong> simple task distribution (RabbitMQ/SQS is easier),
          request-reply RPC patterns (use gRPC or REST), or when you need sub-millisecond latency
          (Kafka's batch nature adds tens of milliseconds).
        </Note>

        <h3>Cheat sheet</h3>
        <ul>
          <li><strong>Topic</strong> — named event category. <strong>Partition</strong> — ordered sub-log within a topic. <strong>Offset</strong> — position in a partition.</li>
          <li><strong>Broker</strong> — a Kafka server. Cluster = many brokers. Each partition has one leader broker.</li>
          <li><strong>Consumer Group</strong> — each partition assigned to exactly one consumer in the group. N consumers, M partitions: each consumer gets M/N partitions (roughly).</li>
          <li><strong>Key-based routing</strong> — <C>hash(key) % N</C> — same key, same partition, ordering guaranteed per key.</li>
          <li><strong>At-most-once</strong> — commit before process (can lose). <strong>At-least-once</strong> — commit after process (can duplicate). <strong>Exactly-once</strong> — transaction (no loss, no dup, more complex).</li>
          <li><strong>Log compaction</strong> — keep latest per key. Normal retention — keep by time/size.</li>
          <li><strong>Rebalance</strong> — triggered when consumer joins/leaves. Partitions redistributed.</li>
          <li><strong>auto.offset.reset=earliest</strong> — new group starts from beginning. <strong>latest</strong> — skip history.</li>
        </ul>
      </section>

      {/* ── INTERVIEW CORNER ── */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>6 Questions Interviewers Actually Ask About Kafka</h2>

        <Reveal summary="1. What is a Kafka partition and why does it matter?">
          <p>
            A partition is an ordered, immutable, append-only log that holds a subset of a topic's messages.
            It matters for two reasons:
          </p>
          <ul>
            <li><strong>Parallelism</strong> — different consumers in a group each own different partitions, so a topic with 8 partitions can be consumed by up to 8 consumers in parallel.</li>
            <li><strong>Ordering</strong> — Kafka only guarantees message order within a single partition. If you need ordered processing, all related messages must go to the same partition (use a consistent key).</li>
          </ul>
          <p>
            Partitions also determine the maximum parallelism. If a topic has 4 partitions, adding a 5th consumer to the group does nothing — one consumer will sit idle.
          </p>
        </Reveal>

        <Reveal summary="2. How does Kafka guarantee ordering? What is the caveat?">
          <p>
            Kafka guarantees that messages within a single partition are consumed in the order they were produced.
            This is because each partition is an append-only log with monotonically increasing offsets.
          </p>
          <p>
            <strong>Caveat:</strong> there is no ordering guarantee across partitions.
            If order-42 events go to Partition 0 and order-43 events go to Partition 1,
            those two streams may be interleaved in any order.
            The fix: use a message key so that all events for the same entity always go to the same partition.
          </p>
          <p>
            <strong>Second caveat:</strong> with <C>enable.idempotence=false</C> (old default) and retries,
            a producer retry could write a message out-of-order if the original message eventually also succeeds.
            Always set <C>enable.idempotence=true</C> in modern Kafka.
          </p>
        </Reveal>

        <Reveal summary="3. What is the difference between at-least-once and exactly-once? When do you need each?">
          <p>
            <strong>At-least-once:</strong> offset committed after processing. If the consumer crashes after processing
            but before committing, the message is replayed on restart. You may process the same message twice.
            Requires an idempotent consumer (dedup by eventId) to make it safe.
          </p>
          <p>
            <strong>Exactly-once:</strong> Kafka transactions ensure that the offset commit and any output write
            happen atomically. A crash causes a rollback — the message is neither lost nor duplicated.
            Requires <C>enable.idempotence=true</C> on the producer, the transactional API, and a consumer
            configured to read only committed data (<C>isolation.level=read_committed</C>).
          </p>
          <p>
            <strong>When to use exactly-once:</strong> financial ledger updates where a duplicate charge is catastrophic.
            For most systems (analytics, notifications, search indexing), at-least-once + idempotent consumer
            is simpler and performs better.
          </p>
        </Reveal>

        <Reveal summary="4. What is a consumer group and how does partition assignment work?">
          <p>
            A consumer group is a set of consumer instances identified by a shared <C>group.id</C>.
            They collectively consume a topic.
          </p>
          <p>
            Kafka uses a <em>Group Coordinator</em> (a designated broker) to manage assignment.
            One consumer in the group is elected <em>Group Leader</em> and performs the partition assignment
            using the configured <em>PartitionAssignor</em> (default: RangeAssignor or CooperativeStickyAssignor).
            The assignment is then sent back to the coordinator, which distributes it to all consumers.
          </p>
          <p>
            Rule: each partition is assigned to <strong>at most one consumer</strong> in the group at any moment.
            If you have fewer consumers than partitions, some consumers handle multiple partitions.
            If you have more consumers than partitions, the extra consumers sit idle.
          </p>
        </Reveal>

        <Reveal summary="5. What is log compaction and when would you use it?">
          <p>
            Log compaction is a retention policy where Kafka periodically scans a topic's partitions
            and removes all but the <strong>latest message for each key</strong>.
            Unlike time-based retention (delete messages older than 7 days), compaction is key-based.
          </p>
          <p>
            <strong>Use cases:</strong>
          </p>
          <ul>
            <li>Database change-data-capture (CDC) topics — the compacted log is the current DB state.</li>
            <li>User profile or settings topics — you only need the latest value per userId.</li>
            <li>Kafka Streams changelog topics — internal state stores are bootstrapped from compacted topics.</li>
          </ul>
          <p>
            A <strong>tombstone</strong> (key + null value) signals deletion — the compactor eventually removes
            even the tombstone after a configurable delete.retention.ms period.
          </p>
        </Reveal>

        <Reveal summary="6. What happens during a consumer group rebalance and why is it a problem?">
          <p>
            A rebalance is triggered when a consumer joins or leaves the group (including crashes or slow poll loops).
            Kafka redistributes all partitions among the current members.
          </p>
          <p>
            <strong>The problem (old Kafka):</strong> stop-the-world. All consumers stop consuming while
            the new assignment is computed and distributed. For large groups or high-volume topics, this
            causes visible latency spikes and lag buildup.
          </p>
          <p>
            <strong>Modern fix (Kafka 2.4+ with CooperativeStickyAssignor):</strong> incremental cooperative
            rebalancing. Only the partitions that genuinely need to move are revoked and reassigned.
            The rest keep consuming without interruption.
          </p>
          <p>
            <strong>Common cause of unwanted rebalances:</strong> consumer takes longer than
            <C>max.poll.interval.ms</C> (default 5 minutes) between <C>poll()</C> calls.
            Kafka assumes it is dead and triggers a rebalance. Fix: process faster, increase the timeout,
            or use async processing with manual partition assignment.
          </p>
        </Reveal>
      </section>

      {/* ── QUIZ ── */}
      <section id="quiz">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* ── FOOTER ── */}
      <div className="footer">
        <strong>Day 94 complete?</strong> Homework: Design a simple order-tracking system using Kafka.
        Sketch out: what topics you would create, how many partitions, what key you would use for the producer,
        and how many consumer groups you would have (hint: analytics, billing, notifications are separate concerns).
        Write the producer and consumer setup in Java from memory using the snippets on this page as a guide.
        <br /><br />
        Next: <strong>Day 95 — Distributed Transactions</strong>: two-phase commit, sagas, and how to keep data
        consistent across microservices when you cannot use a single database transaction.
      </div>

    </div>
  )
}
