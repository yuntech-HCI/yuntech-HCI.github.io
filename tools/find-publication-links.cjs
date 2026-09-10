const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'content/lab.json'), 'utf8'));

function titleFrom(text) {
  return text.match(/[“"]([^”"]+)[”"]/)?.[1]?.trim().replace(/[，,]\s*$/, '') || '';
}

function normalize(value) {
  return value.toLowerCase()
    .normalize('NFKD')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ')
    .trim();
}

function similarity(a, b) {
  a = normalize(a); b = normalize(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const grams = value => {
    const set = new Set();
    const compact = value.replace(/\s/g, '');
    for (let i = 0; i < compact.length - 2; i++) set.add(compact.slice(i, i + 3));
    return set;
  };
  const x = grams(a), y = grams(b);
  const overlap = [...x].filter(value => y.has(value)).length;
  return (2 * overlap) / (x.size + y.size || 1);
}

function citedYear(text) {
  const years = [...text.matchAll(/(?:19|20)\d{2}/g)].map(match => Number(match[0]));
  return years.at(-1);
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function lookup(item, index) {
  const title = titleFrom(item.text);
  if (!title || /[\u3400-\u9fff]/.test(title)) return { index, title, status: 'skipped' };
  const url = `https://api.crossref.org/works?query.title=${encodeURIComponent(title)}&rows=5&select=DOI,title,author,published,URL,type,publisher`;
  let response;
  for (let attempt = 0; attempt < 4; attempt++) {
    response = await fetch(url, { headers: { 'User-Agent': 'YunTech-HCI-LAB-site-maintenance/1.0 (mailto:chihwei.shiu@gmail.com)' } });
    if (response.status !== 429) break;
    await wait(1200 * (attempt + 1));
  }
  if (!response.ok) return { index, title, status: `http-${response.status}` };
  const candidates = (await response.json()).message.items.map(record => {
    const foundTitle = record.title?.[0] || '';
    const score = similarity(title, foundTitle);
    const year = record.published?.['date-parts']?.[0]?.[0];
    return { doi: record.DOI, url: `https://doi.org/${record.DOI}`, foundTitle, score, year, citedYear: citedYear(item.text), authors: (record.author || []).map(a => `${a.given || ''} ${a.family || ''}`.trim()).join('; '), publisher: record.publisher };
  }).sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const yearMatches = !best?.citedYear || !best?.year || Math.abs(best.citedYear - best.year) <= 1;
  return { index, group: item.group, title, status: best && best.score >= .88 && yearMatches ? 'matched' : 'review', best, alternatives: candidates.slice(1, 3) };
}

(async () => {
  const results = [];
  for (let index = 0; index < data.publications.length; index++) {
    results.push(await lookup(data.publications[index], index));
    await wait(180);
  }
  const out = path.join(__dirname, 'publication-link-review.json');
  fs.writeFileSync(out, JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify({ matched: results.filter(r => r.status === 'matched').length, review: results.filter(r => r.status === 'review').length, skipped: results.filter(r => r.status === 'skipped').length, file: out }, null, 2));
  for (const result of results.filter(r => r.status === 'matched')) console.log(`${result.index}\t${result.best.score.toFixed(3)}\t${result.best.url}\t${result.title}`);
})();
