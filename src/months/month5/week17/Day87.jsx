import { useState, useRef } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Shared constants / helpers
   ============================================================ */
const STOP_WORDS = new Set(['is','are','was','were','be','been','a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','it','its','this','that','these','those'])

function naiveStem(word) {
  // Very simple suffix-stripping stemmer for demo purposes
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3)
  if (word.endsWith('tion') && word.length > 6) return word.slice(0, -4)
  if (word.endsWith('tions') && word.length > 7) return word.slice(0, -5)
  if (word.endsWith('ness') && word.length > 6) return word.slice(0, -4)
  if (word.endsWith('ment') && word.length > 6) return word.slice(0, -4)
  if (word.endsWith('ly') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('er') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('est') && word.length > 5) return word.slice(0, -3)
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('s') && word.length > 3) return word.slice(0, -1)
  return word
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 0 && !STOP_WORDS.has(t))
    .map(naiveStem)
    .filter(t => t.length > 1)
}

function buildIndex(docs) {
  // docs: [{id, text}]
  // returns {index: Map<term, [docId, ...]>, docTokens: Map<docId, string[]>}
  const index = {}           // term -> [docId, ...]
  const docTokens = {}       // docId -> token[]

  for (const { id, text } of docs) {
    const tokens = tokenize(text)
    docTokens[id] = tokens
    for (const token of tokens) {
      if (!index[token]) index[token] = []
      if (!index[token].includes(id)) index[token].push(id)
    }
  }

  // sort postings lists
  for (const term of Object.keys(index)) index[term].sort((a, b) => a - b)

  return { index, docTokens }
}

function calcTfIdf(term, docId, docTokens, index) {
  const tokens = docTokens[docId] || []
  if (tokens.length === 0) return 0
  const termCount = tokens.filter(t => t === term).length
  const tf = termCount / tokens.length
  const totalDocs = Object.keys(docTokens).length
  const docsWithTerm = (index[term] || []).length
  const idf = Math.log((totalDocs + 1) / (docsWithTerm + 1))
  return tf * idf
}

function intersect(lists) {
  if (lists.length === 0) return []
  let result = [...lists[0]]
  for (let i = 1; i < lists.length; i++) {
    const other = lists[i]
    const merged = []
    let a = 0, b = 0
    while (a < result.length && b < other.length) {
      if (result[a] === other[b]) { merged.push(result[a]); a++; b++ }
      else if (result[a] < other[b]) a++
      else b++
    }
    result = merged
    if (result.length === 0) break
  }
  return result
}

/* ============================================================
   Demo 1 — Index Builder
   ============================================================ */
const DEFAULT_DOCS = [
  { id: 1, text: 'Java is a fast and powerful programming language used for building applications' },
  { id: 2, text: 'Python is a readable and simple scripting language popular for data science and machine learning' },
  { id: 3, text: 'Java and Python are both popular programming languages with large communities' },
  { id: 4, text: 'Machine learning and data science use Python libraries for building intelligent applications' },
]

function IndexBuilderDemo() {
  const [docs, setDocs] = useState(DEFAULT_DOCS.map(d => ({ ...d })))
  const [built, setBuilt] = useState(null)    // null = not yet built
  const [expanded, setExpanded] = useState({})
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')

  function build() {
    const result = buildIndex(docs)
    setBuilt(result)
    setExpanded({})
  }

  function startEdit(doc) {
    setEditId(doc.id)
    setEditText(doc.text)
  }

  function saveEdit() {
    setDocs(prev => prev.map(d => d.id === editId ? { ...d, text: editText } : d))
    setEditId(null)
    setBuilt(null)   // invalidate
  }

  const sortedTerms = built ? Object.keys(built.index).sort() : []

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Build an inverted index from documents</div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Documents (click to edit):</div>
        {docs.map(doc => (
          <div key={doc.id} style={{ marginBottom: 8 }}>
            {editId === doc.id ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input
                  className="txt"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button className="act" onClick={saveEdit}>Save</button>
                <button className="ghost act" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            ) : (
              <div
                style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}
                onClick={() => startEdit(doc)}
              >
                <span style={{
                  fontFamily: 'IBM Plex Mono', fontSize: 11, background: 'var(--blue)', color: '#fff',
                  borderRadius: 4, padding: '2px 6px', minWidth: 22, textAlign: 'center', flexShrink: 0
                }}>D{doc.id}</span>
                <span style={{ fontSize: 13, color: 'var(--ink)', opacity: 0.85 }}>{doc.text}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="act" onClick={build}>Build Index</button>
        <button className="ghost act" onClick={() => { setDocs(DEFAULT_DOCS.map(d => ({...d}))); setBuilt(null) }}>Reset</button>
      </div>

      {built && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
            <div className="obj" style={{ flex: 1, minWidth: 120 }}>
              <div className="oref">Unique terms</div>
              <div className="ofield" style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue)' }}>{sortedTerms.length}</div>
            </div>
            {docs.map(doc => (
              <div key={doc.id} className="obj" style={{ flex: 1, minWidth: 120 }}>
                <div className="oref">Doc {doc.id}</div>
                <div className="ofield">{(built.docTokens[doc.id] || []).length} tokens</div>
              </div>
            ))}
          </div>

          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
            Inverted Index (click a term to see postings):
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 6 }}>
            {sortedTerms.map(term => (
              <div key={term}>
                <div
                  onClick={() => setExpanded(e => ({ ...e, [term]: !e[term] }))}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid var(--line)',
                    background: expanded[term] ? 'rgba(45,91,255,0.06)' : 'transparent'
                  }}
                >
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>
                    "{term}"
                  </span>
                  <span style={{ fontSize: 12, color: '#7c8aa5' }}>
                    {built.index[term].length} doc(s) · docs: [{built.index[term].map(id => `D${id}`).join(', ')}]
                    {' '}{expanded[term] ? '▲' : '▼'}
                  </span>
                </div>
                {expanded[term] && (
                  <div style={{ padding: '8px 14px', background: '#f6f7ff', borderBottom: '1px solid var(--line)', fontSize: 12 }}>
                    {built.index[term].map(docId => {
                      const tokens = built.docTokens[docId] || []
                      const positions = tokens.reduce((acc, t, i) => t === term ? [...acc, i] : acc, [])
                      return (
                        <div key={docId} style={{ marginBottom: 4 }}>
                          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, background: 'var(--blue)', color: '#fff', borderRadius: 3, padding: '1px 5px', marginRight: 6 }}>D{docId}</span>
                          appears at positions [{positions.join(', ')}] in the token stream
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!built && (
        <div style={{ color: '#7c8aa5', fontSize: 13, fontStyle: 'italic' }}>
          Press "Build Index" to tokenize all documents and construct the inverted index.
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Demo 2 — Live search with TF-IDF ranking
   ============================================================ */
function SearchDemo() {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  const { index, docTokens } = buildIndex(DEFAULT_DOCS)

  function search(q) {
    if (!q.trim()) return null
    const terms = tokenize(q)
    if (terms.length === 0) return { terms: [], postings: {}, matches: [], scored: [] }

    const postings = {}
    for (const term of terms) {
      postings[term] = index[term] || []
    }

    const postingLists = terms.map(t => postings[t])
    const matches = intersect(postingLists)

    const scored = matches.map(docId => {
      const breakdown = terms.map(term => {
        const tokens = docTokens[docId] || []
        const termCount = tokens.filter(t => t === term).length
        const tf = tokens.length > 0 ? termCount / tokens.length : 0
        const totalDocs = DEFAULT_DOCS.length
        const docsWithTerm = (index[term] || []).length
        const idf = Math.log((totalDocs + 1) / (docsWithTerm + 1))
        const score = tf * idf
        return { term, tf: tf.toFixed(3), idf: idf.toFixed(3), score: score.toFixed(4) }
      })
      const totalScore = breakdown.reduce((sum, b) => sum + parseFloat(b.score), 0)
      return { docId, breakdown, totalScore }
    }).sort((a, b) => b.totalScore - a.totalScore)

    return { terms, postings, matches, scored }
  }

  const result = search(query)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Search with TF-IDF ranking</div>
      <div style={{ marginBottom: 4, fontSize: 12, color: '#7c8aa5' }}>
        Corpus: the same 4 documents from the index builder. Try: <b>java</b>, <b>python learning</b>, <b>programming language</b>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          ref={inputRef}
          className="txt"
          placeholder="Type a search query…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="ghost act" onClick={() => setQuery('')}>Clear</button>
      </div>

      {result && result.terms.length > 0 && (
        <div>
          {/* Postings retrieved */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Step 1 — Postings lists retrieved:</div>
            {result.terms.map(term => (
              <div key={term} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--blue)', fontWeight: 600, minWidth: 100 }}>"{term}"</span>
                <span style={{ fontSize: 12 }}>→ [{(result.postings[term] || []).map(id => `D${id}`).join(', ') || 'no match'}]</span>
              </div>
            ))}
          </div>

          {/* Intersection */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Step 2 — Intersect (AND query):</div>
            {result.matches.length > 0 ? (
              <div style={{ fontSize: 12 }}>
                Documents containing ALL query terms: [{result.matches.map(id => `D${id}`).join(', ')}]
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#ef4444' }}>No document contains all query terms (AND query = empty result).</div>
            )}
          </div>

          {/* TF-IDF scores */}
          {result.scored.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Step 3 — TF-IDF scores (ranked):</div>
              {result.scored.map((item, rank) => (
                <div key={item.docId} className="obj" style={{ marginBottom: 8 }}>
                  <div className="oref">#{rank + 1} · Doc {item.docId} · score = {item.totalScore.toFixed(4)}</div>
                  <div style={{ fontSize: 11.5, color: '#555', marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink)', opacity: 0.7 }}>
                      {DEFAULT_DOCS.find(d => d.id === item.docId)?.text}
                    </span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    {item.breakdown.map(b => (
                      <div key={b.term} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, marginBottom: 2 }}>
                        TF("{b.term}")={b.tf} × IDF={b.idf} = {b.score}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result && result.terms.length === 0 && query.trim() && (
        <div style={{ color: '#7c8aa5', fontSize: 13 }}>All query words are stop words or too short — nothing to search.</div>
      )}

      {!query.trim() && (
        <div style={{ color: '#7c8aa5', fontSize: 13, fontStyle: 'italic' }}>
          Type a query above to see the postings retrieval → intersection → TF-IDF ranking pipeline.
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Demo 3 — Crawl Frontier Simulation
   ============================================================ */
const WEB_GRAPH = {
  'seed.com': { links: ['alpha.com', 'beta.com'], rank: 5 },
  'alpha.com': { links: ['gamma.com', 'delta.com'], rank: 3 },
  'beta.com':  { links: ['alpha.com', 'epsilon.com'], rank: 4 },
  'gamma.com': { links: ['seed.com'], rank: 2 },
  'delta.com': { links: [], rank: 1 },
  'epsilon.com':{ links: ['delta.com'], rank: 2 },
}
const ALL_PAGES = Object.keys(WEB_GRAPH)

function CrawlDemo() {
  const [visited, setVisited]       = useState([])        // array of url strings
  const [frontier, setFrontier]     = useState([])        // array of url strings
  const [log, setLog]               = useState([])
  const [mode, setMode]             = useState('bfs')     // 'bfs' | 'priority'
  const [started, setStarted]       = useState(false)
  const [done, setDone]             = useState(false)
  const [bloomLog, setBloomLog]     = useState([])        // bloom filter checks

  function reset() {
    setVisited([])
    setFrontier([])
    setLog([])
    setBloomLog([])
    setStarted(false)
    setDone(false)
  }

  function start() {
    reset()
    setStarted(true)
    setFrontier(['seed.com'])
    setLog(['🌱 Seed URL added: seed.com → frontier: [seed.com]'])
    setBloomLog(['Bloom check "seed.com": NOT SEEN → add to frontier'])
  }

  function step() {
    setFrontier(prevFrontier => {
      setVisited(prevVisited => {
        if (prevFrontier.length === 0) {
          setDone(true)
          setLog(prev => [...prev, '✅ Frontier empty — crawl complete!'])
          return prevVisited
        }

        let queue = [...prevFrontier]
        let url

        if (mode === 'priority') {
          // Pick highest PageRank from frontier
          queue.sort((a, b) => (WEB_GRAPH[b]?.rank || 0) - (WEB_GRAPH[a]?.rank || 0))
        }

        url = queue.shift()
        const page = WEB_GRAPH[url]
        const links = page ? page.links : []

        const newFrontier = [...queue]
        const newBloom = []
        const newLogLines = [`📥 Fetching "${url}" (PageRank≈${page?.rank ?? '?'}) → found ${links.length} link(s)`]

        for (const link of links) {
          const alreadySeen = prevVisited.includes(link) || queue.includes(link)
          newBloom.push(`Bloom check "${link}": ${alreadySeen ? 'SEEN → skip' : 'NOT SEEN → enqueue'}`)
          if (!alreadySeen && !newFrontier.includes(link)) {
            newFrontier.push(link)
            newLogLines.push(`  ↳ Enqueued: ${link}`)
          } else if (alreadySeen) {
            newLogLines.push(`  ↳ Skip (bloom filter says already seen): ${link}`)
          }
        }

        setLog(prev => [...prev, ...newLogLines])
        setBloomLog(prev => [...prev, ...newBloom].slice(-8))
        setFrontier(newFrontier)

        if (newFrontier.length === 0 && prevVisited.includes(url) === false) {
          // will be set done next step check
        }

        return [...prevVisited, url]
      })
      return prevFrontier  // return value is replaced by inner setFrontier call
    })
  }

  // Workaround: use a simpler direct-state approach
  const [crawlState, setCrawlState] = useState({ visited: [], frontier: [], log: [], bloomLog: [], done: false, started: false })

  function startCrawl() {
    setCrawlState({
      visited: [],
      frontier: ['seed.com'],
      log: ['🌱 Seed URL: seed.com → frontier: [seed.com]', 'Bloom check "seed.com": NOT SEEN → add to frontier'],
      bloomLog: ['Bloom check "seed.com": NOT SEEN → add to frontier'],
      done: false,
      started: true,
    })
  }

  function stepCrawl() {
    setCrawlState(prev => {
      if (prev.frontier.length === 0) return { ...prev, done: true }

      let queue = [...prev.frontier]

      if (mode === 'priority') {
        queue.sort((a, b) => (WEB_GRAPH[b]?.rank || 0) - (WEB_GRAPH[a]?.rank || 0))
      }

      const url = queue.shift()
      const page = WEB_GRAPH[url]
      const links = page ? page.links : []

      const newFrontier = [...queue]
      const newBloom = []
      const newLogLines = [`📥 Fetch "${url}" (rank≈${page?.rank ?? '?'}) — ${links.length} link(s)`]

      for (const link of links) {
        const alreadySeen = prev.visited.includes(link) || queue.includes(link)
        newBloom.push(`Bloom: "${link}" → ${alreadySeen ? 'SEEN ✓ skip' : 'NEW → enqueue'}`)
        if (!alreadySeen && !newFrontier.includes(link)) {
          newFrontier.push(link)
          newLogLines.push(`  ↳ Enqueue: ${link}`)
        } else {
          newLogLines.push(`  ↳ Skip (seen): ${link}`)
        }
      }

      const newVisited = [...prev.visited, url]
      const isDone = newFrontier.length === 0

      if (isDone) newLogLines.push('✅ Frontier empty — crawl complete!')

      return {
        ...prev,
        visited: newVisited,
        frontier: newFrontier,
        log: [...prev.log, ...newLogLines].slice(-20),
        bloomLog: [...prev.bloomLog, ...newBloom].slice(-8),
        done: isDone,
      }
    })
  }

  function resetCrawl() {
    setCrawlState({ visited: [], frontier: [], log: [], bloomLog: [], done: false, started: false })
  }

  const cs = crawlState

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Crawl frontier simulation</div>

      {/* Web graph visualization */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Mini web graph (6 pages):</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ALL_PAGES.map(page => {
            const isVisited = cs.visited.includes(page)
            const inFrontier = cs.frontier.includes(page)
            const isSeed = page === 'seed.com'
            let bg = 'var(--paper)', border = '1px solid var(--line)', color = 'var(--ink)'
            if (isVisited) { bg = '#dcfce7'; border = '1px solid #16a34a'; color = '#14532d' }
            else if (inFrontier) { bg = '#fef9c3'; border = '1px solid #ca8a04'; color = '#713f12' }
            return (
              <div key={page} style={{
                padding: '6px 10px', borderRadius: 6, fontSize: 12, border, background: bg, color,
                fontFamily: 'IBM Plex Mono', fontWeight: isSeed ? 700 : 400
              }}>
                {isSeed ? '🌱 ' : ''}{page}
                <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>PR≈{WEB_GRAPH[page]?.rank}</span>
                {isVisited && <span style={{ marginLeft: 4 }}>✓</span>}
                {inFrontier && !isVisited && <span style={{ marginLeft: 4 }}>⏳</span>}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: '#7c8aa5' }}>
          <span>🟩 Visited</span><span>🟨 In frontier</span><span>⬜ Not yet discovered</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <div className="modbtns" style={{ marginBottom: 0 }}>
          <button className={mode === 'bfs' ? 'on' : ''} onClick={() => { setMode('bfs'); resetCrawl() }}>BFS order</button>
          <button className={mode === 'priority' ? 'on' : ''} onClick={() => { setMode('priority'); resetCrawl() }}>Priority (PageRank)</button>
        </div>
        {!cs.started
          ? <button className="act" onClick={startCrawl}>Start Crawl</button>
          : <button className="act" onClick={stepCrawl} disabled={cs.done}>Step →</button>
        }
        <button className="ghost act" onClick={resetCrawl}>Reset</button>
      </div>

      {cs.started && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {/* Frontier queue */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Frontier queue:</div>
            {cs.frontier.length === 0
              ? <div style={{ fontSize: 12, color: '#7c8aa5', fontStyle: 'italic' }}>{cs.done ? '(empty — done)' : '(empty)'}</div>
              : cs.frontier.map((url, i) => (
                  <div key={url} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, padding: '3px 6px', background: '#fef9c3', borderRadius: 4, marginBottom: 3 }}>
                    {i === 0 ? '▶ ' : `${i + 1}. `}{url}
                  </div>
                ))
            }
          </div>

          {/* Bloom filter checks */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Bloom filter checks:</div>
            {cs.bloomLog.length === 0
              ? <div style={{ fontSize: 12, color: '#7c8aa5', fontStyle: 'italic' }}>None yet</div>
              : cs.bloomLog.slice().reverse().map((entry, i) => (
                  <div key={i} style={{
                    fontSize: 11, padding: '3px 6px', borderRadius: 4, marginBottom: 3,
                    background: entry.includes('SEEN') ? '#fee2e2' : '#dcfce7',
                    color: entry.includes('SEEN') ? '#991b1b' : '#14532d',
                    fontFamily: 'IBM Plex Mono'
                  }}>
                    {entry}
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {/* Crawl log */}
      {cs.log.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Crawl log:</div>
          <div style={{ maxHeight: 160, overflowY: 'auto', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: 6, padding: 8 }}>
            {cs.log.slice().reverse().map((line, i) => (
              <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, marginBottom: 3, color: 'var(--ink)' }}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {cs.done && (
        <Good>Crawl complete! All {cs.visited.length} reachable pages visited. The BFS order discovers pages level-by-level from the seed. Priority mode visits high-PageRank pages earlier — critical for large web crawls where you can't index everything.</Good>
      )}
    </div>
  )
}

/* ============================================================
   Quiz data
   ============================================================ */
const QUESTIONS = [
  {
    q: 'What is an inverted index?',
    o: [
      'A sorted list of all documents by relevance score',
      'A hash of each document used for deduplication',
      'A map from document ID to list of words in that document',
      'A map from word to list of document IDs (and positions) that contain it',
    ],
    a: 3,
    e: 'The inverted index maps each term to its postings list — the list of documents containing that term. This is the opposite of a forward index (doc → words), hence "inverted".',
    w: {
      0: 'A ranked list is the output of a search query, not the index itself. The index is the structure that makes that ranking possible quickly.',
      1: 'Document hashing is used for deduplication in crawling, not for the core index structure.',
      2: 'That is the forward index (doc → words). It is the naive approach: searching "java" would mean scanning every document — O(N × doc_length). Too slow.',
    },
    r: { id: 's2', label: 'Section 2 — Inverted index structure' },
  },
  {
    q: 'Why do we remove stop words ("the", "is", "and") before indexing?',
    o: [
      'They appear in almost every document so their IDF is near zero — they add no search signal',
      'Stop words increase TF unfairly for short documents',
      'The Java split() method cannot handle them',
      'Stop words cause stemming to fail on edge cases',
    ],
    a: 0,
    e: 'IDF = log(N / df). If a word appears in every document, df ≈ N so IDF ≈ log(1) = 0. TF-IDF = 0. These words carry no discriminating power and just bloat the index.',
    w: {
      1: 'Stop words affect all documents roughly equally. The problem is they appear everywhere — removing them reduces index size without hurting relevance.',
      2: 'The tokenization split is done by regex on non-word characters, completely independent of which words are stop words.',
      3: 'Stop words and stemming are independent preprocessing steps. Stop words do not break stemming.',
    },
    r: { id: 's3', label: 'Section 3 — Preprocessing pipeline' },
  },
  {
    q: 'A document has 100 tokens and the word "java" appears 5 times. The corpus has 10 documents and 4 contain "java". What is the TF-IDF score?',
    o: [
      'TF=5/10=0.5, IDF=log(10/4), TF-IDF≈0.458',
      'TF=0.05, IDF=log(10/4)≈0.916, TF-IDF≈0.046',
      'TF=0.05, IDF=log(4/10)≈-0.916, TF-IDF≈-0.046',
      'TF=5, IDF=4, TF-IDF=20',
    ],
    a: 1,
    e: 'TF = termCount / totalTokens = 5/100 = 0.05. IDF = log(totalDocs / docsWithTerm) = log(10/4) ≈ 0.916. TF-IDF = 0.05 × 0.916 ≈ 0.046.',
    w: {
      0: 'TF divides by the total tokens in THIS document (100), not the total number of documents (10). These are different denominators.',
      2: 'IDF uses log(N/df) which is positive when the term is rare (N > df). A negative IDF would mean the term appears in more documents than exist — impossible.',
      3: 'TF is a ratio (not a raw count) and IDF is a logarithm (not a raw document count). Raw counts make longer documents unfairly dominant.',
    },
    r: { id: 's5', label: 'Section 5 — TF-IDF ranking formula' },
  },
  {
    q: 'A user searches for "java tutorial". How does a search engine handle this as a phrase query (exact two-word phrase)?',
    o: [
      'It finds docs where "java" appears at position K and "tutorial" at position K+1 in the same doc',
      'It scores all documents with "java" higher than those with only "tutorial"',
      'It uses stemming to reduce both words and then does an exact string search',
      'It intersects the postings lists for "java" and "tutorial" — any doc with both words matches',
    ],
    a: 0,
    e: 'Phrase queries require position information in the postings list. A phrase match means: the same document contains the first word at some position K and the second word at K+1 (adjacent, in order).',
    w: {
      1: 'Scoring by frequency does not enforce that the words appear next to each other. "I like java. Tutorial later" would score high but is not the phrase "java tutorial".',
      2: 'Stemming helps match variants ("tutorials" → "tutorial") but you still need positional checking to ensure the stemmed forms appear adjacent in that order.',
      3: 'That is an AND query, not a phrase query. AND query finds docs with both words anywhere. "tutorial java" would also match — wrong for an exact phrase.',
    },
    r: { id: 's10', label: 'Section 10 — Phrase queries and position index' },
  },
  {
    q: 'A Bloom filter says "YES, this URL has been seen before." What is the correct action?',
    o: [
      'Crawl the URL anyway — Bloom filters have false negatives',
      'Mark the URL as a duplicate and add it to a special queue',
      'Skip the URL — it MIGHT have been crawled (false positives are acceptable in dedup)',
      'Skip the URL — it has definitely already been crawled',
    ],
    a: 2,
    e: 'Bloom filters have false positives (says YES when actually NO) but NO false negatives. Skipping a false positive means occasionally missing a URL — acceptable for crawl dedup. Never missing a real "new" URL is the important guarantee.',
    w: {
      0: 'Bloom filters have NO false negatives. If a URL was never inserted, the filter will always say NO. The concern is false positives (YES when not actually seen), not false negatives.',
      1: 'In standard web crawl dedup, a Bloom filter YES means skip — there is no need for a special queue. The occasional false positive simply means a URL is skipped once.',
      3: 'A Bloom filter YES is not definite. It can produce false positives — the URL hash collides with a previously inserted URL. The correct phrasing is "might have been seen".',
    },
    r: { id: 's8', label: 'Section 8 — Crawl pipeline and Bloom filter' },
  },
  {
    q: 'You are sharding a search index across 5 machines. Where do you route the postings for the term "java"?',
    o: [
      'To all 5 machines equally (replicate everything)',
      'To the machine closest to the user making the query',
      'To the machine determined by hash("java") % 5',
      'To the machine with the most free disk space',
    ],
    a: 2,
    e: 'Term-based sharding uses hash(term) % N to decide which shard holds the postings list for that term. This ensures all postings for "java" land on one shard, so a query for "java" hits exactly one machine.',
    w: {
      0: 'Full replication means every machine stores the full index — no sharding benefit. Updates must be propagated to all 5 machines. This is replication, not sharding.',
      1: 'Location of the requesting user is irrelevant to WHERE the postings live. Routing by proximity is for CDN caching of results, not index sharding.',
      3: 'Free disk space routing is dynamic and changes over time. Queries for "java" would need to find out where "java" ended up — there is no stable lookup. Consistent hashing solves this deterministically.',
    },
    r: { id: 's10', label: 'Section 10 — Index sharding' },
  },
  {
    q: 'What does stemming do, and why is it useful for search?',
    o: [
      'It splits compound words into their components for better indexing',
      'It removes duplicate documents from the index',
      'It measures how frequently a word appears relative to the document length',
      'It reduces words to their root form so "running", "runs", and "runner" all match a query for "run"',
    ],
    a: 3,
    e: 'Stemming strips morphological suffixes to find the common root. Without stemming, a search for "run" would miss documents containing only "running" or "runner" — same concept, different surface form.',
    w: {
      0: 'Splitting compound words is compound splitting or segmentation — a different NLP task. Stemming only removes suffixes from a single word (e.g., "running" → "run").',
      1: 'Duplicate document removal is a separate step, typically done with document fingerprinting (SimHash, Shingling). Stemming is purely about word form normalization.',
      2: 'Measuring frequency relative to document length is Term Frequency (TF), one component of TF-IDF. That is a ranking signal, not a tokenization step.',
    },
    r: { id: 's3', label: 'Section 3 — Preprocessing pipeline' },
  },
  {
    q: 'Postings lists for two terms are: A=[1,3,5,7,9] and B=[3,5,6,7,10]. What is the AND-intersection and what is its time complexity?',
    o: [
      'Intersection=[3,5,7], O(log(m+n)) binary search',
      'Intersection=[3,5,7], O(m+n) two-pointer merge',
      'Intersection=[1,3,5,6,7,9,10], O(m+n) union',
      'Intersection=[3,5,7], O(m×n) nested loop',
    ],
    a: 1,
    e: 'Two sorted postings lists can be intersected in O(m+n) using two pointers — the same merge step as merge sort. Advance the pointer pointing to the smaller value; emit when both pointers match.',
    w: {
      0: 'Binary search of each element of A in B would be O(m log n) — better than O(m×n) but worse than O(m+n). Sorted lists let us do better with two pointers since both lists move forward.',
      2: 'That is a union (OR query), not an intersection (AND query). AND-intersection only keeps elements in BOTH lists. Union keeps elements in EITHER list.',
      3: 'A nested loop comparing every element of A against every element of B is O(m×n). This is the naive approach. Since postings lists are sorted, the two-pointer merge is always better.',
    },
    r: { id: 's6', label: 'Section 6 — Postings list intersection' },
  },
]

/* ============================================================
   Page
   ============================================================ */
export default function Day87() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 87</div>
        <h1>Search Engine:<br />Inverted Index, TF-IDF &amp; Crawling</h1>
        <p>
          Google indexes hundreds of billions of pages and returns results in 200ms.
          The core data structure is deceptively simple: a map from word to document list.
          This day builds it from scratch — the index, the ranking formula, and the crawl pipeline.
        </p>
        <div className="chips">
          {['Inverted Index','TF-IDF','Tokenization','Stemming','Postings List','Crawl Frontier','Bloom Filter','Index Sharding'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 — Analogy + forward vs inverted */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The textbook index: why "scan every page" does not scale</h2>
        <p>
          Imagine a 500-page textbook. You want to find "polymorphism". Do you read every page?
          No — you flip to the index at the back: <em>polymorphism — pages 23, 47, 112</em>.
          You jump directly. A search engine's inverted index is exactly this.
        </p>
        <p>
          The <strong>naive (forward) index</strong> maps <em>document → words</em>. To search "java",
          you must scan every document and check if it contains "java". That is O(N × document_length).
          With 50 billion web pages, this takes years.
        </p>
        <p>
          The <strong>inverted index</strong> maps <em>word → documents</em>. Looking up "java" is a
          single hash-map lookup — O(1) to find the list of matching documents. This is why every
          production search system — Lucene, Elasticsearch, Solr — is built on an inverted index.
        </p>
        <Code html={`<span class="cm">// Forward index — naive, unusable for search</span>
<span class="kw">Map</span>&lt;Integer, List&lt;String&gt;&gt; forwardIndex = <span class="kw">new</span> HashMap&lt;&gt;();
forwardIndex.put(<span class="num">1</span>, List.of(<span class="str">"java"</span>, <span class="str">"fast"</span>, <span class="str">"powerful"</span>));
forwardIndex.put(<span class="num">2</span>, List.of(<span class="str">"python"</span>, <span class="str">"readable"</span>, <span class="str">"simple"</span>));
<span class="cm">// To find "java": loop over ALL docs and check. O(N × len). Too slow.</span>

<span class="cm">// Inverted index — the right structure</span>
<span class="kw">Map</span>&lt;String, List&lt;Integer&gt;&gt; invertedIndex = <span class="kw">new</span> HashMap&lt;&gt;();
invertedIndex.put(<span class="str">"java"</span>,   List.of(<span class="num">1</span>, <span class="num">3</span>));   <span class="cm">// docs 1 and 3 contain "java"</span>
invertedIndex.put(<span class="str">"python"</span>, List.of(<span class="num">2</span>, <span class="num">3</span>));   <span class="cm">// docs 2 and 3 contain "python"</span>
invertedIndex.put(<span class="str">"fast"</span>,   List.of(<span class="num">1</span>));       <span class="cm">// only doc 1 contains "fast"</span>
<span class="cm">// To find "java": one lookup → [1, 3]. O(1). Perfect.</span>`} />
        <Note>
          The word "inverted" means the direction is reversed: instead of doc → words, it is word → docs.
          Same information, opposite direction.
        </Note>
      </section>

      {/* S2 — Inverted index structure */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Inside the inverted index: postings lists with positions</h2>
        <p>
          The full inverted index stores not just which documents contain a word, but also
          the <strong>positions</strong> where the word appears inside each document.
          Positions are needed for phrase queries ("java tutorial" — two words next to each other).
        </p>
        <Code html={`<span class="cm">// Three sample documents after tokenization:</span>
<span class="cm">// Doc 1: "java fast java fun"      → tokens at positions 0,1,2,3</span>
<span class="cm">// Doc 2: "python readable fun"       → tokens at positions 0,1,2</span>
<span class="cm">// Doc 3: "java python popular"        → tokens at positions 0,1,2</span>

<span class="cm">┌─────────────────────────────────────────────────────────────────┐</span>
<span class="cm">│               INVERTED INDEX  (word → postings list)            │</span>
<span class="cm">├──────────┬──────────────────────────────────────────────────────┤</span>
<span class="cm">│  Term    │  Postings: (docId, [positions])                      │</span>
<span class="cm">├──────────┼──────────────────────────────────────────────────────┤</span>
<span class="cm">│  "java"  │  (doc1,[0,2])  (doc3,[0])                           │</span>
<span class="cm">│  "python"│  (doc2,[0])    (doc3,[1])                           │</span>
<span class="cm">│  "fun"   │  (doc1,[3])    (doc2,[2])                           │</span>
<span class="cm">│  "fast"  │  (doc1,[1])                                         │</span>
<span class="cm">│  "popular│  (doc3,[2])                                         │</span>
<span class="cm">└──────────┴──────────────────────────────────────────────────────┘</span>

<span class="cm">// Query "java fun": intersect [doc1,doc3] ∩ [doc1,doc2] → [doc1]</span>
<span class="cm">// Only doc1 contains BOTH words. Rank by TF-IDF score → return doc1.</span>`} />
        <p>
          Each row in the table is called a <strong>postings list</strong>. The postings lists
          are kept <strong>sorted by docId</strong>. This makes intersection (AND queries) fast —
          we will see the O(m+n) merge algorithm in Section 6.
        </p>
        <Note>
          At Google's scale, postings lists for common words like "the" or "java" contain billions of entries.
          They are compressed with delta encoding (store differences between docIds, not raw docIds) and stored on disk.
        </Note>
      </section>

      {/* S3 — Preprocessing pipeline */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Before indexing: the preprocessing pipeline</h2>
        <p>
          Raw text cannot go directly into the index. We must normalize it first.
          Four steps, in order:
        </p>
        <ol>
          <li><strong>Tokenize</strong> — split text into individual words. "Java is fast!" → ["Java", "is", "fast"]</li>
          <li><strong>Lowercase</strong> — "Java" and "java" should match. → ["java", "is", "fast"]</li>
          <li><strong>Remove stop words</strong> — "is", "the", "and", "a" appear in every document. They add noise, not signal. → ["java", "fast"]</li>
          <li><strong>Stem</strong> — reduce words to their root form. "running" → "run". "tutorials" → "tutorial". So a search for "run" matches "running". → ["java", "fast"]</li>
        </ol>
        <Code html={`<span class="kw">import</span> java.util.*;
<span class="kw">import</span> java.util.stream.*;

<span class="kw">class</span> Tokenizer {
    <span class="cm">// words so common they carry no search signal</span>
    <span class="kw">private static final</span> Set&lt;String&gt; STOP_WORDS = Set.of(
        <span class="str">"is"</span>, <span class="str">"are"</span>, <span class="str">"was"</span>, <span class="str">"the"</span>, <span class="str">"a"</span>, <span class="str">"an"</span>, <span class="str">"and"</span>, <span class="str">"or"</span>, <span class="str">"in"</span>, <span class="str">"of"</span>
    );

    <span class="kw">static</span> List&lt;String&gt; tokenize(String text) {
        <span class="kw">return</span> Arrays.stream(text.toLowerCase().split(<span class="str">"\\W+"</span>)) <span class="cm">// split on non-word chars</span>
            .filter(t -&gt; !STOP_WORDS.contains(t))    <span class="cm">// drop stop words</span>
            .map(Stemmer::stem)                       <span class="cm">// "running" → "run"</span>
            .filter(t -&gt; !t.isBlank())               <span class="cm">// drop empty strings</span>
            .collect(Collectors.toList());
    }
}

<span class="cm">// Example walkthrough:</span>
<span class="cm">// Input : "Java is running fast and tutorials are great"</span>
<span class="cm">// Step 1: ["Java","is","running","fast","and","tutorials","are","great"]</span>
<span class="cm">// Step 2: ["java","is","running","fast","and","tutorials","are","great"]</span>
<span class="cm">// Step 3: ["java","running","fast","tutorials","great"]   ← is/and/are removed</span>
<span class="cm">// Step 4: ["java","run","fast","tutorial","great"]        ← stems applied</span>`} />
        <Warn>
          Stemming is aggressive. "university" → "univers", "universe" → "univers" — now they match!
          Sometimes correct (both relate to academia), sometimes wrong (different concepts). Production
          systems often use a milder approach called <strong>lemmatization</strong> which uses a
          dictionary to find the true base form ("running" → "run", "better" → "good").
        </Warn>
      </section>

      {/* S4 — Interactive: Index Builder */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: build an inverted index</h2>
        <p>
          The four documents below will be tokenized (lowercase → stop words removed → stemmed)
          and the inverted index will be built. Click any term in the index to see which documents
          contain it and at what positions. Edit a document and rebuild — watch the index change.
        </p>
        <IndexBuilderDemo />
        <Good>
          Notice: short common words like "is", "and", "are" disappear (stop words).
          Words ending in "s" often stem to their root. The unique term count is much
          smaller than the total word count across all documents.
        </Good>
      </section>

      {/* S5 — TF-IDF */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>TF-IDF: ranking documents by relevance</h2>
        <p>
          Finding matching documents is step one. Ranking them is step two.
          A document that says "java" 10 times is probably more about Java than one that says it once.
          But a word that appears in every document (like "the") should get almost zero credit
          even if it appears 50 times. TF-IDF captures both ideas.
        </p>
        <p>
          <strong>TF (Term Frequency)</strong> — how often does the word appear in this document, normalized by document length.
          Normalization prevents long documents from always winning just because they have more words.
        </p>
        <p>
          <strong>IDF (Inverse Document Frequency)</strong> — how rare is the word across all documents?
          Rare words are more informative search signals. The logarithm damps the effect so a word in 1 of 10 docs
          does not score 10× higher than a word in 1 of 5.
        </p>
        <Code html={`<span class="cm">// TF: frequent in this document = probably relevant to it</span>
<span class="kw">double</span> tf = (<span class="kw">double</span>) termCountInDoc / totalTokensInDoc;
<span class="cm">// e.g., "java" appears 5 times in a 100-token doc → tf = 0.05</span>

<span class="cm">// IDF: rare across all documents = high discriminating power</span>
<span class="kw">double</span> idf = Math.log((<span class="kw">double</span>) totalDocs / docsContainingTerm);
<span class="cm">// e.g., 10 total docs, 2 contain "java" → idf = log(10/2) = log(5) ≈ 1.61</span>
<span class="cm">// "the" appears in all 10 → idf = log(10/10) = log(1) = 0 → useless signal</span>

<span class="cm">// TF-IDF: the combined relevance score for one term in one document</span>
<span class="kw">double</span> tfidf = tf * idf;

<span class="cm">// Multi-term query "java tutorial": sum TF-IDF of each term</span>
<span class="kw">double</span> score = <span class="num">0</span>;
<span class="kw">for</span> (String term : queryTerms) {
    score += tfIdf(term, docId, docs, index);
}
<span class="cm">// Rank all matching docs by score descending → top results</span>`} />
        <Note>
          TF-IDF is the classic formula — simple and effective. Modern search engines add many signals on top:
          PageRank (authority of the page), freshness, click-through rate, user location, query context.
          But TF-IDF is still the foundation.
        </Note>
        <Reveal summary="Bonus: why is the IDF formula log(N/df) and not just N/df?">
          <p>Without the log, a word in 1 of 10 docs gets IDF=10 and a word in 1 of 1,000,000 docs gets IDF=1,000,000. The ratio 100,000:1 seems extreme — both words are "rare", just at different scales.</p>
          <p>The log function compresses the scale: log(10)≈2.3, log(1,000,000)≈13.8. The ratio becomes 6:1. Much more reasonable. This is called "dampening" — a well-known technique in information retrieval.</p>
          <p>In practice, most implementations also use log(1 + N/df) to avoid dividing by zero when a term appears in 0 documents.</p>
        </Reveal>
      </section>

      {/* S6 — Postings list intersection */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>AND query: intersecting postings lists in O(m + n)</h2>
        <p>
          For a query like "java tutorial", we need documents that contain BOTH words.
          We get the postings list for "java" and the postings list for "tutorial",
          then find the overlap. Since both lists are sorted by docId, we can merge them
          in one pass — exactly like the merge step in merge sort.
        </p>
        <Code html={`<span class="cm">// Both postings lists are SORTED by docId. Two pointers, one pass.</span>
List&lt;Integer&gt; intersect(List&lt;Integer&gt; p1, List&lt;Integer&gt; p2) {
    List&lt;Integer&gt; result = <span class="kw">new</span> ArrayList&lt;&gt;();
    <span class="kw">int</span> i = <span class="num">0</span>, j = <span class="num">0</span>;

    <span class="kw">while</span> (i &lt; p1.size() &amp;&amp; j &lt; p2.size()) {
        <span class="kw">if</span>      (p1.get(i).equals(p2.get(j))) {
            result.add(p1.get(i));   <span class="cm">// both pointers matched → emit, advance both</span>
            i++; j++;
        } <span class="kw">else if</span> (p1.get(i) &lt; p2.get(j)) {
            i++;                     <span class="cm">// p1 is behind p2, advance p1</span>
        } <span class="kw">else</span> {
            j++;                     <span class="cm">// p2 is behind p1, advance p2</span>
        }
    }
    <span class="kw">return</span> result;  <span class="cm">// O(m+n) total — optimal for sorted lists</span>
}

<span class="cm">// Example:</span>
<span class="cm">// "java"     → [1, 3, 5, 8]</span>
<span class="cm">// "tutorial" → [3, 5, 6, 9]</span>
<span class="cm">// Intersection:  [3, 5]      — only docs 3 and 5 contain both</span>
<span class="cm">// Rank [3,5] by TF-IDF → return ranked results</span>`} />
        <p>
          For multi-term queries, we intersect multiple lists. A smart optimization:
          start with the <strong>shortest</strong> postings list. If "tutorial" only appears in 5 docs
          but "java" appears in 500,000, intersecting the 5-doc list first eliminates most candidates early.
        </p>
        <Note>
          OR query (union) uses the same two-pointer technique but emits when EITHER pointer matches.
          NOT query (exclude a term) scans one list and skips docIds found in the exclusion list.
        </Note>
      </section>

      {/* S7 — Interactive: Live search */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>Play: live search with TF-IDF ranking</h2>
        <p>
          Type a query to see the full pipeline: retrieve postings → intersect (AND) → score
          each matching document with TF-IDF → rank. Try <strong>java</strong>,
          <strong> python learning</strong>, or <strong>programming language</strong>.
          Notice how a document that mentions a word 3 times scores higher than one that mentions it once.
        </p>
        <SearchDemo />
        <Good>
          Multi-word queries only return documents containing ALL query terms (AND semantics).
          The TF-IDF breakdown shows exactly why one document ranks above another.
        </Good>
      </section>

      {/* S8 — Crawl pipeline */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>The crawl pipeline: how pages get into the index</h2>
        <p>
          Before you can search the web, you must discover and download every page.
          This is the job of the <strong>web crawler</strong>. It starts from a set of seed URLs
          and follows links recursively until it has visited everything reachable.
        </p>
        <Code html={`<span class="cm">┌─────────────────────────────────────────────────────────────────────┐</span>
<span class="cm">│                     CRAWL PIPELINE                                  │</span>
<span class="cm">│                                                                     │</span>
<span class="cm">│  Seed URLs                                                          │</span>
<span class="cm">│      │                                                              │</span>
<span class="cm">│      ▼                                                              │</span>
<span class="cm">│  URL Frontier (priority queue of unvisited URLs)                    │</span>
<span class="cm">│      │   ◄──────── new links extracted from pages                  │</span>
<span class="cm">│      ▼                                                              │</span>
<span class="cm">│  Crawler (fetches HTML, respects robots.txt, rate limits per domain)│</span>
<span class="cm">│      │                                                              │</span>
<span class="cm">│      ▼                                                              │</span>
<span class="cm">│  Parser (extracts text body + outbound links + metadata)            │</span>
<span class="cm">│      │                                                              │</span>
<span class="cm">│      ├──► Link extractor → Bloom filter dedup → URL Frontier       │</span>
<span class="cm">│      │    (Bloom filter: near-zero space, no false negatives)       │</span>
<span class="cm">│      │                                                              │</span>
<span class="cm">│      ▼                                                              │</span>
<span class="cm">│  Indexer (tokenize → build/update inverted index entries)           │</span>
<span class="cm">│      │                                                              │</span>
<span class="cm">│      ▼                                                              │</span>
<span class="cm">│  Index Store (sharded by term hash, replicated for fault tolerance) │</span>
<span class="cm">└─────────────────────────────────────────────────────────────────────┘</span>`} />
        <p>
          Key decisions in the crawler:
        </p>
        <ul>
          <li><strong>URL deduplication</strong> — a Bloom filter checks if a URL has been seen before.
            It uses near-zero memory and has no false negatives (a new URL is never falsely skipped).
            Occasional false positives (a URL is skipped once) are acceptable — the next crawl will catch it.</li>
          <li><strong>Crawl politeness</strong> — read <C>robots.txt</C> before crawling a domain.
            Rate limit requests per domain (1 request per 2 seconds is typical) to avoid hammering servers.</li>
          <li><strong>Freshness</strong> — news sites change every minute; Wikipedia changes every month.
            Re-crawl frequency is proportional to how often content changes.</li>
          <li><strong>Priority</strong> — the frontier is a priority queue. High PageRank pages are crawled first
            because they are more important. New pages from high-traffic sites jump the queue.</li>
        </ul>
        <Note>
          A Bloom filter is a probabilistic data structure. It uses an array of bits and multiple hash functions.
          Insert a URL: hash it K times, set K bits. Check a URL: hash it K times, if ALL K bits are set — probably seen (false positive possible). If ANY bit is 0 — definitely not seen (no false negatives). Space: ~10 bits per item vs 200+ bytes per URL in a hash set.
        </Note>
      </section>

      {/* S9 — Interactive: Crawl frontier */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>Play: crawl frontier simulation</h2>
        <p>
          A mini web of 6 pages, each with links and a PageRank score. Click "Start Crawl" from the seed,
          then step through one page at a time. Toggle between BFS order (first-in-first-out frontier)
          and Priority order (highest PageRank crawled first). Watch the Bloom filter check each discovered link.
        </p>
        <CrawlDemo />
        <Good>
          In BFS mode, pages are crawled in discovery order. In Priority mode, high-PageRank pages
          (more important pages) are crawled first even if they were discovered later. At Google's scale,
          priority crawling is essential — the crawler can only visit a fraction of the web per day.
        </Good>
      </section>

      {/* S10 — Sharding, phrase queries, cheat sheet */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Index sharding, phrase queries &amp; cheat sheet</h2>

        <h3 style={{ marginTop: 16, marginBottom: 8 }}>Index sharding (scale)</h3>
        <p>
          One machine cannot hold the inverted index for the entire web. We shard it.
          The standard approach is <strong>term-based sharding</strong>: <C>hash(term) % N_SHARDS</C> determines
          which machine stores the postings list for that term. All postings for "java" land on shard 7.
          A query for "java" goes to shard 7 — one round trip.
        </p>
        <p>
          A multi-term query fans out: "java tutorial" → shard_of("java") + shard_of("tutorial").
          Results come back in parallel, merged and ranked on a coordinator node.
          This is the same consistent hashing idea from Day 85.
        </p>

        <h3 style={{ marginTop: 16, marginBottom: 8 }}>Phrase queries (position index)</h3>
        <p>
          Query "java tutorial" as an exact phrase: the words must appear adjacent, in order.
          A plain AND intersection finds docs with both words anywhere — not good enough.
          With position data in the postings: find a document where "java" appears at position K
          and "tutorial" at position K+1 in the same document. That is a phrase match.
        </p>
        <Code html={`<span class="cm">// Postings with positions: (docId, [positions...])</span>
<span class="cm">// "java"     → [(doc1,[2,7]), (doc3,[0,4])]</span>
<span class="cm">// "tutorial" → [(doc1,[3]),  (doc2,[1])]</span>

<span class="cm">// Phrase match in doc1:</span>
<span class="cm">// "java" at position 2 AND "tutorial" at position 3 (= 2+1) → MATCH</span>
<span class="cm">// "java" at position 7 — no "tutorial" at 8 → no phrase match</span>

<span class="kw">boolean</span> phraseMatch(List&lt;Integer&gt; javaPos, List&lt;Integer&gt; tutorialPos) {
    <span class="kw">for</span> (<span class="kw">int</span> k : javaPos) {
        <span class="kw">if</span> (tutorialPos.contains(k + <span class="num">1</span>)) <span class="kw">return true</span>;  <span class="cm">// adjacent in order</span>
    }
    <span class="kw">return false</span>;
}`} />

        <h3 style={{ marginTop: 16, marginBottom: 8 }}>Cheat sheet</h3>
        <ul>
          <li><strong>Forward index</strong> — doc → words. Good for "what words are in doc X?". Bad for search.</li>
          <li><strong>Inverted index</strong> — word → [docIds, positions]. Good for search. Powers all search engines.</li>
          <li><strong>Preprocessing</strong> — tokenize → lowercase → stop words → stem. Must be identical at index time and query time.</li>
          <li><strong>TF</strong> — term count / doc length. Normalized frequency of a word in ONE document.</li>
          <li><strong>IDF</strong> — log(total docs / docs with term). Rarity of a word ACROSS all documents.</li>
          <li><strong>TF-IDF</strong> — TF × IDF. High when frequent in this doc AND rare across all docs.</li>
          <li><strong>Postings intersection</strong> — O(m+n) two-pointer merge on sorted lists.</li>
          <li><strong>Bloom filter</strong> — space-efficient set. No false negatives. Acceptable false positives. Used for URL dedup.</li>
          <li><strong>Crawl frontier</strong> — priority queue of unvisited URLs. BFS = fairness. Priority = importance first.</li>
          <li><strong>Index sharding</strong> — hash(term) % N determines which shard holds the postings. Fan-out queries, merge at coordinator.</li>
          <li><strong>Phrase query</strong> — requires position data. "java" at K AND "tutorial" at K+1 in same doc.</li>
        </ul>

        <Reveal summary="Bonus: OR queries and Boolean model">
          <p><strong>OR query</strong> ("java OR python"): union of postings lists. Same two-pointer technique — emit when EITHER pointer matches.</p>
          <p><strong>Boolean model</strong>: AND + OR + NOT combined. For example: "java AND (tutorial OR course) NOT beginner". Evaluate innermost parentheses first, then combine.</p>
          <p><strong>NOT query</strong>: scan the postings of the excluded term and skip those docIds during intersection. Expensive if the excluded list is large — avoid "NOT common_word".</p>
        </Reveal>
      </section>

      {/* INTERVIEW CORNER */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Interview corner</h2>
        <p>5–8 tricky questions. Reveal each answer only after you have thought about it.</p>

        <Reveal summary="What is an inverted index, and why is it better than a forward index for search?">
          <p>
            A forward index maps docId → list of words in that document. To find all documents containing "java", you scan every document — O(N × doc_length). Unusable at scale.
          </p>
          <p>
            An inverted index maps word → list of docIds (postings list). Finding "java" is one hash-map lookup — O(1) to retrieve the postings list. This is why every production search system (Lucene, Elasticsearch) is built on an inverted index.
          </p>
          <p>The word "inverted" means the mapping direction is flipped compared to the natural (forward) direction.</p>
        </Reveal>

        <Reveal summary="What is TF-IDF and why does multiplying TF × IDF give a good relevance score?">
          <p>
            TF (Term Frequency) = termCount / docLength. Captures "how much is this document about this word?" Long documents are normalized so they do not always win.
          </p>
          <p>
            IDF (Inverse Document Frequency) = log(N / df). Captures "how rare/informative is this word across the whole corpus?" Common words like "the" get IDF ≈ 0. Rare technical terms get high IDF.
          </p>
          <p>
            TF × IDF is high when a word is frequent in this specific document AND rare across all documents — exactly the definition of a relevant word. A document about "java" that says "java" many times, in a corpus where "java" is not everywhere, is probably the most relevant result.
          </p>
        </Reveal>

        <Reveal summary="How do you handle phrase queries like 'java tutorial' (exact two-word phrase)?">
          <p>
            Plain AND intersection is not enough — it finds docs with both words anywhere, so "tutorial first, then java later" would match incorrectly.
          </p>
          <p>
            Solution: store positions in the postings list as (docId, [positions]). For phrase "java tutorial": find a document where "java" appears at position K AND "tutorial" appears at position K+1. That is a phrase match.
          </p>
          <p>
            Algorithm: intersect docId lists first (AND). Then for each matching doc, check whether the position lists satisfy the adjacency condition. This is O(m+n) for the intersection plus O(p1 + p2) for the position check per matching doc.
          </p>
        </Reveal>

        <Reveal summary="What is a Bloom filter and why is it used for URL deduplication in web crawling?">
          <p>
            A Bloom filter is a probabilistic data structure for set membership testing. It uses a bit array and K hash functions. Insert: hash URL K times, set K bits. Check: hash K times — if ALL K bits set, probably seen (possible false positive); if any bit is 0, definitely NOT seen (no false negatives).
          </p>
          <p>
            Why use it for URL dedup? A hash set of 50 billion URLs would need terabytes. A Bloom filter needs ~10 bits per element — about 60GB for 50 billion URLs. Acceptable false positive rate (~1%) means occasionally a new URL is skipped, but it will be caught in the next crawl cycle. The guarantee that matters is NO false negatives: a genuinely new URL is never wrongly skipped.
          </p>
        </Reveal>

        <Reveal summary="How do you shard a search index across machines? What happens during a query?">
          <p>
            Term-based sharding: shard = hash(term) % N. All postings for "java" go to one shard. All postings for "tutorial" go to a (possibly different) shard.
          </p>
          <p>
            Query execution: a coordinator node receives the query, determines the shard for each query term (same hash function), sends sub-queries to each relevant shard in parallel, receives postings lists back, performs the intersection and TF-IDF ranking, and returns ranked results.
          </p>
          <p>
            Each shard is also replicated for fault tolerance and read throughput. If shard 7 has 3 replicas, read requests are load-balanced across them.
          </p>
          <p>
            Alternative: document-based sharding (each shard holds a subset of documents with ALL their terms). Simpler to add documents. But multi-term intersection requires hitting all shards and merging — more network traffic.
          </p>
        </Reveal>

        <Reveal summary="What is PageRank in one sentence?">
          <p>
            PageRank scores a page by the number and quality of other pages that link to it — a page linked by many high-PageRank pages gets a high PageRank, recursively.
          </p>
          <p>
            More precisely: treat the web as a graph. A random surfer clicks links at random. PageRank(X) is the long-run fraction of time the surfer spends on page X. Pages many high-traffic pages link to are visited most often — they get high PageRank.
          </p>
          <p>
            PageRank is a link-graph signal. TF-IDF is a content signal. Search engines combine hundreds of such signals.
          </p>
        </Reveal>

        <Reveal summary="Why must preprocessing (tokenization, stemming) be identical at index time and query time?">
          <p>
            The index stores stems, not raw words. "running" is stored as "run". When the user searches "running", the query must ALSO be stemmed to "run" — otherwise the query term "running" would not match the index entry "run".
          </p>
          <p>
            If you use stemmer V1 at index time and upgrade to stemmer V2 at query time, a word may now stem differently — queries stop finding documents that were indexed correctly. You must re-index with V2 or keep using V1.
          </p>
          <p>
            Same applies to stop word lists, case folding, Unicode normalization. Any asymmetry between index time and query time produces incorrect results.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="squad">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer — explanations and revisit pointers appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 87 complete?</strong> Homework: implement an <C>InvertedIndex</C> class in Java
        with two methods: <C>addDocument(int id, String text)</C> (tokenize and update the index)
        and <C>search(String query)</C> returning a <C>List&lt;Integer&gt;</C> of docIds ranked by
        their TF-IDF score (highest first). Use a real stop-word list and a simple suffix-stripping stemmer.
        Test it: add 5 documents, search for single terms and two-term queries, verify the ranking matches
        your intuition.
        <br /><br />
        Explore more: revisit <strong>Day 85 — Consistent Hashing</strong> to see how index sharding
        maps terms to shards without rehashing everything when a machine is added or removed.
        Or try <strong>Day 84 — Circuit Breaker</strong> to understand the resilience layer that
        protects a search service when shard replicas go down.
      </div>
    </div>
  )
}
