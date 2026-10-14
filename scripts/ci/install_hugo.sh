#!/usr/bin/env bash
# Install Hugo extended on a Linux amd64 CI box (CircleCI; GitHub uses peaceiris/actions-hugo).
# Keep HUGO_VERSION in step with .github/workflows/*.yml and HUGO_IMAGE in the Makefile.
set -euo pipefail

HUGO_VERSION=0.164.0
HUGO_SHA256=fea17b8c076f950bb2e9f9486667bdaa29422883888d509d63931c73e8a9b3a4
dest="${HUGO_BIN_DIR:-$HOME/bin}"

if [[ -x "$dest/hugo" ]] && "$dest/hugo" version | grep -q "v${HUGO_VERSION}-.*+extended"; then
  echo "hugo ${HUGO_VERSION} already installed"
  exit 0
fi

tarball="hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
curl -fsSL -o "$tmp/$tarball" "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${tarball}"
echo "${HUGO_SHA256}  $tmp/$tarball" | sha256sum -c -
mkdir -p "$dest"
tar -xzf "$tmp/$tarball" -C "$tmp" hugo
install -m 0755 "$tmp/hugo" "$dest/hugo"
"$dest/hugo" version
