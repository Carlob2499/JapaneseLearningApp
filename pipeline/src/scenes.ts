import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import { PhraseTemplate, SceneTemplate } from '@hikkoshi/schemas'

/** Read + validate every JSON file in `dir` as an array of `schema` — duplicate ids reject. */
async function loadCurated<T extends { id: string }>(
  dir: string,
  schema: z.ZodType<T>,
): Promise<T[]> {
  let files: string[]
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()
  } catch {
    return []
  }
  const out: T[] = []
  const seenIds = new Set<string>()
  for (const file of files) {
    const raw = JSON.parse(await readFile(join(dir, file), 'utf8'))
    for (const item of z.array(schema).parse(raw)) {
      if (seenIds.has(item.id)) throw new Error(`duplicate id "${item.id}" in ${file}`)
      seenIds.add(item.id)
      out.push(item)
    }
  }
  return out
}

/** Read + validate content/curated/phrases/*.json (each an array of PhraseTemplate). */
export function loadCuratedPhrases(dir: string): Promise<PhraseTemplate[]> {
  return loadCurated(dir, PhraseTemplate)
}

/** Read + validate content/curated/scenes/*.json (each an array of SceneTemplate). */
export function loadCuratedScenes(dir: string): Promise<SceneTemplate[]> {
  return loadCurated(dir, SceneTemplate)
}

/**
 * Cross-check every scene's `framing[].phraseId` resolves to a real, cited `PhraseTemplate`
 * (never a dangling reference) — the compile-time analog of the D-002 provenance gate.
 */
export function validateSceneReferences(scenes: SceneTemplate[], phrases: PhraseTemplate[]): void {
  const phraseIds = new Set(phrases.map((p) => p.id))
  for (const scene of scenes) {
    for (const f of scene.framing) {
      if (f.phraseId && !phraseIds.has(f.phraseId)) {
        throw new Error(`scene "${scene.id}" framing references unknown phrase "${f.phraseId}"`)
      }
    }
  }
}
