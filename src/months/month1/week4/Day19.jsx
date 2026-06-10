import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: Magic string chaos ============ */
const VALID_STATUSES = ['PLACED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']

function MagicStringChaos() {
  const [world, setWorld] = useState('string')
  const [input, setInput] = useState('SHIPPPED')
  const [log, setLog] = useState([])
  const [bugs, setBugs] = useState(0)

  function setStatus() {
    const v = input.trim().toUpperCase()
    if (VALID_STATUSES.includes(v)) {
      setLog((l) => [...l.slice(-2), `order.setStatus("${v}")  → accepted ✓ (you got lucky this time)`])
    } else {
      setBugs((b) => b + 1)
      setLog((l) => [...l.slice(-2), `order.setStatus("${v}")  → ACCEPTED ✓✓ … wait, WHAT? 💣 "${v}" is now in the database. The shipping module will meet it at 2 a.m.`])
    }
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · set an order's status — in two type systems</div>
      <div className="modbtns">
        <button className={world === 'string' ? 'on' : ''} onClick={() => setWorld('string')}>🪄 magic-string world</button>
        <button className={world === 'enum' ? 'on' : ''} onClick={() => setWorld('enum')}>🛡️ enum world</button>
      </div>
      {world === 'string' ? (
        <div>
          <Code html={`<span class="kw">private</span> String status;                  <span class="cm">// any of ∞ possible strings…</span>
<span class="kw">public void</span> setStatus(String s) { <span class="kw">this</span>.status = s; }   <span class="cm">// …all welcome 🙃</span>`} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <input className="txt" value={input} onChange={(e) => setInput(e.target.value)} aria-label="status to set" />
            <button className="act" onClick={setStatus}>order.setStatus(…)</button>
          </div>
          <div className="statbar" style={{ display: 'block' }}>
            {log.length === 0
              ? <span>Try the pre-typed value — read it carefully. Then try "shipped", "Paid ", "CANCELED" (one L)…</span>
              : log.map((l, i) => <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{l}</div>)}
            <div style={{ marginTop: 6 }}>💣 lurking bugs accepted into the system: <b>{bugs}</b></div>
          </div>
        </div>
      ) : (
        <div>
          <Code html={`<span class="kw">public enum</span> OrderStatus { PLACED, PAID, SHIPPED, DELIVERED, CANCELLED }

<span class="kw">private</span> OrderStatus status;             <span class="cm">// exactly 5 possible values. Ever.</span>
order.setStatus(OrderStatus.SHIPPPED);  <span class="cm">// ❌ COMPILE ERROR: cannot find symbol</span>`} />
          <p style={{ fontSize: 14, marginBottom: 8 }}>No keyboard here — the only values that <em>exist</em> are:</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {VALID_STATUSES.map((s) => (
              <button key={s} className="ghost act" style={{ fontSize: 12, fontFamily: 'IBM Plex Mono' }}
                onClick={() => setLog((l) => [...l.slice(-2), `order.setStatus(OrderStatus.${s})  → ✅ valid by construction`])}>
                OrderStatus.{s}
              </button>
            ))}
          </div>
          <div className="statbar" style={{ display: 'block', background: '#EAF7EF' }}>
            {log.length === 0
              ? <span>Click any value. Notice you cannot even EXPRESS an invalid status — the typo bug is extinct, at compile time.</span>
              : log.map((l, i) => <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{l}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 2: The status state machine ============ */
const TRANSITIONS = {
  PLACED: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

function StateMachine() {
  const [state, setState] = useState('PLACED')
  const [msg, setMsg] = useState(null)

  function tryMove(to) {
    if (TRANSITIONS[state].includes(to)) {
      setState(to)
      setMsg({ ok: true, text: `${state} → ${to} ✓ legal transition` })
    } else {
      setMsg({ ok: false, text: `💥 IllegalStateException: cannot go ${state} → ${to}. The ENUM enforces the business flow — no code path can ship a cancelled order.` })
    }
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the order lifecycle, guarded by an enum with behavior</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
        {['PLACED', 'PAID', 'SHIPPED', 'DELIVERED'].map((s, i) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <span style={{ color: '#9aa3b5' }}>──▶</span>}
            <span className="chip" style={state === s ? { background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)' } : {}}>{s}</span>
          </span>
        ))}
        <span style={{ color: '#9aa3b5', marginLeft: 8 }}>╲▶</span>
        <span className="chip" style={state === 'CANCELLED' ? { background: 'var(--red)', color: '#fff', borderColor: 'var(--red)' } : {}}>CANCELLED</span>
      </div>
      <p style={{ fontSize: 14, marginBottom: 8 }}>Current: <b>{state}</b>. Try every button — including the illegal ones:</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {VALID_STATUSES.map((s) => (
          <button key={s} className="act" style={{ fontSize: 12.5, padding: '6px 10px' }} onClick={() => tryMove(s)}
            disabled={s === state}>
            moveTo({s})
          </button>
        ))}
        <button className="ghost act" onClick={() => { setState('PLACED'); setMsg(null) }}>new order</button>
      </div>
      {msg && (
        <div className="statbar" style={{ background: msg.ok ? '#EAF7EF' : '#FDECEC' }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{msg.text}</span>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: Exception triage ============ */
const TRIAGE_ITEMS = [
  { code: `try {
    sendInvoice(order);
} catch (Exception e) { }   // "it kept crashing, so…"`,
    a: 'swallow', why: 'The empty catch — the most expensive two characters in Java. The failure happened, but now NOBODY knows: no log, no alert, corrupted data sails on. At minimum log it; ideally let it propagate to someone who can act.' },
  { code: `// finding whether the list has an admin:
try {
    for (User u : users)
        if (u.isAdmin()) throw new FoundIt();
} catch (FoundIt e) { return true; }
return false;`,
    a: 'flow', why: 'Exceptions as control flow: using a fire alarm as a doorbell. Slow (stack traces are expensive), unreadable, and it trains readers to ignore alarms. A plain return inside the loop does the job.' },
  { code: `public User findUser(String id) {
    if (!db.has(id)) return null;   // caller will surely check… right?
    return db.get(id);
}`,
    a: 'null', why: 'Returning null for a failure makes the ERROR invisible and the EXPLOSION distant — the NPE fires three files away (Day 1\'s trap, weaponized). Throw UserNotFoundException, or return Optional<User> to force the caller to decide.' },
  { code: `try (FileReader r = new FileReader("report.csv")) {
    return parse(r);
}   // file auto-closed, success or failure`,
    a: 'fine', why: 'Try-with-resources: anything AutoCloseable declared in the ( ) is closed automatically, even when an exception flies. The modern replacement for fragile finally-close boilerplate. Healthy code.' },
  { code: `catch (SQLException e) {
    log.error("save failed", e);
    throw new OrderSaveFailedException(order.getId(), e);
}`,
    a: 'fine', why: 'Textbook translation: low-level detail (SQLException) becomes a domain exception carrying context (WHICH order) and the original cause chained in. Callers now catch by business meaning, not by vendor.' },
  { code: `try {
    process(order);
} catch (Throwable t) {
    // keep the loop alive no matter what
    continue;
}`,
    a: 'broad', why: 'Catching Throwable swallows OutOfMemoryError, assertion failures — things you CANNOT recover from — and marches on with a corrupted process. Catch the most specific type you can actually handle; let the rest fly.' },
]
const TRIAGE_CHOICES = [
  ['swallow', '🙈 swallowed exception'],
  ['flow', '🎢 exception as control flow'],
  ['null', '🕳️ null instead of failure'],
  ['broad', '🪤 catch too broad'],
  ['fine', '✅ actually fine'],
]

function TriageGame() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= TRIAGE_ITEMS.length
  const cur = TRIAGE_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the exception emergency room — diagnose each patient</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {TRIAGE_ITEMS.length}</b>{score === TRIAGE_ITEMS.length ? ' — failures will never hide from you again.' : '. The two healthy patients fool people — replay.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            🚑 <span>patient {idx + 1} of {TRIAGE_ITEMS.length} · score {score}</span>
          </div>
          <Code html={cur.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')} />
          <div className="modbtns">
            {TRIAGE_CHOICES.map(([k, label]) => (
              <button key={k} className={picked !== null && k === cur.a ? 'on' : ''}
                style={picked !== null && picked === k && k !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
                onClick={() => pick(k)}>
                {label}
              </button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ Correct! ' : '❌ Not quite. '}
              {cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={next}>Next patient →</button>
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
  { q: 'Why is private String status; (holding "PLACED", "PAID"…) worse than an enum?',
    o: ['Strings use more memory', 'Typos compile fine, illegal values flow into the system, the valid set is documented nowhere, and switch can\'t warn about missed cases', 'Strings cannot be compared', 'Enums are faster to type'], a: 1,
    e: 'With a String, "SHIPPPED" is a legal value as far as the compiler cares. The enum makes invalid statuses UNREPRESENTABLE — the bug class goes extinct at compile time.',
    w: { 0: 'Memory difference is negligible — correctness is the prize.',
         2: 'Strings compare fine (with equals) — comparison isn\'t the disease.',
         3: 'Typing effort was never the argument.' },
    r: { id: 's2', label: 'Section 2 — magic strings' } },
  { q: 'A Java enum is really…',
    o: ['A list of int constants like in C', 'A full class: fixed set of instances, but with fields, constructors and methods allowed', 'A kind of String', 'An annotation'], a: 1,
    e: 'Java enums are classes whose only instances are the listed constants. That is why OrderStatus can carry data (labels, fees) and behavior (canMoveTo) — a fixed set of smart objects, not numbered names.',
    w: { 0: 'That\'s C — Java\'s enums are a different species: real objects.',
         2: 'name() RETURNS a String, but the constant itself is an object.',
         3: 'Annotations are metadata — unrelated.' },
    r: { id: 's4', label: 'Section 4 — enums are full classes' } },
  { q: 'Why is storing enum.ordinal() in the database a famous trap?',
    o: ['ordinal() is slow', 'ordinal() is the position in the declaration — reorder or insert a constant and every stored number silently means something else', 'Databases reject integers', 'ordinal() can be negative'], a: 1,
    e: 'Someone inserts REFUNDED in the middle, and every old row\'s 2 now means a different status. Store name() (or a dedicated stable code) — never the position.',
    w: { 0: 'Speed is fine; FRAGILITY is the issue.',
         2: 'Databases store ints happily — too happily, that\'s the trap.',
         3: 'ordinal() is always ≥ 0.' },
    r: { id: 's4', label: 'Section 4 — the ordinal trap' } },
  { q: 'A switch over an enum that handles every constant (with no default) gives you what superpower?',
    o: ['Faster execution', 'When someone adds a new constant, the compiler/IDE flags every switch that no longer covers all cases — a to-do list generated for free', 'Smaller bytecode', 'Automatic logging'], a: 1,
    e: 'Exhaustiveness checking turns "did we update everything for the new status?" from an archaeology project into a list of compile-time errors. (Recall Day 12: switching on a truly fixed set is fine.)',
    w: { 0: 'Speed is identical.',
         2: 'Bytecode size is irrelevant.',
         3: 'No logging is involved — the superpower is the compile-time TODO list.' },
    r: { id: 's4', label: 'Section 4 — exhaustive switch' } },
  { q: 'Which of these should probably NOT be an enum?',
    o: ['Days of the week', 'Order statuses of your own system', 'The list of countries your app ships to (changes with business deals)', 'Chess piece colors'], a: 2,
    e: 'Enums are for sets fixed at COMPILE time. A list that grows by business decision (countries, currencies, plans) belongs in data/config — otherwise every deal needs a re-deploy.',
    w: { 0: 'The week is genuinely frozen — perfect enum.',
         1: 'YOUR statuses change only when YOUR code changes — enum fits.',
         3: 'Chess colors are eternally two.' },
    r: { id: 's4', label: 'Section 4 — when NOT enum' } },
  { q: 'Checked vs unchecked exceptions — the practical difference?',
    o: ['Checked are faster', 'Checked (extends Exception) force callers to catch-or-declare at compile time; unchecked (extends RuntimeException) fly silently until caught', 'Unchecked cannot have messages', 'Checked only exist in tests'], a: 1,
    e: 'Checked = the compiler makes the caller acknowledge the possibility (IOException). Unchecked = programming errors and most domain failures (IllegalArgumentException). Modern Java style leans unchecked for most custom exceptions.',
    w: { 0: 'No speed difference exists.',
         2: 'Both kinds carry messages and causes.',
         3: 'Both exist everywhere, production included.' },
    r: { id: 's6', label: 'Section 6 — the Throwable tree' } },
  { q: 'catch (Exception e) { } — the empty catch — is deadly because…',
    o: ['It fails to compile', 'The failure still happened, but all evidence is destroyed: no log, no alert, and the program continues in a possibly corrupted state', 'It is slow', 'It catches nothing'], a: 1,
    e: 'Swallowing converts a loud, debuggable failure into silent data corruption discovered weeks later. If you truly must ignore, write a comment saying WHY — and log it anyway.',
    w: { 0: 'It compiles perfectly — that\'s what makes it dangerous.',
         2: 'It costs nothing in speed; it costs everything in evidence.',
         3: 'It catches everything — and tells no one.' },
    r: { id: 's9', label: 'Section 9 — the rogues\' gallery' } },
  { q: 'A good custom exception like OrderSaveFailedException(orderId, cause) is valuable because…',
    o: ['Long names look professional', 'Callers can catch by BUSINESS meaning, the message carries the context needed to debug, and the original cause stays chained inside', 'It avoids stack traces', 'It runs faster than SQLException'], a: 1,
    e: 'Translate low-level exceptions into domain terms at boundaries: catch what it MEANS (order save failed, which order), keep the cause for the post-mortem. Day 15\'s DIP, applied to failures.',
    w: { 0: 'Name length is cosmetics; structured CONTEXT is the value.',
         2: 'Stack traces remain (with the cause chained!) — they get better, not avoided.',
         3: 'No speed story — clarity story.' },
    r: { id: 's7', label: 'Section 7 — designing good failures' } },
]

/* ============ The page ============ */
export default function Day19() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 4 · Day 19</div>
        <h1>Enums &amp; Exceptions:<br />Illegal States Impossible, Failures Unmissable</h1>
        <p>Two unsung workhorses of clean Java. Enums make wrong values <em>impossible to write</em>; well-designed
           exceptions make failures <em>impossible to ignore</em>. Both are about the same thing: letting the
           compiler and runtime guard what comments and discipline never will. Click everything.</p>
        <div className="chips">
          {['enum', 'magic strings', 'state machine', 'checked vs unchecked', 'fail fast', 'custom exceptions'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The menu board and the fire alarm</h2>
        <p>Two fixtures of every well-run restaurant explain today:</p>
        <ul>
          <li><strong>The printed menu board (enums).</strong> You can order dish #1–#12. You cannot order
            "dish #13" or "spaghetti banana" — the menu defines what EXISTS. No waiter needs to validate your
            order against a rulebook; impossible orders are simply impossible.</li>
          <li><strong>The fire alarm (exceptions).</strong> When the kitchen catches fire, nobody leaves a polite
            note ("FYI: fire, if convenient please check") that might never be read. The alarm SCREAMS, stops
            normal service, and keeps screaming until someone competent responds.</li>
        </ul>
        <Code html={`   TODAY'S TWO MOVES

   ENUMS                                  EXCEPTIONS
   make ILLEGAL STATES                    make FAILURES
   unrepresentable                        unmissable

   String status = "SHIPPPED"; 😱         return null; // good luck 😱
        │                                      │
        ▼                                      ▼
   enum OrderStatus { … }                 throw new OrderSaveFailed(id, cause);
   the typo CANNOT compile ✅              the caller CANNOT "not notice" ✅`} />
        <Note><strong>The shared idea</strong> (and the quiet theme of all of Week 4): push correctness out of
          "everyone please be careful" and into the <strong>structure of the code itself</strong>. Compilers
          never get tired; conventions do.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The crime scene: magic strings (and magic ints)</h2>
        <Code html={`<span class="kw">private</span> String status = <span class="str">"PLACED"</span>;        <span class="cm">// the "menu" lives in everyone's memory</span>

<span class="kw">if</span> (status.equals(<span class="str">"Shipped"</span>)) { … }       <span class="cm">// ❌ wrong case — silently false forever</span>
order.setStatus(<span class="str">"CANCELED"</span>);              <span class="cm">// ❌ one L — a brand-new secret status!</span>
<span class="kw">int</span> type = <span class="num">3</span>;                              <span class="cm">// ❌ "3 means express"… says who? where?</span>`} />
        <p>Count the diseases: typos that compile, case-sensitivity landmines, the valid set documented nowhere
          (DRY violation — the knowledge "what statuses exist" has NO home), and <C>switch</C> statements that
          can't tell you they missed a case. Every one of these is a 2 a.m. production call wearing a disguise.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>💣 Play: The typo that shipped</h2>
        <p>Set order statuses in both worlds. In string-world, try the pre-typed value first — look closely —
          then invent your own creative misspellings.</p>
        <MagicStringChaos />
        <Good><strong>What you should notice:</strong> ① String-world accepted "SHIPPPED" with a green checkmark —
          the bug enters SILENTLY and detonates later, far from this line. ② In enum-world the invalid value
          isn't rejected — it <em>cannot be expressed</em>. There is nothing to validate because nothing illegal
          exists. ③ That is the design ideal: don't CATCH bad states — make them unrepresentable.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Enums are full classes (this surprises everyone)</h2>
        <p>A Java enum is not a list of numbered names (like in C). It is a <strong>class</strong> whose only
          instances are the constants you list — and those instances can carry <strong>fields, constructors and
          methods</strong>:</p>
        <Code html={`<span class="kw">public enum</span> OrderStatus {
    <span class="cm">// each constant is a real OBJECT, built with the constructor below:</span>
    PLACED(<span class="str">"Order placed"</span>)     { <span class="kw">boolean</span> canMoveTo(OrderStatus n) { <span class="kw">return</span> n == PAID || n == CANCELLED; } },
    PAID(<span class="str">"Payment received"</span>)   { <span class="kw">boolean</span> canMoveTo(OrderStatus n) { <span class="kw">return</span> n == SHIPPED || n == CANCELLED; } },
    SHIPPED(<span class="str">"On the way"</span>)      { <span class="kw">boolean</span> canMoveTo(OrderStatus n) { <span class="kw">return</span> n == DELIVERED; } },
    DELIVERED(<span class="str">"Enjoy!"</span>)        { <span class="kw">boolean</span> canMoveTo(OrderStatus n) { <span class="kw">return false</span>; } },
    CANCELLED(<span class="str">"Cancelled"</span>)     { <span class="kw">boolean</span> canMoveTo(OrderStatus n) { <span class="kw">return false</span>; } };

    <span class="kw">private final</span> String label;                <span class="cm">// data per constant</span>
    OrderStatus(String label) { <span class="kw">this</span>.label = label; }
    <span class="kw">public</span> String label() { <span class="kw">return</span> label; }
    <span class="kw">abstract boolean</span> canMoveTo(OrderStatus next);   <span class="cm">// behavior per constant!</span>
}

<span class="cm">// and inside Order — Tell, Don't Ask (Day 18):</span>
<span class="kw">public void</span> moveTo(OrderStatus next) {
    <span class="kw">if</span> (!status.canMoveTo(next))
        <span class="kw">throw new</span> IllegalStateException(status + <span class="str">" → "</span> + next + <span class="str">" not allowed"</span>);
    <span class="kw">this</span>.status = next;
}`} />
        <p>Useful built-ins: <C>values()</C> (all constants), <C>valueOf("PAID")</C> (parse — throws on garbage,
          which is exactly right), <C>name()</C>. Plus the compiler superpower: a <C>switch</C> covering all
          constants with no <C>default</C> — add a constant later and every incomplete switch <strong>lights up
          as an error</strong>. A to-do list, generated free.</p>
        <Warn><strong>The ordinal() trap:</strong> <C>ordinal()</C> returns the constant's POSITION. Store it in a
          database, then someone inserts <C>REFUNDED</C> in the middle — and every old row silently means a
          different status. Persist <C>name()</C> or an explicit stable code. Never the position.</Warn>
        <Reveal summary="When NOT to use an enum (+ two famous tricks) — click to reveal.">
          <p><strong>Not for open sets:</strong> if the set grows by business decision — countries you ship to,
            subscription plans, currencies — an enum means a re-deploy per deal. That knowledge belongs in
            data/config. Enum = fixed at compile time, genuinely.</p>
          <p style={{ marginTop: 8 }}><strong>Tricks worth knowing:</strong> <C>EnumSet</C>/<C>EnumMap</C> are
            ultra-fast collections specialized for enums (a set of flags in one machine word). And a one-constant
            enum is the bulletproof way to write a Singleton — serialization-safe and reflection-safe. Full story
            in Month 2, Week 5.</p>
        </Reveal>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🚦 Play: The lifecycle that defends itself</h2>
        <p>This is the <C>OrderStatus</C> enum from above, running. Walk the happy path — then try to ship a
          cancelled order, deliver an unpaid one, cancel a delivered one…</p>
        <StateMachine />
        <Good><strong>What you should notice:</strong> ① The rules live in ONE place (each constant knows its own
          exits) — no scattered if-chains across the codebase. ② Illegal moves fail LOUDLY and immediately
          (IllegalStateException), not silently like a wrong string. ③ You just built your first
          <strong> state machine</strong> — the State pattern (Month 2, Week 7) is this idea with objects instead
          of constants, and half the Month 3 problems (Elevator! Vending machine!) are exactly this diagram.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Exceptions — why not error codes or null?</h2>
        <p>Before exceptions, C programmers returned error codes — and the single biggest failure mode was
          simple: <strong>callers forgot to check.</strong> The note got lost. Java's answer:</p>
        <ul>
          <li>An exception <strong>cannot be silently ignored</strong> — unhandled, it climbs the call stack until
            someone handles it or the thread dies loudly with a stack trace (the fire alarm keeps ringing).</li>
          <li>The happy path stays <strong>readable</strong> — no <C>if (err != 0)</C> after every line; failure
            handling moves to one <C>catch</C> block.</li>
          <li>The stack trace carries the <strong>crime scene photo</strong>: file, line, and the chain of calls.</li>
        </ul>
        <p>The family tree (worth memorizing — interviewers sketch this):</p>
        <Code html={`                 Throwable
                ┌────┴─────────────┐
             Error                Exception
        (JVM disasters:       ┌──────┴──────────────┐
         OutOfMemory…         │                RuntimeException
         DON'T catch)    "checked"             "unchecked"
                         IOException,          NullPointerException,
                         SQLException…         IllegalArgumentException,
                         compiler FORCES       IllegalStateException…
                         catch-or-declare      fly until caught`} />
        <p><strong>Checked vs unchecked — the pragmatic modern guidance:</strong> checked exceptions force every
          caller to acknowledge them (<C>throws IOException</C>), which sounds great but pollutes every signature
          up the stack — so modern Java style (and most frameworks) prefers <strong>unchecked for almost all
          custom exceptions</strong>, reserving checked for cases where the immediate caller realistically
          recovers. Know both; default to extending <C>RuntimeException</C>.</p>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Designing good failures</h2>
        <Code html={`<span class="cm">// a domain exception: named by MEANING, carrying CONTEXT, cause chained</span>
<span class="kw">public class</span> InsufficientBalanceException <span class="kw">extends</span> RuntimeException {
    <span class="kw">private final</span> String accountId;
    <span class="kw">private final double</span> requested, available;

    <span class="kw">public</span> InsufficientBalanceException(String accountId, <span class="kw">double</span> requested, <span class="kw">double</span> available) {
        <span class="kw">super</span>(<span class="str">"Account "</span> + accountId + <span class="str">": requested "</span> + requested + <span class="str">" but only "</span> + available + <span class="str">" available"</span>);
        <span class="kw">this</span>.accountId = accountId;
        <span class="kw">this</span>.requested = requested;
        <span class="kw">this</span>.available = available;     <span class="cm">// handlers can READ the facts, not parse the message</span>
    }
}`} />
        <p>The four habits of well-designed failures:</p>
        <ol>
          <li><strong>Fail fast.</strong> Validate in constructors and at method entry (Day 2's guards) — throw at
            the moment of the mistake, near the cause, not three modules later where the null finally explodes.</li>
          <li><strong>Name by meaning, carry context.</strong> <C>InsufficientBalanceException(acc, 500, 120)</C>
            beats <C>Exception("error")</C> in every 2 a.m. debugging session of your life.</li>
          <li><strong>Translate at boundaries.</strong> Catch <C>SQLException</C> at the repository and rethrow as
            <C> OrderSaveFailedException</C> with the cause chained — callers handle business meanings, not vendor
            types (DIP for failures, Day 15).</li>
          <li><strong>Respect LSP.</strong> Day 13's contract rule: overrides must not throw new surprises for
            valid inputs. Your exception design IS part of every method's contract.</li>
        </ol>
        <Reveal summary="finally and try-with-resources in 20 seconds — click to reveal.">
          <p><C>finally</C> runs whether the try succeeded or exploded — historically used to close files and
            connections. Modern Java: declare the resource in <C>try (FileReader r = …)</C> and anything
            <C> AutoCloseable</C> closes itself, even mid-exception, in the right order. Use try-with-resources
            for every file/stream/connection; keep <C>finally</C> for the rare non-resource cleanup.</p>
        </Reveal>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🚑 Play: The exception emergency room</h2>
        <p>Six patients arrive with code attached. Four are sick (each with a classic disease), two are
          perfectly healthy. <strong>Diagnose before clicking.</strong></p>
        <TriageGame />
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 The anti-pattern rogues' gallery (read twice)</h2>
        <ul>
          <li><strong>The swallow</strong> 🙈 — <C>catch (Exception e) {'{ }'}</C>. Evidence destroyed, corruption
            continues. The single worst habit in Java.</li>
          <li><strong>The over-catch</strong> 🪤 — <C>catch (Exception)</C>/<C>catch (Throwable)</C> "to be safe".
            You just caught NullPointerException (a bug to FIX) and OutOfMemoryError (unrecoverable) in the
            same net as a retry-able timeout. Catch the most specific type you can actually handle.</li>
          <li><strong>The doorbell alarm</strong> 🎢 — exceptions for normal control flow ("not found" on every
            search). If it happens on the everyday path, it is a RESULT, not a failure — return
            <C> Optional</C>/boolean.</li>
          <li><strong>The null smuggler</strong> 🕳️ — returning null for failures. The error becomes invisible;
            the crash happens elsewhere, later, anonymized.</li>
          <li><strong>The echo chamber</strong> 📢 — log-and-rethrow at every layer: one failure, six identical
            stack traces, on-call engineer weeping. Log once, at the layer that HANDLES it.</li>
          <li><strong>The vague scream</strong> 😱 — <C>throw new RuntimeException("error!")</C>. Which error?
            Whose? With what data? Name it, contextualize it.</li>
        </ul>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Enum</strong> = a class with a fixed set of instances. Use for compile-time-fixed sets; gives type-safety, exhaustive switch, a single home for the set (DRY).</li>
          <li>Enums carry <strong>fields + constructors + methods</strong> — even per-constant behavior (<C>canMoveTo</C>): perfect for status/state machines. Tell, Don't Ask applies.</li>
          <li><C>values() · valueOf() · name()</C> — and <strong>never persist <C>ordinal()</C></strong>. Open, business-driven sets → config/data, not enums. EnumSet/EnumMap = fast; 1-constant enum = bulletproof Singleton (M2).</li>
          <li><strong>Exceptions</strong> beat codes/null because they can't be ignored and keep the happy path clean. Tree: Throwable → Error (don't touch) / Exception → checked vs RuntimeException (unchecked, the modern default for custom).</li>
          <li><strong>Good failures:</strong> fail fast at the cause · name by meaning + carry context fields · translate vendor → domain at boundaries (cause chained) · no new surprises in overrides (LSP).</li>
          <li><C>try-with-resources</C> for everything AutoCloseable.</li>
          <li>Rogues: swallow · over-catch · control-flow alarms · null smuggling · log-and-rethrow echoes · vague RuntimeException("error").</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Can an enum implement interfaces? Extend a class? Be extended?">
          <p>Implement interfaces: <strong>yes</strong> (enum PaymentType implements Describable — common and
            useful). Extend a class: <strong>no</strong> — every enum already secretly extends
            <C> java.lang.Enum</C>, and Java is single-inheritance. Be extended: <strong>no</strong> — enums are
            implicitly final (though per-constant bodies create hidden subclasses, which is why you saw
            <C>{'{ }'}</C> after constants).</p>
        </Reveal>
        <Reveal summary="Q: What visibility can an enum constructor have — and who calls it?">
          <p>Only <C>private</C> (implicitly; writing public is a compile error). The JVM calls it once per
            constant at class initialization — you can NEVER call it (no <C>new</C>, no reflection — the JVM
            blocks it, which is the singleton superpower from Day 21).</p>
        </Reveal>
        <Reveal summary="Q: Where does values() come from? It's not on java.lang.Enum…">
          <p>The COMPILER synthesizes <C>values()</C> and <C>valueOf(String)</C> for each enum class. That's why
            <C> Enum.values()</C> doesn't exist as an inherited method — trivia that catches people who've never
            looked. Bonus: <C>values()</C> returns a fresh array copy every call (defensive copy, Day 2!) — don't
            call it in hot loops.</p>
        </Reveal>
        <Reveal summary="Q: Why are EnumSet/EnumMap so fast?">
          <p>They exploit the fixed universe: EnumSet stores membership as BITS in one long (≤64 constants) —
            contains/add are single bitwise ops; EnumMap is a plain array indexed by ordinal. "A Set
            implemented as a bit vector" is the phrase to say.</p>
        </Reveal>
        <Reveal summary="Q: try { return 1; } finally { return 2; } — what's returned, and why is this evil?">
          <p><strong>2.</strong> A return (or throw) in finally OVERRIDES the try's result — and worse, it
            silently SWALLOWS any exception in flight. Compilers warn; style guides ban returns in finally
            outright. Classic written-test puzzle.</p>
        </Reveal>
        <Reveal summary="Q: Try-with-resources: closing order of multiple resources, and what are suppressed exceptions?">
          <p>Resources close in REVERSE declaration order. If the body throws AND close() also throws, the
            body's exception wins and the close() failure is attached via <C>addSuppressed()</C> — readable with
            <C> getSuppressed()</C>. Pre-Java-7 finally blocks silently LOST one of the two; this is why
            try-with-resources exists.</p>
        </Reveal>
        <Reveal summary="Q: Is catching NullPointerException ever OK?">
          <p>Practically never — NPE is a BUG indicator, not an event to handle; catching it hides the broken
            invariant. Fix the null at its source (fail fast, Optional, validation). Acceptable rare exception:
            at a top-level boundary that must survive anything and log. Saying "catch it and continue" in an
            interview is a red flag.</p>
        </Reveal>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 19 complete?</strong> Homework: build a mini ATM in your IDE. ① <C>enum AtmState {'{'} IDLE,
        CARD_INSERTED, AUTHENTICATED, DISPENSING {'}'}</C> with per-state <C>canMoveTo()</C> — illegal moves throw
        <C> IllegalStateException</C>. ② <C>withdraw(amount)</C> that fails fast: negative amount →
        <C> IllegalArgumentException</C>; over balance → your own <C>InsufficientBalanceException</C> carrying
        accountId/requested/available. ③ In <C>main</C>, catch each exception type separately and print a
        human-friendly message from the context fields (no message parsing!). This little machine returns as the
        full Vending Machine problem in Month 3, Week 10.
        <br /><br />
        Next: <strong>Day 20 — Value Objects</strong>: the final day of Month 1's core — why <C>double</C> money
        and <C>String</C> emails cause real-world disasters, and the tiny immutable classes that fix them.
      </div>
    </div>
  )
}
