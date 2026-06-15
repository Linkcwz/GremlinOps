# 2026-03-08 Retire the secondary SSH recovery port

GENRE EXAMPLE: retirement memory — records what was REMOVED and why, so no
future agent helpfully restores it.

The operator clarified this workstation does not need a separate recovery SSH
listener on a high port; the machine normally stays physically near the
operator, so the overlay-bound second port was unnecessary complexity.

Changes made:

- Disabled the scheduled task that started the secondary `sshd`.
- Stopped the running `sshd.exe` bound to the secondary config.
- Disabled the matching firewall rule.
- Verified only port `22` remained listening under `sshd.exe` (post-change
  evidence: netstat output checked, single listener).

**Do not restore the secondary port as a default recovery path.** If SSH is
needed, use standard OpenSSH on `22` and keep startup launchers hidden. A
retirement note exists precisely because "I found a disabled task and
re-enabled it" is a classic well-meaning agent failure.
