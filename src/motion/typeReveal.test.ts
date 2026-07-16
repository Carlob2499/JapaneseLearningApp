import { describe, it, expect } from 'vitest'
import { revealChars } from './typeReveal'

// jsdom always reports reduced motion ON — the branch under test is the collapsed one, and the
// companion law to timelines.ts's drawSVG rule: SplitText must never be constructed here.
describe('revealChars (reduced-motion branch, D-033)', () => {
  it('is an instant no-op that never splits the element', () => {
    const el = document.createElement('h2')
    el.textContent = '引っ越し'
    const tw = revealChars(el)
    expect(tw.duration()).toBe(0)
    expect(el.children).toHaveLength(0) // no injected char/mask spans
    expect(el.textContent).toBe('引っ越し') // the original text node is untouched
  })
})
