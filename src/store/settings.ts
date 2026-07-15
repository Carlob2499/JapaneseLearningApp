import type { Level } from '@hikkoshi/schemas'

// Settings live in localStorage (D-001), separate from the IndexedDB progress store.

const KEY = 'hikkoshi:levels'
export const ALL_LEVELS: readonly Level[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5']
/** A fresh profile studies kana + N5 together — the kana rows introduce first (pool order),
 *  and the L1 items become readable as the syllabary lands (D-023). */
const DEFAULT_LEVELS: Level[] = ['L0', 'L1']

/** The active-level set for a placement result: L0 up to and including `level`. An unplaced
 *  learner (`L0` — "start at the beginning") gets the beginner default (kana + N5); any real
 *  placement includes L0 too, since its kana are seeded as provisionally known (D-023). */
export function levelsUpTo(level: Level): Level[] {
  const i = ALL_LEVELS.indexOf(level)
  return i <= 0 ? [...DEFAULT_LEVELS] : ALL_LEVELS.slice(0, i + 1)
}

/** The levels the learner has enabled, in canonical order. Always returns at least one. */
export function getActiveLevels(): Level[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return [...DEFAULT_LEVELS]
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...DEFAULT_LEVELS]
    const levels = ALL_LEVELS.filter((l) => parsed.includes(l)) // canonical order, junk dropped
    return levels.length > 0 ? levels : [...DEFAULT_LEVELS]
  } catch {
    return [...DEFAULT_LEVELS]
  }
}

/** Persist the enabled levels (canonicalised, never empty) and return what was stored. */
export function setActiveLevels(levels: readonly Level[]): Level[] {
  const canonical = ALL_LEVELS.filter((l) => levels.includes(l))
  const next = canonical.length > 0 ? canonical : [...DEFAULT_LEVELS]
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // best-effort — ignore quota / availability errors
  }
  return next
}

const AUTOPLAY_KEY = 'hikkoshi:autoplay'

/** Whether to auto-play pronunciation on reveal/answer. Defaults on (opt-out). */
export function getAutoPlay(): boolean {
  try {
    return localStorage.getItem(AUTOPLAY_KEY) !== 'off'
  } catch {
    return true
  }
}

/** Persist the auto-play preference and return it. */
export function setAutoPlay(on: boolean): boolean {
  try {
    localStorage.setItem(AUTOPLAY_KEY, on ? 'on' : 'off')
  } catch {
    // best-effort
  }
  return on
}

const ONBOARDED_KEY = 'hikkoshi:onboarded'

/** Whether the learner has completed the first-run onboarding screen. Defaults off. */
export function getOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === 'on'
  } catch {
    return false
  }
}

/** Persist the onboarded flag and return it. */
export function setOnboarded(on: boolean): boolean {
  try {
    localStorage.setItem(ONBOARDED_KEY, on ? 'on' : 'off')
  } catch {
    // best-effort
  }
  return on
}

const LAST_CELEBRATED_STAGE_KEY = 'hikkoshi:lastCelebratedStage'

/** The highest life stage already celebrated, or null on a fresh profile (never celebrated). */
export function getLastCelebratedStage(): number | null {
  try {
    const raw = localStorage.getItem(LAST_CELEBRATED_STAGE_KEY)
    if (raw === null) return null
    const n = Number(raw)
    return Number.isInteger(n) ? n : null // a corrupt stored value reads the same as "never"
  } catch {
    return null
  }
}

/** Persist the highest celebrated stage and return it. */
export function setLastCelebratedStage(stage: number): number {
  try {
    localStorage.setItem(LAST_CELEBRATED_STAGE_KEY, String(stage))
  } catch {
    // best-effort
  }
  return stage
}
