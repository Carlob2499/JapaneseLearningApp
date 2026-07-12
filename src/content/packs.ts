import {
  Pack,
  type Item,
  type KanjiItem,
  type SentenceItem,
  type StrokeItem,
  type VocabItem,
} from '@hikkoshi/schemas'

/** Validate an imported pack module against the shared schema (D-002 at runtime). */
async function loadPack(mod: Promise<{ default: unknown }>): Promise<Item[]> {
  return Pack.parse((await mod).default).items
}

export interface L1Content {
  vocab: VocabItem[]
  kanji: KanjiItem[]
  sentences: SentenceItem[]
  /** Stroke data keyed by KanjiVG id, for the KanjiItem.strokes.kanjivgId join. */
  strokesById: Map<string, StrokeItem>
}

/**
 * Load the L1 (≈N5) content packs. Explicit per-file dynamic imports so Rollup
 * code-splits only these into precached async chunks (not all levels).
 */
export async function loadL1(): Promise<L1Content> {
  const [v, k, s, st] = await Promise.all([
    loadPack(import('../../content/packs/l1/vocab.json')),
    loadPack(import('../../content/packs/l1/kanji.json')),
    loadPack(import('../../content/packs/l1/sentence.json')),
    loadPack(import('../../content/packs/l1/strokes.json')),
  ])
  const strokes = st.filter((i): i is StrokeItem => i.kind === 'strokes')
  return {
    vocab: v.filter((i): i is VocabItem => i.kind === 'vocab'),
    kanji: k.filter((i): i is KanjiItem => i.kind === 'kanji'),
    sentences: s.filter((i): i is SentenceItem => i.kind === 'sentence'),
    strokesById: new Map(strokes.map((x) => [x.kanjivgId, x])),
  }
}
