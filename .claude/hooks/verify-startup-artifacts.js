"use strict";
// PostToolUse hook — "verify in a fresh process" forcing function.
//
// When an Edit/Write touches a STARTUP-LOADED artifact (a Claude Code skill,
// settings.json, a hook script, a slash-command/agent .md, or MCP config), the
// change is INERT in the already-running session: Claude Code reads these at
// PROCESS START, not per-call. So re-reading the file you just edited proves
// nothing about live behavior. The only valid proof is observing the new
// behavior in a freshly-spawned `claude` process.
//
// This hook injects a mandatory reminder after such an edit so the agent does
// not declare the change "working/live/fixed" on a proxy.
//
// Born from a real failure: a skill edit was reported as live while the running
// session still served the startup-loaded copy.
//
// Non-blocking: emits additionalContext, never denies the edit.

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let fp = "";
  try {
    const j = JSON.parse(raw || "{}");
    fp = (j.tool_input && (j.tool_input.file_path || j.tool_input.path)) || "";
  } catch (_) {
    process.exit(0); // unparseable -> don't break the tool
  }
  if (!fp) process.exit(0);

  const p = String(fp).replace(/\\/g, "/");
  const STARTUP_ARTIFACT = [
    /\/SKILL\.md$/i, // skills
    /\.claude\/settings(\.local)?\.json$/i, // Claude Code settings
    /(^|\/)\.claude\.json$/i, // CC user config + MCP registrations
    /\.mcp\.json$/i, // project MCP config
    /\.claude\/hooks\//i, // hook scripts
    /\.claude\/(commands|agents)\/.*\.md$/i, // slash commands / agents
    /claude-buddy\/(server|statusline|hooks|skills)\//i, // buddy integration surfaces
  ];
  if (!STARTUP_ARTIFACT.some((re) => re.test(p))) process.exit(0);

  const msg =
    "STARTUP-LOADED ARTIFACT EDITED (" +
    fp +
    "). Claude Code reads skills, settings, hooks, slash-commands/agents, and MCP " +
    "config at PROCESS START, so this edit is INERT in the current running session. " +
    "Definition-of-done: do NOT report this change as working / live / fixed based on " +
    "re-reading the file you just wrote — that is not verification. VERIFY it in a " +
    "FRESH process and show the real output: spawn `claude -p \"<invoke the changed " +
    "surface>\"` (block any mutating tools with --disallowedTools), and confirm the NEW " +
    "behavior actually appears. Only then may you call it done.";

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: msg,
      },
    }) + "\n",
  );
  process.exit(0);
});
