// LEVEL: intermediate. Patterns that make axe tests maintainable in a real suite.
import { test, expect } from './fixtures';
import { summarizeViolations } from './helpers/summarize';

test('attach the full axe report to the Playwright HTML report', async ({ page, makeAxeBuilder }, testInfo) => {
  await page.goto('/');
  const results = await makeAxeBuilder().analyze();

  // Open with `npm run report`, click this test, then the attachment
  await testInfo.attach('axe-results', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });

  expect(results.violations.length).toBeGreaterThan(0);
});

test('gate on impact: only critical and serious issues fail the build', async ({ page, makeAxeBuilder }) => {
  await page.goto('/');
  const results = await makeAxeBuilder().include('#about').analyze();

  const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(summarizeViolations({ ...results, violations: blocking })).toEqual([]);
});

/**
 * Baseline pattern for migrating an existing app: known issues are listed (with a ticket)
 * so the suite is green today, but any NEW violation fails immediately.
 * Delete entries as tickets are fixed; the list should only ever shrink.
 */
const KNOWN_ISSUES: Record<string, string> = {
  'html-has-lang': '[TICKET-ID] add lang attribute',
  'image-alt': '[TICKET-ID] logo alt text',
  'button-name': '[TICKET-ID] search button label',
  'link-name': '[TICKET-ID] help link label',
  label: '[TICKET-ID] email field label',
  'color-contrast': '[TICKET-ID] fine print colour',
};

test('baseline: no violations beyond the known, ticketed ones', async ({ page, makeAxeBuilder }) => {
  await page.goto('/');
  const results = await makeAxeBuilder().analyze();

  const newViolations = results.violations.filter((v) => !(v.id in KNOWN_ISSUES));
  expect(summarizeViolations({ ...results, violations: newViolations })).toEqual([]);
});
