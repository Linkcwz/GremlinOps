# 2026-03-05 Hidden Windows automation rule

GENRE EXAMPLE: platform UX rule — small, absolute, host-scoped.

The operator explicitly wants agent-created Windows automation to avoid ANY
visible terminal, PowerShell, console, or Windows Script Host flicker. Use
hidden scheduled tasks, hidden process window styles, and `wscript.exe`
wrappers (window style 0). Before registering or running a wrapper, verify
the target script path exists so Windows Script Host does not show a
missing-script dialog.

Elevation is fine; a flashing window is not. Only an unavoidable OS consent
prompt may appear.
