import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: piece movement ============ */
const R0 = 4, C0 = 4   // the selected piece sits at (4,4)
const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8
function movesFor(type) {
  const move = new Set(), cap = new Set()
  const add = (s, r, c) => { if (inb(r, c)) s.add(r + ',' + c) }
  if (type === 'Rook' || type === 'Queen') { for (let i = 0; i < 8; i++) { if (i !== C0) add(move, R0, i); if (i !== R0) add(move, i, C0) } }
  if (type === 'Bishop' || type === 'Queen') { for (let d = -7; d <= 7; d++) { if (d) { add(move, R0 + d, C0 + d); add(move, R0 + d, C0 - d) } } }
  if (type === 'Knight') { [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]].forEach(([dr, dc]) => add(move, R0 + dr, C0 + dc)) }
  if (type === 'King') { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) add(move, R0 + dr, C0 + dc) }
  if (type === 'Pawn') { add(move, R0 - 1, C0); add(cap, R0 - 1, C0 - 1); add(cap, R0 - 1, C0 + 1) }
  return { move, cap }
}
const GLYPH = { King: '♚', Queen: '♛', Rook: '♜', Bishop: '♝', Knight: '♞', Pawn: '♟' }
const RULE = {
  King: 'one square in any direction',
  Queen: 'any number of squares straight OR diagonal (rook + bishop)',
  Rook: 'any number of squares straight (ranks & files)',
  Bishop: 'any number of squares diagonally',
  Knight: 'an L-shape (2+1) — and the ONLY piece that jumps over others',
  Pawn: 'forward one (two from start), captures diagonally — direction depends on color',
}

function PieceMovement() {
  const [type, setType] = useState('Queen')
  const { move, cap } = movesFor(type)
  return (
    <div className="panel">
      <div className="ptitle">Live demo · each piece knows its OWN movement rule — pick one and see its reachable squares</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {Object.keys(GLYPH).map((t) => <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>{GLYPH[t]} {t}</button>)}
      </div>
      <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(8, 32px)', gap: 0, border: '2px solid var(--ink)', marginBottom: 10 }}>
        {[...Array(64)].map((_, i) => {
          const r = Math.floor(i / 8), c = i % 8
          const dark = (r + c) % 2 === 1
          const here = r === R0 && c === C0
          const isMove = move.has(r + ',' + c)
          const isCap = cap.has(r + ',' + c)
          return (
            <div key={i} style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              background: here ? '#FFF1D6' : isCap ? '#FDD' : isMove ? '#D7EFE0' : dark ? '#E8E4D8' : '#FAFAF7',
            }}>
              {here ? GLYPH[type] : isCap ? '⊗' : isMove ? '•' : ''}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, fontFamily: 'IBM Plex Mono', fontSize: 10.5, color: '#7c8aa5', marginBottom: 8, flexWrap: 'wrap' }}>
        <span>{GLYPH[type]} piece</span><span>• move</span><span>⊗ capture square</span>
      </div>
      <div className="statbar" style={{ display: 'block' }}><span style={{ fontSize: 12.5 }}><b>{type}:</b> {RULE[type]}. (Shown on an empty board — real moves also stop at the first piece in the way, except the Knight.)</span></div>
      <Good style={{ marginTop: 10 }}><span style={{ fontSize: 12.5 }}>Six pieces, six totally different rules — yet the board calls them ALL the same way (<C>piece.legalMoves(board, from)</C>). That polymorphism is the heart of a clean chess design: NO giant switch on piece type.</span></Good>
    </div>
  )
}

/* ============ Interactive 2: the move-validation pipeline ============ */
const VAL_SCEN = {
  legal: { label: 'Rook d1→d5 (clear file)', fails: -1, note: 'A textbook-legal move: correct geometry, clear path, empty destination, and it doesn\'t expose the king. It passes ALL four stages and is applied.' },
  geometry: { label: 'Rook d1→f3 (diagonal)', fails: 0, note: 'A rook moves only in straight lines — d1→f3 is diagonal. REJECTED at stage 1 (the piece\'s own movement rule). The board never even checks the path.' },
  path: { label: 'Rook d1→d5 (a pawn on d3)', fails: 1, note: 'Geometry is fine (a straight file), but a piece sits on d3 in the way. REJECTED at stage 2 — rooks can\'t jump (only the knight can).' },
  dest: { label: 'Rook d1→d5 (own piece on d5)', fails: 2, note: 'Geometry and path are clear, but YOUR OWN piece occupies d5. REJECTED at stage 3 — you can land on an empty square or capture an ENEMY, never your own piece.' },
  check: { label: 'Bishop moves, but it\'s pinned', fails: 3, note: 'The move is geometrically legal, path clear, destination fine — but the bishop was shielding your king, so moving it leaves your king in CHECK. REJECTED at stage 4, the global rule that overrides all local ones.' },
}
const VAL_STAGES = ['① piece geometry (its own rule)', '② path is clear (except Knight)', '③ destination empty or enemy', '④ does NOT leave your king in check']

function ValidationPipeline() {
  const [scen, setScen] = useState('check')
  const sc = VAL_SCEN[scen]
  return (
    <div className="panel">
      <div className="ptitle">Live demo · validating a move is a 4-stage pipeline — pick a move and see where it stops</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {Object.entries(VAL_SCEN).map(([k, v]) => <button key={k} className={scen === k ? 'on' : ''} style={{ fontSize: 11.5 }} onClick={() => setScen(k)}>{v.label}</button>)}
      </div>
      <div style={{ background: '#F4F3EE', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
        {VAL_STAGES.map((s, i) => {
          const passed = sc.fails === -1 || i < sc.fails
          const failed = sc.fails === i
          return (
            <div key={i} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 12, padding: '3px 6px', borderRadius: 4,
              background: failed ? '#FDECEC' : passed ? '#EAF7EF' : 'transparent',
              color: failed ? 'var(--red)' : passed ? 'var(--green)' : '#bbb', fontWeight: failed ? 700 : 400,
            }}>{failed ? '✗ ' : passed ? '✓ ' : '· '}{s}</div>
          )
        })}
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, padding: '3px 6px', marginTop: 2, color: sc.fails === -1 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
          {sc.fails === -1 ? '✅ move APPLIED' : '🚫 move REJECTED at stage ' + (sc.fails + 1)}
        </div>
      </div>
      <div className="statbar" style={{ display: 'block' }}><span style={{ fontSize: 12.5 }}>{sc.note}</span></div>
    </div>
  )
}

/* ============ Interactive 3: check / checkmate / stalemate ============ */
const END = {
  check: { label: 'Check', color: '#FFF1D6', text: 'Your king is ATTACKED right now. You MUST respond this turn — block the attack, capture the attacker, or move the king to safety. The game continues; you simply have no other legal choice.' },
  checkmate: { label: 'Checkmate (you lose)', color: '#FDECEC', text: 'Your king is in check AND no legal move escapes it (can\'t block, capture, or run). The game ends — the attacker wins. Checkmate = in check + zero legal moves.' },
  stalemate: { label: 'Stalemate (draw)', color: '#E5EBFF', text: 'You are NOT in check, but you have NO legal move at all. The game is a DRAW. The only difference from checkmate is whether the king is currently attacked — same "no legal moves", opposite outcome.' },
}

function CheckStates() {
  const [s, setS] = useState('checkmate')
  const e = END[s]
  return (
    <div className="panel">
      <div className="ptitle">Live demo · the three "no good moves" endings — they differ by ONE condition</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {Object.entries(END).map(([k, v]) => <button key={k} className={s === k ? 'on' : ''} onClick={() => setS(k)}>{v.label}</button>)}
      </div>
      <Code html={`  king in check?   has a legal move?   →  result
  ─────────────────────────────────────────────
       YES               YES            →  CHECK (must respond)
       YES               NO             →  CHECKMATE (lose)
       NO                NO             →  STALEMATE (draw)
       NO                YES            →  normal play`} />
      <div className="statbar" style={{ display: 'block', background: e.color, marginTop: 10 }}><span style={{ fontSize: 13 }}><b>{e.label}:</b> {e.text}</span></div>
      <Note style={{ marginTop: 10 }}><span style={{ fontSize: 12.5 }}>All three are computed the same way: generate the side\'s legal moves (already filtered by "doesn\'t leave my king in check") and ask "is the set empty?" plus "is the king attacked?". Two booleans, four outcomes.</span></Note>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'How should the six piece types\' movement be modeled?',
    o: ['A switch on pieceType in the board', 'Polymorphism / Strategy: an abstract Piece (or a MovementStrategy) where each concrete piece implements its OWN legalMoves(board, from) — the board treats them uniformly, no type switch', 'One Piece class with flags', 'Six unrelated classes'], a: 1,
    e: 'Each piece has genuinely different BEHAVIOR (rook=straight, bishop=diagonal, knight=L-jump). That\'s polymorphism: an abstract Piece with per-type movement. A switch on type is the Day-12 growing-switch smell; adding a variant (fairy chess) reopens it.',
    w: { 0: 'A type switch scatters movement logic and reopens for every piece.', 2: 'Flags can\'t express six distinct move rules cleanly.', 3: 'Unrelated classes can\'t be handled uniformly by the board.' },
    r: { id: 's3', label: 'Section 3 — movement as strategy' } },
  { q: 'The four-stage move-validation pipeline, in order?',
    o: ['Random checks', '① the piece\'s own geometry → ② the path is clear (except Knight) → ③ the destination is empty or an enemy → ④ the move does NOT leave your own king in check', 'Just "is the square empty?"', 'Only check detection'], a: 1,
    e: 'Validation layers from local to global: is it a legal shape for THIS piece, is nothing blocking, is the target capturable, and finally the global rule — you may never make a move that leaves your own king in check.',
    w: { 0: 'It\'s an ordered pipeline.', 2: 'Empty-square is just stage 3.', 3: 'Check is the LAST stage, atop the others.' },
    r: { id: 's5', label: 'Section 5 — validation pipeline' } },
  { q: 'Why is "does not leave your own king in check" the hardest validation rule?',
    o: ['It is not', 'It is GLOBAL, not local: you must simulate the move, then ask whether ANY enemy piece now attacks your king — so a geometrically legal move can still be illegal (a PINNED piece can\'t move)', 'It needs the database', 'Only the king obeys it'], a: 1,
    e: 'The first three checks are about one piece and the squares around it. This one depends on the WHOLE board after the move: make the move on a copy, generate enemy attacks, see if your king is attacked, undo. It\'s why pins exist.',
    w: { 0: 'It\'s the layered, global rule.', 2: 'It\'s pure board logic, no DB.', 3: 'It constrains EVERY piece (you can\'t expose your king with any move).' },
    r: { id: 's5', label: 'Section 5 — the global rule' } },
  { q: 'Castling, en passant, and pawn promotion break which simplifying assumption?',
    o: ['That the board is 8×8', 'That a piece\'s move depends only on its current square — these depend on GAME HISTORY/CONTEXT (has the king/rook moved? did a pawn just double-step? did a pawn reach the last rank?), so you need move history', 'That pieces have colors', 'Nothing'], a: 1,
    e: 'Most moves are stateless geometry, but special moves need context: castling requires the king and rook never moved and the squares are safe; en passant requires the opponent JUST double-stepped a pawn; promotion triggers on reaching the back rank. Hence a move history.',
    w: { 0: 'The board stays 8×8.', 2: 'Colors are always there.', 3: 'They genuinely need history.' },
    r: { id: 's7', label: 'Section 7 — special moves' } },
  { q: 'A Move modeled as a Command object buys you…',
    o: ['Nothing', 'Undo/redo and a move history: each Move records what it did (piece, from, to, captured piece, flags), so it can be applied and reversed — enabling undo, replay, and the history that special moves and repetition rules need (Day 33)', 'Faster rendering', 'Smaller memory'], a: 1,
    e: 'Reifying a move as an object (Command) lets you push it on a history stack, undo it (restore the captured piece, move back), redo it, and inspect the past — exactly what castling/en passant/threefold-repetition need.',
    w: { 0: 'It enables undo, history, replay.', 2: 'Rendering is unrelated.', 3: 'It adds state for the history, deliberately.' },
    r: { id: 's7', label: 'Section 7 — move as command' } },
  { q: 'Checkmate vs stalemate — the difference?',
    o: ['They are the same (a loss)', 'Both mean "no legal moves", but checkmate = your king IS in check (you lose), stalemate = your king is NOT in check (it\'s a DRAW). One boolean — is the king attacked — flips the outcome', 'Stalemate is a win', 'Checkmate is a draw'], a: 1,
    e: 'Generate the side\'s legal moves (already filtered to not expose the king). If the set is empty: in check → checkmate (lose); not in check → stalemate (draw). The "no legal moves" test is shared; the king-attacked test decides which.',
    w: { 0: 'Opposite outcomes.', 2: 'Stalemate is a draw, not a win.', 3: 'Checkmate is a loss, not a draw.' },
    r: { id: 's8', label: 'Section 8 — check states' } },
  { q: 'The Knight\'s special property the path-check must respect?',
    o: ['It moves twice', 'It JUMPS — it is the only piece that ignores pieces in between, so the "path must be clear" stage (②) is skipped for the knight (only its destination square is checked)', 'It can\'t capture', 'It moves like a queen'], a: 1,
    e: 'Every other sliding/stepping piece is blocked by the first piece in its path. The knight leaps directly to its L-shaped target, so stage 2 (clear path) doesn\'t apply — only the destination (empty or enemy) matters.',
    w: { 0: 'It moves once, in an L.', 2: 'It captures normally.', 3: 'Its move is the L-jump, not the queen\'s.' },
    r: { id: 's4', label: 'Section 4 — piece movement' } },
  { q: 'The chess GAME loop is fundamentally…',
    o: ['Unique to chess', 'The turn-based game-loop skeleton (Week 9): whose turn → get/validate a move → apply it → check end conditions (checkmate/stalemate/draw) → switch player — chess just fills the validate + end-condition slots with rich rules', 'A state machine only', 'Event-driven'], a: 1,
    e: 'Chess is the Snake-&-Ladder / Tic-Tac-Toe loop with heavy slots: the "validate move" slot is the 4-stage pipeline, the "check end" slot is checkmate/stalemate/repetition. The skeleton (turn rotation, status) is identical.',
    w: { 0: 'It reuses the Week-9 skeleton.', 2: 'It has state, but the LOOP is the structure.', 3: 'It\'s turn-based, not event-driven.' },
    r: { id: 's10', label: 'Section 10 — the game loop' } },
]

/* ============ The page ============ */
export default function Day66() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 14 · Day 66 · Advanced Problems</div>
        <h1>Chess:<br />Six Pieces, Six Strategies, One Clean Design</h1>
        <p>The richest board game there is — and a design showcase. Each piece moves by its own rule
           (polymorphism, not a switch); a move passes a four-stage validation pipeline ending in the global
           "don\'t expose your king" rule; special moves need game history; and check/checkmate/stalemate fall
           out of one question. Click everything.</p>
        <div className="chips">
          {['chess', 'movement as strategy', 'validation pipeline', 'king-in-check', 'special moves', 'checkmate vs stalemate'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Why chess is the design showcase</h2>
        <p>Tic-tac-toe (Day 43) had one move rule. Chess has six pieces with six rules, special moves that bend
          them, and a global constraint layered on top. It exercises more patterns than any other board game:</p>
        <Code html={`  WHAT MAKES CHESS RICH (and what each part teaches)

  · six pieces, six MOVEMENT rules        → polymorphism / Strategy (no type switch)
  · a move must pass several CHECKS        → a validation pipeline (local → global)
  · "never expose your own king"           → a GLOBAL rule over local moves (pins!)
  · castling / en passant / promotion      → moves that need GAME HISTORY (context)
  · undo / replay / repetition rules       → Move as a Command + a history stack
  · checkmate / stalemate / draw           → end conditions from one question
  · alternating turns                      → the Week-9 game-loop skeleton

  Get the movement polymorphism + the validation pipeline right and the rest follows.`} />
        <Note><strong>The headline decision:</strong> how to model "how each piece moves." The clean answer —
          each <C>Piece</C> owns its movement rule (polymorphism) and the board treats them all uniformly — is
          what separates an elegant chess design from a 200-line switch statement.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The entities</h2>
        <Code html={`<span class="kw">public enum</span> Color { WHITE, BLACK }

<span class="kw">public abstract class</span> Piece {
    <span class="kw">protected final</span> Color color;
    <span class="kw">protected boolean</span> hasMoved = <span class="kw">false</span>;        <span class="cm">// needed for castling & the pawn's first double-step</span>
    <span class="kw">public abstract</span> List&lt;Square&gt; legalMoves(Board board, Square from);  <span class="cm">// ← each piece's OWN rule</span>
}
<span class="kw">class</span> King <span class="kw">extends</span> Piece { … }   <span class="kw">class</span> Queen <span class="kw">extends</span> Piece { … }   <span class="cm">// Rook, Bishop, Knight, Pawn…</span>

<span class="kw">public class</span> Board { Piece[][] squares = <span class="kw">new</span> Piece[<span class="num">8</span>][<span class="num">8</span>];   <span class="cm">// null = empty</span>
    Piece at(Square s) { … }   <span class="kw">boolean</span> isEmpty(Square s) { … }   <span class="cm">// the field</span>
}
<span class="kw">public record</span> Square(<span class="kw">int</span> row, <span class="kw">int</span> col) {}
<span class="kw">public class</span> Move { Square from, to; Piece moved, captured; <span class="kw">boolean</span> castling, enPassant, promotion; }
<span class="kw">public class</span> Game { Board board; Color toMove; Deque&lt;Move&gt; history; GameStatus status; List&lt;Player&gt; players; }`} />
        <Note><strong>Same cast as every board game</strong> (Board = field, Game = referee, Player), but the
          <C> Piece</C> hierarchy is where chess\'s richness lives, and the <C>Move</C> object (with captured
          piece + flags) is what makes undo and special moves possible. <C>hasMoved</C> on each piece is the
          small piece of state castling and pawns depend on.</Note>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Movement as polymorphism (never a switch)</h2>
        <p>The wrong design hardcodes every piece\'s rule in one place; the right one lets each piece answer for
          itself:</p>
        <Code html={`<span class="cm">// ❌ the switch that grows forever (Day 12 smell):</span>
<span class="kw">switch</span> (piece.type()) {
    <span class="kw">case</span> ROOK:   <span class="cm">// straight-line logic…</span>
    <span class="kw">case</span> BISHOP: <span class="cm">// diagonal logic…</span>      <span class="cm">// add a new piece → edit this switch everywhere</span>
}

<span class="cm">// ✅ each piece owns its rule; the board calls them ALL the same way:</span>
<span class="kw">class</span> Rook <span class="kw">extends</span> Piece {
    <span class="kw">public</span> List&lt;Square&gt; legalMoves(Board b, Square from) {
        <span class="kw">return</span> slide(b, from, DIRECTIONS_STRAIGHT);   <span class="cm">// ranks & files until blocked</span>
    }
}
<span class="kw">class</span> Bishop <span class="kw">extends</span> Piece { … slide(b, from, DIRECTIONS_DIAGONAL); }
<span class="kw">class</span> Queen  <span class="kw">extends</span> Piece { … slide(b, from, ALL_EIGHT_DIRECTIONS); }   <span class="cm">// rook + bishop</span>
<span class="kw">class</span> Knight <span class="kw">extends</span> Piece { … the 8 L-shaped offsets (JUMPS — ignores blockers); }

<span class="cm">// the board / validator never asks "what type is this?" — it just calls legalMoves()</span>`} />
        <Good><strong>Sliding pieces share a helper</strong> (<C>slide</C> walks a direction until it hits the
          board edge or a piece — capturing an enemy, stopping before a friend). Rook/Bishop/Queen differ only
          in their direction set — DRY without a switch. Knight and Pawn are special-cased (jump; forward + diagonal
          capture). Adding a fairy-chess piece = one new class, nothing else touched (OCP).</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>♟ Play: piece movement</h2>
        <p>Pick each piece and see the squares its own rule reaches (on an empty board):</p>
        <PieceMovement />
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The move-validation pipeline</h2>
        <p>A move is legal only if it survives four checks, from local geometry to the global king rule:</p>
        <Code html={`  IS THIS MOVE LEGAL?  (four stages, local → global)

  ① GEOMETRY     is to ∈ piece.legalMoves(board, from)?   (the piece's own rule)
  ② PATH CLEAR   nothing blocking between from and to      (skipped for the KNIGHT — it jumps)
  ③ DESTINATION  empty, or an ENEMY piece (capture)        (never your own piece)
  ④ KING SAFE    after making the move, is YOUR king NOT in check?   ← the GLOBAL rule

  Stage ④ is special: simulate the move on a copy, generate the enemy's attacks,
  check if your king is attacked, then undo. This is why a PINNED piece — one
  shielding your king — cannot legally move even when ①–③ all pass.`} />
        <Code html={`<span class="kw">boolean</span> isLegal(Board board, Move m, Color side) {
    <span class="kw">if</span> (!m.moved().legalMoves(board, m.from()).contains(m.to())) <span class="kw">return false</span>;  <span class="cm">// ① + ② + ③</span>
    Board copy = board.apply(m);                  <span class="cm">// ④ simulate…</span>
    <span class="kw">return</span> !copy.isKingInCheck(side);             <span class="cm">// …and reject if it exposes your king</span>
}
<span class="cm">// legalMoves() already enforces path + destination; isLegal() adds the king-safety layer.</span>`} />
        <Warn><strong>The king-safety check is the whole game\'s correctness.</strong> "Generate moves, then keep
          only those that don\'t leave your king in check" is the single filter that makes pins, forced blocks,
          and check responses all work. It\'s computed by simulate-then-test (apply on a copy / apply-and-undo) —
          the Memento/Command idea (Days 33, 39) in action.</Warn>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔍 Play: the validation pipeline</h2>
        <p>Pick a move and watch which stage rejects it — including the pinned-piece case that only stage 4
          catches:</p>
        <ValidationPipeline />
        <Good><strong>What you should notice:</strong> ① Each stage is a distinct, ordered check; the move stops
          at the first it fails. ② Stages 1–3 are local (this piece, these squares); stage 4 is global (the
          whole board after the move). ③ A geometrically perfect move can still be illegal because it exposes
          the king — the layered design captures that naturally.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Special moves + Move as a Command</h2>
        <p>Most moves are stateless geometry. A few aren\'t — they depend on the game\'s HISTORY, which is why a
          Move is an object and the game keeps a history stack:</p>
        <Code html={`  MOVES THAT NEED CONTEXT (not just the current square)

  CASTLING     king + rook have NEVER moved, squares between are empty,
               and the king isn't in/through/into check  → needs piece.hasMoved
  EN PASSANT   capture a pawn that JUST double-stepped past you
               → needs the LAST move (history)
  PROMOTION    a pawn reaching the last rank becomes a Queen/Rook/Bishop/Knight
  PAWN rules   forward 1 (or 2 from start), captures only DIAGONALLY → not symmetric`} />
        <Code html={`<span class="cm">// a Move is a Command: it knows how to apply AND undo itself (Day 33)</span>
<span class="kw">class</span> Move {
    <span class="kw">void</span> apply(Board b)  { … move piece; record captured; handle castle/enpassant/promo … }
    <span class="kw">void</span> undo(Board b)   { … move back; RESTORE the captured piece; revert flags … }
}
Deque&lt;Move&gt; history;     <span class="cm">// push on apply → enables undo/redo, en passant, threefold-repetition</span>`} />
        <Good><strong>Move-as-Command earns its keep:</strong> the same object that applies a move can undo it
          (restoring the captured piece), which powers undo/redo, the simulate-then-test king check, and the
          history that en passant and repetition draws require. Special moves aren\'t exceptions bolted on —
          they\'re Moves with extra flags, applied/undone the same way.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Check, checkmate, stalemate — one question, three answers</h2>
        <p>The end conditions look intimidating but reduce to two booleans computed from the legal-move
          generator you already have:</p>
        <Code html={`  generate the side-to-move's LEGAL moves
     (legalMoves of every piece, filtered by "doesn't leave my king in check")

  inCheck = is my king attacked right now?
  hasMove = is the legal-move set non-empty?

   inCheck && !hasMove   → CHECKMATE   (you lose)
  !inCheck && !hasMove   → STALEMATE   (draw)
   inCheck &&  hasMove   → CHECK        (must respond — and your legal set is already only the responses)
  !inCheck &&  hasMove   → normal play

  (plus draw rules: threefold repetition, 50-move, insufficient material — from history)`} />
        <Note><strong>It all rests on one method:</strong> "all legal moves for this side" (movement rules +
          the king-safety filter). Checkmate, stalemate, and "are you in check?" are just queries over that. The
          GameStatus (ACTIVE / CHECK / CHECKMATE / STALEMATE / DRAW) is a small State enum updated after each
          move.</Note>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>👑 Play: check / checkmate / stalemate</h2>
        <p>Three "no good moves" situations that differ by a single condition — toggle between them:</p>
        <CheckStates />
        <Good><strong>What you should notice:</strong> ① Checkmate and stalemate are BOTH "no legal moves" — only
          "is the king in check?" tells them apart (loss vs draw). ② Check means you must respond, and your
          generated legal moves ARE exactly the valid responses. ③ All three come free once you can generate
          king-safe legal moves — no separate special-case engine.</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>The patterns map + the game loop</h2>
        <table className="matrix">
          <thead><tr><th>concern</th><th>tool</th><th>from</th></tr></thead>
          <tbody>
            <tr><td>per-piece movement</td><td>polymorphism / Strategy (abstract Piece)</td><td>Days 4 · 31</td></tr>
            <tr><td>creating the starting pieces</td><td>Factory</td><td>Day 22</td></tr>
            <tr><td>a move (apply + undo)</td><td>Command + history stack</td><td>Day 33</td></tr>
            <tr><td>king-safety / undo simulation</td><td>apply-on-copy / Memento</td><td>Day 39</td></tr>
            <tr><td>game status (active/check/mate/draw)</td><td>State enum</td><td>Day 34</td></tr>
            <tr><td>turn rotation + end checks</td><td>the turn-based game loop</td><td>Days 43 · 44</td></tr>
          </tbody>
        </table>
        <Code html={`  THE GAME LOOP (Week-9 skeleton, chess's rich slots)

  while (status == ACTIVE) {
      Move m = currentPlayer chooses a move        ← input (human / engine)
      if (!isLegal(board, m, toMove)) reject;      ← the 4-stage pipeline (rich slot)
      board.apply(m); history.push(m);             ← Command
      status = evaluate(opponent);                 ← checkmate/stalemate/draw (rich slot)
      toMove = toMove.opposite();                  ← rotate
  }`} />
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>A switch on piece type.</strong> Movement logic scattered in one growing switch — adding a
          piece edits it everywhere. Each piece owns its <C>legalMoves</C> (polymorphism).</Warn>
        <Warn><strong>Forgetting the king-safety filter.</strong> Generating geometric moves without removing
          those that leave your king in check makes pins and forced responses impossible. Simulate-then-test.</Warn>
        <Warn><strong>Special moves as afterthoughts.</strong> Castling/en passant/promotion need game history —
          model a Move object with flags and keep a history stack from the start, not bolted-on ifs.</Warn>
        <Warn><strong>Pawns treated like other pieces.</strong> Pawns are asymmetric (forward move ≠ diagonal
          capture), color-directional, double-step from start, and promote. Special-case them explicitly.</Warn>
        <Warn><strong>No undo / move object.</strong> Without a Move that can undo (restoring captured pieces),
          you can\'t simulate king-safety, support undo, or detect repetition. Make the move reversible.</Warn>
        <Warn><strong>Confusing checkmate and stalemate.</strong> Both are "no legal moves"; only the king-in-check
          boolean decides loss vs draw. Compute both from the same legal-move generator.</Warn>
      </section>

      {/* 12 */}
      <section id="s12">
        <div className="sec-label">Section 12</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Cast:</strong> Board (field) · abstract Piece + 6 concrete pieces (each owns <C>legalMoves</C>) · Square · Move (from/to/captured/flags) · Game (board, toMove, history, status) · Player.</li>
          <li><strong>Movement = polymorphism</strong>, never a type switch. Sliding pieces share a <C>slide(directions)</C> helper; Knight jumps; Pawn is asymmetric.</li>
          <li><strong>Validation pipeline:</strong> ① geometry → ② path clear (not Knight) → ③ destination empty/enemy → ④ does NOT leave your king in check (simulate-then-test).</li>
          <li><strong>King-safety filter</strong> is the correctness keystone — it produces pins and forced check responses for free.</li>
          <li><strong>Special moves need history:</strong> castling (hasMoved + safe squares), en passant (last move), promotion (last rank). Model a <C>Move</C> as a Command (apply/undo) + a history stack.</li>
          <li><strong>End conditions from one generator:</strong> inCheck + hasLegalMove → check / checkmate (lose) / stalemate (draw) / normal; plus repetition / 50-move / insufficient material from history.</li>
          <li><strong>Loop:</strong> the Week-9 turn-based skeleton with the validate + end-check slots filled by chess\'s rich rules. Patterns: Strategy, Factory, Command, Memento, State.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "How exactly do you detect that a move would leave your own king in check?"'>
          <p>Simulate-then-test. Make the move on a COPY of the board (or apply it and remember enough to undo),
            then ask "is my king\'s square attacked by any enemy piece?" — i.e. does any enemy piece\'s
            <C> legalMoves</C> include the king\'s square? If yes, the move is illegal; undo and discard it. You
            reuse the SAME move-generation code to compute attacks. Optimization for real engines: you only need
            to recheck attacks along the lines from the king (and from the moved piece), but for an LLD answer
            "apply on a copy, scan enemy attacks on the king, undo" is the clean, correct approach — and it\'s
            why a Move must be reversible.</p>
        </Reveal>
        <Reveal summary='Q: "Where would a chess ENGINE/AI plug in?"'>
          <p>Behind the same "choose a move" slot a human uses — a <C>MovePicker</C>/<C>Player</C> strategy
            (Day 43\'s MoveStrategy, scaled up). A human picker reads input; an engine picker runs minimax /
            alpha-beta over the legal-move generator, evaluating positions. Crucially the engine works on a COPY
            (or apply/undo on a scratch board) using your existing <C>legalMoves</C> + <C>isLegal</C> — it never
            touches the live game. The design sentence: "the rules engine and the loop don\'t know whether the
            mover is a human or minimax; both implement the same move-selection interface." Reuse, not a rewrite.</p>
        </Reveal>
        <Reveal summary='Q: "Castling has many preconditions — where do they live?"'>
          <p>In the King\'s move generation (or a dedicated castling rule), checking: neither the king nor that
            rook has moved (<C>hasMoved</C> flags), the squares between them are empty, the king isn\'t currently
            in check, and it doesn\'t pass THROUGH or land ON an attacked square (reuse the attack/king-safety
            check for the in-between squares). It produces a Move with a <C>castling</C> flag whose
            <C> apply</C>/<C>undo</C> moves BOTH king and rook. Keeping castling as a special Move (not a hack in
            the loop) means it\'s validated and undone uniformly. The "passes through check" rule is the subtle
            one interviewers probe — it reuses king-safety on each transited square.</p>
        </Reveal>
        <Reveal summary='Q: "How do you handle draws like threefold repetition and the 50-move rule?"'>
          <p>From the move HISTORY (and a position hash). Threefold repetition: hash each position (piece
            placement + side to move + castling/en-passant rights — a Zobrist hash in real engines) and count
            occurrences; three identical → draw. 50-move rule: a counter reset on any pawn move or capture,
            incremented otherwise; reaching 100 half-moves → draw. Insufficient material: check the remaining
            pieces (e.g. K vs K). All of these are queries over the history/position you already maintain for
            undo — which is another reason the Move/history model pays off. Point to make: draw detection is
            bookkeeping over history, not new move logic.</p>
        </Reveal>
        <Reveal summary='Q: "Chess vs tic-tac-toe — same skeleton, so what actually scaled up?"'>
          <p>The skeleton is identical — turn rotation, a status enum, validate-move-then-apply-then-check-end.
            What scaled is the richness of two slots: the "validate move" slot grew from "is this cell empty?"
            to a four-stage pipeline ending in a global king-safety simulation, and the "check end" slot grew
            from "three in a row / board full" to checkmate/stalemate/repetition. The PIECE polymorphism is the
            genuinely new structural element (tic-tac-toe has one move rule; chess has six). So the interview
            lesson: recognize the familiar loop, then pour your time into the two rich slots and the piece
            hierarchy — don\'t reinvent turn management.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s13">
        <div className="sec-label">Section 13 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 66 complete?</strong> Homework: model it on paper, then code the core — an abstract
        <C> Piece</C> with <C>legalMoves(board, from)</C>, the six concrete pieces (share a <C>slide()</C> helper
        for rook/bishop/queen; special-case knight &amp; pawn), an <C>isLegal</C> that adds the king-safety filter
        (apply-on-copy → not-in-check), and a <C>Move</C> with <C>apply</C>/<C>undo</C> + a history stack. Prove
        it: generate all legal moves for a side and detect check, checkmate, and stalemate from that set.
        Stretch: add castling and pawn promotion as flagged Moves.
        <br /><br />
        Next: <strong>Day 67 — Food Delivery</strong>: orders, restaurants, and matching a delivery partner —
        a big multi-actor system tying together state machines, matching, and pricing.
      </div>
    </div>
  )
}
