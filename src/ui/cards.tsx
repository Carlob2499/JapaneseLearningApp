import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { toHiragana, toKana } from 'wanakana'
import type { GrammarPoint, KanaItem, KanjiItem, Outcome, SentenceItem, StrokeItem, VocabItem } from '@hikkoshi/schemas'
import type { Choice } from '../review/choices'
import { useAudio } from '../audio/useAudio'
import { hankoPop, pulsePass, shakeFail, staggerIn } from '../motion/timelines'
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

/** How each register is labelled and tinted on a card — the felt, taught dimension of the scaffold. */
const REGISTER_META: Record<SentenceItem['register'], { label: string; group: string; title: string }> = {
  polite: { label: 'polite', group: 'polite', title: '丁寧語 (teineigo) — です/ます. The polite default you learn to produce first.' },
  plain: { label: 'plain', group: 'plain', title: '常体 (futsūtai) — plain / dictionary form.' },
  casual: { label: 'casual', group: 'casual', title: 'くだけた話し方 — informal speech among friends.' },
  keigo_respectful: { label: 'keigo', group: 'keigo', title: '尊敬語 (sonkeigo) — respectful language that raises the other person.' },
  keigo_humble: { label: 'keigo', group: 'keigo', title: '謙譲語 (kenjōgo) — humble language that lowers yourself.' },
  service_script: { label: 'formal', group: 'keigo', title: '接客・丁重語 — service-industry formal speech (でございます, いらっしゃいませ).' },
}

/** Small register label on a sentence — a heuristic estimate from the sentence's ending (D-015). */
export function RegisterChip({ register }: { register: SentenceItem['register'] }) {
  const m = REGISTER_META[register]
  return (
    <span className="register-chip" data-reg={m.group} title={m.title} data-testid="register-chip">
      {m.label}
    </span>
  )
}

/** The grader's vermillion maru (D-026) — the ○ a Japanese teacher presses beside a correct
 *  answer. Decorative reinforcement only (aria-hidden): the color change and the 正解 line
 *  already carry the result. The dash gap + tilt keep it hand-pressed, not geometric. */
function MaruMark({ className }: { className: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useGSAP(
    () => {
      if (ref.current) hankoPop(ref.current)
    },
    { scope: ref },
  )
  return (
    <svg ref={ref} className={`maru-mark ${className}`} viewBox="0 0 32 32" aria-hidden="true">
      <circle
        cx="16"
        cy="16"
        r="11.5"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="66 8"
        transform="rotate(-52 16 16)"
        opacity="0.92"
      />
    </svg>
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
  onReveal,
}: {
  kind: string
  front: ReactNode
  back: ReactNode
  onGrade: (o: Outcome) => void
  onReveal?: () => void
}) {
  const [revealed, setRevealed] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (revealed) staggerIn('.card-back, .grade-bar')
    },
    { dependencies: [revealed], scope: rootRef },
  )
  return (
    <div className="study-card" ref={rootRef}>
      <span className="card-kind">{kind}</span>
      <div className="card-front">{front}</div>
      {revealed ? (
        <>
          <div className="card-back">{back}</div>
          <GradeBar onGrade={onGrade} />
        </>
      ) : (
        <button
          className="reveal-btn"
          onClick={() => {
            setRevealed(true)
            onReveal?.()
          }}
        >
          Reveal
        </button>
      )}
    </div>
  )
}

export function VocabCard({
  item,
  onGrade,
  autoPlay,
}: {
  item: VocabItem
  onGrade: (o: Outcome) => void
  autoPlay?: boolean
}) {
  const { available, speak } = useAudio()
  return (
    <StudyCard
      kind="Vocabulary"
      front={<span className="jp-xl">{item.expression}</span>}
      onGrade={onGrade}
      onReveal={() => {
        if (autoPlay && available) speak(item.reading)
      }}
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

/** One kana (D-023): the character cues its sound; the back shows romaji + stroke order. A yōon
 *  (D-029) carries two component glyphs, so the back shows a stroke chart for each. */
export function KanaCard({
  item,
  strokes,
  onGrade,
  autoPlay,
}: {
  item: KanaItem
  strokes?: StrokeItem[]
  onGrade: (o: Outcome) => void
  autoPlay?: boolean
}) {
  const { available, speak } = useAudio()
  return (
    <StudyCard
      kind="Kana"
      front={
        <div className="kana-front">
          <span className="kana-script">{item.script === 'hiragana' ? 'ひらがな · hiragana' : 'カタカナ · katakana'}</span>
          <span className="jp-xl">{item.char}</span>
        </div>
      }
      onGrade={onGrade}
      onReveal={() => {
        if (autoPlay && available) speak(item.char)
      }}
      back={
        <>
          <div className="reading">
            {item.romaji} <SpeakButton text={item.char} />
          </div>
          {item.altRomaji && item.altRomaji.length > 0 && (
            <p className="kana-alt">also typed: {item.altRomaji.join(', ')}</p>
          )}
          {strokes && strokes.length > 0 && (
            <div className="kana-strokes">
              {strokes.map((s) => (
                <StrokeViewer key={s.id} item={s} />
              ))}
            </div>
          )}
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
        <div className="sentence-front">
          <RegisterChip register={item.register} />
          <span className="jp-lg">
            {item.ja} <SpeakButton text={item.ja} />
          </span>
        </div>
      }
      onGrade={onGrade}
      back={<div className="en">{item.en}</div>}
    />
  )
}

export function GrammarCard({ item, onGrade }: { item: GrammarPoint; onGrade: (o: Outcome) => void }) {
  const lead = item.examples[0]
  return (
    <StudyCard
      kind="Grammar"
      front={
        <div className="grammar-front">
          <span className="jp-lg">{item.name}</span>
          {lead && (
            <span className="grammar-lead">
              {lead.ja} <SpeakButton text={lead.ja} />
            </span>
          )}
        </div>
      }
      onGrade={onGrade}
      back={
        <div className="grammar-back">
          <div className="grammar-gloss">{item.gloss}</div>
          <p className="grammar-summary">{item.summary}</p>
          <ul className="grammar-examples">
            {item.examples.map((e, i) => (
              <li key={i}>
                <span className="ex-ja">
                  {e.ja} <SpeakButton text={e.ja} />
                </span>
                <span className="ex-en">{e.en}</span>
              </li>
            ))}
          </ul>
          <p className="grammar-cite">
            {item.textbookAnchors && item.textbookAnchors.length > 0 && (
              <span>{item.textbookAnchors.map((a) => `${a.book} ch.${a.chapter}`).join(' · ')} · </span>
            )}
            placement: {item.citations.map((c) => c.name).join('; ')}
          </p>
        </div>
      }
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
  onPick,
  revealAfter,
}: {
  kind: string
  prompt: ReactNode
  question: string
  choices: Choice[]
  onGrade: (o: Outcome) => void
  /** Fires the moment an option is selected (before grading) — used by the speed beat to stop
   *  its countdown. Optional: the flashcard review doesn't pass it. */
  onPick?: () => void
  /** Content revealed once an option is picked — e.g. the listening card's spoken text (D-028),
   *  so an audio-first card teaches the written form after the ear has done the work. */
  revealAfter?: ReactNode
}) {
  const [selected, setSelected] = useState<Choice | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const { contextSafe } = useGSAP(() => staggerIn('.choice'), { scope: rootRef })

  // Feedback fires here, on the pick — not on the later "Next →"/onGrade click, which unmounts
  // this card before a tween would ever paint. contextSafe tracks/cleans up this event-triggered
  // tween the same way useGSAP's setup callback is tracked automatically.
  const pick = contextSafe((c: Choice, target: HTMLButtonElement) => {
    setSelected(c)
    onPick?.()
    if (c.correct) pulsePass(target)
    else shakeFail(target)
  })

  return (
    <div className="study-card" ref={rootRef}>
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
              onClick={(e) => pick(c, e.currentTarget)}
            >
              {c.text}
              {selected?.correct && c.correct && <MaruMark className="maru-on-choice" />}
            </button>
          )
        })}
      </div>
      {selected && revealAfter && <div className="choice-reveal">{revealAfter}</div>}
      {selected && (
        <button className="next-btn" onClick={() => onGrade(selected.correct ? 'pass' : 'fail')}>
          Next →
        </button>
      )}
    </div>
  )
}

/**
 * Listening card (D-028): audio-first recognition. The prompt is a replay button and *no text* —
 * the learner hears the word/sentence and picks the meaning from the same verbatim choice pool a
 * recognition card uses. It auto-plays once on mount when auto-play is on, always offers replay,
 * and reveals the spoken text after answering (so the card teaches, not only tests). Only reached
 * when a device Japanese voice exists (the scheduler gates it), so it is never silent.
 */
export function ListeningCard({
  kind,
  question,
  spokenText,
  revealText,
  choices,
  onGrade,
  autoPlay,
}: {
  kind: string
  question: string
  /** The Japanese voiced by 🔊 — the reading (vocab), the character (kana), or the sentence. */
  spokenText: string
  /** Shown after answering: the written form of what was heard. */
  revealText: ReactNode
  choices: Choice[]
  onGrade: (o: Outcome) => void
  autoPlay?: boolean
}) {
  const { available, speak } = useAudio()
  const played = useRef(false)
  useEffect(() => {
    if (autoPlay && available && !played.current) {
      played.current = true
      speak(spokenText)
    }
  }, [autoPlay, available, speak, spokenText])
  return (
    <ChoiceCard
      kind={kind}
      prompt={
        <button type="button" className="listen-prompt" onClick={() => speak(spokenText)} aria-label="Play audio, then choose">
          <span className="listen-icon" aria-hidden="true">
            🔊
          </span>
          <span className="listen-hint">Listen · tap to replay</span>
        </button>
      }
      question={question}
      choices={choices}
      onGrade={onGrade}
      revealAfter={
        <span className="listening-answer">
          {revealText} <SpeakButton text={spokenText} />
        </span>
      }
    />
  )
}

/**
 * Typed production: the learner types the reading (romaji auto-converts to kana via wanakana),
 * checks it against the verified reading, then advances. Correct → pass, wrong → fail. Grading
 * normalises both sides to hiragana so kana or romaji input both work.
 *
 * `raw` mode (D-023, kana cards): the answer IS romaji, so input stays as typed (no kana IME
 * conversion) and grading is a case-folded match against the answer plus its `accept`
 * alternates (shi/si, wo/o, …) — a correct learner can never be failed by a spelling variant.
 * `speakText` overrides what the 🔊/auto-play voices (the kana character, not English romaji).
 */
export function TypedCard({
  kind,
  prompt,
  answer,
  onGrade,
  autoPlay,
  raw,
  accept,
  speakText,
}: {
  kind: string
  prompt: ReactNode
  answer: string
  onGrade: (o: Outcome) => void
  autoPlay?: boolean
  raw?: boolean
  accept?: string[]
  speakText?: string
}) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { available, speak } = useAudio()
  const { contextSafe } = useGSAP()
  useEffect(() => inputRef.current?.focus(), [])

  const target = raw ? answer.trim().toLowerCase() : toHiragana(answer).trim()
  const spoken = speakText ?? target
  // Feedback fires here, on check() — not on the later "Next →"/onGrade click, which unmounts
  // this card before a tween would ever paint.
  const check = contextSafe(() => {
    if (result !== null || value.trim() === '') return
    const correct = raw
      ? [target, ...(accept ?? []).map((a) => a.trim().toLowerCase())].includes(value.trim().toLowerCase())
      : toHiragana(value).trim() === target
    setResult(correct ? 'correct' : 'wrong')
    if (inputRef.current) {
      if (correct) pulsePass(inputRef.current)
      else shakeFail(inputRef.current)
    }
    if (autoPlay && available) speak(spoken) // hear the correct reading
  })

  return (
    <div className="study-card">
      <span className="card-kind">{kind}</span>
      <div className="card-front">{prompt}</div>
      <p className="choice-q">{raw ? 'Type the sound (romaji)' : 'Type the reading'}</p>
      <input
        ref={inputRef}
        className={`typed-input${result ? ` ${result}` : ''}`}
        value={value}
        onChange={(e) => setValue(raw ? e.target.value : toKana(e.target.value, { IMEMode: true }))}
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
            {result === 'correct' && <MaruMark className="maru-on-line" />}
            {result === 'correct' ? '正解 · correct' : `Answer: ${target}`} <SpeakButton text={spoken} />
          </p>
          <button className="next-btn" onClick={() => onGrade(result === 'correct' ? 'pass' : 'fail')}>
            Next →
          </button>
        </>
      )}
    </div>
  )
}
