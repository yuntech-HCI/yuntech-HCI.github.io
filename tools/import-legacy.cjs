const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

// One-time migration uses the browser's HTML parser to retain the original records.
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    await page.setContent(fs.readFileSync(process.argv[2], 'utf8'), { waitUntil: 'domcontentloaded' });
    const data = await page.evaluate(() => {
      const clean = value => value.replace(/\s+/g, ' ').trim();
      const cards = [...document.querySelectorAll('.member-card:not(.recruit-card)')];
      const alumni = ['HeTY', 'TianQH', 'LinXK', 'LinKW'];
      const members = cards.map(card => {
        const id = card.closest('[id]')?.id || 'ShiuCW';
        const name = clean(card.querySelector('.card-header').textContent);
        return {
          id, name,
          group: card.classList.contains('lead-card') ? 'pi' : alumni.includes(id) ? 'alumni' : 'graduate',
          image: card.querySelector('img')?.getAttribute('src') || null,
          paragraphs: [...card.querySelectorAll('.card-body p')].filter(p => !p.querySelector('a')).map(p => clean(p.innerText)),
          email: card.querySelector('a[href^="mailto:"]')?.getAttribute('href').slice(7)
        };
      });
      const headings = [...document.querySelectorAll('h2')];
      const records = title => {
        let group = title;
        return [...headings.find(h => h.textContent.trim() === title).nextElementSibling.children].flatMap(el => {
          if (el.tagName === 'P') { group = clean(el.textContent).replace(/--/g, ''); return []; }
          return el.tagName === 'LI' ? [{ group, text: clean(el.textContent) }] : [];
        });
      };
      const semesters = [...document.querySelectorAll('h5')].filter(h => h.textContent.includes('學期'));
      const bachelor = document.getElementById('bachelor');
      const courses = semesters.flatMap(h => {
        const level = h.compareDocumentPosition(bachelor) & Node.DOCUMENT_POSITION_FOLLOWING ? 'graduate' : 'bachelor';
        const result = [];
        for (let a = h.nextElementSibling; a?.tagName === 'A'; a = a.nextElementSibling) {
          result.push({ level, semester: clean(h.textContent), name: clean(a.textContent), url: a.getAttribute('href') === '#' ? null : a.getAttribute('href') });
        }
        return result;
      });
      return {
        updated: '2026-09-09', members,
        publications: records('學術論文'), projects: records('執行計畫狀況'), awards: records('指導得獎'), courses,
        map: document.querySelector('iframe').getAttribute('src'),
        works: [...document.querySelectorAll('.carousel-item')].map((el, i) => ({ id: i + 1, title: clean(el.querySelector('h5').textContent), image: el.querySelector('img').getAttribute('src'), alt: el.querySelector('img').alt }))
      };
    });
    fs.mkdirSync(path.join(__dirname, '../content'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, '../content/lab.json'), JSON.stringify(data, null, 2) + '\n');
    console.log(JSON.stringify(Object.fromEntries(Object.entries(data).filter(([, v]) => Array.isArray(v)).map(([k,v]) => [k,v.length]))));
  } finally { await browser.close(); }
})();
