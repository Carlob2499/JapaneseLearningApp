import type { Level } from '@hikkoshi/schemas'

/**
 * Pipeline configuration: dataset sources and the JLPT→app-level map.
 *
 * NOTE (provenance): we ingest the canonical EDRDG XML directly. The originally
 * planned `scriptin/jmdict-simplified` JSON is served only from github.com
 * release assets, which are egress-blocked in this build environment, whereas
 * ftp.edrdg.org is reachable. Parsing the raw XML text also sidesteps the
 * XML-entity trap: the on-disk file contains short codes verbatim (e.g.
 * `<pos>&n;</pos>`), so we read the code `n` without DTD expansion. Data is
 * first-party from EDRDG (CC BY-SA 4.0). See D-007.
 */

export type Compression = 'gzip' | 'bzip2' | 'none'

export interface SourceSpec {
  readonly key: string
  readonly name: string
  readonly url: string
  readonly compression: Compression
  readonly outfile: string
  /** Expected SPDX license id recorded into sources.lock.json. */
  readonly license: string
  /** On-screen / docs attribution string (curriculum.md §3.4). */
  readonly attribution: string
}

/** EDRDG dictionaries — the dataset-verified language payload. */
export const EDRDG_SOURCES: readonly SourceSpec[] = [
  {
    key: 'jmdict',
    name: 'JMdict (English)',
    url: 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz',
    compression: 'gzip',
    outfile: 'JMdict_e.xml',
    license: 'CC-BY-SA-4.0',
    attribution:
      'JMdict — James William Breen and The Electronic Dictionary Research and Development Group; JMdict/EDICT project (https://www.edrdg.org/jmdict/j_jmdict.html).',
  },
  {
    key: 'kanjidic2',
    name: 'KANJIDIC2',
    url: 'http://ftp.edrdg.org/pub/Nihongo/kanjidic2.xml.gz',
    compression: 'gzip',
    outfile: 'kanjidic2.xml',
    license: 'CC-BY-SA-4.0',
    attribution:
      'KANJIDIC2 — James William Breen and The Electronic Dictionary Research and Development Group; KANJIDIC project (https://www.edrdg.org/wiki/index.php/KANJIDIC_Project).',
  },
]

/** Community JLPT tag lists — estimated level tags (D-005), attributed to Waller/tanos. */
export const TAG_SOURCES: readonly SourceSpec[] = [
  ...(['n5', 'n4', 'n3', 'n2', 'n1'] as const).map(
    (n): SourceSpec => ({
      key: `jlpt-vocab-${n}`,
      name: `JLPT vocab list (${n.toUpperCase()})`,
      url: `https://raw.githubusercontent.com/elzup/jlpt-word-list/master/src/${n}.csv`,
      compression: 'none',
      outfile: `jlpt-vocab-${n}.csv`,
      license: 'CC-BY',
      attribution:
        'JLPT vocabulary level tags: Jonathan Waller, JLPT Resources (https://www.tanos.co.uk/jlpt/), CC BY — via elzup/jlpt-word-list.',
    }),
  ),
  {
    key: 'kanji-data',
    name: 'kanji-data (jlpt_new)',
    url: 'https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json',
    compression: 'none',
    outfile: 'kanji-data.json',
    license: 'MIT',
    attribution:
      'JLPT kanji level tags (jlpt_new): Jonathan Waller (CC BY) — via davidluzgouveia/kanji-data (MIT); kanji readings/meanings cross-checked against KANJIDIC2.',
  },
]

/**
 * Tatoeba example sentences — minimal reachable set via the per_language/jpn subtree
 * (avoids the 287 MB / 142 MB global dumps). Single-file `.tsv.bz2`, tab-separated.
 * Default license CC BY 2.0 FR; the CC0 subset is segregated in its own file.
 */
const TATOEBA_ATTR =
  'Example sentences from the Tatoeba Project (https://tatoeba.org), CC BY 2.0 FR; per-sentence author credited. A CC0 subset is identified separately.'
export const TATOEBA_SOURCES: readonly SourceSpec[] = [
  {
    key: 'tatoeba-jpn-detailed',
    name: 'Tatoeba Japanese sentences (detailed)',
    url: 'https://downloads.tatoeba.org/exports/per_language/jpn/jpn_sentences_detailed.tsv.bz2',
    compression: 'bzip2',
    outfile: 'jpn_sentences_detailed.tsv',
    license: 'CC-BY-2.0-FR',
    attribution: TATOEBA_ATTR,
  },
  {
    key: 'tatoeba-jpn-eng-links',
    name: 'Tatoeba jpn→eng translation links',
    url: 'https://downloads.tatoeba.org/exports/per_language/jpn/jpn-eng_links.tsv.bz2',
    compression: 'bzip2',
    outfile: 'jpn-eng_links.tsv',
    license: 'CC-BY-2.0-FR',
    attribution: TATOEBA_ATTR,
  },
  {
    key: 'tatoeba-eng',
    name: 'Tatoeba English sentences',
    url: 'https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2',
    compression: 'bzip2',
    outfile: 'eng_sentences.tsv',
    license: 'CC-BY-2.0-FR',
    attribution: TATOEBA_ATTR,
  },
  {
    key: 'tatoeba-jpn-cc0',
    name: 'Tatoeba Japanese CC0 subset',
    url: 'https://downloads.tatoeba.org/exports/per_language/jpn/jpn_sentences_CC0.tsv.bz2',
    compression: 'bzip2',
    outfile: 'jpn_sentences_CC0.tsv',
    license: 'CC0-1.0',
    attribution: 'Tatoeba CC0 sentence subset (https://tatoeba.org), public domain.',
  },
]

export const ALL_SOURCES: readonly SourceSpec[] = [
  ...EDRDG_SOURCES,
  ...TAG_SOURCES,
  ...TATOEBA_SOURCES,
]

/** EDRDG licence page — re-checked at fetch time so a license change fails the build. */
export const EDRDG_LICENCE_URL = 'https://www.edrdg.org/edrdg/licence.html'
export const EDRDG_LICENCE_MUST_CONTAIN = ['Attribution-ShareAlike', '4.0']

/** JLPT level (community estimate) → app level (design-options.md §0). */
export const JLPT_TO_LEVEL: Readonly<Record<'N5' | 'N4' | 'N3' | 'N2' | 'N1', Level>> = {
  N5: 'L1',
  N4: 'L2',
  N3: 'L3',
  N2: 'L4',
  N1: 'L5',
}

export const LEVELS_IN_ORDER = ['L1', 'L2', 'L3', 'L4', 'L5'] as const satisfies readonly Level[]
