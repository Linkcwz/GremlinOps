"use strict";
// Claude Code Stop hook — blocks Claude from stopping if its last response
// contains an A/B / lettered/numbered option menu in prose.
//
// Operator rule: Claude MUST NEVER present A/B or lettered menus.
// Pick the sensible default and drive. This enforces it mechanically: if the
// Stop hook detects an option-menu pattern in the last assistant message it
// blocks the stop and tells Claude to pick and continue.
//
// NOTE on Stop-hook mechanics: Stop hooks can use decision:"block" to re-prompt
// Claude. Loop risk is bounded by stop_hook_active — once Claude picks and
// drives without A/B the next Stop call exits 0. additionalContext is NOT
// available on Stop hooks (use UserPromptSubmit for that); decision:"block" +
// reason is the only Claude-visible lever here.
//
// Claude-harness only — Codex/Gemini have no Stop hook.

const fs = require("fs");

// Detect an A/B / option-menu in the last assistant message.
// Fires on: "- (A)" / "- (B)", "**(A)**", "Option A:", "Option 1:", "(A)" on its own line.
// Does NOT fire on: normal prose letters in parens, inline code, code blocks.
function hasABMenu(text) {
  // Strip fenced code blocks so we don't catch examples.
  const stripped = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");

  // "(A)" or "(B)" at the start of a bullet or its own line — needs at least two
  const bulletOpts = (stripped.match(/^[-*]\s*\([A-D]\)\s/gm) || []);
  if (bulletOpts.length >= 2) return true;

  // Standalone "(A)" on a line by itself (after whitespace/bullet) — two hits
  const standaloneOpts = (stripped.match(/^\s*\([A-D]\)\s/gm) || []);
  if (standaloneOpts.length >= 2) return true;

  // "**(A)**" or "**A)**" — bold-formatted letter option (one is enough)
  if (/\*\*\(?[A-D]\)?\*\*/.test(stripped)) return true;

  // "Option A:" / "Option B:" / "Option 1:" / "Option 2:" — labeled menu items
  const optionItems = (stripped.match(/\bOption\s+[A-D1-4][\s:)]/gi) || []);
  if (optionItems.length >= 2) return true;

  return false;
}

function main() {
  let input = {};
  try {
    input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch (_) {
    process.exit(0);
  }

  // Already in a Stop-hook loop → let Claude stop to avoid an infinite loop.
  if (input.stop_hook_active) process.exit(0);

  const transcriptPath = input.transcript_path;
  if (!transcriptPath) process.exit(0);

  let lastAssistantText = "";
  try {
    const lines = fs.readFileSync(transcriptPath, "utf8").trim().split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        const role = entry.role || (entry.message && entry.message.role);
        if (role !== "assistant") continue;
        const content = entry.content || (entry.message && entry.message.content) || "";
        if (typeof content === "string") {
          lastAssistantText = content;
        } else if (Array.isArray(content)) {
          lastAssistantText = content
            .filter((c) => c && c.type === "text")
            .map((c) => c.text || "")
            .join("\n");
        }
        if (lastAssistantText) break;
      } catch (_) {}
    }
  } catch (_) {
    process.exit(0);
  }

  if (!lastAssistantText || !hasABMenu(lastAssistantText)) process.exit(0);

  // Block the stop and inject a directive.
  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason:
        "[gremlinops-no-ab-choice] BLOCKED: You just presented a lettered/numbered option menu. " +
        "Operator rule: NEVER present options — pick the sensible default and DRIVE to completion. " +
        "Do NOT restate the options. Do NOT ask which one the operator prefers. " +
        "Pick one path RIGHT NOW and execute it all the way to the end state. Go.",
    })
  );
  process.exit(0);
}

try {
  main();
} catch (_) {
  process.exit(0);
}
