import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../components/ui.jsx'

/* ============ Interactive 1: Public field vs Private guard ============ */
function PublicVsPrivate() {
  const [pub, setPub] = useState(1000)    // public account: anyone writes directly
  const [priv, setPriv] = useState(1000)  // private account: only through a guarded door
  const [input, setInput] = useState('-9999')
  const [msg, setMsg] = useState('Type a number and try to force it into both accounts.')

  function writePublic() {
    const v = Number(input)
    setPub(Number.isNaN(v) ? 0 : v)       // ❌ no guard — accepts ANY value, even garbage
    setMsg('Public field: written directly. No check happened. Whatever you typed is now the balance.')
  }
  function writePrivate() {
    const v = Number(input)
    if (input.trim() === '' || Number.isNaN(v)) { setMsg('🚫 Guard rejected: that is not a number.'); return }
    if (v < 0) { setMsg('🚫 Guard rejected: a balance can never be negative.'); return }
    setPriv(v)
    setMsg('✅ Guard accepted: the value passed every rule, so it was stored.')
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the same attack on two accounts</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <input className="txt" value={input} onChange={(e) => setInput(e.target.value)} aria-label="value to write" />
        <button className="act" onClick={writePublic}>account.balance = value</button>
        <button className="act" onClick={writePrivate}>account.setBalance(value)</button>
        <button className="ghost act" onClick={() => { setPub(1000); setPriv(1000); setMsg('Reset to 1000 each.') }}>reset</button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div className="obj" style={{ minWidth: 230 }}>
          <div className="oref">🚪 OPEN account (public field)</div>
          <div className="ofield">
            public double balance = <b style={{ color: pub < 0 ? 'var(--red)' : 'var(--ink)' }}>{pub}</b>
          </div>
          <div style={{ fontSize: 12.5, color: '#7c8aa5', marginTop: 6 }}>
            {pub < 0 ? '💥 corrupted — object is now in an impossible state' : 'no guard protects this field'}
          </div>
        </div>
        <div className="obj" style={{ minWidth: 230 }}>
          <div className="oref">🛡️ GUARDED account (private + setter)</div>
          <div className="ofield">
            private double balance = <b style={{ color: priv < 0 ? 'var(--red)' : 'var(--green)' }}>{priv}</b>
          </div>
          <div style={{ fontSize: 12.5, color: '#7c8aa5', marginTop: 6 }}>
            only legal values can ever get in
          </div>
        </div>
      </div>
      <div className="statbar">🔎 <span>{msg}</span></div>
    </div>
  )
}

/* ============ Interactive 2: The setter guard (validation) ============ */
function SetterGuard() {
  const [age, setAge] = useState(25)      // the private field, currently valid
  const [input, setInput] = useState('200')
  const [log, setLog] = useState([])

  function trySet() {
    const raw = input.trim()
    const v = Number(raw)
    let entry
    if (raw === '' || Number.isNaN(v))      entry = { ok: false, t: `setAge("${raw}") → rejected: not a number` }
    else if (!Number.isInteger(v))          entry = { ok: false, t: `setAge(${v}) → rejected: age must be a whole number` }
    else if (v < 0)                         entry = { ok: false, t: `setAge(${v}) → rejected: age cannot be negative` }
    else if (v > 150)                       entry = { ok: false, t: `setAge(${v}) → rejected: above 150 is unrealistic` }
    else { entry = { ok: true, t: `setAge(${v}) → accepted ✓` }; setAge(v) }
    setLog((l) => [entry, ...l].slice(0, 6))
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the guard inside the door</div>
      <div className="obj" style={{ maxWidth: 320, marginBottom: 12 }}>
        <div className="oref">person → Person@3e7a</div>
        <div className="ofield">private int age = <b style={{ fontSize: 18 }}>{age}</b></div>
        <div style={{ fontSize: 12.5, color: '#7c8aa5', marginTop: 4 }}>this value is ALWAYS valid — the guard guarantees it</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input className="txt" value={input} onChange={(e) => setInput(e.target.value)} aria-label="age to set" />
        <button className="act" onClick={trySet}>person.setAge(value)</button>
        <button className="ghost act" onClick={() => setLog([])}>clear log</button>
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>ATTEMPT LOG (newest first)</div>
      {log.length === 0 ? (
        <div className="empty">No attempts yet. Try <b>200</b>, then <b>-5</b>, then <b>30</b>, then <b>abc</b>.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {log.map((e, i) => (
            <div key={i} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 13, padding: '7px 10px', borderRadius: 7,
              background: e.ok ? '#E8F6EE' : '#FDECEC', color: e.ok ? '#1d7a4d' : '#b23535',
              border: `1px solid ${e.ok ? '#bfe6cd' : '#f3c9c9'}`,
            }}>{e.ok ? '✅' : '🚫'} {e.t}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: Defensive copying ============ */
function DefensiveCopy() {
  const [safe, setSafe] = useState(false)                       // false = leaky getter, true = defensive copy
  const [items, setItems] = useState(['Sword', 'Shield', 'Potion']) // the object's PRIVATE inventory
  const [outsider, setOutsider] = useState([])                  // the list the outsider is holding
  const [msg, setMsg] = useState('First press getInventory(), then let the outsider attack.')

  function getInventory() {
    setOutsider([...items]) // outsider receives a list either way (we copy here just for display)
    setMsg(safe
      ? '📦 Outsider received a fresh COPY of the inventory.'
      : '📦 Outsider received the REAL internal list — a live reference into the object.')
  }
  function attack() {
    if (outsider.length === 0) { setMsg('Outsider holds nothing yet — press getInventory() first.'); return }
    if (safe) {
      setOutsider([])
      setMsg('🛡️ Outsider cleared their COPY. The object’s real inventory is untouched.')
    } else {
      setOutsider([])
      setItems([]) // they held the real reference — clearing it wipes the object's own state
      setMsg('💥 Outsider cleared the REAL list. The object’s private inventory is now empty!')
    }
  }
  function reset() { setItems(['Sword', 'Shield', 'Potion']); setOutsider([]); setMsg('Reset.') }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · does the getter leak the keys to your house?</div>
      <div className="modbtns" style={{ marginBottom: 12 }}>
        <button className={!safe ? 'on' : ''} onClick={() => { setSafe(false); reset() }}>leaky getter (return list)</button>
        <button className={safe ? 'on' : ''} onClick={() => { setSafe(true); reset() }}>safe getter (return copy)</button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div className="obj" style={{ minWidth: 210 }}>
          <div className="oref">player → Player@9f2c</div>
          <div className="ofield">private List items =</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, marginTop: 4 }}>
            {items.length ? `[ ${items.join(', ')} ]` : <span style={{ color: 'var(--red)' }}>[ ] ← empty!</span>}
          </div>
        </div>
        <div className="obj" style={{ minWidth: 210 }}>
          <div className="oref">🕵️ outsider holds</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, marginTop: 4 }}>
            {outsider.length ? `[ ${outsider.join(', ')} ]` : '[ ]'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button className="act" onClick={getInventory}>outsider: getInventory()</button>
        <button className="act ghost" onClick={attack}>outsider: items.clear()</button>
        <button className="ghost act" onClick={reset}>reset</button>
      </div>
      <div className="statbar" style={{ background: items.length === 0 ? '#FDECEC' : '#FFF6E8' }}>
        {safe ? '🛡️' : '⚠️'} <span>{msg}</span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'What is encapsulation, in one line?',
    o: ['Putting many classes in one file', 'Hiding the internal data and exposing only safe methods', 'Copying one object into another', 'Making everything static'], a: 1,
    e: 'Encapsulation = bundling data with the code that guards it, and hiding the data behind methods so it can never reach an invalid state.' },
  { q: 'Why are public fields considered bad in LLD?',
    o: ['They use more memory', 'Anyone can write any value directly, so the object can be corrupted with no validation', 'They are slower to read', 'Java forbids them'], a: 1,
    e: 'A public field has no guard. Outsiders can set balance = -9999 directly, putting the object in an impossible state. Private + setter lets you validate first.' },
  { q: 'A setter with no validation inside it (just this.x = x;) is…',
    o: ['Always wrong — never write one', 'Basically a public field with extra typing — it adds little protection', 'Faster than a public field', 'Required by Java'], a: 1,
    e: 'The whole point of a setter is the guard. With no checks it gives almost the same freedom as a public field. Add validation, or drop the setter entirely.' },
  { q: 'You write: private final List<String> items = new ArrayList<>(); Can the list still be changed?',
    o: ['No, final makes the list read-only', 'Yes — final only stops items from pointing to a NEW list; the existing list can still be added to / cleared', 'Only if it is static', 'Java will not compile this'], a: 1,
    e: 'final freezes the reference, not the object. You can still call items.add(...) or items.clear(). For a truly read-only list, wrap it (e.g. Collections.unmodifiableList) or copy it.' },
  { q: 'A getter returns the object’s real internal list directly. What is the risk?',
    o: ['None, it is efficient', 'The caller now holds a live reference and can mutate your private data from outside', 'It throws a NullPointerException', 'The list becomes static'], a: 1,
    e: 'That breaks encapsulation: the outsider can call clear() or add() on your internal list. Return a copy (or an unmodifiable view) — this is defensive copying.' },
  { q: 'Which set of rules makes a class immutable?',
    o: ['Mark every method static', 'final class, all fields private final, no setters, set everything in the constructor, and defensively copy any mutable field in and out', 'Make every field public final', 'Add a copy constructor'], a: 1,
    e: 'Immutable = no way to change state after construction. Private final fields, no setters, defensive copies of mutable inputs/outputs, and a final class so nobody overrides behavior.' },
  { q: 'Why is an immutable object easy to use across threads?',
    o: ['It is smaller', 'Its state never changes after creation, so there is nothing to corrupt by two threads at once', 'It is always static', 'The JVM locks it automatically'], a: 1,
    e: 'No writes after construction means no race conditions on its state. Immutable objects are automatically thread-safe and make safe Map keys — you will rely on this in Month 4.' },
  { q: 'Best practice for object fields in everyday LLD?',
    o: ['public fields, public methods', 'private fields, and public methods only for behavior outsiders truly need', 'protected fields so subclasses can reach them', 'static fields to avoid making objects'], a: 1,
    e: 'Default habit: fields private, expose behavior (methods) not data. Add getters/setters only where genuinely needed, and put validation in the setters.' },
]

/* ============ The page ============ */
export default function Day2() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 1 · Day 2</div>
        <h1>Encapsulation:<br />Hide the Data, Guard the Door</h1>
        <p>Yesterday you built objects. Today you learn how to <strong>protect</strong> them so they can never fall into a broken,
           impossible state. This single habit — hide the fields, guard the methods — is the backbone of every clean design
           you will ever write. Read slowly. Click everything. Try to break the demos.</p>
        <div className="chips">
          {['encapsulation', 'private fields', 'getters/setters', 'validation', 'immutability', 'final', 'defensive copy'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What is encapsulation?</h2>
        <p>Think about a <strong>medicine capsule</strong>. The powder inside is delicate. You never grab the raw powder with your
          fingers — the smooth shell holds it together and lets you take it safely. The word <strong>encapsulation</strong> literally
          means "putting something inside a capsule."</p>
        <p>In code, the "powder" is your object's <strong>data (fields)</strong>, and the "shell" is a wall of <C>private</C> that
          hides it. The only way in or out is through a few <strong>official doors (methods)</strong> that you control.</p>
        <p>Now picture a <strong>bank</strong>. The cash sits inside a locked vault. You cannot walk in and grab notes. You go to the
          counter and ask the teller (a method), who <strong>checks the rules first</strong> — enough balance? amount positive? — and
          only then moves the money. We will carry this <strong>vault + teller</strong> picture through the whole day.</p>
        <ul>
          <li><strong>Hide the state:</strong> make fields <C>private</C> so outsiders cannot touch them directly.</li>
          <li><strong>Expose behavior:</strong> give <C>public</C> methods that do the job <em>and</em> enforce the rules.</li>
        </ul>
        <Note><strong>One-line memory trick:</strong> Encapsulation = <em>data is private, behavior is public, and every change goes
          through a guard.</em> No object should ever be able to reach an impossible state.</Note>
        <Reveal summary={<>Is encapsulation the same as abstraction? Click to reveal.</>}>
          <p>No — they are cousins. <strong>Encapsulation</strong> is about <em>hiding the data and protecting it</em> (the vault wall).
            <strong> Abstraction</strong> is about <em>hiding the complexity</em> and showing a simple idea (you press "withdraw", you do
            not think about how the vault opens). You hide data <em>with</em> encapsulation so you can offer a clean abstraction.
            Abstraction gets its own full day (Day 5).</p>
        </Reveal>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Why public fields are dangerous</h2>
        <p>Let us see the problem first. Here is a bank account with a <C>public</C> balance — the vault door left wide open:</p>
        <Code html={`<span class="kw">public class</span> BankAccount {
    <span class="kw">public double</span> balance;   <span class="cm">// 🚪 wide open — anyone can write it</span>
}

BankAccount a = <span class="kw">new</span> BankAccount();
a.balance = <span class="num">500</span>;      <span class="cm">// ok so far...</span>
a.balance = <span class="num">-9999</span>;    <span class="cm">// 💥 a negative balance?! nothing stopped it</span>
a.balance = a.balance + <span class="str">"oops"</span>; <span class="cm">// careless code corrupts state silently</span>`} />
        <p>The object is now in a state that should be <strong>impossible</strong> in real life. And the worst part: the broken value
          could be set from <em>anywhere</em> in a huge codebase, so when you later find a negative balance you have <strong>no idea
          which line did it.</strong></p>
        <Warn><strong>The core rule:</strong> if any field is public, you have given up all control over it. You can no longer promise
          the object is ever valid. Every bug becomes a hunt across the whole project.</Warn>
        <p>The fix is to lock the field and add a guarded door:</p>
        <Code html={`<span class="kw">public class</span> BankAccount {
    <span class="kw">private double</span> balance;        <span class="cm">// 🔒 hidden behind the vault wall</span>

    <span class="kw">public void</span> deposit(<span class="kw">double</span> amount) {   <span class="cm">// 🚪 the only door in — with a guard</span>
        <span class="kw">if</span> (amount <= <span class="num">0</span>)
            <span class="kw">throw new</span> IllegalArgumentException(<span class="str">"amount must be positive"</span>);
        balance += amount;             <span class="cm">// only valid changes ever happen</span>
    }
}
<span class="cm">// a.balance = -9999;  ❌ won't even compile now. The guard can't be skipped. 🎉</span>`} />
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🔓 Play: attack two accounts</h2>
        <p>The left account exposes a <strong>public field</strong>; the right one hides it behind a <strong>guarded setter</strong>.
          Type a value (start with the pre-filled <C>-9999</C>) and fire it at both. Watch which object you can corrupt and which one
          defends itself.</p>
        <PublicVsPrivate />
        <Good><strong>What you should notice:</strong> ① The public field swallows <em>any</em> value — negatives, garbage, anything —
          and turns red when broken. ② The private setter inspects the value first and <strong>refuses</strong> the bad ones. ③ The
          guarded object is <em>always</em> valid, no matter what an outsider tries.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Getters and setters — the official doors</h2>
        <p>Once a field is <C>private</C>, outsiders still sometimes need to <em>read</em> it or <em>change</em> it. You give them two
          tiny, well-named methods instead of the raw field:</p>
        <ul>
          <li><strong>Getter</strong> — reads the value. Named <C>getX()</C>. For a boolean, named <C>isX()</C>.</li>
          <li><strong>Setter</strong> — changes the value, <em>after checking the rules</em>. Named <C>setX(value)</C>.</li>
        </ul>
        <Code html={`<span class="kw">public class</span> Person {
    <span class="kw">private</span> String name;     <span class="cm">// 🔒 private fields</span>
    <span class="kw">private int</span> age;
    <span class="kw">private boolean</span> active;

    <span class="cm">// ---- getters: just hand back the value ----</span>
    <span class="kw">public</span> String getName() { <span class="kw">return</span> name; }
    <span class="kw">public int</span> getAge()      { <span class="kw">return</span> age; }
    <span class="kw">public boolean</span> isActive() { <span class="kw">return</span> active; }   <span class="cm">// boolean → "isActive", not "getActive"</span>

    <span class="cm">// ---- setter: GUARD first, then store ----</span>
    <span class="kw">public void</span> setAge(<span class="kw">int</span> age) {
        <span class="kw">if</span> (age < <span class="num">0</span> || age > <span class="num">150</span>)
            <span class="kw">throw new</span> IllegalArgumentException(<span class="str">"age out of range"</span>);
        <span class="kw">this</span>.age = age;   <span class="cm">// only reached if the value is legal</span>
    }
}`} />
        <Note><strong>Naming convention (memorize):</strong> <C>getName()</C> / <C>setName()</C> for normal fields, <C>isActive()</C>
          for booleans. Tools, frameworks (Spring, Jackson), and interviewers all expect exactly this shape.</Note>
        <Warn><strong>Do not add getters and setters blindly.</strong> A setter with no checks (<C>this.x = x;</C> and nothing else)
          is barely better than a public field. Only expose what callers truly need, and put a real guard in every setter that has a
          rule. Many fields should have <em>no</em> setter at all (see immutability, Section 6).</Warn>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🛂 Play: the setter guard</h2>
        <p>Here is a <C>Person</C> whose <C>age</C> is private. The only way to change it is <C>setAge(...)</C>, and that method runs a
          guard: the age must be a whole number between 0 and 150. <strong>Try to sneak a bad value past it.</strong> Test
          <C>200</C>, then <C>-5</C>, then <C>30</C>, then <C>abc</C>.</p>
        <SetterGuard />
        <Good><strong>What you should notice:</strong> the <C>age</C> field <em>never</em> shows an illegal value. Bad attempts are
          logged and thrown away; only legal ones get stored. That promise — "this field is always valid" — is exactly what
          encapsulation buys you.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Immutability &amp; <code style={{ fontFamily: 'IBM Plex Mono' }}>final</code> — objects that never change</h2>
        <p>Sometimes the safest object is one that <strong>cannot be changed at all</strong> after it is born. We call it
          <strong> immutable</strong>. Think of a printed <strong>banknote</strong>: once printed, its value is fixed forever. If you
          want a different amount, you use a different note — you do not edit the one in your hand.</p>
        <p>The keyword <C>final</C> means "assign once, then frozen." A <C>final</C> field must be set exactly once (at declaration or
          in the constructor) and can never be reassigned.</p>
        <Code html={`<span class="kw">public final class</span> Money {        <span class="cm">// final class → nobody can subclass &amp; break the rules</span>
    <span class="kw">private final</span> String currency;   <span class="cm">// final → set once, then frozen</span>
    <span class="kw">private final long</span> cents;

    <span class="kw">public</span> Money(String currency, <span class="kw">long</span> cents) {
        <span class="kw">if</span> (cents < <span class="num">0</span>) <span class="kw">throw new</span> IllegalArgumentException(<span class="str">"no negative money"</span>);
        <span class="kw">this</span>.currency = currency;     <span class="cm">// set everything in the constructor...</span>
        <span class="kw">this</span>.cents = cents;
    }

    <span class="kw">public</span> String getCurrency() { <span class="kw">return</span> currency; }  <span class="cm">// getters only — NO setters</span>
    <span class="kw">public long</span> getCents()    { <span class="kw">return</span> cents; }

    <span class="cm">// to "change" money, you RETURN A NEW object — the original stays untouched</span>
    <span class="kw">public</span> Money plus(Money other) {
        <span class="kw">return new</span> Money(currency, <span class="kw">this</span>.cents + other.cents);
    }
}`} />
        <p><strong>The recipe for an immutable class:</strong></p>
        <ol>
          <li>Make the class <C>final</C> (so no subclass can add a way to mutate it).</li>
          <li>Make every field <C>private final</C>.</li>
          <li>Set all fields <strong>in the constructor</strong>, and provide <strong>no setters</strong>.</li>
          <li>If a field is itself mutable (a list, a date, an array), <strong>defensively copy</strong> it going in <em>and</em> coming out (next section).</li>
        </ol>
        <Good><strong>Why bother?</strong> Immutable objects are <em>thread-safe for free</em> (nothing to corrupt — no writes ever
          happen), they make <strong>safe keys</strong> in a <C>HashMap</C>, they are easy to reason about, and they can be shared
          freely without fear that someone changes them behind your back. Java's own <C>String</C>, <C>Integer</C>, and
          <C>LocalDate</C> are all immutable for exactly these reasons.</Good>
        <Reveal summary={<>Trap: does <C>final</C> on a list make the list read-only? Click to reveal.</>}>
          <p><strong>No!</strong> <C>final</C> freezes the <em>reference</em>, not the contents.</p>
          <Code html={`<span class="kw">private final</span> List&lt;String&gt; tags = <span class="kw">new</span> ArrayList&lt;&gt;();
tags = <span class="kw">new</span> ArrayList&lt;&gt;();  <span class="cm">// ❌ compile error — can't repoint a final reference</span>
tags.add(<span class="str">"hi"</span>);            <span class="cm">// ✅ totally allowed — the list itself is NOT frozen</span>`} />
          <p>To get a truly unchangeable list, wrap it: <C>List.copyOf(tags)</C> or <C>Collections.unmodifiableList(tags)</C>, and copy
            it defensively. <C>final</C> alone is not enough.</p>
        </Reveal>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🛡️ Play: defensive copying (the leaky getter)</h2>
        <p>Here is the sneakiest way to break encapsulation, even with private fields. A <C>Player</C> keeps a <strong>private list</strong>
          of items. It offers <C>getInventory()</C>. But what if that getter hands back the <em>real</em> list? The outsider now holds a
          live wire straight into your object.</p>
        <p>Flip between a <strong>leaky getter</strong> (returns the real list) and a <strong>safe getter</strong> (returns a copy). Then:
          press <C>getInventory()</C>, and let the outsider call <C>clear()</C> on what they received.</p>
        <DefensiveCopy />
        <Good><strong>What you should notice:</strong> with the <strong>leaky</strong> getter, the outsider's <C>clear()</C> empties the
          object's own private inventory — your "private" field was never safe. With the <strong>safe</strong> getter, the outsider only
          destroys their own copy; your real data is untouched.</Good>
        <p>The fix is to <strong>copy mutable data on the way out</strong> (and on the way in):</p>
        <Code html={`<span class="kw">public class</span> Player {
    <span class="kw">private final</span> List&lt;String&gt; items;

    <span class="kw">public</span> Player(List&lt;String&gt; items) {
        <span class="kw">this</span>.items = <span class="kw">new</span> ArrayList&lt;&gt;(items); <span class="cm">// 🛡️ copy IN — caller can't keep a handle on our field</span>
    }

    <span class="kw">public</span> List&lt;String&gt; getItems() {
        <span class="kw">return new</span> ArrayList&lt;&gt;(items);          <span class="cm">// 🛡️ copy OUT — caller gets a copy, not our list</span>
        <span class="cm">// or: return List.copyOf(items);  → an unmodifiable view</span>
    }
}`} />
        <Note><strong>Defensive copying rule:</strong> if a field is a mutable object (List, Map, array, Date), never store or return the
          caller's reference directly. Copy it at the boundary. Otherwise your "private" field has a secret public back door.</Note>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — A setter with no guard</h3>
        <Code html={`<span class="kw">public void</span> setAge(<span class="kw">int</span> age) { <span class="kw">this</span>.age = age; } <span class="cm">// ❌ accepts -5, 9999, anything</span>`} />
        <p>If there is no rule to enforce, ask whether the field even needs a setter. A guard-less setter gives away the protection you
          made the field private for.</p>
        <h3>Trap 2 — <C>final</C> ≠ deeply immutable</h3>
        <p>As we saw, <C>final</C> only freezes the reference. A <C>final</C> list can still be added to and cleared. Real immutability
          needs <C>final</C> <strong>plus</strong> no setters <strong>plus</strong> defensive copies of mutable fields.</p>
        <h3>Trap 3 — The leaky getter / leaky constructor</h3>
        <Code html={`<span class="kw">public</span> List&lt;String&gt; getItems() { <span class="kw">return</span> items; } <span class="cm">// ❌ hands out the real list</span>
<span class="kw">public</span> Account(Date opened) { <span class="kw">this</span>.opened = opened; } <span class="cm">// ❌ stores the caller's mutable Date</span>`} />
        <p>Both let outside code mutate your internals. Copy on the way in and on the way out.</p>
        <h3>Trap 4 — Exposing fields just to satisfy a tool</h3>
        <p>Do not auto-generate a getter <em>and</em> setter for every field out of habit. Each public method is a promise you must keep
          forever. Expose the minimum. Many fields are read-only or fully internal.</p>
        <h3>Trap 5 — Forgetting <C>equals()</C> / <C>hashCode()</C> on value objects</h3>
        <p>An immutable "value object" like <C>Money</C> should compare by <em>content</em>, not address. If you plan to put it in a
          <C>HashSet</C> or use it as a <C>HashMap</C> key, override <C>equals()</C> and <C>hashCode()</C> together. (Remember Day 1:
          <C>==</C> compares addresses; <C>.equals()</C> compares content.)</p>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Encapsulation in real LLD — the mindset</h2>
        <p>Encapsulation is not just "add private and getters." It is a way of thinking: <strong>an object should protect its own
          rules (its "invariants") so no outsider can ever break them.</strong></p>
        <ul>
          <li>Ask of every field: <em>"Who is allowed to change this, and under what rule?"</em> That answer becomes your method.</li>
          <li>Prefer telling an object to <strong>do something</strong> (<C>account.withdraw(100)</C>) over reaching in to read-modify-write
            its data from outside. This is the seed of the "Tell, Don't Ask" principle you will meet in Week 4.</li>
          <li>Good encapsulation makes future change cheap: you can swap the internal representation (an <C>int</C> becomes a
            <C>Money</C> object) without touching any caller, because callers only ever saw the methods.</li>
        </ul>
        <Note><strong>Looking ahead:</strong> a private constructor (Day 1) plus encapsulated state is what makes the <strong>Singleton</strong>
          and <strong>Builder</strong> patterns work (Month 2, Week 5). Immutability becomes a thread-safety superpower in Month 4.</Note>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Encapsulation</strong> = hide data (<C>private</C> fields), expose behavior (<C>public</C> methods), guard every change.</li>
          <li><strong>Public fields are a bug waiting to happen</strong> — no validation, corruptible from anywhere. Make fields private.</li>
          <li><strong>Getter</strong> <C>getX()</C> / <C>isX()</C> for booleans. <strong>Setter</strong> <C>setX()</C> — and it must <em>validate</em>, or it should not exist.</li>
          <li><strong>Immutable class:</strong> <C>final</C> class, all fields <C>private final</C>, set in constructor, no setters, defensive copies for mutable fields. "Change" = return a new object.</li>
          <li><strong><C>final</C> freezes the reference, not the object.</strong> A final list can still be mutated.</li>
          <li><strong>Defensive copy</strong> mutable fields on the way IN (constructor/setter) and OUT (getter), or hand back an unmodifiable view.</li>
          <li><strong>Value objects</strong> (immutable, compared by content) should override <C>equals()</C> + <C>hashCode()</C>.</li>
          <li>Golden habit: expose the <em>minimum</em>. Each public method is a promise you must keep.</li>
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
        <strong>Day 2 complete?</strong> Homework before Day 3: in your own IDE, write an immutable <C>BankAccount</C> with a
        <C>private final</C> balance and owner name. Provide <C>deposit(amount)</C> and <C>withdraw(amount)</C> that <strong>return a new
        BankAccount</strong> (never mutate), each guarding against invalid amounts and overdrawing. Add a <C>private final</C> list of
        transactions and prove, with a small test, that an outsider calling your getter <em>cannot</em> clear the real history.
        <br /><br />
        Next: <strong>Day 3 — Inheritance</strong>: <C>is-a</C>, <C>extends</C>, method overriding, <C>super</C>, and constructor chaining up the hierarchy.
      </div>
    </div>
  )
}
