import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The copy-paste bug multiplier ============ */
const COPY_FILES = [
  { f: 'Invoice.java', line: 'total = subTotal * 1.18;' },
  { f: 'QuoteGenerator.java', line: 'quote = base * 1.18;' },
  { f: 'RefundCalculator.java', line: 'refund = paid / 1.18;' },
  { f: 'EmailTemplate.java', line: '"...includes 18% GST"' },
]

function BugMultiplier() {
  const [world, setWorld] = useState('copy')
  const [fixed, setFixed] = useState([])
  const [shipped, setShipped] = useState(false)

  const reset = (w) => { setWorld(w); setFixed([]); setShipped(false) }
  const toggleFix = (f) => { if (!shipped) setFixed((arr) => (arr.includes(f) ? arr : [...arr, f])) }
  const missed = COPY_FILES.filter((c) => !fixed.includes(c.f))

  return (
    <div className="panel">
      <div className="ptitle">Live demo · 📰 BREAKING: government changes GST from 18% → 12%. Fix the codebase!</div>
      <div className="modbtns">
        <button className={world === 'copy' ? 'on' : ''} onClick={() => reset('copy')}>📋📋 copy-paste world</button>
        <button className={world === 'dry' ? 'on' : ''} onClick={() => reset('dry')}>🏜️ DRY world</button>
      </div>
      <p style={{ fontSize: 14, color: '#555', marginBottom: 10 }}>
        Click the file(s) you would edit, then ship.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {world === 'copy' ? (
          COPY_FILES.map((c) => (
            <div key={c.f} className="obj" onClick={() => toggleFix(c.f)}
              style={{ minWidth: 190, cursor: 'pointer', borderColor: fixed.includes(c.f) ? 'var(--green)' : undefined }}>
              <div className="oref">{c.f}</div>
              <div className="ofield" style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
                {fixed.includes(c.f) ? c.line.replace(/1\.18|18%/g, (m) => (m === '18%' ? '12%' : '1.12')) : c.line}
              </div>
              <div className="ofield">{fixed.includes(c.f) ? '✅ updated' : 'click to update'}</div>
            </div>
          ))
        ) : (
          <>
            <div className="obj" onClick={() => toggleFix('TaxRates.java')}
              style={{ minWidth: 220, cursor: 'pointer', borderColor: fixed.includes('TaxRates.java') ? 'var(--green)' : 'var(--blue)' }}>
              <div className="oref">TaxRates.java — THE one home</div>
              <div className="ofield" style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
                public static final double GST = {fixed.includes('TaxRates.java') ? '0.12' : '0.18'};
              </div>
              <div className="ofield">{fixed.includes('TaxRates.java') ? '✅ updated' : 'click to update'}</div>
            </div>
            {COPY_FILES.map((c) => (
              <div key={c.f} className="obj" style={{ minWidth: 160, opacity: 0.75 }}>
                <div className="oref">{c.f}</div>
                <div className="ofield" style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>uses TaxRates.GST</div>
                <div className="ofield" style={{ color: 'var(--green)' }}>auto-correct ✨</div>
              </div>
            ))}
          </>
        )}
      </div>
      <button className="act" onClick={() => setShipped(true)} disabled={shipped}>🚢 ship to production</button>
      {shipped && (
        <div className="statbar" style={{ display: 'block', background: (world === 'dry' ? fixed.includes('TaxRates.java') : missed.length === 0) ? '#EAF7EF' : '#FDECEC' }}>
          {world === 'copy'
            ? (missed.length === 0
              ? <span>😮‍💨 You found all 4 copies this time. But the NEXT person won't know there are four — this design relies on heroic memory.</span>
              : <span>💥 <b>PRODUCTION BUG.</b> You missed {missed.map((m) => m.f).join(', ')} — invoices now charge 12% but {missed[0].f.includes('Email') ? 'emails still say 18%' : 'other modules still use 18%'}. Customers are comparing numbers. Finance is calling. 📞</span>)
            : (fixed.includes('TaxRates.java')
              ? <span>🎉 <b>One edit, zero hunting.</b> Every module reads the single source of truth — the knowledge "GST = 12%" lives in exactly one home.</span>
              : <span>🤔 You shipped without changing anything — the rate is still 18% everywhere. At least it's consistently wrong! Click the constant and re-ship.</span>)}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 2: The KISS solution picker ============ */
const SOLUTIONS = {
  simple: {
    label: '🙂 the simple loop',
    code: `<span class="kw">double</span> total = <span class="num">0</span>;
<span class="kw">for</span> (Item i : cart) {
    total += i.price();
}
<span class="kw">return</span> total;`,
    rows: { lines: '5', read: '5 seconds', fits: '✔ exactly', risk: 'almost none' },
    verdict: '✅ Boring, obvious, correct. The new teammate reads it once and moves on. Boring is a compliment in code review.',
    good: true,
  },
  clever: {
    label: '😎 the clever one-liner',
    code: `<span class="kw">return</span> cart.stream()
    .mapToDouble(Item::price)
    .sum();`,
    rows: { lines: '3', read: '20 seconds (if they know streams)', fits: '✔ exactly', risk: 'low' },
    verdict: '🙂 Also fine — streams are idiomatic Java for exactly this. KISS does not mean "avoid modern features"; it means no EXTRA machinery. Pick whichever your team reads fastest.',
    good: true,
  },
  enterprise: {
    label: '🏗️ the enterprise edition',
    code: `TotalContext ctx = <span class="kw">new</span> TotalContextBuilder()
    .withAggregationStrategy(strategyFactory.create(<span class="str">"SUM"</span>))
    .withCurrencyResolver(<span class="kw">new</span> DefaultCurrencyResolverProxy())
    .build();
<span class="kw">return new</span> AbstractTotalVisitor(ctx).visit(cart).resolve();`,
    rows: { lines: '5 (+ 9 support classes 😱)', read: '45 minutes + a diagram', fits: '…it also "supports" 12 things nobody asked for', risk: 'high — 9 extra classes to break' },
    verdict: '🚨 The requirement was "sum the prices". This solves a future that does not exist, behind 9 files of indirection. Patterns are tools, not trophies.',
    good: false,
  },
}

function SolutionPicker() {
  const [pick, setPick] = useState('simple')
  const s = SOLUTIONS[pick]
  return (
    <div className="panel">
      <div className="ptitle">Live demo · requirement: "return the total price of the cart" — choose an implementation</div>
      <div className="modbtns">
        {Object.entries(SOLUTIONS).map(([k, v]) => (
          <button key={k} className={pick === k ? 'on' : ''} onClick={() => setPick(k)}>{v.label}</button>
        ))}
      </div>
      <Code html={s.code} />
      <table className="matrix">
        <tbody>
          <tr><td>lines of code</td><td>{s.rows.lines}</td></tr>
          <tr><td>new teammate understands in</td><td>{s.rows.read}</td></tr>
          <tr><td>solves the actual requirement?</td><td>{s.rows.fits}</td></tr>
          <tr><td>surface area for bugs</td><td>{s.rows.risk}</td></tr>
        </tbody>
      </table>
      <div className="statbar" style={{ background: s.good ? '#EAF7EF' : '#FDECEC' }}>
        <span>{s.verdict}</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: Name the violation ============ */
const VIOLATION_ITEMS = [
  { d: 'The shipping-cost formula (weight * 5 + 30) appears in CheckoutService, in the admin panel, and in the customer email generator.',
    a: 'dry', why: 'One piece of business knowledge, three homes. When shipping prices change, someone WILL miss one. Extract ShippingCost.calculate(weight) — one authoritative home.' },
  { d: 'The app needs to email a daily report. The developer builds a NotificationDispatcherFramework with plugin discovery, retry queues, and support for Slack, SMS and carrier pigeons — "we might need them".',
    a: 'yagni', why: 'The requirement is one email, once a day. Everything beyond that is built on imagination, and every unused branch must still be maintained, tested and understood. Build the email; add Slack when Slack is asked for.' },
  { d: 'isAdult() is implemented as: return ((age >> 31) | ((18 - age - 1) >> 31) & 1) == 1; — "it avoids a branch!"',
    a: 'kiss', why: 'return age >= 18; does the same job and every human reads it instantly. Cleverness you must decode is a cost paid by every future reader — and the JIT compiler did not need your help.' },
  { d: 'Signup checks age >= 18 (legal contract age). The car-rental module also checks age >= 18 (rental policy). A reviewer says: "duplicate! merge into one AgeCheck."',
    a: 'fine', why: 'FALSE duplication — the code looks identical but the KNOWLEDGE differs: contract law vs company rental policy. They can change independently (rental could become 21). Merging couples two actors (Day 11!) into one constant. Leave them separate.' },
  { d: 'A config loader is one 700-character line: nested ternaries inside a chained Optional.map().filter().orElseGet() with three lambdas.',
    a: 'kiss', why: 'It may even be correct — but nobody can review, debug, or safely change it. Unroll it into named steps. Code is read 10× more often than it is written; optimize for the reader.' },
  { d: 'The app manages exactly one entity (Invoice), but the codebase has GenericRepository<T, ID>, EntityMapper<T, DTO>, and an AbstractCrudServiceFactory — "so adding entity #2 will be easy someday".',
    a: 'yagni', why: 'Generic machinery for a population of one. If entity #2 ever arrives, THAT is the moment to generalize (rule of three!). Until then this is scaffolding around an empty lot.' },
]
const VIOLATION_CHOICES = [['dry', '📋 DRY violation'], ['kiss', '🌀 KISS violation'], ['yagni', '🔮 YAGNI violation'], ['fine', '✅ actually fine']]

function ViolationGame() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= VIOLATION_ITEMS.length
  const cur = VIOLATION_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the code-review lightning round — name the disease</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {VIOLATION_ITEMS.length}</b>{score === VIOLATION_ITEMS.length ? ' — your watchdogs are trained.' : '. The "actually fine" one catches most people — re-read Section 4.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            🩺 <span>case {idx + 1} of {VIOLATION_ITEMS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.d}</p>
          <div className="modbtns">
            {VIOLATION_CHOICES.map(([k, label]) => (
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
                <button className="ghost act" onClick={next}>Next case →</button>
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
  { q: 'DRY, properly stated, says every piece of ______ must have exactly one authoritative home.',
    o: ['code', 'knowledge (a rule, a rate, a format)', 'class', 'comment'], a: 1,
    e: 'DRY is about KNOWLEDGE, not keystrokes. "GST is 18%" is one fact — it must live in one place. Two similar-looking code blocks encoding DIFFERENT facts are not a DRY violation.' },
  { q: 'Why is copy-pasted business logic dangerous?',
    o: ['It uses more disk space', 'When the rule changes, every copy must be found and updated — miss one and the system silently disagrees with itself', 'The compiler warns about it', 'It runs slower'], a: 1,
    e: 'The bug is not today — it is the future edit that updates 3 of 4 copies. The system then gives different answers in different screens, which users notice before you do.' },
  { q: 'Signup requires age ≥ 18 (contract law) and car rental requires age ≥ 18 (company policy). Merging them into one shared AgeCheck is…',
    o: ['Required by DRY', 'Wrong — false duplication: identical code, different knowledge, different reasons to change', 'A KISS violation', 'Required by SOLID'], a: 1,
    e: 'They match by coincidence. Rental policy could become 21 tomorrow; contract law won\'t. Merging welds two actors together — un-DRY-ing later is harder than tolerating the lookalike now.' },
  { q: 'The "rule of three" for duplication says…',
    o: ['Never write a function under 3 lines', 'Tolerate the 2nd copy with an itch; by the 3rd, the shared knowledge is proven — extract it then', 'Delete every 3rd class', 'Three interfaces per class'], a: 1,
    e: 'Same instinct as Day 12\'s fool-me-once rule: let real repetition prove itself before you build the abstraction — three real examples shape a far better one than one example plus imagination.' },
  { q: 'KISS\'s main argument against "clever" code is…',
    o: ['Clever code always has bugs', 'Code is read far more often than written — every decoding cost is paid by every future reader (including you in 6 months)', 'Java forbids bit tricks', 'Short code is always better'], a: 1,
    e: 'The one-time thrill of writing it is paid back as a permanent tax on everyone who must read, review, debug and modify it. Boring and obvious wins.' },
  { q: 'YAGNI says don\'t build the plugin system "we might need someday" because…',
    o: ['Plugins are bad design', 'Unused flexibility still costs: it must be designed, tested, understood and maintained — and guesses about the future are usually wrong anyway', 'It would violate DRY', 'Java has no plugins'], a: 1,
    e: 'Code you carry but don\'t use is inventory, not asset. And when "someday" finally comes, the real requirement is usually different from the guess — so you pay twice.' },
  { q: 'Does YAGNI forbid Day 15\'s practice of putting interfaces at the database/email boundaries?',
    o: ['Yes — all abstraction is YAGNI', 'No — boundaries to volatile infrastructure are KNOWN change-points (and needed for testing today); YAGNI targets imagined features, not proven seams', 'Yes, unless using Spring', 'YAGNI only applies to UI code'], a: 1,
    e: 'YAGNI is about speculation. A DB boundary is not speculative: you need the seam TODAY for tests, and infra is a historically proven axis of change. Speculative = the 5-language plugin engine for an app with one user.' },
  { q: 'The healthiest way to see DRY/KISS/YAGNI next to SOLID is…',
    o: ['They replace SOLID', 'As counterweights: SOLID pushes toward structure and abstraction; these three push back against doing it where it isn\'t earned — good design balances the two', 'They contradict each other, pick one', 'They only apply to scripts'], a: 1,
    e: 'Every SOLID move (split a class, carve an interface) has a complexity cost. DRY/KISS/YAGNI are the referees asking "is this structure paid for by a real need?" Design lives in that tension.' },
]

/* ============ The page ============ */
export default function Day16() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 4 · Day 16</div>
        <h1>DRY, KISS &amp; YAGNI:<br />The Three Kitchen Rules</h1>
        <p>Welcome to Week 4 — Beyond SOLID. Last week gave you power tools; this week teaches judgment.
           Today: the three everyday habits that decide whether your SOLID knowledge produces clean code or
           over-engineered soup. Click everything.</p>
        <div className="chips">
          {['DRY', 'KISS', 'YAGNI', 'single source of truth', 'rule of three', 'over-engineering'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The sensible chef</h2>
        <p>Picture a small restaurant kitchen run by a <strong>sensible chef</strong>. Three house rules keep it
          sane:</p>
        <ul>
          <li><strong>One recipe card per dish.</strong> The biryani recipe exists ONCE, on one card. When the
            recipe improves, you update one card — not five sticky notes scattered around the kitchen that
            now disagree. That is <strong>DRY</strong>.</li>
          <li><strong>Don't build a 12-burner rig to fry one omelette.</strong> The simplest setup that cooks the
            dish well. That is <strong>KISS</strong>.</li>
          <li><strong>No pasta machine "because someday".</strong> Buy it the week pasta goes on the menu — not
            before, while it gathers dust and blocks the counter. That is <strong>YAGNI</strong>.</li>
        </ul>
        <Code html={`   THE THREE WATCHDOGS (they bark at different smells)

   DRY    📋  "Don't Repeat Yourself"        every piece of KNOWLEDGE
              one recipe card per dish        has exactly ONE home

   KISS   🍳  "Keep It Simple"               the simplest design that
              one pan for one omelette        does today's job WELL

   YAGNI  🔮  "You Aren't Gonna Need It"     build it when it's REAL,
              no pasta machine 'someday'      not when it's imagined

   SOLID says: structure it well.  These three add: …and only where it's earned.`} />
        <Note><strong>Why this day comes right after SOLID:</strong> fresh SOLID knowledge is dangerous — everything
          looks like it needs an interface and four classes. DRY/KISS/YAGNI are the counterweights. Mastery is
          knowing when NOT to use the power tools.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>DRY — one home per piece of knowledge</h2>
        <p>The precise definition (from <em>The Pragmatic Programmer</em>): <em>"Every piece of knowledge must have
          a single, unambiguous, authoritative representation within a system."</em> Note the word —
          <strong> knowledge</strong>, not code. "GST is 18%" is knowledge. "Orders over ₹500 ship free" is
          knowledge. Each fact gets ONE home:</p>
        <Code html={`<span class="cm">// ❌ the fact "GST = 18%" lives in FOUR places (it WILL drift apart)</span>
<span class="cm">// Invoice.java:          total = subTotal * 1.18;</span>
<span class="cm">// QuoteGenerator.java:   quote = base * 1.18;</span>
<span class="cm">// RefundCalculator.java: refund = paid / 1.18;</span>
<span class="cm">// EmailTemplate.java:    "...includes 18% GST"</span>

<span class="cm">// ✅ one authoritative home; everyone else asks it</span>
<span class="kw">public final class</span> TaxRates {
    <span class="kw">public static final double</span> GST = <span class="num">0.18</span>;     <span class="cm">// THE fact, once</span>
    <span class="kw">public static double</span> withGst(<span class="kw">double</span> amt) { <span class="kw">return</span> amt * (<span class="num">1</span> + GST); }
}`} />
        <p>Why copy-paste is a time bomb and not a style issue: the day the rate changes, someone must find
          <strong> every</strong> copy. They will find most. The system then <strong>disagrees with itself</strong> —
          the invoice says one number, the email another. Users find these bugs before you do.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>💣 Play: The GST change request</h2>
        <p>The government just cut GST to 12%. Update the codebase and ship — in both worlds. (In copy-paste
          world, try shipping after fixing only two or three files. Be honest — that's what happens at 6 pm on
          a Friday.)</p>
        <BugMultiplier />
        <Good><strong>What you should notice:</strong> ① In copy-paste world, correctness depends on a human
          remembering all four hiding spots — forever, for every future change. ② In DRY world the change is one
          edit, and it is <em>impossible</em> to miss a copy because there are no copies. ③ The email template is
          the sneakiest copy — knowledge hides in strings, configs and docs too, not just formulas.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The DRY nuance that separates seniors: FALSE duplication</h2>
        <p>Now the twist most blog posts skip. Look at these two:</p>
        <Code html={`<span class="cm">// signup module — legal contract age</span>
<span class="kw">if</span> (user.age() < <span class="num">18</span>) <span class="kw">throw new</span> TooYoungException();

<span class="cm">// car-rental module — company rental policy</span>
<span class="kw">if</span> (driver.age() < <span class="num">18</span>) <span class="kw">throw new</span> TooYoungException();`} />
        <p>Identical code! Merge them? <strong>No.</strong> The code matches by <em>coincidence</em>, but the
          <strong> knowledge differs</strong>: contract law vs rental policy. The day the company decides renters
          must be 21, you want to change one rule without touching the other. Merging them welds two
          <strong> different actors</strong> (Day 11!) to one constant.</p>
        <Warn><strong>The test before de-duplicating:</strong> ask "if one of these changes, MUST the other change
          with it, always?" Yes → same knowledge → DRY it. No → lookalikes → leave them apart. Duplication is
          cheaper than the wrong abstraction.</Warn>
        <Reveal summary="The rule of three (when to extract) — click to reveal.">
          <p>First occurrence: write it. Second: tolerate the copy, feel the itch. Third: the knowledge is proven
            shared — NOW extract one home for it. Same instinct as Day 12's fool-me-once rule, applied to
            duplication. Three real call sites shape a far better abstraction than one real one plus two
            imagined.</p>
        </Reveal>
        <p>And DRY reaches beyond formulas: validation rules duplicated between frontend and backend, the same
          magic string <C>"PENDING"</C> typed in nine files (use an enum — Day 19!), table schemas re-described
          in three layers. Wherever knowledge has two homes, the homes will drift.</p>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>KISS — the reader is the customer</h2>
        <p><strong>Keep It Simple</strong> rests on one economic fact: <strong>code is read 10× more often than it
          is written.</strong> Every clever trick is written once and decoded hundreds of times — by reviewers,
          debuggers at 2 am, new teammates, and you in six months (who is, practically speaking, a new teammate).</p>
        <Code html={`<span class="cm">// ❌ "look how smart I am"</span>
<span class="kw">return</span> ((age >> <span class="num">31</span>) | ((<span class="num">18</span> - age - <span class="num">1</span>) >> <span class="num">31</span>) & <span class="num">1</span>) == <span class="num">1</span>;

<span class="cm">// ✅ "look how DONE we are"</span>
<span class="kw">return</span> age >= <span class="num">18</span>;`} />
        <p>What KISS is <strong>not</strong>: it is not "avoid streams/generics/patterns". Idiomatic modern code
          your team reads fluently IS simple. KISS bans <em>extra machinery</em> — layers, indirection and
          generality that today's job doesn't need. Simple ≠ primitive; simple = nothing left to remove.</p>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🍳 Play: Three ways to sum a cart</h2>
        <p>Same requirement, three implementations. Click through and watch the "new teammate" metrics. One of
          them is a trick question — two answers are acceptable.</p>
        <SolutionPicker />
        <Good><strong>What you should notice:</strong> ① The loop and the stream are both fine — KISS is about
          machinery, not line count or language features. ② The enterprise edition isn't "more professional";
          it is 9 extra files of surface area for bugs, solving requirements nobody made. ③ "Boring" in code
          review is praise.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>YAGNI — build it when it's real</h2>
        <p><strong>You Aren't Gonna Need It</strong>: do not build features, flexibility or generality for
          <em> imagined</em> future needs. Two reasons, both backed by every veteran's scars:</p>
        <ul>
          <li><strong>Unused code is inventory, not asset.</strong> The speculative plugin system must still be
            designed, tested, documented, understood by every reader, and dragged through every refactor —
            while serving zero users.</li>
          <li><strong>The guess is usually wrong.</strong> When "someday" arrives, the real requirement differs
            from the imagined one — so you pay to build it, pay to carry it, then pay to rebuild it.</li>
        </ul>
        <p><strong>But careful — YAGNI is about speculation, not about seams.</strong> Day 15 told you to put
          interfaces at the database and email boundaries. Is that YAGNI-guilty? No:</p>
        <table className="matrix">
          <thead>
            <tr><th>decision</th><th>verdict</th><th>why</th></tr>
          </thead>
          <tbody>
            <tr><td>OrderStore interface at the DB boundary</td><td className="yes">build it</td><td>needed TODAY for tests; infra is a proven change-axis</td></tr>
            <tr><td>multi-currency engine for an INR-only app</td><td className="no">YAGNI</td><td>imagined requirement; no user asked</td></tr>
            <tr><td>config flag for a behavior with 2 real variants</td><td className="yes">build it</td><td>both variants exist now</td></tr>
            <tr><td>plugin loader "so others can extend us someday"</td><td className="no">YAGNI</td><td>zero plugin authors exist</td></tr>
          </tbody>
        </table>
        <Note><strong>The one-question YAGNI test:</strong> "what breaks TODAY if I don't build this?" Nothing →
          don't build it. A test you can't write, a requirement on the sprint board → build it.</Note>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🩺 Play: Name the disease</h2>
        <p>Six code-review cases. Diagnose each: DRY, KISS, YAGNI — or actually fine. The "fine" one tests
          Section 4's nuance. <strong>Predict, then click.</strong></p>
        <ViolationGame />
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 When the principles fight (and who referees)</h2>
        <h3>DRY vs KISS</h3>
        <p>Extracting a shared helper used by 14 modules can create a dependency magnet whose every change scares
          everyone. Sometimes two small local copies of TRIVIAL code are simpler than one shared home with config
          flags for each caller's quirks. Knowledge → DRY it. Trivial lookalike mechanics → maybe let them be.</p>
        <h3>YAGNI vs OCP/DIP</h3>
        <p>"Add a slot for the future!" vs "you aren't gonna need it" — resolved by evidence (Day 12's
          fool-me-once + Day 15's boundary list): proven or scheduled change → slot; pure imagination → YAGNI.</p>
        <h3>DRY vs YAGNI</h3>
        <p>Building a generic deduplication framework to remove two copies… is YAGNI wearing a DRY costume.
          The cure for two copies is one function, not a framework.</p>
        <h3>The referee</h3>
        <p>When habits collide, ask the only question that never lies: <strong>"which choice makes the NEXT
          change cheaper?"</strong> Not prettier, not more impressive — cheaper to change. That is the whole
          game, and it has been since Day 1.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>DRY:</strong> every piece of <strong>knowledge</strong> (rule, rate, format) has ONE authoritative home. Copies drift; the system starts disagreeing with itself.</li>
          <li><strong>False duplication:</strong> identical code ≠ identical knowledge. Test: "must they always change together?" No → don't merge. Duplication beats the wrong abstraction.</li>
          <li><strong>Rule of three:</strong> 1st write · 2nd itch · 3rd extract. Knowledge hides in strings, configs and templates too.</li>
          <li><strong>KISS:</strong> code is read 10× more than written — optimize for the reader. Simple = no extra machinery, NOT "no modern features". Boring is praise.</li>
          <li><strong>YAGNI:</strong> unused flexibility is inventory you maintain. Test: "what breaks today without it?" Speculation → skip; proven seams (DB/clock boundaries, scheduled features) → build.</li>
          <li><strong>The trio vs SOLID:</strong> SOLID = structure well; DRY/KISS/YAGNI = only where it's earned. Referee question: which choice makes the next change cheaper?</li>
        </ul>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 16 complete?</strong> Homework: a code audit, not a build. Take your biggest homework project
        so far (the Day 15 ReportApp or Day 12 ShippingCalculator) and hunt: ① one piece of knowledge living in
        two places — give it one home; ② one spot where you over-built — delete the unused flexibility (yes,
        delete!); ③ one clever line — rewrite it boring. Write one sentence per fix naming the principle. Deleting
        code you were proud of is the day's real lesson.
        <br /><br />
        Next: <strong>Day 17 — Coupling &amp; Cohesion</strong>: the two underlying forces that every principle
        this month has secretly been about — measured, named, and finally seen directly.
      </div>
    </div>
  )
}
