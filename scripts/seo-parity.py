#!/usr/bin/env python3
"""SEO parity: a reference vs a new environment. `--ref origin` = the WordPress origin (before the cutover 27. 10. 2026),
default = production on workers.dev (what alkoholicky.cz serves after the cutover).

    python3 scripts/seo-parity.py <base-url> [--products N] [--brands N] [--paged N] [--out report.json]
    python3 scripts/seo-parity.py <base-url> --only report.json      # re-check only the URLs that differed last time

Hard fields (count toward parity): status, redirect target, canonical path, robots, title, description, H1.
Soft fields (reported, expected to differ by design): H2 count, JSON-LD types.
The live site is read from the origin (46.28.105.127, Cloudflare answers curl with 403) slowly — the shared WEDOS
pool returns 503 under load. Staging is behind Access: the service token is sent for *.workers.dev hosts.
"""
import concurrent.futures as cf
import html
import json
import random
import re
import subprocess
import sys
import time
from urllib.parse import urlparse

base = sys.argv[1].rstrip('/')
arg = lambda k, d: int(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
N_PRODUCTS, N_BRANDS, N_PAGED = arg('--products', 600), arg('--brands', 150), arg('--paged', 40)
out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else None
REF = (sys.argv[sys.argv.index('--ref') + 1] if '--ref' in sys.argv else 'https://alkoholicky.huy-kenny.workers.dev').rstrip('/')


def creds(f):
    d = {}
    for line in open('/home/kenny/ai/credentials/' + f):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            d[k] = v.strip().strip('"\'')
    return d


sk = creds('.kuponmat-sk-credentials.env')
UA = 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 Chrome/141.0 Safari/537.36 alkoholicky-parity'


def fetch(url, access=False, live=False):
    cmd = ['curl', '-s', '-m', '90', '-A', UA, '-o', '-', '-w', '\n__STATUS__%{http_code} %{redirect_url}', '--max-redirs', '0', url]
    if live and url.startswith('https://alkoholicky.cz') and REF == 'origin':
        # WordPress on the WEDOS origin (Cloudflare challenges Malina)
        cmd[1:1] = ['-k', '--resolve', 'alkoholicky.cz:443:89.221.213.39']
    elif live and url.startswith('https://alkoholicky.cz'):
        cmd[-1] = REF + url[len('https://alkoholicky.cz'):]
    if access:
        cmd[1:1] = ['-H', 'CF-Access-Client-Id: ' + sk['ACCESS_CLIENT_ID_STAGING'], '-H', 'CF-Access-Client-Secret: ' + sk['ACCESS_CLIENT_SECRET_STAGING']]
    for attempt in range(4):
        r = subprocess.run(cmd, capture_output=True, text=True, errors='replace').stdout
        body, _, tail = r.rpartition('\n__STATUS__')
        st, _, loc = tail.partition(' ')
        if not (live and st in ('503', '502', '000', '')):
            return int(st or 0), loc.strip(), body
        time.sleep(3 * (attempt + 1))
    return int(st or 0), loc.strip(), body


def meta(body):
    g = lambda p: (re.search(p, body, re.S | re.I) or [None, ''])[1]
    t = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip().replace(' ', ' ')
    return {
        'title': t(g(r'<title[^>]*>(.*?)</title>')),
        'description': t(g(r'<meta name="description" content="([^"]*)"')),
        'canonical': urlparse(g(r'<link rel="canonical" href="([^"]*)"')).path,
        'robots': re.sub(r'\s+', '', g(r'<meta name="robots" content="([^"]*)"')),
        'h1': t(g(r'<h1[^>]*>(.*?)</h1>')),
        'h2': len(re.findall(r'<h2[\s>]', body)),
        'ld': sorted(set(re.findall(r'"@type"\s*:\s*"([A-Za-z]+)"', ' '.join(re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', body, re.S))))),
    }


HARD = ['title', 'description', 'canonical', 'robots', 'h1']
# --skip title,description: fields changed on purpose in this release are reported as soft
SKIP = (sys.argv[sys.argv.index('--skip') + 1].split(',') if '--skip' in sys.argv else [])
HARD = [k for k in HARD if k not in SKIP]
SOFT = SOFT_BASE = ['h2', 'ld'] + SKIP

only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
# URL sample from the LIVE sitemaps (or the failures of a previous report)
idx = '' if only else fetch('https://alkoholicky.cz/sitemap_index.xml', live=True)[2]
files = re.findall(r'<loc>([^<]+)</loc>', idx)
by = {}
for f in files:
    name = re.sub(r'\d*\.xml$', '', f.rsplit('/', 1)[-1])
    by.setdefault(name, []).extend(urlparse(u).path for u in re.findall(r'<loc>([^<]+)</loc>', fetch(f, live=True)[2]))
    time.sleep(0.3)
random.seed(arg('--seed', 26))
pick = lambda name, n: (by.get(name, []) if n >= len(by.get(name, [])) else random.sample(by[name], n))
cats = by.get('product_cat-sitemap', [])
sample = (pick('post-sitemap', 999) + pick('page-sitemap', 99) + pick('category-sitemap', 99) + cats
          + pick('product_brand-sitemap', N_BRANDS) + pick('product-sitemap', N_PRODUCTS)
          + [c + 'page/2/' for c in cats[:N_PAGED]]
          + ['/blog/page/2/', '/znacka/jagermeister/', '/znacka/becherovka/', '/znacka/karloff-tatratea-tatransky-caj/', '/znacka/monin/page/2/',
             '/neexistuje-xyz/', '/lihoviny/rumy-a-ochucene-rumy/', '/eshop/monin/', '/19-crimes-cali-red-075l-125/', '/alkoholcz/',
             '/z-ceho-se-vyrabi-vodka-prehled-zakladnich-surovin/', '/produkt/monin-mangue-mango-0-7l/', '/category/zajimavosti/', '/rumy-a-ochucene-rumy/page/1/'])
sample = [p for p in dict.fromkeys(sample) if p not in ('/produkt/',)]
if only:
    sample = [r['path'] for r in json.load(open(only)) if r['diff']]
print(f'live sitemap files: {len(files)}, URLs: {sum(len(v) for v in by.values())}; checking {len(sample)}', flush=True)


def check(p):
    time.sleep(0.4)
    a = fetch('https://alkoholicky.cz' + p, live=True)
    b = fetch(base + p, access=base.endswith('workers.dev'))
    res = {'path': p, 'live': a[0], 'new': b[0], 'diff': [], 'soft': []}
    if a[0] != b[0]:
        res['diff'].append(f'status {a[0]} vs {b[0]}')
    elif a[0] in (301, 302, 308):
        if urlparse(a[1]).path != urlparse(b[1]).path:
            res['diff'].append(f'redirect {urlparse(a[1]).path} vs {urlparse(b[1]).path}')
    elif a[0] == 200:
        ma, mb = meta(a[2]), meta(b[2])
        for k in HARD:
            if ma[k] != mb[k]:
                res['diff'].append(f'{k}: {str(ma[k])[:90]!r} vs {str(mb[k])[:90]!r}')
        for k in SOFT:
            if ma[k] != mb[k]:
                res['soft'].append(f'{k}: {ma[k]} vs {mb[k]}')
    return res


with cf.ThreadPoolExecutor(2) as ex:
    results = list(ex.map(check, sample))
bad = [r for r in results if r['diff']]
print(f'identical (hard fields): {len(results) - len(bad)} / {len(results)} = {100 * (len(results) - len(bad)) / max(1, len(results)):.1f} %')
kinds = {}
for r in bad:
    for d in r['diff']:
        kinds[d.split(':')[0].split(' ')[0]] = kinds.get(d.split(':')[0].split(' ')[0], 0) + 1
print('differences by field:', kinds)
for r in bad[:80]:
    print(r['path'], '|', '; '.join(r['diff']))
if out:
    json.dump(results, open(out, 'w'), ensure_ascii=False, indent=1)
