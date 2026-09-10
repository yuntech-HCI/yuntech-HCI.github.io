import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(await readFile(path.join(root, 'content/lab.json'), 'utf8'));
const publicationLinks = JSON.parse(await readFile(path.join(root, 'content/publication-links.json'), 'utf8'));
const styleVersion = createHash('sha256').update(await readFile(path.join(root, 'styles.css'))).digest('hex').slice(0, 12);
const scriptVersion = createHash('sha256').update(await readFile(path.join(root, 'app.js'))).digest('hex').slice(0, 12);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, cls = '') => `<img class="icon ${cls}" src="assets/icons/${name}.svg" width="20" height="20" alt="" aria-hidden="true">`;
const external = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}${icon('arrow-up-right')}</a>`;
const heading = (n, en, zh, extra = '') => `<div class="section-heading"><div><p class="eyebrow"><span>${n}</span> / ${en}</p><h2>${zh}</h2></div>${extra}</div>`;
const base = 'https://yuntech-hci.github.io/';
const title = 'YunTech HCI LAB 雲科大人機互動實驗室｜遊戲設計、VR／AR 與互動研究';
const description = '國立雲林科技大學數位媒體設計學系人機互動實驗室，由許志維主持。探索遊戲設計、VR／AR、機電整合與資訊安全，了解研究成果、實驗室成員、課程與合作資訊。';
const pi = data.members.find(m => m.group === 'pi');

function publicationTitle(text) {
  return text.match(/[“"]([^”"]+)[”"]/)?.[1]?.trim().replace(/[，,]\s*$/, '') || '';
}

function member(m) {
  const chinese = m.name.match(/[\u3400-\u9fff]+/g)?.join('') || m.name;
  const english = m.name.replace(/[\u3400-\u9fff]/g, '').trim();
  const p = m.paragraphs;
  const skills = p.find(t => t.startsWith('專長：'))?.replace('專長：', '') || '';
  const thesis = p.find(t => t.includes('論文題目：'));
  return `<article class="member" id="${m.id}" data-group="${m.group}">
    <div class="portrait">${m.image ? `<img src="assets/members/${m.id}.webp" width="560" height="660" alt="${esc(m.name)}" loading="lazy" decoding="async">` : `<div class="portrait-placeholder" aria-label="${esc(chinese)}，尚無照片">${esc(english.split(/\s+/).map(part => part[0]).join('').slice(0, 2))}<span>HCI LAB</span></div>`}</div>
    <div class="member-meta"><p class="mono">${esc(p[0])}</p><h3>${esc(chinese)}</h3><p class="english-name" lang="en">${esc(english)}</p><p class="skills">${esc(skills)}</p>${thesis ? `<details class="thesis"><summary>論文研究${icon('plus-lg')}</summary><p>${esc(thesis)}</p></details>` : ''}<a class="member-email" href="mailto:${esc(m.email)}">${icon('envelope')}<span>${esc(m.email)}</span></a></div>
  </article>`;
}
function researchGroup(key, label) {
  const order = ['學術國際研討會論文', '學術國際期刊', '學術國內研討會論文', '電腦專書'];
  const grouped = [...Map.groupBy(data[key], item => item.group)];
  if (key === 'publications') grouped.sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
  return `<div class="research-panel" id="panel-${key}" data-research-panel="${key}"><h3 class="panel-heading">${label}</h3>${[...grouped].map(([group, items], i) => `<details class="record-group" ${i === 0 ? 'open' : ''}><summary><span>${esc(group)}</span><span class="summary-count">${items.length}${icon('plus-lg')}</span></summary><ol>${items.map((item, j) => { const link = key === 'publications' ? publicationLinks[publicationTitle(item.text)] : null; return `<li class="record${link ? ' has-link' : ''}"><span class="record-number" aria-hidden="true">${String(j + 1).padStart(2, '0')}</span><p>${esc(item.text)}</p>${link ? `<a class="record-link" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" aria-label="開啟「${esc(publicationTitle(item.text))}」${esc(link.label)}"><span class="record-link-copy"><span class="record-link-kicker">OPEN</span><span class="record-link-type">${esc(link.label)}</span></span>${icon('arrow-up-right')}</a>` : ''}</li>`; }).join('')}</ol></details>`).join('')}</div>`;
}
function courseLevel(level, label) {
  const records = data.courses.filter(c => c.level === level);
  const grouped = Map.groupBy(records, c => c.semester);
  return `<div class="course-level" id="${level}" data-course-panel="${level}"><h3>${label}</h3>${[...grouped].map(([semester, courses], i) => `<details class="course-semester" ${i < 2 ? 'open' : ''}><summary>${esc(semester)}${icon('plus-lg')}</summary><ul>${courses.map(c => `<li>${c.url ? external(c.url, c.name) : `<span>${esc(c.name)}</span><span class="muted mono">課綱尚未提供</span>`}</li>`).join('')}</ul></details>`).join('')}</div>`;
}
const schema = {
  '@context': 'https://schema.org', '@graph': [
    { '@type': 'ResearchOrganization', '@id': `${base}#organization`, name: 'YunTech HCI LAB 人機互動實驗室', alternateName: '國立雲林科技大學數位媒體設計學系 人機互動實驗室', url: base, logo: `${base}img/hciLABLOGO.png`, email: pi.email, telephone: '+886-5-5342601 ext. 6502', parentOrganization: { '@type': 'CollegeOrUniversity', name: '國立雲林科技大學 National Yunlin University of Science and Technology' }, address: { '@type': 'PostalAddress', streetAddress: '大學路三段123號', addressLocality: '斗六市', addressRegion: '雲林縣', addressCountry: 'TW' }, member: { '@id': `${base}#ShiuCW` }, knowsAbout: ['人機互動', '遊戲設計', '虛擬實境', '擴增實境', '機電整合', '資訊安全', '可逆式資訊隱藏'] },
    { '@type': 'WebSite', '@id': `${base}#website`, name: 'YunTech HCI LAB', url: base, inLanguage: 'zh-TW', publisher: { '@id': `${base}#organization` } },
    { '@type': 'WebPage', '@id': `${base}#webpage`, url: base, name: title, description, inLanguage: 'zh-TW', dateModified: data.updated, isPartOf: { '@id': `${base}#website` }, about: { '@id': `${base}#organization` }, primaryImageOfPage: { '@type': 'ImageObject', url: `${base}assets/social-cover.jpg`, width: 1200, height: 630 } },
    { '@type': 'Person', '@id': `${base}#ShiuCW`, name: '許志維', alternateName: 'Chih-Wei Shiu', jobTitle: '實驗室主持人', email: pi.email, image: `${base}assets/members/ShiuCW.webp`, worksFor: { '@id': `${base}#organization` } }
  ]
};
const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="author" content="Chih-Wei Shiu 許志維">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#f4f6f3">
  <link rel="canonical" href="${base}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="YunTech HCI LAB">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${base}">
  <meta property="og:locale" content="zh_TW">
  <meta property="og:image" content="${base}assets/social-cover.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="YunTech HCI LAB 人與數位互動概念視覺">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${base}assets/social-cover.jpg">
  <meta name="twitter:image:alt" content="YunTech HCI LAB 人與數位互動概念視覺">
  <link rel="icon" type="image/png" href="img/hciLABLOGOs.png">
  <link rel="preload" as="image" href="assets/hero.webp" imagesrcset="assets/hero-small.webp 960w, assets/hero.webp 1672w" imagesizes="100vw" fetchpriority="high">
  <link rel="stylesheet" href="styles.css?v=${styleVersion}">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
  <script src="app.js?v=${scriptVersion}" defer></script>
</head>
<body>
<a class="skip-link" href="#main">跳至主要內容</a>
<header class="site-header">
  <div class="nav-wrap">
    <a class="wordmark" href="#home" aria-label="YunTech HCI LAB 首頁"><span class="brand-glyph" aria-hidden="true">hci</span><span>YunTech<span>HCI LAB</span></span></a>
    <button class="menu-toggle icon-button" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="開啟導覽選單" title="導覽選單" hidden>${icon('list')}</button>
    <nav id="primary-nav" aria-label="主要導覽"><a href="#about">關於實驗室</a><a href="#works">實作探索</a><a href="#members">實驗室成員</a><a href="#research">研究成果</a><a href="#courses">課程</a><a class="nav-contact" href="#contact">聯絡我們${icon('arrow-up-right')}</a></nav>
  </div>
</header>
<main id="main">
  <section class="hero" id="home" aria-labelledby="hero-title">
    <img class="hero-art" src="assets/hero.webp" srcset="assets/hero-small.webp 960w, assets/hero.webp 1672w" sizes="100vw" width="1672" height="941" alt="玻璃手掌與金屬網格交織的人機互動概念視覺" fetchpriority="high">
    <div class="hero-inner wrap">
      <p class="eyebrow hero-eyebrow"><span class="status-mark" aria-hidden="true"></span> HUMAN–COMPUTER INTERACTION</p>
      <h1 id="hero-title"><span class="hero-university">YunTech</span>HCI LAB<span class="hero-chinese">人機互動實驗室</span></h1>
      <p class="hero-message">讓想像，成為可互動的未來。</p>
      <p class="hero-description">從遊戲、虛擬實境到人機互動，<br>我們以設計的溫度，探索科技的下一種可能。</p>
      <div class="hero-actions"><a class="button button-dark" href="#works">探索實作${icon('arrow-up-right')}</a><a class="text-link" href="#about">認識實驗室${icon('arrow-right')}</a></div>
    </div>
    <div class="hero-bottom wrap"><p>國立雲林科技大學<span>數位媒體設計學系</span></p><a href="#about" aria-label="向下閱讀關於實驗室">SCROLL TO EXPLORE${icon('arrow-down')}</a><span class="mono concept-label">HUMAN × DESIGN × TECHNOLOGY</span></div>
  </section>
  <div class="discipline-strip" aria-label="研究領域"><span>HUMAN FIRST.</span><span>VIRTUAL REALITY</span><span class="strip-star" aria-hidden="true">✳</span><span>PLAYFUL BY DESIGN.</span><span>CREATIVE TECHNOLOGY</span><span class="strip-star pink" aria-hidden="true">✳</span></div>
  <section class="section wrap about" id="about" aria-labelledby="about-title">
    <div class="about-intro"><p class="eyebrow"><span>01</span> / ABOUT THE LAB</p><h2 id="about-title">以人為起點，<br>讓技術有溫度<span class="accent-dot">。</span></h2><a class="text-link" href="#contact">一起創造新的體驗${icon('arrow-up-right')}</a></div>
    <div class="about-body"><p class="lead">我們相信，好的互動不只發生在螢幕上，<br class="desktop-break">更發生在人與世界之間。</p><p>YunTech HCI LAB 致力於互動技術鑽研，以遊戲設計、虛擬實境、擴增實境與機電整合為主軸，探索人與機器的互動關係。以人文與數位設計為立基，整合機台與數位遊戲，創造不同的遊戲體驗。</p><p class="english-copy" lang="en">We explore the space between people and technology. Through game design, extended reality and mechatronics, we bring a human perspective to digital experiences.</p></div>
    <div class="research-directions">${[
      ['01', 'XR & IMMERSION', '擴展實境', 'AR / VR / MR / XR 數位內容，以沉浸體驗連結虛擬與真實。'],
      ['02', 'GAME & PLAY', '遊戲設計', '2D / 3D 遊戲開發、遊戲美術與互動，讓創意成為可玩的體驗。'],
      ['03', 'HUMAN & INTERFACE', '人機互動', '輸入裝置開發、遊戲機台與機電整合，探索互動的新形式。'],
      ['04', 'SECURITY & TRUST', '資訊安全', '資訊隱藏、可逆式資訊隱藏與加密影像研究。']
    ].map(([n, en, zh, text]) => `<article class="direction"><div class="direction-top"><span>${n}</span>${icon('arrow-up-right')}</div><h3>${zh}</h3><p class="mono">${en}</p><p>${text}</p></article>`).join('')}</div>
  </section>
  <section class="section works-section" id="works">
    <div class="wrap">${heading('02', 'EXPERIMENTS & EXPLORATIONS', '從概念，到真實互動。', '<p class="section-note">在實作中提問，在體驗中尋找答案。</p>')}
      <div class="work-grid">${data.works.map((w, i) => `<figure class="work ${i === 0 ? 'work-featured' : ''}"><a class="work-image" href="${w.image}" data-work-index="${i}" aria-label="檢視${esc(w.title)}完整影像"><img src="${w.image}" width="1400" height="600" alt="${esc(w.alt)}" loading="lazy" decoding="async"><span class="work-open" aria-hidden="true">${icon('arrow-up-right')}</span></a><figcaption><div><p class="mono">EXPLORATION / ${String(i + 1).padStart(2, '0')}</p><h3>${esc(w.title)}</h3></div><span class="work-type">${['IMMERSIVE','INTERACTIVE','HUMAN-CENTERED','3D ART','GAME ART','ILLUSTRATION','MOVING IMAGE'][i]}</span></figcaption></figure>`).join('')}</div>
    </div>
  </section>
  <section class="section wrap" id="members">
    ${heading('03', 'PEOPLE BEHIND THE IDEAS', '創意，來自不同的我們。')}
    <article class="pi" id="ShiuCW"><img class="pi-portrait" src="assets/members/ShiuCW.webp" width="560" height="660" alt="許志維 Chih-Wei Shiu，實驗室主持人" loading="lazy" decoding="async"><div class="pi-intro"><p class="eyebrow">PRINCIPAL INVESTIGATOR / 主持人</p><h3>許志維<span lang="en">Chih-Wei Shiu</span></h3><a class="text-link" href="mailto:${pi.email}">${icon('envelope')}${pi.email}</a></div><div class="pi-expertise">${pi.paragraphs.filter(p => p !== '專長：').map(p => `<p>${esc(p)}</p>`).join('')}</div></article>
    <div class="members-toolbar"><h3>實驗室夥伴 <span class="mono">THE TEAM</span></h3><div class="filter-buttons" data-member-filters aria-label="成員分類" hidden><button type="button" data-filter="graduate" aria-pressed="true">碩士生 <span>${data.members.filter(m => m.group === 'graduate').length}</span></button><button type="button" data-filter="alumni" aria-pressed="false">畢業成員 <span>${data.members.filter(m => m.group === 'alumni').length}</span></button><button type="button" data-filter="all" aria-pressed="false">全部</button></div></div>
    <div class="member-grid">${data.members.filter(m => m.group !== 'pi').map(member).join('')}</div>
    <div class="join-band" id="recurit"><div><p class="eyebrow">YOUR NEXT CHAPTER</p><h3>下一個有趣的點子，也許來自你。</h3><p>不限大學部或研究所、不限專長。只要喜歡動手實作、保持學習熱誠，歡迎加入。</p></div><a class="button button-dark" href="mailto:${pi.email}">加入我們${icon('arrow-up-right')}</a></div>
  </section>
  <section class="section research-section" id="research"><div class="wrap">
    ${heading('04', 'RESEARCH & IMPACT', '讓探索，留下影響。', external('https://scholar.google.com.tw/citations?user=rNASP-UAAAAJ&hl=zh-TW', 'Google Scholar'))}
    <div class="research-controls" hidden><div class="filter-buttons research-tabs" aria-label="研究成果分類"><button type="button" data-research="publications" aria-pressed="true">學術出版 <span>${data.publications.length}</span></button><button type="button" data-research="projects" aria-pressed="false">研究計畫 <span>${data.projects.length}</span></button><button type="button" data-research="awards" aria-pressed="false">指導與獲獎 <span>${data.awards.length}</span></button></div><label class="search-field">${icon('search')}<input id="research-search" type="search" placeholder="搜尋主題、作者、年份" aria-label="搜尋研究成果"></label></div>
    <p class="search-status mono" aria-live="polite" hidden></p>
    ${researchGroup('publications', '學術出版')}${researchGroup('projects', '研究計畫')}${researchGroup('awards', '指導與獲獎')}
    <p class="empty-results" hidden>沒有符合的研究紀錄，請試試其他關鍵字。</p>
  </div></section>
  <section class="section wrap" id="courses">
    ${heading('05', 'TEACHING & LEARNING', '在學習中，開啟可能。', '<p class="section-note">從設計思考到互動實作</p>')}
    <div class="course-controls filter-buttons" aria-label="課程學制" hidden><button type="button" data-level="graduate" aria-pressed="true">研究所</button><button type="button" data-level="bachelor" aria-pressed="false">大學部</button></div>
    <div class="course-content">${courseLevel('graduate', '研究所課程')}${courseLevel('bachelor', '大學部課程')}</div>
  </section>
  <section class="contact-section" id="contact"><div class="wrap">
    <div class="contact-top"><p class="eyebrow"><span>06</span> / GET IN TOUCH</p><h2>下一次互動，<br>從一句你好開始<span>。</span></h2><a class="contact-email" href="mailto:${pi.email}">${pi.email}${icon('arrow-up-right')}</a></div>
    <div class="contact-bottom"><address><p class="mono">FIND US / YUNLIN, TAIWAN</p><p>國立雲林科技大學<br>雲林縣斗六市大學路三段 123 號</p><p>實驗室：設計二館 DC121b<br>研究室：設計三館 DA511</p><a href="tel:+88655342601;ext=6502">(05) 534-2601 分機 6502</a></address><iframe title="雲科大設計學院位置地圖" src="${esc(data.map)}" width="680" height="290" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
    <footer><a class="footer-brand" href="#home">YunTech HCI LAB${icon('arrow-up-right')}</a><p>© ${data.updated.slice(0,4)} YunTech HCI LAB</p><p class="mono">UPDATED / <time datetime="${data.updated}">${data.updated.replaceAll('-', '.')}</time></p></footer>
  </div></section>
</main>
<dialog class="lightbox" aria-labelledby="lightbox-title"><div class="lightbox-toolbar"><p id="lightbox-title"></p><button class="icon-button lightbox-close" type="button" aria-label="關閉影像" title="關閉影像">${icon('x-lg')}</button></div><img class="lightbox-image" alt=""><div class="lightbox-bottom"><button class="icon-button lightbox-prev" type="button" aria-label="上一張" title="上一張">${icon('arrow-left')}</button><span class="lightbox-counter mono" aria-live="polite"></span><button class="icon-button lightbox-next" type="button" aria-label="下一張" title="下一張">${icon('arrow-right')}</button></div></dialog>
</body>
</html>
`;
await writeFile(path.join(root, 'index.html'), html);
await writeFile(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}</loc><lastmod>${data.updated}</lastmod></url></urlset>\n`);
console.log(`Built index.html (${Buffer.byteLength(html)} bytes), sitemap.xml; all content rendered in HTML.`);
