import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@hikkoshi/schemas'
import { loadLevels, type Content } from '../content/packs'
import { buildChoices, buildPools, type Choice, type Pools } from '../review/choices'
import type { Reviewable } from '../review/useReview'
import { putItemStates } from '../store/db'
import { ALL_LEVELS } from '../store/settings'
import { probeCandidates, type ProbeItem } from '../placement/difficulty'
import { answerProbe, initProbe, PROBE_LENGTH, probeDone, probeEstimate, type ProbeState } from '../placement/probe'
import { placementSeeds } from '../placement/seed'
import { EnterOnMount } from '../motion/EnterOnMount'
import { ChoiceCard } from './cards'
import { APP_NAME_JA } from '../lib/appMeta'
import './study.css'

interface Question {
  item: ProbeItem
  choices: Choice[]
}

/** The next recognition question for the current band — the first not-yet-used candidate, with
 *  dataset-sourced choices. `null` if the band is somehow exhausted (real content never is). */
function pickQuestion(content: Content, pools: Pools, band: Level, used: string[]): Question | null {
  const cand = probeCandidates(content, band).find((c) => !used.includes(c.id))
  if (!cand) return null
  const reviewable: Reviewable =
    cand.kind === 'kanji' ? { id: cand.id, kind: 'kanji', item: cand.item } : { id: cand.id, kind: 'vocab', item: cand.item }
  return { item: cand, choices: buildChoices(reviewable, 'recognition', pools) }
}

type Phase = 'loading' | 'error' | 'asking' | 'placing'

/**
 * The placement probe (E5 / D-021): a short adaptive recognition staircase — the diegetic
 * "moving-in interview." On finish it seeds provisional item states and reports the placed level
 * up to the caller, which activates L1…level and routes Home. Skippable at any point ("start at
 * the beginning" → `onDone('L0')`, which seeds nothing).
 */
export default function PlacementProbe({ onDone }: { onDone: (placed: Level) => void }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [content, setContent] = useState<Content | null>(null)
  const [probe, setProbe] = useState<ProbeState>(() => initProbe())
  const [question, setQuestion] = useState<Question | null>(null)

  const pools = useMemo(() => (content ? buildPools(content) : null), [content])

  useEffect(() => {
    let alive = true
    void loadLevels([...ALL_LEVELS]).then(
      (c) => {
        if (!alive) return
        setContent(c)
        const fresh = initProbe()
        setProbe(fresh)
        setQuestion(pickQuestion(c, buildPools(c), fresh.band, fresh.usedIds))
        setPhase('asking')
      },
      () => {
        if (alive) setPhase('error')
      },
    )
    return () => {
      alive = false
    }
  }, [])

  async function finish(state: ProbeState, c: Content) {
    setPhase('placing')
    const placed = probeEstimate(state)
    await putItemStates(placementSeeds(c, placed, Date.now()))
    onDone(placed)
  }

  function answer(outcome: 'pass' | 'fail' | 'partial') {
    if (!content || !pools || !question) return
    const next = answerProbe(probe, question.item.id, outcome === 'pass')
    if (probeDone(next)) {
      void finish(next, content)
      return
    }
    setProbe(next)
    const q = pickQuestion(content, pools, next.band, next.usedIds)
    if (!q) {
      void finish(next, content) // band exhausted (shouldn't happen with real content) — place on what we have
      return
    }
    setQuestion(q)
  }

  if (phase === 'loading' || phase === 'placing') {
    return (
      <main className="shell">
        <p className="loading">{phase === 'placing' ? 'Settling you in…' : 'Loading the placement…'}</p>
      </main>
    )
  }

  if (phase === 'error' || !question) {
    return (
      <main className="shell">
        <section className="card">
          <h2>Couldn't load the placement</h2>
          <p className="fineprint">
            Placing across every level needs to be online once. You can start at the beginning for
            now and adjust your levels any time.
          </p>
          <button className="start-btn" onClick={() => onDone('L0')}>
            Start at the beginning
          </button>
        </section>
      </main>
    )
  }

  const q = question.item
  const face = q.kind === 'kanji' ? q.item.literal : q.item.expression
  return (
    <main className="shell">
      <header className="masthead">
        <span className="mark" aria-hidden="true">
          {APP_NAME_JA}
        </span>
        <p className="tagline">Settling in — a few quick questions to find your level.</p>
      </header>

      <p className="placement-progress">
        {probe.asked + 1} of {PROBE_LENGTH}
      </p>

      <EnterOnMount key={probe.asked} className="placement-stage">
        <ChoiceCard
          kind={q.kind === 'kanji' ? 'Kanji' : 'Vocabulary'}
          prompt={<span className={q.kind === 'kanji' ? 'jp-xl' : 'jp-lg'}>{face}</span>}
          question="What does it mean?"
          choices={question.choices}
          onGrade={answer}
        />
      </EnterOnMount>

      <button className="ghost-btn placement-skip" onClick={() => onDone('L0')}>
        Skip — I'm just starting
      </button>
    </main>
  )
}
