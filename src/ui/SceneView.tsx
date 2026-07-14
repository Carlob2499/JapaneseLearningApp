import { useEffect, useState } from 'react'
import type { Level, SceneTemplate } from '@hikkoshi/schemas'
import { loadLevels, type Content } from '../content/packs'
import { EnterOnMount } from '../motion/EnterOnMount'
import { useScene } from '../scenes/useScene'
import { ChoiceCard, SpeakButton } from './cards'
import './scene.css'

/** Product colors for the receding shelf rows — muted, warm, never neon (cozy-game palette). */
const SHELF_HUES = ['#c98a5b', '#5b8f7a', '#c2a45c', '#7a8fae', '#b5715a', '#8a9c6a']

function ShelfRow({ y, count, scale, opacity }: { y: number; count: number; scale: number; opacity: number }) {
  const w = 340 / count
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          x={30 + i * (w + 4)}
          y={y}
          width={w * 0.85}
          height={22 * scale}
          rx={3}
          fill={SHELF_HUES[i % SHELF_HUES.length]}
        />
      ))}
    </g>
  )
}

/** A hand-authored flat-vector konbini counter — the scene's "juice," not a stock photo. */
function SceneBackdrop() {
  return (
    <div className="scene-backdrop">
      <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Konbini checkout counter">
        <defs>
          <linearGradient id="sceneSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--paper)" />
            <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="400" height="200" fill="url(#sceneSky)" />

        {/* Noren banner hanging above the shelves. */}
        <g>
          <rect x="16" y="10" width="46" height="30" rx="2" fill="var(--accent-2)" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={16 + i * 11.5} y="38" width="9" height="10" fill="var(--accent-2)" />
          ))}
          <text x="39" y="31" textAnchor="middle" fontSize="16" fill="var(--paper)" fontWeight="700">
            店
          </text>
        </g>

        {/* Receding shelves — depth via shrinking scale + rising opacity toward the front. */}
        <ShelfRow y={44} count={7} scale={0.7} opacity={0.55} />
        <ShelfRow y={70} count={6} scale={0.85} opacity={0.75} />
        <ShelfRow y={98} count={5} scale={1} opacity={0.9} />

        {/* Abstract clerk — geometric, not a face: a considered flat shape, not an uncanny render. */}
        <g opacity="0.9">
          <rect x="318" y="70" width="34" height="54" rx="12" fill="var(--accent-2)" />
          <circle cx="335" cy="60" r="15" fill="var(--wood)" />
        </g>

        {/* Counter, bevelled. */}
        <path d="M0,132 L400,132 L400,200 L0,200 Z" fill="var(--wood-dark)" />
        <path d="M0,132 L400,132 L400,144 L0,144 Z" fill="var(--wood)" />

        {/* Register on the counter. */}
        <rect x="250" y="106" width="52" height="30" rx="4" fill="var(--card)" stroke="var(--line)" />
        <circle cx="292" cy="116" r="3" fill="var(--accent)" />
      </svg>
    </div>
  )
}

function DialogueBox({ jp, en, speakable }: { jp?: string; en: string; speakable?: string }) {
  return (
    <div className="scene-dialogue">
      <span className="nameplate">店員 · Clerk</span>
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
                {s.item.expression} <span style={{ color: 'var(--muted)' }}>{s.item.reading}</span>
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
      <div className="scene-progress">
        <button className="ghost-btn" onClick={onExit}>
          ← Leave errand
        </button>
        <span>
          Errand · {Math.min(api.stepIndex + 1, api.totalSteps)}/{api.totalSteps}
        </span>
      </div>

      <SceneBackdrop />

      <EnterOnMount key={api.stepIndex} className="scene-stage">
        {step?.kind === 'narration' && (
          <>
            <DialogueBox en={step.text} jp={api.phrase?.pattern} speakable={api.phrase?.pattern} />
            <button className="scene-continue-btn" onClick={api.advance}>
              Continue →
            </button>
          </>
        )}

        {step?.kind === 'beat' && api.item && api.choices && (() => {
          // 'recognize' → recognition mode: JP is the cue, pick the meaning.
          // 'recall' → production mode: the meaning is the cue, pick the JP word (uncued, harder).
          const gloss = api.item.senses[0]?.gloss[0] ?? api.item.expression
          const recognizing = step.beat.interaction === 'recognize'
          return (
            <>
              <DialogueBox en={step.text} jp={api.phrase?.pattern} speakable={api.phrase?.pattern} />
              <ChoiceCard
                kind="Errand"
                prompt={<span className="jp-lg">{recognizing ? api.item.expression : gloss}</span>}
                question={recognizing ? 'What does the clerk mean?' : `How do you say "${gloss}"?`}
                choices={api.choices}
                onGrade={api.grade}
              />
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
