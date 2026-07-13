import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Manifest, type ManifestEntry, Pack } from '@hikkoshi/schemas'
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
