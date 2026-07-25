import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import type { Classbook, GrammarPoint, ItemState, JournalEntry, StrokeItem, VocabItem } from '@hikkoshi/schemas'
import { loadClassbook, loadLevels, type Content } from '../content/packs'
import { lessonReadiness } from '../day/classWeek'
import { isSheetComplete, kanjiWeekFor } from '../day/traceProgress'
import { getAllItemStates, getJournal } from '../store/db'
import { getClassSettings, setClassSettings, WEEKDAY_NAMES, type ClassSettings } from '../store/classSettings'
import { ALL_LEVELS, getActiveLevels } from '../store/settings'
import { readinessDrawIn, staggerIn } from '../motion/timelines'
import { SectionHead } from './SectionHead'
import KanjiSheet from './KanjiSheet'
import LessonCeremony from './LessonCeremony'
import { shouldPlayLessonCeremony } from './lessonCeremonyGate'
import './classroom.css'

/** Next-lesson seed gate (D-038): jumping ahead in the term map to lesson N+1 unlocks once
 *  lesson N's readiness reaches this — mastery-gated get-ahead (the WaniKani rule), not a free
 *  skip. Past and current lessons are always open; anything beyond N+1 always stays locked. */
const NEXT_LESSON_SEED_GATE = 0.7

const DIAL_R = 24
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_R

/** The lesson readiness dial (D-038): a brush arc that draws in to the current value (DrawSVG),
 *  static under reduced motion — the circle's own strokeDasharray/strokeDashoffset already
 *  render the correct final arc without any animation needed. */
function ReadinessDial({ value }: { value: number }) {
  const arcRef = useRef<SVGCircleElement>(null)
  useGSAP(
    () => {
      if (arcRef.current) readinessDrawIn(arcRef.current, value)
    },
    { dependencies: [value] },
  )
  const clamped = Math.max(0, Math.min(1, value))
  const offset = DIAL_CIRCUMFERENCE * (1 - clamped)
  return (
    <div className="readiness-dial">
      <svg viewBox="0 0 56 56" className="readiness-dial-svg" role="img" aria-label={`${Math.round(clamped * 100)}% ready`}>
        <circle className="readiness-track" cx="28" cy="28" r={DIAL_R} />
        <circle
          ref={arcRef}
          className="readiness-arc"
          cx="28"
          cy="28"
          r={DIAL_R}
          strokeDasharray={DIAL_CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="readiness-pct">{Math.round(clamped * 100)}%</span>
    </div>
  )
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface ClassroomData {
  book: Classbook
  grammarById: Map<string, GrammarPoint>
  vocabById: Map<string, VocabItem>
  stateById: Map<string, ItemState>
  states: ItemState[]
  strokesByLiteral: Map<string, StrokeItem>
  journal: JournalEntry[]
}

/** A grammar point's Classroom status: unseen, in review, or "solid" — earned once it's been
 *  produced correctly on 3 distinct days (Serfaty & Serrano 2024, D-036). */
function grammarStatus(state: ItemState | undefined): 'not-started' | 'in-review' | 'solid' {
  if (!state) return 'not-started'
  return (state.productionStreak ?? 0) >= 3 ? 'solid' : 'in-review'
}

/** Weekly kanji sheet (D-034): shows the current lesson's default week, or the learner's own
 *  override once they've entered it against their actual class handout. Tracing lands in D-037 —
 *  this slice is display + the in-place editor only. */
function KanjiWeek({ chars, override, onSave }: { chars: string[]; override?: string[]; onSave: (chars: string[]) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => override ?? chars)
  const shown = override ?? chars

  if (!editing) {
    return (
      <div className="kanji-week">
        <div className="kanji-week-grid">
          {shown.map((c, i) => (
            <span className="kanji-week-cell" key={i}>
              {c}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="kanji-week-edit"
          onClick={() => {
            setDraft(shown)
            setEditing(true)
          }}
        >
          {override ? 'Edit your six' : 'Not your book? Enter your six →'}
        </button>
      </div>
    )
  }

  return (
    <div className="kanji-week kanji-week-editing">
      <div className="kanji-week-grid">
        {draft.map((c, i) => (
          <input
            key={i}
            className="kanji-week-input"
            value={c}
            maxLength={1}
            aria-label={`Kanji ${i + 1}`}
            onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? e.target.value : x)))}
          />
        ))}
      </div>
      <div className="kanji-week-editing-actions">
        <button
          type="button"
          className="ghost-btn"
          disabled={draft.some((c) => c.length !== 1)}
          onClick={() => {
            onSave(draft)
            setEditing(false)
          }}
        >
          Save
        </button>
        <button type="button" className="ghost-btn" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * The Classroom thread (D-034): the join between the owner's real weekly class and the app's
 * cited content. Term map across the book's lessons, the current lesson's grammar + weekly
 * kanji, and the settings that anchor everything else built on top of this (seed/capture
 * rhythm, worksheets, tracing, the return loop) to a real class day and a real place in the book.
 */
export default function Classroom({ onHome }: { onHome: () => void }) {
  const [settings, setSettings] = useState<ClassSettings>(getClassSettings)
  const [data, setData] = useState<ClassroomData | null>(null)
  const [error, setError] = useState(false)
  const [showSheet, setShowSheet] = useState(false)
  const [showLessonCeremony, setShowLessonCeremony] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const lesson = data ? (data.book.lessons.find((l) => l.lesson === settings.lesson) ?? data.book.lessons[0]) : undefined
  const currentReadiness = data && lesson ? lessonReadiness(lesson, data.states) : 0

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const book = await loadClassbook(settings.book)

        let content: Content
        try {
          content = await loadLevels([...ALL_LEVELS])
        } catch {
          content = await loadLevels(getActiveLevels())
        }
        const [states, journal] = await Promise.all([getAllItemStates(), getJournal()])
        if (!alive) return

        setData({
          book,
          grammarById: new Map(content.grammar.map((g) => [g.id, g])),
          vocabById: new Map(content.vocab.map((v) => [v.id, v])),
          stateById: new Map(states.map((s) => [s.itemId, s])),
          states,
          strokesByLiteral: content.strokesByLiteral,
          journal,
        })
      } catch {
        if (alive) setError(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [settings.book])

  useGSAP(
    () => {
      if (!data) return
      staggerIn('.lesson-panel, .grammar-row')
    },
    { dependencies: [data, settings.lesson], scope: pageRef },
  )

  // The lesson hanko ceremony (D-038): every grammar point already solid the moment the learner
  // opens this lesson — mastery isn't caused here (it happens in review sessions elsewhere), Classroom
  // only notices it and, once per lesson, celebrates it.
  useEffect(() => {
    if (!data || !lesson) return
    const allSolid =
      lesson.grammarIds.length > 0 &&
      lesson.grammarIds.every((id) => grammarStatus(data.stateById.get(id)) === 'solid')
    if (allSolid && shouldPlayLessonCeremony(lesson.lesson)) setShowLessonCeremony(true)
  }, [data, lesson])

  function update(patch: Partial<ClassSettings>) {
    setSettings(setClassSettings(patch))
  }

  if (error) {
    return (
      <main className="shell">
        <section className="card summary">
          <h2>Couldn't open the classroom</h2>
          <p className="fineprint">Your settings are safe — try again in a moment.</p>
          <button className="ghost-btn" onClick={onHome}>
            Back home
          </button>
        </section>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="shell">
        <p className="loading">Opening the classroom…</p>
      </main>
    )
  }

  if (showSheet && lesson) {
    return (
      <main className="shell classroom-page" ref={pageRef}>
        <KanjiSheet
          literals={kanjiWeekFor(lesson, settings.lesson, settings.weeklyKanjiOverride)}
          strokesByLiteral={data.strokesByLiteral}
          lessonNumber={lesson.lesson}
          onClose={() => setShowSheet(false)}
        />
        {showLessonCeremony && (
          <LessonCeremony lessonNumber={lesson.lesson} titleEn={lesson.titleEn} onDone={() => setShowLessonCeremony(false)} />
        )}
      </main>
    )
  }

  return (
    <main className="shell classroom-page" ref={pageRef}>
      <div className="journey-bar">
        <button className="ghost-btn" onClick={onHome}>
          ← Home
        </button>
        <span className="journey-title-ja" aria-hidden="true">
          教室
        </span>
      </div>

      <header className="journey-head">
        <h1>Classroom</h1>
        <p className="fineprint">Your weekly class, lined up with what you're studying here.</p>
      </header>

      <section className="card classroom-settings">
        <label className="classroom-toggle">
          <input type="checkbox" checked={settings.enabled} onChange={(e) => update({ enabled: e.target.checked })} />
          Line the app up with a weekly class
        </label>
        {settings.enabled && (
          <div className="classroom-settings-row">
            <span className="fineprint">Class day</span>
            <div className="day-picker" role="group" aria-label="Class day">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  className={`day-chip${settings.classDay === i ? ' on' : ''}`}
                  aria-label={WEEKDAY_NAMES[i]}
                  aria-pressed={settings.classDay === i}
                  onClick={() => update({ classDay: i })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="card classroom-term">
        <SectionHead ja="全体" en="Term map" />
        <div className="term-map">
          {data.book.lessons.map((l) => {
            // Next-lesson seed gate (D-038): past/current always open; N+1 opens once lesson N's
            // readiness clears the gate; anything further ahead stays locked regardless.
            const locked =
              l.lesson > settings.lesson &&
              (l.lesson > settings.lesson + 1 || currentReadiness < NEXT_LESSON_SEED_GATE)
            return (
              <button
                key={l.lesson}
                type="button"
                className={`lesson-panel${l.lesson === settings.lesson ? ' current' : ''}${l.lesson < settings.lesson ? ' past' : ''}${l.lesson > settings.lesson ? ' future' : ''}${locked ? ' locked' : ''}`}
                onClick={() => !locked && update({ lesson: l.lesson })}
                disabled={locked}
                title={locked ? `Reach ${Math.round(NEXT_LESSON_SEED_GATE * 100)}% on Lesson ${settings.lesson} to unlock` : undefined}
              >
                <span className="lesson-panel-num">{l.lesson}</span>
                <span className="lesson-panel-title">{l.titleEn}</span>
              </button>
            )
          })}
        </div>
        <div className="term-stamps" role="group" aria-label="Weekly kanji sheets completed">
          {data.book.lessons.map((l) => {
            const chars = kanjiWeekFor(l, settings.lesson, settings.weeklyKanjiOverride)
            const complete = isSheetComplete(chars, data.strokesByLiteral, data.journal)
            return (
              <span
                key={l.lesson}
                className={`term-stamp${complete ? ' stamped' : ''}`}
                data-testid="term-stamp"
                data-stamped={complete}
                title={`Lesson ${l.lesson} kanji sheet${complete ? ', complete' : ''}`}
              >
                {l.lesson}
              </span>
            )
          })}
        </div>
      </section>

      {lesson && (
        <>
          <section className="card classroom-lesson">
            <SectionHead ja={`第${lesson.lesson}課`} en={lesson.titleEn} />
            <p className="fineprint">{lesson.themeEn}</p>
            <ReadinessDial value={currentReadiness} />
            <div className="grammar-list">
              {lesson.grammarIds.map((id) => {
                const g = data.grammarById.get(id)
                if (!g) return null
                const status = grammarStatus(data.stateById.get(id))
                const label = status === 'solid' ? 'solid' : status === 'in-review' ? 'in review' : 'not started'
                return (
                  <div className="grammar-row" key={id}>
                    <span className="grammar-row-name">{g.name}</span>
                    <span className="grammar-row-gloss">{g.gloss}</span>
                    <span className={`grammar-row-status ${status}`}>{label}</span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="card classroom-kanji">
            <SectionHead ja="今週の漢字" en="This week's kanji" />
            <KanjiWeek
              chars={lesson.kanjiWeeks[0]}
              override={settings.weeklyKanjiOverride}
              onSave={(chars) => update({ weeklyKanjiOverride: chars })}
            />
            <button type="button" className="ghost-btn kanji-practice-open" onClick={() => setShowSheet(true)}>
              練習 Practice this week's six →
            </button>
          </section>
        </>
      )}
      {showLessonCeremony && lesson && (
        <LessonCeremony lessonNumber={lesson.lesson} titleEn={lesson.titleEn} onDone={() => setShowLessonCeremony(false)} />
      )}
    </main>
  )
}
