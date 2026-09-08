# Global preferences

- Never manage git yourself, read only
- Keep documentation in code minimalistic. Prevent verbose documentation

## System management

- Prefer Deno with the `$` shell library (`@david/dax`) for system automation
  over bash scripts.
- Use `hup` to keep crates and specific packages up to date (not ad-hoc version
  checks).
- Dotfiles live in `~/Projects/dotfiles` or `~/Projects/hammerlink/dotfiles`;
  config under `.config/` is symlinked into `~/.config/`.
