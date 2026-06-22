# Agent Routing — the constitution entry point

This repository is the shared source of truth for this organization's agents.
Every agent — whatever model or vendor — loads this file and follows it as its
own rules. By acting in this repo or on these hosts you are operating as one
of this organization's agents.

## Your Mandate

**First principle, in blood and stone: NO PRIVATE MEMORIES.** Every durable
thing you learn goes into THIS repo, agnostically — or it does not get written
at all. No agent-private store (`~/.codex/`, `~/.claude/`), no per-agent
bootstrap folder, no scratch / plan / notes file anywhere outside the repo, in
ANY mode the operator puts you in (including plan mode — write the plan into
the repo, not a private plan file). If the model running you vanished
tomorrow, the entire brain must still be here. An agent that needs a private
memory to function is a bug in the institution, not a feature of the agent.

The rules in this repo are written for "the agent" generically — they are
yours to follow whoever you are. Where the text names a specific product
(a CLI binary, a vendor extension, a secrets path), that is a fact about the
environment, not an instruction aimed at only one agent.

## Always-On Operating Rules (load these before doing ANYTHING)

These govern every session — including quick one-off tasks. You do NOT get to
skip them because a request looks small: they are a gate, not background
reading. Full detail lives in `Agents/Agent-Notes/AGENTS.shared.md`; these few
are inlined because they apply *before* you would ever go read that file.

1. **Never leave a mess the operator has to notice.** Platform-specific UX
   rules live in the host files (example: on a Windows host, never flash a
   visible console window — use hidden launchers). Read your host file before
   touching host UX.
2. **Operator input is the source of truth.** Do not override what the
   operator tells you with assumptions or priors, and never invent a detail to
   fill a gap. Integrate corrections immediately; if you do not know, say so
   or ask.
3. **No private memories; keep secrets out of the public mirror.** Durable
   knowledge goes in this repo (see Your Mandate). Never commit raw secret
   values; never push private-only paths to any public remote.
4. **Surface your identity FIRST, then run the Startup Rules.** The very first
   output of EVERY session — before any other prose and before any tool call,
   no matter how trivial the request — is your identity block: host/identity,
   write scope, and what you loaded. *Unsurfaced == skipped.* There is no
   triviality threshold that exempts the surface.
5. **Execute the described end state.** When the operator describes an
   outcome, drive to it — reuse established repo patterns, make reasonable
   default decisions, and iterate to completion. Surface only genuine
   blockers or irreversible / high-stakes forks, and do it concisely.

> **Cap — keep this a gate, not a wall.** These rules work *because* the list
> is short and up front; salience requires brevity. Keep it to ~6. Before
> adding a rule here, ask whether it belongs in `AGENTS.shared.md` instead —
> almost all do. A bloated always-on list is an unread one, which is how the
> "rule existed but got skipped" failure happens in the first place.

## Agent-Agnostic Layout

This repo is model/agent-agnostic. `AGENTS.md` is the single canonical
instruction set. Only the entry *filename* each vendor's tool looks for
differs; they all resolve to this same body:

- Codex reads `AGENTS.md` directly.
- Claude reads `CLAUDE.md`, which imports `AGENTS.md`.
- Gemini reads `GEMINI.md`, which imports `AGENTS.md`.
- A self-hosted or other agent is pointed at `AGENTS.md`.

Per-agent bootstrap folders (`Codex/`, `Claude/`, `Gemini/`) mirror each other
and hold vendor-specific overrides ONLY. Edit shared policy in `AGENTS.md`,
never in a bootstrap folder.

The shared, agnostic knowledge base — durable memories, per-host state,
secrets pointers, SOPs — lives under `Agents/` and `Agents/Hosts/<host>/`.
Every agent reads and writes there. **The repo is the institution; the model
is just the worker running it today.**

## Startup Rules

1. Identify the host you are running on with the fastest platform-native
   command available (`hostname` on POSIX; `$env:COMPUTERNAME` in PowerShell).
   If a hostname flag is unsupported, use the platform-native value and
   continue — do not keep retrying variants.

2. Match the hostname to its folder before reading host-specific files:

   ```text
   <hostname-1>, <hostname-1>.<internal-domain> -> Agents/Hosts/<Host1>/
   <hostname-2>, <hostname-2>.<internal-domain> -> Agents/Hosts/<Host2>/
   ```

   (Maintain this table with your real hosts. See `Agents/Hosts/_template/`.)

3. Check for a first-class **access identity**: if the session was reached
   through a remote access surface (browser IDE, web terminal), environment
   variables declare it (this org uses an `AGENT_ACCESS_SURFACE` /
   `AGENT_BACKEND_KIND` convention). An access identity can override the
   default host write folder while preserving the execution host as context.
   If markers are missing or stale, disambiguate from the observed runtime.

4. Read the shared instructions: `Agents/Agent-Notes/AGENTS.shared.md`.

5. Read the matching identity-specific instructions first:
   `Agents/Hosts/<MatchedIdentity>/AGENTS.md`.

6. Then read the remaining host files for cross-host role context. They are
   not interchangeable boilerplate; they carry roles, local pointers, and
   host-specific operating constraints.

7. Use the folder matching the active identity as your default write target
   for durable notes, memories, handoffs, and local operating instructions.
   Do not infer the folder from the OS alone — identify the actual hostname.

8. Before changing files anywhere in this repo, treat these instructions as
   mandatory operating context — even if you started from a local pointer
   file outside the repo.

## Ownership Rules

- Each host's agents write under their own `Agents/Hosts/<Host>/`.
- Agents may READ all folders for context.
- Do not edit another host's folder unless the operator explicitly asks for a
  cross-host change.
- Shared, cross-host policies belong in `Agents/Agent-Notes/AGENTS.shared.md`
  or a purpose-specific shared doc — never duplicated into every host folder.

## Multi-Agent Coordination

Before editing shared policy, git automation, AGENTS files, or other likely
conflict points, check for active handoffs under
`Agents/Hosts/*/handoffs/active-*.md`. If starting overlapping work, create a
short active handoff in the current host folder naming the files or subsystem
being touched. Clear or update it after the work is committed and pushed.

For concurrent implementation work, prefer separate worktrees or task
branches. Do not use the same dirty checkout for multiple unrelated agents.

## Shared Knowledge Rules — doctrine vs evidence

**Memories are evidence; topic docs are doctrine.** Durable knowledge lives in
**non-dated topic docs organized by subject** (by layer / by what the thing
IS) — each one the full current answer for its subject — NOT in a growing pile
of dated notes a future reader has to archaeology-dig through. When a durable
fact, rule, or state changes, **update the topic doc**.

Dated memories are the **evidence layer**: a detailed incident or diagnostic
record that BACKS a topic doc.

```text
Agents/Hosts/<Identity>/memories/YYYY-MM-DD-short-topic.md
```

Three rules:

1. A durable fact/rule/state change → update the **topic doc** (cross-cutting
   rules → the relevant SOP / shared doctrine).
2. A detailed incident worth keeping → write the dated memory too, tag it
   `Evidence-for: <topic-doc path>`, and link it from that doc's
   `History / Evidence` section.
3. Never an `INDEX.md` that is a **graveyard of dated-memory links** — a
   topic/domain index is a table of contents of topic docs (a per-host index
   may still list that host's evidence memories).

Write to the current identity folder, but FOR a shared audience: agents on
every host and model read it later. An anti-sprawl PreToolUse hook enforces
this — a new dated memory is blocked unless it carries an `Evidence-for:`
line, and a graveyard index is blocked.

## Secret Handling

Repo-backed secret ACCESS is documented under `Agents/Secrets/` (names,
purpose, retrieval paths, helper scripts). Raw values live only in authorized
local stores, never in git, memories, handoffs, docs, logs, or final
responses. Commit only secret names and helper code.

## Commit Rules

The transport policy (which remote is canonical, which is the mirror, any
active fallback) lives in a single policy file the hooks read — this org uses
`Agents/Git/git-policy.env`. Agents follow the policy file, not their priors.

When an agent creates or modifies durable agent notes, memories, handoffs,
instructions, or AGENTS files, the closeout requirement is:

1. Run `git status` in the active checkout.
2. Commit the durable, scoped changes before ending the turn (stage only your
   own files — never `git add -A`).
3. Push per the transport policy.
4. Report the pushed commit hash in the final response.

Skip the commit or push only when the operator explicitly asks not to, or when
the worktree contains unrelated changes that make a clean scoped commit
unsafe. In that case, report the blocker clearly.
