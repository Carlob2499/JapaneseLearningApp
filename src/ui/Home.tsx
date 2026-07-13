import type { Level } from '@hikkoshi/schemas'
import type { DiaryEntry } from '../day/diary'
import { useToday } from '../day/useToday'
import { APP_NAME, APP_NAME_JA, JLPT_LABEL, levelItemCount } from '../lib/appMeta'
import { ALL_LEVELS } from '../store/settings'
import About from './About'
import './study.css'

function DiaryRow({ entry, revealed, onReveal }: { entry: DiaryEntry; revealed: boolean; onReveal: () => void }) {
  const idx = entry.ja.indexOf(entry.expression)
  const before = idx >= 0 ? entry.ja.slice(0, idx) : entry.ja
  const after = idx >= 0 ? entry.ja.slice(idx + entry.expression.length) : ''
  return (
    <div className="diary-row">
      <p className="diary-ja">
        {before}
        <button type="button" className="diary-word" onClick={onReveal}>
          {entry.expression}
        </button>
        {after}
      </p>
      {revealed && (
        <p className="diary-gloss">
          {entry.gloss} — <span className="diary-en">{entry.en}</span>
        </p>
      )}
    </div>
  )
}

export default function Home({
  levels,
  onToggleLevel,
  onStart,
  onStartScene,
}: {
  levels: Level[]
  onToggleLevel: (level: Level) => void
  onStart: () => void
  onStartScene: (sceneId: string) => void
}) {
  const today = useToday(levels)
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

      <section className="card today-card">
        <h2>Today</h2>
        {today.mode === 'loading' && <p className="loading">Loading your content…</p>}
        {today.mode === 'error' && (
          <p className="fineprint">
            {today.error ?? 'Something went wrong.'} A level beyond N5 needs to be online once to
            download it for offline use.
          </p>
        )}
        {today.mode === 'ready' && today.lifeStage && (
          <>
            <p className="life-stage-badge">{today.lifeStage.name}</p>
            {today.dayPlan && today.dayPlan.tasks.length > 0 ? (
              <div className="today-tasks">
                {today.dayPlan.tasks.map((task) =>
                  task.kind === 'review' ? (
                    <div className="today-task" key="review">
                      <button className="start-btn" onClick={onStart}>
                        Start today's review
                      </button>
                      <p className="fineprint">
                        {task.dueCount} due · {task.introCount} new
                      </p>
                    </div>
                  ) : (
                    <div className="today-task" key={task.sceneId}>
                      <button className="errand-btn" onClick={() => onStartScene(task.sceneId)}>
                        {task.title}
                      </button>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="fineprint">Nothing due right now — check back later.</p>
            )}
          </>
        )}
      </section>

      {today.diaryEntries.length > 0 && (
        <section className="card diary-card">
          <h2>Diary</h2>
          <p className="fineprint">Today's words, in a sentence. Tap one to see what it means.</p>
          {today.diaryEntries.map((entry) => (
            <DiaryRow
              key={entry.itemId}
              entry={entry}
              revealed={today.isRevealed(entry.itemId)}
              onReveal={() => today.revealGloss(entry.itemId)}
            />
          ))}
        </section>
      )}

      <section className="card levels-card">
        <h2>Levels</h2>
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
        <p className="fineprint">
          {selectedCount.toLocaleString()} items in your {levels.length === 1 ? 'level' : 'levels'} ·
          progress saved on this device. Levels beyond N5 download once, then work offline.
        </p>
      </section>

      <About />
    </main>
  )
}
