#!/usr/bin/env node
"use strict";
// Mint an isolated per-task scratch directory under <repo>/.tmp-agent/ and
// print its absolute path. Each task does ALL of its temp/scratch work inside
// its OWN directory, and at cleanup removes ONLY that exact directory (use
// clean-task-scratch.js). No task ever shares a scratch namespace with
// another, so cleanup can never reach across tasks — the failure a shared
// OS-temp/prefix namespace invites (real incident: one broad `rm -rf
// <prefix>*` in OS temp deleted another task's browser cache and a rollback
// bundle).
//
//   dir=$(node Agents/bin/new-task-scratch.js my-task)
//   # ...write scratch ONLY under "$dir"...
//   node Agents/bin/clean-task-scratch.js "$dir"
//
// .tmp-agent/ is gitignored. Cross-platform (Windows/Linux/macOS) via node.
const fs = require("fs");
const path = require("path");

const slug = (process.argv[2] || "task").replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 40) || "task";
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const id = slug + "-" + process.pid + "-" + Date.now();
const dir = path.join(root, ".tmp-agent", id);
fs.mkdirSync(dir, { recursive: true });
process.stdout.write(dir + "\n");
