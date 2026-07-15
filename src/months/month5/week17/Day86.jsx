import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Live URL Shortener (counter + base-62)
   ============================================================ */

const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

function encodeBase62(n) {
  if (n === 0) return '0'
  let result = ''
  while (n > 0) {
    result = BASE62_CHARS[n % 62] + result
    n = Math.floor(n / 62)
  }
  return result
}

function encodeSteps(n) {
  const steps = []
  let cur = n
  while (cur > 0) {
    const rem = cur % 62
    steps.push({ digit: BASE62_CHARS[rem], rem, value: cur })
    cur = Math.floor(cur / 62)
  }
  return steps.reverse()
}

function LiveShortener() {
  const [counter, setCounter] = useState(1000)
  const [inputUrl, setInputUrl] = useState('https://www.example.com/some/very/long/path?query=hello&ref=social')
  const [links, setLinks] = useState([])
  const [redirectMsg, setRedirectMsg] = useState(null)

  function shorten() {
    if (!inputUrl.trim()) return
    const id = counter
    const code = encodeBase62(id)
    const steps = encodeSteps(id)
    setLinks(prev => [{ id, code, url: inputUrl.trim(), steps }, ...prev.slice(0, 7)])
    setCounter(c => c + 1)
    setRedirectMsg(null)
  }

  function simulate(link) {
    setRedirectMsg({ code: link.code, url: link.url })
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Counter + Base-62 URL shortener</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          className="txt"
          style={{ flex: 1, minWidth: 260 }}
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          placeholder="Paste a long URL…"
        />
        <button className="act" onClick={shorten}>Shorten</button>
        <button className="ghost act" onClick={() => { setLinks([]); setCounter(1000); setRedirectMsg(null) }}>Reset</button>
      </div>

      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 8 }}>
        Next counter ID: <b style={{ color: '#2D5BFF' }}>{counter}</b> → code: <b style={{ color: '#2E9E6B' }}>{encodeBase62(counter)}</b>
      </div>

      {links.length === 0 && (
        <div className="empty" style={{ padding: 16, textAlign: 'center', color: '#7c8aa5', border: '1px dashed #DCD9CF', borderRadius: 8 }}>
          Paste a URL and click Shorten to generate your first short code.
        </div>
      )}

      {links.map(link => (
        <div key={link.id} style={{ borderLeft: '3px solid #2D5BFF', paddingLeft: 12, marginBottom: 14 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
            <span style={{ color: '#7c8aa5' }}>short.ly/</span>
            <span style={{ color: '#2D5BFF', fontWeight: 700 }}>{link.code}</span>
            {' → '}
            <span style={{ color: '#555', fontSize: 12 }}>{link.url.length > 55 ? link.url.slice(0, 55) + '…' : link.url}</span>
          </div>
          <div style={{ fontSize: 11, color: '#7c8aa5', marginTop: 3, fontFamily: 'IBM Plex Mono' }}>
            ID {link.id} encoding steps:&nbsp;
            {link.steps.map((s, i) => (
              <span key={i}>
                {link.steps[0].value} ÷ 62<sup style={{ fontSize: 9 }}>{i}</sup> → rem {s.rem} → '{s.digit}'
                {i < link.steps.length - 1 ? ', ' : ''}
              </span>
            ))}
            &nbsp;→ reversed = <b style={{ color: '#2E9E6B' }}>"{link.code}"</b>
          </div>
          <button
            className="ghost act"
            style={{ fontSize: 12, padding: '3px 10px', marginTop: 5 }}
            onClick={() => simulate(link)}
          >
            Simulate redirect
          </button>
        </div>
      ))}

      {redirectMsg && (
        <div className="good" style={{ marginTop: 10 }}>
          <b>GET /</b><b style={{ color: '#2D5BFF' }}>{redirectMsg.code}</b>
          <br />
          <b>302 Found → Location:</b> {redirectMsg.url}
          <br />
          <span style={{ fontSize: 12, color: '#555' }}>
            Lookup order: Redis cache → DB. ClickEvent logged async. Browser follows redirect.
          </span>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Demo 2 — Base-62 Encoder / Decoder
   ============================================================ */

function decodeBase62(s) {
  let result = 0
  for (const c of s) {
    const idx = BASE62_CHARS.indexOf(c)
    if (idx === -1) return NaN
    result = result * 62 + idx
  }
  return result
}

const EXAMPLE_TABLE = [
  { id: 0, code: '0' },
  { id: 1, code: '1' },
  { id: 61, code: 'Z' },
  { id: 62, code: '10' },
  { id: 3844, code: '100' },
  { id: 238328, code: '1000' },
  { id: 56800235584, code: '100000' },
]

function EncoderDecoder() {
  const [encInput, setEncInput] = useState('1000')
  const [decInput, setDecInput] = useState('G8')

  const encResult = (() => {
    const n = parseInt(encInput, 10)
    if (isNaN(n) || n < 0) return '—'
    return encodeBase62(n)
  })()

  const decResult = (() => {
    if (!decInput.trim()) return '—'
    const n = decodeBase62(decInput.trim())
    if (isNaN(n)) return 'invalid characters'
    return String(n)
  })()

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Base-62 encoder / decoder</div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Encode an integer →</div>
          <input
            className="txt"
            type="number"
            min="0"
            value={encInput}
            onChange={e => setEncInput(e.target.value)}
            placeholder="Enter integer…"
            style={{ width: '100%' }}
          />
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, marginTop: 8 }}>
            Base-62 code: <b style={{ color: '#2D5BFF' }}>{encResult}</b>
          </div>
          <div style={{ fontSize: 12, color: '#7c8aa5', marginTop: 4 }}>
            Length: {encResult === '—' ? '—' : encResult.length} char{encResult.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Decode a code →</div>
          <input
            className="txt"
            value={decInput}
            onChange={e => setDecInput(e.target.value)}
            placeholder="Enter base-62 code…"
            style={{ width: '100%' }}
          />
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, marginTop: 8 }}>
            Integer: <b style={{ color: '#2E9E6B' }}>{decResult}</b>
          </div>
          <div style={{ fontSize: 12, color: '#7c8aa5', marginTop: 4 }}>
            Round-trip check: {encResult !== '—' && decInput === encResult ? '✅ encode(decode) matches' : 'type a code to check'}
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="matrix" style={{ width: '100%', fontSize: 13 }}>
          <thead>
            <tr>
              <th>Integer ID</th>
              <th>Base-62 code</th>
              <th>Code length</th>
              <th>Capacity at this length</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLE_TABLE.map(row => (
              <tr key={row.id}>
                <td style={{ fontFamily: 'IBM Plex Mono' }}>{row.id.toLocaleString()}</td>
                <td style={{ fontFamily: 'IBM Plex Mono', color: '#2D5BFF', fontWeight: 600 }}>{row.code}</td>
                <td style={{ textAlign: 'center' }}>{row.code.length}</td>
                <td style={{ color: '#555' }}>
                  {row.code.length === 1 && '62 unique codes'}
                  {row.code.length === 2 && '3,844 unique codes'}
                  {row.code.length === 3 && '238,328 unique codes'}
                  {row.code.length === 4 && '14,776,336 unique codes'}
                  {row.code.length === 5 && '916,132,832 unique codes'}
                  {row.code.length === 6 && '56,800,235,584 unique codes (~56 billion)'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Good>
        62^6 = 56,800,235,584. Even if you shorten 100 links per second, 6-char codes last 18 years before you need a 7th character. No collision by construction — each ID is unique.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 3 — Analytics Dashboard
   ============================================================ */

const INITIAL_LINKS = [
  { code: 'abc1', label: 'Product launch post', clicks: 1240, weight: 35 },
  { code: 'xyz9', label: 'Blog article — "How We Built It"', clicks: 890, weight: 28 },
  { code: 'k7mQ', label: 'Twitter bio link', clicks: 340, weight: 18 },
  { code: 'R4nB', label: 'Email newsletter CTA', clicks: 210, weight: 12 },
  { code: 'ww2Z', label: 'Conference slide deck', clicks: 85, weight: 7 },
]

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function hourWeight(h) {
  // peak at 9am and 6pm
  if (h >= 8 && h <= 10) return 18
  if (h >= 17 && h <= 19) return 15
  if (h >= 12 && h <= 13) return 10
  if (h >= 0 && h <= 5) return 1
  return 5
}

const HOUR_BASE = (() => {
  const raw = HOURS.map(h => ({ h, w: hourWeight(h) }))
  const total = raw.reduce((s, x) => s + x.w, 0)
  return raw.map(x => ({ h: x.h, pct: Math.round((x.w / total) * 100) }))
})()

function AnalyticsDashboard() {
  const [links, setLinks] = useState(INITIAL_LINKS)
  const [simCount, setSimCount] = useState(0)

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0)
  const topLink = links.reduce((best, l) => l.clicks > best.clicks ? l : best, links[0])
  const maxClicks = Math.max(...links.map(l => l.clicks))

  function simulate() {
    const BATCH = 1000
    setSimCount(c => c + BATCH)
    setLinks(prev => {
      const totalWeight = prev.reduce((s, l) => s + l.weight, 0)
      const additions = Array(BATCH).fill(0).map(() => {
        const r = Math.random() * totalWeight
        let acc = 0
        for (const l of prev) {
          acc += l.weight
          if (r < acc) return l.code
        }
        return prev[prev.length - 1].code
      })
      const delta = {}
      for (const code of additions) delta[code] = (delta[code] || 0) + 1
      return prev.map(l => ({ ...l, clicks: l.clicks + (delta[l.code] || 0) }))
    })
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Async analytics dashboard</div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="act" onClick={simulate}>Simulate 1,000 clicks</button>
        <button className="ghost act" onClick={() => { setLinks(INITIAL_LINKS); setSimCount(0) }}>Reset</button>
        <span style={{ fontSize: 13, color: '#7c8aa5' }}>
          Total simulated clicks added: <b style={{ color: '#2D5BFF' }}>{simCount.toLocaleString()}</b>
        </span>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Clicks per short link</div>
        {links.map(link => (
          <div key={link.code} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
              <span>
                <span style={{ fontFamily: 'IBM Plex Mono', color: '#2D5BFF', fontWeight: 600 }}>/{link.code}</span>
                {' — '}{link.label}
                {link.code === topLink.code && <span style={{ color: '#2E9E6B', fontWeight: 700, marginLeft: 6 }}>★ Top</span>}
              </span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{link.clicks.toLocaleString()}</span>
            </div>
            <div style={{ height: 10, background: '#EEE', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((link.clicks / maxClicks) * 100)}%`,
                background: link.code === topLink.code ? '#2E9E6B' : '#2D5BFF',
                borderRadius: 5,
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 13, marginTop: 6 }}>
          Total clicks: <b>{totalClicks.toLocaleString()}</b> &nbsp;|&nbsp;
          Top link: <b style={{ color: '#2E9E6B' }}>/{topLink.code}</b> ({topLink.clicks.toLocaleString()} clicks)
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Click distribution by hour of day (UTC)</div>
        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 60 }}>
          {HOUR_BASE.map(({ h, pct }) => (
            <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                title={`${h}:00 — ${pct}% of clicks`}
                style={{
                  width: '100%',
                  height: `${pct * 2.8}px`,
                  background: (h >= 8 && h <= 10) || (h >= 17 && h <= 19) ? '#D97B29' : '#2D5BFF',
                  borderRadius: '2px 2px 0 0',
                  minHeight: 3,
                  opacity: 0.85,
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7c8aa5', fontFamily: 'IBM Plex Mono', marginTop: 2 }}>
          <span>0:00</span><span>6:00</span><span>9:00 ▲</span><span>12:00</span><span>18:00 ▲</span><span>23:00</span>
        </div>
        <div style={{ fontSize: 12, color: '#7c8aa5', marginTop: 4 }}>
          Orange bars = peak hours (9am, 6pm). Analytics computed by a background consumer — never on the redirect path.
        </div>
      </div>

      <Note>
        The redirect service fires a ClickEvent to a queue and immediately returns the 302. A separate consumer reads the queue and updates these counters. The redirect path never touches the analytics DB.
      </Note>
    </div>
  )
}

/* ============================================================
   Quiz
   ============================================================ */

const QUESTIONS = [
  {
    q: 'Which code-generation strategy guarantees zero collisions by construction?',
    o: [
      'Random base-62 string (6 chars)',
      'MD5 hash of the long URL, take first 6 chars',
      'Counter-based ID encoded in base-62',
      'UUID v4 truncated to 8 chars',
    ],
    a: 2,
    e: 'Counter-based base-62 encoding is bijective: every integer maps to exactly one code and back. No two integers share a code, so no collisions are possible by construction.',
    w: {
      0: 'Random strings can repeat. The birthday paradox means collisions become likely much earlier than you think — at √(62^6) ≈ 238,000 insertions.',
      1: 'MD5 hashes can collide (birthday paradox), and truncating to 6 chars makes collisions even more likely. Same URL always produces the same code, losing per-user analytics.',
      3: 'UUID v4 is 128 random bits. Truncating to 8 chars drops most of the entropy, creating significant collision risk.',
    },
    r: { id: 's2', label: 'Section 2 — Three code-generation strategies' },
  },
  {
    q: 'You encode the integer 62 in base-62. What is the result?',
    o: ['"Z"', '"10"', '"62"', '"1Z"'],
    a: 1,
    e: '62 in base-62 is "10": 62 ÷ 62 = 1 remainder 0. So the digits are [1, 0] = "10". Just like 10 in decimal means "one group of 10 and zero units", "10" in base-62 means "one group of 62 and zero units".',
    w: {
      0: '"Z" is the last single digit in base-62 (index 61). 61 encodes to "Z", not 62.',
      2: '"62" looks like decimal notation. Base-62 has no digit "6" used that way — digits go 0-9, a-z, A-Z.',
      3: '"1Z" would mean 1×62 + 61 = 123, not 62.',
    },
    r: { id: 's3', label: 'Section 3 — Base-62 encoding deep dive' },
  },
  {
    q: 'Why should the redirect endpoint return HTTP 302 (temporary redirect) instead of 301 (permanent redirect)?',
    o: [
      '302 is faster because browsers cache it locally',
      '301 causes browsers to skip the redirect server permanently, breaking click analytics',
      '302 is required by the HTTP spec for shortened URLs',
      '301 responses cannot carry a Location header',
    ],
    a: 1,
    e: 'With 301, browsers permanently cache the redirect and go directly to the destination on future clicks — bypassing your server entirely. You lose all click analytics. 302 is temporary, so browsers always re-request through your server, letting you count every click.',
    w: {
      0: '301 is actually what browsers cache, not 302. 302 is intentionally NOT cached to ensure every request passes through your server.',
      2: 'The HTTP spec has no such requirement. 302 vs 301 is a business decision, not a spec constraint.',
      3: 'Both 301 and 302 can carry a Location header. The difference is cacheability, not header support.',
    },
    r: { id: 's7', label: 'Section 7 — Redirect performance and 302 vs 301' },
  },
  {
    q: 'Why is Redis used on the redirect path instead of just querying the database every time?',
    o: [
      'Redis supports longer URLs than most databases',
      'The database cannot store string keys',
      'A popular link might get millions of redirects per day; Redis serves them in under 2ms vs 20ms+ for a DB query',
      'Redis automatically generates the base-62 codes',
    ],
    a: 2,
    e: 'The redirect path is latency-critical. A DB round-trip takes 10–50ms; Redis serves from memory in under 2ms. A popular link hit millions of times per day would saturate the DB without a cache.',
    w: {
      0: 'Redis and most databases handle the same string lengths. URL length is not the reason.',
      1: 'Databases absolutely support string keys — that is a core use case.',
      3: 'Redis does not generate codes. The counter and encoding logic live in the application layer.',
    },
    r: { id: 's7', label: 'Section 7 — Redirect performance and caching' },
  },
  {
    q: 'Click analytics are logged asynchronously. What is the main reason for doing it this way?',
    o: [
      'Async logging is required to comply with GDPR',
      'The analytics DB is read-only',
      'Writing to the analytics DB synchronously would add latency to every redirect, slowing down the user',
      'Async logging prevents duplicate click events',
    ],
    a: 2,
    e: 'The redirect must be fast (< 10ms). Writing a ClickEvent to the analytics DB synchronously could add 10–50ms. Instead, the redirect service fires a message to a queue (nearly instant) and returns the 302. A background consumer processes the queue at its own pace.',
    w: {
      0: 'GDPR governs data privacy, not how you write to analytics DBs. Async vs sync logging is a performance decision.',
      1: 'The analytics DB is a write-heavy store (append-only events). It is not read-only.',
      3: 'Async logging does not prevent duplicates — at-least-once delivery actually risks duplicates. Idempotency keys solve that, not async delivery.',
    },
    r: { id: 's7', label: 'Section 7 — Async click logging' },
  },
  {
    q: 'A user submits the same long URL twice. Should the system return the same short code or a different one?',
    o: [
      'Always the same code — deduplication is free storage',
      'Always different codes — each submission is a separate link',
      'It depends on the product decision: same code loses per-user analytics; different codes use more storage',
      'The database constraint forces the same code automatically',
    ],
    a: 2,
    e: 'There is no universally correct answer. Same code: saves storage, easier to share. Different codes: each user gets their own analytics (who submitted this, how many of their clicks came in). Most production systems like Bit.ly give different codes per submission so analytics are isolated.',
    w: {
      0: 'Returning the same code is a valid choice but loses analytics isolation — you cannot tell which user\'s audience clicked how many times.',
      1: 'Different codes is also valid but not the only option. The key insight is that it is a product decision, not a technical necessity.',
      3: 'The database constraint is on (shortCode) being unique, not on (longUrl) being unique. The same longUrl can have many short codes.',
    },
    r: { id: 's5', label: 'Section 5 — Counter IDs in production' },
  },
  {
    q: 'How does a distributed system generate unique counter IDs without a single global counter bottleneck?',
    o: [
      'Each server picks a random number and retries on conflict',
      'A Snowflake-style ID generator combines timestamp + machine ID + sequence, giving globally unique monotonic IDs per server',
      'Base-62 encoding itself prevents duplicates across servers',
      'The database auto-increment column is used directly with a distributed lock',
    ],
    a: 1,
    e: 'Snowflake (and variants) splits a 64-bit ID into: timestamp bits + machine/datacenter ID bits + per-machine sequence bits. Each machine generates unique IDs locally without coordination, and IDs are time-ordered.',
    w: {
      0: 'Random numbers with retry is Option A (random codes), not a counter approach. It has collision risk.',
      2: 'Base-62 encoding is just a number representation. It does not prevent two servers from encoding the same number differently or from generating the same counter value.',
      3: 'A distributed lock on a DB auto-increment creates a central bottleneck and a single point of failure — exactly what Snowflake-style IDs avoid.',
    },
    r: { id: 's5', label: 'Section 5 — Distributed ID generation' },
  },
  {
    q: 'What happens when a short link with an expiresAt in the past is requested?',
    o: [
      'The system redirects to the long URL anyway — expiry only affects new insertions',
      'The redirect service returns HTTP 410 Gone',
      'The cache automatically removes expired links before they are served',
      'The system regenerates a new short code for the same long URL',
    ],
    a: 1,
    e: '410 Gone is the correct status for "this resource existed but no longer does". The redirect service checks if now() > expiresAt before returning the long URL. A background sweeper cleans up expired links from DB and cache, but the expiry check on the redirect path is the load-bearing safety net.',
    w: {
      0: 'Ignoring expiry on the redirect would break the product contract entirely. Users who share time-limited links expect them to stop working.',
      2: 'Cache TTL can evict expired entries, but the cache may also serve stale data if the TTL is longer than the link\'s expiresAt. The application must always check expiry, not rely on cache eviction timing.',
      3: 'Regenerating a code would silently reactivate an expired link — the opposite of the intended behavior.',
    },
    r: { id: 's8', label: 'Section 8 — Expiry, custom aliases, and collision handling' },
  },
]

/* ============================================================
   Page
   ============================================================ */

export default function Day86() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 86</div>
        <h1>URL Shortener:<br />Code Generation, Redirects &amp; Analytics</h1>
        <p>
          TinyURL looks simple. The interesting parts are invisible: generating billions of unique codes
          without collisions, redirecting in under 10ms, and counting clicks without slowing down the redirect.
          Build it right.
        </p>
        <div className="chips">
          {['Base-62', 'Counter ID', 'Distributed IDs', 'Redis Redirect Cache', 'Async Analytics', 'Collision Handling', 'Custom Alias'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* ── Section 1 ── Analogy + framing */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The Coat-Check Analogy</h2>
        <p>
          Imagine a <strong>coat-check at a concert venue</strong>. You hand in your coat — a bulky, complicated thing.
          The attendant gives you a small numbered ticket: "47". When the concert ends, you show the ticket,
          the attendant fetches your coat, and hands it back.
        </p>
        <p>
          The coat-check stand does not care what is in the coat. It just maintains a mapping:
          <strong> ticket 47 → coat</strong>. The ticket is short, easy to read, and unique.
        </p>
        <p>
          A URL shortener works exactly the same way:
        </p>
        <Code html={`Coat-check analogy:

  Your coat (long URL):
    https://www.example.com/very/long/path?utm_source=twitter&utm_campaign=spring2025

  Your ticket (short code):
    short.ly/abc123

  The coat-check stand (the service):
    stores the mapping,
    gives you the ticket on the way in,
    fetches the coat when you show the ticket.

What makes this hard at scale:
  1. Millions of coats — how to generate unique ticket numbers fast,
     across multiple servers, without duplicates?
  2. Millions of people showing tickets simultaneously — how to
     look up coats in under 10ms every time?
  3. Tracking how many times each coat was fetched — without
     making the fetch itself slow.`} />

        <Note>
          The CRUD part (store a mapping, retrieve it) is easy. The interesting engineering is in code generation
          at scale, sub-10ms redirects, and decoupled analytics. That is what this day is about.
        </Note>

        <Reveal summary="What do real numbers look like at Bit.ly scale?">
          <p>
            Bit.ly reported ~600 million redirects per month at peak — about 230 per second on average, with
            much higher bursts. At that rate:
          </p>
          <ul>
            <li>Every 1ms of redirect latency = ~230ms of aggregate user wait per second.</li>
            <li>Writing a click event synchronously on every redirect = 230 DB writes/second minimum, with burst spikes orders of magnitude higher.</li>
            <li>A single counter on one database server would become a bottleneck fast — hence distributed ID generators.</li>
          </ul>
        </Reveal>
      </section>

      {/* ── Section 2 ── Three strategies */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Three Ways to Generate a Short Code</h2>
        <p>
          The core problem: given a long URL, produce a short, unique code like <C>abc123</C>.
          There are three main approaches.
        </p>
        <Code html={`Option A — Random base-62 string
──────────────────────────────────────────────────────
  Generate 6 random chars from [0-9a-zA-Z].
  62^6 ≈ 56 billion possible codes.
  ✓ Simple to implement.
  ✗ Collisions are possible (birthday paradox).
  ✗ Must check DB before each insert, retry on collision.

Option B — Counter + base-62 encoding  ← production choice
──────────────────────────────────────────────────────
  Use a monotonically increasing ID (1, 2, 3, …).
  Encode the integer in base-62: 1→"1", 62→"10", 1000→"G8".
  ✓ No collisions by construction — each integer is unique.
  ✓ Codes stay short (6 chars handles 56 billion).
  ✗ Requires a reliable counter / distributed ID generator.

Option C — Hash of the URL (MD5/SHA-256, first 6 chars)
──────────────────────────────────────────────────────
  Deterministic: same URL always → same code.
  ✓ Idempotent — submit same URL twice, get same code.
  ✗ Collisions happen (birthday paradox on the truncated hash).
  ✗ Cannot give different users different analytics for the same URL.
  ✗ Usually ruled out in interviews.`} />

        <table className="matrix" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Criterion</th>
              <th>Option A (Random)</th>
              <th>Option B (Counter)</th>
              <th>Option C (Hash)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Collision-free?</td>
              <td className="no">No — retry needed</td>
              <td className="yes">Yes — by construction</td>
              <td className="no">No — birthday paradox</td>
            </tr>
            <tr>
              <td>Same URL = same code?</td>
              <td className="no">No</td>
              <td className="no">No (different IDs)</td>
              <td className="yes">Yes</td>
            </tr>
            <tr>
              <td>Per-user analytics?</td>
              <td className="yes">Yes</td>
              <td className="yes">Yes</td>
              <td className="no">No</td>
            </tr>
            <tr>
              <td>Production use?</td>
              <td>Small scale</td>
              <td className="yes">Yes (Bit.ly, TinyURL)</td>
              <td className="no">Rarely</td>
            </tr>
          </tbody>
        </table>

        <Good>
          In interviews, name all three options, then commit to Option B. Explain why: no collision risk,
          predictable code length, and it works naturally with distributed ID generators.
        </Good>
      </section>

      {/* ── Section 3 ── Base-62 encoding */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Base-62 Encoding — The Math Behind the Magic</h2>
        <p>
          You know base-10 (decimal: digits 0–9) and base-16 (hex: digits 0–9, a–f).
          Base-62 uses 62 characters: <strong>0–9, a–z, A–Z</strong>. More digits per position = shorter strings.
        </p>

        <Code html={`<span class="cm">// Base-62 character set — 62 unique symbols</span>
<span class="kw">private static final</span> String CHARS =
    <span class="str">"0123456789"</span>         <span class="cm">// indices 0–9</span>
  + <span class="str">"abcdefghijklmnopqrstuvwxyz"</span>  <span class="cm">// indices 10–35</span>
  + <span class="str">"ABCDEFGHIJKLMNOPQRSTUVWXYZ"</span>; <span class="cm">// indices 36–61</span>

<span class="cm">// Encode an integer to a base-62 string</span>
<span class="kw">static</span> String <span class="kw">encode</span>(<span class="kw">long</span> id) {
    <span class="kw">if</span> (id == <span class="num">0</span>) <span class="kw">return</span> <span class="str">"0"</span>;
    StringBuilder sb = <span class="kw">new</span> StringBuilder();
    <span class="kw">while</span> (id > <span class="num">0</span>) {
        sb.append(CHARS.charAt((<span class="kw">int</span>)(id % <span class="num">62</span>))); <span class="cm">// remainder → next digit</span>
        id /= <span class="num">62</span>;                                   <span class="cm">// shift right in base-62</span>
    }
    <span class="kw">return</span> sb.reverse().toString(); <span class="cm">// we built it least-significant-first</span>
}

<span class="cm">// Decode a base-62 string back to the integer</span>
<span class="kw">static long decode</span>(String code) {
    <span class="kw">long</span> result = <span class="num">0</span>;
    <span class="kw">for</span> (<span class="kw">char</span> c : code.toCharArray()) {
        result = result * <span class="num">62</span> + CHARS.indexOf(c); <span class="cm">// shift left and add digit value</span>
    }
    <span class="kw">return</span> result;
}

<span class="cm">// Examples:</span>
<span class="cm">//   encode(1)         → "1"</span>
<span class="cm">//   encode(61)        → "Z"   (last single-char code)</span>
<span class="cm">//   encode(62)        → "10"  (first two-char code)</span>
<span class="cm">//   encode(1_000_000) → "4c92"</span>
<span class="cm">//   encode(56_800_235_583) → "ZZZZZZ"  (last 6-char code)</span>`} />

        <Code html={`Capacity by code length:

  Length 1:  62^1 =             62 unique codes
  Length 2:  62^2 =          3,844 unique codes
  Length 3:  62^3 =        238,328 unique codes
  Length 4:  62^4 =     14,776,336 unique codes  (14 million)
  Length 5:  62^5 =    916,132,832 unique codes  (900 million)
  Length 6:  62^6 = 56,800,235,584 unique codes  (56 billion)  ← industry standard
  Length 7:  62^7 = 3,521,614,606,208            (3.5 trillion)

At 100 new links/second, 6-char codes last about 18 years.`} />

        <Note>
          Base-64 (used for binary encoding) includes <C>+</C> and <C>/</C>, which are not URL-safe.
          Base-62 uses only alphanumerics — safe in a URL path with no escaping needed.
        </Note>

        <Reveal summary="Why not base-36 (lowercase only)?">
          <p>
            Base-36 uses 0–9 and a–z. That gives 36^6 = 2.1 billion codes with 6 characters — only 4% of base-62's capacity.
            You would need 7 characters to match base-62's 6-char capacity. Longer codes are less shareable.
            The slight complexity of mixed case is worth the 27x capacity gain.
          </p>
        </Reveal>
      </section>

      {/* ── Section 4 ── Demo 1 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: Live URL Shortener</h2>
        <p>
          Paste any URL and click Shorten. Watch the counter increment and see each encoding step
          explained. Then click "Simulate redirect" to see what the redirect service returns.
        </p>
        <LiveShortener />
        <Good>
          Notice that each new short code is longer only when the counter crosses a power of 62.
          The encoding steps show exactly why the digits come out in a specific order.
        </Good>
      </section>

      {/* ── Section 5 ── Distributed ID generation */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Counter + Base-62 in Production: No Single Bottleneck</h2>
        <p>
          A single database auto-increment counter works for one server. At scale, multiple servers
          shorten URLs concurrently. You need IDs that are globally unique without all servers
          talking to one central counter.
        </p>

        <Code html={`Snowflake ID (Twitter's open-source design, 64 bits total):

  | 41 bits timestamp | 10 bits machine ID | 13 bits sequence |
    (ms since epoch)    (unique per server)   (0-8191 per ms)

How it works:
  - Each server knows its own machine ID (assigned at startup).
  - Each server tracks a per-millisecond sequence counter.
  - ID = (timestamp &lt;&lt; 23) | (machineId &lt;&lt; 13) | sequence

  Server A at t=1000ms generates IDs: 1000_01_0000, 1000_01_0001, ...
  Server B at t=1000ms generates IDs: 1000_02_0000, 1000_02_0001, ...
  → No coordination needed. No collisions. Time-ordered by default.

Then encode the 64-bit Snowflake ID in base-62:
  64-bit number → base-62 string (about 10-11 chars)
  Or use only the lower bits to keep codes to 6-7 chars.`} />

        <Note>
          Snowflake IDs are time-ordered, which means short codes generated close in time sort
          together in the database. This improves B-tree index locality (less random I/O).
        </Note>

        <Reveal summary="Alternative: ID range pre-allocation">
          <p>
            A simpler distributed approach: each application server requests a block of 10,000 IDs
            from a central counter service at startup (e.g. IDs 500,000–510,000). It then assigns
            IDs from its local block without any network call. When the block runs out, it fetches
            the next block. This is how many production systems work — you only hit the central
            counter service once per 10,000 links, not once per link.
          </p>
        </Reveal>

        <Reveal summary="What about UUIDs?">
          <p>
            UUIDs are 128 random bits — globally unique but terrible for URL codes. A UUID like
            <code> 550e8400-e29b-41d4-a716-446655440000</code> is 36 characters. Even the 8-char short form is
            too long and random (poor cache locality, ugly in URLs). Snowflake-style IDs give uniqueness
            with a fraction of the length.
          </p>
        </Reveal>
      </section>

      {/* ── Section 6 ── Demo 2 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>Play: Base-62 Encoder / Decoder</h2>
        <p>
          Type any integer to see its base-62 code. Type any base-62 code to decode it back.
          Verify the round-trip: <C>decode(encode(N)) == N</C>. The table shows landmark values.
        </p>
        <EncoderDecoder />
        <Good>
          Notice how slowly the code length grows. You stay at 6 characters all the way to 56 billion.
          A system creating 1,000 links/day would take 155,000 years to exhaust 6-char codes.
        </Good>
      </section>

      {/* ── Section 7 ── Redirect performance */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Redirect Performance: Redis Cache + Async Logging</h2>
        <p>
          The redirect path (<C>GET /abc123 → 302 → long URL</C>) is the hot path. It must be fast.
          Two techniques make it so: a Redis cache and async click logging.
        </p>

        <Code html={`Redirect flow (optimized):

  Client                  Redirect Service          Redis          Database
    │                           │                     │               │
    │── GET /abc123 ───────────▶│                     │               │
    │                           │── GET abc123 ──────▶│               │
    │                           │◀── "https://..." ───│  cache HIT    │
    │◀── 302 Location: "..." ───│                     │               │
    │                           │──fire-and-forget ──▶│ ClickEvent Queue
    │                           │   (async, no wait)  │               │
    │                           │                     │               │
    │              [on cache MISS, add DB step:]      │               │
    │                           │── GET abc123 ──────────────────────▶│
    │                           │◀─────────── "https://..." ──────────│
    │                           │── SET abc123 TTL ──▶│               │
    │◀── 302 Location: "..." ───│                     │               │

Latency budget:
  Cache hit:   Redis lookup (~0.5ms) + send 302 = ~2ms total
  Cache miss:  DB lookup (~15ms) + cache write + send 302 = ~20ms
  Click log:   async queue write, does NOT block the 302 response`} />

        <Note>
          <strong>302 (Temporary Redirect) vs 301 (Permanent Redirect):</strong> 301 tells browsers to cache
          the redirect permanently and go directly to the destination next time — bypassing your server.
          You lose all click analytics. Always use 302 for shortened URLs so every click passes through
          your server and gets counted.
        </Note>

        <Reveal summary="What TTL should Redis use for cached short links?">
          <p>
            Common strategy: set TTL based on link age and traffic. A brand-new link gets a short TTL
            (e.g., 1 hour) so that if it was created wrong, the fix propagates quickly. A link that has
            been active for a week gets a longer TTL (24 hours). Very popular links can be given
            indefinite TTL with manual eviction on link deletion.
          </p>
          <p>
            Also: when a link is created, warm the cache immediately (write-through). This avoids the
            first-request cache miss on links that are shared right after creation.
          </p>
        </Reveal>

        <Reveal summary="Cache-aside vs write-through for the shortCode → longUrl mapping">
          <p>
            Cache-aside (lazy): only populate the cache on a cache miss. Simple but the first request
            always hits the DB.
            Write-through: on every shorten() call, write to both DB and Redis atomically. More complex
            but zero cold-start misses.
            For a URL shortener, write-through on creation + cache-aside on miss is the common hybrid:
            warm the cache when you create the link, and fall back to DB+cache if the cache evicts it.
          </p>
        </Reveal>
      </section>

      {/* ── Section 8 ── Collision handling, aliases, expiry */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Collision Handling, Custom Aliases, and Expiry</h2>

        <h3 style={{ marginTop: 16 }}>Collision handling (Option A — random codes)</h3>
        <Code html={`<span class="cm">// Only needed for random-code generation (Option A)</span>
String shorten(String longUrl) {
    <span class="kw">for</span> (<span class="kw">int</span> attempt = <span class="num">0</span>; attempt &lt; <span class="num">3</span>; attempt++) {
        String code = randomBase62(<span class="num">6</span>);      <span class="cm">// generate 6 random chars</span>
        <span class="kw">try</span> {
            db.insert(code, longUrl);          <span class="cm">// unique constraint rejects duplicates</span>
            cache.set(code, longUrl, TTL);     <span class="cm">// warm cache immediately</span>
            <span class="kw">return</span> code;
        } <span class="kw">catch</span> (DuplicateKeyException e) {
            <span class="cm">// collision: try again with a fresh random code</span>
        }
    }
    <span class="kw">throw new</span> ServiceException(<span class="str">"Could not generate unique code"</span>);
}
<span class="cm">// Option B (counter) never reaches here — no collision possible</span>`} />

        <h3 style={{ marginTop: 20 }}>Custom aliases</h3>
        <Code html={`<span class="cm">// User requests: short.ly/myBrand instead of a generated code</span>
String shorten(String longUrl, String customAlias) {
    <span class="kw">if</span> (customAlias != <span class="kw">null</span>) {
        validateAlias(customAlias);            <span class="cm">// check length, characters, reserved words</span>
        db.insert(customAlias, longUrl);       <span class="cm">// DuplicateKeyException = alias taken</span>
        cache.set(customAlias, longUrl, TTL);
        <span class="kw">return</span> customAlias;
    }
    <span class="kw">return</span> generateCounterCode(longUrl);       <span class="cm">// fallback to normal flow</span>
}
<span class="cm">// Custom aliases bypass the counter — they live in the same table</span>
<span class="cm">// The shortCode column has a unique constraint, covering both generated + custom.</span>`} />

        <h3 style={{ marginTop: 20 }}>Expiry</h3>
        <Code html={`<span class="kw">class</span> ShortLink {
    String shortCode;
    String longUrl;
    Instant createdAt;
    Instant expiresAt;       <span class="cm">// null = never expires</span>
    AtomicLong clickCount;
}

<span class="cm">// On redirect: check expiry before returning the URL</span>
String redirect(String code) {
    ShortLink link = lookup(code);       <span class="cm">// Redis → DB</span>
    <span class="kw">if</span> (link == <span class="kw">null</span>) <span class="kw">throw new</span> NotFoundException();
    <span class="kw">if</span> (link.expiresAt != <span class="kw">null</span> &amp;&amp; Instant.now().isAfter(link.expiresAt)) {
        cache.evict(code);               <span class="cm">// remove stale cache entry</span>
        <span class="kw">throw new</span> GoneException(<span class="str">"Link expired"</span>);  <span class="cm">// → HTTP 410 Gone</span>
    }
    <span class="kw">return</span> link.longUrl;
}

<span class="cm">// Background sweeper (runs every hour)</span>
<span class="kw">void</span> sweepExpired() {
    List&lt;ShortLink&gt; expired = db.findExpiredBefore(Instant.now());
    <span class="kw">for</span> (ShortLink link : expired) {
        db.delete(link.shortCode);
        cache.evict(link.shortCode);     <span class="cm">// keep cache consistent</span>
    }
}`} />

        <Warn>
          Do not rely solely on Redis TTL to enforce expiry. If the link is served from a cache whose TTL
          has not yet elapsed, an expired link would still redirect. Always check <C>expiresAt</C> in
          application code, even on a cache hit.
        </Warn>
      </section>

      {/* ── Section 9 ── Demo 3 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>Play: Analytics Dashboard</h2>
        <p>
          Five short links are pre-seeded with clicks. Click "Simulate 1,000 clicks" to distribute
          clicks weighted toward the popular links. Watch the bar chart update. The time-of-day panel
          shows where clicks cluster (9am and 6pm peaks). All computed by a background consumer — never
          in the redirect path.
        </p>
        <AnalyticsDashboard />
        <Good>
          The redirect service never reads or writes to the analytics table. It fires a message to a queue
          and immediately returns the 302. The consumer updates these counters asynchronously.
        </Good>
      </section>

      {/* ── Section 10 ── Architecture + cheat sheet */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Full Architecture + Cheat Sheet</h2>

        <Code html={`Full URL Shortener Architecture:

  ┌──────────────────────────────────────────────────────────┐
  │                        Client                            │
  └──────────┬──────────────────────┬───────────────────────┘
             │ POST /shorten        │ GET /abc123
             ▼                      ▼
  ┌──────────────────┐   ┌─────────────────────────────────┐
  │  Shortener API   │   │       Redirect Service           │
  │  ─────────────   │   │  ──────────────────────────────  │
  │  1. Get ID from  │   │  1. Redis lookup (cache-aside)  │
  │     ID Generator │   │  2. Cache miss → DB lookup      │
  │  2. encode(id)   │   │  3. Check expiresAt             │
  │  3. DB insert    │   │  4. Return 302 Location header  │
  │  4. Cache warm   │   │  5. Fire ClickEvent → Queue     │
  └─────────┬────────┘   └────────────┬────────────────────┘
            │                          │
            ▼                          ▼
  ┌──────────────────┐   ┌─────────────────────────────────┐
  │   ID Generator   │   │    ClickEvent Queue             │
  │ (Snowflake-style)│   │  (Kafka / SQS / RabbitMQ)       │
  └──────────────────┘   └────────────┬────────────────────┘
                                       │
            ┌──────────────────────────┼────────────────┐
            ▼                          ▼                │
  ┌─────────────────┐   ┌──────────────────────┐       │
  │     Redis       │   │   Analytics Consumer │       │
  │  (shortCode     │   │  ─────────────────── │       │
  │   → longUrl)    │   │  aggregates clicks   │       │
  └─────────────────┘   │  by link/hour/device │       │
                         └──────────┬───────────┘       │
                                    ▼                   │
  ┌─────────────────────────────────────────────────────┴──┐
  │                   Database (e.g. MySQL)                 │
  │  ShortLink table: shortCode PK, longUrl, createdAt,    │
  │  expiresAt, createdBy                                  │
  │  Analytics table: shortCode, date, hour, clicks, ...   │
  └────────────────────────────────────────────────────────┘`} />

        <h3 style={{ marginTop: 20 }}>Cheat sheet</h3>
        <ul>
          <li><strong>Option B (counter + base-62):</strong> production standard. No collisions by construction. Use Snowflake-style distributed IDs at scale.</li>
          <li><strong>Base-62:</strong> chars 0–9, a–z, A–Z. 62^6 = 56 billion codes. URL-safe (no <C>+</C> or <C>/</C>).</li>
          <li><strong>Redirect path:</strong> Redis lookup → DB fallback → 302. Target under 10ms.</li>
          <li><strong>302 not 301:</strong> 301 caches permanently in browsers; kills analytics.</li>
          <li><strong>Async analytics:</strong> fire ClickEvent to a queue on redirect; never block the 302.</li>
          <li><strong>Expiry:</strong> check <C>expiresAt</C> in application code even on cache hit. Return 410 Gone.</li>
          <li><strong>Custom aliases:</strong> same DB table, unique constraint on <C>shortCode</C>. Bypass ID generator.</li>
          <li><strong>Same URL twice:</strong> product decision — same code (shared analytics) vs different codes (isolated analytics). No universally correct answer.</li>
          <li><strong>Collision handling (Option A only):</strong> unique constraint in DB + retry loop (max 3 attempts).</li>
        </ul>
      </section>

      {/* ── Interview Corner ── */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Interview Corner</h2>
        <p>Six tricky questions. Try to answer each before revealing.</p>

        <Reveal summary="Q1: Why does counter + base-62 beat random string generation for collision guarantees?">
          <p>
            A counter is a bijection: every integer maps to exactly one base-62 string, and every base-62 string
            decodes to exactly one integer. Two different integers always produce two different strings.
            Collisions are mathematically impossible.
          </p>
          <p>
            Random 6-char strings, by contrast, sample from a pool of 56 billion possibilities. The birthday
            paradox says collisions become likely at roughly √(56 billion) ≈ 237,000 insertions — much
            sooner than you expect. At Bit.ly scale, collisions would happen multiple times per minute.
          </p>
        </Reveal>

        <Reveal summary="Q2: What is the birthday paradox and how does it threaten random code generation?">
          <p>
            The birthday paradox: in a group of just 23 people, there is a 50% chance two share a birthday —
            even though there are 365 days. The formula: collision probability ≈ 1 - e^(-n²/2N) where n is
            the number of insertions and N is the pool size.
          </p>
          <p>
            For base-62 6-char codes (N = 56 billion): a 1% collision probability occurs at just ~750,000
            insertions. A popular service reaches that in hours. Every collision requires a DB check and retry,
            adding latency and complexity. Counter-based IDs eliminate this entirely.
          </p>
        </Reveal>

        <Reveal summary="Q3: Why use 302 (temporary redirect) instead of 301 (permanent redirect)?">
          <p>
            301 means "this resource has moved permanently." Browsers cache 301 responses and send future
            requests directly to the destination — skipping your server entirely. Your analytics never see
            those clicks.
          </p>
          <p>
            302 means "temporarily found here." Browsers do not cache 302s; every click passes through your
            redirect server. You count every visit. The cost: one extra network hop per click — but that hop
            is under 10ms with Redis, making it imperceptible to users.
          </p>
        </Reveal>

        <Reveal summary="Q4: How do you make the redirect path under 10ms?">
          <p>
            Three techniques:
          </p>
          <ol>
            <li><strong>Redis cache:</strong> serve the shortCode → longUrl mapping from memory. Redis lookups take 0.5–2ms, vs 10–50ms for a database query.</li>
            <li><strong>Write-through on creation:</strong> warm the cache the moment a link is created, so the very first redirect is also a cache hit.</li>
            <li><strong>Async click logging:</strong> fire the ClickEvent to a queue (sub-millisecond) instead of writing to the analytics DB synchronously. The 302 returns before the queue write even completes.</li>
          </ol>
          <p>
            Together: cache hit (~1ms) + async queue write (non-blocking) + network overhead = well under 10ms.
          </p>
        </Reveal>

        <Reveal summary="Q5: Same long URL submitted twice — same short code or different? Defend your answer.">
          <p>
            Both are valid — this is a product decision, not a technical one. The tradeoffs:
          </p>
          <ul>
            <li>
              <strong>Same code (deduplication):</strong> saves DB storage, simpler. But you cannot tell which user's campaign drove clicks — all clicks go to one counter.
            </li>
            <li>
              <strong>Different codes per submission:</strong> each user/campaign gets isolated analytics. Uses slightly more storage. This is what Bit.ly does — same long URL can have thousands of short codes, one per campaign.
            </li>
          </ul>
          <p>
            The right answer: "It depends on whether analytics isolation matters." For a simple shortener: same code. For a marketing platform: different codes per submission.
          </p>
        </Reveal>

        <Reveal summary="Q6: How do you scale the counter / ID generator across multiple servers?">
          <p>
            Three approaches:
          </p>
          <ul>
            <li>
              <strong>Snowflake-style ID:</strong> 64-bit number = timestamp (41 bits) + machine ID (10 bits) + sequence (13 bits). Each server generates IDs independently. No coordination. Twitter open-sourced this design.
            </li>
            <li>
              <strong>ID range pre-allocation:</strong> each server fetches a block of 10,000 IDs from a central service at startup. Assigns locally until exhausted, then fetches the next block. Central service is hit once per 10,000 links.
            </li>
            <li>
              <strong>Database auto-increment + single writer:</strong> simple but creates a single point of failure and a write bottleneck. Works at small scale. Avoid at millions of links/day.
            </li>
          </ul>
          <p>
            Snowflake is the production answer. Know the bit layout: timestamp lets you sort IDs by creation time, which is great for database index locality.
          </p>
        </Reveal>
      </section>

      {/* ── Quiz ── */}
      <section id="quiz">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice, including what made the wrong ones tempting.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* ── Footer ── */}
      <div className="footer">
        <strong>Day 86 complete?</strong> Homework: implement <C>Base62Encoder.encode(long id)</C> and
        <C>Base62Encoder.decode(String code)</C> in Java using the CHARS string from Section 3. Write a test that
        verifies the round-trip: <C>decode(encode(N)) == N</C> for every N from 0 to 1,000,000. Also test
        the edge cases: encode(0) = "0", encode(61) = "Z", encode(62) = "10", encode(3844) = "100".
        <br /><br />
        Next: <strong>Day 87 — Search Engine (Inverted Index)</strong>: how Google-style full-text search works
        at the data structure level. Build an in-memory inverted index, understand TF-IDF scoring, and design
        a query parser that handles AND, OR, and phrase queries.
      </div>

    </div>
  )
}
