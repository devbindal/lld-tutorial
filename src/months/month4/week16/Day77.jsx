import { useState, useEffect } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 0: 45-min protocol countdown timer ============ */
const PROTOCOL_PHASES = [
  { until: 5 / 45, label: 'clarify', nudge: '❓ Ask 7 design-shaping questions. Distinguish physical vs digital. State what is OUT of scope.' },
  { until: 15 / 45, label: 'entity model', nudge: '📦 Draw Book, PhysicalCopy, DigitalLicense, Member, BorrowRecord, Reservation, Fine. Draw the two state machines.' },
  { until: 35 / 45, label: 'implement', nudge: '⌨️ borrowPhysical() with synchronized, borrowDigital() CAS loop, returnBook() with fine. Compile every ~8 min. Narrate decisions.' },
  { until: 43 / 45, label: 'edge cases', nudge: '🧪 Reservation queue → READY, hold expiry, fine blocks borrow, BigDecimal not double. Drive one happy path.' },
  { until: 1, label: 'self-review', nudge: '📋 Pens down. Score the rubric honestly. Write your top-2 gaps.' },
]

function fmt(s) {
  const m = Math.floor(s / 60), ss = s % 60
  return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss
}

function ProtocolTimer() {
  const [duration, setDuration] = useState(45 * 60)
  const [left, setLeft] = useState(45 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || left === 0) return
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running, left])

  const elapsed = duration - left
  const progress = elapsed / duration
  const phaseIdx = left === 0
    ? PROTOCOL_PHASES.length - 1
    : PROTOCOL_PHASES.findIndex((p) => progress < p.until)
  const phase = PROTOCOL_PHASES[phaseIdx === -1 ? PROTOCOL_PHASES.length - 1 : phaseIdx]

  function preset(min) { setDuration(min * 60); setLeft(min * 60); setRunning(false) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · mock interview clock — start when you sit down to design</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {[25, 45, 60].map((m) => (
          <button key={m} className={duration === m * 60 ? 'on' : ''} onClick={() => preset(m)}>{m} min</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 38, fontWeight: 700, color: left === 0 ? 'var(--red)' : 'var(--ink)' }}>
          {fmt(left)}
        </span>
        {!running
          ? <button className="act" onClick={() => left > 0 && setRunning(true)}>{elapsed > 0 && left > 0 ? '▶ resume' : '▶ start the mock'}</button>
          : <button className="ghost act" onClick={() => setRunning(false)}>⏸ pause</button>}
        <button className="ghost act" onClick={() => preset(duration / 60)}>reset</button>
      </div>
      <div style={{ display: 'flex', width: '100%', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 8 }}>
        {PROTOCOL_PHASES.map((p, i) => {
          const start = i === 0 ? 0 : PROTOCOL_PHASES[i - 1].until
          const w = (p.until - start) * 100
          const active = i === (phaseIdx === -1 ? PROTOCOL_PHASES.length - 1 : phaseIdx) && elapsed > 0
          const past = progress >= p.until
          return (
            <div key={i} style={{
              width: w + '%', padding: '6px 2px', textAlign: 'center',
              fontFamily: 'IBM Plex Mono', fontSize: 10.5, whiteSpace: 'nowrap', overflow: 'hidden',
              background: active ? '#FFF1D6' : past ? '#EAF7EF' : '#fff',
              borderRight: i < PROTOCOL_PHASES.length - 1 ? '1px solid var(--line)' : 'none',
              fontWeight: active ? 700 : 400,
            }}>{p.label}</div>
          )
        })}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {left === 0
          ? <span>⏰ <b>Pens down.</b> Go directly to the rubric scorecard — score yourself honestly before reading the solutions.</span>
          : elapsed === 0
            ? <span>Read the problem in Section 1. Write your clarifying questions. Then press start and work through the reveals.</span>
            : <span style={{ fontSize: 13 }}><b>{phase.label.toUpperCase()}</b> — {phase.nudge}</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 1: Borrow/Return simulator ============ */
const INITIAL_COPIES = [
  { id: 'A', status: 'AVAILABLE' },
  { id: 'B', status: 'AVAILABLE' },
]
const TOTAL_LICENSES = 3
const MEMBERS_DATA = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
  { id: 'carol', name: 'Carol' },
]

function BorrowReturnSimulator() {
  const [copies, setCopies] = useState(INITIAL_COPIES.map((c) => ({ ...c })))
  const [activeLicenses, setActiveLicenses] = useState(0)
  // borrowedBy: { alice: { type: 'PHYSICAL'|'DIGITAL', copyId?: string } }
  const [borrowedBy, setBorrowedBy] = useState({})
  const [reservation, setReservation] = useState(null) // memberId or null
  const [log, setLog] = useState([])

  function addLog(msg) {
    setLog((l) => [...l.slice(-5), msg])
  }

  function borrowPhysical(memberId) {
    if (borrowedBy[memberId]) { addLog(`${memberId}: already has a borrow — return first`); return }
    const copyIdx = copies.findIndex((c) => c.status === 'AVAILABLE')
    if (copyIdx === -1) { addLog(`${memberId}: no physical copy available — reserve instead`); return }
    const copy = copies[copyIdx]
    setCopies((cs) => cs.map((c) => c.id === copy.id ? { ...c, status: 'BORROWED' } : c))
    setBorrowedBy((b) => ({ ...b, [memberId]: { type: 'PHYSICAL', copyId: copy.id } }))
    addLog(`${memberId} borrowed physical Copy ${copy.id}`)
  }

  function borrowDigital(memberId) {
    if (borrowedBy[memberId]) { addLog(`${memberId}: already has a borrow — return first`); return }
    if (activeLicenses >= TOTAL_LICENSES) { addLog(`${memberId}: all ${TOTAL_LICENSES} digital licenses in use`); return }
    setActiveLicenses((n) => n + 1)
    setBorrowedBy((b) => ({ ...b, [memberId]: { type: 'DIGITAL' } }))
    addLog(`${memberId} borrowed a digital license (${activeLicenses + 1}/${TOTAL_LICENSES} active)`)
  }

  function returnBook(memberId) {
    const rec = borrowedBy[memberId]
    if (!rec) { addLog(`${memberId}: nothing to return`); return }
    if (rec.type === 'DIGITAL') {
      setActiveLicenses((n) => Math.max(0, n - 1))
      setBorrowedBy((b) => { const n = { ...b }; delete n[memberId]; return n })
      addLog(`${memberId} returned digital license`)
    } else {
      // physical: check reservation queue
      if (reservation) {
        setCopies((cs) => cs.map((c) => c.id === rec.copyId ? { ...c, status: 'RESERVED' } : c))
        addLog(`${memberId} returned Copy ${rec.copyId} → held for ${reservation} (READY)`)
        setReservation(null)
        setBorrowedBy((b) => { const n = { ...b }; delete n[memberId]; return n })
      } else {
        setCopies((cs) => cs.map((c) => c.id === rec.copyId ? { ...c, status: 'AVAILABLE' } : c))
        setBorrowedBy((b) => { const n = { ...b }; delete n[memberId]; return n })
        addLog(`${memberId} returned Copy ${rec.copyId} → AVAILABLE`)
      }
    }
  }

  function reservePhysical(memberId) {
    const anyFree = copies.some((c) => c.status === 'AVAILABLE')
    if (anyFree) { addLog(`${memberId}: copies are available — borrow directly`); return }
    if (borrowedBy[memberId]) { addLog(`${memberId}: already has a borrow`); return }
    if (reservation === memberId) { addLog(`${memberId}: already in the queue`); return }
    if (reservation) { addLog(`${memberId}: queue full in this demo (1 slot)`); return }
    setReservation(memberId)
    addLog(`${memberId} joined reservation queue (position 1)`)
  }

  function reset() {
    setCopies(INITIAL_COPIES.map((c) => ({ ...c })))
    setActiveLicenses(0)
    setBorrowedBy({})
    setReservation(null)
    setLog([])
  }

  const allCopiesBusy = copies.every((c) => c.status !== 'AVAILABLE')

  return (
    <div className="panel">
      <div className="ptitle">Live demo · borrow/return simulator — "Clean Code", 2 physical copies + 3 digital licenses</div>

      {/* physical copies */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>PHYSICAL COPIES</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {copies.map((c) => (
            <div key={c.id} style={{
              padding: '8px 14px', borderRadius: 8, border: '2px solid',
              borderColor: c.status === 'AVAILABLE' ? 'var(--green)' : c.status === 'RESERVED' ? 'var(--amber)' : 'var(--red)',
              background: c.status === 'AVAILABLE' ? '#EAF7EF' : c.status === 'RESERVED' ? '#FFF1D6' : '#FDECEC',
              fontFamily: 'IBM Plex Mono', fontSize: 13, fontWeight: 600,
            }}>
              Copy {c.id} — {c.status}
            </div>
          ))}
        </div>
      </div>

      {/* digital licenses */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>DIGITAL LICENSES</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: TOTAL_LICENSES }).map((_, i) => (
            <div key={i} style={{
              width: 40, height: 40, borderRadius: 6, border: '2px solid',
              borderColor: i < activeLicenses ? 'var(--red)' : 'var(--green)',
              background: i < activeLicenses ? '#FDECEC' : '#EAF7EF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700,
            }}>{i < activeLicenses ? 'IN USE' : 'FREE'}</div>
          ))}
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', alignSelf: 'center', marginLeft: 6 }}>
            {activeLicenses}/{TOTAL_LICENSES} in use
          </span>
        </div>
      </div>

      {/* reservation queue */}
      {reservation && (
        <div style={{ marginBottom: 14, padding: '8px 12px', background: '#FFF1D6', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
          📋 Reservation queue: <b>{reservation}</b> is waiting (position 1)
        </div>
      )}

      {/* member cards */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {MEMBERS_DATA.map((m) => {
          const rec = borrowedBy[m.id]
          return (
            <div key={m.id} className="obj" style={{ minWidth: 160 }}>
              <div className="cname">{m.name}</div>
              <div className="ofield">
                {rec
                  ? rec.type === 'PHYSICAL'
                    ? `Physical Copy ${rec.copyId}`
                    : 'Digital license'
                  : 'nothing borrowed'}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {!rec && (
                  <>
                    <button className="act" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => borrowPhysical(m.id)}>
                      Borrow Physical
                    </button>
                    {allCopiesBusy && (
                      <button className="ghost act" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => reservePhysical(m.id)}>
                        Reserve
                      </button>
                    )}
                    <button className="act" style={{ fontSize: 11, padding: '4px 8px', background: activeLicenses >= TOTAL_LICENSES ? '#ccc' : undefined }} onClick={() => borrowDigital(m.id)}>
                      Borrow Digital
                    </button>
                  </>
                )}
                {rec && (
                  <button className="ghost act" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => returnBook(m.id)}>
                    Return
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* log */}
      {log.length > 0 && (
        <div style={{ background: '#F4F3EE', borderRadius: 8, padding: '8px 12px', fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
          {log.map((msg, i) => <div key={i} style={{ color: i === log.length - 1 ? 'var(--ink)' : '#888' }}>{msg}</div>)}
        </div>
      )}

      <button className="ghost act" style={{ marginTop: 10, fontSize: 12 }} onClick={reset}>Reset</button>
    </div>
  )
}

/* ============ Interactive 2: Reservation queue demo ============ */
const QUEUE_MEMBERS = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
  { id: 'carol', name: 'Carol' },
  { id: 'dave', name: 'Dave' },
  { id: 'eve', name: 'Eve' },
]

function ReservationQueueDemo() {
  // copies: alice, bob, carol each hold one copy
  const [copiesBorrowed, setCopiesBorrowed] = useState({ alice: true, bob: true, carol: true })
  // queue: array of memberId (FIFO)
  const [queue, setQueue] = useState([])
  // held: memberId who has an active hold (READY)
  const [held, setHeld] = useState(null)
  // holdExpired: whether the hold has been fast-forwarded to expired
  const [holdExpired, setHoldExpired] = useState(false)
  const [log, setLog] = useState([])

  function addLog(msg) { setLog((l) => [...l.slice(-6), msg]) }

  function reserve(memberId) {
    if (copiesBorrowed[memberId]) { addLog(`${memberId}: already holding a copy`); return }
    if (queue.includes(memberId) || held === memberId) { addLog(`${memberId}: already in queue`); return }
    if (holdExpired && queue.length === 0 && !held) {
      // re-enable after expire
    }
    setQueue((q) => [...q, memberId])
    addLog(`${memberId} joined queue — position ${queue.length + 1}`)
  }

  function returnCopy(returnerId) {
    if (!copiesBorrowed[returnerId]) { addLog(`${returnerId}: nothing to return`); return }
    setCopiesBorrowed((b) => ({ ...b, [returnerId]: false }))
    // fulfill next in queue
    if (queue.length > 0) {
      const next = queue[0]
      setQueue((q) => q.slice(1))
      setHeld(next)
      setHoldExpired(false)
      addLog(`${returnerId} returned copy → RESERVED for ${next} (hold window: 24h)`)
    } else {
      addLog(`${returnerId} returned copy → AVAILABLE (no queue)`)
    }
  }

  function pickUp(memberId) {
    if (held !== memberId) { addLog(`${memberId}: no hold for you`); return }
    if (holdExpired) { addLog(`${memberId}: hold expired — copy went back to queue`); return }
    setCopiesBorrowed((b) => ({ ...b, [memberId]: true }))
    setHeld(null)
    addLog(`${memberId} picked up copy — now borrowed`)
  }

  function fastForwardExpire() {
    if (!held) { addLog('No active hold to expire'); return }
    const expiredMember = held
    setHoldExpired(true)
    addLog(`25 hours passed — ${expiredMember}'s hold EXPIRED`)
    // fulfill next in queue if any
    if (queue.length > 0) {
      const next = queue[0]
      setQueue((q) => q.slice(1))
      setHeld(next)
      setHoldExpired(false)
      addLog(`Copy re-offered to next in queue: ${next}`)
    } else {
      setHeld(null)
      addLog('No one else in queue — copy becomes AVAILABLE')
    }
  }

  function reset() {
    setCopiesBorrowed({ alice: true, bob: true, carol: true })
    setQueue([])
    setHeld(null)
    setHoldExpired(false)
    setLog([])
  }

  const availableCopies = 3 - Object.values(copiesBorrowed).filter(Boolean).length

  return (
    <div className="panel">
      <div className="ptitle">Live demo · reservation queue — 3 copies, 5 members</div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>
          BOOK STATE: {availableCopies} of 3 copies available
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUEUE_MEMBERS.map((m) => {
            const hasCopy = copiesBorrowed[m.id]
            const inQueue = queue.includes(m.id)
            const hasHold = held === m.id && !holdExpired
            const status = hasCopy ? 'BORROWED' : hasHold ? 'HOLD READY' : inQueue ? `queue #${queue.indexOf(m.id) + 1}` : 'free'
            return (
              <div key={m.id} className="obj" style={{ minWidth: 130 }}>
                <div className="cname">{m.name}</div>
                <div className="ofield" style={{ fontSize: 12 }}>{status}</div>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {hasCopy && (
                    <button className="ghost act" style={{ fontSize: 11, padding: '3px 7px' }} onClick={() => returnCopy(m.id)}>
                      Return copy
                    </button>
                  )}
                  {!hasCopy && !inQueue && !hasHold && availableCopies === 0 && (
                    <button className="act" style={{ fontSize: 11, padding: '3px 7px' }} onClick={() => reserve(m.id)}>
                      Reserve
                    </button>
                  )}
                  {hasHold && (
                    <button className="act" style={{ fontSize: 11, padding: '3px 7px' }} onClick={() => pickUp(m.id)}>
                      Pick up
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {held && !holdExpired && (
        <div style={{ marginBottom: 10, padding: '8px 12px', background: '#FFF1D6', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
          📢 <b>{held}</b> has a READY hold — must pick up within 24h
          <button className="ghost act" style={{ fontSize: 11, padding: '3px 8px', marginLeft: 12 }} onClick={fastForwardExpire}>
            Fast-forward 25h (expire)
          </button>
        </div>
      )}

      {queue.length > 0 && (
        <div style={{ marginBottom: 10, padding: '8px 12px', background: '#F4F3EE', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
          Queue (FIFO): {queue.map((id, i) => `${i + 1}. ${id}`).join(' → ')}
        </div>
      )}

      {log.length > 0 && (
        <div style={{ background: '#F9F8F5', borderRadius: 8, padding: '8px 12px', fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
          {log.map((msg, i) => (
            <div key={i} style={{ color: i === log.length - 1 ? 'var(--ink)' : '#888' }}>{msg}</div>
          ))}
        </div>
      )}

      <button className="ghost act" style={{ marginTop: 10, fontSize: 12 }} onClick={reset}>Reset</button>
    </div>
  )
}

/* ============ Interactive 3: Fine calculator ============ */
const RATE_PER_DAY = 5 // ₹5 per day late (integer paise arithmetic in the demo)

const OVERDUE_RECORDS = [
  { id: 'BR001', member: 'Alice', book: 'Clean Code', daysLate: 2 },
  { id: 'BR002', member: 'Bob', book: 'Design Patterns', daysLate: 5 },
  { id: 'BR003', member: 'Carol', book: 'Refactoring', daysLate: 12 },
]

function FineCalculator() {
  const [processed, setProcessed] = useState(false)
  const [fines, setFines] = useState({}) // { BR001: amount }
  const [fineBalance, setFineBalance] = useState(0)
  const [paid, setPaid] = useState(false)
  const [tryBorrow, setTryBorrow] = useState(false)

  function processReturns() {
    const newFines = {}
    let total = 0
    OVERDUE_RECORDS.forEach((r) => {
      const amount = r.daysLate * RATE_PER_DAY
      newFines[r.id] = amount
      total += amount
    })
    setFines(newFines)
    setFineBalance(total)
    setProcessed(true)
    setPaid(false)
    setTryBorrow(false)
  }

  function payFines() {
    setFineBalance(0)
    setPaid(true)
    setTryBorrow(false)
  }

  function attemptBorrow() {
    setTryBorrow(true)
  }

  function reset() {
    setProcessed(false)
    setFines({})
    setFineBalance(0)
    setPaid(false)
    setTryBorrow(false)
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · fine calculator — 3 overdue records, rate = ₹{RATE_PER_DAY}/day</div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {OVERDUE_RECORDS.map((r) => (
          <div key={r.id} className="obj" style={{ minWidth: 170 }}>
            <div className="cname">{r.id}</div>
            <div className="ofield">{r.member} · {r.book}</div>
            <div className="ofield" style={{ color: 'var(--red)', fontSize: 12 }}>
              {r.daysLate} days overdue
            </div>
            {processed && fines[r.id] !== undefined && (
              <div className="ofield" style={{ color: 'var(--red)', fontWeight: 700, fontSize: 13 }}>
                Fine: ₹{fines[r.id]}
              </div>
            )}
          </div>
        ))}
      </div>

      {!processed && (
        <button className="act" onClick={processReturns}>Process returns &amp; calculate fines</button>
      )}

      {processed && (
        <div>
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: fineBalance > 0 ? '#FDECEC' : '#EAF7EF',
            fontFamily: 'Space Grotesk', fontSize: 17, fontWeight: 700,
            color: fineBalance > 0 ? 'var(--red)' : '#1d7a3a',
            marginBottom: 12,
          }}>
            {paid
              ? '✅ Fines cleared — member can borrow'
              : `Total fine balance: ₹${fineBalance}`}
          </div>

          {!paid && fineBalance > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <button className="act" onClick={payFines}>Pay ₹{fineBalance} fines</button>
              <button className="ghost act" onClick={attemptBorrow}>Try to borrow (with fines)</button>
            </div>
          )}

          {tryBorrow && !paid && (
            <div style={{ padding: '8px 12px', background: '#FDECEC', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 13, marginBottom: 10 }}>
              ❌ <b>BLOCKED</b> — validateMemberEligible() threw: "Outstanding fine of ₹{fineBalance}. Pay before borrowing."
            </div>
          )}

          {paid && (
            <div style={{ padding: '8px 12px', background: '#EAF7EF', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 13, marginBottom: 10 }}>
              ✅ validateMemberEligible() passes — borrow proceeds normally
            </div>
          )}
        </div>
      )}

      <button className="ghost act" style={{ marginTop: 10, fontSize: 12 }} onClick={reset}>Reset</button>
    </div>
  )
}

/* ============ Interactive 4: Rubric scorecard ============ */
const RUBRIC_ITEMS = [
  { cat: 'Two Resource Models', items: [
    'Distinguished physical copies (state machine per copy) from digital licenses (counter per book) in first 5 min',
    'Named both resource models correctly: CopyStatus enum for physical; AtomicInteger counter for digital',
  ]},
  { cat: 'Atomicity', items: [
    'Physical borrow: synchronized block covering findAvailableCopy() + setStatus() atomically',
    'Digital borrow: CAS loop on AtomicInteger (compareAndSet, not just check-then-set)',
    'validateMemberEligible() checks outstanding fines AND borrow count before any borrow',
  ]},
  { cat: 'Fine Calculation', items: [
    'Fine computed with BigDecimal (not double or int arithmetic for money)',
    'Fine computed LAZILY at return time, not eagerly per day',
    'Fine balance blocks new borrows (validateMemberEligible guard)',
  ]},
  { cat: 'Reservation Queue', items: [
    'Reservation WAITING → READY only when a copy is actually returned (not proactively)',
    'Hold expiry implemented: READY → EXPIRED if member does not pick up within hold window',
    'Returning while a reservation exists → copy becomes RESERVED (not AVAILABLE)',
    'Reservation queue ordered by reservedAt (FIFO — earliest waiter notified first)',
  ]},
  { cat: 'Entity Model + Patterns', items: [
    'Drew entity diagram with correct cardinalities (Book 1–* PhysicalCopy; Book 1–1 DigitalLicense)',
    'Mentioned Observer for "your hold is ready" notification to member',
    'Mentioned search index (ISBN, author, genre) as a separate concern from borrow logic',
    'Produced a compilable skeleton with the happy path running end-to-end',
  ]},
]
const RUBRIC_TOTAL = RUBRIC_ITEMS.reduce((n, g) => n + g.items.length, 0)

function RubricScorecard() {
  const [checked, setChecked] = useState({})
  const score = Object.values(checked).filter(Boolean).length
  const toggle = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }))

  let verdict, bg
  if (score >= 13) { verdict = '🟢 Hire signal — strong mock. Review the 2 unchecked items, then move to Day 78.'; bg = '#EAF7EF' }
  else if (score >= 9) { verdict = '🟡 Strong maybe — restudy the flagged areas, then re-attempt the borrow flows on paper.'; bg = '#FFF1D6' }
  else if (score >= 5) { verdict = '🔴 Needs work — implement the homework (full Java skeleton), then re-run this rubric.'; bg = '#FDECEC' }
  else { verdict = '🔴 Not ready — re-read the reveals, implement the skeleton, and revisit Day 62 (CAS) + Day 20 (Value Object) before retrying.'; bg = '#FDECEC' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · grade your design like an interviewer — tick only what you ACTUALLY produced</div>
      {RUBRIC_ITEMS.map((g) => (
        <div key={g.cat} style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>
            {g.cat.toUpperCase()}
          </div>
          {g.items.map((item, i) => {
            const k = g.cat + i
            return (
              <button key={k} onClick={() => toggle(k)} style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                fontFamily: 'IBM Plex Sans', fontSize: 13.5, padding: '5px 8px', marginBottom: 3,
                border: '1px solid var(--line)', borderRadius: 6,
                background: checked[k] ? '#EAF7EF' : '#fff',
              }}>{checked[k] ? '☑' : '☐'} {item}</button>
            )
          })}
        </div>
      ))}
      <div className="statbar" style={{ display: 'block', background: score > 0 ? bg : undefined }}>
        <span style={{ fontSize: 13.5 }}>
          <b>Score: {score} / {RUBRIC_TOTAL}</b>{score > 0 && <> — {verdict}</>}
        </span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  {
    q: 'Two members click "Borrow Physical" for the last available copy at exactly the same time. What prevents both from getting it?',
    o: [
      'The UI disables the button on the second click',
      'A synchronized block on the bookId covering findAvailableCopy() and setStatus() atomically',
      'A database unique constraint on the copy row',
      'An AtomicInteger counting available copies',
    ],
    a: 1,
    e: 'The synchronized block on a per-book lock makes findAvailableCopy() + setStatus() an atomic unit. One thread grabs the copy and transitions it to BORROWED before the other thread can observe it as AVAILABLE. UI disabling is a hint, not a guarantee — it can be bypassed.',
    w: {
      0: 'UI state can be manipulated or bypassed — the server cannot trust it. Two simultaneous requests can both see the button enabled.',
      2: 'A DB constraint is a valid defence-in-depth layer, but the application layer must still prevent the race — otherwise you get a constraint violation exception instead of a clean "no copy available" error.',
      3: 'AtomicInteger works for the digital license counter because licenses are fungible. Physical copies have individual identity (Copy A vs Copy B) — you need to find a specific copy AND claim it atomically, not just decrement a count.',
    },
    r: { id: 's5', label: 'Section 5 — Borrow flows' },
  },
  {
    q: 'Why does borrowing a digital license use AtomicInteger.compareAndSet(), not synchronized?',
    o: [
      'Digital licenses do not need atomicity because they are not physical',
      'CAS is faster and avoids blocking — licenses are fungible, so any slot is equivalent',
      'AtomicInteger is only for counting, not for mutual exclusion',
      'synchronized would make the license counter inaccurate',
    ],
    a: 1,
    e: 'Digital licenses are fungible — "license slot 2" and "license slot 3" are identical. You just need to atomically increment the count and verify it did not exceed totalLicenses. CAS (compareAndSet) does this without blocking. Physical copies are non-fungible — you need to find a specific copy AND claim it, which requires synchronized.',
    w: {
      0: 'Digital licenses absolutely need atomicity — two concurrent borrows can both see activeBorrows < totalLicenses and both increment, giving N+1 active borrows.',
      2: 'AtomicInteger is specifically designed for thread-safe mutation — compareAndSet is its primary atomicity tool.',
      3: 'synchronized would work correctly — it is just heavier than needed for a counter. AtomicInteger is the lighter, better fit.',
    },
    r: { id: 's5', label: 'Section 5 — Borrow flows' },
  },
  {
    q: 'Alice returns a physical copy while Dave is first in the reservation queue. What is the correct copy status after the return?',
    o: [
      'LOST — the reservation queue cannot co-exist with copy returns',
      'BORROWED — Dave immediately borrows it',
      'RESERVED — held for Dave until he picks it up or the hold expires',
      'AVAILABLE — the copy goes back to the shelf',
    ],
    a: 2,
    e: 'When a copy is returned and someone is waiting, the copy transitions to RESERVED — not AVAILABLE. This prevents another member from grabbing it before Dave can pick it up. Dave is notified and given a hold window. If Dave picks it up, the status becomes BORROWED. If the window expires, the copy either goes to the next queue member (RESERVED again) or becomes AVAILABLE.',
    w: {
      0: 'LOST is a real copy status (damaged/missing book) but has nothing to do with reservation fulfillment.',
      1: 'Dave cannot be force-borrowed — he must come and pick it up. The system cannot know if Dave will arrive.',
      3: 'Making it AVAILABLE means anyone could borrow it before Dave picks it up — that defeats the purpose of the reservation queue.',
    },
    r: { id: 's8', label: 'Section 8 — Reservation queue' },
  },
  {
    q: 'A borrow is due on June 10. The member returns on June 15. What is the fine?',
    o: [
      'The fine is estimated using a floating-point multiplication of the days and rate',
      'The fine is computed in a background job that runs at midnight each day',
      'The fine is computed lazily at return time: max(0, 5) days × rate per day',
      'There is no fine — the system only tracks borrows, not fines',
    ],
    a: 2,
    e: 'The fine is computed lazily: daysLate = ChronoUnit.DAYS.between(dueAt, LocalDate.now()), then fine = RATE_PER_DAY.multiply(daysLate) using BigDecimal. This is simpler than an eager per-day job and avoids the problem of the sweeper job missing a day.',
    w: {
      0: 'Floating-point arithmetic (double) must never be used for money. 0.1 + 0.2 != 0.3 in double. Use BigDecimal.',
      1: 'A nightly sweeper would work but is unnecessary complexity. Lazy computation at return time is simpler and equally correct for the fine amount.',
      3: 'Fine tracking is a core requirement — overdue items incur daily fines per the problem statement.',
    },
    r: { id: 's7', label: 'Section 7 — Return and fine calculation' },
  },
  {
    q: 'A member has an outstanding fine of ₹85. They try to borrow a new book. What should happen?',
    o: [
      'The borrow is blocked by validateMemberEligible(), which checks fine balance before any borrow',
      'The borrow succeeds — fines and borrowing are independent concerns',
      'The fine is automatically deducted from the member\'s account and the borrow succeeds',
      'The system sends an email reminder and allows the borrow anyway',
    ],
    a: 0,
    e: 'validateMemberEligible() is the single guard that runs before both borrowPhysical() and borrowDigital(). It checks two things: (1) outstanding fine balance is zero, (2) borrow count is under the limit. If either check fails, an exception is thrown and the borrow does not proceed.',
    w: {
      1: 'Fines and borrowing are intentionally coupled — the library uses fine-blocking as the enforcement mechanism for overdue items.',
      2: 'Auto-deducting without explicit member action is a payment system concern, not a library design concern. The mock assumes manual payment.',
      3: 'Email reminders are a notification concern (Observer/Day 57). The borrow itself must be blocked — reminders do not replace enforcement.',
    },
    r: { id: 's5', label: 'Section 5 — Borrow flows' },
  },
  {
    q: 'Dave\'s hold window expires before he picks up the reserved copy. What should the system do?',
    o: [
      'Cancel Dave\'s reservation, move to the next queued member (or set copy to AVAILABLE if no one is waiting)',
      'Automatically borrow the book for Dave and add it to his account',
      'Send Dave another reminder and extend the hold indefinitely',
      'Keep the copy in RESERVED status until Dave picks it up',
    ],
    a: 0,
    e: 'Hold expiry transitions the Reservation from READY to EXPIRED. The copy must be freed and given to the next queue member (their Reservation becomes READY), or set to AVAILABLE if the queue is empty. Holding it indefinitely blocks everyone else in the queue.',
    w: {
      1: 'Force-borrowing on behalf of a member is never correct — the member must be present to borrow.',
      2: 'Indefinite holds starve other members who are waiting. The hold window exists precisely to prevent this.',
      3: 'RESERVED indefinitely is a leaked hold — the copy is effectively out of circulation for no one.',
    },
    r: { id: 's8', label: 'Section 8 — Reservation queue' },
  },
  {
    q: 'Which pattern best describes sending "your hold is ready" to Dave when his reservation becomes READY?',
    o: [
      'Template Method — the notification follows a fixed sequence of steps',
      'Command — the notification is queued for later execution',
      'Strategy — Dave\'s notification preference is swappable',
      'Observer — the reservation fulfillment event notifies interested members',
    ],
    a: 3,
    e: 'The reservation-fulfilled event is an Observer event: the ReservationService publishes "hold ready for Dave" and the NotificationService (subscriber) sends the message. The member (or their notification channel) is the observer. This is the same Observer pattern from Day 32.',
    w: {
      0: 'Template Method (Day 35) defines an algorithm skeleton. Sending a single notification is not a multi-step algorithm with fixed structure.',
      1: 'Command (Day 33) encapsulates a request as an object for undo/redo or queuing. A notification event is not a command.',
      2: 'Strategy (Day 31) would apply to the notification channel (email vs SMS vs push) — that is a swappable "how to notify" seam. The "when to notify" event is Observer.',
    },
    r: { id: 's11', label: 'Section 11 — Patterns map' },
  },
  {
    q: 'The library wants to store e-book formats (PDF, EPUB, MOBI) and let members download them. How should DigitalLicense change?',
    o: [
      'Store formats in the Book entity alongside physical copy references',
      'Replace DigitalLicense with a PhysicalCopy that has type=DIGITAL',
      'Add a List<String> formats field to DigitalLicense and return all format URLs on borrow',
      'Create a separate DigitalAsset entity for each format, linked to the Book — DigitalLicense controls concurrent access, DigitalAsset provides the download URLs',
    ],
    a: 3,
    e: 'DigitalLicense models concurrent access control (how many people can read this book at once). DigitalAsset models the actual file (what bytes do I serve). These are different responsibilities (SRP, Day 11). DigitalLicense stays unchanged; DigitalAsset is a new entity per format, linked to the Book. On borrow, the system returns a time-limited download token pointing to the appropriate DigitalAsset.',
    w: {
      0: 'Storing formats in Book violates SRP — Book models bibliographic data (title, author, ISBN), not file assets.',
      1: 'A DIGITAL type on PhysicalCopy would break the two-resource-model design — digital licenses are counters, not per-instance state machines.',
      2: 'A List<String> on DigitalLicense conflates the access-control concern with the file-serving concern. The license should not know about formats.',
    },
    r: { id: 's4', label: 'Section 4 — Two resource models' },
  },
]

/* ============ The page ============ */
export default function Day77() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 16 · Day 77</div>
        <h1>Mock Interview Round 2:<br />Digital Library</h1>
        <p>A fresh problem — same protocol as Round 1. Design first. Reveal after.
          The twist in this problem is that two completely different resource models live inside the same system.</p>
        <div className="chips">
          {['45-Min Mock', 'Two Resource Models', 'Counter vs State Machine', 'Reservation Queue', 'Fine Calculation'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* s1: protocol + timer */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Before you read the solution — the 45-minute protocol</h2>
        <p>Same rules as Round 1. The reveals below are the interviewer's reference answers.
          <strong> Do not open any reveal until the timer reaches the matching phase.</strong>
          Work through this as a real mock first.</p>
        <Code html={`  THE 45-MINUTE DIGITAL LIBRARY MOCK
  ─────────────────────────────────────────────────────────────────
   0– 5 min   CLARIFY — ask the questions in Section 2.
               The defining question: is there both a physical AND digital
               system? How many simultaneous digital borrows are allowed?

   5–15 min   ENTITY MODEL — draw on paper:
               Book, PhysicalCopy, DigitalLicense, Member, BorrowRecord,
               Reservation, Fine. Draw the TWO state machines.
               Mark which resources use a state machine vs a counter.

  15–35 min   IMPLEMENT
               · borrowPhysical(): synchronized on bookId
               · borrowDigital(): CAS loop on AtomicInteger
               · returnBook(): fine calc + fulfillNextReservation()
               · reservePhysical(): queue the member
               Compile every ~8 minutes. Narrate every decision.

  35–45 min   EDGE CASES + FOLLOW-UPS
               · Fine in BigDecimal, not double
               · Hold expiry: READY → EXPIRED → next in queue
               · validateMemberEligible(): fines + limit check
               · Search index (separate concern, don't model deeply)
               Then run the rubric. Write your top-2 gaps.`} />
        <div className="panel" style={{ borderLeft: '4px solid var(--amber)' }}>
          <div className="ptitle" style={{ color: 'var(--amber)' }}>Protocol reminder</div>
          <p style={{ margin: 0, fontSize: 14 }}>
            <strong>Do NOT scroll to the solution sections yet.</strong> Read the problem in Section 2.
            Write your clarifying questions on paper. Only open a reveal when the matching phase is active.
          </p>
        </div>
        <ProtocolTimer />
        <Note><strong>Why the protocol matters more in Round 2.</strong> In Round 1 you had the benefit of fresh
          pattern memory. Round 2 is the real test: can you apply the same structured habits (clarify → model →
          implement → edge cases) to a problem you have never seen, in 45 minutes, under pressure?
          The interviewer is watching your <em>process</em>, not just your output.</Note>
      </section>

      {/* s2: clarifying questions */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The problem + clarifying questions</h2>
        <p><strong>Problem statement (what the interviewer says):</strong></p>
        <div style={{ padding: '12px 16px', background: '#F4F3EE', borderRadius: 8, fontStyle: 'italic', marginBottom: 16, fontSize: 14.5 }}>
          "Design a Digital Library System. Members can search for books by title, author, ISBN, or genre.
          The library has physical copies (limited, location-tracked) and digital e-books (limited simultaneous
          licenses — for example, only 5 people can have the same e-book checked out at once). Members have a
          borrow limit (3 physical + 3 digital at a time). Overdue items incur daily fines. Physical books can
          be reserved (placed on a hold queue) when all copies are borrowed. Design the core entities, the
          borrow / return / reserve flows, and the fine calculation."
        </div>
        <p>Write 5–7 questions on paper before looking at the table. Which answers would change your class model?</p>
        <table className="matrix">
          <thead>
            <tr><th>Question to ask</th><th>Why it matters</th><th>Answer for this mock</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Both physical AND digital books in the same system?</td>
              <td>Two completely different resource models — this is the interview's core insight</td>
              <td>Yes — physical copies use a state machine; digital licenses use a counter</td>
            </tr>
            <tr>
              <td>How many simultaneous digital borrows per title?</td>
              <td>The license limit determines whether you use a counter + CAS or a per-instance state machine</td>
              <td>Configurable per book (e.g. 5). Model as <C>DigitalLicense.totalLicenses</C></td>
            </tr>
            <tr>
              <td>Borrow limits per member? Do tiers (student/faculty) differ?</td>
              <td>Determines the second check in <C>validateMemberEligible()</C></td>
              <td>3 physical + 3 digital. Tiers are in scope but keep it simple for the mock</td>
            </tr>
            <tr>
              <td>Can a member renew a borrow before it is due?</td>
              <td>Renewal is a common follow-up that complicates the due-date model</td>
              <td>Out of scope for the mock — good to name it and defer</td>
            </tr>
            <tr>
              <td>Can digital books be reserved like physical ones?</td>
              <td>The reservation queue only makes sense for finite named resources</td>
              <td>No — digital licenses are fungible. Reservation is physical-only in this mock</td>
            </tr>
            <tr>
              <td>How is search implemented — full text or exact fields?</td>
              <td>Determines whether you need an inverted index or just DB queries</td>
              <td>Search by ISBN (exact), author/title/genre (substring). Treat as a separate concern — mention an index, do not model it deeply</td>
            </tr>
            <tr>
              <td>Inter-library loan (ILL) — can members request books the library does not have?</td>
              <td>Adds an entirely new entity (ILL request). Out of scope for 45 minutes</td>
              <td>Out of scope — name it and park it</td>
            </tr>
          </tbody>
        </table>
        <Good><strong>The most important question is the first one.</strong> "Is there both a physical and
          digital system?" unlocks the two-resource-model insight that drives the entire design. A candidate
          who asks this in minute 1 and names the two models (state machine vs counter) immediately signals
          senior-level thinking.</Good>
      </section>

      {/* s3: entity model */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Entity model — draw yours first, then reveal</h2>
        <p>Draw all seven entities and their relationships on paper. Label the cardinalities. Mark which
          fields belong to physical-only vs digital-only contexts.
          <strong> Open the reveal only after you have something on paper.</strong></p>
        <Warn><strong>Common mistake:</strong> treating PhysicalCopy and DigitalLicense as the same entity.
          They have completely different structures — PhysicalCopy has a unique id, location, and individual
          status. DigitalLicense is a single record per book with a counter. Do not merge them.</Warn>
        <Reveal summary="🔒 Reference entity model — open after your own attempt">
          <Code html={`  ENTITY MODEL — Digital Library
  ──────────────────────────────────────────────────────────────────────
  ┌─────────────────┐     ┌────────────────────┐     ┌────────────────┐
  │      Book       │     │   PhysicalCopy     │     │ DigitalLicense │
  │─────────────────│ 1   │────────────────────│ 1   │────────────────│
  │ id              │─────│ id                 │     │ bookId         │
  │ isbn            │   * │ bookId             │     │ totalLicenses  │
  │ title           │     │ status: CopyStatus │     │ activeBorrows  │
  │ author          │     │ locationCode       │     │   (AtomicInt)  │
  │ genres: List    │     └────────────────────┘     └────────────────┘
  └─────────────────┘           one-to-many             one-to-one
        │
        │ 1
        │ *
  ┌─────────────────┐     ┌────────────────────┐     ┌────────────────┐
  │  BorrowRecord   │     │    Reservation     │     │     Fine       │
  │─────────────────│     │────────────────────│     │────────────────│
  │ id              │     │ id                 │     │ memberId       │
  │ memberId        │     │ memberId           │     │ borrowRecordId │
  │ bookId          │     │ bookId             │     │ amount: Money  │
  │ type: BorrowType│     │ queuePosition      │     │ paid: boolean  │
  │   PHYSICAL|DIGITAL    │ status: ResStatus  │     └────────────────┘
  │ copyId? (null for     │ notifiedAt?        │
  │   digital)     │     │ holdExpiresAt?     │
  │ borrowedAt      │     └────────────────────┘
  │ dueAt           │
  │ returnedAt?     │     ┌────────────────────┐
  └─────────────────┘     │      Member        │
                          │────────────────────│
                          │ id                 │
                          │ name               │
                          │ tier: MemberTier   │
                          │ fineBalance: Money │
                          └────────────────────┘

  CLOSED SETS (become enums)
  ──────────────────────────────────────────────────
  enum CopyStatus       { AVAILABLE, BORROWED, RESERVED, LOST, MAINTENANCE }
  enum BorrowType       { PHYSICAL, DIGITAL }
  enum ReservationStatus{ WAITING, READY, EXPIRED, FULFILLED, CANCELLED }
  enum MemberTier       { STUDENT, FACULTY, PUBLIC }`} />
          <Note><strong>Why copyId is nullable in BorrowRecord:</strong> digital borrows do not correspond
            to a specific copy — they claim one of N fungible license slots. The copyId field is only
            meaningful for PHYSICAL borrows. Using <C>Optional&lt;String&gt;</C> or a nullable field with a
            type discriminator (BorrowType) is cleaner than two separate record classes.</Note>
        </Reveal>
      </section>

      {/* s4: two resource models */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Two resource models — the insight that separates senior from junior</h2>
        <p>The hardest insight in this problem is that <strong>physical copies and digital licenses need
          fundamentally different models</strong>, even though both represent "can I borrow this book right now?"</p>
        <Reveal summary="🔒 State machine vs counter — open after thinking it through yourself">
          <Code html={`  PHYSICAL COPIES — state machine per copy
  ──────────────────────────────────────────────────────────────────
  Each copy is a unique object with its own lifecycle.
  Copy A and Copy B are different things (different shelf locations,
  different wear, different borrow history).

  AVAILABLE ──[member borrows]──▶ BORROWED ──[member returns]──▶ AVAILABLE
      ▲                                │
      │                                │ (if reservation exists)
      └─────[hold window expires]──▶ RESERVED ──[member picks up]──▶ BORROWED
                                        │
                                 [hold expires]
                                        ▼
                                 (next in queue or AVAILABLE)

  · Use an enum CopyStatus on each PhysicalCopy object
  · Transition: findAvailableCopy() + setStatus() must be ATOMIC
    (synchronized on a per-book lock)
  · Think: hotel rooms (Day 51). Each room is unique.

  DIGITAL LICENSES — counter per book
  ──────────────────────────────────────────────────────────────────
  All license slots for "Clean Code" are IDENTICAL.
  Slot 1 and slot 2 are not different things.
  The only question is: how many are currently in use?

  totalLicenses = 5
  activeBorrows = AtomicInteger (0..5)

  · Use compareAndSet(current, current+1) to claim a slot
  · No per-slot object; no per-slot status
  · Think: parking-lot CAPACITY (Day 41), rate limiter token bucket (Day 65)
    These are all "counter" resources, not "named instance" resources.

  WHY THEY DIFFER
  ──────────────────────────────────────────────────────────────────
  Physical copy: identity matters.  You return COPY A to SHELF B4.
  Digital license: identity does not matter.  You return "one slot."
  The state machine is because COPIES HAVE INDIVIDUAL HISTORY.
  The counter is because LICENSE SLOTS ARE FUNGIBLE.`} />
          <Note><strong>The interview test:</strong> an interviewer who plants this problem is checking
            whether you reach for "state machine per instance" reflexively for both, or whether you notice
            that digital licenses are better modelled as a semaphore-style counter. Naming this distinction
            at minute 4 puts you in the top tier of candidates.</Note>
        </Reveal>
      </section>

      {/* s5: borrow flows */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Borrow flows — atomic claims for two different models</h2>
        <p>Write both <C>borrowPhysical()</C> and <C>borrowDigital()</C> on paper before revealing.
          They look similar at the call site but use completely different concurrency primitives.</p>
        <Reveal summary="🔒 Reference borrow implementations — open after your own attempt">
          <Code html={`<span class="kw">class</span> LibraryService {

    <span class="cm">// ── SHARED GUARD ────────────────────────────────────────────────────</span>
    <span class="kw">private void</span> validateMemberEligible(String memberId) {
        Member m = memberRepo.find(memberId);
        <span class="cm">// guard 1: outstanding fines block all new borrows</span>
        <span class="kw">if</span> (m.fineBalance().isPositive())
            <span class="kw">throw new</span> OutstandingFineException(
                <span class="str">"Pay ₹"</span> + m.fineBalance() + <span class="str">" before borrowing"</span>);
        <span class="cm">// guard 2: borrow limit (3 physical + 3 digital per member)</span>
        <span class="kw">long</span> physActive = recordRepo.countActive(memberId, BorrowType.PHYSICAL);
        <span class="kw">long</span> digActive  = recordRepo.countActive(memberId, BorrowType.DIGITAL);
        <span class="kw">if</span> (physActive &gt;= <span class="num">3</span>) <span class="kw">throw new</span> BorrowLimitException(<span class="str">"Physical borrow limit reached"</span>);
        <span class="kw">if</span> (digActive  &gt;= <span class="num">3</span>) <span class="kw">throw new</span> BorrowLimitException(<span class="str">"Digital borrow limit reached"</span>);
    }

    <span class="cm">// ── PHYSICAL BORROW — synchronized per book ─────────────────────────</span>
    BorrowRecord borrowPhysical(String memberId, String bookId) {
        validateMemberEligible(memberId); <span class="cm">// fines + limit BEFORE the lock</span>
        <span class="cm">// intern() gives us a stable per-bookId monitor object</span>
        <span class="kw">synchronized</span> (bookId.intern()) {
            <span class="cm">// find the first AVAILABLE copy (atomically inside the lock)</span>
            PhysicalCopy copy = copyRepo.findAvailableByBook(bookId)
                .orElseThrow(() -&gt;
                    <span class="kw">new</span> NoCopyAvailableException(<span class="str">"All copies borrowed"</span>));
            <span class="cm">// transition the copy status inside the lock</span>
            copy.setStatus(CopyStatus.BORROWED);
            copyRepo.save(copy);
            <span class="cm">// calculate due date based on member tier</span>
            LocalDate dueDate = LocalDate.now().plusDays(loanDays(memberId));
            BorrowRecord rec = <span class="kw">new</span> BorrowRecord(
                memberId, bookId, BorrowType.PHYSICAL, copy.id(), now(), dueDate);
            <span class="kw">return</span> recordRepo.save(rec);
        }
    }

    <span class="cm">// ── DIGITAL BORROW — CAS loop on AtomicInteger ──────────────────────</span>
    BorrowRecord borrowDigital(String memberId, String bookId) {
        validateMemberEligible(memberId);
        DigitalLicense lic = licenseRepo.find(bookId);
        <span class="cm">// CAS retry loop — retries if another thread beat us</span>
        <span class="kw">while</span> (<span class="kw">true</span>) {
            <span class="kw">int</span> current = lic.activeBorrows().get(); <span class="cm">// read current count</span>
            <span class="kw">if</span> (current &gt;= lic.totalLicenses())  <span class="cm">// all slots full?</span>
                <span class="kw">throw new</span> NoLicenseAvailableException(<span class="str">"All licenses in use"</span>);
            <span class="cm">// atomic compare-and-set: only increments if count is still 'current'</span>
            <span class="kw">if</span> (lic.activeBorrows().compareAndSet(current, current + <span class="num">1</span>)) <span class="kw">break</span>;
            <span class="cm">// another thread changed the count — retry from the top</span>
        }
        LocalDate dueDate = LocalDate.now().plusDays(<span class="num">14</span>);
        BorrowRecord rec = <span class="kw">new</span> BorrowRecord(
            memberId, bookId, BorrowType.DIGITAL, <span class="kw">null</span>, now(), dueDate);
        <span class="kw">return</span> recordRepo.save(rec);
    }
}`} />
          <Warn><strong>The synchronized scope matters.</strong> Only <C>findAvailableCopy() + setStatus()</C>
            need to be inside the <C>synchronized</C> block. Putting <C>validateMemberEligible()</C> inside
            the lock too means one thread holds the book-level lock while doing DB queries — that is a
            performance trap. Validate BEFORE acquiring the lock.</Warn>
        </Reveal>
      </section>

      {/* s6: interactive borrow/return simulator */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>Play: borrow / return simulator</h2>
        <p>One book ("Clean Code"), 2 physical copies, 3 digital licenses, 3 members.
          Notice when "Borrow Physical" greys out and "Reserve" appears. Return a copy when
          a reservation is pending — watch the copy go to RESERVED instead of AVAILABLE.</p>
        <BorrowReturnSimulator />
        <Good><strong>What to notice:</strong> (1) When all physical copies are borrowed, the "Reserve" button
          appears instead of "Borrow Physical." (2) When you return a copy while a reservation exists, the copy
          goes to RESERVED (not AVAILABLE) and the queued member is notified. (3) All 3 digital license slots
          can fill independently of the physical copies — two separate resource pools.</Good>
      </section>

      {/* s7: return + fine calculation */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Return + fine calculation — lazy, BigDecimal, at return time</h2>
        <p>Write <C>returnBook()</C> before opening the reveal. Focus on three things: (1) compute the
          fine only at return time, (2) use BigDecimal not double, (3) after freeing the resource, check
          the reservation queue.</p>
        <Reveal summary="🔒 Reference returnBook() implementation — open after your own attempt">
          <Code html={`<span class="kw">class</span> LibraryService {

    <span class="cm">// fine rate — use BigDecimal from the start, never double for money</span>
    <span class="kw">private static final</span> BigDecimal RATE_PER_DAY =
        <span class="kw">new</span> BigDecimal(<span class="str">"5.00"</span>); <span class="cm">// ₹5 per day late</span>

    <span class="kw">void</span> returnBook(String borrowRecordId) {
        BorrowRecord rec = recordRepo.find(borrowRecordId);

        <span class="cm">// step 1: stamp the return time</span>
        rec.setReturnedAt(Instant.now());

        <span class="cm">// step 2: compute fine LAZILY at return time (not per day in a cron job)</span>
        <span class="kw">long</span> daysLate = ChronoUnit.DAYS.between(rec.dueAt(), LocalDate.now());
        <span class="kw">if</span> (daysLate &gt; <span class="num">0</span>) {
            <span class="cm">// BigDecimal.multiply — exact arithmetic, no floating-point rounding</span>
            BigDecimal fineAmt = RATE_PER_DAY.multiply(BigDecimal.valueOf(daysLate));
            <span class="cm">// add fine to the member's running balance</span>
            memberRepo.addFine(rec.memberId(), fineAmt, rec.id());
        }
        recordRepo.save(rec);

        <span class="cm">// step 3: free the resource and handle reservation queue</span>
        <span class="kw">if</span> (rec.type() == BorrowType.PHYSICAL) {
            PhysicalCopy copy = copyRepo.find(rec.copyId());
            fulfillNextReservation(copy, rec.bookId()); <span class="cm">// checks queue</span>
        } <span class="kw">else</span> {
            <span class="cm">// digital: decrement the counter (CAS not needed — one writer here)</span>
            licenseRepo.find(rec.bookId()).activeBorrows().decrementAndGet();
        }
    }
}`} />
          <Note><strong>Why lazy fine calculation?</strong> A nightly cron job that adds ₹5 to each
            overdue member's balance is more complex and can miss days (server restarts, missed runs).
            Computing at return time is simpler and correct: the member cannot avoid the fine by returning
            at 11:59 PM vs 12:01 AM the next day — <C>ChronoUnit.DAYS.between</C> counts whole calendar
            days.</Note>
          <Warn><strong>Never use double for money.</strong> <C>5.0 * 12</C> is fine in a demo, but
            <C>0.1 + 0.2 == 0.30000000000000004</C> in Java double. The Mars Climate Orbiter was lost
            to a unit conversion error. Use <C>BigDecimal</C> from Day 20 — always.</Warn>
        </Reveal>
      </section>

      {/* s8: reservation queue */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Reservation queue — WAITING → READY → FULFILLED / EXPIRED</h2>
        <p>The reservation lifecycle is the most complex state machine in this problem. Write the
          <C>reservePhysical()</C> and <C>fulfillNextReservation()</C> methods before revealing.</p>
        <Reveal summary="🔒 Reference reservation implementation — open after your own attempt">
          <Code html={`<span class="kw">class</span> LibraryService {

    <span class="cm">// how long a member has to pick up a held copy before it goes to the next person</span>
    <span class="kw">private static final</span> Duration HOLD_WINDOW = Duration.ofHours(<span class="num">24</span>);

    <span class="cm">// ── RESERVE — only valid when all copies are borrowed ───────────────</span>
    <span class="kw">void</span> reservePhysical(String memberId, String bookId) {
        <span class="cm">// reject if any copy is AVAILABLE right now — borrow directly</span>
        <span class="kw">boolean</span> anyFree = copyRepo.findByBook(bookId).stream()
            .anyMatch(c -&gt; c.status() == CopyStatus.AVAILABLE);
        <span class="kw">if</span> (anyFree)
            <span class="kw">throw new</span> CopyAvailableException(<span class="str">"Copies available — borrow directly"</span>);
        <span class="cm">// position = number of WAITING reservations before this one</span>
        <span class="kw">int</span> queuePos = reservationRepo.countWaiting(bookId);
        Reservation res = <span class="kw">new</span> Reservation(
            memberId, bookId, queuePos, ReservationStatus.WAITING, Instant.now());
        reservationRepo.save(res);
    }

    <span class="cm">// ── FULFILL — called from returnBook() after copy is freed ──────────</span>
    <span class="kw">private void</span> fulfillNextReservation(PhysicalCopy copy, String bookId) {
        <span class="cm">// find the earliest WAITING reservation (FIFO by reservedAt)</span>
        reservationRepo.findNextWaiting(bookId).ifPresentOrElse(
            res -&gt; {
                <span class="cm">// mark copy as RESERVED (not AVAILABLE) — it belongs to this member now</span>
                copy.setStatus(CopyStatus.RESERVED);
                copyRepo.save(copy);
                <span class="cm">// transition reservation to READY and set the hold expiry deadline</span>
                res.setStatus(ReservationStatus.READY);
                res.setNotifiedAt(Instant.now());
                res.setHoldExpiresAt(Instant.now().plus(HOLD_WINDOW));
                reservationRepo.save(res);
                <span class="cm">// notify the member — Observer pattern (Day 32)</span>
                notificationService.notify(res.memberId(),
                    <span class="str">"Your hold is ready — pick up by "</span> + res.holdExpiresAt());
            },
            <span class="cm">// no one is waiting — just make the copy available</span>
            () -&gt; { copy.setStatus(CopyStatus.AVAILABLE); copyRepo.save(copy); }
        );
    }

    <span class="cm">// ── HOLD EXPIRY — called by a scheduled sweeper ─────────────────────</span>
    <span class="kw">void</span> expireStaleHolds() {
        List&lt;Reservation&gt; ready = reservationRepo.findReady(); <span class="cm">// status=READY</span>
        <span class="kw">for</span> (Reservation res : ready) {
            <span class="kw">if</span> (Instant.now().isAfter(res.holdExpiresAt())) {
                res.setStatus(ReservationStatus.EXPIRED);
                reservationRepo.save(res);
                <span class="cm">// re-trigger fulfillment: give to the next waiter or free the copy</span>
                PhysicalCopy copy = copyRepo.findReservedForBook(res.bookId());
                fulfillNextReservation(copy, res.bookId());
            }
        }
    }

    <span class="cm">// ── PICK UP — member comes to collect the held copy ─────────────────</span>
    BorrowRecord pickUpHold(String memberId, String bookId) {
        Reservation res = reservationRepo.findReadyForMember(memberId, bookId)
            .orElseThrow(() -&gt; <span class="kw">new</span> NoHoldException(<span class="str">"No ready hold for this member"</span>));
        <span class="kw">if</span> (Instant.now().isAfter(res.holdExpiresAt()))
            <span class="kw">throw new</span> HoldExpiredException(<span class="str">"Hold window expired — rejoin the queue"</span>);
        <span class="cm">// transition RESERVED copy to BORROWED</span>
        PhysicalCopy copy = copyRepo.findReservedForBook(bookId);
        copy.setStatus(CopyStatus.BORROWED);
        copyRepo.save(copy);
        res.setStatus(ReservationStatus.FULFILLED);
        reservationRepo.save(res);
        LocalDate dueDate = LocalDate.now().plusDays(loanDays(memberId));
        <span class="kw">return</span> recordRepo.save(
            <span class="kw">new</span> BorrowRecord(memberId, bookId, BorrowType.PHYSICAL, copy.id(), now(), dueDate));
    }
}`} />
          <Good><strong>The RESERVED status is the key insight.</strong> When a copy is returned and someone
            is waiting, it does NOT become AVAILABLE. It goes straight to RESERVED. This prevents another
            member from grabbing it in the window between the return and the queued member picking it up.
            RESERVED is effectively "pre-allocated to the next queue member."</Good>
        </Reveal>
      </section>

      {/* s9: interactive reservation queue */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>Play: reservation queue in action</h2>
        <p>All 3 copies are borrowed by Alice, Bob, and Carol. Dave and Eve join the queue.
          Return a copy to see the READY notification flow. Use "Fast-forward 25h" to watch hold expiry
          cascade to the next member in the queue.</p>
        <ReservationQueueDemo />
        <Good><strong>What to notice:</strong> (1) "Reserve" only appears when all copies are borrowed — never
          when a copy is available. (2) Returning Carol's copy activates Dave's hold, not Eve's — FIFO order.
          (3) Fast-forwarding 25h expires Dave's hold and immediately offers the copy to Eve. The queue
          cascades correctly without manual intervention.</Good>
      </section>

      {/* s10: interactive fine calculator */}
      <section id="s10">
        <div className="sec-label">Section 10 · Interactive</div>
        <h2>Play: fine calculator</h2>
        <p>Three overdue borrow records. Click "Process returns" to compute fines at return time using
          integer arithmetic (representing paise). Try borrowing with an outstanding balance —
          watch <C>validateMemberEligible()</C> block the request.</p>
        <FineCalculator />
        <Good><strong>What to notice:</strong> (1) Fines are computed at return time, not per day in advance.
          (2) The total fine balance blocks any new borrow — one guard, applied to both physical and digital.
          (3) Paying fines clears the balance and re-enables borrowing immediately.</Good>
      </section>

      {/* s11: patterns map */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>Patterns map — name these in the interview</h2>
        <p>Every pattern you name explains <em>why</em> your design has a particular structure.
          Here are the six that appear naturally in this system:</p>
        <table className="matrix">
          <thead>
            <tr><th>Pattern</th><th>Where it appears</th><th>Day reference</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>State (Day 34)</td>
              <td>PhysicalCopy status (AVAILABLE → BORROWED → RESERVED → AVAILABLE). Reservation status (WAITING → READY → FULFILLED / EXPIRED). Two independent state machines.</td>
              <td>Day 34</td>
            </tr>
            <tr>
              <td>CAS / Optimistic Lock (Day 62, Day 64)</td>
              <td><C>DigitalLicense.activeBorrows.compareAndSet(current, current+1)</C> — the CAS loop atomically claims a license slot without blocking.</td>
              <td>Day 62, Day 64</td>
            </tr>
            <tr>
              <td>Observer (Day 32)</td>
              <td>"Your hold is ready" notification fires when <C>fulfillNextReservation()</C> transitions a Reservation to READY. Member is the observer; ReservationService is the publisher.</td>
              <td>Day 32</td>
            </tr>
            <tr>
              <td>Strategy (Day 31)</td>
              <td>Fine rate policy (flat rate vs tiered vs no-fine for faculty) is a Strategy slot. Search index strategy (DB LIKE vs inverted index vs Elasticsearch) is another Strategy seam.</td>
              <td>Day 31</td>
            </tr>
            <tr>
              <td>Value Object (Day 20)</td>
              <td><C>Money</C> for fine amounts and fee balances — BigDecimal + Currency, immutable, equals/hashCode by value. Two Money("5.00","INR") objects are equal.</td>
              <td>Day 20</td>
            </tr>
            <tr>
              <td>Queue / Iterator (Day 37)</td>
              <td>Reservation queue ordered by <C>reservedAt</C> — FIFO. <C>findNextWaiting(bookId)</C> returns the earliest-queued WAITING reservation. Backed by a sorted query or a per-book queue data structure.</td>
              <td>Day 37</td>
            </tr>
          </tbody>
        </table>
        <Note><strong>You do not need to name every pattern at once.</strong> In a real interview, name one
          when you use it: "I'll use an Observer here to notify the member" or "this is a CAS loop, same idea
          as Day 62." Fluent pattern vocabulary is more impressive than a rehearsed list at the end.</Note>
      </section>

      {/* s12: traps */}
      <section id="s12">
        <div className="sec-label">Section 12</div>
        <h2>Common traps in this specific problem</h2>
        <Warn><strong>Trap 1 — synchronized scope too broad.</strong> Putting <C>validateMemberEligible()</C>
          inside the <C>synchronized (bookId.intern())</C> block means one thread holds the book-level lock
          while doing multiple DB queries. Every other thread borrowing that book blocks waiting. Validate
          before acquiring the lock; only <C>findAvailableCopy() + setStatus()</C> need the lock.</Warn>
        <Warn><strong>Trap 2 — AtomicInteger decrement without a floor.</strong> If <C>returnBook()</C> calls
          <C>activeBorrows().decrementAndGet()</C> unconditionally, a bug elsewhere (double-return of the same
          record) could push the count below zero. Guard with <C>getAndUpdate(n -&gt; Math.max(0, n-1))</C>
          or validate that the BorrowRecord is in ACTIVE state before decrementing.</Warn>
        <Warn><strong>Trap 3 — fine stored as double, not BigDecimal.</strong> Fine = 12 days × ₹5.00 = ₹60.00.
          That works with doubles today. But add a 12.5% tax and you get floating-point drift in production.
          Start with <C>BigDecimal</C> from day one. The rule: any field that goes on an invoice or bank
          statement must be <C>BigDecimal</C>.</Warn>
        <Warn><strong>Trap 4 — reservations that never expire (leaked holds).</strong> When a Reservation is
          moved to READY, a <C>holdExpiresAt</C> timestamp must be set. Without expiry, a member who never
          picks up the book permanently blocks everyone else in the queue. The scheduled sweeper in
          <C>expireStaleHolds()</C> is not optional — it is the only cleanup mechanism for abandoned holds.</Warn>
        <Warn><strong>Trap 5 — O(N) book search with no index.</strong> Scanning all books for
          <C>title.contains(query)</C> works for 100 books. It fails at 1,000,000. Mention that search by
          title/author/genre requires an inverted index (or a dedicated search service). You do not need to
          design the index — just say "I'd put a search index in front of this; the borrow logic stays
          unchanged." That one sentence distinguishes a senior candidate.</Warn>
        <Warn><strong>Trap 6 — letting a member borrow while fines are unpaid.</strong> <C>validateMemberEligible()</C>
          must check fine balance before BOTH <C>borrowPhysical()</C> and <C>borrowDigital()</C>. Candidates
          who add the check to only one path leave a loophole: the member pays no fine and borrows digitally
          instead.</Warn>
      </section>

      {/* rubric */}
      <section id="sRubric">
        <div className="sec-label">Section 13 · Interactive</div>
        <h2>Your rubric — score the attempt</h2>
        <p>Immediately after pens-down — while the memory is still fresh — check off only what you
          ACTUALLY produced during the 45 minutes. Not what you planned to do or knew you should have done.</p>
        <RubricScorecard />
        <Code html={`  THE REVIEW LOOP — the rep is not over at pens-down

  mock (45 min) ──▶ rubric score ──▶ write your TOP-2 gaps
                                           │
      ▲                                    ▼
      └── homework (implement it) ◀── restudy the gap days
           then re-run this mock            (type the code; don't just reread)

  Verdict bands:  13–15 ✅  hire signal
                   9–12 🟡  strong maybe — one targeted rep fixes the gaps
                   5– 8 🔴  needs work — implement the homework, then re-run
                    &lt; 5 🔴  not ready — revisit Day 62 + Day 20 + Day 34 first`} />
        <Warn><strong>The rubric standard is unforgiving on purpose.</strong> "I knew I should use BigDecimal"
          is unchecked. "I said 'CAS loop' but did not write the while-true structure" is unchecked.
          The bar is: an interviewer watching your screen would have seen it written or heard you say it.</Warn>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Interview corner: 6 follow-up questions they actually ask</h2>
        <p>Answer each in your head before revealing. These come at minute 38 when the skeleton is on the board.</p>
        <Reveal summary='Q: "How would you add book renewals?"'>
          <p>A renewal is a borrow extension. The simplest model: add a <C>renewedAt: Instant</C>
            field and an <C>extensionCount: int</C> to <C>BorrowRecord</C>. On
            <C>renewBook(borrowRecordId)</C>: (1) check <C>extensionCount &lt; maxRenewals</C>,
            (2) check no reservation is WAITING for this book (if so, renewal is denied — the queue
            member is waiting), (3) push <C>dueAt</C> forward by the loan period, (4) increment
            <C>extensionCount</C>. The "no renewal if someone is waiting" rule is the design-shaping
            insight: <C>reservationRepo.countWaiting(bookId) == 0</C> is the guard.</p>
        </Reveal>
        <Reveal summary='Q: "How would you handle inter-library loans (ILL)?"'>
          <p>ILL is a new entity: <C>ILLRequest(memberId, isbn, status: PENDING/SOURCED/ARRIVED/FULFILLED)</C>.
            When a member searches and no copy is found, they can raise an ILL request. A librarian
            sources the book from a partner library. When it arrives, a <C>PhysicalCopy</C> is created
            with a special <C>locationCode</C> ("ILL-HOLD") and the ILL request is fulfilled via the
            normal reservation path. The borrow logic is unchanged — only the copy sourcing is new.
            This is the Open/Closed Principle (Day 12): you extend the system without touching the
            core borrow flow.</p>
        </Reveal>
        <Reveal summary='Q: "What if a member damages a book — how is the fine different?"'>
          <p>A damage fine is a one-time replacement cost, not a per-day rate. Model it separately:
            <C>DamageFine(memberId, copyId, replacementCost: Money, reported: Instant)</C>.
            The copy transitions to <C>CopyStatus.LOST</C> (or <C>MAINTENANCE</C>). The damage fine
            is added to the member's <C>fineBalance</C> via the same <C>memberRepo.addFine()</C> method
            — same blocking effect, different amount. The copy is removed from the available pool until
            replaced or repaired. A new <C>PhysicalCopy</C> record is created when a replacement arrives.</p>
        </Reveal>
        <Reveal summary='Q: "Two members click Return on the same copy simultaneously — what happens?"'>
          <p>This is a double-return race. The guard: <C>BorrowRecord.returnedAt</C> starts as null.
            <C>returnBook()</C> should use a conditional update: <code>UPDATE borrow_records SET returned_at = now() WHERE id = ? AND returned_at IS NULL</code>.
            If <C>rowsAffected == 0</C>, someone already returned it — throw <C>AlreadyReturnedException</C>.
            The application-layer equivalent: use a <C>synchronized (borrowRecordId.intern())</C> block
            or an optimistic lock (version column on BorrowRecord, Day 64). Never decrement the digital
            license counter twice for the same borrow record.</p>
        </Reveal>
        <Reveal summary='Q: "How would you design the search index for title/author/genre?"'>
          <p>Three tiers, pick one and defend it: (1) <strong>DB LIKE query</strong> — works up to ~100k
            books, simplest to implement. (2) <strong>Full-text index</strong> (Postgres <C>tsvector</C> or
            MySQL <C>FULLTEXT</C>) — handles millions of records, built into the DB, searches title + author
            + genre in one query. (3) <strong>External search service</strong> (Elasticsearch / Solr) — for
            faceted search (filter by genre AND author), relevance ranking, and typo-tolerance at scale.
            The borrow logic is entirely unchanged across all three — search is a separate read path behind
            a <C>BookSearchService</C> interface (DIP, Day 15). Say: "I'd use option 2 for now and migrate
            to Elasticsearch if we hit performance limits."</p>
        </Reveal>
        <Reveal summary='Q: "How do membership tiers (student / faculty / public) affect the design?"'>
          <p>Three things change per tier: (1) <strong>Loan period</strong> — faculty get 28 days, students
            14, public 7. Encapsulate as <C>MemberTier.loanDays()</C> — a method on the enum (Day 19). The
            borrow flow calls <C>member.tier().loanDays()</C> instead of a hardcoded constant. (2) <strong>Borrow
            limit</strong> — faculty might get 10 physical + 5 digital; public gets 3 + 3. Same pattern:
            <C>MemberTier.physicalLimit()</C> and <C>MemberTier.digitalLimit()</C>. (3) <strong>Fine waiver</strong>
            — faculty fines might be waived up to a threshold. Encapsulate as a <C>FinePolicy</C> Strategy
            (Day 31) that takes a MemberTier and returns the effective fine amount. All three are Strategy/enum-method
            seams — zero changes to the core borrow flow.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="sQuiz">
        <div className="sec-label">Section 14 · Test yourself</div>
        <h2>Quiz — 8 questions</h2>
        <p>Click an answer. Read the explanation even when you are right — the "why you might be wrong"
          notes are where the real learning is.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* footer */}
      <div className="footer">
        <strong>Day 77 complete?</strong> Homework: implement the Digital Library System in Java from scratch.
        Create: <C>Book.java</C>, <C>PhysicalCopy.java</C> (with <C>CopyStatus</C> enum),
        <C>DigitalLicense.java</C> (with <C>AtomicInteger activeBorrows</C>),
        <C>BorrowRecord.java</C>, <C>Reservation.java</C> (with <C>ReservationStatus</C> enum),
        <C>LibraryService.java</C> with all five methods: <C>validateMemberEligible()</C>,
        <C>borrowPhysical()</C> (synchronized), <C>borrowDigital()</C> (CAS loop),
        <C>returnBook()</C> (BigDecimal fine + <C>fulfillNextReservation()</C>),
        <C>reservePhysical()</C>. Drive the happy path from a <C>main()</C> method:
        member borrows physical + digital, returns overdue physical (fine computed), another member
        reserves, original member returns second copy, reservation becomes READY.
        <br /><br />
        Next: <strong>Day 78 — Full Course Recap</strong>: a dense, structured review of all four months —
        OOP foundations, SOLID, design patterns (GoF), classic LLD problems, and advanced concurrency.
        The final revision session before mock rounds.
      </div>
    </div>
  )
}
