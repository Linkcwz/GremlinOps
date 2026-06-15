# Agent Instructions (Claude Code entry point)

This file exists so **Claude Code** loads the same instructions every other
agent uses. The canonical, model-neutral source of truth is
[`AGENTS.md`](AGENTS.md). Do not duplicate policy here — edit `AGENTS.md`.
Claude-only overrides live in the Claude bootstrap folder
[`Claude/CLAUDE.md`](Claude/CLAUDE.md), mirroring `Codex/` and `Gemini/`.

@AGENTS.md
@Agents/Agent-Notes/AGENTS.shared.md
@Claude/CLAUDE.md

## Notes specific to Claude Code

- `AGENTS.md` (imported above) is authoritative. Follow it exactly — it is the
  shared rulebook for every agent, and Claude is one of those agents, not a
  special case.
- The shared cross-host policy `Agents/Agent-Notes/AGENTS.shared.md` is
  **auto-imported above**, not read on demand. Rationale: fresh sessions
  repeatedly *skipped* a ritual step that said "go read it," so the shared
  rules were simply absent when the agent acted. Force-loading through the
  same `@`-import that reliably carries `AGENTS.md` removes the "I never read
  it" failure. This deliberately trades context leanness for reliability —
  the correct trade after that failure. (Host-specific files still need
  runtime host detection; a static import can't pick the right host file per
  session.)
