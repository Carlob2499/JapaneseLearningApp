import type { ItemState, Level } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import { reviewablePoolIds } from '../lib/appMeta'

/**
 * The six life stages (design-options.md:64, the canonical wording — decisions.md's summary
 * paraphrases it slightly differently; this is the primary source). Stage index = the length
 * of the *contiguous* cleared-level prefix, so a gap caps progress rather than being skipped.
 */
export const LIFE_STAGE_NAMES: readonly string[] = [
  'Tourist',
  'Resident',
  'Part-timer',
  'Employee',
  'Senior staff',
  'You handle it for someone else.',
]

/**
 * A level counts as "cleared" once this share of its reviewable pool carries an `ItemState`
 * (has been introduced at least once — a coverage proxy, not full mastery). No design doc
 * specifies a number (curriculum.md §5 P5); this is a documented, adjustable judgment call.
 */
export const LIFE_STAGE_CLEAR_THRESHOLD = 0.7

/** Canonical JLPT-anchored order — the prefix walk always proceeds L1→L5 regardless of the
 *  order `levels` is passed in. */
const LEVEL_ORDER: readonly Level[] = ['L1', 'L2', 'L3', 'L4', 'L5']

export interface LevelCoverage {
  level: Level
  covered: number
  total: number
  ratio: number
  cleared: boolean
}

export interface LifeStage {
  stage: number
  name: string
  levelsCleared: Level[]
  coverageByLevel: LevelCoverage[]
  /** The first not-yet-cleared level blocking further progress, if any. */
  next?: LevelCoverage
}

function levelCoverage(
  content: Content,
  stateIds: Set<string>,
  level: Level,
  threshold: number,
): LevelCoverage {
  const ids = reviewablePoolIds(content, level)
  const total = ids.length
  const covered = total === 0 ? 0 : ids.filter((id) => stateIds.has(id)).length
  const ratio = total === 0 ? 0 : covered / total
  // total > 0 guard: an empty/unloaded pool is "not cleared," never a vacuous 100%.
  return { level, covered, total, ratio, cleared: total > 0 && ratio >= threshold }
}

/**
 * Compute the learner's life stage from already-loaded content + item states, scoped to the
 * caller-supplied `levels` (e.g. the active level set — no `store/` import here, matching every
 * other pure scheduler/scene module's boundary). Levels outside `levels` never enter the walk,
 * so stage is naturally capped by what's in scope.
 */
export function computeLifeStage(
  content: Content,
  states: ItemState[] | Map<string, ItemState>,
  levels: readonly Level[],
  threshold = LIFE_STAGE_CLEAR_THRESHOLD,
): LifeStage {
  const stateIds = states instanceof Map ? new Set(states.keys()) : new Set(states.map((s) => s.itemId))
  const orderedLevels = LEVEL_ORDER.filter((l) => levels.includes(l))

  const coverageByLevel: LevelCoverage[] = []
  const levelsCleared: Level[] = []
  let next: LevelCoverage | undefined
  let broken = false
  for (const level of orderedLevels) {
    const cov = levelCoverage(content, stateIds, level, threshold)
    coverageByLevel.push(cov)
    if (broken) continue
    if (cov.cleared) levelsCleared.push(level)
    else {
      broken = true
      next = cov
    }
  }

  const stage = Math.min(levelsCleared.length, LIFE_STAGE_NAMES.length - 1)
  return { stage, name: LIFE_STAGE_NAMES[stage], levelsCleared, coverageByLevel, next }
}

export interface CelebrationDecision {
  celebrate: boolean
  /** The new "last celebrated" baseline to persist — set whenever `celebrate` is true, and
   *  also on the very first-ever read (silently establishing the baseline without celebrating).
   *  Undefined means: nothing changed, don't write anything. */
  newBaseline?: number
}

/**
 * Whether a freshly-computed stage should trigger the life-stage-up celebration (D-019),
 * given the highest stage already celebrated (`null` = a fresh profile that has never
 * celebrated). A fresh profile's first-ever computed stage never celebrates — arriving at the
 * default starting stage (Tourist, 0) isn't an achievement — it only establishes the baseline;
 * only a *later* computed stage greater than the persisted baseline celebrates. Using `null`
 * (not a numeric sentinel like -1) as "never" is what keeps this correct: a naive `stage >
 * lastCelebrated` with a `-1` default would fire on every fresh profile's first load, since
 * `0 > -1`.
 */
export function decideCelebration(stage: number, lastCelebrated: number | null): CelebrationDecision {
  if (lastCelebrated === null) return { celebrate: false, newBaseline: stage }
  if (stage > lastCelebrated) return { celebrate: true, newBaseline: stage }
  return { celebrate: false }
}
