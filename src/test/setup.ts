// jsdom ships no IndexedDB implementation; every store/db.ts-touching test needs this shim.
import 'fake-indexeddb/auto'

// jsdom ships no matchMedia or requestAnimationFrame; every gsap-touching test needs these shims
// (confirmed missing by direct inspection of this repo's installed jsdom).
//
// matches defaults to true — i.e. reduced motion ON — a deliberate test policy (D-019), not an
// oversight: gsap tweens are async regardless of duration, so collapsing them near-instant is
// safest for a suite that mounts/unmounts fast, and it incidentally exercises the reduced-motion
// branch every test run, which would otherwise get zero automatic coverage.
if (typeof window.matchMedia === 'undefined') {
  window.matchMedia = ((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16) as unknown as number
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id)
}
