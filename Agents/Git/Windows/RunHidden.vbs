' Hidden launcher: run any command with NO visible console window.
' Usage:  wscript.exe RunHidden.vbs <command> [args...]
' Window style 0 = hidden. Use "runas" ShellExecute for elevation if needed.
Set shell = CreateObject("WScript.Shell")
cmd = ""
For Each arg In WScript.Arguments
  If cmd <> "" Then cmd = cmd & " "
  cmd = cmd & arg
Next
If cmd <> "" Then shell.Run cmd, 0, False
