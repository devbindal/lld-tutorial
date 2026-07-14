import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Shared constants / helpers
   ============================================================ */
const ROOM_TYPES = {
  SINGLE: { label: 'Single',  base: 1800, color: '#E3F2FD', textColor: '#1565C0' },
  DOUBLE: { label: 'Double',  base: 3200, color: '#E8F5E9', textColor: '#2E7D32' },
  SUITE:  { label: 'Suite',   base: 7500, color: '#FFF8E1', textColor: '#F57F17' },
}

// 14 days starting from "day 1" (Mon) — 2 full weeks
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const isWeekend = (i) => i % 7 === 5 || i % 7 === 6  // Sat or Sun index

// Initial reservations to pre-populate the calendar
const INIT_RESERVATIONS = [
  { id: 'r1', room: 'R101', guest: 'Anil',   checkIn: 1, checkOut: 4,  color: '#FF8A65' },
  { id: 'r2', room: 'R102', guest: 'Priya',  checkIn: 3, checkOut: 7,  color: '#9575CD' },
  { id: 'r3', room: 'R201', guest: 'Sam',    checkIn: 0, checkOut: 3,  color: '#4FC3F7' },
  { id: 'r4', room: 'R301', guest: 'Meena',  checkIn: 7, checkOut: 11, color: '#81C784' },
]

const ROOMS_META = [
  { id: 'R101', label: 'R101 (Single)', type: 'SINGLE' },
  { id: 'R102', label: 'R102 (Single)', type: 'SINGLE' },
  { id: 'R201', label: 'R201 (Double)', type: 'DOUBLE' },
  { id: 'R202', label: 'R202 (Double)', type: 'DOUBLE' },
  { id: 'R301', label: 'R301 (Suite)',  type: 'SUITE'  },
]

function overlaps(reqIn, reqOut, existIn, existOut) {
  // Two ranges [A,B) and [C,D) overlap if A < D AND C < B
  return reqIn < existOut && existIn < reqOut
}

/* ============================================================
   Demo 1 — Availability Calendar
   ============================================================ */
function AvailabilityCalendarDemo() {
  const [reservations] = useState(INIT_RESERVATIONS)
  const [selRoom, setSelRoom] = useState(null)
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)
  const [availResult, setAvailResult] = useState(null)

  const reqIn  = dragStart !== null && dragEnd !== null ? Math.min(dragStart, dragEnd) : null
  const reqOut = dragStart !== null && dragEnd !== null ? Math.max(dragStart, dragEnd) + 1 : null

  function checkAvailability() {
    if (!selRoom || reqIn === null) { setAvailResult('Select a room and a date range first.'); return }
    const roomRes = reservations.filter(r => r.room === selRoom)
    const conflict = roomRes.find(r => overlaps(reqIn, reqOut, r.checkIn, r.checkOut))
    if (conflict) {
      setAvailResult(`Room ${selRoom} is NOT available for days ${reqIn + 1}–${reqOut} — conflicts with ${conflict.guest}'s booking (days ${conflict.checkIn + 1}–${conflict.checkOut}).`)
    } else {
      setAvailResult(`Room ${selRoom} IS available for days ${reqIn + 1}–${reqOut}. The overlap formula confirms: no existing reservation has reqIn < existOut AND existIn < reqOut.`)
    }
  }

  function cellColor(roomId, dayIdx) {
    const res = reservations.find(r => r.room === roomId && dayIdx >= r.checkIn && dayIdx < r.checkOut)
    if (res) return res.color
    if (selRoom === roomId && reqIn !== null && dayIdx >= reqIn && dayIdx < reqOut) return '#FFD54F'
    return isWeekend(dayIdx) ? '#F5F0E8' : '#FAFAF7'
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · 2-week availability calendar — select a room and drag across dates</div>

      {/* Room selector */}
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, marginRight: 8 }}>Select room:</span>
        <div className="modbtns" style={{ display: 'inline-flex' }}>
          {ROOMS_META.map(r => (
            <button key={r.id} className={selRoom === r.id ? 'on' : ''}
              onClick={() => { setSelRoom(r.id); setAvailResult(null) }}>
              {r.id}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ overflowX: 'auto', marginBottom: 12 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ padding: '4px 8px', textAlign: 'left', fontFamily: 'Space Grotesk', fontSize: 11 }}>Room</th>
              {DAYS.map((d, i) => (
                <th key={i} style={{
                  padding: '4px 6px', textAlign: 'center', minWidth: 38,
                  color: isWeekend(i) ? '#c85a00' : '#1B2A4A',
                  fontFamily: 'IBM Plex Mono', fontWeight: isWeekend(i) ? 700 : 400
                }}>
                  {d}<br /><span style={{ fontSize: 9.5, color: '#7c8aa5' }}>d{i + 1}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROOMS_META.map(rm => (
              <tr key={rm.id}>
                <td style={{ padding: '3px 8px', fontFamily: 'IBM Plex Mono', fontSize: 11,
                  color: selRoom === rm.id ? 'var(--blue)' : 'var(--ink)', fontWeight: selRoom === rm.id ? 700 : 400,
                  cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => { setSelRoom(rm.id); setAvailResult(null) }}>
                  {rm.id}
                  <span style={{ fontSize: 9.5, color: '#7c8aa5', marginLeft: 4 }}>({ROOM_TYPES[rm.type].label})</span>
                </td>
                {DAYS.map((_, dayIdx) => {
                  const bg = cellColor(rm.id, dayIdx)
                  const res = reservations.find(r => r.room === rm.id && dayIdx >= r.checkIn && dayIdx < r.checkOut)
                  return (
                    <td key={dayIdx}
                      onMouseDown={() => { setSelRoom(rm.id); setDragStart(dayIdx); setDragEnd(dayIdx); setAvailResult(null) }}
                      onMouseEnter={() => { if (dragStart !== null) setDragEnd(dayIdx) }}
                      onMouseUp={() => {}}
                      style={{
                        background: bg, border: '1px solid #ddd', cursor: 'pointer',
                        padding: '3px 2px', textAlign: 'center', fontSize: 9,
                        color: res ? '#fff' : '#999', minWidth: 38
                      }}>
                      {res && dayIdx === res.checkIn ? res.guest.slice(0, 3) : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <button className="act" onClick={checkAvailability}
          disabled={!selRoom || reqIn === null}>
          Check availability
        </button>
        <button className="act ghost" onClick={() => { setDragStart(null); setDragEnd(null); setAvailResult(null) }}>
          Clear selection
        </button>
        <div style={{ display: 'flex', gap: 12, fontSize: 10.5, color: '#666' }}>
          <span><span style={{ background: '#FFD54F', padding: '1px 6px', borderRadius: 3 }}>■</span> Selected</span>
          <span><span style={{ background: '#FF8A65', padding: '1px 6px', borderRadius: 3 }}>■</span> Reserved</span>
          <span><span style={{ background: '#F5F0E8', padding: '1px 6px', borderRadius: 3 }}>■</span> Weekend</span>
        </div>
      </div>

      {availResult && (
        <div style={{
          background: availResult.includes('IS available') ? '#E8F5E9' : '#FFEBEE',
          border: availResult.includes('IS available') ? '1px solid #81C784' : '1px solid #EF9A9A',
          borderRadius: 6, padding: 10, fontSize: 12.5, fontFamily: 'IBM Plex Mono'
        }}>
          {availResult.includes('IS available') ? '✅ ' : '❌ '}{availResult}
        </div>
      )}

      <Good>
        Drag across dates in a row to select a range. Click "Check availability" to run the
        overlap formula: <b>reqIn &lt; existOut AND existIn &lt; reqOut</b>. A room is
        available only if NO existing reservation satisfies both conditions.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 2 — Booking flow (atomic claim)
   ============================================================ */
const BOOKING_ROOMS = [
  { id: 'B101', type: 'SINGLE', floor: 1 },
  { id: 'B201', type: 'DOUBLE', floor: 2 },
  { id: 'B202', type: 'DOUBLE', floor: 2 },
  { id: 'B301', type: 'SUITE',  floor: 3 },
]

function BookingFlowDemo() {
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [nights, setNights] = useState(2)
  const [bookedIds, setBookedIds] = useState([])
  const [myReservations, setMyReservations] = useState([])
  const [log, setLog] = useState([])

  const checkIn = 3  // conceptual day 3 for demo
  const checkOut = checkIn + nights

  // Simulate pre-existing booking on B301 for nights >= 3 (overlapping demo)
  const existingHold = { room: 'B301', checkIn: 5, checkOut: 8 }

  function isConflict(roomId) {
    if (roomId === existingHold.room && overlaps(checkIn, checkOut, existingHold.checkIn, existingHold.checkOut)) return true
    return false
  }

  const available = BOOKING_ROOMS.filter(r => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false
    if (bookedIds.includes(r.id)) return false
    if (isConflict(r.id)) return false
    return true
  })

  function book(room) {
    // Simulate atomic CAS — only one booking wins
    if (bookedIds.includes(room.id)) {
      setLog(l => [`⚠ Room ${room.id} already claimed — CAS returned false. Try another room.`, ...l])
      return
    }
    setBookedIds(b => [...b, room.id])
    const rt = ROOM_TYPES[room.type]
    const price = rt.base * nights
    setMyReservations(r => [
      { id: `RES-${Date.now()}`, room: room.id, type: rt.label, nights, total: price },
      ...r
    ])
    setLog(l => [
      `✅ Booked ${room.id} (${rt.label}) for ${nights} night(s) — CAS succeeded, room is now RESERVED`,
      ...l
    ])
  }

  function reset() { setBookedIds([]); setMyReservations([]); setLog([]) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · find available rooms and book one — notice the atomic claim in action</div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Room type</label>
          <div className="modbtns">
            {['ALL','SINGLE','DOUBLE','SUITE'].map(t => (
              <button key={t} className={typeFilter === t ? 'on' : ''} onClick={() => setTypeFilter(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nights: {nights}</label>
          <input type="range" min={1} max={7} value={nights}
            onChange={e => setNights(Number(e.target.value))}
            style={{ width: 120 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Available rooms */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, fontFamily: 'Space Grotesk' }}>
            Available rooms ({available.length})
          </div>
          {available.length === 0
            ? <div style={{ color: '#7c8aa5', fontSize: 12.5, fontStyle: 'italic' }}>No available rooms for this selection</div>
            : available.map(room => {
                const rt = ROOM_TYPES[room.type]
                return (
                  <div key={room.id} className="obj" style={{ marginBottom: 8, padding: '10px 14px', cursor: 'pointer' }}
                    onClick={() => book(room)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>{room.id}</span>
                      <span style={{ background: rt.color, color: rt.textColor, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                        {rt.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#7c8aa5', marginTop: 4 }}>
                      Floor {room.floor} · ₹{rt.base.toLocaleString()}/night · {nights} nights = ₹{(rt.base * nights).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4, color: 'var(--blue)', fontWeight: 600 }}>Click to book →</div>
                  </div>
                )
              })
          }
          {BOOKING_ROOMS.filter(r => (typeFilter === 'ALL' || r.type === typeFilter) && (bookedIds.includes(r.id) || isConflict(r.id))).map(room => (
            <div key={room.id} style={{ marginBottom: 8, padding: '10px 14px', border: '1px dashed #ccc', borderRadius: 8, opacity: 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: '#7c8aa5' }}>{room.id}</span>
                <span style={{ fontSize: 11, color: '#c00' }}>
                  {bookedIds.includes(room.id) ? 'RESERVED (this session)' : 'UNAVAILABLE (date conflict)'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* My reservations */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, fontFamily: 'Space Grotesk' }}>
            My Reservations ({myReservations.length})
          </div>
          {myReservations.length === 0
            ? <div style={{ color: '#7c8aa5', fontSize: 12.5, fontStyle: 'italic' }}>No reservations yet</div>
            : myReservations.map(res => (
                <div key={res.id} style={{ background: '#E8F5E9', border: '1px solid #81C784', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk', fontSize: 13 }}>✅ {res.room}</div>
                  <div style={{ fontSize: 11.5, color: '#2E7D32', marginTop: 4 }}>
                    {res.type} · {res.nights} night(s) · ₹{res.total.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#7c8aa5', marginTop: 3, fontFamily: 'IBM Plex Mono' }}>{res.id}</div>
                </div>
              ))
          }
          {log.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {log.slice(0, 3).map((l, i) => (
                <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 10.5, color: l.startsWith('✅') ? '#2a7a3a' : '#c00', marginBottom: 4 }}>{l}</div>
              ))}
            </div>
          )}
          <button className="act ghost" style={{ marginTop: 10 }} onClick={reset}>Reset</button>
        </div>
      </div>

      <Note>
        Room B301 (Suite) is pre-booked for days 6–8 in the system. If you select 4+ nights,
        it appears as UNAVAILABLE — the overlap check catches it. Try booking the same room twice
        in the available list to see the CAS guard refuse the second attempt.
      </Note>
    </div>
  )
}

/* ============================================================
   Demo 3 — Pricing breakdown
   ============================================================ */
const ADD_ONS = [
  { id: 'BREAKFAST', label: 'Breakfast', perNight: true,  price: 200, emoji: '🍳' },
  { id: 'PARKING',   label: 'Parking',   perNight: true,  price: 100, emoji: '🚗' },
  { id: 'SPA',       label: 'Spa',       perNight: false, price: 500, emoji: '💆' },
]

function PricingDemo() {
  const [roomType, setRoomType] = useState('DOUBLE')
  const [nights, setNights] = useState(3)
  const [addOns, setAddOns] = useState({})
  const [loyalty, setLoyalty] = useState('SILVER')

  function toggleAddOn(id) {
    setAddOns(a => ({ ...a, [id]: !a[id] }))
  }

  const rt = ROOM_TYPES[roomType]
  const baseTotal = rt.base * nights

  // Weekend surcharge: assume check-in is on a Wednesday (day 3)
  // nights 1-2 = Wed-Thu (no weekend), nights 3+ may hit Sat-Sun
  const checkInDow = 3  // Wed = day index 3
  let weekendNights = 0
  for (let i = 0; i < nights; i++) {
    const dow = (checkInDow + i) % 7
    if (dow === 5 || dow === 6) weekendNights++
  }
  const weekendSurcharge = weekendNights * Math.round(rt.base * 0.25)

  const addOnTotal = ADD_ONS.reduce((sum, ao) => {
    if (!addOns[ao.id]) return sum
    return sum + (ao.perNight ? ao.price * nights : ao.price)
  }, 0)

  const subtotal = baseTotal + weekendSurcharge + addOnTotal
  const loyaltyDiscount = loyalty === 'GOLD' && nights > 3 ? Math.round(subtotal * 0.10) : 0
  const grandTotal = subtotal - loyaltyDiscount

  const lineItems = [
    [`Base rate (${rt.label}) × ${nights} night${nights > 1 ? 's' : ''}`, baseTotal],
    ...(weekendNights > 0 ? [`Weekend surcharge (${weekendNights} night${weekendNights > 1 ? 's' : ''} × 25%)`, weekendSurcharge] : []).map ? [[`Weekend surcharge (${weekendNights} night${weekendNights > 1 ? 's' : ''} × 25%)`, weekendSurcharge]] : [],
    ...ADD_ONS.filter(ao => addOns[ao.id]).map(ao => [
      `${ao.emoji} ${ao.label}${ao.perNight ? ` × ${nights} night${nights > 1 ? 's' : ''}` : ' (flat)'}`,
      ao.perNight ? ao.price * nights : ao.price
    ]),
  ]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · pick room type, nights, and add-ons — see how pricing composes</div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Controls */}
        <div style={{ flex: 1, minWidth: 230 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Room type</div>
            <div className="modbtns">
              {Object.keys(ROOM_TYPES).map(t => (
                <button key={t} className={roomType === t ? 'on' : ''} onClick={() => setRoomType(t)}>
                  {ROOM_TYPES[t].label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Nights: {nights}</div>
            <input type="range" min={1} max={7} value={nights}
              onChange={e => setNights(Number(e.target.value))}
              style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7c8aa5' }}>
              <span>1</span><span>Check-in Wed</span><span>7</span>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Add-ons (Decorator layers)</div>
            {ADD_ONS.map(ao => (
              <label key={ao.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: 12.5 }}>
                <input type="checkbox" checked={!!addOns[ao.id]} onChange={() => toggleAddOn(ao.id)} />
                {ao.emoji} {ao.label}
                <span style={{ color: '#7c8aa5', fontSize: 11 }}>
                  ₹{ao.price}{ao.perNight ? '/night' : ' flat'}
                </span>
              </label>
            ))}
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Loyalty tier</div>
            <div className="modbtns">
              {['SILVER','GOLD'].map(t => (
                <button key={t} className={loyalty === t ? 'on' : ''} onClick={() => setLoyalty(t)}>{t}</button>
              ))}
            </div>
            {loyalty === 'GOLD' && nights <= 3 && (
              <div style={{ fontSize: 10.5, color: '#7c8aa5', marginTop: 4 }}>
                Gold discount applies for stays &gt; 3 nights
              </div>
            )}
          </div>
        </div>

        {/* Bill */}
        <div style={{ minWidth: 220, background: '#f8f8f5', borderRadius: 8, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, fontFamily: 'Space Grotesk' }}>
            🧾 Price Breakdown
          </div>
          <div style={{ background: rt.color, borderRadius: 6, padding: '6px 10px', marginBottom: 12, fontSize: 12, color: rt.textColor, fontWeight: 600 }}>
            {rt.label} · ₹{rt.base.toLocaleString()}/night base
          </div>

          {lineItems.map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
              <span>{label}</span>
              <span style={{ fontFamily: 'IBM Plex Mono' }}>₹{val.toLocaleString()}</span>
            </div>
          ))}

          <hr style={{ margin: '10px 0', borderColor: 'var(--line)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5, color: '#666' }}>
            <span>Subtotal</span>
            <span style={{ fontFamily: 'IBM Plex Mono' }}>₹{subtotal.toLocaleString()}</span>
          </div>

          {loyaltyDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5, color: '#2E7D32' }}>
              <span>🥇 Gold loyalty (10% off)</span>
              <span style={{ fontFamily: 'IBM Plex Mono' }}>-₹{loyaltyDiscount.toLocaleString()}</span>
            </div>
          )}

          <div style={{ borderTop: '2px solid var(--ink)', paddingTop: 10, marginTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
            <span>Total</span>
            <span style={{ fontFamily: 'IBM Plex Mono' }}>₹{grandTotal.toLocaleString()}</span>
          </div>

          <div style={{ marginTop: 12, fontSize: 10.5, color: '#7c8aa5', fontFamily: 'IBM Plex Mono' }}>
            {weekendNights > 0 ? `${weekendNights} weekend night(s) detected` : 'No weekend nights'}
          </div>
        </div>
      </div>

      <Good>
        Each add-on is a <b>Decorator layer</b> (Day 27). The base rate is the core computation.
        Breakfast, Parking, and Spa each wrap it, adding their price. Toggle the checkboxes above
        and watch the layers compose. The Gold loyalty discount applies last — a final wrapper on top.
      </Good>
    </div>
  )
}

/* ============================================================
   Quiz data
   ============================================================ */
const QUESTIONS = [
  {
    q: 'Two date ranges [A, B) and [C, D) overlap when:',
    o: [
      'A <= C AND B >= D',
      'A < D AND C < B',
      'B > C OR D > A',
      'A == C OR B == D',
    ],
    a: 1,
    e: 'The correct overlap condition is: A < D AND C < B. They do NOT overlap when B <= C (first ends before second starts) or D <= A (second ends before first starts). Overlapping is the negation of both non-overlap cases: NOT (B <= C OR D <= A) = A < D AND C < B.',
    w: {
      0: 'A <= C AND B >= D is the "contains" condition — one range fully contains the other. This misses cases where ranges partially overlap.',
      2: 'B > C OR D > A is too broad — it is almost always true. Two ranges that just touch at a boundary (B == C) would be flagged as overlapping, but they are not.',
      3: 'A == C OR B == D checks only if ranges share an endpoint, missing all partial overlaps where ranges share interior days but not endpoints.',
    },
    r: { id: 's4', label: 'Section 4 — Date-range overlap formula' },
  },
  {
    q: 'Why is it wrong to model availability as "Room" instead of "RoomNight"?',
    o: [
      'A room can only be booked once, so one entity is enough',
      'The same physical room is a different bookable unit on each calendar night',
      'RoomNight is faster to query in a database',
      '"Room" is a reserved Java keyword and cannot be used as a class name',
    ],
    a: 1,
    e: 'The key insight: a physical Room is a permanent asset, but its availability changes each night. Room 201 is available Friday but NOT Saturday because different guests book different nights. Without this distinction, the model cannot express partial availability.',
    w: {
      0: 'A room CAN be booked multiple times — just for non-overlapping date ranges. Assuming "once" is what leads to incorrect models.',
      2: 'Performance is a database concern, not a domain-model concern. The right model is chosen for correctness first.',
      3: '"Room" is not a reserved Java keyword at all. This is a distractor.',
    },
    r: { id: 's1', label: 'Section 1 — The date-range problem' },
  },
  {
    q: 'Which pattern is used to make the "book a room" operation atomic and prevent double-booking?',
    o: [
      'Observer — notify both guests simultaneously',
      'Strategy — swap between booking strategies at runtime',
      'CAS (compare-and-set) — only one thread succeeds in claiming the room',
      'Template Method — define the booking skeleton once',
    ],
    a: 2,
    e: 'CAS (Day 62): room.tryReserve() uses compareAndSet(AVAILABLE, RESERVED). Only one thread wins; the other gets false and retries with a different room. This prevents two guests from booking the same room at the same time.',
    w: {
      0: 'Observer notifies subscribers of events — it does not make a claim atomic. You could use it to notify guests after booking, but it does not prevent double-booking.',
      1: 'Strategy lets you swap HOW something is done — it does not address the thread-safety of a single reservation claim.',
      3: 'Template Method defines a skeleton algorithm for subclasses — it has nothing to do with atomic claims or concurrency.',
    },
    r: { id: 's6', label: 'Section 6 — Atomic booking and CAS' },
  },
  {
    q: 'A guest books Room 201 for Mon–Wed (checkIn=0, checkOut=3). Another guest requests Room 201 for Wed–Fri (checkIn=3, checkOut=5). Is there a conflict?',
    o: [
      'Yes — both bookings share Wednesday',
      'No — the first booking ends on Wednesday and the second starts on Wednesday',
      'Yes — rooms can only be booked one at a time regardless of dates',
      'No — only conflicts on the same night count, not the same day',
    ],
    a: 1,
    e: 'Using half-open intervals [checkIn, checkOut): the first reservation covers nights 0, 1, 2 (Mon, Tue, Wed check-out morning). The second covers nights 3, 4. They do NOT overlap: reqIn (3) < existOut (3) is FALSE. CheckOut day is when the guest leaves — the room is free that day for a new guest.',
    w: {
      0: 'Wednesday is the check-OUT day for the first guest. They leave that morning; the room is cleaned and available for check-IN by the afternoon. Using half-open intervals [checkIn, checkOut) models this correctly — day 3 is NOT included in [0, 3).',
      2: 'This is the wrong model — hotels are designed to have sequential bookings. The whole point of availability checking is to allow back-to-back bookings.',
      3: 'There is no distinction between "night" and "day" in this context — check-out and check-in happen on the same calendar day, and the half-open interval handles it correctly.',
    },
    r: { id: 's4', label: 'Section 4 — Date-range overlap formula' },
  },
  {
    q: 'Which design pattern best models the stackable add-ons (Breakfast, Parking, Spa) in hotel pricing?',
    o: ['Factory Method', 'Decorator', 'Composite', 'Strategy'],
    a: 1,
    e: 'Decorator (Day 27): each add-on wraps the base price calculator and adds its cost. You can stack them in any order: BaseRate → +Breakfast → +Parking → +Spa. Each wrapper calls the inner calculator and adds its own amount. The base stays unchanged.',
    w: {
      0: 'Factory Method is about creating objects — deciding which concrete type to instantiate. It does not model layering behavior on top of an existing calculation.',
      2: 'Composite treats a tree of objects as a single unit — useful for hierarchies (like folder/file trees), not for composing incremental price additions onto a base.',
      3: 'Strategy swaps one algorithm for another entirely. Add-ons do not replace pricing — they layer on top. Strategy would force you to re-implement the entire pricing logic for each combination.',
    },
    r: { id: 's8', label: 'Section 8 — Pricing and add-ons as Decorator' },
  },
  {
    q: 'A guest books a room at ₹3,200/night. The hotel later raises the room rate to ₹4,500/night. What should the guest\'s reservation show?',
    o: [
      '₹4,500/night — always use the current rate',
      '₹3,200/night — snapshot the rate at booking time',
      '₹3,850/night — average the old and new rates',
      'An error — hotel rates must not change during active reservations',
    ],
    a: 1,
    e: '₹3,200/night — the rate is snapshotted at booking time and stored in the Reservation. This is the Value Object / immutability principle (Day 20). Future rate changes do not affect existing confirmed reservations. The guest has a contract at the original price.',
    w: {
      0: 'Retroactively changing the price on a confirmed reservation is a consumer protection violation. The guest agreed to ₹3,200 — charging ₹4,500 would be fraud.',
      2: 'An average has no business or legal meaning. Neither guest nor hotel would agree to this calculation.',
      3: 'Hotel rates change constantly (seasonal pricing, demand surges). The design must handle this gracefully by snapshotting at booking time.',
    },
    r: { id: 's8', label: 'Section 8 — Pricing and rate snapshot' },
  },
  {
    q: 'What is the cancellation refund policy boundary that most hotels use?',
    o: [
      'Full refund always, up to 1 hour before check-in',
      'Full refund if cancelled more than 48 hours before check-in; partial/no refund closer',
      'No refund ever — all reservations are non-refundable',
      'Refund only if the hotel is full on the cancelled dates',
    ],
    a: 1,
    e: 'The standard tiered policy: cancel more than 48 hours before check-in → full refund. Cancel 24–48 hours before → 50% refund. Cancel less than 24 hours → no refund. The key metric is time-before-check-in, not time-since-booking. This is computed at cancellation time by comparing LocalDate.now() with checkIn.',
    w: {
      0: 'A 1-hour window is far too short for hotel operations — they need to plan staffing and room assignments. This would also allow gaming (book and cancel repeatedly with no cost).',
      2: 'Non-refundable is a specific rate tier, not a universal policy. Standard rates typically have a cancellation window.',
      3: 'Refund policy is independent of whether the room gets re-booked. The hotel commits to a refund based on the time of cancellation, not on future availability.',
    },
    r: { id: 's8', label: 'Section 8 — Cancellation policy' },
  },
  {
    q: 'A Room has states AVAILABLE → RESERVED → OCCUPIED → MAINTENANCE. Which pattern models this?',
    o: [
      'Observer — notify housekeeping on each state change',
      'Strategy — swap the room\'s behavior at runtime',
      'State — the room\'s behavior changes based on its current state',
      'Chain of Responsibility — pass the room through a cleaning pipeline',
    ],
    a: 2,
    e: 'State pattern (Day 34): in each state, different operations are valid (AVAILABLE can be reserved, OCCUPIED cannot be re-reserved, MAINTENANCE refuses all bookings). States name their own valid successors. The same book() call is accepted in AVAILABLE and rejected in OCCUPIED.',
    w: {
      0: 'Observer notifies listeners about changes — it complements State (fire notifications on each transition) but does not model the lifecycle itself.',
      1: 'Strategy swaps a single algorithm — it models HOW something is done (like which pricing formula to use), not WHAT STATE the object is in.',
      3: 'Chain of Responsibility passes a request along a chain of handlers — it models request routing, not object lifecycle states.',
    },
    r: { id: 's3', label: 'Section 3 — Room/Reservation state machine' },
  },
]

/* ============================================================
   Page
   ============================================================ */
export default function Day71() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 15 · Day 71</div>
        <h1>Hotel Booking:<br />The Date-Range Resource</h1>
        <p>
          A hotel room is not a taxi — it is reserved for a span of days. The defining challenge
          is a date-range overlap check that must be atomic, correct, and fast. Click through every
          demo to see how it all fits together.
        </p>
        <div className="chips">
          {['DateRange Overlap','Atomic Booking','Pricing Strategy','Add-On Decorator','Cancellation Policy'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The date-range problem — why Room does not equal RoomNight</h2>
        <p>
          Think of a hotel floor as a row of cubby holes. Each cubby holds keys for one room.
          Now imagine the floor is a calendar — each column is a date. A room is a row.
          A reservation fills a rectangle: one row (room), several columns (nights).
        </p>
        <p>
          Room 201 can be booked by Anil on Monday and by Priya on Friday — even though it is
          the same physical room. The physical room (the "row") is permanent. Its availability on
          each night (each "column") is what changes. This is the core insight: <b>Room</b> is the
          asset; <b>RoomNight</b> is the bookable unit.
        </p>
        <Code html={`<span class="cm">── The cubby-row calendar mental model ──────────────────────────</span>

         Mon   Tue   Wed   Thu   Fri   Sat   Sun
  R101 │ Anil  Anil  Anil  ░░░░  ░░░░  ░░░░  ░░░░ │  Single
  R102 │ ░░░░  ░░░░  Priya Priya Priya ░░░░  ░░░░ │  Single
  R201 │ ░░░░  ░░░░  ░░░░  ░░░░  Sam   Sam   Sam  │  Double
  R301 │ ░░░░  ░░░░  ░░░░  ░░░░  ░░░░  ░░░░  ░░░░ │  Suite

  ░░░░ = available   (colored = reserved by that guest)

<span class="cm">── Wrong model: Room has available: boolean ─────────────────────</span>

  <span class="kw">class</span> Room {
      <span class="kw">private boolean</span> available; <span class="cm">// ❌ can only say "booked or not" — no date context</span>
  }
  <span class="cm">// Cannot express: booked Mon-Wed AND available Thu-Sun</span>

<span class="cm">── Right model: Room has a list of Reservations ─────────────────</span>

  <span class="kw">class</span> Room {
      <span class="kw">private final</span> List&lt;Reservation&gt; reservations; <span class="cm">// ✅ knows its full calendar</span>

      <span class="kw">public boolean</span> isAvailable(LocalDate checkIn, LocalDate checkOut) {
          <span class="cm">// available = NO reservation overlaps with [checkIn, checkOut)</span>
          <span class="kw">return</span> reservations.stream()
              .noneMatch(r -> overlaps(checkIn, checkOut, r.getCheckIn(), r.getCheckOut()));
      }
  }`} />
        <Note>
          Unlike a parking spot (hourly, Day 41) or a taxi (point-in-time, Day 58), a hotel
          reservation spans a date range. The "unit" being reserved is not the room — it is a
          <b> (room, night)</b> pair. You must check all nights in the requested range.
        </Note>
      </section>

      {/* S2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Clarifying questions — ask these first in an interview</h2>
        <p>Each answer shapes the design. The bold ones are especially design-shaping.</p>
        <table className="matrix" style={{ width: '100%', fontSize: 12.5 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Question</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Why it matters</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Simple-first answer</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['One guest per room at a time?', 'Clarifies that availability = no overlap, not a counter', 'Yes — one reservation per room per night'],
              ['Multiple room types?', 'Adds RoomType entity with its own base price and capacity', 'Yes — Single, Double, Suite'],
              ['Can the room type be changed after booking?', 'Adds a "modify reservation" flow; may change price', 'No — cancel and re-book for simplicity'],
              ['Loyalty program / discounts?', 'Adds loyaltyTier to Guest; PricingStrategy checks it', 'Yes — Gold tier gets 10% off stays > 3 nights'],
              ['Walk-in vs online booking?', 'Walk-in skips availability search; same Room.tryReserve() atomics apply', 'Support both; walk-in goes through same flow'],
              ['Partial-day pricing (early check-in / late check-out)?', 'Changes DateRange to include time, not just date', 'No — standard 3 PM check-in, 11 AM check-out'],
              ['What triggers a refund on cancellation?', 'Adds CancellationPolicy: time-before-checkIn determines refund %', '>48h = full, 24–48h = 50%, <24h = no refund'],
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
        <Code html={`<span class="cm">── Entity model ─────────────────────────────────────────────────</span>

  ┌────────────────┐      ┌──────────────────┐      ┌───────────────────┐
  │   Hotel        │1   * │    Room           │1   * │   Reservation     │
  │────────────────│      │──────────────────│      │───────────────────│
  │ id             │──────│ id               │──────│ id                │
  │ name           │      │ roomNumber: int   │      │ room: Room        │
  │ address        │      │ floor: int        │      │ guest: Guest      │
  │ rooms          │      │ type: RoomType    │      │ dateRange:        │
  └────────────────┘      │ status: RoomStatus│      │   DateRange       │
                          │ reservations: List│      │ status:           │
  ┌────────────────┐      └──────────────────┘      │   ResvStatus      │
  │   RoomType     │             ▲                   │ totalPrice: Money │
  │────────────────│             │ type              │ rateSnapshot:     │
  │ SINGLE         │─────────────┘                   │   Money/night     │
  │ DOUBLE         │                                 │ addOns: List      │
  │ SUITE          │      ┌──────────────────┐       └───────────────────┘
  │ baseRate: Money│      │   Guest          │               ▲
  │ capacity: int  │      │──────────────────│               │ guest
  └────────────────┘      │ id               │──────────────-┘
                          │ name             │
                          │ email            │       ┌───────────────────┐
                          │ loyaltyTier      │       │   DateRange       │
                          └──────────────────┘       │───────────────────│
                                                     │ checkIn: LocalDate│
  ┌────────────────┐                                 │ checkOut:         │
  │   AddOn (enum) │                                 │   LocalDate       │
  │────────────────│                                 │ nights(): int     │
  │ BREAKFAST  ₹200│                                 │ overlaps():bool   │
  │ PARKING    ₹100│                                 └───────────────────┘
  │ SPA        ₹500│
  └────────────────┘`} />
        <Code html={`<span class="cm">// DateRange — Value Object (Day 20). Immutable. Carries the overlap logic.</span>
<span class="kw">public record</span> DateRange(LocalDate checkIn, LocalDate checkOut) {

    <span class="kw">public</span> DateRange {   <span class="cm">// compact constructor — validate immediately</span>
        Objects.requireNonNull(checkIn,  <span class="str">"checkIn cannot be null"</span>);
        Objects.requireNonNull(checkOut, <span class="str">"checkOut cannot be null"</span>);
        <span class="kw">if</span> (!checkOut.isAfter(checkIn))
            <span class="kw">throw new</span> IllegalArgumentException(<span class="str">"checkOut must be after checkIn"</span>);
    }

    <span class="kw">public long</span> nights() {
        <span class="kw">return</span> ChronoUnit.DAYS.between(checkIn, checkOut); <span class="cm">// e.g. Mon→Thu = 3 nights</span>
    }

    <span class="cm">// TRUE if this range overlaps with another — THE key algorithm</span>
    <span class="kw">public boolean</span> overlaps(DateRange other) {
        <span class="kw">return</span> <span class="kw">this</span>.checkIn.isBefore(other.checkOut)   <span class="cm">// my start < their end</span>
            && other.checkIn.isBefore(<span class="kw">this</span>.checkOut);   <span class="cm">// their start < my end</span>
    }
}

<span class="cm">// Room state machine — guarded transitions</span>
<span class="kw">enum</span> RoomStatus {
    AVAILABLE, RESERVED, OCCUPIED, MAINTENANCE;

    <span class="kw">boolean</span> canTransitionTo(RoomStatus next) {
        <span class="kw">return switch</span> (<span class="kw">this</span>) {
            <span class="kw">case</span> AVAILABLE   -> next == RESERVED   || next == MAINTENANCE;
            <span class="kw">case</span> RESERVED    -> next == OCCUPIED   || next == AVAILABLE; <span class="cm">// cancel</span>
            <span class="kw">case</span> OCCUPIED    -> next == AVAILABLE  || next == MAINTENANCE;
            <span class="kw">case</span> MAINTENANCE -> next == AVAILABLE;
        };
    }
}

<span class="cm">// Reservation lifecycle</span>
<span class="kw">enum</span> ReservationStatus { PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED }`} />

        <Code html={`<span class="cm">── Room and Reservation state machines ────────────────────────────</span>

  Room states:
  AVAILABLE ──────► RESERVED ──────► OCCUPIED ──────► AVAILABLE
      │                 │                                  ▲
      └────────────────►└──►────────────────────►──────────┘
                     (cancel)        (checkout)
      └─────────────────────────────────────────► MAINTENANCE

  Reservation states:
  PENDING ──► CONFIRMED ──► CHECKED_IN ──► CHECKED_OUT
     │            │
     └────────────┴──────────────────────► CANCELLED
                 (before check-in only)`} />
        <Note>
          <C>Reservation.status</C> and <C>Room.status</C> are two separate state machines.
          They move together: when a Reservation becomes CHECKED_IN, its Room becomes OCCUPIED.
          When the Reservation is CANCELLED, its Room returns to AVAILABLE. Keep them in sync
          through a single service method, not by setting fields directly.
        </Note>
      </section>

      {/* S4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The date-range overlap formula — the heart of availability</h2>
        <p>
          This formula is the single most important algorithm in hotel booking. You must know
          it cold. Let us derive it from first principles.
        </p>
        <Code html={`<span class="cm">── All possible arrangements of two date ranges ─────────────────</span>

  Let requested range = [A, B)   existing reservation = [C, D)
  Dates go left to right on a timeline.

  Case 1 — NO overlap (first ends before second starts):
  [A──────B)                [C──────D)
           B &lt;= C ✓  →  no conflict

  Case 2 — NO overlap (second ends before first starts):
                [C──────D) [A──────B)
           D &lt;= A ✓  →  no conflict

  Case 3 — OVERLAP (partial):
  [A──────────B)
         [C──────────D)
           A &lt; D AND C &lt; B ✗  →  CONFLICT!

  Case 4 — OVERLAP (one contains the other):
  [A───────────────────B)
       [C────────D)
           A &lt; D AND C &lt; B ✗  →  CONFLICT!

<span class="cm">── The formula ──────────────────────────────────────────────────</span>

  They DO overlap when:  A &lt; D  AND  C &lt; B
  (i.e. my check-in is before their check-out AND their check-in is before my check-out)

  They do NOT overlap:   B &lt;= C  OR  D &lt;= A

<span class="cm">── Half-open intervals are the key ──────────────────────────────</span>

  Booking Mon–Wed means nights Mon, Tue.  Wed = check-out (room is free by noon).
  Use [checkIn, checkOut) — checkOut is EXCLUSIVE.
  This means: Mon check-out + Mon check-in for next guest = NO conflict. ✅

  If you use closed intervals [A, B] by mistake:
  [Mon, Wed] and [Wed, Fri] → Wed == Wed → overlap reported INCORRECTLY. ❌`} />
        <Code html={`<span class="cm">// Java implementation — clean, one method does everything</span>
<span class="kw">public boolean</span> overlaps(LocalDate reqIn, LocalDate reqOut,
                         LocalDate existIn, LocalDate existOut) {
    <span class="cm">// reqIn < existOut  AND  existIn < reqOut</span>
    <span class="kw">return</span> reqIn.isBefore(existOut) && existIn.isBefore(reqOut);
}

<span class="cm">// Find available rooms of a type for a requested date range</span>
<span class="kw">public</span> List&lt;Room&gt; findAvailableRooms(RoomType type,
                                       LocalDate checkIn,
                                       LocalDate checkOut) {
    <span class="kw">return</span> rooms.stream()
        .filter(r -> r.getType() == type)           <span class="cm">// right type</span>
        .filter(r -> r.getStatus() != RoomStatus.MAINTENANCE) <span class="cm">// not broken</span>
        .filter(r -> r.getReservations().stream()   <span class="cm">// no overlap with any existing booking</span>
            .filter(res -> res.getStatus() != ReservationStatus.CANCELLED)
            .noneMatch(res -> overlaps(
                checkIn, checkOut,
                res.getCheckIn(), res.getCheckOut())))
        .collect(Collectors.toList());
}`} />
        <Warn>
          The most common bug: using <C>{'<='}</C> and <C>{'>='}</C> instead of <C>{'<'}</C> and <C>{'>'}</C>.
          With half-open intervals, check-out day (B) is exclusive. If you write <C>reqIn {'<='} existOut</C>,
          you will flag a check-out + check-in on the same day as a conflict — breaking all back-to-back bookings.
        </Warn>
      </section>

      {/* S5 — Interactive */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>📅 Play: availability calendar</h2>
        <p>
          Click a room row to select it. Then click and drag across date cells to choose a range
          (cells turn yellow). Click "Check availability" to run the overlap formula. The formula
          is the same <C>reqIn {'<'} existOut {'&&'} existIn {'<'} reqOut</C> you just learned.
        </p>
        <AvailabilityCalendarDemo />
      </section>

      {/* S6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Atomic booking — preventing double-booking with CAS</h2>
        <p>
          Two guests can search simultaneously and both see Room 201 as available. If both click
          "Book" at the same instant, a naive implementation will create two reservations for the
          same room on the same nights. This is the classic check-then-act race (Day 62).
        </p>
        <Code html={`<span class="cm">── The race condition ────────────────────────────────────────────</span>

  Thread A (Guest 1):                  Thread B (Guest 2):
  1. findAvailableRooms()  → [R201]
                                       1. findAvailableRooms()  → [R201]  ← both see it!
  2. book(R201, Mon–Wed)
     ↳ isAvailable() → true  ✓
                                       2. book(R201, Mon–Wed)
                                          ↳ isAvailable() → true ✓   ← still true!
  3. createReservation(R201)  ✅
                                       3. createReservation(R201)  ✅ ← DOUBLE-BOOKED! ❌

<span class="cm">── The fix: atomic compare-and-set on Room ──────────────────────</span>

  <span class="cm">// In Room class — AtomicReference ensures only one thread wins</span>
  <span class="kw">private final</span> AtomicReference&lt;RoomStatus&gt; status =
      <span class="kw">new</span> AtomicReference&lt;&gt;(RoomStatus.AVAILABLE);

  <span class="cm">// Returns true only for the ONE thread that flips AVAILABLE → RESERVED</span>
  <span class="kw">public synchronized boolean</span> tryReserve(LocalDate checkIn, LocalDate checkOut) {
      <span class="cm">// Re-check overlap INSIDE the synchronized block — no gap between check and act</span>
      <span class="kw">boolean</span> hasConflict = reservations.stream()
          .anyMatch(r -> overlaps(checkIn, checkOut, r.getCheckIn(), r.getCheckOut()));
      <span class="kw">if</span> (hasConflict) <span class="kw">return false</span>;   <span class="cm">// already booked — loser exits</span>

      <span class="cm">// No conflict: atomically add the reservation placeholder</span>
      reservations.add(<span class="kw">new</span> Reservation(checkIn, checkOut, ReservationStatus.PENDING));
      <span class="kw">return true</span>;   <span class="cm">// winner proceeds to confirm + charge payment</span>
  }

<span class="cm">// In BookingService — the full atomic booking flow</span>
<span class="kw">public</span> Optional&lt;Reservation&gt; book(Guest guest, Room room,
                                    DateRange range, List&lt;AddOn&gt; addOns) {
    <span class="kw">if</span> (!room.tryReserve(range.checkIn(), range.checkOut())) {
        <span class="kw">return</span> Optional.empty();   <span class="cm">// another guest claimed it first — retry with next room</span>
    }
    Money price = pricingService.compute(room, range, addOns); <span class="cm">// compute price now</span>
    Reservation res = <span class="kw">new</span> Reservation(guest, room, range, price, addOns);
    reservationRepository.save(res);       <span class="cm">// persist BEFORE charging (crash-safe)</span>
    paymentGateway.charge(guest, price);   <span class="cm">// charge after save</span>
    res.confirm();                         <span class="cm">// transition PENDING → CONFIRMED</span>
    notifyObservers(res);                  <span class="cm">// email/SMS to guest (Day 32)</span>
    <span class="kw">return</span> Optional.of(res);
}`} />
        <Good>
          The <C>synchronized</C> keyword on <C>tryReserve()</C> ensures that the overlap check
          and the reservation insertion happen as one atomic unit. No other thread can enter between
          the check and the add. In a distributed system, this maps to a database row-level lock or
          an optimistic version check (Day 64).
        </Good>
        <Reveal summary="How does this map to a real database?">
          <p>
            In SQL, you would do: <C>SELECT ... FOR UPDATE</C> on the room row (pessimistic lock),
            then check for conflicts, then INSERT the reservation — all in one transaction.
            Alternatively, you can use an optimistic approach: add a <C>version</C> column to Room,
            do a conditional <C>UPDATE room SET version=v+1 WHERE id=? AND version=v</C>, and only
            INSERT the reservation if the UPDATE affected 1 row. This is the same CAS idea at the
            database layer (Day 64).
          </p>
        </Reveal>
      </section>

      {/* S7 — Interactive */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🏨 Play: booking flow</h2>
        <p>
          Select a room type and number of nights, then click an available room to book it.
          Watch it disappear from the available list. Notice that the Suite (B301) is unavailable
          for long stays — it has a pre-existing reservation that the overlap check catches.
          Try to book the same room twice to see the CAS guard in action.
        </p>
        <BookingFlowDemo />
      </section>

      {/* S8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Pricing: nightly rate, weekend surge, add-ons, and cancellation</h2>
        <p>
          Hotel pricing has four layers: base rate (per night, per room type), weekend surcharge,
          add-ons (Breakfast, Parking, Spa), and loyalty discounts. Each layer wraps the previous
          one — this is the Decorator pattern (Day 27) applied to pricing.
        </p>
        <Code html={`<span class="cm">// PricingStrategy — injectable, testable (Day 31 + Day 15)</span>
<span class="kw">interface</span> PricingStrategy {
    Money pricePerNight(RoomType type, LocalDate date);  <span class="cm">// date matters for weekends</span>
}

<span class="cm">// Base weekday rate</span>
<span class="kw">class</span> WeekdayRate <span class="kw">implements</span> PricingStrategy {
    <span class="kw">public</span> Money pricePerNight(RoomType type, LocalDate date) {
        <span class="kw">return</span> type.getBaseRate();   <span class="cm">// e.g. DOUBLE = ₹3,200</span>
    }
}

<span class="cm">// Weekend surcharge Decorator — wraps any PricingStrategy</span>
<span class="kw">class</span> WeekendSurchargeDecorator <span class="kw">implements</span> PricingStrategy {
    <span class="kw">private final</span> PricingStrategy inner;
    <span class="kw">private final double</span> weekendMultiplier;   <span class="cm">// e.g. 1.25 = 25% more on weekends</span>

    <span class="kw">public</span> Money pricePerNight(RoomType type, LocalDate date) {
        Money base = inner.pricePerNight(type, date);
        DayOfWeek dow = date.getDayOfWeek();
        <span class="kw">if</span> (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY)
            <span class="kw">return</span> base.multiply(weekendMultiplier);  <span class="cm">// weekend: add surcharge</span>
        <span class="kw">return</span> base;                                 <span class="cm">// weekday: no change</span>
    }
}

<span class="cm">// compute total price: sum per night + add-on flat amounts</span>
<span class="kw">public</span> Money computePrice(Room room, DateRange range, List&lt;AddOn&gt; addOns) {
    Money nightsTotal = range.checkIn()
        .datesUntil(range.checkOut())                       <span class="cm">// stream each night</span>
        .map(date -> strategy.pricePerNight(room.getType(), date))
        .reduce(Money.ZERO, Money::add);                    <span class="cm">// sum them all</span>

    Money addOnTotal = addOns.stream()
        .map(ao -> ao.isPerNight()
            ? ao.getPrice().multiply(range.nights())        <span class="cm">// per-night add-ons multiply</span>
            : ao.getPrice())                                <span class="cm">// flat add-ons added once</span>
        .reduce(Money.ZERO, Money::add);

    <span class="kw">return</span> nightsTotal.add(addOnTotal);
}

<span class="cm">// ⚠ ALWAYS snapshot the rate at booking time — store rateSnapshot in Reservation</span>
<span class="cm">// If the hotel changes prices next week, existing reservations are unaffected.</span>`} />

        <Code html={`<span class="cm">── Cancellation policy ────────────────────────────────────────────</span>

  <span class="cm">// Time before check-in determines refund percentage</span>
  <span class="kw">public</span> Money calculateRefund(Reservation res) {
      <span class="kw">long</span> hoursUntilCheckIn = ChronoUnit.HOURS.between(
          Instant.now(), res.getCheckIn().atStartOfDay(ZoneId.systemDefault()).toInstant());

      <span class="kw">if</span> (hoursUntilCheckIn > <span class="num">48</span>) <span class="kw">return</span> res.getTotalPrice();           <span class="cm">// full refund</span>
      <span class="kw">if</span> (hoursUntilCheckIn > <span class="num">24</span>) <span class="kw">return</span> res.getTotalPrice().multiply(<span class="num">0.5</span>); <span class="cm">// 50%</span>
      <span class="kw">return</span> Money.ZERO;  <span class="cm">// no refund — too close to check-in</span>
  }

  <span class="kw">public void</span> cancel(String reservationId) {
      Reservation res = repository.find(reservationId);
      <span class="kw">if</span> (res.getStatus() == ReservationStatus.CHECKED_IN)
          <span class="kw">throw new</span> IllegalStateException(<span class="str">"Cannot cancel a checked-in reservation"</span>);
      Money refund = calculateRefund(res);
      paymentGateway.refund(res.getPaymentId(), refund);   <span class="cm">// partial or full</span>
      res.cancel();                                         <span class="cm">// PENDING/CONFIRMED → CANCELLED</span>
      res.getRoom().release(res);                           <span class="cm">// room returns to AVAILABLE</span>
      notifyObservers(res);                                 <span class="cm">// email the guest</span>
  }`} />
        <Warn>
          <b>Never store price as <C>double</C>.</b> Use <C>BigDecimal</C> or a <C>Money</C> value
          object backed by integer paise (Day 20). Hotel pricing involves multiplication and
          rounding — floating-point errors compound across thousands of bookings and will
          cause billing discrepancies.
        </Warn>
      </section>

      {/* S9 — Interactive */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>💰 Play: pricing breakdown</h2>
        <p>
          Pick a room type, slide the nights, and toggle add-ons. Notice how each add-on adds
          a new layer to the total. Check-in is set to Wednesday — slide to 4+ nights to hit
          the weekend surcharge (Sat/Sun). Gold loyalty discount applies for stays over 3 nights.
        </p>
        <PricingDemo />
      </section>

      {/* S10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Common traps</h2>

        <Warn>
          <b>Trap 1 — Using wrong comparison operators in overlap check.</b> Writing
          <C>reqIn {'<='} existOut</C> instead of <C>reqIn {'<'} existOut</C> will flag a
          Monday check-out + Monday check-in as a conflict. Hotel policy is: the guest checking
          out in the morning frees the room for the afternoon check-in. Half-open intervals
          <C>[checkIn, checkOut)</C> with strict <C>{'<'}</C> handle this correctly.
        </Warn>

        <Warn>
          <b>Trap 2 — No atomic claim (check-then-act race).</b> Checking availability in one
          step and creating the reservation in a separate step leaves a gap where two threads
          both see the room as available and both create a reservation. Always do the overlap
          check and the reservation insertion inside a <C>synchronized</C> block (or a database
          transaction with row-level locking).
        </Warn>

        <Warn>
          <b>Trap 3 — Storing price as <C>double</C>.</b> IEEE 754 cannot represent most decimal
          fractions exactly. Use <C>BigDecimal</C> or store amounts as integer paise. For a hotel
          chain processing 10,000 bookings a day, floating-point drift accumulates into a real
          financial discrepancy by month-end.
        </Warn>

        <Warn>
          <b>Trap 4 — Not snapshotting the rate at booking time.</b> If <C>Reservation</C> stores
          a reference to <C>RoomType.baseRate</C> instead of copying the price, then a rate increase
          next month retroactively changes the guest's bill. Always copy the rate into
          <C>Reservation.rateSnapshot</C> at booking time (Value Object, Day 20).
        </Warn>

        <Warn>
          <b>Trap 5 — Allowing cancellation of a checked-in reservation.</b> Once a guest has
          physically checked in, their reservation is CHECKED_IN. Cancelling it at that point is
          operationally meaningless — they are in the room. The state machine must block the
          CHECKED_IN → CANCELLED transition explicitly.
        </Warn>

        <Warn>
          <b>Trap 6 — Using <C>Date</C> or <C>Instant</C> instead of <C>LocalDate</C>.</b>
          Hotel reservations are calendar-date concepts, not timestamps. <C>LocalDate</C> has no
          timezone — it represents "the 14th of June" without caring whether that is UTC, IST,
          or PST. Using <C>Instant</C> or <C>Date</C> means you must pick a timezone and can
          accidentally flip the check-in date by one day for guests booking across midnight in
          different time zones.
        </Warn>

        <Reveal summary="Pattern map — how every major design fits together">
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
                ['Value Object',  '20', 'DateRange (immutable, carries overlaps()), Money (no double)'],
                ['State',         '34', 'RoomStatus + ReservationStatus state machines with guarded transitions'],
                ['Strategy',      '31', 'PricingStrategy — WeekdayRate, seasonal override, loyalty discount'],
                ['Decorator',     '27', 'WeekendSurchargeDecorator wraps PricingStrategy; add-ons stack on top'],
                ['Observer',      '32', 'Notify guest on CONFIRMED, CANCELLED, CHECK_IN reminder'],
                ['Adapter',       '26', 'PaymentGateway port — Stripe/Razorpay behind one interface'],
                ['CAS (Day 62)',  '62', 'room.tryReserve() synchronized — prevents double-booking race'],
                ['Opt. Locking',  '64', 'DB version column on Room — conditional UPDATE for distributed safety'],
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

      {/* S11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>Cheat sheet</h2>
        <ul>
          <li><b>Room ≠ RoomNight</b> — the physical room is permanent; its bookable unit is a (room, night) pair. Availability = no overlap in the reservation calendar.</li>
          <li><b>Overlap formula</b> — two half-open ranges [A,B) and [C,D) overlap when: <C>A {'<'} D AND C {'<'} B</C>. They do NOT overlap when B {'<='} C or D {'<='} A.</li>
          <li><b>Half-open intervals [checkIn, checkOut)</b> — checkOut is exclusive. Mon–Wed means Mon and Tue nights. This allows back-to-back bookings on the same date.</li>
          <li><b>Atomic claim</b> — do the overlap check and reservation insert inside one <C>synchronized</C> block (or a DB transaction). Never separate check from act.</li>
          <li><b>Rate snapshot</b> — copy the price into <C>Reservation.rateSnapshot</C> at booking time. Future rate changes must not affect confirmed bookings.</li>
          <li><b>Money = BigDecimal / paise integer</b> — never <C>double</C>. Pricing multiplications compound floating-point errors at scale.</li>
          <li><b>Weekend surcharge = Decorator</b> — <C>WeekendSurchargeDecorator</C> wraps any <C>PricingStrategy</C>. Add-ons are additional wrapper layers.</li>
          <li><b>Cancellation policy</b> — tiered by hours-before-checkIn: {'>'}48h = full, 24–48h = 50%, {'<'}24h = no refund. Computed at cancellation time.</li>
          <li><b>LocalDate, not Instant</b> — reservations are calendar-date concepts. No timezone math needed; avoids one-day-off bugs.</li>
          <li><b>State machines</b> — Room (AVAILABLE/RESERVED/OCCUPIED/MAINTENANCE) and Reservation (PENDING/CONFIRMED/CHECKED_IN/CHECKED_OUT/CANCELLED) are separate but synchronized.</li>
        </ul>
      </section>

      {/* INTERVIEW */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>The questions they actually ask</h2>

        <Reveal summary="Q: What if double-booking happens despite the CAS / synchronized guard?">
          <p>
            In a single-process system with proper synchronization, it should not happen. In a
            distributed system with multiple application servers and no distributed lock, two
            servers can both pass the overlap check simultaneously. The fix is to move the atomic
            claim to the database: use a <C>SELECT ... FOR UPDATE</C> on the room row (pessimistic),
            or insert the reservation with a unique constraint on (roomId, date range) and catch the
            constraint violation (optimistic). The last line of defense is a daily audit query that
            finds overlapping reservations and flags them for manual review.
          </p>
        </Reveal>

        <Reveal summary="Q: Airlines deliberately oversell seats. Can hotels do the same (overbooking strategy)?">
          <p>
            Yes — some hotels deliberately accept more reservations than they have rooms, betting
            that some guests will cancel or not show up. This is called "overbooking." The system
            tracks an overbooking threshold (e.g., 5% above capacity). When all reserved rooms are
            filled, the system "walks" a guest to a partner hotel and pays the cost difference.
            The design adds an <C>OverbookingPolicy</C> (Strategy) that decides when to allow
            reservations beyond physical capacity, and a <C>WalkGuestService</C> that activates
            when a walked guest shows up at check-in.
          </p>
        </Reveal>

        <Reveal summary="Q: How do you handle a group booking for 20 rooms atomically?">
          <p>
            This is the all-or-nothing problem (same as multi-seat booking in Day 52). You must
            either claim ALL 20 rooms or claim NONE — a partial group booking is usually unacceptable.
            The solution: acquire locks in a consistent order (sort rooms by ID to avoid deadlock,
            Day 62), check availability for all 20 inside one synchronized block or one DB transaction,
            then either insert all 20 reservations or roll back all of them. Never insert partial and
            then check the remaining — another thread can grab the rooms you checked but have not yet
            claimed.
          </p>
        </Reveal>

        <Reveal summary="Q: How would you implement a waitlist for fully booked dates?">
          <p>
            Add a <C>Waitlist</C> entity: <C>{'{'}</C>guestId, roomType, dateRange, position, createdAt<C>{'}'}</C>.
            When a room is booked, any waitlisted guests for the same (type, overlapping dates) are
            notified. When a cancellation occurs, <C>cancel()</C> triggers an Observer that queries
            the waitlist, finds the first entry for that (type, date range), and sends them a
            time-limited offer (e.g., 15 minutes to confirm). If they do not confirm, the room opens
            to the next waitlisted guest. This is the same hold-with-TTL pattern from Day 52
            (BookMyShow seat hold).
          </p>
        </Reveal>

        <Reveal summary="Q: What is 'rate parity' and how does it affect the system design?">
          <p>
            Rate parity means the hotel must show the same price on its own website as on Booking.com,
            Expedia, etc. This is typically a contractual obligation. The design implication: pricing
            rules (base rates, discounts, promotions) must be centralized in one <C>PricingService</C>
            that all channels query. If rates are hardcoded per channel, they will drift out of sync.
            One <C>RatePlan</C> entity (with effective dates) controls prices for all channels, and
            each channel's integration queries it — a single source of truth for pricing.
          </p>
        </Reveal>

        <Reveal summary="Q: Walk-in vs online booking — do they use the same flow?">
          <p>
            They use the same <C>Room.tryReserve()</C> atomic claim — the core availability and
            booking logic is identical. The differences are: walk-ins skip the online search step
            (front desk staff query available rooms directly); walk-ins may not need email
            notification; payment is charged at the desk rather than pre-authorized online.
            The atomic claim is the same because two front-desk terminals can still race for the
            last room. Design the booking service to be channel-agnostic — the channel is just
            a client, not a separate code path.
          </p>
        </Reveal>

        <Reveal summary="Q: How does the system handle a guest requesting the same room on consecutive stays?">
          <p>
            Two separate <C>Reservation</C> records are created — one for each stay. The overlap check
            naturally handles the gap: if Stay 1 is Mon–Wed (checkOut=Wed) and Stay 2 is Fri–Sun
            (checkIn=Fri), they do not overlap (<C>reqIn=Fri {'>'} existOut=Wed</C>). If the guest
            wants to stay in the SAME room with no gap (checkout day = next check-in day), the
            half-open interval handles it correctly: [Mon,Wed) and [Wed,Fri) share no nights.
            The system simply creates two reservations and the front desk ensures a same-room
            assignment.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="s12">
        <div className="sec-label">Section 12 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer — explanations and revisit pointers appear for every wrong choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 71 complete?</strong> Homework: implement the core in Java. Create a
        <C>DateRange</C> record with a compact constructor that validates checkOut &gt; checkIn,
        a <C>nights()</C> method, and an <C>overlaps(DateRange other)</C> method using the formula.
        Then create a <C>Room</C> class with a <C>List&lt;Reservation&gt;</C> and a
        <C>synchronized boolean tryReserve(DateRange range)</C> method that checks for overlaps
        before adding a pending reservation. Write a unit test that launches two threads simultaneously
        both trying to book the same room for overlapping dates — only one should succeed.
        <br /><br />
        Next: <strong>Day 72 — Online Auction</strong>: bidding windows, real-time bid validation,
        reserve price, concurrent bid races, and the countdown timer that closes an auction —
        an event-driven system where time itself is a first-class citizen.
      </div>

    </div>
  )
}
