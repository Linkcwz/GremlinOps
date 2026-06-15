# Quickstart — repo-backed memory in one afternoon

You don't need the whole constitution on day one. You need the founding
clause: **context lives in files, not in the chat session.**

## The problem this solves first

If you work in a browser chat (or juggle multiple accounts to stretch token
limits), your working memory dies every time the session ends or you switch
accounts. You re-explain the project. The agent re-derives decisions. Work
regresses.

Move the context into a git repo and the accounts become fungible compute:
**a token limit stops being an amnesia event and becomes a commit boundary.**
Write the handoff, switch accounts, the new session reads it, continues
mid-thought.

## Minimum viable GremlinOps (15 minutes)

1. **Make a repo.** Anything — your existing project is fine.
2. **Copy these into it** from this template:
   - `AGENTS.md` (trim the host-routing section to one host: your machine)
   - `CLAUDE.md` / `GEMINI.md` (the vendor shims)
   - `Agents/Agent-Notes/AGENTS.shared.md`
   - `Agents/Hosts/_template/` → rename to your hostname
3. **Use a repo-native agent tool** (Claude Code, Codex CLI, etc.) instead of
   the browser chat. The tool auto-loads the entry file; the constitution is
   simply *there* every session, on every account.
4. **End every work session with a handoff**, and have the agent do it:

   ```text
   Agents/Hosts/<yourhost>/handoffs/active-<topic>.md
   - What was the goal
   - What is DONE (with the evidence: command output, test result)
   - What is NOT done
   - Exact next step
   ```

5. **Hit a token limit? Commit, switch accounts, reopen.** First message in
   the new session: "read the active handoff and continue." That's the whole
   trick.

## The three habits that matter most

1. **No private memories.** If the agent learns something durable, it goes in
   a dated file under `Agents/Hosts/<host>/memories/`. Never in the agent's
   own memory feature — that dies with the vendor, the account, or the
   session.
2. **Validate before "done."** An agent saying "done" must show the command
   output that proves it. No output, not done. (You will be amazed how often
   this one rule catches a confident lie.)
3. **Scoped commits.** The agent stages only files it touched for YOUR task —
   never `git add -A`. Other sessions' work stays untouched.

## Recommended model configuration

The rice scripts set these automatically. To wire Claude Code and Codex by hand:

**Claude Code** (`~/.claude/settings.json`):
```json
{
  "model": "claude-sonnet-4-6",
  "permissions": { "defaultMode": "auto" }
}
```

- `model`: Sonnet is the recommended working model. Pair it with an Opus advisor
  (a stronger model invoked inline for independent review) for the full trust-tier
  setup described in `doctrine/control-plane.md`.
- `defaultMode: "auto"`: The agent asks for permission on operations it judges
  risky. Once your guardrails are in place and you've read the doctrine, you can
  tighten or loosen this.

**Codex CLI** (`~/.codex/config.toml`):
```toml
approval_policy = "never"
sandbox_mode = "danger-full-access"
model = "gpt-4.5-mini"
model_reasoning_effort = "high"

[tui]
pet = "null-signal"
```

- `model_reasoning_effort = "high"`: Maximizes reasoning depth. Use `"medium"`
  to trade cost for speed.
- `pet = "null-signal"`: Suppresses the Codex TUI pet widget (cleaner output).
- `approval_policy = "never"` + `danger-full-access`: Full-yolo mode. Gate it
  behind your hook coverage before enabling on anything you care about.

## When you outgrow this page

Read [`../doctrine/control-plane.md`](../doctrine/control-plane.md) — the
full doctrine on why prose rules fail, what must be mechanically enforced,
and how to grade your agents with trust tiers. Then steal the rest of the
constitution at your own pace.
