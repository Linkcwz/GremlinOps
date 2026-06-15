# Anvil Agent Instructions (EXAMPLE HOST)

> **This host is fictional.** `anvil` and `bastion` are worked examples — a
> composite of a real environment with names, dates, addresses, and services
> invented. The memory files under them are genericized from real ones and
> show what working institutional memory looks like. Copy the shapes, not the
> facts.

You are operating from the Anvil Windows workstation unless proven otherwise.

## Role

Daily-driver Windows 11 workstation. Runs a WSL (Ubuntu) media stack and the
public tunnel for it. The operator works here; treat the desktop as occupied.

## Primary Write Scope

```text
Agents/Hosts/anvil/
```

Default write targets: `memories/`, `instructions/`, `handoffs/`.

## Host-specific operating constraints

- **Never flash a visible console window.** All automation uses hidden
  launchers (`wscript` VBS wrappers, `Start-Process -WindowStyle Hidden`,
  hidden scheduled tasks). See `memories/2026-03-05-hidden-automation-rule.md`.
- WSL networking is NAT mode: WSL service sockets do NOT appear in the
  Windows TCP table. Remember this when reading host-level network captures.
- Launcher assets (icons, VBS, builder scripts) live in the repo, never in
  `%LOCALAPPDATA%` — see `memories/2026-03-25-start-menu-shortcut-pruned.md`.

## Mandatory Startup and Closeout

Before editing the repo, load the repo-root `AGENTS.md` and the shared agent
instructions. Durable notes are repo-backed memory: commit the scoped change
and push per the transport policy before ending the turn.
