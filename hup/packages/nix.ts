import { type PackageDef, runScript, which } from "../core.ts";

export const pkg: PackageDef = {
  name: "nix",
  check: async () => ({ upToDate: await which("nix") }),
  ensure: async () => {
    if (await which("nix")) {
      console.log("skip: nix already installed");
      return;
    }
    console.log("==> Installing Nix (single-user)");
    await runScript(
      "https://nixos.org/nix/install",
      ["-s", "--", "--no-daemon"],
    );
  },
};
