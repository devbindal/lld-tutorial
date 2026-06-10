import { useState, useEffect } from 'react'
import { COURSE } from '../data/roadmap.js'

// find which month + week a day belongs to
function locate(dayId) {
  for (const month of COURSE.months) {
    for (const week of month.weeks) {
      if (week.days.some((d) => d.id === dayId)) return { monthId: month.id, weekId: week.id }
    }
  }
  return null
}

// default expansion: the active day's month+week, or the latest week that has a ready day
function defaultOpen(route) {
  if (route.name === 'day') {
    const loc = locate(route.day)
    if (loc) return loc
  }
  let last = { monthId: COURSE.months[0].id, weekId: COURSE.months[0].weeks[0].id }
  for (const month of COURSE.months) {
    for (const week of month.weeks) {
      if (week.days.some((d) => d.ready)) last = { monthId: month.id, weekId: week.id }
    }
  }
  return last
}

export default function Sidebar({ route, onNavigate }) {
  const activeLoc = route.name === 'day' ? locate(route.day) : null
  const init = defaultOpen(route)

  const [openM, setOpenM] = useState({ [init.monthId]: true })
  const [openW, setOpenW] = useState({ [init.weekId]: true })

  // navigating to a day (e.g. from the home grid) expands its month + week
  useEffect(() => {
    if (!activeLoc) return
    setOpenM((o) => (o[activeLoc.monthId] ? o : { ...o, [activeLoc.monthId]: true }))
    setOpenW((o) => (o[activeLoc.weekId] ? o : { ...o, [activeLoc.weekId]: true }))
  }, [activeLoc && activeLoc.monthId, activeLoc && activeLoc.weekId])

  const toggleM = (id) => setOpenM((o) => ({ ...o, [id]: !o[id] }))
  const toggleW = (id) => setOpenW((o) => ({ ...o, [id]: !o[id] }))

  return (
    <aside className={'sidebar' + (route.menuOpen ? ' open' : '')}>
      <div className="brand">{COURSE.title}</div>
      <div className="brandsub">{COURSE.subtitle}</div>

      <a className="homelink" href="#/" onClick={() => onNavigate()}>← All concepts (home)</a>

      {COURSE.months.map((month) => {
        const mExpanded = !!openM[month.id]
        const mDays = month.weeks.flatMap((w) => w.days)
        const mReady = mDays.filter((d) => d.ready).length
        return (
          <div key={month.id}>
            <button className="monthbtn" onClick={() => toggleM(month.id)} aria-expanded={mExpanded}>
              <span className={'weekarrow' + (mExpanded ? ' down' : '')}>▸</span>
              {month.label}
              <span className="weekcount">{mReady}/{mDays.length}</span>
            </button>
            {mExpanded && (
              <div style={{ paddingLeft: 8 }}>
                {month.weeks.map((week) => {
                  const wExpanded = !!openW[week.id]
                  const readyCount = week.days.filter((d) => d.ready).length
                  return (
                    <div key={week.id}>
                      <button className="weekbtn" onClick={() => toggleW(week.id)} aria-expanded={wExpanded}>
                        <span className={'weekarrow' + (wExpanded ? ' down' : '')}>▸</span>
                        {week.label}
                        <span className="weekcount">{readyCount}/{week.days.length}</span>
                      </button>
                      {wExpanded && week.days.map((day) => {
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
              </div>
            )}
          </div>
        )
      })}
    </aside>
  )
}
