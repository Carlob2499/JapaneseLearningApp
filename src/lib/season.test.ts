import { describe, it, expect } from 'vitest'
import { season } from './season'

describe('season (kisetsu bucket, D-033)', () => {
  it('maps all twelve months', () => {
    expect(season(1)).toBe('winter')
    expect(season(2)).toBe('winter')
    expect(season(3)).toBe('spring')
    expect(season(4)).toBe('spring')
    expect(season(5)).toBe('spring')
    expect(season(6)).toBe('tsuyu')
    expect(season(7)).toBe('summer')
    expect(season(8)).toBe('summer')
    expect(season(9)).toBe('autumn')
    expect(season(10)).toBe('autumn')
    expect(season(11)).toBe('autumn')
    expect(season(12)).toBe('winter')
  })
})
