// Titles, descriptions and robots as kouzelnydeda.cz printed them on WordPress (Rank Math templates + the child theme
// filters, 30. 10. 2026):
//   offer      "{name} | Kouzelný děda"                      description = excerpt (Rank Math %excerpt%)
//   category   "{name} se slevou – ověřené nabídky | Kouzelný děda" (≤ 62 chars, else "{name} se slevou | Kouzelný děda")
//   city       "Zážitky a pobyty {lok} se slevou | Kouzelný děda"
//   combo      "{cat} {lok} se slevou | Kouzelný děda"
//   store, blog category "{term} | Kouzelný děda"            post/page: the live snapshot (seo_title)
import { cislo, decode, stripTags } from './format';

export const SITE = 'Kouzelný děda';
const SEP = ' | ';

export const withSite = (t: string) => decode(t) + SEP + SITE;

/** mb_substr( 0, 157 ) . '…' when longer than 160 (the theme's descriptions). */
export function cut160(s: string): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > 160 ? t.slice(0, 157) + '…' : t;
}
/** Rank Math %excerpt% / %term_description%: plain text, cut at a word boundary around 160 characters. */
export function clamp(text: string, max = 160): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cutAt = t.slice(0, max + 1);
  const i = cutAt.lastIndexOf(' ');
  return (i > max * 0.6 ? cutAt.slice(0, i) : t.slice(0, max)).replace(/[\s,;:–(-]+$/, '') + '…';
}

export function categoryTitle(name: string, custom = ''): string {
  if (custom) return rmVars(custom, name);
  const n = decode(name);
  const long = `${n} se slevou – ověřené nabídky${SEP}${SITE}`;
  return long.length <= 62 ? long : `${n} se slevou${SEP}${SITE}`;
}
export function categoryDesc(name: string, count: number): string {
  return cut160(`${decode(name)} se slevou — ${cislo(count)} ověřených nabídek na jednom místě. Porovnejte ceny i hodnocení a vyberte tu nejvýhodnější. Denně nové akce.`);
}
export const cityTitle = (lok: string) => `Zážitky a pobyty ${lok} se slevou${SEP}${SITE}`;
export const cityDesc = (nom: string, count: number) => cut160(`${nom}: ${cislo(count)} ověřených nabídek na zážitky, pobyty a dovolenou se slevou. Porovnejte ceny a vyberte tu pravou.`);
export const comboTitle = (cat: string, lok: string) => `${decode(cat)} ${lok} se slevou${SEP}${SITE}`;
export const comboDesc = (cat: string, lok: string, count: number) => cut160(`${decode(cat)} ${lok}: ${cislo(count)} ověřených nabídek se slevou. Porovnejte ceny i hodnocení a vyberte tu pravou.`);
export const BLOG_TITLE = `Blog: tipy na cestování, zážitky a dovolenou${SEP}${SITE}`;
export const BLOG_DESC = 'Inspirace a praktické tipy na cestování, zážitky, wellness a dovolenou. Nápady na dárky i rady, jak vybrat ten správný pobyt nebo zážitek.';

/** Rank Math per-object template with %title%/%term%/%sep%/%sitename% filled. */
export function rmVars(tpl: string, name: string): string {
  return tpl.replace(/%(title|term)%/g, decode(name)).replace(/%sep%/g, '|').replace(/%sitename%/g, SITE).replace(/%currentyear%/g, String(new Date().getFullYear()))
    .replace(/%[a-z_]+%/g, '').replace(/\s{2,}/g, ' ').trim();
}
export function offerTitle(name: string, custom = ''): string {
  return custom ? rmVars(custom, name) : withSite(name);
}
export function descFrom(custom: string, text: string, fallback = ''): string {
  if (custom) return custom;
  return clamp(stripTags(text) || fallback);
}
/** " – strana N" on paged listings (Rank Math %page%). */
export function paged(title: string, page: number): string {
  return page > 1 ? title.replace(new RegExp(`(\\s*\\|\\s*${SITE})?$`), ` – strana ${page}$1`) : title;
}

/** Rank Math robots meta: follow/nofollow, index/noindex, the object's extra flags, max-* defaults on indexable pages. */
export function robots(noindex: boolean, extra = ''): string[] {
  const parts = extra.split(',').map((x) => x.trim()).filter(Boolean);
  const flags = parts.filter((x) => !['index', 'noindex', 'follow', 'nofollow'].includes(x));
  const head = [parts.includes('nofollow') ? 'nofollow' : 'follow', noindex ? 'noindex' : 'index', ...flags];
  return noindex ? head : [...head, 'max-snippet:-1', 'max-video-preview:-1', 'max-image-preview:large'];
}
