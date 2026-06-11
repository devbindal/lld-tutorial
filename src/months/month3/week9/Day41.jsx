import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The clarifying-questions game ============ */
const QUESTIONS_POOL = [
  { q: 'Is the lot multi-floor?', a: '"Yes — several floors, expandable."', good: true, why: 'Introduces the Floor entity and the Lot ◆ Floor ◆ Spot composition — structural gold.' },
  { q: 'Which vehicle types must we support?', a: '"Bikes, cars and trucks."', good: true, why: 'Drives spot TYPES (enum!) and allocation compatibility rules — half the design.' },
  { q: 'How is parking priced?', a: '"Hourly, different rates per vehicle type. Maybe day-passes later."', good: true, why: '"Maybe later" = a Strategy slot (Day 31). Pricing variability is now a designed-for axis (Part 2).' },
  { q: 'Multiple entry/exit gates?', a: '"Yes — 2 entries, 2 exits, simultaneous."', good: true, why: 'Flags CONCURRENCY (two gates, one last spot — Month 4) and locates ticket issuing at gates.' },
  { q: 'Do floors need live availability displays?', a: '"Yes — a board per floor."', good: true, why: 'Observer (Day 32): boards subscribe to spot events. One question just placed a pattern.' },
  { q: 'What color should the tickets be?', a: '"…the interviewer checks the clock."', good: false, why: 'Cosmetics. Zero design impact. The clock is your enemy — spend questions where the DESIGN bends.' },
  { q: 'Should we handle payments in this round?', a: '"Assume payment succeeds — out of scope today."', good: true, why: 'Scoping OUT is as valuable as scoping in (Day 10): you just saved 10 minutes and showed judgment.' },
  { q: 'Will the lot ever host helicopters?', a: '"…no."', good: false, why: 'Speculative fiction (Day 16: YAGNI). Ask about PLAUSIBLE growth (EV charging), not sci-fi.' },
]

function QuestionGame() {
  const [asked, setAsked] = useState({})
  const goodCount = Object.keys(asked).filter((i) => QUESTIONS_POOL[i].good).length
  const badCount = Object.keys(asked).length - goodCount

  return (
    <div className="panel">
      <div className="ptitle">Live demo · "Design a parking lot." — you have ~5 minutes of questions. Choose well.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {QUESTIONS_POOL.map((item, i) => (
          <div key={i}>
            <button className={asked[i] !== undefined ? 'ghost act' : 'act'}
              style={{ fontSize: 12.5, opacity: asked[i] !== undefined ? 0.85 : 1 }}
              onClick={() => setAsked((a) => ({ ...a, [i]: true }))}>
              ❓ {item.q}
            </button>
            {asked[i] && (
              <div className="statbar" style={{ marginTop: 4, background: item.good ? '#EAF7EF' : '#FDECEC' }}>
                <span style={{ fontSize: 13 }}>{item.good ? '✅' : '⏳'} {item.a} — <b>{item.good ? 'design-shaping' : 'clock-burning'}:</b> {item.why}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="statbar" style={{ marginTop: 10 }}>
        🎯 <span>design-shaping questions: {goodCount} · clock-burners: {badCount} — interviewers grade the QUALITY of your questions before a single class is drawn.</span>
      </div>
    </div>
  )
}

/* ============ Interactive 2: The decision debates ============ */
const DEBATES = [
  { d: 'Vehicles: should Bike, Car, Truck be SUBCLASSES of Vehicle?',
    o: ['Yes — always model real-world hierarchies', 'No — they differ only in DATA (a size/type). Use enum VehicleType { BIKE, CAR, TRUCK } on one Vehicle class; subclass only when behavior genuinely diverges', 'Make them interfaces', 'One String field "type"'], a: 1,
    why: 'Day 10\'s rule: enum for label-like variation, subclasses for behavioral variation. Empty subclasses are ceremony; a String type is Day 19\'s typo machine. If trucks later need special logic — refactor THEN (fool-me-once).' },
  { d: 'Should ParkingLot be a Singleton?',
    o: ['Yes — there is only one lot', 'Better: ONE instance created at the composition root and injected — oneness by wiring keeps it testable; getInstance() everywhere is hidden global coupling', 'Make every method static', 'One lot per vehicle'], a: 1,
    why: 'Day 21\'s verdict verbatim. Bonus interview line: "and if we ever manage multiple lots, the DI version needs zero changes — the singleton version needs surgery."' },
  { d: 'WHO decides which spot a vehicle gets?',
    o: ['The Vehicle picks', 'A SpotAllocationStrategy interface injected into the lot — NearestFirst today; ElectricNearChargers or HandicappedPriority tomorrow as new classes', 'A giant if-else in ParkingLot', 'The gate hardware'], a: 1,
    why: 'Day 31, textbook slot: allocation policy is a varying ALGORITHM. The if-else version reopens the lot for every policy change (Day 12); the strategy version makes policies plug-in files.' },
  { d: 'Spot occupancy: where does FREE/OCCUPIED live?',
    o: ['A boolean isFree', 'An enum SpotState with a guarded transition (occupy() throws if not FREE) — Day 19\'s ladder rung; full State classes would be ceremony for two states', 'State pattern classes per state', 'A global Map of occupancy'], a: 1,
    why: 'The graduation ladder (Day 34): two states + tiny behavior = enum + guard. Booleans allow no third state later (RESERVED, OUT_OF_SERVICE — coming!); class-states earn nothing yet. Climb when crowded.' },
  { d: 'How do per-floor display boards stay current?',
    o: ['Boards poll every second', 'Observer (Day 32): the lot publishes SpotOccupied/SpotFreed events; boards subscribe — no polling, and adding the mobile app later = one more subscriber', 'The Spot updates boards directly', 'Cron job'], a: 1,
    why: 'Polling burns cycles and lags; spots knowing about boards couples parking to UI (DIP inverted the wrong way). Events keep the lot ignorant of its audience — and extensible to apps, sensors, dashboards.' },
]

function DecisionDebates() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= DEBATES.length
  const cur = DEBATES[idx]

  function pick(i) {
    if (picked !== null) return
    setPicked(i)
    if (i === cur.a) setScore((s) => s + 1)
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · five design debates — argue like the interview is live</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Score: <b>{score} / {DEBATES.length}</b> — every verdict here cited a specific earlier day. That citing habit IS the interview skill.</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>⚖️ <span>debate {idx + 1} of {DEBATES.length} · score {score}</span></div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.d}</p>
          <div className="modbtns">
            {cur.o.map((o, i) => (
              <button key={i} className={picked !== null && i === cur.a ? 'on' : ''}
                style={{ fontSize: 12.5, ...(picked === i && i !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}) }}
                onClick={() => pick(i)}>{o.length > 60 ? o.slice(0, 57) + '…' : o}</button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ ' : '❌ '} <b>{cur.o[cur.a]}</b><br /><br />{cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={() => { setPicked(null); setIdx((i) => i + 1) }}>Next debate →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: The allocation simulator ============ */
const INITIAL_SPOTS = [
  ...['B', 'B', 'C', 'C', 'C', 'L'].map((t, i) => ({ id: `F1-${i + 1}`, floor: 1, type: t, by: null })),
  ...['C', 'C', 'C', 'L', 'L', 'B'].map((t, i) => ({ id: `F2-${i + 1}`, floor: 2, type: t, by: null })),
]
const FITS = { bike: ['B'], car: ['C', 'L'], truck: ['L'] }
const VICONS = { bike: '🛵', car: '🚗', truck: '🚚' }

function AllocationSim() {
  const [spots, setSpots] = useState(INITIAL_SPOTS)
  const [log, setLog] = useState(null)

  function arrive(v) {
    const spot = spots.find((s) => !s.by && FITS[v].includes(s.type))   // nearest-first scan
    if (!spot) { setLog(`🚫 lot.park(${v}) → NoSpotAvailableException — every ${FITS[v].join('/')} spot is taken. The gate shows FULL for ${v}s.`) ; return }
    setSpots((ss) => ss.map((s) => (s.id === spot.id ? { ...s, by: v } : s)))
    setLog(`🎫 NearestFirstStrategy scanned F1→F2 and chose ${spot.id} (${spot.type}) → spot.occupy() → Ticket{${spot.id}, ${VICONS[v]}, t=now} issued → boards notified 📟`)
  }
  const leave = (id) => {
    setSpots((ss) => ss.map((s) => (s.id === id ? { ...s, by: null } : s)))
    setLog(`💸 exit gate: ticket closed for ${id} → spot.free() → boards notified 📟`)
  }
  const freeOn = (f) => spots.filter((s) => s.floor === f && !s.by).length

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the design, running — nearest-first allocation over 2 floors</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {Object.keys(FITS).map((v) => (
          <button key={v} className="act" onClick={() => arrive(v)}>{VICONS[v]} {v} arrives</button>
        ))}
        <button className="ghost act" onClick={() => { setSpots(INITIAL_SPOTS); setLog(null) }}>empty the lot</button>
      </div>
      {[1, 2].map((f) => (
        <div key={f} style={{ marginBottom: 8 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5' }}>
            FLOOR {f} · 📟 board: {freeOn(f)} free
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {spots.filter((s) => s.floor === f).map((s) => (
              <span key={s.id} className="chip"
                onClick={() => s.by && leave(s.id)}
                style={{
                  fontFamily: 'IBM Plex Mono', cursor: s.by ? 'pointer' : 'default',
                  background: s.by ? '#FFE0DE' : s.type === 'B' ? '#E5EBFF' : s.type === 'C' ? '#EAF7EF' : '#FFF1D6',
                }}>
                {s.id} {s.type} {s.by ? VICONS[s.by] : '·'}
              </span>
            ))}
          </div>
        </div>
      ))}
      <div className="statbar" style={{ display: 'block' }}>
        {log
          ? <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{log}</span>
          : <span>🅿️ B=bike C=compact L=large. Park some trucks until they're rejected; click an occupied spot to make it leave.</span>}
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The FIRST thing you do when the interviewer says "design a parking lot"?',
    o: ['Start drawing classes', 'Ask 4–6 design-shaping clarifying questions (floors? vehicle types? pricing? gates? displays?) and agree scope OUT LOUD — including what is out of scope', 'Write the Vehicle class', 'Recite patterns'], a: 1,
    e: 'Day 10\'s ritual, now at match speed: the questions ARE graded, vague prompts are deliberate, and scoping payments OUT earns as much as scoping floors IN.',
    w: { 0: 'Classes drawn before scope = classes redrawn at minute 20.',
         2: 'Whose vehicles? Carrying what types? You don\'t know yet.',
         3: 'Pattern recitation without a problem is noise.' },
    r: { id: 's2', label: 'Section 2 — the ritual' } },
  { q: 'Bike/Car/Truck with no differing behavior — model them as…',
    o: ['Three subclasses of Vehicle', 'One Vehicle class with enum VehicleType — subclass only when behavior diverges; the enum drives spot-compatibility data', 'Three unrelated classes', 'String type field'], a: 1,
    e: 'Label-like variation = enum (Days 10/19). Empty subclasses are ceremony that LSP never asked for; the String version invites "TRUKC" into production.',
    w: { 0: 'Subclasses earn their files only with real behavioral differences.',
         2: 'Unrelated classes can\'t share Ticket/Spot handling.',
         3: 'Day 19 called this the typo machine.' },
    r: { id: 's5', label: 'Section 5 — debate #1' } },
  { q: 'Spot allocation policy belongs in…',
    o: ['A big if-else inside ParkingLot.park()', 'An injected SpotAllocationStrategy interface — NearestFirst now; future policies (EV-near-chargers, handicapped-priority) become new classes, lot untouched', 'The Vehicle class', 'The database'], a: 1,
    e: 'A varying algorithm behind one interface = Strategy (Day 31), and the lot stays closed (Day 12). The interviewer\'s "what if we prioritize EVs?" follow-up is then a one-file answer.',
    w: { 0: 'Every policy tweak reopens the tested lot.',
         2: 'Vehicles choosing spots = feature envy of lot data (Day 18).',
         3: 'Storage stores; policy decides.' },
    r: { id: 's5', label: 'Section 5 — debate #3' } },
  { q: 'The Lot→Floor→Spot relationship and the "247 free spots" rollup are…',
    o: ['Three unrelated classes', 'Composition (◆ — floors die with the lot, Day 6) shaped like Day 28\'s Composite: availableCount() on the lot sums floors, floors sum spots — recursion by structure', 'Inheritance', 'A flat global list'], a: 1,
    e: 'Lot ◆ Floor ◆ Spot is the hamper again: whole-part ownership + a propagating aggregate operation. The UML diamond and the recursive count both come straight from Weeks 2 and 6.',
    w: { 0: 'They form the problem\'s backbone hierarchy.',
         2: 'A floor is not a kind of lot (Day 3\'s is-a test).',
         3: 'Flat lists lose per-floor boards and future per-floor rules.' },
    r: { id: 's7', label: 'Section 7 — the class diagram' } },
  { q: 'Spot FREE/OCCUPIED is best modeled as…',
    o: ['boolean isFree', 'enum SpotState with guarded transitions (occupy() throws unless FREE) — extensible to RESERVED / OUT_OF_SERVICE without redesign', 'Full State-pattern classes', 'An int 0/1'], a: 1,
    e: 'Day 34\'s ladder: two states with tiny behavior = enum rung. The boolean caps you at two states forever; class-states are ceremony until per-state behavior grows.',
    w: { 0: 'RESERVED arrives next sprint and the boolean dies.',
         2: 'Climb the ladder when crowded — not preemptively.',
         3: 'Day 19 on magic numbers.' },
    r: { id: 's8', label: 'Section 8 — the spot machine' } },
  { q: 'Floor display boards should update via…',
    o: ['Polling the lot every second', 'Observer: the lot publishes SpotOccupied/SpotFreed; boards (and later the mobile app) subscribe — the lot never knows its audience', 'Spots calling board.update() directly', 'Manual refresh'], a: 1,
    e: 'Day 32 verbatim: polling wastes and lags; spots knowing boards couples parking to UI. Events make every future consumer (app, sensors, analytics) a subscription, not an edit.',
    w: { 0: '86,400 wasted checks per day per board.',
         2: 'Parking logic importing display classes inverts DIP the wrong way.',
         3: 'It\'s 2026. 🙂' },
    r: { id: 's5', label: 'Section 5 — debate #5' } },
  { q: 'The Ticket should record…',
    o: ['Only the vehicle number', 'An id, the vehicle, the assigned spot, and an IMMUTABLE entryTime — the fee computation (Part 2) needs exactly this data, making Ticket its natural home (Information Expert)', 'The fee, precomputed at entry', 'Nothing; tickets are decorative'], a: 1,
    e: 'Day 10\'s parking walkthrough said it: Ticket holds entryTime, so Ticket (or a pricing strategy fed by it) computes the fee. Precomputing at entry is impossible — duration is unknown.',
    w: { 0: 'Then exit can\'t find the spot or compute duration.',
         2: 'You\'d be billing the future.',
         3: 'The ticket IS the parking session\'s identity.' },
    r: { id: 's4', label: 'Section 4 — the entity pass' } },
  { q: 'Two entry gates, one remaining spot, two cars at the same instant — your interview answer?',
    o: ['Cannot happen', 'Flag it: spot assignment must be ATOMIC (synchronized allocation or a tryOccupy compare-and-set on the spot); naming the race and a fix is expected even before Month 4\'s deep dive', 'First gate alphabetically wins', 'Add more spots'], a: 1,
    e: 'Check-then-act on a shared spot = Day 21\'s race in a parking uniform. You need not implement locks today — but FAILING TO MENTION the race when you yourself asked "multiple gates?" loses the thread you started.',
    w: { 0: 'It happens every rush hour.',
         2: 'The scheduler doesn\'t alphabetize. 🙂',
         3: 'Capacity doesn\'t fix atomicity.' },
    r: { id: 's8', label: 'Section 8 — the entry sequence' } },
]

/* ============ The page ============ */
export default function Day41() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 9 · Day 41 · Classic LLD Problems</div>
        <h1>Parking Lot — Part 1:<br />The Famous Opener, Designed Properly</h1>
        <p>Month 3 changes the game: no new tools — instead, the REAL problems interviews ask, solved with
           everything from Days 1–40. We start with the most famous prompt on Earth. Today: requirements →
           entities → decisions → diagrams. Part 2 codes it. Click everything.</p>
        <div className="chips">
          {['parking lot', 'clarifying questions', 'entities', 'design debates', 'class diagram', 'allocation strategy'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What a 45-minute LLD round actually grades</h2>
        <Code html={`  THE TIME BUDGET (and the rubric hiding inside it)

  0–5 min    clarifying questions & scope     ← judgment (Day 10)
  5–15 min   entities + relationships          ← modeling (Weeks 1–2)
  15–30 min  class diagram + key decisions     ← principles & patterns (Weeks 3–8)
  30–40 min  one flow end-to-end + code core   ← Part 2's territory
  40–45 min  follow-ups: "what if we add…?"    ← your design's OCP, tested live`} />
        <Note><strong>The single biggest mistake:</strong> writing classes at minute 1. The prompt is vague ON
          PURPOSE — the first five minutes are an audition for how you handle ambiguity. Everything you need
          was built on Day 10; today it runs at match speed.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>"Design a parking lot." — the ritual begins</h2>
        <p>Eleven words. Multi-floor? Valet? Airport-sized or restaurant-sized? Free or paid? The prompt
          answers nothing — deliberately. Your move is a short, sharp question burst, and the skill is telling
          <strong> design-shaping questions</strong> from clock-burners.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>❓ Play: Spend your five minutes</h2>
        <QuestionGame />
        <Good><strong>What you should notice:</strong> ① Each good question CREATED design material: an entity
          (Floor), an enum (VehicleType), a pattern slot (Strategy, Observer), a risk flag (concurrency).
          ② The payments answer shows scoping OUT is a win. ③ Two clock-burners cost what three good questions
          earn — interviewers notice the ratio.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The agreed scope → the entity pass (Day 10's assembly line)</h2>
        <Code html={`  AGREED SCOPE                          NOUN/VERB PASS → ENTITIES
  multi-floor lot · bikes/cars/trucks   ParkingLot (1) ◆ Floor (1..*) ◆ Spot (1..*)
  spot sizes per vehicle                Spot { id, SpotType, SpotState }
  ticket at entry, pay at exit          enum SpotType { BIKE, COMPACT, LARGE }
  hourly type-based pricing (Part 2)    enum VehicleType { BIKE, CAR, TRUCK }
  2 entry + 2 exit gates                Vehicle { plate, VehicleType }   ← no subclasses (yet!)
  per-floor display boards              Ticket { id, vehicle, spot, entryTime }
  OUT: payments, reservations, valet    EntryGate / ExitGate · DisplayBoard
                                        SpotAllocationStrategy «interface»`} />
        <p>Filter notes (the Day 10 buckets at work): <em>parking</em> and <em>payment</em> are verbs → methods,
          not classes; <em>rate/fee</em> → values computed by Part 2's pricing strategy; <em>"the system"</em>
          → not a class (the god trap). Every noun above survived the identity/data/behavior test.</p>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>⚖️ Play: The five debates</h2>
        <p>Entities agreed — now the decisions interviewers actually probe. Argue each, then read the verdict:</p>
        <DecisionDebates />
        <Good><strong>What you should notice:</strong> ① Every verdict cited a specific day — "enum because
          Day 19, strategy because Day 31" is precisely how you justify choices out loud. ② Twice the verdict
          was the SIMPLER option (no subclasses, no state classes) — restraint cites days too (16, 34).
          ③ These five debates ARE the interview's middle 15 minutes.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The class diagram (Day 8, at match speed)</h2>
        <Code html={`  ┌─────────────────┐ 1    1..* ┌──────────┐ 1   1..* ┌─────────────────────┐
  │   ParkingLot    │◆──────────│  Floor   │◆─────────│        Spot         │
  ├─────────────────┤           ├──────────┤          ├─────────────────────┤
  │ + park(v)       │           │ + free():│          │ - type: SpotType    │
  │ + unpark(t)     │           │     int  │          │ - state: SpotState  │
  │ + available()   │           └──────────┘          │ + occupy(v) ⚠guarded│
  └───┬──────┬──────┘                                 └─────────────────────┘
      │      │ publishes events                                ▲ 1
      │      ▼                                                 │ assigned
      │  «interface» SpotObserver ◁┄┄ DisplayBoard      ┌──────┴────────┐
      │  (Day 32)        (one per floor)                │    Ticket     │
      ▼                                                 ├───────────────┤
  «interface» SpotAllocationStrategy ◁── NearestFirst   │ - entryTime ⏱ │
  (Day 31 — injected, swappable)        (today's only)  │ → vehicle     │
                                                        └───────────────┘
  EntryGate ┄┄uses┄┄▶ ParkingLot ◀┄┄uses┄┄ ExitGate     Vehicle { plate,
  (issues Ticket)         (closes Ticket, fee in Pt 2)    VehicleType }`} />
        <p>Read it aloud once, Week-2 style: "a ParkingLot is composed of Floors composed of Spots; the lot
          delegates allocation to an injected strategy and publishes spot events to observers; gates use the
          lot; a Ticket associates a vehicle with its spot and entry time." If you can say that sentence,
          you can draw this in four minutes.</p>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The spot's tiny state machine + the entry flow</h2>
        <Code html={`  SPOT (enum rung, Day 34's ladder)        VEHICLE ENTERS (Day 9 sequence, compressed)

  FREE ──occupy(v)──▶ OCCUPIED             🚗 → EntryGate: requestTicket(vehicle)
   ▲                     │                 EntryGate → Lot: park(vehicle)
   └──────free()─────────┘                 Lot → Strategy: findSpot(type)   ← the slot
  (occupy on OCCUPIED → throws —           Lot → Spot: occupy(vehicle)      ← guarded!
   guarded transition, Day 19;             Lot → new Ticket(spot, vehicle, now)
   RESERVED/OUT_OF_SERVICE = future        Lot ┄▶ observers: spotOccupied   ← boards
   enum constants, zero redesign)          Lot ┄▶ EntryGate: return ticket`} />
        <Warn><strong>The concurrency flag you must plant:</strong> two gates can race for the last spot —
          <C> findSpot</C> then <C>occupy</C> is check-then-act (Day 21!). Say in the interview: "I'd make the
          claim atomic — a synchronized allocation section or <C>tryOccupy()</C> compare-and-set on the spot —
          and we can deepen this if concurrency is in scope." Planting the flag costs one sentence; missing it
          costs the round.</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🅿️ Play: The lot, running</h2>
        <p>The design above, simulated: nearest-first allocation, guarded spots, boards updating by event:</p>
        <AllocationSim />
        <Good><strong>What you should notice:</strong> ① Trucks reject earliest — compatibility rules
          (enum-driven data) bite before capacity does. ② Every log line walks the sequence diagram: strategy →
          occupy → ticket → notify. ③ The per-floor counters are the observers: they never polled, they were
          told.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>The patterns map (your Days 1–40, deployed)</h2>
        <table className="matrix">
          <thead>
            <tr><th>concern</th><th>tool</th><th>from</th></tr>
          </thead>
          <tbody>
            <tr><td>lot ◆ floors ◆ spots + free-count rollup</td><td>Composition / Composite shape</td><td>Days 6 · 28</td></tr>
            <tr><td>vehicle & spot kinds</td><td>enums + compatibility data</td><td>Days 10 · 19</td></tr>
            <tr><td>spot occupancy</td><td>guarded enum state machine</td><td>Days 19 · 34</td></tr>
            <tr><td>spot allocation policy</td><td>injected Strategy</td><td>Days 15 · 31</td></tr>
            <tr><td>display boards / app updates</td><td>Observer events</td><td>Day 32</td></tr>
            <tr><td>one lot instance</td><td>composition-root wiring (not getInstance)</td><td>Days 15 · 21</td></tr>
            <tr><td>pricing (hourly, type-based, day-pass…)</td><td>Strategy — <b>Part 2's main act</b></td><td>Day 31</td></tr>
            <tr><td>two gates, last spot</td><td>atomic claim — flagged today, built in Month 4</td><td>Day 21 → W13</td></tr>
          </tbody>
        </table>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet — the reusable script (works for EVERY problem this month)</h2>
        <ul>
          <li><strong>① Clarify (5 min):</strong> 4–6 design-shaping questions; speak the scope, INCLUDING exclusions.</li>
          <li><strong>② Entities (10 min):</strong> noun-verb pass → filter (identity/data/behavior) → enums for label variation → relationships with multiplicities.</li>
          <li><strong>③ Decisions out loud:</strong> name the principle/day for each call — and let restraint (no subclasses, enum states) cite days too.</li>
          <li><strong>④ Diagram + one sequence:</strong> the readable sentence first, boxes second; one end-to-end flow (entry) beats five partial ones.</li>
          <li><strong>⑤ Plant flags:</strong> concurrency races, scaling (10k spots → free-lists per type), extension axes (pricing, EV) — one sentence each shows you see beyond the whiteboard.</li>
          <li><strong>Parking specifics to retain:</strong> Lot ◆ Floor ◆ Spot · VehicleType/SpotType enums + fit rules · guarded SpotState · SpotAllocationStrategy · Ticket{'{'}spot, vehicle, entryTime{'}'} · boards as observers.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Add handicapped-reserved spots" — what changes?'>
          <p>A new SpotType constant + an allocation rule: HandicappedPriorityStrategy (eligible vehicles get
            reserved spots first; others NEVER get them — or get them after a threshold, a POLICY question to
            ask back!). Files touched: one enum line, one new strategy. The design absorbing this in two
            sentences is the OCP payoff being tested.</p>
        </Reveal>
        <Reveal summary='Q: "10,000 spots — is your findSpot scan still okay?"'>
          <p>Linear scan dies at scale. Upgrade: per-type FREE LISTS (a queue of free spots per SpotType per
            floor) — allocation becomes O(1) poll, freeing is O(1) offer. The strategy interface HIDES this
            change: callers never know the scan became a queue. Data-structure answer + unchanged interface =
            full marks.</p>
        </Reveal>
        <Reveal summary='Q: "Customer lost the ticket" — design answer?'>
          <p>A policy, not a class: exit gate falls back to plate lookup (Ticket findable by vehicle), charges
            max-of-day or lookup-based fee per business rule, logs the event. The design point: tickets are
            FINDABLE by plate (a map you mention), and lost-ticket is a use case, not an exception to panic
            over.</p>
        </Reveal>
        <Reveal summary='Q: "Add EV charging spots" — walk the change.'>
          <p>SpotType.EV_CHARGER + VehicleType.EV (or an isElectric flag — debate it), EvNearChargerStrategy,
            and pricing gains a per-minute energy component (Part 2's strategy composes: parking fee + energy
            fee). Optionally an Observer consumer: charger status on boards. Every change lands in an
            extension point planted today.</p>
        </Reveal>
        <Reveal summary='Q: "Why not make Spot know its Floor and Floor know its Lot (back-pointers)?"'>
          <p>Day 6's bidirectional tax: add parent pointers only for a real operation (e.g., spot → floor for
            board updates can instead ride the event payload). Default to one-direction ownership; justify any
            back-pointer with a named use case. Saying "I'll add it when an operation demands it" is the
            mature answer.</p>
        </Reveal>
        <Reveal summary='Q: "Multiple lots city-wide, one app" — does your design survive?'>
          <p>Yes BECAUSE the lot is not a singleton: a LotRegistry (or just a List&lt;ParkingLot&gt; service)
            wires many lots; tickets carry a lotId; strategies and observers stay per-lot. The getInstance()
            version would be getting surgery right now — say that out loud, kindly.</p>
        </Reveal>
        <Reveal summary="Q: How do you split 45 minutes if the interviewer says “code it” early?">
          <p>Compress, don't skip: 2 minutes of scope ("bikes/cars/trucks, hourly, single floor for code —
            fair?"), entities as you type (enums first — they're fast and show modeling), the park() happy
            path end-to-end, then state the flags (concurrency, pricing strategy) verbally. A working thin
            slice with named extension points beats half of everything.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s11">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 41 complete?</strong> Homework: the full dry run. Set a 25-minute timer and, ON PAPER, take
        the prompt "Design a parking lot" from blank page to: ① your 5 clarifying questions with assumed
        answers, ② the entity list with multiplicities, ③ the class diagram (Day 8 notation — diamonds and all),
        ④ the entry sequence diagram, ⑤ three planted flags (concurrency, scale, extension). Then compare
        against today's page and write down the TWO biggest gaps — they are your personal interview weak spots,
        now visible.
        <br /><br />
        Next: <strong>Day 42 — Parking Lot, Part 2</strong>: the code — entities in real Java, the pricing
        Strategy family (hourly/day-pass/EV), gates issuing and closing tickets, and the follow-up variations
        interviewers spring at minute 40.
      </div>
    </div>
  )
}
