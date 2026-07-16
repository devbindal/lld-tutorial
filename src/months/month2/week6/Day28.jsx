import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The file explorer trace ============ */
const FS_TREE = {
  name: '📁 Projects', kids: [
    { name: '📁 lld-app', kids: [
      { name: '📄 Main.java', size: 4 },
      { name: '📄 Order.java', size: 6 },
      { name: '📁 docs', kids: [
        { name: '📄 readme.md', size: 2 },
      ]},
    ]},
    { name: '📄 notes.txt', size: 1 },
  ],
}

function nodeSize(n) { return n.kids ? n.kids.reduce((s, k) => s + nodeSize(k), 0) : n.size }

function buildTrace(n, depth, out) {
  if (n.kids) {
    out.push({ depth, text: `${n.name}.size() — I'm a FOLDER: ask every child ↓` })
    n.kids.forEach((k) => buildTrace(k, depth + 1, out))
    out.push({ depth, text: `${n.name} sums up → ${nodeSize(n)} KB` })
  } else {
    out.push({ depth, text: `${n.name}.size() — I'm a FILE: I just KNOW → ${n.size} KB` })
  }
}

function FsRow({ node, depth, onPick, picked }) {
  return (
    <>
      <div onClick={() => onPick(node)}
        style={{ paddingLeft: depth * 22, cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 13,
          padding: `3px 6px 3px ${6 + depth * 22}px`, borderRadius: 6,
          background: picked === node ? '#EEF2FF' : 'transparent',
          outline: picked === node ? '2px solid var(--blue)' : 'none' }}>
        {node.name} {node.kids ? '' : `· ${node.size} KB`}
      </div>
      {node.kids && node.kids.map((k, i) => (
        <FsRow key={i} node={k} depth={depth + 1} onPick={onPick} picked={picked} />
      ))}
    </>
  )
}

function FileExplorer() {
  const [picked, setPicked] = useState(null)
  const trace = []
  if (picked) buildTrace(picked, 0, trace)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · click ANY node — file or folder — and call size() on it</div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 240, border: '1px solid var(--line)', borderRadius: 10, padding: 8, background: '#fff' }}>
          <FsRow node={FS_TREE} depth={0} onPick={setPicked} picked={picked} />
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          {picked ? (
            <div className="statbar" style={{ display: 'block' }}>
              <div style={{ marginBottom: 6 }}>▶ <C>{picked.name.slice(3)}.size()</C> — one call, same method, whatever it is:</div>
              {trace.map((t, i) => (
                <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, paddingLeft: t.depth * 16 }}>{t.text}</div>
              ))}
              <div style={{ marginTop: 6 }}>🧾 answer: <b>{nodeSize(picked)} KB</b></div>
            </div>
          ) : (
            <div className="statbar">👆 <span>Click <b>notes.txt</b> first (a leaf), then <b>lld-app</b> (a tree). Same one-line call.</span></div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============ Interactive 2: The gift hamper builder ============ */
let hamperIdCounter = 100
const ITEMS = { '🍫 Chocolate': 150, '📚 Book': 300, '🪔 Diya set': 120 }

function HamperBuilder() {
  const [root, setRoot] = useState({ id: 1, label: '🧺 Main hamper', kids: [] })
  const [selId, setSelId] = useState(1)

  function priceOf(n) { return n.price ?? n.kids.reduce((s, k) => s + priceOf(k), 0) }
  function addTo(n, child) {
    if (n.id === selId && n.kids) return { ...n, kids: [...n.kids, child] }
    if (!n.kids) return n
    return { ...n, kids: n.kids.map((k) => addTo(k, child)) }
  }
  const addItem = (label) => setRoot((r) => addTo(r, { id: ++hamperIdCounter, label, price: ITEMS[label] }))
  const addBox = () => {
    const id = ++hamperIdCounter
    setRoot((r) => addTo(r, { id, label: '🎁 Sub-hamper', kids: [] }))
    setSelId(id)
  }

  function render(n, depth) {
    const isBox = !!n.kids
    return (
      <div key={n.id} style={{ marginLeft: depth ? 16 : 0, marginTop: 6 }}>
        <div onClick={() => isBox && setSelId(n.id)}
          style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '4px 8px', borderRadius: 7,
            border: isBox ? '2px dashed #B98A2E' : '1px solid var(--line)',
            background: selId === n.id ? '#FFF1D6' : '#fff', cursor: isBox ? 'pointer' : 'default',
            display: 'inline-block' }}>
          {n.label} — ₹{priceOf(n)} {isBox && selId === n.id ? ' ← adding here' : ''}
        </div>
        {isBox && n.kids.map((k) => render(k, depth + 1))}
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · build a Diwali hamper — boxes inside boxes, one price() for all</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {Object.keys(ITEMS).map((it) => (
          <button key={it} className="act" onClick={() => addItem(it)}>{it} ₹{ITEMS[it]}</button>
        ))}
        <button className="ghost act" onClick={addBox}>🎁 nest a sub-hamper</button>
      </div>
      <p style={{ fontSize: 13, color: '#7c8aa5', marginBottom: 4 }}>(click any 🎁 box to select where new things go)</p>
      {render(root, 0)}
      <div className="statbar" style={{ marginTop: 12 }}>
        🧾 <span><C>mainHamper.price()</C> — the client neither knows nor cares how deep the boxes go:</span>
        <b>₹{priceOf(root)}</b>
      </div>
    </div>
  )
}

/* ============ Interactive 3: The cycle catastrophe ============ */
function CycleLab() {
  const [world, setWorld] = useState('naive')
  const [fired, setFired] = useState(false)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · folder A contains B. Now move A INSIDE B…</div>
      <div className="modbtns">
        <button className={world === 'naive' ? 'on' : ''} onClick={() => { setWorld('naive'); setFired(false) }}>😇 naive add()</button>
        <button className={world === 'guarded' ? 'on' : ''} onClick={() => { setWorld('guarded'); setFired(false) }}>🛡️ guarded add()</button>
      </div>
      <Code html={world === 'naive'
        ? `<span class="kw">public void</span> add(Node child) {
    children.add(child);              <span class="cm">// trusting soul</span>
}`
        : `<span class="kw">public void</span> add(Node child) {
    <span class="kw">if</span> (child == <span class="kw">this</span> || child.isAncestorOf(<span class="kw">this</span>))   <span class="cm">// walk MY parents upward</span>
        <span class="kw">throw new</span> IllegalArgumentException(<span class="str">"cycle! a folder cannot contain its ancestor"</span>);
    children.add(child);
}`} />
      <button className="act" onClick={() => setFired(true)} style={{ marginBottom: 10 }}>😈 b.add(a)</button>
      {fired && (
        <div className="statbar" style={{ display: 'block', background: world === 'naive' ? '#FDECEC' : '#EAF7EF' }}>
          {world === 'naive' ? (
            <pre style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre-wrap', margin: 0 }}>
{`a.size() → asks B → asks A → asks B → asks A → asks B → asks A …
                                                          ↓ ~10,000 frames later
💥 java.lang.StackOverflowError
   The "tree" became a CYCLE — and every recursive operation
   (size, search, render, delete!) now runs forever.`}
            </pre>
          ) : (
            <span>✋ <b>IllegalArgumentException: cycle!</b> — the guard walked B's ancestors, found A, and refused.
              One reachability check at add() keeps every recursive operation safe forever (fail fast, Day 19).</span>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Composite pattern\'s intent is…',
    o: ['To add behavior to objects dynamically', 'To compose objects into TREE structures (part-whole hierarchies) and let clients treat single objects and whole trees uniformly', 'To convert interfaces', 'To limit a class to one instance'], a: 1,
    e: 'A file and a folder-of-folders both answer size(); a product and a hamper-of-hampers both answer price(). The client writes ONE line for both — that uniformity is the entire pattern.',
    w: { 0: 'Dynamic behavior-adding is Decorator (Day 27).',
         2: 'Interface conversion is Adapter (Day 26).',
         3: 'One instance is Singleton (Day 21).' },
    r: { id: 's1', label: 'Section 1 — the folder question' } },
  { q: 'Name the three GoF participants and the composite\'s defining field.',
    o: ['Target, Adaptee, Adapter', 'Component (the shared interface), Leaf (no children), Composite — which holds List<Component>, so it can contain leaves AND other composites', 'Builder, Director, Product', 'Subject, Observer, Event'], a: 1,
    e: 'The recursive type is the magic: List<Component> means a folder holds "anythings" — including more folders. The tree shape comes from the TYPE, not from special code.',
    w: { 0: 'That\'s Adapter\'s cast (Day 26).',
         2: 'That\'s Builder\'s cast (Day 24).',
         3: 'That\'s Observer — Week 7.' },
    r: { id: 's3', label: 'Section 3 — the structure' } },
  { q: 'Where does the recursion in folder.size() actually live?',
    o: ['In the client, which loops the tree', 'Inside the Composite\'s method: it calls size() on each child — and any child that is itself a composite recurses naturally', 'In a static TreeUtils helper', 'In the JVM'], a: 1,
    e: 'for (Node k : children) total += k.size(); — that one polymorphic call (Day 4!) IS the recursion: leaves answer directly, sub-folders recurse. No client ever writes tree-walking code again.',
    w: { 0: 'Client-side walking is the BEFORE picture the pattern erases.',
         2: 'A TreeUtils helper would need instanceof checks — the disease itself.',
         3: 'The JVM just executes your dispatch.' },
    r: { id: 's4', label: 'Section 4 — the explorer trace' } },
  { q: 'What dies in client code the moment Composite is applied?',
    o: ['All loops', 'The instanceof-and-recurse boilerplate: if (node is file) … else walk children — repeated in every operation, in every client', 'Constructors', 'Interfaces'], a: 1,
    e: 'Before: every client re-implements tree-walking with type checks (Day 13\'s instanceof smell at scale). After: client calls node.operation() and the STRUCTURE handles the rest.',
    w: { 0: 'One loop survives — inside the composite, written once.',
         2: 'Constructors are untouched.',
         3: 'An interface is the pattern\'s heart.' },
    r: { id: 's2', label: 'Section 2 — the naive world' } },
  { q: 'The transparency-vs-safety debate is about…',
    o: ['Encryption of trees', 'Where add()/remove() live: on Component (uniform, but leaf.add() must throw — LSP pain) or only on Composite (type-safe, but clients must know types to mutate)', 'Public vs private fields', 'Recursion depth limits'], a: 1,
    e: 'GoF chose transparency (uniformity above all); modern style leans safety (mutation is rarer than reading, so asking for the concrete Folder to mutate is fine). Knowing BOTH sides + your pick is the interview answer.',
    w: { 0: 'No cryptography involved. 🙂',
         2: 'Field visibility is Day 1 — different debate.',
         3: 'Depth is a runtime concern, not this design choice.' },
    r: { id: 's7', label: 'Section 7 — transparency vs safety' } },
  { q: 'Which famous APIs are Composite trees?',
    o: ['java.lang.Math', 'Swing (Container extends Component and holds Components), the HTML DOM, org charts, menus with submenus, arithmetic expression trees', 'System.out', 'java.util.Random'], a: 1,
    e: 'Swing\'s Container IS the pattern verbatim. Every UI framework since (DOM, Android views, React children) is a composite: panels hold panels hold buttons, and render() propagates down the tree.',
    w: { 0: 'Math is stateless utilities.',
         2: 'A single print stream.',
         3: 'A number generator.' },
    r: { id: 's5', label: 'Section 5 — composites everywhere' } },
  { q: 'folder.add(itsOwnGrandparent) — what happens to the naive composite, and the defense?',
    o: ['Nothing, trees self-heal', 'The "tree" becomes a cycle: every recursive operation loops until StackOverflowError. Defense: at add(), walk the would-be child\'s ancestors (or your own) and reject cycles', 'The compiler rejects it', 'The GC removes the cycle'], a: 1,
    e: 'The type system can\'t see cycles — List<Component> happily accepts an ancestor. One reachability guard at the single mutation point protects every operation forever.',
    w: { 0: 'No self-healing exists — size() just never returns.',
         2: 'Perfectly legal Java to the compiler.',
         3: 'GC collects garbage, not design errors (and everything here is still referenced!).' },
    r: { id: 's8', label: 'Section 8 — the cycle lab' } },
  { q: '(3 + 4) × 2 as a Composite — what are the leaves and composites?',
    o: ['Impossible — math is not a tree', 'Leaves = Number(3), Number(4), Number(2); composites = Add and Multiply, each holding child Expressions; evaluate() recurses exactly like folder.size()', 'Leaves are operators', 'Only binary trees allowed'], a: 1,
    e: 'interface Expression { double evaluate(); } — Multiply(Add(Num(3), Num(4)), Num(2)).evaluate() = 14. Compilers, spreadsheets and calculators are composite trees with evaluate() instead of size().',
    w: { 0: 'Expression TREES are the oldest tree in computing.',
         2: 'Operators hold children → they\'re the composites; numbers are the leaves.',
         3: 'Composites take any number of children (sum(1,2,3,4…)).' },
    r: { id: 's5', label: 'Section 5 — expression trees' } },
]

/* ============ The page ============ */
export default function Day28() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 6 · Day 28 · Structural Patterns</div>
        <h1>Composite:<br />The Folder That Acts Like a File</h1>
        <p>Right-click any folder → Properties → and the OS instantly answers "size: 4.2 GB" — even though a
           folder "contains" nothing but other folders and files, nested twenty levels deep. One method call,
           one answer, any depth. Today: the pattern that makes trees of objects answer like single objects.
           Click everything.</p>
        <div className="chips">
          {['composite', 'part-whole trees', 'leaf vs composite', 'uniform treatment', 'recursion by structure', 'file systems'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>"How big is this folder?"</h2>
        <p>Ask a <strong>file</strong> its size — it just knows: 4 KB. Ask a <strong>folder</strong> — it owns no
          bytes at all; it must ask each child, and some children are folders who must ask THEIR children…
          And yet, to you, both answer the same question the same way. You never write two kinds of code for
          "file properties" and "folder properties".</p>
        <Note><strong>Composite's intent:</strong> compose objects into <strong>tree structures</strong> to
          represent part-whole hierarchies, and let clients treat <strong>individual objects and whole
          compositions uniformly</strong> — one interface, one call, any depth.</Note>
        <Code html={`        THE COMPOSITE IDEA

              «interface» Node              ← ONE contract for everything
              size() · name()
               ▲           ▲
        ┌──────┘           └────────┐
   📄 File (LEAF)            📁 Folder (COMPOSITE)
   size() { return 4; }      List&lt;Node&gt; children;   ← holds Nodes…
   "I just know"             size() {                 …including FOLDERS!
                               sum of child.size()    the tree comes from
                             }                        the TYPE itself`} />
        <p>Look hard at <C>List&lt;Node&gt;</C> — the most important line of the day. A folder's children are
          "anything that is a Node"… which includes folders. The nesting isn't programmed anywhere; it falls out
          of the <strong>recursive type</strong>.</p>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The naive world (what dies today)</h2>
        <Code html={`<span class="cm">// without the pattern, EVERY client re-invents tree walking:</span>
<span class="kw">long</span> sizeOf(Object thing) {
    <span class="kw">if</span> (thing <span class="kw">instanceof</span> File f) {                <span class="cm">// type check #1</span>
        <span class="kw">return</span> f.getBytes();
    } <span class="kw">else if</span> (thing <span class="kw">instanceof</span> Folder dir) {     <span class="cm">// type check #2</span>
        <span class="kw">long</span> total = <span class="num">0</span>;
        <span class="kw">for</span> (Object child : dir.getContents())
            total += sizeOf(child);                <span class="cm">// manual recursion, AGAIN</span>
        <span class="kw">return</span> total;
    }
    <span class="kw">throw new</span> IllegalStateException(<span class="str">"what is this??"</span>);
}`} />
        <p>Now multiply: the same instanceof-and-recurse skeleton for <C>search()</C>, <C>delete()</C>,
          <C> render()</C>, <C>backup()</C>… in every client, forever (Day 13's instanceof smell, wholesale).
          Add a third node type — Shortcut — and every one of those skeletons needs a new branch (Day 12,
          weeping).</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The structure (three small pieces)</h2>
        <Code html={`<span class="cm">// 1 — the COMPONENT: what every node, big or small, can do</span>
<span class="kw">public interface</span> Node {
    String name();
    <span class="kw">long</span> size();
}

<span class="cm">// 2 — the LEAF: the indivisible thing. No children, answers directly.</span>
<span class="kw">public class</span> File <span class="kw">implements</span> Node {
    <span class="kw">private final</span> String name; <span class="kw">private final long</span> bytes;
    <span class="kw">public</span> File(String name, <span class="kw">long</span> bytes) { <span class="kw">this</span>.name = name; <span class="kw">this</span>.bytes = bytes; }
    <span class="kw">public</span> String name() { <span class="kw">return</span> name; }
    <span class="kw">public long</span> size() { <span class="kw">return</span> bytes; }          <span class="cm">// "I just know" 📄</span>
}

<span class="cm">// 3 — the COMPOSITE: holds Nodes — leaves OR other composites</span>
<span class="kw">public class</span> Folder <span class="kw">implements</span> Node {
    <span class="kw">private final</span> String name;
    <span class="kw">private final</span> List&lt;Node&gt; children = <span class="kw">new</span> ArrayList&lt;&gt;();  <span class="cm">// ← the magic line</span>

    <span class="kw">public</span> Folder(String name) { <span class="kw">this</span>.name = name; }
    <span class="kw">public void</span> add(Node child) { children.add(child); }      <span class="cm">// (guard comes in §8!)</span>

    <span class="kw">public</span> String name() { <span class="kw">return</span> name; }
    <span class="kw">public long</span> size() {                          <span class="cm">// the ONLY tree-walk in the system:</span>
        <span class="kw">long</span> total = <span class="num">0</span>;
        <span class="kw">for</span> (Node child : children)
            total += child.size();                <span class="cm">// polymorphic (Day 4): file answers,</span>
        <span class="kw">return</span> total;                             <span class="cm">// folder RECURSES — automatically</span>
    }
}

<span class="cm">// the client — the line the whole pattern exists for:</span>
<span class="kw">long</span> s = anyNode.size();    <span class="cm">// file? folder? 20 levels deep? Don't know, don't care. ✅</span>`} />
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>📁 Play: The explorer</h2>
        <p>Click a file, then a folder, then the root — and watch the same one-line call do very different
          amounts of work.</p>
        <FileExplorer />
        <Good><strong>What you should notice:</strong> ① The client's call is IDENTICAL for notes.txt and for
          Projects — uniformity is real. ② In the trace, folders delegate and leaves answer — the recursion is
          performed BY the structure, not by the caller. ③ Adding a fourth nesting level would change zero lines
          of code anywhere.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Composites everywhere (once you see it…)</h2>
        <ul>
          <li><strong>Every UI you've used:</strong> Swing's <C>Container extends Component</C> and holds
            Components — the pattern verbatim, in the class names. Same for the HTML <strong>DOM</strong>,
            Android views, React children: panels in panels in panels, and <C>render()</C> propagates down.</li>
          <li><strong>Org charts:</strong> <C>headCount()</C> on an engineer returns 1; on a VP it recurses
            through whole departments.</li>
          <li><strong>Menus:</strong> items and submenus and sub-submenus — one <C>render()</C>.</li>
          <li><strong>Expression trees:</strong> <C>Multiply(Add(Num(3), Num(4)), Num(2)).evaluate() → 14</C> —
            numbers are leaves, operators are composites. Every compiler, spreadsheet and calculator lives on
            this.</li>
          <li><strong>Commerce:</strong> a product has a price; a gift hamper of products (and sub-hampers) has
            a price. Same <C>price()</C> — which is your next demo.</li>
        </ul>
        <Note><strong>The general law:</strong> wherever a thing can contain <em>things of its own kind</em>,
          Composite is already there — your only choice is whether the code admits it cleanly or fights it with
          instanceof.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🧺 Play: The Diwali hamper</h2>
        <p>Build a hamper: toss in items, nest a sub-hamper, nest one inside THAT — and watch one
          <C> price()</C> stay correct through it all.</p>
        <HamperBuilder />
        <Good><strong>What you should notice:</strong> ① Items and hampers both display a price — the client
          rendering this list cannot tell which is which (and doesn't need to). ② Every box's price updates the
          moment a grandchild changes — recomputed by recursion, never stored stale. ③ The "select where to add"
          mechanic is the transparency question in disguise: only BOXES are selectable, because only composites
          have add() — Section 7's debate, experienced first.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The classic debate: transparency vs safety</h2>
        <p>One design question splits every Composite: <strong>where do <C>add()</C>/<C>remove()</C> live?</strong></p>
        <table className="matrix">
          <thead>
            <tr><th></th><th>TRANSPARENT (add on Component)</th><th>SAFE (add on Composite only)</th></tr>
          </thead>
          <tbody>
            <tr><td>uniformity</td><td className="yes">total — every Node has every method</td><td>reads uniform; mutation needs the concrete type</td></tr>
            <tr><td>what does file.add() do?</td><td className="no">throws UnsupportedOperationException 🐧</td><td className="yes">doesn't exist — compile error</td></tr>
            <tr><td>error caught at…</td><td className="no">runtime (Day 13 alarm bells)</td><td className="yes">compile time</td></tr>
            <tr><td>who chose it</td><td>GoF (1994) — uniformity above all</td><td>modern style — reads outnumber writes</td></tr>
          </tbody>
        </table>
        <p>The honest answer for interviews: <em>"GoF chose transparency; I default to safety — clients mostly
          READ trees uniformly, and the few places that BUILD them can know they hold a Folder. I'd rather have
          a compile error than a penguin."</em> (Days 13 and 14 nodding in the background.)</p>
        <Warn><strong>The transparent-Composite trap:</strong> putting <C>add()</C>/<C>remove()</C> on the
          Component interface means every leaf must implement them somehow — usually by throwing
          <C> UnsupportedOperationException</C>. That is Day 13's LSP violation wearing a tree-shaped costume:
          the leaf is lying about what it can do, and the crash only happens at runtime.</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🌀 Play: The cycle catastrophe</h2>
        <p>The type system happily lets a folder contain its own ancestor. Watch what that does to recursion —
          then install the guard.</p>
        <CycleLab />
        <Good><strong>What you should notice:</strong> ① The crash isn't in add() — it detonates LATER, in any
          innocent size()/search()/render() call (action at a distance, the worst kind). ② The guard costs one
          ancestor-walk at the single mutation point and protects every operation forever. ③ This is Day 19's
          fail-fast doctrine applied to structure: reject the illegal STATE at the door, don't let it explode
          downstream.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Cycles (you just met it)</h3>
        <p>Guard <C>add()</C> against self and ancestors. If nodes can be MOVED, re-check at move time too.</p>
        <h3>Trap 2 — Shared children (tree or DAG?)</h3>
        <p>Add the same <C>chocolate</C> object to two hampers and totals double-count it — and deleting one
          "copy" deletes both. A composite assumes each child has ONE parent (tree). If sharing is a real need,
          you've left tree-land — either copy children in (Prototype, Day 25) or design consciously for a DAG.</p>
        <h3>Trap 3 — Parent pointers, the bidirectional tax</h3>
        <p>Paths, move(), "delete from wherever you are" all want <C>child.getParent()</C> — which is Day 6's
          bidirectional association with its keep-both-sides-synced tax. Add parent links only when an operation
          truly needs them, and update them in ONE place (the add/remove methods).</p>
        <h3>Trap 4 — Caching totals without invalidation</h3>
        <p>For huge trees, recomputing <C>size()</C> hurts, so you cache it in each folder… and now every
          add/remove must invalidate caches UP the ancestor chain, or Properties lies. Cache only with a
          measured need, and put invalidation next to mutation.</p>
        <h3>Trap 5 — The leaf that's secretly a composite</h3>
        <p>"A File can never contain things"… until requirements add ZIP archives that expand. Don't fight it —
          a zip IS a composite wearing a leaf's icon. Revisit the hierarchy rather than bolt children onto a
          leaf with flags.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> part-whole TREES treated uniformly — one Component interface for Leaf and Composite; client code never branches on type.</li>
          <li><strong>The magic line:</strong> <C>List&lt;Component&gt; children</C> — the recursive type creates the tree. Operations recurse BY STRUCTURE: leaf answers, composite loops children polymorphically.</li>
          <li><strong>Transparency vs safety:</strong> add/remove on Component (uniform, leaf throws — GoF) vs on Composite (compile-safe — modern default). Know both, pick safety, cite Day 13.</li>
          <li>Sightings: file systems · Swing/DOM/React trees · org charts · menus · expression trees · order bundles.</li>
          <li>Traps: cycles (guard add!) · shared children double-count · parent-pointer sync tax · stale cached totals · leaves that grow children.</li>
          <li>Friends: Iterator traverses it, Visitor adds operations to it (both Week 8), Decorator wraps one node — Composite nests many.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Composite vs Decorator — both hold Component references. One-line difference?">
          <p>Count the children: Decorator wraps exactly ONE (a chain — adds behavior); Composite holds MANY
            (a tree — aggregates structure). GoF notes they often appear together: a UI tree (composite) whose
            individual nodes are wrapped with borders/scrollbars (decorators).</p>
        </Reveal>
        <Reveal summary="Q: How do Iterator and Visitor pair with Composite?">
          <p>Iterator (Week 8) answers "how do clients TRAVERSE the tree without knowing its shape"
            (depth-first? breadth-first?). Visitor (Week 8) answers "how do we add NEW operations (export,
            lint, price-audit) without editing every node class". Composite builds the tree; those two milk it.
            Mentioning the trio unprompted is a strong signal.</p>
        </Reveal>
        <Reveal summary="Q: Is the HTML DOM transparent or safe, in today's vocabulary?">
          <p>Transparent-ish: every DOM Node has appendChild() — and calling it on a text node throws a
            DOMException at runtime. The web platform chose GoF-style uniformity and lives with runtime errors.
            A nice concrete answer when asked to evaluate the trade-off in the wild.</p>
        </Reveal>
        <Reveal summary="Q: A folder tree is 10,000 levels deep — what breaks and what's the fix?">
          <p>Naive recursion blows the call stack (same StackOverflowError as the cycle, honest depth this
            time). Fix: iterative traversal with an explicit stack/queue (Deque), which also lets you choose
            DFS vs BFS. Real file systems and build tools all walk iteratively.</p>
        </Reveal>
        <Reveal summary="Q: Where should computed aggregates (size, count) live in a REAL system?">
          <p>Three tiers: recompute on demand (always correct, O(n)); cache per composite + invalidate up the
            ancestor chain on mutation (fast reads, fragile writes); or maintain incrementally at mutation time
            (+delta up the chain — what real OS file systems approximate). Naming the trade-off ladder beats
            picking blindly.</p>
        </Reveal>
        <Reveal summary="Q: How does Composite interact with equals/hashCode (Day 20)?">
          <p>Carefully. Structural equality on a composite means recursively comparing whole subtrees —
            expensive, and mutable trees make terrible HashSet keys (mutate a grandchild, the hash changes —
            Day 20's lost-key bug, tree-sized). Most real composites keep IDENTITY equality and offer an
            explicit <C>deepEquals</C>/<C>isomorphic</C> method when needed.</p>
        </Reveal>
        <Reveal summary="Q: Sketch Composite for a parking lot / org / menu in 15 seconds (the LLD-round version).">
          <p>Name the component interface + one operation that must propagate: "Node {'{'} totalSpots() {'}'} —
            Lot is a composite of Floors, Floor of Rows, Row of Spots (leaf). One totalSpots() call rolls up the
            whole lot." Interviewers want the recursive type + propagating operation, not ceremony — practice
            saying it in two sentences.</p>
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
        <strong>Day 28 complete?</strong> Homework: build the calculator that compilers are made of.
        <C> interface Expression {'{'} double evaluate(); String print(); {'}'}</C> — leaf <C>Num(double)</C>,
        composites <C>Add</C> and <C>Multiply</C> (each holding <C>List&lt;Expression&gt;</C>, not just two!).
        ① Build (3 + 4) × 2 and assert evaluate() == 14 and print() == "((3.0 + 4.0) * 2.0)". ② Nest deeper:
        (1 + 2) × (3 + (4 × 5)) — zero new code should be needed. ③ Add a <C>Neg(Expression)</C> single-child
        composite. ④ Bonus: add the cycle guard and try to make an expression contain itself. ⑤ One sentence:
        which Week 8 pattern would let you add <C>toLatex()</C> WITHOUT editing these classes?
        <br /><br />
        Next: <strong>Day 29 — Facade &amp; Proxy</strong>: a double bill — the one simple door that hides a
        whole machine room, and the stand-in that guards, caches, and lazy-loads while pretending to be the
        real thing.
      </div>
    </div>
  )
}
