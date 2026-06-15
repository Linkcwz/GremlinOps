"use strict";
// Claude Code PreToolUse hook (matchers: Bash, PowerShell, Write|Edit|MultiEdit|NotebookEdit).
//
// FORCES per-task scratch isolation. AGENTS.shared.md -> Multi-Agent Coordination:
// "Each task works in its OWN isolated scratch dir — never a shared namespace."
// Mint it with `node Agents/bin/new-task-scratch.js <slug>` (a path under the
// gitignored .tmp-agent/), do ALL temp work inside it, and clean ONLY that path
// with `node Agents/bin/clean-task-scratch.js <dir>`.
//
// WHY this exists: the rule was honor-system and kept getting skipped — agents
// scatter scratch into OS temp via `mktemp`, `> /tmp/...`, `mkdir /tmp/...`,
// `git worktree add /tmp/...`, or Write a harness file straight to /tmp. That
// re-creates the exact shared-namespace hazard the rule exists to kill.
// This hook gives the rule teeth: it BLOCKS (exit 2) a tool call that creates
// scratch in an OS-temp root instead of .tmp-agent. Claude Code treats PreToolUse
// exit 2 as "deny" and surfaces stderr to the model.
//
// Scope is deliberately PRECISE (low false-positive): it only blocks WRITE/CREATE
// idioms aimed at an OS-temp root (/tmp, /var/tmp, /private/tmp, $TMPDIR/$TMP/$TEMP,
// Windows %TEMP%/%TMP%) plus the canonical ad-hoc temp tools (mktemp /
// New-TemporaryFile / GetTempFileName). READING from temp (cat/ls/grep) passes,
// and anything under <repo>/.tmp-agent/ always passes. Scatter into the repo root
// or .claude/ is NOT mechanically detectable (those are legit write locations), so
// that part of the rule stays honor-system — this hook nails the OS-temp leak,
// which is the one that actually bit us.
//
// Escape hatch for a genuine non-scratch OS-temp need: set GREMLIN_ALLOW_OS_TEMP=1
// in the SESSION env (not inline in the command — the hook reads its own process
// env, so an inline `VAR=1 cmd` does NOT bypass it). Behavior is proven by
// .claude/test-force-task-scratch.js. Always wrapped so a hook bug can never wedge
// a tool (fail-open on any internal/parse error). Claude-harness only.
const path = require("path");

function repoRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}
function scratchRoot() {
  return path.resolve(repoRoot(), ".tmp-agent");
}

// True when `p` resolves to `dir` itself or anything strictly inside it.
function underDir(dir, p) {
  try {
    const rel = path.relative(path.resolve(dir), path.resolve(p));
    return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
  } catch (_) {
    return false;
  }
}
function isUnderScratch(p) {
  return underDir(scratchRoot(), p);
}

function osTempRoots() {
  const roots = ["/tmp", "/var/tmp", "/private/tmp"];
  for (const v of [process.env.TMPDIR, process.env.TEMP, process.env.TMP]) {
    if (v && String(v).trim()) roots.push(v);
  }
  return roots;
}
function isInOsTemp(p) {
  return osTempRoots().some((root) => underDir(root, p));
}

// OS-temp path token as a regex fragment, with a trailing boundary so `/tmp`
// matches `/tmp/x` but not `/tmpfs` and not the repo's `.tmp-agent`.
const TMP =
  "(?:/tmp|/var/tmp|/private/tmp|\\$\\{?(?:TMPDIR|TMP|TEMP)\\}?|%TEMP%|%TMP%)(?=[\\/\"'\\s.]|$)";

// Bash idioms where an OS-temp path is the CREATE/WRITE target (adjacency keeps
// reads like `grep x /tmp/y > out` from matching — `>` there points at `out`).
const BASH_WRITE_PATTERNS = [
  { re: new RegExp("(?:>>?|&>>?)\\s*[\"']?" + TMP), label: "redirection into OS temp (> /tmp/...)" },
  { re: new RegExp("\\btee\\b(?:\\s+-{1,2}\\S+)*\\s+[\"']?" + TMP), label: "tee into OS temp" },
  { re: new RegExp("\\bmkdir\\b(?:\\s+-{1,2}\\S+)*\\s+[\"']?" + TMP), label: "mkdir in OS temp" },
  { re: new RegExp("\\btouch\\b(?:\\s+-{1,2}\\S+)*\\s+[\"']?" + TMP), label: "touch in OS temp" },
  { re: new RegExp("(?:-o|-O|--output(?:-document)?)(?:=|\\s+)[\"']?" + TMP), label: "download (-o) into OS temp" },
  { re: new RegExp("\\bworktree\\s+add\\b[^|;&\\n]*?" + TMP), label: "git worktree add in OS temp" },
  { re: new RegExp("\\binstall\\b[^|;&\\n]*?\\s[\"']?" + TMP), label: "install into OS temp" },
  { re: new RegExp("\\bof=[\"']?" + TMP), label: "dd of= into OS temp" },
  { re: new RegExp("\\b(?:cp|mv|rsync)\\b[^|;&\\n]*\\s[\"']?" + TMP), label: "cp/mv/rsync touching OS temp" },
];

function bashReason(cmd) {
  if (!cmd) return null;
  // mktemp is the canonical ad-hoc temp tool (defaults to $TMPDIR or /tmp). Block
  // unless the command clearly scopes it to .tmp-agent (e.g. `mktemp -p .tmp-agent/...`).
  if (/\bmktemp\b/.test(cmd) && !/\.tmp-agent\b/.test(cmd)) {
    return "mktemp (defaults to /tmp) — mint scratch with new-task-scratch.js instead";
  }
  for (const p of BASH_WRITE_PATTERNS) {
    if (p.re.test(cmd)) return p.label;
  }
  return null;
}

function psReason(cmd) {
  if (!cmd) return null;
  if (/New-TemporaryFile/i.test(cmd)) return "New-TemporaryFile — use .tmp-agent";
  if (/\bGetTempFileName\s*\(|\bGetTempPath\s*\(/i.test(cmd)) return "Path::GetTempFileName/GetTempPath — use .tmp-agent";
  const tempVar = /(\$env:(?:TEMP|TMP)\b|%TEMP%|%TMP%)/i.test(cmd);
  const writeCtx =
    /\b(?:Out-File|Set-Content|Add-Content|New-Item|Tee-Object|Export-\w+|Copy-Item|Move-Item)\b/i.test(cmd) ||
    />>?/.test(cmd);
  if (tempVar && writeCtx) return "write into $env:TEMP/%TEMP% — use .tmp-agent";
  return null;
}

function blockMessage(detected, target) {
  return (
    "[force-task-scratch] BLOCKED: this call creates scratch/temp OUTSIDE the per-task folder.\n" +
    "Detected: " + detected + (target ? ("\n  target: " + target) : "") + "\n" +
    "Repo rule (AGENTS.shared.md -> Multi-Agent Coordination): each task does ALL of its\n" +
    "temp/scratch work in its OWN isolated dir under .tmp-agent/. Mint it, work in it, clean it:\n" +
    "    dir=$(node Agents/bin/new-task-scratch.js <slug>)\n" +
    "    # ...write every temp file under \"$dir\"...\n" +
    "    node Agents/bin/clean-task-scratch.js \"$dir\"\n" +
    "This keeps cleanup to one exact path so it can never reach across tasks (a broad rm in OS temp\n" +
    "once nuked another task's caches + a rollback bundle).\n" +
    "Genuine non-scratch OS-temp need: set GREMLIN_ALLOW_OS_TEMP=1 in the session env."
  );
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let toolName = "";
  let toolInput = {};
  try {
    const j = JSON.parse(raw || "{}");
    toolName = j.tool_name || "";
    toolInput = j.tool_input || {};
  } catch (_) {
    process.exit(0); // can't parse -> don't break the tool
  }

  // Documented escape hatch (session env only — inline `VAR=1 cmd` does not reach here).
  const esc = process.env.GREMLIN_ALLOW_OS_TEMP;
  if (esc && esc !== "0" && esc.toLowerCase() !== "false") process.exit(0);

  try {
    if (/^(Write|Edit|MultiEdit|NotebookEdit)$/.test(toolName)) {
      const target = (toolInput && (toolInput.file_path || toolInput.notebook_path || toolInput.path)) || "";
      if (target && isInOsTemp(target) && !isUnderScratch(target)) {
        process.stderr.write(blockMessage("file write into an OS-temp root", target) + "\n");
        process.exit(2);
      }
      process.exit(0);
    }

    const cmd = (toolInput && (toolInput.command || toolInput.script)) || "";
    const reason = toolName === "PowerShell" ? psReason(cmd) : bashReason(cmd);
    if (reason) {
      process.stderr.write(blockMessage(reason) + "\n");
      process.exit(2);
    }
  } catch (_) {
    process.exit(0); // discipline gate, not a safety gate -> fail open on internal error
  }
  process.exit(0);
});
