import { describe, it, expect } from 'vitest'
import gsap from 'gsap'
import { SIGNATURE_EASE } from './eases'

describe('signature eases (D-033)', () => {
  it('registers both curves under their signature names', () => {
    expect(gsap.parseEase(SIGNATURE_EASE.shoji)).toBeTruthy()
    expect(gsap.parseEase(SIGNATURE_EASE.hanko)).toBeTruthy()
  })

  it('shoji launches fast and settles to a dead stop', () => {
    const ease = gsap.parseEase(SIGNATURE_EASE.shoji)
    expect(ease(0.3)).toBeGreaterThan(0.55) // most of the travel happens early
    expect(ease(1)).toBeCloseTo(1)
  })

  it('hankoPress overshoots past the mark before settling (the compress)', () => {
    const ease = gsap.parseEase(SIGNATURE_EASE.hanko)
    const samples = Array.from({ length: 21 }, (_, i) => ease(i / 20))
    expect(Math.max(...samples)).toBeGreaterThan(1) // the micro-compress
    expect(ease(1)).toBeCloseTo(1)
  })
})
