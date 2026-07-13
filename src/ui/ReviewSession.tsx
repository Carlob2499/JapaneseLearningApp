import { useState, type ReactNode } from 'react'
import type { Level, Outcome } from '@hikkoshi/schemas'
import { useReview, type Presentation, type Reviewable } from '../review/useReview'
import { useAudio } from '../audio/useAudio'
import { getAutoPlay, setAutoPlay as saveAutoPlay } from '../store/settings'
import { ChoiceCard, GrammarCard, KanjiCard, RegisterChip, SentenceCard, TypedCard, VocabCard } from './cards'
import './study.css'

const KIND_LABEL: Record<Reviewable['kind'], string> = {
  vocab: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
  sentence: 'Sentence',
}

/** Free-recall (mature items): reveal + self-grade, reusing the existing cards. */
function RecallCard({
  r,
  onGrade,
  autoPlay,
}: {
  r: Reviewable
  onGrade: (o: Outcome) => void
  autoPlay?: boolean
}) {
  switch (r.kind) {
    case 'vocab':
      return <VocabCard item={r.item} onGrade={onGrade} autoPlay={autoPlay} />
    case 'kanji':
      return <KanjiCard item={r.item} stroke={r.stroke} onGrade={onGrade} />
    case 'grammar':
      return <GrammarCard item={r.item} onGrade={onGrade} />
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
  if (r.kind === 'grammar') {
    // recognition only: show the pattern and an example, ask for its function
    const ex = r.item.examples[0]
    return {
      prompt: (
        <div className="grammar-front">
          <span className="jp-lg">{r.item.name}</span>
          {ex && <span className="grammar-lead">{ex.ja}</span>}
        </div>
      ),
      question: 'What does this grammar do?',
    }
  }
  // Sentences carry their register on both the recognition prompt (read here first) and the
  // recall card, so politeness is felt from the first encounter, not only when mature.
  return {
    prompt: (
      <div className="sentence-front">
        <RegisterChip register={r.item.register} />
        <span className="jp-lg">{r.item.ja}</span>
      </div>
    ),
    question: 'Which translation?',
  }
}

function Card({
  p,
  onGrade,
  autoPlay,
}: {
  p: Presentation
  onGrade: (o: Outcome) => void
  autoPlay?: boolean
}) {
  const { reviewable: r, mode, choices } = p
  if (mode === 'typed') {
    return r.kind === 'vocab' ? (
      <TypedCard
        kind={KIND_LABEL[r.kind]}
        prompt={<span className="jp-xl">{r.item.expression}</span>}
        answer={r.item.reading}
        onGrade={onGrade}
        autoPlay={autoPlay}
      />
    ) : (
      <RecallCard r={r} onGrade={onGrade} autoPlay={autoPlay} />
    )
  }
  if (mode === 'recall' || !choices) return <RecallCard r={r} onGrade={onGrade} autoPlay={autoPlay} />
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

export default function ReviewSession({ levels, onHome }: { levels: Level[]; onHome: () => void }) {
  const { mode, view, remaining, reviewed, sessionSize, error, grade, practiceMore } = useReview(levels)
  const { available: audioAvailable } = useAudio()
  const [autoPlay, setAutoPlay] = useState<boolean>(() => getAutoPlay())

  if (mode === 'loading') {
    return (
      <main className="shell">
        <p className="loading">Loading your content…</p>
      </main>
    )
  }

  if (mode === 'error') {
    return (
      <main className="shell">
        <section className="card summary">
          <h2>Couldn't load content</h2>
          <p>
            {error ?? 'Something went wrong.'} A level beyond N5 needs to be online once to download it
            for offline use.
          </p>
          <button className="ghost-btn" onClick={onHome}>
            Back home
          </button>
        </section>
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
        {audioAvailable && (
          <button
            className="ghost-btn"
            aria-pressed={!autoPlay}
            aria-label={autoPlay ? 'Turn off auto-play audio' : 'Turn on auto-play audio'}
            onClick={() => setAutoPlay(saveAutoPlay(!autoPlay))}
          >
            {autoPlay ? '🔊' : '🔇'}
          </button>
        )}
      </div>
      {view && (
        <div key={view.reviewable.id} className="card-slot">
          <Card p={view} onGrade={grade} autoPlay={autoPlay} />
        </div>
      )}
    </main>
  )
}
