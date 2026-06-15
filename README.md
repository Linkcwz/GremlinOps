# GremlinOps

**Operational doctrine for running LLM agents fast — without trusting them.**

GitOps said: the repo governs the infrastructure. GremlinOps adds the 2026
amendment: the workforce executing it is capable, chaotic, and presumed to be
lying to you. The discipline isn't optional; it's the whole product.

```text
AI agent = useful idiot with tools
repo     = institution
hooks    = law
wrappers = locks
backups  = sovereign
operator = final authority
```

This repo is a working constitution for a multi-agent, multi-host setup where
agents run in YOLO / bypass-permissions mode and the operator is **not** a
meat-based allow button. It is extracted from a real, in-production private
setup; the rules here carry the scars that created them.

## The one rule everything hangs on

> **Anything catastrophic must require a mechanism stronger than the model's
> self-control.**

You do not get safety by asking the model to be careful. You get it by making
the dangerous path unavailable. Full doctrine: [`doctrine/control-plane.md`](doctrine/control-plane.md).

## Get started

**Linux / macOS / WSL — shell-first:**

```bash
bash <(curl -sL https://raw.githubusercontent.com/Linkcwz/GremlinOps/main/gremlin-init.sh)
```

Asks a few questions (role, which agents, tethered vs local-only), configures Claude Code and Codex, generates a machine identity keypair, and sets up your host folder. Needs `git`, `ssh`, and `node`.

**Windows — Git Bash or WSL terminal:**

Same one-liner. Run from Git Bash or a WSL shell — `gremlin-init.sh` is plain bash.

**Any platform — agent-first (Claude Code or Codex already installed):**

1. Download [`NEW_DEVICE_AGENT_ONBOARDING.md`](NEW_DEVICE_AGENT_ONBOARDING.md).
2. Paste its contents as your agent's first prompt.
3. Answer the opening questions, then walk away (~15 min unattended).

**Already have a repo and just want the memory pattern?** → [`onboarding/QUICKSTART.md`](onboarding/QUICKSTART.md)

---

## What's in the box

| Path | What it is |
|---|---|
| [`AGENTS.md`](AGENTS.md) | The constitution — entry point every agent loads. Routing, mandate, always-on rules. |
| [`CLAUDE.md`](CLAUDE.md) / [`GEMINI.md`](GEMINI.md) | Vendor shims. Each tool reads its own filename; all of them resolve to the same law. |
| [`Agents/Agent-Notes/AGENTS.shared.md`](Agents/Agent-Notes/AGENTS.shared.md) | The shared ruleset: memory policy, coordination, secrets, validation, definition of done. |
| [`Agents/Hosts/`](Agents/Hosts/README.md) | Per-host folders: memories, handoffs, instructions. A template host + two fictional worked-example hosts with a 10-genre memory corpus. |
| [`doctrine/control-plane.md`](doctrine/control-plane.md) | The control-plane doctrine: enforceable vs. judgment rules, trust tiers, the padded room. |
| [`doctrine/operating-modes.md`](doctrine/operating-modes.md) | Formally specified operating states ("time out", "exact task") with speakable release phrases. |
| [`.githooks/`](.githooks/) | **The steel, git half**: agent-detection lib (operator never hooked), `Validated:` trailer enforcement, console-flash check, private-path push guard, sanitizing auto-mirror. |
| [`.claude/`](.claude/) | **The steel, harness half**: SessionStart identity/memory force-loader, just-in-time read-before-edit reminder, the self-test pattern, example hook registration. |
| [`Agents/Git/`](Agents/Git/) | Transport policy file + loader + hook installer + hidden-launcher helper + the deny-by-default [public export policy](Agents/Git/public-export-policy.md). |
| [`Agents/bin/`](Agents/bin/) | Per-task scratch isolation helpers (mint + refuse-unsafe-delete cleanup). |
| [`Agents/Secrets/`](Agents/Secrets/) | Names-and-helpers-never-values secrets pattern. |
| [`GIT_WORKFLOW.md`](GIT_WORKFLOW.md) | The day-to-day git ritual + agent closeout + outage fallback procedure. |
| [`onboarding/QUICKSTART.md`](onboarding/QUICKSTART.md) | Start here if you're new — including the "I juggle accounts and lose my context" fix. |

## Status — this framework rated on its own trust scale

GremlinOps forbids confident claims without evidence, so here is its own
honest status table:

| Component | Trust tier | Evidence |
|---|---|---|
| Doctrine (control-plane, anti-silo law, validation gates) | **Proven** | In production in the origin environment; rules carry dated incident provenance |
| Codex-driven workflows | **Probationary (toddler)** | Capable, fast, needs the rails — follows doctrine well when the hooks hold it |
| Claude-driven workflows | **Probationary (idiot gremlin)** | Smart, confident, frequently wrong — earns trust only by evidence, never by sounding sure |
| Other agents (Gemini, self-hosted) | **Untested** | Shims exist; no production hours |
| The steel (hooks, guards, helpers) in original form | **Proven** | Running in the origin environment; load-bearing hooks ship with self-tests |
| The steel in THIS genericized form | **Probationary** | Faithful transforms of the proven originals (env prefixes + configurable path lists); syntax-checked, not yet production-validated outside the origin — run the self-tests in YOUR environment |
| This genericized public extraction overall | **Probationary** | Names and paths abstracted; your validation is your own |

That last row is the honest label: everything here was validated in the
author's environment under the original (private) names. The generic version
you are reading has not been revalidated end-to-end. Adopt it the way the
doctrine itself demands: validate before you call it done.

## The five-minute pitch

1. **No private memories.** Everything durable an agent learns goes in the
   repo, written for any agent to read. If the model running today vanished
   tomorrow, the entire brain must still be here.
2. **Classify every rule: enforceable vs. judgment.** Judgment rules WILL be
   violated by every model eventually. The catastrophic set must live
   entirely behind **the steel** — the mechanical enforcement layer (hooks,
   scopes, gates, read-only mounts).
3. **Trust tiers are observations, not identities.** Models earn tiers by
   demonstrated institution-following. Confidence is not evidence.
4. **Validation before done.** "Done" means the operator's end state proven
   with post-change output — never "the file is written" or "should work."
5. **Operating modes are speakable.** Scope-lock an agent with a phrase;
   release it with another. Incident response you can say out loud.

## License

MIT — see [LICENSE](LICENSE).
