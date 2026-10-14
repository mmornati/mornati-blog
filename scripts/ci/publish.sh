#!/usr/bin/env bash
# Force-push public/ as a single orphan commit to the `deploy` branch, which Coolify serves.
# Same result as peaceiris/actions-gh-pages in .github/workflows/deploy.yml (force_orphan),
# including the "deploy: <sha>" message that scripts/ci/deploy_gate.sh reads back.
#
# Env:
#   DEPLOY_KEY_FINGERPRINT  SHA256 fingerprint of the write deploy key that CircleCI's
#                           add_ssh_keys step installed under ~/.ssh
#   DEPLOY_BRANCH           branch to publish to (default: deploy; a test run can use another)
#   CIRCLE_SHA1, CIRCLE_PROJECT_USERNAME, CIRCLE_PROJECT_REPONAME  (set by CircleCI)
set -euo pipefail
cd "$(dirname "$0")/../.."

: "${DEPLOY_KEY_FINGERPRINT:?}" "${CIRCLE_SHA1:?}"
test -f public/index.html

# The checkout key is read-only and ssh would offer it first, so pin the deploy key.
key=""
for candidate in ~/.ssh/id_*; do
  [[ "$candidate" == *.pub ]] && continue
  if ssh-keygen -lf "$candidate" 2> /dev/null | grep -qF "$DEPLOY_KEY_FINGERPRINT"; then
    key="$candidate"
    break
  fi
done
[[ -n "$key" ]] || { echo "publish: no key matching $DEPLOY_KEY_FINGERPRINT in ~/.ssh" >&2; exit 1; }

# Over SSH whatever URL the checkout used, so the deploy key is the credential.
remote="git@github.com:${CIRCLE_PROJECT_USERNAME:?}/${CIRCLE_PROJECT_REPONAME:?}.git"
touch public/.nojekyll
cd public
rm -rf .git
git init -q -b deploy
git add -A
git -c user.name='circleci[bot]' -c user.email='circleci-bot@users.noreply.github.com' \
  commit -q -m "deploy: ${CIRCLE_SHA1}"
GIT_SSH_COMMAND="ssh -i $key -o IdentitiesOnly=yes" git push -q --force "$remote" "deploy:${DEPLOY_BRANCH:-deploy}"
rm -rf .git
echo "publish: ${DEPLOY_BRANCH:-deploy} updated (deploy: ${CIRCLE_SHA1:0:12})"
