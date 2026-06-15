#!/usr/bin/env node
// Self-test for the startup-identity-surface rule. Spawns N FRESH headless
// `claude -p` sessions with trivial prompts and asserts each one OPENS with
// the identity-surface block that the SessionStart hook injects as MANDATORY
// FIRST OUTPUT.
//
// Why this exists: the surface rule was once "convention only, no hook" and
// kept getting skipped on small/conversational prompts. The standing rule is
// that the agent proves enforcement ITSELF instead of the operator
// hand-testing each session — an untested guardrail is a judgment rule
// wearing a costume. Re-run any time after touching the hook or the rule:
//
//   node .claude/test-startup-surface.js       # default 3 fresh sessions
//   node .claude/test-startup-surface.js 5
//   CLAUDE_BIN=/path/to/claude node .claude/test-startup-surface.js
//
// Exit 0 iff EVERY spawned session surfaced.
const { spawnSync } = require("child_process");

const N = Math.max(1, parseInt(process.argv[2], 10) || 3);
const PROMPTS = ["yo", "hi", "what's up", "thanks", "ok"];
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const SENTINEL = /Identity surfaced:/i;
const SCOPE = /Agents\/Hosts\/[A-Za-z0-9_-]+\//;

function runOne(prompt) {
  const cmd = `"${CLAUDE_BIN}" -p "${String(prompt).replace(/"/g, '\\"')}"`;
  const r = spawnSync(cmd, { shell: true, encoding: "utf8", timeout: 180000 });
  if (r.error) return { ok: false, first: `SPAWN ERROR: ${r.error.message}` };
  const out = (r.stdout || "") + (r.stderr || "");
  const ok = SENTINEL.test(out) && SCOPE.test(out);
  const first = (out.trim().split(/\r?\n/)[0] || "(empty output)").slice(0, 140);
  return { ok, first };
}

let pass = 0;
const lines = [];
for (let i = 0; i < N; i++) {
  const prompt = PROMPTS[i % PROMPTS.length];
  const { ok, first } = runOne(prompt);
  if (ok) pass++;
  lines.push(`  [${ok ? "PASS" : "FAIL"}] session ${i + 1}/${N} prompt=${JSON.stringify(prompt)} :: ${first}`);
}

console.log(`startup-surface self-test: ${pass}/${N} fresh sessions surfaced the identity block`);
console.log(lines.join("\n"));
process.exit(pass === N ? 0 : 1);
