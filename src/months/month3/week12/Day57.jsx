import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============ Interactive 1: the dispatch pipeline ============ */
const DISPATCH_STEPS = [
  { stage: 'event', text: 'event: ORDER_SHIPPED', note: 'Something happened in the app. It fires ONE event — it does not know or care how Alice will be told. (Observer-style decoupling, Day 32.)' },
  { stage: 'request', text: 'NotificationRequest(user=Alice, type=TRANSACTIONAL, data={order:#A12})', note: 'The event becomes a channel-agnostic request: WHO, WHAT TYPE, and the DATA. No channel, no wording yet — those are decided downstream.' },
  { stage: 'prefs', text: 'preferences.channelsFor(Alice, TRANSACTIONAL) → [EMAIL, PUSH]', note: 'Resolve Alice\'s preferences: for transactional messages she wants Email + Push, but has SMS off. ONE request now fans out to her chosen channels.' },
  { stage: 'render-email', text: 'template.render(ORDER_SHIPPED, EMAIL, data) → {subject, htmlBody}', note: 'Render the EMAIL version: a subject line + an HTML body. Same event, channel-specific format.' },
  { stage: 'render-push', text: 'template.render(ORDER_SHIPPED, PUSH, data) → {title, shortBody}', note: 'Render the PUSH version: a short title + a one-line body. The TEMPLATE owns wording; the channel owns format.' },
  { stage: 'send-email', text: 'dispatcher.dispatch(emailChannel, Alice, msg)  // async + retry-wrapped', note: 'Hand the email to the dispatcher — which sends asynchronously and retries on failure (§8). The service does not block.' },
  { stage: 'send-push', text: 'dispatcher.dispatch(pushChannel, Alice, msg)', note: 'Same for push. One event → one request → two rendered messages → two independent, reliable sends. Add SMS later = Alice flips a preference, zero code change.' },
]

function DispatchPipeline() {
  const [i, setI] = useState(-1)
  const started = i >= 0
  const done = i >= DISPATCH_STEPS.length - 1
  const step = started ? DISPATCH_STEPS[i] : null

  return (
    <div className="panel">
      <div className="ptitle">Live demo · one event → many channels — step through the dispatch pipeline</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        {DISPATCH_STEPS.map((s, idx) => (
          <div key={idx} style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11.5, padding: '5px 8px', borderRadius: 5,
            border: '1px solid var(--line)',
            background: idx === i ? '#FFF1D6' : idx < i ? '#EAF7EF' : '#fff',
            opacity: idx <= i ? 1 : 0.4,
            fontWeight: idx === i ? 700 : 400,
          }}>{s.text}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {!done
          ? <button className="act" onClick={() => setI((x) => x + 1)}>{started ? 'next →' : '▶ fire the event'}</button>
          : <button className="ghost act" onClick={() => setI(-1)}>reset</button>}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {step ? <span style={{ fontSize: 13 }}>{step.note}</span> : <span>An event fans out to a user\'s chosen channels, each rendered its own way. Step through it.</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 2: the preference matrix ============ */
const TYPES = ['OTP', 'Transactional', 'Marketing']
const CHANNELS = ['Email', 'SMS', 'Push', 'In-App']
const DEFAULT_PREFS = {
  OTP: { Email: false, SMS: true, Push: true, 'In-App': false },
  Transactional: { Email: true, SMS: false, Push: true, 'In-App': true },
  Marketing: { Email: true, SMS: false, Push: false, 'In-App': true },
}

function PreferenceMatrix() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [quiet, setQuiet] = useState(false)
  const [sent, setSent] = useState(null)

  function toggle(type, ch) {
    setPrefs((p) => ({ ...p, [type]: { ...p[type], [ch]: !p[type][ch] } }))
    setSent(null)
  }
  function send(type) {
    let channels = CHANNELS.filter((c) => prefs[type][c])
    let suppressed = false
    if (quiet && type === 'Marketing') { suppressed = true; channels = [] }   // quiet hours mute marketing
    // OTP & transactional are critical → bypass quiet hours (channels unchanged)
    setSent({ type, channels, suppressed })
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · which channels actually fire? — preferences × notification type × quiet hours</div>
      <div style={{ overflowX: 'auto', marginBottom: 10 }}>
        <table className="matrix" style={{ fontSize: 12 }}>
          <thead>
            <tr><th>type \ channel</th>{CHANNELS.map((c) => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {TYPES.map((t) => (
              <tr key={t}>
                <td style={{ fontWeight: 700, fontFamily: 'IBM Plex Mono' }}>{t}</td>
                {CHANNELS.map((c) => (
                  <td key={c} style={{ textAlign: 'center', cursor: 'pointer', background: prefs[t][c] ? '#EAF7EF' : '#fff' }}
                    onClick={() => toggle(t, c)}>
                    {prefs[t][c] ? '✓' : '·'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={quiet} onChange={(e) => { setQuiet(e.target.checked); setSent(null) }} /> 🌙 quiet hours (22:00–07:00)
        </label>
        {TYPES.map((t) => <button key={t} className="act" style={{ fontSize: 12 }} onClick={() => send(t)}>send {t}</button>)}
      </div>
      <div className="statbar" style={{ display: 'block' }}>
        {sent
          ? sent.suppressed
            ? <span style={{ fontSize: 12.5 }}>🌙 <b>{sent.type}</b> suppressed during quiet hours — marketing waits for morning. (OTP/transactional would still fire — critical messages bypass quiet hours.)</span>
            : sent.channels.length
              ? <span style={{ fontSize: 12.5 }}>📨 <b>{sent.type}</b> → fires on: <b>{sent.channels.join(', ')}</b>. The same event respects each user\'s matrix.</span>
              : <span style={{ fontSize: 12.5 }}>🔕 <b>{sent.type}</b> → no channels enabled — the user opted out entirely.</span>
          : <span style={{ fontSize: 12.5 }}>Click a cell to toggle a preference, then "send" a type. Toggle quiet hours and send Marketing vs OTP — critical messages override the mute.</span>}
      </div>
    </div>
  )
}

/* ============ Interactive 3: retry & failover ============ */
const RETRY_SCENARIOS = {
  ok: {
    label: 'all providers up',
    steps: [
      { t: 'attempt 1 · Twilio', ok: true, note: 'Send via primary provider Twilio → ✅ delivered on the first try.' },
    ],
    outcome: '✅ delivered via Twilio (1 attempt).',
  },
  failover: {
    label: 'Twilio down',
    steps: [
      { t: 'attempt 1 · Twilio', ok: false, note: 'Twilio returns 503 → fail. Don\'t give up: schedule a retry with backoff.' },
      { t: 'retry (backoff 1s) · Twilio', ok: false, note: 'After 1s, retry Twilio → still failing. Backoff doubles next time (exponential).' },
      { t: 'failover · MSG91', ok: true, note: 'Primary exhausted → FAILOVER to the secondary provider MSG91 → ✅ delivered. The channel hides which provider succeeded.' },
    ],
    outcome: '✅ delivered via MSG91 after Twilio failover.',
  },
  dead: {
    label: 'all SMS providers down',
    steps: [
      { t: 'attempt 1 · Twilio', ok: false, note: 'Twilio fails.' },
      { t: 'retry (1s) · Twilio', ok: false, note: 'Retry fails.' },
      { t: 'failover · MSG91', ok: false, note: 'Secondary also fails.' },
      { t: 'retry (2s) · MSG91', ok: false, note: 'Exponential backoff, still down. Max attempts reached.' },
      { t: '→ dead-letter queue', dead: true, note: 'After max retries across providers, the message goes to a DEAD-LETTER QUEUE for inspection/alerting — never silently dropped.' },
    ],
    outcome: '⚠️ exhausted all retries → parked in the dead-letter queue (not lost).',
  },
}

function RetryFailover() {
  const [scn, setScn] = useState('failover')
  const [shown, setShown] = useState(0)
  const sc = RETRY_SCENARIOS[scn]
  const done = shown >= sc.steps.length

  function pick(k) { setScn(k); setShown(0) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · sending an SMS reliably — retry with backoff, failover, dead-letter</div>
      <div className="modbtns" style={{ marginBottom: 10 }}>
        {Object.entries(RETRY_SCENARIOS).map(([k, v]) => (
          <button key={k} className={scn === k ? 'on' : ''} style={{ fontSize: 12 }} onClick={() => pick(k)}>{v.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10, minHeight: 40 }}>
        {sc.steps.slice(0, shown).map((s, i) => (
          <div key={i} style={{
            fontFamily: 'IBM Plex Mono', fontSize: 12, padding: '5px 8px', borderRadius: 5,
            border: '1px solid var(--line)',
            background: s.ok ? '#EAF7EF' : s.dead ? '#FFF1D6' : '#FDECEC',
            color: s.ok ? 'var(--green)' : s.dead ? 'var(--amber)' : 'var(--red)',
          }}>{s.ok ? '✅ ' : s.dead ? '⚠️ ' : '❌ '}{s.t}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {!done
          ? <button className="act" onClick={() => setShown((x) => x + 1)}>{shown === 0 ? '▶ send SMS' : 'next attempt →'}</button>
          : <button className="ghost act" onClick={() => setShown(0)}>replay</button>}
      </div>
      <div className="statbar" style={{ display: 'block', background: done ? (scn === 'dead' ? '#FFF1D6' : '#EAF7EF') : undefined }}>
        <span style={{ fontSize: 12.5 }}>
          {shown === 0 ? 'Pick a scenario and send. Watch retry → backoff → failover → dead-letter.'
            : done ? sc.outcome : sc.steps[shown - 1].note}
        </span>
      </div>
    </div>
  )
}

/* ============ Quiz data ============ */
const QUESTIONS = [
  { q: 'Email, SMS, and push should be sent through…',
    o: ['Three separate send methods with if-else on the type', 'One NotificationChannel interface (send), implemented by EmailChannel / SmsChannel / PushChannel — a Strategy family, so a new channel (WhatsApp) is a new class, not an edit (Day 31)', 'A giant switch in the service', 'One method that takes a "type" string'], a: 1,
    e: 'Channels are interchangeable senders behind one contract — textbook Strategy. The service loops over the user\'s channels and calls send() on each; adding WhatsApp is one new class, the service untouched.',
    w: { 0: 'Three methods + if-else is the growing-switch smell (Day 12) — every new channel reopens it.',
         2: 'A switch on channel type scatters the same coupling.',
         3: 'A "type" string is the stringly-typed dispatch the interface replaces.' },
    r: { id: 's3', label: 'Section 3 — channels as strategies' } },
  { q: 'The event that triggers a notification should know…',
    o: ['Exactly which channels and providers to use', 'Nothing about delivery — it fires a channel-agnostic event/request (who, type, data); preferences and templates decide channels and wording downstream (Observer decoupling, Day 32)', 'The user\'s phone number', 'How to render HTML email'], a: 1,
    e: 'The producer (an order shipped) shouldn\'t know Alice prefers push at night. It emits an event; the notification system resolves channels, renders templates, and delivers. WHAT happened is decoupled from HOW it\'s told.',
    w: { 0: 'Baking channels into the event couples every producer to delivery details.',
         2: 'The event carries a user reference; contact details are resolved later.',
         3: 'Rendering is the template engine\'s job, not the event\'s.' },
    r: { id: 's4', label: 'Section 4 — the dispatch pipeline' } },
  { q: 'The same "order shipped" message is a subject+HTML for email but a short title+line for push. The clean design?',
    o: ['One hardcoded string reused everywhere', 'A template rendered PER (notification type, channel): the template owns wording, the channel owns format — so each channel gets an appropriate rendering of the same event', 'Let each channel write its own copy', 'Send the raw data and let the client format it'], a: 1,
    e: 'WHAT is said (the message) varies by event; HOW it reads varies by channel. A template engine renders (type, channel, data) → the right shape (email subject+body, push title+line, SMS 160 chars).',
    w: { 0: 'One string can\'t be both a 160-char SMS and an HTML email.',
         2: 'Per-channel ad-hoc copy duplicates and drifts; centralize in templates.',
         3: 'Pushing formatting to clients scatters presentation and breaks consistency.' },
    r: { id: 's5', label: 'Section 5 — templates' } },
  { q: 'A user has SMS off for marketing but on for OTP. Where does this live?',
    o: ['In the sending code as if-checks', 'In user PREFERENCES resolved per (user, notification type) → the set of channels to use; the dispatch loop just iterates the resolved channels, with no per-type if-logic in the senders', 'In each channel class', 'It cannot be supported'], a: 1,
    e: 'Preferences are a lookup: channelsFor(user, type) returns the enabled channels. The service fans out to exactly those — opt-outs, per-type choices, and quiet hours all resolve here, not scattered through senders.',
    w: { 0: 'if-checks in sending code scatter a cross-cutting policy everywhere.',
         2: 'A channel sends; it shouldn\'t know a user\'s per-type opt-outs.',
         3: 'It\'s a core feature — preferences are a first-class lookup.' },
    r: { id: 's6', label: 'Section 6 — user preferences' } },
  { q: 'Sending is on a network and providers fail. Reliable delivery needs…',
    o: ['Send once and hope', 'Async delivery with retries + exponential backoff, provider FAILOVER (try a secondary), and a dead-letter queue when all retries are exhausted — never block the caller, never silently drop (echoes logging async, Day 49)', 'A bigger timeout', 'Synchronous sends so you know immediately'], a: 1,
    e: 'External sends fail transiently. Enqueue and let workers send with backoff retries; fail over to a secondary provider; park exhausted messages in a dead-letter queue for inspection. Reliability = retry + failover + DLQ + async.',
    w: { 0: 'Send-once loses messages on any transient blip.',
         2: 'A longer timeout just makes the caller wait longer to fail.',
         3: 'Synchronous sends block the request thread on slow third-party APIs.' },
    r: { id: 's8', label: 'Section 8 — reliability' } },
  { q: 'SMS can go through Twilio OR MSG91. How are providers modeled?',
    o: ['Hardcode Twilio in SmsChannel', 'Each provider is an Adapter (Day 26) behind a common SmsProvider port; the SmsChannel tries the primary and FAILS OVER to a secondary — vendors are swappable and testable with a fake', 'A new channel per provider', 'Pick one provider forever'], a: 1,
    e: 'Providers are vendor SDKs wrapped as adapters behind one port. The channel orchestrates primary → failover, and a fake provider makes delivery testable. New vendor = new adapter, no channel change.',
    w: { 0: 'Hardcoding one vendor makes failover and testing impossible.',
         2: 'Provider is orthogonal to channel — Twilio and MSG91 are both SMS.',
         3: 'Single-provider lock-in has no failover when that vendor is down.' },
    r: { id: 's10', label: 'Section 10 — providers as adapters' } },
  { q: 'A transient failure causes a retry, but the first send actually succeeded. The risk and the fix?',
    o: ['No risk — retries are safe', 'Duplicate notifications (the user gets two OTPs); fix with an idempotency key per notification so a retry of an already-sent message is a no-op (same lesson as Days 52/54)', 'The message is lost', 'The provider charges double only'], a: 1,
    e: 'A timed-out-but-succeeded send retried = a duplicate. An idempotency key recorded with the notification makes the retry recognize "already sent" and skip — essential once retries exist.',
    w: { 0: 'Retries are NOT inherently safe — that\'s why idempotency exists.',
         2: 'The opposite — it\'s sent twice, not lost.',
         3: 'Double-charge is a symptom; the user-facing bug is the duplicate message.' },
    r: { id: 's8', label: 'Section 8 — idempotency' } },
  { q: 'An OTP and a marketing blast hit the system at once. A good design treats them…',
    o: ['Identically, first-come-first-served', 'By PRIORITY: OTP is high-priority/low-latency (send now, bypass quiet hours and batching), marketing is low-priority/batchable and respects quiet hours — priority is a property of the notification type', 'Marketing first, it has more volume', 'Randomly'], a: 1,
    e: 'Not all notifications are equal. OTPs are time-critical and must jump the queue; marketing can be batched, throttled, and deferred to daytime. Modeling priority (and quiet-hours bypass for critical types) is what keeps OTPs instant under load.',
    w: { 0: 'FIFO lets a marketing blast delay someone\'s login OTP — unacceptable.',
         2: 'Volume is a reason to DEPRIORITIZE marketing, not to send it first.',
         3: 'Randomness gives no latency guarantee to critical messages.' },
    r: { id: 's6', label: 'Section 6 — priority & quiet hours' } },
]

/* ============ The page ============ */
export default function Day57() {
  return (
    <div className="scrollarea">
      <div className="hero">
        <div className="eyebrow">Month 3 · Week 12 · Day 57 · Classic LLD Problems</div>
        <h1>Notification System:<br />One Event, Many Channels, Delivered Reliably</h1>
        <p>"Send the user a message" hides five things that must each vary independently: the CHANNEL (email /
           SMS / push), the TEMPLATE (how it reads per channel), the user\'s PREFERENCES (what, where, when),
           the PROVIDER (Twilio vs MSG91), and RELIABILITY (retry, failover, dead-letter). It\'s a greatest-hits
           of Strategy, Adapter, and async delivery. Click everything.</p>
        <div className="chips">
          {['notifications', 'channels as strategies', 'templates', 'preferences', 'retry & failover', 'providers/adapters'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* 1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>What "send a notification" really involves</h2>
        <p>The call looks trivial — <C>notify(user, "order shipped")</C> — but five separate concerns hide
          inside it, and each must be able to change without touching the others:</p>
        <Code html={`  ONE notify() CALL, FIVE AXES THAT MUST VARY INDEPENDENTLY

  notify(user, ORDER_SHIPPED, data)
        │
        ├─ CHANNEL    email? SMS? push? in-app?         → Strategy (Day 31)
        ├─ TEMPLATE   how it reads on each channel       → render per (type, channel)
        ├─ PREFERENCE which channels THIS user wants,     → a per-user lookup
        │             for THIS type, at THIS time
        ├─ PROVIDER   Twilio or MSG91 for the SMS?        → Adapter + failover (Day 26)
        └─ RELIABILITY retry, backoff, dead-letter, async → like logging (Day 49)

  Tangle these into one method and every change touches everything.
  Separate them and each is a plug-in.`} />
        <Note><strong>The shape, recognized:</strong> this is a <em>framework/pipeline</em> problem (like the
          logging framework, Day 49) layered with <em>strategy families</em> (channels, providers). The whole
          design is "keep the five axes apart." Name them in minute one and the architecture falls out.</Note>
      </section>

      {/* 2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>The clarifying questions</h2>
        <table className="matrix">
          <thead>
            <tr><th>question</th><th>typical answer</th><th>what it shapes</th></tr>
          </thead>
          <tbody>
            <tr><td>"Which channels?"</td><td>"Email, SMS, push, in-app — more later"</td><td>NotificationChannel strategy family</td></tr>
            <tr><td>"Per-user preferences?"</td><td>"Yes — opt in/out per type, quiet hours"</td><td>preference resolution</td></tr>
            <tr><td>"Notification types?"</td><td>"OTP, transactional, marketing"</td><td>type drives template + priority</td></tr>
            <tr><td>"What if a send fails?"</td><td>"Retry, then try another provider"</td><td>retry/backoff/failover/DLQ</td></tr>
            <tr><td>"Sync or async?"</td><td>"Async — don\'t block the caller"</td><td>queue + workers</td></tr>
            <tr><td>"Multiple providers per channel?"</td><td>"Yes — primary + fallback"</td><td>providers as adapters</td></tr>
          </tbody>
        </table>
        <p>Noun-verb survivors: <em>Notification, NotificationChannel, Template, Recipient/User, Preference,
          Provider, Dispatcher, NotificationType</em>. Filtered (Day 10): <em>"message"</em> is the rendered
          output, <em>"the user"</em> is a Recipient with contact info + preferences, <em>"the system"</em> is
          the god-noun.</p>
      </section>

      {/* 3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Channels behind one interface</h2>
        <p>Email, SMS, and push are interchangeable <em>senders</em> — one contract, many implementations
          (Strategy, Day 31). The service never branches on channel type:</p>
        <Code html={`<span class="kw">public interface</span> NotificationChannel {
    ChannelType type();
    <span class="kw">void</span> send(Recipient to, RenderedMessage message);   <span class="cm">// the whole contract</span>
}

<span class="kw">public class</span> EmailChannel <span class="kw">implements</span> NotificationChannel {
    <span class="kw">private final</span> EmailProvider provider;             <span class="cm">// the actual vendor (§10), injected</span>
    <span class="kw">public</span> ChannelType type() { <span class="kw">return</span> ChannelType.EMAIL; }
    <span class="kw">public void</span> send(Recipient to, RenderedMessage m) {
        provider.sendEmail(to.email(), m.subject(), m.body());
    }
}
<span class="kw">public class</span> SmsChannel <span class="kw">implements</span> NotificationChannel { … to.phone(), m.text() … }
<span class="kw">public class</span> PushChannel <span class="kw">implements</span> NotificationChannel { … to.deviceToken(), m.title(), m.body() … }

<span class="cm">// the service holds a Map&lt;ChannelType, NotificationChannel&gt; and just looks one up — no switch</span>`} />
        <Good><strong>A new channel = a new class.</strong> WhatsApp tomorrow? Implement
          <C> NotificationChannel</C>, register it in the channel map, and it\'s instantly available to every
          user who enables it — the service, templates, and preferences code never change (Day 12 OCP). Channels
          are a Strategy family, exactly like the elevator\'s scheduling and Splitwise\'s split types.</Good>
      </section>

      {/* 4 */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>📨 Play: the dispatch pipeline</h2>
        <p>Watch one event become many deliveries — the producer fires once and stays ignorant of channels:</p>
        <DispatchPipeline />
        <Good><strong>What you should notice:</strong> ① The event names no channel — it just happened
          (Observer decoupling, Day 32). ② Preferences turn one request into a fan-out to the user\'s chosen
          channels. ③ Each channel gets its OWN rendering of the same event. ④ Sends are handed to a dispatcher
          (async + retry), so the caller never waits on a flaky email server.</Good>
      </section>

      {/* 5 */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Templates: same event, channel-specific wording</h2>
        <p>WHAT is said varies by event type; HOW it reads varies by channel. A template engine renders
          <C> (type, channel, data)</C> into the right shape — an email subject+HTML, a 160-char SMS, a push
          title+line:</p>
        <Code html={`<span class="kw">public interface</span> TemplateEngine {
    RenderedMessage render(NotificationType type, ChannelType channel, Map&lt;String, Object&gt; data);
}

<span class="cm">// templates keyed by (type, channel) — wording lives in ONE place, not in senders</span>
<span class="cm">// ORDER_SHIPPED + EMAIL → subject "Your order has shipped!", HTML body with tracking link</span>
<span class="cm">// ORDER_SHIPPED + SMS   → "Order #{id} shipped. Track: {url}"  (short, plain)</span>
<span class="cm">// ORDER_SHIPPED + PUSH  → title "Shipped 📦", body "Your order is on the way"</span>

<span class="kw">public record</span> RenderedMessage(String subject, String body, String title, String text) {}
<span class="cm">// each channel reads the fields it needs — email uses subject+body, SMS uses text, push uses title+body</span>`} />
        <Note><strong>Separation of three things:</strong> the EVENT (what happened), the TEMPLATE (the wording,
          with placeholders filled from data), and the CHANNEL (the delivery format). Centralizing wording in
          templates means a copy change is one edit, not a hunt through every sender — and localization
          (per-language templates) plugs in here too.</Note>
      </section>

      {/* 6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>User preferences: what, where, and when</h2>
        <p>Different users want different things on different channels — and some messages must ignore the
          rules. Preferences resolve, per <C>(user, type)</C>, the set of channels to actually use:</p>
        <Code html={`<span class="kw">public class</span> PreferenceService {
    <span class="kw">public</span> List&lt;ChannelType&gt; channelsFor(User user, NotificationType type, Instant now) {
        <span class="kw">if</span> (type.isCritical()) <span class="kw">return</span> user.defaultChannelsFor(type);  <span class="cm">// OTP bypasses opt-outs & quiet hours</span>
        List&lt;ChannelType&gt; chosen = user.enabledChannels(type);         <span class="cm">// per-type opt-ins</span>
        <span class="kw">if</span> (inQuietHours(user, now)) chosen = onlyNonDisturbing(chosen); <span class="cm">// 🌙 mute marketing at night</span>
        <span class="kw">return</span> chosen;
    }
}`} />
        <Warn><strong>Priority and quiet hours are not optional niceties.</strong> An OTP is time-critical: it
          must send immediately, bypass quiet hours, and jump ahead of a marketing blast. Marketing is
          batchable, throttled, and deferred to daytime. Bake priority into the notification TYPE (critical vs
          bulk) and the dispatcher honors it — otherwise a marketing campaign can delay someone\'s login code.</Warn>
      </section>

      {/* 7 */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>🎛 Play: the preference matrix</h2>
        <p>Toggle channels per type, flip quiet hours, then send — and watch which channels actually fire:</p>
        <PreferenceMatrix />
        <Good><strong>What you should notice:</strong> ① The same "send" resolves to different channels per row
          — preferences are a lookup, not branching in the senders. ② Quiet hours mute Marketing but OTP still
          fires — critical types override the rule. ③ Turn every cell off for a type and the user is fully
          opted out — respected automatically. The matrix IS the policy.</Good>
      </section>

      {/* 8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Reliability: retry, backoff, failover, dead-letter, async</h2>
        <p>Sending crosses the network to third-party APIs that fail. Reliability is its own layer — and it\'s
          the same toolkit as the logging framework\'s async appender (Day 49):</p>
        <Code html={`  THE DISPATCHER (reliability lives here, not in channels)

  notify() ──▶ enqueue(message)  ──▶  [ queue ]  ──▶ worker pool
                (caller returns instantly — ASYNC)        │
                                                          ▼
   for each message:  send via channel
     ├─ success → done
     ├─ transient fail → RETRY with EXPONENTIAL BACKOFF (1s, 2s, 4s…)
     ├─ primary provider exhausted → FAILOVER to secondary (§10)
     └─ all retries + providers exhausted → DEAD-LETTER QUEUE (inspect/alert)

  + IDEMPOTENCY KEY per notification → a retry of an already-sent
    message is a no-op (no duplicate OTPs) — the Day 52/54 lesson again.`} />
        <Warn><strong>Idempotency once retries exist.</strong> A send that times out may have actually
          succeeded; retrying it sends a duplicate (two OTPs, two "payment received" texts). Tag each
          notification with an idempotency key and record sent keys, so a retry recognizes "already delivered"
          and skips. Retry + failover + DLQ make delivery reliable; idempotency makes it <em>exactly-once-ish</em>
          instead of at-least-once.</Warn>
      </section>

      {/* 9 */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>🔁 Play: retry &amp; failover</h2>
        <p>Send an SMS under three conditions and watch the reliability machinery — retry with backoff, failover
          to a second provider, and the dead-letter queue:</p>
        <RetryFailover />
        <Good><strong>What you should notice:</strong> ① A transient failure isn\'t the end — retry with growing
          backoff. ② When the primary provider is exhausted, failover to a secondary; the channel hides which
          one delivered. ③ When everything fails, the message lands in a dead-letter queue — parked for
          inspection, never silently dropped. Reliability is a layer the channels don\'t even know about.</Good>
      </section>

      {/* 10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Providers as adapters + the full architecture</h2>
        <p>A channel may have several vendors. Each vendor SDK is wrapped as an Adapter (Day 26) behind a port,
          so the channel can fail over and tests can inject a fake:</p>
        <Code html={`<span class="kw">public interface</span> SmsProvider { <span class="kw">void</span> sendSms(String phone, String text); }      <span class="cm">// the port</span>
<span class="kw">public class</span> TwilioAdapter <span class="kw">implements</span> SmsProvider { … wraps the Twilio SDK … }
<span class="kw">public class</span> Msg91Adapter <span class="kw">implements</span> SmsProvider { … wraps the MSG91 SDK … }
<span class="kw">public class</span> FakeSmsProvider <span class="kw">implements</span> SmsProvider { … records sends for tests … }`} />
        <Code html={`  THE FULL PICTURE

  app event ──▶ NotificationService
                   │  1. PreferenceService.channelsFor(user, type, now)   → [EMAIL, PUSH]
                   │  2. TemplateEngine.render(type, channel, data)        → RenderedMessage
                   │  3. Dispatcher.dispatch(channel, recipient, message)  → async + retry
                   ▼
            «interface» NotificationChannel ◁── Email / SMS / Push / InApp   (Strategy)
                   │
            «interface» Provider ◁── Twilio / MSG91 / SendGrid …   (Adapter + failover)

  Five axes, five seams: channel, template, preference, provider, reliability.`} />
        <Good><strong>Every change lands in a seam:</strong> new channel → a NotificationChannel; new vendor → a
          provider Adapter; copy/localization → a template; opt-out rule → preferences; backoff tuning → the
          dispatcher. Nothing forces a change across layers — that\'s the payoff of keeping the five axes
          apart.</Good>
      </section>

      {/* 11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>🕳 Common traps</h2>
        <Warn><strong>if-else / switch on channel type.</strong> <C>if (channel == EMAIL) … else if (SMS) …</C>
          everywhere — every new channel reopens it. One <C>NotificationChannel</C> interface, a class per
          channel.</Warn>
        <Warn><strong>The event knows the channel.</strong> Producers hardcoding "send Alice an SMS" couples
          business logic to delivery. Fire a channel-agnostic event; let preferences + templates decide.</Warn>
        <Warn><strong>Synchronous sends on the request path.</strong> Blocking the caller on a slow third-party
          API tanks latency. Enqueue and let workers deliver asynchronously.</Warn>
        <Warn><strong>Retries without idempotency.</strong> A retried-but-already-sent message = duplicate OTPs.
          An idempotency key makes retries safe.</Warn>
        <Warn><strong>Silently dropping failures.</strong> Give up after one failure and messages vanish.
          Retry + backoff + failover, then a dead-letter queue — never a silent drop.</Warn>
        <Warn><strong>One provider, hardcoded.</strong> When the vendor is down, everyone\'s notifications stop.
          Providers behind a port with primary→secondary failover (and a fake for tests).</Warn>
        <Warn><strong>Ignoring priority.</strong> Treating OTP like marketing lets a campaign delay login codes.
          Priority is a property of the type; critical messages jump the queue and bypass quiet hours.</Warn>
      </section>

      {/* 12 */}
      <section id="s12">
        <div className="sec-label">Section 12</div>
        <h2>📋 Cheat sheet</h2>
        <ul>
          <li><strong>Five axes, kept apart:</strong> channel (Strategy), template (per type+channel), preference (per user), provider (Adapter+failover), reliability (retry/backoff/DLQ/async).</li>
          <li><strong>Channels:</strong> one <C>NotificationChannel</C> interface; Email/SMS/Push/InApp as classes; the service looks one up in a map — no switch. New channel = new class.</li>
          <li><strong>Decouple producer from delivery</strong> (Observer, Day 32): the event fires channel-agnostic; preferences + templates decide channels and wording.</li>
          <li><strong>Templates</strong> render <C>(type, channel, data)</C> → channel-appropriate message; wording in one place; localization plugs in here.</li>
          <li><strong>Preferences</strong> resolve <C>channelsFor(user, type, now)</C> — opt-outs, quiet hours, and critical-type bypass all here.</li>
          <li><strong>Reliability:</strong> async queue + workers, retry with exponential backoff, provider failover, dead-letter queue, and an idempotency key so retries don\'t duplicate.</li>
          <li><strong>Providers</strong> are Adapters (Day 26) behind a port — primary→secondary failover, fake for tests. <strong>Priority</strong> (OTP &gt; marketing) is a property of the type.</li>
        </ul>
      </section>

      {/* interview corner */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>🎤 The follow-ups they actually ask</h2>
        <p>Answer each in your head BEFORE revealing.</p>
        <Reveal summary='Q: "Guarantee a user never gets the same notification twice."'>
          <p>Idempotency, end to end. Give each notification a stable idempotency key (e.g. hash of user + event
            + a dedupe window, or the event\'s own id). Record delivered keys; before sending, check-and-set the
            key atomically (the Day 21 race again) so concurrent workers don\'t both send. Retries then recognize
            "already sent" and no-op. Note the honest limit: across the network you get at-least-once by default,
            and idempotency at the SEND boundary is what turns it into effectively exactly-once — true
            exactly-once delivery is impossible, so you dedupe at the edge.</p>
        </Reveal>
        <Reveal summary='Q: "How do you handle a marketing blast to 10 million users without melting providers?"'>
          <p>Batching + rate limiting + backpressure. The dispatcher pulls from the queue at a controlled rate
            (a token-bucket rate limiter per provider, respecting each vendor\'s quota), batches where the
            provider supports bulk APIs, and spreads the send over time. Priority queues keep OTPs jumping ahead
            of the campaign. Backpressure: if the queue grows faster than you can send, you shed or defer
            low-priority traffic, never critical. The key framing: marketing is throughput-oriented and
            deferrable; OTP is latency-oriented and must never queue behind it — separate lanes.</p>
        </Reveal>
        <Reveal summary='Q: "Where does the Observer pattern actually fit here?"'>
          <p>At the producer boundary: business code publishes domain events ("OrderShipped") to an event
            bus/topic, and the NotificationService is a SUBSCRIBER that turns relevant events into
            notifications — so producers never call the notification system directly (Day 32). This keeps the
            order service ignorant of email/SMS entirely, and lets OTHER subscribers (analytics, audit) react to
            the same event. Inside the notification system it\'s more pipeline/strategy than observer; the
            Observer decoupling is specifically the producer→system seam.</p>
        </Reveal>
        <Reveal summary='Q: "A user updates preferences mid-flight while a notification is being dispatched. Race?"'>
          <p>Possible, and usually acceptable if you resolve preferences ONCE at dispatch time and treat that
            snapshot as authoritative for this message — a notification already enqueued with resolved channels
            completes as decided. For correctness on opt-OUTS (legally important — someone unsubscribing from
            marketing), re-check the critical opt-out just before send, or keep the window tiny. The design
            point: decide WHEN you snapshot preferences (at enqueue vs at send) and state the trade — at-send is
            safer for opt-outs, at-enqueue is simpler. It\'s the same "when do you read the shared state?"
            question as everywhere else.</p>
        </Reveal>
        <Reveal summary='Q: "How would you test this without sending real emails/SMS?"'>
          <p>Everything external is behind a port, so inject fakes: a <C>FakeSmsProvider</C> that records sends
            (and can be told to fail to test retry/failover), a fake clock for quiet-hours logic (Day 47), and
            an in-memory queue. Then assert: the right channels fire for a given preference matrix; quiet hours
            suppress marketing but not OTP; a failing primary provider triggers failover to the secondary; max
            retries route to the dead-letter queue; and a duplicate idempotency key sends only once. Because the
            five axes are seams, each is independently testable — no network, no flakiness. That testability is
            the whole reason for the ports.</p>
        </Reveal>
        <Reveal summary='Q: "User has email + SMS + push on for OTP. Send all three, or just one?"'>
          <p>A real product decision worth surfacing, not assuming. For OTP specifically, sending on ALL enabled
            channels is wasteful and can confuse (which code?) — many systems pick ONE channel by a fallback
            order (push if device active, else SMS, else email) and only escalate to the next if the first
            isn\'t confirmed. For transactional/marketing, fan-out to all enabled channels is fine. So the
            answer depends on type: OTP = pick-one-with-fallback, others = fan-out. The senior move is asking
            "send to all enabled, or pick one?" rather than silently doing either — it changes the dispatch
            logic.</p>
        </Reveal>
      </section>

      {/* quiz */}
      <section id="s13">
        <div className="sec-label">Section 13 · Test yourself</div>
        <h2>🧠 Quiz — 8 questions</h2>
        <p>Click an answer. Green = correct, red = wrong. Every question shows an explanation — read it even when you are right.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      <div className="footer">
        <strong>Day 57 complete?</strong> Homework: build it — a <C>NotificationChannel</C> interface with
        Email/SMS/Push classes, a <C>TemplateEngine</C> that renders per (type, channel), a
        <C> PreferenceService.channelsFor(user, type, now)</C> honoring opt-outs + quiet hours + critical
        bypass, and a <C>Dispatcher</C> that sends async with retry/backoff, provider failover, and a
        dead-letter queue. Prove it with fakes: (a) the right channels fire per preference matrix; (b) quiet
        hours suppress marketing but not OTP; (c) a failing primary provider fails over to the secondary;
        (d) a duplicate idempotency key sends only once. Stretch: add a token-bucket rate limiter per provider.
        <br /><br />
        Next: <strong>Day 58 — Cab Booking, Part 1</strong>: the big one — riders and drivers, matching the
        nearest available driver, the trip lifecycle, and the location/state problems that make ride-hailing
        hard.
      </div>
    </div>
  )
}
