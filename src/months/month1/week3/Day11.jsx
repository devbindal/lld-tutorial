import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The change simulator ============ */
const ACTORS = [
  { key: 'acct', label: '🧾 Accountant: "tax rule changed!"', target: 'calculateTotal()', cls: 'TaxCalculator' },
  { key: 'mgr', label: '📊 Manager: "new report format!"', target: 'printReport()', cls: 'ReportPrinter' },
  { key: 'dba', label: '🗄️ DBA: "database moved!"', target: 'saveToDatabase()', cls: 'InvoiceRepository' },
]

function ChangeSimulator() {
  const [world, setWorld] = useState('god')
  const [hit, setHit] = useState(null)            // which actor fired last
  const [godEdits, setGodEdits] = useState(0)
  const [splitEdits, setSplitEdits] = useState({ TaxCalculator: 0, ReportPrinter: 0, InvoiceRepository: 0 })

  function fire(a) {
    setHit(a.key)
    if (world === 'god') setGodEdits((n) => n + 1)
    else setSplitEdits((e) => ({ ...e, [a.cls]: e[a.cls] + 1 }))
  }
  const hitActor = ACTORS.find((a) => a.key === hit)

  const methodLine = (m, owner) => {
    const lit = hitActor && hitActor.target === m
    return (
      <div key={m} className="ofield"
        style={lit ? { background: '#FFE9C9', borderRadius: 5, fontWeight: 700 } : {}}>
        {m} {lit ? ' ← must edit!' : ''}
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · three teams keep asking for changes — count the edits</div>
      <div className="modbtns">
        <button className={world === 'god' ? 'on' : ''} onClick={() => { setWorld('god'); setHit(null) }}>😰 god-class world</button>
        <button className={world === 'split' ? 'on' : ''} onClick={() => { setWorld('split'); setHit(null) }}>😌 SRP world</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {ACTORS.map((a) => (
          <button key={a.key} className="act" style={{ fontSize: 12.5, padding: '7px 11px' }} onClick={() => fire(a)}>
            {a.label}
          </button>
        ))}
      </div>
      {world === 'god' ? (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div className="obj" style={{ minWidth: 250, borderColor: godEdits >= 3 ? 'var(--red)' : undefined }}>
            <div className="oref">class Invoice  (does EVERYTHING)</div>
            {ACTORS.map((a) => methodLine(a.target, null))}
            <div className="ofield" style={{ marginTop: 6, color: '#B23B3B' }}>
              ✏️ edited {godEdits} time{godEdits === 1 ? '' : 's'} — by THREE different teams
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {ACTORS.map((a) => {
            const lit = hitActor && hitActor.cls === a.cls
            return (
              <div className="obj" key={a.cls} style={{ minWidth: 180, borderColor: lit ? 'var(--blue)' : undefined }}>
                <div className="oref">class {a.cls}</div>
                {methodLine(a.target, a.cls)}
                <div className="ofield" style={{ marginTop: 6 }}>✏️ edits: {splitEdits[a.cls]}</div>
              </div>
            )
          })}
        </div>
      )}
      <div className="statbar">
        {world === 'god'
          ? <span>💥 <span>Every request edits the SAME file: merge conflicts, full retest each time, and a tax change can accidentally break printing.</span></span>
          : <span>🎯 <span>Each request lands in exactly ONE small class. The other two are untouched — nothing to retest, no conflicts.</span></span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: Sort the methods into their classes ============ */
const METHOD_ITEMS = [
  { m: 'applyDiscount(code)', a: 'tax', why: 'Changing discount/tax math is the accountant\'s request — money logic belongs with money logic.' },
  { m: 'formatHeader()', a: 'print', why: 'Layout and formatting change when the manager wants a prettier report — presentation logic.' },
  { m: 'openConnection()', a: 'repo', why: 'Talking to the database is storage work — only the DBA\'s changes should touch it.' },
  { m: 'calculateGst(amount)', a: 'tax', why: 'Tax rules — changes when the government or accountant says so. Money logic.' },
  { m: 'exportPdf()', a: 'print', why: 'Output format = presentation. If PDF becomes Excel tomorrow, only the printer class changes.' },
  { m: 'insertInvoiceRow(inv)', a: 'repo', why: 'SQL and tables = storage. Schema changes should never touch tax or printing code.' },
]
const METHOD_BUCKETS = [['tax', '💰 TaxCalculator'], ['print', '📄 ReportPrinter'], ['repo', '🗄️ InvoiceRepository']]

function MethodSorter() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= METHOD_ITEMS.length
  const cur = METHOD_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the god class exploded — put each method in its new home</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {METHOD_ITEMS.length}</b>{score === METHOD_ITEMS.length ? ' — clean split!' : '. Replay the ones you missed.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            🧰 <span>method {idx + 1} of {METHOD_ITEMS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'IBM Plex Mono' }}>{cur.m}</p>
          <div className="modbtns">
            {METHOD_BUCKETS.map(([k, label]) => (
              <button key={k} className={picked !== null && k === cur.a ? 'on' : ''}
                style={picked !== null && picked === k && k !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
                onClick={() => pick(k)}>
                {label}
              </button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ Correct! ' : <span>❌ It belongs in <b>{METHOD_BUCKETS.find(([k]) => k === cur.a)[1]}</b>. </span>}
              {cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={next}>Next method →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: The smell test ============ */
const SMELL_ITEMS = [
  { d: 'EmailSender — opens an SMTP connection and sends emails.', a: 'ok',
    why: 'One job: sending email. Opening the connection is PART of that one job, not a second responsibility. Steps of one task ≠ multiple responsibilities.' },
  { d: 'UserManager — creates users, sends them welcome emails, and writes an audit log.', a: 'bad',
    why: 'Three reasons to change: user rules (product), email content (marketing), audit format (compliance). Three actors pulling one class → split it.' },
  { d: 'Logger — formats a log line and appends it to the log file.', a: 'ok',
    why: 'One job: logging. Formatting the line is a step of that job. If requirements later add "log to database AND file", THEN it may split.' },
  { d: 'OrderService — places orders and also renders the order-history HTML page.', a: 'bad',
    why: 'Business logic + presentation in one class. The web designer and the order-rules team would edit the same file. Classic violation.' },
  { d: 'Money — stores amount + currency, and can add itself to another Money safely.', a: 'ok',
    why: 'One job: being a correct money value. Data + the behavior that protects that data belong together (that is Information Expert, Day 10 — not a violation!).' },
  { d: 'ReportHelper — fetches data from the DB, computes statistics, formats a PDF, and uploads it to cloud storage.', a: 'bad',
    why: 'Four jobs, four reasons to change (schema, math, layout, infrastructure). "Helper"/"Util"/"Manager" names are SRP smoke alarms.' },
]

function SmellTest() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= SMELL_ITEMS.length
  const cur = SMELL_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · you are the code reviewer — SRP: pass or fail?</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {SMELL_ITEMS.length}</b>{score === SMELL_ITEMS.length ? ' — sharp nose!' : '. The borderline ones are where the learning is.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            👃 <span>class {idx + 1} of {SMELL_ITEMS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.d}</p>
          <div className="modbtns">
            <button className={picked !== null && cur.a === 'ok' ? 'on' : ''}
              style={picked === 'ok' && cur.a !== 'ok' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('ok')}>✅ fine — one responsibility</button>
            <button className={picked !== null && cur.a === 'bad' ? 'on' : ''}
              style={picked === 'bad' && cur.a !== 'bad' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('bad')}>🚨 violates SRP</button>
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ Correct! ' : '❌ Not quite. '}
              {cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={next}>Next class →</button>
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
  { q: 'The official definition of the Single Responsibility Principle is: a class should have…',
    o: ['Only one method', 'Only one field', 'Only one reason to change', 'Less than 100 lines'], a: 2,
    e: 'SRP is about REASONS TO CHANGE, not size. A class with ten methods serving one purpose is fine; a class with three methods serving three different masters is not.',
    w: { 0: 'One method per class would shred every design into confetti — size was never the rule.',
         1: 'Field count is equally irrelevant.',
         3: 'Line counts are a smell at best — actors are the measure.' },
    r: { id: 's2', label: 'Section 2 — responsibility = reason to change' } },
  { q: 'The modern way to count "reasons to change" is to count…',
    o: ['Lines of code', 'The different people/teams (actors) who would request changes to the class', 'The number of if statements', 'The number of imports only'], a: 1,
    e: 'Ask: WHO asks for changes here? If the accountant, the manager AND the DBA all point at one class, it has three responsibilities. One class should answer to one actor.',
    w: { 0: 'Lines measure size, not masters.',
         2: 'if-counting measures complexity, not responsibility.',
         3: 'Imports HINT at it (many worlds = many masters) but the actor count is the definition.' },
    r: { id: 's2', label: 'Section 2 — counting actors' } },
  { q: 'Invoice has calculateTotal(), printReport() and saveToDatabase(). The accountant changes a tax rule. What is the hidden danger in this design?',
    o: ['Nothing — methods are independent', 'The edit happens in the same class as printing and saving, risking breakage, full retests, and merge conflicts with other teams', 'Java does not allow 3 methods', 'The class becomes too fast'], a: 1,
    e: 'Unrelated code traveling together = shared blast radius. Touching tax math forces re-testing printing and saving, and three teams editing one file collide constantly.',
    w: { 0: 'Methods in one class share fields, helpers, and a release unit — independence is an illusion.',
         2: 'Three methods are perfectly legal Java — the danger is design-level.',
         3: 'Speed is untouched; risk is what grows.' },
    r: { id: 's4', label: 'Section 4 — the change simulator' } },
  { q: 'Which class name is the strongest SRP smoke alarm?',
    o: ['TaxCalculator', 'InvoiceRepository', 'UtilityManagerHelper', 'ReportPrinter'], a: 2,
    e: 'Names like Util, Helper, Manager, Processor usually mean "we did not know what this does, so it does everything." Honest, specific names (TaxCalculator) tend to have one job.',
    w: { 0: 'TaxCalculator names ONE job — exactly the kind of honest name SRP produces.',
         1: 'Repository names one role: storage.',
         3: 'ReportPrinter: one job, one actor (the manager).' },
    r: { id: 's7', label: 'Section 7 — the smell checklist' } },
  { q: 'A Money class stores amount + currency AND has an add(other) method with currency checks. Is this an SRP violation?',
    o: ['Yes — data and behavior must be in separate classes', 'No — protecting and operating on its own data is ONE responsibility (Information Expert)', 'Yes — Money should extend Double', 'Only if amount is public'], a: 1,
    e: 'SRP never says "split data from behavior" — that creates anemic classes. Data + the behavior that guards it = one cohesive responsibility. The split is by REASON TO CHANGE, not by kind.',
    w: { 0: 'Splitting data from its guarding behavior is the ANEMIC anti-pattern — the opposite of OOP.',
         2: 'Money extending Double is nonsense inheritance (and Double is final anyway).',
         3: 'Field visibility doesn\'t change whose responsibility the math is.' },
    r: { id: 's5', label: 'Section 5 — the refactor (what stays)' } },
  { q: 'EmailSender both opens an SMTP connection and sends the message. Two responsibilities?',
    o: ['Yes — connection and sending must be separate classes', 'No — they are two STEPS of one job: delivering email', 'Yes — SMTP is always a separate class', 'It depends on the file length'], a: 1,
    e: 'Steps of a single task are not separate responsibilities. The test is reasons to change: connection details and sending logic both change for the same reason — "how we deliver email".',
    w: { 0: 'Splitting every step makes confetti — steps of one job stay together.',
         2: '"Always separate" rules ignore the actor test — the only test that matters.',
         3: 'File length is a symptom, never the criterion.' },
    r: { id: 's7', label: 'Section 7 — steps vs responsibilities' } },
  { q: 'What is the main danger of OVER-applying SRP?',
    o: ['The code becomes too fast', 'Dozens of one-method classes where a simple change forces you to open ten files — complexity moves into the wiring', 'The compiler rejects small classes', 'There is no danger; more classes is always better'], a: 1,
    e: 'Splitting beyond real reasons-to-change scatters logic. If two pieces ALWAYS change together, they belong together. SRP is "gather what changes together, separate what changes apart".',
    w: { 0: 'Speed is unaffected by class count at this scale.',
         2: 'The compiler is indifferent to design quality.',
         3: '"More classes always better" is how 10-file changes for one bugfix happen.' },
    r: { id: 's9', label: 'Section 9 — Trap 2: confetti' } },
  { q: 'SRP also applies to methods. Which method most needs splitting?',
    o: ['calculateGst(amount) — 12 lines of tax math', 'processOrder() — validates, charges payment, updates stock, sends email, and prints', 'getName() — returns the name', 'isEmpty() — checks the list'], a: 1,
    e: 'processOrder() is a run-on sentence of five jobs. Long methods doing many things are mini god-classes: extract each step into its own well-named method (or class).',
    w: { 0: '12 lines of ONE topic (tax math) is fine — cohesive length is not the issue.',
         2: 'getName() is as single-purpose as it gets.',
         3: 'isEmpty() does one tiny job.' },
    r: { id: 's7', label: 'Section 7 — SRP for methods' } },
]

/* ============ The page ============ */
export default function Day11() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 3 · Day 11</div>
        <h1>Single Responsibility:<br />One Class, One Job, One Boss</h1>
        <p>Welcome to SOLID week — the five rules that keep the classes you found in Week 2 healthy as code
           grows. We start with the S. It sounds obvious ("one job per class") and is broken in almost every
           codebase on Earth. Click everything.</p>
        <div className="chips">
          {['SOLID', 'SRP', 'reason to change', 'god class', 'actors', 'refactoring'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Welcome to SOLID week</h2>
        <p><strong>SOLID</strong> is five design principles collected by Robert C. Martin ("Uncle Bob"). They are
          the most-asked design questions in interviews, and the standard vocabulary of code review. One per day
          this week:</p>
        <table className="matrix">
          <thead>
            <tr><th>letter</th><th>name</th><th>one-liner</th><th>day</th></tr>
          </thead>
          <tbody>
            <tr><td><b>S</b></td><td>Single Responsibility</td><td>one class, one reason to change</td><td className="yes">today</td></tr>
            <tr><td><b>O</b></td><td>Open/Closed</td><td>add features without editing old code</td><td>12</td></tr>
            <tr><td><b>L</b></td><td>Liskov Substitution</td><td>children must honor the parent's promises</td><td>13</td></tr>
            <tr><td><b>I</b></td><td>Interface Segregation</td><td>many small interfaces beat one fat one</td><td>14</td></tr>
            <tr><td><b>D</b></td><td>Dependency Inversion</td><td>depend on abstractions, not concretions</td><td>15</td></tr>
          </tbody>
        </table>
        <p>Now today's analogy: a tiny <strong>one-man restaurant</strong>. One poor employee is the chef, the
          cashier, the waiter AND the cleaner. Whenever the menu changes, he is retrained. When billing tax rules
          change, he is retrained. When a new mop arrives, he is retrained. He is always being changed, by
          everyone, for everything — and while learning the new tax rules he burns the biryani.</p>
        <p>A real restaurant hires <strong>one person per job</strong>. The tax office talks to the cashier only.
          The food critic affects the chef only. Each person has <strong>one boss, one reason to be retrained</strong>.</p>
        <Note><strong>SRP in one line:</strong> a class should have <strong>one reason to change</strong> — meaning
          one job, requested by one kind of person (one <em>actor</em>). Not "one method"!</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>"Responsibility" = "reason to change"</h2>
        <p>The word "responsibility" confuses everyone, so use the precise test. Look at a class and ask:</p>
        <ol>
          <li><strong>Who</strong> would walk up to my desk and ask me to change this class?</li>
          <li>Count the <strong>different kinds</strong> of people (actors): accountant? designer? DBA? regulator?</li>
          <li>More than one → more than one responsibility → SRP is broken.</li>
        </ol>
        <Code html={`  THE GOD CLASS (everyone pulls one class)      AFTER SRP (one boss each)

  🧾 Accountant ──┐                            🧾 Accountant ──▶ TaxCalculator
                  │                            📊 Manager ─────▶ ReportPrinter
  📊 Manager ─────┼──▶  class Invoice          🗄️ DBA ─────────▶ InvoiceRepository
                  │     (tax + print + SQL)
  🗄️ DBA ─────────┘     edits collide 💥        each change lands in ONE small
                                               class — others stay untouched ✅`} />
        <p>Why does this matter so much? Because <strong>code that changes together should live together, and code
          that changes separately should live separately.</strong> When unrelated jobs share a class:</p>
        <ul>
          <li>A tax fix can <strong>accidentally break printing</strong> (they share fields and helpers).</li>
          <li>Every change forces <strong>re-testing everything</strong> in the class.</li>
          <li>Three teams edit one file → <strong>merge conflicts</strong> forever.</li>
          <li>You cannot <strong>reuse</strong> the tax logic without dragging SQL code along.</li>
        </ul>
        <Reveal summary="Interview trivia: what did Uncle Bob actually say? Click to reveal.">
          <p>His original wording: <em>"A class should have only one reason to change."</em> Later he clarified it
            as: <em>"Gather together the things that change for the same reasons. Separate those things that change
            for different reasons."</em> — and tied "reasons" to <strong>actors</strong>: a module should be
            responsible to one, and only one, actor. Quote that second version and the interviewer will sit up.</p>
        </Reveal>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Meet the god class (before)</h2>
        <p>Here is the classic SRP crime scene — it looks innocent, even "organized":</p>
        <Code html={`<span class="kw">public class</span> Invoice {
    <span class="kw">private</span> List&lt;LineItem&gt; items;

    <span class="cm">// job 1 — BUSINESS MATH (the accountant's territory)</span>
    <span class="kw">public double</span> calculateTotal() {
        <span class="kw">double</span> sum = <span class="num">0</span>;
        <span class="kw">for</span> (LineItem i : items) sum += i.price() * i.qty();
        <span class="kw">return</span> sum * <span class="num">1.18</span>;                 <span class="cm">// GST hard-coded… he will be back</span>
    }

    <span class="cm">// job 2 — PRESENTATION (the manager's territory)</span>
    <span class="kw">public void</span> printReport() {
        System.out.println(<span class="str">"=== INVOICE ==="</span>);   <span class="cm">// format will change monthly</span>
        <span class="kw">for</span> (LineItem i : items) System.out.println(i);
    }

    <span class="cm">// job 3 — STORAGE (the DBA's territory)</span>
    <span class="kw">public void</span> saveToDatabase() {
        Connection c = DriverManager.getConnection(<span class="str">"jdbc:mysql://…"</span>);
        <span class="cm">// SQL INSERT… schema will change too</span>
    }
}`} />
        <p>Three jobs, three masters, one file. Time to <em>feel</em> the pain instead of just reading about it:</p>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>😰 Play: Three teams, one poor class</h2>
        <p>Press the actor buttons — each one is a real change request arriving. Watch which code must be edited.
          Then switch to the <strong>SRP world</strong> and press the same buttons. Compare the blast radius.</p>
        <ChangeSimulator />
        <Good><strong>What you should notice:</strong> ① In the god-class world, every single request — tax, format,
          schema — edits the SAME class. ② In the SRP world each request lands in exactly one small class and the
          other two are never touched. ③ The total amount of code is the same! SRP doesn't shrink code — it
          <strong> sorts it by who changes it</strong>.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The refactor (after)</h2>
        <p>Split by reason-to-change. Each new class answers to exactly one actor:</p>
        <Code html={`<span class="cm">// 🧾 answers to the ACCOUNTANT only</span>
<span class="kw">public class</span> TaxCalculator {
    <span class="kw">private static final double</span> GST = <span class="num">0.18</span>;        <span class="cm">// named, in ONE place</span>
    <span class="kw">public double</span> totalWithTax(Invoice inv) {
        <span class="kw">return</span> inv.subTotal() * (<span class="num">1</span> + GST);
    }
}

<span class="cm">// 📊 answers to the MANAGER only</span>
<span class="kw">public class</span> ReportPrinter {
    <span class="kw">public void</span> print(Invoice inv) { <span class="cm">/* formatting only */</span> }
}

<span class="cm">// 🗄️ answers to the DBA only</span>
<span class="kw">public class</span> InvoiceRepository {
    <span class="kw">public void</span> save(Invoice inv) { <span class="cm">/* SQL only */</span> }
}

<span class="cm">// 🧱 and Invoice itself? It keeps ONE job: being a correct invoice —</span>
<span class="cm">// holding items and answering questions about its own data (subTotal()).</span>
<span class="kw">public class</span> Invoice {
    <span class="kw">private final</span> List&lt;LineItem&gt; items;
    <span class="kw">public double</span> subTotal() { <span class="cm">/* sum of my own items — my data, my math */</span> }
}`} />
        <p>Notice what did <strong>NOT</strong> happen: we did not strip Invoice down to a dumb data bag.
          <C>subTotal()</C> stays — summing <em>its own items</em> is Invoice's own job (Information Expert,
          Day 10). SRP splits by <em>actor</em>, never by "data here, behavior there".</p>
        <Warn><strong>The anemic-class trap:</strong> over-zealous SRP produces classes that are all getters with
          zero behavior, plus "Service" classes holding all the logic. That throws away encapsulation (Day 2).
          Keep behavior with the data it belongs to; split only where the <em>reasons to change</em> differ.</Warn>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🧰 Play: You do the split</h2>
        <p>Another god class just exploded into <C>TaxCalculator</C>, <C>ReportPrinter</C> and
          <C>InvoiceRepository</C>. Six orphaned methods need homes. For each, ask: <strong>"who would request a
          change to this?"</strong> — then click the class that answers to that actor.</p>
        <MethodSorter />
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>How to smell an SRP violation (the checklist)</h2>
        <ul>
          <li><strong>The "and" test:</strong> describe the class in one sentence. If you need "and" — "validates
            users <em>and</em> sends emails <em>and</em> logs" — each "and" is probably a separate class. (But "opens a
            connection and sends" is two <em>steps</em> of one job — see the nuance below.)</li>
          <li><strong>The name test:</strong> <C>Manager</C>, <C>Helper</C>, <C>Util</C>, <C>Processor</C>,
            <C>Handler</C> in a class name = the author couldn't name the single job, because there isn't one.</li>
          <li><strong>The import test:</strong> one class importing <C>java.sql</C> AND <C>java.awt</C> AND
            <C>javax.mail</C> serves three worlds at once.</li>
          <li><strong>The test-setup test:</strong> if unit-testing the tax math forces you to mock a database and
            an SMTP server, unrelated jobs are welded together.</li>
          <li><strong>The fear test:</strong> "I changed the report format and somehow payments broke" — the
            scream of a violated SRP.</li>
        </ul>
        <Note><strong>The nuance that separates juniors from seniors:</strong> multiple <em>steps</em> ≠ multiple
          <em>responsibilities</em>. EmailSender connecting + formatting + sending is ONE responsibility (deliver
          email) because all of it changes for the same reason. Count <strong>reasons</strong>, not verbs.</Note>
        <p>And SRP applies <strong>inside</strong> classes too — a method named <C>processOrder()</C> that
          validates, charges, updates stock, emails and prints is a god class in miniature. Extract each step into
          a well-named method.</p>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>👃 Play: The reviewer's smell test</h2>
        <p>Six class descriptions land on your code review. Some are fine, some are violations — and the tricky
          ones test the steps-vs-reasons nuance from Section 7. <strong>Predict, then click.</strong></p>
        <SmellTest />
        <Good><strong>What you should notice:</strong> ① "Does several steps" is fine; "serves several masters"
          is not. ② Data + its own guarding behavior (Money) is one responsibility — SRP and encapsulation are
          friends, not enemies. ③ Vague names (Helper, Manager) almost always hide violations.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — "One responsibility = one method"</h3>
        <p>No. <C>TaxCalculator</C> can have ten methods — GST, discounts, rounding — all serving one actor.
          Size is a hint, never the rule.</p>
        <h3>Trap 2 — Splitting into confetti</h3>
        <p><C>InvoiceSubTotaler</C>, <C>InvoiceLineCounter</C>, <C>InvoiceItemGetter</C>… now a tiny change opens
          ten files, and the logic lives in the wiring between them. If pieces always change together, merge them back.</p>
        <h3>Trap 3 — The anemic domain</h3>
        <p>Moving ALL behavior into <C>XxxService</C> classes leaves entities as naked data bags with public-ish
          getters everywhere — encapsulation (Day 2) dies. Behavior stays with its data; only <em>foreign</em>
          concerns (printing, storage) move out.</p>
        <h3>Trap 4 — Confusing SRP with "do one thing per layer"</h3>
        <p>SRP is not only about UI/logic/database layers. Two pieces of pure business logic can still violate SRP
          if different actors own them (tax rules vs discount campaigns).</p>
        <h3>Trap 5 — Refactoring without a trigger</h3>
        <p>Don't preemptively split everything "for SRP". Split when you can NAME two actors, or when change
          requests start colliding. Principles serve the code, not the other way around.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>SRP:</strong> one class = <strong>one reason to change</strong> = one <strong>actor</strong> it answers to. Not "one method"!</li>
          <li>Uncle Bob v2: <em>"Gather what changes for the same reasons; separate what changes for different reasons."</em></li>
          <li><strong>Smells:</strong> "and" in the description · Helper/Util/Manager names · imports from many worlds · tests need unrelated mocks · "I changed X and Y broke".</li>
          <li><strong>Steps ≠ responsibilities.</strong> Connect + send = one job. Count reasons, not verbs.</li>
          <li>Classic split: business math / presentation / storage — because accountant / manager / DBA.</li>
          <li>Keep behavior with its data (Information Expert) — SRP never means anemic data bags.</li>
          <li>Over-splitting is also a failure: confetti classes move complexity into the wiring.</li>
          <li>Applies to methods too: <C>processOrder()</C> doing five jobs → extract steps.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Recite BOTH official SRP formulations.">
          <p>v1: <em>"A class should have only one reason to change."</em> v2 (the actor version):
            <em> "A module should be responsible to one, and only one, actor."</em> Quoting v2 and defining
            actor = a group of people requesting changes is the difference between a memorized answer and an
            understood one.</p>
        </Reveal>
        <Reveal summary='Q: Is SRP just "high cohesion" with marketing?'>
          <p>Essentially yes — SRP is the cohesion rule (Day 17) sharpened with a measurable test: count
            ACTORS, not vibes. Functional cohesion = all members serve one responsibility = one reason to
            change. Saying "SRP operationalizes cohesion" earns senior points.</p>
        </Reveal>
        <Reveal summary='Q: "So every class should have one METHOD?" — the bait question.'>
          <p>No — SRP bounds REASONS TO CHANGE, not size. TaxCalculator with ten methods serving the accountant
            is perfect SRP; a three-method class serving three departments is a violation. Method-counting is
            the misunderstanding the interviewer is fishing for.</p>
        </Reveal>
        <Reveal summary="Q: What is the anemic domain model, and who called it an anti-pattern?">
          <p>Entities reduced to getters/setters with ALL behavior exiled to Service classes — Martin Fowler
            named it (2003). It's procedural code wearing objects; encapsulation dies and services become god
            classes. The fix: behavior moves back to the data it guards (Information Expert).</p>
        </Reveal>
        <Reveal summary="Q: Divergent change vs shotgun surgery — which one is the SRP violation?">
          <p><strong>Divergent change</strong> (one class edited for many unrelated reasons) = SRP violated in
            that class. Shotgun surgery (one reason scattered over many classes) = the mirror disease, usually a
            DRY/cohesion failure. Both from Fowler's smell catalog; mixing them up is common, distinguishing
            them is memorable.</p>
        </Reveal>
        <Reveal summary="Q: Does SRP apply above classes?">
          <p>Yes — it's fractal: methods (one job per method), classes, modules/packages, microservices
            (one bounded responsibility per service). "Gather what changes together; separate what changes
            apart" is scale-independent — same sentence, every level.</p>
        </Reveal>
        <Reveal summary="Q: How do you justify NOT splitting when an interviewer pushes SRP at you?">
          <p>Name the actor count: "both these behaviors change at the request of the same actor, so splitting
            adds files without removing any reason-to-change." Principles serve change-cost; if no second actor
            exists, the split is speculative (YAGNI). Defending a non-split with the actor test shows mastery,
            not laziness.</p>
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
        <strong>Day 11 complete?</strong> Homework: take this god class and refactor it in your IDE —
        <C>class Student</C> with <C>calculateGpa()</C>, <C>printTranscript()</C>, <C>saveToFile()</C>, and
        <C>sendResultEmail()</C>. Name the actor behind each method, split accordingly (keep <C>calculateGpa()</C>
        where the grades data lives — why?), and write a <C>main</C> that wires them together. One sentence per
        class: its single reason to change.
        <br /><br />
        Next: <strong>Day 12 — Open/Closed Principle</strong>: how to add brand-new features without editing
        (and re-breaking) code that already works — the principle that makes plugins possible.
      </div>
    </div>
  )
}
