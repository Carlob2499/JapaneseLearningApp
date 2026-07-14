import gsap from 'gsap'
import { DURATION, EASE, STAGGER } from './tokens'
import { isReducedMotion } from './reducedMotion'

/** Fade+rise entrance for a single element (a card mount, an incoming view). */
export function enterTimeline(target: gsap.TweenTarget): gsap.core.Tween {
  const reduced = isReducedMotion()
  return gsap.fromTo(
    target,
    { opacity: 0, y: reduced ? 0 : 12 },
    { opacity: 1, y: 0, duration: reduced ? DURATION.fast : DURATION.base, ease: EASE.enter },
  )
}

/** Fade+rise exit for a view being replaced (the outgoing half of a navigation). */
export function exitTimeline(target: gsap.TweenTarget): gsap.core.Tween {
  const reduced = isReducedMotion()
  return gsap.to(target, {
    opacity: 0,
    y: reduced ? 0 : -12,
    duration: reduced ? DURATION.fast : DURATION.base,
    ease: EASE.exit,
  })
}

/** Staggered list entrance (Today's task list, a fresh set of MC choices). */
export function staggerIn(
  targets: gsap.TweenTarget,
  from: 'start' | 'center' | 'random' = 'start',
): gsap.core.Tween {
  const reduced = isReducedMotion()
  return gsap.fromTo(
    targets,
    { opacity: 0, y: reduced ? 0 : 16 },
    {
      opacity: 1,
      y: 0,
      duration: reduced ? DURATION.fast : DURATION.base,
      ease: EASE.standard,
      stagger: reduced ? 0 : { each: STAGGER.tight, from },
    },
  )
}

/** A satisfying "correct" pulse — purely decorative feedback, never gates grading. */
export function pulsePass(target: gsap.TweenTarget): gsap.core.Tween {
  if (isReducedMotion()) return gsap.to(target, { scale: 1, duration: 0 })
  return gsap.to(target, { scale: 1.08, duration: DURATION.fast, yoyo: true, repeat: 1, ease: EASE.inOut })
}

/** An unmistakable "wrong" shake — purely decorative feedback, never gates grading. */
export function shakeFail(target: gsap.TweenTarget): gsap.core.Tween {
  if (isReducedMotion()) return gsap.to(target, { x: 0, duration: 0 })
  return gsap.to(target, {
    keyframes: [{ x: -10 }, { x: 10 }, { x: -6 }, { x: 6 }, { x: 0 }],
    duration: DURATION.slow,
    ease: EASE.inOut,
  })
}

/** A celebratory pop for the life-stage-up moment — bouncy elastic settle. */
export function celebrate(target: gsap.TweenTarget): gsap.core.Tween {
  const reduced = isReducedMotion()
  return gsap.fromTo(
    target,
    { scale: reduced ? 1 : 0, rotate: reduced ? 0 : -6 },
    {
      scale: 1,
      rotate: 0,
      duration: reduced ? DURATION.fast : DURATION.celebration,
      ease: reduced ? EASE.standard : EASE.celebrate,
    },
  )
}
