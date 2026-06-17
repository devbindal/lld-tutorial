import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the LRU cache running ============ */
const CAP = 3
const VALUES = { A: 1, B: 2, C: 3, D: 4, E: 5 }

function LRUDemo() {
  const [order, setOrder] = useState([])   // MRU first ... LRU last; items {key}
  const [log, setLog] = useState('empty cache · capacity ' + CAP)
  const [flash, setFlash] = useState(null) // evicted key to flash

  function get(key) {
    const idx = order.findIndex((o) => o === key)
    if (idx === -1) { setLog(`get(${key}) → MISS (not in cache)`); setFlash(null); return }
    const next = [key, ...order.filter((o) => o !== key)]
    setOrder(next); setFlash(null)
    setLog(`get(${key}) → HIT, value ${VALUES[key]} · ${key} moved to front (most-recently-used)`)
  }
  function put(key) {
    let next = order.filter((o) => o !== key)
    next = [key, ...next]
    let evicted = null
    if (next.length > CAP) { evicted = next.pop(); }
    setOrder(next); setFlash(evicted)
    setLog(order.includes(key)
      ? `put(${key}) → key existed → value updated · moved to front`
      : `put(${key}, ${VALUES[key]}) → inserted at front${evicted ? ` · cache FULL → evicted LRU = ${evicted}` : ''}`)
  }
  function reset() { setOrder([]); setLog('empty cache · capacity ' + CAP); setFlash(null) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · a capacity-{CAP} LRU cache — put fills it, get promotes, full triggers eviction</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {Object.keys(VALUES).map((k) => (
          <button key={k} className="act" style={{ fontSize: 12 }} onClick={() => put(k)}>put({k})</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {Object.keys(VALUES).map((k) => (
          <button key={k} className="ghost act" style={{ fontSize: 12 }} onClick={() => get(k)}>get({k})</button>
        ))}
        <button className="ghost act" style={{ fontSize: 12 }} onClick={reset}>reset</button>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', width: 36 }}>MRU →</span>
        {order.length === 0 && <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#bbb' }}>(empty)</span>}
        {order.map((k, i) => (
          <div key={k} style={{
            width: 50, height: 46, borderRadius: 8, border: '1.5px solid var(--line)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'IBM Plex Mono', fontSize: 12,
            background: i === 0 ? '#EAF7EF' : i === order.length - 1 ? '#FFF1D6' : '#fff',
          }}>
            <b>{k}</b><span style={{ fontSize: 9, color: '#666' }}>={VALUES[k]}</span>
          </div>
        ))}
        {order.length > 0 && <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5' }}>← LRU</span>}
        {flash && (
          <div style={{
            width: 50, height: 46, borderRadius: 8, border: '1.5px dashed var(--red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--red)', background: '#FDECEC',
          }}>✕{flash}</div>
        )}
      </div>
      <div className="statbar" style={{ display: 'block', marginTop: 8 }}>
        <span style={{ fontSize: 12.5 }}>{log}</span>
      </div>
      <Good style={{ marginTop: 10 }}><span style={{ fontSize: 12.5 }}>Fill it (put A, B, C), then <b>get(A)</b> — A jumps to the front. Now <b>put(D)</b>: the cache is full, so the LRU (the rightmost) is evicted, NOT A. Recency is the whole game.</span></Good>
    </div>
  )
}

/* ============ Interactive 2: the DLL pointer rewire ============ */
const REWIRE_STEPS = [
  { code: '// get(C): C is at the tail end — promote it to the front', nodes: ['A', 'B', 'C'], note: 'Start: head ⇄ A ⇄ B ⇄ C ⇄ tail. C is least-recently-used (just before tail). A get must move it to the front.' },
  { code: 'C.prev.next = C.next;   // B.next = tail-side', nodes: ['A', 'B', 'C'], unlink: true, note: 'Unlink step 1: C\'s left neighbor (B) now points past C. B.next skips over C.' },
  { code: 'C.next.prev = C.prev;   // (tail).prev = B', nodes: ['A', 'B'], unlink: true, note: 'Unlink step 2: C\'s right neighbor points back to B. C is now fully detached — 2 pointer writes, O(1), no scanning.' },
  { code: 'C.next = head.next;  head.next.prev = C;', nodes: ['A', 'B'], note: 'Insert step 1: point C at the current front (A) and have A point back to C.' },
  { code: 'head.next = C;  C.prev = head;', nodes: ['C', 'A', 'B'], note: 'Insert step 2: head now points to C, C points back to head. Done: head ⇄ C ⇄ A ⇄ B ⇄ tail. Four writes total — O(1), regardless of list size.' },
]

function RewireDemo() {
  const [i, setI] = useState(0)
  const step = REWIRE_STEPS[i]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · why a doubly-linked list = O(1) move-to-front — step through the pointer rewires</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center', margin: '8px 0 12px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5' }}>head</span>
        {step.nodes.map((n) => (
          <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#bbb' }}>⇄</span>
            <span style={{
              width: 38, height: 38, borderRadius: 8, border: '1.5px solid var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Space Grotesk', fontWeight: 700,
              background: n === 'C' ? '#FFF1D6' : '#fff',
            }}>{n}</span>
          </span>
        ))}
        <span style={{ color: '#bbb' }}>⇄</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5' }}>tail</span>
        {step.unlink && <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'var(--amber)', marginLeft: 6 }}>(C detaching…)</span>}
      </div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{step.code}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className="act" onClick={() => setI((x) => Math.min(REWIRE_STEPS.length - 1, x + 1))} disabled={i >= REWIRE_STEPS.length - 1}>next →</button>
        <button className="ghost act" onClick={() => setI(0)}>reset</button>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', alignSelf: 'center' }}>step {i + 1}/{REWIRE_STEPS.length}</span>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        <span style={{ fontSize: 12.5 }}>{step.note}</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: eviction policy comparison ============ */
// fixed access sequence on a capacity-2 cache
const SEQ = ['put A', 'put B', 'get A', 'put C']
function runPolicy(policy) {
  const cap = 2
  let items = []   // {key, inserted, used, freq}
  let t = 0
  const trace = []
  for (const op of SEQ) {
    t++
    const [kind, key] = op.split(' ')
    let evicted = null
    const existing = items.find((it) => it.key === key)
    if (kind === 'get') {
      if (existing) { existing.used = t; existing.freq++; trace.push(`${op} → HIT`) }
      else trace.push(`${op} → MISS`)
      continue
    }
    // put
    if (existing) { existing.used = t; existing.freq++; }
    else {
      if (items.length === cap) {
        // pick victim by policy
        let victim
        if (policy === 'LRU') victim = items.reduce((a, b) => (a.used < b.used ? a : b))
        else if (policy === 'FIFO') victim = items.reduce((a, b) => (a.inserted < b.inserted ? a : b))
        else /* LFU */ victim = items.reduce((a, b) => (a.freq < b.freq ? a : b) )
        items = items.filter((it) => it !== victim)
        evicted = victim.key
      }
      items.push({ key, inserted: t, used: t, freq: 1 })
    }
    trace.push(`${op}${evicted ? ` → evict ${evicted}` : ''}`)
  }
  return { survivors: items.map((it) => it.key).sort(), trace }
}

function PolicyCompare() {
  const [policy, setPolicy] = useState('LRU')
  const { survivors, trace } = runPolicy(policy)
  const all = { LRU: runPolicy('LRU'), FIFO: runPolicy('FIFO'), LFU: runPolicy('LFU') }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · same access sequence, capacity 2 — different policy, different victim</div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 8 }}>
        sequence: {SEQ.join('  ·  ')}   (cap = 2)
      </div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {['LRU', 'FIFO', 'LFU'].map((p) => (
          <button key={p} className={policy === p ? 'on' : ''} onClick={() => setPolicy(p)}>{p}</button>
        ))}
      </div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
        {trace.map((l, i) => (
          <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, color: l.includes('evict') ? 'var(--red)' : 'var(--ink)' }}>{l}</div>
        ))}
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, marginTop: 6, fontWeight: 700, color: 'var(--green)' }}>
          survivors: {survivors.join(', ')}
        </div>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        <span style={{ fontSize: 12.5 }}>
          On <C>put C</C> with the cache full: <b>LRU</b> evicts {all.LRU.trace.find((t) => t.includes('evict'))?.split('evict ')[1] || 'B'} (least recently used — but A was just got!),{' '}
          <b>FIFO</b> evicts {all.FIFO.trace.find((t) => t.includes('evict'))?.split('evict ')[1] || 'A'} (first in, ignores the get),{' '}
          <b>LFU</b> evicts {all.LFU.trace.find((t) => t.includes('evict'))?.split('evict ')[1] || 'B'} (lowest frequency). Same data, three different answers — so eviction is a <b>Strategy</b>.
        </span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The defining constraint of an LRU cache that rules out the obvious solutions?',
    o: ['It must be thread-safe', 'BOTH get and put must be O(1) — so you cannot scan a list to find the least-recently-used item or shift an array on every access; that constraint forces the HashMap + doubly-linked-list combo', 'It must persist to disk', 'It must be generic'], a: 1,
    e: 'O(1) for both operations is THE requirement. A plain list/array makes either lookup or reordering O(n). The HashMap gives O(1) lookup; the DLL gives O(1) reordering and eviction — together they hit O(1) for both.',
    w: { 0: 'Thread-safety is a real follow-up, but the core constraint is the O(1) time bound.',
         2: 'Persistence is out of scope for the classic in-memory LRU.',
         3: 'Generics are nice but not the constraint that shapes the data structure.' },
    r: { id: 's1', label: 'Section 1 — the O(1) requirement' } },
  { q: 'Why a HashMap alone is not enough for LRU?',
    o: ['HashMaps are too slow', 'A HashMap gives O(1) lookup but has NO notion of order/recency — you still need to know which key is least-recently-used in O(1), which the map cannot tell you', 'HashMaps cannot store objects', 'HashMaps have a size limit'], a: 1,
    e: 'The map answers "what is the value for key K?" instantly, but not "which key should I evict?". Recency order needs a second structure (the DLL) that the map\'s nodes point into.',
    w: { 0: 'HashMap lookup is O(1) — speed isn\'t the gap; ordering is.',
         2: 'Maps store any objects fine.',
         3: 'No inherent size limit — the cache imposes capacity, not the map.' },
    r: { id: 's3', label: 'Section 3 — why not just a map' } },
  { q: 'Why a DOUBLY-linked list and not a singly-linked list?',
    o: ['Double is faster to traverse', 'To remove a node in O(1) you need its predecessor; a singly-linked list would require an O(n) scan to find prev, but a doubly-linked node carries node.prev directly', 'Singly-linked lists cannot hold values', 'Double uses less memory'], a: 1,
    e: 'Eviction and move-to-front both delete a node from the middle. With prev pointers, you splice it out in O(1) (node.prev.next = node.next; node.next.prev = node.prev). Singly-linked would need to walk the list to find prev.',
    w: { 0: 'Traversal speed is the same; it\'s about O(1) removal of a known node.',
         2: 'Both can hold values; that\'s irrelevant.',
         3: 'Doubly-linked uses MORE memory (extra pointer) — the trade buys O(1) removal.' },
    r: { id: 's4', label: 'Section 4 — why doubly-linked' } },
  { q: 'What are the dummy head/tail SENTINEL nodes for?',
    o: ['To store extra data', 'To eliminate null/edge-case checks: with sentinels, every real node always has a non-null prev and next, so insert/remove never special-case the empty list or the first/last node', 'To make the list circular', 'To count the size'], a: 1,
    e: 'Sentinels (a dummy head and tail that never hold data) mean the list is never truly empty and real nodes always have neighbors — so the pointer-rewiring code has no "if first node" or "if list empty" branches.',
    w: { 0: 'They hold no real data — that\'s the point.',
         2: 'They bound the list; they don\'t make it circular.',
         3: 'Size is tracked by the map / a counter, not the sentinels.' },
    r: { id: 's4', label: 'Section 4 — sentinels' } },
  { q: 'On get(key) for a key that IS present, what happens?',
    o: ['Just return the value', 'Return the value AND move its node to the front (most-recently-used) — a get is an access, so it must update recency, or your LRU evicts recently-read items', 'Move it to the back', 'Increment a counter only'], a: 1,
    e: 'A read counts as a use. If get doesn\'t promote the node, the "recently read" item drifts toward the tail and gets wrongly evicted. get = lookup + move-to-front, both O(1).',
    w: { 0: 'Returning without promoting breaks LRU semantics — reads are accesses.',
         2: 'The back is the eviction end — that would make reads MORE likely to be evicted.',
         3: 'Counting frequency is LFU; LRU promotes on access.' },
    r: { id: 's6', label: 'Section 6 — get & put' } },
  { q: 'On eviction, beyond unlinking the tail node, what must NOT be forgotten?',
    o: ['Nothing else', 'Remove the evicted key from the HashMap too — the map and the list must stay in sync, or the map keeps a dangling entry pointing to a node no longer in the list (a leak + wrong lookups)', 'Resize the cache', 'Re-sort the list'], a: 1,
    e: 'The two structures mirror each other. Evict from the DLL but forget the map, and the map still says the key exists (pointing at an orphaned node) — memory leak and incorrect hits. Every structural change updates both.',
    w: { 0: 'Forgetting the map entry is the classic bug — it\'s definitely something.',
         2: 'Capacity is fixed; eviction keeps you at capacity.',
         3: 'The list never needs sorting — it\'s maintained in order by every operation.' },
    r: { id: 's6', label: 'Section 6 — keep map & list in sync' } },
  { q: 'The interviewer says "now make it LFU instead." The clean design that anticipated this?',
    o: ['Rewrite the whole cache', 'An EvictionPolicy abstraction (which item to evict + how to record access): LRU, LFU, FIFO become swappable strategies, and the cache\'s get/put logic stays the same (Day 31)', 'Add an if(isLFU) everywhere', 'Subclass the cache per policy'], a: 1,
    e: 'Eviction is the varying part — same sequence, different victim per policy. Behind one EvictionPolicy interface, LRU/LFU/FIFO are classes; the cache delegates "who to evict" and "record this access" to the policy.',
    w: { 0: 'A rewrite means the policy wasn\'t isolated — the smell the abstraction removes.',
         2: 'if(isLFU) scattered through get/put is the growing-switch smell (Day 12).',
         3: 'Subclassing per policy duplicates the cache mechanics; compose a policy instead.' },
    r: { id: 's8', label: 'Section 8 — eviction as a strategy' } },
  { q: 'Java already ships an LRU primitive. Which, and the catch worth mentioning?',
    o: ['HashMap', 'LinkedHashMap with accessOrder=true (override removeEldestEntry) gives LRU out of the box — but it is NOT thread-safe, so concurrent use needs synchronization (or a different structure)', 'TreeMap', 'ArrayList'], a: 1,
    e: 'LinkedHashMap(cap, 0.75f, true) maintains access order and, with removeEldestEntry, evicts the LRU automatically. Knowing the built-in (and that it needs external synchronization) shows real Java fluency.',
    w: { 0: 'Plain HashMap has no ordering — that\'s the whole problem.',
         2: 'TreeMap is sorted by key, not by access recency.',
         3: 'ArrayList has no map lookup and O(n) reordering.' },
    r: { id: 's10', label: 'Section 10 — the built-in & thread-safety' } },
]

/* ============ The page ============ */
export default function Day56() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 12 · Day 56 · Classic LLD Problems</div>
        <h1>LRU Cache:<br />O(1) Get, O(1) Put, and the Two Structures Behind It</h1>
        <p>Week 12 opens with the most-asked data-structure design there is. An LRU cache sounds simple — keep
           the N most-recently-used items — but the "O(1) for BOTH get and put" constraint rules out every
           obvious answer and forces one elegant combo: a HashMap married to a doubly-linked list. Plus the
           follow-up: make the eviction policy pluggable. Click everything.</p>
        <div className="chips">
          {['LRU cache', 'O(1) get/put', 'HashMap + DLL', 'sentinels', 'eviction policy', 'LFU vs FIFO'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What an LRU cache is — and the constraint that defines it</h2>
        <p>A cache holds a fixed number of items. When it\'s full and a new item arrives, something must go — and
          LRU evicts the <strong>L</strong>east <strong>R</strong>ecently <strong>U</strong>sed one. The whole
          design difficulty is one line in the spec:</p>
        <Code html={`  THE SPEC (and the line that makes it interesting)

  get(key)        → value, or "miss"          ┐
  put(key, value) → insert/update             ┘ ★ BOTH must be O(1) ★
  capacity full + new key → evict the LRU item

  WHY O(1) RULES OUT THE OBVIOUS:
  · a plain list ordered by recency → finding/moving an item is O(n)
  · an array → shifting on every access is O(n)
  · a HashMap alone → O(1) lookup, but NO idea which key is least-recent
  The only way to get O(1) for BOTH is to combine TWO structures.`} />
        <Note><strong>The shape, recognized:</strong> this is a data-structure design problem — the "entities"
          are nodes and pointers, and the interview is really "can you reason about O(1) operations?" Name the
          constraint (O(1) both) in minute one; everything else follows from it.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The clarifying questions</h2>
        <table className="matrix">
          <thead>
            <tr><th>question</th><th>typical answer</th><th>what it shapes</th></tr>
          </thead>
          <tbody>
            <tr><td>"What time complexity?"</td><td>"O(1) for get and put"</td><td>HashMap + DLL (the whole design)</td></tr>
            <tr><td>"Fixed capacity?"</td><td>"Yes, set at construction"</td><td>eviction triggers at capacity</td></tr>
            <tr><td>"Which eviction policy?"</td><td>"LRU now — maybe LFU later"</td><td>EvictionPolicy strategy slot</td></tr>
            <tr><td>"Generic keys/values?"</td><td>"Yes, Cache&lt;K,V&gt;"</td><td>generics</td></tr>
            <tr><td>"Thread-safe?"</td><td>"Single-threaded first; note concurrency"</td><td>a flag for Month 4</td></tr>
            <tr><td>"What does a miss return?"</td><td>"null / Optional.empty"</td><td>the get contract</td></tr>
          </tbody>
        </table>
        <p>This is a small problem, so the questions are tighter — but "what time complexity?" is the one that
          matters, because the answer dictates the entire structure. Get the O(1) requirement on the table and
          the design writes itself.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Why a HashMap alone isn\'t enough</h2>
        <p>A HashMap answers "<em>what\'s the value for key K?</em>" in O(1). But LRU also needs to answer
          "<em>which key is least-recently-used?</em>" in O(1) — and a map has no concept of order:</p>
        <Code html={`  TWO QUESTIONS, TWO STRUCTURES

  "value for key K?"            → HashMap<K, Node>      O(1) lookup ✓
  "which key to evict?"         → ??? the map can't say  ✗
  "mark K as just-used"         → ??? the map has no order ✗

  ADD a doubly-linked list that holds the keys in RECENCY order:
     front = most-recently-used  ······  back = least-recently-used
  · the map's value is a POINTER to that key's node in the list
  · evict = remove the back node ;  use = move a node to the front
  Both are O(1) because the map hands you the node directly — no search.`} />
        <Good><strong>The key insight:</strong> the map and the list <em>share</em> the nodes. The map gives you
          O(1) access to <em>any</em> node by key; the list gives you O(1) reordering and O(1) eviction of the
          ends. Neither structure alone can do both — together they nail O(1) for everything.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The data structure: HashMap + doubly-linked list (with sentinels)</h2>
        <Code html={`<span class="kw">class</span> Node&lt;K, V&gt; {
    K key; V value;                          <span class="cm">// key stored too — needed to remove from the map on evict</span>
    Node&lt;K, V&gt; prev, next;                    <span class="cm">// doubly-linked → O(1) removal of a known node</span>
    Node(K k, V v) { key = k; value = v; }
}

<span class="kw">public class</span> LRUCache&lt;K, V&gt; {
    <span class="kw">private final int</span> capacity;
    <span class="kw">private final</span> Map&lt;K, Node&lt;K, V&gt;&gt; map = <span class="kw">new</span> HashMap&lt;&gt;();   <span class="cm">// key → its node (O(1) access)</span>
    <span class="kw">private final</span> Node&lt;K, V&gt; head, tail;                       <span class="cm">// SENTINELS — dummy ends, never hold data</span>

    <span class="kw">public</span> LRUCache(<span class="kw">int</span> capacity) {
        <span class="kw">this</span>.capacity = capacity;
        head = <span class="kw">new</span> Node&lt;&gt;(<span class="kw">null</span>, <span class="kw">null</span>);                        <span class="cm">// front sentinel (MRU side)</span>
        tail = <span class="kw">new</span> Node&lt;&gt;(<span class="kw">null</span>, <span class="kw">null</span>);                        <span class="cm">// back sentinel (LRU side)</span>
        head.next = tail; tail.prev = head;                     <span class="cm">// empty list: head ⇄ tail</span>
    }

    <span class="cm">// --- the three O(1) pointer operations every method is built from ---</span>
    <span class="kw">private void</span> remove(Node&lt;K, V&gt; n) {                        <span class="cm">// splice a node out</span>
        n.prev.next = n.next; n.next.prev = n.prev;            <span class="cm">// no null checks — sentinels guarantee neighbors</span>
    }
    <span class="kw">private void</span> addFront(Node&lt;K, V&gt; n) {                      <span class="cm">// insert right after head (MRU)</span>
        n.next = head.next; n.prev = head;
        head.next.prev = n; head.next = n;
    }
    <span class="kw">private void</span> moveToFront(Node&lt;K, V&gt; n) { remove(n); addFront(n); }
}`} />
        <Warn><strong>The Node stores the KEY, not just the value.</strong> When you evict the tail node, you
          must also delete it from the map — and the map is keyed by K, so the node has to carry its key. Forget
          this and you can\'t remove the map entry, leaving a dangling reference (a leak and wrong lookups). The
          sentinels, meanwhile, mean <C>remove</C>/<C>addFront</C> never check for null — every node always has
          real neighbors.</Warn>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🗃 Play: the LRU cache running</h2>
        <p>A capacity-3 cache. Watch the recency order (green = MRU, amber = LRU) and the eviction when it
          overflows:</p>
        <LRUDemo />
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The two operations, in full</h2>
        <Code html={`<span class="kw">public</span> V get(K key) {
    Node&lt;K, V&gt; n = map.get(key);
    <span class="kw">if</span> (n == <span class="kw">null</span>) <span class="kw">return null</span>;          <span class="cm">// miss</span>
    moveToFront(n);                          <span class="cm">// ★ a read IS a use → promote to MRU (or LRU breaks)</span>
    <span class="kw">return</span> n.value;
}

<span class="kw">public void</span> put(K key, V value) {
    Node&lt;K, V&gt; n = map.get(key);
    <span class="kw">if</span> (n != <span class="kw">null</span>) {                       <span class="cm">// existing key → update + promote</span>
        n.value = value; moveToFront(n); <span class="kw">return</span>;
    }
    <span class="kw">if</span> (map.size() == capacity) {            <span class="cm">// full → evict the LRU first</span>
        Node&lt;K, V&gt; lru = tail.prev;          <span class="cm">// node just before the tail sentinel</span>
        remove(lru);
        map.remove(lru.key);                 <span class="cm">// ★ keep map & list in SYNC — remove from BOTH</span>
    }
    Node&lt;K, V&gt; fresh = <span class="kw">new</span> Node&lt;&gt;(key, value);
    map.put(key, fresh); addFront(fresh);    <span class="cm">// insert as MRU, in both structures</span>
}`} />
        <Note><strong>Two rules carry the whole correctness:</strong> ① a <C>get</C> hit must
          <C> moveToFront</C> (a read is an access — skip this and recently-read items get wrongly evicted), and
          ② every structural change touches <em>both</em> structures (insert → map.put + addFront; evict →
          remove + map.remove). Keep map and list mirrored and the cache is correct; let them drift and you get
          leaks and phantom hits.</Note>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🔗 Play: the O(1) magic (pointer rewires)</h2>
        <p>"Move to front" feels like it should be expensive — but it\'s just four pointer writes, no matter how
          big the list. Step through a <C>get(C)</C> promoting the tail node:</p>
        <RewireDemo />
        <Good><strong>What you should notice:</strong> ① Detaching C is 2 writes (its neighbors point past it);
          inserting C at the front is 2 more. Four writes, done — independent of list length. ② No traversal,
          no shifting — that\'s the O(1). ③ This is exactly why it must be DOUBLY-linked: detaching C needs
          C.prev, which a singly-linked node wouldn\'t have.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Eviction as a Strategy: LRU, LFU, FIFO</h2>
        <p>The classic follow-up: "now make it LFU." If eviction is tangled into <C>get</C>/<C>put</C>, that\'s a
          rewrite. If it\'s behind an interface, it\'s a new class — varying algorithm, one contract (Day 31):</p>
        <Code html={`<span class="kw">public interface</span> EvictionPolicy&lt;K&gt; {
    <span class="kw">void</span> recordAccess(K key);    <span class="cm">// called on every get/put — the policy tracks usage its own way</span>
    <span class="kw">void</span> add(K key);             <span class="cm">// a new key entered the cache</span>
    K evict();                   <span class="cm">// which key to remove when full</span>
}

<span class="cm">// LRU  → recency order (the DLL we built); evict() returns the tail key</span>
<span class="cm">// FIFO → insertion order; recordAccess does NOTHING (reads don't change order)</span>
<span class="cm">// LFU  → a frequency count per key; evict() returns the least-frequently-used</span>

<span class="kw">public class</span> Cache&lt;K, V&gt; {
    <span class="kw">private final</span> Map&lt;K, V&gt; store = <span class="kw">new</span> HashMap&lt;&gt;();
    <span class="kw">private final</span> EvictionPolicy&lt;K&gt; policy;        <span class="cm">// injected — swap LRU↔LFU↔FIFO with one wiring line</span>

    <span class="kw">public</span> V get(K key) {
        <span class="kw">if</span> (!store.containsKey(key)) <span class="kw">return null</span>;
        policy.recordAccess(key);                  <span class="cm">// the policy decides what "use" means</span>
        <span class="kw">return</span> store.get(key);
    }
    <span class="kw">public void</span> put(K key, V value) {
        <span class="kw">if</span> (!store.containsKey(key) &amp;&amp; store.size() == capacity)
            store.remove(policy.evict());          <span class="cm">// ask the policy WHO to evict</span>
        store.put(key, value); policy.add(key); policy.recordAccess(key);
    }
}`} />
        <Good><strong>The cache mechanics stay identical; only the policy varies.</strong> "Make it LFU" =
          inject <C>new LfuPolicy()</C>. The difference is purely <em>which item</em> to evict and <em>how</em>
          access is recorded — exactly the Strategy pattern\'s job. (Note: a truly O(1) LFU needs a cleverer
          structure than a frequency map — a nice "can you do LFU in O(1)?" rabbit hole to acknowledge.)</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>♻️ Play: eviction policy comparison</h2>
        <p>The same access sequence on a capacity-2 cache. Switch the policy and watch a <em>different</em> key
          get evicted — the reason eviction deserves to be a strategy:</p>
        <PolicyCompare />
        <Good><strong>What you should notice:</strong> ① After <C>get A</C>, LRU and LFU both protect A (it was
          just used), so <C>put C</C> evicts B. ② FIFO ignores the <C>get</C> entirely and evicts A (first in) —
          a genuinely different answer from the same data. ③ Same cache, same sequence, three outcomes — which
          is precisely why the policy is a swappable strategy, not baked in.</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps + the built-in</h2>
        <Warn><strong>A singly-linked list.</strong> You can\'t remove a known node in O(1) without its
          predecessor — you\'d scan to find prev (O(n)). Doubly-linked carries <C>prev</C>.</Warn>
        <Warn><strong>An array/ArrayList for recency.</strong> Moving an item to the front shifts everything —
          O(n) per access. The DLL moves a node in O(1).</Warn>
        <Warn><strong>Forgetting to update the map on eviction.</strong> Remove the tail node but leave its map
          entry → dangling reference, memory leak, and lookups that "hit" a node no longer in the list. Every
          structural change touches both structures.</Warn>
        <Warn><strong>get not promoting on a hit.</strong> A read is a use. If <C>get</C> doesn\'t
          <C> moveToFront</C>, recently-read items sink to the tail and get evicted wrongly — it\'s not LRU
          anymore.</Warn>
        <Warn><strong>Skipping sentinels.</strong> Without dummy head/tail you special-case the empty list and
          first/last node everywhere — more code, more off-by-one bugs. Sentinels make every node have
          neighbors.</Warn>
        <Note><strong>The built-in:</strong> <C>LinkedHashMap(capacity, 0.75f, true)</C> maintains
          <em> access order</em>; override <C>removeEldestEntry</C> to auto-evict the LRU. It\'s the real-world
          answer — but it is <strong>not thread-safe</strong>, so concurrent use needs synchronization (or a
          purpose-built concurrent cache). Mention both the built-in and the threading caveat.</Note>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>The constraint:</strong> O(1) get AND put — this forces the design. Say it first.</li>
          <li><strong>The combo:</strong> <C>HashMap&lt;K, Node&gt;</C> (O(1) lookup) + doubly-linked list ordered by recency (O(1) reorder/evict). The map\'s values are pointers into the list; they share nodes.</li>
          <li><strong>Doubly-linked + sentinels:</strong> prev pointers give O(1) removal of a known node; dummy head/tail kill all null/edge cases.</li>
          <li><strong>get(hit):</strong> return value + moveToFront. <strong>put:</strong> update+promote if present, else (evict tail if full) insert at front. A read IS a use.</li>
          <li><strong>Sync both structures:</strong> insert → map.put + addFront; evict → remove + map.remove. The Node stores its KEY so eviction can delete the map entry.</li>
          <li><strong>Eviction = Strategy:</strong> <C>EvictionPolicy</C> (recordAccess / add / evict); LRU/FIFO/LFU as classes. "Make it LFU" = one wiring line. (True O(1) LFU needs extra structure.)</li>
          <li><strong>Built-in:</strong> <C>LinkedHashMap</C> accessOrder + removeEldestEntry = LRU, but not thread-safe. Concurrency is a Month-4 flag.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Make it thread-safe. What are the options and trade-offs?"'>
          <p>Simplest: wrap get/put in a single lock (synchronize the methods) — correct, but it serializes all
            access, killing concurrency. Better: a <C>ReadWriteLock</C> doesn\'t help much here because a get
            <em>mutates</em> recency (it\'s a write), so reads aren\'t read-only. Real concurrent caches shard the
            keyspace (lock striping — like <C>ConcurrentHashMap</C>) so different keys don\'t contend, and often
            relax strict LRU to approximate LRU (e.g. Caffeine\'s TinyLFU) because exact global recency ordering
            is a contention bottleneck. The senior point: strict LRU and high concurrency fight each other, so
            production caches approximate. Full treatment is Month 4.</p>
        </Reveal>
        <Reveal summary='Q: "Can you do LFU in O(1)? It sounds harder than LRU."'>
          <p>Yes, but it needs a cleverer structure than a frequency-count map (which makes evict O(n) to find
            the min). The classic O(1) LFU keeps a map of key→(value, freq), a map of freq→doubly-linked-list of
            keys at that frequency, and a <C>minFreq</C> pointer. On access, move the key from its freq-list to
            the freq+1 list; evict from the minFreq list\'s tail. Every operation is O(1). It\'s a well-known
            hard-mode follow-up — worth knowing it exists and that the trick is bucketing keys by frequency,
            even if you don\'t code it fully under time pressure.</p>
        </Reveal>
        <Reveal summary='Q: "Add a TTL — entries expire after N seconds. How?"'>
          <p>Store an expiry timestamp on each node (using an injected <C>Clock</C> — Day 47, so it\'s testable).
            Two flavors: LAZY expiry — on get, if <C>now &gt; expiry</C>, treat as a miss and remove it; cheap
            but stale entries linger until accessed. ACTIVE expiry — a background sweeper evicts expired entries
            periodically; prompt but costs a scheduled job. Most real caches do lazy + a slow sweeper. Same
            sweeper-vs-lazy trade as BookMyShow\'s seat holds (Day 52) — and note TTL eviction is orthogonal to
            LRU eviction (an entry can leave for either reason).</p>
        </Reveal>
        <Reveal summary='Q: "Why store the key inside the Node? It feels redundant with the map."'>
          <p>Because eviction works from the LIST end, not the map. When the cache is full you grab
            <C> tail.prev</C> (the LRU node) to evict it — but to also delete it from the map you need its KEY,
            and all you have is the node. Without <C>node.key</C> you\'d have no way to find the map entry to
            remove (short of scanning the map, which is O(n) and defeats the point). So the node carries its key
            precisely to keep eviction O(1) on both structures. It\'s the small detail that makes the
            map↔list sync possible.</p>
        </Reveal>
        <Reveal summary='Q: "What real systems use this, and is exact LRU what they actually run?"'>
          <p>Caching is everywhere — CPU caches, database buffer pools, CDNs, Redis (with configurable eviction
            policies), application caches like Guava/Caffeine. But most production caches do NOT run textbook
            exact LRU: it\'s a concurrency bottleneck (every read mutates shared recency state) and LRU has known
            weaknesses (a single big scan can flush the whole cache). So they use approximations — sampled LRU
            (Redis evicts the best of a few random samples), or frequency-aware policies like LFU/TinyLFU
            (Caffeine) that resist scan pollution. The interview answer: "exact LRU is the teaching version;
            real caches approximate it for concurrency and hit-rate." That framing shows you know where the toy
            meets reality.</p>
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
        <strong>Day 56 complete?</strong> Homework: build <C>LRUCache&lt;K,V&gt;</C> from scratch — a
        <C> Node</C> with prev/next/key/value, dummy head/tail sentinels, a <C>HashMap&lt;K,Node&gt;</C>, and
        O(1) <C>get</C>/<C>put</C> with moveToFront and tail eviction (remember to remove from BOTH structures).
        Prove it: (a) capacity-2, put A, put B, get A, put C → get B is a miss (B was evicted), get A and get C
        hit; (b) get on a hit moves the key to MRU. Stretch: extract an <C>EvictionPolicy</C> interface and add
        a FIFO policy, swapping it with one wiring line — then look up how an O(1) LFU keeps freq-buckets.
        <br /><br />
        Next: <strong>Day 57 — Notification System</strong>: sending email / SMS / push through one interface —
        channels as strategies, templates, user preferences, and retries with pluggable delivery.
      </div>
    </div>
  )
}
