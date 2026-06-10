import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Home from './components/Home.jsx'
import Day1 from './weeks/week1/Day1.jsx'
import Day2 from './weeks/week1/Day2.jsx'
import Day3 from './weeks/week1/Day3.jsx'
import Day4 from './weeks/week1/Day4.jsx'
import Day5 from './weeks/week1/Day5.jsx'
import Day6 from './weeks/week2/Day6.jsx'
import { ALL_DAYS } from './data/roadmap.js'

// Map of built day components. Add new days here as you create them (one folder per week).
const DAY_COMPONENTS = {
  1: Day1,
  2: Day2,
  3: Day3,
  4: Day4,
  5: Day5,
  6: Day6,
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
          <code className="inline">Day{day}.jsx</code> file into <code className="inline">src/weeks/weekN/</code>,
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
      <div className="content">{page}</div>
    </div>
  )
}
