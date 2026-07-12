import { describe, it, expect } from 'vitest'
import { joinVocab, joinKanji, kanjivgId, type KanjiDataRecord } from './tagJoin'
import type { JMEntry, KDEntry } from './normalize'

const jm: JMEntry[] = [
  {
    seq: 1358280,
    kebs: ['食べる'],
    rebs: ['たべる'],
    senses: [{ pos: ['v1', 'vt'], gloss: ['to eat'] }],
  },
  {
    seq: 1000000,
    kebs: [],
    rebs: ['ある'],
    senses: [{ pos: ['v5r-i'], gloss: ['to be', 'to exist'] }],
  },
]

describe('joinVocab', () => {
  it('resolves a kanji word to its JMdict reading + senses and maps N5→L1', () => {
    const { items, unmatched } = joinVocab(jm, [
      { expression: '食べる', reading: 'たべる', jlpt: 'N5' },
    ])
    expect(unmatched).toHaveLength(0)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      kind: 'vocab',
      jmdictSeq: 1358280,
      expression: '食べる',
      reading: 'たべる',
      level: 'L1',
    })
    expect(items[0].senses[0].gloss).toContain('to eat')
  })

  it('resolves a kana-only word (expression === reading)', () => {
    const { items } = joinVocab(jm, [{ expression: 'ある', reading: 'ある', jlpt: 'N4' }])
    expect(items[0]).toMatchObject({ level: 'L2', expression: 'ある' })
  })

  it('routes an unmatched entry to the review queue instead of guessing', () => {
    const { items, unmatched } = joinVocab(jm, [
      { expression: '存在しない', reading: 'そんざいしない', jlpt: 'N1' },
    ])
    expect(items).toHaveLength(0)
    expect(unmatched[0]).toMatchObject({ expression: '存在しない', reason: 'no JMdict entry' })
  })

  it('records levelSpread and picks the lowest level when a word spans levels', () => {
    const { items } = joinVocab(jm, [
      { expression: '食べる', reading: 'たべる', jlpt: 'N5' },
      { expression: '食べる', reading: 'たべる', jlpt: 'N3' },
    ])
    expect(items).toHaveLength(1)
    expect(items[0].level).toBe('L1')
    expect(items[0].levelSpread).toEqual(['L1', 'L3'])
  })
})

const kd: KDEntry[] = [
  {
    literal: '水',
    grade: 1,
    freq: 276,
    jlptOld: 4,
    strokeCount: 4,
    on: ['スイ'],
    kun: ['みず', 'みず-'],
    meanings: ['water'],
  },
]

describe('joinKanji', () => {
  it('derives the KanjiVG id from the codepoint (水 → 06c34)', () => {
    expect(kanjivgId('水')).toBe('06c34')
  })

  it('joins jlpt_new tags to KANJIDIC2 payload and maps N5→L1', () => {
    const data: Record<string, KanjiDataRecord> = { 水: { jlpt_new: 5, grade: 1, freq: 276 } }
    const { items, unmatched } = joinKanji(kd, data)
    expect(unmatched).toHaveLength(0)
    expect(items[0]).toMatchObject({
      kind: 'kanji',
      literal: '水',
      level: 'L1',
      grade: 1,
      jlptOld: 4,
      meanings: ['water'],
    })
    expect(items[0].strokes.kanjivgId).toBe('06c34')
  })

  it('queues a jlpt_new kanji absent from KANJIDIC2', () => {
    const data: Record<string, KanjiDataRecord> = { 〇: { jlpt_new: 3 } }
    const { items, unmatched } = joinKanji(kd, data)
    expect(items).toHaveLength(0)
    expect(unmatched[0]).toMatchObject({ literal: '〇', reason: 'not in KANJIDIC2' })
  })
})
