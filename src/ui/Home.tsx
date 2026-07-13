import type { Level } from '@hikkoshi/schemas'
import { APP_NAME, APP_NAME_JA, JLPT_LABEL, levelItemCount } from '../lib/appMeta'
import { ALL_LEVELS } from '../store/settings'
import About from './About'
import './study.css'

export default function Home({
  levels,
  onToggleLevel,
  onStart,
  onStartScene,
}: {
  levels: Level[]
  onToggleLevel: (level: Level) => void
  onStart: () => void
  onStartScene: () => void
}) {
  const selectedCount = levels.reduce((sum, l) => sum + levelItemCount(l), 0)
  return (
    <main className="shell">
      <header className="masthead">
        <span className="mark" aria-hidden="true">
          {APP_NAME_JA}
        </span>
        <h1>{APP_NAME}</h1>
        <p className="tagline">A life in Japan, one day at a time — N5 through N1.</p>
      </header>

      <section className="card home-cta">
        <p>
          Study today's batch of Japanese — words, kanji with animated stroke order, and example
          sentences — scheduled by spaced repetition.
        </p>

        <div className="level-picker" role="group" aria-label="Levels to study">
          {ALL_LEVELS.map((lv) => {
            const on = levels.includes(lv)
            return (
              <button
                key={lv}
                type="button"
                className={`level-chip${on ? ' on' : ''}`}
                aria-pressed={on}
                onClick={() => onToggleLevel(lv)}
              >
                <span className="level-name">
                  {lv} · {JLPT_LABEL[lv]}
                </span>
                <span className="level-count">{levelItemCount(lv).toLocaleString()}</span>
              </button>
            )
          })}
        </div>

        <button className="start-btn" onClick={onStart}>
          Start today's review
        </button>
        <p className="fineprint">
          {selectedCount.toLocaleString()} items in your {levels.length === 1 ? 'level' : 'levels'} · a
          fresh start introduces ~10 · progress saved on this device. Levels beyond N5 download once,
          then work offline.
        </p>
      </section>

      <section className="card errand-cta">
        <h2>Errands</h2>
        <p>
          Same words, a real moment: run the konbini checkout counter and use what you know in a
          live exchange with the clerk.
        </p>
        <button className="errand-btn" onClick={onStartScene}>
          Konbini checkout
        </button>
      </section>

      <About />
    </main>
  )
}
