import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The double-money disaster ============ */
function DoubleDisaster() {
  const [world, setWorld] = useState('double')
  const [log, setLog] = useState([])

  function run(op) {
    let line
    if (world === 'double') {
      if (op === 'add') line = `0.1 + 0.2                    →  ${0.1 + 0.2}   😱 not 0.3!`
      if (op === 'ten') line = `₹0.10 added ten times        →  ${(0.1 * 10 === 1.0 ? '1.0' : Array(10).fill(0.1).reduce((a, b) => a + b))}   😱 a paisa evaporated`
      if (op === 'mix') line = `$100.00 + ₹100.00            →  200.0   😱😱 it ADDED DOLLARS TO RUPEES`
    } else {
      if (op === 'add') line = `Money.inr(0.10).plus(Money.inr(0.20))  →  ₹0.30 exactly ✅ (BigDecimal inside)`
      if (op === 'ten') line = `₹0.10 × 10                              →  ₹1.00 exactly ✅`
      if (op === 'mix') line = `usd100.plus(inr100)  →  💥 CurrencyMismatchException: USD + INR — refused loudly ✅`
    }
    setLog((l) => [...l.slice(-3), line])
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the same three operations, in two type systems</div>
      <div className="modbtns">
        <button className={world === 'double' ? 'on' : ''} onClick={() => { setWorld('double'); setLog([]) }}>😱 double world</button>
        <button className={world === 'money' ? 'on' : ''} onClick={() => { setWorld('money'); setLog([]) }}>💎 Money world</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => run('add')}>0.1 + 0.2</button>
        <button className="act" onClick={() => run('ten')}>add ₹0.10 ten times</button>
        <button className="act" onClick={() => run('mix')}>$100 + ₹100</button>
      </div>
      <div className="statbar" style={{ display: 'block', background: world === 'double' ? '#FDECEC' : '#EAF7EF' }}>
        {log.length === 0
          ? <span>Press the buttons. In double-world, look very closely at the decimals…</span>
          : log.map((l, i) => <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{l}</div>)}
      </div>
    </div>
  )
}

/* ============ Interactive 2: Banknote vs passport (identity vs value) ============ */
function IdentityLab() {
  const [overridden, setOverridden] = useState(false)
  const [result, setResult] = useState(null)

  function compare(kind, op) {
    if (op === '==') {
      setResult({ kind, op, val: false, why: kind === 'note'
        ? 'Two SEPARATE objects in the heap (Day 1!) — == compares addresses, and these are different houses. == is ALWAYS the wrong tool for values.'
        : 'Different objects → false. For once == agrees with the right answer, but for the wrong reason.' })
    } else {
      if (kind === 'note') {
        setResult({ kind, op, val: overridden,
          why: overridden
            ? 'equals() compares CONTENT: ₹100 == ₹100, INR == INR → true. Any ₹100 note is as good as any other — that is what makes it a VALUE.'
            : 'WITHOUT overriding equals(), Java inherited Object.equals() — which compares ADDRESSES, same as ==. Your "value object" doesn\'t act like a value yet! Flip the toggle.' })
      } else {
        setResult({ kind, op, val: false,
          why: 'Same name, same photo — still FALSE, and that is CORRECT: passports identify PEOPLE. Two different people named Asha must never be "equal". Entities compare by ID, not by content.' })
      }
    }
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · what should "equal" mean?</div>
      <div className="modbtns">
        <button className={!overridden ? 'on' : ''} onClick={() => { setOverridden(false); setResult(null) }}>Money WITHOUT equals() override</button>
        <button className={overridden ? 'on' : ''} onClick={() => { setOverridden(true); setResult(null) }}>Money WITH equals() override</button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
        <div className="obj" style={{ minWidth: 170 }}>
          <div className="oref">a → Money@1a2b</div>
          <div className="ofield">amount = 100.00</div>
          <div className="ofield">currency = INR</div>
        </div>
        <div className="obj" style={{ minWidth: 170 }}>
          <div className="oref">b → Money@9f3c</div>
          <div className="ofield">amount = 100.00</div>
          <div className="ofield">currency = INR</div>
        </div>
        <div className="obj" style={{ minWidth: 170 }}>
          <div className="oref">p1 → Passport@77aa</div>
          <div className="ofield">name = "Asha"</div>
          <div className="ofield">passportNo = P-123</div>
        </div>
        <div className="obj" style={{ minWidth: 170 }}>
          <div className="oref">p2 → Passport@88bb</div>
          <div className="ofield">name = "Asha"</div>
          <div className="ofield">passportNo = P-987</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => compare('note', '==')}>a == b ?</button>
        <button className="act" onClick={() => compare('note', 'equals')}>a.equals(b) ?</button>
        <button className="ghost act" onClick={() => compare('passport', 'equals')}>p1.equals(p2) ?</button>
      </div>
      {result && (
        <div className="statbar" style={{ display: 'block' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
            → <b>{String(result.val)}</b>
          </div>
          <div style={{ marginTop: 4 }}>{result.why}</div>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: Wrap it or leave it? ============ */
const WRAP_ITEMS = [
  { d: 'double accountBalance — added, compared and persisted all over the banking module.',
    a: 'wrap', why: 'Money is THE canonical value object: binary doubles can\'t represent 0.10 exactly, and a bare number can\'t refuse "USD + INR". Wrap as Money(BigDecimal, Currency).' },
  { d: 'String email — with if (email.contains("@")) checks copy-pasted in 7 places.',
    a: 'wrap', why: 'Validation scattered 7× is the smell (DRY, Day 16). An Email type validates ONCE in its constructor — after that, holding an Email IS the proof it\'s valid ("parse, don\'t validate").' },
  { d: 'int itemCount — the number of lines in an order.',
    a: 'fine', why: 'A count is genuinely just a number: no units to confuse, no format to validate, no pair of fields traveling together. Wrapping it adds ceremony, not safety (Day 16\'s KISS).' },
  { d: 'String customerId and String orderId — both passed through service methods, often side by side.',
    a: 'wrap', why: 'Two Strings are swappable silently: refund(orderId, customerId) vs refund(customerId, orderId) both compile! Tiny CustomerId / OrderId types make the mix-up a compile error.' },
  { d: 'double latitude, double longitude — passed as two separate parameters across the routing module.',
    a: 'wrap', why: 'Two values that only mean something TOGETHER, in a fixed order humans constantly flip. Coordinates(lat, lon) travels as one unit — the Mars-orbiter class of bug, prevented by a type.' },
  { d: 'LocalDate birthDate — for age calculations.',
    a: 'fine', why: 'Trick question: LocalDate already IS a value object — immutable, value-equal, validated (no Feb 30). The JDK shipped it so you don\'t wrap dates yourself. Recognizing existing VOs counts as using them.' },
]

function WrapGame() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= WRAP_ITEMS.length
  const cur = WRAP_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · primitive obsession patrol — wrap it, or leave it alone?</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {WRAP_ITEMS.length}</b>{score === WRAP_ITEMS.length ? ' — perfectly calibrated wrapping instincts.' : '. Wrap where rules/units/pairs exist; leave plain numbers plain.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            🔍 <span>candidate {idx + 1} of {WRAP_ITEMS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'IBM Plex Mono' }}>{cur.d}</p>
          <div className="modbtns">
            <button className={picked !== null && cur.a === 'wrap' ? 'on' : ''}
              style={picked === 'wrap' && cur.a !== 'wrap' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('wrap')}>💎 wrap it in a value object</button>
            <button className={picked !== null && cur.a === 'fine' ? 'on' : ''}
              style={picked === 'fine' && cur.a !== 'fine' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('fine')}>👍 leave it as is</button>
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ Correct! ' : '❌ Not quite. '}
              {cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={next}>Next candidate →</button>
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
  { q: 'The core difference between an ENTITY and a VALUE OBJECT is…',
    o: ['Entities have identity (WHICH one matters, compared by id); value objects are interchangeable content (compared by value)', 'Entities are bigger', 'Value objects live in the database', 'Entities are immutable'], a: 0,
    e: 'Customer #42 stays Customer #42 even after changing address (passport). Any ₹100 equals any other ₹100 (banknote). Identity vs content — that one question classifies every class in your model.',
    w: { 1: 'Size is irrelevant — a tiny class can be an entity, a big one a value.',
         2: 'Both can be persisted.',
         3: 'Backwards — VALUES are the immutable ones; entities change over time.' },
    r: { id: 's1', label: 'Section 1 — banknote vs passport' } },
  { q: 'Why must money never be a double?',
    o: ['Doubles are too small', 'Doubles cannot be printed', 'Binary floating point cannot represent most decimal fractions exactly — 0.1 + 0.2 ≠ 0.3 — and bare numbers happily add dollars to rupees', 'Java deprecated double'], a: 2,
    e: 'Two diseases at once: rounding (use BigDecimal inside a Money type) and unit blindness (the Currency field + a guard makes USD + INR throw instead of silently summing).',
    w: { 0: 'double\'s RANGE is huge — its decimal PRECISION is the problem.',
         1: 'Doubles print fine; they just print the wrong 17th decimal.',
         3: 'double is alive and well — for physics, not for money.' },
    r: { id: 's3', label: 'Section 3 — the double disaster' } },
  { q: 'You put a Money object in a HashMap as a key, then look it up with an equal-valued new Money. It is FOUND only if…',
    o: ['The map is small', 'The class overrides BOTH equals() AND hashCode() consistently', 'You use == somewhere', 'Money is declared final'], a: 1,
    e: 'HashMap first finds the bucket via hashCode(), then confirms with equals(). Override only equals and the lookup dies in the wrong bucket. The contract: equal objects MUST have equal hash codes — override them as a pair, always.',
    w: { 0: 'Map size doesn\'t rescue a wrong bucket.',
         2: '== never helps content lookups.',
         3: 'final is about subclassing safety — different concern.' },
    r: { id: 's5', label: 'Section 5 — equals & hashCode' } },
  { q: 'Why must value objects be IMMUTABLE?',
    o: ['Java requires it', 'To save memory', 'Immutable objects are faster', 'They are shared freely and used as map keys — if a shared/keyed value mutates, every holder changes behind their back and hash lookups break'], a: 3,
    e: 'A value is like the number 7 — you can\'t "modify 7". Operations return NEW values (price.plus(tax)), exactly the Day 2 immutability rules. Mutable "values" corrupt every place that shared them.',
    w: { 0: 'No language mandate exists — it\'s a design necessity.',
         1: 'Memory is unchanged.',
         2: 'Performance is a side bonus, not the reason.' },
    r: { id: 's5', label: 'Section 5 — why values must be immutable' } },
  { q: 'What does a Java record (record Money(BigDecimal amount, Currency currency)) give you for free?',
    o: ['Final fields, constructor, equals(), hashCode() and toString() — a value object in one line (you add validation in the compact constructor)', 'Inheritance from other records', 'Setters and a default constructor', 'Database persistence'], a: 0,
    e: 'Records ARE Java\'s value-object shorthand: immutable by construction, value-equal by default. You still write the compact constructor for guards (amount != null, scale rules) and your domain methods (plus, times).',
    w: { 1: 'Records can\'t extend classes (they extend Record) — only implement interfaces.',
         2: 'Records have NO setters by design — that\'s the point.',
         3: 'Persistence is a separate concern.' },
    r: { id: 's7', label: 'Section 7 — records' } },
  { q: '"Parse, don\'t validate" means…',
    o: ['Never check inputs', 'Validate in every method, every time', 'Convert raw input into a TYPE (new Email(s)) at the boundary — once constructed, the type is PROOF of validity, and downstream re-checks disappear', 'Use regex everywhere'], a: 2,
    e: 'The String→Email conversion happens once, at the door (failing fast, Day 19). After that, every method receiving an Email knows it\'s valid — by type, not by trust.',
    w: { 0: 'Checks happen — ONCE, at construction, instead of never.',
         1: 'Re-validating everywhere is exactly what the technique eliminates.',
         3: 'Regex may be the tool; the principle is WHERE validation lives.' },
    r: { id: 's7', label: 'Section 7 — parse, don\'t validate' } },
  { q: 'bookFlight(String from, String to, String date) was called as bookFlight(date, to, from). What happens, and what fixes it?',
    o: ['Compile error already', 'Java reorders them', 'A unit test is the only fix', 'It compiles and books garbage — typed parameters (Airport, Airport, FlightDate) turn the swap into a compile error'], a: 3,
    e: 'Three Strings are indistinguishable to the compiler — argument swaps are invisible. Distinct types make the signature self-checking. (This is the everyday version of the Mars orbiter\'s unit mix-up.)',
    w: { 0: 'Identical types = no compile error — that\'s the entire trap.',
         1: 'Java never reorders arguments.',
         2: 'Tests help, but a compile error at the call site is cheaper and earlier.' },
    r: { id: 's2', label: 'Section 2 — primitive obsession' } },
  { q: 'Which is NOT a good reason to create a value object?',
    o: ['Units/currency could be confused', 'Wrapping every int and String in the codebase for "purity"', 'Validation rules exist (email format)', 'Several fields always travel together (lat+lon)'], a: 1,
    e: 'Wrap where rules, units or grouping exist. An itemCount int is fine. Blanket-wrapping is primitive-obsession\'s mirror disease — ceremony without safety (KISS, Day 16).',
    w: { 0: 'Unit confusion (Mars!) is the second textbook reason.',
         2: 'Email validation is the textbook wrap reason.',
         3: 'Fields traveling together (lat+lon) is the third.' },
    r: { id: 's8', label: 'Section 8 — wrap or leave it' } },
]

/* ============ The page ============ */
export default function Day20() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 4 · Day 20 · FINALE</div>
        <h1>Value Objects:<br />The Banknote, Not the Passport</h1>
        <p>The final day of Month 1 — and the smallest big idea in domain modeling. Why <C>double</C> money has
           crashed real spacecraft-grade systems, why <C>String</C> email is a lie waiting to be told, and the
           tiny immutable classes that fix both. Click everything, then go collect your month-one badge.</p>
        <div className="chips">
          {['value object', 'entity vs value', 'primitive obsession', 'equals/hashCode', 'records', 'parse don\'t validate'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The banknote and the passport</h2>
        <p>Take a ₹100 note out of your wallet. Now imagine swapping it with your friend's ₹100 note.
          <strong> Nothing happened.</strong> Any ₹100 note is exactly as good as any other — you care about the
          <em> value</em>, never about <em>which physical note</em>.</p>
        <p>Now imagine swapping <strong>passports</strong> with your friend. Catastrophe! A passport's whole job
          is <em>identity</em> — WHICH person it belongs to. Same name, same photo style — still utterly different
          documents.</p>
        <p>Every class in your domain model is one of these two:</p>
        <Code html={`   ENTITY  (the passport 🛂)              VALUE OBJECT  (the banknote 💵)

   has an IDENTITY (id field)            is pure CONTENT — no id
   Customer #42 is #42 even after        any ₹100(INR) IS any other ₹100(INR)
   moving house                          equality = same field values
   equality = same id                    IMMUTABLE — you don't edit a value,
   has a lifecycle, changes over time      you replace it (like the number 7)
   examples: Customer, Order, Account    examples: Money, Email, Address,
                                         DateRange, Coordinates, LocalDate`} />
        <Note><strong>The classifying question</strong> for any class: <em>"if two of these have identical data,
          are they THE SAME THING?"</em> Yes → value object. No, which-one matters → entity. (You met this
          informally on Day 10 when "address" got promoted from a String — today that promotion gets its
          full rulebook.)</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The disease: primitive obsession</h2>
        <p><strong>Primitive obsession</strong> = representing rich domain concepts with bare primitives:
          <C> double</C> for money, <C>String</C> for emails, ids, phone numbers, two <C>double</C>s for
          coordinates. It looks harmless. Here is its rap sheet:</p>
        <Code html={`<span class="kw">void</span> bookFlight(String from, String to, String date) { … }

bookFlight(<span class="str">"2026-07-01"</span>, <span class="str">"DEL"</span>, <span class="str">"BOM"</span>);   <span class="cm">// ❌ args swapped — COMPILES FINE, books garbage</span>

<span class="kw">double</span> total = <span class="num">0.1</span> + <span class="num">0.2</span>;                <span class="cm">// = 0.30000000000000004  (binary can't say 0.1)</span>
<span class="kw">double</span> mixed = usdPrice + inrPrice;      <span class="cm">// ❌ added DOLLARS to RUPEES, no complaint</span>
sendTo(email);                            <span class="cm">// ❌ email = "lol-no-at-sign" got here unchecked</span>`} />
        <p>The compiler — your hardest-working reviewer — is blindfolded: to it, three Strings are the same type,
          and every double is just a number. All the meaning lives in your head, where bugs are manufactured.</p>
        <Reveal summary="The $327 million unit bug — click to reveal.">
          <p>In 1999, NASA's <strong>Mars Climate Orbiter</strong> disintegrated because one team's software
            produced thrust in <em>pound-seconds</em> while another consumed it as <em>newton-seconds</em> — both
            sides passing bare numbers. A <C>Force</C> type with explicit units would have made the mismatch a
            compile-time error. Primitive obsession is not a style nitpick; it has a body count of spacecraft.</p>
        </Reveal>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>💸 Play: Watch double money fail</h2>
        <p>Three innocent operations. Run them with <C>double</C>, then with a proper <C>Money</C> type. Look
          closely at every decimal.</p>
        <DoubleDisaster />
        <Good><strong>What you should notice:</strong> ① <C>0.1 + 0.2</C> is already wrong in the 17th decimal —
          and tiny errors COMPOUND across millions of transactions (auditors notice missing paise). ② The
          scariest result is the quiet one: dollars + rupees = 200, no error, no warning. ③ Money-world fixes both
          differently: BigDecimal for exactness, and the currency guard turns the silent disaster into a loud,
          immediate exception (Day 19's fire alarm).</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Building Money properly</h2>
        <Code html={`<span class="kw">public final class</span> Money {                          <span class="cm">// final: no subclass surprises (Day 13)</span>
    <span class="kw">private final</span> BigDecimal amount;                  <span class="cm">// exact decimal math — never double</span>
    <span class="kw">private final</span> Currency currency;                  <span class="cm">// the unit travels WITH the number</span>

    <span class="kw">public</span> Money(BigDecimal amount, Currency currency) {
        <span class="kw">if</span> (amount == <span class="kw">null</span> || currency == <span class="kw">null</span>) <span class="kw">throw new</span> IllegalArgumentException();
        <span class="kw">this</span>.amount = amount.setScale(<span class="num">2</span>, RoundingMode.HALF_EVEN);  <span class="cm">// bankers' rounding</span>
        <span class="kw">this</span>.currency = currency;                     <span class="cm">// born valid, stays valid (Day 2)</span>
    }

    <span class="kw">public</span> Money plus(Money other) {
        <span class="kw">if</span> (!currency.equals(other.currency))         <span class="cm">// 🛡️ the guard doubles can't have</span>
            <span class="kw">throw new</span> CurrencyMismatchException(currency, other.currency);
        <span class="kw">return new</span> Money(amount.add(other.amount), currency);   <span class="cm">// returns NEW — never mutates</span>
    }

    <span class="kw">public boolean</span> isMoreThan(Money other) { <span class="cm">/* same guard, then compare */</span> <span class="kw">return</span> …; }
}`} />
        <p>Read the design choices like a checklist of this month:</p>
        <ul>
          <li><strong>Immutable</strong> (Day 2): all fields <C>final</C>, operations return <em>new</em> Money.
            Values don't change; they get replaced — you never "edit the number 7".</li>
          <li><strong>Born valid</strong> (Day 19's fail fast): the constructor is the only door, and it guards.</li>
          <li><strong>Behavior with data</strong> (Day 10's Information Expert): <C>plus</C>, <C>isMoreThan</C>
            live ON Money — callers can't fumble the rules (Tell, Don't Ask — Day 18).</li>
          <li><strong>The unit is part of the value</strong>: currency rides along, so mixing units is impossible
            instead of unlucky.</li>
        </ul>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>equals() and hashCode() — making it ACT like a value</h2>
        <p>One thing is still missing. Out of the box, Java compares objects by <strong>address</strong>
          (<C>Object.equals</C> behaves like <C>==</C>, the Day 1 trap). Your Money holds the right data but
          still acts like a passport. Override the pair:</p>
        <Code html={`@Override <span class="kw">public boolean</span> equals(Object o) {
    <span class="kw">if</span> (<span class="kw">this</span> == o) <span class="kw">return true</span>;
    <span class="kw">if</span> (!(o <span class="kw">instanceof</span> Money m)) <span class="kw">return false</span>;
    <span class="kw">return</span> amount.equals(m.amount) && currency.equals(m.currency);   <span class="cm">// content!</span>
}
@Override <span class="kw">public int</span> hashCode() {
    <span class="kw">return</span> Objects.hash(amount, currency);    <span class="cm">// ⚠️ ALWAYS together with equals</span>
}`} />
        <Warn><strong>The contract people fail interviews on:</strong> equal objects MUST return equal hash codes.
          <C> HashMap</C>/<C>HashSet</C> first jump to the bucket chosen by <C>hashCode()</C>, then confirm with
          <C> equals()</C>. Override only <C>equals</C> and your object goes into bucket A but is searched for in
          bucket B — present in the map, impossible to find. Override <strong>both or neither</strong>.</Warn>
        <p>(And this is the second reason values must be immutable: mutate a key after insertion and its hash
          changes — the map looks in the new bucket while the object sits in the old one. Lost forever.)</p>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🛂 Play: Banknotes, passports, and the equals toggle</h2>
        <p>Two equal-valued Money objects and two same-named Passports. Compare them with <C>==</C> and
          <C>.equals()</C> — with and without the override. Predict each answer first.</p>
        <IdentityLab />
        <Good><strong>What you should notice:</strong> ① <C>==</C> is false even for identical Money — it compares
          heap addresses (Day 1), never use it for values. ② Without the override, <C>equals</C> is just as
          useless — value semantics are something you must BUILD (or get from a record). ③ The passports
          correctly stay unequal: entities compare by ID. Same toolkit, opposite — and both right.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Records — the modern shortcut (and "parse, don't validate")</h2>
        <p>Since Java 16, the language writes value objects FOR you:</p>
        <Code html={`<span class="kw">public record</span> Money(BigDecimal amount, Currency currency) {
    <span class="kw">public</span> Money {                                <span class="cm">// compact constructor = the guard post</span>
        Objects.requireNonNull(amount); Objects.requireNonNull(currency);
        amount = amount.setScale(<span class="num">2</span>, RoundingMode.HALF_EVEN);
    }
    <span class="kw">public</span> Money plus(Money o) { <span class="cm">/* guard + add, as before */</span> <span class="kw">return</span> …; }
}
<span class="cm">// record = final fields + constructor + equals + hashCode + toString — FREE.</span>`} />
        <p>One line replaces ~40: records are <strong>immutable and value-equal by construction</strong>. You add
          only the guards and the domain methods. (No setters exist. No inheritance allowed. Both restrictions
          are features.)</p>
        <p>Now the email problem, solved with today's tool + a slogan worth memorizing:</p>
        <Code html={`<span class="kw">public record</span> Email(String value) {
    <span class="kw">private static final</span> Pattern OK = Pattern.compile(<span class="str">"^[\\\\w.+-]+@[\\\\w-]+\\\\.[\\\\w.]+$"</span>);
    <span class="kw">public</span> Email {
        <span class="kw">if</span> (!OK.matcher(value).matches())
            <span class="kw">throw new</span> InvalidEmailException(value);   <span class="cm">// rejected AT THE DOOR</span>
    }
}

<span class="kw">void</span> sendWelcome(Email to) { … }   <span class="cm">// ← needs NO checks. The TYPE is the proof.</span>`} />
        <Note><strong>"Parse, don't validate":</strong> convert raw input into a rich type ONCE, at the boundary.
          From then on, the type system carries the proof — <C>sendWelcome(Email to)</C> cannot even be called
          with junk. Scattered re-validation (the 7 copy-pasted <C>contains("@")</C> checks) simply evaporates.
          This is Day 16's DRY + Day 19's fail-fast, fused into a type.</Note>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🔍 Play: Primitive obsession patrol</h2>
        <p>Six candidates from a real codebase. Wrap, or leave alone? Two are traps for over-wrappers.
          <strong> Predict, then click.</strong></p>
        <WrapGame />
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — The value object with setters</h3>
        <p><C>money.setAmount(500)</C> = a banknote whose number you rewrite with a pen. Every holder of that
          shared object just got robbed (and every HashMap holding it as a key is now corrupted). No setters.
          Ever. Operations return new instances.</p>
        <h3>Trap 2 — The anemic wrapper</h3>
        <p><C>class Money {'{'} double amount; getAmount(); setAmount(); {'}'}</C> — a wrapper with no guards, no
          currency, no operations is primitive obsession wearing a class costume. The point was the RULES, not
          the wrapping paper.</p>
        <h3>Trap 3 — Forgetting hashCode (or equals) — half the contract</h3>
        <p>Symptoms: "the item IS in the set, but contains() says false." Override both, or use a record and get
          both right for free.</p>
        <h3>Trap 4 — Wrapping everything</h3>
        <p><C>ItemCount</C>, <C>PageNumber</C>, <C>LoopIndex</C>… ceremony without rules to enforce. Wrap where
          validation, units, or field-grouping exist (the game's checklist). KISS referees, as always.</p>
        <h3>Trap 5 — Entities cosplaying as values</h3>
        <p>Giving <C>Customer</C> content-based equals means two customers named "Asha Rao" merge in a Set. 💀
          Entities compare by ID — and only by ID.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet — and Month 1, complete</h2>
        <ul>
          <li><strong>Entity</strong> = passport: identity, id-equality, lifecycle. <strong>Value object</strong> = banknote: pure content, value-equality, IMMUTABLE, no id.</li>
          <li><strong>Wrap when:</strong> validation rules exist (Email) · units can be confused (Money, Force!) · fields travel together (Coordinates, DateRange) · same-typed args get swapped (typed IDs). <strong>Don't wrap</strong> bare counts/indexes.</li>
          <li><strong>Money:</strong> BigDecimal + Currency + guards + operations returning new. Never double. Never setters.</li>
          <li><strong>equals/hashCode:</strong> override BOTH or NEITHER; equal ⇒ same hash; mutable keys = lost map entries. Records give all of it free + compact-constructor guards.</li>
          <li><strong>Parse, don't validate:</strong> raw → type once at the boundary; afterwards the type is the proof.</li>
        </ul>
        <p style={{ marginTop: 14 }}><strong>🏆 And that's Month 1.</strong> Look what's in your toolbox now:</p>
        <ul>
          <li><strong>Week 1:</strong> objects, encapsulation, inheritance, polymorphism, abstraction — the raw materials.</li>
          <li><strong>Week 2:</strong> relationships, UML, requirements → entities — turning English into designs.</li>
          <li><strong>Week 3:</strong> SOLID — the five rules of healthy structure.</li>
          <li><strong>Week 4:</strong> DRY/KISS/YAGNI, coupling &amp; cohesion, Demeter, enums &amp; exceptions, value objects — the judgment layer.</li>
        </ul>
        <p>Month 2 takes this exact toolbox and learns the 23 famous ways the masters combine it: <strong>Design
          Patterns</strong>. You'll find you have already secretly built half of them.</p>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Recite the FIVE properties of the equals() contract.">
          <p>Reflexive (<C>x.equals(x)</C> true) · Symmetric (<C>x.equals(y) ⇔ y.equals(x)</C>) · Transitive
            (x=y, y=z ⇒ x=z) · Consistent (same answer on repeated calls if nothing changed) · and
            <C> x.equals(null)</C> must be <strong>false</strong> (never throw). Symmetry is the one subclassing
            breaks most often — famous trap: Timestamp vs Date.</p>
        </Reveal>
        <Reveal summary="Q: The hashCode contract, precisely — and which direction is NOT required?">
          <p>Required: equal objects ⇒ equal hash codes; consistent within a run. NOT required: unequal objects
            may share a hash (collisions are legal — that's what buckets are for). The reverse implication
            (same hash ⇒ equal) is the misconception examiners fish for.</p>
        </Reveal>
        <Reveal summary={<>Q: The BigDecimal trap — <C>new BigDecimal("2.0").equals(new BigDecimal("2.00"))</C> returns…?</>}>
          <p><strong>false!</strong> BigDecimal's equals() compares value AND scale (2.0 has scale 1, 2.00 has
            scale 2), while <C>compareTo()</C> returns 0 for them. So: equality/HashMap keys → normalize the
            scale (your Money's setScale did this!) or compare with compareTo. A genuinely production-relevant
            trap.</p>
        </Reveal>
        <Reveal summary={<>Q: The follow-up — put both BigDecimals in a <C>HashSet</C> vs a <C>TreeSet</C>. Sizes?</>}>
          <p><strong>HashSet: 2. TreeSet: 1.</strong> HashSet uses equals()/hashCode() — 2.0 and 2.00 are
            "different", both stay. TreeSet ignores equals entirely and uses <C>compareTo()</C> — which
            returns 0 for them, so the second is treated as a duplicate and silently dropped. This is the
            <strong> consistent-with-equals rule</strong> from the Comparable javadoc: sorted collections
            behave "strangely" (by their own admission) whenever <C>compareTo() == 0</C> disagrees with
            <C> equals()</C>. Same story with a Comparator: sort people by lastName only, feed them to a
            TreeMap, and two different people with the same lastName become one entry. Rule: before using
            any type as a sorted-collection key, ask "does compareTo-zero mean equals-true?" — if not,
            extend the comparator (<C>.thenComparing(...)</C>) until it does.</p>
        </Reveal>
        <Reveal summary="Q: Records: can they have extra methods? instance fields? extend? implement?">
          <p>Extra methods, static members, compact-constructor validation: <strong>yes</strong>. Extra INSTANCE
            fields beyond the header: <strong>no</strong> (the header IS the state, that's the guarantee).
            Extend a class: no (they extend java.lang.Record). Implement interfaces: yes. They're implicitly
            final.</p>
        </Reveal>
        <Reveal summary="Q: Why must a HashMap KEY never be mutated after insertion — mechanics, please?">
          <p>The map stored the entry in the bucket chosen by the hash AT INSERT TIME. Mutate the key → its
            hashCode changes → lookups compute the NEW hash, search the wrong bucket, find nothing — yet the
            entry still exists (memory leak + phantom). This is the mechanical reason value objects (and all
            keys) should be immutable.</p>
        </Reveal>
        <Reveal summary='Q: Where does the term "value object" come from — and its evil twin?'>
          <p>Domain-Driven Design (Eric Evans, 2003): Entities vs Value Objects is DDD's first building-block
            distinction. The evil twin: "primitive obsession", from Fowler's smell catalog. Knowing the
            provenance of both terms marks you as well-read.</p>
        </Reveal>
        <Reveal summary="Q: Should an ENTITY (Customer) ever use Lombok/IDE-generated all-fields equals?">
          <p>No — that gives content equality, so two "Asha Rao"s merge in Sets and a renamed customer "stops
            being" herself. Entities: equals/hashCode on the IDENTITY field only (id), or rely on default
            reference equality until an id exists. All-fields equals is for values; the generator doesn't know
            which one you're writing.</p>
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
        <strong>Day 20 complete — MONTH 1 COMPLETE! 🏆</strong> Homework (the graduation piece): build
        <C> DateRange</C> as a record — <C>start</C>, <C>end</C> (LocalDates), compact-constructor guard
        (start ≤ end), plus <C>overlaps(other)</C>, <C>days()</C>, and <C>shiftBy(int days)</C> returning a NEW
        range. Write equals-based tests: two equal ranges in a HashSet count once. Then the boss level: a tiny
        <C> Booking</C> ENTITY (id + guestName + DateRange) — give it id-based equals and write one sentence on
        why the two equality strategies differ. That sentence is Month 1 in miniature.
        <br /><br />
        Next: <strong>Month 2 — Design Patterns</strong>, starting with <strong>Day 21 — Singleton</strong>: the
        most famous, most misused pattern of all — done right, including the enum trick from Day 19.
      </div>
    </div>
  )
}
