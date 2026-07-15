import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { Flip } from 'gsap/Flip'
import type { Level } from '@hikkoshi/schemas'
import type { DiaryEntry } from '../day/diary'
import { useToday } from '../day/useToday'
import { APP_NAME, APP_NAME_JA, JLPT_LABEL, levelItemCount } from '../lib/appMeta'
import { stash } from '../motion/flipHandoff'
import { celebrate } from '../motion/timelines'
import { ALL_LEVELS } from '../store/settings'
import About from './About'
import './study.css'

/**
 * Five hand-written framing lines (D-019) — stage 5's name is already a full sentence ("You
 * handle it for someone else."), so no single "Your X now reads: {name}" template covers all
 * five; stage 0 (Tourist) never celebrates (decideCelebration), so it needs none.
 */
const CELEBRATION_FRAMING: Record<number, string> = {
  1: 'Your residence card now reads: Resident.',
  2: 'You picked up a part-time job. Your residence card now reads: Part-timer.',
  3: 'Full-time, finally. Your residence card now reads: Employee.',
  4: 'They ask your opinion now. Your residence card now reads: Senior staff.',
  5: "Someone else just asked you how it's done. You handle it for someone else, now.",
}

/** The felt life-stage-up moment (D-019): a stamp animation on the badge itself, plus a line
 *  of in-fiction framing that fades after a few seconds — inline, never a blocking dialog.
 *  The badge is also the door to the Journey stamp book (D-025). */
function LifeStageBadge({
  name,
  celebrateStage,
  onJourney,
}: {
  name: string
  celebrateStage: number | null
  onJourney: () => void
}) {
  const [showFraming, setShowFraming] = useState(celebrateStage !== null)
  const badgeRef = useRef<HTMLButtonElement>(null)

  useGSAP(
    () => {
      if (celebrateStage !== null && badgeRef.current) celebrate(badgeRef.current)
    },
    { dependencies: [celebrateStage], scope: badgeRef },
  )

  useEffect(() => {
    if (celebrateStage === null) return
    const timer = setTimeout(() => setShowFraming(false), 4000)
    return () => clearTimeout(timer)
  }, [celebrateStage])

  return (
    <>
      <button
        type="button"
        ref={badgeRef}
        className={celebrateStage !== null ? 'life-stage-badge celebrating' : 'life-stage-badge'}
        onClick={onJourney}
        aria-label={`${name} — open your journey`}
      >
        {name} <span className="badge-hint" aria-hidden="true">·旅</span>
      </button>
      {celebrateStage !== null && showFraming && <p className="life-stage-framing">{CELEBRATION_FRAMING[celebrateStage]}</p>}
    </>
  )
}

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
  onJourney,
}: {
  levels: Level[]
  onToggleLevel: (level: Level) => void
  onStart: () => void
  onStartScene: (sceneId: string) => void
  onJourney: () => void
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
            <LifeStageBadge name={today.lifeStage.name} celebrateStage={today.celebrateStage} onJourney={onJourney} />
            {today.dayPlan && today.dayPlan.tasks.length > 0 ? (
              <div className="today-tasks">
                {today.dayPlan.tasks.map((task) =>
                  task.kind === 'review' ? (
                    <div className="today-task" key="review">
                      <button
                        className="start-btn"
                        onClick={(e) => {
                          stash('home-to-review', Flip.getState(e.currentTarget))
                          onStart()
                        }}
                      >
                        Start today's review
                      </button>
                      <p className="fineprint">
                        {task.dueCount} due · {task.introCount} new
                      </p>
                    </div>
                  ) : (
                    <div className="today-task" key={task.sceneId}>
                      <button
                        className="errand-btn"
                        onClick={(e) => {
                          stash('home-to-scene', Flip.getState(e.currentTarget))
                          onStartScene(task.sceneId)
                        }}
                      >
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
