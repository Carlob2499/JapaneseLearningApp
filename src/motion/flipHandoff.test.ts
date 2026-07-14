import { describe, it, expect } from 'vitest'
import 'gsap/Flip'
import { stash, take } from './flipHandoff'

function fakeState(id: string): Flip.FlipState {
  return { id } as unknown as Flip.FlipState
}

describe('flipHandoff', () => {
  it('returns the stashed state to a take() with the matching tag, then clears it', () => {
    const state = fakeState('a')
    stash('home-to-review', state)
    expect(take('home-to-review')).toBe(state)
    expect(take('home-to-review')).toBeNull() // consumed once
  })

  it('returns null for a tag that was never stashed', () => {
    expect(take('nothing-here')).toBeNull()
  })

  it('does not clear a pending stash when take() is called with the wrong tag', () => {
    const state = fakeState('b')
    stash('home-to-scene', state)
    expect(take('home-to-review')).toBeNull() // wrong tag — pending untouched
    expect(take('home-to-scene')).toBe(state) // correct tag still resolves
  })

  it('last-write-wins: a second stash before the first is taken replaces it (rapid double-tap)', () => {
    stash('home-to-review', fakeState('first'))
    const second = fakeState('second')
    stash('home-to-review', second)
    expect(take('home-to-review')).toBe(second)
  })
})
