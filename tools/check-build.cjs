const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'content/lab.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);

assert.match(data.updated, /^\d{4}-\d{2}-\d{2}$/);
assert.equal(new Set(data.members.map(member => member.id)).size, data.members.length, 'Member IDs must be unique');
assert.equal(html.includes('undefined'), false, 'Generated HTML contains undefined data');
assert.equal(html.includes(`datetime="${data.updated}"`), true, 'Footer update date is stale');
assert.equal(sitemap.includes(`<lastmod>${data.updated}</lastmod>`), true, 'Sitemap update date is stale');

for (const member of data.members) {
  assert.equal(html.includes(`id="${member.id}"`), true, `Missing member in HTML: ${member.id}`);
  if (!member.image) continue;
  assert.equal(fs.existsSync(path.join(root, member.image)), true, `Missing member source image: ${member.image}`);
  assert.equal(fs.existsSync(path.join(root, 'assets/members', `${member.id}.webp`)), true, `Missing optimized portrait: ${member.id}.webp`);
}

for (const item of data.publications) {
  const title = item.text.match(/[“"]([^”"]+)[”"]/)?.[1]?.trim().replace(/[，,]\s*$/, '');
  assert.equal(Boolean(title && html.includes(escapeHtml(title))), true, `Missing publication in HTML: ${title || item.text}`);
}

for (const asset of ['styles.css', 'app.js', 'robots.txt', 'assets/hero.webp', 'assets/social-cover.jpg']) {
  assert.equal(fs.existsSync(path.join(root, asset)), true, `Missing deploy asset: ${asset}`);
}

console.log(`Static build verified: ${data.members.length} members, ${data.publications.length} publications.`);
