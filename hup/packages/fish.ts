import { join } from "@std/path";
import {
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
      const { success } = await new Deno.Command("sudo", {
        args: ["apt-get", "install", "-y", "fish"],
        stdout: "inherit",
        stderr: "inherit",
      }).output();
      if (!success) throw new Error("failed to install fish");
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
