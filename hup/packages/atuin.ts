import { join } from "@std/path";
import {
  $,
  type CheckResult,
  DOTFILES_CONFIG,
  ensureSymlink,
  githubLatest,
  HOME,
  type PackageDef,
  stripV,
  which,
} from "../core.ts";

export const pkg: PackageDef = {
  name: "atuin",
  dependsOn: ["cargo-binstall"],
  configDir: "atuin",
  check: async (): Promise<CheckResult> => {
    if (!(await which("atuin"))) return { upToDate: false };
    const out = await $`atuin --version`.text().catch(() => "");
    const installed = out.match(/atuin ([\d.]+)/)?.[1] ?? "";
    if (!installed) return { upToDate: false };
    const latest = await githubLatest("atuinsh/atuin");
    return {
      upToDate: stripV(installed) === stripV(latest),
      installed,
      latest,
    };
  },
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
