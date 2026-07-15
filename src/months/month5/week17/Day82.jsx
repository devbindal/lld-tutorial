import { useState, useRef } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Trie data structure (runs in the browser — pure JS)
   ============================================================ */
class TrieNode {
  constructor() {
    this.children = {}   // char → TrieNode
    this.isEnd = false
    this.frequency = 0
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode()
    this.freqMap = {}   // word → frequency (for lookup)
  }

  insert(word, freq) {
    let node = this.root
    for (const c of word) {
      if (!node.children[c]) node.children[c] = new TrieNode()
      node = node.children[c]
    }
    node.isEnd = true
    node.frequency = freq
    this.freqMap[word] = freq
  }

  // Walk to the prefix node; return null if prefix not found
  _walkTo(prefix) {
    let node = this.root
    for (const c of prefix) {
      if (!node.children[c]) return null
      node = node.children[c]
    }
    return node
  }

  // DFS from a node, collect all complete words + frequencies
  _dfs(node, current, results) {
    if (node.isEnd) results.push({ word: current, freq: node.frequency })
    for (const [c, child] of Object.entries(node.children)) {
      this._dfs(child, current + c, results)
    }
  }

  // Return top-k suggestions for a prefix, sorted by freq descending
  suggest(prefix, k) {
    if (!prefix) return []
    const node = this._walkTo(prefix)
    if (!node) return []
    const all = []
    this._dfs(node, prefix, all)
    // min-heap emulated: sort all and take top-k
    all.sort((a, b) => b.freq - a.freq)
    return all.slice(0, k)
  }
}

// Pre-loaded dataset (Demo 1 and Demo 2)
const SEED_WORDS = [
  { word: 'java', freq: 5000 },
  { word: 'javascript', freq: 8000 },
  { word: 'jar', freq: 200 },
  { word: 'python', freq: 9000 },
  { word: 'pytorch', freq: 4000 },
]

function buildSeedTrie() {
  const t = new Trie()
  for (const { word, freq } of SEED_WORDS) t.insert(word, freq)
  return t
}

/* ============================================================
   Demo 1 — Live Trie Builder
   ============================================================ */
function TrieBuilderDemo() {
  const [words, setWords] = useState(SEED_WORDS)
  const [inputWord, setInputWord] = useState('')
  const [inputFreq, setInputFreq] = useState('')
  const [highlightPath, setHighlightPath] = useState('')
  const [message, setMessage] = useState('Pre-loaded with 5 words. Type a word and frequency, then click Insert.')

  function handleInsert() {
    const w = inputWord.trim().toLowerCase()
    const f = parseInt(inputFreq, 10)
    if (!w || isNaN(f) || f <= 0) { setMessage('Enter a valid word and a positive frequency.'); return }
    const existing = words.find(x => x.word === w)
    if (existing) {
      setWords(prev => prev.map(x => x.word === w ? { ...x, freq: f } : x))
      setMessage(`Updated "${w}" frequency to ${f.toLocaleString()}.`)
    } else {
      setWords(prev => [...prev, { word: w, freq: f }])
      setMessage(`Inserted "${w}" (freq ${f.toLocaleString()}). Trie now has ${words.length + 1} words.`)
    }
    setHighlightPath(w)
    setInputWord('')
    setInputFreq('')
  }

  function handleReset() {
    setWords(SEED_WORDS)
    setHighlightPath('')
    setMessage('Reset to original 5 words.')
  }

  // Build trie from current word list to render a tree view
  const trie = new Trie()
  for (const { word, freq } of words) trie.insert(word, freq)

  // Render trie as nested structure (max-depth 12 for readability)
  function renderNode(node, prefix, depth) {
    if (depth > 12) return null
    return Object.entries(node.children).map(([c, child]) => {
      const fullPath = prefix + c
      const isHighlighted = highlightPath && highlightPath.startsWith(fullPath)
      const isOnHighlightPath = highlightPath && fullPath === highlightPath.slice(0, fullPath.length)
      return (
        <div key={fullPath} style={{ marginLeft: depth === 0 ? 0 : 18, marginTop: 2 }}>
          <span style={{
            fontFamily: 'IBM Plex Mono',
            fontSize: 13,
            background: isHighlighted || isOnHighlightPath ? '#FFF8E1' : 'transparent',
            borderRadius: 4,
            padding: '1px 5px',
            border: child.isEnd ? '1.5px solid var(--blue)' : '1px solid transparent',
            color: child.isEnd ? 'var(--blue)' : 'var(--ink)',
            fontWeight: child.isEnd ? 700 : 400,
          }}>
            {c}
            {child.isEnd && (
              <span style={{ fontSize: 10, color: '#888', fontWeight: 400, marginLeft: 4 }}>
                ★{child.frequency.toLocaleString()}
              </span>
            )}
          </span>
          {renderNode(child, fullPath, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Trie builder — insert words and watch the tree grow</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
        <input
          className="txt"
          placeholder="word (e.g. java)"
          value={inputWord}
          onChange={e => setInputWord(e.target.value)}
          style={{ width: 140 }}
          onKeyDown={e => e.key === 'Enter' && handleInsert()}
        />
        <input
          className="txt"
          placeholder="frequency (e.g. 3000)"
          value={inputFreq}
          onChange={e => setInputFreq(e.target.value)}
          style={{ width: 160 }}
          onKeyDown={e => e.key === 'Enter' && handleInsert()}
        />
        <button className="act" onClick={handleInsert}>Insert</button>
        <button className="act ghost" onClick={handleReset}>Reset</button>
      </div>
      <div className="statbar" style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 12.5 }}>{message}</span>
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 200 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#888', marginBottom: 6 }}>TRIE TREE (blue border = word endpoint ★freq)</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, color: '#7c8aa5', marginBottom: 2 }}>root</div>
          {renderNode(trie.root, '', 0)}
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#888', marginBottom: 6 }}>WORDS IN TRIE</div>
          {words.sort((a, b) => b.freq - a.freq).map(({ word, freq }) => (
            <div key={word} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 12.5, marginBottom: 4,
              color: highlightPath === word ? 'var(--blue)' : 'var(--ink)',
              fontWeight: highlightPath === word ? 700 : 400,
            }}>
              {word} <span style={{ color: '#888' }}>({freq.toLocaleString()})</span>
            </div>
          ))}
        </div>
      </div>
      <Good style={{ marginTop: 12 }}>
        Notice: "java", "javascript", and "jar" all share the path j → a. The Trie stores this shared prefix ONCE — not three times. Insert "javascript2" and watch how it branches off "javascript". Blue-bordered nodes mark where a complete word ends.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 2 — Live Autocomplete
   ============================================================ */
function AutocompleteDemo() {
  const [query, setQuery] = useState('')
  const trieRef = useRef(null)
  if (!trieRef.current) trieRef.current = buildSeedTrie()
  const trie = trieRef.current

  function countDfsSteps(prefix) {
    // Simulate counting: walk prefix + count all nodes visited in DFS
    const node = trie._walkTo(prefix)
    if (!node) return 0
    let count = 0
    function dfsCount(n) {
      count++
      for (const child of Object.values(n.children)) dfsCount(child)
    }
    dfsCount(node)
    return count
  }

  const suggestions = query ? trie.suggest(query, 3) : []
  const dfsSteps = query ? countDfsSteps(query) : 0

  return (
    <div className="panel">
      <div className="ptitle">Live demo · real-time autocomplete — type a prefix and watch the Trie respond</div>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
        Try typing: <strong>j</strong>, then <strong>ja</strong>, then <strong>jav</strong>, then <strong>p</strong>, then <strong>py</strong>.
        Watch how DFS steps shrink as the prefix gets longer (fewer words match).
      </p>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          className="txt"
          placeholder="start typing a search…"
          value={query}
          onChange={e => setQuery(e.target.value.toLowerCase())}
          style={{ width: '100%', fontSize: 16, padding: '10px 14px', boxSizing: 'border-box' }}
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#fff', border: '1.5px solid var(--line)',
            borderTop: 'none', borderRadius: '0 0 8px 8px', zIndex: 10,
          }}>
            {suggestions.map(({ word, freq }, i) => (
              <div key={word} style={{
                padding: '8px 14px', fontFamily: 'IBM Plex Mono', fontSize: 13,
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--line)' : 'none',
                display: 'flex', justifyContent: 'space-between',
                cursor: 'pointer',
                background: i === 0 ? '#F7F9FF' : '#fff',
              }}
                onClick={() => setQuery(word)}
              >
                <span>
                  <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{word.slice(0, query.length)}</span>
                  <span style={{ color: 'var(--ink)' }}>{word.slice(query.length)}</span>
                </span>
                <span style={{ color: '#888', fontSize: 11 }}>freq: {freq.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {query && (
        <div className="statbar" style={{ display: 'block', marginTop: suggestions.length > 0 ? 48 : 0 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
            Prefix: <strong>"{query}"</strong> · Suggestions found: <strong>{suggestions.length}</strong> ·
            DFS nodes visited: <strong>{dfsSteps}</strong>
            {dfsSteps > 0 && (
              <span style={{ color: '#888' }}>
                {' '}(the shorter the prefix, the more the DFS explores)
              </span>
            )}
          </span>
        </div>
      )}
      {!query && (
        <div className="statbar" style={{ display: 'block' }}>
          <span style={{ fontSize: 12.5, color: '#888' }}>Start typing to see suggestions appear instantly from the Trie…</span>
        </div>
      )}
      <Good style={{ marginTop: 10 }}>
        Typing "j" reaches the "j" node — the DFS fans out to explore all children. Typing "jav" reaches a deeper node with fewer descendants, so DFS visits fewer nodes. The Trie always walks exactly (prefix length) nodes before starting DFS — no scanning unrelated words.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 3 — Approach Comparison
   ============================================================ */

// Simulate 50 words with varied frequencies for the comparison
const SIM_WORDS = (() => {
  const prefixes = ['app', 'apple', 'application', 'apply', 'apt',
    'amazon', 'amazing', 'amber', 'amp',
    'google', 'golang', 'good', 'graph',
    'github', 'git', 'gitignore',
    'java', 'javascript', 'jar', 'jakarta',
    'python', 'pytorch', 'pypi',
    'react', 'redux', 'rest', 'redis',
    'node', 'nodejs', 'npm',
    'sql', 'sqlite', 'spring',
    'docker', 'dotnet',
    'linux', 'lru', 'lld',
    'machine', 'maven',
    'kafka', 'kotlin',
    'typescript', 'tree', 'trie',
    'binary', 'bloom', 'builder',
    'cache', 'class']
  const result = []
  for (let i = 0; i < prefixes.length; i++) {
    result.push({ word: prefixes[i], freq: Math.floor(100 + (prefixes.length - i) * 180) })
  }
  return result
})()

const APPROACH_TIMINGS = {
  sort: { label: 'Sort all matches', complexity: 'O(M log M)', base: 45 },
  heap: { label: 'Min-heap size K', complexity: 'O(M log K)', base: 12 },
  stored: { label: 'Stored top-K at node', complexity: 'O(1)', base: 0.1 },
}

function ApproachCompareDemo() {
  const [prefix, setPrefix] = useState('a')
  const [k, setK] = useState(5)
  const trieRef = useRef(null)
  if (!trieRef.current) {
    trieRef.current = new Trie()
    for (const { word, freq } of SIM_WORDS) trieRef.current.insert(word, freq)
  }
  const trie = trieRef.current

  const suggestions = trie.suggest(prefix, k)
  // Count all matching words for the prefix (for timing simulation)
  const matchNode = trie._walkTo(prefix)
  let allMatches = []
  if (matchNode) trie._dfs(matchNode, prefix, allMatches)
  const M = allMatches.length

  function simulatedMs(approach) {
    if (approach === 'stored') return '~0.1ms'
    const base = approach === 'sort' ? M * Math.log2(Math.max(M, 2)) * 0.5 : M * Math.log2(Math.max(k, 2)) * 1.2
    return `~${Math.max(1, Math.round(base))}ms`
  }

  const colors = { sort: '#FF6B6B', heap: '#FFA94D', stored: '#40C057' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · approach comparison — same results, very different cost</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>Prefix:</span>
          <input
            className="txt"
            value={prefix}
            onChange={e => setPrefix(e.target.value.toLowerCase())}
            style={{ width: 100 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>K (top-N):</span>
          <input
            type="range" min={3} max={10} value={k}
            onChange={e => setK(Number(e.target.value))}
            style={{ width: 100 }}
          />
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, fontWeight: 700 }}>{k}</span>
        </div>
      </div>
      <div className="statbar" style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
          Prefix <strong>"{prefix}"</strong> matches <strong>{M}</strong> words in this {SIM_WORDS.length}-word trie.
          {M === 0 && ' (no matches — try "a", "g", "j", "p", or "r")'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.entries(APPROACH_TIMINGS).map(([key, info]) => (
          <div key={key} style={{
            flex: 1, minWidth: 160,
            border: `2px solid ${colors[key]}`,
            borderRadius: 10, padding: '12px 14px',
            background: '#fff',
          }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{info.label}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#555', marginBottom: 6 }}>{info.complexity}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 18, fontWeight: 700, color: colors[key], marginBottom: 8 }}>
              {M === 0 ? '—' : simulatedMs(key)}
            </div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>Top-{k} results:</div>
            {suggestions.length === 0
              ? <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#aaa' }}>no matches</div>
              : suggestions.slice(0, k).map(({ word, freq }) => (
                <div key={word} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--ink)', marginBottom: 2 }}>
                  {word} <span style={{ color: '#888' }}>({freq.toLocaleString()})</span>
                </div>
              ))
            }
          </div>
        ))}
      </div>
      <Note>
        All three approaches return the <strong>same top-K results</strong> — the difference is only in cost.
        "Sort" scans all M matches and sorts them. "Heap size K" keeps only K items in memory during the scan — faster when M is large.
        "Stored at node" pre-computes the answer on insert, so reads are instant — but each insert does more work to update every ancestor node.
        Drag K from 3 to 10: the heap approach barely changes; the stored approach stays O(1) regardless of K.
      </Note>
    </div>
  )
}

/* ============================================================
   Quiz data
   ============================================================ */
const QUESTIONS = [
  {
    q: 'What is the time complexity of a Trie prefix lookup (walking from root to the end of the prefix)?',
    o: ['O(N) where N is total words in the Trie', 'O(L) where L is the length of the prefix — you walk exactly L nodes', 'O(log N)', 'O(L × N)'],
    a: 1,
    e: 'The Trie\'s key property: prefix lookup walks exactly one node per character of the prefix, regardless of how many words are stored. That is O(L) where L = len(prefix) — not O(N). This is why Trie beats scanning a sorted list for autocomplete.',
    w: { 0: 'O(N) is the naive array-scan cost that Trie avoids — the whole point of the structure.', 2: 'O(log N) is a binary search on a sorted array; Trie doesn\'t sort by whole words.', 3: 'O(L × N) would mean scanning all words per character — that\'s worse than O(N), not a Trie property.' },
    r: { id: 's3', label: 'Section 3 — Trie structure' },
  },
  {
    q: 'You have 500 matching words after a DFS and need top-5. Which approach has the best asymptotic complexity?',
    o: ['Sort all 500 and take the first 5: O(500 log 500)', 'Min-heap of size 5: O(500 log 5)', 'Stored top-5 at each Trie node: O(1) lookup', 'Binary search the 500 results'],
    a: 2,
    e: 'Storing top-K at each node on insert means suggest() just returns node.topK — O(1), regardless of how many words are below the prefix node. The DFS is completely skipped at read time. The trade-off is that inserts must update every ancestor node (O(L × K) per insert).',
    w: { 0: 'Sorting is O(M log M) — acceptable but slowest of the three since you sort all matches.', 1: 'Min-heap is O(M log K) — better than sorting, but still O(M) work per query.', 3: 'You can only binary search a sorted structure — DFS results are not sorted by default, and this is not a standard approach.' },
    r: { id: 's6', label: 'Section 6 — top-K selection approaches' },
  },
  {
    q: 'What is the main trade-off of storing top-K at every Trie node vs running DFS on every query?',
    o: ['Stored top-K uses less memory', 'Stored top-K makes reads O(1) but makes writes more expensive — each insert updates top-K lists all the way up the path from root to the inserted word', 'DFS is always faster than stored top-K', 'Stored top-K is only useful when K = 1'],
    a: 1,
    e: 'Read-optimized: stored top-K gives O(1) reads but O(L × K) writes (update K-sized list at each of the L nodes on the path). This is the right trade for autocomplete systems where reads (every keystroke) vastly outnumber writes (new word inserted). When writes are frequent, DFS or heap on query is cheaper.',
    w: { 0: 'Stored top-K uses MORE memory — every node holds a list of K words. DFS uses no extra node memory.', 2: 'DFS is O(M) per query where M = number of matching words; stored top-K is O(1). DFS is slower for large M.', 3: 'Stored top-K is useful for any K — K just controls list size and insert cost.' },
    r: { id: 's6', label: 'Section 6 — stored top-K trade-off' },
  },
  {
    q: 'Google cannot fit its entire search Trie on one machine. What is the standard sharding approach?',
    o: ['Shard by user ID', 'Shard by prefix — e.g. "a*" goes to shard A, "b*" goes to shard B — so a query for "jav" hits exactly one shard', 'Randomly distribute all Trie nodes', 'Replicate the full Trie to every machine'],
    a: 1,
    e: 'Prefix sharding partitions the Trie by the leading characters. A query for "jav" is routed to the "j" shard (or "ja" shard for finer granularity) — it never touches other shards. This keeps the routing logic O(1) and means each shard holds only its slice of the keyspace.',
    w: { 0: 'Sharding by user ID is for personalization data, not the global frequency Trie — user identity is irrelevant to prefix routing.', 2: 'Random distribution means a single prefix query must ask ALL shards and merge results — expensive and complex.', 3: 'Full replication to every machine works for small tries but is not scalable for the global web-search Trie.' },
    r: { id: 's9', label: 'Section 9 — scale considerations' },
  },
  {
    q: 'A user searches "java tutorial" and clicks the second suggestion. How should the system update frequencies?',
    o: ['Rebuild the entire Trie from scratch', 'Directly increment frequency at the leaf node and update top-K lists along the path from root to that leaf — O(L × K)', 'Store the click in a log and rebuild the Trie offline every hour', 'Never update frequencies — they are fixed at build time'],
    a: 2,
    e: 'For scale, production autocomplete systems (like Google) do NOT update the live Trie on every click. They collect raw click/search logs, aggregate frequencies in a batch job (MapReduce, Spark, etc.), then rebuild or patch the Trie periodically (hourly or daily). Online per-click updates would be a write bottleneck at web scale. The correct answer here describes the offline rebuild approach.',
    w: { 0: 'Rebuilding from scratch per click is O(total words × avg length) — catastrophic at scale.', 1: 'This describes an in-memory online update — correct for a small system, but production systems prefer offline batch to avoid live-write bottlenecks.', 3: 'Fixed frequencies would mean popular new searches (like a breaking news term) never surface — unusable.' },
    r: { id: 's9', label: 'Section 9 — offline aggregation' },
  },
  {
    q: 'How does personalization fit on top of a global Trie result?',
    o: ['The Trie itself stores per-user frequencies — separate Trie per user', 'The Trie returns global top-K; a post-processing step re-ranks by the user\'s personal history — this is the Decorator pattern', 'Personalization requires a completely different data structure, not a Trie', 'You add a "user" field to each TrieNode'],
    a: 1,
    e: 'The global Trie gives a fast top-K by global frequency. A lightweight personalization layer then re-scores those K results using the user\'s search history or preferences (rank = global_freq × personal_weight). This keeps the Trie simple and shared, and adds user-specific behavior without changing the Trie at all — classic Decorator / post-processing wrapping a core engine.',
    w: { 0: 'A separate Trie per user is space-prohibitive for millions of users and removes the shared-prefix benefit entirely.', 2: 'Trie is exactly the right structure; personalization is a re-ranking layer on top, not a replacement.', 3: 'Adding a user field to every TrieNode conflates the shared prefix structure with per-user data — the two concerns should be separated.' },
    r: { id: 's9', label: 'Section 9 — personalization layer' },
  },
  {
    q: 'What is a Radix Tree (Compressed Trie / Patricia Trie), and when does it help?',
    o: ['A Trie where every node has exactly 26 children (one per alphabet letter)', 'A Trie where single-child chains are collapsed into one node storing a string segment instead of one character — reduces node count and memory for sparse tries', 'A Trie sorted by frequency instead of alphabetically', 'A Trie that only stores words of the same length'],
    a: 1,
    e: 'In a standard Trie, "javascript" stored under "j" creates 9 single-child nodes (a, v, a, s, c, r, i, p, t). A Radix Tree collapses that chain into one node holding the string "avascript" — dramatically fewer nodes for sparse key spaces where many paths have no branching. It helps when memory is tight or the key space has long common prefixes with rare branching.',
    w: { 0: 'A fixed-array Trie with 26 children per node is an optimization for ASCII space — it\'s not a Radix Tree (which is about collapsing chains).', 2: 'Tries are always indexed by character, not frequency — frequency is metadata at end nodes, not the tree structure.', 3: 'Word length has nothing to do with Radix Tree structure.' },
    r: { id: 's10', label: 'Section 10 — Compressed Trie / Radix Tree' },
  },
  {
    q: 'For an autocomplete system, which data structure should you use to select top-5 out of 200 DFS-collected matches?',
    o: ['A max-heap of size 200', 'A min-heap of size 5 — as you scan the 200 matches, if a word\'s frequency exceeds the heap\'s minimum, swap it in; the heap always holds the current top-5', 'Sort the 200 words alphabetically and take the first 5', 'A stack'],
    a: 1,
    e: 'A min-heap of size K lets you process M items in O(M log K) — far better than O(M log M) for sorting everything when K << M. The min at the top tells you the "weakest" current top-K member; if a new word beats it, evict and insert. At the end the heap contains exactly the top-K. This is the classic "top-K from a stream" pattern.',
    w: { 0: 'A max-heap of size M (all 200 words) costs O(M log M) to build and doesn\'t save over sorting.', 2: 'Alphabetical sort has nothing to do with frequency ranking — you want the highest-frequency words, not the lexicographically first.', 3: 'A stack has no ordering property — it does not help with top-K selection.' },
    r: { id: 's6', label: 'Section 6 — top-K with min-heap' },
  },
]

/* ============================================================
   The page
   ============================================================ */
export default function Day82() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 82</div>
        <h1>Search Autocomplete:<br />Trie + Top-K</h1>
        <p>
          Every character you type in a search box triggers a system that returns top suggestions in
          milliseconds. The secret is the Trie — a tree where every path spells a word. Build it from
          scratch, then optimize it for scale.
        </p>
        <div className="chips">
          {['Trie', 'Prefix Tree', 'Top-K', 'Min-Heap', 'DFS', 'Radix Tree', 'Personalization', 'Sharding'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 — analogy + problem */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The phone-book analogy — and the problem</h2>
        <p>
          Imagine a phone book sorted by name. To find all people whose last name starts with "Sm",
          you flip to "S", then jump to "Sm". You skip everything under "A" or "T" — they cannot
          possibly match. You only read entries that share the prefix "Sm".
        </p>
        <p>
          The <strong>Trie</strong> (also called a prefix tree) is exactly this idea, generalized
          to any string. Every path from the root spells a prefix. Every node at depth N represents
          "all words that start with this N-character sequence." Finding all words with a given
          prefix means: walk the path for that prefix, then collect every word below.
        </p>
        <Code html={`  THE AUTOCOMPLETE PROBLEM

  Input:  a prefix string (typed so far) e.g. "jav"
  Output: the top-K completions by search frequency
          e.g. ["javascript (8000)", "java (5000)"]

  CONSTRAINT: must respond in < 100ms on every keystroke
  (user types ~4 chars/sec — that is ~4 queries per second per user,
   times millions of users = the latency bar is tight)

  THE QUESTION THIS FORCES: can we find top-K matches
  without scanning every word in the dictionary?`} />
        <Note>
          <strong>Why top-K and not all matches?</strong> A prefix like "a" could match millions
          of words. Returning all of them is useless to the user and slow on the network. The
          system always returns a fixed small K (usually 5–10). Deciding WHICH K to return is the
          interesting algorithmic problem.
        </Note>
      </section>

      {/* S2 — naive approaches */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Why naive approaches fail</h2>
        <p>
          Before building the Trie, understand what you are replacing and why it breaks at scale.
        </p>
        <Code html={`  APPROACH 1: SCAN AN ARRAY OF ALL SEARCHES
  ────────────────────────────────────────────────────────
  String[] searches = {"java", "javascript", "python", ...}; // billions of entries

  for (String s : searches) {
      if (s.startsWith(prefix)) results.add(s); // O(N) scan
  }
  // N = billions → even at 1 ns per check = several seconds. ✗

  ──────────────────────────────────────────────────────────
  APPROACH 2: SQL LIKE QUERY
  ──────────────────────────────────────────────────────────
  SELECT word, freq FROM searches WHERE word LIKE 'jav%'
  ORDER BY freq DESC LIMIT 5;

  // A B-tree index on "word" can use LIKE 'jav%' as a range scan,
  // but still scans all rows starting with "jav" before filtering.
  // For common prefixes ("a%") this is millions of rows. ✗
  // Also: disk I/O makes this orders of magnitude slower than in-memory.

  ──────────────────────────────────────────────────────────
  WHAT WE NEED: jump directly to the prefix node → O(prefix length)
  then only look at words BELOW that node → skip 99% of the dictionary`} />
        <Warn>
          The SQL approach also has a subtlety: a database index on <C>word</C> IS a B-tree,
          which handles range queries like "starts with". For small datasets this is fine. At
          Google-scale (100 billion searches/day), even a B-tree scan of all "a" prefixes would
          be too slow. The Trie pins the search to exactly the matching subtree.
        </Warn>
      </section>

      {/* S3 — Trie structure */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The Trie: nodes, children map, isEnd, frequency</h2>
        <p>
          A Trie is a tree. The root is empty. Each edge is labeled with a character. Each node
          represents "the prefix formed by the path from root to me." A node has a flag
          <C> isEnd = true</C> if a complete word ends there, and a <C>frequency</C> field
          storing how often that word was searched.
        </p>
        <Code html={`  Inserting: "java" (5000), "javascript" (8000), "jar" (200)

         [root]
            │
           [j]
            │
           [a]           ← prefix "ja"
          /   \\
        [v]   [r] ✦200  ← "jar" ends here (isEnd=true, freq=200)
         │
        [a] ✦5000        ← "java" ends here (isEnd=true, freq=5000)
         │
        [s]
         │
        [c]
         │
        [r]
         │
        [i]
         │
        [p]
         │
        [t] ✦8000        ← "javascript" ends here (freq=8000)

  KEY INSIGHT:
  "java" and "javascript" share the path j→a→v→a.
  Those four nodes are stored ONCE, not duplicated.
  For a dictionary of millions of words with common prefixes,
  this shared storage is a massive memory win.`} />
        <Code html={`<span class="kw">class</span> TrieNode {
    Map&lt;Character, TrieNode&gt; children = <span class="kw">new</span> HashMap&lt;&gt;(); <span class="cm">// one child per character</span>
    <span class="kw">boolean</span> isEnd = <span class="kw">false</span>;       <span class="cm">// true if a complete word ends here</span>
    <span class="kw">int</span> frequency = <span class="num">0</span>;            <span class="cm">// how often this word was searched</span>
    <span class="cm">// (non-end nodes have frequency 0 — only end nodes carry a meaningful count)</span>
}

<span class="kw">class</span> Trie {
    TrieNode root = <span class="kw">new</span> TrieNode(); <span class="cm">// root represents the empty prefix ""</span>

    <span class="kw">void</span> insert(String word, <span class="kw">int</span> freq) {
        TrieNode node = root;
        <span class="kw">for</span> (<span class="kw">char</span> c : word.toCharArray()) {    <span class="cm">// walk one node per character</span>
            node.children.putIfAbsent(c, <span class="kw">new</span> TrieNode()); <span class="cm">// create node if missing</span>
            node = node.children.get(c);               <span class="cm">// descend into child</span>
        }
        node.isEnd = <span class="kw">true</span>;                <span class="cm">// mark the final node as a word endpoint</span>
        node.frequency = freq;              <span class="cm">// store search frequency at the endpoint</span>
    }
}`} />
        <Good>
          <strong>Insert complexity:</strong> O(L) where L = word length. Each character creates
          or visits exactly one node. A Trie with N words of average length L uses O(N × L) nodes
          in the worst case (no shared prefixes), but far fewer in practice because real words
          share prefixes heavily.
        </Good>
      </section>

      {/* S4 — Interactive: Trie Builder */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: live Trie builder</h2>
        <p>
          Insert words and watch the Trie grow. Notice how shared prefixes (like "java" and
          "javascript" both under j→a→v→a) stay merged in the tree. The blue-bordered nodes
          are word endpoints with their frequency.
        </p>
        <TrieBuilderDemo />
      </section>

      {/* S5 — prefix search and DFS */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Prefix search: walk to the node, then DFS collect</h2>
        <p>
          Finding all words that start with a prefix is two steps. First, walk the Trie
          following the prefix characters — this reaches the "prefix node." Second, do a DFS
          (depth-first search) from that node to collect every endpoint below it.
        </p>
        <Code html={`List&lt;String&gt; suggest(String prefix, <span class="kw">int</span> k) {
    TrieNode node = root;
    <span class="kw">for</span> (<span class="kw">char</span> c : prefix.toCharArray()) {         <span class="cm">// step 1: walk to the prefix node</span>
        <span class="kw">if</span> (!node.children.containsKey(c))
            <span class="kw">return</span> Collections.emptyList();          <span class="cm">// prefix not found → no suggestions</span>
        node = node.children.get(c);
    }
    <span class="cm">// step 2: DFS from the prefix node to collect all complete words below</span>
    List&lt;WordFreq&gt; results = <span class="kw">new</span> ArrayList&lt;&gt;();
    dfs(node, <span class="kw">new</span> StringBuilder(prefix), results);
    <span class="cm">// step 3: sort by frequency and return top-k</span>
    results.sort((a, b) -&gt; b.freq - a.freq);          <span class="cm">// highest frequency first</span>
    <span class="kw">return</span> results.stream().limit(k)
                   .map(wf -&gt; wf.word)
                   .collect(Collectors.toList());
}

<span class="kw">private void</span> dfs(TrieNode node, StringBuilder current, List&lt;WordFreq&gt; results) {
    <span class="kw">if</span> (node.isEnd)                                    <span class="cm">// found a complete word</span>
        results.add(<span class="kw">new</span> WordFreq(current.toString(), node.frequency));
    <span class="kw">for</span> (Map.Entry&lt;Character, TrieNode&gt; e : node.children.entrySet()) {
        current.append(e.getKey());                    <span class="cm">// go deeper</span>
        dfs(e.getValue(), current, results);
        current.deleteCharAt(current.length() - <span class="num">1</span>);   <span class="cm">// backtrack (restore the builder)</span>
    }
}`} />
        <Note>
          <strong>Complexity of this approach:</strong> Walk to prefix = O(L). DFS from prefix
          node = O(M) where M = number of words that share this prefix. Sort M results = O(M log M).
          For a common prefix like "a", M could be huge — which is why the sort-all approach is
          replaced by a heap or stored-at-node in production.
        </Note>
        <Reveal summary="Why DFS and not BFS for collecting suggestions?">
          <p>
            Both work correctly. DFS uses the call stack (O(depth) space). BFS uses a queue
            (O(width) space — potentially very wide at shallow levels). DFS is simpler to implement
            recursively and typically uses less memory for deep tries. BFS would help if you wanted
            to find the <em>shortest</em> completions first (breadth-first order), but autocomplete
            ranks by frequency, not word length — so DFS is the standard choice.
          </p>
        </Reveal>
      </section>

      {/* S6 — Top-K approaches */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Top-K selection: sort vs min-heap vs stored at node</h2>
        <p>
          Once you have M matching words, you need the top-K by frequency. Three approaches,
          each with different read/write trade-offs:
        </p>

        <h3 style={{ marginTop: 16, marginBottom: 8, fontSize: 16 }}>Approach A — Sort all matches: O(M log M)</h3>
        <Code html={`<span class="cm">// simple but slowest if M is large</span>
results.sort((a, b) -&gt; b.freq - a.freq);    <span class="cm">// sort all M results by frequency</span>
<span class="kw">return</span> results.subList(<span class="num">0</span>, Math.min(k, results.size())); <span class="cm">// take first k</span>`} />

        <h3 style={{ marginTop: 16, marginBottom: 8, fontSize: 16 }}>Approach B — Min-heap of size K: O(M log K)</h3>
        <Code html={`<span class="cm">// faster when K << M (e.g. K=5, M=10000)</span>
<span class="cm">// min-heap: smallest frequency is at the top (easy to evict the weakest)</span>
PriorityQueue&lt;WordFreq&gt; minHeap =
    <span class="kw">new</span> PriorityQueue&lt;&gt;(Comparator.comparingInt(wf -&gt; wf.freq));

<span class="kw">for</span> (WordFreq wf : allMatches) {           <span class="cm">// scan all M matches once</span>
    minHeap.offer(wf);                     <span class="cm">// add candidate</span>
    <span class="kw">if</span> (minHeap.size() &gt; k)               <span class="cm">// heap exceeds K</span>
        minHeap.poll();                    <span class="cm">// evict the lowest-frequency (at top of min-heap)</span>
}
<span class="cm">// heap now holds exactly the top-K words by frequency</span>
<span class="cm">// cost: O(M log K) — each of the M words does one heap operation of O(log K)</span>`} />

        <h3 style={{ marginTop: 16, marginBottom: 8, fontSize: 16 }}>Approach C — Store top-K at each node: O(1) read, O(L × K) write</h3>
        <Code html={`<span class="kw">class</span> TrieNodeFast {
    Map&lt;Character, TrieNodeFast&gt; children = <span class="kw">new</span> HashMap&lt;&gt;();
    List&lt;String&gt; topK = <span class="kw">new</span> ArrayList&lt;&gt;(); <span class="cm">// pre-sorted list, best first, len ≤ K</span>
}

<span class="cm">// On INSERT of a word with frequency f:</span>
<span class="cm">// Walk from root to the word's leaf, updating topK at EVERY node on the path.</span>
<span class="kw">void</span> insert(String word, <span class="kw">int</span> freq) {
    TrieNodeFast node = root;
    <span class="kw">for</span> (<span class="kw">char</span> c : word.toCharArray()) {
        node.children.putIfAbsent(c, <span class="kw">new</span> TrieNodeFast());
        node = node.children.get(c);
        updateTopK(node, word, freq, k);   <span class="cm">// ← update at EVERY ancestor node</span>
    }
}

<span class="kw">void</span> updateTopK(TrieNodeFast node, String word, <span class="kw">int</span> freq, <span class="kw">int</span> k) {
    node.topK.remove(word);                <span class="cm">// remove old entry if present</span>
    node.topK.add(word);                   <span class="cm">// add new entry</span>
    node.topK.sort((a, b) -&gt; freqOf(b) - freqOf(a)); <span class="cm">// keep sorted by freq</span>
    <span class="kw">if</span> (node.topK.size() &gt; k)
        node.topK.remove(node.topK.size() - <span class="num">1</span>); <span class="cm">// drop lowest if over K</span>
}

<span class="cm">// On SUGGEST(prefix): walk L nodes → return node.topK directly</span>
List&lt;String&gt; suggest(String prefix) {
    TrieNodeFast node = walkTo(prefix);    <span class="cm">// O(L)</span>
    <span class="kw">return</span> node == <span class="kw">null</span> ? emptyList() : node.topK; <span class="cm">// O(1) — already computed</span>
}`} />

        <table className="matrix" style={{ marginTop: 16 }}>
          <thead>
            <tr><th>Approach</th><th>Read (suggest)</th><th>Write (insert)</th><th>Extra memory</th><th>Best when</th></tr>
          </thead>
          <tbody>
            <tr><td>Sort all matches</td><td>O(M log M)</td><td>O(L)</td><td>none</td><td>small dataset, simple code</td></tr>
            <tr><td>Min-heap K</td><td>O(M log K)</td><td>O(L)</td><td>O(K) heap</td><td>M large, K small</td></tr>
            <tr className="yes"><td>Stored top-K</td><td><strong>O(1)</strong></td><td>O(L × K)</td><td>O(N × K)</td><td>reads >> writes (production)</td></tr>
          </tbody>
        </table>
        <Good>
          <strong>Production autocomplete uses stored top-K.</strong> A search engine receives
          millions of read queries (keystrokes) per second but inserts new words much less
          frequently (batch updates, not real-time). Paying extra on write to get O(1) reads is
          the right trade.
        </Good>
      </section>

      {/* S7 — Interactive: Autocomplete */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>Play: live autocomplete</h2>
        <p>
          A real search box backed by the Trie you saw in Demo 1. Type a prefix and watch
          suggestions appear instantly, ranked by frequency. The DFS step counter shows how many
          nodes the algorithm visits — notice it drops as you type more characters.
        </p>
        <AutocompleteDemo />
      </section>

      {/* S8 — Interactive: Approach comparison */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>Play: approach comparison</h2>
        <p>
          Same prefix, same results — three different approaches with very different costs.
          Change the prefix to find more or fewer matches, and drag K to see how the heap
          approach scales while stored top-K stays flat.
        </p>
        <ApproachCompareDemo />
      </section>

      {/* S9 — Scale */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Designing for scale: sharding, offline rebuild, personalization</h2>

        <h3 style={{ marginBottom: 8, fontSize: 16 }}>Prefix sharding</h3>
        <p>
          The full Trie for all web searches does not fit on one machine. The standard approach
          is <strong>prefix sharding</strong>: route queries by the first character (or first two
          characters) of the prefix. A query for "jav" always hits the "j" shard; it never
          touches the "a" or "p" shards.
        </p>
        <Code html={`  ROUTING TABLE (simplified)
  "a*" → Shard A
  "b*" → Shard B
  ...
  "j*" → Shard J    ← query "jav" goes here
  ...
  "z*" → Shard Z

  If one letter's shard is too large (e.g. "s" for "search", "site", "software"...),
  split further: "sa*"–"sm*" → Shard S1,  "sn*"–"sz*" → Shard S2.`} />

        <h3 style={{ marginTop: 16, marginBottom: 8, fontSize: 16 }}>Offline rebuild (do NOT update live)</h3>
        <p>
          At web scale, updating the Trie on every search click would be a write bottleneck.
          Instead:
        </p>
        <ol>
          <li>Collect raw search logs continuously (e.g. every user search click).</li>
          <li>Aggregate in a batch job (Spark / Hadoop) to compute word frequencies over the last 24h.</li>
          <li>Rebuild the Trie from the aggregated data (hourly or nightly).</li>
          <li>Push the new Trie to read replicas. Swap atomically — queries keep hitting the old Trie until the new one is ready.</li>
        </ol>
        <Note>
          This means the Trie is always slightly stale (up to ~1 hour). That is acceptable —
          autocomplete does not need real-time accuracy. New trending terms appear in the next
          rebuild cycle. This is the same offline-aggregation pattern used in recommendation
          engines.
        </Note>

        <h3 style={{ marginTop: 16, marginBottom: 8, fontSize: 16 }}>Personalization — the Decorator layer</h3>
        <p>
          The global Trie returns the same top-K for every user. Personalization sits on top as
          a post-processing step (Decorator pattern — Day 27). It does not change the Trie:
        </p>
        <Code html={`  ARCHITECTURE:
  User types "jav"
       ↓
  [Global Trie] → top-10 by global frequency
  ["javascript"(8000), "java"(5000), "jakarta"(900), ...]
       ↓
  [Personalization Layer] re-ranks by:
      rank = global_freq × personalization_weight(user, word)
      (personalization_weight = 2.0 if user searched this before,
       1.5 if it matches user's language preference, 1.0 otherwise)
       ↓
  Returns top-5 re-ranked suggestions to the user`} />
        <Good>
          <strong>Clean separation:</strong> the Trie stays simple and shared (one per shard for
          all users). Personalization is a thin, user-specific layer that reads the Trie output
          and re-scores it. Adding a new re-ranking signal (like location or device type) does
          not require touching the Trie at all.
        </Good>
      </section>

      {/* S10 — Radix Tree + Cheat Sheet */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Compressed Trie (Radix Tree) + cheat sheet</h2>

        <h3 style={{ marginBottom: 8, fontSize: 16 }}>Space problem in a standard Trie</h3>
        <p>
          If a word like "javascript" has no branching after "j" (say "jar" is not in the Trie),
          then j → a → v → a → s → c → r → i → p → t is a chain of 10 nodes each with one child.
          That is wasteful.
        </p>
        <Code html={`  STANDARD TRIE (sparse — no branching)
  root → [j] → [a] → [v] → [a] → [s] → [c] → [r] → [i] → [p] → [t]✦8000
  10 nodes for one word with no shared prefix.

  RADIX TREE (compressed)
  root → [j] → [avascript]✦8000
  2 nodes. The single-child chain collapsed into one edge label.

  ON INSERT of "jar":
  root → [j] → [a] → [r]✦200       ← "a" becomes a branching node
                    → [vascript]✦8000  ← "avascript" trimmed to "vascript"

  Radix Tree is standard in production (e.g. Go's net/http router uses it).
  For autocomplete, it reduces memory by ~40–60% for typical English word sets.`} />

        <h3 style={{ marginTop: 20, marginBottom: 8, fontSize: 16 }}>Cheat sheet</h3>
        <ul>
          <li><strong>Trie node:</strong> <C>Map&lt;Character, TrieNode&gt; children</C>, <C>boolean isEnd</C>, <C>int frequency</C>.</li>
          <li><strong>Insert:</strong> walk/create one node per character, mark <C>isEnd = true</C> at the last node. O(L).</li>
          <li><strong>Prefix lookup:</strong> walk L nodes (O(L)), then DFS from that node (O(M) where M = matching words).</li>
          <li><strong>Top-K approaches:</strong> sort = O(M log M), min-heap = O(M log K), stored at node = O(1) read / O(L×K) write. Use stored top-K in production (reads >> writes).</li>
          <li><strong>Frequency update at scale:</strong> offline batch aggregation (not live per-click). Rebuild Trie hourly from aggregated logs.</li>
          <li><strong>Sharding:</strong> partition Trie by leading prefix characters. Query for "jav" → j-shard only.</li>
          <li><strong>Personalization:</strong> Decorator layer on top of the global Trie result. Re-ranks by user history / preferences without touching the Trie.</li>
          <li><strong>Radix Tree:</strong> collapses single-child chains into multi-character edge labels. Reduces node count and memory for sparse tries.</li>
          <li><strong>DFS vs BFS:</strong> both work; DFS is standard (simpler, lower stack space for deep tries).</li>
        </ul>
      </section>

      {/* INTERVIEW CORNER */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>The follow-ups they actually ask</h2>
        <p>Answer each in your head before revealing.</p>

        <Reveal summary='Q: "What is a Trie and what problem does it solve better than a sorted array or HashMap?"'>
          <p>
            A Trie (prefix tree) is a tree where every root-to-node path spells a prefix, and
            every root-to-leaf path spells a complete word. It solves <strong>prefix-based
            lookup</strong>: given a prefix, return all words that start with it. A sorted array
            needs O(log N) to binary-search to the prefix, then O(M) to scan matching words
            (plus it gives no fast way to enumerate all completions). A HashMap is O(1) per exact
            key but cannot enumerate "all keys starting with X" without scanning everything.
            The Trie walks exactly L nodes (the prefix length) to reach the prefix node, then
            the DFS only visits the matching subtree — never touching non-matching words.
          </p>
        </Reveal>

        <Reveal summary='Q: "Why would you store top-K at each Trie node instead of running DFS on every query?"'>
          <p>
            DFS on every query costs O(M) where M = words matching the prefix. For a popular
            prefix like "a" this is potentially millions. Storing top-K at each node means the
            suggest() call is O(L) to walk to the prefix node, then O(1) to return the
            pre-computed list — no DFS at all. The trade-off is write cost: every insert must
            update the top-K list at every ancestor node on the path (O(L × K) per insert). For
            autocomplete, reads (one per keystroke, millions of users) vastly outnumber writes
            (vocabulary additions, which are batched), so paying extra on write to get O(1)
            reads is the right engineering choice.
          </p>
        </Reveal>

        <Reveal summary='Q: "How would you find top-5 out of 500 DFS matches? Why not sort?"'>
          <p>
            Use a <strong>min-heap of size K=5</strong>. Scan all 500 results: if a word's
            frequency exceeds the heap's minimum (the top of a min-heap), pop the minimum and
            push the new word. After scanning 500 words, the heap holds exactly the top-5.
            Cost: O(M log K) = O(500 log 5) ≈ O(1150) operations — versus O(M log M) =
            O(500 × 9) = O(4500) for sorting all 500. The gain grows as M grows and K stays
            small. The heap is the classic "top-K from a stream" pattern — also used for
            finding the K largest elements in a data stream without storing everything.
          </p>
        </Reveal>

        <Reveal summary='Q: "How do you handle frequency updates without rebuilding the whole Trie?"'>
          <p>
            For an in-memory Trie: walk from root to the word's leaf node, increment
            <C> node.frequency</C>, then walk back up updating the <C>topK</C> list at each
            ancestor node. This is O(L × K) where L = word length and K = top-K size.
          </p>
          <p>
            For production at scale: do NOT update the live Trie on every click. Aggregate
            clicks in a log (e.g. write each click to Kafka). A batch job (Spark) reads the log
            every hour, re-aggregates all frequencies, and rebuilds the Trie from scratch. The
            new Trie is pushed to read replicas atomically. This avoids write contention on the
            hot live Trie and keeps the system read-optimized.
          </p>
        </Reveal>

        <Reveal summary='Q: "How do you shard a Trie across servers? How does query routing work?"'>
          <p>
            <strong>Prefix sharding:</strong> split the Trie by the leading characters of the
            keyspace. "a*" → Shard A, "b*" → Shard B, ..., "z*" → Shard Z (or finer splits for
            high-traffic letters like "s"). A query for "jav" is routed to Shard J by inspecting
            only the first character — no cross-shard communication. If a single shard is too
            large (all "s" words), further split: "sa"–"sm" → Shard S1, "sn"–"sz" → Shard S2.
            Read replicas within each shard handle horizontal read scaling. The routing layer
            (load balancer or API gateway) maintains a simple prefix→shard map.
          </p>
        </Reveal>

        <Reveal summary='Q: "What is a compressed (radix) Trie and when does it help?"'>
          <p>
            A Radix Tree (also called Patricia Trie or Compressed Trie) collapses single-child
            chains into a single node whose edge label is a multi-character string segment instead
            of one character. Example: "javascript" with no branching becomes root→[j]→[avascript]
            (2 nodes) instead of 10 separate single-character nodes.
          </p>
          <p>
            It helps when the keyspace is <strong>sparse</strong> (many words with no shared
            prefixes, creating long single-child chains). For dense tries (many overlapping
            prefixes like a full English dictionary), standard Tries already share nodes well
            and the compression gain is smaller. The practical impact is memory reduction —
            often 40–60% fewer nodes for typical English word sets. Go's <C>net/http</C> router,
            Nginx's URL matcher, and many IP routing tables use Radix Trees for this reason.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="s11">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz — 8 questions</h2>
        <p>Click an answer. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 82 complete?</strong> Homework: implement a <C>Trie</C> in Java with
        <C> insert(String word, int freq)</C>, <C>search(String word): boolean</C>, and
        <C> startsWith(String prefix): boolean</C>. Then extend it: add a
        <C> topK(String prefix, int k): List&lt;String&gt;</C> method using a min-heap
        (O(M log K)) that returns the K most-frequent completions. Test it with at least
        8 words. Stretch goal: add <C>updateFreq(String word, int newFreq)</C> that
        increments the frequency and propagates the change through the path.
        <br /><br />
        Next: <strong>Day 83 — File Storage System</strong>: designing Dropbox/Google Drive
        at the class-diagram level — files, folders, permissions, sharing, versioning, and
        the chunking strategy that makes large-file sync efficient.
      </div>
    </div>
  )
}
