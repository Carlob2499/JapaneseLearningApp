import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { KanjiItem, StrokeItem } from '@hikkoshi/schemas'
import { curlDownload, sha256 } from './lib/io'
import { CACHE_DIR } from './lib/paths'

/** Pinned KanjiVG release — immutable tag for reproducibility. */
export const KANJIVG_TAG = 'r20250816'
export const KANJIVG_LICENSE = 'CC-BY-SA-3.0'
export const KANJIVG_ATTRIBUTION =
  'Kanji stroke-order data © Ulrich Apel / KanjiVG (https://kanjivg.tagaini.net), CC BY-SA 3.0; ShareAlike applies to derived stroke data.'

const KANJIVG_CACHE = join(CACHE_DIR, 'kanjivg')
const CONCURRENCY = 8

// github.com release assets are egress-blocked; the per-character SVGs live in
// the repo tree and are reachable via raw.githubusercontent (jsDelivr fallback).
const rawUrl = (cp: string) =>
  `https://raw.githubusercontent.com/KanjiVG/kanjivg/${KANJIVG_TAG}/kanji/${cp}.svg`
const jsdelivrUrl = (cp: string) =>
  `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@${KANJIVG_TAG}/kanji/${cp}.svg`

/** Extract the ordered stroke paths from a KanjiVG SVG (ignores StrokeNumbers text). */
export function parseStrokeSvg(svg: string): {
  viewBox: string
  strokes: string[]
  strokeCount: number
} {
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? '0 0 109 109'
  const strokes: { n: number; d: string }[] = []
  for (const m of svg.matchAll(/<path\b[^>]*>/g)) {
    const tag = m[0]
    const idM = /id="kvg:[0-9a-f]+-s(\d+)"/.exec(tag)
    const dM = /\bd="([^"]+)"/.exec(tag)
    if (idM && dM) strokes.push({ n: Number(idM[1]), d: dM[1] })
  }
  strokes.sort((a, b) => a.n - b.n)
  return { viewBox, strokes: strokes.map((s) => s.d), strokeCount: strokes.length }
}

async function readValid(path: string): Promise<string | null> {
  if (!existsSync(path)) return null
  const s = await readFile(path, 'utf8')
  return s.includes('</svg>') ? s : null
}

/** Fetch one SVG (cache → raw → jsDelivr, with retries); null if unreachable. Exported for the
 *  kana builder (D-023), which draws stroke data from the same pinned KanjiVG tree. */
export async function fetchKanjiVgSvg(cp: string): Promise<string | null> {
  const cached = join(KANJIVG_CACHE, `${cp}.svg`)
  const hit = await readValid(cached)
  if (hit) return hit
  for (const url of [rawUrl(cp), jsdelivrUrl(cp)]) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await curlDownload(url, cached)
        const s = await readValid(cached)
        if (s) return s
      } catch {
        // fall through to retry / fallback host
      }
    }
  }
  return null
}

async function pool<T, R>(items: T[], worker: (t: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0
  async function run(): Promise<void> {
    while (cursor < items.length) {
      const idx = cursor++
      results[idx] = await worker(items[idx])
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, run))
  return results
}

export interface StrokeBuildResult {
  items: StrokeItem[]
  unmatched: { literal: string; kanjivgId: string }[]
  lockEntry: {
    key: string
    name: string
    url: string
    sha256: string
    retrieved: string
    license: string
    attribution: string
    datasetTag: string
    fileCount: number
  }
}

/** Fetch + extract stroke data for the taught kanji; returns items + a lock entry. */
export async function buildStrokeItems(
  kanjiItems: KanjiItem[],
  fetchedAt: string,
): Promise<StrokeBuildResult> {
  await mkdir(KANJIVG_CACHE, { recursive: true })
  // One entry per literal, deterministically ordered by codepoint.
  const uniq = [...new Map(kanjiItems.map((k) => [k.literal, k])).values()].sort((a, b) =>
    a.strokes.kanjivgId < b.strokes.kanjivgId ? -1 : a.strokes.kanjivgId > b.strokes.kanjivgId ? 1 : 0,
  )

  const fetched = await pool(uniq, async (k) => ({ k, svg: await fetchKanjiVgSvg(k.strokes.kanjivgId) }))

  const items: StrokeItem[] = []
  const unmatched: { literal: string; kanjivgId: string }[] = []
  const hashes: string[] = []
  for (const { k, svg } of fetched) {
    if (!svg) {
      unmatched.push({ literal: k.literal, kanjivgId: k.strokes.kanjivgId })
      continue
    }
    const { viewBox, strokes, strokeCount } = parseStrokeSvg(svg)
    if (strokeCount === 0) {
      unmatched.push({ literal: k.literal, kanjivgId: k.strokes.kanjivgId })
      continue
    }
    hashes.push(sha256(Buffer.from(svg)))
    items.push({
      kind: 'strokes',
      id: `strokes:${k.literal}`,
      literal: k.literal,
      level: k.level,
      kanjivgId: k.strokes.kanjivgId,
      viewBox,
      strokes,
      strokeCount,
    })
  }

  return {
    items,
    unmatched,
    lockEntry: {
      key: 'kanjivg',
      name: 'KanjiVG',
      url: `https://github.com/KanjiVG/kanjivg (tag ${KANJIVG_TAG})`,
      sha256: sha256(Buffer.from(hashes.sort().join(''))), // digest over per-file hashes
      retrieved: fetchedAt,
      license: KANJIVG_LICENSE,
      attribution: KANJIVG_ATTRIBUTION,
      datasetTag: KANJIVG_TAG,
      fileCount: items.length,
    },
  }
}
