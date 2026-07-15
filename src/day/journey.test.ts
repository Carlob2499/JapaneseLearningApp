import { describe, it, expect } from 'vitest'
import { JOURNEY_NOTES, STAMP_GLYPHS, stampStateFor } from './journey'
import { LIFE_STAGE_NAMES } from './lifeStage'

describe('journey stamp book (D-025)', () => {
  it('stamps arrival for free, marks the next stage current, dots the rest', () => {
    // A brand-new profile: stage 0.
    expect(stampStateFor(0, 0)).toBe('stamped') // Tourist — you arrived
    expect(stampStateFor(1, 0)).toBe('current') // Resident is what you're working toward
    expect(stampStateFor(2, 0)).toBe('ahead')
    expect(stampStateFor(5, 0)).toBe('ahead')
  })

  it('advances the frontier with the life stage', () => {
    expect(stampStateFor(2, 3)).toBe('stamped')
    expect(stampStateFor(3, 3)).toBe('stamped')
    expect(stampStateFor(4, 3)).toBe('current')
    expect(stampStateFor(5, 3)).toBe('ahead')
  })

  it('at the final stage, everything is stamped and nothing is current', () => {
    for (let i = 0; i <= 5; i++) expect(stampStateFor(i, 5)).toBe('stamped')
  })

  it('carries one glyph and one journal note per life stage', () => {
    expect(STAMP_GLYPHS).toHaveLength(LIFE_STAGE_NAMES.length)
    expect(JOURNEY_NOTES).toHaveLength(LIFE_STAGE_NAMES.length)
  })
})
