import { describe, it, expect } from 'vitest'
import type { JournalEntry } from '@hikkoshi/schemas'
import type { ClassSettings } from '../store/classSettings'
import { activeDays, daysInJapan, isLapsedReturn, keptWeeks, weekCells } from './rhythm'

const DAY_MS = 86_400_000
const WED = new Date('2026-07-22').getTime() // a Wednesday; the week is Sun 7/19 .. Sat 7/25
const at = (offsetDays: number) => WED + offsetDays * DAY_MS

function entry(ts: number): JournalEntry {
  return { itemId: 'x', ts, interaction: 'recall', outcome: 'pass' }
}

function settings(over: Partial<ClassSettings> = {}): ClassSettings {
  return { enabled: false, book: 'quartet1', classDay: 3, lesson: 1, ...over }
}

describe('activeDays', () => {
  it('dedups multiple entries on the same local day', () => {
    const days = activeDays([entry(at(0)), entry(at(0) + 1000), entry(at(0) + 2000)])
    expect(days.size).toBe(1)
  })

  it('counts each distinct day separately', () => {
    expect(activeDays([entry(at(0)), entry(at(1)), entry(at(2))]).size).toBe(3)
  })
})

describe('daysInJapan', () => {
  it('reads as Day 1 for a brand-new profile with no journal yet — endowed, not zero', () => {
    expect(daysInJapan([], at(0))).toBe(1)
  })

  it('counts today even before its own first entry lands', () => {
    // Entries only on two earlier days; today (WED) has none yet.
    expect(daysInJapan([entry(at(-2)), entry(at(-1))], at(0))).toBe(3)
  })

  it('does not double-count a day with multiple entries', () => {
    expect(daysInJapan([entry(at(0)), entry(at(0) + 1000), entry(at(-1))], at(0))).toBe(2)
  })
})

describe('weekCells', () => {
  it('marks exactly one cell as today, at the correct weekday index', () => {
    const cells = weekCells(at(0), [], settings())
    expect(cells.filter((c) => c.isToday)).toHaveLength(1)
    expect(cells[3].isToday).toBe(true) // Wednesday = index 3
  })

  it('marks a cell kept when the journal has an active entry that day', () => {
    const cells = weekCells(at(0), [entry(at(-1))], settings())
    expect(cells[2].kept).toBe(true) // Tuesday
    expect(cells[4].kept).toBe(false) // Thursday — no entry, not yet arrived, not class day
  })

  it('auto-keeps a class day already past this week, with no journal entry needed', () => {
    const cells = weekCells(at(0), [], settings({ enabled: true, classDay: 1 })) // Monday
    expect(cells[1].kept).toBe(true) // Monday already happened this week
  })

  it('auto-keeps today itself when today is the class day', () => {
    const cells = weekCells(at(0), [], settings({ enabled: true, classDay: 3 })) // Wednesday = today
    expect(cells[3].kept).toBe(true)
  })

  it('never credits a class day that is still ahead in the week', () => {
    const cells = weekCells(at(0), [], settings({ enabled: true, classDay: 5 })) // Friday, still upcoming
    expect(cells[5].kept).toBe(false)
  })

  it('grants no class-day credit at all when class mode is off', () => {
    const cells = weekCells(at(0), [], settings({ enabled: false, classDay: 1 }))
    expect(cells[1].kept).toBe(false)
  })
})

describe('keptWeeks', () => {
  it('counts a past week that reached 5 of 7 active days', () => {
    // The previous week: Sun 7/12 .. Sat 7/18. Five distinct active days in it.
    const journal = [0, 1, 2, 3, 4].map((d) => entry(at(-10 + d)))
    expect(keptWeeks(journal, at(0))).toBe(1)
  })

  it('does not count a past week that fell short of 5', () => {
    const journal = [0, 1, 2].map((d) => entry(at(-10 + d)))
    expect(keptWeeks(journal, at(0))).toBe(0)
  })

  it('never judges the current, still-in-progress week', () => {
    // This week already has 5 active days as of today, but it isn't over yet.
    const journal = [0, 1, 2, 3, 4].map((d) => entry(at(-3 + d)))
    expect(keptWeeks(journal, at(0))).toBe(0)
  })

  it('sums multiple qualifying past weeks', () => {
    const lastWeek = [0, 1, 2, 3, 4].map((d) => entry(at(-10 + d)))
    const weekBefore = [0, 1, 2, 3, 4].map((d) => entry(at(-17 + d)))
    expect(keptWeeks([...lastWeek, ...weekBefore], at(0))).toBe(2)
  })
})

describe('isLapsedReturn', () => {
  it('is false for a brand-new profile with no journal yet', () => {
    expect(isLapsedReturn([], at(0))).toBe(false)
  })

  it('is false within 3 days of the last entry', () => {
    expect(isLapsedReturn([entry(at(-2))], at(0))).toBe(false)
  })

  it('is true beyond 3 days since the last entry', () => {
    expect(isLapsedReturn([entry(at(-4))], at(0))).toBe(true)
  })
})
