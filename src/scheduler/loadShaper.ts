import type { ItemState } from '@hikkoshi/schemas'

// Load shaping (architecture §5): anti-clumping day-snap + daily intro cap + rush-day
// protection. Pure functions; the caller supplies `now` and the current state set.

const DAY = 86_400_000

/** New-item introductions per session (architecture §5: "daily introduction cap default 10"). */
export const DEFAULT_DAILY_NEW = 10

/** Max reviews surfaced in one session before the rush-day shaper slides the rest forward. */
export const DEFAULT_DUE_CEILING = 60

/** Whole-day index for a timestamp — the bucket key for load histograms. */
export function dayIndex(ms: number): number {
  return Math.floor(ms / DAY)
}

/** Histogram of scheduled due-day → count from item states (optionally excluding one id). */
export function loadHistogram(states: ItemState[], excludeId?: string): Map<number, number> {
  const h = new Map<number, number>()
  for (const s of states) {
    if (s.itemId === excludeId) continue
    const d = dayIndex(s.due)
    h.set(d, (h.get(d) ?? 0) + 1)
  }
  return h
}

/**
 * Snap an ideal due date to the lightest day within ±`tolerance` of the ideal gap
 * (architecture §5 anti-clumping — Renshuu's one verified good mechanic). `loadByDay`
 * counts items already scheduled per day index. Ties break toward the ideal day; the
 * chosen day keeps the ideal time-of-day. Past-due (gap ≤ 0) is returned unchanged.
 */
export function snapToLightestDay(
  idealDue: number,
  now: number,
  loadByDay: Map<number, number>,
  tolerance = 0.15,
): number {
  const gap = idealDue - now
  if (gap <= 0) return idealDue
  const idealDay = dayIndex(idealDue)
  const timeOfDay = idealDue - idealDay * DAY
  // Candidate days are only those whose snapped timestamp stays within ±tolerance of the
  // ideal gap (ceil/floor so a day that only partly overlaps the window is excluded).
  const firstDay = Math.ceil((now + gap * (1 - tolerance) - timeOfDay) / DAY)
  const lastDay = Math.floor((now + gap * (1 + tolerance) - timeOfDay) / DAY)
  let bestDay = idealDay
  let bestLoad = loadByDay.get(idealDay) ?? 0
  for (let d = firstDay; d <= lastDay; d++) {
    const load = loadByDay.get(d) ?? 0
    if (load < bestLoad || (load === bestLoad && Math.abs(d - idealDay) < Math.abs(bestDay - idealDay))) {
      bestDay = d
      bestLoad = load
    }
  }
  return bestDay === idealDay ? idealDue : bestDay * DAY + timeOfDay
}

/**
 * Rush-day protection (architecture §5): surface at most `ceiling` due items this session,
 * keeping the highest-stakes (lowest stage — most fragile) and sliding the rest forward a
 * day. Returns the kept set (soonest-first, for the session) and the slid states (persist
 * their new `due`). Under the ceiling, everything is kept.
 */
export function shapeDueQueue(
  due: ItemState[],
  now: number,
  ceiling = DEFAULT_DUE_CEILING,
): { keep: ItemState[]; slide: ItemState[] } {
  if (due.length <= ceiling) return { keep: [...due].sort((a, b) => a.due - b.due), slide: [] }
  // Lowest stage = most fragile = highest stakes to review now; soonest-due breaks ties.
  const ranked = [...due].sort((a, b) => a.stage - b.stage || a.due - b.due)
  const keep = ranked.slice(0, ceiling).sort((a, b) => a.due - b.due)
  const slide = ranked.slice(ceiling).map((s) => ({ ...s, due: now + DAY }))
  return { keep, slide }
}
