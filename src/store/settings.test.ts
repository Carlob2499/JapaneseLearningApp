import { describe, it, expect, beforeEach } from 'vitest'
import { getActiveLevels, setActiveLevels } from './settings'

beforeEach(() => localStorage.clear())

describe('level settings', () => {
  it('defaults to L1 when nothing is stored', () => {
    expect(getActiveLevels()).toEqual(['L1'])
  })

  it('round-trips a selection in canonical order', () => {
    setActiveLevels(['L3', 'L1'])
    expect(getActiveLevels()).toEqual(['L1', 'L3'])
  })

  it('drops junk and never returns an empty set', () => {
    localStorage.setItem('hikkoshi:levels', JSON.stringify(['L2', 'nope', 42]))
    expect(getActiveLevels()).toEqual(['L2'])
    expect(setActiveLevels([])).toEqual(['L1'])
    expect(getActiveLevels()).toEqual(['L1'])
  })

  it('survives a corrupt stored value', () => {
    localStorage.setItem('hikkoshi:levels', 'not json')
    expect(getActiveLevels()).toEqual(['L1'])
  })
})
