import type { JournalEntry } from '@hikkoshi/schemas'
import type { ClassSettings } from '../store/classSettings'

/**
 * The return loop's rhythm data (D-038): a streak reframed as narrative continuity rather than a
 * number that resets to zero on one missed day (Lally et al. 2010 — missing a day doesn't harm
 * habit formation; Duolingo's own retention data — forgiveness mechanics outperform punitive
 * ones). Weekly goal is fixed at 5-of-7, not a setting — fewer knobs, a kinder default.
 */
export const WEEKLY_GOAL = 5

/** Local-calendar-day key (not a UTC epoch bucket) — the learner's own day boundary, matching
 *  classSettings.ts's existing convention (`Date#getDay()`) for anything calendar-shaped. */
function localDayKey(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function weekStartKey(ms: number): string {
  const d = new Date(ms)
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay())
  return localDayKey(start.getTime())
}

/** Distinct local calendar days with at least one journal entry. */
export function activeDays(journal: readonly JournalEntry[]): Set<string> {
  return new Set(journal.map((e) => localDayKey(e.ts)))
}

/** Days lived "in Japan" (D-038): distinct active days, today always included even before its
 *  first entry lands — endowed progress, the same "arriving is the one stamp you get for free"
 *  rule journey.ts's stage 0 already uses. A brand-new profile reads as Day 1, never Day 0. */
export function daysInJapan(journal: readonly JournalEntry[], now: number): number {
  const days = activeDays(journal)
  days.add(localDayKey(now))
  return days.size
}

export interface WeekCell {
  kept: boolean
  isClassDay: boolean
  isToday: boolean
}

/**
 * The current local week (Sun-Sat) as 7 cells. A class day auto-counts as kept once it's today
 * or already past this week (attendance credit — the real classroom happening is endowed, not
 * earned through the app) but never for a class day still ahead in the week.
 */
export function weekCells(now: number, journal: readonly JournalEntry[], settings: ClassSettings): WeekCell[] {
  const days = activeDays(journal)
  const today = new Date(now)
  const todayDow = today.getDay()
  const cells: WeekCell[] = []
  for (let i = 0; i < 7; i++) {
    const cellDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - todayDow + i)
    const isToday = i === todayDow
    const isClassDay = settings.enabled && i === settings.classDay
    const kept = days.has(localDayKey(cellDate.getTime())) || (isClassDay && i <= todayDow)
    cells.push({ kept, isClassDay, isToday })
  }
  return cells
}

/**
 * Count of past local weeks (Sun-Sat) that reached the 5/7 goal from journal activity alone (no
 * class-day credit — that's `weekCells`'s current-week display only, since ClassSettings has no
 * history to judge past weeks against). `now` excludes the still-in-progress current week, which
 * would otherwise almost always read as "not kept" before it's had the chance to be.
 */
export function keptWeeks(journal: readonly JournalEntry[], now: number): number {
  const byWeek = new Map<string, Set<string>>()
  for (const e of journal) {
    const wk = weekStartKey(e.ts)
    if (!byWeek.has(wk)) byWeek.set(wk, new Set())
    byWeek.get(wk)!.add(localDayKey(e.ts))
  }
  const currentWeek = weekStartKey(now)
  let count = 0
  for (const [wk, daySet] of byWeek) {
    if (wk === currentWeek) continue
    if (daySet.size >= WEEKLY_GOAL) count++
  }
  return count
}

const LAPSE_MS = 3 * 86_400_000

/** Whether the learner lapsed (no activity in >3 days) — gates the おかえり welcome-back copy. */
export function isLapsedReturn(journal: readonly JournalEntry[], now: number): boolean {
  if (journal.length === 0) return false
  const last = Math.max(...journal.map((e) => e.ts))
  return now - last > LAPSE_MS
}
