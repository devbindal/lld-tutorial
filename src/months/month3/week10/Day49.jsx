import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the level filter dial ============ */
const LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']
const LEVEL_RANK = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4 }
const LEVEL_COLOR = { TRACE: '#9aa', DEBUG: '#7c8aa5', INFO: '#2D5BFF', WARN: '#C75000', ERROR: '#D33' }
const SAMPLE_LOGS = [
  { level: 'TRACE', msg: 'entering loadUser(id=42)' },
  { level: 'DEBUG', msg: 'cache miss for user 42' },
  { level: 'INFO', msg: 'user 42 logged in' },
  { level: 'WARN', msg: 'slow query: 1200ms' },
  { level: 'ERROR', msg: 'payment gateway timeout' },
]

function LevelDial() {
  const [threshold, setThreshold] = useState('INFO')
  const tRank = LEVEL_RANK[threshold]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one dial controls the whole firehose — drag the threshold, watch what survives</div>
      <div className="modbtns" style={{ marginBottom: 12 }}>
        {LEVELS.map((l) => (
          <button key={l} className={threshold === l ? 'on' : ''} onClick={() => setThreshold(l)}
            style={{ color: threshold === l ? undefined : LEVEL_COLOR[l] }}>{l}</button>
        ))}
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, color: '#7c8aa5', marginBottom: 8 }}>
        logger.setLevel(Level.{threshold});  // emit only if event.level.rank ≥ {tRank}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {SAMPLE_LOGS.map((log, i) => {
          const passes = LEVEL_RANK[log.level] >= tRank
          return (
            <div key={i} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 12, padding: '4px 8px', borderRadius: 5,
              border: '1px solid var(--line)',
              background: passes ? '#fff' : '#F4F3EE',
              opacity: passes ? 1 : 0.4,
              textDecoration: passes ? 'none' : 'line-through',
            }}>
              <span style={{ color: LEVEL_COLOR[log.level], fontWeight: 700, width: 56, display: 'inline-block' }}>{log.level}</span>
              {log.msg}
              <span style={{ float: 'right', color: passes ? 'var(--green)' : 'var(--red)' }}>
                {passes ? '✓ emitted' : '✗ filtered'}
              </span>
            </div>
          )
        })}
      </div>
      <div className="statbar" style={{ display: 'block', marginTop: 10 }}>
        <span style={{ fontSize: 12.5 }}>
          The level is an ORDERED enum: an event is emitted when its rank ≥ the threshold. Set it to WARN in
          production (quiet), TRACE when hunting a bug (everything). One field, the whole volume knob.
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 2: the logger hierarchy chain ============ */
const LOGGERS = [
  { name: 'com.shop.payment.StripeClient', level: null },
  { name: 'com.shop.payment', level: 'DEBUG' },
  { name: 'com.shop', level: null },
  { name: 'ROOT', level: 'INFO' },
]

function HierarchyChain() {
  const [eventLevel, setEventLevel] = useState('DEBUG')
  const [additive, setAdditive] = useState(true)
  const [step, setStep] = useState(0)

  // resolve effective threshold: walk up until a logger has an explicit level
  const effective = LOGGERS.find((l) => l.level !== null)   // first with a level walking up = payment(DEBUG)
  const passes = LEVEL_RANK[eventLevel] >= LEVEL_RANK[effective.level]

  return (
    <div className="panel">
      <div className="ptitle">Live demo · a log climbs the logger tree — inheriting config, hitting appenders on the way</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5' }}>fire a</span>
        {['DEBUG', 'INFO', 'ERROR'].map((l) => (
          <button key={l} className={eventLevel === l ? 'on act' : 'ghost act'} style={{ fontSize: 12, color: eventLevel === l ? undefined : LEVEL_COLOR[l] }}
            onClick={() => { setEventLevel(l); setStep(0) }}>{l}</button>
        ))}
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#7c8aa5' }}>from StripeClient</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 0 }}>
        {LOGGERS.map((lg, i) => {
          const isOrigin = i === 0
          const reached = step > 0
          return (
            <div key={lg.name}>
              <div style={{
                fontFamily: 'IBM Plex Mono', fontSize: 11.5, padding: '6px 10px',
                border: '1px solid var(--line)', borderRadius: 6, marginBottom: 2,
                background: lg.level !== null && lg === effective ? '#FFF1D6' : '#fff',
              }}>
                {isOrigin ? '📣 ' : '⬆ '}{lg.name}
                {lg.level ? <b style={{ color: LEVEL_COLOR[lg.level] }}> [level={lg.level}]</b> : <span style={{ color: '#bbb' }}> [inherits]</span>}
                {lg === effective && <span style={{ color: 'var(--amber)' }}> ← effective threshold</span>}
              </div>
              {i < LOGGERS.length - 1 && <div style={{ textAlign: 'center', color: '#bbb', fontSize: 11 }}>│ {additive ? 'propagates ⬆' : 'stops here ⛔'}</div>}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
        <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={additive} onChange={(e) => setAdditive(e.target.checked)} /> additive (propagate to ancestors\' appenders)
        </label>
      </div>
      <div className="statbar" style={{ display: 'block', marginTop: 8 }}>
        <span style={{ fontSize: 12.5 }}>
          {passes
            ? <>✅ <b>{eventLevel}</b> ≥ effective threshold <b>{effective.level}</b> (from <C>com.shop.payment</C>, the nearest ancestor with an explicit level). The event is emitted{additive ? ' and propagates up, hitting EACH ancestor\'s appenders (additivity).' : '; additivity OFF, so only this logger\'s appenders fire.'}</>
            : <>❌ <b>{eventLevel}</b> &lt; effective threshold <b>{effective.level}</b> → dropped before any appender runs. Config is INHERITED: StripeClient has no level, so it borrows payment\'s.</>}
        </span>
      </div>
    </div>
  )
}

/* ============ Interactive 3: pluggable appenders ============ */
const APPENDER_DEFS = {
  console: { label: '🖥 ConsoleAppender', layout: 'simple', sample: (m) => m },
  file: { label: '📄 FileAppender', layout: 'detailed', sample: (m) => `2026-06-15 14:03:22 [main] ${m}` },
  json: { label: '🌐 JsonAppender (network)', layout: 'json', sample: (m, lvl) => `{"ts":"...","level":"${lvl}","msg":"${m}"}` },
}

function AppenderBoard() {
  const [enabled, setEnabled] = useState({ console: true, file: false, json: false })
  const [fired, setFired] = useState(null)

  function emit() {
    setFired({ level: 'ERROR', msg: 'payment gateway timeout' })
  }
  const toggle = (k) => setEnabled((e) => ({ ...e, [k]: !e[k] }))

  return (
    <div className="panel">
      <div className="ptitle">Live demo · ONE event, MANY sinks — flip appenders on/off without touching the logger</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {Object.keys(APPENDER_DEFS).map((k) => (
          <button key={k} className={enabled[k] ? 'act' : 'ghost act'} style={{ fontSize: 12 }} onClick={() => toggle(k)}>
            {enabled[k] ? '☑' : '☐'} {APPENDER_DEFS[k].label}
          </button>
        ))}
        <button className="act" style={{ fontSize: 12 }} onClick={emit}>📣 log.error("payment gateway timeout")</button>
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, color: '#7c8aa5', marginBottom: 8 }}>
        logger.addAppender(...) — the SAME LogEvent fans out to every attached appender, each with its own Layout.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.keys(APPENDER_DEFS).map((k) => {
          const on = enabled[k]
          const def = APPENDER_DEFS[k]
          return (
            <div key={k} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11.5, padding: '6px 10px', borderRadius: 6,
              border: '1px solid var(--line)', background: on ? '#fff' : '#F4F3EE', opacity: on ? 1 : 0.45,
            }}>
              <span style={{ color: '#7c8aa5' }}>{def.label} · layout={def.layout}</span>
              <div style={{ marginTop: 3, color: on && fired ? 'var(--ink)' : '#bbb' }}>
                {on && fired ? def.sample(fired.msg, fired.level) : on ? '(waiting for an event…)' : '(disabled — receives nothing)'}
              </div>
            </div>
          )
        })}
      </div>
      <div className="statbar" style={{ display: 'block', marginTop: 10 }}>
        <span style={{ fontSize: 12.5 }}>
          Same event, three formats: console wants readable, file wants timestamps, network wants JSON. The
          logger doesn\'t know or care — it hands the <C>LogEvent</C> to each appender, and each appender\'s
          <C> Layout</C> formats it. Add a KafkaAppender tomorrow = one new class, zero logger edits.
        </span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'Log levels (TRACE < DEBUG < INFO < WARN < ERROR) are best modelled as…',
    o: ['A boolean isError per message', 'An ORDERED enum (Day 19): each level has a rank, and an event is emitted when event.level.rank ≥ threshold.rank — the ordering IS the filter, with no magic strings and compiler-checked names', 'Strings you compare with .equals()', 'Integer constants 1–5'], a: 1,
    e: 'The whole filtering mechanism is a rank comparison, so the levels need a defined order — exactly what an enum (with ordinal or an explicit rank field) provides, plus type safety and no "EROR" typos.',
    w: { 0: 'A boolean can\'t express five ordered levels, let alone filter by threshold.',
         2: '"WARN".equals(level) is the magic-string typo machine (Day 19) with no ordering.',
         3: 'Bare ints lose names and meaning — what does level 3 mean at the call site?' },
    r: { id: 's2', label: 'Section 2 — levels as ordered enums' } },
  { q: 'A logger has no explicit level set. How is its effective threshold determined?',
    o: ['It defaults to TRACE (log everything)', 'It throws an exception', 'It logs nothing', 'It INHERITS from the nearest ancestor in the logger NAME hierarchy that has an explicit level — com.shop.payment.X borrows com.shop.payment\'s, falling back to ROOT — so you configure a whole package with one line'], a: 3,
    e: 'Logger names are dotted hierarchies (com.shop.payment.StripeClient). Config inherits down the tree, so setting com.shop.payment to DEBUG turns on debug for that whole subtree without touching each class.',
    w: { 0: 'Defaulting to TRACE would flood every app that forgot to configure a logger.',
         1: 'A missing level is normal and expected, not an error — that\'s the point of inheritance.',
         2: 'Silently logging nothing would hide events; inheritance ensures a sensible threshold always exists (ROOT).' },
    r: { id: 's4', label: 'Section 4 — the logger hierarchy' } },
  { q: 'Where the event travels up the logger tree and each ancestor\'s appenders get a chance to handle it — that structure is…',
    o: ['Observer', 'Visitor', 'Decorator', 'Chain of Responsibility (Day 36): the event propagates up the parent chain, each logger optionally passing to its appenders and on to its parent (additivity), until ROOT or a logger that stops propagation'], a: 3,
    e: 'The propagation up the parent chain, where each link may handle (append) and pass along, is textbook Chain of Responsibility. Additivity is the "pass to parent" step; turning it off is a link that stops the chain.',
    w: { 0: 'Observer is fan-out to listeners with no chain/ordering up a hierarchy — close, but the parent-chain propagation is CoR.',
         1: 'No operation is visiting a structure.',
         2: 'Nothing is being wrapped to add behaviour.' },
    r: { id: 's4', label: 'Section 4 — propagation as CoR' } },
  { q: 'Console wants readable text, the file wants timestamps, the network wants JSON. The clean design?',
    o: ['Three separate logger classes', 'Each Appender owns a Layout (formatter): the logger hands the same LogEvent to every appender, and each appender\'s Layout formats it independently — add a sink or a format as a new class, never an edit (Day 31 + Day 12)', 'if(appender==console) format simple; else if…', 'Format once in the logger and send the string everywhere'], a: 1,
    e: 'Separating WHAT happened (the LogEvent) from WHERE it goes (Appender) from HOW it looks (Layout) means each varies independently. A new appender or layout is additive; the logger never learns formatting.',
    w: { 0: 'Per-sink logger classes duplicate everything and explode combinatorially.',
         2: 'The if-else chain is the growing-switch smell (Day 12) — every new sink reopens it.',
         3: 'Formatting once forces ONE format on all sinks — JSON to the console, unreadable.' },
    r: { id: 's5', label: 'Section 5 — appenders & layouts' } },
  { q: 'Why is log.debug("user " + id + " cart " + serialize(cart)) a performance trap even when the level is INFO?',
    o: ['It allocates a new logger', 'Strings are slow in Java', 'The argument is BUILT (concatenation + serialize) BEFORE debug() is called and discovers the level filters it out — the work is wasted on every call; use parameterized logging log.debug("user {} cart {}", id, cart) so formatting happens only if emitted', 'debug() is synchronized'], a: 2,
    e: 'Java evaluates arguments eagerly, so the expensive string is constructed even though the event is immediately dropped. Parameterized logging (or an isDebugEnabled guard / lambda supplier) defers the formatting until after the level check.',
    w: { 0: 'No logger is allocated per call; the wasted work is the message construction.',
         1: 'String ops aren\'t the issue — doing them needlessly, millions of times, is.',
         3: 'Synchronization isn\'t the cost here; eager argument evaluation is.' },
    r: { id: 's6', label: 'Section 6 — the eager-argument trap' } },
  { q: 'SLF4J vs Logback/Log4j2 — what\'s the relationship, and why does it matter for design?',
    o: ['SLF4J is a FACADE/API (Day 29) you code against; Logback/Log4j2 are implementations bound at deploy time — depending on the abstraction (Day 15) lets you swap the logging backend without changing a single log call', 'They\'re competitors; pick one', 'Logback is just SLF4J renamed', 'SLF4J is older and deprecated'], a: 0,
    e: 'Your code calls the SLF4J API; the actual engine is chosen by which jar is on the classpath. This is the Facade + Dependency Inversion combo — application code never names a concrete logger, so backends are swappable.',
    w: { 1: 'They\'re layers, not competitors — you use SLF4J WITH Logback.',
         2: 'They\'re distinct: an API vs an implementation of it.',
         3: 'SLF4J is actively the standard facade, not deprecated.' },
    r: { id: 's7', label: 'Section 7 — facade & the real frameworks' } },
  { q: 'The framework is used by many threads and you want one shared configuration. The right approach for the LoggerFactory?',
    o: ['getLogger(name) returns a cached, shared Logger per name (often via a registry) and configuration is centralized — but reach it through the FACTORY, not a hand-rolled global; thread-safety on the shared structures is the real concern (Day 21 + Month 4)', 'A new Logger per call', 'A brand new config object per log call', 'A thread-local logger'], a: 0,
    e: 'Loggers are looked up by name and cached so the same name returns the same instance; the factory owns that registry. It\'s effectively a controlled singleton-via-factory, with the genuine work being safe concurrent access to the shared maps.',
    w: { 1: 'A fresh Logger per call loses cached config and wastes allocation.',
         2: 'Re-reading config per call is enormous needless work on the hot path.',
         3: 'Thread-local loggers fragment configuration and defeat sharing.' },
    r: { id: 's8', label: 'Section 8 — LoggerFactory' } },
  { q: 'Logging is on the hot path of every request. The flag to plant for high-throughput systems?',
    o: ['Logging can never be slow', 'Disable logging in production', 'Synchronous appenders block the calling thread on I/O (disk/network) — for high throughput use an ASYNC appender: the call enqueues the event and a background thread writes it; flag the trade-off (possible event loss on crash, ordering, backpressure) — deep-dived in Month 4', 'Always log to /dev/null'], a: 2,
    e: 'A file/network write on the request thread adds latency to every request. Async appenders decouple the call from the I/O via a queue + worker, at the cost of durability/ordering nuances — exactly the kind of concurrency trade-off to name now and build later.',
    w: { 0: 'A blocking network appender absolutely can be slow — that\'s the whole concern.',
         1: 'Production is where you need logs MOST; the fix is async, not off.',
         3: 'Discarding logs throws away your production observability.' },
    r: { id: 's9', label: 'Section 9 — async & the concurrency flag' } },
]

/* ============ The page ============ */
export default function Day49() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 10 · Day 49 · Classic LLD Problems</div>
        <h1>Logging Framework:<br />Build the Tool You Use Every Day</h1>
        <p>You call <C>log.info(...)</C> a hundred times a day — but how does it decide what to print, where to
           send it, and how to format it? Today we design a logging framework from scratch and discover it\'s a
           greatest-hits album: ordered enums, Chain of Responsibility, Strategy, Facade, and a real
           concurrency flag. The last new problem before Week 10\'s drill. Click everything.</p>
        <div className="chips">
          {['logging', 'log levels', 'Chain of Responsibility', 'appenders', 'layouts', 'SLF4J facade', 'async'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What a logger actually has to decide</h2>
        <p>One innocent call — <C>log.info("user logged in")</C> — kicks off four separate decisions, and each
          one is a design axis that must be able to vary:</p>
        <Code html={`  log.info("user logged in")  →  FOUR QUESTIONS

  ① SHOULD this be emitted at all?     ← level filtering (is INFO ≥ threshold?)
  ② WHAT travels through the system?   ← a LogEvent (level, message, time, thread, logger)
  ③ WHERE does it go?                  ← appenders (console? file? network? all three?)
  ④ HOW is it formatted for each sink? ← layouts (plain text? timestamped? JSON?)

  Separate these four and every one becomes a plug-in. Tangle them and you get
  the logger nobody can extend — the one that prints to System.out and nothing else.`} />
        <Note><strong>The mental model:</strong> a <strong>LogEvent</strong> is the immutable fact ("INFO,
          'user logged in', 14:03, thread main"). A <strong>Logger</strong> decides whether to emit it and
          routes it. <strong>Appenders</strong> are the sinks (where). <strong>Layouts</strong> are the
          formatters (how). Keep those four nouns separate and the whole design falls out.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Levels: an ordered enum is the volume knob</h2>
        <p>Filtering is the framework\'s most-used feature, and it\'s just a comparison — which means the levels
          need an <strong>order</strong>:</p>
        <Code html={`<span class="kw">public enum</span> Level {
    TRACE(<span class="num">0</span>), DEBUG(<span class="num">1</span>), INFO(<span class="num">2</span>), WARN(<span class="num">3</span>), ERROR(<span class="num">4</span>);   <span class="cm">// rank baked in (Day 19)</span>

    <span class="kw">private final int</span> rank;
    Level(<span class="kw">int</span> rank) { <span class="kw">this</span>.rank = rank; }

    <span class="kw">public boolean</span> isAtLeast(Level threshold) {     <span class="cm">// THE filter, in one line</span>
        <span class="kw">return</span> <span class="kw">this</span>.rank &gt;= threshold.rank;
    }
}

<span class="kw">public record</span> LogEvent(Level level, String message, Instant time,
                       String threadName, String loggerName) {}  <span class="cm">// immutable fact (Day 20)</span>`} />
        <Good><strong>Why an explicit rank field, not just <C>ordinal()</C>?</strong> Day 19\'s ordinal trap:
          if someone reorders the enum constants, <C>ordinal()</C> silently changes every comparison. An
          explicit <C>rank</C> survives reordering and inserting a new level (e.g. <C>FATAL(5)</C>) without
          breaking existing logic. Same lesson as never persisting <C>ordinal()</C>.</Good>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3 · Interactive</div>
        <h2>🎚 Play: the level dial</h2>
        <p>One threshold controls the entire firehose. Drag it and watch the same five log statements survive
          or get filtered:</p>
        <LevelDial />
        <Good><strong>What you should notice:</strong> ① The filter is pure rank comparison — no strings, no
          special cases. ② WARN in production keeps the noise down; TRACE while debugging shows everything,
          from the SAME code. ③ The decision happens once, early — a filtered event does zero further work
          (this matters enormously in Section 6).</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>The logger hierarchy: config inherits, events propagate (Chain of Responsibility)</h2>
        <p>Loggers are named by dotted hierarchy — <C>com.shop.payment.StripeClient</C> — and that hierarchy
          does two jobs. Config flows <em>down</em> (a child with no level borrows its nearest ancestor\'s), and
          events flow <em>up</em> (each ancestor\'s appenders get a turn). That upward propagation is
          <strong> Chain of Responsibility</strong> (Day 36):</p>
        <Code html={`  THE LOGGER TREE (names ARE the hierarchy)

  ROOT  [level=INFO, appenders={console}]              ← the backstop, always has a level
   └─ com.shop          [inherits]
        └─ com.shop.payment   [level=DEBUG, appenders={file}]   ← configure a whole package
             └─ com.shop.payment.StripeClient  [inherits]       ← borrows DEBUG from its parent

  log.debug() from StripeClient:
    1. effective level? walk UP → first explicit = payment\'s DEBUG. DEBUG ≥ DEBUG ✓ emit
    2. hand event to StripeClient\'s appenders (none)
    3. additivity ON → pass to parent → payment\'s {file} writes it
    4. → com.shop (none) → ROOT\'s {console} writes it too
       (additivity OFF on any logger STOPS the upward chain there)`} />
        <Code html={`<span class="kw">public class</span> Logger {
    <span class="kw">private final</span> String name;
    <span class="kw">private final</span> Logger parent;              <span class="cm">// the next link in the chain (null at ROOT)</span>
    <span class="kw">private</span> Level level;                       <span class="cm">// null = inherit from parent</span>
    <span class="kw">private final</span> List&lt;Appender&gt; appenders = <span class="kw">new</span> ArrayList&lt;&gt;();
    <span class="kw">private boolean</span> additive = <span class="kw">true</span>;            <span class="cm">// pass up to parent\'s appenders too?</span>

    <span class="kw">private</span> Level effectiveLevel() {              <span class="cm">// config inheritance: walk UP</span>
        <span class="kw">for</span> (Logger l = <span class="kw">this</span>; l != <span class="kw">null</span>; l = l.parent)
            <span class="kw">if</span> (l.level != <span class="kw">null</span>) <span class="kw">return</span> l.level;
        <span class="kw">return</span> Level.INFO;                        <span class="cm">// ROOT always resolves something</span>
    }

    <span class="kw">public void</span> log(Level lvl, String msg) {
        <span class="kw">if</span> (!lvl.isAtLeast(effectiveLevel())) <span class="kw">return</span>;   <span class="cm">// ① filter early — drop cheaply</span>
        LogEvent event = <span class="kw">new</span> LogEvent(lvl, msg, Instant.now(),
                            Thread.currentThread().getName(), name);
        callAppenders(event);                          <span class="cm">// ② walk the chain</span>
    }

    <span class="kw">private void</span> callAppenders(LogEvent e) {        <span class="cm">// Chain of Responsibility (Day 36)</span>
        <span class="kw">for</span> (Logger l = <span class="kw">this</span>; l != <span class="kw">null</span>; l = l.parent) {
            l.appenders.forEach(a -&gt; a.append(e));     <span class="cm">// each link handles…</span>
            <span class="kw">if</span> (!l.additive) <span class="kw">break</span>;                   <span class="cm">// …and may stop the chain</span>
        }
    }
}`} />
        <Note><strong>Two inheritances, one tree:</strong> <em>config</em> inherits (a child without a level
          uses its ancestor\'s — set one package to DEBUG and the whole subtree follows) and <em>events</em>
          propagate up to ancestors\' appenders (additivity). This is why real frameworks let you configure
          <C> com.myapp=DEBUG</C> in one line and have it cover hundreds of classes.</Note>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Appenders &amp; Layouts: WHERE and HOW, each a plug-in</h2>
        <p>An <strong>Appender</strong> is a sink (the where); a <strong>Layout</strong> is a formatter (the
          how). Separating them means a new destination or a new format is a new class — never an edit:</p>
        <Code html={`<span class="kw">public interface</span> Appender { <span class="kw">void</span> append(LogEvent event); }   <span class="cm">// WHERE it goes</span>
<span class="kw">public interface</span> Layout   { String format(LogEvent event); }   <span class="cm">// HOW it looks</span>

<span class="kw">public class</span> ConsoleAppender <span class="kw">implements</span> Appender {
    <span class="kw">private final</span> Layout layout;                       <span class="cm">// each appender OWNS its layout</span>
    <span class="kw">public</span> ConsoleAppender(Layout layout) { <span class="kw">this</span>.layout = layout; }
    <span class="kw">public void</span> append(LogEvent e) { System.out.println(layout.format(e)); }
}

<span class="kw">public class</span> FileAppender <span class="kw">implements</span> Appender {
    <span class="kw">private final</span> Layout layout;
    <span class="kw">private final</span> Writer out;                          <span class="cm">// to a file</span>
    <span class="kw">public</span> FileAppender(Layout layout, Writer out) { <span class="kw">this</span>.layout = layout; <span class="kw">this</span>.out = out; }
    <span class="kw">public void</span> append(LogEvent e) { out.write(layout.format(e)); }   <span class="cm">// (+ flush / handle IOException)</span>
}

<span class="cm">// Layouts vary independently of appenders — mix & match freely:</span>
<span class="kw">class</span> SimpleLayout <span class="kw">implements</span> Layout {
    <span class="kw">public</span> String format(LogEvent e) { <span class="kw">return</span> e.level() + <span class="str">" "</span> + e.message(); }
}
<span class="kw">class</span> JsonLayout <span class="kw">implements</span> Layout {
    <span class="kw">public</span> String format(LogEvent e) {
        <span class="kw">return</span> <span class="str">"{\\"level\\":\\""</span> + e.level() + <span class="str">"\\",\\"msg\\":\\""</span> + e.message() + <span class="str">"\\"}"</span>;
    }
}`} />
        <Good><strong>Three axes, three interfaces:</strong> WHAT happened (<C>LogEvent</C>), WHERE it goes
          (<C>Appender</C>), HOW it looks (<C>Layout</C>) all vary independently. A <C>KafkaAppender</C> with a
          <C> JsonLayout</C>, a <C>ConsoleAppender</C> with a <C>SimpleLayout</C> — any combination, all
          additive. This is Strategy (Day 31) applied three times, and it\'s why log4j has hundreds of
          appenders and you never had to modify its core to add yours.</Good>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6 · Interactive</div>
        <h2>📤 Play: pluggable appenders + the eager-argument trap</h2>
        <p>One event, fanned out to whichever sinks are enabled — each formatting it its own way:</p>
        <AppenderBoard />
        <Warn style={{ marginTop: 12 }}><strong>The performance trap every codebase hits:</strong>
          <C> log.debug("cart " + serialize(cart))</C> builds that expensive string <em>before</em>
          <C> debug()</C> even runs — so even when the level filters it out, you paid for the
          <C> serialize(cart)</C>. Java evaluates arguments eagerly. The fix is <strong>parameterized
          logging</strong>:</Warn>
        <Code html={`<span class="cm">// ❌ serialize(cart) runs on EVERY call, even when DEBUG is filtered out</span>
log.debug(<span class="str">"user "</span> + id + <span class="str">" cart "</span> + serialize(cart));

<span class="cm">// ✅ formatting deferred until AFTER the level check passes</span>
log.debug(<span class="str">"user {} cart {}"</span>, id, cart);          <span class="cm">// SLF4J style — args formatted only if emitted</span>

<span class="cm">// ✅ or a lambda supplier — the body runs only if the level is enabled</span>
log.debug(() -&gt; <span class="str">"user "</span> + id + <span class="str">" cart "</span> + serialize(cart));`} />
        <Good><strong>What you should notice:</strong> ① The same <C>LogEvent</C> reaches every enabled
          appender, each formatting it differently — console readable, file timestamped, network JSON. ② The
          logger never learns formatting; that lives in the appender\'s layout. ③ Adding a sink is flipping a
          switch (in real life, one config line + one class), not editing the logger.</Good>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>The facade: why your code never names a concrete logger</h2>
        <p>You\'ve used SLF4J and Logback without thinking about which is which. Here\'s the relationship — and
          it\'s pure Day 29 (Facade) + Day 15 (Dependency Inversion):</p>
        <Code html={`  THE LAYERS (and why you can swap the engine without touching a log call)

  your code  ──▶  SLF4J API (a FACADE)      ← you code ONLY against this
                  org.slf4j.Logger
                       │ bound at deploy time by which jar is on the classpath
                       ▼
            ┌──────────┴───────────┐
        Logback              Log4j2           ← the actual engines (implementations)
        (appenders,          (appenders,
         layouts, async)      layouts, async)

  Swap Logback → Log4j2 = change a dependency. Zero changes to your million
  log.info(...) calls. That is depend-on-abstractions (Day 15) at ecosystem scale.`} />
        <Code html={`<span class="cm">// Application code — names NO implementation:</span>
<span class="kw">import</span> org.slf4j.Logger;
<span class="kw">import</span> org.slf4j.LoggerFactory;

<span class="kw">public class</span> StripeClient {
    <span class="kw">private static final</span> Logger log = LoggerFactory.getLogger(StripeClient.class);  <span class="cm">// facade</span>
    <span class="kw">void</span> charge() { log.info(<span class="str">"charging card"</span>); }   <span class="cm">// which engine? the deploy decides, not this code</span>
}`} />
        <Note><strong>Two patterns in one sentence:</strong> SLF4J is a <em>Facade</em> (a simple, stable front
          door over varied logging engines) AND the mechanism that lets you <em>invert the dependency</em>
          (your code depends on the <C>Logger</C> interface, not on Logback). It\'s the exact same move as
          Day 15\'s wall-socket: code to the socket, swap the appliance behind it.</Note>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>The LoggerFactory: cached loggers, one configuration</h2>
        <p><C>LoggerFactory.getLogger(name)</C> doesn\'t make a new logger each call — it returns a shared,
          cached instance per name, building the parent chain as needed:</p>
        <Code html={`<span class="kw">public class</span> LoggerFactory {
    <span class="kw">private static final</span> Map&lt;String, Logger&gt; CACHE = <span class="kw">new</span> ConcurrentHashMap&lt;&gt;();  <span class="cm">// name → shared logger</span>
    <span class="kw">private static final</span> Logger ROOT = <span class="kw">new</span> Logger(<span class="str">"ROOT"</span>, <span class="kw">null</span>, Level.INFO);

    <span class="kw">public static</span> Logger getLogger(String name) {
        <span class="kw">return</span> CACHE.computeIfAbsent(name, n -&gt; {
            Logger parent = getLogger(parentName(n));   <span class="cm">// "a.b.C" → parent "a.b" → "a" → ROOT</span>
            <span class="kw">return new</span> Logger(n, parent, <span class="kw">null</span>);          <span class="cm">// no own level → inherits</span>
        });
    }
    <span class="kw">public static</span> Logger getLogger(Class&lt;?&gt; c) { <span class="kw">return</span> getLogger(c.getName()); }
}`} />
        <Warn><strong>This is a controlled singleton-via-factory, not a hand-rolled global.</strong> Day 21\'s
          verdict applies: oneness through the factory (shared cache), reached via <C>getLogger</C> — never a
          public mutable static you poke directly. And the real work is thread-safety: many threads call
          <C> getLogger</C> and <C>log</C> at once, so the cache (<C>ConcurrentHashMap</C>) and any
          mutable config must be safe under concurrency. That guarantee is Month 4\'s territory; naming it here
          is the senior move.</Warn>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9</div>
        <h2>The concurrency flag: synchronous vs async appenders</h2>
        <p>Logging sits on the hot path of every request. A <C>FileAppender</C> or network appender does
          <strong> I/O</strong> — and if it does that I/O on the calling thread, every request waits for the
          disk:</p>
        <Code html={`  SYNCHRONOUS (simple, but I/O blocks the caller)

  request thread: …work… → log.info() → write to disk (BLOCKS 5ms) → …work…
                                          every request pays the disk latency

  ASYNCHRONOUS (the high-throughput answer)

  request thread: …work… → log.info() → enqueue(event) [microseconds] → …work…
                                              │
   background worker thread:  dequeue → write to disk in batches  ←── decoupled
       TRADE-OFFS to name: events can be LOST on crash (ring buffer), ORDERING
       across threads, BACKPRESSURE when the queue fills (block? drop? grow?).`} />
        <Code html={`<span class="kw">public class</span> AsyncAppender <span class="kw">implements</span> Appender {
    <span class="kw">private final</span> BlockingQueue&lt;LogEvent&gt; queue = <span class="kw">new</span> ArrayBlockingQueue&lt;&gt;(<span class="num">10_000</span>);
    <span class="kw">private final</span> Appender delegate;                  <span class="cm">// wraps a real sink — Decorator (Day 27)!</span>

    <span class="kw">public</span> AsyncAppender(Appender delegate) {
        <span class="kw">this</span>.delegate = delegate;
        Thread worker = <span class="kw">new</span> Thread(<span class="kw">this</span>::drainForever);   <span class="cm">// background writer</span>
        worker.setDaemon(<span class="kw">true</span>); worker.start();
    }
    <span class="kw">public void</span> append(LogEvent e) {
        queue.offer(e);                                <span class="cm">// caller returns immediately (offer = don\'t block; or put = backpressure)</span>
    }
    <span class="kw">private void</span> drainForever() {
        <span class="kw">while</span> (<span class="kw">true</span>) <span class="kw">try</span> { delegate.append(queue.take()); } <span class="kw">catch</span> (InterruptedException ignored) {}
    }
}`} />
        <Good><strong>Notice the pattern reuse:</strong> <C>AsyncAppender</C> <em>wraps</em> another appender —
          that\'s Decorator (Day 27). It adds "do it on a background thread" around any sink without that sink
          knowing. You can wrap a <C>FileAppender</C> or a <C>KafkaAppender</C> identically. The trade-offs
          (loss on crash, ordering, backpressure policy) are exactly the kind of flag to plant now and deepen
          in Month 4 — same as the parking-lot race and the elevator buttons.</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>Levels as strings or bare ints.</strong> <C>"WARN".equals(lvl)</C> has no ordering and
          invites typos; bare ints lose meaning. An ordered enum with an explicit rank field is the answer
          (and don\'t persist <C>ordinal()</C> — Day 19).</Warn>
        <Warn><strong>Eager argument construction.</strong> <C>log.debug("x=" + expensive())</C> builds the
          string even when filtered out. Parameterized logging (<C>"x={}", expensive()</C>) or a lambda
          supplier defers it until the level check passes.</Warn>
        <Warn><strong>The logger formats and routes itself.</strong> One class that filters, formats, AND
          writes to disk is a god-logger — three reasons to change (Day 11). Split into Logger / Appender /
          Layout.</Warn>
        <Warn><strong>if-else over destinations.</strong> <C>if (toFile) … else if (toConsole) …</C> reopens
          for every new sink (Day 12). Appenders behind one interface; add a class, don\'t edit a switch.</Warn>
        <Warn><strong>Synchronous network/file appender on the hot path.</strong> Blocking I/O per request
          tanks latency under load. Wrap with an async appender (and name the durability/ordering trade-offs).</Warn>
        <Warn><strong>A new Logger per call.</strong> <C>new Logger()</C> inside a method loses cached config
          and the hierarchy. Always go through <C>LoggerFactory.getLogger(name)</C> — shared, cached, parented.</Warn>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Four nouns:</strong> <C>LogEvent</C> (WHAT — immutable fact) · <C>Logger</C> (filters + routes) · <C>Appender</C> (WHERE — sink) · <C>Layout</C> (HOW — formatter). Keep them separate.</li>
          <li><strong>Levels:</strong> ordered enum with an explicit rank field; emit when <C>event.level.isAtLeast(threshold)</C>. Never strings/ordinal.</li>
          <li><strong>Hierarchy:</strong> dotted logger names form a tree. Config inherits DOWN (child borrows ancestor\'s level); events propagate UP through ancestors\' appenders = Chain of Responsibility (Day 36); additivity=false stops the chain.</li>
          <li><strong>Appenders + layouts</strong> are Strategy (Day 31): each appender owns a layout; any sink × any format; new ones are additive (Day 12), never edits.</li>
          <li><strong>Facade:</strong> code against SLF4J\'s API; the engine (Logback/Log4j2) is bound at deploy time — Day 29 + Day 15, so backends swap with zero log-call changes.</li>
          <li><strong>LoggerFactory:</strong> <C>getLogger(name)</C> returns a cached, shared, parented logger (controlled singleton-via-factory, not a global) — concurrency-safe cache.</li>
          <li><strong>Performance:</strong> parameterized logging avoids eager argument cost; async appender (a Decorator wrapping a sink) keeps I/O off the hot path — flag loss/ordering/backpressure for Month 4.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Is the logger hierarchy Chain of Responsibility or Composite or Observer?"'>
          <p>Mostly Chain of Responsibility, with a whiff of Composite in the tree shape. The defining move is
            the upward propagation: an event travels from the originating logger up the parent chain, each link
            optionally handling it (its appenders) and passing along, until ROOT or a non-additive link stops
            it (Day 36). The tree of named loggers is Composite-ish (Day 28), and the fan-out to multiple
            appenders at one level is Observer-ish (Day 32) — but the parent-chain traversal that defines the
            behaviour is CoR. Naming the primary pattern and acknowledging the others is the strong answer.</p>
        </Reveal>
        <Reveal summary='Q: "Why does log4j let you set a level per package with one line?"'>
          <p>Because logger names ARE a hierarchy and config inherits down it. <C>com.myapp=DEBUG</C> sets the
            explicit level on the <C>com.myapp</C> logger; every logger under it (<C>com.myapp.web.Controller</C>,
            etc.) has no explicit level and so resolves UP to <C>com.myapp</C>\'s DEBUG. One line configures a
            whole subtree. This is the practical payoff of the effective-level walk in Section 4 — and why you
            should pick logger names that mirror your package structure (the usual <C>getLogger(getClass())</C>).</p>
        </Reveal>
        <Reveal summary='Q: "log.debug with string concatenation is everywhere in our code. How bad, and the fix?"'>
          <p>Bad in proportion to call frequency × argument cost: a debug line on a hot path that serializes an
            object pays that serialization on every request even in production where DEBUG is off — pure waste.
            The fix is parameterized logging (<C>log.debug("cart {}", cart)</C>), which formats only after the
            level check passes, or a lambda supplier for very expensive messages. An <C>isDebugEnabled()</C>
            guard works too but is verbose; parameterized is the idiom. The deeper point: argument evaluation
            is eager in Java, so the level check inside <C>debug()</C> is too late to save you.</p>
        </Reveal>
        <Reveal summary='Q: "How do you make the framework thread-safe?"'>
          <p>Identify the shared mutable state and protect it: the <C>LoggerFactory</C> cache
            (<C>ConcurrentHashMap</C>), per-logger appender lists if they\'re mutated at runtime (copy-on-write
            or synchronized), and especially the appenders\' I/O (two threads writing one file interleave —
            synchronize the write or, better, funnel through a single-consumer async queue). <C>LogEvent</C>
            being immutable (a record) means the event itself is freely shareable across threads — that\'s a
            deliberate design choice that removes a whole class of races. Synchronous appenders need a lock per
            write; async appenders move all writes to one worker thread, sidestepping the contention. Full
            treatment is Month 4, but the map of "what\'s shared and how to guard it" is the answer.</p>
        </Reveal>
        <Reveal summary='Q: "Async logging can lose events on crash. Is that acceptable?"'>
          <p>It depends on the log\'s purpose, and saying so is the point. For debug/info telemetry, losing the
            last few buffered events on a hard crash is usually fine — the throughput win dominates. For an
            AUDIT log (security, financial), it is NOT acceptable: those need synchronous, durable writes (or
            an async appender configured to block/flush rather than drop, accepting the latency). So the mature
            design lets durability be a per-appender policy: a fast async appender for app logs, a synchronous
            durable one for audit. One size does not fit both — and recognizing that two log streams have
            different requirements is exactly the seniority signal.</p>
        </Reveal>
        <Reveal summary='Q: "Where would you add structured logging / MDC (request IDs across a call)?"'>
          <p>Structured logging means the <C>LogEvent</C> carries key-value context, not just a string — so
            extend the event with a <C>Map&lt;String,String&gt;</C> (or typed fields) and let a
            <C> JsonLayout</C> emit them. MDC (Mapped Diagnostic Context) is the mechanism: a thread-local map
            where you stash a request ID at the start of a request, and every log call on that thread
            automatically attaches it to the event — so you can grep all logs for one request across many
            classes. The design hooks: a thread-local context the Logger reads when building the
            <C> LogEvent</C>, and layouts that know how to render the context map. It rides cleanly on the
            existing four-noun model — the event just gets richer.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s12">
        <div className="sec-label">Section 12 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 49 complete?</strong> Homework: build the framework — <C>Level</C> (ordered enum with
        rank), <C>LogEvent</C> (record), <C>Logger</C> with effective-level inheritance and Chain-of-Responsibility
        appender propagation (plus an additivity flag), <C>Appender</C> + <C>Layout</C> interfaces with
        console/file and simple/JSON implementations, and a caching <C>LoggerFactory</C>. Prove it: a test where
        setting <C>com.shop</C> to DEBUG enables debug for <C>com.shop.payment.X</C> by inheritance, and one
        showing additivity=false stops upward propagation. Stretch: wrap a <C>FileAppender</C> in an
        <C> AsyncAppender</C> and confirm the caller returns before the write happens.
        <br /><br />
        Next: <strong>Day 50 — Week 10 Machine-Coding Drill</strong>: the timed dress rehearsal for the
        machines-and-frameworks week — two fresh problems, the self-grading rubric, and the state-machine /
        chain / strategy patterns put under the clock.
      </div>
    </div>
  )
}