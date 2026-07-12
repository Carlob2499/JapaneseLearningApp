import { z } from 'zod'

/** Review outcome for one card interaction. */
export const Outcome = z.enum(['pass', 'fail', 'partial'])
export type Outcome = z.infer<typeof Outcome>

/**
 * SRS state for one learnable item (architecture §4/§5). Stored in IndexedDB,
 * keyed by `itemId`. `stage` indexes the interval ladder; `due` is epoch ms.
 */
export const ItemState = z.object({
  itemId: z.string().min(1),
  stage: z.number().int().min(0).max(7),
  due: z.number().int(), // epoch ms
  introducedAt: z.number().int(),
  lapses: z.number().int().nonnegative(),
  lastOutcomes: z.number().int().nonnegative(), // bit-packed recent outcomes
  provisional: z.boolean().optional(),
  leech: z.boolean().optional(),
})
export type ItemState = z.infer<typeof ItemState>

/** Append-only review log entry — FSRS-ready; never mutated (architecture §5). */
export const JournalEntry = z.object({
  itemId: z.string().min(1),
  ts: z.number().int(),
  interaction: z.string().min(1),
  outcome: Outcome,
  latencyMs: z.number().int().nonnegative().optional(),
  sceneId: z.string().optional(),
})
export type JournalEntry = z.infer<typeof JournalEntry>

/** Portable progress snapshot (export/import — the UI comes in a later session). */
export const ProgressExport = z.object({
  schemaVersion: z.string().min(1),
  exportedAt: z.string().min(1),
  itemStates: z.array(ItemState),
  journalTail: z.array(JournalEntry),
})
export type ProgressExport = z.infer<typeof ProgressExport>
