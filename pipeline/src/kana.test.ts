import { describe, it, expect } from 'vitest'
import { buildKanaItems, kanjivgIdFor, kanjivgIdsFor, KANA_ROWS, YOON_ROWS, ALL_ROWS } from './kana'

describe('kana table (D-023, extended for yōon in D-029)', () => {
  const items = buildKanaItems()

  it('builds exactly 208 kana: 104 per script (71 singles + 33 yōon), no duplicates', () => {
    expect(items).toHaveLength(208)
    expect(items.filter((k) => k.script === 'hiragana')).toHaveLength(104)
    expect(items.filter((k) => k.script === 'katakana')).toHaveLength(104)
    expect(new Set(items.map((k) => k.char)).size).toBe(208)
    expect(new Set(items.map((k) => k.id)).size).toBe(208)
  })

  it('emits in curriculum order: all hiragana (singles then yōon) first, then all katakana', () => {
    const firstKatakana = items.findIndex((k) => k.script === 'katakana')
    expect(firstKatakana).toBe(104)
    expect(items[0].char).toBe('あ') // the very first thing a learner ever meets
    expect(items[104].char).toBe('ア')
    // Singles precede yōon within each script: the last hiragana single is before きゃ.
    const kya = items.findIndex((k) => k.char === 'きゃ')
    const wo = items.findIndex((k) => k.char === 'を')
    expect(wo).toBeLessThan(kya)
    expect(kya).toBeLessThan(firstKatakana)
  })

  it('derives KanjiVG ids per component: one for a base kana, two for a yōon', () => {
    expect(kanjivgIdFor('あ')).toBe('03042')
    expect(kanjivgIdFor('ア')).toBe('030a2')
    expect(kanjivgIdsFor('あ')).toEqual(['03042'])
    expect(kanjivgIdsFor('きゃ')).toEqual([kanjivgIdFor('き'), kanjivgIdFor('ゃ')])
    for (const k of items) {
      expect(k.kanjivgIds.length).toBe([...k.char].length)
      for (const id of k.kanjivgIds) expect(id).toMatch(/^[0-9a-f]{5}$/)
    }
  })

  it('carries acceptance alternates for singles and yōon romanization traps', () => {
    const byChar = new Map(items.map((k) => [k.char, k]))
    expect(byChar.get('し')?.romaji).toBe('shi')
    expect(byChar.get('し')?.altRomaji).toContain('si')
    expect(byChar.get('つ')?.altRomaji).toContain('tu')
    expect(byChar.get('を')?.altRomaji).toContain('o')
    expect(byChar.get('ん')?.altRomaji).toContain('nn')
    // Yōon: Hepburn primary, kunrei/wāpuro alternates accepted.
    expect(byChar.get('しゃ')?.romaji).toBe('sha')
    expect(byChar.get('しゃ')?.altRomaji).toContain('sya')
    expect(byChar.get('ちゅ')?.altRomaji).toContain('tyu')
    expect(byChar.get('じょ')?.romaji).toBe('jo')
    expect(byChar.get('じょ')?.altRomaji).toEqual(expect.arrayContaining(['zyo', 'jyo']))
    // Katakana mirror the same readings.
    expect(byChar.get('シャ')?.romaji).toBe('sha')
  })

  it('keeps the two scripts structurally identical (same rows, same romaji sequence)', () => {
    const h = items.filter((k) => k.script === 'hiragana').map((k) => `${k.row}:${k.romaji}`)
    const k = items.filter((k) => k.script === 'katakana').map((k) => `${k.row}:${k.romaji}`)
    expect(h).toEqual(k)
  })

  it('every entry is L0; singles rows then yōon rows in gojūon order', () => {
    for (const k of items) expect(k.level).toBe('L0')
    expect(KANA_ROWS.map((r) => r.row).slice(0, 3)).toEqual(['a', 'ka', 'sa'])
    expect(KANA_ROWS).toHaveLength(15)
    expect(YOON_ROWS).toHaveLength(11) // 11 consonant rows × 3 = 33 yōon per script
    expect(ALL_ROWS).toHaveLength(26)
    expect(YOON_ROWS.map((r) => r.row).slice(0, 3)).toEqual(['kya', 'sha', 'cha'])
  })
})
