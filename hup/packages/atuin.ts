import { join } from "@std/path";
import {
  $,
  DOTFILES_CONFIG,
  ensureSymlink,
  HOME,
  type PackageDef,
  which,
} from "../core.ts";

export const pkg: PackageDef = {
  name: "atuin",
  dependsOn: ["cargo-binstall"],
  configDir: "atuin",
  check: async () => ({ upToDate: await which("atuin") }),
  ensure: async () => {
    console.log("==> Installing atuin");
    await $`cargo binstall atuin`;
    await ensureSymlink(
      join(DOTFILES_CONFIG, "atuin"),
      join(HOME, ".config", "atuin"),
      "atuin config",
    );
  },
};
