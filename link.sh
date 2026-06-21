#!/usr/bin/env bash

DOTFILES_CONFIG="$(cd "$(dirname "$0")/.config" && pwd)"
TARGET_CONFIG="$HOME/.config"

mkdir -p "$TARGET_CONFIG"

for src in "$DOTFILES_CONFIG"/*; do
    name="$(basename "$src")"
    dest="$TARGET_CONFIG/$name"

    if [ -L "$dest" ] || [ -e "$dest" ]; then
        read -r -p "already exists: $dest — delete and relink? [y/N] " answer
        if [[ "$answer" =~ ^[Yy]$ ]]; then
            rm -rf "$dest"
            ln -s "$src" "$dest"
            echo "linked: $dest -> $src"
        else
            echo "skipped: $dest"
        fi
    else
        ln -s "$src" "$dest"
        echo "linked: $dest -> $src"
    fi
done
