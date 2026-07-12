import { describe, it, expect } from 'vitest'
import type { ItemState } from '@hikkoshi/schemas'
import {
  DEFAULT_DUE_CEILING,
  dayIndex,
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

describe('constants', () => {
  it('exposes a sane default ceiling', () => {
    expect(DEFAULT_DUE_CEILING).toBeGreaterThan(0)
    expect(dayIndex(DAY + 1)).toBe(1)
  })
})
