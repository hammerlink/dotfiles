import { $, type PackageDef, which } from "../core.ts";

export const pkg: PackageDef = {
  name: "cargo-tools",
  dependsOn: ["cargo-binstall"],
  check: async () => ({ upToDate: await which("cargo-update") }),
  ensure: async () => {
    console.log("==> Updating all cargo-installed tools");
    await $`cargo install-update -a`;
  },
};
