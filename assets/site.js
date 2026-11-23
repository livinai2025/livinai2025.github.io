/* Livinai website: shared behaviour (header, mobile menu, sliders, reveal, table of contents). */
(function () {
  const hdr = document.querySelector('.hdr');
  if (hdr && !hdr.classList.contains('solid')) {
    const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('mnav');
  if (btn && menu) {
    const set = (open) => {
      menu.classList.toggle('open', open);
      menu.inert = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    set(false);
    btn.addEventListener('click', () => set(!menu.classList.contains('open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) { set(false); btn.focus(); } });
    // A tap anywhere outside the menu (and its button) closes it.
    document.addEventListener('pointerdown', (e) => {
      if (menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) set(false);
    });
  }

  // Before / after sliders
  document.querySelectorAll('[data-ba]').forEach((ba) => {
    const range = ba.querySelector('input[type=range]');
    if (!range) return;
    const set = () => ba.style.setProperty('--pos', range.value + '%');
    range.addEventListener('input', set);
    set();
  });

  // Example switcher for the hero slider
  document.querySelectorAll('[data-switch]').forEach((group) => {
    const ba = document.querySelector(group.dataset.switch);
    if (!ba) return;
    const before = ba.querySelector('.before');
    const after = ba.querySelector('.after');
    group.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      group.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      after.src = b.dataset.after; after.alt = b.dataset.afterAlt;
      before.src = b.dataset.before; before.alt = b.dataset.beforeAlt;
    });
  });

  // Reveal on scroll
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && items.length) {
    document.documentElement.classList.add('js-reveal');
    // Anything already on screen shows at once; the rest fades in as it scrolls into view.
    items.forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in'); });
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  // Highlight the current section in a table of contents
  const toc = document.querySelector('.toc');
  if (toc && 'IntersectionObserver' in window) {
    const links = new Map([...toc.querySelectorAll('a')].map((a) => [a.hash.slice(1), a]));
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.remove('on'));
      const a = links.get(en.target.id);
      if (a) a.classList.add('on');
    }), { rootMargin: '-30% 0px -60% 0px' });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  // Current year in the footer
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
