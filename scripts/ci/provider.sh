#!/usr/bin/env bash
# Which CI provider runs the pipelines (DEPLOYMENT.md, "CI providers").
#
#   scripts/ci/provider.sh              show the current provider (same as `status`)
#   scripts/ci/provider.sh circleci     CircleCI primary: every GitHub job is skipped (default)
#   scripts/ci/provider.sh github       GitHub primary: GitHub jobs run again
#   scripts/ci/provider.sh status       show the current provider
#
# The switch is the repository variable CI_PROVIDER, read by the `if:` guard on every job in
# .github/workflows/. Switch to `github` when CircleCI runs out of credits for the month, and
# pause CircleCI (Project Settings → Advanced, or unfollow) so a deploy does not run twice.
# A manual GitHub run (`gh workflow run deploy.yml --ref main`) ignores the switch.
#
# Toolchain: the GitHub CLI (`gh`), signed in with access to the repository's Actions variables.
#   GH_REPO   owner/name to act on (default: the repository of the current checkout)
set -euo pipefail

usage() {
  sed -n '4,7s/^#   //p' "$0" >&2
  exit 2
}

command -v gh > /dev/null || { echo 'provider: the GitHub CLI (gh) is required' >&2; exit 1; }
repo="${GH_REPO:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"

current() {
  local value
  value=$(gh variable get CI_PROVIDER --repo "$repo" 2> /dev/null || true)
  if [[ "$value" == circleci ]]; then echo circleci; else echo github; fi
}

case "${1:-status}" in
  circleci)
    gh variable set CI_PROVIDER --body circleci --repo "$repo"
    echo "provider: CircleCI is primary for $repo — GitHub jobs are now skipped."
    ;;
  github)
    gh variable delete CI_PROVIDER --repo "$repo" 2> /dev/null || true
    echo "provider: GitHub is primary for $repo — GitHub jobs run on the next push."
    echo "          Pause CircleCI (Project Settings → Advanced) so deploys do not run twice."
    ;;
  status)
    echo "provider: $(current) is primary for $repo"
    ;;
  *) usage ;;
esac
