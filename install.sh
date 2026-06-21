#!/usr/bin/env bash

set -e

PACKAGES=()
command -v fish &>/dev/null || PACKAGES+=(fish)
command -v unzip &>/dev/null || PACKAGES+=(unzip)
command -v python3 &>/dev/null || PACKAGES+=(python3)
python3 -m pip --version &>/dev/null 2>&1 || PACKAGES+=(python3-pip)
python3 -m venv --help &>/dev/null 2>&1 || PACKAGES+=(python3-venv)

if [ ${#PACKAGES[@]} -eq 0 ]; then
  echo "skip: fish, unzip, python3, python3-pip already installed"
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
  cargo install --locked ripgrep
fi

if command -v atuin &>/dev/null; then
  echo "skip: atuin already installed"
else
  echo "==> Installing atuin"
  cargo install --locked atuin
fi

if command -v zellij &>/dev/null; then
  echo "skip: zellij already installed"
else
  echo "==> Installing zellij"
  cargo install --locked zellij
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

if command -v nix &>/dev/null; then
  echo "skip: nix already installed"
else
  echo "==> Installing Nix (single-user)"
  curl --proto '=https' --tlsv1.2 -L https://nixos.org/nix/install | sh -s -- --no-daemon
fi

if git config --global user.email &>/dev/null && git config --global user.name &>/dev/null; then
  echo "skip: git already configured"
else
  echo "==> Configuring git"
  git config --global user.email "hendrik.hamerlinck@hammernet.be"
  git config --global user.name "Hendrik Hamerlinck"
fi

FISH_PATH="$(which fish)"
if [ "$SHELL" = "$FISH_PATH" ]; then
  echo "skip: fish is already the default shell"
else
  echo "==> Setting fish as default shell"
  grep -qxF "$FISH_PATH" /etc/shells || echo "$FISH_PATH" | sudo tee -a /etc/shells
  chsh -s "$FISH_PATH"
fi

echo ""
echo "Done. Make sure ~/.local/bin is in your PATH for nvim."
echo ""
echo "==> Linking dotfiles"
bash "$(dirname "$0")/link.sh"
