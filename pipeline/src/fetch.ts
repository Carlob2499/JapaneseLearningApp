import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  ALL_SOURCES,
  EDRDG_LICENCE_MUST_CONTAIN,
  EDRDG_LICENCE_URL,
  type SourceSpec,
} from './config'
import { bunzip2To, curlDownload, curlText, gunzipIf, sha256 } from './lib/io'
import { CONTENT_DIR, DOWNLOADS_DIR } from './lib/paths'

interface LockEntry {
  key: string
  name: string
  url: string
  sha256: string
  bytes: number
  retrieved: string
  license: string
  attribution: string
  datasetDate?: string
}

/** Pull the dataset's own internal creation date, for provenance beyond our fetch time. */
function extractDatasetDate(key: string, xml: string): string | undefined {
  if (key === 'jmdict') return /JMdict created:\s*([0-9-]+)/.exec(xml)?.[1]
  if (key === 'kanjidic2') return /<date_of_creation>([0-9-]+)<\/date_of_creation>/.exec(xml)?.[1]
  return undefined
}

async function verifyEdrdgLicence(): Promise<void> {
  const page = await curlText(EDRDG_LICENCE_URL)
  for (const needle of EDRDG_LICENCE_MUST_CONTAIN) {
    if (!page.includes(needle)) {
      throw new Error(
        `EDRDG licence page no longer contains ${JSON.stringify(needle)} — ` +
          `license may have changed; halting (re-verify before shipping).`,
      )
    }
  }
}

async function fetchSource(src: SourceSpec): Promise<LockEntry> {
  const rawPath = join(DOWNLOADS_DIR, `_raw_${src.key}`)
  await curlDownload(src.url, rawPath)
  const raw = await readFile(rawPath) // compressed artifact — hashed for provenance
  const outPath = join(DOWNLOADS_DIR, src.outfile)
  let text = ''
  if (src.compression === 'gzip') {
    const content = gunzipIf(raw, true)
    await writeFile(outPath, content)
    text = content.toString('utf8') // only EDRDG gzip carries an internal creation date
  } else if (src.compression === 'bzip2') {
    await bunzip2To(rawPath, outPath) // streamed — keeps memory flat for the 24 MB eng export
  } else {
    await writeFile(outPath, raw)
  }
  return {
    key: src.key,
    name: src.name,
    url: src.url,
    sha256: sha256(raw),
    bytes: raw.length,
    retrieved: new Date().toISOString(),
    license: src.license,
    attribution: src.attribution,
    datasetDate: text ? extractDatasetDate(src.key, text) : undefined,
  }
}

async function main(): Promise<void> {
  await mkdir(DOWNLOADS_DIR, { recursive: true })
  await mkdir(CONTENT_DIR, { recursive: true })

  console.log('Re-verifying EDRDG licence…')
  await verifyEdrdgLicence()

  const sources: LockEntry[] = []
  for (const src of ALL_SOURCES) {
    process.stdout.write(`Fetching ${src.name} … `)
    const entry = await fetchSource(src)
    sources.push(entry)
    console.log(`${(entry.bytes / 1024).toFixed(0)} KiB  sha256=${entry.sha256.slice(0, 12)}…`)
  }

  const lock = {
    generatedAt: new Date().toISOString(),
    tool: 'pipeline/fetch',
    note:
      'Language data ingested from canonical EDRDG XML (github-hosted jmdict-simplified ' +
      'JSON is egress-blocked in the build environment). See docs/decisions.md D-007.',
    sources,
  }
  await writeFile(join(CONTENT_DIR, 'sources.lock.json'), JSON.stringify(lock, null, 2) + '\n')
  console.log(`\nWrote content/sources.lock.json (${sources.length} sources).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
