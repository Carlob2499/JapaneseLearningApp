import { describe, it, expect } from 'vitest'
import type { ItemState, ModuleTag, SceneTemplate, VocabItem } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import {
  MODULE_UNLOCK_THRESHOLD,
  isModuleUnlocked,
  isSceneUnlocked,
  moduleCoverage,
  sceneMeetsStage,
  type ModuleCoverage,
} from './moduleUnlock'

function vocab(id: string, modules: ModuleTag[]): VocabItem {
  return {
    kind: 'vocab',
    id,
    jmdictSeq: 1,
    expression: id,
    reading: id,
    senses: [{ gloss: ['x'], pos: [] }],
    level: 'L1',
    modules,
  }
}

function content(vocab: VocabItem[]): Content {
  return { vocab, kanji: [], kana: [], grammar: [], sentences: [], phrases: [], scenes: [], strokesById: new Map(), strokesByLiteral: new Map() }
}

function stateFor(id: string): ItemState {
  return { itemId: id, stage: 1, due: 0, introducedAt: 0, lapses: 0, lastOutcomes: 0 }
}

function scene(id: string, modules: ModuleTag[]): SceneTemplate {
  return {
    kind: 'scene',
    id,
    sceneKind: 'konbini',
    level: 'L1',
    modules,
    beats: [{ id: 'b1', interaction: 'recognize', slotIds: ['s1'] }],
    framing: [{ text: 'x', modelWritten: true }],
  }
}

describe('moduleCoverage', () => {
  it('is 0/0 for a module with no tagged vocab in loaded content', () => {
    expect(moduleCoverage(content([]), [], 'M3_transit')).toMatchObject({ covered: 0, total: 0, ratio: 0 })
  })

  it('counts only vocab tagged with the given module', () => {
    const c = content([vocab('a', ['M2_konbini']), vocab('b', ['M3_transit']), vocab('c', ['M2_konbini'])])
    expect(moduleCoverage(c, [stateFor('a')], 'M2_konbini')).toMatchObject({ covered: 1, total: 2, ratio: 0.5 })
  })
})

describe('isModuleUnlocked', () => {
  it('guarantees konbini is unlocked at zero coverage (threshold 0)', () => {
    expect(MODULE_UNLOCK_THRESHOLD.M2_konbini).toBe(0)
    const cov: ModuleCoverage = { module: 'M2_konbini', covered: 0, total: 40, ratio: 0 }
    expect(isModuleUnlocked(cov, 'M2_konbini')).toBe(true)
  })

  it('defaults a module absent from the config map to unlocked', () => {
    const cov: ModuleCoverage = { module: 'M3_transit', covered: 0, total: 40, ratio: 0 }
    expect(isModuleUnlocked(cov, 'M3_transit')).toBe(true)
  })

  it('honors a nonzero threshold at its exact boundary', () => {
    const under: ModuleCoverage = { module: 'M3_transit', covered: 29, total: 100, ratio: 0.29 }
    const at: ModuleCoverage = { module: 'M3_transit', covered: 30, total: 100, ratio: 0.3 }
    expect(isModuleUnlocked(under, 'M3_transit', 0.3)).toBe(false)
    expect(isModuleUnlocked(at, 'M3_transit', 0.3)).toBe(true)
  })
})

describe('isSceneUnlocked', () => {
  it('unlocks a single-module scene when its module is unlocked', () => {
    expect(isSceneUnlocked(content([]), [], scene('s1', ['M2_konbini']))).toBe(true)
  })

  it('conjunctive AND: either tagged module still locked blocks the whole scene', () => {
    const thresholds = { M2_konbini: 0, M3_transit: 0.5 }
    const twoModuleScene = scene('s1', ['M2_konbini', 'M3_transit'])
    // M2 unlocked (threshold 0), M3 locked (0% coverage < 50%) -> overall locked.
    expect(isSceneUnlocked(content([]), [], twoModuleScene, thresholds)).toBe(false)
    // Give M3 full coverage -> both clear -> overall unlocked.
    const covered = content([vocab('t1', ['M3_transit'])])
    expect(isSceneUnlocked(covered, [stateFor('t1')], twoModuleScene, thresholds)).toBe(true)
  })

  it('conjunctive AND holds regardless of which module is the one missing coverage', () => {
    const thresholds = { M2_konbini: 0.5, M3_transit: 0 }
    const twoModuleScene = scene('s1', ['M2_konbini', 'M3_transit'])
    // M3 unlocked (threshold 0), M2 locked (0% coverage < 50%) -> still overall locked.
    expect(isSceneUnlocked(content([]), [], twoModuleScene, thresholds)).toBe(false)
  })
})

describe('sceneMeetsStage (D-030 life-stage gate)', () => {
  it('is always available with no minStage', () => {
    const s = scene('open', ['M2_konbini'])
    expect(sceneMeetsStage(s, 0)).toBe(true)
    expect(sceneMeetsStage(s, 5)).toBe(true)
  })

  it('gates a minStage scene until the learner reaches that stage', () => {
    const shift = { ...scene('clerk', ['M2_konbini']), minStage: 2 }
    expect(sceneMeetsStage(shift, 0)).toBe(false) // Tourist
    expect(sceneMeetsStage(shift, 1)).toBe(false) // Resident — has the job but not started
    expect(sceneMeetsStage(shift, 2)).toBe(true) // Part-timer — the shift opens
    expect(sceneMeetsStage(shift, 4)).toBe(true)
  })
})
