import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the two panels ============ */
function TwoPanels() {
  const [rich, setRich] = useState(true)
  const [log, setLog] = useState(null)

  function hall(dir) {
    if (rich) setLog('new HallCall(floor=5, Direction.' + dir + ')  →  "someone AT floor 5 wants to go ' + dir +
      '. Any car sweeping ' + dir.toLowerCase() + ' past 5 may take it — and a car sweeping the other way should NOT stop."')
    else setLog('new Request(5)  →  direction LOST. A car sweeping DOWN dutifully stops at 5, doors open… and the UP-bound rider either boards a ride to the basement or watches the doors close. The model just made the scheduler stupid.')
  }
  function cabin(f) {
    if (rich) setLog('new CabinCall(floor=' + f + ')  →  "a rider INSIDE this car wants ' + f +
      '. This is a guaranteed stop for THIS car — no direction needed, the destination says it all."')
    else setLog('new Request(' + f + ')  →  is someone WAITING at ' + f + ', or RIDING to ' + f +
      '? The scheduler can\'t tell. One means a pickup (direction matters), the other a committed stop. Two meanings, one type — the classic under-model.')
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · press real buttons, inspect the request object each one should create</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        <button className={rich ? 'on' : ''} onClick={() => { setRich(true); setLog(null) }}>rich model (two types)</button>
        <button className={!rich ? 'on' : ''} onClick={() => { setRich(false); setLog(null) }}>naive model (one Request)</button>
      </div>
      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>HALL PANEL · floor 5</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button className="act" style={{ width: 64 }} onClick={() => hall('UP')}>▲ UP</button>
            <button className="act" style={{ width: 64 }} onClick={() => hall('DOWN')}>▼ DOWN</button>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 4 }}>CABIN PANEL · inside the car</div>
          <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(3, 42px)', gap: 4 }}>
            {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((f) => (
              <button key={f} className="ghost act" style={{ padding: '6px 0' }} onClick={() => cabin(f)}>{f}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {log
          ? <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{log}</span>
          : <span>Press the SAME buttons under both models. The buttons don't change — what the code KNOWS does.</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: the state machine explorer ============ */
const CAR_STATES = ['IDLE', 'MOVING_UP', 'MOVING_DOWN', 'DOORS_OPEN']

function transition(state, ev) {
  switch (ev) {
    case 'callAbove':
      if (state === 'IDLE') return { next: 'MOVING_UP', ok: true, msg: '✓ IDLE → MOVING_UP. The controller asked the strategy, the strategy said "5", the car obeys.' }
      return { next: state, ok: true, msg: '✓ call added to the pending set — the car does NOT flinch. State unchanged (' + state + '); the strategy folds the new stop into the plan. Requests are DATA, not steering wheels.' }
    case 'callBelow':
      if (state === 'IDLE') return { next: 'MOVING_DOWN', ok: true, msg: '✓ IDLE → MOVING_DOWN. An idle car takes whatever direction the strategy picks.' }
      return { next: state, ok: true, msg: '✓ queued for later — state unchanged (' + state + '). A car sweeping up finishes its sweep first (that\'s the strategy\'s call, Part 2).' }
    case 'arrive':
      if (state === 'MOVING_UP' || state === 'MOVING_DOWN') return { next: 'DOORS_OPEN', ok: true, msg: '✓ ' + state + ' → DOORS_OPEN. Stop, open, notify observers: floor display updates, chime sounds — the car names no listener.' }
      return { next: state, ok: false, msg: '⛔ guard: a car in ' + state + ' cannot "arrive" anywhere — it isn\'t moving. Impossible events are rejected, not improvised around.' }
    case 'doorTimer':
      if (state === 'DOORS_OPEN') return { next: 'IDLE', ok: true, msg: '✓ DOORS_OPEN → IDLE (demo simplification). The real controller now asks the strategy "next stop?" — and only goes IDLE if the answer is empty.' }
      return { next: state, ok: false, msg: '⛔ guard: no door cycle is running in ' + state + '. The timer event is meaningless here — rejected.' }
    case 'forceMove':
      if (state === 'DOORS_OPEN') return { next: state, ok: false, msg: '💥 IllegalStateException: cannot move with doors open. THE safety invariant — the single rule this whole state machine exists to make unbreakable. No flag, no warning log: a thrown exception.' }
      if (state === 'IDLE') return { next: state, ok: false, msg: '⛔ guard: move where? An idle car has no target until the strategy assigns one. Motion always starts from a decision, never from a poke.' }
      return { next: state, ok: true, msg: '✓ already moving (' + state + ') — the command is redundant, and redundant is harmless. Idempotence is a feature.' }
    default: return { next: state, ok: false, msg: '' }
  }
}

function StateExplorer() {
  const [state, setState] = useState('IDLE')
  const [log, setLog] = useState(null)

  function fire(ev) {
    const r = transition(state, ev)
    setState(r.next); setLog(r.msg)
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · poke the car with events — legal ones transition, illegal ones hit guards</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {CAR_STATES.map((s) => (
          <span key={s} className="chip" style={{
            fontFamily: 'IBM Plex Mono', fontSize: 12,
            background: s === state ? '#FFF1D6' : '#fff',
            outline: s === state ? '2px solid var(--amber)' : 'none',
            fontWeight: s === state ? 700 : 400,
          }}>{s === state ? '▶ ' : ''}{s}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => fire('callAbove')}>📞 call arrives ABOVE</button>
        <button className="act" onClick={() => fire('callBelow')}>📞 call arrives BELOW</button>
        <button className="act" onClick={() => fire('arrive')}>🏁 car reaches its stop</button>
        <button className="act" onClick={() => fire('doorTimer')}>⏲ door timer expires</button>
        <button className="ghost act" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => fire('forceMove')}>⚡ force MOVE</button>
        <button className="ghost act" onClick={() => { setState('IDLE'); setLog(null) }}>reset</button>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {log
          ? <span style={{ fontSize: 13 }}>{log}</span>
          : <span>Try the obvious path: call above → reach stop → door timer. Then get the doors open and press ⚡ force MOVE — meet the invariant.</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 3: FCFS vs SCAN race ============ */
const RACE_START = 1
const RACE_STOPS = [9, 2, 8, 3, 7]          // arrival order — deliberately ping-pong-inducing

function fcfsSim(start, stops) {
  const path = [start]; const servedAt = {}
  let pos = start
  for (const s of stops) {
    while (pos !== s) { pos += pos < s ? 1 : -1; path.push(pos) }
    servedAt[s] = path.length - 1
  }
  return { path, servedAt }
}
function scanSim(start, stops) {
  const sorted = [...stops].sort((a, b) => a - b)
  const path = [start]; const servedAt = {}
  let pos = start
  const top = sorted[sorted.length - 1]
  while (pos < top) {
    pos += 1; path.push(pos)
    if (sorted.includes(pos)) servedAt[pos] = path.length - 1
  }
  return { path, servedAt }
}
const FCFS = fcfsSim(RACE_START, RACE_STOPS)
const SCAN = scanSim(RACE_START, RACE_STOPS)
const RACE_MAX = Math.max(FCFS.path.length, SCAN.path.length) - 1

function Shaft({ title, sim, tick, color }) {
  const i = Math.min(tick, sim.path.length - 1)
  const pos = sim.path[i]
  const traveled = i
  const served = Object.values(sim.servedAt).filter((t) => t <= tick).length
  return (
    <div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, marginBottom: 4 }}>
        <b style={{ color }}>{title}</b> · traveled {traveled} · served {served}/{RACE_STOPS.length}
      </div>
      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((f) => {
        const isStop = RACE_STOPS.includes(f)
        const done = isStop && sim.servedAt[f] !== undefined && sim.servedAt[f] <= tick
        return (
          <div key={f} style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 22,
            fontFamily: 'IBM Plex Mono', fontSize: 11,
          }}>
            <span style={{ width: 16, textAlign: 'right', color: '#7c8aa5' }}>{f}</span>
            <div style={{
              width: 64, height: 18, border: '1px solid var(--line)', borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: pos === f ? '#FFF1D6' : done ? '#EAF7EF' : isStop ? '#FDECEC' : '#fff',
            }}>
              {pos === f ? '🛗' : done ? '✓' : isStop ? '●' : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SchedulerRace() {
  const [tick, setTick] = useState(0)
  const done = tick >= RACE_MAX

  return (
    <div className="panel">
      <div className="ptitle">Live demo · same five requests [9, 2, 8, 3, 7], same start (floor 1) — two brains</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => setTick((t) => Math.min(RACE_MAX, t + 1))} disabled={done}>step (1 floor)</button>
        <button className="ghost act" onClick={() => setTick((t) => Math.min(RACE_MAX, t + 5))} disabled={done}>step ×5</button>
        <button className="ghost act" onClick={() => setTick(0)}>reset</button>
      </div>
      <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', marginBottom: 10 }}>
        <Shaft title="FCFS (arrival order)" sim={FCFS} tick={tick} color="var(--red)" />
        <Shaft title="SCAN (sweep & serve)" sim={SCAN} tick={tick} color="var(--green)" />
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {done
          ? <span>🏁 Final score — FCFS: <b>{FCFS.path.length - 1} floors</b> traveled. SCAN: <b>{SCAN.path.length - 1} floors</b>. Same requests, same car, ~4× difference — THIS gap is "the scheduling problem", and it fits behind one Strategy interface (Part 2 codes it).</span>
          : <span>Step and watch: FCFS obeys arrival order — 1→9, then ALL the way back down to 2, then up to 8… the ping-pong elevator. SCAN sweeps once and serves everything on the way.</span>}
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The ▲ button on floor 5 and the "5" button inside the cabin should create…',
    o: ['The same Request(5) — both mean floor 5', 'Two different types: HallCall(5, Direction.UP) — a pickup whose DIRECTION matters to the scheduler — and CabinCall(5) — a committed stop for this specific car', 'A shared Button object', 'Nothing; the car polls the floors'], a: 1,
    e: 'The two-button reality is THE entity insight of this problem. A hall call says "someone here wants to go up"; a cabin call says "this car owes a stop". Collapse them into Request(floor) and the scheduler loses the information its decisions need.',
    w: { 0: 'Direction died — a down-sweeping car will now stop for up-bound riders.',
         2: 'Buttons are UI; the REQUEST they create is the domain object.',
         3: 'Polling floors is Day 32\'s anti-pattern wearing an elevator suit.' },
    r: { id: 's3', label: 'Section 3 — the two request types' } },
  { q: 'The single most important guard in the car\'s state machine?',
    o: ['No moving on weekends', 'startMoving() throws while DOORS_OPEN — motion with open doors is the safety invariant; it must be structurally impossible, not just "unlikely if everyone is careful"', 'No more than 10 requests', 'Floors must be visited in order'], a: 1,
    e: 'State machines earn their keep by making illegal transitions UNREPRESENTABLE in the flow. Every other rule here is policy; doors-closed-before-motion is physics and law.',
    w: { 0: '🙂 Policy at best — and not the machine\'s concern.',
         2: 'A capacity worry, and it limits the queue, not the state machine.',
         3: 'Visiting order is exactly what the strategy is FREE to choose — that\'s scheduling, not safety.' },
    r: { id: 's5', label: 'Section 5 — the state machine' } },
  { q: 'Enum + guarded transitions vs full State-pattern classes for the car — the honest answer?',
    o: ['Always full State classes — GoF says so', 'Start with the enum + guards (4 states, thin behavior) and SAY the trade out loud: Day 34\'s ladder says climb to State classes when per-state behavior multiplies — the vending machine (Day 48) is the problem that genuinely needs the climb', 'Always booleans isMoving + isOpen', 'Strings: "IDLE", "MOVING"'], a: 1,
    e: 'Interviewers don\'t grade which rung you pick; they grade whether you KNOW you picked a rung. Naming the ladder and the climbing condition is the senior move.',
    w: { 0: 'Pattern-by-reflex is Day 22\'s factory-itis cousin — ceremony before need.',
         2: 'Two booleans = four combinations, including isMoving && isOpen. The invariant just became representable.',
         3: 'Day 19\'s typo machine — "MOVNIG" compiles fine.' },
    r: { id: 's5', label: 'Section 5 — the ladder debate' } },
  { q: 'FCFS served [9,2,8,3,7] from floor 1 in 30 floors; SCAN did it in 8. The design conclusion?',
    o: ['FCFS is a bug', '"Which floor next" is a varying ALGORITHM with huge outcome differences → a SchedulingStrategy interface, injected; FCFS, SCAN, LOOK become swappable classes and the controller never changes (Day 31)', 'Always hardcode SCAN', 'Buy faster elevators'], a: 1,
    e: 'FCFS isn\'t broken — it\'s fair! (First come, first served.) It\'s just usually the wrong trade. Fairness vs throughput vs worst-case wait is a POLICY choice, and policy choices live behind strategy interfaces.',
    w: { 0: 'FCFS is correct and even has virtues (no starvation!) — it\'s a trade-off, not a defect.',
         2: 'Hardcoding SCAN repeats the mistake one level up — the next building wants destination dispatch.',
         3: 'A 4× algorithmic gap outruns any motor upgrade.' },
    r: { id: 's7', label: 'Section 7 — the scheduling problem' } },
  { q: 'WHO decides the next stop, and WHO executes the motion?',
    o: ['The car decides and moves — it\'s the elevator after all', 'The controller asks an injected SchedulingStrategy to DECIDE; the car only EXECUTES guarded transitions — brain and body separated, so brains are swappable and the body is simple enough to trust', 'The building decides', 'Whoever pressed first'], a: 1,
    e: 'Day 11\'s split: deciding and doing are different responsibilities with different reasons to change. A car that schedules itself is a god-object that can\'t be given a smarter brain later.',
    w: { 0: 'The god-car: scheduling policy welded into the machine that should only obey guards.',
         2: '"The building" is the noun trap from Day 10 — it\'s a label, not a decider.',
         3: 'That\'s FCFS smuggled in as physics. It\'s a strategy CHOICE.' },
    r: { id: 's7', label: 'Section 7 — brain vs body' } },
  { q: 'Floor displays and arrival chimes should update via…',
    o: ['Each display polling the car every second', 'Observer (Day 32): the car publishes arrived/departed events; displays, chimes and the building app subscribe — the car never knows its audience', 'The car calling display.update() directly', 'Riders looking at the car'], a: 1,
    e: 'The parking-lot boards, one problem later: state changes publish, consumers subscribe. Adding the lobby dashboard next month = one more subscriber, zero car edits.',
    w: { 0: '86,400 wasted polls per display per day, plus lag.',
         2: 'The car importing display classes couples machinery to UI — DIP inverted the wrong way.',
         3: '🙂 Charming, but the app in your pocket disagrees.' },
    r: { id: 's9', label: 'Section 9 — the full picture' } },
  { q: 'A hall call arrives WHILE the car is moving. The one-sentence flag you must plant?',
    o: ['Impossible — buttons lock during motion', 'The pending-call set is shared mutable state: button presses write it while the controller loop reads it — so adds must be atomic (a concurrent set / synchronized add), and we can deepen this in Month 4', 'Restart the elevator', 'Queue presses until the car stops'], a: 1,
    e: 'Day 41 planted the two-gates flag; this is the elevator\'s version. You aren\'t expected to build the lock-free queue today — you ARE expected to notice the race you created by having two writers.',
    w: { 0: 'Buttons work mid-flight in every elevator you\'ve ever used.',
         2: 'The Windows-95 answer. 🙂',
         3: 'Deliberately ignoring input is a UX bug pretending to be a fix.' },
    r: { id: 's9', label: 'Section 9 — the concurrency flag' } },
  { q: 'A button press becomes an object (HallCall) that\'s queued, inspected, and executed later. That framing is…',
    o: ['Observer', 'Command (Day 33): the request reifies an action, decoupling the press (invoker) from the ride (execution) — which is exactly why the controller can reorder stops at all', 'Decorator', 'Flyweight'], a: 1,
    e: 'You can only schedule what you\'ve turned into data. The whole scheduling problem EXISTS because presses became queueable objects instead of direct motor commands.',
    w: { 0: 'Observer broadcasts what HAPPENED; Command packages what\'s WANTED.',
         2: 'Nothing is being wrapped with extra behavior.',
         3: 'Nothing heavy is being shared.' },
    r: { id: 's10', label: 'Section 10 — the patterns map' } },
]

/* ============ The page ============ */
export default function Day46() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 10 · Day 46 · Classic LLD Problems</div>
        <h1>Elevator — Part 1:<br />The State Machine That Carries People</h1>
        <p>Week 10: machines and frameworks. We open with the most-asked state-machine problem in interviews.
           An elevator looks trivial — up, down, ding — and hides three real design problems: requests that
           come in two flavors, a state machine with a life-or-death invariant, and the famous question
           "which floor next?". Today we design; Part 2 codes the brains. Click everything.</p>
        <div className="chips">
          {['elevator', 'hall vs cabin calls', 'state machine', 'safety guards', 'FCFS vs SCAN', 'strategy slot'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Why the elevator is the state-machine champion</h2>
        <p>Think of an old hotel lift with a uniformed <strong>operator</strong>: the brass cage (the car) only
          ever does what its levers allow — and the operator (the brain) decides where it goes next. Every
          decision in this problem falls on one side of that line: <strong>body</strong> (guarded machinery) or
          <strong> brain</strong> (swappable judgment). The interview is structured around three sub-problems:</p>
        <Code html={`  ONE PROMPT, THREE PROBLEMS (and where each is judged)

  ① REQUESTS    what exactly does a button press create?      ← modeling (today, §3)
  ② THE CAR     which states exist, which moves are illegal?  ← state machine (today, §5)
  ③ THE BRAIN   given pending calls, which floor NEXT?        ← scheduling (framed today,
                                                                 coded in Part 2)
  ──────────────────────────────────────────────────────────
  The 45-min shape is Day 41's: 5' scope → 10' entities → diagram
  + decisions → one flow + the scheduling discussion → follow-ups.
  Most candidates sink ALL their time into ③ and improvise ① and ② —
  graders notice, because ③ is unsolvable until ① is modeled right.`} />
        <Note><strong>Scope for today (the ritual, compressed):</strong> one building, N floors, ONE car —
          multi-car dispatch is Part 2's follow-up. Two button kinds (hall ▲▼, cabin numbers). Capacity/weight:
          flagged, out of scope. Maintenance/fire modes: named as future states, out of scope. Saying these
          aloud took four sentences and bought a clean hour.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The questions that shape this design</h2>
        <p>Five clarifying questions do real work here — each one creates or kills a piece of the model:</p>
        <table className="matrix">
          <thead>
            <tr><th>question</th><th>typical answer</th><th>what it shapes</th></tr>
          </thead>
          <tbody>
            <tr><td>"One car or several?"</td><td>"Design for one, but multi-car is coming"</td><td>controller ≠ car (the dispatcher seam, Part 2)</td></tr>
            <tr><td>"Both hall AND cabin buttons?"</td><td>"Yes, the usual two kinds"</td><td>TWO request types — the §3 insight</td></tr>
            <tr><td>"What should 'good' scheduling mean?"</td><td>"Reasonable waits, no starvation"</td><td>a Strategy slot, not one hardcoded answer</td></tr>
            <tr><td>"Do displays/chimes need to react live?"</td><td>"Yes, per floor"</td><td>Observer events (Day 32, again)</td></tr>
            <tr><td>"Weight limits? Fire mode?"</td><td>"Out of scope today"</td><td>named future states — the enum will grow</td></tr>
          </tbody>
        </table>
        <p>And the noun-verb pass that follows: <em>car, controller, hall call, cabin call, door, floor
          display</em> survive as types; <em>floor</em> itself is just an <C>int</C> here (contrast with
          parking, where Floor owned spots — same word, different weight); <em>"the building"</em> is Day 10's
          god-noun, filtered out.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The entity insight: a button press is not a floor number</h2>
        <p>Stand in a lobby. The ▲ button doesn't say where you're going — it says <em>which way</em>. The
          cabin button doesn't say which way — it says <em>where</em>. Two different sentences, two different
          types:</p>
        <Code html={`<span class="kw">public enum</span> Direction { UP, DOWN }

<span class="kw">public record</span> HallCall(<span class="kw">int</span> floor, Direction direction) {}  <span class="cm">// ▲▼ on the landing: "pick me up, heading THIS way"</span>
<span class="kw">public record</span> CabinCall(<span class="kw">int</span> floor) {}                     <span class="cm">// numbered button inside: "this car now OWES floor 7"</span>

<span class="cm">// Both immutable records (Day 20): a request is a FACT that happened, not a thing to edit.</span>
<span class="cm">// Both are Commands in spirit (Day 33): the press is reified into data the brain can queue & reorder.</span>`} />
        <Warn><strong>The classic under-model — <C>Request(int floor)</C> — silently merges them.</strong> Now
          a car sweeping DOWN can't tell that floor 5's waiting rider wants UP, so it stops, opens, and wastes
          everyone's time (or worse, carries the rider the wrong way). The scheduler can only be as smart as
          the requests are honest.</Warn>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🔘 Play: the two panels</h2>
        <p>Press the same physical buttons under two models and read what the code actually learns each
          time:</p>
        <TwoPanels />
        <Good><strong>What you should notice:</strong> ① The buttons never changed — only the TYPE of the
          object created. ② Every naive-mode message is a real scheduling failure traced back to one missing
          field. ③ HallCall and CabinCall differ in their <em>meaning to the brain</em>: "a pickup with a
          direction" vs "a committed stop" — that difference is the input the whole scheduling problem feeds
          on.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The car: four states, one sacred invariant</h2>
        <p>The body is deliberately simple — it does nothing clever, it only refuses to do anything illegal:</p>
        <Code html={`  THE CAR'S STATE MACHINE (Day 34's diagrams, working for a living)

                  strategy assigns target
        ┌──────────────────────────────────────┐
        ▼                                      │
   MOVING_UP ──reach stop──▶ DOORS_OPEN ──timer──▶ IDLE
   MOVING_DOWN ─reach stop──▶    │   ▲                │
        ▲                        │   │ cabin press    │
        └────────⛔──────────────┘   │ reopens         │
          startMoving() while        └─────────────────┘
          DOORS_OPEN → THROWS        (controller asks strategy
          ── THE safety invariant     "next?" before idling)

  Future constants the enum will grow: MAINTENANCE, FIRE_OVERRIDE —
  new states + new guard rows, zero redesign (Day 19's payoff).`} />
        <Code html={`<span class="kw">public class</span> ElevatorCar {
    <span class="kw">public enum</span> State { IDLE, MOVING_UP, MOVING_DOWN, DOORS_OPEN }

    <span class="kw">private</span> State state = State.IDLE;
    <span class="kw">private int</span> floor = <span class="num">1</span>;                          <span class="cm">// where the car is right now</span>

    <span class="kw">void</span> startMoving(Direction d) {
        <span class="kw">if</span> (state == State.DOORS_OPEN)              <span class="cm">// ⛔ THE invariant: never move with doors open.</span>
            <span class="kw">throw new</span> IllegalStateException(<span class="str">"cannot move with doors open"</span>);
        state = (d == Direction.UP) ? State.MOVING_UP : State.MOVING_DOWN;
    }

    <span class="kw">void</span> arriveAt(<span class="kw">int</span> target) {                     <span class="cm">// called when the motor reaches the chosen stop</span>
        floor = target;
        state = State.DOORS_OPEN;
        publish(<span class="kw">new</span> CarArrived(target));            <span class="cm">// observers: display, chime, app (Day 32)</span>
    }

    <span class="kw">void</span> doorsClosed() { state = State.IDLE; }      <span class="cm">// controller immediately asks the strategy "next?"</span>
}`} />
        <Reveal summary="Bonus: enum + guards or full State classes? (the Day 34 ladder, argued out loud)">
          <p>Four states, and the per-state behavior is thin — mostly guards. The ladder says: <strong>enum
            rung</strong>, climb later. The honest interview sentence: "I'll use an enum with guarded
            transitions; if per-state behavior multiplies — different door logic in fire mode, different
            button semantics in maintenance — I'd climb to State classes, like Day 34's vending machine."
            And conveniently, Day 48 IS the vending machine: you'll feel exactly where the climb becomes
            worth it.</p>
        </Reveal>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🛗 Play: poke the state machine</h2>
        <p>Fire events at the car — including ones that should never work. Predict before each click: transition
          or guard?</p>
        <StateExplorer />
        <Good><strong>What you should notice:</strong> ① A call arriving mid-motion does NOT change the car's
          state — requests are data for the brain, not steering wheels for the body. ② Impossible events
          ("arrive" while idle) are rejected, never improvised around. ③ ⚡ force MOVE with doors open is the
          one that throws — and the message names the invariant. A state machine is exactly this: a short
          list of legal sentences, loudly refusing all others.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The scheduling problem: "which floor next?"</h2>
        <p>Pending calls: floors 9, 2, 8, 3, 7 (in arrival order), car at 1. The <em>obvious</em> brain —
          first come, first served — produces the <strong>ping-pong elevator</strong>:</p>
        <Code html={`  FCFS — obeys arrival order        SCAN — sweep & serve ("the elevator algorithm")

  1 ──────────▶ 9   (8 floors)      1 ─▶ 2✓ 3✓ ──▶ 7✓ 8✓ 9✓   (8 floors TOTAL)
  9 ◀────────── 2   (7 floors)
  2 ──────────▶ 8   (6 floors)      keep your direction, serve every stop on
  8 ◀────────── 3   (5 floors)      the way, reverse only when nothing is
  3 ──────────▶ 7   (4 floors)      left ahead — your hard disk's arm and
                    ──────────      your building's lift both run on it.
            TOTAL:  30 floors                         TOTAL: 8 floors`} />
        <p>Same requests, same car: <strong>30 vs 8</strong>. And neither answer is "correct" — FCFS never
          starves anyone; SCAN can make floor 2 wait while the car finishes a long upward sweep; real
          buildings tune variants (LOOK, destination dispatch). A decision this contested with this much
          variation has exactly one home:</p>
        <Code html={`<span class="kw">public interface</span> SchedulingStrategy {
    OptionalInt nextStop(CarSnapshot car, Set&lt;HallCall&gt; hallCalls, Set&lt;CabinCall&gt; cabinCalls);
    <span class="cm">// empty = nothing pending → car may idle. FCFS, SCAN, LOOK become classes;</span>
    <span class="cm">// the controller that CALLS this line never changes again (Days 12 + 31).</span>
}`} />
        <Note><strong>Brain vs body, the division that grades well:</strong> the <em>controller</em> owns the
          pending sets and asks the strategy to decide; the <em>car</em> only executes guarded transitions.
          Decide and do are different responsibilities (Day 11) — and Part 2 cashes this in: swapping brains,
          then dispatching a whole fleet, without the car learning anything new.</Note>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🏁 Play: FCFS vs SCAN, head to head</h2>
        <p>Both cars get the identical request set. Step them together and watch the gap open:</p>
        <SchedulerRace />
        <Good><strong>What you should notice:</strong> ① FCFS crosses floors 4–6 five separate times serving
          nobody — distance spent obeying arrival order. ② SCAN's path never reverses: every floor crossed at
          most once, three requests served "for free" on the way to 9. ③ By the finish: 30 vs 8. When an
          interviewer asks "can your design try LOOK?", your answer is "new class, one wiring line" — because
          the difference you just watched lives behind an interface.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>The full picture: diagram, one flow, and the flag to plant</h2>
        <Code html={`             «interface» SchedulingStrategy ◁── Fcfs / Scan / Look (Part 2)
                          ▲ injected (Day 15 — never new'ed inside)
   HallCall ──▶ ┌────────────────────┐  commands  ┌──────────────────┐
   CabinCall ─▶ │ ElevatorController │───────────▶│   ElevatorCar    │
   (immutable   │ - pending calls    │            │ floor · State    │
    Commands,   │ + onHallCall(...)  │            │ guarded moves ⛔ │
    Day 33)     │ + onCabinCall(...) │            └────────┬─────────┘
                └────────────────────┘            publishes events
                  1 controller : 1 car today               ▼
                  (fleet dispatch = Part 2)   «interface» CarObserver
                                              ◁┄ FloorDisplay · Chime · App`} />
        <Code html={`  ONE FLOW, END TO END (the sequence to draw if asked — Day 9 style)

  🧍 floor 5 presses ▲ ──▶ Controller: onHallCall(new HallCall(5, UP))
  Controller → pending: add            ← a SET add; the moving car is not interrupted
  Controller → Strategy: nextStop(snapshot, pending)
  Strategy  → Controller: 5
  Controller → Car: startMoving(UP)    ← guarded (doors!)
  Car ····· reaches 5 ─▶ DOORS_OPEN
  Car ┄▶ observers: arrived(5)         ← display flips, chime dings — car names no names
  rider boards, presses 9 ──▶ onCabinCall(9) ──▶ the loop turns again`} />
        <Warn><strong>The concurrency flag (one sentence, planted on purpose):</strong> hall buttons write the
          pending set from one "thread of events" while the controller's loop reads it from another — a shared
          mutable set with two writers' worth of trouble. Say: "I'd make the add atomic — a concurrent set or
          synchronized section — and Month 4 is where we'd pressure-test it." You created the race by
          designing an asynchronous machine; noticing it is part of the design.</Warn>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>The patterns map (Week 10, same habit as Day 41)</h2>
        <table className="matrix">
          <thead>
            <tr><th>concern</th><th>tool</th><th>from</th></tr>
          </thead>
          <tbody>
            <tr><td>button presses as queueable data</td><td>request records ≈ Commands</td><td>Days 20 · 33</td></tr>
            <tr><td>hall vs cabin semantics</td><td>two types, not one Request(floor)</td><td>Day 10</td></tr>
            <tr><td>car safety (doors, motion)</td><td>enum state machine + guards, fail fast</td><td>Days 19 · 34</td></tr>
            <tr><td>"which floor next?"</td><td>injected SchedulingStrategy</td><td>Days 15 · 31</td></tr>
            <tr><td>displays, chimes, apps</td><td>Observer events from the car</td><td>Day 32</td></tr>
            <tr><td>brain ≠ body</td><td>controller decides, car executes</td><td>Day 11</td></tr>
            <tr><td>one controller instance</td><td>composition-root wiring, not getInstance()</td><td>Days 15 · 21</td></tr>
            <tr><td>buttons write, loop reads</td><td>atomic add — flagged today, built Month 4</td><td>Day 21 → W13</td></tr>
          </tbody>
        </table>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>One Request(floor) type.</strong> Direction evaporates; the scheduler stops for riders it
          can't serve. The two-button reality is two types — it's the first thing a grader checks.</Warn>
        <Warn><strong>The god-car.</strong> A car that stores requests, picks the next stop AND moves is
          unswappable and untestable — the brain is welded into the body. Controller decides, strategy chooses,
          car obeys guards.</Warn>
        <Warn><strong>The if-else scheduler.</strong> "if nothing pending go idle, else if above go up, else…"
          welded into the controller — every policy improvement reopens tested code (Day 12). One interface,
          policies as classes.</Warn>
        <Warn><strong>No doors in the state machine.</strong> A model with just IDLE/MOVING can't even
          EXPRESS the one rule that matters most. If your states can't represent the invariant, the invariant
          lives nowhere.</Warn>
        <Warn><strong>Over-modeling the building.</strong> Floor-as-class earned its keep in parking (it owned
          spots); here a floor is an int plus a display observer. Same noun, different problems, different
          weights — copying entity lists between problems is how Day 10's filter gets skipped.</Warn>
        <Warn><strong>Starting with multi-car dispatch.</strong> Fleet logic before one car works is
          gold-plating under a clock. Design the single-car seams so the fleet SLOTS IN (Part 2), and say
          you're doing exactly that.</Warn>
      </section>

      {/* 12 */}
      <section id="s12">
        <div className="sec-label">Section 12</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Three sub-problems:</strong> requests (two types!), the car (guarded state machine), the brain (strategy slot). Budget time across all three.</li>
          <li><strong>Requests:</strong> <C>HallCall(floor, Direction)</C> = pickup with direction; <C>CabinCall(floor)</C> = committed stop. Immutable records; Commands in spirit.</li>
          <li><strong>Car states:</strong> IDLE · MOVING_UP · MOVING_DOWN · DOORS_OPEN — and the invariant: <C>startMoving()</C> THROWS while DOORS_OPEN. Future constants: MAINTENANCE, FIRE_OVERRIDE.</li>
          <li><strong>Ladder call (say it):</strong> enum + guards now; climb to State classes when per-state behavior multiplies (Day 48 will).</li>
          <li><strong>Scheduling:</strong> FCFS = fair but ping-pongs (30 floors); SCAN = sweep & serve (8). Neither is "right" → <C>SchedulingStrategy</C>, injected.</li>
          <li><strong>Brain/body:</strong> controller owns pending calls + asks strategy; car executes guarded transitions; observers hear arrivals.</li>
          <li><strong>Flags to plant:</strong> buttons-vs-loop race (atomic add, Month 4) · multi-car dispatch (Part 2's seam) · capacity/fire as future states.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "A car going DOWN passes floor 5 where someone pressed ▲. Should it stop?"'>
          <p>No — and your model must make that decision <em>possible</em>: the HallCall carries UP, the car's
            snapshot says MOVING_DOWN, the strategy skips it for now and keeps it pending for the upward
            sweep. With a naive Request(5), the car stops uselessly. This single question is why the two-type
            model exists — many interviewers ask it precisely to expose Request(floor).</p>
        </Reveal>
        <Reveal summary='Q: "Where should an idle car wait — where it is, or back at the lobby?"'>
          <p>A policy, not a constant — and ideally <em>another little strategy</em> (IdlePolicy): stay-put is
            simplest; return-to-lobby wins in office buildings with morning rushes; data-driven "park at the
            historically busiest floor for this hour" is the fancy answer. The senior move: ask what kind of
            building it is, then say "that's one interface with three trivial implementations."</p>
        </Reveal>
        <Reveal summary='Q: "Rider inside presses the button for the CURRENT floor. What happens?"'>
          <p>Edge-case taxonomy, out loud: DOORS_OPEN → reopen/extend the timer; IDLE at that floor → just
            open; MOVING → it's a normal CabinCall for a future visit (you've left that floor). The deeper
            point graders look for: each answer is a guard or transition in the EXISTING state machine — no
            new states, no special flags. A good model absorbs its edge cases.</p>
        </Reveal>
        <Reveal summary='Q: "Can a hall call be cancelled? Rider gave up and took the stairs."'>
          <p>Real elevators: no — there's no per-passenger identity, and a second press is typically absorbed
            (the pending set already contains (5, UP); adding it again is a no-op — idempotence from using a
            Set, for free). If the interviewer wants cancellation anyway: it becomes a removal from the
            pending set, racing the car's arrival — name the race, propose "cancel is best-effort", move on.</p>
        </Reveal>
        <Reveal summary='Q: "Weight sensor says overloaded. Walk the change."'>
          <p>A new input, not a new architecture: DOORS_OPEN refuses to transition out while overloaded (a
            guard on doorsClosed), and the display/chime observers announce it. Optionally the strategy learns
            "skip hall pickups while nearly full" (a CarSnapshot field). Notice every piece lands in an
            existing seam: a guard, an event, a snapshot field. That's the answer's real content.</p>
        </Reveal>
        <Reveal summary='Q: "Penthouse needs a keycard — some floors restricted per car. Where does that live?"'>
          <p>Data on the car: a <C>Set&lt;Integer&gt; serviceableFloors</C> (or a per-rider entitlement check
            at request creation — ask which!). The strategy filters candidate stops against it; the guard
            rejects cabin calls outside it. NOT a subclass per building tier — it's Day 41's enum-vs-subclass
            debate again: this varies by data, not behavior.</p>
        </Reveal>
        <Reveal summary='Q: "Why not make ElevatorController a Singleton? There&apos;s one per building."'>
          <p>Day 21's verdict, third appearance, now reflexive: oneness by composition-root wiring, not by
            getInstance(). The concrete payoffs here: Part 2 needs N controllers-worth of logic coordinating
            a fleet (the "one" was temporary, as it usually is), and every scheduling test wants its own
            fresh controller. If you've followed this course's arc: parking lot → game referee → elevator —
            the interviewer is checking the lesson generalized.</p>
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
        <strong>Day 46 complete?</strong> Homework: on paper, 25 minutes — ① the two request records and the
        car's State enum with its guard table (state × event → next state or ⛔), ② the class diagram from
        Section 9 redrawn from memory, ③ hand-simulate SCAN from floor 4 with pending calls {'{'}2↓, 6↑, 9↓,
        cabin 8{'}'} — write the visit order and floors traveled, then do FCFS for the same set and feel the
        gap. Bonus: explain to someone (or a rubber duck) why the ▲ button can't just be "Request(5)".
        <br /><br />
        Next: <strong>Day 47 — Elevator, Part 2</strong>: the code — the controller loop in Java, FCFS and
        SCAN/LOOK as real <C>SchedulingStrategy</C> classes, the deterministic simulation harness, and the
        big follow-up: dispatching a multi-car fleet.
      </div>
    </div>
  )
}
