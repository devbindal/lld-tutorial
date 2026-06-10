import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../components/ui.jsx'

/* ============ Interactive 1: Relationship Explorer ============ */
const REL_DATA = {
  association: {
    label: 'Association',
    arrow: `Student ────────────▶ Teacher
        "knows-a"  (plain line/arrow)`,
    strength: 1,
    story: <span><b>Association</b> 🤝 — "knows-a". Two independent objects that talk to each other.
      A student <i>knows</i> a teacher. Delete the student — the teacher is fine. Delete the teacher —
      the student is fine. Nobody owns anybody. Both have their own life.</span>,
    java: 'class Student { Teacher mentor; }  // just holds a reference',
  },
  aggregation: {
    label: 'Aggregation',
    arrow: `Team ◇───────────── Player
     "has-a, but does NOT own"  (hollow ◇ at the owner)`,
    strength: 2,
    story: <span><b>Aggregation</b> 🧲 — "has-a, weak ownership". The team <i>has</i> players, but players
      are created <b>outside</b> and handed in. Delete the team — the players still exist and can join
      another team. The part can live without the whole.</span>,
    java: 'class Team { List<Player> players; }  // players passed in from outside',
  },
  composition: {
    label: 'Composition',
    arrow: `House ◆───────────── Room
     "part-of, OWNS it"  (filled ◆ at the owner)`,
    strength: 3,
    story: <span><b>Composition</b> 🧱 — "part-of, strong ownership". The house <i>creates</i> its rooms
      inside its own constructor and never gives them away. Delete the house — the rooms vanish with it.
      A room without a house makes no sense. The part dies with the whole.</span>,
    java: 'class House { private final List<Room> rooms = new ArrayList<>(); }  // built inside',
  },
  dependency: {
    label: 'Dependency',
    arrow: `Order ┄┄┄┄┄┄┄┄┄┄┄▶ EmailService
       "uses-a"  (dashed arrow, just for a moment)`,
    strength: 0,
    story: <span><b>Dependency</b> ⚡ — "uses-a, briefly". The order does not <i>keep</i> the email service
      as a field. It just receives it as a method parameter, uses it once, and forgets it. The weakest
      link of all. Full story on Day 7.</span>,
    java: 'void checkout(EmailService mail) { mail.send(...); }  // parameter, not a field',
  },
}
const REL_KEYS = ['dependency', 'association', 'aggregation', 'composition']

function RelationshipExplorer() {
  const [rel, setRel] = useState('association')
  const d = REL_DATA[rel]
  return (
    <div className="panel">
      <div className="ptitle">Live demo · click each relationship and compare</div>
      <div className="modbtns">
        {REL_KEYS.map((k) => (
          <button key={k} className={rel === k ? 'on' : ''} onClick={() => setRel(k)}>
            {REL_DATA[k].label}
          </button>
        ))}
      </div>
      <Code html={d.arrow} />
      <table className="matrix">
        <thead>
          <tr><th>Question</th><th>Answer for {d.label}</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Is it kept as a field?</td>
            <td className={d.strength >= 1 ? 'yes' : 'no'}>{d.strength >= 1 ? '✔ yes' : '✘ no — only used inside a method'}</td>
          </tr>
          <tr>
            <td>Does the whole "own" the part?</td>
            <td className={d.strength >= 2 ? 'yes' : 'no'}>{d.strength >= 2 ? '✔ yes' : '✘ no'}</td>
          </tr>
          <tr>
            <td>Does the part die with the whole?</td>
            <td className={d.strength >= 3 ? 'yes' : 'no'}>{d.strength >= 3 ? '✔ yes — same lifecycle' : '✘ no — it survives'}</td>
          </tr>
        </tbody>
      </table>
      <div className="statbar">
        🔗 <span>Bond strength:</span>
        <b>{'●'.repeat(d.strength + 1)}{'○'.repeat(3 - d.strength)} {' '}
          {['weakest (uses-a)', 'weak (knows-a)', 'medium (has-a)', 'strongest (part-of)'][d.strength]}</b>
      </div>
      <div className="modexplain">{d.story}<br /><br /><C>{d.java}</C></div>
    </div>
  )
}

/* ============ Interactive 2: Lifecycle demo — delete the university ============ */
function LifecycleDemo() {
  const [uniAlive, setUniAlive] = useState(true)
  const [depts, setDepts] = useState(['CS'])
  const [students, setStudents] = useState([{ id: 1, name: 'Asha' }])
  const [msg, setMsg] = useState('')

  const DEPT_NAMES = ['CS', 'Math', 'Physics', 'Law', 'Arts', 'Music']
  const STUDENT_NAMES = ['Asha', 'Ravi', 'Meera', 'Kabir', 'Zoya', 'Arjun']

  function addDept() {
    if (!uniAlive) { setMsg('No university exists. Composition parts cannot exist alone — build the university first.'); return }
    if (depts.length >= 4) { setMsg('Demo limit reached 🙂'); return }
    setDepts((d) => [...d, DEPT_NAMES[d.length % DEPT_NAMES.length]])
    setMsg('The university CREATED this department inside itself. It owns it. (Composition ◆)')
  }
  function enroll() {
    if (students.length >= 4) { setMsg('Demo limit reached 🙂'); return }
    setStudents((s) => [...s, { id: s.length + 1, name: STUDENT_NAMES[s.length % STUDENT_NAMES.length] }])
    setMsg(uniAlive
      ? 'This student was created OUTSIDE and handed to the university. (Aggregation ◇)'
      : 'Students exist on their own — no university needed. That is the point of aggregation.')
  }
  function deleteUni() {
    if (!uniAlive) return
    setUniAlive(false)
    setDepts([])
    setMsg('💥 University deleted. Departments died with it (composition). Students survived (aggregation) — they can enroll elsewhere.')
  }
  function rebuild() {
    setUniAlive(true)
    setDepts(['CS'])
    setMsg('A new university is born, and it built its own fresh departments inside.')
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · who dies with the university, who survives?</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={addDept}>uni.addDepartment()</button>
        <button className="act" onClick={enroll}>new Student() + enroll</button>
        {uniAlive
          ? <button className="ghost act" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={deleteUni}>uni = null (delete!)</button>
          : <button className="ghost act" onClick={rebuild}>new University()</button>}
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>
        HEAP MEMORY
      </div>
      <div className="heap">
        {uniAlive ? (
          <div className="obj" style={{ minWidth: 230 }}>
            <div className="oref">uni → University@9c4e</div>
            <div className="ofield">name = "GreenHill University"</div>
            <div className="ofield" style={{ marginTop: 6 }}>◆ departments (created inside, owned):</div>
            {depts.map((d) => (
              <div className="ofield" key={d} style={{ paddingLeft: 14 }}>└ Department("{d}")</div>
            ))}
            <div className="ofield" style={{ marginTop: 6 }}>◇ enrolled (references to outside objects):</div>
            {students.map((s) => (
              <div className="ofield" key={s.id} style={{ paddingLeft: 14 }}>└ → Student@{(s.id * 7919).toString(16)}</div>
            ))}
          </div>
        ) : (
          <div className="obj" style={{ minWidth: 230, opacity: 0.45, borderStyle: 'dashed' }}>
            <div className="oref">uni → null</div>
            <div className="ofield">University object: ☠️ garbage collected</div>
            <div className="ofield">Departments: ☠️ gone with it (composition)</div>
          </div>
        )}
        {students.map((s) => (
          <div className="obj" key={s.id}>
            <div className="oref">s{s.id} → Student@{(s.id * 7919).toString(16)}</div>
            <div className="ofield">name = "{s.name}"</div>
            <div className="ofield">alive = <b>true</b> ✅</div>
          </div>
        ))}
      </div>
      {msg && <div className="statbar">💡 <span>{msg}</span></div>}
    </div>
  )
}

/* ============ Interactive 3: Guess the relationship ============ */
const SCENARIOS = [
  { s: 'A Car and its Engine. The car creates the engine in its constructor and never shares it.',
    a: 'composition', why: 'The engine is built inside the car and dies with it — strong ownership, same lifecycle.' },
  { s: 'A Playlist and Songs. Songs exist in the music library; many playlists can include the same song.',
    a: 'aggregation', why: 'The playlist has songs but does not own them. Delete the playlist — songs still exist in the library.' },
  { s: 'A Doctor and a Patient. The patient keeps a reference to their doctor for appointments.',
    a: 'association', why: 'They simply know each other. Both live independent lives; neither owns the other.' },
  { s: 'A ReportGenerator method receives a PdfWriter as a parameter, uses it once, and returns.',
    a: 'dependency', why: 'No field is kept. It only uses the object briefly inside one method — the weakest link.' },
  { s: 'A human Body and its Heart.',
    a: 'composition', why: 'A heart cannot exist usefully outside a body, and it dies with the body — classic composition.' },
  { s: 'A University and its Professors. Professors can quit and join another university.',
    a: 'aggregation', why: 'The university has professors, but they exist independently and can move — weak ownership.' },
]
const CHOICES = ['association', 'aggregation', 'composition', 'dependency']

function GuessGame() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = idx >= SCENARIOS.length
  const cur = SCENARIOS[idx]

  function pick(c) {
    if (picked !== null) return
    setPicked(c)
    if (c === cur.a) setScore((s) => s + 1)
  }
  function next() { setPicked(null); setIdx((i) => i + 1) }
  function restart() { setIdx(0); setPicked(null); setScore(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · you are the designer — pick the right bond</div>
      {done ? (
        <div>
          <p style={{ fontSize: 15 }}>🎉 Done! Your score: <b>{score} / {SCENARIOS.length}</b>{score === SCENARIOS.length ? ' — perfect!' : '. Replay the ones you missed.'}</p>
          <button className="act" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div>
          <div className="statbar" style={{ marginBottom: 12 }}>
            📦 <span>Scenario {idx + 1} of {SCENARIOS.length} · score {score}</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{cur.s}</p>
          <div className="modbtns">
            {CHOICES.map((c) => {
              let cls = ''
              if (picked !== null) {
                if (c === cur.a) cls = 'on'
              }
              return (
                <button key={c} className={cls}
                  style={picked !== null && picked === c && c !== cur.a ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
                  onClick={() => pick(c)}>
                  {c}
                </button>
              )
            })}
          </div>
          {picked !== null && (
            <div className="modexplain">
              {picked === cur.a ? '✅ Correct! ' : <span>❌ Not quite — it is <b>{cur.a}</b>. </span>}
              {cur.why}
              <div style={{ marginTop: 10 }}>
                <button className="ghost act" onClick={next}>Next scenario →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'Inheritance is an "is-a" relationship. Association, aggregation and composition are all forms of…',
    o: ['"is-a"', '"has-a" / "knows-a"', '"does-a"', 'They are also "is-a"'], a: 1,
    e: 'Relationships between separate objects are "has-a" (or "knows-a"/"uses-a"). is-a means one class IS a kind of another (extends). A car HAS an engine; a car IS a vehicle.' },
  { q: 'In composition, what happens to the parts when the whole is destroyed?',
    o: ['They survive and can be reused', 'They die with the whole', 'They move to another owner automatically', 'Java throws an exception'], a: 1,
    e: 'Composition = same lifecycle. The whole creates and owns its parts; when nothing references the whole, the GC collects it AND its parts (nobody else holds them).' },
  { q: 'A Team object receives already-created Player objects through its constructor. Players can join other teams later. This is…',
    o: ['Composition', 'Aggregation', 'Inheritance', 'Dependency'], a: 1,
    e: 'Parts created outside and handed in, living independently of the whole = aggregation (hollow diamond ◇). Composition would create the players inside and never share them.' },
  { q: 'In UML, a FILLED diamond ◆ on a line means…',
    o: ['Aggregation, drawn at the part', 'Composition, drawn at the owner (whole)', 'Composition, drawn at the part', 'Association with multiplicity'], a: 1,
    e: 'Filled diamond ◆ = composition, and the diamond always sits on the OWNER side (the whole). Hollow ◇ = aggregation, also on the owner side.' },
  { q: 'Which code line creates the STRONGEST bond between Car and Engine?',
    o: ['void service(Engine e) { e.check(); }', 'class Car { Engine e; Car(Engine e){ this.e = e; } }', 'class Car { private final Engine e = new Engine(); }', 'class Car extends Engine { }'], a: 2,
    e: 'Creating the engine INSIDE the car, private and final = composition, the strongest has-a bond. Option A is dependency, B is aggregation, D is wrong design (a car is not a kind of engine!).' },
  { q: 'Student has a Teacher field, and Teacher has a List<Student> field. What is this called, and is it free?',
    o: ['Bidirectional association — and it costs: both classes are now coupled', 'Composition — totally free', 'Inheritance — costs nothing', 'It is a compile error in Java'], a: 0,
    e: 'Both sides knowing each other = bidirectional association. It compiles fine, but now you must keep both sides in sync forever. Prefer one-directional unless you truly need both.' },
  { q: 'Delete a Playlist. Its Songs are still in the music library. Delete a House. Its Rooms are gone. Why the difference?',
    o: ['Songs are static, rooms are not', 'Playlist→Song is aggregation; House→Room is composition', 'Java treats lists differently from objects', 'Rooms are primitives'], a: 1,
    e: 'It is all about ownership and lifecycle. The playlist only POINTS at shared songs (aggregation). The house created and exclusively owns its rooms (composition), so they die together.' },
  { q: 'How does the Java garbage collector "delete the parts" in composition?',
    o: ['You must call delete() on each part', 'The compiler inserts destructor calls', 'When the whole becomes unreachable, its privately-held parts are unreachable too, so GC collects all of them', 'It does not — parts leak'], a: 2,
    e: 'Java has no destructors. Composition works by reachability: if ONLY the house references its rooms, then when the house is unreachable, the rooms are too — the GC sweeps the whole family.' },
]

/* ============ The page ============ */
export default function Day6() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 1 · Week 2 · Day 6</div>
        <h1>Association, Aggregation &amp; Composition:<br />How Objects Hold Hands</h1>
        <p>Week 1 taught you how to build single objects. Real systems are hundreds of objects
           <em> connected</em> to each other — and choosing the right kind of connection is half of LLD.
           Today you learn the three "has-a" bonds, how strong each one is, and who dies when the owner dies.
           Click everything.</p>
        <div className="chips">
          {['has-a', 'association', 'aggregation', 'composition', 'lifecycle', 'UML diamonds'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Why relationships matter (is-a vs has-a)</h2>
        <p>Think of a <strong>university campus</strong>. It is not one giant object. It is many objects working together:
          the university <em>has</em> departments, departments <em>have</em> professors, students <em>know</em> their teachers,
          the office <em>uses</em> a courier service to send letters. Each connection is different.</p>
        <p>In Week 1 you met one relationship already:</p>
        <ul>
          <li><strong>is-a</strong> (inheritance, Day 3): <C>class Dog extends Animal</C>. A dog <em>IS a</em> kind of animal.</li>
          <li><strong>has-a</strong> (today): <C>class Car {'{'} Engine engine; {'}'}</C>. A car <em>HAS an</em> engine. The car is <strong>not</strong> a kind of engine!</li>
        </ul>
        <p>Today's three bonds are all flavors of has-a/knows-a. The only thing that separates them is
          <strong> ownership</strong> and <strong>lifecycle</strong> — who creates the part, and who dies when.</p>
        <Code html={`  THE STRENGTH LADDER (weak → strong)

  dependency      "uses-a"     ┄┄┄▶   borrows it for one method call
  association     "knows-a"    ───▶   keeps a reference, no ownership
  aggregation     "has-a"      ◇───   has parts, but parts live on their own
  composition     "part-of"    ◆───   creates & owns parts; parts die with it`} />
        <Note><strong>One-line memory trick:</strong> the question that decides everything is —
          <em>"if the whole is deleted, does the part survive?"</em> Survives → aggregation (or weaker).
          Dies → composition.</Note>
        <Reveal summary="Why do interviewers care so much about this? Click to reveal.">
          <p>Every classic LLD problem (Parking Lot, BookMyShow, Elevator — Month 3) is graded on how you connect
            classes. Saying "ParkingLot <strong>is composed of</strong> ParkingFloors, and <strong>aggregates</strong> Vehicles"
            shows you think about lifecycles. Also, UML diagrams in interviews use exactly these arrows and diamonds —
            drawing the wrong diamond is an instant red flag.</p>
        </Reveal>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Association — "knows-a"</h2>
        <p>The simplest bond. One object keeps a <strong>reference</strong> to another, so it can call its methods.
          Both objects are created independently, live independently, and die independently. A student knows a teacher;
          neither owns the other.</p>
        <Code html={`<span class="kw">public class</span> Teacher {
    <span class="kw">private</span> String name;
    <span class="kw">public</span> Teacher(String name) { <span class="kw">this</span>.name = name; }
    <span class="kw">public</span> String getName()      { <span class="kw">return</span> name; }
}

<span class="kw">public class</span> Student {
    <span class="kw">private</span> String name;
    <span class="kw">private</span> Teacher mentor;      <span class="cm">// 🤝 association: I KNOW a teacher</span>

    <span class="kw">public</span> Student(String name) { <span class="kw">this</span>.name = name; }

    <span class="kw">public void</span> setMentor(Teacher t) {
        <span class="kw">this</span>.mentor = t;          <span class="cm">// reference handed in from outside</span>
    }
    <span class="kw">public void</span> askDoubt() {
        System.out.println(name + <span class="str">" asks "</span> + mentor.getName());
    }
}

<span class="cm">// both born separately, both die separately:</span>
Teacher t = <span class="kw">new</span> Teacher(<span class="str">"Dr. Rao"</span>);
Student s = <span class="kw">new</span> Student(<span class="str">"Asha"</span>);
s.setMentor(t);                       <span class="cm">// now they are associated</span>
s = <span class="kw">null</span>;                             <span class="cm">// student gone… teacher t is perfectly fine ✅</span>`} />
        <p>Two details interviewers ask about:</p>
        <ul>
          <li><strong>Direction.</strong> Above, Student → Teacher is <strong>one-directional</strong>: the student knows the
            teacher, the teacher does not keep a list of students. If both sides keep references, it is
            <strong> bidirectional</strong> — more power, but now two things must stay in sync. Prefer one direction.</li>
          <li><strong>Multiplicity.</strong> How many on each side? One student ↔ one mentor (1–1)? One teacher ↔ many
            students (1–N)? Many ↔ many (N–N, like students and courses)? In code, "many" simply means a
            <C>List</C> field. You will draw these numbers on UML lines on Day 8.</li>
        </ul>
        <Reveal summary={<>Quick check: is <C>String name;</C> inside Student an association with the String class? Click to reveal.</>}>
          <p>Technically every object field is a reference, yes — but we only <em>call</em> it an association when both
            classes are <strong>domain objects you designed</strong> (Student, Teacher, Order…). Tiny value types like
            <C>String</C>, <C>int</C>, <C>LocalDate</C> are treated as plain attributes, not relationships. Your UML
            diagram would drown otherwise.</p>
        </Reveal>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🔗 Play: The Relationship Explorer</h2>
        <p>Click each of the four bonds. For each one, watch the UML arrow change, and read the three yes/no
          questions in the table — those three questions are the <strong>exact decision procedure</strong> you will
          use in every design interview. Notice the bond getting stronger left to right.</p>
        <RelationshipExplorer />
        <Good><strong>What you should notice:</strong> ① Only the "kept as a field?" question separates dependency from
          association. ② Only the "dies with the whole?" question separates aggregation from composition.
          ③ The UML symbols (plain arrow, dashed arrow, ◇, ◆) map one-to-one to the four bonds — learn them now,
          they are the alphabet of Day 8.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Aggregation — "has-a, but does not own"</h2>
        <p>Aggregation is association with a <strong>whole–part feeling</strong>. The team <em>has</em> players.
          But the players were created <strong>outside</strong> the team and handed in — and if the team is deleted,
          the players happily continue to exist (and can join another team).</p>
        <Code html={`<span class="kw">public class</span> Player {
    <span class="kw">private</span> String name;
    <span class="kw">public</span> Player(String name) { <span class="kw">this</span>.name = name; }
}

<span class="kw">public class</span> Team {
    <span class="kw">private</span> String name;
    <span class="kw">private</span> List&lt;Player&gt; players = <span class="kw">new</span> ArrayList&lt;&gt;();  <span class="cm">// ◇ has players</span>

    <span class="kw">public</span> Team(String name) { <span class="kw">this</span>.name = name; }

    <span class="kw">public void</span> addPlayer(Player p) {   <span class="cm">// ⬅ part comes from OUTSIDE</span>
        players.add(p);                   <span class="cm">// we only store a reference</span>
    }
}

Player p1 = <span class="kw">new</span> Player(<span class="str">"Rohit"</span>);     <span class="cm">// player born independently</span>
Team mumbai = <span class="kw">new</span> Team(<span class="str">"Mumbai"</span>);
mumbai.addPlayer(p1);                   <span class="cm">// joins the team</span>

mumbai = <span class="kw">null</span>;                          <span class="cm">// 💥 team garbage-collected…</span>
<span class="cm">// …but p1 still points to the Player. He is alive ✅ and can join Chennai.</span>`} />
        <p>The fingerprints of aggregation in code:</p>
        <ul>
          <li>The part arrives through a <strong>constructor parameter or setter/add method</strong> — the whole never calls <C>new</C> for it.</li>
          <li>The <strong>same part can be shared</strong> by several wholes (one Player, many Teams over a career; one Song, many Playlists).</li>
          <li>Deleting the whole only deletes <strong>the references</strong>, not the part objects.</li>
        </ul>
        <Note><strong>Aggregation = a club, not a cage.</strong> Members walk in, members can walk out, and the club
          closing down does not end anyone's life.</Note>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Composition — "part-of, owns it, dies together"</h2>
        <p>The strongest bond. The whole <strong>creates its parts inside itself</strong>, keeps them
          <C>private</C>, and <strong>never hands them out</strong>. The part has no meaning alone — a Room without
          a House, a Heart without a Body, an OrderLine without an Order. One lifecycle, shared by both.</p>
        <Code html={`<span class="kw">public class</span> Room {
    <span class="kw">private</span> String type;
    <span class="kw">public</span> Room(String type) { <span class="kw">this</span>.type = type; }
}

<span class="kw">public class</span> House {
    <span class="cm">// ◆ composition: created INSIDE, private, final — never escapes</span>
    <span class="kw">private final</span> List&lt;Room&gt; rooms = <span class="kw">new</span> ArrayList&lt;&gt;();

    <span class="kw">public</span> House(<span class="kw">int</span> bedrooms) {
        rooms.add(<span class="kw">new</span> Room(<span class="str">"Kitchen"</span>));        <span class="cm">// the house BUILDS its own rooms</span>
        <span class="kw">for</span> (<span class="kw">int</span> i = <span class="num">0</span>; i &lt; bedrooms; i++) {
            rooms.add(<span class="kw">new</span> Room(<span class="str">"Bedroom"</span>));
        }
    }
    <span class="cm">// ❗ no getRooms() that leaks the real list — outsiders never grab the parts</span>
    <span class="kw">public int</span> roomCount() { <span class="kw">return</span> rooms.size(); }
}

House h = <span class="kw">new</span> House(<span class="num">2</span>);   <span class="cm">// house + its 3 rooms are born together</span>
h = <span class="kw">null</span>;                  <span class="cm">// house unreachable → its rooms unreachable → GC takes ALL of them ⚰️</span>`} />
        <p>How does "the parts die" actually work in Java? There is no <C>delete</C> keyword. It is pure
          <strong> reachability</strong> (remember GC from Day 1): the rooms were only ever referenced by the house.
          When the house becomes unreachable, the rooms automatically become unreachable too, and the garbage
          collector sweeps the whole family in one go.</p>
        <Warn><strong>The leak that silently downgrades composition:</strong> if you write
          <C>public List&lt;Room&gt; getRooms() {'{'} return rooms; {'}'}</C>, outsiders can now hold the parts. Your
          "composition" just became aggregation, and your class invariants can be broken from outside. This is
          exactly the <strong>defensive copying</strong> lesson from Day 2 — return a copy if you must show the rooms.</Warn>
        <Reveal summary="Bonus: composition is also the engine of design patterns. Click to reveal.">
          <p>Decorator, Composite, Strategy, Bridge (Month 2) are all built on one idea: <em>hold another object as a
            field and delegate work to it</em>. The famous rule <strong>"favor composition over inheritance"</strong> —
            Day 7's headline — means: before writing <C>extends</C>, ask if a has-a field does the job with less coupling.</p>
        </Reveal>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>💥 Play: Delete the university, see who survives</h2>
        <p>GreenHill University <strong>creates departments inside itself</strong> (composition ◆) and
          <strong> enrolls students that were created outside</strong> (aggregation ◇). Add a few of each.
          Then predict before clicking: when you set <C>uni = null</C>, who dies and who survives?</p>
        <LifecycleDemo />
        <Good><strong>What you should notice:</strong> ① Departments only ever existed <em>inside</em> the university card —
          when it went, they went, because nothing else referenced them. ② Student objects are separate cards in the
          heap with their own references (<C>s1</C>, <C>s2</C>…), so the university's death cannot touch them.
          ③ Rebuilding the university gives <em>fresh</em> departments — composed parts are never recycled from a dead whole.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>How to decide + how UML draws it</h2>
        <p>Use these three questions, in order, on any pair of classes:</p>
        <ol>
          <li><strong>Do I keep it as a field?</strong> No → it is just a <em>dependency</em> (uses-a). Stop here.</li>
          <li><strong>Is it a whole–part situation?</strong> No, they are just two peers who talk → <em>association</em>. Stop here.</li>
          <li><strong>Does the part die with the whole / is it created inside and never shared?</strong>
            No → <em>aggregation</em>. Yes → <em>composition</em>.</li>
        </ol>
        <Code html={`  UML CHEAT-ARROWS  (the diamond ALWAYS sits on the owner/whole side)

  association   Student ──────────▶ Teacher        plain line (arrow = direction)
  aggregation   Team    ◇────────── Player          hollow diamond at Team
  composition   House   ◆────────── Room            filled diamond at House
  dependency    Order   ┄┄┄┄┄┄┄┄┄▶ EmailService     dashed arrow

  multiplicity examples:
  Team ◇──── <span class="num">11</span> Player      a team has 11 players
  House ◆──── <span class="num">1</span>..* Room     a house has 1 or more rooms`} />
        <table className="matrix">
          <thead>
            <tr><th></th><th>association</th><th>aggregation</th><th>composition</th></tr>
          </thead>
          <tbody>
            <tr><td>Bond meaning</td><td>knows-a</td><td>has-a (weak)</td><td>part-of (strong)</td></tr>
            <tr><td>Who creates the part?</td><td>outside</td><td>outside</td><td className="yes">the whole, inside</td></tr>
            <tr><td>Part shared with others?</td><td className="yes">can be</td><td className="yes">can be</td><td className="no">never</td></tr>
            <tr><td>Part survives the whole?</td><td className="yes">yes</td><td className="yes">yes</td><td className="no">no — dies with it</td></tr>
            <tr><td>Example</td><td>Student–Teacher</td><td>Team–Player</td><td>House–Room</td></tr>
          </tbody>
        </table>
        <Reveal summary="Honest interview tip about aggregation vs composition — click to reveal.">
          <p>Even senior engineers debate borderline cases (is Car–Wheel aggregation or composition? Wheels CAN be moved
            to another car…). Interviewers do not want the "one true answer" — they want your <strong>reasoning about
            lifecycle and ownership</strong>. Say out loud: "I'll make it composition because in my design nobody else
            needs the wheels, so the car owns them." That sentence scores the points.</p>
        </Reveal>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>🎯 Play: You are the designer</h2>
        <p>Six real scenarios. For each, run the three decision questions in your head, <strong>predict</strong>,
          then click. The explanations matter more than the score.</p>
        <GuessGame />
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Using inheritance where has-a belongs</h3>
        <Code html={`<span class="kw">class</span> Car <span class="kw">extends</span> Engine { }          <span class="cm">// ❌ a car is NOT a kind of engine!</span>
<span class="kw">class</span> Car { <span class="kw">private</span> Engine engine; }   <span class="cm">// ✅ a car HAS an engine</span>`} />
        <p>The test: say it in English. "Car is an Engine" sounds wrong → it is not inheritance. This single mistake
          ruins more beginner designs than any other.</p>
        <h3>Trap 2 — Leaking composed parts</h3>
        <Code html={`<span class="kw">public</span> List&lt;Room&gt; getRooms() { <span class="kw">return</span> rooms; }        <span class="cm">// ❌ outsiders now own your parts</span>
<span class="kw">public</span> List&lt;Room&gt; getRooms() { <span class="kw">return</span> List.copyOf(rooms); } <span class="cm">// ✅ show a copy (Day 2!)</span>`} />
        <h3>Trap 3 — Bidirectional everything</h3>
        <p>Beginners make every association two-way "just in case": Student knows Teacher AND Teacher holds all
          Students. Now every enroll/unenroll must update <strong>two</strong> places, forever, or your data lies.
          Add the second direction only when a real use-case needs it.</p>
        <h3>Trap 4 — Confusing "deleting the list" with "deleting the objects"</h3>
        <Code html={`team.getPlayers().clear();   <span class="cm">// removes REFERENCES from the team's list</span>
<span class="cm">// the Player objects still exist if anyone else references them — GC only takes unreachable ones</span>`} />
        <h3>Trap 5 — Thinking the diamond goes on the part</h3>
        <p>In UML the diamond (◇ or ◆) is drawn touching the <strong>whole/owner</strong> — Team, House — never the
          part. Drawing it on the Player side reverses the meaning of your diagram.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>is-a</strong> = inheritance (<C>extends</C>). <strong>has-a / knows-a / uses-a</strong> = today's relationships between separate objects.</li>
          <li><strong>Dependency</strong> ┄▶ uses-a: object received as a method parameter, used briefly, not stored.</li>
          <li><strong>Association</strong> ─▶ knows-a: keeps a reference; both objects fully independent. Can be one-directional (prefer) or bidirectional; multiplicity 1–1, 1–N, N–N.</li>
          <li><strong>Aggregation</strong> ◇─ has-a, weak: parts created outside, handed in, shareable, survive the whole. Club, not cage.</li>
          <li><strong>Composition</strong> ◆─ part-of, strong: parts created inside, <C>private final</C>, never leaked, die with the whole (via GC reachability).</li>
          <li>Decision questions: kept as a field? → whole–part? → dies with the whole? Each "yes" climbs the ladder.</li>
          <li>UML: diamond always on the <strong>owner</strong> side. Filled ◆ = composition, hollow ◇ = aggregation, dashed ┄▶ = dependency.</li>
          <li>Leaking a composed part through a getter silently turns composition into aggregation — return copies.</li>
          <li>Coming next: <strong>favor composition over inheritance</strong> — the most quoted design rule in existence.</li>
        </ul>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 6 complete?</strong> Homework: model a <C>Library</C> system in your IDE — a <C>Library</C> that
        composes <C>Shelf</C> objects (created inside, never leaked), aggregates <C>Book</C> objects (added from outside,
        survive the library), and a <C>Member</C> with a one-directional association to the library. Prove the lifecycles
        in <C>main</C>: null out the library and show books and members still work.
        <br /><br />
        Next: <strong>Day 7 — Dependency &amp; Composition over Inheritance</strong>: the weakest relationship done right,
        coupling, and why the pros reach for has-a before extends.
      </div>
    </div>
  )
}
