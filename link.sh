#!/usr/bin/env bash

DOTFILES_CONFIG="$(cd "$(dirname "$0")/.config" && pwd)"
TARGET_CONFIG="$HOME/.config"

mkdir -p "$TARGET_CONFIG"

for src in "$DOTFILES_CONFIG"/*; do
    name="$(basename "$src")"
    dest="$TARGET_CONFIG/$name"

    if [ -L "$dest" ]; then
        echo "skip (already linked): $dest"
    elif [ -e "$dest" ]; then
        echo "skip (exists, not a symlink): $dest"
    else
        ln -s "$src" "$dest"
        echo "linked: $dest -> $src"
    fi
done
