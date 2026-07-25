import { describe, it, expect } from 'vitest'
import type { JournalEntry, SceneTemplate } from '@hikkoshi/schemas'
import { DAY_PLAN_MAX_TASKS, SCENE_KIND_TITLE, buildDayPlan, deriveSceneHistory } from './dayPlan'

const DAY = 86_400_000

function scene(id: string, extra: Partial<SceneTemplate> = {}): SceneTemplate {
  return {
    kind: 'scene',
    id,
    sceneKind: 'konbini',
    level: 'L1',
    modules: ['M2_konbini'],
    beats: [{ id: 'b1', interaction: 'recognize', slotIds: ['s1'] }],
    framing: [{ text: 'x', modelWritten: true }],
    ...extra,
  }
}

function entry(sceneId: string | undefined, ts: number): JournalEntry {
  return { itemId: 'v1', ts, interaction: 'context', outcome: 'pass', sceneId }
}

describe('buildDayPlan', () => {
  it('is an honest empty day when nothing is due, introducible, or a candidate', () => {
    const plan = buildDayPlan({ dueCount: 0, introCount: 0, candidates: [], history: new Map(), todayIndex: 0 })
    expect(plan.tasks).toEqual([])
  })

  it('never pads a review task when neither due nor intro has anything to offer', () => {
    const plan = buildDayPlan({
      dueCount: 0,
      introCount: 0,
      candidates: [scene('s1')],
      history: new Map(),
      todayIndex: 0,
    })
    expect(plan.tasks).toEqual([{ kind: 'errand', sceneId: 's1', sceneKind: 'konbini', title: SCENE_KIND_TITLE.konbini }])
  })

  it("uses a scene's title override when present, else the generic per-kind title (D-030)", () => {
    const plan = buildDayPlan({
      dueCount: 0,
      introCount: 0,
      candidates: [scene('clerk', { title: 'Your shift at the register' })],
      history: new Map(),
      todayIndex: 0,
    })
    expect(plan.tasks).toEqual([
      { kind: 'errand', sceneId: 'clerk', sceneKind: 'konbini', title: 'Your shift at the register' },
    ])
  })

  it('reports the real due/intro counts on the review task verbatim, never fabricated', () => {
    const plan = buildDayPlan({ dueCount: 7, introCount: 3, candidates: [], history: new Map(), todayIndex: 0 })
    expect(plan.tasks).toEqual([{ kind: 'review', dueCount: 7, introCount: 3, isWarmReturn: false }])
  })

  it('threads isWarmReturn onto the review task when a lapsed return called for the gentler cap', () => {
    const plan = buildDayPlan({
      dueCount: 20,
      introCount: 0,
      isWarmReturn: true,
      candidates: [],
      history: new Map(),
      todayIndex: 0,
    })
    expect(plan.tasks).toEqual([{ kind: 'review', dueCount: 20, introCount: 0, isWarmReturn: true }])
  })

  it('still includes a lone candidate shown today — staleness sorts, never filters', () => {
    const history = new Map([['s1', 5]])
    const plan = buildDayPlan({
      dueCount: 0,
      introCount: 0,
      candidates: [scene('s1')],
      history,
      todayIndex: 5, // zero days since last shown — the stalest-possible sort key, still included
    })
    expect(plan.tasks).toEqual([{ kind: 'errand', sceneId: 's1', sceneKind: 'konbini', title: SCENE_KIND_TITLE.konbini }])
  })

  it('sorts candidates stalest-first, with never-shown ahead of any previously-shown scene', () => {
    const history = new Map([
      ['recent', 9],
      ['stale', 3],
      // 'fresh' never appears in history
    ])
    const plan = buildDayPlan({
      dueCount: 0,
      introCount: 0,
      candidates: [scene('recent'), scene('stale'), scene('fresh')],
      history,
      todayIndex: 10,
      cap: 10,
    })
    expect(plan.tasks.map((t) => (t.kind === 'errand' ? t.sceneId : t.kind))).toEqual(['fresh', 'stale', 'recent'])
  })

  it('caps the combined total at the configured limit, prioritizing review over errands', () => {
    const candidates = ['a', 'b', 'c', 'd', 'e'].map((id) => scene(id))
    const plan = buildDayPlan({ dueCount: 5, introCount: 0, candidates, history: new Map(), todayIndex: 0, cap: 3 })
    expect(plan.tasks).toHaveLength(3)
    expect(plan.tasks[0]).toEqual({ kind: 'review', dueCount: 5, introCount: 0, isWarmReturn: false })
    expect(plan.tasks.filter((t) => t.kind === 'errand')).toHaveLength(2)
  })

  it('defaults the cap to DAY_PLAN_MAX_TASKS', () => {
    const candidates = ['a', 'b', 'c', 'd', 'e'].map((id) => scene(id))
    const plan = buildDayPlan({ dueCount: 0, introCount: 0, candidates, history: new Map(), todayIndex: 0 })
    expect(plan.tasks).toHaveLength(DAY_PLAN_MAX_TASKS)
  })
})

describe('deriveSceneHistory', () => {
  it('keeps only the latest day per scene, independent of other scenes, ignoring non-scene entries', () => {
    const journal = [
      entry('s1', 1 * DAY),
      entry('s1', 3 * DAY), // later visit to s1 — should win
      entry('s2', 2 * DAY),
      entry(undefined, 4 * DAY), // ordinary flashcard review — no sceneId, ignored
    ]
    const history = deriveSceneHistory(journal)
    expect(history.get('s1')).toBe(3)
    expect(history.get('s2')).toBe(2)
    expect(history.size).toBe(2)
  })

  it('resolves correctly even when the journal is not in chronological order', () => {
    const journal = [entry('s1', 5 * DAY), entry('s1', 1 * DAY)]
    expect(deriveSceneHistory(journal).get('s1')).toBe(5)
  })
})
