#!/bin/sh
# Installs the hup CLI globally. Works from bash, fish, or sh:
#   sh hup.sh          (from inside the repo)
#   sh /path/to/hup.sh (from anywhere)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

HUP_BIN="$(command -v hup 2>/dev/null || true)"
if [ -z "$HUP_BIN" ] && [ -x "$HOME/.deno/bin/hup" ]; then
  HUP_BIN="$HOME/.deno/bin/hup"
fi
if [ -n "$HUP_BIN" ]; then
  echo "skip: hup already installed ($HUP_BIN)"
  exit 0
fi

if ! command -v deno >/dev/null 2>&1; then
  if [ -x "$HOME/.deno/bin/deno" ]; then
    PATH="$HOME/.deno/bin:$PATH"
    export PATH
  else
    echo "error: deno not found. Install it first:" >&2
    echo "  curl -fsSL https://deno.land/install.sh | sh" >&2
    exit 1
  fi
fi

deno install -g -n hup --allow-all \
  --config "$SCRIPT_DIR/hup/deno.json" \
  "$SCRIPT_DIR/hup/mod.ts"

echo "hup installed. Try: hup list"
