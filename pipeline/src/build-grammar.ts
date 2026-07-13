import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Level, Manifest } from '@hikkoshi/schemas'
import { LEVELS_IN_ORDER, TATOEBA_SOURCES } from './config'
import { CONTENT_DIR, DOWNLOADS_DIR, PACKS_DIR } from './lib/paths'
import { bunzip2To, curlDownload } from './lib/io'
import { emitGrammarPacks, type LockSource } from './emit'
import { loadTatoeba } from './sentences'
import { linkExamples, loadCuratedGrammar } from './grammar'

/**
 * Targeted grammar re-emit (D-016). Curated grammar (content/curated/grammar/*.json) iterates
 * independently of the dataset build: re-fetch ONLY Tatoeba (for example-linking), reuse the
 * committed kanji packs for the known-kanji sets, and rewrite just the grammar packs + their
 * manifest rows — vocab/kanji/sentence/stroke packs stay byte-identical.
 */

const CURATED_GRAMMAR_DIR = join(CONTENT_DIR, 'curated', 'grammar')

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
    const pack = JSON.parse(
      await readFile(join(PACKS_DIR, level.toLowerCase(), 'kanji.json'), 'utf8'),
    ) as { items: { literal: string }[] }
    for (const it of pack.items) cumulative.add(it.literal)
    result.set(level, new Set(cumulative))
  }
  return result
}

async function main(): Promise<void> {
  const points = await loadCuratedGrammar(CURATED_GRAMMAR_DIR)
  if (points.length === 0) {
    console.error(`No curated grammar found in ${CURATED_GRAMMAR_DIR}`)
    process.exit(1)
  }
  console.log(`Loaded ${points.length} curated grammar points.`)

  console.log('Ensuring Tatoeba corpus (for example-linking)…')
  await ensureTatoeba()
  const known = await knownKanjiFromPacks()
  const corpus = await loadTatoeba(DOWNLOADS_DIR)

  const linked = linkExamples(points, corpus, known)
  console.log('\nGrammar points shipped by level:', linked.statsByLevel)
  if (linked.shortfalls.length > 0) {
    console.log(`Held back ${linked.shortfalls.length} point(s) with no readable example:`)
    for (const s of linked.shortfalls) console.log(`  - ${s.level} ${s.id} (${s.name})`)
  }

  const lock = JSON.parse(await readFile(join(CONTENT_DIR, 'sources.lock.json'), 'utf8')) as {
    generatedAt: string
    sources: LockSource[]
  }
  const date = lock.generatedAt.slice(0, 10)

  const newEntries = await emitGrammarPacks(linked.items, lock.sources, date)

  // Splice grammar rows into the manifest: drop any existing grammar rows, append the fresh set.
  const manifestPath = join(PACKS_DIR, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest
  manifest.packs = manifest.packs.filter((p) => p.domain !== 'grammar').concat(newEntries)
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  console.log(
    `\nEmitted ${newEntries.length} grammar packs (${linked.items.length} points) + spliced manifest (other packs untouched).`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
