# Dotfiles of hammerlink

Managed with [Deno](https://deno.land/). Config files live under `.config/` and
are symlinked into `~/.config/`. The `hup` CLI keeps your packages and machine
setup in sync from anywhere on the system.

## Setup

Requires [Deno](https://deno.land/) (installed automatically if missing). Run
once on a new machine:

```sh
./install.sh
```

This installs Deno (if needed), installs the `hup` CLI globally, then runs
`hup`. On a fresh machine `hup` detects the empty config and walks you through
selecting setup tasks and packages interactively, applies them, and saves your
choices to `~/.config/hup/config.json`.

## Day-to-day

```sh
hup                 # ensure + update all enabled packages
hup -p nvim rust    # ensure + update specific packages (bypasses config)
hup list            # list packages and setup tasks with their state
hup config          # interactively toggle which packages are enabled
hup config list     # list packages and their state
hup setup           # select + apply machine setup tasks
hup setup list      # list setup tasks and their state
```

`hup` is idempotent: already-installed / up-to-date items are skipped, and
setup tasks that are already done are no-ops. Safe to re-run any time.

## Packages

Installable tools, each owning its config symlink (where applicable):
`apt-packages`, `fish`, `alacritty`, `nvim`, `rust`, `cargo-binstall`, `rg`,
`atuin`, `zellij`, `fnm`, `just`, `node`, `deno`, `opencode`, `nix`,
`cargo-tools`.

Packages declare `dependsOn` (e.g. `rg` needs `cargo-binstall`, which needs
`rust`) and are executed in dependency order.

## Setup tasks

Global machine wiring, applied via `hup setup`: `git-config`, `default-shell`,
`agent-skills`, `hammercert` (local home CA certificate).

## Structure

```
.config/            # dotfiles symlinked into ~/.config/
  alacritty/ atuin/ fish/ nvim/ opencode/ zellij/
.agents/skills/     # agent skills, symlinked into ~/.agents/skills
certs/              # local CA certificate
hup/                # the hup CLI
  core.ts           # shared helpers, $ shell, types, symlink + topo logic
  mod.ts            # CLI entrypoint (commands, config, fresh-machine flow)
  setup.ts          # machine setup tasks
  packages/         # one file per package
install.sh          # bootstrap: deno + hup, then runs hup
deno.json           # task runner
```
