import type { JournalEntry, LessonTemplate, StrokeItem } from '@hikkoshi/schemas'

/** Whether a stroke item has at least one completed trace in the journal (D-037) — completion is
 *  binary and permanent (the append-only journal never needs a "most recent attempt" read), the
 *  same "any state exists" simplicity Classroom's grammar status chip already uses. */
export function isTraced(itemId: string, journal: readonly JournalEntry[]): boolean {
  return journal.some((e) => e.itemId === itemId && e.interaction === 'trace' && e.outcome === 'pass')
}

/** Whether every character in a weekly kanji set has been traced — a completed sheet. A literal
 *  with no stroke data (should never happen for shipped content, but a learner's own hand-typed
 *  override could name anything) counts as not-yet-complete rather than throwing. */
export function isSheetComplete(
  literals: readonly string[],
  strokesByLiteral: ReadonlyMap<string, StrokeItem>,
  journal: readonly JournalEntry[],
): boolean {
  return literals.every((c) => {
    const item = strokesByLiteral.get(c)
    return item !== undefined && isTraced(item.id, journal)
  })
}

/** The six characters actually shown for a lesson: the learner's override only ever applies to
 *  whichever lesson is currently selected (mirrors Classroom's existing KanjiWeek display). */
export function kanjiWeekFor(lesson: LessonTemplate, currentLesson: number, override: string[] | undefined): string[] {
  return lesson.lesson === currentLesson && override ? override : lesson.kanjiWeeks[0]
}
