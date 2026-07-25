import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { revealChars } from '../motion/typeReveal'
import { MaruMark } from './cards'
import { markKanjiSheetCeremonyShown } from './kanjiSheetGate'
import './cinematic.css'

/**
 * The kanji-sheet-complete ceremony (D-037): a small, one-time-per-lesson set-piece — a hanko
 * press on 完成 ("complete") — when the week's last trace lands. Same laws as ArrivalTitle
 * (D-033): tap anywhere to skip, ≤2.4s, never mounts under reduced motion (the caller gates
 * that via `shouldPlayKanjiSheetCeremony` before rendering this at all).
 */
export default function KanjiSheetCeremony({ lessonNumber, onDone }: { lessonNumber: number; onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const doneRef = useRef(false)

  useEffect(() => {
    markKanjiSheetCeremonyShown(lessonNumber)
  }, [lessonNumber])

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  const { contextSafe } = useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const tl = gsap.timeline({ onComplete: finish })
      tlRef.current = tl
      tl.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
      tl.add(revealChars(root.querySelector('.kanji-ceremony-ja')!, { duration: 0.4, stagger: 0.1 }), 0.2)
      tl.fromTo(
        root.querySelector('.kanji-ceremony-en'),
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
        0.5,
      )
      tl.to(root, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 2.0)
    },
    { scope: rootRef },
  )

  const skip = contextSafe(() => {
    if (doneRef.current) return
    tlRef.current?.kill()
    if (rootRef.current) {
      gsap.to(rootRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: finish })
    } else {
      finish()
    }
  })

  return (
    <div className="kanji-ceremony" ref={rootRef} onPointerDown={skip} aria-hidden="true">
      <div className="kanji-ceremony-stack">
        <MaruMark className="kanji-ceremony-mark" />
        <span className="kanji-ceremony-ja">完成</span>
        <p className="kanji-ceremony-en">This week's six, written.</p>
      </div>
    </div>
  )
}
