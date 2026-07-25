import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Classbook, Manifest, type ManifestEntry, Pack } from '@hikkoshi/schemas'
import { PACKS_DIR } from './lib/paths'
import { sha256 } from './lib/io'

/**
 * Validate one committed pack against its manifest entry. Runs offline against
 * committed bytes — the CI gate. Checks: whole-file sha256 integrity, Zod schema
 * (which enforces the D-002 provenance gate), packId/itemCount agreement, and the
 * expected verification status per domain. Returns a list of human-readable errors ([] = ok).
 */
// Curated domains attest 'curated-cited' (D-005: original prose + citations); dataset domains
// attest 'dataset-verified'. Both still pass the Pack provenance gate (sources + citations).
const EXPECTED_STATUS: Partial<Record<ManifestEntry['domain'], string>> = {
  grammar: 'curated-cited',
  phrase: 'curated-cited',
  scene: 'curated-cited',
  kana: 'curated-cited',
}

export function checkPack(entry: ManifestEntry, bytes: Buffer): string[] {
  const errs: string[] = []
  if (sha256(bytes) !== entry.sha256) {
    errs.push(`${entry.path}: sha256 mismatch (pack edited without re-running the pipeline?)`)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(bytes.toString('utf8'))
  } catch {
    return [...errs, `${entry.path}: invalid JSON`]
  }
  const res = Pack.safeParse(parsed)
  if (!res.success) {
    for (const issue of res.error.issues) {
      errs.push(`${entry.path}: ${issue.path.join('.') || '(root)'} — ${issue.message}`)
    }
    return errs
  }
  const pack = res.data
  if (pack.packId !== entry.packId) {
    errs.push(`${entry.path}: packId "${pack.packId}" != manifest "${entry.packId}"`)
  }
  if (pack.items.length !== entry.itemCount) {
    errs.push(`${entry.path}: itemCount ${pack.items.length} != manifest ${entry.itemCount}`)
  }
  const expectedStatus = EXPECTED_STATUS[entry.domain] ?? 'dataset-verified'
  if (pack.verification.status !== expectedStatus) {
    errs.push(`${entry.path}: verification.status is "${pack.verification.status}", expected ${expectedStatus}`)
  }
  return errs
}

/** All item ids for one domain across every manifest entry (for classbook cross-reference). */
async function collectIds(manifest: Manifest, domain: ManifestEntry['domain']): Promise<Set<string>> {
  const ids = new Set<string>()
  for (const entry of manifest.packs) {
    if (entry.domain !== domain) continue
    const raw = JSON.parse(await readFile(join(PACKS_DIR, entry.path), 'utf8')) as { items: { id: string }[] }
    for (const it of raw.items) ids.add(it.id)
  }
  return ids
}

/**
 * Validate every committed classbook (D-034) — outside the Level-scoped manifest (a lesson
 * isn't a JLPT level), so it's checked separately: schema-valid, and every grammarId/vocabId
 * resolves against the already-validated grammar/vocab packs (catches a stale reference if a
 * point is ever renamed or removed).
 */
async function checkClassbooks(manifest: Manifest): Promise<string[]> {
  const classDir = join(PACKS_DIR, 'class')
  let files: string[]
  try {
    files = (await readdir(classDir)).filter((f) => f.endsWith('.json'))
  } catch {
    return [] // no classbooks shipped yet
  }
  if (files.length === 0) return []

  const [grammarIds, vocabIds] = await Promise.all([collectIds(manifest, 'grammar'), collectIds(manifest, 'vocab')])
  const errs: string[] = []
  for (const file of files) {
    const raw = JSON.parse(await readFile(join(classDir, file), 'utf8'))
    const res = Classbook.safeParse(raw)
    if (!res.success) {
      for (const issue of res.error.issues) errs.push(`class/${file}: ${issue.path.join('.') || '(root)'} — ${issue.message}`)
      continue
    }
    for (const lesson of res.data.lessons) {
      for (const id of lesson.grammarIds) {
        if (!grammarIds.has(id)) errs.push(`class/${file}: lesson ${lesson.lesson} references unknown grammar id "${id}"`)
      }
      for (const id of lesson.vocabIds) {
        if (!vocabIds.has(id)) errs.push(`class/${file}: lesson ${lesson.lesson} references unknown vocab id "${id}"`)
      }
    }
  }
  return errs
}

async function main(): Promise<void> {
  const manifestRes = Manifest.safeParse(
    JSON.parse(await readFile(join(PACKS_DIR, 'manifest.json'), 'utf8')),
  )
  if (!manifestRes.success) {
    console.error('manifest.json failed schema validation:')
    for (const issue of manifestRes.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
    }
    process.exit(1)
  }

  const manifest = manifestRes.data
  const allErrors: string[] = []
  let items = 0
  for (const entry of manifest.packs) {
    const bytes = await readFile(join(PACKS_DIR, entry.path))
    allErrors.push(...checkPack(entry, bytes))
    items += entry.itemCount
  }

  allErrors.push(...(await checkClassbooks(manifest)))

  if (allErrors.length > 0) {
    console.error('Pack validation FAILED:')
    for (const e of allErrors) console.error(`  - ${e}`)
    process.exit(1)
  }
  console.log(
    `Validated ${manifest.packs.length} packs, ${items} items — ` +
      `all schema-valid, provenanced (D-002), and sha256-matched.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
