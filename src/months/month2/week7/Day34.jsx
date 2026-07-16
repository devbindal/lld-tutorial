import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The phone button ============ */
const PHONE = {
  OFF: {
    icon: '⬛', power: ['booting… 🔆', 'LOCKED'], face: ['(dead glass stares back)', 'OFF'], camera: ['(nothing — it is OFF)', 'OFF'],
  },
  LOCKED: {
    icon: '🔒', power: ['screen off', 'OFF'], face: ['face recognized ✓ welcome!', 'HOME'], camera: ['camera opens — but NO gallery access (privacy!)', 'LOCKED'],
  },
  HOME: {
    icon: '🏠', power: ['screen locks', 'LOCKED'], face: ['already unlocked 🙂', 'HOME'], camera: ['camera + full gallery access', 'HOME'],
  },
}

function PhoneDemo() {
  const [st, setSt] = useState('OFF')
  const [log, setLog] = useState([])

  function press(btn, label) {
    const [msg, next] = PHONE[st][btn]
    setLog((l) => [...l.slice(-2), `[${st}] ${label} → ${msg}`])
    setSt(next)
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · three identical button presses, three different phones (sort of)</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        {Object.keys(PHONE).map((k) => (
          <span key={k} className="chip" style={st === k ? { background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)' } : {}}>
            {PHONE[k].icon} {k}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => press('power', 'power button')}>⏻ power</button>
        <button className="act" onClick={() => press('face', 'face unlock')}>🙂 face unlock</button>
        <button className="act" onClick={() => press('camera', 'camera button')}>📷 camera</button>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {log.length === 0
          ? <span>📱 Press the SAME buttons in different states — the phone literally behaves like a different object.</span>
          : log.map((l, i) => <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{l}</div>)}
      </div>
    </div>
  )
}

/* ============ Interactive 2: The vending machine ============ */
function VendingMachine() {
  const [st, setSt] = useState('Idle')
  const [stock, setStock] = useState(2)
  const [log, setLog] = useState([])

  const say = (msg) => setLog((l) => [...l.slice(-3), msg])

  function insertCoin() {
    if (st === 'Idle') { say('[Idle] 💰 coin accepted → HasCoin'); setSt('HasCoin') }
    else if (st === 'HasCoin') say('[HasCoin] coin rejected — one at a time, friend')
    else say('[SoldOut] coin returned immediately — machine is EMPTY')
  }
  function pressButton() {
    if (st === 'Idle') say('[Idle] 🙅 insert a coin first')
    else if (st === 'HasCoin') {
      const left = stock - 1
      setStock(left)
      if (left > 0) { say(`[HasCoin] 🥤 dispensing… enjoy! (${left} left) → Idle`); setSt('Idle') }
      else { say('[HasCoin] 🥤 dispensing the LAST one → SoldOut'); setSt('SoldOut') }
    } else say('[SoldOut] 🚫 nothing left to dispense')
  }
  function refund() {
    if (st === 'HasCoin') { say('[HasCoin] 💸 coin refunded → Idle'); setSt('Idle') }
    else say(`[${st}] no coin to refund`)
  }
  function restock() { setStock(3); setSt('Idle'); say('🔧 technician restocked (3) → Idle') }

  const STATE_CODE = {
    Idle: `<span class="kw">class</span> IdleState <span class="kw">implements</span> State {
  <span class="kw">void</span> insertCoin(Machine m) {
      m.setState(<span class="kw">new</span> HasCoinState());   <span class="cm">// I decide my successor</span>
  }
  <span class="kw">void</span> pressButton(Machine m) { say(<span class="str">"insert a coin first"</span>); }
  <span class="kw">void</span> refund(Machine m)      { say(<span class="str">"no coin to refund"</span>); }
}`,
    HasCoin: `<span class="kw">class</span> HasCoinState <span class="kw">implements</span> State {
  <span class="kw">void</span> insertCoin(Machine m) { reject(); }
  <span class="kw">void</span> pressButton(Machine m) {
      m.dispense();
      m.setState(m.stock() &gt; <span class="num">0</span> ? <span class="kw">new</span> IdleState() : <span class="kw">new</span> SoldOutState());
  }
  <span class="kw">void</span> refund(Machine m) { m.returnCoin(); m.setState(<span class="kw">new</span> IdleState()); }
}`,
    SoldOut: `<span class="kw">class</span> SoldOutState <span class="kw">implements</span> State {
  <span class="kw">void</span> insertCoin(Machine m) { m.returnCoin(); }   <span class="cm">// every event: a calm answer</span>
  <span class="kw">void</span> pressButton(Machine m) { say(<span class="str">"sold out"</span>); }
  <span class="kw">void</span> refund(Machine m)      { say(<span class="str">"no coin to refund"</span>); }
}`,
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the Month-3 classic, run live — current state answers every button</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10, fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
        <span className="chip" style={st === 'Idle' ? { background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)' } : {}}>😴 Idle</span>
        <span style={{ color: '#9aa3b5' }}>⇄</span>
        <span className="chip" style={st === 'HasCoin' ? { background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)' } : {}}>🪙 HasCoin</span>
        <span style={{ color: '#9aa3b5' }}>→</span>
        <span className="chip" style={st === 'SoldOut' ? { background: 'var(--red)', color: '#fff', borderColor: 'var(--red)' } : {}}>🚫 SoldOut</span>
        <span className="chip">📦 stock: {stock}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={insertCoin}>🪙 insertCoin()</button>
        <button className="act" onClick={pressButton}>🔘 pressButton()</button>
        <button className="act" onClick={refund}>💸 refund()</button>
        <button className="ghost act" onClick={restock}>🔧 restock</button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 270 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>THE OBJECT CURRENTLY ANSWERING (the machine just delegates):</div>
          <Code html={STATE_CODE[st]} />
        </div>
        <div style={{ flex: 1, minWidth: 230 }}>
          <div className="statbar" style={{ display: 'block' }}>
            {log.length === 0
              ? <span>Try pressButton with no coin. Then coin → button. Then drain the stock…</span>
              : log.map((l, i) => <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{l}</div>)}
          </div>
        </div>
      </div>
      <div className="statbar">
        🚦 <span>Every button has a defined answer in EVERY state — including the boring "no" answers. That completeness is what separates a state machine from a pile of ifs.</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: Add-a-state blast ============ */
function AddStateBlast() {
  const [world, setWorld] = useState('switch')
  const [fired, setFired] = useState(false)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the boss: "machines need a MAINTENANCE mode!"</div>
      <div className="modbtns">
        <button className={world === 'switch' ? 'on' : ''} onClick={() => { setWorld('switch'); setFired(false) }}>😵 switch-on-status world</button>
        <button className={world === 'state' ? 'on' : ''} onClick={() => { setWorld('state'); setFired(false) }}>🚦 state-classes world</button>
      </div>
      <Code html={world === 'switch'
        ? `<span class="kw">void</span> insertCoin() {
    <span class="kw">switch</span> (status) {                       <span class="cm">// and the SAME switch again in</span>
        <span class="kw">case</span> IDLE: …; <span class="kw">break</span>;               <span class="cm">// pressButton(), refund(),</span>
        <span class="kw">case</span> HAS_COIN: …; <span class="kw">break</span>;           <span class="cm">// display(), audit()…</span>
        <span class="kw">case</span> SOLD_OUT: …; <span class="kw">break</span>;           <span class="cm">// 5 methods × N states = a grid</span>
    }                                       <span class="cm">// of cells to keep consistent</span>
}`
        : `<span class="cm">// one file per state; the machine only ever says:</span>
state.insertCoin(<span class="kw">this</span>);    <span class="cm">// whatever state object sits here answers</span>`} />
      <button className="act" onClick={() => setFired(true)} style={{ marginBottom: 10 }}>📣 add MAINTENANCE state</button>
      {fired && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {world === 'switch' ? (
              <>
                {['insertCoin()', 'pressButton()', 'refund()', 'display()', 'audit()'].map((m) => (
                  <span key={m} className="chip" style={{ background: '#FFE0DE', borderColor: 'var(--red)', color: '#8F2B24' }}>✏️ {m} — new case added</span>
                ))}
                <span className="chip" style={{ background: '#FFE0DE', borderColor: 'var(--red)', color: '#8F2B24' }}>✏️ Status enum</span>
              </>
            ) : (
              <>
                <span className="chip" style={{ background: '#EAF7EF', borderColor: 'var(--green)', color: '#1F6B43' }}>🆕 MaintenanceState.java</span>
                <span className="chip" style={{ opacity: 0.5 }}>IdleState — untouched</span>
                <span className="chip" style={{ opacity: 0.5 }}>HasCoinState — untouched</span>
                <span className="chip" style={{ opacity: 0.5 }}>SoldOutState — untouched</span>
                <span className="chip" style={{ opacity: 0.5 }}>VendingMachine — untouched</span>
              </>
            )}
          </div>
          <div className="statbar" style={{ background: world === 'switch' ? '#FDECEC' : '#EAF7EF' }}>
            {world === 'switch'
              ? <span>💥 <b>6 edits across 5 tested methods</b> — and miss ONE case and Maintenance mode silently falls through to default behavior. The grid grows as methods × states.</span>
              : <span>😌 <b>1 new file.</b> All Maintenance behavior — every event response, every exit transition — lives in one place with the state's name on the door (OCP, Day 12; cohesion, Day 17).</span>}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The State pattern\'s intent — including GoF\'s strange phrase?',
    o: ['To choose an algorithm', 'To let an object ALTER ITS BEHAVIOR when its internal state changes — "the object will appear to change its class"', 'To freeze requests', 'To notify dependents'], a: 1,
    e: 'The locked phone and the unlocked phone respond like two different classes — because behind the context, a different state OBJECT (a different class!) really is answering.',
    w: { 0: 'Algorithm choice is Strategy (31) — the twin, not the same.',
         2: 'Frozen requests are Command (33).',
         3: 'Broadcasting is Observer (32).' },
    r: { id: 's1', label: 'Section 1 — the phone button' } },
  { q: 'What exact disease does State cure?',
    o: ['Slow switches', 'The same switch-on-status duplicated across EVERY method — a methods × states grid where each new state edits every method and one missed case fails silently', 'Too many classes', 'Memory leaks'], a: 1,
    e: 'One status field, five methods, five copies of the same branching (Day 16 weeping). State transposes the grid: all of ONE state\'s behavior gathers into one class.',
    w: { 0: 'Switch speed is fine; switch SPRAWL is the disease.',
         2: 'It ADDS classes — happily, one per state.',
         3: 'No leak involved.' },
    r: { id: 's2', label: 'Section 2 — the switch grid' } },
  { q: 'In the canonical pattern, who performs the transition to the next state?',
    o: ['The client', 'The current STATE object itself — it handles the event, then calls context.setState(next); states know their successors', 'A background thread', 'The garbage collector'], a: 1,
    e: 'IdleState.insertCoin() ends with m.setState(new HasCoinState()). Transition rules live WITH the behavior they belong to — that locality is the pattern\'s cohesion win (and its key difference from Strategy).',
    w: { 0: 'Clients just fire events (insertCoin) — they never steer the lifecycle.',
         2: 'No threads required.',
         3: 'GC collects, never decides. 🙂' },
    r: { id: 's4', label: 'Section 4 — the structure' } },
  { q: 'State vs Strategy — settle Day 31\'s teaser precisely.',
    o: ['Identical patterns', 'Strategy: client/config picks ONE brain, strategies ignore each other, swap is rare and external. State: the object cycles through MANY states over its lifecycle, states know and CREATE their successors, transitions are internal and constant', 'State is compile-time', 'Strategy has more classes'], a: 1,
    e: 'Same UML, opposite souls: strategies are interchangeable PEERS (any one will do); states are a CHOREOGRAPHY (order matters, each knows the next step).',
    w: { 0: 'The most-asked GoF comparison exists because they are NOT the same.',
         2: 'Both are runtime mechanisms.',
         3: 'Class count is incidental.' },
    r: { id: 's8', label: 'Section 8 — the showdown' } },
  { q: 'pressButton() while the machine is Idle should…',
    o: ['Throw IllegalStateException always', 'Do whatever IdleState defines — here a graceful "insert a coin first". EVERY state defines a response to EVERY event; "calm no" is a valid, designed response', 'Crash the machine', 'Be impossible to call'], a: 1,
    e: 'The state × event matrix must be TOTAL. Whether an illegal event ignores, messages, logs, or throws is a per-cell design decision — what is forbidden is not deciding (the silent fall-through bug).',
    w: { 0: 'Throwing is ONE valid policy — vending machines prefer politeness; bank transfers prefer exceptions.',
         2: 'Designed machines don\'t crash on expected nonsense.',
         3: 'Buttons can always be pressed; behavior is the question.' },
    r: { id: 's5', label: 'Section 5 — the vending machine' } },
  { q: 'When should you GRADUATE from Day 19\'s enum state machine to state CLASSES?',
    o: ['Always use classes', 'When per-state BEHAVIOR grows beyond transition checks: states need their own fields, dependencies (injected services), timers, or substantial logic — an enum constant gets cramped', 'Never — enums always win', 'When you have more than 2 states'], a: 1,
    e: 'The ladder: status field → enum with canMoveTo (Day 19) → enum with per-constant behavior → state classes. Climb only when the current rung gets crowded — each step costs files (Day 16 referees).',
    w: { 0: 'A 3-state label-only lifecycle in classes is ceremony.',
         2: '"Always enums" caps you when states need DI or fields.',
         3: 'State COUNT matters less than behavior WEIGHT.' },
    r: { id: 's6', label: 'Section 6 — the graduation ladder' } },
  { q: 'When can state objects be SHARED (one IdleState instance for all machines)?',
    o: ['Never', 'When they hold NO per-context fields — stateless states are flyweights (Day 30): share one instance, pass the context as a parameter to every handler', 'Only with locks', 'Only in tests'], a: 1,
    e: 'GoF notes it explicitly: fieldless states can be singletons/shared. That\'s WHY handlers receive the Machine as a parameter — the state works on whoever calls, owns nothing itself.',
    w: { 0: 'Our SoldOutState has no fields — share away.',
         2: 'No locks needed when there\'s nothing to mutate.',
         3: 'Production loves the saving most.' },
    r: { id: 's4', label: 'Section 4 — why handlers take the context' } },
  { q: 'Which JDK lifecycle is a state machine you already debug?',
    o: ['String concatenation', 'Thread states: NEW → RUNNABLE ⇄ BLOCKED/WAITING/TIMED_WAITING → TERMINATED — Thread.getState() returns the current state, and legal transitions are fixed', 'ArrayList growth', 'Integer caching'], a: 1,
    e: 'jstack dumps are state-machine snapshots. TCP connections (GoF\'s own example), JIRA tickets, order lifecycles, game AI — once you see state machines, they are everywhere (Month 3 will draw several).',
    w: { 0: 'Strings just concatenate.',
         2: 'Capacity growth is an array trick.',
         3: 'That\'s the flyweight from Day 30.' },
    r: { id: 's8', label: 'Section 8 — machines everywhere' } },
]

/* ============ The page ============ */
export default function Day34() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 7 · Day 34 · Behavioral Patterns</div>
        <h1>State:<br />The Object That Appears to Change Class</h1>
        <p>Strategy's structural twin, with a soul of its own: objects whose behavior transforms as their
           lifecycle advances. Day 19's order machine grows up today — and the giant status-switch dies.
           Click everything.</p>
        <div className="chips">
          {['state', 'lifecycle', 'transitions', 'state × event matrix', 'vending machine', 'vs strategy'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>One button, three phones</h2>
        <p>Your phone has ONE power button. Yet: phone off → press → it boots. Phone locked → press → screen
          off. Phone unlocked → press → it locks. <strong>Same input, completely different behavior</strong> —
          as if you were holding three different devices. You are: the same context, inhabited by three
          different state objects.</p>
        <Note><strong>State's intent:</strong> allow an object to <strong>alter its behavior when its internal
          state changes</strong> — to the outside, "the object will appear to change its class" (GoF's exact,
          wonderful phrase).</Note>
        <Code html={`        THE STATE IDEA

   CONTEXT (the phone)              «interface» PhoneState
   state.powerPressed(this) ──▶     powerPressed(ctx) · cameraPressed(ctx)
                                            ▲
                              ┌─────────────┼─────────────┐
                           OffState     LockedState    HomeState
                           boots →      screen off →   locks →
                           LOCKED       OFF            LOCKED
                           ↑ each state answers every event
                             AND names its own successor`} />
        <p>Compare with Day 31 before going further: a STRATEGY is picked once by an outsider and the brains
          ignore each other. These states <strong>hand control to each other</strong>, in a choreography the
          object itself dances. Same diagram; different story.</p>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The crime: the switch grid</h2>
        <Code html={`<span class="kw">public class</span> VendingMachine {
    <span class="kw">private</span> Status status = Status.IDLE;

    <span class="kw">public void</span> insertCoin() {
        <span class="kw">switch</span> (status) { <span class="kw">case</span> IDLE: …; <span class="kw">case</span> HAS_COIN: …; <span class="kw">case</span> SOLD_OUT: …; }
    }
    <span class="kw">public void</span> pressButton() {
        <span class="kw">switch</span> (status) { <span class="kw">case</span> IDLE: …; <span class="kw">case</span> HAS_COIN: …; <span class="kw">case</span> SOLD_OUT: …; }   <span class="cm">// again</span>
    }
    <span class="kw">public void</span> refund() {
        <span class="kw">switch</span> (status) { … }                                       <span class="cm">// AGAIN</span>
    }
}</span>`} />
        <p>Count the damage: the SAME branching skeleton in every method (methods × states = a grid of cells);
          one state's logic smeared across all methods (cohesion shredded, Day 17); every new state reopens
          every tested method (Day 12); and a forgotten case fails SILENTLY through to default. Day 19's enum
          tamed the transitions — but when each cell holds real behavior, the grid itself is the disease.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>📱 Play: The possessed phone</h2>
        <p>Same three buttons throughout — watch who answers:</p>
        <PhoneDemo />
        <Good><strong>What you should notice:</strong> ① The camera button is the subtle one: it WORKS in
          LOCKED but with reduced powers — per-state behavior is richer than allowed/forbidden. ② Transitions
          ride on the events themselves (power in OFF boots; power in HOME locks). ③ Nothing outside the phone
          chose these states — the lifecycle drove itself. Strategy never does that.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The structure (behavior moves INTO the states)</h2>
        <Code html={`<span class="cm">// the STATE interface — one method per EVENT the context can receive:</span>
<span class="kw">public interface</span> State {
    <span class="kw">void</span> insertCoin(VendingMachine m);     <span class="cm">// context passed in — see why below</span>
    <span class="kw">void</span> pressButton(VendingMachine m);
    <span class="kw">void</span> refund(VendingMachine m);
}

<span class="cm">// the CONTEXT — thin forever: holds state, delegates events, owns shared data:</span>
<span class="kw">public class</span> VendingMachine {
    <span class="kw">private</span> State state = <span class="kw">new</span> IdleState();
    <span class="kw">private int</span> stock;

    <span class="kw">public void</span> insertCoin()  { state.insertCoin(<span class="kw">this</span>); }    <span class="cm">// that's ALL it does</span>
    <span class="kw">public void</span> pressButton() { state.pressButton(<span class="kw">this</span>); }
    <span class="kw">public void</span> refund()      { state.refund(<span class="kw">this</span>); }

    <span class="kw">void</span> setState(State next) { <span class="kw">this</span>.state = next; }        <span class="cm">// states call this</span>
    <span class="kw">int</span> stock() { <span class="kw">return</span> stock; }
    <span class="kw">void</span> dispense() { stock--; <span class="cm">/* motor whirr */</span> }
}

<span class="cm">// ONE concrete state = ONE column of the old grid, gathered into a single class:</span>
<span class="kw">public class</span> HasCoinState <span class="kw">implements</span> State {
    <span class="kw">public void</span> insertCoin(VendingMachine m)  { m.returnCoin(); }   <span class="cm">// "one at a time"</span>
    <span class="kw">public void</span> pressButton(VendingMachine m) {
        m.dispense();
        m.setState(m.stock() &gt; <span class="num">0</span> ? <span class="kw">new</span> IdleState() : <span class="kw">new</span> SoldOutState());
    }
    <span class="kw">public void</span> refund(VendingMachine m) { m.returnCoin(); m.setState(<span class="kw">new</span> IdleState()); }
}`} />
        <p>Two deliberate choices to name in interviews: <strong>① handlers receive the context as a
          parameter</strong> — so states can hold zero fields, which makes them shareable singletons
          (flyweight, Day 30); <strong>② states create their successors</strong> — transition rules live next
          to the behavior that triggers them, one state per file, the whole grid column in one place.</p>
        <Warn><strong>The stateful-state trap:</strong> the moment a state class gains a field (e.g. caching
          "coins inserted so far" on <C>HasCoinState</C> instead of on the context), it can no longer be a
          shared singleton — every machine now needs its OWN instance, and two machines can silently corrupt
          each other's data if one is accidentally reused. Data belongs on the context; states stay stateless.</Warn>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🥤 Play: The vending machine</h2>
        <p>The Month 3 interview classic, alive. Push every button in every state — especially the wrong
          ones — and watch which CLASS answers:</p>
        <VendingMachine />
        <Good><strong>What you should notice:</strong> ① The code panel swaps as the state changes — a different
          object genuinely answers each press. ② Illegal events get designed, graceful responses — the matrix
          is total, no silent fall-throughs. ③ The machine itself stayed a thin shell: data + delegation. All
          the IF-ness of the old grid evaporated into polymorphism (Day 4, once more with feeling).</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The graduation ladder (when is each tool right?)</h2>
        <table className="matrix">
          <thead>
            <tr><th>rung</th><th>use when</th><th>from</th></tr>
          </thead>
          <tbody>
            <tr><td>status field + ifs</td><td>2 states, trivial behavior, no growth signal</td><td>Day 16's KISS</td></tr>
            <tr><td>enum + canMoveTo()</td><td>transitions need guarding; behavior is small</td><td>Day 19</td></tr>
            <tr><td>enum with per-constant behavior</td><td>modest per-state logic, fixed set, exhaustiveness wanted</td><td>Day 19 + 31's corner</td></tr>
            <tr><td className="yes">state CLASSES (today)</td><td>per-state behavior is substantial; states need fields, injected services, timers; teams own different states</td><td>Day 34</td></tr>
            <tr><td>transition-table / statechart engine</td><td>dozens of states, nesting, history — data-driven beats code</td><td>the corner ↓</td></tr>
          </tbody>
        </table>
        <Note><strong>The honest rule:</strong> climb one rung when the current one gets crowded — never start
          at the top. Day 19's enum order machine was RIGHT for its size; a payment orchestration with retries,
          timeouts and webhooks per state is right for today's rung.</Note>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>📣 Play: Add MAINTENANCE mode</h2>
        <p>The change-request test, one more time:</p>
        <AddStateBlast />
        <Good><strong>What you should notice:</strong> ① Switch-world: six edits across five tested methods, and
          the silent-fall-through risk rides along. ② State-world: one new file with the state's name on the
          door — every Maintenance response and exit in one place. ③ The grid transposed: old world groups code
          by EVENT, new world groups by STATE — and states are what change requests talk about.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>The showdown settled — and machines everywhere</h2>
        <table className="matrix">
          <thead>
            <tr><th></th><th>🧠 Strategy (31)</th><th>🚦 State (34)</th></tr>
          </thead>
          <tbody>
            <tr><td>who chooses</td><td>client / config / registry — external</td><td>the states themselves — internal lifecycle</td></tr>
            <tr><td>do variants know each other?</td><td className="no">strangers</td><td className="yes">each names its successors</td></tr>
            <tr><td>change frequency</td><td>rarely (per request/session)</td><td>constantly (every event may transition)</td></tr>
            <tr><td>variants are…</td><td>interchangeable peers (any will do)</td><td>a choreography (order is the point)</td></tr>
            <tr><td>question answered</td><td>"WHICH way shall we do this job?"</td><td>"WHERE in my lifecycle am I?"</td></tr>
          </tbody>
        </table>
        <p>And once you have the lens: <strong>TCP connections</strong> (GoF's original example —
          Established/Listen/Closed), <strong>Java threads</strong> (NEW → RUNNABLE ⇄ WAITING → TERMINATED —
          every jstack you'll ever read), JIRA tickets, order lifecycles (Day 19, now with behavior), game AI
          (Patrol→Chase→Attack→Flee), UI controls (enabled/loading/error). Month 3's Elevator and Vending
          Machine days are state machines wearing problem statements.</p>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — State explosion via fused dimensions</h3>
        <p>PaidAndShipped, PaidAndDelayed, UnpaidAndDelayed… two independent aspects (payment × delivery)
          multiplied into one machine — Day 30's m×n disease, state edition. Keep ORTHOGONAL aspects as
          separate machines/fields; only genuinely sequential phases belong in one lifecycle.</p>
        <h3>Trap 2 — Stateful "shareable" states</h3>
        <p>You shared IdleState across 500 machines, then someone adds a <C>coinCount</C> field to it — now all
          machines share one wallet (Day 30's painted forest). Fieldless → shareable; fielded → one per
          context. Never drift between the two silently.</p>
        <h3>Trap 3 — Transition logic leaking back into the context</h3>
        <p>Half the transitions in states, half in the machine ("if state instanceof…") — now NOBODY knows the
          full map. Pick one owner. If states own transitions (canonical), the context never inspects which
          state it holds.</p>
        <h3>Trap 4 — Incomplete matrices</h3>
        <p>New event added (e.g. <C>powerOutage()</C>) but only two states handle it — the interface saves you
          IF the method is abstract (compiler lists every state to update — Day 19's exhaustiveness, class
          edition). Default methods here trade that safety for convenience; choose knowingly.</p>
        <h3>Trap 5 — Untracked history</h3>
        <p>"Why is this order CANCELLED?" — current state says nothing about the journey. Log every transition
          (from, to, event, timestamp) — your Command-log instincts from Day 33 apply; auditors and debuggers
          will bless you.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> behavior changes with internal state — "appears to change class." Cures the methods × states switch-grid.</li>
          <li><strong>Structure:</strong> thin context (data + delegation + setState) · State interface (one method per EVENT, context passed in) · one class per state — behavior AND successor-choice together.</li>
          <li><strong>Design rules:</strong> total state × event matrix (graceful "no" is a designed answer) · fieldless states are shareable flyweights · log transitions.</li>
          <li><strong>Ladder:</strong> ifs → enum+guards (D19) → enum behavior → state classes → statechart engine. Climb when crowded.</li>
          <li><strong>vs Strategy:</strong> external pick of interchangeable peers vs internal choreography of successors. Same UML, opposite souls.</li>
          <li>Sightings: TCP, Java thread states, tickets, orders, game AI, UI controls. Traps: fused dimensions (m×n!), stateful shared states, split transition ownership, incomplete matrices, no history.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: What does "the object will appear to change its class" actually mean?'>
          <p>Clients call the same methods on the same reference, but responses come from whichever state class
            currently sits inside — behaviorally indistinguishable from the object swapping its class at
            runtime (which Java forbids, Day 7!). State is the legal way to get class-changing behavior.</p>
        </Reveal>
        <Reveal summary="Q: State pattern vs a transition TABLE — when does data beat objects?">
          <p>A table (Map of (state, event) → (action, nextState)) shines when transitions are MANY, uniform,
            and tweaked by non-developers (configurable workflows) — the whole machine is one screenful of
            data. State classes win when per-state BEHAVIOR is rich code. Real engines (Spring Statemachine,
            XState) are tables underneath with hooks for behavior — naming both approaches is the senior
            answer.</p>
        </Reveal>
        <Reveal summary="Q: Ignore, message, log, or THROW on an illegal event — how do you decide?">
          <p>By the cost of the caller being wrong: vending machine pressButton-with-no-coin → friendly message
            (users fumble, no harm). withdraw() on a CLOSED account → throw IllegalStateException (callers must
            know, money is at stake). The matrix cell gets a per-case decision; the only sin is leaving the
            cell undefined.</p>
        </Reveal>
        <Reveal summary="Q: Where do entry/exit actions fit (statechart vocabulary)?">
          <p>onEnter/onExit hooks per state — start the dispensing motor on entering Dispensing, stop it on
            exit, regardless of WHICH transition fired. UML statecharts (Harel) standardize this plus nested
            states and history states. Knowing "GoF State is the OO core; statecharts are the full notation"
            connects Day 8/9's UML world to today.</p>
        </Reveal>
        <Reveal summary="Q: How does State interact with persistence — an Order loaded from the DB?">
          <p>You persist the state NAME (Day 19's never-ordinal lesson), then rehydrate: map name → state
            object on load (registry, Day 31). Plus the versioning wrinkle: code removes a state that rows
            still carry — migrations for state machines are real work. This question separates whiteboard
            knowledge from production scars.</p>
        </Reveal>
        <Reveal summary="Q: Concurrent events — two threads hit insertCoin() simultaneously. What breaks?">
          <p>Check-then-act on the state reference (Day 21's race, lifecycle edition): both see Idle, both
            transition → double-accept. Fixes: synchronize event methods on the context, or an atomic
            compare-and-set of state, or funnel events through a single-threaded queue (Day 33's kitchen!).
            State machines + concurrency = Month 4's opening act.</p>
        </Reveal>
        <Reveal summary="Q: Sketch the State answer for the Elevator problem in 20 seconds.">
          <p>"Context: Elevator (floor, queue). States: IdleState, MovingUpState, MovingDownState,
            DoorsOpenState — each handles requestFloor/arrive/doorTimer and names its successor; illegal
            events answer gracefully (requestFloor while DoorsOpen just queues). Transitions logged."
            That paragraph IS the Month 3 Week 10 opener — practice saying it cold.</p>
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
        <strong>Day 34 complete?</strong> Homework: the music player.
        <C> interface PlayerState {'{'} void play(Player p); void pause(Player p); void stop(Player p); {'}'}</C>
        with <C>StoppedState</C>, <C>PlayingState</C>, <C>PausedState</C> — play in Stopped starts track 1;
        play in Paused resumes; play in Playing restarts the track (your choice — DOCUMENT it); pause in
        Stopped answers gracefully. The Player context holds track + position; states are FIELDLESS (prove
        shareability: reuse one instance of each across two Player objects). Add transition logging
        (from → event → to). Bonus: add a <C>LockedState</C> (headphone kids!) — count how many existing files
        you touched (target: zero).
        <br /><br />
        Next: <strong>Day 35 — Template Method</strong>: the Week 7 finale — the fixed skeleton with pluggable
        steps, inheritance's last great pattern, and the Hollywood Principle: "don't call us, we'll call you."
      </div>
    </div>
  )
}
