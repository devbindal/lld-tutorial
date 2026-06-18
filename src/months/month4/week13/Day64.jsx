import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: optimistic vs pessimistic under contention ============ */
function ContentionRace() {
  const [contention, setContention] = useState('low')
  const [res, setRes] = useState(null)
  const N = 12

  function run() {
    if (contention === 'low') {
      const retries = Math.random() < 0.5 ? 0 : 1
      setRes({
        opt: { retries, note: 'almost no conflicts → ~0 retries, NO locking overhead, full parallelism' },
        pess: { retries: 0, note: 'all ' + N + ' ops serialize behind the lock — correct, but they queue up needlessly' },
        winner: 'opt',
      })
    } else {
      const retries = 14 + Math.floor(Math.random() * 12)
      setRes({
        opt: { retries, note: retries + ' wasted retries — threads keep colliding and redoing work (toward livelock); CPU burns' },
        pess: { retries: 0, note: 'serialize once behind the lock — no wasted work; the lock IS the cheapest path under heavy contention' },
        winner: 'pess',
      })
    }
  }

  const col = (title, data, win) => (
    <div style={{ flex: 1, minWidth: 200, border: '1.5px solid var(--line)', borderRadius: 8, padding: 10, background: win ? '#EAF7EF' : '#fff', outline: win ? '2px solid var(--green)' : 'none' }}>
      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14 }}>{title} {win && '← better here'}</div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, margin: '4px 0' }}>retries: <b style={{ color: data.retries > 5 ? 'var(--red)' : 'var(--ink)' }}>{data.retries}</b></div>
      <div style={{ fontSize: 12, color: '#555' }}>{data.note}</div>
    </div>
  )

  return (
    <div className="panel">
      <div className="ptitle">Live demo · {N} concurrent updates to one resource — which strategy wins depends on CONTENTION</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        <button className={contention === 'low' ? 'on' : ''} onClick={() => { setContention('low'); setRes(null) }}>low contention</button>
        <button className={contention === 'high' ? 'on' : ''} onClick={() => { setContention('high'); setRes(null) }}>high contention</button>
      </div>
      <div style={{ marginBottom: 10 }}><button className="act" onClick={run}>▶ run {N} concurrent updates</button></div>
      {res && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          {col('🔓 Optimistic (CAS / version)', res.opt, res.winner === 'opt')}
          {col('🔒 Pessimistic (lock & hold)', res.pess, res.winner === 'pess')}
        </div>
      )}
      <div className="statbar" style={{ display: 'block' }}>
        <span style={{ fontSize: 12.5 }}>
          {!res ? 'Pick a contention level and run. Optimistic never blocks but RETRIES on conflict; pessimistic never retries but SERIALIZES.'
            : contention === 'low'
              ? '✅ LOW contention → OPTIMISTIC wins: conflicts are rare, so you skip all locking overhead and run in parallel.'
              : '✅ HIGH contention → PESSIMISTIC wins: optimistic retries pile up (wasted work, near-livelock); locking once and serializing is cheaper.'}
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 2: the version-number update ============ */
const VERSION_STEPS = [
  { actor: 'T1', line: 'SELECT balance, version → {100, v5}', state: 'both at v5', note: 'Transaction 1 reads the row: balance 100, version 5. No lock is taken — that\'s the optimistic bet.' },
  { actor: 'T2', line: 'SELECT balance, version → {100, v5}', state: 'both at v5', note: 'Transaction 2 reads the SAME row, also version 5. Both now plan an update from the same starting point (a potential lost update).' },
  { actor: 'T1', line: "UPDATE SET balance=80, version=6 WHERE id=1 AND version=5  → 1 row", state: 'row is now v6', ok: true, note: 'T1 commits: "update ONLY IF version is still 5." It is → 1 row changed, version bumped to 6. T1 wins.' },
  { actor: 'T2', line: "UPDATE SET balance=70, version=6 WHERE id=1 AND version=5  → 0 rows", state: 'row is v6', fail: true, note: '💥 T2 commits the same way — but version is now 6, not 5, so the WHERE matches NOTHING: 0 rows changed. The lost update is DETECTED, not silently overwritten.' },
  { actor: 'T2', line: 'CONFLICT → re-read → {80, v6} → recompute → UPDATE WHERE version=6 → 1 row', state: 'row is v7', ok: true, note: '✅ T2 retries: re-read the fresh value (80, v6), recompute on top of T1\'s change, update WHERE version=6 → success. Both updates are now correctly applied.' },
]

function VersionUpdate() {
  const [step, setStep] = useState(0)
  const done = step >= VERSION_STEPS.length
  return (
    <div className="panel">
      <div className="ptitle">Live demo · the optimistic DB pattern — a version column turns a lost update into a detected conflict</div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
        {VERSION_STEPS.slice(0, step).map((s, i) => (
          <div key={i} style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11.5, padding: '3px 6px', borderRadius: 4, whiteSpace: 'pre-wrap',
            color: s.actor === 'T1' ? '#2D5BFF' : '#C75000',
            background: s.fail ? '#FDECEC' : s.ok ? '#EAF7EF' : 'transparent', fontWeight: s.ok || s.fail ? 700 : 400,
          }}>{s.actor}: {s.line}</div>
        ))}
      </div>
      {step > 0 && step <= VERSION_STEPS.length && <div className="statbar" style={{ display: 'block', marginBottom: 8, background: VERSION_STEPS[step - 1].fail ? '#FDECEC' : VERSION_STEPS[step - 1].ok ? '#EAF7EF' : undefined }}><span style={{ fontSize: 12.5 }}>{VERSION_STEPS[step - 1].note}</span></div>}
      <div style={{ display: 'flex', gap: 8 }}>
        {!done ? <button className="act" onClick={() => setStep((x) => x + 1)}>{step === 0 ? '▶ run two transactions' : 'next →'}</button>
               : <button className="ghost act" onClick={() => setStep(0)}>replay</button>}
      </div>
    </div>
  )
}

/* ============ Interactive 3: pick the strategy ============ */
const SCEN = [
  { q: 'Users edit their OWN profile rows; two people editing the same row almost never happens.', o: ['Optimistic (version column)', 'Pessimistic (row lock)', 'A lease'], a: 0,
    why: 'Conflicts are rare → optimistic: no locking overhead, and the version check catches the once-in-a-blue-moon clash, retrying it. Pessimistic locking here just adds cost for a conflict that almost never comes.' },
  { q: 'A flash sale: 50,000 buyers hammer the SAME inventory row in the same second.', o: ['Optimistic (CAS/version)', 'Pessimistic (row lock) / serialize', 'No locking'], a: 1,
    why: 'Extreme contention → optimistic thrashes: nearly every attempt conflicts and retries (wasted work, near-livelock). Lock the hot row (or funnel through a single writer/queue) so attempts serialize cleanly. (Or shard the inventory.)' },
  { q: 'A seat is reserved while the user spends up to 5 minutes entering payment details.', o: ['Hold a DB row lock the whole time', 'A LEASE: an atomic hold with a TTL (expires if unpaid)', 'Pure optimistic with no reservation'], a: 1,
    why: 'You can\'t hold a DB lock across user think-time (it would block others for minutes and tie up a connection). A lease = claim the seat atomically, mark it HELD with an expiry; pay → BOOKED, or the hold auto-expires. BookMyShow\'s exact design.' },
  { q: 'An in-memory counter incremented by many threads, millions of times.', o: ['Optimistic CAS (AtomicInteger / LongAdder)', 'A synchronized block per increment', 'A version column'], a: 0,
    why: 'A single in-memory variable → lock-free CAS (AtomicInteger), or LongAdder under very high contention. A lock per increment serializes everything; a version column is a DB technique, not for an in-memory counter.' },
  { q: 'A money transfer locks TWO accounts; you must avoid hanging forever.', o: ['Optimistic only', 'Pessimistic with a CONSISTENT lock order (or tryLock timeout)', 'Hold both locks indefinitely'], a: 1,
    why: 'Multiple locks → deadlock risk. Acquire them in a consistent global order (e.g. by account id — the sorted-acquire trick) so no cycle forms, or use tryLock with a timeout to back off. (Optimistic per-account CAS can work too, but the classic answer is ordered pessimistic locks.)' },
  { q: 'A config/catalog read constantly by many threads, written a few times a day.', o: ['Optimistic / copy-on-write (or ReadWriteLock)', 'A global lock on every read', 'Pessimistic row locks'], a: 0,
    why: 'Reads dominate → don\'t make readers wait. Hold an immutable snapshot and swap it on the rare write (copy-on-write), or use a ReadWriteLock (many readers, one writer). A global lock on every read kills throughput.' },
]

function StrategyChooser() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= SCEN.length
  const cur = SCEN[idx]
  function pick(i) { if (picked !== null) return; setPicked(i); if (i === cur.a) setScore((s) => s + 1) }
  return (
    <div className="panel">
      <div className="ptitle">Live demo · pick the locking strategy for each scenario before revealing</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎯 Score: <b>{score} / {SCEN.length}</b> — the axes: contention (low→optimistic, high→pessimistic), operation length (long/think-time→lease), and read/write mix (read-heavy→copy-on-write/RW-lock).</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 10 }}>⚖️ <span>scenario {idx + 1} of {SCEN.length} · score {score}</span></div>
          <p style={{ fontSize: 14.5, fontWeight: 600 }}>{cur.q}</p>
          <div className="modbtns">
            {cur.o.map((o, i) => (
              <button key={i} className={picked !== null && i === cur.a ? 'on' : ''}
                style={{ fontSize: 12.5, ...(picked === i && i !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}) }}
                onClick={() => pick(i)}>{o}</button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ ' : '❌ '} <b>{cur.o[cur.a]}</b><br /><br />{cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={() => { setPicked(null); setIdx((i) => i + 1) }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The core difference between optimistic and pessimistic locking?',
    o: ['Optimistic is faster, always', 'They differ in their ASSUMPTION: pessimistic assumes conflict is LIKELY → lock before touching and hold; optimistic assumes conflict is RARE → don\'t lock, do the work, and CHECK on commit that nothing changed (retry if it did)', 'Optimistic uses more memory', 'They are the same'], a: 1,
    e: 'It\'s a bet on contention. Pessimistic: lock first, serialize, no retries (but blocking + deadlock risk). Optimistic: no lock, work freely, validate at commit via version/CAS; conflict → retry (no blocking, but wasted retries under contention).',
    w: { 0: 'Only under LOW contention; high contention favors pessimistic.', 2: 'Memory isn\'t the distinction.', 3: 'Opposite assumptions.' },
    r: { id: 's1', label: 'Section 1 — two philosophies' } },
  { q: 'Pessimistic locking — what does it cost?',
    o: ['Nothing', 'Blocking (others WAIT while you hold the lock → lower concurrency) and DEADLOCK risk with multiple locks — and you must never hold it across slow I/O or user think-time', 'Lost updates', 'It can\'t prevent races'], a: 1,
    e: 'Lock-and-hold is simple and conflict-free, but it serializes contenders, can deadlock (multiple locks, wrong order), and a long-held lock throttles everyone. Great under high contention for SHORT critical sections.',
    w: { 0: 'It has real costs.', 2: 'It PREVENTS lost updates.', 3: 'It does prevent races — that\'s its job.' },
    r: { id: 's2', label: 'Section 2 — pessimistic' } },
  { q: 'The optimistic version-number technique works how?',
    o: ['It locks the row first', 'Each row has a version; you read it, then commit with UPDATE … SET …, version=version+1 WHERE id=? AND version=<read>. If 0 rows change, someone else updated it first → conflict → re-read and retry', 'It ignores conflicts', 'It uses a timestamp only'], a: 1,
    e: 'No lock is taken. The version in the WHERE clause is the optimistic check: a successful update means the row was untouched since you read it; 0 rows means a concurrent change → you retry on the fresh value. This DETECTS the lost update.',
    w: { 0: 'No lock — that\'s the point.', 2: 'It detects and handles them.', 3: 'A version counter (or a compatible timestamp) — the check is the WHERE clause.' },
    r: { id: 's3', label: 'Section 3 — optimistic' } },
  { q: 'Low contention vs high contention — which strategy?',
    o: ['Always pessimistic', 'LOW contention → optimistic (skip locking overhead, retries are rare); HIGH contention → pessimistic (optimistic retries pile up toward livelock; lock once and serialize)', 'Always optimistic', 'Contention does not matter'], a: 1,
    e: 'The deciding axis. Rare conflicts → optimistic is cheaper (no locks, parallel). Frequent conflicts → optimistic wastes CPU retrying the same work; a lock serializes cleanly. Match the strategy to the expected hot spot.',
    w: { 0: 'Pessimistic over-serializes when conflicts are rare.', 2: 'Optimistic thrashes under heavy contention.', 3: 'Contention is THE deciding factor.' },
    r: { id: 's7', label: 'Section 7 — choosing' } },
  { q: 'A seat must stay reserved while the user spends 5 minutes paying. The right mechanism?',
    o: ['Hold a DB row lock for 5 minutes', 'A LEASE — an atomic hold with a TTL: claim it optimistically, mark it HELD with an expiry; pay → BOOKED, or it auto-expires back to AVAILABLE', 'Pure optimistic, no reservation', 'A global lock'], a: 1,
    e: 'You cannot hold a transactional lock across user think-time (it blocks others for minutes and ties up resources). A lease reserves the resource and self-releases on timeout — exactly BookMyShow\'s HELD-with-expiry seat hold.',
    w: { 0: 'A 5-minute DB lock is a throughput disaster.', 2: 'No reservation means the seat can be taken mid-payment.', 3: 'A global lock serializes the whole system.' },
    r: { id: 's8', label: 'Section 8 — leases' } },
  { q: 'Optimistic locking can\'t deadlock (no locks held). What can it suffer instead?',
    o: ['Lost updates', 'LIVELOCK / starvation under high contention — threads keep colliding and retrying without making progress; cap retries (with backoff) and consider switching to pessimistic when conflicts are frequent', 'Deadlock', 'Nothing'], a: 1,
    e: 'No held locks means no deadlock, but heavy contention makes retries fail repeatedly — CPU spins, throughput collapses (livelock-ish). Bound the retries, add backoff, or fall back to a lock when the hot spot is real.',
    w: { 0: 'It PREVENTS lost updates.', 2: 'No locks held → no deadlock.', 3: 'Retries can starve under contention.' },
    r: { id: 's7', label: 'Section 7 — trade-offs' } },
  { q: 'CAS, a DB version column, and HTTP ETag/If-Match are…',
    o: ['Unrelated', 'The SAME optimistic idea at three layers: "apply only if the value is unchanged since I read it" — CAS in memory, version column in the DB, ETag/If-Match over HTTP', 'All pessimistic', 'All deadlock-prone'], a: 1,
    e: 'Optimistic concurrency is one pattern with many faces: compare-and-set (in-memory atomics), conditional UPDATE on a version (DB), and conditional requests via ETag/If-Match (HTTP). All say "commit only if nothing changed; else conflict → retry".',
    w: { 0: 'They\'re the same concept.', 2: 'All optimistic, not pessimistic.', 3: 'None holds locks, so none deadlocks.' },
    r: { id: 's3', label: 'Section 3 — optimistic everywhere' } },
  { q: 'Whichever strategy you pick, a retried operation must also be…',
    o: ['Faster', 'IDEMPOTENT — a retry (after an optimistic conflict, or a client re-send) must not double-apply; pair the atomic claim with an idempotency key, the recurring Month-3/4 lesson', 'Logged', 'Synchronous'], a: 1,
    e: 'Optimistic concurrency RETRIES by design, and clients retry on timeouts — so the operation must be safe to repeat. An idempotency key (or designing the op to be naturally idempotent) prevents double charges/bookings.',
    w: { 0: 'Speed is unrelated to correctness on retry.', 2: 'Logging doesn\'t make it safe.', 3: 'Sync/async is orthogonal.' },
    r: { id: 's10', label: 'Section 10 — traps' } },
]

/* ============ The page ============ */
export default function Day64() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 13 · Day 64 · Advanced LLD · Concurrency</div>
        <h1>Optimistic vs Pessimistic Locking:<br />Two Bets on Conflict</h1>
        <p>The atomic claim you\'ve flagged all course has two philosophies. PESSIMISTIC: assume conflict is
           likely — lock before you touch, hold while you work. OPTIMISTIC: assume conflict is rare — don\'t
           lock, do the work, and check on commit that nothing changed. Today: how each works, the version
           technique, leases, and exactly when to use which. Click everything.</p>
        <div className="chips">
          {['optimistic', 'pessimistic', 'version column', 'CAS', 'leases', 'contention', 'the decision matrix'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Two philosophies — a bet on conflict</h2>
        <p>Both prevent the lost-update / check-then-act race (Day 61). They differ in one assumption: how often
          two threads actually collide.</p>
        <Code html={`  THE SAME GOAL, OPPOSITE BETS

  PESSIMISTIC  "conflict is LIKELY → I'll LOCK first."
     acquire a lock → do the work → release. Others WAIT.
     ✓ no retries, simple, conflict-free   ✗ blocking, deadlock risk, lower concurrency
     tools: synchronized · ReentrantLock · SELECT ... FOR UPDATE (DB row lock)

  OPTIMISTIC   "conflict is RARE → I won't lock; I'll CHECK at the end."
     read a version → do the work → commit ONLY IF the version is unchanged;
     if it changed, RETRY on the fresh value.
     ✓ no blocking, high concurrency, no deadlock   ✗ wasted retries under contention
     tools: CAS atomics · DB version column · HTTP ETag/If-Match

  THE DECIDER: contention. Rare conflicts → optimistic. Frequent → pessimistic.`} />
        <Note><strong>This is Day 51\'s locking-strategies table, now deep.</strong> Every Month-3 "atomic claim"
          was really a choice between these two — and the "hold with expiry" seat reservation is a third option
          (a lease) for when the operation spans user think-time. By the end you\'ll pick correctly by
          contention, operation length, and read/write mix.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Pessimistic — lock and hold</h2>
        <p>The intuitive one: take exclusive access before touching the resource so nobody can interfere:</p>
        <Code html={`<span class="cm">// in memory:</span>
<span class="kw">synchronized</span> (seat) {            <span class="cm">// or lock.lock() … finally unlock()</span>
    <span class="kw">if</span> (seat.isAvailable()) seat.book();   <span class="cm">// no other thread can be in here</span>
}

<span class="cm">// in the database — a row lock held for the transaction:</span>
SELECT * FROM seats WHERE id = ? <span class="kw">FOR UPDATE</span>;   <span class="cm">// others block until commit/rollback</span>
UPDATE seats SET status = 'BOOKED' WHERE id = ?;
COMMIT;`} />
        <Warn><strong>Pessimistic\'s costs:</strong> contenders BLOCK (lower concurrency); multiple locks can
          DEADLOCK (fix with a consistent acquisition order or <C>tryLock</C> timeout); and a lock held too long
          throttles everyone — so <strong>never hold a lock across slow I/O or user think-time</strong>. It
          shines for SHORT critical sections under HIGH contention, where retrying optimistically would just
          thrash.</Warn>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Optimistic — read version, work, check on commit</h2>
        <p>Take no lock. Read the current value (and a version), do your work, and at commit time check that
          nobody changed it underneath you — if they did, retry:</p>
        <Code html={`<span class="cm">// in memory — compare-and-set (Day 62):</span>
status.compareAndSet(AVAILABLE, BOOKED);   <span class="cm">// set ONLY IF unchanged; true for exactly one racer</span>

<span class="cm">// in the database — a VERSION column (the classic pattern):</span>
<span class="cm">// 1) read:</span>   SELECT balance, version FROM accounts WHERE id = ?;   <span class="cm">// say version = 5</span>
<span class="cm">// 2) commit ONLY IF still version 5:</span>
UPDATE accounts SET balance = ?, version = <span class="num">6</span>
 WHERE id = ? AND version = <span class="num">5</span>;        <span class="cm">// rows affected = 1 → you won; 0 → someone else did</span>
<span class="cm">// 3) if 0 rows → CONFLICT → re-read the fresh value and retry</span>

<span class="cm">// same idea over HTTP:</span>  If-Match: "etag-v5"   <span class="cm">// 412 Precondition Failed if it changed</span>`} />
        <Good><strong>One pattern, three layers:</strong> CAS (in-memory), a version column (DB), and
          ETag/If-Match (HTTP) are all "apply only if unchanged since I read it." No lock is held, so there\'s no
          blocking and no deadlock — the price is a retry when the rare conflict happens. The version check is
          what turns a silent lost update into a detected, retryable conflict.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>⚔️ Play: optimistic vs pessimistic under contention</h2>
        <p>Run the same 12 concurrent updates under low and high contention — and watch which strategy wins flip:</p>
        <ContentionRace />
        <Good><strong>What you should notice:</strong> ① Under LOW contention optimistic barely retries and skips
          all locking — it wins. ② Under HIGH contention optimistic retries pile up (wasted work, toward
          livelock) while pessimistic just serializes once — it wins. ③ Neither is universally better;
          contention decides.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The version-number technique, step by step</h2>
        <p>The most common optimistic pattern in real systems. The version column is the optimistic check — it
          converts a lost update into a detected conflict:</p>
        <Code html={`  WITHOUT a version (lost update):        WITH a version (conflict detected):
  T1 read 100 ─┐                          T1 read {100, v5} ─┐
  T2 read 100 ─┤ both see 100             T2 read {100, v5} ─┤ both see v5
  T1 write 80  ┤                          T1 UPDATE … v6 WHERE v=5 → 1 row ✓
  T2 write 70  ┘ overwrites T1 → 70 💥    T2 UPDATE … v6 WHERE v=5 → 0 rows ✗ → retry
  (T1's change is LOST)                   T2 re-reads {80, v6}, recomputes → ✓ (both applied)`} />
        <Note><strong>Why it works:</strong> the version (or a content hash / compatible timestamp) in the
          <C> WHERE</C> clause means a successful update PROVES the row was untouched since you read it. Zero rows
          changed = someone committed first = you must re-read and re-apply on the fresh value. Frameworks
          automate this (JPA <C>@Version</C>).</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔢 Play: the version-number update</h2>
        <p>Two transactions, one row — step through how the version check catches T2\'s stale write and makes it
          retry:</p>
        <VersionUpdate />
        <Good><strong>What you should notice:</strong> ① Both read version 5 — a classic lost-update setup.
          ② T1\'s update succeeds and bumps the version to 6. ③ T2\'s update matches 0 rows (version is now 6, not
          5) → the conflict is DETECTED, and T2 retries on the fresh value. No lock was ever held.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Choosing: the decision matrix</h2>
        <table className="matrix">
          <thead><tr><th>situation</th><th>prefer</th><th>why</th></tr></thead>
          <tbody>
            <tr><td>LOW contention (conflicts rare)</td><td>Optimistic</td><td>no locking overhead, full parallelism, retries almost never fire</td></tr>
            <tr><td>HIGH contention (hot row)</td><td>Pessimistic</td><td>optimistic retries thrash (near-livelock); lock once and serialize</td></tr>
            <tr><td>SHORT critical section</td><td>either (often pessimistic)</td><td>a brief lock is cheap and conflict-free</td></tr>
            <tr><td>LONG op / user think-time</td><td>Lease (§8)</td><td>can\'t hold a lock for minutes; reserve with a TTL</td></tr>
            <tr><td>READS dominate</td><td>Optimistic / copy-on-write / ReadWriteLock</td><td>don\'t make readers wait on each other</td></tr>
            <tr><td>multiple resources at once</td><td>Pessimistic + consistent lock order</td><td>ordered locks prevent deadlock (the sorted-acquire trick)</td></tr>
          </tbody>
        </table>
        <Warn><strong>Optimistic has no deadlock (no locks held) but can LIVELOCK</strong> under heavy
          contention — endless retries with no progress. Always bound the retries (with backoff), and if the hot
          spot is real, switch to pessimistic or shard the resource. Pessimistic has no retries but blocks and
          can deadlock. Pick by the contention you actually expect.</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Leases — the third option (and the seat hold, explained)</h2>
        <p>Sometimes you must reserve a resource for LONGER than any lock should be held — across a multi-second
          payment, a multi-minute checkout. Holding a DB lock that long is a disaster. The answer is a
          <strong> lease</strong>: an atomic, time-bounded reservation:</p>
        <Code html={`  A LEASE = atomic claim + a TTL (neither a held lock nor pure optimistic)

  claim:   compareAndSet(AVAILABLE → HELD, heldUntil = now + 5min)   ← atomic, instant
  use:     the user takes their time paying — NO lock is held
  finish:  pay → HELD → BOOKED                                       (commit the claim)
  expire:  a sweeper / TTL releases HELD → AVAILABLE if unpaid       (auto-rollback)

  This is BookMyShow's seat hold (Day 51-52) EXACTLY — and Redis SET key val NX EX
  is a lease in one command (set-if-absent + expiry). It gives reservation semantics
  without blocking others or pinning a transaction/connection for minutes.`} />
        <Good><strong>The loop closes:</strong> the "hold with expiry" you designed for seats, parking, and ride
          dispatch is a LEASE — an atomic optimistic claim plus a TTL that self-releases. It\'s how you get
          "reserve while I think" without the throughput catastrophe of a long-held lock. Redis\'s <C>SET NX EX</C>
          implements it natively; a DB version + an <C>expires_at</C> column does it relationally.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>⚖️ Play: pick the strategy</h2>
        <p>Six scenarios — choose optimistic, pessimistic, or a lease before revealing:</p>
        <StrategyChooser />
        <Good><strong>What you should notice:</strong> ① Rare conflicts → optimistic; a hot contended row →
          pessimistic. ② Anything spanning user think-time → a lease, never a held lock. ③ Read-heavy → don\'t
          make readers wait (copy-on-write / RW-lock). The same three axes decide every time: contention,
          operation length, read/write mix.</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>Optimistic on a hot row.</strong> Heavy contention → constant conflicts → retry storm
          (livelock), worse than a lock. Use pessimistic (or shard) when conflicts are frequent.</Warn>
        <Warn><strong>Holding a lock across I/O or user think-time.</strong> A network call or a 5-minute
          checkout under a lock throttles everyone (and ties up a DB connection). Use a lease, or do slow work
          outside the lock.</Warn>
        <Warn><strong>Optimistic retries with no limit / no backoff.</strong> Unbounded retries can spin
          forever under contention. Cap them, add backoff, and surface a clear error on giving up.</Warn>
        <Warn><strong>Forgetting idempotency.</strong> Both strategies RETRY (and clients re-send) — the
          operation must be safe to repeat. Pair it with an idempotency key, or no-op on a duplicate.</Warn>
        <Warn><strong>Pessimistic multi-lock without an order.</strong> Two locks acquired in opposite orders
          deadlock. Acquire in a consistent global order (by id), or use <C>tryLock</C> with a timeout.</Warn>
        <Warn><strong>"Optimistic" without the version check.</strong> Reading then writing with no
          compare/version is just the lost-update bug. The CHECK on commit is the whole point.</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Pessimistic:</strong> assume conflict likely → lock first, hold, others wait. No retries; blocking + deadlock risk. Tools: synchronized, Lock, <C>SELECT … FOR UPDATE</C>.</li>
          <li><strong>Optimistic:</strong> assume conflict rare → no lock; read a version, work, commit ONLY IF unchanged, retry on conflict. No blocking/deadlock; retries under contention. Tools: CAS, DB version column, ETag/If-Match.</li>
          <li><strong>Version technique:</strong> <C>UPDATE … SET …, version=version+1 WHERE id=? AND version=?</C>; 0 rows = conflict → re-read &amp; retry. (JPA <C>@Version</C>.)</li>
          <li><strong>Decide by:</strong> contention (low→optimistic, high→pessimistic), operation length (long/think-time→lease), read/write mix (read-heavy→copy-on-write/RW-lock).</li>
          <li><strong>Lease:</strong> atomic claim + TTL — reserve across think-time without a held lock (the seat hold; Redis <C>SET NX EX</C>).</li>
          <li><strong>Failure modes:</strong> optimistic → livelock (cap retries + backoff); pessimistic → deadlock (consistent lock order / tryLock).</li>
          <li><strong>Always:</strong> make retried operations idempotent (idempotency key).</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Which would you use for an e-commerce inventory decrement, and does it depend?"'>
          <p>It depends on the item\'s heat. A normal SKU with light, sprinkled demand → OPTIMISTIC: a version
            column (or conditional <C>UPDATE stock = stock - 1 WHERE id=? AND stock &gt;= 1</C>), retry on
            conflict — cheap and parallel. A flash-sale / limited-drop SKU where thousands hit the same row in
            one second → that\'s a hot row; optimistic thrashes, so PESSIMISTIC (row lock or serialize through a
            single writer/queue), or better SHARD the inventory into buckets to reduce contention. The senior
            answer names the contention as the deciding factor and offers sharding for the extreme case.</p>
        </Reveal>
        <Reveal summary='Q: "Optimistic locking has no locks — so why is it called locking?"'>
          <p>It\'s a misnomer of tradition. There\'s no mutual exclusion and nothing blocks; "optimistic
            concurrency CONTROL" is the better name. The "lock" is logical: you detect, at commit, whether
            anyone else modified the data since you read it (via a version/CAS) and reject if so. So it CONTROLS
            concurrent access (preventing lost updates) without ever acquiring a real lock — which is exactly why
            it can\'t deadlock but can livelock. Calling out the naming shows you understand the mechanism, not
            just the label.</p>
        </Reveal>
        <Reveal summary='Q: "How is a database transaction isolation level related to this?"'>
          <p>Isolation levels are the DB\'s built-in concurrency control. Lower levels (READ COMMITTED) allow
            lost updates unless you add your own version check or <C>FOR UPDATE</C>. SERIALIZABLE is effectively
            strong pessimistic/optimistic control by the engine — it either locks (2-phase locking) or uses
            optimistic SSI (serializable snapshot isolation) and aborts conflicting transactions for you (which
            you then RETRY, exactly like optimistic locking). So "use SERIALIZABLE" and "add a version column"
            are two ways to get the same guarantee; the version column gives you finer control and works across
            read-modify-write spanning requests. Knowing that isolation levels and app-level locking are the
            same battle at different layers is the depth signal.</p>
        </Reveal>
        <Reveal summary='Q: "Can you combine optimistic and pessimistic?"'>
          <p>Yes, commonly. Use optimistic as the default (cheap, parallel) and FALL BACK to pessimistic for a
            known hot spot, or after N optimistic retries fail (the contention is clearly real → take a lock).
            The LEASE itself is a hybrid: an atomic optimistic claim that then grants exclusive-ish use for a
            bounded time. Another combo: optimistic across the read-think phase, then a short pessimistic lock
            for the final commit. The point is they\'re tools on a spectrum, not a binary — pick per access
            pattern, and you can mix them in one system.</p>
        </Reveal>
        <Reveal summary='Q: "The ABA problem — what is it and when does it bite CAS?"'>
          <p>CAS checks "is the value still X?" — but a value can go X → Y → X between your read and your CAS, so
            the CAS SUCCEEDS even though the world changed and came back. For a simple counter that\'s harmless;
            for pointers/stacks (e.g. a lock-free stack reusing freed nodes) it can corrupt structure. The fix
            is to make each change unique: a VERSION/stamp alongside the value (<C>AtomicStampedReference</C>),
            so X-with-stamp-5 ≠ X-with-stamp-7. This is exactly why DB optimistic locking uses an
            ever-incrementing version rather than comparing the value itself — it sidesteps ABA by construction.</p>
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
        <strong>Day 64 complete?</strong> Homework: implement both for one resource — an account balance. ①
        OPTIMISTIC: a <C>version</C> field; read it, compute, and "commit" with a CAS/version check, retrying on
        conflict (cap retries + backoff); prove two racing updates both apply correctly. ② PESSIMISTIC: a
        <C> synchronized</C>/<C>ReentrantLock</C> version; compare the code and reason about which you\'d ship for
        a rarely-contended account vs a hot one. ③ Turn your BookMyShow seat hold into an explicit LEASE
        (atomic claim + <C>expiresAt</C> + a sweeper) and articulate why it isn\'t a held lock.
        <br /><br />
        Next: <strong>Day 65 — Rate Limiter</strong>: the canonical concurrency design problem — token bucket
        vs sliding window, made thread-safe with everything from this week.
      </div>
    </div>
  )
}
