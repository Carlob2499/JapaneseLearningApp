import { z } from 'zod'
import { Source } from './common'

/**
 * A textbook lesson (D-034): the join between a real classroom curriculum and this app's
 * dataset-verified content. Nothing here carries the textbook's own prose, vocab glosses, or
 * examples (that would violate its copyright — the publisher actively enforces it); every field
 * is either a fact (lesson number, a grammar pattern name) or a pointer to our own cited content.
 * `vocabIds`/`grammarIds` point at VocabItem/GrammarPoint ids resolved at pipeline build time
 * from the curated input's expression+reading matchers (mirrors GrammarPoint's curated→emitted
 * split, D-016) — a matcher with no resolvable item is dropped with a build warning, never
 * silently invented.
 */
export const LessonTemplate = z.object({
  kind: z.literal('lesson'),
  id: z.string().min(1),
  book: z.string().min(1),
  lesson: z.number().int().positive(),
  /** Original one-line title (never the textbook's own chapter title verbatim). */
  titleEn: z.string().min(1),
  /** Original one-line theme summary. */
  themeEn: z.string().min(1),
  grammarIds: z.array(z.string().min(1)).min(1),
  vocabIds: z.array(z.string().min(1)).min(1),
  /** Default weekly kanji sets (6 literals each) — learner-editable at runtime against their own
   *  copy of the book; shipped defaults are our own frequency-ordered, N3-tagged selection. */
  kanjiWeeks: z.array(z.array(z.string().min(1)).length(6)).min(1),
  citations: z.array(Source).min(1),
})
export type LessonTemplate = z.infer<typeof LessonTemplate>

/** One book's worth of lessons, in order. */
export const Classbook = z.object({
  book: z.string().min(1),
  lessons: z.array(LessonTemplate).min(1),
})
export type Classbook = z.infer<typeof Classbook>
