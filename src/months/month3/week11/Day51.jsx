import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: Seat ≠ ShowSeat explorer ============ */
const SHOWS = [
  { id: '10am', label: '10:00 AM', movie: 'Inception' },
  { id: '2pm', label: '2:00 PM', movie: 'Inception' },
  { id: '6pm', label: '6:00 PM', movie: 'Interstellar' },
]
// availability of the SAME physical seat C4 across three shows
const C4_BY_SHOW = {
  '10am': { state: 'BOOKED', who: 'sold to someone else' },
  '2pm': { state: 'AVAILABLE', who: 'free — you can grab it' },
  '6pm': { state: 'HELD', who: 'someone is paying right now (30s hold)' },
}
const STATE_COLOR = { AVAILABLE: '#EAF7EF', HELD: '#FFF1D6', BOOKED: '#FDECEC' }

function SeatVsShowSeat() {
  const [showId, setShowId] = useState('2pm')
  const show = SHOWS.find((s) => s.id === showId)
  const cell = C4_BY_SHOW[showId]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · ONE physical seat (C4 in Screen 1) — switch shows, watch its availability change</div>
      <div className="modbtns" style={{ marginBottom: 12 }}>
        {SHOWS.map((s) => (
          <button key={s.id} className={showId === s.id ? 'on' : ''} onClick={() => setShowId(s.id)}>{s.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>physical Seat</div>
          <div style={{
            width: 70, height: 70, borderRadius: 10, border: '2px solid var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, background: '#fff',
          }}>C4</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#7c8aa5', marginTop: 4 }}>same seat<br />every show</div>
        </div>
        <div style={{ fontSize: 26, color: '#bbb' }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>ShowSeat for {show.label}</div>
          <div style={{
            width: 130, minHeight: 70, borderRadius: 10, border: '2px solid var(--line)', padding: 8,
            background: STATE_COLOR[cell.state],
          }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16 }}>{cell.state}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10.5, color: '#555', marginTop: 4 }}>{cell.who}</div>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#7c8aa5', marginTop: 4 }}>{show.movie}</div>
        </div>
      </div>
      <div className="statbar" style={{ display: 'block', marginTop: 12 }}>
        <span style={{ fontSize: 12.5 }}>
          The seat C4 is one piece of furniture. But "is C4 free?" has THREE different answers — one per show.
          So availability can\'t live on <C>Seat</C>; it lives on a <C>ShowSeat(show, seat, state)</C>. Same
          noun, but the booking system cares about the <em>seat-for-a-show</em>, not the seat.
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 2: the seat map ============ */
const MAP_ROWS = ['A', 'B', 'C', 'D', 'E']
const MAP_COLS = [1, 2, 3, 4, 5, 6, 7, 8]
const PREMIUM = new Set(['D', 'E'])           // recliner rows
const PRESOLD = new Set(['A3', 'A4', 'C6', 'E1', 'E2'])

function SeatMap() {
  const [held, setHeld] = useState(new Set())
  const [booked, setBooked] = useState(new Set(PRESOLD))

  function toggle(id) {
    if (booked.has(id)) return
    setHeld((h) => {
      const n = new Set(h)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function confirm() {
    setBooked((b) => new Set([...b, ...held]))
    setHeld(new Set())
  }
  function reset() { setHeld(new Set()); setBooked(new Set(PRESOLD)) }

  const total = held.size
  const price = [...held].reduce((sum, id) => sum + (PREMIUM.has(id[0]) ? 350 : 200), 0)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · pick seats for the 2 PM show — click to hold, confirm to book</div>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ background: 'var(--ink)', color: '#fff', fontFamily: 'IBM Plex Mono', fontSize: 11, padding: '3px 0', borderRadius: 4, maxWidth: 340, margin: '0 auto' }}>S C R E E N</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', marginBottom: 10 }}>
        {MAP_ROWS.map((r) => (
          <div key={r} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, width: 14, color: '#7c8aa5' }}>{r}</span>
            {MAP_COLS.map((c) => {
              const id = r + c
              const isBooked = booked.has(id)
              const isHeld = held.has(id)
              const prem = PREMIUM.has(r)
              return (
                <button key={id} onClick={() => toggle(id)} disabled={isBooked} style={{
                  width: 30, height: 28, borderRadius: 5, fontSize: 9, fontFamily: 'IBM Plex Mono',
                  cursor: isBooked ? 'not-allowed' : 'pointer',
                  border: '1px solid ' + (prem ? '#C9A227' : 'var(--line)'),
                  background: isBooked ? '#FDECEC' : isHeld ? '#FFF1D6' : prem ? '#FFFBEF' : '#fff',
                  color: isBooked ? '#c66' : 'var(--ink)',
                  opacity: isBooked ? 0.6 : 1,
                }}>{isBooked ? '✕' : c}</button>
              )
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontFamily: 'IBM Plex Mono', fontSize: 10.5, color: '#7c8aa5', marginBottom: 10, justifyContent: 'center' }}>
        <span>⬜ available</span><span>🟨 your hold</span><span>🟥 booked</span><span style={{ color: '#C9A227' }}>▦ premium ₹350</span><span>regular ₹200</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="act" onClick={confirm} disabled={total === 0}>confirm {total} seat{total !== 1 ? 's' : ''} · ₹{price}</button>
        <button className="ghost act" onClick={reset}>reset</button>
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono' }}>held: {[...held].sort().join(', ') || '—'}</span>
      </div>
      <div className="statbar" style={{ display: 'block', marginTop: 8 }}>
        <span style={{ fontSize: 12.5 }}>
          Holding a seat is a TEMPORARY claim (yellow) — in a real system it expires in ~5 min if you don\'t pay.
          Confirm turns holds into permanent bookings (red ✕). Premium rows cost more: pricing is a property of
          the SeatType, not a hardcoded if.
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: the double-booking race ============ */
const NAIVE_STEPS = [
  { t: 't1', you: 'read seat C4 → AVAILABLE ✓', other: '', note: 'You check: C4 is free. So far so good.' },
  { t: 't2', you: '', other: 'read seat C4 → AVAILABLE ✓', note: 'At the SAME instant, the other user also reads C4 as free. Neither knows about the other.' },
  { t: 't3', you: 'write C4 = BOOKED (you) ✓', other: '', note: 'You write your booking. Success! Ticket issued.' },
  { t: 't4', you: '', other: 'write C4 = BOOKED (them) ✓', other2: true, note: 'They ALSO write. The second write just overwrites — no check. Success! Ticket issued.' },
  { t: '💥', you: 'TICKET: C4', other: 'TICKET: C4', boom: true, note: '💥 DOUBLE BOOKED. Two people, two tickets, ONE seat. They meet at the cinema. This is the bug that defines the whole problem.' },
]
const HOLD_STEPS = [
  { t: 't1', you: 'tryHold(C4): compare-and-set AVAILABLE→HELD ✓', other: '', note: 'You attempt an ATOMIC hold: "set C4 to HELD, but only if it is still AVAILABLE." It succeeds — C4 is now yours for 5 minutes.' },
  { t: 't2', you: '', other: 'tryHold(C4): compare-and-set AVAILABLE→HELD ✗', otherFail: true, note: 'The other user attempts the SAME atomic hold a moment later. But C4 is no longer AVAILABLE — it is HELD. The compare-and-set FAILS. They are told instantly: "seat just taken, pick another."' },
  { t: 't3', you: 'pay within 5 min → C4 = BOOKED ✓', other: '', note: 'You pay before the hold expires. The hold becomes a permanent booking.' },
  { t: '✅', you: 'TICKET: C4', other: 'chose D2 instead', ok: true, note: '✅ One seat, one ticket. The race was decided by a single atomic operation — the loser never even got a hold.' },
]

function RaceSim() {
  const [mode, setMode] = useState('naive')
  const [step, setStep] = useState(0)
  const steps = mode === 'naive' ? NAIVE_STEPS : HOLD_STEPS
  const shown = steps.slice(0, step)
  const done = step >= steps.length

  function pick(m) { setMode(m); setStep(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · two users, one seat (C4), same instant — with and without an atomic hold</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        <button className={mode === 'naive' ? 'on' : ''} onClick={() => pick('naive')}>❌ naive: read-then-write</button>
        <button className={mode === 'hold' ? 'on' : ''} onClick={() => pick('hold')}>✅ atomic hold (compare-and-set)</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#2D5BFF', fontWeight: 700, textAlign: 'center' }}>🔵 You</div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#D33', fontWeight: 700, textAlign: 'center' }}>🔴 Other user</div>
        {shown.map((s, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div style={{
              gridColumn: s.boom || s.ok ? '1 / 2' : '1 / 2',
              fontFamily: 'IBM Plex Mono', fontSize: 11, padding: '5px 7px', borderRadius: 5, minHeight: 14,
              background: s.you ? (s.ok ? '#EAF7EF' : s.boom ? '#FDECEC' : '#E5EBFF') : 'transparent',
              border: s.you ? '1px solid var(--line)' : 'none',
            }}>{s.you}</div>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11, padding: '5px 7px', borderRadius: 5, minHeight: 14,
              background: s.other ? (s.boom ? '#FDECEC' : s.otherFail || s.ok ? '#F4F3EE' : s.other2 ? '#FDECEC' : '#FDE8E8') : 'transparent',
              border: s.other ? '1px solid var(--line)' : 'none',
              textDecoration: s.otherFail ? 'line-through' : 'none',
              opacity: s.otherFail ? 0.7 : 1,
            }}>{s.other}</div>
          </div>
        ))}
      </div>
      {shown.length > 0 && (
        <div className="statbar" style={{ display: 'block', marginBottom: 8, background: shown[shown.length - 1].boom ? '#FDECEC' : shown[shown.length - 1].ok ? '#EAF7EF' : undefined }}>
          <span style={{ fontSize: 12.5 }}>{shown[shown.length - 1].note}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        {!done
          ? <button className="act" onClick={() => setStep((s) => s + 1)}>{step === 0 ? '▶ run the race' : 'next step →'}</button>
          : <button className="ghost act" onClick={() => setStep(0)}>replay</button>}
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'Where does a seat\'s AVAILABLE / BOOKED status live in the model?',
    o: ['In a global boolean array', 'On the Movie', 'On a ShowSeat(show, seat, state): the SAME seat has different availability for each show, so status is a property of the seat-FOR-A-SHOW, not the seat itself', 'On the physical Seat object'], a: 2,
    e: 'Seat C4 is one piece of furniture but "is C4 free?" has a different answer per show. Availability is per (show, seat), so it belongs on a ShowSeat — the physical Seat just describes location and type.',
    w: { 0: 'A global array loses which show/screen and can\'t scale past one screen.',
         1: 'A movie has many shows across many screens; it can\'t hold one seat\'s status.',
         3: 'Put status on Seat and the 10 AM booking would mark C4 taken for the 6 PM show too — same furniture, wrong scope.' },
    r: { id: 's3', label: 'Section 3 — Seat vs ShowSeat' } },
  { q: 'Movie vs Show — the relationship is…',
    o: ['They\'re the same thing', 'A Show is one screening: a Movie playing on a specific Screen at a specific time. One Movie has MANY Shows; a Show references one Movie and one Screen (Day 10\'s noun analysis)', 'A Show contains many Movies', 'A Movie is a kind of Show'], a: 1,
    e: 'Movie is the film (title, duration, rating); Show is an event (this movie, this screen, this 2 PM slot). Booking attaches to a Show, not a Movie — you book the 2 PM Inception, not "Inception".',
    w: { 0: 'Collapse them and you can\'t represent the same film at 10 AM and 2 PM.',
         2: 'A single screening plays one film, not many.',
         3: 'A movie is-a show fails Day 3\'s is-a test — they\'re different concepts.' },
    r: { id: 's4', label: 'Section 4 — the entity model' } },
  { q: 'Two users click seat C4 for the same show at the same instant. With a naive read-then-write, what happens?',
    o: ['One booking is randomly dropped', 'The second user gets an error', 'The database prevents it automatically', 'Both read "AVAILABLE", both write "BOOKED", both get a ticket — a DOUBLE BOOKING; check-then-act on shared state is the same race as Day 21, and it is THE defining problem of this system'], a: 3,
    e: 'Read-then-write with no atomicity lets both reads see "free" before either write lands. The second write just overwrites. Two tickets, one seat — exactly the check-then-act race, and the whole design exists to prevent it.',
    w: { 0: 'Neither is dropped; both succeed, which is the disaster.',
         1: 'Nothing tells the second user "taken" — both reads happened before either write.',
         2: 'A plain table write does NOT prevent this without a constraint or lock — that\'s the work you must design.' },
    r: { id: 's6', label: 'Section 6 — the double-booking race' } },
  { q: 'The standard fix that lets a user pick seats, then pay, without others grabbing them meanwhile?',
    o: ['Disable other users while one is booking', 'Make users pay before seeing seats', 'A temporary HOLD/LOCK with expiry: AVAILABLE →(atomic)→ HELD (5 min) → BOOKED on payment, or back to AVAILABLE if the timer expires — a state machine with a TIMED transition', 'Book instantly on click, refund if they don\'t pay'], a: 2,
    e: 'The hold reserves the seat atomically for a short window so the user can pay, then converts to a booking or auto-releases on expiry. It\'s the seat lifecycle: a state machine where one transition fires on a timer.',
    w: { 0: 'You can\'t freeze all other users — thousands book concurrently.',
         1: 'Forcing payment before seat selection is a terrible UX and still races on the seat.',
         3: 'Instant-book-then-refund pollutes the system with phantom bookings and refund churn.' },
    r: { id: 's5', label: 'Section 5 — the seat lifecycle' } },
  { q: 'An atomic hold is best expressed as which operation?',
    o: ['A single compare-and-set: "set state to HELD only if it is currently AVAILABLE", which succeeds for exactly one racer and fails for the other — the check and the set are ONE indivisible step', 'A try-catch around the write', 'A sleep then a write', 'if (seat.isAvailable()) seat.hold();'], a: 0,
    e: 'The bug is the gap between the check and the act. Compare-and-set closes the gap: the test and the mutation happen atomically, so only one of two simultaneous racers wins, and the loser is told immediately.',
    w: { 1: 'A try-catch reacts to failures; it doesn\'t make the check-and-set atomic.',
         2: 'Sleeping changes timing but the race still exists after the sleep.',
         3: 'That\'s TWO operations with a gap between them — the exact race, just in code.' },
    r: { id: 's7', label: 'Section 7 — atomic holds' } },
  { q: 'Pessimistic vs optimistic locking for seat booking — the honest framing?',
    o: ['A trade-off: pessimistic (lock the row while held) is simple and safe under high contention but holds locks; optimistic (version/CAS, retry on conflict) scales when conflicts are rare — name the trade and pick per expected contention', 'Optimistic is always better', 'Pessimistic is obsolete', 'They produce different final data'], a: 0,
    e: 'Both prevent double-booking; they differ in cost. Hot seats (front row, opening night) have high contention → pessimistic or a hold table shines; most seats rarely conflict → optimistic CAS avoids holding locks. Naming the trade is the senior move.',
    w: { 1: 'Optimistic thrashes under high contention (constant retries) — not always better.',
         2: 'Pessimistic locking is alive and well for hot rows.',
         3: 'Both yield correct final data; the difference is performance, not correctness.' },
    r: { id: 's8', label: 'Section 8 — locking strategies' } },
  { q: 'Search: "Inception in Bengaluru on Saturday." What does this query traverse?',
    o: ['The Booking table', 'All seats in the country', 'Every Movie ever made', 'City → Theatres in that city → Screens → Shows on that date whose Movie is Inception — the City◆Theatre◆Screen◆Show hierarchy is exactly what makes this query efficient'], a: 3,
    e: 'The location hierarchy (City owns Theatres own Screens host Shows) is the index for search. You narrow by city, then list shows of the movie on the date — the composition structure IS the search path.',
    w: { 0: 'Bookings are the result of choosing a show, not the search input.',
         1: 'Scanning all seats nationwide ignores the hierarchy that scopes the query.',
         2: 'The movie catalog isn\'t filtered by city/date; shows are.' },
    r: { id: 's4', label: 'Section 4 — the entity model' } },
  { q: 'A held seat\'s 5-minute timer expires before payment. What must happen, and whose job is it?',
    o: ['The user is charged anyway', 'It auto-releases HELD → AVAILABLE so others can book it — a background expiry mechanism (scheduled sweep or TTL) owns this; without it, abandoned holds permanently leak seats', 'The seat becomes BOOKED', 'Nothing — it stays held forever'], a: 1,
    e: 'The timed transition is the whole point of a hold — if it never fires, every abandoned checkout leaks a seat forever. A background sweeper or a TTL on the hold reclaims expired holds back to AVAILABLE.',
    w: { 0: 'Charging without a completed payment is fraud, not expiry handling.',
         2: 'Expiry means the user did NOT pay — it must free the seat, not book it.',
         3: 'A hold that never expires is a permanent leak — the sold-out screen that\'s actually empty.' },
    r: { id: 's5', label: 'Section 5 — the seat lifecycle' } },
]

/* ============ The page ============ */
export default function Day51() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 11 · Day 51 · Classic LLD Problems</div>
        <h1>BookMyShow — Part 1:<br />Entities, and the Seat Nobody Can Double-Book</h1>
        <p>Week 11 is the big systems. We open with movie ticketing — and it teaches two things hard: a sharp
           entity model (Movie ≠ Show, Seat ≠ ShowSeat) and the problem that defines the whole system — how do
           two people NOT book the same seat at the same instant? Today we design and frame the race; Part 2
           codes the locking. Click everything.</p>
        <div className="chips">
          {['BookMyShow', 'Movie vs Show', 'Seat vs ShowSeat', 'seat lifecycle', 'double-booking', 'atomic hold', 'locking'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What BookMyShow really is — and the one hard problem</h2>
        <p>On the surface: search movies, pick a show, choose seats, pay, get a ticket. Most of it is
          straightforward modeling. But buried inside is a single problem that the entire design bends
          around:</p>
        <Code html={`  THE SYSTEM, AND THE PROBLEM HIDING IN IT

  search → pick show → pick seats → pay → ticket      ← the easy 80%

  ┌────────────────────────────────────────────────────────┐
  │  THE HARD 20%:  10,000 people refreshing for the same    │
  │  blockbuster's front-row seats at 10:00:00 AM sharp.     │
  │  Two click seat C4 in the SAME millisecond.              │
  │  How do you guarantee EXACTLY ONE of them gets it?       │
  └────────────────────────────────────────────────────────┘

  Get the entities right (today, §3–4), model the seat's life (§5),
  then make the seat claim ATOMIC (§6–8). That's the whole interview.`} />
        <Note><strong>The shape, recognized:</strong> just like parking lot had "two gates, one spot" and the
          elevator had "which floor next?", BookMyShow has <strong>"two users, one seat"</strong>. Every classic
          has a defining problem — name it early and design toward it.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The clarifying questions</h2>
        <p>The five-minute ritual, and each answer shapes the model or flags the hard part:</p>
        <table className="matrix">
          <thead>
            <tr><th>question</th><th>typical answer</th><th>what it shapes</th></tr>
          </thead>
          <tbody>
            <tr><td>"One city or many? Many theatres?"</td><td>"Many cities, many theatres each"</td><td>City ◆ Theatre ◆ Screen hierarchy (search path)</td></tr>
            <tr><td>"Assigned seats or general admission?"</td><td>"Assigned — users pick exact seats"</td><td>ShowSeat per (show, seat) — the core entity</td></tr>
            <tr><td>"Can a user hold seats while paying?"</td><td>"Yes, ~5-minute hold"</td><td>the seat lifecycle (timed state machine)</td></tr>
            <tr><td>"What about the double-booking case?"</td><td>"Must be impossible"</td><td>atomic claim — the defining problem</td></tr>
            <tr><td>"Seat tiers / pricing?"</td><td>"Regular, premium, recliner"</td><td>SeatType with price (not hardcoded ifs)</td></tr>
            <tr><td>"Payments in scope today?"</td><td>"Assume a payment gateway exists"</td><td>scoped out — a port for Part 2</td></tr>
          </tbody>
        </table>
        <p>Noun-verb pass survivors: <em>Movie, Show, Theatre, Screen, Seat, ShowSeat, Booking, User, City,
          SeatType</em>. Filtered out (Day 10): <em>"ticket"</em> is the OUTPUT of a booking (a Booking +
          payment), <em>"the system"</em> is the god-noun, <em>"snacks/offers"</em> are out of scope.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🎬 The entity insight: Seat ≠ ShowSeat (and Movie ≠ Show)</h2>
        <p>This is the modeling trap that separates a clean design from a tangled one. The same physical seat
          has a <em>different</em> availability for every show. Switch shows and watch:</p>
        <SeatVsShowSeat />
        <Good><strong>What you should notice:</strong> ① C4 is ONE seat but has three answers to "are you
          free?" — so availability can\'t live on <C>Seat</C>. ② The physical <C>Seat</C> (row, number, type,
          which Screen) is shared; the <C>ShowSeat</C> (state for a specific show) is per-show. ③ Same lesson
          as Movie vs Show: the <em>film</em> is shared, the <em>screening</em> is the bookable thing. Mixing
          these two levels is the #1 BookMyShow modeling mistake.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The full entity model + class diagram</h2>
        <Code html={`<span class="kw">public record</span> Movie(String id, String title, Duration runtime, String rating) {}
<span class="kw">public record</span> Seat(String id, <span class="kw">int</span> row, <span class="kw">int</span> col, SeatType type) {}   <span class="cm">// PHYSICAL — belongs to a Screen</span>
<span class="kw">public enum</span> SeatType { REGULAR, PREMIUM, RECLINER;
    <span class="kw">public</span> Money price() { … }                       <span class="cm">// price is a property of the TYPE (no hardcoded ifs)</span>
}
<span class="kw">public enum</span> SeatStatus { AVAILABLE, HELD, BOOKED }

<span class="kw">public class</span> ShowSeat {                              <span class="cm">// ★ the core entity: a seat FOR A SHOW</span>
    <span class="kw">private final</span> Show show;
    <span class="kw">private final</span> Seat seat;
    <span class="kw">private</span> SeatStatus status = SeatStatus.AVAILABLE;  <span class="cm">// availability lives HERE, per show</span>
    <span class="kw">private</span> Instant heldUntil;                        <span class="cm">// the hold's expiry timestamp</span>
}

<span class="kw">public class</span> Show {                                   <span class="cm">// one screening</span>
    <span class="kw">private final</span> Movie movie;                        <span class="cm">// the film…</span>
    <span class="kw">private final</span> Screen screen;                       <span class="cm">// …on this screen…</span>
    <span class="kw">private final</span> Instant startTime;                   <span class="cm">// …at this time</span>
    <span class="kw">private final</span> List&lt;ShowSeat&gt; seats;                 <span class="cm">// one ShowSeat per physical seat</span>
}`} />
        <Code html={`  THE STRUCTURE (location hierarchy = the search path)

  City ◆────* Theatre ◆────* Screen ◆────* Seat        ← PHYSICAL world (composition)
                                  │              ▲
                                  │ hosts        │ wraps each Seat for one Show
                                  ▼              │
   Movie *────hosts────▶ Show ◆────────────* ShowSeat {status, heldUntil}
                          │                       ▲
                          │ a screening           │ booked seats
                          ▼                        │
                       Booking {user, show, seats[], status} ──▶ Payment (Part 2)

  search "Inception, Bengaluru, Sat" = City → Theatres → Screens → Shows(movie,date)`} />
        <p>Read it aloud (Week-2 style): "a City owns Theatres own Screens own physical Seats; a Movie is
          screened as many Shows; each Show wraps its screen\'s seats as ShowSeats that carry availability; a
          Booking ties a user to chosen ShowSeats." If you can say that sentence, you can draw this in five
          minutes.</p>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The seat lifecycle: a state machine with a timed transition</h2>
        <p>Week 10 taught state machines; here\'s a small but crucial one. A ShowSeat moves
          AVAILABLE → HELD → BOOKED — and the HELD → AVAILABLE edge fires on a <strong>timer</strong>, not a
          user action:</p>
        <Code html={`  SHOWSEAT LIFECYCLE

                 tryHold() [atomic]            pay()
   AVAILABLE ───────────────────▶ HELD ───────────────▶ BOOKED
       ▲                           │
       │      hold expires (5 min) │   ← TIMED transition: a background
       └───────────────────────────┘     sweeper / TTL fires this, NOT a click

  · tryHold must be ATOMIC (only one racer wins) — §6–7
  · BOOKED is terminal (until refund/cancel — a Part 2 follow-up)
  · the expiry edge is what makes "reserve while I pay" safe AND
    prevents abandoned checkouts from leaking seats forever`} />
        <Warn><strong>The expiry edge is not optional.</strong> If a held seat never auto-releases, every user
          who opens the seat map and walks away locks that seat forever — and your "sold out" blockbuster plays
          to an empty hall. A background sweeper (or a TTL on the hold) must reclaim <C>HELD</C> seats whose
          <C> heldUntil</C> has passed. This is the timed transition from Week 10, now load-bearing.</Warn>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🪑 Play: the seat map</h2>
        <p>The everyday flow: pick seats (they go to your hold), then confirm. Premium rows cost more —
          because price lives on the SeatType:</p>
        <SeatMap />
        <Good><strong>What you should notice:</strong> ① Holding is reversible and temporary (click again to
          release); booking is permanent. ② Pricing differs by row because it\'s a SeatType property, not an
          if-ladder. ③ Booked seats (✕) can\'t be selected — but the interesting question is what happens when
          TWO people try to hold the same free seat at once. That\'s next.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The defining problem: the double-booking race</h2>
        <p>Everything so far was modeling. Here is the problem the whole system exists to solve. Two users,
          one free seat, the same instant — and a naive "check if free, then book it" is a
          <strong> check-then-act race</strong> (Day 21, in a cinema seat):</p>
        <Code html={`  THE RACE (naive read-then-write)

  User A: read C4 → AVAILABLE ─┐
  User B: read C4 → AVAILABLE ─┤  both saw "free" BEFORE either wrote
  User A: write C4 = BOOKED ────┤
  User B: write C4 = BOOKED ────┘  second write just overwrites — no recheck
  ───────────────────────────────
  RESULT: two tickets, one seat. 💥  They meet in row C, seat 4.

  THE FIX: make the claim ATOMIC — check-and-set in ONE indivisible step:
      "set C4 to HELD, but ONLY IF it is still AVAILABLE"
  Exactly one of two simultaneous racers succeeds; the other is told instantly.`} />
        <Note><strong>Atomic hold = compare-and-set.</strong> The bug is the <em>gap</em> between the check and
          the act. Close the gap and the race vanishes: a single operation tests "still AVAILABLE?" and flips
          to HELD together, so two simultaneous attempts can\'t both win. In Part 2 this becomes a DB row lock,
          a conditional UPDATE, or a versioned CAS — but the <em>idea</em> is one indivisible claim.</Note>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>⚔️ Play: the race, with and without an atomic hold</h2>
        <p>Step through both worlds. Same two users, same seat, same instant — only the claim mechanism
          differs:</p>
        <RaceSim />
        <Good><strong>What you should notice:</strong> ① Naive mode: both reads see "available" before either
          write, so both succeed — the double booking. ② Atomic mode: the first compare-and-set flips C4 to
          HELD; the second finds it no longer AVAILABLE and fails instantly — the loser never even gets a hold.
          ③ The entire difference is collapsing check-then-act into one indivisible step. That one idea is the
          heart of this problem.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Locking strategies: the trade-off to name out loud</h2>
        <p>"Make it atomic" has several implementations, and an interviewer wants to hear you weigh them — not
          recite one:</p>
        <table className="matrix">
          <thead>
            <tr><th>approach</th><th>how</th><th>best when</th></tr>
          </thead>
          <tbody>
            <tr><td>Pessimistic lock</td><td>lock the seat row while held (SELECT … FOR UPDATE)</td><td>high contention (hot seats, opening night)</td></tr>
            <tr><td>Optimistic (CAS / version)</td><td>conditional update; retry on version conflict</td><td>low contention (most seats, most of the time)</td></tr>
            <tr><td>Hold table + TTL</td><td>insert a hold row with expiry; unique constraint per (show, seat)</td><td>the "reserve while paying" UX — the common real design</td></tr>
            <tr><td>Single-writer queue</td><td>serialize claims per show through one consumer</td><td>extreme contention; simplest correctness, lower throughput</td></tr>
          </tbody>
        </table>
        <Warn><strong>The flag to plant (deep dive = Month 4):</strong> "I\'d use a temporary hold with an
          atomic claim — a unique constraint or conditional update on (show, seat) so only one hold can exist —
          plus a TTL/sweeper to expire it. Under heavy contention on hot seats I\'d lean pessimistic; for the
          common case, optimistic CAS avoids holding locks. We can pressure-test the choice in the concurrency
          deep dive." That one paragraph is what this whole problem is testing.</Warn>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>The patterns map (Week 11, same habit)</h2>
        <table className="matrix">
          <thead>
            <tr><th>concern</th><th>tool</th><th>from</th></tr>
          </thead>
          <tbody>
            <tr><td>location hierarchy + search path</td><td>City ◆ Theatre ◆ Screen composition</td><td>Days 6 · 28</td></tr>
            <tr><td>Movie vs Show, Seat vs ShowSeat</td><td>noun analysis — shared thing vs bookable event</td><td>Day 10</td></tr>
            <tr><td>seat availability per show</td><td>ShowSeat (seat-for-a-show)</td><td>Day 10</td></tr>
            <tr><td>seat lifecycle + hold expiry</td><td>state machine with a timed transition</td><td>Days 34 · 46</td></tr>
            <tr><td>seat tiers &amp; pricing</td><td>SeatType with price (Strategy for dynamic pricing later)</td><td>Days 19 · 31</td></tr>
            <tr><td>two users, one seat</td><td>atomic claim — compare-and-set</td><td>Day 21 → W13</td></tr>
            <tr><td>booking ≠ payment</td><td>Booking entity + payment port (Part 2)</td><td>Days 26 · 42</td></tr>
          </tbody>
        </table>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>Status on the physical Seat.</strong> Then booking C4 for the 10 AM show marks it taken
          for every show. Availability is per (show, seat) → it lives on ShowSeat.</Warn>
        <Warn><strong>Collapsing Movie and Show.</strong> One class can\'t represent the same film at 10 AM and
          2 PM on two screens. Movie is the film; Show is the screening; Booking attaches to the Show.</Warn>
        <Warn><strong>Naive read-then-write booking.</strong> The double-booking race — the single biggest miss
          on this problem. The claim must be ONE atomic step, not check-then-act.</Warn>
        <Warn><strong>Holds with no expiry.</strong> Abandoned checkouts leak seats forever; a "sold out" show
          plays to an empty hall. A TTL or background sweeper must reclaim expired holds.</Warn>
        <Warn><strong>Hardcoded seat pricing.</strong> <C>if (row &lt; 3) price = 350</C> scatters policy.
          Price belongs on SeatType (and dynamic/surge pricing is a Strategy later).</Warn>
        <Warn><strong>Booking IS the payment.</strong> A booking can exist as PENDING before payment and become
          CONFIRMED after — conflating them means a failed payment leaves a confirmed ticket. Keep them
          separate (Part 2).</Warn>
      </section>

      {/* 12 */}
      <section id="s12">
        <div className="sec-label">Section 12</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Two modeling splits:</strong> Movie (film) ≠ Show (screening); Seat (physical, on a Screen) ≠ ShowSeat (availability for one show). Booking attaches to a Show via ShowSeats.</li>
          <li><strong>Location hierarchy:</strong> City ◆ Theatre ◆ Screen ◆ Seat — and it\'s also the search path (city → theatres → screens → shows of a movie on a date).</li>
          <li><strong>Seat lifecycle:</strong> AVAILABLE →(atomic tryHold)→ HELD →(pay)→ BOOKED, with HELD →(timer)→ AVAILABLE. The expiry edge is load-bearing — without it, holds leak seats.</li>
          <li><strong>The defining problem:</strong> two users, one seat = check-then-act race (Day 21). Fix = atomic claim (compare-and-set / conditional update / unique constraint on (show, seat)).</li>
          <li><strong>Locking trade-off (name it):</strong> pessimistic for hot/high-contention seats; optimistic CAS for the common low-contention case; hold-table+TTL for the reserve-while-paying UX.</li>
          <li><strong>Pricing</strong> on SeatType, not hardcoded; dynamic pricing is a Strategy later.</li>
          <li><strong>Plant flags:</strong> hold expiry mechanism, payment as a separate step/port, concurrency deep-dive for Month 4.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Why not just use a database unique constraint and call it done?"'>
          <p>You should use one — a unique constraint (or a conditional UPDATE) on (show, seat) for the BOOKED
            state is a clean, correct atomic guarantee at the storage layer. But it isn\'t the whole answer:
            you still need the HOLD phase (so users can pay without losing seats), the expiry mechanism (so
            abandoned holds don\'t leak), and a graceful "seat just taken" path for the loser. The constraint
            prevents the double-write; the design around it provides the UX. Saying "the constraint is my last
            line of defense, the hold is my first" is the strong framing.</p>
        </Reveal>
        <Reveal summary='Q: "A user selects 3 seats. Must all 3 succeed or none?"'>
          <p>Yes — it\'s an all-or-nothing booking (atomicity at the booking level, not just per seat). Acquire
            holds on all three; if ANY hold fails, release the ones you got and tell the user "some seats were
            just taken." Never leave them with 2 of 3 and a charge. This is a small transaction: the unit of
            work is the whole seat selection. Bonus: acquire holds in a consistent order (e.g. sorted by seat
            id) to avoid deadlocks when two users select overlapping seats — a nice Month-4 nod.</p>
        </Reveal>
        <Reveal summary='Q: "How does seat selection stay live — grey out seats others just took?"'>
          <p>Observer/push (Day 32) at the system level: when a seat flips to HELD/BOOKED, the show\'s seat-map
            subscribers get an event and update. In practice a WebSocket/SSE channel per show pushes seat-status
            deltas to everyone viewing that map. The design point: seat status changes are EVENTS, and the live
            map is just another subscriber — the same publish-don\'t-poll lesson from parking-lot boards and
            elevator displays, now over the network.</p>
        </Reveal>
        <Reveal summary='Q: "Where does dynamic / surge pricing fit (weekend, prime-time, demand)?"'>
          <p>A PricingStrategy fed by the show and seat (Day 31), exactly like the parking-lot pricing family.
            Base price comes from SeatType; a strategy can multiply by day-of-week, time slot, or current
            demand (% of seats sold). It plugs in at the booking-total step and is swappable per theatre or
            promotion — new strategy class, one wiring line. Keep the rule OUT of the seat and the booking; it
            lives in pricing, which varies independently.</p>
        </Reveal>
        <Reveal summary='Q: "What stops a bot from holding every seat to deny others?"'>
          <p>Layered, and worth naming even if out of scope: per-user hold LIMITS (max N held seats at once),
            short hold TTLs (so a held-and-abandoned seat frees fast), rate limiting on the hold endpoint, and
            CAPTCHA/auth for high-demand shows. The design hook is that holds are first-class objects with an
            owner and expiry, so policies (limit per user, expire fast) attach to them naturally. Recognizing
            that the hold mechanism is also an abuse surface is a senior signal.</p>
        </Reveal>
        <Reveal summary='Q: "Single datacenter assumed. What breaks if seats span regions?"'>
          <p>The atomic claim gets harder: a single-node lock or DB constraint no longer covers seats whose
            authoritative record lives in another region. The usual answer is to keep each show\'s seat
            inventory owned by ONE authoritative partition (shard by show) so all claims for a given show go to
            one place and the single-writer guarantee holds — you don\'t distribute the claim, you route to its
            owner. Cross-region is a routing problem, not a distributed-lock problem, if you partition by show.
            (Full treatment is distributed systems territory; the framing is the win.)</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s13">
        <div className="sec-label">Section 13 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 51 complete?</strong> Homework: on paper, 25 minutes — ① the entity model with
        multiplicities (City ◆ Theatre ◆ Screen ◆ Seat; Movie → Show → ShowSeat; Booking), ② the ShowSeat
        state machine with the timed expiry edge, ③ write the double-booking race as a sequence diagram, then
        write the FIX as a single atomic compare-and-set, ④ list three locking strategies with one trade-off
        each. Bonus: explain to a rubber duck why seat status can\'t live on the physical Seat.
        <br /><br />
        Next: <strong>Day 52 — BookMyShow, Part 2</strong>: the code — the atomic hold in real Java, the
        booking flow (PENDING → CONFIRMED), payment as a port, the expiry sweeper, and the all-or-nothing
        multi-seat transaction.
      </div>
    </div>
  )
}
