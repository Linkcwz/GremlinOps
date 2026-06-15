# <Host> Agent Instructions

You are operating from the <Host> machine unless proven otherwise.

## Role

<One paragraph: what this host is for — workstation, hypervisor, media box,
remote dev target — and what it must never be used for.>

## Primary Write Scope

```text
Agents/Hosts/<Host>/
```

Default write targets: `memories/`, `instructions/`, `handoffs/`.

You may read other hosts' folders for context. Do not write there unless the
operator explicitly asks.

## Host-specific operating constraints

<Examples of the kind of rules that belong here:>

- Platform UX rules (e.g. on Windows: never flash a visible console window —
  use a hidden launcher pattern; keep launcher assets in the repo).
- Which services this host owns, and the SOP to read before touching them.
- Local paths, mounts, or hardware quirks the next agent needs to know.

## Mandatory Startup and Closeout

Before editing the repo, load the repo-root `AGENTS.md` and the shared agent
instructions. Durable notes, memories, handoffs, instructions, and AGENTS
changes are repo-backed memory: commit the scoped change and push it per the
transport policy before ending the turn unless the operator says not to.

## Shared Memory Default

Memories are shared by default. If a session on this host creates context
that could help future agents anywhere, write a concise credentials-free note
under `Agents/Hosts/<Host>/memories/`.
