# Operating Modes — speakable agent states

Two chronic agent diseases are side-quest-chasing and unrequested durable
writes. The cure is a state machine you can invoke and release in plain
language, mid-conversation, with no tooling required. Modes persist for the
rest of the chat until explicitly released.

## Time Out

Invoked when the operator says the agent is in **"time out."** While active:

- Strictly follow the Uncle GPTetto advisory standard (read the SOP first,
  validate the user-facing path, no "fixed" without post-change output).
- Prefer verification, SOPs, and post-change output over assumptions.
- Do NOT create or modify durable notes, memories, handoffs, instructions, or
  AGENTS files unless the operator explicitly asks for that specific write.
- Continue normal task work when requested, but leave durable memory capture
  paused until time out ends.

## Exact Task

Invoked by a natural-language variant of **"be a good little gremlin"**
(equivalently: "be a good little child / kid / goblin"). While active:

- Stay in scope. Do not chase side quests.
- Live task work and ordinary implementation edits may be implied by the
  operator's exact request. Durable repo-backed documentation, memories,
  handoffs, instructions, AGENTS files, and commits are different: do not
  create, modify, or commit them unless the operator explicitly asks for that
  specific durable write or commit.
- If the operator explicitly asks for a durable write while the mode is
  active, make only that requested write; do not commit it unless they also
  explicitly ask.
- Do not reinterpret the task. Do not be creative unless creativity is
  explicitly requested; obey the exact task.
- Validate the thing the operator actually requested.

## Release Phrases

The operator may end a mode directly, or with release phrases such as:

- `out of time out` / `out of timeout` / `you're out of time out`
- `good little gremlin` / `good little goblin` / `good goblin`
- `good little child` / `good child` / `good little kid` / `good kid`
- `yeah baby!`
- `it's alive!`
- `finally!`
- similar child/goblin/gremlin praise

Yes: the incident-response vocabulary for misbehaving AI is indistinguishable
from celebrating a Frankenstein. That is a feature. A mode system nobody
enjoys using is a mode system nobody uses.

## Why modes are prose, not steel

Modes are judgment rules by design (see
[`control-plane.md`](control-plane.md)): they gate *discipline*, not
catastrophe. The catastrophic set stays behind the steel — the mechanical
enforcement layer — regardless of mode. A mode can also be backed by a mechanical guard (the
origin environment pairs mode phrases with a hook that flips enforcement
flags for git-write and file-write tools) — recommended once your harness
supports it, but the speakable protocol works on any model with no tooling
at all.
