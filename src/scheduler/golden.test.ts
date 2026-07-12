import { describe, it, expect } from 'vitest'
import type { ItemState } from '@hikkoshi/schemas'
import { applyReview, dueItems, isLeech, newState } from './srs'
import { DEFAULT_DAILY_NEW, DEFAULT_DUE_CEILING, shapeDueQueue } from './loadShaper'

// Golden-file trajectory test (architecture §5/§8): simulate a 180-day learner with a
// seeded RNG and assert load ceilings hold, nothing starves, stages distribute sanely,
// and chronic-fail items become leeches. Deterministic — no Math.random / Date.now.

const DAY = 86_400_000
const START = 1_700_000_000_000

/** Seeded LCG in [0, 1) so the trajectory is identical on every run. */
function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0
    return s / 0x100000000
  }
}

describe('scheduler 180-day golden trajectory', () => {
  it('holds load ceilings, avoids starvation, matures normals, and catches leeches', () => {
    const rng = lcg(0x5eed)
    const POOL = Array.from({ length: 120 }, (_, i) => `item:${i}`)
    const HARD = new Set(POOL.slice(0, 10)) // never learnable — must become leeches
    const states = new Map<string, ItemState>()
    const failTs = new Map<string, number[]>()
    const CEILING = DEFAULT_DUE_CEILING

    let maxDaily = 0
    let totalReviews = 0

    for (let day = 0; day < 180; day++) {
      const now = START + day * DAY

      // Blocked introduction, capped per day.
      const fresh = POOL.filter((id) => !states.has(id)).slice(0, DEFAULT_DAILY_NEW)
      for (const id of fresh) states.set(id, newState(id, now))

      // Surface due items, load-shaped.
      const due = dueItems(now, [...states.values()])
      const { keep, slide } = shapeDueQueue(due, now, CEILING)
      for (const s of slide) states.set(s.itemId, s)
      maxDaily = Math.max(maxDaily, keep.length)

      for (const s of keep) {
        const outcome = HARD.has(s.itemId) ? 'fail' : rng() < 0.85 ? 'pass' : 'fail'
        const next = applyReview(s, outcome, now)
        if (outcome === 'fail') {
          const arr = failTs.get(s.itemId) ?? []
          arr.push(now)
          failTs.set(s.itemId, arr)
        }
        next.leech = isLeech(failTs.get(s.itemId) ?? [], now)
        states.set(s.itemId, next)
        totalReviews += 1
      }
    }

    const all = [...states.values()]
    const normals = all.filter((s) => !HARD.has(s.itemId))
    const hards = all.filter((s) => HARD.has(s.itemId))

    // 1. Every pool item was introduced (120 ≤ 180 days × 10/day).
    expect(states.size).toBe(120)

    // 2. Load ceiling held every day.
    expect(maxDaily).toBeLessThanOrEqual(CEILING)

    // 3. No starvation — every item was reviewed at least once (stage advanced off 0).
    expect(all.every((s) => s.stage >= 1)).toBe(true)

    // 4. Stage distribution sanity — a healthy share of learnable items matured.
    const matured = normals.filter((s) => s.stage >= 5).length
    expect(matured).toBeGreaterThan(normals.length * 0.3)

    // 5. Leeches caught — every chronic-fail item is flagged and never matured.
    expect(hards.every((s) => s.leech === true)).toBe(true)
    expect(hards.every((s) => s.stage <= 2)).toBe(true)

    // Sanity: the simulation actually did work.
    expect(totalReviews).toBeGreaterThan(1000)
  })
})
