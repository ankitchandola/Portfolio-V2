import { test, expect } from './fixtures.mjs';

test('generated routes and custom 404 never use an SPA fallback', async ({
  page,
  request,
}) => {
  for (const route of ['/work/recon-desk', '/lite/', '/play/']) {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('<main');
  }
  for (const route of [
    '/not-a-page/',
    '/work/not-generated/',
    '/assets/missing.js',
  ]) {
    const response = await request.get(route);
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain('A small detour.');
  }
  const response = await page.goto('/not-a-page/');
  expect(response.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'A small detour.',
  );
  await page.getByRole('link', { name: 'Return to the work' }).click();
  await expect(page).toHaveURL('/');
});

for (const route of ['/', '/work/recon-desk']) {
  for (const variant of ['refined', 'original']) {
    test(`${route} gallery: ${variant}, keyboard selection and complete image`, async ({
      page,
    }) => {
      await page.goto(
        route + (variant === 'original' ? '?gallery=original' : ''),
      );
      await expect(page.locator('html')).toHaveAttribute(
        'data-gallery',
        variant,
      );
      const gallery = page.locator('.evidence-gallery').first();
      const buttons = gallery.locator('.gallery-options button');
      await buttons.first().focus();
      await buttons.first().press('Tab');
      await expect(buttons.nth(1)).toBeFocused();
      await buttons.nth(1).press('Space');
      await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
      await expect(buttons.first()).toHaveAttribute('aria-pressed', 'false');
      await expect(gallery.locator('figure').first()).toBeHidden();
      const panel = gallery.locator('figure').nth(1);
      await expect(panel).toBeVisible();
      const image = panel.locator('img');
      await expect
        .poll(() =>
          image.evaluate((img) => img.complete && img.naturalWidth > 0),
        )
        .toBe(true);
      expect(
        await image.evaluate((img) => {
          const { width, height } = img.getBoundingClientRect();
          return Math.abs(
            width / height - img.naturalWidth / img.naturalHeight,
          );
        }),
      ).toBeLessThan(0.01);
      await expect(
        panel.getByRole('link', { name: /Open full screenshot/ }),
      ).toHaveAttribute('href', /recon-desk-reconcile-suggestions\.png$/);
    });
  }
}

test('comparison scenarios, inclusive tolerance, invalid input and reset', async ({
  page,
}) => {
  await page.goto('/');
  const amount = page.getByLabel('New amount for SKU 002');
  const tolerance = page.getByLabel('Allow a difference up to');
  await expect(page.locator('#result-title')).toHaveText('1 changed record');
  await page.getByRole('button', { name: 'Rows shuffled' }).click();
  await expect(page.locator('#result-title')).toHaveText(
    'Same records. Zero changes.',
  );
  await expect(amount).toBeDisabled();
  await expect(tolerance).toBeDisabled();
  await expect(page.locator('#after-rows tr').first()).toContainText('003');
  await page.getByRole('button', { name: 'A duplicate key' }).click();
  await expect(page.locator('#after-rows .row-problem')).toHaveCount(2);
  await expect(page.locator('#result-title')).toContainText('ambiguous key');
  await page.getByRole('button', { name: 'A price changed' }).click();
  await amount.fill('950.01');
  await tolerance.focus();
  await tolerance.press('End');
  await expect(page.locator('#tolerance-value')).toHaveText('₹100');
  await expect(page.locator('#result-title')).toHaveText('1 changed record');
  await amount.fill('950');
  await expect(page.locator('#result-title')).toHaveText(
    'Within your rules. All clear.',
  );
  const lastValid = await page.locator('#after-rows').innerText();
  await amount.fill('');
  await expect(amount).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#input-error')).toContainText('Enter an amount');
  await expect
    .poll(() => page.locator('#after-rows').innerText())
    .toBe(lastValid);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(amount).toHaveValue('920');
  await expect(amount).toHaveAttribute('aria-invalid', 'false');
  await expect(tolerance).toHaveValue('0');
  await expect(page.locator('#result-title')).toHaveText('1 changed record');
  await expect(page.locator('#before-rows')).toContainText('850.00');
});

test('theme preference survives reload and navigation between editions', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.theme-toggle:visible').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/work/recon-desk');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.theme-toggle:visible').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('ankit-theme')))
    .toBe('light');
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('puzzle fire, mirror keyboard control, undo, reset and saved progress', async ({
  page,
}) => {
  await page.goto('/play');
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const reset = page.getByRole('button', { name: 'Reset', exact: true });
  const mirror = page.getByRole('button', { name: /^Mirror,/ });
  await expect(undo).toBeDisabled();
  await expect(reset).toBeDisabled();
  await page.getByRole('button', { name: /^Fire the beam from/ }).click();
  await expect(page.getByRole('status')).toContainText('Blocked by a wall');
  await expect(reset).toBeEnabled();
  await expect(undo).toBeDisabled();
  await reset.click();
  await expect(page.locator('.rc-beam')).toHaveCount(0);
  await mirror.focus();
  await mirror.press('Space');
  await expect(mirror).toHaveAccessibleName(/backward/);
  await undo.click();
  await expect(mirror).toHaveAccessibleName(/forward/);
  await expect(undo).toBeDisabled();
  await mirror.click();
  await page.getByRole('button', { name: 'Fire', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Hit the target');
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('ricochet-solved'))),
    )
    .toEqual(['first-bounce']);
  await page.getByRole('button', { name: 'Next lesson' }).click();
  await expect(page.locator('.ricochet-level-heading h2')).toHaveText(
    'Two turns',
  );
  await expect(page.locator('.ricochet-level-heading h2')).toBeFocused();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Lesson 1, First bounce, solved' }),
  ).toBeVisible();
});

test('generated links hydrate, clipboard fallback shares, and mode preferences persist', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: () =>
          Promise.reject(new Error('Clipboard blocked for test')),
      },
      configurable: true,
    });
  });
  await page.goto('/play?seed=ABC123&d=easy');
  await expect(page.locator('.ricochet-level-heading')).toContainText(
    'RANDOM · EASY · SEED ABC123',
  );
  await page.getByRole('button', { name: 'Copy link' }).click();
  const share = page.getByLabel('Copy this link');
  await expect(share).toBeVisible();
  const url = await share.inputValue();
  expect(new URL(url).searchParams.has('l')).toBe(true);
  await page.goto(url);
  await expect(page.locator('.ricochet-level-heading h2')).toHaveText(
    'Shared puzzle',
  );
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(page).toHaveURL(/mode=today/);
  await expect(page.locator('.ricochet-level-heading')).toContainText(
    'PUZZLE OF THE DAY',
  );
  await page.goto('/play');
  await expect(
    page.getByRole('button', { name: 'Today', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('header navigation and phone menu close on Escape, outside click and selection', async ({
  page,
}, testInfo) => {
  await page.goto('/work/recon-desk');
  if (testInfo.project.name === 'phone') {
    const menu = page.locator('.mobile-navigation');
    const summary = menu.locator('summary');
    await summary.click();
    await expect(menu).toHaveAttribute('open', '');
    await summary.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    await summary.click();
    await page.getByRole('heading', { level: 1 }).click();
    await expect(menu).not.toHaveAttribute('open', '');
    await summary.click();
    await menu.getByRole('link', { name: 'Say hello' }).click();
    await expect(menu).not.toHaveAttribute('open', '');
  } else {
    await page
      .locator('.desktop-navigation')
      .getByRole('link', { name: 'Say hello' })
      .click();
  }
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator('#contact')).toBeInViewport();
  await page
    .locator('.project-nav')
    .getByRole('link', { name: /Next/ })
    .click();
  await expect(page).toHaveURL(/\/work\/operations\/?$/);
  await page.getByRole('link', { name: 'Back to selected work' }).click();
  await expect(page).toHaveURL('/#work');
});
