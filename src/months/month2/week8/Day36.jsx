import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The support desk ============ */
const DESK_CHAIN = [
  { name: '🤖 L1 Bot', canHandle: (iss) => iss === 'password', verdict: 'password reset link sent' },
  { name: '🙋 L1 Agent', canHandle: (iss) => iss === 'refund-small', verdict: 'refund of ₹500 processed' },
  { name: '👔 Manager', canHandle: (iss) => iss === 'refund-big', verdict: '₹50,000 refund approved with apology voucher' },
  { name: '⚖️ Legal', canHandle: (iss) => iss === 'legal', verdict: 'forwarded to counsel, hold all replies' },
]
const ISSUES = {
  password: '🔑 "I forgot my password"',
  'refund-small': '💸 "Refund my ₹500 order"',
  'refund-big': '💰 "Refund my ₹50,000 order"',
  legal: '⚖️ "My lawyer will hear about this"',
  alien: '👽 "Aliens stole my parcel"',
}

function SupportDesk() {
  const [result, setResult] = useState(null)

  function submit(key) {
    const path = []
    let handled = null
    for (const h of DESK_CHAIN) {
      if (handled) { path.push({ name: h.name, act: 'unreached' }); continue }
      if (h.canHandle(key)) { handled = h; path.push({ name: h.name, act: 'handled' }) }
      else path.push({ name: h.name, act: 'pass' })
    }
    setResult({ key, path, handled })
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one ticket, one entry point — the chain decides who answers</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.entries(ISSUES).map(([k, label]) => (
          <button key={k} className="act" style={{ fontSize: 12.5 }} onClick={() => submit(k)}>{label}</button>
        ))}
      </div>
      {result && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          {result.path.map((p, i) => (
            <span key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <span style={{ color: '#9aa3b5' }}>→</span>}
              <span className="chip" style={
                p.act === 'handled' ? { background: '#EAF7EF', borderColor: 'var(--green)', color: '#1F6B43' }
                : p.act === 'pass' ? { background: '#FFF1D6', borderColor: '#EDD9A3' }
                : { opacity: 0.4 }}>
                {p.name} {p.act === 'handled' ? '✅ MINE' : p.act === 'pass' ? '🙅 pass' : '😴'}
              </span>
            </span>
          ))}
        </div>
      )}
      {result && (
        <div className="statbar" style={{ background: result.handled ? '#EAF7EF' : '#FDECEC' }}>
          {result.handled
            ? <span>✅ <span>Handled by <b>{result.handled.name}</b>: {result.handled.verdict}. Handlers after the match never even hear about it.</span></span>
            : <span>🕳️ <span><b>Fell off the end of the chain!</b> Nobody could handle aliens. GoF says this is a FEATURE (no guarantee of handling) — but production needs a POLICY: a terminal default handler, a logged drop, or a thrown UnhandledRequestException. Choose one — never let silence be the policy.</span></span>}
        </div>
      )}
      {!result && <div className="statbar">📨 <span>The customer always talks to ONE address (the chain head). Try every ticket — including the alien one.</span></div>}
    </div>
  )
}

/* ============ Interactive 2: The approval chain builder ============ */
const APPROVERS = {
  Lead: { limit: 1000, label: '🧑‍💻 TeamLead ≤ ₹1k' },
  Manager: { limit: 10000, label: '👔 Manager ≤ ₹10k' },
  Director: { limit: 50000, label: '🎩 Director ≤ ₹50k' },
  CFO: { limit: Infinity, label: '💼 CFO — any amount' },
}

function ApprovalBuilder() {
  const [order, setOrder] = useState(['Lead', 'Manager', 'Director', 'CFO'])
  const [gap, setGap] = useState(false)
  const [result, setResult] = useState(null)

  const chain = order.filter((k) => !(gap && k === 'Director'))

  function submit(amount) {
    const path = []
    let handled = null
    for (const k of chain) {
      if (handled) { path.push({ k, act: 'unreached' }); continue }
      if (amount <= APPROVERS[k].limit) { handled = k; path.push({ k, act: 'handled' }) }
      else path.push({ k, act: 'pass' })
    }
    setResult({ amount, path, handled })
  }
  const cfoFirst = order[0] === 'CFO'

  return (
    <div className="panel">
      <div className="ptitle">Live demo · build the expense chain — then sabotage it</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="ghost act" onClick={() => { setOrder(cfoFirst ? ['Lead', 'Manager', 'Director', 'CFO'] : ['CFO', 'Lead', 'Manager', 'Director']); setResult(null) }}>
          {cfoFirst ? '🔧 restore sane order' : '😈 move CFO to the FRONT'}
        </button>
        <button className="ghost act" onClick={() => { setGap((g) => !g); setResult(null) }}>
          {gap ? '🔧 re-link Director' : '😈 delete Director (broken link)'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        {chain.map((k, i) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: '#9aa3b5' }}>→</span>}
            <span className="chip" style={result && result.path[i]
              ? (result.path[i].act === 'handled' ? { background: '#EAF7EF', borderColor: 'var(--green)' }
                : result.path[i].act === 'pass' ? { background: '#FFF1D6' } : { opacity: 0.4 })
              : {}}>
              {APPROVERS[k].label}
            </span>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {[800, 7000, 45000, 200000].map((a) => (
          <button key={a} className="act" onClick={() => submit(a)}>submit ₹{a.toLocaleString()}</button>
        ))}
      </div>
      {result && (
        <div className="statbar" style={{ background: result.handled ? (cfoFirst ? '#FFF6E8' : '#EAF7EF') : '#FDECEC' }}>
          {result.handled
            ? (cfoFirst && result.handled === 'CFO' && result.amount <= 1000
              ? <span>⚠️ <span>₹{result.amount} approved by the <b>CFO</b> — because the chain ORDER is wrong, the most expensive approver handles lunch receipts. Order is part of the design, not decoration.</span></span>
              : <span>✅ <span>₹{result.amount.toLocaleString()} approved by <b>{result.handled}</b> — the first handler whose limit covers it.</span></span>)
            : <span>🕳️ <span>₹{result.amount.toLocaleString()} fell through the gap where Director used to be{gap ? ' (you deleted the link!)' : ''} — escalations beyond Manager now die silently. A broken setNext() is invisible until the big request arrives.</span></span>}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: The middleware lab ============ */
function MiddlewareLab() {
  const [mode, setMode] = useState('classic')
  const [trace, setTrace] = useState(null)

  function send(authed) {
    if (mode === 'classic') {
      setTrace(authed
        ? [
          { t: '🛂 AuthFilter: token valid → not my job to ANSWER → pass', s: 'pass' },
          { t: '🚦 RateLimiter: under limit → pass', s: 'pass' },
          { t: '📝 Logger: nothing to handle → pass', s: 'pass' },
          { t: '🎯 Controller: MINE → 200 OK, page rendered', s: 'handled' },
        ]
        : [
          { t: '🛂 AuthFilter: no token → MINE → 401 Unauthorized. STOP.', s: 'handled' },
          { t: '🚦 RateLimiter: never reached', s: 'off' },
          { t: '📝 Logger: never reached', s: 'off' },
          { t: '🎯 Controller: never reached', s: 'off' },
        ])
    } else {
      setTrace(authed
        ? [
          { t: '🛂 AuthFilter: verified token, attached user → chain.doFilter() ↓', s: 'work' },
          { t: '🚦 RateLimiter: counted request 41/100 → chain.doFilter() ↓', s: 'work' },
          { t: '📝 Logger: wrote "GET /home user=asha" → chain.doFilter() ↓', s: 'work' },
          { t: '🎯 Controller: 200 OK — EVERY stage did its bit on the way here', s: 'handled' },
        ]
        : [
          { t: '🛂 AuthFilter: no token → 401 — and simply does NOT call chain.doFilter()', s: 'handled' },
          { t: '🚦 RateLimiter: never reached (same stop mechanism!)', s: 'off' },
          { t: '📝 Logger: never reached', s: 'off' },
          { t: '🎯 Controller: never reached', s: 'off' },
        ])
    }
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one chain, two semantics — the servlet-filter reality</div>
      <div className="modbtns">
        <button className={mode === 'classic' ? 'on' : ''} onClick={() => { setMode('classic'); setTrace(null) }}>🎯 classic: first handler wins</button>
        <button className={mode === 'pipeline' ? 'on' : ''} onClick={() => { setMode('pipeline'); setTrace(null) }}>🏭 pipeline: everyone works, then passes</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => send(true)}>📨 GET /home (valid token)</button>
        <button className="act" onClick={() => send(false)}>📨 GET /admin (no token)</button>
      </div>
      {trace && (
        <div className="heap">
          {trace.map((l, i) => (
            <div key={i} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '4px 8px', borderRadius: 6,
              background: l.s === 'handled' ? '#EAF7EF' : l.s === 'work' ? '#E5EBFF' : 'transparent',
              opacity: l.s === 'off' ? 0.45 : 1,
            }}>{l.t}</div>
          ))}
        </div>
      )}
      <div className="statbar">
        🔀 <span>Classic CoR: nodes either HANDLE or pass untouched. Pipeline (middleware): every node DOES WORK and passes — and stopping = simply not forwarding. Servlet filters support both with one mechanism: <C>chain.doFilter()</C> — calling it passes; not calling it stops.</span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'Chain of Responsibility\'s intent is…',
    o: ['To notify all subscribers', 'To DECOUPLE sender from receiver by giving MULTIPLE handlers a chance at the request — it travels the chain until one handles it', 'To freeze requests', 'To iterate collections'], a: 1,
    e: 'The customer mails ONE address; behind it, a line of handlers each decides "mine or pass". The sender never knows (or cares) who answered.',
    w: { 0: 'All-subscribers-react is Observer (32); here typically ONE handles and the rest never hear of it.',
         2: 'Freezing requests is Command (33) — though the traveling request is often a command object!',
         3: 'Iteration is tomorrow (37).' },
    r: { id: 's1', label: 'Section 1 — the support desk' } },
  { q: 'What does the CLIENT know in a healthy chain?',
    o: ['Every handler and its limits', 'Only the HEAD of the chain — it fires the request at one entry point and awaits an outcome', 'The handler that will win', 'The chain length'], a: 1,
    e: 'That single-entry ignorance is the decoupling: approvers can be added, removed or reordered at the composition root and no sender changes.',
    w: { 0: 'Knowing all handlers = the if-else crime the pattern cures.',
         2: 'Predicting the winner couples you to limits and order.',
         3: 'Length is an internal detail.' },
    r: { id: 's2', label: 'Section 2 — the crime scene' } },
  { q: 'The standard handler structure is…',
    o: ['A list the client loops over', 'Each handler holds a NEXT reference; a base-class template runs: if canHandle → handle, else next.handle(request) — and concrete handlers fill the blanks', 'A map of types', 'A switch in the sender'], a: 1,
    e: 'Linked handlers + a tiny Template Method (Day 35!) in the base class: the pass-along ceremony is written once; subclasses supply canHandle/handle.',
    w: { 0: 'A dispatcher loop is a valid VARIANT — but then the loop owner becomes a coupling point.',
         2: 'Type-maps are registries (31) — no chance for ordered fallthrough.',
         3: 'The sender switch is the disease.' },
    r: { id: 's3', label: 'Section 3 — the structure' } },
  { q: 'Why does ORDER in the chain matter so much?',
    o: ['It doesn\'t', 'The FIRST capable handler wins — put the CFO first and lunch receipts get C-suite approval; put broad handlers early and specific ones never run', 'Alphabetical is required', 'Only the last handler matters'], a: 1,
    e: 'Order is business logic: cheapest/most-specific handlers first, broad/expensive ones late. The sabotage demo is one click of proof.',
    w: { 0: 'The demo says otherwise — loudly.',
         2: 'No such rule. 🙂',
         3: 'The last handler often never runs.' },
    r: { id: 's6', label: 'Section 6 — the sabotaged chain' } },
  { q: 'A request reaches the end with NO handler. The right engineering response?',
    o: ['Impossible by design', 'Decide a POLICY: a terminal catch-all handler, an explicit UnhandledRequestException, or a logged drop — anything but silent disappearance', 'The JVM retries the chain', 'Restart the application'], a: 1,
    e: 'GoF allows unhandled requests as a feature (flexibility); production turns that freedom into a deliberate policy. Silent loss is how ₹2,00,000 approvals vanish.',
    w: { 0: 'Falling off the end is always possible — that\'s the design\'s honesty.',
         2: 'No auto-retry exists.',
         3: 'Drastic and useless.' },
    r: { id: 's5', label: 'Section 5 — the end of the chain' } },
  { q: 'Classic CoR vs the PIPELINE (middleware) variant?',
    o: ['Identical', 'Classic: handlers either claim the request or pass it UNTOUCHED — one winner. Pipeline: EVERY stage does its work (auth, count, log) and forwards; stopping = not forwarding. Servlet filters express both via chain.doFilter()', 'Pipeline is deprecated', 'Classic is asynchronous'], a: 1,
    e: 'Same linked shape, different contract about "does everyone run?" — the exact distinction Day 27\'s corner drew against Decorator. FilterChain makes the choice per-filter, per-request.',
    w: { 0: 'The contract difference changes everything downstream.',
         2: 'Middleware pipelines run the modern web.',
         3: 'Sync/async is an independent axis.' },
    r: { id: 's7', label: 'Section 7 — two semantics' } },
  { q: 'Which Java LANGUAGE feature is Chain of Responsibility built in?',
    o: ['Garbage collection', 'Exception propagation: a throw climbs the call stack, offering itself to each enclosing try/catch until one catches — handlers in a chain, unhandled = falls off the end (thread dies)', 'Autoboxing', 'Generics'], a: 1,
    e: 'You\'ve used CoR since Day 19: catch blocks are handlers, the stack is the chain, catch-or-propagate is handle-or-pass, and the default uncaught-exception handler is the terminal policy.',
    w: { 0: 'GC frees memory, routes nothing.',
         2: 'Boxing converts values.',
         3: 'Generics are compile-time types.' },
    r: { id: 's8', label: 'Section 8 — the built-in chain' } },
  { q: 'Chain of Responsibility vs Decorator — both are linked wrappers. The contract difference?',
    o: ['None', 'Decorator layers ALL run — each adds its delta and ALWAYS forwards inward. CoR handlers MAY stop the journey — handling is exclusive, forwarding is conditional', 'CoR cannot be nested', 'Decorator is for streams only'], a: 1,
    e: 'Day 27 planted this; today closes it. Ask of any linked design: "is everyone guaranteed to run?" Yes → decoration/pipeline thinking. No, someone claims it → CoR.',
    w: { 0: 'The everyone-runs guarantee is the dividing line.',
         2: 'Both nest happily.',
         3: 'Streams are just the famous decorator demo.' },
    r: { id: 's7', label: 'Section 7 — vs Decorator, settled' } },
]

/* ============ The page ============ */
export default function Day36() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 8 · Day 36 · Behavioral Patterns II</div>
        <h1>Chain of Responsibility:<br />Pass It Down the Line</h1>
        <p>Welcome to the final pattern week. We open with the shape of every support desk, approval flow and
           middleware stack you have ever met: a request enters at ONE door and walks a line of handlers until
           someone says "mine". Click everything.</p>
        <div className="chips">
          {['chain of responsibility', 'handler + next', 'escalation', 'middleware', 'fall-off policy', 'FilterChain'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The support desk</h2>
        <p>You email support@shop.com — one address. Behind it: the bot tries; can't? → human agent; beyond
          their limit? → manager; lawyers mentioned? → legal. You never knew the roster, the limits, or who
          finally answered. <strong>One entry point, an escalation line behind it.</strong></p>
        <Note><strong>CoR's intent:</strong> avoid coupling the sender of a request to its receiver by giving
          <strong> more than one object</strong> a chance to handle it. Chain the handlers; pass the request
          along until someone handles it.</Note>
        <Code html={`        THE CHAIN IDEA

  client ──▶ 🤖 Bot ──▶ 🙋 Agent ──▶ 👔 Manager ──▶ ⚖️ Legal ──▶ (end?)
             "mine?      "mine?       "mine?          "mine?      fall-off
              no, pass"   YES — stop"  (never asked)   …"          policy!

  each handler: handle(req) {
      if (canHandle(req))  doIt(req);          // claim it — journey ends
      else if (next != null) next.handle(req); // pass the parcel
      else fallOffPolicy(req);                 // the end of the line
  }`} />
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The crime: the sender who routes</h2>
        <Code html={`<span class="cm">// without the chain, the SENDER plays traffic police:</span>
<span class="kw">void</span> fileTicket(Ticket t) {
    <span class="kw">if</span> (t.isPasswordIssue())          bot.fix(t);
    <span class="kw">else if</span> (t.refund() <= <span class="num">1000</span>)      agent.refund(t);
    <span class="kw">else if</span> (t.refund() <= <span class="num">100000</span>)    manager.approve(t);
    <span class="kw">else if</span> (t.mentionsLawyers())     legal.escalate(t);
    <span class="cm">// new tier? new limit? EVERY sender edits. And there are 9 senders…</span>
}`} />
        <p>The sender now knows every receiver, every limit, every order rule — coupling to the whole roster
          (Day 17), duplicated wherever tickets are filed (Day 16), reopened for every org change (Day 12).
          CoR moves that routing INTO the line itself: each handler knows only its own competence and its
          neighbor.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The structure (a chain is links + one tiny ceremony)</h2>
        <Code html={`<span class="kw">public abstract class</span> SupportHandler {
    <span class="kw">private</span> SupportHandler next;                         <span class="cm">// the LINK</span>
    <span class="kw">public</span> SupportHandler linkTo(SupportHandler n) { next = n; <span class="kw">return</span> n; }  <span class="cm">// fluent</span>

    <span class="cm">// the pass-along ceremony — written ONCE (a mini Template Method, Day 35!):</span>
    <span class="kw">public final void</span> handle(Ticket t) {
        <span class="kw">if</span> (canHandle(t))       process(t);
        <span class="kw">else if</span> (next != <span class="kw">null</span>)  next.handle(t);
        <span class="kw">else</span>                    <span class="kw">throw new</span> UnhandledTicketException(t);  <span class="cm">// the policy</span>
    }
    <span class="kw">protected abstract boolean</span> canHandle(Ticket t);   <span class="cm">// the blanks</span>
    <span class="kw">protected abstract void</span> process(Ticket t);
}

<span class="kw">public class</span> RefundAgent <span class="kw">extends</span> SupportHandler {
    <span class="kw">protected boolean</span> canHandle(Ticket t) { <span class="kw">return</span> t.refund() <= <span class="num">1000</span>; }
    <span class="kw">protected void</span> process(Ticket t) { <span class="cm">/* refund + email */</span> }
}

<span class="cm">// assembled at the composition root (Day 15) — the ONLY place that knows the roster:</span>
SupportHandler desk = <span class="kw">new</span> Bot();
desk.linkTo(<span class="kw">new</span> RefundAgent()).linkTo(<span class="kw">new</span> Manager()).linkTo(<span class="kw">new</span> Legal());

client: desk.handle(ticket);          <span class="cm">// ONE address. Done.</span>`} />
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>📨 Play: File a ticket</h2>
        <p>Five tickets, one address. Watch how deep each travels — and what happens to the alien:</p>
        <SupportDesk />
        <Good><strong>What you should notice:</strong> ① Different requests stop at different depths — the chain
          IS the routing table, distributed. ② Handlers after the winner stay asleep (classic semantics).
          ③ The alien fell off the end: GoF calls that flexibility; your production system calls it an
          incident unless a policy catches it.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The three chain-design decisions</h2>
        <ul>
          <li><strong>Order:</strong> most-specific/cheapest handlers first; broad/expensive last. Order is
            BUSINESS LOGIC living at the composition root — review it like code, because it is.</li>
          <li><strong>The end of the line:</strong> pick a fall-off policy — terminal catch-all handler
            (a Null-Object cousin, Day 31), explicit exception (fail fast, Day 19), or logged drop. Decide;
            never default to silence.</li>
          <li><strong>Assembly:</strong> one fluent builder at the root (as above) keeps the roster in one
            reviewable place — and makes runtime re-ordering (feature flags, A/B escalation rules) a data
            change.</li>
        </ul>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>😈 Play: Sabotage the approval chain</h2>
        <p>Submit expenses through a sane chain — then put the CFO first, then delete a link:</p>
        <ApprovalBuilder />
        <Good><strong>What you should notice:</strong> ① CFO-first "works" — every request gets approved! — yet
          is organizationally absurd: correctness of a chain includes WHO handled, not just THAT it was
          handled. ② The deleted Director creates a silent gap: small requests fine, ₹45k vanishes — broken
          links surface only when the rare big request arrives. ③ Both bugs live in ONE assembly site, which is
          exactly why assembly belongs in one reviewed place.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🏭 Play: The middleware lab (two semantics, one mechanism)</h2>
        <p>The same four stages, two contracts — and the servlet API trick that supports both:</p>
        <MiddlewareLab />
        <Good><strong>What you should notice:</strong> ① Classic mode: pure claim-or-pass — one winner. ② Pipeline
          mode: every stage WORKS (verify, count, log) then forwards — that "everyone runs" guarantee is
          decorator-thinking in chain clothing (Day 27's distinction, now settled). ③ <C>chain.doFilter()</C> is
          the genius: calling it = pass; not calling it = stop. One mechanism, both semantics, chosen per
          filter per request.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>You have used CoR since Day 19 (the built-in chain)</h2>
        <Code html={`<span class="kw">void</span> a() { b(); }                       <span class="cm">// no catch — PASS</span>
<span class="kw">void</span> b() { <span class="kw">try</span> { c(); } <span class="kw">catch</span> (IOException e) { … } }   <span class="cm">// handles ONLY IOException</span>
<span class="kw">void</span> c() { <span class="kw">throw new</span> SQLException(); }  <span class="cm">// the request enters the chain</span>

<span class="cm">// SQLException climbs: c (no handler) → b (wrong type — pass!) → a (pass)
// → main (pass) → Thread.uncaughtExceptionHandler = the TERMINAL POLICY</span>`} />
        <p><strong>Exception propagation IS Chain of Responsibility</strong>, built into the JVM: catch blocks
          are handlers, the call stack is the chain, catch-or-propagate is claim-or-pass, and the default
          uncaught-exception handler is the fall-off policy. Other native chains: DOM event bubbling
          (child → parent → document), logger hierarchies (com.shop.orders → com.shop → root), GUI focus
          traversal.</p>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Silence at the end</h3>
        <p>The unhandled request that just… evaporates. Every chain ships with an explicit terminal policy, or
          it ships with a future incident.</p>
        <h3>Trap 2 — Order drift</h3>
        <p>Handlers added over the years in append order, until a broad early handler eats requests meant for
          specialists below. Audit the chain like a routing table; keep assembly in one file.</p>
        <h3>Trap 3 — The half-handling handler</h3>
        <p>A classic-mode handler that mutates the request, then passes anyway — now downstream handlers see a
          DIFFERENT request and nobody can reason about the chain. Pick a semantic per chain (claim-or-pass vs
          pipeline) and write it on the door.</p>
        <h3>Trap 4 — Cycles and re-entry</h3>
        <p>Handler escalates "back to the top" → infinite loop (Day 28's cycle, linked-list edition). Chains
          are one-way; re-submission is a NEW request with a hop counter.</p>
        <h3>Trap 5 — Debugging the invisible journey</h3>
        <p>"Who rejected this?" with 9 handlers and no trace = archaeology. Log each hop (handler, decision,
          reason) — the approval audit trail is usually a legal requirement anyway (your Day 34 transition-log
          instinct, re-applied).</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> sender → ONE entry; linked handlers each claim-or-pass; decouples sender from the receiver roster.</li>
          <li><strong>Structure:</strong> handler base = next link + final pass-along ceremony (mini Template Method) + canHandle/process blanks. Assemble fluently at the composition root.</li>
          <li><strong>Three decisions:</strong> order (specific→broad — it is business logic) · fall-off policy (catch-all / exception / logged drop — never silence) · one assembly site.</li>
          <li><strong>Two semantics:</strong> classic claim-or-pass (one winner) vs pipeline (everyone works — middleware). FilterChain.doFilter: call = pass, skip = stop.</li>
          <li>Built-in chains: exception propagation (catch = handler, stack = chain) · DOM bubbling · logger hierarchies.</li>
          <li>Traps: silent fall-off · order drift · half-handling mutators · cycles · untraced journeys. vs Decorator: "is everyone guaranteed to run?"</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: GoF says "receipt isn’t guaranteed" — defend that as a feature.'>
          <p>Because no handler is FORCED to exist for every request, chains stay open: add tiers without
            touching senders, run partial chains in tests, let configs disable handlers. The freedom is the
            flexibility; the DISCIPLINE (terminal policy) is what production adds on top. Feature + policy,
            not bug.</p>
        </Reveal>
        <Reveal summary="Q: Chain vs a dispatcher loop over List<Handler> — trade-offs?">
          <p>Same behavior, different ownership: linked chain = no central authority, handlers can be composed
            by different modules; dispatcher loop = one owner with a list — easier to reorder/inspect/log,
            but that owner becomes a coupling point. Modern frameworks mostly use the LIST internally (filter
            chains are arrays) while exposing chain semantics. Saying both earns the nod.</p>
        </Reveal>
        <Reveal summary="Q: How do CoR and Command combine?">
          <p>The thing traveling the chain is often a COMMAND object (Day 33): self-contained request with
            args. Chain decides WHO; command defines WHAT; and because commands are loggable, the audit trail
            of hops (Trap 5) comes nearly free. Approval systems = Command riding CoR, with Memento for
            drafts.</p>
        </Reveal>
        <Reveal summary="Q: Where does Spring Security fit today's lesson?">
          <p>It IS a filter chain — literally <C>SecurityFilterChain</C>: a dozen-plus filters
            (CSRF, auth, session, exception translation) in a documented ORDER, each doing pipeline work,
            any able to stop the request. Most "Spring Security is magic" confusion dissolves once you read
            it as Day 36 + Day 27 semantics. Order bugs there are real CVEs.</p>
        </Reveal>
        <Reveal summary="Q: Can a chain be modified at RUNTIME safely?">
          <p>Yes — that's a selling point (escalation rules per tenant, feature-flagged handlers) — but the
            links are shared mutable state: swap atomically (build a NEW chain, then swap the head reference —
            effectively copy-on-write, Day 32's listener lesson) rather than re-linking live nodes mid-request.</p>
        </Reveal>
        <Reveal summary="Q: How does DOM event bubbling map to CoR vocabulary?">
          <p>The event starts at the target and bubbles up ancestors (child → parent → document): each may
            handle; <C>stopPropagation()</C> = claiming the request; the document is the terminal handler.
            Capture phase runs the chain in the OPPOSITE direction first — a chain walked both ways. UI
            frameworks are CoR with rendering attached.</p>
        </Reveal>
        <Reveal summary="Q: Sketch the LLD-round answer: ATM cash dispenser as a chain.">
          <p>"Dispense ₹3,700: ₹2000-handler emits 1 note, passes ₹1700 → ₹500-handler emits 3, passes ₹200 →
            ₹100-handler emits 2 → remainder 0. Each handler: emit what you can, pass the rest — pipeline
            semantics. Fall-off policy: remainder &gt; 0 → CannotDispenseException, roll back." Classic
            machine-coding warm-up; now you have its name.</p>
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
        <strong>Day 36 complete?</strong> Homework: the ATM dispenser from the interview corner, for real.
        <C> abstract class NoteHandler</C> (denomination, next) with the final pass-along ceremony; concrete
        handlers for ₹2000/₹500/₹100; pipeline semantics (each emits notes, passes the remainder).
        ① Dispense ₹3,700 and print the note breakdown. ② ₹250 must throw <C>CannotDispenseException</C> —
        with NO notes emitted (hint: compute first, emit after — or roll back). ③ Re-link the chain WITHOUT
        the ₹500 handler and observe the different breakdown. ④ One sentence: which semantics did you use,
        and why would claim-or-pass be wrong here?
        <br /><br />
        Next: <strong>Day 37 — Iterator</strong>: the humble pattern hiding inside every for-each loop you
        have ever written — and why ConcurrentModificationException keeps crashing yours.
      </div>
    </div>
  )
}
