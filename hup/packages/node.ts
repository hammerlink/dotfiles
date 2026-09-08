import { $, extraPaths, type PackageDef, which } from "../core.ts";

export const pkg: PackageDef = {
  name: "node",
  dependsOn: ["fnm"],
  check: async () => ({ upToDate: await which("node") }),
  ensure: async () => {
    console.log("==> Installing latest Node.js via fnm");
    const fnmEnv = await $`fnm env --shell bash`.text().catch(() => "");
    for (const line of fnmEnv.split("\n")) {
      const m = line.match(/^export (\w+)="([^"]*)"/);
      if (!m) continue;
      const [, key, val] = m;
      if (key === "PATH") {
        extraPaths.unshift(...val.split(":").filter(Boolean));
      } else {
        Deno.env.set(key, val);
      }
    }
    await $`fnm install --lts`;
    await $`fnm default lts-latest`;
  },
};
