#!/usr/bin/env node
"use strict";
// Safely remove a per-task scratch directory created by new-task-scratch.js.
// REFUSES to remove anything that is not STRICTLY inside <repo>/.tmp-agent/
// (and refuses the scratch root itself), so a fat-fingered or wrong path can
// never delete real work. This is the only sanctioned way to clean task
// scratch.
//
//   node Agents/bin/clean-task-scratch.js .tmp-agent/my-task-1234-1730000000000
const fs = require("fs");
const path = require("path");

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const scratchRoot = path.resolve(root, ".tmp-agent");
const arg = process.argv[2] || "";
const target = path.resolve(arg);
const rel = path.relative(scratchRoot, target);

// rel === ""  -> target IS the scratch root (refuse; never nuke the root)
// rel starts with ".." or is absolute -> target is OUTSIDE the root (refuse)
if (!arg || rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
  process.stderr.write("refusing: " + JSON.stringify(arg) + " is not strictly inside " + scratchRoot + "\n");
  process.exit(1);
}
fs.rmSync(target, { recursive: true, force: true });
process.stdout.write("removed " + target + "\n");
