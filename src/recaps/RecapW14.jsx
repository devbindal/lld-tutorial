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
  { q: 'Movement in Chess?',
    o: ['A switch on piece type', 'Polymorphism: piece.legalMoves(board, from) — no type switch', 'A utility class with static methods'],
    a: 1, why: 'Each piece class overrides legalMoves(). Adding a new piece = adding one class, not editing a switch. OCP + Information Expert.' },
  { q: 'When is the agent assigned in Food Delivery?',
    o: ['At PLACED', 'After CONFIRMED — not at PLACED; the restaurant might reject', 'At DELIVERED'],
    a: 1, why: 'PLACED → CONFIRMED is the restaurant accepting. Only after CONFIRMED does assigning an agent make sense; before that, the order may be cancelled.' },
  { q: 'Match agent to customer or restaurant?',
    o: ['Customer — shorter last mile', 'Restaurant — agent picks up food there first', 'Whichever is closer to the agent'],
    a: 1, why: 'The delivery sequence is: agent → restaurant → customer. Nearest to the restaurant minimises pickup time; matching to the customer ignores the entire pickup leg.' },
  { q: 'What commit order prevents message loss?',
    o: ['commitOffset() → process(event)', 'process(event) → commitOffset() (at-least-once)', 'Either order is fine'],
    a: 1, why: 'Commit before process = at-most-once (data loss on crash). Process before commit = at-least-once (may replay, but nothing lost). Consumers must be idempotent.' },
  { q: 'Greedy locker slot rule?',
    o: ['Largest slot that fits', 'Smallest slot that fits — wastes least space, leaves large slots for large packages', 'First available slot'],
    a: 1, why: 'Greedy smallest-fitting: filter where size.fits(pkg), sort by rank ASC, take first. Preserves large slots for future large packages.' },
  { q: 'Price on OrderItem — live reference or snapshot?',
    o: ['Live reference to MenuItem', 'Snapshot: capture unitPrice: Money at order creation time', 'Computed from the restaurant at display time'],
    a: 1, why: 'An OrderItem must be immutable in its financial meaning. The price the customer agreed to pay cannot change retroactively if the restaurant updates the menu.' },
  { q: 'Consumer group guarantee?',
    o: ['Every consumer receives every message', 'One message delivered to exactly ONE consumer in the group (load balance)', 'Messages are replayed per group member'],
    a: 1, why: 'Consumer groups partition messages: 3 consumers share 1/3 each. Multiple independent groups each get all messages — but within a group, each message goes to exactly one member.' },
  { q: 'CAS prevents what?',
    o: ['Starvation', 'Two concurrent claims on the same slot/agent (check-then-act race)', 'Deadlock'],
    a: 1, why: 'compareAndSet collapses check-then-act into one atomic step. One racer wins; the other sees false and must retry. Same pattern in locker, food delivery, Pub-Sub group offsets.' },
]

const QUESTIONS = [
  { q: 'Chess: adding a new piece type (Amazon piece — moves like Queen + Knight) requires…',
    o: ['Editing the switch in Game.java and Board.java', 'Adding ONE file (Amazon.java extends Piece, overrides legalMoves) + one wiring line — zero other edits', 'A new enum constant and a new case in all switches', 'Extending the Board class'],
    a: 1,
    e: 'Polymorphism + OCP: the validation pipeline calls piece.legalMoves() without knowing the type. New piece = new class, nothing else touched. This is the exact promise polymorphism makes.',
    w: { 0: 'There is no switch — that was the smell replaced by polymorphism.', 2: 'Enum is for state/constants; piece movement lives in each piece class.', 3: 'Board knows about squares, not piece types.' },
    r: { id: 's1', label: 'Section 1 — the week arc' } },
  { q: 'In Food Delivery, the delivery agent is matched to…',
    o: ['The customer\'s address (shortest final delivery)', 'The RESTAURANT\'s location — the agent must pick up food there first; nearest to the restaurant minimises pickup time', 'The midpoint between restaurant and customer', 'Whichever address the routing algorithm prefers'],
    a: 1,
    e: 'The trip sequence is agent → restaurant → customer. Optimising for restaurant proximity minimises pickup wait (a key driver of delivery speed). Matching to the customer ignores the pickup leg entirely.',
    w: { 0: 'Shorter last-mile doesn\'t help if the agent arrives at the restaurant late.', 2: 'Midpoint is an arbitrary heuristic not used in practice.', 3: 'The domain logic constrains the choice: pickup first, then deliver.' },
    r: { id: 's2', label: 'Section 2 — Day 67' } },
  { q: 'Amazon Locker: two couriers submit packages simultaneously. The same slot passes both filters. What prevents double-assignment?',
    o: ['A synchronized method on LockerService', 'CAS: compareAndSet(AVAILABLE, OCCUPIED) — exactly one wins atomically, the loser gets false and re-searches', 'The slot is marked PENDING first by the filter', 'A database unique constraint'],
    a: 1,
    e: 'CAS collapses the find + claim into one atomic step. One thread wins; the other sees the CAS fail and must try the next slot. The same atomic-claim primitive appears in chess move application, food delivery agent assignment, and Pub-Sub group offsets.',
    w: { 0: 'A synchronized method works but CAS is the lightweight lock-free version — both are correct.', 2: 'The filter doesn\'t mark slots — it only reads state, so a race remains.', 3: 'A DB constraint is correct at the persistence layer but doesn\'t prevent the race in memory.' },
    r: { id: 's2', label: 'Section 2 — Day 68' } },
  { q: 'A Pub-Sub consumer commits the offset, then calls process(event). The process() call throws. What breaks?',
    o: ['Nothing — the offset is saved so the consumer can resume', 'At-most-once (data loss) — the offset says "done" but the event was never handled; restarting skips it forever', 'The dead-letter queue catches the exception', 'The consumer retries from the committed offset, re-processing correctly'],
    a: 1,
    e: 'Commit before process = mark done before doing the work. On crash, the consumer restarts AFTER that offset and the event is gone. Dead-letter catches exceptions inside process(), not events that were never attempted.',
    w: { 0: 'The event was not processed — silence is the problem, not recovery.', 2: 'DLQ only catches events that entered process() and threw; here process() was never called.', 3: 'Restarting from the committed offset means restarting AFTER the lost event.' },
    r: { id: 's2', label: 'Section 2 — Day 69' } },
  { q: 'An OrderItem stores a reference to MenuItem and computes lineTotal() = menuItem.price() * qty. The problem?',
    o: ['lineTotal() should be static', 'Price not snapshotted — if the menu price changes later, every existing order\'s total changes retroactively; capture unitPrice: Money at order creation', 'qty should be a Money type', 'The reference should be an interface'],
    a: 1,
    e: 'An OrderItem represents a commitment made at a point in time. The price the customer agreed to pay is immutable from that moment. Store unitPrice as a Money field in the constructor — this is the Value Object / price-snapshot pattern.',
    w: { 0: 'A static lineTotal() couldn\'t access instance data.', 2: 'qty is a count; Money is for prices.', 3: 'Using an interface changes the coupling but not the snapshot problem.' },
    r: { id: 's2', label: 'Section 2 — Day 67' } },
  { q: 'The 4-stage Chess validation pipeline is: geometry → path → destination → ???',
    o: ['capture rules', 'king safety (simulate move on a copy of the board; if the king is in check after, the move is illegal)', 'piece count', 'turn order'],
    a: 1,
    e: 'Stage 4 catches pinned pieces: a move is geometrically and path-clear, but it exposes the king. To test: apply the move on a copy of the board, call isInCheck(player) on the copy. Only if the king is safe is the move legal.',
    w: { 0: 'Capture rules are covered in stages 1–3 (destination = opponent\'s piece or empty).', 2: 'Piece count is not part of move validation.', 3: 'Turn order is enforced by the game loop before validation.' },
    r: { id: 's2', label: 'Section 2 — Day 66' } },
  { q: 'Consumer group: 3 instances of the OrderService subscribe to the "orders" channel in the same group. Message M arrives. How many instances process M?',
    o: ['All 3 — each gets a copy', 'Exactly 1 — the group routes M to one instance (load balancing); the others skip it', '0 until one instance polls', '2 — majority delivery'],
    a: 1,
    e: 'Consumer group = load balancing. One message per group, delivered to one member. If you want all 3 to process every message, they must be in 3 different groups (or subscribe independently). This is the fundamental consumer-group guarantee.',
    w: { 0: 'That is broadcast (multiple independent subscribers or consumer groups).', 2: 'The message is delivered; one consumer picks it up on poll.', 3: '2-of-3 is not how consumer groups work — it\'s 1-of-N.' },
    r: { id: 's2', label: 'Section 2 — Day 69' } },
  { q: 'Greedy smallest-fitting locker slot. The enum sizes are SMALL, MEDIUM, LARGE. The correct ordering field is…',
    o: ['ordinal() (SMALL=0, MEDIUM=1, LARGE=2)', 'An explicit int rank field (SMALL=1, MEDIUM=2, LARGE=3) — stable and explicit, immune to enum reordering', 'name().compareTo() alphabetically', 'A static comparator outside the enum'],
    a: 1,
    e: 'ordinal() breaks if enum constants are reordered or inserted. Alphabetical ordering gives LARGE=1, MEDIUM=2, SMALL=3 — the reverse of size. An explicit rank field makes the ordering part of the enum\'s contract and survives refactoring.',
    w: { 0: 'ordinal() breaks on reordering — the Day 19 ordinal trap.', 2: 'Alphabetical gives L < M < S, reversed from smallest-to-largest.', 3: 'A static comparator is better than ordinal/alpha but still external; the rank field is self-contained.' },
    r: { id: 's2', label: 'Section 2 — Day 68' } },
]

export default function RecapW14() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 4 · Week 14 · Advanced Problems</div>
        <h1>Week 14 Recap:<br />Chess, Food Delivery, Locker, Pub-Sub</h1>
        <p>Days 66–70 in one place: movement as polymorphism, 3-party order state machines, greedy resource
           sizing, append-only topic logs with consumer offsets, and the drill that ties it all together.
           Cheat-sheet, rapid review, recap quiz.</p>
        <div className="chips">
          {['polymorphism', 'state machines', 'greedy slot sizing', 'at-least-once delivery', 'consumer groups', 'CAS atomic claim'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  WEEK 14 — four advanced domains, three recurring muscles

  Day 66  CHESS       Board + abstract Piece (polymorphic legalMoves)         (polymorphism)
                      4-stage validation pipeline (geometry→path→dest→check)
                      Move as Command (history stack; undo/redo; special moves)
                      check/checkmate = inCheck × hasLegalMove, one generator

  Day 67  FOOD        3-party coordination (customer, restaurant, agent)       (state machine)
  DELIVERY            6-state order machine (PLACED→CONFIRMED→AGENT_ASSIGNED
                      →PICKED_UP→DELIVERED / CANCELLED); match agent to RESTAURANT
                      price snapshot on OrderItem; surge as Decorator on FareStrategy

  Day 68  AMAZON      greedy smallest-fitting slot (rank field, not ordinal)  (resource claim)
  LOCKER              TTL reservation; CAS atomic slot claim; pickup code = VO
                      slot size as enum with explicit rank; expiry sweep

  Day 69  PUB-SUB     append-only topic log; consumer offset (pull model)     (reliability)
                      at-least-once = process THEN commit; consumer groups;
                      dead-letter queue; multiple independent subscriber groups

  Day 70  DRILL       dress rehearsal; Library (A) + Event Stream (B);        (transfer)
                      smell hunt; 17-item rubric; review loop

  RECURRING MUSCLE:  atomic CAS claim appears in Chess (move apply), Food
                     Delivery (agent assign), Locker (slot claim), Pub-Sub (group offset).`} />
        <Note><strong>The big idea:</strong> four very different domains, all built from the same set of patterns
          you've seen before — polymorphism (Day 4), State (Day 34), Strategy/Decorator (Days 31, 27), Command
          (Day 33), Value Objects (Day 20), CAS (Day 62). Week 14 is about recognising the familiar shape
          under an unfamiliar domain in the first two minutes of scoping.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 66 · Chess</h3>
        <ul>
          <li><strong>Entities:</strong> <C>Board</C> (8×8 grid of <C>Square</C>), <C>abstract Piece</C> (6 subclasses), <C>Move</C> (from, to, piece, captured), <C>Game</C> (board + history + status).</li>
          <li><strong>Movement polymorphism:</strong> <C>piece.legalMoves(board, from)</C> — no type switch. Each subclass owns its rule; sliding pieces share <C>slide()</C>.</li>
          <li><strong>4-stage validation:</strong> geometry → path clear → destination valid → king not in check after move. Stage 4 catches pinned pieces (simulate on a copy).</li>
          <li><strong>Move as Command:</strong> <C>apply(board)</C> / <C>undo(board)</C> + a history stack. Enables undo, replay, and special-move tracking (castling rights, en-passant eligibility).</li>
          <li><strong>Check / checkmate:</strong> <C>inCheck(player)</C> = any opponent piece attacks the king. <C>isCheckmate(player)</C> = inCheck AND no legal move exists. One legal-move generator handles all three outcomes.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 67 · Food Delivery</h3>
        <ul>
          <li><strong>Entities:</strong> <C>Customer</C>, <C>Restaurant</C>, <C>MenuItem</C>, <C>Order</C> (6-state machine), <C>OrderItem</C> (snapshot of unitPrice), <C>DeliveryAgent</C> (location + status), <C>Trip</C>.</li>
          <li><strong>6-state order machine:</strong> PLACED → CONFIRMED → AGENT_ASSIGNED → PICKED_UP → DELIVERED (terminal), CANCELLED (reachable from PLACED/CONFIRMED only).</li>
          <li><strong>Match agent to RESTAURANT:</strong> find nearest AVAILABLE agent to <C>order.restaurant().location()</C>, not the customer.</li>
          <li><strong>Price snapshot:</strong> <C>OrderItem</C> stores <C>Money unitPrice</C> set at creation time — not a live <C>MenuItem</C> reference.</li>
          <li><strong>Surge pricing:</strong> a <C>SurgePricingDecorator</C> wraps the base <C>FareStrategy</C>, multiplies by a demand factor, caps at a ceiling.</li>
          <li><strong>Agent assignment race:</strong> CAS on <C>agent.status(AVAILABLE, ASSIGNED)</C> — loser re-matches.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 68 · Amazon Locker</h3>
        <ul>
          <li><strong>Entities:</strong> <C>Package</C> (size, courierId), <C>LockerSlot</C> (size, state, code), <C>Reservation</C> (slotId, courierId, code, expiresAt), <C>PickupCode</C> (immutable value object).</li>
          <li><strong>Size enum with rank:</strong> explicit <C>int rank</C> field (SMALL=1, MEDIUM=2, LARGE=3) — never <C>ordinal()</C> or alphabetical comparisons.</li>
          <li><strong>Greedy assignment:</strong> filter slots where <C>size.fits(pkg.size())</C>, sort by <C>size.rank()</C> ASC, take first. Smallest fitting slot.</li>
          <li><strong>Atomic slot claim:</strong> <C>slot.compareAndSet(AVAILABLE, OCCUPIED)</C> — one courier wins, the other re-searches.</li>
          <li><strong>Pickup code as Value Object:</strong> immutable record, validated at construction (6 alphanumeric), structural equality.</li>
          <li><strong>TTL expiry:</strong> a sweeper periodically frees slots past their <C>expiresAt</C> — uses injected <C>Clock</C>.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 69 · Pub-Sub Message Queue</h3>
        <ul>
          <li><strong>Entities:</strong> <C>Message</C> (offset, key, value, timestamp), <C>Topic</C> (append-only log), <C>Producer</C>, <C>Consumer</C> (offset per topic), <C>ConsumerGroup</C> (shared offset).</li>
          <li><strong>Append-only log:</strong> <C>topic.append(key, value)</C> returns an offset. <C>topic.read(fromOffset, maxCount)</C> returns records without removing them.</li>
          <li><strong>Pull model:</strong> consumers poll at their own pace; the broker never pushes. Each consumer stores its own committed offset.</li>
          <li><strong>At-least-once:</strong> <C>process(message)</C> FIRST, THEN <C>commitOffset()</C>. Reversed = at-most-once (data loss on crash).</li>
          <li><strong>Consumer group:</strong> one message delivered to exactly one consumer in the group. Multiple groups each receive every message independently.</li>
          <li><strong>Dead-letter queue:</strong> failed messages (exception in <C>process()</C>) are enqueued to a DLQ for inspection and replay.</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 The week in one table</h2>
        <table className="matrix">
          <thead><tr><th>domain</th><th>defining constraint</th><th>key pattern</th><th>atomic claim seam</th></tr></thead>
          <tbody>
            <tr><td>Chess</td><td>king must never be left in check</td><td>Polymorphism + Command</td><td>CAS on move application</td></tr>
            <tr><td>Food Delivery</td><td>3-party coordination; agent matched to restaurant</td><td>State machine + Strategy/Decorator</td><td>CAS on agent.status</td></tr>
            <tr><td>Amazon Locker</td><td>smallest fitting slot, atomic claim</td><td>Greedy + Value Object + TTL</td><td>CAS on slot.state</td></tr>
            <tr><td>Pub-Sub</td><td>at-least-once; consumer controls pace</td><td>Append-only log + offset</td><td>CAS on group offset</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>Piece owns its rule.</strong> Never ask "what type is this piece?" — call <C>piece.legalMoves()</C> and let it answer.</li>
          <li><strong>Agent → restaurant → customer.</strong> Match by restaurant proximity, not customer proximity.</li>
          <li><strong>process() then commit()</strong> — say this once before every Pub-Sub problem. The reverse destroys data silently.</li>
          <li><strong>rank field, not ordinal.</strong> Size enums need an explicit rank int — ordinal() breaks on reordering, alphabetical reverses the order.</li>
          <li><strong>Price snapshot = OrderItem independence.</strong> A live reference means retroactive billing changes.</li>
          <li><strong>CAS is the universal atomic claim.</strong> Slot, agent, seat, offset — same compareAndSet idiom everywhere.</li>
          <li><strong>Consumer group = load balance.</strong> One message per group, many messages per independent group.</li>
          <li><strong>Stage 4 = king safety.</strong> Simulate the move on a copy of the board; if king is in check after, illegal. Catches pinned pieces.</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps to never repeat</h2>
        <Warn><strong>instanceof / type switch on pieces.</strong> Adding a new piece reopens every switch. Polymorphism is the design; the type-switch is the smell.</Warn>
        <Warn><strong>Matching delivery agent to the customer.</strong> The agent picks up food first. Always match to the restaurant location.</Warn>
        <Warn><strong>Live MenuItem reference in OrderItem.</strong> Menu price changes alter existing order totals retroactively. Snapshot unitPrice at order creation.</Warn>
        <Warn><strong>Committing offset before processing.</strong> The single most-planted Pub-Sub trap. Process first, commit after — always. The reversed version silently drops messages on crash.</Warn>
        <Warn><strong>Alphabetical size comparisons.</strong> LARGE &lt; MEDIUM &lt; SMALL alphabetically — the wrong order. Use an explicit rank field on the size enum.</Warn>
        <Warn><strong>Checking borrow limit without synchronization.</strong> Two threads both read count &lt; 3 and both proceed — the member gets 4 loans. CAS or a synchronized check+increment is required.</Warn>
        <Warn><strong>Treating consumer group as broadcast.</strong> A consumer group routes each message to exactly one member. Broadcast requires multiple independent groups.</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Recall the answer before revealing — if you hesitate on any card, that's the day to reopen:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across all four days of Week 14.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 14 revised?</strong> You can now model piece movement as polymorphism, draw a 3-party
        order state machine, claim resources atomically with CAS, design an append-only topic log with
        at-least-once delivery, and recognise these shapes under unfamiliar domain names. That is the
        advanced-problem muscle Month 4 was building.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 15 · Recap</strong> — machine coding rounds (built when the week completes).
      </div>
    </div>
  )
}
