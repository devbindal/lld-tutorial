import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../components/ui.jsx'

function ReviewDrill({ items }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= items.length
  const cur = items[idx]
  function pick(i) { if (picked !== null) return; setPicked(i); if (i === cur.a) setScore((s) => s + 1) }
  return (
    <div className="panel">
      <div className="ptitle">Rapid review · recall the answer before you reveal it</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎯 Score: <b>{score} / {items.length}</b>. Anything you missed → reopen that day.</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Review again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 10 }}>🔁 <span>question {idx + 1} of {items.length} · score {score}</span></div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.q}</p>
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

const DRILL = [
  { q: 'LRU cache: what makes BOTH get and put O(1)?', o: ['A HashMap alone', 'A HashMap (O(1) lookup) + a doubly-linked list (O(1) reorder/evict), sharing nodes', 'A sorted ArrayList'], a: 1,
    why: 'A map has no recency order; a list has no O(1) lookup. Together — map values are pointers into a DLL — both operations are O(1). Sentinel head/tail kill edge cases; a get HIT must moveToFront (a read is a use).' },
  { q: '"Now make the cache LFU instead of LRU." The clean design anticipated this with…', o: ['An if(isLFU) everywhere', 'An EvictionPolicy interface (LRU/LFU/FIFO as classes) — the cache logic stays the same', 'A rewrite'], a: 1,
    why: 'Eviction is the varying part (same data, different victim). Behind one EvictionPolicy interface, swapping LRU→LFU is a new class + one wiring line. (True O(1) LFU needs frequency buckets + a minFreq pointer.)' },
  { q: 'Notification system: email/SMS/push should be sent through…', o: ['A switch on channel type', 'One NotificationChannel interface, one class per channel (Strategy)', 'Three send methods'], a: 1,
    why: 'Channels are interchangeable senders. The service loops over a user\'s channels and calls send(); adding WhatsApp is a new class. The five axes — channel, template, preference, provider, reliability — stay separate.' },
  { q: 'Reliable delivery (notification / webhook) needs…', o: ['A bigger timeout', 'Async (don\'t block the caller) + retry with exponential backoff + provider failover + a dead-letter queue + idempotency', 'Synchronous sends'], a: 1,
    why: 'External sends fail transiently. Enqueue and let workers deliver with backoff retries; fail over to a secondary; park exhausted messages in a dead-letter queue; an idempotency key stops retries from duplicating (at-least-once ⇒ consumers dedup).' },
  { q: 'Cab booking: a driver 2 km away in heavy traffic vs one 4 km away on a clear road — pick…', o: ['The 2 km driver (nearest)', 'The lowest ETA (the 4 km driver arrives sooner) — via a swappable MatchingStrategy', 'Random'], a: 1,
    why: 'Distance lies when traffic differs. A traffic-aware LowestEta MatchingStrategy beats nearest-by-distance, and both live behind one interface so the controller never changes (the elevator\'s scheduling lesson, reused).' },
  { q: 'Cab fare with surge is structured as…', o: ['if(surge) inside the calculator', 'A SurgePricing wrapper around the base FareStrategy: base.price(trip) × surgeFactor (Decorator)', 'A Trip subclass'], a: 1,
    why: 'Surge is a demand/supply multiplier, orthogonal to base rates — wrap the base strategy (like parking\'s EV surcharge). Fare is computed at trip END (distance + duration), as Money, behind a FareStrategy.' },
]

const QUESTIONS = [
  { q: 'Week 12 mixes a data-structure problem with two systems. The throughline?',
    o: ['Unrelated topics', 'Pick the right STRUCTURE for the complexity (LRU), keep varying concerns behind STRATEGIES/ports (Notification, Cab), and add a RELIABILITY layer for external I/O — the everyday engineering toolkit', 'Databases', 'Only caching'], a: 1,
    e: 'LRU teaches "complexity dictates the structure"; Notification teaches "keep the axes pluggable + deliver reliably"; Cab is the capstone using matching, state machines, atomic claims, and strategies together.',
    w: { 0: 'A clear engineering throughline.', 2: 'In-memory/system design, not storage.', 3: 'Caching is one of three.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'LRU: the two correctness rules beyond "use a HashMap + DLL"?',
    o: ['None', 'Use recursion', '(1) a get HIT must moveToFront (a read is a use); (2) every structural change updates BOTH structures (insert → map.put + addFront; evict → remove + map.remove)', 'Sort on every access'], a: 2,
    e: 'Skip the promotion and recently-read keys get evicted wrongly. Let map and list drift and you get leaks + phantom hits. The Node also stores its KEY so eviction can delete the map entry. Sentinels remove null edge cases.',
    w: { 0: 'Two real rules.', 1: 'It\'s pointer rewiring, not recursion.', 3: 'No sorting — order is maintained by every op.' },
    r: { id: 's2', label: 'Section 2 — LRU' } },
  { q: 'Notification: the five axes that must vary independently?',
    o: ['Just "send"', 'Sender + receiver', 'Channel + message', 'CHANNEL (Strategy) · TEMPLATE (per type+channel) · PREFERENCE (per user) · PROVIDER (Adapter+failover) · RELIABILITY (async/retry/DLQ/idempotency) — keep them apart or every change touches everything'], a: 3,
    e: 'The whole design is "keep the five axes apart". A new channel, format, vendor, opt-out rule, or backoff tweak each lands in its own seam. The event is fired channel-agnostic (Observer decoupling); preferences + templates decide the rest.',
    w: { 0: 'Five distinct concerns.', 1: 'Too coarse.', 2: 'Too coarse.' },
    r: { id: 's2', label: 'Section 2 — Notification' } },
  { q: 'Notification/webhook: log.debug or a send that constructs its payload eagerly, plus at-least-once delivery, imply…',
    o: ['Drop failures silently', 'Defer eager work (parameterized logging) AND expect DUPLICATES under retries — at-least-once means consumers must dedup via an event/idempotency id; exactly-once is dedup at the edge', 'Use synchronous sends', 'Nothing special'], a: 1,
    e: 'Eager argument construction wastes work when filtered out; and any retrying delivery is at-least-once, so duplicates happen — the contract carries an id for consumer dedup. Never silently drop: retry → dead-letter.',
    w: { 0: 'Failures go to a DLQ, not /dev/null.', 2: 'Sync blocks the caller.', 3: 'Two real lessons.' },
    r: { id: 's2', label: 'Section 2 — Notification' } },
  { q: 'Cab booking: the matching problem (nearest available driver) at city scale needs…',
    o: ['A SPATIAL INDEX (grid/geohash/quadtree) so a query examines only nearby cells (~O(1) for the nearby set), with O(1) re-bucket on move — a linear scan is O(N) per request and melts', 'A scan of all drivers', 'A database ORDER BY', 'Nothing'], a: 0,
    e: 'Scanning every driver per request dies at hundreds of thousands of drivers. Bucketing by location restricts the search to the rider\'s cell + neighbors. Cell size is the tuning trade; geohash/quadtree adapt to density.',
    w: { 1: 'O(N) per request is the trap.', 2: 'Needs a spatial index/extension to avoid a full scan.', 3: 'Scale demands a structure.' },
    r: { id: 's2', label: 'Section 2 — Cab Booking' } },
  { q: 'Cab booking: two riders match the same nearest driver at once. The fix (and where you\'ve seen it)?',
    o: ['An ATOMIC claim — compareAndSet(driver, AVAILABLE, ON_TRIP) — exactly one wins; the loser re-matches. It\'s the SAME check-then-act race as parking/BookMyShow/ATM (Day 21)', 'The driver chooses', 'First packet wins', 'Both get the driver'], a: 0,
    e: 'A driver is a shared resource two riders claim. Without atomicity both assign → one driver, two trips. The recurring Month-3 race; the recurring fix is one indivisible compare-and-set.',
    w: { 1: 'Accept/decline is a separate step; the SYSTEM claims atomically.', 2: 'Relying on timing is the unguarded race.', 3: 'One driver can\'t serve two trips.' },
    r: { id: 's2', label: 'Section 2 — Cab Booking' } },
  { q: 'Cab booking is called the capstone because…',
    o: ['It needs the most code', 'It is the hardest to type', 'It uses a new pattern', 'It is every Month-3 SHAPE at once: resource+atomic-claim (driver), scheduling/dispatch (Strategy), state machines (trip+driver), money/pricing (fare+surge), ratings (running aggregate), real-time (spatial index + Observer)'], a: 3,
    e: 'Ride-hailing decomposes into shapes you already own — which is the Month-3 meta-skill. Recognizing "this is BookMyShow\'s claim + the elevator\'s dispatch + vending\'s state machine + parking\'s pricing" is the whole point.',
    w: { 0: 'Not about LOC.', 1: 'Not about typing volume.', 2: 'It reuses known patterns.' },
    r: { id: 's2', label: 'Section 2 — Cab Booking' } },
  { q: 'Java ships an LRU primitive. Which, with what caveat?',
    o: ['ArrayList', 'TreeMap', 'LinkedHashMap with accessOrder=true (+ override removeEldestEntry) = LRU out of the box — but it is NOT thread-safe, so concurrent use needs synchronization', 'HashMap'], a: 2,
    e: 'LinkedHashMap(cap, 0.75f, true) maintains access order and auto-evicts the eldest. Knowing the built-in AND that it needs external synchronization shows real Java fluency.',
    w: { 0: 'ArrayList has no O(1) lookup.', 1: 'TreeMap sorts by key, not access.', 3: 'Plain HashMap has no ordering.' },
    r: { id: 's2', label: 'Section 2 — LRU' } },
]

export default function RecapW12() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 3 · Week 12 · Data Structures &amp; + buffer</div>
        <h1>Week 12 Recap:<br />Data Structures, Frameworks &amp; the Capstone</h1>
        <p>Days 56–60 in one place: the LRU Cache (a data structure for a complexity target), the Notification
           System (a pluggable, reliable framework), and Cab Booking (the capstone that uses every Month-3
           shape). Cheat-sheet, rapid review, recap quiz — and the close of Month 3.</p>
        <div className="chips">
          {['LRU Cache', 'Notification System', 'Cab Booking', 'spatial index', 'reliability', 'the seven shapes'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  WEEK 12 — the everyday engineering toolkit, then the capstone

  LRU Cache       complexity dictates the STRUCTURE: HashMap + doubly-      Day 56
                  linked list = O(1) get/put; eviction = a Strategy
  Notification    keep FIVE axes apart (channel/template/preference/         Day 57
                  provider/reliability); Strategy + Adapter + async retry
  Cab Booking     the CAPSTONE — matching (spatial index) + two state        Days 58-59
                  machines + atomic claim + fare/surge/dispatch strategies
  Drill           DS → state the complexity; system → axes + reliability     Day 60

  Month 3 closes here. The meta-skill: recognize the SHAPE in minute one.`} />
        <Note><strong>Why this matters:</strong> LRU is "pick the right structure"; Notification is "keep it
          pluggable and deliver reliably"; Cab Booking proves the whole month — it\'s every shape at once and
          decomposes into patterns you already own.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Problem-by-problem cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>LRU Cache (Day 56)</h3>
        <ul>
          <li><strong>The constraint:</strong> O(1) get AND put — it rules out plain lists/arrays and a map alone.</li>
          <li><strong>The combo:</strong> <C>HashMap&lt;K,Node&gt;</C> (O(1) lookup) + a doubly-linked list ordered by recency (O(1) reorder/evict), sharing nodes; dummy head/tail sentinels remove edge cases.</li>
          <li><strong>Two rules:</strong> a get HIT must <C>moveToFront</C> (a read is a use); every structural change updates BOTH structures (Node stores its key so eviction can delete the map entry).</li>
          <li><strong>Eviction = Strategy</strong> (LRU/LFU/FIFO). Built-in: <C>LinkedHashMap(accessOrder=true)</C> + removeEldestEntry, but NOT thread-safe.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Notification System (Day 57)</h3>
        <ul>
          <li><strong>Five axes, kept apart:</strong> channel (Strategy) · template (per type+channel) · preference (per user) · provider (Adapter + failover) · reliability.</li>
          <li><strong>Producer decoupling</strong> (Observer): the event fires channel-agnostic; preferences + templates decide channels and wording.</li>
          <li><strong>Preferences</strong> resolve <C>channelsFor(user, type, now)</C> — opt-outs, quiet hours, critical bypass, priority (OTP &gt; marketing).</li>
          <li><strong>Reliability:</strong> async queue + workers, retry with exponential backoff, provider failover, dead-letter queue, idempotency. Eager-argument trap → parameterized logging.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Cab Booking (Days 58–59)</h3>
        <ul>
          <li><strong>Matching:</strong> a SPATIAL INDEX (grid/geohash/quadtree) restricts the search to nearby cells (a linear scan is O(N) and melts); re-bucket on move.</li>
          <li><strong>Two coupled state machines:</strong> Driver (AVAILABLE/ON_TRIP/OFFLINE) + Trip (REQUESTED→ASSIGNED→ARRIVED→IN_PROGRESS→COMPLETED/CANCELLED), guarded; ending a trip frees the driver.</li>
          <li><strong>The race:</strong> two riders, one driver → atomic compare-and-set claim; loser re-matches. Location pings → re-index + Observer push.</li>
          <li><strong>Money &amp; brains (Strategy):</strong> FareStrategy (exit-time base+distance+time), SurgePricing wrapper (Decorator), MatchingStrategy (ETA, not distance); two-sided ratings (running average); payment port + idempotency; pooling = a matching + fare-split variation.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>The Drill (Day 60)</h3>
        <ul>
          <li><strong>DS tell:</strong> the complexity target dictates the structure — state it first.</li>
          <li><strong>System tell:</strong> pluggable concerns → Strategy/ports; external I/O → async + retry + dead-letter + idempotency.</li>
          <li><strong>At-least-once ⇒ duplicates;</strong> consumers dedup via an event/idempotency id. Test the hard part with fakes + a fixed clock.</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 Month 3 — the seven shapes (capstone recap)</h2>
        <table className="matrix">
          <thead><tr><th>shape</th><th>defining problem</th><th>problems</th></tr></thead>
          <tbody>
            <tr><td>resource + reservation + atomic claim</td><td>"two users, one X"</td><td>Parking · BookMyShow · hotel · (cab driver)</td></tr>
            <tr><td>scheduling / dispatch (Strategy)</td><td>"which one next?"</td><td>Elevator · Cab Booking</td></tr>
            <tr><td>state machine</td><td>"same input, different meaning per state"</td><td>Vending · ATM · trip lifecycle</td></tr>
            <tr><td>money ledger</td><td>"balances reconcile, pennies conserved"</td><td>Splitwise · wallet</td></tr>
            <tr><td>pipeline / pluggable framework</td><td>"route/deliver through stages or sinks"</td><td>Logging · Notification · webhooks</td></tr>
            <tr><td>turn-based game loop</td><td>"who moves, apply rules, check end"</td><td>Tic-Tac-Toe · Snake &amp; Ladder</td></tr>
            <tr><td>data structure for a complexity target</td><td>"O(1) / top-K"</td><td>LRU Cache · TTL cache</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>Complexity dictates the structure</strong> (O(1) both → HashMap + DLL).</li>
          <li><strong>A read is a use; sync both structures.</strong></li>
          <li><strong>Notification = five axes kept apart; eviction/channel = Strategy.</strong></li>
          <li><strong>Reliable delivery = async + retry/backoff + dead-letter + idempotency.</strong></li>
          <li><strong>At-least-once ⇒ consumers dedup</strong> (exactly-once is dedup at the edge).</li>
          <li><strong>Matching needs a spatial index;</strong> dispatch optimizes ETA, not distance.</li>
          <li><strong>Cab = every shape at once</strong> — decompose, don\'t panic.</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps to never repeat</h2>
        <Warn><strong>Singly-linked list / get not promoting (LRU).</strong> Need prev for O(1) removal; a read is a use. And sync map + list on every change.</Warn>
        <Warn><strong>switch on channel type / event knows the channel.</strong> Channels = Strategy; the event fires channel-agnostic.</Warn>
        <Warn><strong>Synchronous send on the request path.</strong> Blocks the caller on third-party I/O — enqueue and deliver async.</Warn>
        <Warn><strong>Retries without idempotency.</strong> Duplicate sends/charges. At-least-once ⇒ a stable id for dedup.</Warn>
        <Warn><strong>Scanning all drivers / nearest-by-distance.</strong> O(N) melts; distance ignores traffic. Spatial index + ETA MatchingStrategy.</Warn>
        <Warn><strong>Fare at request time / surge as an if / double for money.</strong> Fare is exit-time behind a strategy; surge wraps it; money is Money.</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Recall the answer before revealing:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across the week.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 12 revised?</strong> That completes <strong>Month 3 — the classic LLD problems</strong>, and
        the revision layer now covers Weeks 1–12. You can pick the right data structure, build a pluggable
        reliable framework, and decompose a big system into known shapes. Month 4 turns the concurrency you\'ve
        been flagging all along into the main event.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next month: <strong>Month 4 — Advanced LLD</strong> (concurrency, advanced problems, mocks).
      </div>
    </div>
  )
}
