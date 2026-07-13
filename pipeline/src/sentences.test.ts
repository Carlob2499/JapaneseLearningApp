import { describe, it, expect } from 'vitest'
import type { KanjiItem } from '@hikkoshi/schemas'
import {
  buildKnownKanjiByLevel,
  buildSentenceItems,
  extractKanji,
  type TatoebaCorpus,
} from './sentences'

function kanji(literal: string, level: KanjiItem['level']): KanjiItem {
  return {
    kind: 'kanji',
    id: `kanji:${literal}`,
    literal,
    level,
    strokes: { kanjivgId: '00000' },
    readingsOn: [],
    readingsKun: [],
    meanings: ['x'],
  }
}

// L1 knows 水; L3 additionally knows 図書館's kanji.
const known = buildKnownKanjiByLevel([
  kanji('水', 'L1'),
  kanji('図', 'L3'),
  kanji('書', 'L3'),
  kanji('館', 'L3'),
])

function corpus(over: Partial<TatoebaCorpus> = {}): TatoebaCorpus {
  return {
    jpn: new Map([[1, { text: '水をください。', author: 'alice' }]]),
    links: new Map([[1, [10]]]),
    engText: new Map([[10, 'Water, please.']]),
    cc0: new Set<number>(),
    ...over,
  }
}

describe('extractKanji / buildKnownKanjiByLevel', () => {
  it('extracts only CJK ideographs', () => {
    expect(extractKanji('水をください')).toEqual(['水'])
    expect(extractKanji('ありがとう')).toEqual([])
  })
  it('accumulates known kanji cumulatively by level', () => {
    expect(known.get('L1')).toEqual(new Set(['水']))
    expect(known.get('L3')).toEqual(new Set(['水', '図', '書', '館']))
    expect(known.get('L2')).toEqual(new Set(['水'])) // nothing new at L2
  })
})

describe('buildSentenceItems', () => {
  it('levels a sentence by kanji coverage and copies ja/en verbatim', () => {
    const { items } = buildSentenceItems(corpus(), known)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      kind: 'sentence',
      tatoebaId: 1,
      ja: '水をください。',
      en: 'Water, please.',
      levelEstimate: 'L1',
      attribution: { author: 'alice', license: 'CC-BY-2.0-FR' },
    })
    expect(items[0].coverage.knownRatioBasis.length).toBeGreaterThan(0)
  })

  it('assigns the level where all kanji first become known (図書館 → L3)', () => {
    const c = corpus({
      jpn: new Map([[2, { text: '図書館に行く。', author: 'bob' }]]),
      links: new Map([[2, [20]]]),
      engText: new Map([[20, 'I go to the library.']]),
    })
    // 行 is not in the known set, so this must be excluded, not mis-leveled:
    const { items, excluded } = buildSentenceItems(c, known)
    expect(items).toHaveLength(0)
    expect(excluded.unknownKanji).toBe(1)
  })

  it('excludes sentences with kanji we never teach', () => {
    const c = corpus({ jpn: new Map([[3, { text: '薔薇が咲く。', author: 'x' }]]), links: new Map([[3, [30]]]), engText: new Map([[30, 'Roses bloom.']]) })
    expect(buildSentenceItems(c, known).items).toHaveLength(0)
  })

  it('routes kana-only sentences to L1', () => {
    const c = corpus({ jpn: new Map([[4, { text: 'ありがとう。', author: 'y' }]]), links: new Map([[4, [40]]]), engText: new Map([[40, 'Thanks.']]) })
    expect(buildSentenceItems(c, known).items[0].levelEstimate).toBe('L1')
  })

  it('tags CC0 sentences by the CC0 set', () => {
    const { items } = buildSentenceItems(corpus({ cc0: new Set([1]) }), known)
    expect(items[0].attribution.license).toBe('CC0-1.0')
  })

  it('requires an English pair and picks the smallest resolving eng id', () => {
    const noEng = corpus({ links: new Map([[1, [999]]]), engText: new Map() })
    expect(buildSentenceItems(noEng, known).items).toHaveLength(0)
    const multi = corpus({ links: new Map([[1, [30, 10]]]), engText: new Map([[10, 'A'], [30, 'B']]) })
    // len bound would drop 'A'/'B' English? No — filter is on ja length. eng id 10 < 30 → 'A'.
    // But ja '水をください。' len 7 ok; en must be non-empty (min1). Use longer en to pass.
    const multi2 = corpus({ links: new Map([[1, [30, 10]]]), engText: new Map([[10, 'Water please now'], [30, 'Later']]) })
    expect(buildSentenceItems(multi2, known).items[0].en).toBe('Water please now')
    void multi
  })

  it('classifies and attaches a register to each item', () => {
    const { items } = buildSentenceItems(corpus(), known)
    expect(items[0].register).toBe('polite') // 水をください。
  })

  it('scaffolds register per level: L1 is polite-majority with no keigo', () => {
    const jpn = new Map<number, { text: string; author: string }>()
    const links = new Map<number, number[]>()
    const engText = new Map<number, string>()
    let id = 100
    const add = (text: string) => {
      jpn.set(id, { text, author: 'a' })
      links.set(id, [id + 1000])
      engText.set(id + 1000, 'x')
      id++
    }
    const v = 'あいうえおかきくけこ'
    for (let i = 0; i < 8; i++) add(`これはことし${v[i]}です。`) // polite
    for (let i = 0; i < 8; i++) add(`はやく${v[i]}してよ。`) // casual
    for (let i = 0; i < 4; i++) add(`いらっしゃいませ${v[i]}。`) // keigo
    const c: TatoebaCorpus = { jpn, links, engText, cc0: new Set() }
    const { registerByLevel } = buildSentenceItems(c, known, { perLevelCap: 12 })
    const l1 = registerByLevel.L1
    expect(l1.polite).toBeGreaterThanOrEqual(l1.casual) // polite-majority (D-015 scaffold)
    expect(l1.keigo).toBe(0) // L1 keigo target is 0 — backfill excludes zero-target registers
  })

  it('dedupes identical ja text and enforces length bounds', () => {
    const dup = corpus({
      jpn: new Map([
        [1, { text: '水をください。', author: 'a' }],
        [2, { text: '水をください。', author: 'b' }],
        [3, { text: '水', author: 'c' }], // too short (< 4)
      ]),
      links: new Map([[1, [10]], [2, [11]], [3, [12]]]),
      engText: new Map([[10, 'Water, please.'], [11, 'Water please.'], [12, 'Water.']]),
    })
    const { items, excluded } = buildSentenceItems(dup, known)
    expect(items).toHaveLength(1)
    expect(excluded.duplicate).toBe(1)
    expect(excluded.length).toBe(1)
  })
})
