import ProgressTransfer from './ProgressTransfer'

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
          retrieval modes (recognition, production, typed reading, listening, free recall). Tap 🔊 to
          hear pronunciation where your device has a Japanese voice. Progress is stored on this device
          only.
        </p>
        <p>
          <strong>Listening depends on your device's voice.</strong> Once a word, kana, or sentence is
          well-known, a review sometimes comes by ear alone — you hear it and choose the meaning, then
          the text is revealed. This uses your device's built-in Japanese text-to-speech, whose quality
          varies by platform; on a device with <em>no</em> Japanese voice, listening reviews simply
          never appear and everything else works exactly as before — no card is ever silent.
        </p>
        <p>
          <strong>Kana are the front door.</strong> A brand-new profile starts with the syllabaries:
          hiragana, then katakana, introduced row by row in chart order, with stroke animations from
          KanjiVG and romaji per the Hepburn convention (typing a common variant like <em>si</em> or{' '}
          <em>tu</em> is never marked wrong). The contracted syllables (yōon — きゃ, しゅ, ちょ…) are
          drilled too, as their own cards, each showing the stroke order of both parts. The small tsu
          (っ, which doubles the next consonant) and the long-vowel mark (ー) aren't drilled as separate
          sounds — they have none on their own — you meet them inside real words and sentences.
        </p>
        <p>
          <strong>The journey page counts encounters, not mastery.</strong> Tap your life-stage badge
          to open the stamp book. A level's number there means items you've <em>met</em> at least once —
          the spaced-repetition schedule is what turns met into remembered, and a stage stamp presses
          once 70% of a level has been met, in order.
        </p>
        <p>
          <strong>Placement is an estimate, not an exam.</strong> If you've studied before, a short
          adaptive quiz places you past the basics by marking words up to your level as “probably known.”
          The app then confirms each one the first time it comes up in review and quietly drops any it had
          wrong — so an over-generous guess costs at most one easy review. It's a quick calibration, never
          a graded score.
        </p>
        <p>
          <strong>Errands are the same items, in a real moment.</strong> The konbini checkout puts
          vocabulary you're already studying into an actual exchange with a clerk — the clerk's lines
          are documented real-world Japanese (cited to convenience-store-Japanese guides and a
          government register survey), never invented, and the item you're asked about is drawn live
          from your own due and known words. One errand escalates through the same retrieval ladder the
          review screen uses: decode what the clerk means, name a word yourself, type one out, read one
          before a countdown runs out, then pick the service line that fits the moment — the picks are
          all real cited clerk lines, so it's a judgement call, not a guess. It uses the same
          spaced-repetition tracking as review, so practicing there counts too. Once you're settled
          enough to hold a part-time job (the Part-timer life stage), a second konbini errand flips the
          counter around: <em>you're</em> the clerk, choosing the right keigo service line for each
          moment — greeting, offering to heat a bento, announcing the total, sending the customer off.
          That's scripted keigo, produced by choosing the documented line; composing full keigo freely,
          and catching a coworker's register slips, still arrives with the higher levels.
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
        <p>
          <strong>Classroom mode lines the app up with your own class — never Quartet's content.</strong>{' '}
          Turning it on (Classroom → settings) only tells the app your class day and where you are
          in Quartet I by lesson number; no school, teacher, or date ever leaves your device. The
          six lesson themes and their grammar-point names are published facts, cross-checked
          against public grammar indexes; the weekly kanji and theme vocabulary are our own
          curated selection drawn from the same open-data pools as the rest of the app — never
          Quartet's own vocabulary lists, glosses, dialogues, or exercises. Not affiliated with or
          endorsed by The Japan Times; no textbook content is reproduced.
        </p>
        <p>
          <strong>Emergency words are one tap from Home, always offline.</strong> The “In an emergency”
          card gathers the safety-critical basics — the numbers to dial (119 for fire and ambulance,
          110 for police) and a few cited lines to say (ask for help, report a fire, request an
          ambulance) with pronunciation. It's taught from day one regardless of your level, because
          when it matters there's no time to look it up. It's a reference, not medical or legal advice
          — every Japanese line is verified against documented emergency-services guidance, never
          invented.
        </p>
        <p className="attribution">
          Language data:{' '}
          <span>JMdict &amp; KANJIDIC2 © James William Breen / EDRDG (CC BY-SA 4.0)</span>;{' '}
          <span>KanjiVG © Ulrich Apel (CC BY-SA 3.0)</span>;{' '}
          <span>example sentences from Tatoeba (CC BY 2.0 FR)</span>;{' '}
          <span>JLPT tags from J. Waller (CC BY)</span>.{' '}
          <a href={`${REPO_URL}/blob/main/content/ATTRIBUTION.md`}>
            Full attribution
          </a>
          .
        </p>
        <p className="attribution">
          Photography, via Wikimedia Commons: <span>Yanaka Ginza by SuFlyer (CC0)</span>;{' '}
          <span>7-Eleven “Heart-in” entrance by Mr.ちゅらさん (CC BY-SA 4.0)</span>;{' '}
          <span>Mikunigaoka Station platform by そらみみ (CC BY-SA 4.0)</span>;{' '}
          <span>wing above the clouds by Harry Knight (CC0)</span>. Shown with a duotone wash;
          the underlying works are unmodified beyond crop/resize.{' '}
          <a href={`${REPO_URL}/blob/main/src/assets/photos/PHOTOS.md`}>
            Photo ledger
          </a>
          .
        </p>
        <ProgressTransfer />
      </div>
    </details>
  )
}
