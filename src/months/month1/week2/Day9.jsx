import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: Step-through sequence animator ============ */
const PARTS = ['👤 you', 'm: Member', 'lib: Library', 'b: Book']
const STEPS = [
  { from: 0, to: 1, kind: 'call', label: 'borrow("Dune")',
    explain: 'The actor (you, the user) starts the scene by calling borrow() on the Member object. Every sequence diagram begins with one trigger like this.',
    java: 'member.borrow("Dune");' },
  { from: 1, to: 2, kind: 'call', label: 'checkout(this, "Dune")',
    explain: 'Member forwards the request to Library — a solid arrow with a filled head = a normal synchronous method call. Member now WAITS for the answer.',
    java: 'Book b = library.checkout(this, "Dune");   // inside Member.borrow' },
  { from: 2, to: 2, kind: 'self', label: 'findBook("Dune")',
    explain: 'Library calls a method on ITSELF — a self-message, drawn as a small arrow looping back to its own lifeline. In code: a private helper call.',
    java: 'Book b = this.findBook(title);             // inside Library.checkout' },
  { from: 2, to: 3, kind: 'call', label: 'markBorrowed(m)',
    explain: 'Library asks the Book object to mark itself as borrowed. Notice the call DEPTH: you → Member → Library → Book. The activation bars stack exactly like the Java call stack.',
    java: 'boolean ok = b.markBorrowed(member);       // inside Library.checkout' },
  { from: 3, to: 2, kind: 'return', label: 'true',
    explain: 'Book answers back — a DASHED arrow = a return. Returns flow in the opposite direction of the call, and the callee\'s activation bar ends.',
    java: 'return true;                               // inside Book.markBorrowed' },
  { from: 2, to: 1, kind: 'return', label: 'b (the Book)',
    explain: 'Library returns the Book to Member. The scene is complete: read top to bottom, you just watched one full use case — "member borrows a book".',
    java: 'return b;                                  // inside Library.checkout' },
]

function SeqAnimator() {
  const [step, setStep] = useState(-1) // -1 = nothing shown yet
  const cur = step >= 0 ? STEPS[step] : null

  function arrowRow(s, i) {
    const state = i < step ? 'past' : i === step ? 'current' : 'future'
    const color = state === 'current' ? 'var(--blue)' : '#666'
    if (s.kind === 'self') {
      return (
        <div key={i} style={{ position: 'relative', height: 32, opacity: state === 'future' ? 0 : 1, zIndex: 1 }}>
          <div style={{
            position: 'absolute', left: `${s.from * 25 + 12.5}%`, transform: 'translateX(5px)',
            fontFamily: 'IBM Plex Mono', fontSize: 11.5, background: '#fff', padding: '3px 7px',
            border: `1.5px solid ${state === 'current' ? 'var(--blue)' : 'var(--line)'}`,
            borderRadius: 7, color, fontWeight: state === 'current' ? 700 : 400,
          }}>↩ {s.label}</div>
        </div>
      )
    }
    const li = Math.min(s.from, s.to)
    const w = Math.abs(s.from - s.to)
    const rtl = s.to < s.from
    return (
      <div key={i} style={{ position: 'relative', height: 38, opacity: state === 'future' ? 0 : 1, zIndex: 1 }}>
        <div style={{ position: 'absolute', left: `${li * 25 + 12.5}%`, width: `${w * 25}%` }}>
          <div style={{
            textAlign: 'center', fontFamily: 'IBM Plex Mono', fontSize: 11.5, color,
            fontWeight: state === 'current' ? 700 : 400, background: '#FFFFFFcc', borderRadius: 4,
          }}>{s.label}</div>
          <div style={{ borderTop: `2px ${s.kind === 'return' ? 'dashed' : 'solid'} ${color}`, position: 'relative' }}>
            <span style={{ position: 'absolute', [rtl ? 'left' : 'right']: -3, top: -10, color, fontSize: 13 }}>
              {rtl ? '◀' : '▶'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one scene, played message by message</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
          disabled={step >= STEPS.length - 1}>
          {step < 0 ? '▶ play first message' : 'next message →'}
        </button>
        <button className="ghost act" onClick={() => setStep((s) => Math.max(s - 1, -1))}>← back</button>
        <button className="ghost act" onClick={() => setStep(-1)}>reset</button>
      </div>
      <div style={{ position: 'relative', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 0 6px', background: '#fff' }}>
        {/* participant boxes */}
        <div style={{ display: 'flex', position: 'relative', zIndex: 1, marginBottom: 10 }}>
          {PARTS.map((p, i) => (
            <div key={p} style={{ width: '25%', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                fontFamily: 'IBM Plex Mono', fontSize: 12, border: '2px solid var(--ink)', background: '#fff',
                borderRadius: 6, padding: '4px 8px', textDecoration: i === 0 ? 'none' : 'underline',
              }}>{p}</div>
            </div>
          ))}
        </div>
        {/* lifelines */}
        {PARTS.map((p, i) => (
          <div key={p} style={{
            position: 'absolute', top: 44, bottom: 8, left: `${i * 25 + 12.5}%`,
            borderLeft: '2px dashed #d8d5ca', zIndex: 0,
          }} />
        ))}
        {/* messages */}
        {STEPS.map((s, i) => arrowRow(s, i))}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {cur ? (
          <div>
            <div>🎬 <b>Message {step + 1}/{STEPS.length}:</b> {cur.explain}</div>
            <div style={{ marginTop: 6, fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>Java: {cur.java}</div>
          </div>
        ) : (
          <span>🎬 Press <b>play</b> and watch the scene unfold downward — time flows top to bottom.</span>
        )}
      </div>
    </div>
  )
}

/* ============ Interactive 2: Put the messages in order ============ */
const ORDER_CORRECT = [
  'cart.checkout()',
  'stock.reserve(items)',
  'return ok ┄┄▶ cart',
  'payment.charge(total)',
  'return receipt ┄┄▶ cart',
  'email.sendConfirmation(receipt)',
]
const ORDER_SHUFFLED = [
  'payment.charge(total)',
  'return receipt ┄┄▶ cart',
  'cart.checkout()',
  'email.sendConfirmation(receipt)',
  'stock.reserve(items)',
  'return ok ┄┄▶ cart',
]

function OrderGame() {
  const [placed, setPlaced] = useState([])
  const [mistakes, setMistakes] = useState(0)
  const [shake, setShake] = useState(null)
  const done = placed.length === ORDER_CORRECT.length

  function pick(msg) {
    if (placed.includes(msg)) return
    if (msg === ORDER_CORRECT[placed.length]) {
      setPlaced((p) => [...p, msg])
    } else {
      setMistakes((m) => m + 1)
      setShake(msg)
      setTimeout(() => setShake(null), 350)
    }
  }
  function reset() { setPlaced([]); setMistakes(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · scenario: "user checks out the shopping cart" — build the diagram top-down</div>
      <p style={{ fontSize: 14.5, marginBottom: 10 }}>
        The six messages below are <b>shuffled</b>. Click them in the order they would appear on the diagram,
        top to bottom. Rule to remember: a call's <b>return</b> comes back before the caller moves on.
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {ORDER_SHUFFLED.map((msg) => {
          const used = placed.includes(msg)
          return (
            <button key={msg} className="ghost act"
              style={{
                fontSize: 12, padding: '6px 10px', fontFamily: 'IBM Plex Mono',
                opacity: used ? 0.3 : 1,
                ...(shake === msg ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}),
              }}
              onClick={() => pick(msg)} disabled={used}>
              {msg}
            </button>
          )
        })}
      </div>
      <div className="heap">
        {placed.length === 0 ? (
          <div className="empty">Your diagram is empty. Which message starts the scene? ↑</div>
        ) : (
          placed.map((msg, i) => (
            <div key={msg} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '3px 6px' }}>
              {i + 1}. {msg.includes('return') ? '┄┄▶ ' : '──▶ '}{msg}
            </div>
          ))
        )}
      </div>
      <div className="statbar">
        {done
          ? <span>🎉 <b>Scene complete!</b> Mistakes: {mistakes}. {mistakes === 0 ? 'Perfect — you think in sequences now.' : 'Replay and aim for zero.'} <button className="ghost act" style={{ fontSize: 12, padding: '4px 9px', marginLeft: 8 }} onClick={reset}>play again</button></span>
          : <span>📐 <span>placed {placed.length}/{ORDER_CORRECT.length} · wrong clicks: {mistakes}</span></span>}
      </div>
    </div>
  )
}

/* ============ Interactive 3: Fragment picker (loop / opt / alt) ============ */
const FRAG_DATA = {
  opt: {
    label: 'opt — a single if',
    java: `<span class="kw">if</span> (stock > <span class="num">0</span>) {
    warehouse.reserve(item);   <span class="cm">// happens ONLY when condition is true</span>
}`,
    uml: `  ╔═ opt ══[ stock > 0 ]══════════════════╗
  ║  cart ──── reserve(item) ──▶ warehouse ║
  ╚════════════════════════════════════════╝`,
    story: 'opt = "optional". One box, one guard condition in [brackets]. The messages inside happen only if the guard is true — a plain if with no else.',
  },
  alt: {
    label: 'alt — if / else',
    java: `<span class="kw">if</span> (paymentOk) {
    shipper.ship(order);       <span class="cm">// branch 1</span>
} <span class="kw">else</span> {
    cart.cancel(order);        <span class="cm">// branch 2</span>
}`,
    uml: `  ╔═ alt ══[ paymentOk ]══════════════════╗
  ║  cart ──── ship(order) ──▶ shipper     ║
  ╟┄┄┄┄┄┄┄[ else ]┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╢
  ║  cart ──── cancel(order) ──▶ cart      ║
  ╚════════════════════════════════════════╝`,
    story: 'alt = "alternatives". One box split by a dashed line into compartments — exactly one compartment runs, chosen by the guards. This is if/else (add more compartments for else-if).',
  },
  loop: {
    label: 'loop — for / while',
    java: `<span class="kw">for</span> (Item i : cartItems) {
    invoice.addLine(i);        <span class="cm">// repeated for every item</span>
}`,
    uml: `  ╔═ loop ══[ for each item in cart ]═════╗
  ║  cart ──── addLine(i) ──▶ invoice      ║
  ╚════════════════════════════════════════╝`,
    story: 'loop = repetition. The guard says how many times ("for each item", "while retries < 3"). Everything inside the frame repeats — one frame instead of drawing 50 identical arrows.',
  },
}
const FRAG_KEYS = ['opt', 'alt', 'loop']

function FragmentPicker() {
  const [frag, setFrag] = useState('opt')
  const d = FRAG_DATA[frag]
  return (
    <div className="panel">
      <div className="ptitle">Live demo · Java control flow ⇄ diagram fragment</div>
      <div className="modbtns">
        {FRAG_KEYS.map((k) => (
          <button key={k} className={frag === k ? 'on' : ''} onClick={() => setFrag(k)}>
            {FRAG_DATA[k].label}
          </button>
        ))}
      </div>
      <div className="factory-grid">
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>JAVA</div>
          <Code html={d.java} />
        </div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>ON THE DIAGRAM</div>
          <Code html={d.uml} />
        </div>
      </div>
      <div className="modexplain">{d.story}</div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'Class diagram vs sequence diagram — what is the core difference?',
    o: ['Class = small systems, sequence = big systems', 'Class = structure (what exists & how it connects), sequence = behavior of ONE scenario over time', 'They show the same thing in different styles', 'Sequence diagrams replace code'], a: 1,
    e: 'Class diagram = the cast and their relationships (timeless). Sequence diagram = the script of one scene: who calls whom, in what order, for one specific use case.',
    w: { 0: 'System size is irrelevant — both diagrams serve systems of any size.',
         2: 'They answer different questions: structure vs behavior-over-time.',
         3: 'Diagrams plan and explain code — they never replace it.' },
    r: { id: 's1', label: 'Section 1 — cast list vs script' } },
  { q: 'In which direction does time flow in a sequence diagram?',
    o: ['Left to right', 'Right to left', 'Top to bottom', 'Along the arrows only'], a: 2,
    e: 'Downward, always. A message lower on the page happens later. That is why you "read the scene" top to bottom.',
    w: { 0: 'Left-right is just participant placement — it carries no time meaning.',
         1: 'Same — horizontal position is layout, not chronology.',
         3: 'Arrows show WHO talks to whom; height shows WHEN.' },
    r: { id: 's2', label: 'Section 2 — the stage' } },
  { q: 'What is the dashed vertical line below each participant called, and what does it mean?',
    o: ['A dependency — the participant uses time', 'A lifeline — the participant exists during this period', 'A return arrow drawn vertically', 'A lock on the object'], a: 1,
    e: 'The lifeline shows the object existing through the scene. The thin rectangles ON the lifeline (activation bars) show when it is actively running a method.',
    w: { 0: 'Dependencies are dashed arrows in CLASS diagrams — here dashed-vertical means existence.',
         2: 'Returns are HORIZONTAL dashed arrows.',
         3: 'Locks are a Month 4 concept, not sequence notation.' },
    r: { id: 's2', label: 'Section 2 — lifelines & activation bars' } },
  { q: 'A solid arrow with a filled head vs a dashed arrow — which is which?',
    o: ['Solid = return, dashed = call', 'Solid = synchronous call, dashed = return (the reply)', 'Both are calls; dashed is slower', 'Dashed means static method'], a: 1,
    e: 'Solid + filled head = a synchronous method call (the caller waits). Dashed + open head = the return coming back. Calls go out, dashed answers come home.',
    w: { 0: 'Exactly inverted — the most common memorization slip. Solid goes out, dashed comes home.',
         2: 'Line style is meaning, not speed.',
         3: 'static appears nowhere in sequence arrow notation.' },
    r: { id: 's3', label: 'Section 3 — the three arrows' } },
  { q: 'Participants are usually written like "m: Member" and underlined. Why the colon and underline?',
    o: ['Decoration only', 'It marks an OBJECT (instance) named m of class Member — sequence diagrams star objects, not classes', 'It means the member is private', 'It means Member is abstract'], a: 1,
    e: 'Sequence diagrams show living objects at runtime: name: Type, underlined. The class diagram has the class Member once; a sequence can star two different Member objects (m1, m2) side by side.',
    w: { 0: 'Every mark in UML carries meaning — underline = instance is the same convention as object diagrams.',
         2: 'Visibility symbols (- +) mark members in class boxes, not participants.',
         3: 'Abstract is italics, in class diagrams — and abstract types can\'t even be instantiated as participants.' },
    r: { id: 's2', label: 'Section 2 — participants are objects' } },
  { q: 'An arrow that loops from a lifeline back to the SAME lifeline means…',
    o: ['A bug in the diagram', 'A self-message: the object calls one of its own methods', 'The object is being deleted', 'An infinite loop'], a: 1,
    e: 'A self-message = this.someHelper(). The object talks to itself — very common, e.g. Library calling its own findBook() before answering.',
    w: { 0: 'Perfectly standard notation, not an error.',
         2: 'Destruction is the ✕ at a lifeline\'s end.',
         3: 'One loop-back = one call; recursion would be NESTED activation bars.' },
    r: { id: 's3', label: 'Section 3 — self-messages' } },
  { q: 'You need to show "if paymentOk → ship, else → cancel". Which fragment frame do you use?',
    o: ['opt', 'loop', 'alt', 'ref'], a: 2,
    e: 'alt = alternatives = if/else: one frame split into compartments, each with its guard, exactly one runs. opt is for a lone if with no else; loop is for repetition.',
    w: { 0: 'opt has ONE compartment — no else branch possible.',
         1: 'loop repeats; it doesn\'t choose between branches.',
         3: 'ref embeds another diagram — nothing to do with branching.' },
    r: { id: 's6', label: 'Section 6 — fragments' } },
  { q: 'In an interview, the best scope for one sequence diagram is…',
    o: ['Every feature of the system in one giant diagram', 'One scenario (e.g. "user books a ticket"), happy path first, 4–6 participants', 'Only two objects, to keep it tiny', 'All getters and setters included'], a: 1,
    e: 'One diagram = one scenario. Draw the happy path first, add an alt frame for the key failure case if asked. A readable 6-message scene beats a wall of arrows every time.',
    w: { 0: 'Whole-system behavior in one sequence = unreadable spaghetti; that\'s what the class diagram is for.',
         2: 'Two objects is usually too little to show the design\'s flow.',
         3: 'Accessor calls are noise here just as in class boxes.' },
    r: { id: 's8', label: 'Section 8 — the interview recipe' } },
]

/* ============ The page ============ */
export default function Day9() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 2 · Day 9</div>
        <h1>UML Sequence Diagrams:<br />The Script of One Scene</h1>
        <p>Yesterday's class diagram showed the <em>cast</em> — who exists and how they're related. Today's
           sequence diagram is the <em>script</em>: for one scenario, who calls whom, in exactly what order.
           Together they are the complete interview whiteboard kit. Press play and click everything.</p>
        <div className="chips">
          {['lifelines', 'messages', 'activation bars', 'returns', 'self-message', 'alt / opt / loop'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The cast list vs the script</h2>
        <p>Think of a <strong>play in a theater</strong>. Before the show, you read two papers:</p>
        <ul>
          <li><strong>The cast list</strong> (= class diagram, Day 8): every character, their role, who is related to
            whom. No time in it — it is true for the whole play.</li>
          <li><strong>The script of a scene</strong> (= sequence diagram, today): "JULIET speaks to NURSE. NURSE goes
            to ROMEO…" — one scene, line by line, <strong>in order</strong>. Time matters. Order matters.</li>
        </ul>
        <p>Code has the same two views. <C>class Library {'{'} ... {'}'}</C> is structure. But "what happens when a
          member borrows a book?" is a <strong>story over time</strong>: <C>borrow()</C> calls <C>checkout()</C>,
          which calls <C>findBook()</C>, then <C>markBorrowed()</C>… A sequence diagram is that story, drawn.</p>
        <Note><strong>One diagram = one scenario.</strong> "Borrow a book" is one diagram. "Return a book" is another.
          You never draw the whole system's behavior at once — only one scene at a time.</Note>
        <Reveal summary="When do interviewers ask for a sequence diagram? Click to reveal.">
          <p>Usually right after your class diagram, as: <em>"walk me through what happens when the user pays"</em>.
            Even if you never draw a formal frame, narrating in sequence-diagram order — actor → object → object,
            calls down, returns back — makes you sound (and think) like a senior engineer. In Month 3 you will draw
            one for every classic problem (Parking Lot entry, BookMyShow seat booking…).</p>
        </Reveal>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The stage: participants and lifelines</h2>
        <p>A sequence diagram has a simple skeleton — learn the four parts:</p>
        <Code html={`   👤            ┌────────────┐      ┌──────────────┐      ┌───────────┐
  you           │ <u>m: Member</u>  │      │ <u>lib: Library</u> │      │ <u>b: Book</u>   │   ① PARTICIPANTS
   │            └──────┬─────┘      └──────┬───────┘      └─────┬─────┘      (across the top)
   │                   ┆                   ┆                    ┆
   │                   ┆ ← ② LIFELINES: dashed = "I exist during this scene"
   │  borrow("Dune")   ┆                   ┆                    ┆
   │ ─────────────────▶█                   ┆                    ┆
   │                   █ ← ③ ACTIVATION BAR: thin solid bar =   ┆
   │                   █      "I am busy running a method now"  ┆
   │                   █  checkout(...)    ┆                    ┆
   │                   █ ─────────────────▶█  ← ④ MESSAGE: a method call,
   │                   █                   █       arrow points at the callee`} />
        <ol>
          <li><strong>Participants</strong> sit in boxes across the top. They are <strong>objects, not classes</strong> —
            written <C><u>m: Member</u></C> (name, colon, type, underlined). The user is drawn as a stick figure
            (here: 👤), called an <strong>actor</strong>.</li>
          <li><strong>Lifelines</strong> — the dashed vertical line under each participant. Going down = time passing.</li>
          <li><strong>Activation bars</strong> — the thin rectangles on a lifeline showing <em>when that object is
            actively executing</em>. A bar starts when a call arrives, ends when the method returns.</li>
          <li><strong>Messages</strong> — horizontal arrows between lifelines. A message = a method call.</li>
        </ol>
        <Warn><strong>The #1 rule: time flows DOWNWARD.</strong> Lower on the page = later. There is no going back up.
          If you find yourself wanting to draw an arrow upward to "earlier", your scenario is out of order.</Warn>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The three arrows you'll actually use</h2>
        <table className="matrix">
          <thead>
            <tr><th>arrow</th><th>name</th><th>in Java</th></tr>
          </thead>
          <tbody>
            <tr><td><C>──────▶</C> solid, filled head</td><td>synchronous call</td><td><C>lib.checkout(...)</C> — caller <strong>waits</strong> for the answer</td></tr>
            <tr><td><C>┄┄┄┄┄▶</C> dashed, open head</td><td>return (reply)</td><td><C>return b;</C> — the answer travels back</td></tr>
            <tr><td><C>↩</C> loop to own lifeline</td><td>self-message</td><td><C>this.findBook(...)</C> — calling my own method</td></tr>
          </tbody>
        </table>
        <p>And here is the insight that makes sequence diagrams click: <strong>nested activation bars ARE the call
          stack</strong> (Day 1's stack, drawn sideways!). When Member calls Library, Member's bar stays alive
          (waiting) while Library's bar runs. When Library calls Book, three bars are stacked. Returns pop them
          off, last-in-first-out — exactly like stack frames.</p>
        <Reveal summary="Bonus arrows you may see in the wild — click to reveal.">
          <p><strong>Async message</strong> (solid line, <em>open</em> head): fire-and-forget — the caller does NOT
            wait (think sending to a message queue; relevant in Month 4 concurrency). <strong>«create»</strong>:
            an arrow pointing at a participant box drawn <em>lower down</em>, meaning <C>new</C> — the object is born
            mid-scene. <strong>Destruction</strong>: a big ✕ at the bottom of a lifeline — the object is gone (in Java:
            becomes unreachable, GC takes it — Day 6). Know they exist; the three in the table cover 95% of interviews.</p>
        </Reveal>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🎬 Play: One scene, message by message</h2>
        <p>This is the "member borrows a book" scenario from the library you drew yesterday. Press
          <strong> play</strong> repeatedly. At each step, read the explanation AND the matching Java line —
          the diagram and the code are the same story in two languages. <strong>Predict</strong> each next message
          before pressing.</p>
        <SeqAnimator />
        <Good><strong>What you should notice:</strong> ① Time only moves down — each press adds a message BELOW the
          last. ② Every solid call eventually gets a dashed return, in reverse order (the call stack unwinding).
          ③ The self-message <C>findBook</C> stays on one lifeline — objects talk to themselves all the time.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🧩 Play: Shuffle — you rebuild the scene</h2>
        <p>Now the reverse skill: you get the messages of a "checkout the shopping cart" scenario, shuffled.
          Rebuild the diagram by clicking them in order. Remember the unwinding rule from the animator:
          <strong> a return comes back before the caller makes its next call.</strong></p>
        <OrderGame />
        <Good><strong>What you should notice:</strong> ① The trigger (<C>cart.checkout()</C>) must come first — every
          scene starts with one entry call. ② <C>reserve</C>'s return arrives before <C>charge</C> starts: the cart
          waits for each answer (synchronous calls). ③ The last message has no return shown — trivial returns
          (void, obvious) are often left out to reduce noise.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔀 Fragments: drawing if / else / loops</h2>
        <p>Real scenarios branch and repeat. UML wraps a region of the diagram in a labeled <strong>frame</strong>
          called a <em>combined fragment</em>. There are three you need — and they map one-to-one to Java keywords
          you already know. Click each:</p>
        <FragmentPicker />
        <Good><strong>What you should notice:</strong> ① The guard condition always sits in
          <C>[square brackets]</C> — that's the <C>if (...)</C> condition. ② <C>alt</C> is the only frame with an
          internal dashed divider: one compartment per branch. ③ These frames nest, just like Java blocks —
          a <C>loop</C> can contain an <C>alt</C>.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>From code to diagram — the full translation</h2>
        <p>Let's translate one real method, line by line. The Java:</p>
        <Code html={`<span class="cm">// inside class Cart</span>
<span class="kw">public</span> Receipt checkout() {
    <span class="kw">for</span> (Item i : items) {                 <span class="cm">// ── loop frame</span>
        stock.reserve(i);                   <span class="cm">// call inside the loop</span>
    }
    <span class="kw">if</span> (total > <span class="num">0</span>) {                       <span class="cm">// ── opt frame</span>
        Receipt r = payment.charge(total);  <span class="cm">// call + return</span>
        <span class="kw">return</span> r;
    }
    <span class="kw">return</span> Receipt.empty();
}`} />
        <p>And the same method as a scene:</p>
        <Code html={`  <u>c: Cart</u>            <u>s: Stock</u>           <u>p: Payment</u>
     ┆                   ┆                   ┆
  ╔═ loop ══[ for each item ]═══════════╗   ┆
  ║  █  reserve(i)      ┆               ║   ┆
  ║  █ ────────────────▶█               ║   ┆
  ╚═════════════════════════════════════╝   ┆
     ┆                   ┆                   ┆
  ╔═ opt ══[ total > 0 ]═══════════════════════════╗
  ║  █  charge(total)   ┆               ┆          ║
  ║  █ ─────────────────────────────────▶█         ║
  ║  █ ◀┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ █  r      ║
  ╚═════════════════════════════════════════════════╝`} />
        <p>Read the mapping once more, slowly: <strong>every method call in the code = one arrow. Every block
          (<C>for</C>/<C>if</C>) = one frame. Nesting in code = nesting of frames.</strong> If you can read Java,
          you can already read sequence diagrams — it is the same tree, drawn on its side.</p>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>How to draw one in an interview (the recipe)</h2>
        <ol>
          <li><strong>Pick ONE scenario</strong>, and say it as a sentence: "User books one seat for a show."</li>
          <li><strong>List 4–6 participants</strong>: the actor + the objects from your class diagram that this
            scenario touches. More than ~6 → your scene is too big, split it.</li>
          <li><strong>Draw the happy path only</strong> — the version where everything works. Trigger call at the
            top-left, then calls and returns in time order.</li>
          <li><strong>Then add ONE alt/opt frame</strong> for the most interesting failure ("seat already taken")
            — usually only when the interviewer asks "what if…".</li>
          <li><strong>Narrate as you draw.</strong> "The controller asks the BookingService, which first locks the
            seat, then charges payment…" — the narration is what is really being graded.</li>
        </ol>
        <h3>🪤 Common traps</h3>
        <ul>
          <li><strong>Classes instead of objects</strong> — participants are <C><u>m: Member</u></C>, not the class
            box from Day 8. Two members in one scene? Two participants: <C>m1</C>, <C>m2</C>.</li>
          <li><strong>Arrows pointing at nobody</strong> — every call arrow must land on a participant's lifeline,
            and that participant must own that method in your class diagram. The two diagrams must agree!</li>
          <li><strong>Drawing every return</strong> — clutters the scene. Show returns that carry data
            (<C>r</C>, <C>b</C>); skip obvious void returns.</li>
          <li><strong>Skipping the actor</strong> — start scenes from 👤. "Who started this?" is the first thing a
            reader asks.</li>
          <li><strong>One mega-diagram for the whole system</strong> — that is what the class diagram is for.
            Sequence = one scenario, always.</li>
        </ul>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Purpose:</strong> ONE scenario's behavior over time. Class diagram = cast; sequence = script of a scene.</li>
          <li><strong>Time flows down.</strong> Participants on top as <C><u>name: Type</u></C> (objects!); actor 👤 for the user.</li>
          <li><strong>Lifeline</strong> = dashed vertical (I exist). <strong>Activation bar</strong> = thin rectangle (I am running). Nested bars = the call stack.</li>
          <li><strong>Arrows:</strong> solid filled ▶ = sync call (caller waits) · dashed ▶ = return · loop-back = self-message · open head = async (fire & forget).</li>
          <li><strong>«create»</strong> arrow → participant born mid-scene; ✕ at lifeline bottom = destroyed.</li>
          <li><strong>Fragments:</strong> <C>opt [guard]</C> = if · <C>alt</C> + dashed divider = if/else · <C>loop [guard]</C> = for/while. Frames nest like Java blocks.</li>
          <li><strong>Mapping:</strong> method call = arrow · code block = frame · return = dashed arrow back, LIFO order.</li>
          <li><strong>Interview recipe:</strong> 1 scenario → 4–6 participants → happy path → one alt on request → narrate while drawing.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Synchronous vs asynchronous message — the arrowhead difference?">
          <p>Sync = solid line, <strong>FILLED</strong> head (caller blocks). Async = solid line,
            <strong> OPEN</strong> head (fire and forget — caller continues). Return = dashed + open head. The
            filled-vs-open head is a one-pixel detail examiners genuinely grade.</p>
        </Reveal>
        <Reveal summary="Q: Activation bar vs lifeline — precise definitions?">
          <p>Lifeline = the dashed vertical: "this participant EXISTS during this span." Activation bar
            (execution specification, its formal name) = the thin rectangle ON the lifeline: "it is actively
            EXECUTING now." Nested bars on one lifeline = re-entrant calls — the call stack drawn sideways.</p>
        </Reveal>
        <Reveal summary="Q: Name the fragment for: if / if-else / loop / reference to another diagram.">
          <p><C>opt</C> (single guard) · <C>alt</C> (compartments with guards, one runs, dashed dividers) ·
            <C> loop</C> (guard says how often) · <C>ref</C> (a frame that "includes" another sequence diagram —
            the function call of diagrams). Bonus pair: <C>par</C> = parallel regions, <C>break</C> = early
            exit.</p>
        </Reveal>
        <Reveal summary="Q: How do you draw creating and destroying an object mid-scene?">
          <p>Creation: a (often dashed) arrow labeled <C>«create»</C> pointing at the new participant's box drawn
            LOWER on the page — its lifeline starts at birth, not at the top. Destruction: a big ✕ terminating
            the lifeline (in Java, semantic only — GC, no destructors).</p>
        </Reveal>
        <Reveal summary="Q: Sequence diagram vs communication diagram?">
          <p>Same information (interaction), different emphasis: sequence = TIME explicit (vertical axis),
            communication (old name: collaboration) diagram = LINKS explicit, with messages NUMBERED 1, 1.1, 2…
            to recover ordering. UML tools can convert between them mechanically — a classic theory question.</p>
        </Reveal>
        <Reveal summary="Q: Must every call show a return arrow?">
          <p>No — returns are optional where obvious (void, trivial). Show them when the RESULT matters to the
            story (the Book object coming back) or when omission would confuse activation-bar nesting.
            Diagrams optimize for communication, not for completeness.</p>
        </Reveal>
        <Reveal summary="Q: What's a 'found message'?">
          <p>A message whose sender is outside the diagram's scope — drawn from a filled dot into the first
            participant. It's the standard way to start a scene without modeling the whole outside world
            ("a request arrives"). Its mirror (arrow to a dot) is a lost message.</p>
        </Reveal>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 9 complete?</strong> Homework: on paper, draw the sequence diagram for your Day 7
        <C> Notifier</C> homework scenario — "user sends a notification": 👤 → <C>n: Notifier</C> →
        <C>c: EmailChannel</C>, including the return, then a second version wrapped in an
        <C>alt [channel is set] / [else]</C> frame that logs an error in the else branch. Check: objects underlined,
        time downward, every call lands on a real method. Bonus: also draw "user switches channel then sends".
        <br /><br />
        Next: <strong>Day 10 — Requirements → Entities</strong>: the final Week 2 skill — reading a plain-English
        problem statement and extracting the classes, relationships and diagrams from it. Everything this week
        comes together.
      </div>
    </div>
  )
}
