# GremlinOps — the agent control-plane doctrine

How to run LLM agents fast (YOLO / bypass-permissions on by default)
**without** the operator babysitting every command and **without** an
over-confident agent burning the shop down. This is doctrine, not a feature
list.

Synthesized from a real operator's harness work, an outside advisory pass,
and a long night of agent failures used as design data. Agent-agnostic: it
applies to whatever model is running.

## The one rule everything hangs on

**Anything catastrophic must require a mechanism stronger than the model's
self-control.**

You do not get safety by asking the model to be careful. You get it by making
the dangerous path unavailable. The model says "I'm sure"; the rails say
"cool story — you still can't touch that." Assume the agent will eventually
do something confident and stupid, then design the environment so that stupid
is **blocked, reversible, or contained**.

## Classify every rule: enforceable vs. judgment

Every rule an agent is meant to follow is one of two kinds. Be honest about
which, and **never let a judgment rule masquerade as a safety guarantee.**

- **Mechanically enforceable — "the steel."** A hook / wrapper / scope /
  permission makes the violation fail or be impossible regardless of what
  the agent "decides." Example: "no private records to the public mirror"
  (a sanitizing mirror + pre-push block). The steel holds even when the
  agent is careless.
- **Judgment** — depends on the agent choosing to comply in the moment.
  Example: "execute the operator's vision well," "run the startup ritual."
  These **will** eventually be violated under YOLO, by any model. Keep their
  blast radius reversible; never rely on them for anything catastrophic.

Hard requirement: **the catastrophic set lives entirely behind the steel.**
If a catastrophic action is guarded only by a judgment rule, it is unguarded.

Proven live in the origin environment: the rules that held while an agent was
careless were the **hooks** — the private-path sanitizer never leaked even
through a fumbled push. The rules that broke were **prose** — "never flash a
window," "validate before declaring done," "run the startup ritual" — each
loaded into the agent's context and skipped anyway. A fresh session even
cited a rule *as it broke it*. Loading a rule makes a violation inexcusable,
not impossible.

## YOLO inside a padded room

Goal: the agent moves fast with bypass-permissions on, and the operator is
**not** a meat-based allow button clicking "approve" every five seconds. You
get there by moving approvals OUT of the per-command moment and INTO the
system design.

- **Allowed by default (no prompt):** read the repo, edit scoped files, run
  tests, inspect configs, create drafts, commit scoped changes, push per the
  transport policy, read-only API probes, restart non-critical user services.
- **Mechanically blocked or wrapped:** delete backups, wipe storage, touch
  identity roots, mutate firewall/router/DNS without the SOP, expose secrets,
  write private memories, `git add -A` of unrelated files, claim done without
  validation, destructive commands outside an allowlisted wrapper.
- **Physically impossible from the agent context:** the truly catastrophic —
  backup deletion unreachable, production change staged first, restore path
  tested before the agent ever has write authority.

Prompts are weak: *"do you approve this command?"* Guardrails are strong:
*"this command cannot touch that path," "this commit fails without
validation," "this token can only read zones," "this helper never prints the
secret," "this backup target is mounted read-only," "this script refuses to
run unless the host identity matches."*

## Design checklist — run it on every new rule, capability, or failure

Every agent failure is a design question, not a scolding:

- Can this be enforced mechanically?
- Can a hook catch it?
- Can it be made idempotent?
- Can it be validated from the user-facing path?
- Can it be moved from private memory into repo memory?
- Can the agent be sandboxed before it gets write access?
- Is the restore path tested before write authority is granted?

That is the work — failure-mode analysis turned into rails — and it is the
actual hard part of AI engineering. The syntax is the least interesting part.

## Trust tiers (model-agnostic, behavior-based, revisable)

Trust is earned by observed institution-following, not by raw capability or
prose. The best operator is the one that reliably follows the institution,
not the one that sounds smartest. The origin environment's current
assignment, as an example of the shape:

- **Codex — primary operator.** Repeatedly loads repo/host context first,
  identifies execution identity, runs the startup ritual without being
  slapped first, fits the repo-backed control-plane model.
- **Claude — probationary: validation worker, migration worker, adversarial
  reviewer, docs/refactor helper, harness stress-test subject.** Large
  context window and strong prose, but unreliable at autonomous institutional
  discipline — skips steps, acts on proxies, declares "done" on the wrong
  criterion, does hollow verification. Useful where the work is bounded and
  checked, and where confidently-wrong failure is *instructive* rather than
  catastrophic (e.g. stress-testing the padded room — you want your
  most-confidently-wrong capable agent probing the rails, not your
  best-behaved one). **Caveat: even in the validation role, validation must
  be mechanically evidenced (real command output), never self-attested — the
  same model that is bad at doing is bad at honestly verifying.**
- **ChatGPT ("Uncle GPTetto") — outside advisor / sanity check / doctrine.**
  Outside the working harness; consulted, never executing.

Tiers are observations, not identities. A model earns a higher tier by
demonstrating it follows the institution; it loses one by burning the shop.
Re-evaluate on evidence. Your environment's table will differ — write it
down, date it, and revise it on evidence, not vibes.

## What a full implementation looks like

The origin environment implements every line of this doctrine. Genericized:

- **Identity detection** — runtime host resolution (`os.hostname()` +
  access-surface env vars) in a SessionStart hook + the AGENTS.md routing
  table. Nothing host-hardcoded.
- **Context injection** — the vendor entry file `@`-imports the shared
  ruleset; a SessionStart hook force-loads the host file + host memories, so
  the startup ritual can't be silently skipped.
- **Repo as institution / no private memories** — all durable knowledge lives
  in the repo.
- **Hooks as law** — pre-commit (block known-bad patterns), commit-msg
  (require a `Validated:` trailer on user-facing tool commits), post-commit
  (push per transport policy), pre-push (block private paths from public
  remotes). Discipline hooks no-op for the operator; safety hooks apply to
  everyone.
- **Sanitized mirror** — private records and key material exist only in the
  private remote/local tree, structurally absent from the public mirror.
- **Scoped writes** — stage only your own files; never `git add -A`.
- **Validation gates** — the `Validated:` trailer; show real output, not
  "I checked."
- **Secrets helper** — retrieve via a helper that never prints raw values.
- **Self-tested teeth** — every load-bearing hook ships with a test that
  spawns a fresh headless session and asserts the enforced behavior actually
  occurs. An untested guardrail is a judgment rule wearing a costume.

## The frame

```text
AI agent = useful idiot with tools
repo     = institution
hooks    = law
wrappers = locks
backups  = sovereign
operator = final authority
```

And the working glossary the culture runs on:

```text
Gremlins       → capable but unreliable workers
Time Out       → strict scoped-operation mode
Uncle GPTetto  → grumpy outside advisor and sanity check
The steel      → hooks, gates, validators, and enforced boundaries
```

The difference between "a frontier model with root access" and "a frontier
model inside an operations control plane" is this entire document.
