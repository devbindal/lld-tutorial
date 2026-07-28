import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   SLOT DATA — shared by demos
   ============================================================ */
const SLOT_RANK = { S: 1, M: 2, L: 3 }
const PKG_LABEL = { S: 'Small', M: 'Medium', L: 'Large' }

const INIT_SLOTS = [
  { id: 'S1', size: 'S', state: 'AVAILABLE', pkg: null },
  { id: 'S2', size: 'S', state: 'AVAILABLE', pkg: null },
  { id: 'S3', size: 'S', state: 'AVAILABLE', pkg: null },
  { id: 'M1', size: 'M', state: 'AVAILABLE', pkg: null },
  { id: 'M2', size: 'M', state: 'AVAILABLE', pkg: null },
  { id: 'M3', size: 'M', state: 'AVAILABLE', pkg: null },
  { id: 'L1', size: 'L', state: 'AVAILABLE', pkg: null },
  { id: 'L2', size: 'L', state: 'AVAILABLE', pkg: null },
  { id: 'L3', size: 'L', state: 'AVAILABLE', pkg: null },
]

let pkgCounter = 1

/* ============================================================
   Demo 1 — LockerGridDemo
   ============================================================ */
function LockerGridDemo() {
  const [slots, setSlots] = useState(INIT_SLOTS)
  const [pkgSize, setPkgSize] = useState('S')
  const [log, setLog] = useState([])
  const [lastAssigned, setLastAssigned] = useState(null)

  function store() {
    const id = `PKG-${pkgCounter++}`
    const eligible = slots.filter(
      s => s.state === 'AVAILABLE' && SLOT_RANK[s.size] >= SLOT_RANK[pkgSize]
    )
    const logLines = [`Package ${id} (${PKG_LABEL[pkgSize]}) — greedy search:`]
    if (eligible.length === 0) {
      logLines.push(`  No ${PKG_LABEL[pkgSize]} (or larger) slot available!`)
      setLog(logLines)
      setLastAssigned(null)
      return
    }
    // Sort by size rank ASC → pick smallest that fits
    const sorted = [...eligible].sort((a, b) => SLOT_RANK[a.size] - SLOT_RANK[b.size])
    logLines.push(`  Eligible slots (fits >= ${pkgSize}):`)
    sorted.forEach(s => logLines.push(`    ${s.id} (${PKG_LABEL[s.size]}) ← checking`))
    const chosen = sorted[0]
    logLines.push(`  → Smallest fit = ${chosen.id} (${PKG_LABEL[chosen.size]}) — ASSIGNED ✅`)
    setLog(logLines)
    setLastAssigned(chosen.id)
    setSlots(prev => prev.map(s =>
      s.id === chosen.id ? { ...s, state: 'OCCUPIED', pkg: id } : s
    ))
  }

  function reset() {
    setSlots(INIT_SLOTS)
    setLog([])
    setLastAssigned(null)
    pkgCounter = 1
  }

  const ROW_COLOR = { S: '#E3F2FD', M: '#E8F5E9', L: '#FFF3E0' }
  const ROW_BORDER = { S: '#90CAF9', M: '#81C784', L: '#FFCC80' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · greedy size assignment — pick a package size and store it</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Grid */}
        <div style={{ minWidth: 240 }}>
          {['S', 'M', 'L'].map(sz => (
            <div key={sz} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: '#7c8aa5', marginBottom: 4 }}>
                {PKG_LABEL[sz].toUpperCase()} row
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {slots.filter(s => s.size === sz).map(s => {
                  const isChosen = s.id === lastAssigned
                  const bg = s.state === 'OCCUPIED'
                    ? (isChosen ? '#A5D6A7' : '#ddd')
                    : ROW_COLOR[sz]
                  const border = isChosen ? '2px solid #2a7a3a'
                    : s.state === 'OCCUPIED' ? '2px solid #aaa'
                    : `2px solid ${ROW_BORDER[sz]}`
                  return (
                    <div key={s.id} style={{
                      width: 58, height: 58, borderRadius: 6, border, background: bg,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', fontSize: 10, fontFamily: 'IBM Plex Mono'
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{s.id}</div>
                      {s.state === 'OCCUPIED'
                        ? <div style={{ fontSize: 9, color: '#555', textAlign: 'center', marginTop: 2 }}>{s.pkg}</div>
                        : <div style={{ color: '#2a7a3a', fontSize: 9, marginTop: 2 }}>FREE</div>
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#E3F2FD', border: '1px solid #90CAF9' }} /> Small slots
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#E8F5E9', border: '1px solid #81C784' }} /> Medium slots
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#FFF3E0', border: '1px solid #FFCC80' }} /> Large slots
            </div>
          </div>
        </div>
        {/* Controls + log */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Package size to store:</div>
          <div className="modbtns" style={{ marginBottom: 12 }}>
            {['S', 'M', 'L'].map(sz => (
              <button key={sz} className={pkgSize === sz ? 'on' : ''} onClick={() => setPkgSize(sz)}>
                {PKG_LABEL[sz]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="act" onClick={store}>Store package</button>
            <button className="act ghost" onClick={reset}>Reset</button>
          </div>
          {log.length > 0 && (
            <div style={{ background: '#f5f5f2', borderRadius: 6, padding: 10 }}>
              {log.map((l, i) => (
                <div key={i} style={{
                  fontFamily: 'IBM Plex Mono', fontSize: 10.5, marginBottom: 2,
                  color: l.includes('ASSIGNED') ? '#2a7a3a' : l.includes('No') ? '#c00' : '#444'
                }}>{l}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Good>Notice: a Medium package goes into a Medium slot, not a Large one — the greedy rule always picks the <b>smallest slot that fits</b>. A Large package falls through to a Large slot. Small packages never go into Large slots unless no Small or Medium is free.</Good>
    </div>
  )
}

/* ============================================================
   Demo 2 — ExpiryDemo
   ============================================================ */
const INIT_RESERVATIONS = [
  { id: 'RES-001', code: 'A7X2', slot: 'M2', pkg: 'PKG-101', createdDay: 0, expiresAfter: 3, recipient: 'alice@mail.com' },
  { id: 'RES-002', code: 'Q9KL', slot: 'S1', pkg: 'PKG-102', createdDay: 0, expiresAfter: 3, recipient: 'bob@mail.com' },
  { id: 'RES-003', code: 'P3NT', slot: 'L1', pkg: 'PKG-103', createdDay: 1, expiresAfter: 3, recipient: 'carol@mail.com' },
  { id: 'RES-004', code: 'Z5WR', slot: 'S2', pkg: 'PKG-104', createdDay: 2, expiresAfter: 3, recipient: 'dave@mail.com' },
]

function ExpiryDemo() {
  const [day, setDay] = useState(0)
  const [freed, setFreed] = useState([])

  function advance() {
    const newDay = day + 1
    setDay(newDay)
    const nowExpired = INIT_RESERVATIONS.filter(
      r => !freed.includes(r.id) && newDay >= r.createdDay + r.expiresAfter
    )
    if (nowExpired.length > 0) {
      setFreed(f => [...f, ...nowExpired.map(r => r.id)])
    }
  }

  function reset() { setDay(0); setFreed([]) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · fast-forward time and watch reservations expire — sweeper frees the slots</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22 }}>Day {day}</div>
        <button className="act" onClick={advance} disabled={day >= 6}>Fast-forward +1 day</button>
        <button className="act ghost" onClick={reset}>Reset</button>
        <div style={{ fontSize: 12, color: '#7c8aa5' }}>Reservations expire after 3 days</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {INIT_RESERVATIONS.map(r => {
          const isExpired = freed.includes(r.id)
          const daysLeft = Math.max(0, (r.createdDay + r.expiresAfter) - day)
          const pct = isExpired ? 0 : Math.round((daysLeft / r.expiresAfter) * 100)
          const barColor = pct > 50 ? '#81C784' : pct > 20 ? '#FFB74D' : '#EF9A9A'
          return (
            <div key={r.id} style={{
              borderRadius: 8, border: `2px solid ${isExpired ? '#ddd' : '#ccc'}`,
              background: isExpired ? '#f8f8f8' : '#fff', padding: 12,
              opacity: isExpired ? 0.65 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 13 }}>{r.code}</span>
                  <span style={{ fontSize: 11, color: '#7c8aa5', marginLeft: 8 }}>{r.id} · slot {r.slot} · {r.pkg}</span>
                </div>
                <div style={{
                  fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700,
                  color: isExpired ? '#c00' : '#2a7a3a',
                  background: isExpired ? '#FFE0E0' : '#E8F5E9',
                  borderRadius: 4, padding: '2px 8px'
                }}>
                  {isExpired ? '⛔ EXPIRED — slot freed' : `✅ ACTIVE · ${daysLeft}d left`}
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: '#666', marginBottom: 6 }}>
                Recipient: {r.recipient} · Created day {r.createdDay} · Expires day {r.createdDay + r.expiresAfter}
              </div>
              {!isExpired && (
                <div style={{ background: '#eee', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'all 0.3s' }} />
                </div>
              )}
              {isExpired && (
                <div style={{ fontSize: 11, color: '#c00', fontStyle: 'italic' }}>
                  Sweeper ran at Day {r.createdDay + r.expiresAfter} — slot {r.slot} is AVAILABLE again
                </div>
              )}
            </div>
          )
        })}
      </div>
      <Note>The sweeper is a background task that runs periodically (e.g., every hour). It scans all reservations, finds ones where <C>Instant.now().isAfter(expiresAt)</C>, and calls <C>slot.setState(AVAILABLE)</C>. Without it, expired reservations would silently hold slots forever.</Note>
    </div>
  )
}

/* ============================================================
   Demo 3 — PickupDemo
   ============================================================ */
const PICKUP_RESERVATIONS = [
  { id: 'RES-A', code: 'TREE42', slot: 'M1', pkg: 'PKG-201', expired: false, recipient: 'eve@mail.com' },
  { id: 'RES-B', code: 'MOON88', slot: 'S3', pkg: 'PKG-202', expired: true,  recipient: 'frank@mail.com' },
  { id: 'RES-C', code: 'STAR55', slot: 'L2', pkg: 'PKG-203', expired: false, recipient: 'grace@mail.com' },
]

function PickupDemo() {
  const [input, setInput] = useState('')
  const [reservations, setReservations] = useState(PICKUP_RESERVATIONS)
  const [result, setResult] = useState(null)

  function retrieve() {
    const code = input.trim().toUpperCase()
    const res = reservations.find(r => r.code === code)
    if (!res) {
      setResult({ ok: false, msg: `Invalid code "${code}". No matching reservation found.`, hint: 'Try: TREE42 (active), MOON88 (expired), or STAR55 (active)' })
      return
    }
    if (res.expired) {
      setResult({ ok: false, msg: `Code "${code}" is valid but the reservation has EXPIRED. Package was returned to sender.`, hint: 'The slot was already freed by the expiry sweeper.' })
      return
    }
    // Check if already collected
    if (res.collected) {
      setResult({ ok: false, msg: `Code "${code}" was already used. Package was collected earlier.`, hint: 'Each code works exactly once.' })
      return
    }
    setReservations(prev => prev.map(r => r.code === code ? { ...r, collected: true } : r))
    setResult({ ok: true, msg: `Package ${res.pkg} retrieved from slot ${res.slot}! Slot is now AVAILABLE.`, hint: `Notifying ${res.recipient} of successful pickup.` })
  }

  function reset() {
    setReservations(PICKUP_RESERVATIONS)
    setInput('')
    setResult(null)
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · enter a pickup code to retrieve a package</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Enter pickup code:</div>
          <input
            className="txt"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && retrieve()}
            placeholder="e.g. TREE42"
            style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, width: 140, letterSpacing: 2 }}
          />
        </div>
        <button className="act" onClick={retrieve}>Retrieve package</button>
        <button className="act ghost" onClick={reset}>Reset</button>
      </div>
      {/* Reservation cards */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {reservations.map(r => {
          const status = r.collected ? 'COLLECTED' : r.expired ? 'EXPIRED' : 'ACTIVE'
          const bg = r.collected ? '#E8F5E9' : r.expired ? '#FFEBEE' : '#E3F2FD'
          const border = r.collected ? '#81C784' : r.expired ? '#EF9A9A' : '#90CAF9'
          return (
            <div key={r.id} style={{ borderRadius: 7, border: `2px solid ${border}`, background: bg, padding: 10, minWidth: 160 }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 15, letterSpacing: 2, marginBottom: 4 }}>{r.code}</div>
              <div style={{ fontSize: 11, color: '#555' }}>Slot: {r.slot} · {r.pkg}</div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>{r.recipient}</div>
              <div style={{
                marginTop: 6, fontSize: 10, fontWeight: 700,
                color: r.collected ? '#2a7a3a' : r.expired ? '#c00' : '#1565C0'
              }}>{status}</div>
            </div>
          )
        })}
      </div>
      {result && (
        <div style={{
          borderRadius: 7, padding: 12, marginTop: 4,
          background: result.ok ? '#E8F5E9' : '#FFEBEE',
          border: `2px solid ${result.ok ? '#81C784' : '#EF9A9A'}`
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            {result.ok ? '✅ ' : '❌ '}{result.msg}
          </div>
          <div style={{ fontSize: 11.5, color: '#666' }}>{result.hint}</div>
        </div>
      )}
      <Warn>Always check expiry <b>before</b> freeing the package. A customer who arrives a few minutes after expiry would get a strange "reservation does not exist" error if you delete records eagerly — instead, keep the record but mark it EXPIRED, then return a clear message.</Warn>
    </div>
  )
}

/* ============================================================
   QUIZ DATA
   ============================================================ */
const QUESTIONS = [
  {
    q: 'A Medium package arrives. Slots available: S1 (Small), M2 (Medium), L1 (Large). Which slot does the greedy algorithm pick?',
    o: ['L1 — largest slot to be safe', 'S1 — smallest slot overall', 'M2 — smallest slot that fits'],
    a: 2,
    e: 'Greedy picks the smallest slot whose size rank is >= the package rank. Medium fits in Medium or Large; the smallest of those is M2.',
    w: {
      0: 'Picking the largest slot wastes the most space. A Large slot reserved for a Medium package can never hold a genuinely Large package. Greedy = smallest that fits.',
      1: 'S1 is a Small slot — a Medium package does not fit in it. Size rank 2 (Medium) > rank 1 (Small), so it fails the fits() check.'
    },
    r: { id: 's4', label: 'Section 4 — Greedy size assignment' }
  },
  {
    q: 'Two couriers arrive at the same millisecond and both read slot M3 as AVAILABLE. What prevents a double-assignment?',
    o: [
      'The first courier to send an HTTP request wins because HTTP is sequential',
      'An atomic compareAndSet(AVAILABLE, OCCUPIED) — only one thread sets it; the other sees the old value and re-searches',
      'The database is single-threaded so only one write wins'
    ],
    a: 1,
    e: 'compareAndSet is an atomic operation: read + conditional write happen as one unbreakable unit. The loser sees the CAS fail and must search again for another slot.',
    w: {
      0: 'HTTP requests run concurrently on the server. There is no HTTP-level sequencing. The race happens inside the server process.',
      2: 'Databases are not single-threaded for reads — they can serve many queries simultaneously. Without a conditional update (optimistic lock or FOR UPDATE), two reads can both see AVAILABLE.'
    },
    r: { id: 's4', label: 'Section 4 — Atomic slot claim' }
  },
  {
    q: 'Why should SlotSize use an explicit int rank field instead of relying on Enum.ordinal()?',
    o: [
      'ordinal() returns the declaration order which can silently break if you reorder or insert enum constants',
      'rank fields are faster at runtime',
      'ordinal() is deprecated in Java 17+'
    ],
    a: 0,
    e: 'Enum.ordinal() is tied to source code order. If anyone inserts X_SMALL between SMALL and MEDIUM, all ranks shift and every size comparison breaks silently. An explicit rank field is stable.',
    w: {
      1: 'Performance difference between ordinal() and a field access is negligible and irrelevant here. Correctness is the concern.',
      2: 'ordinal() is not deprecated — it still exists in all Java versions. The problem is semantic fragility, not deprecation.'
    },
    r: { id: 's4', label: 'Section 4 — SlotSize enum' }
  },
  {
    q: 'A customer enters the correct pickup code but the reservation expired 2 minutes ago. What should happen?',
    o: [
      'Extend the reservation by 24 hours automatically',
      'Release the package anyway — the code is correct',
      'Return an error: reservation expired, package returned to sender'
    ],
    a: 2,
    e: 'Expiry is a hard boundary. The slot may already be re-assigned to a new package. Releasing based on an expired code could give someone else\'s package to the wrong person.',
    w: {
      0: 'Automatic extension makes business sense only if designed as a feature. It is not a safe default — the locker bank may need that slot immediately.',
      1: 'A correct code from an expired reservation is not a valid claim. The slot may have been reassigned. Releasing the package would be a security and correctness violation.'
    },
    r: { id: 's7', label: 'Section 7 — Expiry and the sweeper' }
  },
  {
    q: 'What property makes a pickup code secure and correct?',
    o: [
      'It should be a short random string, immutable after creation, and known only to the recipient',
      'It should be the package tracking number for easy lookup',
      'It should encode the slot ID so the customer knows where to go'
    ],
    a: 0,
    e: 'A pickup code is a Value Object: short, random (hard to guess), immutable (never changes after generation), and secret (only emailed to the recipient). Encoding slot info would be a security leak.',
    w: {
      1: 'Tracking numbers are known to senders, carriers, and publicly queryable. Using them as pickup codes lets anyone who sees a tracking number collect the package.',
      2: 'Encoding the slot in the code leaks location info. The customer learns their slot when they enter the code, not before — the locker display shows it after successful auth.'
    },
    r: { id: 's6', label: 'Section 6 — Pickup codes' }
  },
  {
    q: 'The greedy assignSlot() finds no eligible slot. What is the correct response?',
    o: [
      'Return an error to the courier system; notify the sender and possibly queue the package for re-attempt',
      'Wait indefinitely until a slot opens up',
      'Assign the package to the smallest available slot regardless of size — it will fit somehow'
    ],
    a: 0,
    e: 'If no slot fits, the package cannot be stored. The courier system must be told immediately so it can reroute. Silent failure (putting it in a too-small slot) would physically damage the package.',
    w: {
      1: 'Waiting indefinitely blocks the courier at the locker. The correct pattern is fail-fast: return the result immediately and let the caller decide on retry or rerouting.',
      2: 'Physical lockers have hard size limits. A large package in a small slot does not "fit somehow" — this is not software, it is reality. The package will not close.'
    },
    r: { id: 's4', label: 'Section 4 — Greedy size assignment' }
  },
  {
    q: 'Lazy expiry (check on pickup) vs. sweeper (background task) — which statement is accurate?',
    o: [
      'Lazy expiry is always better because it avoids background threads',
      'The sweeper frees slots proactively so they can be reassigned without waiting for a pickup attempt',
      'They are functionally identical — both free the slot at exactly the same time'
    ],
    a: 1,
    e: 'Lazy expiry only frees a slot when someone tries to use it. If the slot is never queried, it stays occupied forever. The sweeper runs on a schedule and frees slots even if nobody calls pickup().',
    w: {
      0: 'Lazy expiry has a serious problem: if nobody ever attempts to pick up the package, the slot is never freed. In a busy locker bank, this can exhaust all slots.',
      2: 'They free the slot at very different times. Lazy: at the moment of a pickup attempt. Sweeper: at the next scheduled scan after expiry. In practice the sweeper is much earlier if nobody queries.'
    },
    r: { id: 's7', label: 'Section 7 — Expiry and the sweeper' }
  },
  {
    q: 'Which design pattern describes the relationship between LockerBank and LockerSlot?',
    o: [
      'Strategy — LockerSlot is a pluggable algorithm used by LockerBank',
      'Composition — LockerBank owns the LockerSlot objects; they cannot exist without the bank',
      'Observer — LockerBank watches LockerSlot for state changes'
    ],
    a: 1,
    e: 'LockerBank creates and owns its LockerSlot objects. When the bank is destroyed, the slots are gone. This lifecycle ownership is the definition of Composition (strong has-a).',
    w: {
      0: 'Strategy encapsulates an interchangeable algorithm. LockerSlot is not an algorithm — it is a data-holding entity that represents a physical compartment.',
      2: 'Observer is about event notification. LockerBank does not subscribe to slot events — it directly reads and writes slot state when a store/pickup call arrives.'
    },
    r: { id: 's3', label: 'Section 3 — Entities and relationships' }
  }
]

/* ============================================================
   PAGE
   ============================================================ */
export default function Day68() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 14 · Day 68</div>
        <h1>Amazon Locker:<br />Size Matching, Codes &amp; Expiry</h1>
        <p>
          A locker bank is a parking lot with size constraints and a ticking clock.
          The two hard problems: assign the <em>smallest slot that fits</em> (greedy),
          and free slots when nobody collects in time (TTL expiry). Click every demo.
        </p>
        <div className="chips">
          {['Greedy assignment','SlotSize enum','Atomic CAS','Pickup codes','TTL / expiry','Sweeper','Composition'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 — THE PROBLEM */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The post-office cubby problem</h2>
        <p>
          Imagine a post office with a wall of cubbies in three sizes: Small, Medium, Large.
          A courier arrives with a package. Two physical constraints are absolute:
        </p>
        <ol>
          <li><strong>A package must fit.</strong> A large parcel cannot go in a small cubby.</li>
          <li><strong>One package per cubby.</strong> Two packages cannot share a slot.</li>
        </ol>
        <p>
          And one time constraint: if nobody collects the package in 3 days, the post office
          sends it back and clears the cubby for the next delivery.
        </p>
        <p>
          Amazon Locker is exactly this system — scaled to thousands of banks, millions of slots,
          and thousands of concurrent couriers. The design challenge is not the UI. It is:
        </p>
        <ul>
          <li>Which slot do you assign? (size matching)</li>
          <li>What if two couriers race for the same slot? (atomic claim)</li>
          <li>What if the customer never comes? (expiry + sweeper)</li>
        </ul>
        <Note>
          This problem shares its skeleton with two earlier days: <strong>Parking Lot (Day 41–42)</strong> — slots with categories — and
          <strong> BookMyShow seat-hold (Day 51–52)</strong> — time-limited atomic claim with an expiry sweeper.
          If those felt familiar, this will click fast.
        </Note>
      </section>

      {/* S2 — CLARIFYING QUESTIONS */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Clarifying questions (ask these in minute 1 of an interview)</h2>
        <table className="matrix" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '7px 10px' }}>Question</th>
              <th style={{ textAlign: 'left', padding: '7px 10px' }}>Assumption for today</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['One package per slot?', 'Yes. A slot holds exactly one package at a time.'],
              ['How many size tiers?', 'Three: SMALL, MEDIUM, LARGE. Ranks 1, 2, 3.'],
              ['Can a package use a larger slot if needed?', 'Yes — a Small package can go in a Medium slot if no Small is free. Greedy still picks the smallest that fits.'],
              ['How long before expiry?', '3 days (configurable per locker bank). After that the slot is freed and the package returned.'],
              ['Can the recipient change the pickup code?', 'No. The code is a Value Object — immutable after generation.'],
              ['Can a courier self-return an undeliverable package?', 'Out of scope for today. Add a RETURN slot type as a follow-up.'],
              ['Multi-bank: can a customer pick up from any bank?', 'Today: one bank. Multi-bank adds a BankLocator layer but the slot logic is identical.'],
            ].map(([q, a]) => (
              <tr key={q}>
                <td style={{ padding: '6px 10px', fontStyle: 'italic' }}>{q}</td>
                <td style={{ padding: '6px 10px' }}>{a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* S3 — ENTITIES + ASCII DIAGRAM */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Core entities and their relationships</h2>
        <p>
          Four nouns. Start here before writing a single line of logic.
        </p>
        <Code html={`<span class="cm">// Entity relationship diagram</span>

┌───────────────┐       ┌──────────────────────┐       ┌────────────────────┐
│   LockerBank  │       │      LockerSlot       │       │    Reservation     │
│───────────────│ 1  *  │──────────────────────│ 1  1  │────────────────────│
│ id            │──────▶│ id                   │◀─────▶│ id                 │
│ location      │       │ size: SlotSize        │       │ pickupCode: String │
│ slots: List   │       │ state: SlotState      │       │ slot: LockerSlot   │
└───────────────┘       │ reservationId: String │       │ pkg: Package       │
                        │ expiresAt: Instant    │       │ expiresAt: Instant │
                        └──────────────────────┘       └────────────┬───────┘
                                                                     │ wraps
                                                             ┌───────▼───────┐
                                                             │    Package    │
                                                             │───────────────│
                                                             │ trackingNumber│
                                                             │ requiredSize  │
                                                             │ recipientEmail│
                                                             └───────────────┘

<span class="cm">// Slot state machine — only two states, no complex machine needed</span>

         courier stores package           package picked up OR expiry sweeper runs
               │                                          │
   ┌───────────▼──────────────┐           ┌──────────────▼──────┐
   │       AVAILABLE          │◀──────────│      OCCUPIED        │
   └──────────────────────────┘           └─────────────────────┘`} />

        <p>
          <strong>LockerBank owns LockerSlot</strong> — this is Composition (Day 6). Slots cannot exist
          without a bank. A <strong>Reservation</strong> links one Slot to one Package for a fixed time window.
          When the reservation is fulfilled or expires, the slot returns to AVAILABLE.
        </p>
        <Code html={`<span class="cm">// SlotSize enum — rank field prevents ordinal() fragility</span>
<span class="kw">public enum</span> SlotSize {
    SMALL(<span class="num">1</span>), MEDIUM(<span class="num">2</span>), LARGE(<span class="num">3</span>);   <span class="cm">// explicit rank, not ordinal()</span>

    <span class="kw">public final int</span> rank;

    SlotSize(<span class="kw">int</span> rank) { <span class="kw">this</span>.rank = rank; }

    <span class="cm">// Can this slot hold a package of the given size?</span>
    <span class="kw">public boolean</span> fits(SlotSize pkgSize) {
        <span class="kw">return this</span>.rank &gt;= pkgSize.rank; <span class="cm">// MEDIUM fits SMALL or MEDIUM packages</span>
    }
}

<span class="cm">// SlotState — simple two-state enum</span>
<span class="kw">public enum</span> SlotState { AVAILABLE, OCCUPIED }

<span class="cm">// LockerSlot — one physical compartment</span>
<span class="kw">public class</span> LockerSlot {
    <span class="kw">private final</span> String id;
    <span class="kw">private final</span> SlotSize size;
    <span class="kw">private</span> SlotState state = SlotState.AVAILABLE; <span class="cm">// starts free</span>
    <span class="kw">private</span> String reservationId;                 <span class="cm">// null when free</span>
    <span class="kw">private</span> Instant expiresAt;                    <span class="cm">// set when occupied</span>
}`} />
      </section>

      {/* S4 — GREEDY ALGORITHM */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Size matching — the greedy algorithm + atomic claim</h2>
        <p>
          The greedy rule is simple: from all available slots that fit the package,
          pick the one with the <em>lowest size rank</em>. This wastes the least space.
          A Medium package in a Large slot blocks a future Large package — avoid that.
        </p>
        <Code html={`<span class="cm">// Greedy assignSlot — find the smallest available slot that fits</span>
<span class="kw">public</span> Optional&lt;LockerSlot&gt; assignSlot(SlotSize pkgSize) {
    <span class="kw">return</span> slots.stream()
        .filter(s -&gt; s.getState() == SlotState.AVAILABLE)  <span class="cm">// only free slots</span>
        .filter(s -&gt; s.getSize().fits(pkgSize))             <span class="cm">// size must fit</span>
        .min(Comparator.comparingInt(s -&gt; s.getSize().rank)) <span class="cm">// smallest rank first</span>
        <span class="cm">// If no slot fits, Optional.empty() is returned — caller handles failure</span>
}

<span class="cm">// Atomic claim — prevent two couriers from taking the same slot</span>
<span class="kw">public synchronized</span> Reservation store(Package pkg) {
    LockerSlot slot = assignSlot(pkg.getRequiredSize())
        .orElseThrow(() -&gt; <span class="kw">new</span> NoSlotAvailableException(pkg.getRequiredSize()));

    <span class="cm">// Compare-and-set: only succeed if the slot is still AVAILABLE</span>
    <span class="kw">if</span> (!slot.tryOccupy()) {              <span class="cm">// CAS — another courier could have just claimed it</span>
        <span class="kw">return</span> store(pkg);                  <span class="cm">// retry: find the next available slot</span>
    }

    <span class="kw">var</span> reservation = <span class="kw">new</span> Reservation(
        generateId(),
        generatePickupCode(),               <span class="cm">// 6-char random alphanumeric</span>
        slot, pkg,
        Instant.now().plus(<span class="num">3</span>, ChronoUnit.DAYS) <span class="cm">// expires in 3 days</span>
    );
    reservationsByCode.put(reservation.getPickupCode(), reservation);
    <span class="kw">return</span> reservation;                   <span class="cm">// caller emails the code to recipient</span>
}

<span class="cm">// Slot's atomic occupy method</span>
<span class="kw">public synchronized boolean</span> tryOccupy() {
    <span class="kw">if</span> (state != SlotState.AVAILABLE) <span class="kw">return false</span>; <span class="cm">// someone else got here first</span>
    state = SlotState.OCCUPIED;                        <span class="cm">// atomically claim it</span>
    <span class="kw">return true</span>;
}`} />
        <Warn>
          The pattern <C>if (slot.isAvailable()) slot.occupy()</C> is a check-then-act race — the slot
          can change between the check and the occupy (Day 21, Day 51). Use <C>tryOccupy()</C> which
          checks AND sets in one synchronized method. In a database, this is a conditional UPDATE with
          rows-affected check.
        </Warn>
      </section>

      {/* S5 — DEMO 1 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>Play: greedy locker assignment</h2>
        <p>
          Pick a package size (Small, Medium, or Large) and click <strong>Store package</strong>.
          Watch the greedy algorithm log as it filters and picks the smallest fitting slot.
          Try storing Large packages until the Large row is full, then notice Medium can still accept Small.
        </p>
        <LockerGridDemo />
      </section>

      {/* S6 — PICKUP CODES */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Reservations and pickup codes</h2>
        <p>
          A <strong>Reservation</strong> is the bridge between a slot and a package.
          It is created atomically when a package is stored, and destroyed (logically)
          when the package is collected or the time expires.
        </p>
        <p>
          The <strong>pickup code</strong> is a Value Object (Day 20). It has four properties:
        </p>
        <ul>
          <li><strong>Random</strong> — 6 alphanumeric characters from a secure random source. Hard to guess.</li>
          <li><strong>Immutable</strong> — never changes after creation. If you lose it, you call support.</li>
          <li><strong>Secret</strong> — emailed only to the recipient. Not derivable from tracking number or slot ID.</li>
          <li><strong>Single-use</strong> — once used to collect a package, it is invalidated.</li>
        </ul>
        <Code html={`<span class="cm">// Reservation — immutable Value Object after creation</span>
<span class="kw">public class</span> Reservation {
    <span class="kw">private final</span> String id;
    <span class="kw">private final</span> String pickupCode;    <span class="cm">// e.g. "X7K2MQ" — random, secret</span>
    <span class="kw">private final</span> LockerSlot slot;
    <span class="kw">private final</span> Package pkg;
    <span class="kw">private final</span> Instant createdAt;
    <span class="kw">private final</span> Instant expiresAt;   <span class="cm">// = createdAt + 3 days</span>

    <span class="cm">// Check if the customer is too late</span>
    <span class="kw">public boolean</span> isExpired() {
        <span class="kw">return</span> Instant.now().isAfter(expiresAt); <span class="cm">// compare against wall clock</span>
    }
}

<span class="cm">// Pickup flow</span>
<span class="kw">public</span> Package pickup(String code) {
    Reservation res = reservationsByCode.get(code);     <span class="cm">// O(1) map lookup</span>
    <span class="kw">if</span> (res == <span class="kw">null</span>)   <span class="kw">throw new</span> InvalidCodeException(code);    <span class="cm">// wrong code</span>
    <span class="kw">if</span> (res.isExpired()) <span class="kw">throw new</span> ReservationExpiredException(code); <span class="cm">// too late</span>

    res.getSlot().free();                               <span class="cm">// mark slot AVAILABLE again</span>
    reservationsByCode.remove(code);                    <span class="cm">// invalidate the code</span>
    <span class="kw">return</span> res.getPkg();                              <span class="cm">// hand over the package</span>
}`} />
        <Good>
          Map the pickup code to the Reservation, not to the slot. The customer should not know which
          slot their package is in before they authenticate. The locker display reveals it only after
          a valid code is entered.
        </Good>
        <Reveal summary="Why not use the tracking number as the pickup code?">
          <p>
            Tracking numbers are public. They appear on shipping labels, confirmation emails,
            and carrier tracking websites. Anyone who intercepts a tracking number could walk
            up to the locker and claim the package. A separate short random code, sent only
            to the verified recipient email, is the security boundary.
          </p>
        </Reveal>
      </section>

      {/* S7 — EXPIRY + SWEEPER */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Expiry — TTL and the sweeper</h2>
        <p>
          Every reservation has a TTL (time-to-live). After that, the slot must be freed
          so the next delivery can use it. There are two strategies:
        </p>
        <table className="matrix" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '7px 10px' }}>Strategy</th>
              <th style={{ textAlign: 'left', padding: '7px 10px' }}>How it works</th>
              <th style={{ textAlign: 'left', padding: '7px 10px' }}>Problem</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Lazy expiry', 'Check isExpired() only when pickup() is called', 'If nobody ever calls pickup, the slot is never freed. Uncollected packages clog the bank.'],
              ['Sweeper (background task)', 'A scheduled job scans all reservations every hour and frees expired ones', 'Adds complexity; there is a gap between expiry time and sweep time (at most 1 sweep interval).'],
              ['Both together (best)', 'Sweeper frees slots proactively; pickup() also checks so no slot is re-used while still active', 'Tiny slot-freed-but-not-swept gap is acceptable; defense-in-depth.'],
            ].map(([s, h, p]) => (
              <tr key={s}>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{s}</td>
                <td style={{ padding: '6px 10px' }}>{h}</td>
                <td style={{ padding: '6px 10px', color: '#c00', fontSize: 12 }}>{p}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Code html={`<span class="cm">// HoldExpirySweeper — runs every hour via a ScheduledExecutorService</span>
<span class="kw">public class</span> ExpirySweeperTask <span class="kw">implements</span> Runnable {
    <span class="kw">private final</span> LockerBank bank;
    <span class="kw">private final</span> Clock clock;         <span class="cm">// injected — testable with fake clock</span>

    @Override
    <span class="kw">public void</span> run() {
        bank.getReservations().values().stream()
            .filter(r -&gt; clock.instant().isAfter(r.getExpiresAt())) <span class="cm">// past deadline</span>
            .forEach(r -&gt; {
                r.getSlot().free();                                  <span class="cm">// mark AVAILABLE</span>
                bank.getReservations().remove(r.getPickupCode());    <span class="cm">// drop the record</span>
                notifySender(r.getPkg(), <span class="str">"Return: package uncollected"</span>); <span class="cm">// alert</span>
            });
    }
}

<span class="cm">// Composition root — wire the sweeper to run every hour</span>
ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
scheduler.scheduleAtFixedRate(
    <span class="kw">new</span> ExpirySweeperTask(bank, Clock.systemUTC()),
    <span class="num">0</span>, <span class="num">1</span>, TimeUnit.HOURS     <span class="cm">// initial delay = 0, period = 1 hour</span>
);`} />
        <Note>
          The injected <C>Clock</C> is the same pattern used in BookMyShow Day 52.
          In tests, pass a <C>Clock.fixed()</C> to control time exactly. Never call
          <C>Instant.now()</C> or <C>new Date()</C> directly inside a class — it makes
          time-sensitive logic impossible to test.
        </Note>
        <Reveal summary="What is a LEASE? (Day 64 connection)">
          <p>
            A LEASE is an atomic claim with a TTL. The seat-hold in BookMyShow is a lease.
            The locker reservation is a lease. In Redis, <C>SET slot:M3 PKG-101 NX EX 259200</C>
            does the same thing: atomically set a key (NX = only if not exists) with a 3-day
            expiry (EX 259200 seconds). The key auto-expires — no sweeper needed at the Redis layer.
          </p>
        </Reveal>
      </section>

      {/* S8 — DEMO 2 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>Play: watch reservations expire</h2>
        <p>
          Click <strong>Fast-forward +1 day</strong> to advance the fake clock.
          Reservations created on Day 0 expire on Day 3. Watch the progress bars drain
          and slots get freed as the sweeper runs.
        </p>
        <ExpiryDemo />
      </section>

      {/* S9 — DEMO 3 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>Play: pick up a package</h2>
        <p>
          Three reservations are shown: two active, one already expired.
          Try entering each code. Notice: correct code on an expired reservation still fails.
        </p>
        <PickupDemo />
      </section>

      {/* S10 — COMMON TRAPS */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Common traps and mistakes</h2>
        <Warn>
          <strong>Trap 1 — String comparison for size.</strong> Writing <C>slot.size.equals("MEDIUM")</C>
          instead of comparing enum ranks. String comparison breaks the moment someone renames an enum constant.
          Always use the rank field: <C>slot.size.rank &gt;= pkg.size.rank</C>.
        </Warn>
        <Warn>
          <strong>Trap 2 — No atomic slot claim.</strong> Reading a slot as AVAILABLE, then setting it
          occupied in a separate step. Two couriers can both read AVAILABLE. Use <C>synchronized tryOccupy()</C>
          or a conditional UPDATE in SQL. This is the classic check-then-act race (Day 21).
        </Warn>
        <Warn>
          <strong>Trap 3 — Not checking expiry on pickup.</strong> Calling <C>reservationsByCode.get(code)</C>
          and handing over the package without calling <C>isExpired()</C>. The slot may have been reassigned
          to a new package. Always check expiry before releasing.
        </Warn>
        <Warn>
          <strong>Trap 4 — Mutable pickup code.</strong> Allowing the recipient to "reset" their pickup
          code via a support API. The code must be immutable after generation. If it is lost, issue a
          new Reservation with a new code — don't mutate the existing one.
        </Warn>
        <Warn>
          <strong>Trap 5 — Not snapshotting the slot at reservation time.</strong> Storing only the slot ID
          in the Reservation and looking it up fresh at pickup time. If the slot object is replaced, you
          lose the history. Store a direct reference to the slot object at reservation creation.
        </Warn>
        <Warn>
          <strong>Trap 6 — Silently allowing an oversized package.</strong> If <C>assignSlot()</C> returns
          empty, some code falls through and stores the package in slot <C>null</C>, throwing a NPE.
          Always use <C>orElseThrow</C> and return a proper error to the courier system immediately.
        </Warn>
      </section>

      {/* S11 — CHEAT SHEET + PATTERNS MAP */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>Cheat sheet + patterns map</h2>
        <ul>
          <li><strong>Greedy assignment:</strong> filter AVAILABLE + fits(), then <C>.min(size.rank)</C>. Fail fast if empty.</li>
          <li><strong>Atomic claim:</strong> <C>synchronized tryOccupy()</C> — CAS pattern. Never check-then-act.</li>
          <li><strong>Pickup code:</strong> random, immutable, single-use, known only to recipient. Value Object.</li>
          <li><strong>Expiry:</strong> both check on pickup (<C>isExpired()</C>) AND sweeper (scheduled task).</li>
          <li><strong>Injected Clock:</strong> always inject, never call <C>Instant.now()</C> directly. Testability.</li>
          <li><strong>SlotSize rank:</strong> explicit int field, not <C>ordinal()</C>. Insertion-safe.</li>
        </ul>
        <table className="matrix" style={{ width: '100%', marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '7px 10px' }}>Pattern used</th>
              <th style={{ textAlign: 'left', padding: '7px 10px' }}>Where</th>
              <th style={{ textAlign: 'left', padding: '7px 10px' }}>Day ref</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Composition', 'LockerBank owns LockerSlots', 'Day 6'],
              ['Value Object', 'Pickup code — immutable, equality by value', 'Day 20'],
              ['Strategy', 'AssignmentStrategy — pluggable (greedy / nearest-to-customer)', 'Day 31'],
              ['Atomic CAS', 'tryOccupy() — prevent double-claim race', 'Day 62'],
              ['LEASE / TTL', 'Reservation with expiresAt — same as seat-hold', 'Day 64'],
              ['Sweeper (Background task)', 'ExpirySweeperTask via ScheduledExecutorService', 'Day 52'],
              ['Injected Clock', 'Clock passed to sweeper — deterministic testing', 'Day 49'],
            ].map(([p, w, d]) => (
              <tr key={p}>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{p}</td>
                <td style={{ padding: '6px 10px' }}>{w}</td>
                <td style={{ padding: '6px 10px', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Code html={`<span class="cm">// The full store-to-pickup lifecycle in 5 lines of pseudocode</span>

<span class="cm">// 1. Courier calls store(package)</span>
slot ← assignSlot(pkg.size)              <span class="cm">// greedy: smallest that fits</span>
slot.tryOccupy()                         <span class="cm">// atomic CAS — fail and retry if lost the race</span>
reservation ← new Reservation(slot, pkg, now + 3 days)
email(pkg.recipientEmail, reservation.pickupCode)

<span class="cm">// 2. Background sweeper (every hour)</span>
reservations.filter(r -&gt; r.isExpired()).forEach(r -&gt; r.slot.free())

<span class="cm">// 3. Customer calls pickup(code)</span>
res ← reservationsByCode.get(code)      <span class="cm">// O(1) lookup</span>
assert !res.isExpired()                  <span class="cm">// check TTL</span>
res.slot.free()                          <span class="cm">// mark AVAILABLE</span>
return res.pkg                           <span class="cm">// hand over the package</span>`} />
      </section>

      {/* INTERVIEW CORNER */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Interview corner · Rapid fire</h2>
        <p>Six tricky questions. Click each to reveal the model answer.</p>

        <Reveal summary="Q1: What if no slot fits the package at all? What do you return?">
          <p>
            Throw a <C>NoSlotAvailableException</C> (or return a Result type with an error).
            The courier system gets an immediate failure response. It can then:
          </p>
          <ul>
            <li>Try a different locker bank nearby.</li>
            <li>Put the package on a waitlist — notify the sender when a Large slot opens up.</li>
            <li>Return the package to the fulfillment center.</li>
          </ul>
          <p>Never silently store the package in a slot that is too small. Physical reality doesn't allow it.</p>
        </Reveal>

        <Reveal summary="Q2: Can the recipient 'reset' their pickup code if they lose it?">
          <p>
            No — the pickup code is a <strong>Value Object</strong> (Day 20). It is immutable after creation.
            The correct fix is to invalidate the current Reservation and create a new one with a fresh code.
            This gives you a full audit trail: old code is dead, new code is issued, both are logged.
            Mutating the existing code would corrupt the history.
          </p>
        </Reveal>

        <Reveal summary="Q3: Two couriers arrive at exactly the same millisecond. Both read slot M3 as AVAILABLE. How do you prevent a double assignment?">
          <p>
            Use <C>synchronized tryOccupy()</C> — the JVM guarantees that only one thread can be inside
            a synchronized method on the same object at a time. Thread A enters, sets state = OCCUPIED,
            returns true. Thread B enters next, sees state != AVAILABLE, returns false. Thread B
            then searches for the next available slot and retries. In a database, this is a
            conditional UPDATE: <C>UPDATE locker_slot SET state='OCCUPIED' WHERE id=? AND state='AVAILABLE'</C>
            — check rows-affected: if 0, another process got there first.
          </p>
        </Reveal>

        <Reveal summary="Q4: Sweeper vs lazy expiry — which one should you use in production?">
          <p>
            Both, for different reasons:
          </p>
          <ul>
            <li><strong>Sweeper:</strong> frees slots even if nobody ever tries to pick up the package. Essential for a busy locker bank that must reuse slots.</li>
            <li><strong>Lazy check:</strong> defense-in-depth. Even if the sweeper is delayed (GC pause, restart), a pickup attempt on an expired reservation is rejected.</li>
          </ul>
          <p>The sweeper is the primary mechanism. Lazy check is the safety net.</p>
        </Reveal>

        <Reveal summary="Q5: How would you handle a package that is too large for ALL slots in the bank?">
          <p>
            This is a configuration/business problem, not a code problem.
          </p>
          <ul>
            <li>The bank should have a <C>maxSupportedSize</C> field. The courier system checks this before even trying to store.</li>
            <li>If a package exceeds all slot sizes, the response is immediate: "This locker bank does not support packages of this size. Try location X."</li>
            <li>Alternatively, a locker bank could have a JUMBO tier — but that is a new entity, not a code change to the existing slot logic.</li>
          </ul>
        </Reveal>

        <Reveal summary="Q6: How would you add 'preferred locker' — route the customer to the bank nearest to their delivery address?">
          <p>
            Add a <C>BankLocator</C> service between the order system and the LockerBank:
          </p>
          <ul>
            <li><C>BankLocator.findBanksNear(address, pkgSize)</C> — returns ranked list of banks that have at least one slot of the needed size.</li>
            <li>Uses a spatial index (geohash, quadtree — same idea as cab booking Day 58) to find nearby banks efficiently.</li>
            <li>The LockerBank itself doesn't change — it still just does greedy assignment. BankLocator is a new layer on top.</li>
          </ul>
          <p>This is the Open/Closed Principle (Day 12): extend by adding BankLocator, not by modifying LockerBank.</p>
        </Reveal>

        <Reveal summary="Q7: What happens if the sweeper crashes mid-run? Are any slots permanently leaked?">
          <p>
            The sweeper is stateless — it reads the current time and the current reservation list on each run.
            If it crashes at slot #3 of 10, slots #1–#3 are freed and #4–#10 are still OCCUPIED. On the next
            scheduled run (1 hour later), it will process #4–#10 correctly. No slot is permanently leaked.
            Make the sweeper idempotent: calling <C>slot.free()</C> on an already-free slot should be a no-op,
            not an error.
          </p>
        </Reveal>
      </section>

      {/* S13 — QUIZ */}
      <section id="s13">
        <div className="sec-label">Section 13 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* HOMEWORK FOOTER */}
      <div className="footer">
        <strong>Day 68 complete?</strong> Homework: code a <C>LockerBank</C> class in Java with
        <C>store(Package)</C> and <C>pickup(String code)</C> methods. Add an <C>ExpirySweeperTask</C>
        that accepts an injected <C>Clock</C>. Write three unit tests: (1) greedy picks Medium over Large
        for a Medium package, (2) concurrent <C>store()</C> calls result in exactly one assignment per slot,
        (3) <C>pickup()</C> throws after expiry using a fixed Clock.
        <br /><br />
        Next: <strong>Day 69 — Pub-Sub Message Queue</strong>: topics, subscribers, delivery guarantees,
        offsets, and at-least-once vs at-most-once delivery. Every notification system, logging framework,
        and event-driven architecture is built on this foundation.
      </div>

    </div>
  )
}
