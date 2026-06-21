#!/usr/bin/env bash

set -e

if command -v deno &>/dev/null; then
  echo "skip: deno already installed"
else
  curl -fsSL https://deno.land/install.sh | sh
fi

exec "$HOME/.deno/bin/deno" run --allow-all "$(dirname "$0")/install.ts"
