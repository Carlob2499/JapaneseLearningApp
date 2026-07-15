import { useCallback, useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import type { Level, SceneTemplate, VocabItem } from '@hikkoshi/schemas'
import { loadLevels, type Content } from '../content/packs'
import type { Choice } from '../review/choices'
import { EnterOnMount } from '../motion/EnterOnMount'
import { useFlipLanding } from '../motion/useFlipLanding'
import { ambientDrift, enterTimeline, gentleSway } from '../motion/timelines'
import { useScene } from '../scenes/useScene'
import { ChoiceCard, SpeakButton, TypedCard } from './cards'
import konbiniPhoto from '../assets/photos/konbini-heartin.webp'
import transitPhoto from '../assets/photos/transit-mikunigaoka.webp'
import './photo.css'
import './scene.css'

/** Seconds a `speed` beat allows before the register "beeps" and it auto-fails. */
const SPEED_SECONDS = 6

/**
 * A countdown for `speed` beats (D-020). Timing lives in plain timers (not GSAP) so it is never
 * collapsed by the reduced-motion duration system — the clock is functional, not decoration. The
 * draining bar is pure CSS and disables itself under `prefers-reduced-motion`; the numeric second
 * count is always shown, so the beat stays fully playable with motion off (E8 text-first).
 */
export function SpeedTimer({ seconds, stopped, onTimeout }: { seconds: number; stopped: boolean; onTimeout: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const firedRef = useRef(false)
  const timeoutRef = useRef(onTimeout)
  timeoutRef.current = onTimeout

  useEffect(() => {
    if (stopped) return
    const interval = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    const timer = setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true
        timeoutRef.current()
      }
    }, seconds * 1000)
    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [seconds, stopped])

  return (
    <div className="speed-timer" aria-hidden="true">
      <div className="speed-bar">
        <div
          className={`speed-bar-fill${stopped ? ' stopped' : ''}`}
          style={{ animationDuration: `${seconds}s` }}
        />
      </div>
      <span className="speed-count">{stopped ? '✓' : remaining}</span>
    </div>
  )
}

/** A timed recognition beat: the countdown runs until the learner picks; timing out grades a
 *  fail (too slow at the register) and advances. */
function SpeedBeat({
  item,
  choices,
  question,
  onGrade,
}: {
  item: VocabItem
  choices: Choice[]
  question: string
  onGrade: (o: 'pass' | 'fail' | 'partial') => void
}) {
  const [picked, setPicked] = useState(false)
  const onGradeRef = useRef(onGrade)
  onGradeRef.current = onGrade
  const handleTimeout = useCallback(() => onGradeRef.current('fail'), [])
  return (
    <>
      <SpeedTimer seconds={SPEED_SECONDS} stopped={picked} onTimeout={handleTimeout} />
      <ChoiceCard
        kind="Errand · quick!"
        prompt={<span className="jp-lg">{item.expression}</span>}
        question={question}
        choices={choices}
        onGrade={onGrade}
        onPick={() => setPicked(true)}
      />
    </>
  )
}

/**
 * The scene stage (D-026): a real photograph of the place — duotone-washed into the app's
 * aizome world, breathing via Ken Burns — with the hand-drawn vector story layer swaying on
 * top (a noren valance for the konbini, an ekimeihyō sign for the platform). "Photo is the
 * world, vector is the story." A speed beat adds an urgency vignette (CSS, calm under
 * reduced motion).
 */
const STAGE_PHOTO: Record<SceneTemplate['sceneKind'], { src: string; label: string }> = {
  konbini: { src: konbiniPhoto, label: 'A convenience-store entrance in Japan, glowing in a station concourse' },
  transit: { src: transitPhoto, label: 'A local train arriving at a Japanese station platform' },
}

function NorenAccent() {
  return (
    <svg className="scene-accent scene-accent-sway" viewBox="0 0 120 46" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={i * 24.5} y="0" width="22" height={i === 2 ? 44 : 38} rx="2" fill="var(--accent-2)" opacity="0.94" />
      ))}
      <text x="60" y="30" textAnchor="middle" fontSize="15" fill="var(--paper)" fontWeight="700">
        店
      </text>
    </svg>
  )
}

function EkimeihyoAccent() {
  return (
    <svg className="scene-accent scene-accent-sway scene-accent-right" viewBox="0 0 96 64" aria-hidden="true">
      <rect x="14" y="0" width="4" height="16" fill="var(--muted)" />
      <rect x="78" y="0" width="4" height="16" fill="var(--muted)" />
      <rect x="4" y="14" width="88" height="38" rx="5" fill="var(--card)" stroke="var(--line)" />
      <text x="48" y="39" textAnchor="middle" fontSize="16" fill="var(--ink)" fontWeight="700">
        駅
      </text>
      <rect x="4" y="44" width="88" height="8" rx="3" fill="var(--accent-2)" />
    </svg>
  )
}

function ScenePhotoStage({ kind, urgent }: { kind: SceneTemplate['sceneKind']; urgent: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (!ref.current) return
      enterTimeline(ref.current)
      const img = ref.current.querySelector('img')
      if (img) ambientDrift(img)
      const sway = ref.current.querySelector('.scene-accent-sway')
      if (sway) gentleSway(sway)
    },
    { scope: ref },
  )
  const photo = STAGE_PHOTO[kind]
  return (
    <div className={`photo-band scene-photo${urgent ? ' urgent' : ''}`} ref={ref} role="img" aria-label={photo.label}>
      <img src={photo.src} alt="" />
      {kind === 'konbini' ? <NorenAccent /> : <EkimeihyoAccent />}
    </div>
  )
}

/** The speed beat's ticking-clock framing, per world. */
const SPEED_QUESTION: Record<SceneTemplate['sceneKind'], string> = {
  konbini: 'Read it before the register beeps.',
  transit: 'Read it before the doors close.',
}

/** Who's speaking, per scene kind — a station's lines are announcements, not a clerk. */
const SPEAKER_BY_KIND: Record<SceneTemplate['sceneKind'], string> = {
  konbini: '店員 · Clerk',
  transit: '放送 · Announcement',
}

function DialogueBox({ speaker, jp, en, speakable }: { speaker: string; jp?: string; en: string; speakable?: string }) {
  return (
    <div className="scene-dialogue">
      <span className="nameplate">{speaker}</span>
      {jp && (
        <span className="jp-line">
          {jp} {speakable && <SpeakButton text={speakable} />}
        </span>
      )}
      <p className="narration">{en}</p>
    </div>
  )
}

/** Runs one already-loaded scene. Split out from `SceneView` so `useScene` only ever sees
 *  a ready `Content` — the content-loading phase lives in the wrapper below. */
function ScenePlayer({
  scene,
  content,
  onExit,
}: {
  scene: SceneTemplate
  content: Content
  onExit: () => void
}) {
  const api = useScene(scene, content)
  const progressRef = useFlipLanding<HTMLDivElement>('home-to-scene')

  if (api.mode === 'loading') {
    return (
      <main className="shell scene-view">
        <p className="loading">Setting up your errand…</p>
      </main>
    )
  }

  if (api.mode === 'error') {
    return (
      <main className="shell scene-view">
        <section className="card summary">
          <h2>Couldn't start this errand</h2>
          <p>{api.error ?? 'Something went wrong.'}</p>
          <button className="ghost-btn" onClick={onExit}>
            Back home
          </button>
        </section>
      </main>
    )
  }

  if (api.mode === 'complete') {
    const passed = api.summary.filter((s) => s.outcome === 'pass').length
    return (
      <main className="shell scene-view">
        <section className="scene-summary">
          <h2>Receipt</h2>
          {api.summary.map((s, i) => (
            <div className="receipt-row" key={i}>
              <span>
                {s.item ? (
                  <>
                    {s.item.expression} <span style={{ color: 'var(--muted)' }}>{s.item.reading}</span>
                  </>
                ) : (
                  s.phrase
                )}
              </span>
              <span className={`receipt-outcome ${s.outcome}`}>{s.outcome === 'pass' ? 'OK' : 'MISS'}</span>
            </div>
          ))}
          <div className="receipt-total">
            <span>Handled</span>
            <span>
              {passed}/{api.summary.length}
            </span>
          </div>
        </section>
        <button className="start-btn" onClick={onExit}>
          Back home
        </button>
      </main>
    )
  }

  const { step } = api
  return (
    <main className="shell scene-view">
      <div className="scene-progress" ref={progressRef}>
        <button className="ghost-btn" onClick={onExit}>
          ← Leave errand
        </button>
        <span>
          Errand · {Math.min(api.stepIndex + 1, api.totalSteps)}/{api.totalSteps}
        </span>
      </div>

      <ScenePhotoStage kind={scene.sceneKind} urgent={api.beat?.render === 'mc' && api.beat.timed} />

      <EnterOnMount key={api.stepIndex} className="scene-stage">
        {step?.kind === 'narration' && (
          <>
            <DialogueBox speaker={SPEAKER_BY_KIND[scene.sceneKind]} en={step.text} jp={api.phrase?.pattern} speakable={api.phrase?.pattern} />
            <button className="scene-continue-btn" onClick={api.advance}>
              Continue →
            </button>
          </>
        )}

        {step?.kind === 'beat' && api.beat && (() => {
          const beat = api.beat
          // Context beat: the JP options ARE the answer, so the clerk's line is withheld — only
          // the English situation is shown, and the learner picks the fitting cited service line.
          if (beat.render === 'phrase') {
            return (
              <>
                <DialogueBox speaker={SPEAKER_BY_KIND[scene.sceneKind]} en={step.text} />
                <ChoiceCard
                  kind="Errand · which line?"
                  prompt={<span className="scene-situation">Which line fits?</span>}
                  question="Pick what the clerk says here."
                  choices={beat.choices}
                  onGrade={api.grade}
                />
              </>
            )
          }
          // Vocab beats show the clerk's cited line as flavour above the drill.
          return (
            <>
              <DialogueBox speaker={SPEAKER_BY_KIND[scene.sceneKind]} en={step.text} jp={api.phrase?.pattern} speakable={api.phrase?.pattern} />
              {beat.render === 'typed' ? (
                // produce: type the reading of the word, uncued and unaided (the hardest rung).
                <TypedCard
                  kind="Errand · say it"
                  prompt={<span className="jp-lg">{beat.gloss}</span>}
                  answer={beat.answer}
                  onGrade={api.grade}
                />
              ) : beat.timed ? (
                // speed: timed recognition — decode the word before the countdown runs out.
                <SpeedBeat item={beat.item} choices={beat.choices} question={SPEED_QUESTION[scene.sceneKind]} onGrade={api.grade} />
              ) : (
                // recognize (JP cue → meaning) / recall (meaning cue → JP word, uncued).
                <ChoiceCard
                  kind="Errand"
                  prompt={<span className="jp-lg">{beat.mode === 'recognition' ? beat.item.expression : beat.gloss}</span>}
                  question={beat.mode === 'recognition' ? 'What does the clerk mean?' : `How do you say "${beat.gloss}"?`}
                  choices={beat.choices}
                  onGrade={api.grade}
                />
              )}
            </>
          )
        })()}
      </EnterOnMount>
    </main>
  )
}

/** Loads content for the given levels, finds `sceneId` in it, and hands off to `ScenePlayer`. */
export default function SceneView({
  levels,
  sceneId,
  onExit,
}: {
  levels: Level[]
  sceneId: string
  onExit: () => void
}) {
  const [content, setContent] = useState<Content | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void loadLevels(levels).then(
      (c) => {
        if (alive) setContent(c)
      },
      (e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : 'Could not load your progress or content.')
      },
    )
    return () => {
      alive = false
    }
  }, [levels])

  if (error) {
    return (
      <main className="shell scene-view">
        <section className="card summary">
          <h2>Couldn't start this errand</h2>
          <p>{error}</p>
          <button className="ghost-btn" onClick={onExit}>
            Back home
          </button>
        </section>
      </main>
    )
  }
  if (!content) {
    return (
      <main className="shell scene-view">
        <p className="loading">Setting up your errand…</p>
      </main>
    )
  }

  const scene = content.scenes.find((s) => s.id === sceneId)
  if (!scene) {
    return (
      <main className="shell scene-view">
        <section className="card summary">
          <h2>Errand not available</h2>
          <p>This errand isn't in your selected levels yet.</p>
          <button className="ghost-btn" onClick={onExit}>
            Back home
          </button>
        </section>
      </main>
    )
  }

  return <ScenePlayer scene={scene} content={content} onExit={onExit} />
}
