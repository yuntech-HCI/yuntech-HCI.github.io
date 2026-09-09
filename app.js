(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  document.documentElement.classList.add('js');

  const menu = $('.menu-toggle');
  const nav = $('#primary-nav');
  menu.hidden = false;
  function closeMenu(returnFocus = false) {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', '開啟導覽選單');
    $('img', menu).src = 'assets/icons/list.svg';
    if (returnFocus) menu.focus();
  }
  menu.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') === 'true';
    nav.classList.toggle('is-open', !expanded);
    menu.setAttribute('aria-expanded', String(!expanded));
    menu.setAttribute('aria-label', expanded ? '開啟導覽選單' : '關閉導覽選單');
    $('img', menu).src = `assets/icons/${expanded ? 'list' : 'x-lg'}.svg`;
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu(true);
  });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  window.matchMedia('(min-width: 901px)').addEventListener('change', () => closeMenu());

  const memberFilters = $('[data-member-filters]');
  memberFilters.hidden = false;
  function filterMembers(group) {
    $$('[data-filter]', memberFilters).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === group)));
    $$('.member').forEach(member => { member.hidden = group !== 'all' && member.dataset.group !== group; });
  }
  memberFilters.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (button) filterMembers(button.dataset.filter);
  });
  filterMembers('graduate');

  $('.research-controls').hidden = false;
  let currentResearch = 'publications';
  const search = $('#research-search');
  const status = $('.search-status');
  const detailState = new Map();
  let wasSearching = false;
  function filterResearch() {
    const query = search.value.trim().toLocaleLowerCase();
    const searching = query.length > 0;
    if (searching && !wasSearching) $$('.record-group').forEach(group => detailState.set(group, group.open));
    let count = 0;
    $$('[data-research-panel]').forEach(panel => {
      const active = panel.dataset.researchPanel === currentResearch;
      panel.hidden = !active;
      $$('.record-group', panel).forEach(group => {
        let matches = 0;
        $$('.record', group).forEach(record => {
          const match = !query || `${$('summary', group).textContent} ${record.textContent}`.toLocaleLowerCase().includes(query);
          record.hidden = !match;
          if (match) matches++;
        });
        group.hidden = matches === 0;
        if (searching && active && matches) group.open = true;
        if (!searching && wasSearching) group.open = detailState.get(group) ?? group.open;
        if (active) count += matches;
      });
    });
    wasSearching = searching;
    $$('[data-research]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.research === currentResearch)));
    status.hidden = !searching;
    status.textContent = `找到 ${count} 筆紀錄`;
    $('.empty-results').hidden = count !== 0;
  }
  $('.research-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-research]');
    if (button) { currentResearch = button.dataset.research; filterResearch(); }
  });
  search.addEventListener('input', filterResearch);
  filterResearch();

  $('.course-controls').hidden = false;
  function filterCourses(level) {
    $$('[data-course-panel]').forEach(panel => { panel.hidden = panel.dataset.coursePanel !== level; });
    $$('[data-level]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.level === level)));
  }
  $('.course-controls').addEventListener('click', event => {
    const button = event.target.closest('[data-level]');
    if (button) filterCourses(button.dataset.level);
  });
  filterCourses('graduate');

  // Preserve existing member and course deep links, even inside a filtered group.
  function revealHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    if (target.classList.contains('member')) filterMembers(target.dataset.group);
    if (target.dataset.coursePanel) filterCourses(target.dataset.coursePanel);
    if (target.dataset.researchPanel) { currentResearch = target.dataset.researchPanel; filterResearch(); }
    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant', block: 'start' }));
  }
  window.addEventListener('hashchange', revealHash);
  revealHash();

  const lightbox = $('.lightbox');
  const works = $$('[data-work-index]');
  let currentWork = 0;
  let opener;
  function showWork(index) {
    currentWork = (index + works.length) % works.length;
    const link = works[currentWork];
    const image = $('img', link);
    $('.lightbox-image').src = link.getAttribute('href');
    $('.lightbox-image').alt = image.alt;
    $('#lightbox-title').textContent = $('h3', link.closest('figure')).textContent;
    $('.lightbox-counter').textContent = `${String(currentWork + 1).padStart(2, '0')} / ${String(works.length).padStart(2, '0')}`;
  }
  if (typeof lightbox.showModal === 'function') {
    works.forEach((link, i) => link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      showWork(i);
      lightbox.showModal();
    }));
    $('.lightbox-close').addEventListener('click', () => lightbox.close());
    $('.lightbox-prev').addEventListener('click', () => showWork(currentWork - 1));
    $('.lightbox-next').addEventListener('click', () => showWork(currentWork + 1));
    lightbox.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); showWork(currentWork + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); showWork(currentWork - 1); }
    });
    lightbox.addEventListener('click', event => {
      if (event.target !== lightbox) return;
      const rect = lightbox.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) lightbox.close();
    });
    lightbox.addEventListener('close', () => opener?.focus({ preventScroll: true }));
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const entry = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!entry) return;
      $$('#primary-nav a').forEach(link => {
        if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    $$('main section[id]').forEach(section => observer.observe(section));
  }

  // Keep the existing analytics property, but do not send local preview traffic.
  if (location.hostname === 'yuntech-hci.github.io') {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-QHQ4JMPK49');
    const analytics = document.createElement('script');
    analytics.src = 'https://www.googletagmanager.com/gtag/js?id=G-QHQ4JMPK49';
    analytics.async = true;
    document.head.append(analytics);
  }
})();
