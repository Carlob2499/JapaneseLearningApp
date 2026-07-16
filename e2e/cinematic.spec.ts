import { test, expect, openApp, startAsBeginner } from './helpers'

test.describe('cinematic evolution (D-033)', () => {
  test('the arrival title plays once, then never again', async ({ page, consoleErrors }) => {
    void consoleErrors
    test.skip(test.info().project.name === 'reduced', 'arrival never mounts under reduced motion')
    await page.goto('./')
    await expect(page.locator('.arrival-title')).toBeVisible()
    // It clears on its own (≤ ~2.4s) and hands off to onboarding.
    await expect(page.locator('.arrival-title')).toHaveCount(0, { timeout: 6_000 })
    await expect(page.locator('.onboarding-arrival img')).toBeVisible()
    // Once per device: a reload goes straight to onboarding.
    await page.reload()
    await expect(page.locator('.onboarding-arrival img')).toBeVisible()
    expect(await page.locator('.arrival-title').count()).toBe(0)
  })

  test('reduced motion stills everything: no arrival, no weather', async ({ page, consoleErrors }) => {
    void consoleErrors
    test.skip(test.info().project.name !== 'reduced', 'asserting the reduced world only')
    await openApp(page)
    expect(await page.locator('.arrival-title').count()).toBe(0)
    expect(await page.locator('.ambient-layer').count()).toBe(0)
  })

  test('the ambient world layer is present and inert', async ({ page, consoleErrors }) => {
    void consoleErrors
    test.skip(test.info().project.name === 'reduced', 'the layer never mounts under reduced motion')
    await startAsBeginner(page)
    // The ground is always stamped…
    const ground = await page.evaluate(() => ({
      tod: document.documentElement.dataset.tod,
      season: document.documentElement.dataset.season,
    }))
    expect(['morning', 'day', 'dusk', 'night']).toContain(ground.tod)
    expect(['spring', 'tsuyu', 'summer', 'autumn', 'winter']).toContain(ground.season)
    // …and when the season carries particles, the layer must be inert (summer is wash-only).
    if (ground.season !== 'summer') {
      const layer = page.locator('.ambient-layer')
      await expect(layer).toBeAttached()
      expect(await layer.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none')
      expect(await page.locator('.ambient-p').count()).toBeLessThanOrEqual(12)
    }
  })

  test('the scene title card letterboxes over a live stage, then clears', async ({ page, consoleErrors }) => {
    void consoleErrors
    test.skip(test.info().project.name === 'reduced', 'title cards never mount under reduced motion')
    await startAsBeginner(page)
    await page.locator('.errand-tile', { hasText: 'Konbini checkout' }).click()
    await expect(page.locator('.scene-title-card')).toBeVisible()
    // The stage beneath is live from t0 — the card only overlays it.
    await expect(page.locator('.scene-photo img')).toBeVisible()
    await expect(page.locator('.scene-title-card')).toHaveCount(0, { timeout: 5_000 })
    // The flow is reachable afterwards.
    await expect(page.locator('.scene-continue-btn, [data-testid="choice"]').first()).toBeVisible()
  })
})
