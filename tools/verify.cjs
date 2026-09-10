const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const output = process.env.LAB_QA_DIR || path.join(root, '../redesign-preview');
const url = pathToFileURL(path.join(root, 'index.html')).href;
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://www.google.com/maps/**', route => route.fulfill({ contentType: 'text/html', body: '<html lang="zh-TW"><body style="background:#e9eee7;color:#626b65;font:14px Arial;padding:30px">Google Maps</body></html>' }));
    await page.goto(url);
    assert.equal(await page.locator('.menu-toggle').isVisible(), false);
    await page.screenshot({ path: path.join(output, 'desktop.png') });
    await page.evaluate(async () => {
      const images = [...document.images].filter(image => image.getAttribute('src'));
      images.forEach(image => { image.loading = 'eager'; });
      await Promise.all(images.map(image => image.decode()));
    });
    await page.screenshot({ path: path.join(output, 'desktop-full.png'), fullPage: true });
    await page.locator('#works').screenshot({ path: path.join(output, 'works.png') });
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.record-link').count(), 26);
    assert.equal(await page.locator('#WangCE .english-name').textContent(), 'Chia-En Wang');
    assert.equal(await page.locator('.member:visible').first().getAttribute('id'), 'WangCE');
    assert.equal(await page.locator('.member:visible').count(), 10);
    await page.locator('[data-filter="alumni"]').click();
    assert.equal(await page.locator('.member:visible').count(), 4);
    await page.locator('[data-filter="all"]').click();
    assert.equal(await page.locator('.member:visible').count(), 14);
    await page.locator('[data-filter="graduate"]').click();
    await page.locator('#members').screenshot({ path: path.join(output, 'members.png') });
    await page.locator('[data-research="projects"]').click();
    await page.locator('#research-search').fill('媽祖');
    assert.equal(await page.locator('.record:visible').count(), 1);
    await page.locator('#research-search').fill('nomatch-xyz-987');
    assert.equal(await page.locator('.empty-results').isVisible(), true);
    await page.locator('#research-search').fill('');
    await page.locator('[data-research="awards"]').click();
    await page.locator('#research-search').fill('王家恩');
    assert.equal(await page.locator('.record:visible').count(), 1);
    await page.locator('#research-search').fill('');
    await page.locator('[data-research="publications"]').click();
    const journalGroup = page.locator('#panel-publications .record-group').nth(1);
    await journalGroup.evaluate(element => { element.open = true; });
    assert.deepEqual(await journalGroup.locator('.record-link-type').allTextContents(), ['ARTICLE', 'DOI', 'DOI', 'DOI', 'DOI', 'DOI', 'DOI', 'DOI', 'DOI', 'ISSUE', 'ISSUE', 'PDF', 'DOI', 'DOI', 'DOI', 'ARTICLE']);
    for (const href of [
      'https://www.sciencedirect.com/science/article/pii/S0164121209001204',
      'http://www.ijicic.org/vol-9(2).htm',
      'http://www.ijicic.org/vol-7(9).htm',
      'http://www.ijicic.org/09-1006-1.pdf'
    ]) assert.equal(await journalGroup.locator(`a[href="${href}"]`).count(), 1);
    assert.equal(await journalGroup.getByText('vol. 7, no. 2, pp. 733-743', { exact: false }).count(), 1);
    await journalGroup.screenshot({ path: path.join(output, 'journal-links-desktop.png') });
    await page.locator('[data-level="bachelor"]').click();
    assert.equal(await page.locator('#bachelor').isVisible(), true);
    assert.equal(await page.locator('#graduate').isVisible(), false);
    assert.equal(await page.locator('#bachelor .course-semester').first().locator('summary').textContent().then(text => text.includes('115-1')), true);
    assert.equal(await page.locator('#bachelor .course-semester').first().locator('a').count(), 3);
    await page.locator('[data-level="graduate"]').click();
    assert.equal(await page.locator('#graduate .course-semester').first().locator('summary').textContent().then(text => text.includes('115-1')), true);
    assert.equal(await page.locator('#graduate .course-semester').first().locator('a').count(), 1);
    await page.locator('[data-work-index="0"]').click();
    assert.equal(await page.locator('dialog').isVisible(), true);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.lightbox-counter').textContent(), '02 / 07');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').isVisible(), false);
    await page.evaluate(() => { location.hash = 'LinKW'; });
    await page.waitForFunction(() => !document.querySelector('#LinKW').hidden);
    assert.equal(await page.locator('#LinKW').isVisible(), true);
    await page.evaluate(() => { location.hash = 'graduate'; });
    await page.waitForFunction(() => !document.querySelector('#graduate').hidden);
    const semantics = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
      return {
        duplicateIds: ids.filter((id, i) => ids.indexOf(id) !== i),
        deadAnchors: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(href => !document.getElementById(href.slice(1))),
        missingAlts: document.querySelectorAll('img:not([alt])').length,
        schema: JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'].length,
        brokenImages: [...document.images].filter(img => img.getAttribute('src') && img.complete && !img.naturalWidth).map(img => img.getAttribute('src'))
      };
    });
    assert.deepEqual(semantics.duplicateIds, []);
    assert.deepEqual(semantics.deadAnchors, []);
    assert.equal(semantics.missingAlts, 0);
    assert.deepEqual(semantics.brokenImages, []);
    const layouts = [];
    for (const [width, height] of [[1920,1080],[1440,900],[1024,768],[768,1024],[390,844],[320,740]]) {
      await page.setViewportSize({ width, height });
      await page.goto(url);
      const logo = await page.locator('.brand-glyph').evaluate(element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = range.getBoundingClientRect();
        const bounds = element.getBoundingClientRect();
        const header = document.querySelector('.site-header').getBoundingClientRect();
        const name = element.nextElementSibling.getBoundingClientRect();
        return {
          lines: range.getClientRects().length,
          fits: text.left >= bounds.left && text.right <= bounds.right + 1 && text.top >= bounds.top && text.bottom <= bounds.bottom,
          containedByHeader: bounds.top >= header.top && bounds.bottom <= header.bottom,
          separatedFromName: bounds.right < name.left
        };
      });
      assert.equal(logo.lines, 1, `Logo wraps at ${width}px`);
      assert.equal(logo.fits && logo.containedByHeader && logo.separatedFromName, true, `Logo escapes its layout at ${width}px`);
      const result = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflow: [...document.querySelectorAll('main *, header *')].filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && getComputedStyle(el).position !== 'absolute' && (rect.right > innerWidth + 1 || rect.left < -1);
      }).map(el => `${el.tagName}.${el.className}`).slice(0, 12) }));
      layouts.push(result);
      assert.equal(result.scrollWidth <= width, true, `Horizontal overflow at ${width}`);
      assert.deepEqual(result.overflow, [], `Element overflow at ${width}`);
      if (width === 390 || width === 320) {
        if (width === 390) {
          await page.locator('[data-research="publications"]').click();
          const mobileJournal = page.locator('#panel-publications .record-group').nth(1);
          await mobileJournal.evaluate(element => { element.open = true; });
          await mobileJournal.screenshot({ path: path.join(output, 'journal-links-mobile.png') });
        }
        await page.screenshot({ path: path.join(output, `mobile-${width}.png`) });
        await page.locator('.menu-toggle').click();
        assert.equal(await page.locator('#primary-nav').isVisible(), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#primary-nav').isVisible(), false);
        await page.locator('#members').screenshot({ path: path.join(output, `members-${width}.png`) });
      }
    }
    const nojs = await browser.newPage({ javaScriptEnabled: false });
    await nojs.route('https://www.google.com/**', route => route.abort());
    await nojs.goto(url);
    assert.equal(await nojs.locator('.member:visible').count(), 14);
    assert.equal(await nojs.locator('.research-panel:visible').count(), 3);
    assert.equal(await nojs.locator('.course-level:visible').count(), 2);
    assert.equal(await nojs.locator('#primary-nav').isVisible(), true);
    const content = JSON.parse(fs.readFileSync(path.join(root, 'content/lab.json')));
    assert.equal(await nojs.locator('.record').count(), content.publications.length + content.projects.length + content.awards.length);
    const reduced = await browser.newPage({ reducedMotion: 'reduce' });
    await reduced.route('https://www.google.com/**', route => route.abort());
    await reduced.goto(url);
    assert.equal(await reduced.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
    assert.deepEqual(errors, []);
    const result = { passed: true, semantics, layouts, errors, output, checks: ['member filters', 'newest member', 'research search', 'empty state', 'courses', 'lightbox and keyboard', 'legacy deep links', 'mobile navigation', 'no-JavaScript content', 'reduced motion'] };
    fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
})();
