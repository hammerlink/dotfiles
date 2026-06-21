# Dotfiles of hammerlink

Managed with [Deno](https://deno.land/) tasks. Config files live under `.config/`
and are symlinked into `~/.config/` by the install script.

Use `./install.sh` to automtically install everything.

## Structure

```
.config/
  alacritty/   # terminal emulator
  atuin/       # shell history
  fish/        # shell
  nvim/        # neovim
  zellij/      # terminal multiplexer
install.ts     # full machine setup
update.ts      # update individually managed packages
deno.json      # task runner
```

## Setup

Requires [Deno](https://deno.land/). Run once on a new machine:

```sh
deno task install
```

This installs: fish, Neovim, Rust, ripgrep, atuin, zellij, fnm, Node.js,
opencode, Nix, configures git, sets fish as the default shell, and symlinks
`.config/` entries into `~/.config/`.

## Updating packages

```sh
deno task update              # update all packages
deno task update nvim         # update only nvim
deno task update rust atuin   # update multiple specific packages
deno task update list         # list all updatable packages
```

Updatable packages: `nvim`, `rust`, `rg`, `atuin`, `zellij`, `fnm`, `node`, `opencode`.
