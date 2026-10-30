# Import nabídek (workers/import)

- 16 XML feedů (bývalé moduly Content Egg `Feed__1…16`): Google Merchant (`item`, `g:*`) nebo Heureka (`SHOPITEM`).
  Konfigurace v `workers/import/src/feeds.ts` (deeplink/tracking jsou veřejné), URL s tokeny = secrets `FEED_URL_<n>`
  (`scripts/set-feed-secrets.py <local|staging|production>`).
- Odkaz jako Content Egg: deeplink sítě + `encodeURIComponent(url)` (Dognet, eHub), jinak URL + tracking parametry
  (AffilBox `a_box`, ErosStar `id=13929`). Affiliateport posílá URL s `&amp;` → normalizace na `&`.
- Dva průchody: načíst celý feed → párovat. Pořadí: stejné `unique_id` → EAN (produkt.ean nebo EAN nabídky Růžového
  slona, nejednoznačné EAN se nepárují). Má-li produkt nabídku stejného obchodu pod ID, které už ve feedu není,
  nabídka se přečísluje (DeepLove 26. 10. přečísloval 1 617 položek) — `/go/` slug zůstává.
- Zápis jen změn (`content_hash`), zmizelé položky → `active=0`, pokud nechybí víc než `MAX_DROP_PCT` (40 %) — jinak
  `suspicious` a nic se nedeaktivuje. Feed bez úspěchu `STALE_DAYS` (7) dní → jeho nabídky se skryjí.
- Finalizace dne: historie cen (jen změny minima), sitemapy, `data_version` (nový klíč page cache).
- HTTP API (Bearer `IMPORT_SHARED_SECRET`): `GET /status`, `POST /run/<n>[?force=1]`, `POST /tick`, `POST /finalize[?force=1]`.

## Stav feedů (26. 10. 2026, staging)
| Feed | Obchod | Položek | Spárováno | Pozn. |
|---|---|---|---|---|
| 6 | Růžový slon (master) | 12 019 | 11 506 | 208 zmizelo |
| 1 / 7 / 8 / 9 | Desirel / LovesexShop / Vibratory.net / Flagranti (Dognet) | | 3 102 / 2 978 / 878 / 1 968 | Flagranti windows-1250 |
| 2 / 3 / 5 / 10 / 16 | DeepLove / Sexíček / Lékárna AVE / Dialekárna / EroticCity (eHub) | | 1 883 / 1 865 / 47 / 0 / 649 | |
| 12 / 13 / 15 | Sexshop / Intimfitness / SexShop51 (AffilBox) | | 1 208 / 17 / 1 728 | |
| 14 | ErosStar | 5 472 | 1 925 | |
| 4 / 11 | Benu / Krása (Affiliateport) | — | — | **vypnuto** (`enabled: false` ve feeds.ts): token vypršel (HTTP 401), Kenny doplní nový feed |
| CJ | CjProducts (1 779 nabídek, drmax, notino…) | — | — | zůstávají, jak je připojil Content Egg (Kenny 26. 10.); importér je neobnovuje |
