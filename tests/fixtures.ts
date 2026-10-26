import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * The WCAG levels our team tests against. Change this in ONE place
 * and every test that uses the `makeAxeBuilder` fixture picks it up.
 */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

type AxeFixtures = {
  makeAxeBuilder: () => AxeBuilder;
};

/**
 * `test` with an extra fixture that returns a pre-configured AxeBuilder.
 * Usage: test('...', async ({ page, makeAxeBuilder }) => { ... })
 */
export const test = base.extend<AxeFixtures>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () => new AxeBuilder({ page }).withTags(WCAG_TAGS);
    await use(makeAxeBuilder);
  },
});

export { expect } from '@playwright/test';
