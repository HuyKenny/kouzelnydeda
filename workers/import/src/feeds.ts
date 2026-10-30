// The three partner feeds that WP All Import read on WordPress (imports 25–28, 30. 10. 2026). URLs live in secrets
// (FEED_URL_SLEVOMAT carries an auth token): scripts/set-feed-secrets.py <env>.
export type Source = 'slevomat' | 'adrop' | 'zazitky';

export interface FeedDef {
  key: Source;
  /** XML element of one offer */
  item: 'DEAL' | 'SHOPITEM';
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
];

/** Affiliate links exactly as WP All Import built them (single_product_url of each import). */
export function affiliateUrl(src: Source, id: string, url: string): string {
  if (src === 'slevomat') {
    return `${url}?utm_source=affiliate&utm_medium=cpc&utm_campaign=dis_akv_gen_svk_all_buy_q6q55khb_kouzelnydedaCZ&utm_content=${id}&utm_term=q6q55khb`;
  }
  // eHub: desturl is appended raw (that is how every live Adrop/Zážitky link looks and is tracked)
  const bid = src === 'adrop' ? '0001595B' : 'c22fc1d9';
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
