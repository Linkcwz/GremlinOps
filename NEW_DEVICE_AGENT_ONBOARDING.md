# GremlinOps — New Machine Bootstrap

<!-- Human reader: download this single file, then paste its contents as your
     first prompt to a freshly installed agent (Claude Code, Codex, etc.).
     The agent reads this as a task and executes the whole sequence.
     You will answer a few questions up front, then walk away.
     Estimated unattended time after Q&A: 10–20 minutes.

     Shell-first alternative: bash <(curl -sL <repo>/gremlin-init.sh)
     See gremlin-init.sh in the same repo for the non-agent bootstrap path. -->

---

You are reading this as your first task on a fresh machine. Your job is to
bootstrap the GremlinOps repo-backed agent workflow on this device from zero.

**Before touching anything else, ask the operator the questions below in a
single conversational message. Collect all answers. Then drive through every
phase without stopping for confirmation — surface only genuine blockers.**

## Collect from operator before proceeding

Ask the operator these questions together, in plain prose, in one message:

1. **Machine role** — what is this host for? (workstation / dev VM / test VM /
   hypervisor / server / travel router companion / etc.) One phrase is fine.
2. **Agents to install** — Claude Code, Codex CLI, both, or skip agent install
   and just set up the repo?
3. **Terminal theming** — run the rice script to configure fonts, prompt theme,
   and shell environment? Or agents-only (skip theming)? Or skip setup entirely
   and configure manually after?
4. **Operating mode:**
   - **Tethered** — you maintain a private remote git repo as your durable
     brain. All memories, handoffs, and notes sync to it. Survives account
     changes and context limits. Recommended.
   - **YOLO** — local folder only. No remote sync. Memory lives until you
     delete the checkout or wipe the machine. Good for throwaway VMs and
     air-gapped testing.
   
   If tethered: what is the remote repo URL? (GitHub, GitLab, Gitea, Forgejo —
   anything git works. If they don't have one yet, tell them to create a new
   empty **private** repo first, then come back with the URL.)

Wait for the answers. Once you have them, proceed through all phases below
without stopping.

---

## Phase 1 — Detect platform

```bash
hostname
uname -srm 2>/dev/null || echo "Windows/PowerShell — run rice.cmd or rice.ps1"
```

Record the short hostname as `<HOST>` everywhere below. On WSL, use the WSL
hostname (e.g. `desktop`), not the Windows `COMPUTERNAME`. The hostname becomes
your host folder name under `Agents/Hosts/`.

Check basic prerequisites are present:

```bash
git --version
ssh -V
node --version 2>/dev/null || echo "node not installed — hooks require node"
```

If `node` is missing, note it — the Claude Code hooks require it. The rice
script installs it; or install manually (`apt install nodejs` / `brew install
node` / `winget install OpenJS.NodeJS`).

---

## Phase 2 — Clone GremlinOps

If you are not already running inside the GremlinOps checkout, clone it now.
Use the URL from the operator's tethered repo if they gave one; otherwise clone
the public template:

```bash
# Public template (everyone starts here; replace URL with your fork when ready)
git clone https://github.com/Linkcwz/GremlinOps.git ~/gremlinops
cd ~/gremlinops
```

Windows / PowerShell:

```powershell
git clone https://github.com/Linkcwz/GremlinOps.git "$env:USERPROFILE\gremlinops"
Set-Location "$env:USERPROFILE\gremlinops"
```

> Already in the checkout? Skip this phase — you're here.

---

## Phase 3 — Configure agents

### Claude Code

Wire the project-local hooks from the example file:

```bash
cp .claude/settings.json.example .claude/settings.json
```

This activates all nine hooks. Model and permission defaults are already in
the file (`claude-sonnet-4-6`, `defaultMode: auto`).

Also write global defaults so Claude Code picks them up outside this project:

```bash
mkdir -p ~/.claude
node -e '
const fs=require("fs"),p=process.env.HOME+"/.claude/settings.json";
let j={};
try{j=JSON.parse(fs.readFileSync(p,"utf8")||"{}")}catch(e){}
j.model="claude-sonnet-4-6";
j.permissions=j.permissions||{};
j.permissions.defaultMode="auto";
delete j.skipDangerousModePermissionPrompt;
fs.writeFileSync(p,JSON.stringify(j,null,2)+"\n");
' 2>/dev/null || python3 -c "
import json,os,pathlib
p=pathlib.Path.home()/'.claude/settings.json'
j={}
try: j=json.loads(p.read_text())
except: pass
j['model']='claude-sonnet-4-6'
j.setdefault('permissions',{})['defaultMode']='auto'
j.pop('skipDangerousModePermissionPrompt',None)
p.write_text(json.dumps(j,indent=2)+'\n')
" || echo "Set model+permissions.defaultMode manually in ~/.claude/settings.json"
```

Skip this phase if the operator said agents-only = Codex or skip-agents.

### Codex CLI

```bash
mkdir -p ~/.codex
# Idempotent upsert — only writes keys not already present or differing
python3 - <<'PY'
import pathlib, re, sys
p = pathlib.Path.home() / '.codex/config.toml'
want = {
    'approval_policy': '"never"',
    'sandbox_mode': '"danger-full-access"',
    'model': '"gpt-4.5-mini"',
    'model_reasoning_effort': '"high"',
}
src = p.read_text() if p.exists() else ''
for k, v in want.items():
    if not re.search(rf'^{k}\s*=', src, re.M):
        src += f'\n{k} = {v}'
# [tui] section
if '[tui]' not in src:
    src += '\n\n[tui]\npet = "null-signal"\n'
elif not re.search(r'^pet\s*=', src, re.M):
    src = re.sub(r'(\[tui\])', r'\1\npet = "null-signal"', src)
p.write_text(src.strip() + '\n')
print('~/.codex/config.toml updated')
PY
```

Skip this phase if the operator said Claude-only or skip-agents.

### Theming (if operator chose rice)

The rice script handles terminal fonts, prompt theme, and shell environment:

```bash
# From the GremlinOps checkout or your own homelab rice repo:
bash rice.sh          # Linux / WSL (use --skip-agent-config if already done)
# rice.cmd            # Windows polyglot (bash section runs on Linux/WSL)
# rice.ps1            # Windows PowerShell
```

The rice script is not bundled in this repo — it lives in your homelab utils.
If you don't have it yet, skip theming for now and install fonts + prompt theme
manually or later.

---

## Phase 4 — Generate machine identity keypair

This machine gets its own ed25519 identity key. It is NOT the operator's
personal key — it is a self-sovereign agent identity, revocable per-machine.

```bash
HOST=$(hostname -s 2>/dev/null || hostname)
KEYNAME="gremlinops-${HOST}-identity"
mkdir -p ~/.ssh
ssh-keygen -t ed25519 -C "$KEYNAME@$(date +%Y-%m-%d)" \
           -f "$HOME/.ssh/$KEYNAME" -N ""
echo ""
echo "==> Machine identity public key (add to your private repo as a deploy/access key):"
echo ""
cat "$HOME/.ssh/${KEYNAME}.pub"
echo ""
echo "==> Private key lives at: ~/.ssh/${KEYNAME}"
echo "    Keep it local — never commit private keys."
```

Record the public key fingerprint. If tethered, the operator will add this
public key to their private remote repo (as a deploy key or collaborator key)
in Phase 7.

---

## Phase 5 — Initialize host folder

```bash
HOST=$(hostname -s 2>/dev/null || hostname)
REPO=$(pwd)   # assumes you are in the GremlinOps checkout

mkdir -p "$REPO/Agents/Hosts/$HOST/memories"
mkdir -p "$REPO/Agents/Hosts/$HOST/handoffs"
mkdir -p "$REPO/Agents/Hosts/$HOST/instructions"

# Copy the template AGENTS.md if the folder is new
if [ ! -f "$REPO/Agents/Hosts/$HOST/AGENTS.md" ]; then
  cp "$REPO/Agents/Hosts/_template/AGENTS.md" "$REPO/Agents/Hosts/$HOST/AGENTS.md"
  echo "Created Agents/Hosts/$HOST/AGENTS.md — fill in role + constraints."
fi
```

Edit `Agents/Hosts/<HOST>/AGENTS.md`: replace `<Host>` placeholders with the
actual hostname and write a one-paragraph role description (use the operator's
answer from the Collect step).

Write the bootstrap memory note:

```bash
HOST=$(hostname -s 2>/dev/null || hostname)
TODAY=$(date +%Y-%m-%d)
KEYNAME="gremlinops-${HOST}-identity"
cat > "Agents/Hosts/$HOST/memories/${TODAY}-bootstrap.md" << EOF
---
Bootstrap completed on ${TODAY}.
Platform: $(uname -srm 2>/dev/null || echo 'Windows')
Machine identity key: ~/.ssh/${KEYNAME}
Public key: $(cat "$HOME/.ssh/${KEYNAME}.pub" 2>/dev/null || echo '(not yet generated)')
Operating mode: [TETHERED|YOLO — fill in]
Remote repo URL: [fill in if tethered]
Agents installed: [fill in]
---
EOF
echo "Wrote bootstrap memory to Agents/Hosts/$HOST/memories/${TODAY}-bootstrap.md"
```

---

## Phase 6 — Install git hooks

```bash
bash Agents/Git/install-hooks.sh "$(pwd)"
```

Verify the hooks landed:

```bash
ls .git/hooks/
# Expected: commit-msg  pre-commit  post-commit  pre-push  (plus possibly others)
```

---

## Phase 7 — Connect remote (tethered mode only)

If the operator chose YOLO, skip to Phase 8.

The operator must first add this machine's public key (printed in Phase 4) to
their private remote repo as a deploy key with write access (GitHub: Settings →
Deploy keys; GitLab: Settings → Repository → Deploy keys; Gitea/Forgejo:
similar). Once they confirm the key is added:

```bash
# Add their private repo as origin (or rename if 'origin' is already the public template)
git remote add private <operator-remote-url>
# OR: git remote rename origin template && git remote add origin <operator-remote-url>

# Verify SSH access works
ssh -T git@<host> -o IdentitiesOnly=yes \
  -i "$HOME/.ssh/gremlinops-$(hostname -s 2>/dev/null || hostname)-identity" \
  2>&1 | head -3
```

Push this bootstrap commit:

```bash
git add Agents/Hosts/$(hostname -s 2>/dev/null || hostname)/
GREMLIN_AGENT_COMMIT=1 git commit -m "bootstrap: add $(hostname -s) host folder and machine identity"
git push -u private main   # or master / or whatever branch the operator chose
```

Update the git policy file to point at this remote:

```bash
# Edit Agents/Git/git-policy.env — set POLICY_REMOTE=private (or origin)
# and POLICY_BRANCH=main (or whatever branch)
```

---

## Phase 8 — Verify

Confirm the hooks fire and the startup ritual surfaces correctly:

```bash
# Run a test commit on a throwaway file
echo "$(date)" > /tmp/gremlin-test.txt
git add /tmp/gremlin-test.txt 2>/dev/null || true
# Hooks should fire on the next real commit; verify one fires now:
GREMLIN_AGENT_COMMIT=1 git commit --allow-empty -m "chore: verify hooks fire on $(hostname -s)"
```

For Claude Code: open the repo as a project and confirm the first agent output
begins with an identity block (`Identity surfaced: <HOST> ...`). If the session-
start hook is wired, this happens automatically.

For Codex: start a session in the repo directory and confirm the agent reads
`AGENTS.md` as its first action.

---

## Done state

At the end of this bootstrap, the following should be true:

- `Agents/Hosts/<HOST>/` exists with `AGENTS.md` and a bootstrap memory note
- `.claude/settings.json` exists and points hooks at the GremlinOps checkout
- `~/.codex/config.toml` exists with the approved model and null-signal pet
- `~/.ssh/gremlinops-<HOST>-identity` and `.pub` exist
- `.git/hooks/` contains the four managed hooks
- If tethered: a remote is set, key is authorized, bootstrap commit pushed
- Every future session opens with the startup ritual (identity block first)

**From here:** open `doctrine/control-plane.md` to understand the enforcement
model and trust tiers. Open `onboarding/QUICKSTART.md` for the three habits
that prevent drift. Build your own `Agents/Hosts/<HOST>/` memory tree as you
work — every durable fact goes there, not in the chat session.
