import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { isReducedMotion } from './reducedMotion'
import { SIGNATURE_EASE } from './eases'

// SplitText registers here, in its first consumer (D-033's register-at-first-consumer
// convention). Companion to timelines.ts's jsdom law: the reduced-motion branch never
// CONSTRUCTS a SplitText — jsdom (reduced=ON always) must never reach the split.
gsap.registerPlugin(SplitText)

export interface RevealCharsOptions {
  duration?: number
  stagger?: number
  delay?: number
}

/**
 * Masked per-character rise for a short heading (D-033) — the film-title reveal. `type: 'chars'`
 * segments CJK safely (no word ambiguity for 引っ越し / コンビニ / 駅), `mask: 'chars'` clips each
 * char so it rises from behind its own line, and SplitText 3.15 handles aria itself. The split
 * reverts on complete, restoring React's original text node so later re-renders can never
 * orphan split spans. Under reduced motion the text simply is — an instant no-op.
 */
export function revealChars(el: Element, opts: RevealCharsOptions = {}): gsap.core.Tween {
  if (isReducedMotion()) return gsap.to(el, { opacity: 1, duration: 0 })
  const split = SplitText.create(el, { type: 'chars', mask: 'chars' })
  return gsap.fromTo(
    split.chars,
    { yPercent: 110 },
    {
      yPercent: 0,
      duration: opts.duration ?? 0.5,
      ease: SIGNATURE_EASE.shoji,
      stagger: opts.stagger ?? 0.06,
      delay: opts.delay ?? 0,
      onComplete: () => split.revert(),
    },
  )
}
