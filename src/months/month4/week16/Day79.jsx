import { useState, useEffect } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: 45-minute phase timer ============ */
const PHASES = [
  { label: 'clarify', minutes: '0–5', pct: 5 / 45, nudge: '❓ Ask 3–4 design-shaping questions. State assumptions out loud. Say what is OUT of scope.' },
  { label: 'entity model', minutes: '5–15', pct: 15 / 45, nudge: '📦 Draw 4–6 entity boxes with fields, types, and cardinalities. No methods yet.' },
  { label: 'core flow', minutes: '15–30', pct: 30 / 45, nudge: '⌨️ Write the 1–2 hardest methods. Name patterns. Narrate every decision.' },
  { label: 'edge cases', minutes: '30–38', pct: 38 / 45, nudge: '🧪 Concurrency, null guards, state machine transitions, failure modes.' },
  { label: 'wrap-up', minutes: '38–45', pct: 1, nudge: '📋 Name patterns used. Mention one scale concern. Invite questions. Keep talking.' },
]

function fmt(s) {
  const m = Math.floor(s / 60), ss = s % 60
  return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss
}

function InterviewTimer() {
  const [left, setLeft] = useState(45 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || left === 0) return
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running, left])

  const elapsed = 45 * 60 - left
  const progress = elapsed / (45 * 60)
  const phaseIdx = left === 0
    ? PHASES.length - 1
    : PHASES.findIndex((p) => progress < p.pct)
  const phase = PHASES[phaseIdx === -1 ? PHASES.length - 1 : phaseIdx]

  function reset() { setLeft(45 * 60); setRunning(false) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · interview clock — start it when you sit down</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 40, fontWeight: 700, color: left === 0 ? 'var(--red)' : left < 5 * 60 ? 'var(--amber)' : 'var(--ink)' }}>
          {fmt(left)}
        </span>
        {!running
          ? <button className="act" onClick={() => left > 0 && setRunning(true)}>{elapsed > 0 && left > 0 ? '▶ resume' : '▶ start interview'}</button>
          : <button className="ghost act" onClick={() => setRunning(false)}>⏸ pause</button>}
        <button className="ghost act" onClick={reset}>reset</button>
      </div>
      <div style={{ display: 'flex', width: '100%', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 8 }}>
        {PHASES.map((p, i) => {
          const start = i === 0 ? 0 : PHASES[i - 1].pct
          const w = (p.pct - start) * 100
          const active = i === (phaseIdx === -1 ? PHASES.length - 1 : phaseIdx) && elapsed > 0
          const past = progress >= p.pct
          return (
            <div key={i} style={{
              width: w + '%', padding: '6px 2px', textAlign: 'center',
              fontFamily: 'IBM Plex Mono', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden',
              background: active ? '#FFF1D6' : past ? '#EAF7EF' : '#fff',
              borderRight: i < PHASES.length - 1 ? '1px solid var(--line)' : 'none',
              fontWeight: active ? 700 : 400,
            }}>{p.label} ({p.minutes})</div>
          )
        })}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {left === 0
          ? <span>⏰ <b>Pens down.</b> Name the patterns you used. Invite the interviewer's questions.</span>
          : elapsed === 0
            ? <span>Press start when the interviewer finishes reading the problem statement.</span>
            : <span style={{ fontSize: 13 }}><b>{phase.label.toUpperCase()}</b> — {phase.nudge}</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: narration builder ============ */
const NARRATION_TYPES = ['Decision', 'Trade-off', 'Pattern', 'Concurrency', 'Simplification']
const NARRATION_ITEMS = [
  {
    decision: 'You choose a Strategy interface for payment instead of a switch statement.',
    options: ['Decision', 'Trade-off', 'Pattern', 'Concurrency', 'Simplification'],
    a: 0,
    hint: 'You are picking one design option over another — that is a Decision. "I chose Strategy over switch because new payment types will be added."',
  },
  {
    decision: 'Fan-out writes to 10 million follower feeds per celebrity post.',
    options: ['Decision', 'Trade-off', 'Pattern', 'Concurrency', 'Simplification'],
    a: 1,
    hint: 'This is a cost of the design choice — a Trade-off. "Fan-out is O(followers) on write — for a celebrity that is 10M writes. I would switch to pull-on-read above a threshold."',
  },
  {
    decision: 'Each state (IDLE, LOCKED, CARD_INSERTED) is its own class with a handle() method.',
    options: ['Decision', 'Trade-off', 'Pattern', 'Concurrency', 'Simplification'],
    a: 2,
    hint: 'Naming a known GoF pattern — that is Pattern narration. "This is the State pattern — each state knows what transitions are valid."',
  },
  {
    decision: 'Two threads both pass the seat.isAvailable() check before either books.',
    options: ['Decision', 'Trade-off', 'Pattern', 'Concurrency', 'Simplification'],
    a: 3,
    hint: 'A race condition is a Concurrency concern. "Two threads could both pass this check — I need to make this atomic with synchronized or CAS."',
  },
  {
    decision: 'You skip building the full search index in the implementation.',
    options: ['Decision', 'Trade-off', 'Pattern', 'Concurrency', 'Simplification'],
    a: 4,
    hint: 'Telling the interviewer what you are leaving out is a Simplification statement. "I am not implementing the full search index here — in production I would use Elasticsearch."',
  },
]

function NarrationBuilder() {
  const [picks, setPicks] = useState({})
  const [revealed, setRevealed] = useState({})

  function pick(idx, choice) {
    if (picks[idx] !== undefined) return
    setPicks((p) => ({ ...p, [idx]: choice }))
  }

  function reveal(idx) {
    setRevealed((r) => ({ ...r, [idx]: true }))
  }

  const score = Object.entries(picks).filter(([i, v]) => v === NARRATION_ITEMS[i].a).length

  return (
    <div className="panel">
      <div className="ptitle">Live demo · narration builder — match the statement to its type</div>
      <p style={{ fontSize: 13.5, margin: '0 0 12px' }}>
        For each design scenario, pick the type of narration sentence it belongs to. Then click "Why" to see the script.
      </p>
      {NARRATION_ITEMS.map((item, idx) => {
        const picked = picks[idx]
        const correct = item.a
        const isRight = picked === correct
        return (
          <div key={idx} style={{ marginBottom: 14, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>{idx + 1}. {item.decision}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {NARRATION_TYPES.map((type, ti) => {
                let bg = '#fff', col = 'var(--ink)', border = '1px solid var(--line)'
                if (picked !== undefined) {
                  if (ti === correct) { bg = '#EAF7EF'; col = '#1d7a3a'; border = '1px solid #1d7a3a' }
                  else if (ti === picked && !isRight) { bg = '#FDECEC'; col = 'var(--red)'; border = '1px solid var(--red)' }
                } else if (picked === ti) {
                  bg = '#EEF2FF'; col = 'var(--blue)'
                }
                return (
                  <button key={ti} onClick={() => pick(idx, ti)} style={{
                    padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                    fontFamily: 'IBM Plex Mono', fontSize: 12, background: bg, color: col, border,
                  }}>{type}</button>
                )
              })}
            </div>
            {picked !== undefined && (
              <div style={{ fontSize: 13 }}>
                {isRight ? '✅ Correct! ' : `❌ That was "${NARRATION_TYPES[correct]}". `}
                <button className="ghost act" style={{ fontSize: 11.5, padding: '3px 8px' }} onClick={() => reveal(idx)}>Why?</button>
                {revealed[idx] && <div style={{ marginTop: 6, color: '#444', fontStyle: 'italic' }}>{item.hint}</div>}
              </div>
            )}
          </div>
        )
      })}
      <div className="statbar" style={{ display: 'block' }}>
        Score: <b>{score} / {NARRATION_ITEMS.length}</b>
        {score === NARRATION_ITEMS.length && ' 🏆 You know how to narrate your design!'}
      </div>
    </div>
  )
}

/* ============ Interactive 3: card flip — the 5 sentences ============ */
const SENTENCES = [
  {
    sentence: '"Before I start, let me ask a few questions to understand the scope."',
    why: 'This signals you are not a cowboy coder who dives in blind. It shows professional habit. Interviewers expect this and score it.',
    phase: 'Clarify (minute 0–5)',
  },
  {
    sentence: '"I will draw the entity model first so we have a shared vocabulary."',
    why: 'This shows you know that code without context is unreadable. The interviewer cannot evaluate a method they have no context for. Entity-first is a senior engineer habit.',
    phase: 'Entity model (minute 5–15)',
  },
  {
    sentence: '"There is a check-then-act race here — I need to make this atomic."',
    why: 'This is the single sentence that most separates senior from junior. Juniors never say it. Seniors say it within 30 seconds of seeing shared mutable state.',
    phase: 'Core flow (minute 15–30)',
  },
  {
    sentence: '"I am using [Pattern Name] here because [one-sentence reason]."',
    why: 'Naming a pattern tells the interviewer you have a shared vocabulary with the team. You do not need to say "Strategy" every time — but naming it once per problem adds a lot of signal.',
    phase: 'Core flow (minute 15–30)',
  },
  {
    sentence: '"At scale, [X] would become a bottleneck — I would address it by [Y]."',
    why: 'This shows systems thinking without derailing the interview. You are not saying "let me redesign everything for scale." You are showing awareness of the next problem.',
    phase: 'Wrap-up (minute 38–45)',
  },
]

function CardFlip() {
  const [idx, setIdx] = useState(0)
  return (
    <div className="panel">
      <div className="ptitle">Live demo · the 5 hire-signal sentences — click through each</div>
      <div style={{ padding: '20px 16px', border: '2px solid var(--blue)', borderRadius: 10, minHeight: 120, position: 'relative' }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'var(--blue)', marginBottom: 8 }}>
          SENTENCE {idx + 1} / {SENTENCES.length} · {SENTENCES[idx].phase}
        </div>
        <div style={{ fontFamily: 'Space Grotesk', fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 14, lineHeight: 1.5 }}>
          {SENTENCES[idx].sentence}
        </div>
        <div style={{ fontSize: 13.5, color: '#444', lineHeight: 1.6 }}>{SENTENCES[idx].why}</div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
        <button className="ghost act" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>← Prev</button>
        <button className="act" onClick={() => setIdx((i) => Math.min(SENTENCES.length - 1, i + 1))} disabled={idx === SENTENCES.length - 1}>Next →</button>
        <div className="modbtns" style={{ marginBottom: 0 }}>
          {SENTENCES.map((_, i) => (
            <button key={i} className={i === idx ? 'on' : ''} onClick={() => setIdx(i)} style={{ minWidth: 32 }}>{i + 1}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============ Interactive 4: stuck-moment simulator ============ */
const STUCK_SCENARIOS = [
  {
    scenario: 'You have read the problem. You stare at the blank page. You have no idea what entities to draw.',
    options: [
      'Say "I need a minute to think" and go silent for 90 seconds.',
      'Start writing Java code immediately so the interviewer sees progress.',
      'Say "Let me think out loud. The problem mentions [X]. The nouns suggest [A, B, C] as my main classes. I will start with those."',
      'Ask "Can you give me a hint about the entities?"',
    ],
    a: 2,
    feedback: 'Correct. The noun-scan recovery always works. Every problem statement contains its entities as nouns. Read it aloud, underline them, and start drawing boxes. You never truly have zero starting point.',
  },
  {
    scenario: 'You are designing a payment system and cannot decide between Strategy and State.',
    options: [
      'Say "I do not know which pattern to use here."',
      'Pick one silently and keep coding without explaining.',
      'Say "I see two approaches. Strategy fits if the algorithm is chosen at construction time. State fits if the behaviour changes at runtime based on internal transitions. Here I think [Strategy/State] is right because..."',
      'Ask the interviewer which pattern they prefer.',
    ],
    a: 2,
    feedback: 'Correct. Naming the trade-off space buys you 30 seconds and shows senior-level thinking. The interviewer does not care which you pick as much as they care that you can articulate why.',
  },
  {
    scenario: 'You have written a method and realise the return type is wrong. It does not compile.',
    options: [
      'Erase everything and start the method over from scratch.',
      'Say "Let me flag this — I think there is an issue with this method\'s return type. I will circle it and come back. Let me keep moving so we cover the key flows."',
      'Stay silent and spend 3 minutes fixing it in place.',
      'Say "This is wrong, I cannot continue."',
    ],
    a: 1,
    feedback: 'Correct. Never erase and restart. Circle the bug, say it out loud, and keep moving. The interviewer is not looking for perfect code — they are looking for how you handle mistakes.',
  },
]

function StuckSimulator() {
  const [step, setStep] = useState(0)
  const [picks, setPicks] = useState({})

  const cur = STUCK_SCENARIOS[step]
  const picked = picks[step]

  function pick(i) {
    if (picks[step] !== undefined) return
    setPicks((p) => ({ ...p, [step]: i }))
  }

  function next() {
    if (step < STUCK_SCENARIOS.length - 1) setStep((s) => s + 1)
  }

  function restart() {
    setStep(0)
    setPicks({})
  }

  const score = Object.entries(picks).filter(([i, v]) => v === STUCK_SCENARIOS[i].a).length

  if (step >= STUCK_SCENARIOS.length && Object.keys(picks).length === STUCK_SCENARIOS.length) {
    return (
      <div className="panel">
        <div className="ptitle">Live demo · stuck-moment simulator</div>
        <p style={{ fontSize: 15 }}>All scenarios done! Score: <b>{score} / {STUCK_SCENARIOS.length}</b></p>
        {score === STUCK_SCENARIOS.length
          ? <Good>You know how to recover from every stuck moment. That is a key interview skill.</Good>
          : <Warn>Review the scripts above — the recovery moves you missed are the ones to rehearse tonight.</Warn>}
        <button className="act" style={{ marginTop: 10 }} onClick={restart}>Try again</button>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · stuck-moment simulator — pick the best recovery move</div>
      <div className="statbar" style={{ marginBottom: 10, display: 'block' }}>
        Scenario {step + 1} / {STUCK_SCENARIOS.length}
      </div>
      <div style={{ padding: '12px 14px', background: '#F4F3EE', borderRadius: 8, fontSize: 14, fontStyle: 'italic', marginBottom: 14 }}>
        {cur.scenario}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cur.options.map((opt, i) => {
          const isCorrect = i === cur.a
          const isPicked = picked === i
          let bg = '#fff', border = '1px solid var(--line)'
          if (picked !== undefined) {
            if (isCorrect) { bg = '#EAF7EF'; border = '1px solid #1d7a3a' }
            else if (isPicked) { bg = '#FDECEC'; border = '1px solid var(--red)' }
          }
          return (
            <button key={i} onClick={() => pick(i)} style={{
              textAlign: 'left', padding: '9px 12px', borderRadius: 8, fontSize: 13.5,
              fontFamily: 'IBM Plex Sans', cursor: 'pointer', background: bg, border,
            }}>{opt}</button>
          )
        })}
      </div>
      {picked !== undefined && (
        <div style={{ marginTop: 12, fontSize: 13.5 }}>
          {picked === cur.a ? '✅ ' : '❌ '}{cur.feedback}
          <div style={{ marginTop: 10 }}>
            <button className="act" onClick={next}>
              {step < STUCK_SCENARIOS.length - 1 ? 'Next scenario →' : 'See results →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 5: day-before checklist ============ */
const CHECKLIST_ITEMS = [
  'Review the entity-first template (draw class boxes from memory)',
  'Practice drawing 3 ASCII diagrams from memory (entity model, state machine, sequence)',
  'Recite the 7 problem shapes and name one example each from Month 3–4',
  'Explain check-then-act + CAS out loud without looking at notes',
  'Review and memorise the 5 hire-signal sentences (Section 4 of this page)',
  'Do one complete 45-minute timed mock on a problem you have not seen before',
  'Score yourself on the rubric after the mock — write your top-2 gaps',
  'Sleep at least 7 hours',
  'Prepare pen and paper (or whiteboard marker) even if the interview is remote',
  'Set up your code editor and test that it opens cleanly before the call',
  'Look up the company\'s tech stack to name relevant JDK examples',
  'Eat breakfast',
]

function DayBeforeChecklist() {
  const [checked, setChecked] = useState({})
  const count = Object.values(checked).filter(Boolean).length
  const toggle = (i) => setChecked((c) => ({ ...c, [i]: !c[i] }))

  return (
    <div className="panel">
      <div className="ptitle">Live demo · day-before checklist — mark what you have done</div>
      {CHECKLIST_ITEMS.map((item, i) => (
        <button key={i} onClick={() => toggle(i)} style={{
          display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
          fontFamily: 'IBM Plex Sans', fontSize: 13.5, padding: '6px 8px', marginBottom: 4,
          border: '1px solid var(--line)', borderRadius: 6,
          background: checked[i] ? '#EAF7EF' : '#fff',
        }}>{checked[i] ? '☑' : '☐'} {item}</button>
      ))}
      <div className="statbar" style={{ display: 'block', marginTop: 8, background: count === CHECKLIST_ITEMS.length ? '#EAF7EF' : undefined }}>
        <b>{count} / {CHECKLIST_ITEMS.length}</b> done
        {count === CHECKLIST_ITEMS.length && ' ✅ You are ready. Go get some sleep.'}
        {count >= 8 && count < CHECKLIST_ITEMS.length && ' — almost there.'}
        {count < 8 && count > 0 && ' — keep going.'}
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  {
    q: 'In a 45-minute LLD interview, you are at minute 12 and have a beautiful entity model with 8 classes. What should you do next?',
    o: [
      'Keep refining the entity model until it is perfect.',
      'Start writing the 1–2 hardest methods now — you are in the core-flow phase.',
      'Ask the interviewer if the entity model looks right before proceeding.',
      'Begin adding getters and setters to each class.',
    ],
    a: 1,
    e: 'Minute 12 is inside the 5–15 entity-model phase. The model is done when you have 4–6 classes with fields and cardinalities — not when it is perfect. At minute 15, shift to core flow: the hardest 1–2 methods. Perfecting the model past minute 15 eats the code time.',
    w: { 0: 'Perfecting the model past 15 minutes means no code gets written — the interviewer cannot see you code.', 2: 'Asking for approval before proceeding can feel like lack of confidence. Narrate your reasoning and keep moving.', 3: 'Getters and setters are boilerplate. Never write them in an interview — they consume time and add zero signal.' },
    r: { id: 's1', label: 'Section 1 — the 45-minute breakdown' },
  },
  {
    q: 'What is the single most important thing to draw BEFORE writing any Java code in an LLD interview?',
    o: [
      'A list of the design patterns you plan to use.',
      'A sequence diagram showing the request flow.',
      'The state machine for the core object.',
      'The entity model: 4–6 class boxes with fields and cardinalities.',
    ],
    a: 3,
    e: 'The entity model is the shared vocabulary. Without it, the interviewer has no context for the code you write. Every method you write derives from an entity — if the entity is missing, the method has nowhere to live. Draw entities first, always.',
    w: { 0: 'A list of patterns without context is meaningless. Draw the entities; the patterns emerge naturally from the structure.', 1: 'Sequence diagrams come later — they show flow, not structure. The entity model must come first so you have things to put on the lifelines.', 2: 'State machines are important but they apply to one entity. The full entity model shows all the classes and their relationships.' },
    r: { id: 's2', label: 'Section 2 — the entity-first rule' },
  },
  {
    q: 'The interviewer asks "Why did you use an interface here instead of an abstract class?" You are not 100% sure. What is the best response?',
    o: [
      '"Both work here. I chose an interface because the implementors already extend other classes (no multiple inheritance in Java), and interfaces keep the type system simpler. Though an abstract class would let me share default behaviour."',
      'Change your code to use an abstract class to avoid conflict.',
      '"An interface is always better than an abstract class."',
      '"I do not know — I just defaulted to an interface."',
    ],
    a: 0,
    e: 'Naming the trade-off space is the senior-engineer move. You acknowledge both options, state your reasoning, and mention the alternative. Saying "I do not know" ends the thread. Claiming one is always better shows you do not understand when each applies.',
    w: { 1: 'Changing your design to avoid the question signals that you do not stand behind your choices. Defend it with reasoning instead.', 2: '"Always" is almost never true in engineering. Saying it signals you have memorised rules but not understood them.', 3: '"I do not know" closes the conversation and signals lack of confidence. Even a partial answer with reasoning is better.' },
    r: { id: 's3', label: 'Section 3 — talking out loud' },
  },
  {
    q: 'You are at minute 22. You notice your method has the wrong return type — it returns void but should return a Ticket. What do you do?',
    o: [
      'Erase the method and start it over.',
      'Ask the interviewer to ignore that method.',
      'Stay silent for 3 minutes while you fix every line.',
      'Circle the method, say "I see a bug here — return type should be Ticket, not void. I will fix it after covering the core flow", and keep going.',
    ],
    a: 3,
    e: 'Circle and narrate is the professional recovery. It shows you caught your own bug (positive signal), you prioritise coverage over perfection (senior habit), and you do not let one mistake derail the session. Coming back to fix it at minute 38 is perfectly valid.',
    w: { 0: 'Erasing and restarting loses 3–5 minutes, breaks the flow, and signals panic under pressure.', 1: '"Please ignore this" sounds like you are giving up on correctness. Acknowledge it, flag it, plan to fix it.', 2: '3 minutes of silence is the second-worst thing you can do. Interviewers cannot grade silence.' },
    r: { id: 's5', label: 'Section 5 — recovery scripts' },
  },
  {
    q: 'What does the interviewer weight HIGHEST when scoring a candidate?',
    o: [
      'Using the most design patterns in the solution.',
      'Naming the defining problem in minute 1, drawing the entity model, and talking through trade-offs.',
      'Getting every edge case — null checks, validation, all corner cases covered.',
      'Writing the most lines of Java code.',
    ],
    a: 1,
    e: 'The three highest-weighted signals are: (1) naming the defining problem early, (2) entity model first, (3) talking through trade-offs unprompted. Edge cases are nice-to-have; code quantity is irrelevant; pattern count is low-signal without the reasoning behind each one.',
    w: { 0: 'Naming patterns is medium-weight. But using the most patterns without reasoning is worse than using one and explaining why.', 2: 'Edge cases are the lowest-weight rubric item — they are "nice to have" but do not define the hire signal.', 3: 'Lines of code have zero correlation with design quality. A 30-line solution with the right abstractions outscores a 200-line one that misses the state machine.' },
    r: { id: 's6', label: 'Section 6 — what interviewers actually grade' },
  },
  {
    q: 'You are designing a system and discover a check-then-act race. What is the correct sentence to say out loud?',
    o: [
      '"This only happens in production — I will note it and move on."',
      '"I will use a database transaction here."',
      '"Two threads could both pass this check — I need to make this step atomic using synchronized or CAS."',
      '"This is a concurrency problem — I will add a lock somewhere."',
    ],
    a: 2,
    e: 'The exact words matter: name the race (check-then-act), name both threads, and name the solution (synchronized or CAS). "A lock somewhere" is vague. "Database transaction" may be correct but does not show you understand the class-level race. This sentence, said exactly, is a hire signal.',
    w: { 0: 'Saying "only in production" suggests you do not take concurrency seriously. It also happens in tests with thread pools.', 1: 'A database transaction may fix it at the persistence layer, but it does not show you understand the class-level race. The interviewer wants to hear you name it.', 3: '"A lock somewhere" is vague. Where? On what? Naming synchronized or CAS on the specific resource shows you know the tool.' },
    r: { id: 's3', label: 'Section 3 — talking out loud' },
  },
  {
    q: 'An interviewer asks "How would this scale to millions of users?" You are 10 minutes in and have just finished the entity model. What is the best response?',
    o: [
      '"Great question — I want to finish the core class model first. At the end, I will name the specific bottleneck and how I would address it."',
      '"I will use Kafka and Redis and a CDN."',
      'Ignore the question and keep drawing entities.',
      'Redesign everything for microservices and distributed databases before writing any code.',
    ],
    a: 0,
    e: 'Naming tools (Kafka, Redis) without a clean local design first is a red flag — it suggests you reach for buzzwords before understanding the problem. The right move is to park the scale question, finish the core design, and address it at minute 38 with a specific bottleneck named.',
    w: { 1: 'Naming infrastructure tools without explaining what bottleneck they solve is a buzzword answer. Interviewers penalise it.', 2: 'Ignoring the question is rude and signals poor communication.', 3: 'Redesigning for distributed at minute 10 means no code gets written and the core LLD never gets evaluated. The scale discussion is minute 38–45.' },
    r: { id: 's1', label: 'Section 1 — the 45-minute breakdown' },
  },
  {
    q: 'How many classes should your entity model have in a 45-minute interview?',
    o: [
      'As many as needed — there is no limit.',
      '10–15 — show you have thought of everything.',
      '4–7 — enough to show the domain without over-engineering.',
      '1–3 — keep it simple.',
    ],
    a: 2,
    e: '4–7 classes is the target for 45 minutes. Under 3 means you are modelling a toy, not a real system — the interviewer has nothing to evaluate. Over 9 means you are over-engineering or not grouping concepts well. 4–7 classes in 10 minutes leaves 35 minutes for implementation and edge cases.',
    w: { 0: 'More classes mean more time. You have 10 minutes for the entity model. Every class beyond 7 is risk.', 1: '10–15 classes in 10 minutes means 40 seconds per class — no field list, no cardinality, no reasoning. The model becomes noise.', 3: '1–3 classes is too simple. A Parking Lot with only ParkingLot and Car has nowhere to put the state machine, pricing, or concurrency logic.' },
    r: { id: 's10', label: 'Section 10 — interview corner' },
  },
]

/* ============ The page ============ */
export default function Day79() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 16 · Day 79</div>
        <h1>The Interview Day:<br />Protocol, Mindset &amp; Recovery Scripts</h1>
        <p>You have done 79 days of design. Now one last skill: how to PERFORM your design under pressure
          in 45 minutes. This day is the instruction manual for the room.</p>
        <div className="chips">
          {['45-Min Protocol', 'Talk Out Loud', 'Entity-First', 'Recovery Scripts', 'What Interviewers Grade'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* s1: 45-minute breakdown */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The 45-minute breakdown — minute by minute</h2>
        <p>An LLD interview is not a free-form session. It has five phases. Every minute you spend in the
          wrong phase costs you signal in the phase that matters. Know this table cold.</p>
        <table className="matrix">
          <thead>
            <tr><th>Phase</th><th>Time</th><th>What to do</th><th>What NOT to do</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Clarify</strong></td>
              <td>0–5 min</td>
              <td>Ask 3–4 design-shaping questions. State assumptions out loud. Say what is out of scope.</td>
              <td>Ask trivial questions. Spend more than 7 minutes here. Go silent.</td>
            </tr>
            <tr>
              <td><strong>Entity model</strong></td>
              <td>5–15 min</td>
              <td>Draw 4–6 class boxes with fields and cardinalities. Identify enums. Draw the state machine if needed.</td>
              <td>Start writing methods before the boxes exist. Add more than 7 classes.</td>
            </tr>
            <tr>
              <td><strong>Core flow</strong></td>
              <td>15–30 min</td>
              <td>Write the 1–2 hardest methods. Name patterns you use. Narrate every decision.</td>
              <td>Write boilerplate getters and setters. Go silent for more than 2 minutes.</td>
            </tr>
            <tr>
              <td><strong>Edge cases</strong></td>
              <td>30–38 min</td>
              <td>Concurrency, null guards, state-machine violations, validation, failure modes.</td>
              <td>Ignore everything from Month 4. Say "I ran out of time for edge cases."</td>
            </tr>
            <tr>
              <td><strong>Wrap-up</strong></td>
              <td>38–45 min</td>
              <td>Name patterns used. Mention one scale concern and how you would address it. Invite questions.</td>
              <td>Stop talking and go quiet. Start a new feature nobody asked for.</td>
            </tr>
          </tbody>
        </table>
        <InterviewTimer />
        <Note><strong>Design-shaping vs clock-burning questions.</strong> "What database should I use?" is a
          clock-burner — it does not change your class model. "Is the time limit enforced server-side?" is
          design-shaping — it adds a guard to your method. Only ask questions whose answers change your code.</Note>
      </section>

      {/* s2: entity-first rule */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The entity-first rule</h2>
        <p>Always draw your entity model before writing a single method. No exceptions. Here is why:</p>
        <ul>
          <li><strong>Context before code.</strong> An interviewer cannot evaluate a method they have no context for. If they see <C>book()</C> before they know what <C>Booking</C> is, they are lost.</li>
          <li><strong>Missing entities = missing methods.</strong> Every class you skip in the entity model becomes a method that has nowhere to live. The code will not compile even in spirit.</li>
          <li><strong>The entity model is your contract.</strong> Once you have 4–6 boxes with fields, you and the interviewer share a vocabulary. Everything after that is derivable.</li>
        </ul>
        <Code html={`  BEFORE (code first) — interviewer is confused
  ─────────────────────────────────────────────────
  "I will start with the park() method..."

      void park(Car car) {
          // which class does this belong to?
          // what is the return type?
          // what fields are involved?
          // interviewer has NO context
      }

  AFTER (entity model first) — interviewer follows every line
  ─────────────────────────────────────────────────────────────
  ┌────────────────────────┐   ┌─────────────────────────────┐
  │      ParkingLot        │   │           Spot              │
  │────────────────────────│   │─────────────────────────────│
  │ - spots: List&lt;Spot&gt;    │ 1 │ - spotId: String            │
  │ - levels: int          │───│ - type: SpotType            │
  │ - allocationStrategy   │ * │ - status: SpotStatus        │
  │────────────────────────│   │─────────────────────────────│
  │ + park(vehicle): Ticket│   │ + occupy(vehicle): void     │
  │ + exit(ticket): double │   │ + free(): void              │
  └────────────────────────┘   └─────────────────────────────┘

  NOW the interviewer sees park() and knows exactly
  what ParkingLot, Spot, and Ticket are.`} />
        <Code html={`  TEMPLATE — how to draw ANY class box
  ─────────────────────────────────────────────────
  ┌──────────────────────┐
  │    ClassName         │  ← name in bold
  │──────────────────────│
  │ - field: Type        │  ← fields first
  │ - field2: Type       │
  │──────────────────────│
  │ + method(): RetType  │  ← only the key methods
  └──────────────────────┘

  Rules for the entity model:
  · 4–7 classes is right for 45 minutes
  · Name the type of every field (String, not "text")
  · Write cardinalities on the relationship lines (1, *, 0..1)
  · Closed sets of known values become enums
  · Do NOT write every method — only the 2–3 most important ones`} />
        <Good><strong>The box takes 90 seconds to draw.</strong> Five boxes = 7.5 minutes. You will finish the
          entity model inside the allotted 10 minutes, and you will have a shared language for the next 30 minutes
          of code. Every second you spend on the entity model pays itself back 10x.</Good>
      </section>

      {/* s3: talking out loud */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>Talking out loud — what to say</h2>
        <p>The single biggest differentiator between candidates. Interviewers grade what they HEAR as much
          as what they SEE. A candidate who narrates well and writes average code beats a candidate who writes
          great code in silence.</p>
        <p>Five types of narration sentences. Practice all five until they come naturally:</p>
        <ol>
          <li><strong>Decision:</strong> "I am choosing [X] rather than [Y] because [one reason]."</li>
          <li><strong>Trade-off:</strong> "The cost of this is [Z] — at scale, I would address it by [W]."</li>
          <li><strong>Pattern:</strong> "This is the [Name] pattern — [one-sentence reason it fits]."</li>
          <li><strong>Concurrency:</strong> "Two threads could both pass this check — I need to make this atomic."</li>
          <li><strong>Simplification:</strong> "I am not implementing [X] here — in production I would use [Y]."</li>
        </ol>
        <NarrationBuilder />
        <Note><strong>You do not need to narrate every line.</strong> Narrate every DECISION. A line that is
          obvious needs no comment. A line where you chose A over B needs 10 seconds of out-loud reasoning.</Note>
      </section>

      {/* s4: the 5 sentences */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>The 5 sentences that close a hire</h2>
        <p>When an interviewer hears these five sentences, they mentally tick "senior engineer." Memorise them
          word for word. They are the clearest verbal signals in the room.</p>
        <CardFlip />
        <Good><strong>You do not need to say all five.</strong> One or two per interview is enough to set you
          apart. But knowing all five means you have the vocabulary ready when the moment comes.</Good>
      </section>

      {/* s5: recovery scripts */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>Recovery scripts — when you are stuck</h2>
        <p>Every engineer gets stuck in an interview. The interview does not end when you freeze — it ends when
          you give up. There is a specific script for every stuck scenario. Practice them now:</p>

        <Reveal summary="Scenario A — You do not know what entities to start with">
          <p><strong>Script:</strong> "Let me think out loud. The problem mentions [X]. The nouns in that sentence
            suggest [A, B, C] as my main classes. I will start with those and refine as I go."</p>
          <p>Always fall back to: read the problem statement aloud → underline every noun → those are your classes.
            A Parking Lot problem gives you: Parking Lot, Spot, Vehicle, Ticket, Gate. You are never starting from
            zero. The problem statement is your entity list.</p>
          <Code html={`  NOUN SCAN — always works
  ────────────────────────────────────────────────
  Problem: "Design a vending machine that accepts
  coins and dispenses items."

  Nouns → entities:
  · vending machine  → VendingMachine
  · coin             → Coin  (or Money as Value Object)
  · item             → Item
  · (implied) slot   → Slot  (where items live)

  These four boxes get you started in under 2 minutes.`} />
        </Reveal>

        <Reveal summary="Scenario B — You cannot decide which pattern to use">
          <p><strong>Script:</strong> "I see two approaches. I could use [simpler thing], but that will not
            scale because [reason]. I think [better thing] is right here — let me think through it for 30
            seconds."</p>
          <p>Naming the trade-off space buys you 30 seconds and demonstrates critical thinking. The interviewer
            does not care which you pick as much as they care that you can articulate why. "I do not know
            which pattern" closes the conversation. "I see a tension between Strategy and State; I will go
            with State because the behaviour changes at runtime" opens it.</p>
        </Reveal>

        <Reveal summary="Scenario C — You wrote code that does not compile">
          <p><strong>Script:</strong> "Let me flag this — I think there is an issue with this method's return
            type. I will circle it and come back. Let me keep moving so we cover the key flows."</p>
          <p>Never erase and restart. Erasing costs 3 minutes and signals panic. Circle the bug with a word
            "FIX" next to it. Keep moving. At minute 38, return to it. The interviewer scores on what you produce
            in total — one circled bug does not fail you. One silent restart at minute 22 might.</p>
        </Reveal>

        <StuckSimulator />
        <Warn><strong>The worst thing you can do is go silent.</strong> Two minutes of silence is the interview
          killer. If you are thinking, say "I am thinking." That one sentence keeps the channel open and signals
          self-awareness. Silence reads as panic or disengagement.</Warn>
      </section>

      {/* s6: what interviewers grade */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>What interviewers actually grade</h2>
        <p>The rubric below is based on how senior engineers who conduct LLD interviews describe their scoring.
          Most candidates focus on the low-weight items and miss the high-weight ones.</p>
        <table className="matrix">
          <thead>
            <tr><th>What they observe</th><th>What it signals to them</th><th>Weight</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Named the defining problem in minute 1</td>
              <td>You understand the domain, not just the code</td>
              <td><strong>High</strong></td>
            </tr>
            <tr>
              <td>Drew entity model before any code</td>
              <td>Senior engineering habit — you design before you implement</td>
              <td><strong>High</strong></td>
            </tr>
            <tr>
              <td>Talked through trade-offs unprompted</td>
              <td>Critical thinking and real-world experience</td>
              <td><strong>High</strong></td>
            </tr>
            <tr>
              <td>Named the concurrency race and its fix</td>
              <td>Month 4 readiness — production-grade thinking</td>
              <td><strong>High</strong></td>
            </tr>
            <tr>
              <td>Named patterns correctly with reasoning</td>
              <td>Shared vocabulary with the engineering team</td>
              <td>Medium</td>
            </tr>
            <tr>
              <td>Code compiles in spirit (correct types, no syntax explosions)</td>
              <td>Attention to correctness</td>
              <td>Medium</td>
            </tr>
            <tr>
              <td>Wrapped up cleanly and invited questions</td>
              <td>Communication skills and professionalism</td>
              <td>Medium</td>
            </tr>
            <tr>
              <td>Got every edge case on the first pass</td>
              <td>Thoroughness (nice to have)</td>
              <td>Low</td>
            </tr>
          </tbody>
        </table>
        <Warn><strong>The edge-case trap.</strong> Most candidates spend minutes 30–38 on null checks and
          validation they already handled, and never mention concurrency. Interviewers rate concurrency as HIGH
          weight. "I would add synchronized here because two threads could race" takes 10 seconds and moves you
          from Low to High weight on the single most differentiating signal.</Warn>
      </section>

      {/* s7: failure modes */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Common failure modes and how to avoid them</h2>
        <Warn><strong>Failure mode 1 — Spending all 45 minutes on entities.</strong> Your entity model should
          be done by minute 15. If it is not, you have gone too deep on one class or added too many. Stop at
          5–7 classes, and move to code. Interviewers cannot evaluate a design that has no implementation.</Warn>
        <Warn><strong>Failure mode 2 — Writing code before any entity model.</strong> The reverse: diving into
          code at minute 2. The interviewer has no shared vocabulary. Every method you write requires 30 seconds
          of explanation that the entity model would have given them for free. Entity model first, always.</Warn>
        <Warn><strong>Failure mode 3 — Silence for more than 2 minutes.</strong> If you are thinking, say
          "I am thinking through the state machine" or "let me trace through this method." The interviewer
          must be able to follow your thought process. Silence is unreadable and reads as being stuck.</Warn>
        <Warn><strong>Failure mode 4 — Deleting everything and starting over when stuck.</strong> If your
          entity model has an issue at minute 20, you do not have time to restart. Circle the issue, note it,
          and keep building. Come back at minute 38. A design with one flagged issue beats a half-finished restart.</Warn>
        <Warn><strong>Failure mode 5 — Implementing full CRUD before the core flow.</strong> A Parking Lot
          does not need a full <C>ParkingLotRepository</C> with <C>findByType()</C> before you write
          <C>park()</C>. Core flow first. Infrastructure last. In 45 minutes, you may never need the repository
          at all.</Warn>
        <Warn><strong>Failure mode 6 — Saying "I will use a database" without specifying the model.</strong>
          "I will store this in a database" adds no information. "I will store a <C>Ticket</C> record with
          <C>spotId</C>, <C>vehicleId</C>, <C>entryTime</C>, and <C>price</C>" tells the interviewer everything
          they need. Be specific or say nothing.</Warn>
        <Warn><strong>Failure mode 7 — Not naming a single pattern.</strong> Even if you have used Strategy in
          your pricing logic, if you never say the word "Strategy," the interviewer cannot credit it. Say the
          name, say the reason. 10 seconds.</Warn>
        <Warn><strong>Failure mode 8 — Stopping at obvious cases and ignoring concurrency.</strong> Every
          Month 3 system has a shared-resource claim. If you design a booking system and never mention
          check-then-act, you have missed the defining problem of the domain. Concurrency is not optional.</Warn>
      </section>

      {/* s8: day-before checklist */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>The day-before checklist</h2>
        <p>The evening before the interview — not two hours before, not the morning of. Do this list the
          night before so the material is in working memory when you wake up.</p>
        <DayBeforeChecklist />
        <Note><strong>The single most valuable item on the list:</strong> the timed mock. Everything else is
          review. The mock is the one thing that reveals what you actually do under pressure vs what you think
          you do. Do it even if you are confident. Especially if you are confident.</Note>
      </section>

      {/* s9: one-page cheat sheet */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>One-page cheat sheet — read this in 2 minutes before you walk in</h2>
        <Code html={`  THE INTERVIEW CHEAT SHEET
  ══════════════════════════════════════════════════════════

  MUST DO (in order)
  ──────────────────
  1. Entity model first — 4–7 boxes with fields + cardinalities
  2. Talk every decision — 10-second narration per design choice
  3. Name one pattern — say the name, say the one-sentence reason

  MUST NOT DO
  ───────────
  ✗ Silence for more than 2 minutes
  ✗ Code before the entity model exists
  ✗ Delete and restart when you hit a bug

  RECOVERY SENTENCES (say one of these when stuck)
  ─────────────────────────────────────────────────
  · "Let me think out loud — the nouns in the problem are [A, B, C]..."
  · "I see a trade-off here: [X] is simpler but [Y] is more flexible..."
  · "I will flag this bug and come back — let me keep moving on the core flow."
  · "There is a check-then-act race here — I need to make this atomic."
  · "I am simplifying here — in production I would use [real tool]."

  THE HIRE-SIGNAL MOMENTS
  ───────────────────────
  · Minute 0–1: name the defining problem ("the hard part is...")
  · Minute 5–15: entity model done before first line of code
  · Minute 15–30: "I'm using [Pattern] because..."
  · Minute 22–30: "Two threads could both pass this — I need CAS or synchronized"
  · Minute 38–45: "At scale, [X] is the bottleneck. I would address it by [Y]."

  ENTITY BOX TEMPLATE
  ───────────────────
  ┌──────────────────────┐
  │    ClassName         │
  │──────────────────────│
  │ - field: Type        │
  └──────────────────────┘`} />
      </section>

      {/* s10: interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Interview corner: 5 meta-questions about the interview itself</h2>
        <p>These are questions about the interview process — the things candidates wonder about but rarely ask directly.</p>

        <Reveal summary='Q: "Should I ask about scale — millions of users — right away?"'>
          <p>Only if it affects a core design decision. If the answer to "how many users?" changes whether you
            use a HashMap or a distributed cache, ask it. If it just changes the size of a number, park it.
            The rule: ask scale questions when the answer changes your class model. Ask them at the end
            otherwise. Premature scale talk before the entity model is a red flag — it suggests you
            would rather talk about infrastructure than design.</p>
        </Reveal>

        <Reveal summary='Q: "Is it OK to use Java-specific types like AtomicInteger or ConcurrentHashMap?"'>
          <p>Yes. Interviewers at Java shops expect it, and concreteness shows depth. Saying
            "I would use an <C>AtomicInteger</C> with a CAS loop" is better than "I would use a thread-safe
            counter." Generic pseudocode is fine too — but when you know the specific Java tool, name it.
            Interviewers who know Java respect candidates who know the standard library. The alternative
            is re-implementing things that already exist in <C>java.util.concurrent</C>.</p>
        </Reveal>

        <Reveal summary='Q: "Should I design toward microservices?"'>
          <p>Only if the interviewer explicitly asks. LLD interviews are about class-level design — interfaces,
            classes, methods, patterns, state machines. They are not about deployment topology, service
            boundaries, or infrastructure. Jumping to microservices before the class model is ready signals
            that you are avoiding the hard design work. Stay at the class/method/interface level. If they
            want system design, they will ask a separate system design question.</p>
        </Reveal>

        <Reveal summary='Q: "What if I choose the wrong pattern?"'>
          <p>Name it and reason about it out loud. "I used State here — in hindsight, Strategy might also work
            because the behaviour does not change at runtime. But I will stick with State because I want the
            context object to manage transitions." Reasoning out loud recovers from wrong answers far better
            than silent switching. An interviewer who hears you self-correct with good reasoning often scores
            it as highly as getting it right the first time — because it shows metacognition.</p>
        </Reveal>

        <Reveal summary='Q: "How long should my entity model take — and how do I know when it is done?"'>
          <p>Target 10 minutes. It is done when you have 4–7 classes with fields, types, cardinalities, and
            a state machine for the primary entity. Under 3 classes means the domain is too simple. Over 9
            classes means you are modelling every noun in the problem, not grouping well. The test: can you
            point to a class for every noun the interviewer is likely to ask about? If yes, the model is done.
            If you find yourself adding a 10th class, ask whether it is truly a separate concept or just a
            field on an existing class.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="sQuiz">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz — 8 questions on interview technique</h2>
        <p>These questions are about the interview process, not Java syntax. Click an answer; explanations appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* footer */}
      <div className="footer">
        <strong>Day 79 complete?</strong> Homework: do one final 45-minute timed solo mock on a problem
        you have not seen before. Set a real timer. No reveals, no notes, no pausing. When the timer stops,
        score yourself on the rubric from Section 6. Write your top-2 gaps on paper. Then sleep.
        <br /><br />
        Next: <strong>Day 80 — Graduation</strong>: the final day of the course. A full inventory of what you
        have learned, a map of the 80-day journey, portfolio project ideas, and a personal message before you
        walk into that room.
      </div>
    </div>
  )
}
