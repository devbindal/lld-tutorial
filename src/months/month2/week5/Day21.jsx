import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The instance lab ============ */
function InstanceLab() {
  const [world, setWorld] = useState('normal')
  const [objs, setObjs] = useState([])
  const [log, setLog] = useState(null)

  const reset = (w) => { setWorld(w); setObjs([]); setLog(null) }

  function create() {
    if (world === 'normal') {
      if (objs.length >= 4) { setLog('Demo limit 🙂 — but production has no limit…'); return }
      const addr = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')
      const dark = Math.random() > 0.5
      setObjs((o) => [...o, { addr, dark }])
      setLog(`new AppConfig() → AppConfig@${addr} created. That's ${objs.length + 1} "single" configs now…`)
    } else {
      setLog('❌ COMPILE ERROR: AppConfig() has private access. The constitution forbids self-made presidents.')
    }
  }
  function getInstance() {
    if (objs.length === 0) {
      setObjs([{ addr: '7e1a', dark: true }])
      setLog('getInstance() → first call: the ONE instance is created → AppConfig@7e1a')
    } else {
      setLog(`getInstance() → returns the SAME AppConfig@${objs[0].addr}. No new object. Ever.`)
    }
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one app, one config… or is it?</div>
      <div className="modbtns">
        <button className={world === 'normal' ? 'on' : ''} onClick={() => reset('normal')}>😱 normal class</button>
        <button className={world === 'singleton' ? 'on' : ''} onClick={() => reset('singleton')}>1️⃣ singleton</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={create}>new AppConfig()</button>
        {world === 'singleton' && <button className="act" onClick={getInstance}>AppConfig.getInstance()</button>}
        <button className="ghost act" onClick={() => reset(world)}>reset</button>
      </div>
      <div className="heap">
        {objs.length === 0 ? (
          <div className="empty">{world === 'normal' ? 'Heap empty. Press new AppConfig() a few times.' : 'Heap empty. Try new first (watch it fail), then getInstance().'}</div>
        ) : (
          objs.map((o, i) => (
            <div className="obj" key={i} style={world === 'singleton' ? { borderColor: 'var(--blue)' } : {}}>
              <div className="oref">{world === 'singleton' ? 'THE instance' : `config${i + 1}`} → AppConfig@{o.addr}</div>
              <div className="ofield">darkMode = {String(o.dark)}</div>
              <div className="ofield">currency = "INR"</div>
            </div>
          ))
        )}
      </div>
      {world === 'normal' && objs.length >= 2 && (
        <div className="statbar" style={{ background: '#FDECEC' }}>
          💥 <span>config1 says darkMode={String(objs[0].dark)}, config{objs.length} says darkMode={String(objs[objs.length - 1].dark)} — half the app reads one, half the other. "Shared settings" that aren't shared.</span>
        </div>
      )}
      {log && (
        <div className="statbar" style={{ display: 'block' }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{log}</span>
        </div>
      )}
    </div>
  )
}

/* ============ Interactive 2: The thread race ============ */
const RACE_UNSAFE = [
  { t1: 'if (instance == null)  → sees null ✓', t2: '— sleeping —', note: 'Thread-1 checks: no instance yet. So far so good.' },
  { t1: '⏸️ paused by the OS scheduler!', t2: '— sleeping —', note: 'Right between the CHECK and the CREATE, the scheduler pauses T1. Threads can be interrupted between ANY two lines.' },
  { t1: '⏸️ paused…', t2: 'if (instance == null)  → ALSO sees null ✓', note: 'Thread-2 runs the same check. T1 never finished creating — so T2 also sees null!' },
  { t1: '⏸️ paused…', t2: 'instance = new AppConfig()  → @b2', note: 'Thread-2 creates an instance and returns it. Half the app now holds @b2.' },
  { t1: '▶️ resumes: instance = new AppConfig() → @a1', t2: 'done (returned @b2)', note: 'T1 wakes up where it left off — past the null check! It creates a SECOND instance and overwrites the field.' },
  { t1: 'returns @a1', t2: 'holds @b2', note: '💥 TWO "singletons" exist. Caches diverge, settings disagree, and the bug appears once a week, only under load. The worst kind.' },
]
const RACE_SAFE = [
  { t1: 'enters synchronized getInstance() 🔒', t2: '— arrives —', note: 'Thread-1 takes the lock on the way in. Only one thread can hold it.' },
  { t1: 'if (instance == null) → null ✓', t2: '🚧 BLOCKED at the lock, waiting…', note: 'Thread-2 also calls getInstance() — and simply waits at the door. No interleaving possible inside.' },
  { t1: 'instance = new AppConfig() → @a1, releases 🔓', t2: '🚧 still waiting…', note: 'T1 finishes the whole check-and-create as one uninterruptible unit, then releases the lock.' },
  { t1: 'done (returned @a1)', t2: 'enters now: if (instance == null) → NOT null', note: 'T2 finally enters — and the check saves it: an instance already exists.' },
  { t1: 'holds @a1', t2: 'returns the SAME @a1 ✅', note: '🎉 One instance, no matter how unlucky the timing. That is what "thread-safe" means.' },
]

function ThreadRace() {
  const [mode, setMode] = useState('unsafe')
  const [step, setStep] = useState(-1)
  const steps = mode === 'unsafe' ? RACE_UNSAFE : RACE_SAFE
  const cur = step >= 0 ? steps[step] : null

  return (
    <div className="panel">
      <div className="ptitle">Live demo · two threads call getInstance() at the same moment</div>
      <div className="modbtns">
        <button className={mode === 'unsafe' ? 'on' : ''} onClick={() => { setMode('unsafe'); setStep(-1) }}>😱 lazy, unsynchronized</button>
        <button className={mode === 'safe' ? 'on' : ''} onClick={() => { setMode('safe'); setStep(-1) }}>🔒 synchronized</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="act" onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))} disabled={step >= steps.length - 1}>
          {step < 0 ? '▶ start the race' : 'next tick →'}
        </button>
        <button className="ghost act" onClick={() => setStep(-1)}>reset</button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {['t1', 't2'].map((t) => (
          <div className="obj" key={t} style={{ minWidth: 250, flex: 1 }}>
            <div className="oref">{t === 't1' ? '🧵 Thread-1' : '🧵 Thread-2'}</div>
            <div className="ofield" style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, minHeight: 38 }}>
              {cur ? cur[t] : 'waiting at the starting line…'}
            </div>
          </div>
        ))}
      </div>
      <div className="statbar" style={{ display: 'block', background: step === steps.length - 1 ? (mode === 'unsafe' ? '#FDECEC' : '#EAF7EF') : '#FFF6E8' }}>
        {cur ? <span>tick {step + 1}/{steps.length} — {cur.note}</span> : <span>Press play. Watch what the scheduler does between the CHECK and the CREATE.</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 3: The implementation picker ============ */
const IMPLS = {
  eager: {
    label: 'eager',
    code: `<span class="kw">public class</span> AppConfig {
    <span class="kw">private static final</span> AppConfig INSTANCE = <span class="kw">new</span> AppConfig();  <span class="cm">// born at class load</span>
    <span class="kw">private</span> AppConfig() {}
    <span class="kw">public static</span> AppConfig getInstance() { <span class="kw">return</span> INSTANCE; }
}`,
    score: { lazy: 0, safe: 1, simple: 1, bullet: 0 },
    verdict: 'Thread-safe for FREE (the JVM guarantees class initialization happens once). Not lazy — but honestly, your config was going to be used anyway. Underrated default.',
  },
  lazyNaive: {
    label: 'lazy (broken!)',
    code: `<span class="kw">private static</span> AppConfig instance;
<span class="kw">public static</span> AppConfig getInstance() {
    <span class="kw">if</span> (instance == <span class="kw">null</span>)              <span class="cm">// ⚡ two threads can both pass this line!</span>
        instance = <span class="kw">new</span> AppConfig();
    <span class="kw">return</span> instance;
}`,
    score: { lazy: 1, safe: 0, simple: 1, bullet: 0 },
    verdict: '🚨 The race you just watched. Fine in a guaranteed single-threaded world; a once-a-week heisenbug everywhere else. Never ship this.',
  },
  sync: {
    label: 'synchronized',
    code: `<span class="kw">public static synchronized</span> AppConfig getInstance() {
    <span class="kw">if</span> (instance == <span class="kw">null</span>) instance = <span class="kw">new</span> AppConfig();
    <span class="kw">return</span> instance;
}`,
    score: { lazy: 1, safe: 1, simple: 1, bullet: 0 },
    verdict: 'Correct — but EVERY call pays for the lock forever, even the millionth read after creation. Acceptable for rarely-called singletons; clunky for hot paths.',
  },
  dcl: {
    label: 'double-checked',
    code: `<span class="kw">private static volatile</span> AppConfig instance;   <span class="cm">// volatile is NOT optional!</span>
<span class="kw">public static</span> AppConfig getInstance() {
    <span class="kw">if</span> (instance == <span class="kw">null</span>) {                    <span class="cm">// check 1: no lock (fast path)</span>
        <span class="kw">synchronized</span> (AppConfig.<span class="kw">class</span>) {
            <span class="kw">if</span> (instance == <span class="kw">null</span>)              <span class="cm">// check 2: with lock</span>
                instance = <span class="kw">new</span> AppConfig();
        }
    }
    <span class="kw">return</span> instance;
}`,
    score: { lazy: 1, safe: 1, simple: 0, bullet: 0 },
    verdict: 'Lazy + fast (lock only on first calls). But subtle: without volatile, threads can see a HALF-CONSTRUCTED object (instruction reordering). Famous interview question; easy to write wrong.',
  },
  holder: {
    label: 'holder idiom',
    code: `<span class="kw">public class</span> AppConfig {
    <span class="kw">private</span> AppConfig() {}
    <span class="kw">private static class</span> Holder {                       <span class="cm">// not loaded until first use!</span>
        <span class="kw">static final</span> AppConfig INSTANCE = <span class="kw">new</span> AppConfig();
    }
    <span class="kw">public static</span> AppConfig getInstance() { <span class="kw">return</span> Holder.INSTANCE; }
}`,
    score: { lazy: 1, safe: 1, simple: 1, bullet: 0 },
    verdict: '🏆 The classic answer: lazy (inner class loads on first getInstance) + thread-safe (JVM class-init guarantee) + zero locking code. Best of both, no cleverness to get wrong.',
  },
  enumImpl: {
    label: 'enum',
    code: `<span class="kw">public enum</span> AppConfig {
    INSTANCE;                                  <span class="cm">// one constant = one instance (Day 19!)</span>
    <span class="kw">private final</span> Properties props = load();
    <span class="kw">public</span> String get(String key) { <span class="kw">return</span> props.getProperty(key); }
}
<span class="cm">// usage: AppConfig.INSTANCE.get("currency")</span>`,
    score: { lazy: 0, safe: 1, simple: 1, bullet: 1 },
    verdict: 'The bulletproof one (Effective Java\'s pick): thread-safe, AND immune to the reflection & serialization attacks that break all the others. Costs: can\'t extend a class, eager-ish. For most singletons: just use this.',
  },
}
const IMPL_KEYS = ['eager', 'lazyNaive', 'sync', 'dcl', 'holder', 'enumImpl']
const SCORE_LABELS = { lazy: 'lazy?', safe: 'thread-safe?', simple: 'simple to get right?', bullet: 'reflection/serialization-proof?' }

function ImplPicker() {
  const [impl, setImpl] = useState('eager')
  const d = IMPLS[impl]
  return (
    <div className="panel">
      <div className="ptitle">Live demo · six ways to build the one — compare the scorecards</div>
      <div className="modbtns">
        {IMPL_KEYS.map((k) => (
          <button key={k} className={impl === k ? 'on' : ''} onClick={() => setImpl(k)}>{IMPLS[k].label}</button>
        ))}
      </div>
      <Code html={d.code} />
      <table className="matrix">
        <tbody>
          {Object.entries(SCORE_LABELS).map(([k, label]) => (
            <tr key={k}>
              <td>{label}</td>
              <td className={d.score[k] ? 'yes' : 'no'}>{d.score[k] ? '✔' : '✘'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="modexplain">{d.verdict}</div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Singleton pattern guarantees…',
    o: ['A class with one method', 'Exactly ONE instance of a class exists, with one global access point to it', 'A class that cannot be tested', 'One class per file'], a: 1,
    e: 'Intent first, always: one instance + one official door (getInstance). Everything else — laziness, locks, enums — is implementation detail serving that intent.' },
  { q: 'Which Day-1 trick is the load-bearing wall of every singleton?',
    o: ['A static block', 'The PRIVATE constructor — outsiders cannot say new, so the class controls how many of itself exist', 'Method overloading', 'The this keyword'], a: 1,
    e: 'Day 1 promised the private-constructor trivia would pay off. If new is locked away, the only door is the one you provide — and you can make that door always return the same object.' },
  { q: 'Why does the unsynchronized lazy getInstance() create two instances under load?',
    o: ['Java has a bug', 'A thread can be paused BETWEEN the null-check and the creation — a second thread then also sees null, and both create', 'The garbage collector duplicates it', 'Because the field is private'], a: 1,
    e: 'Check-then-act is not atomic (you met this smell on Day 18!). The scheduler can interleave threads between any two lines. Result: a heisenbug that appears only under production load.' },
  { q: 'In double-checked locking, what is the volatile keyword for?',
    o: ['Speed', 'Without it, a thread may observe a HALF-CONSTRUCTED instance due to instruction reordering — volatile forbids that visibility problem', 'It makes the field private', 'It is decorative'], a: 1,
    e: 'The JIT may assign the reference before the constructor finishes. volatile establishes the ordering guarantee. DCL-without-volatile is the most famous "looks right, is wrong" snippet in Java.' },
  { q: 'Why is the static holder idiom considered the sweet spot for lazy singletons?',
    o: ['It uses the least memory', 'The inner class loads only on first use (lazy) and JVM class-initialization is guaranteed single-threaded (safe) — with zero locking code to get wrong', 'It allows multiple instances', 'It avoids static entirely'], a: 1,
    e: 'It outsources the hard part to the JVM\'s class-loading machinery, which has been thread-safe since forever. Lazy + safe + boring. Boring wins.' },
  { q: 'Why does Effective Java call the single-element ENUM the best singleton?',
    o: ['Enums are faster', 'It is immune to the reflection and serialization attacks that can mint second instances of all class-based singletons', 'It supports inheritance', 'It is the only lazy one'], a: 1,
    e: 'setAccessible(true) on a private constructor, or deserializing a stored singleton, quietly creates instance #2 of class-based versions. The JVM itself forbids both for enum constants (Day 19\'s teaser, paid off).' },
  { q: 'The MAIN design criticism of Singleton is…',
    o: ['It is slow', 'It is global mutable state with hidden dependencies: classes secretly call getInstance() instead of declaring needs in constructors — coupling everyone (Day 17) and making fakes impossible to inject (Day 15)', 'It uses too much memory', 'It cannot be thread-safe'], a: 1,
    e: 'The pattern\'s problem is rarely the "single"; it is the GLOBAL. Hidden reach-outs defeat dependency inversion, tests can\'t substitute fakes, and every user is invisibly coupled to shared mutable state.' },
  { q: 'The modern alternative for "I need exactly one of this service" is…',
    o: ['Make every method static', 'Create ONE instance at the composition root (main) and INJECT it wherever needed — single by wiring, not by self-enforcement', 'Use global variables', 'Clone it everywhere'], a: 1,
    e: 'Day 15\'s plug board already does this: new AppConfig() once in main, passed to whoever declares it in their constructor. You get oneness AND visible dependencies AND testability. Reserve true Singletons for loggers and genuinely global facts.' },
]

/* ============ The page ============ */
export default function Day21() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 5 · Day 21 · Creational Patterns</div>
        <h1>Singleton:<br />There Can Be Only One</h1>
        <p>Welcome to Month 2 — Design Patterns: the 23 famous, named arrangements of everything you built in
           Month 1. We start with the most famous and most misused of them all. You'll build it six ways, race
           two threads through it, break it, bulletproof it — and learn when NOT to use it. Click everything.</p>
        <div className="chips">
          {['design patterns', 'GoF', 'singleton', 'private constructor', 'thread safety', 'enum singleton'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>Welcome to pattern country (and the president)</h2>
        <p>First, what IS a design pattern? In 1994, four authors (the <strong>"Gang of Four"</strong>, GoF)
          catalogued 23 recurring solutions to recurring design problems and — crucially — <strong>gave them
          names</strong>. The value is the shared vocabulary: saying "use a Strategy here" transmits a whole
          design in two words. You already own every ingredient (Month 1); patterns are the famous recipes.</p>
        <p>Today's recipe, the <strong>Singleton</strong>, by analogy: a country has exactly <strong>one
          president at a time</strong>. Not zero, not two. There is one official channel to reach the office
          (you don't elect a personal president at home), and the constitution itself forbids self-proclaimed
          ones.</p>
        <Note><strong>Singleton's intent:</strong> ensure a class has exactly <strong>one instance</strong>, and
          provide a single <strong>global access point</strong> to it. Used for: app configuration, loggers,
          connection pools, caches — things that are genuinely one-per-application.</Note>
        <Code html={`        THE SINGLETON, IN UML (Day 8 notation — underline = static!)

   ┌────────────────────────────────┐
   │           AppConfig            │
   ├────────────────────────────────┤
   │ <u>- instance: AppConfig</u>          │  ← the ONE, stored on the class itself
   ├────────────────────────────────┤
   │ - AppConfig()                  │  ← PRIVATE constructor: the locked door
   │ <u>+ getInstance(): AppConfig</u>     │  ← the single official channel
   └────────────────────────────────┘
              ▲
              └── every caller, anywhere:  AppConfig.getInstance()`} />
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The recipe: three ingredients</h2>
        <p>Day 1 left you a clue: <em>"a private constructor blocks outsiders from doing new — that's how
          Singleton works."</em> Today it pays off. The whole pattern is three moves:</p>
        <Code html={`<span class="kw">public class</span> AppConfig {

    <span class="cm">// ① the one instance, held by the CLASS itself (static — Day 1's notice board)</span>
    <span class="kw">private static</span> AppConfig instance;

    <span class="cm">// ② PRIVATE constructor — "new AppConfig()" outside = compile error</span>
    <span class="kw">private</span> AppConfig() {
        <span class="cm">// load settings, open files… runs ONCE, ever</span>
    }

    <span class="cm">// ③ the official door — creates on first call, returns the same one after</span>
    <span class="kw">public static</span> AppConfig getInstance() {
        <span class="kw">if</span> (instance == <span class="kw">null</span>) {
            instance = <span class="kw">new</span> AppConfig();
        }
        <span class="kw">return</span> instance;
    }
}`} />
        <p>Why bother? Because without it, "shared" things quietly multiply: every module calls
          <C> new AppConfig()</C>, each copy loads its own settings, someone updates one of them… and the app
          disagrees with itself about its own configuration.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>1️⃣ Play: One config to rule them all</h2>
        <p>First spam <C>new AppConfig()</C> in the normal world and watch the "shared" settings split
          personalities. Then switch worlds and try BOTH buttons.</p>
        <InstanceLab />
        <Good><strong>What you should notice:</strong> ① In the normal world each <C>new</C> makes a fresh object
          with its own state — "shared settings" become a rumor. ② In singleton world <C>new</C> doesn't fail
          politely — it fails at COMPILE time. ③ Every <C>getInstance()</C> returns the same address — check the
          <C>@7e1a</C> never changes. One object, one truth.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The crack in the recipe: threads</h2>
        <p>The three-ingredient version above has a hidden bomb. The line pair</p>
        <Code html={`<span class="kw">if</span> (instance == <span class="kw">null</span>)        <span class="cm">// the CHECK</span>
    instance = <span class="kw">new</span> AppConfig();  <span class="cm">// the ACT</span>`} />
        <p>…is a <strong>check-then-act</strong> (the same smell Day 18 flagged in
          <C> if (balance &gt; amt) withdraw(amt)</C>). On a single thread it's fine. But real apps run many
          threads, and the operating system may pause any thread <strong>between any two lines</strong>. If the
          pause lands between the check and the act, a second thread sails through the same null-check… Watch it
          happen, tick by tick:</p>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🏁 Play: Two threads, one (?) instance</h2>
        <p>Step through the race in the broken world, then re-run it with <C>synchronized</C>. (Threads get a
          full week in Month 4 — today you just need to SEE the interleaving.)</p>
        <ThreadRace />
        <Good><strong>What you should notice:</strong> ① The bug needs the pause to land in a 2-line window — that's
          why it passes every test and fires monthly in production. ② <C>synchronized</C> makes check-and-create
          one uninterruptible unit: the second thread waits at the door and its null-check then saves it.
          ③ The cost: that lock is paid on EVERY call forever — which is why fancier variants exist…</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>🛠️ Play: Six ways to build the one</h2>
        <p>The full menu, from naive to bulletproof. Click through and compare scorecards. In an interview you
          should be able to write <strong>holder</strong> and <strong>enum</strong> from memory, and explain why
          <strong> double-checked</strong> needs <C>volatile</C>.</p>
        <ImplPicker />
        <Good><strong>What you should notice:</strong> ① "Lazy" is overrated — eager and enum are thread-safe by
          JVM guarantee with zero cleverness. ② The holder idiom gets laziness for free from class loading —
          elegance via boring machinery. ③ Only the enum survives the attacks coming in the next section.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Breaking singletons (yes, they can be broken)</h2>
        <p>Interviewers love this twist: the class-based singletons above can all be tricked into minting a
          second instance.</p>
        <Code html={`<span class="cm">// attack 1 — REFLECTION: picks the lock on the private constructor</span>
Constructor&lt;AppConfig&gt; c = AppConfig.<span class="kw">class</span>.getDeclaredConstructor();
c.setAccessible(<span class="kw">true</span>);                    <span class="cm">// "private? how adorable."</span>
AppConfig second = c.newInstance();      <span class="cm">// 💥 instance #2 exists</span>

<span class="cm">// attack 2 — SERIALIZATION: save the singleton, load it back…</span>
<span class="cm">// …and readObject() constructs a FRESH object. Also instance #2. 💥</span>`} />
        <ul>
          <li><strong>Reflection</strong> can flip <C>setAccessible</C> and call the private constructor anyway.
            (Defense: throw inside the constructor if instance != null — clunky but possible.)</li>
          <li><strong>Serialization</strong> creates a new object on every deserialize. (Defense: implement
            <C> readResolve()</C> returning the real instance — easy to forget.)</li>
          <li><strong>The enum needs no defenses:</strong> the JVM itself refuses to reflectively construct enum
            constants, and Java's serialization spec handles enums by name. That's why <em>Effective Java</em>
            crowns it. (Day 19's "bulletproof singleton" teaser — fully paid.)</li>
        </ul>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>The dark side: why seniors side-eye this pattern</h2>
        <p>Here's the twist for a pattern so famous: in modern codebases, Singleton is the pattern most often
          called an <strong>anti-pattern</strong>. The criticism is never about the "single" — it's about the
          <strong> global</strong>:</p>
        <ul>
          <li><strong>Hidden dependencies.</strong> <C>OrderService</C> secretly calls
            <C> Database.getInstance()</C> deep inside a method. Its constructor declares nothing — the class
            LIES about what it needs. (Day 15's hidden-new trap, with a pattern's blessing.)</li>
          <li><strong>Global mutable state.</strong> Everyone reads and writes the same object from anywhere —
            Day 17's <em>common coupling</em>, the second-worst rung of the ladder, in a trench coat.</li>
          <li><strong>Untestable neighbors.</strong> You can't inject a fake — getInstance() is hard-wired. Tests
            share state, can't run in parallel, and fail mysteriously in suites but pass alone.</li>
        </ul>
        <Note><strong>The modern resolution:</strong> separate the two ideas. <em>"Only one exists"</em> is a
          WIRING decision: create one instance at the composition root and inject it (Day 15's plug board) —
          single by configuration, visible in every constructor, fakeable in every test. Reserve the true
          self-enforcing Singleton for things that are genuinely process-global and harmless to share: loggers,
          metrics registries, feature-flag readers.</Note>
        <Reveal summary="So what do I say in an interview? Click to reveal.">
          <p>The complete answer has three beats: ① implement it correctly (holder or enum, and explain the
            thread race); ② name the criticisms (global state, hidden deps, testing) — this is what separates
            you; ③ offer the alternative (one instance via DI) and the legitimate use cases. "I can build it
            six ways, and here's when I wouldn't" is a senior answer.</p>
        </Reveal>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — Singleton-itis</h3>
        <p>Once you learn it, everything looks one-shaped: <C>UserManager.getInstance()</C>,
          <C> PriceCalculator.getInstance()</C>… If it holds business logic or per-request state, it is NOT
          one-per-app. Most "singletons" in the wild are just classes that never needed more than one instance —
          which injection handles better.</p>
        <h3>Trap 2 — Double-checked locking without volatile</h3>
        <p>Compiles, passes tests, publishes half-built objects under load. If you can't explain WHY volatile is
          there, use the holder idiom instead.</p>
        <h3>Trap 3 — The mutable singleton</h3>
        <p><C>AppConfig.getInstance().setCurrency("USD")</C> from anywhere = a global variable with extra steps.
          If it must be a singleton, make its state immutable after construction (Day 2, Day 20).</p>
        <h3>Trap 4 — Lazy worship</h3>
        <p>Engineers contort code to delay creating… a 2 KB config object that's needed at startup anyway. Eager
          (or enum) is simpler and equally correct for 95% of cases. Laziness must earn its complexity.</p>
        <h3>Trap 5 — Forgetting it's per-JVM</h3>
        <p>Run 4 server instances and your "singleton" exists 4 times. Cross-process oneness (one scheduler in a
          cluster) is a distributed-systems problem — locks, leases, databases — not a language pattern.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> exactly one instance + global access point. Ingredients: <C>private</C> constructor · static instance · static <C>getInstance()</C>.</li>
          <li><strong>Thread race:</strong> check-then-act isn't atomic → two instances. Fixes: <C>synchronized</C> (slow), DCL + <C>volatile</C> (subtle), <strong>holder idiom</strong> (lazy+safe+simple 🏆), <strong>enum</strong> (bulletproof).</li>
          <li><strong>Attacks:</strong> reflection &amp; serialization mint instance #2 of class-based versions; enum is immune to both.</li>
          <li><strong>Criticisms (know them!):</strong> hidden dependencies · global mutable state (common coupling) · untestable. Modern default: ONE instance wired at the composition root + injected.</li>
          <li>Legit singletons: loggers, metrics, config readers — global, mostly-immutable, harmless to share.</li>
          <li>Traps: singleton-itis · DCL minus volatile · mutable global state · unnecessary laziness · "one per JVM ≠ one per cluster".</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Explain the volatile in double-checked locking like I'm a compiler.">
          <p><C>instance = new AppConfig()</C> is really three steps: allocate → run constructor → assign
            reference. The JIT/CPU may REORDER to allocate → assign → construct. Another thread's fast-path
            null-check then sees non-null and uses a HALF-CONSTRUCTED object. <C>volatile</C> forbids that
            publication reordering (happens-before). Pre-Java-5 memory model, DCL was unfixable — bonus
            trivia.</p>
        </Reveal>
        <Reveal summary="Q: Why exactly is the holder idiom thread-safe with no locks in YOUR code?">
          <p>The JLS guarantees class initialization is atomic and happens once — the JVM internally locks
            during first load of Holder. The inner class isn't loaded until <C>getInstance()</C> first touches
            it → lazy. You outsourced the synchronization to the classloader, which has been correct since
            1996.</p>
        </Reveal>
        <Reveal summary="Q: Spring beans are 'singletons' — same as the GoF pattern?">
          <p>No — Spring's singleton SCOPE means one instance <em>per container</em>, managed by the framework
            and injected (visible dependencies, fakeable). GoF singleton is self-enforcing via private
            constructor + static access (hidden dependency). Spring's version is precisely the "modern
            resolution" — oneness by wiring. Distinguishing these two is a very common senior question.</p>
        </Reveal>
        <Reveal summary="Q: Singleton vs a class with only static methods — when must it be a singleton?">
          <p>When you need an INSTANCE: to implement an interface (plug into Day 12 slots), to be passed around,
            lazily initialized, or swapped/mocked. All-static utility (Math) works only for stateless,
            interface-free helpers. "Static can't implement an interface" is the crisp differentiator.</p>
        </Reveal>
        <Reveal summary="Q: How does serialization create a second instance — and the readResolve defense?">
          <p>Deserialization builds a NEW object from bytes without calling getInstance(). Defense: add
            <C> private Object readResolve() {'{'} return INSTANCE; {'}'}</C> — the JVM swaps the freshly
            deserialized object for your canonical one (and the dupe is GC'd). Enum singletons get this
            behavior from the serialization spec for free.</p>
        </Reveal>
        <Reveal summary="Q: Is the classic getInstance() also a known GoF pattern application?">
          <p>Yes — it's a <strong>static factory method</strong> with instance control (Day 22 connects them).
            GoF even notes Singleton is often used to implement Abstract Factories and registries. Patterns
            nest: the answer "getInstance is a static factory that always returns the same product" ties three
            days together.</p>
        </Reveal>
        <Reveal summary="Q: Name the THREE standard criticisms, with the principle each violates.">
          <p>① Hidden dependencies — constructors lie about needs (violates DIP's explicit seams, Day 15).
            ② Global mutable state — common coupling, the 2nd-worst rung (Day 17). ③ Untestability — no seam to
            inject fakes (testability ⇔ swappability). Deliver these unprompted and the interviewer stops
            probing.</p>
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
        <strong>Day 21 complete?</strong> Homework: build a <C>GameSettings</C> singleton three ways — naive lazy,
        holder idiom, and enum. ① Write a main that calls <C>getInstance()</C> twice and proves same-address with
        <C> ==</C> (the one time == is the RIGHT tool — why?). ② Break the naive one with reflection and print
        both addresses. ③ Try the same attack on the enum and read the exception. ④ Bonus, the senior move:
        write <C>GameSettings</C> a fourth way — as a plain class created once in main and injected — and note
        which version your tests prefer.
        <br /><br />
        Next: <strong>Day 22 — Factory Method</strong>: the pattern that finally answers Day 12's open question —
        WHO is allowed to know about all the cartridge classes? (Spoiler: one factory, and only one.)
      </div>
    </div>
  )
}
