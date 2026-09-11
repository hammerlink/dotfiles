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
  name: "zellij",
  dependsOn: ["cargo-binstall"],
  configDir: "zellij",
  check: async () => ({ upToDate: await which("zellij") }),
  ensure: async () => {
    console.log("==> Installing zellij");
    await $`cargo binstall zellij`;
    await ensureSymlink(
      join(DOTFILES_CONFIG, "zellij"),
      join(HOME, ".config", "zellij"),
      "zellij config",
    );
  },
};
