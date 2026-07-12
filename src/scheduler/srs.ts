import type { ItemState, Outcome } from '@hikkoshi/schemas'

// Stage → interval ladder (architecture §5). Interval math is deliberately
// "boring and testable": a fixed ladder plus a bounded per-item nudge. The load
// shaper (day-snapping / rush-day protection) lives in loadShaper.ts. All
// functions are pure and take `now`.
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

/**
 * Per-item interval nudge in [0.8, 1.3] from the recent outcome bits (architecture §5:
 * "nudges, not ease-hell" — bounded, no runaway ease factor). Reads the last 4 reviews
 * from the packed history (bit 0 = newest, 1 = pass): all-pass stretches the next
 * interval to 1.3×, all-miss compresses it to 0.8×. Bounded by construction, so
 * intervals drift with performance but can never blow up the way multiplicative ease can.
 */
export function nudgeMultiplier(lastOutcomes: number): number {
  let passes = 0
  for (let i = 0; i < 4; i++) if ((lastOutcomes >> i) & 1) passes += 1
  return 0.8 + (passes / 4) * 0.5
}

/**
 * Apply a graded review (architecture §5): pass +1, fail −2 (min 1) + lapse, partial holds.
 * The next interval is the ladder value scaled by the nudge (partial is a fixed 1-day hold).
 */
export function applyReview(state: ItemState, outcome: Outcome, now: number): ItemState {
  const lastOutcomes = ((state.lastOutcomes << 1) | (outcome === 'pass' ? 1 : 0)) & 0xffff
  if (outcome === 'partial') {
    return { ...state, due: now + DAY, lastOutcomes }
  }
  const nudge = nudgeMultiplier(lastOutcomes)
  if (outcome === 'fail') {
    const stage = Math.max(1, state.stage - 2)
    return {
      ...state,
      stage,
      due: now + Math.round(STAGE_INTERVALS_MS[stage] * nudge),
      lapses: state.lapses + 1,
      lastOutcomes,
    }
  }
  const stage = Math.min(MAX_STAGE, state.stage + 1)
  return { ...state, stage, due: now + Math.round(STAGE_INTERVALS_MS[stage] * nudge), lastOutcomes }
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
