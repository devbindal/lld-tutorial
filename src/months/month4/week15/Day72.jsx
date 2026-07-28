import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Live bidding
   ============================================================ */
const BIDDERS = ['Alice', 'Bob', 'Carol']
const BIDDER_COLORS = { Alice: '#E3F2FD', Bob: '#E8F5E9', Carol: '#FFF8E1' }
const BIDDER_TEXT = { Alice: '#1565C0', Bob: '#2E7D32', Carol: '#F57F17' }
const STARTING_PRICE = 5000
const RESERVE_PRICE = 8000
const MIN_INCREMENT = 500

function LiveBiddingDemo() {
  const [bids, setBids] = useState([])
  const [customBidder, setCustomBidder] = useState('Alice')
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState(null) // { text, type: 'ok'|'err'|'win' }
  const [settled, setSettled] = useState(false)

  const highestBid = bids.length > 0 ? bids[bids.length - 1].amount : STARTING_PRICE
  const highestBidder = bids.length > 0 ? bids[bids.length - 1].bidder : null
  const minNext = bids.length === 0 ? STARTING_PRICE : highestBid + MIN_INCREMENT

  function placeBid(bidder, amount) {
    if (settled) { setMessage({ text: 'Auction is already closed.', type: 'err' }); return }
    if (amount < minNext) {
      setMessage({ text: `Bid ₹${amount.toLocaleString()} is too low. Minimum is ₹${minNext.toLocaleString()}.`, type: 'err' })
      return
    }
    if (bidder === highestBidder) {
      setMessage({ text: `${bidder} is already the highest bidder!`, type: 'err' })
      return
    }
    const newBid = { bidder, amount, time: new Date().toLocaleTimeString() }
    setBids(prev => [...prev, newBid])
    setMessage({ text: `${bidder} bid ₹${amount.toLocaleString()} — now highest!`, type: 'ok' })
    setCustomAmount('')
  }

  function settle() {
    setSettled(true)
    if (bids.length === 0 || highestBid < RESERVE_PRICE) {
      setMessage({ text: `Reserve price of ₹${RESERVE_PRICE.toLocaleString()} was NOT met. No winner.`, type: 'err' })
    } else {
      setMessage({ text: `Auction settled! Winner: ${highestBidder} at ₹${highestBid.toLocaleString()}.`, type: 'win' })
    }
  }

  function reset() {
    setBids([])
    setMessage(null)
    setSettled(false)
    setCustomAmount('')
  }

  const suggestedBids = [
    { bidder: 'Alice', amount: 5000 },
    { bidder: 'Bob',   amount: 5500 },
    { bidder: 'Carol', amount: 6000 },
    { bidder: 'Alice', amount: 6500 },
    { bidder: 'Bob',   amount: 8500 },
  ]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · bid on a Vintage Guitar — watch reserve price logic and bid validation</div>

      {/* Auction header */}
      <div style={{ background: '#f0ede6', borderRadius: 8, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16 }}>🎸 Vintage Guitar (1962)</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Starting price: ₹{STARTING_PRICE.toLocaleString()} · Min increment: ₹{MIN_INCREMENT.toLocaleString()} · Reserve: hidden</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#666' }}>Current price</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, fontWeight: 700, color: 'var(--blue)' }}>₹{highestBid.toLocaleString()}</div>
            {highestBidder && <div style={{ fontSize: 12, color: '#666' }}>Highest: <b>{highestBidder}</b></div>}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          marginBottom: 12, padding: '10px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
          background: message.type === 'win' ? '#E8F5E9' : message.type === 'err' ? '#FFEBEE' : '#E3F2FD',
          color: message.type === 'win' ? '#2E7D32' : message.type === 'err' ? '#C62828' : '#1565C0',
          border: `1px solid ${message.type === 'win' ? '#A5D6A7' : message.type === 'err' ? '#FFCDD2' : '#90CAF9'}`
        }}>
          {message.type === 'win' ? '🏆 ' : message.type === 'err' ? '⚠ ' : '✅ '}{message.text}
        </div>
      )}

      {/* Quick bid buttons */}
      {!settled && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7c8aa5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Suggested bids (click in order for a realistic auction)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestedBids.map((b, i) => {
              const alreadyDone = bids.some(bid => bid.bidder === b.bidder && bid.amount === b.amount)
              return (
                <button key={i} onClick={() => placeBid(b.bidder, b.amount)}
                  disabled={alreadyDone}
                  style={{
                    fontSize: 12, padding: '6px 12px', cursor: alreadyDone ? 'default' : 'pointer',
                    border: 'none', borderRadius: 6, opacity: alreadyDone ? 0.4 : 1,
                    background: BIDDER_COLORS[b.bidder], color: BIDDER_TEXT[b.bidder], fontWeight: 600
                  }}>
                  {b.bidder} ₹{b.amount.toLocaleString()}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Custom bid */}
      {!settled && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <select value={customBidder} onChange={e => setCustomBidder(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}>
            {BIDDERS.map(b => <option key={b}>{b}</option>)}
          </select>
          <input className="txt" type="number" placeholder={`Min ₹${minNext.toLocaleString()}`}
            value={customAmount} onChange={e => setCustomAmount(e.target.value)}
            style={{ width: 140, fontSize: 13 }} />
          <button className="act" onClick={() => { const amt = parseInt(customAmount, 10); if (!isNaN(amt)) placeBid(customBidder, amt) }}>
            Place bid
          </button>
        </div>
      )}

      {/* Bid history */}
      {bids.length > 0 && (
        <div style={{ background: '#f8f8f5', borderRadius: 6, padding: 10, marginBottom: 12, maxHeight: 140, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7c8aa5', marginBottom: 6, textTransform: 'uppercase' }}>Bid history</div>
          {[...bids].reverse().map((b, i) => (
            <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, marginBottom: 3, display: 'flex', gap: 10 }}>
              <span style={{ color: BIDDER_TEXT[b.bidder], fontWeight: 700, minWidth: 40 }}>{b.bidder}</span>
              <span>₹{b.amount.toLocaleString()}</span>
              <span style={{ color: '#aaa' }}>{b.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reserve indicator (hidden, revealed on settle) */}
      {settled && (
        <div style={{ fontSize: 12, color: '#666', marginBottom: 10, fontStyle: 'italic' }}>
          Reserve price was ₹{RESERVE_PRICE.toLocaleString()} — {highestBid >= RESERVE_PRICE ? 'met ✅' : 'NOT met ❌'}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {!settled && <button className="act" onClick={settle}>Close &amp; settle auction</button>}
        <button className="act ghost" onClick={reset}>Reset</button>
      </div>
    </div>
  )
}

/* ============================================================
   Demo 2 — Snipe prevention
   ============================================================ */
const SNIPE_WINDOW_MIN = 5
const MAX_EXTENSIONS = 3

function SniperPreventionDemo() {
  // totalMinutes is the total auction duration shown; endOffset is how many extra minutes we added
  const [totalMinutes, setTotalMinutes] = useState(20) // starts at 20 min, 4 min remaining shown
  const [elapsed, setElapsed] = useState(16) // so remaining = 20 - 16 = 4 min
  const [extensions, setExtensions] = useState(0)
  const [status, setStatus] = useState('OPEN')
  const [log, setLog] = useState([])
  const [closed, setClosed] = useState(false)

  const remaining = totalMinutes - elapsed
  const pct = Math.min(100, (elapsed / totalMinutes) * 100)
  const isSnipeZone = remaining <= SNIPE_WINDOW_MIN && remaining > 0

  function placeBid() {
    if (closed) return
    if (remaining <= 0) {
      setLog(prev => [...prev, '⛔ Auction already closed — bid rejected.'])
      return
    }
    const logEntry = `⚡ Bid placed with ${remaining} min remaining...`
    if (isSnipeZone && extensions < MAX_EXTENSIONS) {
      // extend
      const newTotal = totalMinutes + SNIPE_WINDOW_MIN
      setTotalMinutes(newTotal)
      setStatus('CLOSING')
      setExtensions(e => e + 1)
      setLog(prev => [...prev,
        logEntry,
        `🔔 Anti-snipe triggered! Bid in final ${SNIPE_WINDOW_MIN}-minute window.`,
        `⏰ End time extended by ${SNIPE_WINDOW_MIN} minutes. Status → CLOSING. (Extension ${extensions + 1}/${MAX_EXTENSIONS})`
      ])
    } else if (isSnipeZone && extensions >= MAX_EXTENSIONS) {
      setLog(prev => [...prev, logEntry, '⚠ Max extensions reached. No further extensions allowed.'])
    } else {
      setLog(prev => [...prev, logEntry, '✅ Bid accepted (not in snipe window — no extension needed).'])
    }
  }

  function advanceTime(mins) {
    if (closed) return
    setElapsed(prev => {
      const next = Math.min(prev + mins, totalMinutes)
      if (next >= totalMinutes) {
        setClosed(true)
        setStatus('CLOSED')
        setLog(l => [...l, '🔒 Auction time expired — status → CLOSED.'])
      }
      return next
    })
  }

  function reset() {
    setTotalMinutes(20)
    setElapsed(16)
    setExtensions(0)
    setStatus('OPEN')
    setLog([])
    setClosed(false)
  }

  const barColor = closed ? '#9E9E9E' : status === 'CLOSING' ? '#FF9800' : isSnipeZone ? '#F44336' : '#4CAF50'
  const statusColor = { OPEN: '#2E7D32', CLOSING: '#E65100', CLOSED: '#616161' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · watch the anti-snipe extension trigger when a bid lands in the final 5 minutes</div>

      {/* Status badge */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ background: statusColor[status], color: '#fff', borderRadius: 20, padding: '4px 14px', fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 700 }}>
          {status}
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
          {closed ? 'Auction ended' : `${remaining} min remaining`}
          {extensions > 0 && <span style={{ color: '#E65100', marginLeft: 8 }}>(extended ×{extensions})</span>}
        </div>
      </div>

      {/* Timeline bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#7c8aa5', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' }}>Auction timeline</div>
        <div style={{ background: '#e0e0e0', borderRadius: 6, height: 26, position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.4s, background 0.4s', borderRadius: 6 }} />
          {/* Snipe zone marker at 75% of original (= last 5 of 20 min) */}
          <div style={{ position: 'absolute', left: '75%', top: 0, width: 2, height: '100%', background: '#F44336', opacity: 0.7 }} />
          <div style={{ position: 'absolute', left: '76%', top: 4, fontSize: 9, color: '#c00', fontWeight: 700, whiteSpace: 'nowrap' }}>⚠ SNIPE ZONE</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999', marginTop: 3 }}>
          <span>0 min</span>
          <span style={{ color: '#F44336' }}>last {SNIPE_WINDOW_MIN} min</span>
          <span>{totalMinutes} min (end{extensions > 0 ? ` +${extensions * SNIPE_WINDOW_MIN} extended` : ''})</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" disabled={closed} onClick={placeBid}
          style={{ background: isSnipeZone && !closed ? '#F44336' : undefined }}>
          {isSnipeZone && !closed ? '⚡ Bid now (snipe zone!)' : 'Place bid'}
        </button>
        <button className="act ghost" disabled={closed} onClick={() => advanceTime(2)}>+2 min (advance time)</button>
        <button className="act ghost" onClick={reset}>Reset</button>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div style={{ background: '#f8f8f5', borderRadius: 6, padding: 10, maxHeight: 160, overflowY: 'auto' }}>
          {log.map((l, i) => (
            <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, marginBottom: 3, color: l.startsWith('🔔') || l.startsWith('⏰') ? '#E65100' : l.startsWith('⛔') ? '#c00' : '#333' }}>{l}</div>
          ))}
        </div>
      )}

      <Note>
        <span style={{ fontSize: 12.5 }}>Start in the snipe zone (4 min left). Click <b>"Bid now (snipe zone!)"</b> — watch the end time jump by 5 minutes and status flip to CLOSING. Click "+2 min" to advance time back into the snipe zone, then bid again to extend again.</span>
      </Note>
    </div>
  )
}

/* ============================================================
   Demo 3 — Proxy bid race
   ============================================================ */
const PROXY_START = 5000
const PROXY_INC   = 500

const PROXY_STEPS = (() => {
  const aliceMax = 12000
  const bobMax   = 10000
  const steps = []
  let price = PROXY_START
  let highest = null
  let highestAmount = 0

  // Alice sets her proxy first (auto-bids to win)
  steps.push({ actor: 'System', desc: `Alice sets proxy max ₹${aliceMax.toLocaleString()}. Bob sets proxy max ₹${bobMax.toLocaleString()}.`, price, highest: null, alice: aliceMax, bob: bobMax })

  // system auto-bids Alice at starting price
  price = PROXY_START
  highest = 'Alice'
  highestAmount = price
  steps.push({ actor: 'Alice (auto)', desc: `System auto-bids Alice at starting price ₹${price.toLocaleString()}.`, price, highest, alice: aliceMax, bob: bobMax })

  // Bob proxy responds — increments until Bob hits his max
  while (true) {
    const bobBid = highestAmount + PROXY_INC
    if (bobBid > bobMax) break // Bob cannot outbid — Alice wins at one increment above Bob's max
    price = bobBid
    highest = 'Bob'
    highestAmount = price
    steps.push({ actor: 'Bob (auto)', desc: `Bob's proxy auto-bids ₹${price.toLocaleString()}.`, price, highest, alice: aliceMax, bob: bobMax })

    const aliceBid = highestAmount + PROXY_INC
    if (aliceBid > aliceMax) break
    price = aliceBid
    highest = 'Alice'
    highestAmount = price
    steps.push({ actor: 'Alice (auto)', desc: `Alice's proxy responds ₹${price.toLocaleString()}.`, price, highest, alice: aliceMax, bob: bobMax })
  }

  // Bob at max, Alice wins at one increment above Bob's max
  const finalPrice = bobMax + PROXY_INC
  steps.push({ actor: 'System', desc: `Bob hit his max ₹${bobMax.toLocaleString()}. Cannot outbid. Alice wins at ₹${finalPrice.toLocaleString()} — just one increment above Bob's ceiling.`, price: finalPrice, highest: 'Alice', alice: aliceMax, bob: bobMax, winner: true })

  return steps
})()

function ProxyBidDemo() {
  const [step, setStep] = useState(0)
  const s = PROXY_STEPS[step]

  const actorColor = a => a.startsWith('Alice') ? '#1565C0' : a.startsWith('Bob') ? '#2E7D32' : '#6A1B9A'

  return (
    <div className="panel">
      <div className="ptitle">Live demo · step through the proxy bid war — Alice (max ₹12,000) vs Bob (max ₹10,000)</div>

      {/* Step pills */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        {PROXY_STEPS.map((ps, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            background: i === step ? 'var(--ink)' : i < step ? '#c8d8e8' : '#eee',
            color: i === step ? '#fff' : '#333'
          }}>{i}</button>
        ))}
      </div>

      {/* Current state */}
      <div style={{ background: s.winner ? '#E8F5E9' : '#f0ede6', borderRadius: 8, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: actorColor(s.actor), textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{s.actor}</div>
            <div style={{ fontSize: 13.5 }}>{s.desc}</div>
          </div>
          <div style={{ textAlign: 'right', minWidth: 100 }}>
            <div style={{ fontSize: 11, color: '#7c8aa5' }}>Current price</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 20, fontWeight: 700, color: s.winner ? '#2E7D32' : 'var(--blue)' }}>₹{s.price.toLocaleString()}</div>
            {s.highest && <div style={{ fontSize: 11, color: actorColor(s.highest) }}>Highest: <b>{s.highest}</b></div>}
          </div>
        </div>
      </div>

      {/* Proxy caps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[['Alice', s.alice, '#E3F2FD', '#1565C0'], ['Bob', s.bob, '#E8F5E9', '#2E7D32']].map(([name, maxAmt, bg, tc]) => (
          <div key={name} style={{ background: bg, borderRadius: 6, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: tc, marginBottom: 4 }}>{name}'s proxy</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13 }}>Max: ₹{maxAmt.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
              {s.highest === name ? '▲ Currently winning' : s.winner && name !== s.highest ? '✗ Outbid at max' : '–'}
            </div>
          </div>
        ))}
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="act ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>← Prev</button>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5' }}>Step {step} / {PROXY_STEPS.length - 1}</span>
        <button className="act" disabled={step === PROXY_STEPS.length - 1} onClick={() => setStep(s => s + 1)}>Next →</button>
      </div>
    </div>
  )
}

/* ============================================================
   Quiz
   ============================================================ */
const QUESTIONS = [
  {
    q: 'An auction has 3 minutes left. A new bid arrives. What should the system do?',
    o: [
      'Accept the bid and keep the original end time',
      'Accept the bid and extend the end time by 5 minutes (anti-snipe)',
      'Reject the bid — no bids allowed in the last 5 minutes',
      'Accept the bid and close the auction immediately',
    ],
    a: 1,
    e: 'The snipe prevention rule: a bid that arrives inside the SNIPE_WINDOW extends the end time by SNIPE_WINDOW (e.g., 5 minutes). The auction status moves to CLOSING. This prevents last-second sniping by giving everyone a fair chance to respond.',
    w: {
      0: 'Keeping the original end time rewards snipers — bidders who wait until the last second win without giving others a chance to respond.',
      2: 'Blocking bids in the last 5 minutes is too restrictive and not the standard approach. The solution is to extend time, not block bids.',
      3: 'Closing immediately on a bid would incentivize bidding as close to the end as possible — the opposite of the goal.',
    },
    r: { id: 's7', label: 'Section 7 — Snipe prevention' },
  },
  {
    q: 'The highest bid at auction close is ₹7,500. The reserve price is ₹8,000. What is the result?',
    o: [
      'The highest bidder wins but must pay ₹8,000',
      'The seller must accept any bid once the auction starts',
      'The highest bidder wins at ₹7,500',
      'Reserve not met — no winner, item not sold',
    ],
    a: 3,
    e: 'The reserve price is the seller\'s minimum acceptable price. If no bid reaches it, the auction settles as RESERVE_NOT_MET — no winner is declared and the item is not sold.',
    w: {
      0: 'The system cannot force a bidder to pay ₹8,000 when they bid ₹7,500. That would be a breach of contract.',
      1: 'Sellers set reserve prices specifically because they are NOT obligated to sell at any price — the reserve is a binding minimum.',
      2: 'The highest bidder does NOT win if the reserve is not met. The reserve exists precisely to protect the seller from selling below their minimum.',
    },
    r: { id: 's6', label: 'Section 6 — Bid validation rules' },
  },
  {
    q: 'Two bidders submit bids simultaneously. Which concurrency fix is most appropriate for placeBid()?',
    o: [
      'Synchronize on the Auction object inside placeBid()',
      'Use volatile on the currentHighestBid field',
      'No fix needed — modern JVMs handle concurrent writes safely',
      'Make currentHighestBid an AtomicInteger',
    ],
    a: 0,
    e: 'Synchronize on the Auction object: placeBid() must read the current highest bid, validate the new amount, and update atomically. Using synchronized gives you atomicity + visibility for the entire check-then-act block. volatile alone only ensures visibility, not atomicity.',
    w: {
      1: 'volatile ensures visibility (changes are seen immediately) but NOT atomicity. Two threads can still both read the old value, validate, and both write — causing a lost-update race.',
      2: 'Modern JVMs do NOT make concurrent writes safe by default. The Java Memory Model requires explicit synchronization for shared mutable state.',
      3: 'AtomicInteger handles a single numeric CAS, but bid placement involves multiple steps (read highest, validate, add to list, check snipe). A single atomic integer is not enough.',
    },
    r: { id: 's6', label: 'Section 6 — Bid validation rules' },
  },
  {
    q: 'Alice has a proxy bid with maxAmount ₹10,000. Bob bids ₹9,000 manually. What happens?',
    o: [
      'Alice and Bob are tied at ₹9,000',
      'Alice wins at ₹10,000 immediately',
      'Alice\'s proxy auto-bids ₹9,500 (one increment above Bob)',
      'Bob wins because he placed the bid manually',
    ],
    a: 2,
    e: 'Proxy bidding only bids the minimum needed to stay highest. Bob bids ₹9,000, so the system auto-bids Alice at ₹9,000 + ₹500 increment = ₹9,500. Alice does NOT jump straight to her max — that would overpay unnecessarily.',
    w: {
      0: 'A tie cannot exist when a proxy bid is active — the proxy immediately responds with the minimum required to beat the incoming bid.',
      1: 'Jumping to the max (₹10,000) wastes money. The proxy system bids the minimum needed: just one increment above the competitor.',
      3: 'Manual vs proxy makes no difference — the highest bid at the moment of settlement wins. Proxy bidding is automatic but fully valid.',
    },
    r: { id: 's9', label: 'Section 9 — Proxy bidding' },
  },
  {
    q: 'Which design pattern is the Bid record an example of?',
    o: ['Command', 'State', 'Observer', 'Prototype'],
    a: 0,
    e: 'A Bid is a Command (Day 33): it is an append-only record of an action (bidder X bid amount Y at time T). Bids are never deleted — the full history is kept for dispute resolution. Applying "undo" on a bid does not delete it; it records a retraction event.',
    w: {
      1: 'State models the auction\'s lifecycle (OPEN, CLOSING, CLOSED). A Bid is not a state — it is a recorded action.',
      2: 'Observer is used to notify bidders when the price changes. A Bid is not an observer; it is the thing that triggers notifications.',
      3: 'Prototype is about cloning objects for cheaper creation. Bids are not cloned — each is a unique immutable record.',
    },
    r: { id: 's3', label: 'Section 3 — Core entities' },
  },
  {
    q: 'What is the correct order of states in the auction lifecycle when snipe prevention is triggered?',
    o: [
      'OPEN → CLOSING → OPEN → CLOSED',
      'DRAFT → CLOSING → OPEN → SETTLED',
      'DRAFT → OPEN → CLOSED → SETTLED',
      'DRAFT → OPEN → CLOSING → CLOSED → SETTLED',
    ],
    a: 3,
    e: 'The full path when a bid arrives in the final window: DRAFT (not yet started) → OPEN (accepting bids) → CLOSING (anti-snipe extension active) → CLOSED (time expired) → SETTLED (winner determined). CLOSING is the anti-snipe state where the auction has been extended.',
    w: {
      0: 'CLOSING never transitions back to OPEN. The state machine is one-directional — each state only knows its valid successors going forward.',
      1: 'DRAFT cannot jump to CLOSING — the auction must first be opened (OPEN) before any bids can arrive to trigger the extension.',
      2: 'This path skips CLOSING — it only applies when the auction ends with no bids in the snipe window. Once any bid triggers snipe prevention, CLOSING is mandatory.',
    },
    r: { id: 's4', label: 'Section 4 — The auction state machine' },
  },
  {
    q: 'Why should bid amounts be stored as Money (BigDecimal) instead of double?',
    o: [
      'double cannot represent numbers greater than ₹9,999',
      'BigDecimal is faster than double for addition',
      'Floating-point rounding errors in double cause billing discrepancies at scale',
      'double requires more memory than BigDecimal',
    ],
    a: 2,
    e: 'IEEE 754 double cannot represent many decimal fractions exactly. Small rounding errors (e.g., 0.1 + 0.2 = 0.30000000000000004) are harmless individually but compound across millions of bid calculations into real billing bugs. Use BigDecimal or integer paise internally (Day 20).',
    w: {
      0: 'double can represent values up to ~1.8 × 10^308 — far beyond any bid amount. Its problem is decimal PRECISION, not range.',
      1: 'BigDecimal is actually SLOWER than double for CPU arithmetic. The reason to use it is correctness, not performance.',
      3: 'double uses 8 bytes; BigDecimal uses far more memory (object overhead + array). Memory is not the reason to avoid double here.',
    },
    r: { id: 's3', label: 'Section 3 — Core entities' },
  },
  {
    q: 'In a Vickrey (second-price) auction, you win by bidding ₹12,000 and the second-highest bid was ₹9,000. What do you pay?',
    o: [
      '₹12,000 — your bid amount',
      '₹9,000 — the second-highest bid amount',
      '₹9,500 — one increment above the second-highest bid',
      '₹10,500 — the average of the two bids',
    ],
    a: 1,
    e: 'In a Vickrey / second-price auction, the winner pays the SECOND-highest bid — not their own. This encourages truthful bidding: you bid your true maximum because overpaying is impossible. If you win, you pay the competitive market price, not your ceiling.',
    w: {
      0: 'Paying your own bid is the first-price (standard) auction rule. In a Vickrey auction, the winner always pays the second-highest price.',
      2: '₹9,500 would be correct in proxy bidding within a first-price system (one increment above the runner-up). In a pure Vickrey auction, the exact second-highest bid is the price — no increment.',
      3: 'Averaging bids has no basis in either first-price or second-price auction theory. It is not a recognized auction mechanism.',
    },
    r: { id: 'interview', label: 'Interview corner — Vickrey auction' },
  },
]

/* ============================================================
   Page
   ============================================================ */
export default function Day72() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 15 · Day 72</div>
        <h1>Online Auction:<br />Bidding, Reserve Price &amp; Snipe Prevention</h1>
        <p>
          An auction looks simple — highest bid wins. But three complications change everything:
          a hidden reserve price, last-second sniping, and two simultaneous bids racing to
          become the winner. Click every demo to feel how the design handles each one.
        </p>
        <div className="chips">
          {['Auction State Machine', 'Snipe Prevention', 'Proxy Bidding', 'Reserve Price', 'Settlement'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What makes auctions hard — three complications</h2>
        <p>
          A basic auction is easy: collect bids, pick the highest, done. The complexity
          comes from three real-world requirements that every serious auction system must handle.
        </p>
        <Code html={`<span class="cm">── The three complications ──────────────────────────────────────</span>

  1. RESERVE PRICE (hidden minimum)
     The seller says "I will not sell below ₹8,000" — but does not tell bidders.
     Even if the highest bid is ₹7,900, the item is NOT sold.
     Why hidden? Because a visible reserve tells competitors your floor.
     Why it matters to design: settlement logic must check reserve, not just highest bid.

  2. SNIPING (last-second bid)
     A bidder waits until 0.3 seconds before close, then outbids everyone.
     Others have no time to respond. The winner is whoever has the fastest internet,
     not whoever values the item most.
     Why it matters to design: the auction state machine needs a CLOSING state
     that auto-extends the end time when a late bid arrives.

  3. SIMULTANEOUS BIDS (concurrency race)
     Two bidders click "Place bid" at exactly the same moment.
     Without a lock, both reads see the old highest bid, both validate, both write
     — corrupting the bid state (Day 62: the check-then-act race).
     Why it matters to design: placeBid() must be synchronized on the auction object.`} />
        <Note>
          These three complications drive almost all the interesting design decisions on this day.
          State machine = sniping. Settlement logic = reserve price.
          Synchronized block = simultaneous bids. Keep them separate in your head.
        </Note>
      </section>

      {/* S2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Clarifying questions (ask these in minute one)</h2>
        <p>
          Every answer shapes a different part of the design. Do not start drawing
          until you have asked at least five of these.
        </p>
        <table className="matrix" style={{ width: '100%', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Question</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Why it matters</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Simple-first answer</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Do we support proxy (auto) bids?', 'Adds a ProxyBid entity and an auto-bidding service that re-bids on behalf of users', 'Yes — bidder sets a max; system bids the minimum needed'],
              ['Is the reserve price visible to bidders?', 'Visible reserve changes bidding strategy entirely; hidden reserve is more common', 'Hidden — only revealed after settlement'],
              ['Can the seller cancel an auction after bidding starts?', 'Adds a CANCELLED state from OPEN; triggers refund logic for all bidders', 'No cancellation once OPEN (add as extension)'],
              ['How is tie-breaking handled?', 'Two bids at the exact same amount — which wins? Usually the earlier bid', 'Earlier bid wins (timestamp comparison)'],
              ['Do we support second-price (Vickrey) auctions?', 'Winner pays second-highest price — needs a SettlementStrategy interface', 'No — standard first-price auction for now'],
              ['Can a bidder retract a bid?', 'Most platforms allow retraction only under specific conditions; affects Command pattern (Bid as append-only log)', 'No — bids are final once placed'],
              ['What is the snipe extension limit?', 'Unlimited extensions could keep an auction open forever; cap is needed', 'Max 3 extensions (demo); configurable in production'],
            ].map(([q, why, ans]) => (
              <tr key={q}>
                <td style={{ padding: '6px 8px' }}>{q}</td>
                <td style={{ padding: '6px 8px', color: '#666' }}>{why}</td>
                <td style={{ padding: '6px 8px', color: 'var(--blue)' }}>{ans}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* S3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Core entities</h2>
        <Code html={`<span class="cm">── Entity model ────────────────────────────────────────────────</span>

  ┌──────────────┐         ┌────────────────────────────────┐
  │    Item      │    1    │           Auction              │
  │──────────────│─────────│────────────────────────────────│
  │ id           │         │ id                             │
  │ title        │         │ item: Item                     │
  │ description  │         │ startTime: Instant             │
  │ startingPrice│         │ endTime: Instant               │
  │ reservePrice │         │ minBidIncrement: Money         │
  │   (hidden)   │         │ status: AuctionStatus          │
  │ sellerId     │         │ bids: List&lt;Bid&gt;                 │
  └──────────────┘         └────────────┬───────────────────┘
                                        │ contains 0..*
                           ┌────────────▼───────────────────┐
  ┌──────────────┐    *    │             Bid                │
  │   Bidder     │─────────│────────────────────────────────│
  │──────────────│         │ id                             │
  │ id           │         │ bidderId                       │
  │ name         │         │ auctionId                      │
  │ email        │         │ amount: Money                  │
  │ paymentMethod│         │ placedAt: Instant              │
  │ bidHistory   │         └────────────────────────────────┘
  └──────────────┘
  ┌──────────────────────┐  ┌──────────────────────────────┐
  │      ProxyBid        │  │        AuctionResult          │
  │──────────────────────│  │──────────────────────────────│
  │ bidderId             │  │ auction: Auction              │
  │ maxAmount: Money     │  │ winner: Bidder (null if none) │
  │ currentBid: Money    │  │ finalPrice: Money             │
  └──────────────────────┘  │ outcome: SOLD / RESERVE_NOT  │
                            │ settledAt: Instant            │
                            └──────────────────────────────┘`} />
        <Code html={`<span class="cm">// Core Java classes</span>

<span class="kw">record</span> Money(<span class="kw">long</span> paise) <span class="kw">implements</span> Comparable&lt;Money&gt; {   <span class="cm">// integer internally — no double!</span>
    <span class="kw">static</span> Money ofRupees(<span class="kw">long</span> rupees) { <span class="kw">return new</span> Money(rupees * <span class="num">100</span>); }
    Money add(Money other)               { <span class="kw">return new</span> Money(paise + other.paise); }
    Money subtract(Money other)          { <span class="kw">return new</span> Money(paise - other.paise); }
    <span class="kw">public int</span> compareTo(Money other)    { <span class="kw">return</span> Long.compare(paise, other.paise); }
    <span class="kw">public</span> String toString()             { <span class="kw">return</span> <span class="str">"₹"</span> + paise / <span class="num">100</span>; }
}

<span class="kw">record</span> Bid(String id, String bidderId, Money amount, Instant placedAt) {}
                                                   <span class="cm">// immutable — Command (Day 33); never deleted</span>

<span class="kw">class</span> ProxyBid {
    <span class="kw">private final</span> String bidderId;
    <span class="kw">private final</span> Money maxAmount;   <span class="cm">// bidder's secret ceiling</span>
    <span class="kw">private</span> Money currentBid;        <span class="cm">// last amount the system auto-bid on their behalf</span>
}

<span class="kw">record</span> AuctionResult(
    Auction auction,
    String winnerId,           <span class="cm">// null if reserve not met</span>
    Money finalPrice,          <span class="cm">// null if reserve not met</span>
    AuctionOutcome outcome,    <span class="cm">// SOLD or RESERVE_NOT_MET</span>
    Instant settledAt
) {}`} />
        <Note>
          <b>Bids are append-only (Command pattern, Day 33).</b> Never delete a bid record, even if a
          bidder retracts. Append a retraction event instead. The full audit log is essential for
          dispute resolution — in high-value auctions it may be legally required.
        </Note>
      </section>

      {/* S4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The auction state machine</h2>
        <p>
          The state machine is the heart of the design. Every transition is guarded —
          you cannot skip states, and terminal states cannot transition out.
          The CLOSING state exists only because of snipe prevention.
        </p>
        <Code html={`<span class="cm">── Auction state machine ───────────────────────────────────────</span>

        seller creates auction
               │
         ┌─────▼──────┐
         │   DRAFT    │   ← not yet visible to bidders
         └─────╥──────┘
               ║ startTime reached (scheduled trigger)
         ┌─────▼──────┐
         │    OPEN    │   ← accepting bids normally
         └──┬──╥──────┘
            │  ║
            │  ║ a bid arrives inside SNIPE_WINDOW (last 5 min)
            │  ║   → extend endTime by 5 min
            │  ╚═══════════════► ┌─────────────┐
            │                    │   CLOSING   │  ← anti-snipe extension active
            │  endTime reached   └──────╥──────┘
            │  (no late bids)           ║ extended endTime reached
            └──────────┐               │
                       ▼               ▼
                 ┌───────────────────────┐
                 │        CLOSED         │  ← no more bids accepted
                 └───────────╥───────────┘
                             ║ system processes result
                 ┌───────────╨───────────┐
                 │        SETTLED        │  ← terminal; result locked
                 │   (SOLD or           │
                 │    RESERVE_NOT_MET)   │
                 └───────────────────────┘`} />
        <Code html={`<span class="cm">// Enum with guarded transitions — State pattern applied to an enum</span>

<span class="kw">enum</span> AuctionStatus {
    DRAFT, OPEN, CLOSING, CLOSED, SETTLED;

    <span class="cm">// Declare only the valid forward transitions — nothing else is allowed</span>
    <span class="kw">boolean</span> canTransitionTo(AuctionStatus next) {
        <span class="kw">return switch</span> (<span class="kw">this</span>) {
            <span class="kw">case</span> DRAFT   -> next == OPEN;
            <span class="kw">case</span> OPEN    -> next == CLOSING || next == CLOSED;
            <span class="kw">case</span> CLOSING -> next == CLOSED;
            <span class="kw">case</span> CLOSED  -> next == SETTLED;
            <span class="kw">default</span>      -> <span class="kw">false</span>;   <span class="cm">// SETTLED is terminal — no outgoing transitions</span>
        };
    }

    <span class="cm">// Is the auction still accepting bids?</span>
    <span class="kw">boolean</span> isAcceptingBids() {
        <span class="kw">return this</span> == OPEN || <span class="kw">this</span> == CLOSING;
    }
}

<span class="cm">// In Auction — one method that guards ALL transitions</span>
<span class="kw">public synchronized void</span> transitionTo(AuctionStatus next) {
    <span class="kw">if</span> (!status.canTransitionTo(next))          <span class="cm">// guard always runs</span>
        <span class="kw">throw new</span> IllegalStateException(status + <span class="str">" → "</span> + next + <span class="str">" not allowed"</span>);
    <span class="kw">this</span>.status = next;
    notifyObservers(next);                       <span class="cm">// Observer (Day 32) — push to all bidders</span>
}`} />
        <Warn>
          CLOSING is not the same as CLOSED. CLOSING means "anti-snipe window is active — the
          auction is still accepting bids but will close at the extended time." CLOSED means
          "the timer has expired and no more bids are possible." Mix these up and your auction
          either never closes or refuses valid bids.
        </Warn>
      </section>

      {/* S5 — Interactive */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🎸 Play: live auction bidding</h2>
        <p>
          Click the suggested bids in order to simulate a real auction. Watch bid
          validation reject a too-low bid. After placing some bids, click
          "Close &amp; settle" — the reserve price (hidden during bidding) is revealed.
          Does the highest bidder win?
        </p>
        <LiveBiddingDemo />
        <Good>
          Key insight: the reserve price is hidden during the auction but checked at settlement.
          Try closing the auction before any bid reaches ₹8,000 — the item goes unsold even
          though bids were placed.
        </Good>
      </section>

      {/* S6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Bid validation rules</h2>
        <p>
          Every bid must pass four checks before it is accepted. If any check fails,
          throw a specific exception — not a generic error. The client can then show
          a precise message to the bidder.
        </p>
        <Code html={`<span class="cm">// Complete bid placement with all validation layers</span>

<span class="kw">public void</span> placeBid(String bidderId, String auctionId, Money amount) {
    Auction auction = repo.findById(auctionId)
        .orElseThrow(() -> <span class="kw">new</span> NotFoundException(auctionId));

    <span class="cm">// CHECK 1 — auction must be in a state that accepts bids</span>
    <span class="kw">if</span> (!auction.status().isAcceptingBids())
        <span class="kw">throw new</span> AuctionClosedException(<span class="str">"Auction is not accepting bids: "</span> + auction.status());

    <span class="cm">// CHECK 2 — bid must meet the minimum increment</span>
    Money required = auction.currentHighestBid().add(auction.minBidIncrement());
    <span class="kw">if</span> (amount.compareTo(required) < <span class="num">0</span>)
        <span class="kw">throw new</span> BidTooLowException(<span class="str">"Minimum bid is "</span> + required + <span class="str">", you sent "</span> + amount);

    <span class="cm">// CHECK 3 — bidder cannot outbid themselves (already the highest)</span>
    <span class="kw">if</span> (bidderId.equals(auction.highestBidder()))
        <span class="kw">throw new</span> SelfOutbidException(<span class="str">"You are already the highest bidder"</span>);

    <span class="cm">// CHECK 4 — bidder cannot bid on their own item (shill prevention)</span>
    <span class="kw">if</span> (bidderId.equals(auction.item().sellerId()))
        <span class="kw">throw new</span> ShillBidException(<span class="str">"Seller cannot bid on their own auction"</span>);

    <span class="cm">// ALL CHECKS PASSED — enter the synchronized block to prevent race conditions</span>
    <span class="kw">synchronized</span> (auction) {
        <span class="cm">// Re-check inside lock — another thread may have changed state between CHECK 1 and here</span>
        <span class="kw">if</span> (!auction.status().isAcceptingBids())
            <span class="kw">throw new</span> AuctionClosedException(<span class="str">"Auction closed while processing"</span>);
        <span class="kw">if</span> (amount.compareTo(auction.currentHighestBid().add(auction.minBidIncrement())) < <span class="num">0</span>)
            <span class="kw">throw new</span> BidTooLowException(<span class="str">"Another bid arrived first — refresh and try again"</span>);

        String previousHighest = auction.highestBidder();         <span class="cm">// save before updating</span>
        Bid bid = <span class="kw">new</span> Bid(UUID.randomUUID().toString(), bidderId, amount, Instant.now());
        auction.addBid(bid);                                       <span class="cm">// append to history</span>
        checkAndExtendIfSniping(auction);                          <span class="cm">// anti-snipe check</span>
        notifyOutbid(previousHighest, auction);                    <span class="cm">// Observer — tell loser</span>
    }
}`} />
        <Note>
          <b>Double-checked locking pattern</b> — the pre-checks outside the lock are a fast path
          to reject obviously invalid bids without acquiring the lock. The re-checks inside the lock
          catch races. Both are needed: the outer checks save performance, the inner checks ensure
          correctness. This is the same pattern as the check-then-act race from Day 62.
        </Note>
      </section>

      {/* S7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Snipe prevention — the CLOSING state</h2>
        <p>
          Sniping is when a bidder waits until the last few seconds to bid, giving
          everyone else no time to respond. The fix is simple: if a bid arrives in
          the final window, add more time. Now everyone can respond.
        </p>
        <Code html={`<span class="cm">── Snipe prevention timeline ────────────────────────────────────</span>

  BEFORE (no extension):
  |─────────────────────────[OPEN]───────────────[last 5min]──[end]|
                                                       ↑
                                             sniper bids here
                                             nobody can respond!

  AFTER (with extension):
  |──────────────────────[OPEN]─────────────[CLOSING]──[new end +5]|
                                                 ↑          ↑
                                       bid here      extended window
                                       triggers       all bidders
                                       extension      can respond`} />
        <Code html={`<span class="cm">// Called inside synchronized(auction) block after every successful bid</span>

<span class="kw">private static final</span> Duration SNIPE_WINDOW = Duration.ofMinutes(<span class="num">5</span>);
<span class="kw">private static final int</span>     MAX_EXTENSIONS = <span class="num">3</span>;       <span class="cm">// cap to prevent infinite auction</span>

<span class="kw">private void</span> checkAndExtendIfSniping(Auction auction) {
    Duration remaining = Duration.between(Instant.now(), auction.endTime());

    <span class="cm">// Is this bid inside the final snipe window?</span>
    <span class="kw">if</span> (remaining.compareTo(SNIPE_WINDOW) >= <span class="num">0</span>) <span class="kw">return</span>;  <span class="cm">// not in window — nothing to do</span>

    <span class="cm">// Has the auction already been extended the maximum number of times?</span>
    <span class="kw">if</span> (auction.extensionCount() >= MAX_EXTENSIONS) <span class="kw">return</span>;

    <span class="cm">// Extend: push the end time forward by the full snipe window</span>
    Instant newEnd = Instant.now().plus(SNIPE_WINDOW);
    auction.setEndTime(newEnd);
    auction.incrementExtensionCount();

    <span class="cm">// Transition to CLOSING if not already there (OPEN → CLOSING)</span>
    <span class="kw">if</span> (auction.status() == AuctionStatus.OPEN) {
        auction.transitionTo(AuctionStatus.CLOSING);
    }

    <span class="cm">// Notify every bidder: "Auction extended — bid in final window"</span>
    notifyAllBidders(auction, <span class="str">"Auction extended — new bid in final window! New end: "</span> + newEnd);
}

<span class="cm">// Settlement: called by a scheduled job when endTime is reached and status = CLOSED</span>
AuctionResult settle(Auction auction) {
    <span class="cm">// If nobody bid, or highest bid is below the hidden reserve price → no winner</span>
    <span class="kw">if</span> (auction.bids().isEmpty() ||
        auction.highestBid().compareTo(auction.item().reservePrice()) < <span class="num">0</span>) {
        <span class="kw">return</span> AuctionResult.reserveNotMet(auction);
    }
    <span class="cm">// Otherwise: the highest bidder wins at their bid price (first-price auction)</span>
    <span class="kw">return</span> AuctionResult.sold(auction, auction.highestBidder(), auction.highestBid());
}`} />
        <Reveal summary="Why cap extensions at 3 (or any finite number)?">
          <p>
            Without a cap, a determined bidder could extend an auction indefinitely by bidding once
            every 4 minutes and 59 seconds. A maximum of 3 extensions adds at most 15 minutes — enough
            for genuine bidders to respond, but not enough to keep an auction open forever. Make this
            configurable per auction category (fine art may allow more; flash auctions may allow zero).
          </p>
        </Reveal>
      </section>

      {/* S8 — Interactive */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>⏰ Play: snipe prevention in action</h2>
        <p>
          The auction starts with 4 minutes remaining — already inside the snipe zone
          (last 5 minutes). Click the red "Bid now" button and watch the end time jump
          forward 5 minutes and the status change to CLOSING. Use "+2 min" to advance
          time back into the snipe zone and trigger another extension.
        </p>
        <SniperPreventionDemo />
        <Good>
          Every extension resets the countdown. A bidder who genuinely wants the item can
          always respond. The auction closes only when the extended window expires with no
          new bids — a true market-clearing price.
        </Good>
      </section>

      {/* S9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Proxy bidding — the auto-bidder</h2>
        <p>
          A proxy bid lets you set your maximum and walk away. The system bids on your
          behalf — but only the minimum needed to stay highest. You never pay more than
          the competition requires.
        </p>
        <Code html={`<span class="cm">// Proxy bidding logic — called whenever the auction gets a new bid</span>

<span class="kw">class</span> ProxyBiddingService {

    <span class="cm">// Called after every new bid — check if any proxy bids need to auto-respond</span>
    <span class="kw">public void</span> respondToNewBid(Auction auction, Bid incomingBid) {
        <span class="cm">// Find a proxy bid from a DIFFERENT bidder that can still outbid</span>
        auction.proxyBids().stream()
            .filter(p -> !p.bidderId().equals(incomingBid.bidderId()))  <span class="cm">// not the same bidder</span>
            .filter(p -> canOutbid(p, auction))                          <span class="cm">// still within their max</span>
            .max(Comparator.comparing(p -> p.maxAmount()))              <span class="cm">// highest max wins the proxy war</span>
            .ifPresent(p -> autoPlaceBid(p, auction));                  <span class="cm">// bid on their behalf</span>
    }

    <span class="kw">private boolean</span> canOutbid(ProxyBid proxy, Auction auction) {
        Money required = auction.currentHighestBid().add(auction.minBidIncrement());
        <span class="kw">return</span> proxy.maxAmount().compareTo(required) >= <span class="num">0</span>;  <span class="cm">// proxy can still cover minimum</span>
    }

    <span class="kw">private void</span> autoPlaceBid(ProxyBid proxy, Auction auction) {
        <span class="cm">// Bid only the minimum required — not the full max (that would overpay)</span>
        Money minRequired = auction.currentHighestBid().add(auction.minBidIncrement());
        Money bidAmount   = minRequired;   <span class="cm">// e.g. current is ₹9,000 → auto-bid ₹9,500</span>

        <span class="cm">// Safety cap: never exceed the proxy's declared maximum</span>
        <span class="kw">if</span> (bidAmount.compareTo(proxy.maxAmount()) > <span class="num">0</span>) {
            bidAmount = proxy.maxAmount();   <span class="cm">// bid exactly at their ceiling</span>
        }

        Bid autoBid = <span class="kw">new</span> Bid(UUID.randomUUID().toString(), proxy.bidderId(), bidAmount, Instant.now());
        auction.addBid(autoBid);
        proxy.setCurrentBid(bidAmount);
        <span class="cm">// Recurse: the new auto-bid might trigger another proxy to respond</span>
        respondToNewBid(auction, autoBid);
    }
}`} />
        <Note>
          When two proxy bids compete, the one with the higher maximum always wins — at
          one increment above the loser's maximum. Example: Alice max ₹12,000, Bob max ₹10,000.
          The proxy war ends with Alice winning at ₹10,500 (₹10,000 + ₹500 increment). Bob
          is outbid at his own ceiling; Alice pays the minimum needed to beat him.
        </Note>
        <Reveal summary="What if two proxy bids have the same maximum?">
          <p>
            Tie-breaking: the proxy bid placed EARLIER wins. The later proxy bidder is immediately
            informed their maximum matches an existing proxy — they must bid higher to win. This is
            the fairest rule: first bidder to commit at that price gets the advantage.
          </p>
        </Reveal>
      </section>

      {/* S10 — Interactive */}
      <section id="s10">
        <div className="sec-label">Section 10 · Interactive</div>
        <h2>🤖 Play: the proxy bid war</h2>
        <p>
          Alice sets a proxy max of ₹12,000. Bob sets a proxy max of ₹10,000.
          Step through how the auto-bidder resolves the war, one increment at a time.
          Notice that Alice never bids her full maximum — she wins for only ₹500 more
          than Bob's ceiling.
        </p>
        <ProxyBidDemo />
        <Good>
          Proxy bidding is truthful — you bid your true maximum without risk of overpaying.
          The system does the negotiation for you. This is why eBay's proxy system (which
          pioneered this) became so popular: you bid once and the market decides the price.
        </Good>
      </section>

      {/* S11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>Common traps (and how to avoid them)</h2>

        <Warn>
          <b>Trap 1 — Using double for bid amounts.</b> <C>0.1 + 0.2 = 0.30000000000000004</C> in Java.
          In a high-value auction, rounding errors compound into real billing bugs. Always use
          <C>BigDecimal</C> or a Money value object with integer paise internally (Day 20).
        </Warn>

        <Warn>
          <b>Trap 2 — Not locking during bid placement.</b> Without <C>synchronized (auction)</C>,
          two simultaneous bids both read the old highest bid, both validate, and both write —
          the second write silently overwrites the first. This is the check-then-act race
          from Day 62. The lock must cover the read + validate + write as one atomic block.
        </Warn>

        <Warn>
          <b>Trap 3 — Deleting bid history.</b> Bids are Commands (Day 33) — append-only.
          Never delete a bid record. If a bidder "retracts," append a retraction event.
          The full audit log is required for dispute resolution and may be legally mandated.
        </Warn>

        <Warn>
          <b>Trap 4 — Exposing the reserve price before settlement.</b> If your API returns
          the reserve price in the auction payload, bidders can see the seller's floor and
          place a bid at exactly reserve + ₹1 with no competition. Hide it in the entity
          and reveal only in the <C>AuctionResult</C> after SETTLED.
        </Warn>

        <Warn>
          <b>Trap 5 — Forgetting the CLOSING state.</b> If your state machine goes
          OPEN → CLOSED directly (no CLOSING), you cannot distinguish "time expired normally"
          from "time expired after anti-snipe extension." You also cannot show bidders
          a meaningful status during the extension window. CLOSING is a load-bearing state.
        </Warn>

        <Warn>
          <b>Trap 6 — Settling before reaching CLOSED.</b> A timing bug might call
          <C>settle()</C> while the auction is still OPEN or CLOSING. Always guard settlement:
          <C>if (auction.status() != AuctionStatus.CLOSED) throw new IllegalStateException(...).</C>
          Settlement is terminal — once done it cannot be undone.
        </Warn>

        <Reveal summary="How do all the Month 1–4 patterns appear in this design?">
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
                ['State', '34', 'AuctionStatus lifecycle with guarded canTransitionTo()'],
                ['Observer', '32', 'Notify all bidders on price change, outbid alert, auction close'],
                ['Strategy', '31', 'SettlementStrategy (first-price vs Vickrey second-price)'],
                ['Command', '33', 'Bid is an immutable append-only command record; full history'],
                ['Value Object', '20', 'Money with integer paise; Bid with immutable fields'],
                ['Synchronized', '62', 'placeBid() synchronized on auction — prevent two-bid race'],
                ['Template Method', '35', 'Auction.transitionTo() calls notifyObservers() — hook pattern'],
                ['Adapter', '26', 'PaymentGateway port — Stripe/Razorpay behind one interface'],
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

      {/* S12 */}
      <section id="s12">
        <div className="sec-label">Section 12</div>
        <h2>Cheat sheet</h2>
        <ul>
          <li><b>Three complications</b> — reserve price (hidden minimum), sniping (last-second bid), simultaneous bids (concurrency race). Each drives a distinct design decision.</li>
          <li><b>State machine</b> — DRAFT → OPEN → CLOSING → CLOSED → SETTLED. CLOSING = anti-snipe extension active. SETTLED is terminal.</li>
          <li><b>Reserve price is hidden</b> — not in the API response during OPEN/CLOSING. Revealed only in AuctionResult after SETTLED.</li>
          <li><b>Snipe prevention</b> — bid inside SNIPE_WINDOW (e.g., 5 min) extends endTime by SNIPE_WINDOW. Status → CLOSING. Cap extensions at MAX_EXTENSIONS.</li>
          <li><b>Bid validation</b> — four checks: status isAcceptingBids / amount ≥ minRequired / not self-outbid / not seller. Re-check inside synchronized block.</li>
          <li><b>Synchronized on the auction</b> — the entire read-validate-write bid block must be atomic. Prevents two simultaneous bids corrupting currentHighestBid.</li>
          <li><b>Proxy bidding</b> — bid only the minimum needed, up to maxAmount. Never jump to max. Winner pays one increment above runner-up's ceiling.</li>
          <li><b>Bids are append-only Commands</b> — never delete. Retraction = new retraction event. Full audit log for disputes.</li>
          <li><b>Money = BigDecimal/paise integer</b> — never double. Value Object (Day 20).</li>
          <li><b>Settlement guard</b> — only call settle() from CLOSED. Check: if no bids or highestBid &lt; reservePrice → RESERVE_NOT_MET. Else → SOLD.</li>
          <li><b>Observer for notifications</b> — price change → all bidders. Outbid → previous highest. Close → all bidders. Winner → winner bidder.</li>
        </ul>
      </section>

      {/* INTERVIEW */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>The questions they actually ask</h2>

        <Reveal summary="Q: What is a Vickrey (second-price) auction and how does it change the settlement code?">
          <p>
            In a standard (first-price) auction, the winner pays their own bid. In a Vickrey auction,
            the winner pays the second-highest bid. This encourages truthful bidding — you bid your
            true maximum because you will never pay more than the market price.
          </p>
          <p>
            Design change: add a <C>SettlementStrategy</C> interface with <C>settle(Auction)</C>.
            <C>FirstPriceSettlement</C> returns <C>AuctionResult.sold(winner, highestBid)</C>.
            <C>VickreySettlement</C> returns <C>AuctionResult.sold(winner, secondHighestBid)</C>.
            Inject the strategy at auction creation. The rest of the system is unchanged.
          </p>
        </Reveal>

        <Reveal summary="Q: What happens if the winner's payment fails after settlement?">
          <p>
            Payment failure after settlement is a tricky edge case. Options:
            (1) Offer to the second-highest bidder ("reserve offer") — the runner-up gets a chance
            to buy at their bid price. (2) Re-list the item as a new auction.
            (3) Block the defaulting bidder from future auctions.
          </p>
          <p>
            Design: <C>AuctionResult</C> stays in a PAYMENT_PENDING sub-state until payment confirms.
            If payment fails, transition to PAYMENT_FAILED and invoke the fallback policy (Strategy pattern).
            Never mark SETTLED until payment succeeds — "save before you charge" (Day 52 principle).
          </p>
        </Reveal>

        <Reveal summary="Q: Can a seller cancel an auction after bidding starts?">
          <p>
            Most platforms do not allow cancellation after the first bid — it breaks trust with
            bidders who spent time and effort participating.
          </p>
          <p>
            Design: add a <C>CANCELLED</C> state reachable from DRAFT only (before OPEN). Once
            the auction moves to OPEN, cancellation is blocked by <C>canTransitionTo()</C>. If a
            business rule requires cancellation in extreme cases (fraud, misrepresentation), add a
            special admin-only path that sends refund notifications to all bidders.
          </p>
        </Reveal>

        <Reveal summary="Q: What is bid retraction and how do you model it without deleting bids?">
          <p>
            Bid retraction = a bidder asks to "take back" their bid. Most platforms allow this
            only in limited circumstances (e.g., item description was significantly wrong).
          </p>
          <p>
            Implementation: Bids are Commands (append-only log). Append a <C>BidRetraction</C> event
            with <C>{'{ bidId, bidderId, reason, retractedAt }'}</C>. The settlement code filters out
            retracted bids when computing the winner. The original bid record remains for audit.
            Never actually delete a bid row from the database.
          </p>
        </Reveal>

        <Reveal summary="Q: How do you prevent shill bidding (seller bidding on their own auction to inflate the price)?">
          <p>
            Shill bidding is illegal in most jurisdictions. Defenses at the design level:
          </p>
          <ul>
            <li><b>Check 4 in placeBid()</b> — compare <C>bidderId</C> against <C>auction.item().sellerId()</C>. Throw <C>ShillBidException</C>.</li>
            <li><b>Account-level controls</b> — link seller account to bidder accounts (same payment method, same device ID, same IP). Block known aliases.</li>
            <li><b>Audit trail</b> — the append-only bid log makes post-hoc detection possible. Disputed auctions can be replayed from the event log.</li>
            <li><b>Reserve price design</b> — a hidden reserve price reduces the incentive to shill-bid. The seller already has a floor; they do not need to manufacture artificial demand.</li>
          </ul>
        </Reveal>

        <Reveal summary="Q: Two proxy bids arrive simultaneously — how does the system resolve the race?">
          <p>
            Both proxy bids enter the <C>synchronized (auction)</C> block — only one can be active
            at a time. The first to acquire the lock places its bid; the second then runs
            <C>respondToNewBid()</C> and sees the new highest bid, then responds with its own
            auto-bid. The result is the same as sequential placement — the proxy with the higher
            maximum wins at one increment above the other's ceiling. No data corruption because
            the lock serializes the check-and-write.
          </p>
        </Reveal>

        <Reveal summary="Q: How would you detect auction fraud after the fact?">
          <p>
            Append-only bid history makes fraud detection possible by log replay:
            (1) Bid velocity: &gt;10 bids/second from one account — bot or shill ring.
            (2) Bid retraction patterns: repeatedly bid + retract to test seller reserve.
            (3) Account clustering: same device, IP, or payment method across multiple bidder accounts that always bid on the seller's items.
            (4) Price anomalies: winning bid is suspiciously close to reserve (seller may have inside info or be the shill).
            The key is that you can replay the entire event log and apply any rule retroactively because no events are ever deleted.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="sQuiz">
        <div className="sec-label">Section 13 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer — explanations and misconception notes appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 72 complete?</strong> Homework: implement the core auction in Java.
        Create <C>AuctionStatus</C> enum with <C>canTransitionTo()</C> and <C>isAcceptingBids()</C>.
        Write <C>Auction.placeBid()</C> with all four validation checks and a
        <C>synchronized</C> block that re-checks inside the lock. Add
        <C>checkAndExtendIfSniping()</C> that extends <C>endTime</C> and transitions to CLOSING.
        Write <C>settle()</C> that compares <C>highestBid</C> against <C>reservePrice</C> and
        returns the correct <C>AuctionResult</C>. Write a test that places two simultaneous
        bids using two threads and asserts exactly one wins.
        <br /><br />
        Next: <strong>Day 73 — Social Media Feed</strong>: designing a feed that handles
        millions of posts, follow relationships, and the classic fan-out-on-write vs
        fan-out-on-read trade-off for delivering timely, personalized content at scale.
      </div>

    </div>
  )
}
