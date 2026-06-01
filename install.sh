#!/usr/bin/env bash

set -e

PACKAGES=()
command -v fish   &>/dev/null || PACKAGES+=(fish)
command -v unzip  &>/dev/null || PACKAGES+=(unzip)

if [ ${#PACKAGES[@]} -eq 0 ]; then
    echo "skip: fish, unzip already installed"
else
    echo "==> Installing: ${PACKAGES[*]}"
    sudo apt-get update -q
    sudo apt-get install -y "${PACKAGES[@]}"
fi

mkdir -p "$HOME/.local/bin"
if command -v nvim &>/dev/null; then
  echo "skip: nvim already installed"
else
  echo "==> Installing Neovim (AppImage)"
  NVIM_URL=$(curl -s https://api.github.com/repos/neovim/neovim/releases/latest |
    grep "browser_download_url.*nvim-linux-x86_64.appimage\"" |
    cut -d '"' -f 4)
  curl -Lo "$HOME/.local/bin/nvim" "$NVIM_URL"
  chmod +x "$HOME/.local/bin/nvim"
fi

if command -v cargo &>/dev/null; then
  echo "skip: Rust already installed"
  source "$HOME/.cargo/env"
else
  echo "==> Installing Rust"
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
fi

if command -v rg &>/dev/null; then
  echo "skip: ripgrep already installed"
else
  echo "==> Installing ripgrep"
  cargo install ripgrep
fi

if command -v atuin &>/dev/null; then
  echo "skip: atuin already installed"
else
  echo "==> Installing atuin"
  cargo install atuin
fi

if command -v zellij &>/dev/null; then
  echo "skip: zellij already installed"
else
  echo "==> Installing zellij"
  cargo install zellij
fi

if command -v fnm &>/dev/null; then
  echo "skip: fnm already installed"
else
  echo "==> Installing fnm (Fast Node Manager)"
  cargo install fnm
fi

if command -v node &>/dev/null; then
    echo "skip: node already installed"
else
    echo "==> Installing latest Node.js via fnm"
    eval "$(fnm env)"
    fnm install --lts
    fnm default lts-latest
fi

if command -v opencode &>/dev/null; then
  echo "skip: opencode already installed"
else
  echo "==> Installing opencode"
  curl -fsSL https://opencode.ai/install | bash
fi

echo ""
echo "Done. Make sure ~/.local/bin is in your PATH for nvim."
echo "To set fish as your default shell: chsh -s \$(which fish)"
