# Architektura

```
alkoholicky.cz/*, www → Worker "eroka" (Astro SSR, @astrojs/cloudflare 14.3.4)
  middleware.ts: host allow-list → Access (staging celý host) → www→apex → lomítko 301 → LEGACY 301
                 → D1 redirects → Cache API (klíč /__kc/<data_version>/<BUILD_ID>/<path>, TTL 600 s) → bezpečnostní hlavičky
  [...path].astro → lib/dispatch.ts: tabulka slugs (produkt > kategorie > článek > stránka > rubrika), /page/N/,
                    jinak odhad slugu (redirect_guess_404_permalink) → 404
  /znacka/<slug>/(page/N/)  /go/<slug>/ (302 z D1, allow-list hostů, boti 204, klik do D1)
  sitemap_index.xml + <rankmath-jméno>.xml ze site_cache, robots.txt, /feed/, /api/health
Worker "alkoholicky-import" (cron */10 1–5 UTC): 1 feed za běh → finalizace dne (stale feedy, historie cen, sitemapy, data_version)
D1 alkoholicky-production / alkoholicky-staging (schéma migrations/0001, 0002)
```

## Datový model (D1)
- `slugs` — jeden lookup pro všechny URL v kořeni; kolize řeší migrace (`/pouta-na-ruce/` = produkt jako na WP).
- `products` — katalog 1:1 s WordPressem (ID a slugy zachované), denormalizované ceny (min/max/počet nabídek/
  nejlepší nabídka), přepočítává importér (`recomputeProducts`).
- `offers` — nabídky obchodů; `target_url` = finální affiliate URL vracená `/go/` byte po bytu, `go_slug` = starý
  slug Content Egg (staré odkazy fungují), `content_hash` = zápis jen při změně.
- `cat_products` — členství v kategorii rozbalené na všechny předky (WooCommerce archivy zahrnují podkategorie),
  klíč `(cat_id, created_at, product_id)` = výpis „od nejnovějších“ je jeden rozsah indexu.
- `posts` (články + stránky, HTML z `content.rendered`), `post_categories`, `comments` (jen čtení), `redirects`,
  `price_history` (denní minimum, jen změny), `clicks`, `site_cache` (sitemapy, `data_version`), `product_fts` (FTS5).

## Proč takhle
- Katalog je pevný (Kenny 26. 10.: 1:1 jako dnes) — feedy jen přidávají a obnovují nabídky existujících produktů.
- Obrázky produktů se hotlinkují jako na WP: proxy wsrv.nl erotické domény odmítá; Růžový slon má variantu
  `/product/detail/` (≤1000 px). Další krok by byly Cloudflare Image Transformations (placené).
- Uploads článků (497 souborů, 58 MB) jsou statické assety ve `public/wp-content/uploads/` (stejné URL jako na WP).

## Redesign „srovnávač“ (27. 10. 2026)
- **Vzhled:** bílá + neutrální šedé, jediná barva višňová `#B0103A`, systémové písmo (žádné webfonty), styl v jednom
  souboru `src/styles/app.css`, logo = monolinkový wordmark `src/data/logo.svg`, ikony v externím sprite `public/a/i1.svg`
  (při změně ikon přejmenovat soubor, cache je immutable), favicony a OG obrázek v `public/a/`.
- **Fotky (nic se neukládá):** `src/lib/img.ts` → wsrv.nl pro obchody, které přijímá; pro Růžového slona, ErosStar,
  Vibratory.net a Sexshop.cz (wsrv.nl je blokuje) Worker `eroka-img` (`workers/img`, WASM jsquash, `/img/<w>/<base64url>.webp`,
  jen edge cache + prohlížeč). Web ho volá přes service binding `IMG`, produkce navíc routou `alkoholicky.cz/img/*`.
  Seznam blokovaných hostů je ve dvou souborech (`img.ts` OWN a `workers/img` HOSTS) — držet stejný.
- **Data z feedů (migrace 0004):** `offers.delivery_price`, `offers.extra` (kanonické parametry + až 3 fotky),
  `product_params` (8 klíčů, `workers/import/src/params.ts`), `products.images/disc_pct/in_stock/pop`, řadicí klíče
  v `cat_products` (`min_price`, `pop`, `disc` + indexy). Sleva = jen stará cena obchodu (historie cen dávala falešné −80 %).
- **Noční předpočet** (`workers/import/src/facets.ts`, ve `finalizeDay`): fasety `f:<kategorie>` / `fb:<značka>`,
  bloky homepage `home`, fotka ke kategorii `cats:img`. Ručně: `POST /facets`, doplnění produktů `POST /recompute?offset=&limit=`.
- **Filtry** (`src/lib/filters.ts`): `?orderby= &min_price= &max_price= &znacka= &obchod= &skladem=1 &sleva=1 &kat= &p_<klíč>=`;
  filtrovaná/přeřazená stránka = `noindex, follow` bez canonicalu. Výchozí řazení = oblíbenost.
- **Našeptávač** `GET /api/suggest?q=` (kategorie a značky z paměti, produkty z FTS5), cache 10 min.

## Technický audit 27. 10. 2026 (shrnutí změn)
- Fotky: všechny přes `eroka-img` (wsrv.nl zrušen — cold p90 9 s), podepsané URL (`src/lib/sign.ts`, HMAC), seznam hostů
  `src/lib/image-hosts.ts` (sdílí web i img Worker), limit pixelů/bajtů, ruční redirecty, rate limit `RL_IMG`.
- Middleware: jeden 301 (www, velká písmena, legacy, lomítko, tabulka redirects), production workers.dev → 301 na alkoholicky.cz
  (kromě `/api/health`), cache klíč z normalizovaných filtrů, rate limit `RL_SEARCH` na každý cache MISS s parametry,
  HEAD se neukládá, CSP `script-src` s nonce (HTMLRewriter), `_headers` s nosniff/HSTS i pro statiku.
- SEO: nové šablony title/description (`src/lib/seo.ts`), noindex produktů bez nabídky a značek < 3 produkty, 21 zdvojených
  kategorií sloučeno (301), `guessSlug` jen pro jednoznačné pokračování, nový robots.txt, sitemapy bez kolizí a noindex.

## Kategorie (27. 10. 2026)
- Členství: `cat_products.direct` 1 = hlavní kategorie produktu, 0 = předek, **2 = pravidlo** (`workers/import/src/category-rules.ts`,
  noční diff v `facets.ts applyCategoryRules`, ručně `POST /rules`). Pravidlo = cíl + `within` (podstrom) + název/parametr/značka.
- Kategorie pod 5 produktů = noindex a mimo sitemapu; dlaždice podkategorií od 3 produktů (`views.ts`, `Dlazdice.astro`).
- Rozcestníky Pro muže/ženy/páry nemají potomky — dlaždice berou ze skupiny v `src/data/menu.json` se stejnou URL.
- Menu `src/data/menu.json`: skupina s `url: ''` je jen nadpis (např. Oblíbené značky).
