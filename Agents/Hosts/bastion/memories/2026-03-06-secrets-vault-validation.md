# 2026-03-06 Encrypted secrets vault: set up AND proven before this note

GENRE EXAMPLE: secrets-ops memory — documents the mechanism and the
validation, never a value. Note the validation list: the note was written
AFTER the proof, and says so.

The repo now carries `Agents/Secrets/agent-secrets.vault.age` as the
encrypted repo-backed secret vault, encrypted with `age` to the org's
standard SSH public key. Agents with the matching local private key decrypt
locally; a refresh script rebuilds the vault from the authorized local
plaintext source.

No plaintext secrets are committed.

Validated BEFORE this note was written (the order matters):

- `age` on the primary OS decrypted the real vault; the parser resolved a
  known label WITHOUT printing the secret value.
- The `Get-AgentSecret` helper resolved the same label.
- Helper vault-only behavior proven with a temporary dummy vault.
- The Linux side repeated all three checks with its native `age`.
- The committed `.age` blob was scanned for common plaintext markers — none.

Helper lookup order: (1) encrypted vault → (2) authorized local plaintext
store if present → (3) local env file. Helpers never print raw values;
agents extract into process-local variables only.
