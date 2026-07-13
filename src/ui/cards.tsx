import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toHiragana, toKana } from 'wanakana'
import type { KanjiItem, Outcome, SentenceItem, StrokeItem, VocabItem } from '@hikkoshi/schemas'
import type { Choice } from '../review/choices'
import { useAudio } from '../audio/useAudio'
import StrokeViewer from './StrokeViewer'
import './study.css'

/** A 🔊 button that voices Japanese text; renders nothing where the device has no Japanese voice. */
export function SpeakButton({ text }: { text: string }) {
  const { available, speak } = useAudio()
  if (!available) return null
  return (
    <button
      type="button"
      className="speak-btn"
      aria-label="Play pronunciation"
      onClick={() => speak(text)}
      data-testid="speak"
    >
      🔊
    </button>
  )
}

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
          <div className="reading">
            {item.reading} <SpeakButton text={item.reading} />
          </div>
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
      front={
        <span className="jp-lg">
          {item.ja} <SpeakButton text={item.ja} />
        </span>
      }
      onGrade={onGrade}
      back={<div className="en">{item.en}</div>}
    />
  )
}

/**
 * Multiple-choice card: pick the correct option, see the answer, advance. Kind-agnostic —
 * the caller supplies the prompt and question; every option is verbatim dataset content.
 * A correct pick grades `pass`, a wrong pick `fail`.
 */
export function ChoiceCard({
  kind,
  prompt,
  question,
  choices,
  onGrade,
}: {
  kind: string
  prompt: ReactNode
  question: string
  choices: Choice[]
  onGrade: (o: Outcome) => void
}) {
  const [selected, setSelected] = useState<Choice | null>(null)
  return (
    <div className="study-card">
      <span className="card-kind">{kind}</span>
      <div className="card-front">{prompt}</div>
      <p className="choice-q">{question}</p>
      <div className="choices">
        {choices.map((c, i) => {
          const cls = ['choice']
          if (selected) {
            if (c.correct) cls.push('correct')
            else if (c === selected) cls.push('wrong')
          }
          return (
            <button
              key={i}
              className={cls.join(' ')}
              data-testid="choice"
              data-correct={c.correct}
              disabled={selected !== null}
              onClick={() => setSelected(c)}
            >
              {c.text}
            </button>
          )
        })}
      </div>
      {selected && (
        <button className="next-btn" onClick={() => onGrade(selected.correct ? 'pass' : 'fail')}>
          Next →
        </button>
      )}
    </div>
  )
}

/**
 * Typed production: the learner types the reading (romaji auto-converts to kana via wanakana),
 * checks it against the verified reading, then advances. Correct → pass, wrong → fail. Grading
 * normalises both sides to hiragana so kana or romaji input both work.
 */
export function TypedCard({
  kind,
  prompt,
  answer,
  onGrade,
}: {
  kind: string
  prompt: ReactNode
  answer: string
  onGrade: (o: Outcome) => void
}) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => inputRef.current?.focus(), [])

  const target = toHiragana(answer).trim()
  function check() {
    if (result !== null || value.trim() === '') return
    setResult(toHiragana(value).trim() === target ? 'correct' : 'wrong')
  }

  return (
    <div className="study-card">
      <span className="card-kind">{kind}</span>
      <div className="card-front">{prompt}</div>
      <p className="choice-q">Type the reading</p>
      <input
        ref={inputRef}
        className={`typed-input${result ? ` ${result}` : ''}`}
        value={value}
        onChange={(e) => setValue(toKana(e.target.value, { IMEMode: true }))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') check()
        }}
        disabled={result !== null}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Reading"
        data-testid="typed-input"
      />
      {result === null ? (
        <button className="next-btn" onClick={check} disabled={value.trim() === ''}>
          Check
        </button>
      ) : (
        <>
          <p className={`typed-feedback ${result}`} data-testid="typed-feedback">
            {result === 'correct' ? '正解 · correct' : `Answer: ${target}`} <SpeakButton text={target} />
          </p>
          <button className="next-btn" onClick={() => onGrade(result === 'correct' ? 'pass' : 'fail')}>
            Next →
          </button>
        </>
      )}
    </div>
  )
}
