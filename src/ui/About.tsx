const REPO_URL = 'https://github.com/Carlob2499/JapaneseLearningApp'

/** In-app disclosure + attribution required by D-002 / D-005. */
export default function About() {
  return (
    <details className="about">
      <summary>About the content &amp; honest limits</summary>
      <div className="about-body">
        <p>
          <strong>JLPT level tags are community estimates.</strong> The JLPT has published no official
          vocabulary or kanji lists since its 2010 revision; our levels derive from Jonathan Waller’s
          lists. Example-sentence levels are a kanji-coverage estimate, not a graded reading level.
        </p>
        <p>
          <strong>Early build.</strong> This is a first playable slice: L1 (≈N5) content only, a simple
          spaced-repetition scheduler, no audio yet, and placeholder visuals. Progress is stored on this
          device only.
        </p>
        <p className="attribution">
          Language data:{' '}
          <span>JMdict &amp; KANJIDIC2 © James William Breen / EDRDG (CC BY-SA 4.0)</span>;{' '}
          <span>KanjiVG © Ulrich Apel (CC BY-SA 3.0)</span>;{' '}
          <span>example sentences from Tatoeba (CC BY 2.0 FR)</span>;{' '}
          <span>JLPT tags from J. Waller (CC BY)</span>.{' '}
          <a href={`${REPO_URL}/blob/claude/jlpt-game-research-7a5aoe/content/ATTRIBUTION.md`}>
            Full attribution
          </a>
          .
        </p>
      </div>
    </details>
  )
}
