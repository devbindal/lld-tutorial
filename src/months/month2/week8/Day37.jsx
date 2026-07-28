import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The two players ============ */
const SONGS = ['Lo-fi', 'Jazz', 'Synth', 'Rock', 'Indie', 'Tabla', 'Veena', 'Choir']

function TwoPlayers() {
  const [storage, setStorage] = useState('array')
  const [client, setClient] = useState('iterator')
  const [result, setResult] = useState(null)

  function playAll() {
    const n = SONGS.length
    if (client === 'iterator') {
      setResult({ ok: true, ops: n, msg: `played all ${n} songs · ${n} cursor moves — SAME loop, whatever the box` })
    } else if (storage === 'array') {
      setResult({ ok: true, ops: n, msg: `played all ${n} songs · ${n} direct jumps — arrays forgive index loops` })
    } else if (storage === 'linked') {
      const ops = (n * (n + 1)) / 2
      setResult({ ok: true, ops, msg: `played all ${n} songs · ${ops} node hops! get(i) re-walks from the head EVERY time — O(n²) on a linked list 🐌` })
    } else {
      setResult({ ok: false, ops: 0, msg: 'COMPILE ERROR: ShuffleBag has no get(int) — sets have no index. The index-client cannot even be written.' })
    }
  }

  const boxArt = {
    array: '[0]Lo-fi [1]Jazz [2]Synth [3]Rock …  (contiguous slots)',
    linked: 'Lo-fi → Jazz → Synth → Rock → …  (nodes + next pointers)',
    shuffle: '{ Rock, Veena, Jazz, … }  (unordered set, no index!)',
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · three boxes, two clients — who survives a storage change?</div>
      <div className="modbtns">
        {[['array', '📦 ArrayPlaylist'], ['linked', '🔗 LinkedPlaylist'], ['shuffle', '🎲 ShuffleBag']].map(([k, l]) => (
          <button key={k} className={storage === k ? 'on' : ''} onClick={() => { setStorage(k); setResult(null) }}>{l}</button>
        ))}
      </div>
      <div className="modbtns">
        <button className={client === 'iterator' ? 'on' : ''} onClick={() => { setClient('iterator'); setResult(null) }}>🎧 iterator client: while(it.hasNext()) play(it.next())</button>
        <button className={client === 'index' ? 'on' : ''} onClick={() => { setClient('index'); setResult(null) }}>🔢 index client: for(i=0…) play(list.get(i))</button>
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
        inside the box: {boxArt[storage]}
      </div>
      <button className="act" onClick={playAll} style={{ marginBottom: 10 }}>▶ play all</button>
      {result && (
        <div className="statbar" style={{ background: result.ok ? (result.ops > 10 ? '#FFF6E8' : '#EAF7EF') : '#FDECEC' }}>
          {result.ok ? '🎵 ' : '🧱 '}<span>{result.msg}</span>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 2: The CME lab ============ */
const CME_MODES = {
  foreach: {
    label: '💥 for-each + list.remove()',
    steps: [
      { line: 'Iterator it = list.iterator()', mod: 7, exp: 7, note: 'The iterator snapshots expectedModCount = list.modCount = 7.' },
      { line: 'next() → "Lo-fi" ✓', mod: 7, exp: 7, note: 'Check passes: 7 == 7. Music plays.' },
      { line: 'next() → "BadSong" — client calls list.remove("BadSong") DIRECTLY', mod: 8, exp: 7, note: 'The LIST mutated: modCount → 8. The iterator still expects 7. Nobody told the cursor.' },
      { line: 'next() → checkForComodification(): 8 != 7', mod: 8, exp: 7, note: 'The fail-fast tripwire fires.' },
      { line: '💥 ConcurrentModificationException', mod: 8, exp: 7, note: 'Despite the name, NO threads were involved — one loop modified the list behind its own iterator. The most mis-blamed exception in Java.' },
    ],
  },
  itremove: {
    label: '✅ iterator.remove()',
    steps: [
      { line: 'Iterator it = list.iterator()', mod: 7, exp: 7, note: 'Same start.' },
      { line: 'next() → "BadSong" → it.remove()', mod: 8, exp: 8, note: 'The ITERATOR removes — and updates BOTH counters: modCount 8, expectedModCount 8. The cursor stays honest.' },
      { line: 'next() → "Synth" ✓ … loop finishes', mod: 8, exp: 8, note: 'Checks keep passing. This is THE sanctioned way to remove during external iteration.' },
    ],
  },
  removeif: {
    label: '✅ removeIf(lambda)',
    steps: [
      { line: 'list.removeIf(s -> s.equals("BadSong"))', mod: 8, exp: 8, note: 'Internal iteration: the COLLECTION drives the loop itself and edits safely as it goes — no exposed cursor to betray.' },
      { line: 'done — one line, no ceremony', mod: 8, exp: 8, note: 'The modern default for filter-while-iterating. (Streams .filter().toList() for the immutable flavor.)' },
    ],
  },
}

function CmeLab() {
  const [mode, setMode] = useState('foreach')
  const [step, setStep] = useState(-1)
  const steps = CME_MODES[mode].steps
  const cur = step >= 0 ? steps[step] : null

  return (
    <div className="panel">
      <div className="ptitle">Live demo · removing "BadSong" mid-loop, three ways</div>
      <div className="modbtns">
        {Object.entries(CME_MODES).map(([k, v]) => (
          <button key={k} className={mode === k ? 'on' : ''} onClick={() => { setMode(k); setStep(-1) }}>{v.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))} disabled={step >= steps.length - 1}>
          {step < 0 ? '▶ run' : 'next →'}
        </button>
        <button className="ghost act" onClick={() => setStep(-1)}>reset</button>
        {cur && (
          <span className="chip" style={{ fontFamily: 'IBM Plex Mono', background: cur.mod !== cur.exp ? '#FFE0DE' : '#EAF7EF' }}>
            modCount={cur.mod} · expected={cur.exp} {cur.mod !== cur.exp ? '⚠️' : '✓'}
          </span>
        )}
      </div>
      <div className="heap">
        {steps.slice(0, step + 1).map((t, i) => (
          <div key={i} style={{
            fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '4px 8px', borderRadius: 6,
            background: i === step ? (t.line.includes('💥') ? '#FFE0DE' : '#EEF2FF') : 'transparent',
            fontWeight: i === step ? 700 : 400,
          }}>{t.line}</div>
        ))}
        {step < 0 && <div className="empty">Press run — and watch the two counters.</div>}
      </div>
      {cur && <div className="statbar">💡 <span>{cur.note}</span></div>}
    </div>
  )
}

/* ============ Interactive 3: The infinite iterator ============ */
function InfiniteIterator() {
  const [seq, setSeq] = useState([])
  const [pair, setPair] = useState([0, 1])

  function next() {
    if (seq.length >= 14) return
    const [a, b] = pair
    setSeq((s) => [...s, a])
    setPair([b, a + b])
  }
  function reset() { setSeq([]); setPair([0, 1]) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · an iterator with NO collection behind it — values born on demand</div>
      <Code html={`<span class="kw">class</span> FibIterator <span class="kw">implements</span> Iterator&lt;Long&gt; {
    <span class="kw">private long</span> a = <span class="num">0</span>, b = <span class="num">1</span>;
    <span class="kw">public boolean</span> hasNext() { <span class="kw">return true</span>; }      <span class="cm">// forever! ∞</span>
    <span class="kw">public</span> Long next() {
        <span class="kw">long</span> r = a;
        <span class="kw">long</span> t = a + b; a = b; b = t;             <span class="cm">// the NEXT value is computed,</span>
        <span class="kw">return</span> r;                                 <span class="cm">// not fetched — nothing is stored</span>
    }
}`} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={next} disabled={seq.length >= 14}>it.next()</button>
        <button className="ghost act" onClick={reset}>new FibIterator()</button>
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, minHeight: 24, marginBottom: 8 }}>
        {seq.length === 0 ? <span style={{ color: '#c0c5cf' }}>…press next</span> : seq.join('  ')}
      </div>
      <div className="statbar">
        ♾️ <span>hasNext() is always true and memory stays at two longs — an iterator is a CURSOR PROTOCOL, not a box. Lazy, infinite sequences are why Streams (built on this idea) can say Stream.iterate(…).limit(10).</span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Iterator pattern\'s intent is…',
    o: ['To copy collections', 'To make collections immutable', 'To access an aggregate\'s elements SEQUENTIALLY without exposing its underlying representation', 'To sort elements'], a: 2,
    e: 'The client gets a cursor protocol (hasNext/next); whether the box is an array, linked nodes, a tree or nothing at all stays the box\'s private business (encapsulation, Day 2, applied to traversal).',
    w: { 0: 'No copying — a view that walks.',
         1: 'Mutability is orthogonal (iterators can even remove).',
         3: 'Order is whatever the aggregate offers; sorting is Comparator\'s job (31).' },
    r: { id: 's1', label: 'Section 1 — the next button' } },
  { q: 'Iterable vs Iterator — why TWO interfaces?',
    o: ['They are aliases', 'Iterable = "you can ask me for a cursor" (iterator() — a factory method!); Iterator = one single-use cursor with its own position. Each call to iterator() births a fresh, independent walk', 'Historical accident', 'Iterator extends Iterable'], a: 1,
    e: 'Separating the box from the cursor lets one playlist serve many simultaneous walkers — and lets for-each restart cleanly every time. iterator() is Day 22\'s factory method, verbatim (GoF lists it as the example).',
    w: { 0: 'Different jobs: source vs position.',
         2: 'Deliberate design — restartability and multiple cursors.',
         3: 'Neither extends the other.' },
    r: { id: 's3', label: 'Section 3 — the two interfaces' } },
  { q: 'What does for (Song s : playlist) actually compile to?',
    o: ['Iterator it = playlist.iterator(); while (it.hasNext()) { Song s = it.next(); … } — the pattern is the language feature\'s engine', 'An index loop with get(i)', 'A stream pipeline', 'Recursion'], a: 0,
    e: 'For-each is pure syntax sugar over the Iterator protocol — which is why it works on ANY Iterable (lists, sets, your own classes) and why mutating the list inside it explodes (the hidden iterator notices).',
    w: { 1: 'Index loops only work on indexed things — for-each works on Sets too.',
         2: 'Streams are a separate API (built on the same idea).',
         3: 'No recursion involved.' },
    r: { id: 's3', label: 'Section 3 — for-each desugared' } },
  { q: 'ConcurrentModificationException in a single-threaded loop — the mechanics?',
    o: ['Too many elements', 'A JVM bug', 'The list\'s modCount changed (direct remove/add) while the iterator still holds the old expectedModCount — the next() tripwire compares them and throws. No threads required, despite the name', 'The GC interfered'], a: 2,
    e: 'Fail-fast iterators carry a snapshot of the modification counter. Any structural change NOT made through the iterator desynchronizes the two counts — caught at the next cursor move.',
    w: { 0: 'Size is irrelevant.',
         1: 'Working exactly as designed.',
         3: 'GC never mutates your list.' },
    r: { id: 's5', label: 'Section 5 — CME mechanics' } },
  { q: 'The THREE sanctioned ways to remove while iterating?',
    o: ['iterator.remove() (updates both counters) · collection.removeIf(predicate) (internal iteration) · CopyOnWriteArrayList (iterate a snapshot — Day 32\'s listener trick)', 'Reflection', 'Only streams', 'You simply cannot'], a: 0,
    e: 'Each fits a context: it.remove() inside an external loop, removeIf for declarative filtering, COW for read-heavy concurrent listener lists. Direct list.remove() inside for-each is the one forbidden move.',
    w: { 1: 'Please no. 🙂',
         2: 'Streams produce NEW collections — also fine, different flavor.',
         3: 'Three good ways exist.' },
    r: { id: 's6', label: 'Section 6 — the CME lab' } },
  { q: 'Why is for(i=0; i<n; i++) list.get(i) a performance LANDMINE?',
    o: ['It always allocates', 'get() is synchronized', 'Index loops are deprecated', 'On a LinkedList, get(i) walks from the head every call → the loop becomes O(n²); the iterator walks node-to-node in O(n). The client coupled itself to a representation assumption'], a: 3,
    e: '8 songs: 36 hops instead of 8. A million log lines: a frozen service. Iterator clients survive representation changes; index clients silently degrade (or fail to compile on Sets).',
    w: { 0: 'Allocation is not the issue.',
         1: 'No locking involved.',
         2: 'Index loops are fine ON ARRAYS — the trap is assuming everything is one.' },
    r: { id: 's4', label: 'Section 4 — the two players' } },
  { q: 'External vs INTERNAL iteration?',
    o: ['External is deprecated', 'Internal is single-threaded only', 'Same thing', 'External: YOU pull values (while hasNext/next) and control the loop. Internal: you hand a lambda to the collection (forEach, streams) and IT runs the loop — less control, fewer cursor bugs'], a: 3,
    e: 'The modern shift: most loops became forEach/streams (no exposed cursor → no CME-by-accident, parallelizable). External iteration remains king when you need early exit, lockstep walks of two collections, or generator-style laziness.',
    w: { 0: 'Both alive; choose per job.',
         1: 'parallelStream is internal iteration ACROSS threads.',
         2: 'Who drives the loop is the whole distinction.' },
    r: { id: 's7', label: 'Section 7 — who drives the loop' } },
  { q: 'Fail-fast vs fail-safe (weakly consistent) iterators?',
    o: ['Marketing terms', 'Fail-fast (ArrayList): detect outside mutation and throw CME — correctness scream. Weakly consistent (ConcurrentHashMap, COW): never throw; walk a snapshot or live-but-relaxed view — you may see or miss concurrent changes', 'Fail-safe throws twice', 'Fail-fast is concurrent-safe'], a: 1,
    e: 'Two philosophies: blow up loudly (find the bug) vs keep serving (accept staleness). Concurrent collections choose the second — which is why their iterators never CME but may show yesterday\'s listeners (Day 32).',
    w: { 0: 'Precise JDK behavior classes.',
         2: 'Fail-safe never throws CME at all.',
         3: 'Fail-fast detection is best-effort, NOT a thread-safety mechanism — the javadoc says so explicitly.' },
    r: { id: 's7', label: 'Section 7 — two philosophies' } },
]

/* ============ The page ============ */
export default function Day37() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 8 · Day 37 · Behavioral Patterns II</div>
        <h1>Iterator:<br />The Next Button</h1>
        <p>The humblest GoF pattern — and the one you have used most: it hides inside every for-each loop you
           have ever written. Today: what the compiler does behind that colon, why
           ConcurrentModificationException keeps ambushing loops with zero threads, and iterators that
           generate values out of thin air. Click everything.</p>
        <div className="chips">
          {['iterator', 'hasNext/next', 'for-each desugared', 'CME', 'internal vs external', 'lazy sequences'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The next button</h2>
        <p>Your music app has a NEXT button. Press it, a song plays. Is the playlist an array? A linked list?
          A shuffled bag? A server-side stream fetching pages? <strong>You cannot tell — and that is the entire
          point.</strong> The button is a cursor protocol; the storage is somebody else's secret.</p>
        <Note><strong>Iterator's intent:</strong> provide a way to access the elements of an aggregate
          <strong> sequentially</strong> without exposing its <strong>underlying representation</strong>.
          Day 2's encapsulation, applied to the act of traversal itself.</Note>
        <Code html={`        THE ITERATOR IDEA

   THE BOX (aggregate)                 THE CURSOR (iterator)
   Playlist                            «interface» Iterator&lt;Song&gt;
   - songs: ??? (private!)             boolean hasNext();
   + iterator() ────────births───▶     Song next();
     (a FACTORY METHOD, Day 22)
                                       client:  <span class="kw">while</span> (it.hasNext())
   array? nodes? tree? pages?              play(it.next());
   nobody outside ever learns          ← works on ALL of them, forever`} />
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The crime: clients that know the box</h2>
        <Code html={`<span class="cm">// the index-loop client "knows" the playlist is indexable:</span>
<span class="kw">for</span> (<span class="kw">int</span> i = <span class="num">0</span>; i &lt; playlist.size(); i++)
    play(playlist.get(i));

<span class="cm">// three quiet disasters waiting:</span>
<span class="cm">// 1. storage becomes a LinkedList   → get(i) walks from the head EVERY time: O(n²) 🐌</span>
<span class="cm">// 2. storage becomes a Set          → get(i) does not exist: COMPILE ERROR 🧱</span>
<span class="cm">// 3. storage becomes server pages   → there IS no i — rewrite every client 🔥</span>`} />
        <p>The loop coupled itself to the representation (Day 17's rope into a stranger's internals). Multiply
          by every loop in the codebase, and changing the storage of ONE class becomes shotgun surgery. The
          cursor protocol cuts every one of those ropes.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The two interfaces (and what the colon compiles to)</h2>
        <Code html={`<span class="cm">// the BOX promises only: "you may ask me for a fresh cursor"</span>
<span class="kw">public class</span> Playlist <span class="kw">implements</span> Iterable&lt;Song&gt; {
    <span class="kw">private final</span> Node head;                     <span class="cm">// representation: PRIVATE</span>

    <span class="kw">public</span> Iterator&lt;Song&gt; iterator() {           <span class="cm">// factory method (Day 22!)</span>
        <span class="kw">return new</span> Iterator&lt;&gt;() {
            <span class="kw">private</span> Node cursor = head;          <span class="cm">// EACH iterator owns its position</span>
            <span class="kw">public boolean</span> hasNext() { <span class="kw">return</span> cursor != <span class="kw">null</span>; }
            <span class="kw">public</span> Song next() {
                Song s = cursor.song; cursor = cursor.next; <span class="kw">return</span> s;
            }
        };
    }
}

<span class="cm">// what you write:                       // what the compiler emits:</span>
<span class="kw">for</span> (Song s : playlist)                  Iterator&lt;Song&gt; it = playlist.iterator();
    play(s);                             <span class="kw">while</span> (it.hasNext()) { Song s = it.next(); play(s); }`} />
        <p>Two consequences worth saying aloud: <strong>each iterator() call births an independent cursor</strong>
          — two nested for-each loops over the same list just work (two cursors, no clash); and for-each runs on
          <strong> anything Iterable</strong> — including classes you write tonight.</p>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🎧 Play: The two players</h2>
        <p>Same eight songs, three storage boxes, two client styles. Find the combination that explodes and
          the one that crawls:</p>
        <TwoPlayers />
        <Good><strong>What you should notice:</strong> ① The iterator client plays all three boxes with the
          identical loop and identical cost — representation independence, live. ② The index client turns
          LinkedList into 36 hops for 8 songs (O(n²)) and cannot even be WRITTEN against the bag. ③ Swapping
          the box is a one-place change only when every client speaks cursor.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The famous ambush: ConcurrentModificationException</h2>
        <p>Despite the name, the most common CME involves <strong>zero concurrency</strong> — one loop, one
          thread, one mistake: structurally modifying the collection <em>behind its own iterator's back</em>.
          The mechanics are two integers:</p>
        <ul>
          <li>Every ArrayList carries a <C>modCount</C> — bumped on every structural change (add/remove).</li>
          <li>Each iterator snapshots it at birth as <C>expectedModCount</C> — and compares on every
            <C> next()</C>. Mismatch → throw. That is the whole <strong>fail-fast</strong> machinery.</li>
        </ul>
        <Warn><strong>The forbidden move:</strong> <C>list.remove(x)</C> inside a for-each over that list.
          The hidden iterator's expected count goes stale; the very next <C>next()</C> trips the wire. The fix
          is never "catch CME" — it is using a sanctioned removal path.</Warn>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>💥 Play: The CME lab</h2>
        <p>Remove "BadSong" mid-loop three ways — watching the two counters the whole time:</p>
        <CmeLab />
        <Good><strong>What you should notice:</strong> ① The crash happens at the NEXT cursor move, not at the
          remove — the classic "why does it point at a different line?" confusion, explained. ② <C>it.remove()</C>
          updates BOTH counters — that's its entire magic. ③ <C>removeIf</C> sidesteps the issue by never
          exposing a cursor at all — internal iteration's quiet superpower.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Who drives the loop — and the two safety philosophies</h2>
        <table className="matrix">
          <thead>
            <tr><th></th><th>EXTERNAL iteration</th><th>INTERNAL iteration</th></tr>
          </thead>
          <tbody>
            <tr><td>who pulls</td><td>YOU: while(hasNext()) next()</td><td>the collection: forEach(lambda), streams</td></tr>
            <tr><td>control</td><td className="yes">early exit, lockstep walks, manual remove</td><td>less — but parallelizable for free</td></tr>
            <tr><td>cursor bugs</td><td>possible (CME, stale cursors)</td><td className="yes">no exposed cursor to betray</td></tr>
          </tbody>
        </table>
        <p>And the iterator SAFETY axis: <strong>fail-fast</strong> (ArrayList & friends — scream on outside
          mutation, best-effort only) vs <strong>weakly consistent</strong> (ConcurrentHashMap,
          CopyOnWriteArrayList — never throw, walk a snapshot or relaxed view, may miss concurrent updates).
          Day 32's listener list chose COW for exactly this: broadcast over a calm snapshot while subscriptions
          churn.</p>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>♾️ Play: The iterator with no collection</h2>
        <p>The deepest reframe of the day — a cursor over values that do not exist yet:</p>
        <InfiniteIterator />
        <Good><strong>What you should notice:</strong> ① No list anywhere — memory holds two longs while the
          sequence is endless: iterators are PROTOCOLS, not boxes. ② This laziness is the seed of
          Streams, generators and paging APIs (an iterator over API pages fetches page 2 only when you reach
          it). ③ hasNext()-forever is legal — termination is the CLIENT's choice (limit, break).</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Mutating behind the cursor</h3>
        <p>The CME lab's lesson. Sanctioned paths only: <C>it.remove()</C>, <C>removeIf</C>, COW, or collect
          changes and apply after the loop.</p>
        <h3>Trap 2 — Reusing a spent iterator</h3>
        <p>Iterators are one-way, one-use: after the walk, <C>hasNext()</C> is false forever. Want another
          pass? Ask the Iterable for a FRESH cursor (that is why the two interfaces exist).</p>
        <h3>Trap 3 — Assuming remove() works</h3>
        <p><C>Iterator.remove()</C> is an optional operation — <C>Arrays.asList</C> and immutable collections
          throw UnsupportedOperationException (Day 13's scar, cursor edition). Know your box before you cut.</p>
        <h3>Trap 4 — Index thinking on non-indexed boxes</h3>
        <p>The O(n²) LinkedList loop ships silently and freezes at scale. Habit: for-each (or streams) by
          default; indexes only when you truly need positions — and then on ArrayList.</p>
        <h3>Trap 5 — Leaking the representation through the iterator</h3>
        <p>An iterator that returns internal Node objects (not Songs) re-couples every client to the secret
          (Day 26's leaky adapter, cursor edition). Cursors return DOMAIN values only.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> sequential access without exposing representation. Box (Iterable, private storage, iterator() factory) + Cursor (Iterator, own position, single-use).</li>
          <li>for-each == iterator()/hasNext()/next() — works on anything Iterable, including yours. Fresh cursor per call → nested walks just work.</li>
          <li><strong>CME:</strong> modCount vs expectedModCount tripwire; fires on the next next(); no threads needed. Fixes: it.remove() · removeIf · COW · collect-then-apply.</li>
          <li>External (you pull — control) vs internal (forEach/streams — safety, parallelism). Fail-fast (scream) vs weakly consistent (snapshot, never CME).</li>
          <li>Iterators can GENERATE: lazy, infinite, paging — protocol, not box. LinkedList.get(i) loops = O(n²).</li>
          <li>Friends: iterator() is a Factory Method (22) · traverses Composites (28, explicit stack for deep trees) · COW from Observer (32).</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Why is fail-fast explicitly documented as BEST-EFFORT?">
          <p>modCount reads are not synchronized — under real concurrent mutation the check may miss the change
            entirely (or throw spuriously). The javadoc says: CME is for DETECTING BUGS, never for program
            logic. Code that catches CME to "retry the loop" fails interviews and production alike.</p>
        </Reveal>
        <Reveal summary="Q: What does ListIterator add over Iterator?">
          <p>Bidirectionality (hasPrevious/previous), positional indexes (nextIndex), and in-place
            <C> set(e)</C>/<C>add(e)</C> — a read-write cursor for Lists specifically. Niche but beloved
            written-test trivia, and the right tool for "replace every X while walking".</p>
        </Reveal>
        <Reveal summary="Q: How would you iterate a Composite tree (Day 28) externally?">
          <p>An iterator holding an explicit <C>Deque</C> of nodes: pop, push children, return value — DFS
            without recursion (push order decides DFS vs BFS via queue). This is the Day 28 corner answer
            grown into code: external iterators over trees ARE a stack walking itself.</p>
        </Reveal>
        <Reveal summary="Q: Streams vs Iterators — relationship and the one-shot rule?">
          <p>Streams are internal iteration with a fluent pipeline on top — and like iterators, they are
            SINGLE-USE: a consumed stream throws IllegalStateException on reuse. Both are cursors in spirit:
            ask the source again for a fresh one. Spliterator is the bridge interface underneath (splittable
            iterator — for parallelism).</p>
        </Reveal>
        <Reveal summary="Q: Can hasNext() have side effects? The paging-iterator design question.">
          <p>It often must — a paging iterator may need to FETCH the next page to know if one exists. Contract
            discipline: hasNext() must be idempotent (call it five times, same answer, one fetch) and next()
            must work even if hasNext() was never called. Buffer-one-ahead is the standard implementation.</p>
        </Reveal>
        <Reveal summary="Q: Why does java.util.Iterator have remove() at all — wasn't that a design smell?">
          <p>Pragmatism: removal during traversal needs cursor cooperation (the counters!), so it lives ON the
            cursor. The cost: an optional operation defaulting to throw (Day 13 tension, acknowledged in the
            JDK docs). Kotlin/C# made different choices — fine debate material that shows you read APIs
            critically.</p>
        </Reveal>
        <Reveal summary="Q: for-each over an array — is THAT the iterator pattern too?">
          <p>No object involved: the compiler emits a plain index loop for arrays (they are not Iterable).
            Same syntax, two desugarings — a sharp little detail that catches people who claim for-each
            "always uses iterators".</p>
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
        <strong>Day 37 complete?</strong> Homework: build <C>Playlist implements Iterable&lt;Song&gt;</C> backed
        by a PRIVATE singly-linked list. ① Hand-write the anonymous iterator (cursor field, hasNext, next) and
        prove for-each works on your class. ② Prove independent cursors: two nested for-each loops printing all
        pairs. ③ Reproduce the CME: remove a song via the playlist mid-loop, read the stack trace, then fix it
        with your own <C>iterator.remove()</C> implementation (maintain your own modCount pair!). ④ Bonus: a
        <C> PagedIterator</C> that "fetches" 3 songs at a time from a fake server list, buffering one page ahead
        — print when each fetch happens to SEE the laziness.
        <br /><br />
        Next: <strong>Day 38 — Mediator</strong>: when every colleague talks to every colleague, you get N²
        chaos — today we hire the air-traffic controller.
      </div>
    </div>
  )
}
