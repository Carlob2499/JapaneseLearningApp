import type { ReactNode } from 'react'
import type { Outcome } from '@hikkoshi/schemas'
import { useReview, type Presentation, type Reviewable } from '../review/useReview'
import { ChoiceCard, KanjiCard, SentenceCard, VocabCard } from './cards'
import './study.css'

const KIND_LABEL: Record<Reviewable['kind'], string> = {
  vocab: 'Vocabulary',
  kanji: 'Kanji',
  sentence: 'Sentence',
}

/** Free-recall (mature items): reveal + self-grade, reusing the existing cards. */
function RecallCard({ r, onGrade }: { r: Reviewable; onGrade: (o: Outcome) => void }) {
  switch (r.kind) {
    case 'vocab':
      return <VocabCard item={r.item} onGrade={onGrade} />
    case 'kanji':
      return <KanjiCard item={r.item} stroke={r.stroke} onGrade={onGrade} />
    case 'sentence':
      return <SentenceCard item={r.item} onGrade={onGrade} />
  }
}

/** The prompt + question shown above the options, per kind and direction. */
function multipleChoicePrompt(
  r: Reviewable,
  mode: 'recognition' | 'production',
): { prompt: ReactNode; question: string } {
  if (r.kind === 'vocab') {
    return mode === 'production'
      ? {
          prompt: <span className="jp-lg">{r.item.senses[0]?.gloss[0] ?? r.item.expression}</span>,
          question: 'Which word?',
        }
      : { prompt: <span className="jp-xl">{r.item.expression}</span>, question: 'Which meaning?' }
  }
  if (r.kind === 'kanji') {
    return mode === 'production'
      ? { prompt: <span className="jp-lg">{r.item.meanings[0]}</span>, question: 'Which kanji?' }
      : { prompt: <span className="jp-xl">{r.item.literal}</span>, question: 'Which meaning?' }
  }
  return { prompt: <span className="jp-lg">{r.item.ja}</span>, question: 'Which translation?' }
}

function Card({ p, onGrade }: { p: Presentation; onGrade: (o: Outcome) => void }) {
  const { reviewable: r, mode, choices } = p
  if (mode === 'recall' || !choices) return <RecallCard r={r} onGrade={onGrade} />
  const { prompt, question } = multipleChoicePrompt(r, mode)
  return (
    <ChoiceCard
      kind={KIND_LABEL[r.kind]}
      prompt={prompt}
      question={question}
      choices={choices}
      onGrade={onGrade}
    />
  )
}

export default function ReviewSession({ onHome }: { onHome: () => void }) {
  const { mode, view, remaining, reviewed, sessionSize, grade, practiceMore } = useReview()

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
      {view && (
        <div key={view.reviewable.id} className="card-slot">
          <Card p={view} onGrade={grade} />
        </div>
      )}
    </main>
  )
}
