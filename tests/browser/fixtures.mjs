import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        /hydrat|server[- ]rendered|Minified React error/i.test(message.text())
      )
        errors.push(message.text());
    });
    await use(page);
    expect(errors, 'Uncaught page errors or React hydration errors').toEqual(
      [],
    );
  },
});
export { expect };
