import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { isReducedMotion } from '../motion/reducedMotion'
import type { Season } from '../lib/season'
import './ambient.css'

/** Particles per season — hard-capped low: weather you feel, not a screensaver (D-033). */
const DENSITY: Partial<Record<Season, number>> = { spring: 8, tsuyu: 12, autumn: 7, winter: 10 }

/** Resting opacity per season (applied as a GSAP from-value; the CSS default is 0). */
const PARTICLE_OPACITY: Partial<Record<Season, number>> = {
  spring: 0.5,
  tsuyu: 0.3,
  autumn: 0.5,
  winter: 0.45,
}

/** Fall time range in seconds — slow drift, not weather-channel urgency. */
const FALL_SECONDS: Partial<Record<Season, [number, number]>> = {
  spring: [10, 17],
  autumn: [8, 14],
  winter: [12, 20],
}

function Petal() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M6 0 C9 3 9.5 8 6 12 C2.5 8 3 3 6 0 Z" fill="currentColor" />
    </svg>
  )
}

function Momiji() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M7 0 L9 4 L13 4 L10 7 L11 12 L7 9.5 L3 12 L4 7 L1 4 L5 4 Z" fill="currentColor" />
    </svg>
  )
}

function Flake() {
  return (
    <svg width="10" height="10" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M7 0 V14 M0 7 H14 M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function particleFor(season: Season, i: number) {
  if (season === 'tsuyu') return <span className="ambient-p ambient-rain" key={i} />
  const Shape = season === 'spring' ? Petal : season === 'autumn' ? Momiji : Flake
  return (
    <span className="ambient-p" key={i}>
      <Shape />
    </span>
  )
}

/**
 * The kisetsu ambient layer (D-033) — one of the season's two designated channels (with the
 * ground wash; never photos, cards, or text). A fixed, pointer-events:none, aria-hidden layer of
 * at most 12 drifting particles, each on an endlessly recycling GSAP tween (`repeatRefresh`
 * re-rolls the function-based randoms every cycle — no allocation churn, transform/opacity only).
 * Renders nothing at all under reduced motion, under data-saver, and in summer (summer expresses
 * through the ground wash alone — the restraint beat). Pauses whenever the tab is hidden.
 */
export default function AmbientLayer({ season }: { season: Season }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
  const disabled = isReducedMotion() || saveData || DENSITY[season] === undefined

  useGSAP(
    () => {
      const nodes = rootRef.current?.querySelectorAll<HTMLElement>('.ambient-p')
      if (!nodes || nodes.length === 0) return
      const tweens: gsap.core.Tween[] = []
      const opacity = PARTICLE_OPACITY[season] ?? 0.4
      nodes.forEach((node) => {
        if (season === 'tsuyu') {
          tweens.push(
            gsap.fromTo(
              node,
              { y: -24, x: () => gsap.utils.random(0, window.innerWidth), opacity },
              {
                y: () => window.innerHeight + 24,
                duration: () => gsap.utils.random(0.8, 1.3),
                delay: () => gsap.utils.random(0, 1.2),
                ease: 'none',
                repeat: -1,
                repeatRefresh: true,
              },
            ),
          )
          return
        }
        const [min, max] = FALL_SECONDS[season] ?? [10, 16]
        tweens.push(
          gsap.fromTo(
            node,
            {
              y: -30,
              x: () => gsap.utils.random(0, window.innerWidth),
              rotation: () => gsap.utils.random(0, 360),
              opacity,
            },
            {
              y: () => window.innerHeight + 40,
              x: '+=random(-90, 90)',
              rotation: '+=random(120, 300)',
              duration: () => gsap.utils.random(min, max),
              delay: () => gsap.utils.random(0, 8),
              ease: 'none',
              repeat: -1,
              repeatRefresh: true,
            },
          ),
        )
      })
      const onVisibility = () => {
        for (const t of tweens) {
          if (document.hidden) t.pause()
          else t.resume()
        }
      }
      document.addEventListener('visibilitychange', onVisibility)
      return () => document.removeEventListener('visibilitychange', onVisibility)
    },
    { dependencies: [season, disabled], scope: rootRef },
  )

  if (disabled) return null
  const count = DENSITY[season] ?? 0
  return (
    <div className="ambient-layer" data-season={season} aria-hidden="true" ref={rootRef}>
      {Array.from({ length: count }, (_, i) => particleFor(season, i))}
    </div>
  )
}
