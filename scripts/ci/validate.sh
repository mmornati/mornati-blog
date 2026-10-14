#!/usr/bin/env bash
# Sanity checks on a built public/ (run scripts/ci/build.sh first).
set -euo pipefail
cd "$(dirname "$0")/../.."

test -f public/index.html
test -f public/index.json
test -d public/it/posts
test -d public/fr/posts
echo "post pages built: $(find public -path '*/posts/*' -name index.html | wc -l)"
test -f public/blog-da-iphone/index.html
test -f public/tag/docker/index.html
echo "root redirect stubs present (+ tag redirects)"
