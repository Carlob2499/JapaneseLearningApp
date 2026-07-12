import type { ItemState, Outcome } from '@hikkoshi/schemas'

// Stage → interval ladder (architecture §5). Interval math is deliberately
// "boring and testable"; the nudge multiplier, load shaper and leech handling
// are the full-scheduler session. All functions are pure and take `now`.
const HOUR = 3_600_000
const DAY = 24 * HOUR
export const STAGE_INTERVALS_MS: readonly number[] = [
  0, // 0: new — due immediately
  4 * HOUR, // 1
  DAY, // 2
  3 * DAY, // 3
  7 * DAY, // 4
  21 * DAY, // 5
  60 * DAY, // 6
  150 * DAY, // 7: settled (~5 months)
]
export const MAX_STAGE = 7

export function newState(itemId: string, now: number): ItemState {
  return { itemId, stage: 0, due: now, introducedAt: now, lapses: 0, lastOutcomes: 0 }
}

/** Apply a graded review (architecture §5): pass +1, fail −2 (min 1) + lapse, partial holds. */
export function applyReview(state: ItemState, outcome: Outcome, now: number): ItemState {
  const lastOutcomes = ((state.lastOutcomes << 1) | (outcome === 'pass' ? 1 : 0)) & 0xffff
  if (outcome === 'partial') {
    return { ...state, due: now + DAY, lastOutcomes }
  }
  if (outcome === 'fail') {
    const stage = Math.max(1, state.stage - 2)
    return { ...state, stage, due: now + STAGE_INTERVALS_MS[stage], lapses: state.lapses + 1, lastOutcomes }
  }
  const stage = Math.min(MAX_STAGE, state.stage + 1)
  return { ...state, stage, due: now + STAGE_INTERVALS_MS[stage], lastOutcomes }
}

/** Items whose due time has arrived, soonest first. */
export function dueItems(now: number, states: ItemState[]): ItemState[] {
  return states.filter((s) => s.due <= now).sort((a, b) => a.due - b.due)
}

/** Up to `cap` item ids not yet seen — the blocked introduction set for a session. */
export function pickNewItems(allIds: string[], states: ItemState[], cap = 12): string[] {
  const known = new Set(states.map((s) => s.itemId))
  const fresh: string[] = []
  for (const id of allIds) {
    if (known.has(id)) continue
    fresh.push(id)
    if (fresh.length >= cap) break
  }
  return fresh
}
