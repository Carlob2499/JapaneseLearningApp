/**
 * Shared timing + easing constants (D-019) — this motion system's equivalent of index.css's
 * color tokens, so every gsap call in the app reads from one considered vocabulary rather than
 * per-call magic numbers.
 */
export const DURATION = {
  fast: 0.15,
  base: 0.3,
  slow: 0.5,
  celebration: 0.8,
} as const

export const EASE = {
  enter: 'power3.out',
  exit: 'power2.in',
  standard: 'power2.out',
  inOut: 'power2.inOut',
  celebrate: 'elastic.out(1, 0.4)',
} as const

export const STAGGER = {
  tight: 0.05,
  loose: 0.08,
} as const
