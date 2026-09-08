import { $, type PackageDef, which } from "../core.ts";

export const pkg: PackageDef = {
  name: "just",
  dependsOn: ["cargo-binstall"],
  check: async () => ({ upToDate: await which("just") }),
  ensure: async () => {
    console.log("==> Installing just");
    await $`cargo binstall just`;
  },
};
