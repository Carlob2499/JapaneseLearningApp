import { describe, it, expect, beforeEach } from 'vitest'
import {
  daysUntilClass,
  dismissClassDiscovery,
  getClassSettings,
  isClassDiscoveryDismissed,
  setClassSettings,
} from './classSettings'

beforeEach(() => localStorage.clear())

describe('class settings', () => {
  it('defaults to disabled, quartet1, Wednesday, lesson 1', () => {
    expect(getClassSettings()).toEqual({ enabled: false, book: 'quartet1', classDay: 3, lesson: 1 })
  })

  it('round-trips a partial update, merged onto the current value', () => {
    setClassSettings({ enabled: true, lesson: 2 })
    expect(getClassSettings()).toEqual({ enabled: true, book: 'quartet1', classDay: 3, lesson: 2 })
  })

  it('round-trips a six-character weekly kanji override', () => {
    setClassSettings({ weeklyKanjiOverride: ['短', '合', '公', '園', '酒', '機'] })
    expect(getClassSettings().weeklyKanjiOverride).toEqual(['短', '合', '公', '園', '酒', '機'])
  })

  it('drops a malformed weekly override (wrong length)', () => {
    localStorage.setItem('hikkoshi:class', JSON.stringify({ weeklyKanjiOverride: ['短', '合'] }))
    expect(getClassSettings().weeklyKanjiOverride).toBeUndefined()
  })

  it('drops an out-of-range classDay and falls back to the default', () => {
    localStorage.setItem('hikkoshi:class', JSON.stringify({ classDay: 9 }))
    expect(getClassSettings().classDay).toBe(3)
  })

  it('survives a corrupt stored value', () => {
    localStorage.setItem('hikkoshi:class', 'not json')
    expect(getClassSettings()).toEqual({ enabled: false, book: 'quartet1', classDay: 3, lesson: 1 })
  })
})

describe('daysUntilClass', () => {
  it('is 0 when today is the class day', () => {
    expect(daysUntilClass(new Date('2026-07-22'), 3)).toBe(0) // 2026-07-22 is a Wednesday
  })

  it('counts forward to the next occurrence within the week', () => {
    expect(daysUntilClass(new Date('2026-07-20'), 3)).toBe(2) // Monday → Wednesday
    expect(daysUntilClass(new Date('2026-07-23'), 3)).toBe(6) // Thursday → next Wednesday
  })
})

describe('class discovery dismissal', () => {
  it('defaults to not dismissed, and persists once dismissed', () => {
    expect(isClassDiscoveryDismissed()).toBe(false)
    dismissClassDiscovery()
    expect(isClassDiscoveryDismissed()).toBe(true)
  })
})
