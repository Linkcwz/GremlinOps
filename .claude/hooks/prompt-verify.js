// Claude Code UserPromptSubmit hook (matcher-less; fires when the operator
// submits a prompt). Lever: re-surface the verification + closeout discipline —
// Claude's #1 failure point here (hollow verification / asserting without
// checking / declaring done on a proxy) — as additionalContext so it is present
// WHILE Claude works the turn, not after it has already stopped.
//
// WHY UserPromptSubmit and NOT Stop (history — do not "fix" this back):
// This started life as a Stop hook emitting hookSpecificOutput.additionalContext.
// Claude Code REJECTS that every turn — `hookSpecificOutput` is only valid for
// PreToolUse / UserPromptSubmit / PostToolUse / PostToolBatch. Stop has NO
// additionalContext channel; its only Claude-visible lever is decision:"block"
// + reason, which re-prompts and risks loops — exactly what we want to avoid.
// UserPromptSubmit DOES support additionalContext, is non-blocking (zero
// infinite-loop risk), and injects the reminder at the start of each turn so the
// "did you actually verify?" prompt is in front of Claude during the work.
//
// This is salience, not a mechanical gate — "did you verify?" is not
// shell-checkable, so the true mechanical rails remain the git hooks
// (.githooks/{pre-push,post-commit} for PHI/secrets). The one state-grounded
// part is real: it runs `git status` (read-only) and names uncommitted DURABLE
// changes so the closeout rule is not silently skipped. Always exits 0; wrapped
// so it can never break a turn. Claude-harness only — Codex/Gemini run their
// own discipline.
const fs = require("fs");
const { execSync } = require("child_process");

function durableUncommitted(cwd) {
  try {
    const out = execSync("git status --porcelain", {
      cwd, encoding: "utf8", timeout: 5000, stdio: ["ignore", "pipe", "ignore"],
    });
    const re = /(^|\/)(AGENTS|CLAUDE|GEMINI)\.md$|^Agents\/|(^|\/)(memories|handoffs|instructions)\/|^\.githooks\/|^\.claude\//;
    return out
      .split("\n")
      .map((l) => l.slice(3).trim())
      .filter((p) => p && re.test(p));
  } catch (_) {
    return [];
  }
}

function main() {
  let input = {};
  try {
    input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch (_) {}
  const cwd = input.cwd || process.cwd();

  const parts = [
    "Per-turn self-check (the git hooks cannot enforce this — it is on you):",
    "(1) Every file / state / repo / factual claim you make this turn — show REAL output (command result, file read), don't assert from memory; hollow verification is the #1 failure mode here.",
    '(2) "Done" = the OPERATOR\'s stated end-state proven with post-change evidence, not a proxy ("written", "looks right", "should work").',
    "(3) The operator's word is the source of truth; do not re-introduce a fact they already corrected.",
    "(4) DEFAULT = KEEP WORKING. Do not stop to ask for confirmation, preferences, or permission already implied by the task, and do not end a turn with \"want me to proceed?\"-style stalls (menu OR prose — both waste the operator's time). Unless genuinely blocked by info you cannot safely infer, pick the sensible default and drive to the end state; if you'd offer N options, do all N sensible ones and report. Reserve ONE plain-prose question for a genuine fork only (irreversible / high-stakes / intent truly unknown).",
  ];

  const durable = durableUncommitted(cwd);
  if (durable.length) {
    parts.push(
      "(5) Uncommitted DURABLE changes are present — if they are YOURS, commit the scoped change and push per the closeout rule; if another agent's, leave them untouched. Paths: " +
        durable.slice(0, 12).join(", ") +
        (durable.length > 12 ? ` (+${durable.length - 12} more)` : "") +
        "."
    );
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: parts.join(" "),
      },
    })
  );
}

try {
  main();
} catch (_) {
  /* never break the turn */
}
process.exit(0);
