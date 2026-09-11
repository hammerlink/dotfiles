import { $, type PackageDef, which } from "../core.ts";

export const pkg: PackageDef = {
  name: "rg",
  dependsOn: ["cargo-binstall"],
  check: async () => ({ upToDate: await which("rg") }),
  ensure: async () => {
    console.log("==> Installing ripgrep");
    await $`cargo binstall ripgrep`;
  },
};
