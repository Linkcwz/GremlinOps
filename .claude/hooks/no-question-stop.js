"use strict";
// Claude Code Stop hook — blocks Claude from STOPPING TO ASK the operator a
// decision question (or handing work back) when the answer is derivable from the
// repo, host memories, SOPs, handoffs, or live system state.
//
// Operator rule: "anytime you want to pause and ask me a
// question you instead have to reference the repo and continue until you've
// achieved what I asked for." Uncle GPTetto: the agent must pay the cost of
// uncertainty, not transfer it back to the operator. Block two behaviours:
//   1. trying to stop before the requested outcome is achieved, and
//   2. asking a decision question the available evidence can answer.
//
// Mechanics (same as no-ab-choice.js): Stop hooks have NO additionalContext
// channel — the only Claude-visible lever is decision:"block" + reason, which
// re-prompts Claude. Loop risk is BOUNDED by stop_hook_active: after one forced
// "go search and finish" push, a second stop is allowed through, so a GENUINE
// fork (irreversible / high-stakes / intent truly unknown) can still be raised
// on the next stop — but only after the agent has done the work to prove the
// answer was not available. Fleet-wide: this file + its settings.json wiring are
// repo-backed project settings, so every host's checkout enforces it.
//
// Claude-harness only — Codex/Gemini have no Stop hook.

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

// Hard ceiling on forced "go finish" pushes per session, so even a pathological
// loop can waste at most this many extra turns before the stop is allowed
// through. (stop_hook_active already caps it; this is belt-and-suspenders, plus
// a same-message dedup below: if Claude re-emits the IDENTICAL stall it could
// not resolve, we let it stop instead of re-blocking forever.)
const MAX_BLOCKS = 2;

// Tiny per-session counter, keyed by session id, in os tmp (never committed).
function counterFile(sessionId) {
  const id = String(sessionId || "nosid").replace(/[^\w.-]/g, "_");
  return path.join(os.tmpdir(), `gremlinops-nqs-${id}.json`);
}
function readCounter(f) {
  try { return JSON.parse(fs.readFileSync(f, "utf8")) || {}; } catch (_) { return {}; }
}
function writeCounter(f, o) {
  try { fs.writeFileSync(f, JSON.stringify(o)); } catch (_) {}
}

// Phrases that hand the decision/work back to the operator instead of resolving it.
const HANDBACK =
  /\b(want me to|do you want me to|would you like me to|should i\b|shall i\b|want me to proceed|let me know if|let me know (?:whether|which|what)|would you prefer|which (?:one )?(?:do|would) you (?:want|prefer)|or (?:are )?you good|or do you want|if you want me to|just say the word|say the word and|do you want (?:me )?to|i can (?:do|run|apply|align|fix|build) .* (?:if you|or)|happy to .* if you)\b/i;

// A real babysitting stall is ALWAYS the closing of the message — never buried
// mid-report. So we analyse only the TAIL (last paragraph, trimmed to its final
// ~2 sentences). This is the critical false-positive guard: a long completion
// report that merely *mentions* "should I" / "want me to" while describing
// something must PASS — only a closing ask should block.
function closingTail(stripped) {
  const paras = stripped.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  let t = paras.length ? paras[paras.length - 1] : stripped.trim();
  // Drop a trailing list of bullets back to the last bullet (a closing question
  // is its own line); otherwise keep the last 2 sentences of the paragraph.
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 2) t = sentences.slice(-2).join(" ");
  return t;
}

// Decide whether the last assistant message is stopping to ask / hand back.
function isQuestionStall(text) {
  // Strip fenced + inline code so example questions in snippets don't trip it.
  const stripped = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
  const tail = closingTail(stripped);

  // Handback phrase in the CLOSING ("let me know if you want me to proceed").
  if (HANDBACK.test(tail)) return true;

  // Closing question addressed to the operator: the tail's last line ends with
  // "?" AND reads like a decision/permission ask (2nd person or a choose/proceed
  // verb), not a rhetorical aside.
  const lines = tail.split("\n").map((l) => l.trim()).filter(Boolean);
  const lastLine = lines.length ? lines[lines.length - 1] : "";
  if (/\?\s*$/.test(lastLine) && /\b(you|your|want|should|shall|prefer|proceed|which|or|ok to|okay to)\b/i.test(lastLine)) {
    return true;
  }
  return false;
}

function lastAssistantText(transcriptPath) {
  let text = "";
  try {
    const lines = fs.readFileSync(transcriptPath, "utf8").trim().split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      let entry;
      try { entry = JSON.parse(lines[i]); } catch (_) { continue; }
      const role = entry.role || (entry.message && entry.message.role);
      if (role !== "assistant") continue;
      const content = entry.content || (entry.message && entry.message.content) || "";
      if (typeof content === "string") {
        text = content;
      } else if (Array.isArray(content)) {
        text = content.filter((c) => c && c.type === "text").map((c) => c.text || "").join("\n");
      }
      if (text) break;
    }
  } catch (_) {}
  return text;
}

function main() {
  let input = {};
  try {
    input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch (_) {
    process.exit(0);
  }

  // Already in a Stop-hook loop → allow stop (the one forced push has happened;
  // a genuine fork may now be raised). Bounds the loop.
  if (input.stop_hook_active) process.exit(0);

  const transcriptPath = input.transcript_path;
  if (!transcriptPath) process.exit(0);

  const text = lastAssistantText(transcriptPath);

  const cf = counterFile(input.session_id);
  // Not a stall → reset the counter for this session and allow the stop.
  if (!text || !isQuestionStall(text)) {
    writeCounter(cf, { count: 0, hash: "" });
    process.exit(0);
  }

  // Loop guards (avoid burning tokens on a runaway block loop):
  const hash = crypto.createHash("sha1").update(text).digest("hex");
  const state = readCounter(cf);
  // (a) Same stall re-emitted → Claude couldn't resolve it; let it stop.
  if (state.hash === hash) process.exit(0);
  // (b) Hard per-session cap reached → stop being a wall; let it stop.
  if ((state.count || 0) >= MAX_BLOCKS) process.exit(0);

  writeCounter(cf, { count: (state.count || 0) + 1, hash });

  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason:
        "[gremlinops-no-question-stop] BLOCKED: you are stopping to ask the operator a question / hand work back. " +
        "Do NOT ask the operator yet. Search the repository, relevant host memories, SOPs, handoffs, and current system state. " +
        "Resolve reasonable ambiguity from available evidence, choose the least-destructive path, CONTINUE execution, and validate from the end-user perspective. " +
        "Drive to the outcome the operator actually asked for. Ask ONLY after documenting the exact searches you performed and proving the required information is genuinely unavailable — and only for a true fork (irreversible / high-stakes / intent truly unknown). Go.",
    })
  );
  process.exit(0);
}

try {
  main();
} catch (_) {
  process.exit(0);
}
