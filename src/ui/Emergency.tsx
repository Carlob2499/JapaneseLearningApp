import { useEffect, useState } from 'react'
import type { PhraseTemplate } from '@hikkoshi/schemas'
import { loadLevels } from '../content/packs'
import { SpeakButton } from './cards'
import './study.css'

/**
 * The "In an emergency" reference card (M9 / D-031). Safety-critical survival Japanese, kept one
 * tap from Home and always available offline (its phrases ride the bundled/precached L1 phrase
 * pack). This is a *reference*, not a drill and not medical advice: the point is that it's
 * reachable and readable when it matters, not spaced into review. Every Japanese line is
 * dataset-cited (D-002); the English gloss and romaji are supporting annotations.
 *
 * The two emergency numbers are universal facts (not language to learn), shown prominently with
 * their own citation.
 */

const EMERGENCY_NUMBERS = [
  { dial: '119', ja: '消防・救急', en: 'Fire & ambulance', note: 'fire, or a medical emergency / ambulance' },
  { dial: '110', ja: '警察', en: 'Police', note: 'crime, accident, or danger' },
]

/** Authoritative source for the two numbers — confirmed against official tourism guidance. */
const NUMBERS_SOURCE = {
  name: 'Japan National Tourism Organization (JNTO) — Japan Safe Travel / Emergency',
  url: 'https://www.jnto.go.jp/emergency/eng/mi_guide.html',
}

export default function Emergency({ onHome }: { onHome: () => void }) {
  const [phrases, setPhrases] = useState<PhraseTemplate[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const content = await loadLevels(['L1']) // bundled + precached → available offline
        if (!alive) return
        setPhrases(content.phrases.filter((p) => p.module === 'M9_medical'))
      } catch {
        if (alive) setError(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <main className="shell emergency-page">
      <div className="journey-bar">
        <button className="ghost-btn" onClick={onHome}>
          ← Home
        </button>
        <span className="journey-title-ja" aria-hidden="true">
          緊急のとき
        </span>
      </div>

      <header className="emergency-head">
        <h1>In an emergency</h1>
        <p className="fineprint">
          A quick reference for the words that matter when there's no time to look them up. It's here
          so you can find it fast — not medical or legal advice. If you're in danger, call first.
        </p>
      </header>

      <section className="card emergency-numbers">
        {EMERGENCY_NUMBERS.map((n) => (
          <div className="emergency-number" key={n.dial}>
            <span className="dial">{n.dial}</span>
            <div className="dial-body">
              <strong>
                {n.ja} · {n.en}
              </strong>
              <span className="fineprint">{n.note}</span>
            </div>
          </div>
        ))}
        <p className="fineprint emergency-numbers-note">
          119 connects both fire and ambulance. When they answer, they ask whether it's a fire or a
          medical emergency — reply with one of the lines below, then say where you are (your address,
          or a nearby landmark if you're not sure). Calls to 110 and 119 are free and offer interpreter
          support. <a href={NUMBERS_SOURCE.url}>Source</a>.
        </p>
      </section>

      {error && (
        <section className="card">
          <p className="fineprint">Couldn't load the phrases — check your connection and try again.</p>
        </section>
      )}

      {phrases && phrases.length > 0 && (
        <section className="card emergency-phrases">
          <h2>Say this</h2>
          {phrases.map((p) => (
            <div className="emergency-phrase" key={p.id}>
              <div className="emergency-ja">
                <span lang="ja" className="jp-lg">
                  {p.pattern}
                </span>
                <SpeakButton text={p.pattern} />
              </div>
              {p.romaji && <span className="emergency-romaji">{p.romaji}</span>}
              {p.gloss && <span className="emergency-gloss">{p.gloss}</span>}
            </div>
          ))}
          <p className="fineprint">
            Japanese verified against documented emergency-services guidance; romaji follows the Hepburn
            convention.
          </p>
        </section>
      )}
    </main>
  )
}
