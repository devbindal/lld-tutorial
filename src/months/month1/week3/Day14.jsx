import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The forced implementer ============ */
const ALL_METHODS = ['print()', 'scan()', 'fax()']
const DEVICES = {
  AllInOne: { can: ['print()', 'scan()', 'fax()'] },
  OldPrinter: { can: ['print()'] },
  DeskScanner: { can: ['scan()'] },
}
const ROLE_OF = { 'print()': 'Printable', 'scan()': 'Scannable', 'fax()': 'Faxable' }

function ForcedImplementer() {
  const [world, setWorld] = useState('fat')
  const [device, setDevice] = useState('OldPrinter')
  const d = DEVICES[device]
  const lies = ALL_METHODS.filter((m) => !d.can.includes(m))

  return (
    <div className="panel">
      <div className="ptitle">Live demo · sign the contract, then look at what you promised</div>
      <div className="modbtns">
        <button className={world === 'fat' ? 'on' : ''} onClick={() => setWorld('fat')}>🍔 fat interface world</button>
        <button className={world === 'isp' ? 'on' : ''} onClick={() => setWorld('isp')}>🔪 sliced (ISP) world</button>
      </div>
      <div className="modbtns">
        {Object.keys(DEVICES).map((n) => (
          <button key={n} className={device === n ? 'on' : ''} onClick={() => setDevice(n)}>{n}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div className="obj" style={{ minWidth: 280, borderColor: world === 'fat' && lies.length ? 'var(--red)' : undefined }}>
          <div className="oref">
            class {device} implements {world === 'fat' ? 'Machine' : d.can.map((m) => ROLE_OF[m]).join(', ')}
          </div>
          {world === 'fat' ? (
            ALL_METHODS.map((m) =>
              d.can.includes(m) ? (
                <div className="ofield" key={m}>{m} {'{'} /* real work ✅ */ {'}'}</div>
              ) : (
                <div className="ofield" key={m} style={{ background: '#FFE0DE', borderRadius: 5 }}>
                  {m} {'{'} throw new UnsupportedOperationException(); {'}'} ← a LIE
                </div>
              ))
          ) : (
            d.can.map((m) => <div className="ofield" key={m}>{m} {'{'} /* real work ✅ */ {'}'}</div>)
          )}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="statbar" style={{ display: 'block', background: world === 'fat' && lies.length ? '#FDECEC' : '#EAF7EF' }}>
            {world === 'fat' ? (
              lies.length === 0
                ? <span>😅 AllInOne can honestly sign the fat contract — it really does all three. The trap only shows with humbler devices… try OldPrinter.</span>
                : <span>🤥 <b>{lies.length} lying method{lies.length > 1 ? 's' : ''}.</b> The fat contract forced {device} to "implement" abilities it doesn't have. Every lie is a runtime grenade — yesterday's penguin, mass-produced.</span>
            ) : (
              <span>😌 <b>0 lying methods.</b> {device} signs only the role contract{d.can.length > 1 ? 's' : ''} it can honor: <b>{d.can.map((m) => ROLE_OF[m]).join(' + ')}</b>. Nothing to fake, nothing to throw.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============ Interactive 2: The ripple simulator ============ */
const FILES_FAT = [
  { n: 'interface Machine', hit: true, why: 'the changed contract' },
  { n: 'AllInOne.java', hit: true, why: 'real faxer — must update' },
  { n: 'OldPrinter.java', hit: true, why: 'must update its LIE 🤡' },
  { n: 'DeskScanner.java', hit: true, why: 'must update its LIE 🤡' },
  { n: 'PrintServer.java (client)', hit: true, why: 'depends on Machine → recompiled & retested' },
  { n: 'ScanApp.java (client)', hit: true, why: 'depends on Machine → recompiled & retested' },
  { n: 'FaxGateway.java (client)', hit: true, why: 'the only one who CARES — also hit' },
]
const FILES_ISP = [
  { n: 'interface Faxable', hit: true, why: 'the changed contract' },
  { n: 'AllInOne.java', hit: true, why: 'the only real faxer — must update' },
  { n: 'FaxGateway.java (client)', hit: true, why: 'the only fax client — must update' },
  { n: 'interface Printable', hit: false }, { n: 'interface Scannable', hit: false },
  { n: 'OldPrinter.java', hit: false }, { n: 'DeskScanner.java', hit: false },
  { n: 'PrintServer.java (client)', hit: false }, { n: 'ScanApp.java (client)', hit: false },
]

function RippleSim() {
  const [world, setWorld] = useState('fat')
  const [fired, setFired] = useState(false)
  const files = world === 'fat' ? FILES_FAT : FILES_ISP
  const hits = files.filter((f) => f.hit).length

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one change request: "fax() needs a countryCode parameter"</div>
      <div className="modbtns">
        <button className={world === 'fat' ? 'on' : ''} onClick={() => { setWorld('fat'); setFired(false) }}>🍔 fat interface world</button>
        <button className={world === 'isp' ? 'on' : ''} onClick={() => { setWorld('isp'); setFired(false) }}>🔪 sliced (ISP) world</button>
      </div>
      <button className="act" onClick={() => setFired(true)} style={{ marginBottom: 12 }}>
        📣 fire the change request
      </button>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {files.map((f) => (
          <span key={f.n} className="chip" style={fired && f.hit
            ? { background: '#FFE0DE', borderColor: 'var(--red)', color: '#8F2B24' }
            : fired ? { opacity: 0.45 } : {}}>
            {f.n}{fired && f.hit && f.why ? ` — ${f.why}` : ''}
          </span>
        ))}
      </div>
      {fired && (
        <div className="statbar">
          💥 <span>blast radius:</span>
          <b>{hits} file{hits > 1 ? 's' : ''} touched {world === 'fat' ? '— including two liars and two clients that never fax!' : '— everyone else never hears about it.'}</b>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: Fat or fine? reviewer game ============ */
const ISP_ITEMS = [
  { d: 'interface Runnable { void run(); } — one method, implemented by thousands of classes.',
    a: 'ok', why: 'The extreme of ISP: one role, one method. That is exactly why Runnable, Comparator and friends fit everywhere (and power lambdas). Small contracts travel far.' },
  { d: 'interface SmartDevice { turnOn(); turnOff(); playMusic(); brewCoffee(); orderGroceries(); } — implemented by SmartBulb.',
    a: 'bad', why: 'A bulb forced to brewCoffee() can only lie. Five unrelated roles in one contract → slice into Switchable, MusicPlayer, CoffeeMaker… and let devices pick their truths.' },
  { d: 'interface Repository { save(Order o); Order findById(String id); } — implemented by SqlRepository and InMemoryRepository.',
    a: 'ok', why: 'Two methods, one cohesive role (storing & finding orders), every implementer does both for real. Cohesion, not method count, decides fat vs fine.' },
  { d: 'A report method only loops over customer names, but its signature demands ArrayList<String> names.',
    a: 'bad', why: 'Client-side ISP: depend on the narrowest thing you actually use. Looping needs Iterable<String> (or List at most) — demanding ArrayList rejects callers with other collections for no reason.' },
  { d: 'interface Bird { fly(); swim(); run(); sing(); } — implemented by Penguin, Ostrich and Sparrow.',
    a: 'bad', why: 'Yesterday\'s penguin factory! No single bird does all four. Capability interfaces (Flyer, Swimmer…) let each species sign only what it can honor — ISP is the cure for LSP\'s disease.' },
  { d: 'interface PaymentMethod { void pay(double amt); } from Day 12, implemented by CardPayment, UpiPayment, CryptoPayment.',
    a: 'ok', why: 'One focused role, fully honored by every implementer, depended on by clients that use exactly that method. Your OCP design was already ISP-clean.' },
]

function IspReview() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= ISP_ITEMS.length
  const cur = ISP_ITEMS[idx]

  function pick(k) {
    if (picked !== null) return
    setPicked(k)
    if (k === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · review the contract — fat or fine?</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Score: <b>{score} / {ISP_ITEMS.length}</b>{score === ISP_ITEMS.length ? ' — lean contracts only!' : '. Cohesion, not size, is the test — replay the misses.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            📜 <span>contract {idx + 1} of {ISP_ITEMS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.d}</p>
          <div className="modbtns">
            <button className={picked !== null && cur.a === 'ok' ? 'on' : ''}
              style={picked === 'ok' && cur.a !== 'ok' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('ok')}>✅ fine — lean & honest</button>
            <button className={picked !== null && cur.a === 'bad' ? 'on' : ''}
              style={picked === 'bad' && cur.a !== 'bad' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
              onClick={() => pick('bad')}>🚨 ISP problem</button>
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ Correct! ' : '❌ Not quite. '}
              {cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={next}>Next contract →</button>
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
  { q: 'The Interface Segregation Principle says…',
    o: ['Every class needs exactly one interface', 'No client should be FORCED to depend on methods it does not use — prefer many small role interfaces over one fat one', 'Interfaces are better than classes', 'Interfaces may have at most 3 methods'], a: 1,
    e: 'ISP is stated from the CLIENT\'s point of view: nobody should have to sign (or depend on) promises irrelevant to them. Slice contracts by role, not by "everything this kind of thing might do".' },
  { q: 'What do classes do when a fat interface demands abilities they don\'t have?',
    o: ['The compiler exempts them', 'They implement dummy methods — empty or throwing UnsupportedOperationException — i.e., they lie', 'They skip those methods', 'Java auto-generates real implementations'], a: 1,
    e: 'Java forces a body for every interface method. No real ability → fake body → every fake is a Liskov violation waiting in some client\'s stack trace. Fat interfaces are penguin factories.' },
  { q: 'Besides forcing lies, what is the OTHER cost of a fat interface?',
    o: ['It uses more RAM', 'Every client is coupled to the whole contract: a change to fax() ripples into print-only and scan-only code that never faxes', 'Interfaces cannot be tested', 'It slows down the JVM'], a: 1,
    e: 'Depending on Machine means depending on ALL of Machine. One method\'s change recompiles, retests, and potentially breaks every client — including the ones that never call it.' },
  { q: 'The standard ISP refactor for Machine { print, scan, fax } is…',
    o: ['One abstract class with empty defaults', 'Role interfaces — Printable, Scannable, Faxable — with each class implementing only what it truly does (and AllInOne implementing all three)', 'Renaming it IMachine', 'Making fax() static'], a: 1,
    e: 'Slice by role. Java classes can implement many interfaces (Day 5\'s multiple inheritance of TYPE), so honest combos are free: class AllInOne implements Printable, Scannable, Faxable.' },
  { q: 'Which JDK design is ISP taken to its logical extreme?',
    o: ['java.util.Vector', 'Functional interfaces like Runnable and Comparator — exactly one role, one method', 'The Object class', 'System.out'], a: 1,
    e: 'One-method interfaces are maximally segregated: any class (or lambda) can sign them, and clients depend on precisely one promise. That tiny size is why they appear everywhere.' },
  { q: 'A method only LOOPS over names it receives. Client-side ISP says its parameter should be…',
    o: ['ArrayList<String> — the concrete class', 'Iterable<String> (or at most List<String>) — the narrowest type that supports what it actually does', 'String[] always', 'Object'], a: 1,
    e: 'Asking for more than you use is a mini fat-contract: you force callers to provide an ArrayList when ANY iterable would do. Demand the narrowest type that covers your real needs.' },
  { q: 'ISP\'s relationship to its SOLID siblings is best described as…',
    o: ['Unrelated rules', 'ISP is SRP applied to interfaces — and it prevents the fat promises that force LSP violations', 'ISP contradicts LSP', 'ISP replaces OCP'], a: 1,
    e: 'One reason-to-change per interface = SRP thinking. And lean honest contracts mean no class is forced to fake methods = no penguins = LSP safe. The principles interlock.' },
  { q: 'What is the danger of OVER-segregating?',
    o: ['None — smaller is always better', 'Interface confetti: one interface per method everywhere, so understanding one object means chasing ten files, with no cohesive roles left', 'The compiler runs out of names', 'It breaks the JVM'], a: 1,
    e: 'Slice by ROLE, not by method. save+findById belong together (one storage role). If two methods are always used together by the same clients, splitting them buys nothing and costs navigation.' },
]

/* ============ The page ============ */
export default function Day14() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 3 · Day 14</div>
        <h1>Interface Segregation:<br />Sign Only the Contracts You Can Keep</h1>
        <p>Yesterday's penguin was forced to promise flying. Today we arrest the real culprit: the
           <em> fat interface</em> that forced the promise. The I of SOLID is the smallest principle with the
           loudest tell — classes that throw instead of doing. Click everything.</p>
        <div className="chips">
          {['ISP', 'fat interface', 'role interfaces', 'client coupling', 'Printable/Scannable', 'narrowest type'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The mega gym contract</h2>
        <p>You want to use the <strong>treadmill</strong>. The gym says: "we only have ONE membership — it includes
          pool, sauna, yoga, and rock climbing. Sign here." Now you are paying for promises you never use. Worse:
          when the <strong>pool rules change</strong>, every member — including treadmill-only you — must come in
          and re-sign the contract.</p>
        <p>A <strong>fat interface</strong> is that mega contract. The <strong>Interface Segregation
          Principle</strong> is the obvious fix nobody does:</p>
        <Note><strong>ISP in one line:</strong> no client should be forced to depend on methods it does not use.
          Offer <strong>many small role contracts</strong> (treadmill plan, pool plan…) instead of one fat one —
          and let everyone sign only what they need and can honor.</Note>
        <Code html={`   ONE FAT CONTRACT 🍔                      SLICED ROLE CONTRACTS 🔪

   interface Machine                       «interface»  «interface»  «interface»
   { print(); scan(); fax(); }             Printable    Scannable    Faxable
     ▲            ▲                            ▲            ▲           ▲
     │            │                            │            │           │
   AllInOne   OldPrinter                   AllInOne ────────┴───────────┘
   (fine ✅)   must fake scan() + fax():    (signs all 3 — honestly)
              throw new Unsupported-       OldPrinter ──▶ Printable only
              OperationException 💥        nobody lies, nobody overpays ✅`} />
        <Reveal summary="Where ISP came from (interview trivia) — click to reveal.">
          <p>Robert Martin formulated ISP while consulting for <strong>Xerox</strong>. Their new multifunction
            printer's software had one giant <C>Job</C> class used by staple jobs, print jobs, fax jobs — any
            change for one job type forced rebuilds and redeploys of all of them, and deployments had grown to an
            hour. The fix that saved the project: one interface per client's needs. Fat interfaces aren't a
            textbook invention — they nearly sank a real product.</p>
        </Reveal>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The crime scene in Java</h2>
        <p>The office-machine version of the mega contract:</p>
        <Code html={`<span class="kw">public interface</span> Machine {
    <span class="kw">void</span> print(Document d);
    <span class="kw">void</span> scan(Document d);
    <span class="kw">void</span> fax(Document d);      <span class="cm">// "every machine faxes" — says who?</span>
}

<span class="kw">public class</span> AllInOne <span class="kw">implements</span> Machine {
    <span class="kw">public void</span> print(Document d) { <span class="cm">/* real ✅ */</span> }
    <span class="kw">public void</span> scan(Document d)  { <span class="cm">/* real ✅ */</span> }
    <span class="kw">public void</span> fax(Document d)   { <span class="cm">/* real ✅ */</span> }
}

<span class="kw">public class</span> OldPrinter <span class="kw">implements</span> Machine {
    <span class="kw">public void</span> print(Document d) { <span class="cm">/* real ✅ */</span> }
    <span class="kw">public void</span> scan(Document d)  { <span class="kw">throw new</span> UnsupportedOperationException(); } <span class="cm">// 🤥</span>
    <span class="kw">public void</span> fax(Document d)   { <span class="kw">throw new</span> UnsupportedOperationException(); } <span class="cm">// 🤥</span>
}`} />
        <p>Java's rule — every interface method MUST get a body in every implementer — leaves OldPrinter only bad
          options: throw (loud lie), empty body (silent lie), or fake behavior (worst lie). <strong>Yesterday you
          met the penguin; today you've found the penguin factory.</strong> Fat interfaces mass-produce LSP
          violations.</p>
        <Warn><strong>The tell:</strong> the moment you type <C>throw new UnsupportedOperationException()</C> inside
          an <C>implements</C>, stop. The interface is confessing that it bundles roles its members don't all have.</Warn>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🤥 Play: Count the lies</h2>
        <p>Pick each device and see what the fat contract forces it to write. Then switch to the sliced world and
          pick them again. Watch the lie counter.</p>
        <ForcedImplementer />
        <Good><strong>What you should notice:</strong> ① The fat world is only comfortable for AllInOne — the
          richest member. Fat contracts always fit the biggest class and squeeze everyone else. ② In the sliced
          world each device's <C>implements</C> line reads like an honest CV. ③ The roles compose: AllInOne signs
          all three small contracts — slicing costs the capable classes nothing.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The second crime: client coupling (the re-signing problem)</h2>
        <p>Forced lies are the visible cost. The expensive cost is quieter — remember the gym: pool rules change,
          <em> treadmill members</em> re-sign. In code:</p>
        <Code html={`<span class="cm">// this client only PRINTS. But its dependency is the WHOLE Machine contract:</span>
<span class="kw">public class</span> PrintServer {
    <span class="kw">private</span> Machine machine;          <span class="cm">// ← coupled to print + scan + fax</span>
    <span class="kw">public void</span> nightlyJob() { machine.print(report); }
}

<span class="cm">// now fax() changes its signature…</span>
<span class="cm">// → interface Machine changes</span>
<span class="cm">// → EVERY implementer changes (even the liars)</span>
<span class="cm">// → PrintServer recompiles & gets retested — for a feature it never calls 💸</span>`} />
        <p>Depending on a fat interface means depending on <strong>every method in it</strong> — your build, your
          tests, and your release schedule are now chained to features you never use. That is exactly the coupling
          ladder from Day 7, climbing through a contract instead of a class.</p>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>💥 Play: The blast radius</h2>
        <p>One real change request — <C>fax()</C> needs a country code. Fire it in both worlds and count the
          files that get hit.</p>
        <RippleSim />
        <Good><strong>What you should notice:</strong> ① In the fat world the change hits <strong>all 7
          files</strong> — including two liars and two clients that never fax. ② In the sliced world it hits
          exactly the 3 files that genuinely care. ③ This is OCP's cousin: small honest contracts shrink every
          future change's blast radius.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The fix: role interfaces</h2>
        <Code html={`<span class="cm">// slice the fat contract into ROLES — one capability each</span>
<span class="kw">public interface</span> Printable { <span class="kw">void</span> print(Document d); }
<span class="kw">public interface</span> Scannable { <span class="kw">void</span> scan(Document d); }
<span class="kw">public interface</span> Faxable   { <span class="kw">void</span> fax(Document d); }

<span class="cm">// each class signs ONLY what it can honor (multiple interfaces are free — Day 5!)</span>
<span class="kw">public class</span> AllInOne <span class="kw">implements</span> Printable, Scannable, Faxable {
    <span class="kw">public void</span> print(Document d) { <span class="cm">/* real */</span> }
    <span class="kw">public void</span> scan(Document d)  { <span class="cm">/* real */</span> }
    <span class="kw">public void</span> fax(Document d)   { <span class="cm">/* real */</span> }
}
<span class="kw">public class</span> OldPrinter <span class="kw">implements</span> Printable {
    <span class="kw">public void</span> print(Document d) { <span class="cm">/* real — and that's ALL it promises */</span> }
}

<span class="cm">// clients now name exactly what they need — nothing more:</span>
<span class="kw">public class</span> PrintServer {
    <span class="kw">private</span> Printable printer;        <span class="cm">// ← coupled to ONE small promise</span>
    <span class="kw">public</span> PrintServer(Printable p) { <span class="kw">this</span>.printer = p; }
}`} />
        <ul>
          <li><strong>Naming convention:</strong> role interfaces often end in <C>-able</C> — <C>Printable</C>,
            <C>Comparable</C>, <C>Runnable</C>, <C>Closeable</C>. The name describes a capability, not a thing.</li>
          <li><strong>Combos are free:</strong> a class implements as many roles as it truly has. The type system
            now documents reality: <C>OldPrinter</C>'s declaration IS its honest spec sheet.</li>
          <li><strong>Clients shrink their demands:</strong> <C>PrintServer</C> asking for <C>Printable</C> instead
            of <C>Machine</C> is the same move as Day 7's "inject the interface" — now with the narrowest interface.</li>
        </ul>
        <Note><strong>ISP has two sides.</strong> Provider side: publish small role interfaces. Client side:
          <em> ask</em> for the narrowest type you actually use — take <C>Iterable</C> if you only loop, take
          <C>Printable</C> if you only print. Both sides shrink coupling.</Note>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>ISP all around you (and the family connections)</h2>
        <ul>
          <li><strong>Functional interfaces</strong> — <C>Runnable</C>, <C>Comparator</C>, <C>Supplier</C> — are
            ISP at its extreme: one role, one method. Their tiny size is exactly why lambdas plug in everywhere.</li>
          <li><strong>The collections API:</strong> <C>Iterable ← Collection ← List</C> is a staircase of growing
            promises — and good code asks for the lowest step it needs.</li>
          <li><strong>Closeable, AutoCloseable, Comparable</strong> — single capabilities bolted onto otherwise
            unrelated classes. Role interfaces in the wild.</li>
        </ul>
        <p>And inside SOLID, the I is the glue between its neighbors:</p>
        <ul>
          <li><strong>ISP = SRP for interfaces:</strong> one role per contract = one reason for the contract to change.</li>
          <li><strong>ISP prevents LSP crimes:</strong> no fat promise → no forced lie → no penguin.</li>
          <li><strong>ISP shrinks OCP's blast radius:</strong> small contracts = small ripples when a slot evolves.</li>
        </ul>
        <Reveal summary="What about default methods — don't they 'fix' fat interfaces? Click to reveal.">
          <p>Java 8 default methods let an interface ship a fallback body, so implementers aren't <em>forced</em>
            to write one. Legitimate use: evolving a published interface without breaking the world (that is why
            they were added). Bad use: <C>default void fax(Document d) {'{ throw new UnsupportedOperationException(); }'}</C>
            — that just moves the lie INTO the interface and hides it from every implementer. A default that
            throws is a fat interface wearing concealer. Slice instead.</p>
        </Reveal>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>📜 Play: Fat or fine?</h2>
        <p>Six contracts up for review — including one that tests the client side (parameter types) and one
          that looks fat but is actually a cohesive role. <strong>The test is cohesion, not method count.
          Predict, then click.</strong></p>
        <IspReview />
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Counting methods instead of roles</h3>
        <p>"More than 3 methods = fat" is NOT the rule. <C>List</C> has ~25 methods and is one cohesive role.
          <C> SmartDevice</C> with 5 methods spanning bulbs and coffee machines is fat. Ask: <em>do all
          implementers honor all of it, and do clients use it together?</em></p>
        <h3>Trap 2 — Interface confetti</h3>
        <p><C>Savable</C>, <C>Findable</C>, <C>Deletable</C>, <C>Countable</C> — four interfaces always implemented
          together by the same classes and used together by the same clients = one role shredded for ceremony.
          Merge them back into <C>Repository</C>.</p>
        <h3>Trap 3 — The header-interface habit</h3>
        <p>Auto-creating <C>IUserService</C> mirroring every method of <C>UserService</C> 1-to-1 is not ISP — it is
          a rubber stamp. Interfaces should be shaped by what CLIENTS need, not by what the class happens to have.</p>
        <h3>Trap 4 — Fixing fat with throwing defaults</h3>
        <p>A <C>default</C> body that throws hides the lie inside the contract itself (see the reveal above).
          Concealer, not surgery.</p>
        <h3>Trap 5 — Forgetting the client side</h3>
        <p>You sliced your interfaces beautifully… and then every method still takes the concrete
          <C> AllInOne</C> as a parameter. ISP is finished only when <em>signatures</em> demand the narrowest role.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>ISP:</strong> no client forced to depend on methods it doesn't use. Many small <strong>role interfaces</strong> &gt; one fat contract.</li>
          <li><strong>Fat interface costs:</strong> ① forced lying implementations (UnsupportedOperationException = penguin factory) ② every client coupled to every method's changes (blast radius).</li>
          <li><strong>Fix:</strong> slice by role (<C>-able</C> names), classes implement honest combos, clients ask for the narrowest type they use (Iterable if you only loop).</li>
          <li><strong>The test is cohesion, not method count</strong> — Repository's save+find is one role; SmartDevice's bulb+coffee is five.</li>
          <li>JDK exemplars: Runnable/Comparator (extreme ISP), Iterable←Collection←List staircase, Closeable.</li>
          <li>Default methods that throw = fat interface in concealer. Use defaults only to evolve published interfaces.</li>
          <li>Family ties: ISP = SRP for interfaces · prevents LSP lies · shrinks OCP ripples.</li>
          <li>Anti-patterns: interface confetti, 1-to-1 header interfaces, sliced interfaces with concrete-typed parameters.</li>
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
        <strong>Day 14 complete?</strong> Homework: in your IDE, build the fat version first —
        <C>interface Employee {'{'} writeCode(); designUI(); deployServers(); attendMeetings(); {'}'}</C> with
        <C> Developer</C>, <C>Designer</C> and <C>DevOpsEngineer</C> forced to lie. Feel the pain, then slice it
        into role interfaces (everyone attends meetings — which interface does THAT go in?), rewrite the three
        classes with honest <C>implements</C> lines, and fix the client: <C>standUp(List&lt;MeetingAttendee&gt; team)</C>.
        Bonus: find one fat interface in any code you've written this month and slice it.
        <br /><br />
        Next: <strong>Day 15 — Dependency Inversion Principle</strong>: the grand finale of SOLID — why high-level
        policy should never bow to low-level detail, and how the dependency arrows in your design can be made to
        point backwards.
      </div>
    </div>
  )
}
