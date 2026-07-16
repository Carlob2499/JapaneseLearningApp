import type { KanaItem, StrokeItem } from '@hikkoshi/schemas'
import { fetchKanjiVgSvg, parseStrokeSvg } from './kanjivg'

/**
 * The gojūon table (D-023): base 46 + voiced/semi-voiced 25, per script — 142 single-glyph
 * kana. Each entry pairs the hiragana and katakana glyphs so the two scripts can never drift
 * apart. Romaji follows Hepburn (the convention cited at the pack level); `alt` lists accepted
 * input variants (kunrei/wāpuro spellings) so typed grading never fails a correct learner.
 *
 * Row order IS the curriculum: packs emit in this order (each script: base+voiced rows, then the
 * yōon rows below), and the scheduler's intro budget walks the pool in order, so a beginner meets
 * kana row-by-row — the blocked introduction E3 prescribes and kana-pedagogy references recommend.
 *
 * Sokuon (っ/ッ) and the chōonpu (ー) are deliberately out of scope (D-029): they are orthographic
 * modifiers with no standalone syllable or romaji, so they don't fit the sound-drill card model —
 * they're learned inside real words/sentences, and this is disclosed in the app.
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

/**
 * Yōon (拗音) — the 33 contracted syllables per script (D-029): an i-row consonant kana + a small
 * ya/yu/yo (きゃ, しゅ, ちょ…). Each is one syllable with a single Hepburn romaji, drilled exactly
 * like a base kana; `alt` carries the kunrei/wāpuro spellings (sya, tyu, zya…). The archaic ぢゃ
 * row is omitted — it is essentially unused in modern Japanese (standard teaching, Genki/Tofugu).
 * Stroke data is the base glyph's plus the small glyph's, joined per component (see buildKanaItems).
 */
export const YOON_ROWS: readonly KanaRow[] = [
  { row: 'kya', entries: [
    { h: 'きゃ', k: 'キャ', romaji: 'kya' }, { h: 'きゅ', k: 'キュ', romaji: 'kyu' }, { h: 'きょ', k: 'キョ', romaji: 'kyo' },
  ] },
  { row: 'sha', entries: [
    { h: 'しゃ', k: 'シャ', romaji: 'sha', alt: ['sya'] }, { h: 'しゅ', k: 'シュ', romaji: 'shu', alt: ['syu'] }, { h: 'しょ', k: 'ショ', romaji: 'sho', alt: ['syo'] },
  ] },
  { row: 'cha', entries: [
    { h: 'ちゃ', k: 'チャ', romaji: 'cha', alt: ['tya'] }, { h: 'ちゅ', k: 'チュ', romaji: 'chu', alt: ['tyu'] }, { h: 'ちょ', k: 'チョ', romaji: 'cho', alt: ['tyo'] },
  ] },
  { row: 'nya', entries: [
    { h: 'にゃ', k: 'ニャ', romaji: 'nya' }, { h: 'にゅ', k: 'ニュ', romaji: 'nyu' }, { h: 'にょ', k: 'ニョ', romaji: 'nyo' },
  ] },
  { row: 'hya', entries: [
    { h: 'ひゃ', k: 'ヒャ', romaji: 'hya' }, { h: 'ひゅ', k: 'ヒュ', romaji: 'hyu' }, { h: 'ひょ', k: 'ヒョ', romaji: 'hyo' },
  ] },
  { row: 'mya', entries: [
    { h: 'みゃ', k: 'ミャ', romaji: 'mya' }, { h: 'みゅ', k: 'ミュ', romaji: 'myu' }, { h: 'みょ', k: 'ミョ', romaji: 'myo' },
  ] },
  { row: 'rya', entries: [
    { h: 'りゃ', k: 'リャ', romaji: 'rya' }, { h: 'りゅ', k: 'リュ', romaji: 'ryu' }, { h: 'りょ', k: 'リョ', romaji: 'ryo' },
  ] },
  { row: 'gya', entries: [
    { h: 'ぎゃ', k: 'ギャ', romaji: 'gya' }, { h: 'ぎゅ', k: 'ギュ', romaji: 'gyu' }, { h: 'ぎょ', k: 'ギョ', romaji: 'gyo' },
  ] },
  { row: 'ja', entries: [
    { h: 'じゃ', k: 'ジャ', romaji: 'ja', alt: ['zya', 'jya'] }, { h: 'じゅ', k: 'ジュ', romaji: 'ju', alt: ['zyu', 'jyu'] }, { h: 'じょ', k: 'ジョ', romaji: 'jo', alt: ['zyo', 'jyo'] },
  ] },
  { row: 'bya', entries: [
    { h: 'びゃ', k: 'ビャ', romaji: 'bya' }, { h: 'びゅ', k: 'ビュ', romaji: 'byu' }, { h: 'びょ', k: 'ビョ', romaji: 'byo' },
  ] },
  { row: 'pya', entries: [
    { h: 'ぴゃ', k: 'ピャ', romaji: 'pya' }, { h: 'ぴゅ', k: 'ピュ', romaji: 'pyu' }, { h: 'ぴょ', k: 'ピョ', romaji: 'pyo' },
  ] },
]

/** Every row in curriculum order for one script: base + voiced singles, then the yōon compounds. */
export const ALL_ROWS: readonly KanaRow[] = [...KANA_ROWS, ...YOON_ROWS]

/** KanjiVG file id for a single-glyph character — 5-hex-digit lowercase codepoint. */
export function kanjivgIdFor(char: string): string {
  return char.codePointAt(0)!.toString(16).padStart(5, '0')
}

/** The KanjiVG id per component glyph: [self] for a base kana, [base, small] for a yōon (きゃ→き,ゃ). */
export function kanjivgIdsFor(char: string): string[] {
  return [...char].map(kanjivgIdFor)
}

/**
 * All 208 kana items in curriculum order (D-029): for each script (hiragana, then katakana), the
 * base + voiced singles, then the yōon compounds. So a beginner completes hiragana (singles then
 * yōon) before katakana — the standard sequence.
 */
export function buildKanaItems(): KanaItem[] {
  const items: KanaItem[] = []
  for (const script of ['hiragana', 'katakana'] as const) {
    for (const { row, entries } of ALL_ROWS) {
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
          kanjivgIds: kanjivgIdsFor(char),
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

/**
 * Fetch KanjiVG stroke data for every *component* glyph the kana reference (same pinned tag +
 * cache as the kanji build). A yōon references two components (base + small ゃゅょ), so the
 * component set is the 142 singles plus the 6 small glyphs = 148 unique stroke items, keyed by
 * KanjiVG id. Each `kanjivgIds` entry a kana lists must resolve to one of these.
 */
export async function buildKanaStrokes(kana: KanaItem[]): Promise<KanaStrokeResult> {
  // Unique component glyphs across all kana, recovered from their KanjiVG ids (= hex codepoints).
  const componentIds = [...new Set(kana.flatMap((k) => k.kanjivgIds))].sort()
  const components = componentIds.map((id) => ({ id, char: String.fromCodePoint(parseInt(id, 16)) }))

  const strokes: StrokeItem[] = []
  const unmatched: string[] = []
  for (let i = 0; i < components.length; i += CONCURRENCY) {
    const batch = components.slice(i, i + CONCURRENCY)
    const fetched = await Promise.all(batch.map(async (c) => ({ c, svg: await fetchKanjiVgSvg(c.id) })))
    for (const { c, svg } of fetched) {
      if (!svg) {
        unmatched.push(c.char)
        continue
      }
      const { viewBox, strokes: paths, strokeCount } = parseStrokeSvg(svg)
      if (strokeCount === 0) {
        unmatched.push(c.char)
        continue
      }
      strokes.push({
        kind: 'strokes',
        id: `strokes:${c.char}`,
        literal: c.char,
        level: 'L0',
        kanjivgId: c.id,
        viewBox,
        strokes: paths,
        strokeCount,
      })
    }
  }
  return { strokes, unmatched }
}
