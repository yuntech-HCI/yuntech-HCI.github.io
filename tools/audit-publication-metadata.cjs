const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'content/lab.json'), 'utf8'));
const links = JSON.parse(fs.readFileSync(path.join(root, 'content/publication-links.json'), 'utf8'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function titleFrom(text) {
  return text.match(/[“"]([^”"]+)[”"]/)?.[1]?.trim().replace(/[，,]\s*$/, '') || '';
}

function normalize(value = '') {
  return value.toLowerCase().normalize('NFKD').replace(/&/g, ' and ').replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ').trim();
}

function similarity(left, right) {
  left = normalize(left).replace(/\s/g, '');
  right = normalize(right).replace(/\s/g, '');
  if (!left || !right) return 0;
  if (left === right) return 1;
  const grams = value => new Set([...Array(Math.max(0, value.length - 2))].map((_, index) => value.slice(index, index + 3)));
  const a = grams(left), b = grams(right);
  const overlap = [...a].filter(value => b.has(value)).length;
  return (2 * overlap) / (a.size + b.size || 1);
}

async function getJson(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': 'YunTech-HCI-LAB-site-maintenance/1.0 (mailto:chihwei.shiu@gmail.com)' } });
    if (response.ok) return response.json();
    if (response.status !== 429) throw new Error(`${response.status} ${url}`);
    await sleep(1000 * (attempt + 1));
  }
  throw new Error(`Crossref rate limit: ${url}`);
}

function summarize(record) {
  return {
    title: record.title?.[0],
    container: record['container-title']?.[0],
    volume: record.volume || null,
    issue: record.issue || null,
    page: record.page || null,
    articleNumber: record['article-number'] || null,
    year: record.published?.['date-parts']?.[0]?.[0] || null,
    month: record.published?.['date-parts']?.[0]?.[1] || null,
    publisher: record.publisher || null,
    type: record.type || null,
    doi: record.DOI || null,
    authors: (record.author || []).map(author => `${author.given || ''} ${author.family || ''}`.trim())
  };
}

(async () => {
  const results = [];
  for (let index = 0; index < data.publications.length; index++) {
    const item = data.publications[index];
    const title = titleFrom(item.text);
    const linked = links[title]?.url || '';
    const doi = linked.match(/doi\.org\/(.+)$/i)?.[1];
    let candidates = [];
    try {
      if (doi) {
        candidates = [(await getJson(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)).message];
      } else if (title && !/[\u3400-\u9fff]/.test(title)) {
        const response = await getJson(`https://api.crossref.org/works?query.title=${encodeURIComponent(title)}&rows=5`);
        candidates = response.message.items;
      }
    } catch (error) {
      results.push({ number: index + 1, group: item.group, title, error: error.message });
      continue;
    }
    const ranked = candidates.map(record => ({ score: similarity(title, record.title?.[0]), ...summarize(record) })).sort((a, b) => b.score - a.score);
    results.push({ number: index + 1, group: item.group, title, linked, current: item.text, best: ranked[0] || null, alternatives: ranked.slice(1, 3) });
    await sleep(140);
  }
  const output = path.join(__dirname, 'publication-metadata-audit.json');
  fs.writeFileSync(output, JSON.stringify(results, null, 2) + '\n');
  console.log(`Wrote ${results.length} records to ${output}`);
  for (const result of results) {
    const best = result.best;
    console.log([result.number, best?.score?.toFixed(3) || '-', best?.doi || '-', best?.volume || '-', best?.issue || '-', best?.page || best?.articleNumber || '-', result.title].join('\t'));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
