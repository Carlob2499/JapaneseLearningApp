import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Level, Manifest, VocabItem } from '@hikkoshi/schemas'
import { LEVELS_IN_ORDER } from './config'
import { CONTENT_DIR, PACKS_DIR } from './lib/paths'
import { emitVocabPacks, type LockSource } from './emit'
import { applyModuleTags, loadCuratedModuleTags } from './moduleTags'

/**
 * Targeted module-tagging re-emit (D-017). Activates the `VocabItem.modules` field — defined
 * in the schema since Session 4, populated by nothing until now. Re-reads the COMMITTED vocab
 * packs (no re-join against JMdict needed — module tags are assigned to already-resolved
 * vocab), applies curated expression+reading → ModuleTag assignments, and re-emits ONLY the
 * vocab packs whose items actually changed (others stay byte-identical).
 */

const CURATED_MODULES_DIR = join(CONTENT_DIR, 'curated', 'modules')

async function loadVocabFromPacks(): Promise<VocabItem[]> {
  const all: VocabItem[] = []
  for (const level of LEVELS_IN_ORDER) {
    // L0 carries only kana/strokes packs (D-023) — skip levels without this domain's file.
    const path = join(PACKS_DIR, level.toLowerCase(), 'vocab.json')
    if (!existsSync(path)) continue
    const pack = JSON.parse(
      await readFile(path, 'utf8'),
    ) as { items: VocabItem[] }
    all.push(...pack.items)
  }
  return all
}

async function main(): Promise<void> {
  const tags = await loadCuratedModuleTags(CURATED_MODULES_DIR)
  if (tags.length === 0) {
    console.error(`No curated module tags found in ${CURATED_MODULES_DIR}`)
    process.exit(1)
  }
  console.log(`Loaded ${tags.length} curated module-tag assignments.`)

  const vocab = await loadVocabFromPacks()
  const { items, matched, unmatched } = applyModuleTags(vocab, tags)
  console.log(`Matched ${matched}/${tags.length} against ${vocab.length} committed vocab items.`)
  if (unmatched.length > 0) {
    console.log(`Unmatched (never silently dropped):`)
    for (const u of unmatched) console.log(`  - ${u.expression} (${u.reading}) → ${u.tags.join(', ')}`)
  }

  const byLevel = new Map<Level, number>()
  for (const it of items) if (it.modules.length > 0) byLevel.set(it.level, (byLevel.get(it.level) ?? 0) + 1)
  console.log('Tagged items by level:', Object.fromEntries(byLevel))

  const lock = JSON.parse(await readFile(join(CONTENT_DIR, 'sources.lock.json'), 'utf8')) as {
    generatedAt: string
    sources: LockSource[]
  }
  const date = lock.generatedAt.slice(0, 10)

  const newEntries = await emitVocabPacks(items, lock.sources, date)

  const manifestPath = join(PACKS_DIR, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest
  manifest.packs = manifest.packs.map((p) =>
    p.domain === 'vocab' ? (newEntries.find((e) => e.level === p.level) ?? p) : p,
  )
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  console.log(`\nRe-emitted ${newEntries.length} vocab packs + spliced manifest (other domains untouched).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
