# alkoholicky.cz — Astro + Cloudflare

Srovnávač cen alkoholu. 27. 10. 2026 převeden z WordPressu (Rehub + WooCommerce + Content Egg + Rank Math na WEDOS)
na Astro SSR Worker + D1 — kód je fork `apps/eroka` (stejný stack, stejný den). Podrobnosti v [`docs/`](docs/)
(převzaté z eroky, platí i tady).

| Co | Kde |
|---|---|
| Web (Astro 7.3.8 SSR, Worker `alkoholicky` / `alkoholicky-staging`) | `src/`, `wrangler.jsonc` |
| Import nabídek z 19 feedů (Worker `alkoholicky-import`, cron 01–06 UTC) | `workers/import/` (`src/feeds.ts` = obchody a affiliate odkazy) |
| D1 schéma | `migrations/` (`0005_alkoholicky.sql` = průvodce/FAQ kategorií, texty značek, JSON-LD článků) |
| Převod z WordPressu | `scripts/export-from-wp.py` + `scripts/alkoholicky/wp-db.py extract` + `scripts/live-meta-snapshot.py --ld` → `scripts/migrate-from-wp.py` → `scripts/load-d1.sh` |
| Deploy | `npx tsx scripts/deploy.ts --env staging [--secrets]` (produkce jen s `ALK_PRODUCTION_APPROVED=yes`) |
| Přepnutí domény / návrat | `scripts/cutover.py apply\|rollback\|status` |
| SEO parita | `python3 scripts/seo-parity.py <base> [--ref origin]` |
| Lokální náhled | `scripts/dev-preview.sh` → http://localhost:8796 |

Co je jinak než na eroce:
- titulky/popisky/robots/H1 článků, stránek a kategorií = otisk živého WordPressu (`live-meta.json` z exportu), JSON-LD
  článků 1:1 (`posts.ld_json`); značky mají šablonu z mu-pluginu (`views.ts brandSeo`);
- externí odkazy dostávají `rel="nofollow noopener"` v middlewaru, výjimky schvaluje Kenny v `src/data/dofollow.json`;
- fotky produktů přes wsrv.nl (alkohol neblokuje), žádný vlastní img Worker;
- kalkulačka promile: formulář je v obsahu článku 13410, výpočet v `src/scripts/ui.ts`.

Přístupy: `credentials/.alkoholicky-credentials.env` (účet, D1, Access AUD, soli, import secret),
`credentials/.alkoholicky-feeds.json` (URL feedů s tokeny, CJ). Nic z toho nepatří do repa.
