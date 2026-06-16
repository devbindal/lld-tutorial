import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: book() flow stepper ============ */
const BOOK_CODE = [
  'Booking book(Show show, List<String> seatIds, User user) {',
  '    List<ShowSeat> held = tryHoldAll(show, seatIds, user.id());',
  '    Booking b = new Booking(nextId(), user, show, held, PENDING);',
  '    repo.save(b);',
  '    PaymentResult res = payment.charge(user, b.total());',
  '    if (res.isSuccess()) {',
  '        held.forEach(ss -> ss.confirm(user.id()));   // HELD → BOOKED',
  '        b.confirm(res.transactionId());',
  '    } else {',
  '        held.forEach(ShowSeat::release);             // HELD → AVAILABLE',
  '        b.fail();',
  '    }',
  '    return b;',
  '}',
]
const BOOK_STEPS = [
  { line: 1, note: 'tryHoldAll runs atomic compare-and-set on EVERY requested seat. All-or-nothing: if any seat is already taken, the ones we grabbed are released and this throws. We only continue if we own all of them.' },
  { line: 2, note: 'A Booking is created in PENDING state — it exists, it owns the holds, but it is NOT confirmed. The user has a ticket-in-progress, not a ticket.' },
  { line: 3, note: 'Persist the PENDING booking. If the server crashes now, recovery can find this booking, see it never confirmed, and release its holds.' },
  { line: 4, note: 'Charge through the injected payment PORT. The service does not know if this is Stripe, Razorpay, or a fake gateway in a test — it only knows the PaymentGateway interface.' },
  { line: 5, note: 'Payment succeeded → the happy path.' },
  { line: 6, note: 'Each held seat is confirmed: HELD → BOOKED (another compare-and-set, guarding that WE still hold it). The seats are now permanently sold.' },
  { line: 7, note: 'The booking flips PENDING → CONFIRMED, recording the transaction id. NOW it is a real ticket.' },
  { line: 8, note: 'Payment failed (declined, timeout) → the recovery path.' },
  { line: 9, note: 'Release every hold: HELD → AVAILABLE. The seats go straight back on sale — no leak, no phantom booking.' },
  { line: 10, note: 'The booking flips PENDING → FAILED. The user is told "payment failed, try again." The seats are already free for the next person.' },
  { line: 12, note: 'Return the booking — CONFIRMED or FAILED. Either way the system is in a clean, consistent state: seats either sold or available, never stuck.' },
]

function BookStepper() {
  const [outcome, setOutcome] = useState('success')   // success | fail
  const [i, setI] = useState(-1)
  const seq = outcome === 'success' ? [1, 2, 3, 4, 5, 6, 7, 12] : [1, 2, 3, 4, 8, 9, 10, 12]
  const started = i >= 0
  const done = i >= seq.length - 1
  const curLine = started ? seq[i] : null
  const step = started ? BOOK_STEPS.find((s) => s.line === seq[i]) : null

  function pick(o) { setOutcome(o); setI(-1) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · BookingService.book(), line by line — pick the payment outcome and step through</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        <button className={outcome === 'success' ? 'on' : ''} onClick={() => pick('success')}>payment succeeds</button>
        <button className={outcome === 'fail' ? 'on' : ''} onClick={() => pick('fail')}>payment fails</button>
      </div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
        {BOOK_CODE.map((l, idx) => {
          const dim = (outcome === 'success' && [8, 9, 10, 11].includes(idx)) || (outcome === 'fail' && [5, 6, 7].includes(idx))
          return (
            <div key={idx} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 12, whiteSpace: 'pre', overflowX: 'auto',
              padding: '1px 6px', borderRadius: 4,
              background: curLine === idx ? '#FFF1D6' : 'transparent',
              fontWeight: curLine === idx ? 700 : 400,
              opacity: dim ? 0.35 : 1,
            }}>{l}</div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {!done
          ? <button className="act" onClick={() => setI((x) => x + 1)}>{started ? 'next line →' : '▶ run book()'}</button>
          : <button className="ghost act" onClick={() => setI(-1)}>reset</button>}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {step
          ? <span style={{ fontSize: 13 }}>{step.note}</span>
          : <span>Hold all seats → create PENDING booking → charge → confirm or release. The grey lines are the branch you did NOT take.</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: payment outcome → booking & seats ============ */
function OutcomeSim() {
  const seats = ['C4', 'C5', 'C6']
  const [phase, setPhase] = useState('held')   // held | confirmed | failed | expired
  const [log, setLog] = useState('3 seats HELD · Booking #B-901 = PENDING · 5:00 left on the hold')

  function resolve(kind) {
    if (kind === 'pay') { setPhase('confirmed'); setLog('💳 charge OK → seats HELD→BOOKED → Booking #B-901 = CONFIRMED (txn TX-77). 🎟 Ticket issued.') }
    else if (kind === 'fail') { setPhase('failed'); setLog('🚫 charge DECLINED → seats HELD→AVAILABLE (released) → Booking #B-901 = FAILED. Seats back on sale instantly.') }
    else { setPhase('expired'); setLog('⏰ 5:00 elapsed, no payment → sweeper releases seats HELD→AVAILABLE → Booking #B-901 = EXPIRED. No charge, no leak.') }
  }
  function reset() { setPhase('held'); setLog('3 seats HELD · Booking #B-901 = PENDING · 5:00 left on the hold') }

  const seatColor = phase === 'confirmed' ? '#FDECEC' : phase === 'held' ? '#FFF1D6' : '#EAF7EF'
  const seatLabel = phase === 'confirmed' ? 'BOOKED' : phase === 'held' ? 'HELD' : 'AVAILABLE'
  const statusColor = { held: '#FFF1D6', confirmed: '#EAF7EF', failed: '#FDECEC', expired: '#FDECEC' }[phase]
  const statusText = { held: 'PENDING', confirmed: 'CONFIRMED', failed: 'FAILED', expired: 'EXPIRED' }[phase]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one PENDING booking, three outcomes — watch seats AND booking resolve together</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {seats.map((s) => (
          <div key={s} style={{
            width: 56, height: 48, borderRadius: 8, border: '1.5px solid var(--line)', background: seatColor,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'IBM Plex Mono', fontSize: 11,
          }}>
            <b>{s}</b><span style={{ fontSize: 8.5, color: '#666' }}>{seatLabel}</span>
          </div>
        ))}
        <div style={{
          marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, background: statusColor,
          fontFamily: 'IBM Plex Mono', fontSize: 12, alignSelf: 'center',
        }}>Booking #B-901<br /><b>{statusText}</b></div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => resolve('pay')} disabled={phase !== 'held'}>💳 pay now</button>
        <button className="ghost act" onClick={() => resolve('fail')} disabled={phase !== 'held'}>🚫 payment fails</button>
        <button className="ghost act" onClick={() => resolve('timeout')} disabled={phase !== 'held'}>⏰ abandon (let it expire)</button>
        <button className="ghost act" onClick={reset}>reset</button>
      </div>
      <div className="statbar" style={{ display: 'block', background: statusColor }}>
        <span style={{ fontSize: 12.5 }}>{log}</span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: the expiry sweeper ============ */
const INIT_HOLDS = [
  { seat: 'A2', heldUntil: 30, user: 'u-12' },
  { seat: 'B7', heldUntil: 90, user: 'u-34' },
  { seat: 'C1', heldUntil: 50, user: 'u-56' },
  { seat: 'D4', heldUntil: 120, user: 'u-78' },
]

function SweeperDemo() {
  const [now, setNow] = useState(0)
  const [holds, setHolds] = useState(INIT_HOLDS)
  const [released, setReleased] = useState([])
  const [log, setLog] = useState(null)

  function tick() { setNow((n) => n + 40); setLog(null) }
  function sweep() {
    const expired = holds.filter((h) => h.heldUntil <= now)
    const live = holds.filter((h) => h.heldUntil > now)
    setReleased((r) => [...r, ...expired.map((h) => h.seat)])
    setHolds(live)
    setLog(expired.length
      ? `🧹 sweep at t=${now}s → released ${expired.map((h) => h.seat).join(', ')} (HELD→AVAILABLE). ${live.length} hold(s) still live.`
      : `🧹 sweep at t=${now}s → nothing expired yet.`)
  }
  function reset() { setNow(0); setHolds(INIT_HOLDS); setReleased([]); setLog(null) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the background sweeper — advance the clock, then reclaim expired holds</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono', fontSize: 13 }}>⏱ clock = {now}s</span>
        <button className="act" onClick={tick}>advance +40s</button>
        <button className="act" onClick={sweep}>🧹 run sweeper</button>
        <button className="ghost act" onClick={reset}>reset</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {holds.map((h) => {
          const expired = h.heldUntil <= now
          return (
            <div key={h.seat} style={{
              padding: '6px 10px', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 11,
              border: '1.5px solid ' + (expired ? 'var(--red)' : 'var(--line)'),
              background: expired ? '#FDECEC' : '#FFF1D6',
            }}>
              <b>{h.seat}</b> HELD<br />
              <span style={{ color: expired ? 'var(--red)' : '#666' }}>
                {expired ? `expired ${now - h.heldUntil}s ago` : `${h.heldUntil - now}s left`}
              </span>
            </div>
          )
        })}
        {holds.length === 0 && <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5' }}>all holds resolved</span>}
      </div>
      {released.length > 0 && (
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'var(--green)', marginBottom: 8 }}>
          ✓ released back to AVAILABLE: {released.join(', ')}
        </div>
      )}
      <div className="statbar" style={{ display: 'block' }}>
        {log
          ? <span style={{ fontSize: 12.5 }}>{log}</span>
          : <span>Advance the clock past a hold\'s expiry (red), then run the sweeper to reclaim it. In production a ScheduledExecutorService runs this every few seconds — OR the DB enforces a TTL and reads treat expired holds as free.</span>}
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The in-memory atomic hold is written as status.compareAndSet(AVAILABLE, HELD). Why not if (status == AVAILABLE) status = HELD?',
    o: ['compareAndSet is shorter', 'The if-then is TWO steps with a gap — two threads can both pass the check before either assigns; compareAndSet does the test-and-set as ONE indivisible operation, so exactly one of two racers wins', 'compareAndSet is faster', 'They behave identically'], a: 1,
    e: 'The double-booking race is the gap between checking and setting. compareAndSet (or a DB conditional UPDATE) closes the gap — the comparison and the write are atomic, so simultaneous attempts can\'t both succeed.',
    w: { 0: 'Brevity is irrelevant; atomicity is the point.',
         2: 'Speed isn\'t why — correctness under concurrency is.',
         3: 'They behave the SAME single-threaded but differently under a race — which is exactly the case that matters.' },
    r: { id: 's2', label: 'Section 2 — the atomic hold' } },
  { q: 'A user requests seats C4, C5, C6 but C5 is already held by someone else. tryHoldAll should…',
    o: ['Hold C4 and C6, skip C5', 'All-or-nothing: release the holds it already acquired (C4) and fail the whole request — never leave the user with a partial selection or a partial charge', 'Hold all three anyway', 'Wait for C5 to free up'], a: 1,
    e: 'A booking is one atomic unit. If any seat in the selection can\'t be held, the acquired holds are released and the request fails cleanly — the user is told "some seats were just taken," not charged for a subset.',
    w: { 0: 'Partial holds leave the user with 2 of 3 seats and a confusing charge.',
         2: 'You can\'t hold C5 — it\'s taken; pretending otherwise is the double-booking bug.',
         3: 'Blocking on C5 stalls the request and can deadlock against the other holder.' },
    r: { id: 's3', label: 'Section 3 — all-or-nothing holds' } },
  { q: 'tryHoldAll acquires seats in a CONSISTENT order (e.g. sorted by seat id). Why?',
    o: ['It looks neater', 'Deadlock avoidance: if user A holds C4 and waits for C5 while user B holds C5 and waits for C4, neither proceeds — acquiring in the same global order means they contend in the same sequence and one cleanly fails', 'Sorting is required by Java', 'To make the UI consistent'], a: 1,
    e: 'Classic deadlock: two parties grab shared resources in opposite orders and wait forever. A consistent acquisition order (same for everyone) means one party gets the first contested seat and the other fails fast instead of deadlocking.',
    w: { 0: 'Neatness is a side effect; deadlock prevention is the reason.',
         2: 'Java doesn\'t require sorting — it\'s a design choice.',
         3: 'The UI is unaffected by acquisition order.' },
    r: { id: 's3', label: 'Section 3 — ordering to avoid deadlock' } },
  { q: 'The Booking starts PENDING and only becomes CONFIRMED after payment. Why not create it CONFIRMED immediately?',
    o: ['PENDING is just a label', 'Booking and payment are separate steps: a CONFIRMED-on-creation booking that then fails payment is a phantom ticket — PENDING lets a failed charge cleanly become FAILED (and release holds) with no confirmed ticket ever existing', 'CONFIRMED bookings are slower to save', 'The database requires PENDING first'], a: 1,
    e: 'Separating the booking lifecycle from payment means the only path to CONFIRMED is a successful charge. PENDING → CONFIRMED/FAILED/EXPIRED keeps the system consistent: no ticket exists unless payment succeeded.',
    w: { 0: 'It\'s a real state with real transitions, not decoration.',
         2: 'Save speed is irrelevant; consistency is the reason.',
         3: 'No DB rule forces this — it\'s a correctness design.' },
    r: { id: 's5', label: 'Section 5 — the booking lifecycle' } },
  { q: 'payment.charge(...) goes through a PaymentGateway interface. The main benefits?',
    o: ['It\'s required by Java', 'A port (Day 26/15): Stripe/Razorpay are swappable adapters wired at the root, AND a FakePaymentGateway makes the whole booking flow deterministically testable (force success/decline/timeout) with no real money', 'It makes charging faster', 'It hides the amount from the gateway'], a: 1,
    e: 'Depending on the PaymentGateway abstraction, not a concrete vendor, means backends swap with one wiring line and tests inject a fake that returns scripted outcomes — you can test the failed-payment release path without a real decline.',
    w: { 0: 'Nothing requires it; it\'s a Dependency-Inversion choice.',
         2: 'Indirection doesn\'t speed up a network charge.',
         3: 'The gateway needs the amount — that\'s the whole point of charging.' },
    r: { id: 's5', label: 'Section 5 — payment as a port' } },
  { q: 'A user holds seats and closes their laptop. What reclaims those seats?',
    o: ['Nothing — they\'re lost', 'A background expiry sweeper (a scheduled job) releases holds whose heldUntil has passed, HELD → AVAILABLE — OR the store enforces a TTL and treats expired holds as free on read; without it, abandoned holds leak seats permanently', 'The next user who tries that seat', 'A manual admin task'], a: 1,
    e: 'The timed transition needs an executor. A scheduled sweeper periodically releases expired holds, or a TTL makes expired holds count as available at read time. Either way it must be automatic — abandoned checkouts are the common case.',
    w: { 0: 'Lost-forever holds are the seat leak that empties a "sold out" show.',
         2: 'Relying on a later user to trigger cleanup means popular-but-untried seats never free up.',
         3: 'Manual cleanup can\'t keep up with thousands of abandoned holds.' },
    r: { id: 's7', label: 'Section 7 — the expiry sweeper' } },
  { q: 'The server crashes after saving a PENDING booking but before charging. On restart, recovery should…',
    o: ['Confirm the booking', 'Find PENDING bookings older than the hold window and mark them EXPIRED/FAILED, releasing their holds — persisting PENDING before charging is exactly what makes this recovery possible', 'Charge the user now', 'Delete the user\'s account'], a: 1,
    e: 'Saving PENDING first (before payment) means a crash leaves a recoverable record: recovery releases stale PENDING holds so seats return to sale. This is why the order is save-then-charge, not charge-then-save.',
    w: { 0: 'It was never paid — confirming it issues a free ticket.',
         2: 'Charging on restart bills someone who may have given up — and you have no payment authorization.',
         3: '🙂 Obviously not — clean up the booking, not the customer.' },
    r: { id: 's4', label: 'Section 4 — book() flow' } },
  { q: 'confirm() is also written as a compare-and-set: status.compareAndSet(HELD, BOOKED) guarded by the holder. Why guard it?',
    o: ['Belt and suspenders for no reason', 'Defense in depth: by the time payment returns, the hold could have expired and the seat been re-held by someone else — confirming only if WE still hold it (HELD→BOOKED, same user) prevents charging then failing to seat them', 'BOOKED must come from HELD syntactically', 'To update the timestamp'], a: 1,
    e: 'Payment takes time; a slow charge can outlast the hold window. Confirming with a guarded CAS (still HELD, still ours) catches the rare case where the hold expired mid-payment, so you detect it and refund rather than double-sell.',
    w: { 0: 'It guards a real race — slow payment vs hold expiry — not nothing.',
         2: 'The transition is a design choice, not a syntax rule.',
         3: 'The timestamp isn\'t the concern; ownership and current state are.' },
    r: { id: 's2', label: 'Section 2 — confirm guards the hold' } },
]

/* ============ The page ============ */
export default function Day52() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 11 · Day 52 · Classic LLD Problems</div>
        <h1>BookMyShow — Part 2:<br />The Atomic Hold, in Real Java</h1>
        <p>Part 1 named the enemy: two users, one seat. Today we beat it in code — the atomic compare-and-set
           hold, the all-or-nothing multi-seat claim, the booking lifecycle (PENDING → CONFIRMED/FAILED/EXPIRED),
           payment behind a port, and the expiry sweeper that stops abandoned holds from leaking seats. Click
           everything.</p>
        <div className="chips">
          {['compare-and-set', 'all-or-nothing', 'booking lifecycle', 'payment port', 'expiry sweeper', 'crash recovery'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What Part 2 adds — and the build order</h2>
        <p>Part 1 gave us the entities (Movie, Show, Seat, ShowSeat) and the seat lifecycle. Part 2 makes the
          claim <em>atomic</em> and wires the booking flow around it. Same bottom-up discipline as every code
          day:</p>
        <Code html={`  THE PART-2 BUILD ORDER (each layer calls only the ones below)

          composition root: wire gateway + sweeper        ← last
       HoldExpirySweeper (scheduled)  ·  recovery on boot
    BookingService.book(): holdAll → PENDING → charge → confirm/release
  PaymentGateway port + adapters  ·  Booking{status}  ·  tryHoldAll
  ShowSeat.tryHold / confirm / release  (atomic compare-and-set)   ← FIRST brick

  THE WHOLE SYSTEM rests on one method: ShowSeat.tryHold must let exactly
  ONE of two simultaneous racers win. Get that right and everything above
  is ordinary orchestration.`} />
        <Note><strong>The keystone:</strong> if <C>tryHold</C> is atomic, the double-booking race is dead and
          the rest is plumbing — create a booking, charge, confirm or release. If it is NOT atomic, no amount
          of clean orchestration saves you. Build and verify the keystone first.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The keystone: the atomic hold</h2>
        <p>The seat\'s three transitions are all compare-and-set — a test-and-write that happens as one
          indivisible step, so two simultaneous racers can never both win:</p>
        <Code html={`<span class="kw">public class</span> ShowSeat {
    <span class="kw">private final</span> AtomicReference&lt;SeatStatus&gt; status = <span class="kw">new</span> AtomicReference&lt;&gt;(AVAILABLE);
    <span class="kw">private volatile</span> String heldBy;
    <span class="kw">private volatile</span> Instant heldUntil;

    <span class="kw">public boolean</span> tryHold(String user, Duration window, Clock clock) {
        <span class="kw">if</span> (!status.compareAndSet(AVAILABLE, HELD)) <span class="kw">return false</span>;  <span class="cm">// ★ ATOMIC: only ONE racer wins</span>
        heldBy = user;
        heldUntil = clock.instant().plus(window);                  <span class="cm">// 5-minute hold (injected Clock → testable)</span>
        <span class="kw">return true</span>;
    }

    <span class="kw">public boolean</span> confirm(String user) {
        <span class="kw">return</span> user.equals(heldBy) &amp;&amp; status.compareAndSet(HELD, BOOKED);  <span class="cm">// guarded: still ours, still HELD</span>
    }

    <span class="kw">public void</span> release() {
        <span class="kw">if</span> (status.compareAndSet(HELD, AVAILABLE)) { heldBy = <span class="kw">null</span>; heldUntil = <span class="kw">null</span>; }
    }
}`} />
        <Code html={`  THE SAME IDEA AT THE DATABASE (when seats live in a table, not memory)

  UPDATE show_seat
     SET status = 'HELD', held_by = :user, held_until = :expiry
   WHERE id = :seatId
     AND status = 'AVAILABLE';          ← the WHERE is the compare; rows-affected is the result

  rows updated = 1  →  you won the hold
  rows updated = 0  →  someone else got it; tell the user instantly
  (a UNIQUE constraint on (show_id, seat_id, status='BOOKED') is the last line of defense)`} />
        <Good><strong>Why <C>confirm()</C> is also guarded:</strong> payment takes seconds; a slow charge can
          outlast the 5-minute hold, and by the time it returns the seat may have expired and been re-held by
          someone else. <C>compareAndSet(HELD, BOOKED)</C> with a holder check means confirm <em>only</em>
          succeeds if we still legitimately hold it — otherwise you detect the lost hold and refund, instead
          of charging someone for a seat that\'s now another\'s. Defense in depth, exactly like the
          elevator\'s doors guard (Day 47).</Good>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>All-or-nothing: holding multiple seats</h2>
        <p>Users book several seats together, and it must be atomic at the <em>booking</em> level too — all
          requested seats or none. And the order you acquire them in matters:</p>
        <Code html={`<span class="kw">private</span> List&lt;ShowSeat&gt; tryHoldAll(Show show, List&lt;String&gt; seatIds, String user) {
    List&lt;ShowSeat&gt; acquired = <span class="kw">new</span> ArrayList&lt;&gt;();
    <span class="kw">for</span> (String id : seatIds.stream().sorted().toList()) {   <span class="cm">// ★ CONSISTENT order → no deadlock</span>
        ShowSeat seat = show.seat(id);
        <span class="kw">if</span> (seat.tryHold(user, HOLD_WINDOW, clock)) {
            acquired.add(seat);                               <span class="cm">// got this one…</span>
        } <span class="kw">else</span> {
            acquired.forEach(ShowSeat::release);              <span class="cm">// …one failed → give back ALL we grabbed</span>
            <span class="kw">throw new</span> SeatsUnavailableException(id);          <span class="cm">// fail the whole booking cleanly</span>
        }
    }
    <span class="kw">return</span> acquired;                                        <span class="cm">// we own every requested seat</span>
}`} />
        <Warn><strong>Sort the seat ids before acquiring — it prevents deadlock.</strong> Without a consistent
          order: user A holds C4 and waits for C5; user B holds C5 and waits for C4; both wait forever. With a
          global order (sorted), everyone contends for C4 first, so one wins it and the other fails fast and
          releases. A consistent lock-acquisition order is the standard deadlock cure (a Month-4 staple, worth
          naming now).</Warn>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🎬 Play: the book() flow</h2>
        <p>The orchestration that ties it together: hold all seats → create a PENDING booking → charge →
          confirm or release. Pick the payment outcome and step through:</p>
        <BookStepper />
        <Good><strong>What you should notice:</strong> ① The PENDING booking is saved BEFORE charging — so a
          crash mid-payment leaves a recoverable record. ② Success confirms holds to BOOKED; failure releases
          them to AVAILABLE. Either branch leaves the system clean — seats never stuck in HELD. ③ The payment
          call is one line against a port; the service has no idea which gateway runs.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The booking lifecycle + payment as a port</h2>
        <p>A Booking has its own state machine, and payment lives behind an interface so it\'s swappable and
          testable:</p>
        <Code html={`  BOOKING LIFECYCLE (separate from the seat lifecycle on purpose)

                  charge OK
   PENDING ───────────────────▶ CONFIRMED        ← the only path to a real ticket
      │  │
      │  │ charge fails         release holds
      │  └────────────────────▶ FAILED
      │
      │ hold window elapses     sweeper releases holds
      └────────────────────────▶ EXPIRED

  CONFIRMED is reachable ONLY through a successful charge — so a failed or
  abandoned payment can NEVER leave a confirmed-but-unpaid ticket.`} />
        <Code html={`<span class="kw">public interface</span> PaymentGateway {                  <span class="cm">// the PORT (Day 26 adapter / Day 15 DIP)</span>
    PaymentResult charge(User user, Money amount);
}
<span class="cm">// real:  StripeAdapter, RazorpayAdapter   — wrap vendor SDKs (Adapter, Day 26)</span>
<span class="cm">// test:  FakePaymentGateway               — returns scripted SUCCESS / DECLINE / TIMEOUT</span>

<span class="kw">public record</span> PaymentResult(<span class="kw">boolean</span> success, String transactionId, String failureReason) {}`} />
        <Note><strong>Money is <C>Money</C>, booking ≠ payment.</strong> Two reuses of earlier lessons:
          <C> b.total()</C> sums <C>SeatType</C> prices as Day 20\'s <C>Money</C> (never <C>double</C>), and the
          booking lifecycle is deliberately separate from the seat lifecycle so a payment failure resolves the
          booking (FAILED) AND the seats (released) without ever minting a ticket.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>💳 Play: one booking, three endings</h2>
        <p>A PENDING booking holding three seats. Choose what happens to the payment and watch the seats AND
          the booking resolve in lockstep:</p>
        <OutcomeSim />
        <Good><strong>What you should notice:</strong> ① Pay → seats BOOKED, booking CONFIRMED. ② Fail → seats
          released to AVAILABLE, booking FAILED — instantly back on sale. ③ Abandon → the sweeper expires it,
          same release, booking EXPIRED, no charge. In all three, seats and booking move together: there is no
          state where a seat is stuck HELD with a dead booking.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The expiry sweeper: making the timed transition real</h2>
        <p>Part 1 said the HELD → AVAILABLE expiry edge is load-bearing. Here\'s what actually fires it — a
          scheduled job, or a TTL the reads respect:</p>
        <Code html={`<span class="kw">public class</span> HoldExpirySweeper {
    <span class="kw">private final</span> Clock clock;

    <span class="kw">public void</span> sweep(Show show) {                       <span class="cm">// runs every few seconds on a scheduler</span>
        Instant now = clock.instant();
        <span class="kw">for</span> (ShowSeat seat : show.heldSeats())
            <span class="kw">if</span> (seat.heldUntil() != <span class="kw">null</span> &amp;&amp; seat.heldUntil().isBefore(now))
                seat.release();                            <span class="cm">// HELD → AVAILABLE (atomic), seat back on sale</span>
    }
}

<span class="cm">// wired at the root:</span>
scheduler.scheduleAtFixedRate(() -&gt; shows.forEach(sweeper::sweep), <span class="num">0</span>, <span class="num">5</span>, SECONDS);

<span class="cm">// ALTERNATIVE (no sweeper): lazy expiry — a read treats an expired hold as AVAILABLE,</span>
<span class="cm">// and the DB row carries a held_until TTL. Often combined with a slow background cleanup.</span>`} />
        <Warn><strong>Two valid designs, name the trade.</strong> An active <strong>sweeper</strong> reclaims
          promptly (good for showing accurate availability fast) but costs scheduled work. <strong>Lazy
          expiry</strong> (treat expired holds as free on read) costs nothing until accessed but leaves stale
          HELD rows until something reads them. Most real systems do both: lazy correctness on the hot path +
          a slow sweeper for tidiness. Mentioning both, and why, is the senior answer.</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🧹 Play: the sweeper</h2>
        <p>Four held seats with different expiry times. Advance the clock, watch holds go red as they expire,
          then run the sweeper to reclaim them:</p>
        <SweeperDemo />
        <Good><strong>What you should notice:</strong> ① A hold only becomes reclaimable once the clock passes
          its <C>heldUntil</C> (it turns red). ② The sweeper releases exactly the expired ones, leaving live
          holds untouched. ③ The Clock is injected, so in a test you "advance time" by passing a later instant
          — no real waiting, the same deterministic-time trick from Days 42 and 47.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Putting it together: the service + composition root</h2>
        <Code html={`<span class="kw">public class</span> BookingService {
    <span class="kw">private final</span> ShowRepository shows;
    <span class="kw">private final</span> PaymentGateway payment;       <span class="cm">// injected port</span>
    <span class="kw">private final</span> BookingRepository repo;
    <span class="kw">private final</span> Clock clock;                   <span class="cm">// injected time</span>
    <span class="kw">private static final</span> Duration HOLD_WINDOW = Duration.ofMinutes(<span class="num">5</span>);

    <span class="kw">public</span> Booking book(Show show, List&lt;String&gt; seatIds, User user) {
        List&lt;ShowSeat&gt; held = tryHoldAll(show, seatIds, user.id());   <span class="cm">// all-or-nothing atomic holds</span>
        Booking b = <span class="kw">new</span> Booking(nextId(), user, show, held, PENDING);
        repo.save(b);                                                <span class="cm">// persist BEFORE charging → crash-recoverable</span>
        PaymentResult res = payment.charge(user, b.total());
        <span class="kw">if</span> (res.success()) { held.forEach(s -&gt; s.confirm(user.id())); b.confirm(res.transactionId()); }
        <span class="kw">else</span>              { held.forEach(ShowSeat::release);          b.fail(); }
        repo.save(b);
        <span class="kw">return</span> b;
    }
}

<span class="cm">// composition root (Day 15): one place wires the real graph</span>
BookingService svc = <span class="kw">new</span> BookingService(shows, <span class="kw">new</span> StripeAdapter(...), repo, Clock.systemUTC());
scheduler.scheduleAtFixedRate(() -&gt; shows.all().forEach(sweeper::sweep), <span class="num">0</span>, <span class="num">5</span>, SECONDS);
<span class="cm">// in tests:  new BookingService(shows, new FakePaymentGateway(DECLINE), repo, Clock.fixed(...))</span>`} />
        <Good><strong>Everything testable, everything swappable:</strong> inject a <C>FakePaymentGateway</C> set
          to DECLINE and you can assert the failed-payment path releases all holds — no real money, no
          flakiness. Inject <C>Clock.fixed</C> and the sweeper test "advances time" instantly. The keystone
          (atomic <C>tryHold</C>) plus injected seams (payment, clock) make the whole flow provable.</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>check-then-act hold.</strong> <C>if (seat.isAvailable()) seat.hold()</C> is the
          double-booking race in code. Use a single compare-and-set (or a conditional UPDATE).</Warn>
        <Warn><strong>Charge before saving the booking.</strong> Charge-then-save means a crash after charging
          loses the record — the user paid and has no ticket. Save PENDING first, then charge, then confirm.</Warn>
        <Warn><strong>Partial multi-seat holds.</strong> Holding what you can and proceeding leaves the user
          with a subset and a confusing charge. All-or-nothing: any failure releases the acquired holds.</Warn>
        <Warn><strong>Acquiring seats in request order.</strong> Two users with overlapping selections in
          opposite orders deadlock. Sort seat ids (a global order) before acquiring.</Warn>
        <Warn><strong>No expiry mechanism.</strong> Holds with no sweeper/TTL leak seats forever — the "sold
          out" empty hall. The timed transition needs an executor.</Warn>
        <Warn><strong>Unguarded confirm.</strong> Confirming without re-checking the hold lets a slow payment
          confirm a seat that already expired and was re-held — sell it twice. Guard confirm with a CAS on
          (still HELD, still ours).</Warn>
        <Warn><strong>Payment hardcoded to one vendor.</strong> <C>new StripeClient()</C> inside the service is
          unswappable and untestable. A <C>PaymentGateway</C> port + adapters + a fake for tests.</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Keystone:</strong> <C>ShowSeat.tryHold</C> = <C>compareAndSet(AVAILABLE, HELD)</C> (in DB: conditional <C>UPDATE … WHERE status='AVAILABLE'</C>, rows-affected = win/lose). Atomic test-and-set kills the race.</li>
          <li><strong>confirm() guarded:</strong> <C>compareAndSet(HELD, BOOKED)</C> + holder check — catches a hold that expired during a slow payment.</li>
          <li><strong>All-or-nothing:</strong> <C>tryHoldAll</C> acquires every requested seat or releases what it got and fails; acquire in SORTED order to avoid deadlock.</li>
          <li><strong>book() flow:</strong> holdAll → save PENDING (before charging → crash-recoverable) → charge → success: confirm holds + CONFIRMED · failure: release holds + FAILED.</li>
          <li><strong>Booking lifecycle:</strong> PENDING → CONFIRMED / FAILED / EXPIRED; CONFIRMED reachable ONLY via successful charge — no phantom tickets.</li>
          <li><strong>Payment = port:</strong> <C>PaymentGateway</C> interface; Stripe/Razorpay adapters (Day 26); <C>FakePaymentGateway</C> for deterministic tests.</li>
          <li><strong>Expiry:</strong> scheduled sweeper releases <C>heldUntil &lt; now</C>, and/or lazy expiry + TTL. Injected <C>Clock</C> makes it testable. Crash recovery cleans stale PENDING holds on boot.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Payment succeeds but your confirm() finds the hold expired. Now what?"'>
          <p>You\'ve charged the customer but can\'t legitimately seat them — a real edge case the guarded
            confirm exists to DETECT. Options, in order of grace: ① if the seat is still free (rare), re-acquire
            and confirm; ② otherwise auto-refund the charge and tell the user "seat was lost, you were not
            charged," offering re-selection. The key design points: the guarded CAS is what makes this
            detectable instead of silently double-selling, and the refund path needs the transaction id you
            stored. Mention idempotency: the refund must be safe to retry.</p>
        </Reveal>
        <Reveal summary='Q: "How do you make book() idempotent if the client retries on a flaky network?"'>
          <p>An idempotency key: the client sends a unique request id; the service records it with the booking,
            and a retry with the same key returns the existing booking instead of holding seats and charging
            again. Without it, a timed-out-but-actually-succeeded request that the client retries double-charges
            and double-books. The hold + PENDING record keyed by the idempotency id makes the operation safe to
            repeat — a standard payments-system requirement, and a strong thing to raise unprompted.</p>
        </Reveal>
        <Reveal summary='Q: "Move the holds to Redis / a distributed cache. What changes?"'>
          <p>The atomic hold becomes a Redis <C>SET key value NX EX 300</C> (set-if-not-exists with a 300s TTL)
            — that single command IS the compare-and-set AND the expiry, replacing both the AtomicReference and
            the sweeper for the hold phase. NX gives "only one winner"; EX gives automatic expiry (no sweeper
            needed for holds). The confirmed BOOKED state still lives in the durable DB with its unique
            constraint as the final guarantee. So Redis owns the fast, expiring hold; the database owns the
            permanent booking. Recognizing that the cache\'s native primitives map exactly onto your hold
            semantics is the senior insight.</p>
        </Reveal>
        <Reveal summary='Q: "10,000 people hit ONE blockbuster show at 10:00:00 sharp. Does this design hold up?"'>
          <p>The correctness holds — every hold is an atomic CAS, so no double-booking regardless of load. The
            concern is contention/throughput, not correctness. Mitigations: shard by show so all claims for one
            show hit one authoritative partition (no cross-node coordination); use the cache\'s atomic SET NX
            for cheap holds; consider a brief queue/waiting-room for the hottest shows to smooth the spike; and
            since most seats DON\'T conflict, optimistic CAS avoids holding locks. The framing to deliver:
            "correctness is guaranteed by the atomic claim; scale is a partitioning + admission-control problem,
            deep-dived in distributed systems."</p>
        </Reveal>
        <Reveal summary='Q: "Cancellations and refunds — how do they fit?"'>
          <p>A new transition on the booking: CONFIRMED → CANCELLED, which releases the seats (BOOKED →
            AVAILABLE) and triggers a refund through the same PaymentGateway port (a <C>refund(txnId, amount)</C>
            method). Policy questions to ASK: refund window (no refunds within N hours of showtime?), partial
            refund/fees? Those are pricing/policy rules, kept out of the seat and booking core — a
            CancellationPolicy strategy. The structure already supports it: seats have a release path, payment
            is a port, booking is a state machine you extend with one state. Additive, not invasive.</p>
        </Reveal>
        <Reveal summary='Q: "Why save the booking BEFORE charging, not after? Most people do it after."'>
          <p>Because the failure you must survive is "charge succeeded, then we crashed." Save-after means a
            crash between charge and save loses all record of a real payment — the worst outcome. Save-PENDING-before
            means the record always exists first: on success you update it to CONFIRMED, and a crash leaves a
            recoverable PENDING you can reconcile against the gateway (did this charge go through?) and then
            confirm or refund. The ordering encodes a durability guarantee — the same "what crash am I
            protecting against?" reasoning as the parking-lot and elevator flows.</p>
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
        <strong>Day 52 complete?</strong> Homework: code the keystone and the flow — <C>ShowSeat</C> with
        atomic <C>tryHold/confirm/release</C> (use <C>AtomicReference</C>), <C>tryHoldAll</C> with sorted
        acquisition + rollback, <C>BookingService.book()</C> (save PENDING before charging), a
        <C> PaymentGateway</C> port with a <C>FakePaymentGateway</C>, and a <C>HoldExpirySweeper</C> driven by
        an injected <C>Clock</C>. Prove it with tests: (a) two threads calling <C>tryHold</C> on the same seat
        — exactly one returns true; (b) a DECLINE releases all holds and the booking is FAILED; (c) advancing
        the fixed clock past the window lets the sweeper reclaim the seat. Stretch: add an idempotency key so a
        retried <C>book()</C> returns the same booking.
        <br /><br />
        Next: <strong>Day 53 — Splitwise</strong>: the expense-splitting system — who owes whom, equal/exact/percentage
        splits, balance simplification, and the graph problem hiding in "settle up."
      </div>
    </div>
  )
}
