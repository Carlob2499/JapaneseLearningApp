import { describe, it, expect } from 'vitest'
import { applyReview, dueItems, newState, pickNewItems, STAGE_INTERVALS_MS } from './srs'

const NOW = 1_700_000_000_000
const HOUR = 3_600_000
const DAY = 24 * HOUR

describe('srs', () => {
  it('introduces a new item at stage 0, due now', () => {
    const s = newState('a', NOW)
    expect(s).toMatchObject({ itemId: 'a', stage: 0, due: NOW, lapses: 0 })
  })

  it('pass advances one stage and schedules the next interval', () => {
    const s = applyReview(newState('a', NOW), 'pass', NOW)
    expect(s.stage).toBe(1)
    expect(s.due).toBe(NOW + STAGE_INTERVALS_MS[1]) // 4h
  })

  it('pass caps at the max stage', () => {
    let s = { ...newState('a', NOW), stage: 7, due: NOW }
    s = applyReview(s, 'pass', NOW)
    expect(s.stage).toBe(7)
    expect(s.due).toBe(NOW + STAGE_INTERVALS_MS[7])
  })

  it('fail drops two stages (min 1), counts a lapse, reschedules', () => {
    const at5 = { ...newState('a', NOW), stage: 5, due: NOW }
    const s = applyReview(at5, 'fail', NOW)
    expect(s.stage).toBe(3)
    expect(s.lapses).toBe(1)
    expect(s.due).toBe(NOW + STAGE_INTERVALS_MS[3])
  })

  it('fail never drops below stage 1', () => {
    expect(applyReview(newState('a', NOW), 'fail', NOW).stage).toBe(1)
  })

  it('partial holds the stage and reschedules in a day', () => {
    const at3 = { ...newState('a', NOW), stage: 3, due: NOW }
    const s = applyReview(at3, 'partial', NOW)
    expect(s.stage).toBe(3)
    expect(s.due).toBe(NOW + DAY)
  })

  it('dueItems returns only due items, soonest first', () => {
    const states = [
      { ...newState('later', NOW), due: NOW + HOUR },
      { ...newState('now', NOW), due: NOW },
      { ...newState('past', NOW), due: NOW - HOUR },
    ]
    expect(dueItems(NOW, states).map((s) => s.itemId)).toEqual(['past', 'now'])
  })

  it('pickNewItems skips known ids and honors the cap', () => {
    const states = [newState('a', NOW)]
    expect(pickNewItems(['a', 'b', 'c', 'd'], states, 2)).toEqual(['b', 'c'])
  })
})
