import gsap from 'gsap'

/**
 * Single source of truth for prefers-reduced-motion (D-019), shared by every timeline factory in
 * src/motion/ — gsap.matchMedia() is reactive (live-updates if the OS setting changes mid-session)
 * and self-cleaning, so it's preferred over scattering manual matchMedia checks. In tests, jsdom's
 * matchMedia stub (src/test/setup.ts) always reports reduced motion on.
 *
 * The flag is SEEDED synchronously from the native API (D-033): gsap.matchMedia's callback fires a
 * tick after registration, which is fine for animation factories (they run from effects/handlers)
 * but too late for render-time readers — the arrival gate and the ambient layer decide whether to
 * mount during React's very first render, and a stale `false` there would flash a set-piece at a
 * reduced-motion user (caught live by e2e/cinematic.spec.ts).
 */
const QUERY = '(prefers-reduced-motion: reduce)'

let reduced =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY).matches
    : false

gsap.matchMedia().add({ reduced: QUERY }, (ctx) => {
  reduced = ctx.conditions?.reduced ?? false
})

export function isReducedMotion(): boolean {
  return reduced
}
