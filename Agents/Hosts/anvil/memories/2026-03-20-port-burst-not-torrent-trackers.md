# 2026-03-20 System-report port burst: NOT torrent trackers (prior claim refuted)

GENRE EXAMPLE: refutation memory — a confident claim from a prior session is
killed with the box's own evidence, and the wrong answer is recorded so it
cannot resurface. Agents write these about THEMSELVES.

A prior session claimed that ~450 connections to one odd remote port in a
system-info snapshot were "torrent tracker traffic." A second agent
challenged it. Investigated; **the challenge was right:**

1. **Wrong port fingerprint.** Remote-port histogram across the whole
   snapshot: 453× the odd port, 86× :443, a handful of known LAN services —
   and ZERO connections to the classic tracker ports. A client walking
   tracker lists produces a spread, not a single-port monoculture.
2. **No torrent client existed in the snapshot's process list**; the burst
   sat under "System Process" (TIME-WAIT sockets, PID 0, unattributable).
3. **The Windows torrent client was empty** — not running, zero torrents.
4. **The WSL torrent client couldn't be the source** — NAT-mode WSL sockets
   don't appear in the Windows TCP table — and its state files contained no
   trackers on that port anyway.
5. **The target fleet was anonymous**: ~170 unique IPs, no PTR records,
   sequential local ports, all short-lived.

**What it actually was: UNKNOWN — do not fill this gap with a guess.**
Unverified hypotheses are listed as hypotheses. To identify it for real, a
watcher script now logs the owning PID the moment any new connection to that
port appears live (TIME-WAIT is too late — the socket detaches to PID 0,
which is why the snapshot couldn't name it).

Lesson: the original claim was asserted from priors, not from the file. The
port histogram alone — one command — kills it. Run the cheap discriminating
test before naming a culprit.
