// The three partner feeds that WP All Import read on WordPress (imports 25–28, 30. 10. 2026). URLs live in secrets
// (FEED_URL_SLEVOMAT carries an auth token): scripts/set-feed-secrets.py <env>.
export type Source = 'slevomat' | 'adrop' | 'zazitky' | 'skvelecesko' | 'kormidlo' | 'firmanazazitky';

export interface FeedDef {
  key: Source;
  /** XML element of one offer */
  item: 'DEAL' | 'SHOPITEM' | 'entry' | 'tour';
  /** stores.slug (WordPress taxonomy "store") */
  store: string;
  secret: string;
  /** hours between runs */
  everyH: number;
}

export const FEEDS: FeedDef[] = [
  { key: 'slevomat', item: 'DEAL', store: 'slevomat-cz', secret: 'FEED_URL_SLEVOMAT', everyH: 6 },
  { key: 'zazitky', item: 'SHOPITEM', store: 'zazitky-cz', secret: 'FEED_URL_ZAZITKY', everyH: 12 },
  { key: 'adrop', item: 'SHOPITEM', store: 'adrop-cz', secret: 'FEED_URL_ADROP', everyH: 12 },
  // České kormidlo (CK, SDovolena format: tours with every term and price; ~150 MB, no compression)
  { key: 'kormidlo', item: 'tour', store: 'ceske-kormidlo', secret: 'FEED_URL_KORMIDLO', everyH: 24 },
  // Firmanazazitky.cz (CJ): no feed — scripts/firmanazazitky-import.py scrapes the product pages and POSTs them to /ingest/firmanazazitky
  { key: 'firmanazazitky', item: 'entry', store: 'firma-na-zazitky', secret: '', everyH: 24 },
  { key: 'skvelecesko', item: 'entry', store: 'skvele-cesko', secret: 'FEED_URL_SKVELECESKO', everyH: 12 },
];

/** Slevomat affiliate UTM in the documented shape (Kenny 30. 10. 2026; WP All Import used "svk…kouzelnydedaCZ").
 *  utm_content is the placement of the click — /go/ rewrites it per click (detail-pobyty, karta-darek-pro-muze …). */
export const SLEVOMAT_CAMPAIGN = 'dis_akv_gen_cze_all_buy_q6q55khb_kouzelnydeda.cz';
export function affiliateUrl(src: Source, id: string, url: string): string {
  if (src === 'slevomat') {
    return `${url}?utm_source=affiliate&utm_medium=cpc&utm_campaign=${SLEVOMAT_CAMPAIGN}&utm_content=${id}&utm_term=q6q55khb`;
  }
  // CJ deep link (Firmanazazitky.cz): the product URL is the encoded url= parameter of the partner's tracking link
  if (src === 'firmanazazitky') return `https://www.jdoqocy.com/click-100738307-17346622?sid=${id}&url=${encodeURIComponent(url)}`;
  // Dognet (SkvěléČesko.cz): the partner URL goes in raw after url= (Kenny's document, 30. 10. 2026)
  if (src === 'skvelecesko') return `https://go.dognet.com/?chid=0ahgy2Fx&url=${url}`;
  return ehubUrl(src === 'adrop' ? 'adrop' : src === 'kormidlo' ? 'kormidlo' : 'zazitky', id, url);
}
/** eHub: desturl is appended raw (that is how every live Adrop/Zážitky link looks and is tracked). Also used per variant. */
export function ehubUrl(src: 'adrop' | 'zazitky' | 'kormidlo', id: string, url: string): string {
  const bid = src === 'adrop' ? '0001595B' : src === 'kormidlo' ? 'b880f187' : 'c22fc1d9';
  return `https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=${bid}&data1=${id}&desturl=${url}`;
}

/** WP All Import category mapping of import 25 (everything except travel). */
export const SLEVOMAT_MAP: Record<string, string> = { 'Zážitky a zábava': 'Zážitky' };
/** Import 26 (travel, root "Cestování"). */
export const SLEVOMAT_TRAVEL_MAP: Record<string, string> = {
  'Zážitky a zábava': 'Zážitky',
  'Zážitky': 'Zážitkové pobyty',
  'Pro ženy': 'Dovolená pro ženy',
  'S domácími mazlíčky': 'Dovolená s domácími mazlíčky',
  'Velikonoce': 'Dovolená na Velikonoce',
  'Letní prázdniny': 'Dovolená na letní prázdniny',
  'Jarní prázdniny': 'Dovolená na jarní prázdniny',
  'Pro rodiny s dětmi': 'Dovolená pro rodiny s dětmi',
  'Apartmány': 'Pobyty v apartmánech',
  'Silvestr': 'Dovolená na Silvestr',
  'Vánoce': 'Dovolená na Vánoce',
  'Valentýn': 'Dovolená na Valentýn',
  'Pobyty a ubytování u vody': 'Dovolená u vody',
  'Pobyty a dovolená u vody': 'Dovolená u vody',
  'Pro seniory': 'Dovolená pro seniory',
  'Pro koho': 'Dovolená pro ženy',
};

/** Slevomat deals WP All Import skipped (XPath of import 25): goods, photo gifts, food, practical services, courses. */
export const SLEVOMAT_SKIP = ['Zboží', 'Fotodárky', 'Potraviny', 'Praktické', 'Autoškola a škola smyku', 'Ostatní kurzy'];
/** Adrop items WP All Import skipped (XPath of import 27): physical gifts, T-shirts, vouchers. */
export const ADROP_SKIP = ['Hmotné', 'tričk', 'poukaz'];

/** Slevomat categories of goods (redesign v2, Kenny: no physical products) — a deal whose categories are only these is
 *  not imported (taxonomie.json "skip" did the same to the catalogue). */
export const SLEVOMAT_GOODS = ['Jídlo s sebou', 'Rozvoz jídla', 'Delikatesy'];
