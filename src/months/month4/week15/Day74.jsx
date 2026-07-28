import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Shared constants / seed data
   ============================================================ */
const MEMBERS = [
  { id: 'm1', name: 'Alice',  initials: 'AL', color: '#4FC3F7' },
  { id: 'm2', name: 'Bob',    initials: 'BO', color: '#81C784' },
  { id: 'm3', name: 'Cara',   initials: 'CA', color: '#FFB74D' },
]

const LABELS = [
  { id: 'l1', name: 'Bug',     color: '#EF5350' },
  { id: 'l2', name: 'Feature', color: '#42A5F5' },
  { id: 'l3', name: 'Docs',    color: '#66BB6A' },
  { id: 'l4', name: 'Chore',   color: '#AB47BC' },
]

/* ── tiny helpers ── */
function Avatar({ member, size = 26 }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: member.color, color: '#fff',
      fontSize: size * 0.4, fontWeight: 700,
      fontFamily: 'IBM Plex Mono', flexShrink: 0,
    }}>
      {member.initials}
    </span>
  )
}

function LabelChip({ label, small }) {
  return (
    <span style={{
      background: label.color + '22', color: label.color,
      border: `1px solid ${label.color}55`,
      borderRadius: 4, padding: small ? '1px 5px' : '2px 7px',
      fontSize: small ? 9.5 : 10.5, fontWeight: 700,
      fontFamily: 'IBM Plex Mono', whiteSpace: 'nowrap',
    }}>
      {label.name}
    </span>
  )
}

/* ============================================================
   Demo 1 — Kanban board with move + move log
   ============================================================ */
const INIT_COLUMNS_D1 = [
  { id: 'c1', title: 'Todo' },
  { id: 'c2', title: 'In Progress' },
  { id: 'c3', title: 'Done' },
]

const INIT_TASKS_D1 = [
  { id: 't1', title: 'Fix login bug',    colId: 'c1', labelId: 'l1', memberId: 'm1', pos: 0 },
  { id: 't2', title: 'Add dark mode',    colId: 'c1', labelId: 'l2', memberId: 'm2', pos: 1 },
  { id: 't3', title: 'Update README',    colId: 'c2', labelId: 'l3', memberId: 'm3', pos: 0 },
  { id: 't4', title: 'Refactor auth',    colId: 'c2', labelId: 'l4', memberId: 'm1', pos: 1 },
  { id: 't5', title: 'Write unit tests', colId: 'c3', labelId: 'l3', memberId: 'm2', pos: 0 },
  { id: 't6', title: 'Deploy to prod',   colId: 'c3', labelId: 'l4', memberId: 'm3', pos: 1 },
]

function TaskCard({ task, columns, onMove }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const label  = LABELS.find(l => l.id === task.labelId)
  const member = MEMBERS.find(m => m.id === task.memberId)
  const otherCols = columns.filter(c => c.id !== task.colId)

  return (
    <div style={{
      background: '#fff', border: '1px solid #DCD9CF',
      borderRadius: 7, padding: '9px 11px', marginBottom: 7,
      boxShadow: '0 1px 3px rgba(0,0,0,.07)', position: 'relative',
      cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.3, flex: 1 }}>{task.title}</span>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: '0 0 0 6px', color: '#7c8aa5', lineHeight: 1 }}>
          ⋯
        </button>
      </div>
      <div style={{ display: 'flex', gap: 5, marginTop: 6, alignItems: 'center' }}>
        {label && <LabelChip label={label} small />}
        {member && <Avatar member={member} size={20} />}
      </div>
      {menuOpen && (
        <div style={{
          position: 'absolute', right: 8, top: 32,
          background: '#fff', border: '1px solid #DCD9CF',
          borderRadius: 6, padding: '4px 0',
          zIndex: 10, minWidth: 130, boxShadow: '0 4px 12px rgba(0,0,0,.12)',
        }}>
          <div style={{ fontSize: 10, color: '#7c8aa5', padding: '3px 10px', fontWeight: 600 }}>Move to →</div>
          {otherCols.map(col => (
            <button
              key={col.id}
              onClick={() => { onMove(task, col); setMenuOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '5px 10px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 12, color: 'var(--ink)',
              }}
              onMouseEnter={e => e.target.style.background = '#f0f4ff'}
              onMouseLeave={e => e.target.style.background = 'none'}
            >
              {col.title}
            </button>
          ))}
          <button
            onClick={() => setMenuOpen(false)}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#7c8aa5' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

function KanbanBoardDemo() {
  const [tasks, setTasks]   = useState(INIT_TASKS_D1)
  const [log, setLog]       = useState([])
  const mover = MEMBERS[0] // Alice always moves for demo

  function moveTask(task, targetCol) {
    const fromCol = INIT_COLUMNS_D1.find(c => c.id === task.colId)
    const toColTaskCount = tasks.filter(t => t.colId === targetCol.id).length
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, colId: targetCol.id, pos: toColTaskCount } : t
    ))
    setLog(prev => [
      {
        id: Date.now(),
        text: `"${task.title}" moved from ${fromCol.title} → ${targetCol.title} by ${mover.name}`,
        at: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 9),
    ])
  }

  function reset() { setTasks(INIT_TASKS_D1); setLog([]) }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Kanban board — click ⋯ on any card to move it between columns</div>

      {/* Board */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        {INIT_COLUMNS_D1.map(col => {
          const colTasks = tasks.filter(t => t.colId === col.id).sort((a, b) => a.pos - b.pos)
          return (
            <div key={col.id} style={{ background: '#F5F3EE', borderRadius: 8, padding: '10px 10px 4px' }}>
              <div style={{
                fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12,
                color: '#1B2A4A', marginBottom: 10, display: 'flex', justifyContent: 'space-between',
              }}>
                {col.title}
                <span style={{ background: '#DCD9CF', borderRadius: 10, padding: '1px 7px', fontSize: 10.5, fontWeight: 600 }}>
                  {colTasks.length}
                </span>
              </div>
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task} columns={INIT_COLUMNS_D1} onMove={moveTask} />
              ))}
              {colTasks.length === 0 && (
                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>
                  Empty
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Move log */}
      <div style={{ borderTop: '1px solid #DCD9CF', paddingTop: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 7, fontFamily: 'Space Grotesk', display: 'flex', justifyContent: 'space-between' }}>
          Move History
          <button className="act ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={reset}>Reset board</button>
        </div>
        {log.length === 0
          ? <div style={{ fontSize: 11.5, color: '#aaa', fontStyle: 'italic' }}>No moves yet — click ⋯ on a card to move it</div>
          : log.map(entry => (
              <div key={entry.id} style={{
                fontFamily: 'IBM Plex Mono', fontSize: 11,
                color: '#2a7a3a', background: '#E8F5E9',
                borderRadius: 5, padding: '4px 9px', marginBottom: 4,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{entry.text}</span>
                <span style={{ color: '#7c8aa5', flexShrink: 0, marginLeft: 10 }}>{entry.at}</span>
              </div>
            ))
        }
      </div>
      <Good>
        Every move creates a <b>TaskMoveEvent</b> record (taskId, fromColumn, toColumn, movedBy, movedAt).
        This is the history — the board state is always reconstructible from this event log. Notice
        that you are moving DATA between columns, not transitioning through an enum — the column titles
        are not in any source file.
      </Good>
    </div>
  )
}

/* ============================================================
   Demo 2 — Undo / Redo with history + redo stacks
   ============================================================ */
const INIT_COLS_D2 = [
  { id: 'a', title: 'Backlog' },
  { id: 'b', title: 'In Review' },
]
const INIT_TASKS_D2 = [
  { id: 'p1', title: 'Design API schema',    colId: 'a', pos: 0 },
  { id: 'p2', title: 'Code review PR #42',   colId: 'a', pos: 1 },
  { id: 'p3', title: 'Update changelog',     colId: 'b', pos: 0 },
  { id: 'p4', title: 'Fix CI pipeline',      colId: 'b', pos: 1 },
]

function UndoRedoDemo() {
  const [tasks,    setTasks]   = useState(INIT_TASKS_D2)
  const [history,  setHistory] = useState([])  // stack of commands (newest last)
  const [redoStack, setRedoStack] = useState([]) // redo candidates

  function applyMove(tasksBefore, cmd) {
    // execute: move task to toColId
    return tasksBefore.map(t => t.id === cmd.taskId
      ? { ...t, colId: cmd.toColId, pos: cmd.toPos }
      : t
    )
  }

  function undoMove(tasksBefore, cmd) {
    // undo: move task back to fromColId
    return tasksBefore.map(t => t.id === cmd.taskId
      ? { ...t, colId: cmd.fromColId, pos: cmd.fromPos }
      : t
    )
  }

  function moveTask(task, targetColId) {
    const cmd = {
      id: Date.now(),
      taskId:    task.id,
      taskTitle: task.title,
      fromColId: task.colId,
      fromPos:   task.pos,
      toColId:   targetColId,
      toPos:     tasks.filter(t => t.colId === targetColId).length,
      fromLabel: INIT_COLS_D2.find(c => c.id === task.colId)?.title,
      toLabel:   INIT_COLS_D2.find(c => c.id === targetColId)?.title,
    }
    setTasks(prev => applyMove(prev, cmd))
    setHistory(prev => [...prev, cmd])
    setRedoStack([]) // new move clears redo stack
  }

  function undo() {
    if (history.length === 0) return
    const cmd = history[history.length - 1]
    setTasks(prev => undoMove(prev, cmd))
    setHistory(prev => prev.slice(0, -1))
    setRedoStack(prev => [cmd, ...prev])
  }

  function redo() {
    if (redoStack.length === 0) return
    const cmd = redoStack[0]
    setTasks(prev => applyMove(prev, cmd))
    setRedoStack(prev => prev.slice(1))
    setHistory(prev => [...prev, cmd])
  }

  function reset() {
    setTasks(INIT_TASKS_D2)
    setHistory([])
    setRedoStack([])
  }

  const colA = tasks.filter(t => t.colId === 'a').sort((a, b) => a.pos - b.pos)
  const colB = tasks.filter(t => t.colId === 'b').sort((a, b) => a.pos - b.pos)

  return (
    <div className="panel">
      <div className="ptitle">Live demo · move tasks then undo / redo — watch the history and redo stacks</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* Column A */}
        <div style={{ background: '#F5F3EE', borderRadius: 8, padding: '10px 10px 8px' }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
            Backlog <span style={{ background: '#DCD9CF', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{colA.length}</span>
          </div>
          {colA.map(t => (
            <div key={t.id} style={{
              background: '#fff', border: '1px solid #DCD9CF', borderRadius: 6,
              padding: '8px 10px', marginBottom: 6, fontSize: 12,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 5 }}>{t.title}</div>
              <button className="act" style={{ fontSize: 10, padding: '3px 8px' }}
                onClick={() => moveTask(t, 'b')}>
                Move to In Review →
              </button>
            </div>
          ))}
          {colA.length === 0 && <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', padding: 10, fontStyle: 'italic' }}>Empty</div>}
        </div>

        {/* Column B */}
        <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '10px 10px 8px', borderTop: '3px solid #2D5BFF' }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--blue)', marginBottom: 8 }}>
            In Review <span style={{ background: '#C7D7FF', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{colB.length}</span>
          </div>
          {colB.map(t => (
            <div key={t.id} style={{
              background: '#fff', border: '1px solid #C7D7FF', borderRadius: 6,
              padding: '8px 10px', marginBottom: 6, fontSize: 12,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 5 }}>{t.title}</div>
              <button className="act ghost" style={{ fontSize: 10, padding: '3px 8px' }}
                onClick={() => moveTask(t, 'a')}>
                ← Back to Backlog
              </button>
            </div>
          ))}
          {colB.length === 0 && <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', padding: 10, fontStyle: 'italic' }}>Empty</div>}
        </div>

        {/* Undo / Redo controls */}
        <div>
          {/* Undo controls */}
          <div style={{ marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="act" onClick={undo} disabled={history.length === 0}
              style={{ fontSize: 12, padding: '6px 12px' }}>
              ↩ Undo
            </button>
            <button className="act ghost" onClick={redo} disabled={redoStack.length === 0}
              style={{ fontSize: 12, padding: '6px 12px' }}>
              Redo ↪
            </button>
            <button className="act ghost" onClick={reset}
              style={{ fontSize: 12, padding: '6px 12px' }}>
              Reset
            </button>
          </div>

          {/* History stack */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 5, color: '#1B2A4A' }}>
              History stack ({history.length})
            </div>
            <div style={{ maxHeight: 120, overflowY: 'auto' }}>
              {history.length === 0
                ? <div style={{ fontSize: 10.5, color: '#aaa', fontStyle: 'italic' }}>History empty</div>
                : [...history].reverse().map((cmd, i) => (
                    <div key={cmd.id} style={{
                      background: i === 0 ? '#E3F2FD' : '#f5f5f2',
                      borderRadius: 4, padding: '4px 7px', marginBottom: 3,
                      fontSize: 10.5, fontFamily: 'IBM Plex Mono',
                      border: i === 0 ? '1px solid #90CAF9' : '1px solid #e0e0e0',
                    }}>
                      {i === 0 ? '▶ ' : ''}{cmd.taskTitle.slice(0, 18)} {cmd.fromLabel} → {cmd.toLabel}
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Redo stack */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 5, color: '#7c8aa5' }}>
              Redo stack ({redoStack.length})
            </div>
            <div style={{ maxHeight: 80, overflowY: 'auto' }}>
              {redoStack.length === 0
                ? <div style={{ fontSize: 10.5, color: '#aaa', fontStyle: 'italic' }}>Nothing to redo</div>
                : redoStack.map((cmd, i) => (
                    <div key={cmd.id} style={{
                      background: '#FFF8E1', borderRadius: 4, padding: '4px 7px', marginBottom: 3,
                      fontSize: 10.5, fontFamily: 'IBM Plex Mono', border: '1px solid #FFE082',
                    }}>
                      {i === 0 ? '▶ ' : ''}{cmd.taskTitle.slice(0, 18)} {cmd.fromLabel} → {cmd.toLabel}
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </div>

      <Note>
        Notice: making a <b>new move after Undo clears the redo stack</b> entirely (just like a text
        editor). You created a new future — the old redo branch is discarded. This is the correct
        behavior for a linear command history.
      </Note>
    </div>
  )
}

/* ============================================================
   Demo 3 — Task detail: due dates, assignee, labels, Observer toast
   ============================================================ */
const TODAY = new Date()
function dateOffsetStr(offsetDays) {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

const INIT_TASKS_D3 = [
  { id: 'x1', title: 'Design homepage mockup',  memberId: 'm1', labelId: 'l2', due: dateOffsetStr(-1),  done: false },
  { id: 'x2', title: 'Fix broken API endpoint', memberId: 'm2', labelId: 'l1', due: dateOffsetStr(1),   done: false },
  { id: 'x3', title: 'Write release notes',     memberId: 'm3', labelId: 'l3', due: dateOffsetStr(2),   done: false },
  { id: 'x4', title: 'Bump npm dependencies',   memberId: 'm1', labelId: 'l4', due: dateOffsetStr(5),   done: false },
  { id: 'x5', title: 'Performance benchmarks',  memberId: 'm2', labelId: 'l2', due: dateOffsetStr(10),  done: false },
]

function dueDaysFrom(dateStr) {
  const due  = new Date(dateStr)
  const now  = new Date(TODAY)
  due.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.round((due - now) / 86400000)
}

function DueDashboardDemo() {
  const [tasks,       setTasks]       = useState(INIT_TASKS_D3)
  const [dueSoonMode, setDueSoonMode] = useState(false)
  const [toast,       setToast]       = useState(null)

  function reassign(taskId, newMemberId) {
    const newMember = MEMBERS.find(m => m.id === newMemberId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, memberId: newMemberId } : t))
    setToast(`Notification sent to ${newMember.name} — you've been assigned a task`)
    setTimeout(() => setToast(null), 3000)
  }

  function addLabel(taskId, labelId) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, labelId } : t))
  }

  function dueStyle(dateStr) {
    if (!dueSoonMode) return {}
    const diff = dueDaysFrom(dateStr)
    if (diff < 0)  return { background: '#FFEBEE', border: '1.5px solid #EF9A9A' }
    if (diff <= 3) return { background: '#FFF8E1', border: '1.5px solid #FFE082' }
    return {}
  }

  function dueBadge(dateStr) {
    if (!dueSoonMode) return null
    const diff = dueDaysFrom(dateStr)
    if (diff < 0)  return <span style={{ fontSize: 9.5, fontWeight: 700, color: '#c62828', marginLeft: 5 }}>OVERDUE ({Math.abs(diff)}d ago)</span>
    if (diff === 0) return <span style={{ fontSize: 9.5, fontWeight: 700, color: '#e65100', marginLeft: 5 }}>DUE TODAY</span>
    if (diff <= 3)  return <span style={{ fontSize: 9.5, fontWeight: 700, color: '#f57f17', marginLeft: 5 }}>DUE SOON ({diff}d)</span>
    return null
  }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · task list with due dates — reassign members and watch Observer fire</div>

      {/* Toast */}
      {toast && (
        <div style={{
          background: '#E8F5E9', border: '1.5px solid #81C784',
          borderRadius: 7, padding: '8px 14px', marginBottom: 12,
          fontSize: 12.5, fontFamily: 'IBM Plex Mono', color: '#2E7D32',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          🔔 <b>Observer fired:</b> {toast}
        </div>
      )}

      {/* Controls */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <input type="checkbox" checked={dueSoonMode} onChange={e => setDueSoonMode(e.target.checked)} />
          View: Due Soon (highlight overdue red, due within 3 days amber)
        </label>
      </div>

      {/* Task list */}
      {tasks.map(task => {
        const member = MEMBERS.find(m => m.id === task.memberId)
        const label  = LABELS.find(l => l.id === task.labelId)
        return (
          <div key={task.id} style={{
            border: '1px solid #DCD9CF', borderRadius: 8,
            padding: '11px 14px', marginBottom: 10,
            transition: 'background .2s, border .2s',
            ...dueStyle(task.due),
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              {/* Left: title + label + due */}
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5 }}>{task.title}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {label && <LabelChip label={label} small />}
                  <span style={{ fontSize: 11, color: '#7c8aa5', fontFamily: 'IBM Plex Mono' }}>
                    Due: {task.due}
                  </span>
                  {dueBadge(task.due)}
                </div>
              </div>

              {/* Right: controls */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Assignee picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Avatar member={member} size={24} />
                  <select
                    value={task.memberId}
                    onChange={e => reassign(task.id, e.target.value)}
                    style={{
                      fontSize: 11, padding: '3px 6px', border: '1px solid #DCD9CF',
                      borderRadius: 5, background: '#fff', cursor: 'pointer',
                    }}>
                    {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                {/* Label picker */}
                <select
                  value={task.labelId}
                  onChange={e => addLabel(task.id, e.target.value)}
                  style={{
                    fontSize: 11, padding: '3px 6px', border: '1px solid #DCD9CF',
                    borderRadius: 5, background: '#fff', cursor: 'pointer',
                  }}>
                  {LABELS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )
      })}

      <Good>
        Reassigning a task <b>fires an Observer notification</b> (Day 32): the assignee is notified
        via the toast. In a real system this would send an email or push notification. The task board
        does not know or care how the notification is delivered — it just calls <C>notifyObservers(event)</C>.
        Toggle "View: Due Soon" to run <C>findTasksDueSoon(board, 3)</C> and see overdue tasks
        highlighted in red, tasks due within 3 days in amber.
      </Good>
    </div>
  )
}

/* ============================================================
   Quiz data
   ============================================================ */
const QUESTIONS = [
  {
    q: 'What is the fundamental difference between a task board\'s columns and the states in most other state machines (like parking spots or vending machines)?',
    o: [
      'Task board columns are final and cannot change once created',
      'Other state machines always have more states than a task board has columns',
      'Task board columns are runtime data that users create and rename; other state machines have states baked into the source code',
      'Task board columns are stored as an enum, other state machines use classes',
    ],
    a: 2,
    e: 'Columns live in the database — users can add "UX Review", rename "Done" to "Shipped", or delete "Blocked" at runtime without redeploying code. A parking spot or vending machine has fixed states (AVAILABLE/OCCUPIED, IDLE/HAS_MONEY) coded as enums because they never change.',
    w: {
      0: 'Columns are highly mutable — add, rename, reorder, and delete are all core features of a task board.',
      1: 'The number of states is irrelevant. The defining difference is whether the states are known at compile time (fixed enum) or created at runtime (data).',
      3: 'The exact opposite is true. Task board columns CANNOT be an enum because they change at runtime. State machines with fixed states use enums.',
    },
    r: { id: 's1', label: 'Section 1 — The corkboard analogy' },
  },
  {
    q: 'Why is moving a task modeled as a Command (TaskMoveCommand) rather than just updating task.columnId?',
    o: [
      'The Command captures fromColumn, toColumn, and timestamp — enabling undo, redo, and a full audit history',
      'Direct field updates would violate the Single Responsibility Principle',
      'Command pattern is required whenever you deal with lists',
      'Commands are faster to execute than direct field updates',
    ],
    a: 0,
    e: 'A direct task.columnId = "c2" loses all information about where the task came from and when it moved. The Command record stores the full context (fromColId, fromPos, toColId, toPos, movedAt) so you can: (1) replay the history to reconstruct any past board state, (2) undo by calling command.undo(), and (3) redo after undo.',
    w: {
      1: 'SRP is not violated by a direct update. The reason for Command is undo/redo and audit history, not SRP.',
      2: 'Command pattern is chosen specifically when you need undo/redo or history — not as a blanket rule for lists.',
      3: 'Performance is not the reason. Commands add a tiny overhead over a direct field update. The reason is correctness and reversibility.',
    },
    r: { id: 's6', label: 'Section 6 — Movement as Command' },
  },
  {
    q: 'After performing three moves (A→B, B→C, A→C) and undoing the last two, what happens when you make a new move?',
    o: [
      'The new move is added at position 1 in the history, not at the end',
      'The new move fails because you must redo before moving again',
      'The redo stack is cleared — the undone moves are permanently lost',
      'The new move is added and the redo stack keeps the two undone moves for later',
    ],
    a: 2,
    e: 'A new move after undo creates a new future, discarding the old redo branch entirely. This is standard behavior in text editors, Git, and Figma: once you diverge from the undone path, the redo stack clears. Otherwise the history would branch into a tree, which is far more complex to manage.',
    w: {
      0: 'New commands always go to the END (top of stack) of the history. History is LIFO — last-in is first-undone.',
      1: 'You are never required to redo before moving. You can freely mix moves and undos.',
      3: 'Keeping the redo stack after a new move would create a branching history. Virtually no real system implements this — linear history is the correct default.',
    },
    r: { id: 's6', label: 'Section 6 — Undo/redo stack mechanics' },
  },
  {
    q: 'What is "fractional indexing" and why do real systems like Trello use it instead of integer positions?',
    o: [
      'A method to sort tasks alphabetically using their titles',
      'A way to store positions as floating-point numbers to avoid shifting all other tasks when inserting',
      'A compression algorithm that reduces the database size of position fields',
      'An index data structure optimized for fractional ownership of tasks',
    ],
    a: 1,
    e: 'Integer positions require shifting every task at or above the insertion point when you insert at position P (O(n) writes). Fractional indexing stores positions as strings or floats where inserting between positions "1" and "2" gives "1.5" — no other rows need to change (O(1) write). Trello uses this to avoid updating every card in a column on every drag.',
    w: {
      0: 'Alphabetical sorting by title is a different feature (TaskSortStrategy). Fractional indexing is purely about drag-and-drop position ordering.',
      2: 'Fractional indexing is a logical ordering strategy, not a compression algorithm. It has nothing to do with database storage size.',
      3: 'The word "fractional" refers to numbers between integers, not fractional ownership. Tasks are owned by one column.',
    },
    r: { id: 's4', label: 'Section 4 — Task ordering and fractional indexing' },
  },
  {
    q: 'The Workspace → Board → Column → Task hierarchy is an example of which design pattern?',
    o: ['Strategy', 'Decorator', 'Chain of Responsibility', 'Composite'],
    a: 3,
    e: 'Composite (Day 28): a tree of objects where each level contains children of the next level. Workspace contains Boards, each Board contains Columns, each Column contains Tasks. Operations like "find all overdue tasks in this workspace" recurse down the tree — the same traversal code works at any level.',
    w: {
      0: 'Strategy is about swapping algorithms (like sort order). It does not describe a tree of parent-child containers.',
      1: 'Decorator wraps one object to add behavior. The Workspace/Board/Column/Task is a containment hierarchy, not a wrapper chain.',
      2: 'Chain of Responsibility passes a request along a handler chain. The task board tree is a data hierarchy, not a request-routing chain.',
    },
    r: { id: 's3', label: 'Section 3 — Composite tree diagram' },
  },
  {
    q: 'When a member is assigned to a task, the system sends them a notification. Which pattern models this notification?',
    o: ['Command', 'Template Method', 'Facade', 'Observer'],
    a: 3,
    e: 'Observer (Day 32): the task board fires an AssignmentEvent, and all registered listeners (email sender, push notifier, in-app badge updater) react to it. The board does not know or care which delivery channels exist — it just calls notifyObservers(event). Adding a Slack notification requires only registering a new observer, not changing the board code.',
    w: {
      0: 'Command encapsulates an action for undo/redo. Notification is fire-and-forget — it does not need to be reversed.',
      1: 'Template Method defines a skeleton algorithm with steps for subclasses to fill in. Notification dispatch is not a skeleton algorithm.',
      2: 'Facade simplifies a complex subsystem behind one interface. It does not model the publish-subscribe notification relationship.',
    },
    r: { id: 's8', label: 'Section 8 — Observer notifications on assignment' },
  },
  {
    q: 'Why can\'t you delete a column that still has tasks in it without additional logic?',
    o: [
      'Deleting a column with tasks is always safe because tasks are stored separately',
      'Tasks inside a deleted column become orphans — they have a columnId that no longer exists',
      'Column deletion is blocked by the Java garbage collector',
      'The Composite pattern prevents leaf nodes from being removed before their parents',
    ],
    a: 1,
    e: 'Column is the parent in the Composite tree. If you delete a Column while it has Task children, those tasks have columnId pointing to a deleted column — they become orphans. The correct flow: either (a) reject delete if tasks exist, (b) ask the user to move tasks first, or (c) cascade-delete all tasks in the column. Each is a valid policy choice, but you must make it explicit.',
    w: {
      0: 'Tasks being stored in a separate table does not prevent orphaning — it makes orphaning easier, because the foreign key can dangle if there is no constraint.',
      2: 'Java GC removes objects with no live references. In a database there is no GC; you must handle cascades explicitly.',
      3: 'Composite does not prevent deletion — it is a structural pattern, not an enforcement mechanism. You must add that guard yourself.',
    },
    r: { id: 's10', label: 'Section 10 — Column management' },
  },
  {
    q: 'A task has position: int = 2 in a column with 5 tasks (positions 0–4). You move a new task to position 2. What happens to the existing task at position 2?',
    o: [
      'All tasks at position 2 and above are shifted up by 1 (their positions increase by 1)',
      'The existing task at position 2 is overwritten and deleted',
      'The existing task keeps position 2 — two tasks share the same position',
      'The new task is placed at position 5 regardless of the requested position',
    ],
    a: 0,
    e: 'The insert-at-position algorithm: shift all tasks at position P and above up by 1 first, then place the new task at position P. After the shift, positions become: 0, 1, 2(new), 3(was 2), 4(was 3), 5(was 4). This is O(n) writes. Real systems use fractional indexing to avoid this shift entirely.',
    w: {
      1: 'Overwriting would delete a task — a catastrophic data loss bug. Position is an ordering field, not a unique key.',
      2: 'Duplicate positions break sorted order. The UI would render two tasks at the same spot, and the result of sorting by position would be non-deterministic.',
      3: 'Appending to the end would ignore the user\'s requested position. The user explicitly chose where to insert the task.',
    },
    r: { id: 's4', label: 'Section 4 — Task ordering within a column' },
  },
]

/* ============================================================
   Page
   ============================================================ */
export default function Day74() {
  return (
    <div className="scrollarea">

      {/* HERO */}
      <div className="hero">
        <div className="eyebrow">Month 4 · Week 15 · Day 74</div>
        <h1>Task Management Board:<br />Columns as Data, Moves as History</h1>
        <p>
          A Kanban board looks simple — cards moving between columns. But two surprises set it apart
          from every prior state machine we have built: the columns are not in the source code, and
          moving a task is a Command, not a field update. Click everything to see why that matters.
        </p>
        <div className="chips">
          {['Command Pattern', 'Composite Tree', 'Observer Notifications', 'Fractional Indexing', 'Undo/Redo'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* S1 */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The corkboard analogy — what makes this different</h2>
        <p>
          Picture a physical corkboard with three sections pinned to it: "Todo", "In Progress", "Done".
          You write tasks on sticky notes and pin them to the correct section. To move a task,
          you peel it off and re-pin it elsewhere. You can add a new section ("In Review"), rename
          one, tear off an old section entirely, or swap two sections' order.
        </p>
        <p>
          This is the key insight: <b>the sections are just labels on pieces of masking tape.</b>
          They are data, not fixed slots built into the board's frame. You can change them freely.
        </p>
        <p>
          Most state machines we have built so far have states baked into the code. A parking
          spot is either <C>AVAILABLE</C> or <C>OCCUPIED</C> — those words live in
          an <C>enum</C> and will never change unless a developer edits the source file.
          A task board is fundamentally different: the column names live in the database.
          A user can create a "UX Review" column tonight and delete it tomorrow, all without
          touching any code.
        </p>
        <Code html={`<span class="cm">── Prior state machines: states live in source code ─────────────</span>

  <span class="cm">// SpotState (Day 41) — 2 states, never changes</span>
  <span class="kw">enum</span> SpotState { AVAILABLE, OCCUPIED }

  <span class="cm">// VendingMachine (Day 48) — 4 states, never changes</span>
  <span class="kw">enum</span> VendingState { IDLE, HAS_MONEY, DISPENSING, SOLD_OUT }

<span class="cm">── Task board: column names live in the database ─────────────────</span>

  <span class="cm">// Column entity — names and order are data, not code</span>
  <span class="kw">class</span> Column {
      <span class="kw">private</span> String id;
      <span class="kw">private</span> String title;       <span class="cm">// "Todo", "In Progress", "Done" — or ANYTHING</span>
      <span class="kw">private int</span>    position;   <span class="cm">// 0, 1, 2, ... — controls display order</span>
      <span class="kw">private</span> List&lt;String&gt; taskIds; <span class="cm">// ordered list of task IDs in this column</span>
  }

  <span class="cm">// There is NO enum. Column title is just a String the user typed.</span>
  <span class="cm">// A user can rename "Done" to "Shipped" without redeploying anything.</span>`} />
        <p>
          The second big difference: moving a task is not just a field update. It is a <b>Command</b>
          (Day 33). The Command record captures WHERE the task came from, WHERE it went, and WHEN.
          This enables undo, redo, and a full audit trail — none of which are possible with a simple
          field update.
        </p>
        <Note>
          Two defining properties of a task board that separate it from prior state machines:
          (1) <b>Columns are data</b> — created at runtime, not encoded as an enum.
          (2) <b>Moves are Commands</b> — recorded as history events, not just mutations of task.columnId.
        </Note>
      </section>

      {/* S2 */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Clarifying questions — ask these in an interview</h2>
        <p>
          Seven questions shape the design. Ask them before drawing any class diagram.
        </p>
        <table className="matrix" style={{ width: '100%', fontSize: 12.5 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Question</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Why it matters</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Simple-first answer</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Multiple boards per workspace?', 'Adds Workspace entity above Board; visibility/permission scope', 'Yes — one workspace, multiple boards'],
              ['Sub-tasks?', 'Task becomes a Composite (Day 28) — a task can contain child tasks recursively', 'No sub-tasks for now; each task is a leaf'],
              ['WIP limits per column?', 'Column gets a wipLimit: int; board rejects moves that would exceed it', 'No WIP limits in scope'],
              ['Attachments on tasks?', 'Task gets attachments: List<Attachment>; storage/CDN layer required', 'No attachments; text only'],
              ['Time tracking?', 'Task gets timeLog: List<TimeEntry>; need start/stop tracking', 'No time tracking'],
              ['Public vs private boards?', 'Board gets visibility: enum {PUBLIC, PRIVATE}; auth/ACL layer required', 'All boards private to workspace members'],
              ['Should move history survive board deletion?', 'Determines if history is soft-deleted or hard-deleted with the board', 'Archive board (soft delete); keep history for 30 days'],
            ].map(([q, why, ans]) => (
              <tr key={q}>
                <td style={{ padding: '6px 8px' }}><b>{q}</b></td>
                <td style={{ padding: '6px 8px', color: '#666' }}>{why}</td>
                <td style={{ padding: '6px 8px', color: 'var(--blue)' }}>{ans}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* S3 */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Core entities — a 4-level Composite tree</h2>
        <Code html={`<span class="cm">── Composite tree (Day 28): each level contains the next ─────────</span>

  Workspace
    └── Board (*)              ← a workspace has many boards
          └── Column (*) [ordered by position]   ← a board has many columns
                └── Task (*) [ordered by position within column]

<span class="cm">── Entity model ─────────────────────────────────────────────────</span>

  ┌───────────┐   ┌──────────────┐   ┌──────────────────────┐
  │ Workspace │ 1 │    Board     │ 1 │       Column         │
  │───────────│ * │──────────────│ * │──────────────────────│
  │ id        │───│ id           │───│ id                   │
  │ name      │   │ name         │   │ title                │
  │ members   │   │ columns: List│   │ position: int        │
  └───────────┘   └──────────────┘   │ taskIds: List&lt;String&gt;│
                                     └──────────┬───────────┘
                                               │ 1..*
                                    ┌──────────▼───────────┐
                                    │         Task          │
                                    │──────────────────────│
                                    │ title, description    │
                                    │ assignees: List       │
                                    │ labels: List&lt;Label&gt;   │
                                    │ dueDate: LocalDate    │
                                    │ position: int         │
                                    └──────────────────────┘`} />
        <Code html={`<span class="cm">// The full entity set — each class in plain Java</span>

<span class="kw">class</span> Workspace {
    <span class="kw">private</span> String id;
    <span class="kw">private</span> String name;
    <span class="kw">private</span> List&lt;Member&gt; members;   <span class="cm">// who can see/edit boards here</span>
    <span class="kw">private</span> List&lt;Board&gt; boards;     <span class="cm">// the boards this workspace owns</span>
}

<span class="kw">class</span> Board {
    <span class="kw">private</span> String id;
    <span class="kw">private</span> String workspaceId;
    <span class="kw">private</span> String name;
    <span class="kw">private</span> List&lt;Column&gt; columns;          <span class="cm">// ordered by Column.position</span>
    <span class="kw">private</span> Deque&lt;TaskMoveCommand&gt; history;  <span class="cm">// move log (newest last)</span>
    <span class="kw">private</span> Deque&lt;TaskMoveCommand&gt; redoStack; <span class="cm">// redo candidates</span>
}

<span class="kw">class</span> Column {
    <span class="kw">private</span> String id;
    <span class="kw">private</span> String boardId;
    <span class="kw">private</span> String title;             <span class="cm">// user-defined — "Todo", "Review", anything</span>
    <span class="kw">private int</span>    position;          <span class="cm">// display order within the board</span>
    <span class="kw">private</span> List&lt;String&gt; taskIds;     <span class="cm">// ordered list of task IDs in this column</span>
}

<span class="kw">class</span> Task {
    <span class="kw">private</span> String id;
    <span class="kw">private</span> String columnId;          <span class="cm">// which column this task is in right now</span>
    <span class="kw">private</span> String title;
    <span class="kw">private</span> String description;
    <span class="kw">private</span> List&lt;Member&gt;  assignees;  <span class="cm">// who is responsible</span>
    <span class="kw">private</span> List&lt;Label&gt;  labels;     <span class="cm">// value objects: color + name (immutable)</span>
    <span class="kw">private</span> LocalDate    dueDate;     <span class="cm">// nullable — no deadline = no date</span>
    <span class="kw">private int</span>          position;   <span class="cm">// order within its column</span>
    <span class="kw">private</span> Instant      createdAt;
}

<span class="kw">record</span> Label(String id, String name, String hexColor) {} <span class="cm">// Value Object (Day 20)</span>

<span class="cm">// TaskMoveEvent — the audit record written to the history log</span>
<span class="kw">record</span> TaskMoveEvent(
    String taskId, String fromColumnId, <span class="kw">int</span> fromPosition,
    String toColumnId,   <span class="kw">int</span> toPosition,
    String movedByMemberId, Instant movedAt
) {}`} />
        <Note>
          <C>Label</C> is a Value Object (Day 20): it is immutable and identified by value, not
          by identity. Two labels with the same name and color are the same label. This means you can
          safely share label instances and compare them with <C>.equals()</C> on the fields.
        </Note>
      </section>

      {/* S4 */}
      <section id="s4">
        <div className="sec-label">Section 4</div>
        <h2>Task ordering within a column — the position field</h2>
        <p>
          Each task has a <C>position: int</C> that controls its order within its column.
          Position 0 is the top card. When you drag a task to a specific spot, the board must
          shift all tasks at that position and below to make room.
        </p>
        <Code html={`<span class="cm">// Inserting a task at position P in a column</span>
<span class="kw">public void</span> insertIntoColumn(String taskId, String colId, <span class="kw">int</span> targetPos) {

    <span class="cm">// Step 1: shift every task at targetPos and above up by 1</span>
    tasks.stream()
        .filter(t -> t.getColumnId().equals(colId) && t.getPosition() >= targetPos)
        .forEach(t -> t.setPosition(t.getPosition() + <span class="num">1</span>)); <span class="cm">// O(n) writes</span>

    <span class="cm">// Step 2: place the moved task at the vacated position</span>
    Task t = findTask(taskId);
    t.setColumnId(colId);       <span class="cm">// update which column it belongs to</span>
    t.setPosition(targetPos);   <span class="cm">// place it exactly where the user dropped it</span>
}

<span class="cm">// Removing a task from its current column (before inserting elsewhere)</span>
<span class="kw">public void</span> removeFromColumn(String taskId, String colId) {
    Task t = findTask(taskId);
    <span class="kw">int</span> vacatedPos = t.getPosition();

    <span class="cm">// Shift tasks below the vacated spot down by 1 to fill the gap</span>
    tasks.stream()
        .filter(x -> x.getColumnId().equals(colId) && x.getPosition() > vacatedPos)
        .forEach(x -> x.setPosition(x.getPosition() - <span class="num">1</span>));
}

<span class="cm">// Full move = remove from old + insert into new</span>
<span class="kw">public void</span> moveTask(String taskId, String toColId, <span class="kw">int</span> toPos) {
    Task t = findTask(taskId);
    TaskMoveCommand cmd = <span class="kw">new</span> TaskMoveCommand(
        taskId,
        t.getColumnId(), t.getPosition(),  <span class="cm">// capture "from" BEFORE moving</span>
        toColId, toPos,
        Instant.now()
    );
    cmd.execute(<span class="kw">this</span>);   <span class="cm">// remove + insert + append to history</span>
}`} />
        <Reveal summary="Real systems use fractional indexing to avoid the O(n) shift">
          <p>
            Integer positions require rewriting every task at or above the insertion point. With
            100 tasks in a column and a user dragging to position 0, that is 100 database writes
            on every drop.
          </p>
          <p>
            Fractional indexing stores positions as floating-point numbers (or lexicographically
            sortable strings). Inserting between position 1.0 and 2.0 gives 1.5. Inserting between
            1.0 and 1.5 gives 1.25. Only the moved task's row is written — O(1) writes. Trello
            uses this approach under the hood with base-62 encoded strings. The downside: values
            eventually get very long and must be "rebalanced" (renumbered from scratch), but this
            happens rarely.
          </p>
        </Reveal>
      </section>

      {/* S5 — Interactive */}
      <section id="s5">
        <div className="sec-label">Section 5 · Interactive</div>
        <h2>Play: Kanban board with move history</h2>
        <p>
          Click the <b>⋯ button</b> on any task card to open the move menu. Select a target column.
          The task slides over and the move is recorded in the history panel below the board. Notice
          the log shows exactly what a <C>TaskMoveEvent</C> captures: task name, from-column, to-column,
          and who moved it.
        </p>
        <KanbanBoardDemo />
      </section>

      {/* S6 */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Movement as Command — undo, redo, and history</h2>
        <p>
          The Command pattern (Day 33) models each task move as an object you can execute and
          reverse. The board holds two stacks: a history stack (for undo) and a redo stack
          (for redo-after-undo).
        </p>
        <Code html={`<span class="cm">// TaskMoveCommand — the undo/redo record for a single task move</span>
<span class="kw">record</span> TaskMoveCommand(
    String  taskId,
    String  fromColumnId,
    <span class="kw">int</span>     fromPosition,
    String  toColumnId,
    <span class="kw">int</span>     toPosition,
    Instant movedAt
) {
    <span class="cm">// execute: perform the move forward and record it in history</span>
    <span class="kw">void</span> execute(Board board) {
        board.removeFromColumn(taskId, fromColumnId);         <span class="cm">// detach from old column</span>
        board.insertIntoColumn(taskId, toColumnId, toPosition); <span class="cm">// attach to new column</span>
        board.history().push(<span class="kw">this</span>);                        <span class="cm">// push onto history stack</span>
    }

    <span class="cm">// undo: reverse the move using the saved "from" data</span>
    <span class="kw">void</span> undo(Board board) {
        board.removeFromColumn(taskId, toColumnId);            <span class="cm">// detach from current (was "to")</span>
        board.insertIntoColumn(taskId, fromColumnId, fromPosition); <span class="cm">// put back where it was</span>
    }
}

<span class="cm">// BoardService — undo and redo operations</span>
<span class="kw">public void</span> undo(Board board) {
    <span class="kw">if</span> (board.history().isEmpty())
        <span class="kw">throw new</span> IllegalStateException(<span class="str">"Nothing to undo"</span>);

    TaskMoveCommand cmd = board.history().pop();  <span class="cm">// take the most recent move</span>
    cmd.undo(board);                              <span class="cm">// reverse it</span>
    board.redoStack().push(cmd);                  <span class="cm">// save for potential redo</span>
}

<span class="kw">public void</span> redo(Board board) {
    <span class="kw">if</span> (board.redoStack().isEmpty())
        <span class="kw">throw new</span> IllegalStateException(<span class="str">"Nothing to redo"</span>);

    TaskMoveCommand cmd = board.redoStack().pop(); <span class="cm">// take the most recent undo</span>
    cmd.execute(board);                            <span class="cm">// re-apply it (also pushes to history)</span>
}

<span class="cm">// moveTask — new moves always clear the redo stack (creates a new future)</span>
<span class="kw">public void</span> moveTask(Board board, String taskId, String toColId, <span class="kw">int</span> toPos) {
    TaskMoveCommand cmd = buildCommand(board, taskId, toColId, toPos);
    board.redoStack().clear();  <span class="cm">// ⚠ discard the old redo branch</span>
    cmd.execute(board);         <span class="cm">// move + push to history</span>
}`} />
        <Good>
          The <b>redo stack clears</b> on any new move. This gives you linear history — the same
          rule as every text editor and version control system. It keeps the mental model simple:
          history is always a straight line, never a tree.
        </Good>
        <Reveal summary="What about undo for task creation or deletion?">
          <p>
            The same Command pattern applies. A <C>TaskCreateCommand</C> stores the full task
            data; its <C>undo()</C> calls <C>board.deleteTask(taskId)</C>. A <C>TaskDeleteCommand</C>
            stores a deep copy of the deleted task (Memento, Day 39); its <C>undo()</C> calls
            <C>board.restoreTask(savedSnapshot)</C>. You can build a fully undo-able board by
            treating every mutation as a Command.
          </p>
        </Reveal>
        <Reveal summary="How does event sourcing relate to this?">
          <p>
            Event sourcing stores the full history of Commands (events) as the primary data —
            not the current state. To get the current board state, you replay all commands from
            the beginning. This lets you reconstruct the board at any point in time, audit who
            made every change, and even time-travel to yesterday's board. The <C>TaskMoveEvent</C>
            records we are writing ARE an event-sourced log — the current state is just a
            materialized view.
          </p>
        </Reveal>
      </section>

      {/* S7 — Interactive */}
      <section id="s7">
        <div className="sec-label">Section 7 · Interactive</div>
        <h2>Play: undo and redo</h2>
        <p>
          Move tasks between Backlog and In Review. Watch the <b>History stack</b> grow.
          Click <b>Undo</b> to reverse the last move — the task slides back and the command
          moves to the Redo stack. Click <b>Redo</b> to re-apply it. Then make a new move after
          undoing and notice the Redo stack is cleared — the new future replaces the old one.
        </p>
        <UndoRedoDemo />
      </section>

      {/* S8 */}
      <section id="s8">
        <div className="sec-label">Section 8</div>
        <h2>Task metadata — assignees, labels, due dates</h2>
        <p>
          Beyond its column, a task carries metadata that users interact with daily.
          Each piece has its own design concern.
        </p>
        <Code html={`<span class="cm">// 1. assignMember — Observer fires a notification (Day 32)</span>
<span class="kw">public void</span> assignMember(String taskId, String memberId) {
    Task task     = findTask(taskId);
    Member member = findMember(memberId);

    task.getAssignees().add(member);   <span class="cm">// add to the assignee list</span>

    <span class="cm">// Observer: fire event — every registered listener reacts</span>
    AssignmentEvent evt = <span class="kw">new</span> AssignmentEvent(task, member, Instant.now());
    notifyObservers(evt);   <span class="cm">// email, push, in-app badge — board doesn't care which</span>
}

<span class="cm">// 2. Label — a Value Object (Day 20). Immutable. Identity = value, not ID.</span>
<span class="kw">record</span> Label(String name, String hexColor) {
    <span class="cm">// Two labels with the same name + color ARE the same label</span>
    <span class="cm">// — records auto-generate equals() and hashCode() on all fields</span>
}
<span class="cm">// Usage: task.getLabels().add(new Label("Bug", "#EF5350"));</span>

<span class="cm">// 3. findTasksDueSoon — filter by dueDate proximity</span>
<span class="kw">public</span> List&lt;Task&gt; findTasksDueSoon(Board board, <span class="kw">int</span> days) {
    LocalDate threshold = LocalDate.now().plusDays(days); <span class="cm">// e.g. now + 3 days</span>
    <span class="kw">return</span> board.getColumns().stream()
        .flatMap(col -> col.getTasks().stream())         <span class="cm">// flatten all tasks</span>
        .filter(t -> t.getDueDate() != <span class="kw">null</span>)           <span class="cm">// skip tasks with no due date</span>
        .filter(t -> !t.getDueDate().isAfter(threshold)) <span class="cm">// due on or before threshold</span>
        .sorted(Comparator.comparing(Task::getDueDate))  <span class="cm">// earliest first</span>
        .collect(Collectors.toList());
}

<span class="cm">// 4. TaskSortStrategy — sort tasks within a column (Strategy, Day 31)</span>
<span class="kw">interface</span> TaskSortStrategy {
    List&lt;Task&gt; sort(List&lt;Task&gt; tasks);
}

<span class="kw">class</span> SortByDueDate <span class="kw">implements</span> TaskSortStrategy {
    <span class="kw">public</span> List&lt;Task&gt; sort(List&lt;Task&gt; tasks) {
        <span class="kw">return</span> tasks.stream()
            .sorted(Comparator.comparing(Task::getDueDate,
                Comparator.nullsLast(Comparator.naturalOrder()))) <span class="cm">// nulls last</span>
            .collect(Collectors.toList());
    }
}

<span class="kw">class</span> SortByPosition <span class="kw">implements</span> TaskSortStrategy {
    <span class="kw">public</span> List&lt;Task&gt; sort(List&lt;Task&gt; tasks) {
        <span class="kw">return</span> tasks.stream()
            .sorted(Comparator.comparingInt(Task::getPosition)) <span class="cm">// original drag order</span>
            .collect(Collectors.toList());
    }
}`} />
        <Note>
          <b>Why is Label a Value Object?</b> Labels have no mutable lifecycle. You do not update
          a label; you replace it. A label called "Bug" with color red is always that exact label —
          its identity is defined by its content, not by a database ID. Using a <C>record</C> for
          Label gives you correct <C>equals()</C> and <C>hashCode()</C> for free.
        </Note>
      </section>

      {/* S9 — Interactive */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>Play: due dates, assignees, and Observer notifications</h2>
        <p>
          Toggle <b>"View: Due Soon"</b> to highlight overdue tasks (red) and tasks due within
          3 days (amber). Change the assignee on any task using the dropdown — watch the
          Observer notification toast appear at the top. Change the label to see the chip update
          instantly. This is <C>findTasksDueSoon(board, 3)</C> running on every render.
        </p>
        <DueDashboardDemo />
      </section>

      {/* S10 */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Column management — add, rename, delete, reorder at runtime</h2>
        <p>
          Because columns are data (not enums), all column operations are ordinary CRUD.
          Here is the Java for each:
        </p>
        <Code html={`<span class="cm">// Add a column — always appended at the end</span>
<span class="kw">public</span> Column addColumn(Board board, String title) {
    <span class="kw">int</span> nextPos = board.getColumns().size(); <span class="cm">// position = count (0-indexed last+1)</span>
    Column col = <span class="kw">new</span> Column(UUID.randomUUID().toString(), board.getId(), title, nextPos);
    board.getColumns().add(col);            <span class="cm">// add to the board's column list</span>
    columnRepository.save(col);            <span class="cm">// persist to database</span>
    <span class="kw">return</span> col;
}

<span class="cm">// Rename a column — no task data changes, just the title string</span>
<span class="kw">public void</span> renameColumn(String colId, String newTitle) {
    Column col = findColumn(colId);
    col.setTitle(newTitle);
    columnRepository.save(col);
}

<span class="cm">// Delete a column — must handle its tasks first</span>
<span class="kw">public void</span> deleteColumn(String colId, DeletePolicy policy) {
    Column col = findColumn(colId);
    List&lt;Task&gt; remaining = col.getTasks();

    <span class="kw">if</span> (!remaining.isEmpty()) {
        <span class="kw">switch</span> (policy) {
            <span class="kw">case</span> REJECT:
                <span class="kw">throw new</span> IllegalStateException(<span class="str">"Move tasks out of this column first"</span>);
            <span class="kw">case</span> MOVE_TO_FIRST:
                Column first = findFirstColumn(col.getBoardId());
                remaining.forEach(t -> moveTask(t.getId(), first.getId(), <span class="num">0</span>));
                <span class="kw">break</span>;
            <span class="kw">case</span> CASCADE_DELETE:
                remaining.forEach(t -> deleteTask(t.getId())); <span class="cm">// hard delete tasks too</span>
                <span class="kw">break</span>;
        }
    }

    columnRepository.delete(colId);   <span class="cm">// now safe to delete</span>
    reindexColumnPositions(col.getBoardId()); <span class="cm">// fill the gap in positions</span>
}

<span class="cm">// Reorder columns — bulk-update position fields</span>
<span class="kw">public void</span> reorderColumns(String boardId, List&lt;String&gt; newColumnOrder) {
    <span class="cm">// newColumnOrder = [colId3, colId1, colId2] — the user's desired order</span>
    <span class="kw">for</span> (<span class="kw">int</span> i = <span class="num">0</span>; i &lt; newColumnOrder.size(); i++) {
        Column col = findColumn(newColumnOrder.get(i));
        col.setPosition(i);           <span class="cm">// assign new position index</span>
        columnRepository.save(col);  <span class="cm">// persist each update</span>
    }
    <span class="cm">// Done — the board now renders columns in the new order</span>
}`} />
        <Warn>
          Notice <C>enum TaskState {'{'} TODO, IN_PROGRESS, DONE {'}'}</C> would make it
          impossible to add a column at runtime. The moment you write an enum for the column names,
          you have frozen the workflow — every team using the product must use your exact column names
          forever. Columns as data is what gives tools like Trello and Linear their flexibility.
        </Warn>
        <Reveal summary="How does 'board snapshot' (Memento) work for backup/restore?">
          <p>
            A board snapshot (Memento, Day 39) is a deep copy of the full board state at a moment
            in time: all columns (titles, positions), all tasks (content, positions, assignees,
            labels), and the complete history log. The <C>BoardMemento</C> record stores this blob.
            Restoring the board replaces all current state with the snapshot. This is how Notion's
            "Version history" feature works — each auto-save is a Memento. The difference from
            event sourcing: a Memento stores the final state, not the sequence of operations.
            Replaying is instant (no re-processing commands) but the snapshot is larger in storage.
          </p>
        </Reveal>
      </section>

      {/* S11 */}
      <section id="s11">
        <div className="sec-label">Section 11</div>
        <h2>Common traps — six mistakes to avoid</h2>

        <Warn>
          <b>Trap 1 — Using an enum for column states.</b> Writing
          <C>enum TaskState {'{'} TODO, IN_PROGRESS, DONE {'}'}</C> and storing it on the task
          is the most common mistake. It hard-codes the workflow into source code.
          Adding a new column requires a code change, a deployment, and a database migration.
          Columns must be a separate entity with a String title — data, not code.
        </Warn>

        <Warn>
          <b>Trap 2 — No position field on Task.</b> If you store tasks as an unordered
          set, you lose drag-and-drop ordering permanently. You cannot reconstruct the original order
          from the data. Add <C>position: int</C> from day one. Never rely on
          <C>createdAt</C> as a proxy for display order — the user's manual reordering
          would be invisible.
        </Warn>

        <Warn>
          <b>Trap 3 — Not clearing the redo stack on new moves.</b> If you forget to call
          <C>redoStack.clear()</C> when a new move is made, the redo stack will contain
          commands that apply to a column state that no longer exists. Redoing them will put
          tasks in the wrong columns. A new move always creates a new, linear future — discard
          the old redo branch entirely.
        </Warn>

        <Warn>
          <b>Trap 4 — No history for task creation and deletion.</b> If only moves are recorded
          as Commands but create/delete are plain mutations, you cannot undo a deletion. A user
          who accidentally deletes a task will lose it forever. Wrap every board mutation
          (create, delete, rename, move) in a Command.
        </Warn>

        <Warn>
          <b>Trap 5 — N+1 query to fetch tasks.</b> If you load all columns and then issue a
          separate query per column to fetch that column's tasks, a board with 10 columns
          makes 11 database queries (1 for columns + 10 for tasks). Use a single JOIN or
          two queries with an IN clause (load all tasks for the board in one shot, then
          group by columnId in memory).
        </Warn>

        <Warn>
          <b>Trap 6 — Shared mutable position integer under concurrent moves.</b> If two users
          drag tasks to the same column simultaneously, both read the same "max position" and
          assign the same integer to their tasks. The column ends up with two tasks at
          position 5. Use optimistic locking (Day 64) with a version field on the column, or
          serialise column mutations through a single-writer queue. Fractional indexing
          partially mitigates this by reducing overlap probability.
        </Warn>
      </section>

      {/* S12 */}
      <section id="s12">
        <div className="sec-label">Section 12</div>
        <h2>Cheat sheet + patterns map</h2>
        <ul>
          <li><b>Columns are data, not code.</b> No enum — column names are strings in the database. Users create, rename, delete, and reorder columns at runtime.</li>
          <li><b>Moves are Commands.</b> <C>TaskMoveCommand</C> stores fromColumn, toColumn, fromPos, toPos, movedAt — enabling undo, redo, and full audit history.</li>
          <li><b>Undo: pop from history, push to redo.</b> <C>command.undo(board)</C> reverses the move.</li>
          <li><b>Redo: pop from redo, re-execute.</b> <C>command.execute(board)</C> re-applies the move and pushes back to history.</li>
          <li><b>New move clears redo stack.</b> Linear history — no branching. Identical behavior to text editors.</li>
          <li><b>Position field on Task.</b> Controls display order within a column. Insert-at-P shifts all tasks at P and above up by 1 (O(n) writes).</li>
          <li><b>Fractional indexing</b> avoids O(n) shifts by storing positions as floats — only the moved task is written (O(1)).</li>
          <li><b>Label = Value Object.</b> Immutable record: identity by value (name + color), not by ID.</li>
          <li><b>Observer for notifications.</b> <C>assignMember()</C> fires an event; email/push/badge listeners react without the board knowing they exist.</li>
          <li><b>Column deletion policy.</b> Choose: REJECT if tasks exist, MOVE_TO_FIRST, or CASCADE_DELETE. Never silently orphan tasks.</li>
        </ul>

        <table className="matrix" style={{ width: '100%', fontSize: 12.5, marginTop: 16 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Pattern</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Day</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Where it appears in a task board</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Command',   '33', 'TaskMoveCommand.execute() / undo() — every task move is a reversible command'],
              ['Composite', '28', 'Workspace → Board → Column → Task — 4-level tree, traverse for cross-board search'],
              ['Observer',  '32', 'Assignment events → email/push/badge listeners; due-date reminders'],
              ['Strategy',  '31', 'TaskSortStrategy — sort by dueDate / priority / position / createdAt'],
              ['Memento',   '39', 'Board snapshot for version history / backup + restore'],
              ['Value Object', '20', 'Label (immutable color+name record); Position concept'],
              ['CAS / Opt. Lock', '64', 'Column version field prevents concurrent-move position conflicts'],
            ].map(([p, d, w]) => (
              <tr key={p}>
                <td style={{ padding: '6px 8px' }}><b>{p}</b></td>
                <td style={{ padding: '6px 8px', color: '#7c8aa5' }}>Day {d}</td>
                <td style={{ padding: '6px 8px' }}>{w}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* INTERVIEW */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>The questions they actually ask</h2>

        <Reveal summary="Q: How would you enforce WIP limits — maximum tasks per column?">
          <p>
            Add a <C>wipLimit: Integer</C> field to <C>Column</C> (null = no limit). Before
            executing a <C>TaskMoveCommand</C>, check whether the target column is at its limit:
          </p>
          <p>
            <C>if (targetCol.getWipLimit() != null {'&&'} targetCol.taskCount() {'>'}{' '}targetCol.getWipLimit()) throw new WipLimitExceededException();</C>
          </p>
          <p>
            This guard goes in <C>BoardService.moveTask()</C>, not in the Command itself. The
            Command is a pure data object — it should not enforce business rules. The service
            layer validates the rule and only invokes the command if the move is legal. WIP limits
            come from Lean manufacturing (Kanban boards are a direct port of the Toyota production
            system).
          </p>
        </Reveal>

        <Reveal summary="Q: How would you implement sub-tasks? Does the Composite pattern help?">
          <p>
            Yes — Composite (Day 28) applies directly. Give <C>Task</C> a <C>List&lt;Task&gt; children</C>
            field. A task with no children is a leaf node. A task with children is a composite node.
            Operations like "mark this task done" can recurse: a parent task is done only when all
            its children are done. The tree can be arbitrarily deep (sub-sub-tasks), though most
            real tools cap at 1–2 levels for UX reasons. The database stores sub-tasks with a
            <C>parentTaskId</C> foreign key (nullable for top-level tasks).
          </p>
        </Reveal>

        <Reveal summary="Q: Two users drag the same task simultaneously — what happens?">
          <p>
            Classic concurrent-move race (Day 64). Without concurrency control, both moves succeed
            and the task ends up in whichever column was written last. The typical production fix is
            optimistic locking: add a <C>version: int</C> to <C>Task</C>. The move command includes
            the version it read. The database UPDATE checks <C>WHERE id = ? AND version = ?</C>; if
            0 rows are affected, another user moved it first. The losing user sees an error: "Task was
            moved by Alice — please refresh." A simpler approach for many tools: last-write-wins
            (whichever update commits last prevails), which is fine for a task board where a conflict
            is rare and trivially recoverable.
          </p>
        </Reveal>

        <Reveal summary="Q: Archiving a column vs deleting it — what is the difference in your model?">
          <p>
            Deletion removes the column and requires a cascading policy for its tasks (move elsewhere
            or delete them). Archiving is a soft-delete: add an <C>archivedAt: Instant</C> (nullable)
            to <C>Column</C>. Archived columns are filtered out of the board's normal view but still
            exist in the database. Their tasks keep their <C>columnId</C> intact — no orphan problem.
            The history log references the archived columnId without breaking. Users can un-archive
            a column later. Most real boards (Trello, Jira) prefer archiving over deletion for this
            reason.
          </p>
        </Reveal>

        <Reveal summary="Q: How would you implement search across all tasks in a workspace?">
          <p>
            The naive approach — scan every task in every board in memory — is O(total tasks) per
            search and does not scale. The production approaches:
          </p>
          <ul>
            <li><b>Database full-text search</b>: a <C>tsvector</C> column in Postgres (or MATCH AGAINST in MySQL) lets you index task titles and descriptions and query with a single SQL search across all tasks.</li>
            <li><b>Elasticsearch / OpenSearch</b>: index each task as a document when it is created or updated (via Observer). Search queries hit Elasticsearch, which returns task IDs; the app fetches the full tasks by ID.</li>
            <li><b>Simple LIKE for small scale</b>: <C>WHERE title LIKE '%query%' AND workspaceId = ?</C> with a full table scan — fine for a workspace with under 10,000 tasks.</li>
          </ul>
          <p>
            The Observer pattern (Day 32) is the bridge: task creates/updates fire events that the
            search indexer listens to and re-indexes asynchronously.
          </p>
        </Reveal>

        <Reveal summary="Q: Trello uses fractional indexing in practice — can you explain exactly how?">
          <p>
            Trello stores each card's position as a floating-point number. When a card is moved to
            position between card A (pos = 65536.0) and card B (pos = 131072.0), the new position
            is (65536.0 + 131072.0) / 2 = 98304.0. Only one row is written. Initial positions are
            set far apart (65536, 131072, 196608, ...) to leave room for many future inserts without
            rebalancing. When positions become too close to represent (float precision loss), Trello
            triggers a "rebalancing" job that reassigns positions to evenly spaced integers — this
            is a rare background operation. The key insight: floating-point has enough precision
            (~15 decimal digits) to support millions of inserts between any two positions before a
            rebalance is needed.
          </p>
        </Reveal>
      </section>

      {/* QUIZ */}
      <section id="squiz">
        <div className="sec-label">Section 13 · Test yourself</div>
        <h2>Quiz</h2>
        <p>Click an answer — explanations and revisit pointers appear for every wrong choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* FOOTER */}
      <div className="footer">
        <strong>Day 74 complete?</strong> Homework: implement the core in Java. Create a
        <C>Board</C> class that holds a list of <C>Column</C> objects and two stacks
        (<C>Deque&lt;TaskMoveCommand&gt; history</C> and <C>redoStack</C>). Implement
        <C>moveTask(taskId, toColId, toPos)</C>, <C>undo()</C>, and <C>redo()</C>. Write
        a test that: (1) creates a board with 2 columns and 4 tasks, (2) moves task #1 to column 2,
        (3) calls undo() and asserts task #1 is back in column 1, (4) calls redo() and asserts
        task #1 is in column 2 again, (5) moves task #2, then asserts the redo stack is now empty.
        <br /><br />
        Next: <strong>Day 75 — Week 15 Machine-Coding Drill</strong>: a timed dress rehearsal
        covering the full Month 4 advanced problem set — hotel booking, auction, digital wallet,
        chess, and the task board. Two solo tracks with locked reveals, a six-snippet smell hunt,
        and a 17-item interviewer rubric scorecard.
      </div>

    </div>
  )
}
