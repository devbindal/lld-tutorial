import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../components/ui.jsx'

/* ============ Interactive 1: What gets inherited ============ */
const MEMBERS = [
  { sig: 'String name',        from: 'Animal', vis: 'protected', inherited: true,
    why: 'A protected field of the parent IS inherited — Dog can use "name" directly as if it were its own.' },
  { sig: 'int age',            from: 'Animal', vis: 'protected', inherited: true,
    why: 'Inherited. Every Dog automatically has an age field, even though Dog never declared it.' },
  { sig: 'void eat()',         from: 'Animal', vis: 'public',    inherited: true,
    why: 'Public behavior is inherited. A Dog can eat() with zero extra code — the method came from Animal.' },
  { sig: 'void breathe()',     from: 'Animal', vis: 'public',    inherited: true,
    why: 'Also inherited. Shared behavior lives once in the parent and every child gets it for free.' },
  { sig: 'long heartId',       from: 'Animal', vis: 'private',   inherited: false,
    why: 'PRIVATE members are NOT accessible in the child. The field still exists inside the object, but Dog code cannot touch it directly — only Animal’s own methods can.' },
  { sig: 'Animal(String n)',   from: 'Animal', vis: 'constructor', inherited: false,
    why: 'Constructors are NOT inherited. Dog must declare its own constructors — but it can CALL the parent’s with super(...).' },
  { sig: 'void fetch()',       from: 'Dog',    vis: 'public',    inherited: false,
    why: 'Defined in Dog itself — this is Dog’s own new behavior that Animal does not have.' },
]

function InheritanceTree() {
  const [sel, setSel] = useState(2)
  const m = MEMBERS[sel]
  return (
    <div className="panel">
      <div className="ptitle">Live demo · click a member to see where it comes from</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        <div className="class-card" style={{ flex: 1, minWidth: 230 }}>
          <div className="cname">class Animal  (parent)</div>
          protected String name;<br />
          protected int age;<br />
          private long heartId;<br /><br />
          public void eat()<br />
          public void breathe()
        </div>
        <div style={{ alignSelf: 'center', fontFamily: 'IBM Plex Mono', fontSize: 22, color: '#7c8aa5' }}>▲<br />extends</div>
        <div className="class-card" style={{ flex: 1, minWidth: 230 }}>
          <div className="cname">class Dog extends Animal  (child)</div>
          <span style={{ color: '#7c8aa5' }}>// inherits name, age, eat, breathe</span><br /><br />
          public void fetch()
        </div>
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>
        WHAT A Dog OBJECT CAN USE (click any chip)
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {MEMBERS.map((mm, i) => (
          <button key={i} className={`modbtn-chip ${i === sel ? 'on' : ''}`} onClick={() => setSel(i)}
            style={{
              fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '7px 11px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid var(--line)',
              background: i === sel ? 'var(--ink)' : (mm.inherited ? '#EAF0FF' : '#F4F2EA'),
              color: i === sel ? '#fff' : (mm.inherited ? '#2D5BFF' : '#7c5b2e'),
            }}>
            {mm.inherited ? '↳ ' : ''}{mm.sig}
          </button>
        ))}
      </div>
      <div className="statbar" style={{ background: m.inherited ? '#EAF0FF' : '#FDF4E7' }}>
        <span>
          <b>{m.sig}</b> &nbsp;·&nbsp; from <b>{m.from}</b> &nbsp;·&nbsp; {m.vis} &nbsp;·&nbsp;{' '}
          <b style={{ color: m.inherited ? '#2D5BFF' : '#b23535' }}>{m.inherited ? 'INHERITED ✓' : 'NOT inherited ✕'}</b>
          <br />{m.why}
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 2: Overriding + super ============ */
function OverrideDemo() {
  const [useSuper, setUseSuper] = useState(false)
  const [out, setOut] = useState([])

  function speak(kind) {
    let line
    if (kind === 'Animal') line = 'Animal.makeSound() → "...(some generic sound)"'
    else if (kind === 'Dog') line = useSuper
      ? 'Dog.makeSound() → super first: "...(some generic sound)"  then  "Woof! 🐶"'
      : 'Dog.makeSound() → "Woof! 🐶"  (parent version fully replaced)'
    else line = useSuper
      ? 'Cat.makeSound() → super first: "...(some generic sound)"  then  "Meow! 🐱"'
      : 'Cat.makeSound() → "Meow! 🐱"  (parent version fully replaced)'
    setOut((o) => [line, ...o].slice(0, 6))
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · same method name, different bodies</div>
      <div className="modbtns" style={{ marginBottom: 12 }}>
        <button className={!useSuper ? 'on' : ''} onClick={() => setUseSuper(false)}>override only</button>
        <button className={useSuper ? 'on' : ''} onClick={() => setUseSuper(true)}>call super.makeSound() first</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act ghost" onClick={() => speak('Animal')}>animal.makeSound()</button>
        <button className="act" onClick={() => speak('Dog')}>dog.makeSound()</button>
        <button className="act" onClick={() => speak('Cat')}>cat.makeSound()</button>
        <button className="ghost act" onClick={() => setOut([])}>clear</button>
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>CONSOLE OUTPUT</div>
      {out.length === 0 ? (
        <div className="empty">Press a <b>makeSound()</b> button. Notice Dog and Cat run their OWN version, not Animal’s.</div>
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

/* ============ Interactive 3: Constructor chaining up the hierarchy ============ */
const CHAIN = [
  { active: 'Dog',    note: 'new Dog("Rex") is called. Java enters Dog’s constructor. Its hidden first line is super(...).', phase: 'down' },
  { active: 'Animal', note: 'super(...) jumps UP to Animal’s constructor. Its hidden first line is super() → Object.', phase: 'down' },
  { active: 'Object', note: 'Object() runs FIRST (it is the top of every hierarchy). Nothing above it. ✓', phase: 'up' },
  { active: 'Animal', note: 'Control returns DOWN. Animal’s body now runs: name = "Rex", age = 0.', phase: 'up' },
  { active: 'Dog',    note: 'Finally Dog’s body runs: breed = "Husky". The object is fully born. 🎉', phase: 'up' },
]
const LEVELS = ['Object', 'Animal', 'Dog']

function ConstructorChain() {
  const [step, setStep] = useState(-1)
  const cur = step >= 0 ? CHAIN[step] : null
  const done = step >= CHAIN.length - 1

  return (
    <div className="panel">
      <div className="ptitle">Live demo · who runs first? (press Step)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {LEVELS.map((lvl) => {
          const isActive = cur && cur.active === lvl
          const hasRun = step >= 0 && CHAIN.slice(0, step + 1).some((s, i) => s.active === lvl && CHAIN[i].phase === 'up')
          return (
            <div key={lvl} className="obj" style={{
              margin: 0, transition: 'all .15s',
              borderColor: isActive ? 'var(--blue)' : 'var(--line)',
              background: isActive ? '#EAF0FF' : (hasRun ? '#E8F6EE' : '#fff'),
              boxShadow: isActive ? '0 0 0 2px var(--blue)' : 'none',
            }}>
              <div className="oref" style={{ marginBottom: 2 }}>
                {lvl === 'Object' ? 'class Object  (root of everything)' : lvl === 'Animal' ? 'class Animal extends Object' : 'class Dog extends Animal'}
                {hasRun && <span style={{ color: '#1d7a4d', float: 'right' }}>body ran ✓</span>}
                {isActive && <span style={{ color: '#2D5BFF', float: 'right' }}>◀ here</span>}
              </div>
              <div className="ofield" style={{ fontSize: 12.5 }}>{lvl}() constructor</div>
            </div>
          )
        })}
      </div>
      <div className="statbar" style={{ minHeight: 44 }}>
        <span>{cur ? cur.note : 'Press Step to call new Dog("Rex") and watch which constructor body runs first.'}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="act" disabled={done} onClick={() => setStep((s) => Math.min(s + 1, CHAIN.length - 1))}
          style={{ opacity: done ? 0.5 : 1 }}>{step < 0 ? 'new Dog("Rex") ▶ Step' : 'Step ▶'}</button>
        <button className="ghost act" onClick={() => setStep(-1)}>reset</button>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'Inheritance models which relationship?',
    o: ['has-a', 'is-a', 'uses-a', 'made-of'], a: 1,
    e: 'extends means "is a kind of": a Dog IS A(n) Animal. If you can’t say "X is a Y" truthfully, you probably want composition (has-a), not inheritance.' },
  { q: 'Which members of a parent are NOT inherited by a child?',
    o: ['public methods', 'protected fields', 'private members and constructors', 'static fields'], a: 2,
    e: 'private members can’t be accessed in the child (they still exist in the object but are hidden), and constructors are never inherited — though a child can CALL a parent constructor with super(...).' },
  { q: 'To override a method correctly, the child method must…',
    o: ['have a different name', 'have the SAME name and parameter list as the parent method', 'be static', 'return a different type'], a: 1,
    e: 'Overriding replaces a method that has the same signature (name + parameters). Use @Override so the compiler catches a typo that would silently make it a brand-new method instead.' },
  { q: 'Inside Dog, what does super.makeSound() do?',
    o: ['Calls Dog’s own makeSound again (infinite loop)', 'Calls the parent Animal’s version of makeSound', 'Creates a new Animal object', 'Is a compile error'], a: 1,
    e: 'super.x() runs the PARENT’s version. It lets a child add to the parent’s behavior instead of fully replacing it.' },
  { q: 'When you write new Dog(), in what order do the constructor BODIES finish running?',
    o: ['Dog, then Animal, then Object', 'Object, then Animal, then Dog', 'All at the same time', 'Only Dog runs'], a: 1,
    e: 'super(...) runs first, so the chain climbs to the top (Object) and the bodies execute top-down: Object → Animal → Dog. The parent is fully built before the child’s body runs.' },
  { q: 'You write a constructor in Animal that takes arguments, and Dog’s constructor has no super(...) call. What happens?',
    o: ['It works — Java guesses the arguments', 'Compile error — Java tries to call super() with no args, which doesn’t exist', 'Dog skips Animal entirely', 'Animal’s fields stay null forever'], a: 1,
    e: 'If you don’t call super(...) yourself, Java inserts a no-arg super(). If the parent has no no-arg constructor, that fails — you must call super(args) explicitly as the first line.' },
  { q: 'Every class in Java ultimately extends which class?',
    o: ['Main', 'System', 'Object', 'nothing — top classes extend nothing'], a: 2,
    e: 'If you don’t write extends, your class implicitly extends Object — the root of all classes. That’s where toString(), equals(), hashCode(), and getClass() come from.' },
  { q: 'Why are very deep inheritance hierarchies discouraged in LLD?',
    o: ['They run slower', 'They are tightly coupled and fragile — a change high up can break many children (the fragile base class problem)', 'Java limits depth to 3', 'They use too much memory'], a: 1,
    e: 'Deep trees are rigid and hard to change; a parent tweak ripples down unpredictably. Favor shallow hierarchies and prefer composition (has-a) over inheritance when in doubt (Week 2).' },
]

/* ============ The page ============ */
export default function Day3() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 1 · Day 3</div>
        <h1>Inheritance:<br />Standing on a Parent’s Shoulders</h1>
        <p>So far each class stood alone. Today classes get a <strong>family tree</strong>: a child class can reuse everything a parent
           already built, then add or change just what it needs. Used well, inheritance removes huge amounts of repeated code. Used
           badly, it builds a tangled mess. You will learn both sides. Click every demo.</p>
        <div className="chips">
          {['is-a', 'extends', 'overriding', 'super', 'constructor chaining', 'Object class', 'deep hierarchies'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What is inheritance? The "is-a" idea</h2>
        <p>Think about a real <strong>family</strong>. A child inherits traits from a parent — eye color, surname — without doing any
          work for them. They are simply <em>passed down</em>. The child can then add their own new traits on top.</p>
        <p>In code, <strong>inheritance</strong> lets one class (the <strong>child</strong> / subclass) automatically receive the fields
          and methods of another class (the <strong>parent</strong> / superclass), using the keyword <C>extends</C>.</p>
        <p>The relationship inheritance models is <strong>"is-a"</strong>. Read it out loud as a sanity check:</p>
        <ul>
          <li>A <strong>Dog</strong> <em>is a</em> <strong>Animal</strong> ✅ — inheritance fits.</li>
          <li>A <strong>Car</strong> <em>is a</em> <strong>Engine</strong> ❌ — false! A car <em>has an</em> engine. That is <strong>composition</strong> (has-a), not inheritance.</li>
        </ul>
        <Code html={`<span class="kw">public class</span> Animal {              <span class="cm">// the parent (superclass)</span>
    <span class="kw">protected</span> String name;        <span class="cm">// protected → visible to children too</span>
    <span class="kw">public void</span> eat()  { System.out.println(name + <span class="str">" is eating"</span>); }
    <span class="kw">public void</span> breathe() { System.out.println(<span class="str">"breathing..."</span>); }
}

<span class="kw">public class</span> Dog <span class="kw">extends</span> Animal {  <span class="cm">// Dog IS-A Animal → reuse everything</span>
    <span class="kw">public void</span> fetch() { System.out.println(name + <span class="str">" fetches the ball"</span>); }
}

Dog d = <span class="kw">new</span> Dog();
d.name = <span class="str">"Rex"</span>;     <span class="cm">// inherited field — Dog never declared it</span>
d.eat();              <span class="cm">// inherited method → "Rex is eating"</span>
d.fetch();            <span class="cm">// Dog’s own new method</span>`} />
        <Note><strong>One-line memory trick:</strong> <C>extends</C> = "is a kind of." The child gets the parent’s members for free and
          may add more. If "X is a Y" sounds wrong, don’t use inheritance.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2 · Interactive</div>
        <h2>🧬 Play: what actually gets inherited?</h2>
        <p>Not everything passes down. <strong>Public and protected</strong> members are inherited. <strong>Private</strong> members are
          hidden from the child, and <strong>constructors</strong> are never inherited. Click each chip below to see where it comes from
          and whether the child can use it.</p>
        <InheritanceTree />
        <Good><strong>What you should notice:</strong> ① <C>public</C>/<C>protected</C> members (blue ↳) flow into Dog automatically.
          ② <C>private</C> members and the parent’s constructor (tan) do <strong>not</strong>. ③ Dog’s own members exist only in Dog. The
          golden rule: a child reuses what the parent <em>exposed</em>, never what it hid.</Good>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🔁 Play: method overriding</h2>
        <p>A child can <strong>replace</strong> an inherited method with its own version — same name, same parameters, new body. This is
          <strong> overriding</strong>. Below, both Dog and Cat override <C>makeSound()</C>. Toggle whether the child calls
          <C>super.makeSound()</C> first, then fire each button.</p>
        <OverrideDemo />
        <Code html={`<span class="kw">public class</span> Animal {
    <span class="kw">public void</span> makeSound() { System.out.println(<span class="str">"...(some generic sound)"</span>); }
}

<span class="kw">public class</span> Dog <span class="kw">extends</span> Animal {
    <span class="kw">@Override</span>                       <span class="cm">// tells compiler "I mean to override" — catches typos</span>
    <span class="kw">public void</span> makeSound() {
        <span class="kw">super</span>.makeSound();          <span class="cm">// (optional) run the parent’s version first</span>
        System.out.println(<span class="str">"Woof! 🐶"</span>); <span class="cm">// then add Dog’s own behavior</span>
    }
}`} />
        <Note><strong>Override rules:</strong> the method name <em>and</em> parameter list must match the parent’s exactly. Always add
          <C>@Override</C> — if you misspell the name, the compiler will tell you instead of silently creating a brand-new method.
          You cannot make the access <em>narrower</em> (a public method can’t become private in the child).</Note>
        <Warn><strong>Overriding vs overloading</strong> — easy to confuse. <strong>Override</strong> = same signature, in a child class,
          replaces behavior. <strong>Overload</strong> = same name but <em>different</em> parameters, in the same class. Full story on
          Day 4 (Polymorphism).</Warn>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The <code style={{ fontFamily: 'IBM Plex Mono' }}>super</code> keyword — reach the parent</h2>
        <p>If <C>this</C> means "me" (Day 1), then <C>super</C> means "my parent part." It has three uses:</p>
        <ol>
          <li><strong>Call the parent’s method:</strong> <C>super.makeSound()</C> — run the version the child overrode.</li>
          <li><strong>Read the parent’s field</strong> when a name clashes: <C>super.name</C>.</li>
          <li><strong>Call the parent’s constructor:</strong> <C>super(args)</C> — and this <em>must</em> be the first line of the child constructor.</li>
        </ol>
        <Code html={`<span class="kw">public class</span> Dog <span class="kw">extends</span> Animal {
    <span class="kw">private</span> String breed;

    <span class="kw">public</span> Dog(String name, String breed) {
        <span class="kw">super</span>(name);           <span class="cm">// 1️⃣ MUST be first line — build the Animal part first</span>
        <span class="kw">this</span>.breed = breed;     <span class="cm">// 2️⃣ then set Dog’s own field</span>
    }
}`} />
        <Warn><strong>The #1 inheritance compile error:</strong> if the parent has <em>only</em> a constructor that takes arguments, the
          child <strong>must</strong> call <C>super(args)</C> explicitly. Otherwise Java auto-inserts a no-arg <C>super()</C> that doesn’t
          exist, and the build fails.</Warn>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>⛓️ Play: constructor chaining up the hierarchy</h2>
        <p>When you create a child, the <strong>parent part is always built first.</strong> Because <C>super(...)</C> is the hidden (or
          explicit) first line, control climbs all the way to the top of the family tree, and then the constructor bodies run
          <strong> top-down</strong>. Press <C>Step</C> and watch the order.</p>
        <ConstructorChain />
        <Good><strong>What you should notice:</strong> control goes <em>up</em> first (Dog → Animal → Object) because each
          <C>super(...)</C> runs before the body. Then the bodies finish <em>down</em> (Object → Animal → Dog). The parent is always
          fully constructed before the child’s body runs — so a child can safely rely on inherited fields.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The <code style={{ fontFamily: 'IBM Plex Mono' }}>Object</code> class — root of the whole tree</h2>
        <p>Here is a fact that surprises beginners: <strong>every class in Java already extends something.</strong> If you don’t write
          <C>extends</C>, your class silently extends <C>Object</C> — the ancestor of all classes. That’s why even a brand-new class
          comes with a few free methods:</p>
        <ul>
          <li><C>toString()</C> — text form of the object. Default is ugly (<C>Dog@1b6d</C>); override it to print something useful.</li>
          <li><C>equals(Object o)</C> — compares by address by default. Override to compare by <em>content</em> (Day 2 value objects).</li>
          <li><C>hashCode()</C> — a number for hashing; override it <em>together</em> with <C>equals()</C>.</li>
          <li><C>getClass()</C> — the real runtime type of the object.</li>
        </ul>
        <Code html={`<span class="kw">public class</span> Dog {       <span class="cm">// implicitly: extends Object</span>
    <span class="kw">private</span> String name;

    <span class="kw">@Override</span>
    <span class="kw">public</span> String toString() {  <span class="cm">// override the ugly default</span>
        <span class="kw">return</span> <span class="str">"Dog(name="</span> + name + <span class="str">")"</span>;
    }
}`} />
        <Reveal summary={<>Why does <C>System.out.println(dog)</C> print text at all? Click to reveal.</>}>
          <p><C>println</C> secretly calls <C>dog.toString()</C> for you. Since every object inherits <C>toString()</C> from
            <C>Object</C>, there is always <em>some</em> text to print. Override it and your debugging output instantly becomes readable.</p>
        </Reveal>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>When NOT to use inheritance (this matters for LLD)</h2>
        <p>Inheritance is powerful, but beginners overuse it. Two warnings interviewers look for:</p>
        <h3>1. Don’t build deep hierarchies</h3>
        <p>A chain like <C>Animal → Mammal → Carnivore → Canine → Dog → Puppy</C> is <strong>fragile</strong>. A small change near the
          top can break every class below it in surprising ways — the famous <strong>fragile base class problem</strong>. Keep
          hierarchies <strong>shallow</strong>.</p>
        <h3>2. Prefer composition (has-a) when "is-a" is shaky</h3>
        <p>If you’re only inheriting to <em>reuse some code</em>, that’s the wrong reason. Ask: is the child truly a <em>kind of</em> the
          parent? If not, give the class a field instead of a parent.</p>
        <Code html={`<span class="cm">// ❌ inheritance just to reuse code — a Stack is NOT really a Vector</span>
<span class="kw">class</span> Stack <span class="kw">extends</span> Vector { ... }

<span class="cm">// ✅ composition — Stack HAS-A list it uses internally</span>
<span class="kw">class</span> Stack {
    <span class="kw">private</span> List&lt;Integer&gt; data = <span class="kw">new</span> ArrayList&lt;&gt;(); <span class="cm">// reuse by holding, not extending</span>
    <span class="kw">public void</span> push(<span class="kw">int</span> x) { data.add(x); }
}`} />
        <Note><strong>Rule of thumb:</strong> <em>"Favor composition over inheritance."</em> Use inheritance for a true is-a with shared
          behavior; use composition (has-a) to reuse code. You’ll go deep on this in Week 2.</Note>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Forgetting <C>@Override</C> and mistyping the name</h3>
        <Code html={`<span class="kw">public void</span> makesound() { ... }   <span class="cm">// ❌ lowercase 's' — this is a NEW method, not an override!</span>`} />
        <p>Without <C>@Override</C>, the compiler stays silent and the parent’s version still runs. Always annotate overrides.</p>
        <h3>Trap 2 — <C>super(...)</C> not first</h3>
        <p>A call to <C>super(...)</C> (or <C>this(...)</C>) must be the <strong>very first statement</strong> of a constructor. Putting
          any line before it is a compile error.</p>
        <h3>Trap 3 — Trying to reach a private parent field</h3>
        <p><C>private</C> members are not accessible in the child. Use <C>protected</C> if children genuinely need access — or better,
          a protected/public getter — but don’t expose internals casually (remember Day 2).</p>
        <h3>Trap 4 — Inheriting just to reuse code</h3>
        <p>If you can’t honestly say "child <em>is a</em> parent," you want composition. Reuse is not a good enough reason to extend.</p>
        <h3>Trap 5 — You can’t override <C>static</C> or <C>private</C> methods</h3>
        <p>Static methods belong to the class, not the object, so a same-named static in a child <em>hides</em> rather than overrides.
          Private methods aren’t visible to the child at all, so they can’t be overridden either.</p>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Inheritance</strong> = <C>child extends parent</C>; models <strong>is-a</strong>. Child reuses parent’s members and may add more.</li>
          <li><strong>Inherited:</strong> public &amp; protected members. <strong>Not inherited:</strong> private members, constructors.</li>
          <li><strong>Overriding</strong> = same name + same parameters in a child, new body. Always tag with <C>@Override</C>. Can’t narrow access.</li>
          <li><strong><C>super</C></strong> = the parent part: <C>super.method()</C>, <C>super.field</C>, and <C>super(args)</C> (must be the first line of a constructor).</li>
          <li><strong>Construction order:</strong> <C>super(...)</C> runs first → bodies execute top-down (Object → … → child). Parent built before child body.</li>
          <li>If the parent has only an arg constructor, the child <strong>must</strong> call <C>super(args)</C> explicitly.</li>
          <li>Every class extends <strong><C>Object</C></strong> → free <C>toString/equals/hashCode/getClass</C>; override as needed.</li>
          <li>Keep hierarchies <strong>shallow</strong>. <strong>Favor composition (has-a) over inheritance</strong> when is-a is shaky.</li>
        </ul>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 3 complete?</strong> Homework before Day 4: build a small hierarchy — <C>Vehicle</C> (parent) with a protected
        <C> brand</C>, a constructor <C>Vehicle(String brand)</C>, and a <C>describe()</C> method. Add <C>Car</C> and
        <C> Motorcycle</C> children that each call <C>super(brand)</C>, add their own field (e.g. <C>numDoors</C>), and
        <strong> override</strong> <C>describe()</C> using <C>super.describe()</C> plus their own detail. Override <C>toString()</C> too,
        create one of each in <C>main</C>, and print them.
        <br /><br />
        Next: <strong>Day 4 — Polymorphism</strong>: compile-time vs runtime, dynamic dispatch, how vtables work, upcasting/downcasting, <C>instanceof</C>.
      </div>
    </div>
  )
}
