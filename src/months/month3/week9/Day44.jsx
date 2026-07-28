import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the playable game ============ */
const SIZE = 30
const COLS = 10
const JUMPERS = { 3: 22, 8: 26, 15: 25, 27: 9, 19: 7, 24: 16 }   // ladders up, snakes down — ONE map
const PSYMS = ['🔵', '🔴', '🟢']

function PlayableSnL() {
  const [pCount, setPCount] = useState(2)
  const [positions, setPositions] = useState([0, 0])
  const [turn, setTurn] = useState(0)
  const [status, setStatus] = useState('IN_PROGRESS')
  const [winner, setWinner] = useState(null)
  const [rule, setRule] = useState('stay')
  const [log, setLog] = useState(null)

  function reset(pp = pCount) {
    setPCount(pp); setPositions(Array(pp).fill(0)); setTurn(0)
    setStatus('IN_PROGRESS'); setWinner(null); setLog(null)
  }

  function roll() {
    if (status !== 'IN_PROGRESS') return
    const r = 1 + Math.floor(Math.random() * 6)
    const from = positions[turn]
    let t = from + r
    let trace = PSYMS[turn] + ' rolls 🎲 ' + r + ' → ' + from + '+' + r + ' = ' + t
    if (t > SIZE) {
      if (rule === 'stay') { t = from; trace += ' → overshoots ' + SIZE + ' → STAYS at ' + from + ' (exact landing required)' }
      else { t = SIZE - (t - SIZE); trace += ' → overshoots → BOUNCES back to ' + t }
    }
    if (t !== from && JUMPERS[t] !== undefined) {
      const dest = JUMPERS[t]
      trace += dest > t ? ' → 🪜 ladder ' + t + '→' + dest : ' → 🐍 snake ' + t + '→' + dest
      t = dest
    }
    const ps = positions.slice(); ps[turn] = t
    setPositions(ps)
    if (t === SIZE) {
      setStatus('FINISHED'); setWinner(turn)
      setLog(trace + ' → lands EXACTLY on ' + SIZE + ' — 🏆 wins!')
    } else {
      setTurn((turn + 1) % pCount)
      setLog(trace + ' → final cell ' + t + '. Queue rotates.')
    }
  }

  const rows = [2, 1, 0].map((R) => {
    const cells = [...Array(COLS)].map((_, i) => R * COLS + i + 1)
    if (R % 2 === 1) cells.reverse()
    return cells
  })

  return (
    <div className="panel">
      <div className="ptitle">Live demo · a 30-cell lot of pure luck — no choices, only rules. Note the zig-zag is DISPLAY only.</div>
      <div className="modbtns" style={{ marginBottom: 8 }}>
        {[2, 3].map((pp) => <button key={pp} className={pCount === pp ? 'on' : ''} onClick={() => reset(pp)}>{pp} players</button>)}
        <button className={rule === 'stay' ? 'on' : ''} onClick={() => setRule('stay')}>overshoot: stay put</button>
        <button className={rule === 'bounce' ? 'on' : ''} onClick={() => setRule('bounce')}>overshoot: bounce back</button>
        <button className="ghost act" onClick={() => reset()}>reset</button>
      </div>
      <div style={{ display: 'inline-block', marginBottom: 8 }}>
        {rows.map((cells, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
            {cells.map((cell) => {
              const j = JUMPERS[cell]
              const tokens = positions.map((p, i) => (p === cell ? PSYMS[i] : '')).join('')
              return (
                <div key={cell} style={{
                  width: 46, height: 46, position: 'relative', borderRadius: 6,
                  border: '1.5px solid var(--line)', fontFamily: 'IBM Plex Mono',
                  background: cell === SIZE ? '#FFF1D6' : j !== undefined ? (j > cell ? '#EAF7EF' : '#FFE0DE') : '#fff',
                }}>
                  <span style={{ position: 'absolute', top: 1, left: 3, fontSize: 9, color: '#7c8aa5' }}>{cell}</span>
                  {j !== undefined && (
                    <span style={{ position: 'absolute', top: 1, right: 2, fontSize: 9 }}>{j > cell ? '🪜' : '🐍'}{j}</span>
                  )}
                  {cell === SIZE && <span style={{ position: 'absolute', top: 12, right: 3, fontSize: 9 }}>🏁</span>}
                  <div style={{ position: 'absolute', bottom: 2, left: 0, right: 0, textAlign: 'center', fontSize: 13 }}>{tokens}</div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        {status === 'IN_PROGRESS'
          ? <button className="act" onClick={roll}>🎲 roll for {PSYMS[turn]}</button>
          : <button className="ghost act" onClick={() => reset()}>play again</button>}
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono' }}>
          waiting at 0: {positions.map((p, i) => (p === 0 ? PSYMS[i] : '')).join('') || '—'}
        </span>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {status === 'FINISHED'
          ? <span>🏆 <b>Status.FINISHED</b> — {PSYMS[winner]} wins. {log}</span>
          : log
            ? <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{log}</span>
            : <span>Roll! Watch the pipeline in this bar: roll → tentative → overshoot rule → jumper → land. Switch the overshoot rule mid-game and see endgames change.</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: the dice lab ============ */
const SCRIPT = [2, 5, 6, 1, 3, 4]
const DICE_DEFS = {
  fair: { label: 'FairDice(d6)', built: 'new FairDice(new Random(), 6)' },
  loaded: { label: 'LoadedDice(6)', built: 'new LoadedDice(6)   // cheats — or stress-tests the "roll again on 6" rule' },
  two: { label: 'TwoDice(d6+d6)', built: 'new TwoDice(new FairDice(rnd, 6), new FairDice(rnd, 6))' },
  scripted: { label: 'ScriptedDice', built: 'new ScriptedDice(List.of(2, 5, 6, 1, 3, 4))   // the TESTING star' },
}

function DiceLab() {
  const [strat, setStrat] = useState('fair')
  const [counts, setCounts] = useState({})
  const [total, setTotal] = useState(0)
  const [sIdx, setSIdx] = useState(0)
  const [last, setLast] = useState(null)

  function pick(k) { setStrat(k); setCounts({}); setTotal(0); setSIdx(0); setLast(null) }

  function doRolls(k) {
    const c = { ...counts }; let i = sIdx; let v = null
    for (let j = 0; j < k; j++) {
      if (strat === 'fair') v = 1 + Math.floor(Math.random() * 6)
      else if (strat === 'loaded') v = 6
      else if (strat === 'two') v = 2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6)
      else { v = SCRIPT[i % SCRIPT.length]; i++ }
      c[v] = (c[v] || 0) + 1
    }
    setCounts(c); setTotal(total + k); setSIdx(i); setLast(v)
  }

  const faces = [...Array(12)].map((_, i) => i + 1)
  const max = Math.max(1, ...faces.map((f) => counts[f] || 0))

  return (
    <div className="panel">
      <div className="ptitle">Live demo · four dice, one interface — the Game cannot tell them apart (that blindness is the point)</div>
      <div className="modbtns" style={{ marginBottom: 8 }}>
        {Object.keys(DICE_DEFS).map((k) => (
          <button key={k} className={strat === k ? 'on' : ''} onClick={() => pick(k)}>{DICE_DEFS[k].label}</button>
        ))}
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 8 }}>
        dice = {DICE_DEFS[strat].built}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => doRolls(1)}>roll() ×1</button>
        <button className="ghost act" onClick={() => doRolls(100)}>roll() ×100</button>
        <span className="chip" style={{ fontFamily: 'IBM Plex Mono' }}>last: {last ?? '—'} · total rolls: {total}</span>
        {strat === 'scripted' && (
          <span className="chip" style={{ fontFamily: 'IBM Plex Mono', background: '#FFF1D6' }}>
            script: [{SCRIPT.join(', ')}] repeating · next index: {sIdx % SCRIPT.length}
          </span>
        )}
      </div>
      <div style={{ marginBottom: 10 }}>
        {faces.map((f) => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, width: 18, textAlign: 'right', color: '#7c8aa5' }}>{f}</span>
            <div style={{
              height: 12, borderRadius: 3, background: counts[f] ? 'var(--blue)' : '#eee',
              width: counts[f] ? Math.max(3, Math.round((counts[f] / max) * 240)) : 2,
              transition: 'width .2s',
            }} />
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#7c8aa5' }}>{counts[f] || ''}</span>
          </div>
        ))}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
          {strat === 'scripted'
            ? 'Same script, same game, every single run — a full match becomes a repeatable unit test. No mocking framework needed: it is just another Dice.'
            : 'Game.playTurn(), for all four dice: int roll = dice.roll(); — one line, never edited. Compare the histograms: two dice make 7 common and 2/12 rare (sums are not uniform!).'}
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: the jumper chain lab ============ */
const LAB_JUMPERS = [
  { id: 'A', label: '🪜 4→14', from: 4, to: 14 },
  { id: 'B', label: '🪜 14→24', from: 14, to: 24 },
  { id: 'C', label: '🐍 24→4', from: 24, to: 4 },
  { id: 'D', label: '🐍 17→6', from: 17, to: 6 },
]

function ChainLab() {
  const [enabled, setEnabled] = useState({ A: true, B: false, C: false, D: true })
  const [log, setLog] = useState(null)

  const jumps = {}
  LAB_JUMPERS.forEach((j) => { if (enabled[j.id]) jumps[j.from] = j.to })

  function findCycle() {
    for (const startStr of Object.keys(jumps)) {
      const path = []; const seen = new Set(); let cell = Number(startStr)
      while (jumps[cell] !== undefined) {
        if (seen.has(cell)) return path.concat(cell)
        seen.add(cell); path.push(cell); cell = jumps[cell]
      }
    }
    return null
  }

  function land(start) {
    const cycle = findCycle()
    if (cycle) {
      setLog('new Board(30, jumpers) → 💥 IllegalStateException: jumper cycle ' + cycle.join(' → ') + ' → ' + cycle[0] +
        ' — the board REFUSES to exist. Fail at construction, not at move 37 of a live game (Day 19 + Day 20: parse, don\'t validate).')
      return
    }
    let cell = start; const hops = [cell]
    while (jumps[cell] !== undefined) { cell = jumps[cell]; hops.push(cell) }
    const jumped = hops.length - 1
    setLog('resolve(' + start + '): ' + hops.join(' ─→ ') + ' · quiet cell reached → final position ' + cell +
      (jumped >= 2 ? '  (' + jumped + ' hops — a CHAIN. House-rule check: some variants stop after one hop. ASK before coding the while-loop!)'
        : jumped === 1 ? '  (1 hop)' : '  (no jumper here — nothing happens)'))
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · build your own jumper config — then try to break it with a chain and a cycle</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {LAB_JUMPERS.map((j) => (
          <button key={j.id} className={enabled[j.id] ? 'act' : 'ghost act'}
            style={{ fontSize: 12.5 }}
            onClick={() => { setEnabled((e) => ({ ...e, [j.id]: !e[j.id] })); setLog(null) }}>
            {enabled[j.id] ? '☑' : '☐'} {j.label}
          </button>
        ))}
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 8 }}>
        jumps = {'{'} {Object.keys(jumps).map((f) => f + '→' + jumps[f]).join(', ') || '(empty)'} {'}'}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => land(4)}>🎯 land on 4</button>
        <button className="act" onClick={() => land(17)}>🎯 land on 17</button>
        <button className="act" onClick={() => land(9)}>🎯 land on 9</button>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {log
          ? <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{log}</span>
          : <span>Try: land on 4 as-is (one hop). Enable 14→24 too (a chain!). Then add 24→4 and land on 4 again — and meet the constructor’s cycle detector.</span>}
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'Snake and Ladder: two subclasses of an abstract Jumper with polymorphic apply()?',
    o: ['Use inheritance: Snake extends Ladder', 'No — they have IDENTICAL behavior (move from → to); they differ only in data (direction). One Jumper record + one Map<from,to>; subclass only when behavior diverges (Day 41\'s rule, again)', 'Yes — model the real-world hierarchy', 'Yes, plus a JumperFactory'], a: 1,
    e: 'apply() would contain the same line in both subclasses: player.position = to. Identical bodies = the hierarchy is ceremony. "A snake is a jumper whose from > to" is one boolean, not one class.',
    w: { 0: 'A snake is not a kind of ladder by any test, least of all Day 3\'s is-a.',
         2: 'Real-world nouns are candidates, not commandments — behavior decides.',
         3: 'A factory for two data rows is pattern-itis (Day 22\'s warning).' },
    r: { id: 's3', label: 'Section 3 — the jumper insight' } },
  { q: 'How should dice be modeled?',
    o: ['Math.random() inline in the game loop', 'A static utility: DiceUtil.roll()', 'A Dice interface with roll(); FairDice takes an INJECTED Random — and ScriptedDice replays a fixed sequence, making a whole game a deterministic unit test (Day 15\'s Random boundary)', 'An enum of all six faces'], a: 2,
    e: 'Randomness is a dependency, exactly like time. Behind an interface it is swappable: fair in production, loaded for stress-testing rules, scripted for tests that replay the same match forever.',
    w: { 0: 'Untestable: every test run plays a different game.',
         1: 'A static call is just inline randomness wearing a tie — still unswappable, untestable.',
         3: 'The faces aren\'t the variation point; HOW values are produced is.' },
    r: { id: 's5', label: 'Section 5 — dice as a strategy' } },
  { q: 'Player on 98 rolls a 4 (board of 100). What happens?',
    o: ['Move to 102', 'The roll is re-thrown', 'Move to 100 and win', 'Depends on a rule you must ASK about: classic "exact landing" = stay at 98 (or bounce to 98); the answer changes endgames — and whichever it is, the rule lives in ONE place in the move pipeline'], a: 3,
    e: 'Overshoot is the requirements question of this problem — like "follow jumper chains?" Both stay-put and bounce-back are real variants. Coding one silently is the mistake; naming the variants and parking the rule in one pipeline step is the win.',
    w: { 0: 'Position 102 on a 100-cell board is the bug version, not a variant.',
         1: 'No standard variant re-rolls — and inventing rules silently is the real error.',
         2: 'That\'s a third variant (first-past-the-post) — fine, IF agreed out loud.' },
    r: { id: 's7', label: 'Section 7 — the move pipeline' } },
  { q: 'A ladder drops you on a snake\'s head. Your resolve() follows it. What MUST the code have?',
    o: ['Nothing special — while loops are fine', 'Thread.sleep between hops', 'A recursion depth of 3', 'A cycle guard — best as a constructor-time validation that walks every chain once, so a broken board fails at BUILD time instead of hanging a live game mid-move'], a: 3,
    e: 'A while-loop over a player-supplied jumper config is an infinite loop waiting for the config 24→4→…→24. Validate chains when the Board is constructed (fail fast, Day 19) and resolve() can stay a simple loop.',
    w: { 0: 'while (jumps.containsKey(cell)) + a cyclic config = a game that never returns.',
         1: '🙂 Sleeping through an infinite loop just makes it a slow infinite loop.',
         2: 'A magic depth limit silently truncates legal chains and hides the broken config.' },
    r: { id: 's3', label: 'Section 3 — validate at construction' } },
  { q: 'Between tic-tac-toe and snake & ladder, the game-loop skeleton changes…',
    o: ['In exactly two slots: HOW the move is obtained (chosen cell vs forced dice roll) and WHAT the rules do (guards+tally vs overshoot+jumpers) — the queue, status enum and rotation are IDENTICAL', 'Only the variable names', 'Completely — different games, different loops', 'Snake & ladder needs no loop'], a: 0,
    e: 'who → obtain move → apply rules → check end → rotate. Day 43 and today filled the two varying slots differently and copied the rest. Chess in Month 4 fills them a third way. The skeleton is the reusable asset of this week.',
    w: { 1: 'Two slots genuinely differ in KIND: input source and rule set.',
         2: 'Run the two loops side by side — four of the six lines match word for word.',
         3: 'Any turn-based game is a loop over turns by definition.' },
    r: { id: 's1', label: 'Section 1 — the skeleton' } },
  { q: 'playTurn() returns a TurnResult record instead of printing the move. Why?',
    o: ['So the result can be modified later', 'The Game produces FACTS (who, rolled what, from, to); rendering them is the runner\'s job — so the same Game drives a console, a GUI, or a JUnit assert with zero changes (Day 11)', 'Records are fashionable', 'Printing is slow'], a: 1,
    e: 'A System.out.println inside playTurn welds the rules to one UI and forces tests to capture stdout. Returning a TurnResult lets the test simply assert on fields — and the console runner formats it however it likes.',
    w: { 0: 'Records are immutable — and a result that can be "adjusted" later is a lie waiting to happen.',
         2: 'The shape (record) is taste; the separation (facts vs presentation) is the design point.',
         3: 'Speed is irrelevant; coupling is the cost.' },
    r: { id: 's7', label: 'Section 7 — facts, not printouts' } },
  { q: 'Two jumpers configured to start on cell 40, or a ladder starting on cell 100 — where is this caught?',
    o: ['In the Board CONSTRUCTOR: reject duplicate starts, jumpers on the final cell, and from==to before the board ever exists — an object that constructs successfully is a VALID board (Day 20: parse, don\'t validate)', 'By the dice', 'In resolve(), during the game', 'It cannot be caught'], a: 0,
    e: 'Setup data is untrusted input. The constructor is the border checkpoint: putIfAbsent catches duplicates, range checks catch 1/size, the chain-walk catches cycles. After that, the whole game runs guard-free on a board it can trust.',
    w: { 1: 'Dice produce numbers; they know nothing of boards.',
         2: 'Mid-game is the worst possible moment to learn your setup was broken.',
         3: 'Every rule listed is a cheap constructor check.' },
    r: { id: 's3', label: 'Section 3 — validate at construction' } },
  { q: '"Rolling a 6 grants another turn." Where does that rule live?',
    o: ['Inside Player', 'Inside LoadedDice', 'In the TURN policy of the loop — after applying the move, skip the queue rotation when the roll was 6; dice produce numbers, they do not know about turns', 'Inside the Board'], a: 2,
    e: 'Layer test: whose concept is it? "Another TURN" is turn-order vocabulary — the queue\'s domain. The dice\'s contract is roll() → int, nothing more. (Then ask: three 6s in a row = back to start? Same home: the turn policy.)',
    w: { 0: 'Players don\'t control turn order; the queue does.',
         1: 'A die that grants turns has absorbed a game rule — now every game with that die has the rule.',
         3: 'The board knows cells and jumpers — turn order is not its vocabulary.' },
    r: { id: 's9', label: 'Section 9 — the rule knobs' } },
]

/* ============ The page ============ */
export default function Day44() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 9 · Day 44 · Classic LLD Problems</div>
        <h1>Snake &amp; Ladder:<br />Dice, Jumpers &amp; the Loop You'll Reuse Forever</h1>
        <p>No skill, no choices — a player just rolls and obeys. So what is there to design? Plenty: randomness
           you can TEST, two "different" things that are secretly one, a board config you must refuse to trust,
           and the turn-loop skeleton that every board game after this will reuse. Click everything.</p>
        <div className="chips">
          {['game loop skeleton', 'dice strategy', 'jumpers', 'injected Random', 'overshoot rules', 'fail-fast setup'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The skeleton: every turn-based game is the same loop</h2>
        <p>Yesterday you built tic-tac-toe. Strip away the tallies and the grid, and a shape remains — and
          snake &amp; ladder has the <em>same</em> shape with two slots filled differently:</p>
        <Code html={`  THE TURN-BASED GAME LOOP — this week's reusable asset

  while (status == IN_PROGRESS) {
      player = turn queue front          ← WHO    (Deque rotation — Day 43, unchanged)
      input  = obtain the move           ← slot ①  HOW a move is born
      apply the rules to the state       ← slot ②  WHAT the rules are
      check end conditions               ← OVER?  (win / draw / finished)
      rotate the queue                   ← NEXT   (unless a rule says "again!")
  }

  slot ①  tic-tac-toe: a HUMAN CHOOSES a cell      slot ②  guards + place + tally
          snake&ladder: a DIE DECIDES — no choice          overshoot + jumpers + exact-100
          chess (M4):   a human (or engine) chooses        piece legality + check rules

  Different games are mostly the SAME loop with two slots swapped.
  Say this sentence in an interview and watch the nodding.`} />
        <Note><strong>The big difference from Day 43:</strong> in snake &amp; ladder, moves are
          <strong> forced</strong>. The player contributes nothing but presence — which deletes a whole guard
          (no "wrong cell" to validate) and adds a new character instead: <strong>chance</strong>. Today's
          design effort goes where the variation went: into the dice and the board's rules.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Sixty seconds of scope, then the entity pass</h2>
        <p>The clarifying burst, match speed: board size? <em>100, parameterized.</em> Players?
          <em> 2–4.</em> Dice? <em>One d6 — design for swapping.</em> Overshooting 100?
          <em> Exact landing; overshoot stays put.</em> Ladder onto a snake?
          <em> Follow the chain.</em> First winner ends the game? <em>Yes (rankings = follow-up).</em>
          Now the nouns and verbs:</p>
        <Code html={`  NOUNS → ENTITIES                            VERBS → METHODS
  board, cell 1..100  → Board(size, jumpers)       roll the dice     → dice.roll()
  snake, ladder       → Jumper(from, to) — ONE     move / advance    → game.playTurn()
                        concept, two directions    slide / climb     → board.resolve(cell)
  dice                → interface Dice ← the axis  win               → landed == size
  player              → record Player(name, sym)   take turns        → Deque rotation (Day 43)
  game                → Game (loop state, queue)   render the board  → the runner's job, NOT Game's

  FILTERED OUT (Day 10): "the spinner art", "the box" (rendering);
  "luck" (not an entity — it lives inside Dice and nowhere else)`} />
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The jumper insight: snakes and ladders are the SAME class</h2>
        <p>The trap most candidates walk into: <C>abstract class Jumper</C>, <C>Snake extends Jumper</C>,
          <C> Ladder extends Jumper</C>, polymorphic <C>apply()</C>... and both subclasses contain the
          identical line. A snake moves you from a cell to a cell. A ladder moves you from a cell to a cell.
          <strong> They differ in data (direction), not behavior</strong> — Day 41's subclass rule says: one
          class.</p>
        <Code html={`  THE BOARD IS A 1-D PATH WEARING A 10×10 COSTUME

  display (zig-zag):   100  99  98  97 …      ← boustrophedon — RENDERING only!
                        81  82  83  84 …
                        …
                         1   2   3   4 …

  model (a line):   1 → 2 → … → 27 ─🪜→ 74 → … → 92 ─🐍→ 33 → … → 100 🏁

  jumps = { 27→74, 92→33, 4→14, … }     ← ONE map holds both kinds.
  "snake" = jumper with from > to        ← a boolean for printing 🐍 vs 🪜,
  "ladder" = jumper with from < to          not a class hierarchy.`} />
        <Code html={`<span class="kw">public record</span> Jumper(<span class="kw">int</span> from, <span class="kw">int</span> to) {           <span class="cm">// one concept, two directions</span>
    <span class="kw">public boolean</span> isSnake() { <span class="kw">return</span> from &gt; to; }   <span class="cm">// used by the RENDERER for 🐍 vs 🪜 — nothing else</span>
}

<span class="kw">public class</span> Board {
    <span class="kw">private final int</span> size;                              <span class="cm">// 100 classically — a parameter, never a habit</span>
    <span class="kw">private final</span> Map&lt;Integer, Integer&gt; jumps = <span class="kw">new</span> HashMap&lt;&gt;();  <span class="cm">// from → to, both kinds together</span>

    <span class="kw">public</span> Board(<span class="kw">int</span> size, List&lt;Jumper&gt; jumpers) {
        <span class="kw">this</span>.size = size;
        <span class="kw">for</span> (Jumper j : jumpers) {                       <span class="cm">// ── the border checkpoint: untrusted setup data ──</span>
            <span class="kw">if</span> (j.from() &lt;= <span class="num">1</span> || j.from() &gt;= size)       <span class="cm">// no jumper on the start or the finish line</span>
                <span class="kw">throw new</span> IllegalArgumentException(<span class="str">"illegal jumper start: "</span> + j.from());
            <span class="kw">if</span> (j.from() == j.to())                      <span class="cm">// a jumper must actually move you</span>
                <span class="kw">throw new</span> IllegalArgumentException(<span class="str">"jumper goes nowhere: "</span> + j.from());
            <span class="kw">if</span> (jumps.putIfAbsent(j.from(), j.to()) != <span class="kw">null</span>)  <span class="cm">// one jumper per cell</span>
                <span class="kw">throw new</span> IllegalArgumentException(<span class="str">"two jumpers start at "</span> + j.from());
        }
        <span class="kw">for</span> (Integer start : jumps.keySet()) {           <span class="cm">// walk every chain ONCE — cycles die HERE,</span>
            Set&lt;Integer&gt; seen = <span class="kw">new</span> HashSet&lt;&gt;();      <span class="cm">//   at build time, not at move 37</span>
            <span class="kw">int</span> cell = start;
            <span class="kw">while</span> (jumps.containsKey(cell)) {
                <span class="kw">if</span> (!seen.add(cell))
                    <span class="kw">throw new</span> IllegalStateException(<span class="str">"jumper cycle through "</span> + cell);
                cell = jumps.get(cell);
            }
        }
    }

    <span class="kw">public int</span> size() { <span class="kw">return</span> size; }

    <span class="kw">public int</span> resolve(<span class="kw">int</span> landed) {                     <span class="cm">// follow jumpers until a quiet cell</span>
        <span class="kw">int</span> cell = landed;
        <span class="kw">while</span> (jumps.containsKey(cell)) cell = jumps.get(cell);  <span class="cm">// safe: cycles were rejected above</span>
        <span class="kw">return</span> cell;
    }
}`} />
        <Good><strong>Parse, don't validate (Day 20), at board scale:</strong> every rule about jumpers —
          range, duplicates, cycles — is enforced in the constructor. A <C>Board</C> that exists is a
          <em> valid</em> board, so <C>resolve()</C> needs zero defensive code and the game loop never
          double-checks its world. Fail at setup, run free forever.</Good>
        <Reveal summary="Bonus: should resolve() follow CHAINS at all (ladder → snake head)?">
          <p>It's a house rule! Some families play one hop only; most play "follow until quiet". The design
            answer: <strong>ask</strong>, then bury the choice inside <C>resolve()</C> — a <C>while</C> for
            chains, an <C>if</C> for one-hop. Either way it is one keyword in one method, and the Game never
            knows which. (The lab in Section 8 lets you feel both — and what happens to the cycle check if
            you pick <C>while</C>.)</p>
        </Reveal>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🎲 Play: the lot of pure luck</h2>
        <p>A 30-cell board so games end fast. Before rolling: predict which overshoot rule makes endgames
          longer — then switch it mid-game and find out:</p>
        <PlayableSnL />
        <Good><strong>What you should notice:</strong> ① Every log line is the SAME pipeline: roll → tentative
          → overshoot rule → jumper → land. ② With "stay put", a player at 28 can be stuck for several turns
          (only 2 wins); with "bounce", 5 from cell 28 bounces to 27 — straight onto the 🐍 to 9. One rule
          toggle, very different endgames. ③ The zig-zag rows are pure display: the log only ever talks about
          cell numbers on a line.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Dice: randomness is a dependency — put it behind a door</h2>
        <p>Day 15 flagged <C>Clock</C> and <C>Random</C> as the two sneakiest dependencies. Today
          <C> Random</C> gets the same treatment <C>Clock</C> got on Day 42: an interface, injected, with a
          test-friendly implementation that makes whole games repeatable.</p>
        <Code html={`<span class="kw">public interface</span> Dice { <span class="kw">int</span> roll(); }                <span class="cm">// the entire contract: chance → number</span>

<span class="kw">public class</span> FairDice <span class="kw">implements</span> Dice {
    <span class="kw">private final</span> Random random;                       <span class="cm">// INJECTED — never new Random() buried inside</span>
    <span class="kw">private final int</span> faces;
    <span class="kw">public</span> FairDice(Random random, <span class="kw">int</span> faces) { <span class="kw">this</span>.random = random; <span class="kw">this</span>.faces = faces; }
    <span class="kw">public int</span> roll() { <span class="kw">return</span> random.nextInt(faces) + <span class="num">1</span>; }   <span class="cm">// 1..faces</span>
}

<span class="kw">public class</span> TwoDice <span class="kw">implements</span> Dice {              <span class="cm">// composition again: wraps any two dice</span>
    <span class="kw">private final</span> Dice a, b;
    <span class="kw">public</span> TwoDice(Dice a, Dice b) { <span class="kw">this</span>.a = a; <span class="kw">this</span>.b = b; }
    <span class="kw">public int</span> roll() { <span class="kw">return</span> a.roll() + b.roll(); }  <span class="cm">// sums: 2..12, and 7 is king — NOT uniform!</span>
}

<span class="kw">public class</span> ScriptedDice <span class="kw">implements</span> Dice {         <span class="cm">// ⭐ the testing star</span>
    <span class="kw">private final</span> Queue&lt;Integer&gt; script;
    <span class="kw">public</span> ScriptedDice(List&lt;Integer&gt; rolls) { <span class="kw">this</span>.script = <span class="kw">new</span> ArrayDeque&lt;&gt;(rolls); }
    <span class="kw">public int</span> roll() { <span class="kw">return</span> script.poll(); }        <span class="cm">// the game replays EXACTLY — a match becomes a unit test</span>
}`} />
        <Warn><strong>The buried <C>new Random()</C> is the #1 testability killer in submitted solutions.</strong>
          With it, every test run plays a different game — you literally cannot assert "player 2 wins on turn 9".
          With <C>ScriptedDice(List.of(2,5,6,…))</C> the whole match is deterministic: same rolls, same
          jumpers, same winner, every run, forever. No mocking framework — it's just another <C>Dice</C>.</Warn>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🎰 Play: the dice lab</h2>
        <p>Four implementations of one interface. Roll ×100 on each and compare the histograms — then read the
          one line of Game code that survives all four:</p>
        <DiceLab />
        <Good><strong>What you should notice:</strong> ① FairDice is flat across 1–6; TwoDice is a pyramid
          peaking at 7 (sums aren't uniform — a rules-balance fact your design just made visible). ② LoadedDice
          always says 6 — perfect for stress-testing a "roll again on 6" rule a thousand times in a second.
          ③ ScriptedDice's histogram is exactly the script — and that determinism is what turns "play a match"
          into "run a test".</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The Game: one turn = one pipeline, returned as facts</h2>
        <Code html={`  playTurn() — THE MOVE PIPELINE (every arrow is one decided rule)

  🎲 roll = dice.roll()                       ← chance, behind its door
  tentative = position + roll                 ← the hopeful step
  tentative > size ?  → apply OVERSHOOT rule  ← stay put | bounce back (AGREED in scope!)
  landed = board.resolve(tentative)           ← jumpers, chains pre-validated
  landed == size ?    → FINISHED, winner = p  ← exact landing wins
  else                → rotate the queue      ← Day 43's one-liner, unchanged`} />
        <Code html={`<span class="kw">public class</span> Game {
    <span class="kw">public enum</span> Status { IN_PROGRESS, FINISHED }

    <span class="kw">private final</span> Board board;
    <span class="kw">private final</span> Dice dice;                            <span class="cm">// fair in prod, scripted in tests — Game can't tell</span>
    <span class="kw">private final</span> Deque&lt;Player&gt; turns;                  <span class="cm">// Day 43's queue, verbatim</span>
    <span class="kw">private final</span> Map&lt;Player, Integer&gt; position = <span class="kw">new</span> HashMap&lt;&gt;();  <span class="cm">// everyone starts at 0 (off-board)</span>
    <span class="kw">private</span> Status status = Status.IN_PROGRESS;
    <span class="kw">private</span> Player winner;

    <span class="kw">public</span> Game(Board board, Dice dice, List&lt;Player&gt; players) {
        <span class="kw">this</span>.board = board; <span class="kw">this</span>.dice = dice;
        <span class="kw">this</span>.turns = <span class="kw">new</span> ArrayDeque&lt;&gt;(players);
        players.forEach(p -&gt; position.put(p, <span class="num">0</span>));
    }

    <span class="kw">public</span> TurnResult playTurn() {                      <span class="cm">// ONE turn — the while-loop lives in the runner</span>
        <span class="kw">if</span> (status != Status.IN_PROGRESS)               <span class="cm">// the only guard left: no zombie games</span>
            <span class="kw">throw new</span> GameOverException(winner);
        Player p = turns.peekFirst();
        <span class="kw">int</span> roll = dice.roll();                         <span class="cm">// ① chance</span>
        <span class="kw">int</span> from = position.get(p);
        <span class="kw">int</span> tentative = from + roll;                    <span class="cm">// ② hopeful step</span>
        <span class="kw">if</span> (tentative &gt; board.size()) tentative = from; <span class="cm">// ③ overshoot rule (stay-put variant) — ONE line,</span>
                                                        <span class="cm">//    ONE place; bounce-back would replace just this</span>
        <span class="kw">int</span> landed = board.resolve(tentative);          <span class="cm">// ④ jumpers (board pre-validated, no checks needed)</span>
        position.put(p, landed);
        <span class="kw">if</span> (landed == board.size()) {                   <span class="cm">// ⑤ exact landing — the finish line</span>
            status = Status.FINISHED; winner = p;
        } <span class="kw">else</span> {
            turns.offerLast(turns.pollFirst());         <span class="cm">// ⑥ rotate — same line as tic-tac-toe</span>
        }
        <span class="kw">return new</span> TurnResult(p, roll, from, landed);   <span class="cm">// FACTS for the runner to render — no println here</span>
    }
}

<span class="kw">public record</span> TurnResult(Player player, <span class="kw">int</span> roll, <span class="kw">int</span> from, <span class="kw">int</span> landed) {}`} />
        <Note><strong>No <C>System.out</C> in sight (Day 11, enforced again):</strong> <C>playTurn()</C>
          returns a <C>TurnResult</C> record — facts. The console runner formats them ("🔴 rolled 4, slid
          92→33"); a JUnit test asserts on them (<C>assertEquals(33, r.landed())</C>); a GUI animates them.
          Same Game, three audiences, zero edits.</Note>
        <Reveal summary="Bonus: a full deterministic game test, in six lines">
          <p><C>Board b = new Board(10, List.of(new Jumper(8, 2)));</C> — tiny board, one snake.
            <C> Game g = new Game(b, new ScriptedDice(List.of(5, 6, 3, 4)), List.of(p1, p2));</C> Then:
            p1 rolls 5 → cell 5; p2 rolls 6 → 6; p1 rolls 3 → 8 → 🐍 → 2; p2 rolls 4 → lands EXACTLY on 10 —
            <C> assertEquals(p2, g.winner())</C>. Every run, forever, the same story. That six-line test
            covers rolling, jumping, exact landing and turn order at once — and it exists only because the
            dice were a seam.</p>
        </Reveal>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🐍 Play: the jumper chain lab</h2>
        <p>Build the board's jumper config yourself. Start innocent, then create a chain, then close the loop —
          and watch where the explosion happens (hint: it's not during the game):</p>
        <ChainLab />
        <Good><strong>What you should notice:</strong> ① With 4→14 alone, landing on 4 is one hop. ② Add 14→24:
          a CHAIN — resolve() follows it, and the log asks the house-rule question out loud. ③ Add 24→4 and try
          again: the <em>constructor</em> throws — the broken board never exists, so no game can ever hang on
          it. Fail-fast setup is the difference between a stack trace at build time and a frozen game at
          move 37.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>The rule knobs: which variant lives where</h2>
        <p>Snake &amp; ladder has more house rules than any game this small deserves. The design skill is
          filing each one in the right drawer:</p>
        <table className="matrix">
          <thead>
            <tr><th>house rule</th><th>where it lives</th><th>why there</th></tr>
          </thead>
          <tbody>
            <tr><td>overshoot: stay vs bounce</td><td>pipeline step ③ in playTurn (or a tiny OvershootRule lambda)</td><td>it's about MOVEMENT</td></tr>
            <tr><td>follow jumper chains vs one hop</td><td>inside Board.resolve() — while vs if</td><td>it's about the BOARD</td></tr>
            <tr><td>roll 6 → roll again</td><td>turn policy: skip the rotation</td><td>it's about TURN ORDER</td></tr>
            <tr><td>three 6s → back to start</td><td>turn policy + a per-turn counter</td><td>turn order again</td></tr>
            <tr><td>landing on an opponent sends them home</td><td>after step ④: scan the position map</td><td>it's about PLAYERS' state</td></tr>
            <tr><td>need a 6 to leave cell 0</td><td>a guard before step ②</td><td>movement precondition</td></tr>
            <tr><td>play on for 2nd/3rd place</td><td>Status + a winners list; finished players leave the queue</td><td>it's about GAME END</td></tr>
          </tbody>
        </table>
        <Warn><strong>The layer test, one sentence:</strong> ask "whose vocabulary is this rule written in?"
          A rule that says <em>turn</em> belongs to the queue logic; <em>cell/jump</em> → the Board;
          <em> move/land</em> → the pipeline. The classic mistake is stuffing "roll again on 6" into the Dice —
          a die that grants turns has swallowed a game rule, and now every game using that die inherits it.</Warn>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps — graded down in real rounds</h2>
        <Warn><strong>Snake and Ladder subclasses.</strong> Two classes whose apply() bodies are identical —
          the hierarchy adds files, not behavior. One Jumper record, one map; the 🐍/🪜 distinction is a
          boolean for the renderer.</Warn>
        <Warn><strong><C>new Random()</C> inside the game.</strong> Untestable forever: no assertion about any
          specific game can hold. Inject a <C>Dice</C>; let <C>ScriptedDice</C> make matches repeatable.
          (Two <C>new Random()</C>s created in the same millisecond may even share a seed on old JVMs — fun
          trivia, same fix.)</Warn>
        <Warn><strong>Position 104 on a 100-cell board.</strong> Forgetting the overshoot rule entirely — the
          player walks off the board and the win check (<C>== 100</C>) can never fire again. Endless game,
          courtesy of one missing if.</Warn>
        <Warn><strong>The unguarded while over jumpers.</strong> Player-supplied config + while-loop = the
          infinite loop demo from Section 8. Validate chains at construction; then the loop is provably
          safe.</Warn>
        <Warn><strong>println inside playTurn.</strong> Rules welded to a console: tests must capture stdout,
          a GUI must parse strings. Return a <C>TurnResult</C>; let runners render.</Warn>
        <Warn><strong>Silently picking a variant.</strong> Overshoot, chains, roll-again — coding ANY version
          without saying it out loud reads as "didn't notice the ambiguity". Naming the variants costs one
          sentence each and is worth more than implementing all of them.</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>The skeleton:</strong> who (queue front) → obtain move (slot ①) → apply rules (slot ②) → check end → rotate. Memorize it; every turn-based game refills slots ① and ②.</li>
          <li><strong>Jumpers:</strong> one record <C>Jumper(from, to)</C>, one <C>Map&lt;Integer,Integer&gt;</C>. Snake = from &gt; to — data, not a subclass.</li>
          <li><strong>Board constructor = border checkpoint:</strong> range, from≠to, duplicate starts, cycle walk. A Board that exists is valid; resolve() runs guard-free.</li>
          <li><strong>Dice:</strong> <C>interface Dice {'{'} int roll(); {'}'}</C> — FairDice(injected Random), TwoDice (composition; sums peak at 7), LoadedDice (rule stress-tests), ScriptedDice (deterministic matches = unit tests).</li>
          <li><strong>The pipeline:</strong> roll → tentative → overshoot rule → resolve jumpers → exact-landing win → rotate. Each house rule has exactly one step it can live in.</li>
          <li><strong>Facts out, not printouts:</strong> <C>playTurn()</C> returns <C>TurnResult(player, roll, from, landed)</C>; console/GUI/JUnit all consume the same record.</li>
          <li><strong>Rule knobs drawer test:</strong> turn-vocabulary → queue policy; board-vocabulary → resolve(); movement-vocabulary → pipeline. Never inside Dice.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Tic-tac-toe needed four guards. Where did they all go?"'>
          <p>Three of the four guarded <em>choices</em> — and this game has none: the queue picks the player,
            the dice picks the distance, the board picks the destination. No wrong cell, no wrong turn, no
            occupied square. Only the game-over guard survives (no rolling after FINISHED). Sharp version:
            validation effort follows player <em>freedom</em> — chess will need the most guards of all.</p>
        </Reveal>
        <Reveal summary='Q: "Does a snake & ladder game ALWAYS end?"'>
          <p>With a fair die: yes, with probability 1 — from any cell there's a positive-probability path to
            100, so the game terminates almost surely (the expected length is finite). But with a
            <em> scripted or loaded</em> die it can loop forever: imagine always rolling into the same snake.
            Good answer shape: "probabilistically yes for fair dice; my ScriptedDice tests prove specific
            finite games; and a turn-limit cap is a cheap safety knob if the host wants a guarantee."</p>
        </Reveal>
        <Reveal summary='Q: "Implement the kill rule: landing on an opponent sends them to 0."'>
          <p>After pipeline step ④ (final cell known): scan the position map for another player on
            <C> landed</C>; if found, <C>position.put(victim, 0)</C> — and add the fact to TurnResult so the
            renderer can gloat. Two design notes to say: it's a <em>player-state</em> rule, so it lives in the
            pipeline, not the Board; and "does a kill happen on a jumper's START cell or only the FINAL cell?"
            is an ask-back (convention: final cell only).</p>
        </Reveal>
        <Reveal summary='Q: "Roll-again on 6, and three 6s in a row = back to start. Sketch it."'>
          <p>Turn policy, wrapped around the pipeline: keep <C>consecutiveSixes</C>; on a 6, increment — if it
            hits 3, send the player to 0, reset the counter, rotate. Otherwise apply the move and
            <em> don't</em> rotate. On any non-6, reset the counter and rotate. The dice stay dumb; the Board
            stays dumb; only the turn logic learned a rule about turns. (And LoadedDice(6) tests the
            three-sixes path a thousand times a second.)</p>
        </Reveal>
        <Reveal summary='Q: "Play on for 2nd and 3rd place — what changes?"'>
          <p>Status thinking: FINISHED becomes "queue has one player left" instead of "someone won". On exact
            landing: append the player to a <C>rankings</C> list and <em>remove them from the queue</em>
            (don't rotate them back). The loop continues untouched — the queue shrinking is the feature. When
            size == 1, the last player takes the final rank. Total diff: ~5 lines, all in playTurn's step ⑤.</p>
        </Reveal>
        <Reveal summary='Q: "Why is the zig-zag board drawing not in the Board class?"'>
          <p>Because the <em>model</em> is a straight line 1→100 — adjacency, jumpers and distance never care
            about rows. The boustrophedon layout is a coordinate mapping in the renderer
            (row = (cell−1)/10, flip odd rows). Put it in Board and every rule now squints through display
            math. One-liner for the interviewer: "the snake on the box art bends; the data doesn't."</p>
        </Reveal>
        <Reveal summary='Q: "Two FairDice vs one TwoDice — does it matter?"'>
          <p>For movement totals, no — but for RULES, yes, and that's the catch: "roll again on a 6" is
            ambiguous with two dice (a 6 on either die? a total of 6? double sixes?). The composition design
            surfaces this: TwoDice returns only the sum, so per-die rules need a richer result type
            (RollResult with both faces). Recognizing that an innocent dice upgrade breaks a rule's
            ASSUMPTIONS is exactly the seniority signal this question hunts for.</p>
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
        <strong>Day 44 complete?</strong> Homework: build the full game — <C>Board</C> with all constructor
        validations (write a test proving the cycle 24→4→…→24 is rejected!), the four <C>Dice</C>
        implementations, and <C>playTurn()</C> returning <C>TurnResult</C>. Then write the six-line
        deterministic match test from Section 7 with <C>ScriptedDice</C>. Stretch: add roll-again-on-6 as a
        turn policy and stress it with <C>LoadedDice(6)</C> — does your three-sixes counter survive?
        <br /><br />
        Next: <strong>Day 45 — Week 9 Machine-Coding Drill</strong>: a timed dry-run that puts the whole week
        together — the 45-minute script, a fresh problem to attack solo, and the review checklist that grades
        you like an interviewer would.
      </div>
    </div>
  )
}
