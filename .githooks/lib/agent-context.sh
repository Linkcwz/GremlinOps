#!/usr/bin/env bash
# Git-hook helper: is this git action running inside an AI AGENT session?
#
# WHY THIS EXISTS: the repo's DISCIPLINE guardrails (the commit-msg
# definition-of-done trailer, the pre-commit UX check) exist to keep AGENTS
# honest. They are NOT for the operator. The operator must NEVER be hooked on
# their own commit — if they are, the guardrail is in the wrong scope. So
# those hooks call this and no-op when the committer is the operator.
#
# Detection is deliberately ASYMMETRIC: a false "operator" (an agent slips a
# guardrail) is a tolerable miss; a false "agent" (the operator gets hooked)
# is the cardinal sin this file is meant to prevent. So we only return
# "agent" on strong, execution-context markers that an agent's tool shell
# sets and the operator's own commit (IDE Source Control, a hand-typed
# terminal) does not.
#
# Markers (any one => agent session):
#   GREMLIN_AGENT_COMMIT  explicit opt-in an agent can export
#   CLAUDECODE            set by Claude Code in every tool shell
#   CLAUDE_CODE_ENTRYPOINT / AI_AGENT   Claude Code execution context
#   CURSOR_AGENT / CURSOR_TRACE_ID      Cursor agent context
# NOTE: do NOT key off broad creds like *_API_KEY, which the operator may
# have exported globally and would wrongly flag their own commits.

gremlin_is_agent_session() {
  [[ -n "${GREMLIN_AGENT_COMMIT:-}" ]] && return 0
  [[ -n "${CLAUDECODE:-}" ]] && return 0
  [[ -n "${CLAUDE_CODE_ENTRYPOINT:-}" ]] && return 0
  [[ -n "${AI_AGENT:-}" ]] && return 0
  [[ -n "${CURSOR_AGENT:-}" ]] && return 0
  [[ -n "${CURSOR_TRACE_ID:-}" ]] && return 0
  return 1
}
