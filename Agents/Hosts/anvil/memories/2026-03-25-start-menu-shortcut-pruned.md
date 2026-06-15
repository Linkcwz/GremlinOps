# 2026-03-25 WSL desktop shortcut: pruned by the platform, rebuilt repo-backed

GENRE EXAMPLE: root-cause memory — not just "recreated the shortcut" but WHY
it vanished and the structural fix that prevents recurrence.

The custom "Linux Desktop" Start Menu shortcut disappeared. Root cause: it
was placed inside the Start Menu folder that WSL GENERATES AND OWNS for the
distro's Linux apps. WSL resyncs that folder from the distro's `.desktop`
files and prunes any `.lnk` it didn't generate. Do not put custom shortcuts
there.

Rebuild (verified working same day):

- Repo-backed per the standard utilities pattern: hidden VBS launcher +
  `Create-<Name>-Shortcut.ps1` builder + committed icon, all in the repo
  (never `%LOCALAPPDATA%` — local-only assets die invisibly, repo assets are
  restorable by any agent).
- Shortcuts deployed to the user Desktop and the Start Menu Programs ROOT —
  both outside the platform-owned folder, so they cannot be pruned again.
- Post-change evidence: launched via the new chain; the session service
  reported `active` with the compositor processes running.

Re-run the builder any time; it is idempotent.
