import { useState, useEffect } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the drill timer ============ */
const PHASES = [
  { until: 5 / 45, label: 'clarify & scope', nudge: '❓ 4–6 questions. For a DS problem: nail the TIME COMPLEXITY target. For a system: name the pluggable axes. Say what is OUT.' },
  { until: 12 / 45, label: 'structure / axes', nudge: '📦 DS: pick the data structure(s) the complexity forces. System: list the strategy seams (channels/policies) + reliability needs.' },
  { until: 35 / 45, label: 'code bottom-up', nudge: '⌨️ Bricks → core structure/strategies → service → wiring. Compile every ~8 min. Narrate decisions.' },
  { until: 42 / 45, label: 'test & polish', nudge: '🧪 Happy path + the hard case (O(1) under eviction/expiry, or a failed/retried delivery). Fix, don\'t gold-plate.' },
  { until: 1, label: 'self-review', nudge: '📋 Stop typing. Run the Section 7 rubric honestly. Write down your top-2 gaps.' },
]

function fmt(s) { const m = Math.floor(s / 60), ss = s % 60; return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss }

function DrillTimer() {
  const [duration, setDuration] = useState(45 * 60)
  const [left, setLeft] = useState(45 * 60)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running || left === 0) return
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running, left])
  const elapsed = duration - left
  const progress = elapsed / duration
  const phaseIdx = left === 0 ? PHASES.length - 1 : PHASES.findIndex((p) => progress < p.until)
  const phase = PHASES[phaseIdx === -1 ? PHASES.length - 1 : phaseIdx]
  function preset(min) { setDuration(min * 60); setLeft(min * 60); setRunning(false) }
  return (
    <div className="panel">
      <div className="ptitle">Live demo · an actual drill clock — phases scale to whatever length you pick</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {[25, 45, 60].map((m) => <button key={m} className={duration === m * 60 ? 'on' : ''} onClick={() => preset(m)}>{m} min</button>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 38, fontWeight: 700, color: left === 0 ? 'var(--red)' : 'var(--ink)' }}>{fmt(left)}</span>
        {!running
          ? <button className="act" onClick={() => left > 0 && setRunning(true)}>{elapsed > 0 && left > 0 ? '▶ resume' : '▶ start the drill'}</button>
          : <button className="ghost act" onClick={() => setRunning(false)}>⏸ pause</button>}
        <button className="ghost act" onClick={() => preset(duration / 60)}>reset</button>
      </div>
      <div style={{ display: 'flex', width: '100%', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 8 }}>
        {PHASES.map((p, i) => {
          const start = i === 0 ? 0 : PHASES[i - 1].until
          const w = (p.until - start) * 100
          const active = i === (phaseIdx === -1 ? PHASES.length - 1 : phaseIdx) && elapsed > 0
          const past = progress >= p.until
          return (
            <div key={i} style={{
              width: w + '%', padding: '6px 2px', textAlign: 'center', fontFamily: 'IBM Plex Mono', fontSize: 10.5,
              whiteSpace: 'nowrap', overflow: 'hidden', background: active ? '#FFF1D6' : past ? '#EAF7EF' : '#fff',
              borderRight: i < PHASES.length - 1 ? '1px solid var(--line)' : 'none', fontWeight: active ? 700 : 400,
            }}>{p.label}</div>
          )
        })}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {left === 0
          ? <span>⏰ <b>Pens down.</b> However far you got is the data. Straight to the rubric (Section 7).</span>
          : elapsed === 0
            ? <span>Pick a track below, pick a length, press start — and follow the bar, not your enthusiasm.</span>
            : <span style={{ fontSize: 13 }}><b>{phase.label.toUpperCase()}</b> — {phase.nudge}</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: the smell hunt ============ */
const SMELLS = [
  { code: 'class Node { Node next; }   // singly-linked\n// LRU: to evict, find the node before tail...',
    o: ['Node needs a value', 'Singly-linked can\'t remove a known node in O(1) (no prev) — LRU needs a DOUBLY-linked list + a HashMap (Day 56)', 'Use an ArrayList', 'Add a size field'], a: 1,
    why: 'Eviction and move-to-front delete a node from the middle; without a prev pointer you scan O(n) to find it. A doubly-linked list + HashMap<key,Node> gives O(1) lookup AND O(1) splice.' },
  { code: 'V get(K key) {\n  return map.get(key);   // LRU cache\n}',
    o: ['Should return Optional', 'A get HIT must also move the node to the front (a read is a use) — otherwise recently-read keys sink and get evicted wrongly (Day 56)', 'map should be final', 'Missing a null check'], a: 1,
    why: 'In LRU a read counts as a use. If get doesn\'t promote the node to most-recently-used, the policy breaks. get = lookup + moveToFront, both O(1).' },
  { code: 'switch (channel) {\n  case EMAIL: sendEmail(...); break;\n  case SMS:   sendSms(...);   break;\n}',
    o: ['Missing default', 'A switch on channel type reopens for every new channel — use a NotificationChannel interface, one class per channel (Strategy, Day 57)', 'Strings are slow', 'Should be if-else'], a: 1,
    why: 'Channels are interchangeable senders behind one contract. A switch is the growing-switch smell (Day 12); the service should loop over the user\'s channels and call send() — adding WhatsApp is a new class.' },
  { code: 'void notifyUser(...) {\n  emailServer.send(...);   // blocks on a slow SMTP call\n}',
    o: ['Add a timeout', 'Synchronous send on the request path blocks the caller on third-party I/O — enqueue and let workers deliver async with retry/backoff (Days 49, 57)', 'Log the send', 'Cache the server'], a: 1,
    why: 'Blocking the request thread on a flaky external API tanks latency. Reliability = async queue + workers + retry/backoff + dead-letter; the caller returns immediately.' },
  { code: 'Driver pickDriver(...) {\n  return nearest(drivers);   // by straight-line distance\n}',
    o: ['Cache the result', 'Nearest-by-distance ignores traffic — a near car can arrive LAST; optimize ETA via a swappable MatchingStrategy (Day 59)', 'Sort the list', 'Use a for-loop'], a: 1,
    why: 'Distance lies when traffic differs. A traffic-aware LowestEta strategy beats nearest-by-distance, and both live behind one MatchingStrategy interface so the controller never changes.' },
  { code: 'void chargeRider(Trip t) {\n  gateway.charge(t.rider(), t.fare());   // client retries on timeout\n}',
    o: ['Add logging', 'No idempotency: a timed-out-but-succeeded charge retried = double-bill — pass an idempotency key so a retry is a no-op (Days 52, 54, 59)', 'Make it async', 'Round the fare'], a: 1,
    why: 'Any money/booking op with retries needs an idempotency key recorded with the operation, so a repeat returns the original result instead of charging again. The recurring lesson across the big systems.' },
]

function SmellHunt() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= SMELLS.length
  const cur = SMELLS[idx]
  function pick(i) { if (picked !== null) return; setPicked(i); if (i === cur.a) setScore((s) => s + 1) }
  return (
    <div className="panel">
      <div className="ptitle">Live demo · six snippets from this week's problems, each hiding one planted smell — name it</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Score: <b>{score} / {SMELLS.length}</b> — these six span the week: the LRU structure, the read-is-a-use rule, channel Strategy, async reliability, ETA dispatch, and idempotency. Re-run until 6/6 is boring.</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Hunt again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 10 }}>🔎 <span>snippet {idx + 1} of {SMELLS.length} · score {score}</span></div>
          <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
            {cur.code.split('\n').map((l, i) => (
              <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, whiteSpace: 'pre', overflowX: 'auto' }}>{l}</div>
            ))}
          </div>
          <div className="modbtns">
            {cur.o.map((o, i) => (
              <button key={i} className={picked !== null && i === cur.a ? 'on' : ''}
                style={{ fontSize: 12.5, ...(picked === i && i !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}) }}
                onClick={() => pick(i)}>{o.length > 64 ? o.slice(0, 61) + '…' : o}</button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ ' : '❌ '} <b>{cur.o[cur.a]}</b><br /><br />{cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={() => { setPicked(null); setIdx((i) => i + 1) }}>Next snippet →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: the rubric scorecard ============ */
const RUBRIC = [
  { cat: 'Scope', revisit: 'Day 56', items: [
    'Asked 4–6 design-shaping questions before touching code',
    'For a DS problem: nailed the TIME-COMPLEXITY target out loud (it dictates the structure)',
    'For a system: named the pluggable axes + reliability needs; said what is OUT',
  ]},
  { cat: 'Model', revisit: 'Days 56 & 57', items: [
    'Chose the data structure(s) the complexity forces (and said why)',
    'Varying concerns are behind interfaces (eviction policy / channel / strategy), not switches',
    'Money is Money/BigDecimal; running aggregates, not log re-scans',
    'Separated WHAT happened from WHERE it goes from HOW (event/sink/format)',
  ]},
  { cat: 'Code', revisit: 'Days 58 & 59', items: [
    'It compiles, and the happy path runs end-to-end',
    'The hot operation hits its complexity target (O(1) get/put, sync of both structures)',
    'Shared claims are atomic; external deps (payment/provider/hardware) behind ports',
    'A deterministic test of the hard part is POSSIBLE (fakes / fixed clock)',
  ]},
  { cat: 'Reliability', revisit: 'Days 57 & 59', items: [
    'Async where I/O is involved (don\'t block the caller); retry + backoff + dead-letter',
    'Idempotency on retries; TTL/expiry handled (lazy + sweeper)',
  ]},
  { cat: 'Communication', revisit: 'Days 58 & 56', items: [
    'Narrated decisions while typing, citing the pattern/structure and the constraint it serves',
    'Flagged concurrency, scale, and the extension seams in one sentence each',
  ]},
]
const TOTAL_ITEMS = RUBRIC.reduce((n, g) => n + g.items.length, 0)

function RubricScorecard() {
  const [checked, setChecked] = useState({})
  const score = Object.values(checked).filter(Boolean).length
  const toggle = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }))
  const gaps = RUBRIC.filter((g) => g.items.some((_, i) => !checked[g.cat + i]))
  let verdict, color
  if (score >= 15) { verdict = '🟢 Interview-ready. One more 25-minute speed rep, then you have FINISHED Month 3 — on to Month 4 (advanced + concurrency).'; color = '#EAF7EF' }
  else if (score >= 11) { verdict = '🟡 One more rep. Restudy ONLY the flagged days, then drill the OTHER track at full length.'; color = '#FFF1D6' }
  else { verdict = '🔴 Rebuild first. Re-do the flagged days actively (type the code), then re-drill this SAME track.'; color = '#FDECEC' }
  return (
    <div className="panel">
      <div className="ptitle">Live demo · grade your drill like an interviewer would — honestly, right after pens-down</div>
      {RUBRIC.map((g) => (
        <div key={g.cat} style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>
            {g.cat.toUpperCase()} <span style={{ opacity: 0.7 }}>· taught on {g.revisit}</span>
          </div>
          {g.items.map((item, i) => {
            const k = g.cat + i
            return (
              <button key={k} onClick={() => toggle(k)} style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'IBM Plex Sans',
                fontSize: 13.5, padding: '5px 8px', marginBottom: 3, border: '1px solid var(--line)', borderRadius: 6,
                background: checked[k] ? '#EAF7EF' : '#fff',
              }}>{checked[k] ? '☑' : '☐'} {item}</button>
            )
          })}
        </div>
      ))}
      <div className="statbar" style={{ display: 'block', background: score > 0 ? color : undefined }}>
        <span style={{ fontSize: 13.5 }}>
          <b>score: {score} / {TOTAL_ITEMS}</b>{score > 0 && <> — {verdict}</>}
          {score > 0 && score < TOTAL_ITEMS && gaps.length > 0 && (
            <><br />gap days to restudy: <b>{gaps.map((g) => g.cat + ' → ' + g.revisit).join(' · ')}</b></>
          )}
        </span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'A data-structure design prompt (cache, store, leaderboard). After scope, the FIRST thing to nail?',
    o: ['The database', 'The TIME-COMPLEXITY target — it dictates the data structure(s) (O(1) get/put forces HashMap + DLL; top-K forces a heap). Name it before coding', 'The REST API', 'The class diagram'], a: 1,
    e: 'For DS problems the complexity requirement IS the design constraint (Day 56: O(1) both → HashMap + doubly-linked list). State the target, then the structure follows.',
    w: { 0: 'In-memory DS, not storage.', 2: 'API is the surface; the structure is the test.', 3: 'The structure choice comes from the complexity, drawn after.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'Track A is a TTL cache (expiring key-value store). The two mechanisms it needs beyond a HashMap?',
    o: ['Just a bigger map', 'A second server', 'Encryption', 'EXPIRY (lazy: treat expired entries as misses on read + a background SWEEPER; or a TTL) AND an EVICTION policy when it hits max size (LRU/LFU as a strategy) — Days 56 + 52'], a: 3,
    e: 'A TTL cache combines LRU\'s lessons (a structure for eviction) with the hold-expiry lessons (lazy + sweeper). Entries leave for two reasons: expiry (time) or eviction (capacity).',
    w: { 0: 'A map alone has no expiry or eviction.', 1: 'It\'s in-memory.', 2: 'Irrelevant.' },
    r: { id: 's4', label: 'Section 4 — Track A' } },
  { q: 'Track B is a webhook delivery service. The planted trap in delivering events to subscriber URLs?',
    o: ['At-least-once delivery + retries means a subscriber can receive DUPLICATES — deliver async with retry/backoff/dead-letter, and give each event an id so subscribers can DEDUP (idempotency); never block the producer on a slow subscriber (Days 57, 59)', 'Slow JSON parsing', 'Using too much memory', 'Missing validation'], a: 0,
    e: 'Reliable delivery is at-least-once, so duplicates happen — the contract must include an event id for consumer-side dedup, plus async + retry/backoff + dead-letter, and the producer never blocks on a flaky endpoint.',
    w: { 1: 'Not parsing speed.', 2: 'Not memory.', 3: 'The concurrency/duplication issue is the trap.' },
    r: { id: 's5', label: 'Section 5 — Track B' } },
  { q: 'Both tracks involve background work and external calls. The shared reliability toolkit?',
    o: ['Synchronous everything', 'Hope', 'Async (don\'t block the caller) + retry with exponential backoff + dead-letter queue + idempotency — plus a deterministic test using fakes and a fixed clock', 'Bigger timeouts'], a: 2,
    e: 'The Day 49/57/59 reliability layer: enqueue and let workers do I/O, retry transient failures with backoff, park exhausted work in a dead-letter queue, and make retries safe with idempotency keys. Test it with fakes.',
    w: { 0: 'Sync blocks the hot path.', 1: '🙂 No.', 3: 'Timeouts just delay failure.' },
    r: { id: 's2', label: 'Section 2 — the week\'s skills' } },
  { q: 'You scored 12/17, all misses in Reliability. The review loop says…',
    o: ['Move on — passing', 'Redo all of Weeks 1–12', 'Lower the rubric', 'Restudy ONLY the flagged material (async + retry + idempotency from Days 57/59), then re-drill the OTHER track at full length'], a: 3,
    e: 'Targeted reps: the rubric points at specific gap days. Missing Reliability means the async/retry/idempotency layer didn\'t stick — restudy 57/59 actively, then re-drill to confirm.',
    w: { 0: 'A real gap; carrying it forward compounds it.', 1: 'Untargeted re-study is rereading.', 2: 'Adjusting the stick guarantees no improvement. 🙂' },
    r: { id: 's7', label: 'Section 7 — review loop' } },
  { q: 'LRU\'s get must move the node to the front because…',
    o: ['A read is a USE — without promoting it, recently-read keys drift to the tail and get evicted wrongly; both lookup and move-to-front are O(1) (HashMap + DLL)', 'It frees memory', 'The map requires it', 'It looks nice'], a: 0,
    e: 'The defining LRU subtlety: reads count as accesses. The HashMap gives O(1) node access; the doubly-linked list gives O(1) reordering; together they keep get/put at O(1).',
    w: { 1: 'It doesn\'t free memory.', 2: 'It\'s an LRU rule, not a map rule.', 3: 'Correctness, not aesthetics.' },
    r: { id: 's6', label: 'Section 6 — smell hunt' } },
  { q: 'Across Month 3, "a scary big system" should now feel like…',
    o: ['A unique puzzle each time', 'Mostly database design', 'A SHAPE you recognize in minute one — resource+atomic-claim, scheduling/dispatch, state machine, money ledger, pipeline, or game loop — decomposed into patterns you already own', 'Something to memorize'], a: 2,
    e: 'Month 3\'s meta-skill: recognize the shape and the defining problem fast, then deploy known patterns. Cab booking proved it — it\'s every shape at once, and decomposes cleanly.',
    w: { 0: 'They reduce to a handful of shapes.', 1: 'It grades modeling/concurrency, not schema.', 3: 'Recognition beats memorization.' },
    r: { id: 's8', label: 'Section 8 — Month 3 recap' } },
  { q: 'Why narrate "O(1) because HashMap + DLL" or "async because external I/O" while drilling alone?',
    o: ['Interviewers can\'t read code', 'Citing the structure/pattern AND the constraint it serves must be automatic by interview day — and saying it forces you to verify the choice actually fits, catching mis-design early', 'To memorize a script', 'Unnecessary'], a: 1,
    e: 'Narration is a muscle and a self-check: "O(1) requires the HashMap+DLL combo", "I/O means async + retry". Silent reps train silent interviews; saying the WHY also catches a wrong structure before minute 30.',
    w: { 0: 'They grade whether you can justify it.', 2: 'A habit, not a script.', 3: 'It\'s half the skill being drilled.' },
    r: { id: 's8', label: 'Section 8 — failure modes' } },
]

/* ============ The page ============ */
export default function Day60() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 12 · Day 60 · Classic LLD Problems</div>
        <h1>Week 12 Drill:<br />Data Structures, Reliability &amp; the Month-3 Capstone</h1>
        <p>The last drill of Month 3. Two fresh problems solo, under a real timer, graded with an interviewer\'s
           rubric — one is a data-structure design (the LRU shape), one is a reliable delivery system (the
           notification shape) — plus a capstone recap of the whole month\'s shapes. Click everything, then close
           the lid and drill.</p>
        <div className="chips">
          {['timed drill', 'TTL cache track', 'webhook track', 'self-grading rubric', 'smell hunt', 'Month 3 recap'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The drill protocol</h2>
        <p>Same dress-rehearsal rules as Days 45/50/55. The Week-12 twist: for a data-structure problem, the
          <strong> complexity target</strong> is your first artifact (it dictates the structure); for a system,
          name the <strong>pluggable axes + reliability needs</strong>.</p>
        <Code html={`  THE DRILL PROTOCOL (Week 12 edition)

  RULES:  real keyboard · timer visible · no peeking at Days 56–59 until review ·
          code must COMPILE at the bell · talk out loud · pens down at zero.

  THE 45-MINUTE SHAPE
  ──────────────────────────────────────────────────────────────
   0– 5   clarify + scope; DS → state the complexity target; system → the axes
   5–12   structure (the data structure the complexity forces) OR the strategy seams
  12–35   CODE bottom-up: structure/strategies → service → wiring (compile every ~8')
  35–42   happy path + the HARD case (O(1) under eviction/expiry; a failed/retried send)
  42–45   self-review against the rubric (Section 7)`} />
        <Note><strong>The DS tell:</strong> if the prompt says "O(1)" / "fast" / "top-K", the complexity IS the
          design — pick the structure that meets it (HashMap + DLL for O(1) LRU; a heap for top-K). The
          system tell: pluggable concerns (channels, policies) + external I/O → strategy seams + a reliability
          layer.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The week in one map — what the drill tests</h2>
        <table className="matrix">
          <thead><tr><th>skill</th><th>born on</th><th>drill checkpoint</th></tr></thead>
          <tbody>
            <tr><td>complexity dictates the structure</td><td>Day 56</td><td>O(1) target → HashMap + DLL chosen</td></tr>
            <tr><td>combine two structures for O(1)</td><td>Day 56</td><td>lookup + ordering both O(1)</td></tr>
            <tr><td>eviction / policy as a strategy</td><td>Days 56 · 57</td><td>LRU/LFU or channel behind an interface</td></tr>
            <tr><td>expiry: lazy + sweeper / TTL</td><td>Days 52 · 56</td><td>expired entries reclaimed, not leaked</td></tr>
            <tr><td>separate WHAT/WHERE/HOW</td><td>Day 57</td><td>event vs sink vs format are distinct</td></tr>
            <tr><td>reliability: async + retry + DLQ</td><td>Days 49 · 57 · 59</td><td>caller never blocks; failures don\'t vanish</td></tr>
            <tr><td>idempotency on retries</td><td>Days 52 · 54 · 59</td><td>a retried op doesn\'t double-apply</td></tr>
            <tr><td>ETA / strategy dispatch</td><td>Days 58 · 59</td><td>optimize the right metric, swappable</td></tr>
            <tr><td>ports + fakes → testable</td><td>Days 57 · 59</td><td>deterministic test of the hard part</td></tr>
            <tr><td>recognize the SHAPE fast</td><td>all of Month 3</td><td>named in the first 5 minutes</td></tr>
          </tbody>
        </table>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>⏱ The drill clock</h2>
        <p>Use this for the real thing. Read a track, write your scope + structure/axes FIRST, then press start:</p>
        <DrillTimer />
        <Good><strong>How to use it:</strong> the moment you finish scope, write one sentence — DS: "the target
          is O(1) get/put, so I\'ll use ___"; system: "the pluggable axes are ___ and I\'ll deliver reliably with
          ___". If you can\'t fill that in by minute 5, the drill just found your gap.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Track A · "Design an in-memory cache with TTL and a max size." (the data-structure rep)</h2>
        <p>Write your 4–6 clarifying questions and the structure on paper <em>before</em> opening the answers.</p>
        <Warn><strong>Do not open the reveals until your structure is written.</strong> Reading first turns a rep
          into a rerun — picking the structure from the complexity is the muscle this track trains.</Warn>
        <Reveal summary="🔒 The interviewer's answers — open AFTER writing your structure">
          <p><strong>Operations?</strong> get(k), put(k, v, ttl), and they must be O(1).
            <br /><strong>Expiry?</strong> Each entry has a TTL; an expired entry must read as a MISS and be reclaimed.
            <br /><strong>Max size?</strong> Yes — when full, evict by a policy (LRU now; "maybe LFU later").
            <br /><strong>Thread-safe?</strong> Single-threaded first; note the concurrency story.
            <br /><strong>Out of scope:</strong> persistence, distribution.
            <br /><strong>Sneaky follow-up at minute 40:</strong> "make eviction LFU" and "make it thread-safe".</p>
        </Reveal>
        <Reveal summary="🔒 Model-answer skeleton — open ONLY during the review phase">
          <Code html={`  TRACK A — LRU (Day 56) + expiry (Day 52), combined

  O(1) get/put  → HashMap<K, Node>  +  doubly-linked list (recency)   ← the combo
  Node { key, value, expiresAt, prev, next }   ; sentinel head/tail
  get(k):  node = map.get(k);
           if (node == null || expired(node)) { remove(node); return MISS; }  ← LAZY expiry
           moveToFront(node); return node.value;        ← a read is a use
  put(k,v,ttl): upsert; if over capacity → evict tail (LRU); set expiresAt = now+ttl
  background SWEEPER: periodically drop entries with expiresAt < now  ← + lazy on read
  EvictionPolicy interface → LRU today, LFU = a new class (one wiring line)

  SELF-CHECK: singly-linked? get not promoting? expiry only lazy (no sweeper)?
  forgot to remove from BOTH map and list on evict? Each is Day 56/52 calling.`} />
        </Reveal>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Track B · "Design a webhook delivery service." (the reliability rep — with a planted trap)</h2>
        <p>Subscribers register URLs for event types; when an event fires, you deliver it to them. Questions +
          the delivery design on paper first. This looks like the notification system — and hides the at-least-once
          trap.</p>
        <Reveal summary="🔒 The interviewer's answers — open AFTER writing your design">
          <p><strong>Subscriptions?</strong> Subscribers register a URL per event type (like notification preferences).
            <br /><strong>Delivery guarantee?</strong> At-least-once — every event must eventually reach a healthy subscriber.
            <br /><strong>Failures?</strong> A subscriber URL can be down or slow; retry, then give up after N.
            <br /><strong>Must not?</strong> Block other deliveries on one slow subscriber; lose events silently.
            <br /><strong>Out of scope:</strong> the actual HTTP client, auth signatures (mention them).
            <br /><strong>Sneaky follow-up at minute 40:</strong> "a subscriber complains they got the same event twice."</p>
        </Reveal>
        <Reveal summary="🔒 Model-answer skeleton + THE TRAP — open ONLY during the review phase">
          <Code html={`  TRACK B — the notification reliability shape, re-skinned

  event fired → look up subscribers for that type (a registry, like preferences)
             → ENQUEUE a delivery per subscriber  (async — producer never blocks)
  worker pool: deliver each
     ├─ 2xx → done
     ├─ transient fail → RETRY with exponential backoff
     └─ max retries exhausted → DEAD-LETTER QUEUE (inspect/alert), never silent drop
  each event carries a stable EVENT ID  (+ optional signature)

  ⚠ THE TRAP: at-least-once + retries ⇒ subscribers WILL get DUPLICATES.
     The contract must include an event id so the CONSUMER can dedup (idempotency);
     "exactly-once delivery" is impossible — you dedup at the edge (Days 57, 59).
  Per-subscriber isolation: one slow/broken URL must not stall others (own queue/worker).`} />
        </Reveal>
        <Note><strong>Why two tracks:</strong> Track A tests whether the data-structure muscle transferred
          (complexity → structure, combine two, expiry + eviction). Track B tests the reliability/framework
          shape — async + retry + dead-letter + idempotency — and whether you remember at-least-once means
          consumers must dedup. Different muscles; drill both.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔎 Play: the smell hunt</h2>
        <p>Warm up your reviewer\'s eye before grading yourself. Six snippets from this week\'s problems, one
          planted smell each:</p>
        <SmellHunt />
        <Good><strong>What you should notice:</strong> ① The LRU smells (singly-linked, get-not-promoting) are
          about the STRUCTURE meeting the complexity. ② The system smells (channel switch, sync send, distance
          dispatch, no idempotency) are the Strategy + reliability lessons. The fix is never "be careful" — it\'s
          a structure, an interface, or a reliability mechanism.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>📋 The rubric: grade yourself like an interviewer</h2>
        <p>Right after pens-down — while the memory is honest — check off only what you ACTUALLY did:</p>
        <RubricScorecard />
        <Code html={`  THE REVIEW LOOP

  drill (45') ──▶ rubric score ──▶ write your TOP-2 gaps
                                          │
       ▲                                  ▼
       └── re-drill (other track) ◀── restudy ONLY the gap days (actively: type it)

  One honest loop beats five untimed, ungraded "practice sessions".`} />
        <Warn><strong>The rubric only works if it hurts a little.</strong> "I would have made it O(1)" is
          unchecked. "I meant to add idempotency" is unchecked. The standard: an interviewer watching the
          recording would have seen or heard it.</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Month 3 in the rearview — the shapes you now own</h2>
        <p>Twenty classic problems across four weeks. Step back: they were a handful of repeating SHAPES.
          Recognizing the shape in minute one is the whole skill Month 3 built.</p>
        <table className="matrix">
          <thead><tr><th>shape</th><th>defining problem</th><th>problems</th></tr></thead>
          <tbody>
            <tr><td>resource + reservation + atomic claim</td><td>"two users, one X"</td><td>Parking, BookMyShow, hotel</td></tr>
            <tr><td>scheduling / dispatch (Strategy)</td><td>"which one next?"</td><td>Elevator, Cab Booking</td></tr>
            <tr><td>state machine</td><td>"same input, different meaning per state"</td><td>Vending Machine, ATM, trip lifecycle</td></tr>
            <tr><td>money ledger</td><td>"balances reconcile, pennies conserved"</td><td>Splitwise, wallet</td></tr>
            <tr><td>pipeline / pluggable framework</td><td>"route/deliver through stages or sinks"</td><td>Logging, Notification, webhooks</td></tr>
            <tr><td>turn-based game loop</td><td>"who moves, apply rules, check end"</td><td>Tic-Tac-Toe, Snake &amp; Ladder</td></tr>
            <tr><td>data structure for a complexity target</td><td>"O(1) / top-K"</td><td>LRU Cache, TTL cache</td></tr>
          </tbody>
        </table>
        <Good><strong>The Month-3 meta-skill:</strong> a fresh prompt should trigger "that\'s shape #N with a
          twist" within a minute, then the patterns (Strategy, State, Observer, atomic-claim, the right data
          structure) come by name with their triggers and trade-offs. That recognition — not memorized
          solutions — is what carries you into Month 4\'s advanced problems and mocks.</Good>
        <Warn><strong>Drill failure modes (same as always):</strong> coding before the structure/axes are named ·
          picking a pattern by reflex without justifying it · silent coding · compiling once at the end ·
          skipping the hard-case test · and the rep without the review. The 10 minutes with the rubric is where
          improvement lives.</Warn>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>📋 Cheat sheet — the pocket script</h2>
        <ul>
          <li><strong>DS tell:</strong> the complexity target dictates the structure (O(1) both → HashMap + DLL; top-K → heap). State it first.</li>
          <li><strong>System tell:</strong> pluggable concerns → Strategy/interfaces; external I/O → a reliability layer (async + retry/backoff + dead-letter + idempotency).</li>
          <li><strong>Expiry:</strong> lazy (miss on read) + a background sweeper, or a TTL; entries leave by expiry (time) OR eviction (capacity).</li>
          <li><strong>At-least-once</strong> ⇒ duplicates happen ⇒ consumers dedup via an event/idempotency id; exactly-once is dedup at the edge.</li>
          <li><strong>Optimize the right metric</strong> (ETA, not distance) behind a swappable strategy; money is Money; aggregates are running, not re-scans.</li>
          <li><strong>Ports + fakes + a fixed clock</strong> → test the hard part deterministically.</li>
          <li><strong>Recognize the shape first</strong> (Month-3 table); review loop: drill → rubric → top-2 gaps → re-drill.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 End-of-Month-3 questions</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Make the LRU/TTL cache thread-safe. What changes, and what is the tension?"'>
          <p>Wrap get/put so the map AND the linked list mutate atomically — a single lock is correct but
            serializes all access (and a get is a WRITE here, since it reorders, so a read-write lock doesn\'t
            help much). Real concurrent caches shard the keyspace (lock striping, like ConcurrentHashMap) and
            often relax strict LRU to approximate LRU because exact global recency ordering is a contention
            bottleneck. The tension to name: strict LRU and high concurrency fight each other, so production
            caches approximate. (This is exactly Month 4 / Week 13 territory.)</p>
        </Reveal>
        <Reveal summary='Q: "A webhook subscriber says they got the same event 3 times. Whose bug?"'>
          <p>Not necessarily a bug — at-least-once delivery with retries GUARANTEES occasional duplicates (a
            delivery that timed out but actually succeeded gets retried). The fix is shared responsibility: YOU
            put a stable event id in every delivery; the SUBSCRIBER dedups on it (idempotent consumer). You can
            reduce duplicates (track acks, don\'t retry a confirmed delivery) but can\'t eliminate them — true
            exactly-once is impossible across a network, so you dedup at the edge. Explaining at-least-once vs
            exactly-once is the senior answer.</p>
        </Reveal>
        <Reveal summary='Q: "How do you test a cache eviction / a retrying delivery without flakiness?"'>
          <p>Inject the variable parts: a FIXED clock so you can "advance time" past a TTL instantly (no
            sleeps), and fakes for external calls — a FakeSubscriber/FakeProvider that can be told to fail to
            exercise retry/backoff/dead-letter. Then assert deterministically: evicting the LRU on overflow,
            an expired entry reading as a miss after the clock advances, a failing delivery hitting the
            dead-letter queue after N retries, and a duplicate id delivered once. Because time and I/O are
            seams, the hard parts are testable — the whole reason for ports and an injected Clock (Days 47/52/57).</p>
        </Reveal>
        <Reveal summary='Q: "How would you implement an O(1) LFU cache? Why is it harder than LRU?"'>
          <p>LRU just needs a doubly-linked list (recency order) + HashMap — O(1) because you only ever
            move to the front or evict from the back. LFU must track FREQUENCY: the classic O(1) solution
            uses a HashMap of frequency → doubly-linked list of keys at that frequency, plus a
            HashMap of key → (value, freq), plus a minFreq pointer. On access: increment key's freq,
            move it from the freq-N list to the freq-(N+1) list; if the new list is now the minimum,
            update minFreq. On eviction: remove the LRU key from the minFreq list. Three HashMaps +
            minFreq pointer = O(1) get and put. The extra complexity vs LRU is why LFU caches are
            rarer in practice — approximate LFU (count-min sketch) is often preferred at scale.</p>
        </Reveal>
        <Reveal summary='Q: "You&apos;ve finished Month 3. Are you ready for the advanced problems and mocks?"'>
          <p>You\'re ready if a fresh prompt triggers shape-recognition fast (the Section 8 table) and you name
            the defining problem + the right structure/pattern in the first few minutes, with the rubric going
            green twice across both tracks. Month 4 builds directly on this: Week 13 makes the concurrency
            you\'ve been FLAGGING all along (atomic claims, thread-safety, races) the main event; then advanced
            problems and timed mocks. If the shapes feel familiar and the race/complexity jumps out at you,
            you\'re ready — Month 4 deepens, it doesn\'t restart.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s10">
        <div className="sec-label">Section 10 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 60 complete?</strong> Homework IS the day: run <strong>Track A at 45 minutes</strong> today
        with the timer above — full protocol, structure named first, rubric immediately after, top-2 gaps written
        down. Tomorrow (or after a gap-day restudy if you scored red), run <strong>Track B at 45</strong> and see
        if the at-least-once/idempotency trap catches you. Green on both = Week 12 is yours — and you\'ve
        completed <strong>Month 3, the entire classic-LLD-problems block</strong>.
        <br /><br />
        Next: <strong>Day 61 — Month 4 begins: Concurrency, Part 1</strong> — threads, race conditions, and
        locks. Every "atomic claim" flag you\'ve planted all month finally gets built for real.
      </div>
    </div>
  )
}
