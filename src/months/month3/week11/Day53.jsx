import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the split calculator ============ */
const PEOPLE = ['Alice', 'Bob', 'Carol']

function equalSplit(total, n) {
  // work in paise to avoid float drift, then hand the leftover paise to the first few
  const paise = Math.round(total * 100)
  const base = Math.floor(paise / n)
  const extra = paise - base * n            // leftover paise to distribute
  return [...Array(n)].map((_, i) => (base + (i < extra ? 1 : 0)) / 100)
}

function SplitCalculator() {
  const [type, setType] = useState('equal')
  const [total, setTotal] = useState(100)
  const [exact, setExact] = useState([40, 30, 30])
  const [pct, setPct] = useState([50, 25, 25])

  let shares, valid = true, note
  if (type === 'equal') {
    shares = equalSplit(total, PEOPLE.length)
    note = `₹${total} / 3 = ₹${(total / 3).toFixed(4)}… → paise remainder handled deterministically. Sum of shares = ₹${shares.reduce((a, b) => a + b, 0).toFixed(2)} (exactly the total — no penny lost).`
  } else if (type === 'exact') {
    shares = exact
    const sum = exact.reduce((a, b) => a + b, 0)
    valid = sum === total
    note = valid ? `Exact amounts sum to ₹${sum} = the total. ✓` : `⛔ exact shares sum to ₹${sum}, but the bill is ₹${total}. A split MUST sum to the total — reject it.`
  } else {
    const sum = pct.reduce((a, b) => a + b, 0)
    valid = sum === 100
    shares = pct.map((p) => Math.round(total * p) / 100)
    note = valid ? `Percentages sum to ${sum}% = 100%. ✓ Each share = total × pct.` : `⛔ percentages sum to ${sum}%, not 100%. Reject the split.`
  }

  const step = (arr, set, i, d, max) => set(arr.map((v, j) => j === i ? Math.max(0, Math.min(max, v + d)) : v))

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one bill, three split strategies — each must sum to the total</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {[['equal', 'EQUAL'], ['exact', 'EXACT'], ['percentage', 'PERCENTAGE']].map(([k, l]) => (
          <button key={k} className={type === k ? 'on' : ''} onClick={() => setType(k)}>{l}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>bill total:</span>
        <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => setTotal((t) => Math.max(0, t - 10))}>−10</button>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 18, fontWeight: 700, width: 56, textAlign: 'center' }}>₹{total}</span>
        <button className="ghost act" style={{ padding: '2px 8px' }} onClick={() => setTotal((t) => t + 10)}>+10</button>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        {PEOPLE.map((p, i) => (
          <div key={p} style={{
            border: '1.5px solid var(--line)', borderRadius: 8, padding: 8, minWidth: 110,
            background: !valid ? '#FDECEC' : '#EAF7EF',
          }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14 }}>{p}</div>
            {type === 'equal' && <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16 }}>₹{shares[i].toFixed(2)}{equalSplit(total, 3)[i] !== Math.floor(total * 100 / 3) / 100 && <span style={{ fontSize: 9, color: 'var(--amber)' }}> +1p</span>}</div>}
            {type === 'exact' && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}>
                <button className="ghost act" style={{ padding: '1px 6px', fontSize: 11 }} onClick={() => step(exact, setExact, i, -5, total)}>−</button>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, width: 36, textAlign: 'center' }}>₹{exact[i]}</span>
                <button className="ghost act" style={{ padding: '1px 6px', fontSize: 11 }} onClick={() => step(exact, setExact, i, 5, total)}>+</button>
              </div>
            )}
            {type === 'percentage' && (
              <div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}>
                  <button className="ghost act" style={{ padding: '1px 6px', fontSize: 11 }} onClick={() => step(pct, setPct, i, -5, 100)}>−</button>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, width: 36, textAlign: 'center' }}>{pct[i]}%</span>
                  <button className="ghost act" style={{ padding: '1px 6px', fontSize: 11 }} onClick={() => step(pct, setPct, i, 5, 100)}>+</button>
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#666' }}>= ₹{shares[i].toFixed(2)}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="statbar" style={{ display: 'block', background: valid ? undefined : '#FDECEC' }}>
        <span style={{ fontSize: 12.5 }}>{note}</span>
      </div>
    </div>
  )
}

/* ============ Interactive 2: the balance sheet ============ */
const MEMBERS = ['Alice', 'Bob', 'Carol', 'Dave']
const EXPENSES = [
  { label: 'Alice paid ₹600 dinner · equal A/B/C', payer: 'Alice', amt: 600, among: ['Alice', 'Bob', 'Carol'] },
  { label: 'Bob paid ₹300 cab · equal B/C/D', payer: 'Bob', amt: 300, among: ['Bob', 'Carol', 'Dave'] },
  { label: 'Carol paid ₹120 snacks · equal A/C', payer: 'Carol', amt: 120, among: ['Alice', 'Carol'] },
]

function BalanceSheet() {
  // pairwise[debtor][creditor] = amount debtor owes creditor
  const [added, setAdded] = useState([])

  // recompute net per ordered pair from scratch each render
  const owes = {}   // owes[a][b] = net a owes b (positive)
  MEMBERS.forEach((a) => { owes[a] = {} })
  added.forEach((idx) => {
    const e = EXPENSES[idx]
    const share = equalSplit(e.amt, e.among.length)
    e.among.forEach((person, k) => {
      if (person === e.payer) return
      owes[person][e.payer] = (owes[person][e.payer] || 0) + share[k]
    })
  })
  // net per unordered pair
  const pairs = []
  for (let i = 0; i < MEMBERS.length; i++) {
    for (let j = i + 1; j < MEMBERS.length; j++) {
      const a = MEMBERS[i], b = MEMBERS[j]
      const net = (owes[a][b] || 0) - (owes[b][a] || 0)
      if (Math.abs(net) > 0.001) pairs.push(net > 0 ? { from: a, to: b, amt: net } : { from: b, to: a, amt: -net })
    }
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · add expenses, watch the "who owes whom" ledger update — net, not a transaction list</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        {EXPENSES.map((e, i) => (
          <button key={i} className={added.includes(i) ? 'ghost act' : 'act'} style={{ fontSize: 12, textAlign: 'left' }}
            disabled={added.includes(i)}
            onClick={() => setAdded((a) => [...a, i])}>
            {added.includes(i) ? '✓ ' : '+ '}{e.label}
          </button>
        ))}
        <button className="ghost act" style={{ fontSize: 12, alignSelf: 'flex-start' }} onClick={() => setAdded([])}>reset</button>
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>balance sheet:</div>
      {pairs.length === 0
        ? <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#999' }}>everyone's even — add an expense</div>
        : pairs.map((p, i) => (
          <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, padding: '3px 0' }}>
            <span style={{ color: 'var(--red)' }}>{p.from}</span> owes <span style={{ color: 'var(--green)' }}>{p.to}</span> <b>₹{p.amt.toFixed(2)}</b>
          </div>
        ))}
      <div className="statbar" style={{ display: 'block', marginTop: 10 }}>
        <span style={{ fontSize: 12.5 }}>
          Each expense updates PAIRWISE net balances directly — the system never re-scans a log of every dinner
          to answer "what does Bob owe Alice?". Notice: add the snacks expense and Carol↔Alice nets out (Carol
          owed Alice from dinner, now Alice owes Carol back) — the balance just moves.
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: debt simplification ============ */
const SCENARIOS = {
  chain: {
    label: 'a chain of debts',
    debts: [
      { from: 'Bob', to: 'Alice', amt: 100 },
      { from: 'Carol', to: 'Bob', amt: 100 },
      { from: 'Carol', to: 'Alice', amt: 50 },
    ],
  },
  cycle: {
    label: 'a cycle (everyone is secretly even)',
    debts: [
      { from: 'Alice', to: 'Bob', amt: 50 },
      { from: 'Bob', to: 'Carol', amt: 50 },
      { from: 'Carol', to: 'Alice', amt: 50 },
    ],
  },
}

function simplify(debts) {
  const net = {}
  debts.forEach((d) => {
    net[d.from] = (net[d.from] || 0) - d.amt
    net[d.to] = (net[d.to] || 0) + d.amt
  })
  const creditors = Object.entries(net).filter(([, v]) => v > 0.001).map(([k, v]) => ({ k, v }))
  const debtors = Object.entries(net).filter(([, v]) => v < -0.001).map(([k, v]) => ({ k, v: -v }))
  creditors.sort((a, b) => b.v - a.v); debtors.sort((a, b) => b.v - a.v)
  const transfers = []
  let ci = 0, di = 0
  const c = creditors.map((x) => ({ ...x })), d = debtors.map((x) => ({ ...x }))
  while (ci < c.length && di < d.length) {
    const pay = Math.min(c[ci].v, d[di].v)
    transfers.push({ from: d[di].k, to: c[ci].k, amt: pay })
    c[ci].v -= pay; d[di].v -= pay
    if (c[ci].v < 0.001) ci++
    if (d[di].v < 0.001) di++
  }
  return { net, transfers }
}

function DebtSimplify() {
  const [scn, setScn] = useState('chain')
  const [revealed, setRevealed] = useState(false)
  const { debts, label } = SCENARIOS[scn]
  const { net, transfers } = simplify(debts)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · "settle up" is a graph problem — minimize the number of payments</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {Object.entries(SCENARIOS).map(([k, v]) => (
          <button key={k} className={scn === k ? 'on' : ''} onClick={() => { setScn(k); setRevealed(false) }}>{v.label}</button>
        ))}
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>raw debts ({debts.length} payments):</div>
      {debts.map((d, i) => (
        <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, padding: '2px 0' }}>
          {d.from} → {d.to}: ₹{d.amt}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, margin: '10px 0' }}>
        <button className="act" onClick={() => setRevealed(true)} disabled={revealed}>⚙️ simplify</button>
        <button className="ghost act" onClick={() => setRevealed(false)}>hide</button>
      </div>
      {revealed && (
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>step 1 — net per person:</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, marginBottom: 8 }}>
            {Object.entries(net).map(([k, v]) => (
              <span key={k} style={{ marginRight: 12, color: v > 0.001 ? 'var(--green)' : v < -0.001 ? 'var(--red)' : '#999' }}>
                {k}: {v > 0 ? '+' : ''}{v.toFixed(0)}
              </span>
            ))}
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>
            step 2 — minimal transfers ({transfers.length} payment{transfers.length !== 1 ? 's' : ''}):
          </div>
          {transfers.length === 0
            ? <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: 'var(--green)' }}>✓ nobody owes anybody — the debts formed a cycle and cancel out!</div>
            : transfers.map((t, i) => (
              <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, padding: '2px 0' }}>
                <span style={{ color: 'var(--red)' }}>{t.from}</span> pays <span style={{ color: 'var(--green)' }}>{t.to}</span> <b>₹{t.amt.toFixed(0)}</b>
              </div>
            ))}
          <div className="statbar" style={{ display: 'block', marginTop: 10, background: '#EAF7EF' }}>
            <span style={{ fontSize: 12.5 }}>
              {debts.length} raw payments → <b>{transfers.length}</b> after simplification.{' '}
              {scn === 'cycle'
                ? 'The cycle nets to zero for everyone — three "debts" but nobody actually owes anything.'
                : 'Bob was a pass-through (net 0); the algorithm routes Carol straight to Alice. Greedy: match the biggest creditor with the biggest debtor, repeat.'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'EQUAL, EXACT, and PERCENTAGE splits — the clean way to model them?',
    o: ['Three separate addExpense methods', 'An if-else on a splitType string inside addExpense()', 'A SplitStrategy interface with one method (compute shares for an amount + participants); EqualSplit / ExactSplit / PercentSplit are classes, and a new split type is a new class, not an edit (Day 31)', 'A boolean isEqual'], a: 2,
    e: 'Splitting is a varying algorithm behind one contract — textbook Strategy. The expense holds a SplitStrategy; adding "by shares" (2 shares for Bob, 1 for others) is a new class, and addExpense never changes.',
    w: { 0: 'Three methods duplicate the surrounding flow and don\'t compose.',
         1: 'The if-else is the growing-switch smell (Day 12) — every new split type reopens addExpense.',
         3: 'A boolean can\'t express three (soon four) strategies.' },
    r: { id: 's3', label: 'Section 3 — split strategies' } },
  { q: 'Every split type shares one validation rule. What is it?',
    o: ['The payer must be in the group', 'The shares must sum EXACTLY to the expense total — equal, exact, or percentage, the parts always add up to the whole, or the split is rejected', 'There must be at least 3 people', 'Everyone must pay the same'], a: 1,
    e: 'Whatever the strategy, money is conserved: the computed shares must equal the bill. Exact shares that sum to ₹290 on a ₹300 bill, or percentages summing to 95%, are invalid and must be rejected up front.',
    w: { 0: 'True but unrelated — the universal rule is shares summing to the total.',
         2: 'Two people can split a bill fine.',
         3: 'Equal is one strategy; exact/percentage are deliberately unequal.' },
    r: { id: 's3', label: 'Section 3 — the sum rule' } },
  { q: 'Split ₹100 equally three ways. 100/3 = 33.333… How should the system handle it?',
    o: ['Round each to ₹33.33 and lose a penny', 'Use a double and ignore it', 'Refuse non-divisible amounts', 'Work in the smallest unit (paise), give each the floor, and distribute the leftover paise deterministically — 33.34 + 33.33 + 33.33 = exactly ₹100; money is conserved and the rule is repeatable'], a: 3,
    e: 'The penny problem: equal shares rarely divide evenly. Compute in integer minor units, floor each share, and hand the remainder paise to the first few participants by a fixed rule — the shares always sum to the total.',
    w: { 0: '33.33 × 3 = 99.99 — a penny vanishes, and balances stop reconciling over time.',
         1: 'double drifts (Day 20) — 0.1 isn\'t representable; money math needs exact units.',
         2: 'Refusing ₹100/3 would reject most real bills — handle the remainder instead.' },
    r: { id: 's4', label: 'Section 4 — the penny problem' } },
  { q: 'To answer "what does Bob owe Alice?", the system should…',
    o: ['Maintain running NET balances (pairwise or per-user), updated as each expense is added — the answer is a lookup, not a recomputation over a transaction log', 'Ask Alice', 'Store only the latest expense', 'Scan every expense ever and recompute'], a: 0,
    e: 'Balances are the core data structure. Adding an expense adjusts net balances incrementally, so "who owes whom" is an O(1) lookup. Re-scanning the full history per query doesn\'t scale and is the common modeling miss.',
    w: { 1: '🙂 Not a data structure.',
         2: 'You need the full balance, not just the last expense.',
         3: 'Re-scanning all history per query is O(n) and pointless when you can maintain the net.' },
    r: { id: 's5', label: 'Section 5 — the balance model' } },
  { q: 'Alice paid ₹600 for a dinner split equally among Alice, Bob, Carol. The balance update?',
    o: ['Bob owes Alice ₹200 and Carol owes Alice ₹200 — the payer\'s OWN share (₹200) is not a debt; only the other participants\' shares become what they owe the payer', 'Bob and Carol owe ₹300 each', 'Alice owes ₹600', 'Everyone owes Alice ₹200'], a: 0,
    e: 'Split ₹600 three ways = ₹200 each. Alice already paid, so her own ₹200 isn\'t owed to anyone; Bob and Carol each owe Alice their ₹200 share. Forgetting to exclude the payer\'s share is a classic bug.',
    w: { 1: '₹300 would be splitting two ways; it\'s three participants at ₹200.',
         2: 'Alice is owed, not owing — she fronted the money.',
         3: 'Alice doesn\'t owe herself — her share is already covered by paying.' },
    r: { id: 's7', label: 'Section 7 — adding an expense' } },
  { q: '"Settle up with the fewest payments" given a tangle of debts is fundamentally…',
    o: ['A sorting problem', 'A search problem', 'Impossible to optimize', 'A graph / min-cash-flow problem: net everyone out, then match creditors to debtors (greedy: biggest creditor ↔ biggest debtor) — the structure that turns a chain A→B→C into one A→C payment'], a: 3,
    e: 'Once you compute net balances, settling is matching positive nets (creditors) with negative nets (debtors) using as few transfers as possible. A greedy max-creditor/max-debtor match is the standard heuristic.',
    w: { 0: 'Sorting is a step, not the problem; the problem is minimizing transfers.',
         1: 'It\'s not a lookup/search; it\'s netting and matching flows.',
         2: 'It\'s very optimizable — netting alone collapses chains and cycles.' },
    r: { id: 's8', label: 'Section 8 — debt simplification' } },
  { q: 'Three debts form a cycle: A→B ₹50, B→C ₹50, C→A ₹50. After simplification…',
    o: ['Everyone still pays ₹50', 'It can\'t be simplified', 'Zero payments — each person\'s net is 0, so the cycle cancels completely; the three "debts" represent nobody actually owing anything', 'A pays ₹150'], a: 2,
    e: 'Netting reveals the truth: A is +50−50 = 0, same for B and C. A cycle of equal debts means everyone is already even. Simplification doesn\'t just reduce payments — it can eliminate them.',
    w: { 0: 'Paying the raw debts moves ₹150 around pointlessly — everyone ends where they started.',
         1: 'It simplifies to the cleanest possible result: nothing.',
         3: 'A\'s net is zero; A owes nothing.' },
    r: { id: 's8', label: 'Section 8 — cycles cancel' } },
  { q: 'A subtle downside of "simplify debts" that a thoughtful design should surface?',
    o: ['It is always slower', 'It can ask you to pay someone you never directly transacted with (Carol → Alice, though Carol\'s debt was to Bob) — mathematically correct, but some users want to settle only with people they actually owe, so make simplification optional/explicit', 'It loses money', 'It double-counts'], a: 1,
    e: 'Re-routing Carol\'s debt to Alice is correct and minimal, but socially surprising — "why am I paying Alice? I owe Bob." Good designs offer simplified settle-up as an option and keep the raw pairwise balances too.',
    w: { 0: 'It\'s fast (netting + greedy match), not slow.',
         2: 'Money is conserved — netting never loses any.',
         3: 'Netting prevents double-counting; it doesn\'t cause it.' },
    r: { id: 's8', label: 'Section 8 — the social nuance' } },
]

/* ============ The page ============ */
export default function Day53() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 11 · Day 53 · Classic LLD Problems</div>
        <h1>Splitwise:<br />Who Owes Whom, and the Math of Settling Up</h1>
        <p>Splitting a dinner bill sounds trivial — and the splitting part is. The real design lives in two
           places: a clean family of split strategies (equal / exact / percentage, all summing to the total),
           and the balance model that answers "who owes whom" instantly — plus the graph problem hiding inside
           "settle up." Click everything.</p>
        <div className="chips">
          {['Splitwise', 'split strategies', 'net balances', 'the penny problem', 'settle up', 'debt simplification'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What Splitwise really is</h2>
        <p>The flow is simple: someone pays, the cost is split, everyone\'s balance updates, and eventually
          people settle up. But two parts carry the real design weight:</p>
        <Code html={`  THE SYSTEM, AND WHERE THE DESIGN LIVES

  pay → SPLIT the cost → update BALANCES → ... → SETTLE UP

           ▲                    ▲                      ▲
   ① a family of split     ② the balance model    ③ the graph problem:
      strategies (equal/      ("who owes whom"        minimize the number
      exact/percent), all     as running NET, not     of payments to settle
      summing to the total    a log to re-scan)       everyone (min cash flow)

  Money correctness threads through all three: shares must sum to the bill,
  balances must reconcile to zero, and pennies must never vanish (Day 20).`} />
        <Note><strong>The shape, recognized:</strong> Splitwise is a <em>strategy family</em> (the splits) over
          a <em>balance ledger</em> (the data structure) with a <em>graph algorithm</em> (settle-up) on top.
          Like every classic, naming the real problem early — "the hard part is balances and settling, not
          splitting" — steers the whole design.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The clarifying questions</h2>
        <table className="matrix">
          <thead>
            <tr><th>question</th><th>typical answer</th><th>what it shapes</th></tr>
          </thead>
          <tbody>
            <tr><td>"What split types?"</td><td>"Equal, exact amounts, percentages (maybe by-shares later)"</td><td>SplitStrategy family (Strategy)</td></tr>
            <tr><td>"Groups, or just friends?"</td><td>"Both — group expenses and 1:1"</td><td>User, Group; expense references participants</td></tr>
            <tr><td>"How do we answer 'who owes whom'?"</td><td>"Instantly, anytime"</td><td>running net balances (the core ledger)</td></tr>
            <tr><td>"Minimize payments when settling?"</td><td>"Yes — fewest transactions"</td><td>debt simplification (graph problem)</td></tr>
            <tr><td>"Multiple currencies?"</td><td>"One currency for now"</td><td>Money type; multi-currency = future</td></tr>
            <tr><td>"Can the payer be outside the split?"</td><td>"Yes — I can pay for a group I'm not in"</td><td>payer ≠ participants (model them separately)</td></tr>
          </tbody>
        </table>
        <p>Noun-verb survivors: <em>User, Group, Expense, Split/Share, SplitStrategy, Balance, Settlement</em>.
          Filtered (Day 10): <em>"the bill"</em> is an Expense, <em>"settle up"</em> is a verb producing
          Settlements, <em>"the app"</em> is the god-noun.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Split strategies: one interface, three (then N) ways</h2>
        <p>Splitting is a varying algorithm — exactly what Strategy (Day 31) is for. One interface, a class per
          split type, and a universal rule: <strong>the shares must sum to the total</strong>:</p>
        <Code html={`<span class="kw">public interface</span> SplitStrategy {
    Map&lt;User, Money&gt; computeShares(Money total, List&lt;User&gt; participants, Object params);
    <span class="cm">// EVERY implementation guarantees: sum(shares) == total, or it throws</span>
}

<span class="kw">public class</span> EqualSplit <span class="kw">implements</span> SplitStrategy {        <span class="cm">// total / n, remainder handled (§4)</span>
    <span class="kw">public</span> Map&lt;User, Money&gt; computeShares(Money total, List&lt;User&gt; ps, Object p) { … }
}
<span class="kw">public class</span> ExactSplit <span class="kw">implements</span> SplitStrategy {        <span class="cm">// caller gives each amount</span>
    <span class="kw">public</span> Map&lt;User, Money&gt; computeShares(Money total, List&lt;User&gt; ps, Object amounts) {
        Money sum = sum(amounts);
        <span class="kw">if</span> (!sum.equals(total)) <span class="kw">throw new</span> InvalidSplitException(<span class="str">"shares "</span> + sum + <span class="str">" != "</span> + total);
        …
    }
}
<span class="kw">public class</span> PercentSplit <span class="kw">implements</span> SplitStrategy {      <span class="cm">// percentages must sum to 100</span>
    <span class="cm">// share = total × pct/100; reject if Σpct != 100</span>
}

<span class="kw">public class</span> Expense {
    <span class="kw">private final</span> User payer;                                 <span class="cm">// who fronted the money</span>
    <span class="kw">private final</span> Money amount;
    <span class="kw">private final</span> Map&lt;User, Money&gt; shares;                      <span class="cm">// computed by the chosen strategy</span>
}`} />
        <Good><strong>A new split type = a new class.</strong> "By shares" (Bob counts double), "itemized"
          (everyone pays for what they ordered) — each is one more <C>SplitStrategy</C>, and <C>addExpense</C>
          never changes (Day 12). The universal invariant (shares sum to the total) lives in the contract, so
          every strategy is checkable the same way.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🧮 Play: the split calculator</h2>
        <p>Three strategies on one bill. Watch equal handle the leftover paise, and watch exact/percentage get
          rejected when the parts don\'t sum to the whole:</p>
        <SplitCalculator />
        <Good><strong>What you should notice:</strong> ① EQUAL never loses a penny — ₹100/3 becomes
          33.34 + 33.33 + 33.33, computed in paise with a deterministic remainder. ② EXACT and PERCENTAGE are
          rejected the instant the parts don\'t sum to the total (or 100%) — the universal invariant. ③ All
          three produce the same kind of result (a share per person) because they implement one interface.</Good>
        <Warn style={{ marginTop: 12 }}><strong>The penny problem is real.</strong> Naive equal split rounds each
          share and silently drops cents — over thousands of expenses, balances stop reconciling to zero.
          Compute in the smallest unit (paise), floor each share, and distribute the remainder paise by a fixed
          rule. Money is <C>Money</C> (BigDecimal, Day 20), never <C>double</C>.</Warn>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The balance model: net, not a log to re-scan</h2>
        <p>The core data structure isn\'t the list of expenses — it\'s the <strong>running balance</strong>.
          "What does Bob owe Alice?" must be a lookup, not a recomputation over every dinner ever:</p>
        <Code html={`  TWO WAYS TO HOLD BALANCES (both maintained incrementally)

  PAIRWISE                              NET-PER-USER
  balance[debtor][creditor] = amount    balance[user] = net (signed)
  "Bob owes Alice ₹200"                 Alice: +400   Bob: -200   Carol: -200
  → shows exact relationships           → compact; great for settle-up (§8)

  Either way: adding an expense UPDATES these numbers directly.
  You never scan the expense history to answer "who owes whom".`} />
        <Code html={`<span class="kw">public class</span> BalanceSheet {
    <span class="cm">// pairwise: owes.get(a).get(b) = how much a owes b</span>
    <span class="kw">private final</span> Map&lt;User, Map&lt;User, Money&gt;&gt; owes = <span class="kw">new</span> HashMap&lt;&gt;();

    <span class="kw">public void</span> record(User debtor, User creditor, Money amount) {
        adjust(debtor, creditor, amount);            <span class="cm">// debtor owes creditor more…</span>
        <span class="cm">// netting: if creditor already owed debtor, the two cancel down automatically</span>
    }
    <span class="kw">public</span> Money balanceBetween(User a, User b) {     <span class="cm">// O(1) lookup, not a history scan</span>
        <span class="kw">return</span> owes.get(a).get(b).minus(owes.get(b).get(a));
    }
}`} />
        <Note><strong>Pairwise vs net-per-user is a real trade.</strong> Pairwise preserves "who owes whom"
          exactly (good for display and partial settlement); net-per-user is compact and is what the settle-up
          algorithm consumes. Many designs keep pairwise as the source of truth and derive nets on demand —
          mention both and pick by what the product needs.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>📊 Play: the balance sheet</h2>
        <p>Add expenses one at a time and watch the pairwise ledger update directly — and watch debts net out
          when they overlap:</p>
        <BalanceSheet />
        <Good><strong>What you should notice:</strong> ① Each expense excludes the payer\'s OWN share — Alice
          paying ₹600 for A/B/C means Bob and Carol each owe ₹200, not everyone. ② The ledger shows net
          relationships, never a list of dinners. ③ When Carol later pays for something Alice is in, the
          Carol↔Alice balance MOVES — netting happens automatically, which is the whole point of maintaining
          balances instead of a log.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Adding an expense: the algorithm</h2>
        <Code html={`<span class="kw">public void</span> addExpense(Expense e) {
    Map&lt;User, Money&gt; shares = e.strategy().computeShares(e.amount(), e.participants(), e.params());
    <span class="cm">// invariant already enforced by the strategy: Σ shares == e.amount()</span>

    <span class="kw">for</span> (var entry : shares.entrySet()) {
        User participant = entry.getKey();
        Money share = entry.getValue();
        <span class="kw">if</span> (participant.equals(e.payer())) <span class="kw">continue</span>;   <span class="cm">// ★ the payer's own share is NOT a debt</span>
        balances.record(participant, e.payer(), share);  <span class="cm">// participant owes payer their share</span>
    }
}`} />
        <Warn><strong>The two classic bugs here.</strong> ① Forgetting <C>continue</C> for the payer makes the
          payer owe themselves — balances never reconcile. ② Doing the math in <C>double</C> drifts the totals.
          Exclude the payer\'s share, keep money in exact units, and the balance sheet always sums to zero across
          the group (a great invariant to assert in tests).</Warn>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Settle up: the debt-simplification graph problem</h2>
        <p>"Everyone settle with the fewest payments" is the algorithmic heart. Net everyone out, then match
          creditors to debtors — a chain <C>A→B→C</C> collapses to one <C>A→C</C> payment, and a cycle vanishes
          entirely:</p>
        <Code html={`  MINIMIZE CASH FLOW (greedy heuristic)

  1. compute NET per person:   debtor = negative,  creditor = positive
        (sum of all nets is always 0 — money is conserved)
  2. repeat until all zero:
        take the BIGGEST creditor and the BIGGEST debtor
        transfer = min(|creditor|, |debtor|)   → record "debtor pays creditor"
        reduce both; drop whoever hits zero

  chain:  Bob→Alice 100, Carol→Bob 100, Carol→Alice 50
          nets → Alice +150, Bob 0, Carol −150
          result → Carol pays Alice 150        (3 payments → 1)

  cycle:  A→B 50, B→C 50, C→A 50
          nets → everyone 0  →  ZERO payments  (the "debts" cancel)`} />
        <Note><strong>Greedy is the standard answer — and you should name its limit.</strong> Matching the
          biggest creditor and debtor minimizes payments well in practice, but the true minimum-transactions
          problem is NP-hard in general (it\'s related to subset-sum). For an interview: "I\'d net everyone out
          and greedily match largest creditor to largest debtor — near-optimal and O(n log n); the exact
          minimum is NP-hard, rarely worth it." That sentence is the senior answer.</Note>
        <Warn><strong>The social nuance to surface:</strong> simplification can ask you to pay someone you never
          directly owed (Carol → Alice, though Carol\'s debt was to Bob). It\'s mathematically correct but can
          feel odd, so offer simplified settle-up as an OPTION and keep the raw pairwise balances available.</Warn>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>⚙️ Play: debt simplification</h2>
        <p>Two tangles — a chain and a cycle. Hit simplify and watch netting collapse them:</p>
        <DebtSimplify />
        <Good><strong>What you should notice:</strong> ① The chain\'s middle person (Bob) nets to zero and drops
          out — the algorithm routes Carol straight to Alice, 3 payments → 1. ② The cycle nets to zero for
          everyone — three "debts" but nobody actually owes anything, 3 payments → 0. ③ Netting is the whole
          trick: once you have signed nets, settling is just matching positives to negatives.</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>if-else on a split-type string.</strong> Every new split type reopens <C>addExpense</C>
          (Day 12). A <C>SplitStrategy</C> interface with a class per type; new type = new class.</Warn>
        <Warn><strong>double for money.</strong> Day 20, again — split shares and balances in exact units
          (paise / BigDecimal Money). Floats drift and balances stop summing to zero.</Warn>
        <Warn><strong>The vanishing penny.</strong> Rounding each equal share independently loses cents. Floor
          in minor units and distribute the remainder deterministically so shares sum to the total.</Warn>
        <Warn><strong>Re-scanning the expense log per query.</strong> "Who owes whom" must be a balance lookup,
          not a recomputation over all history. Maintain running net balances.</Warn>
        <Warn><strong>Charging the payer their own share.</strong> Forgetting to exclude the payer makes them
          owe themselves; the group balance never reconciles to zero.</Warn>
        <Warn><strong>Forcing simplified settle-up.</strong> Re-routing debts is correct but socially
          surprising; keep it optional and preserve the raw pairwise relationships.</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Split = Strategy:</strong> <C>SplitStrategy</C> interface; Equal/Exact/Percent (+ by-shares, itemized) as classes. Universal invariant: shares sum to the total, or reject.</li>
          <li><strong>The penny problem:</strong> compute in minor units (paise), floor each share, distribute the remainder deterministically; money is <C>Money</C>/BigDecimal, never double.</li>
          <li><strong>Balances are the core data structure:</strong> running NET, updated per expense — pairwise (who owes whom) and/or net-per-user. "Who owes whom" is a lookup, not a log scan.</li>
          <li><strong>addExpense:</strong> compute shares via the strategy, then for each participant EXCEPT the payer, record they owe the payer their share. Exclude the payer\'s own share.</li>
          <li><strong>Settle up = min cash flow:</strong> net everyone out, greedily match biggest creditor ↔ biggest debtor. Chains collapse, cycles cancel. Greedy is near-optimal; exact minimum is NP-hard — say so.</li>
          <li><strong>Group invariant to test:</strong> across a group, all net balances sum to zero. If they don\'t, a penny leaked or the payer was charged.</li>
          <li><strong>Surface the nuance:</strong> simplified settle-up can route you to pay a stranger — make it optional, keep raw balances.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Add multi-currency. What changes?"'>
          <p>Money becomes currency-aware (it already is, if you reused Day 20\'s <C>Money</C> with a currency
            field). An expense is in one currency; balances are kept per currency (you don\'t silently add ₹ to
            $). Settle-up either settles each currency separately or converts via an injected exchange-rate
            provider at settlement time — and conversion timing is a policy question to ASK (rate at expense
            time? at settle time?). The structure barely changes because Money already guards currency mixing;
            the new piece is a rate provider behind an interface. That "Money already carries currency" reuse is
            the point to make.</p>
        </Reveal>
        <Reveal summary='Q: "How do you store this — and how do balances stay consistent under concurrent expenses?"'>
          <p>Two layers. Source of truth: the immutable Expense log (append-only — you never edit history).
            Derived: the balance sheet, which you can maintain incrementally AND rebuild from the log if it ever
            drifts. Concurrency: two people adding expenses to the same group both update shared balances — the
            classic check-then-act if you read-modify-write. Guard per-group balance updates (a lock per group,
            or atomic increments, or serialize through the group), exactly the Day 21 race. The append-only log
            is your safety net: balances are a cache you can recompute.</p>
        </Reveal>
        <Reveal summary='Q: "Someone edits or deletes an expense after balances moved. How?"'>
          <p>Don\'t mutate balances in place from a guess — REVERSE then re-apply. Deleting an expense applies
            its inverse (un-owe the shares); editing = delete-then-add. This is cleanest if expenses are
            immutable and balances are derived: you can simply recompute the affected balances from the log.
            The design lesson: because balances are a function of the expense history, any edit is "replay the
            history" rather than "patch the number," which avoids drift. (Audit trail / "who changed what" is a
            natural add-on.)</p>
        </Reveal>
        <Reveal summary='Q: "Is greedy debt simplification actually optimal? Prove or hedge."'>
          <p>Hedge honestly: greedy (biggest creditor ↔ biggest debtor) is a strong heuristic that\'s optimal in
            many cases and always produces at most n−1 transfers for n people, but the true minimum-transaction
            problem is NP-hard (reducible from subset-sum — you\'d want to find subsets that net to zero and
            settle them internally). For a real app, greedy is the right call: near-optimal, fast, simple. The
            interview-winning move is knowing it\'s a heuristic and being able to say WHY the exact version is
            hard, rather than claiming greedy is provably minimal.</p>
        </Reveal>
        <Reveal summary='Q: "A friend isn&apos;t in the group but I paid for them. Model it?"'>
          <p>Payer and participants are independent sets — the payer need not be a participant, and a
            participant need not have paid. So an Expense references a payer (or even multiple payers, if you
            allow split payments) and a separate list of participants with their shares. Modeling payer ≠
            participants from the start (a Part-1 clarifying question) means "I paid for a group I\'m not in"
            just works: the payer is a creditor to all participants, owing nothing themselves. Conflating
            payer and participant is the bug this question probes.</p>
        </Reveal>
        <Reveal summary='Q: "Validate that a percentage split is well-formed — what exactly do you check?"'>
          <p>Three things, all up front (fail fast, Day 19): percentages are non-negative, they cover exactly
            the participant set (no missing/extra people), and they sum to 100 (in exact arithmetic — beware
            33.33% × 3 = 99.99%, so allow the same remainder handling as the penny problem, or require the
            percentages themselves to sum to 100 and let the MONEY rounding absorb the cent). Same universal
            invariant as every split: the parts cover the whole. Surfacing the percentage-rounding edge (it has
            the same penny issue as equal split) is the depth signal.</p>
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
        <strong>Day 53 complete?</strong> Homework: build it — a <C>SplitStrategy</C> interface with
        <C> EqualSplit</C> (paise-correct remainder), <C>ExactSplit</C>, and <C>PercentSplit</C> (each
        validating the sum), a <C>BalanceSheet</C> that maintains pairwise net balances as expenses are added
        (excluding the payer\'s share), and a <C>simplify()</C> that nets everyone out and greedily matches
        creditors to debtors. Prove it with tests: (a) ₹100 split equally three ways sums to exactly ₹100;
        (b) after a few expenses, all group balances sum to zero; (c) a 3-person debt cycle simplifies to zero
        payments. Stretch: make <C>Money</C> currency-aware and reject cross-currency addition.
        <br /><br />
        Next: <strong>Day 54 — ATM</strong>: the state machine that handles your money — card → PIN → select →
        dispense, the cash-dispensing problem (which notes to give), and transactions that must never lose a
        rupee.
      </div>
    </div>
  )
}
