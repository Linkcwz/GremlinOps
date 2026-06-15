# Git Workflow

The transport policy lives in `Agents/Git/git-policy.env`. Hooks and agents
read it; nobody hardcodes remotes.

Normal short version:

```bash
git pull --ff-only origin main
git push origin HEAD          # or just commit — the post-commit hook pushes per policy
```

Policy-based push any time:

```bash
git push "$(. Agents/Git/git-policy.sh; gremlin_load_git_policy .; echo $GREMLIN_GIT_REMOTE)" \
         "$(. Agents/Git/git-policy.sh; gremlin_load_git_policy .; gremlin_git_policy_refspec)"
# (or alias it: git config alias.pushall '!...' )
```

## Agent closeout (durable notes)

1. `git status` in the active checkout.
2. Commit the durable, scoped change — stage only your own files, never
   `git add -A`.
3. Push per the policy file.
4. Report the commit hash in the final response.

If unrelated changes prevent a clean scoped commit, do not sweep them in.
Report the blocker and leave the worktree intact.

## Outage fallback

When the canonical remote goes down: edit `git-policy.env` (mode, remote,
branch), add a dated note to the constitution, and apply silently — do not
re-test the known-down remote or narrate the outage every turn. When
repaired: reconcile the fallback branch back into the canonical branch,
restore the policy file, remove the note.
