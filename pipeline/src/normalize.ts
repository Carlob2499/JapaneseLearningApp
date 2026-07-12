import { decodeXml } from './lib/xml'

/** A normalized JMdict entry: kanji forms, readings, and senses (pos codes + glosses). */
export interface JMEntry {
  seq: number
  kebs: string[]
  rebs: string[]
  senses: { pos: string[]; gloss: string[] }[]
}

/** A normalized KANJIDIC2 character. */
export interface KDEntry {
  literal: string
  grade?: number
  freq?: number
  jlptOld?: number
  strokeCount?: number
  on: string[]
  kun: string[]
  meanings: string[]
}

function toNum(s: string | undefined): number | undefined {
  return s === undefined ? undefined : Number(s)
}

/**
 * Parse JMdict XML by scanning `<entry>` blocks. Reading the raw (unexpanded)
 * text is deliberate: `<pos>&n;</pos>` yields the short code `n` directly, with
 * no DTD entity expansion to unwind.
 */
export function parseJMdict(xml: string): JMEntry[] {
  const entries: JMEntry[] = []
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const body = m[1]
    const seq = toNum(/<ent_seq>(\d+)<\/ent_seq>/.exec(body)?.[1])
    if (seq === undefined) continue
    const kebs = [...body.matchAll(/<keb>([^<]*)<\/keb>/g)].map((x) => decodeXml(x[1]))
    const rebs = [...body.matchAll(/<reb>([^<]*)<\/reb>/g)].map((x) => decodeXml(x[1]))
    const senses = [...body.matchAll(/<sense>([\s\S]*?)<\/sense>/g)]
      .map((sm) => {
        const sb = sm[1]
        const pos = [...sb.matchAll(/<pos>&([^;]+);<\/pos>/g)].map((x) => x[1])
        const gloss = [...sb.matchAll(/<gloss[^>]*>([^<]*)<\/gloss>/g)].map((x) => decodeXml(x[1]))
        return { pos, gloss }
      })
      .filter((s) => s.gloss.length > 0)
    entries.push({ seq, kebs, rebs, senses })
  }
  return entries
}

/**
 * Parse KANJIDIC2 XML by scanning `<character>` blocks. English meanings are
 * the `<meaning>` elements with no `m_lang` attribute; other languages carry
 * `m_lang="…"` and are skipped by the attribute-free match.
 */
export function parseKanjidic(xml: string): KDEntry[] {
  const out: KDEntry[] = []
  for (const m of xml.matchAll(/<character>([\s\S]*?)<\/character>/g)) {
    const b = m[1]
    const literal = /<literal>(.*?)<\/literal>/.exec(b)?.[1]
    if (!literal) continue
    out.push({
      literal,
      grade: toNum(/<grade>(\d+)<\/grade>/.exec(b)?.[1]),
      freq: toNum(/<freq>(\d+)<\/freq>/.exec(b)?.[1]),
      jlptOld: toNum(/<jlpt>(\d+)<\/jlpt>/.exec(b)?.[1]),
      strokeCount: toNum(/<stroke_count>(\d+)<\/stroke_count>/.exec(b)?.[1]),
      on: [...b.matchAll(/<reading r_type="ja_on">([^<]*)<\/reading>/g)].map((x) => x[1]),
      kun: [...b.matchAll(/<reading r_type="ja_kun">([^<]*)<\/reading>/g)].map((x) => x[1]),
      meanings: [...b.matchAll(/<meaning>([^<]*)<\/meaning>/g)].map((x) => decodeXml(x[1])),
    })
  }
  return out
}
