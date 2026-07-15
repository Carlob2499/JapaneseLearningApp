import { describe, it, expect } from 'vitest'
import type { KanjiItem, Level, VocabItem } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import { probeCandidates } from './difficulty'

function kanji(id: string, level: Level, grade?: number, freq?: number): KanjiItem {
  return {
    kind: 'kanji', id, literal: id, level, grade, freq,
    strokes: { kanjivgId: '00000' }, readingsOn: [], readingsKun: [], meanings: ['m'],
  }
}
function vocab(id: string, level: Level): VocabItem {
  return { kind: 'vocab', id, jmdictSeq: 1, expression: id, reading: 'か', senses: [{ gloss: ['g'], pos: [] }], level, modules: [] }
}
function content(kanjiItems: KanjiItem[], vocabItems: VocabItem[]): Content {
  return { vocab: vocabItems, kanji: kanjiItems, grammar: [], sentences: [], phrases: [], scenes: [], strokesById: new Map() }
}

describe('probeCandidates', () => {
  it('filters to the requested band, kanji before vocab', () => {
    const c = content([kanji('k1', 'L1'), kanji('kL2', 'L2')], [vocab('v1', 'L1'), vocab('vL2', 'L2')])
    const got = probeCandidates(c, 'L1').map((p) => `${p.kind}:${p.id}`)
    expect(got).toEqual(['kanji:k1', 'vocab:v1']) // L2 items excluded, kanji leads
  })

  it('orders kanji by grade then frequency rank (earliest-taught, most-common first)', () => {
    const c = content(
      [kanji('late', 'L1', 3, 500), kanji('common', 'L1', 1, 10), kanji('early-rare', 'L1', 1, 900)],
      [],
    )
    // grade 1 before grade 3; within grade 1, lower freq rank (more common) first.
    expect(probeCandidates(c, 'L1').map((p) => p.id)).toEqual(['common', 'early-rare', 'late'])
  })

  it('sorts missing grade/freq last rather than crashing', () => {
    const c = content([kanji('graded', 'L1', 2, 100), kanji('ungraded', 'L1')], [])
    expect(probeCandidates(c, 'L1').map((p) => p.id)).toEqual(['graded', 'ungraded'])
  })
})
