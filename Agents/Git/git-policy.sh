#!/usr/bin/env bash
# Loader for the repo git transport policy. Source this, then call
# gremlin_load_git_policy "<repo-root>"; it exports GREMLIN_GIT_* with safe
# defaults if the env file is missing.

gremlin_load_git_policy() {
  local repo=${1:-.}
  GREMLIN_GIT_POLICY_MODE=normal
  GREMLIN_GIT_REMOTE=origin
  GREMLIN_GIT_BRANCH=main
  if [[ -f "$repo/Agents/Git/git-policy.env" ]]; then
    # shellcheck source=git-policy.env
    source "$repo/Agents/Git/git-policy.env"
  fi
  export GREMLIN_GIT_POLICY_MODE GREMLIN_GIT_REMOTE GREMLIN_GIT_BRANCH
}

# Refspec for the policy push: current HEAD onto the policy branch.
gremlin_git_policy_refspec() {
  printf 'HEAD:%s' "$GREMLIN_GIT_BRANCH"
}
