import { test, expect, openApp, startAsBeginner, placeViaProbe } from './helpers'

test.describe('onboarding', () => {
  test('arrival band renders on first run', async ({ page, consoleErrors }) => {
    void consoleErrors
    await openApp(page)
    await expect(page.locator('.onboarding-arrival img')).toBeVisible()
    await expect(page.getByRole('button', { name: /start at the beginning/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /studied before/i })).toBeVisible()
  })

  test('beginner fork reaches a ready Home', async ({ page, consoleErrors }) => {
    void consoleErrors
    await startAsBeginner(page)
    await expect(page.locator('.home-hero img')).toBeVisible()
    await expect(page.locator('.life-stage-badge')).toBeVisible()
  })

  test('placement fork places past the basics and reaches Home', async ({ page, consoleErrors }) => {
    void consoleErrors
    await placeViaProbe(page)
    await expect(page.locator('.home-hero img')).toBeVisible()
    // A placed profile has more than the beginner's two levels selected.
    await expect(page.locator('.level-chip.on')).not.toHaveCount(0)
  })
})
