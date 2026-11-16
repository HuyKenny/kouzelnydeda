#!/usr/bin/env python3
"""Insert blog posts from JSON files into the production D1 (posts + slugs), with a Pexels featured image each.

    python3 scripts/vlozit-clanky.py <dir with *.json> [--apply]

JSON: {slug, title, seo_title, seo_desc, excerpt, image_query, image_alt, content_html}. Without --apply only validates.
Checks: internal links must point to a live slug (slugs table or a slug in the same batch), no "sleva", seo_title <= 60 chars.
Images go to public/wp-content/uploads/2026/11/<slug>(.webp|-768.webp) (deploy the web afterwards). PEXELS_API_KEY comes from
credentials/.alkoholicky-credentials.env. Never prints secrets.
"""
import io, json, os, re, subprocess, sys, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CRED = Path('/home/kenny/ai/credentials')
NODE = '/home/kenny/.nvm/versions/node/v22.23.1/bin'


def env(files):
    e = {}
    for f in files:
        for line in (CRED / f).read_text().splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                k, v = line.split('=', 1); e.setdefault(k.strip(), v.strip().strip('"\''))
    return e


def d1(sql=None, file=None):
    e = env(['.cloudflare-credentials.env', '.kouzelnydeda-credentials.env'])
    ev = dict(os.environ, PATH=NODE + ':' + os.environ['PATH'], CLOUDFLARE_EMAIL=e['CF_EMAIL'], CLOUDFLARE_API_KEY=e['CF_GLOBAL_API_KEY'], CLOUDFLARE_ACCOUNT_ID=e['CF_ACCOUNT_ID'])
    a = ['npx', 'wrangler', 'd1', 'execute', 'DB', '--env', 'production', '--remote', '--json'] + (['--command', sql] if sql else ['--file', file])
    r = subprocess.run(a, cwd=ROOT, env=ev, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except Exception:
        sys.exit('D1 failed: ' + r.stdout[-300:] + r.stderr[-300:])


def esc(s):
    return "'" + s.replace("'", "''") + "'"


def pexels(query, slug):
    from PIL import Image
    key = env(['.alkoholicky-credentials.env'])['PEXELS_API_KEY']
    r = json.load(urllib.request.urlopen(urllib.request.Request('https://api.pexels.com/v1/search?' + urllib.parse.urlencode({'query': query, 'per_page': 8, 'orientation': 'landscape'}), headers={'Authorization': key, 'User-Agent': 'kd'}), timeout=30))
    if not r['photos']:
        sys.exit(f'no Pexels photo for {query}')
    p = r['photos'][0]
    im = Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(p['src']['large2x'], headers={'User-Agent': 'kd'}), timeout=60).read())).convert('RGB')
    out = ROOT / 'public/wp-content/uploads/2026/11'; out.mkdir(parents=True, exist_ok=True)
    im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS); im.save(out / f'{slug}.webp', 'WEBP', quality=78)
    im.resize((768, round(im.height * 768 / im.width)), Image.LANCZOS).save(out / f'{slug}-768.webp', 'WEBP', quality=78)
    return im.size


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    files = sorted(Path(sys.argv[1]).glob('*.json'))
    apply = '--apply' in sys.argv
    posts = [json.loads(f.read_text()) for f in files]
    live = {r['slug'] for r in d1("SELECT slug FROM slugs")[0]['results']}
    batch = {p['slug'] for p in posts}
    taken = [p['slug'] for p in posts if p['slug'] in live]
    if taken:
        print('slug already exists (will be skipped):', taken)
    bad = 0
    for p in posts:
        h = p['content_html']
        links = re.findall(r'href="/([a-z0-9-]+)/?"', h)
        miss = [l for l in links if l not in live and l not in batch]
        words = len(re.sub(r'<[^>]+>', ' ', h).split())
        items = len(re.findall(r'<li>|<blockquote>', h))
        probs = []
        if miss: probs.append(f'dead links {miss}')
        if re.search(r'sleva|slevy|slevu', h + p['title'] + p['seo_desc'], re.I): probs.append('word sleva')
        if len(p['seo_title']) > 60: probs.append(f"seo_title {len(p['seo_title'])}")
        if not 120 <= len(p['seo_desc']) <= 160: probs.append(f"seo_desc {len(p['seo_desc'])}")
        if '<h1' in h: probs.append('h1 in body')
        print(f"{p['slug']}: {words} words, {items} items, {len(links)} links" + (' !! ' + '; '.join(probs) if probs else ' ok'))
        bad += bool(probs)
    if bad or not apply:
        sys.exit('fix problems first' if bad else 'dry run (use --apply)')
    mx = d1("SELECT max(id) m FROM posts")[0]['results'][0]['m']
    sql = []
    for p in posts:
        if p['slug'] in live:
            continue
        mx += 1
        w, h = pexels(p['image_query'], p['slug'])
        img = f"/wp-content/uploads/2026/11/{p['slug']}.webp"; card = f"/wp-content/uploads/2026/11/{p['slug']}-768.webp"
        sql.append("INSERT INTO posts (id, type, slug, title, content_html, excerpt, published_at, modified_at, cat_id, image, image_card, image_alt, image_w, image_h, author, noindex, seo_title, seo_desc, seo_robots, canonical, offers_cat, ld_json, status) VALUES "
                   f"({mx}, 'post', {esc(p['slug'])}, {esc(p['title'])}, {esc(p['content_html'])}, {esc(p['excerpt'])}, datetime('now'), datetime('now'), 431, {esc(img)}, {esc(card)}, {esc(p['image_alt'])}, {w}, {h}, 'Jan', 0, {esc(p['seo_title'])}, {esc(p['seo_desc'])}, '', '', '', '', 'publish');")
        sql.append(f"INSERT INTO slugs (slug, kind, ref_id) VALUES ({esc(p['slug'])}, 'post', {mx});")
    if not sql:
        sys.exit('nothing to insert')
    f = Path('/tmp/kdw/insert-posts.sql'); f.write_text('\n'.join(sql))
    d1(file=str(f))
    print('inserted', len(sql) // 2, 'posts')


main()
