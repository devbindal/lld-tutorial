import { COURSE } from '../data/roadmap.js'

export default function Home() {
  return (
    <div className="scrollarea">
      <div className="home-hero">
        <div className="eyebrow">Java · Low-Level Design · Month 1</div>
        <h1>Week 1 — Core OOP</h1>
        <p>The foundation everything else is built on. Work through one concept per day.
           Click any unlocked card to open its interactive tutorial. New days unlock as you build them.</p>
      </div>

      {COURSE.weeks.map((week) => (
        <div key={week.id}>
          <div className="weeklabel" style={{ marginTop: 26 }}>{week.label}</div>
          <div className="daygrid">
            {week.days.map((day) => (
              <a key={day.id}
                 className={'daycard' + (day.ready ? '' : ' locked')}
                 href={day.ready ? `#/day/${day.id}` : '#/'}>
                <div className="dc-num">DAY {day.id}</div>
                <div className="dc-title">{day.title}</div>
                <div className="dc-sub">{day.sub}</div>
                <span className={'dc-tag ' + (day.ready ? 'ready' : 'soon')}>
                  {day.ready ? '● Ready' : 'Coming soon'}
                </span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
