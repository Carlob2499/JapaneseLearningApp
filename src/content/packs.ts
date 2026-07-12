import {
  Pack,
  type Item,
  type KanjiItem,
  type Level,
  type SentenceItem,
  type StrokeItem,
  type VocabItem,
} from '@hikkoshi/schemas'
import manifest from '../../content/packs/manifest.json'

/** Merged, validated content for one or more levels — the shape the review loop consumes. */
export interface Content {
  vocab: VocabItem[]
  kanji: KanjiItem[]
  sentences: SentenceItem[]
  /** Stroke data keyed by KanjiVG id, for the KanjiItem.strokes.kanjivgId join. */
  strokesById: Map<string, StrokeItem>
}

/**
 * L1 packs are bundled via explicit static imports so Rollup code-splits them into
 * precached async chunks — L1 works offline from first install. Higher levels are fetched
 * (below) and runtime-cached, so first load stays light.
 */
const L1_IMPORTS: Array<() => Promise<{ default: unknown }>> = [
  () => import('../../content/packs/l1/vocab.json'),
  () => import('../../content/packs/l1/kanji.json'),
  () => import('../../content/packs/l1/sentence.json'),
  () => import('../../content/packs/l1/strokes.json'),
]

/** Validate a pack payload against the shared schema (D-002 enforced at runtime). */
function parsePack(data: unknown): Item[] {
  return Pack.parse(data).items
}

/** Fetch a higher-level pack as static JSON (served at ${BASE}packs/…; runtime-cached). */
async function fetchPack(path: string): Promise<Item[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}packs/${path}`)
  if (!res.ok) throw new Error(`Could not load pack ${path} (HTTP ${res.status})`)
  return parsePack(await res.json())
}

/** All items for one level (across its four domains). */
async function loadLevelItems(level: Level): Promise<Item[]> {
  if (level === 'L1') {
    const arrs = await Promise.all(L1_IMPORTS.map(async (imp) => parsePack((await imp()).default)))
    return arrs.flat()
  }
  const entries = manifest.packs.filter((p) => p.level === level)
  const arrs = await Promise.all(entries.map((e) => fetchPack(e.path)))
  return arrs.flat()
}

/**
 * Load and merge the given levels into one content set. Throws if a fetched level can't be
 * reached (offline before its first download) — the caller surfaces that to the user.
 */
export async function loadLevels(levels: Level[]): Promise<Content> {
  const all = (await Promise.all(levels.map(loadLevelItems))).flat()
  const strokes = all.filter((i): i is StrokeItem => i.kind === 'strokes')
  return {
    vocab: all.filter((i): i is VocabItem => i.kind === 'vocab'),
    kanji: all.filter((i): i is KanjiItem => i.kind === 'kanji'),
    sentences: all.filter((i): i is SentenceItem => i.kind === 'sentence'),
    strokesById: new Map(strokes.map((x) => [x.kanjivgId, x])),
  }
}

/** Load the L1 (≈N5) content packs — the always-available default. */
export async function loadL1(): Promise<Content> {
  return loadLevels(['L1'])
}
