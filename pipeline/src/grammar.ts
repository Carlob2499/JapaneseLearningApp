import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import { Level, Source, type GrammarExample, type GrammarPoint } from '@hikkoshi/schemas'
import { LEVELS_IN_ORDER } from './config'
import { extractKanji, quality, sentenceLevel, type TatoebaCorpus } from './sentences'

/**
 * Curated grammar input (D-005). Same shape as the emitted `GrammarPoint` minus `examples`
 * (linked from Tatoeba at build time), plus build-time `patterns`: literal Japanese substrings
 * matched verbatim against sentence text to find dataset-verified examples (D-002). The point's
 * name/gloss/summary are original prose; each point carries ≥1 citation and ≥1 pattern.
 */
export const CuratedGrammarPoint = z.object({
  kind: z.literal('grammar'),
  id: z.string().min(1),
  name: z.string().min(1),
  level: Level,
  gloss: z.string().min(1),
  summary: z.string().min(1),
  citations: z.array(Source).min(1),
  textbookAnchors: z
    .array(z.object({ book: z.string().min(1), chapter: z.number().int() }))
    .optional(),
  /** Literal Japanese substrings (e.g. "てもいい", "なければならない"); a sentence matches if it contains one. */
  patterns: z.array(z.string().min(1)).min(1),
})
export type CuratedGrammarPoint = z.infer<typeof CuratedGrammarPoint>

/** Read + validate every content/curated/grammar/*.json (each an array of curated points). */
export async function loadCuratedGrammar(dir: string): Promise<CuratedGrammarPoint[]> {
  let files: string[]
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()
  } catch {
    return [] // no curated grammar yet
  }
  const points: CuratedGrammarPoint[] = []
  const seenIds = new Set<string>()
  for (const file of files) {
    const raw = JSON.parse(await readFile(join(dir, file), 'utf8'))
    const parsed = z.array(CuratedGrammarPoint).parse(raw)
    for (const p of parsed) {
      if (seenIds.has(p.id)) throw new Error(`duplicate grammar id "${p.id}" in ${file}`)
      seenIds.add(p.id)
      points.push(p)
    }
  }
  return points
}

/** A Tatoeba sentence usable as an example: English pair resolved, leveled, quality-scored. */
interface Usable {
  jpnId: number
  ja: string
  example: GrammarExample
  levelIndex: number
  q: number
}

const levelIndex = (l: Level): number => (LEVELS_IN_ORDER as readonly Level[]).indexOf(l)

/** Resolve English pairs + kanji-coverage level for every corpus sentence within length bounds. */
function collectUsable(
  corpus: TatoebaCorpus,
  known: Map<Level, Set<string>>,
  minLen = 5,
  maxLen = 40,
): Usable[] {
  const usable: Usable[] = []
  for (const [jpnId, rec] of corpus.jpn) {
    const ja = rec.text
    const len = [...ja].length
    if (len < minLen || len > maxLen) continue
    const engIds = corpus.links.get(jpnId)
    if (!engIds || engIds.length === 0) continue
    let en: string | undefined
    for (const eid of [...engIds].sort((a, b) => a - b)) {
      const t = corpus.engText.get(eid)
      if (t) {
        en = t
        break
      }
    }
    if (!en) continue
    const level = sentenceLevel(extractKanji(ja), known)
    if (!level) continue // uses kanji we never teach
    usable.push({
      jpnId,
      ja,
      example: {
        ja,
        en,
        tatoebaId: jpnId,
        attribution: { author: rec.author, license: corpus.cc0.has(jpnId) ? 'CC0-1.0' : 'CC-BY-2.0-FR' },
      },
      levelIndex: levelIndex(level),
      q: quality(ja, len),
    })
  }
  return usable
}

export interface GrammarLinkResult {
  items: GrammarPoint[]
  /** Points that matched zero readable examples — held back, never shipped example-less. */
  shortfalls: { id: string; name: string; level: Level }[]
  statsByLevel: Record<string, number>
}

/**
 * Attach verbatim Tatoeba examples to each curated point (D-002). For a point at level P, an
 * example must (a) contain one of the point's literal patterns and (b) use only kanji known by
 * level P (kanji-coverage ≤ P, so it is readable at that level). The best `perPoint` by sentence
 * quality are embedded; a point with none is logged and excluded.
 */
export function linkExamples(
  points: CuratedGrammarPoint[],
  corpus: TatoebaCorpus,
  known: Map<Level, Set<string>>,
  opts: { perPoint?: number } = {},
): GrammarLinkResult {
  const perPoint = opts.perPoint ?? 3
  const usable = collectUsable(corpus, known)
  const byQuality = (a: Usable, b: Usable) =>
    b.q - a.q || Math.abs([...a.ja].length - 12) - Math.abs([...b.ja].length - 12) || a.jpnId - b.jpnId

  const items: GrammarPoint[] = []
  const shortfalls: GrammarLinkResult['shortfalls'] = []
  const statsByLevel: Record<string, number> = {}

  for (const p of points) {
    const cap = levelIndex(p.level)
    const matches = usable
      .filter((u) => u.levelIndex <= cap && p.patterns.some((pat) => u.ja.includes(pat)))
      .sort(byQuality)
      .slice(0, perPoint)
    if (matches.length === 0) {
      shortfalls.push({ id: p.id, name: p.name, level: p.level })
      continue
    }
    // `patterns` ships on the runtime GrammarPoint too (D-036 needs them for cloze-blanking).
    items.push({ ...p, examples: matches.map((m) => m.example) })
    statsByLevel[p.level] = (statsByLevel[p.level] ?? 0) + 1
  }
  return { items, shortfalls, statsByLevel }
}
