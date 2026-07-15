import { describe, it, expect } from 'vitest'
import { answerProbe, initProbe, PROBE_LENGTH, PROBE_START, probeDone, probeEstimate, type ProbeState } from './probe'

/** Walk a whole probe given a scorer(questionIndex) → correct, returning the final state. */
function run(scorer: (i: number) => boolean): ProbeState {
  let s = initProbe()
  let i = 0
  while (!probeDone(s)) {
    s = answerProbe(s, `q${i}`, scorer(i))
    i++
  }
  return s
}

describe('placement probe staircase', () => {
  it('starts mid-range with nothing answered', () => {
    const s = initProbe()
    expect(s.band).toBe(PROBE_START)
    expect(s.asked).toBe(0)
    expect(s.highestCorrect).toBeNull()
    expect(probeEstimate(s)).toBe('L0') // no answers → not placed
  })

  it('steps up on a correct answer and down on a wrong one', () => {
    const up = answerProbe(initProbe(), 'a', true)
    expect(up.band).toBe('L3')
    expect(up.highestCorrect).toBe('L2')
    const down = answerProbe(initProbe(), 'a', false)
    expect(down.band).toBe('L1')
    expect(down.highestCorrect).toBeNull()
  })

  it('clamps at L5 on a correct streak and at L1 on a wrong streak', () => {
    expect(run(() => true).band).toBe('L5') // all correct → tops out
    expect(probeEstimate(run(() => true))).toBe('L5')
    expect(run(() => false).band).toBe('L1') // all wrong → bottoms out
    expect(probeEstimate(run(() => false))).toBe('L0') // never correct → not placed
  })

  it('records the highest band ever answered correctly as the estimate', () => {
    // Correct up to L4, then wrong the rest: the ceiling stays L4 even as the band descends.
    const s = run((i) => i < 3) // correct at L2, L3, L4 then wrong
    expect(s.highestCorrect).toBe('L4')
    expect(probeEstimate(s)).toBe('L4')
  })

  it('never overshoots the estimate below a genuine ceiling on a lucky-then-wrong pattern', () => {
    // One lucky correct at L2, then all wrong: ceiling is L2, band walks back down to L1.
    const s = run((i) => i === 0)
    expect(probeEstimate(s)).toBe('L2')
    expect(s.band).toBe('L1')
  })

  it('asks exactly PROBE_LENGTH questions', () => {
    const s = run((i) => i % 2 === 0)
    expect(s.asked).toBe(PROBE_LENGTH)
    expect(s.usedIds).toHaveLength(PROBE_LENGTH)
  })
})
