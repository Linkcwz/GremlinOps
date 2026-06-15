#!/usr/bin/env bash
set -euo pipefail
# Point the checkout at the repo-managed hooks. Run once per clone:
#   Agents/Git/install-hooks.sh /path/to/checkout
repo=${1:-.}
git -C "$repo" config core.hooksPath .githooks
chmod +x "$repo"/.githooks/pre-commit "$repo"/.githooks/commit-msg \
         "$repo"/.githooks/post-commit "$repo"/.githooks/pre-push 2>/dev/null || true
echo "core.hooksPath -> .githooks for $repo"
