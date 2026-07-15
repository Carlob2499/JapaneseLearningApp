import { describe, it, expect } from 'vitest'
import type { ItemState, JournalEntry } from '@hikkoshi/schemas'
import {
  buildProgressExport,
  exportFilename,
  JOURNAL_TAIL_MAX,
  parseProgressExport,
  PROGRESS_SCHEMA_VERSION,
} from './transfer'

function state(id: string): ItemState {
  return { itemId: id, stage: 2, due: 1_000, introducedAt: 0, lapses: 0, lastOutcomes: 0 }
}
function entry(id: string, ts: number): JournalEntry {
  return { itemId: id, ts, interaction: 'recognition', outcome: 'pass' }
}
const AT = '2026-07-15T09:30:00.000Z'

describe('buildProgressExport', () => {
  it('wraps states + journal in the versioned snapshot shape', () => {
    const snap = buildProgressExport([state('a'), state('b')], [entry('a', 1)], AT)
    expect(snap.schemaVersion).toBe(PROGRESS_SCHEMA_VERSION)
    expect(snap.exportedAt).toBe(AT)
    expect(snap.itemStates).toHaveLength(2)
    expect(snap.journalTail).toHaveLength(1)
  })

  it('bounds the journal to the most recent JOURNAL_TAIL_MAX entries', () => {
    const journal = Array.from({ length: JOURNAL_TAIL_MAX + 50 }, (_, i) => entry('a', i))
    const snap = buildProgressExport([], journal, AT)
    expect(snap.journalTail).toHaveLength(JOURNAL_TAIL_MAX)
    expect(snap.journalTail[0].ts).toBe(50) // oldest 50 dropped — the tail is kept
    expect(snap.journalTail.at(-1)?.ts).toBe(JOURNAL_TAIL_MAX + 49)
  })

  it('does not alias the input state array', () => {
    const states = [state('a')]
    const snap = buildProgressExport(states, [], AT)
    expect(snap.itemStates).not.toBe(states)
  })
})

describe('parseProgressExport', () => {
  it('round-trips a real snapshot through JSON', () => {
    const snap = buildProgressExport([state('a')], [entry('a', 5)], AT)
    const restored = parseProgressExport(JSON.parse(JSON.stringify(snap)))
    expect(restored).toEqual(snap)
  })

  it('rejects a non-object, a missing field, and a malformed item state', () => {
    expect(() => parseProgressExport(null)).toThrow()
    expect(() => parseProgressExport({ schemaVersion: '1.0.0', itemStates: [], journalTail: [] })).toThrow() // no exportedAt
    const bad = buildProgressExport([{ ...state('a'), stage: 99 }], [], AT) // stage out of the 0–7 range
    expect(() => parseProgressExport(JSON.parse(JSON.stringify(bad)))).toThrow()
  })
})

describe('exportFilename', () => {
  it('stamps the date and falls back gracefully on a junk timestamp', () => {
    expect(exportFilename(AT)).toBe('hikkoshi-progress-2026-07-15.json')
    expect(exportFilename('not-a-date')).toBe('hikkoshi-progress-backup.json')
  })
})
