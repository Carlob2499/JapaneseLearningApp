import { describe, it, expect } from 'vitest'
import {
  applyReview,
  dueItems,
  isLeech,
  newState,
  nudgeMultiplier,
  pickNewItems,
  STAGE_INTERVALS_MS,
} from './srs'

const NOW = 1_700_000_000_000
const HOUR = 3_600_000
const DAY = 24 * HOUR

/** The scheduled interval for a stage, scaled by the nudge the packed history implies. */
function expectedDue(stage: number, lastOutcomes: number): number {
  return NOW + Math.round(STAGE_INTERVALS_MS[stage] * nudgeMultiplier(lastOutcomes))
}

describe('srs', () => {
  it('introduces a new item at stage 0, due now', () => {
    const s = newState('a', NOW)
    expect(s).toMatchObject({ itemId: 'a', stage: 0, due: NOW, lapses: 0 })
  })

  it('pass advances one stage and schedules the nudged next interval', () => {
    const s = applyReview(newState('a', NOW), 'pass', NOW)
    expect(s.stage).toBe(1)
    expect(s.lastOutcomes).toBe(1)
    expect(s.due).toBe(expectedDue(1, s.lastOutcomes)) // ~4h, nudged
  })

  it('pass caps at the max stage', () => {
    let s = { ...newState('a', NOW), stage: 7, due: NOW }
    s = applyReview(s, 'pass', NOW)
    expect(s.stage).toBe(7)
    expect(s.due).toBe(expectedDue(7, s.lastOutcomes))
  })

  it('fail drops two stages (min 1), counts a lapse, reschedules', () => {
    const at5 = { ...newState('a', NOW), stage: 5, due: NOW }
    const s = applyReview(at5, 'fail', NOW)
    expect(s.stage).toBe(3)
    expect(s.lapses).toBe(1)
    expect(s.due).toBe(expectedDue(3, s.lastOutcomes))
  })

  it('nudge multiplier stays in [0.8, 1.3] and rewards recent passes', () => {
    expect(nudgeMultiplier(0b0000)).toBe(0.8) // all miss
    expect(nudgeMultiplier(0b1111)).toBe(1.3) // all pass
    expect(nudgeMultiplier(0b0101)).toBeCloseTo(1.05) // 2 of last 4
    for (const bits of [0, 1, 0b1010, 0xffff, 0b0111]) {
      const m = nudgeMultiplier(bits)
      expect(m).toBeGreaterThanOrEqual(0.8)
      expect(m).toBeLessThanOrEqual(1.3)
    }
  })

  it('a streak of passes stretches the interval versus a single pass', () => {
    let s = newState('a', NOW)
    for (let i = 0; i < 4; i++) s = applyReview({ ...s, due: NOW }, 'pass', NOW)
    // stage 4 reached; four passes in history → 1.3× the ladder value
    expect(s.stage).toBe(4)
    expect(s.due).toBe(NOW + Math.round(STAGE_INTERVALS_MS[4] * 1.3))
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

  it('confirms a provisional (placement-seeded) item on a pass: clears the flag, advances normally', () => {
    const seed = { ...newState('a', NOW), stage: 2, provisional: true }
    const s = applyReview(seed, 'pass', NOW)
    expect(s.provisional).toBe(false)
    expect(s.stage).toBe(3) // advanced like a normal known item
    // A second review then behaves exactly like any non-provisional item.
    const s2 = applyReview({ ...s, due: NOW }, 'pass', NOW)
    expect(s2.provisional).toBe(false)
    expect(s2.stage).toBe(4)
  })

  it('confirms a provisional item on a partial: clears the flag, one-day hold', () => {
    const seed = { ...newState('a', NOW), stage: 2, provisional: true }
    const s = applyReview(seed, 'partial', NOW)
    expect(s.provisional).toBe(false)
    expect(s.stage).toBe(2)
    expect(s.due).toBe(NOW + DAY)
  })

  it('drops a provisional item on its first failure: restarts as genuinely new (stage 0, due now)', () => {
    const seed = { ...newState('a', NOW), stage: 2, provisional: true }
    const s = applyReview(seed, 'fail', NOW)
    expect(s.provisional).toBe(false)
    expect(s.stage).toBe(0) // not the normal fail's max(1, stage-2) — a full restart
    expect(s.due).toBe(NOW)
    expect(s.lapses).toBe(0) // a bad placement guess isn't a genuine lapse
  })

  it('newState is never provisional (only placement seeds set the flag)', () => {
    expect(newState('a', NOW).provisional).toBeUndefined()
  })

  it('flags a leech at 3 fails within 30 days, ignoring older fails', () => {
    const now = 100 * DAY
    const d = DAY
    expect(isLeech([now - d, now - 2 * d], now)).toBe(false) // only 2 recent
    expect(isLeech([now - d, now - 2 * d, now - 3 * d], now)).toBe(true) // 3 recent
    expect(isLeech([now - 40 * d, now - 41 * d, now - 42 * d], now)).toBe(false) // all stale
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

  it('pickNewItems introduces nothing when the cap is 0 (daily budget spent)', () => {
    expect(pickNewItems(['a', 'b', 'c'], [], 0)).toEqual([])
  })
})
