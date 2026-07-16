import { test, expect, startAsBeginner } from './helpers'

test.describe('emergency reference (M9)', () => {
  test('is reachable from Home and shows the numbers and cited phrases', async ({ page, consoleErrors }) => {
    void consoleErrors
    await startAsBeginner(page)

    await page.getByRole('button', { name: /in an emergency/i }).click()
    await expect(page.getByRole('heading', { name: /in an emergency/i })).toBeVisible()

    // The two emergency numbers.
    await expect(page.locator('.emergency-number', { hasText: '119' })).toBeVisible()
    await expect(page.locator('.emergency-number', { hasText: '110' })).toBeVisible()

    // The cited "say this" phrases load (from the bundled L1 pack — works offline).
    await expect(page.locator('.emergency-phrase')).not.toHaveCount(0)
    await expect(page.locator('.emergency-ja', { hasText: '助けてください' })).toBeVisible()

    // Back to Home.
    await page.getByRole('button', { name: /home/i }).click()
    await expect(page.locator('.home-hero')).toBeVisible()
  })
})
