# Public Export Policy — deny by default

A private operational repo and a public repo must never share history. The
trust tiers:

1. **Private canonical source** — full operational truth. May contain
   private-only records and locally authorized secret material.
2. **Private disaster-recovery mirror** — sanitized of credentials, private
   keys, and personal records by the post-commit sanitizer + pre-push guard.
   Still private-sensitive (topology, host memories, encrypted vaults). NOT
   safe to make public.
3. **Public curated export** — contains ONLY an explicitly allowlisted
   subtree, with independent public-only git history.

## Deny by default

The public exporter copies ONE allowlisted subtree. Nothing else is eligible.
Do not replace this with a denylist, a whole-repository mirror, `git subtree
split`, or a history-filtered copy. **Blocklists fail open; git history never
forgets a thing that was committed even once.** A newly added private file
must remain private unless a human deliberately creates a sanitized public
version inside the allowlisted subtree.

## Validation before every publish

The validator rejects, at minimum:

- archives, databases, encrypted vaults, credentials, private keys, binary
  runtime artifacts;
- email addresses, phone numbers, government-ID patterns, private IP
  addresses, internal DNS names, local user-profile paths;
- references to personal/medical/financial material and private host
  memories;
- symlinks/reparse points, oversized files, unapproved file types.

Run a secrets scanner (e.g. Gitleaks) against the generated tree as a second
opinion. Then run YOUR doxx-grep: a pattern list of your hostnames, domains,
handles, and personal terms that must return ZERO hits on the export.

## Publishing mechanics

- The publish job is MANUAL-ONLY, never on a push trigger.
- It clones the public repo into temporary storage, replaces the working
  tree with the validated export, and creates a public-only commit. It never
  pushes private history.
- The deploy credential has access ONLY to the public repo — never a broad
  personal token.

(This repo you are reading was itself produced by this policy: hand-built
allowlist, doxx-grep at zero hits, independent history.)
