# Deployment

The blog is a **static site** served by Coolify on a VPS, with three side
services: Remark42 (comments), Umami (analytics) and Traefik (reverse proxy +
TLS). This document covers the full production setup.

## Topology

```
Internet ──> Traefik (Coolify proxy, Let's Encrypt TLS)
               ├── blog.mornati.net  ──> Coolify static site  (deploy branch)
               ├── blog.mornati.net/web      ──> Remark42
               ├── blog.mornati.net/script.js ──> Remark42
               └── blog.mornati.net/umami    ──> Umami
Images: git → build → Cloudinary CDN (static/images in repo)
```

## 1. Coolify static site

- **Source:** the `deploy` branch of `mmornati/mornati.net-blog`.
- **Build pack:** None. Coolify only pulls the pushed, pre-built HTML.
- **Publish directory:** `/` (the branch root *is* the site).
- **Domain:** `blog.mornati.net`, HTTPS validated, `redirectTo=www` as desired.

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the
site, syncs images to Cloudinary and force-pushes `public/` to `deploy`.
Coolify auto-redeploys on new commits to that branch.

## 2. Remark42 (comments)

Single container, ~80 MB RAM, comments stored in a single bolt file.

```yaml
# docker-compose.remark42.yml (on the VPS)
services:
  remark42:
    image: umputun/remark42:latest   # v1.16.x
    container_name: remark42
    restart: unless-stopped
    environment:
      REMARK_URL: https://blog.mornati.net
      SITE: blog.mornati.net
      SECRET: ${REMARK_SECRET}
      AUTH_GITHUB_CID: ${GITHUB_OAUTH_CID}
      AUTH_GITHUB_CSEC: ${GITHUB_OAUTH_CSEC}
      ADMIN_PASSWD: ${REMARK_ADMIN_PASSWD}
      # optional e-mail notifications:
      NOTIFY_ADMINS: "email"
      SMTP_HOST: ...
    volumes:
      - remark-data:/srv/var
volumes:
  remark-data:
```

Traefik routes (Coolify "Reverse Proxy" resource, or native labels):

- `Host(blog.mornati.net) && PathPrefix(/web)` → `remark42:8080`
- `Host(blog.mornati.net) && Path(/script.js)` → `remark42:8080`
- `Host(blog.mornati.net) && PathPrefix(/api)` → `remark42:8080`

Enable comments in the site by setting `[params.comments] enabled=true,
provider=remark42, remark42URL=https://blog.mornati.net/web,
remark42SiteId=blog.mornati.net` in `config/_default/params.toml`.

### Importing legacy Hashnode comments

Hashnode's GraphQL API is Pro-gated, so we harvest comments from the **public
HTML** of each post (`__NEXT_DATA__` contains comments + reactions). Outline:

1. Fetch `https://blog.mornati.net/rss.xml`, extract the per-post URLs.
2. For each, scrape `__NEXT_DATA__` → JSON snapshot of comments/reactions.
3. Convert to Disqus XML (comments have author, date, message, parent id).
4. Import: `docker exec remark42 import -f import.xml` (Disqus format).

Keep the snapshot as a non-build artifact (e.g. `_raw/comments-snapshot.json`)
so the history is preserved even before it is imported.

## 3. Umami (analytics)

Single container with bundled Postgres (no separate DB service).

```yaml
# docker-compose.umami.yml (on the VPS)
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://umami:${UMAMI_DB_PASS}@localhost:5432/umami
      APP_SECRET: ${UMAMI_APP_SECRET}
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - umami-data:/app/db-data
volumes:
  umami-data:
```

> Use `:postgresql-latest` **or** a separate Postgres — not both (the
> bundled image already runs Postgres).

Enable in the site: set `[params.umamiAnalytics]` with `websiteid`, `domain`
and `scriptName` in `config/_default/params.toml`, or simply load the Umami
script in `layouts/partials/extend-head.html`.

## 4. Images / Cloudinary

Git is the source of truth (`static/images/`). On deploy, CI:

1. Uploads changed images via `scripts/cloudinary_sync.py`.
2. Rewrites local `/images/...` references in the built HTML to
   `https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/blog/...`.

Configure the three `CLOUDINARY_*` secrets in GitHub. Without them the deploy
still works — images are just served from the VPS itself.

Covers (`cover.*` inside each post folder) always stay on the VPS: they are
Hugo page resources served by Traefik/nginx, kept small.

## 5. DNS cutover

1. Point `blog.mornati.net` (A/AAAA or CNAME) at the VPS.
2. Verify TLS, comments (`/web`), Umami, search (Ctrl+K), RSS (`/rss.xml`).
3. Keep Hashnode live for 30 days as rollback, then set it to private.

EN posts keep their root-level `/slug` URLs — **no redirect needed**. IT/FR
posts moved to `/it/` and `/fr/` and are aliased in the Hugo frontmatter
(`aliases: [/<slug>]` → auto-301) and listed in `build/live-slugs.json` for
bulk verification.

## 6. Maintenance

- **Updates:** `git submodule update --remote` for the theme; bump the Hugo
  pin in `.github/workflows/*.yml` and `Makefile` together.
- **Backups:** the repo *is* the backup (content, config, images in git).
  Remark42 bolt file via the `remark-data` volume; Umami via `umami-data`.
- **Uptime:** run Uptime Kuma (or UptimeRobot) against
  `https://blog.mornati.net/` and `https://blog.mornati.net/web/`.