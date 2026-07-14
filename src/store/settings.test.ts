import { describe, it, expect, beforeEach } from 'vitest'
import {
  getActiveLevels,
  getAutoPlay,
  getLastCelebratedStage,
  getOnboarded,
  setActiveLevels,
  setAutoPlay,
  setLastCelebratedStage,
  setOnboarded,
} from './settings'

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

describe('auto-play setting', () => {
  it('defaults on and round-trips off/on', () => {
    expect(getAutoPlay()).toBe(true)
    expect(setAutoPlay(false)).toBe(false)
    expect(getAutoPlay()).toBe(false)
    setAutoPlay(true)
    expect(getAutoPlay()).toBe(true)
  })
})

describe('onboarded flag', () => {
  it('defaults off and round-trips on/off', () => {
    expect(getOnboarded()).toBe(false)
    expect(setOnboarded(true)).toBe(true)
    expect(getOnboarded()).toBe(true)
    setOnboarded(false)
    expect(getOnboarded()).toBe(false)
  })
})

describe('last celebrated life stage', () => {
  it('defaults to null (a fresh profile has never celebrated) and round-trips a stage', () => {
    expect(getLastCelebratedStage()).toBeNull()
    expect(setLastCelebratedStage(2)).toBe(2)
    expect(getLastCelebratedStage()).toBe(2)
  })

  it('survives a corrupt stored value the same as never-celebrated', () => {
    localStorage.setItem('hikkoshi:lastCelebratedStage', 'not a number')
    expect(getLastCelebratedStage()).toBeNull()
  })
})
