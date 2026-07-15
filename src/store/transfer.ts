import { ProgressExport, type ItemState, type JournalEntry } from '@hikkoshi/schemas'

/** Bumped only if the export shape changes in a way an older importer couldn't read. */
export const PROGRESS_SCHEMA_VERSION = '1.0.0'
/** Cap on exported journal entries — a generous tail that comfortably covers the 30-day leech
 *  window (srs.ts) while keeping a heavy user's file from growing without bound. */
export const JOURNAL_TAIL_MAX = 2000

/**
 * Build a portable progress snapshot (E7 / D-022): every item state plus a bounded tail of the
 * append-only journal, wrapped in the `ProgressExport` schema that has existed since Session 6.
 * `exportedAt` is passed in (an ISO string) rather than read here so this stays pure and testable.
 */
export function buildProgressExport(
  states: readonly ItemState[],
  journal: readonly JournalEntry[],
  exportedAt: string,
): ProgressExport {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    exportedAt,
    itemStates: [...states],
    journalTail: journal.slice(-JOURNAL_TAIL_MAX),
  }
}

/**
 * Parse + validate an uploaded snapshot. `ProgressExport.parse` is the trust boundary (D-002 /
 * D-001): anything malformed — wrong shape, out-of-range stage, junk types — throws here rather
 * than corrupting the store, so the importer can surface a clean error and write nothing.
 */
export function parseProgressExport(raw: unknown): ProgressExport {
  return ProgressExport.parse(raw)
}

/** Download filename for a snapshot, stamped with its export date (YYYY-MM-DD). */
export function exportFilename(exportedAt: string): string {
  const day = /^\d{4}-\d{2}-\d{2}/.exec(exportedAt)?.[0] ?? 'backup'
  return `hikkoshi-progress-${day}.json`
}
