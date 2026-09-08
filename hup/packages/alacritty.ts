import { join } from "@std/path";
import {
  DOTFILES_CONFIG,
  ensureSymlink,
  HOME,
  type PackageDef,
  which,
} from "../core.ts";

export const pkg: PackageDef = {
  name: "alacritty",
  configDir: "alacritty",
  check: async () => ({ upToDate: await which("alacritty") }),
  ensure: async () => {
    if (!(await which("alacritty"))) {
      console.log(
        "note: alacritty binary not found (install via your system package manager)",
      );
    }
    await ensureSymlink(
      join(DOTFILES_CONFIG, "alacritty"),
      join(HOME, ".config", "alacritty"),
      "alacritty config",
    );
  },
};
