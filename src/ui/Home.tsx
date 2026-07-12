import { APP_NAME, APP_NAME_JA, packItemCount } from '../lib/appMeta'
import About from './About'
import './study.css'

export default function Home({ onStart }: { onStart: () => void }) {
  return (
    <main className="shell">
      <header className="masthead">
        <span className="mark" aria-hidden="true">
          {APP_NAME_JA}
        </span>
        <h1>{APP_NAME}</h1>
        <p className="tagline">A life in Japan, one day at a time — starting at N5.</p>
      </header>

      <section className="card home-cta">
        <p>
          Study today's batch of Japanese — words, kanji with animated stroke order, and example
          sentences — scheduled by spaced repetition.
        </p>
        <button className="start-btn" onClick={onStart}>
          Start today's review
        </button>
        <p className="fineprint">
          {packItemCount().toLocaleString()} dataset-verified items · a fresh start introduces ~12.
          Progress is saved on this device.
        </p>
      </section>

      <About />
    </main>
  )
}
