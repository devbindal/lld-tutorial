import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ─────────────────────────── Demo 1: CDN Latency Visualizer ─────────────────────────── */
const POPS = [
  { id: 'use', label: 'US-East', emoji: '🇺🇸', lat: 40, lng: 20 },
  { id: 'euw', label: 'EU-West', emoji: '🇩🇪', lat: 35, lng: 48 },
  { id: 'apac', label: 'Asia-Pacific', emoji: '🇯🇵', lat: 30, lng: 80 },
  { id: 'usw', label: 'US-West', emoji: '🇺🇸', lat: 50, lng: 12 },
  { id: 'sam', label: 'South America', emoji: '🇧🇷', lat: 65, lng: 30 },
]
const ORIGIN = { id: 'origin', label: 'Origin (US-East)', emoji: '🏢' }
const SHIELD = { id: 'shield', label: 'Shield PoP (US-East)', emoji: '🛡️' }

const USER_LOCATIONS = [
  { id: 'tokyo', label: 'Tokyo', nearestPop: 'apac', directLatency: 160, hitLatency: 5, missLatency: 170 },
  { id: 'london', label: 'London', nearestPop: 'euw', directLatency: 120, hitLatency: 4, missLatency: 130 },
  { id: 'ny', label: 'New York', nearestPop: 'use', directLatency: 15, hitLatency: 3, missLatency: 20 },
  { id: 'sf', label: 'San Francisco', nearestPop: 'usw', directLatency: 80, hitLatency: 4, missLatency: 90 },
  { id: 'sao', label: 'São Paulo', nearestPop: 'sam', directLatency: 140, hitLatency: 5, missLatency: 155 },
]

function LatencyDemo() {
  const [userLoc, setUserLoc] = useState('tokyo')
  const [mode, setMode] = useState('cdn') // 'cdn' | 'nocdn' | 'shield'
  const [cacheState, setCacheState] = useState('hit') // 'hit' | 'miss'
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)

  const user = USER_LOCATIONS.find(u => u.id === userLoc)
  const pop = POPS.find(p => p.id === user.nearestPop)

  function getLatency() {
    if (mode === 'nocdn') return user.directLatency
    if (cacheState === 'hit') return user.hitLatency
    return user.missLatency
  }

  function getSteps() {
    if (mode === 'nocdn') {
      return [
        `User in ${user.label} sends request`,
        `Request travels to Origin (US-East) — ${Math.round(user.directLatency * 0.6)}ms`,
        `Origin processes and responds`,
        `Response travels back to ${user.label} — total ~${user.directLatency}ms`,
      ]
    }
    if (mode === 'shield') {
      if (cacheState === 'hit') {
        return [
          `User in ${user.label} sends request`,
          `DNS routes to nearest PoP: ${pop.label}`,
          `${pop.label} has it cached → responds immediately`,
          `Total latency: ~${user.hitLatency}ms ✅`,
        ]
      }
      return [
        `User in ${user.label} sends request`,
        `DNS routes to nearest PoP: ${pop.label}`,
        `${pop.label} misses → asks Shield PoP (US-East)`,
        `Shield PoP misses → fetches from Origin`,
        `Origin responds → Shield caches → ${pop.label} caches`,
        `Response delivered — total ~${user.missLatency + 20}ms (extra shield hop)`,
      ]
    }
    if (cacheState === 'hit') {
      return [
        `User in ${user.label} sends request`,
        `DNS routes to nearest PoP: ${pop.label}`,
        `${pop.label} has it cached → responds immediately`,
        `Total latency: ~${user.hitLatency}ms ✅`,
      ]
    }
    return [
      `User in ${user.label} sends request`,
      `DNS routes to nearest PoP: ${pop.label}`,
      `${pop.label} misses → fetches from Origin (US-East)`,
      `Origin responds → ${pop.label} caches for future requests`,
      `Response delivered — total ~${user.missLatency}ms (one-time miss)`,
    ]
  }

  const steps = getSteps()

  function runAnimation() {
    if (animating) return
    setAnimating(true)
    setStep(0)
    let i = 0
    const interval = setInterval(() => {
      i++
      setStep(i)
      if (i >= steps.length - 1) {
        clearInterval(interval)
        setAnimating(false)
      }
    }, 700)
  }

  const latency = getLatency()
  const latencyColor = latency < 20 ? '#22c55e' : latency < 80 ? '#f59e0b' : '#ef4444'

  return (
    <div className="panel">
      <div className="ptitle">Live Demo · CDN Latency Visualizer</div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>User location</div>
          <div className="modbtns">
            {USER_LOCATIONS.map(u => (
              <button key={u.id} className={userLoc === u.id ? 'on' : ''} onClick={() => { setUserLoc(u.id); setStep(0) }}>
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>Mode</div>
          <div className="modbtns">
            <button className={mode === 'cdn' ? 'on' : ''} onClick={() => { setMode('cdn'); setStep(0) }}>With CDN</button>
            <button className={mode === 'nocdn' ? 'on' : ''} onClick={() => { setMode('nocdn'); setStep(0) }}>Without CDN</button>
            <button className={mode === 'shield' ? 'on' : ''} onClick={() => { setMode('shield'); setStep(0) }}>Origin Shield</button>
          </div>
        </div>
        {mode !== 'nocdn' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>Cache state</div>
            <div className="modbtns">
              <button className={cacheState === 'hit' ? 'on' : ''} onClick={() => { setCacheState('hit'); setStep(0) }}>Cache Hit</button>
              <button className={cacheState === 'miss' ? 'on' : ''} onClick={() => { setCacheState('miss'); setStep(0) }}>Cache Miss</button>
            </div>
          </div>
        )}
      </div>

      {/* ASCII world diagram */}
      <Code html={`<span class="cm">// Simplified world map — PoPs and origin</span>

  <span class="kw">PoP: US-West</span>   <span class="kw">PoP: US-East / Origin</span>   <span class="kw">PoP: EU-West</span>   <span class="kw">PoP: Asia-Pacific</span>
  🌍 USW             🏢 USE/Origin         🌍 EUW             🌍 APAC
     │                     │                    │                   │
     └──────── CDN backbone (low-latency fiber) ─────────────────────┘
                            │
                    <span class="kw">PoP: South America</span>
                       🌍 SAM`} />

      <button className="act" onClick={runAnimation} disabled={animating} style={{ marginTop: 12, marginBottom: 12 }}>
        {animating ? 'Simulating...' : 'Simulate Request'}
      </button>

      <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 14, marginTop: 4 }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            padding: '6px 0',
            color: i <= step ? 'var(--ink)' : '#bbb',
            fontWeight: i === step ? 700 : 400,
            fontSize: 14,
            transition: 'color 0.3s',
            borderLeft: i <= step ? '3px solid var(--blue)' : '3px solid #eee',
            paddingLeft: 10,
            marginBottom: 4,
          }}>
            {i <= step ? '▶' : '○'} {s}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, padding: '10px 16px', background: '#fff', borderRadius: 8, border: '2px solid ' + latencyColor, display: 'inline-block' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Latency: </span>
        <span style={{ fontSize: 20, fontWeight: 800, color: latencyColor }}>~{mode === 'shield' && cacheState === 'miss' ? latency + 20 : latency}ms</span>
        <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
          {latency < 20 ? '(excellent)' : latency < 80 ? '(acceptable)' : '(slow — user notices)'}
        </span>
      </div>

      <Good>
        Cache hit with CDN = serve from nearby PoP = single-digit milliseconds.
        Cache miss still needs an origin round-trip, but that only happens once per PoP.
        "Without CDN" mode always goes to origin — same slow latency no matter where you are.
      </Good>
    </div>
  )
}

/* ─────────────────────────── Demo 2: Cache-Control Header Builder ─────────────────────────── */
const PRESETS = {
  custom: null,
  bundle: { scope: 'public', maxAge: 31536000, sMaxAge: 0, swr: 0, immutable: true, noStore: false },
  html: { scope: 'public', maxAge: 0, sMaxAge: 300, swr: 60, immutable: false, noStore: false },
  dashboard: { scope: 'private', maxAge: 0, sMaxAge: 0, swr: 0, immutable: false, noStore: true },
  api: { scope: 'public', maxAge: 0, sMaxAge: 60, swr: 30, immutable: false, noStore: false },
}

function CacheControlDemo() {
  const [scope, setScope] = useState('public')
  const [maxAge, setMaxAge] = useState(3600)
  const [sMaxAge, setSMaxAge] = useState(0)
  const [swr, setSwr] = useState(0)
  const [immutable, setImmutable] = useState(false)
  const [noStore, setNoStore] = useState(false)
  const [preset, setPreset] = useState('custom')

  function applyPreset(key) {
    setPreset(key)
    const p = PRESETS[key]
    if (!p) return
    setScope(p.scope)
    setMaxAge(p.maxAge)
    setSMaxAge(p.sMaxAge)
    setSwr(p.swr)
    setImmutable(p.immutable)
    setNoStore(p.noStore)
  }

  function buildHeader() {
    if (noStore) return `Cache-Control: ${scope}, no-store`
    const parts = [scope]
    if (maxAge > 0) parts.push(`max-age=${maxAge}`)
    if (sMaxAge > 0) parts.push(`s-maxage=${sMaxAge}`)
    if (swr > 0) parts.push(`stale-while-revalidate=${swr}`)
    if (immutable) parts.push('immutable')
    if (parts.length === 1 && scope === 'public') parts.push('max-age=0, no-cache')
    return `Cache-Control: ${parts.join(', ')}`
  }

  function browserBehavior() {
    if (noStore) return 'Never saves to disk cache. Fetches from server every time.'
    if (scope === 'private') return `Stores in browser cache for ${maxAge}s. Not shared.`
    if (immutable) return 'Caches forever in browser. Will NEVER revalidate on reload.'
    if (maxAge > 0) return `Serves from browser cache for ${maxAge}s, then revalidates.`
    return 'Revalidates with server on every use (conditional GET).'
  }

  function cdnBehavior() {
    if (noStore || scope === 'private') return 'Will NOT cache. Passes every request to origin.'
    if (sMaxAge > 0) {
      const swrNote = swr > 0 ? ` While stale (up to ${swr}s), serves old version + fetches fresh in background.` : ''
      return `Caches for ${sMaxAge}s (s-maxage overrides max-age for CDN).${swrNote}`
    }
    if (maxAge > 0) {
      return `Caches for ${maxAge}s (no s-maxage set — CDN uses max-age).`
    }
    return 'Passes requests to origin (no positive cache duration set).'
  }

  return (
    <div className="panel">
      <div className="ptitle">Live Demo · Cache-Control Header Builder</div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>Quick preset</div>
        <div className="modbtns">
          {[['custom', 'Custom'], ['bundle', 'JS Bundle'], ['html', 'HTML Page'], ['dashboard', 'User Dashboard'], ['api', 'API Response']].map(([k, label]) => (
            <button key={k} className={preset === k ? 'on' : ''} onClick={() => applyPreset(k)}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Scope</div>
          <div className="modbtns">
            <button className={scope === 'public' ? 'on' : ''} onClick={() => { setScope('public'); setPreset('custom') }}>public</button>
            <button className={scope === 'private' ? 'on' : ''} onClick={() => { setScope('private'); setPreset('custom') }}>private</button>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={noStore} onChange={e => { setNoStore(e.target.checked); setPreset('custom') }} />
            no-store (never cache anywhere)
          </label>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={immutable} onChange={e => { setImmutable(e.target.checked); setPreset('custom') }} />
            immutable (content hash — never revalidate)
          </label>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>max-age (browser): {maxAge}s</div>
          <input type="range" min={0} max={86400} step={300} value={maxAge} onChange={e => { setMaxAge(Number(e.target.value)); setPreset('custom') }} style={{ width: '100%' }} />
          <div style={{ fontSize: 11, color: '#888' }}>{maxAge === 0 ? 'off' : maxAge === 86400 ? '1 day' : `${Math.round(maxAge / 60)} min`}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>s-maxage (CDN): {sMaxAge}s</div>
          <input type="range" min={0} max={86400} step={60} value={sMaxAge} onChange={e => { setSMaxAge(Number(e.target.value)); setPreset('custom') }} style={{ width: '100%' }} />
          <div style={{ fontSize: 11, color: '#888' }}>{sMaxAge === 0 ? 'off (use max-age)' : `${Math.round(sMaxAge / 60)} min`}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>stale-while-revalidate: {swr}s</div>
          <input type="range" min={0} max={3600} step={30} value={swr} onChange={e => { setSwr(Number(e.target.value)); setPreset('custom') }} style={{ width: '100%' }} />
          <div style={{ fontSize: 11, color: '#888' }}>{swr === 0 ? 'off' : `${swr}s buffer`}</div>
        </div>
      </div>

      <div style={{ background: '#1b2a4a', borderRadius: 8, padding: 12, marginBottom: 14 }}>
        <span style={{ color: '#aab4cc', fontSize: 12 }}>Generated header:</span>
        <div style={{ color: '#a5f3fc', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, marginTop: 4, wordBreak: 'break-all' }}>
          {buildHeader()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#eff6ff', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>Browser behavior</div>
          <div style={{ fontSize: 13 }}>{browserBehavior()}</div>
        </div>
        <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6 }}>CDN behavior</div>
          <div style={{ fontSize: 13 }}>{cdnBehavior()}</div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Demo 3: Cache Invalidation Strategy Comparison ─────────────────────────── */
const STRATEGIES = [
  {
    id: 'ttl',
    name: 'TTL Expiry',
    icon: '⏱️',
    description: 'Set a short max-age. Cache expires and origin is fetched automatically.',
    freshTime: '~5 min (depends on TTL)',
    originLoad: 'Low (periodic)',
    complexity: 'Zero',
    riskLevel: 'Stale window',
    initialState: { badge: 'STALE WINDOW', badgeColor: '#f59e0b', detail: 'Cache still serving old $99 price', fresh: false },
    afterState: { badge: 'EVENTUALLY FRESH', badgeColor: '#22c55e', detail: 'Cache expires in ~5 min, then serves $79', fresh: true },
  },
  {
    id: 'hash',
    name: 'URL Hash (Cache-Bust)',
    icon: '#️⃣',
    description: 'Content hash in filename. New content → new URL → CDN has no stale entry.',
    freshTime: 'Immediate (new URL)',
    originLoad: 'Normal',
    complexity: 'Build tool',
    riskLevel: 'Very low',
    initialState: { badge: 'NEW URL', badgeColor: '#22c55e', detail: '/products/widget-abc.html → new hash def456', fresh: true },
    afterState: { badge: 'FRESH IMMEDIATELY', badgeColor: '#22c55e', detail: 'Old hash still cached (harmless). New hash served fresh.', fresh: true },
  },
  {
    id: 'purge',
    name: 'Purge API',
    icon: '🗑️',
    description: 'Call CDN API to delete cached URL. Instant but risky if over-purged.',
    freshTime: 'Immediate',
    originLoad: 'Spike (thundering herd)',
    complexity: 'Deploy script',
    riskLevel: 'Thundering herd on mass purge',
    initialState: { badge: 'STALE', badgeColor: '#ef4444', detail: 'Old $99 still cached', fresh: false },
    afterState: { badge: 'PURGED + SPIKE', badgeColor: '#f59e0b', detail: 'All PoPs refetch from origin simultaneously', fresh: true },
  },
  {
    id: 'surrogatekey',
    name: 'Surrogate Keys',
    icon: '🏷️',
    description: 'Tag responses with logical keys. Purge all tagged content with one call.',
    freshTime: 'Immediate (targeted)',
    originLoad: 'Minimal (only tagged URLs)',
    complexity: 'CDN + backend tags',
    riskLevel: 'Very low',
    initialState: { badge: 'STALE', badgeColor: '#ef4444', detail: 'product:widget-pro pages cached with old $99', fresh: false },
    afterState: { badge: 'SMART PURGE', badgeColor: '#22c55e', detail: 'All product:widget-pro tagged pages purged + refreshed', fresh: true },
  },
]

function InvalidationDemo() {
  const [deployed, setDeployed] = useState(false)
  const [selected, setSelected] = useState('ttl')

  const strat = STRATEGIES.find(s => s.id === selected)
  const display = deployed ? strat.afterState : strat.initialState

  return (
    <div className="panel">
      <div className="ptitle">Live Demo · Cache Invalidation Strategy Comparison</div>
      <p style={{ fontSize: 13, marginBottom: 12 }}>
        Origin has product page: <strong>Widget Pro — $99</strong>. You update the price to <strong>$79</strong>.
        How does the CDN pick up the change?
      </p>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>Strategy</div>
        <div className="modbtns">
          {STRATEGIES.map(s => (
            <button key={s.id} className={selected === s.id ? 'on' : ''} onClick={() => { setSelected(s.id); setDeployed(false) }}>
              {s.icon} {s.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 10 }}>{strat.description}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            ['Time to fresh', strat.freshTime],
            ['Origin load', strat.originLoad],
            ['Complexity', strat.complexity],
            ['Risk', strat.riskLevel],
          ].map(([label, value]) => (
            <div key={label} style={{ background: '#fff', borderRadius: 6, padding: '8px 10px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: 14, border: '2px solid #e5e7eb' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>CDN Cache State</div>
          <div style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 20,
            background: display.badgeColor + '20', color: display.badgeColor,
            fontWeight: 700, fontSize: 12, marginBottom: 8,
          }}>{display.badge}</div>
          <div style={{ fontSize: 13 }}>{display.detail}</div>
        </div>

        <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: 14, border: '2px solid #e5e7eb' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>Origin Price</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: deployed ? '#22c55e' : '#ef4444' }}>
            {deployed ? '$79' : '$99'}
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>{deployed ? 'Updated ✓' : 'Old price'}</div>
        </div>
      </div>

      <button className="act" onClick={() => setDeployed(true)} disabled={deployed}>
        {deployed ? 'Deployed ✓' : '🚀 Deploy price update ($99 → $79)'}
      </button>
      {deployed && (
        <button className="act" style={{ marginLeft: 10, background: 'transparent', color: 'var(--blue)', border: '1px solid var(--blue)' }} onClick={() => setDeployed(false)}>
          Reset
        </button>
      )}
    </div>
  )
}

/* ─────────────────────────── Quiz data ─────────────────────────── */
const QUESTIONS = [
  {
    q: 'A user in Tokyo requests an image. The nearest CDN PoP has it cached. What happens?',
    o: [
      'DNS routes the user to a random PoP globally',
      'The CDN PoP fetches from origin, then serves to user',
      'The request goes to the US-East origin server',
      'The CDN PoP serves the image directly from its cache',
    ],
    a: 3,
    e: 'A cache hit means the PoP already has the resource. It serves it immediately without contacting the origin. This is the whole point of CDN — low-latency local delivery.',
    w: {
      0: 'DNS uses geo-DNS or anycast to route to the NEAREST PoP, not a random one.',
      1: 'This describes a cache miss, not a cache hit. On a miss, the PoP fetches from origin and then caches it for next time.',
      2: 'This is what happens WITHOUT a CDN, or on a cache miss. With a cache hit, the origin is never involved.',
    },
    r: { id: 's1', label: 'Section 1 — What is a CDN' },
  },
  {
    q: 'Your origin sets: Cache-Control: public, max-age=3600, s-maxage=300. How long will a CDN cache this response?',
    o: [
      'Not cached — max-age and s-maxage conflict',
      '300 seconds',
      'Forever (public means permanent)',
      '3600 seconds',
    ],
    a: 1,
    e: 's-maxage overrides max-age specifically for CDNs (shared caches). The browser uses max-age=3600, but the CDN uses s-maxage=300. They can have different TTLs.',
    w: {
      0: 'They do not conflict. s-maxage is designed to override max-age for shared caches like CDNs. This is intentional and defined in the HTTP spec.',
      2: '"public" only means CDNs are allowed to cache it. It says nothing about duration — that comes from max-age/s-maxage.',
      3: 'max-age=3600 is for browsers. s-maxage overrides it for CDNs specifically. CDNs use s-maxage when both are present.',
    },
    r: { id: 's3', label: 'Section 3 — Cache-Control headers' },
  },
  {
    q: 'You deploy a hashed JS bundle: app-abc123.js → app-def456.js. What happens to the old file in the CDN cache?',
    o: [
      'The CDN automatically deletes the old cached file',
      'Users see a 404 error for the old file',
      'The old file stays cached but becomes unreachable — new URL is served fresh',
      'You must call the CDN purge API to remove the old file',
    ],
    a: 2,
    e: 'URL versioning is elegant: the old hash stays cached harmlessly (no HTML points to it anymore). The new URL has no CDN entry yet, so it is fetched fresh from origin. No purge needed.',
    w: {
      0: 'CDNs do not auto-delete old URLs. They expire via TTL. But since no HTML references the old hash URL, it is effectively invisible to users.',
      1: 'The old URL still works — it is still cached. It just is not referenced by any HTML anymore, so users never request it.',
      3: 'One of the main benefits of URL hashing is that you do NOT need to call the purge API. The new URL is always fresh; the old one expires naturally.',
    },
    r: { id: 's5', label: 'Section 5 — Cache invalidation' },
  },
  {
    q: 'What problem does "origin shield" solve?',
    o: [
      'It reduces the thundering herd when many PoPs miss simultaneously',
      'It compresses responses before sending them to edge PoPs',
      'It encrypts traffic between PoPs and the origin',
      'It prevents DDoS attacks from reaching the origin',
    ],
    a: 0,
    e: 'Without origin shield, 200 PoPs each independently fetch from origin on a miss — 200 simultaneous requests for the same resource. Origin shield designates one PoP as the proxy; all others ask the shield first, so origin gets at most one miss request.',
    w: {
      1: 'Compression is configured at the origin or CDN layer independently. Origin shield is about reducing the COUNT of origin requests, not their size.',
      2: 'Encryption (TLS) is handled separately on each connection. Origin shield is about request routing, not security.',
      3: 'DDoS mitigation is a separate CDN feature (rate limiting, anycast absorption). Origin shield is specifically about reducing origin load from PoP cache misses.',
    },
    r: { id: 's7', label: 'Section 7 — Origin shield' },
  },
  {
    q: 'Which Cache-Control directive should you use for a JS bundle with a content hash in its filename?',
    o: [
      'Cache-Control: private, no-store',
      'Cache-Control: public, max-age=60',
      'Cache-Control: public, s-maxage=86400, stale-while-revalidate=3600',
      'Cache-Control: public, max-age=31536000, immutable',
    ],
    a: 3,
    e: 'A hashed bundle NEVER changes at that URL (the hash changes with content, creating a new URL). So: max-age=31536000 (1 year) + immutable (tell browser never to revalidate on reload). This is the standard for versioned static assets.',
    w: {
      0: 'private, no-store is for sensitive user-specific data like bank balances. A JS bundle is public and should be aggressively cached.',
      1: 'max-age=60 is far too short. The URL will never change (hash guarantees freshness), so caching for 60s throws away the benefit of URL versioning.',
      2: 'stale-while-revalidate is useful for content that updates periodically (like an HTML page). A hashed bundle never updates at its URL — immutable is the right signal.',
    },
    r: { id: 's3', label: 'Section 3 — Cache-Control headers' },
  },
  {
    q: 'Your API returns: Cache-Control: public, s-maxage=60, Vary: Accept-Language. A French user and a German user both request GET /api/menu. How many CDN cache entries are created?',
    o: [
      'Depends on the CDN provider',
      '2 — one per language (Vary splits cache by Accept-Language)',
      '1 — same URL, same cache entry',
      '0 — Vary headers disable CDN caching',
    ],
    a: 1,
    e: 'Vary: Accept-Language tells the CDN to treat each unique Accept-Language value as a separate cache entry. French and German are two different values → two cache entries. This is correct behavior, but using many Vary values creates combinatorial explosion of cache entries.',
    w: {
      0: 'The HTTP spec defines Vary behavior; all major CDNs implement it the same way. It is not provider-specific.',
      2: 'Without Vary, yes. But with Vary: Accept-Language, the CDN creates separate entries per language. A French user must not get the German cached response.',
      3: 'Vary does not disable caching. It splits the cache key. CDNs fully support Vary — they just cache per (URL + Vary header value) combination.',
    },
    r: { id: 's9', label: 'Section 9 — API caching and Vary' },
  },
  {
    q: 'Which of these resources should use Cache-Control: private, no-store?',
    o: [
      'A CSS stylesheet for the site design',
      'A public blog post HTML page',
      'A user\'s bank account balance page',
      'A product image on an e-commerce homepage',
    ],
    a: 2,
    e: 'Bank balance is user-specific and security-sensitive. "private" prevents CDN caching; "no-store" prevents any disk storage at all (not even browser cache). If two users share a machine, you do not want user A to see user B\'s balance from cache.',
    w: {
      0: 'CSS stylesheets are public static assets — ideal for CDN caching with long TTLs and content hashing.',
      1: 'A public blog post is the same for all readers — it should be publicly cached at the CDN for performance.',
      3: 'Product images are the same for all users — perfect for "public" CDN caching with a long TTL.',
    },
    r: { id: 's2', label: 'Section 2 — What can be cached' },
  },
  {
    q: 'What is a key limitation of edge computing (Cloudflare Workers, Lambda@Edge)?',
    o: [
      'Edge functions have very tight resource limits (small bundle size, short CPU time)',
      'Edge functions only run in the US region',
      'Edge functions cannot access the internet',
      'Edge functions cannot serve static files',
    ],
    a: 0,
    e: 'Edge runtimes are intentionally constrained — typically 1MB bundle size, 50ms CPU time, no persistent filesystem. These limits keep cold starts near 0ms and enable running on thousands of PoPs. They are designed for lightweight logic (auth, A/B test), not heavy computation.',
    w: {
      1: 'CDN edge networks have PoPs on every continent. Edge functions run in every region — that is why they have low latency globally.',
      2: 'Edge functions CAN make outbound HTTP requests (to origin, APIs, etc.). Network access is a primary use case.',
      3: 'CDNs serve static files as their core purpose. Edge functions can also intercept and modify static responses.',
    },
    r: { id: 's8', label: 'Section 8 — Edge computing' },
  },
]

/* ─────────────────────────── Page ─────────────────────────── */
export default function Day96() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 96</div>
        <h1>CDN &amp; Edge Caching:<br />Serving the World Fast</h1>
        <p>
          A bookstore with one warehouse is slow. Open branches in every city and customers get their book
          instantly. That is a CDN. Click every demo — watch latency drop, headers build, caches invalidate.
        </p>
        <div className="chips">
          {['CDN', 'PoP', 'Cache-Control', 'TTL', 'Cache Invalidation', 'Origin Shield', 'Edge Computing', 'Surrogate Keys'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* SECTION 1 — What is a CDN */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The bookstore chain — what is a CDN?</h2>
        <p>
          Imagine a publisher stores every book in one warehouse in New York. A reader in Tokyo orders a book.
          The book must travel from New York to Tokyo — maybe 160ms. Now the publisher opens <strong>local branches</strong> (Points of Presence — PoPs) in every major city.
          The Tokyo reader walks into the Tokyo branch. The branch checks its shelf. If it has the book (cache hit) → hand it over in seconds. If not (cache miss) → order it from the warehouse, put a copy on the shelf for next time.
        </p>
        <p>
          A <strong>CDN (Content Delivery Network)</strong> works exactly like this. It is a global network of edge servers (PoPs).
          When a user requests a resource:
        </p>
        <ol>
          <li>DNS routes the user to the nearest PoP (via anycast routing or geo-DNS).</li>
          <li>If the PoP has it → serve from cache. Fast. Low latency.</li>
          <li>If not → fetch from the <strong>origin server</strong> → cache at the PoP → serve the user.</li>
        </ol>

        <Code html={`<span class="cm">// The latency gap CDNs solve:</span>

Without CDN:
  User (Tokyo) ─────────────────────────────▶ Origin (US-East)
                                              ~160ms round-trip

With CDN (cache HIT):
  User (Tokyo) ──▶ PoP (Tokyo) ──▶ User      ~5ms ✅

With CDN (cache MISS — first request to this PoP):
  User (Tokyo) ──▶ PoP (Tokyo) ──▶ Origin ──▶ PoP ──▶ User
                    caches it here ^              ~170ms (once)
                    next user: 5ms ✅

<span class="cm">// Benefits of a CDN:</span>
<span class="cm">// 1. Low latency — user is close to PoP</span>
<span class="cm">// 2. Lower origin load — origin only serves cache misses</span>
<span class="cm">// 3. DDoS absorption — attack traffic hits PoPs, not your origin</span>
<span class="cm">// 4. High availability — PoP can serve even if origin is briefly down (stale)</span>`} />

        <Note>
          CDN providers you may hear about: <strong>Cloudflare</strong>, <strong>Akamai</strong>, <strong>Fastly</strong>, <strong>AWS CloudFront</strong>, <strong>GCP Cloud CDN</strong>.
          They all work on the same principle — edge servers globally, cache at the edge, forward misses to origin.
        </Note>
      </section>

      {/* SECTION 2 — What can be cached */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>What can and cannot be cached</h2>
        <p>
          The golden rule: <strong>if two different users asking for the same URL would get the same response, it is cacheable.</strong>
        </p>

        <Code html={`<span class="cm">// ✅ CACHEABLE (same for all users):</span>
GET /images/logo.png          <span class="cm">// image — identical for everyone</span>
GET /assets/app-abc123.js     <span class="cm">// versioned JS bundle</span>
GET /style.css                <span class="cm">// stylesheet</span>
GET /api/products/42          <span class="cm">// product details (if not personalised)</span>
GET /blog/post-1              <span class="cm">// public article — same HTML for all readers</span>

<span class="cm">// ❌ NOT cacheable (different per user):</span>
GET /dashboard                <span class="cm">// user's personal dashboard</span>
GET /api/cart                 <span class="cm">// user's shopping cart</span>
GET /api/account/balance      <span class="cm">// user's bank balance</span>
GET /api/prices/realtime      <span class="cm">// stock prices changing every second</span>
POST /api/checkout            <span class="cm">// POST requests are never cached</span>

<span class="cm">// Cache key = URL + relevant request headers</span>
<span class="cm">// e.g. Accept-Language: en-US makes a separate cache entry from Accept-Language: fr-FR</span>
<span class="cm">// (the CDN needs Vary: Accept-Language header to know this — see Section 9)</span>`} />

        <Warn>
          <strong>POST, PUT, DELETE are never cached.</strong> CDNs only cache GET and HEAD responses.
          Caching a POST would mean two users who POST get the same response — which is almost never correct.
        </Warn>

        <Reveal summary="What about authenticated APIs?">
          <p>
            If your API uses <strong>session cookies</strong> (user-specific), the CDN must not cache the response.
            Set <C>Cache-Control: private</C>. If your API uses a <strong>public auth header</strong> that is the same for all users
            (like a public API key), the response may be publicly cacheable. The safest rule: if the response changes per user, use <C>private, no-store</C>.
          </p>
        </Reveal>
      </section>

      {/* SECTION 3 — Cache-Control headers */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Cache-Control headers — the origin's instructions to the CDN</h2>
        <p>
          The origin server controls how its responses are cached. It sends a <C>Cache-Control</C> header with every response.
          The CDN (and browser) obey these instructions. Think of it as the warehouse telling the branch: "keep this book for 5 minutes, then ask me for a fresh copy."
        </p>

        <Code html={`<span class="cm">// HTTP response headers from your server:</span>

<span class="cm">// 1. public — CDNs may cache this response</span>
Cache-Control: <span class="kw">public</span>, max-age=<span class="num">86400</span>

<span class="cm">// 2. private — only the browser may cache; CDN must NOT cache</span>
Cache-Control: <span class="kw">private</span>, max-age=<span class="num">3600</span>

<span class="cm">// 3. max-age=N — cache for N seconds (both browser and CDN)</span>
Cache-Control: <span class="kw">public</span>, max-age=<span class="num">300</span>

<span class="cm">// 4. s-maxage=N — CDN-specific max-age (overrides max-age for CDNs only)</span>
Cache-Control: <span class="kw">public</span>, max-age=<span class="num">60</span>, s-maxage=<span class="num">300</span>
<span class="cm">// Browser caches 60s; CDN caches 300s</span>

<span class="cm">// 5. no-cache — must revalidate before serving (can still be stored)</span>
Cache-Control: <span class="kw">no-cache</span>
<span class="cm">// Confusingly named — it DOES cache, but MUST check with origin each time</span>

<span class="cm">// 6. no-store — NEVER save to disk or memory cache</span>
Cache-Control: <span class="kw">no-store</span>
<span class="cm">// Use for passwords, bank data, one-time tokens</span>

<span class="cm">// 7. stale-while-revalidate=N — serve stale while fetching fresh in background</span>
Cache-Control: <span class="kw">public</span>, s-maxage=<span class="num">300</span>, stale-while-revalidate=<span class="num">60</span>
<span class="cm">// After 300s: serve stale (up to 60s extra) AND fetch fresh concurrently</span>
<span class="cm">// User never waits; slight staleness window in exchange for zero-wait</span>

<span class="cm">// 8. immutable — content at this URL will NEVER change</span>
Cache-Control: <span class="kw">public</span>, max-age=<span class="num">31536000</span>, immutable
<span class="cm">// For hashed filenames (app-abc123.js). Browser won't even check on reload.</span>`} />

        <Code html={`<span class="cm">// Java: setting Cache-Control headers in a Spring REST controller</span>

<span class="kw">import</span> org.springframework.http.CacheControl;
<span class="kw">import</span> org.springframework.http.ResponseEntity;

<span class="kw">@RestController</span>
<span class="kw">public class</span> ProductController {

    <span class="cm">// Public product data — cache at CDN for 5 min, stale-while-revalidate 60s</span>
    <span class="kw">@GetMapping</span>(<span class="str">"/api/products/{id}"</span>)
    <span class="kw">public</span> ResponseEntity&lt;Product&gt; getProduct(<span class="kw">@PathVariable long</span> id) {
        Product p = productService.find(id); <span class="cm">// fetch from DB</span>
        <span class="kw">return</span> ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(<span class="num">300</span>, TimeUnit.SECONDS)
                .sMaxAge(<span class="num">300</span>, TimeUnit.SECONDS))
            .body(p);
    }

    <span class="cm">// User dashboard — never cache at CDN; only browser may cache briefly</span>
    <span class="kw">@GetMapping</span>(<span class="str">"/api/me/dashboard"</span>)
    <span class="kw">public</span> ResponseEntity&lt;Dashboard&gt; getDashboard() {
        <span class="kw">return</span> ResponseEntity.ok()
            .cacheControl(CacheControl.noStore().cachePrivate()) <span class="cm">// private + no-store</span>
            .body(dashboardService.forCurrentUser());
    }
}`} />

        <Good>
          Set <C>s-maxage</C> separately from <C>max-age</C> when you want different TTLs for CDN vs browser.
          The CDN reads <C>s-maxage</C>; the browser reads <C>max-age</C>.
        </Good>

        <Reveal summary="What is the difference between no-cache and no-store?">
          <p>
            <strong>no-cache</strong>: The response MAY be stored, but the cache MUST ask the origin "is this still fresh?" before serving it.
            The origin can say "yes, still fresh" (304 Not Modified) without resending the full body. Good for content that changes often but is safe to store.
          </p>
          <p>
            <strong>no-store</strong>: Do NOT save this response anywhere — not disk, not memory. Every request goes to origin.
            Use this for truly sensitive data (passwords, financial data, one-time tokens).
          </p>
        </Reveal>
      </section>

      {/* SECTION 4 — Interactive latency demo */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: CDN latency visualizer</h2>
        <p>
          Pick a user location and click "Simulate Request". Switch between "With CDN", "Without CDN", and "Origin Shield" modes.
          Toggle between cache hit and miss. Watch how the request path and latency change.
        </p>
        <LatencyDemo />
      </section>

      {/* SECTION 5 — Cache invalidation */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Cache invalidation — the hardest problem in computer science</h2>
        <p>
          "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton.
          You cached a product page. Now the price changed. How do you make the CDN serve the new price?
        </p>

        <Code html={`<span class="cm">// STRATEGY 1: TTL Expiry (simplest)</span>
Cache-Control: <span class="kw">public</span>, s-maxage=<span class="num">300</span>   <span class="cm">// expires in 5 min</span>
<span class="cm">// Pros: zero complexity, works everywhere</span>
<span class="cm">// Cons: stale window (users may see old data for up to 5 min)</span>
<span class="cm">// Use when: small stale window is acceptable (blogs, product listings)</span>

<span class="cm">// STRATEGY 2: URL versioning / cache-busting (best for static assets)</span>
<span class="cm">// Your build tool (Vite, Webpack) hashes filenames:</span>
<span class="str">"app-abc123.js"</span>  <span class="cm">// old bundle</span>
<span class="str">"app-def456.js"</span>  <span class="cm">// new bundle — completely different URL!</span>
<span class="cm">// CDN has no cache for the new URL → fetches fresh from origin</span>
<span class="cm">// Old URL still cached harmlessly (no HTML points to it)</span>
<span class="cm">// Set max-age=31536000, immutable on these (they never change)</span>
<span class="cm">// Cons: can't hash-name HTML pages (the entry point can't reference itself)</span>

<span class="cm">// STRATEGY 3: Purge API (for HTML pages and urgent updates)</span>
<span class="cm">// Call CDN's REST API to delete a cached URL</span>
<span class="cm">// Example (Cloudflare):</span>
curl -X POST https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache \
     -d <span class="str">'{"files": ["https://example.com/products/widget"]}'</span>
<span class="cm">// Pros: immediate freshness</span>
<span class="cm">// Cons: mass-purge causes thundering herd (all PoPs miss → all hit origin)</span>

<span class="cm">// STRATEGY 4: Surrogate keys / cache tags (most targeted)</span>
<span class="cm">// Origin tags responses with logical keys:</span>
Surrogate-Key: <span class="kw">product:42 category:electronics</span>
<span class="cm">// CDN stores: this URL is tagged with product:42</span>
<span class="cm">// On update: purge ALL URLs tagged product:42 in one API call</span>
<span class="cm">// Pros: targeted purge, no thundering herd, affects only relevant pages</span>
<span class="cm">// Cons: requires CDN support (Fastly, Cloudflare) + backend to emit tags</span>`} />

        <table className="matrix" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Strategy</th>
              <th>Time to fresh</th>
              <th>Origin load</th>
              <th>Works for HTML?</th>
              <th>Complexity</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>TTL Expiry</td><td>Up to TTL</td><td>Low</td><td className="yes">Yes</td><td>Zero</td></tr>
            <tr><td>URL Hash</td><td>Immediate</td><td>Normal</td><td className="no">No</td><td>Build tool</td></tr>
            <tr><td>Purge API</td><td>Immediate</td><td>Spike</td><td className="yes">Yes</td><td>Deploy script</td></tr>
            <tr><td>Surrogate Keys</td><td>Immediate</td><td>Minimal</td><td className="yes">Yes</td><td>CDN + tags</td></tr>
          </tbody>
        </table>

        <Reveal summary="Why is cache invalidation actually hard?">
          <p>
            The difficulty is distributed consistency. Your CDN has 200 PoPs around the world.
            Each one independently caches content. When you update content at the origin, you must tell all 200 PoPs.
            Some strategies (purge API) do this synchronously — but then you might get 200 PoPs all hitting your origin at once (thundering herd).
            Others (TTL) are eventually consistent — you accept a window of staleness.
            No strategy is both instant AND without thundering herd risk, except surrogate keys (which require CDN support).
          </p>
        </Reveal>
      </section>

      {/* SECTION 6 — Interactive invalidation demo */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>Play: cache-control builder + invalidation strategies</h2>
        <p>
          First, build a Cache-Control header and see what it means for browsers and CDNs.
          Then simulate deploying a price update — compare how each invalidation strategy behaves.
        </p>
        <CacheControlDemo />
        <div style={{ marginTop: 24 }}>
          <InvalidationDemo />
        </div>
        <Good>
          Best practice: use URL hashing for all versioned static assets (JS, CSS, images) with <C>immutable</C>.
          Use surrogate key purges for HTML pages and API responses. Reserve TTL expiry for content where a short stale window is acceptable.
        </Good>
      </section>

      {/* SECTION 7 — Origin Shield */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Origin shield — protecting origin from the thundering herd</h2>
        <p>
          Imagine your CDN has 200 PoPs worldwide. You deploy a new product page. All 200 PoPs have empty caches for it.
          The first 200 users globally, one from each region, all request it at the same moment.
          Without origin shield: 200 simultaneous cache misses = 200 requests to your origin = thundering herd.
        </p>

        <Code html={`<span class="cm">// Without origin shield: thundering herd</span>
PoP-Tokyo      ──▶ Origin (US-East)   <span class="cm">// all 200 PoPs miss</span>
PoP-London     ──▶ Origin (US-East)   <span class="cm">// simultaneously</span>
PoP-Sydney     ──▶ Origin (US-East)   <span class="cm">// origin overwhelmed</span>
PoP-SaoPaulo   ──▶ Origin (US-East)   <span class="cm">// 200 × (requests/min)</span>
... (200 PoPs)

<span class="cm">// With origin shield: designated PoP acts as cache proxy</span>
PoP-Tokyo    ──▶ Shield PoP (US-East) ──▶ Origin (US-East)
PoP-London   ──▶ Shield PoP (US-East)    (only if shield misses)
PoP-Sydney   ──▶ Shield PoP (US-East)
PoP-SaoPaulo ──▶ Shield PoP (US-East)

<span class="cm">// Origin only receives requests from ONE PoP (the shield)</span>
<span class="cm">// Shield caches the response; all other PoPs hit the shield</span>
<span class="cm">// Tradeoff: extra network hop (shield → PoP) adds ~5–20ms to misses</span>
<span class="cm">// Worth it: origin load drops by 200x on cold cache events</span>`} />

        <Note>
          Origin shield is sometimes called a "mid-tier cache" or "shield PoP". Cloudflare calls it "Tiered Cache".
          AWS CloudFront calls it "Origin Shield". Fastly calls it "shielding". All the same concept.
        </Note>

        <Reveal summary="When is origin shield most important?">
          <p>
            Most critical for: (1) viral content that suddenly gets millions of simultaneous requests globally,
            (2) product launches where all caches are cold at the same moment,
            (3) cache-busted deploys where every PoP misses at once.
            If your traffic is steady and caches are warm, origin shield is nice but not critical.
          </p>
        </Reveal>
      </section>

      {/* SECTION 8 — Edge computing */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Edge computing — running code at the PoP</h2>
        <p>
          Modern CDNs let you run small pieces of code at the edge — before the request even reaches your origin.
          Think of it as putting a tiny brain inside each bookstore branch.
        </p>

        <Code html={`<span class="cm">// Cloudflare Worker (JavaScript, runs at CDN edge globally)</span>
<span class="cm">// Example: A/B testing at the edge — no origin round-trip</span>
<span class="kw">addEventListener</span>(<span class="str">'fetch'</span>, event =&gt; {
    event.respondWith(handleRequest(event.request));
});

<span class="kw">async function</span> handleRequest(request) {
    <span class="cm">// Pick variant based on a cookie or random hash</span>
    <span class="kw">const</span> variant = Math.random() &lt; <span class="num">0.5</span> ? <span class="str">'A'</span> : <span class="str">'B'</span>;

    <span class="cm">// Rewrite the request to fetch the right variant from origin</span>
    <span class="kw">const</span> url = <span class="kw">new</span> URL(request.url);
    url.pathname = <span class="str">\`/variant-\${variant}\${url.pathname}\`</span>;

    <span class="cm">// Fetch from origin with modified URL — user gets A or B</span>
    <span class="kw">return</span> fetch(url.toString(), request);
}

<span class="cm">// Other common edge use cases:</span>
<span class="cm">// 1. Auth token validation — reject bad tokens at the edge (fail fast)</span>
<span class="cm">//    No need to load origin for unauthorized requests</span>

<span class="cm">// 2. Bot detection — check user agent, IP reputation at the edge</span>
<span class="cm">//    Block bots before they consume origin resources</span>

<span class="cm">// 3. Response personalization — inject user's name into a cached HTML template</span>
<span class="cm">//    Cache the shell; edge adds the personal bits</span>

<span class="cm">// 4. Rate limiting — count requests per IP at the edge</span>
<span class="cm">//    Returns 429 without touching origin</span>`} />

        <table className="matrix" style={{ marginTop: 16 }}>
          <thead>
            <tr><th>Edge runtime</th><th>Provider</th><th>Language</th><th>Bundle limit</th><th>CPU limit</th></tr>
          </thead>
          <tbody>
            <tr><td>Cloudflare Workers</td><td>Cloudflare</td><td>JS/WASM</td><td>1MB</td><td>50ms</td></tr>
            <tr><td>Lambda@Edge</td><td>AWS CloudFront</td><td>Node/Python</td><td>50MB</td><td>5s</td></tr>
            <tr><td>Fastly Compute</td><td>Fastly</td><td>Rust/WASM</td><td>10MB</td><td>50ms</td></tr>
          </tbody>
        </table>

        <Warn>
          Edge functions have <strong>very tight limits</strong>. They are designed for lightweight logic, not heavy computation.
          No persistent filesystem. Limited memory. Short CPU time. If your logic is complex, move it to origin.
        </Warn>

        <Reveal summary="Edge computing vs serverless — what is the difference?">
          <p>
            Both run your code without managing servers. The difference is location.
            <strong>Serverless</strong> (AWS Lambda, Google Cloud Functions) runs in one or a few data center regions — you still have cold starts and regional latency.
            <strong>Edge computing</strong> runs on every CDN PoP globally — near-zero cold starts (V8 isolates, not containers), but much stricter resource limits.
            Use edge for ultra-low-latency simple logic; use serverless for complex logic that needs a full runtime.
          </p>
        </Reveal>
      </section>

      {/* SECTION 9 — API caching + Vary + cheat sheet */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>API response caching, the Vary gotcha, and the full cheat sheet</h2>
        <p>
          CDNs are not just for static files. API responses can also be cached — if they are the same for all users.
          But the <C>Vary</C> header can multiply your cache entries unexpectedly.
        </p>

        <Code html={`<span class="cm">// Caching an API response at the CDN:</span>
GET /api/products?page=1
Cache-Control: <span class="kw">public</span>, s-maxage=<span class="num">60</span>, stale-while-revalidate=<span class="num">30</span>
<span class="cm">// CDN caches the product list for 60s</span>
<span class="cm">// If stale by up to 30s: serve stale AND fetch fresh in background</span>

<span class="cm">// The Vary header — cache per header value</span>
Vary: Accept-Language
<span class="cm">// Now CDN caches a SEPARATE copy per Accept-Language value:</span>
<span class="cm">// - Accept-Language: en-US → one cache entry</span>
<span class="cm">// - Accept-Language: fr-FR → another cache entry</span>
<span class="cm">// - Accept-Language: de-DE → another cache entry</span>
<span class="cm">// With 50 languages: 50 cache entries per URL</span>

Vary: Accept-Language, Accept-Encoding, User-Agent
<span class="cm">// 50 × 5 × hundreds = combinatorial explosion</span>
<span class="cm">// CDN cache becomes nearly useless</span>
<span class="cm">// Rule: only Vary on headers that ACTUALLY change the response content</span>

<span class="cm">// Accept-Encoding is fine (gzip vs non-gzip response)</span>
<span class="cm">// Accept-Language if you serve different translations from same URL</span>
<span class="cm">// User-Agent — almost never worth it (use feature detection in JS instead)</span>`} />

        <h3 style={{ marginTop: 24, marginBottom: 12 }}>Cheat sheet</h3>
        <ul>
          <li><strong>CDN = global edge servers</strong> — serve cached content from the PoP nearest to the user.</li>
          <li><strong>Cache hit</strong> = PoP has it → serve instantly (5ms). <strong>Cache miss</strong> = PoP asks origin → one-time slow fetch → cache for next user.</li>
          <li><strong>public</strong> = CDN may cache. <strong>private</strong> = browser only. <strong>no-store</strong> = never cache anywhere.</li>
          <li><strong>max-age</strong> = TTL for both browser and CDN. <strong>s-maxage</strong> = TTL for CDN only (overrides max-age for CDN).</li>
          <li><strong>immutable</strong> = content at this URL will never change — skip revalidation even on browser reload. Use with content-hashed filenames.</li>
          <li><strong>stale-while-revalidate</strong> = serve stale response instantly while fetching fresh in background.</li>
          <li><strong>Invalidation strategies</strong>: TTL (simple, stale window) → URL hash (best for assets) → Purge API (HTML, immediate but risky) → Surrogate keys (targeted, best).</li>
          <li><strong>Origin shield</strong> = one designated PoP proxies for all others → origin handles traffic from one node, not 200.</li>
          <li><strong>Edge computing</strong> = run code at PoP for A/B test, auth, bot detection, rate limiting — before origin is touched.</li>
          <li><strong>Vary</strong> = splits cache per header value. Use sparingly — Vary: Accept-Language × 50 languages = 50 cache entries per URL.</li>
          <li><strong>POST/PUT/DELETE are never cached</strong> by CDNs. Only GET and HEAD.</li>
        </ul>
      </section>

      {/* INTERVIEW CORNER */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Interview corner</h2>
        <p>5 tricky questions interviewers love. Click each one to reveal the answer.</p>

        <Reveal summary="1. What is a CDN and how does it reduce latency?">
          <p>
            A CDN is a globally distributed network of edge servers (Points of Presence / PoPs).
            When a user requests a resource, DNS routes them to the nearest PoP.
            If the PoP has the resource cached (cache hit), it responds immediately from local storage — single-digit milliseconds.
            If not (cache miss), the PoP fetches from the origin server, caches the response, and serves it.
            Future requests to that PoP are cache hits. Latency drops because the user is physically close to the PoP,
            not because the data moved faster — physical distance is the bottleneck (speed of light).
          </p>
        </Reveal>

        <Reveal summary="2. What is the difference between max-age and s-maxage?">
          <p>
            Both are Cache-Control directives that set a TTL, but for different audiences.
            <strong>max-age</strong> applies to ALL caches — browsers and CDNs.
            <strong>s-maxage</strong> applies to <em>shared caches only</em> (CDNs, proxies) and overrides <C>max-age</C> for them.
            The browser ignores <C>s-maxage</C> and uses <C>max-age</C>.
            This lets you set different TTLs: short for browsers (frequent user-specific revalidation), long for CDN (serves many users, more stable).
            Example: <C>max-age=60, s-maxage=3600</C> — browser revalidates every minute; CDN caches for an hour.
          </p>
        </Reveal>

        <Reveal summary="3. Why is cache invalidation hard? What are the four main strategies?">
          <p>
            Hard because: a CDN has 200 PoPs, each independently caching content. Updating all 200 simultaneously is a distributed systems problem — instant invalidation risks thundering herd (all PoPs miss at once, all hit origin), while TTL-based invalidation means a staleness window.
          </p>
          <p>The four strategies:</p>
          <ol>
            <li><strong>TTL expiry</strong> — let the cache age out. Simple, stale window.</li>
            <li><strong>URL versioning (cache-busting)</strong> — embed content hash in filename. New content = new URL = cold CDN entry = fresh from origin. Best for JS/CSS/images.</li>
            <li><strong>Purge API</strong> — CDN provider API to delete cached URLs immediately. Good for HTML pages. Risk: mass purge → thundering herd.</li>
            <li><strong>Surrogate keys / cache tags</strong> — tag responses with logical keys, purge by tag. Targeted, scales well. Requires CDN support.</li>
          </ol>
        </Reveal>

        <Reveal summary="4. What is origin shield and what problem does it solve?">
          <p>
            Without origin shield: if a CDN has 200 PoPs and they all experience cache misses simultaneously (e.g., after a deploy or for a viral piece of content),
            all 200 PoPs independently request the resource from the origin. This is the "thundering herd" — the origin suddenly receives 200× its normal traffic.
          </p>
          <p>
            Origin shield designates one PoP as the "shield". All other PoPs forward their misses to the shield PoP instead of origin.
            The shield PoP is the only one that talks to origin on a miss. Origin receives at most one request per resource,
            regardless of how many PoPs miss simultaneously. Trade-off: misses now have an extra network hop (PoP → shield → origin) which adds a few milliseconds.
          </p>
        </Reveal>

        <Reveal summary="5. What is edge computing? Name three real use cases.">
          <p>
            Edge computing means running application code at CDN PoPs (the edge) instead of at a central origin server.
            Examples: Cloudflare Workers, Lambda@Edge, Fastly Compute. The code runs in a tiny V8 isolate or WASM runtime — millisecond startup, very low latency globally.
          </p>
          <p>Three use cases:</p>
          <ol>
            <li><strong>A/B testing</strong> — decide which variant to serve at the edge. No origin round-trip needed for the routing decision.</li>
            <li><strong>Auth token validation</strong> — verify JWT/API key at the edge. Reject unauthorized requests before they consume origin resources (fail fast).</li>
            <li><strong>Bot detection and rate limiting</strong> — inspect request headers/IP at the edge, return 429 to bots without touching origin.</li>
          </ol>
          <p>
            Key limits: small bundle size (1MB for Workers), short CPU time (50ms), no persistent filesystem.
            Designed for lightweight routing/security logic, not heavy computation.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="quiz">
        <div className="sec-label">Section 10 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 96 complete!</strong> Homework: Take a REST API you have built (or a sample Spring Boot app).
        Go through each endpoint and classify it: public static, public dynamic, or private/sensitive.
        Add the appropriate <C>Cache-Control</C> header to each. For public endpoints, decide on a TTL — what is the acceptable staleness window?
        For any endpoint returning versioned content, add <C>s-maxage</C> with a longer TTL than <C>max-age</C>.
        Then think: if you deployed a change, which invalidation strategy would you use for each endpoint and why?
        <br /><br />
        Next: <strong>keep building</strong> — every system you design is now faster, more resilient, and closer to your users.
        CDN knowledge is the layer that turns a well-designed backend into a globally scalable product.
      </div>
    </div>
  )
}
