import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Playwright puede instalarse en una carpeta temporal, sin cambiar package.json.
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const origin = process.env.PUBLIC_TEST_ORIGIN ?? 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname));
const destination = 'docs/evidencia/logo-web';
mkdirSync(destination, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [320, 375, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const locale of ['es', 'en']) {
      const response = await page.goto(`${origin}/${locale}`, {
        waitUntil: 'networkidle',
      });
      assert.equal(response.status(), 200);
      await page.locator('img').evaluateAll(async (images) => {
        await Promise.all(images.map(async (image) => {
          image.loading = 'eager';
          await image.decode();
        }));
      });
      const metrics = await page.evaluate(() => ({
        viewport: innerWidth,
        content: document.documentElement.scrollWidth,
        headerHeight: document.querySelector('header').getBoundingClientRect().height,
        h1: document.querySelector('h1').textContent,
        brokenImages: [...document.images].filter((image) => !image.complete || !image.naturalWidth).length,
        logoRatio: (() => {
          const rect = document.querySelector('header img').getBoundingClientRect();
          return rect.width / rect.height;
        })(),
      }));
      const expected = JSON.parse(readFileSync(`messages/home/${locale}.json`, 'utf8'));
      assert.equal(metrics.h1, expected.Home.title, 'Preview must use the current translation');
      assert.ok(!(await page.locator('body').innerText()).includes('Nav.howItWorks'));
      assert.ok(metrics.content <= width, `Overflow at ${width}: ${metrics.content}`);
      assert.equal(metrics.brokenImages, 0);
      assert.ok(Math.abs(metrics.logoRatio - 744 / 200) < 0.03);
      const faq = page.locator('details').first();
      await faq.locator('summary').click();
      assert.equal(await faq.getAttribute('open'), '');
      await faq.locator('summary').click();
      await page.evaluate(() => scrollTo(0, 0));
      if ([375, 1440].includes(width)) {
        await page.screenshot({ path: `${destination}/home-${locale}-${width}.png` });
        await page.locator('#home-value').screenshot({ path: `${destination}/value-${locale}-${width}.png` });
      }
      results.push({ locale, width, ...metrics });
      const list = locale === 'es' ? 'ofertas' : 'jobs';
      const listing = await page.goto(`${origin}/${locale}/${list}`, { waitUntil: 'networkidle' });
      assert.equal(listing.status(), 200);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  writeFileSync(`${destination}/responsive.json`, JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
