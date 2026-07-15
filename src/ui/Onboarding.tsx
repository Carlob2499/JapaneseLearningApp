import { APP_NAME, APP_NAME_JA } from '../lib/appMeta'
import arrivalPhoto from '../assets/photos/arrival-clouds.webp'
import './photo.css'
import './study.css'

/** First-run screen, shown once (gated by `settings.ts`'s `onboarded` flag). Forks into a beginner
 *  start or the placement probe (E5 / D-021) — build-order item 7, now landed. */
export default function Onboarding({
  onBeginner,
  onPlacement,
}: {
  onBeginner: () => void
  onPlacement: () => void
}) {
  return (
    <main className="shell">
      <header className="masthead">
        <span className="mark" aria-hidden="true">
          {APP_NAME_JA}
        </span>
        <h1>{APP_NAME}</h1>
        <p className="tagline">A life in Japan, one day at a time — N5 through N1.</p>
      </header>

      {/* The arrival (D-026): your flight is on approach — the move starts at the window seat. */}
      <div className="photo-band onboarding-arrival">
        <img src={arrivalPhoto} alt="An airplane wing above the clouds — your flight on approach" />
        <span className="arrival-caption">着陸まであと少し · almost there</span>
      </div>

      <section className="card onboarding-card">
        <p>
          Every day here is a small slice of a life in Japan: a spaced-repetition review, and a
          real-world errand — starting with the konbini counter — that puts the same words to use
          in an actual exchange. Keep coming back, and your progress narrates itself back to you as
          a life stage: tourist, resident, and further in.
        </p>
        <p>Studied some Japanese already? A few quick questions can place you past the basics.</p>
        <div className="onboarding-choices">
          <button className="start-btn" onClick={onPlacement}>
            I've studied before
          </button>
          <button className="ghost-btn" onClick={onBeginner}>
            I'm new — start at the beginning
          </button>
        </div>
        <p className="fineprint">
          Progress is stored on this device only. Levels beyond N5 download once, then work offline.
        </p>
      </section>
    </main>
  )
}
