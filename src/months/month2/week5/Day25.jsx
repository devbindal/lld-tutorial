import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: Spawn the goblin army ============ */
function SpawnArmy() {
  const [world, setWorld] = useState('scratch')
  const [army, setArmy] = useState(0)

  const reset = (w) => { setWorld(w); setArmy(0) }
  const spawn = () => setArmy((n) => Math.min(n + 1, 8))

  const scratchCost = army * 2300
  const cloneCost = army === 0 ? 0 : 2300 + (army - 1) * 3

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the level needs goblins — lots of goblins</div>
      <div className="modbtns">
        <button className={world === 'scratch' ? 'on' : ''} onClick={() => reset('scratch')}>🐌 from scratch every time</button>
        <button className={world === 'clone' ? 'on' : ''} onClick={() => reset('clone')}>📠 clone the prototype</button>
      </div>
      <Code html={world === 'scratch'
        ? `<span class="cm">// EVERY goblin pays the full bill:</span>
Goblin g = <span class="kw">new</span> Goblin();      <span class="cm">// load 3D model ... 800ms
                               // load textures ... 600ms
                               // parse AI script .. 500ms
                               // compute stats .... 400ms  = 2300ms 😫</span>`
        : `<span class="cm">// ONE goblin pays the bill; the rest are photocopies:</span>
Goblin prototype = <span class="kw">new</span> Goblin();          <span class="cm">// 2300ms — once, at level load</span>
Goblin g = prototype.copy();              <span class="cm">// ~3ms — just copy fields 📠</span>
g.setPosition(x, y);                      <span class="cm">// tweak the 2 fields that differ</span>`} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={spawn} disabled={army >= 8}>spawn goblin #{army + 1}</button>
        <button className="ghost act" onClick={() => setArmy(0)}>clear level</button>
      </div>
      <div style={{ fontSize: 22, letterSpacing: 4, minHeight: 30, marginBottom: 8 }}>
        {world === 'clone' && army > 0 ? '📠' : ''}{'👺'.repeat(army)}
      </div>
      {army > 0 && (
        <div className="statbar" style={{ background: world === 'scratch' && army >= 3 ? '#FDECEC' : '#FFF6E8' }}>
          ⏱️ <span>level load time for {army} goblin{army > 1 ? 's' : ''}:</span>
          <b>{world === 'scratch'
            ? `${(scratchCost / 1000).toFixed(1)}s ${army >= 3 ? '— players are staring at a loading bar 😡' : ''}`
            : `${(cloneCost / 1000).toFixed(3)}s — one full build + ${army - 1} photocop${army - 1 === 1 ? 'y' : 'ies'} 🎉`}</b>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 2: Shallow vs deep lab ============ */
const LAB_STEPS = ['clone', 'mutate', 'inspect']

function ShallowDeepLab() {
  const [mode, setMode] = useState('shallow')
  const [step, setStep] = useState(-1)

  const reset = (m) => { setMode(m); setStep(-1) }
  const cloned = step >= 0
  const mutated = step >= 1
  const inspected = step >= 2

  const sharedList = mode === 'shallow'
  const origItems = ['🖊️ pen', '📘 book', ...(mutated && sharedList ? ['💣 bomb'] : [])]
  const copyItems = ['🖊️ pen', '📘 book', ...(mutated ? ['💣 bomb'] : [])]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · clone an order, sabotage the copy… check the original</div>
      <div className="modbtns">
        <button className={mode === 'shallow' ? 'on' : ''} onClick={() => reset('shallow')}>🫥 shallow copy (default clone)</button>
        <button className={mode === 'deep' ? 'on' : ''} onClick={() => reset('deep')}>🌊 deep copy</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={() => setStep((s) => Math.min(s + 1, 2))} disabled={step >= 2}>
          {step < 0 ? '① copy = original.clone()' : step === 0 ? '② copy.items.add("💣 bomb")' : '③ print original.items'}
        </button>
        <button className="ghost act" onClick={() => setStep(-1)}>reset</button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="obj" style={{ minWidth: 180 }}>
          <div className="oref">original → Order@a11</div>
          <div className="ofield">customer = "Asha"</div>
          <div className="ofield">items ──▶ {sharedList ? 'List@L1' : 'List@L1'}</div>
        </div>
        {cloned && (
          <div className="obj" style={{ minWidth: 180, borderColor: 'var(--blue)' }}>
            <div className="oref">copy → Order@b22 📠</div>
            <div className="ofield">customer = "Asha" (copied ✓)</div>
            <div className="ofield">items ──▶ {sharedList ? 'List@L1 ⚠️ SAME list!' : 'List@L2 (own copy ✓)'}</div>
          </div>
        )}
        <div className="obj" style={{ minWidth: 170, borderStyle: 'dashed' }}>
          <div className="oref">List@L1 {sharedList && cloned ? '(shared by BOTH)' : "(original's)"}</div>
          {origItems.map((i) => <div className="ofield" key={i}>{i}</div>)}
        </div>
        {cloned && !sharedList && (
          <div className="obj" style={{ minWidth: 170, borderStyle: 'dashed', borderColor: 'var(--blue)' }}>
            <div className="oref">List@L2 (copy's own)</div>
            {copyItems.map((i) => <div className="ofield" key={i}>{i}</div>)}
          </div>
        )}
      </div>
      {inspected && (
        <div className="statbar" style={{ background: sharedList ? '#FDECEC' : '#EAF7EF', marginTop: 10 }}>
          {sharedList
            ? <span>💥 <span><b>original.items = [pen, book, bomb]!</b> The clone copied the REFERENCE, not the list (Day 1's b = a, hiding inside clone()). Two orders, one shared belly — sabotage the copy, poison the original.</span></span>
            : <span>✅ <span><b>original.items = [pen, book].</b> Deep copy gave the clone its OWN list (Day 2's defensive copy, applied at clone time). The twins are truly independent.</span></span>}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: The template drawer (registry) ============ */
const INITIAL_TEMPLATES = {
  goblin: { label: '👺 goblin', atk: 10, hp: 50 },
  elite: { label: '🛡️ elite goblin', atk: 25, hp: 120 },
  boss: { label: '👹 goblin king', atk: 60, hp: 400 },
}

function TemplateDrawer() {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
  const [spawned, setSpawned] = useState([])

  function cloneFrom(key) {
    if (spawned.length >= 6) { setSpawned([]); return }
    const t = templates[key]
    const addr = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')
    setSpawned((s) => [...s, { ...t, addr }])
  }
  function buff() {
    setTemplates((t) => ({ ...t, goblin: { ...t.goblin, atk: t.goblin.atk + 10 } }))
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the registry: pre-configured templates, photocopied on demand</div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>
        THE TEMPLATE DRAWER (registry — built once at startup)
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.entries(templates).map(([k, t]) => (
          <div key={k} className="class-card" style={{ minWidth: 170 }}>
            <div className="cname">"{k}" template</div>
            {t.label} · atk {t.atk} · hp {t.hp}<br />
            <button className="act" style={{ fontSize: 12, padding: '5px 9px', marginTop: 8 }}
              onClick={() => cloneFrom(k)}>registry.spawn("{k}")</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="ghost act" onClick={buff}>⚒️ game designer buffs the GOBLIN TEMPLATE (+10 atk)</button>
        <button className="ghost act" onClick={() => setSpawned([])}>clear field</button>
      </div>
      <div className="heap">
        {spawned.length === 0 ? (
          <div className="empty">Battlefield empty. Spawn from the drawer ↑ (clears after 6)</div>
        ) : (
          spawned.map((s, i) => (
            <div className="obj" key={i}>
              <div className="oref">{s.label.split(' ')[0]} @{s.addr}</div>
              <div className="ofield">atk = {s.atk} · hp = {s.hp}</div>
              <div className="ofield">independent copy ✓</div>
            </div>
          ))
        )}
      </div>
      <div className="statbar">
        🗄️ <span>Buff the template, then spawn another goblin: NEW clones get the buff, EXISTING ones keep their stats — copies are independent, the drawer is the single source of defaults.</span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Prototype pattern\'s intent is…',
    o: ['To make all classes abstract', 'To create new objects by COPYING a pre-configured example, instead of constructing from scratch', 'To prevent copying', 'To test prototypes before release'], a: 1,
    e: 'When construction is expensive or the object is mostly pre-configured, the fastest factory is a photocopier: copy the prototype, tweak the few fields that differ.' },
  { q: 'Prototype shines when…',
    o: ['Objects have two fields', 'Construction is costly (loading, parsing, computing) or you need many variants of a tuned base object at runtime', 'You need exactly one instance', 'Objects are immutable'], a: 1,
    e: 'Game spawning, document templates, pre-tuned configs: pay the full construction once, then stamp out copies in microseconds. Cheap-to-build objects gain nothing — just call new.' },
  { q: 'A SHALLOW copy of an object with a List field copies…',
    o: ['The list and its contents', 'The primitive fields by value, but the list REFERENCE — both objects now share ONE list', 'Nothing', 'Only the list'], a: 1,
    e: 'Object.clone()\'s default is field-by-field: primitives duplicate, references duplicate AS REFERENCES (Day 1\'s b = a). Mutate the copy\'s list and the original changes too — the classic clone bug.' },
  { q: 'A DEEP copy fixes that by…',
    o: ['Locking the list', 'Also copying the mutable objects the fields point to (new list, copied contents) — recursively, as deep as mutability goes', 'Making the list static', 'Using == instead of equals'], a: 1,
    e: 'Each clone gets its own copies of mutable internals — Day 2\'s defensive copying applied at clone time. Immutable fields (String, Money, LocalDate) can be safely shared: nobody can change them anyway (Day 20\'s payoff).' },
  { q: 'Why do Java experts (Effective Java) say AVOID Cloneable/clone()?',
    o: ['It is too fast', 'The mechanism is broken-by-design: a marker interface with no method, protected clone(), checked exception, NO constructor runs, final fields can\'t be set — fragile and error-prone', 'It only works on arrays', 'It was removed in Java 17'], a: 1,
    e: 'Cloneable doesn\'t even declare clone()! The object is created WITHOUT any constructor running (guards skipped!), and every subclass must re-do the ritual correctly. The pattern is great; this mechanism isn\'t.' },
  { q: 'The recommended Java way to implement Prototype is…',
    o: ['Always implements Cloneable', 'A copy constructor — public Order(Order other) — or a copy()/static factory that explicitly copies fields (deep where needed)', 'Serialization round-trips everywhere', 'Reflection'], a: 1,
    e: 'Day 1 taught the copy constructor; today it gets its job title. Explicit, runs real constructor logic, handles deep copying visibly, no Cloneable ritual. (Records: use the canonical constructor or "wither" helpers.)' },
  { q: 'Why do IMMUTABLE objects make the whole copying question vanish?',
    o: ['They copy themselves', 'They can\'t change, so sharing one instance is always safe — you never need a copy at all, just hand out the same reference', 'They have no fields', 'The JVM clones them automatically'], a: 1,
    e: 'You don\'t photocopy the number 7. An immutable Money/DateRange can be shared by a thousand owners with zero risk — Day 20\'s deepest dividend: most "do we need a deep copy?" debates dissolve into "make it immutable".' },
  { q: 'A prototype REGISTRY is…',
    o: ['A list of all classes in the JVM', 'A map of named, pre-configured prototypes ("goblin" → tuned Goblin) — clients spawn(key) to get an independent copy', 'A database table', 'A type of Singleton'], a: 1,
    e: 'The template drawer: tune archetypes once at startup, clone on demand forever. Adding a new archetype = adding an entry — no new classes (compare: Factory Method needs a subclass per variant).' },
]

/* ============ The page ============ */
export default function Day25() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 5 · Day 25 · Creational Patterns · FINALE</div>
        <h1>Prototype:<br />The Fastest Factory Is a Photocopier</h1>
        <p>The last creational pattern — for when building from scratch is expensive and what you really want is
           "another one like THAT". Featuring Java's most famously broken built-in (clone), the shallow-copy
           bug that bites everyone once, and the Week 5 graduation table. Click everything.</p>
        <div className="chips">
          {['prototype', 'clone', 'shallow vs deep', 'copy constructor', 'registry', 'creational recap'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The office photocopier</h2>
        <p>You need to submit a 30-field government form for each of your 12 employees. Two ways:</p>
        <ul>
          <li><strong>From scratch, 12 times:</strong> fetch a blank form, fill all 30 fields — company name,
            address, registration numbers… — again and again. 28 of the 30 fields are IDENTICAL every time.</li>
          <li><strong>The photocopier:</strong> fill ONE master form with the 28 shared fields, photocopy it 12
            times, and write only the 2 per-employee fields on each copy.</li>
        </ul>
        <Code html={`        THE PROTOTYPE IDEA

   build ONCE, expensively:               copy CHEAPLY, forever:
   ┌─────────────────────────┐            prototype.copy() → tweak 2 fields → done
   │  prototype: Goblin      │            prototype.copy() → tweak 2 fields → done
   │  model: loaded (800ms)  │ ──📠──▶    prototype.copy() → tweak 2 fields → done
   │  textures: loaded       │
   │  AI: parsed, stats: ✓   │            each copy: INDEPENDENT object,
   └─────────────────────────┘            ~free to make`} />
        <Note><strong>Prototype's intent:</strong> create new objects by <strong>copying a pre-configured
          example</strong> (the prototype), then adjusting what differs — instead of paying full construction
          cost every time. Use it when construction is <em>expensive</em> or objects are <em>mostly
          pre-tuned</em>.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2 · Interactive</div>
        <h2>👺 Play: Spawn the goblin army</h2>
        <p>A game level needs 8 goblins. Each goblin from scratch costs 2.3 seconds of loading. Spawn the army
          both ways and watch the level-load clock.</p>
        <SpawnArmy />
        <Good><strong>What you should notice:</strong> ① From-scratch cost scales linearly — 8 goblins ≈ 18
          seconds of loading bar. ② Clone-world pays full price exactly once, then ~3ms per copy. ③ The copy
          isn't the whole job — <C>setPosition(x, y)</C> after copying is the "write the 2 differing fields"
          step from the photocopier story.</Good>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Java's built-in copier — and why it's a minefield</h2>
        <p>Java ships a cloning mechanism. Here is the ritual, and its strangeness:</p>
        <Code html={`<span class="kw">public class</span> Goblin <span class="kw">implements</span> Cloneable {      <span class="cm">// ① a MARKER interface — declares no methods!</span>
    <span class="kw">private int</span> atk;
    <span class="kw">private</span> List&lt;Item&gt; loot;

    @Override
    <span class="kw">public</span> Goblin clone() {
        <span class="kw">try</span> {
            <span class="kw">return</span> (Goblin) <span class="kw">super</span>.clone();      <span class="cm">// ② field-by-field copy, done by the JVM…</span>
        } <span class="kw">catch</span> (CloneNotSupportedException e) {  <span class="cm">// ③ …with a checked exception that</span>
            <span class="kw">throw new</span> AssertionError(e);         <span class="cm">//    "cannot happen". Lovely.</span>
        }
    }
}`} />
        <p>Three oddities to know for interviews: <C>Cloneable</C> is an empty <em>marker</em> (it just flips a
          permission bit for <C>Object.clone()</C>); <C>clone()</C> creates the object <strong>without running
          ANY constructor</strong> (every guard you wrote on Day 19 — skipped!); and the default copy is
          <strong> shallow</strong>. That last word is where everyone gets hurt:</p>
        <Warn><strong>Shallow copy = primitives duplicated, references duplicated AS references.</strong> The
          clone's <C>loot</C> field points to <em>the same List object</em> as the original's. Sound familiar?
          It's Day 1's <C>b = a</C> address-copy lesson — hiding inside a method that LOOKS like it copies
          everything.</Warn>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🫥 Play: The shared-belly twins</h2>
        <p>Clone an order, add a 💣 to the COPY's item list, then inspect the ORIGINAL. Run it shallow, then
          deep — and watch the list boxes.</p>
        <ShallowDeepLab />
        <Good><strong>What you should notice:</strong> ① In shallow mode both Order cards point at
          <C> List@L1</C> — one belly, two bodies. ② The sabotage on the copy appears in the original — at a
          distance, later, in code that "never touched" it. ③ Deep mode gives the clone <C>List@L2</C> — the
          defensive-copy move from Day 2, applied at clone time. Rule: <strong>deep-copy every MUTABLE field;
          immutable fields (String, Money) are safe to share.</strong></Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The cleaner Java way: copy constructors</h2>
        <p><em>Effective Java</em>'s verdict on Cloneable is blunt: avoid it. The pattern is excellent; that
          mechanism isn't. The recommended tool is one you met on Day 1 — the <strong>copy
          constructor</strong> — now promoted to its real job:</p>
        <Code html={`<span class="kw">public class</span> Goblin {
    <span class="kw">private final int</span> atk;
    <span class="kw">private final</span> List&lt;Item&gt; loot;
    <span class="kw">private final</span> Mesh model;            <span class="cm">// the expensive, IMMUTABLE asset</span>

    <span class="cm">// the COPY CONSTRUCTOR — explicit, honest, runs like any constructor:</span>
    <span class="kw">public</span> Goblin(Goblin other) {
        <span class="kw">this</span>.atk   = other.atk;                          <span class="cm">// primitive → plain copy</span>
        <span class="kw">this</span>.loot  = <span class="kw">new</span> ArrayList&lt;&gt;(other.loot);       <span class="cm">// mutable → DEEP copy 🌊</span>
        <span class="kw">this</span>.model = other.model;                        <span class="cm">// immutable → SHARE freely ✅</span>
    }

    <span class="kw">public</span> Goblin copy() { <span class="kw">return new</span> Goblin(<span class="kw">this</span>); }   <span class="cm">// fluent alias, reads nicely</span>
}`} />
        <p>Look at the three lines of the body — they are a <strong>complete copying policy</strong>, visible and
          reviewable: primitives copied, mutables deep-copied, immutables shared. And notice the dividend from
          Day 20: the expensive <C>Mesh</C> is immutable, so all thousand goblins can <strong>share one
          model</strong> — the copy is cheap precisely BECAUSE the heavy part never needs copying. (Sharing
          heavy immutable parts has its own pattern name — Flyweight, coming this very week.)</p>
        <Reveal summary="What about records? — click to reveal.">
          <p>Records (Day 20) are immutable, so you rarely copy them — you derive: a "wither" like
            <C> withAtk(int newAtk) {'{'} return new Goblin(newAtk, loot, model); {'}'}</C> returns a tweaked
            sibling. Same photocopier spirit, value-object flavor — and it composes with Day 24:
            <C> toBuilder()</C> on a builder-built object is Prototype wearing a Builder costume.</p>
        </Reveal>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🗄️ Play: The template drawer</h2>
        <p>A prototype <strong>registry</strong>: archetypes tuned once at startup, photocopied on demand. Spawn
          a few of each — then let the game designer buff the goblin TEMPLATE and see who gets stronger.</p>
        <TemplateDrawer />
        <Good><strong>What you should notice:</strong> ① New goblin variants = new drawer entries (data!), not new
          classes — compare with Factory Method, where each variant wanted a subclass. ② Buffing the template
          changes FUTURE spawns only — clones are independent snapshots. ③ The drawer is the single source of
          defaults (DRY, Day 16) while every spawned copy is free to diverge.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Where it earns its keep — and where it doesn't</h2>
        <table className="matrix">
          <thead>
            <tr><th>situation</th><th>prototype?</th><th>why</th></tr>
          </thead>
          <tbody>
            <tr><td>game entities: 200 orcs from tuned archetypes</td><td className="yes">✔ classic</td><td>expensive load once; cheap stamps after</td></tr>
            <tr><td>document/contract templates ("80% pre-filled")</td><td className="yes">✔ classic</td><td>copy the master, edit the blanks</td></tr>
            <tr><td>default Settings object users then customize</td><td className="yes">✔ good</td><td>defaults tuned once; copies diverge safely</td></tr>
            <tr><td>a Point, a Money, any small/immutable object</td><td className="no">✘ skip</td><td>new is instant — and immutables need no copies at all, just share</td></tr>
            <tr><td>"backup" an object before risky changes</td><td>⚠ careful</td><td>works — IF your deep-copy is truly deep; consider immutability instead</td></tr>
          </tbody>
        </table>
        <Note><strong>The immutability shortcut (today's deepest idea):</strong> every hour spent agonizing over
          shallow-vs-deep is an hour bought back by making things immutable. You never photocopy the number 7 —
          you just hand it out. The more of your model is values (Day 20), the less cloning your system needs
          at all.</Note>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Trusting default clone() with mutable fields</h3>
        <p>The shared-belly bug from the lab: <C>super.clone()</C> alone shares every List, Map, array and
          mutable object. If you must use clone, override it to deep-copy the mutable fields — and re-audit every
          time a field is added.</p>
        <h3>Trap 2 — Thinking assignment copies</h3>
        <p><C>Goblin g2 = g1;</C> copies NOTHING — one goblin, two names (Day 1, forever). Copying requires an
          explicit act: copy constructor, copy(), or (sigh) clone().</p>
        <h3>Trap 3 — clone() skips constructors</h3>
        <p>Your constructor validates, registers, counts instances (Day 1's totalCars!)… <C>clone()</C> runs none
          of it. Cloned objects can violate invariants their constructor enforces — copy constructors don't have
          this disease.</p>
        <h3>Trap 4 — The registry handing out the template itself</h3>
        <p><C>return templates.get(key)</C> — forgot to copy! Now every "spawned" goblin IS the template; hurt
          one, hurt them all (and the drawer). The registry's whole contract is: <strong>always return a
          copy.</strong></p>
        <h3>Trap 5 — Deep-copying the universe</h3>
        <p>Deep copy doesn't mean copy EVERYTHING — immutable parts (Strings, Money, the 50MB mesh) should be
          shared, or your "cheap copy" becomes more expensive than construction. Depth follows mutability, not
          enthusiasm.</p>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>📋 Cheat sheet — and the Week 5 creational graduation table</h2>
        <ul>
          <li><strong>Prototype:</strong> copy a pre-configured example + tweak the difference. For expensive construction & pre-tuned variants.</li>
          <li><strong>Shallow</strong> = references shared (default clone) · <strong>deep</strong> = mutable internals copied too. Depth follows MUTABILITY; immutables are shared freely.</li>
          <li><strong>Skip Cloneable</strong> (marker + no constructor run + checked-exception ritual). Use <strong>copy constructors</strong> / <C>copy()</C> — explicit, reviewable policy per field. Records → withers.</li>
          <li><strong>Registry:</strong> named tuned prototypes, <C>spawn(key)</C> → always a fresh copy. Variants are data, not classes.</li>
        </ul>
        <p style={{ marginTop: 14 }}><strong>🏆 Week 5 complete — all five creational patterns:</strong></p>
        <table className="matrix">
          <thead>
            <tr><th>pattern</th><th>the question it answers</th><th>one-liner</th></tr>
          </thead>
          <tbody>
            <tr><td>Singleton (21)</td><td>how MANY may exist?</td><td>exactly one, behind one door (prefer DI)</td></tr>
            <tr><td>Factory Method (22)</td><td>WHO knows the concrete class?</td><td>one counter; clients hold interfaces</td></tr>
            <tr><td>Abstract Factory (23)</td><td>how do products MATCH?</td><td>kits of factory methods — families by construction</td></tr>
            <tr><td>Builder (24)</td><td>how is a COMPLEX one assembled?</td><td>named steps, build() gate, sealed product</td></tr>
            <tr><td>Prototype (25)</td><td>what if building is EXPENSIVE?</td><td>photocopy a tuned example, tweak the rest</td></tr>
          </tbody>
        </table>
        <p>All five are answers to one meta-question: <strong>who calls <C>new</C>, where, and how?</strong>
          Control creation, and the rest of the design stays loose. Next week the question changes: the objects
          exist — now how do we <em>compose</em> them?</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 25 complete — and Week 5 with it! 🏆</strong> Homework: build the spawner. <C>Monster</C> with
        <C> name, atk, List&lt;String&gt; abilities</C> and a copy constructor (deep-copy the list — prove why with
        a test that adds an ability to a copy and checks the original). Then a <C>MonsterRegistry</C> with
        <C> register(key, prototype)</C> and <C>spawn(key)</C> that ALWAYS returns a copy — plus a test that
        spawns two goblins, mutates one, and verifies the other and the template are untouched. Bonus: make
        <C> abilities</C> an immutable <C>List.copyOf</C> and write one sentence on what that simplifies.
        <br /><br />
        Next: <strong>Week 6 — Structural Patterns</strong>, starting with <strong>Day 26 — Adapter</strong>: the
        travel plug of software — making yesterday's incompatible class fit today's socket without rewiring
        either.
      </div>
    </div>
  )
}
