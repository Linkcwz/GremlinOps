// Claude Code PreToolUse hook (matcher: Bash).
// Lever #2 — per-agent salience: at the moment of a `git commit`, re-surface the
// always-on / definition-of-done rules the git hooks CAN'T mechanically enforce
// (judgment calls). Non-blocking: emits additionalContext and exits 0. No-op for
// every other Bash command. Uses only node (reliably on PATH) + stdin; no jq, no
// shell quoting. Claude-harness only — Codex/Gemini rely on the git hooks.

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => { raw += d; });
process.stdin.on("end", () => {
  let cmd = "";
  try {
    const j = JSON.parse(raw || "{}");
    cmd = (j.tool_input && j.tool_input.command) || "";
  } catch (_) { /* malformed payload -> stay silent */ }

  if (!/\bgit\s+commit\b/.test(cmd)) { process.exit(0); }

  const reminder = [
    "Pre-commit gate (always-on judgment rules the git hooks can't catch):",
    "1) Is the OPERATOR's described end-state actually achieved AND verified with post-change evidence — not a proxy like \"files committed\" or \"should work\"? (user-facing tool commits need a Validated: trailer.)",
    "2) No UX violations — follow the platform-specific rules in your host file (e.g. hidden launchers on Windows).",
    "3) No secrets or private-path content to the public mirror.",
    "4) Source of truth = what the operator told you; integrate corrections immediately.",
  ].join(" ");

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: reminder },
  }));
  process.exit(0);
});
