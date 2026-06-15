# GremlinOps Roadmap

External audit via Uncle GPTetto (2026-06-15). Items in priority order.
Release phrases and operating-mode vocabulary are **intentional and stay** — the speakable UX is a feature, not a gap.

---

## 1. CI: prove the public extraction automatically

The README honestly labels the genericized extraction as probationary because it has not been revalidated end-to-end outside the origin environment. CI from a clean clone should cover:

- hook installation and removal
- every load-bearing hook's self-test
- Linux and Windows paths
- host creation from `_template`
- scoped scratch creation and cleanup
- blocked private-path export
- commit trailer enforcement
- malformed config and missing-dependency behavior
- stale links and documented paths

A spare physical machine becomes the hardware acceptance tier beyond CI: install from the public repo only, run the scenario suite, wipe, repeat.

## 2. Machine-readable validation receipts

`Validated:` trailers are currently honor-system. A lying agent can write `Validated: trust me`. The stronger form is a validation receipt committed alongside the change:

```yaml
task: some-migration
commands:
  - command: curl -fsS https://example.com/
    exit_code: 0
    observed: HTTP 200
artifacts:
  - path: evidence/some-migration/curl.txt
    sha256: ...
user_facing_path: true
timestamp: ...
```

The commit-msg hook should verify the receipt exists, was produced after the relevant change, and contains successful output. Raises the cost of hollow validation substantially.

## 3. Discipline steel vs. safety steel — split the directory and the docs

Agent-detection (`GREMLIN_AGENT_COMMIT`, `CLAUDECODE`, etc.) intentionally prefers false negatives so the human operator is never accidentally hooked. That asymmetry is correct for:

- commit-message style
- reminders and documentation rules
- console-flash checks

It is **not** acceptable for:

- secret leakage prevention
- public-mirror sanitization
- backup deletion blocks
- destructive storage operation guards
- firewall, identity-root, or production mutations

Safety hooks must run regardless of human/agent claim. Human override requires a deliberate break-glass mechanism, not just the absence of a marker. Make this split visible in layout and docs:

```text
.githooks/discipline/
.githooks/safety/
```

## 4. SECURITY-MODEL.md — publish a real threat model

One blunt page stating:

- A root-capable agent can edit hooks, wrappers, env vars, git config, and GremlinOps itself.
- GremlinOps improves reliability and contains ordinary confident stupidity.
- It is **not** a secure sandbox against a malicious or thoroughly prompt-injected root agent.
- Truly sovereign backups must be unreachable or read-only from the agent context.
- High-impact systems require OS, VM, network, token, filesystem, and account-level boundaries outside the repo.

The doctrine already points here. The public project needs the assumptions written as plainly as the philosophy.

## 5. `gremlin install` and `gremlin doctor`

Bootstrap command:

1. Create or adopt a private working repo
2. Create current host from `_template`
3. Fill the hostname routing table
4. Install applicable hooks
5. Wire supported vendor shims
6. Create the scratch namespace
7. Run all self-tests
8. Print a readiness report

Then:

```text
gremlin doctor
```

Output:

```text
PASS  safety pre-push guard installed
PASS  scratch isolation enforced
PASS  host identity resolves uniquely
WARN  Claude Stop/Ask guard not installed
FAIL  backup target writable from agent context
FAIL  public remote can receive Agents/Hosts/
```

This becomes the centerpiece of the project.

## 6. Search-before-ask protocol with hooks

Define a strict ordering before an agent is allowed to hand work back:

1. Search the repo
2. Read active handoffs and host memories
3. Inspect the live system
4. Check established patterns and backups
5. Choose the least-destructive reversible default
6. Ask only when the remaining fork is genuinely irreversible, high-stakes, or unknowable

Wire hooks around `AskUserQuestion` and `Stop` where supported. Require the agent to surface the searches performed and the unresolved blocker before it can stop.

## 7. Make the private/public deployment pattern the first thing a new user sees

A new user could clone the public repo, add real host memories, and accidentally push internal topology to their public fork. The quickstart should lead with:

```text
Public upstream / template
        ↓
Private operational repository
        ↓ sanitized export
Optional public mirror
```

The deny-by-default export policy is one of the strongest parts of the project. It needs to appear in the first 15 minutes, not later.

## 8. Releases, CHANGELOG, migrations

Model names, CLI config keys, hook event schemas, and vendor behavior will age. Add:

- tagged releases
- `CHANGELOG.md`
- tested-version matrix
- migration notes for breaking policy/schema changes
- config schema version
- an upgrade checker
- "known working as of" dates

GremlinOps governs long-lived institutional memory. Its own evolution cannot depend on users manually diffing `main`.

## 9. Boring operator reference layer

Keep everything: useful idiot with tools, hooks are law, backups are sovereign, idiot gremlin, Uncle GPTetto, the meme theology. That voice is why anyone remembers the rules.

Pair it with dry reference pages:

- architecture diagram
- lifecycle diagram
- hook execution order
- trust-boundary diagram
- supported platforms
- incident-response procedure
- uninstall and recovery procedure
- reference configuration

The culture gets people in. The boring layer lets them safely operate it.

---

## Not on this list

**Natural language release phrases are intentional and stay.** The speakable operating-mode vocabulary (`"yeah baby!"`, `"it's alive!"`, `"good little gremlin"`, etc.) is a deliberate UX choice — the phrases are memorable and the operator controls when modes activate and release. They do not become slash commands.
