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
const Day13 = lazy(() => import('./months/month1/week3/Day13.jsx'))
const Day14 = lazy(() => import('./months/month1/week3/Day14.jsx'))
const Day15 = lazy(() => import('./months/month1/week3/Day15.jsx'))
const Day16 = lazy(() => import('./months/month1/week4/Day16.jsx'))
const Day17 = lazy(() => import('./months/month1/week4/Day17.jsx'))
const Day18 = lazy(() => import('./months/month1/week4/Day18.jsx'))
const Day19 = lazy(() => import('./months/month1/week4/Day19.jsx'))
const Day20 = lazy(() => import('./months/month1/week4/Day20.jsx'))
const Day21 = lazy(() => import('./months/month2/week5/Day21.jsx'))
const Day22 = lazy(() => import('./months/month2/week5/Day22.jsx'))
const Day23 = lazy(() => import('./months/month2/week5/Day23.jsx'))
const Day24 = lazy(() => import('./months/month2/week5/Day24.jsx'))
const Day25 = lazy(() => import('./months/month2/week5/Day25.jsx'))
const Day26 = lazy(() => import('./months/month2/week6/Day26.jsx'))
const Day27 = lazy(() => import('./months/month2/week6/Day27.jsx'))
const Day28 = lazy(() => import('./months/month2/week6/Day28.jsx'))
const Day29 = lazy(() => import('./months/month2/week6/Day29.jsx'))
const Day30 = lazy(() => import('./months/month2/week6/Day30.jsx'))
const Day31 = lazy(() => import('./months/month2/week7/Day31.jsx'))
const Day32 = lazy(() => import('./months/month2/week7/Day32.jsx'))
const Day33 = lazy(() => import('./months/month2/week7/Day33.jsx'))
const Day34 = lazy(() => import('./months/month2/week7/Day34.jsx'))
const Day35 = lazy(() => import('./months/month2/week7/Day35.jsx'))
const Day36 = lazy(() => import('./months/month2/week8/Day36.jsx'))
const Day37 = lazy(() => import('./months/month2/week8/Day37.jsx'))
const Day38 = lazy(() => import('./months/month2/week8/Day38.jsx'))
const Day39 = lazy(() => import('./months/month2/week8/Day39.jsx'))
const Day40 = lazy(() => import('./months/month2/week8/Day40.jsx'))
const Day41 = lazy(() => import('./months/month3/week9/Day41.jsx'))
const Day42 = lazy(() => import('./months/month3/week9/Day42.jsx'))

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
  13: Day13,
  14: Day14,
  15: Day15,
  16: Day16,
  17: Day17,
  18: Day18,
  19: Day19,
  20: Day20,
  21: Day21,
  22: Day22,
  23: Day23,
  24: Day24,
  25: Day25,
  26: Day26,
  27: Day27,
  28: Day28,
  29: Day29,
  30: Day30,
  31: Day31,
  32: Day32,
  33: Day33,
  34: Day34,
  35: Day35,
  36: Day36,
  37: Day37,
  38: Day38,
  39: Day39,
  40: Day40,
  41: Day41,
  42: Day42,
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
