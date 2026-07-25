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
