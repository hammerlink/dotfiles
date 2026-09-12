import { join } from "@std/path";
import {
  $,
  capture,
  type CheckResult,
  extraPaths,
  githubLatest,
  HOME,
  type PackageDef,
  runScript,
  stripV,
  which,
} from "../core.ts";

const aptPackages: PackageDef = {
  kind: "package",
  name: "apt-packages",
  check: async () => {
    const missing: string[] = [];
    for (const p of ["fish", "unzip", "python3"]) {
      if (!(await which(p))) missing.push(p);
    }
    if (!missing.length) return { upToDate: true, installed: "apt" };
    return { upToDate: false, latest: missing.join(", ") };
  },
  ensure: async () => {
    const needed: string[] = [];
    for (const p of ["fish", "unzip", "python3"]) {
      if (!(await which(p))) needed.push(p);
    }
    if (!(await capture("python3", ["-m", "pip", "--version"]))) {
      needed.push("python3-pip");
    }
    if (!(await capture("python3", ["-m", "venv", "--help"]))) {
      needed.push("python3-venv");
    }
    if (needed.length === 0) {
      console.log("skip: apt packages already installed");
      return;
    }
    console.log(`==> Installing: ${needed.join(" ")}`);
    await $`sudo apt-get update -q`;
    await $`sudo apt-get install -y ${needed}`;
  },
};

const fish: PackageDef = {
  kind: "package",
  name: "fish",
  dependsOn: ["cargo-binstall"],
  check: async () => ({ upToDate: await which("fish") }),
  ensure: async () => {
    if (!(await which("fish"))) {
      console.log("==> Installing fish");
      const { success } = await new Deno.Command("sudo", {
        args: ["apt-get", "install", "-y", "fish"],
        stdout: "inherit",
        stderr: "inherit",
      }).output();
      if (!success) throw new Error("failed to install fish");
    } else {
      console.log("skip: fish already installed");
    }
  },
};

const rust: PackageDef = {
  kind: "package",
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

const deno: PackageDef = {
  kind: "package",
  name: "deno",
  check: async (): Promise<CheckResult> => {
    if (!(await which("deno"))) return { upToDate: false };
    const out = await $`deno --version`.text().catch(() => "");
    const installed = out.match(/deno ([\d.]+)/)?.[1] ?? "";
    if (!installed) return { upToDate: false };
    const latest = await githubLatest("denoland/deno");
    return {
      upToDate: stripV(installed) === stripV(latest),
      installed,
      latest,
    };
  },
  ensure: async () => {
    console.log("==> Updating Deno");
    await $`deno upgrade`;
  },
};

const node: PackageDef = {
  kind: "package",
  name: "node",
  dependsOn: ["fnm"],
  check: async () => ({ upToDate: await which("node") }),
  ensure: async () => {
    console.log("==> Installing latest Node.js via fnm");
    const fnmEnv = await $`fnm env --shell bash`.text().catch(() => "");
    for (const line of fnmEnv.split("\n")) {
      const m = line.match(/^export (\w+)="([^"]*)"/);
      if (!m) continue;
      const [, key, val] = m;
      if (key === "PATH") {
        extraPaths.unshift(...val.split(":").filter(Boolean));
      } else {
        Deno.env.set(key, val);
      }
    }
    await $`fnm install --lts`;
    await $`fnm default lts-latest`;
  },
};

const nix: PackageDef = {
  kind: "package",
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

type NvimRelease = {
  tag_name: string;
  assets: { name: string; browser_download_url: string }[];
};

let nvimCache: NvimRelease | null = null;
async function getNvimRelease(): Promise<NvimRelease> {
  if (!nvimCache) {
    nvimCache = await fetch(
      "https://api.github.com/repos/neovim/neovim/releases/latest",
    ).then((r) => r.json()) as NvimRelease;
  }
  return nvimCache!;
}

const NVIM_PATH = join(HOME, ".local", "bin", "nvim");

const nvim: PackageDef = {
  kind: "package",
  name: "nvim",
  check: async (): Promise<CheckResult> => {
    if (!(await which("nvim"))) return { upToDate: false };
    const out = await $`nvim --version`.text().catch(() => "");
    const installed = out.match(/^NVIM (v[\d.]+)/m)?.[1] ?? "";
    if (!installed) return { upToDate: false };
    const latest = (await getNvimRelease()).tag_name;
    return {
      upToDate: stripV(installed) === stripV(latest),
      installed,
      latest,
    };
  },
  ensure: async () => {
    const release = await getNvimRelease();
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
    await Deno.writeFile(NVIM_PATH, new Uint8Array(bytes));
    await Deno.chmod(NVIM_PATH, 0o755);
    console.log(`    nvim ${version} -> ${NVIM_PATH}`);
  },
};

const OPENCODE_DIR = join(HOME, ".config", "opencode");

async function installOpencodePlugins(): Promise<void> {
  const nodeModules = join(OPENCODE_DIR, "node_modules");
  let modulesExist = false;
  try {
    await Deno.lstat(nodeModules);
    modulesExist = true;
  } catch {
    // does not exist
  }
  if (modulesExist) {
    console.log("skip: opencode plugins already installed");
    return;
  }
  console.log("==> Installing opencode plugins");
  const { success } = await new Deno.Command("npm", {
    args: ["install"],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    cwd: OPENCODE_DIR,
  }).output();
  if (!success) throw new Error("npm install failed for opencode plugins");
}

const opencode: PackageDef = {
  kind: "package",
  name: "opencode",
  dependsOn: ["node"],
  check: async (): Promise<CheckResult> => {
    if (!(await which("opencode"))) return { upToDate: false };
    const installed = (await $`opencode --version`.text().catch(() => ""))
      .trim();
    if (!installed) return { upToDate: false };
    const latest = await githubLatest("sst/opencode");
    return {
      upToDate: stripV(installed) === stripV(latest),
      installed,
      latest,
    };
  },
  ensure: async () => {
    if (!(await which("opencode"))) {
      console.log("==> Installing opencode");
      await runScript("https://opencode.ai/install", [], "bash");
    } else {
      console.log("skip: opencode already installed");
    }
    await installOpencodePlugins();
  },
};

export const otherPackages: PackageDef[] = [
  aptPackages,
  fish,
  rust,
  deno,
  node,
  nix,
  nvim,
  opencode,
];
