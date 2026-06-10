import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: Object Factory ============ */
const PALETTE = { red:'#D9534F', blue:'#2D5BFF', green:'#2E9E6B', black:'#222', white:'#999', yellow:'#C9A227', orange:'#D97B29' }

function ObjectFactory() {
  const [cars, setCars] = useState([])
  const [color, setColor] = useState('Red')

  function makeCar() {
    if (cars.length >= 6) { alert('Heap demo is full 🙂 Press reset to start again.'); return }
    const addr = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')
    setCars((cs) => [...cs, { id: cs.length + 1, color: color.trim() || 'Gray', addr, speed: 0 }])
  }
  function accelerate(id) {
    setCars((cs) => cs.map((c) => (c.id === id ? { ...c, speed: c.speed + 10 } : c)))
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one class, many objects</div>
      <div className="factory-grid">
        <div>
          <div className="class-card">
            <div className="cname">class Car  (blueprint)</div>
            String color;<br />
            int speed = 0;<br /><br />
            void accelerate()<br />
            <span style={{ color: '#B97A14' }}>static int totalCars; ← shared!</span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="txt" value={color} onChange={(e) => setColor(e.target.value)} aria-label="car color" />
            <button className="act" onClick={makeCar}>new Car()</button>
            <button className="ghost act" onClick={() => setCars([])}>reset</button>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>
            HEAP MEMORY (where objects live)
          </div>
          <div className="heap">
            {cars.length === 0 ? (
              <div className="empty">No objects yet. The blueprint alone stores no car data. Press <b>new Car()</b> →</div>
            ) : (
              cars.map((c) => {
                const dot = PALETTE[c.color.toLowerCase()] || '#7c8aa5'
                return (
                  <div className="obj" key={c.id}>
                    <div className="oref">c{c.id} → Car@{c.addr}</div>
                    <div className="ofield">
                      color = "{c.color}"{' '}
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: dot, border: '1px solid #999' }} />
                    </div>
                    <div className="ofield">speed = <b>{c.speed}</b></div>
                    <button className="ghost act" style={{ fontSize: 12, padding: '5px 9px', marginTop: 7 }}
                      onClick={() => accelerate(c.id)}>accelerate()</button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
      <div className="statbar">
        ⚡ <span>static counter, stored ONCE on the class, shared by all objects:</span>
        <b>Car.totalCars = {cars.length}</b>
      </div>
    </div>
  )
}

/* ============ Interactive 2: Access matrix ============ */
const MOD_STORIES = {
  private:  <span><b>private</b> 🛏️ — your bedroom. Only code <i>inside the same class</i> can touch it. This is the default choice for fields in good LLD. Fun fact: a private constructor blocks outsiders from doing <C>new</C> — that's how Singleton works.</span>,
  default:  <span><b>default / package-private</b> 🍳 — the family kitchen. You wrote no keyword, so only classes in the <i>same package</i> (folder) can access it. Useful for helper classes that should stay internal to a module.</span>,
  protected:<span><b>protected</b> 🏡 — family + children who moved away. Same package PLUS subclasses in other packages. You'll meet it properly on Day 3 (Inheritance). Use sparingly — it leaks internals to every future child class.</span>,
  public:   <span><b>public</b> 🌳 — the open garden. Anyone, anywhere can access it. Use for the official API of your class: the methods you <i>want</i> the world to call. Public fields are almost always a mistake.</span>,
}
const ROWS = [
  ['Same class',                      { private:1, default:1, protected:1, public:1 }],
  ['Same package',                    { private:0, default:1, protected:1, public:1 }],
  ['Subclass in another package',     { private:0, default:0, protected:1, public:1 }],
  ['Everywhere else (the world)',     { private:0, default:0, protected:0, public:1 }],
]
const MODS = ['private', 'default', 'protected', 'public']

function AccessMatrix() {
  const [mod, setMod] = useState('private')
  return (
    <div className="panel">
      <div className="ptitle">Live demo · click to compare</div>
      <div className="modbtns">
        {MODS.map((m) => (
          <button key={m} className={mod === m ? 'on' : ''} onClick={() => setMod(m)}>
            {m === 'default' ? '(default)' : m}
          </button>
        ))}
      </div>
      <table className="matrix">
        <thead>
          <tr><th>Can be accessed from…</th>{MODS.map((m) => <th key={m}>{m}</th>)}</tr>
        </thead>
        <tbody>
          {ROWS.map(([label, vals]) => (
            <tr key={label}>
              <td>{label}</td>
              {MODS.map((m) => {
                const yes = vals[m] === 1
                const focused = m === mod
                return (
                  <td key={m} className={yes ? 'yes' : 'no'}
                      style={{ opacity: focused ? 1 : 0.25, outline: focused ? '2px solid var(--ink)' : 'none' }}>
                    {yes ? '✔' : '✘'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="modexplain">{MOD_STORIES[mod]}</div>
    </div>
  )
}

/* ============ Interactive 3: static vs instance ============ */
function StaticDemo() {
  const [sp1, setSp1] = useState(0)
  const [sp2, setSp2] = useState(0)
  const [honks, setHonks] = useState(0)
  const [flash, setFlash] = useState(false)

  function honk() {
    setHonks((h) => h + 1)
    setFlash(true)
    setTimeout(() => setFlash(false), 200)
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one shared board vs personal diaries</div>
      <p style={{ fontSize: 14.5, marginBottom: 12 }}>
        Two Car objects exist below. Click their buttons and watch: <C>speed</C> (instance) changes per object,
        but <C>totalHonks</C> (static) is one shared number.
      </p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div className="obj" style={{ minWidth: 200 }}>
          <div className="oref">c1 → Car@a1f4</div>
          <div className="ofield">color = "Red"</div>
          <div className="ofield">speed = <b>{sp1}</b></div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <button className="act" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => setSp1((s) => s + 10)}>accelerate()</button>
            <button className="ghost act" style={{ fontSize: 12, padding: '6px 10px' }} onClick={honk}>honk()</button>
          </div>
        </div>
        <div className="obj" style={{ minWidth: 200 }}>
          <div className="oref">c2 → Car@b7c9</div>
          <div className="ofield">color = "Blue"</div>
          <div className="ofield">speed = <b>{sp2}</b></div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <button className="act" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => setSp2((s) => s + 10)}>accelerate()</button>
            <button className="ghost act" style={{ fontSize: 12, padding: '6px 10px' }} onClick={honk}>honk()</button>
          </div>
        </div>
      </div>
      <div className="statbar" style={{ background: flash ? '#FFEFD2' : '#FFF6E8' }}>
        📋 Stored once on the class (method area), shared by everyone: <b>static int totalHonks = {honks}</b>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q:'A class uses memory for its instance fields even before any object is created.',
    o:['True','False'], a:1,
    e:'False. The class is only a blueprint. Instance fields get memory only when an object is created with `new`. (Static fields DO get memory once, when the class loads.)' },
  { q:'Car c = new Car(); — what does the variable c actually store?',
    o:['The whole Car object','The address (reference) of the object','A copy of the object',"Nothing, it's just a name"], a:1,
    e:'c lives on the stack and stores the heap address of the object. The object itself lives in the heap.' },
  { q:'You wrote: public Car(String color) { ... } and nothing else. What happens to `new Car()`?',
    o:['Works fine, Java keeps the default constructor','Compile error — the free default constructor is gone','Runs with color = null','Throws NullPointerException at runtime'], a:1,
    e:'The moment you write ANY constructor, Java removes the free no-arg one. If you still want `new Car()`, write the no-arg constructor yourself.' },
  { q:'Inside which of these can you NOT use the keyword `this`?',
    o:['An instance method','A constructor','A static method','All of them allow `this`'], a:2,
    e:"Static methods belong to the class, not to any object, so there is no 'current object' for `this` to point to." },
  { q:'A field with NO access modifier written (e.g., `int speed;`) is visible to…',
    o:['Only the same class','The same package','Same package + all subclasses everywhere','Everyone'], a:1,
    e:'No keyword = default = package-private: visible to all classes in the same package only. (protected adds subclasses in other packages.)' },
  { q:'Car a = new Car("Red",0); Car b = a; b.color = "Black"; — what is a.color now?',
    o:['"Red"','"Black"','null','Compile error'], a:1,
    e:'`b = a` copies the address, not the object. a and b point to the SAME object, so changing through b changes what a sees too.' },
  { q:'static int totalCars; — where does this variable live, and how many copies exist?',
    o:['In every object; one copy per object','On the class; exactly one shared copy','On the stack; one per method call','Two copies: one per object plus one on the class'], a:1,
    e:'Static members are stored once with the class itself and shared by all objects — the society notice board.' },
  { q:'Why must main be static in Java?',
    o:['Because static methods run faster','Tradition from C language only','JVM must call it before any object exists, so it cannot depend on an object','Because main returns void'], a:2,
    e:'At program start, zero objects exist. The JVM needs an entry point it can call directly on the class — hence static.' },
]

/* ============ The page ============ */
export default function Day1() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 1 · Day 1</div>
        <h1>Classes &amp; Objects:<br />The Blueprint and the Building</h1>
        <p>Today you learn the most important idea in all of object-oriented programming. Every design pattern,
           every SOLID principle, every interview answer sits on top of what is on this page. Read slowly.
           Click everything. Run the code in your head.</p>
        <div className="chips">
          {['classes','objects','constructors','this','access modifiers','static vs instance'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What is a class? What is an object?</h2>
        <p>Think about a <strong>house blueprint</strong>. A blueprint is a paper drawing. It says: "the house will have
          3 rooms, 2 doors, 1 kitchen." Can you live inside a blueprint? <strong>No.</strong> It is only a plan.</p>
        <p>Now a builder takes that blueprint and builds <strong>real houses</strong> from it. House #1, House #2, House #3.
          All three follow the same plan, but each house is separate. You can paint House #1 blue and House #2 red.
          Changing one does not change the other.</p>
        <ul>
          <li>A <strong>class</strong> = the blueprint. It is only a description. It uses <strong>zero memory for data</strong> until you build something from it.</li>
          <li>An <strong>object</strong> = a real house built from the blueprint. It lives in memory. It has its <strong>own copy</strong> of the data.</li>
        </ul>
        <p>A class describes two things:</p>
        <ul>
          <li><strong>State (fields / variables)</strong> — what the object <em>knows</em>. A car knows its color, its speed.</li>
          <li><strong>Behavior (methods)</strong> — what the object <em>can do</em>. A car can accelerate, can brake.</li>
        </ul>
        <Note><strong>One-line memory trick:</strong> Class = idea on paper. Object = real thing in memory. One class → many objects.</Note>
        <Reveal summary={<>Quick check: "String" is a class in Java. So what is <C>"hello"</C>? Click to reveal.</>}>
          <p><C>"hello"</C> is an <strong>object</strong> of the class <C>String</C>. The class <C>String</C> is the blueprint
            (written once inside Java itself). Every text you create — "hello", "bye", your name — is a separate object made from that one blueprint.</p>
        </Reveal>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Your first class in Java</h2>
        <p>Let us write the blueprint for a Car. Read every comment — the comments are the teacher here.</p>
        <Code html={`<span class="cm">// File: Car.java  (file name should match the public class name)</span>
<span class="kw">public class</span> Car {

    <span class="cm">// ---- STATE (fields). Every Car object gets its OWN copy of these ----</span>
    String color;       <span class="cm">// what color is this car?</span>
    <span class="kw">int</span> speed;          <span class="cm">// current speed. int starts at 0 by default</span>

    <span class="cm">// ---- BEHAVIOR (methods). What a Car can do ----</span>
    <span class="kw">void</span> accelerate() {
        speed = speed + <span class="num">10</span>;   <span class="cm">// increase MY OWN speed by 10</span>
    }

    <span class="kw">void</span> showInfo() {
        System.out.println(color + <span class="str">" car at speed "</span> + speed);
    }
}`} />
        <p>Now somewhere else (for example in <C>main</C>) we <strong>build real cars</strong> from this blueprint using the keyword <C>new</C>:</p>
        <Code html={`Car c1 = <span class="kw">new</span> Car();   <span class="cm">// build house #1</span>
Car c2 = <span class="kw">new</span> Car();   <span class="cm">// build house #2 (totally separate)</span>

c1.color = <span class="str">"Red"</span>;
c2.color = <span class="str">"Blue"</span>;

c1.accelerate();        <span class="cm">// only c1's speed becomes 10</span>
c1.showInfo();          <span class="cm">// Red car at speed 10</span>
c2.showInfo();          <span class="cm">// Blue car at speed 0   ← c2 was not touched!</span>`} />
        <p>Break the line <C>Car c1 = new Car();</C> into 3 parts:</p>
        <ol>
          <li><C>Car c1</C> → make a <strong>reference variable</strong> named <C>c1</C> that can point to a Car object. (Like writing a house address on a paper.)</li>
          <li><C>new Car()</C> → actually <strong>build the object in memory</strong> (this is the builder constructing the house).</li>
          <li><C>=</C> → store the object's address inside <C>c1</C> (write the house address on the paper).</li>
        </ol>
        <Warn><strong>Very important:</strong> <C>c1</C> is <strong>not</strong> the object. It is only a small variable holding
          the <em>address</em> of the object. Two reference variables can point to the <strong>same</strong> object. We will see this trap in Section 9.</Warn>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🏭 Play: The Object Factory</h2>
        <p>Below is one <strong>class</strong> (left) and the <strong>heap memory</strong> (right). Type a color and press <C>new Car()</C>.
          Watch a brand-new object appear with its own fields. Press <em>accelerate</em> on one object and see that <strong>only that object</strong> changes.</p>
        <ObjectFactory />
        <Good><strong>What you should notice:</strong> ① Each press of <C>new</C> makes a fresh, separate object.
          ② Pressing <em>accelerate()</em> changes only that one object's speed. ③ The <C>static</C> counter goes up no matter
          which object is created — because it belongs to the <strong>class</strong>, not to any single object. (Full static story in Section 8.)</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Where do things live? Stack vs Heap (simple version)</h2>
        <p>Java keeps memory in two main areas. You do not need deep JVM knowledge for LLD, but this simple picture removes 90% of beginner confusion:</p>
        <Code html={`        STACK (small, fast)                 HEAP (big)
   ┌───────────────────────┐      ┌─────────────────────────────┐
   │ main() frame          │      │  ┌───────────────┐          │
   │  c1 ──────────────────┼──────┼─▶│ Car object #1 │          │
   │  c2 ──────────────────┼──┐   │  │ color="Red"   │          │
   │  x = 5                │  │   │  │ speed=10      │          │
   └───────────────────────┘  │   │  └───────────────┘          │
                              │   │  ┌───────────────┐          │
   local variables &          └───┼─▶│ Car object #2 │          │
   references live here           │  │ color="Blue"  │          │
                                  │  │ speed=0       │          │
                                  │  └───────────────┘          │
                                  └─────────────────────────────┘`} />
        <ul>
          <li><strong>Stack:</strong> local variables and reference variables (<C>c1</C>, <C>c2</C>, <C>int x</C>). Cleared automatically when a method finishes.</li>
          <li><strong>Heap:</strong> every object created with <C>new</C>. Objects stay alive as long as <em>someone</em> points to them.</li>
          <li><strong>Garbage Collector (GC):</strong> when no reference points to an object anymore, Java automatically deletes it. You never call <C>delete</C> in Java.</li>
        </ul>
        <Reveal summary={<>What is <C>null</C> then? Click to reveal.</>}>
          <p><C>null</C> means a reference that points to <strong>nothing</strong>. <C>Car c3 = null;</C> makes the paper for the
            address, but the paper is blank. If you try <C>c3.accelerate()</C>, Java crashes with the famous
            <strong> NullPointerException</strong> — you asked a non-existing house to open its door.</p>
        </Reveal>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Constructors — the birth ceremony of an object</h2>
        <p>A <strong>constructor</strong> is a special method that runs <strong>automatically, exactly once</strong>, at the moment
          an object is born (when you write <C>new</C>). Its job: put the object in a correct starting state.</p>
        <p>Rules to memorize (interviewers love these):</p>
        <ul>
          <li>Constructor name is <strong>exactly the class name</strong>.</li>
          <li>It has <strong>no return type</strong> — not even <C>void</C>.</li>
          <li>If you write <strong>no constructor at all</strong>, Java secretly gives you a free empty one: the <strong>default constructor</strong>.</li>
          <li>The moment you write <strong>any</strong> constructor yourself, that free one <strong>disappears</strong>.</li>
        </ul>
        <h3>5.1 — Default constructor (the free one)</h3>
        <Code html={`<span class="kw">public class</span> Car {
    String color;        <span class="cm">// no constructor written</span>
}
<span class="cm">// Java silently adds:  public Car() { }   ← so "new Car()" works</span>`} />
        <h3>5.2 — Parameterized constructor (the useful one)</h3>
        <p>Problem with the code in Section 2: we could create a Car and forget to set its color. Bad object, half-empty.
          Solution: <strong>force</strong> the data at birth.</p>
        <Code html={`<span class="kw">public class</span> Car {
    String color;
    <span class="kw">int</span> speed;

    <span class="cm">// constructor: same name as class, no return type</span>
    <span class="kw">public</span> Car(String color, <span class="kw">int</span> speed) {
        <span class="kw">this</span>.color = color;   <span class="cm">// "this.color" = MY field, "color" = parameter</span>
        <span class="kw">this</span>.speed = speed;
    }
}

Car c1 = <span class="kw">new</span> Car(<span class="str">"Red"</span>, <span class="num">0</span>);  <span class="cm">// ✅ must give data now</span>
Car c2 = <span class="kw">new</span> Car();           <span class="cm">// ❌ COMPILE ERROR! free constructor is gone</span>`} />
        <h3>5.3 — Constructor overloading (many ways to be born)</h3>
        <p>You can write <strong>multiple constructors</strong> with different parameter lists. Java picks the matching one. This is called <strong>overloading</strong>.</p>
        <Code html={`<span class="kw">public class</span> Car {
    String color;
    <span class="kw">int</span> speed;

    <span class="kw">public</span> Car() {                       <span class="cm">// way 1: no info</span>
        <span class="kw">this</span>(<span class="str">"White"</span>, <span class="num">0</span>);               <span class="cm">// ← calls way 3! (chaining)</span>
    }
    <span class="kw">public</span> Car(String color) {           <span class="cm">// way 2: only color</span>
        <span class="kw">this</span>(color, <span class="num">0</span>);                  <span class="cm">// ← again forwards to way 3</span>
    }
    <span class="kw">public</span> Car(String color, <span class="kw">int</span> speed) {<span class="cm">// way 3: full info (the "real" one)</span>
        <span class="kw">this</span>.color = color;
        <span class="kw">this</span>.speed = speed;
    }
}`} />
        <Note><strong>Constructor chaining with <C>this(...)</C>:</strong> one constructor calling another. Rule: <C>this(...)</C> must be
          the <strong>first line</strong> of the constructor. Benefit: the real setup logic is written in only ONE place (way 3).
          Less repetition = fewer bugs. This habit becomes the <strong>Builder pattern</strong> later in Month 2.</Note>
        <Reveal summary="Bonus: copy constructor — click to reveal.">
          <p>A constructor that takes <strong>another object of the same class</strong> and copies its data. Java does not give it free
            (C++ does); you write it yourself:</p>
          <Code html={`<span class="kw">public</span> Car(Car other) {
    <span class="kw">this</span>.color = other.color;
    <span class="kw">this</span>.speed = other.speed;
}
Car c2 = <span class="kw">new</span> Car(c1);   <span class="cm">// a NEW object with same values — not the same address</span>`} />
        </Reveal>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The <code style={{ fontFamily: 'IBM Plex Mono' }}>this</code> keyword — "me, myself"</h2>
        <p><C>this</C> simply means: <strong>"the current object — the one whose method is running right now."</strong> When you call
          <C>c1.accelerate()</C>, inside that method <C>this</C> is <C>c1</C>. When you call <C>c2.accelerate()</C>, <C>this</C> is <C>c2</C>.</p>
        <p>Four real uses:</p>
        <ol>
          <li><strong>Solve name clash:</strong> <C>this.color = color;</C> — left side is my field, right side is the parameter.
            Without <C>this</C>, <C>color = color</C> would just assign the parameter to itself (a classic silent bug!).</li>
          <li><strong>Constructor chaining:</strong> <C>this("White", 0);</C> as you saw above.</li>
          <li><strong>Pass myself to someone:</strong> <C>garage.park(this);</C> — "park <em>me</em>".</li>
          <li><strong>Return myself for chaining:</strong> <C>return this;</C> — lets you write <C>car.paint("Red").start()</C>. The Builder pattern lives on this trick.</li>
        </ol>
        <Warn><C>this</C> cannot be used inside <C>static</C> methods. Why? A static method belongs to the class, not to any object —
          so there is no "current object" to point to. Section 8 makes this clear.</Warn>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🔐 Access modifiers — who is allowed to touch what?</h2>
        <p>Java has <strong>4 levels of visibility</strong>. Think of your house: some rooms are for you only (bedroom), some for family
          (kitchen), some for neighbors, and the garden is for everyone.</p>
        <p><strong>Click a modifier</strong> below and watch the table show exactly who can access it:</p>
        <AccessMatrix />
        <h3>The golden habit for LLD</h3>
        <Good><strong>Make every field <C>private</C>. Make behavior <C>public</C> only if outsiders truly need it.</strong> Outsiders
          should talk to your object through methods, never by grabbing fields directly. This habit IS encapsulation — tomorrow's full topic (Day 2).</Good>
        <Code html={`<span class="kw">public class</span> BankAccount {
    <span class="kw">private double</span> balance;              <span class="cm">// 🔒 nobody outside can touch directly</span>

    <span class="kw">public void</span> deposit(<span class="kw">double</span> amount) { <span class="cm">// 🚪 the official door, with a guard</span>
        <span class="kw">if</span> (amount <= <span class="num">0</span>) <span class="kw">throw new</span> IllegalArgumentException(<span class="str">"Invalid!"</span>);
        balance += amount;
    }
}
<span class="cm">// account.balance = -99999;  ❌ compile error. The guard cannot be skipped. 🎉</span>`} />
        <Reveal summary='What is a "package"? And what about classes themselves? Click to reveal.'>
          <p>A <strong>package</strong> is just a folder/namespace for related classes, declared with <C>package com.myapp.vehicles;</C> at the
            top of the file. <em>Default</em> (also called package-private) means: you wrote no modifier at all, so only classmates in the same folder can see it.</p>
          <p style={{ marginTop: 8 }}><strong>Top-level classes</strong> can only be <C>public</C> or default — a class cannot be <C>private</C> at the
            top level (who could ever use it?). Fields, methods, and constructors can use all 4. Yes, a constructor can be <C>private</C> —
            that trick creates the <strong>Singleton pattern</strong> (Month 2, Week 5)!</p>
        </Reveal>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>⚡ static vs instance — class-owned vs object-owned</h2>
        <p>Every member of a class belongs to one of two owners:</p>
        <ul>
          <li><strong>Instance member</strong> (normal): every object gets <strong>its own copy</strong>. <C>color</C>, <C>speed</C> — your car's color is not my car's color.</li>
          <li><strong>Static member</strong>: there is <strong>exactly ONE copy</strong>, stored on the <strong>class itself</strong>, shared by all objects.
            Like a notice board in a society — one board, all houses read the same board.</li>
        </ul>
        <StaticDemo />
        <h3>Static methods</h3>
        <Code html={`<span class="kw">public class</span> MathHelper {
    <span class="kw">public static int</span> square(<span class="kw">int</span> x) {   <span class="cm">// needs no object data → static</span>
        <span class="kw">return</span> x * x;
    }
}
<span class="kw">int</span> y = MathHelper.square(<span class="num">5</span>);          <span class="cm">// call with CLASS name. No "new" needed!</span>`} />
        <ul>
          <li>Call static things with the <strong>class name</strong>: <C>Math.random()</C>, <C>Car.totalCars</C>.</li>
          <li>A static method <strong>cannot</strong> use instance fields or <C>this</C> — there is no specific object it belongs to. (Which car's speed would it read? Nobody knows!)</li>
          <li>An instance method <strong>can</strong> read static fields freely (everyone can read the notice board).</li>
          <li>This is why <C>main</C> is <C>public static void main</C> — Java must start your program <strong>before any object exists</strong>, so the entry door cannot depend on an object.</li>
        </ul>
        <h3>When should I use static? (LLD judgment)</h3>
        <ul>
          <li>✅ Counters shared across all objects (<C>totalCars</C>), constants (<C>static final double MAX_SPEED = 240;</C>),
            pure utility helpers (<C>Math.max</C>), factory methods (Month 2).</li>
          <li>❌ Do <strong>not</strong> make things static just to "avoid creating objects." Heavy static use kills flexibility and testability — interviewers see it as a design smell.</li>
        </ul>
        <Reveal summary="Bonus: static blocks & loading order — click to reveal.">
          <p>A <C>static {'{'} ... {'}'}</C> block runs <strong>once</strong>, when the class is first loaded by the JVM — even before any object is made.
            Order when you create an object: ① static fields + static blocks (first time only) → ② instance fields → ③ constructor. Good interview trivia.</p>
        </Reveal>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common beginner traps (read twice)</h2>
        <h3>Trap 1 — Two references, one object</h3>
        <Code html={`Car a = <span class="kw">new</span> Car(<span class="str">"Red"</span>, <span class="num">0</span>);
Car b = a;               <span class="cm">// ❗ NO new object made. b copies the ADDRESS.</span>
b.color = <span class="str">"Black"</span>;
System.out.println(a.color);   <span class="cm">// prints "Black"! a and b are the SAME house.</span>`} />
        <p><C>=</C> between references copies the <strong>address</strong>, never the object. To get a real second object you need <C>new</C> (or a copy constructor).</p>
        <h3>Trap 2 — Comparing objects with ==</h3>
        <Code html={`String s1 = <span class="kw">new</span> String(<span class="str">"hi"</span>);
String s2 = <span class="kw">new</span> String(<span class="str">"hi"</span>);
s1 == s2        <span class="cm">// false! == compares ADDRESSES (different houses)</span>
s1.equals(s2)   <span class="cm">// true!  .equals compares CONTENT — use this for objects</span>`} />
        <h3>Trap 3 — The self-assignment bug</h3>
        <Code html={`<span class="kw">public</span> Car(String color) {
    color = color;        <span class="cm">// ❌ parameter = parameter. Field stays null. No error shown!</span>
    <span class="kw">this</span>.color = color;   <span class="cm">// ✅ correct</span>
}`} />
        <h3>Trap 4 — Forgetting that local variables get no default value</h3>
        <p><strong>Fields</strong> get automatic defaults: <C>int → 0</C>, <C>boolean → false</C>, objects → <C>null</C>. But
          <strong> local variables inside methods get nothing</strong> — using one before assigning is a compile error.</p>
        <h3>Trap 5 — NullPointerException (NPE)</h3>
        <Code html={`Car c = <span class="kw">null</span>;
c.accelerate();   <span class="cm">// 💥 NullPointerException — no house at this address</span>`} />
        <p>Always ask: "can this reference be null here?" Defensive checks in constructors prevent half-born objects.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Class</strong> = blueprint (no data memory). <strong>Object</strong> = real instance in heap, made with <C>new</C>.</li>
          <li>Reference variable holds the <strong>address</strong>, not the object. <C>=</C> copies addresses.</li>
          <li><strong>Constructor</strong>: same name as class, no return type, runs once at birth. Writing any constructor removes the free default one. Overload for flexibility; chain with <C>this(...)</C> (must be first line).</li>
          <li><strong><C>this</C></strong> = current object. Solves name clash, chains constructors, passes/returns itself. Banned inside static.</li>
          <li><strong>Access:</strong> private → class only · default → package · protected → package + subclasses · public → world. Habit: fields private, behavior public.</li>
          <li><strong>static</strong> = one copy on the class, shared. <strong>instance</strong> = per-object copy. Static methods can't touch instance members or <C>this</C>.</li>
          <li><C>==</C> compares addresses; <C>.equals()</C> compares content.</li>
          <li>Naming: classes <C>PascalCase</C>, fields/methods <C>camelCase</C>, constants <C>UPPER_CASE</C>.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Edge cases and trivia interviewers use to separate "read about it" from "knows it". Answer each in
          your head BEFORE revealing.</p>
        <Reveal summary="Q: Is Java pass-by-value or pass-by-reference?">
          <p><strong>Always pass-by-value.</strong> The confusion: for objects, the value copied IS the reference
            (address). So a method CAN mutate the object the caller sees (<C>car.setColor(...)</C> works) — but
            reassigning the parameter (<C>car = new Car()</C>) changes only the method's local copy. Java has no
            C++-style pass-by-reference, ever.</p>
        </Reveal>
        <Reveal summary={<>Q: <C>String a = "hi"; String b = "hi";</C> — is <C>a == b</C> true or false?</>}>
          <p><strong>True!</strong> String <em>literals</em> go into the <strong>string pool</strong> — identical
            literals share ONE object, so addresses match. But <C>new String("hi")</C> forces a fresh heap object
            → <C>==</C> false. This is why the rule stays absolute: use <C>.equals()</C> — <C>==</C> on strings
            sometimes "works", which makes it the perfect trap.</p>
        </Reveal>
        <Reveal summary={<>Q: What is the FULL order of events when <C>new Child()</C> runs?</>}>
          <p>① Parent statics (fields + static blocks, first class-load only) → ② Child statics (first time) →
            ③ Parent instance field initializers → ④ Parent constructor body → ⑤ Child instance field
            initializers → ⑥ Child constructor body. Memory hook: <em>statics once, top-down; then instance,
            parent-before-child.</em></p>
        </Reveal>
        <Reveal summary="Q: Can a constructor be final, static, or abstract?">
          <p><strong>None of the three.</strong> <C>final</C> is meaningless (constructors aren't inherited or
            overridden), <C>static</C> contradicts the job (a constructor initializes a specific instance —
            there's a <C>this</C>), <C>abstract</C> is absurd (it must have a body to run at birth). Allowed:
            only access modifiers — including <C>private</C> (that's how Singleton works, Day 21).</p>
        </Reveal>
        <Reveal summary="Q: Do local variables get default values like fields do?">
          <p><strong>No.</strong> Fields auto-default (<C>0</C>, <C>false</C>, <C>null</C>); locals get NOTHING —
            reading an unassigned local is a compile error ("variable might not have been initialized"). Exam
            favorite: the identical line is legal as a field, illegal in a method.</p>
        </Reveal>
        <Reveal summary={<>Q: Can you overload <C>main()</C>? Which one runs?</>}>
          <p>Yes — <C>main(String name)</C>, <C>main(int x)</C> are legal overloads, but the JVM only calls the
            exact <C>public static void main(String[] args)</C>; the rest are ordinary methods. Follow-up they
            love: varargs <C>main(String... args)</C> ALSO works as the entry point.</p>
        </Reveal>
        <Reveal summary="Q: Where do static fields live? Are objects ever on the stack?">
          <p>Statics live with the CLASS (the JVM's method area / metaspace), inside no object. And in Java's
            language model, ALL objects live on the heap; the stack holds locals and references. (Bonus point:
            the JIT may "scalar-replace" objects that never escape a method — an optimization, not the model.)</p>
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
        <strong>Day 1 complete?</strong> Homework before Day 2: in your own IDE, write a <C>Student</C> class with private fields
        (name, rollNo, marks), three overloaded constructors chained with <C>this(...)</C>, a static counter <C>totalStudents</C>,
        and a <C>printReport()</C> method. Create 3 students in <C>main</C> and prove the counter works.
        <br /><br />
        Next: <strong>Day 2 — Encapsulation</strong>: why getters/setters exist, immutability, defensive copying.
      </div>
    </div>
  )
}
