"use strict";
// Claude Code PreToolUse hook — hard-block the AskUserQuestion multiple-choice
// menu tool. Claude-harness only — this hook is specific to the Claude Code
// harness; Codex/Gemini have no PreToolUse hook.
// Claude does NOT use the "pick 1-x" A/B menu UI; ask in natural prose instead.
// That rule kept being skipped on honor system, so this enforces it mechanically:
// any AskUserQuestion call exits 2 (PreToolUse "deny") and surfaces the steer on
// stderr so the model re-asks conversationally. Every other tool exits 0 silently.
//
// Failure posture: unparseable payload exits 0 (never wedge unrelated tools).
// Claude-harness only — Codex/Gemini have no PreToolUse hook.

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let toolName = "";
  try {
    toolName = (JSON.parse(raw || "{}").tool_name) || "";
  } catch (_) {
    process.exit(0); // can't parse -> don't break the tool
  }

  if (toolName === "AskUserQuestion") {
    process.stderr.write(
      "[gremlinops-no-menu] BLOCKED: AskUserQuestion (the pick-1-of-x menu) is banned for Claude.\n" +
        "But the menu UI is the SYMPTOM. The real operator rule is: STOPPING TO ASK is the waste.\n" +
        "DEFAULT ACTION = KEEP WORKING. Unless you are genuinely blocked by missing information that\n" +
        "cannot be safely inferred, choose the sensible default and CONTINUE the task to its end state.\n" +
        "Do NOT stop for confirmation, preferences, or permission already implied by the request —\n" +
        "and do NOT just re-ask the same stalling question in prose (that is the same waste, no menu).\n" +
        "If you would have offered N options, DO ALL N sensible ones and report. Reserve a question for a\n" +
        "genuine fork only (irreversible / high-stakes / intent truly unknown) — then ask ONE, in prose.\n" +
        "Do not retry this tool. Get back to work.\n"
    );
    process.exit(2);
  }
  process.exit(0);
});
