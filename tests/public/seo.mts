import assert from 'node:assert/strict';

// Prueba de integración local: nunca visitar producción desde esta batería.
const origin = process.env.PUBLIC_TEST_ORIGIN ?? 'http://localhost:3000';
const canonicalOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname));

for (const locale of ['es', 'en']) {
  const response = await fetch(`${origin}/${locale}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('set-cookie'), null);
  const html = await response.text();
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
  assert.match(html, /name="robots" content="[^"]*noindex/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:image"/);
  assert.ok(html.includes(`rel="canonical" href="${canonicalOrigin}/${locale}"`));
  for (const language of ['es', 'en', 'x-default']) {
    assert.ok(html.includes(`hrefLang="${language}"`));
  }
  console.log(`${locale}: 200, no cookies, h1, noindex, canonical, hreflang, sharing`);
}
const robots = await (await fetch(`${origin}/robots.txt`)).text();
assert.match(robots, /Disallow: \//);
assert.doesNotMatch(robots, /Sitemap:/);
const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
assert.doesNotMatch(sitemap, /<loc>/);
console.log('Local robots and sitemap: blocked, no indexed URLs');
