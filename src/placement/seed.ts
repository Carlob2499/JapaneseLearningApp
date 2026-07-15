import type { ItemState, Level } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import { reviewablePoolIds } from '../lib/appMeta'
import { PROBE_BANDS } from './probe'

const DAY = 24 * 3_600_000
/** Provisional seeds start a couple of rungs up the ladder — "known, just needs confirming." */
export const SEED_STAGE = 2
/** Confirm reviews are spread across this many days so the load-shaper (60/session) isn't flooded. */
export const SEED_SPREAD_DAYS = 10

/**
 * Item states to write after a placement of `level` (D-021): every reviewable item at each band up
 * to and including `level` is seeded as *provisionally known* — a real `ItemState` (so life-stage,
 * the due queue, and module coverage reflect the placement at once), flagged `provisional: true` so
 * its first review confirms or drops the assumption (see `applyReview`). Due dates are spread across
 * `SEED_SPREAD_DAYS` so the confirm pass is paced rather than a single-day flood. `L0` (or any level
 * off the band scale) seeds nothing — the learner starts at the beginning.
 */
export function placementSeeds(content: Content, level: Level, now: number): ItemState[] {
  const upTo = PROBE_BANDS.indexOf(level)
  if (upTo < 0) return []
  const seeds: ItemState[] = []
  let i = 0
  // Any real placement (≥ L1) implies the learner reads kana — they just answered kana-cued
  // recognition questions — so the L0 syllabary is seeded provisionally too (D-023); the
  // confirm-or-drop mechanic still catches individual gaps.
  for (const band of ['L0' as Level, ...PROBE_BANDS.slice(0, upTo + 1)]) {
    for (const id of reviewablePoolIds(content, band)) {
      seeds.push({
        itemId: id,
        stage: SEED_STAGE,
        due: now + (i % SEED_SPREAD_DAYS) * DAY,
        introducedAt: now,
        lapses: 0,
        lastOutcomes: 0,
        provisional: true,
      })
      i++
    }
  }
  return seeds
}
