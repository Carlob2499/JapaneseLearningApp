import { test, expect, startAsBeginner } from './helpers'

test.describe('about disclosure', () => {
  test('discloses language and photo attribution', async ({ page, consoleErrors }) => {
    void consoleErrors
    await startAsBeginner(page)

    const summary = page.locator('.about summary')
    await summary.scrollIntoViewIfNeeded()
    await summary.click()

    // Language data provenance (D-002/D-005).
    await expect(page.locator('.about-body')).toContainText('KANJIDIC2')
    await expect(page.locator('.about-body')).toContainText('Tatoeba')

    // Photo provenance (D-026) — a CC BY-SA author credited by name.
    await expect(page.locator('.about-body')).toContainText('そらみみ')
  })
})
