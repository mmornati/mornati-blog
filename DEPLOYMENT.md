# Deployment

The blog is a **static site** served by Coolify on a VPS, with three side
services: Remark42 (comments), Umami (analytics) and the Coolify built-in
Traefik (reverse proxy + TLS). This document is the complete runbook to
recreate the production setup — every resource you must create in Coolify.

> This supersedes the old `docs.md` migration spec (now gitignored). The repo
> has already been migrated and pushed to `mmornati/mornati-blog`; what
> remains is the server-side setup described below.

## Topology

```
Internet ──> Traefik (Coolify proxy, Let's Encrypt TLS)
               ├── blog.mornati.net  ──> Coolify static site (deploy branch)
               ├── blog.mornati.net/web  ──> Remark42
               ├── blog.mornati.net/script.js ──> Remark42
               ├── blog.mornati.net/remark  ──> Remark42
               └── blog.mornati.net/umami ──> Umami
Images: git → GH Actions → Cloudinary CDN (bodies) / VPS (covers)
```

## 1. Coolify static site (the blog)

Create one resource in Coolify. Under **Dashboard → New Resource → Private /
Public Repository**:

- **Source:** Public repository — `https://github.com/mmornati/mornati-blog`.
  (Repo is public, so **no GitHub App is required**; a Webhook-based source
  also works. The GitHub App is only needed for private repos.)
- **Branch:** `deploy` — this branch is auto-pushed by
  `.github/workflows/deploy.yml` with the pre-built HTML.
- **Build pack:** **None** (or use `Static` without a build command). Coolify
  only pulls the committed HTML; there is nothing to build server-side.
- **Publish directory:** `/` (the branch root *is* the site).
- **Domain:** `blog.mornati.net` → enable HTTPS (Let's Encrypt via Traefik).

DNS: point `blog.mornati.net` (A or CNAME) at the VPS IP. Nothing else is
needed — every push to `main` triggers `deploy.yml`, which builds the site,
syncs images to Cloudinary and force-pushes `public/` to `deploy`. Coolify
auto-redeploys on the new commit.

## 2. Remark42 (comments)

**One container** — do NOT use the repo Dockerfile/compose for this (those
are only for local preview). Create **New Resource → Docker Image**:

- Image: `umputun/remark42:latest` (v1.16.x, ~80 MB RAM, single bolt file)
- **Environment:**
  - `REMARK_URL=https://blog.mornati.net`
  - `SITE=blog.mornati.net`
  - `SECRET=<random 32+ chars>` (used to sign auth tokens — keep secret)
  - `AUTH_GITHUB_CID=<GitHub OAuth App client id>`
  - `AUTH_GITHUB_CSEC=<GitHub OAuth App secret>`
  - `ADMIN_PASSWD=<basic-auth password for the /web admin>`
  - optional: `NOTIFY_ADMINS=email`, `SMTP_HOST=...`
- **Volumes:** persist `/srv/var` (the bolt DB). In Coolify, add a volume
  `remark-data:/srv/var`.
- **Ports:** internal port kept hidden; Traefik routes `/web`, `/script.js`,
  `/remark` and `/api` to it (see the "Extra domains / labels" field on the
  resource or a separate **Reverse Proxy** resource):

  - `Host(\`blog.mornati.net\`) && PathPrefix(\`/web\`)` → remark42:8080
  - `Host(\`blog.mornati.net\`) && Path(\`/script.js\`)` → remark42:8080
  - `Host(\`blog.mornati.net\`) && PathPrefix(\`/api\`)` → remark42:8080

**Site-side wiring (already done in this repo):**

- `layouts/partials/comments.html` embeds Remark42 (Blowfish v2.105 removed
  the old `[params.comments] provider=` config; comments now come from a
  user-provided partial + `article.showComments`).
- `config/_default/params.toml`: `showComments = true` under `[article]`, and
  `[remark42] siteId = "blog.mornati.net"`.
- **To turn comments on:** set `host = "https://blog.mornati.net/web"` under
  `[remark42]` in `params.toml`, commit + push. Until then the partial renders
  nothing (safe locally).

### Importing legacy Hashnode comments

Hashnode's GraphQL API is Pro-gated, so comments/reactions are harvested from
the **public HTML** of each post (`__NEXT_DATA__`):

1. Fetch `https://blog.mornati.net/rss.xml` (or the 4 sitemap pages) → post URLs.
2. Scrape each post page → JSON snapshot of comments/reactions (keep it as a
   non-build artifact, e.g. `_raw/comments-snapshot.json`).
3. Convert to Disqus XML (author, date, message, parent id).
4. Import: `docker exec remark42 import -f import.xml` (Disqus format).

Reactions (likes) are captured in the snapshot but Remark42 cannot display
them as-is; present them statically if desired.

## 3. Umami (analytics)

⚠️ **Corrected finding:** `ghcr.io/umami-software/umami:postgresql-latest`
does **NOT** bundle a Postgres — it is a plain Next.js build that requires a
reachable Postgres via `DATABASE_URL` (verified by inspecting the image:
`scripts/start-docker.sh` runs a `check-db.js` migration check, no Postgres
binaries inside). So you need **two** resources:

1. **Postgres database** — Coolify: **New Resource → Database → Postgres**.
   Give it a user/db/password (e.g. `umami`/`umami`), Coolify manages the
   volume and gives you the internal hostname (e.g. `postgres-abc123` on the
   Coolify network).
2. **Umami app** — **New Resource → Docker Image**:
   - Image: `ghcr.io/umami-software/umami:postgresql-latest`
   - **Environment:**
     - `DATABASE_URL=postgresql://umami:<pass>@<postgres-hostname>:5432/umami`
     - `DATABASE_TYPE=postgresql`
     - `HASH_SALT=<random>`
     - `APP_SECRET=<random>`
     - `TRACKER_SCRIPT_NAME=script.js`
   - **Port 3000** internal; Traefik route `Host(\`blog.mornati.net\`) &&
     PathPrefix(\`/umami\`)` → umami:3000.
   - The Postgres data volume lives on the database resource (real path is
     `/var/lib/postgresql/data`, not `/app/db-data` as the old docs said).

Enable in the site: uncomment `[umamiAnalytics]` in
`config/_default/params.toml` with `websiteid`, `domain` and `scriptName`.

## 4. Images / Cloudinary

Git is the source of truth (`static/images/`). On deploy, `.github/workflows/
deploy.yml`:

1. Uploads changed images via `scripts/cloudinary_sync.py`.
2. Rewrites local `/images/...` references in the built HTML to
   `https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/blog/...`.

Configure the three `CLOUDINARY_*` secrets in GitHub. Without them the deploy
still works — images are just served from the VPS itself.

Covers (`cover.*` inside each post folder) always stay on the VPS: they are
Hugo page resources served by Traefik, kept small.

## 5. DNS cutover

1. Point `blog.mornati.net` (A/AAAA or CNAME) at the VPS.
2. Verify TLS, comments (`/web`), Umami, search (Ctrl+K), RSS (`/rss.xml`).
3. Keep Hashnode live for 30 days as rollback, then set it to private.

EN posts keep their root-level `/slug` URLs — **no redirect needed**. IT/FR
posts moved to `/it/` and `/fr/`; root-level meta-refresh stubs are generated
by `scripts/generate_redirects.py` during the build.

## 6. Maintenance

- **Updates:** `git submodule update --remote` for the theme; bump the Hugo
  pin in `.github/workflows/*.yml` and `Makefile` together.
- **Backups:** the repo *is* the backup (content, config, images in git).
  Remark42 bolt file via the `remark-data` volume; Umami via its Postgres DB.
- **Uptime:** run Uptime Kuma (or UptimeRobot) against
  `https://blog.mornati.net/` and `https://blog.mornati.net/web/`.