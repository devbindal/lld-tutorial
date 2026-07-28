import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the fare calculator ============ */
const TIERS = {
  Mini: { base: 50, perKm: 8, perMin: 1 },
  Sedan: { base: 80, perKm: 12, perMin: 1.5 },
  SUV: { base: 120, perKm: 16, perMin: 2 },
}

function FareCalculator() {
  const [tier, setTier] = useState('Sedan')
  const [km, setKm] = useState(8)
  const [min, setMin] = useState(20)
  const [surge, setSurge] = useState(1)
  const t = TIERS[tier]
  const distCost = t.perKm * km
  const timeCost = Math.round(t.perMin * min)
  const subtotal = t.base + distCost + timeCost
  const total = Math.round(subtotal * surge)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · fare = base + distance + time, then × surge — the gate code never changes</div>
      <div className="modbtns" style={{ marginBottom: 8 }}>
        {Object.keys(TIERS).map((k) => (
          <button key={k} className={tier === k ? 'on' : ''} onClick={() => setTier(k)}>{k}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>distance</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => setKm((x) => Math.max(1, x - 1))}>−</button>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 15, width: 48, textAlign: 'center' }}>{km} km</span>
            <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => setKm((x) => x + 1)}>+</button>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>duration</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => setMin((x) => Math.max(1, x - 5))}>−</button>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 15, width: 52, textAlign: 'center' }}>{min} min</span>
            <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => setMin((x) => x + 5)}>+</button>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>surge</div>
          <div className="modbtns">
            {[1, 1.5, 2].map((s) => <button key={s} className={surge === s ? 'on' : ''} style={{ fontSize: 12 }} onClick={() => setSurge(s)}>{s}×</button>)}
          </div>
        </div>
      </div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
        <div>base ({tier}) = ₹{t.base}</div>
        <div>distance = ₹{t.perKm} × {km} km = ₹{distCost}</div>
        <div>time = ₹{t.perMin} × {min} min = ₹{timeCost}</div>
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 4 }}>subtotal = ₹{subtotal}{surge > 1 && ` · × ${surge} surge`}</div>
        <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>🧾 fare = ₹{total}</div>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
          ExitFlow, every tier &amp; surge: Money fare = fareStrategy.price(trip); — it never learns the rates.
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 2: the surge meter ============ */
function SurgeMeter() {
  const [riders, setRiders] = useState(36)
  const [drivers, setDrivers] = useState(18)
  const ratio = drivers === 0 ? 99 : riders / drivers
  const surge = Math.min(3, Math.max(1, Math.round(ratio * 10) / 10))
  const base = 200
  const total = Math.round(base * surge)

  const bar = (label, val, set, color) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5' }}>{label}: {val}</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => set((x) => Math.max(0, x - 6))}>−</button>
        <div style={{ height: 14, background: color, width: Math.min(220, val * 5), borderRadius: 3, transition: 'width .2s' }} />
        <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => set((x) => x + 6)}>+</button>
      </div>
    </div>
  )

  return (
    <div className="panel">
      <div className="ptitle">Live demo · surge = a demand/supply multiplier wrapping the base fare (Decorator)</div>
      {bar('🙋 riders requesting', riders, setRiders, 'var(--blue)')}
      {bar('🚗 drivers available', drivers, setDrivers, 'var(--green)')}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', margin: '10px 0' }}>
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono' }}>demand/supply = {ratio.toFixed(1)}</span>
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono', background: surge > 1 ? '#FDECEC' : '#EAF7EF', fontWeight: 700 }}>
          surge ×{surge.toFixed(1)}
        </span>
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono' }}>₹{base} → ₹{total}</span>
      </div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
        <div style={{ color: '#7c8aa5' }}>// surge WRAPS any base fare strategy (composition, like the EV surcharge)</div>
        <div>fare = base.price(trip).times(surgeFactor(area, time));</div>
      </div>
      <div className="statbar" style={{ display: 'block', marginTop: 10 }}>
        <span style={{ fontSize: 12.5 }}>
          Add riders or remove drivers → the ratio rises → surge climbs (capped at 3×). Surge is a SEPARATE
          concern that multiplies the base fare — a wrapper, so the base rates and the exit flow never change.
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: dispatch strategy comparison ============ */
const DISPATCH = [
  { id: 'A', km: 2, traffic: 3.0, label: 'heavy traffic' },
  { id: 'B', km: 4, traffic: 1.0, label: 'clear road' },
  { id: 'C', km: 3, traffic: 1.5, label: 'medium' },
]
const eta = (d) => Math.round(d.km * d.traffic * 2)   // ~2 min/km baseline × traffic factor

function DispatchCompare() {
  const [strat, setStrat] = useState('nearest')
  let winner
  if (strat === 'nearest') winner = DISPATCH.reduce((a, b) => (b.km < a.km ? b : a)).id
  else winner = DISPATCH.reduce((a, b) => (eta(b) < eta(a) ? b : a)).id   // lowest ETA

  return (
    <div className="panel">
      <div className="ptitle">Live demo · same 3 drivers, different dispatch brain — nearest by distance vs lowest ETA</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        <button className={strat === 'nearest' ? 'on' : ''} onClick={() => setStrat('nearest')}>NearestByDistance</button>
        <button className={strat === 'eta' ? 'on' : ''} onClick={() => setStrat('eta')}>LowestEta (traffic-aware)</button>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        {DISPATCH.map((d) => (
          <div key={d.id} style={{
            border: '1.5px solid var(--line)', borderRadius: 8, padding: '8px 12px',
            background: winner === d.id ? '#EAF7EF' : '#fff',
            outline: winner === d.id ? '2px solid var(--green)' : 'none',
          }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>Car {d.id} {winner === d.id && '← assigned'}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, color: '#7c8aa5' }}>{d.km} km · {d.label}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5 }}>ETA ≈ {eta(d)} min</div>
          </div>
        ))}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        <span style={{ fontSize: 12.5 }}>
          {strat === 'nearest'
            ? 'NearestByDistance picks Car A (2 km) — but it\'s stuck in heavy traffic (ETA 12 min).'
            : 'LowestEta picks Car B — farther (4 km) but on a clear road (ETA 8 min), so it ARRIVES first. "Close" by distance ≠ "soon" by time.'}
          {' '}Both are MatchingStrategy classes; the controller never changes when you swap the brain.
        </span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The trip fare is computed…',
    o: ['At request time, stored on the trip', 'By the driver', 'In the Rider class', 'At trip END, by a FareStrategy reading the trip\'s distance + duration (from the Part-1 timestamps) — base + per-km + per-min, as Money; the fare can\'t exist until the trip is over'], a: 3,
    e: 'Like parking\'s exit-time pricing: distance and duration only exist once the trip completes, so a FareStrategy computes the fare at the end from the recorded start/end. Money, never double.',
    w: { 0: 'Distance/duration are unknown at request time.', 1: 'Drivers don\'t set rates.', 2: 'Riders carry no pricing policy.' },
    r: { id: 's2', label: 'Section 2 — fare' } },
  { q: 'Surge pricing is best added as…',
    o: ['An if(surge) inside the fare calculator', 'A new Trip subclass', 'A wrapper around the base FareStrategy (Decorator/composition): fare = base.price(trip) × surgeFactor(area, time) — surge is a separate concern that multiplies the base, so base rates and the flow never change', 'A hardcoded constant'], a: 2,
    e: 'Surge is a multiplier driven by demand/supply, orthogonal to the base rate. Wrapping the base strategy (like parking\'s EV surcharge) keeps base pricing in one place and makes surge swappable/removable.',
    w: { 0: 'An if-branch scatters pricing policy and reopens the calculator.', 1: 'Pricing isn\'t a trip subtype.', 3: 'Surge varies with demand — not constant.' },
    r: { id: 's4', label: 'Section 4 — surge' } },
  { q: 'Surge multiplier is driven by…',
    o: ['The fare tier', 'The driver\'s mood', 'The demand/supply ratio (riders requesting vs drivers available) in an area — more demand or fewer drivers → higher surge (capped); it incentivizes more drivers and rations scarce supply', 'The time of day only'], a: 2,
    e: 'Surge reflects local scarcity: when riders far outnumber available drivers, the multiplier rises (with a cap). It both rations demand and pulls more drivers to the area. Time-of-day is a proxy, not the driver.',
    w: { 0: 'Tier sets the base rate, not surge.', 1: '🙂 No.', 3: 'Time correlates but the real driver is supply vs demand.' },
    r: { id: 's4', label: 'Section 4 — surge' } },
  { q: 'A driver 2 km away in heavy traffic vs one 4 km away on a clear road. A good dispatcher picks…',
    o: ['The 2 km driver (nearest by distance)', 'The cheaper one', 'Random', 'The one with the lowest ETA (the 4 km driver arrives sooner) — dispatch should optimize TIME, not raw distance; matching policy is a swappable MatchingStrategy'], a: 3,
    e: 'Distance lies when traffic differs. An ETA-aware MatchingStrategy beats nearest-by-distance. Both live behind one interface (like the elevator\'s SchedulingStrategy) so the controller is unchanged.',
    w: { 0: 'Nearest by distance can be slowest by time.', 1: 'Cheapness isn\'t the matching goal.', 2: 'Random ignores ETA.' },
    r: { id: 's6', label: 'Section 6 — dispatch' } },
  { q: 'Dispatch policy (nearest / lowest-ETA / batched pooling) should be…',
    o: ['A pluggable MatchingStrategy — each policy is a class; the trip/request flow never changes when you swap it (the elevator\'s scheduling lesson, reused)', 'Chosen by the rider', 'In the database', 'Hardcoded as nearest'], a: 0,
    e: 'Matching is a varying algorithm (Strategy). Nearest today, ETA-aware or batched tomorrow, as new classes. The stable skeleton is request → match → atomic-assign → lifecycle; only the brain swaps.',
    w: { 1: 'The system matches; riders don\'t pick the algorithm.', 2: 'Storage stores; policy decides.', 3: 'Hardcoding blocks ETA/pooling dispatch.' },
    r: { id: 's6', label: 'Section 6 — dispatch' } },
  { q: 'Ratings are two-sided (rider rates driver AND driver rates rider). Where does a driver\'s rating live and how is it used?',
    o: ['A running average maintained per user (updated after each trip) — used for matching eligibility / display; not recomputed over the whole trip history on every read', 'Nowhere', 'Computed by scanning all trips each time', 'Only on the trip'], a: 0,
    e: 'Like Splitwise balances, keep a running aggregate (average + count) updated incrementally, not a full re-scan. Ratings feed back into matching (e.g. low-rated riders/drivers deprioritized) — a clean extension point.',
    w: { 1: 'It\'s a core feature.', 2: 'Re-scanning all history per read doesn\'t scale.', 3: 'A trip holds one rating; the AVERAGE lives on the user.' },
    r: { id: 's8', label: 'Section 8 — ratings' } },
  { q: 'A ride-pool (shared) request — how does it fit the design?',
    o: ['A new app', 'A different MatchingStrategy that assigns multiple compatible trips to one car along a route, plus a fare-split rule — the trip lifecycle and atomic driver claim are unchanged; it\'s an additive policy', 'Impossible', 'A total rewrite'], a: 1,
    e: 'Pooling is a matching + pricing variation: group trips with compatible routes, split the fare. The core (trip states, atomic assignment, fare strategy) stays; pooling plugs into the strategy seams — the OCP payoff.',
    w: { 0: 'Same system, new strategy.', 2: 'It\'s a known extension.', 3: 'It reuses the core; only policies change.' },
    r: { id: 's9', label: 'Section 9 — pooling' } },
  { q: 'Payment for the completed trip should go through…',
    o: ['A hardcoded payment vendor', 'An injected PaymentGateway port (with an idempotency key so a retried charge doesn\'t double-bill) — the same ports + idempotency lesson as BookMyShow and the ATM', 'The driver\'s bank app', 'Cash only'], a: 1,
    e: 'Reuse the payment port + adapters + fake-for-tests, and tag the charge with an idempotency key so a network retry of a charge that actually succeeded doesn\'t bill twice. Money correctness threads through every system.',
    w: { 0: 'Hardcoding blocks failover and testing.', 2: 'Payment is a system concern, behind a port.', 3: 'Real systems are cashless-first.' },
    r: { id: 's8', label: 'Section 8 — payment' } },
]

/* ============ The page ============ */
export default function Day59() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 12 · Day 59 · Classic LLD Problems</div>
        <h1>Cab Booking — Part 2:<br />The Money &amp; the Brains</h1>
        <p>Part 1 matched riders to drivers and ran the trip. Today: the fare (base + distance + time) behind a
           strategy, SURGE pricing as a wrapper, dispatch strategies (nearest vs lowest-ETA vs pooled), and
           two-sided ratings. It\'s the parking-pricing and elevator-scheduling lessons, reused at ride-hailing
           scale. Click everything.</p>
        <div className="chips">
          {['fare strategy', 'surge pricing', 'dispatch strategies', 'ETA vs distance', 'ratings', 'pooling'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What Part 2 adds</h2>
        <p>Part 1 built the body (matching, the spatial index, the trip + driver state machines, the atomic
          assignment). Part 2 adds the money and the smarter brains — all behind strategy seams so the core flow
          never changes:</p>
        <Code html={`  PART 2 — money & policy, all behind strategy seams

  FARE        base + per-km + per-min, computed at trip END (FareStrategy)   §2-3
  SURGE       a demand/supply multiplier WRAPPING the base fare (Decorator)  §4-5
  DISPATCH    which driver: nearest / lowest-ETA / batched (MatchingStrategy) §6-7
  RATINGS     two-sided running averages feeding back into matching          §8
  POOLING     shared rides = a matching + fare-split variation               §9

  The STABLE skeleton (Part 1): request → match → atomic-assign → lifecycle.
  Part 2 swaps the BRAINS (fare, surge, dispatch) without touching it.`} />
        <Note><strong>The throughline:</strong> fare is parking\'s exit-time pricing; surge is parking\'s EV
          surcharge (a wrapper); dispatch is the elevator\'s scheduling Strategy. You\'ve built all three shapes
          before — Part 2 is recognizing and reusing them.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Fare: base + distance + time, behind a strategy</h2>
        <p>The fare needs the trip\'s distance and duration — which only exist once it\'s <strong>over</strong>.
          So it\'s computed at trip end from the Part-1 timestamps, behind a swappable <C>FareStrategy</C>:</p>
        <Code html={`<span class="kw">public interface</span> FareStrategy {
    Money price(Trip trip);                       <span class="cm">// reads trip.distanceKm() + trip.duration()</span>
}

<span class="kw">public class</span> StandardFare <span class="kw">implements</span> FareStrategy {     <span class="cm">// per cab tier / city</span>
    <span class="kw">private final</span> Money base;                       <span class="cm">// e.g. Mini ₹50, Sedan ₹80, SUV ₹120</span>
    <span class="kw">private final</span> Money perKm, perMin;
    <span class="kw">public</span> Money price(Trip t) {
        <span class="kw">return</span> base
            .plus(perKm.times(t.distanceKm()))    <span class="cm">// distance component</span>
            .plus(perMin.times(t.durationMinutes())); <span class="cm">// time component (covers traffic waiting)</span>
    }
}`} />
        <Note><strong>Money is <C>Money</C>, fare is exit-time.</strong> Reuse Day 20\'s value object (BigDecimal
          + currency); the time component is what makes a 20-minute crawl through traffic cost more than a
          5-minute dash over the same distance. Different tiers/cities = different <C>StandardFare</C> instances,
          wired at the composition root.</Note>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🧮 Play: the fare calculator</h2>
        <p>Change tier, distance, time, and surge — watch the breakdown, and note the one line of exit code that
          never changes:</p>
        <FareCalculator />
        <Good><strong>What you should notice:</strong> ① The fare is base + distance + time — the time component
          means traffic costs money. ② Switching tier changes the rates, not the formula. ③ Surge just
          multiplies the subtotal (next section). The exit flow only ever calls <C>fareStrategy.price(trip)</C>.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Surge: a multiplier that WRAPS the base fare</h2>
        <p>Surge isn\'t a new rate — it\'s a demand-driven multiplier on top of the base fare. So it\'s a
          <strong> wrapper</strong> around any <C>FareStrategy</C> (composition, exactly like parking\'s EV
          surcharge on Day 42):</p>
        <Code html={`<span class="kw">public class</span> SurgePricing <span class="kw">implements</span> FareStrategy {
    <span class="kw">private final</span> FareStrategy base;            <span class="cm">// wraps ANY base fare (Mini/Sedan/SUV)</span>
    <span class="kw">private final</span> SurgeService surge;           <span class="cm">// knows the live demand/supply per area</span>

    <span class="kw">public</span> Money price(Trip t) {
        Money normal = base.price(t);             <span class="cm">// ① the wrapped strategy computes the base fare</span>
        <span class="kw">double</span> factor = surge.factorFor(t.pickupArea(), t.requestedAt());  <span class="cm">// ② demand/supply</span>
        <span class="kw">return</span> normal.times(factor);              <span class="cm">// ③ multiply — base rates untouched</span>
    }
}

<span class="cm">// factorFor = clamp(1.0 .. cap) driven by ridersRequesting / driversAvailable in the area</span>
<span class="cm">// composition root:  fareStrategy = new SurgePricing(new StandardFare(sedanRates), surgeService);</span>`} />
        <Warn><strong>Surge is a separate concern — keep it out of the base rates.</strong> Demand/supply, caps,
          time windows, and area all live in the surge layer; the base <C>StandardFare</C> never changes. Cap
          the multiplier (e.g. ≤3×) and be transparent to the rider — and note it raises real fairness/ethics
          questions (a topic to acknowledge, not bury in an <C>if</C>).</Warn>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>📈 Play: the surge meter</h2>
        <p>Adjust riders vs available drivers and watch the multiplier respond — and see how it just wraps the
          base fare:</p>
        <SurgeMeter />
        <Good><strong>What you should notice:</strong> ① More riders or fewer drivers → higher ratio → higher
          surge (capped at 3×). ② Surge multiplies the base fare; it doesn\'t touch the per-km/per-min rates.
          ③ Because it\'s a wrapper, you can add, remove, or cap surge with one wiring line — the base pricing
          and exit flow are untouched.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Dispatch strategies: which driver, really?</h2>
        <p>Part 1 found nearby drivers; Part 2 decides WHICH one to offer. "Nearest by distance" is the naive
          answer — but distance lies when traffic differs. Matching policy is a <C>MatchingStrategy</C> (the
          elevator\'s scheduling lesson, reused):</p>
        <Code html={`<span class="kw">public interface</span> MatchingStrategy {
    Optional&lt;Driver&gt; pick(Location pickup, List&lt;Driver&gt; nearby);
}

<span class="kw">class</span> NearestByDistance <span class="kw">implements</span> MatchingStrategy { … min by straight-line km … }
<span class="kw">class</span> LowestEta <span class="kw">implements</span> MatchingStrategy {          <span class="cm">// traffic-aware — usually better</span>
    <span class="kw">public</span> Optional&lt;Driver&gt; pick(Location p, List&lt;Driver&gt; nearby) {
        <span class="kw">return</span> nearby.stream().min(comparingInt(d -&gt; etaMinutes(d, p)));  <span class="cm">// time, not distance</span>
    }
}
<span class="kw">class</span> BatchedDispatch <span class="kw">implements</span> MatchingStrategy { … optimize the whole fleet / pool rides … }

<span class="cm">// the controller is unchanged; swap the brain at the composition root</span>`} />
        <Note><strong>Dispatch is two-level (Part 1):</strong> a <C>Dispatcher</C> chooses WHICH car for a
          request (this MatchingStrategy), and each trip then runs its own lifecycle. Offer mechanics matter
          too: offer to the nearest/best and fall through to the next on decline/timeout, or broadcast to a few
          and let the first ACCEPT win (an atomic race to handle).</Note>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🚦 Play: dispatch comparison</h2>
        <p>Three drivers, same scenario. Swap the dispatch brain and watch a different car win — because "close"
          and "soon" aren\'t the same thing:</p>
        <DispatchCompare />
        <Good><strong>What you should notice:</strong> ① NearestByDistance grabs the 2 km car — stuck in
          traffic. ② LowestEta picks the 4 km car on a clear road, which arrives first. ③ Both are
          <C> MatchingStrategy</C> classes; the trip flow never changes when you swap them — the same one-line
          swap as the elevator\'s FCFS↔LOOK.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Trip end: payment + two-sided ratings</h2>
        <p>When the trip reaches COMPLETED (Part 1\'s lifecycle), three things happen — fare, payment, ratings:</p>
        <Code html={`<span class="kw">void</span> completeTrip(Trip t) {
    Money fare = fareStrategy.price(t);                 <span class="cm">// exit-time fare (surge-wrapped)</span>
    payment.charge(t.rider(), fare, t.idempotencyKey()); <span class="cm">// PORT + idempotency (Days 52/54), retry-safe</span>
    t.markCompleted(fare);
    t.driver().setAvailable();                          <span class="cm">// driver returns to the matching pool (Part 1)</span>
}

<span class="cm">// ratings: TWO-SIDED, kept as a running average per user (not a full re-scan)</span>
<span class="kw">void</span> rate(User who, User target, <span class="kw">int</span> stars) {
    target.rating().add(stars);                         <span class="cm">// running avg + count, updated incrementally</span>
}
<span class="cm">// low ratings can feed back into MatchingStrategy (eligibility) — a clean extension point</span>`} />
        <Good><strong>Reuse, reuse, reuse:</strong> payment is BookMyShow/ATM\'s port + idempotency; the rating
          average is Splitwise\'s "running aggregate, not a log re-scan"; freeing the driver is Part 1\'s coupled
          state machines. Ratings feeding back into matching is the OCP payoff — a new strategy field, not a
          rewrite.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>The pooling follow-up + the full picture</h2>
        <p>"Add shared rides (pool)" is the classic minute-40 curveball — and it lands entirely in the strategy
          seams:</p>
        <Code html={`  POOLING = a matching + fare-split VARIATION (core unchanged)

  · MatchingStrategy: group trips with COMPATIBLE routes into one car along a path
  · FareStrategy:     split the fare across riders (each pays their leg / a share)
  · Trip lifecycle, atomic driver claim, location pings = UNCHANGED

  THE FULL PICTURE (Parts 1 + 2)
  request ─▶ Dispatcher.MatchingStrategy(nearby from spatial index)
          ─▶ atomic claim a Driver ─▶ Trip lifecycle (Part 1)
          ─▶ on COMPLETE: FareStrategy (+ SurgePricing wrapper) ─▶ payment port
          ─▶ two-sided ratings ─▶ driver back to AVAILABLE`} />
        <Good><strong>The interview close:</strong> "Pooling is a new MatchingStrategy plus a fare-split
          FareStrategy — the trip lifecycle, atomic assignment, and location handling don\'t change." Naming the
          seams a follow-up lands in (rather than scrambling) is the senior signal the whole month trained.</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>Computing the fare at request time.</strong> Distance/duration don\'t exist yet — fare is
          an exit-time function via a FareStrategy.</Warn>
        <Warn><strong>Surge as an <C>if</C> in the fare calculator.</strong> It scatters pricing and reopens the
          calculator. Wrap the base strategy (composition); base rates stay put.</Warn>
        <Warn><strong>Dispatch by raw distance.</strong> A near car in traffic arrives after a far car on a
          clear road. Optimize ETA; keep it a swappable MatchingStrategy.</Warn>
        <Warn><strong>double for fares.</strong> Day 20, still — Money/BigDecimal, never floating point.</Warn>
        <Warn><strong>Recomputing ratings over all trips.</strong> Keep a running average per user, updated
          incrementally (Splitwise\'s lesson).</Warn>
        <Warn><strong>Payment hardcoded / non-idempotent.</strong> A port + an idempotency key, or a retried
          charge double-bills (BookMyShow/ATM\'s lesson).</Warn>
        <Warn><strong>Treating pooling as a rewrite.</strong> It\'s a MatchingStrategy + fare-split — the core
          is untouched.</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Fare:</strong> base + per-km + per-min, computed at trip END behind a <C>FareStrategy</C>; Money, never double; per tier/city.</li>
          <li><strong>Surge:</strong> a wrapper (Decorator) — <C>base.price(trip) × surgeFactor(area, time)</C>, driven by demand/supply, capped; base rates untouched.</li>
          <li><strong>Dispatch:</strong> a <C>MatchingStrategy</C> — NearestByDistance vs LowestEta (traffic-aware) vs Batched/pool; optimize TIME, not distance; one-line swap.</li>
          <li><strong>Offer mechanics:</strong> ranked candidates with a per-offer timeout (fall through on decline), or broadcast-and-first-accept-wins (an atomic race).</li>
          <li><strong>Trip end:</strong> fare → payment (port + idempotency key, retry-safe) → two-sided ratings (running average) → driver back to AVAILABLE.</li>
          <li><strong>Ratings</strong> are a running aggregate per user and can feed back into matching eligibility.</li>
          <li><strong>Pooling</strong> = a new MatchingStrategy + a fare-split FareStrategy; the core flow is unchanged.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Show the rider an upfront fare ESTIMATE before they book. How?"'>
          <p>Estimate ≠ final fare. Use the planned route (estimated distance + estimated duration from a maps
            service) fed through the SAME FareStrategy, times the CURRENT surge — and store the surge factor
            quoted at booking so the rider isn\'t surprised by a different multiplier at the end. The final fare
            recomputes from ACTUAL distance/duration (traffic, detours), within a tolerance band you disclose.
            The design point: estimate and final share one fare strategy; only the inputs (estimated vs actual)
            and the surge-lock policy differ.</p>
        </Reveal>
        <Reveal summary='Q: "Driver cancels after accepting. What happens to fare/dispatch?"'>
          <p>No fare (the trip never reached IN_PROGRESS), the driver returns to AVAILABLE (possibly with a
            cancellation penalty/rating hit — a policy), and the request is RE-DISPATCHED to the next candidate
            via the MatchingStrategy. The trip goes back to a pre-assignment state rather than being destroyed.
            This is the trip lifecycle (Part 1) plus a policy: distinguish rider-cancel, driver-cancel, and
            no-show, each with its own fee/rating rule kept OUT of the core flow (a CancellationPolicy).</p>
        </Reveal>
        <Reveal summary='Q: "Is surge pricing fair? Defend your design choice."'>
          <p>Acknowledge it\'s a real ethics/PR question, not just code. Surge rations scarce supply (someone
            WILL get a ride) and incentivizes more drivers to a hot area, but it can gouge during emergencies —
            so real systems CAP it, disable it during disasters, and disclose it upfront. The DESIGN lets you
            do all that cleanly: surge is an isolated wrapper with a cap and an on/off switch, so policy changes
            (cap lower, disable in an area) are config, not code surgery. The senior move is naming the tension
            and showing your design keeps the policy controllable.</p>
        </Reveal>
        <Reveal summary='Q: "How do you prevent a rider being charged twice if the app retries the payment?"'>
          <p>An idempotency key per trip charge (the same lesson as BookMyShow and the ATM). The payment is
            tagged with a stable key; the gateway/our records recognize a repeat and return the original result
            instead of charging again. A timed-out-but-succeeded charge retried must be a no-op. Pair it with
            the fare being computed once and stored on the completed trip, so retries reference the same amount.
            "Idempotency key + recorded charge result" is the answer for any money operation with retries.</p>
        </Reveal>
        <Reveal summary='Q: "Cab booking feels like a mash-up of earlier problems. Map it."'>
          <p>Exactly — and saying so is the strong close. Driver = a contended resource claimed atomically
            (BookMyShow\'s seat); dispatch = "which one next?" behind a Strategy (the elevator\'s scheduler);
            trip + driver = coupled state machines (vending/ATM); fare = exit-time pricing with a surge wrapper
            (parking\'s pricing + EV surcharge); ratings = running aggregates (Splitwise); payment = a port +
            idempotency (ATM); location = a spatial index + Observer push (parking boards, scaled). Cab booking
            is the capstone BECAUSE it\'s every Month-3 shape at once — decompose it into those and nothing is
            new.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s12">
        <div className="sec-label">Section 12 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 59 complete?</strong> Homework: code it — a <C>FareStrategy</C> (StandardFare per tier),
        a <C>SurgePricing</C> wrapper driven by a demand/supply factor (capped), a <C>MatchingStrategy</C> with
        NearestByDistance and a traffic-aware LowestEta, and a trip-completion flow that prices, charges through
        a fake payment port with an idempotency key, records two-sided ratings (running average), and frees the
        driver. Prove it: (a) the same trip costs more under surge; (b) LowestEta beats NearestByDistance when a
        near car is in traffic; (c) a retried charge bills once. Stretch: add a pooling MatchingStrategy with a
        fare split.
        <br /><br />
        Next: <strong>Day 60 — Week 12 Machine-Coding Drill</strong>: the timed dress rehearsal that closes
        Month 3 — two fresh problems, the self-grading rubric, and a recap of the whole month\'s shapes.
      </div>
    </div>
  )
}