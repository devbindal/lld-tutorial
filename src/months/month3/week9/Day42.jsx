import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: park(), line by line ============ */
const PARK_CODE = [
  'public Ticket park(Vehicle v) {',
  '    Spot spot = strategy.findSpot(floors, v.type());',
  '    if (spot == null) throw new NoSpotAvailableException(v.type());',
  '    spot.occupy(v);                // guarded + synchronized',
  '    Ticket t = new Ticket(nextId(), v, spot.id(), clock.instant());',
  '    open.put(t.id(), t);           // findable again at exit',
  '    publish(new SpotOccupied(spot.id()));',
  '    return t;',
  '}',
]
const PARK_STEPS = [
  { line: 0, note: 'A 🚗 car pulls up to gate IN-1. EntryGate calls lot.park(car) — we enter the method.' },
  { line: 1, note: 'The Strategy slot fires. NearestFirst scans floor 1: B1 (BIKE spot — a car cannot fit, skip), C1 (taken by 🚙, skip), C2 (COMPACT, free) → chosen. The lot never learned HOW the choice was made.' },
  { line: 2, note: 'C2 was found, so this guard stays quiet. Fill the lot with trucks (Part 1\'s simulator) and THIS line is the one that fires — fail fast, with the vehicle type in the message (Day 19).' },
  { line: 3, note: 'spot.occupy(car) — the guarded, synchronized claim. C2 flips FREE → OCCUPIED atomically. A second gate racing for C2 this very instant now THROWS instead of double-parking (Part 1\'s concurrency flag, honored).' },
  { line: 4, note: 'The Ticket is born: an immutable record stamped with entryTime = clock.instant(). Because the Clock was injected, a test can freeze this exact moment.' },
  { line: 5, note: 'The lot files the open ticket by id. Fifteen sections from now, the EXIT gate will look it up in this very map.' },
  { line: 6, note: 'Observer time: SpotOccupied is published. The floor-1 board ticks 2 free → 1 free. The lot still does not know boards exist.' },
  { line: 7, note: 'The ticket returns to the gate → printed → barrier lifts. Eight lines, and five of Part 1\'s decisions just executed.' },
]

function ParkStepper() {
  const [step, setStep] = useState(-1)
  const started = step >= 0
  const done = step >= PARK_STEPS.length - 1
  const cur = started ? PARK_STEPS[step] : null
  const c2 = step >= 3 ? 'occupied' : step >= 1 ? 'chosen' : 'free'

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one car, eight lines — step through park() and watch the design run</div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
        {PARK_CODE.map((l, i) => (
          <div key={i} style={{
            fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre',
            padding: '1px 6px', borderRadius: 4, overflowX: 'auto',
            background: cur && cur.line === i ? '#FFF1D6' : 'transparent',
            fontWeight: cur && cur.line === i ? 700 : 400,
          }}>{l}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5' }}>FLOOR 1 · 📟 board: {step >= 6 ? 1 : 2} free</span>
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono', background: '#E5EBFF' }}>B1 BIKE ·</span>
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono', background: '#FFE0DE' }}>C1 COMPACT 🚙</span>
        <span className="chip" style={{
          fontFamily: 'IBM Plex Mono',
          background: c2 === 'occupied' ? '#FFE0DE' : c2 === 'chosen' ? '#FFF1D6' : '#EAF7EF',
          outline: c2 === 'chosen' ? '2px solid var(--amber)' : 'none',
        }}>C2 COMPACT {c2 === 'occupied' ? '🚗' : '·'}</span>
        {step >= 4 && (
          <span className="chip" style={{ fontFamily: 'IBM Plex Mono', background: '#E5EBFF' }}>
            🎫 Ticket{'{'}T-101, 🚗, C2, t₀{'}'}
          </span>
        )}
        {step >= 5 && <span className="chip" style={{ fontFamily: 'IBM Plex Mono' }}>open = {'{'} T-101 {'}'}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {!done
          ? <button className="act" onClick={() => setStep((s) => s + 1)}>{started ? 'next line →' : '🚗 car arrives — start'}</button>
          : <button className="ghost act" onClick={() => setStep(-1)}>reset</button>}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {cur
          ? <span style={{ fontSize: 13 }}>{cur.note}</span>
          : <span>▶ Press start, then advance one line at a time. Watch the right things change at the right lines.</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: the pricing lab ============ */
const HR_RATE = { bike: 10, car: 20, truck: 40 }
const DAY_RATE = { bike: 60, car: 150, truck: 400 }
const VLABEL = { bike: '🛵 BIKE', car: '🚗 CAR', truck: '🚚 TRUCK' }

function PricingLab() {
  const [strat, setStrat] = useState('hourly')
  const [veh, setVeh] = useState('car')
  const [mins, setMins] = useState(150)

  const h = Math.floor(mins / 60)
  const m = mins % 60
  const dur = h + 'h ' + (m < 10 ? '0' : '') + m + 'm'
  const billedH = Math.max(1, Math.ceil(mins / 60))
  const days = Math.max(1, Math.ceil(mins / 1440))
  const hourlyFee = HR_RATE[veh] * billedH
  const energy = 15 * billedH

  let built, lines, fee
  if (strat === 'hourly') {
    built = 'new HourlyPricing()'
    fee = hourlyFee
    lines = [
      'Duration.between(entryTime, exit) = ' + dur,
      'ceilHours(' + mins + ' min) = (' + mins + ' + 59) / 60 = ' + billedH + ' billable hour' + (billedH > 1 ? 's' : ''),
      'RATE[' + veh.toUpperCase() + '] = ₹' + HR_RATE[veh] + '/h  →  fee = ₹' + HR_RATE[veh] + ' × ' + billedH + ' = ₹' + fee,
    ]
  } else if (strat === 'daypass') {
    built = 'new DayPassPricing()'
    fee = DAY_RATE[veh] * days
    lines = [
      'Duration.between(entryTime, exit) = ' + dur,
      'days spanned = ceil(' + mins + ' min / 1440) = ' + days,
      'DAY_RATE[' + veh.toUpperCase() + '] = ₹' + DAY_RATE[veh] + '/day  →  fee = ₹' + DAY_RATE[veh] + ' × ' + days + ' = ₹' + fee,
    ]
  } else {
    built = 'new EvChargingSurcharge(new HourlyPricing())'
    fee = hourlyFee + energy
    lines = [
      'base = delegate.price(ticket, exit)        // the WRAPPED HourlyPricing runs first',
      'base = ₹' + HR_RATE[veh] + ' × ' + billedH + ' h = ₹' + hourlyFee,
      'energy = ₹15/h × ' + billedH + ' h = ₹' + energy,
      'fee = base.plus(energy) = ₹' + fee,
    ]
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · swap the strategy, drag the clock — the exit gate never changes</div>
      <div className="modbtns" style={{ marginBottom: 8 }}>
        {[['hourly', 'HourlyPricing'], ['daypass', 'DayPassPricing'], ['ev', 'EV surcharge (wraps hourly)']].map(([k, label]) => (
          <button key={k} className={strat === k ? 'on' : ''} onClick={() => setStrat(k)}>{label}</button>
        ))}
      </div>
      <div className="modbtns" style={{ marginBottom: 8 }}>
        {Object.keys(HR_RATE).map((v) => (
          <button key={v} className={veh === v ? 'on' : ''} onClick={() => setVeh(v)}>{VLABEL[v]}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="ghost act" onClick={() => setMins((x) => Math.max(30, x - 30))}>−30 min</button>
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono' }}>⏱ parked: {dur}</span>
        <button className="ghost act" onClick={() => setMins((x) => Math.min(4320, x + 30))}>+30 min</button>
      </div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>composition root: pricing = {built}</div>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre-wrap', padding: '1px 0' }}>{l}</div>
        ))}
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, fontWeight: 700, marginTop: 6 }}>🧾 Receipt: ₹{fee}</div>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
          ExitGate, this whole time: Money fee = pricing.price(ticket, now); — it never learned which pricing it was talking to.
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: the minute-40 drill ============ */
const ROUNDS = [
  { v: '"Weekend rates are 1.5×."',
    o: ['Edit ParkingLot.park() with an if(isWeekend)', 'A new WeekendAwarePricing that wraps the base strategy + ONE changed wiring line in main() — lot, gates and Ticket untouched', 'An if(isWeekend) inside ExitGate', 'A new Vehicle subclass for weekend cars'], a: 1,
    why: 'Pricing is the axis we made swappable. Wrapping (like the EV surcharge) even keeps weekday logic in one place: the wrapper computes the base fee and multiplies. The gate stays ignorant — exactly why Day 12 made us put the interface there.' },
  { v: '"Show live free counts in our mobile app."',
    o: ['The app polls the lot every second', 'A MobileAppFeed class implementing SpotObserver, subscribed in main() — the lot publishes to one more listener it never knew about', 'Spots call the app SDK directly', 'Edit DisplayBoard to also push to the app'], a: 1,
    why: 'The Day 32 payoff, cashed: SpotOccupied/SpotFreed already carry everything. New audience = new subscriber, zero parking-code edits. Editing DisplayBoard would weld two unrelated outputs together (Day 11: two reasons to change).' },
  { v: '"Add electric vehicles and charger spots."',
    o: ['Rewrite the lot around EVs', 'New enum constants (VehicleType.EV, SpotType.EV_CHARGER with its fits data), an EvNearChargerStrategy, and the EV pricing wrapper — three extension points planted in Part 1, all three absorb it', 'A String field type = "EV"', 'Build a second, separate parking lot'], a: 1,
    why: 'Each change lands where variation was designed to land: kinds → enums, placement policy → allocation Strategy, money → pricing Strategy. Nothing core opens. This question is the interviewer TESTING your OCP, live.' },
  { v: '"The first 30 minutes are free."',
    o: ['ExitGate checks the duration and skips payment', 'A grace rule INSIDE pricing (or a GracePeriodPricing wrapper) — and ask back: after minute 31, do we bill from minute 0 or from minute 31?', 'EntryGate stamps entryTime 30 minutes late', 'A new SpotState called GRACE'], a: 1,
    why: 'Gates must never learn pricing rules — that knowledge has one home. The late-stamp option falsifies data (audits, lost-ticket lookups, everything downstream lies). And the ask-back is real: both billing answers exist in real lots. Asking it is a senior move.' },
  { v: '"Regular customers want monthly passes."',
    o: ['Hardcode a plate list inside ExitGate', 'A PassRegistry consulted when SELECTING the strategy per ticket — pass holders get ZeroPricing (their fee is the subscription, charged elsewhere); strategy selection itself becomes the seam', 'Give regulars permanently reserved spots', 'Add an isRegular boolean to Ticket'], a: 1,
    why: 'Day 31\'s registry idea returns: WHICH strategy applies can vary per ticket, and that selection is itself pluggable. The hardcoded list and the Ticket boolean both smear a business policy across stable classes.' },
]

function Minute40Drill() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= ROUNDS.length
  const cur = ROUNDS[idx]

  function pick(i) {
    if (picked !== null) return
    setPicked(i)
    if (i === cur.a) setScore((s) => s + 1)
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · minute 40 — the interviewer springs a variation. Where does the change land?</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Score: <b>{score} / {ROUNDS.length}</b> — notice the pattern: every right answer touched a NEW file plus the composition root, never the lot or the gates. That sentence is worth saying in the interview.</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>🕐 <span>variation {idx + 1} of {ROUNDS.length} · score {score}</span></div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.v}</p>
          <div className="modbtns">
            {cur.o.map((o, i) => (
              <button key={i} className={picked !== null && i === cur.a ? 'on' : ''}
                style={{ fontSize: 12.5, ...(picked === i && i !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}) }}
                onClick={() => pick(i)}>{o.length > 64 ? o.slice(0, 61) + '…' : o}</button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ ' : '❌ '} <b>{cur.o[cur.a]}</b><br /><br />{cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={() => { setPicked(null); setIdx((i) => i + 1) }}>Next variation →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'Why can the fee only be computed at the EXIT gate?',
    o: ['The fee depends on DURATION, unknown until exit — so price(ticket, exitTime) runs at exit, fed by the immutable entryTime the Ticket has carried since minute zero', 'Java cannot subtract timestamps', 'Because payment was scoped out in Part 1', 'Entry gates are too busy to do math'], a: 0,
    e: 'The Ticket is a sealed envelope holding entryTime; only at exit do both ends of the Duration exist. That is also why entryTime must be immutable — it is billing evidence.',
    w: { 1: 'Duration.between(entry, exit) does exactly this.',
         2: 'Scoping out payment skipped the card machine, not the arithmetic.',
         3: 'It is not about workload — entry-time pricing is logically impossible, not slow.' },
    r: { id: 's5', label: 'Section 5 — pricing is an exit-time question' } },
  { q: 'The fee should be represented as…',
    o: ['Money (BigDecimal + currency — Day 20\'s value object): exact decimal math, explicit rounding, and no mixing ₹ with $ by accident', 'String, formatted nicely', 'double — fast and easy', 'float'], a: 0,
    e: 'Binary floats cannot represent 0.1 exactly; fees drift by paise until daily totals stop balancing. Day 20 built Money for precisely this moment — reuse it, and say "Day 20" out loud in the interview.',
    w: { 1: 'Strings can be displayed but not added, compared, or rounded safely.',
         2: '0.1 + 0.2 != 0.3 in double — the Mars-orbiter lesson at parking-lot scale.',
         3: 'float is double\'s less precise sibling — worse, not better.' },
    r: { id: 's5', label: 'Section 5 — money is Money' } },
  { q: 'A car parks for 1h 01m under hourly billing and is charged 2 hours. WHERE does that rounding rule live?',
    o: ['In ExitGate, before calling the strategy', 'Inside HourlyPricing\'s ceilHours() — rounding is a PRICING policy, kept in the one file that owns pricing; Duration.toHours() would silently truncate to 1', 'On the Ticket', 'In the Spot'], a: 1,
    e: 'One policy, one home. When the business later says "round to 15-minute blocks", exactly one private method changes — and the truncation trap (toHours) is already fenced off there.',
    w: { 0: 'A gate that rounds is a gate that knows pricing — the knowledge leaks.',
         2: 'The Ticket records facts; it does not interpret them.',
         3: 'Spots hold vehicles, not billing opinions.' },
    r: { id: 's5', label: 'Section 5 — the hourly strategy' } },
  { q: 'Minute 40: "weekend rates are double." Your move?',
    o: ['Edit ExitGate with a calendar check', 'Recompute already-issued receipts', 'A new PricingStrategy (e.g. WeekendAwarePricing wrapping the weekday one) + one changed line in the composition root — lot and gates stay closed (Day 12)', 'Add if(weekend) inside ParkingLot'], a: 2,
    e: 'This is the OCP follow-up the whole design was built to absorb: variation lands in a new strategy file plus one wiring line. Saying "and nothing else recompiles" is the full-marks ending.',
    w: { 0: 'Same leak, different room — gates stay pricing-ignorant.',
         1: 'Old receipts are history; policies apply at exit time.',
         3: 'The lot does not price; opening it for a price change breaks the separation that earned points.' },
    r: { id: 's8', label: 'Section 8 — one line in main()' } },
  { q: 'EV charging cost on top of normal parking — best structure?',
    o: ['Charge the energy fee at entry', 'An isEv boolean inside HourlyPricing', 'A surcharge strategy that WRAPS any base PricingStrategy and adds energy cost — composition (Day 27\'s move) keeps hourly logic in exactly one place', 'Copy HourlyPricing into EvHourlyPricing and edit the copy'], a: 2,
    e: 'EvChargingSurcharge(base) delegates for the parking fee and adds energy on top — it even composes with DayPassPricing for free. Copy-paste forks the rounding rule into two files that WILL drift apart (Day 16).',
    w: { 0: 'Energy used is unknown at entry, just like duration.',
         1: 'Today a boolean, next month three booleans — the flag-monster from Day 27.',
         3: 'Two copies of ceilHours() = the next bug is fixed in only one of them.' },
    r: { id: 's5', label: 'Section 5 — the EV wrapper' } },
  { q: 'Why do the lot and gates take a Clock in the constructor?',
    o: ['To keep the two gates\' clocks synchronized', 'Java requires a Clock for Instant.now()', 'Performance — system calls are slow', 'So tests can use a FIXED clock: park at t₀, "exit" at t₀ + 150 min, assert ₹60 — no Thread.sleep, no flaky tests (Day 15\'s Clock boundary)'], a: 3,
    e: 'Time is a dependency like any other. Inject it and a two-and-a-half-hour parking test runs in two-and-a-half milliseconds. Hardcode Instant.now() and your pricing tests must literally wait.',
    w: { 0: 'A nice side-effect, not the reason.',
         1: 'Instant.now() works fine without one — that is exactly the untestable trap.',
         2: 'Irrelevant at gate speeds; testability is the real win.' },
    r: { id: 's3', label: 'Section 3 — the lot core' } },
  { q: 'In the exit flow, why compute the fee BEFORE spot.free(), and close the ticket LAST?',
    o: ['The fee formula needs the Spot object', 'Observers require it', 'The order is arbitrary', 'Free the spot first and a new car can claim it while payment is still settling; close the ticket last so a double-scanned ticket THROWS instead of billing twice'], a: 3,
    e: 'Order is part of correctness: price → pay → free → close. The close-last rule makes the flow idempotent — the second scan of the same ticket hits UnknownTicketException and the gate shows "already paid".',
    w: { 0: 'The fee needs entryTime, exit time and vehicle type — all on the Ticket.',
         1: 'Observers just hear spotFreed whenever it happens.',
         2: 'Reorder it and you get phantom double-parking or double-billing — very not arbitrary.' },
    r: { id: 's7', label: 'Section 7 — the exit sequence' } },
  { q: 'You have ~15 minutes to code in the interview. You start with…',
    o: ['ParkingLot — biggest class first', 'The enums and Spot — the leaves compile alone with zero stubs, every later layer only calls code that already exists, and enums show your modeling fastest', 'main() — top-down', 'The display boards'], a: 1,
    e: 'Bottom-up means you are never typing a call to a class that does not exist yet — no stub debt, no forward references, and the interviewer sees working pieces accumulate instead of a half-written god file.',
    w: { 0: 'park() calls strategy, Spot, Ticket — none exist yet; you would be stubbing for five minutes.',
         2: 'main() wires things; with nothing to wire it is an empty ceremony.',
         3: 'Observers are the garnish — core flow first.' },
    r: { id: 's1', label: 'Section 1 — the build order' } },
]

/* ============ The page ============ */
export default function Day42() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 9 · Day 42 · Classic LLD Problems</div>
        <h1>Parking Lot — Part 2:<br />The Blueprint Becomes a Building</h1>
        <p>Part 1 drew the design; today we pour the concrete. Every class in real Java, the pricing Strategy
           family (hourly / day-pass / EV), gates issuing and closing tickets, and the minute-40 variations
           interviewers spring when your code looks too comfortable. Click everything.</p>
        <div className="chips">
          {['java walkthrough', 'pricing strategy', 'Money & BigDecimal', 'gates & tickets', 'exit flow', 'composition root', 'minute-40 variations'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Construction day: build bottom-up, demo top-down</h2>
        <p>On a construction site you do not start with the roof. Same here: under interview time pressure,
          the winning order builds <strong>leaves first</strong> — small classes that compile alone — and wires
          the big ones last.</p>
        <Code html={`  THE 15-MINUTE CODE WINDOW (minutes 30–45 of the round)

            main() wiring                ← last · 1 min  (composition root, Day 15)
         EntryGate · ExitGate            ← 4th  · 3 min  (the doors)
      ParkingLot.park() / close()        ← 3rd  · 4 min  (the core flow)
    PricingStrategy + HourlyPricing      ← 2nd  · 3 min  (first family member)
  VehicleType · SpotType · Spot · Ticket ← FIRST · 4 min (bricks: they compile
                                            alone — zero stubs, zero forward refs)

  WHY BOTTOM-UP?  every layer only calls layers BELOW it, so you are never
  typing a call to a class that doesn't exist yet. The interviewer watches
  working pieces STACK instead of one half-written god file.`} />
        <Note><strong>Say the order out loud before typing:</strong> "I'll do the enums and Spot first — they're
          quick and they pin the model — then the lot's park flow, then pricing, then the gates, then wire it
          in main." Ten seconds of narration buys you fifteen minutes of looking organized.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The bricks: enums, Vehicle, Spot — with the guard built in</h2>
        <p>Part 1's debates decided all of this; now it is just typing. Notice the compatibility rules are
          <strong> data on the enum</strong> — no if-else ladder anywhere:</p>
        <Code html={`<span class="kw">public enum</span> VehicleType { BIKE, CAR, TRUCK }      <span class="cm">// label-like variation = enum (Part 1, debate #1)</span>

<span class="kw">public enum</span> SpotType {
    BIKE(EnumSet.of(VehicleType.BIKE)),                    <span class="cm">// bike spots take bikes only</span>
    COMPACT(EnumSet.of(VehicleType.CAR)),                  <span class="cm">// compact spots take cars only</span>
    LARGE(EnumSet.of(VehicleType.CAR, VehicleType.TRUCK)); <span class="cm">// trucks NEED large; cars may borrow it</span>

    <span class="kw">private final</span> Set&lt;VehicleType&gt; fits;             <span class="cm">// the compatibility table lives ON the type</span>
    SpotType(Set&lt;VehicleType&gt; fits) { <span class="kw">this</span>.fits = fits; }
    <span class="kw">public boolean</span> fits(VehicleType v) { <span class="kw">return</span> fits.contains(v); } <span class="cm">// one question, zero if-else</span>
}

<span class="kw">public record</span> Vehicle(String plate, VehicleType type) {}  <span class="cm">// immutable value carrier (Day 20)</span>`} />
        <Code html={`<span class="kw">public class</span> Spot {
    <span class="kw">public enum</span> State { FREE, OCCUPIED }           <span class="cm">// two states = the enum rung (Day 34's ladder)</span>

    <span class="kw">private final</span> String id;                       <span class="cm">// e.g. "F1-C2" — set once, never changes</span>
    <span class="kw">private final</span> SpotType type;
    <span class="kw">private</span> State state = State.FREE;              <span class="cm">// every spot is born empty</span>
    <span class="kw">private</span> Vehicle vehicle;                       <span class="cm">// who is parked here (null while FREE)</span>

    <span class="kw">public synchronized void</span> occupy(Vehicle v) {   <span class="cm">// synchronized = the atomic claim (Part 1's flag)</span>
        <span class="kw">if</span> (state != State.FREE)                   <span class="cm">// guarded transition — fail fast (Day 19)</span>
            <span class="kw">throw new</span> IllegalStateException(<span class="str">"Spot "</span> + id + <span class="str">" is not free"</span>);
        <span class="kw">if</span> (!type.fits(v.type()))                  <span class="cm">// a truck in COMPACT is a BUG, not a fee</span>
            <span class="kw">throw new</span> IllegalArgumentException(v.type() + <span class="str">" cannot fit in "</span> + type);
        state = State.OCCUPIED;                        <span class="cm">// both checks passed — flip atomically</span>
        vehicle = v;
    }

    <span class="kw">public synchronized void</span> free() { state = State.FREE; vehicle = <span class="kw">null</span>; }
    <span class="kw">public boolean</span> isFree() { <span class="kw">return</span> state == State.FREE; }
}`} />
        <Good><strong>Golden habit:</strong> the guard inside <C>occupy()</C> means a race between two gates
          produces a loud exception instead of two cars in one spot. You promised this in Part 1 with the words
          "atomic claim" — <C>synchronized</C> + the state check is that promise, kept in four lines.</Good>
        <Reveal summary="Bonus: why synchronized on the SPOT and not one big lock on the LOT?">
          <p>One lot-wide lock makes every gate queue behind every other gate — 2 entries + 2 exits all
            serialized. Locking per spot means two gates only collide when they want the <em>same</em> spot,
            which is the only collision that matters. (Strictly, the find-then-occupy pair still needs care —
            the loser of a race gets an exception and the strategy retries the next spot. Month 4 Week 13
            upgrades this to <C>tryOccupy()</C> compare-and-set with no exceptions. Mentioning "lock granularity"
            in the interview is a bonus point.)</p>
        </Reveal>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The core: Ticket + ParkingLot (with an injected Clock)</h2>
        <p>The Ticket is a <strong>record</strong> — immutable on purpose. Its <C>entryTime</C> is billing
          evidence; nobody gets a setter to "adjust" it:</p>
        <Code html={`<span class="kw">public record</span> Ticket(String id, Vehicle vehicle, String spotId, Instant entryTime) {}
<span class="cm">// immutable: the entry timestamp is FROZEN at creation — Day 20's whole argument, applied to billing</span>`} />
        <Code html={`<span class="kw">public class</span> ParkingLot {
    <span class="kw">private final</span> List&lt;Floor&gt; floors;                       <span class="cm">// ◆ composition — owned for life (Day 6)</span>
    <span class="kw">private final</span> SpotAllocationStrategy strategy;          <span class="cm">// injected (Day 15) — the lot never new's it</span>
    <span class="kw">private final</span> Clock clock;                              <span class="cm">// injected TIME — fees become testable</span>
    <span class="kw">private final</span> Map&lt;String, Ticket&gt; open = <span class="kw">new</span> HashMap&lt;&gt;(); <span class="cm">// open tickets, found again at exit</span>
    <span class="kw">private final</span> List&lt;SpotObserver&gt; observers = <span class="kw">new</span> ArrayList&lt;&gt;(); <span class="cm">// boards, apps… (Day 32)</span>

    <span class="kw">public</span> ParkingLot(List&lt;Floor&gt; floors, SpotAllocationStrategy strategy, Clock clock) {
        <span class="kw">this</span>.floors = List.copyOf(floors);                  <span class="cm">// defensive copy (Day 2)</span>
        <span class="kw">this</span>.strategy = strategy;
        <span class="kw">this</span>.clock = clock;
    }

    <span class="kw">public</span> Ticket park(Vehicle v) {                         <span class="cm">// ← stepped through in Section 4</span>
        Spot spot = strategy.findSpot(floors, v.type());    <span class="cm">// the Strategy slot — policy lives elsewhere</span>
        <span class="kw">if</span> (spot == <span class="kw">null</span>) <span class="kw">throw new</span> NoSpotAvailableException(v.type());
        spot.occupy(v);                                     <span class="cm">// guarded + synchronized (Section 2)</span>
        Ticket t = <span class="kw">new</span> Ticket(nextId(), v, spot.id(), clock.instant());
        open.put(t.id(), t);                                <span class="cm">// remembered until exit closes it</span>
        publish(<span class="kw">new</span> SpotOccupied(spot.id()));               <span class="cm">// boards tick down — lot stays ignorant</span>
        <span class="kw">return</span> t;
    }

    Ticket findOpenTicket(String id) {                      <span class="cm">// the exit gate's lookup</span>
        Ticket t = open.get(id);
        <span class="kw">if</span> (t == <span class="kw">null</span>) <span class="kw">throw new</span> UnknownTicketException(id); <span class="cm">// fake OR already-closed → loud, with context (Day 19)</span>
        <span class="kw">return</span> t;
    }

    <span class="kw">void</span> close(Ticket t) {                                  <span class="cm">// called by ExitGate AFTER payment</span>
        spotOf(t.spotId()).free();                          <span class="cm">// the spot breathes again</span>
        open.remove(t.id());                                <span class="cm">// a second close attempt now throws above ↑</span>
        publish(<span class="kw">new</span> SpotFreed(t.spotId()));                 <span class="cm">// boards tick up</span>
    }
}`} />
        <Warn><strong>The Clock is not decoration.</strong> Hardcode <C>Instant.now()</C> and your pricing test
          for "2.5 hours parked" must <em>actually wait 2.5 hours</em> (or mock static methods — pain). Inject
          <C> Clock</C> and the test uses <C>Clock.fixed(...)</C>: park at t₀, exit at t₀+150min, assert ₹60,
          done in milliseconds. This is Day 15's Clock boundary earning its keep.</Warn>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🎬 Play: park(), one line at a time</h2>
        <p>Eight lines, five Part-1 decisions. Step through and watch <em>which line</em> makes <em>what</em>
          change on the floor:</p>
        <ParkStepper />
        <Good><strong>What you should notice:</strong> ① Line 2 is the only place the lot touches allocation —
          and it is one method call on an interface. ② Line 4's occupy is where the race gets settled, not in
          the lot. ③ The board updated at line 7 without the lot naming any board. The method is short
          <em> because</em> every hard decision was delegated to the right specialist.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Pricing: an exit-time question, answered by a Strategy family</h2>
        <p>You cannot price a ticket at entry — the duration does not exist yet. So pricing runs at the
          <strong> exit gate</strong>, and because Part 1 heard "hourly now, maybe day-passes later", the
          whole topic lives behind one interface:</p>
        <Code html={`              «interface» PricingStrategy
              Money price(Ticket t, Instant exitTime)
                   ▲              ▲               ▲
         ┌─────────┘              │               └─────────────┐
   HourlyPricing          DayPassPricing         EvChargingSurcharge ◆──▶ base: PricingStrategy
   rate/h per type        flat rate per          parking = base.price(…)  ← it WRAPS another
   ceil to the hour       calendar day spanned   + energy ₹/h on top        strategy (Day 27's
                                                                            composition move!)
   The exit gate sees ONLY the interface:
       Money fee = pricing.price(ticket, clock.instant());
   …so every box above (and every future one) is a plug-in, not an edit.`} />
        <Code html={`<span class="kw">public interface</span> PricingStrategy {
    Money price(Ticket ticket, Instant exitTime);   <span class="cm">// ALL pricing knowledge enters through this one door</span>
}

<span class="kw">public class</span> HourlyPricing <span class="kw">implements</span> PricingStrategy {
    <span class="kw">private static final</span> Map&lt;VehicleType, Money&gt; RATE = Map.of(   <span class="cm">// rates per type — data, not if-else</span>
        VehicleType.BIKE,  Money.rupees(<span class="num">10</span>),
        VehicleType.CAR,   Money.rupees(<span class="num">20</span>),
        VehicleType.TRUCK, Money.rupees(<span class="num">40</span>));

    <span class="kw">public</span> Money price(Ticket t, Instant exit) {
        Duration parked = Duration.between(t.entryTime(), exit);  <span class="cm">// finally computable — exit time exists</span>
        <span class="kw">long</span> hours = ceilHours(parked);                <span class="cm">// 1h01m bills as 2h — POLICY, kept in ONE place</span>
        <span class="kw">return</span> RATE.get(t.vehicle().type()).times(hours);
    }

    <span class="kw">private long</span> ceilHours(Duration d) {
        <span class="kw">return</span> Math.max(<span class="num">1</span>, (d.toMinutes() + <span class="num">59</span>) / <span class="num">60</span>);  <span class="cm">// integer ceiling + 1-hour minimum</span>
        <span class="cm">// ⚠ NEVER d.toHours() here — it TRUNCATES: 119 minutes would bill as 1 hour</span>
    }
}

<span class="kw">public class</span> EvChargingSurcharge <span class="kw">implements</span> PricingStrategy {
    <span class="kw">private final</span> PricingStrategy base;             <span class="cm">// wraps ANY other pricing — hourly, day-pass…</span>
    <span class="kw">private final</span> Money energyPerHour = Money.rupees(<span class="num">15</span>);

    <span class="kw">public</span> EvChargingSurcharge(PricingStrategy base) { <span class="kw">this</span>.base = base; }

    <span class="kw">public</span> Money price(Ticket t, Instant exit) {
        Money parking = base.price(t, exit);            <span class="cm">// ① delegate: the wrapped strategy does parking</span>
        <span class="kw">long</span> hours = Math.max(<span class="num">1</span>, (Duration.between(t.entryTime(), exit).toMinutes() + <span class="num">59</span>) / <span class="num">60</span>);
        <span class="kw">return</span> parking.plus(energyPerHour.times(hours)); <span class="cm">// ② add energy on top — composition, not copy-paste</span>
    }
}`} />
        <Note><strong>Money is <C>Money</C>, never <C>double</C>.</strong> Day 20 built the value object —
          BigDecimal inside, currency guarded, rounding explicit — exactly so that this fee line would not
          drift by paise. <C>DayPassPricing</C> follows the same shape with calendar days; writing it is part
          of tonight's homework.</Note>
        <Reveal summary="Bonus: is EvChargingSurcharge a Strategy or a Decorator?">
          <p>Both, honestly — and saying so is a strong interview moment. Toward the gate it is a
            <em> Strategy</em> (one interchangeable <C>PricingStrategy</C>). Internally it uses the
            <em> Decorator</em> shape from Day 27: implements the interface AND holds one, adding behavior
            around the delegate call. Patterns are vocabulary, not boxes — real classes often speak two words
            at once.</p>
        </Reveal>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>💸 Play: The pricing lab</h2>
        <p>Swap strategies, change the vehicle, drag the clock. Watch the breakdown recompute — and watch the
          one line of exit-gate code at the bottom <strong>never change</strong>:</p>
        <PricingLab />
        <Good><strong>What you should notice:</strong> ① 2h30m bills as 3 hours — find the exact moment +30min
          crosses an hour boundary and the fee jumps. ② Switching to the EV surcharge shows TWO strategies
          cooperating: the wrapper's receipt literally contains the hourly receipt. ③ The day-pass becomes
          cheaper than hourly for a truck around hour 10 — pricing strategy choice is a business decision, and
          the code made it swappable for exactly that reason.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The gates: tickets out, receipts in — order matters</h2>
        <p>Gates are thin. The entry gate asks the lot to park; the exit gate runs a four-step ritual whose
          <strong> order is part of correctness</strong>:</p>
        <Code html={`<span class="kw">public class</span> EntryGate {
    <span class="kw">private final</span> String id;
    <span class="kw">private final</span> ParkingLot lot;                   <span class="cm">// uses-a (Day 7): passed in, not owned</span>

    <span class="kw">public</span> Ticket requestTicket(Vehicle v) {
        <span class="kw">return</span> lot.park(v);                         <span class="cm">// that's it — gates don't think, they ask</span>
    }
}

<span class="kw">public class</span> ExitGate {
    <span class="kw">private final</span> ParkingLot lot;
    <span class="kw">private final</span> PricingStrategy pricing;          <span class="cm">// injected — swap pricing, this file never recompiles</span>
    <span class="kw">private final</span> Clock clock;

    <span class="kw">public</span> Receipt exit(String ticketId) {
        Ticket t = lot.findOpenTicket(ticketId);    <span class="cm">// ① find — fake/closed ticket throws RIGHT HERE</span>
        Money fee = pricing.price(t, clock.instant()); <span class="cm">// ② price — duration finally known</span>
        <span class="cm">// ③ pay — assumed OK (scoped out in Part 1; a PaymentProcessor port plugs in here later)</span>
        lot.close(t);                               <span class="cm">// ④ close — frees spot + notifies boards + forgets ticket</span>
        <span class="kw">return new</span> Receipt(t, fee, clock.instant()); <span class="cm">// proof of payment, exit barrier lifts</span>
    }
}

<span class="kw">public record</span> Receipt(Ticket ticket, Money fee, Instant paidAt) {}  <span class="cm">// another frozen record</span>`} />
        <Code html={`  THE EXIT SEQUENCE (Part 1 drew entry; this is the other half)

  🚗 → ExitGate: exit(ticketId)
  ExitGate → Lot: findOpenTicket(id)      ← unknown OR already-closed id throws here
  ExitGate → Pricing: price(ticket, now)  ← the strategy slot, exit-time edition
  ExitGate → (payment: assumed ok)
  ExitGate → Lot: close(ticket)
       Lot → Spot: free()                 ← FREE again
       Lot ┄▶ observers: spotFreed        ← boards tick UP
  ExitGate → 🚗: Receipt{fee, paidAt}     ← barrier lifts

  WHY THIS ORDER?  price BEFORE free: free first, and a new car can claim
  the spot while payment is still settling. close LAST: a double-scanned
  ticket finds nothing in 'open' and THROWS — billing twice is impossible
  by construction. That property has a name: idempotent exit.`} />
        <Warn><strong>The double-scan is not hypothetical.</strong> Barrier machines re-read tickets all the
          time. Because <C>close()</C> removes the ticket from <C>open</C>, the second scan hits
          <C> UnknownTicketException</C> and the gate shows "already paid — drive on" instead of charging
          again. You did not write idempotency code; the <em>order</em> of four lines gave it to you.</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>main(): the composition root — where every swap is one line</h2>
        <p>Day 15 said it: build the object graph in <strong>one place</strong>, at the edge. Here is the whole
          lot, wired:</p>
        <Code html={`<span class="kw">public static void</span> main(String[] args) {
    Clock clock = Clock.systemDefaultZone();                <span class="cm">// real time in prod; Clock.fixed(...) in tests</span>

    List&lt;Floor&gt; floors = FloorBuilder.standardTwoFloors();  <span class="cm">// F1 + F2 with their spot mix</span>
    ParkingLot lot = <span class="kw">new</span> ParkingLot(floors, <span class="kw">new</span> NearestFirstStrategy(), clock);

    lot.subscribe(<span class="kw">new</span> DisplayBoard(<span class="str">"F1"</span>));                 <span class="cm">// observers join here — the lot never asked who</span>
    lot.subscribe(<span class="kw">new</span> DisplayBoard(<span class="str">"F2"</span>));

    PricingStrategy pricing = <span class="kw">new</span> EvChargingSurcharge(<span class="kw">new</span> HourlyPricing());
    <span class="cm">// ↑ THE line. Weekend rates? Day passes? Grace period? — this line changes, nothing else recompiles.</span>

    EntryGate in1 = <span class="kw">new</span> EntryGate(<span class="str">"IN-1"</span>, lot);
    EntryGate in2 = <span class="kw">new</span> EntryGate(<span class="str">"IN-2"</span>, lot);            <span class="cm">// two entries, same lot — oneness by WIRING,</span>
    ExitGate out1 = <span class="kw">new</span> ExitGate(<span class="str">"OUT-1"</span>, lot, pricing, clock); <span class="cm">// not by getInstance() (Part 1, debate #2)</span>
    ExitGate out2 = <span class="kw">new</span> ExitGate(<span class="str">"OUT-2"</span>, lot, pricing, clock);

    Ticket t = in1.requestTicket(<span class="kw">new</span> Vehicle(<span class="str">"KA-01-AB-1234"</span>, VehicleType.CAR)); <span class="cm">// 🚗 in…</span>
    Receipt r = out2.exit(t.id());                          <span class="cm">// …and out the OTHER gate — shared lot, naturally</span>
}`} />
        <Good><strong>The interview sentence this buys you:</strong> "Every variation you can throw at me —
          pricing, allocation, new displays — lands as a new class plus one line in this method. The lot, the
          gates and the tickets are closed." That is OCP, demonstrated rather than recited.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>🕐 Play: Minute 40 — the variation drill</h2>
        <p>Your code works, and the interviewer smiles: "small change of requirements…" For each curveball,
          pick where the change lands:</p>
        <Minute40Drill />
        <Good><strong>What you should notice:</strong> ① Every correct answer = new file + one wiring line —
          the cores stayed shut. ② Two answers included an <em>ask-back</em> (bill from minute 0 or 31?) —
          variations often hide an unstated business decision, and surfacing it scores higher than coding
          either guess. ③ The wrong answers were all real code you have seen in real codebases. 🙂</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps — the bugs that cost offers</h2>
        <Warn><strong>double for money.</strong> <C>20.10 * 3</C> in double is 60.299999999999997. Day 20's
          Money (BigDecimal + currency + explicit rounding) exists for this. Interviewers WILL ask "why
          BigDecimal?" — have the 0.1-is-not-representable answer ready.</Warn>
        <Warn><strong><C>Duration.toHours()</C> truncates.</strong> 119 minutes → 1. Your 1h59m customer pays
          for one hour and your employer notices at the end of the quarter. Ceiling math:
          <C> (minutes + 59) / 60</C> — and the zero-minute edge ("did they pay at all?") is a business
          question to ask, answered here with a 1-hour minimum.</Warn>
        <Warn><strong>Computing the fee at entry.</strong> Seen in real submissions: <C>ticket.setFee(...)</C>
          at the entry gate. The duration does not exist yet — this design can only ever bill a constant.
          Fee is an exit-time function of (entryTime, exitTime, type, policy).</Warn>
        <Warn><strong><C>switch (vehicle.type())</C> pricing inside the gate.</strong> It works on day one —
          and then weekend rates arrive and you are editing the gate, then passes arrive and you edit it again
          (Day 12's growing switch, in a parking uniform). The strategy interface is the fix you already own.</Warn>
        <Warn><strong>A mutable Ticket.</strong> <C>setEntryTime()</C> is a discount-fraud API and a debugging
          nightmare. Records make the right thing the easy thing — there is simply no setter to call.</Warn>
        <Warn><strong>Asymmetric exit.</strong> Freeing the spot but forgetting <C>publish(spotFreed)</C> —
          boards drift downward all day until the "full" lot is half empty. Every state change that notified
          on the way IN must notify on the way OUT. Symmetry is the test to write.</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Build order (15 min):</strong> enums + Spot + Ticket → PricingStrategy + Hourly → lot's park/close → gates → main(). Bottom-up: never call a class that doesn't exist yet.</li>
          <li><strong>Key signatures:</strong> <C>Ticket park(Vehicle)</C> · <C>Receipt exit(String ticketId)</C> · <C>Money price(Ticket, Instant)</C> · <C>Spot findSpot(List&lt;Floor&gt;, VehicleType)</C>.</li>
          <li><strong>Exit ritual, in order:</strong> find (throws if closed) → price → pay → close (free + notify + forget). Price before free; close last = idempotent.</li>
          <li><strong>Pricing rules live in strategies</strong> — rounding, grace periods, weekend multipliers, EV energy. Gates never learn a single rate. Wrappers compose (EV = surcharge around any base).</li>
          <li><strong>Money is Money</strong> (BigDecimal, Day 20). Time is an injected <C>Clock</C> (Day 15). Tickets and Receipts are records (Day 20) — billing evidence does not get setters.</li>
          <li><strong>One swap line:</strong> every minute-40 variation = new class + one line in main(). If a variation forces you into the lot or a gate, a seam is missing — say so and add it.</li>
          <li><strong>Concurrency story (one breath):</strong> guarded <C>synchronized occupy()</C> settles gate races per spot; loser retries next spot; Month 4 upgrades to compare-and-set.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Why isn&apos;t price() a method on Ticket? It has all the data."'>
          <p>Information Expert (Day 10) does point at Ticket — it holds entryTime and the vehicle. But pricing
            is the design's most <em>volatile</em> axis: hourly today, passes and surcharges tomorrow, different
            per lot. Pinning one policy into a stable entity means editing Ticket for every promotion. So the
            split: Ticket supplies <em>facts</em>, PricingStrategy supplies <em>policy</em>. Naming the tension
            and resolving it out loud is exactly what this question fishes for.</p>
        </Reveal>
        <Reveal summary='Q: "First 30 minutes free — show me where that goes."'>
          <p>Inside pricing — either a rule in the strategy or a <C>GracePeriodPricing(base)</C> wrapper that
            returns zero under 30 minutes and otherwise delegates. Never in the gate (gates know no rates), and
            never by stamping entryTime late (that falsifies the record every other feature reads). Then the
            ask-back: past minute 30, bill from minute 0 or minute 31? Both exist in the wild; it changes the
            wrapper's one line.</p>
        </Reveal>
        <Reveal summary='Q: "How do you unit test HourlyPricing? No sleeping allowed."'>
          <p>It needs no clock at all — it is a pure function of (ticket, exitTime). Build a ticket with
            <C> entryTime = Instant.parse("2026-01-01T10:00:00Z")</C>, call <C>price(t, entry.plus(ofMinutes(150)))</C>,
            assert ₹60. Then table-drive the boundaries: 59, 60, 61 minutes (1h, 1h, 2h) and 0 minutes (the
            minimum). The lot-level test is where the injected <C>Clock.fixed()</C> earns its keep.</p>
        </Reveal>
        <Reveal summary='Q: "Lost ticket — in CODE terms this time."'>
          <p>Two pieces. Lookup: a secondary index <C>Map&lt;plate, Ticket&gt;</C> kept alongside <C>open</C>
            (updated in the same park/close methods, so they cannot drift). Fee: a
            <C> LostTicketPricing</C> — max-of-day or a flat penalty — which is just one more member of the
            strategy family. The lost-ticket flow is a different entry point in ExitGate calling the same
            four-step ritual with a different strategy. No panic, no special-case spaghetti.</p>
        </Reveal>
        <Reveal summary='Q: "Ticket scanned twice at the exit barrier — what happens, exactly?"'>
          <p>First scan: find → price → pay → close (ticket leaves <C>open</C>). Second scan:
            <C> findOpenTicket</C> throws <C>UnknownTicketException</C>, the gate catches it and shows
            "already paid". Double-billing is impossible <em>by construction</em> because close runs last. If
            the interviewer pushes ("two scans CONCURRENTLY?"), concede that close itself wants to be atomic —
            <C> open.remove(id)</C> returning null for the loser is the cheap fix, and say Month-4 words:
            "remove is my compare-and-set here".</p>
        </Reveal>
        <Reveal summary='Q: "Weekday ₹20, weekend ₹30 — and a car parks Friday 11 PM to Saturday 2 AM."'>
          <p>The trap is assuming one rate per ticket. Honest answers, in ascending effort: ① rate at
            <em> exit</em> time (simple, mildly unfair), ② rate at <em>entry</em> time (same, reversed),
            ③ split the duration at midnight and bill each segment at its own rate (correct, more code). The
            real point: all three live inside one <C>WeekendAwarePricing</C> — the choice changes that file
            only, and you should ASK which the business wants rather than silently pick.</p>
        </Reveal>
        <Reveal summary='Q: "Where would a PaymentProcessor fit, if we un-scope payments?"'>
          <p>A port (interface) injected into ExitGate, called between price and close:
            <C> paymentProcessor.charge(fee)</C> — with UPI/card/cash as implementations (Strategy again) or
            adapters around vendor SDKs (Day 26). Failure handling: payment fails → do NOT close → the ticket
            stays open and the barrier stays down. The flow's order was designed so that this insert is one
            line — point that out.</p>
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
        <strong>Day 42 complete?</strong> Homework: type the whole lot into a real project — every class from
        today, plus <C>DayPassPricing</C> (calendar days spanned, not duration ÷ 24h — check in at 11 PM, out
        at 1 AM = 2 days!) and a <C>WeekendAwarePricing</C> wrapper. In <C>main()</C>, use
        <C> Clock.fixed()</C> to park three vehicles, "wait" 150 minutes by passing a later Instant, exit them,
        and print receipts. Then prove the OCP claim to yourself: switch the pricing line in main() between all
        four strategies and confirm via the compiler that NOTHING else recompiles.
        <br /><br />
        Next: <strong>Day 43 — Tic-Tac-Toe</strong>: the cleanest small game there is — board, turns,
        win-checking without 8 hardcoded ifs, and the extensibility questions (NxN? three players?) that turn
        a toy into a design conversation.
      </div>
    </div>
  )
}
