# Claude bootstrap (agent-specific overrides)

This is **Claude Code**'s bootstrap folder. The canonical, model-neutral
instructions that EVERY agent follows live at the repo root:
[`AGENTS.md`](../AGENTS.md). This folder is only for overrides that must
apply when the active agent is Claude and to no other agent.

Claude Code auto-loads the root [`CLAUDE.md`](../CLAUDE.md), which imports
both the canonical `AGENTS.md` and this file. Do not re-import `AGENTS.md`
here.

## Claude-specific overrides

None at this time. Claude follows the canonical `AGENTS.md` exactly, the
same as every other agent.

(When an override IS needed, this is where it goes — dated, with the
operator's reasoning quoted, and scoped to Claude only. Example shape from
the origin environment: a per-session commit-permission rule written after
observed confident-but-wrong durable writes. The bootstrap folder records
the override; the shared tree records the doctrine.)

## Interoperability (required of every agent)

Memories, handoffs, and instructions go in the SHARED tree under
[`Agents/Hosts/<host>/`](../Agents/Hosts/) — never buried in an
agent-specific or local store. This bootstrap folder is for overrides only.
The sibling folders [`Codex/`](../Codex/) and [`Gemini/`](../Gemini/) mirror
this one.
