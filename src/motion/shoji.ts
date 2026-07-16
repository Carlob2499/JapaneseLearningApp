import gsap from 'gsap'
import { SIGNATURE_EASE } from './eases'

/**
 * The shoji screen wipe (D-033) — THE navigation transition. Two paper panels sweep shut over
 * the whole viewport, the view swaps beneath cover, and the doors part on the signature 'shoji'
 * ease. A module singleton (like flipHandoff's stash): one overlay, lazily created on first use —
 * the reduced-motion path never calls into this module, so jsdom tests and reduced-mode sessions
 * never see the overlay at all. The overlay is pointer-events:none (styles in App.css), so input
 * always reaches the app; useViewTransition's pending flag is what drops mid-wipe taps.
 */

let overlay: HTMLDivElement | null = null
let leftPanel: HTMLDivElement | null = null
let rightPanel: HTMLDivElement | null = null
let covered = false

function ensureOverlay(): void {
  if (overlay) return
  overlay = document.createElement('div')
  overlay.className = 'shoji-overlay'
  overlay.setAttribute('aria-hidden', 'true')
  leftPanel = document.createElement('div')
  leftPanel.className = 'shoji-panel shoji-left'
  rightPanel = document.createElement('div')
  rightPanel.className = 'shoji-panel shoji-right'
  overlay.append(leftPanel, rightPanel)
  document.body.appendChild(overlay)
}

/** True between close-complete and open-start — the window in which the view swap happens. */
export function isShojiCovered(): boolean {
  return covered
}

/** Panels sweep shut. `onCovered` fires once the viewport is fully covered. */
export function shojiClose(onCovered?: () => void): gsap.core.Timeline {
  ensureOverlay()
  const tl = gsap.timeline({
    onComplete: () => {
      covered = true
      onCovered?.()
    },
  })
  tl.set(overlay, { display: 'block' })
    .fromTo(leftPanel, { xPercent: -101 }, { xPercent: 0, duration: 0.18, ease: 'power2.in' }, 0)
    .fromTo(rightPanel, { xPercent: 101 }, { xPercent: 0, duration: 0.18, ease: 'power2.in' }, 0)
  return tl
}

/** The doors part, revealing whatever now sits beneath. `onDone` fires after the overlay hides. */
export function shojiOpen(onDone?: () => void): gsap.core.Timeline {
  ensureOverlay()
  covered = false
  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(overlay, { display: 'none' })
      onDone?.()
    },
  })
  tl.to(leftPanel, { xPercent: -101, duration: 0.26, ease: SIGNATURE_EASE.shoji }, 0).to(
    rightPanel,
    { xPercent: 101, duration: 0.26, ease: SIGNATURE_EASE.shoji },
    0,
  )
  return tl
}
