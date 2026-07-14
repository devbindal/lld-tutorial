import { useState } from 'react'
import { Code, C, Reveal, Note, Good } from '../../../components/ui.jsx'

/* ============ Interactive 1: skill snapshot ============ */
const SKILL_CATEGORIES = [
  {
    cat: 'OOP & Relationships',
    skills: [
      'I can model any real-world object as a class with correct access modifiers and lifecycle.',
      'I can spot when a subclass violates its parent\'s contract (LSP) and fix it.',
      'I can draw all six UML arrows and explain when to use each one.',
      'I can choose between Association, Aggregation, and Composition based on lifecycle ownership.',
    ],
  },
  {
    cat: 'GoF Design Patterns (23 patterns)',
    skills: [
      'I can name all five Creational patterns and give an example of each.',
      'I can explain the difference between Decorator, Proxy, Adapter, and Facade from memory.',
      'I can implement Observer, Strategy, and Command without looking at reference code.',
      'I can name the double-dispatch trick that makes Visitor work.',
      'I can explain when State and Strategy look identical and how to tell them apart.',
      'I can implement a two-stack undo/redo system using Command.',
    ],
  },
  {
    cat: 'Classic LLD Systems',
    skills: [
      'I can design a Parking Lot, Elevator, or Vending Machine in 45 minutes from scratch.',
      'I can identify and fix a check-then-act race with synchronized or CAS.',
      'I can design the BookMyShow seat-hold with atomic compare-and-set.',
      'I can implement an LRU Cache with O(1) get and put using HashMap + doubly-linked list.',
      'I can explain how the ATM state machine prevents illegal operations.',
    ],
  },
  {
    cat: 'Concurrency (Week 13)',
    skills: [
      'I can explain the three JMM hazards: atomicity, visibility, and ordering.',
      'I can explain why volatile++ is still a race condition.',
      'I can implement a bounded blocking queue using wait/notify.',
      'I can choose between synchronized, volatile, AtomicInteger, and ReentrantLock for a given problem.',
    ],
  },
  {
    cat: 'Interview Skills',
    skills: [
      'I can name the 5 hire-signal sentences and say when to use each one.',
      'I know the recovery script for every stuck-moment scenario.',
    ],
  },
]

function SkillSnapshot() {
  const [checked, setChecked] = useState({})
  const toggle = (cat, i) => setChecked((c) => ({ ...c, [`${cat}-${i}`]: !c[`${cat}-${i}`] }))

  const total = SKILL_CATEGORIES.reduce((n, g) => n + g.skills.length, 0)
  const done = Object.values(checked).filter(Boolean).length

  const catCounts = SKILL_CATEGORIES.map((g) => ({
    cat: g.cat,
    done: g.skills.filter((_, i) => checked[`${g.cat}-${i}`]).length,
    total: g.skills.length,
  }))

  let msg = ''
  if (done === total) msg = 'Full confidence across the board. You have earned your seat at the table.'
  else if (done >= total * 0.8) msg = 'Strong overall — one focused review session on the unchecked items and you are ready.'
  else if (done >= total * 0.6) msg = 'Solid foundation. Revisit the unchecked categories before your first interview.'
  else if (done > 0) msg = 'Good start. The unchecked items are your revision priority.'

  return (
    <div className="panel">
      <div className="ptitle">Live demo · your personal skill snapshot — check what you feel confident in</div>
      {SKILL_CATEGORIES.map((g) => {
        const cc = catCounts.find((x) => x.cat === g.cat)
        return (
          <div key={g.cat} style={{ marginBottom: 14 }}>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>{g.cat.toUpperCase()}</span>
              <span style={{ color: cc.done === cc.total ? '#1d7a3a' : '#7c8aa5' }}>{cc.done}/{cc.total}</span>
            </div>
            {g.skills.map((skill, i) => {
              const key = `${g.cat}-${i}`
              return (
                <button key={i} onClick={() => toggle(g.cat, i)} style={{
                  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                  fontFamily: 'IBM Plex Sans', fontSize: 13.5, padding: '6px 8px', marginBottom: 4,
                  border: '1px solid var(--line)', borderRadius: 6,
                  background: checked[key] ? '#EAF7EF' : '#fff',
                }}>
                  {checked[key] ? '☑' : '☐'} {skill}
                </button>
              )
            })}
          </div>
        )
      })}
      <div className="statbar" style={{ display: 'block', background: done === total ? '#EAF7EF' : undefined }}>
        <b>{done} / {total}</b> skills confident
        {msg && <span style={{ marginLeft: 8, color: '#444' }}>— {msg}</span>}
      </div>
    </div>
  )
}

/* ============ The page ============ */
export default function Day80() {
  return (
    <div className="scrollarea">
      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 16 · Day 80</div>
        <h1>Graduation:<br />80 Days, a Lifetime of Design</h1>
        <p>You made it. 80 days. Every class you wrote, every state machine you drew, every quiz you got
          wrong and went back to fix — it adds up. This page is yours.</p>
      </div>

      {/* s1: what you can now do */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What you can now do</h2>
        <p>You did not just study LLD. You built the habit of seeing structure in problems. Here is what
          that looks like as a skill inventory:</p>
        <ul style={{ lineHeight: 2 }}>
          <li>You can model any real-world object as a class with the right access modifiers and lifecycle.</li>
          <li>You can spot when a subclass violates its parent's contract (LSP) and fix it without changing the parent.</li>
          <li>You can read a GoF pattern name and immediately know the problem it solves and the forces it balances.</li>
          <li>You can design a Parking Lot, Elevator, Vending Machine, or ATM in 45 minutes from scratch.</li>
          <li>You can identify a check-then-act race, name it out loud, and fix it with CAS or synchronized in the same sentence.</li>
          <li>You can explain fan-out-on-write vs pull-on-read and when to switch strategies based on follower count.</li>
          <li>You can name the 7 problem shapes and slot any new LLD problem into one within the first 60 seconds.</li>
          <li>You can read unfamiliar Java code (Spring, Guava, Kafka) and recognise the GoF patterns inside it.</li>
          <li>You can walk into a 45-minute interview, clarify first, draw entities before code, name patterns with reasons, and wrap up cleanly — every time.</li>
        </ul>
        <Good>Every item above is something you could not do 80 days ago. That is the course in one list.</Good>
      </section>

      {/* s2: the course map */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The 80-day journey — a map</h2>
        <Code html={`  THE 80-DAY LLD COURSE — complete map
  ══════════════════════════════════════════════════════════════════════════

   MONTH 1 · OOP MASTERY + SOLID           Days 1–20
   ────────────────────────────────────────────────────────────────────────
   W1 Classes · Encapsulation · Inheritance · Polymorphism · Abstraction
         1         2               3               4             5
   W2 Association · Dependency · UML Classes · Sequences · Entities
         6             7              8            9           10
   W3 SRP · OCP · LSP · ISP · DIP
       11    12    13    14    15
   W4 DRY/KISS/YAGNI · Coupling/Cohesion · Law of Demeter ·
        16                   17                  18
      Enums/Exceptions · Value Objects
             19                20


   MONTH 2 · GOF DESIGN PATTERNS (23)      Days 21–40
   ────────────────────────────────────────────────────────────────────────
   W5 Creational:   Singleton · Factory · Abstract Factory · Builder · Prototype
                       21          22           23              24         25
   W6 Structural:   Adapter · Decorator · Composite · Facade/Proxy · Flyweight/Bridge
                       26         27          28           29              30
   W7 Behavioral:   Strategy · Observer · Command · State · Template Method
                       31          32         33        34          35
   W8 Behavioral:   CoR · Iterator · Mediator · Memento · Visitor
                     36      37          38         39        40


   MONTH 3 · CLASSIC LLD PROBLEMS          Days 41–60
   ────────────────────────────────────────────────────────────────────────
   W9  Parking Lot (x2) · Tic-Tac-Toe · Snake &amp; Ladder · Mock Drill
           41–42             43              44              45
   W10 Elevator (x2) · Vending Machine · Logging Framework · Mock Drill
           46–47              48                 49               50
   W11 BookMyShow (x2) · Splitwise · ATM · Mock Drill
            51–52           53         54       55
   W12 LRU Cache · Notification · Cab Booking (x2) · Mock Drill
          56           57              58–59              60


   MONTH 4 · ADVANCED LLD                  Days 61–80
   ────────────────────────────────────────────────────────────────────────
   W13 Concurrency Pt1 · Pt2 · Producer-Consumer · Optimistic/Pessimistic · Rate Limiter
            61           62           63                    64                   65
   W14 Chess · Food Delivery · Amazon Locker · Pub-Sub Queue · Mock Drill
         66         67               68              69            70
   W15 Hotel · Auction · Social Feed · Task Board · Mock Drill
        71       72          73           74            75
   W16 Online Exam · Digital Library · Flashcards/URL · Interview Day · GRADUATION
          76              77               78               79              80

   ══════════════════════════════════════════════════════════════════════════
   23 GoF patterns  ·  14 big LLD systems  ·  7 mock interview drills
   4 concurrency chapters  ·  5 SOLID principles  ·  1 complete course
   ══════════════════════════════════════════════════════════════════════════`} />
        <Note>Every day on this map is a concept you understood deeply enough to use in an interview. That is
          80 distinct engineering muscles. Most software engineers work for years before developing all of these
          intuitively. You have built them deliberately.</Note>
      </section>

      {/* s3: portfolio projects */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>What to build next — portfolio projects</h2>
        <p>The best way to cement everything you have learned is to build something. These six projects each
          test a distinct cluster of skills and are recognised by interviewers as serious portfolio pieces:</p>
        <table className="matrix">
          <thead>
            <tr><th>Project</th><th>Why it works as a portfolio piece</th><th>Days to review first</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Parking Lot (CLI)</strong></td>
              <td>Classic; tests entities, state machine, Strategy (allocation + pricing), and atomic spot claim in under 500 lines</td>
              <td>Days 41–42</td>
            </tr>
            <tr>
              <td><strong>LRU Cache (standalone library)</strong></td>
              <td>Tests DS design + thread safety; a good LRU is a two-page interview answer in code form</td>
              <td>Days 56, 62–64</td>
            </tr>
            <tr>
              <td><strong>Event Bus (Guava-style, in-memory)</strong></td>
              <td>Tests Observer + pub-sub; a real tool engineers use every day; shows you can build infrastructure</td>
              <td>Days 32, 69</td>
            </tr>
            <tr>
              <td><strong>Mini ride-hailing (CLI)</strong></td>
              <td>Tests everything at once: matching, state machines, money, concurrency, Strategy; the ultimate portfolio problem</td>
              <td>Days 58–59</td>
            </tr>
            <tr>
              <td><strong>Concurrent rate limiter (HTTP middleware)</strong></td>
              <td>Tests Month 4 in full: atomic state, Strategy (token bucket vs sliding window), thread safety, clock injection</td>
              <td>Day 65</td>
            </tr>
            <tr>
              <td><strong>Chess engine (CLI)</strong></td>
              <td>Tests polymorphism (each piece owns its rules), Command (move history), and game-loop design</td>
              <td>Day 66</td>
            </tr>
          </tbody>
        </table>
        <Good><strong>Pick one and finish it.</strong> A finished, well-structured, documented project in a
          GitHub repo is worth more than six half-built ones. Pick the one closest to your target company's
          domain and build it to completion with tests.</Good>
      </section>

      {/* s4: 4-week interview plan */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>How to prepare for the interview from here — a 4-week plan</h2>
        <Code html={`  WEEK 1 — Structured practice
  ──────────────────────────────────────────────────────────────
  · Solve 2 LLD problems from scratch, timed at 45 minutes each.
  · Problems to try: Library Management System, Ride Booking.
  · After each: score yourself on the Day 79 rubric. Write top-2 gaps.
  · Do not look at the solution until after the rubric score is written.

  WEEK 2 — Revision + flashcard sweep
  ──────────────────────────────────────────────────────────────
  · Open the Revision Hub and revise all 16 week recaps.
    Focus on Weeks 13–16 (most recent, most likely to ask).
  · Re-read the 10 flashcards from Day 78 out loud.
  · Redo any quiz where your first score was below 6/8.

  WEEK 3 — Mock interviews
  ──────────────────────────────────────────────────────────────
  · Do 2 real mock interviews with a friend, peer, or on
    Pramp / Interviewing.io.
  · Ask the mock interviewer to use the Day 79 rubric to score you.
  · After each mock: identify the 1 behaviour you will change.

  WEEK 4 — Read and connect
  ──────────────────────────────────────────────────────────────
  · Read 2–3 engineering blog posts from a company you admire.
  · For each post: identify which Month 3–4 shape it describes.
    (Uber blog = matching + surge = Day 58–59.
     Discord blog = observer + message queue = Day 69.
     Redis blog = LRU + atomic ops = Day 56 + 64.)
  · Arrive at the interview knowing one real system the company
    built and which of your 23 patterns appears in it.`} />
      </section>

      {/* s5: skills that transfer */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>The skills that transfer — beyond the interview</h2>
        <p>LLD is not just an interview topic. Every concept in this course appears in production engineering.</p>
        <ul style={{ lineHeight: 2.1 }}>
          <li><strong>State machines (Weeks 9–11, 15)</strong> appear in network protocols (TCP handshake = state machine), compiler design (parser states), game development (character states), and every UI framework that has a loading/error/success flow.</li>
          <li><strong>Observer / pub-sub (Days 32, 69)</strong> IS the event-driven architecture of modern microservices. Apache Kafka, AWS SNS/SQS, Google Pub/Sub — all are Observer at distributed scale.</li>
          <li><strong>The SOLID principles (Days 11–15)</strong> are the vocabulary of every code review you will ever conduct. When you say "this class violates SRP" or "this is an OCP violation," you are speaking the language of senior engineering.</li>
          <li><strong>The concurrency tools from Week 13</strong> map directly to Go channels (bounded blocking queue), Rust <C>Mutex&lt;T&gt;</C> (ownership-enforced locking), and Python <C>asyncio</C> (cooperative concurrency to avoid races).</li>
          <li><strong>Value Objects (Day 20) and Money types</strong> appear in every financial system. The "never use double for money" rule will save you from real bugs in production code — including the Mars orbiter kind.</li>
          <li><strong>Strategy + Decorator (Days 31, 27)</strong> are the backbone of Spring's security filter chain, Java's <C>java.io</C> streams, and every middleware pipeline you will write.</li>
        </ul>
        <Note>Good design is not a job requirement. It is a habit. You have spent 80 days making it a habit.
          That habit does not expire when the interview ends.</Note>
      </section>

      {/* s6: skill snapshot */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>Your personal skill snapshot</h2>
        <p>Check every skill you feel genuinely confident in — not "I could look it up" confident, but
          "I could explain it to a colleague right now" confident. Be honest. The gaps you find here are
          your revision targets.</p>
        <SkillSnapshot />
      </section>

      {/* s7: final message */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>A final message</h2>
        <div style={{
          padding: '28px 32px', border: '2px solid var(--blue)', borderRadius: 12,
          background: 'linear-gradient(135deg, #F0F4FF 0%, #FAFAF7 100%)',
          fontFamily: 'Space Grotesk', fontSize: 17, lineHeight: 2, color: 'var(--ink)',
        }}>
          <p style={{ margin: '0 0 14px' }}>
            Good design is not about knowing the most patterns.
          </p>
          <p style={{ margin: '0 0 14px' }}>
            It is about seeing the right structure when you are under pressure.
          </p>
          <p style={{ margin: '0 0 14px' }}>
            You have spent 80 days training that muscle.
          </p>
          <p style={{ margin: '0 0 14px' }}>
            Walk into that room knowing you have earned your seat at the table.
          </p>
          <p style={{ margin: 0, fontWeight: 700 }}>
            Go build something great.
          </p>
        </div>
      </section>

      {/* s8: what's next */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>What to read next — continuing the journey</h2>
        <p>The course is over. The learning does not have to be. These resources take each cluster of this
          course further:</p>
        <ul style={{ lineHeight: 2.2 }}>
          <li>
            <strong>Designing Data-Intensive Applications</strong> by Martin Kleppmann — the book that takes
            Week 13 concurrency concepts to distributed-systems scale. Reads like a longer, deeper Month 4.
            Essential if you are targeting backend or infra roles.
          </li>
          <li>
            <strong>Clean Code</strong> by Robert C. Martin — Day 11 (SRP) expanded to a full book. Covers
            naming, functions, classes, and formatting with the same "one reason to change" lens.
          </li>
          <li>
            <strong>A Philosophy of Software Design</strong> by John Ousterhout — Days 17 and 18 (coupling
            and cohesion, Law of Demeter) at book length. Challenges some of Clean Code's positions in
            interesting ways.
          </li>
          <li>
            <strong>Head First Design Patterns</strong> by Freeman et al. — Month 2's 23 patterns with visual
            teaching and comics. If any pattern still feels fuzzy, this book makes it concrete in a different
            way than the course did.
          </li>
          <li>
            <strong>Open-source Java projects to read:</strong> Spring Framework (DI, proxy, observer in
            production), Apache Kafka (pub-sub, offset commits, consumer groups), Guava (immutable collections,
            cache, event bus). Reading production code that uses patterns you know is the fastest way to make
            the patterns feel natural.
          </li>
        </ul>
        <Reveal summary="Bonus: how to keep the habit alive">
          <p>The engineers who retain what they learned do one thing: they <strong>name the patterns they see</strong>
            in daily code review. When you see a pull request that adds a Strategy, say so out loud. When you
            spot a check-then-act race in a diff, name it. When you refactor a god class, count the responsibilities
            before and after. The vocabulary you built over 80 days becomes permanent when you use it in conversation
            every day.</p>
        </Reveal>
      </section>

      {/* footer — graduation */}
      <div className="footer" style={{ textAlign: 'center', fontSize: 16, lineHeight: 1.9 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
        <strong>The course is complete.</strong>
        <br /><br />
        Keep building. Keep reviewing. Keep growing.
        <br />
        See you on the other side of that interview.
        <br /><br />
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: '#7c8aa5' }}>
          Days 1–80 · 4 Months · 23 Patterns · 14 Systems · 1 Graduate
        </span>
      </div>
    </div>
  )
}
