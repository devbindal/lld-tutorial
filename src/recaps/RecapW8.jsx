import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../components/ui.jsx'

function ReviewDrill({ items }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= items.length
  const cur = items[idx]
  function pick(i) { if (picked !== null) return; setPicked(i); if (i === cur.a) setScore((s) => s + 1) }
  return (
    <div className="panel">
      <div className="ptitle">Rapid review · name the pattern before you read the answer</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎯 Score: <b>{score} / {items.length}</b>. Anything you missed → reopen that day.</p>
          <button className="act" onClick={() => { setIdx(0); setPicked(null); setScore(0) }}>Review again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 10 }}>🔁 <span>question {idx + 1} of {items.length} · score {score}</span></div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.q}</p>
          <div className="modbtns">
            {cur.o.map((o, i) => (
              <button key={i} className={picked !== null && i === cur.a ? 'on' : ''}
                style={{ fontSize: 12.5, ...(picked === i && i !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}) }}
                onClick={() => pick(i)}>{o}</button>
            ))}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ ' : '❌ '} <b>{cur.o[cur.a]}</b><br /><br />{cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={() => { setPicked(null); setIdx((i) => i + 1) }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const DRILL = [
  { q: 'A request should pass down a line of handlers until one handles it (support escalation). Pattern?', o: ['Chain of Responsibility', 'Mediator', 'Command'], a: 0,
    why: 'Chain of Responsibility: each handler has a reference to the next; it either handles the request or passes it along. Fall-off policy when nobody handles it. Servlet FilterChain.doFilter is the pipeline variant; exception handling is built-in CoR.' },
  { q: 'You want to walk any collection without exposing its internal structure. Pattern?', o: ['Iterator', 'Visitor', 'Composite'], a: 0,
    why: 'Iterator: a cursor (hasNext/next) that traverses without revealing internals. External (client drives) vs internal (collection drives). Fail-fast (modCount → CME) vs weakly-consistent. for-each desugars to an Iterator.' },
  { q: 'N components all talk to each other directly (N² links). You centralize their interaction. Pattern?', o: ['Observer', 'Mediator', 'Facade'], a: 1,
    why: 'Mediator (the air-traffic tower): colleagues talk THROUGH a hub, not to each other — N(N−1)/2 links collapse to N. Chat rooms, dialog forms. vs Observer (broadcast) and Facade (one-way simplification). Trap: the god-mediator.' },
  { q: 'You want to snapshot an object\'s state and restore it later WITHOUT breaking its encapsulation. Pattern?', o: ['Memento', 'Command', 'Prototype'], a: 0,
    why: 'Memento: the Originator creates an opaque Memento (its private state); a Caretaker stores it and hands it back to restore — without reading the internals. Powers undo (often married to Command). Deep-copy mutable state; watch the memory bill.' },
  { q: 'You need to add NEW operations over a stable class hierarchy without editing those classes. Pattern?', o: ['Visitor', 'Strategy', 'Template Method'], a: 0,
    why: 'Visitor: move operations into a visitor; each element\'s accept(visitor) calls back visitor.visit(this) (double dispatch). Adds operations easily, adds element TYPES painfully (the Expression Problem). Composite\'s soulmate. Modern alt: sealed types + pattern matching.' },
  { q: 'for (String s : list) — what does the enhanced for-loop actually use under the hood?', o: ['An index', 'An Iterator (it calls iterator(), then hasNext()/next())', 'Reflection'], a: 1,
    why: 'for-each desugars to an Iterator obtained from Iterable.iterator(). That\'s why modifying the collection during the loop throws ConcurrentModificationException (fail-fast via modCount) — use the iterator\'s own remove(), or a weakly-consistent collection.' },
]

const QUESTIONS = [
  { q: 'Behavioral II completes the GoF catalog. What ties these five together?',
    o: ['They are the same pattern', 'They are structural', 'They manage interaction & responsibility in specific ways: pass requests along (Chain), traverse (Iterator), centralize talk (Mediator), capture/restore state (Memento), add operations over structures (Visitor)', 'They create objects'], a: 2,
    e: 'The remaining behavioral patterns: Chain (route a request), Iterator (walk a collection), Mediator (hub interaction), Memento (state snapshots), Visitor (operations over a hierarchy). With Week 7 they complete the 23 GoF patterns.',
    w: { 0: 'Five distinct intents.', 1: 'They\'re behavioral.', 3: 'That\'s creational.' },
    r: { id: 's1', label: 'Section 1' } },
  { q: 'Chain of Responsibility: what must every passing handler do?',
    o: ['Either handle it OR forward to the next handler — forgetting the forward silently drops the request (the deleted-link gap)', 'Throw an exception', 'Return null', 'Always handle the request'], a: 0,
    e: 'Each handler holds a next reference and decides to handle or pass along. The classic bug is a handler that processes but forgets next.handle() — valid requests vanish with no error. Also decide the fall-off policy (nobody handles it).',
    w: { 1: 'It forwards, not throws.', 2: 'It forwards, not returns null.', 3: 'Only the right handler handles; others forward.' },
    r: { id: 's2', label: 'Section 2 — Day 36' } },
  { q: 'Fail-fast vs weakly-consistent iterators?',
    o: ['Both throw CME', 'Fail-fast (ArrayList/HashMap) throws ConcurrentModificationException if the collection is structurally modified during iteration (via modCount); weakly-consistent (ConcurrentHashMap, CopyOnWriteArrayList) tolerate concurrent modification without throwing', 'Neither detects changes', 'Same thing'], a: 1,
    e: 'Fail-fast detects mid-iteration modification with a modCount check and throws CME (a bug-catcher, not a guarantee). Weakly-consistent iterators reflect some-or-all concurrent changes without throwing. Use the iterator\'s own remove() to mutate safely.',
    w: { 0: 'Weakly-consistent don\'t throw.', 2: 'Fail-fast detects.', 3: 'Opposite behaviors.' },
    r: { id: 's2', label: 'Section 2 — Day 37' } },
  { q: 'Mediator vs Observer?',
    o: ['Mediator broadcasts', 'Mediator CENTRALIZES many-to-many interaction (colleagues coordinate THROUGH a hub that knows them); Observer is one-to-many BROADCAST (subject doesn\'t know/coordinate observers)', 'Identical', 'Observer centralizes'], a: 1,
    e: 'Mediator coordinates colleagues (it knows them and orchestrates rules — chat room censor, form logic). Observer just notifies anonymous subscribers. An event-bus is a hybrid. Trap: the god-mediator absorbing all logic.',
    w: { 0: 'That\'s Observer.', 2: 'Different intent.', 3: 'That\'s Mediator.' },
    r: { id: 's2', label: 'Section 2 — Day 38' } },
  { q: 'Memento keeps the saved state OPAQUE to the Caretaker because…',
    o: ['Only the Originator can read/write the memento\'s contents (e.g. via a narrow interface / inner class); the Caretaker just stores and returns it — preserving encapsulation', 'It is encrypted', 'The Caretaker is trusted', 'It is compressed'], a: 0,
    e: 'The point of Memento is undo WITHOUT exposing internals. The Originator produces the memento and is the only one that can restore from it; the Caretaker holds it blindly. (Often married to Command for undo/redo.)',
    w: { 1: 'Not encryption — access scoping.', 2: 'The Caretaker is deliberately kept ignorant.', 3: 'Not compression.' },
    r: { id: 's2', label: 'Section 2 — Day 39' } },
  { q: 'Visitor and the "Expression Problem"?',
    o: ['It makes both easy', 'It makes both hard', 'Visitor makes adding new OPERATIONS easy (one new visitor) but adding new element TYPES hard (every visitor must gain a method) — the two-axis Expression Problem; the reverse of a normal class hierarchy', 'It has no trade-off'], a: 2,
    e: 'A class hierarchy adds TYPES easily (new subclass) but OPERATIONS painfully (edit every class). Visitor flips it: operations easy, types hard. accept()/visit() is double dispatch. Modern Java: sealed types + pattern-matching switch.',
    w: { 0: 'Types are hard with Visitor.', 1: 'Operations are easy with Visitor.', 3: 'It has a sharp two-axis trade-off.' },
    r: { id: 's2', label: 'Section 2 — Day 40' } },
  { q: 'Why does Visitor need accept()/visit() (double dispatch) instead of just overloading?',
    o: ['For memory', 'It does not need it', 'For speed', 'Java overload resolution is by STATIC type, so visit(element) wouldn\'t pick the right overload for a Component reference — element.accept(visitor) dispatches on the element\'s real type, then visitor.visit(this) dispatches on the visitor: two dynamic dispatches'], a: 3,
    e: 'Single dynamic dispatch + static overload resolution can\'t select the operation by the runtime element type. The accept() trampoline adds a second dispatch so the correct visit(ConcreteElement) runs.',
    w: { 0: 'Not memory.', 1: 'It genuinely needs it in Java.', 2: 'Not performance.' },
    r: { id: 's2', label: 'Section 2 — Day 40' } },
  { q: 'A servlet FilterChain calling chain.doFilter(req, res) is which pattern, in which flavor?',
    o: ['Mediator', 'Visitor', 'Iterator', 'Chain of Responsibility — the PIPELINE flavor (every filter processes and passes along, rather than exactly one handling it)'], a: 3,
    e: 'CoR has two flavors: classic (one handler handles, then stops) and pipeline (each link processes and forwards — filters, middleware). doFilter() is the pipeline: forget to call it and the request never reaches the servlet.',
    w: { 0: 'No central hub.', 1: 'Not operations over a hierarchy.', 2: 'Not a traversal cursor.' },
    r: { id: 's5', label: 'Section 5 — disambiguation' } },
]

export default function RecapW8() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 2 · Week 8 · Behavioral Patterns II</div>
        <h1>Week 8 Recap:<br />Behavioral Patterns II</h1>
        <p>Days 36–40 in one place: Chain of Responsibility, Iterator, Mediator, Memento, Visitor — and with
           them, the full 23-pattern GoF catalog. Cheat-sheet, rapid review, recap quiz.</p>
        <div className="chips">
          {['Chain of Responsibility', 'Iterator', 'Mediator', 'Memento', 'Visitor'].map((c) => <span className="chip" key={c}>{c}</span>)}
        </div>
      </div>

      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  BEHAVIORAL PATTERNS II — completing the GoF catalog

  Chain of Responsibility  pass a request along handlers until handled  Day 36
  Iterator                 walk a collection without exposing internals Day 37
  Mediator                 colleagues talk THROUGH a hub (N² → N)       Day 38
  Memento                  snapshot & restore state, encapsulation-safe Day 39
  Visitor                  add OPERATIONS over a stable hierarchy        Day 40

  + Weeks 5–8 together = all 23 GoF patterns. The exam: tell Mediator from
  Observer, CoR classic from pipeline, and know Visitor's two-axis cost.`} />
        <Note><strong>Why this matters:</strong> these finish the pattern vocabulary. Chain powers logging
          (Day 49) and middleware; Iterator is in every for-each; Mediator is the controller in MVC; Memento +
          Command build undo; Visitor pairs with Composite for tree operations.</Note>
      </section>

      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 36 · Chain of Responsibility</h3>
        <ul>
          <li><strong>Intent:</strong> a request travels along a chain of handlers (each with a <C>next</C>); a handler handles it or passes it along.</li>
          <li><strong>Two flavors:</strong> classic (exactly one handles, then stops) and pipeline (every link processes and forwards — <C>FilterChain.doFilter</C>).</li>
          <li><strong>Decide the fall-off policy</strong> (nobody handles it). Exception handling is built-in CoR (the JVM walks catch handlers).</li>
          <li><strong>Trap:</strong> a handler that forgets to forward (deleted-link gap) silently drops the request.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 37 · Iterator</h3>
        <ul>
          <li><strong>Intent:</strong> traverse a collection without exposing its structure — a cursor (<C>hasNext</C>/<C>next</C>).</li>
          <li><strong>External</strong> (client drives the loop) vs <strong>internal</strong> (collection drives, e.g. <C>forEach</C>).</li>
          <li><strong>Fail-fast</strong> (modCount → CME on mid-loop modification) vs <strong>weakly-consistent</strong> (concurrent collections). Use the iterator\'s own <C>remove()</C>.</li>
          <li><strong>for-each desugars to an Iterator;</strong> a cursor is a protocol, not a box — it can even be infinite (a Fibonacci cursor).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 38 · Mediator</h3>
        <ul>
          <li><strong>Intent:</strong> centralize many-to-many interaction so colleagues talk through a hub, not to each other — N(N−1)/2 links → N.</li>
          <li><strong>Examples:</strong> a chat room (central censor/broadcast), a smart dialog form (field coordination).</li>
          <li><strong>vs Observer:</strong> Mediator coordinates colleagues it knows; Observer broadcasts to anonymous subscribers. <strong>vs Facade:</strong> Facade is one-way simplification, not coordination. An event-bus is a hybrid.</li>
          <li><strong>Traps:</strong> the god-mediator (absorbs all logic); notification cycles.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 39 · Memento</h3>
        <ul>
          <li><strong>Intent:</strong> capture and restore an object\'s state WITHOUT exposing its internals. Roles: Originator · Memento (opaque) · Caretaker (stores it).</li>
          <li><strong>Opacity:</strong> only the Originator reads/writes the memento (narrow interface / inner class); the Caretaker holds it blindly.</li>
          <li><strong>Marriage with Command</strong> for undo/redo (snapshot when the inverse is hard/impossible).</li>
          <li><strong>Deep-copy mutable state;</strong> traps: the memory bill (many snapshots) and version migration. Records add transparency; persistent data structures share structure.</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 40 · Visitor</h3>
        <ul>
          <li><strong>Intent:</strong> add new operations over a stable element hierarchy without editing the elements — operations live in visitors.</li>
          <li><strong>Double dispatch:</strong> <C>element.accept(visitor)</C> → <C>visitor.visit(this)</C> (Java overload resolution is static, so the accept() trampoline is required).</li>
          <li><strong>Expression Problem:</strong> adds OPERATIONS easily, adds element TYPES painfully (every visitor must change) — the reverse of a normal hierarchy.</li>
          <li><strong>Composite\'s soulmate;</strong> modern Java alternative: <C>sealed</C> types + pattern-matching <C>switch</C>. (Interpreter is a cousin.)</li>
        </ul>
      </section>

      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 The week in one table</h2>
        <table className="matrix">
          <thead><tr><th>pattern</th><th>intent</th><th>key gotcha</th></tr></thead>
          <tbody>
            <tr><td>Chain of Responsibility</td><td>route a request along handlers</td><td>forgetting to forward (deleted link)</td></tr>
            <tr><td>Iterator</td><td>traverse without exposing internals</td><td>fail-fast CME; use iterator.remove()</td></tr>
            <tr><td>Mediator</td><td>centralize N×N interaction</td><td>god-mediator; notification cycles</td></tr>
            <tr><td>Memento</td><td>snapshot/restore, encapsulation-safe</td><td>deep-copy + memory bill</td></tr>
            <tr><td>Visitor</td><td>add operations over a hierarchy</td><td>adding element types is painful</td></tr>
          </tbody>
        </table>
      </section>

      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks</h2>
        <ul>
          <li><strong>CoR:</strong> handle or forward — never silently drop.</li>
          <li><strong>Iterator:</strong> for-each IS an iterator; fail-fast throws CME.</li>
          <li><strong>Mediator:</strong> hub-and-spoke (N) beats mesh (N²); not Observer.</li>
          <li><strong>Memento:</strong> opaque snapshot only the Originator can read.</li>
          <li><strong>Visitor:</strong> operations easy, types hard; accept() = double dispatch.</li>
        </ul>
      </section>

      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps &amp; disambiguations</h2>
        <Warn><strong>CoR: the deleted-link gap.</strong> A handler that processes but forgets <C>next.handle()</C> silently swallows requests — no error.</Warn>
        <Warn><strong>Mutating a collection during for-each.</strong> Fail-fast throws CME; use <C>iterator.remove()</C> or a concurrent collection.</Warn>
        <Warn><strong>Mediator vs Observer.</strong> Coordinate-through-a-hub vs broadcast-to-subscribers. Don\'t let the mediator become a god object.</Warn>
        <Warn><strong>Memento leaking internals.</strong> The Caretaker must NOT read the state; keep the memento opaque. Watch the snapshot memory bill.</Warn>
        <Warn><strong>Visitor when types change often.</strong> Adding an element type forces edits to every visitor — wrong axis; use a normal hierarchy or sealed + pattern matching.</Warn>
        <Warn><strong>Skipping accept()/visit().</strong> Plain overloading resolves on static type — you need the double-dispatch trampoline.</Warn>
      </section>

      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Name the behavioral pattern before revealing:</p>
        <ReviewDrill items={DRILL} />
      </section>

      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across the week.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 8 revised?</strong> That completes <strong>Month 2 — the entire GoF pattern catalog</strong>.
        You now have the full vocabulary; Month 3 puts it to work on the classic LLD problems.
        <br /><br />
        ← <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 9 · Recap</strong> — the first classic problems.
      </div>
    </div>
  )
}
