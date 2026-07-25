import { describe, it, expect } from 'vitest'
import type { KanjiItem, Level, SentenceItem, VocabItem } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import { placementSeeds, SEED_SPREAD_DAYS, SEED_STAGE } from './seed'
import { reviewablePoolIds } from '../lib/appMeta'

const DAY = 24 * 3_600_000

function vocab(id: string, level: Level): VocabItem {
  return { kind: 'vocab', id, jmdictSeq: 1, expression: id, reading: 'か', senses: [{ gloss: ['g'], pos: [] }], level, modules: [] }
}
function kanji(id: string, level: Level): KanjiItem {
  return { kind: 'kanji', id, literal: id, level, strokes: { kanjivgId: '0' }, readingsOn: [], readingsKun: [], meanings: ['m'] }
}
function sentence(id: string, levelEstimate: Level): SentenceItem {
  return {
    kind: 'sentence', id, tatoebaId: 1, ja: 'あ', en: 'a',
    attribution: { author: 'x', license: 'CC-BY-2.0-FR' }, levelEstimate, register: 'plain',
    coverage: { knownRatioBasis: 'x' },
  }
}
const content: Content = {
  vocab: [vocab('v-l1', 'L1'), vocab('v-l2', 'L2'), vocab('v-l3', 'L3')],
  kanji: [kanji('k-l1', 'L1'), kanji('k-l2', 'L2')],
  kana: [
    { kind: 'kana', id: 'kana:あ', char: 'あ', script: 'hiragana', romaji: 'a', row: 'a', kanjivgIds: ['03042'], level: 'L0' },
  ],
  grammar: [],
  sentences: [sentence('s-l1', 'L1')],
  phrases: [], scenes: [], strokesById: new Map(), strokesByLiteral: new Map(),
}
const now = 1_000_000_000_000

describe('placementSeeds', () => {
  it('seeds nothing for L0 (unplaced — start at the beginning)', () => {
    expect(placementSeeds(content, 'L0', now)).toEqual([])
  })

  it('seeds exactly the reviewable pool up to and including the placed level, plus L0 kana', () => {
    const seeds = placementSeeds(content, 'L2', now)
    const ids = new Set(seeds.map((s) => s.itemId))
    const expected = new Set([
      ...reviewablePoolIds(content, 'L0'),
      ...reviewablePoolIds(content, 'L1'),
      ...reviewablePoolIds(content, 'L2'),
    ])
    expect(ids).toEqual(expected)
    expect(seeds).toHaveLength(expected.size)
    // A placed learner reads kana — the syllabary is provisionally known too (D-023).
    expect(ids.has('kana:あ')).toBe(true)
    // L3 is above the placement — not seeded (it becomes the learning frontier).
    expect(ids.has('v-l3')).toBe(false)
  })

  it('marks every seed provisional at the seed stage (a real, confirmable ItemState)', () => {
    for (const s of placementSeeds(content, 'L3', now)) {
      expect(s.provisional).toBe(true)
      expect(s.stage).toBe(SEED_STAGE)
      expect(s.lapses).toBe(0)
      expect(s.introducedAt).toBe(now)
    }
  })

  it('spreads due dates across the confirm window so the load-shaper is not flooded', () => {
    const seeds = placementSeeds(content, 'L3', now)
    for (const s of seeds) {
      expect(s.due).toBeGreaterThanOrEqual(now)
      expect(s.due).toBeLessThanOrEqual(now + (SEED_SPREAD_DAYS - 1) * DAY)
    }
    // With more than one item, they don't all land on the same day.
    expect(new Set(seeds.map((s) => s.due)).size).toBeGreaterThan(1)
  })
})
