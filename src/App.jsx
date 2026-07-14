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
const Day43 = lazy(() => import('./months/month3/week9/Day43.jsx'))
const Day44 = lazy(() => import('./months/month3/week9/Day44.jsx'))
const Day45 = lazy(() => import('./months/month3/week9/Day45.jsx'))
const Day46 = lazy(() => import('./months/month3/week10/Day46.jsx'))
const Day47 = lazy(() => import('./months/month3/week10/Day47.jsx'))
const Day48 = lazy(() => import('./months/month3/week10/Day48.jsx'))
const Day49 = lazy(() => import('./months/month3/week10/Day49.jsx'))
const Day50 = lazy(() => import('./months/month3/week10/Day50.jsx'))
const Day51 = lazy(() => import('./months/month3/week11/Day51.jsx'))
const Day52 = lazy(() => import('./months/month3/week11/Day52.jsx'))
const Day53 = lazy(() => import('./months/month3/week11/Day53.jsx'))
const Day54 = lazy(() => import('./months/month3/week11/Day54.jsx'))
const Day55 = lazy(() => import('./months/month3/week11/Day55.jsx'))
const Day56 = lazy(() => import('./months/month3/week12/Day56.jsx'))
const Day57 = lazy(() => import('./months/month3/week12/Day57.jsx'))
const Day58 = lazy(() => import('./months/month3/week12/Day58.jsx'))
const Day59 = lazy(() => import('./months/month3/week12/Day59.jsx'))
const Day60 = lazy(() => import('./months/month3/week12/Day60.jsx'))
const Day61 = lazy(() => import('./months/month4/week13/Day61.jsx'))
const Day62 = lazy(() => import('./months/month4/week13/Day62.jsx'))
const Day63 = lazy(() => import('./months/month4/week13/Day63.jsx'))
const Day64 = lazy(() => import('./months/month4/week13/Day64.jsx'))
const Day65 = lazy(() => import('./months/month4/week13/Day65.jsx'))
const Day66 = lazy(() => import('./months/month4/week14/Day66.jsx'))
const Day67 = lazy(() => import('./months/month4/week14/Day67.jsx'))
const Day68 = lazy(() => import('./months/month4/week14/Day68.jsx'))
const Day69 = lazy(() => import('./months/month4/week14/Day69.jsx'))
const Day70 = lazy(() => import('./months/month4/week14/Day70.jsx'))
const Day71 = lazy(() => import('./months/month4/week15/Day71.jsx'))
const Day72 = lazy(() => import('./months/month4/week15/Day72.jsx'))
const Day73 = lazy(() => import('./months/month4/week15/Day73.jsx'))
const Day74 = lazy(() => import('./months/month4/week15/Day74.jsx'))
const Day75 = lazy(() => import('./months/month4/week15/Day75.jsx'))
const Day76 = lazy(() => import('./months/month4/week16/Day76.jsx'))
const Day77 = lazy(() => import('./months/month4/week16/Day77.jsx'))
const Day78 = lazy(() => import('./months/month4/week16/Day78.jsx'))
const Day79 = lazy(() => import('./months/month4/week16/Day79.jsx'))
const Day80 = lazy(() => import('./months/month4/week16/Day80.jsx'))

// Revision: a recap page per week + a master hub.
const RevisionHub = lazy(() => import('./recaps/RevisionHub.jsx'))
const RecapW1 = lazy(() => import('./recaps/RecapW1.jsx'))
const RecapW2 = lazy(() => import('./recaps/RecapW2.jsx'))
const RecapW3 = lazy(() => import('./recaps/RecapW3.jsx'))
const RecapW4 = lazy(() => import('./recaps/RecapW4.jsx'))
const RecapW5 = lazy(() => import('./recaps/RecapW5.jsx'))
const RecapW6 = lazy(() => import('./recaps/RecapW6.jsx'))
const RecapW7 = lazy(() => import('./recaps/RecapW7.jsx'))
const RecapW8 = lazy(() => import('./recaps/RecapW8.jsx'))
const RecapW9 = lazy(() => import('./recaps/RecapW9.jsx'))
const RecapW10 = lazy(() => import('./recaps/RecapW10.jsx'))
const RecapW11 = lazy(() => import('./recaps/RecapW11.jsx'))
const RecapW12 = lazy(() => import('./recaps/RecapW12.jsx'))
const RecapW13 = lazy(() => import('./recaps/RecapW13.jsx'))
const RecapW14 = lazy(() => import('./recaps/RecapW14.jsx'))
const RecapW15 = lazy(() => import('./recaps/RecapW15.jsx'))
const RecapW16 = lazy(() => import('./recaps/RecapW16.jsx'))
const RECAP_COMPONENTS = {
  w1: RecapW1,
  w2: RecapW2,
  w3: RecapW3,
  w4: RecapW4,
  w5: RecapW5,
  w6: RecapW6,
  w7: RecapW7,
  w8: RecapW8,
  w9: RecapW9,
  w10: RecapW10,
  w11: RecapW11,
  w12: RecapW12,
  w13: RecapW13,
  w14: RecapW14,
  w15: RecapW15,
  w16: RecapW16,
}

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
  43: Day43,
  44: Day44,
  45: Day45,
  46: Day46,
  47: Day47,
  48: Day48,
  49: Day49,
  50: Day50,
  51: Day51,
  52: Day52,
  53: Day53,
  54: Day54,
  55: Day55,
  56: Day56,
  57: Day57,
  58: Day58,
  59: Day59,
  60: Day60,
  61: Day61,
  62: Day62,
  63: Day63,
  64: Day64,
  65: Day65,
  66: Day66,
  67: Day67,
  68: Day68,
  69: Day69,
  70: Day70,
  71: Day71,
  72: Day72,
  73: Day73,
  74: Day74,
  75: Day75,
  76: Day76,
  77: Day77,
  78: Day78,
  79: Day79,
  80: Day80,
}

function parseHash() {
  const h = window.location.hash.replace(/^#/, '') // e.g. "/day/1" or "/recap/w1" or "/revise"
  const m = h.match(/^\/day\/(\d+)/)
  if (m) return { name: 'day', day: parseInt(m[1], 10) }
  const r = h.match(/^\/recap\/(\w+)/)
  if (r) return { name: 'recap', week: r[1] }
  if (/^\/revise/.test(h)) return { name: 'hub' }
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
  } else if (route.name === 'recap') {
    const Comp = RECAP_COMPONENTS[route.week]
    page = Comp ? <Comp /> : <Home />
  } else if (route.name === 'hub') {
    page = <RevisionHub />
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
