import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Classbook, GrammarPoint, VocabItem } from '@hikkoshi/schemas'
import { CONTENT_DIR, PACKS_DIR } from './lib/paths'

/**
 * Classbook build (D-034): the curated `content/curated/classbook/*.json` files are already
 * final `Classbook`-shaped JSON (unlike grammar/scenes, nothing here is resolved from a fetched
 * dataset — `grammarIds`/`vocabIds` are ids we hand-verified against the already-committed
 * grammar/vocab packs at authoring time). This script re-validates that cross-reference on every
 * run (catches a stale id if a referenced grammar point is ever renamed or removed) and copies
 * the book to `content/packs/class/<book>.json` — outside the Level-scoped manifest system
 * (a lesson isn't a JLPT level), fetched directly by the app like any other static pack JSON.
 */

const CURATED_DIR = join(CONTENT_DIR, 'curated', 'classbook')
const CLASS_DIR = join(PACKS_DIR, 'class')

async function loadAllIds(domain: 'grammar' | 'vocab'): Promise<Set<string>> {
  const ids = new Set<string>()
  for (const level of ['l0', 'l1', 'l2', 'l3', 'l4', 'l5']) {
    const path = join(PACKS_DIR, level, `${domain}.json`)
    let raw: string
    try {
      raw = await readFile(path, 'utf8')
    } catch {
      continue // not every level ships every domain (e.g. L0 has no grammar/vocab)
    }
    const pack = JSON.parse(raw) as { items: { id: string }[] }
    const Item = domain === 'grammar' ? GrammarPoint : VocabItem
    for (const it of pack.items) {
      if (!Item.safeParse(it).success) continue
      ids.add(it.id)
    }
  }
  return ids
}

async function main(): Promise<void> {
  let files: string[]
  try {
    files = (await readdir(CURATED_DIR)).filter((f) => f.endsWith('.json')).sort()
  } catch {
    console.error(`No curated classbook found in ${CURATED_DIR}`)
    process.exit(1)
  }
  if (files.length === 0) {
    console.error(`No curated classbook found in ${CURATED_DIR}`)
    process.exit(1)
  }

  const [grammarIds, vocabIds] = await Promise.all([loadAllIds('grammar'), loadAllIds('vocab')])
  console.log(`Cross-checking against ${grammarIds.size} grammar ids + ${vocabIds.size} vocab ids…`)

  await mkdir(CLASS_DIR, { recursive: true })
  let totalLessons = 0
  const errors: string[] = []

  for (const file of files) {
    const raw = JSON.parse(await readFile(join(CURATED_DIR, file), 'utf8'))
    const parsed = Classbook.safeParse(raw)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${file}: ${issue.path.join('.') || '(root)'} — ${issue.message}`)
      }
      continue
    }
    const book = parsed.data
    for (const lesson of book.lessons) {
      for (const id of lesson.grammarIds) {
        if (!grammarIds.has(id)) errors.push(`${file}: lesson ${lesson.lesson} references unknown grammar id "${id}"`)
      }
      for (const id of lesson.vocabIds) {
        if (!vocabIds.has(id)) errors.push(`${file}: lesson ${lesson.lesson} references unknown vocab id "${id}"`)
      }
    }
    if (errors.length === 0) {
      const body = JSON.stringify(book) + '\n'
      await writeFile(join(CLASS_DIR, `${book.book}.json`), body)
      totalLessons += book.lessons.length
      console.log(`  wrote ${book.book}.json (${book.lessons.length} lessons)`)
    }
  }

  if (errors.length > 0) {
    console.error('Classbook build FAILED:')
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }
  console.log(`\nEmitted ${files.length} classbook(s), ${totalLessons} lessons total.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
