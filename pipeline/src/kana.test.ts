import { describe, it, expect } from 'vitest'
import { buildKanaItems, kanjivgIdFor, KANA_ROWS } from './kana'

describe('kana table (D-023)', () => {
  const items = buildKanaItems()

  it('builds exactly 142 kana: 71 per script (46 base + 25 voiced), no duplicates', () => {
    expect(items).toHaveLength(142)
    expect(items.filter((k) => k.script === 'hiragana')).toHaveLength(71)
    expect(items.filter((k) => k.script === 'katakana')).toHaveLength(71)
    expect(new Set(items.map((k) => k.char)).size).toBe(142)
    expect(new Set(items.map((k) => k.id)).size).toBe(142)
  })

  it('emits in curriculum order: all hiragana rows first, then katakana', () => {
    const firstKatakana = items.findIndex((k) => k.script === 'katakana')
    expect(firstKatakana).toBe(71)
    expect(items[0].char).toBe('あ') // the very first thing a learner ever meets
    expect(items[71].char).toBe('ア')
  })

  it('derives KanjiVG ids from codepoints (5-hex, zero-padded)', () => {
    expect(kanjivgIdFor('あ')).toBe('03042')
    expect(kanjivgIdFor('ア')).toBe('030a2')
    expect(kanjivgIdFor('ぽ')).toBe('0307d')
    for (const k of items) expect(k.kanjivgId).toMatch(/^[0-9a-f]{5}$/)
  })

  it('carries acceptance alternates for every romanization trap', () => {
    const byChar = new Map(items.map((k) => [k.char, k]))
    expect(byChar.get('し')?.romaji).toBe('shi')
    expect(byChar.get('し')?.altRomaji).toContain('si')
    expect(byChar.get('つ')?.altRomaji).toContain('tu')
    expect(byChar.get('ふ')?.altRomaji).toContain('hu')
    expect(byChar.get('を')?.romaji).toBe('wo')
    expect(byChar.get('を')?.altRomaji).toContain('o')
    expect(byChar.get('ん')?.altRomaji).toContain('nn')
    expect(byChar.get('ぢ')?.altRomaji).toContain('di')
    expect(byChar.get('づ')?.altRomaji).toContain('du')
    // Katakana mirror the same readings.
    expect(byChar.get('シ')?.romaji).toBe('shi')
  })

  it('keeps the two scripts structurally identical (same rows, same romaji sequence)', () => {
    const h = items.filter((k) => k.script === 'hiragana').map((k) => `${k.row}:${k.romaji}`)
    const k = items.filter((k) => k.script === 'katakana').map((k) => `${k.row}:${k.romaji}`)
    expect(h).toEqual(k)
  })

  it('every entry is L0 and every row label appears in gojūon order', () => {
    for (const k of items) expect(k.level).toBe('L0')
    const rowOrder = KANA_ROWS.map((r) => r.row)
    expect(rowOrder.slice(0, 3)).toEqual(['a', 'ka', 'sa'])
    expect(rowOrder).toHaveLength(15)
  })
})
