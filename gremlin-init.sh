#!/usr/bin/env bash
# gremlin-init.sh — GremlinOps new-machine bootstrap
#
# Usage (interactive — stdin stays connected to your terminal):
#   bash <(curl -sL https://raw.githubusercontent.com/Linkcwz/GremlinOps/main/gremlin-init.sh)
#
# Or download first, then run:
#   curl -sL https://raw.githubusercontent.com/Linkcwz/GremlinOps/main/gremlin-init.sh \
#     -o ~/gremlin-init.sh && bash ~/gremlin-init.sh
#
# Or if you already cloned the repo:
#   bash gremlin-init.sh   (from the repo root)
#
# After this script finishes, paste NEW_DEVICE_AGENT_ONBOARDING.md into your
# agent for the repo-backed memory and constitution layer.

set -euo pipefail

### ── colours ────────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  G='\033[0;32m'; Y='\033[1;33m'; C='\033[0;36m'; R='\033[0;31m'; N='\033[0m'
else
  G=''; Y=''; C=''; R=''; N=''
fi

step()  { echo -e "${G}  [+]${N} $*"; }
warn()  { echo -e "${Y}  [!]${N} $*"; }
fatal() { echo -e "${R}  [x]${N} $*" >&2; exit 1; }
ask()   { echo -e "${C}  ?${N}  $*"; }

banner() {
  echo ""
  echo -e "${C}┌──────────────────────────────────────────┐"
  echo    "│  GremlinOps — new machine bootstrap        │"
  echo -e "└──────────────────────────────────────────┘${N}"
  echo ""
}

prompt() {
  # prompt <var> <message> [<default>]
  local _var="$1" _msg="$2" _def="${3:-}"
  if [ -n "$_def" ]; then
    read -r -p "  $_msg [$_def]: " _input </dev/tty
    eval "$_var=\"\${_input:-\$_def}\""
  else
    read -r -p "  $_msg: " _input </dev/tty
    eval "$_var=\"\$_input\""
  fi
}

### ── constants ──────────────────────────────────────────────────────────────
GREMLINOPS_REPO_URL="https://github.com/Linkcwz/GremlinOps.git"
DEFAULT_CLONE_DIR="$HOME/gremlinops"

### ── banner + questions ─────────────────────────────────────────────────────
banner

echo "  Answer a few questions and then walk away. Defaults shown in [brackets]."
echo ""

prompt MACHINE_ROLE "Machine role (workstation / dev VM / test VM / server / etc.)" "workstation"

echo ""
echo "  Which agents should be installed?"
echo "    1) Claude Code only"
echo "    2) Codex CLI only"
echo "    3) Both Claude Code + Codex CLI  [default]"
echo "    4) Neither — just set up the repo"
prompt AGENTS_CHOICE "Choice" "3"

echo ""
echo "  Operating mode:"
echo "    t) Tethered — sync durable memory to a private remote git repo  [default]"
echo "    y) YOLO — local folder only, no remote sync"
prompt OP_MODE "Mode" "t"

REMOTE_URL=""
if [[ "${OP_MODE,,}" == t* ]]; then
  echo ""
  echo "  Tethered mode: you need an empty private git repo (GitHub / GitLab / Gitea / Forgejo)."
  echo "  If you don't have one yet, create it now and come back."
  echo "  Paste the SSH or HTTPS URL of your private repo (or press Enter to set up later)."
  prompt REMOTE_URL "Remote repo URL" ""
fi

echo ""
echo "  Terminal theming?"
echo "    y) Yes — run the rice script to configure shell, prompt theme, and Nerd Font"
echo "    n) No  — skip theming, agents-only setup  [default]"
prompt DO_THEMING "Theme" "n"

echo ""
step "Collecting answers — proceeding with setup..."
echo ""

### ── platform detection ─────────────────────────────────────────────────────
HOST=$(hostname -s 2>/dev/null || hostname)
OS_TYPE=""
if [[ "${OSTYPE:-}" == darwin* ]]; then
  OS_TYPE="macos"
elif grep -qi microsoft /proc/version 2>/dev/null; then
  OS_TYPE="wsl"
else
  OS_TYPE="linux"
fi

step "Platform: $OS_TYPE, hostname: $HOST"

### ── prerequisites ──────────────────────────────────────────────────────────
step "Checking prerequisites..."

MISSING=()
command -v git  >/dev/null 2>&1 || MISSING+=("git")
command -v ssh  >/dev/null 2>&1 || MISSING+=("openssh-client")
command -v node >/dev/null 2>&1 || MISSING+=("node")

if [ ${#MISSING[@]} -gt 0 ]; then
  warn "Missing: ${MISSING[*]}"
  if [[ "$OS_TYPE" == "linux" || "$OS_TYPE" == "wsl" ]]; then
    echo "  Installing via apt..."
    sudo apt-get update -qq
    for pkg in "${MISSING[@]}"; do
      case "$pkg" in
        node) sudo apt-get install -y -qq nodejs ;;
        *)    sudo apt-get install -y -qq "$pkg" ;;
      esac
    done
  elif [[ "$OS_TYPE" == "macos" ]]; then
    command -v brew >/dev/null 2>&1 || fatal "Homebrew not found — install it first: https://brew.sh"
    for pkg in "${MISSING[@]}"; do
      case "$pkg" in
        node) brew install node ;;
        openssh-client) : ;;  # macOS ships openssh
        *) brew install "$pkg" ;;
      esac
    done
  else
    warn "Cannot auto-install on this platform. Install manually: ${MISSING[*]}"
  fi
fi
step "Prerequisites OK."

### ── clone (if not already in checkout) ─────────────────────────────────────
REPO_ROOT=""
# Detect if we're already inside a gremlinops checkout
if [ -f "$(pwd)/AGENTS.md" ] && [ -d "$(pwd)/Agents/Hosts" ]; then
  REPO_ROOT="$(pwd)"
  step "Already in a GremlinOps checkout: $REPO_ROOT"
elif [ -f "$(pwd)/../AGENTS.md" ] && [ -d "$(pwd)/../Agents/Hosts" ]; then
  REPO_ROOT="$(cd .. && pwd)"
  step "GremlinOps checkout found at: $REPO_ROOT"
else
  echo ""
  prompt CLONE_DIR "Clone destination" "$DEFAULT_CLONE_DIR"
  if [ -d "$CLONE_DIR/.git" ]; then
    step "Existing checkout found at $CLONE_DIR — using it."
  else
    step "Cloning GremlinOps to $CLONE_DIR..."
    git clone "$GREMLINOPS_REPO_URL" "$CLONE_DIR" || {
      warn "Clone from $GREMLINOPS_REPO_URL failed."
      warn "Update GREMLINOPS_REPO_URL in this script with your fork's URL."
      warn "Or clone manually: git clone <your-url> $CLONE_DIR"
      fatal "Cannot continue without the GremlinOps checkout."
    }
  fi
  REPO_ROOT="$CLONE_DIR"
fi
cd "$REPO_ROOT"

### ── configure agents ────────────────────────────────────────────────────────
configure_claude() {
  step "Configuring Claude Code..."

  # Project-local settings (activates all hooks)
  if [ ! -f ".claude/settings.json" ] && [ -f ".claude/settings.json.example" ]; then
    cp .claude/settings.json.example .claude/settings.json
    step "Created .claude/settings.json from example (hooks wired)."
  elif [ -f ".claude/settings.json" ]; then
    step ".claude/settings.json already exists — keeping it."
  else
    warn ".claude/settings.json.example not found — copy it manually after setup."
  fi

  # Global settings (model + permissions)
  mkdir -p "$HOME/.claude"
  local cfg="$HOME/.claude/settings.json"
  if command -v node >/dev/null 2>&1; then
    node - "$cfg" <<'JS'
const fs=require("fs"),p=process.argv[1];
let j={};
try{j=JSON.parse(fs.readFileSync(p,"utf8")||"{}")}catch(e){}
j.model="claude-sonnet-4-6";
j.permissions=j.permissions||{};
j.permissions.defaultMode="auto";
delete j.skipDangerousModePermissionPrompt;
fs.writeFileSync(p,JSON.stringify(j,null,2)+"\n");
JS
    step "Global ~/.claude/settings.json: sonnet-4-6, auto mode."
  elif command -v python3 >/dev/null 2>&1; then
    python3 - "$cfg" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1])
j={}
try: j=json.loads(p.read_text()) if p.exists() else {}
except: pass
j["model"]="claude-sonnet-4-6"
j.setdefault("permissions",{})["defaultMode"]="auto"
j.pop("skipDangerousModePermissionPrompt",None)
p.write_text(json.dumps(j,indent=2)+"\n")
PY
    step "Global ~/.claude/settings.json: sonnet-4-6, auto mode."
  else
    warn "Neither node nor python3 found — set model+permissions manually in ~/.claude/settings.json"
  fi
}

configure_codex() {
  step "Configuring Codex CLI..."
  mkdir -p "$HOME/.codex"
  if command -v python3 >/dev/null 2>&1; then
    python3 - <<'PY'
import pathlib, re
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
if '[tui]' not in src:
    src += '\n\n[tui]\npet = "null-signal"\n'
elif not re.search(r'^pet\s*=', src, re.M):
    src = re.sub(r'(\[tui\])', r'\1\npet = "null-signal"', src)
p.write_text(src.strip() + '\n')
print('  ~/.codex/config.toml configured (gpt-4.5-mini, high reasoning, null-signal)')
PY
  else
    # Fallback: write it directly if file doesn't exist
    if [ ! -f "$HOME/.codex/config.toml" ]; then
      cat > "$HOME/.codex/config.toml" <<'TOML'
approval_policy = "never"
sandbox_mode = "danger-full-access"
model = "gpt-4.5-mini"
model_reasoning_effort = "high"

[tui]
pet = "null-signal"
TOML
      step "Created ~/.codex/config.toml."
    else
      warn "~/.codex/config.toml exists — update model/settings manually (see onboarding/QUICKSTART.md)."
    fi
  fi
}

case "${AGENTS_CHOICE}" in
  1) configure_claude ;;
  2) configure_codex ;;
  3) configure_claude; configure_codex ;;
  4) step "Skipping agent config (choice 4)." ;;
  *) configure_claude; configure_codex ;;  # default to both
esac

### ── theming ─────────────────────────────────────────────────────────────────
if [[ "${DO_THEMING,,}" == y* ]]; then
  if [ -f "rice.sh" ]; then
    step "Running rice.sh (--skip-agent-config since agents already configured)..."
    bash rice.sh --skip-agent-config
  else
    warn "rice.sh not found in this checkout."
    warn "Run your homelab rice script separately, or install Nerd Font + a prompt theme manually."
  fi
else
  step "Skipping theming."
fi

### ── machine identity keypair ────────────────────────────────────────────────
KEYNAME="gremlinops-${HOST}-identity"
KEYPATH="$HOME/.ssh/$KEYNAME"

step "Generating machine identity keypair..."
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

if [ -f "$KEYPATH" ]; then
  step "Key already exists: $KEYPATH"
else
  ssh-keygen -t ed25519 \
    -C "${KEYNAME}@$(date +%Y-%m-%d)" \
    -f "$KEYPATH" -N ""
  chmod 600 "$KEYPATH"
  chmod 644 "${KEYPATH}.pub"
  step "Generated: $KEYPATH"
fi

echo ""
echo -e "${Y}  ═══ Machine identity PUBLIC KEY ═══${N}"
cat "${KEYPATH}.pub"
echo -e "${Y}  ═══════════════════════════════════${N}"
echo "  Add this key to your private remote repo as a deploy/access key with write access."
echo "  Private key lives at: $KEYPATH"
echo ""

### ── initialize host folder ──────────────────────────────────────────────────
HOSTDIR="Agents/Hosts/$HOST"
step "Initializing host folder: $HOSTDIR"

mkdir -p "$HOSTDIR/memories" "$HOSTDIR/handoffs" "$HOSTDIR/instructions"

if [ ! -f "$HOSTDIR/AGENTS.md" ]; then
  if [ -f "Agents/Hosts/_template/AGENTS.md" ]; then
    cp "Agents/Hosts/_template/AGENTS.md" "$HOSTDIR/AGENTS.md"
    # Substitute placeholders
    sed -i "s/<Host>/$HOST/g" "$HOSTDIR/AGENTS.md" 2>/dev/null || true
    step "Created $HOSTDIR/AGENTS.md from template."
    warn "Edit $HOSTDIR/AGENTS.md — replace <One paragraph> with this machine's role: $MACHINE_ROLE"
  else
    cat > "$HOSTDIR/AGENTS.md" <<EOF
# $HOST Agent Instructions

You are operating from host \`$HOST\`.

## Role

$MACHINE_ROLE

## Primary Write Scope

\`\`\`text
Agents/Hosts/$HOST/
\`\`\`

Default write targets: \`memories/\`, \`instructions/\`, \`handoffs/\`.

## Mandatory Startup and Closeout

Before editing the repo, load the repo-root \`AGENTS.md\` and the shared
agent instructions in \`Agents/Agent-Notes/AGENTS.shared.md\`. Durable notes
are repo-backed memory: commit and push them per the transport policy before
ending the turn unless the operator says not to.
EOF
    step "Created $HOSTDIR/AGENTS.md."
  fi
fi

MODE_LABEL="YOLO (local only)"
[[ "${OP_MODE,,}" == t* ]] && MODE_LABEL="TETHERED"

TODAY=$(date +%Y-%m-%d)
cat > "$HOSTDIR/memories/${TODAY}-bootstrap.md" <<EOF
---
Bootstrap completed ${TODAY}.
Platform: $(uname -srm 2>/dev/null || echo 'Windows')
Machine identity key: ~/.ssh/${KEYNAME}
Operating mode: ${MODE_LABEL}
Remote repo: ${REMOTE_URL:-"(none — YOLO mode)"}
Agents installed: ${AGENTS_CHOICE}
Role: ${MACHINE_ROLE}
---
EOF
step "Wrote bootstrap memory: $HOSTDIR/memories/${TODAY}-bootstrap.md"

### ── install git hooks ────────────────────────────────────────────────────────
step "Installing git hooks..."
if [ -f "Agents/Git/install-hooks.sh" ]; then
  bash Agents/Git/install-hooks.sh "$(pwd)"
else
  warn "Agents/Git/install-hooks.sh not found — run it manually after setup."
fi

### ── tethered remote setup ────────────────────────────────────────────────────
if [[ "${OP_MODE,,}" == t* ]]; then
  if [ -n "$REMOTE_URL" ]; then
    step "Setting up tethered remote..."

    CURRENT_REMOTES=$(git remote 2>/dev/null || echo "")
    if echo "$CURRENT_REMOTES" | grep -q "^origin$"; then
      warn "'origin' already set — adding tethered remote as 'private'."
      git remote add private "$REMOTE_URL" 2>/dev/null || git remote set-url private "$REMOTE_URL"
      PUSH_REMOTE="private"
    else
      git remote add origin "$REMOTE_URL" 2>/dev/null || git remote set-url origin "$REMOTE_URL"
      PUSH_REMOTE="origin"
    fi

    echo ""
    echo "  NEXT: add this machine's public key to $REMOTE_URL as a deploy key."
    echo "  Then press Enter to continue and push the bootstrap commit."
    read -r -p "  Press Enter when the key is authorized on the remote... " </dev/tty

    step "Committing and pushing bootstrap..."
    git add "$HOSTDIR/" .claude/settings.json 2>/dev/null || true
    GREMLIN_AGENT_COMMIT=1 git commit -m "bootstrap: add $HOST host folder and machine identity" \
      2>/dev/null || step "(Nothing new to commit — bootstrap already staged.)"
    git push -u "$PUSH_REMOTE" "$(git rev-parse --abbrev-ref HEAD)" \
      && step "Pushed bootstrap to $REMOTE_URL."
  else
    warn "No remote URL provided. Skipping remote setup."
    warn "To tether later: git remote add origin <url> && git push -u origin <branch>"
  fi
else
  step "YOLO mode — skipping remote setup."
  step "Committing bootstrap locally..."
  git add "$HOSTDIR/" .claude/settings.json 2>/dev/null || true
  GREMLIN_AGENT_COMMIT=1 git commit -m "bootstrap: add $HOST host folder (YOLO mode)" \
    2>/dev/null || step "(Nothing new to commit.)"
fi

### ── done ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}╔══════════════════════════════════════════════╗"
echo    "║  Bootstrap complete.                         ║"
echo -e "╚══════════════════════════════════════════════╝${N}"
echo ""
echo "  Host folder : $REPO_ROOT/$HOSTDIR/"
echo "  Identity key: $KEYPATH"
echo "  Hooks       : $(ls .git/hooks/ 2>/dev/null | tr '\n' ' ')"
echo ""
echo -e "${C}Next steps:${N}"
echo "  1. Open $HOSTDIR/AGENTS.md and fill in the role paragraph."
echo "  2. Paste NEW_DEVICE_AGENT_ONBOARDING.md into your agent as a prompt"
echo "     to complete the repo-backed memory and constitution layer."
echo "  3. Read doctrine/control-plane.md to understand the enforcement model."
echo "  4. Every session: agent opens with 'Identity surfaced: $HOST ...'"
echo "     If it doesn't, the session-start hook isn't firing — check .claude/settings.json."
echo ""
if [[ "${DO_THEMING,,}" != y* ]]; then
  echo -e "${Y}Theming skipped.${N} For fonts + prompt theme, run your rice script separately"
  echo "  or follow the manual setup in onboarding/QUICKSTART.md."
  echo ""
fi
