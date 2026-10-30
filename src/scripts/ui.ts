// Small progressive enhancements (the site works without JS): menu, listing sort/filter auto-submit, gallery,
// sticky price bar, broken partner photos, search suggestions (/api/suggest).
type Root = { querySelector: Document['querySelector']; querySelectorAll: Document['querySelectorAll'] };
const $ = <T extends Element = HTMLElement>(s: string, r: Root = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: Root = document) => [...r.querySelectorAll<T>(s)];

// menu (details/summary): close on outside click and Escape
const menu = $<HTMLDetailsElement>('.nav');
if (menu) {
  menu.addEventListener('toggle', () => document.body.classList.toggle('bez-scroll', menu.open && !matchMedia('(min-width: 960px)').matches));
  document.addEventListener('click', (e) => { const t = e.target as Element; if (menu.open && (t.closest('[data-zavrit]') || !t.closest('.nav'))) menu.open = false; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') menu.open = false; });
}

// listing toolbar: sort and partner apply at once, empty price fields are not sent
const tb = $<HTMLFormElement>('form.tb');
if (tb) {
  tb.addEventListener('change', (e) => { if ((e.target as HTMLElement).tagName === 'SELECT') tb.requestSubmit(); });
  tb.addEventListener('submit', (e) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    for (const [k, v] of new FormData(tb).entries()) { const s = String(v).trim(); if (s && !(k === 'orderby' && s === 'pop')) sp.set(k, s); }
    location.href = tb.action.split('?')[0] + (sp.toString() ? '?' + sp : '');
  });
}

// gallery thumbnails
const main = $<HTMLImageElement>('.ga__m img');
for (const b of $$<HTMLButtonElement>('.ga__t button')) {
  b.addEventListener('click', () => {
    if (!main) return;
    main.src = b.dataset.src!; main.srcset = b.dataset.srcset ?? '';
    $$('.ga__t button').forEach((x) => x.setAttribute('aria-current', String(x === b)));
  });
}

// sticky price bar once the main CTA scrolled away (mobile)
const bar = $('.lista'), cta = $('.of__cta');
if (bar && cta && 'IntersectionObserver' in window) {
  new IntersectionObserver(([en]) => bar.classList.toggle('je-videt', !en!.isIntersecting && en!.boundingClientRect.top < 0)).observe(cta);
}

// a partner photo that no longer exists → the drawn placeholder instead of a broken image
const broken = (img: HTMLImageElement) => { img.closest('.fo')?.classList.add('fo--bez'); img.remove(); };
document.addEventListener('error', (e) => { const t = e.target as HTMLElement; if (t.tagName === 'IMG' && t.closest('.fo')) broken(t as HTMLImageElement); }, true);
for (const img of $$<HTMLImageElement>('.fo img')) if (img.complete && img.naturalWidth === 0 && img.src) broken(img);

// search suggestions
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
interface Sug { cats: Array<{ u: string; n: string; c: number }>; offers: Array<{ u: string; n: string; p: string }> }
for (const input of $$<HTMLInputElement>('input[data-suggest]')) {
  const box = input.closest('.hl')?.querySelector<HTMLElement>('.hl__s');
  if (!box) continue;
  let timer = 0, seq = 0, idx = -1;
  const links = () => $$<HTMLAnchorElement>('a', box as unknown as Root);
  const hide = () => { box.hidden = true; idx = -1; };
  const render = (d: Sug, q: string) => {
    let h = '';
    if (d.cats.length) h += '<div class="hl__h">Kategorie</div>' + d.cats.map((c) => `<a href="${esc(c.u)}" role="option"><span>${esc(c.n)}</span><span class="hl__c">${c.c}</span></a>`).join('');
    if (d.offers.length) h += '<div class="hl__h">Nabídky</div>' + d.offers.map((p) => `<a href="${esc(p.u)}" role="option"><span>${esc(p.n)}</span><span class="hl__c">${esc(p.p)}</span></a>`).join('');
    if (!h) { hide(); return; }
    h += `<a href="/?s=${encodeURIComponent(q)}&amp;post_type=product" role="option"><b>Všechny výsledky pro „${esc(q)}“</b></a>`;
    box.innerHTML = h; box.hidden = false; idx = -1;
  };
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { hide(); return; }
    timer = window.setTimeout(async () => {
      const my = ++seq;
      try {
        const r = await fetch('/api/suggest?q=' + encodeURIComponent(q));
        if (r.ok && my === seq) render(await r.json() as Sug, q);
      } catch { /* offline */ }
    }, 160);
  });
  input.addEventListener('keydown', (e) => {
    const l = links();
    if (box.hidden || !l.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + l.length) % l.length;
      l.forEach((a, i) => a.setAttribute('aria-selected', String(i === idx)));
    } else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); location.href = l[idx]!.href; }
    else if (e.key === 'Escape') hide();
  });
  document.addEventListener('click', (e) => { if (!(e.target as Element).closest('.hl')) hide(); });
}
