#!/usr/bin/env python3
"""Firmanazazitky.cz (CJ) has no product feed: reads its sitemap, scrapes the product pages (og:product + the page text)
and POSTs the items to the import Worker (/ingest/firmanazazitky), which classifies them and applies them like a feed run.

    python3 scripts/firmanazazitky-import.py <staging|production> [--limit N]
Run daily from cron (bin/kouzelnydeda-firmanazazitky.sh). Be polite: 4 parallel requests, ~0.2 s apart.
"""
import html, json, re, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

env = sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__)
limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else 0
BASE = 'https://www.firmanazazitky.cz'
CJ = 'https://www.jdoqocy.com/click-100738307-17346622'
UA = 'KouzelnyDedaBot/1.0 (+https://kouzelnydeda.cz; affiliate partner catalogue)'

def get(url, tries=3):
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=40).read().decode('utf8', 'replace')
        except Exception:
            time.sleep(1.5 * (i + 1))
    return ''

urls = [u for u in re.findall(r'<loc>([^<]+)</loc>', get(BASE + '/sitemap.xml')) if not u.endswith('/') and '/blog/' not in u and u.count('/') == 3]
if limit: urls = urls[:limit]
print(len(urls), 'candidate pages')

def clean(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()

def scrape(u):
    time.sleep(0.2)
    s = get(u)
    if 'og:product' not in s: return None
    og = lambda k: (re.search(r'<meta property="og:%s" content="([^"]*)"' % k, s) or [None, ''])[1]
    price = float(og('price:amount') or 0)
    name = html.unescape(og('title')).strip()
    if not name or price <= 0: return None
    body = re.sub(r'<(script|style|noscript|nav|header|footer)[\s\S]*?</\1>', ' ', s)
    txt = clean(body)
    i = txt.find('Na co se budete těšit'); i = i if i >= 0 else txt.find('Na co se budete tesit')
    desc = txt[i + 22:i + 22 + 2600] if i >= 0 else html.unescape(og('description'))
    for stop in (' Co se bude dít', ' Zobrazit všechna hodnocení', ' Podobné zážitky', ' Další zážitky', ' Často kladené'):
        k = desc.find(stop, 400)
        if k > 0: desc = desc[:k]
    desc = re.sub(r'(?<=[.!?]) ', '\n', desc.strip())
    lead = html.unescape(og('description')).rstrip('.').rstrip('…').strip()
    valid = re.search(r'Platnost poukazu do (\d{1,2})\.(\d{1,2})\.(\d{4})', txt)
    meta = re.search(r'(Celoročně|Sezónně)[^.]*\.[^A-Z]*', txt)
    imgs, seen = [], set()
    for m in re.findall(r'(?:src|href)="((?:https://www\.firmanazazitky\.cz)?/obrazek/[^"]+?\.(?:jpg|jpeg|png))"', s):
        m = m if m.startswith('http') else BASE + m
        key = re.sub(r'_\d+x\d+', '', m).split('-')[-1][:12] + m.split('/')[-1][:10]
        if m not in seen: seen.add(m); imgs.append(urllib.parse.quote(m, safe=':/%'))
    crumbs = re.findall(r'"name":\s*"([^"]+)"', s)
    cat = crumbs[1] if len(crumbs) > 2 else ''
    info = {'d': desc or lead, 'h': lead or None}
    if valid: info['ve'] = '%s-%02d-%02d' % (valid[3], int(valid[2]), int(valid[1]))
    if meta: info['pa'] = [['Termín a rozsah', meta.group(0).strip(' .')]]
    return {'ext': u.rstrip('/').split('/')[-1], 'name': name, 'target': CJ + '?sid=' + u.rstrip('/').split('/')[-1][:40] + '&url=' + urllib.parse.quote(u, safe=''),
            'image': imgs[0] if imgs else (og('image') or ''), 'images': imgs[1:7], 'price': price, 'excerpt': lead[:300],
            'catText': f'{name} {cat} {lead}', 'info': {k: v for k, v in info.items() if v}}

with ThreadPoolExecutor(4) as ex: items = [x for x in ex.map(scrape, urls) if x]
print(len(items), 'products scraped')
if len(items) < 50: sys.exit('too few products — page layout changed?')
creds = {}
for line in open('/home/kenny/ai/credentials/.kouzelnydeda-credentials.env'):
    if '=' in line and not line.startswith('#'):
        k, v = line.strip().split('=', 1); creds[k] = v.strip('"\'')
host = 'kouzelnydeda-import-staging.huy-kenny.workers.dev' if env == 'staging' else 'kouzelnydeda-import.huy-kenny.workers.dev'
req = urllib.request.Request(f'https://{host}/ingest/firmanazazitky?force=1', data=json.dumps(items).encode(), method='POST',
                             headers={'Authorization': 'Bearer ' + creds['IMPORT_SHARED_SECRET_' + env.upper()], 'Content-Type': 'application/json', 'User-Agent': 'kd-ingest/1.0'})
print(urllib.request.urlopen(req, timeout=280).read().decode()[:300])
