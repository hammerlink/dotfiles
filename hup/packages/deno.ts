import {
  $,
  type CheckResult,
  githubLatest,
  type PackageDef,
  stripV,
  which,
} from "../core.ts";

export const pkg: PackageDef = {
  name: "deno",
  check: async (): Promise<CheckResult> => {
    if (!(await which("deno"))) return { upToDate: false };
    const out = await $`deno --version`.text().catch(() => "");
    const installed = out.match(/deno ([\d.]+)/)?.[1] ?? "";
    if (!installed) return { upToDate: false };
    const latest = await githubLatest("denoland/deno");
    return {
      upToDate: stripV(installed) === stripV(latest),
      installed,
      latest,
    };
  },
  ensure: async () => {
    console.log("==> Updating Deno");
    await $`deno upgrade`;
  },
};
