import { useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import type { Level, Outcome } from '@hikkoshi/schemas'
import { useReview, type Presentation, type Reviewable } from '../review/useReview'
import { useAudio } from '../audio/useAudio'
import { EnterOnMount } from '../motion/EnterOnMount'
import { useFlipLanding } from '../motion/useFlipLanding'
import { isReducedMotion } from '../motion/reducedMotion'
import { staggerIn } from '../motion/timelines'
import { revealChars } from '../motion/typeReveal'
import { getAutoPlay, setAutoPlay as saveAutoPlay } from '../store/settings'
import { ChoiceCard, GrammarCard, KanaCard, KanjiCard, ListeningCard, MaruMark, RegisterChip, SentenceCard, TypedCard, VocabCard } from './cards'
import './study.css'
import './cinematic.css'

const KIND_LABEL: Record<Reviewable['kind'], string> = {
  vocab: 'Vocabulary',
  kanji: 'Kanji',
  kana: 'Kana',
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
    case 'kana':
      return <KanaCard item={r.item} strokes={r.strokes} onGrade={onGrade} autoPlay={autoPlay} />
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
  if (r.kind === 'kana') {
    // recognition only (typed replaces production for kana): the character cues its sound. The
    // script label rides along — a beginner's first encounter should say which syllabary this is.
    return {
      prompt: (
        <div className="kana-front">
          <span className="kana-script">
            {r.item.script === 'hiragana' ? 'ひらがな · hiragana' : 'カタカナ · katakana'}
          </span>
          <span className="jp-xl">{r.item.char}</span>
        </div>
      ),
      question: 'Which sound?',
    }
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

/** What the listening card (D-028) voices and reveals, per kind. Only vocab/kana/sentence ever
 *  reach here (the scheduler's LISTENABLE gate); anything else falls back to a plain recall card. */
function listeningCardFor(r: Reviewable): { spokenText: string; revealText: ReactNode; question: string } | null {
  switch (r.kind) {
    case 'vocab':
      return {
        spokenText: r.item.reading,
        revealText: (
          <span className="listening-reveal">
            <span className="jp-lg">{r.item.expression}</span>
            <span className="reading">{r.item.reading}</span>
          </span>
        ),
        question: 'Which meaning?',
      }
    case 'kana':
      return { spokenText: r.item.char, revealText: <span className="jp-xl">{r.item.char}</span>, question: 'Which sound?' }
    case 'sentence':
      return { spokenText: r.item.ja, revealText: <span className="jp-lg">{r.item.ja}</span>, question: 'Which translation?' }
    default:
      return null
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
  if (mode === 'listening') {
    const spec = choices ? listeningCardFor(r) : null
    if (spec && choices) {
      return (
        <ListeningCard
          kind={KIND_LABEL[r.kind]}
          question={spec.question}
          spokenText={spec.spokenText}
          revealText={spec.revealText}
          choices={choices}
          onGrade={onGrade}
          autoPlay={autoPlay}
        />
      )
    }
    return <RecallCard r={r} onGrade={onGrade} autoPlay={autoPlay} />
  }
  if (mode === 'typed') {
    if (r.kind === 'kana') {
      // Type the SOUND: raw romaji input graded against Hepburn + acceptance alternates (D-023).
      return (
        <TypedCard
          kind={KIND_LABEL[r.kind]}
          prompt={<span className="jp-xl">{r.item.char}</span>}
          answer={r.item.romaji}
          accept={r.item.altRomaji}
          raw
          speakText={r.item.char}
          onGrade={onGrade}
          autoPlay={autoPlay}
        />
      )
    }
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

/**
 * The day-end moment (D-033): the session summary as a small close-of-day ceremony — the
 * 「今日はここまで」 eyebrow writes itself in, the reviewed count ticks up, and the grader's maru
 * lands as the payoff. The JSX is static and final at first paint (reduced motion, jsdom, and
 * e2e all see the finished state), the buttons are operable from the first frame (their fade
 * starts at 0.35 opacity, never 0, never pointer-events off), and under reduced motion no
 * timeline runs at all. Exported for tests.
 */
export function DayEndSummary({
  reviewed,
  onPracticeMore,
  onHome,
}: {
  reviewed: number
  onPracticeMore: () => void
  onHome: () => void
}) {
  const rootRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || isReducedMotion()) return
      const countEl = root.querySelector('.day-end-count')
      const proxy = { n: 0 }
      const tl = gsap.timeline()
      tl.call(() => {
        if (countEl) countEl.textContent = '0'
      })
        .add(revealChars(root.querySelector('.section-ja')!, { duration: 0.4, stagger: 0.05 }), 0)
        .add(staggerIn(root.querySelectorAll('h2, .day-end-line')), 0.25)
        .to(
          proxy,
          {
            n: reviewed,
            duration: 0.7,
            ease: 'power1.out',
            snap: { n: 1 },
            onUpdate: () => {
              if (countEl) countEl.textContent = String(proxy.n)
            },
          },
          0.3,
        )
        .fromTo('.summary-actions', { opacity: 0.35 }, { opacity: 1, duration: 0.25 }, 0.5)
    },
    { scope: rootRef },
  )

  return (
    <section className="card summary day-end" ref={rootRef}>
      <div className="section-head">
        <span className="section-ja" aria-hidden="true">
          今日はここまで
        </span>
        <h2>Session complete</h2>
        <span className="section-rule" aria-hidden="true" />
      </div>
      <p className="day-end-line">
        You reviewed <strong className="day-end-count">{reviewed}</strong>{' '}
        {reviewed === 1 ? 'item' : 'items'}. The tracked ones return later — that spacing is the
        point.
      </p>
      <MaruMark className="maru-day-end" delay={1} />
      <div className="summary-actions">
        <button className="start-btn" onClick={onPracticeMore}>
          Practice more (untracked)
        </button>
        <button className="ghost-btn" onClick={onHome}>
          Back home
        </button>
      </div>
    </section>
  )
}

export default function ReviewSession({
  levels,
  onHome,
  itemIds,
  sessionLabel,
}: {
  levels: Level[]
  onHome: () => void
  /** Classroom seed/capture (D-035): review exactly these items instead of the scheduler's due/intro. */
  itemIds?: string[]
  /** Progress-bar label override for a seed/capture session ('予習' / '復習'); defaults to 'Review'. */
  sessionLabel?: string
}) {
  const { mode, view, remaining, reviewed, sessionSize, error, grade, practiceMore } = useReview(levels, { itemIds })
  const { available: audioAvailable } = useAudio()
  const [autoPlay, setAutoPlay] = useState<boolean>(() => getAutoPlay())
  const sessionBarRef = useFlipLanding<HTMLDivElement>('home-to-review')

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
        <DayEndSummary reviewed={reviewed} onPracticeMore={practiceMore} onHome={onHome} />
      </main>
    )
  }

  const done = sessionSize - remaining
  return (
    <main className="shell">
      <div className="session-bar" ref={sessionBarRef}>
        <button className="ghost-btn" onClick={onHome}>
          ← Home
        </button>
        <span className="progress-text">
          {mode === 'practice' ? 'Practice' : (sessionLabel ?? 'Review')} · {done}/{sessionSize}
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
        <EnterOnMount key={view.reviewable.id} className="card-slot">
          <Card p={view} onGrade={grade} autoPlay={autoPlay} />
        </EnterOnMount>
      )}
    </main>
  )
}
