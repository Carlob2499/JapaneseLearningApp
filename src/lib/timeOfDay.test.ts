import { describe, it, expect } from 'vitest'
import { timeBucket } from './timeOfDay'

describe('timeBucket (D-026)', () => {
  it('maps the day into morning / day / dusk / night with exact boundaries', () => {
    expect(timeBucket(0)).toBe('night')
    expect(timeBucket(4)).toBe('night')
    expect(timeBucket(5)).toBe('morning')
    expect(timeBucket(9)).toBe('morning')
    expect(timeBucket(10)).toBe('day')
    expect(timeBucket(15)).toBe('day')
    expect(timeBucket(16)).toBe('dusk')
    expect(timeBucket(18)).toBe('dusk')
    expect(timeBucket(19)).toBe('night')
    expect(timeBucket(23)).toBe('night')
  })
})
