import { describe, it, expect } from 'vitest'
import type {
  GrammarPoint,
  KanjiItem,
  PhraseTemplate,
  SceneTemplate,
  SentenceItem,
  VocabItem,
} from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import { reviewablePoolCount, reviewablePoolIds } from './appMeta'

function vocab(id: string, level: VocabItem['level']): VocabItem {
  return {
    kind: 'vocab',
    id,
    jmdictSeq: 1,
    expression: id,
    reading: id,
    senses: [{ gloss: ['x'], pos: [] }],
    level,
    modules: [],
  }
}

function kanji(id: string, level: KanjiItem['level']): KanjiItem {
  return { kind: 'kanji', id, literal: id, level, strokes: { kanjivgId: '0' }, readingsOn: [], readingsKun: [], meanings: ['x'] }
}

function grammar(id: string, level: GrammarPoint['level']): GrammarPoint {
  return {
    kind: 'grammar',
    id,
    name: id,
    level,
    gloss: 'g',
    summary: 's',
    citations: [{ name: 'x', url: 'https://x', retrieved: '2026-07-13', license: 'ref' }],
    examples: [{ ja: 'x', en: 'x', tatoebaId: 1, attribution: { author: 'x', license: 'CC-BY-2.0-FR' } }],
  }
}

function sentence(id: string, levelEstimate: SentenceItem['levelEstimate']): SentenceItem {
  return {
    kind: 'sentence',
    id,
    tatoebaId: 1,
    ja: 'x',
    en: 'x',
    attribution: { author: 'x', license: 'CC-BY-2.0-FR' },
    levelEstimate,
    register: 'plain',
    coverage: { knownRatioBasis: 'test' },
  }
}

function phrase(id: string, level: PhraseTemplate['level']): PhraseTemplate {
  return {
    kind: 'phrase',
    id,
    level,
    module: 'M2_konbini',
    register: 'polite',
    pattern: 'x',
    citations: [{ name: 'x', url: 'https://x', retrieved: '2026-07-13', license: 'ref' }],
  }
}

function scene(id: string, level: SceneTemplate['level']): SceneTemplate {
  return {
    kind: 'scene',
    id,
    sceneKind: 'konbini',
    level,
    modules: ['M2_konbini'],
    beats: [{ id: 'b1', interaction: 'recognize', slotIds: ['s1'] }],
    framing: [{ text: 'x', modelWritten: true }],
  }
}

function content(over: Partial<Content> = {}): Content {
  return {
    vocab: [],
    kanji: [],
    grammar: [],
    sentences: [],
    phrases: [],
    scenes: [],
    strokesById: new Map(),
    ...over,
  }
}

describe('reviewablePoolIds / reviewablePoolCount', () => {
  it('counts vocab+kanji+grammar+sentence only — phrase and scene never contribute', () => {
    const c = content({
      vocab: [vocab('v1', 'L1'), vocab('v2', 'L2')],
      kanji: [kanji('k1', 'L1')],
      grammar: [grammar('g1', 'L1')],
      sentences: [sentence('s1', 'L1')],
      phrases: [phrase('p1', 'L1')],
      scenes: [scene('sc1', 'L1')],
    })
    expect(reviewablePoolIds(c, 'L1').sort()).toEqual(['g1', 'k1', 's1', 'v1'].sort())
    expect(reviewablePoolCount(c, 'L1')).toBe(4) // not 6 — phrase/scene excluded
  })

  it('reads sentence level from levelEstimate, not level (regression: sentence has no .level field)', () => {
    const c = content({ sentences: [sentence('s1', 'L3')] })
    expect(reviewablePoolIds(c, 'L3')).toEqual(['s1'])
    expect(reviewablePoolIds(c, 'L1')).toEqual([])
  })

  it('returns an empty pool for a level with no matching items in loaded content', () => {
    const c = content({ vocab: [vocab('v1', 'L1')] })
    expect(reviewablePoolIds(c, 'L5')).toEqual([])
    expect(reviewablePoolCount(c, 'L5')).toBe(0)
  })
})
