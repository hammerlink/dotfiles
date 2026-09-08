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
  name: "zellij",
  dependsOn: ["cargo-binstall"],
  configDir: "zellij",
  check: async (): Promise<CheckResult> => {
    if (!(await which("zellij"))) return { upToDate: false };
    const out = await $`zellij --version`.text().catch(() => "");
    const installed = out.match(/zellij ([\d.]+)/)?.[1] ?? "";
    if (!installed) return { upToDate: false };
    const latest = await githubLatest("zellij-org/zellij");
    return {
      upToDate: stripV(installed) === stripV(latest),
      installed,
      latest,
    };
  },
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
