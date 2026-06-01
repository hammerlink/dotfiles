#!/usr/bin/env bash

set -e

echo "==> Installing fish"
sudo apt-get update -q
sudo apt-get install -y fish

echo "==> Installing Neovim (AppImage)"
NVIM_URL=$(curl -s https://api.github.com/repos/neovim/neovim/releases/latest \
    | grep "browser_download_url.*nvim-linux-x86_64.appimage\"" \
    | cut -d '"' -f 4)
curl -Lo "$HOME/.local/bin/nvim" "$NVIM_URL"
chmod +x "$HOME/.local/bin/nvim"
mkdir -p "$HOME/.local/bin"

echo "==> Installing Rust"
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

echo "==> Installing atuin"
cargo install atuin

echo "==> Installing zellij"
cargo install zellij

echo ""
echo "Done. Make sure ~/.local/bin is in your PATH for nvim."
echo "To set fish as your default shell: chsh -s \$(which fish)"
