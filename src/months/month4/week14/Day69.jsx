import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Topic log & producer
   Shows: topic is an append-only sequence of messages.
   ============================================================ */
let _nextOffset = 0

function TopicLogDemo() {
  const [log, setLog] = useState([])
  const [nextOff, setNextOff] = useState(0)

  function publish(topic) {
    const payloads = {
      orders:   ['Order #1042 placed', 'Order #1043 placed', 'Order #1044 placed', 'Order #1045 placed', 'Order #1046 placed'],
      payments: ['Payment ₹280 received', 'Payment ₹560 received', 'Payment ₹140 received', 'Payment ₹380 received'],
    }
    const pool = payloads[topic]
    const payload = pool[nextOff % pool.length]
    const offset = nextOff
    const msg = { id: `msg-${offset}`, topic, payload, offset, time: new Date().toLocaleTimeString() }
    setLog(prev => [...prev, msg])
    setNextOff(o => o + 1)
  }

  function reset() { setLog([]); setNextOff(0) }

  const topicColors = { orders: '#E3F2FD', payments: '#F3E5F5' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · publish messages to topics — watch the append-only log grow</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button className="act" onClick={() => publish('orders')}>📦 Publish to "orders"</button>
        <button className="act" style={{ background: '#7b3fa0' }} onClick={() => publish('payments')}>💳 Publish to "payments"</button>
        <button className="act ghost" onClick={reset}>Reset</button>
      </div>
      {log.length === 0
        ? <div style={{ color: '#7c8aa5', fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '20px 0' }}>
            Click a publish button — each click appends one message to the log.
          </div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {log.map(m => (
              <div key={m.id} style={{
                display: 'flex', gap: 10, alignItems: 'center',
                background: topicColors[m.topic] || '#f5f5f2',
                borderRadius: 6, padding: '7px 12px',
                fontFamily: 'IBM Plex Mono', fontSize: 12
              }}>
                <span style={{
                  background: 'var(--ink)', color: '#fff', borderRadius: 4,
                  padding: '2px 7px', fontSize: 10.5, minWidth: 56, textAlign: 'center'
                }}>offset {m.offset}</span>
                <span style={{ fontWeight: 700, color: m.topic === 'orders' ? '#1565C0' : '#6A1B9A', minWidth: 70 }}>
                  {m.topic}
                </span>
                <span style={{ flex: 1 }}>{m.payload}</span>
                <span style={{ color: '#7c8aa5', fontSize: 10.5 }}>{m.time}</span>
              </div>
            ))}
          </div>
      }
      <Good style={{ marginTop: 12 }}>
        Key insight: messages are <b>never deleted</b> when published. They stay in the log forever
        (or until a retention policy removes them). Each message gets an <b>offset</b> — a permanent
        position number. The offset is how consumers track where they are.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 2 — Consumer offset tracking
   Shows: two consumers with independent offsets; pull = bookmark in the log.
   ============================================================ */
const DEMO2_MESSAGES = [
  'Order #1001 placed',
  'Order #1002 placed',
  'Order #1003 placed',
  'Order #1004 placed',
  'Order #1005 placed',
  'Order #1006 placed',
]

function OffsetTrackingDemo() {
  const [billingOffset,  setBillingOffset]  = useState(0)
  const [shippingOffset, setShippingOffset] = useState(0)
  const [billingCommit,  setBillingCommit]  = useState(0)
  const [shippingCommit, setShippingCommit] = useState(0)
  const [log, setLog] = useState([])

  const msgs = DEMO2_MESSAGES

  function poll(who) {
    if (who === 'billing') {
      if (billingOffset >= msgs.length) { setLog(['⚠ Billing is up-to-date — no new messages.']); return }
      const m = msgs[billingOffset]
      setBillingOffset(o => o + 1)
      setBillingCommit(billingOffset + 1)
      setLog([`✅ Billing polled offset ${billingOffset}: "${m}" → committed offset ${billingOffset + 1}`])
    } else {
      if (shippingOffset >= msgs.length) { setLog(['⚠ Shipping is up-to-date — no new messages.']); return }
      const m = msgs[shippingOffset]
      setShippingOffset(o => o + 1)
      setShippingCommit(shippingOffset + 1)
      setLog([`✅ Shipping polled offset ${shippingOffset}: "${m}" → committed offset ${shippingOffset + 1}`])
    }
  }

  function restart(who) {
    if (who === 'billing') {
      setLog([`🔄 Billing restarted! Resuming from committed offset ${billingCommit} (not from 0).`])
      setBillingOffset(billingCommit)
    } else {
      setLog([`🔄 Shipping restarted! Resuming from committed offset ${shippingCommit} (not from 0).`])
      setShippingOffset(shippingCommit)
    }
  }

  function reset() {
    setBillingOffset(0); setShippingOffset(0)
    setBillingCommit(0); setShippingCommit(0)
    setLog([])
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · two independent consumers on the same topic — each has its own offset bookmark</div>

      {/* The shared topic log */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 6, color: 'var(--ink)', fontFamily: 'Space Grotesk' }}>
          Topic: "orders" (shared log)
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {msgs.map((m, i) => {
            const billingRead  = i < billingOffset
            const shippingRead = i < shippingOffset
            return (
              <div key={i} style={{
                borderRadius: 6, padding: '6px 10px', fontSize: 11,
                border: '2px solid',
                borderColor: billingRead && shippingRead ? '#4CAF50'
                           : billingRead ? '#1565C0'
                           : shippingRead ? '#6A1B9A'
                           : '#ccc',
                background: billingRead && shippingRead ? '#E8F5E9'
                           : billingRead ? '#E3F2FD'
                           : shippingRead ? '#F3E5F5'
                           : '#f8f8f5',
                fontFamily: 'IBM Plex Mono'
              }}>
                <div style={{ fontWeight: 700, fontSize: 10 }}>offset {i}</div>
                <div style={{ fontSize: 10.5 }}>{m}</div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10.5, color: '#666' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#E3F2FD', border: '2px solid #1565C0', borderRadius: 2, display: 'inline-block' }} />
            Read by Billing only
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#F3E5F5', border: '2px solid #6A1B9A', borderRadius: 2, display: 'inline-block' }} />
            Read by Shipping only
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: '#E8F5E9', border: '2px solid #4CAF50', borderRadius: 2, display: 'inline-block' }} />
            Read by both
          </span>
        </div>
      </div>

      {/* Consumer panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {[
          { name: 'Billing Service', color: '#1565C0', bg: '#E3F2FD', offset: billingOffset, commit: billingCommit, who: 'billing' },
          { name: 'Shipping Service', color: '#6A1B9A', bg: '#F3E5F5', offset: shippingOffset, commit: shippingCommit, who: 'shipping' },
        ].map(c => (
          <div key={c.who} style={{ background: c.bg, borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: c.color, marginBottom: 8, fontFamily: 'Space Grotesk' }}>
              {c.name}
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, marginBottom: 3 }}>
              current offset: <b>{c.offset}</b> / {msgs.length}
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, marginBottom: 10, color: '#666' }}>
              committed offset: {c.commit}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="act" style={{ fontSize: 11.5, padding: '5px 10px', background: c.color }}
                onClick={() => poll(c.who)}>Poll next</button>
              <button className="act ghost" style={{ fontSize: 11.5, padding: '5px 10px' }}
                onClick={() => restart(c.who)}>Simulate restart</button>
            </div>
          </div>
        ))}
      </div>

      {log.length > 0 && (
        <div style={{ background: '#f5f5f2', borderRadius: 6, padding: '8px 12px', fontFamily: 'IBM Plex Mono', fontSize: 11.5, marginBottom: 10 }}>
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      <button className="act ghost" style={{ fontSize: 11.5 }} onClick={reset}>Reset all</button>

      <Good style={{ marginTop: 12 }}>
        "Simulate restart" shows the key power of pull: the consumer resumes from its <b>committed</b> offset,
        not from 0. Even if it crashes mid-processing, it re-reads from the last checkpoint.
        The two consumers move completely independently — Billing does not block Shipping.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 3 — Consumer group partition assignment
   Shows: load balancing — one message per group, partitions distributed.
   ============================================================ */
const PARTITIONS = ['P0', 'P1', 'P2', 'P3']
const PARTITION_COLORS = ['#E3F2FD', '#E8F5E9', '#FFF8E1', '#F3E5F5']
const PARTITION_BORDERS = ['#1565C0', '#2a7a3a', '#f9a825', '#6A1B9A']

function assignPartitions(count) {
  const result = {}
  PARTITIONS.forEach((p, i) => {
    result[p] = `Consumer-${(i % count) + 1}`
  })
  return result
}

function ConsumerGroupDemo() {
  const [consumerCount, setConsumerCount] = useState(1)
  const [msgLog, setMsgLog] = useState([])
  const [nextPartition, setNextPartition] = useState(0)

  const assignment = assignPartitions(consumerCount)

  function add() { if (consumerCount < 4) setConsumerCount(c => c + 1) }
  function remove() { if (consumerCount > 1) setConsumerCount(c => c - 1) }

  function publishMsg() {
    const p = PARTITIONS[nextPartition % PARTITIONS.length]
    const consumer = assignPartitions(consumerCount)[p]
    const offset = msgLog.filter(m => m.partition === p).length
    setMsgLog(prev => [...prev, {
      partition: p,
      consumer,
      text: `Order #${1000 + msgLog.length}`,
      offset,
    }])
    setNextPartition(n => n + 1)
  }

  function reset() { setMsgLog([]); setNextPartition(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · consumer group load balancing — partitions are shared across the group</div>

      {/* Partition assignment grid */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 8, fontFamily: 'Space Grotesk', color: 'var(--ink)' }}>
          Group "processors" — {consumerCount} consumer{consumerCount > 1 ? 's' : ''} (rebalancing on change)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
          {PARTITIONS.map((p, i) => (
            <div key={p} style={{
              background: PARTITION_COLORS[i], border: `2px solid ${PARTITION_BORDERS[i]}`,
              borderRadius: 8, padding: '10px 8px', textAlign: 'center'
            }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p}</div>
              <div style={{ fontSize: 11, color: '#444' }}>→ {assignment[p]}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="act" onClick={add} disabled={consumerCount >= 4}>+ Add consumer</button>
          <button className="act ghost" onClick={remove} disabled={consumerCount <= 1}>− Remove consumer</button>
        </div>
      </div>

      {/* Publish and message log */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className="act" style={{ background: '#7b3fa0' }} onClick={publishMsg}>📦 Publish message (round-robin partition)</button>
        <button className="act ghost" onClick={reset}>Reset</button>
      </div>

      {msgLog.length > 0 && (
        <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {msgLog.map((m, i) => {
            const pi = PARTITIONS.indexOf(m.partition)
            return (
              <div key={i} style={{
                display: 'flex', gap: 8, alignItems: 'center',
                background: PARTITION_COLORS[pi], borderRadius: 5, padding: '5px 10px',
                fontFamily: 'IBM Plex Mono', fontSize: 11.5, border: `1px solid ${PARTITION_BORDERS[pi]}`
              }}>
                <span style={{ fontWeight: 700, color: PARTITION_BORDERS[pi], minWidth: 22 }}>{m.partition}</span>
                <span style={{ color: '#555', minWidth: 60 }}>offset {m.offset}</span>
                <span style={{ flex: 1 }}>{m.text}</span>
                <span style={{ color: '#333', fontSize: 11 }}>→ <b>{m.consumer}</b></span>
              </div>
            )
          })}
        </div>
      )}
      {msgLog.length === 0 && (
        <div style={{ color: '#7c8aa5', fontFamily: 'IBM Plex Mono', fontSize: 12, padding: '10px 0' }}>
          Click "Publish message" and watch which consumer receives it. Then add more consumers and see the partitions redistribute.
        </div>
      )}

      <Good style={{ marginTop: 12 }}>
        Within the group, each partition is owned by <b>exactly one consumer</b> — so each message
        goes to exactly one consumer in the group. Adding consumers triggers a <b>rebalance</b>:
        partitions are redistributed. With 4 consumers and 4 partitions, each consumer owns 1 partition.
      </Good>
    </div>
  )
}

/* ============================================================
   Quiz
   ============================================================ */
const QUESTIONS = [
  {
    q: 'In a pull-based message queue, what does the "offset" represent?',
    o: [
      'The consumer\'s bookmark — the position of the next message to read',
      'The number of retries attempted for a message',
      'The delay (in milliseconds) before the message is delivered',
      'The number of bytes the message occupies on disk',
    ],
    a: 0,
    e: 'The offset is the consumer\'s bookmark into the topic log. Offset 5 means "I have read messages 0–4; next give me message 5." The consumer stores this offset and resumes from it after a restart.',
    w: {
      1: 'Retry count is a delivery-reliability concept, not what an offset tracks. The offset is purely about reading position.',
      2: 'Delay in milliseconds describes scheduling or latency, not the consumer\'s reading position in a log.',
      3: 'Bytes on disk describes storage size, not position. The offset is a sequential index number, not a byte count.',
    },
    r: { id: 's6', label: 'Section 6 — Consumer offset tracking' },
  },
  {
    q: 'Why must the consumer commit its offset AFTER processing the message, not before?',
    o: [
      'The broker only accepts commits after the message has been processed',
      'Committing before would cause the offset to count backwards',
      'Committing before risks skipping the message if the consumer crashes mid-process',
      'Committing before is faster and reduces latency',
    ],
    a: 2,
    e: 'If you commit offset N+1 before processing message N, then crash, the next start resumes at N+1 — message N is never processed (at-most-once, potential data loss). Commit AFTER processing gives at-least-once: on crash, the consumer re-reads and reprocesses — possible duplicate, but no loss.',
    w: {
      0: 'The broker does not enforce this rule — it accepts a commit at any time. The ordering requirement is a consumer-side safety guarantee.',
      1: 'Offsets only go forward — there is no backwards counting. The bug from committing before is skipping messages, not counting errors.',
      3: 'Speed is not the concern here. Committing before is actually dangerous — it trades correctness for no real performance gain in this protocol.',
    },
    r: { id: 's6', label: 'Section 6 — Consumer offset tracking' },
  },
  {
    q: 'Two services ("Billing" and "Shipping") subscribe to the "orders" topic as separate consumer groups. What happens?',
    o: [
      'Each message is delivered to only one of the two services (load-balanced)',
      'Each service gets a full independent copy of every message',
      'Messages alternate: odd offsets go to Billing, even offsets to Shipping',
      'Both services share one offset, so they each read half the messages',
    ],
    a: 1,
    e: 'Separate consumer groups each get a full, independent copy of every message. The topic log is not deleted on read — it is an append-only log. Each group has its own offset, so Billing and Shipping both process every order independently.',
    w: {
      0: 'Load balancing (one consumer gets each message) happens WITHIN a consumer group — not ACROSS groups. Across groups, every group gets every message.',
      2: 'Messages do not alternate between groups based on offset. Each group reads the full log independently.',
      3: 'Groups never share an offset. Each group maintains its own independent cursor into the topic log.',
    },
    r: { id: 's8', label: 'Section 8 — Consumer groups' },
  },
  {
    q: 'Within a single consumer group, two consumers C1 and C2 are assigned to different partitions of the same topic. Consumer C1 is slow. What happens to C2?',
    o: [
      'Both C1 and C2 are paused until the broker detects the slowness',
      'The broker reassigns C1\'s partition to C2 automatically to compensate',
      'C2 waits for C1 to finish its current message before reading (head-of-line blocking)',
      'C2 reads its own partitions independently — C1\'s slowness does not affect C2',
    ],
    a: 3,
    e: 'Each consumer in a group owns its assigned partitions and reads them independently. C2 makes progress on its partitions regardless of how slow C1 is. This is the key scalability benefit of partitioned topics — consumers do not block each other.',
    w: {
      0: 'The broker does not pause consumers because one is slow. Each consumer pulls at its own pace.',
      1: 'The broker only reassigns partitions during a rebalance (consumer join/leave/crash), not dynamically due to slowness. C1 keeps its partition.',
      2: 'Head-of-line blocking would defeat the purpose of multiple consumers. Partitions ensure independent progress — no consumer waits for another.',
    },
    r: { id: 's8', label: 'Section 8 — Consumer groups' },
  },
  {
    q: 'What is a Dead Letter Queue (DLQ)?',
    o: [
      'A queue that holds messages sent by consumers back to producers',
      'A queue that stores messages before they are published to the main topic',
      'A special topic where messages land after failing delivery too many times',
      'A queue used only for system health-check messages',
    ],
    a: 2,
    e: 'A DLQ is where "poison pill" messages go after exhausting all retry attempts. Instead of blocking the consumer forever, the broker (or consumer) moves the failing message to the DLQ so a human can inspect it later. The main consumer continues with the next message.',
    w: {
      0: 'Consumers do not send messages back to producers in pub-sub. The DLQ is a one-way sink for failed messages, not a reverse channel.',
      1: 'Messages are published directly to the main topic — there is no pre-publish staging queue in standard pub-sub.',
      3: 'Health-check messages are a monitoring concern, not what a DLQ is for. The DLQ is specifically for failed-delivery messages.',
    },
    r: { id: 's10', label: 'Section 10 — Reliability' },
  },
  {
    q: 'Ordering of messages is guaranteed across all partitions of a topic. True or false?',
    o: [
      'False — no ordering guarantee exists anywhere in a partitioned system',
      'False — ordering is only guaranteed WITHIN a single partition, not across partitions',
      'True — the broker orders all messages globally before delivering them',
      'True, but only if the producer sends messages with the same key',
    ],
    a: 1,
    e: 'Within one partition, messages are strictly ordered by offset — offset 3 was published before offset 4. Across partitions, there is no global ordering. If your use case needs related messages in order (e.g., all events for order #1042), route them to the same partition using a consistent key (e.g., orderId).',
    w: {
      0: 'There IS an ordering guarantee — just per-partition, not globally. Saying "no ordering anywhere" is too strong.',
      2: 'Global ordering across partitions would require a central sequencer — a scalability bottleneck. Partitioned brokers deliberately avoid this.',
      3: 'Using the same key does route to the same partition (which gives ordering), but the statement "ordering is guaranteed globally" is still false — ordering is only per-partition.',
    },
    r: { id: 's8', label: 'Section 8 — Consumer groups' },
  },
  {
    q: 'What triggers a consumer group rebalance?',
    o: [
      'A producer publishes a message to a topic the group has never seen',
      'A consumer commits an offset that is higher than the current log size',
      'The topic log reaches its maximum retention size',
      'A consumer in the group joins, leaves, or is detected as crashed',
    ],
    a: 3,
    e: 'A rebalance happens when the group membership changes: a new consumer joins, an existing one leaves gracefully, or the broker detects a crash (heartbeat timeout). During rebalance, partition assignments are recalculated and redistributed — all consumers briefly pause (the "stop-the-world" moment).',
    w: {
      0: 'A new topic message does not trigger rebalancing — consumers pull at their own pace. The assignment of partitions to consumers is unchanged.',
      1: 'Committing a future offset is either ignored or treated as the current end — it does not trigger reassignment of partitions.',
      2: 'Retention size triggers log compaction or deletion, not a consumer group rebalance.',
    },
    r: { id: 's8', label: 'Section 8 — Consumer groups' },
  },
  {
    q: 'What is the fundamental difference between a "queue" and a "topic" in messaging systems?',
    o: [
      'A queue delivers each message to exactly one consumer; a topic delivers each message to every subscriber group independently',
      'A queue has no ordering guarantee; a topic is strictly ordered',
      'A queue supports multiple producers; a topic supports only one',
      'A queue stores messages in memory; a topic stores them on disk',
    ],
    a: 0,
    e: 'In a traditional queue (e.g., RabbitMQ point-to-point), one consumer "pops" each message — it is gone for everyone else. In a topic (pub-sub), the log is not consumed on read: every consumer group gets its own full copy of every message, reading at its own pace.',
    w: {
      1: 'Traditional queues often ARE FIFO (ordered). The defining difference is how many consumers receive each message, not ordering.',
      2: 'Both queues and topics typically support multiple producers. The distinction is about how messages are consumed (one receiver vs many independent receivers).',
      3: 'Both queues and topics can store messages in memory or on disk. Kafka, for example, uses disk for topics, but this is an implementation choice, not the defining difference.',
    },
    r: { id: 's2', label: 'Section 2 — Push vs pull' },
  },
]

/* ============================================================
   Page
   ============================================================ */
export default function Day69() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 14 · Day 69</div>
        <h1>Pub-Sub Message Queue:<br />Topics, Offsets & Consumer Groups</h1>
        <p>
          Every notification system, every event-driven microservice, every analytics pipeline
          uses a message queue under the hood. Today you build the broker itself — and understand
          exactly why Kafka works the way it does.
        </p>
        <div className="chips">
          {['Pub-Sub','Topics','Offsets','Consumer Groups','At-least-once','Dead Letter Queue','Pull vs Push'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The tight-coupling problem: why producers and consumers must not know each other</h2>
        <p>
          Imagine a newspaper printing plant. The plant prints one edition every morning. Thousands
          of subscribers read it — at home, on the train, in the evening. The plant does not know
          who its subscribers are. The subscribers do not know when exactly the plant prints. The
          <strong> newspaper</strong> is the decoupling layer.
        </p>
        <p>
          Without a message queue, a producer must call every consumer directly. When you add a new
          consumer, you must change the producer's code. When a consumer is slow, the producer slows
          down too. This is tight coupling.
        </p>
        <Code html={`<span class="cm">── Without a message queue (tight coupling) ──────────────────</span>

  OrderService.placeOrder() {
      billingService.charge(order);      <span class="cm">// producer must know every consumer</span>
      shippingService.ship(order);       <span class="cm">// adding EmailService? edit this file</span>
      emailService.sendConfirmation();   <span class="cm">// slow email? slows ORDER placement!</span>
  }

<span class="cm">── With a message queue (decoupled) ──────────────────────────</span>

  OrderService.placeOrder() {
      broker.publish(<span class="str">"orders"</span>, order);   <span class="cm">// producer knows only the topic name</span>
  }
  <span class="cm">// BillingService, ShippingService, EmailService each subscribe</span>
  <span class="cm">// independently — OrderService never changes when you add one</span>

<span class="cm">── The newspaper analogy applied ─────────────────────────────</span>

  Producer  = printing plant   (publishes editions to the newspaper)
  Topic     = the newspaper    (named channel; holds a log of editions)
  Consumer  = subscriber       (reads at their own pace; remembers which issue they left off)`} />
        <Note>
          A message queue is <strong>Observer</strong> (Day 32) at the architecture level — but with
          one critical upgrade: the broker <em>stores</em> events so consumers can read them later.
          In Observer, if you were offline when the event fired, you missed it. In a pub-sub broker,
          you catch up when you come back online.
        </Note>
      </section>

      {/* S2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Push vs pull — the key architecture decision</h2>
        <p>
          This is the most important design choice in a message broker. It determines reliability.
        </p>
        <Code html={`<span class="cm">── Push model (Observer / WebSocket style) ────────────────────</span>

  Broker  ──► Consumer1 (message!)
          ──► Consumer2 (same message!)

  Pro:  Low latency — consumer reacts instantly
  Con:  What if Consumer1 is slow? Broker's buffer fills up.
        What if Consumer1 CRASHES? The message in-flight is LOST.
        Broker must track each consumer's capacity — complex.

<span class="cm">── Pull model (Kafka / offset-based) ──────────────────────────</span>

  Consumer1: "Broker, give me messages from offset 5."
  Broker:    [msg5, msg6, msg7] ← "here you go"
  Consumer1:  processes msg5, msg6, msg7 successfully
  Consumer1: "Committed offset 8." ← I'm done up to here

  Pro:  Consumer controls its own pace (back-pressure natural)
        Consumer crashes? It just re-reads from last committed offset.
        Broker is simple — just serve from offset N, no push tracking.
  Con:  Slightly higher latency (poll interval adds delay)`} />
        <table className="matrix" style={{ width: '100%', fontSize: 13, marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 10px' }}>Property</th>
              <th style={{ textAlign: 'left', padding: '6px 10px' }}>Push</th>
              <th style={{ textAlign: 'left', padding: '6px 10px' }}>Pull</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Latency', 'Very low (instant)', 'Slightly higher (poll interval)'],
              ['Consumer crash recovery', '❌ Message lost if not acknowledged', '✅ Re-reads from last committed offset'],
              ['Back-pressure', '❌ Broker must throttle per consumer', '✅ Consumer naturally limits its own rate'],
              ['Broker complexity', 'High (tracks per-consumer capacity)', 'Low (stateless: just serve from offset N)'],
              ['Consumer pace', 'Broker-driven', 'Consumer-driven'],
              ['Real example', 'WebSockets, RabbitMQ fanout', 'Kafka, Kinesis'],
            ].map(([p, push, pull]) => (
              <tr key={p}>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p}</td>
                <td style={{ padding: '6px 10px', color: '#666' }}>{push}</td>
                <td style={{ padding: '6px 10px' }}>{pull}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Good>
          <b>Pull wins for reliability at scale.</b> This is why Kafka uses pull — consumers control
          their pace, and a restart always recovers from the last committed offset. We will build
          the pull model for the rest of this day.
        </Good>
      </section>

      {/* S3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Core entities — the broker's cast of characters</h2>
        <Code html={`<span class="cm">── Architecture diagram ────────────────────────────────────────</span>

  Producer A ──┐                              ┌── Consumer 1  (group A, offset 5)
  Producer B ──┤──► Topic <span class="str">"orders"</span>  ──────────►├── Consumer 2  (group A, offset 5)
               │    [msg0][msg1][msg2]...      └── Consumer 3  (group B, offset 2)
               │
               └──► Topic <span class="str">"payments"</span>          each consumer GROUP reads independently
                    [msg0][msg1]...            offset = <span class="str">"I have read up to here"</span>

<span class="cm">── Key difference between a queue and a topic ─────────────────</span>

  Traditional queue: Consumer "pops" a message → it's GONE for everyone else.
  Topic (pub-sub):   Message stays in the log → every group gets its own copy.`} />
        <Code html={`<span class="cm">// The five core entities</span>

<span class="cm">// 1. A single message in the log</span>
<span class="kw">class</span> Message {
    <span class="kw">private final</span> String id;           <span class="cm">// unique UUID for deduplication</span>
    <span class="kw">private final</span> String topic;         <span class="cm">// which topic this belongs to</span>
    <span class="kw">private final</span> <span class="kw">byte</span>[] payload;      <span class="cm">// the actual data (serialised)</span>
    <span class="kw">private final</span> Instant publishedAt;  <span class="cm">// wall-clock time of publish</span>
    <span class="kw">private final</span> <span class="kw">long</span> offset;         <span class="cm">// immutable position in the log</span>
}

<span class="cm">// 2. A topic — an append-only log of messages</span>
<span class="kw">class</span> Topic {
    <span class="kw">private final</span> String name;
    <span class="kw">private final</span> List&lt;Message&gt; log = <span class="kw">new</span> ArrayList&lt;&gt;(); <span class="cm">// offset = index</span>
}

<span class="cm">// 3. A subscription — tracks WHERE a consumer group is in the topic</span>
<span class="kw">class</span> Subscription {
    <span class="kw">private final</span> String groupId;    <span class="cm">// e.g. "billing-service"</span>
    <span class="kw">private final</span> String topic;      <span class="cm">// which topic</span>
    <span class="kw">private</span> <span class="kw">long</span> committedOffset;    <span class="cm">// mutable — advances on each commit</span>
}

<span class="cm">// 4. A consumer group — multiple consumers sharing the load</span>
<span class="kw">class</span> ConsumerGroup {
    <span class="kw">private final</span> String groupId;
    <span class="kw">private final</span> List&lt;String&gt; consumerIds;
    <span class="kw">private final</span> Map&lt;String, String&gt; partitionAssignment; <span class="cm">// partition → consumerId</span>
}

<span class="cm">// 5. Dead letter queue — sink for messages that failed too many times</span>
<span class="kw">class</span> DeadLetterQueue {
    <span class="kw">private final</span> List&lt;DeadLetter&gt; entries = <span class="kw">new</span> ArrayList&lt;&gt;();

    <span class="kw">void</span> enqueue(Message m, String reason) {
        entries.add(<span class="kw">new</span> DeadLetter(m, reason, Instant.now())); <span class="cm">// human inspects later</span>
    }
}`} />
      </section>

      {/* S4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The topic as an append-only log</h2>
        <p>
          This is the central insight of the whole day. A topic is NOT a queue where items
          are popped and removed. It is a <strong>log</strong> — like a journal. Pages are never
          torn out when you read them. You just note down what page you are on.
        </p>
        <Code html={`<span class="kw">class</span> Topic {
    <span class="kw">private final</span> String name;
    <span class="kw">private final</span> List&lt;Message&gt; log = <span class="kw">new</span> ArrayList&lt;&gt;();

    <span class="cm">// Append one message — offset = its position in the list</span>
    <span class="kw">synchronized long</span> append(<span class="kw">byte</span>[] payload) {
        <span class="kw">long</span> offset = log.size();              <span class="cm">// next position</span>
        log.add(<span class="kw">new</span> Message(
            UUID.randomUUID().toString(),      <span class="cm">// unique id</span>
            name,                              <span class="cm">// topic name</span>
            payload,                           <span class="cm">// the data</span>
            Instant.now(),                     <span class="cm">// wall clock</span>
            offset                             <span class="cm">// permanent position</span>
        ));
        <span class="kw">return</span> offset;                         <span class="cm">// tell producer where it landed</span>
    }

    <span class="cm">// Read a batch starting at fromOffset — does NOT remove messages</span>
    List&lt;Message&gt; read(<span class="kw">long</span> fromOffset, <span class="kw">int</span> maxCount) {
        <span class="kw">int</span> from = (<span class="kw">int</span>) Math.min(fromOffset, log.size());
        <span class="kw">int</span> to   = Math.min(from + maxCount, log.size());
        <span class="kw">return</span> log.subList(from, to);          <span class="cm">// subList is a VIEW — no copy</span>
    }                                          <span class="cm">// messages STAY in the log</span>

    <span class="kw">long</span> size() { <span class="kw">return</span> log.size(); }
}`} />
        <Note>
          <C>read()</C> never removes messages from the log. Two different consumer groups calling
          <C>read(fromOffset=0)</C> both get the full history — completely independently. This is
          what makes pub-sub different from a traditional queue.
        </Note>
        <Reveal summary="What about retention? Do messages stay forever?">
          <p>
            In a real broker (Kafka), you configure a retention policy: keep messages for N days
            (time-based) or until the log reaches N GB (size-based), whichever comes first. Old
            messages are deleted by a background thread — consumers whose offset has fallen behind
            the retention window lose the ability to re-read those messages.
            For this day's design, assume unlimited retention (no deletion) to keep it simple.
          </p>
        </Reveal>
      </section>

      {/* S5 — Interactive */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>📬 Play: topic log and producers</h2>
        <p>
          Click "Publish to orders" and "Publish to payments". Watch the append-only log grow.
          Notice each message gets a permanent offset number and that messages are never removed
          when published — they just accumulate.
        </p>
        <TopicLogDemo />
      </section>

      {/* S6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Consumer offset tracking — the bookmark model</h2>
        <p>
          A consumer remembers one number: <strong>its current offset</strong>. That number means
          "I have successfully processed all messages up to (but not including) this offset."
          After processing each message, the consumer advances its offset by 1 and commits the
          new value to the broker. On restart, it asks: "What was my last committed offset?" and
          resumes from there.
        </p>
        <Code html={`<span class="kw">class</span> ConsumerClient {
    <span class="kw">private long</span> offset = <span class="num">0</span>;          <span class="cm">// bookmark — starts at 0 (the beginning)</span>
    <span class="kw">private final</span> String groupId;    <span class="cm">// identifies this consumer's group</span>
    <span class="kw">private final</span> String topic;      <span class="cm">// which topic to read from</span>

    <span class="kw">void</span> poll(Broker broker, <span class="kw">int</span> maxMessages) {
        List&lt;Message&gt; msgs = broker.read(topic, offset, maxMessages);

        <span class="kw">for</span> (Message m : msgs) {
            process(m);                       <span class="cm">// do your work FIRST</span>
            offset = m.offset() + <span class="num">1</span>;        <span class="cm">// advance ONLY after success</span>
        }

        broker.commitOffset(topic, groupId, offset); <span class="cm">// persist the new position</span>
    }                                                <span class="cm">// survives a consumer restart</span>

    <span class="cm">// What happens on restart?</span>
    <span class="kw">void</span> onStart(Broker broker) {
        offset = broker.getCommittedOffset(topic, groupId); <span class="cm">// resume from checkpoint</span>
        <span class="cm">// NOT from 0 — don't reprocess the whole history</span>
    }
}`} />
        <Warn>
          <b>At-least-once guarantee:</b> if the consumer crashes <em>after</em> processing message N
          but <em>before</em> committing offset N+1, it will reprocess message N on restart. Your
          processing logic must be <strong>idempotent</strong> (processing the same message twice
          gives the same result) — for example, use an idempotency key and check if you already
          handled this message ID (the Day 52 pattern).
        </Warn>
        <Reveal summary="What if I commit BEFORE processing? (At-most-once — data loss risk)">
          <p>
            If you commit offset N+1 before processing message N, then crash, the broker thinks you
            already processed N — it never sends N again. Message N is permanently lost. This is called
            "at-most-once" delivery. It is only acceptable if losing occasional messages is fine (e.g.,
            metrics, analytics). For anything financial or order-critical, always commit after processing.
          </p>
        </Reveal>
        <Reveal summary="Can I achieve exactly-once delivery?">
          <p>
            Exactly-once means: commit the offset AND the business state atomically — either both happen
            or neither does. This requires a distributed transaction across the broker and your database,
            which is extremely complex and slow. Most production systems choose at-least-once + idempotent
            consumers instead. Kafka Transactions provide exactly-once within the Kafka ecosystem, but
            they require careful setup.
          </p>
        </Reveal>
      </section>

      {/* S7 — Interactive */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🔖 Play: consumer offset tracking</h2>
        <p>
          Click "Poll next" for Billing and Shipping independently. Watch the offset markers
          advance separately. Then click "Simulate restart" — the consumer resumes from its
          <em> committed</em> offset, not from the beginning.
        </p>
        <OffsetTrackingDemo />
      </section>

      {/* S8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Consumer groups — load balancing across partitions</h2>
        <p>
          A single consumer can only process messages so fast. To scale, you split the topic into
          <strong> partitions</strong> and distribute them across a group of consumers. Each
          partition is owned by exactly one consumer in the group at a time — so each message
          goes to exactly one consumer in the group. This is load balancing.
        </p>
        <Code html={`<span class="cm">── Topic "orders" split into 4 partitions ─────────────────────</span>

  Topic: <span class="str">"orders"</span>
  ├── Partition 0:  [Order#1, Order#5, Order#9,  ...]   ← hashed by orderId
  ├── Partition 1:  [Order#2, Order#6, Order#10, ...]
  ├── Partition 2:  [Order#3, Order#7, Order#11, ...]
  └── Partition 3:  [Order#4, Order#8, Order#12, ...]

  Group <span class="str">"billing-processors"</span>  (2 consumers):
      Consumer-1  → owns Partition 0 + Partition 1
      Consumer-2  → owns Partition 2 + Partition 3

  Group <span class="str">"billing-processors"</span>  (4 consumers after scaling out):
      Consumer-1  → owns Partition 0
      Consumer-2  → owns Partition 1
      Consumer-3  → owns Partition 2
      Consumer-4  → owns Partition 3

<span class="cm">── Two rules ──────────────────────────────────────────────────</span>
  1. One partition is owned by AT MOST one consumer in the group.
     → Each message is processed by exactly one consumer in the group.
  2. If you have MORE consumers than partitions, the extras sit idle.
     → Adding the 5th consumer to a 4-partition topic does nothing.`} />
        <Code html={`<span class="cm">// Simplified partition assignment (round-robin)</span>
<span class="kw">class</span> PartitionAssigner {

    <span class="cm">// Assign partitions to consumers as evenly as possible</span>
    Map&lt;String, String&gt; assign(List&lt;String&gt; partitions, List&lt;String&gt; consumerIds) {
        Map&lt;String, String&gt; result = <span class="kw">new</span> LinkedHashMap&lt;&gt;();
        <span class="kw">int</span> n = consumerIds.size();

        <span class="kw">for</span> (<span class="kw">int</span> i = <span class="num">0</span>; i &lt; partitions.size(); i++) {
            String partition = partitions.get(i);
            String consumer  = consumerIds.get(i % n); <span class="cm">// wrap around</span>
            result.put(partition, consumer);
        }
        <span class="kw">return</span> result;  <span class="cm">// { "P0": "C1", "P1": "C2", "P2": "C1", "P3": "C2" }</span>
    }
}

<span class="cm">// What triggers a rebalance?</span>
<span class="cm">// - New consumer joins the group (scaling out)</span>
<span class="cm">// - A consumer leaves gracefully (scaling in)</span>
<span class="cm">// - A consumer crashes (heartbeat timeout — broker detects it)</span>
<span class="cm">// During rebalance: all consumers in the group PAUSE briefly (stop-the-world)</span>`} />
        <Note>
          <b>Message ordering across partitions:</b> within one partition, messages are strictly
          ordered by offset. Across partitions, there is no ordering guarantee. If you need
          all events for a single order to be processed in order, always route them to the same
          partition using a consistent key (e.g., <C>orderId.hashCode() % numPartitions</C>).
        </Note>
      </section>

      {/* S9 — Interactive */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>⚖️ Play: consumer group load balancing</h2>
        <p>
          Start with 1 consumer (gets all 4 partitions). Add consumers and watch the rebalance.
          Then publish messages and see which consumer handles each one. Notice: with 4+ consumers
          in a 4-partition topic, every consumer owns exactly one partition.
        </p>
        <ConsumerGroupDemo />
      </section>

      {/* S10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Reliability: retries, at-least-once, and the dead letter queue</h2>
        <p>
          What happens when a consumer successfully receives a message but fails to process it?
          Maybe the downstream database is down, or there is a bug in the processing code.
        </p>
        <Code html={`<span class="cm">// Retry loop with exponential back-off — same pattern as Day 57</span>
<span class="kw">void</span> processWithRetry(Message m, DeadLetterQueue dlq) {
    <span class="kw">int</span> maxRetries = <span class="num">3</span>;
    <span class="kw">long</span> backoffMs = <span class="num">1000</span>;  <span class="cm">// start: 1 second</span>

    <span class="kw">for</span> (<span class="kw">int</span> attempt = <span class="num">1</span>; attempt &lt;= maxRetries; attempt++) {
        <span class="kw">try</span> {
            process(m);       <span class="cm">// try to process</span>
            <span class="kw">return</span>;           <span class="cm">// success — stop retrying</span>
        } <span class="kw">catch</span> (Exception e) {
            <span class="kw">if</span> (attempt == maxRetries) {
                dlq.enqueue(m, e.getMessage());  <span class="cm">// give up — send to DLQ</span>
                <span class="kw">return</span>;
            }
            sleep(backoffMs);           <span class="cm">// wait before retrying</span>
            backoffMs *= <span class="num">2</span>;            <span class="cm">// double the wait: 1s, 2s, 4s</span>
        }
    }
}

<span class="cm">// Dead letter queue — why it matters</span>
<span class="cm">//   Without DLQ: a "poison pill" message fails forever,</span>
<span class="cm">//   blocking ALL subsequent messages on that partition.</span>
<span class="cm">//   With DLQ:    move the bad message out; consumer continues</span>
<span class="cm">//   with the next message; a human inspects the DLQ later.</span>`} />
        <table className="matrix" style={{ fontSize: 13, width: '100%', marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 10px' }}>Delivery guarantee</th>
              <th style={{ textAlign: 'left', padding: '6px 10px' }}>How</th>
              <th style={{ textAlign: 'left', padding: '6px 10px' }}>Risk</th>
              <th style={{ textAlign: 'left', padding: '6px 10px' }}>Use when</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['At-most-once', 'Commit before processing', 'Message loss on crash', 'Metrics, logs — OK to lose some'],
              ['At-least-once', 'Commit after processing', 'Duplicate processing on crash', 'Orders, payments (+ idempotency)'],
              ['Exactly-once', 'Distributed transaction: offset + DB atomically', 'High complexity + latency cost', 'Financial ledgers (rare in practice)'],
            ].map(([g, h, r, u]) => (
              <tr key={g}>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{g}</td>
                <td style={{ padding: '6px 10px', color: '#666' }}>{h}</td>
                <td style={{ padding: '6px 10px', color: '#c00' }}>{r}</td>
                <td style={{ padding: '6px 10px' }}>{u}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Good>
          <b>Day 57 connection:</b> the Notification System's async dispatcher, retry loop, and
          dead-letter queue are all the same patterns you just read — applied to email/SMS
          delivery instead of generic message processing. The broker here is the lower layer
          those systems sit on top of.
        </Good>
      </section>

      {/* S11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>🕳 Common traps</h2>

        <Warn>
          <b>Trap 1 — Committing offset BEFORE processing.</b> If the consumer commits offset N+1,
          then crashes before actually processing message N, that message is permanently skipped.
          At-most-once is data loss. <em>Always commit after successful processing.</em>
        </Warn>

        <Warn>
          <b>Trap 2 — One giant topic for everything.</b> Putting every event type in a single
          "events" topic forces all consumers to receive all events and filter what they need.
          This couples all producers and consumers. Use fine-grained topics: "orders", "payments",
          "user-signups" — separate concerns.
        </Warn>

        <Warn>
          <b>Trap 3 — Not using consumer groups.</b> If you start three instances of BillingService
          without a consumer group, all three receive every message — every order is billed three
          times. Consumer groups ensure each message is processed by <em>exactly one</em> instance.
        </Warn>

        <Warn>
          <b>Trap 4 — Blocking inside the poll loop.</b> If <C>process(m)</C> does a slow
          synchronous HTTP call and takes 30 seconds, all subsequent messages on that partition
          wait behind it (head-of-line blocking). Use async processing or a thread pool inside
          the consumer.
        </Warn>

        <Warn>
          <b>Trap 5 — Shared mutable state across poll() calls without synchronization.</b> If
          your consumer accumulates a count in a shared field and multiple threads call
          <C>poll()</C> concurrently, you have the same race condition from Day 61. Each
          consumer instance should be single-threaded, or protect shared state with the tools
          from Day 62.
        </Warn>

        <Warn>
          <b>Trap 6 — Relying on cross-partition ordering.</b> Within one partition, offset 3
          always happened before offset 4. Across partitions, there is no such guarantee.
          If Order #1001's events must be processed in order, always route them to the same
          partition via a key (e.g., <C>orderId % numPartitions</C>).
        </Warn>
      </section>

      {/* S12 */}
      <section id="s12">
        <div className="sec-label">Section 12</div>
        <h2>📋 Cheat sheet + patterns map</h2>
        <ul>
          <li><b>Topic = append-only log.</b> Messages are indexed by offset. Never removed on read.</li>
          <li><b>Pull &gt; Push for reliability.</b> Consumer controls its pace; restarts resume from committed offset.</li>
          <li><b>Offset = bookmark.</b> Consumer commits offset AFTER processing. Restart resumes from last committed.</li>
          <li><b>At-least-once</b> = commit after process. On crash, consumer re-reads → possible duplicate. Fix with idempotency.</li>
          <li><b>Consumer group</b> = load balancing. Each partition owned by one consumer. Each message → one consumer in group.</li>
          <li><b>Rebalance</b> happens when consumer joins, leaves, or crashes. Partitions redistributed. Brief pause.</li>
          <li><b>Cross-group</b> = each group gets every message independently. Separate groups = separate bookmarks.</li>
          <li><b>Dead Letter Queue (DLQ)</b> = sink for poison pills after N retries. Consumer continues; human inspects DLQ.</li>
          <li><b>Partition ordering</b> = guaranteed within partition, not across partitions.</li>
          <li><b>More consumers than partitions</b> = extras sit idle. Scale partitions first.</li>
        </ul>
        <Reveal summary="Design patterns at work in a pub-sub broker">
          <table className="matrix" style={{ fontSize: 12.5, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '5px 8px' }}>Pattern</th>
                <th style={{ textAlign: 'left', padding: '5px 8px' }}>Day</th>
                <th style={{ textAlign: 'left', padding: '5px 8px' }}>Where it appears</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Observer', '32', 'Pub-sub is Observer at the architecture level; broker stores events so consumers can catch up'],
                ['Iterator', '37', 'Consumer offset tracking IS an external iterator — poll(offset, count) advances the cursor'],
                ['Command', '33', 'Each Message is a Command stored in the broker log — the log is the command history'],
                ['Strategy', '31', 'PartitionStrategy decides which partition a message goes to (hash by key, round-robin, etc.)'],
                ['Decorator', '27', 'Logging, encryption, compression middleware wraps the message pipeline'],
                ['Adapter', '26', 'Different broker backends (Kafka, RabbitMQ, in-memory) behind one BrokerPort interface'],
              ].map(([p, d, w]) => (
                <tr key={p}>
                  <td style={{ padding: '5px 8px' }}><b>{p}</b></td>
                  <td style={{ padding: '5px 8px', color: '#7c8aa5' }}>Day {d}</td>
                  <td style={{ padding: '5px 8px' }}>{w}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </section>

      {/* INTERVIEW */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>

        <Reveal summary="Q: What is exactly-once delivery and why is it so hard?">
          <p>
            Exactly-once means every message is processed exactly one time — no loss, no duplicate.
            The difficulty is that you must commit two things atomically: the offset (to the broker)
            AND the business result (to your database). If the consumer crashes between the two commits,
            one side is ahead of the other. Fixing this requires a distributed transaction — an atomic
            commit across two independent systems (broker + DB), which is slow and complex.
            Most systems use at-least-once + idempotent consumers (check if you already processed
            this message ID before acting) which achieves the same observable effect without the
            transaction overhead.
          </p>
        </Reveal>

        <Reveal summary="Q: What is a consumer group rebalance and when does it happen?">
          <p>
            A rebalance is the event where the broker redistributes partitions among the consumers
            in a group. It is triggered by: (1) a new consumer joining the group, (2) an existing
            consumer leaving gracefully (shutdown), (3) the broker detecting a consumer crash via
            heartbeat timeout. During rebalance, all consumers in the group briefly stop consuming
            — this is the "stop-the-world" pause. After reassignment, each consumer resumes from
            the committed offset of its newly assigned partitions. Frequent rebalances (e.g., because
            consumers keep crashing) degrade throughput significantly.
          </p>
        </Reveal>

        <Reveal summary="Q: How does Kafka achieve such high throughput?">
          <p>
            Four key techniques: (1) <b>Append-only writes</b> — messages are always appended to
            the end of a file on disk. Sequential I/O is orders of magnitude faster than random I/O.
            (2) <b>Zero-copy</b> — Kafka uses the OS <C>sendfile()</C> system call to transfer data
            from the disk page cache directly to the network socket, bypassing the JVM heap entirely.
            (3) <b>Batch sends</b> — producers accumulate multiple messages and send them in one
            network round-trip. (4) <b>Consumer pull with batching</b> — consumers fetch up to N
            messages per poll, amortizing the per-request overhead. Together, these make Kafka capable
            of millions of messages per second on commodity hardware.
          </p>
        </Reveal>

        <Reveal summary="Q: What is the difference between a queue and a topic?">
          <p>
            In a traditional <b>queue</b> (e.g., RabbitMQ point-to-point), each message is delivered
            to exactly one consumer and then deleted. It is like a shared to-do list — one person picks
            a task and removes it. In a <b>topic</b> (pub-sub), the log is not consumed on read. Every
            consumer group gets its own independent copy of every message. BillingService and
            ShippingService can both subscribe to "orders" and each processes every order independently.
            The topic is like a shared newspaper — reading it does not remove it for others.
          </p>
        </Reveal>

        <Reveal summary="Q: How do you handle a 'poison pill' message that always fails processing?">
          <p>
            Without handling, the consumer retries the same message forever, blocking all subsequent
            messages on that partition. The fix: a retry limit (e.g., 3 attempts with exponential
            back-off). After exhausting retries, move the message to the <b>Dead Letter Queue (DLQ)</b>
            — a separate topic (or storage) where failed messages accumulate for human inspection.
            The consumer then commits the offset past the poison pill and continues with the next message.
            Engineers periodically review the DLQ: fix the bug, replay the messages from the DLQ, and
            ensure they now succeed.
          </p>
        </Reveal>

        <Reveal summary="Q: What is back-pressure and how does pull handle it naturally?">
          <p>
            Back-pressure happens when a producer publishes faster than consumers can process.
            In a push model, the broker must either buffer messages in memory (OOM risk, Day 63's
            bounded buffer) or drop them. In a pull model, back-pressure is automatic: a slow
            consumer simply polls less frequently. The broker just waits for the next poll — it
            does not push more data than the consumer requested. The lag (how far behind the
            consumer is) grows, which is a visible metric, but the consumer is never overwhelmed.
            Monitoring consumer lag is the standard way to detect that you need to scale out
            (add more consumers) or that processing is too slow.
          </p>
        </Reveal>

        <Reveal summary="Q: How must consumers handle duplicate messages in at-least-once delivery?">
          <p>
            Consumers must be <b>idempotent</b>: processing the same message twice must produce
            the same result as processing it once. The standard technique is an idempotency key —
            store the processed message ID in a database (e.g., <C>processed_ids</C> table) before
            or alongside the business operation. On the next processing attempt (after a crash
            re-read), check: "Did I already process message ID abc-123?" If yes, skip the business
            logic but still commit the offset. This is the Day 52 (BookMyShow) and Day 54 (ATM)
            idempotency pattern applied to consumers.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="s14">
        <div className="sec-label">Section 14 · Test yourself</div>
        <h2>🧠 Quiz</h2>
        <p>Click an answer — explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 69 complete?</strong> Homework: implement a minimal in-memory pub-sub broker
        in Java. Create a <C>Topic</C> class with <C>append(byte[])</C> and
        <C>read(long fromOffset, int maxCount)</C> methods. Then create a <C>ConsumerClient</C>
        class that tracks its own offset and calls <C>commitOffset()</C> after processing.
        Test with two consumer groups reading from the same topic — confirm each group gets
        every message independently and that restarting one consumer resumes from its last
        committed offset (not from 0).
        <br /><br />
        Next: <strong>Day 70 — Week 14 Machine-Coding Drill</strong>: timed practice rounds
        applying everything from this week (Chess, Food Delivery, Amazon Locker, Pub-Sub) under
        interview conditions, with a locked-reveal solution walkthrough and interviewer scoring rubric.
      </div>

    </div>
  )
}
