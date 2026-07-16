import { COURSE, ALL_DAYS } from '../data/roadmap.js'
import { useProgress, isDone, getLastVisited, getQuizScore } from '../data/progress.js'

export default function Home() {
  useProgress()

  const readyDays = ALL_DAYS.filter((d) => d.ready)
  const doneTotal = readyDays.filter((d) => isDone(d.id)).length
  const last = getLastVisited()
  const lastInfo = last ? readyDays.find((d) => d.id === last) : null

  return (
    <div className="scrollarea">
      <div className="home-hero">
        <div className="eyebrow">Java · Low-Level Design · 4-Month Course</div>
        <h1>From OOP Basics to LLD Mastery</h1>
        <p>The foundation everything else is built on. Work through one concept per day, week by week.
           Click any unlocked card to open its interactive tutorial. New days unlock as you build them.</p>
        <a className="homelink" href="#/revise" style={{ fontSize: 15, display: 'inline-block', marginTop: 6 }}>
          ★ Revision Hub — one-page recaps of every week →
        </a>
      </div>

      {lastInfo && (
        <a className="continue-banner" href={`#/day/${lastInfo.id}`}>
          <div>
            <div className="cb-label">Continue where you left off</div>
            <div className="cb-title">Day {lastInfo.id} — {lastInfo.title}</div>
          </div>
          <span className="cb-arrow">→</span>
        </a>
      )}
      {doneTotal > 0 && (
        <div className="progressline">
          <div className="progressbar">
            <div className="progressfill" style={{ width: `${Math.round((doneTotal / readyDays.length) * 100)}%` }} />
          </div>
          <span>{doneTotal} / {readyDays.length} days done</span>
        </div>
      )}

      {COURSE.months.map((month) => (
        <div key={month.id}>
          <div className="monthlabel">{month.label}</div>
          {month.weeks.map((week) => (
            <div key={week.id}>
              <div className="weeklabel" style={{ marginTop: 18 }}>{week.label}</div>
              <div className="daygrid">
                {week.days.map((day) => {
                  const done = day.ready && isDone(day.id)
                  const quiz = day.ready ? getQuizScore(`day-${day.id}`) : null
                  return (
                    <a key={day.id}
                       className={'daycard' + (day.ready ? '' : ' locked')}
                       href={day.ready ? `#/day/${day.id}` : '#/'}>
                      <div className="dc-num">DAY {day.id}</div>
                      <div className="dc-title">{day.title}</div>
                      <div className="dc-sub">{day.sub}</div>
                      <span className={'dc-tag ' + (day.ready ? (done ? 'done' : 'ready') : 'soon')}>
                        {day.ready ? (done ? '✓ Done' : '● Ready') : 'Coming soon'}
                      </span>
                      {quiz && (
                        <span className="dc-tag quiz">🧠 {quiz.score}/{quiz.total}</span>
                      )}
                    </a>
                  )
                })}
                {week.recap && (() => {
                  const recapQuiz = week.recap.ready ? getQuizScore(`recap-${week.recap.slug}`) : null
                  return (
                    <a className={'daycard' + (week.recap.ready ? '' : ' locked')}
                       href={week.recap.ready ? `#/recap/${week.recap.slug}` : '#/'}
                       style={{ borderStyle: 'dashed' }}>
                      <div className="dc-num">★ RECAP</div>
                      <div className="dc-title">{week.label.replace(/·.*$/, '').trim()} · Revision</div>
                      <div className="dc-sub">{week.recap.sub}</div>
                      <span className={'dc-tag ' + (week.recap.ready ? 'ready' : 'soon')}>
                        {week.recap.ready ? '★ Revise' : 'Coming soon'}
                      </span>
                      {recapQuiz && (
                        <span className="dc-tag quiz">🧠 {recapQuiz.score}/{recapQuiz.total}</span>
                      )}
                    </a>
                  )
                })()}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
