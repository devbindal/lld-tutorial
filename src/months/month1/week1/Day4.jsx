import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: Overload resolution (compile-time) ============ */
const OVERLOADS = [
  { sig: 'print(int x)',           match: (a) => a === 'int' },
  { sig: 'print(double x)',        match: (a) => a === 'double' || a === 'int' },
  { sig: 'print(String x)',        match: (a) => a === 'String' },
  { sig: 'print(Object x)',        match: () => true },
]
const ARGS = [
  { label: 'print(42)',        type: 'int',    picked: 0,
    why: 'Exact match wins: 42 is an int, and print(int) exists. The compiler never even considers the others.' },
  { label: 'print(3.14)',      type: 'double', picked: 1,
    why: '3.14 is a double → print(double) is the exact match.' },
  { label: 'print("hi")',      type: 'String', picked: 2,
    why: '"hi" is a String → print(String) is the exact match. (String is also an Object, but the MORE SPECIFIC type wins.)' },
  { label: 'print(new Car())', type: 'Car',    picked: 3,
    why: 'There is no print(Car). A Car IS-A Object, so the compiler falls back to print(Object) — the only one that fits.' },
  { label: 'print((double) 42)', type: 'double', picked: 1,
    why: 'You forced the int to be a double with a cast, so the compiler now picks print(double). The choice depends only on the COMPILE-TIME type of the argument.' },
]

function OverloadDemo() {
  const [sel, setSel] = useState(null)
  const a = sel !== null ? ARGS[sel] : null
  return (
    <div className="panel">
      <div className="ptitle">Live demo · the compiler picks one overload — at compile time</div>
      <div className="class-card" style={{ marginBottom: 12 }}>
        <div className="cname">class Printer  (4 overloads of the same name)</div>
        {OVERLOADS.map((o, i) => (
          <div key={o.sig} style={{
            padding: '3px 6px', borderRadius: 6, transition: 'all .15s',
            background: a && a.picked === i ? '#2D5BFF' : 'transparent',
            color: a && a.picked === i ? '#fff' : 'inherit',
          }}>
            void {o.sig} {a && a.picked === i ? '  ← compiler chose THIS one' : ''}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 14.5, marginBottom: 10 }}>Click a call and watch which version lights up:</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {ARGS.map((arg, i) => (
          <button key={arg.label} className={sel === i ? 'act' : 'ghost act'} onClick={() => setSel(i)}
            style={{ fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
            {arg.label}
          </button>
        ))}
      </div>
      <div className="statbar">
        🧠 <span>{a ? a.why : 'No call selected yet. The decision is made by looking at the ARGUMENT TYPES — before the program ever runs.'}</span>
      </div>
    </div>
  )
}

/* ============ Interactive 2: Dynamic dispatch (runtime) ============ */
const SHAPES = {
  Dog:  { sound: '"Woof! 🐶"',  cls: 'Dog' },
  Cat:  { sound: '"Meow! 🐱"',  cls: 'Cat' },
  Duck: { sound: '"Quack! 🦆"', cls: 'Duck' },
}

function DispatchDemo() {
  const [actual, setActual] = useState('Dog')
  const [out, setOut] = useState([])

  function call() {
    const s = SHAPES[actual]
    setOut((o) => [
      `Animal a = new ${s.cls}();   a.makeSound()  →  ${s.sound}   (ran ${s.cls}'s version!)`,
      ...o,
    ].slice(0, 6))
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one reference type, three different behaviors</div>
      <p style={{ fontSize: 14.5, marginBottom: 10 }}>
        The reference is always <C>Animal a</C>. Choose what object actually sits in the heap, then call <C>a.makeSound()</C>:
      </p>
      <div className="modbtns" style={{ marginBottom: 12 }}>
        {Object.keys(SHAPES).map((k) => (
          <button key={k} className={actual === k ? 'on' : ''} onClick={() => setActual(k)}>new {k}()</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div className="obj" style={{ minWidth: 200, margin: 0 }}>
          <div className="oref">STACK · the reference</div>
          <div className="ofield">Animal a &nbsp;<span style={{ color: '#7c8aa5' }}>(declared type)</span></div>
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 20, color: '#7c8aa5' }}>──▶</div>
        <div className="obj" style={{ minWidth: 200, margin: 0, borderColor: 'var(--blue)' }}>
          <div className="oref">HEAP · the real object</div>
          <div className="ofield">{actual}@{actual === 'Dog' ? '4f2a' : actual === 'Cat' ? '9b1c' : '7e5d'} &nbsp;<b style={{ color: 'var(--blue)' }}>(actual type)</b></div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="act" onClick={call}>a.makeSound()</button>
        <button className="ghost act" onClick={() => setOut([])}>clear</button>
      </div>
      {out.length === 0 ? (
        <div className="empty">Call <b>a.makeSound()</b> with different objects behind the same reference. The OBJECT decides, not the reference.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {out.map((l, i) => (
            <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, padding: '7px 10px', borderRadius: 7, background: '#0f1b30', color: '#d7e2ff' }}>
              &gt; {l}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 3: Casting playground ============ */
function CastingDemo() {
  const [obj, setObj] = useState('Dog') // what's REALLY in the heap behind "Animal a"
  const [out, setOut] = useState([])

  function log(ok, text) { setOut((o) => [{ ok, text }, ...o].slice(0, 6)) }

  function upcast() {
    log(true, `Animal a = new ${obj}();  →  upcast: always safe, automatic, no cast syntax needed ✓`)
  }
  function downTo(target) {
    if (obj === target) {
      log(true, `${target} d = (${target}) a;  →  works ✓  the heap object really IS a ${target}`)
    } else {
      log(false, `${target} d = (${target}) a;  →  💥 ClassCastException! The heap object is a ${obj}, not a ${target}`)
    }
  }
  function guarded(target) {
    if (obj === target) {
      log(true, `if (a instanceof ${target} d) { d.${target === 'Dog' ? 'fetch' : 'purr'}(); }  →  true, cast happens safely ✓`)
    } else {
      log(true, `if (a instanceof ${target} d) { ... }  →  false, block skipped. No crash — the guard saved us 🛡️`)
    }
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · up is free, down is dangerous</div>
      <p style={{ fontSize: 14.5, marginBottom: 10 }}>
        First pick what really lives in the heap. Then try the casts — and see why <C>instanceof</C> exists.
      </p>
      <div className="modbtns" style={{ marginBottom: 12 }}>
        {['Dog', 'Cat'].map((k) => (
          <button key={k} className={obj === k ? 'on' : ''} onClick={() => { setObj(k) }}>heap holds: new {k}()</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="ghost act" onClick={upcast}>upcast → Animal a = obj</button>
        <button className="act" onClick={() => downTo('Dog')}>(Dog) a</button>
        <button className="act" onClick={() => downTo('Cat')}>(Cat) a</button>
        <button className="ghost act" onClick={() => guarded('Dog')}>instanceof Dog first</button>
        <button className="ghost act" onClick={() => guarded('Cat')}>instanceof Cat first</button>
        <button className="ghost act" onClick={() => setOut([])}>clear</button>
      </div>
      {out.length === 0 ? (
        <div className="empty">Set the heap to <b>new Dog()</b>, then try <b>(Cat) a</b> — watch it explode. Then try the <b>instanceof</b> version.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {out.map((e, i) => (
            <div key={i} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 13, padding: '7px 10px', borderRadius: 7,
              background: e.ok ? '#E8F6EE' : '#FDECEC', color: e.ok ? '#1d7a4d' : '#b23535',
              border: `1px solid ${e.ok ? '#bfe6cd' : '#f3c9c9'}`,
            }}>{e.ok ? '✅' : '💥'} {e.text}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'Polymorphism literally means…',
    o: ['many classes', 'many forms — one name, many behaviors', 'many objects', 'many constructors'], a: 1,
    e: 'Poly = many, morph = form. One method name (makeSound) takes many forms (Woof, Meow, Quack) depending on who answers.',
    w: { 0: 'You can have many classes with no polymorphism at all — the magic is one NAME, many behaviors.',
         2: 'Many objects of one class all behave identically — that\'s not it either.',
         3: 'Many constructors is overloading-of-constructors — a sliver of the idea, not its meaning.' },
    r: { id: 's1', label: 'Section 1 — what is polymorphism' } },
  { q: 'Overloading is resolved at ____ ; overriding is resolved at ____.',
    o: ['runtime / runtime', 'compile time / compile time', 'compile time / runtime', 'runtime / compile time'], a: 2,
    e: 'Overloading (same name, different parameters) is picked by the compiler from argument types. Overriding (same signature in a child) is picked at runtime from the actual object — dynamic dispatch.',
    w: { 0: 'Overload choice is baked into the bytecode before the program ever runs.',
         1: 'If overriding were compile-time, Animal a = new Dog() could never bark.',
         3: 'Exactly backwards — the most common way to misremember it. Compile/run, in that order.' },
    r: { id: 's2', label: 'Section 2 — overloading (compile-time)' } },
  { q: 'Animal a = new Dog(); a.makeSound(); — whose makeSound runs?',
    o: ['Animal’s, because the reference is Animal', 'Dog’s, because the heap object is a Dog', 'Both run', 'Compile error'], a: 1,
    e: 'Dynamic dispatch: the JVM looks at the ACTUAL object in the heap (a Dog) and runs its overridden version. The reference type only limits WHICH methods you may call, not WHOSE version runs.',
    w: { 0: 'The reference type is just the lens — the OBJECT behind it answers the call.',
         2: 'One call, one winner — unless Dog\'s version itself calls super.makeSound().',
         3: 'Perfectly legal — upcasting plus an inherited method is everyday Java.' },
    r: { id: 's4', label: 'Section 4 — dynamic dispatch' } },
  { q: 'Animal a = new Dog(); a.fetch(); — fetch() exists only in Dog. What happens?',
    o: ['Runs fine, the object is a Dog', 'Compile error — the Animal reference only “sees” Animal’s methods', 'Runtime exception', 'Runs Animal’s fetch'], a: 1,
    e: 'The compiler checks calls against the REFERENCE type. Animal has no fetch(), so it won’t compile — even though the heap object could do it. You’d need a (guarded) downcast.',
    w: { 0: 'The object COULD fetch — but the compiler only trusts the reference\'s menu, and Animal\'s menu has no fetch.',
         2: 'It never gets far enough to run — this dies at compile time.',
         3: 'Animal has no fetch at all — that\'s the entire problem.' },
    r: { id: 's3', label: 'Section 3 — upcasting' } },
  { q: 'What does the JVM use under the hood to find the right overridden method at runtime?',
    o: ['It scans all classes alphabetically', 'A virtual method table (vtable) attached to each class', 'The garbage collector', 'Reflection on every call'], a: 1,
    e: 'Each class has a vtable: an array of method pointers, where a child’s overrides replace the parent’s entries at the same slot. A call becomes “jump to slot N of the object’s class vtable” — fast and exact.',
    w: { 0: 'No searching happens — the slot index is precomputed; dispatch is one array jump.',
         2: 'The GC manages memory, not method calls.',
         3: 'Reflection is the slow, explicit API — normal dispatch never touches it.' },
    r: { id: 's5', label: 'Section 5 — vtables' } },
  { q: 'Dog d = (Dog) someAnimal; — when does this throw ClassCastException?',
    o: ['Always', 'Never — casts are compile-time only', 'At runtime, if the object behind someAnimal is not actually a Dog', 'Only if Dog is final'], a: 2,
    e: 'A downcast is a runtime gamble: you promise the compiler the object is a Dog. If the heap object is really a Cat, the JVM throws ClassCastException at that line.',
    w: { 0: 'If the object really IS a Dog, the cast succeeds silently.',
         1: 'The compiler trusts your promise but the JVM CHECKS it at runtime — that check is the exception.',
         3: 'final affects subclassing, not casting behavior.' },
    r: { id: 's6', label: 'Section 6 — downcasting & instanceof' } },
  { q: 'Which call CANNOT be polymorphic (no dynamic dispatch)?',
    o: ['A public overridden method', 'A static method', 'A protected overridden method', 'An interface method'], a: 1,
    e: 'static methods belong to the class, not the object, so they are bound at compile time by the reference type. A same-named static in a child HIDES the parent’s — it does not override it.',
    w: { 0: 'public overridden methods are the TEXTBOOK case of dispatch.',
         2: 'Visibility doesn\'t matter — protected overrides dispatch like public ones.',
         3: 'Interface methods are maximally polymorphic — any implementer can answer.' },
    r: { id: 's5', label: 'Section 5 — vtables (and what skips them)' } },
  { q: 'Why is "Animal a = new Dog()" (upcasting) so common in good LLD?',
    o: ['It saves memory', 'Code written against the general type works for every current and future subclass', 'It makes methods run faster', 'Java requires it'], a: 1,
    e: 'Program to the general type: a method taking Animal handles Dog, Cat, and any subclass written next year — without changing a line. This is the engine behind most design patterns (Strategy, Observer…).',
    w: { 0: 'The object is identical either way — only the lens changes.',
         2: 'Speed is unchanged; FLEXIBILITY is the prize.',
         3: 'Java permits either — good design, not the language, chooses the general type.' },
    r: { id: 's8', label: 'Section 8 — program to the general type' } },
]

/* ============ The page ============ */
export default function Day4() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 1 · Day 4</div>
        <h1>Polymorphism:<br />One Name, Many Forms</h1>
        <p>Yesterday you built family trees with <C>extends</C>. Today comes the payoff: you can hold a Dog, a Cat, and a Duck
           behind the <strong>same</strong> reference type, call the <strong>same</strong> method, and each object answers in its
           <strong> own</strong> way. This single idea powers almost every design pattern you will learn in Month 2. Click everything.</p>
        <div className="chips">
          {['polymorphism', 'overloading', 'overriding', 'dynamic dispatch', 'vtable', 'upcasting', 'downcasting', 'instanceof'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What is polymorphism?</h2>
        <p>Think about the word <strong>"play"</strong> said to different musicians. Tell a guitarist "play" — strumming. Tell a
          drummer "play" — drumming. Tell a pianist "play" — keys. <strong>One word, one command — but each performer does it in
          their own way.</strong> You, the conductor, don’t need a different word per musician.</p>
        <p><strong>Polymorphism</strong> (poly = many, morph = form) is exactly this in code: one method name, many behaviors,
          chosen by <em>who</em> receives the call. We will carry this <strong>conductor → musicians</strong> picture all day.</p>
        <p>Java gives you two flavors, and interviewers always ask the difference:</p>
        <ul>
          <li><strong>Compile-time polymorphism = overloading.</strong> Same method name, <em>different parameter lists</em>, in the
            same class. The <strong>compiler</strong> picks the version by looking at the argument types — before the program runs.</li>
          <li><strong>Runtime polymorphism = overriding.</strong> A child replaces a parent’s method (Day 3). The <strong>JVM</strong>
            picks the version by looking at the <em>actual object</em> in the heap — while the program runs. This is the famous one.</li>
        </ul>
        <Note><strong>One-line memory trick:</strong> Overloading → the <em>compiler</em> chooses, by <em>arguments</em>.
          Overriding → the <em>JVM</em> chooses, by <em>object</em>.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2 · Interactive</div>
        <h2>🧮 Play: overloading — the compiler’s choice</h2>
        <p>Below is a class with <strong>four methods named <C>print</C></strong>, differing only in parameter type. Click each call
          and watch which overload the compiler selects. Notice: the decision uses only the <strong>argument’s compile-time type</strong> —
          the program hasn’t even started running yet.</p>
        <OverloadDemo />
        <Good><strong>What you should notice:</strong> ① An exact type match always wins. ② When no exact match exists
          (<C>print(new Car())</C>), the compiler walks up the family tree and settles for <C>print(Object)</C>. ③ A cast
          (<C>(double) 42</C>) changes the compile-time type, so it changes the choice. The runtime object never mattered.</Good>
        <Code html={`<span class="kw">public class</span> Printer {
    <span class="kw">void</span> print(<span class="kw">int</span> x)    { System.out.println(<span class="str">"int: "</span> + x); }
    <span class="kw">void</span> print(<span class="kw">double</span> x) { System.out.println(<span class="str">"double: "</span> + x); }
    <span class="kw">void</span> print(String x)  { System.out.println(<span class="str">"text: "</span> + x); }
    <span class="kw">void</span> print(Object x)  { System.out.println(<span class="str">"some object"</span>); }
}
<span class="cm">// Rules for a valid overload: same name, DIFFERENT parameter list.</span>
<span class="cm">// Changing only the return type is NOT enough — that's a compile error.</span>`} />
        <Warn><strong>Trap:</strong> two methods that differ <em>only</em> in return type do not overload — the compiler rejects them.
          The parameter list (number, types, or order of parameters) must differ.</Warn>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Upcasting — one reference type for the whole family</h2>
        <p>Because a Dog <strong>is an</strong> Animal (Day 3), Java lets you point an <C>Animal</C> reference at a <C>Dog</C> object.
          That move is called <strong>upcasting</strong>, and it is automatic and always safe:</p>
        <Code html={`Animal a = <span class="kw">new</span> Dog();   <span class="cm">// ✅ upcast: a Dog IS-A Animal. No cast syntax needed.</span>

<span class="cm">// Why is this gold? You can treat a WHOLE MIXED FAMILY uniformly:</span>
Animal[] zoo = { <span class="kw">new</span> Dog(), <span class="kw">new</span> Cat(), <span class="kw">new</span> Duck() };
<span class="kw">for</span> (Animal x : zoo) {
    x.makeSound();   <span class="cm">// Woof! Meow! Quack! — each object answers its own way</span>
}`} />
        <p>There is one price. The reference type decides <strong>what you are allowed to call</strong>:</p>
        <Code html={`Animal a = <span class="kw">new</span> Dog();
a.makeSound();   <span class="cm">// ✅ Animal declares makeSound → allowed</span>
a.fetch();       <span class="cm">// ❌ COMPILE ERROR — Animal has no fetch(), even though the object is a Dog</span>`} />
        <Note><strong>Two jobs, two deciders:</strong> the <strong>reference type</strong> (compile time) decides <em>which methods you
          may call</em>. The <strong>object type</strong> (runtime) decides <em>whose version runs</em>. Keep these two sentences —
          they answer half of all polymorphism interview questions.</Note>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🎭 Play: dynamic dispatch — the object decides</h2>
        <p>Here the reference is <strong>always</strong> <C>Animal a</C>. You choose what object actually sits in the heap. Call
          <C> a.makeSound()</C> each time and watch: the <strong>same line of code</strong> produces different behavior, decided by the
          object — at runtime.</p>
        <DispatchDemo />
        <Good><strong>What you should notice:</strong> the call site never changes — <C>a.makeSound()</C> — yet Woof, Meow, and Quack
          all come out. The conductor said "play" once; each musician performed their own way. This is <strong>runtime polymorphism /
          dynamic dispatch</strong>, the property that makes frameworks and design patterns possible.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Under the hood: how the JVM picks — vtables</h2>
        <p>How does the JVM find Dog’s <C>makeSound</C> so fast? Each class carries a <strong>virtual method table (vtable)</strong> —
          simply an array of pointers to method code. A child <strong>copies the parent’s table</strong>, then <strong>replaces the
          slots it overrides</strong>:</p>
        <Code html={`        Animal's vtable                 Dog's vtable (copy, then patch)
   ┌──────┬────────────────────┐    ┌──────┬────────────────────┐
   │ slot │ points to          │    │ slot │ points to          │
   ├──────┼────────────────────┤    ├──────┼────────────────────┤
   │  0   │ Animal.toString()  │    │  0   │ Animal.toString()  │  ← inherited as-is
   │  1   │ Animal.eat()       │    │  1   │ Animal.eat()       │  ← inherited as-is
   │  2   │ Animal.makeSound() │    │  2   │ Dog.makeSound() ★  │  ← OVERRIDDEN: slot patched!
   └──────┴────────────────────┘    │  3   │ Dog.fetch()        │  ← new method, new slot
                                    └──────┴────────────────────┘

   a.makeSound()  compiles to:  "jump to slot 2 of the vtable of a's REAL class"
   → if a points to a Dog, slot 2 says Dog.makeSound(). Done. No searching.`} />
        <ol>
          <li>At <strong>compile time</strong>, the compiler confirms <C>Animal</C> has <C>makeSound</C> and notes its slot number (2).</li>
          <li>At <strong>runtime</strong>, the JVM follows the object’s hidden pointer to <em>its own class’s</em> vtable and jumps to slot 2.</li>
          <li>Because Dog patched slot 2, Dog’s version runs. Same slot, different table → different behavior. That’s the whole trick.</li>
        </ol>
        <Reveal summary={<>Why can’t <C>static</C>, <C>private</C>, and <C>final</C> methods be dispatched dynamically? Click to reveal.</>}>
          <p>They are not in the vtable game. <strong>static</strong> methods belong to the class — the compiler binds them by reference
            type (a same-named static in a child <em>hides</em>, never overrides). <strong>private</strong> methods are invisible to
            children, so there is nothing to override. <strong>final</strong> methods are locked by the parent on purpose — the JVM can
            even inline them for speed because no child can patch their slot.</p>
        </Reveal>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Downcasting and <code style={{ fontFamily: 'IBM Plex Mono' }}>instanceof</code> — going back down, carefully</h2>
        <p>Upcasting was free. The reverse — telling Java "trust me, this <C>Animal</C> reference actually points to a <C>Dog</C>" —
          is a <strong>downcast</strong>, and it is a runtime gamble:</p>
        <Code html={`Animal a = <span class="kw">new</span> Dog();
Dog d = (Dog) a;       <span class="cm">// ✅ works — the heap object really is a Dog</span>
d.fetch();             <span class="cm">// now Dog-only methods are reachable</span>

Animal b = <span class="kw">new</span> Cat();
Dog d2 = (Dog) b;      <span class="cm">// 💥 compiles fine… then ClassCastException at RUNTIME</span>`} />
        <p>The safety belt is <C>instanceof</C> — ask before you cast. Modern Java (16+) combines the test and the cast in one step,
          called <strong>pattern matching</strong>:</p>
        <Code html={`<span class="cm">// old style: test, then cast</span>
<span class="kw">if</span> (a <span class="kw">instanceof</span> Dog) {
    Dog d = (Dog) a;
    d.fetch();
}

<span class="cm">// modern style (Java 16+): test AND cast in one — use this</span>
<span class="kw">if</span> (a <span class="kw">instanceof</span> Dog d) {   <span class="cm">// if true, d is already a Dog reference</span>
    d.fetch();
}`} />
        <Warn><strong>Design smell:</strong> if your code is full of <C>instanceof</C> chains
          (<C>if dog… else if cat… else if duck…</C>), polymorphism is trying to tell you something — push that behavior <em>into</em>
          the classes as an overridden method and let dynamic dispatch do the branching for you. You’ll formalize this instinct with
          the Open/Closed Principle (Week 3) and the Strategy/State patterns (Month 2).</Warn>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>⛑️ Play: the casting playground</h2>
        <p>Choose what really lives in the heap, then try to cast it around. Try the crash on purpose: set the heap to
          <C> new Dog()</C> and press <C>(Cat) a</C>. Then repeat with the <C>instanceof</C> buttons and watch the guard absorb it.</p>
        <CastingDemo />
        <Good><strong>What you should notice:</strong> ① Upcasting never fails. ② A downcast succeeds only when the heap object truly
          is that type — otherwise <strong>ClassCastException</strong>. ③ The <C>instanceof</C> guard never crashes: when the type
          doesn’t match, the block is simply skipped. Ask first, cast second.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Why LLD lives on polymorphism — "program to the general type"</h2>
        <p>Here is the design superpower. Write your logic against the <strong>general</strong> type, and it automatically works for
          every subclass — including ones that don’t exist yet:</p>
        <Code html={`<span class="cm">// This method was written BEFORE anyone invented EmailNotifier or SmsNotifier.</span>
<span class="kw">public class</span> OrderService {
    <span class="kw">public void</span> placeOrder(Order order, Notifier notifier) {
        <span class="cm">// ...save the order...</span>
        notifier.notifyUser(order);   <span class="cm">// 🎭 whoever you pass in, THEIR version runs</span>
    }
}

<span class="cm">// Next month someone adds PushNotifier extends Notifier.</span>
<span class="cm">// OrderService needs ZERO changes. That is extensibility via polymorphism.</span>`} />
        <ul>
          <li>New behavior is added by <strong>adding a class</strong>, not by editing tested code.</li>
          <li>Tests get easier: pass a <C>FakeNotifier</C> in tests, a real one in production — same code path.</li>
          <li>Almost every GoF pattern (Strategy, Observer, State, Template Method… Month 2) is "polymorphism + a naming convention."</li>
        </ul>
        <Note><strong>Looking ahead:</strong> Day 5 (Abstraction) sharpens this — you’ll make the general type an <C>abstract class</C>
          or <C>interface</C> so nobody can accidentally instantiate the vague concept itself.</Note>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Thinking the reference decides whose method runs</h3>
        <Code html={`Animal a = <span class="kw">new</span> Dog();
a.makeSound();   <span class="cm">// runs DOG's version, not Animal's. The object decides, always.</span>`} />
        <h3>Trap 2 — Fields are NOT polymorphic</h3>
        <Code html={`<span class="kw">class</span> Animal { String label = <span class="str">"animal"</span>; }
<span class="kw">class</span> Dog <span class="kw">extends</span> Animal { String label = <span class="str">"dog"</span>; }

Animal a = <span class="kw">new</span> Dog();
System.out.println(a.label);   <span class="cm">// "animal"! Fields are bound by REFERENCE type, only methods dispatch.</span>`} />
        <p>One more reason to keep fields private and access them through methods (Day 2).</p>
        <h3>Trap 3 — static methods don’t override, they hide</h3>
        <p>A same-named <C>static</C> method in a child is a different method that <em>hides</em> the parent’s. Which one runs depends
          on the reference type. Avoid the confusion: call statics via the class name (<C>Animal.info()</C>), never via a variable.</p>
        <h3>Trap 4 — Overloading + autoboxing surprises</h3>
        <Code html={`<span class="kw">void</span> f(<span class="kw">long</span> x)    { ... }
<span class="kw">void</span> f(Integer x)  { ... }
f(<span class="num">5</span>);   <span class="cm">// calls f(long)! Widening (int→long) beats autoboxing (int→Integer).</span>`} />
        <p>Order of preference: exact match → widening → autoboxing → varargs. Don’t design APIs that force users to know this.</p>
        <h3>Trap 5 — Blind downcasts</h3>
        <p>Every unguarded <C>(Dog) a</C> is a future <C>ClassCastException</C> with someone else’s name on the stack trace. Guard with
          <C> instanceof</C> — or better, redesign so you don’t need the cast at all (Trap-free code rarely downcasts).</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Polymorphism</strong> = one name, many forms. <strong>Overloading</strong> = compile-time (compiler picks by argument types). <strong>Overriding</strong> = runtime (JVM picks by actual object).</li>
          <li>Valid overloads differ in the <strong>parameter list</strong>; return type alone is not enough.</li>
          <li><strong>Reference type</strong> decides what you <em>may call</em> (compile time). <strong>Object type</strong> decides <em>whose version runs</em> (runtime).</li>
          <li><strong>Upcast</strong> (child → parent ref) is automatic and safe. <strong>Downcast</strong> (parent ref → child) needs <C>(Type)</C> and can throw <strong>ClassCastException</strong> — guard with <C>instanceof</C> (pattern matching: <C>if (a instanceof Dog d)</C>).</li>
          <li><strong>vtable:</strong> each class has a table of method pointers; children patch the slots they override. A call = jump to slot N of the real object’s table.</li>
          <li>No dynamic dispatch for <strong>static</strong> (hides, not overrides), <strong>private</strong>, or <strong>final</strong> methods. <strong>Fields never dispatch</strong> — bound by reference type.</li>
          <li>Overload resolution order: exact → widening → autoboxing → varargs.</li>
          <li>Design habit: <strong>program to the general type</strong>; add behavior by adding classes. <C>instanceof</C> chains are a smell — let dispatch do the branching.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary={<>Q: <C>f(1)</C> with overloads <C>f(long)</C>, <C>f(Integer)</C>, <C>f(int...)</C> — which wins?</>}>
          <p><C>f(long)</C>. Overload resolution order: ① exact match → ② <strong>widening</strong> (int→long) →
            ③ <strong>boxing</strong> (int→Integer) → ④ <strong>varargs</strong>, always last. Widening beats
            boxing beats varargs — the single most asked overloading puzzle.</p>
        </Reveal>
        <Reveal summary={<>Q: <C>Parent p = new Child();</C> — p.field vs p.method(): which Child version runs?</>}>
          <p>Only the METHOD. <strong>Fields are not polymorphic</strong> — field access resolves by the
            REFERENCE type at compile time (you get Parent's field, "shadowed", not overridden), while instance
            methods dispatch by the OBJECT's type at runtime. Same-named fields in parent and child = two
            separate fields existing simultaneously.</p>
        </Reveal>
        <Reveal summary="Q: Which methods do NOT use dynamic dispatch?">
          <p><C>static</C> (resolved by reference type — hidden, not overridden), <C>private</C> (invisible to
            children), <C>final</C> (can't be overridden, so the JIT may inline them), and constructors. Memory
            hook: <em>static, private, final — compile-time bound.</em></p>
        </Reveal>
        <Reveal summary="Q: Can the return type or exceptions change in an override?">
          <p>Return type: yes, but only <strong>covariantly</strong> — a SUBTYPE of the parent's return
            (Shape → Circle). Checked exceptions: only FEWER or NARROWER, never new/broader ones. Both rules are
            the compiler enforcing "deliver more, surprise less" — LSP (Day 13) baked into the language.</p>
        </Reveal>
        <Reveal summary="Q: Can you override a method and make it synchronized / change parameter names?">
          <p>Parameter NAMES are irrelevant (only types matter for the signature). <C>synchronized</C> is an
            implementation detail, not part of the contract — an override may add or drop it. But change a
            parameter TYPE and you've silently created an OVERLOAD, not an override — the #1 reason to always
            write <C>@Override</C>.</p>
        </Reveal>
        <Reveal summary="Q: Overloading is resolved at ____ time; overriding at ____ time?">
          <p>Overloading: <strong>compile</strong> time (static binding, by reference/argument types).
            Overriding: <strong>run</strong> time (dynamic dispatch via the vtable, by the object's actual
            class). If you can fill those two blanks with confidence and an example, this question is free
            marks.</p>
        </Reveal>
        <Reveal summary="Q: What's the modern instanceof (Java 16+) that interviewers like to see?">
          <p><strong>Pattern matching:</strong> <C>if (shape instanceof Circle c) {'{'} c.radius(); {'}'}</C> —
            test + cast + scoped variable in one step, no separate <C>(Circle)</C> cast line. (And remember:
            needing instanceof chains at all is often an LSP/polymorphism smell — Day 13.)</p>
        </Reveal>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 4 complete?</strong> Homework before Day 5: build a <C>Shape</C> parent with <C>area()</C> and
        <C> describe()</C>, plus children <C>Circle</C>, <C>Rectangle</C>, and <C>Triangle</C> that each <strong>override</strong> both.
        In <C>main</C>, fill a single <C>Shape[]</C> with all three, loop once calling <C>describe()</C> — and prove that no
        <C> instanceof</C> is needed anywhere. Then add an <strong>overloaded</strong> <C>scale(int factor)</C> / <C>scale(double factor)</C>
        pair to <C>Shape</C> and predict which overload <C>scale(2)</C> picks before running it.
        <br /><br />
        Next: <strong>Day 5 — Abstraction</strong>: abstract classes vs interfaces, when to use which, default &amp; static methods in interfaces, multiple inheritance of type.
      </div>
    </div>
  )
}
