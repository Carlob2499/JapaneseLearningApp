import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import type { ItemState, Level } from '@hikkoshi/schemas'
import { loadLevels, type Content } from '../content/packs'
import { getAllItemStates } from '../store/db'
import { getActiveLevels, ALL_LEVELS } from '../store/settings'
import { computeLifeStage, LIFE_STAGE_CLEAR_THRESHOLD, LIFE_STAGE_NAMES, type LifeStage } from '../day/lifeStage'
import { JOURNEY_NOTES, STAMP_GLYPHS, stampStateFor, type StampState } from '../day/journey'
import { reviewablePoolIds, JLPT_LABEL } from '../lib/appMeta'
import { staggerIn } from '../motion/timelines'
import { APP_NAME_JA } from '../lib/appMeta'
import './journey.css'

const STAGE_LEVELS: readonly Level[] = ['L1', 'L2', 'L3', 'L4', 'L5']

interface KanaProgress {
  covered: number
  total: number
  ratio: number
}

interface JourneyData {
  lifeStage: LifeStage
  kana: KanaProgress
}

/** One circular eki-style stamp (D-025): vermillion when pressed, a progress ring while
 *  current, a dotted waiting circle ahead. `ratio` only matters for the current stamp. */
function Stamp({ state, glyph, ratio, tilt }: { state: StampState; glyph: string; ratio: number; tilt: number }) {
  const C = 2 * Math.PI * 26
  return (
    <svg className={`stamp stamp-${state}`} viewBox="0 0 64 64" style={{ transform: `rotate(${tilt}deg)` }} aria-hidden="true">
      {state === 'stamped' && (
        <>
          <circle cx="32" cy="32" r="30" fill="var(--accent)" opacity="0.92" />
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--paper)" strokeWidth="1.6" opacity="0.85" />
          <text x="32" y="43" textAnchor="middle" fontSize="28" fill="var(--paper)" fontWeight="700">
            {glyph}
          </text>
        </>
      )}
      {state === 'current' && (
        <>
          <circle cx="32" cy="32" r="30" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${C * ratio} ${C}`}
            transform="rotate(-90 32 32)"
          />
          <text x="32" y="41" textAnchor="middle" fontSize="22" fill="var(--accent)" fontWeight="700">
            {glyph}
          </text>
        </>
      )}
      {state === 'ahead' && (
        <>
          <circle cx="32" cy="32" r="30" fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="3 4" />
          <text x="32" y="41" textAnchor="middle" fontSize="22" fill="var(--muted)" opacity="0.5" fontWeight="700">
            {glyph}
          </text>
        </>
      )}
    </svg>
  )
}

/**
 * The stamp book (D-025): your six life stages as a goshuinchō/eki-stamp travel record —
 * pressed vermillion stamps for stages reached, a progress ring on the one you're working
 * toward, dotted circles waiting down the line. Reads the whole road (all levels) when it can;
 * degrades to the active levels offline (higher-level coverage then reads honestly as unknown).
 */
export default function Journey({ onHome }: { onHome: () => void }) {
  const [data, setData] = useState<JourneyData | null>(null)
  const [error, setError] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        let content: Content
        try {
          content = await loadLevels([...ALL_LEVELS]) // the whole road, L0–L5
        } catch {
          content = await loadLevels(getActiveLevels()) // offline: what's already on-device
        }
        const states: ItemState[] = await getAllItemStates()
        if (!alive) return
        const stateIds = new Set(states.map((s) => s.itemId))
        const kanaIds = reviewablePoolIds(content, 'L0')
        const covered = kanaIds.filter((id) => stateIds.has(id)).length
        setData({
          lifeStage: computeLifeStage(content, states, STAGE_LEVELS),
          kana: {
            covered,
            total: kanaIds.length,
            ratio: kanaIds.length === 0 ? 0 : covered / kanaIds.length,
          },
        })
      } catch {
        if (alive) setError(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  useGSAP(
    () => {
      if (data) staggerIn('.journey-row')
    },
    { dependencies: [data], scope: pageRef },
  )

  if (error) {
    return (
      <main className="shell">
        <section className="card summary">
          <h2>Couldn't open your journal</h2>
          <p className="fineprint">Your progress is safe — try again in a moment.</p>
          <button className="ghost-btn" onClick={onHome}>
            Back home
          </button>
        </section>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="shell">
        <p className="loading">Opening your journal…</p>
      </main>
    )
  }

  const { lifeStage, kana } = data
  return (
    <main className="shell journey-page" ref={pageRef}>
      <div className="journey-bar">
        <button className="ghost-btn" onClick={onHome}>
          ← Home
        </button>
        <span className="journey-title-ja" aria-hidden="true">
          {APP_NAME_JA} · 旅の記録
        </span>
      </div>
      <header className="journey-head">
        <h1>Your journey</h1>
        <p className="fineprint">
          A stamp for every stage of the move — like the eki stamps waiting on station concourses.
        </p>
      </header>

      <section className="journey-book card">
        {/* The flight over: kana come before the first stamp. */}
        <div className="journey-row journey-kana">
          <Stamp
            state={kana.ratio >= LIFE_STAGE_CLEAR_THRESHOLD ? 'stamped' : kana.covered > 0 ? 'current' : 'ahead'}
            glyph="仮"
            ratio={kana.ratio}
            tilt={-3}
          />
          <div className="journey-row-body">
            <h2>Kana · かな</h2>
            <p className="journey-note">Learned on the flight over.</p>
            <p className="journey-coverage">
              {kana.covered.toLocaleString()} / {kana.total.toLocaleString()} characters met
            </p>
          </div>
        </div>

        {LIFE_STAGE_NAMES.map((name, i) => {
          const state = stampStateFor(i, lifeStage.stage)
          const cov = i === 0 ? null : lifeStage.coverageByLevel.find((c) => c.level === STAGE_LEVELS[i - 1])
          const ratio = state === 'current' && cov ? cov.ratio : 0
          return (
            <div className={`journey-row journey-stage-${state}`} key={name}>
              <Stamp state={state} glyph={STAMP_GLYPHS[i]} ratio={ratio} tilt={i % 2 === 0 ? 3 : -4} />
              <div className="journey-row-body">
                <h2>{name}</h2>
                <p className="journey-note">{state === 'stamped' ? JOURNEY_NOTES[i] : '…'}</p>
                {cov && cov.total > 0 && (
                  <p className="journey-coverage">
                    {STAGE_LEVELS[i - 1]} · {JLPT_LABEL[STAGE_LEVELS[i - 1]]} — {cov.covered.toLocaleString()} /{' '}
                    {cov.total.toLocaleString()} met
                  </p>
                )}
                {cov && cov.total === 0 && <p className="journey-coverage">not downloaded yet</p>}
              </div>
            </div>
          )
        })}
      </section>
    </main>
  )
}
