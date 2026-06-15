# 2026-03-15 Startup identity-surface: hook-enforced + self-tested

GENRE EXAMPLE: guardrail memory — a judgment rule that kept failing gets
teeth, and the teeth get a self-test. The full shape: failure → rule change →
mechanism → evidence → re-test command → honest caveat.

## What / why

The "surface your identity at session open" rule was previously
convention-only — the shared policy literally said the control was the
convention, not a hook. A fresh session skipped it on a trivial
conversational prompt, the exact documented failure mode. Operator escalated
(source of truth): the surface must be the FIRST output of EVERY session,
unprompted, no matter how trivial — and the agent must prove it itself
instead of the operator hand-testing each spin-up.

## Changes

- SessionStart hook: injected context now LEADS with a mandatory-first-output
  directive carrying a pre-built identity block; the model emits it verbatim
  before any other prose or tool call.
- Constitution + shared policy: surface is unconditional; the "non-trivial
  work" loophole is dead.
- A self-test script: spawns N fresh headless sessions on trivial prompts and
  asserts each opens with the identity sentinel. Exit 0 iff all surface.

## Evidence (recorded the day of the change)

- BEFORE: headless run on "say hi in exactly two words" → `Hi there` (no
  surface).
- AFTER: self-test, 3 fresh sessions → 3/3 PASS, each opening with the
  identity block.

## Re-test

Run the self-test after any edit to the hook or the surface rule.

## Caveat (honest scope of the steel)

A SessionStart hook can INJECT a mandatory directive but cannot
deterministically force the model's output — this is "maximally directive
injection + a self-test as the proof gate," not a hard block. If a future
run regresses, the test catches it. That honesty matters: an untested
guardrail is a judgment rule wearing a costume.
