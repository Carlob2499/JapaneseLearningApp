import { test, expect, startAsBeginner } from './helpers'

async function gradeOneRound(page: import('@playwright/test').Page): Promise<boolean> {
  if (await page.locator('.day-end-count').count()) return true
  const reveal = page.getByRole('button', { name: /^reveal$/i })
  if (await reveal.count()) {
    await reveal.first().click()
    await page.getByRole('button', { name: /^good$/i }).click()
    return false
  }
  const choices = page.locator('[data-testid="choice"]')
  if (await choices.count()) {
    await page.locator('[data-testid="choice"][data-correct="true"]').first().click()
    const next = page.locator('.next-btn')
    if (await next.count()) await next.click()
    return false
  }
  const typed = page.locator('[data-testid="typed-input"]')
  if (await typed.count()) {
    await typed.fill('x')
    await page.getByRole('button', { name: /^check$/i }).click()
    const next = page.locator('.next-btn')
    if (await next.count()) await next.click()
    return false
  }
  return false
}

async function runToSummary(page: import('@playwright/test').Page): Promise<void> {
  for (let i = 0; i < 60; i++) {
    if (await gradeOneRound(page)) break
    await page.waitForTimeout(80)
  }
  await expect(page.locator('.day-end-count')).toBeVisible({ timeout: 10_000 })
}

test.describe('classroom (D-034/D-035)', () => {
  test('the term map opens, shows all six lessons, and the weekly kanji sheet', async ({ page, consoleErrors }) => {
    void consoleErrors
    await startAsBeginner(page)
    await page.locator('.class-discovery >> text=Set up').click()
    await expect(page.locator('.classroom-page')).toBeVisible()
    await expect(page.locator('.lesson-panel')).toHaveCount(6)
    await expect(page.locator('.grammar-row').first()).toBeVisible()
    await expect(page.locator('.kanji-week-cell')).toHaveCount(6)
  })

  test('seed then capture: the day task appears, resolves the full cross-level lesson, and completes', async ({
    page,
    consoleErrors,
  }) => {
    void consoleErrors
    await startAsBeginner(page)

    // Pick a classDay that lands "seed" on whatever real day this runs (1–2 days before class).
    const today = new Date().getDay()
    const seedDay = (today + 2) % 7
    await page.locator('.class-discovery >> text=Set up').click()
    await page.locator('.classroom-toggle input').check()
    await page.locator('.day-chip').nth(seedDay).click()
    await page.getByRole('button', { name: /home/i }).click()

    await expect(page.locator('.class-task-btn')).toContainText('予習')
    const seedCount = await page.locator('.today-task', { has: page.locator('.class-task-btn') }).locator('.fineprint').textContent()
    expect(seedCount).toMatch(/\d+ items/)

    await page.locator('.class-task-btn').click()
    await expect(page.locator('.progress-text')).toContainText('予習')
    await runToSummary(page)
    await page.getByRole('button', { name: /back home/i }).click()

    // Flip to a classDay that lands "capture" — the items just seeded now carry state.
    const captureDay = (today + 6) % 7
    await page.locator('.class-entry').click()
    await page.locator('.day-chip').nth(captureDay).click()
    await page.getByRole('button', { name: /home/i }).click()

    await expect(page.locator('.class-task-btn')).toContainText('復習')
    await page.locator('.class-task-btn').click()
    await expect(page.locator('.progress-text')).toContainText('復習')
    await runToSummary(page)
  })
})

/** The one grammar item this journey forces to cloze-eligible stage (D-036: stage 4+), so the
 *  capture round is guaranteed to present a worksheet card without waiting real weeks of spaced
 *  review. Lesson 1's own `grammar:l2:you-ni-suru` resolves (via clozeFor, on its own first
 *  example 「毎日運動するようにする。」) to the hiragana-only blank below — typeable, not a recall
 *  fallback. */
const WORKSHEET_SEED_ID = 'grammar:l2:you-ni-suru'
const WORKSHEET_SEED_ANSWER = 'ようにする'

async function forceWorksheetStage(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(async (itemId: string) => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('hikkoshi', 1)
      req.onupgradeneeded = () => {
        const d = req.result
        if (!d.objectStoreNames.contains('itemStates')) d.createObjectStore('itemStates', { keyPath: 'itemId' })
        if (!d.objectStoreNames.contains('journal')) d.createObjectStore('journal', { autoIncrement: true })
      }
      req.onsuccess = () => {
        const d = req.result
        const tx = d.transaction('itemStates', 'readwrite')
        tx.objectStore('itemStates').put({
          itemId,
          stage: 4,
          due: Date.now() - 1_000,
          introducedAt: Date.now() - 100_000,
          lapses: 0,
          lastOutcomes: 0,
        })
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error as Error)
      }
      req.onerror = () => reject(req.error as Error)
    })
  }, WORKSHEET_SEED_ID)
}

/** Grades whatever card is showing — reveal, worksheet (cloze), choice, or typed — and reports
 *  whether the round reached its summary. A local copy of `gradeOneRound` above rather than an
 *  extension of it: this journey is the only place a worksheet card is ever forced to appear, and
 *  duplicating a dozen lines costs less than risking the already-green seed/capture test above. */
async function gradeOneRoundFull(page: import('@playwright/test').Page): Promise<boolean> {
  if (await page.locator('.day-end-count').count()) return true
  const reveal = page.getByRole('button', { name: /^reveal$/i })
  if (await reveal.count()) {
    await reveal.first().click()
    await page.getByRole('button', { name: /^good$/i }).click()
    return false
  }
  const worksheet = page.locator('[data-testid="worksheet-input"]')
  if (await worksheet.count()) {
    await worksheet.fill(WORKSHEET_SEED_ANSWER)
    await page.getByRole('button', { name: /^check$/i }).click()
    await expect(page.locator('.typed-feedback.correct')).toBeVisible()
    const next = page.locator('.next-btn')
    if (await next.count()) await next.click()
    return false
  }
  const choices = page.locator('[data-testid="choice"]')
  if (await choices.count()) {
    await page.locator('[data-testid="choice"][data-correct="true"]').first().click()
    const next = page.locator('.next-btn')
    if (await next.count()) await next.click()
    return false
  }
  const typed = page.locator('[data-testid="typed-input"]')
  if (await typed.count()) {
    await typed.fill('x')
    await page.getByRole('button', { name: /^check$/i }).click()
    const next = page.locator('.next-btn')
    if (await next.count()) await next.click()
    return false
  }
  return false
}

async function runToSummaryFull(page: import('@playwright/test').Page): Promise<void> {
  for (let i = 0; i < 60; i++) {
    if (await gradeOneRoundFull(page)) break
    await page.waitForTimeout(80)
  }
  await expect(page.locator('.day-end-count')).toBeVisible({ timeout: 10_000 })
}

/** Traces the current active guide stroke by sampling real points along its own path (the same
 *  technique as e2e/trace.spec.ts — jsdom lacks getTotalLength/getPointAtLength, so this can only
 *  run here, against a real browser). */
async function traceActiveStroke(page: import('@playwright/test').Page): Promise<void> {
  const points = await page.evaluate(() => {
    const svg = document.querySelector('.trace-svg') as SVGSVGElement
    const path = svg.querySelector('.trace-guide.active') as SVGPathElement
    const rect = svg.getBoundingClientRect()
    const vb = svg.viewBox.baseVal
    const len = path.getTotalLength()
    return [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map((f) => {
      const p = path.getPointAtLength(len * f)
      return { x: rect.left + (p.x / vb.width) * rect.width, y: rect.top + (p.y / vb.height) * rect.height }
    })
  })
  await page.mouse.move(points[0].x, points[0].y)
  await page.mouse.down()
  for (const p of points.slice(1)) {
    await page.mouse.move(p.x, p.y)
  }
  await page.mouse.up()
  await page.waitForTimeout(100)
}

test.describe('classroom companion — full journey (D-039)', () => {
  test('enable class mode, seed, capture with a worksheet cloze, trace a stroke, and the week ring reflects it', async ({
    page,
    consoleErrors,
  }) => {
    // Strictly more work than the seed/capture test above (which alone runs close to 60s): the
    // same full cross-level lesson twice over, plus a forced worksheet round, a readiness check,
    // and a real pointer-traced stroke.
    test.setTimeout(150_000)
    void consoleErrors
    await startAsBeginner(page)

    const today = new Date().getDay()
    const seedDay = (today + 2) % 7
    const captureDay = (today + 6) % 7

    await page.locator('.class-discovery >> text=Set up').click()
    await page.locator('.classroom-toggle input').check()
    await page.locator('.day-chip').nth(seedDay).click()
    await page.getByRole('button', { name: /home/i }).click()

    await expect(page.locator('.class-task-btn')).toContainText('予習')
    await page.locator('.class-task-btn').click()
    await expect(page.locator('.progress-text')).toContainText('予習')
    await runToSummaryFull(page)
    await page.getByRole('button', { name: /back home/i }).click()

    // Reaching cloze stage (4+) through real spaced review would take real weeks — force it.
    await forceWorksheetStage(page)

    // Readiness moved: the dial reads something other than the fresh-profile 0%.
    await page.locator('.class-entry').click()
    await expect(page.locator('.classroom-page')).toBeVisible()
    await expect(page.locator('.readiness-pct')).not.toHaveText('0%')

    await page.locator('.day-chip').nth(captureDay).click()
    await page.getByRole('button', { name: /home/i }).click()

    await expect(page.locator('.class-task-btn')).toContainText('復習')
    await page.locator('.class-task-btn').click()
    await expect(page.locator('.progress-text')).toContainText('復習')
    await runToSummaryFull(page)
    await page.getByRole('button', { name: /back home/i }).click()

    // Trace one stroke of this week's kanji sheet — the sheet stays reachable and operable.
    await page.locator('.class-entry').click()
    await page.locator('.kanji-practice-open').click()
    await page.locator('[data-testid="trace-cell"]').first().click()
    await expect(page.locator('.trace-svg')).toBeVisible()
    await traceActiveStroke(page)
    await expect(page.locator('.trace-sheet')).toBeVisible()

    // No ceremony ever mounted, in any project: this journey deliberately never reaches "solid"
    // (D-036: 3 distinct-day productions) or a fully-traced sheet (D-037: all six cells).
    expect(await page.locator('.lesson-ceremony').count()).toBe(0)
    expect(await page.locator('.kanji-ceremony').count()).toBe(0)

    const backToSheet = page.getByRole('button', { name: /back to the sheet/i })
    if (await backToSheet.count()) await backToSheet.click()
    const close = page.getByRole('button', { name: /^close$/i })
    if (await close.count()) await close.click()
    await page.getByRole('button', { name: /home/i }).click()

    // The week ring reflects today's activity — kept, not just today.
    await expect(page.locator('.week-cell.today.kept')).toHaveCount(1)
  })
})
