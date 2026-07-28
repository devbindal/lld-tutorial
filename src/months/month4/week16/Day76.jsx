import { useState, useEffect } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: 45-min protocol countdown timer ============ */
const PROTOCOL_PHASES = [
  { until: 5 / 45, label: 'clarify', nudge: '❓ Ask 4–6 design-shaping questions. Assume answers out loud. State what is OUT of scope.' },
  { until: 15 / 45, label: 'entity model', nudge: '📦 Draw Exam / Question / Attempt / Answer. Closed sets become enums. State machines on paper.' },
  { until: 35 / 45, label: 'implement', nudge: '⌨️ Exam + Question + Attempt. autoGrade(). canRetake(). Compile every ~8 min. Narrate every decision.' },
  { until: 43 / 45, label: 'edge cases', nudge: '🧪 Server-side expiry. Concurrent attempt prevention. Correct-answer leakage. Drive one happy path.' },
  { until: 1, label: 'self-review', nudge: '📋 Pens down. Score the Section 11 rubric honestly. Write your top-2 gaps.' },
]

function fmt(s) {
  const m = Math.floor(s / 60), ss = s % 60
  return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss
}

function ProtocolTimer() {
  const [duration, setDuration] = useState(45 * 60)
  const [left, setLeft] = useState(45 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || left === 0) return
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running, left])

  const elapsed = duration - left
  const progress = elapsed / duration
  const phaseIdx = left === 0
    ? PROTOCOL_PHASES.length - 1
    : PROTOCOL_PHASES.findIndex((p) => progress < p.until)
  const phase = PROTOCOL_PHASES[phaseIdx === -1 ? PROTOCOL_PHASES.length - 1 : phaseIdx]

  function preset(min) { setDuration(min * 60); setLeft(min * 60); setRunning(false) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · mock interview clock — start when you sit down to design</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {[25, 45, 60].map((m) => (
          <button key={m} className={duration === m * 60 ? 'on' : ''} onClick={() => preset(m)}>{m} min</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 38, fontWeight: 700, color: left === 0 ? 'var(--red)' : 'var(--ink)' }}>
          {fmt(left)}
        </span>
        {!running
          ? <button className="act" onClick={() => left > 0 && setRunning(true)}>{elapsed > 0 && left > 0 ? '▶ resume' : '▶ start the mock'}</button>
          : <button className="ghost act" onClick={() => setRunning(false)}>⏸ pause</button>}
        <button className="ghost act" onClick={() => preset(duration / 60)}>reset</button>
      </div>
      <div style={{ display: 'flex', width: '100%', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 8 }}>
        {PROTOCOL_PHASES.map((p, i) => {
          const start = i === 0 ? 0 : PROTOCOL_PHASES[i - 1].until
          const w = (p.until - start) * 100
          const active = i === (phaseIdx === -1 ? PROTOCOL_PHASES.length - 1 : phaseIdx) && elapsed > 0
          const past = progress >= p.until
          return (
            <div key={i} style={{
              width: w + '%', padding: '6px 2px', textAlign: 'center',
              fontFamily: 'IBM Plex Mono', fontSize: 10.5, whiteSpace: 'nowrap', overflow: 'hidden',
              background: active ? '#FFF1D6' : past ? '#EAF7EF' : '#fff',
              borderRight: i < PROTOCOL_PHASES.length - 1 ? '1px solid var(--line)' : 'none',
              fontWeight: active ? 700 : 400,
            }}>{p.label}</div>
          )
        })}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {left === 0
          ? <span>⏰ <b>Pens down.</b> Go directly to the Section 11 rubric — score yourself honestly before reading the solutions.</span>
          : elapsed === 0
            ? <span>Read the problem in Section 1, write your questions, then press start and work through the reveals.</span>
            : <span style={{ fontSize: 13 }}><b>{phase.label.toUpperCase()}</b> — {phase.nudge}</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: live exam simulator ============ */
const EXAM_QUESTIONS = [
  { id: 'q1', type: 'MCQ', text: 'Which keyword makes a Java variable constant?', options: ['static', 'const', 'final', 'immutable'], correct: 2, points: 2 },
  { id: 'q2', type: 'MCQ', text: 'What does the Observer pattern do?', options: ['It notifies dependents when state changes', 'It caches expensive results', 'It wraps objects to add behaviour', 'It creates objects without specifying their class'], correct: 0, points: 2 },
  { id: 'q3', type: 'MCQ', text: 'Which collection preserves insertion order in Java?', options: ['HashSet', 'ArrayList', 'TreeMap', 'HashMap'], correct: 1, points: 2 },
  { id: 'q4', type: 'ESSAY', text: 'In your own words, explain the difference between compile-time and runtime polymorphism in Java. Give one example of each.', points: 10 },
]
const EXAM_DURATION = 120 // 2 minutes for the demo

function ExamSimulator() {
  const [phase, setPhase] = useState('intro') // intro | taking | submitted | expired
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION)
  const [answers, setAnswers] = useState({}) // { qId: { selectedOption?: int, essayText?: string } }
  const [essayText, setEssayText] = useState('')
  const [essayScore, setEssayScore] = useState(null)

  useEffect(() => {
    if (phase !== 'taking') return
    if (timeLeft === 0) {
      setPhase('expired')
      return
    }
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [phase, timeLeft])

  function startExam() {
    setPhase('taking')
    setAnswers({})
    setEssayText('')
    setEssayScore(null)
    setTimeLeft(EXAM_DURATION)
  }

  function pickMCQ(qId, optIdx) {
    if (phase !== 'taking') return
    setAnswers((a) => ({ ...a, [qId]: { ...(a[qId] || {}), selectedOption: optIdx } }))
  }

  function submitExam() {
    setAnswers((a) => ({ ...a, q4: { essayText } }))
    setPhase('submitted')
  }

  function autoGrade() {
    let score = 0
    EXAM_QUESTIONS.forEach((q) => {
      if (q.type === 'MCQ') {
        const ans = answers[q.id]
        if (ans && ans.selectedOption === q.correct) score += q.points
      }
    })
    return score
  }

  const mcqScore = (phase === 'submitted' || phase === 'expired') ? autoGrade() : null
  const maxMCQ = EXAM_QUESTIONS.filter((q) => q.type === 'MCQ').reduce((s, q) => s + q.points, 0)
  const totalScore = (mcqScore !== null && essayScore !== null) ? mcqScore + essayScore : null

  if (phase === 'intro') {
    return (
      <div className="panel">
        <div className="ptitle">Live demo · accelerated exam (2-min timer so you can see expiry in action)</div>
        <p style={{ fontSize: 14 }}>This demo has 3 MCQ questions and 1 essay. The timer is 2 minutes (not the real 45 — just fast enough to experience auto-expire). MCQs are auto-graded on submit. The essay shows "Pending manual grade."</p>
        <button className="act" onClick={startExam}>Start exam attempt →</button>
      </div>
    )
  }

  if (phase === 'taking') {
    const pct = (timeLeft / EXAM_DURATION) * 100
    return (
      <div className="panel">
        <div className="ptitle">Live demo · exam in progress</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, color: timeLeft < 30 ? 'var(--red)' : 'var(--ink)' }}>{fmt(timeLeft)}</span>
          <div style={{ flex: 1, height: 8, background: 'var(--line)', borderRadius: 4 }}>
            <div style={{ width: pct + '%', height: 8, background: timeLeft < 30 ? 'var(--red)' : 'var(--blue)', borderRadius: 4, transition: 'width 1s linear' }} />
          </div>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5' }}>server-side expiry</span>
        </div>
        {EXAM_QUESTIONS.map((q) => (
          <div key={q.id} style={{ marginBottom: 14, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>{q.id.toUpperCase()} [{q.type}, {q.points} pts] {q.text}</div>
            {q.type === 'MCQ' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {q.options.map((opt, i) => (
                  <button key={i}
                    style={{
                      textAlign: 'left', padding: '5px 10px', borderRadius: 6, fontSize: 13,
                      border: '1px solid var(--line)', cursor: 'pointer',
                      background: answers[q.id]?.selectedOption === i ? 'var(--blue)' : '#fff',
                      color: answers[q.id]?.selectedOption === i ? '#fff' : 'var(--ink)',
                    }}
                    onClick={() => pickMCQ(q.id, i)}>{opt}</button>
                ))}
              </div>
            )}
            {q.type === 'ESSAY' && (
              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Type your essay answer here…"
                style={{ width: '100%', minHeight: 80, padding: 8, fontFamily: 'IBM Plex Sans', fontSize: 13, border: '1px solid var(--line)', borderRadius: 6, boxSizing: 'border-box', resize: 'vertical' }}
              />
            )}
          </div>
        ))}
        <button className="act" onClick={submitExam}>Submit attempt</button>
        <span style={{ marginLeft: 12, fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5' }}>or wait for the timer to expire</span>
      </div>
    )
  }

  // submitted or expired
  return (
    <div className="panel">
      <div className="ptitle">Live demo · attempt {phase === 'expired' ? 'EXPIRED (auto-submitted)' : 'SUBMITTED'}</div>
      <div style={{ padding: '8px 12px', borderRadius: 6, background: phase === 'expired' ? '#FDECEC' : '#EAF7EF', marginBottom: 12, fontSize: 13.5 }}>
        {phase === 'expired'
          ? '⏰ Time ran out — attempt auto-submitted. This is server-side expiry: the server checked startedAt + timeLimit and forced submission.'
          : '✅ Attempt submitted by student.'}
      </div>
      {EXAM_QUESTIONS.map((q) => {
        const ans = answers[q.id] || {}
        return (
          <div key={q.id} style={{ marginBottom: 10, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{q.id.toUpperCase()} — {q.text}</div>
            {q.type === 'MCQ' && (
              <>
                <div style={{ fontSize: 13 }}>Your answer: <b>{ans.selectedOption !== undefined ? q.options[ans.selectedOption] : '(not answered)'}</b></div>
                {ans.selectedOption !== undefined && (
                  ans.selectedOption === q.correct
                    ? <div style={{ color: '#1d7a3a', fontSize: 13 }}>✅ Correct — {q.points}/{q.points} pts</div>
                    : <div style={{ color: 'var(--red)', fontSize: 13 }}>❌ Wrong. Correct: {q.options[q.correct]} — 0/{q.points} pts</div>
                )}
                {ans.selectedOption === undefined && <div style={{ fontSize: 13, color: '#888' }}>0/{q.points} pts (no answer)</div>}
              </>
            )}
            {q.type === 'ESSAY' && (
              <>
                <div style={{ fontSize: 13, fontStyle: 'italic', color: '#555', marginBottom: 6 }}>{ans.essayText || '(no answer provided)'}</div>
                {essayScore === null
                  ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#b57c00' }}>📝 Pending manual grade (teacher reviews this)</span>
                      <input type="number" min="0" max="10" placeholder="0–10"
                        className="txt"
                        style={{ width: 60, padding: '4px 6px', fontFamily: 'IBM Plex Mono', fontSize: 13 }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const v = parseInt(e.target.value, 10)
                            if (!isNaN(v) && v >= 0 && v <= 10) setEssayScore(v)
                          }
                        }}
                      />
                      <button className="ghost act" style={{ fontSize: 12 }} onClick={(e) => {
                        const input = e.target.previousSibling
                        const v = parseInt(input.value, 10)
                        if (!isNaN(v) && v >= 0 && v <= 10) setEssayScore(v)
                      }}>Grade</button>
                    </div>
                  )
                  : <div style={{ color: '#1d7a3a', fontSize: 13 }}>✅ Essay graded: {essayScore}/10 pts by teacher</div>}
              </>
            )}
          </div>
        )
      })}
      <div style={{ padding: '10px 12px', background: '#F4F3EE', borderRadius: 8, marginTop: 8 }}>
        <div style={{ fontFamily: 'Space Grotesk', fontSize: 15 }}>
          MCQ score: <b>{mcqScore}/{maxMCQ}</b>
          {essayScore !== null
            ? <> · Essay: <b>{essayScore}/10</b> · Total: <b>{totalScore}/{maxMCQ + 10}</b></>
            : <> · Essay: <span style={{ color: '#b57c00' }}>pending</span> · Total: <span style={{ color: '#888' }}>not yet final</span></>}
        </div>
      </div>
      <button className="ghost act" style={{ marginTop: 10 }} onClick={startExam}>Retake exam</button>
    </div>
  )
}

/* ============ Interactive 3: answer-reveal grader ============ */
const SAMPLE_ANSWERS = [
  { id: 'A1', type: 'MCQ', question: 'What does encapsulation mean?', options: ['Hiding internal state behind a public interface', 'Inheriting from a parent class', 'Using an interface instead of a class', 'Calling a method polymorphically'], studentPick: 0, correct: 0, points: 2 },
  { id: 'A2', type: 'MCQ', question: 'Which pattern uses accept() for double dispatch?', options: ['Strategy', 'Observer', 'Visitor', 'Command'], studentPick: 0, correct: 2, points: 2 },
  { id: 'A3', type: 'MCQ', question: 'Which Java class makes a List unmodifiable?', options: ['ArrayList', 'Collections.unmodifiableList()', 'LinkedList', 'Stack'], studentPick: 1, correct: 1, points: 2 },
  { id: 'E1', type: 'ESSAY', question: 'Explain why you would use Composition over Inheritance.', essayText: 'Composition is more flexible because you can swap behaviours at runtime by injecting different implementations. Inheritance creates a tight compile-time coupling — changing the parent can break children (fragile base class). Composition also avoids the class explosion problem and respects the Single Responsibility Principle by keeping concerns separate.', points: 10 },
  { id: 'E2', type: 'ESSAY', question: 'What is the Law of Demeter and why does it matter?', essayText: 'dont talk to strangers. only talk to your friends', points: 10 },
]

function GraderPanel() {
  const [revealed, setRevealed] = useState({})
  const [essayScores, setEssayScores] = useState({})
  const [inputs, setInputs] = useState({})

  let total = 0
  let maxTotal = 0
  SAMPLE_ANSWERS.forEach((a) => {
    maxTotal += a.points
    if (a.type === 'MCQ' && revealed[a.id]) {
      if (a.studentPick === a.correct) total += a.points
    }
    if (a.type === 'ESSAY' && essayScores[a.id] !== undefined) {
      total += essayScores[a.id]
    }
  })

  return (
    <div className="panel">
      <div className="ptitle">Live demo · teacher grading panel — MCQ auto-graded, essays graded manually</div>
      {SAMPLE_ANSWERS.map((a) => (
        <div key={a.id} style={{ marginBottom: 12, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>{a.id} [{a.type}, {a.points} pts] {a.question}</div>
          {a.type === 'MCQ' && (
            <>
              <div style={{ fontSize: 13, marginBottom: 6 }}>Student picked: <b style={{ color: 'var(--blue)' }}>{a.options[a.studentPick]}</b></div>
              <button className="ghost act" style={{ fontSize: 12 }} onClick={() => setRevealed((r) => ({ ...r, [a.id]: true }))}>
                {revealed[a.id] ? '✓ answer shown' : 'Show correct answer'}
              </button>
              {revealed[a.id] && (
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  Correct answer: <b>{a.options[a.correct]}</b>{' '}
                  {a.studentPick === a.correct
                    ? <span style={{ color: '#1d7a3a' }}>✅ {a.points}/{a.points} pts</span>
                    : <span style={{ color: 'var(--red)' }}>❌ 0/{a.points} pts</span>}
                </div>
              )}
            </>
          )}
          {a.type === 'ESSAY' && (
            <>
              <div style={{ fontSize: 13, fontStyle: 'italic', color: '#555', marginBottom: 8, padding: 8, background: '#F9F8F5', borderRadius: 6 }}>{a.essayText}</div>
              {essayScores[a.id] !== undefined
                ? <div style={{ color: '#1d7a3a', fontSize: 13 }}>✅ Graded: <b>{essayScores[a.id]}/10</b></div>
                : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12.5, color: '#b57c00', fontFamily: 'IBM Plex Mono' }}>📝 awaiting manual grade</span>
                    <input type="number" min="0" max="10" placeholder="0–10"
                      className="txt"
                      value={inputs[a.id] || ''}
                      onChange={(e) => setInputs((inp) => ({ ...inp, [a.id]: e.target.value }))}
                      style={{ width: 60, padding: '4px 6px', fontFamily: 'IBM Plex Mono', fontSize: 13 }}
                    />
                    <button className="ghost act" style={{ fontSize: 12 }} onClick={() => {
                      const v = parseInt(inputs[a.id], 10)
                      if (!isNaN(v) && v >= 0 && v <= 10) setEssayScores((s) => ({ ...s, [a.id]: v }))
                    }}>Grade</button>
                  </div>
                )}
            </>
          )}
        </div>
      ))}
      <div style={{ padding: '10px 12px', background: '#F4F3EE', borderRadius: 8 }}>
        <div style={{ fontFamily: 'Space Grotesk', fontSize: 15 }}>
          Running total: <b>{total}</b> / <b>{maxTotal}</b>
          {Object.keys(essayScores).length < 2 && <span style={{ color: '#b57c00', fontSize: 12.5, marginLeft: 8 }}>(final score pending {2 - Object.keys(essayScores).length} essay grade{2 - Object.keys(essayScores).length !== 1 ? 's' : ''})</span>}
        </div>
      </div>
    </div>
  )
}

/* ============ Interactive 4: rubric scorecard ============ */
const RUBRIC_ITEMS = [
  { cat: 'State Machines', items: [
    'Named both state machines (Exam: DRAFT→PUBLISHED→LOCKED; Attempt: IN_PROGRESS→SUBMITTED/EXPIRED) in first 10 minutes',
    'Correctly distinguished Exam status from Attempt status — two separate enums',
    'Guarded all state transitions (submitted attempt cannot accept more answers; expired attempt auto-closes)',
  ]},
  { cat: 'Entity Model', items: [
    'Correctly typed Question with discriminated MCQ/ESSAY fields (options + correctOption only for MCQ)',
    'Drew entity diagram with correct cardinalities (Exam 1–*, Question 1–*, Attempt 1–*, Answer)',
    'Addressed question shuffling (randomised per attempt, not global)',
  ]},
  { cat: 'Core Logic', items: [
    'Server-side expiry check in submitAnswer() — not trusting client-side timer',
    'Auto-grade runs only on SUBMIT or EXPIRE — not on each individual answer save',
    'canRetake() checks count of COMPLETED attempts (not IN_PROGRESS or total)',
    'hasActiveAttempt() prevents a second concurrent IN_PROGRESS attempt',
    'Exam locked (LOCKED status) once first attempt starts — teacher cannot edit questions',
    'Answers are append-only: changing an answer updates selectedOption, never deletes the Answer record',
  ]},
  { cat: 'Grading & Visibility', items: [
    'Correct answers NOT returned in the exam-fetch API during PUBLISHED exam',
    'MCQ score visible immediately after submit; overall score pending until essays are graded',
    'Mentioned GradingStrategy seam (AutoGrader for MCQ / ManualGrader for essay)',
  ]},
  { cat: 'Communication', items: [
    'Mentioned at least 2 design patterns (State, Strategy, Observer, Command, Value Object)',
    'Drew at least one ASCII diagram (entity model or state machine)',
    'Produced a compilable skeleton with the happy-path running end-to-end',
  ]},
]
const RUBRIC_TOTAL = RUBRIC_ITEMS.reduce((n, g) => n + g.items.length, 0)

function RubricScorecard() {
  const [checked, setChecked] = useState({})
  const score = Object.values(checked).filter(Boolean).length
  const toggle = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }))

  let verdict, bg
  if (score >= 13) { verdict = '🟢 Hire signal — strong mock. Reflect on the 2 unchecked items, then move to Day 77.'; bg = '#EAF7EF' }
  else if (score >= 9) { verdict = '🟡 Strong maybe — restudy the flagged areas below, then re-attempt the entity model + auto-grade logic on paper.'; bg = '#FFF1D6' }
  else if (score >= 5) { verdict = '🔴 Needs work — do the homework (implement the system in Java), then re-run this rubric.'; bg = '#FDECEC' }
  else { verdict = '🔴 Not ready — re-read the reveals carefully, implement the skeleton, and revisit Day 34 (State) + Day 31 (Strategy) before retrying.'; bg = '#FDECEC' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · grade your design like an interviewer — tick only what you ACTUALLY produced</div>
      {RUBRIC_ITEMS.map((g) => (
        <div key={g.cat} style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 4 }}>
            {g.cat.toUpperCase()}
          </div>
          {g.items.map((item, i) => {
            const k = g.cat + i
            return (
              <button key={k} onClick={() => toggle(k)} style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                fontFamily: 'IBM Plex Sans', fontSize: 13.5, padding: '5px 8px', marginBottom: 3,
                border: '1px solid var(--line)', borderRadius: 6,
                background: checked[k] ? '#EAF7EF' : '#fff',
              }}>{checked[k] ? '☑' : '☐'} {item}</button>
            )
          })}
        </div>
      ))}
      <div className="statbar" style={{ display: 'block', background: score > 0 ? bg : undefined }}>
        <span style={{ fontSize: 13.5 }}>
          <b>Score: {score} / {RUBRIC_TOTAL}</b>{score > 0 && <> — {verdict}</>}
        </span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  {
    q: 'An Attempt\'s timer has expired but the student\'s browser has not refreshed yet. They click "Save answer." What must the server do?',
    o: [
      'Accept the answer but mark it as late',
      'Accept the answer — the browser timer had not fired yet',
      'Check server-side: if Instant.now() is after startedAt + timeLimit, reject the answer and expire the attempt',
      'Throw a NullPointerException because the attempt is not IN_PROGRESS',
    ],
    a: 2,
    e: 'Client-side timers can be manipulated or lag. The server must check startedAt + timeLimit < now on every answer submission. Only the server can be trusted to enforce the time limit.',
    w: { 0: 'Late answers violate the time-limit contract. There is no partial grace period in this design.', 1: 'Client-side timers are not trusted — a student can pause JavaScript or adjust their clock.', 3: 'The server should not crash — it should return a controlled error with AttemptExpiredException.' },
    r: { id: 's4', label: 'Section 4 — Attempt state machine' },
  },
  {
    q: 'When should auto-grading run for an Attempt?',
    o: [
      'At the start of the Attempt, based on predicted answers',
      'Every time the student saves an answer, so they get instant feedback',
      'Only when the teacher manually triggers grading',
      'Only when the Attempt transitions to SUBMITTED or EXPIRED — not on each save',
    ],
    a: 3,
    e: 'Auto-grading on every save leaks correct/wrong signals before the exam is over. Grading runs once, when the attempt is complete (submitted or expired). This also means the student cannot game the system by saving one option at a time to probe the correct answer.',
    w: { 0: 'Pre-grading is impossible without the student\'s answers.', 1: 'Grading per save leaks whether each answer is right or wrong — the student can probe correct answers one-by-one.', 2: 'MCQ auto-grading requires no human involvement — it would be wasteful to wait for the teacher.' },
    r: { id: 's5', label: 'Section 5 — Auto-grading' },
  },
  {
    q: 'A student has 2 completed attempts on an exam with maxAttempts = 3. They also have 1 IN_PROGRESS attempt that has not expired. What should canRetake() return?',
    o: [
      'false — they already have an active attempt; hasActiveAttempt() blocks them before canRetake() even matters',
      'true — they have only used 2 of 3 attempts',
      'true — IN_PROGRESS attempts do not count until completed',
      'throw an exception',
    ],
    a: 0,
    e: 'hasActiveAttempt() is a separate guard that fires before canRetake(). If there is an active attempt, a new one must not be created — regardless of what canRetake() returns. canRetake() counts only completed (non-IN_PROGRESS) attempts.',
    w: { 1: 'Starting a second attempt while one is still in progress would give the student extra time on a fresh attempt.', 2: 'An uncompleted attempt in flight is still occupying an attempt slot in spirit — it just has not been scored yet.', 3: 'The correct response is a controlled rejection, not a crash.' },
    r: { id: 's7', label: 'Section 7 — Retake eligibility' },
  },
  {
    q: 'A student changes their MCQ answer from option B to option C. What should happen to the Answer record?',
    o: [
      'Update the selectedOption field on the existing Answer record to option C — the record is not deleted',
      'Throw an exception — answers cannot be changed once submitted',
      'Create a second Answer record for the same question with option C',
      'Delete the B answer record and create a new C answer record',
    ],
    a: 0,
    e: 'Answers are append-only at the Attempt level but mutable within a single answer record during IN_PROGRESS. Deleting the B record loses audit history. Creating a second record for the same question causes ambiguity at grading time. The clean design: update selectedOption in place.',
    w: { 1: 'Changing answers before submission is a normal exam behaviour.', 2: 'Two Answer records for the same question cause a grading ambiguity — which one counts?', 3: 'Deleting the B record loses the fact that the student originally picked B — valuable audit data.' },
    r: { id: 's4', label: 'Section 4 — Attempt state machine' },
  },
  {
    q: 'The exam-fetch API returns Question objects to the student. What field must NOT be included in the response?',
    o: [
      'question.points',
      'question.options',
      'question.text',
      'question.correctOption',
    ],
    a: 3,
    e: 'Returning correctOption in the exam-fetch response lets a student read the correct answer from the network tab before submitting. correctOption must only appear in the grading-result response, and only after the Attempt is SUBMITTED.',
    w: { 0: 'Points can be shown — they help the student allocate time. They do not reveal correctness.', 1: 'The options must be shown for MCQ — the student must see what to pick.', 2: 'The question text must be shown — without it there is no exam.' },
    r: { id: 's10', label: 'Section 10 — Common traps' },
  },
  {
    q: 'A teacher edits a question after 5 students have already started their attempts. What should the system do?',
    o: [
      'Allow the edit only for future attempts, not existing ones',
      'Reject the edit — the Exam is LOCKED once the first attempt starts',
      'Update the question but flag those 5 attempts for manual review',
      'Update the question immediately — all in-progress attempts get the new wording',
    ],
    a: 1,
    e: 'Once the first attempt starts, the Exam transitions to LOCKED status. Editing a question mid-attempt would mean different students see different wordings — that is an unfair exam. The system must reject any edit on a LOCKED exam.',
    w: { 0: 'Future-only edits would mean the same exam ID serves two different question sets — violating exam integrity.', 2: 'Manual review does not fix the fairness problem — some students still saw the old wording.', 3: 'Students in-progress would see a different question than they started with — potentially invalidating their work.' },
    r: { id: 's4', label: 'Section 4 — Exam state machine' },
  },
  {
    q: 'Which design pattern best describes the grading flow: autoGrade() handles MCQ, ManualGrader flags essays, and a template method calls both in order?',
    o: [
      'Decorator',
      'Command',
      'Template Method with Strategy',
      'Observer',
    ],
    a: 2,
    e: 'The gradeAttempt() skeleton is a Template Method (Day 35): it defines the order — autoGrade() then flagEssays(). The two grading steps are Strategies (Day 31): AutoGrader and ManualGrader implement GradingStrategy. The combination is the most natural fit.',
    w: { 0: 'Decorator wraps an object to add behaviour — not applicable to a fixed-order algorithm.', 1: 'Command encapsulates a request as an object for undo/queue — the grading flow is not a command.', 3: 'Observer is for notifying dependents of state changes — not for structuring an algorithm skeleton.' },
    r: { id: 's9', label: 'Section 9 — Patterns map' },
  },
  {
    q: 'A student\'s overall score is "pending" even though their MCQ answers were auto-graded correctly. Why?',
    o: [
      'The server-side timer has not expired yet',
      'The Attempt has essay questions that have not been manually graded — overall score is not final until all essays are scored',
      'The teacher has not published the results',
      'The student has not submitted the attempt yet',
    ],
    a: 1,
    e: 'MCQ auto-grading produces a partialScore immediately. The finalScore (overall) is only computed once all essays have been graded by a teacher. The Attempt status reflects this: PENDING_MANUAL vs FULLY_GRADED. Showing a partial score as the final one would be misleading.',
    w: { 0: 'Timer expiry relates to submission — it does not block the display of MCQ results.', 2: 'Publishing results is not part of this design — the score is visible to the student, but only partial until essays are graded.', 3: 'This scenario states the attempt is already submitted (auto-grading ran).' },
    r: { id: 's5', label: 'Section 5 — Auto-grading' },
  },
]

/* ============ The page ============ */
export default function Day76() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 16 · Day 76</div>
        <h1>Mock Interview Round 1:<br />Online Exam System</h1>
        <p>This is your mock interview. Read the problem. Design your solution. Only then open the reveals.
          The goal is not to get it perfect — it is to practise the protocol under pressure.</p>
        <div className="chips">
          {['45-Min Mock', 'State Machines', 'Auto-Grading', 'Server-Side Expiry', 'Essay Workflow'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* s1: protocol */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Before you read the solution — the 45-minute protocol</h2>
        <p>A mock interview is not a tutorial. It is a dress rehearsal. Follow the four phases below exactly.
          The reveals in the sections after this are the "interviewer's answer" — <strong>do not open them until
          the matching phase tells you to.</strong></p>
        <Code html={`  THE 45-MINUTE ONLINE EXAM SYSTEM MOCK
  ─────────────────────────────────────────────────────────────────
   0– 5 min   CLARIFY — ask the table of questions below YOURSELF
               before you look at the answers. Write your assumptions.
               Say what is OUT of scope out loud.

   5–15 min   ENTITY MODEL — draw Exam, Question, Attempt, Answer
               on paper. Draw the two state machines (Exam + Attempt).
               Identify the closed sets that become enums.

  15–35 min   IMPLEMENT — write the core Java skeleton:
               · Exam, Question (MCQ/ESSAY discriminated)
               · Attempt with server-side isExpired()
               · submitAnswer() with the expiry guard
               · autoGrade() — MCQ auto, essay flagged
               · canRetake() and hasActiveAttempt()
               Compile every ~8 minutes.

  35–45 min   EDGE CASES + FOLLOW-UPS
               · Correct answers not in API response
               · Exam LOCKED once first attempt starts
               · Answers are append-only (update selectedOption, not delete)
               · Score visibility: MCQ immediate, overall pending essays
               Then run the Section 11 rubric. Write your top-2 gaps.`} />
        <div className="panel" style={{ borderLeft: '4px solid var(--amber)' }}>
          <div className="ptitle" style={{ color: 'var(--amber)' }}>Protocol reminder</div>
          <p style={{ margin: 0, fontSize: 14 }}>
            <strong>Do NOT scroll to the solution sections yet.</strong> Try to design this yourself first.
            The Reveal locks in Sections 3–5 and 7 are there to enforce the protocol.
            Only open a reveal when the matching phase tells you to.
          </p>
        </div>
        <ProtocolTimer />
        <Note><strong>Why this structure?</strong> Real interviewers score you on the <em>process</em>, not just the
          final code. A candidate who clarifies first, draws a model, implements incrementally, and catches their
          own edge cases at minute 38 looks far stronger than one who dives into code at minute 0 and has a
          half-working solution that misses the expiry trap.</Note>
      </section>

      {/* s2: clarifying questions */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The problem + clarifying questions</h2>
        <p><strong>Problem statement (what the interviewer says):</strong></p>
        <div style={{ padding: '12px 16px', background: '#F4F3EE', borderRadius: 8, fontStyle: 'italic', marginBottom: 16, fontSize: 14.5 }}>
          "Design an Online Exam System. Teachers create Exams with Questions — multiple-choice and essay.
          Students take an Exam Attempt — they have a time limit. On submit (or when time expires), MCQ answers
          are auto-graded; essay answers are flagged for manual grading. Results are stored per student per
          attempt. A student can retake if the teacher allows multiple attempts."
        </div>
        <p>Before looking at the answers, ask yourself: <em>what would I ask the interviewer right now?</em>
          Write 4–6 questions on paper. Then check the table.</p>
        <table className="matrix">
          <thead>
            <tr><th>Question to ask</th><th>Why it matters</th><th>Answer for this mock</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Multiple question types?</td>
              <td>MCQ auto-grades; essay needs a human — affects your Grading design</td>
              <td>Yes — MCQ and Essay</td>
            </tr>
            <tr>
              <td>Is the time limit enforced server-side or client-side?</td>
              <td>Client-side is cheatable (pause JavaScript, change system clock)</td>
              <td>Server-side: <C>Attempt.startedAt + exam.timeLimit() &lt; Instant.now()</C></td>
            </tr>
            <tr>
              <td>Can a student retake the exam?</td>
              <td>Changes the Attempt model — 1:1 vs 1:many. Also implies you need <C>canRetake()</C></td>
              <td>Teacher configures: <C>exam.maxAttempts</C></td>
            </tr>
            <tr>
              <td>Partial credit for MCQ?</td>
              <td>Complicates grading — binary vs weighted</td>
              <td>No — full credit or zero per MCQ question</td>
            </tr>
            <tr>
              <td>Are questions shuffled per student?</td>
              <td>Affects whether Question order is global or per-attempt</td>
              <td>Yes — randomised per attempt</td>
            </tr>
            <tr>
              <td>Can the teacher edit the exam after students start?</td>
              <td>Critical — mid-exam edits invalidate existing attempts</td>
              <td>No — Exam is LOCKED once the first attempt starts</td>
            </tr>
            <tr>
              <td>When is score visible to the student?</td>
              <td>MCQ can be immediate; overall must wait for essay grading</td>
              <td>MCQ: immediately after submit. Overall: after all essays are graded</td>
            </tr>
          </tbody>
        </table>
        <Good><strong>Design-shaping questions vs clock-burners.</strong> "What database should I use?" is a
          clock-burner — it doesn't change your class model. "Is time enforced server-side?" is design-shaping —
          it adds a guard to <C>submitAnswer()</C>. Ask the ones that change your code.</Good>
      </section>

      {/* s3: entity model */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Entity model — draw yours first, then reveal</h2>
        <p>On paper, draw the five entities and their relationships. Label cardinalities (1, *, 0..1).
          Mark which fields belong to MCQ only and which to Essay only. <strong>Only open the reveal once you
          have something on paper.</strong></p>
        <Warn><strong>Common mistake:</strong> merging Question and Answer into one class. They are different
          things — Question is authored by the teacher (stable); Answer is provided by the student (per attempt).
          Keep them separate.</Warn>
        <Reveal summary="🔒 Reference entity model — open after your own attempt">
          <Code html={`  ENTITY MODEL
  ─────────────────────────────────────────────────────────────────────
  ┌──────────┐   ┌──────────────────────┐   ┌────────────────────────┐
  │  Teacher │   │         Exam         │   │        Question        │
  │──────────│ 1 │──────────────────────│ 1 │────────────────────────│
  │ id       │───│ id                   │───│ id                     │
  │ name     │   │ title                │ * │ type: MCQ | ESSAY      │
  └──────────┘   │ timeLimit: Duration  │   │ text                   │
                 │ maxAttempts: int     │   │ options: List&lt;String&gt;  │
                 │ status: ExamStatus   │   │ correctOption: int      │
                 └──────────────────────┘   │ points: int             │
                                            └────────────────────────┘
  ┌──────────┐   ┌──────────────────────┐   ┌────────────────────────┐
  │  Student │   │        Attempt       │   │         Answer         │
  │──────────│ 1 │──────────────────────│ 1 │────────────────────────│
  │ id       │───│ examId               │───│ questionId             │
  │ name     │   │ studentId            │ * │ selectedOption: int?   │
  └──────────┘   │ startedAt: Instant   │   │ essayText: String?     │
                 │ submittedAt: Instant?│   │ score: int?            │
                 │ status: AttemptStatus│   │ gradedBy: String?      │
                 └──────────────────────┘   └────────────────────────┘

  CLOSED SETS (become enums)
  ──────────────────────────
  enum QuestionType  { MCQ, ESSAY }
  enum ExamStatus    { DRAFT, PUBLISHED, LOCKED, ARCHIVED }
  enum AttemptStatus { IN_PROGRESS, SUBMITTED, EXPIRED,
                       PENDING_MANUAL, FULLY_GRADED }

  KEY INSIGHT: MCQ fields (options, correctOption) are null for ESSAY questions.
  Two approaches:
    Option A — one class, nullable fields (simple; validate in constructor)
    Option B — sealed Question with McqQuestion / EssayQuestion subclasses
  Both are acceptable; pick one and defend it.`} />
          <Note><strong>Why Teacher and Student are separate classes (not both "User"):</strong> They have
            completely different behaviours — teachers create exams; students take them. A single User class with
            a role flag would pass all behavioural methods to every user, violating ISP (Day 14). Separate
            classes keep the model honest.</Note>
        </Reveal>
      </section>

      {/* s4: state machines */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>State machines — the load-bearing design</h2>
        <p>This system has <strong>two state machines</strong>: one for the Exam and one for the Attempt.
          Draw both on paper before opening the reveal. State machines are the first thing an interviewer
          looks for on a whiteboard.</p>
        <Reveal summary="🔒 Reference state machines + Java code — open after drawing yours">
          <Code html={`  EXAM STATE MACHINE
  ──────────────────────────────────────────────────────────────
  DRAFT ──[teacher publishes]──▶ PUBLISHED ──[first attempt starts]──▶ LOCKED
                                                                          │
                                                          [teacher archives]▼
                                                                      ARCHIVED

  · DRAFT: teacher is building the exam. No students can see it.
  · PUBLISHED: students can start attempts.
  · LOCKED: at least one attempt is IN_PROGRESS. Teacher CANNOT edit questions.
  · ARCHIVED: exam is closed. No new attempts allowed.

  ATTEMPT STATE MACHINE
  ──────────────────────────────────────────────────────────────
                    ┌─────────────────────────┐
                    │      IN_PROGRESS         │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
    [student submits]                    [time expires on server check]
              │                                     │
              ▼                                     ▼
         SUBMITTED                             EXPIRED
              │                                     │
              └──────────────┬──────────────────────┘
                             │
              ┌──────────────┴──────────────────┐
              │                                 │
   [has essay questions?]             [MCQ only]
              ▼                                 ▼
       PENDING_MANUAL                    FULLY_GRADED
              │
   [teacher grades all essays]
              ▼
        FULLY_GRADED`} />
          <Code html={`<span class="cm">// The expiry check — runs server-side on EVERY answer submission</span>
<span class="kw">class</span> Attempt {
    <span class="kw">private</span> Instant startedAt;
    <span class="kw">private</span> Exam exam;
    <span class="kw">private</span> AttemptStatus status;
    <span class="kw">private</span> Map&lt;String, Answer&gt; answers; <span class="cm">// questionId → Answer</span>

    <span class="kw">boolean</span> isExpired() {
        <span class="cm">// server clock — cannot be faked by client</span>
        <span class="kw">return</span> startedAt.plus(exam.timeLimit()).isBefore(Instant.now());
    }

    <span class="kw">void</span> submitAnswer(Answer answer) {
        <span class="cm">// guard 1: attempt must be active</span>
        <span class="kw">if</span> (status != AttemptStatus.IN_PROGRESS)
            <span class="kw">throw new</span> IllegalStateException(<span class="str">"Attempt is not in progress"</span>);
        <span class="cm">// guard 2: server-side expiry check (client timer cannot be trusted)</span>
        <span class="kw">if</span> (isExpired()) {
            status = AttemptStatus.EXPIRED;
            <span class="kw">throw new</span> AttemptExpiredException(<span class="str">"Time limit exceeded"</span>);
        }
        <span class="cm">// update in place — never delete an Answer record</span>
        answers.put(answer.questionId(), answer);
    }

    <span class="kw">void</span> submit() {
        <span class="cm">// called by student (SUBMITTED) or by the sweeper (EXPIRED)</span>
        <span class="kw">if</span> (status != AttemptStatus.IN_PROGRESS)
            <span class="kw">throw new</span> IllegalStateException(<span class="str">"Cannot submit: not IN_PROGRESS"</span>);
        status = isExpired() ? AttemptStatus.EXPIRED : AttemptStatus.SUBMITTED;
    }
}`} />
          <Warn><strong>The expiry trap is the most commonly planted bug.</strong> Many candidates put the timer
            check only in a scheduled job. The sweeper is good for cleanup, but every answer-save call must also
            check expiry — otherwise a student with a paused JavaScript timer can keep submitting answers after
            time has run out.</Warn>
        </Reveal>
      </section>

      {/* s5: auto-grading */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Auto-grading logic — when and how</h2>
        <p>Auto-grading runs exactly once: when the Attempt becomes SUBMITTED or EXPIRED.
          Not on every answer save. Write the <C>autoGrade()</C> method before opening the reveal.</p>
        <Reveal summary="🔒 Reference autoGrade() implementation — open after your own attempt">
          <Code html={`<span class="kw">class</span> ExamService {

    GradingResult autoGrade(Attempt attempt) {
        <span class="kw">int</span> mcqScore = <span class="num">0</span>;
        <span class="kw">boolean</span> hasUngradedEssays = <span class="kw">false</span>;

        <span class="kw">for</span> (Answer ans : attempt.answers().values()) {
            Question q = exam.questions().get(ans.questionId());

            <span class="kw">if</span> (q.type() == QuestionType.MCQ) {
                <span class="cm">// full credit or zero — no partial credit per spec</span>
                <span class="kw">if</span> (ans.selectedOption() != <span class="kw">null</span>
                        &amp;&amp; ans.selectedOption() == q.correctOption()) {
                    ans.setScore(q.points());
                    mcqScore += q.points();
                } <span class="kw">else</span> {
                    ans.setScore(<span class="num">0</span>); <span class="cm">// unanswered = zero</span>
                }
            } <span class="kw">else</span> { <span class="cm">// ESSAY — humans must grade this</span>
                hasUngradedEssays = <span class="kw">true</span>;
                <span class="cm">// score stays null until teacher grades</span>
            }
        }

        attempt.setAutoGradedScore(mcqScore);
        <span class="cm">// transition to waiting or done</span>
        AttemptStatus next = hasUngradedEssays
            ? AttemptStatus.PENDING_MANUAL
            : AttemptStatus.FULLY_GRADED;
        attempt.setStatus(next);

        <span class="kw">return new</span> GradingResult(mcqScore, hasUngradedEssays);
    }

    <span class="cm">// Template Method skeleton: auto → flag essays (Day 35)</span>
    <span class="kw">void</span> gradeAttempt(Attempt attempt) {
        GradingResult result = autoGrade(attempt);   <span class="cm">// step 1</span>
        <span class="kw">if</span> (result.hasUngradedEssays()) {
            notifyTeacher(attempt);                   <span class="cm">// step 2: Observer</span>
        }
    }
}`} />
          <Note><strong>Why not return <C>correctOption</C> in the exam API?</strong> If the
            exam-fetch endpoint returns <C>Question.correctOption</C>, a student can open DevTools,
            look at the network response, and read all correct answers before submitting. The API must
            return <C>correctOption = null</C> (or omit the field entirely) for PUBLISHED exams.
            Only include it in the grading-result response, after submission.</Note>
        </Reveal>
      </section>

      {/* s6: live exam simulator */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>Play: live exam simulator</h2>
        <p>This demo runs a 2-minute accelerated exam (3 MCQ + 1 essay). Watch what happens when time
          runs out: the attempt auto-submits via the server-side expiry path. After submission, grade the
          essay manually to see the "pending manual" flow resolve.</p>
        <ExamSimulator />
        <Good><strong>What to notice:</strong> ① The timer bar is server-side — there is no way to cheat it.
          ② MCQ results appear immediately on submit; the essay shows "Pending manual grade."
          ③ When you click "Grade" and enter a score, the total finalises. This is the PENDING_MANUAL →
          FULLY_GRADED transition.</Good>
      </section>

      {/* s7: retake eligibility */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Retake eligibility — two separate guards</h2>
        <p>There are two different checks, and candidates often miss the second. Write them out before revealing.</p>
        <Reveal summary="🔒 canRetake() and hasActiveAttempt() — open after your own attempt">
          <Code html={`<span class="kw">class</span> ExamService {

    <span class="cm">// Guard 1: count completed attempts (not IN_PROGRESS)</span>
    <span class="kw">boolean</span> canRetake(String studentId, String examId) {
        List&lt;Attempt&gt; past =
            attemptRepo.findByStudentAndExam(studentId, examId);
        <span class="kw">long</span> completed = past.stream()
            .filter(a -&gt; a.status() != AttemptStatus.IN_PROGRESS)
            .count();
        <span class="kw">return</span> completed &lt; exam.maxAttempts();
    }

    <span class="cm">// Guard 2: prevent a SECOND concurrent attempt</span>
    <span class="cm">// (even if canRetake() says true, starting a new attempt</span>
    <span class="cm">//  while one is live gives the student extra uncounted time)</span>
    <span class="kw">boolean</span> hasActiveAttempt(String studentId, String examId) {
        <span class="kw">return</span> attemptRepo.findByStudentAndExam(studentId, examId)
            .stream()
            .anyMatch(a -&gt; a.status() == AttemptStatus.IN_PROGRESS
                       &amp;&amp; !a.isExpired());
    }

    <span class="cm">// Both guards run before creating a new Attempt</span>
    Attempt startAttempt(String studentId, String examId) {
        Exam exam = examRepo.findById(examId);
        <span class="kw">if</span> (exam.status() != ExamStatus.PUBLISHED
                &amp;&amp; exam.status() != ExamStatus.LOCKED)
            <span class="kw">throw new</span> IllegalStateException(<span class="str">"Exam not open"</span>);
        <span class="kw">if</span> (hasActiveAttempt(studentId, examId))
            <span class="kw">throw new</span> IllegalStateException(<span class="str">"Already has an active attempt"</span>);
        <span class="kw">if</span> (!canRetake(studentId, examId))
            <span class="kw">throw new</span> IllegalStateException(<span class="str">"Max attempts reached"</span>);

        <span class="cm">// Lock exam on first attempt (PUBLISHED → LOCKED)</span>
        <span class="kw">if</span> (exam.status() == ExamStatus.PUBLISHED) {
            exam.setStatus(ExamStatus.LOCKED); <span class="cm">// teacher can no longer edit</span>
            examRepo.save(exam);
        }
        <span class="kw">return</span> attemptRepo.save(<span class="kw">new</span> Attempt(examId, studentId, Instant.now()));
    }
}`} />
          <Note><strong>Why two separate guards?</strong> <C>canRetake()</C> answers "do you have attempts left?"
            <C>hasActiveAttempt()</C> answers "are you currently in the middle of one?" They are different
            questions. A student with 2 of 3 used attempts who is currently mid-attempt needs to be blocked
            from starting attempt 3 — but <C>canRetake()</C> would return <C>true</C> because only 2 are
            completed. <C>hasActiveAttempt()</C> catches this case.</Note>
        </Reveal>
      </section>

      {/* s8: interactive grader */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>Play: teacher grading panel</h2>
        <p>Five sample student answers — 3 MCQ and 2 essays. Click "Show correct answer" on MCQ to
          see auto-grading. Enter a score (0–10) and click Grade on essays. Watch the running total
          stay pending until both essays are graded.</p>
        <GraderPanel />
        <Good><strong>What to notice:</strong> ① MCQ grading is deterministic and instant — no human needed.
          ② The overall score stays "pending" until the last essay is graded. This is the
          PENDING_MANUAL state in action. ③ Essay 2 is clearly weaker than Essay 1 — that is why
          manual grading exists.</Good>
      </section>

      {/* s9: patterns map */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>Patterns map — name these in the interview</h2>
        <p>Every pattern you name out loud adds signal that you understand <em>why</em> your design is
          structured the way it is. Here are the six that appear naturally in this system:</p>
        <table className="matrix">
          <thead>
            <tr><th>Pattern</th><th>Where it appears</th><th>Day reference</th></tr>
          </thead>
          <tbody>
            <tr><td>State (Day 34)</td><td>Exam status (DRAFT→PUBLISHED→LOCKED→ARCHIVED) and Attempt status (IN_PROGRESS→SUBMITTED/EXPIRED→PENDING_MANUAL/FULLY_GRADED)</td><td>Day 34</td></tr>
            <tr><td>Strategy (Day 31)</td><td>GradingStrategy — AutoGrader handles MCQ; ManualGrader flags essays. The template method calls the right strategy per question type.</td><td>Day 31</td></tr>
            <tr><td>Template Method (Day 35)</td><td><C>gradeAttempt()</C> defines the order: <C>autoGrade()</C> then <C>notifyTeacher()</C> if essays are pending. Subclasses can override individual steps.</td><td>Day 35</td></tr>
            <tr><td>Observer (Day 32)</td><td>Notify the student when their grade is released. Notify the teacher when a new submission needs essay grading.</td><td>Day 32</td></tr>
            <tr><td>Command (Day 33)</td><td>Answer submission as an append-only log. Each <C>submitAnswer()</C> appends a record. Changing an answer updates the record — never deletes. Supports audit trails.</td><td>Day 33</td></tr>
            <tr><td>Value Object (Day 20)</td><td>Score (immutable int wrapper with validation), Duration (timeLimit), QuestionType, AttemptStatus — all represent values, not entities. Two Score(10) objects are equal.</td><td>Day 20</td></tr>
          </tbody>
        </table>
        <Note><strong>You don't need to name patterns unprompted.</strong> But when the interviewer asks
          "how would you structure the grading?" and you say "I'd use a GradingStrategy interface so
          AutoGrader and ManualGrader are swappable" — that is the vocabulary that separates senior from
          junior candidates.</Note>
      </section>

      {/* s10: traps */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Common traps in this specific problem</h2>
        <Warn><strong>Trap 1 — Trusting the client-side timer.</strong> A student can open DevTools and
          pause JavaScript. The server must check <C>startedAt + timeLimit &lt; Instant.now()</C> on every
          answer-save call. The scheduled sweeper (that expires abandoned attempts) is a cleanup tool —
          not the primary enforcement mechanism.</Warn>
        <Warn><strong>Trap 2 — Missing the concurrent attempt guard.</strong> If you only check
          <C>canRetake()</C> but not <C>hasActiveAttempt()</C>, a student can open two browser tabs and
          start two attempts simultaneously. The second tab gives them double the thinking time with no
          completed-attempt penalty.</Warn>
        <Warn><strong>Trap 3 — Deleting the Answer record on answer change.</strong> When a student
          changes option B to option C, update <C>selectedOption</C> in place. Deleting the B record
          loses audit history. Creating a second Answer record for the same question causes grading
          ambiguity — which one counts?</Warn>
        <Warn><strong>Trap 4 — Returning correct answers in the exam-fetch API.</strong> If the
          exam-fetch endpoint includes <C>Question.correctOption</C>, every student can read the answer
          key from the browser's network tab in under 10 seconds. The field must be <C>null</C> (or
          omitted) in responses for PUBLISHED or LOCKED exams.</Warn>
        <Warn><strong>Trap 5 — Grading on every answer save.</strong> If <C>autoGrade()</C> runs when
          each MCQ answer is saved, the student gets a right/wrong signal for each answer before
          submitting — effectively telling them which options are correct while the exam is in progress.
          Auto-grading must only run on SUBMIT or EXPIRE.</Warn>
        <Warn><strong>Trap 6 — Allowing teacher edits on a LOCKED exam.</strong> If the Exam status is
          not enforced, a teacher can change a question after students have started. Student A saw the
          old wording; student B sees the new one. The LOCKED transition must be atomic with the first
          attempt creation, and the edit endpoint must reject any edit on a LOCKED or ARCHIVED exam.</Warn>
      </section>

      {/* s11: rubric */}
      <section id="s11">
        <div className="sec-label">Section 11 · Interactive</div>
        <h2>Your rubric — score the attempt</h2>
        <p>Immediately after pens-down — while the memory is fresh — check off only what you ACTUALLY
          produced during the 45 minutes. Not what you knew you should have done:</p>
        <RubricScorecard />
        <Code html={`  THE REVIEW LOOP — the rep is not over at pens-down

  mock (45 min) ──▶ rubric score ──▶ write your TOP-2 gaps
                                           │
      ▲                                    ▼
      └── homework (implement it) ◀── restudy the gap days
           then re-run this mock            (type the code; don't just reread)

  Verdict bands:  13–15 ✅  hire signal
                   9–12 🟡  strong maybe — one targeted rep fixes the gaps
                   5– 8 🔴  needs work — implement the homework, then re-run
                    &lt; 5 🔴  not ready — revisit Day 34 + Day 31 first`} />
        <Warn><strong>The rubric only works if it hurts a little.</strong> "I would have checked expiry" is
          unchecked. "I knew I needed hasActiveAttempt but ran out of time" is unchecked. The standard is:
          an interviewer watching your screen would have seen it or heard you say it.</Warn>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>Interview corner: 6 follow-up questions they actually ask</h2>
        <p>Answer each in your head before revealing. These are the follow-up depth questions that come at
          minute 40 when the skeleton is working.</p>
        <Reveal summary='Q: "Can a student see which MCQs they got wrong before essays are graded?"'>
          <p>Yes for MCQ — <C>autoGrade()</C> runs immediately on submit and sets <C>answer.score</C> for
            each MCQ. The student can see their MCQ-by-MCQ results right away. The <strong>overall exam score</strong>
            is not final until all essays have been graded — so the Attempt has two score fields:
            <C>partialScore</C> (MCQ total, available immediately) and <C>finalScore</C> (set after last
            essay is graded, may be null until then). The UI shows <C>partialScore</C> with a "pending essay
            grade" banner until <C>finalScore</C> is set.</p>
        </Reveal>
        <Reveal summary='Q: "How do you prevent exam answers from leaking via the API?"'>
          <p>Two rules, both enforced on the server: <br />
            (1) The exam-fetch endpoint never returns <C>Question.correctOption</C> while the exam is
            PUBLISHED or LOCKED. The field is excluded from the serialised response (use a DTO without it,
            or a Jackson <C>@JsonIgnore</C> that is context-dependent). <br />
            (2) The grading-result endpoint only returns <C>correctOption</C> in the Attempt's grading result,
            and only after the Attempt's status is SUBMITTED or EXPIRED. A student cannot fetch another
            student's grading result — authentication + authorisation guard this. An integration test
            that asserts <C>correctOption == null</C> in the exam-fetch response is the best safeguard.</p>
        </Reveal>
        <Reveal summary='Q: "How would you add question banks — reuse questions across exams?"'>
          <p>Add a <C>QuestionBank</C> entity owned by the Teacher. An Exam now references
            <C>List&lt;String&gt; questionIds</C> from the bank instead of embedding Question objects.
            <strong>Critical:</strong> at the moment the first Attempt starts (LOCKED transition), snapshot
            the current question text, options, and correctOption into the Attempt — exactly like the
            price-snapshot from Day 67 (Food Delivery OrderItem). If the bank question is later edited,
            existing Attempts remain consistent because they hold the snapshot, not a live reference. This
            is the same reasoning as snapshotting MenuItem prices.</p>
        </Reveal>
        <Reveal summary='Q: "What if the network drops mid-exam?"'>
          <p>The client auto-saves answers to the server every N seconds (PATCH /attempts/{'{id}'}/answers).
            On reconnect, the client fetches the server's saved state: <C>GET /attempts/{'{id}'}</C> returns
            all current answers and the remaining time (<C>exam.timeLimit() - (now - startedAt)</C>). The
            client restores from this. <strong>Key:</strong> the client-side timer must re-sync with the
            server on reconnect — it should display <C>max(0, exam.timeLimit() - (now - startedAt))</C>
            computed from the server's <C>startedAt</C>, not the client's elapsed time. This prevents a
            student from refreshing the page to "reset" their local timer.</p>
        </Reveal>
        <Reveal summary='Q: "How do you grade an essay fairly across different teachers?"'>
          <p>Add a <C>Rubric</C> entity: the teacher defines scoring criteria before publishing the exam
            (e.g. "mentions polymorphism: 3 pts; gives example: 4 pts; explains why: 3 pts"). Manual graders
            score against the rubric — the UI shows the criteria side-by-side with the essay. For fairness:
            blind grading (the grader does not see the student's name — only an anonymised Attempt ID). For
            disputed scores: a second-reader option where a second teacher grades independently, and the
            average (or a moderation workflow) resolves disagreements. These are Rubric (entity), Score
            (Value Object), and a simple Workflow state machine (PENDING → GRADED → DISPUTED → MODERATED).</p>
        </Reveal>
        <Reveal summary='Q: "How would you add proctoring to prevent cheating?"'>
          <p>Add a <C>ProctoringEvent</C> append-only log per Attempt. Three signal sources:<br />
            (1) <strong>Tab-switch detection</strong> — JavaScript <C>visibilitychange</C> events. Each
            switch is logged as a <C>ProctoringEvent(type=TAB_SWITCH, timestamp)</C> on the server. <br />
            (2) <strong>Webcam snapshots</strong> — captured at random intervals via <C>getUserMedia()</C>
            and uploaded to server storage. <br />
            (3) <strong>Paste detection</strong> — unusually fast text appearing in an essay field.<br />
            All events are stored as an audit log (append-only — never delete proctoring evidence). A
            proctoring-review workflow flags Attempts with &gt;N tab-switches for human review. The
            proctoring data is separate from grading — an Attempt with suspicious events is still graded
            normally; the proctoring review happens in parallel.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="sQuiz">
        <div className="sec-label">Section 12 · Test yourself</div>
        <h2>Quiz — 8 questions</h2>
        <p>Click an answer. Explanations appear for every choice — read them even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* footer */}
      <div className="footer">
        <strong>Day 76 complete?</strong> Homework: implement the Online Exam System in Java from scratch.
        Create these files: <C>Exam.java</C>, <C>Question.java</C> (with MCQ/ESSAY types), <C>Attempt.java</C>
        (with server-side <C>isExpired()</C> and <C>submitAnswer()</C>), <C>ExamService.java</C> (with
        <C>autoGrade()</C>, <C>canRetake()</C>, <C>hasActiveAttempt()</C>, <C>startAttempt()</C>).
        Drive the happy path from a <C>main()</C> method: teacher creates exam, student starts attempt,
        submits 3 MCQ answers and 1 essay, auto-grade runs, essay flagged for manual grading.
        <br /><br />
        Next: <strong>Day 77 — Mock Interview Round 2: Digital Library</strong>: a new 45-minute mock
        covering a different domain — books, members, loans, reservations, and the concurrency trap that
        catches candidates who rely on application-level locks instead of atomic claims.
      </div>
    </div>
  )
}
