import { describe, it, expect } from 'vitest'
import type { ItemState, SceneTemplate, VocabItem } from '@hikkoshi/schemas'
import { buildSceneSteps, pickSlotItem, planBeat } from './sceneRunner'

function vocab(id: string, reading = id): VocabItem {
  return {
    kind: 'vocab',
    id,
    jmdictSeq: 1,
    expression: id,
    reading,
    senses: [{ gloss: ['x'], pos: [] }],
    level: 'L1',
    modules: ['M2_konbini'],
  }
}

function state(id: string, due: number): ItemState {
  return { itemId: id, stage: 1, due, introducedAt: 0, lapses: 0, lastOutcomes: 0 }
}

describe('pickSlotItem', () => {
  const now = 1_000_000

  it('prefers the earliest-due item over known-but-not-due or new items', () => {
    const pool = [vocab('a'), vocab('b'), vocab('c')]
    const states = new Map([
      ['a', state('a', now + 10_000)], // known, not due yet
      ['b', state('b', now - 5_000)], // due
    ])
    expect(pickSlotItem(pool, states, new Set(), now)?.id).toBe('b')
  })

  it('falls back to a known (not-due) item when nothing is due', () => {
    const pool = [vocab('a'), vocab('b')]
    const states = new Map([['a', state('a', now + 10_000)]])
    expect(pickSlotItem(pool, states, new Set(), now, () => 0)?.id).toBe('a')
  })

  it('falls back to a fresh (never-seen) item when nothing is due or known', () => {
    const pool = [vocab('a'), vocab('b')]
    expect(pickSlotItem(pool, new Map(), new Set(), now)?.id).toBe('a')
  })

  it('never repeats an item already used earlier in the same scene run', () => {
    const pool = [vocab('a'), vocab('b')]
    const states = new Map([['a', state('a', now - 1)]]) // 'a' is due
    expect(pickSlotItem(pool, states, new Set(['a']), now)?.id).toBe('b')
  })

  it('returns undefined when the pool is exhausted', () => {
    expect(pickSlotItem([vocab('a')], new Map(), new Set(['a']), now)).toBeUndefined()
  })
})

describe('planBeat', () => {
  it('maps recognize → recognition MC, recall → production MC, neither timed', () => {
    expect(planBeat('recognize', vocab('a'))).toEqual({ render: 'mc', mode: 'recognition', timed: false })
    expect(planBeat('recall', vocab('a'))).toEqual({ render: 'mc', mode: 'production', timed: false })
  })

  it('maps speed → a timed recognition MC (the checkout-barrage stage)', () => {
    expect(planBeat('speed', vocab('a'))).toEqual({ render: 'mc', mode: 'recognition', timed: true })
  })

  it('maps produce → typed reading when the reading is clean hiragana', () => {
    expect(planBeat('produce', vocab('warm', 'あたためる'))).toEqual({ render: 'typed', answer: 'あたためる' })
  })

  it('downgrades produce → production MC for a katakana reading (romaji long-vowels too fiddly, D-013)', () => {
    expect(planBeat('produce', vocab('card', 'カード'))).toEqual({ render: 'mc', mode: 'production', timed: false })
  })
})

describe('buildSceneSteps', () => {
  it('flattens framing into an ordered sequence, splicing in each referenced beat', () => {
    const scene: SceneTemplate = {
      kind: 'scene',
      id: 'scene:test',
      sceneKind: 'konbini',
      level: 'L1',
      modules: ['M2_konbini'],
      beats: [{ id: 'beat:1', interaction: 'recognize', slotIds: ['x'] }],
      framing: [
        { text: 'intro', phraseId: 'p:hello', modelWritten: true },
        { beatId: 'beat:1', text: 'ask', phraseId: 'p:ask', modelWritten: true },
        { text: 'outro', modelWritten: true },
      ],
    }
    const steps = buildSceneSteps(scene)
    expect(steps).toEqual([
      { kind: 'narration', text: 'intro', phraseId: 'p:hello' },
      { kind: 'beat', text: 'ask', phraseId: 'p:ask', beat: scene.beats[0] },
      { kind: 'narration', text: 'outro', phraseId: undefined },
    ])
  })
})
