import { describe, it, expect } from 'vitest'
import type { VocabItem } from '@hikkoshi/schemas'
import { applyModuleTags } from './moduleTags'

function vocab(expression: string, reading: string, modules: VocabItem['modules'] = []): VocabItem {
  return {
    kind: 'vocab',
    id: `vocab:${expression}`,
    jmdictSeq: 1,
    expression,
    reading,
    senses: [{ gloss: ['x'], pos: [] }],
    level: 'L1',
    modules,
  }
}

describe('applyModuleTags', () => {
  it('tags a matching expression+reading and dedupes against existing modules', () => {
    const { items, matched, unmatched } = applyModuleTags(
      [vocab('店', 'みせ'), vocab('水', 'みず')],
      [{ expression: '店', reading: 'みせ', tags: ['M2_konbini'] }],
    )
    expect(items[0].modules).toEqual(['M2_konbini'])
    expect(items[1].modules).toEqual([]) // untouched
    expect(matched).toBe(1)
    expect(unmatched).toHaveLength(0)
  })

  it('never drops or fabricates a match — an unresolved curated entry is reported', () => {
    const { items, unmatched } = applyModuleTags(
      [vocab('店', 'みせ')],
      [{ expression: '弁当', reading: 'べんとう', tags: ['M2_konbini'] }],
    )
    expect(items[0].modules).toEqual([]) // no accidental tag on the wrong item
    expect(unmatched).toEqual([{ expression: '弁当', reading: 'べんとう', tags: ['M2_konbini'] }])
  })

  it('preserves item order and merges tags without duplicating an already-present module', () => {
    const { items } = applyModuleTags(
      [vocab('店', 'みせ', ['M2_konbini'])],
      [{ expression: '店', reading: 'みせ', tags: ['M2_konbini', 'M7_keigo'] }],
    )
    expect(items[0].modules).toEqual(['M2_konbini', 'M7_keigo'])
  })
})
