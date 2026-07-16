import { describe, it, expect } from 'vitest'
import { ItemState, JournalEntry, ProgressExport, RetrievalMode } from './index'

const state = {
  itemId: 'vocab:1358280:たべる',
  stage: 0,
  due: 1_700_000_000_000,
  introducedAt: 1_700_000_000_000,
  lapses: 0,
  lastOutcomes: 0,
}

describe('progress schemas', () => {
  it('accepts a valid ItemState and rejects an out-of-range stage', () => {
    expect(ItemState.safeParse(state).success).toBe(true)
    expect(ItemState.safeParse({ ...state, stage: 8 }).success).toBe(false)
    expect(ItemState.safeParse({ ...state, stage: -1 }).success).toBe(false)
  })

  it('defines the retrieval modes and rejects an unknown one', () => {
    for (const mode of ['recognition', 'production', 'typed', 'listening', 'recall']) {
      expect(RetrievalMode.safeParse(mode).success).toBe(true)
    }
    expect(RetrievalMode.safeParse('speed').success).toBe(false)
  })

  it('constrains JournalEntry.outcome to the review outcomes', () => {
    const entry = { itemId: state.itemId, ts: state.due, interaction: 'recognition', outcome: 'pass' }
    expect(JournalEntry.safeParse(entry).success).toBe(true)
    expect(JournalEntry.safeParse({ ...entry, outcome: 'maybe' }).success).toBe(false)
  })

  it('round-trips a ProgressExport', () => {
    const snapshot = {
      schemaVersion: '1.0.0',
      exportedAt: '2026-07-12T00:00:00.000Z',
      itemStates: [state],
      journalTail: [{ itemId: state.itemId, ts: state.due, interaction: 'recognition', outcome: 'pass' }],
    }
    expect(ProgressExport.safeParse(snapshot).success).toBe(true)
  })
})
