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
  name: "fish",
  dependsOn: ["cargo-binstall"],
  configDir: "fish",
  check: async () => ({ upToDate: await which("fish") }),
  ensure: async () => {
    if (!(await which("fish"))) {
      console.log("==> Installing fish");
      await $`cargo binstall just`;
    } else {
      console.log("skip: fish already installed");
    }
    await ensureSymlink(
      join(DOTFILES_CONFIG, "fish"),
      join(HOME, ".config", "fish"),
      "fish config",
    );
  },
};
