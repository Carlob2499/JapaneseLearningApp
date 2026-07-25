import { describe, it, expect } from 'vitest'
import type { ItemState } from '@hikkoshi/schemas'
import {
  AMNESTY_OVERDUE_MS,
  DEFAULT_DUE_CEILING,
  WARM_RETURN_CAP,
  applyAmnesty,
  dayIndex,
  introBudget,
  isWarmReturn,
  loadHistogram,
  shapeDueQueue,
  snapToLightestDay,
} from './loadShaper'

const DAY = 86_400_000
const HOUR = 3_600_000

function state(itemId: string, over: Partial<ItemState> = {}): ItemState {
  return { itemId, stage: 0, due: 0, introducedAt: 0, lapses: 0, lastOutcomes: 0, ...over }
}

describe('snapToLightestDay', () => {
  it('moves an ideal due to the lightest day within ±15% of the gap, keeping time-of-day', () => {
    const now = 0
    const idealDue = 10 * DAY + 5 * HOUR // gap ≈ 10 days, ideal day 10, 05:00
    const load = new Map<number, number>([
      [8, 3],
      [9, 0], // lightest in the ±15% window [8..11]
      [10, 5],
      [11, 2],
    ])
    expect(snapToLightestDay(idealDue, now, load)).toBe(9 * DAY + 5 * HOUR)
  })

  it('stays put when the ideal day is already the lightest', () => {
    const now = 0
    const idealDue = 10 * DAY
    const load = new Map<number, number>([
      [9, 4],
      [10, 1],
      [11, 4],
    ])
    expect(snapToLightestDay(idealDue, now, load)).toBe(idealDue)
  })

  it('leaves a past-due date unchanged', () => {
    expect(snapToLightestDay(-DAY, 0, new Map())).toBe(-DAY)
  })
})

describe('loadHistogram', () => {
  it('counts states per due-day and can exclude one item', () => {
    const states = [state('a', { due: 2 * DAY }), state('b', { due: 2 * DAY }), state('c', { due: 5 * DAY })]
    expect(loadHistogram(states)).toEqual(new Map([[2, 2], [5, 1]]))
    expect(loadHistogram(states, 'a')).toEqual(new Map([[2, 1], [5, 1]]))
  })
})

describe('shapeDueQueue', () => {
  it('keeps everything under the ceiling', () => {
    const due = [state('a', { due: 1 }), state('b', { due: 2 })]
    const { keep, slide } = shapeDueQueue(due, 1000, 10)
    expect(keep).toHaveLength(2)
    expect(slide).toHaveLength(0)
  })

  it('over the ceiling, keeps the most fragile (lowest stage) and slides the rest a day', () => {
    const now = 100 * DAY
    // 3 items: stages 6, 0, 3 — ceiling 2 keeps stages 0 and 3, slides stage 6.
    const due = [
      state('settled', { due: now - HOUR, stage: 6 }),
      state('fragile', { due: now - 2 * HOUR, stage: 0 }),
      state('mid', { due: now - 3 * HOUR, stage: 3 }),
    ]
    const { keep, slide } = shapeDueQueue(due, now, 2)
    expect(keep.map((s) => s.itemId).sort()).toEqual(['fragile', 'mid'])
    expect(slide).toHaveLength(1)
    expect(slide[0].itemId).toBe('settled')
    expect(slide[0].due).toBe(now + DAY)
  })

  it('kept items come out soonest-due first', () => {
    const now = 100 * DAY
    const due = [
      state('late', { due: now - HOUR, stage: 0 }),
      state('early', { due: now - 5 * HOUR, stage: 0 }),
    ]
    const { keep } = shapeDueQueue(due, now, 5)
    expect(keep.map((s) => s.itemId)).toEqual(['early', 'late'])
  })
})

describe('introBudget', () => {
  it('is a per-day cap: repeated sessions in one day do not re-flood', () => {
    const now = 100 * DAY + 5 * HOUR
    // Nothing introduced today → full budget.
    expect(introBudget([], now, 10)).toBe(10)
    // 4 introduced earlier today → 6 left, regardless of how many sessions ran.
    const todayStates = Array.from({ length: 4 }, (_, i) => state(`t${i}`, { introducedAt: 100 * DAY }))
    expect(introBudget(todayStates, now, 10)).toBe(6)
    // Yesterday's intros don't count against today.
    expect(introBudget([state('y', { introducedAt: 99 * DAY })], now, 10)).toBe(10)
    // Never negative.
    const many = Array.from({ length: 20 }, (_, i) => state(`m${i}`, { introducedAt: 100 * DAY }))
    expect(introBudget(many, now, 10)).toBe(0)
  })
})

describe('constants', () => {
  it('exposes a sane default ceiling', () => {
    expect(DEFAULT_DUE_CEILING).toBeGreaterThan(0)
    expect(dayIndex(DAY + 1)).toBe(1)
  })
})

describe('applyAmnesty', () => {
  const now = 1_000 * DAY

  it('keeps an item overdue by less than 14 days untouched', () => {
    const s = state('a', { due: now - 13 * DAY })
    const { keep, slide } = applyAmnesty([s], now)
    expect(keep).toEqual([s])
    expect(slide).toEqual([])
  })

  it('re-spreads an item overdue by more than 14 days into the following week, never today', () => {
    const s = state('a', { due: now - 20 * DAY })
    const { keep, slide } = applyAmnesty([s], now)
    expect(keep).toEqual([])
    expect(slide).toHaveLength(1)
    const gap = slide[0].due - now
    expect(gap).toBeGreaterThan(0)
    expect(gap).toBeLessThanOrEqual(7 * DAY)
  })

  it('is exactly the boundary at AMNESTY_OVERDUE_MS: not yet amnestied at the threshold itself', () => {
    const s = state('a', { due: now - AMNESTY_OVERDUE_MS })
    expect(applyAmnesty([s], now).keep).toEqual([s])
  })

  it('gives the same item the same offset across repeated calls (deterministic, no reshuffle)', () => {
    const s = state('a', { due: now - 30 * DAY })
    const first = applyAmnesty([s], now).slide[0].due
    const second = applyAmnesty([s], now).slide[0].due
    expect(first).toBe(second)
  })

  it('leaves non-overdue items alone entirely', () => {
    const items = [state('a', { due: now - DAY }), state('b', { due: now + DAY })]
    const { keep, slide } = applyAmnesty(items, now)
    expect(keep).toEqual(items)
    expect(slide).toEqual([])
  })
})

describe('isWarmReturn', () => {
  it('is false at or under the warm-return cap', () => {
    const items = Array.from({ length: WARM_RETURN_CAP }, (_, i) => state(`w${i}`))
    expect(isWarmReturn(items)).toBe(false)
  })

  it('is true once the due pile exceeds the warm-return cap', () => {
    const items = Array.from({ length: WARM_RETURN_CAP + 1 }, (_, i) => state(`w${i}`))
    expect(isWarmReturn(items)).toBe(true)
  })
})
