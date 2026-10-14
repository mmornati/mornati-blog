#!/usr/bin/env bash
# Build the site into public/ exactly as production serves it, then add the redirect stubs.
# Called by .github/workflows/{ci,deploy}.yml and .circleci/config.yml.
#
# Env: the FIREBASE_* values the comments widget needs (empty is fine for a CI-only build).
set -euo pipefail
cd "$(dirname "$0")/../.."

hugo --minify --gc --baseURL https://blog.mornati.net/
python3 scripts/generate_redirects.py
