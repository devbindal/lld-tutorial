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
  { q: 'A 45-minute LLD round opens with a vague prompt. Your FIRST move?', o: ['Start drawing classes', 'Ask 4–6 design-shaping clarifying questions and state the scope (including what is OUT) out loud', 'Write the main() method'], a: 1,
    why: 'The vagueness is deliberate — the first 5 minutes audition how you handle ambiguity. Clarify (graded!), agree scope and exclusions, THEN entities → diagram → one flow → follow-ups. Classes drawn before scope get redrawn at minute 20.' },
  { q: 'Parking spot occupancy: boolean isFree, full State classes, or a guarded enum?', o: ['boolean isFree', 'A guarded enum SpotState (occupy() throws unless FREE)', 'Full State-pattern classes'], a: 1,
    why: 'Two states + tiny behavior = the enum rung of the ladder. A boolean can\'t grow to RESERVED/OUT_OF_SERVICE; full State classes are ceremony here. Climb to State classes only when per-state behavior multiplies (the vending machine does).' },
  { q: 'Tic-tac-toe win check "without scanning the board"?', o: ['8 hardcoded ifs', 'Per-player tallies (row/col/diag/anti); a tally hitting n is the win — O(1) per move', 'Re-scan all lines each move'], a: 1,
    why: 'Ladder: 8 ifs (welded to 3×3) → loops over the ≤4 lines through the last move (O(n)) → tallies (O(1)). Caveat: tallies assume win-length K == board size N; gomoku (K<N) breaks them and needs a directional scan.' },
  { q: 'Snake & Ladder: model a snake and a ladder as…', o: ['Two subclasses of Jumper', 'One Jumper(from, to) record + a Map — they differ in DATA (direction), not behavior', 'Two unrelated classes'], a: 1,
    why: 'Identical behavior (move from→to) = no hierarchy. A snake is just a jumper with from > to (a boolean for rendering). One record, one map. Subclass only when behavior genuinely diverges.' },
  { q: 'Dice should be modeled as…', o: ['Math.random() inline', 'A Dice interface (FairDice with an INJECTED Random; ScriptedDice replays a fixed sequence for deterministic tests)', 'A static DiceUtil.roll()'], a: 1,
    why: 'Randomness is a dependency (Day 15). Behind an interface it\'s swappable: fair in prod, scripted in tests so a whole match is repeatable. Inline/static randomness makes every test run a different game.' },
  { q: 'The final move fills the board AND completes a line. The referee should report…', o: ['DRAW (board is full)', 'WIN — check win BEFORE draw; a winning final move is a win', 'Throw an exception'], a: 1,
    why: 'Classic ordering bug: the rules rank a completed line above a full board, so the win check must run first. Swap them and your referee steals a victory once per full game. Write the "winning final move" test.' },
]

const QUESTIONS = [
  { q: 'Week 9 starts Month 3. Beyond the specific problems, what is it really teaching?',
    o: ['New patterns', 'Faster typing', 'The interview RITUAL (clarify → entities → decisions out loud → diagram + one flow → follow-ups) applied to real problems, reusing everything from Months 1–2', 'How to draw UML'], a: 2,
    e: 'Month 3 adds no new tools — it deploys Months 1–2 on real prompts. Week 9 establishes the 45-minute script and three first classics (Parking Lot, Tic-Tac-Toe, Snake & Ladder).',
    w: { 0: 'No new patterns — it applies known ones.', 1: 'Method, not speed.', 3: 'UML is a sub-skill, not the point.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'Parking Lot — the patterns deployed?',
    o: ['A single god class', 'Just classes', 'Lot ◆ Floor ◆ Spot (composition); VehicleType/SpotType enums + fit rules; guarded enum SpotState; injected SpotAllocationStrategy; Observer display boards; Ticket{spot,vehicle,entryTime}; exit-time pricing Strategy (Part 2)', 'Inheritance hierarchy of vehicles'], a: 2,
    e: 'Parking Lot is a tour of the toolkit: composition for structure, enums for kinds, a guarded enum state machine for spots, Strategy for allocation + pricing, Observer for boards — plus the two-gates/last-spot atomic-claim flag.',
    w: { 0: 'Responsibilities are distributed.', 1: 'It\'s a deliberate pattern showcase.', 3: 'Vehicles are enum-typed (data), not subclassed.' },
    r: { id: 's2', label: 'Section 2 — Parking Lot' } },
  { q: 'Bike/Car/Truck with no differing behavior — model as…',
    o: ['A String type field', 'One Vehicle class with an enum VehicleType; the enum drives spot-compatibility data — subclass only when behavior diverges', 'Three unrelated classes', 'Three subclasses of Vehicle'], a: 1,
    e: 'Label-like variation = enum (Days 10/19). Empty subclasses are ceremony LSP never asked for; a String invites "TRUKC". Refactor to subclasses later if trucks gain real behavior (fool-me-once).',
    w: { 0: 'Stringly-typed = typo machine.', 2: 'Unrelated classes can\'t share Ticket/Spot handling.', 3: 'Empty subclasses earn nothing.' },
    r: { id: 's2', label: 'Section 2 — Parking Lot' } },
  { q: 'Tic-tac-toe: how to support "now add a third player"?',
    o: ['Three booleans', 'A rotating turn QUEUE (Deque): take the front mover, put them at the back — 2 or 10 players, same one line', 'A switch on player count', 'boolean isXTurn'], a: 1,
    e: 'A boolean hardcodes exactly two players. A Deque rotation (offerLast(pollFirst())) doesn\'t even know how many players exist — the follow-up is a non-event.',
    w: { 0: 'Three booleans to hand-sync = bugs.', 2: 'A growing switch is the Day-12 smell.', 3: 'A boolean holds two states only.' },
    r: { id: 's2', label: 'Section 2 — Tic-Tac-Toe' } },
  { q: 'The reusable turn-based game-loop skeleton (Snake & Ladder, Tic-Tac-Toe) has how many varying slots?',
    o: ['TWO: (1) how a move is obtained (human choice vs forced dice roll) and (2) what the rules do — the queue, status enum, and rotation are identical', 'None — every game is different', 'Five', 'It is unique per game'], a: 0,
    e: 'who → obtain move → apply rules → check end → rotate. Different games fill the two varying slots differently and copy the rest. That skeleton is Week 9\'s reusable asset (chess fills it a third way).',
    w: { 1: 'They share most of the loop.', 2: 'Only two slots genuinely vary.', 3: 'The skeleton generalizes.' },
    r: { id: 's2', label: 'Section 2 — Snake & Ladder' } },
  { q: 'Snake & Ladder: a player-supplied jumper config could be 24→4→...→24. Where do you catch it?',
    o: ['In the dice', 'During the game in resolve()', 'Never — let it loop', 'In the Board CONSTRUCTOR — walk every chain once and reject cycles (parse, don\'t validate); then resolve() can be a simple loop'], a: 3,
    e: 'A while-loop over a cyclic config = an infinite loop mid-game. Validate at construction (range, duplicates, cycles) so a Board that EXISTS is valid — fail at setup, run free forever.',
    w: { 0: 'Dice produce numbers, not board validation.', 1: 'Mid-game is the worst time to discover a broken config.', 2: 'That hangs the game.' },
    r: { id: 's2', label: 'Section 2 — Snake & Ladder' } },
  { q: 'Where should a parking fee be computed, and why?',
    o: ['At EXIT, by a pricing Strategy reading the ticket\'s immutable entryTime — duration is unknown until exit; money is a Money value object, never double', 'At entry, stored on the ticket', 'By a static PriceUtil', 'In the Vehicle class'], a: 0,
    e: 'You can\'t price at entry (duration doesn\'t exist yet). Exit-time pricing fed by the frozen entryTime, behind a swappable Strategy (hourly/day-pass/EV) — the parking-lot shape reused across the course.',
    w: { 1: 'Duration is unknown at entry.', 2: 'Static utils are unswappable (Day 12).', 3: 'Vehicles carry data, not billing policy.' },
    r: { id: 's2', label: 'Section 2 — Parking Lot' } },
  { q: 'The Week 9 machine-coding drill\'s core discipline?',
    o: ['Code as fast as possible', 'Memorize solutions', 'Skip testing', 'A timed dress rehearsal: clarify+scope → entity table → code BOTTOM-UP (compile every ~8 min) → happy path + one edge → self-grade against a rubric and re-drill the gaps'], a: 3,
    e: 'The drill trains the method under a clock: bottom-up so the project compiles at every checkpoint, narrate decisions, test the winning-final-move class of edge case, then review honestly. One graded loop beats five ungraded sessions.',
    w: { 0: 'Method beats raw speed.', 1: 'Recognizing shapes beats memorizing.', 2: 'The one edge case is part of the grade.' },
    r: { id: 's2', label: 'Section 2 — the drill' } },
]

export default function RecapW9() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 3 · Week 9 · First Classics</div>
        <h1>Week 9 Recap:<br />The Interview Ritual &amp; First Classics</h1>
        <p>Days 41–45 in one place: the 45-minute LLD script, then Parking Lot, Tic-Tac-Toe, and Snake &amp;
           Ladder — each a tour of Months 1–2 deployed on a real prompt. Cheat-sheet, rapid review, recap quiz.</p>
        <div className="chips">
          {['the interview ritual', 'Parking Lot', 'Tic-Tac-Toe', 'Snake & Ladder', 'game-loop skeleton'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  WEEK 9 — applying everything to real problems

  THE RITUAL (every classic):  clarify + scope OUT LOUD → entities (noun-verb)
     → decisions, citing the day/principle → class + one sequence diagram → follow-ups

  Parking Lot     Lot◆Floor◆Spot · enums · guarded SpotState · allocation     Days 41-42
                  & pricing Strategy · Observer boards · atomic-claim flag
  Tic-Tac-Toe     Board/Game-referee/Player · win-check ladder (→ O(1) tally)  Day 43
                  · win-before-draw · Deque turn rotation
  Snake & Ladder  the game-loop SKELETON (2 swap slots) · jumpers = data        Day 44
                  · Dice strategy (ScriptedDice tests) · validate at construction
  Drill           the timed 45-min protocol + self-grading rubric              Day 45`} />
        <Note><strong>Why this matters:</strong> Month 3 introduces no new tools — it builds the muscle of
          recognizing which Months-1–2 tools a prompt needs and deploying them under time pressure. The ritual
          is the reusable skill.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Problem-by-problem cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Parking Lot (Days 41–42)</h3>
        <ul>
          <li><strong>Structure:</strong> <C>Lot ◆ Floor ◆ Spot</C> (composition); availability rolls up like a Composite.</li>
          <li><strong>Kinds:</strong> <C>VehicleType</C>/<C>SpotType</C> enums + fit rules (data, not subclasses). Spot occupancy = a guarded enum (<C>occupy()</C> throws unless FREE).</li>
          <li><strong>Policies:</strong> injected <C>SpotAllocationStrategy</C> (nearest-first) and exit-time <C>PricingStrategy</C> (hourly/day-pass/EV); Money, never double.</li>
          <li><strong>Realtime + concurrency:</strong> Observer display boards; the two-gates/last-spot atomic-claim flag. DI one lot at the composition root (not Singleton).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Tic-Tac-Toe (Day 43)</h3>
        <ul>
          <li><strong>Cast:</strong> Board (the field, guards its cells) · Game (the referee: status, turns, win/draw) · Player (data). Rendering/input live in a separate runner.</li>
          <li><strong>Win-check ladder:</strong> 8 ifs (welded to 3×3) → loops over the ≤4 lines through the last move (O(n)) → per-player tallies (O(1)). Tally caveat: valid only when K == N (gomoku breaks it).</li>
          <li><strong>Referee rules:</strong> guards before state changes; <strong>win checked before draw</strong>; draw = a counter (<C>movesPlayed == n²</C>).</li>
          <li><strong>Turns:</strong> a <C>Deque</C> rotation handles any number of players.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Snake &amp; Ladder (Day 44)</h3>
        <ul>
          <li><strong>The reusable game-loop skeleton:</strong> who → obtain move → apply rules → check end → rotate. Only two slots vary (how a move is obtained; what the rules do).</li>
          <li><strong>Jumpers:</strong> one <C>Jumper(from, to)</C> record + a Map — snake = from &gt; to (data, not a subclass).</li>
          <li><strong>Dice = Strategy:</strong> <C>FairDice</C> (injected Random), <C>TwoDice</C> (composition), <C>ScriptedDice</C> (deterministic tests).</li>
          <li><strong>Validate at construction</strong> (range, duplicates, CYCLES) — parse, don\'t validate; the overshoot rule is one pipeline step; <C>playTurn()</C> returns facts (TurnResult), no println.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>The Drill (Day 45)</h3>
        <ul>
          <li><strong>The protocol:</strong> 5\' clarify+scope → 7\' entities → 23\' code bottom-up (compile every ~8\') → 7\' happy path + one edge → 3\' self-review.</li>
          <li><strong>Bottom-up</strong> so the project compiles at every checkpoint; narrate decisions out loud.</li>
          <li><strong>The review loop:</strong> drill → rubric → top-2 gaps → restudy those days → re-drill. Green twice = move on.</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 Patterns deployed this week</h2>
        <table className="matrix">
          <thead><tr><th>concern</th><th>tool</th><th>from</th></tr></thead>
          <tbody>
            <tr><td>part-whole structure + rollup</td><td>Composition / Composite</td><td>Days 6 · 28</td></tr>
            <tr><td>kinds (vehicle/spot/symbol)</td><td>enums + data, not subclasses</td><td>Days 10 · 19</td></tr>
            <tr><td>spot occupancy / car state</td><td>guarded enum state machine</td><td>Days 19 · 34</td></tr>
            <tr><td>allocation / pricing / dice</td><td>injected Strategy</td><td>Days 15 · 31</td></tr>
            <tr><td>display boards</td><td>Observer</td><td>Day 32</td></tr>
            <tr><td>turn order</td><td>Deque rotation</td><td>Day 37 (Iterator-adjacent)</td></tr>
            <tr><td>two gates / one spot</td><td>atomic claim (flagged → W13)</td><td>Day 21</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>Clarify + scope before classes.</strong> The vagueness is the test.</li>
          <li><strong>Kinds → enums; behavior diverges → subclasses.</strong></li>
          <li><strong>Win-check ladder:</strong> 8 ifs → lines-through-last-move → O(1) tallies (K==N only).</li>
          <li><strong>Win before draw.</strong></li>
          <li><strong>Game loop = who → move → rules → end → rotate</strong> (two varying slots).</li>
          <li><strong>Snake = jumper with from &gt; to</strong> (data, not a class).</li>
          <li><strong>Dice/allocation/pricing = Strategy;</strong> validate boards at construction.</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps to never repeat</h2>
        <Warn><strong>Drawing classes before scope.</strong> Clarify and agree exclusions first, or redraw at minute 20.</Warn>
        <Warn><strong>Subclassing kinds with no behavior.</strong> Bike/Car/Truck = an enum; a snake/ladder = one record.</Warn>
        <Warn><strong>The 8-if win check.</strong> Dies on the first "make it N×N" follow-up; loop over lines from the start.</Warn>
        <Warn><strong>Draw before win.</strong> A winning final move must report WIN — order matters.</Warn>
        <Warn><strong>Inline/static randomness.</strong> Inject Dice; ScriptedDice makes matches testable.</Warn>
        <Warn><strong>Validating a board mid-game.</strong> Reject cycles/bad config in the constructor (parse, don\'t validate).</Warn>
        <Warn><strong>Pricing at entry / with double.</strong> Fee is an exit-time function; money is a Money value object.</Warn>
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
        <strong>Week 9 revised?</strong> You have the interview ritual and the first classics. The shapes start
        repeating from here — recognizing them fast is the goal.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 10 · Recap</strong> — machines &amp; frameworks.
      </div>
    </div>
  )
}
