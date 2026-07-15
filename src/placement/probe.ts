import type { Level } from '@hikkoshi/schemas'

/** Difficulty bands the staircase walks — the five taught levels. `L0` is the "not placed" result. */
export const PROBE_BANDS: readonly Level[] = ['L1', 'L2', 'L3', 'L4', 'L5']
/** Questions asked before the staircase converges. */
export const PROBE_LENGTH = 8
/** Where the staircase starts — mid-range, so it climbs or descends to the learner's level quickly. */
export const PROBE_START: Level = 'L2'

export interface ProbeState {
  /** The band the next question is drawn from. */
  band: Level
  /** Questions answered so far. */
  asked: number
  /** Highest band answered correctly — the ability ceiling the estimate reads from. */
  highestCorrect: Level | null
  /** Item ids already shown, so the UI never repeats one. */
  usedIds: string[]
}

function bandIndex(l: Level): number {
  return PROBE_BANDS.indexOf(l)
}
function clampBand(i: number): Level {
  return PROBE_BANDS[Math.max(0, Math.min(PROBE_BANDS.length - 1, i))]
}
function higher(a: Level | null, b: Level): Level {
  return a === null || bandIndex(b) > bandIndex(a) ? b : a
}

export function initProbe(): ProbeState {
  return { band: PROBE_START, asked: 0, highestCorrect: null, usedIds: [] }
}

/**
 * Fold one answer into the staircase: a correct answer steps the band up and raises the ability
 * ceiling; a wrong answer steps the band down. Both are clamped to L1…L5, so a strong learner
 * settles at L5 and a struggling one at L1 rather than running off the end.
 */
export function answerProbe(state: ProbeState, itemId: string, correct: boolean): ProbeState {
  return {
    band: clampBand(bandIndex(state.band) + (correct ? 1 : -1)),
    asked: state.asked + 1,
    highestCorrect: correct ? higher(state.highestCorrect, state.band) : state.highestCorrect,
    usedIds: [...state.usedIds, itemId],
  }
}

export function probeDone(state: ProbeState): boolean {
  return state.asked >= PROBE_LENGTH
}

/**
 * The placed level: the highest band ever answered correctly — the ceiling of demonstrated
 * ability. `L0` means "not placed" (even L1 was missed, or nothing was answered), which seeds
 * nothing and starts the learner at the beginning. Overshoot from a lucky guess is expected and
 * self-corrects through the provisional mechanic (D-021): a seeded item that's actually unknown
 * fails its first review and drops back to genuine learning.
 */
export function probeEstimate(state: ProbeState): Level {
  return state.highestCorrect ?? 'L0'
}
