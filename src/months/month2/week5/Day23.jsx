import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The room builder ============ */
const STYLES = {
  victorian: { label: 'Victorian', chair: '🪑 carved oak chair', sofa: '🛋️ tufted velvet sofa', table: '🕰️ clawfoot table', color: '#8B5A2B' },
  modern: { label: 'Modern', chair: '🪑 minimal steel chair', sofa: '🛋️ low gray sofa', table: '⬜ glass slab table', color: '#5B6B7A' },
  artdeco: { label: 'ArtDeco', chair: '🪑 gold-trim fan chair', sofa: '🛋️ emerald arc sofa', table: '💠 mirrored sunburst table', color: '#A8842C' },
}
const STYLE_KEYS = Object.keys(STYLES)

function RoomBuilder() {
  const [world, setWorld] = useState('mix')
  const [factory, setFactory] = useState('victorian')
  const [room, setRoom] = useState([])

  const reset = (w) => { setWorld(w); setRoom([]) }

  function buy(piece) {
    if (room.length >= 6) { setRoom([]); return }
    const style = world === 'mix' ? STYLE_KEYS[Math.floor(Math.random() * 3)] : factory
    setRoom((r) => [...r, { piece, style }])
  }
  const distinctStyles = [...new Set(room.map((p) => p.style))]
  const clash = distinctStyles.length > 1

  return (
    <div className="panel">
      <div className="ptitle">Live demo · furnish the living room — will it match?</div>
      <div className="modbtns">
        <button className={world === 'mix' ? 'on' : ''} onClick={() => reset('mix')}>🎲 mix & match world</button>
        <button className={world === 'af' ? 'on' : ''} onClick={() => reset('af')}>🏭 abstract factory world</button>
      </div>
      {world === 'af' && (
        <div className="modbtns">
          {STYLE_KEYS.map((k) => (
            <button key={k} className={factory === k ? 'on' : ''} onClick={() => { setFactory(k); setRoom([]) }}>
              new {STYLES[k].label}Factory()
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={() => buy('chair')}>{world === 'af' ? 'factory.createChair()' : 'buy a chair'}</button>
        <button className="act" onClick={() => buy('sofa')}>{world === 'af' ? 'factory.createSofa()' : 'buy a sofa'}</button>
        <button className="act" onClick={() => buy('table')}>{world === 'af' ? 'factory.createTable()' : 'buy a table'}</button>
        <button className="ghost act" onClick={() => setRoom([])}>empty the room</button>
      </div>
      <div className="heap">
        {room.length === 0 ? (
          <div className="empty">The room is empty. Buy some furniture ↑</div>
        ) : (
          room.map((p, i) => (
            <div className="obj" key={i} style={{ borderColor: STYLES[p.style].color }}>
              <div className="oref">{STYLES[p.style].label}{p.piece[0].toUpperCase() + p.piece.slice(1)}</div>
              <div className="ofield">{STYLES[p.style][p.piece]}</div>
            </div>
          ))
        )}
      </div>
      {room.length >= 2 && (
        <div className="statbar" style={{ background: clash ? '#FDECEC' : '#EAF7EF' }}>
          {clash
            ? <span>💥 <span><b>Style clash!</b> {distinctStyles.map((s) => STYLES[s].label).join(' + ')} in one room. In mix-world, nothing STOPS a Victorian chair next to a Modern sofa — consistency depends on every caller being careful, forever.</span></span>
            : <span>✨ <span><b>Perfectly matched.</b> {world === 'af' ? 'And it CANNOT clash: every piece came from the same factory object — consistency is enforced by the design, not by discipline.' : 'You got lucky with the dice — try a few more pieces.'}</span></span>}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 2: The theme switcher ============ */
const THEMES = {
  mac: {
    label: 'MacFactory',
    win: { background: '#f6f6f8', border: '1px solid #d8d8de', borderRadius: 12, font: "'IBM Plex Sans'" },
    titlebar: { dots: true, align: 'left' },
    button: { background: 'linear-gradient(#4f8ef7,#2d6ae3)', color: '#fff', border: 'none', borderRadius: 8 },
    check: { borderRadius: 9, background: '#2d6ae3', border: 'none' },
    scroll: { borderRadius: 6, thumb: '#b9b9c2' },
  },
  windows: {
    label: 'WindowsFactory',
    win: { background: '#ececec', border: '2px solid #7a7a7a', borderRadius: 0, font: "'IBM Plex Sans'" },
    titlebar: { dots: false, align: 'right' },
    button: { background: '#e1e1e1', color: '#111', border: '1.5px solid #5a5a5a', borderRadius: 2 },
    check: { borderRadius: 2, background: '#fff', border: '1.5px solid #5a5a5a' },
    scroll: { borderRadius: 0, thumb: '#8a8a8a' },
  },
}

function ThemeSwitcher() {
  const [theme, setTheme] = useState('mac')
  const [checked, setChecked] = useState(true)
  const t = THEMES[theme]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one dialog, two factories — every widget re-skins together</div>
      <div className="modbtns">
        {Object.entries(THEMES).map(([k, v]) => (
          <button key={k} className={theme === k ? 'on' : ''} onClick={() => setTheme(k)}>GuiFactory f = new {v.label}()</button>
        ))}
      </div>
      <div style={{ maxWidth: 360, padding: 0, ...t.win, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: t.titlebar.align === 'left' ? 'flex-start' : 'flex-end', gap: 6, padding: '8px 10px', borderBottom: '1px solid #00000018' }}>
          {t.titlebar.dots
            ? ['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)
            : <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>— ▢ ✕</span>}
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 14, marginBottom: 10 }}>Save changes to <b>design.lld</b>?</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12, cursor: 'pointer' }}
            onClick={() => setChecked((c) => !c)}>
            <span style={{ width: 17, height: 17, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: theme === 'mac' ? '#fff' : '#111', fontSize: 12, ...t.check }}>
              {checked ? '✓' : ''}
            </span>
            remember my choice (factory.createCheckbox())
          </label>
          <div style={{ height: 10, background: '#00000012', borderRadius: t.scroll.borderRadius, marginBottom: 14, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '30%', width: '32%', top: 0, bottom: 0, background: t.scroll.thumb, borderRadius: t.scroll.borderRadius }} />
          </div>
          <button style={{ padding: '7px 18px', fontSize: 13.5, cursor: 'pointer', ...t.button }}>
            Save (factory.createButton())
          </button>
        </div>
      </div>
      <Code html={`<span class="cm">// the client — written ONCE, renders ANY family:</span>
<span class="kw">void</span> renderDialog(GuiFactory f) {
    Button b    = f.createButton();      <span class="cm">// matching…</span>
    Checkbox c  = f.createCheckbox();    <span class="cm">// …matching…</span>
    ScrollBar s = f.createScrollBar();   <span class="cm">// …matching. Guaranteed.</span>
}`} />
      <div className="statbar">
        🎨 <span>You just swapped THREE widgets by changing ONE constructor call. The dialog code above never changed.</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: The expansion game ============ */
function ExpansionGame() {
  const [move, setMove] = useState(null)

  const FAMILY_FILES = [
    { n: 'ArtDecoFactory.java', kind: 'new' }, { n: 'ArtDecoChair.java', kind: 'new' },
    { n: 'ArtDecoSofa.java', kind: 'new' }, { n: 'ArtDecoTable.java', kind: 'new' },
    { n: 'main() — 1 line', kind: 'edit' },
    { n: 'interface FurnitureFactory', kind: 'safe' }, { n: 'VictorianFactory', kind: 'safe' },
    { n: 'ModernFactory', kind: 'safe' }, { n: 'renderRoom() client', kind: 'safe' },
  ]
  const PRODUCT_FILES = [
    { n: 'interface Lamp (new)', kind: 'new' }, { n: 'VictorianLamp.java', kind: 'new' }, { n: 'ModernLamp.java', kind: 'new' },
    { n: 'interface FurnitureFactory + createLamp()', kind: 'edit' },
    { n: 'VictorianFactory', kind: 'edit' }, { n: 'ModernFactory', kind: 'edit' },
    { n: '…and EVERY other factory, forever', kind: 'edit' },
  ]
  const files = move === 'family' ? FAMILY_FILES : move === 'product' ? PRODUCT_FILES : []

  return (
    <div className="panel">
      <div className="ptitle">Live demo · two kinds of growth — only one is cheap</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={() => setMove('family')}>📣 "add an ArtDeco line!" (new FAMILY)</button>
        <button className="act" onClick={() => setMove('product')}>📣 "all styles need LAMPS!" (new PRODUCT TYPE)</button>
      </div>
      {move && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {files.map((f) => (
              <span key={f.n} className="chip" style={
                f.kind === 'new' ? { background: '#EAF7EF', borderColor: 'var(--green)', color: '#1F6B43' }
                : f.kind === 'edit' ? { background: '#FFE0DE', borderColor: 'var(--red)', color: '#8F2B24' }
                : { opacity: 0.5 }}>
                {f.kind === 'new' ? '🆕 ' : f.kind === 'edit' ? '✏️ ' : ''}{f.n}
              </span>
            ))}
          </div>
          <div className="statbar" style={{ background: move === 'family' ? '#EAF7EF' : '#FDECEC' }}>
            {move === 'family'
              ? <span>😌 <span><b>New family = pure addition.</b> Four new files, one wiring line, every existing file untouched. Abstract Factory is OPEN along the family axis (Day 12 would be proud).</span></span>
              : <span>😬 <span><b>New product type = surgery on every factory.</b> The factory interface grows a method, so EVERY family must implement it — including ones in other teams' repos. Abstract Factory is CLOSED along the product axis. Know this trade before you sign.</span></span>}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Abstract Factory pattern\'s intent is…',
    o: ['To make all factories abstract classes', 'To replace constructors with static methods', 'To create FAMILIES of related objects that are guaranteed to match, without clients naming concrete classes', 'To create one object lazily'], a: 2,
    e: 'Factory Method serves one product; Abstract Factory serves a matching KIT — button+checkbox+scrollbar, chair+sofa+table. The guarantee of consistency is the whole point.',
    w: { 0: '"Abstract" describes the factory INTERFACE, not a class-kind rule.',
         1: 'Static factories are Day 22\'s tool — different animal.',
         3: 'Lazy single creation is Singleton/lazy-init territory.' },
    r: { id: 's1', label: 'Section 1 — the furniture showroom' } },
  { q: 'How does Abstract Factory make a Victorian chair + Modern sofa mix IMPOSSIBLE (not just unlikely)?',
    o: ['Every product the client gets comes from the SAME factory object — and each concrete factory only knows how to make its own family', 'Products throw if mismatched', 'Runtime style checks on every product', 'A linter rule'], a: 0,
    e: 'Consistency by construction: hold a VictorianFactory and Modern products are unreachable through it. No discipline, documentation or checks needed — the wiring makes the mistake inexpressible (Day 19\'s ideal).',
    w: { 1: 'Products never check each other — they never need to.',
         2: 'Runtime checks catch mistakes LATE — the pattern prevents them from being writable.',
         3: 'Linters are discipline with tooling — still weaker than structure.' },
    r: { id: 's3', label: 'Section 3 — the room builder' } },
  { q: 'The structure of Abstract Factory is…',
    o: ['A factory INTERFACE with one createX() per product type, plus one concrete factory per family producing that family\'s products', 'A singleton holding all products', 'One static create() with a big switch', 'A subclass per product'], a: 0,
    e: 'GuiFactory { createButton(); createCheckbox(); } ← interface. MacFactory and WindowsFactory implement it. Each createX() is, individually, a factory method — AF is a kit of factory methods sold together.',
    w: { 1: 'A singleton holding products is a cache, not a factory.',
         2: 'A big switch is the simple factory shape — families need a factory PER family.',
         3: 'Subclass-per-product is Factory Method\'s parallel-hierarchy shape.' },
    r: { id: 's4', label: 'Section 4 — the structure' } },
  { q: 'Factory Method vs Abstract Factory in one line?',
    o: ['They are identical', 'AF is just FM with static methods', 'FM is newer', 'FM: one hook creating ONE product (often via subclassing). AF: an object with several creation methods producing a MATCHING FAMILY'], a: 3,
    e: 'Count the products that must agree with each other. One → Factory Method. Several that must match → Abstract Factory.',
    w: { 0: 'They differ in structure AND intent.',
         1: 'Static-ness is orthogonal.',
         2: 'Both date to the same 1994 book.' },
    r: { id: 's4', label: 'Section 4 — kit of factory methods' } },
  { q: 'Where is the ONE place that decides which family the whole app uses?',
    o: ['Every client checks the OS', 'Each product decides', 'A global variable', 'The composition root (main/config): GuiFactory f = new MacFactory(); — injected everywhere (Day 15), so the theme swap is a one-line change'], a: 3,
    e: 'Clients receive the abstract factory and never ask "which one?". Choosing happens once, at the edge — the plug board from Day 15, now plugging in whole families.',
    w: { 0: 'Per-client OS checks re-scatter the choice the pattern centralized.',
         1: 'Products choosing their family is circular — the factory IS the choice.',
         2: 'Globals are hidden coupling (Day 17) — injection keeps it visible.' },
    r: { id: 's4', label: 'Section 4 — the composition root line' } },
  { q: 'The honest trade-off of Abstract Factory: which growth is cheap, and which hurts?',
    o: ['New product type is cheap, new family hurts', 'New FAMILY = cheap (add classes, edit nothing). New PRODUCT TYPE = expensive (the factory interface grows, so every family must change)', 'Neither is possible', 'Both are cheap'], a: 1,
    e: 'AF is open along the family axis, closed along the product axis. Pick it when families will multiply but the product lineup is stable — UIs, themes, platform kits fit exactly that shape.',
    w: { 0: 'Exactly reversed — the most common exam slip on this pattern.',
         2: 'Both growths are possible; only their COSTS differ.',
         3: 'Every pattern pays somewhere — this one\'s bill arrives with new product types.' },
    r: { id: 's6', label: 'Section 6 — the trade-off axis' } },
  { q: 'Which is a real-world Abstract Factory sighting?',
    o: ['String.valueOf', 'ArrayList', 'Swing\'s pluggable Look-and-Feel — switching it re-skins every widget from one consistent family (also: a FakeRepositoryFactory wiring matching fakes for tests)', 'System.out.println'], a: 2,
    e: 'UI toolkits are the birthplace of the pattern. And the test-kit version is the everyday one: a TestFactory producing an in-memory store + fake clock + fake mailer that are designed to work together.',
    w: { 0: 'String.valueOf is a static factory method (Day 22).',
         1: 'ArrayList is a product, not a factory.',
         3: 'println is plain output.' },
    r: { id: 's8', label: 'Section 8 — in the wild' } },
  { q: 'When is Abstract Factory OVERKILL?',
    o: ['When products come in families', 'When there is one product type, or one family that will never get siblings — a simple factory (or plain new) does the job without the interface ceremony', 'Whenever using Java', 'When using tests'], a: 1,
    e: 'No second family on the horizon = you built a showroom for one sofa. Escalate only when matching-families pressure is real (Day 16\'s YAGNI referees patterns too).',
    w: { 0: 'Families are exactly when it IS the right tool.',
         2: 'Java is its natural habitat.',
         3: 'Tests are where the second family (the fake kit) usually COMES from!' },
    r: { id: 's9', label: 'Section 9 — Trap 1: overkill' } },
]

/* ============ The page ============ */
export default function Day23() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 5 · Day 23 · Creational Patterns</div>
        <h1>Abstract Factory:<br />Buy the Matching Set, Not Loose Pieces</h1>
        <p>Yesterday's factory served one product at a time. But what if products come in FAMILIES that must
           match — a Victorian chair with a Victorian sofa, a Mac button with a Mac checkbox? Today: the factory
           of factories, and how it makes mismatches impossible rather than just unlikely. Click everything.</p>
        <div className="chips">
          {['abstract factory', 'product families', 'consistency', 'GUI toolkits', 'theme switching', 'kit of factory methods'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The furniture showroom</h2>
        <p>You're furnishing a living room. Two ways to shop:</p>
        <ul>
          <li><strong>Loose pieces:</strong> a chair from one shop, a sofa from another, a table from a third.
            Maybe they match. Maybe your living room looks like three different decades had a fight.</li>
          <li><strong>The showroom set:</strong> you pick a STYLE — Victorian — and the showroom supplies the
            chair, the sofa, the table, all from that one collection. A clash isn't avoided; it's
            <em> impossible</em>: the Victorian showroom doesn't stock Modern sofas.</li>
        </ul>
        <Code html={`        THE ABSTRACT FACTORY IDEA

   «interface» FurnitureFactory          the SHOWROOM contract:
   ├ createChair(): Chair                 "any style I sell, I sell COMPLETE"
   ├ createSofa():  Sofa
   └ createTable(): Table
        ▲                    ▲
        │                    │
   VictorianFactory     ModernFactory     one concrete factory per FAMILY
   makes: VictorianChair makes: ModernChair
          VictorianSofa         ModernSofa     products from ONE factory
          VictorianTable        ModernTable    always match each other ✅`} />
        <Note><strong>Abstract Factory's intent:</strong> provide an interface for creating <strong>families of
          related objects</strong> — without naming their concrete classes — so that products used together are
          <strong> guaranteed to belong together</strong>.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The problem: consistency by discipline (i.e., luck)</h2>
        <p>With only yesterday's tools — one factory per product — every call site picks each piece
          independently:</p>
        <Code html={`<span class="cm">// three separate choices, three separate chances to disagree:</span>
Chair chair = ChairFactory.create(<span class="str">"VICTORIAN"</span>);
Sofa  sofa  = SofaFactory.create(<span class="str">"MODERN"</span>);      <span class="cm">// ❗ nobody stops this</span>
Table table = TableFactory.create(userPref);       <span class="cm">// ❗ or whatever this is today</span>`} />
        <p>Nothing in the type system connects the three choices. The "rule" that they must match lives in a
          wiki page and in people's memories — and Day 19 taught you exactly what such rules are worth. In a GUI
          this is a Mac-style button beside a Windows checkbox; in a payments system, a sandbox client with
          production credentials. 💀</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🛋️ Play: Furnish the room</h2>
        <p>Buy pieces in mix-&amp;-match world until the room clashes (it won't take long). Then switch worlds,
          pick a showroom, and TRY to make it clash.</p>
        <RoomBuilder />
        <Good><strong>What you should notice:</strong> ① In mix-world, matching is a dice roll — and real codebases
          roll those dice on every feature branch. ② In factory-world the style is chosen ONCE (which factory
          object you hold); after that, every create is automatically consistent. ③ Switching the whole room's
          style = switching one factory — no per-piece decisions anywhere.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The structure in Java (the GUI classic)</h2>
        <Code html={`<span class="cm">// PRODUCT interfaces — one per product TYPE:</span>
<span class="kw">public interface</span> Button   { <span class="kw">void</span> render(); }
<span class="kw">public interface</span> Checkbox { <span class="kw">void</span> render(); }

<span class="cm">// the ABSTRACT FACTORY — one createX per product type:</span>
<span class="kw">public interface</span> GuiFactory {
    Button   createButton();
    Checkbox createCheckbox();
}

<span class="cm">// FAMILY 1 — everything Mac-shaped:</span>
<span class="kw">public class</span> MacFactory <span class="kw">implements</span> GuiFactory {
    <span class="kw">public</span> Button   createButton()   { <span class="kw">return new</span> MacButton(); }
    <span class="kw">public</span> Checkbox createCheckbox() { <span class="kw">return new</span> MacCheckbox(); }
}
<span class="cm">// FAMILY 2 — everything Windows-shaped:</span>
<span class="kw">public class</span> WindowsFactory <span class="kw">implements</span> GuiFactory {
    <span class="kw">public</span> Button   createButton()   { <span class="kw">return new</span> WinButton(); }
    <span class="kw">public</span> Checkbox createCheckbox() { <span class="kw">return new</span> WinCheckbox(); }
}

<span class="cm">// the CLIENT — knows the interfaces, and NOTHING else:</span>
<span class="kw">public class</span> SettingsDialog {
    <span class="kw">private final</span> GuiFactory factory;                <span class="cm">// 💉 injected (Day 15!)</span>
    <span class="kw">public</span> SettingsDialog(GuiFactory factory) { <span class="kw">this</span>.factory = factory; }

    <span class="kw">public void</span> render() {
        Button ok       = factory.createButton();    <span class="cm">// matching</span>
        Checkbox toggle = factory.createCheckbox();  <span class="cm">// matching — by construction</span>
        ok.render(); toggle.render();
    }
}

<span class="cm">// the composition root picks the family — ONCE, in ONE line:</span>
GuiFactory f = OS.isMac() ? <span class="kw">new</span> MacFactory() : <span class="kw">new</span> WindowsFactory();
<span class="kw">new</span> SettingsDialog(f).render();`} />
        <p>Notice the family resemblance to yesterday: each <C>createButton()</C> is, on its own, a factory
          method. <strong>An abstract factory is a kit of factory methods that travel together</strong> — bundled
          into one object precisely so their answers can't drift apart.</p>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🎨 Play: Re-skin the dialog</h2>
        <p>A real rendered dialog. Swap the factory and watch button, checkbox, title bar and scrollbar change
          <em> together</em> — while the client code below the dialog stays frozen.</p>
        <ThemeSwitcher />
        <Good><strong>What you should notice:</strong> ① Three widgets changed in lockstep from ONE swapped
          object — that's the family guarantee, visually. ② The client renders through interfaces; it cannot
          even express "Mac button with Windows checkbox". ③ This is why every theming system, dark-mode toggle
          and cross-platform toolkit you've ever used is an Abstract Factory under the hood.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The trade-off axis (the part interviews probe)</h2>
        <p>Every pattern buys flexibility on one axis by paying rigidity on another. Abstract Factory's
          exchange rate, precisely:</p>
        <ul>
          <li><strong>Adding a new FAMILY (ArtDeco, LinuxTheme, FakeTestKit): cheap.</strong> One new factory
            class + its products. Existing code: zero edits. Pure OCP (Day 12).</li>
          <li><strong>Adding a new PRODUCT TYPE (every family gets Lamps): expensive.</strong> The factory
            interface grows a method — and EVERY concrete factory in existence must implement it. The interface
            is a contract signed by all families (Day 14's blast radius, by design).</li>
        </ul>
        <p>So the pattern fits when the <strong>product lineup is stable but families multiply</strong> — exactly
          the shape of UI kits (widgets are known; themes keep coming) and test kits (services are known;
          environments keep coming).</p>
        <Warn><strong>The reverse-fit trap:</strong> if you can already tell that the product lineup will grow
          (new widget types, new service kinds) faster than the number of families, Abstract Factory is fighting
          your actual change pattern — every new product type breaks every existing factory. Check which axis
          moves more before committing to the pattern.</Warn>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>📈 Play: Two expansion requests</h2>
        <p>The business grows in two directions. Fire each request and compare the colors.</p>
        <ExpansionGame />
        <Good><strong>What you should notice:</strong> ① The family request is all green — additions only.
          ② The product-type request bleeds red through every factory, including other teams'. ③ Neither result
          is "wrong" — it's the pattern's exchange rate. Choosing patterns IS choosing which future change you
          want to be cheap.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Where you'll meet it in the wild</h2>
        <ul>
          <li><strong>UI toolkits:</strong> Swing's pluggable Look-and-Feel; every theme/dark-mode system —
            the pattern's birthplace.</li>
          <li><strong>The everyday version — TEST KITS:</strong> a <C>ServiceFactory</C> with
            <C> ProdFactory</C> (real DB, real mailer) and <C>TestFactory</C> (in-memory store, fake clock, fake
            mailer) — matching fakes wired as one consistent family. Day 15's plug board, upgraded to plug in
            whole boards.</li>
          <li><strong>Cross-platform &amp; drivers:</strong> XML's <C>DocumentBuilderFactory</C>, rendering
            backends, cloud-provider SDK kits (S3+SQS+IAM clients that must share region/credentials).</li>
        </ul>
        <Reveal summary="Interview sound bite: AF + Singleton + FM in one sentence — click to reveal.">
          <p>The creational patterns cooperate: the chosen <strong>Abstract Factory</strong> is often held as a
            single shared instance (<strong>Singleton</strong>-ish, ideally injected), and each of its creation
            methods is a <strong>Factory Method</strong>. Saying "an abstract factory is a kit of factory
            methods, selected once at the composition root" compresses three days of learning into one sentence
            interviewers love.</p>
        </Reveal>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — A showroom for one sofa</h3>
        <p>One product type? One family with no siblings planned? Then <C>GuiFactory</C> is ceremony around a
          simple factory (or a plain <C>new</C>). The pattern needs BOTH axes to exist: multiple products AND
          multiple families (YAGNI referees, as always).</p>
        <h3>Trap 2 — Leaking the family</h3>
        <p><C>MacButton b = (MacButton) factory.createButton();</C> — the cast smuggles concrete knowledge back
          in, and the client now breaks for every other family (LSP alarm from Day 13). Clients touch product
          INTERFACES only.</p>
        <h3>Trap 3 — Frankenstein injection</h3>
        <p>Passing <C>macFactory</C> to one widget and <C>winFactory</C> to its neighbor re-creates the mismatch
          the pattern exists to kill. ONE factory instance per consistent scope (app, window, request) — chosen
          at the composition root.</p>
        <h3>Trap 4 — The ever-fattening factory</h3>
        <p>createButton, createCheckbox… createTooltip, createToast, createConfetti — 25 methods later every new
          family is a 25-method punishment. If product types keep multiplying, the pattern is fighting its weak
          axis; reconsider the slicing (maybe several smaller kits — ISP, Day 14).</p>
        <h3>Trap 5 — Family logic inside products</h3>
        <p><C>if (theme == MAC)</C> inside <C>WinButton.render()</C> means the families never truly separated.
          Each product implements its own family's look completely — the factory is the ONLY place families are
          told apart.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> create FAMILIES of related products, guaranteed to match, behind interfaces. Consistency by construction, not by discipline.</li>
          <li><strong>Structure:</strong> factory interface (one <C>createX()</C> per product type) → one concrete factory per family → product interfaces → family-specific products. Client holds factory + product interfaces only.</li>
          <li><strong>= a kit of factory methods</strong> bundled so their answers can't drift. Family chosen ONCE at the composition root, injected (Day 15).</li>
          <li><strong>Trade-off axis:</strong> new family = cheap (pure addition) · new product type = every factory edited. Fits stable-lineup/multiplying-families shapes: UI themes, platform kits, test kits.</li>
          <li>Sightings: Look-and-Feel, DocumentBuilderFactory, prod-vs-test service kits.</li>
          <li>Traps: overkill for one product · casting products (leak) · mixed factories in one scope · 25-method fat factory · per-product family ifs.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: GoF gave Abstract Factory an alternate name — what is it?">
          <p><strong>Kit.</strong> The book lists "AKA: Kit" — because it delivers a kit of matching products.
            Tiny trivia, disproportionate impressiveness, and it doubles as the best one-word summary of the
            pattern.</p>
        </Reveal>
        <Reveal summary="Q: AF vs FM — give the STRUCTURAL distinction, not just intent.">
          <p>Factory Method = ONE inherited hook method; variation via SUBCLASSING the creator. Abstract
            Factory = an OBJECT with several creation methods; variation via COMPOSITION (inject a different
            factory). GoF's own note: abstract factories are usually implemented USING factory methods. Object
            vs method, composition vs inheritance — that's the structural answer.</p>
        </Reveal>
        <Reveal summary="Q: Name a JDK abstract factory and how you obtain it.">
          <p><C>DocumentBuilderFactory.newInstance()</C> (and TransformerFactory, XPathFactory…): you get a
            vendor-specific factory whose products (parsers, builders) are guaranteed mutually consistent.
            Obtaining the factory itself via a static lookup is the classic bootstrap. Swing's
            <C> UIManager.setLookAndFeel</C> is the themed-widgets version.</p>
        </Reveal>
        <Reveal summary="Q: How does the client get the right concrete factory without violating DIP?">
          <p>It doesn't choose — the COMPOSITION ROOT does (config/env/OS check, once), and the abstract factory
            is injected. One concrete name appears in one bootstrap file; everywhere else handles GuiFactory.
            If clients run if(isMac) themselves, the pattern failed at the last step.</p>
        </Reveal>
        <Reveal summary="Q: Recite the trade-off axis from memory — and the shape of problem that fits it.">
          <p>New FAMILY: cheap, pure addition (open axis). New PRODUCT TYPE: every factory signs a new method —
            expensive (closed axis). Fits when the product lineup is stable and families multiply: UI themes,
            platform kits, prod/test service kits. Inverted shape (products multiply, one family) → wrong
            pattern.</p>
        </Reveal>
        <Reveal summary="Q: How do Abstract Factory and Singleton typically combine?">
          <p>An app usually needs exactly ONE factory instance per family, so concrete factories are often
            singletons (or container-managed single beans). GoF mentions this pairing explicitly. Modern
            phrasing: "one factory instance per consistent scope, chosen at the root, injected" — oneness by
            wiring (Day 21's resolution).</p>
        </Reveal>
        <Reveal summary="Q: Sketch the participants (GoF vocabulary) in 10 seconds.">
          <p>AbstractFactory (GuiFactory) · ConcreteFactory (MacFactory, WinFactory) · AbstractProduct (Button,
            Checkbox) · ConcreteProduct (MacButton…) · Client (talks only to the abstractions). Being able to
            name-tag your own diagram with the book's role names is what written exams grade.</p>
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
        <strong>Day 23 complete?</strong> Homework: build the test-kit version — the one you'll actually use at
        work. <C>interface ServiceKit {'{'} OrderStore store(); Notifier notifier(); Clock clock(); {'}'}</C>
        with <C>ProdKit</C> (MySqlStore + EmailNotifier + system clock) and <C>TestKit</C> (InMemoryStore +
        FakeNotifier + fixed clock — reuse your Day 15 classes!). Wire <C>OrderService</C> to take a
        <C> ServiceKit</C>, run main with ProdKit and a test with TestKit, and confirm the service file never
        changes. Bonus: try to construct a mismatched kit (prod store + fake clock) and write one sentence on
        what stops you — or doesn't.
        <br /><br />
        Next: <strong>Day 24 — Builder</strong>: the cure for the constructor with nine parameters — building
        complex objects step by step, with the fluent chaining trick Day 1 promised you.
      </div>
    </div>
  )
}
