import { useState, useEffect, useRef } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Transport comparison: polling vs long-poll vs WebSocket
   ============================================================ */
function TransportDemo() {
  const [pollTimer, setPollTimer] = useState(3)
  const [pollMsg, setPollMsg] = useState(null)
  const [pollWaste, setPollWaste] = useState(0)

  const [lpWaiting, setLpWaiting] = useState(false)
  const [lpMsg, setLpMsg] = useState(null)

  const [wsMsg, setWsMsg] = useState(null)
  const [wsLatency, setWsLatency] = useState(null)

  const [fired, setFired] = useState(false)
  const firedRef = useRef(false)

  // Polling countdown
  useEffect(() => {
    const id = setInterval(() => {
      setPollTimer(t => {
        if (t <= 1) {
          // poll fires: consume the pending message if one exists
          if (firedRef.current && pollMsg === null) {
            setPollMsg('Hello from server!')
          } else {
            setPollWaste(w => w + 1)
          }
          return 3
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [pollMsg])

  function fireMessage() {
    if (fired) return
    setFired(true)
    firedRef.current = true

    // Long poll resolves immediately
    setLpWaiting(false)
    setLpMsg('Hello from server!')

    // WebSocket pushes instantly
    const start = Date.now()
    setWsMsg('Hello from server!')
    setWsLatency(Date.now() - start + 'ms')

    // Polling must wait for next poll cycle (already handled by timer)
  }

  function resetAll() {
    setFired(false)
    firedRef.current = false
    setPollTimer(3)
    setPollMsg(null)
    setPollWaste(0)
    setLpWaiting(false)
    setLpMsg(null)
    setWsMsg(null)
    setWsLatency(null)
  }

  function startLongPoll() {
    if (lpWaiting || lpMsg) return
    setLpWaiting(true)
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · three transports, one message</div>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: '#5a6a8a' }}>
        Press <b>New message arrives</b> to simulate the server having a message. Watch how each transport delivers it.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button className="act" onClick={fireMessage} disabled={fired}>New message arrives on server</button>
        <button className="ghost act" onClick={resetAll}>Reset</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {/* Polling */}
        <div style={{ border: '2px solid var(--amber)', borderRadius: 10, padding: 14, background: '#fffdf4' }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#7c5a00' }}>Polling</div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>Client asks every 3 s: "anything new?"</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, marginBottom: 6 }}>
            Next poll in: <b style={{ color: '#c07000' }}>{pollTimer}s</b>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#888', marginBottom: 8 }}>
            Wasted polls: <b style={{ color: '#b54' }}>{pollWaste}</b>
          </div>
          {pollMsg ? (
            <div style={{ background: '#2D5BFF', color: '#fff', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}>
              {pollMsg}
            </div>
          ) : (
            <div style={{ color: '#aaa', fontSize: 13, fontStyle: 'italic' }}>
              {fired ? 'Waiting for next poll...' : 'No message yet'}
            </div>
          )}
          {pollMsg && (
            <div style={{ fontSize: 11, color: '#b54', marginTop: 6 }}>
              Latency up to 3 s!
            </div>
          )}
        </div>

        {/* Long Polling */}
        <div style={{ border: '2px solid #5a9fd4', borderRadius: 10, padding: 14, background: '#f4f8ff' }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#1a4a7a' }}>Long Polling</div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>Client asks once; server holds the connection open.</div>
          <button className="ghost act" style={{ fontSize: 12, padding: '4px 10px', marginBottom: 8 }}
            onClick={startLongPoll} disabled={lpWaiting || !!lpMsg}>
            Open long-poll request
          </button>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#5a9fd4', marginBottom: 8 }}>
            {lpWaiting ? '⏳ connection held open...' : lpMsg ? '✓ connection resolved' : 'idle'}
          </div>
          {lpMsg ? (
            <div style={{ background: '#2D5BFF', color: '#fff', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}>
              {lpMsg}
            </div>
          ) : (
            <div style={{ color: '#aaa', fontSize: 13, fontStyle: 'italic' }}>
              {lpWaiting ? 'Waiting...' : 'No request open'}
            </div>
          )}
          {lpMsg && (
            <div style={{ fontSize: 11, color: '#2a7a2a', marginTop: 6 }}>
              Delivered immediately on arrival!
            </div>
          )}
        </div>

        {/* WebSocket */}
        <div style={{ border: '2px solid #2E9E6B', borderRadius: 10, padding: 14, background: '#f4fff8' }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#1a5a3a' }}>WebSocket</div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>Persistent bidirectional channel — server pushes any time.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2E9E6B', display: 'inline-block', boxShadow: '0 0 6px #2E9E6B' }} />
            <span style={{ fontSize: 12, fontFamily: 'IBM Plex Mono', color: '#2E9E6B' }}>WS connected</span>
          </div>
          {wsMsg ? (
            <>
              <div style={{ background: '#2D5BFF', color: '#fff', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}>
                {wsMsg}
              </div>
              <div style={{ fontSize: 11, color: '#2a7a2a', marginTop: 6 }}>
                Latency: ~{wsLatency} (no poll wait, no reconnect)
              </div>
            </>
          ) : (
            <div style={{ color: '#aaa', fontSize: 13, fontStyle: 'italic' }}>Waiting for push...</div>
          )}
        </div>
      </div>

      <Good>
        WebSocket delivers the message the instant it arrives. Polling can wait up to 3 s (the poll interval) and wastes bandwidth on empty polls. Long polling is better but still burns one connection per client.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 2 — Multi-server fan-out via Redis Pub/Sub
   ============================================================ */
const FANOUT_STEPS = [
  { label: 'Alice types message in group chat', highlight: 'alice' },
  { label: 'Server 1 receives the message', highlight: 'server1' },
  { label: 'Server 1 saves to DB', highlight: 'db' },
  { label: 'Server 1 publishes to Redis channel "conv:42"', highlight: 'redis' },
  { label: 'Server 2 receives from Redis, pushes to Bob and Carol', highlight: 'server2' },
  { label: 'Bob and Carol see the message immediately', highlight: 'bob-carol' },
  { label: 'Dave is offline — message stays in DB (pending)', highlight: 'dave' },
]

function FanOutDemo() {
  const [step, setStep] = useState(-1)
  const [daveOnline, setDaveOnline] = useState(false)

  function nextStep() {
    setStep(s => Math.min(s + 1, FANOUT_STEPS.length - 1))
  }
  function reset() {
    setStep(-1)
    setDaveOnline(false)
  }

  const h = step >= 0 ? FANOUT_STEPS[step].highlight : ''
  const msg = step >= 0 ? FANOUT_STEPS[step].label : 'Press Step → to animate the message flow'

  function box(id, label, color, extra) {
    const active = h === id
    return (
      <div style={{
        border: `2px solid ${active ? color : '#ddd'}`,
        borderRadius: 10,
        padding: '10px 14px',
        background: active ? color + '18' : '#fff',
        minWidth: 120,
        textAlign: 'center',
        transition: 'all 0.2s',
        boxShadow: active ? `0 0 12px ${color}55` : 'none',
      }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: active ? color : '#555' }}>{label}</div>
        {extra && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{extra}</div>}
      </div>
    )
  }

  const msgText = 'Hey team! 👋'

  return (
    <div className="panel">
      <div className="ptitle">Live demo · cross-server fan-out</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="act" onClick={nextStep} disabled={step >= FANOUT_STEPS.length - 1}>Step →</button>
        <button className="ghost act" onClick={reset}>Reset</button>
        {step >= FANOUT_STEPS.length - 1 && !daveOnline && (
          <button className="act" style={{ background: '#2E9E6B' }} onClick={() => setDaveOnline(true)}>
            Dave comes online
          </button>
        )}
      </div>

      <div style={{
        background: step >= 0 ? '#1B2A4A' : '#f0f0f0',
        color: step >= 0 ? '#a8d8ff' : '#888',
        fontFamily: 'IBM Plex Mono',
        fontSize: 13,
        borderRadius: 8,
        padding: '8px 14px',
        marginBottom: 16,
        transition: 'all 0.3s',
        minHeight: 36,
      }}>
        {msg}
      </div>

      {/* Architecture layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
        {/* Left: Server 1 + Alice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          {box('server1', 'Server 1', '#2D5BFF', 'handles Alice')}
          <div style={{ fontSize: 18 }}>↑</div>
          {box('alice', 'Alice', '#7c3aed', step >= 1 ? msgText : 'Alice')}
        </div>

        {/* Middle: DB + Redis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', minWidth: 110 }}>
          {box('db', 'Database', '#c07000', 'messages')}
          <div style={{ fontSize: 22 }}>↕</div>
          {box('redis', 'Redis Pub/Sub', '#D9534F', 'conv:42 channel')}
        </div>

        {/* Right: Server 2 + Bob, Carol, Dave */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          {box('server2', 'Server 2', '#2D5BFF', 'handles Bob, Carol')}
          <div style={{ fontSize: 18 }}>↓</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{
              border: `2px solid ${h === 'bob-carol' ? '#2E9E6B' : '#ddd'}`,
              borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700,
              background: h === 'bob-carol' ? '#e8fff4' : '#fff',
              boxShadow: h === 'bob-carol' ? '0 0 10px #2E9E6B55' : 'none',
              transition: 'all 0.2s',
            }}>
              Bob {step >= 5 ? '✅ ' + msgText : ''}
            </div>
            <div style={{
              border: `2px solid ${h === 'bob-carol' ? '#2E9E6B' : '#ddd'}`,
              borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700,
              background: h === 'bob-carol' ? '#e8fff4' : '#fff',
              boxShadow: h === 'bob-carol' ? '0 0 10px #2E9E6B55' : 'none',
              transition: 'all 0.2s',
            }}>
              Carol {step >= 5 ? '✅ ' + msgText : ''}
            </div>
            <div style={{
              border: `2px solid ${h === 'dave' ? '#c07000' : (daveOnline ? '#2E9E6B' : '#ddd')}`,
              borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700,
              background: h === 'dave' ? '#fffdf0' : (daveOnline ? '#e8fff4' : '#fff'),
              boxShadow: h === 'dave' ? '0 0 10px #c0700055' : 'none',
              transition: 'all 0.2s',
            }}>
              Dave {daveOnline ? '✅ ' + msgText : (step >= 6 ? '⏳ offline' : '')}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Note>
          Server 1 cannot directly push to Bob's socket on Server 2. Redis Pub/Sub acts as the bridge — Server 1 publishes once, all subscribed servers receive and push to their local connections.
        </Note>
      </div>
    </div>
  )
}

/* ============================================================
   Demo 3 — Message status tracker (SENT → DELIVERED → READ)
   ============================================================ */
function MessageStatusDemo() {
  const [phase, setPhase] = useState(0)
  // phase 0: unsent, 1: sent (saved in DB), 2: delivered to Bob, 3: carol offline→comes online→delivered
  // 4: Bob reads, 5: Carol reads
  const [carolOnline, setCarolOnline] = useState(false)
  const [carolDelivered, setCarolDelivered] = useState(false)

  function sendMsg() { if (phase === 0) setPhase(1) }
  function advancePhase() {
    if (phase < 4) setPhase(p => p + 1)
  }

  function bringCarolOnline() {
    setCarolOnline(true)
    setCarolDelivered(true)
    if (phase < 3) setPhase(3)
  }

  function resetDemo() {
    setPhase(0)
    setCarolOnline(false)
    setCarolDelivered(false)
  }

  // Tick symbols
  function ticks(delivered, read) {
    if (read) return <span style={{ color: '#2D5BFF', fontWeight: 700 }}>✓✓</span>
    if (delivered) return <span style={{ color: '#aaa', fontWeight: 700 }}>✓✓</span>
    return <span style={{ color: '#aaa' }}>✓</span>
  }

  const bobDelivered = phase >= 2
  const bobRead = phase >= 4
  const carolRead = phase >= 5

  const msgStatusLabel = () => {
    if (phase === 0) return 'not sent'
    if (phase === 1) return 'SENT (saved in DB)'
    if (phase >= 2) {
      if (carolRead && bobRead) return 'READ by all'
      if (bobRead || carolRead) return 'READ (partially)'
      return 'DELIVERED (partially)'
    }
    return ''
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · message status tracker</div>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: '#5a6a8a' }}>
        You are Alice. Send a message to a group with Bob and Carol. Watch the ticks evolve.
      </p>

      {/* Conversation UI */}
      <div style={{ background: '#f0f4f8', borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1B2A4A', marginBottom: 10 }}>Group: Project Alpha</div>

        {phase === 0 ? (
          <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: 13 }}>No messages yet</div>
        ) : (
          <div style={{
            background: '#2D5BFF', color: '#fff', borderRadius: '12px 12px 0 12px',
            padding: '10px 14px', display: 'inline-block', maxWidth: '80%', marginBottom: 4
          }}>
            <div style={{ fontSize: 14 }}>Hey team! When is the sprint review?</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>14:32</span>
              {ticks(carolDelivered && bobDelivered, carolRead && bobRead)}
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
          Status: <b style={{ color: '#1B2A4A' }}>{msgStatusLabel()}</b>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button className="act" onClick={sendMsg} disabled={phase > 0}>Send message</button>
        {phase === 1 && (
          <button className="act" onClick={advancePhase}>Deliver to Bob (online)</button>
        )}
        {phase === 2 && !carolOnline && (
          <button className="act" style={{ background: '#2E9E6B' }} onClick={bringCarolOnline}>Carol comes online</button>
        )}
        {phase >= 2 && carolDelivered && phase < 4 && (
          <button className="act" onClick={() => setPhase(4)}>Bob reads conversation</button>
        )}
        {phase >= 4 && !carolRead && (
          <button className="act" onClick={() => setPhase(5)}>Carol reads conversation</button>
        )}
        <button className="ghost act" onClick={resetDemo}>Reset</button>
      </div>

      {/* Read receipts panel */}
      {phase >= 1 && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Read Receipts Panel</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Bob */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, background: '#f8f9fa' }}>
              <span style={{ fontWeight: 600 }}>Bob</span>
              <span style={{ fontSize: 12 }}>
                {bobRead
                  ? <span style={{ color: '#2D5BFF' }}>✓✓ Read at 14:33</span>
                  : bobDelivered
                    ? <span style={{ color: '#888' }}>✓✓ Delivered</span>
                    : <span style={{ color: '#aaa' }}>✓ Sent</span>}
              </span>
            </div>
            {/* Carol */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, background: '#f8f9fa' }}>
              <span style={{ fontWeight: 600 }}>Carol</span>
              <span style={{ fontSize: 12 }}>
                {carolRead
                  ? <span style={{ color: '#2D5BFF' }}>✓✓ Read at 14:36</span>
                  : carolDelivered
                    ? <span style={{ color: '#888' }}>✓✓ Delivered</span>
                    : carolOnline
                      ? <span style={{ color: '#aaa' }}>✓ Sent</span>
                      : <span style={{ color: '#D9534F' }}>Offline (pending delivery)</span>}
              </span>
            </div>
          </div>
        </div>
      )}

      <Good>
        The sender's double-tick turns blue only when ALL recipients have read the message. The data model stores <C>lastReadMessageId</C> per (user, conversation). Querying "count members where lastReadMessageId &gt;= this message" gives the read count.
      </Good>
    </div>
  )
}

/* ===== Quiz data ===== */
const QUESTIONS = [
  {
    q: 'What happens during the WebSocket upgrade handshake?',
    o: [
      'The server opens a new connection back to the client',
      'The client sends an HTTP GET with "Upgrade: websocket"; the server responds 101 and the connection becomes a persistent bidirectional channel',
      'The client opens a new TCP connection for each message',
      'The client polls the server every second using HTTP',
    ],
    a: 1,
    e: 'The WebSocket handshake starts as HTTP, then the server responds with 101 Switching Protocols. After that, both sides can send frames at any time over the same TCP connection — no HTTP headers needed per message.',
    w: {
      0: 'The server cannot open a connection back to the client — it has no way to initiate TCP. The client always initiates, then upgrades.',
      2: 'Opening a new TCP connection per message is what plain HTTP does — WebSocket specifically avoids this overhead by keeping one connection alive.',
      3: 'Polling every second is a naive workaround for real-time delivery, not WebSocket. WebSocket eliminates polling entirely.',
    },
    r: { id: 's2', label: 'Section 2 — Transport choices & WebSocket handshake' },
  },
  {
    q: 'User A is connected to Server 1. User B is connected to Server 2. A sends B a message. How does Server 1 deliver it to B?',
    o: [
      'Server 1 publishes the message to a Redis Pub/Sub channel; Server 2 subscribes and pushes to B\'s local socket',
      'Server 1 asks the database to notify Server 2',
      'Server 1 directly accesses Server 2\'s memory to find B\'s socket',
      'B periodically polls the database and fetches the message',
    ],
    a: 0,
    e: 'Servers cannot directly access each other\'s memory. A message broker (Redis Pub/Sub or Kafka) acts as the shared bus. Server 1 publishes once; every subscribed server receives it and pushes to any local connections for that conversation.',
    w: {
      1: 'Databases are for durable storage, not real-time signaling between servers. Using a DB as a notification bus is slow and causes polling on the DB.',
      2: 'Servers are separate processes, often on separate machines. Direct memory access is not possible across a network boundary.',
      3: 'Polling the DB defeats the purpose of real-time delivery and scales poorly — imagine 10 million users polling.',
    },
    r: { id: 's6', label: 'Section 6 — Cross-server delivery via Redis Pub/Sub' },
  },
  {
    q: 'What is the "fan-out problem" in group chat?',
    o: [
      'Messages arrive out of order because the network reorders packets',
      'The server fan runs out of cooling capacity under load',
      'Users in different time zones see different message orders',
      'One message sent to a group must be delivered to every member, which can involve many servers and creates N write amplification',
    ],
    a: 3,
    e: 'Fan-out means one inbound message triggers N outbound deliveries (one per group member). For a 1000-member group, one send creates 1000 push operations. At huge scale (100,000+ members), fan-out is done asynchronously via a queue so the sender does not wait.',
    w: {
      0: 'Network reordering is a real problem, but it is called "message ordering" not fan-out. Fan-out is specifically about delivery amplification.',
      1: 'Fan-out is a term borrowed from electronics (one signal going to many receivers) — nothing to do with physical cooling.',
      2: 'Time zones affect display formatting, not message ordering logic. Ordering is about server-assigned sequence numbers.',
    },
    r: { id: 's5', label: 'Section 5 — Fan-out problem' },
  },
  {
    q: 'An offline user reconnects. How does the chat server deliver missed messages?',
    o: [
      'The other users must resend their messages manually',
      'The server re-broadcasts all historical messages from the beginning',
      'Query messages where sentAt > user.lastSeen for each of the user\'s conversations, then push them over the new WebSocket',
      'Messages not delivered in 1 minute are permanently dropped',
    ],
    a: 2,
    e: 'Messages are always persisted to the database immediately. On reconnect, the server queries for messages newer than the user\'s lastSeen timestamp in all their conversations and delivers them over the new WebSocket connection.',
    w: {
      0: 'The whole point of the database is so the server can replay missed messages without relying on other clients.',
      1: 'Re-broadcasting all history from the beginning would be enormous for active conversations. Only missed messages (since lastSeen) are delivered.',
      3: 'Dropping messages after a timeout is not acceptable for a chat system — messages must be durable until the recipient confirms delivery.',
    },
    r: { id: 's8', label: 'Section 8 — Offline delivery & message ordering' },
  },
  {
    q: 'What is the difference between DELIVERED and READ status?',
    o: [
      'They are the same — both mean the recipient has seen the message',
      'DELIVERED means the recipient\'s device received the message; READ means the recipient opened the conversation',
      'DELIVERED is for direct messages; READ is only for group chats',
      'DELIVERED means the server stored the message; READ means the recipient opened the conversation',
    ],
    a: 1,
    e: 'DELIVERED (double grey tick): the recipient\'s device received and acknowledged the message over WebSocket. READ (double blue tick): the recipient opened the conversation — a "read" event is sent back to the sender. The server first confirms delivery, then the client confirms viewing.',
    w: {
      0: 'They are different stages. DELIVERED confirms the message left the server and reached the device. READ confirms the user actually viewed it.',
      2: 'Both statuses apply to both direct and group conversations. In group chats, DELIVERED and READ are tracked per recipient.',
      3: 'SENT means the server stored the message. DELIVERED means it reached the recipient\'s device. These are distinct states with different meaning.',
    },
    r: { id: 's8', label: 'Section 8 — Read & delivery receipts' },
  },
  {
    q: 'Why is SSE (Server-Sent Events) not ideal for a two-way chat system?',
    o: [
      'SSE is server-to-client only — the client cannot send messages back over the same channel',
      'SSE is too slow for real-time delivery',
      'SSE cannot carry text content, only binary data',
      'SSE requires a special browser plugin',
    ],
    a: 0,
    e: 'SSE is a one-way stream: the server pushes events, but the client must use separate HTTP requests to send messages. For chat, you need bidirectional communication — WebSocket gives a full-duplex channel over a single connection.',
    w: {
      1: 'SSE is fast for delivery — it is a persistent HTTP stream. The problem is direction, not speed.',
      2: 'SSE carries UTF-8 text events. The limitation is direction (server→client only), not content type.',
      3: 'SSE is a standard browser API supported in all modern browsers without plugins.',
    },
    r: { id: 's2', label: 'Section 2 — Transport comparison table' },
  },
  {
    q: 'How should message IDs be generated to guarantee correct ordering per conversation?',
    o: [
      'Use the database auto-increment primary key across all conversations',
      'Use random UUIDs — they are globally unique',
      'Use the client\'s local timestamp as the message ID',
      'Use a server-side monotonically increasing ID (Snowflake-style or per-conversation sequence counter)',
    ],
    a: 3,
    e: 'Message ordering must be determined by the server, not the client (clients have clock skew). Snowflake IDs embed a server timestamp + sequence counter and are monotonically increasing per server, giving global ordering. A per-conversation sequence counter also works.',
    w: {
      0: 'A global auto-increment across all conversations works but creates a single write bottleneck and leaks metadata (conversation volume can be inferred from gaps).',
      1: 'Random UUIDs have no ordering guarantee — sorting by UUID does not give chronological order.',
      2: 'Client timestamps are unreliable: clocks differ between devices, and clients can fake them. The server assigns the authoritative timestamp.',
    },
    r: { id: 's8', label: 'Section 8 — Message ordering & Snowflake IDs' },
  },
  {
    q: 'Which data structure maps a userId to their active WebSocket session on one server?',
    o: [
      'A sorted set, keyed by last message time',
      'A global static list shared across all server instances',
      'A ConcurrentHashMap<String, WebSocketSession> stored in the server\'s memory',
      'A table in the relational database',
    ],
    a: 2,
    e: 'Each chat server keeps a ConcurrentHashMap in memory mapping userId to their live WebSocket session. ConcurrentHashMap is thread-safe for concurrent reads/writes. This map is local to the server — cross-server discovery uses Redis (userId → serverId mapping).',
    w: {
      0: 'A sorted set by time is useful for other purposes (e.g., rate limiting), not for quickly looking up a user\'s active socket.',
      1: 'A single global static list shared across server instances is impossible — each server is a separate process, often on a different machine.',
      3: 'WebSocket session objects cannot be stored in a relational database — they are live in-memory objects holding an open TCP connection.',
    },
    r: { id: 's6', label: 'Section 6 — WebSocket connection management' },
  },
]

/* ===== Page ===== */
export default function Day88() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 88</div>
        <h1>Real-time Chat:<br />WebSocket, Fan-out &amp; Delivery Guarantees</h1>
        <p>
          HTTP is a vending machine — you push, it responds. Chat needs a walkie-talkie.
          WebSocket keeps the channel open so the server can speak first. This day builds
          the real-time infrastructure behind chat, from the handshake to cross-server fan-out.
        </p>
        <div className="chips">
          {['WebSocket', 'Long Polling', 'Fan-out', 'Redis Pub/Sub', 'Offline Delivery', 'Read Receipts', 'Message Ordering'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 — Analogy */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The walkie-talkie vs the vending machine</h2>
        <p>
          Standard HTTP works like a <strong>vending machine</strong>. You push a button (you send a request).
          The machine dispenses something (the server responds). Then the transaction is over.
          The machine cannot call you. You must push the button again.
        </p>
        <p>
          For a chat app, that model fails. Imagine if WhatsApp worked like a vending machine — you had
          to press "check for new messages" every few seconds. That is <em>polling</em>, and it is slow,
          wasteful, and annoying.
        </p>
        <p>
          A <strong>walkie-talkie</strong> is different. Once you connect, either side can speak at any moment.
          You do not need to ask first. The other person just talks, and you hear it immediately.
        </p>
        <p>
          WebSocket turns an HTTP connection into a walkie-talkie. After a one-time <em>upgrade handshake</em>,
          the same TCP connection stays open. The server can push a message to you at any time — no polling,
          no delay, no wasted requests.
        </p>
        <Note>
          The core insight: real-time chat needs the <strong>server to initiate delivery</strong>.
          HTTP was designed for clients to initiate. WebSocket flips this — after the handshake, both sides
          can initiate. That is the entire reason it exists.
        </Note>
        <Code html={`<span class="cm">// Traditional HTTP: client must always ask first</span>
<span class="cm">// Client → Server: GET /messages?since=1000   (client asks)</span>
<span class="cm">// Server → Client: [ {msg1}, {msg2} ]          (server answers)</span>
<span class="cm">// ... connection closes. Client waits 3 seconds. Asks again.</span>

<span class="cm">// WebSocket: after one handshake, server can push any time</span>
<span class="cm">// Client → Server: HTTP Upgrade request         (one-time setup)</span>
<span class="cm">// Server → Client: 101 Switching Protocols       (accepted)</span>
<span class="cm">// [connection stays open — both sides can send frames at will]</span>
<span class="cm">// Server → Client: frame { "type":"message", "text":"hi" }  ← push!</span>
<span class="cm">// Client → Server: frame { "type":"ack", "id": "42" }      ← reply</span>`} />
      </section>

      {/* S2 — Transport comparison */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Four transport choices — and why WebSocket wins for chat</h2>
        <p>
          Before WebSocket, developers used workarounds to simulate real-time delivery over HTTP.
          Each has trade-offs.
        </p>
        <table className="matrix">
          <thead>
            <tr>
              <th>Approach</th>
              <th>Direction</th>
              <th>How it works</th>
              <th>Verdict for chat</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Polling</strong></td>
              <td>Client → Server</td>
              <td>Client asks "anything new?" every N seconds</td>
              <td className="no">Laggy, wastes bandwidth</td>
            </tr>
            <tr>
              <td><strong>Long Polling</strong></td>
              <td>Client → Server</td>
              <td>Client asks; server holds the connection open until a message arrives or timeout</td>
              <td className="no">Better, but still burns connections</td>
            </tr>
            <tr>
              <td><strong>SSE</strong></td>
              <td>Server → Client only</td>
              <td>Persistent HTTP stream; server pushes events</td>
              <td className="no">Good for notifications; one-way only</td>
            </tr>
            <tr>
              <td><strong>WebSocket</strong></td>
              <td>Bidirectional</td>
              <td>Upgraded HTTP connection; full-duplex frames</td>
              <td className="yes">Best for chat</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ marginTop: 20 }}>The WebSocket upgrade handshake</h3>
        <p>
          WebSocket starts as HTTP — so it works through firewalls and proxies. The client sends a
          special HTTP request. The server responds with 101. After that, the protocol changes from HTTP
          to WebSocket frames over the same TCP connection.
        </p>
        <Code html={`<span class="cm">// Step 1: client sends HTTP upgrade request</span>
GET /ws HTTP/1.1
Host: chat.example.com
Upgrade: websocket           <span class="cm">// "I want to switch to WebSocket"</span>
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==   <span class="cm">// random key for verification</span>
Sec-WebSocket-Version: 13

<span class="cm">// Step 2: server accepts the upgrade</span>
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=  <span class="cm">// server signs the key</span>

<span class="cm">// Now: bidirectional WebSocket frames over the SAME TCP connection</span>
<span class="cm">// No HTTP headers on subsequent messages — just small binary frames</span>
<span class="cm">// Either side sends a frame at any time → that's the walkie-talkie effect</span>`} />

        <Reveal summary="Why does SSE not work for bidirectional chat?">
          <p>
            SSE (Server-Sent Events) is a one-way stream: the server can push events to the client,
            but the client cannot send messages back over the same SSE connection. The client must
            use a separate HTTP POST to send a message. This means two connections per user instead
            of one. WebSocket gives a single full-duplex channel where both sending and receiving
            share the same TCP connection.
          </p>
          <p>
            Use SSE when you only need server-to-client push: live scores, stock tickers, notification
            feeds. Use WebSocket when the client also sends data frequently: chat, collaborative editing,
            multiplayer games.
          </p>
        </Reveal>
      </section>

      {/* S3 — Core entities */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Core entities of a chat system</h2>
        <p>
          Keep the data model minimal. There are four entities. Everything else is derived from them.
        </p>
        <Code html={`<span class="cm">// Entity 1: the person using the app</span>
<span class="kw">class</span> User {
    String id;                 <span class="cm">// unique user ID</span>
    String username;           <span class="cm">// display name</span>
    UserStatus status;         <span class="cm">// ONLINE / OFFLINE / AWAY</span>
    Instant lastSeen;          <span class="cm">// used to deliver missed messages on reconnect</span>
}

<span class="cm">// Entity 2: a conversation (1-to-1 or group)</span>
<span class="kw">class</span> Conversation {
    String id;
    ConversationType type;     <span class="cm">// DIRECT (2 users) or GROUP (many users)</span>
    String name;               <span class="cm">// only for groups ("Project Alpha")</span>
    List&lt;String&gt; memberIds;   <span class="cm">// who is in this conversation</span>
    Instant createdAt;
}

<span class="cm">// Entity 3: a single message</span>
<span class="kw">class</span> Message {
    String id;                 <span class="cm">// Snowflake ID — monotonically increasing for ordering</span>
    String conversationId;     <span class="cm">// which conversation this belongs to</span>
    String senderId;           <span class="cm">// who sent it</span>
    String content;            <span class="cm">// the text (or media URL)</span>
    Instant sentAt;            <span class="cm">// server-assigned timestamp (not client clock)</span>
    MessageStatus status;      <span class="cm">// SENT / DELIVERED / READ</span>
}

<span class="cm">// Entity 4: per-member state inside a conversation</span>
<span class="kw">class</span> ConversationMember {
    String conversationId;
    String userId;
    Instant joinedAt;
    String lastReadMessageId;  <span class="cm">// last message this user read — used for read receipts</span>
}`} />

        <Code html={`<span class="cm">// ASCII entity diagram</span>

  User ──────────── ConversationMember ──────────── Conversation
  (id, username,     (conversationId,               (id, type,
   status,            userId,                        name,
   lastSeen)          lastReadMessageId)              memberIds)
                               │
                               │ is part of
                               ▼
                           Message
                      (id, conversationId,
                       senderId, content,
                       sentAt, status)

  One Conversation has many Messages.
  One User has many ConversationMember rows (one per conversation they joined).
  lastReadMessageId on ConversationMember → the cursor for unread counts and read receipts.`} />

        <Note>
          The key insight: <C>ConversationMember</C> stores per-user state inside a conversation
          (their read cursor). The <C>Message</C> itself is shared — it is not duplicated per recipient.
          Only the delivery and read status are per-recipient.
        </Note>
      </section>

      {/* S4 — Demo 1 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: transport comparison</h2>
        <p>
          Start a long-poll request. Then press <strong>New message arrives on server</strong>
          and watch how each transport delivers it. Notice that polling can wait up to 3 seconds,
          while WebSocket delivers instantly.
        </p>
        <TransportDemo />
      </section>

      {/* S5 — Fan-out problem */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The fan-out problem: one message, many recipients</h2>
        <p>
          In a direct chat (A → B), delivery is simple: find B's WebSocket and push.
          In a group with 500 members, one message must trigger 499 pushes. This is called
          <strong> fan-out</strong> — one input fans out to many outputs.
        </p>
        <Code html={`<span class="cm">// Fan-out: Alice sends to Group(Alice, Bob, Carol, Dave)</span>

 Alice's WebSocket                  Chat Server
      │                                  │
      ├──── send("Hey team!") ──────────▶│
      │                                  │── 1. save Message to DB (durable first)
      │                                  │── 2. fan-out to all members:
      │                                  │
      │                                  │   Bob   → ONLINE  → push immediately
      │◀── ack("saved") ─────────────────│   Carol → ONLINE  → push immediately
      │                                  │   Dave  → OFFLINE → skip push; DB stores it
      │                                  │
 Bob's socket ◀── push("Hey team!") ────┤
 Carol's socket ◀── push("Hey team!") ──┘`} />

        <h3 style={{ marginTop: 20 }}>The multi-server problem</h3>
        <p>
          In production you run many chat servers behind a load balancer. Alice is connected to
          Server 1. Bob is connected to Server 3. Server 1 cannot directly write to Bob's socket
          on Server 3 — they are separate processes, possibly on different machines.
        </p>
        <Code html={`<span class="cm">// The problem</span>
 Server 1 (Alice)           Server 2 (Carol)         Server 3 (Bob)
      │                          │                        │
      │  Alice sends message      │                        │
      │                          │                        │
      │  How does Server 1 reach Bob's socket on Server 3?  ← ❌ cannot directly

<span class="cm">// The solution: a message broker in the middle</span>
 Server 1 → PUBLISH to Redis channel "conv:42" → Server 2 subscribes → pushes to Carol
                                               → Server 3 subscribes → pushes to Bob`} />

        <Warn>
          For very large groups (10,000+ members), fan-out is slow if done synchronously.
          At that scale, fan-out is done asynchronously: the server publishes to a Kafka topic;
          worker threads consume and push in parallel. The sender gets an ACK immediately; delivery
          happens in the background.
        </Warn>
      </section>

      {/* S6 — Redis Pub/Sub + code */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Cross-server delivery: Redis Pub/Sub and connection management</h2>

        <h3>WebSocket connection management</h3>
        <p>
          Each chat server keeps a map from userId to their live WebSocket session.
          This map lives in the server's memory — not in the database.
          When a user connects, they are registered. When they disconnect, they are removed.
        </p>
        <Code html={`<span class="kw">class</span> ChatWebSocketHandler {
    <span class="cm">// userId → their live socket — ConcurrentHashMap is thread-safe</span>
    Map&lt;String, WebSocketSession&gt; sessions = <span class="kw">new</span> ConcurrentHashMap&lt;&gt;();

    <span class="kw">void</span> onConnect(String userId, WebSocketSession session) {
        sessions.put(userId, session);              <span class="cm">// register this connection</span>
        redis.hset(<span class="str">"user_servers"</span>, userId, myServerId); <span class="cm">// tell Redis which server this user is on</span>
        userRepo.setStatus(userId, ONLINE);         <span class="cm">// update presence in DB</span>
        deliverPendingMessages(userId);             <span class="cm">// push any missed messages immediately</span>
    }

    <span class="kw">void</span> onDisconnect(String userId) {
        sessions.remove(userId);                    <span class="cm">// unregister the dead socket</span>
        redis.hdel(<span class="str">"user_servers"</span>, userId);          <span class="cm">// clear the cross-server lookup</span>
        userRepo.setLastSeen(userId, Instant.now()); <span class="cm">// record when they went offline</span>
    }

    <span class="kw">void</span> onMessage(String senderId, String json) {
        SendMessageRequest req = parse(json);
        Message msg = messageRepo.save(             <span class="cm">// persist FIRST — crash-safe</span>
            <span class="kw">new</span> Message(req.conversationId(), senderId, req.content(), now()));
        fanOut(msg);                                <span class="cm">// THEN deliver to recipients</span>
    }

    <span class="kw">void</span> fanOut(Message msg) {
        List&lt;String&gt; members = conversationRepo.getMembers(msg.conversationId());
        <span class="kw">for</span> (String memberId : members) {
            <span class="kw">if</span> (memberId.equals(msg.senderId())) <span class="kw">continue</span>; <span class="cm">// don't echo to sender</span>

            WebSocketSession local = sessions.get(memberId);
            <span class="kw">if</span> (local != <span class="kw">null</span>) {
                local.send(serialize(msg));          <span class="cm">// on THIS server: direct push</span>
            } <span class="kw">else</span> {
                <span class="cm">// not on this server — publish to broker; their server will pick it up</span>
                redis.publish(<span class="str">"conv:"</span> + msg.conversationId(), serialize(msg));
            }
        }
    }
}`} />

        <h3 style={{ marginTop: 20 }}>Redis Pub/Sub as the message bus</h3>
        <Code html={`<span class="cm">// Every chat server subscribes to conversations its users are in</span>
<span class="cm">// Redis SUBSCRIBE conv:42   ← Server 2 subscribes on behalf of Bob and Carol</span>

<span class="cm">// When Server 1 publishes:</span>
<span class="cm">// Redis PUBLISH conv:42 "{...message json...}"</span>
<span class="cm">// Redis delivers to ALL subscribers → Server 2 receives it → pushes to Bob and Carol</span>

<span class="cm">// Cross-server user lookup: Redis hash maps userId to serverId</span>
<span class="cm">// HSET user_servers "alice_id" "server-1"</span>
<span class="cm">// HSET user_servers "bob_id"   "server-3"</span>
<span class="cm">// Server 1 can HGET user_servers "bob_id" → "server-3" → know where Bob is</span>`} />

        <Good>
          Save the message to the database <strong>before</strong> attempting delivery.
          If the server crashes after saving but before publishing, the message is not lost —
          the offline delivery flow will find it when the recipient reconnects.
          If you publish before saving, a crash means the message is gone forever.
        </Good>
      </section>

      {/* S7 — Demo 2 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>Play: multi-server fan-out</h2>
        <p>
          Step through the message flow. Watch how Server 1 cannot push directly to Bob and Carol —
          it goes through Redis. Then bring Dave online to see offline delivery.
        </p>
        <FanOutDemo />
      </section>

      {/* S8 — Offline delivery, ordering, receipts */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Offline delivery, message ordering, and read receipts</h2>

        <h3>Offline delivery</h3>
        <p>
          When a user is offline, messages are stored in the database with status <C>SENT</C>.
          When they reconnect (<C>onConnect</C>), the server queries:
        </p>
        <Code html={`<span class="cm">// On reconnect: find all messages the user missed</span>
<span class="kw">void</span> deliverPendingMessages(String userId) {
    User user = userRepo.find(userId);
    List&lt;String&gt; convIds = memberRepo.getConversationIds(userId); <span class="cm">// which convs is this user in?</span>

    <span class="kw">for</span> (String convId : convIds) {
        <span class="cm">// get all messages after their lastSeen timestamp</span>
        List&lt;Message&gt; missed = messageRepo.findAfter(convId, user.lastSeen());
        <span class="kw">for</span> (Message m : missed) {
            sessions.get(userId).send(serialize(m)); <span class="cm">// push over the new socket</span>
        }
    }
}`} />

        <h3 style={{ marginTop: 20 }}>Message ordering — why client timestamps are wrong</h3>
        <p>
          If two users send messages at the same millisecond, who was first? You cannot trust
          client clocks — they drift, and users can set them to anything.
          The <strong>server assigns the authoritative timestamp and sequence ID</strong>.
        </p>
        <Code html={`<span class="cm">// Snowflake ID structure (Twitter's approach, widely adopted)</span>
<span class="cm">// 64-bit integer composed of:</span>
<span class="cm">//   41 bits = milliseconds since epoch     → good until ~year 2100</span>
<span class="cm">//   10 bits = machine/datacenter ID        → supports 1024 servers</span>
<span class="cm">//   12 bits = sequence counter per machine → 4096 IDs per ms per server</span>

<span class="cm">// Result: IDs are monotonically increasing AND globally unique</span>
<span class="cm">// Sort by ID → chronological order → no extra timestamp column needed for sorting</span>

<span class="kw">long</span> snowflakeId = (currentMs - EPOCH) &lt;&lt; <span class="num">22</span>
                 | (machineId         &lt;&lt; <span class="num">12</span>)
                 | sequenceCounter++;    <span class="cm">// resets each millisecond</span>`} />

        <h3 style={{ marginTop: 20 }}>Read receipts and delivery receipts</h3>
        <p>
          Three status levels, each with a different trigger:
        </p>
        <Code html={`<span class="cm">// SENT: server received and stored the message</span>
<span class="cm">// → sender gets an ACK from the server over their own WebSocket</span>
<span class="cm">// → single grey tick in WhatsApp</span>

<span class="cm">// DELIVERED: recipient's device received the message over WebSocket</span>
<span class="cm">// → recipient's client sends { "type": "delivered", "messageId": "..." } back to server</span>
<span class="cm">// → server updates Message.status = DELIVERED</span>
<span class="cm">// → server notifies sender → double grey tick</span>

<span class="cm">// READ: recipient opened the conversation</span>
<span class="cm">// → recipient's client sends { "type": "read", "conversationId": "..." }</span>
<span class="cm">// → server updates ConversationMember.lastReadMessageId</span>
<span class="cm">// → server notifies sender → double blue tick</span>

<span class="cm">// Group read receipts: track per (user, conversation)</span>
<span class="cm">// "how many members have lastReadMessageId >= this message?" → read count</span>`} />

        <Reveal summary="Unread message count — how to compute it efficiently">
          <p>
            Instead of counting unread messages on every query, store a cursor:
            <C>lastReadMessageId</C> on <C>ConversationMember</C>. The unread count is:
            "how many messages in this conversation have ID &gt; lastReadMessageId?"
            This is one indexed range query. When the user opens the conversation,
            update <C>lastReadMessageId</C> to the latest message ID and reset the count to 0.
          </p>
        </Reveal>
      </section>

      {/* S9 — Demo 3 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>Play: message status tracker</h2>
        <p>
          Send a message to a group. Step through SENT → DELIVERED → READ.
          Watch the ticks change. Bring Carol online to see offline delivery.
        </p>
        <MessageStatusDemo />
      </section>

      {/* S10 — Scaling + cheat sheet */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Scaling beyond one broker, and the cheat sheet</h2>

        <h3>Kafka for durability</h3>
        <p>
          Redis Pub/Sub is fast but ephemeral — if a server is down when a message is published,
          it misses it. For larger systems, Kafka replaces Redis Pub/Sub. Kafka keeps messages
          on disk, so servers that were down can catch up when they restart.
          Each conversation maps to a Kafka partition, guaranteeing ordering within a conversation.
        </p>
        <Code html={`<span class="cm">// Redis Pub/Sub: fire-and-forget, in-memory, fast</span>
<span class="cm">// → use when all servers are always up; small to medium scale</span>

<span class="cm">// Kafka: durable, ordered, replayable, partitioned</span>
<span class="cm">// → use when servers can restart; large scale; need audit log</span>
<span class="cm">// Topic: "chat-messages", partition key = conversationId → ordering per conversation</span>

<span class="cm">// Message retention: keep messages in Kafka for N days</span>
<span class="cm">// → any new server spins up and replays recent messages to warm up</span>`} />

        <h3 style={{ marginTop: 16 }}>End-to-end encryption note</h3>
        <p>
          In E2E-encrypted chat (WhatsApp, Signal), the server stores ciphertext — it cannot read messages.
          Each client has a public/private key pair. The sender encrypts with the recipient's public key.
          The server never sees plaintext. This is a separate concern from transport — the WebSocket
          channel itself uses TLS (encrypted transport), but E2E goes further: even the server is excluded.
        </p>

        <h3 style={{ marginTop: 16 }}>Cheat sheet</h3>
        <ul>
          <li><strong>WebSocket:</strong> HTTP upgrade to persistent bidirectional channel; server can push any time.</li>
          <li><strong>Polling:</strong> client asks repeatedly; simple but laggy and wasteful.</li>
          <li><strong>Long polling:</strong> client holds connection open until message arrives; better latency, still reconnects per message.</li>
          <li><strong>SSE:</strong> server-to-client only streaming; good for feeds and notifications, not bidirectional chat.</li>
          <li><strong>Fan-out:</strong> one inbound message triggers N outbound deliveries to group members.</li>
          <li><strong>Redis Pub/Sub:</strong> message broker for cross-server delivery; Server 1 publishes, Server 2 delivers.</li>
          <li><strong>Offline delivery:</strong> persist message to DB first; on reconnect, query messages since <C>lastSeen</C>.</li>
          <li><strong>Message ordering:</strong> server assigns Snowflake IDs (monotonically increasing); never trust client timestamps.</li>
          <li><strong>SENT → DELIVERED → READ:</strong> three status levels, each triggered by a different event (server save → device ACK → conversation open).</li>
          <li><strong>Read receipts:</strong> <C>lastReadMessageId</C> per <C>ConversationMember</C>; unread count = messages with ID above cursor.</li>
          <li><strong>Kafka:</strong> durable alternative to Redis Pub/Sub; partition by conversationId for ordering.</li>
          <li><strong>E2E encryption:</strong> server stores ciphertext; even the server cannot read messages.</li>
        </ul>

        <Reveal summary="Common traps and mistakes in chat system design">
          <ul>
            <li>
              <strong>Save after publish:</strong> if you publish to the broker before saving to the database
              and the server crashes, the message is lost. Always save first, then publish.
            </li>
            <li>
              <strong>Trusting client timestamps:</strong> client clocks drift. Use server-assigned Snowflake IDs
              for ordering. Store the client timestamp separately if you want to show "sent at" time.
            </li>
            <li>
              <strong>One global lock for sessions map:</strong> using a single <C>synchronized</C> map
              serializes all WebSocket events. Use <C>ConcurrentHashMap</C> for per-bucket locking.
            </li>
            <li>
              <strong>Echo to sender:</strong> in the fan-out loop, always skip the sender. If you push the message
              back to Alice, she sees her own message appear twice.
            </li>
            <li>
              <strong>Global Redis channel for all conversations:</strong> if you publish all messages to one Redis
              channel, every server receives every message for every conversation. Use per-conversation channels
              (<C>conv:42</C>) so servers only receive messages relevant to their connected users.
            </li>
            <li>
              <strong>Synchronous fan-out for huge groups:</strong> for 10,000-member groups, synchronous fan-out
              blocks the sender's handler for seconds. Use an async queue (Kafka) for large fan-out.
            </li>
          </ul>
        </Reveal>
      </section>

      {/* INTERVIEW CORNER */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Real-time chat: interview questions</h2>
        <p>These cover the corners that interviewers love. Click each to reveal the answer.</p>

        <Reveal summary="Why use WebSocket instead of polling for a chat app?">
          <p>
            Polling wastes bandwidth and adds latency equal to the poll interval. If you poll every 3 seconds,
            a message can wait up to 3 seconds before the client sees it. Worse, most polls return empty —
            you are sending HTTP requests and getting nothing back. WebSocket solves both problems: the
            persistent connection lets the server push the moment a message arrives (near-zero latency),
            and there are no wasted round trips after the initial handshake. One connection per client
            handles all messages in both directions.
          </p>
        </Reveal>

        <Reveal summary="A user is connected to Server 1. I want to push them a message from Server 2. How?">
          <p>
            Servers cannot directly reach each other's memory. The standard approach is a message broker:
          </p>
          <ol>
            <li>On connect, each server registers the user: <C>HSET user_servers userId serverId</C> in Redis.</li>
            <li>Server 2 looks up the user: <C>HGET user_servers userId</C> → "server-1".</li>
            <li>Server 2 publishes to a Redis Pub/Sub channel (e.g., <C>conv:42</C>).</li>
            <li>Server 1 is subscribed to that channel. It receives the message and pushes to the user's local socket.</li>
          </ol>
          <p>
            For production scale, replace Redis Pub/Sub with Kafka, which adds durability and replay.
          </p>
        </Reveal>

        <Reveal summary="How does WhatsApp's double-tick / blue-tick work at the data model level?">
          <p>
            Three message statuses, each triggered by a different event:
          </p>
          <ul>
            <li><strong>SENT (single grey tick):</strong> server persisted the message and ACKed the sender.</li>
            <li><strong>DELIVERED (double grey tick):</strong> recipient's device received the message over WebSocket
              and sent back a <C>&#123;"type":"delivered","messageId":"..."&#125;</C> event. The server updates the message
              status and notifies the sender.</li>
            <li><strong>READ (double blue tick):</strong> recipient opened the conversation. The client sends a
              <C>&#123;"type":"read","conversationId":"..."&#125;</C> event. The server updates <C>lastReadMessageId</C>
              on <C>ConversationMember</C> and notifies the sender.</li>
          </ul>
          <p>
            For group chats, the ticks turn blue only when ALL recipients have read. The server counts
            members where <C>lastReadMessageId &gt;= this message ID</C>.
          </p>
        </Reveal>

        <Reveal summary="What is the fan-out problem in group chat? How do you handle a 10,000-member group?">
          <p>
            Fan-out means one inbound message must be delivered to N members. For a 10,000-member group,
            one send creates 9,999 push operations. If done synchronously, the sender's handler blocks for
            seconds; this is unacceptable.
          </p>
          <p>
            For large groups, use asynchronous fan-out:
          </p>
          <ol>
            <li>Server receives the message, saves to DB, immediately ACKs the sender.</li>
            <li>Server publishes to a Kafka topic (non-blocking, very fast).</li>
            <li>A pool of fan-out workers consumes from Kafka and pushes to each member's WebSocket (in parallel).</li>
          </ol>
          <p>
            This decouples the sender's latency from the group size. WhatsApp actually limits group sizes
            partly for this reason.
          </p>
        </Reveal>

        <Reveal summary="How do you guarantee message ordering when multiple servers handle sends?">
          <p>
            You cannot trust client timestamps — clocks drift. Use server-assigned <strong>Snowflake IDs</strong>:
            a 64-bit integer combining a millisecond timestamp, machine ID, and per-machine sequence counter.
            Snowflake IDs are monotonically increasing and globally unique. Sorting messages by their Snowflake ID
            gives chronological order.
          </p>
          <p>
            For per-conversation ordering, you can also use a per-conversation sequence counter stored in Redis:
            <C>INCR conv:42:seq</C> on each message send. This gives you a simple integer sequence per conversation.
            The trade-off: Redis is a single point of failure for counter generation; Snowflake IDs are generated
            locally on each server with no coordination.
          </p>
        </Reveal>

        <Reveal summary="What is the difference between SSE and WebSocket? When do you pick each?">
          <p>
            <strong>SSE (Server-Sent Events):</strong> server-to-client only. The client opens a persistent HTTP
            connection; the server streams events. The client cannot send data back over SSE — it must use
            separate HTTP requests. Simple, works through HTTP/2 multiplexing, auto-reconnects.
          </p>
          <p>
            <strong>WebSocket:</strong> full-duplex. Both client and server can send frames at any time over
            the same connection. Slightly more complex (upgrade handshake, framing protocol).
          </p>
          <p>
            <strong>Pick SSE when:</strong> only the server sends data (live scores, notifications, server logs).
            Pick WebSocket when: both sides send data frequently (chat, collaborative editing, real-time gaming).
          </p>
          <p>
            For chat specifically: users send messages (client→server) AND receive messages (server→client)
            continuously. WebSocket is the right choice.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="sq">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 88 complete?</strong> Homework: Design a data model for group chat on paper.
        Draw the tables for User, Conversation, ConversationMember, and Message. Add columns for
        read receipts (per-member read cursor). Write the SQL query that returns the unread message
        count for each conversation for a given user. Then write the query that returns the list of
        members who have read a specific message. Think about which columns need indexes.
        <br /><br />
        Next: <strong>Day 89 — Leaderboard &amp; Top-K</strong>: how do you compute and maintain a
        real-time leaderboard (like a gaming scoreboard or Twitter trending topics) for millions of users?
        We will cover sorted sets, Redis ZADD, approximate top-K with count-min sketch, and the
        difference between real-time and periodic computation.
      </div>
    </div>
  )
}
