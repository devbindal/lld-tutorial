import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the playable game (N×N, 2–3 players) ============ */
const SYMS = ['X', 'O', '△']
const SYM_COLOR = { X: '#2D5BFF', O: '#C75000', '△': '#1E7B43' }

function linesThrough(n, r, c) {
  const lines = []
  lines.push([...Array(n)].map((_, i) => r * n + i))            // the row
  lines.push([...Array(n)].map((_, i) => i * n + c))            // the column
  if (r === c) lines.push([...Array(n)].map((_, i) => i * n + i))             // main diagonal
  if (r + c === n - 1) lines.push([...Array(n)].map((_, i) => i * n + (n - 1 - i))) // anti-diagonal
  return lines
}

function PlayableGame() {
  const [n, setN] = useState(3)
  const [pCount, setPCount] = useState(2)
  const [grid, setGrid] = useState(Array(9).fill(null))
  const [moves, setMoves] = useState(0)
  const [status, setStatus] = useState('IN_PROGRESS')
  const [winner, setWinner] = useState(null)
  const [winCells, setWinCells] = useState([])

  function reset(nn = n, pp = pCount) {
    setN(nn); setPCount(pp)
    setGrid(Array(nn * nn).fill(null)); setMoves(0)
    setStatus('IN_PROGRESS'); setWinner(null); setWinCells([])
  }

  function play(i) {
    if (status !== 'IN_PROGRESS' || grid[i] !== null) return
    const sym = SYMS[moves % pCount]
    const g = grid.slice(); g[i] = sym
    const r = Math.floor(i / n), c = i % n
    const win = linesThrough(n, r, c).find((line) => line.every((j) => g[j] === sym))
    setGrid(g); setMoves(moves + 1)
    if (win) { setStatus('WON'); setWinner(sym); setWinCells(win) }
    else if (moves + 1 === n * n) setStatus('DRAW')
  }

  const queue = [...Array(pCount)].map((_, k) => SYMS[(moves + k) % pCount])

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the referee at work — change the board, change the player count, nothing else changes</div>
      <div className="modbtns" style={{ marginBottom: 8 }}>
        {[3, 4].map((nn) => <button key={nn} className={n === nn ? 'on' : ''} onClick={() => reset(nn, pCount)}>{nn}×{nn} board</button>)}
        {[2, 3].map((pp) => <button key={pp} className={pCount === pp ? 'on' : ''} onClick={() => reset(n, pp)}>{pp} players</button>)}
        <button className="ghost act" onClick={() => reset()}>reset</button>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5' }}>turn queue →</span>
        {queue.map((s, k) => (
          <span key={k} className="chip" style={{
            fontFamily: 'IBM Plex Mono', color: SYM_COLOR[s],
            outline: k === 0 && status === 'IN_PROGRESS' ? '2px solid var(--amber)' : 'none',
          }}>{k === 0 ? '▶ ' : ''}{s}</span>
        ))}
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5' }}>(mover rotates to the back)</span>
      </div>
      <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(' + n + ', 46px)', gap: 4, marginBottom: 10 }}>
        {grid.map((v, i) => (
          <button key={i} onClick={() => play(i)} style={{
            width: 46, height: 46, fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700,
            color: v ? SYM_COLOR[v] : '#bbb', cursor: v || status !== 'IN_PROGRESS' ? 'default' : 'pointer',
            border: '1.5px solid var(--line)', borderRadius: 8,
            background: winCells.includes(i) ? '#FFF1D6' : v ? '#F4F3EE' : '#fff',
          }}>{v || '·'}</button>
        ))}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {status === 'WON' && <span>🏆 <b>Status.WON</b> — winner: <b style={{ color: SYM_COLOR[winner] }}>{winner}</b> after {moves} moves. Every further move() would now throw GameOverException.</span>}
        {status === 'DRAW' && <span>🤝 <b>Status.DRAW</b> — movesPlayed == n×n ({moves}) with no winner. Notice: detected by a COUNTER, not by scanning the board.</span>}
        {status === 'IN_PROGRESS' && <span>🎮 Status.IN_PROGRESS · movesPlayed = {moves}. Try 3 players on 3×3 — it almost always draws. Board size was a design parameter all along.</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: the tally scoreboard (O(1) win check) ============ */
function blankTally() { return { row: [0, 0, 0], col: [0, 0, 0], diag: 0, anti: 0 } }

function TallyLens() {
  const [grid, setGrid] = useState(Array(9).fill(null))
  const [moves, setMoves] = useState(0)
  const [tallies, setTallies] = useState({ X: blankTally(), O: blankTally() })
  const [won, setWon] = useState(null)         // { sym, which } when a tally hits 3
  const [scanCost, setScanCost] = useState(0)
  const [lineCost, setLineCost] = useState(0)
  const [tallyCost, setTallyCost] = useState(0)

  function play(i) {
    if (won || grid[i] !== null || moves === 9) return
    const sym = moves % 2 === 0 ? 'X' : 'O'
    const r = Math.floor(i / 3), c = i % 3
    const g = grid.slice(); g[i] = sym
    const t = { X: { ...tallies.X, row: [...tallies.X.row], col: [...tallies.X.col] }, O: { ...tallies.O, row: [...tallies.O.row], col: [...tallies.O.col] } }
    const mine = t[sym]
    mine.row[r]++; mine.col[c]++                       // increment ALL four — never short-circuit (undo needs them honest)
    if (r === c) mine.diag++
    if (r + c === 2) mine.anti++
    setGrid(g); setMoves(moves + 1); setTallies(t)
    setScanCost(scanCost + 24); setLineCost(lineCost + 12); setTallyCost(tallyCost + 4)
    if (mine.row[r] === 3) setWon({ sym, which: 'row[' + r + ']' })
    else if (mine.col[c] === 3) setWon({ sym, which: 'col[' + c + ']' })
    else if (mine.diag === 3) setWon({ sym, which: 'diag' })
    else if (mine.anti === 3) setWon({ sym, which: 'anti' })
  }

  function reset() {
    setGrid(Array(9).fill(null)); setMoves(0)
    setTallies({ X: blankTally(), O: blankTally() }); setWon(null)
    setScanCost(0); setLineCost(0); setTallyCost(0)
  }

  const cell = (v, hot) => (
    <span style={{
      display: 'inline-block', minWidth: 26, textAlign: 'center', fontFamily: 'IBM Plex Mono', fontSize: 12.5,
      border: '1px solid var(--line)', borderRadius: 5, padding: '1px 3px', margin: 1,
      background: hot ? '#FFE0DE' : v > 0 ? '#FFF1D6' : '#fff', fontWeight: v === 3 ? 700 : 400,
    }}>{v}</span>
  )

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the scoreboard never recounts — tallies tick up, and 3 means win</div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(3, 46px)', gap: 4 }}>
            {grid.map((v, i) => (
              <button key={i} onClick={() => play(i)} style={{
                width: 46, height: 46, fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700,
                color: v ? SYM_COLOR[v] : '#bbb', cursor: v || won ? 'default' : 'pointer',
                border: '1.5px solid var(--line)', borderRadius: 8, background: v ? '#F4F3EE' : '#fff',
              }}>{v || '·'}</button>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="ghost act" onClick={reset}>reset</button>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          {['X', 'O'].map((s) => (
            <div key={s} style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: SYM_COLOR[s], fontWeight: 700 }}>{s} tallies · </span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, color: '#7c8aa5' }}>row </span>
              {tallies[s].row.map((v, i) => <span key={'r' + i}>{cell(v, won && won.sym === s && won.which === 'row[' + i + ']')}</span>)}
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, color: '#7c8aa5' }}> col </span>
              {tallies[s].col.map((v, i) => <span key={'c' + i}>{cell(v, won && won.sym === s && won.which === 'col[' + i + ']')}</span>)}
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, color: '#7c8aa5' }}> diag </span>
              {cell(tallies[s].diag, won && won.sym === s && won.which === 'diag')}
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, color: '#7c8aa5' }}> anti </span>
              {cell(tallies[s].anti, won && won.sym === s && won.which === 'anti')}
            </div>
          ))}
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, marginTop: 10, lineHeight: 1.8 }}>
            cells read so far —<br />
            😴 naive full scan (8 lines × 3): <b>{scanCost}</b><br />
            🙂 lines through last move (≤4 × 3): <b>{lineCost}</b><br />
            ⚡ tallies (4 increments): <b>{tallyCost}</b>
          </div>
        </div>
      </div>
      <div className="statbar" style={{ display: 'block', marginTop: 10 }}>
        {won
          ? <span>🏆 <b>{won.sym} wins</b> — tally <b>{won.which}</b> reached 3. No board scan happened: the running total alone announced it. (Memory paid: 8 ints per player.)</span>
          : <span>Play X and O alternately. Watch ONLY four tallies move per click — and watch the three cost meters drift apart.</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 3: the guard gauntlet ============ */
const GAUNTLET_START = ['X', 'O', null, null, 'X', null, null, null, null]   // X(0,0) O(0,1) X(1,1)
const ATTEMPTS = [
  { label: 'O → (3,3)', p: 'O', r: 3, c: 3 },
  { label: 'O → (1,1)', p: 'O', r: 1, c: 1 },
  { label: 'X → (2,2)', p: 'X', r: 2, c: 2 },
  { label: 'O → (2,1)', p: 'O', r: 2, c: 1 },
  { label: 'O → (2,0)', p: 'O', r: 2, c: 0 },
]
const GUARDS = [
  '① status == IN_PROGRESS ?   else → GameOverException',
  '② (r,c) inside the board ?  else → IllegalArgumentException',
  '③ p is the current player ? else → NotYourTurnException',
  '④ cell (r,c) empty ?        else → CellTakenException',
  '✓ apply: place → tally → won? → draw? → rotate queue',
]

function GuardGauntlet() {
  const [grid, setGrid] = useState(GAUNTLET_START)
  const [turn, setTurn] = useState('O')
  const [status, setStatus] = useState('IN_PROGRESS')
  const [fired, setFired] = useState(null)
  const [log, setLog] = useState(null)

  function attempt(a) {
    if (status !== 'IN_PROGRESS') {
      setFired(0); setLog('💥 GameOverException: the game ended (WON by X). Guard ① rejects EVERY move now — no zombie games.')
      return
    }
    if (a.r < 0 || a.r > 2 || a.c < 0 || a.c > 2) {
      setFired(1); setLog('💥 IllegalArgumentException: (' + a.r + ',' + a.c + ') is off a 3×3 board. Caught before ANY state was touched.')
      return
    }
    if (a.p !== turn) {
      setFired(2); setLog('💥 NotYourTurnException: ' + a.p + ' tried to move, but the queue says it is ' + turn + '’s turn. Cheating is a thrown exception, not a silent shrug.')
      return
    }
    if (grid[a.r * 3 + a.c] !== null) {
      setFired(3); setLog('💥 CellTakenException: (' + a.r + ',' + a.c + ') already holds ' + grid[a.r * 3 + a.c] + '. The BOARD owns this guard — the referee owns the other three.')
      return
    }
    const g = grid.slice(); g[a.r * 3 + a.c] = a.p
    setGrid(g); setFired(4)
    if (a.p === 'X' && g[0] === 'X' && g[4] === 'X' && g[8] === 'X') {
      setStatus('WON'); setLog('✅ legal → X completes the main diagonal → Status.WON. 🏆 Now press ANY button and watch guard ① take over.')
    } else {
      const next = a.p === 'O' ? 'X' : 'O'
      setTurn(next); setLog('✅ legal → placed, tallies updated, no win, no draw → queue rotates: it is now ' + next + '’s turn. (Re-try the buttons that failed before!)')
    }
  }

  function reset() { setGrid(GAUNTLET_START); setTurn('O'); setStatus('IN_PROGRESS'); setFired(null); setLog(null) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · five hopeful moves vs the referee's four guards — try them in any order</div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(3, 40px)', gap: 4 }}>
            {grid.map((v, i) => (
              <span key={i} style={{
                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: v ? SYM_COLOR[v] : '#ccc',
                border: '1.5px solid var(--line)', borderRadius: 8, background: v ? '#F4F3EE' : '#fff',
              }}>{v || '·'}</span>
            ))}
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, marginTop: 6 }}>
            status: <b>{status}</b> · turn: <b style={{ color: SYM_COLOR[turn] }}>{turn}</b>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {ATTEMPTS.map((a) => (
              <button key={a.label} className="act" style={{ fontSize: 12.5 }} onClick={() => attempt(a)}>{a.label}</button>
            ))}
            <button className="ghost act" onClick={reset}>reset</button>
          </div>
          <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px' }}>
            {GUARDS.map((g, i) => (
              <div key={i} style={{
                fontFamily: 'IBM Plex Mono', fontSize: 12, whiteSpace: 'pre-wrap', padding: '1px 6px', borderRadius: 4,
                background: fired === i ? (i === 4 ? '#EAF7EF' : '#FFE0DE') : 'transparent',
                fontWeight: fired === i ? 700 : 400,
              }}>{g}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {log ? <span style={{ fontSize: 13 }}>{log}</span> : <span>Each button is a call to game.move(p, r, c). The ladder on the right shows which guard fires — or whether the move lands.</span>}
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The classic beginner win-check is 8 hardcoded if-conditions. The REAL problem with it?',
    o: ['It is welded to 3×3 — the first follow-up ("make it N×N") forces a rewrite; loops keyed on board size absorb the same follow-up with ZERO new lines', 'Too slow for 3×3', 'Java forbids long boolean expressions', 'It uses too much memory'], a: 0,
    e: 'Eight comparisons over nine cells is instant — speed was never the issue. The issue is that the board size is baked into the SHAPE of the code. Interviewers ask "now 4×4?" specifically to see if your code had N as a parameter or as a habit.',
    w: { 1: 'At 9 cells, even the ugliest check is instantaneous — performance is not the lesson here.',
         2: 'It compiles fine — the compiler is happier with it than the next maintainer.',
         3: 'It uses less memory than any alternative; memory is not the cost.' },
    r: { id: 's5', label: 'Section 5 — the win-check ladder' } },
  { q: 'X just played (1,2). Which lines can POSSIBLY have become a win this move?',
    o: ['Every cell must be re-read', 'Only row 1', 'Only the lines THROUGH (1,2): row 1, column 2, and a diagonal only if (1,2) sits on one — at most 4 line checks', 'All 2n+2 lines on the board'], a: 2,
    e: 'A move changes exactly one cell, so only lines containing that cell changed state. Saying "I only check lines through the last move" out loud is the cheapest big point in this interview.',
    w: { 0: 'That is the full scan you were just freed from.',
         1: 'Column 2 also gained a mark — and a diagonal might have.',
         3: 'Lines that don\'t touch (1,2) are exactly as won or unwon as they were last turn.' },
    r: { id: 's5', label: 'Section 5 — lines through the last move' } },
  { q: 'The O(1) tally trick (row count hits n ⇒ win) silently BREAKS when…',
    o: ['You add undo', 'The board is larger than 9×9', 'There are three players', 'The win length K is SHORTER than the board (gomoku-style "5 in a row on 15×15"): tallies count marks ANYWHERE in the line, not consecutive ones — you must scan ±(K−1) around the last move instead'], a: 3,
    e: 'Tallies work because K == N: a full row is a win no matter how it is arranged. When K < N, "5 marks somewhere in row 3" is not "5 in a row". The fix is a 4-direction walk around the last move, O(K). Knowing your trick\'s breaking point is worth more than the trick.',
    w: { 0: 'Undo works fine — decrement the same four tallies (which is why we increment all four without short-circuiting).',
         1: 'Size is irrelevant — tallies scale linearly and stay O(1) per move.',
         2: 'Tallies are per player; three players just means three tally sets.' },
    r: { id: 's9', label: 'Section 9 — when the trick breaks' } },
  { q: 'The final move fills the board AND completes 3-in-a-row. Correct referee behavior?',
    o: ['Check WIN before DRAW: a winning move that happens to fill the board is a WIN; swap the order and your referee steals victories exactly once per full game', 'DRAW — the board is full', 'Throw an exception — ambiguous state', 'Ask the players'], a: 0,
    e: 'This is the classic ordering bug in submitted machine-coding rounds. The rules say a completed line wins, full board or not — so the win check must run first, and a test for "winning final move" belongs in your suite.',
    w: { 1: 'That IS the bug — the player completed a line and your code shrugged.',
         2: 'The state is not ambiguous; the rules rank win above draw.',
         3: 'The referee exists so nobody has to ask. 🙂' },
    r: { id: 's7', label: 'Section 7 — the referee' } },
  { q: 'Turn management that survives "now add a third player"?',
    o: ['boolean isXTurn', 'Three booleans', 'A rotating queue: take the mover from the front, put them at the back — 2 or 10 players, the same one line of code', 'A switch on the player count'], a: 2,
    e: 'turns.offerLast(turns.pollFirst()) does not even know how many players exist. The boolean encodes exactly two players into the type itself — the follow-up question is designed to kill it.',
    w: { 0: 'A boolean can hold exactly two states; the third player has nowhere to live.',
         1: 'Three booleans whose consistency you maintain by hand — a bug waiting for a flip you forgot.',
         3: 'A switch that grows per player count is Day 12\'s growing-switch smell in miniature.' },
    r: { id: 's7', label: 'Section 7 — the turn queue' } },
  { q: 'Board.getGrid() returning the private char[][] directly is…',
    o: ['Better, because it is faster', 'An aliasing leak: callers can now write cells without any guard running; expose at(r,c) or a defensive copy (Day 2), so every write stays behind place()', 'Fine — convenient for rendering', 'OK if the field is final'], a: 1,
    e: 'Hand out the real array and any caller can do grid[0][0] = \'X\' — no bounds check, no occupancy check, no tally update, and the referee never heard about it. Day 2\'s defensive-copy rule, in its natural habitat.',
    w: { 0: 'Rendering reads nine cells; this was never the bottleneck.',
         2: 'Convenient for rendering AND for corrupting — the same reference does both.',
         3: 'final stops reassigning the field; it does nothing to stop editing the array\'s contents.' },
    r: { id: 's3', label: 'Section 3 — the board' } },
  { q: '"Add an unbeatable AI." The design answer?',
    o: ['Subclass Game as AiGame', 'A MoveStrategy on the Player (human-input / random / minimax) — the referee and the loop never change, because HOW a player picks moves was a strategy axis all along (Day 31)', 'Rewrite the project in Python', 'if (aiMode) blocks inside the game loop'], a: 1,
    e: 'The rules did not change — only the mover\'s brain did. Player carries a MoveStrategy; the loop asks current.brain().nextMove(view) regardless of what is behind it. Minimax becomes one new file.',
    w: { 0: 'Game = the rules. The rules of tic-tac-toe did not change — wrong axis to subclass.',
         2: 'Tempting. Still no. 🙂',
         3: 'The growing-if disease (Day 12): next comes if(easyMode), if(networkPlayer)…' },
    r: { id: 's9', label: 'Section 9 — pluggable brains' } },
  { q: 'Players are X and O today — a third symbol may join tomorrow. Model the symbol as…',
    o: ['Integers 1 and 2', 'Public String constants', 'enum Mark { X, O }', 'Data on the player (record Player(name, symbol, brain)): the player set is OPEN, and Day 19 said enums are for CLOSED sets the compiler should enforce'], a: 3,
    e: 'Day 19\'s open-set nuance, applied: GameStatus {IN_PROGRESS, WON, DRAW} is closed → enum. Who plays, with what symbol → open, arriving at runtime → plain data on a record. Same day, two opposite (correct) answers.',
    w: { 0: 'Magic numbers (Day 19) — and printing the board becomes a lookup chore.',
         1: 'Stringly-typed: nothing stops two players claiming "X".',
         2: 'Every new player would mean recompiling an enum — the wrong tool for an open set.' },
    r: { id: 's3', label: 'Section 3 — players are data' } },
]

/* ============ The page ============ */
export default function Day43() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 9 · Day 43 · Classic LLD Problems</div>
        <h1>Tic-Tac-Toe:<br />A Toy Game, Graded Like Real Design</h1>
        <p>Nine cells, two symbols — and one of the most revealing machine-coding prompts there is.
           Interviewers don't care whether you can play tic-tac-toe; they care whether your board survives
           "make it 4×4", your turns survive "add a player", and your win-check survives "without scanning".
           Today: the referee, the scoreboard trick, and the guards. Click everything.</p>
        <div className="chips">
          {['machine coding', 'board & referee', 'turn queue', 'win check in O(1)', 'validation ladder', 'extensibility'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Why a toy game is a real test</h2>
        <p>Parking Lot (Days 41–42) was a <em>design</em> round: talk, diagram, then code a core. Tic-tac-toe
          is usually a <strong>machine-coding</strong> round: working code, end to end, in 30–45 minutes. The
          domain is deliberately tiny so that NOTHING hides your habits:</p>
        <Code html={`  WHAT THE TINY DOMAIN EXPOSES (the real rubric)

  "it works"            ← entry ticket, not the grade
  clean model           ← Board ≠ Game ≠ Player ≠ rendering (Day 11 splits)
  guarded moves         ← illegal input throws, loudly, BEFORE state changes
  the follow-ups        ← "N×N?" · "3 players?" · "win check without scanning?"
                          "undo?" · "AI player?"  — each lands in ~5 spare minutes
                          IF the axis was a parameter, and in a rewrite if not

  The toy is the trap: code it like a toy, and the follow-ups eat you.
  Code it like a referee + a field + players, and they're one-liners.`} />
        <Note><strong>Today's cast, used all page:</strong> the <strong>Board</strong> is the field (it knows
          its cells and nothing else), the <strong>Game</strong> is the referee (whistle for bad moves,
          scoreboard for wins, queue for turns), and <strong>Players</strong> are just people with a symbol —
          and later, a brain.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Sixty seconds of scope, then the entity pass</h2>
        <p>Even a toy gets the Day 41 ritual — compressed. Four questions, four answers, locked:
          board size? <em>N×N, default 3.</em> Players? <em>2 now, design for more.</em> Win rule?
          <em> Full row, column or diagonal.</em> Undo/AI? <em>Out of scope, but expect the follow-up.</em>
          Now the noun-verb pass:</p>
        <Code html={`  NOUNS → ENTITIES                          VERBS → METHODS
  board, cell, grid    → Board (owns char[][])     place a mark   → board.place(r,c,sym)
  player, symbol       → record Player(name,sym)   make a move    → game.move(player,r,c)
  game, match, referee → Game (rules + turns)      check win/draw → inside Game, per move
  turn, turn order     → Deque<Player> in Game     render board   → NOT the Game's job (a
  result, win, draw    → enum Status               printer/UI reads cells via board.at)

  FILTERED OUT (Day 10 buckets):  "the grid lines" (rendering), "the X shape"
  (it's a char), "the match history" (YAGNI until asked — but undo gets a slot)`} />
        <p>Notice <C>Status</C> is an enum (closed set: <C>IN_PROGRESS, WON, DRAW</C> — the compiler should
          know all three) while the player's symbol is plain <strong>data</strong> (open set — a third player
          may join). That contrast is Day 19's open-set rule, and interviewers love hearing it named.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The bricks: Player and Board (the field guards itself)</h2>
        <Code html={`<span class="kw">public record</span> Player(String name, <span class="kw">char</span> symbol) {}   <span class="cm">// players are DATA — an open set (Day 19)</span>

<span class="kw">public class</span> Board {
    <span class="kw">public static final char</span> EMPTY = <span class="str">'.'</span>;        <span class="cm">// one named empty marker — not null, not magic ' '</span>

    <span class="kw">private final int</span> n;                          <span class="cm">// N×N — the size is a PARAMETER, never a habit</span>
    <span class="kw">private final char</span>[][] grid;                  <span class="cm">// 🔒 private — nobody pokes cells directly</span>

    <span class="kw">public</span> Board(<span class="kw">int</span> n) {
        <span class="kw">if</span> (n &lt; <span class="num">3</span>) <span class="kw">throw new</span> IllegalArgumentException(<span class="str">"board must be at least 3x3"</span>);
        <span class="kw">this</span>.n = n;
        <span class="kw">this</span>.grid = <span class="kw">new char</span>[n][n];
        <span class="kw">for</span> (<span class="kw">char</span>[] row : grid) Arrays.fill(row, EMPTY);  <span class="cm">// born all-empty</span>
    }

    <span class="kw">public int</span> size() { <span class="kw">return</span> n; }
    <span class="kw">public boolean</span> inBounds(<span class="kw">int</span> r, <span class="kw">int</span> c) { <span class="kw">return</span> r &gt;= <span class="num">0</span> &amp;&amp; r &lt; n &amp;&amp; c &gt;= <span class="num">0</span> &amp;&amp; c &lt; n; }
    <span class="kw">public boolean</span> isEmptyAt(<span class="kw">int</span> r, <span class="kw">int</span> c) { <span class="kw">return</span> grid[r][c] == EMPTY; }
    <span class="kw">public char</span> at(<span class="kw">int</span> r, <span class="kw">int</span> c) { <span class="kw">return</span> grid[r][c]; }  <span class="cm">// read ONE cell — never hand out the array (Day 2)</span>

    <span class="kw">public void</span> place(<span class="kw">int</span> r, <span class="kw">int</span> c, <span class="kw">char</span> symbol) {
        <span class="kw">if</span> (!inBounds(r, c)) <span class="kw">throw new</span> IllegalArgumentException(<span class="str">"off the board: ("</span> + r + <span class="str">","</span> + c + <span class="str">")"</span>);
        <span class="kw">if</span> (!isEmptyAt(r, c)) <span class="kw">throw new</span> CellTakenException(r, c);  <span class="cm">// the FIELD owns this rule</span>
        grid[r][c] = symbol;                       <span class="cm">// the only line in the program that writes a cell</span>
    }
}`} />
        <Warn><strong>No <C>getGrid()</C>. Ever.</strong> Returning the raw <C>char[][]</C> gives every caller
          a back door: they can write cells with no bounds check, no occupancy check, and the referee's
          scoreboard (coming in Section 5) silently rots. Day 2's rule in one sentence: every write goes
          through <C>place()</C>, reads go through <C>at()</C>.</Warn>
        <Reveal summary="Bonus: why a char and not an enum Mark { X, O, EMPTY }?">
          <p>An enum <C>Mark</C> is a fine answer for a fixed two-player game — and many model solutions use
            it. We chose <C>char</C> because we committed to "design for more players": symbols arrive at
            runtime, and an enum cannot grow at runtime (Day 19's closed-set rule, pointing the other way).
            What matters in the interview is that you <em>name the trade</em>: enum = compiler-checked,
            closed; char-on-Player = open, but the Board can no longer type-check marks. Either is defensible
            out loud; only silence is wrong.</p>
        </Reveal>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🎮 Play: the referee at work</h2>
        <p>The full design, running. Before you click: predict what happens to the turn queue when you switch
          to 3 players — and whether anyone can even win 3-players-on-3×3:</p>
        <PlayableGame />
        <Good><strong>What you should notice:</strong> ① Switching 3×3 → 4×4 changed <em>nothing</em> about the
          rules code — N was a constructor argument, so the same loops just run longer. ② The turn queue
          rotates: mover to the back — that one mechanism handled 2 and 3 players identically. ③ Draws are
          detected by <C>movesPlayed == n×n</C>, a counter — no board scan, a habit you'll reuse in
          Section 5.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Win-checking: from 8 hardcoded ifs to a scoreboard</h2>
        <p>Here is the ladder every interviewer walks you up. Rung 1 — the version we all wrote at 14:</p>
        <Code html={`<span class="cm">// RUNG 1 — welded to 3×3. It "works". It cannot grow.</span>
<span class="kw">boolean</span> xWins =
    g[<span class="num">0</span>][<span class="num">0</span>]==<span class="str">'X'</span> &amp;&amp; g[<span class="num">0</span>][<span class="num">1</span>]==<span class="str">'X'</span> &amp;&amp; g[<span class="num">0</span>][<span class="num">2</span>]==<span class="str">'X'</span> ||  <span class="cm">// row 0</span>
    g[<span class="num">1</span>][<span class="num">0</span>]==<span class="str">'X'</span> &amp;&amp; g[<span class="num">1</span>][<span class="num">1</span>]==<span class="str">'X'</span> &amp;&amp; g[<span class="num">1</span>][<span class="num">2</span>]==<span class="str">'X'</span> ||  <span class="cm">// row 1</span>
    <span class="cm">// …6 more lines, ×2 players = 16 conditions. "Now make it 4×4."</span>
    <span class="cm">// You are now WRITING 20 conditions, live, while the clock runs. 💀</span>`} />
        <p>Rung 2 — two upgrades at once. Loops make N a parameter; and since a move changes <em>one</em> cell,
          only the (at most) <strong>4 lines through that cell</strong> can have become a win:</p>
        <Code html={`<span class="cm">// RUNG 2 — N×N, and only the lines through the LAST MOVE (r,c). O(n) per move.</span>
<span class="kw">private boolean</span> wonAt(<span class="kw">char</span> s, <span class="kw">int</span> r, <span class="kw">int</span> c) {
    <span class="kw">boolean</span> row = <span class="kw">true</span>, col = <span class="kw">true</span>;
    <span class="kw">boolean</span> diag = (r == c), anti = (r + c == n - <span class="num">1</span>);   <span class="cm">// is (r,c) even ON a diagonal?</span>
    <span class="kw">for</span> (<span class="kw">int</span> i = <span class="num">0</span>; i &lt; n; i++) {
        row  &amp;= board.at(r, i) == s;                   <span class="cm">// walk my row…</span>
        col  &amp;= board.at(i, c) == s;                   <span class="cm">// …my column…</span>
        <span class="kw">if</span> (diag) diag &amp;= board.at(i, i) == s;         <span class="cm">// …and the diagonals, only if I'm on them</span>
        <span class="kw">if</span> (anti) anti &amp;= board.at(i, n - <span class="num">1</span> - i) == s;
    }
    <span class="kw">return</span> row || col || diag || anti;                 <span class="cm">// ≤4 lines checked — not all 2n+2</span>
}`} />
        <p>Rung 3 — the scoreboard. A cricket scoreboard never recounts every ball; it keeps
          <strong> running totals</strong>. Same idea: per player, keep a tally for each row, each column, and
          the two diagonals. A move increments at most four tallies — and a tally reaching <C>n</C>
          <em> is</em> the win announcement. <strong>O(1) per move</strong>, no board reads at all:</p>
        <Code html={`<span class="cm">// RUNG 3 — the scoreboard: O(1) per move, memory O(players × n).</span>
<span class="kw">class</span> Tally { <span class="kw">int</span>[] row; <span class="kw">int</span>[] col; <span class="kw">int</span> diag, anti; }   <span class="cm">// one per player</span>

<span class="kw">boolean</span> recordAndCheck(<span class="kw">char</span> s, <span class="kw">int</span> r, <span class="kw">int</span> c) {
    Tally t = tallies.get(s);
    t.row[r]++;                                <span class="cm">// my row gained one of my marks</span>
    t.col[c]++;                                <span class="cm">// so did my column</span>
    <span class="kw">if</span> (r == c)         t.diag++;          <span class="cm">// on the main diagonal? tick it</span>
    <span class="kw">if</span> (r + c == n - <span class="num">1</span>) t.anti++;          <span class="cm">// on the anti-diagonal? tick it</span>
    <span class="kw">return</span> t.row[r] == n || t.col[c] == n || t.diag == n || t.anti == n;
    <span class="cm">// ⚠ increment ALL four FIRST, then compare — fold the ++ into a short-circuiting</span>
    <span class="cm">//   ||-chain and a row-win SKIPS the col/diag increments… and undo inherits lies.</span>
}`} />
        <Code html={`  THE SCOREBOARD, DRAWN (X about to win row 1 on a 3×3)

        col0 col1 col2          X's tallies          O's tallies
       ┌────┬────┬────┐      row [ 0, 2, 0 ] ←!    row [ 1, 0, 1 ]
  row0 │ O  │ ·  │ ·  │      col [ 1, 1, 0 ]      col [ 1, 0, 1 ]
       ├────┼────┼────┤      diag  1               diag  0
  row1 │ X  │ X  │ →  │      anti  1               anti  1
       ├────┼────┼────┤
  row2 │ ·  │ ·  │ O  │      X plays (1,2):  row[1]++  → 3 == n  🏆 WIN
       └────┴────┴────┘      work done: 4 increments. Board cells read: ZERO.`} />
        <Note><strong>The ladder is the answer script:</strong> start by SAYING rung 2 ("loops, and only lines
          through the last move"), code it, and when the interviewer asks "can you do better?", deliver rung 3
          with its price tag: O(1) time, O(P·n) extra memory, and one breaking point you'll meet in
          Section 9.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>⚡ Play: the scoreboard never recounts</h2>
        <p>Play a quick game and keep one eye on the tallies — only four of them can move per click. The three
          meters track how many board cells each rung of the ladder would have read by now:</p>
        <TallyLens />
        <Good><strong>What you should notice:</strong> ① Each click moves at most 4 tallies — row, col, and
          diagonals only when the cell sits on one (corner and center clicks move more than edge clicks!).
          ② The win banner names the exact tally that hit 3 — the scoreboard announced it; nobody re-read the
          board. ③ After a full 9-move draw, the meters read 216 vs 108 vs 36 — and that gap is per GAME on a
          3×3; imagine 15×15.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The referee: Game = guards + scoreboard + queue</h2>
        <p>Everything assembles here. Read the guard order first, then the happy path — and note
          <strong> win is checked before draw</strong>:</p>
        <Code html={`  move(p, r, c) — THE REFEREE'S WHISTLE LADDER (order matters!)

  ① status == IN_PROGRESS ?    else → GameOverException      (no zombie games)
  ② (r,c) inside the board ?   else → IllegalArgumentException
  ③ p is the current player ?  else → NotYourTurnException   (queue's front = whose turn)
  ④ cell (r,c) empty ?         else → CellTakenException     (the BOARD throws this one)
  ─────────────────────────────────────────────────────────────
  ✓ place the mark  →  tally it  →  WON? (check FIRST!)  →  full ⇒ DRAW  →  rotate queue`} />
        <Code html={`<span class="kw">public class</span> Game {
    <span class="kw">public enum</span> Status { IN_PROGRESS, WON, DRAW }   <span class="cm">// closed set → enum (compare: symbols = open → data)</span>

    <span class="kw">private final</span> Board board;
    <span class="kw">private final</span> Deque&lt;Player&gt; turns;              <span class="cm">// front = current player; works for 2 or 10 players</span>
    <span class="kw">private final</span> WinChecker checker;               <span class="cm">// owns the tallies from Section 5</span>
    <span class="kw">private</span> Status status = Status.IN_PROGRESS;
    <span class="kw">private</span> Player winner;
    <span class="kw">private int</span> movesPlayed = <span class="num">0</span>;                    <span class="cm">// draw detection = a counter, not a scan</span>

    <span class="kw">public</span> Game(<span class="kw">int</span> n, List&lt;Player&gt; players) {
        <span class="kw">this</span>.board = <span class="kw">new</span> Board(n);
        <span class="kw">this</span>.turns = <span class="kw">new</span> ArrayDeque&lt;&gt;(players);    <span class="cm">// joining order = turn order</span>
        <span class="kw">this</span>.checker = <span class="kw">new</span> WinChecker(n, players);
    }

    <span class="kw">public void</span> move(Player p, <span class="kw">int</span> r, <span class="kw">int</span> c) {
        <span class="kw">if</span> (status != Status.IN_PROGRESS)            <span class="cm">// ① the game is over — no move is legal</span>
            <span class="kw">throw new</span> GameOverException(status, winner);
        <span class="kw">if</span> (!board.inBounds(r, c))                   <span class="cm">// ② off the field</span>
            <span class="kw">throw new</span> IllegalArgumentException(<span class="str">"off the board"</span>);
        <span class="kw">if</span> (!p.equals(turns.peekFirst()))            <span class="cm">// ③ not your turn — cheating throws</span>
            <span class="kw">throw new</span> NotYourTurnException(p, turns.peekFirst());
        board.place(r, c, p.symbol());               <span class="cm">// ④ occupied? the board itself throws</span>

        movesPlayed++;
        <span class="kw">if</span> (checker.recordAndCheck(p.symbol(), r, c)) {  <span class="cm">// WIN — checked FIRST…</span>
            status = Status.WON; winner = p; <span class="kw">return</span>;
        }
        <span class="kw">if</span> (movesPlayed == board.size() * board.size()) { <span class="cm">// …THEN draw. Swap these = stolen wins</span>
            status = Status.DRAW; <span class="kw">return</span>;
        }
        turns.offerLast(turns.pollFirst());          <span class="cm">// rotate: the mover goes to the back of the queue</span>
    }
}`} />
        <Good><strong>Three habits to point at out loud:</strong> guards run <em>before</em> any state changes
          (a rejected move leaves zero fingerprints); the win/draw <em>order</em> is a rule, not a style
          choice; and the queue rotation is the entire "multi-player support" — one line, no player count
          anywhere.</Good>
        <Reveal summary="Bonus: where is the rendering? Where is System.out?">
          <p>Not in <C>Game</C>, and that is deliberate (Day 11): the referee enforces rules — it does not
            draw ASCII art or parse <C>stdin</C>. A thin <C>ConsoleRunner</C> owns the loop: read input → call
            <C> game.move(...)</C> → catch the guard exceptions and print friendly messages → render via
            <C> board.at(r,c)</C>. Result: <C>Game</C> is testable with plain JUnit — no fake consoles, no
            captured output streams. "Rules in one class, I/O in another" is worth saying in the first minute.</p>
        </Reveal>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🛡 Play: the guard gauntlet</h2>
        <p>A mid-game position, five hopeful moves, four guards. Predict which ladder line each button hits —
          then find the sequence that ends the game and watch guard ① seal it:</p>
        <GuardGauntlet />
        <Good><strong>What you should notice:</strong> ① The same button gives different outcomes as the state
          changes — "X → (2,2)" is cheating at first, legal (and lethal) after O moves. ② Guard ④ lives in the
          Board, the rest in the Game: each rule sits with its owner. ③ After the win, every path leads to
          guard ① — a finished game cannot be poked back to life.</Good>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>The follow-ups: five extensions, five small answers</h2>
        <p>This is why the modeling mattered. Each classic follow-up lands in a slot that already exists:</p>
        <table className="matrix">
          <thead>
            <tr><th>follow-up</th><th>where it lands</th><th>tool</th></tr>
          </thead>
          <tbody>
            <tr><td>"Make it N×N"</td><td>already done — N is a constructor argument</td><td>parameter, not habit</td></tr>
            <tr><td>"Three players"</td><td>one more Player in the list; queue just rotates</td><td>Deque rotation</td></tr>
            <tr><td>"Undo the last move"</td><td>a stack of moves; pop → clear cell, decrement the 4 tallies, movesPlayed−−, rotate back</td><td>Command, Day 33</td></tr>
            <tr><td>"AI opponent"</td><td>MoveStrategy on the Player; loop asks brain.nextMove(view)</td><td>Strategy, Day 31</td></tr>
            <tr><td>"K-in-a-row (gomoku)"</td><td>⚠ the tallies BREAK — see below</td><td>directional scan</td></tr>
          </tbody>
        </table>
        <Code html={`<span class="cm">// "AI player" in three lines of structure — the loop never changes:</span>
<span class="kw">public interface</span> MoveStrategy { <span class="kw">int</span>[] nextMove(BoardView view); }   <span class="cm">// returns {row, col}</span>
<span class="kw">public record</span> Player(String name, <span class="kw">char</span> symbol, MoveStrategy brain) {}
<span class="cm">// implementations: HumanConsoleInput · RandomLegalMove · MinimaxStrategy — Day 31, again</span>

<span class="cm">// "Undo" as an inverse operation (Day 33's cheap kind — no snapshots needed):</span>
<span class="kw">void</span> undo() {
    Move last = history.pop();                  <span class="cm">// what was done…</span>
    board.clear(last.r(), last.c());            <span class="cm">// …un-place the mark</span>
    checker.unrecord(last.symbol(), last.r(), last.c());  <span class="cm">// decrement the SAME four tallies</span>
    movesPlayed--;
    status = Status.IN_PROGRESS; winner = <span class="kw">null</span>;   <span class="cm">// un-win, un-draw</span>
    turns.offerFirst(turns.pollLast());         <span class="cm">// rotate the queue BACKWARD one step</span>
}`} />
        <Warn><strong>Where the scoreboard breaks — say this before they do:</strong> the tally trick assumes
          win-length <strong>K equals board size N</strong>. In gomoku ("5 in a row on 15×15"), K &lt; N — and
          a row tally of 5 means "five of my marks <em>somewhere</em> in this row", NOT five <em>consecutive</em>.
          The honest fix: from the last move, walk the four directions (—, |, \, /) up to K−1 steps each way
          and count the run — O(K) per move. Knowing your optimization's breaking point is the
          difference between memorizing a trick and owning it.</Warn>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps — graded down in real rounds</h2>
        <Warn><strong>Draw checked before win.</strong> The 9th move completes a row AND fills the board — and
          your referee calls it a draw. One test case ("winning final move") catches it; most submissions
          don't have that test.</Warn>
        <Warn><strong>The 8-if win check.</strong> Works until the first follow-up, then you hand-write 20
          conditions for 4×4 while the interviewer watches the clock. Loops keyed on N from the start — it is
          not even more code.</Warn>
        <Warn><strong>Full-board scan every move.</strong> Scanning all 2n+2 lines when only ≤4 pass through
          the cell that changed. Even if you skip the tally trick, "lines through the last move" is the
          free win.</Warn>
        <Warn><strong>getGrid() exposing the array.</strong> One caller writes a cell directly and the
          tallies, movesPlayed and status all silently disagree with the board. Reads via <C>at(r,c)</C>,
          writes via <C>place()</C> — no exceptions to the rule, that's what makes it a rule.</Warn>
        <Warn><strong>The god Game class.</strong> Rules + Scanner parsing + ASCII rendering + a main() in one
          file. It runs — and it cannot be unit-tested without faking stdin (Day 11: three reasons to change,
          one class). Referee, board, runner: three files, ten extra minutes, double the score.</Warn>
        <Warn><strong>Statics everywhere.</strong> A <C>static char[][] board</C> means exactly one game per
          JVM — the "run two games" follow-up (or just your second unit test!) breaks instantly. Day 21's
          verdict: instances, wired at the root.</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Cast:</strong> Board = the field (cells + place-guards) · Game = the referee (status, turn queue, win/draw) · Player = data + (later) a MoveStrategy brain · rendering/input = a separate runner.</li>
          <li><strong>Guard ladder, in order:</strong> game over → bounds → turn → occupied; all BEFORE any state changes. Then: place → tally → <em>win first, draw second</em> → rotate queue.</li>
          <li><strong>Win-check ladder:</strong> ① 8 ifs (never) → ② loops over the ≤4 lines through the last move, O(n) → ③ per-player tallies (row/col/diag/anti), O(1) time, O(P·n) memory.</li>
          <li><strong>Tally fine print:</strong> increment all four before comparing (no short-circuit ++); valid only while K == N — gomoku needs a ±(K−1) directional scan instead.</li>
          <li><strong>Counters over scans:</strong> draw = <C>movesPlayed == n×n</C>; win = tally hits n. The board is written once per move and read only for rendering.</li>
          <li><strong>Open vs closed sets (Day 19):</strong> Status {'{'}IN_PROGRESS, WON, DRAW{'}'} = closed = enum. Players & symbols = open = data on a record.</li>
          <li><strong>Follow-up slots:</strong> N = constructor arg · players = queue · undo = move stack + tally decrements (Day 33) · AI = MoveStrategy (Day 31).</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Can you check the win WITHOUT scanning the board?" (the famous one)'>
          <p>Yes — running tallies per player: an int per row, per column, plus diag and anti-diag. Each move
            increments at most four; any tally reaching n is the win. O(1) per move, O(P·n) memory — and the
            price tag you must volunteer: it only works because win-length equals board size. The
            interviewer's follow-up is usually gomoku, and now you've answered it pre-emptively.</p>
        </Reveal>
        <Reveal summary='Q: "Implement undo. Command or Memento?" (Days 33 & 39 meet a toy)'>
          <p>Command-style inverse, no contest here: a move's inverse is trivially computable (clear the cell,
            decrement the same four tallies, movesPlayed−−, rotate the queue backward, reset status). Memento
            snapshots of the whole board would COPY n² cells per move to enable an undo that needs only one.
            The general rule from Day 33: cheap inverse → Command; expensive/impossible inverse → Memento.
            Here the inverse costs four decrements.</p>
        </Reveal>
        <Reveal summary='Q: "Where does isDraw() come from? Show me the cheapest correct version."'>
          <p><C>movesPlayed == n*n</C> after the win check returned false. One counter, zero scans — and the
            "after the win check" clause is the actual test of understanding (the winning-final-move bug).
            Bonus depth if asked "can a draw be known EARLIER?": yes — when no empty line can still be
            completed by anyone — but detecting that is real work and absolutely YAGNI for this round; saying
            "possible, out of scope" is the right move.</p>
        </Reveal>
        <Reveal summary='Q: "How do I run two games at the same time in one JVM?"'>
          <p><C>new Game(3, players1)</C> and <C>new Game(4, players2)</C> — done, because nothing is static
            and there is no singleton. If your draft has <C>static board</C> anywhere, this one-line question
            is its execution. (Day 21's lesson wearing a toy costume — it is also why your unit tests can each
            build a fresh game.)</p>
        </Reveal>
        <Reveal summary='Q: "Empty cell: null, Optional&lt;Mark&gt;, or an EMPTY constant?"'>
          <p>A named EMPTY constant (or an EMPTY enum member if you went the enum route). <C>null</C> spreads
            NPE risk into every comparison and prints as "null"; <C>Optional</C> in a 2-D array is heavyweight
            wrapping for a hot, simple grid (and Optional is designed for return types, not fields). EMPTY is
            the Null-Object idea at its smallest: a real value meaning "nothing", safe to compare and print.</p>
        </Reveal>
        <Reveal summary='Q: "Player X disconnects mid-game (online version). What changes?"'>
          <p>Surprisingly little, and that's the point to make: a game-level policy decision — forfeit
            (status WON, other player wins), or pause (a new Status member: the enum grows, the switch sites
            get compiler-checked, Day 19's payoff). The turn queue just removes or skips the player. The
            board, tallies and guards don't change at all — state machine extensions land in the state
            machine.</p>
        </Reveal>
        <Reveal summary='Q: "Sketch the minimax AI in 60 seconds — structure, not algorithm."'>
          <p>One class: <C>MinimaxStrategy implements MoveStrategy</C>. It needs to TRY moves — so it works on
            a copy of the board (or uses place/undo pairs on its own scratch game), never on the live one.
            Recursion: my best move = the move minimizing the opponent's best reply; 3×3 is small enough to
            search fully. The design sentence that scores: "it plugs into Player.brain — the referee, loop and
            guards don't know minimax exists."</p>
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
        <strong>Day 43 complete?</strong> Homework: build the whole game as a console app — <C>Board</C>,
        <C> Game</C> with the four-guard ladder, <C>Deque</C> turn rotation, and the <strong>tally</strong>
        win-checker (rung 3). Then prove it with three JUnit tests, no console needed: ① a winning FINAL move
        reports WON, not DRAW; ② a move after the win throws <C>GameOverException</C>; ③ undo after a win
        restores IN_PROGRESS and the exact tallies (decrements, not recomputation). Stretch goal: a
        <C> RandomLegalMove</C> strategy and let two bots finish a 4×4 game.
        <br /><br />
        Next: <strong>Day 44 — Snake &amp; Ladder</strong>: dice as a strategy (fair? loaded? two dice?),
        snakes and ladders unified as one "jumper" concept, and the game-loop skeleton you'll reuse for every
        turn-based game after this.
      </div>
    </div>
  )
}
