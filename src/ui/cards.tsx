import { useState, type ReactNode } from 'react'
import type { KanjiItem, Outcome, SentenceItem, StrokeItem, VocabItem } from '@hikkoshi/schemas'
import StrokeViewer from './StrokeViewer'
import './study.css'

function GradeBar({ onGrade }: { onGrade: (o: Outcome) => void }) {
  return (
    <div className="grade-bar">
      <button className="grade grade-again" onClick={() => onGrade('fail')}>
        Again
      </button>
      <button className="grade grade-partial" onClick={() => onGrade('partial')}>
        Partial
      </button>
      <button className="grade grade-good" onClick={() => onGrade('pass')}>
        Good
      </button>
    </div>
  )
}

/** Shared front → reveal → grade shell. Reveal state resets when React remounts per item. */
function StudyCard({
  kind,
  front,
  back,
  onGrade,
}: {
  kind: string
  front: ReactNode
  back: ReactNode
  onGrade: (o: Outcome) => void
}) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="study-card">
      <span className="card-kind">{kind}</span>
      <div className="card-front">{front}</div>
      {revealed ? (
        <>
          <div className="card-back">{back}</div>
          <GradeBar onGrade={onGrade} />
        </>
      ) : (
        <button className="reveal-btn" onClick={() => setRevealed(true)}>
          Reveal
        </button>
      )}
    </div>
  )
}

export function VocabCard({ item, onGrade }: { item: VocabItem; onGrade: (o: Outcome) => void }) {
  return (
    <StudyCard
      kind="Vocabulary"
      front={<span className="jp-xl">{item.expression}</span>}
      onGrade={onGrade}
      back={
        <>
          <div className="reading">{item.reading}</div>
          <ul className="glosses">
            {item.senses.slice(0, 3).map((s, i) => (
              <li key={i}>
                {s.gloss.slice(0, 3).join('; ')}
                {s.pos.length > 0 && <span className="pos"> · {s.pos.slice(0, 2).join(' ')}</span>}
              </li>
            ))}
          </ul>
        </>
      }
    />
  )
}

export function KanjiCard({
  item,
  stroke,
  onGrade,
}: {
  item: KanjiItem
  stroke?: StrokeItem
  onGrade: (o: Outcome) => void
}) {
  return (
    <StudyCard
      kind="Kanji"
      front={<span className="jp-xl">{item.literal}</span>}
      onGrade={onGrade}
      back={
        <>
          <div className="readings">
            {item.readingsOn.length > 0 && <span className="on">音 {item.readingsOn.slice(0, 3).join('・')}</span>}
            {item.readingsKun.length > 0 && <span className="kun">訓 {item.readingsKun.slice(0, 3).join('・')}</span>}
          </div>
          <div className="meanings">{item.meanings.slice(0, 4).join(', ')}</div>
          {stroke && <StrokeViewer item={stroke} />}
        </>
      }
    />
  )
}

export function SentenceCard({ item, onGrade }: { item: SentenceItem; onGrade: (o: Outcome) => void }) {
  return (
    <StudyCard
      kind="Sentence"
      front={<span className="jp-lg">{item.ja}</span>}
      onGrade={onGrade}
      back={<div className="en">{item.en}</div>}
    />
  )
}
