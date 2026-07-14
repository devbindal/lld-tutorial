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
  { q: 'Date-range overlap formula?',
    o: ['reqIn <= existIn AND reqOut >= existOut (containment)', 'reqIn.isBefore(existOut) AND existIn.isBefore(reqOut) — half-open; both strict', 'reqIn == existIn OR reqOut == existOut'],
    a: 1, why: 'Two half-open intervals [A,B) and [C,D) overlap when A < D AND C < B. If either condition fails, they are disjoint. Adjacent bookings (B == C) do NOT overlap — B < C is false, so no overlap.' },
  { q: 'When does hotel double-booking happen?',
    o: ['When two guests book on the same day', 'Check-then-act outside synchronized block — both threads see capacity and both proceed before either inserts', 'When the database is down'],
    a: 1, why: 'Two threads both read "room available", both pass the check, both insert a booking — the room is double-booked. Fix: synchronized block covering both the availability check and the booking insert, collapsing them into one atomic step.' },
  { q: 'What is the CLOSING state in an auction?',
    o: ['The auction is finished and ready for settlement', 'Anti-snipe buffer: a bid in the final 5 minutes extends endTime and keeps the auction in CLOSING until no new late bids arrive', 'A cancelled auction awaiting refunds'],
    a: 1, why: 'Without CLOSING, a sniper bids 1 second before close and wins before other bidders can respond. CLOSING gives others a fair window. The auction only transitions to CLOSED when the extended window expires with no further late bids.' },
  { q: 'When is reserve price checked?',
    o: ['During bidding — reject bids below the reserve', 'At settlement (CLOSED → SETTLED) — reserve is secret during bidding; only checked when the auction closes', 'When the auction opens'],
    a: 1, why: 'Reserve price is the seller\'s secret minimum. Revealing it during bidding collapses the auction to the reserve price (all bidders aim exactly at it). It is only tested at settlement: if the highest bid is below the reserve, the auction ends with no sale.' },
  { q: 'Fan-out threshold rule?',
    o: ['All users fan-out; pull is only for inactive users', 'Regular users fan-out-on-write to follower feeds; celebrities (huge follower count, e.g. > 1M) pull-on-read to avoid writing millions of feed entries per post', 'All users pull-on-read for consistency'],
    a: 1, why: 'A celebrity with 10M followers posting once would fan-out 10M writes — expensive and slow. Instead, celebrity posts are fetched at read time and merged with the user\'s pre-built feed. Regular users\' posts ARE fanned out because their follower counts are small. The threshold is a tunable business parameter.' },
  { q: 'Why does offset pagination break?',
    o: ['Offset is not thread-safe in concurrent environments', 'A new post inserted at the top shifts all positions — page 2 re-shows the last post of page 1 as a duplicate; cursor (last-seen ID) is stable', 'Offset requires a full table scan every time'],
    a: 1, why: 'If 20 posts exist and a new one arrives at position 0, item 20 is now at position 21. The request for page 2 (skip 20) now lands on what was item 20 — duplicated. Cursor uses the ID of the last item seen, which is invariant to new insertions before it.' },
  { q: 'What type is a task\'s column reference?',
    o: ['An enum constant (TaskStatus.IN_PROGRESS)', 'String columnId — columns are runtime entities the user creates; an enum is compile-time and cannot be extended at runtime', 'An int (column index in the board)'],
    a: 1, why: 'Columns are data, not code. A user can name their columns anything: "Backlog", "Blocked by Legal", "Shipped". The Column entity has id, name, boardId, and position. The Task stores columnId: String (a foreign-key reference). Enum = hardcoded, inflexible.' },
  { q: 'What happens to the redo stack when a new move is made?',
    o: ['The redo stack keeps all previous undone moves', 'It is cleared — a new move creates a new timeline; the old undo chain no longer applies, just like a text editor', 'The new move is appended to the redo stack'],
    a: 1, why: 'Undo/redo forms a linear history. After undoing 3 moves, if you make a new move, the 3 undone moves are gone — they belonged to a branch that no longer exists. The redo stack is cleared. This prevents confusing fork-in-timeline behaviour. Same model as any text editor.' },
]

const QUESTIONS = [
  { q: 'Hotel reservations A: Mon–Thu and B: Thu–Sat use half-open intervals. Do they overlap?',
    o: ['Yes — both include Thursday', 'No — A = [Mon, Thu): Thursday is excluded; B = [Thu, Sat): the intervals share no night; back-to-back bookings are allowed', 'It depends on check-out time policy', 'Only if the same room is involved'],
    a: 1,
    e: 'Half-open [Mon, Thu) occupies Monday, Tuesday, Wednesday. [Thu, Sat) occupies Thursday, Friday. No shared night. The overlap formula reqIn.isBefore(existOut) AND existIn.isBefore(reqOut): Thu.isBefore(Thu) = false → no overlap.',
    w: { 0: 'A closed interval [Mon, Thu] would include Thursday, causing a conflict. Half-open is the design that makes back-to-back bookings work.', 2: 'In this design check-out time is the exclusive endpoint; time-of-day is not modelled.', 3: 'The overlap formula applies to any resource; the same room is a separate filter.' },
    r: { id: 's1', label: 'Section 1 — the week arc' } },
  { q: 'Two members simultaneously call gymClass.book() and both see bookings.size() = 9 (capacity = 10). What prevents the race?',
    o: ['AtomicInteger on the booking count with a CAS loop', 'A synchronized block covering both the size check and the booking insert — collapsing two steps into one atomic operation', 'The List.add() method is inherently thread-safe', 'Checking capacity in a separate pre-validation step'],
    a: 1,
    e: 'The gap between reading size (9 < 10) and calling add() is the check-then-act race. Both threads pass the check and both add — capacity becomes 11. Synchronized on the GymClass object covers both steps atomically. CAS on an AtomicInteger is equivalent but requires manually rolling back on failure.',
    w: { 0: 'An AtomicInteger CAS works but requires more careful rollback logic; synchronized is simpler here.', 2: 'ArrayList.add() is not thread-safe; even Vector/synchronizedList only makes individual method calls atomic, not the check+add pair.', 3: 'A pre-validation step outside the lock still has the race between validation and insert.' },
    r: { id: 's2', label: 'Section 2 — Day 71' } },
  { q: 'An online auction has received 5 bids. The seller calls cancel(). What should the system do?',
    o: ['Cancel immediately — the seller owns the auction', 'Reject or require refund policy — after bids arrive, cancellation may be disallowed or must trigger refunds to all bidders; the state machine encodes the policy', 'Cancel and notify the highest bidder only', 'Cancel silently and remove bid history'],
    a: 1,
    e: 'Business policy determines whether seller cancellation is allowed after bids. Technically, the state machine guards this: the OPEN → CANCELLED transition may be disabled once bids exist. If cancellation IS allowed, a CancellationPolicy must refund all bidders. Removing bid history is always wrong — bids are an append-only audit log.',
    w: { 0: 'Ownership does not override business rules; cancelling after bids arrive harms bidders who made decisions based on the auction.', 2: 'All bidders who placed bids are affected, not just the highest.', 3: 'Bid history must never be deleted — it is a financial audit trail.' },
    r: { id: 's2', label: 'Section 2 — Day 72' } },
  { q: 'A social feed shows posts ordered by recency. After scrolling to page 3, a new viral post arrives. Using offset pagination, what does page 4 show?',
    o: ['Page 4 shows the next 20 posts after page 3 correctly', 'Page 4 re-shows the last post of page 3 as a duplicate — the new post shifted all positions by 1', 'Page 4 is empty because the offset recalculates', 'Page 4 shows the new viral post at the top'],
    a: 1,
    e: 'Offset means "skip N posts". After a new post at position 0, the item that was at position 60 is now at position 61. Skipping 60 (page 4) lands on what was position 59 — the last post of page 3. Cursor pagination fixes this by anchoring to the last-seen item\'s stable ID.',
    w: { 0: 'Offset is calculated from the current list length, which changed when the new post arrived.', 2: 'Offset never recalculates automatically — it blindly skips N items from the current list.', 3: 'The new post appears at the top of page 1 on next refresh, not in mid-feed pagination.' },
    r: { id: 's2', label: 'Section 2 — Day 73' } },
  { q: 'A PR has all assigned reviewers marked APPROVED. One comment thread is still open. What should mergePR() do?',
    o: ['Merge — all reviewers approved', 'Block merge — the gate is a conjunction: ALL approvals AND NO open comments; one unresolved comment blocks regardless of approvals', 'Merge with a warning to the author', 'Ask the reviewer to close the comment automatically'],
    a: 1,
    e: 'The merge eligibility is: pr.assignedReviewers.stream().allMatch(r -> approvals.contains(r)) AND pr.comments.stream().noneMatch(c -> !c.resolved()). Both conditions must hold. An open comment represents unresolved review feedback — merging over it defeats the purpose of code review.',
    w: { 0: 'Approvals cover code correctness; comments cover specific questions or required changes — they are independent gates.', 2: 'A warning that allows merge is no gate at all — the open comment would be silently buried.', 3: 'The reviewer is a human; the system cannot close their comments automatically.' },
    r: { id: 's2', label: 'Section 2 — Day 74' } },
  { q: 'Why must bids in an online auction be append-only?',
    o: ['To save database space', 'Bids are a financial audit log — a bid changes the market signal other bidders respond to; deleting it enables fraud and corrupts the auction history', 'To make queries faster with an indexed list', 'Because the auction state machine requires it'],
    a: 1,
    e: 'Once a bid is placed, other bidders may have seen it and adjusted their own bids in response. Physically deleting a bid erases that market history and allows a bidder to pretend they never bid (fraud). The correct model: mark a bid RETRACTED in a status field, append a RETRACTION event to the log, but never remove the original record.',
    w: { 0: 'Append-only logs are typically larger than mutable tables — space saving is not the reason.', 2: 'Append-only may actually require more storage and can be slower to query — but correctness is the constraint.', 3: 'The state machine constrains state transitions, not the data model of individual bids.' },
    r: { id: 's2', label: 'Section 2 — Day 72' } },
  { q: 'A user moves a task, then moves it again, then clicks Undo twice. Where does the task end up?',
    o: ['Back at the original position — two Undos reverse two moves', 'At the position after the first move — one Undo reverses the second move, then another Undo reverses the first move, landing at the original position', 'At the position after the second move — Undo only reverts the most recent move', 'It depends on whether the redo stack was cleared'],
    a: 0,
    e: 'Two moves pushed two Commands onto the history stack: [Move1, Move2]. First Undo pops Move2 and reverses it — task at position after Move1. Second Undo pops Move1 and reverses it — task at original position. The redo stack now has [Move1, Move2] available if the user clicks Redo.',
    w: { 1: 'This describes the same outcome as option A — two Undos from the second-move position lands at the original position. Both A and B describe "original position" — the question tests whether you understand the stack pop mechanism. The stack pops most-recent-first.', 2: 'Each Undo reverses one move; two Undos reverse two moves.', 3: 'The redo stack is cleared by new moves, not by Undo — so after only moves and undos, it contains the undone moves.' },
    r: { id: 's2', label: 'Section 2 — Day 74' } },
  { q: 'Celebrity threshold in a social feed: a user with 5M followers posts. What delivery strategy is used?',
    o: ['Fan-out-on-write — write to all 5M follower feeds immediately', 'Pull-on-read — the post is stored once; follower feeds merge celebrity posts at query time', 'Push to the first 1M followers, pull for the rest', 'No delivery — celebrity posts require a separate subscription'],
    a: 1,
    e: 'Fanning out to 5M feeds on every post is extremely expensive — 5M writes per post, multiplied by every celebrity post per second. Instead, celebrity posts are stored once in the celebrity\'s post store. When a follower loads their feed, the system merges the pre-built fan-out feed (for regular users) with a pull from the celebrity\'s post list. The threshold is tunable (e.g., > 100K followers = celebrity).',
    w: { 0: '5M writes per post for every celebrity post would saturate the write capacity of the feed service.', 2: 'Partial fan-out creates inconsistency — some followers get push, others get pull, with different latencies.', 3: 'Celebrity posts are visible to all followers; the difference is delivery mechanism, not access.' },
    r: { id: 's2', label: 'Section 2 — Day 73' } },
]

export default function RecapW15() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 4 · Week 15 · Machine Coding</div>
        <h1>Week 15 Recap:<br />Date Ranges, Auctions, Feeds &amp; Boards</h1>
        <p>Days 71–75 in one place: half-open interval overlap, atomic booking, snipe-prevention state
           machines, fan-out vs pull-on-read, cursor pagination, and columns-as-runtime-data. Cheat-sheet,
           rapid review, recap quiz.</p>
        <div className="chips">
          {['half-open intervals', 'atomic booking CAS', 'CLOSING snipe guard', 'fan-out vs pull', 'cursor pagination', 'columns as data', 'Command undo'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  WEEK 15 — four new domains, four re-used muscles

  Day 71  HOTEL       date-range overlap (A<D AND C<B, half-open [in,out))  (interval math)
  BOOKING             atomic booking: synchronized { check room + insert }
                      pricing Decorator (weekend surcharge wraps base rate)
                      cancellation tiers (free / fee / non-refundable by policy)

  Day 72  ONLINE      DRAFT→OPEN→CLOSING→CLOSED→SETTLED state machine       (state machine)
  AUCTION             CLOSING = anti-snipe: late bid extends endTime
                      bids = append-only log (retraction ≠ deletion)
                      reserve price checked at CLOSED→SETTLED (secret during bidding)

  Day 73  SOCIAL      fan-out-on-write for regular users                    (scalable read)
  FEED                pull-on-read for celebrities (> threshold followers)
                      cursor pagination (last-seen ID) vs offset (breaks on insert)
                      hybrid: merge pre-built feed + celebrity pull at read time

  Day 74  TASK        Column = entity (name, boardId, position), not enum   (data model)
  BOARD               Task stores columnId: String + position: int
                      TaskMoveCommand(task, fromCol, toCol) + undo()
                      redo stack cleared on new move (linear history)
                      Composite: Workspace → Board → Column → Task
                      Observer: assignee notified on task move

  Day 75  DRILL       dress rehearsal; Gym (A) + Code Review (B);            (transfer)
                      smell hunt; 17-item rubric; review loop

  RECURRING SHAPE:    atomic-claim appears in Hotel (room), Gym (class slot),
                      Auction (bid), Code Review (approval gate) — same CAS idiom.`} />
        <Note><strong>The big idea:</strong> Hotel and Gym share the date-range overlap formula and the atomic
          capacity check. Auction and Code Review share a multi-condition gate before the final state transition.
          Social Feed and any paginated list share cursor vs offset. Task Board and any list-with-order use the
          Command pattern for undo. Week 15 is about recognising these four recurring shapes under new domain names.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 71 · Hotel Booking</h3>
        <ul>
          <li><strong>Entities:</strong> <C>RoomType</C>, <C>Room</C> (number, type, pricePerNight), <C>Reservation</C> (roomId, guestId, checkIn, checkOut, status), <C>CancellationPolicy</C> (Strategy).</li>
          <li><strong>Overlap formula:</strong> <C>reqIn.isBefore(existOut) &amp;&amp; existIn.isBefore(reqOut)</C>. Half-open intervals: [checkIn, checkOut). Back-to-back bookings never overlap.</li>
          <li><strong>Atomic booking:</strong> <C>synchronized {'{'} check availability + insert reservation {'}'}</C>. The check and insert must be one atomic step — classic check-then-act race.</li>
          <li><strong>Pricing Decorator:</strong> <C>WeekendSurchargeDecorator</C> wraps <C>BasePricingStrategy</C>. Additional add-ons (breakfast, parking) are further Decorators.</li>
          <li><strong>Cancellation tiers:</strong> FREE (more than N days before check-in), FEE (within N days), NON_REFUNDABLE. Implemented as a <C>CancellationPolicy</C> Strategy injected at booking time.</li>
          <li><strong>Money:</strong> all prices in <C>BigDecimal</C> with <C>HALF_UP</C> rounding. Never <C>double</C>.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 72 · Online Auction</h3>
        <ul>
          <li><strong>Entities:</strong> <C>Auction</C> (sellerId, item, reservePrice, startTime, endTime, status), <C>Bid</C> (auctionId, bidderId, amount, placedAt, status), <C>AuctionResult</C>.</li>
          <li><strong>State machine:</strong> DRAFT → OPEN → CLOSING → CLOSED → SETTLED. Each transition is guarded.</li>
          <li><strong>CLOSING state (snipe guard):</strong> a bid placed within 5 minutes of <C>endTime</C> triggers <C>OPEN → CLOSING</C> and extends <C>endTime</C> by 5 minutes. Only transitions to CLOSED when the window expires with no new late bids.</li>
          <li><strong>Append-only bids:</strong> <C>bids: List&lt;Bid&gt;</C> is never mutated after insert. Retracting a bid means adding a new <C>Bid</C> with <C>status=RETRACTED</C>. The effective highest bid is derived from the log.</li>
          <li><strong>Reserve price:</strong> checked at CLOSED → SETTLED only. During bidding it is secret. If the winning bid is below the reserve, the auction ends with no sale.</li>
          <li><strong>Proxy bidding:</strong> a bidder sets a max; the system auto-bids up to that max in minimum increments. Stored as a separate <C>ProxyBid</C> record, not a live mutation.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 73 · Social Media Feed</h3>
        <ul>
          <li><strong>Entities:</strong> <C>User</C> (id, followerCount), <C>Post</C> (id, authorId, content, createdAt), <C>FeedItem</C> (userId, postId, score), <C>FeedService</C>.</li>
          <li><strong>Fan-out-on-write:</strong> when a regular user posts, write <C>FeedItem</C> rows to each follower's feed. O(followers) writes at post time; O(1) read.</li>
          <li><strong>Pull-on-read (celebrities):</strong> celebrity posts are NOT fanned out. At read time, the feed service merges the user's pre-built feed with a query to the celebrity's post store. Threshold is tunable (e.g., follower count &gt; 1M).</li>
          <li><strong>Cursor pagination:</strong> <C>GET /feed?cursor={'{'}lastSeenId{'}'}&amp;limit=20</C>. Fetch posts where <C>id &lt; cursor</C> (or <C>createdAt &lt; cursorTs</C>). Stable across inserts.</li>
          <li><strong>Offset pagination (wrong for feeds):</strong> <C>.skip(page * size)</C> shifts on insert, causing duplicates on the next page.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 74 · Task Management Board</h3>
        <ul>
          <li><strong>Entities:</strong> <C>Workspace</C>, <C>Board</C> (workspaceId, name), <C>Column</C> (boardId, name, position, wipLimit), <C>Task</C> (columnId, title, assigneeId, position, dueDate).</li>
          <li><strong>Columns as data:</strong> <C>Column</C> is a runtime entity — users create, rename, reorder, and delete columns. Never an enum.</li>
          <li><strong>Task position:</strong> <C>int position</C> field on <C>Task</C> within its column. Reordering updates positions of affected tasks.</li>
          <li><strong>TaskMoveCommand:</strong> <C>execute()</C> moves task (check WIP limit → update columnId + position); <C>undo()</C> reverses the move. History stack holds executed commands. Redo stack cleared when a new command executes.</li>
          <li><strong>Composite:</strong> Workspace → Board → Column → Task. <C>Component.totalTaskCount()</C> recurses naturally.</li>
          <li><strong>Observer:</strong> assignee is notified when a task is moved to their column or assigned to them. <C>TaskEventListener</C> implemented by notification services.</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 The week in one table</h2>
        <table className="matrix">
          <thead><tr><th>day · domain</th><th>defining constraint</th><th>key pattern</th><th>atomic seam</th></tr></thead>
          <tbody>
            <tr><td>71 · Hotel Booking</td><td>date-range overlap; double-booking forbidden</td><td>Strategy (pricing) · Decorator (add-ons)</td><td>synchronized {'{'} check + insert {'}'}</td></tr>
            <tr><td>72 · Online Auction</td><td>append-only bids; snipe prevention; reserve secret</td><td>State machine (CLOSING) · append-only log</td><td>CAS on auction.status</td></tr>
            <tr><td>73 · Social Feed</td><td>low-latency reads for any follower count</td><td>Fan-out vs pull hybrid · cursor pagination</td><td>Celebrity threshold routing</td></tr>
            <tr><td>74 · Task Board</td><td>user-defined columns; reversible moves</td><td>Command (undo/redo) · Composite · Observer</td><td>WIP limit check in execute()</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>Overlap = A&lt;D AND C&lt;B.</strong> Two ranges [A,B) and [C,D) overlap when the first ends after the second starts AND the second ends after the first starts. Non-overlap: B &lt;= C OR D &lt;= A.</li>
          <li><strong>Half-open means check-out is free.</strong> [Mon, Thu) occupies Mon, Tue, Wed. Thursday is free. Back-to-back bookings always work.</li>
          <li><strong>CLOSING is the snipe guard.</strong> Late bid → extend window → stay in CLOSING. The auction only CLOSES when nobody bids in the last 5 minutes.</li>
          <li><strong>Bids are history, not state.</strong> You cannot delete a bid. Retraction is a new event, not a mutation.</li>
          <li><strong>Fan-out for regular, pull for celebrities.</strong> The threshold is a config knob. At read time, merge both sources.</li>
          <li><strong>Cursor = the last thing you saw.</strong> The next page starts after that ID. New items before it never shift your cursor.</li>
          <li><strong>Columns are a product feature, not an enum.</strong> Any time a user can name, add, or delete a "status", it is a runtime entity.</li>
          <li><strong>New move clears redo.</strong> Linear history: you cannot branch after undoing. This is how every text editor works.</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps to never repeat</h2>
        <Warn><strong>Closed intervals for hotel dates.</strong> [Mon, Thu] and [Thu, Sat] both include Thursday — double-booking. Half-open [Mon, Thu) is the fix. The formula: reqIn.isBefore(existOut) AND existIn.isBefore(reqOut).</Warn>
        <Warn><strong>Capacity check outside the synchronized block.</strong> Two threads both read "9 &lt; 10" and both add a booking — capacity becomes 11. The check and the insert must be inside the same synchronized block.</Warn>
        <Warn><strong>Settling an OPEN auction.</strong> An OPEN auction can still receive bids. Settlement must only happen from CLOSED state. Missing the CLOSING state also misses the snipe guard.</Warn>
        <Warn><strong>Deleting bids.</strong> Bids are an append-only financial audit log. Deletion enables fraud. Mark status = RETRACTED; never call list.remove() on bids.</Warn>
        <Warn><strong>Offset pagination in a live feed.</strong> A new post shifts all offsets. The user sees a duplicate on the next page. Always use cursor (last-seen ID) for feeds that receive new items.</Warn>
        <Warn><strong>Enum for columns.</strong> The first question to ask: "can users add columns?" If yes, the column must be a runtime entity, not a compile-time enum constant.</Warn>
        <Warn><strong>Double price as money.</strong> Multiply nightly rates with weekend surcharges using double and you get fractional-paise billing errors. Use BigDecimal with HALF_UP everywhere money is computed.</Warn>
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
        <p>Integrative questions across all four days of Week 15.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 15 revised?</strong> You can now write the half-open interval overlap formula from memory,
        model an auction state machine with a CLOSING snipe guard, choose fan-out vs pull based on follower count,
        use cursor pagination in any feed, store board columns as runtime data, and implement TaskMoveCommand
        with a correct undo/redo stack. That is the Week 15 muscle in full.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 16 · Recap</strong> — mock interviews, full-course recap &amp; graduation (built when the week completes).
      </div>
    </div>
  )
}
