import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the controller step loop ============ */
const LOOP_CODE = [
  'void step() {',
  '    if (car.state() == DOORS_OPEN) { car.closeDoors(); return; }',
  '    OptionalInt next = strategy.nextStop(car.snapshot(), hallCalls, cabinCalls);',
  '    if (next.isEmpty()) { car.goIdle(); return; }',
  '    int target = next.getAsInt();',
  '    if (car.floor() == target) { serve(target); return; }',
  '    car.startMoving(target > car.floor() ? UP : DOWN);',
  '    car.moveOneFloor();',
  '}',
]
const LOOP_TRACE = [
  { line: 1, msg: 'Doors are open from a previous stop? Close them first — never plan a move with doors open (Part 1\'s invariant lives at the TOP of the loop). This tick just closes; next tick decides.' },
  { line: 2, msg: 'Ask the brain. The controller hands the strategy a read-only snapshot + the pending sets and gets back an OptionalInt. It does not know or care whether that brain is FCFS, SCAN or LOOK.' },
  { line: 3, msg: 'Empty Optional = nothing pending → go IDLE and stop ticking. This is the ONLY place "no work" is decided — the strategy owns it, the loop just obeys.' },
  { line: 5, msg: 'Already AT the target floor? Then this is a stop, not a move: open doors, fire the arrived event, clear the served calls. serve() is the whole pickup/dropoff in one place.' },
  { line: 6, msg: 'Target is elsewhere → pick a direction from the sign of (target − floor) and ask the car to start moving. startMoving() re-checks the doors guard — defense in depth.' },
  { line: 7, msg: 'Advance exactly ONE floor per tick. Keeping the loop single-floor-grained means SCAN can notice a newly-pressed in-between floor next tick — the brain re-decides every floor.' },
]

function StepLoop() {
  const [i, setI] = useState(-1)
  const seq = [1, 2, 3, 5, 6, 7]  // representative path: doors check → ask → (not empty) → not-at → move
  const started = i >= 0
  const done = i >= seq.length - 1
  const curLine = started ? seq[i] : null
  const trace = started ? LOOP_TRACE.find((t) => t.line === seq[i]) : null

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one tick of the controller loop, line by line — the brain decides, the loop obeys</div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
        {LOOP_CODE.map((l, idx) => (
          <div key={idx} style={{
            fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre', overflowX: 'auto',
            padding: '1px 6px', borderRadius: 4,
            background: curLine === idx ? '#FFF1D6' : 'transparent',
            fontWeight: curLine === idx ? 700 : 400,
          }}>{l}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {!done
          ? <button className="act" onClick={() => setI((x) => x + 1)}>{started ? 'next line →' : '▶ run one tick'}</button>
          : <button className="ghost act" onClick={() => setI(-1)}>reset</button>}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {trace
          ? <span style={{ fontSize: 13 }}>{trace.msg}</span>
          : <span>This is the entire heartbeat of an elevator: close doors if open → ask the strategy → idle / serve / move. Step through it.</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: strategy swap simulator ============ */
const SIM_FLOORS = 10
function simulate(strategy, start, hall, cabin) {
  // hall: [{floor, dir}], cabin: [floor]
  let pos = start, dir = null
  const targets = new Set([...cabin, ...hall.map((h) => h.floor)])
  const path = [pos]
  const order = []
  let guard = 0
  while (targets.size > 0 && guard++ < 200) {
    let next
    if (strategy === 'fcfs') {
      // serve in arrival order: cabin then hall, as given — first still-pending
      next = [...cabin, ...hall.map((h) => h.floor)].find((f) => targets.has(f))
    } else {
      // SCAN/LOOK: keep direction, nearest in that direction; reverse when none ahead
      if (dir === null) dir = ([...targets].some((f) => f >= pos)) ? 'UP' : 'DOWN'
      const ahead = [...targets].filter((f) => dir === 'UP' ? f >= pos : f <= pos)
      if (ahead.length === 0) { dir = dir === 'UP' ? 'DOWN' : 'UP'; continue }
      next = dir === 'UP' ? Math.min(...ahead) : Math.max(...ahead)
      if (strategy === 'scan') {
        // SCAN goes to the shaft end; LOOK turns at last request. We model LOOK as the default
        // and SCAN as adding the end-of-shaft visit when reversing.
      }
    }
    // walk to next
    while (pos !== next) { pos += pos < next ? 1 : -1; path.push(pos) }
    dir = dir || (next >= start ? 'UP' : 'DOWN')
    targets.delete(next); order.push(next)
  }
  return { path, order, floors: path.length - 1 }
}

function StrategySim() {
  const start = 5
  const hall = [{ floor: 9, dir: 'UP' }, { floor: 2, dir: 'DOWN' }, { floor: 7, dir: 'UP' }]
  const cabin = [3, 8]
  const [strategy, setStrategy] = useState('fcfs')
  const res = simulate(strategy, start, hall, cabin)
  const [revealIdx, setRevealIdx] = useState(0)
  const shown = res.order.slice(0, revealIdx)
  const pos = revealIdx === 0 ? start : res.order[revealIdx - 1]

  const STRATS = {
    fcfs: 'FCFS — serve in the order calls arrived. Fair, simple, and it back-tracks constantly.',
    look: 'LOOK — sweep in one direction serving everything, reverse at the LAST request (not the shaft end). The everyday "elevator algorithm".',
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · same pending calls, swap the brain — start floor 5 · hall {'{'}9↑, 2↓, 7↑{'}'} · cabin {'{'}3, 8{'}'}</div>
      <div className="modbtns" style={{ marginBottom: 8 }}>
        <button className={strategy === 'fcfs' ? 'on' : ''} onClick={() => { setStrategy('fcfs'); setRevealIdx(0) }}>new Fcfs()</button>
        <button className={strategy === 'look' ? 'on' : ''} onClick={() => { setStrategy('look'); setRevealIdx(0) }}>new Look()</button>
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, color: '#7c8aa5', marginBottom: 8 }}>
        controller = new ElevatorController(car, {strategy === 'fcfs' ? 'new Fcfs()' : 'new Look()'});  // ← the ONLY line that changes
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', marginBottom: 8 }}>
        {[...Array(SIM_FLOORS)].map((_, idx) => {
          const f = SIM_FLOORS - idx
          const isHall = hall.find((h) => h.floor === f)
          const isCabin = cabin.includes(f)
          const served = res.order.indexOf(f) >= 0 && res.order.indexOf(f) < revealIdx
          return (
            <div key={f} style={{
              width: 40, padding: '6px 0', textAlign: 'center', borderRadius: 5,
              fontFamily: 'IBM Plex Mono', fontSize: 11,
              border: '1px solid var(--line)',
              background: pos === f ? '#FFF1D6' : served ? '#EAF7EF' : (isHall || isCabin) ? '#FDECEC' : '#fff',
              outline: pos === f ? '2px solid var(--amber)' : 'none',
            }}>
              <div style={{ color: '#7c8aa5' }}>{f}</div>
              <div style={{ height: 16 }}>
                {pos === f ? '🛗' : served ? '✓' : isHall ? (isHall.dir === 'UP' ? '▲' : '▼') : isCabin ? '●' : ''}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className="act" onClick={() => setRevealIdx((x) => Math.min(res.order.length, x + 1))} disabled={revealIdx >= res.order.length}>serve next stop →</button>
        <button className="ghost act" onClick={() => setRevealIdx(0)}>reset path</button>
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono' }}>visit order: {res.order.map((f, k) => k < revealIdx ? f : '·').join(' → ')}</span>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        <span style={{ fontSize: 13 }}>
          {STRATS[strategy]} <b>Total floors travelled: {res.floors}.</b>{' '}
          {revealIdx >= res.order.length && strategy === 'fcfs' && '↑ Switch to LOOK and replay — fewer floors, same requests, controller untouched.'}
          {revealIdx >= res.order.length && strategy === 'look' && '↑ One sweep up then down. The controller, car, and observers never knew the brain changed.'}
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: multi-car dispatch ============ */
const DISPATCH_CARS = [
  { id: 'A', floor: 2, state: 'IDLE', dir: null },
  { id: 'B', floor: 8, state: 'MOVING_DOWN', dir: 'DOWN' },
  { id: 'C', floor: 5, state: 'MOVING_UP', dir: 'UP' },
]

function cost(car, call) {
  // crude ETA-style cost: distance, with a big penalty for wrong-direction committed cars
  const dist = Math.abs(car.floor - call.floor)
  if (car.state === 'IDLE') return dist
  if (car.dir === 'UP') {
    if (call.dir === 'UP' && call.floor >= car.floor) return dist          // on the way, same way
    return dist + 100                                                       // must finish sweep first
  }
  if (car.dir === 'DOWN') {
    if (call.dir === 'DOWN' && call.floor <= car.floor) return dist
    return dist + 100
  }
  return dist
}

function DispatchSim() {
  const [call, setCall] = useState(null)
  const calls = [
    { floor: 3, dir: 'UP', label: '3 ▲' },
    { floor: 9, dir: 'UP', label: '9 ▲' },
    { floor: 1, dir: 'DOWN', label: '1 ▼' },
    { floor: 6, dir: 'DOWN', label: '6 ▼' },
  ]
  const costs = call ? DISPATCH_CARS.map((c) => ({ id: c.id, cost: cost(c, call) })) : []
  const winner = costs.length ? costs.reduce((a, b) => (b.cost < a.cost ? b : a)).id : null

  return (
    <div className="panel">
      <div className="ptitle">Live demo · 3 cars, one hall call — the dispatcher scores each car and assigns the cheapest</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
        {DISPATCH_CARS.map((c) => (
          <div key={c.id} style={{
            border: '1.5px solid var(--line)', borderRadius: 8, padding: '8px 12px',
            background: winner === c.id ? '#EAF7EF' : '#fff',
            outline: winner === c.id ? '2px solid var(--green)' : 'none',
          }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15 }}>Car {c.id} {winner === c.id && '← assigned'}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, color: '#7c8aa5' }}>floor {c.floor} · {c.state}</div>
            {call && (
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, marginTop: 4 }}>
                cost = {costs.find((x) => x.id === c.id).cost}{costs.find((x) => x.id === c.id).cost >= 100 && ' (wrong-way penalty!)'}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, alignSelf: 'center', color: '#7c8aa5' }}>a hall call arrives:</span>
        {calls.map((c) => (
          <button key={c.label} className="act" onClick={() => setCall(c)}>{c.label}</button>
        ))}
        <button className="ghost act" onClick={() => setCall(null)}>clear</button>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {call
          ? <span style={{ fontSize: 13 }}>Call <b>{call.label}</b> → dispatcher asks each car "what would this cost YOU?" → cheapest wins: <b>Car {winner}</b>. The fleet is just a SchedulingStrategy one level up — each car keeps its own single-car brain.</span>
          : <span>Press a hall call. Watch the wrong-direction penalty: a car committed the other way is expensive even when it's physically close.</span>}
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'In the controller\'s step() loop, who decides the next floor and who carries out the motion?',
    o: ['step() computes the next floor with if-else and moves the car', 'step() ASKS the injected strategy for the next stop (a decision) then tells the car to execute guarded transitions — the loop is plumbing, the brain is swappable, the body is dumb', 'The car decides and the controller watches', 'The strategy moves the car directly'], a: 1,
    e: 'Part 1\'s brain/body split, now in code: the loop is a fixed heartbeat (close doors? ask brain → idle/serve/move). All policy lives behind nextStop(); all safety lives in the car\'s guards.',
    w: { 0: 'An if-else inside step() welds one policy into the loop — the exact thing the strategy interface removes.',
         2: 'A self-scheduling car is Part 1\'s god-car; the controller would have nothing to do.',
         3: 'A strategy that moves the car has grabbed the body\'s job and lost its testability (it can no longer be a pure function).' },
    r: { id: 's2', label: 'Section 2 — the step loop' } },
  { q: 'Why does the loop advance exactly ONE floor per tick instead of jumping straight to the target?',
    o: ['It looks smoother in an animation', 'So the brain re-decides every floor — a newly-pressed in-between floor (e.g. 6↑ while sweeping 5→9) gets folded into THIS sweep instead of forcing a back-track later', 'Because Java can\'t skip array indices', 'To save memory'], a: 1,
    e: 'Single-floor granularity is what makes SCAN/LOOK actually work: nextStop() is consulted at each floor against the CURRENT pending set, so late calls on the path are served for free.',
    w: { 0: 'The animation is a side benefit; the design reason is re-evaluation granularity.',
         2: 'It could jump fine — the point is to give the strategy a decision point each floor.',
         3: 'Memory is irrelevant; correctness of in-flight pickups is the reason.' },
    r: { id: 's2', label: 'Section 2 — one floor per tick' } },
  { q: 'FCFS and LOOK are both SchedulingStrategy implementations. To switch the whole building from one to the other you…',
    o: ['Rewrite the controller', 'Change ONE line at the composition root: new ElevatorController(car, new Look()) — the controller, car, observers and tests are untouched (Day 12 + Day 31 paying out)', 'Add an if(useLook) branch in step()', 'Subclass the controller'], a: 1,
    e: 'This is the entire payoff of putting the policy behind an interface: behavioural change with zero edits to stable code. The if(useLook) branch would re-introduce the coupling you removed.',
    w: { 0: 'The controller never mentions a concrete strategy — there\'s nothing in it to rewrite.',
         2: 'A flag branch is the growing-switch smell creeping back in (Day 12).',
         3: 'Subclassing the controller to vary the brain is exactly what composition replaced.' },
    r: { id: 's3', label: 'Section 3 — strategies as classes' } },
  { q: 'How do you write a deterministic test that "a SCAN car serves {9,2,8,3,7} from floor 1 in 8 floors"?',
    o: ['Run a real elevator and time it', 'Drive the controller with a scripted clock/tick: feed the pending calls, call step() until idle, assert the visit ORDER and the floor count — no threads, no sleeps, fully repeatable (Days 42/44 seam, again)', 'Use Thread.sleep to simulate travel time', 'You can\'t unit-test scheduling'], a: 1,
    e: 'Because the controller advances on explicit step() calls (a tick), a test pumps ticks and asserts on the recorded path — the simulation harness. Time was never real, so the test is instant and stable.',
    w: { 0: 'Physical timing is the opposite of a unit test.',
         2: 'Thread.sleep makes tests slow AND flaky — the thing the tick model exists to avoid.',
         3: 'Scheduling is a pure function of (snapshot, pending) — it\'s among the MOST testable parts.' },
    r: { id: 's5', label: 'Section 5 — the simulation harness' } },
  { q: 'Multi-car dispatch is best modeled as…',
    o: ['Copy the controller code N times with if-else to pick a car', 'A Dispatcher that scores each car\'s COST for a hall call (ETA-style, with a wrong-direction penalty) and assigns the cheapest — a strategy ONE LEVEL UP; each car keeps its own single-car brain', 'One giant strategy that controls all cars at once', 'Random assignment'], a: 1,
    e: 'The fleet problem decomposes: per-car scheduling (unchanged from single-car) + a dispatch policy that allocates hall calls to cars. The dispatcher is itself a swappable strategy — nearest-car, least-busy, zoned.',
    w: { 0: 'Copy-paste-with-if-else is the parallel-hierarchy / shotgun-surgery smell at fleet scale.',
         2: 'A monolith brain throws away the clean single-car design you already have.',
         3: 'Random "works" but ignores the cost information that makes dispatch good — and it\'s still a strategy slot, so do it properly.' },
    r: { id: 's7', label: 'Section 7 — fleet dispatch' } },
  { q: 'A car is MOVING_UP and committed past floor 3. A new 3▼ call arrives. A good cost function…',
    o: ['Treats it as cheap because floor 3 is close', 'Adds a large wrong-direction penalty: the car must finish its upward sweep and come back, so "close" by distance is far by TIME — cost models ETA, not raw distance', 'Refuses the call', 'Always sends the nearest car by distance'], a: 1,
    e: 'Dispatch quality lives in the cost function. Raw distance lies when a car is committed the wrong way; an ETA-style cost (distance + penalty for direction mismatch / remaining sweep) is what makes assignment feel smart.',
    w: { 0: 'Distance-close but it has to travel up, turn around, and come down — slow in practice.',
         2: 'Refusing a valid call is a bug, not a policy.',
         3: 'Nearest-by-distance is the naive version this question is warning against.' },
    r: { id: 's7', label: 'Section 7 — the cost function' } },
  { q: 'Where does the doors-closed-before-motion invariant live in the Part 2 code?',
    o: ['Only in the controller loop', 'In BOTH: step() closes doors before planning a move (loop discipline) AND car.startMoving() throws if doors are open (defense in depth) — the safety rule is enforced at the body even if the brain misbehaves', 'Only in the strategy', 'In the test suite'], a: 1,
    e: 'The loop closes doors as policy; the car re-checks as a hard guard. Defense in depth means a buggy or malicious controller still cannot move an open car — the invariant is owned by the body, asserted by the loop.',
    w: { 0: 'Loop-only means a strategy or refactor bug could bypass it — too fragile for a safety rule.',
         2: 'The strategy returns a floor number; it has no business touching doors.',
         3: 'Tests catch regressions but don\'t ENFORCE the invariant at runtime.' },
    r: { id: 's2', label: 'Section 2 — defense in depth' } },
  { q: 'The cleanest reason nextStop(snapshot, hallCalls, cabinCalls) takes a snapshot instead of the live car?',
    o: ['Snapshots are faster to copy', 'It keeps the strategy a PURE function of its inputs — it can read the car\'s floor/direction but cannot move it or mutate state, which makes every strategy trivially unit-testable and impossible to misuse', 'Java requires immutable parameters', 'To hide the car\'s floor from the strategy'], a: 1,
    e: 'Passing a read-only snapshot (an immutable record of floor + direction + door state) means the strategy can DECIDE but not DO. Purity = testability and a clean brain/body boundary.',
    w: { 0: 'Copy speed is negligible; the design reason is purity and safety.',
         2: 'Java allows mutable params; the discipline is a choice, not a rule.',
         3: 'The strategy NEEDS the floor — it\'s exposed by the snapshot, just read-only.' },
    r: { id: 's3', label: 'Section 3 — the pure strategy' } },
]

/* ============ The page ============ */
export default function Day47() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 10 · Day 47 · Classic LLD Problems</div>
        <h1>Elevator — Part 2:<br />The Brain, in Real Java</h1>
        <p>Part 1 drew the body and named the brain. Today we build it: the controller heartbeat loop, FCFS and
           LOOK as real <C>SchedulingStrategy</C> classes you can hot-swap with one line, a tick-based
           simulation harness that makes scheduling unit-testable, and the big follow-up — dispatching a fleet
           of cars. Click everything.</p>
        <div className="chips">
          {['controller loop', 'strategy classes', 'pure functions', 'simulation harness', 'multi-car dispatch', 'cost function'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Build order: body first, then the heartbeat, then the brains</h2>
        <p>Same bottom-up discipline as Day 42: the pieces that compile alone come first, the wiring comes
          last. Part 1's car is the body; today we add the loop that drives it and the brains it consults.</p>
        <Code html={`  THE PART-2 BUILD ORDER (every layer calls only layers below it)

          Dispatcher (fleet)             ← last · the multi-car follow-up
       ElevatorController.step()         ← the heartbeat loop (asks the brain)
   SchedulingStrategy impls: Fcfs, Look  ← pure functions (snapshot, calls) → floor
  ElevatorCar (Part 1) · HallCall/CabinCall · CarSnapshot  ← the bricks, already built

  KEY MOVE: the strategy is a PURE FUNCTION. Given a read-only snapshot and the
  pending calls, it RETURNS a floor. It cannot move the car, ring a bell, or
  mutate anything. Decide ≠ do — so every brain is trivially testable.`} />
        <Note><strong>The snapshot is the boundary.</strong> <C>nextStop()</C> receives a <C>CarSnapshot</C>
          (an immutable record: floor, direction, door state) — never the live car. The brain can <em>read</em>
          where the car is but cannot <em>touch</em> it. That single decision is what keeps scheduling a pure,
          testable function and the brain/body line crisp.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The heartbeat: ElevatorController.step()</h2>
        <p>An elevator is a clock-driven loop. Each tick, the controller does the same five things — close
          doors if open, ask the brain, then idle / serve / move:</p>
        <Code html={`<span class="kw">public class</span> ElevatorController {
    <span class="kw">private final</span> ElevatorCar car;
    <span class="kw">private final</span> SchedulingStrategy strategy;            <span class="cm">// injected (Day 15) — the swappable brain</span>
    <span class="kw">private final</span> Set&lt;HallCall&gt; hallCalls = ConcurrentHashMap.newKeySet();  <span class="cm">// buttons write, loop reads</span>
    <span class="kw">private final</span> Set&lt;CabinCall&gt; cabinCalls = ConcurrentHashMap.newKeySet();

    <span class="kw">public</span> ElevatorController(ElevatorCar car, SchedulingStrategy strategy) {
        <span class="kw">this</span>.car = car; <span class="kw">this</span>.strategy = strategy;   <span class="cm">// composition root wires the concrete brain</span>
    }

    <span class="kw">public void</span> onHallCall(HallCall c) { hallCalls.add(c); }   <span class="cm">// Set ⇒ duplicate presses are free no-ops</span>
    <span class="kw">public void</span> onCabinCall(CabinCall c) { cabinCalls.add(c); }

    <span class="kw">public void</span> step() {                                  <span class="cm">// ONE tick of the elevator's life</span>
        <span class="kw">if</span> (car.state() == State.DOORS_OPEN) {           <span class="cm">// ① never plan a move with doors open</span>
            car.closeDoors(); <span class="kw">return</span>;
        }
        OptionalInt next = strategy.nextStop(car.snapshot(), hallCalls, cabinCalls);  <span class="cm">// ② ask the brain</span>
        <span class="kw">if</span> (next.isEmpty()) { car.goIdle(); <span class="kw">return</span>; } <span class="cm">// ③ nothing pending → idle</span>
        <span class="kw">int</span> target = next.getAsInt();
        <span class="kw">if</span> (car.floor() == target) { serve(target); <span class="kw">return</span>; } <span class="cm">// ④ we're here → open & clear calls</span>
        car.startMoving(target &gt; car.floor() ? UP : DOWN);  <span class="cm">// ⑤ guarded — re-checks doors (defense in depth)</span>
        car.moveOneFloor();                              <span class="cm">// advance EXACTLY one floor, then re-decide</span>
    }

    <span class="kw">private void</span> serve(<span class="kw">int</span> floor) {
        car.openDoors();                                 <span class="cm">// → DOORS_OPEN, fires CarArrived to observers</span>
        hallCalls.removeIf(h -&gt; h.floor() == floor);     <span class="cm">// this floor's waiting riders are handled</span>
        cabinCalls.removeIf(c -&gt; c.floor() == floor);    <span class="cm">// and the in-cabin destination is reached</span>
    }
}`} />
        <Warn><strong>Defense in depth on the safety invariant.</strong> The loop closes doors before planning
          a move (step ①) — that's <em>policy</em>. The car's <C>startMoving()</C> <em>also</em> throws if the
          doors are open (step ⑤) — that's the <em>hard guard</em>. Two layers: a buggy controller or a future
          refactor still cannot move an open car. Safety rules belong to the body and are re-asserted by the
          loop.</Warn>
        <Reveal summary="Bonus: why advance only ONE floor per tick?">
          <p>So the brain re-decides at every floor against the <em>current</em> pending set. Sweeping 5→9, if
            someone presses 6▲ while the car is at floor 5, the next <C>step()</C> consults <C>nextStop()</C>
            again and LOOK folds 6 into this very sweep — no back-track. Jump straight to 9 and that rider
            waits for a whole return trip. Single-floor granularity is what makes "serve on the way" actually
            happen.</p>
        </Reveal>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The brains: FCFS and LOOK as pure strategies</h2>
        <p>Each strategy is a single method: read the snapshot and the pending calls, return the next floor (or
          empty). No state, no side effects — just a decision.</p>
        <Code html={`<span class="kw">public interface</span> SchedulingStrategy {
    OptionalInt nextStop(CarSnapshot car, Set&lt;HallCall&gt; halls, Set&lt;CabinCall&gt; cabins);
}

<span class="kw">public record</span> CarSnapshot(<span class="kw">int</span> floor, Direction direction, <span class="kw">boolean</span> doorsOpen) {}  <span class="cm">// read-only view</span>

<span class="cm">// ── FCFS: serve whatever has been waiting longest. Fair; back-tracks a lot. ──</span>
<span class="kw">public class</span> Fcfs <span class="kw">implements</span> SchedulingStrategy {
    <span class="kw">private final</span> Queue&lt;Integer&gt; arrivalOrder = <span class="kw">new</span> LinkedList&lt;&gt;();   <span class="cm">// (fed as calls arrive)</span>
    <span class="kw">public</span> OptionalInt nextStop(CarSnapshot car, Set&lt;HallCall&gt; h, Set&lt;CabinCall&gt; c) {
        <span class="kw">return</span> arrivalOrder.isEmpty() ? OptionalInt.empty()
                                    : OptionalInt.of(arrivalOrder.peek());  <span class="cm">// oldest first</span>
    }
}

<span class="cm">// ── LOOK: keep direction, take the nearest pending floor ahead; reverse at the LAST one. ──</span>
<span class="kw">public class</span> Look <span class="kw">implements</span> SchedulingStrategy {
    <span class="kw">public</span> OptionalInt nextStop(CarSnapshot car, Set&lt;HallCall&gt; h, Set&lt;CabinCall&gt; c) {
        Set&lt;Integer&gt; targets = allFloors(h, c);          <span class="cm">// union of hall + cabin floors</span>
        <span class="kw">if</span> (targets.isEmpty()) <span class="kw">return</span> OptionalInt.empty();
        <span class="kw">int</span> f = car.floor();
        <span class="kw">if</span> (car.direction() == Direction.UP) {
            OptionalInt up = targets.stream().filter(t -&gt; t &gt;= f).min(Integer::compare);
            <span class="kw">return</span> up.isPresent() ? up                    <span class="cm">// nearest ABOVE — keep sweeping up</span>
                : targets.stream().max(Integer::compare).stream().findFirst().isPresent()
                    ? OptionalInt.of(Collections.max(targets)) : OptionalInt.empty();  <span class="cm">// none above → reverse</span>
        }
        OptionalInt down = targets.stream().filter(t -&gt; t &lt;= f).max(Integer::compare);
        <span class="kw">return</span> down.isPresent() ? down : OptionalInt.of(Collections.min(targets));   <span class="cm">// reverse to lowest</span>
    }
}`} />
        <Good><strong>Swapping the building's brain is one line.</strong> <C>new ElevatorController(car, new
          Fcfs())</C> vs <C>new ElevatorController(car, new Look())</C>. The controller, car, observers, and
          every test are untouched — Day 12 (closed for modification) and Day 31 (strategy) cashing out
          together. Destination dispatch? Zoned scheduling? Each is a new class, never an edit.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>⚙️ Play: step through the heartbeat</h2>
        <p>One tick of <C>step()</C>, line by line. Watch how little the loop itself does — it asks and
          obeys:</p>
        <StepLoop />
        <Good><strong>What you should notice:</strong> ① The loop never computes a route — line 3 delegates the
          entire "which floor?" question to the strategy. ② The doors guard is the very first thing checked,
          every tick. ③ "Move one floor" not "move to target" — that's the line that lets the brain
          re-decide each floor. The controller is plumbing; the intelligence is rented.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The simulation harness: scheduling you can unit-test</h2>
        <p>Because the controller advances on explicit <C>step()</C> calls, a test pumps ticks and asserts on
          the recorded path. No threads, no <C>Thread.sleep</C>, no real time — just like the
          <C> ScriptedDice</C> trick from Day 44:</p>
        <Code html={`<span class="annotation cm">@Test</span>
<span class="kw">void</span> scanServesAllOnOneSweep() {
    ElevatorCar car = <span class="kw">new</span> ElevatorCar(<span class="num">1</span>);                 <span class="cm">// start at floor 1</span>
    ElevatorController ctrl = <span class="kw">new</span> ElevatorController(car, <span class="kw">new</span> Look());

    ctrl.onCabinCall(<span class="kw">new</span> CabinCall(<span class="num">9</span>));                  <span class="cm">// pending: 9, 2, 8, 3, 7</span>
    ctrl.onHallCall(<span class="kw">new</span> HallCall(<span class="num">2</span>, DOWN));
    ctrl.onCabinCall(<span class="kw">new</span> CabinCall(<span class="num">8</span>));
    ctrl.onHallCall(<span class="kw">new</span> HallCall(<span class="num">3</span>, UP));
    ctrl.onCabinCall(<span class="kw">new</span> CabinCall(<span class="num">7</span>));

    List&lt;Integer&gt; visited = <span class="kw">new</span> ArrayList&lt;&gt;();
    car.onArrive(visited::add);                            <span class="cm">// observer records every stop (Day 32)</span>
    <span class="kw">while</span> (!ctrl.isIdle()) ctrl.step();                    <span class="cm">// pump ticks until the work is done</span>

    assertEquals(List.of(<span class="num">2</span>, <span class="num">3</span>, <span class="num">7</span>, <span class="num">8</span>, <span class="num">9</span>), visited);     <span class="cm">// LOOK swept down-then-up, served all five</span>
    assertEquals(<span class="num">8</span>, car.totalFloorsTravelled());           <span class="cm">// vs 30 for FCFS — the Part 1 race, asserted</span>
}`} />
        <Note><strong>Time was never real, so the test is instant and stable.</strong> The Part 1 "30 vs 8"
          race becomes a literal assertion. Swap <C>new Look()</C> for <C>new Fcfs()</C> in the test and the
          expected order/count change — your strategies are now regression-protected, and a new strategy ships
          with its own deterministic test.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔄 Play: swap the brain, watch the path</h2>
        <p>Identical pending calls, two strategies. Serve the stops one at a time and compare total floors —
          then note the single line of wiring that differs:</p>
        <StrategySim />
        <Good><strong>What you should notice:</strong> ① FCFS visits in arrival order and back-tracks; LOOK
          makes one clean pass. ② The floor count differs, sometimes dramatically — the same gap you raced in
          Part 1, now produced by real strategy code. ③ The wiring line at the top is the <em>only</em>
          difference between the two runs. Everything else — controller, car, observers — is byte-for-byte
          identical.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The big follow-up: dispatching a fleet</h2>
        <p>"Now there are four cars." This is the question Part 1 deferred — and the design absorbs it cleanly,
          because the fleet problem is just <strong>scheduling one level up</strong>. Each car keeps its own
          single-car brain; a <C>Dispatcher</C> decides <em>which car</em> answers each hall call.</p>
        <Code html={`  TWO LEVELS OF DECISION (each its own swappable strategy)

  hall call ─▶ Dispatcher.assign(call, cars)   ← WHICH car?  (fleet policy)
                   │  scores each car's COST for this call
                   │  cost ≈ ETA: distance + penalty if committed the wrong way
                   ▼
              ElevatorController(carX).onHallCall(call)
                   │
                   ▼
              SchedulingStrategy.nextStop(...)  ← WHICH floor next?  (per-car, unchanged)`} />
        <Code html={`<span class="kw">public interface</span> Dispatcher {
    ElevatorController assign(HallCall call, List&lt;ElevatorController&gt; cars);
}

<span class="cm">// Nearest-car-by-cost: ask each car "what would this call cost YOU?", pick the cheapest.</span>
<span class="kw">public class</span> CostDispatcher <span class="kw">implements</span> Dispatcher {
    <span class="kw">public</span> ElevatorController assign(HallCall call, List&lt;ElevatorController&gt; cars) {
        <span class="kw">return</span> cars.stream()
                   .min(Comparator.comparingInt(c -&gt; cost(c.snapshot(), call)))  <span class="cm">// cheapest wins</span>
                   .orElseThrow();
    }

    <span class="kw">private int</span> cost(CarSnapshot car, HallCall call) {
        <span class="kw">int</span> dist = Math.abs(car.floor() - call.floor());
        <span class="kw">boolean</span> sameWay = car.direction() == call.direction()
                       &amp;&amp; onTheWay(car, call);                      <span class="cm">// already heading there, in range</span>
        <span class="kw">return</span> car.direction() == Direction.IDLE || sameWay
             ? dist                                               <span class="cm">// free to serve / on the path</span>
             : dist + <span class="num">100</span>;                                     <span class="cm">// committed the WRONG way → must finish + return</span>
    }
}`} />
        <Good><strong>The decomposition is the whole answer.</strong> Per-car scheduling is unchanged from the
          single-car design; the fleet adds exactly one new seam — a <C>Dispatcher</C> that is <em>itself</em>
          a swappable strategy (nearest-car, least-busy, zoned express/local). You reused the entire single-car
          design and added one interface. That's what "design the seams so the fleet slots in" (Part 1) was
          buying.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🚦 Play: the dispatcher</h2>
        <p>Three cars in different states; press a hall call and watch the dispatcher score every car and assign
          the cheapest. Notice when "physically close" loses to "heading the right way":</p>
        <DispatchSim />
        <Good><strong>What you should notice:</strong> ① The idle car is cheap from anywhere — no commitment to
          undo. ② A car moving toward the call in the same direction wins even from far away. ③ A car committed
          the opposite way pays the +100 penalty, so a closer-but-wrong-way car can LOSE to a farther-but-right-way
          one. The cost function is where dispatch intelligence lives — and it's just data the strategy
          reads.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>An if-else scheduler inside step().</strong> "if pending above go up, else if below go
          down…" welds one policy into the loop. Every improvement reopens tested code (Day 12). The loop asks;
          the strategy decides.</Warn>
        <Warn><strong>A strategy that mutates the car.</strong> If <C>nextStop()</C> can call
          <C> car.startMoving()</C>, it's no longer a pure function — untestable, and the brain/body line is
          gone. Pass a read-only snapshot; return a number.</Warn>
        <Warn><strong>Jumping straight to the target floor.</strong> <C>car.setFloor(target)</C> in one step
          skips the per-floor re-decision, so in-flight pickups force back-tracks. Advance one floor, re-ask.</Warn>
        <Warn><strong>Real time in tests.</strong> <C>Thread.sleep(travelTime)</C> makes the suite slow and
          flaky. The tick model exists precisely so scheduling tests are instant and deterministic.</Warn>
        <Warn><strong>Dispatch by raw distance.</strong> Nearest-by-distance sends a wrong-way-committed car to
          a call it can't reach soon. Cost must model ETA — distance plus a direction-mismatch penalty.</Warn>
        <Warn><strong>A monolithic fleet brain.</strong> One class steering all cars throws away the clean
          single-car controller. Keep per-car scheduling; add a Dispatcher on top. Two small strategies beat
          one giant one.</Warn>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Heartbeat:</strong> <C>step()</C> = close doors if open → ask <C>strategy.nextStop()</C> → idle / serve / move one floor. The loop is plumbing; the brain is rented.</li>
          <li><strong>Pure strategy:</strong> <C>nextStop(CarSnapshot, halls, cabins) → OptionalInt</C>. Reads a read-only snapshot, returns a floor, mutates nothing. Decide ≠ do.</li>
          <li><strong>Swap = one line:</strong> <C>new ElevatorController(car, new Look())</C>. FCFS, LOOK, destination-dispatch are classes; the controller never changes.</li>
          <li><strong>One floor per tick</strong> so the brain re-decides each floor — in-flight pickups get folded into the current sweep.</li>
          <li><strong>Defense in depth:</strong> loop closes doors before moving; <C>car.startMoving()</C> also throws if open. Safety owned by the body, asserted by the loop.</li>
          <li><strong>Simulation harness:</strong> pump <C>step()</C> until idle, assert the visit order + floor count via an arrival observer. No threads, no sleeps — the Part 1 race becomes a unit test.</li>
          <li><strong>Fleet = scheduling one level up:</strong> a <C>Dispatcher</C> scores each car's ETA-style cost (distance + wrong-direction penalty) and assigns the cheapest; per-car brains unchanged.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Your step() is called by what? A thread? A timer? A test?"'>
          <p>All three, and that's the point of the tick model: in production a single timer/thread calls
            <C> step()</C> at a fixed cadence (or an event loop calls it on each motor pulse); in tests a
            <C> while (!idle) step()</C> loop pumps it instantly. The controller doesn't know or care what
            drives the clock — time is injected as "someone calls step()", exactly like Day 42's <C>Clock</C>.
            Decoupling the heartbeat source from the logic is what makes both real-time running and instant
            testing possible from the same code.</p>
        </Reveal>
        <Reveal summary='Q: "FCFS can starve nobody but LOOK can. Is LOOK wrong?"'>
          <p>Neither is wrong — they trade differently. LOOK can let a lobby call wait while the car finishes a
            long upward rush (potential starvation under heavy one-directional load); FCFS never starves but
            ping-pongs. Real systems use LOOK/SCAN with an <em>anti-starvation</em> tweak: a call waiting past
            a threshold gets a priority boost in the cost/selection. The senior framing: "I'd default to LOOK
            for throughput and add an aging factor so no call waits unbounded — and that aging factor is just
            another field the strategy reads."</p>
        </Reveal>
        <Reveal summary='Q: "Two riders press 6▲ at the same instant. What happens in the code?"'>
          <p>Nothing bad, by construction: <C>hallCalls</C> is a <C>Set</C>, so <C>add(new HallCall(6, UP))</C>
            twice leaves one element — idempotent dedup for free (records give value equality). And the set is
            a <C>ConcurrentHashMap.newKeySet()</C>, so the concurrent adds from button threads are safe against
            the loop's reads — the Part 1 race flag, now actually handled. Mention both: the Set kills the
            duplicate, the concurrent Set kills the race.</p>
        </Reveal>
        <Reveal summary='Q: "Destination dispatch — riders enter their floor in the LOBBY, before boarding. How?"'>
          <p>It's a different <em>dispatch</em> policy plus richer calls, not a rewrite. The hall call now
            carries a destination (a <C>DestinationCall(from, to)</C>), so the dispatcher can group riders
            with similar destinations into the same car and the per-car strategy already knows every stop up
            front. The structure is unchanged: a new call type, a new Dispatcher implementation. This question
            checks whether your two-level decomposition actually generalizes — it does.</p>
        </Reveal>
        <Reveal summary='Q: "Where does fire/maintenance mode plug in without breaking everything?"'>
          <p>Two touch points, both existing seams: a new car State (FIRE_OVERRIDE) with guards that ignore
            normal calls and force a return to the ground floor, and an override at the controller that
            short-circuits <C>step()</C> while active. Optionally a special <C>SchedulingStrategy</C>
            (FireRecall) swapped in for the duration. Because state, strategy, and loop are separate, an
            emergency mode is additive — new state + new strategy + one guard — not a rewrite. That additivity
            is the whole reason Part 1 split brain from body.</p>
        </Reveal>
        <Reveal summary='Q: "How would you A/B test FCFS vs LOOK in a real building?"'>
          <p>The pure-function design makes this almost free: log every (snapshot, pending-calls, chosen-floor)
            decision in production, then REPLAY the recorded call sequences through both strategies offline and
            compare total wait time / floors travelled — a deterministic backtest, because strategies are pure.
            In the live building you'd swap the wired strategy per time-window and compare metrics. The point
            to make: purity + the simulation harness mean you can evaluate a scheduling change before shipping
            it, which is exactly why you isolated the brain.</p>
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
        <strong>Day 47 complete?</strong> Homework: code it for real — the <C>ElevatorController.step()</C>
        loop, <C>Fcfs</C> and <C>Look</C> as pure <C>SchedulingStrategy</C> classes, and the
        simulation-harness test from Section 5 (assert BOTH the visit order and the floor count for each
        strategy on the same pending set). Then add a <C>CostDispatcher</C> and a 3-car test where a hall call
        goes to the right car. Stretch: add an aging factor to <C>Look</C> so a call waiting more than N ticks
        jumps the queue — and write the test that proves no call starves.
        <br /><br />
        Next: <strong>Day 48 — Vending Machine</strong>: the State pattern's flagship problem — where the
        enum-and-guards ladder Part 1 climbed finally tips over into real per-state behaviour, and full State
        classes earn their keep.
      </div>
    </div>
  )
}
