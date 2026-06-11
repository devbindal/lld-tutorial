import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The flyweight forest ============ */
function FlyweightForest() {
  const [world, setWorld] = useState('naive')
  const [trees, setTrees] = useState(0)

  const reset = (w) => { setWorld(w); setTrees(0) }
  const plant = () => setTrees((t) => t + 1000)

  const naiveMB = trees * 1               // each tree lugs its own 1MB mesh+texture copy
  const flyMB = trees === 0 ? 0 : 3 + (trees * 24) / (1024 * 1024)  // 3 shared types + 24B/tree
  const mem = world === 'naive' ? naiveMB : flyMB
  const crashed = world === 'naive' && naiveMB > 4096
  const pct = Math.min(100, (mem / 4096) * 100)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the game level needs a forest — heap size: 4 GB</div>
      <div className="modbtns">
        <button className={world === 'naive' ? 'on' : ''} onClick={() => reset('naive')}>😇 every tree carries its mesh</button>
        <button className={world === 'fly' ? 'on' : ''} onClick={() => reset('fly')}>🪶 flyweight forest</button>
      </div>
      <Code html={world === 'naive'
        ? `<span class="kw">class</span> Tree {
    <span class="kw">double</span> x, y;
    Mesh mesh;          <span class="cm">// 0.7 MB … copied into EVERY tree</span>
    Texture bark;       <span class="cm">// 0.3 MB … copied into EVERY tree</span>
}`
        : `<span class="kw">class</span> TreeType {                 <span class="cm">// the FLYWEIGHT — heavy, IMMUTABLE, shared</span>
    <span class="kw">final</span> Mesh mesh; <span class="kw">final</span> Texture bark;   <span class="cm">// 1 MB — exists ONCE per species</span>
}
<span class="kw">class</span> Tree {                     <span class="cm">// per-tree (EXTRINSIC) part — tiny</span>
    <span class="kw">double</span> x, y;                 <span class="cm">// 16 bytes</span>
    TreeType type;               <span class="cm">// 8-byte reference to the shared flyweight</span>
}`} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={plant} disabled={crashed}>🌱 plant 1,000 trees</button>
        <button className="ghost act" onClick={() => setTrees(0)}>clear level</button>
      </div>
      <div style={{ fontSize: 18, letterSpacing: 2, minHeight: 26, marginBottom: 8 }}>
        {'🌳🌲🌴'.repeat(Math.min(Math.ceil(trees / 1000), 10))}
      </div>
      <div style={{ height: 14, background: '#eee', borderRadius: 7, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct > 85 ? 'var(--red)' : pct > 55 ? '#E8A33D' : 'var(--green)', transition: 'width .3s' }} />
      </div>
      <div className="statbar" style={{ background: crashed ? '#FDECEC' : '#FFF6E8' }}>
        {crashed
          ? <span>💥 <b>java.lang.OutOfMemoryError: Java heap space</b> — at ~4,000 trees. The level wanted a MILLION. Every tree is hauling a private copy of the same oak mesh.</span>
          : <span>📊 <span>{trees.toLocaleString()} trees →</span> <b>{mem < 1 ? mem.toFixed(2) : Math.round(mem).toLocaleString()} MB</b>
            <span>{world === 'fly' && trees > 0 ? ' — 3 shared TreeTypes + 24 bytes per tree. A MILLION trees ≈ 27 MB. 🪶' : ''}</span></span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: The shared-state catastrophe ============ */
function SharedCatastrophe() {
  const [world, setWorld] = useState('mutable')
  const [treeTypes, setTreeTypes] = useState(['oak', 'pine', 'oak', 'oak', 'pine', 'oak', 'pine', 'oak', 'oak', 'pine'])
  const [oakColor, setOakColor] = useState('green') // mutable world: the SHARED type's field
  const [sel, setSel] = useState(2)
  const [fired, setFired] = useState(false)

  const reset = (w) => { setWorld(w); setOakColor('green'); setTreeTypes(['oak', 'pine', 'oak', 'oak', 'pine', 'oak', 'pine', 'oak', 'oak', 'pine']); setFired(false) }

  function paintSelected() {
    setFired(true)
    if (world === 'mutable') {
      if (treeTypes[sel] === 'oak') setOakColor('red')      // mutating the SHARED flyweight
    } else {
      setTreeTypes((ts) => ts.map((t, i) => (i === sel ? 'redOak' : t)))  // factory hands a DIFFERENT type
    }
  }

  const emoji = (t) => (t === 'pine' ? '🌲' : t === 'redOak' ? '🍁' : oakColor === 'red' ? '🍁' : '🌳')

  return (
    <div className="panel">
      <div className="ptitle">Live demo · "make THAT one tree red for autumn" — the #1 flyweight crime</div>
      <div className="modbtns">
        <button className={world === 'mutable' ? 'on' : ''} onClick={() => reset('mutable')}>😱 mutable flyweight</button>
        <button className={world === 'immutable' ? 'on' : ''} onClick={() => reset('immutable')}>🔒 immutable flyweight</button>
      </div>
      <Code html={world === 'mutable'
        ? `tree[<span class="num">${sel}</span>].getType().setColor(<span class="str">"red"</span>);   <span class="cm">// "just this one tree"… right? 😬</span>`
        : `<span class="cm">// no setColor() exists. You ASK THE FACTORY for a different shared type:</span>
tree[<span class="num">${sel}</span>].setType(TreeTypeFactory.get(<span class="str">"oak"</span>, <span class="str">"red"</span>));   <span class="cm">// new key → new (cached) flyweight</span>`} />
      <p style={{ fontSize: 13.5, marginBottom: 6 }}>Pick a victim, then paint it:</p>
      <div style={{ fontSize: 26, letterSpacing: 4, marginBottom: 10 }}>
        {treeTypes.map((t, i) => (
          <span key={i} onClick={() => setSel(i)}
            style={{ cursor: 'pointer', padding: '2px 3px', borderRadius: 6, outline: sel === i ? '2px solid var(--blue)' : 'none' }}>
            {emoji(t)}
          </span>
        ))}
      </div>
      <button className="act" onClick={paintSelected} style={{ marginBottom: 10 }}>🍂 paint tree #{sel} red</button>
      {fired && (
        <div className="statbar" style={{ background: world === 'mutable' && oakColor === 'red' ? '#FDECEC' : '#EAF7EF' }}>
          {world === 'mutable'
            ? (oakColor === 'red'
              ? <span>💥 <b>EVERY oak in the game just turned red.</b> All oaks share ONE TreeType object — you painted the shared stamp, not the stamping. Flyweight rule #1: shared state must be IMMUTABLE (Day 20, with a forest on fire as the proof).</span>
              : <span>That tree was a pine — try selecting an oak 🌳 to see the disaster.</span>)
            : <span>✅ <b>Only tree #{sel} changed.</b> The immutable type CAN’T be edited — instead the factory supplied a different shared type ("red oak"), now cached and reusable for every autumn tree to come.</span>}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: The bridge grid ============ */
const REMOTES = ['BasicRemote', 'AdvancedRemote', 'VoiceRemote']
const DEVICES = ['TV 📺', 'Radio 📻', 'Speaker 🔊']

function BridgeGrid() {
  const [world, setWorld] = useState('inherit')
  const [m, setM] = useState(2)
  const [n, setN] = useState(2)
  const [remote, setRemote] = useState(0)
  const [device, setDevice] = useState(0)
  const [log, setLog] = useState(null)

  function act(action) {
    const dev = DEVICES[device]
    const traces = {
      volumeUp: `${REMOTES[remote]}.volumeUp() → device.setVolume(vol + 10) → ${dev} volume: 40`,
      mute: remote === 0
        ? `BasicRemote has no mute() — upgrade the ABSTRACTION side, devices untouched`
        : `${REMOTES[remote]}.mute() → device.setVolume(0) → ${dev} muted 🔇`,
      voice: remote === 2
        ? `VoiceRemote hears "louder" 🎤 → device.setVolume(vol + 10) → ${dev} volume: 40`
        : `only VoiceRemote listens — pick it on the left`,
    }
    setLog(traces[action])
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · remotes × devices — multiply or add?</div>
      <div className="modbtns">
        <button className={world === 'inherit' ? 'on' : ''} onClick={() => setWorld('inherit')}>😱 one subclass per combo</button>
        <button className={world === 'bridge' ? 'on' : ''} onClick={() => setWorld('bridge')}>🌉 bridge</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="ghost act" onClick={() => setM((x) => Math.min(x + 1, 3))} disabled={m >= 3}>+ remote type ({m}/3)</button>
        <button className="ghost act" onClick={() => setN((x) => Math.min(x + 1, 3))} disabled={n >= 3}>+ device type ({n}/3)</button>
      </div>
      {world === 'inherit' ? (
        <div>
          <div className="heap">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {REMOTES.slice(0, m).flatMap((r) => DEVICES.slice(0, n).map((d) => (
                <span className="chip" key={r + d}>{r.replace('Remote', '')}{d.split(' ')[0]}Remote</span>
              )))}
            </div>
          </div>
          <div className="statbar" style={{ background: m * n >= 6 ? '#FDECEC' : '#FFF6E8' }}>
            💥 <span>{m} remotes × {n} devices =</span> <b>{m * n} classes — every new remote multiplies by {n}; every new device by {m}. Two dimensions are MULTIPLYING.</b>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>ABSTRACTION side (remotes)</div>
              <div className="modbtns">
                {REMOTES.slice(0, m).map((r, i) => (
                  <button key={r} className={remote === i ? 'on' : ''} onClick={() => { setRemote(i); setLog(null) }}>{r}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>IMPLEMENTOR side (devices)</div>
              <div className="modbtns">
                {DEVICES.slice(0, n).map((d, i) => (
                  <button key={d} className={device === i ? 'on' : ''} onClick={() => { setDevice(i); setLog(null) }}>{d}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <button className="act" onClick={() => act('volumeUp')}>volumeUp()</button>
            <button className="act" onClick={() => act('mute')}>mute()</button>
            <button className="act" onClick={() => act('voice')}>🎤 say "louder"</button>
          </div>
          {log && (
            <div className="statbar" style={{ marginBottom: 8 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{log}</span>
            </div>
          )}
          <div className="statbar" style={{ background: '#EAF7EF' }}>
            🌉 <span>{m} remotes + {n} devices =</span> <b>{m + n} classes — ANY remote drives ANY device through the Device interface. Adding one of either = ONE new class.</b>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Flyweight pattern\'s intent is…',
    o: ['To make objects faster', 'To support HUGE numbers of fine-grained objects by SHARING their common (intrinsic) state instead of copying it into every instance', 'To lazily create objects', 'To compress files'], a: 1,
    e: 'A million trees can\'t each carry a 1 MB mesh — but they can share 3 meshes and each keep only x,y + a reference. Sharing the heavy common part is the whole trick.',
    w: { 0: 'Memory, not speed, is the target (speed sometimes improves via cache locality — a bonus).',
         2: 'Lazy creation is the virtual Proxy (Day 29).',
         3: 'No compression — just no duplication.' },
    r: { id: 's2', label: 'Section 2 — the million-object bill' } },
  { q: 'Intrinsic vs extrinsic state — define both.',
    o: ['Private vs public fields', 'Intrinsic = the shareable, context-free part stored IN the flyweight (mesh, glyph shape); extrinsic = the per-use part (x,y, color-this-time) kept OUTSIDE and passed in by the context', 'Static vs instance fields', 'Primitive vs object fields'], a: 1,
    e: 'The split is the design act: whatever is identical across uses goes intrinsic (shared); whatever varies per use stays extrinsic (carried by the caller/context object).',
    w: { 0: 'Visibility is unrelated.',
         2: 'Static sharing is class-wide — flyweights share per-KEY (3 tree types, not 1 global).',
         3: 'Type of field is irrelevant; ROLE of the data decides.' },
    r: { id: 's2', label: 'Section 2 — intrinsic vs extrinsic' } },
  { q: 'Why MUST flyweights be immutable?',
    o: ['Java requires it', 'Hundreds of contexts share one instance — mutate it and every sharer changes at once (paint one oak, the forest turns red)', 'Immutable objects are smaller', 'To avoid garbage collection'], a: 1,
    e: 'Sharing is only safe when nothing can change (Day 20\'s deepest rule). "Different" flyweights aren\'t edited — they\'re DIFFERENT instances requested from the factory.',
    w: { 0: 'No language rule — a survival rule.',
         2: 'Same size; safe to share is the point.',
         3: 'GC is unaffected.' },
    r: { id: 's5', label: 'Section 5 — the catastrophe lab' } },
  { q: 'Which JDK features ARE flyweights you met weeks ago?',
    o: ['ArrayList and HashMap', 'The String pool ("hi" shared by every literal) and Integer.valueOf\'s −128..127 cache — shared immutable instances handed out by a factory', 'Threads', 'Streams'], a: 1,
    e: 'Day 1\'s string pool and Day 22\'s Integer cache finally get their pattern name: canonical, immutable, factory-shared instances. (And that\'s exactly why == "works" on them sometimes — same shared object!)',
    w: { 0: 'Collections copy nothing for you.',
         2: 'Threads are heavyweight by definition. 🙂',
         3: 'Streams are pipelines, not shared instances.' },
    r: { id: 's6', label: 'Section 6 — flyweights in the JDK' } },
  { q: 'The Bridge pattern\'s intent is…',
    o: ['To connect two networks', 'To DECOUPLE an abstraction from its implementation so the TWO hierarchies can grow independently — composition instead of a multiplying inheritance grid', 'To translate interfaces', 'To share heavy objects'], a: 1,
    e: 'Remote × Device, Notification × Channel, Shape × Renderer: when two dimensions vary, give each its own hierarchy and connect them with one has-a reference.',
    w: { 0: 'Networking bridges are a different industry. 🙂',
         2: 'Translation is Adapter (26).',
         3: 'Sharing is Flyweight — this morning.' },
    r: { id: 's7', label: 'Section 7 — the m×n problem' } },
  { q: 'The Bridge math: m remote types and n device types need ___ classes with inheritance, ___ with bridge.',
    o: ['m+n and m×n', 'm×n and m+n — every combo-subclass collapses into "abstraction HOLDS an implementor"', 'always 2', 'm² and n²'], a: 1,
    e: '3×3=9 subclasses become 3+3=6 classes, and growth turns additive: a 4th device = ONE class, not three new combos. Day 7\'s composition-over-inheritance, applied to whole hierarchies.',
    w: { 0: 'Backwards — inheritance multiplies, bridge adds.',
         2: 'Both sides keep their variety — it\'s the COMBINATIONS that stop being classes.',
         3: 'No squaring anywhere.' },
    r: { id: 's9', label: 'Section 9 — the grid demo' } },
  { q: 'Bridge vs Strategy — the structures look IDENTICAL (object holds interface). The difference?',
    o: ['No difference, same pattern', 'Intent and scale: Strategy swaps ONE algorithm behind one interface (behavioral, often per-call); Bridge splits TWO WHOLE HIERARCHIES that each keep growing (structural, architectural)', 'Bridge uses abstract classes only', 'Strategy is compile-time'], a: 1,
    e: 'Same UML, different story: DiscountPolicy on Day 12 was strategy-shaped (one varying behavior). Remote/Device is bridge-shaped (remotes AND devices each have subclass families). Naming the twin and the difference is interview gold.',
    w: { 0: 'GoF separates them — by intent, as always with the look-alikes.',
         2: 'Either side can use interfaces or abstract classes.',
         3: 'Both are runtime-composed.' },
    r: { id: 's10', label: 'Section 10 — bridge\'s twins' } },
  { q: 'Bridge vs Adapter in one line (the timing answer)?',
    o: ['Identical', 'Adapter is RETROFIT glue for incompatibles that already exist; Bridge is DESIGNED-IN up front so two dimensions never fuse in the first place', 'Bridge is for hardware', 'Adapter only works on streams'], a: 1,
    e: 'GoF\'s own line: adapter makes things work AFTER they\'re designed; bridge makes them work BEFORE. Day 26\'s corner planted this; today it\'s yours.',
    w: { 0: 'Different birth moments, different intents.',
         2: 'The remote/device example is a metaphor, not a requirement. 🙂',
         3: 'Streams showcase adapters/decorators; bridges live in your architecture.' },
    r: { id: 's10', label: 'Section 10 — bridge vs adapter' } },
]

/* ============ The page ============ */
export default function Day30() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 6 · Day 30 · Structural Patterns · FINALE</div>
        <h1>Flyweight &amp; Bridge:<br />Share the Heavy, Split the Multiplying</h1>
        <p>The structural finale: one pattern fits a MILLION objects into memory by sharing what's common;
           the other stops two class hierarchies from multiplying into a grid of subclasses. Finish today and
           you own all seven structural patterns. Click everything.</p>
        <div className="chips">
          {['flyweight', 'intrinsic vs extrinsic', 'string pool', 'bridge', 'm×n → m+n', 'two hierarchies'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The rubber stamp and the universal remote</h2>
        <Code html={`   🪶 THE RUBBER STAMP (Flyweight)            🌉 THE UNIVERSAL REMOTE (Bridge)

   one carved stamp — used 10,000 times       any remote drives any device because
   each stamping differs only in              both meet at a STANDARD: the remote
   POSITION and INK (cheap!)                  holds "a Device", not a fused
   you never carve 10,000 stamps              SamsungTVBasicRemote subclass

   shares the HEAVY COMMON part               splits TWO GROWING dimensions
   so a million uses stay cheap               so they add instead of multiply`} />
        <Note><strong>Today's two intents:</strong> <strong>Flyweight</strong> — support huge numbers of
          fine-grained objects by sharing their common (intrinsic) state. <strong>Bridge</strong> — decouple an
          abstraction from its implementation so the two hierarchies vary independently.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Flyweight's crime scene: the million-object bill</h2>
        <p>A game level wants a million trees. Each Tree object stores its position… and its 3D mesh and bark
          texture — 1 MB each. A million × 1 MB = <strong>a terabyte of RAM for one forest</strong>. Yet look at
          the data: 999,997 of those meshes are byte-identical copies of three species.</p>
        <p>The fix is one decision — split every field into two buckets:</p>
        <table className="matrix">
          <thead>
            <tr><th></th><th>INTRINSIC (the stamp)</th><th>EXTRINSIC (the stamping)</th></tr>
          </thead>
          <tbody>
            <tr><td>what</td><td>identical across uses: mesh, texture, species name</td><td>varies per use: x, y, age, health</td></tr>
            <tr><td>lives</td><td className="yes">INSIDE the shared flyweight — once per KIND</td><td>outside — in each tiny context object (or passed as parameters)</td></tr>
            <tr><td>mutability</td><td className="no">MUST be immutable (it's shared!)</td><td>free to change per tree</td></tr>
          </tbody>
        </table>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The structure: flyweight + factory (two old friends, reassembled)</h2>
        <Code html={`<span class="cm">// the FLYWEIGHT — heavy, immutable (Day 20!), shared:</span>
<span class="kw">public final class</span> TreeType {
    <span class="kw">private final</span> String species;
    <span class="kw">private final</span> Mesh mesh; <span class="kw">private final</span> Texture bark;   <span class="cm">// the 1 MB, ONCE</span>
    <span class="kw">public void</span> draw(<span class="kw">double</span> x, <span class="kw">double</span> y) { <span class="cm">/* extrinsic state arrives as PARAMETERS */</span> }
}

<span class="cm">// the FACTORY with a cache (Day 22's instance control, Day 25's registry):</span>
<span class="kw">public class</span> TreeTypeFactory {
    <span class="kw">private static final</span> Map&lt;String, TreeType&gt; CACHE = <span class="kw">new</span> HashMap&lt;&gt;();
    <span class="kw">public static</span> TreeType get(String species) {
        <span class="kw">return</span> CACHE.computeIfAbsent(species, TreeType::<span class="kw">new</span>);  <span class="cm">// first ask creates, rest share</span>
    }
}

<span class="cm">// the CONTEXT — what a "tree" really is now: 24 bytes</span>
<span class="kw">public class</span> Tree {
    <span class="kw">private double</span> x, y;                  <span class="cm">// extrinsic</span>
    <span class="kw">private final</span> TreeType type;          <span class="cm">// reference to the shared stamp</span>
    <span class="kw">public void</span> draw() { type.draw(x, y); }   <span class="cm">// hand MY context to OUR stamp</span>
}`} />
        <p>Nothing here is new machinery — it's Day 20 (immutable value), Day 22 (caching factory) and Day 25
          (registry of canon instances) assembled for one goal: <strong>one instance per distinct KIND, shared
          by every use.</strong></p>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🌲 Play: Plant the forest</h2>
        <p>Plant aggressively in the naive world first — the heap is 4 GB.</p>
        <FlyweightForest />
        <Good><strong>What you should notice:</strong> ① The naive world dies at ~4,000 trees — 0.4% of the goal —
          because every object lugs a private copy of identical data. ② Flyweight's bill: 3 MB once, then
          24 bytes per tree; the MILLION-tree forest costs ~27 MB. ③ The trees aren't "smaller objects" — they're
          split objects: tiny unique part here, heavy shared part referenced.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🍂 Play: The autumn catastrophe</h2>
        <p>A designer asks: "make THAT one tree red." Try it in both worlds.</p>
        <SharedCatastrophe />
        <Good><strong>What you should notice:</strong> ① In the mutable world, painting "one tree" painted every
          oak on the map — you edited the shared stamp itself. ② The immutable world physically lacks a setter;
          change = ask the factory for a DIFFERENT shared type. ③ This is Day 20's immutability rule with
          consequences you can SEE — and it's why String/Integer being immutable is what makes their pools safe.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>You've been using flyweights since Day 1</h2>
        <ul>
          <li><strong>The String pool:</strong> every <C>"hi"</C> literal in the entire program is ONE shared
            String — which is why Day 1's <C>a == b</C> was true for literals. Pool = flyweight cache;
            immutability (Day 2) is what makes the sharing safe.</li>
          <li><strong><C>Integer.valueOf</C>'s −128..127 cache</strong> (Day 22's == trap): canonical shared
            instances from a factory. Same for <C>Boolean.TRUE</C>, enum constants (Day 19 — enums are
            flyweights by construction!).</li>
          <li><strong>Glyphs &amp; sprites:</strong> GoF invented the name for text editors — one 'e' glyph
            object, a million placements. Game sprites, map markers, particle systems: same move.</li>
        </ul>
        <Warn><strong>When NOT to bother:</strong> flyweight is an OPTIMIZATION pattern — it complicates code
          (state splitting, factory discipline) to save memory. Apply it when a profiler shows millions of
          similar objects, not on day one (Day 16's YAGNI, and Knuth nodding about premature optimization).</Warn>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Bridge's crime scene: two dimensions multiplying</h2>
        <p>Your TV app has remotes: Basic and Advanced. And devices: TV and Radio. Inheritance "solves" it:</p>
        <Code html={`        Remote
   ┌──────┼─────────┬─────────────┐
BasicTVRemote  BasicRadioRemote  AdvancedTVRemote  AdvancedRadioRemote   <span class="cm">// 2×2 = 4 😐</span>

<span class="cm">// product asks for: VoiceRemote… and Speaker support…</span>
<span class="cm">// 3 remotes × 3 devices = 9 subclasses 😬 … 4×4 = 16 😱</span>
<span class="cm">// and the SAME volume logic is copy-pasted across every row (DRY, Day 16)</span>`} />
        <p>The disease has a precise signature: <strong>subclass names made of TWO varying words</strong>
          (Basic+TV, Advanced+Radio). Two independent dimensions got fused into one hierarchy, so they multiply.
          You met this exact smell in Day 7's class explosion — Bridge is its architectural cure.</p>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>The bridge: give each dimension its own hierarchy</h2>
        <Code html={`<span class="cm">// the IMPLEMENTOR side — dimension 2 gets its own small interface:</span>
<span class="kw">public interface</span> Device {
    <span class="kw">int</span> getVolume(); <span class="kw">void</span> setVolume(<span class="kw">int</span> v);
}
<span class="kw">public class</span> Tv <span class="kw">implements</span> Device { <span class="cm">/* TV-specific volume hardware */</span> }
<span class="kw">public class</span> Radio <span class="kw">implements</span> Device { <span class="cm">/* radio-specific */</span> }

<span class="cm">// the ABSTRACTION side — dimension 1, holding THE BRIDGE (one has-a field):</span>
<span class="kw">public class</span> Remote {
    <span class="kw">protected final</span> Device device;            <span class="cm">// ← the bridge itself</span>
    <span class="kw">public</span> Remote(Device device) { <span class="kw">this</span>.device = device; }
    <span class="kw">public void</span> volumeUp() { device.setVolume(device.getVolume() + <span class="num">10</span>); }
}
<span class="kw">public class</span> AdvancedRemote <span class="kw">extends</span> Remote {   <span class="cm">// abstraction side grows freely…</span>
    <span class="kw">public</span> AdvancedRemote(Device d) { <span class="kw">super</span>(d); }
    <span class="kw">public void</span> mute() { device.setVolume(<span class="num">0</span>); }  <span class="cm">// …using only the Device contract</span>
}

<span class="cm">// any × any, wired at runtime (Day 15's plug board):</span>
Remote r1 = <span class="kw">new</span> AdvancedRemote(<span class="kw">new</span> Tv());
Remote r2 = <span class="kw">new</span> BasicRemote(<span class="kw">new</span> Radio());    <span class="cm">// 4th device next year? ONE new class.</span>`} />
        <p>GoF's confusing vocabulary, decoded: "<strong>Abstraction</strong>" = the side clients talk to
          (Remote) — NOT necessarily an abstract class. "<strong>Implementor</strong>" = the platform-ish side
          doing raw work (Device). The pattern is literally Day 7's "composition over inheritance" promoted
          from rescuing one class to rescuing <strong>two whole hierarchies</strong>.</p>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>🌉 Play: Multiply or add</h2>
        <p>Grow both dimensions in the inheritance world, then cross the bridge — and drive any device with any
          remote.</p>
        <BridgeGrid />
        <Good><strong>What you should notice:</strong> ① Inheritance-world grows by MULTIPLICATION (every new
          remote × every device); bridge-world by ADDITION. ② In the trace, AdvancedRemote.mute() works on ANY
          device, because it's written against the Device interface — the volume logic exists once. ③ The two
          sides even grow independently: VoiceRemote needed zero device changes.</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Bridge's look-alikes (the disambiguation that wins offers)</h2>
        <ul>
          <li><strong>vs Adapter (Day 26):</strong> timing. Adapter = retrofit glue AFTER incompatible things
            exist. Bridge = designed-in BEFORE, so the dimensions never fuse.</li>
          <li><strong>vs Strategy (Week 7):</strong> the structural TWIN — both are "object holds an interface."
            Strategy swaps one ALGORITHM (behavioral, often per call); Bridge separates two GROWING
            HIERARCHIES (structural, architectural). Same UML, different story — say this sentence in an
            interview and watch the nod.</li>
          <li><strong>In the wild:</strong> JDBC (your code → <C>java.sql</C> abstraction side; vendor drivers =
            implementor side), SLF4J over logging backends, graphics APIs over OpenGL/DirectX/Vulkan, your
            Notification types × Channel implementations from Days 7/12 — already a bridge, unnamed.</li>
        </ul>
        <Reveal summary="The 'when do I reach for Bridge' checklist — click to reveal.">
          <p>① Subclass names with two varying words (PdfColorPrinter, SmsAlertNotification). ② A feature request
            on ONE dimension forces edits across the other. ③ You need to pick the implementation at RUNTIME
            (config-driven device/driver). Any two of the three → split the hierarchies now; un-fusing later
            costs 10×.</p>
        </Reveal>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet — and the Week 6 structural graduation</h2>
        <ul>
          <li><strong>Flyweight:</strong> split state intrinsic (shared, IMMUTABLE, in the flyweight) vs extrinsic (per-use, passed in); caching factory hands out canon instances. JDK: String pool, Integer cache, enums. Optimization pattern — profile first. Crime: mutating a shared flyweight.</li>
          <li><strong>Bridge:</strong> two varying dimensions → two hierarchies + one has-a field. m×n → m+n; growth becomes additive; sides evolve independently. Twins: Adapter (timing), Strategy (intent). Smell: two-word subclass names.</li>
        </ul>
        <table className="matrix">
          <thead>
            <tr><th>pattern</th><th>day</th><th>one-liner</th></tr>
          </thead>
          <tbody>
            <tr><td>🧩 Adapter</td><td>26</td><td>translate an interface so incompatibles fit</td></tr>
            <tr><td>🎁 Decorator</td><td>27</td><td>same interface, stack added behaviors at runtime</td></tr>
            <tr><td>🌳 Composite</td><td>28</td><td>trees of objects answer like single objects</td></tr>
            <tr><td>🛎️ Facade</td><td>29</td><td>one simple door to a whole subsystem</td></tr>
            <tr><td>🛡️ Proxy</td><td>29</td><td>same-interface stand-in controlling access</td></tr>
            <tr><td>🪶 Flyweight</td><td>30</td><td>share the heavy common state across millions</td></tr>
            <tr><td>🌉 Bridge</td><td>30</td><td>split two hierarchies so they add, not multiply</td></tr>
          </tbody>
        </table>
        <p>Seven answers to one question: <strong>how do existing objects relate without strangling each
          other?</strong> Next week the question changes again: how do objects <em>behave and talk</em> —
          Strategy, Observer, Command, State, Template Method.</p>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: Why is it called "flyweight"?'>
          <p>From boxing's lightest weight class (under 51 kg): the pattern makes objects so light that millions
            can exist. GoF coined it for the glyph-sharing text editor in their book. Tiny trivia, reliable
            smile.</p>
        </Reveal>
        <Reveal summary="Q: Where does extrinsic state LIVE if not in the flyweight?">
          <p>Two homes: tiny CONTEXT objects (our 24-byte Tree holding x,y + type ref) — or nowhere at all,
            passed as method parameters at use time (<C>type.draw(x, y)</C>). The second is lighter but pushes
            bookkeeping to callers; real systems mix both.</p>
        </Reveal>
        <Reveal summary="Q: Flyweight factories and threads — what's the concurrency story?">
          <p>The flyweights themselves are immutable → safe to share across threads with zero locking (Day 20's
            dividend). The CACHE is the risk: plain HashMap.computeIfAbsent isn't thread-safe — use
            ConcurrentHashMap (its computeIfAbsent is atomic per key). One-line answer interviewers love:
            "immutable values, concurrent cache."</p>
        </Reveal>
        <Reveal summary="Q: Is Java's String.intern() a flyweight API? Any cautions?">
          <p>Yes — intern() asks the pool "give me the canonical instance," manually flyweighting runtime
            strings. Cautions: pre-Java-7 it lived in PermGen (OOM stories), interning unbounded user input is
            a memory leak by design, and modern dedup (G1 string deduplication) often does it better
            automatically.</p>
        </Reveal>
        <Reveal summary="Q: In Bridge, can the ABSTRACTION side add methods the IMPLEMENTOR doesn't have?">
          <p>That's the point! AdvancedRemote.mute() exists only on the abstraction side, COMPOSED from
            implementor primitives (setVolume(0)). The implementor interface stays a small set of primitives;
            abstractions build rich behavior on top — keep that interface lean (Day 14) or every device pays
            for every remote idea.</p>
        </Reveal>
        <Reveal summary="Q: Is JDBC a Bridge or an Adapter? (the debate question)">
          <p>Defensible both ways — say so, then commit: it was DESIGNED up front as two independent hierarchies
            (API evolves; drivers multiply) → Bridge intent. But each individual driver translating a vendor
            protocol into java.sql is adapter-work. "Bridge architecture whose implementors are adapters" is the
            complete answer.</p>
        </Reveal>
        <Reveal summary="Q: Could Flyweight and Composite work together?">
          <p>GoF's own combo: share LEAF nodes of huge trees (a million identical 'e' glyph leaves in a
            document tree). Constraint: shared leaves can't store parent pointers (one node, many parents —
            it's a DAG now) — so context/extrinsic data must carry position. Knowing the parent-pointer clash
            shows real depth.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s12">
        <div className="sec-label">Section 12 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 30 complete — and Week 6 with it! 🏆 All seven structural patterns are yours.</strong>
        Homework, both halves: ① FLYWEIGHT — a chess army: <C>PieceType</C> (name, unicode symbol, movement
        rules — immutable) behind a caching factory; <C>Piece</C> = color + square + type reference. Place all
        32 pieces, then print how many PieceType instances exist (should be 6!) and prove two knights share one
        type with <C>==</C> (the one place it's legal — why?). ② BRIDGE — <C>Notification</C> (Alert, Digest,
        Promo) × <C>Channel</C> (Email, Sms, Push — reuse Day 7's homework!): build it fused-inheritance first
        (count the 9 classes), then bridge it (count 6), then add WhatsappChannel and write down how many files
        each world touched. ③ One sentence: why did the flyweight HAVE to be immutable but the bridge's Device
        didn't?
        <br /><br />
        Next: <strong>Week 7 — Behavioral Patterns</strong>, starting with <strong>Day 31 — Strategy</strong>:
        the pattern you've been accidentally building since Day 7's robot — now with its official name, its
        lambda-era form, and its place in every pricing engine ever shipped.
      </div>
    </div>
  )
}
