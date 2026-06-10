import { COURSE } from '../data/roadmap.js'

export default function Home() {
  return (
    <div className="scrollarea">
      <div className="home-hero">
        <div className="eyebrow">Java · Low-Level Design · 4-Month Course</div>
        <h1>From OOP Basics to LLD Mastery</h1>
        <p>The foundation everything else is built on. Work through one concept per day, week by week.
           Click any unlocked card to open its interactive tutorial. New days unlock as you build them.</p>
      </div>

      {COURSE.months.map((month) => (
        <div key={month.id}>
          <div className="monthlabel">{month.label}</div>
          {month.weeks.map((week) => (
            <div key={week.id}>
              <div className="weeklabel" style={{ marginTop: 18 }}>{week.label}</div>
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
      ))}
    </div>
  )
}
