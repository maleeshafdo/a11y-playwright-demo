// LEVEL: beginner. The smallest useful axe-core test in Playwright.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('axe finds the deliberate violations on the demo page', async ({ page }) => {
  // 1. Open the page (baseURL comes from playwright.config.ts)
  await page.goto('/');

  // 2. Run axe-core against what is currently rendered, limited to WCAG A/AA rules
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // 3. Assert on the results. Each violation has an `id` (the axe rule that failed).
  const ruleIds = results.violations.map((v) => v.id);
  expect(ruleIds).toEqual(
    expect.arrayContaining([
      'html-has-lang',
      'image-alt',
      'button-name',
      'link-name',
      'label',
      'color-contrast',
    ]),
  );
});

test('the About section has no accessibility violations', async ({ page }) => {
  await page.goto('/');

  // .include() scopes the scan to part of the page
  const results = await new AxeBuilder({ page })
    .include('#about')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // This is the assertion you will write most often in real projects
  expect(results.violations).toEqual([]);
});
