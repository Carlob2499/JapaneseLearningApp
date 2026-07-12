import { describe, it, expect } from 'vitest'
import { Pack, VocabItem, KanjiItem, StrokeItem } from './index'

const vocab = {
  kind: 'vocab',
  id: 'vocab:1358280',
  jmdictSeq: 1358280,
  expression: '食べる',
  reading: 'たべる',
  senses: [{ gloss: ['to eat'], pos: ['v1', 'vt'] }],
  level: 'L1',
  modules: [],
}

const kanji = {
  kind: 'kanji',
  id: 'kanji:水',
  literal: '水',
  level: 'L1',
  grade: 1,
  strokes: { kanjivgId: '06c34' },
  readingsOn: ['スイ'],
  readingsKun: ['みず', 'みず-'],
  meanings: ['water'],
}

const validPack = {
  schemaVersion: '1.0.0',
  packId: 'vocab.l1.core',
  packVersion: '0.1.0',
  title: 'Vocabulary — L1 (≈N5)',
  license: { spdx: 'CC-BY-SA-4.0' },
  sources: [
    {
      name: 'JMdict (EDRDG)',
      url: 'https://www.edrdg.org/jmdict/j_jmdict.html',
      retrieved: '2026-07-11',
      license: 'CC-BY-SA-4.0',
    },
  ],
  levelTagSource: 'Jonathan Waller / tanos.co.uk via elzup/jlpt-word-list',
  levelTagLicense: 'CC-BY',
  verification: { status: 'dataset-verified', method: 'JMdict expression+reading join', date: '2026-07-11' },
  items: [vocab],
}

describe('item schemas', () => {
  it('accepts a dataset-shaped vocab item', () => {
    expect(VocabItem.safeParse(vocab).success).toBe(true)
  })

  it('accepts a dataset-shaped kanji item', () => {
    expect(KanjiItem.safeParse(kanji).success).toBe(true)
  })

  it('rejects a vocab item missing its reading', () => {
    const { reading: _omit, ...broken } = vocab
    expect(VocabItem.safeParse(broken).success).toBe(false)
  })

  it('rejects a vocab item with no senses (no verified meaning)', () => {
    expect(VocabItem.safeParse({ ...vocab, senses: [] }).success).toBe(false)
  })

  it('accepts a KanjiVG stroke item and rejects one with no strokes', () => {
    const strokes = {
      kind: 'strokes',
      id: 'strokes:水',
      literal: '水',
      kanjivgId: '06c34',
      viewBox: '0 0 109 109',
      strokes: ['M52,15c1,1...', 'M17,45c1,0...'],
      strokeCount: 2,
    }
    expect(StrokeItem.safeParse(strokes).success).toBe(true)
    expect(StrokeItem.safeParse({ ...strokes, strokes: [] }).success).toBe(false)
  })
})

describe('pack envelope integrity gate (D-002)', () => {
  it('accepts a fully-provenanced pack', () => {
    expect(Pack.safeParse(validPack).success).toBe(true)
  })

  it('rejects a pack with empty sources', () => {
    expect(Pack.safeParse({ ...validPack, sources: [] }).success).toBe(false)
  })

  it('rejects a pack missing verification', () => {
    const { verification: _omit, ...broken } = validPack
    expect(Pack.safeParse(broken).success).toBe(false)
  })

  it('rejects a pack with zero items', () => {
    expect(Pack.safeParse({ ...validPack, items: [] }).success).toBe(false)
  })
})
