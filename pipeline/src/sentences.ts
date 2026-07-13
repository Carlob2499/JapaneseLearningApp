import { readFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { join } from 'node:path'
import type { KanjiItem, Level, Register, SentenceItem } from '@hikkoshi/schemas'
import { LEVELS_IN_ORDER, REGISTER_TARGETS, type RegisterMix } from './config'
import { classifyRegister } from './register'
import { parseTsv } from './lib/tsv'

const KNOWN_RATIO_BASIS =
  'all kanji within the cumulative known-kanji set for this level (kanji-coverage proxy; kana-only → L1); no morphological analysis — grammar/vocabulary difficulty not modeled'

/** CJK Unified Ideographs (basic block) — covers jōyō and the kanji we teach. */
export function extractKanji(text: string): string[] {
  const out: string[] = []
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp !== undefined && cp >= 0x4e00 && cp <= 0x9fff) out.push(ch)
  }
  return out
}

/** Per app level, the cumulative set of kanji known by then (level ≤ L). */
export function buildKnownKanjiByLevel(kanjiItems: KanjiItem[]): Map<Level, Set<string>> {
  const result = new Map<Level, Set<string>>()
  const cumulative = new Set<string>()
  for (const level of LEVELS_IN_ORDER) {
    for (const k of kanjiItems) if (k.level === level) cumulative.add(k.literal)
    result.set(level, new Set(cumulative))
  }
  return result
}

/** Lowest level whose known-kanji set covers every kanji in the sentence; null if none (even L5). */
function sentenceLevel(kanji: string[], known: Map<Level, Set<string>>): Level | null {
  if (kanji.length === 0) return 'L1' // kana-only: no kanji barrier
  for (const level of LEVELS_IN_ORDER) {
    const set = known.get(level)
    if (set && kanji.every((k) => set.has(k))) return level
  }
  return null
}

type RegGroup = keyof RegisterMix // 'polite' | 'plain' | 'casual' | 'keigo'
const REG_GROUPS: readonly RegGroup[] = ['polite', 'plain', 'casual', 'keigo']

/** Collapse the six-value register into the four quota groups (keigo = respectful+humble+service). */
function registerGroup(r: Register): RegGroup {
  return r === 'polite' || r === 'plain' || r === 'casual' ? r : 'keigo'
}

/** Higher = a more complete sentence: prefer a 。 ending and a mid length over bare fragments. */
function quality(ja: string, len: number): number {
  return (/[。．]$/.test(ja) ? 2 : 0) + (len >= 7 && len <= 28 ? 1 : 0) - (len < 6 ? 1 : 0)
}

/** Normalized Tatoeba corpus (jpn↔eng pairs + authorship + CC0 set). */
export interface TatoebaCorpus {
  jpn: Map<number, { text: string; author: string }>
  links: Map<number, number[]>
  engText: Map<number, string>
  cc0: Set<number>
}

export interface SentenceOptions {
  minLen?: number
  maxLen?: number
  perLevelCap?: number
}

export interface SentenceResult {
  items: SentenceItem[]
  statsByLevel: Record<string, number>
  /** Achieved register mix per level (counts) — for the honesty log vs REGISTER_TARGETS. */
  registerByLevel: Record<string, Record<RegGroup, number>>
  excluded: { noEnglish: number; unknownKanji: number; length: number; duplicate: number }
  linkResolveRate: number
}

/**
 * Build graded example-sentence items. The list decides membership; `ja`/`en`
 * are copied verbatim from Tatoeba (D-002 — never authored/edited). Level is a
 * kanji-coverage estimate (disclosed in `coverage.knownRatioBasis`).
 */
export function buildSentenceItems(
  corpus: TatoebaCorpus,
  knownKanjiByLevel: Map<Level, Set<string>>,
  opts: SentenceOptions = {},
): SentenceResult {
  const minLen = opts.minLen ?? 4
  const maxLen = opts.maxLen ?? 50
  const cap = opts.perLevelCap ?? 600

  interface Cand {
    jpnId: number
    ja: string
    en: string
    author: string
    license: 'CC-BY-2.0-FR' | 'CC0-1.0'
    level: Level
    len: number
    register: Register
    q: number
  }
  const candidates: Cand[] = []
  const seenJa = new Set<string>()
  const excluded = { noEnglish: 0, unknownKanji: 0, length: 0, duplicate: 0 }
  let resolvableLinks = 0

  for (const jpnId of [...corpus.jpn.keys()].sort((a, b) => a - b)) {
    const rec = corpus.jpn.get(jpnId)
    if (!rec) continue
    const ja = rec.text
    const len = [...ja].length
    if (len < minLen || len > maxLen) {
      excluded.length++
      continue
    }
    const engIds = corpus.links.get(jpnId)
    if (!engIds || engIds.length === 0) {
      excluded.noEnglish++
      continue
    }
    let en: string | undefined
    for (const eid of [...engIds].sort((a, b) => a - b)) {
      const t = corpus.engText.get(eid)
      if (t) {
        en = t
        break
      }
    }
    if (!en) {
      excluded.noEnglish++
      continue
    }
    resolvableLinks++
    const level = sentenceLevel(extractKanji(ja), knownKanjiByLevel)
    if (!level) {
      excluded.unknownKanji++
      continue
    }
    if (seenJa.has(ja)) {
      excluded.duplicate++
      continue
    }
    seenJa.add(ja)
    candidates.push({
      jpnId,
      ja,
      en,
      author: rec.author,
      license: corpus.cc0.has(jpnId) ? 'CC0-1.0' : 'CC-BY-2.0-FR',
      level,
      len,
      register: classifyRegister(ja),
      q: quality(ja, len),
    })
  }

  const items: SentenceItem[] = []
  const statsByLevel: Record<string, number> = {}
  const registerByLevel: Record<string, Record<RegGroup, number>> = {}
  const byQuality = (a: Cand, b: Cand) =>
    b.q - a.q || Math.abs(a.len - 12) - Math.abs(b.len - 12) || a.jpnId - b.jpnId

  for (const level of LEVELS_IN_ORDER) {
    const levelCands = candidates.filter((c) => c.level === level)
    const buckets: Record<RegGroup, Cand[]> = { polite: [], plain: [], casual: [], keigo: [] }
    for (const c of levelCands) buckets[registerGroup(c.register)].push(c)
    for (const g of REG_GROUPS) buckets[g].sort(byQuality)

    const target = REGISTER_TARGETS[level]
    const chosen = new Set<Cand>()
    const picked: Cand[] = []
    // 1. Fill each register group toward its quota, best-quality first — the scaffold shape.
    for (const g of REG_GROUPS) {
      let want = Math.floor(cap * target[g])
      for (const c of buckets[g]) {
        if (want <= 0 || picked.length >= cap) break
        picked.push(c)
        chosen.add(c)
        want--
      }
    }
    // 2. Backfill to the cap from the best remaining, but never from a zero-target register
    //    (keigo stays 0% at L1). If supply is thin the level simply has fewer than `cap`.
    if (picked.length < cap) {
      const backfillable = levelCands
        .filter((c) => !chosen.has(c) && target[registerGroup(c.register)] > 0)
        .sort(byQuality)
      for (const c of backfillable) {
        if (picked.length >= cap) break
        picked.push(c)
        chosen.add(c)
      }
    }

    const regCount: Record<RegGroup, number> = { polite: 0, plain: 0, casual: 0, keigo: 0 }
    for (const c of picked) {
      regCount[registerGroup(c.register)]++
      items.push({
        kind: 'sentence',
        id: `sentence:${c.jpnId}`,
        tatoebaId: c.jpnId,
        ja: c.ja,
        en: c.en,
        attribution: { author: c.author, license: c.license },
        levelEstimate: c.level,
        register: c.register,
        coverage: { knownRatioBasis: KNOWN_RATIO_BASIS },
      })
    }
    statsByLevel[level] = picked.length
    registerByLevel[level] = regCount
  }

  return {
    items,
    statsByLevel,
    registerByLevel,
    excluded,
    linkResolveRate: corpus.jpn.size === 0 ? 1 : resolvableLinks / corpus.jpn.size,
  }
}

/** Load and normalize the Tatoeba TSVs from the downloads dir (streams the large eng file). */
export async function loadTatoeba(downloadsDir: string): Promise<TatoebaCorpus> {
  // 1. links: jpn_id → eng_ids (col1 = jpn, col2 = eng; per-language file is pre-directed).
  const links = new Map<number, number[]>()
  const neededEng = new Set<number>()
  const jpnLinked = new Set<number>()
  for (const row of parseTsv(await readFile(join(downloadsDir, 'jpn-eng_links.tsv'), 'utf8'))) {
    const j = Number(row[0])
    const e = Number(row[1])
    if (!Number.isFinite(j) || !Number.isFinite(e)) continue
    let arr = links.get(j)
    if (!arr) {
      arr = []
      links.set(j, arr)
    }
    arr.push(e)
    neededEng.add(e)
    jpnLinked.add(j)
  }

  // 2. jpn sentences (only those that have an English link).
  const jpn = new Map<number, { text: string; author: string }>()
  for (const row of parseTsv(await readFile(join(downloadsDir, 'jpn_sentences_detailed.tsv'), 'utf8'))) {
    const id = Number(row[0])
    if (!Number.isFinite(id) || !jpnLinked.has(id)) continue
    const text = row[2] ?? ''
    const u = row[3] ?? ''
    jpn.set(id, { text, author: u === '\\N' ? '' : u })
  }

  // 3. CC0 subset.
  const cc0 = new Set<number>()
  for (const row of parseTsv(await readFile(join(downloadsDir, 'jpn_sentences_CC0.tsv'), 'utf8'))) {
    const id = Number(row[0])
    if (Number.isFinite(id)) cc0.add(id)
  }

  // 4. English text — only the ids we need — streamed (the export is ~108 MB).
  const engText = new Map<number, string>()
  const rl = createInterface({
    input: createReadStream(join(downloadsDir, 'eng_sentences.tsv')),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    const t1 = line.indexOf('\t')
    if (t1 < 0) continue
    const id = Number(line.slice(0, t1))
    if (!neededEng.has(id)) continue
    const t2 = line.indexOf('\t', t1 + 1)
    engText.set(id, t2 < 0 ? line.slice(t1 + 1) : line.slice(t2 + 1))
  }

  return { jpn, links, engText, cc0 }
}
