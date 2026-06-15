# Agents/Secrets — names and helpers, never values

Repo-backed secret ACCESS documentation. What is committed here:

- **Secret NAMES** and their purpose (`secret-names.env.example`).
- **Helper scripts** that retrieve values from authorized local stores.
- Optionally, an **encrypted vault** (`agent-secrets.vault.age`) — `age`
  encrypted to the org's standard SSH PUBLIC key. (Encrypt to the public
  key, decrypt with the private key — that is the asymmetric design: the
  vault can be refreshed anywhere, read only where the private key lives.)

What is NEVER committed: raw values — not in git, memories, handoffs, docs,
logs, or final responses. Helpers never print values; agents extract into
process-local variables only.

Helper lookup order:

1. The encrypted vault (decrypt locally with the org private key).
2. An authorized local plaintext store, if present on this host.
3. A local `agent-secrets.env` file.

If a task introduces a new secret: add its NAME to
`secret-names.env.example`, commit that, and put the value in the
authorized local store + vault refresh — never in the repo.

The origin environment pairs this with the pre-push private-path guard
(`.githooks/pre-push`) so even a mistake cannot push the local plaintext
store to a public remote. Configure that guard's path list to include yours.
