import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { openDB } from 'idb'
import type { Level } from '@hikkoshi/schemas'
import { loadLevels } from '../content/packs'
import { getAllItemStates, getJournal, putItemState } from '../store/db'
import { reviewablePoolIds } from '../lib/appMeta'
import { useToday } from './useToday'

const LEVELS: Level[] = ['L1'] // module-scoped: a stable reference, matching how App.tsx passes levels down

async function clearDb() {
  const db = await openDB('hikkoshi', 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains('itemStates')) d.createObjectStore('itemStates', { keyPath: 'itemId' })
      if (!d.objectStoreNames.contains('journal')) d.createObjectStore('journal', { autoIncrement: true })
    },
  })
  await db.clear('itemStates')
  await db.clear('journal')
  db.close()
}

beforeEach(async () => {
  await clearDb()
  localStorage.clear() // getLastCelebratedStage/setLastCelebratedStage live in localStorage, not IndexedDB
})
afterEach(cleanup)

describe('useToday', () => {
  it('reflects a fresh store: no due, an introducible pool, Tourist stage, no diary yet', async () => {
    const { result } = renderHook(() => useToday(LEVELS))
    await waitFor(() => expect(result.current.mode).toBe('ready'), { timeout: 10_000 })

    expect(result.current.error).toBeNull()
    expect(result.current.dueCount).toBe(0)
    expect(result.current.introCount).toBeGreaterThan(0)
    expect(result.current.lifeStage?.name).toBe('Tourist')
    expect(result.current.lifeStage?.stage).toBe(0)
    expect(result.current.celebrateStage).toBeNull() // the very first load never celebrates
    expect(result.current.diaryEntries).toEqual([])
    expect(result.current.dayPlan?.tasks.length).toBeGreaterThan(0)
  })

  it('transitions life stage once seeded coverage clears the level threshold', async () => {
    const content = await loadLevels(LEVELS)
    const ids = reviewablePoolIds(content, 'L1')
    expect(ids.length).toBeGreaterThan(0) // sanity: L1 actually has a reviewable pool to seed

    const now = Date.now()
    for (const id of ids) {
      await putItemState({ itemId: id, stage: 1, due: now + 999_999_999, introducedAt: now, lapses: 0, lastOutcomes: 0 })
    }

    const { result } = renderHook(() => useToday(LEVELS))
    await waitFor(() => expect(result.current.mode).toBe('ready'), { timeout: 10_000 })

    expect(result.current.lifeStage?.name).toBe('Resident')
    expect(result.current.lifeStage?.stage).toBe(1)
  })

  it('celebrates a genuine stage increase across two loads, but never the very first load', async () => {
    // Load 1: fresh profile, stage 0 — establishes the baseline, no celebration (matches the
    // fresh-store test above; re-asserted here since it's the premise this test builds on).
    const first = renderHook(() => useToday(LEVELS))
    await waitFor(() => expect(first.result.current.mode).toBe('ready'), { timeout: 10_000 })
    expect(first.result.current.lifeStage?.stage).toBe(0)
    expect(first.result.current.celebrateStage).toBeNull()
    first.unmount()

    // Seed coverage past L1's clear threshold — as if a review session happened in between.
    const content = await loadLevels(LEVELS)
    const ids = reviewablePoolIds(content, 'L1')
    const now = Date.now()
    for (const id of ids) {
      await putItemState({ itemId: id, stage: 1, due: now + 999_999_999, introducedAt: now, lapses: 0, lastOutcomes: 0 })
    }

    // Load 2: a later, genuine stage increase — this one celebrates.
    const second = renderHook(() => useToday(LEVELS))
    await waitFor(() => expect(second.result.current.mode).toBe('ready'), { timeout: 10_000 })
    expect(second.result.current.lifeStage?.stage).toBe(1)
    expect(second.result.current.celebrateStage).toBe(1)

    // Load 3: same stage again (e.g. the user revisits Home) — must not re-celebrate.
    second.unmount()
    const third = renderHook(() => useToday(LEVELS))
    await waitFor(() => expect(third.result.current.mode).toBe('ready'), { timeout: 10_000 })
    expect(third.result.current.lifeStage?.stage).toBe(1)
    expect(third.result.current.celebrateStage).toBeNull()
  })

  it('revealGloss logs exactly one journal entry per item, even when called twice', async () => {
    const { result } = renderHook(() => useToday(LEVELS))
    await waitFor(() => expect(result.current.mode).toBe('ready'), { timeout: 10_000 })

    const itemId = 'test-reveal-item'
    expect(result.current.isRevealed(itemId)).toBe(false)

    act(() => result.current.revealGloss(itemId))
    await waitFor(() => expect(result.current.isRevealed(itemId)).toBe(true))

    act(() => result.current.revealGloss(itemId)) // repeat tap — must not log a second entry

    const journal = await getJournal()
    const matching = journal.filter((e) => e.itemId === itemId)
    expect(matching).toHaveLength(1)
    expect(matching[0]).toMatchObject({ interaction: 'context', outcome: 'pass' })
  })

  it('never writes to itemStates or the journal merely from loading (read-only mirror)', async () => {
    const beforeStates = await getAllItemStates()
    const beforeJournal = await getJournal()

    const { result } = renderHook(() => useToday(LEVELS))
    await waitFor(() => expect(result.current.mode).toBe('ready'), { timeout: 10_000 })

    const afterStates = await getAllItemStates()
    const afterJournal = await getJournal()
    expect(afterStates).toHaveLength(beforeStates.length)
    expect(afterJournal).toHaveLength(beforeJournal.length)
  })
})
