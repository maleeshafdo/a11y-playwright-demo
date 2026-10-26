import type { AxeResults } from 'axe-core';

/**
 * Turns axe violations into short, readable lines, e.g.
 *   "image-alt [critical] Images must have alternative text (1 element: img)"
 *
 * Asserting `expect(summarizeViolations(results)).toEqual([])` gives a failure
 * message people can actually read, instead of a huge JSON diff.
 */
export function summarizeViolations(results: AxeResults): string[] {
  return results.violations.map((v) => {
    const targets = v.nodes.map((n) => n.target.join(' ')).join(', ');
    const count = `${v.nodes.length} element${v.nodes.length === 1 ? '' : 's'}`;
    return `${v.id} [${v.impact ?? 'n/a'}] ${v.help} (${count}: ${targets})`;
  });
}
