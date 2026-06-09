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

// Reusable quiz. questions = [{ q, o:[...], a:index, e:"explanation" }]
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
            {isAnswered && <div className="exp">💡 {item.e}</div>}
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
