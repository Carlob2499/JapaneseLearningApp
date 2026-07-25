import { test, expect, startAsBeginner } from './helpers'

// Lesson 1's real grammarIds (content/curated/classbook/quartet1.json) — seeding every one of
// them "solid" (3 distinct-day productions, D-036) is what should trigger the lesson ceremony.
const LESSON_1_GRAMMAR_IDS = [
  'grammar:l2:you-ni-suru',
  'grammar:l3:you-ni-naru',
  'grammar:l3:tame-ni',
  'grammar:l3:rashii',
  'grammar:l3:to-ieba',
  'grammar:l3:toori-ni',
  'grammar:l3:ni-yoru-to',
  'grammar:l4:kikkake-de',
]

/** Seeds every lesson-1 grammar point straight to "solid" via IndexedDB directly (the same store
 *  the app itself writes to) — reaching this through real spaced review would take real weeks. */
async function seedLessonSolid(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(async (ids: string[]) => {
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
        const now = Date.now()
        for (const itemId of ids) {
          tx.objectStore('itemStates').put({
            itemId,
            stage: 6,
            due: now + 999_999_999,
            introducedAt: now - 999_999,
            lapses: 0,
            lastOutcomes: 0,
            productionStreak: 3,
          })
        }
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error as Error)
      }
      req.onerror = () => reject(req.error as Error)
    })
  }, LESSON_1_GRAMMAR_IDS)
}

test.describe('the return loop (D-038)', () => {
  test('the week ring on Home renders exactly 7 cells', async ({ page, consoleErrors }) => {
    void consoleErrors
    await startAsBeginner(page)
    await expect(page.locator('.week-cell')).toHaveCount(7)
  })

  test('the lesson hanko ceremony plays once every grammar point in the lesson is solid', async ({
    page,
    consoleErrors,
  }) => {
    void consoleErrors
    test.skip(test.info().project.name === 'reduced', 'the ceremony never mounts under reduced motion')
    await startAsBeginner(page)
    await seedLessonSolid(page)
    await page.locator('.class-discovery >> text=Set up').click()
    await expect(page.locator('.lesson-ceremony')).toBeVisible()
    await expect(page.locator('.lesson-ceremony')).toHaveCount(0, { timeout: 6_000 })
    // The classroom underneath stays fully operable afterwards.
    await expect(page.locator('.classroom-page')).toBeVisible()
    await expect(page.locator('.grammar-row-status.solid').first()).toBeVisible()
  })

  test('reduced motion: the lesson ceremony never mounts, even with every point solid', async ({
    page,
    consoleErrors,
  }) => {
    void consoleErrors
    test.skip(test.info().project.name !== 'reduced', 'asserting the reduced world only')
    await startAsBeginner(page)
    await seedLessonSolid(page)
    await page.locator('.class-discovery >> text=Set up').click()
    await expect(page.locator('.classroom-page')).toBeVisible()
    expect(await page.locator('.lesson-ceremony').count()).toBe(0)
  })
})
