import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Level } from '@hikkoshi/schemas'
import { parseJMdict, parseKanjidic } from './normalize'
import {
  joinKanji,
  joinVocab,
  type KanjiDataRecord,
  type WallerVocab,
} from './tagJoin'
import { LEVELS_IN_ORDER } from './config'
import { CONTENT_DIR, DOWNLOADS_DIR, INTERMEDIATES_DIR } from './lib/paths'
import { parseCsv } from './lib/csv'
import { emitPacks, type LockSource } from './emit'

const JLPT_FILES = [
  { file: 'jlpt-vocab-n5.csv', jlpt: 'N5' },
  { file: 'jlpt-vocab-n4.csv', jlpt: 'N4' },
  { file: 'jlpt-vocab-n3.csv', jlpt: 'N3' },
  { file: 'jlpt-vocab-n2.csv', jlpt: 'N2' },
  { file: 'jlpt-vocab-n1.csv', jlpt: 'N1' },
] as const

async function loadWaller(): Promise<WallerVocab[]> {
  const rows: WallerVocab[] = []
  for (const { file, jlpt } of JLPT_FILES) {
    const text = await readFile(join(DOWNLOADS_DIR, file), 'utf8')
    const parsed = parseCsv(text)
    for (let i = 1; i < parsed.length; i++) {
      const [expression, reading] = parsed[i]
      if (expression && reading) rows.push({ expression, reading, jlpt })
    }
  }
  return rows
}

function countByLevel(items: { level: Level }[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const level of LEVELS_IN_ORDER) counts[level] = 0
  for (const it of items) counts[it.level] = (counts[it.level] ?? 0) + 1
  return counts
}

function rate(matched: number, unmatched: number): string {
  const total = matched + unmatched
  return total === 0 ? 'n/a' : `${((100 * matched) / total).toFixed(1)}%`
}

async function main(): Promise<void> {
  await mkdir(INTERMEDIATES_DIR, { recursive: true })
  await mkdir(CONTENT_DIR, { recursive: true })

  console.log('Parsing JMdict…')
  const jm = parseJMdict(await readFile(join(DOWNLOADS_DIR, 'JMdict_e.xml'), 'utf8'))
  console.log('Parsing KANJIDIC2…')
  const kd = parseKanjidic(await readFile(join(DOWNLOADS_DIR, 'kanjidic2.xml'), 'utf8'))
  const kanjiData = JSON.parse(
    await readFile(join(DOWNLOADS_DIR, 'kanji-data.json'), 'utf8'),
  ) as Record<string, KanjiDataRecord>
  const waller = await loadWaller()
  console.log(`  JMdict entries: ${jm.length}, KANJIDIC2 chars: ${kd.length}, Waller rows: ${waller.length}`)

  const lock = JSON.parse(await readFile(join(CONTENT_DIR, 'sources.lock.json'), 'utf8')) as {
    generatedAt: string
    sources: LockSource[]
  }
  // Derive all emitted dates from the fetch time so rebuilds are deterministic:
  // output changes only when the data is re-fetched, not on every build run.
  const fetchedAt = lock.generatedAt
  const date = fetchedAt.slice(0, 10)

  const vocab = joinVocab(jm, waller)
  const kanji = joinKanji(kd, kanjiData)

  await writeFile(
    join(INTERMEDIATES_DIR, 'tagged-vocab.json'),
    JSON.stringify(vocab.items),
  )
  await writeFile(
    join(INTERMEDIATES_DIR, 'tagged-kanji.json'),
    JSON.stringify(kanji.items),
  )

  const reviewQueue = {
    generatedAt: fetchedAt,
    note: 'Community-list entries that could not be resolved to a dataset entry — not dropped, not guessed (D-002).',
    vocab: { count: vocab.unmatched.length, entries: vocab.unmatched },
    kanji: { count: kanji.unmatched.length, entries: kanji.unmatched },
  }
  await writeFile(
    join(CONTENT_DIR, 'review-queue.json'),
    JSON.stringify(reviewQueue, null, 2) + '\n',
  )

  console.log('\nVocab by level:', countByLevel(vocab.items))
  console.log('Kanji by level:', countByLevel(kanji.items))
  console.log(
    `Resolve rate — vocab ${rate(vocab.items.length, vocab.unmatched.length)} ` +
      `(${vocab.items.length} matched, ${vocab.unmatched.length} queued); ` +
      `kanji ${rate(kanji.items.length, kanji.unmatched.length)} ` +
      `(${kanji.items.length} matched, ${kanji.unmatched.length} queued)`,
  )

  const manifest = await emitPacks(vocab.items, kanji.items, lock.sources, date)
  console.log(`\nEmitted ${manifest.packs.length} packs → content/packs/ (+ manifest, ATTRIBUTION.md)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
