// Claude Code SessionStart hook (matchers: startup / resume / clear / compact).
// Auto-runs the HOST-SPECIFIC half of the startup ritual so it happens
// deterministically instead of depending on the agent choosing to.
//
// Resolves the host identity DYNAMICALLY: os.hostname() is prefix-matched
// against the folder names under Agents/Hosts/ (so adding a host = adding a
// folder, no hook edit). Then force-injects the matched host AGENTS.md AND
// that host's memory CONTENTS (newest-first, up to a budget) so a documented
// fact is PRESENT in context, not a skippable "go read it." The host-agnostic
// shared policy is separately force-loaded via CLAUDE.md's @-import.
//
// If your setup has remote access surfaces (browser IDE identities), add an
// env-var check here that overrides `id` before the hostname match — see the
// AGENTS.md Startup Rules access-identity section.
//
// Non-blocking; always exits 0. Claude-harness only — other agents run their
// own ritual; the AGENTS.md rule binds every agent regardless.
const fs = require("fs");
const os = require("os");
const path = require("path");

const MEM_BUDGET_BYTES = 200000;

function resolveIdentity(root, host) {
  let dirs = [];
  try {
    dirs = fs.readdirSync(path.join(root, "Agents", "Hosts"), { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
      .map((d) => d.name);
  } catch (_) { return null; }
  for (const d of dirs) {
    if (host.startsWith(d.toLowerCase())) return d;
  }
  return null;
}

function main() {
  let root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  try {
    const j = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
    if (j && j.cwd) root = j.cwd;
  } catch (_) {}

  const host = (os.hostname() || "").toLowerCase();
  const id = resolveIdentity(root, host);

  let ctx;
  if (!id) {
    ctx =
      `STARTUP RITUAL (auto-run by the SessionStart hook so it is not skipped). ` +
      `hostname="${host}".\n\n` +
      `>>> MANDATORY FIRST OUTPUT — before any other text or tool call, unprompted, even ` +
      `for a trivial request: could not auto-resolve the host folder, so run the Startup ` +
      `Rules in AGENTS.md (identify host, read Agents/Hosts/<host>/AGENTS.md + its ` +
      `memories), then OPEN your first reply with an identity block beginning ` +
      `"Identity surfaced: <id> (hostname ${host}) — durable writes go under ` +
      `Agents/Hosts/<id>/. Loaded: ...". Do this every session; unsurfaced == skipped.`;
  } else {
    const block =
      `Identity surfaced: ${id} (hostname "${host}") ` +
      `— durable writes go under Agents/Hosts/${id}/.\n` +
      `Loaded: AGENTS.md + Agents/Agent-Notes/AGENTS.shared.md (auto-imported) + ` +
      `Agents/Hosts/${id}/AGENTS.md and its memories (force-loaded here).`;
    ctx =
      `STARTUP RITUAL (auto-run by the SessionStart hook so it is not skipped). ` +
      `hostname="${host}".\n\n` +
      `>>> MANDATORY FIRST OUTPUT — before any other prose and before any tool call, ` +
      `unprompted, no matter how trivial the request (even "yo", a bare link, or a ` +
      `one-word ask): begin your first reply with this identity block, verbatim, on its ` +
      `own lines:\n\n${block}\n\n` +
      `Emit it EVERY session. "unsurfaced == skipped" — skipping it is a trust failure ` +
      `even for a one-word prompt. After the block, continue with the task normally.`;
    try {
      const hf = fs.readFileSync(path.join(root, "Agents", "Hosts", id, "AGENTS.md"), "utf8");
      ctx += `\n\n===== Agents/Hosts/${id}/AGENTS.md (force-loaded — your host rules) =====\n${hf}`;
    } catch (_) {
      ctx += `\n\n(Could not read the host AGENTS.md; read it manually.)`;
    }
    try {
      const memDir = path.join(root, "Agents", "Hosts", id, "memories");
      const files = fs.readdirSync(memDir).filter((f) => f.endsWith(".md")).sort().reverse();
      if (files.length) {
        let used = 0; const inlined = []; const listed = [];
        for (const f of files) {
          let body;
          try { body = fs.readFileSync(path.join(memDir, f), "utf8"); } catch (_) { continue; }
          if (used + body.length <= MEM_BUDGET_BYTES) { inlined.push([f, body]); used += body.length; }
          else listed.push(f);
        }
        ctx += `\n\n===== Agents/Hosts/${id}/memories/ — ${files.length} notes, ${inlined.length} force-loaded below. ` +
               `Treat as DATED source material (newest-first): newer supersedes older; reconcile against current ` +
               `repo/host state before relying on any one — some may be stale. =====`;
        for (const [f, body] of inlined) ctx += `\n\n----- ${f} -----\n${body}`;
        if (listed.length) {
          ctx += `\n\n----- ${listed.length} older note(s) over the inline budget (read on demand): -----\n` +
                 listed.map((m) => "  - " + m).join("\n");
        }
      }
    } catch (_) {}
  }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: ctx },
  }));
}

try { main(); } catch (_) { /* never break session start */ }
process.exit(0);
