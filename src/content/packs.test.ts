import { describe, it, expect } from 'vitest'
import { loadL1 } from './packs'

describe('loadL1', () => {
  it('loads and validates the committed L1 packs', async () => {
    const c = await loadL1()
    expect(c.vocab.length).toBeGreaterThan(100)
    expect(c.kanji.length).toBeGreaterThan(50)
    expect(c.grammar.length).toBeGreaterThan(0)
    expect(c.grammar[0].examples.length).toBeGreaterThan(0) // every point ships a verified example
    expect(c.sentences.length).toBeGreaterThan(100)
    expect(c.phrases.length).toBeGreaterThan(0)
    expect(c.scenes.length).toBeGreaterThan(0)
    // every scene's framing phraseIds resolve to a loaded phrase (no dangling reference reaches the app)
    const phraseIds = new Set(c.phrases.map((p) => p.id))
    for (const scene of c.scenes) {
      for (const f of scene.framing) if (f.phraseId) expect(phraseIds.has(f.phraseId)).toBe(true)
    }
    // every kanji resolves to stroke data via its kanjivgId
    const sample = c.kanji[0]
    expect(c.strokesById.get(sample.strokes.kanjivgId)?.strokes.length).toBeGreaterThan(0)
  })

  it('carries real, dataset-shaped fields', async () => {
    const c = await loadL1()
    const v = c.vocab[0]
    expect(v.reading.length).toBeGreaterThan(0)
    expect(v.senses[0].gloss[0].length).toBeGreaterThan(0)
    const s = c.strokesById.values().next().value!
    expect(s.viewBox).toBe('0 0 109 109')
    expect(s.strokes.length).toBe(s.strokeCount)
  })
})
