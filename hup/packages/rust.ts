import { $, type PackageDef, runScript, which } from "../core.ts";

export const pkg: PackageDef = {
  name: "rust",
  check: async () => {
    if (!(await which("cargo"))) return { upToDate: false };
    const out = await $`rustup check`.noThrow().text();
    return { upToDate: !out.match(/update available/i), installed: "rust" };
  },
  ensure: async () => {
    if (await which("cargo")) {
      console.log("==> Updating Rust");
      await $`rustup update`;
      return;
    }
    console.log("==> Installing Rust");
    await runScript("https://sh.rustup.rs", ["-s", "--", "-y"]);
  },
};
