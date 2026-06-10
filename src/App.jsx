import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Home from './components/Home.jsx'
import Day1 from './days/Day1.jsx'
import Day2 from './days/Day2.jsx'
import Day3 from './days/Day3.jsx'
import Day4 from './days/Day4.jsx'
import { ALL_DAYS } from './data/roadmap.js'

// Map of built day components. Add Day2, Day3... here as you create them.
const DAY_COMPONENTS = {
  1: Day1,
  2: Day2,
  3: Day3,
  4: Day4,
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
          <code className="inline">Day{day}.jsx</code> file into <code className="inline">src/days/</code>,
          register it in <code className="inline">App.jsx</code> and flip <code className="inline">ready: true</code> in
          <code className="inline">src/data/roadmap.js</code>.
        </p>
        <a className="homelink" href="#/" style={{ fontSize: 15 }}>← Back to all concepts</a>
      </section>
    </div>
  )
}

export default function App() {
  const [route, setRoute] = useState(parseHash())
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
