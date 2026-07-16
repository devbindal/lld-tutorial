import { useEffect, useState } from 'react'

// Learner progress, persisted in localStorage under one key.
// Shape: { done: { [dayId]: true }, lastVisited: dayId, quiz: { [pageId]: { score, total } } }
// pageId is 'day-N' for day pages and 'recap-wN' for recap pages.

const KEY = 'lld-progress'
const EVT = 'lld-progress-changed'

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

function write(p) {
  localStorage.setItem(KEY, JSON.stringify(p))
  window.dispatchEvent(new Event(EVT))
}

export function isDone(dayId) {
  return !!(read().done || {})[dayId]
}

export function toggleDone(dayId) {
  const p = read()
  const done = { ...(p.done || {}) }
  if (done[dayId]) delete done[dayId]
  else done[dayId] = true
  write({ ...p, done })
}

export function doneCount(dayIds) {
  const done = read().done || {}
  return dayIds.filter((id) => done[id]).length
}

export function setLastVisited(dayId) {
  const p = read()
  if (p.lastVisited === dayId) return
  write({ ...p, lastVisited: dayId })
}

export function getLastVisited() {
  return read().lastVisited || null
}

// pageId for the current route, derived from the hash so the Quiz component
// needs no props — '#/day/12' → 'day-12', '#/recap/w3' → 'recap-w3'.
export function currentPageId() {
  const h = window.location.hash
  const d = h.match(/^#\/day\/(\d+)/)
  if (d) return `day-${d[1]}`
  const r = h.match(/^#\/recap\/(\w+)/)
  if (r) return `recap-${r[1]}`
  return null
}

export function saveQuizScore(pageId, score, total) {
  if (!pageId) return
  const p = read()
  write({ ...p, quiz: { ...(p.quiz || {}), [pageId]: { score, total } } })
}

export function getQuizScore(pageId) {
  return (read().quiz || {})[pageId] || null
}

// Re-renders the caller whenever progress changes anywhere in the app
// (mark-done click, quiz completion) or in another tab (storage event).
export function useProgress() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    window.addEventListener(EVT, bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener(EVT, bump)
      window.removeEventListener('storage', bump)
    }
  }, [])
}
