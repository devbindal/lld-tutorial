import { useState, useEffect, useRef } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Follow graph & fan-out visualization
   ============================================================ */
const INIT_USERS = [
  { id: 'alice',   name: 'Alice',   x: 50,  y: 20,  followers: ['bob','carol','dave'], followerCount: 3,  isCeleb: false, color: '#2D5BFF' },
  { id: 'celeb',   name: 'Celeb',   x: 50,  y: 80,  followers: ['bob','carol','dave','eve','frank'], followerCount: 5, isCeleb: true, color: '#9C27B0' },
  { id: 'bob',     name: 'Bob',     x: 15,  y: 50,  followers: [], followerCount: 0,  isCeleb: false, color: '#4CAF50' },
  { id: 'carol',   name: 'Carol',   x: 35,  y: 50,  followers: [], followerCount: 0,  isCeleb: false, color: '#FF9800' },
  { id: 'dave',    name: 'Dave',    x: 65,  y: 50,  followers: [], followerCount: 0,  isCeleb: false, color: '#F44336' },
  { id: 'eve',     name: 'Eve',     x: 80,  y: 50,  followers: [], followerCount: 0,  isCeleb: false, color: '#009688' },
  { id: 'frank',   name: 'Frank',   x: 85,  y: 70,  followers: [], followerCount: 0,  isCeleb: false, color: '#795548' },
]
const CELEB_THRESHOLD = 4

function FanOutDemo() {
  const [highlighted, setHighlighted]   = useState([])      // user ids that received the post
  const [mode, setMode]                 = useState(null)     // 'fanout' | 'celeb' | null
  const [writeCount, setWriteCount]     = useState(0)
  const [animStep, setAnimStep]         = useState(-1)
  const timerRef = useRef(null)

  function clearState() {
    clearTimeout(timerRef.current)
    setHighlighted([])
    setMode(null)
    setWriteCount(0)
    setAnimStep(-1)
  }

  function runFanOut(posterId, followers, isCeleb) {
    clearState()
    if (isCeleb) {
      setMode('celeb')
      setWriteCount(0)
      setAnimStep(0)
      return
    }
    setMode('fanout')
    setAnimStep(0)
    let step = 0
    const hits = []
    function tick() {
      if (step < followers.length) {
        hits.push(followers[step])
        setHighlighted([...hits])
        setWriteCount(hits.length)
        setAnimStep(step + 1)
        step++
        timerRef.current = setTimeout(tick, 420)
      }
    }
    tick()
  }

  const posterAlice = INIT_USERS.find(u => u.id === 'alice')
  const posterCeleb = INIT_USERS.find(u => u.id === 'celeb')

  return (
    <div className="panel">
      <div className="ptitle">Live demo · fan-out visualization — click a "posts" button to see the write cascade</div>

      {/* SVG graph */}
      <svg viewBox="0 0 100 100" style={{ width: '100%', maxWidth: 380, display: 'block', margin: '0 auto 12px' }}>
        {/* edges from alice */}
        {posterAlice.followers.map(fid => {
          const f = INIT_USERS.find(u => u.id === fid)
          return (
            <line key={fid}
              x1={posterAlice.x} y1={posterAlice.y} x2={f.x} y2={f.y}
              stroke={highlighted.includes(fid) && mode === 'fanout' ? '#2D5BFF' : '#ccc'}
              strokeWidth={highlighted.includes(fid) && mode === 'fanout' ? 1.5 : 0.6}
              strokeDasharray={highlighted.includes(fid) && mode === 'fanout' ? '0' : '2 2'}
            />
          )
        })}
        {/* edges from celeb */}
        {posterCeleb.followers.map(fid => {
          const f = INIT_USERS.find(u => u.id === fid)
          return (
            <line key={'c-' + fid}
              x1={posterCeleb.x} y1={posterCeleb.y} x2={f.x} y2={f.y}
              stroke='#e0c0f0'
              strokeWidth={0.5}
              strokeDasharray='2 2'
            />
          )
        })}
        {/* nodes */}
        {INIT_USERS.map(u => {
          const isLit = highlighted.includes(u.id)
          const isPoster = u.id === 'alice' || u.id === 'celeb'
          return (
            <g key={u.id}>
              <circle cx={u.x} cy={u.y} r={isPoster ? 7 : 5.5}
                fill={isLit ? '#81C784' : u.color}
                stroke={isPoster ? '#222' : '#fff'}
                strokeWidth={isPoster ? 1 : 0.7}
                opacity={0.92}
              />
              <text x={u.x} y={u.y + (isPoster ? 11 : 9.5)}
                textAnchor="middle" fontSize={isPoster ? 4.5 : 3.8}
                fill="#333" fontFamily="IBM Plex Mono">
                {u.name}
              </text>
            </g>
          )
        })}
      </svg>

      {/* controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, justifyContent: 'center' }}>
        <button className="act" onClick={() => runFanOut('alice', posterAlice.followers, false)}>
          Alice posts (3 followers)
        </button>
        <button className="act" style={{ background: '#9C27B0', borderColor: '#9C27B0' }}
          onClick={() => runFanOut('celeb', posterCeleb.followers, true)}>
          Celeb posts (5 followers)
        </button>
        <button className="act ghost" onClick={clearState}>Reset</button>
      </div>

      {/* status panel */}
      <div style={{ minHeight: 52, background: '#f5f5f2', borderRadius: 8, padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>
        {mode === null && <span style={{ color: '#aaa' }}>Click a button above to see fan-out in action.</span>}
        {mode === 'fanout' && (
          <span>
            Fan-out-on-write: pushing to follower feeds...{' '}
            <b style={{ color: '#2D5BFF' }}>{writeCount} queue write{writeCount !== 1 ? 's' : ''} so far</b>
            {writeCount === posterAlice.followers.length && (
              <span style={{ color: '#2E9E6B' }}> — done! Feed prebuilt. Reads are now O(1).</span>
            )}
          </span>
        )}
        {mode === 'celeb' && (
          <span style={{ color: '#9C27B0' }}>
            <b>Celebrity threshold hit ({posterCeleb.followers.length} &gt;= {CELEB_THRESHOLD}).</b>
            {' '}Fan-out SKIPPED. Followers will pull this post on read (pull-on-read mode).
            Zero queue writes.
          </span>
        )}
      </div>

      <Good>
        Notice: Alice's post fans out (3 queue writes, one per follower — green edges light up one by one).
        Celeb's post is SKIPPED entirely — no writes at all. Followers pull the post when they open their feed.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 2 — Feed generation comparison (fan-out vs pull-on-read)
   ============================================================ */
const SAMPLE_POSTS = [
  { id: 'p1', author: 'Alice',  content: 'Just launched my new project!', time: '2 min ago',  score: 95 },
  { id: 'p2', author: 'Carol',  content: 'Beautiful sunset today 🌅',       time: '5 min ago',  score: 82 },
  { id: 'p3', author: 'Alice',  content: 'Working on a side project...',    time: '10 min ago', score: 78 },
  { id: 'p4', author: 'Dave',   content: 'Hot take: tabs > spaces',         time: '15 min ago', score: 91 },
  { id: 'p5', author: 'Carol',  content: 'Coffee and code morning ☕',       time: '20 min ago', score: 67 },
]

const PREBUILT_QUEUE = ['p1', 'p2', 'p3', 'p4', 'p5']  // already sorted in Bob's feed queue

function FeedComparisonDemo() {
  const [fanoutPhase, setFanoutPhase]   = useState('idle')   // idle | loading | done
  const [pullPhase, setPullPhase]       = useState('idle')   // idle | step1 | step2 | step3 | done
  const [pullStep, setPullStep]         = useState(0)
  const [queryCount, setQueryCount]     = useState(0)

  function openFanout() {
    setFanoutPhase('loading')
    setTimeout(() => setFanoutPhase('done'), 300)
  }

  function openPull() {
    setPullPhase('step1')
    setQueryCount(0)
    setPullStep(0)
  }

  function nextPullStep() {
    const next = pullStep + 1
    setPullStep(next)
    setQueryCount(next)
    if (next === 1)  setPullPhase('step1')
    if (next === 2)  setPullPhase('step2')
    if (next === 3)  setPullPhase('step3')
    if (next >= 3)   setTimeout(() => setPullPhase('done'), 600)
  }

  function reset() {
    setFanoutPhase('idle')
    setPullPhase('idle')
    setPullStep(0)
    setQueryCount(0)
  }

  const followees = ['Alice', 'Carol', 'Dave']

  return (
    <div className="panel">
      <div className="ptitle">Live demo · fan-out vs pull-on-read — open Bob's feed using each strategy</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>

        {/* LEFT — Fan-out */}
        <div style={{ flex: 1, minWidth: 200, background: '#E3F2FD', borderRadius: 8, padding: 12 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#1565C0' }}>
            Fan-out (Prebuilt)
          </div>
          <p style={{ fontSize: 12, marginBottom: 8 }}>
            Posts were already pushed into Bob's feed queue when each author posted. Opening the feed reads directly from the queue.
          </p>
          <button className="act" style={{ fontSize: 12, padding: '5px 12px', marginBottom: 8 }}
            disabled={fanoutPhase !== 'idle'} onClick={openFanout}>
            Open feed (fan-out)
          </button>
          {fanoutPhase === 'loading' && (
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, color: '#1565C0' }}>
              Reading prebuilt queue... (1 query)
            </div>
          )}
          {fanoutPhase === 'done' && (
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#2E9E6B', marginBottom: 6 }}>
                Done! 1 query — O(1) read
              </div>
              {PREBUILT_QUEUE.map(pid => {
                const p = SAMPLE_POSTS.find(x => x.id === pid)
                return (
                  <div key={pid} style={{ background: '#fff', borderRadius: 5, padding: '5px 8px', marginBottom: 4, fontSize: 12 }}>
                    <b>{p.author}</b> — {p.content}
                    <span style={{ color: '#aaa', fontSize: 10.5, marginLeft: 6 }}>{p.time}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT — Pull-on-read */}
        <div style={{ flex: 1, minWidth: 200, background: '#FFF8E1', borderRadius: 8, padding: 12 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#E65100' }}>
            Pull-on-read (Merge)
          </div>
          <p style={{ fontSize: 12, marginBottom: 8 }}>
            Nothing is prebuilt. Opening the feed queries each followee's recent posts, then merges them by time.
          </p>
          {pullPhase === 'idle' && (
            <button className="act" style={{ fontSize: 12, padding: '5px 12px', background: '#E65100', borderColor: '#E65100' }}
              onClick={openPull}>
              Open feed (pull)
            </button>
          )}
          {pullPhase !== 'idle' && pullPhase !== 'done' && (
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, marginBottom: 6, color: '#E65100' }}>
                Queries so far: <b>{queryCount}</b> / {followees.length}
              </div>
              {followees.slice(0, pullStep).map(f => (
                <div key={f} style={{ background: '#fff', borderRadius: 5, padding: '4px 8px', marginBottom: 4, fontSize: 11.5, borderLeft: '3px solid #FF9800' }}>
                  Fetched recent posts from <b>{f}</b>
                </div>
              ))}
              {pullStep < followees.length && (
                <button className="act" style={{ fontSize: 11.5, padding: '4px 10px', background: '#E65100', borderColor: '#E65100', marginTop: 4 }}
                  onClick={nextPullStep}>
                  Next: fetch {followees[pullStep]}'s posts →
                </button>
              )}
            </div>
          )}
          {pullPhase === 'done' && (
            <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#E65100', marginBottom: 6 }}>
                {followees.length} queries + merge sort — O(following × posts) read
              </div>
              {SAMPLE_POSTS.map(p => (
                <div key={p.id} style={{ background: '#fff', borderRadius: 5, padding: '5px 8px', marginBottom: 4, fontSize: 12 }}>
                  <b>{p.author}</b> — {p.content}
                  <span style={{ color: '#aaa', fontSize: 10.5, marginLeft: 6 }}>{p.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
        <button className="act ghost" onClick={reset}>Reset both</button>
      </div>
      <Good>
        Fan-out: 1 read query, result is instant. Pull-on-read: 3 queries (one per followee), then merge.
        The more people Bob follows, the more expensive pull gets. For celebrities with millions of followers,
        push is reversed — THEY get pulled.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 3 — Cursor-based pagination
   ============================================================ */
const ALL_POSTS = Array.from({ length: 14 }, (_, i) => ({
  id: `post-${14 - i}`,
  content: `Post #${14 - i} — ${['Just shipped a feature', 'Reading a great book', 'Coffee time again', 'Long run this morning', 'New blog post up', 'Team lunch was fun', 'Debugging session done', 'Learning Rust today', 'Quick walk outside', 'Fixed a nasty bug', 'Draft PR is ready', 'Design review passed', 'Deployed to prod!', 'Sprint planning done'][i]}`,
  author: ['Alice','Bob','Carol','Dave','Alice','Carol','Bob','Dave','Alice','Carol','Dave','Bob','Alice','Carol'][i],
}))

const PAGE_SIZE = 4

function CursorPaginationDemo() {
  const [mode, setMode]           = useState('cursor')   // 'cursor' | 'offset'
  const [page, setPage]           = useState(0)
  const [posts, setPosts]         = useState([...ALL_POSTS])
  const [cursor, setCursor]       = useState(null)        // id of last item on page
  const [insertedId, setInsertedId] = useState(null)
  const [showBug, setShowBug]     = useState(false)

  function reset() {
    setPage(0)
    setPosts([...ALL_POSTS])
    setCursor(null)
    setInsertedId(null)
    setShowBug(false)
  }

  function insertNewPost() {
    const newPost = { id: 'post-NEW', content: 'NEW POST — just inserted while you were reading!', author: 'Eve' }
    setPosts(prev => [newPost, ...prev])
    setInsertedId('post-NEW')
  }

  // Get a page of posts
  function getPage(pageIndex, allPosts, useCursor, currentCursor) {
    if (!useCursor) {
      // Offset-based (buggy when new post inserted)
      return allPosts.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE)
    }
    // Cursor-based
    if (pageIndex === 0) return allPosts.slice(0, PAGE_SIZE)
    const idx = allPosts.findIndex(p => p.id === currentCursor)
    if (idx === -1) return []
    return allPosts.slice(idx + 1, idx + 1 + PAGE_SIZE)
  }

  const isCursor     = mode === 'cursor'
  const currentPosts = getPage(page, posts, isCursor, cursor)
  const lastPost     = currentPosts[currentPosts.length - 1]
  const hasNext      = isCursor
    ? (lastPost ? posts.findIndex(p => p.id === lastPost.id) + 1 < posts.length : false)
    : (page + 1) * PAGE_SIZE < posts.length

  function nextPage() {
    if (isCursor && lastPost) setCursor(lastPost.id)
    const next = page + 1
    setPage(next)
    // Show bug: if offset mode, page 1 after an insert skips post-12
    if (!isCursor && next === 1 && insertedId) setShowBug(true)
  }

  const cursorVal = isCursor && lastPost ? lastPost.id : null

  return (
    <div className="panel">
      <div className="ptitle">Live demo · cursor vs offset pagination — see why offset breaks when new posts arrive</div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <div className="modbtns">
          <button className={mode === 'cursor' ? 'on' : ''} onClick={() => { setMode('cursor'); reset() }}>Cursor-based</button>
          <button className={mode === 'offset' ? 'on' : ''} onClick={() => { setMode('offset'); reset() }}>Offset-based</button>
        </div>
        <button className="act ghost" onClick={reset} style={{ fontSize: 12, padding: '5px 10px' }}>Reset</button>
      </div>

      {/* insert button */}
      {page === 0 && (
        <div style={{ marginBottom: 10 }}>
          <button className="act" style={{ background: '#FF9800', borderColor: '#FF9800', fontSize: 12, padding: '5px 12px' }}
            disabled={!!insertedId} onClick={insertNewPost}>
            {insertedId ? 'New post inserted ✓' : 'Insert new post (simulates someone posting while you browse)'}
          </button>
        </div>
      )}

      {/* posts list */}
      <div style={{ marginBottom: 10 }}>
        {currentPosts.map((p, i) => (
          <div key={p.id} style={{
            background: p.id === insertedId ? '#FFF3E0' : '#f5f5f2',
            borderRadius: 6, padding: '7px 10px', marginBottom: 5, fontSize: 13,
            borderLeft: p.id === insertedId ? '3px solid #FF9800' : '3px solid #e0ddd5',
          }}>
            <b>{p.author}</b>: {p.content}
            <span style={{ color: '#bbb', fontSize: 10.5, marginLeft: 8 }}>[{p.id}]</span>
            {p.id === insertedId && <span style={{ fontSize: 10.5, color: '#E65100', marginLeft: 6 }}>← new!</span>}
          </div>
        ))}
        {currentPosts.length === 0 && <div style={{ color: '#aaa', fontSize: 12.5 }}>No posts to show.</div>}
      </div>

      {/* pagination info */}
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, marginBottom: 8, background: '#f0eee8', borderRadius: 6, padding: '7px 10px' }}>
        {isCursor ? (
          <>
            Mode: <b>cursor-based</b> &nbsp;|&nbsp; Page: {page + 1} &nbsp;|&nbsp; Cursor: <b>{cursorVal || 'start'}</b>
            {insertedId && page > 0 && (
              <span style={{ color: '#2E9E6B', display: 'block', marginTop: 4 }}>
                New post was inserted — but you did NOT skip anything. Cursor held your place.
              </span>
            )}
          </>
        ) : (
          <>
            Mode: <b>offset-based</b> &nbsp;|&nbsp; Page: {page + 1} &nbsp;|&nbsp; Offset: <b>{page * PAGE_SIZE}</b>
            {showBug && (
              <span style={{ color: '#D32F2F', display: 'block', marginTop: 4 }}>
                Bug! A new post was inserted at position 0. Everything shifted by 1. You SKIPPED post-12. This is the offset pagination bug.
              </span>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="act ghost" disabled={page === 0} onClick={() => { setPage(0); setCursor(null); setShowBug(false) }}>
          ← First page
        </button>
        <button className="act" disabled={!hasNext} onClick={nextPage}>
          Next page →
        </button>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#888' }}>
          Showing {currentPosts.length} posts
        </span>
      </div>

      {isCursor && (
        <Note>
          Try: switch to offset mode, insert a new post on page 1, then go to page 2. You will skip a post.
          Cursor mode: insert a post, go to page 2 — no skip because the cursor anchors to the last seen post ID.
        </Note>
      )}
    </div>
  )
}

/* ============================================================
   Quiz data
   ============================================================ */
const QUESTIONS = [
  {
    q: 'When Alice (3 followers) posts, which strategy should the system use?',
    o: [
      'Pull-on-read — query followers at read time',
      'Fan-out-on-write — push post to each follower\'s feed queue immediately',
      'Hybrid — skip fan-out, mark as celebrity',
      'Do nothing — followers will discover the post by searching',
    ],
    a: 1,
    e: 'Alice has only 3 followers — well below any celebrity threshold. Fan-out-on-write is cheap here: 3 queue writes, and every follower reads their feed in O(1) forever after.',
    w: {
      0: 'Pull-on-read is for celebrities. For small follower counts, you want the read to be fast (O(1)), which requires prebuilding the feed on write.',
      2: 'The hybrid strategy skips fan-out only above the celebrity threshold (e.g. >1M followers). 3 followers does not qualify.',
      3: 'Feeds are never built from search — that would require scanning all posts in the system on every page load.',
    },
    r: { id: 's4', label: 'Section 4 — Fan-out-on-write' },
  },
  {
    q: 'A celebrity with 5 million followers posts. The system skips fan-out and uses pull-on-read. What is the write cost of the post?',
    o: ['O(1)', 'O(followers) = O(5M)', 'O(log N)', 'O(followers²)'],
    a: 0,
    e: 'When the system skips fan-out, publishing a post is O(1): just write the post to the author\'s post store. No follower queues are updated. The cost is shifted to read time instead.',
    w: {
      1: 'O(followers) is exactly the celebrity problem — writing to 5M queues would take too long and generate enormous write traffic. That\'s why fan-out is skipped.',
      2: 'O(log N) would apply to a tree-based data structure, but that\'s not relevant here. The write is a simple append.',
      3: 'O(followers²) would be catastrophic. Nothing in feed delivery is quadratic.',
    },
    r: { id: 's6', label: 'Section 6 — Pull-on-read' },
  },
  {
    q: 'Bob follows 200 people. In hybrid mode, 5 of them are celebrities (pull-on-read). What happens when Bob opens his feed?',
    o: [
      'All 200 followees are queried — no prebuilt queue is used',
      'Only the 5 celebrities\' posts are queried; the other 195 posts come from the prebuilt queue',
      'The prebuilt queue is used; celebrity posts are NEVER shown',
      'The system fans-out the celebrity posts retroactively before returning the feed',
    ],
    a: 1,
    e: 'Hybrid: posts from the 195 regular users are already in Bob\'s prebuilt feed queue (fan-out happened at write time). The 5 celebrities\' recent posts are pulled on demand, then merged with the prebuilt results.',
    w: {
      0: 'Querying all 200 followees defeats the purpose of prebuilding the queue for regular users. Only celebrities require pull.',
      2: 'Celebrity posts must still appear in the feed — they are just delivered via pull-on-read instead of push.',
      3: 'Retroactive fan-out is not standard — it would be extremely expensive (5M writes triggered by a user opening a feed is worse than the original celebrity problem).',
    },
    r: { id: 's7', label: 'Section 7 — Hybrid strategy' },
  },
  {
    q: 'Why does offset-based pagination break when new posts are inserted?',
    o: [
      'Offsets use floating-point numbers which lose precision',
      'Inserting a post shifts all later posts by one position, so offset N now points to a different item',
      'Offset pagination does not support sorting',
      'The database cannot handle concurrent inserts with offset queries',
    ],
    a: 1,
    e: 'Offset = "skip the first N rows." If a new post is inserted at position 0, every subsequent post shifts down by 1. A user already on page 1 (offset=4) will now skip a post because offset 4 points to what was previously offset 3.',
    w: {
      0: 'Offsets are plain integers — no floating point involved. The bug is positional, not numeric.',
      2: 'Offset pagination supports any sort order. The problem is purely about positional stability when the underlying data changes.',
      3: 'Concurrent inserts are a separate concern. Even a single insert by one user breaks the offset for another user mid-browse.',
    },
    r: { id: 's9', label: 'Section 9 — Cursor vs offset pagination' },
  },
  {
    q: 'What is the cursor in cursor-based pagination?',
    o: [
      'A database transaction lock held open between pages',
      'The ID (or score) of the last item seen on the current page — used to fetch items "after" it',
      'A counter that tracks how many pages the user has viewed',
      'A cache key for the entire feed result set',
    ],
    a: 1,
    e: 'The cursor is an opaque token (usually the ID or timestamp of the last fetched item). The next query says "give me N items where id < cursor". This is stable even if new posts are inserted above it.',
    w: {
      0: 'A cursor in pagination is NOT a database lock. Holding locks between user page-loads would block all other writes — catastrophic at scale.',
      2: 'A page counter is exactly the offset approach in disguise. The cursor is a stable pointer to a specific item, not a page number.',
      3: 'Caching the entire result set is a separate optimization; the cursor itself is just a stable reference point.',
    },
    r: { id: 's9', label: 'Section 9 — Cursor vs offset pagination' },
  },
  {
    q: 'The Follow entity (followerId, followeeId) is modeled separately from User. What relationship does it represent?',
    o: [
      'Inheritance — a Follower IS-A User',
      'Composition — a User is destroyed when all followers leave',
      'Association with a join table — a many-to-many User→User follow graph',
      'Aggregation — followers belong to the followee\'s lifecycle',
    ],
    a: 2,
    e: 'A user can follow many users, and can be followed by many users. This is a many-to-many self-referential relationship on User. The Follow entity is the join table (or graph edge) that reifies that relationship.',
    w: {
      0: 'A Follower is not a different type of User — it is the same User entity seen from a different angle. IS-A inheritance would mean a separate class, which is wrong.',
      1: 'Composition means the child cannot exist without the parent (Day 6). Users exist independently of who follows them.',
      3: 'Aggregation means the followee "owns" its followers in a lifecycle sense. But followers exist independently — unfollow just deletes the edge, not the follower.',
    },
    r: { id: 's3', label: 'Section 3 — Core entities' },
  },
  {
    q: 'Which design pattern does cursor-based pagination most closely resemble?',
    o: ['Iterator (Day 37)', 'Composite (Day 28)', 'Memento (Day 39)', 'Chain of Responsibility (Day 36)'],
    a: 0,
    e: 'Cursor pagination IS an external iterator over the feed stream. The cursor acts like a position marker (hasNext/next pointer). Each "next page" call advances the iterator by PAGE_SIZE items from the current cursor position.',
    w: {
      1: 'Composite models a tree of objects treated uniformly — it has no concept of positional navigation through a sequence.',
      2: 'Memento saves and restores state snapshots. A cursor does point into state, but the pattern here is iteration (advance through a sequence), not state restoration.',
      3: 'Chain of Responsibility passes a request along handlers — it\'s about processing pipelines, not sequential traversal of a dataset.',
    },
    r: { id: 's9', label: 'Section 9 — Cursor vs offset pagination' },
  },
  {
    q: 'Alice unfollows Dave. Dave\'s old posts are already in Alice\'s prebuilt feed queue. What is the simplest correct behavior?',
    o: [
      'Delete all of Dave\'s posts from Alice\'s prebuilt queue immediately on unfollow',
      'Leave Dave\'s old posts in the queue; filter them out at read time by checking if Alice still follows Dave',
      'Replay all of Alice\'s follows from scratch and rebuild the feed queue',
      'The system does nothing — Dave\'s posts stay in the queue forever',
    ],
    a: 1,
    e: 'Deleting all of Dave\'s posts from the queue is expensive (a full scan). Replay is very expensive. The pragmatic answer: keep the old posts in the queue but filter on read ("is Alice still following Dave?"). Old posts age out naturally as the feed queue is bounded in size.',
    w: {
      0: 'Immediate deletion requires scanning and deleting every FeedItem from Dave for Alice — potentially millions of rows at scale. This is done asynchronously in background jobs if at all.',
      2: 'Full replay on every unfollow is catastrophically expensive — a user could follow/unfollow hundreds of accounts.',
      3: 'Leaving them forever is a trap listed in Section 11. Posts from unfollowed users should eventually stop appearing. At minimum, filter at read time.',
    },
    r: { id: 's11', label: 'Section 11 — Common traps' },
  },
]

/* ============================================================
   Page
   ============================================================ */
export default function Day73() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 15 · Day 73</div>
        <h1>Social Media Feed:<br />Fan-out, Pull, and the Celebrity Problem</h1>
        <p>
          Storing posts is easy. Delivering them to the right people, instantly, at scale —
          that is the hard part. Click every demo to see the two delivery strategies collide,
          and understand exactly why neither alone is enough.
        </p>
        <div className="chips">
          {['Fan-out-on-write', 'Pull-on-read', 'Hybrid Strategy', 'Cursor Pagination', 'Follow Graph'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The feed delivery problem</h2>
        <p>
          Think of a newspaper. Every morning a printing press makes <em>one copy per subscriber</em>
          and delivers it to each doorstep before the reader wakes up. That is fan-out-on-write.
          Alternatively, one master copy sits at the press, and readers drive to the press to read it
          themselves. That is pull-on-read.
        </p>
        <p>
          In a social media feed: when Alice posts, do you push a copy to every follower's queue
          right now? Or do you wait until Bob opens his app, and then ask "who does Bob follow —
          let me get all their recent posts and merge"?
        </p>
        <Code html={`<span class="cm">── Fan-out-on-write vs Pull-on-read ──────────────────────────────</span>

<span class="cm">FAN-OUT-ON-WRITE (push model):           PULL-ON-READ (pull model):</span>
Alice posts                              Bob opens feed
   │                                        │
   ├──► Bob's feed queue    (write)          ├──► fetch Alice's recent posts
   ├──► Carol's feed queue  (write)          ├──► fetch Carol's recent posts
   └──► Dave's feed queue   (write)          └──► merge + sort → return

Write: O(followers)                      Write: O(1)
Read:  O(1)  ← just read your queue     Read:  O(following × posts per user)

Celebrity problem (push):                Celebrity problem (pull):
Alice has 10M followers →                Bob follows 10M celebs →
10M queue writes per post                10M queries to merge on every open
           ↑                                          ↑
      too expensive                            too expensive

<span class="cm">── The answer: a HYBRID ─────────────────────────────────────────</span>

if followerCount &lt; THRESHOLD (e.g. 1M):
    fan-out-on-write   ← cheap, follower reads are O(1)
else (celebrity):
    skip fan-out       ← followers pull this post on read`} />
        <Note>
          The celebrity problem is the defining problem of social feed design. Every big platform
          (Twitter/X, Instagram, Facebook) uses a hybrid: fan-out for regular users, pull-on-read
          for celebrities. The threshold is a tuning parameter, not a constant.
        </Note>
      </section>

      {/* S2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Clarifying questions (ask these in an interview)</h2>
        <p>Before any class diagram, ask these. Each answer changes the design significantly.</p>
        <table className="matrix" style={{ width: '100%', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Question</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Why it matters</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Simple-first answer</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Chronological or ranked feed?', 'Ranked needs a score field on FeedItem; the merger sorts by score not time', 'Chronological for now (add ranking later)'],
              ['Text only or media (images/video)?', 'Media URLs need separate storage; post schema changes', 'Support text + optional media URLs'],
              ['Real-time or eventual consistency?', 'Real-time requires WebSocket/push; eventual is simpler HTTP pull', 'Eventual — new posts appear within a few seconds'],
              ['Who can follow? Direct follows or groups?', 'Groups need a GroupMembership table; multiplies fan-out targets', 'Direct user-to-user follows only'],
              ['Mute and block support?', 'Block means skip fan-out to the blocker; mute filters at read time', 'Support block (hard filter) and mute (soft filter)'],
              ['Stories vs posts?', 'Stories have a 24h TTL, different rendering, separate feed slot', 'Posts only for now'],
              ['Pagination style?', 'Cursor is stable; offset breaks on inserts (Section 9)', 'Cursor-based pagination'],
            ].map(([q, why, ans]) => (
              <tr key={q}>
                <td style={{ padding: '6px 8px' }}>{q}</td>
                <td style={{ padding: '6px 8px', color: '#666' }}>{why}</td>
                <td style={{ padding: '6px 8px', color: 'var(--blue)' }}>{ans}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* S3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Core entities and the follow graph</h2>
        <Code html={`<span class="cm">── Entity model ──────────────────────────────────────────────────</span>

  ┌──────────────────┐   follows   ┌──────────────────┐
  │      User        │─────────────│      User        │
  │──────────────────│  (many-to-  │──────────────────│
  │ id: String       │   many via  │ id: String       │
  │ username: String │  Follow     │ username: String │
  │ followerCount    │   entity)   │ followerCount    │
  │ followingCount   │             │ followingCount   │
  └──────────────────┘             └──────────────────┘
            ▲                               ▲
            │                               │
  ┌─────────┴──────────────────────────────┘──────┐
  │                   Follow                       │
  │──────────────────────────────────────────────── │
  │ followerId: String   (the person following)    │
  │ followeeId: String   (the person being followed│
  │ createdAt: Instant                             │
  └────────────────────────────────────────────────┘

  ┌──────────────────┐         ┌─────────────────────────┐
  │      Post        │         │        FeedItem          │
  │──────────────────│         │─────────────────────────│
  │ id: String       │  1    * │ userId: String           │
  │ authorId: String │─────────│ postId: String           │
  │ content: String  │         │ score: double (ranking)  │
  │ mediaUrls        │         │ addedAt: Instant         │
  │ createdAt        │         └─────────────────────────┘
  │ likeCount        │         ← one row per (user, post) pair
  │ commentCount     │         ← Bob's queue = all FeedItems where userId='bob'
  └──────────────────┘`} />
        <Code html={`<span class="cm">// The key classes in Java</span>

<span class="kw">record</span> User(
    String id,
    String username,
    <span class="kw">long</span> followerCount,     <span class="cm">// denormalized for fast celebrity check</span>
    <span class="kw">long</span> followingCount
) {}

<span class="kw">record</span> Post(
    String id,
    String authorId,
    String content,
    List&lt;String&gt; mediaUrls,   <span class="cm">// optional image/video links</span>
    Instant createdAt,
    <span class="kw">long</span> likeCount,
    <span class="kw">long</span> commentCount
) {}

<span class="kw">record</span> Follow(
    String followerId,     <span class="cm">// "Bob follows Alice" → followerId=bob, followeeId=alice</span>
    String followeeId,
    Instant createdAt
) {}

<span class="kw">record</span> FeedItem(
    String userId,         <span class="cm">// whose feed queue this belongs to</span>
    String postId,         <span class="cm">// which post was added</span>
    <span class="kw">double</span> score,          <span class="cm">// for ranked feeds; use createdAt for chronological</span>
    Instant addedAt
) {}`} />
        <Note>
          <C>Follow</C> is a first-class entity, not just a foreign key. It has its own timestamp
          (<C>createdAt</C>) and could have more fields: <C>notifyEnabled</C>, <C>closeFriend</C>, etc.
          The follow graph is the backbone of the entire feed system.
        </Note>
      </section>

      {/* S4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Fan-out-on-write — the push model</h2>
        <p>
          When a user publishes a post, the system immediately pushes a <C>FeedItem</C> row into
          every follower's feed queue. When Bob opens his feed, he reads his queue directly —
          no merge needed.
        </p>
        <Code html={`<span class="cm">// Called when a user publishes a post (simplified, sync version)</span>
<span class="kw">void</span> onPostPublished(Post post, FollowGraph followGraph, FeedQueue feedQueue) {
    List&lt;String&gt; followers = followGraph.getFollowers(post.authorId());

    <span class="cm">// Celebrity check — if too many followers, skip fan-out entirely</span>
    <span class="kw">if</span> (followers.size() &gt; CELEBRITY_THRESHOLD) {
        <span class="kw">return</span>;  <span class="cm">// handled by pull-on-read in getFeed()</span>
    }

    <span class="kw">double</span> score = computeScore(post);  <span class="cm">// e.g. recency + engagement signals</span>

    <span class="cm">// Push one FeedItem per follower — O(followers) writes</span>
    <span class="kw">for</span> (String followerId : followers) {
        FeedItem item = <span class="kw">new</span> FeedItem(followerId, post.id(), score, Instant.now());
        feedQueue.add(item);   <span class="cm">// one row per (follower, post) pair</span>
    }
}

<span class="cm">// Reading Bob's feed — O(1), just read his prebuilt queue</span>
List&lt;FeedItem&gt; getFeedFanOut(String userId, FeedCursor cursor, <span class="kw">int</span> limit) {
    <span class="kw">return</span> feedQueue.getAfterCursor(userId, cursor, limit);
    <span class="cm">// "give me limit rows from userId's queue, starting after cursor"</span>
}`} />
        <table className="matrix" style={{ width: '100%', fontSize: 13, marginTop: 10 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Dimension</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Fan-out-on-write</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Write cost',   'O(followers) — push to every follower queue on publish'],
              ['Read cost',    'O(1) — read your prebuilt queue directly'],
              ['Good for',     'Regular users with small-to-medium follower counts'],
              ['Celebrity problem', '10M followers = 10M queue writes per post — too slow/expensive'],
              ['Unfollow side-effect', 'Old posts stay in the queue — need filtering or cleanup job'],
              ['Storage cost', 'High — one FeedItem row per (follower, post) pair, many duplicates'],
            ].map(([d, v]) => (
              <tr key={d}>
                <td style={{ padding: '6px 8px' }}><b>{d}</b></td>
                <td style={{ padding: '6px 8px' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Reveal summary="Why does fan-out use Observer pattern (Day 32)?">
          <p>
            Fan-out-on-write IS the Observer pattern at scale. The post is the event.
            Every follower is a subscriber. Publishing a post notifies all subscribers
            by writing to their feed queues. In production, this is asynchronous:
            publishing enqueues a "fanout job" to a message queue (Kafka, SQS), and
            worker threads process the job and write the FeedItems. This decouples the
            publish latency from the number of followers.
          </p>
        </Reveal>
      </section>

      {/* S5 — Interactive */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>Follow graph and fan-out visualization</h2>
        <p>
          The graph shows two posters: Alice (3 followers) and Celeb (5 followers, above the threshold).
          Click each button and watch what happens. Alice's followers light up one by one as queue writes happen.
          Celeb's post skips fan-out entirely.
        </p>
        <FanOutDemo />
      </section>

      {/* S6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Pull-on-read — the pull model</h2>
        <p>
          Nothing is prebuilt. When Bob opens his feed, the system asks: "who does Bob follow?"
          Then it fetches recent posts from each of them, merges by time (or score), and returns the result.
        </p>
        <Code html={`<span class="cm">// Called when a user opens their feed — O(following × posts) per call</span>
List&lt;Post&gt; generateFeedPull(String userId, FollowGraph followGraph,
                              PostStore postStore, FeedCursor cursor, <span class="kw">int</span> limit) {

    List&lt;String&gt; following = followGraph.getFollowing(userId);
    <span class="cm">// for each followee, get their recent posts — one DB query per followee</span>

    List&lt;Post&gt; merged = following.stream()
        .flatMap(fid -&gt; postStore.getRecentPosts(fid, <span class="num">20</span>).stream())
        <span class="cm">// ↑ fetch 20 recent posts from each followee (bounded to avoid infinite scan)</span>
        .sorted(Comparator.comparingLong(Post::createdAt).reversed())
        <span class="cm">// ↑ merge all into one chronological list (most recent first)</span>
        .skip(cursor.offset())     <span class="cm">// skip posts before the cursor</span>
        .limit(limit)              <span class="cm">// take only 'limit' posts</span>
        .collect(toList());

    <span class="kw">return</span> merged;
}`} />
        <table className="matrix" style={{ width: '100%', fontSize: 13, marginTop: 10 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Dimension</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Pull-on-read</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Write cost',   'O(1) — just write the post to the author\'s store'],
              ['Read cost',    'O(following × postsPerUser) — queries + merge on every feed open'],
              ['Good for',     'Celebrities (high follower count, but following count is usually low)'],
              ['Following problem', 'If Bob follows 10,000 people, pull needs 10,000 queries to merge'],
              ['Unfollow accuracy', 'Perfect — unfollowed accounts just stop being queried immediately'],
              ['Storage cost', 'Low — no FeedItem rows, just the original post store'],
            ].map(([d, v]) => (
              <tr key={d}>
                <td style={{ padding: '6px 8px' }}><b>{d}</b></td>
                <td style={{ padding: '6px 8px' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note>
          Celebrities typically follow far fewer people than they are followed by. So pull-on-read
          works for them when they open their own feed. The problem is for the <em>followers</em> of
          celebrities — those followers must pull the celebrity's posts at read time.
        </Note>
      </section>

      {/* S7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The hybrid strategy — routing based on follower count</h2>
        <p>
          The real-world answer is a hybrid. Fan-out for regular users. Pull-on-read for celebrities.
          At read time, merge both sources. This is the Strategy pattern: the routing
          decision picks which <C>FeedGenerationStrategy</C> to use per author.
        </p>
        <Code html={`<span class="cm">// Strategy interface — both strategies share this contract</span>
<span class="kw">interface</span> FeedGenerationStrategy {
    List&lt;Post&gt; getFeed(String userId, FeedCursor cursor, <span class="kw">int</span> limit);
}

<span class="cm">// The hybrid implementation — combines prebuilt queue + celebrity pull</span>
<span class="kw">class</span> HybridFeedStrategy <span class="kw">implements</span> FeedGenerationStrategy {
    <span class="kw">private final</span> FeedQueue feedQueue;         <span class="cm">// prebuilt queue (fan-out posts)</span>
    <span class="kw">private final</span> PostStore postStore;         <span class="cm">// raw post storage</span>
    <span class="kw">private final</span> FollowGraph followGraph;     <span class="cm">// the follow relationship graph</span>

    @Override
    <span class="kw">public</span> List&lt;Post&gt; getFeed(String userId, FeedCursor cursor, <span class="kw">int</span> limit) {
        <span class="cm">// Step 1: get prebuilt feed items from regular followees (fan-out wrote these)</span>
        List&lt;FeedItem&gt; prebuilt = feedQueue.getAfterCursor(userId, cursor, limit);

        <span class="cm">// Step 2: get celebrity followees — those above the fan-out threshold</span>
        List&lt;String&gt; celebrities = followGraph.getCelebrityFollowees(userId);
        <span class="cm">// ↑ "give me users that userId follows AND who have followerCount > THRESHOLD"</span>

        <span class="cm">// Step 3: pull recent posts from each celebrity (bounded — e.g. last 5 posts)</span>
        List&lt;Post&gt; celebPosts = celebrities.stream()
            .flatMap(cid -&gt; postStore.getRecentPosts(cid, <span class="num">5</span>).stream())
            .collect(toList());

        <span class="cm">// Step 4: resolve post IDs from the prebuilt items</span>
        List&lt;Post&gt; regularPosts = prebuilt.stream()
            .map(item -&gt; postStore.getById(item.postId()))
            .collect(toList());

        <span class="cm">// Step 5: merge and sort (or rank) — return top 'limit' posts</span>
        <span class="kw">return</span> mergeSorted(regularPosts, celebPosts, limit);
    }
}

<span class="cm">// Fan-out routing — called at publish time</span>
<span class="kw">void</span> onPostPublished(Post post) {
    User author = userStore.get(post.authorId());
    <span class="kw">if</span> (author.followerCount() &lt;= CELEBRITY_THRESHOLD) {
        <span class="cm">// Regular user — fan-out to all followers</span>
        fanOutService.pushToFollowers(post);
    }
    <span class="cm">// Celebrities skip fan-out — followers will pull on read</span>
}`} />
        <Good>
          The hybrid is the standard in industry. Twitter/X uses a version of this. Instagram uses a similar
          approach. The threshold is usually in the millions of followers, tuned based on observed write latency.
        </Good>
      </section>

      {/* S8 — Interactive */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>Feed generation comparison</h2>
        <p>
          Both panels show Bob's feed. The left (fan-out) reads directly from a prebuilt queue —
          one step. The right (pull) shows the merge happening step by step — one query per followee.
          Click the buttons and compare the number of queries needed.
        </p>
        <FeedComparisonDemo />
      </section>

      {/* S9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Cursor-based pagination vs offset</h2>
        <p>
          Social feeds are NOT static. New posts arrive constantly. Offset pagination assumes
          the data does not change between pages — which is never true for a live feed.
        </p>
        <Code html={`<span class="cm">── Why offset breaks ───────────────────────────────────────────────</span>

Page 1 loaded (offset=0, limit=4):         New post arrives!
  Post A  ← position 0                     Post NEW is inserted at position 0
  Post B  ← position 1                       Post NEW ← position 0  (new!)
  Post C  ← position 2                       Post A   ← position 1  (shifted)
  Post D  ← position 3                       Post B   ← position 2  (shifted)
                                             Post C   ← position 3  (shifted)
Page 2 request (offset=4):                   Post D   ← position 4  (shifted)
  Now returns: Post E (was at 4)             Post E   ← position 5  (shifted)
  But Post D was at position 3 and
  slipped to position 4 — it's SKIPPED!
           ↑
  The user never sees Post D.

<span class="cm">── Cursor-based is stable ──────────────────────────────────────────</span>

Page 1 loaded, cursor = last seen ID = "post-D"
  → store cursor = "post-D" client-side

New post "post-NEW" arrives (position 0):
  → does not affect the cursor

Page 2 request: "give me items where id &lt; 'post-D'"
  → still returns Post E, Post F, etc.
  → post-NEW will appear on the NEXT fresh load from the top
  → no posts are skipped`} />
        <Code html={`<span class="cm">// Cursor-based pagination — Java implementation</span>
<span class="kw">record</span> FeedCursor(
    String lastSeenPostId,   <span class="cm">// ID of the last post the user saw</span>
    Instant lastSeenTime     <span class="cm">// for ranked feeds: sort by (score, time) not just ID</span>
) {
    <span class="kw">static</span> FeedCursor start() { <span class="kw">return new</span> FeedCursor(<span class="kw">null</span>, <span class="kw">null</span>); }
    <span class="kw">boolean</span> isStart()          { <span class="kw">return</span> lastSeenPostId == <span class="kw">null</span>; }
}

<span class="cm">// In the feed queue — return items AFTER the cursor</span>
List&lt;FeedItem&gt; getAfterCursor(String userId, FeedCursor cursor, <span class="kw">int</span> limit) {
    <span class="kw">if</span> (cursor.isStart()) {
        <span class="cm">// First page — return the newest items</span>
        <span class="kw">return</span> db.query(<span class="str">"SELECT * FROM feed_items WHERE user_id=? ORDER BY added_at DESC LIMIT ?"</span>,
                        userId, limit);
    }
    <span class="cm">// Subsequent pages — return items older than the cursor</span>
    <span class="kw">return</span> db.query(<span class="str">"SELECT * FROM feed_items WHERE user_id=? AND added_at &lt; ? ORDER BY added_at DESC LIMIT ?"</span>,
                    userId, cursor.lastSeenTime(), limit);
    <span class="cm">// ↑ "added_at &lt; cursor.lastSeenTime()" means "older than the last thing I saw"</span>
}`} />
        <Warn>
          Cursor pagination does NOT work well with ranked feeds where scores change in real time
          (e.g. a post you've already seen gets more likes and would jump to the top). Ranked feeds
          typically use a fixed-score snapshot at feed-open time, not live scores.
        </Warn>
        <Reveal summary="What does the client send as the cursor?">
          <p>
            Clients send an opaque token — often a base64-encoded string containing the last post ID
            and timestamp. The server decodes it. This prevents clients from guessing or gaming the
            cursor. Example: <C>eyJpZCI6InBvc3QtMTIiLCJ0IjoxNzAwMDAwMDAwfQ==</C> decodes to
            {'{"id":"post-12","t":1700000000}'}. The client never needs to know the internal format.
          </p>
        </Reveal>
      </section>

      {/* S10 — Interactive */}
      <section id="s10">
        <div className="sec-label">Section 10 · Interactive</div>
        <h2>Cursor vs offset pagination</h2>
        <p>
          Browse the feed in cursor mode. Insert a new post while on page 1, then go to page 2.
          No posts are skipped. Switch to offset mode and try the same — watch the bug appear.
        </p>
        <CursorPaginationDemo />
      </section>

      {/* S11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>Common traps</h2>

        <Warn>
          <b>Trap 1 — Using offset pagination for a live feed.</b> Inserting a new post shifts all
          offsets down by one. The user on page 2 skips the last post on page 1. Always use cursor-based
          pagination for feeds. Offset is fine for stable, append-only data like search results over a
          fixed dataset.
        </Warn>

        <Warn>
          <b>Trap 2 — Fan-out for celebrities.</b> A celebrity with 10M followers posting triggers
          10M <C>INSERT</C> statements or queue messages. This can overwhelm the write infrastructure
          for a single post. Always check follower count before fanning out. Use a configurable threshold.
        </Warn>

        <Warn>
          <b>Trap 3 — Not handling unfollow correctly.</b> When Alice unfollows Dave, Dave's old posts
          are still in Alice's feed queue. The safest fix: filter at read time (check if Alice still follows
          Dave before returning a FeedItem). Do NOT try to delete all of Dave's old FeedItems immediately —
          that scan is expensive. They age out naturally as the queue has a bounded maximum size.
        </Warn>

        <Warn>
          <b>Trap 4 — Double-counting posts in hybrid merge.</b> A regular user who later crosses
          the celebrity threshold may have posts in both the prebuilt queue (from before they were a
          celebrity) AND the pull-on-read path (after they crossed the threshold). De-duplicate by post
          ID before returning the merged feed.
        </Warn>

        <Warn>
          <b>Trap 5 — Sorting by <C>createdAt</C> only for a ranked feed.</b> A ranked feed weighs
          recency, likes, shares, and relationship strength. Sorting by <C>createdAt</C> alone gives a
          chronological feed. Use a <C>score</C> field on <C>FeedItem</C> and sort by score descending.
          The score is computed at write time (fan-out) or read time (pull), not on every page load.
        </Warn>

        <Warn>
          <b>Trap 6 — Not capping the prebuilt feed queue size.</b> The feed queue could grow without
          bound for very active accounts. Cap it at a maximum size per user (e.g. 1000 items). Evict the
          oldest items beyond the cap. Users who haven't opened their feed in months will see a fresh
          pull-on-read result anyway.
        </Warn>
      </section>

      {/* S12 */}
      <section id="s12">
        <div className="sec-label">Section 12</div>
        <h2>Cheat sheet and patterns map</h2>
        <ul>
          <li><b>Fan-out-on-write (push):</b> push post to each follower's queue at publish time. Write O(followers), read O(1). Use for regular users.</li>
          <li><b>Pull-on-read:</b> when user opens feed, query all followees' recent posts and merge. Write O(1), read O(following × posts). Use for celebrities.</li>
          <li><b>Hybrid:</b> fan-out below threshold, skip for celebrities. Read merges prebuilt queue + live celebrity pull.</li>
          <li><b>Celebrity threshold:</b> a tunable constant (e.g. 1M followers). Below it = fan-out. Above it = pull.</li>
          <li><b>FeedItem:</b> one row per (userId, postId) pair. Bob's feed queue = all FeedItems where userId='bob'. Score field enables ranking.</li>
          <li><b>Cursor pagination:</b> cursor = ID/timestamp of last seen item. Next page = items older than cursor. Stable across inserts.</li>
          <li><b>Offset pagination:</b> skip N rows. Breaks when new rows are inserted above. Never use for live feeds.</li>
          <li><b>Unfollow:</b> filter at read time (check follow exists); don't delete old FeedItems immediately.</li>
          <li><b>Queue size cap:</b> limit prebuilt queue to N items per user. Evict oldest beyond the cap.</li>
        </ul>

        <Reveal summary="Patterns map — where each design pattern appears in this system">
          <table className="matrix" style={{ fontSize: 12.5, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '5px 8px' }}>Pattern</th>
                <th style={{ textAlign: 'left', padding: '5px 8px' }}>Day</th>
                <th style={{ textAlign: 'left', padding: '5px 8px' }}>Where it appears</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Observer',    '32', 'Fan-out IS Observer at scale — post event pushes to all follower queues'],
                ['Iterator',    '37', 'Cursor-based pagination IS an external iterator over the feed stream'],
                ['Strategy',    '31', 'FeedGenerationStrategy — FanOutStrategy / PullStrategy / HybridStrategy'],
                ['Command',     '33', 'Post is an append-only command/event in the activity log'],
                ['Decorator',   '27', 'Ranked feed = score-decorated FeedItem wrapping the chronological base'],
                ['Adapter',     '26', 'Different storage backends (Redis/Cassandra/DB) behind one FeedQueue interface'],
              ].map(([p, d, w]) => (
                <tr key={p}>
                  <td style={{ padding: '5px 8px' }}><b>{p}</b></td>
                  <td style={{ padding: '5px 8px', color: '#7c8aa5' }}>Day {d}</td>
                  <td style={{ padding: '5px 8px' }}>{w}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </section>

      {/* INTERVIEW */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>The questions they actually ask</h2>

        <Reveal summary="Q: How does unfollow work — do you delete old FeedItems from the queue?">
          <p>
            The pragmatic answer: no immediate deletion. Scanning and deleting all of Dave's posts
            from Alice's queue is an expensive O(N) operation. Instead, filter at read time: before
            returning a FeedItem, check if the follow relationship still exists. A background job can
            asynchronously clean up old items. Old posts age out naturally as the queue is capped.
            This is the "lazy eviction" pattern — same idea as lazy TTL expiry in caches (Day 56).
          </p>
        </Reveal>

        <Reveal summary="Q: How does Instagram rank posts — what is EdgeRank / the ranking signal?">
          <p>
            Instagram (like Facebook's EdgeRank before it) uses a multi-signal ranking model. Signals include:
            affinity (how often you interact with the poster), post recency, post engagement (likes, comments, shares),
            content type preference (videos vs photos), and relationship strength (direct messages, tag frequency).
            In our model this is captured as a <C>score</C> field on <C>FeedItem</C>. The score is computed at
            write time for fan-out posts and at read time for pulled posts. In an interview, just say
            "weighted combination of recency, engagement, and relationship strength, stored as a numeric score."
          </p>
        </Reveal>

        <Reveal summary="Q: What is the cold start problem for new users?">
          <p>
            A new user has zero follows. Their feed queue is empty. Pull-on-read returns nothing.
            Solutions: (1) suggest accounts to follow (onboarding flow), (2) show trending/popular posts
            globally until they have enough follows, (3) infer interests from signup data and show
            content from those interest categories. This is separate from the feed delivery architecture —
            it is an onboarding and recommendation problem. In an interview, name the problem and name
            one solution; you don't need to design the full recommendation engine.
          </p>
        </Reveal>

        <Reveal summary="Q: Walk me through what happens when a celebrity with 10M followers posts.">
          <p>
            1. Celebrity taps "Post." The Post is written to the post store (O(1)). <br />
            2. The system checks <C>author.followerCount()</C>. It exceeds CELEBRITY_THRESHOLD. <br />
            3. Fan-out is SKIPPED. Zero FeedItem writes happen. <br />
            4. Follower A opens their feed. The system calls <C>HybridFeedStrategy.getFeed(A)</C>. <br />
            5. The strategy fetches A's prebuilt queue (regular followees). <br />
            6. The strategy checks A's following list for celebrities. Finds the celebrity. <br />
            7. It fetches the celebrity's recent posts from the post store (pull-on-read). <br />
            8. It merges both lists by score/time. Returns the top N posts. <br />
            Cost: O(1) on publish. O(celebrity_followees × posts_per_celeb) on each follower's read.
            Since A likely follows only a handful of celebrities, this is manageable.
          </p>
        </Reveal>

        <Reveal summary="Q: How do you implement stories differently from posts?">
          <p>
            Stories have a 24-hour TTL. They are NOT fed through the same FeedItem queue.
            Separate entity: <C>Story(id, authorId, mediaUrl, expiresAt)</C>. A separate stories feed
            shows circles at the top of the app. Fan-out is similar but with a TTL: the StoryItem
            expires after 24h (Redis with TTL, or a DB sweeper). Stories are typically sorted by
            recency among the people you follow who have active stories — not by engagement score.
            The key design difference: stories are ephemeral (TTL) and binary (watched / not watched),
            not persistent ranked posts.
          </p>
        </Reveal>

        <Reveal summary="Q: How does cursor pagination work for a ranked feed (not chronological)?">
          <p>
            A chronological cursor uses (postId, createdAt). A ranked cursor uses (postId, score).
            The next-page query is: "give me items where (score, postId) &lt; (cursor.score, cursor.postId)."
            This requires a composite index on (userId, score DESC, postId). The score must be
            stable between pages — if scores change in real time (likes pour in), a post could
            jump position and appear twice or be skipped. Solution: compute and freeze scores at
            feed-open time, store them in the FeedItem rows, and do not update them mid-session.
          </p>
        </Reveal>

        <Reveal summary="Q: How do you handle the case where a user follows 50,000 accounts?">
          <p>
            This is the "following problem" (mirror of the celebrity problem). Pull-on-read is
            O(50,000 × posts) per feed open — catastrophic. Solution: apply the same hybrid logic
            in reverse. For a "super-follower" (someone who follows an enormous number of accounts),
            you cannot pull all of them. Options: (1) cap follows (Twitter historically limited to 2000),
            (2) use a tiered fan-out — prioritize a "close friends" subset for pull and rely on fan-out
            from the rest, (3) asynchronously pre-aggregate the merged feed in a background job so
            the read is still O(1). In an interview, naming the problem and option (1) or (2) is enough.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="sQuiz">
        <div className="sec-label">Section 13 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer — explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 73 complete?</strong> Homework: model the social feed system in Java.
        Create a <C>FollowGraph</C> interface with <C>getFollowers(userId)</C> and
        <C>getCelebrityFollowees(userId)</C>. Implement a <C>HybridFeedStrategy</C> that
        reads from a prebuilt <C>FeedQueue</C> and merges celebrity posts pulled from a
        <C>PostStore</C>. Write a <C>FeedCursor</C> record and a <C>getAfterCursor()</C>
        method that filters by timestamp. Test: insert a new post between page 1 and page 2
        loads, and confirm cursor pagination returns no duplicates or skips.
        <br /><br />
        Next: <strong>Day 74 — Task Management Board</strong>: designing a Trello/Jira-style board
        with columns, cards, drag-and-drop ordering, assignments, and due-date tracking — a system
        that teaches ordered collections, position management, and observer-driven UI updates.
      </div>

    </div>
  )
}
