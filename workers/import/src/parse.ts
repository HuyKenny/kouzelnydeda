// One feed element → a normalised offer, with the same filters, fields and categories as the WP All Import templates
// (imports 25/26 Slevomat, 27 Adrop, 28 Zážitky.cz). Everything the detail page shows goes into `info` (compact JSON).
import type { XmlNode } from './xml/stream';
import { ADROP_SKIP, SLEVOMAT_MAP, SLEVOMAT_SKIP, SLEVOMAT_TRAVEL_MAP, affiliateUrl, type Source } from './feeds';

export interface Info {
  /** description (plain text, paragraphs separated by \n) */
  d?: string | undefined;
  /** highlights (Slevomat) */
  h?: string | undefined;
  /** short title (Slevomat) */
  ts?: string | undefined;
  /** provider or accommodation: title, address, GPS, own web */
  pv?: { t?: string | undefined; a?: string | undefined; lat?: string | undefined; lng?: string } | undefined;
  /** board / transport (Slevomat travel) */
  bo?: string | undefined; tr?: string | undefined;
  /** what the price includes: short items + groups of lines */
  in?: { i?: string[] | undefined; g?: Array<[string, string[]]> } | undefined;
  /** voucher valid until / deal ends (YYYY-MM-DD) */
  ve?: string | undefined; de?: string | undefined;
  /** customers so far, priority (Slevomat) */
  cu?: number | undefined; pr?: number | undefined;
  tags?: string[] | undefined;
  /** params (Adrop) */
  pa?: Array<[string, string]> | undefined;
  /** variants: name, price (Zážitky.cz) */
  va?: Array<[string, number]> | undefined;
}

export interface Item {
  ext: string;
  name: string;
  target: string;
  image: string;
  images: string[];
  price: number;
  priceOld: number;
  /** pa_lokalita slug ('' = none) */
  lok: string;
  /** category path: [root, child, child …] — children hang directly under the root, like the WPAI manual hierarchy */
  cats: string[];
  excerpt: string;
  rating: number;
  reviews: number;
  info: Info;
}

const kids = (n: XmlNode, name: string) => n.children.filter((c) => c.name === name);
const kid = (n: XmlNode, name: string) => n.children.find((c) => c.name === name);
const txt = (n: XmlNode | undefined, ...path: string[]): string => {
  let cur = n;
  for (const p of path) cur = cur ? kid(cur, p) : undefined;
  return (cur?.text ?? '').trim();
};
const texts = (n: XmlNode | undefined, ...path: string[]): string[] => {
  if (!n) return [];
  let cur: XmlNode[] = [n];
  for (let i = 0; i < path.length - 1; i++) cur = cur.flatMap((c) => kids(c, path[i]!));
  return cur.flatMap((c) => kids(c, path[path.length - 1]!)).map((c) => c.text.trim()).filter(Boolean);
};
export const num = (v: string) => {
  const m = /-?\d[\d\s ]*(?:[.,]\d+)?/.exec(v);
  return m ? Number(m[0].replace(/[\s ]/g, '').replace(',', '.')) || 0 : 0;
};
/** HTML entities and tags out (Zážitky.cz descriptions carry &nbsp; and the odd <br>), whitespace kept per line. */
export function plain(s: string): string {
  return s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .split('\n').map((l) => l.replace(/[ \t ]+/g, ' ').trim()).filter(Boolean).join('\n');
}
const date = (s: string) => (/^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '');
const https = (u: string) => u.replace(/^http:\/\//i, 'https://');
const okUrl = (u: string) => /^https:\/\/[^\s/]+\.[^\s/]+\//i.test(u);
export function citySlug(s: string): string {
  const t = s.trim();
  if (!t) return '';
  if (/^čr$/i.test(t)) return 'cr';
  return t.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function slevomat(n: XmlNode): Item | null {
  const cat1 = txt(n, 'CATEGORY');
  const cats = texts(n, 'CATEGORIES', 'CATEGORY');
  const travel = cat1.includes('Cestování');
  if (!travel && SLEVOMAT_SKIP.some((w) => cat1.includes(w) || (cats[0] ?? '').includes(w))) return null;
  const id = txt(n, 'ID');
  const url = txt(n, 'URL');
  const price = num(txt(n, 'FINAL_PRICE'));
  if (!id || !okUrl(url) || !(price > 0)) return null;
  const old = num(txt(n, 'ORIGINAL_PRICE'));
  const imgs = texts(n, 'IMAGES', 'IMAGE').map(https).filter(okUrl);
  // import 26: root "Cestování" + CATEGORY[2..24]; import 25: CATEGORY[1] as the root + CATEGORY[2..20]
  const map = travel ? SLEVOMAT_TRAVEL_MAP : SLEVOMAT_MAP;
  const path = travel ? ['Cestování', ...cats.slice(1, 24)] : cats.slice(0, 20);
  const pv = kid(n, 'PROVIDER') ?? kid(n, 'TRAVEL');
  const pre = kid(n, 'PROVIDER') ? 'PROVIDER_' : 'TRAVEL_';
  const travelNode = kid(n, 'TRAVEL');
  const incl = kid(n, 'PRICE_INCL');
  const info: Info = {
    d: plain(txt(n, 'DESCRIPTION')) || undefined,
    h: plain(txt(n, 'HIGHLIGHTS')) || undefined,
    ts: txt(n, 'TITLE_SHORT') || undefined,
    ve: date(txt(n, 'VOUCHER_END')) || undefined,
    de: date(txt(n, 'DEAL_END')) || undefined,
    cu: num(txt(n, 'CUSTOMERS')) || undefined,
    pr: num(txt(n, 'PRIORITY')) || undefined,
    tags: texts(n, 'TAGS', 'TAG').slice(0, 12),
  };
  if (pv) {
    const p = { t: txt(pv, pre + 'TITLE'), a: txt(pv, pre + 'ADDRESS'), lat: txt(pv, pre + 'GPS_LAT'), lng: txt(pv, pre + 'GPS_LNG') };
    if (p.t || p.a) info.pv = p;
  }
  if (travelNode) {
    info.bo = txt(travelNode, 'BOARD') || undefined;
    info.tr = txt(travelNode, 'TRANSPORT') || undefined;
  }
  if (incl) {
    const items = texts(incl, 'ITEMS', 'ITEM');
    const groups: Array<[string, string[]]> = kids(kid(incl, 'DESCS') ?? { name: '', attrs: {}, children: [], text: '' }, 'GROUP')
      .map((g) => [txt(g, 'NAME'), texts(g, 'DESCS', 'DESC')] as [string, string[]]).filter((g) => g[1].length);
    if (items.length || groups.length) info.in = { ...(items.length ? { i: items } : {}), ...(groups.length ? { g: groups } : {}) };
  }
  return {
    ext: id,
    name: txt(n, 'TITLE'),
    target: affiliateUrl('slevomat', id, url),
    image: imgs[0] ?? '',
    images: imgs.slice(1, 5),
    price,
    priceOld: old > price ? old : 0,
    lok: citySlug(txt(n, 'CITIES', 'CITY')),
    cats: path.map((c) => map[c] ?? c),
    // excerpt = HIGHLIGHTS (import 25) / DESCRIPTION (import 26), the Rank Math %excerpt% description
    excerpt: plain(travel ? txt(n, 'DESCRIPTION') : txt(n, 'HIGHLIGHTS')),
    rating: num(txt(n, 'REVIEWS_AVERAGE')),
    reviews: num(txt(n, 'REVIEWS_COUNT')),
    info,
  };
}

function adrop(n: XmlNode): Item | null {
  const ct = txt(n, 'CATEGORYTEXT');
  if (ADROP_SKIP.some((w) => ct.includes(w))) return null;
  const group = txt(n, 'ITEMGROUP_ID');
  const itemId = txt(n, 'ITEM_ID');
  const url = https(txt(n, 'URL'));
  const price = num(txt(n, 'PRICE_VAT'));
  if (!group || !itemId || !okUrl(url) || !(price > 0)) return null;
  const params = kids(n, 'PARAM').map((p) => [txt(p, 'PARAM_NAME'), txt(p, 'VAL')] as [string, string]).filter((p) => p[0] && p[1]);
  const city = params.find((p) => p[0] === 'Město')?.[1] ?? '';
  const imgs = [txt(n, 'IMGURL'), ...texts(n, 'IMGURL_ALTERNATIVE')].map(https).filter(okUrl);
  const old = num(txt(n, 'ADROPPUVCENA'));
  return {
    ext: group,
    name: txt(n, 'PRODUCT') || txt(n, 'PRODUCTNAME'),
    // the URL is appended raw like WP All Import did (data1 = ITEM_ID)
    target: affiliateUrl('adrop', itemId, txt(n, 'URL')),
    image: imgs[0] ?? '',
    images: [...new Set(imgs.slice(1))].slice(0, 4),
    price,
    priceOld: old > price ? old : 0,
    lok: citySlug(city),
    cats: ['Zážitky'],
    excerpt: '',
    rating: 0,
    reviews: 0,
    info: { d: plain(txt(n, 'DESCRIPTION')) || undefined, pa: params.filter((p) => p[0] !== 'Lokalita').slice(0, 8) },
  };
}

function zazitky(n: XmlNode): Item | null {
  const id = txt(n, 'ID');
  const url = https(txt(n, 'URL'));
  const variants = kids(n, 'VARIANT').map((v) => [txt(v, 'PRODUCTNAMEEXT'), num(txt(v, 'PRICE_VAT'))] as [string, number]).filter((v) => v[1] > 0);
  const price = variants[0]?.[1] ?? num(txt(n, 'PRICE_VAT'));
  if (!id || !okUrl(url) || !(price > 0)) return null;
  const imgs = ['IMGURL', 'IMGURL2', 'IMGURL3', 'IMGURL4', 'IMGURL5'].map((k) => https(txt(n, k))).filter(okUrl);
  return {
    ext: id,
    name: txt(n, 'PRODUCT'),
    target: affiliateUrl('zazitky', id, txt(n, 'URL')),
    image: imgs[0] ?? '',
    images: imgs.slice(1),
    price,
    priceOld: 0,
    lok: '',
    cats: ['Zážitky'],
    excerpt: '',
    rating: 0,
    reviews: 0,
    info: { d: plain(txt(n, 'DESCRIPTION')) || undefined, va: variants.slice(0, 12) },
  };
}

export function parseItem(src: Source, n: XmlNode): Item | null {
  const it = src === 'slevomat' ? slevomat(n) : src === 'adrop' ? adrop(n) : zazitky(n);
  if (!it || !it.name) return null;
  if (!it.excerpt) it.excerpt = (it.info.d ?? '').split('\n')[0]!.slice(0, 300);
  return it;
}

/** FNV-1a over everything that is stored (a changed hash = one UPDATE). */
export function itemHash(i: Item): string {
  const s = JSON.stringify([i.name, i.target, i.image, i.images, i.price, i.priceOld, i.lok, i.cats, i.excerpt, i.rating, i.reviews, i.info]);
  let h = 0x811c9dc5;
  for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
