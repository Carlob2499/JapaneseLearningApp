import type { KanjiItem, Level, VocabItem } from '@hikkoshi/schemas'
import type { JMEntry, KDEntry } from './normalize'
import { JLPT_TO_LEVEL } from './config'

const LEVEL_ORDER: readonly Level[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5']
const SENSE_CAP = 6
const GLOSS_CAP = 6

type Jlpt = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

/** One row of a community vocab list: an expression + reading tagged to a JLPT level. */
export interface WallerVocab {
  expression: string
  reading: string
  jlpt: Jlpt
}

export interface VocabJoinResult {
  items: VocabItem[]
  unmatched: { expression: string; reading: string; levels: Level[]; reason: string }[]
}

export interface KanjiDataRecord {
  jlpt_new?: number | null
  jlpt_old?: number | null
  grade?: number | null
  freq?: number | null
  meanings?: string[]
  readings_on?: string[]
  readings_kun?: string[]
}

export interface KanjiJoinResult {
  items: KanjiItem[]
  unmatched: { literal: string; jlptNew: number; reason: string }[]
}

function lowestLevel(levels: Iterable<Level>): Level {
  let best: Level = 'L5'
  for (const l of levels) if (LEVEL_ORDER.indexOf(l) < LEVEL_ORDER.indexOf(best)) best = l
  return best
}

function capSenses(senses: JMEntry['senses']): { gloss: string[]; pos: string[] }[] {
  return senses
    .slice(0, SENSE_CAP)
    .map((s) => ({ gloss: s.gloss.slice(0, GLOSS_CAP), pos: s.pos }))
    .filter((s) => s.gloss.length > 0)
}

/**
 * The community lists pack alternates into one cell (`足; 脚`, reading
 * `いく; ゆく`) and use `～` as a placeholder. Expand to the individual clean
 * forms so each can be matched exactly against JMdict — never a fuzzy guess.
 */
function variants(cell: string): string[] {
  const seen = new Set<string>()
  for (const part of cell.split(/[;/、]/)) {
    const v = part.trim().replace(/[～~]/g, '')
    if (v.length > 0) seen.add(v)
  }
  return [...seen]
}

/** 5-hex lowercase codepoint — KanjiVG's filename scheme (e.g. 水 → "06c34"). */
export function kanjivgId(literal: string): string {
  const cp = literal.codePointAt(0)
  if (cp === undefined) throw new Error(`empty literal`)
  return cp.toString(16).padStart(5, '0')
}

/**
 * Join community vocab tags to JMdict. The list decides membership + estimated
 * level; JMdict supplies the verified reading/senses. Match strictly on
 * expression+reading; fall back to a unique reading-only match; otherwise route
 * to the review queue (never guess).
 */
export function joinVocab(entries: JMEntry[], waller: WallerVocab[]): VocabJoinResult {
  const byKebReb = new Map<string, JMEntry>()
  const byReading = new Map<string, JMEntry[]>()
  for (const e of entries) {
    for (const reb of e.rebs) {
      const keys = e.kebs.length > 0 ? e.kebs.map((k) => `${k}|${reb}`) : [`${reb}|${reb}`]
      for (const k of keys) if (!byKebReb.has(k)) byKebReb.set(k, e)
      const list = byReading.get(reb)
      if (list) list.push(e)
      else byReading.set(reb, [e])
    }
  }

  // Collapse duplicate (expression|reading) rows, unioning their levels.
  const merged = new Map<string, { expression: string; reading: string; levels: Set<Level> }>()
  for (const w of waller) {
    const key = `${w.expression}|${w.reading}`
    const level = JLPT_TO_LEVEL[w.jlpt]
    const cur = merged.get(key)
    if (cur) cur.levels.add(level)
    else merged.set(key, { expression: w.expression, reading: w.reading, levels: new Set([level]) })
  }

  const items: VocabItem[] = []
  const unmatched: VocabJoinResult['unmatched'] = []
  const seen = new Set<string>()
  for (const { expression, reading, levels } of merged.values()) {
    const level = lowestLevel(levels)
    const spread = [...levels].sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b))
    const exprCands = variants(expression)
    const readCands = variants(reading)

    // Prefer an exact expression+reading form; then a unique reading-only match.
    let entry: JMEntry | undefined
    let matchedExpr = exprCands[0] ?? expression
    let matchedReading = readCands[0] ?? reading
    outer: for (const e of exprCands) {
      for (const r of readCands) {
        const hit = byKebReb.get(`${e}|${r}`)
        if (hit) {
          entry = hit
          matchedExpr = e
          matchedReading = r
          break outer
        }
      }
    }
    if (!entry) {
      for (const r of readCands) {
        const cands = byReading.get(r)
        if (cands && cands.length === 1) {
          entry = cands[0]
          matchedExpr = entry.kebs[0] ?? r
          matchedReading = r
          break
        }
      }
    }
    if (!entry) {
      unmatched.push({ expression, reading, levels: spread, reason: 'no JMdict entry' })
      continue
    }

    const dedupKey = `${entry.seq}:${matchedReading}`
    if (seen.has(dedupKey)) continue
    const senses = capSenses(entry.senses)
    if (senses.length === 0) {
      unmatched.push({ expression, reading, levels: spread, reason: 'no English senses' })
      continue
    }
    seen.add(dedupKey)
    items.push({
      kind: 'vocab',
      id: `vocab:${entry.seq}:${matchedReading}`,
      jmdictSeq: entry.seq,
      expression: matchedExpr,
      reading: matchedReading,
      senses,
      level,
      ...(spread.length > 1 ? { levelSpread: spread } : {}),
      modules: [],
    })
  }
  return { items, unmatched }
}

/**
 * Join community kanji tags (jlpt_new) to KANJIDIC2. jlpt_new decides membership
 * + estimated level; KANJIDIC2 supplies verified readings/meanings/grade/freq.
 */
export function joinKanji(
  kd: KDEntry[],
  kanjiData: Record<string, KanjiDataRecord>,
): KanjiJoinResult {
  const byLiteral = new Map(kd.map((k) => [k.literal, k]))
  const items: KanjiItem[] = []
  const unmatched: KanjiJoinResult['unmatched'] = []

  for (const [literal, rec] of Object.entries(kanjiData)) {
    const jn = rec.jlpt_new
    if (jn == null || jn < 1 || jn > 5) continue
    const level = JLPT_TO_LEVEL[`N${jn}` as Jlpt]
    const entry = byLiteral.get(literal)
    if (!entry) {
      unmatched.push({ literal, jlptNew: jn, reason: 'not in KANJIDIC2' })
      continue
    }
    const meanings = entry.meanings.length > 0 ? entry.meanings : (rec.meanings ?? [])
    if (meanings.length === 0) {
      unmatched.push({ literal, jlptNew: jn, reason: 'no English meaning' })
      continue
    }
    const jlptOld =
      entry.jlptOld === 1 || entry.jlptOld === 2 || entry.jlptOld === 3 || entry.jlptOld === 4
        ? entry.jlptOld
        : undefined
    items.push({
      kind: 'kanji',
      id: `kanji:${literal}`,
      literal,
      level,
      ...(jlptOld !== undefined ? { jlptOld } : {}),
      ...(entry.grade !== undefined ? { grade: entry.grade } : {}),
      ...(entry.freq !== undefined ? { freq: entry.freq } : {}),
      strokes: { kanjivgId: kanjivgId(literal) },
      readingsOn: entry.on,
      readingsKun: entry.kun,
      meanings,
    })
  }
  return { items, unmatched }
}
