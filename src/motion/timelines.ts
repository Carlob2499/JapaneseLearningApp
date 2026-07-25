import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { DURATION, EASE, STAGGER } from './tokens'
import { isReducedMotion } from './reducedMotion'
import { SIGNATURE_EASE } from './eases'

// DrawSVG registers here, in its first consumer (D-033's register-at-first-consumer convention).
// THE JSDOM LAW: reduced-motion branches must never carry a `drawSVG` property — the plugin's
// init calls getTotalLength(), which jsdom lacks, and reduced=ON is the only branch unit tests
// execute (D-019's test-env stub).
gsap.registerPlugin(DrawSVGPlugin)

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

/**
 * Ken Burns ambient drift for a photo layer (D-026): a very slow scale/pan breath that loops
 * forever, making a real photograph feel alive without demanding attention. Under reduced
 * motion the photo simply holds still (a zero-duration no-op tween, matching pulsePass's
 * pattern). Callers own cleanup via useGSAP's context.
 */
export function ambientDrift(target: gsap.TweenTarget): gsap.core.Tween {
  if (isReducedMotion()) return gsap.to(target, { scale: 1, duration: 0 })
  return gsap.fromTo(
    target,
    { scale: 1.02, xPercent: -0.8, yPercent: 0.4 },
    { scale: 1.07, xPercent: 0.8, yPercent: -0.4, duration: 26, ease: 'sine.inOut', yoyo: true, repeat: -1 },
  )
}

/** A hanging-object sway (noren, station sign) — slow, small, forever; still under reduced motion. */
export function gentleSway(target: gsap.TweenTarget): gsap.core.Tween {
  if (isReducedMotion()) return gsap.to(target, { rotation: 0, duration: 0 })
  return gsap.fromTo(
    target,
    { rotation: -1.3, transformOrigin: 'top center' },
    { rotation: 1.3, transformOrigin: 'top center', duration: 4.6, ease: 'sine.inOut', yoyo: true, repeat: -1 },
  )
}

/**
 * The eki-stamp press (D-026): earned stamps slam onto the Journey page one after another —
 * fast approach, hard stop, the way a stamp-rally book fills in. Under reduced motion the
 * stamps are simply there (zero duration, no stagger, no press).
 */
export function stampPress(targets: gsap.TweenTarget): gsap.core.Tween {
  if (isReducedMotion()) return gsap.to(targets, { scale: 1, opacity: 1, duration: 0 })
  return gsap.fromTo(
    targets,
    { scale: 1.6, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.32, ease: 'power3.in', delay: 0.15, stagger: { each: 0.14 } },
  )
}

/**
 * The grader's maru (D-026, brush-drawn since D-033): the vermillion ○ pressed beside a correct
 * answer now draws itself like a pen stroke (DrawSVG to '0% 92%' — the 92% endpoint reproduces
 * the hand-pressed gap the static `strokeDasharray="66 8"` renders), then settles on the
 * hankoPress ease. Under reduced motion the mark simply appears — the static dasharray is what
 * renders there, and per the jsdom law this branch never carries a drawSVG property.
 */
export function hankoPop(mark: Element): gsap.core.Timeline {
  const tl = gsap.timeline()
  if (isReducedMotion()) return tl.set(mark, { opacity: 1, scale: 1 })
  const stroke = mark.querySelector('circle, path') ?? mark
  tl.set(mark, { opacity: 1, scale: 0.94, rotation: -3, transformOrigin: 'center' })
    .fromTo(stroke, { drawSVG: '0%' }, { drawSVG: '0% 92%', duration: 0.34, ease: 'power2.out' })
    .to(mark, { scale: 1, rotation: 0, duration: 0.22, ease: SIGNATURE_EASE.hanko }, '-=0.10')
  return tl
}

/**
 * KanjiVG stroke chart (D-033): strokes ink themselves in, in order — DrawSVG replacing the old
 * CSS keyframe draw with the same cadence (0.5s per stroke, one starting every 0.55s). Under
 * reduced motion (and therefore in jsdom) the paths render fully drawn: a zero-duration no-op
 * that never touches drawSVG.
 */
export function strokeDrawIn(paths: gsap.TweenTarget): gsap.core.Tween {
  if (isReducedMotion()) return gsap.to(paths, { duration: 0 })
  return gsap.fromTo(
    paths,
    { drawSVG: '0%' },
    { drawSVG: '100%', duration: 0.5, ease: 'power1.inOut', stagger: 0.55 },
  )
}

/**
 * One traced stroke inking in (D-037, TraceCanvas): a single guide path draws itself once the
 * learner's own trace validates, same DrawSVG cadence as `strokeDrawIn` but for one path at a
 * time (the learner controls when each stroke fires, not a fixed replay sequence). Reduced
 * motion still must advance state — the stroke simply appears fully drawn, zero duration, no
 * drawSVG property (the jsdom law).
 */
export function traceInk(path: gsap.TweenTarget): gsap.core.Tween {
  if (isReducedMotion()) return gsap.to(path, { duration: 0 })
  return gsap.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4, ease: 'power1.inOut' })
}

/**
 * Wrong-stroke feedback (D-037): the guide shakes (shakeFail's own cadence) then pulses to
 * redraw the eye to what to trace next — "gentle shake + guide pulse" as one gesture. Reduced
 * motion: a genuinely empty timeline (duration 0, nothing added) — the guide simply holds still.
 */
export function traceWrong(guide: gsap.TweenTarget): gsap.core.Timeline {
  const tl = gsap.timeline()
  if (isReducedMotion()) return tl
  tl.to(guide, { keyframes: [{ x: -8 }, { x: 8 }, { x: -5 }, { x: 5 }, { x: 0 }], duration: DURATION.slow, ease: EASE.inOut }).fromTo(
    guide,
    { opacity: 0.55 },
    { opacity: 1, duration: 0.45, ease: 'sine.inOut' },
    '-=0.1',
  )
  return tl
}

/**
 * Readiness dial draw-in (D-038): the brush arc animates from empty to the current value on
 * mount/value-change. Reduced motion: a zero-duration no-op that never touches drawSVG (the
 * jsdom law) — the circle's own static strokeDasharray/strokeDashoffset attributes (set in the
 * component, not here) already render the correct final arc without any animation.
 */
export function readinessDrawIn(circle: gsap.TweenTarget, value: number): gsap.core.Tween {
  if (isReducedMotion()) return gsap.to(circle, { duration: 0 })
  const pct = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`
  return gsap.fromTo(circle, { drawSVG: '0%' }, { drawSVG: pct, duration: 0.6, ease: 'power2.out' })
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
