import { describe, it, expect } from 'vitest'
import type { ItemState, Level, VocabItem } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import { LIFE_STAGE_NAMES, computeLifeStage } from './lifeStage'

const LEVELS: Level[] = ['L1', 'L2', 'L3', 'L4', 'L5']

function vocabPool(level: Level, count: number): VocabItem[] {
  return Array.from({ length: count }, (_, i) => ({
    kind: 'vocab',
    id: `${level}:${i}`,
    jmdictSeq: i,
    expression: `${level}:${i}`,
    reading: `${level}:${i}`,
    senses: [{ gloss: ['x'], pos: [] }],
    level,
    modules: [],
  }))
}

function content(vocab: VocabItem[]): Content {
  return { vocab, kanji: [], grammar: [], sentences: [], phrases: [], scenes: [], strokesById: new Map() }
}

function stateFor(id: string): ItemState {
  return { itemId: id, stage: 1, due: 0, introducedAt: 0, lapses: 0, lastOutcomes: 0 }
}

function statesFor(items: VocabItem[]): ItemState[] {
  return items.map((v) => stateFor(v.id))
}

describe('computeLifeStage', () => {
  it('does not clear a level at 0% coverage', () => {
    const c = content(vocabPool('L1', 100))
    const stage = computeLifeStage(c, [], LEVELS)
    expect(stage.coverageByLevel[0].cleared).toBe(false)
    expect(stage.stage).toBe(0)
    expect(stage.name).toBe('Tourist')
  })

  it('does not clear a level at 69% coverage — just under threshold', () => {
    const pool = vocabPool('L1', 100)
    const c = content(pool)
    const stage = computeLifeStage(c, statesFor(pool.slice(0, 69)), LEVELS)
    expect(stage.coverageByLevel[0].ratio).toBeCloseTo(0.69)
    expect(stage.coverageByLevel[0].cleared).toBe(false)
    expect(stage.stage).toBe(0)
  })

  it('clears a level at exactly 70% coverage — threshold is inclusive', () => {
    const pool = vocabPool('L1', 100)
    const c = content(pool)
    const stage = computeLifeStage(c, statesFor(pool.slice(0, 70)), LEVELS)
    expect(stage.coverageByLevel[0].cleared).toBe(true)
    expect(stage.stage).toBe(1)
    expect(stage.name).toBe('Resident')
  })

  it('clears a level at 100% coverage', () => {
    const pool = vocabPool('L1', 100)
    const c = content(pool)
    const stage = computeLifeStage(c, statesFor(pool), LEVELS)
    expect(stage.coverageByLevel[0].cleared).toBe(true)
    expect(stage.stage).toBe(1)
  })

  it('caps stage at the contiguous cleared prefix — a gap is not skipped over', () => {
    const pools = LEVELS.map((l) => vocabPool(l, 100))
    const c = content(pools.flat())
    // L1, L2 fully covered; L3 at 0%; L4 fully covered too — must not count past the L3 gap.
    const states = statesFor([...pools[0], ...pools[1], ...pools[3]])
    const stage = computeLifeStage(c, states, LEVELS)
    expect(stage.levelsCleared).toEqual(['L1', 'L2'])
    expect(stage.stage).toBe(2)
    expect(stage.name).toBe('Part-timer')
    expect(stage.next?.level).toBe('L3')
    expect(stage.next?.cleared).toBe(false)
    // L4's own coverage is still reported, even though it doesn't count toward stage.
    expect(stage.coverageByLevel.find((cov) => cov.level === 'L4')?.cleared).toBe(true)
  })

  it('treats an empty/unloaded pool as not cleared, never a vacuous 100%', () => {
    const c = content([])
    const stage = computeLifeStage(c, [], LEVELS)
    expect(stage.coverageByLevel[0]).toMatchObject({ total: 0, ratio: 0, cleared: false })
    expect(stage.stage).toBe(0)
  })

  it('scopes the walk to only the caller-supplied levels', () => {
    const pools = [vocabPool('L1', 100), vocabPool('L2', 100)]
    const c = content(pools.flat())
    const stage = computeLifeStage(c, statesFor(pools.flat()), ['L1'])
    expect(stage.coverageByLevel).toHaveLength(1)
    expect(stage.coverageByLevel[0].level).toBe('L1')
    expect(stage.levelsCleared).toEqual(['L1'])
    expect(stage.stage).toBe(1)
  })

  it('accepts an overridable threshold', () => {
    const pool = vocabPool('L1', 100)
    const c = content(pool)
    const states = statesFor(pool.slice(0, 50))
    expect(computeLifeStage(c, states, LEVELS).coverageByLevel[0].cleared).toBe(false)
    expect(computeLifeStage(c, states, LEVELS, 0.5).coverageByLevel[0].cleared).toBe(true)
  })

  it('accepts a Map of states as well as an array', () => {
    const pool = vocabPool('L1', 100)
    const c = content(pool)
    const map = new Map(pool.slice(0, 70).map((v) => [v.id, stateFor(v.id)]))
    expect(computeLifeStage(c, map, LEVELS).coverageByLevel[0].cleared).toBe(true)
  })

  it('clamps at the top named stage when every level is cleared', () => {
    const pools = LEVELS.map((l) => vocabPool(l, 100))
    const c = content(pools.flat())
    const stage = computeLifeStage(c, statesFor(pools.flat()), LEVELS)
    expect(stage.levelsCleared).toEqual(LEVELS)
    expect(stage.stage).toBe(LIFE_STAGE_NAMES.length - 1)
    expect(stage.name).toBe('You handle it for someone else.')
    expect(stage.next).toBeUndefined()
  })
})
