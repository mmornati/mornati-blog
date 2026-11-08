# Mornati Blog

The personal blog of Marco Mornati, migrated from Hashnode to a self-hosted
static site. Built with [Hugo](https://gohugo.io) + the
[Blowfish](https://blowfish.page) theme, deployed to a VPS running
[Coolify](https://coolify.io) + Traefik.

- Production: https://blog.mornati.net
- Languages: EN (root), IT (`/it/`), FR (`/fr/`)
- Images: synced to Cloudinary from git (`static/images/`)
- Comments: Remark42 (self-hosted, see `DEPLOYMENT.md`)

## Repository layout

```
config/          Hugo site configuration (multilingual)
content/         Posts + pages, split by language (en/it/fr)
layouts/         Template overrides (home, archive, extend-head)
assets/          Custom CSS
static/          favicon, avatar, and post images (images/ subtree)
themes/blowfish  Theme (git submodule)
scripts/         migrate.py + cloudinary_sync.py
_raw/blog-posts  Hashnode backup clone (gitignored, read-only source)
.circleci/          CI: scheduled publication batch only (build/deploy disabled)
.github/workflows/  CI + Deploy pipelines on GitHub Actions (primary)
scripts/ci/         Entry points shared by the CI providers
```

## Local development

Prerequisites: Python 3.10+, Docker (or a native `hugo-extended` 0.164.x).

```sh
git clone --recurse-submodules git@github.com:mmornati/mornati-blog.git
cd mornati-blog

# 1. (re)generate content from the Hashnode backup (optional)
make migrate          # or: python3 scripts/migrate.py --workers 24

# 2. build and preview locally with Docker
make serve            # http://localhost:8080
# or build only
make build            # outputs ./public
```

The `deploy` workflow (`.github/workflows/deploy.yml`) runs on every push to
`main`, builds the site, syncs images to Cloudinary, and pushes the result to a
`deploy` branch that Coolify serves statically (no server-side build needed). The
scheduled/publication batch (future-dated posts) runs on the CircleCI `scheduled`
workflow (see `DEPLOYMENT.md` §7).

## Adding a new post

1. Create `content/en/posts/<slug>/index.md` (or `it` / `fr`)
2. Drop images next to it as `cover.{jpg,png,...}` (becomes the card image) and
   inline images in `static/images/<slug>/` — reference them as
   `/images/<slug>/...`
3. Commit and push; CI builds, syncs images to Cloudinary, and redeploys.

## Configuration

Main config lives in `config/_default/hugo.toml`. Per-language settings in
`languages.{en,it,fr}.toml`, menus in `menus.{en,it,fr}.toml`.

### Umami analytics

Blowfish supports `[params.umamiAnalytics]` natively. Fill in
`websiteid`, `domain` and `scriptName` in `config/_default/params.toml`
to enable it.

### OpenObserve RUM (Real User Monitoring)

The site loads the OpenObserve browser RUM SDK from the official CDN
(`https://browsersdk.openobserve.ai/<version>/openobserve-rum.js`) through the
`layouts/partials/extend-head.html` override, so no bundler/npm step is needed
(static Hugo site).

The snippet is rendered only when the following build-time env vars are set
(see `.env.example`):

- `OPENOBSERVE_RUM_TOKEN` (required) — client token from OpenObserve
  (Ingestion -> Real User Monitoring)
- `OPENOBSERVE_RUM_APP_ID` (required) — RUM application id
- `OPENOBSERVE_RUM_SITE` (required) — OpenObserve instance host
  (e.g. `openobserve.mornati.net`)

Optional: `OPENOBSERVE_RUM_ORGANIZATION`, `OPENOBSERVE_RUM_SERVICE`,
`OPENOBSERVE_RUM_ENV`, `OPENOBSERVE_RUM_VERSION` (optional; defaults to the
latest published `@openobserve/browser-rum` version, resolved from the npm
registry at build time).

In CI these are provided as repository secrets and wired into the
`Build site` steps of `ci.yml` and `deploy.yml`. The scheduled publication builds
(run by the CircleCI `deploy` job) receive the same variables as CircleCI project
environment variables.

### Comments (Remark42)

Blowfish v2.105 requires a user-provided `layouts/partials/comments.html`
(included in this repo) plus `[article] showComments = true`. Set the
`host` under `[remark42]` in `config/_default/params.toml` to enable it.
See `DEPLOYMENT.md` for the full Remark42 + Traefik setup and the legacy
comment import procedure.

## Tools

- `scripts/migrate.py` — one-shot importer from the Hashnode GitHub-backup
  repo (`_raw/blog-posts`). Re-runnable; skips duplicates, downloads images,
  detects language.
- `scripts/cloudinary_sync.py` — uploads only changed images from
  `static/images/` to Cloudinary (state in `build/cloudinary.synced.json`,
  gitignored) and rewrites built HTML to use the CDN URLs. Requires
  `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` env vars (see `.env.example`).