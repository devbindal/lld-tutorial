import { useState } from 'react'

// Syntax-highlighted code. Pass an HTML string built with <span class="kw|str|cm|num">.
// Content is static and authored by us, so dangerouslySetInnerHTML is safe here.
export function Code({ html }) {
  return <pre dangerouslySetInnerHTML={{ __html: html }} />
}

// Inline code chip
export function C({ children }) {
  return <code className="inline">{children}</code>
}

// Collapsible "click to reveal" block (native <details>)
export function Reveal({ summary, children }) {
  return (
    <details>
      <summary>{summary}</summary>
      <div style={{ marginTop: 10 }}>{children}</div>
    </details>
  )
}

export function Note({ children }) { return <div className="note">{children}</div> }
export function Warn({ children }) { return <div className="warn">{children}</div> }
export function Good({ children }) { return <div className="good">{children}</div> }

// Reusable quiz.
// questions = [{
//   q: 'question', o: ['options'], a: correctIndex, e: 'explanation',
//   w: { [wrongIndex]: 'why this option tempts people / the misconception' },  // optional
//   r: { id: 's5', label: 'Section 5 · Constructors' },                        // optional revisit pointer
// }]
export function Quiz({ questions }) {
  const [state, setState] = useState({}) // { [qi]: pickedIndex }
  const answeredCount = Object.keys(state).length
  const correctCount = Object.entries(state).filter(
    ([qi, pick]) => pick === questions[qi].a
  ).length

  function pick(qi, oi) {
    if (state[qi] !== undefined) return // lock after first answer
    setState((s) => ({ ...s, [qi]: oi }))
  }

  const done = answeredCount === questions.length
  let scoreMsg = ''
  if (answeredCount > 0) {
    scoreMsg = `Score: ${correctCount} / ${answeredCount}`
    if (done) {
      scoreMsg += correctCount === questions.length
        ? '  🏆 Perfect! You own this day.'
        : '  — re-read the sections you missed, then click Reset to retake.'
    }
  }

  return (
    <div>
      {questions.map((item, qi) => {
        const picked = state[qi]
        const isAnswered = picked !== undefined
        return (
          <div className="q" key={qi}>
            <div className="qt">Q{qi + 1}. {item.q}</div>
            <div className="opts">
              {item.o.map((opt, oi) => {
                let cls = ''
                if (isAnswered) {
                  if (oi === item.a) cls = 'correct'
                  else if (oi === picked) cls = 'wrong'
                }
                return (
                  <button key={oi} className={cls} onClick={() => pick(qi, oi)}>
                    {opt}
                  </button>
                )
              })}
            </div>
            {isAnswered && (
              <div className="exp">
                {picked === item.a ? (
                  <div>✅ <b>Correct!</b></div>
                ) : (
                  <div>
                    <div>❌ <b>Not quite.</b> You picked: “{item.o[picked]}”</div>
                    {item.w && item.w[picked] && (
                      <div style={{ marginTop: 6 }}>
                        🧠 <b>Why that one tempts people:</b> {item.w[picked]}
                      </div>
                    )}
                    <div style={{ marginTop: 6 }}>✅ <b>Correct answer:</b> “{item.o[item.a]}”</div>
                  </div>
                )}
                <div style={{ marginTop: 6 }}>💡 {item.e}</div>
                {picked !== item.a && item.r && (
                  <div style={{ marginTop: 8 }}>
                    📖 <b>Shaky on this?</b>{' '}
                    <button className="ghost act" style={{ fontSize: 12.5, padding: '4px 10px' }}
                      onClick={() => document.getElementById(item.r.id)?.scrollIntoView({ behavior: 'smooth' })}>
                      Revisit {item.r.label} ↑
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
      {scoreMsg && (
        <div className="score">
          {scoreMsg}{' '}
          {done && (
            <button className="ghost act" style={{ marginLeft: 10, fontSize: 13, padding: '6px 12px' }}
              onClick={() => setState({})}>Reset</button>
          )}
        </div>
      )}
    </div>
  )
}
