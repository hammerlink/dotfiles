import { join } from "@std/path";
import {
  $,
  type CheckResult,
  DOTFILES_CONFIG,
  ensureSymlink,
  HOME,
  type PackageDef,
  stripV,
  which,
} from "../core.ts";

type Release = {
  tag_name: string;
  assets: { name: string; browser_download_url: string }[];
};

let cache: Release | null = null;
async function getRelease(): Promise<Release> {
  if (!cache) {
    cache = await fetch(
      "https://api.github.com/repos/neovim/neovim/releases/latest",
    ).then((r) => r.json()) as Release;
  }
  return cache!;
}

const NVM_PATH = join(HOME, ".local", "bin", "nvim");

export const pkg: PackageDef = {
  name: "nvim",
  configDir: "nvim",
  check: async (): Promise<CheckResult> => {
    if (!(await which("nvim"))) return { upToDate: false };
    const out = await $`nvim --version`.text().catch(() => "");
    const installed = out.match(/^NVIM (v[\d.]+)/m)?.[1] ?? "";
    if (!installed) return { upToDate: false };
    const latest = (await getRelease()).tag_name;
    return {
      upToDate: stripV(installed) === stripV(latest),
      installed,
      latest,
    };
  },
  ensure: async () => {
    const release = await getRelease();
    const version = release.tag_name;
    const asset = release.assets.find(
      (a) => a.name === "nvim-linux-x86_64.appimage",
    );
    if (!asset) {
      throw new Error("nvim-linux-x86_64.appimage not found in release");
    }
    console.log(`==> Installing Neovim ${version}`);
    await Deno.mkdir(join(HOME, ".local", "bin"), { recursive: true });
    const bytes = await fetch(asset.browser_download_url).then((r) =>
      r.arrayBuffer()
    );
    await Deno.writeFile(NVM_PATH, new Uint8Array(bytes));
    await Deno.chmod(NVM_PATH, 0o755);
    console.log(`    nvim ${version} -> ${NVM_PATH}`);
    await ensureSymlink(
      join(DOTFILES_CONFIG, "nvim"),
      join(HOME, ".config", "nvim"),
      "nvim config",
    );
  },
};
