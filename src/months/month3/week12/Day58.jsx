import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: matching — nearest available driver ============ */
const G = 7
const RIDER = { x: 3, y: 3 }
const INIT_DRIVERS = [
  { id: 'D1', x: 1, y: 1, status: 'available' },
  { id: 'D2', x: 5, y: 2, status: 'ontrip' },
  { id: 'D3', x: 4, y: 4, status: 'available' },
  { id: 'D4', x: 0, y: 5, status: 'available' },
  { id: 'D5', x: 6, y: 6, status: 'ontrip' },
  { id: 'D6', x: 2, y: 5, status: 'available' },
]
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

function MatchingMap() {
  const [drivers, setDrivers] = useState(INIT_DRIVERS)
  const [assigned, setAssigned] = useState(null)
  const [log, setLog] = useState('🧍 rider at (3,3) · tap "request ride" to match the nearest AVAILABLE driver')

  function request() {
    const avail = drivers.filter((d) => d.status === 'available')
    if (avail.length === 0) { setLog('🚫 no available drivers nearby → "no cabs available right now"'); return }
    const best = avail.reduce((a, b) => (dist(b, RIDER) < dist(a, RIDER) ? b : a))
    setDrivers((ds) => ds.map((d) => (d.id === best.id ? { ...d, status: 'ontrip' } : d)))
    setAssigned(best.id)
    setLog(`✅ matched ${best.id} at (${best.x},${best.y}), distance ${dist(best, RIDER)} → assigned (now ON_TRIP). Other available drivers stay free for the next rider.`)
  }
  function reset() { setDrivers(INIT_DRIVERS); setAssigned(null); setLog('🧍 rider at (3,3) · tap "request ride" to match the nearest AVAILABLE driver') }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · find &amp; assign the nearest AVAILABLE driver — on-trip drivers are skipped</div>
      <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${G}, 34px)`, gap: 2, marginBottom: 10 }}>
        {[...Array(G * G)].map((_, idx) => {
          const x = idx % G, y = Math.floor(idx / G)
          const isRider = x === RIDER.x && y === RIDER.y
          const d = drivers.find((dr) => dr.x === x && dr.y === y)
          return (
            <div key={idx} style={{
              width: 34, height: 34, border: '1px solid var(--line)', borderRadius: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              background: isRider ? '#E5EBFF' : d && d.id === assigned ? '#FFF1D6' : '#fff',
              outline: d && d.id === assigned ? '2px solid var(--amber)' : 'none',
            }}>
              {isRider ? '🧍' : d ? (d.status === 'available' ? '🟢' : '🔴') : ''}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, fontFamily: 'IBM Plex Mono', fontSize: 10.5, color: '#7c8aa5', marginBottom: 8, flexWrap: 'wrap' }}>
        <span>🧍 rider</span><span>🟢 available</span><span>🔴 on trip</span><span>🟨 assigned</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className="act" onClick={request}>🚕 request ride</button>
        <button className="ghost act" onClick={reset}>reset</button>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        <span style={{ fontSize: 12.5 }}>{log}</span>
      </div>
      <Good style={{ marginTop: 10 }}><span style={{ fontSize: 12.5 }}>Request a few times: each match takes the nearest 🟢 (not the nearest driver overall — on-trip ones are skipped) and flips it to 🔴. Run out and you get "no cabs available". This naive version SCANS every driver — fine for 6, fatal for 600,000 (§4).</span></Good>
    </div>
  )
}

/* ============ Interactive 2: the trip lifecycle ============ */
function tripStep(state, ev) {
  switch (ev) {
    case 'assign':
      if (state === 'REQUESTED') return { next: 'DRIVER_ASSIGNED', ok: true, msg: '✓ REQUESTED → DRIVER_ASSIGNED. A driver accepted; the rider sees the car approaching.' }
      return { next: state, ok: false, msg: '⛔ a driver is only assigned from REQUESTED. Refused.' }
    case 'arrive':
      if (state === 'DRIVER_ASSIGNED') return { next: 'DRIVER_ARRIVED', ok: true, msg: '✓ DRIVER_ASSIGNED → DRIVER_ARRIVED. The car is at the pickup point.' }
      return { next: state, ok: false, msg: '⛔ can only arrive after being assigned. Refused.' }
    case 'start':
      if (state === 'DRIVER_ARRIVED') return { next: 'IN_PROGRESS', ok: true, msg: '✓ DRIVER_ARRIVED → IN_PROGRESS. Rider on board, meter running (fare in Part 2).' }
      return { next: state, ok: false, msg: '⛔ can\'t start the trip before the driver has arrived. Refused — no skipping states.' }
    case 'end':
      if (state === 'IN_PROGRESS') return { next: 'COMPLETED', ok: true, msg: '✓ IN_PROGRESS → COMPLETED. Drop-off done; driver returns to AVAILABLE for the next match.' }
      return { next: state, ok: false, msg: '⛔ only an in-progress trip can end. Refused.' }
    case 'cancel':
      if (['REQUESTED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED'].includes(state)) return { next: 'CANCELLED', ok: true, msg: '✓ → CANCELLED. Allowed before the trip starts (a late cancel after assignment may incur a fee — a policy). The driver is freed back to AVAILABLE.' }
      return { next: state, ok: false, msg: '⛔ can\'t cancel an IN_PROGRESS trip — it must be COMPLETED. Refused.' }
    default: return { next: state, ok: false, msg: '' }
  }
}
const TRIP_STATES = ['REQUESTED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

function TripLifecycle() {
  const [state, setState] = useState('REQUESTED')
  const [log, setLog] = useState('Trip created → REQUESTED. Matching a driver…')

  function fire(ev) {
    const r = tripStep(state, ev)
    setState(r.next); setLog(r.msg)
  }
  const terminal = state === 'COMPLETED' || state === 'CANCELLED'

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the trip state machine — only legal transitions fire; states never skip</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
        {TRIP_STATES.map((s) => (
          <span key={s} className="chip" style={{
            fontFamily: 'IBM Plex Mono', fontSize: 10.5,
            background: s === state ? '#FFF1D6' : '#fff',
            outline: s === state ? '2px solid var(--amber)' : 'none', fontWeight: s === state ? 700 : 400,
          }}>{s === state ? '▶ ' : ''}{s}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" style={{ fontSize: 12 }} onClick={() => fire('assign')}>assign driver</button>
        <button className="act" style={{ fontSize: 12 }} onClick={() => fire('arrive')}>driver arrives</button>
        <button className="act" style={{ fontSize: 12 }} onClick={() => fire('start')}>start trip</button>
        <button className="act" style={{ fontSize: 12 }} onClick={() => fire('end')}>end trip</button>
        <button className="ghost act" style={{ fontSize: 12, borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => fire('cancel')}>cancel</button>
        <button className="ghost act" style={{ fontSize: 12 }} onClick={() => { setState('REQUESTED'); setLog('Trip created → REQUESTED. Matching a driver…') }}>reset</button>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        <span style={{ fontSize: 12.5 }}>{log}{terminal && ' (terminal state — reset to run again)'}</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: the spatial index ============ */
const SG = 6
const SI_DRIVERS = [
  [0, 0], [1, 0], [4, 0], [5, 1], [0, 2], [2, 2], [3, 2], [5, 2],
  [1, 3], [2, 3], [4, 3], [0, 4], [3, 4], [5, 4], [2, 5], [4, 5],
].map(([x, y], i) => ({ id: 'd' + i, x, y }))
const SI_RIDER = { x: 2, y: 3 }

function SpatialIndex() {
  const [mode, setMode] = useState('naive')
  // grid mode examines rider cell + 8 neighbors
  const inNeighborhood = (d) => Math.abs(d.x - SI_RIDER.x) <= 1 && Math.abs(d.y - SI_RIDER.y) <= 1
  const examined = mode === 'naive' ? SI_DRIVERS.length : SI_DRIVERS.filter(inNeighborhood).length

  return (
    <div className="panel">
      <div className="ptitle">Live demo · why "scan every driver" dies at scale — and how a grid index fixes it</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        <button className={mode === 'naive' ? 'on' : ''} onClick={() => setMode('naive')}>naive scan (check all)</button>
        <button className={mode === 'grid' ? 'on' : ''} onClick={() => setMode('grid')}>grid index (check nearby cells)</button>
      </div>
      <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${SG}, 34px)`, gap: 2, marginBottom: 10 }}>
        {[...Array(SG * SG)].map((_, idx) => {
          const x = idx % SG, y = Math.floor(idx / SG)
          const isRider = x === SI_RIDER.x && y === SI_RIDER.y
          const d = SI_DRIVERS.find((dr) => dr.x === x && dr.y === y)
          const neighborhoodCell = mode === 'grid' && Math.abs(x - SI_RIDER.x) <= 1 && Math.abs(y - SI_RIDER.y) <= 1
          const checked = d && (mode === 'naive' || inNeighborhood(d))
          return (
            <div key={idx} style={{
              width: 34, height: 34, border: '1px solid var(--line)', borderRadius: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              background: isRider ? '#E5EBFF' : neighborhoodCell ? '#EAF7EF' : '#fff',
            }}>
              {isRider ? '🧍' : d ? (checked ? '🔍' : '🚗') : ''}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, fontFamily: 'IBM Plex Mono', fontSize: 10.5, color: '#7c8aa5', marginBottom: 8, flexWrap: 'wrap' }}>
        <span>🧍 rider</span><span>🔍 examined</span><span>🚗 skipped</span><span style={{ color: 'var(--green)' }}>▒ searched cells</span>
      </div>
      <div className="statbar" style={{ display: 'block', background: mode === 'grid' ? '#EAF7EF' : '#FFF1D6' }}>
        <span style={{ fontSize: 12.5 }}>
          drivers examined: <b>{examined}</b> of {SI_DRIVERS.length}.{' '}
          {mode === 'naive'
            ? 'Naive scan checks EVERY driver — O(N). At 6 drivers it\'s fine; at 600,000 it\'s a melted server on every request.'
            : 'The grid buckets drivers by cell, so a search only looks at the rider\'s cell + its 8 neighbors — roughly O(1) for the nearby set, independent of total fleet size.'}
        </span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'A Driver has a current availability AND a separate trip has its own progress. How are these modeled?',
    o: ['One big status field on Driver', 'TWO small state machines: Driver status (AVAILABLE / ON_TRIP / OFFLINE) and Trip lifecycle (REQUESTED → ASSIGNED → ARRIVED → IN_PROGRESS → COMPLETED/CANCELLED) — they\'re different concerns that change at different times', 'Status on the Rider', 'A boolean isBusy'], a: 1,
    e: 'Driver availability and trip progress are distinct state machines that interact (assigning a trip flips a driver to ON_TRIP). Conflating them into one field loses the independent transitions each needs.',
    w: { 0: 'One field can\'t hold both "driver is available" and "trip is in progress" cleanly — they\'re orthogonal.',
         2: 'Riders don\'t hold driver/trip state — wrong owner.',
         3: 'A boolean collapses ON_TRIP, OFFLINE, and AVAILABLE into two values.' },
    r: { id: 's5', label: 'Section 5 — the state machines' } },
  { q: 'Finding the nearest available driver by scanning every driver is…',
    o: ['Fine — it\'s simple', 'O(N) per request — acceptable for a demo but fatal at city scale (hundreds of thousands of drivers); you need a SPATIAL INDEX (grid/geohash/quadtree) so a search only examines nearby drivers', 'Impossible', 'Best done in the database with ORDER BY'], a: 1,
    e: 'A linear scan re-checks the whole fleet on every ride request. Bucketing drivers by location (a grid cell / geohash) lets a query look only at the rider\'s cell and neighbors — roughly constant work regardless of fleet size.',
    w: { 0: 'It\'s simple AND it melts under real load — the scale is the point.',
         2: 'It\'s very possible — just slow; the fix is a spatial index.',
         3: 'A plain ORDER BY distance still scans all rows without a spatial index/extension.' },
    r: { id: 's4', label: 'Section 4 — the matching problem' } },
  { q: 'Two riders request a ride at the same instant and the SAME driver is nearest to both. What must happen?',
    o: ['Both get the driver', 'Exactly one gets the driver — assignment is an ATOMIC claim (compare-and-set the driver to ON_TRIP); the loser is re-matched to the next-nearest. It\'s the same check-then-act race as Day 21', 'The driver chooses', 'The faster network wins by luck'], a: 1,
    e: 'A driver is a shared resource two riders can claim. Without atomicity, both reads see "available" and both assign — one driver, two trips. An atomic claim lets one win; the other matcher picks the next driver.',
    w: { 0: 'One driver can\'t serve two trips — that\'s the double-booking bug in a cab.',
         2: 'Driver choice is a different feature (accept/reject); the SYSTEM must still claim atomically.',
         3: 'Relying on luck/timing is exactly the unguarded race.' },
    r: { id: 's6', label: 'Section 6 — the assignment race' } },
  { q: 'Drivers send their GPS location every few seconds. How should the system consume these and update apps?',
    o: ['Each rider polls every driver\'s location', 'Location pings update the spatial index AND publish to subscribers (the matched rider\'s app) via push/Observer — never poll; the rider subscribes to their driver\'s live position (Day 32)', 'Store pings and query on demand only', 'Drivers call each rider directly'], a: 1,
    e: 'High-frequency location updates feed the index (so matching stays fresh) and stream to the one rider tracking that driver. Observer/push beats polling: the rider\'s map updates as events arrive, not on a timer.',
    w: { 0: 'Polling every driver is the wasteful anti-pattern (Day 32) at massive scale.',
         2: 'On-demand-only loses the live tracking the rider expects.',
         3: 'Drivers shouldn\'t know about riders\' apps — the system mediates.' },
    r: { id: 's7', label: 'Section 7 — location updates' } },
  { q: 'When a trip reaches COMPLETED (or CANCELLED), what happens to the driver?',
    o: ['Nothing — the driver stays ON_TRIP', 'The driver flips back to AVAILABLE and re-enters the matching pool — the two state machines are coupled: a trip ending frees its driver', 'The driver goes OFFLINE', 'The driver is deleted'], a: 1,
    e: 'Trip and driver state machines interact: assigning a trip set the driver ON_TRIP; completing/cancelling it returns the driver to AVAILABLE so they can be matched again. Forgetting this leaks drivers out of the pool.',
    w: { 0: 'Leaving them ON_TRIP means they never get another ride — a stuck driver.',
         2: 'OFFLINE is a driver-initiated state (going home), not the result of a completed trip.',
         3: 'The driver persists across many trips.' },
    r: { id: 's5', label: 'Section 5 — coupled state machines' } },
  { q: 'A grid-based spatial index uses a fixed cell size. The tuning trade-off?',
    o: ['Cell size doesn\'t matter', 'Cells too BIG → each holds many drivers (back toward O(N) per cell); too SMALL → a search must scan many cells to cover the radius — pick a size near the typical search radius (geohash/quadtree adapt to density)', 'Smaller is always better', 'Bigger is always better'], a: 1,
    e: 'The grid trades cell count against per-cell occupancy. Big cells reduce cells to check but each is crowded; small cells are sparse but you check many to cover a radius. Quadtrees/geohashes adapt cell granularity to driver density.',
    w: { 0: 'It\'s the central tuning knob of a grid index.',
         2: 'Too small means scanning a huge neighborhood of empty cells.',
         3: 'Too big means each cell is a mini linear scan.' },
    r: { id: 's4', label: 'Section 4 — spatial index tuning' } },
  { q: 'The trip lifecycle should refuse "start trip" while still in DRIVER_ASSIGNED. Why model this strictly?',
    o: ['It doesn\'t matter', 'States must not be skipped: starting before the driver ARRIVED would bill a rider who isn\'t in the car — guarded transitions (State pattern / enum guards, Days 34/48) make illegal jumps impossible', 'To slow down the code', 'Because the database requires it'], a: 1,
    e: 'The lifecycle encodes real-world ordering: a trip can\'t start before pickup, can\'t end before it starts. Guarded transitions reject illegal events, preventing nonsensical (and billable) states.',
    w: { 0: 'Skipping ARRIVED → starting means charging for a ride that hasn\'t begun.',
         2: 'Guards are about correctness, not slowing things down.',
         3: 'It\'s a domain rule, not a DB constraint.' },
    r: { id: 's5', label: 'Section 5 — guarded transitions' } },
  { q: 'WHICH driver to pick (nearest now vs best ETA vs batch a few requests) is a decision that should be…',
    o: ['Hardcoded as "always nearest"', 'A pluggable matching/dispatch STRATEGY (Day 31) — nearest-distance today, ETA-aware or batched dispatch tomorrow, as new classes; the trip flow never changes (and Part 2 builds these)', 'Decided by the driver', 'Random'], a: 1,
    e: 'Matching policy varies (nearest, lowest-ETA accounting for traffic, batched assignment to optimize the whole fleet). Behind one MatchingStrategy interface, each is a class — exactly like the elevator\'s scheduling strategy.',
    w: { 0: 'Hardcoding nearest blocks ETA/surge-aware dispatch the business will want.',
         2: 'The system assigns; the driver accepts/declines — a different step.',
         3: 'Random ignores distance/ETA and gives terrible matches.' },
    r: { id: 's9', label: 'Section 9 — patterns map' } },
]

/* ============ The page ============ */
export default function Day58() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 12 · Day 58 · Classic LLD Problems</div>
        <h1>Cab Booking — Part 1:<br />Matching, Location, and the Trip\'s Life</h1>
        <p>Ride-hailing is the capstone big system — it folds together everything: a matching problem (find the
           nearest available driver, fast), two interacting state machines (driver + trip), a real-time location
           firehose, and the familiar race (two riders, one driver). Today we design and frame those; Part 2
           does pricing, surge, and dispatch strategies. Click everything.</p>
        <div className="chips">
          {['cab booking', 'nearest-driver matching', 'spatial index', 'trip lifecycle', 'driver state', 'assignment race', 'location updates'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What makes ride-hailing hard</h2>
        <p>"Book a cab" sounds like booking a seat — but three things make it the hardest classic of the course,
          and each is a problem you\'ve met before, now at city scale:</p>
        <Code html={`  ONE "book a cab", FOUR HARD PROBLEMS

  ① MATCHING    find the nearest AVAILABLE driver — fast, among 100,000s   → spatial index
  ② STATE       a driver's availability AND a trip's progress, evolving     → two state machines
  ③ CONCURRENCY two riders, one nearby driver, same instant                 → atomic claim (Day 21)
  ④ REAL-TIME   drivers stream GPS; riders watch the car approach           → Observer / push (Day 32)

  Part 1: model the entities, solve matching, the lifecycles, and the race.
  Part 2: pricing (base+distance+time), SURGE, and dispatch strategies.`} />
        <Note><strong>The shape, recognized:</strong> cab booking is a <em>resource-claim</em> system (like
          BookMyShow — the driver is the contended resource) + a <em>scheduling/dispatch</em> problem (like the
          elevator — "which driver next?") + <em>state machines</em> (like vending/ATM) + a new ingredient:
          <em> spatial</em> data. It\'s every Month-3 muscle at once.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The clarifying questions</h2>
        <table className="matrix">
          <thead>
            <tr><th>question</th><th>typical answer</th><th>what it shapes</th></tr>
          </thead>
          <tbody>
            <tr><td>"How do we find drivers?"</td><td>"Nearest available, fast, at scale"</td><td>spatial index (the matching core)</td></tr>
            <tr><td>"Driver accept/reject, or auto-assign?"</td><td>"Offer to nearest; they can decline"</td><td>matching → offer → fallback to next</td></tr>
            <tr><td>"Trip stages?"</td><td>"Requested → assigned → arrived → in-trip → done"</td><td>trip state machine</td></tr>
            <tr><td>"Two riders, one driver?"</td><td>"Only one can get them"</td><td>atomic assignment (the race)</td></tr>
            <tr><td>"Live driver tracking?"</td><td>"Yes — see the car approach"</td><td>location pings + push (Observer)</td></tr>
            <tr><td>"Pricing / surge?"</td><td>"Yes — but later"</td><td>Part 2 (Strategy)</td></tr>
          </tbody>
        </table>
        <p>Noun-verb survivors: <em>Rider, Driver, Trip, Vehicle, Location, MatchingService, TripService,
          spatial index</em>. Filtered (Day 10): <em>"the map"</em> is the spatial index + location data,
          <em> "the ride"</em> is a Trip, <em>"fare"</em> is Part 2, <em>"the app"</em> is the god-noun.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The entities</h2>
        <Code html={`<span class="kw">public record</span> Location(<span class="kw">double</span> lat, <span class="kw">double</span> lng) {}      <span class="cm">// a point; the spatial index buckets these</span>
<span class="kw">public record</span> Vehicle(String plate, VehicleType type) {}  <span class="cm">// type → which ride tiers it serves (Part 2)</span>

<span class="kw">public class</span> Driver {
    <span class="kw">private final</span> String id;
    <span class="kw">private final</span> Vehicle vehicle;
    <span class="kw">private</span> Location location;                 <span class="cm">// updated by GPS pings (§7)</span>
    <span class="kw">private</span> DriverStatus status;               <span class="cm">// AVAILABLE / ON_TRIP / OFFLINE — a state machine (§5)</span>
}

<span class="kw">public class</span> Trip {
    <span class="kw">private final</span> String id;
    <span class="kw">private final</span> Rider rider;
    <span class="kw">private</span> Driver driver;                     <span class="cm">// null until assigned</span>
    <span class="kw">private final</span> Location pickup, dropoff;
    <span class="kw">private</span> TripStatus status;                 <span class="cm">// REQUESTED → … → COMPLETED/CANCELLED (§5)</span>
    <span class="kw">private</span> Instant requestedAt, startedAt, endedAt;  <span class="cm">// timestamps → fare in Part 2</span>
}`} />
        <Note><strong>Driver and Trip each carry their own status</strong> — two distinct state machines that
          <em>interact</em> (assigning a Trip flips its Driver to ON_TRIP; completing it frees them). Keeping
          them separate is the key modeling call; squashing both into one field (or onto the Rider) is the
          classic tangle.</Note>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The matching problem: nearest driver, at scale</h2>
        <p>The heart of ride-hailing: given a rider\'s pickup, find the nearest <em>available</em> driver. The
          naive answer — scan every driver — is O(N) per request and dies at city scale. The real answer is a
          <strong> spatial index</strong>:</p>
        <Code html={`  WHY A SCAN DOESN'T SCALE, AND THE FIX

  naive:   for each of N drivers → compute distance → keep the min       O(N) / request
           (600,000 drivers × thousands of requests/sec = a melted server)

  spatial index:  bucket drivers by LOCATION so a query only looks nearby
     · GRID     → fixed square cells; check the rider's cell + 8 neighbors
     · GEOHASH  → encode lat/lng to a string; shared prefix = nearby
     · QUADTREE → cells subdivide where drivers are dense (adapts to a city)

  query = "drivers in my cell + adjacent cells" → ~O(1) for the nearby set,
  independent of the total fleet size. Re-bucket a driver when they move (§7).`} />
        <Warn><strong>The grid\'s tuning knob: cell size.</strong> Cells too big → each holds many drivers
          (back toward a per-cell scan); too small → a search must check many cells to cover the radius. Size
          cells near the typical search radius; a quadtree/geohash adapts granularity to density (dense downtown,
          sparse suburbs). Naming "spatial index, and here\'s the cell-size trade-off" is exactly the depth this
          problem probes.</Warn>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Two state machines: driver &amp; trip</h2>
        <Code html={`  DRIVER STATUS                         TRIP LIFECYCLE

  OFFLINE ⇄ AVAILABLE ──assigned──▶ ON_TRIP    REQUESTED ──assign──▶ DRIVER_ASSIGNED
              ▲                         │                                    │ arrive
              └──── trip ends ──────────┘         CANCELLED ◀─cancel─ DRIVER_ARRIVED
                                                  (before start)             │ start
                                                       COMPLETED ◀─end─ IN_PROGRESS

  · the two interact: assign() sets driver ON_TRIP; end()/cancel() → AVAILABLE
  · guarded transitions: can't start() before ARRIVED, can't end() before IN_PROGRESS
  · cancel allowed only before IN_PROGRESS (late cancel may incur a fee — a policy)`} />
        <p>Small enough for enum-and-guards (the elevator rung, Day 46) or full State classes if behaviour
          grows (the vending rung, Day 48) — say which and why. The non-negotiable is <strong>guarded
          transitions</strong>: states can\'t be skipped, because skipping <C>DRIVER_ARRIVED</C> would start
          billing a rider who isn\'t in the car.</p>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🚕 Play: match the nearest driver + 🧭 walk the trip</h2>
        <p>First, matching — request a ride and watch the nearest available driver get claimed:</p>
        <MatchingMap />
        <p style={{ marginTop: 16 }}>Now the trip lifecycle — fire events and watch illegal jumps get refused:</p>
        <TripLifecycle />
        <Good><strong>What you should notice:</strong> ① Matching skips on-trip drivers and claims the nearest
          available — flipping it to ON_TRIP so the next rider can\'t get it. ② The trip refuses to skip states
          (no "start" before "arrive") and can\'t be cancelled once in progress. ③ Completing a trip would free
          its driver back to AVAILABLE — the two state machines, coupled.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The assignment race + real-time location</h2>
        <p>Two more big-system concerns, both familiar. First, the race: two riders, one nearest driver —
          assignment must be an <strong>atomic claim</strong> (Day 21, yet again):</p>
        <Code html={`  THE ASSIGNMENT RACE (a driver is a shared resource)

  rider A: nearest = D3 ─┐
  rider B: nearest = D3 ─┤  both matched D3 while it was AVAILABLE
  assign A → D3.ON_TRIP ──┤
  assign B → D3.ON_TRIP ──┘  💥 D3 now "has" two trips

  FIX: atomic claim — compareAndSet(D3.status, AVAILABLE, ON_TRIP).
       Exactly one assign wins; the loser's matcher picks the NEXT-nearest driver.`} />
        <Code html={`  REAL-TIME LOCATION (drivers stream GPS every few seconds)

  driver ──ping(location)──▶ LocationService
                               ├─ re-bucket the driver in the spatial index (§4)
                               └─ publish to subscribers (Observer, Day 32):
                                    └─ the matched rider's app → live "car approaching"
  riders NEVER poll all drivers; they SUBSCRIBE to their driver's position.`} />
        <Warn><strong>The location firehose is its own scaling problem.</strong> Hundreds of thousands of
          drivers pinging every few seconds is enormous write volume — the index update must be cheap (O(1)
          re-bucket) and updates fan out only to the relevant subscriber (the one rider tracking that driver),
          not broadcast. This is the parking-board / elevator-display Observer lesson at massive scale; flag the
          throughput for the Month-4 / distributed discussion.</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>The request flow, end to end</h2>
        <Code html={`  bookRide(rider, pickup, dropoff)  — the happy path (Day 9 sequence style)

  Rider ──▶ TripService: requestTrip(pickup, dropoff)
  TripService → new Trip(REQUESTED)
  TripService → MatchingService: findDriver(pickup)
       MatchingService → SpatialIndex: nearbyAvailable(pickup)   ← grid query, not a scan
       MatchingService → pick nearest → offer to driver
  Driver accepts → atomic claim: D.compareAndSet(AVAILABLE, ON_TRIP)   ← the race, settled
  TripService → Trip.assign(driver) → DRIVER_ASSIGNED
  Driver ┄▶ location pings ┄▶ rider's app (Observer)              ← live tracking
  …ARRIVED → IN_PROGRESS → COMPLETED → driver back to AVAILABLE   ← lifecycle + fare (Part 2)`} />
        <p>Read it aloud: "a rider requests a trip; the matching service queries the spatial index for nearby
          available drivers, offers to the nearest, and an atomic claim assigns exactly one; the trip walks its
          lifecycle while the driver\'s location streams to the rider." That sentence is the whole of Part 1.</p>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>🗺 Play: the spatial index</h2>
        <p>The reason matching needs a data structure, made visible. Toggle naive vs grid and watch how many
          drivers each examines:</p>
        <SpatialIndex />
        <Good><strong>What you should notice:</strong> ① Naive scan examines every driver (🔍 on all) — fine
          here, fatal at fleet scale. ② The grid examines only drivers in the rider\'s cell + 8 neighbors (the
          green region) — a tiny, near-constant set regardless of total fleet size. ③ When a driver moves, you
          re-bucket them in O(1) — the index stays fresh as the location firehose flows.</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>The patterns map (this is every Month-3 muscle at once)</h2>
        <table className="matrix">
          <thead>
            <tr><th>concern</th><th>tool</th><th>from</th></tr>
          </thead>
          <tbody>
            <tr><td>find nearest available driver</td><td>spatial index (grid/geohash/quadtree)</td><td>new (geo)</td></tr>
            <tr><td>which driver to pick (nearest/ETA/batch)</td><td>injected MatchingStrategy</td><td>Days 31 · 47</td></tr>
            <tr><td>driver availability &amp; trip progress</td><td>two state machines, guarded</td><td>Days 34 · 46 · 48</td></tr>
            <tr><td>two riders, one driver</td><td>atomic claim (compare-and-set)</td><td>Day 21 → W13</td></tr>
            <tr><td>live location &amp; trip updates</td><td>Observer / push</td><td>Day 32</td></tr>
            <tr><td>pricing, surge (Part 2)</td><td>Strategy family</td><td>Days 31 · 42</td></tr>
            <tr><td>payment, ratings (later)</td><td>ports / separate services</td><td>Days 26 · 52</td></tr>
          </tbody>
        </table>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>Scanning all drivers to match.</strong> O(N) per request melts at scale. A spatial index
          (grid/geohash/quadtree) restricts the search to nearby cells.</Warn>
        <Warn><strong>One status field for driver + trip.</strong> Availability and trip progress are separate,
          interacting state machines. Conflating them loses transitions and couples unrelated changes.</Warn>
        <Warn><strong>Non-atomic driver assignment.</strong> Two riders both get the nearest driver — the
          recurring race. Claim with compare-and-set; the loser re-matches to the next driver.</Warn>
        <Warn><strong>Skippable trip states.</strong> Starting before ARRIVED bills a rider who isn\'t aboard.
          Guarded transitions make illegal jumps impossible.</Warn>
        <Warn><strong>Polling for location.</strong> Riders polling every driver is the Day-32 anti-pattern at
          massive scale. Pings update the index and push to the one subscribed rider.</Warn>
        <Warn><strong>Forgetting to free the driver.</strong> Completing/cancelling a trip must flip the driver
          back to AVAILABLE, or drivers leak out of the matching pool and never get another ride.</Warn>
        <Warn><strong>Hardcoding "always nearest".</strong> Matching policy varies (ETA, batching, surge-aware).
          A MatchingStrategy keeps it swappable (Part 2 builds these).</Warn>
      </section>

      {/* 12 */}
      <section id="s12">
        <div className="sec-label">Section 12</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Four hard problems:</strong> matching (spatial index), state (two machines), concurrency (atomic claim), real-time (Observer/push). Name them in minute one.</li>
          <li><strong>Entities:</strong> Rider, Driver (status + location + vehicle), Trip (rider, driver, pickup/dropoff, status, timestamps), Location, Vehicle.</li>
          <li><strong>Matching:</strong> never scan all drivers — a spatial index (grid/geohash/quadtree) restricts to nearby cells; cell size is the tuning trade-off; re-bucket on move (O(1)).</li>
          <li><strong>State machines (two, coupled):</strong> Driver AVAILABLE/ON_TRIP/OFFLINE; Trip REQUESTED→ASSIGNED→ARRIVED→IN_PROGRESS→COMPLETED/CANCELLED. Guarded — no skipping. End/cancel frees the driver.</li>
          <li><strong>The race:</strong> two riders, one driver → atomic compare-and-set on driver status; loser re-matches (Day 21).</li>
          <li><strong>Location:</strong> pings update the index AND push to the subscribed rider (Observer, Day 32) — never poll; the firehose is a scaling flag.</li>
          <li><strong>Matching policy = Strategy</strong> (nearest/ETA/batch) and pricing/surge are Part 2.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Grid vs geohash vs quadtree — which spatial index, and why?"'>
          <p>All bucket points so a search examines only nearby ones; they differ in adaptivity. A uniform GRID
            is simplest (cell = lat/lng rounded) but wastes cells in sparse areas and crowds dense ones. GEOHASH
            encodes lat/lng into a string where a shared prefix means proximity — great for range queries and
            key-value stores, with edge cases at cell boundaries. A QUADTREE subdivides only where density is
            high, adapting to a city (dense downtown, sparse outskirts) at the cost of more complex updates. For
            an interview: "grid for simplicity, geohash if I\'m on a KV store, quadtree if density varies wildly
            — and I\'d size cells near the typical search radius." Naming the trade beats picking one.</p>
        </Reveal>
        <Reveal summary='Q: "The nearest driver declines the ride. Then what?"'>
          <p>Offer to the next-nearest — matching produces a RANKED list, not a single pick, and you walk it.
            Each offer has a short timeout (driver doesn\'t respond → treat as decline → next). Crucially the
            atomic claim only fires when a driver ACCEPTS, so a declined offer never marked them ON_TRIP. You
            also avoid re-offering to someone who just declined this trip. Some systems offer to several drivers
            at once (first-accept wins, an atomic race you must handle) to cut wait time. The design hooks:
            ranked candidates, per-offer timeout, claim-on-accept.</p>
        </Reveal>
        <Reveal summary='Q: "How do you keep the spatial index fresh under a flood of location pings?"'>
          <p>Make the update cheap and avoid doing too much per ping. A move is an O(1) re-bucket (remove from
            old cell, add to new) — and you only re-bucket when the driver actually crosses a cell boundary, not
            on every ping. At scale you partition the index geographically (shard by region) so pings for one
            area hit one node, and you may accept slightly stale positions (eventual consistency) since
            second-old locations are fine for matching. The framing: cheap incremental updates + geographic
            sharding + tolerate mild staleness. Exact real-time global consistency isn\'t needed or affordable.</p>
        </Reveal>
        <Reveal summary='Q: "Driver goes OFFLINE mid-trip (app crash, no signal). What happens to the trip?"'>
          <p>The trip doesn\'t instantly fail — you distinguish "temporarily unreachable" from "gone." Use a
            heartbeat/last-seen timestamp: if pings stop, mark the driver stale but keep the trip IN_PROGRESS
            for a grace period (the rider is still in the car). If they reconnect, resume. If the outage is long
            or the trip clearly abandoned, escalate (support, reassign for a not-yet-started trip, or settle the
            fare by distance covered). The design point: connectivity state (last-seen) is separate from trip
            state, and trip transitions shouldn\'t be driven by a single dropped ping — debounce with a grace
            window.</p>
        </Reveal>
        <Reveal summary='Q: "Where does the Strategy pattern show up, and what stays fixed?"'>
          <p>The VARYING parts are strategies: matching policy (nearest / lowest-ETA-with-traffic / batched
            fleet-optimal dispatch) and, in Part 2, pricing and surge. The FIXED part is the trip lifecycle and
            the request flow — request → match → atomic-assign → lifecycle → complete is the stable skeleton,
            and you swap the matching brain behind a MatchingStrategy interface (exactly like the elevator\'s
            SchedulingStrategy, Day 47). So "which driver" and "what price" are pluggable; "how a trip
            progresses" is not. Separating the stable skeleton from the swappable policy is the reusable
            insight.</p>
        </Reveal>
        <Reveal summary='Q: "This looks like every other Month-3 problem mashed together. Is that the point?"'>
          <p>Yes — and saying so is a strong close. Cab booking IS a resource-claim system (driver = the
            contended resource, atomic claim like BookMyShow), a dispatch problem (which driver next, like the
            elevator), a set of state machines (like vending/ATM), and a real-time pub-sub system (like the
            parking boards), plus a new spatial-data ingredient. Recognizing that a "scary" system decomposes
            into shapes you already own — and naming each — is exactly the Month-3 meta-skill. The interview
            isn\'t testing whether you\'ve built Uber; it\'s testing whether you can decompose the unfamiliar into
            the familiar.</p>
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
        <strong>Day 58 complete?</strong> Homework: on paper, 30 minutes — ① the entity model (Rider, Driver
        with status, Trip with lifecycle, Location, Vehicle) with multiplicities; ② both state machines (driver
        + trip) as transition tables, marking guarded/illegal transitions; ③ the matching flow using a grid
        spatial index — write <C>nearbyAvailable(pickup)</C> in pseudocode and the atomic driver claim; ④ the
        request sequence diagram (request → match → assign → lifecycle). Bonus: explain why scanning all
        drivers fails and how a grid fixes it, with the cell-size trade-off.
        <br /><br />
        Next: <strong>Day 59 — Cab Booking, Part 2</strong>: the money and the brains — fare calculation
        (base + distance + time), SURGE pricing as a strategy, dispatch strategies (nearest vs ETA vs batched),
        and ratings.
      </div>
    </div>
  )
}
