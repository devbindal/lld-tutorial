import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The chain breaker ============ */
const CHAIN_CLIENTS = ['CheckoutPage.java', 'InvoiceEmail.java', 'ShippingLabel.java', 'TaxCalculator.java']
const CHANGES = {
  rename: { label: '🔧 team renames Address → Location', desc: 'getAddress() no longer exists' },
  optional: { label: '🫥 customers may now have NO address', desc: 'getAddress() can return null' },
}

function ChainBreaker() {
  const [world, setWorld] = useState('wreck')
  const [change, setChange] = useState(null)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · four screens need the shipping city — then the Customer team changes something</div>
      <div className="modbtns">
        <button className={world === 'wreck' ? 'on' : ''} onClick={() => { setWorld('wreck'); setChange(null) }}>🚂 train-wreck world</button>
        <button className={world === 'lod' ? 'on' : ''} onClick={() => { setWorld('lod'); setChange(null) }}>🤝 Demeter world</button>
      </div>
      <Code html={world === 'wreck'
        ? `<span class="cm">// in ALL FOUR client files:</span>
String city = order.getCustomer().getAddress().getCity();   <span class="cm">// 3 dots of structure knowledge</span>`
        : `<span class="cm">// in all four client files — ask the FRIEND, not his relatives:</span>
String city = order.getShippingCity();

<span class="cm">// inside Order.java — the only file that knows the route:</span>
<span class="kw">public</span> String getShippingCity() {
    <span class="kw">return</span> customer.getAddress().getCity();   <span class="cm">// one place, easy to guard</span>
}`} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.entries(CHANGES).map(([k, c]) => (
          <button key={k} className="act" onClick={() => setChange(k)}>{c.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[...CHAIN_CLIENTS, 'Order.java'].map((f) => {
          const isOrder = f === 'Order.java'
          const hit = change && (world === 'wreck' ? !isOrder || true : isOrder)
          const clientHitInWreck = change && world === 'wreck'
          const lit = world === 'wreck' ? clientHitInWreck : (change && isOrder)
          return (
            <span key={f} className="chip" style={lit
              ? { background: '#FFE0DE', borderColor: 'var(--red)', color: '#8F2B24' }
              : change ? { opacity: 0.5 } : {}}>
              {f}{lit ? ' ✏️' : ''}
            </span>
          )
        })}
      </div>
      {change && (
        <div className="statbar">
          💥 <span>{CHANGES[change].desc} →</span>
          <b>{world === 'wreck'
            ? '5 files break: every client memorized the full route through Customer → Address → City.'
            : '1 file changes: Order.java updates its shortcut; the four clients never knew the route existed.'}</b>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 2: The paperboy & the wallet ============ */
const ASK_STEPS = [
  { code: 'Wallet w = customer.getWallet();', state: 'taken', say: 'The paperboy reaches into the customer\'s pocket and TAKES the wallet. A stranger now holds your wallet — everything inside is exposed.' },
  { code: 'double cash = w.getMoney();   // sees ₹500', state: 'taken', say: 'He inspects the contents. He now knows your balance — knowledge he never needed for a ₹30 paper.' },
  { code: 'w.setMoney(cash - 30);', state: 'taken', say: 'HE edits your wallet. Typo? He sets 3 instead of 470. Negative check? His problem now (he won\'t do it). And if wallet was null → 💥 NPE in HIS code.' },
]

function WalletSim() {
  const [world, setWorld] = useState('ask')
  const [step, setStep] = useState(-1)
  const taken = world === 'ask' && step >= 0
  const paid = world === 'tell' && step >= 0

  const reset = (w) => { setWorld(w); setStep(-1) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the paperboy collects ₹30 — two ways</div>
      <div className="modbtns">
        <button className={world === 'ask' ? 'on' : ''} onClick={() => reset('ask')}>😬 ASK world (dig in)</button>
        <button className={world === 'tell' ? 'on' : ''} onClick={() => reset('tell')}>😌 TELL world (request)</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {world === 'ask' ? (
          <button className="act" onClick={() => setStep((s) => Math.min(s + 1, ASK_STEPS.length - 1))}
            disabled={step >= ASK_STEPS.length - 1}>
            {step < 0 ? '▶ start digging' : 'next line →'}
          </button>
        ) : (
          <button className="act" onClick={() => setStep(0)} disabled={step >= 0}>customer.pay(30)</button>
        )}
        <button className="ghost act" onClick={() => setStep(-1)}>reset</button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div className="obj" style={{ minWidth: 220 }}>
          <div className="oref">c → Customer@1a2b</div>
          <div className="ofield">name = "Mrs. Rao"</div>
          {!taken ? (
            <div className="ofield" style={{ background: '#EAF7EF', borderRadius: 5 }}>
              👛 wallet = Wallet(₹{paid ? '470' : '500'}) — safe in her pocket {world === 'tell' && '🔒 private'}
            </div>
          ) : (
            <div className="ofield" style={{ background: '#FFE0DE', borderRadius: 5 }}>👛 wallet = …in someone else's hands!</div>
          )}
          {world === 'tell' && <div className="ofield">pay(amount) {'{'} guards inside ✓ {'}'}</div>}
        </div>
        <div className="obj" style={{ minWidth: 220 }}>
          <div className="oref">p → Paperboy@9f3c</div>
          {taken && <div className="ofield" style={{ background: '#FFE0DE', borderRadius: 5 }}>holding: Mrs. Rao's ENTIRE wallet 👛</div>}
          {paid && <div className="ofield" style={{ background: '#EAF7EF', borderRadius: 5 }}>holding: ₹30 cash — exactly what was owed 💵</div>}
          {!taken && !paid && <div className="ofield">holding: nothing yet</div>}
        </div>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {world === 'ask'
          ? (step < 0
            ? <span>▶ Step through the ASK version, line by line.</span>
            : <span><C>{ASK_STEPS[step].code}</C><br />{ASK_STEPS[step].say}</span>)
          : (step < 0
            ? <span>👆 One call. The customer keeps her wallet, applies her own rules, hands over exactly ₹30.</span>
            : <span>✅ <b>Done in one TELL.</b> The wallet never left her pocket; the balance check, the null safety, the math — all live INSIDE Customer, written once, guarded forever (Day 2's vault, working as designed).</span>)}
      </div>
    </div>
  )
}

/* ============ Interactive 3: Wreck or fine? ============ */
const WRECK_ITEMS = [
  { d: 'order.getCustomer().getAddress().getCity()',
    a: 'wreck', why: 'Three hops through OBJECT STRUCTURE. The caller memorizes Order→Customer→Address→City; any link renamed, restructured or nullable breaks every caller. Ask the friend: order.getShippingCity().' },
  { d: 'new StringBuilder().append("a").append("b").toString()',
    a: 'fine', why: 'A FLUENT chain: every append() returns the SAME object (return this — Day 1!). You are talking to one friend the whole time, not crawling through his relatives.' },
  { d: 'items.stream().filter(i -> i.price() > 100).map(Item::name).collect(toList())',
    a: 'fine', why: 'A transformation PIPELINE: each step returns a new VALUE handed to you on purpose. No hidden structure is being dug through — this is how streams are designed to be used.' },
  { d: 'invoice.getItems().get(0).getProduct().getSupplier().getEmail()',
    a: 'wreck', why: 'A five-car wreck crossing FOUR objects\' structures. Five reasons to break, five null checks owed, and a mock-of-mock-of-mock nightmare in tests. The invoice should answer the real question itself.' },
  { d: 'LocalDate.now().plusDays(7).format(formatter)',
    a: 'fine', why: 'Immutable VALUES producing new values: a date → another date → a string. Value pipelines carry no structural knowledge — Demeter targets reaching through stateful objects, not arithmetic on values.' },
  { d: 'report.getData().getRows().add(hackedRow)',
    a: 'wreck', why: 'The worst kind: digging in AND mutating what you find. The caller bypasses every rule Report enforces — this is the leaked-internals disaster from Day 2 plus a Demeter violation on top. Tell the report: report.addRow(…).' },
]

function WreckGame() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= WRECK_ITEMS.length
  const cur = WRECK_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · dots in the dock — wreck or fine?</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {WRECK_ITEMS.length}</b>{score === WRECK_ITEMS.length ? ' — you judge chains by structure, not by counting dots.' : '. Remember: fluent & value chains are fine; structure-digging is not.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            ⚖️ <span>chain {idx + 1} of {WRECK_ITEMS.length} · score {score}</span>
          </div>
          <Code html={cur.d.replace(/</g, '&lt;').replace(/>/g, '&gt;')} />
          <div className="modbtns">
            <button className={picked !== null && cur.a === 'fine' ? 'on' : ''}
              style={picked === 'fine' && cur.a !== 'fine' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('fine')}>✅ fine — legitimate chain</button>
            <button className={picked !== null && cur.a === 'wreck' ? 'on' : ''}
              style={picked === 'wreck' && cur.a !== 'wreck' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('wreck')}>🚂 train wreck</button>
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ Correct! ' : '❌ Not quite. '}
              {cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={next}>Next chain →</button>
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
  { q: 'The Law of Demeter says a method may talk only to…',
    o: ['Static methods', 'Itself, its own fields, its parameters, and objects it creates — NOT to things returned by its friends\' getters', 'Classes in the same package', 'Its parent class'], a: 1,
    e: 'The friend list: this, your fields, your parameters, your own new objects. The forbidden move is interrogating a friend\'s belongings — friends of friends are strangers.' },
  { q: 'Why is order.getCustomer().getAddress().getCity() expensive, precisely?',
    o: ['Three method calls are slow', 'The caller is coupled to the internal STRUCTURE of three other classes — any rename, restructure, or null in the chain breaks every caller', 'Getters are deprecated', 'It uses too much memory'], a: 1,
    e: 'Each dot is structural knowledge the caller must keep correct forever. The performance is irrelevant; the coupling is the bill — multiplied by every file that repeats the chain.' },
  { q: 'Is new StringBuilder().append("a").append("b").toString() a Demeter violation?',
    o: ['Yes — three dots!', 'No — fluent chains return the SAME object (or fresh values); you never reach into another object\'s structure', 'Yes, unless wrapped in a helper', 'Only in Java 8+'], a: 1,
    e: 'The "count the dots" heuristic is only a heuristic. Demeter is about digging through OBJECT STRUCTURE. Fluent builders (return this), streams, and immutable value pipelines are designed chains — fine.' },
  { q: '"Tell, Don\'t Ask" means…',
    o: ['Never write getters', 'Instead of pulling data out and deciding outside (ask), tell the owning object what you WANT and let it use its own data (customer.pay(30))', 'Always use void methods', 'Ask the user for confirmation'], a: 1,
    e: 'if (wallet.getMoney() > price) wallet.setMoney(…) moves the customer\'s logic into the paperboy. customer.pay(price) keeps data + rules together — Information Expert (Day 10) and encapsulation (Day 2) in one move.' },
  { q: 'Your unit test needs: a mock Order returning a mock Customer returning a mock Address. This signals…',
    o: ['Excellent thorough testing', 'A Demeter violation in the code under test — the test must rebuild the whole structure chain the code digs through', 'A JUnit bug', 'Too few mocks'], a: 1,
    e: 'Mock-returning-mock-returning-mock is the test suite screaming about structural coupling. After the fix (order.getShippingCity()), one stubbed method replaces the whole puppet show.' },
  { q: 'The two standard fixes for a train wreck are…',
    o: ['Try/catch and logging', 'Add a delegate method on the friend (order.getShippingCity()) — or have the caller receive the needed value directly as a parameter', 'Make all fields public', 'Use static imports'], a: 1,
    e: 'Either the friend answers the real question itself (possibly delegating internally), or the caller never holds the big object at all — just the city string it needs. Both erase the structural knowledge.' },
  { q: 'What is the "delegation tax" trap?',
    o: ['Delegation is slow', 'Mechanically wrapping EVERY chain creates dozens of pass-through getters, bloating Order into a fat facade — add delegates for real questions clients ask, not for every path', 'Java charges for delegates', 'Delegates break the compiler'], a: 1,
    e: 'order.getCustomerAddressCityZipPrefix() for one caller is Demeter theater. If Order needs 30 forwarders, clients may be asking Order the wrong questions — or should receive values directly.' },
  { q: 'In Day 17\'s language, the Law of Demeter is…',
    o: ['A cohesion rule', 'A coupling rule: it forbids the hidden ropes created when callers memorize other objects\' internal structure', 'A naming convention', 'A performance rule'], a: 1,
    e: 'Every dot past the first ties an invisible rope from the caller to a stranger\'s internals. Demeter keeps your ropes short, thin and tied only to direct friends — coupling control at street level.' },
]

/* ============ The page ============ */
export default function Day18() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 4 · Day 18</div>
        <h1>Law of Demeter:<br />Talk to Friends, Not to Strangers</h1>
        <p>Yesterday you saw coupling as a force. Today you get its most practical street rule — the one that
           flags <C>a.getB().getC().getD()</C> in every serious code review on Earth, and the famous story of a
           paperboy with his hand in a customer's pocket. Click everything.</p>
        <div className="chips">
          {['Demeter', 'train wreck', 'tell don\'t ask', 'friend list', 'delegate methods', 'one-dot heuristic'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The paperboy and the wallet</h2>
        <p>A paperboy comes to collect ₹30. Two ways this can go:</p>
        <ul>
          <li><strong>The creepy way:</strong> he reaches into Mrs. Rao's pocket, pulls out her wallet, opens it,
            checks the balance, and takes the money himself.</li>
          <li><strong>The normal way:</strong> he says "₹30 please", and <em>she</em> handles her own wallet and
            hands him exactly ₹30.</li>
        </ul>
        <p>Nobody would accept the first in real life — yet we write it daily:
          <C> customer.getWallet().getMoney()</C>. The <strong>Law of Demeter</strong> (named after the project
          that discovered it in 1987) is the "don't reach into pockets" rule, made precise:</p>
        <Note><strong>LoD in one line:</strong> a method may talk only to its <strong>friends</strong> — never to
          <em> friends of friends</em>. You may call methods on: yourself (<C>this</C>), your own fields, your
          parameters, and objects you create. Things <strong>returned by a friend's getter are strangers</strong>.</Note>
        <Code html={`   YOUR FRIEND LIST (legal receivers inside a method)

   ✅ this                      ✅ my own fields
   ✅ my parameters             ✅ objects I create with new

   ❌ whatever my friends hand me from THEIR pockets:

   order.getCustomer().getAddress().getCity()
   └─┬──┘ └───┬────┘   └───┬────┘  └───┬───┘
   friend   stranger    stranger    total stranger
            (Customer's   (Address's   — and I now know
             business!)    business!)    3 classes' insides`} />
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Anatomy of a train wreck</h2>
        <p>It's called a <strong>train wreck</strong> because of how it reads — carriages coupled nose to tail:</p>
        <Code html={`String city = order.getCustomer().getAddress().getCity();   <span class="cm">// 🚂💥</span>`} />
        <p>To write that line, the caller had to learn: Orders hold Customers, Customers hold Addresses,
          Addresses hold city strings. That's <strong>three classes' private geography memorized</strong> — and
          the bill arrives in three ways:</p>
        <ul>
          <li><strong>Restructure ripple:</strong> Customer team renames Address, or moves city into a new
            <C> ShippingProfile</C> → every file with the chain breaks. The chain re-creates Day 17's shotgun surgery.</li>
          <li><strong>Null cascade:</strong> any link may be null. Honest code becomes
            <C> if (o.getCustomer() != null && o.getCustomer().getAddress() != null …)</C> — a wreck wearing armor.</li>
          <li><strong>Test torture:</strong> unit-testing the caller needs a mock returning a mock returning a
            mock — a puppet show rebuilt in every test file.</li>
        </ul>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🚂 Play: Break the chain</h2>
        <p>Four screens display the shipping city. Fire a realistic change in both worlds and count the broken
          files.</p>
        <ChainBreaker />
        <Good><strong>What you should notice:</strong> ① In wreck-world the Customer team cannot touch their own
          internals without breaking four files they've never heard of. ② In Demeter-world the route exists in
          exactly ONE place (<C>Order.getShippingCity()</C>) — the chain still exists, but knowledge of it is
          DRY (Day 16!). ③ The clients now ask a meaningful business question ("what's the shipping city?")
          instead of navigating a data structure.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Tell, Don't Ask — Demeter's big sibling</h2>
        <p>Chains that <em>read</em> are bad; chains that read, decide, and <em>write back</em> are worse.
          The paperboy in code:</p>
        <Code html={`<span class="cm">// ❌ ASK: pull the data out, make THEIR decision FOR them, push the result back</span>
Wallet w = customer.getWallet();
<span class="kw">if</span> (w.getMoney() >= <span class="num">30</span>) {
    w.setMoney(w.getMoney() - <span class="num">30</span>);     <span class="cm">// customer's rules, running in paperboy's code</span>
}

<span class="cm">// ✅ TELL: state what you want; the owner uses its own data and rules</span>
customer.pay(<span class="num">30</span>);

<span class="cm">// inside Customer — data + rules together, written ONCE:</span>
<span class="kw">public void</span> pay(<span class="kw">double</span> amount) {
    <span class="kw">if</span> (amount <= <span class="num">0</span>) <span class="kw">throw new</span> IllegalArgumentException();
    wallet.deduct(amount);              <span class="cm">// Wallet guards its own balance too</span>
}`} />
        <p>Notice what TELL achieves: the balance check can never be forgotten by a caller, the wallet can never
          go negative through a side door, and tomorrow's rule change ("seniors get 10% off") lands in exactly
          one file. <strong>Tell, Don't Ask is Information Expert (Day 10) enforced at the call site.</strong></p>
        <Warn><strong>The smell to hunt:</strong> code that pulls data from another object, makes a decision that
          is really <em>that object's business</em>, then writes results back. The logic is "envious" of the data
          it visits — refactoring books literally call it <strong>feature envy</strong>. The cure is moving the
          logic to where the data lives.</Warn>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>👛 Play: The paperboy simulator</h2>
        <p>Watch the wallet's journey in the ASK world, line by line — then run the TELL world.</p>
        <WalletSim />
        <Good><strong>What you should notice:</strong> ① In ASK-world the wallet physically leaves its owner —
          along with every rule that protected it. ② In TELL-world the paperboy ends up holding exactly ₹30 and
          zero knowledge of wallets. ③ The TELL version is also the only one that stays correct when Customer
          adds rules later — callers can't forget checks they never performed.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The nuance: not every dot is a crime</h2>
        <p>Beginners learn "one dot good, three dots bad" and start a war on dots. The real rule is sharper:
          <strong> Demeter forbids reaching through other objects' STRUCTURE — not chains of calls as such.</strong>
          Three famous chains that are perfectly fine:</p>
        <ul>
          <li><strong>Fluent builders:</strong> <C>sb.append("a").append("b")</C> — every call returns the
            <em> same object</em> (<C>return this</C>, Day 1). One friend, long conversation.</li>
          <li><strong>Streams / pipelines:</strong> <C>list.stream().filter(…).map(…)</C> — each step hands you a
            fresh value <em>designed</em> to be passed along. Nothing's pocket is being searched.</li>
          <li><strong>Immutable values:</strong> <C>LocalDate.now().plusDays(7).format(f)</C> — arithmetic on
            values producing values. Value objects (Day 20!) carry no hidden structure to couple to.</li>
        </ul>
        <Note><strong>The honest test, instead of counting dots:</strong> "did I just learn (and depend on) how
          another object is built inside?" Yes → wreck. No — the API <em>wants</em> to be chained → fine.
          Corollary: chains across <strong>stateful domain objects</strong> = suspicious; chains across
          <strong> values and builders</strong> = idiomatic.</Note>
        <Reveal summary="What about DTOs and config objects? Click to reveal.">
          <p>At system boundaries (JSON payloads, config trees) you often walk pure DATA with no behavior:
            <C> config.getServer().getPort()</C>. Pragmatically tolerated: a DTO's whole purpose is its shape,
            and it has no rules to bypass. But the moment that shape leaks deep into business logic, one schema
            change becomes shotgun surgery — so convert DTOs into real domain objects at the door, and let the
            wrecks end there.</p>
        </Reveal>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>⚖️ Play: Wreck or fine?</h2>
        <p>Six chains in the dock. Judge by structure-knowledge, not by dot count — two of them are designed to
          trap dot-counters. <strong>Predict, then click.</strong></p>
        <WreckGame />
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — The delegation tax</h3>
        <p>Mechanically wrapping every chain gives Order thirty forwarders
          (<C>getCustomerCity()</C>, <C>getCustomerZip()</C>, <C>getCustomerPhonePrefix()</C>…) — a fat facade
          (Day 14!) that re-couples everything through one bloated class. Add a delegate only for a
          <em> real business question</em> several clients ask. If a screen needs ten customer fields, maybe it
          should receive the Customer — or a purpose-built view object.</p>
        <h3>Trap 2 — Hiding the wreck in a helper</h3>
        <p><C>AddressUtils.cityOf(order)</C> containing the same three-dot chain is the wreck with a fake
          moustache. The structural knowledge must MOVE to the structure's owner, not relocate to a junk drawer
          (Day 17).</p>
        <h3>Trap 3 — Demeter-compliant but still ASK-y</h3>
        <p><C>if (account.getBalance() &gt; amt) account.withdraw(amt)</C> — one dot each, yet the caller still runs
          the account's business rule (and creates a race condition: balance can change between the two calls!).
          <C> account.withdraw(amt)</C> should guard itself. Tell, Don't Ask goes beyond dot-counting.</p>
        <h3>Trap 4 — Getter-phobia</h3>
        <p>Demeter does not ban getters. <C>order.getTotal()</C> asked by a screen that displays the total is
          healthy. The crime is <em>navigating</em> — using a getter's result to reach the next object's insides.</p>
        <h3>Trap 5 — "It's just one chain"</h3>
        <p>The first wreck gets copy-pasted (Day 16's multiplier!) into every new screen. Chains breed. Add the
          delegate when the SECOND caller appears — rule of three applies here too.</p>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Friend list:</strong> <C>this</C> · own fields · parameters · objects you create. <strong>Strangers:</strong> anything fished out of a friend's getter.</li>
          <li><strong>Train wreck</strong> <C>a.getB().getC().getD()</C> = memorized foreign structure → restructure ripple + null cascade + mock-of-mock tests.</li>
          <li><strong>Fixes:</strong> delegate method answering the real question (<C>order.getShippingCity()</C>) — or pass the needed VALUE in directly.</li>
          <li><strong>Tell, Don't Ask:</strong> don't pull data out, decide, and push back — <C>customer.pay(30)</C>, not wallet surgery. Cures feature envy; keeps rules with data.</li>
          <li><strong>Fine chains:</strong> fluent builders (same object) · streams (designed pipelines) · immutable values. Test: "did I learn another object's insides?" — not dot-counting.</li>
          <li>DTOs/config at boundaries: tolerated; convert to domain objects at the door.</li>
          <li>Traps: delegation tax (30 forwarders = fat facade) · wreck hidden in Utils · ask-y two-steps (check-then-act races) · getter-phobia.</li>
          <li>Force-language: LoD is a <strong>coupling</strong> rule — it cuts the hidden ropes tied to strangers' internals.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Why is it named after a Greek goddess?">
          <p>It emerged from the <strong>Demeter Project</strong> at Northeastern University (1987, Lieberherr
            et al.) — named for the goddess of agriculture because they aimed to "grow" software incrementally.
            The law was a coding rule discovered inside that project. (Trivia gold; almost nobody knows it.)</p>
        </Reveal>
        <Reveal summary="Q: Recite the formal friend list — all FIVE allowed receivers.">
          <p>Inside method M of object O, you may call methods of: ① O itself (<C>this</C>) · ② M's parameters ·
            ③ objects CREATED inside M · ④ O's direct fields · ⑤ (often added) globals/statics accessible to M.
            The forbidden sixth: objects returned by calls on any of the above — friends of friends.</p>
        </Reveal>
        <Reveal summary='Q: Why is "count the dots" wrong as a formal statement of LoD?'>
          <p>Both directions fail: <C>a.getB().getC()</C> is two dots and a violation, while
            <C> sb.append(x).append(y)</C> is two dots and fine (same receiver each time), and you can launder a
            wreck into one-dot lines with local variables — still a violation! The law is about WHOSE structure
            you traverse, not punctuation.</p>
        </Reveal>
        <Reveal summary={`Q: Where does "Tell, Don't Ask" come from?`}>
          <p>Coined by Andy Hunt &amp; Dave Thomas (the Pragmatic Programmers). Companion idea: Fowler's
            <strong> feature envy</strong> smell — a method more interested in another object's data than its
            own. TDA is the prescription; feature envy is the diagnosis.</p>
        </Reveal>
        <Reveal summary="Q: Does LoD apply to methods of the SAME class chained on this?">
          <p><C>this.validate(); this.save();</C> — fine, you're your own friend. Even
            <C> this.getHelper().doThing()</C> is legal IF helper is your own field… but if the helper's only
            purpose is to be fetched and operated on by outsiders, you've built a wreck dispenser. The law
            permits it; Tell-Don't-Ask may still object.</p>
        </Reveal>
        <Reveal summary="Q: The check-then-act pair account.getBalance() / account.withdraw() — TWO problems?">
          <p>① Design: the caller runs the account's business rule (ask-y, feature envy). ② Concurrency: between
            the check and the act, another thread can change the balance — a race condition (TOCTOU). Moving the
            rule inside <C>withdraw()</C> fixes both at once — one synchronized, self-guarding method.
            (Month 4 expands the threading half.)</p>
        </Reveal>
        <Reveal summary="Q: Wrecks make MOCKING painful — explain the exact mechanics.">
          <p>To test code containing <C>order.getCustomer().getAddress().getCity()</C>, the test must build
            mock(Order)→returns mock(Customer)→returns mock(Address)→returns "Pune" — three stubbed layers per
            call site, repeated in every test. After the delegate fix, one stub: <C>when(order.getShippingCity())
            .thenReturn("Pune")</C>. Mock depth is a measurable LoD violation detector.</p>
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
        <strong>Day 18 complete?</strong> Homework: build the wreck, then fix it twice. Create
        <C> School → Teacher → Subject → syllabus list</C> and a <C>ReportCard</C> class that prints via
        <C> school.getTeacher("math").getSubject().getSyllabus().get(0)</C>. Now: ① fix with a delegate
        (<C>school.firstMathTopic()</C> — decide yourself which class should really own the question);
        ② fix with Tell, Don't Ask (<C>school.printSyllabusSummary(printer)</C>). Then write the unit test for
        all three versions and COUNT the mocks each needs — that number is the lesson.
        <br /><br />
        Next: <strong>Day 19 — Enums &amp; Exception Design</strong>: modeling fixed sets without magic strings,
        and designing failures that are impossible to ignore — the two unsung workhorses of clean Java.
      </div>
    </div>
  )
}
