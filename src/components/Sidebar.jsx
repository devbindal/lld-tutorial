import { useState, useEffect } from 'react'
import { COURSE } from '../data/roadmap.js'

function weekOfDay(dayId) {
  const w = COURSE.weeks.find((week) => week.days.some((d) => d.id === dayId))
  return w ? w.id : null
}

export default function Sidebar({ route, onNavigate }) {
  const activeWeek = route.name === 'day' ? weekOfDay(route.day) : null

  // Which week dropdowns are expanded. Start with the active week open
  // (or the latest week when on the home page).
  const [open, setOpen] = useState(() => ({
    [activeWeek || COURSE.weeks[COURSE.weeks.length - 1].id]: true,
  }))

  // If the user navigates to a day (e.g. from the home grid), expand its week.
  useEffect(() => {
    if (activeWeek) setOpen((o) => (o[activeWeek] ? o : { ...o, [activeWeek]: true }))
  }, [activeWeek])

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))

  return (
    <aside className={'sidebar' + (route.menuOpen ? ' open' : '')}>
      <div className="brand">{COURSE.title}</div>
      <div className="brandsub">{COURSE.subtitle}</div>

      <a className="homelink" href="#/" onClick={() => onNavigate()}>← All concepts (home)</a>

      {COURSE.weeks.map((week) => {
        const expanded = !!open[week.id]
        const readyCount = week.days.filter((d) => d.ready).length
        return (
          <div key={week.id}>
            <button className="weekbtn" onClick={() => toggle(week.id)} aria-expanded={expanded}>
              <span className={'weekarrow' + (expanded ? ' down' : '')}>▸</span>
              {week.label}
              <span className="weekcount">{readyCount}/{week.days.length}</span>
            </button>
            {expanded && week.days.map((day) => {
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
        )
      })}
    </aside>
  )
}
