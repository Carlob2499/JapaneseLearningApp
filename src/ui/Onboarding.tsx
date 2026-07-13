import { APP_NAME, APP_NAME_JA } from '../lib/appMeta'
import './study.css'

/** First-run screen, shown once (gated by `settings.ts`'s `onboarded` flag). Deliberately
 *  narrow: no level-picking or placement here — that's build-order item 7, a later phase. */
export default function Onboarding({ onContinue }: { onContinue: () => void }) {
  return (
    <main className="shell">
      <header className="masthead">
        <span className="mark" aria-hidden="true">
          {APP_NAME_JA}
        </span>
        <h1>{APP_NAME}</h1>
        <p className="tagline">A life in Japan, one day at a time — N5 through N1.</p>
      </header>

      <section className="card onboarding-card">
        <p>
          Every day here is a small slice of a life in Japan: a spaced-repetition review, and a
          real-world errand — starting with the konbini counter — that puts the same words to use
          in an actual exchange. Keep coming back, and your progress narrates itself back to you as
          a life stage: tourist, resident, and further in.
        </p>
        <p className="fineprint">
          Progress is stored on this device only. Levels beyond N5 download once, then work offline.
        </p>
        <button className="start-btn" onClick={onContinue}>
          Continue
        </button>
      </section>
    </main>
  )
}
