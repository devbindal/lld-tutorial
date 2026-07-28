import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ─────────────────────────────────────────────────────────────────
   Demo 1 — Decomposition Explorer
   Start with a monolith blob. Extract services one by one.
   Show independent scaling once extracted.
───────────────────────────────────────────────────────────────── */
const SERVICES = [
  { id: 'user',    label: 'User Service',      emoji: '👤', color: '#2D5BFF', traffic: 15 },
  { id: 'order',   label: 'Order Service',     emoji: '📦', color: '#2E9E6B', traffic: 35 },
  { id: 'payment', label: 'Payment Service',   emoji: '💳', color: '#D97B29', traffic: 30 },
  { id: 'inv',     label: 'Inventory Service', emoji: '🏭', color: '#7B52D3', traffic: 20 },
]

function DecompositionDemo() {
  const [extracted, setExtracted] = useState([])   // list of service ids extracted so far
  const [scales, setScales] = useState({})          // { serviceId: replicaCount }
  const [monoScale, setMonoScale] = useState(1)

  const remaining = SERVICES.filter(s => !extracted.includes(s.id))
  const done = remaining.length === 0

  function extractNext() {
    if (remaining.length === 0) return
    const next = remaining[0]
    setExtracted(e => [...e, next.id])
    setScales(sc => ({ ...sc, [next.id]: 1 }))
  }

  function scaleService(id) {
    setScales(sc => ({ ...sc, [id]: Math.min((sc[id] || 1) + 1, 5) }))
  }

  function reset() {
    setExtracted([])
    setScales({})
    setMonoScale(1)
  }

  const monoTraffic = remaining.reduce((s, svc) => s + svc.traffic, 0)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · monolith → microservices decomposition</div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <button className="act" onClick={extractNext} disabled={done}>
          {done ? 'Fully decomposed!' : `Extract → ${remaining[0]?.label}`}
        </button>
        <button className="ghost act" onClick={reset}>Reset</button>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Monolith box */}
        <div style={{ flex: '0 0 220px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 6 }}>
            MONOLITH ({monoTraffic}% of traffic)
          </div>
          <div style={{
            border: remaining.length === SERVICES.length ? '2px solid #D9534F' : '2px dashed #DCD9CF',
            borderRadius: 10, padding: 14, background: remaining.length === 0 ? '#f8f8f8' : '#fff',
            minHeight: 120
          }}>
            {remaining.length === 0 ? (
              <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: 13, textAlign: 'center', paddingTop: 20 }}>
                Monolith is empty — deleted! ✅
              </div>
            ) : (
              remaining.map(s => (
                <div key={s.id} style={{
                  padding: '5px 8px', marginBottom: 6, borderRadius: 6,
                  background: '#FFF3E0', borderLeft: `3px solid ${s.color}`,
                  fontSize: 13, display: 'flex', justifyContent: 'space-between'
                }}>
                  <span>{s.emoji} {s.label}</span>
                  <span style={{ color: '#999', fontSize: 11 }}>{s.traffic}%</span>
                </div>
              ))
            )}
            {remaining.length > 0 && (
              <div style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 8, fontSize: 12, color: '#888' }}>
                🗄️ Shared DB (all tables mixed)
              </div>
            )}
          </div>
          {remaining.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <button className="ghost act" style={{ fontSize: 12, padding: '5px 10px' }}
                onClick={() => setMonoScale(m => Math.min(m + 1, 5))}>
                Scale monolith ×{monoScale + 1}
              </button>
              {monoScale > 1 && (
                <div style={{ fontSize: 12, color: '#D9534F', marginTop: 6 }}>
                  ⚠ Scaling ALL {remaining.length} services just to scale one! Cost = ×{monoScale}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        {extracted.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 22, color: '#2D5BFF', paddingTop: 40 }}>→</div>
        )}

        {/* Extracted services */}
        {extracted.length > 0 && (
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 6 }}>
              MICROSERVICES (own DB each)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {SERVICES.filter(s => extracted.includes(s.id)).map(s => {
                const reps = scales[s.id] || 1
                return (
                  <div key={s.id} style={{
                    border: `2px solid ${s.color}`, borderRadius: 10,
                    padding: 12, background: '#fff', minWidth: 160
                  }}>
                    <div style={{ fontWeight: 700, color: s.color, marginBottom: 4 }}>
                      {s.emoji} {s.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>
                      🗄️ Own DB &nbsp;|&nbsp; {s.traffic}% traffic
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                      {Array.from({ length: reps }).map((_, i) => (
                        <span key={i} style={{
                          display: 'inline-block', width: 22, height: 22, borderRadius: '50%',
                          background: s.color, color: '#fff', fontSize: 11, lineHeight: '22px',
                          textAlign: 'center'
                        }}>r{i + 1}</span>
                      ))}
                    </div>
                    <button className="ghost act" style={{ fontSize: 11, padding: '4px 8px' }}
                      onClick={() => scaleService(s.id)}>
                      Scale ×{reps + 1}
                    </button>
                    {reps > 1 && (
                      <div style={{ fontSize: 11, color: '#2E9E6B', marginTop: 4 }}>
                        ✅ Only THIS service scales!
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <Good>
        Key insight: once extracted, you can scale <em>only</em> the Payment Service during peak checkout —
        the others stay at ×1. With a monolith, scaling means scaling everything.
      </Good>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Demo 2 — Strangler Fig Migration
   4 phases, click to advance, show traffic % routing at each step.
───────────────────────────────────────────────────────────────── */
const PHASES = [
  {
    label: 'Phase 0 — All in Monolith',
    gateway: 'API Gateway → Monolith (100%)',
    monoTraffic: 100,
    services: [],
    desc: 'Everything lives in the monolith. The API Gateway forwards all traffic there.',
  },
  {
    label: 'Phase 1 — Extract Payment Service',
    gateway: 'API Gateway → PaymentSvc (30%) + Monolith (70%)',
    monoTraffic: 70,
    services: [{ label: 'Payment Service', pct: 30, color: '#D97B29', emoji: '💳' }],
    desc: 'Payment logic is extracted first (highest risk = extract first to prove the approach). Gateway routes /payments to the new service.',
  },
  {
    label: 'Phase 2 — Extract Order Service',
    gateway: 'API Gateway → PaymentSvc (30%) + OrderSvc (35%) + Monolith (35%)',
    monoTraffic: 35,
    services: [
      { label: 'Payment Service', pct: 30, color: '#D97B29', emoji: '💳' },
      { label: 'Order Service',   pct: 35, color: '#2E9E6B', emoji: '📦' },
    ],
    desc: 'Orders extracted. Monolith shrinks to 35% of traffic. You ship real value at every step — no big-bang freeze.',
  },
  {
    label: 'Phase 3 — Extract User Service',
    gateway: 'API Gateway → PaymentSvc + OrderSvc + UserSvc + Monolith (15%)',
    monoTraffic: 15,
    services: [
      { label: 'Payment Service', pct: 30, color: '#D97B29', emoji: '💳' },
      { label: 'Order Service',   pct: 35, color: '#2E9E6B', emoji: '📦' },
      { label: 'User Service',    pct: 20, color: '#2D5BFF', emoji: '👤' },
    ],
    desc: 'Only 15% traffic remains in the monolith (legacy inventory logic). Most teams stop here if the monolith remainder is stable.',
  },
  {
    label: 'Phase 4 — Monolith deleted',
    gateway: 'API Gateway → PaymentSvc + OrderSvc + UserSvc + InventorySvc',
    monoTraffic: 0,
    services: [
      { label: 'Payment Service',   pct: 30, color: '#D97B29', emoji: '💳' },
      { label: 'Order Service',     pct: 35, color: '#2E9E6B', emoji: '📦' },
      { label: 'User Service',      pct: 20, color: '#2D5BFF', emoji: '👤' },
      { label: 'Inventory Service', pct: 15, color: '#7B52D3', emoji: '🏭' },
    ],
    desc: 'The monolith is empty and deleted. Strangler Fig complete. Each migration was reversible — the gateway just reroutes.',
  },
]

function StranglerFigDemo() {
  const [phase, setPhase] = useState(0)
  const current = PHASES[phase]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · strangler fig migration phases</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="act" onClick={() => setPhase(p => Math.min(p + 1, PHASES.length - 1))}
          disabled={phase === PHASES.length - 1}>
          Extract next service →
        </button>
        {phase > 0 && (
          <button className="ghost act" onClick={() => setPhase(p => Math.max(p - 1, 0))}>
            ← Rollback (safe!)
          </button>
        )}
        <button className="ghost act" onClick={() => setPhase(0)}>Reset</button>
      </div>

      {/* Phase label */}
      <div style={{
        background: '#EEF2FF', borderRadius: 8, padding: '8px 14px',
        fontWeight: 700, color: '#2D5BFF', marginBottom: 14, fontSize: 14
      }}>
        {current.label}
      </div>

      {/* Gateway */}
      <div style={{
        background: '#1B2A4A', color: '#fff', borderRadius: 8,
        padding: '8px 14px', fontSize: 13, marginBottom: 14, fontFamily: 'IBM Plex Mono'
      }}>
        🔀 {current.gateway}
      </div>

      {/* Traffic bars */}
      <div style={{ marginBottom: 12 }}>
        {/* Monolith bar */}
        {current.monoTraffic > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>
              🏢 Monolith — {current.monoTraffic}% of traffic
            </div>
            <div style={{ background: '#eee', borderRadius: 4, height: 18, width: '100%' }}>
              <div style={{
                width: `${current.monoTraffic}%`, height: '100%', borderRadius: 4,
                background: current.monoTraffic === 100 ? '#D9534F' : '#f0a040',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        )}
        {/* Service bars */}
        {current.services.map(s => (
          <div key={s.label} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>
              {s.emoji} {s.label} — {s.pct}% of traffic
            </div>
            <div style={{ background: '#eee', borderRadius: 4, height: 18, width: '100%' }}>
              <div style={{
                width: `${s.pct}%`, height: '100%', borderRadius: 4,
                background: s.color, transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        ))}
      </div>

      <Note>{current.desc}</Note>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Demo 3 — Bounded Context Collision
   Show one shared Customer class → blast radius on schema change.
   Then split into bounded contexts → change is isolated.
───────────────────────────────────────────────────────────────── */
function BoundedContextDemo() {
  const [split, setSplit] = useState(false)
  const [changeTriggered, setChangeTriggered] = useState(false)
  const [changedCtx, setChangedCtx] = useState(null) // null | 'sales' | 'support' | 'billing'

  function triggerChange(ctx) {
    setChangeTriggered(true)
    setChangedCtx(ctx)
  }

  function resetDemo() {
    setChangeTriggered(false)
    setChangedCtx(null)
  }

  // In monolith mode: any change affects ALL three
  // In split mode: change only affects the changed context

  const sharedFields = ['id', 'name', 'email', 'phone', 'address', 'leadScore', 'ticketCount', 'invoiceTotal']
  const prospectFields = ['id', 'name', 'email', 'leadScore', 'campaignSource']
  const ticketFields = ['id', 'name', 'email', 'ticketCount', 'slaLevel']
  const accountFields = ['id', 'name', 'email', 'invoiceTotal', 'paymentTerms']

  function isHighlighted(ctxName) {
    if (!changeTriggered) return false
    if (!split) return true           // shared model: everything breaks
    return ctxName === changedCtx    // split: only the changed context
  }

  const highlightStyle = { background: '#FFEBE8', border: '2px solid #D9534F' }
  const normalStyle   = { background: '#fff',    border: '2px solid #DCD9CF' }
  const changedStyle  = { background: '#FFF3E0', border: '2px solid #D97B29' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · bounded context collision vs isolation</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <button className={`act${split ? ' ghost' : ''}`} onClick={() => { setSplit(false); resetDemo() }}>
          Shared model (monolith)
        </button>
        <button className={`act${!split ? ' ghost' : ''}`} onClick={() => { setSplit(true); resetDemo() }}>
          Split bounded contexts
        </button>
      </div>
      {!split ? (
        /* ── Monolith: one shared Customer ── */
        (<div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 8 }}>
            ONE shared Customer class — used by all three teams
          </div>
          <div style={{
            ...(isHighlighted('all') ? highlightStyle : normalStyle),
            borderRadius: 10, padding: 12, marginBottom: 12
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>class Customer &#123; </div>
            {sharedFields.map(f => (
              <div key={f} style={{
                fontSize: 13, padding: '2px 8px',
                background: f === 'leadScore' && changeTriggered ? '#FFD6D0' : 'transparent',
                borderRadius: 4,
                fontFamily: 'IBM Plex Mono',
              }}>
                {f === 'leadScore' && changeTriggered
                  ? <span>  String <b style={{ color: '#D9534F' }}>leadScore; ← Sales added this field!</b></span>
                  : <span>  String {f};</span>}
              </div>
            ))}
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13 }}>&#125;</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            {['Sales', 'Support', 'Billing'].map(team => (
              <div key={team} style={{
                flex: 1, minWidth: 100, borderRadius: 8,
                padding: 10, textAlign: 'center',
                ...(changeTriggered ? highlightStyle : { background: '#EEF2FF', border: '2px solid #2D5BFF' })
              }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{team}</div>
                {changeTriggered && (
                  <div style={{ fontSize: 11, color: '#D9534F', marginTop: 4 }}>
                    ⚠ Build broken — schema changed under us!
                  </div>
                )}
              </div>
            ))}
          </div>
          {!changeTriggered ? (
            <button className="act" onClick={() => triggerChange('all')}>
              Sales adds leadScore field →
            </button>
          ) : (
            <div>
              <Warn>All three teams are affected! Support and Billing have to update their code for a Sales-only concept. This is the blast radius of a shared model.</Warn>
              <button className="ghost act" style={{ marginTop: 8 }} onClick={resetDemo}>Reset</button>
            </div>
          )}
        </div>)
      ) : (
        /* ── Split bounded contexts ── */
        (<div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5', marginBottom: 8 }}>
            Each team owns its own model — bounded contexts are isolated
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              { id: 'sales',   label: 'Sales', emoji: '📈', fields: prospectFields, color: '#2D5BFF', model: 'Prospect' },
              { id: 'support', label: 'Support', emoji: '🎧', fields: ticketFields, color: '#2E9E6B', model: 'TicketCustomer' },
              { id: 'billing', label: 'Billing', emoji: '💰', fields: accountFields, color: '#D97B29', model: 'Account' },
            ].map(ctx => {
              const affected = isHighlighted(ctx.id)
              const isChanger = changedCtx === ctx.id
              return (
                <div key={ctx.id} style={{
                  flex: 1, minWidth: 160, borderRadius: 10, padding: 12,
                  ...(affected && isChanger ? changedStyle : affected ? highlightStyle : { background: '#fff', border: `2px solid ${ctx.color}` })
                }}>
                  <div style={{ fontWeight: 700, color: ctx.color, marginBottom: 6 }}>
                    {ctx.emoji} {ctx.label} — class {ctx.model}
                  </div>
                  {ctx.fields.map(f => (
                    <div key={f} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#555' }}>
                      &nbsp;&nbsp;String {f};
                      {f === 'leadScore' && isChanger && changeTriggered && (
                        <b style={{ color: '#D97B29' }}> ← Sales changed this</b>
                      )}
                    </div>
                  ))}
                  {!changeTriggered && (
                    <button className="ghost act" style={{ fontSize: 11, padding: '4px 8px', marginTop: 8 }}
                      onClick={() => triggerChange(ctx.id)}>
                      Change {ctx.label} model
                    </button>
                  )}
                  {affected && !isChanger && (
                    <div style={{ fontSize: 11, color: '#2E9E6B', marginTop: 6 }}>✅ Not affected</div>
                  )}
                  {isChanger && changeTriggered && (
                    <div style={{ fontSize: 11, color: '#D97B29', marginTop: 6 }}>⚠ Only {ctx.label} changes</div>
                  )}
                </div>
              )
            })}
          </div>
          {changeTriggered ? (
            <div>
              <Good>Only the {changedCtx} team's model changed. The other bounded contexts are completely isolated — their code doesn't even reference the changed class.</Good>
              <button className="ghost act" style={{ marginTop: 8 }} onClick={resetDemo}>Reset</button>
            </div>
          ) : (
            <Note>Click "Change [Team] model" above to see how only that bounded context is affected.</Note>
          )}
        </div>)
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Quiz data
───────────────────────────────────────────────────────────────── */
const QUESTIONS = [
  {
    q: 'What is the primary benefit of the "database per service" rule in microservices?',
    o: [
      'It reduces storage costs by eliminating duplication',
      'It makes queries faster because each service has a smaller database',
      'It prevents services from coupling on shared schema — each service can evolve its storage independently',
      'It enables SQL transactions across multiple services',
    ],
    a: 2,
    e: 'Database per service breaks the hidden coupling that a shared schema creates. When Service A changes a table, Service B breaks even if they have separate code. Separate DBs mean separate schemas, separate migrations, independent evolution.',
    w: {
      0: 'Separate databases typically increase storage costs because data is replicated or duplicated. The benefit is architectural independence, not cost reduction.',
      1: 'Query speed is not the reason — in fact, cross-service data now requires API calls instead of JOIN, which is slower. The benefit is independence, not speed.',
      3: 'The opposite is true — you CANNOT use a DB transaction that spans two separate databases. This is exactly why you need Sagas (Day 90) and the Outbox pattern (Day 95).',
    },
    r: { id: 's8', label: 'Section 8 — Database per service' },
  },
  {
    q: 'The Strangler Fig pattern solves which problem?',
    o: [
      'How to safely migrate from a monolith to microservices incrementally, without a big-bang rewrite',
      'How to distribute traffic across multiple instances of the same service',
      'How to prevent one service from calling another service directly',
      'How to share a database between multiple microservices',
    ],
    a: 0,
    e: 'The Strangler Fig pattern lets you extract one capability at a time, routing its traffic to the new service at the API Gateway, while the monolith still handles everything else. Each step is reversible. There is no risky "freeze the monolith and rewrite everything" moment.',
    w: {
      1: 'Load balancing / scaling is handled by the infrastructure layer. The Strangler Fig is an architectural migration pattern.',
      2: 'Preventing direct service-to-service calls is a different concern (API Gateway routing, service mesh). The Strangler Fig is specifically about migration from a monolith.',
      3: 'Database sharing is actually what microservices avoid. The Strangler Fig is about safe migration strategy, not database topology.',
    },
    r: { id: 's6', label: 'Section 6 — Strangler Fig pattern' },
  },
  {
    q: 'What does "Conway\'s Law" say about microservice design?',
    o: [
      'Services should be small enough to be rewritten in two weeks',
      'The architecture of a system mirrors the communication structure of the organization that built it',
      'Services that communicate frequently should be merged into one service',
      'Every microservice must expose a REST API',
    ],
    a: 1,
    e: 'Conway\'s Law (1967): organizations produce systems that copy their own communication structure. If your teams are split by Sales/Support/Billing, your services will naturally align to those boundaries too. This is why "decompose by business capability" often maps cleanly to team structure.',
    w: {
      0: 'The "two-pizza team" or "two-week rewrite" heuristics are informal sizing rules, not Conway\'s Law. Conway\'s Law is about org structure mirroring system structure.',
      2: 'Co-locating frequently communicating services is a valid optimization (reducing network calls), but it is not what Conway\'s Law states.',
      3: 'REST vs gRPC vs messaging is an implementation choice. Conway\'s Law makes no statement about protocols.',
    },
    r: { id: 's2', label: 'Section 2 — Decomposition strategies' },
  },
  {
    q: 'In the Bounded Context concept, what is wrong with one shared "Customer" model used by Sales, Support, and Billing?',
    o: [
      'It is too large to fit in memory',
      'The word "Customer" means different things in each context — the shared model forces one schema to serve all meanings, so a change for one team breaks the others',
      'Shared models make SQL queries slower',
      'A Customer object cannot be serialized to JSON',
    ],
    a: 1,
    e: 'In Sales, "Customer" means a prospect with a lead score. In Support, it means a ticket holder with an SLA level. In Billing, it means an account with payment terms. One shared class tries to serve all three meanings. When Sales adds a field for their context, Support and Billing code breaks even though they never needed that field.',
    w: {
      0: 'Memory size is not the issue. Domain correctness is. A small but incorrectly shared model is still wrong.',
      2: 'SQL performance is a separate concern. The bounded context problem is about meaning and change blast radius, not query speed.',
      3: 'JSON serialization works fine on shared models. The problem is semantic coupling, not technical serialization.',
    },
    r: { id: 's3', label: 'Section 3 — Bounded contexts' },
  },
  {
    q: 'An Anti-Corruption Layer (ACL) is best described as:',
    o: [
      'A database migration tool that prevents data corruption',
      'A circuit breaker that stops cascading failures',
      'A security firewall that blocks unauthorized API calls between services',
      'A translation layer that converts an external or legacy model into your own clean domain model',
    ],
    a: 3,
    e: 'An ACL (from DDD) sits at the boundary between your clean domain and an external system (legacy system, third-party API). It translates the external model into your domain model so your internals never get polluted with the external system\'s concepts. It implements the Adapter pattern (Day 26) at the bounded context boundary.',
    w: {
      0: 'Database migration tools (like Flyway, Liquibase) are unrelated. ACL is a domain layer pattern.',
      1: 'A circuit breaker (like Hystrix/Resilience4j) handles fault tolerance. The ACL handles domain model translation. Both are important but different.',
      2: 'A security firewall is an infrastructure concern (API Gateway, network policy). The ACL is a domain design pattern about model translation, not security.',
    },
    r: { id: 's5', label: 'Section 5 — Anti-Corruption Layer' },
  },
  {
    q: 'What is the API Composition (BFF) pattern for?',
    o: [
      'Versioning REST APIs across multiple services',
      'Preventing services from sharing a database',
      'Aggregating data from multiple services server-side so the client makes one call instead of N',
      'Compressing API responses to reduce bandwidth',
    ],
    a: 2,
    e: 'Without API Composition, a mobile client needing order + user + payment data would make 3 separate network calls — 3 round-trips on a slow mobile connection. A BFF (Backend for Frontend) or API Composer fans out those 3 calls server-side in parallel, then merges the results and returns one response to the client.',
    w: {
      0: 'API versioning is handled by URL versioning (/v1/, /v2/) or header versioning. API Composition is about aggregating responses, not versioning.',
      1: 'Database isolation is the "database per service" rule, not API Composition. These are separate patterns.',
      3: 'Response compression (gzip, brotli) is an HTTP-level concern. API Composition is about reducing the number of client round-trips.',
    },
    r: { id: 's9', label: 'Section 9 — API Composition / BFF' },
  },
  {
    q: 'When should you START with microservices instead of a monolith?',
    o: [
      'When your team has more than 5 engineers',
      'Always — microservices are always better than monoliths',
      'When you are using a cloud provider',
      'Almost never — start with a well-structured modular monolith; extract services when you have a proven domain model and a specific scaling need',
    ],
    a: 3,
    e: 'Microservices add enormous operational complexity: network latency, distributed tracing, separate deployments, eventual consistency. A monolith is simpler to build, test, and deploy. Extract services when the monolith\'s pain (deploy coupling, scaling a single component) exceeds the complexity cost of distribution. Martin Fowler calls this "MonolithFirst."',
    w: {
      0: 'Team size is one factor but not a threshold rule. A 10-person team can run a monolith efficiently; a 3-person team can struggle with microservices. Domain clarity and scaling needs matter more.',
      1: 'Microservices are not always better. For small teams and early-stage products they add complexity without benefit. Many successful systems (Basecamp, Shopify initially) are monoliths.',
      2: 'Cloud providers support both monoliths and microservices equally well. Using AWS does not mean you need microservices.',
    },
    r: { id: 's1', label: 'Section 1 — Monolith vs microservices' },
  },
  {
    q: 'Which decomposition strategy says: identify where the same word (like "Order") means different things in different parts of the business, and draw a service boundary there?',
    o: [
      'Decompose by subdomain / bounded context (Domain-Driven Design)',
      'Decompose by volatility',
      'Decompose by database table',
      'Decompose by team size',
    ],
    a: 0,
    e: 'Domain-Driven Design (DDD) uses bounded contexts to find natural seams. "Order" in Sales means a quote; "Order" in Warehouse means a pick list; "Order" in Finance means a revenue event. Each bounded context becomes a service boundary because the models diverge. This produces stable, semantically clean services.',
    w: {
      1: 'Decomposition by volatility asks "what changes often vs rarely?" — useful, but that is a separate strategy. It doesn\'t address the semantic "same word, different meaning" problem.',
      2: 'Table-per-service decomposition leads to data-layer-driven design, which often produces the wrong service boundaries (technical split, not business split). DDD recommends business-capability or subdomain boundaries instead.',
      3: 'Team size is an operational concern. DDD decomposition is about domain semantics, not org chart math.',
    },
    r: { id: 's2', label: 'Section 2 — Decomposition strategies' },
  },
]

/* ─────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────── */
export default function Day98() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 98</div>
        <h1>Microservices Patterns:<br />Decompose, Migrate &amp; Integrate</h1>
        <p>
          A monolith is one building. Microservices is a city. Learn how to split the building into
          specialized structures — safely, incrementally, without tearing everything down at once.
          Click every demo; the concepts only click when you see the blast radius shrink in real time.
        </p>
        <div className="chips">
          {['Bounded Context', 'Strangler Fig', 'Anti-Corruption Layer',
            'Database per Service', 'API Composition', 'BFF', "Conway's Law", 'DDD'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* ── Section 1: City analogy + monolith vs microservices ── */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>One building vs a city</h2>
        <p>
          Imagine a <strong>monolith</strong> as one giant office building. Accounting is on floor 3,
          the kitchen is on floor 5, the delivery dock is in the basement. It is fast to construct.
          But if the kitchen floods, the whole building closes — accounting, delivery, everything.
        </p>
        <p>
          <strong>Microservices</strong> is a city. Each business function lives in its own small
          building. The kitchen floods only the restaurant, not the bank next door or the hospital
          across the street. Each building has its own staff, its own maintenance schedule, its own
          expansion plan.
        </p>

        <Code html={`<span class="cm">// Monolith vs Microservices — high-level picture</span>

<span class="cm">// ─── MONOLITH ─────────────────────────────────────────────────────</span>
<span class="cm">// One JAR / WAR file. Everything deploys together.</span>
<span class="cm">//</span>
<span class="cm">// ┌─────────────────────────────────────────┐</span>
<span class="cm">// │            One Deployable               │</span>
<span class="cm">// │                                         │</span>
<span class="cm">// │  UserController   OrderController       │</span>
<span class="cm">// │  PaymentService   InventoryService      │</span>
<span class="cm">// │  NotificationJob  ReportingJob          │</span>
<span class="cm">// │                                         │</span>
<span class="cm">// │       ONE shared database               │</span>
<span class="cm">// └─────────────────────────────────────────┘</span>
<span class="cm">//</span>
<span class="cm">// ─── MICROSERVICES ────────────────────────────────────────────────</span>
<span class="cm">// Many small deployables, each with its own DB.</span>
<span class="cm">//</span>
<span class="cm">// ┌─────────────┐  ┌─────────────┐  ┌─────────────┐</span>
<span class="cm">// │ User Service│  │Order Service│  │  Payment    │</span>
<span class="cm">// │  own DB 🗄️  │  │  own DB 🗄️  │  │  Service    │</span>
<span class="cm">// └─────────────┘  └─────────────┘  │  own DB 🗄️  │</span>
<span class="cm">//                                   └─────────────┘</span>
<span class="cm">//</span>
<span class="cm">// Communication between services = HTTP / gRPC / message queue</span>
<span class="cm">// (a network call, NOT an in-process method call)</span>`} />

        <table className="matrix" style={{ marginTop: 16 }}>
          <thead>
            <tr><th>Concern</th><th>Monolith</th><th>Microservices</th></tr>
          </thead>
          <tbody>
            <tr><td>Initial development speed</td><td className="yes">Fast — one codebase</td><td className="no">Slower — distributed overhead</td></tr>
            <tr><td>Scaling ONE component</td><td className="no">Scale everything (wasteful)</td><td className="yes">Scale only what you need</td></tr>
            <tr><td>Deploy a small change</td><td className="no">Redeploy the whole app</td><td className="yes">Redeploy only that service</td></tr>
            <tr><td>One component crashes</td><td className="no">Can take down whole app</td><td className="yes">Other services keep running</td></tr>
            <tr><td>Technology choice</td><td className="no">Locked to one language/DB</td><td className="yes">Right tool per service</td></tr>
            <tr><td>Operational complexity</td><td className="yes">Low — one thing to run</td><td className="no">High — many things to monitor</td></tr>
            <tr><td>Inter-component calls</td><td className="yes">In-process, microseconds</td><td className="no">Network, milliseconds</td></tr>
            <tr><td>Testing the full system</td><td className="yes">One test suite</td><td className="no">Need contract tests, integration tests</td></tr>
          </tbody>
        </table>

        <Warn>
          <strong>Do not start with microservices.</strong> Start as a well-structured modular monolith
          (clean packages/modules with clear boundaries). Extract services only when you have a proven
          domain model and a specific, measured scaling or deployment pain point. Martin Fowler calls
          this "MonolithFirst."
        </Warn>
      </section>

      {/* ── Section 2: Decomposition strategies ── */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>How do you split? Three strategies</h2>
        <p>
          When you decide to extract services, where do you draw the lines? Three strategies:
        </p>

        <Code html={`<span class="cm">// ── Strategy 1: By business capability (most common) ──────────────</span>
<span class="cm">// One service per business function. Maps to team structure.</span>
<span class="cm">//</span>
<span class="cm">// UserService     → manages accounts, authentication</span>
<span class="cm">// OrderService    → manages order lifecycle</span>
<span class="cm">// PaymentService  → charges cards, handles refunds</span>
<span class="cm">// ShippingService → tracks parcels, calculates delivery</span>
<span class="cm">//</span>
<span class="cm">// Conway's Law: "organizations produce systems that copy</span>
<span class="cm">// their own communication structure"</span>
<span class="cm">// If your company has a Payments team, extract a PaymentService.</span>
<span class="cm">// Service boundaries naturally follow team boundaries.</span>

<span class="cm">// ── Strategy 2: By subdomain / DDD bounded context ───────────────</span>
<span class="cm">// Find where the SAME WORD means DIFFERENT THINGS.</span>
<span class="cm">//</span>
<span class="cm">// "Order" in Sales context    = a quote, has discount tiers</span>
<span class="cm">// "Order" in Warehouse context = a pick list, has bin locations</span>
<span class="cm">// "Order" in Finance context   = a revenue event, has tax lines</span>
<span class="cm">//</span>
<span class="cm">// These are DIFFERENT models. Forcing one Order class</span>
<span class="cm">// to serve all three contexts creates constant conflict.</span>
<span class="cm">// → Extract three services, each with its own Order model.</span>

<span class="cm">// ── Strategy 3: By volatility ────────────────────────────────────</span>
<span class="cm">// Separate what changes often from what changes rarely.</span>
<span class="cm">//</span>
<span class="cm">// PricingService  → changes weekly (marketing promos)  → extract</span>
<span class="cm">// RecommendationService → ML model updates daily       → extract</span>
<span class="cm">// CoreOrderStateMachine → stable for years             → keep monolith-side</span>
<span class="cm">//</span>
<span class="cm">// Volatile code extracted → can deploy it fast without</span>
<span class="cm">// touching the stable parts.</span>`} />

        <Note>
          <strong>Conway's Law</strong> (Melvin Conway, 1967): any organization that designs a system
          will produce a design whose structure copies the communication structure of that organization.
          In practice: if you want microservices that match your domain, align your teams to the domain
          boundaries first. Structure follows organization; organization follows structure.
        </Note>

        <Reveal summary="Heuristic: the two-pizza team rule">
          Amazon's Jeff Bezos popularized the "two-pizza team" rule: if you need more than two pizzas
          to feed the team that owns a service, the service is too big. It is a rough size heuristic,
          not a law. The domain boundary matters more than headcount. A two-person team can own a large
          service if the domain is cohesive; a ten-person team can own a small service if the work is
          focused.
        </Reveal>
      </section>

      {/* ── Section 3: Bounded contexts ── */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Bounded contexts — where words change meaning</h2>
        <p>
          A <strong>bounded context</strong> is a boundary inside which a model is consistent and terms
          have a single, agreed meaning. Cross the boundary, and the same word may mean something different.
        </p>

        <Code html={`<span class="cm">// The word "Customer" in three bounded contexts:</span>

<span class="cm">// ─── Bounded Context: Sales ──────────────────────────────────────</span>
<span class="kw">class</span> Prospect &#123;                  <span class="cm">// Sales calls it "Prospect"</span>
    String id;
    String name;
    String email;
    <span class="kw">int</span> leadScore;                 <span class="cm">// only Sales cares about this</span>
    String campaignSource;         <span class="cm">// which ad brought them in</span>
&#125;

<span class="cm">// ─── Bounded Context: Support ────────────────────────────────────</span>
<span class="kw">class</span> TicketCustomer &#123;             <span class="cm">// Support calls it "TicketCustomer"</span>
    String id;
    String name;
    String email;
    <span class="kw">int</span> openTicketCount;           <span class="cm">// only Support cares about this</span>
    String slaLevel;               <span class="cm">// "Gold", "Silver", "Bronze"</span>
&#125;

<span class="cm">// ─── Bounded Context: Billing ────────────────────────────────────</span>
<span class="kw">class</span> Account &#123;                    <span class="cm">// Billing calls it "Account"</span>
    String id;
    String name;
    String email;
    BigDecimal invoiceTotal;       <span class="cm">// only Billing cares about this</span>
    String paymentTerms;           <span class="cm">// "Net30", "Net60", etc.</span>
&#125;

<span class="cm">// Anti-pattern: one "Customer" used everywhere</span>
<span class="kw">class</span> Customer &#123;                   <span class="cm">// ❌ tries to serve three contexts</span>
    String id;
    String name;
    String email;
    <span class="kw">int</span> leadScore;                 <span class="cm">// ← Billing hates this field</span>
    <span class="kw">int</span> openTicketCount;           <span class="cm">// ← Sales hates this field</span>
    BigDecimal invoiceTotal;       <span class="cm">// ← Support hates this field</span>
    String slaLevel;
    String paymentTerms;
    String campaignSource;         <span class="cm">// ← Billing: what is this even?</span>
    <span class="cm">// Every team's migration runs through this class.</span>
    <span class="cm">// Every change is a potential conflict.</span>
&#125;</span>`} />

        <Warn>
          When teams fight constantly about schema changes to a shared model — that is a bounded context
          collision. The fix is not better communication; it is splitting the model so each team owns theirs.
        </Warn>

        <Good>
          Each bounded context owns its data. <strong>No shared database table across context boundaries.</strong>
          If Billing needs to show a customer name, it either stores a local copy (denormalization is fine
          across contexts) or calls the User Service API to fetch it.
        </Good>
      </section>

      {/* ── Section 4: Interactive — Decomposition Explorer ── */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: decompose the monolith</h2>
        <p>
          The monolith starts with all four services mixed together. Click <strong>"Extract next service"</strong>
          to pull each one out. Once a service is extracted, click <strong>"Scale ×N"</strong> on just that
          service — notice only it scales, not the others. Compare with the "Scale monolith" button: it scales
          everything, even services you did not need to scale.
        </p>
        <DecompositionDemo />
      </section>

      {/* ── Section 5: Anti-Corruption Layer ── */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Anti-Corruption Layer — speak legacy, think clean</h2>
        <p>
          When your clean microservice must integrate with a legacy system or a third-party API,
          their model is different from yours. Without protection, your clean domain gets polluted
          with their concepts, field names, and quirks.
        </p>
        <p>
          An <strong>Anti-Corruption Layer (ACL)</strong> is a translation layer at the boundary.
          It speaks the external language in, and speaks your clean domain language out. Inside your
          service, you never see the external model directly.
        </p>

        <Code html={`<span class="cm">// Your clean domain model (inside your service)</span>
<span class="kw">class</span> Payment &#123;
    Money amount;                  <span class="cm">// Money = value object with BigDecimal + Currency</span>
    String cardToken;
    String idempotencyKey;
&#125;

<span class="kw">class</span> PaymentResult &#123;
    String transactionId;
    PaymentStatus status;          <span class="cm">// YOUR enum: SUCCESS, FAILED, PENDING</span>
&#125;

<span class="cm">// ── Anti-Corruption Layer (ACL) ──────────────────────────────────</span>
<span class="cm">// This class translates between YOUR domain and Stripe's domain.</span>
<span class="cm">// It is an Adapter (Day 26) at the bounded-context boundary.</span>
<span class="kw">class</span> StripePaymentAdapter <span class="kw">implements</span> PaymentGateway &#123;

    <span class="kw">private</span> StripeClient stripe;   <span class="cm">// Stripe's SDK — lives only here</span>

    <span class="kw">public</span> PaymentResult charge(Payment payment) &#123;

        <span class="cm">// 1. Translate YOUR domain → Stripe's domain</span>
        ChargeRequest req = <span class="kw">new</span> ChargeRequest()
            .setAmount(payment.amount().inCents())   <span class="cm">// Stripe wants integer cents</span>
            .setCurrency(payment.amount().currency().code())
            .setSource(payment.cardToken())
            .setIdempotencyKey(payment.idempotencyKey());

        <span class="cm">// 2. Call the external system</span>
        ChargeResponse resp = stripe.createCharge(req);

        <span class="cm">// 3. Translate Stripe's response → YOUR domain</span>
        <span class="kw">return new</span> PaymentResult(
            resp.getId(),
            PaymentStatus.fromStripeStatus(resp.getStatus())  <span class="cm">// map "succeeded" → SUCCESS</span>
        );
    &#125;
&#125;

<span class="cm">// Inside OrderService — it only knows PaymentGateway (your interface)</span>
<span class="cm">// It never imports StripeClient, ChargeRequest, or ChargeResponse.</span>
<span class="cm">// Switching from Stripe to PayPal = swap the adapter, nothing else changes.</span>`} />

        <Note>
          The ACL is the <strong>Adapter pattern</strong> (Day 26) applied at the bounded context
          boundary. The interface (<C>PaymentGateway</C>) is yours — defined in your domain, using
          your types. The adapter is the only place Stripe's SDK is imported. When Stripe changes
          their API, you change one class.
        </Note>

        <Reveal summary="ACL vs Facade vs Adapter — which is which?">
          <p>All three wrap something. The difference is intent and scope:</p>
          <ul>
            <li><strong>Adapter</strong> — makes two incompatible interfaces work together. Small, focused on one class pair.</li>
            <li><strong>Facade</strong> — simplifies a complex subsystem into one easy entry point. About simplicity.</li>
            <li><strong>ACL</strong> — DDD term for an entire translation layer at a bounded context boundary. May contain multiple adapters, mappers, and translators. About domain model integrity, not just interface compatibility.</li>
          </ul>
          In practice, when you build a StripePaymentAdapter that converts domain objects to Stripe API
          calls and back, you are simultaneously using the Adapter pattern and building an ACL.
        </Reveal>
      </section>

      {/* ── Section 6: Strangler Fig ── */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Strangler Fig — safe incremental migration</h2>
        <p>
          The strangler fig tree grows around an existing host tree, slowly replacing it from the outside.
          Over years, the host rots away and the strangler stands alone. This is the safest way to migrate
          a monolith to microservices. No big-bang rewrite (which almost always fails).
        </p>

        <Code html={`<span class="cm">// The four steps of one migration cycle:</span>
<span class="cm">//</span>
<span class="cm">// 1. ROUTE — put an API Gateway in front of the monolith</span>
<span class="cm">//            (if you don't have one, add one now)</span>
<span class="cm">//</span>
<span class="cm">// 2. EXTRACT — build the new microservice for ONE capability</span>
<span class="cm">//              test it thoroughly; it does not need to be perfect</span>
<span class="cm">//</span>
<span class="cm">// 3. REDIRECT — update the gateway to send that capability's traffic</span>
<span class="cm">//               to the new service; keep old monolith code in place</span>
<span class="cm">//</span>
<span class="cm">// 4. KILL + REPEAT — delete the dead code from the monolith;</span>
<span class="cm">//                    move to the next capability</span>
<span class="cm">//</span>
<span class="cm">// ─── API Gateway routing logic (simplified) ──────────────────────</span>
<span class="kw">class</span> ApiGateway &#123;

    PaymentService paymentSvc;     <span class="cm">// new microservice</span>
    MonolithClient monolith;       <span class="cm">// old monolith (still running)</span>

    Response route(Request req) &#123;
        <span class="cm">// Phase 1: monolith handles everything</span>
        <span class="cm">// return monolith.forward(req);</span>

        <span class="cm">// Phase 2: payment extracted, monolith handles rest</span>
        <span class="kw">if</span> (req.path().startsWith(<span class="str">"/payments"</span>)) &#123;
            <span class="kw">return</span> paymentSvc.handle(req);  <span class="cm">// → new service</span>
        &#125;
        <span class="kw">return</span> monolith.forward(req);    <span class="cm">// → old monolith</span>

        <span class="cm">// Rollback? Change one line back. Zero risk.</span>
    &#125;
&#125;</span>`} />

        <Warn>
          The "big bang rewrite" — freeze the monolith, rewrite everything from scratch, then cut over —
          almost always fails. Rewrites take 2–3x longer than estimated. The old monolith keeps receiving
          bug fixes, so the new code is already behind when it launches. The Strangler Fig avoids all of
          this: you ship value at every step, and every step is reversible.
        </Warn>

        <Reveal summary="What if the monolith and new service share data during migration?">
          <p>
            During the transition, the new PaymentService might need order data that still lives in
            the monolith's database. Options (in order of preference):
          </p>
          <ol>
            <li><strong>API call:</strong> PaymentService calls MonolithService via HTTP to get the data. Clean separation.</li>
            <li><strong>Read-only DB access:</strong> PaymentService reads from the monolith's DB in read-only mode, with an agreed stable view (a DB view or specific tables). Temporary — plan to eliminate it.</li>
            <li><strong>Dual write:</strong> monolith writes to both its DB and a new shared table that PaymentService reads. More complex, but keeps schemas separate.</li>
          </ol>
          Option 1 is cleanest. Option 2 is practical for a short migration period. Option 3 adds complexity
          but lets you migrate the data layer independently.
        </Reveal>
      </section>

      {/* ── Section 7: Interactive — Strangler Fig ── */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>Play: watch the strangler fig grow</h2>
        <p>
          Start at Phase 0 — the monolith handles 100% of traffic. Click <strong>"Extract next service"</strong>
          to migrate one capability at a time. Watch the monolith shrink. Notice the <strong>"Rollback"</strong>
          button is always available — you can always revert one phase at the gateway. This is the safety property
          that big-bang rewrites do not have.
        </p>
        <StranglerFigDemo />
      </section>

      {/* ── Section 8: Database per service ── */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Database per service — the most important rule</h2>
        <p>
          Each microservice must own its own database. No service may reach directly into another
          service's database. This is the single most important rule in microservices architecture.
        </p>

        <Code html={`<span class="cm">// ❌ Anti-pattern: shared database</span>
<span class="cm">//</span>
<span class="cm">// OrderService and PaymentService both connect to the same DB.</span>
<span class="cm">// OrderService does:  SELECT * FROM payments WHERE order_id = ?</span>
<span class="cm">// PaymentService does: UPDATE payments SET status = ?</span>
<span class="cm">//</span>
<span class="cm">// Problems:</span>
<span class="cm">// - PaymentService renames a column → OrderService query breaks</span>
<span class="cm">// - You cannot scale the payment DB independently</span>
<span class="cm">// - You cannot swap PaymentService to a NoSQL store</span>
<span class="cm">// - You cannot give teams independent deploy schedules</span>

<span class="cm">// ✅ Correct: database per service</span>
<span class="cm">//</span>
<span class="cm">// OrderService      → owns orders_db     (PostgreSQL)</span>
<span class="cm">// PaymentService    → owns payments_db   (PostgreSQL + encrypted)</span>
<span class="cm">// ProductService    → owns products_db   (MongoDB — flexible schema)</span>
<span class="cm">// SessionService    → owns sessions_db   (Redis — TTL-based eviction)</span>
<span class="cm">//</span>
<span class="cm">// To get payment data, OrderService calls PaymentService's API:</span>
PaymentSummary ps = paymentClient.getPaymentForOrder(orderId);
<span class="cm">// (HTTP call, not a DB join)</span>

<span class="cm">// Cross-service consistency (no ACID transaction spanning two DBs):</span>
<span class="cm">// → Use the Saga pattern   (Day 90) for multi-step workflows</span>
<span class="cm">// → Use the Outbox pattern (Day 95) for reliable event publishing</span>`} />

        <Note>
          <strong>Why no shared DB is so important:</strong> a shared database is a hidden coupling point
          that looks like independence but is not. Two services with separate code but the same DB will
          still break each other's deployments via schema changes. True independence requires separate
          storage.
        </Note>

        <table className="matrix" style={{ marginTop: 16 }}>
          <thead>
            <tr><th>Service</th><th>Good DB choice</th><th>Why</th></tr>
          </thead>
          <tbody>
            <tr><td>Order Service</td><td>PostgreSQL</td><td>Relational, ACID, complex queries</td></tr>
            <tr><td>Product Catalog</td><td>MongoDB</td><td>Flexible schema, nested documents</td></tr>
            <tr><td>Session Store</td><td>Redis</td><td>Fast key-value, TTL expiry</td></tr>
            <tr><td>Search Service</td><td>Elasticsearch</td><td>Full-text search, facets</td></tr>
            <tr><td>Analytics</td><td>ClickHouse / BigQuery</td><td>Columnar, analytical queries</td></tr>
            <tr><td>Graph data</td><td>Neo4j</td><td>Relationship traversal</td></tr>
          </tbody>
        </table>
      </section>

      {/* ── Section 9: API Composition / BFF ── */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>API Composition / BFF — one call instead of many</h2>
        <p>
          A mobile screen showing an order detail needs: the order, the user who placed it, and the
          payment status. In a microservices world, that data lives in three services. The naive approach:
          the mobile app makes three separate HTTP calls. Problems: three network round-trips on a slow
          mobile connection; the app now knows about three internal services; three points of failure.
        </p>
        <p>
          <strong>API Composition</strong> (also called a <strong>BFF — Backend for Frontend</strong>)
          solves this. One upstream call hits a Composer layer server-side. The Composer fans out to the
          three services in parallel, waits for all, merges the results, and returns one response.
        </p>

        <Code html={`<span class="cm">// ── API Composer (BFF for the mobile app) ────────────────────────</span>
<span class="kw">class</span> OrderDetailComposer &#123;

    <span class="kw">private</span> OrderService    orders;    <span class="cm">// HTTP clients to each service</span>
    <span class="kw">private</span> UserService     users;
    <span class="kw">private</span> PaymentService  payments;

    <span class="cm">// Mobile calls: GET /api/mobile/orders/{id}/detail</span>
    <span class="cm">// → one call from the app, three parallel calls server-side</span>
    OrderDetail getOrderDetail(String orderId) &#123;

        <span class="cm">// Fan out in parallel using CompletableFuture</span>
        CompletableFuture&lt;Order&gt;   orderF   = orders.getAsync(orderId);
        CompletableFuture&lt;Payment&gt; paymentF = payments.getAsync(orderId);

        <span class="cm">// We need the order first to know the userId</span>
        Order order = orderF.join();

        <span class="cm">// Now fetch user in parallel with payment</span>
        CompletableFuture&lt;User&gt; userF = users.getAsync(order.userId());

        <span class="cm">// Wait for both remaining futures</span>
        CompletableFuture.allOf(paymentF, userF).join();

        <span class="cm">// Merge into one response object</span>
        <span class="kw">return new</span> OrderDetail(
            order,
            userF.join(),
            paymentF.join()
        );
    &#125;
&#125;

<span class="cm">// ── Why "BFF" (Backend for Frontend)? ────────────────────────────</span>
<span class="cm">// You can have different BFFs for different clients:</span>
<span class="cm">//</span>
<span class="cm">// MobileOrderBFF     → returns small payloads, few fields (bandwidth matters)</span>
<span class="cm">// WebOrderBFF        → returns rich payloads with more detail</span>
<span class="cm">// ThirdPartyOrderBFF → returns only publicly contractual fields</span>
<span class="cm">//</span>
<span class="cm">// Each BFF is tailored to its client's needs.</span>
<span class="cm">// The downstream services stay unchanged.</span>`} />

        <Good>
          The BFF pattern also moves presentation logic (filtering fields, formatting dates, combining
          responses) out of the individual services and into a dedicated layer whose job is to serve
          one type of client well. Services stay clean; clients get exactly what they need.
        </Good>

        <Reveal summary="API Gateway vs BFF — what is the difference?">
          <p>Both sit between clients and services, but they have different jobs:</p>
          <ul>
            <li>
              <strong>API Gateway</strong> — infrastructure layer. Handles: authentication, rate limiting,
              SSL termination, routing, load balancing. Knows nothing about your business domain.
              One gateway for all clients.
            </li>
            <li>
              <strong>BFF</strong> — application layer. Handles: aggregating multiple service responses,
              tailoring the shape and fields to a specific client, applying client-specific business rules.
              Usually one BFF per client type (mobile, web, third-party).
            </li>
          </ul>
          In practice you often have both: the API Gateway handles cross-cutting concerns, and requests
          flow through it to a BFF which handles composition and client-specific shaping.
        </Reveal>
      </section>

      {/* ── Section 10: Interactive — Bounded Context Collision ── */}
      <section id="s10">
        <div className="sec-label">Section 10 · Interactive</div>
        <h2>Play: bounded context collision</h2>
        <p>
          Switch between <strong>"Shared model"</strong> and <strong>"Split bounded contexts"</strong> modes.
          In shared model mode, click the "Sales adds leadScore field" button and watch all three teams break.
          In split mode, click "Change [Team] model" on any one team — only that team is affected.
          This is the core argument for bounded contexts.
        </p>
        <BoundedContextDemo />
      </section>

      {/* ── Section 11: Common traps ── */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>Common traps — what goes wrong</h2>

        <Warn>
          <strong>Trap 1 — Microservices too early.</strong> Extracting services before you understand the
          domain locks in the wrong boundaries. Wrong service boundaries are worse than a monolith because
          they are hard to change and add all the distributed system costs with none of the benefits.
          Extract only when the monolith's pain is measured and specific.
        </Warn>

        <Warn>
          <strong>Trap 2 — Nano-services.</strong> One service per class or one service per DB table.
          Result: a thousand network calls to do anything; tight coupling via API calls instead of method
          calls; worse than a monolith but with all the overhead. Services should be cohesive business
          capabilities, not single classes.
        </Warn>

        <Warn>
          <strong>Trap 3 — Shared library coupling.</strong> Extracting a shared library of domain model
          classes that all services import re-creates the shared model problem, just at library level.
          One team bumps the library version; every other service must update. Use shared libraries only
          for pure technical utilities (logging, retry), never for domain model classes.
        </Warn>

        <Warn>
          <strong>Trap 4 — Synchronous chains.</strong> Service A calls Service B calls Service C calls
          Service D. Now A's latency = sum of all four latencies. If D is slow, everything is slow.
          If D is down, everything is down. Use async messaging (events, queues) to break synchronous chains.
          Only call synchronously when you genuinely need the response right now.
        </Warn>

        <Warn>
          <strong>Trap 5 — Skipping the Strangler Fig.</strong> Trying to rewrite the entire monolith at
          once ("we'll be done in 6 months"). Nobody has ever been done in 6 months. The monolith keeps
          evolving while the rewrite is frozen. Extract incrementally.
        </Warn>

        <Code html={`<span class="cm">// Common mistakes cheat-sheet</span>
<span class="cm">//</span>
<span class="cm">// ❌ Too many tiny services      → merge into cohesive capabilities</span>
<span class="cm">// ❌ Shared database             → database per service</span>
<span class="cm">// ❌ Shared domain library       → share only technical utilities</span>
<span class="cm">// ❌ Wrong context boundaries    → extract AFTER domain is understood</span>
<span class="cm">// ❌ Synchronous call chains     → use async events for long chains</span>
<span class="cm">// ❌ Big-bang rewrite            → Strangler Fig, one service at a time</span>
<span class="cm">// ❌ No API gateway              → add one before you extract anything</span>`} />
      </section>

      {/* ── Section 12: Cheat sheet ── */}
      <section id="s12">
        <div className="sec-label">Section 12</div>
        <h2>Cheat sheet</h2>
        <ul>
          <li><strong>Monolith first.</strong> Start simple. Extract when you have specific, measured pain.</li>
          <li><strong>Decompose by business capability</strong> (most common), subdomain/bounded context (DDD), or volatility.</li>
          <li><strong>Conway's Law:</strong> system structure mirrors org structure. Align teams to domain boundaries.</li>
          <li><strong>Bounded context:</strong> a boundary where terms have one consistent meaning. "Customer" in Sales ≠ "Customer" in Billing.</li>
          <li><strong>Anti-Corruption Layer:</strong> translates between external model and your clean domain model. Implements Adapter pattern at the context boundary.</li>
          <li><strong>Strangler Fig:</strong> Route → Extract → Redirect → Kill → Repeat. Every step is reversible. Never big-bang.</li>
          <li><strong>Database per service:</strong> the most important rule. No shared DB tables across service boundaries.</li>
          <li><strong>API Composition / BFF:</strong> server-side fan-out to N services, merge, return one response to client. One BFF per client type.</li>
          <li><strong>Cross-service consistency:</strong> no ACID across services. Use Saga (Day 90) and Outbox (Day 95).</li>
          <li><strong>Nano-services trap:</strong> one service per class = network overhead with no boundary benefit.</li>
        </ul>
      </section>

      {/* ── Interview Corner ── */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>6 questions interviewers love to ask</h2>

        <Reveal summary="What is a bounded context and why does it matter in microservices?">
          <p>
            A bounded context (from Domain-Driven Design) is a boundary inside which a model is internally
            consistent and terms have a single agreed meaning. Cross the boundary, and the same term may
            mean something different.
          </p>
          <p>
            It matters because microservice boundaries should follow bounded context boundaries. If you
            split services without respecting bounded contexts, you get services that share model
            semantics and constantly conflict on schema changes. Correct bounded contexts produce stable,
            independently evolvable services.
          </p>
          <p>
            Example: "Order" in the Sales context is a quote. "Order" in the Warehouse context is a
            pick list. These are different models even though they share a name. Separate service, separate
            schema, separate team.
          </p>
        </Reveal>

        <Reveal summary="What is the Strangler Fig pattern and why is it safer than a big-bang rewrite?">
          <p>
            The Strangler Fig pattern migrates from a monolith to microservices incrementally: route all
            traffic through an API Gateway, extract one capability at a time to a new service, redirect
            that capability's traffic in the gateway, delete the old code, repeat.
          </p>
          <p>
            It is safer than big-bang because: (1) you ship value at every step — each extracted service
            is in production; (2) every step is reversible — change one line in the gateway to roll back;
            (3) the monolith keeps working and receiving bug fixes during the migration; (4) you learn
            from each extraction and calibrate the approach for the next one.
          </p>
          <p>
            Big-bang fails because rewrites always take 2–3x longer than estimated, the monolith keeps
            evolving while the rewrite is frozen, and the cutover is one enormous risk event.
          </p>
        </Reveal>

        <Reveal summary="What is an Anti-Corruption Layer and which design pattern does it implement?">
          <p>
            An Anti-Corruption Layer (ACL) is a translation layer at the boundary between your clean
            domain model and an external system (legacy monolith, third-party API). It converts the
            external model into your domain model and vice versa, so your internals never get polluted
            with external concepts and naming conventions.
          </p>
          <p>
            It implements the <strong>Adapter pattern</strong> (Day 26). The interface is defined in
            your domain (using your types). The adapter class is the only place the external SDK is
            imported. Switching providers = swap the adapter, nothing else changes.
          </p>
        </Reveal>

        <Reveal summary="Why must each microservice own its own database?">
          <p>
            A shared database is a hidden coupling point. Even if two services have completely separate
            code, they are tightly coupled if they share a database: one service's schema migration
            breaks the other service's queries at deploy time. You cannot scale the DBs independently.
            You cannot choose the right DB type per service. You cannot give teams truly independent
            deploy schedules.
          </p>
          <p>
            Database per service eliminates all of these couplings. The cost: cross-service data now
            requires API calls (not JOIN), and cross-service consistency requires Sagas and the Outbox
            pattern instead of ACID transactions.
          </p>
        </Reveal>

        <Reveal summary="What is Conway's Law and how does it affect microservice design?">
          <p>
            Conway's Law (Melvin Conway, 1967): "Any organization that designs a system will produce
            a design whose structure is a copy of the organization's communication structure."
          </p>
          <p>
            In practice: if your company has a Payments team, a Orders team, and a Users team with
            clear ownership and separate Slack channels, your microservices will naturally align to
            those three boundaries — because each team owns their code end-to-end and minimizes
            cross-team dependencies.
          </p>
          <p>
            The implication: before decomposing services, align your teams to domain boundaries.
            If your org is organized by technical layer (frontend team, backend team, DBA team),
            your services will be organized by technical layer too — and that produces bad service
            boundaries. Inverse Conway Maneuver: restructure the org to match the target architecture.
          </p>
        </Reveal>

        <Reveal summary="What is a BFF (Backend for Frontend) and when do you need one?">
          <p>
            A BFF (Backend for Frontend) is a server-side aggregation layer purpose-built for one
            specific client type. Instead of the client making N separate calls to N microservices,
            it makes one call to the BFF. The BFF fans out to the N services in parallel, merges the
            responses, applies client-specific formatting, and returns one tailored response.
          </p>
          <p>
            You need a BFF when: (1) a single client screen needs data from multiple services — N
            round-trips on mobile is painful; (2) different clients need different shapes of the same
            data (mobile wants less, web dashboard wants more); (3) you want to keep individual
            services from accumulating client-specific logic.
          </p>
          <p>
            Typical setup: one MobileBFF, one WebBFF, one ThirdPartyBFF — each tailored to its client.
            The downstream services stay unchanged and unaware of the clients.
          </p>
        </Reveal>
      </section>

      {/* ── Quiz ── */}
      <section id="quiz">
        <div className="sec-label">Section 13 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer. Explanations appear for every choice — right or wrong.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* ── Footer ── */}
      <div className="footer">
        <strong>Day 98 complete?</strong> Homework: take the monolith-style
        e-commerce codebase you have been building this month and identify three bounded contexts in it.
        For each one, write: (a) what the key model class is called in that context, (b) which fields
        belong only to that context, (c) which team/capability owns it. Then sketch the Strangler Fig
        migration order — which service would you extract first and why (hint: highest-risk or highest-value
        capability usually goes first to prove the approach).
        <br /><br />
        Next: <strong>Day 99 — System Design Interview Synthesis</strong>: tie together the full
        four-month arc — from OOP and SOLID through GoF patterns, classic LLD problems, concurrency,
        and distributed systems — into a single cohesive interview strategy. Includes a live 45-minute
        mock system design walkthrough with the complete interviewer rubric.
      </div>
    </div>
  )
}
