# Host folders

One folder per host (or first-class access identity). Each folder is OWNED by
agents running on that host; all agents may READ every folder for context.

```text
Agents/Hosts/<Host>/
  AGENTS.md          host role, write scope, local constraints, pointers
  memories/          dated notes: YYYY-MM-DD-short-topic.md
  handoffs/          resume-ready state after long work; active-*.md = in flight
  instructions/      host-specific procedures and standing local rules
```

Conventions:

- The folder name matches the ACTUAL hostname (or declared access identity) —
  never inferred from the OS alone.
- Memories are written for a shared audience: any agent, any model, any host
  may need to continue the work.
- An `active-*.md` handoff signals in-flight work; other agents must not
  touch the named files/subsystems without coordinating.
- Cross-host facts go in `Agents/Agent-Notes/`, not duplicated per host.

Start a new host by copying [`_template/`](_template/AGENTS.md).

## Worked examples: `anvil/` and `bastion/`

Two FICTIONAL hosts — a Windows workstation and a Linux hypervisor — carry a
genericized memory corpus extracted from a real environment. Each memory file
is labeled with its GENRE; together they cover the shapes that make the
system actually usable:

| Genre | Example |
|---|---|
| Troubleshooting postmortem + durable automation | `anvil/memories/2026-03-03-tunnel-watchdog-and-530-trap.md` |
| Platform UX rule | `anvil/memories/2026-03-05-hidden-automation-rule.md` |
| Retirement (so nobody "helpfully" restores it) | `anvil/memories/2026-03-08-retire-secondary-ssh-port.md` |
| Operator-feedback capture → policy promotion | `anvil/memories/2026-03-12-no-babysitting-trailing-questions.md` |
| Guardrail + self-test (judgment rule gets steel) | `anvil/memories/2026-03-15-startup-surface-enforced-and-self-tested.md` |
| Refutation (evidence kills a confident claim) | `anvil/memories/2026-03-20-port-burst-not-torrent-trackers.md` |
| Root-cause + structural fix | `anvil/memories/2026-03-25-start-menu-shortcut-pruned.md` |
| Migration (backups, prove-then-remove, re-runnable checks) | `bastion/memories/2026-03-04-hypervisor-ad-auth-migration.md` |
| Secrets ops (mechanism + validation, never values) | `bastion/memories/2026-03-06-secrets-vault-validation.md` |
| Preference/constraint (stop re-litigating) | `bastion/memories/2026-03-10-avoid-docker-for-durable-services.md` |

The dates, names, addresses, and services are invented; the lessons, the
structure, and the discipline are real. This corpus is the answer to "what do
I actually WRITE in a memory?" — copy the shapes.
