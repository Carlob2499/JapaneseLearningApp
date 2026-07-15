import type { KanaItem, StrokeItem } from '@hikkoshi/schemas'
import { fetchKanjiVgSvg, parseStrokeSvg } from './kanjivg'

/**
 * The gojūon table (D-023): base 46 + voiced/semi-voiced 25, per script — 142 single-glyph
 * kana. Each entry pairs the hiragana and katakana glyphs so the two scripts can never drift
 * apart. Romaji follows Hepburn (the convention cited at the pack level); `alt` lists accepted
 * input variants (kunrei/wāpuro spellings) so typed grading never fails a correct learner.
 * Yōon combos (きゃ…) and small variants (ぁ っ) are deliberately out of scope — two-glyph or
 * no standalone romaji — and disclosed in the app (D-023).
 *
 * Row order IS the curriculum: packs emit in this order (hiragana fully, then katakana), and the
 * scheduler's intro budget walks the pool in order, so a beginner meets kana row-by-row —
 * the blocked introduction E3 prescribes and kana-pedagogy references recommend.
 */
interface KanaEntry {
  h: string
  k: string
  romaji: string
  alt?: string[]
}
interface KanaRow {
  row: string
  entries: KanaEntry[]
}

export const KANA_ROWS: readonly KanaRow[] = [
  {
    row: 'a',
    entries: [
      { h: 'あ', k: 'ア', romaji: 'a' },
      { h: 'い', k: 'イ', romaji: 'i' },
      { h: 'う', k: 'ウ', romaji: 'u' },
      { h: 'え', k: 'エ', romaji: 'e' },
      { h: 'お', k: 'オ', romaji: 'o' },
    ],
  },
  {
    row: 'ka',
    entries: [
      { h: 'か', k: 'カ', romaji: 'ka' },
      { h: 'き', k: 'キ', romaji: 'ki' },
      { h: 'く', k: 'ク', romaji: 'ku' },
      { h: 'け', k: 'ケ', romaji: 'ke' },
      { h: 'こ', k: 'コ', romaji: 'ko' },
    ],
  },
  {
    row: 'sa',
    entries: [
      { h: 'さ', k: 'サ', romaji: 'sa' },
      { h: 'し', k: 'シ', romaji: 'shi', alt: ['si'] },
      { h: 'す', k: 'ス', romaji: 'su' },
      { h: 'せ', k: 'セ', romaji: 'se' },
      { h: 'そ', k: 'ソ', romaji: 'so' },
    ],
  },
  {
    row: 'ta',
    entries: [
      { h: 'た', k: 'タ', romaji: 'ta' },
      { h: 'ち', k: 'チ', romaji: 'chi', alt: ['ti'] },
      { h: 'つ', k: 'ツ', romaji: 'tsu', alt: ['tu'] },
      { h: 'て', k: 'テ', romaji: 'te' },
      { h: 'と', k: 'ト', romaji: 'to' },
    ],
  },
  {
    row: 'na',
    entries: [
      { h: 'な', k: 'ナ', romaji: 'na' },
      { h: 'に', k: 'ニ', romaji: 'ni' },
      { h: 'ぬ', k: 'ヌ', romaji: 'nu' },
      { h: 'ね', k: 'ネ', romaji: 'ne' },
      { h: 'の', k: 'ノ', romaji: 'no' },
    ],
  },
  {
    row: 'ha',
    entries: [
      { h: 'は', k: 'ハ', romaji: 'ha' },
      { h: 'ひ', k: 'ヒ', romaji: 'hi' },
      { h: 'ふ', k: 'フ', romaji: 'fu', alt: ['hu'] },
      { h: 'へ', k: 'ヘ', romaji: 'he' },
      { h: 'ほ', k: 'ホ', romaji: 'ho' },
    ],
  },
  {
    row: 'ma',
    entries: [
      { h: 'ま', k: 'マ', romaji: 'ma' },
      { h: 'み', k: 'ミ', romaji: 'mi' },
      { h: 'む', k: 'ム', romaji: 'mu' },
      { h: 'め', k: 'メ', romaji: 'me' },
      { h: 'も', k: 'モ', romaji: 'mo' },
    ],
  },
  {
    row: 'ya',
    entries: [
      { h: 'や', k: 'ヤ', romaji: 'ya' },
      { h: 'ゆ', k: 'ユ', romaji: 'yu' },
      { h: 'よ', k: 'ヨ', romaji: 'yo' },
    ],
  },
  {
    row: 'ra',
    entries: [
      { h: 'ら', k: 'ラ', romaji: 'ra' },
      { h: 'り', k: 'リ', romaji: 'ri' },
      { h: 'る', k: 'ル', romaji: 'ru' },
      { h: 'れ', k: 'レ', romaji: 're' },
      { h: 'ろ', k: 'ロ', romaji: 'ro' },
    ],
  },
  {
    row: 'wa',
    entries: [
      { h: 'わ', k: 'ワ', romaji: 'wa' },
      { h: 'を', k: 'ヲ', romaji: 'wo', alt: ['o'] },
      { h: 'ん', k: 'ン', romaji: 'n', alt: ['nn'] },
    ],
  },
  {
    row: 'ga',
    entries: [
      { h: 'が', k: 'ガ', romaji: 'ga' },
      { h: 'ぎ', k: 'ギ', romaji: 'gi' },
      { h: 'ぐ', k: 'グ', romaji: 'gu' },
      { h: 'げ', k: 'ゲ', romaji: 'ge' },
      { h: 'ご', k: 'ゴ', romaji: 'go' },
    ],
  },
  {
    row: 'za',
    entries: [
      { h: 'ざ', k: 'ザ', romaji: 'za' },
      { h: 'じ', k: 'ジ', romaji: 'ji', alt: ['zi'] },
      { h: 'ず', k: 'ズ', romaji: 'zu' },
      { h: 'ぜ', k: 'ゼ', romaji: 'ze' },
      { h: 'ぞ', k: 'ゾ', romaji: 'zo' },
    ],
  },
  {
    row: 'da',
    entries: [
      { h: 'だ', k: 'ダ', romaji: 'da' },
      { h: 'ぢ', k: 'ヂ', romaji: 'ji', alt: ['di'] },
      { h: 'づ', k: 'ヅ', romaji: 'zu', alt: ['du'] },
      { h: 'で', k: 'デ', romaji: 'de' },
      { h: 'ど', k: 'ド', romaji: 'do' },
    ],
  },
  {
    row: 'ba',
    entries: [
      { h: 'ば', k: 'バ', romaji: 'ba' },
      { h: 'び', k: 'ビ', romaji: 'bi' },
      { h: 'ぶ', k: 'ブ', romaji: 'bu' },
      { h: 'べ', k: 'ベ', romaji: 'be' },
      { h: 'ぼ', k: 'ボ', romaji: 'bo' },
    ],
  },
  {
    row: 'pa',
    entries: [
      { h: 'ぱ', k: 'パ', romaji: 'pa' },
      { h: 'ぴ', k: 'ピ', romaji: 'pi' },
      { h: 'ぷ', k: 'プ', romaji: 'pu' },
      { h: 'ぺ', k: 'ペ', romaji: 'pe' },
      { h: 'ぽ', k: 'ポ', romaji: 'po' },
    ],
  },
]

/** KanjiVG file id for a single-glyph character — 5-hex-digit lowercase codepoint. */
export function kanjivgIdFor(char: string): string {
  return char.codePointAt(0)!.toString(16).padStart(5, '0')
}

/** All 142 kana items in curriculum order: hiragana rows first, then katakana rows. */
export function buildKanaItems(): KanaItem[] {
  const items: KanaItem[] = []
  for (const script of ['hiragana', 'katakana'] as const) {
    for (const { row, entries } of KANA_ROWS) {
      for (const e of entries) {
        const char = script === 'hiragana' ? e.h : e.k
        items.push({
          kind: 'kana',
          id: `kana:${char}`,
          char,
          script,
          romaji: e.romaji,
          ...(e.alt ? { altRomaji: e.alt } : {}),
          row,
          kanjivgId: kanjivgIdFor(char),
          level: 'L0',
        })
      }
    }
  }
  return items
}

const CONCURRENCY = 8

export interface KanaStrokeResult {
  strokes: StrokeItem[]
  unmatched: string[]
}

/** Fetch KanjiVG stroke data for every kana (same pinned tag + cache as the kanji build). */
export async function buildKanaStrokes(kana: KanaItem[]): Promise<KanaStrokeResult> {
  const strokes: StrokeItem[] = []
  const unmatched: string[] = []
  for (let i = 0; i < kana.length; i += CONCURRENCY) {
    const batch = kana.slice(i, i + CONCURRENCY)
    const fetched = await Promise.all(batch.map(async (k) => ({ k, svg: await fetchKanjiVgSvg(k.kanjivgId) })))
    for (const { k, svg } of fetched) {
      if (!svg) {
        unmatched.push(k.char)
        continue
      }
      const { viewBox, strokes: paths, strokeCount } = parseStrokeSvg(svg)
      if (strokeCount === 0) {
        unmatched.push(k.char)
        continue
      }
      strokes.push({
        kind: 'strokes',
        id: `strokes:${k.char}`,
        literal: k.char,
        level: 'L0',
        kanjivgId: k.kanjivgId,
        viewBox,
        strokes: paths,
        strokeCount,
      })
    }
  }
  return { strokes, unmatched }
}
