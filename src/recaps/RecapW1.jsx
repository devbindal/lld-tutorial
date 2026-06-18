import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../components/ui.jsx'

/* ===== Reusable rapid-review widget (reused across recaps) ===== */
function ReviewDrill({ items }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= items.length
  const cur = items[idx]
  function pick(i) {
    if (picked !== null) return
    setPicked(i)
    if (i === cur.a) setScore((s) => s + 1)
  }
  return (
    <div className="panel">
      <div className="ptitle">Rapid review · recall the concept before you read the answer</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎯 Score: <b>{score} / {items.length}</b>. Anything you missed → reopen that day. Re-run until it\'s automatic.</p>
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
  { q: 'Car a = new Car("red"); Car b = new Car("red"); — what does a == b give?', o: ['true', 'false', 'compile error'], a: 1,
    why: '== compares REFERENCES. a and b are two separate heap objects, so == is false. Use a.equals(b) for content equality (and override equals + hashCode to make it meaningful).' },
  { q: 'You add a parameterized constructor and nothing else. Does new Car() still compile?', o: ['Yes', 'No — the default no-arg constructor is gone'], a: 1,
    why: 'The compiler only auto-generates the no-arg default constructor when you define NONE. Add any constructor and you must declare the no-arg one yourself if you still need it.' },
  { q: 'A field is declared private. Who can read it directly?', o: ['Anyone', 'Only code in the same class', 'The same package', 'Subclasses'], a: 1,
    why: 'private = the declaring class only. default(package) = same package; protected = package + subclasses; public = everyone. Encapsulation defaults to the narrowest that works.' },
  { q: 'Overloading vs overriding — which is resolved at RUNTIME?', o: ['Overloading', 'Overriding', 'Both', 'Neither'], a: 1,
    why: 'Overriding (same signature, subclass redefines) = runtime dynamic dispatch via the vtable. Overloading (same name, different params) is picked at COMPILE time by the argument types.' },
  { q: 'You want a type that gives a class a capability AND lets it have several such capabilities. Use…', o: ['An abstract class', 'An interface'], a: 1,
    why: 'A class extends ONE class but implements MANY interfaces. Interfaces model capabilities ("-able"); abstract classes model a shared base WITH state and common code (single inheritance).' },
  { q: 'A class stores a Date field. Its getter returns the field directly. The risk?', o: ['None', 'A caller can mutate your internal Date (aliasing) and break your invariants'], a: 1,
    why: 'Date is mutable. Returning the reference lets callers change your internals behind your back. Defensive copy on the way out (return new Date(field.getTime())) — or use an immutable type.' },
]

const QUESTIONS = [
  { q: 'The single best one-line summary of Week 1\'s arc?',
    o: ['Always use inheritance', 'Define a class (state + behavior), HIDE its state behind methods (encapsulation), then REUSE/EXTEND via inheritance, vary behavior via polymorphism, and program to ABSTRACTIONS', 'Make everything public for convenience', 'Objects are the same as classes'], a: 1,
    e: 'Week 1 is the OOP pipeline: class → encapsulate → inherit → polymorph → abstract. Each builds on the last; the end goal is depending on abstractions, not concrete classes.',
    w: { 0: 'Inheritance is one tool, often beaten by composition (Day 7) — not an "always".',
         2: 'Public fields destroy encapsulation and invariants (Day 2).',
         3: 'A class is the blueprint; an object is the built instance (Day 1).' },
    r: { id: 's1', label: 'Section 1 — the week in one picture' } },
  { q: 'On the heap vs the stack:',
    o: ['Objects live on the stack', 'Objects live on the HEAP; the variable holds a reference on the stack; unreachable heap objects are reclaimed by GC', 'Everything is on the stack', 'References live on the heap'], a: 1,
    e: 'new allocates the object on the heap; the local variable on the stack holds a reference to it. When no reference points to an object, the garbage collector can reclaim it.',
    w: { 0: 'Locals and references are on the stack; the objects themselves are on the heap.',
         2: 'Primitive locals are on the stack, but objects are not.',
         3: 'References are stack slots (for locals); the objects they point to are on the heap.' },
    r: { id: 's2', label: 'Section 2 — Day 1' } },
  { q: 'A setter that just assigns the field (no checks) misses the main point of encapsulation, which is…',
    o: ['Shorter code', 'VALIDATION and invariants — a setter should reject invalid state (e.g. negative age), and immutable fields need no setter at all', 'Making fields public', 'Faster access'], a: 1,
    e: 'Encapsulation exists so an object can guarantee its own validity. Setters validate; better still, make fields final and set them once in the constructor (immutability) so they can never go invalid.',
    w: { 0: 'A pass-through setter is barely better than a public field.',
         2: 'Public fields are the opposite of encapsulation.',
         3: 'Access speed is irrelevant — correctness/invariants are the point.' },
    r: { id: 's2', label: 'Section 2 — Day 2' } },
  { q: 'In a subclass constructor, what happens before the subclass body runs?',
    o: ['Nothing special', 'The parent constructor runs first (constructor chaining UP) — explicitly via super(...) or implicitly via super()', 'The subclass fields are set first', 'Object\'s equals() is called'], a: 1,
    e: 'Construction chains up the hierarchy: the parent must be fully built before the child. super(...) must be the first statement; if omitted, an implicit super() is inserted.',
    w: { 0: 'There IS a defined order — parent first, always.',
         2: 'Parent construction precedes the child\'s own field init/body.',
         3: 'equals() is unrelated to construction.' },
    r: { id: 's2', label: 'Section 2 — Day 3' } },
  { q: 'Animal a = new Dog(); a.speak(); — Dog overrides speak(). Which runs, and why?',
    o: ['Animal.speak() — a is an Animal reference', 'Dog.speak() — dynamic dispatch picks the method of the ACTUAL object type at runtime (the vtable)', 'Compile error', 'Both run'], a: 1,
    e: 'The reference type (Animal) decides what you can CALL; the actual object type (Dog) decides which OVERRIDE runs. Runtime dynamic dispatch via the vtable is the heart of polymorphism.',
    w: { 0: 'The reference type gates the API, but the override is chosen by the real type.',
         2: 'It compiles fine — speak() exists on Animal.',
         3: 'Exactly one method runs — Dog\'s override.' },
    r: { id: 's2', label: 'Section 2 — Day 4' } },
  { q: 'Downcasting (Animal → Dog) is safe only when…',
    o: ['Always', 'The object is actually a Dog — guard with instanceof, or risk a ClassCastException', 'Never', 'The reference is final'], a: 1,
    e: 'Upcasting (Dog → Animal) is implicit and always safe. Downcasting asserts a more specific type and throws ClassCastException if wrong — check with instanceof (or pattern-matching instanceof) first.',
    w: { 0: 'Blind downcasts crash when the object isn\'t that subtype.',
         2: 'It\'s safe when guarded — not never.',
         3: 'final affects reassignment, not cast safety.' },
    r: { id: 's2', label: 'Section 2 — Day 4' } },
  { q: 'Interface vs abstract class — the cleanest decision rule?',
    o: ['They\'re interchangeable', 'Interface = a capability many unrelated types can have (implement many); abstract class = a shared base WITH state and common code (extend one). Need shared fields/implementation → abstract class; need a contract / multiple types → interface', 'Always use abstract classes', 'Always use interfaces'], a: 1,
    e: 'A class implements many interfaces but extends one class. Interfaces (with default/static methods since Java 8) give multiple inheritance of TYPE; abstract classes give shared state + code via single inheritance.',
    w: { 0: 'They overlap but differ in state, multiplicity, and intent.',
         2: 'Abstract-only blocks multiple-capability modeling.',
         3: 'Interface-only can\'t hold shared mutable state.' },
    r: { id: 's2', label: 'Section 2 — Day 5' } },
  { q: 'You override equals() but not hashCode(). What breaks?',
    o: ['Nothing', 'Hash-based collections (HashMap/HashSet) misbehave — equal objects can land in different buckets, so lookups/dedup fail; equals and hashCode must be consistent', 'The code won\'t compile', 'toString() breaks'], a: 1,
    e: 'The contract: equal objects MUST have equal hash codes. Override one without the other and a HashSet may store "duplicates" or a HashMap may not find a key. Always override them together.',
    w: { 0: 'It silently corrupts hash-based collection behavior.',
         2: 'It compiles — the bug is at runtime.',
         3: 'toString is independent of the equals/hashCode contract.' },
    r: { id: 's5', label: 'Section 5 — traps' } },
]

export default function RecapW1() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Revision · Month 1 · Week 1 · Core OOP</div>
        <h1>Week 1 Recap:<br />The OOP Foundation</h1>
        <p>Everything from Days 1–5 in one place: the core ideas, the key rules, the gotchas, a memory hook for
           each concept, a rapid-review widget, and a recap quiz. Read it to revise; take the quiz to check.
           Anything that doesn\'t stick → reopen that day.</p>
        <div className="chips">
          {['classes & objects', 'encapsulation', 'inheritance', 'polymorphism', 'abstraction'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The week in one picture</h2>
        <Code html={`  THE OOP PIPELINE (each step builds on the last)

  ① CLASS        a blueprint: state (fields) + behavior (methods)        Day 1
        │         new → an OBJECT on the heap; a reference on the stack
        ▼
  ② ENCAPSULATE  hide the state (private) behind methods that VALIDATE   Day 2
        │         immutability + defensive copying protect invariants
        ▼
  ③ INHERIT      is-a reuse: extends, override, super, chain up          Day 3
        │         (but prefer composition for deep/fragile hierarchies)
        ▼
  ④ POLYMORPH    one reference type, many runtime behaviors              Day 4
        │         overriding = runtime dispatch (vtable); overloading = compile-time
        ▼
  ⑤ ABSTRACT     program to a CONTRACT, not a concrete class             Day 5
                 interface (capability, many) vs abstract class (base + state, one)`} />
        <Note><strong>The whole point:</strong> by Day 5 you depend on <em>abstractions</em>, not concrete
          classes — which is exactly what makes the SOLID principles (Week 3) and design patterns (Month 2)
          possible. Week 1 is the grammar; everything after is the literature.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Day-by-day cheat sheet</h2>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 1 · Classes &amp; Objects</h3>
        <ul>
          <li><strong>Class = blueprint, object = building.</strong> <C>new</C> builds an object on the <strong>heap</strong>; the variable holds a <strong>reference</strong> on the stack.</li>
          <li><strong>Constructors:</strong> default (auto only if you define none) · parameterized · overloaded (differ by signature) · copy (<C>new Car(other)</C>) · chaining with <C>this(...)</C>.</li>
          <li><strong><C>this</C></strong> = the current object; disambiguates field vs parameter (<C>this.color = color</C>).</li>
          <li><strong>Access:</strong> <C>private</C> (class) ⊂ default (package) ⊂ <C>protected</C> (package + subclasses) ⊂ <C>public</C> (all). Use the narrowest that works.</li>
          <li><strong>static vs instance:</strong> static belongs to the class (one copy, shared); instance is per-object.</li>
          <li><strong>Memory:</strong> stack (locals/refs) vs heap (objects); GC reclaims unreachable objects.</li>
          <li><strong><C>==</C> vs <C>.equals()</C>:</strong> <C>==</C> compares references (identity); <C>.equals()</C> compares content (when overridden).</li>
        </ul>
        <Code html={`Car a = <span class="kw">new</span> Car(<span class="str">"red"</span>);
Car b = <span class="kw">new</span> Car(<span class="str">"red"</span>);
a == b          <span class="cm">// false — two different heap objects (reference identity)</span>
a.equals(b)     <span class="cm">// true ONLY if Car overrides equals() to compare color</span>`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 2 · Encapsulation</h3>
        <ul>
          <li><strong>Hide fields (<C>private</C>), expose intent via methods.</strong> Getters/setters exist so the object controls its own state.</li>
          <li><strong>Setters validate</strong> — reject invalid state (negative age, empty name) so the object is never in a bad state.</li>
          <li><strong>Immutability:</strong> <C>final</C> fields, no setters, set once in the constructor → can never go invalid, thread-safe by default.</li>
          <li><strong>Defensive copying:</strong> copy mutable inputs IN (constructor) and OUT (getters) so callers can\'t mutate your internals via a shared reference (aliasing).</li>
          <li><strong>Public fields are bad:</strong> no validation, no invariants, and you can never change the representation later.</li>
        </ul>
        <Code html={`<span class="kw">public</span> Date getStart() {
    <span class="kw">return new</span> Date(start.getTime());   <span class="cm">// defensive copy OUT — caller can't mutate our field</span>
}`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 3 · Inheritance</h3>
        <ul>
          <li><strong>is-a:</strong> <C>class Dog extends Animal</C> — a Dog IS an Animal.</li>
          <li><strong>Overriding:</strong> subclass redefines a method (same signature); mark <C>@Override</C>.</li>
          <li><strong><C>super</C>:</strong> reach the parent\'s methods/fields; <C>super(...)</C> calls the parent constructor and must be the first line.</li>
          <li><strong>Constructor chaining UP:</strong> the parent is fully constructed before the child\'s body runs.</li>
          <li><strong>Every class extends <C>Object</C></strong> (toString/equals/hashCode/getClass).</li>
          <li><strong>Deep hierarchies are fragile</strong> (fragile base class) — prefer composition (Week 2, Day 7).</li>
        </ul>

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 4 · Polymorphism</h3>
        <ul>
          <li><strong>Compile-time = overloading</strong> (same name, different params; chosen by the compiler from argument types).</li>
          <li><strong>Runtime = overriding = dynamic dispatch</strong> (the ACTUAL object\'s method runs, via the vtable).</li>
          <li><strong>Reference type</strong> decides what you can CALL; <strong>object type</strong> decides which override RUNS.</li>
          <li><strong>Upcasting</strong> (Dog → Animal): implicit, always safe. <strong>Downcasting</strong> (Animal → Dog): explicit, guard with <C>instanceof</C> or risk <C>ClassCastException</C>.</li>
        </ul>
        <Code html={`Animal a = <span class="kw">new</span> Dog();
a.speak();                 <span class="cm">// runs Dog.speak() — runtime dispatch, not Animal.speak()</span>
<span class="kw">if</span> (a <span class="kw">instanceof</span> Dog d) d.fetch();   <span class="cm">// guarded downcast (pattern instanceof)</span>`} />

        <h3 style={{ fontFamily: 'Space Grotesk', marginTop: 18 }}>Day 5 · Abstraction</h3>
        <ul>
          <li><strong>Abstract class:</strong> can\'t be instantiated; mixes abstract methods (no body) with concrete methods + state; <strong>single</strong> inheritance.</li>
          <li><strong>Interface:</strong> a contract; methods abstract by default; since Java 8 also <C>default</C> + <C>static</C> methods; a class implements <strong>many</strong>.</li>
          <li><strong>Choose:</strong> shared state + common code → abstract class; a capability many unrelated types can have → interface ("-able").</li>
          <li><strong>default methods</strong> let you add to an interface without breaking implementors; <strong>multiple inheritance of TYPE</strong> comes from interfaces (not state).</li>
        </ul>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>📋 The week in one table</h2>
        <table className="matrix">
          <thead><tr><th>concept</th><th>the one thing to remember</th></tr></thead>
          <tbody>
            <tr><td>class vs object</td><td>blueprint vs built instance (on the heap)</td></tr>
            <tr><td>constructor</td><td>default vanishes once you write any; chain with this()/super()</td></tr>
            <tr><td>access modifiers</td><td>private ⊂ package ⊂ protected ⊂ public — pick the narrowest</td></tr>
            <tr><td>static vs instance</td><td>shared by the class vs one per object</td></tr>
            <tr><td>== vs equals</td><td>identity vs content (override equals + hashCode together)</td></tr>
            <tr><td>encapsulation</td><td>private fields + validating methods; immutability where possible</td></tr>
            <tr><td>defensive copy</td><td>copy mutable data in and out to stop aliasing</td></tr>
            <tr><td>inheritance</td><td>is-a; override + super; parent constructs first; don\'t go deep</td></tr>
            <tr><td>polymorphism</td><td>overriding = runtime dispatch; overloading = compile-time</td></tr>
            <tr><td>up/downcast</td><td>up is free &amp; safe; down needs instanceof</td></tr>
            <tr><td>interface vs abstract</td><td>capability (many) vs shared base + state (one)</td></tr>
          </tbody>
        </table>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>🧠 Memory hooks (60-second skim)</h2>
        <ul>
          <li><strong>Blueprint → building.</strong> Class is the plan; <C>new</C> builds it on the heap.</li>
          <li><strong>Write one constructor, lose the free one.</strong></li>
          <li><strong>Narrowest access that works.</strong></li>
          <li><strong>== is "same object", equals is "same value".</strong></li>
          <li><strong>Encapsulate = hide + validate.</strong> A good object can\'t be put in a bad state.</li>
          <li><strong>Mutable in, mutable out → copy it.</strong></li>
          <li><strong>Parent builds before child.</strong></li>
          <li><strong>Reference type = what you can call; object type = what actually runs.</strong></li>
          <li><strong>Up free, down guarded.</strong></li>
          <li><strong>Interface = -able (many); abstract class = base + state (one).</strong></li>
        </ul>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>🕳 Traps to never repeat</h2>
        <Warn><strong>Comparing objects with <C>==</C>.</strong> It tests reference identity, not value — use <C>.equals()</C> (and override it).</Warn>
        <Warn><strong>Overriding <C>equals()</C> but not <C>hashCode()</C>.</strong> Breaks HashMap/HashSet — equal objects must have equal hash codes. Always do both.</Warn>
        <Warn><strong>Public (or pass-through-setter) fields.</strong> No validation, no invariants. Encapsulate and validate.</Warn>
        <Warn><strong>Leaking a mutable field via its getter.</strong> Callers mutate your internals through the shared reference. Defensive-copy or use immutable types.</Warn>
        <Warn><strong>Assuming the no-arg constructor still exists</strong> after you added a parameterized one. Declare it explicitly if you need it.</Warn>
        <Warn><strong>Blind downcasts.</strong> <C>(Dog) animal</C> without an <C>instanceof</C> check throws <C>ClassCastException</C>.</Warn>
        <Warn><strong>Deep inheritance for code reuse.</strong> Fragile base class — favor composition (you\'ll prove this on Day 7).</Warn>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🔁 Rapid review</h2>
        <p>Predict each answer before revealing — this is the fastest way to find what didn\'t stick:</p>
        <ReviewDrill items={DRILL} />
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Test yourself</div>
        <h2>🧠 Recap quiz — 8 questions</h2>
        <p>Integrative questions across the whole week. Green twice across two sittings = Week 1 is yours.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Week 1 revised?</strong> If the quiz felt solid, you\'ve got the OOP grammar the whole course
        builds on. If any section felt shaky, reopen that day before moving on — Weeks 2–4 (relationships, SOLID,
        and beyond) assume all of this is automatic.
        <br /><br />
        ← Back to the <a className="homelink" href="#/revise" style={{ display: 'inline' }}>Revision Hub</a> ·
        Next: <strong>Week 2 · Recap</strong> — relationships, UML, and requirements → entities.
      </div>
    </div>
  )
}
