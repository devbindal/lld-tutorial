import { COURSE } from '../data/roadmap.js'

export default function Sidebar({ route, onNavigate }) {
  return (
    <aside className={'sidebar' + (route.menuOpen ? ' open' : '')}>
      <div className="brand">{COURSE.title}</div>
      <div className="brandsub">{COURSE.subtitle}</div>

      <a className="homelink" href="#/" onClick={() => onNavigate()}>← All concepts (home)</a>

      {COURSE.weeks.map((week) => (
        <div key={week.id}>
          <div className="weeklabel">{week.label}</div>
          {week.days.map((day) => {
            const active = route.name === 'day' && route.day === day.id
            const cls = 'navlink' + (active ? ' active' : '') + (day.ready ? '' : ' locked')
            const href = day.ready ? `#/day/${day.id}` : '#/'
            return (
              <a key={day.id} className={cls} href={href}
                 onClick={() => day.ready && onNavigate()}
                 aria-disabled={!day.ready}>
                <div className="nt">
                  <span className="daynum">{day.id}</span>
                  {day.title}
                  {!day.ready && <span className="lockicon">🔒 soon</span>}
                </div>
                <div className="ns">{day.sub}</div>
              </a>
            )
          })}
        </div>
      ))}
    </aside>
  )
}
