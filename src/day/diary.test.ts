import { describe, it, expect } from 'vitest'
import type { JournalEntry, SentenceItem, VocabItem } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import { DIARY_MAX_ENTRIES, pickDiaryEntries } from './diary'

const DAY = 86_400_000
const TODAY = 10 * DAY + 12 * 60 * 60 * 1000 // midday of day 10

function vocab(id: string): VocabItem {
  return {
    kind: 'vocab',
    id,
    jmdictSeq: 1,
    expression: id,
    reading: id,
    senses: [{ gloss: [`gloss-${id}`], pos: [] }],
    level: 'L1',
    modules: [],
  }
}

function sentence(id: string, ja: string): SentenceItem {
  return {
    kind: 'sentence',
    id,
    tatoebaId: 1,
    ja,
    en: `en-${id}`,
    attribution: { author: 'x', license: 'CC0-1.0' },
    levelEstimate: 'L1',
    register: 'plain',
    coverage: { knownRatioBasis: 'test' },
  }
}

function content(over: Partial<Content> = {}): Content {
  return {
    vocab: [],
    kanji: [],
    kana: [],
    grammar: [],
    sentences: [],
    phrases: [],
    scenes: [],
    strokesById: new Map(),
    strokesByLiteral: new Map(),
    ...over,
  }
}

function entry(itemId: string, ts: number, sceneId?: string): JournalEntry {
  return { itemId, ts, interaction: 'context', outcome: 'pass', sceneId }
}

describe('pickDiaryEntries', () => {
  it('skips a candidate with zero sentence matches without consuming the cap', () => {
    const c = content({
      vocab: [vocab('v1'), vocab('v2'), vocab('v3')],
      sentences: [sentence('s2', 'ctx-v2-ctx'), sentence('s3', 'ctx-v3-ctx')], // v1 has no match
    })
    const journal = [entry('v1', TODAY), entry('v2', TODAY), entry('v3', TODAY)]
    const picked = pickDiaryEntries(c, journal, TODAY, 2)
    expect(picked.map((e) => e.itemId)).toEqual(['v2', 'v3'])
  })

  it('excludes a reviewed item that is not vocab (e.g. a kanji id)', () => {
    const c = content({ vocab: [vocab('v1')], sentences: [sentence('s1', 'ctx-v1-ctx')] })
    const journal = [entry('k1', TODAY), entry('v1', TODAY)] // 'k1' is a kanji id, absent from content.vocab
    const picked = pickDiaryEntries(c, journal, TODAY)
    expect(picked.map((e) => e.itemId)).toEqual(['v1'])
  })

  it('dedups to one entry per vocab id even when reviewed via both a scene and a plain flashcard today', () => {
    const c = content({ vocab: [vocab('v1')], sentences: [sentence('s1', 'ctx-v1-ctx')] })
    const journal = [entry('v1', TODAY, 'scene:konbini'), entry('v1', TODAY + 1000)]
    const picked = pickDiaryEntries(c, journal, TODAY)
    expect(picked).toHaveLength(1)
    expect(picked[0].itemId).toBe('v1')
  })

  it('excludes items reviewed on a different day', () => {
    const c = content({ vocab: [vocab('v1')], sentences: [sentence('s1', 'ctx-v1-ctx')] })
    const journal = [entry('v1', TODAY - DAY)]
    expect(pickDiaryEntries(c, journal, TODAY)).toEqual([])
  })

  it('breaks a multi-sentence match deterministically — always the first match in content order', () => {
    const c = content({
      vocab: [vocab('v1')],
      sentences: [sentence('first', 'ctx-v1-a'), sentence('second', 'ctx-v1-b')],
    })
    const journal = [entry('v1', TODAY)]
    expect(pickDiaryEntries(c, journal, TODAY)[0].sentenceId).toBe('first')
    expect(pickDiaryEntries(c, journal, TODAY)[0].sentenceId).toBe('first')
  })

  it('produces the same result regardless of the journal array order (defensive internal sort)', () => {
    const c = content({
      vocab: [vocab('v1'), vocab('v2')],
      sentences: [sentence('s1', 'ctx-v1-ctx'), sentence('s2', 'ctx-v2-ctx')],
    })
    const forward = [entry('v1', TODAY), entry('v2', TODAY + 1)]
    const reversed = [entry('v2', TODAY + 1), entry('v1', TODAY)]
    expect(pickDiaryEntries(c, forward, TODAY)).toEqual(pickDiaryEntries(c, reversed, TODAY))
  })

  it('caps at DIARY_MAX_ENTRIES by default', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `v${i}`)
    const c = content({
      vocab: ids.map(vocab),
      sentences: ids.map((id) => sentence(`s-${id}`, `ctx-${id}-ctx`)),
    })
    const journal = ids.map((id) => entry(id, TODAY))
    expect(pickDiaryEntries(c, journal, TODAY)).toHaveLength(DIARY_MAX_ENTRIES)
  })
})
