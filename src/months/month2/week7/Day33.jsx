import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The programmable remote ============ */
const PALETTE = {
  lightOn: { label: '💡 LightOn', run: ['💡 Light: ON'] },
  fanHigh: { label: '🌀 FanHigh', run: ['🌀 Fan: speed 3'] },
  music: { label: '🎵 MusicPlay', run: ['🎵 Speaker: playing lo-fi'] },
  movieNight: { label: '🎬 MovieNight (MACRO)', run: ['💡 Light: dim 20%', '❄️ AC: 22°C', '📺 TV: ON, HDMI-1'] },
}

function Remote() {
  const [slots, setSlots] = useState([null, null, null])
  const [sel, setSel] = useState(0)
  const [log, setLog] = useState([])

  const assign = (key) => setSlots((s) => s.map((v, i) => (i === sel ? key : v)))
  function press(i) {
    const key = slots[i]
    if (!key) { setLog((l) => [...l.slice(-3), `button ${i + 1}: (empty slot — nothing assigned)`]) ; return }
    setLog((l) => [...l.slice(-3), ...PALETTE[key].run.map((r) => `button ${i + 1} → ${r}`)])
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · three dumb buttons, programmable with frozen requests</div>
      <Code html={`<span class="cm">// the INVOKER — knows execute() and nothing else, forever:</span>
<span class="kw">class</span> RemoteButton {
    <span class="kw">private</span> Command command;                      <span class="cm">// any frozen request fits</span>
    <span class="kw">void</span> setCommand(Command c) { command = c; }   <span class="cm">// program the button</span>
    <span class="kw">void</span> press() { command.execute(); }           <span class="cm">// its ENTIRE intelligence</span>
}`} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {slots.map((key, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button className="act" onClick={() => press(i)}>🔘 button {i + 1}</button>
            <span className="chip" onClick={() => setSel(i)}
              style={{ cursor: 'pointer', outline: sel === i ? '2px solid var(--blue)' : 'none' }}>
              {key ? PALETTE[key].label : 'empty'} {sel === i ? '← assigning' : ''}
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', margin: '6px 0' }}>ASSIGN TO SELECTED SLOT:</div>
      <div className="modbtns">
        {Object.entries(PALETTE).map(([k, v]) => (
          <button key={k} onClick={() => assign(k)}>{v.label}</button>
        ))}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {log.length === 0
          ? <span>👆 Assign commands to slots, then press. Try MovieNight — one press, three devices.</span>
          : log.map((l, i) => <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{l}</div>)}
      </div>
    </div>
  )
}

/* ============ Interactive 2: The kitchen queue ============ */
const DISHES = ['🥞 2× Dosa', '🍛 1× Thali', '☕ 3× Chai', '🥪 1× Sandwich']
let slipNo = 0

function Kitchen() {
  const [queue, setQueue] = useState([])
  const [done, setDone] = useState([])

  function waiterAdds() {
    slipNo += 1
    const dish = DISHES[slipNo % DISHES.length]
    setQueue((q) => [...q, { id: slipNo, desc: `${dish} — table ${(slipNo % 9) + 1}` }])
  }
  function cookNext() {
    setQueue((q) => {
      if (q.length === 0) return q
      const [first, ...rest] = q
      setDone((d) => [...d.slice(-2), `✅ slip #${first.id}: ${first.desc} — served`])
      return rest
    })
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · order slips: requests that WAIT — the caller and the doer never meet</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={waiterAdds}>✍️ waiter writes a slip</button>
        <button className="act" onClick={cookNext} disabled={queue.length === 0}>👨‍🍳 cook takes next slip</button>
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>
        THE RAIL (queue of frozen requests) — {queue.length} waiting
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 34, marginBottom: 8 }}>
        {queue.length === 0
          ? <span style={{ color: '#9aa3b5', fontSize: 13 }}>rail empty — waiters are faster than cooks, usually 🙂</span>
          : queue.map((s) => <span key={s.id} className="chip">📄 #{s.id} {s.desc}</span>)}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {done.length === 0
          ? <span>👨‍🍳 The cook runs one loop: <C>take next slip → execute it</C>. He has never met a waiter and knows no table numbers — slips carry everything.</span>
          : done.map((l, i) => <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{l}</div>)}
      </div>
    </div>
  )
}

/* ============ Interactive 3: The undo/redo editor ============ */
function Editor() {
  const [text, setText] = useState('')
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])

  function exec(label, apply) {
    setUndoStack((u) => [...u, { label, prev: text }])
    setRedoStack([])                                    // a new command clears redo!
    setText(apply(text))
  }
  function undo() {
    setUndoStack((u) => {
      if (u.length === 0) return u
      const last = u[u.length - 1]
      setRedoStack((r) => [...r, { label: last.label, prev: text }])
      setText(last.prev)
      return u.slice(0, -1)
    })
  }
  function redo() {
    setRedoStack((r) => {
      if (r.length === 0) return r
      const last = r[r.length - 1]
      setUndoStack((u) => [...u, { label: last.label, prev: text }])
      setText(last.prev)
      return r.slice(0, -1)
    })
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · every edit is an object — that is why Ctrl+Z exists</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => exec('Type("design")', (t) => (t ? t + ' design' : 'design'))}>type "design"</button>
        <button className="act" onClick={() => exec('Type("patterns")', (t) => (t ? t + ' patterns' : 'patterns'))}>type "patterns"</button>
        <button className="act" onClick={() => exec('Uppercase()', (t) => t.toUpperCase())}>UPPERCASE</button>
        <button className="act" onClick={() => exec('DeleteLastWord()', (t) => t.split(' ').slice(0, -1).join(' '))}>⌫ delete word</button>
        <button className="ghost act" onClick={undo} disabled={undoStack.length === 0}>↩ undo</button>
        <button className="ghost act" onClick={redo} disabled={redoStack.length === 0}>↪ redo</button>
      </div>
      <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '10px 14px', background: '#fff', fontFamily: 'IBM Plex Mono', fontSize: 14, minHeight: 24, marginBottom: 10 }}>
        {text || <span style={{ color: '#c0c5cf' }}>…empty document</span>}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>UNDO STACK ({undoStack.length})</div>
          {undoStack.map((c, i) => <div key={i} className="chip" style={{ display: 'block', marginBottom: 3 }}>📄 {c.label}</div>)}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>REDO STACK ({redoStack.length})</div>
          {redoStack.map((c, i) => <div key={i} className="chip" style={{ display: 'block', marginBottom: 3 }}>📄 {c.label}</div>)}
        </div>
      </div>
      <div className="statbar">
        ⏪ <span>Undo pops a command (with its stored "before" state) onto the redo stack. Type something NEW and the redo stack empties — the timeline forked. Check it yourself.</span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Command pattern\'s intent is…',
    o: ['To choose among algorithms', 'To simplify a subsystem', 'To notify many objects', 'To ENCAPSULATE A REQUEST AS AN OBJECT — so it can be passed around, queued, logged, scheduled, and undone'], a: 3,
    e: 'A method call evaporates the moment it runs. Freeze it into an object (receiver + action + arguments) and it becomes a THING: storable, delayable, repeatable, reversible.',
    w: { 0: 'Choosing among ways to do ONE job is Strategy (31).',
         1: 'One simple door is Facade (29).',
         2: 'Broadcasting is Observer (32).' },
    r: { id: 's1', label: 'Section 1 — the order slip' } },
  { q: 'Name the four GoF participants and the key ignorance.',
    o: ['Subject, Observer, Event, Bus', 'Command (interface), ConcreteCommand (binds receiver + args), Invoker (triggers execute, knows NOTHING about the work), Receiver (does the actual work)', 'Context, Strategy, Registry, Client', 'Builder, Director, Product, Client'], a: 1,
    e: 'The invoker\'s ignorance is the prize: a button/queue/scheduler that only knows execute() can trigger ANY work ever invented — including work invented after the invoker shipped.',
    w: { 0: 'Observer\'s cast (32).',
         2: 'Strategy\'s cast (31).',
         3: 'Builder\'s cast (24).' },
    r: { id: 's2', label: 'Section 2 — the four roles' } },
  { q: 'In standard undo/redo, what happens to the REDO stack when a brand-new command executes?',
    o: ['It doubles', 'It is CLEARED — you forked the timeline, and the old future is no longer reachable', 'Nothing', 'It is copied to undo'], a: 1,
    e: 'Undo, undo, then type something new: every editor on Earth discards the redo history at that moment. Two stacks + this clearing rule = the complete undo/redo algorithm.',
    w: { 0: 'Nothing doubles.',
         2: 'Leaving stale redos would let you "redo" into a state that no longer follows.',
         3: 'No copying — discarding.' },
    r: { id: 's6', label: 'Section 6 — undo mechanics' } },
  { q: 'Runnable and ExecutorService, in today\'s vocabulary?',
    o: ['Observer and Subject', 'Strategy and Context', 'Runnable = a Command (execute() renamed run(), no undo); the executor = an Invoker with a queue and worker threads — you have been queuing command objects since your first thread pool', 'Adapter and Adaptee'], a: 2,
    e: 'submit(() -> sendEmail(user)) freezes a request and hands it to an invoker that neither knows nor cares what it does. The kitchen demo, industrialized.',
    w: { 0: 'Nothing subscribes here.',
         1: 'The executor doesn\'t pick HOW — it runs WHATEVER arrives, later.',
         3: 'No interface translation.' },
    r: { id: 's4', label: 'Section 4 — the powers of reification' } },
  { q: 'A MacroCommand (MovieNight = dim + AC + TV) is which two patterns shaking hands?',
    o: ['Command + Composite: a command that HOLDS a list of commands and executes them in order — undo runs the list in REVERSE', 'Command + Proxy', 'Command + Flyweight', 'Command + Singleton'], a: 0,
    e: 'Day 28\'s recursive type again: List<Command> inside a Command. One press, whole scene — and reverse-order undo, because the last change must unwind first.',
    w: { 1: 'Nothing is access-controlled.',
         2: 'No shared-state economics here.',
         3: 'Instance count is irrelevant.' },
    r: { id: 's3', label: 'Section 3 — the remote & the macro' } },
  { q: 'Command vs Strategy — both are "an object with one method". The distinction?',
    o: ['None', 'Command is older', 'Strategy = HOW to perform one job, chosen among interchangeable ways, context supplies the data per call. Command = A COMPLETE THING TO DO, self-contained with its receiver and arguments — many heterogeneous ones can sit in one queue', 'Strategy cannot use lambdas'], a: 2,
    e: 'Litmus test: can wildly different items share a list? A queue holding SendEmail, ResizeImage and DeleteUser is command. Three ways to PRICE one cart is strategy.',
    w: { 0: 'Same silhouette, classic intent split.',
         1: 'Same 1994 book.',
         3: 'Both love lambdas.' },
    r: { id: 's8', label: 'Section 8 — the look-alike table' } },
  { q: 'undo() for "send email" — what is the honest answer?',
    o: ['Store the email and delete it from their inbox', 'Throw UnsupportedOperationException and call it undo', 'All commands can be undone', 'Some effects are NOT invertible: you cannot unsend. Real systems use COMPENSATION (send a correction) or confirm-before-execute — and an honest design marks such commands non-undoable'], a: 3,
    e: 'Undo presumes an inverse exists. External side effects (emails, payments, missiles) often have none — banks reverse with compensating TRANSACTIONS, not time travel. Knowing this boundary is senior judgment.',
    w: { 0: 'You do not control their inbox. 🙂',
         1: 'A throwing undo() is Day 13\'s penguin in a new costume.',
         2: 'Pleasant fiction.' },
    r: { id: 's9', label: 'Section 9 — Trap 2: the impossible undo' } },
  { q: 'Where should the BUSINESS LOGIC of a command live?',
    o: ['In the RECEIVER — the command binds and forwards (a few lines); a fat execute() full of rules is a god-method hiding in a pattern costume', 'In the undo stack', 'In the invoker', 'Inside execute(), all of it'], a: 0,
    e: 'LightOnCommand.execute() is one line: light.on(). The Light owns lighting logic (Information Expert, Day 10). Commands are FROZEN CALLS, not alternative homes for domain rules.',
    w: { 1: 'The stack stores history, not behavior.',
         2: 'The invoker\'s ignorance is sacred — that\'s its whole value.',
         3: 'That builds unreachable, untestable logic blobs per action.' },
    r: { id: 's9', label: 'Section 9 — Trap 1: the fat command' } },
]

/* ============ The page ============ */
export default function Day33() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 7 · Day 33 · Behavioral Patterns</div>
        <h1>Command:<br />The Method Call You Can Hold</h1>
        <p>A method call vanishes the instant it runs. Today you learn to FREEZE one into an object — and
           suddenly requests can wait in queues, survive in logs, run on schedules, and be taken back.
           This is the pattern behind every Ctrl+Z you have ever pressed. Click everything.</p>
        <div className="chips">
          {['command', 'invoker/receiver', 'queues', 'undo/redo', 'macro commands', 'Runnable'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The order slip</h2>
        <p>Watch a restaurant carefully. You don't shout your order at the cook. You tell the
          <strong> waiter</strong>, who writes an <strong>order slip</strong> — and that humble paper changes
          everything:</p>
        <ul>
          <li>It <strong>waits</strong> on the kitchen rail (a queue) until a cook is free.</li>
          <li>It's a <strong>record</strong> — end of day, the slips ARE the sales log.</li>
          <li>It can be <strong>cancelled</strong> before cooking starts (undo!), or re-fired if dropped.</li>
          <li>The cook executes slips <strong>without ever meeting you</strong> — the slip carries everything:
            dish, quantity, table.</li>
        </ul>
        <Note><strong>Command's intent:</strong> encapsulate a request as an <strong>object</strong>, letting you
          parameterize objects with requests, queue them, log them — and support undoable operations. The fancy
          word is <em>reification</em>: turning an action into a thing.</Note>
        <Code html={`        FOUR ROLES, ONE SLIP

   CLIENT (you)            INVOKER (the rail/cook's loop)      RECEIVER (the kitchen)
   creates the slip:       press()/take() {                    cook(dish, qty) {
   new CookOrder(            command.execute();   ← its ONLY     /* the real work */
     kitchen,"dosa",2)     }                        knowledge   }
        │                        ▲
        └── hands it ────────────┘     the COMMAND binds receiver + args:
                                       execute() { kitchen.cook("dosa", 2); }`} />
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The structure in Java (GoF's own example, modernized)</h2>
        <Code html={`<span class="cm">// the COMMAND interface — the slip format:</span>
<span class="kw">public interface</span> Command {
    <span class="kw">void</span> execute();
    <span class="kw">default void</span> undo() { <span class="cm">/* optional — see §6 */</span> }
}

<span class="cm">// the RECEIVER — owns the real behavior (and ALL the business logic):</span>
<span class="kw">public class</span> Light {
    <span class="kw">public void</span> on()  { <span class="cm">/* relay magic */</span> }
    <span class="kw">public void</span> off() { <span class="cm">/* relay magic */</span> }
}

<span class="cm">// a CONCRETE COMMAND — binds receiver + arguments at construction, frozen:</span>
<span class="kw">public class</span> LightOnCommand <span class="kw">implements</span> Command {
    <span class="kw">private final</span> Light light;                    <span class="cm">// WHO</span>
    <span class="kw">public</span> LightOnCommand(Light light) { <span class="kw">this</span>.light = light; }
    <span class="kw">public void</span> execute() { light.on(); }         <span class="cm">// one line — it DELEGATES</span>
    <span class="kw">public void</span> undo()    { light.off(); }        <span class="cm">// the inverse, when one exists</span>
}

<span class="cm">// the INVOKER — triggers without understanding:</span>
button.setCommand(<span class="kw">new</span> LightOnCommand(hallLight));
button.press();      <span class="cm">// the button has no idea lights exist</span>`} />
        <p>Read the dependency arrows (Day 17 reflex): the invoker depends on ONE tiny interface; the command
          depends on its receiver; the receiver depends on nothing new. The client at the composition root
          (Day 15) wires who-does-what — everyone else stays ignorant and reusable.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🎛️ Play: The programmable remote</h2>
        <p>Three buttons that know nothing, programmed live — including a macro that runs a whole scene:</p>
        <Remote />
        <Good><strong>What you should notice:</strong> ① The button's source code is frozen forever
          (<C>command.execute()</C>) yet its BEHAVIOR is reassigned at runtime — parameterizing objects with
          requests, literally. ② MovieNight is a command HOLDING commands — Day 28's Composite shaking hands
          with Command. ③ Slot 3 empty? A NoOpCommand beats a null check (Day 31's Null Object again).</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>What freezing a call buys you (the powers list)</h2>
        <ul>
          <li><strong>Queue it</strong> — work happens later, elsewhere: thread pools, job queues. You already
            do this: <C>executor.submit(() -&gt; resize(img))</C> — <strong>Runnable IS Command</strong>
            (execute() renamed run()), and the ExecutorService is an invoker with worker threads.</li>
          <li><strong>Log it</strong> — a list of executed commands is an audit trail; REPLAY the list and you
            rebuild state. Databases call this a write-ahead log; architects call it event sourcing (Month 3's
            Splitwise will wink at this).</li>
          <li><strong>Schedule it</strong> — TimerTask, cron jobs, retries-with-backoff: all "command + when".</li>
          <li><strong>Undo it</strong> — store the inverse or the before-state, keep a history stack (§6).</li>
          <li><strong>Compose it</strong> — macro commands, transactions: many slips stapled together.</li>
        </ul>
        <Warn><strong>The common thread:</strong> every power comes from the request OUTLIVING the call site.
          A plain method call cannot wait, be counted, or be reversed — an object can.</Warn>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🍳 Play: The kitchen rail</h2>
        <p>Waiters write fast; cooks cook slow. The rail between them is a queue of frozen requests:</p>
        <Kitchen />
        <Good><strong>What you should notice:</strong> ① Producers and consumers are decoupled IN TIME — slips
          pile up at lunch rush, drain after; nobody blocks anybody. ② The cook's loop is the invoker:
          take, execute, repeat — it never learns the menu. ③ This exact picture, with threads as cooks, is
          Month 4's producer-consumer — Command is its object model.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Undo/redo: the two-stack machine</h2>
        <Code html={`<span class="kw">public class</span> CommandHistory {
    <span class="kw">private final</span> Deque&lt;Command&gt; undoStack = <span class="kw">new</span> ArrayDeque&lt;&gt;();
    <span class="kw">private final</span> Deque&lt;Command&gt; redoStack = <span class="kw">new</span> ArrayDeque&lt;&gt;();

    <span class="kw">public void</span> execute(Command c) {
        c.execute();
        undoStack.push(c);
        redoStack.clear();          <span class="cm">// ⚠️ a NEW action forks the timeline — old future dies</span>
    }
    <span class="kw">public void</span> undo() {
        <span class="kw">if</span> (undoStack.isEmpty()) <span class="kw">return</span>;
        Command c = undoStack.pop();
        c.undo();
        redoStack.push(c);
    }
    <span class="kw">public void</span> redo() {
        <span class="kw">if</span> (redoStack.isEmpty()) <span class="kw">return</span>;
        Command c = redoStack.pop();
        c.execute();
        undoStack.push(c);
    }
}`} />
        <p>And the design fork INSIDE undo(): how does a command know how to go back?</p>
        <table className="matrix">
          <thead>
            <tr><th></th><th>INVERSE operation</th><th>SNAPSHOT of before-state</th></tr>
          </thead>
          <tbody>
            <tr><td>undo() does</td><td>the opposite action (on→off, +50→−50)</td><td>restore the saved copy</td></tr>
            <tr><td>memory</td><td className="yes">tiny</td><td>can be heavy (whole document?)</td></tr>
            <tr><td>works when…</td><td>a clean inverse EXISTS</td><td className="yes">always — even for messy ops like UPPERCASE (lowercase loses information!)</td></tr>
            <tr><td>fancy name</td><td>—</td><td>the snapshot object is a <strong>Memento</strong> — Week 8 gives it a full day</td></tr>
          </tbody>
        </table>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>↩️ Play: Build the editor</h2>
        <p>Type, transform, then walk time backwards and forwards. One experiment is mandatory: undo twice,
          then type something new — and watch the redo stack.</p>
        <Editor />
        <Good><strong>What you should notice:</strong> ① Every button push created a command object carrying its
          own "before" snapshot — UPPERCASE is not invertible by math (was it "Design" or "design"?), so
          snapshots save it. ② Undo moves slips between stacks; nothing is recomputed. ③ The fork: new command →
          redo stack emptied. You have now implemented the feature users would riot without.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Java sightings & the look-alike table</h2>
        <ul>
          <li><C>Runnable</C> / <C>Callable</C> — commands without/with a result; <C>Future</C> adds
            cancellation and status to a queued command.</li>
          <li><strong>Swing's <C>Action</C></strong> — a command shared by menu item, toolbar button and
            keyboard shortcut, with enable/disable in ONE place. (GUI events: the listener is Observer
            machinery; the listener's BODY is usually a command — Day 32's promised handshake.)</li>
          <li><C>TimerTask</C>, Spring's <C>@Scheduled</C>, every job-queue library — command + clock.</li>
        </ul>
        <table className="matrix">
          <thead>
            <tr><th>vs</th><th>one-liner</th></tr>
          </thead>
          <tbody>
            <tr><td>🧠 Strategy (31)</td><td>strategy = interchangeable HOW for one job (context provides data); command = a self-contained THING TO DO (carries receiver + args) — heterogeneous commands share one queue</td></tr>
            <tr><td>📡 Observer (32)</td><td>observer answers WHO gets told; command answers WHAT a request IS — listener bodies wrap commands</td></tr>
            <tr><td>🌳 Composite (28)</td><td>macro/transaction = command holding commands; undo in reverse order</td></tr>
            <tr><td>📜 Memento (W8)</td><td>the snapshot a command stores for undo — next week's pattern, met today as a need</td></tr>
          </tbody>
        </table>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — The fat command</h3>
        <p>execute() growing validation, pricing, persistence… Commands are FROZEN CALLS; the work belongs in
          receivers (Information Expert, Day 10). Rule of thumb: execute() should read like one delegating
          line, two at most.</p>
        <h3>Trap 2 — The impossible undo</h3>
        <p>Emails, payments, published messages: no inverse exists. Honest designs mark commands
          non-undoable (an <C>isUndoable()</C>, or separate interfaces — Day 14) and use COMPENSATION
          (refund ≠ un-charge) where business demands it. A throwing undo() is the penguin again (Day 13).</p>
        <h3>Trap 3 — Macro undo in the wrong order</h3>
        <p>MovieNight undone must run TV-off, AC-restore, lights-up — the REVERSE of execution. Undoing in
          forward order restores states that later sub-commands then re-overwrite. Iterate the list backwards;
          and decide what happens if sub-command #2 of 3 failed during execute (roll back the executed
          prefix!).</p>
        <h3>Trap 4 — Stale snapshots & re-executed instances</h3>
        <p>A command reused for a second execute() still carries the FIRST run's snapshot — undo now restores
          ancient state. Either make commands one-shot (new instance per request — they're cheap) or
          re-capture state at each execute().</p>
        <h3>Trap 5 — Command-itis</h3>
        <p>Reifying every method call "for flexibility" buries simple code in slip-paperwork (Day 16). Buy the
          object only when you NEED a power: queueing, logging, undo, scheduling. A direct call is still a
          fine thing.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> request → object (receiver + action + args). Powers: queue · log/replay · schedule · undo · compose. All from the request OUTLIVING its call site.</li>
          <li><strong>Roles:</strong> Command (interface) · ConcreteCommand (binds, delegates) · Invoker (execute()-only ignorance) · Receiver (real work + business logic) · Client (wires at the root).</li>
          <li><strong>Undo/redo:</strong> two stacks; new command CLEARS redo; inverse op (cheap, needs true inverse) vs snapshot/Memento (always works, heavier). Macros undo in REVERSE.</li>
          <li>JDK: Runnable/Callable + ExecutorService (command + queued invoker) · Swing Action · TimerTask. Event sourcing = the command log as the source of truth.</li>
          <li>Distinctions: vs Strategy (how-for-one-job vs thing-to-do) · vs Observer (who's told vs what it is) · + Composite = macro.</li>
          <li>Traps: fat execute() · un-invertible effects (compensation!) · macro undo order/partial failure · stale snapshots on reuse · command-itis.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: GoF's alternate names for Command?">
          <p><strong>Action</strong> and <strong>Transaction</strong>. Both survive in the wild: Swing's Action
            class, and "transaction script"/compensating-transaction vocabulary in enterprise systems. Three
            names, one frozen request.</p>
        </Reveal>
        <Reveal summary="Q: How does Command enable EVENT SOURCING in one paragraph?">
          <p>If every state change is a command/event object and you LOG them all, the log becomes the source of
            truth: current state = replay(log). You gain perfect audit, time-travel debugging, and rebuildable
            projections — at the cost of versioning old events forever. "The bank statement IS the account" is
            the analogy that lands.</p>
        </Reveal>
        <Reveal summary="Q: Runnable vs Callable vs Future — map them to the pattern.">
          <p>Runnable = command, void, no checked exceptions. Callable&lt;V&gt; = command with a RESULT.
            Future&lt;V&gt; = the invoker's receipt for a queued command: poll status, get() the result,
            cancel(true) — cancellation being undo's little cousin for not-yet-finished work.</p>
        </Reveal>
        <Reveal summary="Q: A macro's sub-command #2 of 3 throws during execute(). What should happen?">
          <p>Transactional behavior: catch, then UNDO the already-executed prefix in reverse (sub-command #1),
            then rethrow — leaving the system as if nothing ran. All-or-nothing macros are why Command +
            Composite is called "Transaction" in GoF. Mentioning the rollback-of-prefix detail is the senior
            tell.</p>
        </Reveal>
        <Reveal summary="Q: Why is Swing's Action a smarter command than a plain listener?">
          <p>One Action backs the menu item, toolbar button AND Ctrl+S — name, icon, tooltip and
            <C> setEnabled(false)</C> live in ONE object and every UI control follows. Disable "Save" during
            save: one call, three widgets grey out. Command as the single source of an operation's identity.</p>
        </Reveal>
        <Reveal summary="Q: How do you serialize commands for a job queue — and what's the versioning trap?">
          <p>Persist a payload (type + args as JSON), not Java serialization of behavior; a registry maps type →
            handler on the consumer side (Day 31's registry!). Trap: commands outlive deployments — v2 code must
            still understand v1 payloads in the queue. Schema-evolve like an API, because it IS one.</p>
        </Reveal>
        <Reveal summary="Q: Undo with MULTIPLE users editing the same document — does the two-stack model survive?">
          <p>No — naive global undo would revert OTHER people's work. Real collaborative editors use per-user
            undo over operational transforms/CRDTs: "undo MY last operation, transformed against everyone
            else's since." Knowing the simple model's boundary is worth more than pretending it scales.</p>
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
        <strong>Day 33 complete?</strong> Homework: build the smart-home brain.
        <C> interface Command {'{'} void execute(); void undo(); {'}'}</C>; receivers <C>Light</C> (on/off/dim 0–100)
        and <C>Thermostat</C> (setTemp); commands <C>DimLight(light, level)</C> — undo restores the PREVIOUS
        level (snapshot it at execute!), <C>SetTemp(thermostat, t)</C> likewise, and
        <C> MacroCommand(List&lt;Command&gt;)</C> with reverse-order undo. Wire a <C>CommandHistory</C> (two
        stacks, redo-clearing) and a main: run a GoodNight macro (dim 10 + temp 19), undo it, redo it, then run
        a new command and PROVE redo is empty. Bonus: make one command throw mid-macro and roll back the
        executed prefix.
        <br /><br />
        Next: <strong>Day 34 — State</strong>: Strategy's twin with a soul — objects whose behavior CHANGES as
        their lifecycle advances, and the end of the giant status-switch. Day 19's order machine returns,
        all grown up.
      </div>
    </div>
  )
}
