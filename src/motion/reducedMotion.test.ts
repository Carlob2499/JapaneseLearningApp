import { describe, it, expect } from 'vitest'
import { isReducedMotion } from './reducedMotion'

describe('isReducedMotion', () => {
  it('reports true under the test environment (jsdom matchMedia stub defaults reduced motion on, D-019)', () => {
    expect(isReducedMotion()).toBe(true)
  })
})
