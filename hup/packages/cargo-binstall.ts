import { join } from "@std/path";
import { $, HOME, type PackageDef, which } from "../core.ts";

const VERSION = "v1.22.0";
const ASSET =
  `https://github.com/cargo-bins/cargo-binstall/releases/download/${VERSION}/cargo-binstall-x86_64-unknown-linux-musl.tgz`;

async function installPrebuilt(): Promise<void> {
  const cargoBinDir = join(HOME, ".cargo", "bin");
  await Deno.mkdir(cargoBinDir, { recursive: true });
  const tmpDir = await Deno.makeTempDir();
  try {
    const tgzPath = join(tmpDir, "cargo-binstall.tgz");
    const bytes = await fetch(ASSET).then((r) => {
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

export const pkg: PackageDef = {
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
    console.log(`==> Installing cargo-binstall ${VERSION} (prebuilt)`);
    try {
      await installPrebuilt();
    } catch (e) {
      console.log(`download failed (${e}); falling back to cargo install`);
      await $`cargo install --locked cargo-binstall`;
    }
  },
};
