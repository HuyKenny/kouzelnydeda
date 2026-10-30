# SEO 1:1 s WordPressem (Rank Math)

| Typ | Title | Description |
|---|---|---|
| produkt | `%title% – cena a recenze \| Eroka.cz` | krátký popis bez tagů |
| kategorie | vlastní Rank Math title, jinak `%term% <rok> – srovnání cen a nejlepší výběr \| Eroka` | vlastní / popis kategorie |
| značka, blog, rubrika | `%term% \| Eroka` (stejný i na /page/N/) | popis termu |
| článek, stránka | vlastní Rank Math title, jinak `%title% \| Eroka` | vlastní / excerpt |
| hledání | `<dotaz> \| Eroka`, noindex | — |
| 404 | `Stránka nenalezena \| Eroka`, noindex | — |

- Canonical absolutní na `https://alkoholicky.cz`, stránkování má vlastní canonical + prev/next (jako Rank Math).
- Robots: `follow, index, max-snippet:-1, …`; noindex: 115 tenkých produktů + mrtvé/prázdné kategorie
  (`eroka-prune-data.php` z WP mu-pluginu, uložený v `backups/eroka-wp-export-2026-10-26/` → `products.noindex`, `categories.noindex`).
- JSON-LD: Rank Math graf (Place, AdultEntertainment/Organization, WebSite) + ItemPage/Product/Offer, CollectionPage,
  WebPage/BlogPosting/Person; jeden BreadcrumbList; ItemList (20 produktů) na výpisech; FAQPage + SearchAction na úvodu.
  Oprava proti WP: `Product.name` = název produktu (WP tam dával celý title).
- Sitemapy se stejnými jmény (`product-sitemapN.xml` po 200 URL, `product_cat-…`, `product_brand-…`, `post-…`,
  `page-…`, `category-…`), lastmod s pražským offsetem; generuje importér 1× denně.
- Přesměrování: LEGACY v middleware (`/kategorie-produktu/`, `/product/`, `/category/`, `/brandstore/`→`/znacka/`,
  `/značka/x/`→`/znacka/x/`, `…/in stock/`, `*/feed/`, `/domov/`), tabulka `redirects` (24 smysluplných pravidel z Rank
  Math + 7 `_wp_old_slug`; 672 botích pravidel typu `/.env`→`/vibratory/` zahozeno → 404), odhad slugu jako WordPress.
- Ověření: `scripts/seo-parity.py` (tvrdá pole status/redirect/canonical/robots/title/description/H1).

## Výsledek parity (27. 10. 2026, staging)
- Vzorek 1 437 URL (všechny kategorie, články, stránky, rubriky, 200 značek, 800 produktů, stránkování, legacy URL),
  seed 27: **1 431 / 1 437 shodných (99,6 %)** v tvrdých polích. První vzorek (1 189 URL, seed 26) po opravách stejně.
- Zbylé rozdíly jsou záměrné: 4 rubriky blogu mají H1 (WP žádné neměl), `/brandstore/<x>/` → 301 na `/znacka/<x>/`
  (WP servíroval duplicitu), 1 produkt má na WP prázdné H1.
- Opravy, které parita našla: canonical se u noindex nevypisuje; zobrazené názvy jdou přes `texturize()` (pomlčky,
  „uvozovky“, palce ″, apostrofy, ×), Rank Math popisy produktů z neformátovaného excerptu (`product_excerpt_raw.ndjson`),
  popisy článků jako snapshot živého webu (`live-post-descriptions.json`), robots `noimageindex` u recenzí,
  značka se stejným slugem jako produkt → 301 na produkt.
