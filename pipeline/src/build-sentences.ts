import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Level, Manifest } from '@hikkoshi/schemas'
import { LEVELS_IN_ORDER, REGISTER_TARGETS, TATOEBA_SOURCES } from './config'
import { CONTENT_DIR, DOWNLOADS_DIR, PACKS_DIR } from './lib/paths'
import { bunzip2To, curlDownload } from './lib/io'
import { emitSentencePacks, type LockSource } from './emit'
import { buildSentenceItems, loadTatoeba } from './sentences'

/**
 * Targeted sentence re-emit with register scaffolding (D-015). Re-fetches ONLY Tatoeba,
 * reuses the committed kanji packs for the known-kanji sets, and rewrites just the sentence
 * packs + their manifest rows — vocab/kanji/stroke packs stay byte-identical.
 */

async function ensureTatoeba(): Promise<void> {
  await mkdir(DOWNLOADS_DIR, { recursive: true })
  for (const src of TATOEBA_SOURCES) {
    const dest = join(DOWNLOADS_DIR, src.outfile)
    if (existsSync(dest)) {
      console.log(`  cached ${src.outfile}`)
      continue
    }
    console.log(`  fetching ${src.name}…`)
    const bz2 = `${dest}.bz2`
    await curlDownload(src.url, bz2)
    await bunzip2To(bz2, dest)
  }
}

/** Cumulative known-kanji sets per level, read from the committed kanji packs (no kanji rebuild). */
async function knownKanjiFromPacks(): Promise<Map<Level, Set<string>>> {
  const result = new Map<Level, Set<string>>()
  const cumulative = new Set<string>()
  for (const level of LEVELS_IN_ORDER) {
    // L0 carries only kana/strokes packs (D-023) — skip levels without this domain's file.
    const path = join(PACKS_DIR, level.toLowerCase(), 'kanji.json')
    if (!existsSync(path)) continue
    const pack = JSON.parse(
      await readFile(path, 'utf8'),
    ) as { items: { literal: string }[] }
    for (const it of pack.items) cumulative.add(it.literal)
    result.set(level, new Set(cumulative))
  }
  return result
}

async function main(): Promise<void> {
  console.log('Ensuring Tatoeba corpus…')
  await ensureTatoeba()

  const known = await knownKanjiFromPacks()
  const corpus = await loadTatoeba(DOWNLOADS_DIR)
  const sentences = buildSentenceItems(corpus, known)

  console.log('\nSentences by level:', sentences.statsByLevel)
  console.log('Register mix (achieved vs target):')
  for (const level of LEVELS_IN_ORDER) {
    const got = sentences.registerByLevel[level]
    const n = sentences.statsByLevel[level] || 1
    const pct = (x: number) => `${((100 * x) / n).toFixed(0)}%`
    const t = REGISTER_TARGETS[level]
    console.log(
      `  ${level}: polite ${pct(got.polite)}/${(t.polite * 100).toFixed(0)}%  ` +
        `plain ${pct(got.plain)}/${(t.plain * 100).toFixed(0)}%  ` +
        `casual ${pct(got.casual)}/${(t.casual * 100).toFixed(0)}%  ` +
        `keigo ${pct(got.keigo)}/${(t.keigo * 100).toFixed(0)}%`,
    )
  }
  if (sentences.linkResolveRate < 0.9) {
    throw new Error(`Tatoeba link resolve rate ${sentences.linkResolveRate} < 0.9`)
  }

  const lock = JSON.parse(await readFile(join(CONTENT_DIR, 'sources.lock.json'), 'utf8')) as {
    generatedAt: string
    sources: LockSource[]
  }
  const date = lock.generatedAt.slice(0, 10)

  const newEntries = await emitSentencePacks(sentences.items, lock.sources, date)

  // Splice new sentence rows into the manifest in place (keep vocab/kanji/stroke rows + order).
  const manifestPath = join(PACKS_DIR, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest
  manifest.packs = manifest.packs.map((p) =>
    p.domain === 'sentence' ? (newEntries.find((e) => e.level === p.level) ?? p) : p,
  )
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  console.log(`\nRe-emitted ${newEntries.length} sentence packs + spliced manifest (vocab/kanji/strokes untouched).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
