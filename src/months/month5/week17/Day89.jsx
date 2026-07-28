import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Live Sorted Set Leaderboard
   Six players, "Play Round" distributes score gains randomly.
   Shows rank changes after each round.
   ============================================================ */
const INITIAL_PLAYERS = [
  { id: 'alice',   name: 'Alice',   score: 4200 },
  { id: 'bob',     name: 'Bob',     score: 3800 },
  { id: 'carol',   name: 'Carol',   score: 5100 },
  { id: 'dave',    name: 'Dave',    score: 2900 },
  { id: 'eve',     name: 'Eve',     score: 6300 },
  { id: 'frank',   name: 'Frank',   score: 1700 },
]

function sortedDesc(players) {
  return [...players].sort((a, b) => b.score - a.score)
}

function LiveLeaderboard() {
  const [players, setPlayers] = useState(INITIAL_PLAYERS)
  const [lastGains, setLastGains] = useState({})
  const [round, setRound] = useState(0)
  const [watched, setWatched] = useState('alice')

  function playRound() {
    const gains = {}
    const weights = { alice: 3, bob: 2, carol: 4, dave: 1, eve: 2, frank: 3 }
    let pool = 3000 + Math.floor(Math.random() * 2000)
    const ids = ['alice','bob','carol','dave','eve','frank']
    const totalW = ids.reduce((s, id) => s + weights[id], 0)
    ids.forEach(id => {
      const base = Math.floor((weights[id] / totalW) * pool)
      gains[id] = base + Math.floor(Math.random() * 300)
    })
    setLastGains(gains)
    setPlayers(prev => prev.map(p => ({ ...p, score: p.score + gains[p.id] })))
    setRound(r => r + 1)
  }

  function reset() {
    setPlayers(INITIAL_PLAYERS)
    setLastGains({})
    setRound(0)
  }

  const sorted = sortedDesc(players)
  const watchedRank = sorted.findIndex(p => p.id === watched) + 1
  const watchedPlayer = players.find(p => p.id === watched)

  const MEDAL = ['🥇','🥈','🥉']

  return (
    <div className="panel">
      <div className="ptitle">Live demo · sorted set leaderboard (ZINCRBY + ZREVRANK)</div>
      <p style={{ fontSize: 14, marginBottom: 12, color: '#4a5568' }}>
        Click <strong>Play Round</strong> to distribute score gains. The leaderboard re-sorts instantly.
        Watch how rank changes — exactly what Redis does with ZINCRBY + ZREVRANGE.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button className="act" onClick={playRound}>▶ Play Round {round + 1}</button>
        <button className="ghost act" onClick={reset}>Reset</button>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 8 }}>
            ZREVRANGE leaderboard 0 5 WITHSCORES
          </div>
          {sorted.map((p, i) => {
            const gain = lastGains[p.id]
            return (
              <div key={p.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', marginBottom: 6,
                  background: p.id === watched ? '#EEF3FF' : '#fff',
                  border: `1.5px solid ${p.id === watched ? '#2D5BFF' : '#dcd9cf'}`,
                  borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 13,
                }}>
                <span style={{ width: 26 }}>{MEDAL[i] || `#${i+1}`}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                <span style={{ color: '#1B2A4A' }}>{p.score.toLocaleString()}</span>
                {gain != null && (
                  <span style={{ color: '#2E9E6B', fontSize: 11, fontWeight: 700 }}>+{gain}</span>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ flex: '0 0 220px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 8 }}>
            Watch a player (ZREVRANK)
          </div>
          <div className="modbtns" style={{ flexWrap: 'wrap', gap: 6 }}>
            {players.map(p => (
              <button key={p.id} className={watched === p.id ? 'on' : ''}
                onClick={() => setWatched(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
          <div className="obj" style={{ marginTop: 12, minWidth: 0 }}>
            <div className="oref">ZREVRANK result</div>
            <div className="ofield">player: <b>{watchedPlayer?.name}</b></div>
            <div className="ofield">score: <b>{watchedPlayer?.score.toLocaleString()}</b></div>
            <div className="ofield">rank: <b>#{watchedRank}</b> of {players.length}</div>
            {lastGains[watched] != null && (
              <div className="ofield" style={{ color: '#2E9E6B' }}>
                last gain: <b>+{lastGains[watched]}</b>
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#7c8aa5', marginTop: 8 }}>
            Round {round} complete — all ops O(log N)
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Demo 2 — Top-K Min-Heap Visualizer
   100 simulated players. "Find Top 5" animates the heap scan.
   ============================================================ */
function generateScores(n) {
  const names = ['Zara','Yusuf','Xena','Willow','Vera','Uma','Teo','Soren','Riya','Quinn',
    'Pia','Owen','Nora','Milo','Luna','Kai','Jules','Iris','Hugo','Gwen',
    'Finn','Elsa','Diego','Cleo','Blake','Aria','Ash','Bo','Cy','Dot',
    'Ed','Faye','Gil','Hal','Ida','Jem','Kit','Lee','Mae','Ned',
    'Ona','Paz','Rex','Sky','Tao','Ula','Val','Wren','Yael','Zoe',
    'Amir','Bex','Cruz','Dani','Eli','Fern','Gray','Hana','Ines','Jake',
    'Kira','Lev','Mads','Nell','Obi','Pax','Quin','Ros','Sam','Tia',
    'Uri','Vex','Wes','Xio','Yara','Zen','Ada','Ben','Cai','Dee',
    'Eke','Flo','Gus','Hob','Iko','Jin','Kim','Lux','Mab','Nev',
    'Odo','Pip','Reo','Syl','Tam','Uwe','Via','Win','Xan','Yen']
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    name: names[i % names.length] + (i >= names.length ? String(Math.floor(i/names.length)+1) : ''),
    score: Math.floor(Math.random() * 10000),
  }))
}

const ALL_SCORES = generateScores(100)

function TopKHeap() {
  const K = 5
  const [step, setStep] = useState(-1)   // -1 = not started; 0..99 = processing index; 100 = done
  const [heap, setHeap] = useState([])   // sorted min-heap (lowest score at index 0)
  const [heapOps, setHeapOps] = useState(0)
  const [sortOps, setSortOps] = useState(0)

  function startOver() {
    setStep(-1)
    setHeap([])
    setHeapOps(0)
    setSortOps(0)
  }

  function nextStep() {
    if (step >= ALL_SCORES.length - 1) return
    const nextIdx = step + 1
    const entry = ALL_SCORES[nextIdx]

    setHeap(prev => {
      let h = [...prev]
      if (h.length < K) {
        h.push(entry)
        h.sort((a, b) => a.score - b.score)
        setHeapOps(o => o + 1)
      } else if (entry.score > h[0].score) {
        h[0] = entry
        h.sort((a, b) => a.score - b.score)
        setHeapOps(o => o + 1)
      }
      return h
    })
    setSortOps(o => o + Math.ceil(Math.log2(K + 1)))
    setStep(nextIdx)
  }

  function runAll() {
    let h = []
    let ops = 0
    for (const entry of ALL_SCORES) {
      if (h.length < K) {
        h.push(entry)
        h.sort((a, b) => a.score - b.score)
        ops++
      } else if (entry.score > h[0].score) {
        h[0] = entry
        h.sort((a, b) => a.score - b.score)
        ops++
      }
    }
    setHeap(h)
    setHeapOps(ops)
    setSortOps(ALL_SCORES.length * Math.ceil(Math.log2(K + 1)))
    setStep(ALL_SCORES.length - 1)
  }

  const current = step >= 0 && step < ALL_SCORES.length ? ALL_SCORES[step] : null
  const isDone = step >= ALL_SCORES.length - 1
  const finalTop = isDone ? [...heap].sort((a, b) => b.score - a.score) : []

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Top-K min-heap (O(N log K) vs O(N log N) sort)</div>
      <p style={{ fontSize: 14, marginBottom: 12, color: '#4a5568' }}>
        100 players. Find the top {K} by score. The min-heap keeps only {K} slots — it evicts the
        lowest when a bigger score arrives. Compare heap ops vs a full sort.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button className="act" onClick={nextStep} disabled={isDone || step < -1}>
          {step === -1 ? '▶ Start — process player 1' : isDone ? '✔ Done' : `▶ Process player ${step + 2}`}
        </button>
        <button className="ghost act" onClick={runAll} disabled={isDone}>⚡ Run all 100</button>
        <button className="ghost act" onClick={startOver}>Reset</button>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Heap contents */}
        <div style={{ flex: '1 1 220px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>
            Min-heap (size ≤ {K}) — min score at top
          </div>
          {heap.length === 0 ? (
            <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: 13 }}>empty — press Start</div>
          ) : (
            [...heap].sort((a, b) => a.score - b.score).map((p, i) => (
              <div key={p.id} style={{
                padding: '6px 10px', marginBottom: 5,
                background: i === 0 ? '#FFF3CD' : '#F0FFF4',
                border: `1.5px solid ${i === 0 ? '#C9A227' : '#2E9E6B'}`,
                borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: 12,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{i === 0 ? '⬆ min (next evict)' : `  slot ${i+1}`}</span>
                <span><b>{p.name}</b> — {p.score.toLocaleString()}</span>
              </div>
            ))
          )}
          {current && !isDone && (
            <div style={{ marginTop: 10, padding: '6px 10px', background: '#EEF3FF',
              border: '1.5px solid #2D5BFF', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }}>
              Now processing: <b>{current.name}</b> score {current.score.toLocaleString()}
              {heap.length === K && current.score <= heap[0].score
                ? ' → score too low, skip'
                : heap.length < K
                  ? ' → heap not full, insert'
                  : ' → bigger than min, replace!'}
            </div>
          )}
        </div>
        {/* Stats */}
        <div style={{ flex: '0 0 200px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>
            Operation counters
          </div>
          <div className="obj" style={{ minWidth: 0 }}>
            <div className="ofield">scanned: <b>{step + 1}</b> / 100</div>
            <div className="ofield">heap inserts/replaces: <b>{heapOps}</b></div>
            <div className="ofield">comparisons (log K): <b>~{sortOps}</b></div>
            <div className="ofield" style={{ borderTop: '1px solid #eee', marginTop: 6, paddingTop: 6 }}>
              This approach (O(N log K))
            </div>
            <div className="ofield" style={{ color: '#2E9E6B' }}>ops ≈ <b>{ALL_SCORES.length * Math.ceil(Math.log2(K+1))}</b></div>
            <div className="ofield" style={{ marginTop: 4 }}>Sort-all (O(N log N))</div>
            <div className="ofield" style={{ color: '#D97B29' }}>ops ≈ <b>{Math.round(ALL_SCORES.length * Math.log2(ALL_SCORES.length))}</b></div>
          </div>
          {isDone && (
            <div style={{ marginTop: 10, padding: 8, background: '#F0FFF4',
              border: '1px solid #2E9E6B', borderRadius: 6, fontSize: 13 }}>
              <strong>Final Top {K}:</strong>
              {finalTop.map((p, i) => (
                <div key={p.id} style={{ fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
                  #{i+1} {p.name} — {p.score.toLocaleString()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Demo 3 — Weekly Time-Bucket Leaderboard
   Two sorted sets: "This Week" and "Last Week".
   Add scores, ZUNIONSTORE, simulate week rollover.
   ============================================================ */
const BUCKET_PLAYERS = ['Alice','Bob','Carol','Dave','Eve']

function TimeBucketLeaderboard() {
  const [thisWeek, setThisWeek] = useState({})    // { name: score }
  const [lastWeek, setLastWeek] = useState({ Alice: 800, Bob: 1200, Carol: 300, Dave: 600, Eve: 950 })
  const [mergeView, setMergeView] = useState(false)
  const [weekNum, setWeekNum] = useState(7)
  const [selectedPlayer, setSelectedPlayer] = useState('Alice')
  const [addAmt, setAddAmt] = useState(200)

  function addScore() {
    const amt = Math.max(1, Number(addAmt) || 200)
    setThisWeek(prev => ({ ...prev, [selectedPlayer]: (prev[selectedPlayer] || 0) + amt }))
  }

  function rollWeek() {
    setLastWeek(thisWeek)
    setThisWeek({})
    setMergeView(false)
    setWeekNum(w => w + 1)
  }

  function merged() {
    const m = {}
    BUCKET_PLAYERS.forEach(p => {
      m[p] = (thisWeek[p] || 0) + (lastWeek[p] || 0)
    })
    return m
  }

  function renderSet(scores, label, color) {
    const sorted = BUCKET_PLAYERS
      .map(p => ({ name: p, score: scores[p] || 0 }))
      .sort((a, b) => b.score - a.score)
    return (
      <div style={{ flex: '1 1 160px' }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color, marginBottom: 6, fontWeight: 700 }}>
          {label}
        </div>
        {sorted.map((p, i) => (
          <div key={p.name} style={{
            padding: '5px 10px', marginBottom: 4,
            background: '#fff', border: `1.5px solid ${p.score > 0 ? color : '#ddd'}`,
            borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: 12,
            display: 'flex', justifyContent: 'space-between', opacity: p.score === 0 ? 0.4 : 1,
          }}>
            <span>#{i+1} {p.name}</span>
            <span style={{ color: p.score > 0 ? '#1B2A4A' : '#aaa' }}>{p.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }

  const mergedScores = merged()

  return (
    <div className="panel">
      <div className="ptitle">Live demo · time-bucket leaderboard (ZUNIONSTORE)</div>
      <p style={{ fontSize: 14, marginBottom: 12, color: '#4a5568' }}>
        Scores live in separate sorted sets per week. ZUNIONSTORE merges them for a multi-week view.
        "New Week" rolls over — old last-week expires, this-week becomes last-week.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <select className="txt" value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}
          style={{ padding: '6px 10px', fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
          {BUCKET_PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input className="txt" type="number" value={addAmt} min={1} max={5000}
          onChange={e => setAddAmt(e.target.value)}
          style={{ width: 80, padding: '6px 10px' }} />
        <button className="act" onClick={addScore}>ZINCRBY this-week</button>
        <button className="ghost act" onClick={() => setMergeView(v => !v)}>
          {mergeView ? 'Hide merge' : 'ZUNIONSTORE (show merged)'}
        </button>
        <button className="ghost act" onClick={rollWeek} style={{ borderColor: '#D9534F', color: '#D9534F' }}>
          🗓 New Week (expire last-week)
        </button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
        {renderSet(lastWeek, `leaderboard:week-${weekNum - 1} (last week)`, '#C9A227')}
        {renderSet(thisWeek, `leaderboard:week-${weekNum} (this week)`, '#2D5BFF')}
        {mergeView && renderSet(mergedScores, `ZUNIONSTORE → last-2-weeks`, '#2E9E6B')}
      </div>
      <div style={{ fontSize: 12, color: '#7c8aa5', fontFamily: 'IBM Plex Mono' }}>
        Current week: {weekNum} · ZADD/ZINCRBY = O(log N) · ZUNIONSTORE = O(N log N) across K sets
      </div>
    </div>
  )
}

/* ============================================================
   Quiz
   ============================================================ */
const QUESTIONS = [
  {
    q: 'What is the time complexity of adding or updating a score in a Redis sorted set?',
    o: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    a: 1,
    e: 'Redis sorted set uses a skip list. Insert and update (ZADD/ZINCRBY) are O(log N) where N is the number of members in the set.',
    w: {
      0: 'O(1) would be a hash map with no ordering — adding an element to a sorted structure always costs at least O(log N) to find the right position.',
      2: 'O(N) would mean scanning all N members every time — that is what a plain unsorted list would cost, not a skip list.',
      3: 'O(N log N) is the cost of sorting a full array. The sorted set maintains sorted order incrementally, so each insert is only O(log N).',
    },
    r: { id: 's2', label: 'Section 2 — Redis Sorted Set' },
  },
  {
    q: 'You need the top-K items from a stream of N scores (K much smaller than N). Which approach is best?',
    o: ['Use a hash map keyed by score', 'Use a min-heap of size K', 'Scan twice: once for max, once for second-max…', 'Sort all N scores with Arrays.sort()'],
    a: 1,
    e: 'A min-heap of size K runs in O(N log K) time and O(K) space. Since K << N, this is far cheaper than sorting all N elements at O(N log N).',
    w: {
      0: 'A hash map by score cannot efficiently answer "the top-K" — you would still need to extract and sort O(N) entries.',
      2: 'Scanning once per rank costs O(N × K) which is far worse than O(N log K) for large K.',
      3: 'Sorting all N scores costs O(N log N) and O(N) space — you process and keep far more than you need.',
    },
    r: { id: 's6', label: 'Section 6 — In-process Top-K' },
  },
  {
    q: 'What does ZINCRBY do in Redis? Why is it important for leaderboards?',
    o: [
      'Returns the rank of a member by score descending',
      'Inserts a new member; has no effect if member already exists',
      'Deletes a member from the sorted set',
      'Atomically increments a member\'s score by a delta, creating the member if absent',
    ],
    a: 3,
    e: 'ZINCRBY is an atomic increment: it reads the current score, adds the delta, and writes back — all in one Redis command. This prevents lost updates from concurrent score events.',
    w: {
      0: 'That is ZREVRANK — it returns position, it does not change anything.',
      1: 'That would be ZADD NX — it only adds if the member is absent. ZINCRBY always updates the score.',
      2: 'That is ZREM — it removes a member entirely.',
    },
    r: { id: 's2', label: 'Section 2 — Redis Sorted Set' },
  },
  {
    q: 'Why is a plain SQL ORDER BY LIMIT 10 often unsuitable for a real-time leaderboard with millions of score updates per second?',
    o: [
      'SQL always does a full table scan regardless of indexes',
      'SQL ORDER BY cannot sort by numbers',
      'SQL databases do not support LIMIT',
      'SQL is not designed for millions of concurrent atomic increments; the index read is also not as fast as a purpose-built sorted set',
    ],
    a: 3,
    e: 'SQL ORDER BY LIMIT is fine for occasional queries but databases are not designed for atomic ZINCRBY-style increments at very high throughput. Redis sorted set is purpose-built for this workload.',
    w: {
      0: 'With a proper index on the score column, SQL avoids a full table scan. The bottleneck is write throughput and lack of an atomic increment, not the query itself.',
      1: 'SQL can sort by any type including numbers — not the issue.',
      2: 'SQL absolutely supports LIMIT — this is not the constraint.',
    },
    r: { id: 's3', label: 'Section 3 — Why not SQL' },
  },
  {
    q: 'You want a "this week" leaderboard that auto-expires. Which approach does production typically use?',
    o: [
      'A separate sorted set per time bucket (week/day) with TTL to auto-expire old buckets',
      'One giant sorted set with timestamp encoded in the score',
      'A relational table with a WHERE score_date > NOW() - 7 DAYS clause',
      'Replaying the full event log every time a query arrives',
    ],
    a: 0,
    e: 'Separate sorted sets per time period (e.g. leaderboard:2024-W01) is the production default. Writes go to the current bucket; ZUNIONSTORE merges for cross-period queries. TTL automatically expires old buckets.',
    w: {
      1: 'Encoding timestamps into scores breaks score arithmetic (you cannot ZINCRBY naturally) and makes range queries complex.',
      2: 'A SQL WHERE clause on date works for moderate traffic but does not scale to millions of real-time updates.',
      3: 'Replaying the full event log is accurate but far too slow for real-time query latency — used for rebuilding projections, not serving queries.',
    },
    r: { id: 's5', label: 'Section 5 — Sliding Window Leaderboard' },
  },
  {
    q: 'What does Count-Min Sketch solve that a plain min-heap does not?',
    o: [
      'It finds exact top-K, unlike a heap which can miss elements',
      'It sorts faster than O(N log K)',
      'It allows approximate frequency counting with fixed memory regardless of the number of distinct items',
      'It works only for integers, while a heap handles any comparable type',
    ],
    a: 2,
    e: 'Count-Min Sketch uses a small fixed-size matrix of hash counters. For "trending hashtags" with millions of distinct items, it tracks approximate frequencies in constant memory — a heap alone would require O(N) memory to process N distinct items.',
    w: {
      0: 'Count-Min Sketch is approximate — it may slightly over-count. It trades accuracy for memory efficiency.',
      1: 'Count-Min Sketch does not change the top-K extraction speed. A heap is still used to extract the final top-K from the sketch.',
      3: 'Heaps work with any Comparable type. That is not what Count-Min Sketch addresses.',
    },
    r: { id: 's6', label: 'Section 6 — In-process Top-K' },
  },
  {
    q: 'In a distributed leaderboard with one sorted set per region, what is the trade-off of a periodic merge (every 1 minute) into a global set?',
    o: [
      'Rank queries become O(N) instead of O(log N)',
      'Redis sorted sets cannot be merged across servers',
      'The global leaderboard is up to 1 minute stale; freshness is traded for scalability',
      'Write amplification — every score update goes to all regions',
    ],
    a: 2,
    e: 'Each region writes to its own sorted set (fast, local). A periodic job merges them into the global leaderboard. The cost: the global view can be up to one merge-interval stale. This is acceptable for most leaderboards.',
    w: {
      0: 'ZINCRBY and ZREVRANK remain O(log N) on each individual sorted set — merging does not change per-set complexity.',
      1: 'Redis supports ZUNIONSTORE across keys on the same instance. Cross-server merges require a job that reads from each region and writes to the global instance.',
      3: 'Write amplification would be a fan-out problem — writing to all regions on every event. The described pattern writes locally only.',
    },
    r: { id: 's9', label: 'Section 9 — Distributed Leaderboard' },
  },
  {
    q: 'A min-heap of size K holds the current top-K candidates. A new score arrives that is smaller than the heap\'s minimum. What happens?',
    o: [
      'The new score is discarded — it cannot be in the top K',
      'The new score replaces the heap minimum',
      'The new score is inserted and the heap grows to K+1',
      'The heap is rebuilt from scratch',
    ],
    a: 0,
    e: 'The min-heap keeps the K largest scores seen so far. Its minimum is the smallest of those K. Any new score smaller than the current minimum cannot be in the top K, so it is simply ignored in O(1).',
    w: {
      1: 'We only replace the minimum when the new score is LARGER — only then does the new score belong in the top K.',
      2: 'The heap is capped at size K — growing beyond K would defeat the purpose of the bounded structure.',
      3: 'Rebuilding from scratch would cost O(K log K) unnecessarily. The min-heap lets us discard in O(1) and replace in O(log K).',
    },
    r: { id: 's6', label: 'Section 6 — In-process Top-K' },
  },
]

/* ============================================================
   Page
   ============================================================ */
export default function Day89() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 89</div>
        <h1>Leaderboard &amp; Top-K:<br />Sorted Sets and the Min-Heap</h1>
        <p>
          Millions of score updates per second. Return the top-K players instantly.
          Learn the data structure that makes both fast — and when to use a heap instead.
          Click every demo.
        </p>
        <div className="chips">
          {['Sorted Set','ZINCRBY','ZREVRANGE','Top-K','Min-Heap','Sliding Window','Count-Min Sketch'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 — Analogy + defining constraint */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The stadium scoreboard analogy</h2>
        <p>
          Imagine a stadium with 10,000 players. After every single point, the scoreboard updates.
          It does not sort all 10,000 players from scratch — that would take too long.
          Instead, it slides the updated player's tile to its new position in the already-sorted board.
        </p>
        <p>
          That is exactly what a <strong>sorted set</strong> does. Every insert or update costs
          O(log N) — not O(N log N) like a full re-sort. And reading the top K costs O(log N + K).
          Both are fast even at millions of players.
        </p>
        <Code html={`<span class="cm">// The two key operations for a leaderboard:</span>
<span class="cm">// 1. Update score (after a player earns points)</span>
<span class="cm">// 2. Query top K (render the leaderboard screen)</span>

<span class="cm">// Naive approach — don't do this:</span>
<span class="kw">List</span>&lt;Player&gt; all = db.getAllPlayers();       <span class="cm">// O(N) — load everyone</span>
all.sort(Comparator.comparingInt(Player::getScore).reversed()); <span class="cm">// O(N log N) — sort all</span>
<span class="kw">return</span> all.subList(<span class="num">0</span>, k);               <span class="cm">// top K</span>

<span class="cm">// Sorted set approach — both ops are O(log N):</span>
sortedSet.update(userId, newScore);           <span class="cm">// slide the tile — O(log N)</span>
<span class="kw">return</span> sortedSet.topK(k);                   <span class="cm">// read top K — O(log N + K)</span>`} />
        <Note>
          The <strong>defining constraint</strong> of a leaderboard: you need O(log N) on BOTH write
          (score update) and read (top K query). A sorted set — backed by a skip list or balanced BST — provides
          exactly this. A plain sorted array gives O(1) read but O(N) write.
        </Note>
      </section>

      {/* S2 — Redis Sorted Set */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Redis Sorted Set — ZADD, ZINCRBY, ZREVRANGE, ZREVRANK</h2>
        <p>
          Redis has a native sorted set. It is the industry-standard tool for leaderboards.
          You do not build the sorted structure yourself — Redis handles it.
          From Java, you use the <strong>Lettuce</strong> or <strong>Jedis</strong> client.
        </p>
        <Code html={`<span class="cm">// ─── Redis commands (run in redis-cli or via Java client) ─────────────</span>

<span class="cm">// Add a member with a score (or update score if member exists)</span>
ZADD leaderboard <span class="num">9500</span> "alice"            <span class="cm">// O(log N)</span>
ZADD leaderboard <span class="num">8200</span> "bob"              <span class="cm">// O(log N)</span>

<span class="cm">// Atomically increment a score (the key leaderboard command)</span>
ZINCRBY leaderboard <span class="num">150</span> "alice"         <span class="cm">// alice: 9500 → 9650, O(log N)</span>

<span class="cm">// Get top 10 by score descending, with their scores</span>
ZREVRANGE leaderboard <span class="num">0</span> <span class="num">9</span> WITHSCORES   <span class="cm">// O(log N + K)</span>

<span class="cm">// Get a user's rank (0-indexed from top)</span>
ZREVRANK leaderboard "alice"             <span class="cm">// → 0 means #1, O(log N)</span>

<span class="cm">// ─── Java equivalent using Lettuce client ─────────────────────────────</span>
<span class="kw">import</span> io.lettuce.core.ScoredValue;
<span class="kw">import</span> io.lettuce.core.api.sync.RedisCommands;

RedisCommands&lt;String, String&gt; redis = connection.sync();

<span class="cm">// After a player completes a level:</span>
redis.zincrby(<span class="str">"leaderboard:global"</span>, scoreGained, userId);  <span class="cm">// atomic increment</span>

<span class="cm">// Render the top-10 leaderboard:</span>
List&lt;ScoredValue&lt;String&gt;&gt; top10 =
    redis.zrevrangeWithScores(<span class="str">"leaderboard:global"</span>, <span class="num">0</span>, <span class="num">9</span>);

<span class="cm">// Show a user their own rank:</span>
Long rank = redis.zrevrank(<span class="str">"leaderboard:global"</span>, userId); <span class="cm">// 0-indexed</span>
<span class="kw">long</span> displayRank = rank + <span class="num">1</span>;    <span class="cm">// show "Rank #1" not "Rank #0"</span>`} />
        <Code html={`<span class="cm">// ─── Complexity summary ──────────────────────────────────────────────
//
//  ZADD / ZINCRBY (add or update)    →  O(log N)
//  ZREVRANGE (get top K)             →  O(log N + K)
//  ZREVRANK (get a user's rank)      →  O(log N)
//  ZCARD (total number of members)   →  O(1)
//
//  N = total members in the sorted set
//  K = how many entries you fetch
//
//  All fast enough for millions of updates per second.</span>`} />
        <Good>
          ZINCRBY is atomic. Even if 100 game servers call it at the same moment for the same user,
          each increment is applied exactly once. No lost updates. This is what makes Redis sorted set
          the right tool — not just the speed, but the atomicity.
        </Good>
        <Reveal summary="Under the hood: what is a skip list?">
          <p>
            Redis sorted set is backed by a <strong>skip list</strong> — a probabilistic data structure
            with multiple "express lanes" like a highway. The bottom lane has every node. Each
            upper lane skips over some nodes. A search walks down from the top lane, taking shortcuts.
            This gives O(log N) expected time for insert, delete, and search — similar to a balanced BST,
            but simpler to implement and faster in practice for range queries.
          </p>
          <p>
            Redis also uses a <strong>zip list</strong> (compact array) when the sorted set is small
            (fewer than 128 members by default). It switches to skip list automatically as the set grows.
          </p>
        </Reveal>
      </section>

      {/* S3 — Why not SQL */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Why not SQL ORDER BY for real-time leaderboards?</h2>
        <p>
          This is a common interview question. SQL can rank data — but it is the wrong tool
          when scores update millions of times per second.
        </p>
        <Code html={`<span class="cm">// SQL leaderboard query — works fine for small traffic</span>
<span class="kw">SELECT</span> user_id, score
<span class="kw">FROM</span> player_scores
<span class="kw">ORDER BY</span> score <span class="kw">DESC</span>
<span class="kw">LIMIT</span> <span class="num">10</span>;

<span class="cm">// SQL score update — NOT atomic increment by default</span>
<span class="kw">UPDATE</span> player_scores
<span class="kw">SET</span> score = score + <span class="num">150</span>    <span class="cm">// this IS atomic in SQL (SET = expression)</span>
<span class="kw">WHERE</span> user_id = <span class="str">'alice'</span>;`} />
        <p>
          Actually, the SQL update above IS atomic. So why is SQL still the wrong choice?
        </p>
        <table className="matrix" style={{ marginBottom: 16 }}>
          <thead>
            <tr>
              <th>Concern</th>
              <th>SQL + index</th>
              <th>Redis sorted set</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Write throughput (score update)</td><td className="no">~10K ops/sec typical</td><td className="yes">~1M ops/sec</td></tr>
            <tr><td>Top-K query latency</td><td className="no">~10ms (index scan)</td><td className="yes">~0.1ms (skip list)</td></tr>
            <tr><td>Atomic rank update</td><td className="no">Needs transaction for read-rank-write</td><td className="yes">ZINCRBY + ZREVRANK native</td></tr>
            <tr><td>Purpose-built for leaderboards</td><td className="no">General-purpose</td><td className="yes">Purpose-built</td></tr>
            <tr><td>TTL / auto-expiry for time windows</td><td className="no">Manual cleanup job</td><td className="yes">EXPIRE command</td></tr>
          </tbody>
        </table>
        <Warn>
          Use SQL for persistent storage of user profiles and history.
          Use Redis sorted set for the real-time ranking layer on top. They complement each other.
        </Warn>
      </section>

      {/* S4 — Interactive Demo 1 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: live sorted set leaderboard</h2>
        <p>
          Six players compete. Each round distributes score gains (weighted — some players tend
          to earn more). Watch the leaderboard re-sort after each round. Pick any player to track
          their rank in the ZREVRANK panel.
        </p>
        <LiveLeaderboard />
        <Good>
          Notice: the leaderboard re-sorts on every round but each individual update is O(log N).
          Rank changes are instant because the sorted set is always maintained in order.
        </Good>
      </section>

      {/* S5 — Sliding Window */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Sliding window leaderboard — "top scores this week"</h2>
        <p>
          A global all-time leaderboard is simple — one sorted set. A "this week" leaderboard
          is harder. Old scores must expire. There are three approaches.
        </p>
        <Code html={`<span class="cm">// ─── Approach A: separate sorted set per time bucket ─────────────────
// One sorted set per week. Write to the current week's set.
// ZUNIONSTORE merges multiple sets for cross-period queries.</span>

ZADD leaderboard:2024-W01 <span class="num">4200</span> "alice"
ZADD leaderboard:2024-W01 <span class="num">3800</span> "bob"
ZADD leaderboard:2024-W02 <span class="num">5100</span> "alice"   <span class="cm">// new week, new set</span>

<span class="cm">// "Top players this month" = union of 4 week sets</span>
ZUNIONSTORE leaderboard:month <span class="num">4</span>
    leaderboard:2024-W01 leaderboard:2024-W02
    leaderboard:2024-W03 leaderboard:2024-W04
EXPIRE leaderboard:month <span class="num">3600</span>           <span class="cm">// cache the result for 1 hour</span>
EXPIRE leaderboard:2024-W01 <span class="num">2592000</span>    <span class="cm">// TTL = 30 days, then auto-deleted</span>

<span class="cm">// ─── Approach B: event log + periodic rebuild ─────────────────────────
// Store every score event with a timestamp.
// A cron job runs every 1 min, rebuilds the leaderboard
// by summing only events WHERE timestamp &gt; now() - 7 days.
// Accurate but not real-time (stale by up to 1 minute).</span>

<span class="cm">// ─── Approach C: composite score (clever but brittle) ────────────────
// Encode timestamp into the score:</span>
<span class="kw">long</span> compositeScore = baseScore * <span class="num">10_000_000_000L</span> + timestamp;
<span class="cm">// ZRANGEBYSCORE to filter by time range.
// Problem: breaks ZINCRBY arithmetic. Rarely used.</span>`} />
        <Note>
          <strong>Production default:</strong> Approach A (separate sorted set per time bucket + TTL).
          Writes are always to the current bucket (cheap). Merges happen only on query (acceptable).
          Expired buckets are auto-deleted by Redis TTL — no cleanup code needed.
        </Note>
        <Reveal summary="What is the write pattern for a daily active leaderboard?">
          <p>
            Keep three sorted sets: <C>leaderboard:today</C>, <C>leaderboard:week</C>,
            <C>leaderboard:all-time</C>. On every score event, do a pipeline (batch) of three
            ZINCRBY commands. Each is O(log N). Total cost: 3 × O(log N) per event.
            Today's set gets a EXPIRE of 24 hours. Week's set gets 7 days.
            No background jobs needed.
          </p>
        </Reveal>
      </section>

      {/* S6 — In-process Top-K */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>In-process Top-K — min-heap and Count-Min Sketch</h2>
        <p>
          What if Redis is not available? Or you are in an interview with no external dependencies?
          The in-process answer is a <strong>min-heap of size K</strong>.
        </p>
        <Code html={`<span class="cm">// ─── Top-K with a min-heap ────────────────────────────────────────────</span>
<span class="kw">import</span> java.util.PriorityQueue;

<span class="kw">public</span> List&lt;Player&gt; topK(List&lt;Player&gt; players, <span class="kw">int</span> k) {
    <span class="cm">// Min-heap: the smallest score in the heap is at the top (index 0).</span>
    <span class="cm">// We always keep exactly k players in it.</span>
    PriorityQueue&lt;Player&gt; heap = <span class="kw">new</span> PriorityQueue&lt;&gt;(
        Comparator.comparingInt(Player::score)  <span class="cm">// min at top</span>
    );

    <span class="kw">for</span> (Player p : players) {                 <span class="cm">// O(N) iterations</span>
        heap.offer(p);                          <span class="cm">// insert — O(log K)</span>
        <span class="kw">if</span> (heap.size() &gt; k) {
            heap.poll();                        <span class="cm">// evict the smallest — O(log K)</span>
        }
        <span class="cm">// heap.size() never exceeds k+1 before the poll</span>
    }

    <span class="cm">// heap now contains the top-K players (in heap order, not sorted)</span>
    List&lt;Player&gt; result = <span class="kw">new</span> ArrayList&lt;&gt;(heap);
    result.sort(Comparator.comparingInt(Player::score).reversed()); <span class="cm">// O(K log K)</span>
    <span class="kw">return</span> result;                             <span class="cm">// Total: O(N log K)</span>
}

<span class="cm">// Time: O(N log K)    — much better than O(N log N) sort when K &lt;&lt; N
// Space: O(K)         — only K elements in memory at once</span>`} />
        <p>
          For very large cardinality — "top trending hashtags from 1 billion tweets" — even a
          min-heap requires O(N) memory to process N distinct items. The answer there is
          <strong> Count-Min Sketch</strong>.
        </p>
        <Code html={`<span class="cm">// ─── Count-Min Sketch (conceptual) ────────────────────────────────────
//
//  A 2D array of counters: d rows × w columns
//  d = number of hash functions (typically 3–5)
//  w = width (typically 1000–10000)
//
//  UPDATE hashtag "#Java":
//    for each row i: counters[i][hash_i("#Java") % w]++
//
//  QUERY "#Java" frequency:
//    estimate = min(counters[i][hash_i("#Java") % w]) for all rows i
//    (take the minimum across all rows — over-counts from collisions excluded)
//
//  SPACE: d × w integers — constant, regardless of N distinct items!
//  ACCURACY: slight over-count (never under-count), controlled by d and w.</span>

<span class="cm">// Count-Min Sketch + min-heap of size K = approximate Top-K in O(1) space per item:
//  1. Update sketch on each event — O(d) = O(1)
//  2. Query frequency estimate — O(d) = O(1)
//  3. Maintain a min-heap of K "heavy hitters" — evict if estimate drops below heap min</span>`} />
        <Note>
          For an interview: say "min-heap of size K, O(N log K)" — that is the expected answer.
          Mention Count-Min Sketch as a bonus if the interviewer pushes on cardinality constraints.
        </Note>
      </section>

      {/* S7 — Demo 2 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>Play: Top-K min-heap step-through</h2>
        <p>
          100 players with random scores. Step through one at a time or run all at once.
          Watch the min-heap maintain exactly 5 slots — evicting the smallest whenever
          a new score beats it. Compare operation counts against full sort.
        </p>
        <TopKHeap />
        <Good>
          The heap only grows when a score is better than the current minimum.
          Most of the 100 players are discarded in O(1) — only ~5–10% trigger an O(log K) heap replace.
          That is why O(N log K) beats O(N log N) for small K.
        </Good>
      </section>

      {/* S8 — Demo 3 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>Play: weekly time-bucket leaderboard</h2>
        <p>
          Two sorted sets: last week and this week. Add scores to this week.
          Click "ZUNIONSTORE" to see a merged 2-week view.
          Click "New Week" to roll over — last week expires and this week becomes last week.
        </p>
        <TimeBucketLeaderboard />
        <Good>
          ZUNIONSTORE sums scores across buckets. The result is a merged sorted set you can query
          like any other. After the week rollover, the old bucket is gone — auto-expired by TTL.
          No cleanup code, no background jobs needed for expiry.
        </Good>
      </section>

      {/* S9 — Distributed + cheat sheet */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Distributed leaderboard + cheat sheet</h2>
        <h3 style={{ marginTop: 0, fontSize: 17 }}>Scaling across regions</h3>
        <p>
          One global Redis sorted set becomes a bottleneck at massive scale.
          The fix: one sorted set per region, with a periodic merge to the global leaderboard.
        </p>
        <Code html={`<span class="cm">// ─── Distributed leaderboard architecture ─────────────────────────────
//
//  [US-EAST servers] → ZINCRBY leaderboard:us-east userId score
//  [EU-WEST servers] → ZINCRBY leaderboard:eu-west userId score
//  [AP-SOUTH servers]→ ZINCRBY leaderboard:ap-south userId score
//
//  Every 60 seconds, a merge job runs:
//    ZUNIONSTORE leaderboard:global 3
//        leaderboard:us-east leaderboard:eu-west leaderboard:ap-south
//
//  Queries hit leaderboard:global (read replica, 1-minute stale)
//
//  Trade-off table:
//  ┌────────────────────────────────┬───────────────────────────────┐
//  │  Benefit                       │  Cost                         │
//  ├────────────────────────────────┼───────────────────────────────┤
//  │  Write throughput scales       │  Global view up to 1 min stale│
//  │  Region writes are local       │  Merge job is a cron concern  │
//  │  No single write bottleneck    │  ZUNIONSTORE costs O(N log N) │
//  └────────────────────────────────┴───────────────────────────────┘</span>`} />
        <h3 style={{ fontSize: 17, marginTop: 20 }}>Cheat sheet</h3>
        <table className="matrix">
          <thead>
            <tr><th>Operation</th><th>Redis command</th><th>Complexity</th><th>Notes</th></tr>
          </thead>
          <tbody>
            <tr><td>Add / update score</td><td><C>ZADD</C></td><td className="yes">O(log N)</td><td>Creates member if absent</td></tr>
            <tr><td>Atomic increment</td><td><C>ZINCRBY</C></td><td className="yes">O(log N)</td><td>The leaderboard workhorse</td></tr>
            <tr><td>Top-K descending</td><td><C>ZREVRANGE 0 K-1</C></td><td className="yes">O(log N + K)</td><td>With WITHSCORES flag</td></tr>
            <tr><td>User's rank</td><td><C>ZREVRANK</C></td><td className="yes">O(log N)</td><td>0-indexed from top</td></tr>
            <tr><td>Merge time buckets</td><td><C>ZUNIONSTORE</C></td><td className="no">O(N log N)</td><td>Cache the result</td></tr>
            <tr><td>Auto-expire old bucket</td><td><C>EXPIRE</C></td><td className="yes">O(1)</td><td>Set TTL in seconds</td></tr>
            <tr><td>In-process top-K</td><td>Min-heap size K</td><td className="yes">O(N log K)</td><td>Better than sort when K &lt;&lt; N</td></tr>
            <tr><td>Very high cardinality</td><td>Count-Min Sketch + heap</td><td className="yes">O(d) per update</td><td>Approximate — slight over-count</td></tr>
          </tbody>
        </table>
        <ul style={{ marginTop: 16 }}>
          <li>A sorted set maintains order at all times — reads are free, writes are O(log N).</li>
          <li>ZINCRBY is atomic — safe from concurrent score updates without any locks.</li>
          <li>Use a min-heap of size K for in-process top-K in O(N log K) time and O(K) space.</li>
          <li>For time-windowed leaderboards, use separate sorted sets per bucket + TTL.</li>
          <li>For distributed leaderboards, write locally per region and merge periodically.</li>
          <li>Count-Min Sketch is for approximate top-K when cardinality is huge (billions of distinct items).</li>
        </ul>
      </section>

      {/* INTERVIEW CORNER */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>5 questions interviewers actually ask</h2>
        <Reveal summary="Q1: What are the time complexities of ZADD, ZINCRBY, ZREVRANGE, and ZREVRANK in Redis?">
          <p>
            All are O(log N) for the sorted-set part, where N is the number of members:
          </p>
          <ul>
            <li><strong>ZADD</strong> — O(log N) per element added.</li>
            <li><strong>ZINCRBY</strong> — O(log N). Remove old position, re-insert at new position in skip list.</li>
            <li><strong>ZREVRANGE</strong> — O(log N + K) where K is the number of elements returned.</li>
            <li><strong>ZREVRANK</strong> — O(log N). Walk the skip list levels to count position.</li>
          </ul>
          <p>
            If asked about ZUNIONSTORE: O(N × K + M log M) where N is the union size, K is the number of
            input sets, M is the output size. It is a heavier operation — cache the result.
          </p>
        </Reveal>
        <Reveal summary="Q2: Why does a min-heap of size K beat sorting all N elements for top-K?">
          <p>
            Sorting all N elements: O(N log N) time, O(N) space — you process and keep everything.
          </p>
          <p>
            Min-heap of size K: O(N log K) time, O(K) space. You scan N elements once.
            For each element, you do a heap push and possibly a heap pop — each O(log K).
            Since K &lt;&lt; N, log K &lt;&lt; log N, so total work is much less.
          </p>
          <p>
            Example: N = 1,000,000 users, K = 10. Sort: 20M operations. Heap: 40 operations per user
            × 1M = 40M? Wait — actually only the heap ops matter: N × log K = 1M × 3.3 ≈ 3.3M.
            vs N log N = 1M × 20 = 20M. Six times faster, and O(10) memory vs O(1M).
          </p>
        </Reveal>
        <Reveal summary="Q3: How do you implement a 'this week' leaderboard that automatically expires?">
          <p>
            <strong>Pattern: separate sorted set per time bucket + TTL.</strong>
          </p>
          <ol>
            <li>On every score event, call <C>ZINCRBY leaderboard:2024-W07 delta userId</C>.</li>
            <li>Also set a TTL on the key: <C>EXPIRE leaderboard:2024-W07 604800</C> (7 days in seconds).</li>
            <li>Actually, set the TTL once when you first create the key — use <C>SET NX EX</C> or a Lua script to avoid resetting it on every write.</li>
            <li>To query "this week": just query <C>leaderboard:2024-W07</C> directly — it auto-expires.</li>
            <li>To query "last 2 weeks": <C>ZUNIONSTORE leaderboard:recent 2 leaderboard:2024-W06 leaderboard:2024-W07</C>, then set a short TTL (e.g., 60 seconds) on the result key.</li>
          </ol>
        </Reveal>
        <Reveal summary="Q4: What is Count-Min Sketch and when do you use it instead of a heap?">
          <p>
            Count-Min Sketch is a probabilistic data structure that estimates the frequency of items
            in a data stream using a 2D array of counters and multiple hash functions.
          </p>
          <p>
            <strong>Update:</strong> for item X, increment <C>counters[i][hash_i(X) % width]</C> for each row i.
            <strong>Query:</strong> take the minimum across all rows.
          </p>
          <p>
            Use it when:
          </p>
          <ul>
            <li>Cardinality is so large (billions of distinct items) that even a HashMap to count frequencies would exceed memory.</li>
            <li>Approximate answers are acceptable (slight over-count, never under-count).</li>
            <li>Classic use case: "top trending hashtags on Twitter" — billions of distinct hashtags, but you only need the heavy hitters.</li>
          </ul>
          <p>
            You still need a min-heap of size K to extract the final top-K from the sketch estimates.
          </p>
        </Reveal>
        <Reveal summary="Q5: How do you scale a global leaderboard to multiple geographic regions?">
          <p>
            <strong>One sorted set per region</strong> with periodic global merge:
          </p>
          <ol>
            <li>Each region's game servers write to their local Redis: <C>ZINCRBY leaderboard:us-east delta userId</C>.</li>
            <li>A merge job runs every N seconds: <C>ZUNIONSTORE leaderboard:global K region1 region2 ...</C>.</li>
            <li>Read queries hit <C>leaderboard:global</C> (with read replicas for scale).</li>
          </ol>
          <p>
            <strong>Trade-off:</strong> the global leaderboard is stale by up to N seconds.
            For a game, this is acceptable — players do not need millisecond-fresh global ranks.
            If you need fresher data, run the merge more frequently or reduce the number of regions.
          </p>
          <p>
            <strong>Alternative (if truly real-time global rank is needed):</strong> use a single Redis Cluster
            with the sorted set sharded across slots, and accept the higher write latency from cross-slot ops.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="sq">
        <div className="sec-label">Section 10 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 89 complete?</strong> Homework: implement an in-process leaderboard in Java
        using <C>TreeMap&lt;Integer, List&lt;String&gt;&gt;</C> (score → list of players at that score).
        Support <C>addScore(player, delta)</C> and <C>topK(k)</C>. What is the complexity of each?
        How does it compare to the Redis sorted set approach?
        <br /><br />
        Next: <strong>Day 90 — Event-Driven Architecture</strong>: learn how large systems
        decouple services using events — Event Sourcing, CQRS, and the Saga pattern for distributed transactions.
      </div>
    </div>
  )
}
