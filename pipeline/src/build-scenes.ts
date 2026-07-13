import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Manifest } from '@hikkoshi/schemas'
import { CONTENT_DIR, PACKS_DIR } from './lib/paths'
import { emitPhrasePacks, emitScenePacks, type LockSource } from './emit'
import { loadCuratedPhrases, loadCuratedScenes, validateSceneReferences } from './scenes'

/**
 * Targeted phrase + scene re-emit (D-017). Curated phrase/scene content iterates
 * independently of the dataset build: unlike sentences/grammar, phrases and scenes are
 * fully curated (no corpus fetch or example-linking) — this script just loads, cross-checks,
 * and emits. Re-emits ONLY the phrase/scene packs + their manifest rows.
 */

async function main(): Promise<void> {
  const phrases = await loadCuratedPhrases(join(CONTENT_DIR, 'curated', 'phrases'))
  const scenes = await loadCuratedScenes(join(CONTENT_DIR, 'curated', 'scenes'))
  if (phrases.length === 0 || scenes.length === 0) {
    console.error('No curated phrases and/or scenes found under content/curated/{phrases,scenes}')
    process.exit(1)
  }
  validateSceneReferences(scenes, phrases)
  console.log(`Loaded ${phrases.length} curated phrases and ${scenes.length} curated scene(s).`)

  const lock = JSON.parse(await readFile(join(CONTENT_DIR, 'sources.lock.json'), 'utf8')) as {
    generatedAt: string
    sources: LockSource[]
  }
  const date = lock.generatedAt.slice(0, 10)

  const [phraseEntries, sceneEntries] = await Promise.all([
    emitPhrasePacks(phrases, lock.sources, date),
    emitScenePacks(scenes, lock.sources, date),
  ])
  const newEntries = [...phraseEntries, ...sceneEntries]

  const manifestPath = join(PACKS_DIR, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest
  manifest.packs = manifest.packs
    .filter((p) => p.domain !== 'phrase' && p.domain !== 'scene')
    .concat(newEntries)
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  console.log(`\nEmitted ${newEntries.length} phrase/scene packs + spliced manifest (other domains untouched).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
