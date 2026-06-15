# 2026-03-04 Hypervisor auth migration: SSO outpost realm → AD direct

GENRE EXAMPLE: migration memory — the new authoritative state, the why, the
backups taken before removal, the cleanup, and the verification commands a
future agent can re-run. This is the densest genre; it earns its length.

## Summary

Hypervisor web-UI authentication was migrated off the SSO platform's LDAP
outpost realm and onto the AD domain directly.

Active realm (authoritative state):

```text
realm id: example-ad
domain: example.internal
server: 10.0.10.5
mode: LDAPS on 636
user attribute: sAMAccountName
default realm: true
group filter: CN=HypervisorAdmins,OU=Groups,DC=example,DC=internal
```

`HypervisorAdmins-example-ad` holds `Administrator` on `/`; domain users get
admin access through that group, never individually.

## Why it changed

The previous realm pointed at the SSO platform's LDAP outpost. Simple binds
through the outpost started failing because the provider was tied to
passkey/browser-oriented flows incompatible with the plain bind the
hypervisor expects. The SSO platform remains the web/passkey layer; the
hypervisor binds AD directly. **Right tool per layer — don't force the
fancy IdP under software that wants a boring bind.**

## Discipline followed (the part to copy)

- **Backups BEFORE removal**, timestamped, paths recorded in this note:
  `domains.cfg.pre-migration-<stamp>`, `user.cfg.pre-migration-<stamp>`.
- **The old realm was removed only AFTER the new one was proven** (login
  tested, group ACL verified). Do not delete the old system before proving
  the new one — the advisory checklist line exists because someone once did.
- Stale outpost users/groups were cleaned AFTER the new realm worked.
- **Adjacent systems left alone**: storage ACLs and the file-sync app were
  verified by membership only. Do not change storage ACLs while working on
  auth unless explicitly asked.

## Secret handling

The bind account name is recorded; the bind password is NOT — only its
storage locations (root-only paths on the DC and hypervisor).

## Verification commands (re-runnable)

```bash
pveum realm list && pveum realm sync example-ad --scope both
pveum acl list | grep HypervisorAdmins-example-ad
samba-tool user getgroups <operator-user>
```
