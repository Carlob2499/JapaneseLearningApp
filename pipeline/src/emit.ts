import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type {
  GrammarPoint,
  KanjiItem,
  Level,
  Manifest,
  ManifestEntry,
  Pack,
  PackDomain,
  SentenceItem,
  Source,
  StrokeItem,
  VerificationStatus,
  VocabItem,
} from '@hikkoshi/schemas'
import { SCHEMA_VERSION } from '@hikkoshi/schemas'
import { LEVELS_IN_ORDER } from './config'
import { PACKS_DIR } from './lib/paths'
import { sha256 } from './lib/io'

const PACK_VERSION = '0.1.0'

/** One source record as recorded in content/sources.lock.json. */
export interface LockSource {
  key: string
  name: string
  url: string
  retrieved: string
  license: string
  attribution: string
}

type Domain = 'vocab' | 'kanji' | 'grammar' | 'sentence' | 'strokes'
type AnyItem = VocabItem | KanjiItem | GrammarPoint | SentenceItem | StrokeItem

const LEVEL_JLPT: Record<Level, string> = {
  L0: 'kana/survival',
  L1: '≈N5',
  L2: '≈N4',
  L3: '≈N3',
  L4: '≈N2',
  L5: '≈N1',
}

interface DomainMeta {
  domain: Domain
  titleWord: string
  dataKeys: string[]
  licenseSpdx: string
  licenseNotes: string
  levelTagSource?: string
  verificationMethod: string
  /** Defaults to 'dataset-verified'; curated domains (grammar) declare 'curated-cited'. */
  verificationStatus?: VerificationStatus
}

const DOMAIN_META: Record<Domain, DomainMeta> = {
  vocab: {
    domain: 'vocab',
    titleWord: 'Vocabulary',
    dataKeys: ['jmdict', 'jlpt-vocab-n5', 'jlpt-vocab-n4', 'jlpt-vocab-n3', 'jlpt-vocab-n2', 'jlpt-vocab-n1'],
    licenseSpdx: 'CC-BY-SA-4.0',
    licenseNotes: 'JMdict data is CC BY-SA 4.0; JLPT level tags are community estimates (CC BY, Jonathan Waller).',
    levelTagSource: 'Jonathan Waller / tanos.co.uk via elzup/jlpt-word-list',
    verificationMethod: 'JMdict expression+reading join (unmatched → review-queue.json)',
  },
  kanji: {
    domain: 'kanji',
    titleWord: 'Kanji',
    dataKeys: ['kanjidic2', 'kanji-data'],
    licenseSpdx: 'CC-BY-SA-4.0',
    licenseNotes: 'KANJIDIC2 data is CC BY-SA 4.0; JLPT level tags are community estimates (CC BY, Jonathan Waller).',
    levelTagSource: 'Jonathan Waller / tanos.co.uk via davidluzgouveia/kanji-data (jlpt_new)',
    verificationMethod: 'KANJIDIC2 literal join',
  },
  grammar: {
    domain: 'grammar',
    titleWord: 'Grammar',
    // Examples are drawn from Tatoeba (credited via these keys); the point descriptions are ours.
    dataKeys: ['tatoeba-jpn-detailed', 'tatoeba-jpn-eng-links', 'tatoeba-eng', 'tatoeba-jpn-cc0'],
    licenseSpdx: 'CC-BY-SA-4.0',
    licenseNotes:
      'Grammar point names/glosses/summaries are original descriptions (CC BY-SA 4.0); each point cites public inventories for level placement (D-005). Example sentences are drawn verbatim from Tatoeba (CC BY 2.0 FR; a CC0 subset is marked per example).',
    verificationStatus: 'curated-cited',
    verificationMethod: 'curated grammar point (≥1 cited inventory + textbook anchor) with examples pattern-matched verbatim from Tatoeba',
  },
  sentence: {
    domain: 'sentence',
    titleWord: 'Example sentences',
    dataKeys: ['tatoeba-jpn-detailed', 'tatoeba-jpn-eng-links', 'tatoeba-eng', 'tatoeba-jpn-cc0'],
    licenseSpdx: 'CC-BY-2.0-FR',
    licenseNotes:
      'Tatoeba sentences are CC BY 2.0 FR (a CC0 subset is marked per item); level is a kanji-coverage estimate, not a JLPT tag.',
    verificationMethod: 'Tatoeba jpn→eng pair + cumulative kanji-coverage leveling',
  },
  strokes: {
    domain: 'strokes',
    titleWord: 'Stroke order',
    dataKeys: ['kanjivg'],
    licenseSpdx: 'CC-BY-SA-3.0',
    licenseNotes: 'KanjiVG stroke data © Ulrich Apel, CC BY-SA 3.0; ShareAlike applies to derived stroke data.',
    verificationMethod: 'KanjiVG per-character SVG stroke extraction',
  },
}

function toSource(s: LockSource): Source {
  return { name: s.name, url: s.url, retrieved: s.retrieved, license: s.license }
}

function groupByLevel<T>(items: T[], levelOf: (t: T) => Level): Map<Level, T[]> {
  const map = new Map<Level, T[]>()
  for (const it of items) {
    const level = levelOf(it)
    const arr = map.get(level)
    if (arr) arr.push(it)
    else map.set(level, [it])
  }
  return map
}

function buildPack(meta: DomainMeta, level: Level, items: AnyItem[], lock: LockSource[], date: string): Pack {
  const sources = lock.filter((s) => meta.dataKeys.includes(s.key)).map(toSource)
  return {
    schemaVersion: SCHEMA_VERSION,
    packId: `${meta.domain}.${level.toLowerCase()}.core`,
    packVersion: PACK_VERSION,
    title: `${meta.titleWord} — ${level} (${LEVEL_JLPT[level]})`,
    license: { spdx: meta.licenseSpdx, notes: meta.licenseNotes },
    sources,
    ...(meta.levelTagSource ? { levelTagSource: meta.levelTagSource, levelTagLicense: 'CC-BY' } : {}),
    verification: { status: meta.verificationStatus ?? 'dataset-verified', method: meta.verificationMethod, date },
    items,
  }
}

function attribution(lock: LockSource[]): string {
  const lines = [
    '# Attribution',
    '',
    'This file is generated by the content pipeline (`pipeline/src/emit.ts`). All language',
    'data in Hikkoshi is imported from licensed open datasets; the app ships no generated',
    'language content (decision D-002). JLPT level tags are community estimates — the JLPT has',
    'published no official vocabulary or kanji lists since 2010 (decision D-005).',
    '',
    '## Datasets',
    '',
  ]
  for (const s of lock) {
    lines.push(`### ${s.name}`, '', `- License: ${s.license}`, `- Source: ${s.url}`, `- ${s.attribution}`, '')
  }
  lines.push(
    '## Required notices',
    '',
    '- **JMdict / KANJIDIC2**: © James William Breen and The Electronic Dictionary Research',
    '  and Development Group. Used under CC BY-SA 4.0 (https://www.edrdg.org/edrdg/licence.html).',
    '- **JLPT level tags**: derived from Jonathan Waller’s JLPT Resources (https://www.tanos.co.uk/jlpt/),',
    '  CC BY. Level tags are estimates, not official.',
    '- **Tatoeba**: example sentences from the Tatoeba Project (https://tatoeba.org), CC BY 2.0 FR;',
    '  a CC0 subset is identified per item, and each sentence’s author is credited in item metadata.',
    '- **KanjiVG**: kanji stroke-order data © Ulrich Apel / KanjiVG (https://kanjivg.tagaini.net),',
    '  CC BY-SA 3.0. ShareAlike applies to derived stroke data.',
    '',
  )
  return lines.join('\n')
}

/** Emit per-level vocab/kanji/grammar/sentence/strokes packs, the manifest, and ATTRIBUTION.md. */
export async function emitPacks(
  vocab: VocabItem[],
  kanji: KanjiItem[],
  sentences: SentenceItem[],
  strokes: StrokeItem[],
  lock: LockSource[],
  date: string,
  grammar: GrammarPoint[] = [],
): Promise<Manifest> {
  const groups: { meta: DomainMeta; byLevel: Map<Level, AnyItem[]> }[] = [
    { meta: DOMAIN_META.vocab, byLevel: groupByLevel<AnyItem>(vocab, (i) => (i as VocabItem).level) },
    { meta: DOMAIN_META.kanji, byLevel: groupByLevel<AnyItem>(kanji, (i) => (i as KanjiItem).level) },
    { meta: DOMAIN_META.grammar, byLevel: groupByLevel<AnyItem>(grammar, (i) => (i as GrammarPoint).level) },
    { meta: DOMAIN_META.sentence, byLevel: groupByLevel<AnyItem>(sentences, (i) => (i as SentenceItem).levelEstimate) },
    { meta: DOMAIN_META.strokes, byLevel: groupByLevel<AnyItem>(strokes, (i) => (i as StrokeItem).level) },
  ]

  const entries: ManifestEntry[] = []
  for (const level of LEVELS_IN_ORDER) {
    await mkdir(join(PACKS_DIR, level.toLowerCase()), { recursive: true })
    for (const { meta, byLevel } of groups) {
      const items = byLevel.get(level) ?? []
      if (items.length === 0) continue
      const pack = buildPack(meta, level, items, lock, date)
      const body = JSON.stringify(pack) + '\n'
      const relPath = `${level.toLowerCase()}/${meta.domain}.json`
      await writeFile(join(PACKS_DIR, relPath), body)
      entries.push({
        packId: pack.packId,
        path: relPath,
        level,
        domain: meta.domain as PackDomain,
        packVersion: PACK_VERSION,
        itemCount: items.length,
        sha256: sha256(Buffer.from(body)), // hash of the exact file bytes
      })
    }
  }

  const manifest: Manifest = { schemaVersion: SCHEMA_VERSION, generatedAt: date, packs: entries }
  await writeFile(join(PACKS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  await writeFile(join(PACKS_DIR, '..', 'ATTRIBUTION.md'), attribution(lock))
  return manifest
}

/**
 * Re-emit ONLY the per-level sentence packs (targeted rebuild) and return their manifest
 * entries. The caller splices these into the existing manifest, leaving vocab/kanji/stroke
 * packs byte-identical. Reuses `buildPack` + `DOMAIN_META.sentence` so bytes match `emitPacks`.
 */
export async function emitSentencePacks(
  sentences: SentenceItem[],
  lock: LockSource[],
  date: string,
): Promise<ManifestEntry[]> {
  const byLevel = groupByLevel<AnyItem>(sentences, (i) => (i as SentenceItem).levelEstimate)
  const entries: ManifestEntry[] = []
  for (const level of LEVELS_IN_ORDER) {
    const items = byLevel.get(level) ?? []
    if (items.length === 0) continue
    await mkdir(join(PACKS_DIR, level.toLowerCase()), { recursive: true })
    const pack = buildPack(DOMAIN_META.sentence, level, items, lock, date)
    const body = JSON.stringify(pack) + '\n'
    const relPath = `${level.toLowerCase()}/sentence.json`
    await writeFile(join(PACKS_DIR, relPath), body)
    entries.push({
      packId: pack.packId,
      path: relPath,
      level,
      domain: 'sentence',
      packVersion: PACK_VERSION,
      itemCount: items.length,
      sha256: sha256(Buffer.from(body)),
    })
  }
  return entries
}

/**
 * Re-emit ONLY the per-level grammar packs (targeted rebuild) and return their manifest entries,
 * for the caller to splice into the existing manifest (curated grammar iterates independently of
 * the dataset build). Reuses `buildPack` + `DOMAIN_META.grammar` so bytes match `emitPacks`.
 */
export async function emitGrammarPacks(
  grammar: GrammarPoint[],
  lock: LockSource[],
  date: string,
): Promise<ManifestEntry[]> {
  const byLevel = groupByLevel<AnyItem>(grammar, (i) => (i as GrammarPoint).level)
  const entries: ManifestEntry[] = []
  for (const level of LEVELS_IN_ORDER) {
    const items = byLevel.get(level) ?? []
    if (items.length === 0) continue
    await mkdir(join(PACKS_DIR, level.toLowerCase()), { recursive: true })
    const pack = buildPack(DOMAIN_META.grammar, level, items, lock, date)
    const body = JSON.stringify(pack) + '\n'
    const relPath = `${level.toLowerCase()}/grammar.json`
    await writeFile(join(PACKS_DIR, relPath), body)
    entries.push({
      packId: pack.packId,
      path: relPath,
      level,
      domain: 'grammar',
      packVersion: PACK_VERSION,
      itemCount: items.length,
      sha256: sha256(Buffer.from(body)),
    })
  }
  return entries
}
