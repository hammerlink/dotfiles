import {
  $,
  type CheckResult,
  githubLatest,
  type PackageDef,
  stripV,
  which,
} from "../core.ts";

export const pkg: PackageDef = {
  name: "rg",
  dependsOn: ["cargo-binstall"],
  check: async (): Promise<CheckResult> => {
    if (!(await which("rg"))) return { upToDate: false };
    const out = await $`rg --version`.text().catch(() => "");
    const installed = out.match(/ripgrep ([\d.]+)/)?.[1] ?? "";
    if (!installed) return { upToDate: false };
    const latest = await githubLatest("BurntSushi/ripgrep");
    return {
      upToDate: stripV(installed) === stripV(latest),
      installed,
      latest,
    };
  },
  ensure: async () => {
    console.log("==> Installing ripgrep");
    await $`cargo binstall ripgrep`;
  },
};
