# Agent Instructions (Gemini entry point)

This file exists so **Gemini** loads the same instructions every other agent
uses. The canonical, model-neutral source of truth is
[`AGENTS.md`](AGENTS.md). Do not duplicate policy here — edit `AGENTS.md`.
Gemini-only overrides live in [`Gemini/GEMINI.md`](Gemini/GEMINI.md),
mirroring `Codex/` and `Claude/`.

Read, in order:

1. `AGENTS.md`
2. `Agents/Agent-Notes/AGENTS.shared.md`
3. `Gemini/GEMINI.md`

Then follow the Startup Rules in `AGENTS.md` (host identification, host file,
identity surface) before any work.
