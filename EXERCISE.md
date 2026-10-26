# Exercise: extend the accessibility tests

Do these in order. Tasks 1–2 take about 15 minutes total; 3–4 are stretch goals.
Each task says how to know you're done. Solutions are folded at the bottom, so try first!

---

## Task 1: Scan a state that only appears after interaction (beginner)

axe only scans **what is in the DOM and visible right now**. The demo page has a
"Show newsletter options" button that reveals a hidden panel, and that panel has a bug.

Create `tests/exercise.spec.ts` and write a test that:

1. opens `/`,
2. scans only `#newsletter` and asserts **no** violations (the panel is hidden, so axe skips it),
3. clicks the **Show newsletter options** button. Use `page.getByRole('button', { name: 'Show newsletter options' })`,
4. scans `#newsletter` again and asserts the violation ids **contain** `select-name`.

**Done when:** `npx playwright test exercise` shows `1 passed`.

**Why it matters:** menus, modals, error messages, accordions and tabs are where real bugs hide.
A test that only scans the page on load misses all of them.

---

## Task 2: Fix the page and make the tests prove it (beginner → intermediate)

Fix every bug listed at the top of `demo/index.html` (V1–V7). Hints:

| Bug | Hint |
|---|---|
| V1 `html-has-lang` | `<html lang="en">` |
| V2 `image-alt` | describe what the logo *means*: `alt="Acme Widgets"` |
| V3 `button-name` | `aria-label="Search"` on the icon button |
| V4 `link-name` | `aria-label="Help"` on the icon link |
| V5 `label` | turn the `<span>` into `<label for="email">` |
| V6 `color-contrast` | a darker grey such as `#595959` (≥ 4.5:1 on white) |
| V7 `select-name` | turn the question `<p>` into `<label for="frequency">` |

Then:

1. Add a test that scans the **whole page** and asserts `expect(results.violations).toEqual([])`.
2. Run the full suite with `npx playwright test`. Some of the *provided* tests now fail. Read why, then update them:
   - `01-first-scan`: the "finds the deliberate violations" test no longer makes sense. Change it to assert zero violations.
   - `02-team-patterns`: the attachment test expects violations > 0. Change it to `toEqual([])` or `toBe(0)`.
   - `02-team-patterns`: the baseline test still passes, but `KNOWN_ISSUES` is now stale. Empty it.
     (In a real project, deleting an entry is how you "close" a ticketed issue.)
3. Re-run Task 1. It should now **fail**, because the select has a label. Update it to expect zero violations after the click.

**Done when:** `npx playwright test` is fully green, and no test still refers to a bug that no longer exists.

---

## Task 3: Catch what axe can't (stretch)

axe passes the "Sign up" control, but it's a `<div>`: you can't Tab to it, and screen readers
don't announce it as a button. Playwright's **role-based locators** use the accessibility tree,
so they double as a lightweight accessibility check.

1. Write a test asserting `await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible();`
2. Run it against the original page. It **fails**, even though axe was happy.
3. Fix the HTML (use a real `<button type="button">`). The test passes.
4. Bonus: press `Tab` with `page.keyboard.press('Tab')` until the button is focused and
   assert `await expect(page.getByRole('button', { name: 'Sign up' })).toBeFocused();`

**Done when:** you can explain to a teammate why both checks are needed.

---

## Task 4: Scope and suppress responsibly (stretch)

Real pages contain things you don't own (third-party chat widgets, embedded maps) or issues
with an accepted exception. Write a test that:

- uses the `makeAxeBuilder` fixture from `tests/fixtures.ts` (import `test`/`expect` from `./fixtures`),
- excludes the `header` with `.exclude('header')`,
- disables `color-contrast` with `.disableRules(['color-contrast'])` **and a comment explaining why and linking a ticket**,
- asserts with `summarizeViolations` from `./helpers/summarize`.

Before running it, predict which violations remain. Then run it and check.

**Discussion:** when is `exclude`/`disableRules` legitimate, and when is it hiding a bug?
What would you require in code review before approving one?

---

## Solutions

<details>
<summary>Task 1</summary>

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test('newsletter panel is scanned only once it is visible', async ({ page }) => {
  await page.goto('/');

  const before = await new AxeBuilder({ page }).include('#newsletter').withTags(TAGS).analyze();
  expect(before.violations).toEqual([]);

  await page.getByRole('button', { name: 'Show newsletter options' }).click();
  await expect(page.locator('#newsletter')).toBeVisible();

  const after = await new AxeBuilder({ page }).include('#newsletter').withTags(TAGS).analyze();
  expect(after.violations.map((v) => v.id)).toContain('select-name');
});
```

Note the `toBeVisible()` wait before the second scan: always wait for the UI state you want to scan.
</details>

<details>
<summary>Task 2 (whole-page test after fixes)</summary>

```ts
test('the fixed page has no violations, before and after interaction', async ({ page }) => {
  await page.goto('/');
  expect((await new AxeBuilder({ page }).withTags(TAGS).analyze()).violations).toEqual([]);

  await page.getByRole('button', { name: 'Show newsletter options' }).click();
  await expect(page.locator('#newsletter')).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(TAGS).analyze()).violations).toEqual([]);
});
```
</details>

<details>
<summary>Task 3</summary>

```html
<button type="button" class="fake-button"
        onclick="document.getElementById('status').textContent = 'Thanks for signing up!'">Sign up</button>
```

```ts
test('Sign up is a real, keyboard-reachable button', async ({ page }) => {
  await page.goto('/');
  const signUp = page.getByRole('button', { name: 'Sign up' });
  await expect(signUp).toBeVisible();

  // Tab until focus lands on the button (bounded, so the test can't loop forever)
  for (let i = 0; i < 15 && !(await signUp.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(signUp).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Thanks for signing up!');
});
```
</details>

<details>
<summary>Task 4</summary>

```ts
import { test, expect } from './fixtures';
import { summarizeViolations } from './helpers/summarize';

test('page excluding third-party header, with a documented exception', async ({ page, makeAxeBuilder }) => {
  await page.goto('/');
  const results = await makeAxeBuilder()
    .exclude('header') // header is owned by [other team]; covered by their own suite
    // Fine-print colour is a brand decision under review: [TICKET-ID]
    .disableRules(['color-contrast'])
    .analyze();

  expect(summarizeViolations(results)).toEqual([]);
});
```

On the **original** page this still fails with `html-has-lang` and `label`. `html-has-lang` remains
because the `<html>` element is outside the header. Excluding a region doesn't hide page-level rules.
</details>
