import type { Outcome } from '@hikkoshi/schemas'
import { useReview, type Reviewable } from '../review/useReview'
import { KanjiCard, SentenceCard, VocabCard } from './cards'
import './study.css'

function Card({ r, onGrade }: { r: Reviewable; onGrade: (o: Outcome) => void }) {
  switch (r.kind) {
    case 'vocab':
      return <VocabCard item={r.item} onGrade={onGrade} />
    case 'kanji':
      return <KanjiCard item={r.item} stroke={r.stroke} onGrade={onGrade} />
    case 'sentence':
      return <SentenceCard item={r.item} onGrade={onGrade} />
  }
}

export default function ReviewSession({ onHome }: { onHome: () => void }) {
  const { mode, current, remaining, reviewed, sessionSize, grade, practiceMore } = useReview()

  if (mode === 'loading') {
    return (
      <main className="shell">
        <p className="loading">Loading N5 content…</p>
      </main>
    )
  }

  if (mode === 'summary') {
    return (
      <main className="shell">
        <section className="card summary">
          <h2>Session complete</h2>
          <p>
            You reviewed <strong>{reviewed}</strong> {reviewed === 1 ? 'item' : 'items'}. The tracked
            ones return later — that spacing is the point.
          </p>
          <div className="summary-actions">
            <button className="start-btn" onClick={practiceMore}>
              Practice more (untracked)
            </button>
            <button className="ghost-btn" onClick={onHome}>
              Back home
            </button>
          </div>
        </section>
      </main>
    )
  }

  const done = sessionSize - remaining
  return (
    <main className="shell">
      <div className="session-bar">
        <button className="ghost-btn" onClick={onHome}>
          ← Home
        </button>
        <span className="progress-text">
          {mode === 'practice' ? 'Practice' : 'Review'} · {done}/{sessionSize}
        </span>
      </div>
      {current && (
        <div key={current.id} className="card-slot">
          <Card r={current} onGrade={grade} />
        </div>
      )}
    </main>
  )
}
