#!/usr/bin/env bash
# Write the sorted URL list of the sitemaps currently on the `deploy` branch to $1.
# Run once before publishing and once after: scripts/ci/indexnow.py pings the difference.
# An unreachable or missing deploy branch yields an empty list.
set -euo pipefail
out="${1:?usage: sitemap_urls.sh <output-file>}"

: > "$out"
if git fetch --depth=1 origin deploy 2> /dev/null; then
  for lang in en it fr; do
    if git cat-file -e "origin/deploy:${lang}/sitemap.xml" 2> /dev/null; then
      git show "origin/deploy:${lang}/sitemap.xml" |
        grep -o '<loc>[^<]*</loc>' |
        sed 's/<loc>//; s#</loc>##' >> "$out"
    fi
  done
else
  echo "WARN: could not fetch deploy branch; treating URL set as empty" >&2
fi
sort -u -o "$out" "$out"
echo "sitemap URLs on deploy: $(wc -l < "$out")"
