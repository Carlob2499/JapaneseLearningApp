import gsap from 'gsap'

/**
 * Single source of truth for prefers-reduced-motion (D-019), shared by every timeline factory in
 * src/motion/ — gsap.matchMedia() is reactive (live-updates if the OS setting changes mid-session)
 * and self-cleaning, so it's preferred over scattering manual matchMedia checks. In tests, jsdom's
 * matchMedia stub (src/test/setup.ts) always reports reduced motion on.
 */
let reduced = false

gsap.matchMedia().add({ reduced: '(prefers-reduced-motion: reduce)' }, (ctx) => {
  reduced = ctx.conditions?.reduced ?? false
})

export function isReducedMotion(): boolean {
  return reduced
}
