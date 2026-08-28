---
title: 'Migrating My Blog from Hashnode to Self-Hosted Hugo on Coolify'
categories:
- web-dev-blogging
- devops
tags:
- hashnode
- hugo
- blowfish
- coolify
- ovh
- vps
- self-hosting
- migration
- cloudinary
- remark42
- umami
- docker
- github-actions
date: '2026-08-16T12:00:00.000000+00:00'
slug: migrating-from-hashnode-to-hugo-with-coolify
translationKey: migrating-from-hashnode-to-hugo-with-coolify
description: How I moved 195 posts off Hashnode to a self-hosted Hugo + Blowfish blog
  on an OVH VPS behind Coolify — preserving every URL, syncing images to Cloudinary,
  and shipping the whole stack for €60/year.
cover: cover.jpg
showHero: true
---

After seven years of writing on Hashnode, the platform that had hosted my blog
since 2019 finally started to feel like a cage rather than a comfort. I had
outgrown the free tier, the Pro plan was a recurring drain for features I never
used, and every time I wanted to do something different — custom analytics,
self-hosted comments, full ownership of my images — I ran into a paywall or a
"feature not available on your plan" error. Worse: my old comments and
reactions were behind a GraphQL API gated to Pro. I owned nothing.

This post is the story of the migration I just shipped: **195 blog posts**
moved from Hashnode to a self-hosted [Hugo](https://gohugo.io) site on a
[Blowfish](https://blowfish.page) theme, deployed via
[Coolify](https://coolify.io) to an [OVH VPS](https://www.ovhcloud.com/fr/vps/),
with self-hosted comments ([Remark42](https://remark42.com)),
self-hosted analytics ([Umami](https://umami.is)), and a
[Cloudinary](https://cloudinary.com) CDN for body images — **all of it running
for about €60 / year**, less than a single year of Hashnode Pro.

If you're weighing the same jump, here is everything I learned, including the
parts I had to figure out the hard way.

## The hard requirements I wrote down before touching code

I am an engineer. I don't migrate for fun. Before deleting anything on
Hashnode, I pinned the non-negotiables to a notepad:

1. **I own the data.** Markdown source, images, comments, analytics — all
   under my control, in plain files, in git or a self-hosted database.
2. **Zero broken URLs.** Seven years of inbound links, search-engine ranking
   and Reddit/ Hacker News traffic depend on `/<slug>/` resolving to the
   right post. EN, IT and FR posts included.
3. **Three languages, one codebase.** English at the root, Italian under
   `/it/`, French under `/fr/`, all in the same repository.
4. **No monthly subscription for the platform itself.** Cloudinary and a
   domain name are fine; a CMS SaaS is not.
5. **Self-hosted comments and analytics.** No third-party tracking, no
   Disqus ads.
6. **One VPS, Docker-based.** I already rent an OVH VPS for other things —
   the blog has to live next to them, behind the same reverse proxy.
7. **Deploy with `git push`.** No FTP, no manual SSH, no copy-paste of HTML
   files.

Those seven lines turned out to be the most useful artifact of the whole
project: every later decision either satisfied them, or got cut.

## The final stack

| Concern              | Technology                                                     |
|----------------------|----------------------------------------------------------------|
| Static site          | Hugo `0.164.0` (extended) + Blowfish theme (git submodule)     |
| Image CDN            | Cloudinary (`f_auto,q_auto` delivered URLs)                     |
| Comments             | Remark42 (single container, BoltDB on a Coolify volume)         |
| Analytics            | Umami + PostgreSQL (two Coolify resources)                      |
| Reverse proxy / TLS  | Traefik (Coolify built-in, Let's Encrypt)                       |
| CI / CD              | GitHub Actions (Hugo build + `peaceiris/actions-gh-pages@v4`)  |
| Deploy target        | Coolify "Static" resource pointing at a `deploy` branch         |
| Server               | OVH VPS (legacy plan, €60 TTC / year)                           |

Everything below that line is open-source and self-hosted. The only recurring
cost is the VPS plus a few dollars of Cloudinary transformations per month.

## Why Hugo + Blowfish

I had two finalists: Hugo and Astro. Hugo won for three reasons:

* **Build speed.** Two hundred multilingual posts, with image processing,
  build in under three seconds on my laptop. Astro is also fast, but Hugo's
  single static binary was simpler to ship in a Docker image.
* **Native multilingual.** Hugo treats languages as a first-class concept
  with `defaultContentLanguage`, language-specific menus, taxonomies, and
  output formats. Astro requires more boilerplate to do the same thing.
* **Blowfish.** A theme that already ships with code-copy buttons, Fuse.js
  search (`Ctrl+K`), a card grid, related-posts, hero images, Open Graph
  metadata, dark mode, and a really clean reading layout. I would have had
  to assemble all of that by hand on Astro.

One small breaking change to be aware of: **Blowfish v2.105 dropped the
legacy `[params.comments] provider = "remark42"` config block.** Comments now
come from a user-provided `layouts/partials/comments.html` plus the boolean
`[article] showComments = true`. The partial I ship is short — it reads
`site.Params.remark42.host` and injects the embed script. With an empty
`host` the partial renders nothing, so local previews stay clean.

## Why Coolify on OVH

Coolify is the open-source, self-hosted answer to Heroku / Vercel / Render.
It is a Docker Compose orchestrator with a web UI: each "resource" is a
container (or a static site), Traefik fronts everything, Let's Encrypt
certificates are issued automatically, and the UI handles scheduled
backups. I have one Coolify instance and one VPS — anything I deploy lands
on the same reverse proxy, on the same domain, behind the same certificate.

The OVH VPS angle is just cost. My current bill is **€60 TTC / year**, on a
legacy plan I have been renewing for years. For reference, the published
prices on `ovhcloud.com/fr/vps/` for the new **VPS 2027** range today are:

| Tier       | vCores | RAM   | SSD      | Bandwidth        | HT / month | **TTC / month** | ~ / year |
|------------|--------|-------|----------|------------------|------------|-----------------|----------|
| VPS-1      | 2      | 4 Go  | 40 Go    | 500 Mbit/s       | 3,81 €     | **4,57 €**      | ~ 55 €   |
| **VPS-2**  | **4**  | **8 Go** | **75 Go** | **1 Gbit/s**     | **7,21 €** | **8,65 €**      | **~ 104 €** |
| VPS-3      | 6      | 12 Go | 100 Go   | 2 Gbit/s         | 10,40 €    | 12,48 €         | ~ 150 €  |
| VPS-4      | 8      | 24 Go | 200 Go   | 3 Gbit/s         | 19,96 €    | 23,95 €         | ~ 287 €  |

All tiers include anti-DDoS and an automated daily backup; traffic is
unmetered. **VPS-2 is the sweet spot** for a blog + Remark42 + Umami +
Postgres stack. My old plan is even cheaper because it predates the 2027
range — proof that OVH does grandfather pricing when you stay put.

Bottom line: **the entire stack costs about €5 a month** to run, less than a
single year of Hashnode Pro, with full ownership of every byte.

## The migration script: what `scripts/migrate.py` actually does

The single most useful piece of code in this whole project is a Python
script that turns a Hashnode GitHub-backup export into a Hugo
multilingual content tree. Hashnode has a "Backup Posts" feature in the
dashboard that produces a Git repository of every post as a `.md` file with
its YAML front matter. I cloned that into `_raw/blog-posts/` (gitignored,
read-only) and ran:

```bash
python3 scripts/migrate.py --workers 24
```

What it does, step by step:

1. **Parses YAML front matter**, with a tolerant fallback for the
   unescaped-quote cases Hashnode sometimes writes (`title: "foo "bar""`,
   which is not valid YAML).
2. **Detects the language** of each post with a hand-tuned token scorer
   (Italian stop-words weighted higher than French, French higher than
   English). It samples the title plus the first/last 1500 characters of the
   body and declares a winner when the score gap is big enough; otherwise
   the post defaults to English. Re-runnable: every `(lang, slug)` already
   written is tracked in-memory and skipped.
3. **Downloads every body image and every cover** concurrently with a
   `ThreadPoolExecutor` (24 workers). The thread-safe URL → local-path
   cache means the same image referenced from three posts is downloaded
   once. Files end up under `static/images/<slug>/NN-name.ext`, where `NN`
   is the order of appearance in the markdown.
4. **Rewrites remote URLs to local paths** in the markdown — both the
   `![alt](https://cdn.hashnode.com/...)` form and raw `<img>` tags
   (cleaned up to markdown so the downloader can see them). On download
   failure, the original URL is preserved so the post is never broken.
5. **Writes Hugo page bundles** at `content/{en,it,fr}/posts/<slug>/index.md`
   with the cover saved next to it as a Hugo page resource:

   ```text
   content/en/posts/<slug>/index.md
   content/en/posts/<slug>/cover.jpg
   ```

   For non-English posts it also adds `url: /<lang>/<slug>/` and
   `aliases: [/<slug>]` to the front matter, so Hugo can wire the
   redirects.

A run on my 195 posts took 22 seconds — most of that waiting on Hashnode's
`cdn.hashnode.com` to serve the images. The script emits
`build/migration-report.json` and `build/failures-images.log` so you know
exactly which posts and which images had problems.

## Backward compatibility: zero broken URLs

This was the part I was most afraid of, and where I spent the most care.
Hashnode served every post at `https://blog.mornati.net/<slug>/`. Seven
years of backlinks, dozens of Reddit and Hacker News threads, a couple of
podcasts that linked to specific posts — all of those URLs had to keep
working.

### English posts: nothing to do

Hugo's permalinks config kept English posts at the blog root:

```toml
# config/_default/hugo.toml
[permalinks]
  posts = "/:slug"
```

Every post under `content/en/posts/<slug>/index.md` therefore lives at
`https://blog.mornati.net/<slug>/` — exactly the URL Hashnode used. **Zero
redirects, zero SEO loss.**

### Italian and French posts: aliases plus a redirect generator

Italian and French posts had to move under `/it/` and `/fr/` because Hugo's
multilingual mode scopes page URLs under the language prefix. The
front matter for a translated post looks like this:

```yaml
---
title: 'Migrer de Hashnode vers Hugo avec Coolify'
slug: migrer-de-hashnode-vers-hugo-avec-coolify
translationKey: migrating-from-hashnode-to-hugo-with-coolify
url: /fr/migrer-de-hashnode-vers-hugo-avec-coolify/
aliases:
  - /migrer-de-hashnode-vers-hugo-avec-coolify
---
```

Here's the catch: **Hugo applies `aliases` under the page's language
prefix**, so for a French page an alias `/migrer-de-hashnode-vers-hugo-avec-coolify`
is rendered at `/fr/migrer-de-hashnode-vers-hugo-avec-coolify/`, never at the
root. That is a problem for me — the old Hashnode URL was at the root.

The fix is a 150-line Python script that runs *after* `hugo`:

```bash
hugo --minify --gc
python3 scripts/generate_redirects.py
```

It walks every Italian and French post, reads its `url` and `aliases`, and
writes a tiny meta-refresh HTML stub at `public/<old-slug>/index.html`
pointing at the canonical `/it/<slug>/`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=/it/migrer-de-hashnode-vers-hugo-avec-coolify/">
<link rel="canonical" href="/it/migrer-de-hashnode-vers-hugo-avec-coolify/">
<title>Redirecting…</title>
</head>
<body><p>Moved. <a href="/it/migrer-de-hashnode-vers-hugo-avec-coolify/">Go to /it/migrer-de-hashnode-vers-hugo-avec-coolify/</a>.</p></body>
</html>
```

Same script also handles a tag-page rename I didn't even know was coming:
Hashnode used `/tag/<name>`, Blowfish uses `/tags/<name>`. For every tag in
the site it generates `public/tag/<name>/index.html` redirecting to
`/tags/<name>/`. CI asserts both kinds of stubs exist:

```yaml
# .github/workflows/ci.yml
- test -f public/blog-da-iphone/index.html
- test -f public/tag/docker/index.html
```

### RSS: keep the old path

Hashnode served the feed at `/rss.xml`. Hugo's default RSS output is
`/index.xml`, which would have broken every podcast-subscriber URL out
there. Two lines in `config/_default/hugo.toml` fix it:

```toml
[outputFormats]
  [outputFormats.RSS]
    mediatype = "application/rss+xml"
    baseName = "rss"

[outputs]
  home = ["HTML", "RSS", "JSON"]
```

Result: the feed is at `/rss.xml`, exactly where subscribers expect it.

### Net result

Every single one of the 195 old URLs resolves to a 200 OK, in the right
language, on the right page. CI proves it for the multilingual ones; the
EN ones need no proof because Hugo's permalinks did the work. Search
engines will follow the meta-refresh and canonical link to the new URL, and
the 30-day Hashnode grace window gives me a safety net during the cutover.

## Images: Cloudinary with a graceful local fallback

I have **years** of inline screenshots, diagrams and photos inside posts.
Hashnode's CDN was generous but proprietary; bringing all of those bytes
into my own VPS would have meant serving gigabytes of static files from a
single 1 Gbit/s link. I split the problem in two:

* **Cover images** stay on the VPS. They live as Hugo page resources
  (`content/<lang>/posts/<slug>/cover.{jpg,png}`) and are served directly
  by Traefik. They are small, on the critical path of every listing page,
  and benefit from nginx's sendfile + gzip.
* **Body images** are stored in git under `static/images/<slug>/`, but at
  build time their `/images/foo/bar.jpg` references in the generated HTML
  are rewritten to
  `https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/blog/foo/bar.jpg`.
  Cloudinary's `f_auto` serves AVIF/WebP to browsers that support it, and
  `q_auto` finds a sensible quality per image — a measurable win for pages
  with lots of inline images.

The sync script is `scripts/cloudinary_sync.py`. It is git-ops: it walks
`static/images/`, computes a `sha256` for every file, uploads only the
files whose digest changed (state persisted in
`build/cloudinary.synced.json`, gitignored locally and restored in CI
through `actions/cache@v4` keyed on the image tree plus the script), then
rewrites the built HTML to swap the local URLs for Cloudinary delivery
URLs.

### Backward compatibility with zero Cloudinary secrets

The deploy workflow guards the Cloudinary step with an `if`:

```yaml
# .github/workflows/deploy.yml
- name: Sync images to Cloudinary + rewrite HTML
  if: env.CLOUDINARY_CLOUD_NAME != ''
  env:
    CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
    CLOUDINARY_API_KEY:    ${{ secrets.CLOUDINARY_API_KEY }}
    CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
  run: python3 scripts/cloudinary_sync.py
```

If the three `CLOUDINARY_*` secrets are missing, the step is skipped
entirely and the local `/images/...` URLs make it through to production
unchanged. **The site still works on the VPS alone.** That is what made
the migration safe to roll out in slices: I could deploy the code first,
watch every post still load over the old local path, then turn on
Cloudinary once I was confident the rewrite was right.

### Dead-link artifacts, gracefully skipped

Some of the old Hashnode CDN URLs now return HTML error pages saved with
an image extension. The script refuses to upload them — it inspects the
first 12 bytes of every file and only treats it as an image if it sees a
PNG / JPEG / GIF / WEBP / AVIF / SVG magic header. Non-images are
permanently marked as `dead: true` in the sync state so they are never
retried.

## CI / CD: `git push` is the whole story

The deploy pipeline is `.github/workflows/deploy.yml`. It runs on every
push to `main` (filtered to content, config, layouts, assets, static and
the theme submodule) and on `workflow_dispatch`. Steps:

1. **Checkout** with submodules.
2. **Setup Hugo** to `0.164.0` extended via `peaceiris/actions-hugo@v3`.
3. **Build** the site, then run `python3 scripts/generate_redirects.py`
   to write the meta-refresh stubs.
4. **Cache** `build/cloudinary.synced.json` across runs (keyed on the
   image tree + script).
5. **Sync images to Cloudinary** if the secrets are present.
6. **Publish** the resulting `./public` to a `deploy` branch with
   `peaceiris/actions-gh-pages@v4`, using `force_orphan: true` so the
   branch always mirrors the latest build exactly.

Coolify is configured (one-time, via the web UI) as a **Static resource**
pointing at the public repository, branch `deploy`, build pack **None**,
publish directory `/`. Every push to `main` rebuilds the site, force-pushes
`public/` to `deploy`, and Coolify auto-redeploys on the new commit. The
VPS does not run Hugo, does not have Go installed, and does not build
anything.

A second workflow, `.github/workflows/ci.yml`, runs on PRs and on push
to `main` and validates the build:

```yaml
- test -f public/index.html
- test -f public/index.json
- test -d public/it/posts
- test -d public/fr/posts
- POSTS=$(find public -path '*/posts/*' -name index.html | wc -l)
- test -f public/blog-da-iphone/index.html
- test -f public/tag/docker/index.html
```

If any of those assertions fail, the PR is blocked.

## Coolify: one resource per service

The whole server-side setup is documented in `DEPLOYMENT.md` of the
repository. From the Coolify dashboard I create **four** resources:

### 1. Static site (the blog itself)

* **Source:** Public repository — `https://github.com/mmornati/mornati-blog`.
* **Branch:** `deploy` (auto-pushed by the deploy workflow).
* **Build pack:** None.
* **Publish directory:** `/`.
* **Domain:** `blog.mornati.net` with HTTPS via Traefik / Let's Encrypt.

### 2. Remark42 (comments)

One `umputun/remark42:latest` container — a single Go binary, single BoltDB
file, ~80 MB of RAM. Environment:

```env
REMARK_URL=https://blog.mornati.net
SITE=blog.mornati.net
SECRET=<random 32+ chars>          # signs auth tokens — keep secret
AUTH_GITHUB_CID=<GitHub OAuth App client id>
AUTH_GITHUB_CSEC=<GitHub OAuth App secret>
ADMIN_PASSWD=<basic-auth password for the /web admin>
```

Persistent volume: `remark-data:/srv/var`. Traefik routes `/web`,
`/script.js`, `/remark` and `/api` to it.

### 3. Umami + PostgreSQL

⚠️ **The `ghcr.io/umami-software/umami:postgresql-latest` image does NOT
bundle Postgres** — it is a plain Next.js build that expects a reachable
Postgres via `DATABASE_URL`. I lost an hour on this before I inspected the
image and realised `scripts/start-docker.sh` runs a `check-db.js` migration
check with no Postgres binaries inside. So you need **two** Coolify
resources:

* A Postgres database (Coolify → Database → Postgres), user `umami`,
  database `umami`, password rotated into `UMAMI_DB_PASSWORD`.
* The Umami app, with `DATABASE_URL=postgresql://umami:<pass>@<host>:5432/umami`,
  `DATABASE_TYPE=postgresql`, `HASH_SALT=<random>`, `APP_SECRET=<random>`,
  `TRACKER_SCRIPT_NAME=script.js`. Internal port 3000, Traefik route
  `Host(\`blog.mornati.net\`) && PathPrefix(\`/umami\`)` → umami:3000.

The actual Postgres data lives on the database resource's volume (the real
path is `/var/lib/postgresql/data`, not `/app/db-data` as some old tutorials
say).

### 4. Site-side wiring (already in the repo)

* `layouts/partials/comments.html` injects the Remark42 embed script.
* `config/_default/params.toml` sets `showComments = true` under `[article]`
  and `[remark42] siteId = "blog.mornati.net"`.
* Setting `host = "https://blog.mornati.net/web"` under `[remark42]` flips
  comments on. Keep it empty (the default in `params.toml`) until you are
  ready — the partial renders nothing locally.

## DNS cutover & rollback

The cutover is the moment of truth. The order matters:

1. **Deploy the code** to Coolify while Hashnode is still live — the new
   site runs on a different origin so nothing collides.
2. **Verify everything**: HTTPS, `/rss.xml`, the search shortcut (`Ctrl+K`),
   a test comment, Umami tracking, mobile rendering.
3. **Point `blog.mornati.net`** (A or CNAME) at the VPS IP.
4. **Watch the logs** for 24 hours: any 404 in the access log is a redirect
   stub I forgot to generate.
5. **Keep Hashnode live** for 30 days as a safety net. If something goes
   catastrophically wrong, point DNS back. After 30 days, set the Hashnode
   blog to private.

Because EN posts keep their root URLs and IT/FR posts get meta-refresh
stubs, the cutover is invisible to visitors and to search engines.

## Adding a new post from scratch

Once the platform is up, authoring a new post is the easiest part of the
whole project:

1. Create `content/en/posts/<slug>/index.md` (or `it` / `fr`) with the
   usual Hugo front matter and the same `translationKey` as the other
   translations.
2. Drop a `cover.{jpg,png}` next to `index.md` — Blowfish uses it as the
   hero image on the post page and as the card image on listings.
3. Drop inline images under `static/images/<slug>/NN-name.ext` and
   reference them as `/images/<slug>/NN-name.ext` in the markdown.
4. `git add . && git commit -m "New post: <title>" && git push`
5. GitHub Actions builds, syncs images, force-pushes the `deploy` branch;
   Coolify auto-redeploys. **No human action on the server.**

That is the day-to-day. The terminal is for git; the server is invisible.

## Local development

I do all my editing directly against `main`. For previewing a change before
pushing:

```bash
make serve        # docker compose up --build -> http://localhost:8080
make build        # Hugo in docker, output in ./public
make migrate      # re-run the P1 migration from _raw/blog-posts
make cloudinary   # upload local images + rewrite HTML
```

The local `docker-compose.yml` builds the same multi-stage `Dockerfile`
used in CI: a `hugomods/hugo:0.164.0` builder, a `python:3.12-alpine`
post-processor (Cloudinary rewrite + root redirects), and a final
`nginx:1.27-alpine` server. `make serve` therefore mirrors the production
container stack exactly — including the `f_auto,q_auto` image
transformation when the `CLOUDINARY_CLOUD_NAME` build arg is set.

## Costs & verdict

Here is the bill for the new platform, taken straight from my account:

* **OVH VPS**: €60 TTC / year (legacy plan, well below today's VPS-1 tier
  at 4,57 € TTC / month).
* **Cloudinary**: free tier covers the blog for now; I pay a few dollars a
  month only if a viral post drives heavy transformation volume.
* **Domain name**: ~€12 / year. (Unrelated to the migration.)
* **Hugo, Blowfish, Remark42, Umami, PostgreSQL, Coolify, Traefik,
  Let's Encrypt**: €0.

Compared to the recurring Hashnode Pro subscription that I no longer
needed, **I am ahead on day one**. The real win isn't the saving though —
it's owning every byte, every URL, every deploy, every comment. If
Hashnode disappeared tomorrow, my blog would not even blink.

## Resources

* Repository: <https://github.com/mmornati/mornati-blog>
* Deployment runbook: `DEPLOYMENT.md` in the same repo
* Migration script: `scripts/migrate.py` (re-runnable, idempotent)
* Cloudinary sync: `scripts/cloudinary_sync.py`
* Redirect generator: `scripts/generate_redirects.py`
* [Hugo](https://gohugo.io/) · [Blowfish theme](https://blowfish.page)
* [Coolify](https://coolify.io/) · [Traefik](https://traefik.io/)
* [OVH VPS](https://www.ovhcloud.com/fr/vps/) · [Cloudinary](https://cloudinary.com/)
* [Remark42](https://remark42.com/) · [Umami](https://umami.is/)

If you are about to do the same jump: pin your requirements, write the
migration script first, treat URL preservation as a non-negotiable, and
let Cloudinary be an optimisation you can switch off. Everything else is
details — pleasant ones, but details.