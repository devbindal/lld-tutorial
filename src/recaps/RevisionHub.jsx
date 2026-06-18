import { COURSE } from '../data/roadmap.js'

/* One-line headline for each week — the single thing to remember it by. */
const HEADLINE = {
  w1: 'A class is a blueprint; objects live on the heap. Master constructors, this, access, static, == vs equals.',
  w2: 'Model relationships (has-a vs is-a), draw them in UML, and turn a problem statement into entities.',
  w3: 'SOLID: one reason to change · open/closed · substitutable subtypes · small interfaces · depend on abstractions.',
  w4: 'Keep it small & honest: DRY/KISS/YAGNI, low coupling + high cohesion, Demeter, enums, value objects.',
  w5: 'Creational patterns — control HOW objects are made: Singleton, Factory, Abstract Factory, Builder, Prototype.',
  w6: 'Structural patterns — compose objects: Adapter, Decorator, Composite, Facade/Proxy, Flyweight/Bridge.',
  w7: 'Behavioral I — who does what: Strategy, Observer, Command, State, Template Method.',
  w8: 'Behavioral II — Chain of Responsibility, Iterator, Mediator, Memento, Visitor.',
  w9: 'First classics: the interview ritual, then Parking Lot, Tic-Tac-Toe, Snake & Ladder.',
  w10: 'Machines & frameworks: Elevator (scheduling), Vending Machine (State), Logging (Chain + appenders).',
  w11: 'Big systems: the recurring race (atomic claim) — BookMyShow, Splitwise, ATM.',
  w12: 'Data structures & frameworks: LRU (HashMap+DLL), Notification (5 axes + reliability), Cab Booking (the capstone) — and Month 3\'s seven shapes.',
  w13: 'Concurrency end to end: races & the JMM, synchronized/volatile/atomics/locks, producer-consumer, optimistic vs pessimistic, the rate limiter.',
}

export default function RevisionHub() {
  const weeks = COURSE.months.flatMap((m) => m.weeks.map((w) => ({ ...w, monthLabel: m.label })))
  const readyCount = weeks.filter((w) => w.recap && w.recap.ready).length
  const totalRecaps = weeks.filter((w) => w.recap).length

  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision Hub · one-page recaps</div>
        <h1>Revise Everything,<br />Week by Week</h1>
        <p>Every week has a dense recap page: the core ideas, the running analogy, the patterns used, the
           golden rules, the common traps, a memory hook for each concept, a rapid-review widget, and a recap
           quiz. Come here when you want to revise — pick a week, or sweep through them all in order.</p>
        <div className="chips">
          <span className="chip">{readyCount} / {totalRecaps} recaps ready</span>
          <span className="chip">cheat-sheet + quiz each</span>
          <span className="chip">★ built for revision</span>
        </div>
      </div>

      <section id="how">
        <div className="sec-label">How to use this</div>
        <h2>Three ways to revise</h2>
        <ul>
          <li><strong>Targeted:</strong> just finished a week? Open its recap, read the cheat-sheet, then take the recap quiz. Anything you miss → reopen that day.</li>
          <li><strong>Sweep:</strong> revising for an interview? Read every ready recap top to bottom — they\'re ordered so the patterns build on each other.</li>
          <li><strong>Rapid:</strong> short on time? Each recap\'s "memory hooks" list is a 60-second skim of the whole week.</li>
        </ul>
      </section>

      {COURSE.months.map((month) => (
        <section key={month.id} id={month.id}>
          <div className="sec-label">{month.label}</div>
          <div className="daygrid" style={{ marginTop: 8 }}>
            {month.weeks.map((week) => {
              if (!week.recap) return null
              const r = week.recap
              const wReady = week.days.filter((d) => d.ready).length
              return (
                <a key={week.id}
                   className={'daycard' + (r.ready ? '' : ' locked')}
                   href={r.ready ? `#/recap/${r.slug}` : '#/'}
                   style={{ borderStyle: 'dashed' }}>
                  <div className="dc-num">★ {week.label.replace(/·.*$/, '').trim().toUpperCase()}</div>
                  <div className="dc-title">{week.label.replace(/^[^·]*·\s*/, '')}</div>
                  <div className="dc-sub">{HEADLINE[week.id] || r.sub}</div>
                  <span className={'dc-tag ' + (r.ready ? 'ready' : 'soon')}>
                    {r.ready ? `★ Revise · ${wReady} days` : 'Coming soon'}
                  </span>
                </a>
              )
            })}
          </div>
        </section>
      ))}

      <div className="footer">
        <strong>Tip:</strong> a recap is locked (🔒) until its week is finished and its recap page is written.
        As new weeks complete, their recap appears here automatically. Use the recap quizzes as a quick
        self-check — green twice means you can move on.
      </div>
    </div>
  )
}
