import {
  $,
  type CheckResult,
  githubLatest,
  type PackageDef,
  stripV,
  which,
} from "../core.ts";

export const pkg: PackageDef = {
  name: "fnm",
  dependsOn: ["cargo-binstall"],
  check: async (): Promise<CheckResult> => {
    if (!(await which("fnm"))) return { upToDate: false };
    const installed = (await $`fnm --version`.text().catch(() => "")).trim();
    if (!installed) return { upToDate: false };
    const latest = await githubLatest("Schniz/fnm");
    return {
      upToDate: stripV(installed) === stripV(latest),
      installed,
      latest,
    };
  },
  ensure: async () => {
    console.log("==> Installing fnm");
    await $`cargo binstall fnm`;
  },
};
