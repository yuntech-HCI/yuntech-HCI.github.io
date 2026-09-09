const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.join(__dirname, '..');
(async () => {
  const out = path.join(root, 'assets');
  fs.mkdirSync(path.join(out, 'icons'), { recursive: true });
  fs.mkdirSync(path.join(out, 'members'), { recursive: true });
  const hero = process.argv[2];
  if (hero) {
    await sharp(hero).resize({ width: 1672 }).webp({ quality: 85 }).toFile(path.join(out, 'hero.webp'));
    await sharp(hero).resize({ width: 960 }).webp({ quality: 80 }).toFile(path.join(out, 'hero-small.webp'));
    await sharp(hero).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 88 }).toFile(path.join(out, 'social-cover.jpg'));
  }
  const data = JSON.parse(fs.readFileSync(path.join(root, 'content/lab.json')));
  for (const m of data.members.filter(m => m.image)) {
    await sharp(path.join(root, m.image)).rotate().resize({ width: 560, withoutEnlargement: true }).webp({ quality: 83 }).toFile(path.join(out, 'members', `${m.id}.webp`));
  }
  for (const name of ['arrow-up-right', 'arrow-right', 'arrow-down', 'arrow-left', 'list', 'x-lg', 'search', 'envelope', 'plus-lg']) {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.4/icons/${name}.svg`);
    if (!res.ok) throw new Error(`Icon download failed: ${name}`);
    fs.writeFileSync(path.join(out, 'icons', `${name}.svg`), Buffer.from(await res.arrayBuffer()));
  }
  const license = await fetch('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.4/LICENSE.md');
  if (!license.ok) throw new Error('Icon license unavailable');
  fs.writeFileSync(path.join(out, 'icons/LICENSE'), await license.text());
  console.log('Hero, social image, portraits and local icons ready.');
})();
