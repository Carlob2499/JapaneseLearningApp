import { useEffect, useState } from 'react'
import type { JournalEntry, StrokeItem } from '@hikkoshi/schemas'
import { appendJournal, getJournal } from '../store/db'
import { isSheetComplete, isTraced } from '../day/traceProgress'
import { shouldPlayKanjiSheetCeremony } from './kanjiSheetGate'
import TraceCanvas from './TraceCanvas'
import KanjiSheetCeremony from './KanjiSheetCeremony'
import type { GuideShape } from './traceGeometry'
import './trace.css'

export interface KanjiSheetProps {
  literals: string[]
  strokesByLiteral: ReadonlyMap<string, StrokeItem>
  lessonNumber: number
  onClose: () => void
  /** Test-only passthrough to TraceCanvas's injectable geometry sampler. */
  guideShapeOf?: (path: SVGPathElement) => GuideShape
}

/**
 * The weekly kanji sheet (D-037): the six trace cells for one lesson, 2×3, handout register.
 * Completion persists as journal `'trace'` entries (append-only, no new store) so it survives
 * reload and is never lost even if the learner switches lessons mid-week. Finishing the last
 * untraced cell fires the one-time-per-lesson ceremony.
 */
export default function KanjiSheet({
  literals,
  strokesByLiteral,
  lessonNumber,
  onClose,
  guideShapeOf,
}: KanjiSheetProps) {
  const [journal, setJournal] = useState<JournalEntry[] | null>(null)
  const [activeChar, setActiveChar] = useState<string | null>(null)
  const [showCeremony, setShowCeremony] = useState(false)

  useEffect(() => {
    let alive = true
    void getJournal().then((j) => {
      if (alive) setJournal(j)
    })
    return () => {
      alive = false
    }
  }, [])

  if (!journal) {
    return (
      <div className="trace-sheet card">
        <p className="loading">Opening this week's sheet…</p>
      </div>
    )
  }

  const activeItem = activeChar ? strokesByLiteral.get(activeChar) : undefined
  if (activeChar && activeItem) {
    return (
      <div className="trace-sheet card">
        <button className="ghost-btn" onClick={() => setActiveChar(null)}>
          ← Back to the sheet
        </button>
        <TraceCanvas
          item={activeItem}
          guideShapeOf={guideShapeOf}
          onComplete={() => {
            const wasComplete = isSheetComplete(literals, strokesByLiteral, journal)
            const entry: JournalEntry = { itemId: activeItem.id, ts: Date.now(), interaction: 'trace', outcome: 'pass' }
            const nextJournal = [...journal, entry]
            setJournal(nextJournal)
            setActiveChar(null)
            const nowComplete = isSheetComplete(literals, strokesByLiteral, nextJournal)
            if (!wasComplete && nowComplete && shouldPlayKanjiSheetCeremony(lessonNumber)) {
              setShowCeremony(true)
            }
            void appendJournal(entry)
          }}
        />
      </div>
    )
  }

  return (
    <div className="trace-sheet card">
      <div className="trace-sheet-head">
        <h3>This week's six</h3>
        <button className="ghost-btn" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="trace-sheet-grid">
        {literals.map((c) => {
          const item = strokesByLiteral.get(c)
          const traced = item !== undefined && isTraced(item.id, journal)
          return (
            <button
              key={c}
              type="button"
              className={`trace-cell${traced ? ' traced' : ''}`}
              disabled={!item}
              onClick={() => setActiveChar(c)}
              data-testid="trace-cell"
              data-traced={traced}
            >
              <span className="trace-cell-char">{c}</span>
              <span className="trace-cell-status">{traced ? '書けた' : item ? 'Trace' : 'No stroke data'}</span>
            </button>
          )
        })}
      </div>
      {showCeremony && <KanjiSheetCeremony lessonNumber={lessonNumber} onDone={() => setShowCeremony(false)} />}
    </div>
  )
}
