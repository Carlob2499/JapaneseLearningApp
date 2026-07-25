import { describe, it, expect, beforeEach } from 'vitest'
import { shouldPlayKanjiSheetCeremony } from './kanjiSheetGate'

beforeEach(() => localStorage.clear())

describe('shouldPlayKanjiSheetCeremony (D-037)', () => {
  it('never plays under reduced motion (the jsdom default), flag or no flag', () => {
    expect(shouldPlayKanjiSheetCeremony(2)).toBe(false)
    localStorage.setItem('hikkoshi:kanji-sheet-shown:2', 'yes')
    expect(shouldPlayKanjiSheetCeremony(2)).toBe(false)
  })

  it('scopes the shown-flag per lesson number, independent of the reduced-motion result', () => {
    localStorage.setItem('hikkoshi:kanji-sheet-shown:2', 'yes')
    expect(localStorage.getItem('hikkoshi:kanji-sheet-shown:3')).toBeNull()
  })
})
