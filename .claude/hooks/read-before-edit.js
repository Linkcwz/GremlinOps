"use strict";
// Claude Code PreToolUse hook (matcher: Write|Edit|MultiEdit|NotebookEdit).
//
// Lever: the #1 expensive agent failure is ACTING on an already-configured
// subsystem before READING its repo docs — most dangerously by editing files
// OUTSIDE the repo (host/app config, network/DNS, service setups). This hook
// detects an edit whose target path is outside CLAUDE_PROJECT_DIR and
// injects a JUST-IN-TIME reminder (non-blocking additionalContext) to read
// the matching host runbook + memories + SOP FIRST and say what was read. It
// fires at the exact moment of danger, not as a turn-start reminder that's
// easy to skip past.
//
// This is salience injected at the right instant, NOT a hard block — whether
// the agent actually reads is not shell-checkable, and a block would risk
// hooking legitimate out-of-repo work (and the operator, who must never be
// hooked). The MECHANICAL guarantee is only that the reminder reaches the
// model whenever an out-of-repo edit is attempted; prove that presence with
// a self-test (see .claude/test-startup-surface.js for the pattern). Always
// exits 0; wrapped so it never breaks a tool call.
const path = require("path");

function targetPath(toolInput) {
  if (!toolInput || typeof toolInput !== "object") return "";
  return toolInput.file_path || toolInput.notebook_path || toolInput.path || "";
}

function isOutsideRepo(root, target) {
  try {
    const rel = path.relative(path.resolve(root), path.resolve(target));
    if (!rel) return false;
    return rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel);
  } catch (_) {
    return false; // cannot tell -> stay quiet, don't break the tool
  }
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let toolName = "", toolInput = {}, cwd = "";
  try {
    const j = JSON.parse(raw || "{}");
    toolName = j.tool_name || "";
    toolInput = j.tool_input || {};
    cwd = j.cwd || "";
  } catch (_) {
    process.exit(0);
  }

  if (!/^(Write|Edit|MultiEdit|NotebookEdit)$/.test(toolName)) process.exit(0);

  const root = process.env.CLAUDE_PROJECT_DIR || cwd || process.cwd();
  const target = targetPath(toolInput);
  if (!target || !isOutsideRepo(root, target)) process.exit(0);

  const msg =
    "[read-before-edit] You are about to edit a file OUTSIDE this repo:\n  " + target + "\n" +
    "Repo rule (AGENTS.shared.md -> Required Operating Style): before changing any " +
    "already-configured subsystem, FIRST read its repo docs — the matching " +
    "Agents/Hosts/<host>/ runbook + that host's memories/ + any SOP the rules name — " +
    "and STATE which you read. Editing a configured system whose docs you haven't " +
    "read is the #1 time-waster.";

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: msg },
  }));
  process.exit(0);
});
