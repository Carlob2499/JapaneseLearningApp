import { z } from 'zod'

/** Review outcome for one card interaction. */
export const Outcome = z.enum(['pass', 'fail', 'partial'])
export type Outcome = z.infer<typeof Outcome>

/**
 * Retrieval direction for a study card, escalating with mastery (see the review loop):
 * `recognition` (cued: JP → meaning), `production` (harder: meaning → JP), `typed` (produce the
 * reading by typing it), `listening` (audio-first: hear the word, pick the meaning — D-028),
 * `cloze` (fill the blanked pattern in a real sentence — D-036), `transform` (produce the whole
 * inflected pattern from its dictionary form — D-036), and `recall` (uncued: reveal +
 * self-grade). Logged into `JournalEntry.interaction` so the journal records *how* an item was
 * tested, not just which item. The `interaction` field stays a free-form string (older entries
 * recorded the item kind), so this is a labelling vocabulary, not a runtime constraint on the
 * journal.
 */
export const RetrievalMode = z.enum(['recognition', 'production', 'typed', 'listening', 'cloze', 'transform', 'recall'])
export type RetrievalMode = z.infer<typeof RetrievalMode>

/**
 * SRS state for one learnable item (architecture §4/§5). Stored in IndexedDB,
 * keyed by `itemId`. `stage` indexes the interval ladder; `due` is epoch ms.
 * `productionStreak`/`lastProductionDay` track grammar's worksheet production (D-036): a point
 * is "solid" once it's been produced correctly on 3 distinct days (Serfaty & Serrano 2024) —
 * `lastProductionDay` guards against one session incrementing the streak more than once.
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
  productionStreak: z.number().int().nonnegative().optional(),
  lastProductionDay: z.number().int().optional(),
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
