import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { revealChars } from '../motion/typeReveal'
import { MaruMark } from './cards'
import { markLessonCeremonyShown } from './lessonCeremonyGate'
import './cinematic.css'

/**
 * The lesson hanko ceremony (D-038): every one of a lesson's grammar points reaching "solid"
 * (D-036, 3 distinct-day productions) earns a full-screen set-piece — letterbox bars close in, a
 * brush stamp presses, the lesson's name settles beneath. Same laws as ArrivalTitle (D-033) and
 * the kanji-sheet ceremony (D-037): tap anywhere to skip, ≤2.4s, never mounts under reduced
 * motion (the caller gates that via `shouldPlayLessonCeremony` before rendering this at all).
 */
export default function LessonCeremony({
  lessonNumber,
  titleEn,
  onDone,
}: {
  lessonNumber: number
  titleEn: string
  onDone: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const doneRef = useRef(false)

  useEffect(() => {
    markLessonCeremonyShown(lessonNumber)
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
      tl.fromTo(root.querySelector('.lesson-ceremony-veil'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
        .fromTo(
          root.querySelectorAll('.letterbox-top, .letterbox-bottom'),
          { scaleY: 0 },
          { scaleY: 1, duration: 0.3, ease: 'power3.out' },
          0,
        )
        .add(revealChars(root.querySelector('.lesson-ceremony-ja')!, { duration: 0.4, stagger: 0.08 }), 0.3)
        .fromTo(
          root.querySelector('.lesson-ceremony-en'),
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
          0.75,
        )
        .to(root, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 2.0)
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
    <div className="lesson-ceremony" ref={rootRef} onPointerDown={skip} aria-hidden="true">
      <div className="lesson-ceremony-veil" />
      <div className="letterbox-top" />
      <div className="letterbox-bottom" />
      <div className="lesson-ceremony-stack">
        <MaruMark className="lesson-ceremony-mark" />
        <span className="lesson-ceremony-ja">
          第{lessonNumber}課 修了
        </span>
        <p className="lesson-ceremony-en">{titleEn} — every point solid.</p>
      </div>
    </div>
  )
}
