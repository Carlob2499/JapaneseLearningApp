import {
  Classbook,
  Pack,
  type GrammarPoint,
  type Item,
  type KanaItem,
  type KanjiItem,
  type Level,
  type PhraseTemplate,
  type SceneTemplate,
  type SentenceItem,
  type StrokeItem,
  type VocabItem,
} from '@hikkoshi/schemas'
import manifest from '../../content/packs/manifest.json'

/** Merged, validated content for one or more levels — the shape the review loop consumes. */
export interface Content {
  vocab: VocabItem[]
  kanji: KanjiItem[]
  kana: KanaItem[]
  grammar: GrammarPoint[]
  sentences: SentenceItem[]
  phrases: PhraseTemplate[]
  scenes: SceneTemplate[]
  /** Stroke data keyed by KanjiVG id, for the KanjiItem.strokes.kanjivgId join. */
  strokesById: Map<string, StrokeItem>
  /** Stroke data keyed by the literal glyph (D-037) — for classbook kanji weeks, which name
   *  their six characters directly rather than through a KanjiItem/kanjivgId join. */
  strokesByLiteral: Map<string, StrokeItem>
}

/**
 * L1 packs are bundled via explicit static imports so Rollup code-splits them into
 * precached async chunks — L1 works offline from first install. Higher levels are fetched
 * (below) and runtime-cached, so first load stays light.
 */
const L1_IMPORTS: Array<() => Promise<{ default: unknown }>> = [
  () => import('../../content/packs/l1/vocab.json'),
  () => import('../../content/packs/l1/kanji.json'),
  () => import('../../content/packs/l1/grammar.json'),
  () => import('../../content/packs/l1/sentence.json'),
  () => import('../../content/packs/l1/strokes.json'),
  () => import('../../content/packs/l1/phrase.json'),
  () => import('../../content/packs/l1/scene.json'),
]

/** L0 kana packs are bundled/precached like L1 — a zero-beginner is a first install (D-023). */
const L0_IMPORTS: Array<() => Promise<{ default: unknown }>> = [
  () => import('../../content/packs/l0/kana.json'),
  () => import('../../content/packs/l0/strokes.json'),
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

/** All items for one level (across its domains). */
async function loadLevelItems(level: Level): Promise<Item[]> {
  const bundled = level === 'L0' ? L0_IMPORTS : level === 'L1' ? L1_IMPORTS : null
  if (bundled) {
    const arrs = await Promise.all(bundled.map(async (imp) => parsePack((await imp()).default)))
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
    kana: all.filter((i): i is KanaItem => i.kind === 'kana'),
    grammar: all.filter((i): i is GrammarPoint => i.kind === 'grammar'),
    sentences: all.filter((i): i is SentenceItem => i.kind === 'sentence'),
    phrases: all.filter((i): i is PhraseTemplate => i.kind === 'phrase'),
    scenes: all.filter((i): i is SceneTemplate => i.kind === 'scene'),
    strokesById: new Map(strokes.map((x) => [x.kanjivgId, x])),
    strokesByLiteral: new Map(strokes.map((x) => [x.literal, x])),
  }
}

/** Load the L1 (≈N5) content packs — the always-available default. */
export async function loadL1(): Promise<Content> {
  return loadLevels(['L1'])
}

/** Fetch and validate one classbook (D-034) — outside the Level-scoped manifest system, since a
 *  lesson isn't a JLPT level; served at the same `packs/` path as everything else. */
export async function loadClassbook(book: string): Promise<Classbook> {
  const res = await fetch(`${import.meta.env.BASE_URL}packs/class/${book}.json`)
  if (!res.ok) throw new Error(`Could not load classbook ${book} (HTTP ${res.status})`)
  return Classbook.parse(await res.json())
}
