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
          <strong>Early build.</strong> N5–N1 content with a spaced-repetition scheduler and several
          retrieval modes (recognition, production, typed reading, free recall). Tap 🔊 to hear
          pronunciation where your device has a Japanese voice. Visuals are still placeholder. Progress
          is stored on this device only.
        </p>
        <p>
          <strong>Politeness register is scaffolded, GENKI-style.</strong> Each sentence carries a small
          label — polite (です/ます), plain, casual, or keigo — and every level mixes them deliberately, so
          you learn to <em>produce</em> polite Japanese first while <em>hearing</em> casual and keigo speech
          from early on. The register is a heuristic estimate read from the sentence’s ending, not a hand
          annotation.
        </p>
        <p>
          <strong>Grammar points are original descriptions with cited placement.</strong> No open grammar
          list exists to import, so each point’s explanation is written here and its level is cross-checked
          against public inventories (and, for N5–N4, a Genki chapter). The example sentences are pulled
          verbatim from Tatoeba — never invented. It’s a growing curated set, wider at the lower levels.
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
