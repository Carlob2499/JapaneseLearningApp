import { describe, it, expect } from 'vitest'
import type { KanjiItem } from '@hikkoshi/schemas'
import { buildKnownKanjiByLevel, type TatoebaCorpus } from './sentences'
import { linkExamples, type CuratedGrammarPoint } from './grammar'

function kanji(literal: string, level: KanjiItem['level']): KanjiItem {
  return { kind: 'kanji', id: `kanji:${literal}`, literal, level, strokes: { kanjivgId: '0' }, readingsOn: [], readingsKun: [], meanings: ['x'] }
}
// L1 knows 水; 図 only at L3.
const known = buildKnownKanjiByLevel([kanji('水', 'L1'), kanji('図', 'L3')])

function corpus(rows: [number, string, string][]): TatoebaCorpus {
  const jpn = new Map<number, { text: string; author: string }>()
  const links = new Map<number, number[]>()
  const engText = new Map<number, string>()
  for (const [id, ja, en] of rows) {
    jpn.set(id, { text: ja, author: 'a' })
    links.set(id, [id + 1000])
    engText.set(id + 1000, en)
  }
  return { jpn, links, engText, cc0: new Set() }
}

function point(id: string, patterns: string[], level: CuratedGrammarPoint['level'] = 'L1'): CuratedGrammarPoint {
  return {
    kind: 'grammar', id, name: id, level, gloss: 'g', summary: 's',
    citations: [{ name: 'x', url: 'https://x', retrieved: '2026-07-13', license: 'ref' }],
    patterns,
  }
}

describe('linkExamples', () => {
  it('attaches only verbatim sentences that contain a pattern, as embedded examples', () => {
    const c = corpus([
      [1, 'ここでたべてもいいですか。', 'May I eat here?'],
      [2, 'これはペンです。', 'This is a pen.'],
    ])
    const { items } = linkExamples([point('p', ['てもいい'])], c, known)
    expect(items).toHaveLength(1)
    expect(items[0].examples).toHaveLength(1)
    expect(items[0].examples[0].ja).toBe('ここでたべてもいいですか。')
    expect(items[0].examples[0].ja).toContain('てもいい') // verbatim, contains the pattern
    expect(items[0].examples[0].en).toBe('May I eat here?')
    // patterns ship on the runtime item too (D-036 needs them for cloze-blanking)
    expect(items[0].patterns).toEqual(['てもいい'])
  })

  it('holds back a point with no matching example (never ships example-less)', () => {
    const c = corpus([[1, 'これはペンです。', 'This is a pen.']])
    const { items, shortfalls } = linkExamples([point('none', ['なければならない'])], c, known)
    expect(items).toHaveLength(0)
    expect(shortfalls.map((s) => s.id)).toEqual(['none'])
  })

  it('excludes examples above the point level (kanji-coverage readability)', () => {
    // 図 is only known at L3, so this sentence is an L3 sentence — off-limits for an L1 point.
    const c = corpus([[1, '図をみてもいいです。', 'You may look at the drawing.']])
    const { items, shortfalls } = linkExamples([point('p', ['てもいい'], 'L1')], c, known)
    expect(items).toHaveLength(0)
    expect(shortfalls).toHaveLength(1)
    // ...but the same point at L3 can use it.
    const l3 = linkExamples([point('p3', ['てもいい'], 'L3')], c, known)
    expect(l3.items[0].examples[0].ja).toBe('図をみてもいいです。')
  })
})
