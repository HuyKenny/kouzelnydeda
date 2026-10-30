# Deploy a přepnutí

## Worker eroka-img (fotky)
Jeden kód, dvě instance: `npx wrangler deploy -c workers/img/wrangler.jsonc` = produkce (routa `alkoholicky.cz/img/*`,
service binding webu) a `--env staging` = `eroka-img-staging` bez routy (binding stagingu). Musí existovat dřív než web.
Secret `IMG_SECRET` (HMAC podpis `/img/` URL, `credentials/.alkoholicky-credentials.env`) musí být stejný na webu
(`deploy.ts --secrets` ho nahraje) i na img Workeru: `wrangler secret put IMG_SECRET -c workers/img/wrangler.jsonc [--env staging]`.
Při první změně formátu URL (27. 10. 2026) běžel img Worker chvíli s `--var IMG_LEGACY:1` (přijímal i staré nepodepsané URL).

## Staging
`npx tsx scripts/deploy.ts --env staging [--secrets] [--no-import]` — záložka D1 Time Travel (do `backups/`),
migrace, import Worker, build (`CLOUDFLARE_ENV=staging`, `BUILD_ID=<git sha>`), kontrola tajemství, deploy, smoke test
se servisním tokenem Access. Data poprvé: `scripts/load-d1.sh staging <sql-dir>`, pak `POST /run/<n>` pro každý feed
a `POST /finalize`.

D1 `export` neumí databáze s FTS5 → zálohou je Time Travel: `wrangler d1 time-travel restore DB --env <env> --bookmark <b>`.

## Produkce — živě na alkoholicky.cz od 27. 10. 2026 (jen se souhlasem Kennyho, `ALK_PRODUCTION_APPROVED=yes`)
**WordPress smazán 27. 10. 2026** (`bin/eroka-wp-smazat.py`, zálohy `backups/eroka-wp-final-*`, DNS Worker-only).
Skripty migrace z WP (`export-from-wp.py`, `migrate-from-wp.py`, `load-d1.sh`, `cutover.py`) jsou v
`backups/eroka-wp-migrace-skripty-2026-10-27.zip`. Postup, který proběhl:
1. `scripts/load-d1.sh production <sql>` (čerstvý export z WP), `set-feed-secrets.py production`, deploy → test na
   `https://alkoholicky.huy-kenny.workers.dev` (SEO parita, vizuál, `/go/` každého partnera, výkon).
2. Zóna alkoholicky.cz: zálohovat a smazat Cache Rules z doby WP (vypínají Cache API Workeru), browser TTL = respektovat.
3. Routy `alkoholicky.cz/*` a `www.alkoholicky.cz/*` → Worker `eroka` přes CF API (smazání rout = okamžitý návrat na WP).
4. Purge zóny, kontrola `X-Alk-Page-Cache: HIT`, GSC (property `https://alkoholicky.cz/`) + odeslat sitemapu.
5. Po přepnutí: vypnout eroka v `bin/all-wp-cron.sh` a `bin/wp-udrzba.py`, hlídač `/api/health` (cron-job.org),
   týden GSC; WP smazat až po týdnu s finální zálohou a schválením.
