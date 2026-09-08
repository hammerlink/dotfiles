#!/bin/sh
# Bootstrap: make sure deno and the hup CLI are available, then hand off to hup.
# Works from bash, fish, or sh:
#   sh install.sh          (from inside the repo)
#   sh /path/to/install.sh (from anywhere)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v deno >/dev/null 2>&1; then
  if [ -x "$HOME/.deno/bin/deno" ]; then
    PATH="$HOME/.deno/bin:$PATH"
    export PATH
  else
    echo "==> Installing Deno"
    curl -fsSL https://deno.land/install.sh | sh
    PATH="$HOME/.deno/bin:$PATH"
    export PATH
  fi
fi

if command -v hup >/dev/null 2>&1; then
  echo "skip: hup already installed ($(command -v hup))"
else
  echo "==> Installing hup"
  deno install -g -n hup --allow-all \
    --config "$SCRIPT_DIR/hup/deno.json" \
    "$SCRIPT_DIR/hup/mod.ts"
  exec hup
fi
