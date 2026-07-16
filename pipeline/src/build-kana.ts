import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Manifest } from '@hikkoshi/schemas'
import { CONTENT_DIR, PACKS_DIR } from './lib/paths'
import { emitKanaPacks, emitStrokePacks, type LockSource } from './emit'
import { buildKanaItems, buildKanaStrokes } from './kana'

/**
 * Targeted L0 kana build (D-023, extended for yōon in D-029): the 208-unit gojūon table (142
 * singles + 66 yōon) + per-component KanjiVG stroke data, emitted as l0/kana.json + l0/strokes.json
 * with their manifest rows spliced in. Every component glyph must resolve stroke data — a partial
 * kana set is not a foundation, so any unmatched glyph fails the build loudly (§1 honesty rule).
 */
async function main(): Promise<void> {
  const kana = buildKanaItems()
  console.log(`Built ${kana.length} kana items (singles then yōon, hiragana → katakana).`)

  const { strokes, unmatched } = await buildKanaStrokes(kana)
  if (unmatched.length > 0) {
    console.error(`KanjiVG stroke data missing for ${unmatched.length} component glyphs: ${unmatched.join(' ')}`)
    process.exit(1)
  }
  console.log(`Fetched stroke data for all ${strokes.length} component glyphs from KanjiVG.`)

  const lock = JSON.parse(await readFile(join(CONTENT_DIR, 'sources.lock.json'), 'utf8')) as {
    generatedAt: string
    sources: LockSource[]
  }
  const date = lock.generatedAt.slice(0, 10)

  const [kanaEntries, strokeEntries] = await Promise.all([
    emitKanaPacks(kana, lock.sources, date),
    emitStrokePacks(strokes, lock.sources, date), // strokes here are all L0 → emits only l0/strokes.json
  ])
  const newEntries = [...kanaEntries, ...strokeEntries]

  const manifestPath = join(PACKS_DIR, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest
  manifest.packs = manifest.packs
    .filter((p) => p.domain !== 'kana' && !(p.domain === 'strokes' && p.level === 'L0'))
    .concat(newEntries)
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  console.log(`\nEmitted ${newEntries.length} L0 packs + spliced manifest (other domains untouched).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
