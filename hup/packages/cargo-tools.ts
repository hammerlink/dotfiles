import { $, type PackageDef, which } from "../core.ts";

export const pkg: PackageDef = {
  name: "cargo-tools",
  // cargo install-update should always try to update
  check: () => Promise.resolve({ upToDate: false }),
  ensure: async () => {
    if (
      !(await which("cargo-binstall")) ||
      !(await which("cargo-install-update"))
    ) {
      console.log(
        "skip: cargo-tools (cargo-binstall or cargo-install-update missing)",
      );
      return;
    }
    console.log("==> Updating all cargo-installed tools");
    await $`cargo install-update -a`;
  },
};
