import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { Flip } from 'gsap/Flip'
import type { Level, SceneTemplate } from '@hikkoshi/schemas'
import type { DiaryEntry } from '../day/diary'
import { useToday } from '../day/useToday'
import { APP_NAME, APP_NAME_JA, JLPT_LABEL, levelItemCount } from '../lib/appMeta'
import { timeBucket } from '../lib/timeOfDay'
import { EnterOnMount } from '../motion/EnterOnMount'
import { stash } from '../motion/flipHandoff'
import { isReducedMotion } from '../motion/reducedMotion'
import { ambientDrift, celebrate, staggerIn } from '../motion/timelines'
import { revealChars } from '../motion/typeReveal'
import {
  daysUntilClass,
  dismissClassDiscovery,
  getClassSettings,
  isClassDiscoveryDismissed,
  WEEKDAY_NAMES,
} from '../store/classSettings'
import { ALL_LEVELS } from '../store/settings'
import About from './About'
import { SectionHead } from './SectionHead'
import streetPhoto from '../assets/photos/street-yanaka.webp'
import konbiniPhoto from '../assets/photos/konbini-heartin.webp'
import transitPhoto from '../assets/photos/transit-mikunigaoka.webp'
import './photo.css'
import './study.css'

/** The tile image behind each errand on Today (D-026) — the same real place you'll walk into. */
const ERRAND_PHOTO: Record<SceneTemplate['sceneKind'], string> = {
  konbini: konbiniPhoto,
  transit: transitPhoto,
}

/** The neighborhood hero (D-026): Yanaka Ginza from the Yuyake Dandan steps, washed to the
 *  learner's actual hour (dark scheme always renders night) and breathing via Ken Burns. */
function HomeHero() {
  const [tod] = useState(() => timeBucket(new Date().getHours()))
  const heroRef = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const root = heroRef.current
      if (!root) return
      const img = root.querySelector('img')
      if (img) ambientDrift(img)
      // The wordmark writes itself in over the street (D-033) — once per Home mount.
      const mark = root.querySelector('.mark')
      if (mark) revealChars(mark, { duration: 0.5, stagger: 0.07 })
      const lines = staggerIn(root.querySelectorAll('h1, .tagline'))
      if (!isReducedMotion()) lines.delay(0.35)
    },
    { scope: heroRef },
  )
  return (
    <header className={`photo-band home-hero tod-${tod}`} ref={heroRef}>
      <img src={streetPhoto} alt="Yanaka Ginza shopping street, Tokyo — the neighborhood you're moving into" />
      <div className="home-hero-text">
        <span className="mark" aria-hidden="true">
          {APP_NAME_JA}
        </span>
        <h1>{APP_NAME}</h1>
        <p className="tagline">A life in Japan, one day at a time — N5 through N1.</p>
      </div>
    </header>
  )
}

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

/** The Classroom thread's front door on Home (D-034): once enabled, a quiet reminder of how far
 *  class is; before that, a single dismissable invitation — never both, never pushy. */
function ClassroomEntry({ onClassroom }: { onClassroom: () => void }) {
  const [settings] = useState(getClassSettings)
  const [dismissed, setDismissed] = useState(isClassDiscoveryDismissed)

  if (settings.enabled) {
    const days = daysUntilClass(new Date(), settings.classDay)
    const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`
    return (
      <button type="button" className="class-entry" onClick={onClassroom}>
        <span aria-hidden="true">授業</span> Class {when} · Lesson {settings.lesson}
      </button>
    )
  }
  if (dismissed) return null
  return (
    <div className="class-discovery">
      <p>Taking a Japanese class? Line the app up with it.</p>
      <div className="class-discovery-actions">
        <button type="button" className="ghost-btn" onClick={onClassroom}>
          Set up →
        </button>
        <button
          type="button"
          className="class-discovery-dismiss"
          aria-label="Dismiss"
          onClick={() => {
            dismissClassDiscovery()
            setDismissed(true)
          }}
        >
          ×
        </button>
      </div>
    </div>
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
        <EnterOnMount>
          <p className="diary-gloss">
            {entry.gloss} — <span className="diary-en">{entry.en}</span>
          </p>
        </EnterOnMount>
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
  onEmergency,
  onClassroom,
  onClassSession,
}: {
  levels: Level[]
  onToggleLevel: (level: Level) => void
  onStart: () => void
  onStartScene: (sceneId: string) => void
  onJourney: () => void
  onEmergency: () => void
  onClassroom: () => void
  onClassSession: (itemIds: string[], label: string) => void
}) {
  const today = useToday(levels)
  const selectedCount = levels.reduce((sum, l) => sum + levelItemCount(l), 0)
  // Real coverage per active level (share of its pool met at least once) — drives the chip bars.
  const coverage = new Map((today.lifeStage?.coverageByLevel ?? []).map((c) => [c.level, c.ratio]))

  return (
    <main className="shell">
      <HomeHero />

      <section className="card today-card">
        <SectionHead ja="今日" en="Today" />
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
                {today.dayPlan.tasks.map((task) => {
                  if (task.kind === 'review') {
                    return (
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
                          {task.isWarmReturn ? 'Today is short on purpose.' : `${task.dueCount} due · ${task.introCount} new`}
                        </p>
                      </div>
                    )
                  }
                  if (task.kind === 'class-seed' || task.kind === 'class-capture') {
                    const seed = task.kind === 'class-seed'
                    const classDayName = WEEKDAY_NAMES[getClassSettings().classDay]
                    return (
                      <div className="today-task" key={task.kind}>
                        <button
                          className="start-btn class-task-btn"
                          onClick={() => onClassSession(task.itemIds, seed ? '予習' : '復習')}
                        >
                          <span aria-hidden="true">{seed ? '予習' : '復習'}</span>{' '}
                          {seed ? `Seed ${classDayName}'s class` : "Capture while it's warm"}
                        </button>
                        <p className="fineprint">{task.itemIds.length} items</p>
                      </div>
                    )
                  }
                  return (
                    <div className="today-task" key={task.sceneId}>
                      <button
                        className="errand-btn errand-tile"
                        onClick={(e) => {
                          stash('home-to-scene', Flip.getState(e.currentTarget))
                          onStartScene(task.sceneId)
                        }}
                      >
                        <img src={ERRAND_PHOTO[task.sceneKind]} alt="" />
                        <span className="errand-tile-title">{task.title}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="fineprint">Nothing due right now — check back later.</p>
            )}
          </>
        )}
      </section>

      <ClassroomEntry onClassroom={onClassroom} />

      {today.diaryEntries.length > 0 && (
        <section className="card diary-card">
          <SectionHead ja="日記" en="Diary" />
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
        <SectionHead ja="レベル" en="Levels" />
        <div className="level-picker" role="group" aria-label="Levels to study">
          {ALL_LEVELS.map((lv) => {
            const on = levels.includes(lv)
            const ratio = coverage.get(lv)
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
                {ratio !== undefined && (
                  <span
                    className="chip-progress"
                    aria-label={`${Math.round(ratio * 100)}% met`}
                  >
                    <span style={{ width: `${Math.round(ratio * 100)}%` }} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <p className="fineprint">
          {selectedCount.toLocaleString()} items in your {levels.length === 1 ? 'level' : 'levels'} ·
          progress saved on this device. Levels beyond N5 download once, then work offline.
        </p>
      </section>

      <button type="button" className="emergency-link" onClick={onEmergency}>
        <span aria-hidden="true">🆘</span> In an emergency · 緊急のとき
      </button>

      <About />
    </main>
  )
}
