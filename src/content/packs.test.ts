import { describe, it, expect } from 'vitest'
import { loadL1 } from './packs'

describe('loadL1', () => {
  it('loads and validates the committed L1 packs', async () => {
    const c = await loadL1()
    expect(c.vocab.length).toBeGreaterThan(100)
    expect(c.kanji.length).toBeGreaterThan(50)
    expect(c.sentences.length).toBeGreaterThan(100)
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
