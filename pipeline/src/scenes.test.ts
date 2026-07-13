import { describe, it, expect } from 'vitest'
import type { PhraseTemplate, SceneTemplate } from '@hikkoshi/schemas'
import { validateSceneReferences } from './scenes'

function phrase(id: string): PhraseTemplate {
  return {
    kind: 'phrase',
    id,
    level: 'L1',
    module: 'M2_konbini',
    register: 'service_script',
    pattern: 'いらっしゃいませ。',
    citations: [{ name: 'x', url: 'https://x', retrieved: '2026-07-13', license: 'ref' }],
  }
}

function scene(phraseId: string): SceneTemplate {
  return {
    kind: 'scene',
    id: 'scene:l1:konbini',
    sceneKind: 'konbini',
    level: 'L1',
    modules: ['M2_konbini'],
    beats: [{ id: 'beat:1', interaction: 'recognize', slotIds: ['item-1'] }],
    framing: [{ beatId: 'beat:1', phraseId, text: 'x', modelWritten: true }],
  }
}

describe('validateSceneReferences', () => {
  it('accepts a scene whose framing phraseId resolves to a real cited phrase', () => {
    expect(() => validateSceneReferences([scene('phrase:m2:irasshaimase')], [phrase('phrase:m2:irasshaimase')])).not.toThrow()
  })

  it('rejects a scene with a dangling phraseId reference (never silently drop it)', () => {
    expect(() => validateSceneReferences([scene('phrase:missing')], [phrase('phrase:m2:irasshaimase')])).toThrow(
      /unknown phrase/,
    )
  })
})
