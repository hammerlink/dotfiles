import { $, type PackageDef, which } from "../core.ts";

export const pkg: PackageDef = {
  name: "fnm",
  dependsOn: ["cargo-binstall"],
  check: async () => ({ upToDate: await which("fnm") }),
  ensure: async () => {
    console.log("==> Installing fnm");
    await $`cargo binstall fnm`;
  },
};
