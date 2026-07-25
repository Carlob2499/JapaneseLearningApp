import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { Classbook, type GrammarPoint, type ItemState, type VocabItem } from '@hikkoshi/schemas'
import { loadLevels, type Content } from '../content/packs'
import { getAllItemStates } from '../store/db'
import { getClassSettings, setClassSettings, type ClassSettings } from '../store/classSettings'
import { ALL_LEVELS, getActiveLevels } from '../store/settings'
import { staggerIn } from '../motion/timelines'
import { SectionHead } from './SectionHead'
import './classroom.css'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ClassroomData {
  book: Classbook
  grammarById: Map<string, GrammarPoint>
  vocabById: Map<string, VocabItem>
  metById: Set<string>
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
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}packs/class/${settings.book}.json`)
        if (!res.ok) throw new Error(`class pack HTTP ${res.status}`)
        const book = Classbook.parse(await res.json())

        let content: Content
        try {
          content = await loadLevels([...ALL_LEVELS])
        } catch {
          content = await loadLevels(getActiveLevels())
        }
        const states: ItemState[] = await getAllItemStates()
        if (!alive) return

        setData({
          book,
          grammarById: new Map(content.grammar.map((g) => [g.id, g])),
          vocabById: new Map(content.vocab.map((v) => [v.id, v])),
          metById: new Set(states.map((s) => s.itemId)),
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

  const lesson = data.book.lessons.find((l) => l.lesson === settings.lesson) ?? data.book.lessons[0]

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
                  aria-label={DAY_NAMES[i]}
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
          {data.book.lessons.map((l) => (
            <button
              key={l.lesson}
              type="button"
              className={`lesson-panel${l.lesson === settings.lesson ? ' current' : ''}${l.lesson < settings.lesson ? ' past' : ''}${l.lesson > settings.lesson ? ' future' : ''}`}
              onClick={() => update({ lesson: l.lesson })}
            >
              <span className="lesson-panel-num">{l.lesson}</span>
              <span className="lesson-panel-title">{l.titleEn}</span>
            </button>
          ))}
        </div>
      </section>

      {lesson && (
        <>
          <section className="card classroom-lesson">
            <SectionHead ja={`第${lesson.lesson}課`} en={lesson.titleEn} />
            <p className="fineprint">{lesson.themeEn}</p>
            <div className="grammar-list">
              {lesson.grammarIds.map((id) => {
                const g = data.grammarById.get(id)
                if (!g) return null
                return (
                  <div className="grammar-row" key={id}>
                    <span className="grammar-row-name">{g.name}</span>
                    <span className="grammar-row-gloss">{g.gloss}</span>
                    <span className={`grammar-row-status${data.metById.has(id) ? ' met' : ''}`}>
                      {data.metById.has(id) ? 'in review' : 'not started'}
                    </span>
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
          </section>
        </>
      )}
    </main>
  )
}
