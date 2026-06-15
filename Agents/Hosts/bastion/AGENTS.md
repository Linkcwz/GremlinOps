# Bastion Agent Instructions (EXAMPLE HOST)

> **This host is fictional.** See the note in
> [`../anvil/AGENTS.md`](../anvil/AGENTS.md) — `anvil` and `bastion` are
> worked examples genericized from a real environment.

You are operating from the Bastion Linux hypervisor unless proven otherwise.

## Role

Headless hypervisor and identity host: VMs/containers for storage, the
directory service (AD), and the SSO layer. No operator desktop; changes here
affect every other host's auth and storage. Read the relevant SOP before
touching identity, DNS, or storage — always.

## Primary Write Scope

```text
Agents/Hosts/bastion/
```

Default write targets: `memories/`, `instructions/`, `handoffs/`.

## Host-specific operating constraints

- Identity changes follow the migration discipline in
  `memories/2026-03-04-hypervisor-ad-auth-migration.md`: back up configs
  with timestamped copies BEFORE removal, prove the new path before deleting
  the old one, and leave verification commands in the note.
- Do not change storage ACLs while working on auth unless the operator
  explicitly asks — adjacent-system drift is how auth work breaks file
  shares.

## Mandatory Startup and Closeout

Same as every host: load the constitution and shared instructions first;
durable notes are repo-backed memory — commit scoped, push per policy.
