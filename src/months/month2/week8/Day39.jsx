import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: The boss fight ============ */
function BossFight() {
  const [hero, setHero] = useState({ hp: 100, gold: 250, level: 3 })
  const [slots, setSlots] = useState([])
  const [log, setLog] = useState(null)

  function goblin() {
    setHero((h) => ({ ...h, hp: Math.max(5, h.hp - 15), gold: h.gold + 60, level: h.level + (h.gold > 400 ? 1 : 0) }))
    setLog('⚔️ goblin slain: −15 hp, +60 gold')
  }
  function boss() {
    setHero((h) => (h.hp > 120
      ? { ...h, hp: h.hp - 60, gold: h.gold + 500, level: h.level + 2 }
      : { ...h, hp: 5, gold: Math.floor(h.gold / 2) }))
    setLog(hero.hp > 120
      ? '🐉 BOSS DEFEATED! +500 gold, +2 levels'
      : '💀 the boss flattened you: hp → 5, half your gold rolled into the lava…')
  }
  function save() {
    if (slots.length >= 3) return
    setSlots((s) => [...s, { label: `Save #${s.length + 1}`, snap: { ...hero } }])
    setLog(`💾 checkpoint written — contents sealed 🔒 (the slot cannot read it)`)
  }
  function load(i) {
    setHero({ ...slots[i].snap })
    setLog(`⏪ ${slots[i].label} restored — the originator unpacked its own bottle`)
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · save before the boss. You know why.</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={goblin}>⚔️ fight goblin</button>
        <button className="act" onClick={boss}>🐉 fight the BOSS</button>
        <button className="ghost act" onClick={save} disabled={slots.length >= 3}>💾 save checkpoint</button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="obj" style={{ minWidth: 200, borderColor: hero.hp <= 5 ? 'var(--red)' : undefined }}>
          <div className="oref">🦸 hero (the ORIGINATOR)</div>
          <div className="ofield">hp = {hero.hp} {hero.hp <= 5 ? '💀' : ''}</div>
          <div className="ofield">gold = {hero.gold}</div>
          <div className="ofield">level = {hero.level}</div>
        </div>
        <div style={{ minWidth: 220 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5', marginBottom: 6 }}>SAVE SLOTS (the CARETAKER)</div>
          {slots.length === 0
            ? <div style={{ fontSize: 13, color: '#9aa3b5' }}>no checkpoints yet — brave or foolish?</div>
            : slots.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <span className="chip">📦 {s.label} — contents sealed 🔒</span>
                <button className="ghost act" style={{ fontSize: 11.5, padding: '4px 8px' }} onClick={() => load(i)}>⏪ load</button>
              </div>
            ))}
        </div>
      </div>
      {log && <div className="statbar"><span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{log}</span></div>}
    </div>
  )
}

/* ============ Interactive 2: The opaque box lab ============ */
function OpaqueLab() {
  const [mode, setMode] = useState('leaky')
  const [attempt, setAttempt] = useState(null)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the caretaker tries to cheat — twice</div>
      <div className="modbtns">
        <button className={mode === 'leaky' ? 'on' : ''} onClick={() => { setMode('leaky'); setAttempt(null) }}>😱 leaky memento (public getters/setters)</button>
        <button className={mode === 'opaque' ? 'on' : ''} onClick={() => { setMode('opaque'); setAttempt(null) }}>🔒 opaque memento (private inner class)</button>
      </div>
      <Code html={mode === 'leaky'
        ? `<span class="kw">public class</span> HeroMemento {                <span class="cm">// a "bottle" with a screw cap 😬</span>
    <span class="kw">public int</span> hp, gold, level;             <span class="cm">// anyone can read AND write</span>
}`
        : `<span class="kw">public class</span> Hero {
    <span class="kw">private int</span> hp, gold, level;

    <span class="kw">public</span> Snapshot save() { <span class="kw">return new</span> Snapshot(hp, gold, level); }
    <span class="kw">public void</span> restore(Snapshot s) { hp = s.hp; gold = s.gold; level = s.level; }

    <span class="cm">// the BOTTLE: a private inner class — fields visible ONLY to Hero (outer class!)</span>
    <span class="kw">public class</span> Snapshot {
        <span class="kw">private final int</span> hp, gold, level;   <span class="cm">// no getters. No setters. Sealed.</span>
        <span class="kw">private</span> Snapshot(<span class="kw">int</span> h, <span class="kw">int</span> g, <span class="kw">int</span> l) { hp = h; gold = g; level = l; }
    }
}
<span class="cm">// the caretaker stores Hero.Snapshot tokens — and can do NOTHING with their insides.</span>`} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => setAttempt('read')}>😈 caretaker: int peek = memento.hp;</button>
        <button className="act" onClick={() => setAttempt('write')}>😈 caretaker: memento.gold = 999999;</button>
      </div>
      {attempt && (
        <div className="statbar" style={{ background: mode === 'leaky' ? '#FDECEC' : '#EAF7EF' }}>
          {mode === 'leaky'
            ? (attempt === 'read'
              ? <span>👀 <b>It works.</b> The caretaker now reads the hero’s private hp — every field the hero hid behind Day 2’s walls just walked out in a "snapshot". Encapsulation died politely.</span>
              : <span>💰 <b>It works — and history was REWRITTEN.</b> The caretaker edited a save file: load it and the hero is a millionaire. A mutable memento is a cheat-code editor.</span>)
            : <span>🧱 <b>COMPILE ERROR: hp has private access in Hero.Snapshot.</b> Java’s inner-class rule does the enforcement: the OUTER class (Hero) reads the private fields freely; everyone else holds a sealed token. The bottle only opens for its maker.</span>}
        </div>
      )}
      {!attempt && <div className="statbar">🔐 <span>GoF calls this the wide interface (for the originator) vs the narrow interface (for everyone else). Try both cheats in both worlds.</span></div>}
    </div>
  )
}

/* ============ Interactive 3: The shallow snapshot disaster ============ */
const SHALLOW_STEPS = [
  { line: 'inventory = [🗡️ Sword, 🛡️ Shield] → save()', note: 'The memento is created… but it stores the REFERENCE to the live inventory list (Day 25’s shallow copy, sneaking into your save system).', inv: '🗡️ 🛡️', snap: '→ same List object!' },
  { line: 'hero picks up 🧿 CursedAmulet → inventory.add(…)', note: 'The live list mutates. And the memento "contains"… that very list.', inv: '🗡️ 🛡️ 🧿', snap: '→ same List object!' },
  { line: 'restore()  →  hp, gold reset ✓ … inventory: [Sword, Shield, 🧿]', note: '💀 THE PAST HAS BEEN EDITED. The snapshot shared a mutable object with the present — saving never actually saved the list. The most common real-world memento bug.', inv: '🗡️ 🛡️ 🧿', snap: '(corrupted)' },
]
const DEEP_STEPS = [
  { line: 'save() → snapshot stores List.copyOf(inventory)', note: 'The bottle gets its OWN immutable copy — Day 25’s deep-copy rule, applied where it matters.', inv: '🗡️ 🛡️', snap: '🗡️ 🛡️ (own copy)' },
  { line: 'hero picks up 🧿 CursedAmulet', note: 'The live list mutates; the bottled list cannot — nothing shares it.', inv: '🗡️ 🛡️ 🧿', snap: '🗡️ 🛡️ (own copy)' },
  { line: 'restore() → inventory = [🗡️ Sword, 🛡️ Shield] ✓', note: 'A true return to the past. Rule: a memento deep-copies every MUTABLE field; immutables (Strings, Money, records) ride along free (Day 20’s dividend).', inv: '🗡️ 🛡️', snap: '🗡️ 🛡️' },
]

function ShallowDisaster() {
  const [mode, setMode] = useState('shallow')
  const [step, setStep] = useState(-1)
  const steps = mode === 'shallow' ? SHALLOW_STEPS : DEEP_STEPS
  const cur = step >= 0 ? steps[step] : null

  return (
    <div className="panel">
      <div className="ptitle">Live demo · the save file that kept mutating after you saved</div>
      <div className="modbtns">
        <button className={mode === 'shallow' ? 'on' : ''} onClick={() => { setMode('shallow'); setStep(-1) }}>💀 shallow snapshot</button>
        <button className={mode === 'deep' ? 'on' : ''} onClick={() => { setMode('deep'); setStep(-1) }}>🌊 deep snapshot</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="act" onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))} disabled={step >= steps.length - 1}>
          {step < 0 ? '▶ play it out' : 'next →'}
        </button>
        <button className="ghost act" onClick={() => setStep(-1)}>reset</button>
        {cur && (
          <>
            <span className="chip">live inventory: {cur.inv}</span>
            <span className="chip" style={{ background: mode === 'shallow' && step >= 0 ? '#FFE0DE' : '#EAF7EF' }}>bottled: {cur.snap}</span>
          </>
        )}
      </div>
      <div className="heap">
        {steps.slice(0, step + 1).map((t, i) => (
          <div key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, padding: '4px 8px', borderRadius: 6,
            background: i === step ? (t.note.includes('💀') ? '#FFE0DE' : '#EEF2FF') : 'transparent',
            fontWeight: i === step ? 700 : 400 }}>{t.line}</div>
        ))}
        {step < 0 && <div className="empty">Press play — and keep one eye on the bottled chip above.</div>}
      </div>
      {cur && <div className="statbar">💡 <span>{cur.note}</span></div>}
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'The Memento pattern\'s intent — including the clause people forget?',
    o: ['Compress object state', 'Copy objects cheaply', 'WITHOUT VIOLATING ENCAPSULATION, capture an object\'s internal state externally so it can be restored later — the snapshot exists, yet the private fields stay private', 'Log every change'], a: 2,
    e: 'The "without violating encapsulation" clause IS the pattern — otherwise it would just be getters. The bottle is opaque to everyone except its maker.',
    w: { 0: 'Compression is an optimization, not the intent.',
         1: 'Copying for a NEW independent object is Prototype (25) — same mechanics, different purpose.',
         3: 'Logging changes is the Command-log idea (33).' },
    r: { id: 's1', label: 'Section 1 — the save slot' } },
  { q: 'Name the three roles and the caretaker\'s defining limitation.',
    o: ['Context, State, Transition', 'Originator (creates & restores the memento), Memento (the sealed state bottle), Caretaker (STORES bottles but can never open them — it manages WHEN, never WHAT)', 'Subject, Observer, Event', 'Client, Invoker, Receiver'], a: 1,
    e: 'The undo stack, the save-slot menu, the history panel — all caretakers: they decide when to snapshot and which to restore, while remaining blind to contents.',
    w: { 0: 'State\'s cast (34).',
         2: 'Observer\'s cast (32).',
         3: 'Command\'s cast (33).' },
    r: { id: 's3', label: 'Section 3 — the three roles' } },
  { q: 'How does Java ENFORCE memento opacity (not just promise it)?',
    o: ['Encrypting the fields', 'With a comment saying please', 'A private-fields inner class: the OUTER class (originator) can read its inner class\'s private fields — a unique Java visibility rule — while caretakers hold the token and get compile errors on any peek', 'Reflection guards'], a: 2,
    e: 'GoF\'s wide interface (originator sees all) vs narrow interface (others see an opaque token), implemented by the compiler itself. The cheat attempts in the lab die at compile time.',
    w: { 0: 'No crypto needed; visibility suffices.',
         1: 'Hope is not access control.',
         3: 'Reflection can pierce anything (Day 21) — the design intent is compile-time honesty.' },
    r: { id: 's5', label: 'Section 5 — the opaque box lab' } },
  { q: 'The Day 33 connection: in undo systems, Command and Memento divide labor how?',
    o: ['The command represents the ACTION; the memento is the bottled BEFORE-STATE the command stores so undo() can restore — Day 33\'s "snapshot" column finally has its name and rules', 'Memento replaces Command', 'They are rivals', 'Commands cannot use snapshots'], a: 0,
    e: 'The editor stored prevText with each command — an informal memento. Formalized: command.execute() first asks the originator for a memento, undo() hands it back. Two patterns, one feature.',
    w: { 1: 'You still need the action object to queue/log/redo.',
         2: 'They are the classic marriage.',
         3: 'Snapshot-undo is the standard combo.' },
    r: { id: 's8', label: 'Section 8 — Command + Memento' } },
  { q: 'Why must a memento DEEP-copy mutable fields?',
    o: ['Java requires it', 'For speed', 'To save memory', 'A shallow memento shares live mutable objects — later mutations REWRITE the "saved" state (the cursed amulet survived the restore). Deep-copy mutables; share immutables freely'], a: 3,
    e: 'Day 25\'s shallow/deep lesson, transplanted: a snapshot that shares a List with the present is not a snapshot — it is a window. Immutable fields (Day 20) make the question vanish.',
    w: { 0: 'No language rule; a survival rule.',
         1: 'Deep copies are SLOWER — correctness is the purchase.',
         2: 'It costs MORE memory, deliberately.' },
    r: { id: 's7', label: 'Section 7 — the shallow disaster' } },
  { q: 'A text editor snapshots a 10 MB document on every keystroke. The fixes?',
    o: ['Buy more RAM forever', 'Compress the JVM', 'Disable undo', 'Cap or window the history · snapshot at meaningful boundaries (word, command) · store DIFFS between states instead of full copies · or flyweight-share the unchanged parts'], a: 3,
    e: 'Memento\'s honest cost is memory × history-length. Real editors store deltas (and professional ones use ropes/persistent data structures — structural sharing, the flyweight idea at data-structure scale).',
    w: { 0: 'O(keystrokes × size) defeats any RAM.',
         1: 'Not a thing. 🙂',
         2: 'Users riot (Day 33 said so).' },
    r: { id: 's9', label: 'Section 9 — the memory bill' } },
  { q: 'Which database feature is Memento speaking SQL?',
    o: ['SAVEPOINT my_point … ROLLBACK TO my_point — bottle the transaction state, restore on demand; the DB is originator AND enforcer of opacity', 'Foreign keys', 'CREATE INDEX', 'SELECT DISTINCT'], a: 0,
    e: 'Savepoints, VM snapshots, git stash, wizard back-buttons: the capture-and-restore shape is everywhere once named. You cannot inspect a savepoint\'s contents either — proper opacity.',
    w: { 1: 'Integrity constraints.',
         2: 'Indexes accelerate reads.',
         3: 'A query modifier.' },
    r: { id: 's8', label: 'Section 8 — mementos in the wild' } },
  { q: 'A "memento" class with public getters for every field is…',
    o: ['Faster', 'A leaky memento: the caretaker (and everyone else) can now read the originator\'s entire private state — you shipped Day 2\'s encapsulation out in a box. Opacity is the pattern; without it this is just a DTO', 'Required for testing', 'Perfectly standard'], a: 1,
    e: 'If outsiders can read/write the snapshot, every invariant the originator guards is bypassable via save-edit-restore (the cheat-code editor). Keep the bottle sealed: inner class, or nested record with restricted reach.',
    w: { 0: 'Speed is identical.',
         2: 'Tests go through the originator: save → mutate → restore → assert.',
         3: 'Standard in bad codebases. 🙂' },
    r: { id: 's5', label: 'Section 5 — the leaky memento' } },
]

/* ============ The page ============ */
export default function Day39() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 2 · Week 8 · Day 39 · Behavioral Patterns II</div>
        <h1>Memento:<br />Save Before the Boss Fight</h1>
        <p>Every gamer knows the ritual: 💾 save, then open the dragon's door. Today: how to bottle an
           object's private state WITHOUT breaking the privacy Day 2 fought for — the missing piece Day 33's
           undo stack was quietly borrowing. Click everything.</p>
        <div className="chips">
          {['memento', 'originator/caretaker', 'opaque snapshot', 'inner-class trick', 'deep copy', 'undo & savepoints'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The save slot</h2>
        <p>Think about what a game save REALLY is: the game writes a file holding everything private about
          your run — and the save-slot menu that stores it <strong>cannot read a byte of it
          meaningfully</strong>. It shows "Save #2 — 14:32", nothing more. Only the game itself can unpack the
          file. State got externalized; secrecy survived.</p>
        <Note><strong>Memento's intent:</strong> <em>without violating encapsulation</em>, capture and
          externalize an object's internal state, so the object can be restored to that state later. The
          clause in italics is the entire pattern.</Note>
        <Code html={`        THE THREE ROLES

   ORIGINATOR (the hero)            MEMENTO (the bottle 📦🔒)        CARETAKER (the save menu)
   private hp, gold, level          sealed copy of that state       List&lt;Memento&gt; slots
   save()    → writes a bottle      readable ONLY by the            stores · timestamps · picks
   restore() → drinks it back       originator                      NEVER opens — manages WHEN,
                                                                    never sees WHAT`} />
        <p>Feel the tension this resolves: Day 2 made state <C>private</C> with guarded doors. Day 33's undo
          needed snapshots of that very state. Getters-for-everything would win undo by losing encapsulation.
          Memento gets both.</p>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The crime: snapshots via getters</h2>
        <Code html={`<span class="cm">// the "obvious" approach — and its three quiet disasters:</span>
HeroDto snap = <span class="kw">new</span> HeroDto(hero.getHp(), hero.getGold(), hero.getLevel(), …);
<span class="cm">// 1. Hero must expose a getter for EVERY private field — including ones that</span>
<span class="cm">//    exist only for internal bookkeeping. The vault doors multiply (Day 2 ☠️).</span>
hero.setHp(snap.hp); hero.setGold(snap.gold); …
<span class="cm">// 2. Restoring needs a SETTER for everything too — the guards are now bypassable.</span>
<span class="cm">// 3. Whoever holds the DTO reads and edits the hero's soul at will.</span>`} />
        <p>The snapshot worked; the class died. Every invariant became optional, every private field public in
          all but keyword. The fix is not fewer snapshots — it is a snapshot <strong>only the originator can
          open</strong>.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>The structure (Java's inner-class superpower)</h2>
        <Code html={`<span class="kw">public class</span> Hero {
    <span class="kw">private int</span> hp = <span class="num">100</span>, gold = <span class="num">250</span>, level = <span class="num">3</span>;

    <span class="cm">// ORIGINATOR API — the only doors:</span>
    <span class="kw">public</span> Snapshot save() { <span class="kw">return new</span> Snapshot(hp, gold, level); }
    <span class="kw">public void</span> restore(Snapshot s) { hp = s.hp; gold = s.gold; level = s.level; }
    <span class="cm">//                                       ▲ legal! outer class reads inner privates</span>

    <span class="cm">// the MEMENTO — sealed by VISIBILITY, not by promise:</span>
    <span class="kw">public static class</span> Snapshot {
        <span class="kw">private final int</span> hp, gold, level;       <span class="cm">// no getters. final. done.</span>
        <span class="kw">private</span> Snapshot(<span class="kw">int</span> h, <span class="kw">int</span> g, <span class="kw">int</span> l) { hp = h; gold = g; level = l; }
    }
}

<span class="cm">// the CARETAKER — undo stack, save menu — holds tokens it cannot open:</span>
Deque&lt;Hero.Snapshot&gt; history = <span class="kw">new</span> ArrayDeque&lt;&gt;();
history.push(hero.save());
<span class="cm">// … boss fight goes badly …</span>
hero.restore(history.pop());`} />
        <p>The trick to say out loud: <strong>a Java outer class can access its nested class's private
          members</strong>. Hero reads <C>s.hp</C> freely; the caretaker gets a compile error on the same
          expression. GoF's "wide interface for the originator, narrow interface for the world" — enforced by
          javac, not etiquette.</p>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>🐉 Play: The boss fight</h2>
        <p>Farm some goblins, save, then do something brave and stupid:</p>
        <BossFight />
        <Good><strong>What you should notice:</strong> ① The slots show "contents sealed 🔒" — the caretaker
          timestamps and lists, never reads. ② restore() rebuilt the EXACT private state with zero setters
          existing on Hero. ③ Multiple slots = a history; pick any past — the undo stack (Day 33) is this
          panel with a stricter pop order.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>🔒 Play: The opaque box lab</h2>
        <p>Two memento designs, one cheating caretaker:</p>
        <OpaqueLab />
        <Good><strong>What you should notice:</strong> ① The leaky memento turns every save into a cheat-code
          editor — read the soul, rewrite history. ② The opaque version stops BOTH attacks at compile time
          via visibility alone. ③ "Sealed" is a design property you can enforce, not a comment you can hope
          for.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>The bottle must be a true copy (Day 25 reports for duty)</h2>
        <p>One more way saves go wrong — silently. A memento holding a <em>reference</em> to a live mutable
          object (a List, a Map, a mutable Position) has not saved anything: when the present mutates, the
          "past" mutates with it. The rules transplant directly from Day 25:</p>
        <ul>
          <li><strong>Mutable fields → deep-copy into the memento</strong> (<C>List.copyOf(inventory)</C>) —
            and again on restore if the originator keeps mutating.</li>
          <li><strong>Immutable fields → share freely</strong> (Strings, Money, records, enums — Day 20's
            dividend pays yet again: the more of your state is values, the cheaper your snapshots).</li>
        </ul>
        <Warn><strong>The silent shallow-save:</strong> a memento that stores a reference instead of a copy
          compiles fine, runs fine, and "saves" fine — the bug only shows up later, when a restore comes back
          looking exactly like the present instead of the past. There is no exception to catch it; only a test
          that mutates state AFTER saving and asserts the snapshot didn't change.</Warn>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>💀 Play: The cursed amulet</h2>
        <p>Save, pick up something regrettable, restore — in both copy depths:</p>
        <ShallowDisaster />
        <Good><strong>What you should notice:</strong> ① In shallow mode the bottled chip and the live chip are
          the SAME list — watch them move together; the restore was a lie. ② Deep mode bottles a copy and the
          past stays past. ③ This bug ships constantly because shallow saves WORK in every test that doesn't
          mutate-after-save — write that test.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Mementos in the wild — and the Command marriage</h2>
        <ul>
          <li><strong>DB savepoints:</strong> <C>SAVEPOINT p; … ROLLBACK TO p;</C> — bottle the transaction,
            restore on demand. VM snapshots, <C>git stash</C>, wizard back-buttons: same shape.</li>
          <li><strong>Command + Memento (Day 33, settled):</strong> the command is the ACTION; the memento is
            the bottled before-state it stores for undo(). The editor's <C>prev</C> field was an informal
            memento — now you know its rules (opacity, deep copies).</li>
          <li><strong>Full vs incremental:</strong> long histories of big states → store DIFFS between
            snapshots, checkpoint occasionally (exactly how video formats and git think). Memento's honest
            bill is memory × history; pay it deliberately — cap, window, or diff.</li>
        </ul>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>🪤 Common traps (read twice)</h2>
        <h3>Trap 1 — The leaky memento</h3>
        <p>Public getters "just for tests" and the bottle is open forever. Test through the originator:
          save → mutate → restore → assert behavior.</p>
        <h3>Trap 2 — The shallow save</h3>
        <p>The cursed amulet. Deep-copy mutables, both directions. Better: make the state values (records) and
          the problem evaporates.</p>
        <h3>Trap 3 — The memory landslide</h3>
        <p>Unbounded history × fat snapshots. Cap the stack, snapshot at meaningful boundaries, or diff.
          An undo feature that OOMs the editor undoes the wrong thing.</p>
        <h3>Trap 4 — Restoring across versions</h3>
        <p>Game patch 1.2 adds a <C>mana</C> field; players load 1.1 saves → half-initialized heroes.
          Persisted mementos are an API: version them, migrate them (Day 33's queue-payload lesson, save-file
          edition).</p>
        <h3>Trap 5 — The caretaker that "helps"</h3>
        <p>A caretaker that filters, merges or "fixes" mementos has opinions about contents it must not have.
          Caretakers manage lifetime and order — when, not what. Anything smarter belongs in the originator.</p>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>📋 Cheat sheet (revise from here later)</h2>
        <ul>
          <li><strong>Intent:</strong> externalize private state for later restore — WITHOUT violating encapsulation. Roles: Originator (save/restore) · Memento (sealed bottle) · Caretaker (stores blind; when, not what).</li>
          <li><strong>Java enforcement:</strong> nested class with private final fields + private constructor — outer class reads inner privates; everyone else gets compile errors. Wide vs narrow interface, by javac.</li>
          <li><strong>Copy rules (Day 25):</strong> deep-copy mutables in AND out; share immutables (records = ideal bottle material, Day 20).</li>
          <li><strong>Wild:</strong> game saves · DB SAVEPOINT/ROLLBACK · VM snapshots · git stash · wizard back. <strong>Marriage:</strong> Command (the action) + Memento (the before-state) = undo (Day 33).</li>
          <li><strong>Bill:</strong> memory × history — cap, boundary-snapshot, or diff. Persisted mementos need VERSIONING.</li>
          <li>Traps: leaky getters · shallow saves · unbounded history · stale-version restores · opinionated caretakers.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The questions they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary="Q: Memento vs Prototype — both copy state. The one-line difference?">
          <p>Purpose: Prototype copies to create a NEW independent object that lives forward (Day 25's goblin
            army); Memento bottles state to RESTORE the SAME object backward — and stays opaque to everyone
            else. Same copying mechanics (deep/shallow rules shared), opposite arrows of time.</p>
        </Reveal>
        <Reveal summary="Q: Can Java records be mementos? The transparency caveat?">
          <p>Records are perfect bottle MATERIAL (immutable, value-equal) but they are TRANSPARENT — public
            accessors for every component. Fix: nest the record inside the originator with reduced visibility,
            or accept openness when state is not secret (a cursor position). "Records solve immutability, not
            opacity" is the senior phrasing.</p>
        </Reveal>
        <Reveal summary="Q: Serialization as a memento mechanism — pros and cons?">
          <p>Pros: automatic deep copy of the whole graph, persistable for free. Cons: slow, drags
            Serializable through your model, version-brittle (serialVersionUID pain), and the byte stream is
            readable — opacity by obscurity only. Verdict: fine for coarse checkpoints; explicit snapshot
            classes for hot undo paths (Day 25 reached the same verdict for cloning).</p>
        </Reveal>
        <Reveal summary="Q: How do persistent data structures change the memento story?">
          <p>Structural sharing (the flyweight idea at data-structure scale): each "snapshot" of a persistent
            tree/rope shares all unchanged nodes with the previous one — O(log n) per version instead of O(n).
            Professional editors and functional languages get cheap infinite undo this way. Naming
            "persistent data structures" in a memento question is a flex with substance.</p>
        </Reveal>
        <Reveal summary="Q: Memento + State (Day 34) — what must a lifecycle snapshot include?">
          <p>The current STATE identity too (its name — Day 19's never-ordinal rule), not just the data fields:
            restoring an Order's fields but not its PLACED/SHIPPED state resurrects a chimera. And restoring
            must re-enter through legal machinery — rehydrate the state object via the registry, exactly like
            Day 34's persistence corner.</p>
        </Reveal>
        <Reveal summary="Q: Who should be able to restore — anyone holding the memento?">
          <p>Design decision worth naming: a token-holder restore (anyone with the bottle can hand it back) vs
            originator-bound (snapshot carries the originator id; restoring a Hero memento into another Hero is
            rejected). Cross-object restore is usually a bug vector — bind bottles to their makers.</p>
        </Reveal>
        <Reveal summary="Q: The 20-second LLD answer: text editor undo with Command + Memento?">
          <p>"Each edit is a Command; before execute(), it asks the Document for a Memento (sealed inner
            snapshot, deep-copied buffers — or a rope diff). CommandHistory keeps two stacks (Day 33), capped
            at N entries. Undo pops, hands the memento back to the Document; redo re-executes. New edit clears
            redo." Four sentences, three patterns, full feature.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s11">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 39 complete?</strong> Homework: build the hero, properly. <C>Hero</C> with private
        <C> hp, gold, List&lt;String&gt; inventory</C>; nested <C>Snapshot</C> (private final fields, private
        constructor, NO getters); <C>save()</C> deep-copying the inventory; <C>restore()</C> likewise.
        ① Prove opacity: try to read <C>snapshot.gold</C> from main and paste the compile error as a comment.
        ② Prove deep copy: save → add "🧿 cursed" → restore → assert the inventory is clean. ③ Wire a
        <C> CaretakerStack</C> capped at 3 (oldest evicted) and narrate a boss-fight story in main.
        ④ Bonus: marry it to Day 33 — a <C>DrinkPotionCommand</C> whose undo() restores the memento it took
        at execute().
        <br /><br />
        Next: <strong>Day 40 — Visitor</strong>: the trickiest GoF pattern saved for last — adding brand-new
        operations to old object structures without editing them, double dispatch, and the Month 2 finale. 🏁
      </div>
    </div>
  )
}
