import { useState, useEffect, lazy, Suspense } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Home from './components/Home.jsx'
import { ALL_DAYS } from './data/roadmap.js'

// Lazy imports: each day page is its own chunk, loaded on first visit.
const Day1 = lazy(() => import('./months/month1/week1/Day1.jsx'))
const Day2 = lazy(() => import('./months/month1/week1/Day2.jsx'))
const Day3 = lazy(() => import('./months/month1/week1/Day3.jsx'))
const Day4 = lazy(() => import('./months/month1/week1/Day4.jsx'))
const Day5 = lazy(() => import('./months/month1/week1/Day5.jsx'))
const Day6 = lazy(() => import('./months/month1/week2/Day6.jsx'))
const Day7 = lazy(() => import('./months/month1/week2/Day7.jsx'))
const Day8 = lazy(() => import('./months/month1/week2/Day8.jsx'))
const Day9 = lazy(() => import('./months/month1/week2/Day9.jsx'))
const Day10 = lazy(() => import('./months/month1/week2/Day10.jsx'))
const Day11 = lazy(() => import('./months/month1/week3/Day11.jsx'))
const Day12 = lazy(() => import('./months/month1/week3/Day12.jsx'))

// Map of built day components. Add new days here as you create them (one folder per week).
const DAY_COMPONENTS = {
  1: Day1,
  2: Day2,
  3: Day3,
  4: Day4,
  5: Day5,
  6: Day6,
  7: Day7,
  8: Day8,
  9: Day9,
  10: Day10,
  11: Day11,
  12: Day12,
}

function parseHash() {
  const h = window.location.hash.replace(/^#/, '') // e.g. "/day/1"
  const m = h.match(/^\/day\/(\d+)/)
  if (m) return { name: 'day', day: parseInt(m[1], 10) }
  return { name: 'home' }
}

function ComingSoon({ day }) {
  const info = ALL_DAYS.find((d) => d.id === day)
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Day {day} · Not built yet</div>
        <h1>{info ? info.title : 'Coming soon'}</h1>
        <p>{info ? info.sub : ''}</p>
      </div>
      <section>
        <p style={{ marginTop: 30 }}>
          This tutorial hasn't been added yet. To build it, ask Claude for "Day {day}", drop the new
          <code className="inline">Day{day}.jsx</code> file into <code className="inline">src/months/monthM/weekN/</code>,
          register it in <code className="inline">App.jsx</code> and flip <code className="inline">ready: true</code> in
          <code className="inline">src/data/roadmap.js</code>.
        </p>
        <a className="homelink" href="#/" style={{ fontSize: 15 }}>← Back to all concepts</a>
      </section>
    </div>
  )
}

export default function App() {
  // Fresh launch (new tab/session) → always land on the home page, even if the
  // browser restored an old #/day/N hash. Refresh in the same tab → stay put.
  const [route, setRoute] = useState(() => {
    if (!sessionStorage.getItem('lld-visited')) {
      sessionStorage.setItem('lld-visited', '1')
      if (window.location.hash && window.location.hash !== '#/') {
        window.location.hash = '#/'
      }
      return { name: 'home' }
    }
    return parseHash()
  })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onHash = () => { setRoute(parseHash()); setMenuOpen(false); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  let page
  if (route.name === 'day') {
    const Comp = DAY_COMPONENTS[route.day]
    page = Comp ? <Comp /> : <ComingSoon day={route.day} />
  } else {
    page = <Home />
  }

  return (
    <div className="app">
      <button className="menubtn" onClick={() => setMenuOpen((o) => !o)}>☰ Menu</button>
      <Sidebar route={{ ...route, menuOpen }} onNavigate={() => setMenuOpen(false)} />
      <div className="content">
        <Suspense fallback={<div className="scrollarea"><p style={{ marginTop: 40, color: '#7c8aa5' }}>Loading…</p></div>}>
          {page}
        </Suspense>
      </div>
    </div>
  )
}
