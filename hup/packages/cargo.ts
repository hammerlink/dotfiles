import { join } from "@std/path";
import { $, type ActionDef, HOME, type PackageDef, which } from "../core.ts";

function cargoPkg(
  name: string,
  opts?: { binary?: string; tool?: string },
): PackageDef {
  return {
    kind: "cargo-package",
    name,
    dependsOn: ["cargo-binstall"],
    binary: opts?.binary ?? name,
    tool: opts?.tool,
  };
}

export const cargoPackages: PackageDef[] = [
  cargoPkg("atuin"),
  cargoPkg("rg", { tool: "ripgrep" }),
  cargoPkg("zellij"),
  cargoPkg("fnm"),
  cargoPkg("just"),
];

const BINSTALL_VERSION = "v1.22.0";
const BINSTALL_ASSET =
  `https://github.com/cargo-bins/cargo-binstall/releases/download/${BINSTALL_VERSION}/cargo-binstall-x86_64-unknown-linux-musl.tgz`;

async function installPrebuilt(): Promise<void> {
  const cargoBinDir = join(HOME, ".cargo", "bin");
  await Deno.mkdir(cargoBinDir, { recursive: true });
  const tmpDir = await Deno.makeTempDir();
  try {
    const tgzPath = join(tmpDir, "cargo-binstall.tgz");
    const bytes = await fetch(BINSTALL_ASSET).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.arrayBuffer();
    });
    await Deno.writeFile(tgzPath, new Uint8Array(bytes));
    await $`tar xzf ${tgzPath} -C ${tmpDir}`;
    const dest = join(cargoBinDir, "cargo-binstall");
    await Deno.copyFile(join(tmpDir, "cargo-binstall"), dest);
    await Deno.chmod(dest, 0o755);
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
}

export const cargoBinstallPkg: PackageDef = {
  kind: "package",
  name: "cargo-binstall",
  dependsOn: ["rust"],
  check: async () => ({
    upToDate: await which("cargo-binstall"),
    installed: (await which("cargo-binstall")) ? "cargo-binstall" : undefined,
  }),
  ensure: async () => {
    if (await which("cargo-binstall")) {
      console.log("skip: cargo-binstall already installed");
      return;
    }
    if (Deno.build.arch !== "x86_64") {
      console.log("==> Installing cargo-binstall (cargo, non-x86_64 arch)");
      await $`cargo install --locked cargo-binstall`;
      return;
    }
    console.log(`==> Installing cargo-binstall ${BINSTALL_VERSION} (prebuilt)`);
    try {
      await installPrebuilt();
    } catch (e) {
      console.log(`download failed (${e}); falling back to cargo install`);
      await $`cargo install --locked cargo-binstall`;
    }
  },
};

export const cargoToolsAction: ActionDef = {
  name: "cargo-tools",
  dependsOn: ["cargo-binstall"],
  run: async () => {
    if (
      !(await which("cargo-binstall")) ||
      !(await which("cargo-install-update"))
    ) {
      console.log(
        "skip: cargo-tools (cargo-binstall or cargo-install-update missing)",
      );
      return;
    }
    await $`cargo install-update -a`;
  },
};
