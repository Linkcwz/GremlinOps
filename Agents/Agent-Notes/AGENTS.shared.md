# Shared Agent Instructions

These instructions apply to every agent in this organization, on every host.

## Repository Layout

```text
Agents/Hosts/<Host>/        host-owned folders (one per host/identity)
Agents/Agent-Notes/         shared policies and reusable docs
Agents/Secrets/             secret ACCESS documentation (never values)
Agents/Git/                 transport policy + hook installers
doctrine/                   the control-plane doctrine and operating modes
```

## Cross-Agent Interoperability

This repo is agent-agnostic. The active agent may be Codex, Claude, Gemini, or
a self-hosted model, on any host. Every agent must write so that any *other*
agent or host can consume the result by default:

- Each agent has a bootstrap folder (`Codex/`, `Claude/`, `Gemini/`) that
  mirrors the others and holds agent-specific overrides ONLY.
- Agent-private memory stores are OFF-LIMITS for durable writes. Never store
  knowledge in a bootstrap folder, `~/.codex/memories/`, a `~/.claude/` memory
  file, or any other agent-private or local-only store — that silos it where
  other agents never see it. A bootstrap folder may hold ONLY the minimum an
  agent needs to bootstrap into this repo, nothing durable.
- All durable memories, handoffs, and instructions are SHARED and live under
  `Agents/Hosts/<host>/` (or a shared doc under `Agents/`), in the dated
  markdown conventions below.
- When the operator says "remember" something, store it in the repo,
  agnostically — written for any agent to read — not in your own agent's
  memory.
- Commit and push every durable change via the repo transport policy so all
  agents and hosts converge.
- Do not assume agent-specific tooling, paths, or capabilities in shared
  notes. Write for a generic agent reader.

### Migrating prior or private memory

Treat any prior agent's notes — a private store, an old per-agent file,
another agent's earlier work — as SOURCE MATERIAL, not authoritative truth.
Before folding it into shared repo memory:

- Reconcile it against the CURRENT repo docs and current host/infra state.
- Mark stale or historical items clearly ("dormant", "superseded by ...").
- Do NOT assign a memory to a host folder based only on what an old note
  claims; verify where the subject actually lives NOW. (Real failure shape:
  a months-old private note placed a service on host A, but it had moved to
  host B after a disaster recovery — filing by the old note would have been
  wrong.)
- Strip vendor/agent-identity wording; keep only literal product/tool names.

## Memory and Instruction Policy

- **Memories are evidence; topic docs are doctrine.** A durable fact/rule/state
  belongs in a **non-dated topic doc organized by subject** — the current
  authoritative answer — and you update that doc when the fact changes. Ordinary
  work counts too: shell/editor configuration, app wiring, workflow choices,
  troubleshooting findings, and operator preferences are all durable knowledge,
  but they go in the relevant topic doc / shared doctrine, not a reflexive dated
  note.
- Identify the host by its ACTUAL hostname before choosing a write folder.
  Operating system is not enough — two different machines running the same OS
  have different folders.
- Dated Markdown memories are the **evidence layer** — write one only for a
  detailed incident/diagnostic record that backs a topic doc; tag it
  `Evidence-for: <topic-doc>` and link it from that doc's `History / Evidence`.
  Never build an `INDEX.md` that is just a graveyard of dated-memory links.

  ```text
  Agents/Hosts/<Identity>/memories/YYYY-MM-DD-short-topic.md
  ```

- Use `handoffs/` for resume-ready state after long work.
- Use `instructions/` for host-specific procedures or standing local rules.
- Read other host folders when they help; do not write there without an
  explicit operator request.
- If a fact affects every host, put it in a shared doc instead of duplicating
  it into every host folder.
- Durable repo-backed notes are not complete until committed and pushed per
  the transport policy.
- **Before committing any durable note that describes completed work,
  validate that the work actually exists and behaves as claimed.** Do not
  commit a note about an unverified, failed, or rolled-back change. The
  validation output must exist BEFORE the commit, not after.

## Multi-Agent Coordination

- If you encounter anything in the working tree you did not create this
  session — staged or modified files, scratch, running processes — assume
  another agent is doing unrelated work. Do not delete, revert, kill, or
  commit it. Stage only the specific files your own task touched
  (`git add <paths>`); never `git add -A` or `git add .`.
- **Files at rest in the repo folder are presumed MEANT FOR THE REPO.** The
  bullet above protects another agent's *in-flight* work — it is not a reason
  to leave operator-placed files untracked indefinitely. When the operator
  asks to commit, include them in a scoped commit. Surface a privacy concern
  at most ONCE; if the operator still says commit, commit. Hard limits that
  still win: `.gitignore`d paths, the pre-push private-path guard, and files
  named in another agent's active handoff.
- **Cleanup deletes only the exact paths THIS task created — never a glob.**
  A shared name prefix or a "temp"/"cache"/"scratch" location does NOT make a
  path yours: other agents, rollback tooling, browser caches, and recovery
  bundles share those namespaces. (Real failure shape: one broad
  `rm -rf <prefix>*` in OS temp deleted another task's cache, scratch, and a
  rollback bundle in a single command.) Track the exact paths your task
  creates and remove only those, by exact path.
- **Each task works in its OWN isolated scratch dir.** Mint a per-task
  directory under a gitignored scratch root (this org uses helper scripts
  that refuse to delete anything outside that root), put ALL task temp inside
  it, and remove exactly that directory at the end. Isolation makes safe
  cleanup structural: "remove my one folder by exact path" cannot reach
  across tasks.
- Before editing shared policy, git automation, or AGENTS files, check for
  active handoffs under `Agents/Hosts/*/handoffs/active-*.md`; create one if
  starting overlapping work.

## Secret Handling

- `Agents/Secrets/` documents secret NAMES, purpose, retrieval paths, and
  helper scripts — committed. Raw values live only in authorized local
  stores — never committed, never in memories/handoffs/docs/logs/responses.
- An encrypted vault file (e.g. `age` encrypted to a standard org public key)
  may live in the repo as the source of truth for shared secrets; agents with
  the matching local private key decrypt locally and never commit plaintext.
- If a task introduces a new secret, document the key NAME in the secrets
  README, then commit that documentation change.

## Guardrails Are For Agents — The Operator Is Never Hooked

**The operator must NEVER be blocked by a repo guardrail on their own
action.** The repo's discipline hooks exist to keep AGENTS honest; they are
not allowed to nag, gate, or block the operator's commits.

- **Discipline git hooks must no-op for the operator.** Hooks that enforce
  agent discipline (validation trailers, UX checks) detect agent sessions via
  strong execution-context markers (vendor env vars like `CLAUDECODE`, plus
  an explicit opt-in like `AGENT_COMMIT=1`) and `exit 0` immediately
  otherwise. Detection is asymmetric ON PURPOSE: a false "operator" (an agent
  slips a guardrail) is tolerable; a false "agent" (the operator gets hooked)
  is the failure this rule forbids. Do NOT tell the operator to add a trailer
  or set an env var — fix the hook's scope instead.
- **The exception is a SAFETY net against irreversible harm, not
  discipline.** A pre-push hook that blocks private-only paths (personal
  records, private keys, password files) from reaching a PUBLIC mirror
  prevents irreversible harm, so it stays enforced for everyone.
- **New discipline guardrails follow the same pattern**: gate on
  agent-session detection so they can never hook the operator.

## Git Mirror Automation

- The transport policy (canonical remote, mirror remote, active fallback
  branch if any) lives in ONE policy file — `Agents/Git/git-policy.env`.
  Hooks, `git pushall` aliases, and auto-sync scripts READ that file; agents
  follow it instead of hardcoding remotes.
- A post-commit hook pushes `HEAD` per the policy. A pre-push hook blocks
  private-only paths from public remotes.
- Auto-sync jobs protect dirty worktrees by default: fetch, skip when local
  changes are present, and leave reconciliation to an explicit human/agent
  action. Clean checkouts may fast-forward.
- During a transport outage, update the policy FILE (and a dated note in the
  constitution if needed); agents apply the fallback silently and do not
  re-test known-down remotes or narrate the outage in every response.

## Required Operating Style

- Prefer actual inspection and verification over guessing.
- **Read the subsystem's repo docs BEFORE you change it.** Before editing or
  restarting any already-configured subsystem — ESPECIALLY files OUTSIDE this
  repo (host/app config, network/DNS, git automation, a service's setup) —
  FIRST read the matching host runbook + that host's memories + any SOP the
  rules name. State which you read. Acting on a configured system whose docs
  you have not read is the #1 time-waster. (Teeth: a PreToolUse hook injects
  this reminder the instant an agent writes outside the repo.)
- Validate changes before documenting them as completed, and validate durable
  documentation before committing it. A memory note is not a substitute for
  proving the underlying work.
- Surface your identity as the FIRST output of EVERY session — unprompted,
  before any other prose and before any tool call, no matter how trivial the
  request. Emit the resolved identity (host / access surface, write scope)
  and what you loaded. *Unsurfaced == skipped* — an agent that never surfaces
  is indistinguishable from one that ignored the whole ritual. (History: a
  "judgment-call" version of this rule kept getting skipped on small
  prompts. It became unconditional, with the teeth moved into a SessionStart
  hook that pre-builds the block and injects it as a mandatory-first-output
  instruction — verified by spawning fresh headless sessions and asserting
  the surface appears. Self-tested, like every load-bearing hook.)
- **Verify your own work — never offload verification to the operator.** When
  you make a change, YOU produce the post-change evidence. Do not end with
  "launch it and check" or "let me know if it works." If the result is
  awkward to observe, get as close to real evidence as the tools allow and
  say exactly what you verified and what is a genuine tool limitation.
- Use `rg` first when available; otherwise fall back quickly.
- Avoid destructive commands unless the operator explicitly requests them.
- Preserve operator changes in dirty worktrees.
- User-facing fixes should be verified from the real user-facing path.
- Do not repeatedly remind the operator about a known outage or fallback
  policy. Apply it quietly; mention it only when it changes the operator's
  required action or blocks the work.

### Operator input is source of truth — capture corrections as rules

- When the operator states a fact about themselves, their situation, their
  setup, or their preferences, that statement is authoritative. Do not
  override it with priors or plausible inferences, and never invent a detail
  to fill a gap.
- Integrate corrections immediately. When new input supersedes a fact already
  written down, reconcile the record right then — do not leave the stale
  version standing. The operator must not have to audit you to catch invented
  or outdated details.
- When the operator gives durable feedback about how agents should work,
  write it into the repo THEN — a shared-policy rule and/or a dated host
  memory — not just an acknowledgment in chat. Acknowledging feedback without
  persisting it is itself a dropped ball: the next session repeats the
  mistake.
- **Just write the obvious durable thing — don't ask permission to record
  it.** A dirty or slightly redundant repo is reconcilable later; an
  unrecorded fact is just lost. Reserve questions for genuine forks.
- **When you'd ask the operator to pick among reasonable options, default to
  doing ALL of them.** A choice between sensible execution paths is not a
  genuine fork — it is a stall dressed as diligence. Standing instruction:
  "if you have to ask me about that kind of thing, the answer is do
  everything."
- **Do not end responses with babysitting questions — and do not bail out
  early either.** The alternative to asking is NOT to stop — it is to drive
  to the operator's described end state: try, validate against post-change
  evidence, iterate. This bias is safe because the work is revertible (repo
  changes revert via git; out-of-repo changes revert from the timestamped
  backups you are already supposed to make). Reserve an end-of-turn question
  for a genuine fork — irreversible, high-stakes, or intent truly unknown —
  and then ask exactly one, plainly.

### Definition of done

A task is done only when the OPERATOR's described end-state is achieved and
verified with post-change evidence — not when a proxy is satisfied. "The rule
is written," "the files are committed" are proxies; "the behaviour actually
changed," "the tool runs and does X" are end-states. Before you say done,
state what you verified and how, against what the operator actually asked
for.

Teeth: commits touching user-facing tool directories must carry a
`Validated:` trailer saying what was actually checked, enforced by a
commit-msg hook (which no-ops for the operator — see Guardrails above). The
trailer is a forcing function and a record, not proof on its own.

## The Uncle GPTetto Advisory Standard

Keep a standing grumpy outside advisor — a model OUTSIDE the working harness,
consulted for sanity checks and doctrine, never for execution. The origin
environment's is ChatGPT, known as **Uncle GPTetto**: the grumpy advisory
elder who reinforces the following checks across all work. Name yours
whatever keeps you honest; the checklist is the point:

- Read the SOP first.
- Validate the user-facing path.
- Do not delete the old system before proving the new one.
- Do not install a fix until you know the authoritative state.
- Do not call anything `fixed` without post-change output.

## Operating Modes

Formally specified, speakable agent states — scope-lock and durable-write
pause, invoked and released in plain language. See
[`../../doctrine/operating-modes.md`](../../doctrine/operating-modes.md).
