#!/usr/bin/env bash
# Decide whether a CircleCI deploy pipeline publishes. Prints a reason and exits
#   0  deploy
#   1  nothing to publish (the caller halts the job, which then counts as a success)
#
#   deploy_gate.sh push       a push to main: deploy when a site path changed since the
#                             commit the `deploy` branch was built from ("deploy: <sha>")
#   deploy_gate.sh scheduled  the hourly trigger: deploy when a future-dated post became due
#   deploy_gate.sh manual     always deploy
#
# GitHub filters push paths itself (deploy.yml `on.push.paths`); keep SITE_PATHS in step with it.
set -euo pipefail
cd "$(dirname "$0")/../.."

SITE_PATHS=(content config layouts assets i18n static themes/blowfish)

git fetch --depth=1 origin deploy 2> /dev/null || true

case "${1:-}" in
  manual)
    echo "deploy: manual trigger"
    ;;
  scheduled)
    status=$(python3 scripts/next_scheduled_post.py)
    if [[ "$status" != DUE ]]; then
      echo "skip: ${status:+next scheduled post at $status, }nothing due"
      exit 1
    fi
    echo "deploy: a scheduled post is due"
    ;;
  push)
    deployed=$(git log -1 --format=%s origin/deploy 2> /dev/null | sed -n 's/^deploy: \([0-9a-f]\{40\}\)$/\1/p')
    if [[ -z "$deployed" ]] || ! git cat-file -e "${deployed}^{commit}" 2> /dev/null; then
      echo "deploy: cannot tell which commit is deployed"
      exit 0
    fi
    if git diff --quiet "$deployed" HEAD -- "${SITE_PATHS[@]}"; then
      echo "skip: no site change since ${deployed:0:12}"
      exit 1
    fi
    echo "deploy: site changed since ${deployed:0:12}"
    ;;
  *)
    sed -n '2,9s/^# \{0,1\}//p' "$0" >&2
    exit 2
    ;;
esac
