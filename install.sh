#!/usr/bin/env bash

set -e

if command -v deno &>/dev/null; then
  echo "skip: deno already installed"
else
  curl -fsSL https://deno.land/install.sh | sh
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$HOME/.deno/bin/deno" install -g -n hup --allow-all --config "$SCRIPT_DIR/hup/deno.json" "$SCRIPT_DIR/hup/mod.ts"

exec "$HOME/.deno/bin/deno" run --allow-all "$SCRIPT_DIR/install.ts"
