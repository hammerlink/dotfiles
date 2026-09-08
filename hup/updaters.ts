import { join } from "@std/path";
import { build$ } from "@david/dax";

const HOME = Deno.env.get("HOME")!;
export const extraPaths = [join(HOME, ".cargo", "bin")];

export const $ = build$({
  commandBuilder: (builder) =>
    builder.env(`PATH`, [...extraPaths, Deno.env.get("PATH") ?? ""].join(":")),
});

async function githubLatest(repo: string): Promise<string> {
  const r = await fetch(
    `https://api.github.com/repos/${repo}/releases/latest`,
  ).then((r) => r.json());
  return r.tag_name as string;
}

function stripV(v: string): string {
  return v.trim().replace(/^v/, "");
}

export type CheckResult = {
  upToDate: boolean;
  installed?: string;
  latest?: string;
};

export const updaters: {
  name: string;
  check?: () => Promise<CheckResult>;
  update: () => Promise<void>;
}[] = [
  {
    name: "cargo-tools",
    update: async () => {
      console.log("==> Updating all cargo-installed tools");
      await $`cargo install-update -a`;
    },
  },
  (() => {
    type Release = {
      tag_name: string;
      assets: { name: string; browser_download_url: string }[];
    };
    let cache: Release | null = null;
    async function getRelease(): Promise<Release> {
      if (!cache) {
        cache = await fetch(
          "https://api.github.com/repos/neovim/neovim/releases/latest",
        ).then((r) => r.json());
      }
      return cache!;
    }
    return {
      name: "nvim",
      check: async (): Promise<CheckResult> => {
        const out = await $`nvim --version`.text().catch(() => "");
        const installed = out.match(/^NVIM (v[\d.]+)/m)?.[1] ?? "";
        if (!installed) return { upToDate: false };
        const release = await getRelease();
        const latest: string = release.tag_name;
        return {
          upToDate: stripV(installed) === stripV(latest),
          installed,
          latest,
        };
      },
      update: async () => {
        const release = await getRelease();
        const version: string = release.tag_name;
        const asset = release.assets.find(
          (a) => a.name === "nvim-linux-x86_64.appimage",
        );
        if (!asset)
          throw new Error("nvim-linux-x86_64.appimage not found in release");
        console.log(`==> Downloading Neovim ${version}`);
        const nvimPath = join(HOME, ".local", "bin", "nvim");
        await Deno.mkdir(join(HOME, ".local", "bin"), { recursive: true });
        const bytes = await fetch(asset.browser_download_url).then((r) =>
          r.arrayBuffer(),
        );
        await Deno.writeFile(nvimPath, new Uint8Array(bytes));
        await Deno.chmod(nvimPath, 0o755);
        console.log(`    nvim ${version} -> ${nvimPath}`);
      },
    };
  })(),
  {
    name: "rust",
    check: async (): Promise<CheckResult> => {
      const out = await $`rustup check`.noThrow().text();
      const upToDate = !out.match(/update available/i);
      return { upToDate };
    },
    update: async () => {
      console.log("==> Updating Rust");
      await $`rustup update`;
    },
  },
  {
    name: "rg",
    check: async (): Promise<CheckResult> => {
      const out = await $`rg --version`.text().catch(() => "");
      const installed = out.match(/ripgrep ([\d.]+)/)?.[1] ?? "";
      if (!installed) return { upToDate: false };
      const latest = await githubLatest("BurntSushi/ripgrep");
      return {
        upToDate: stripV(installed) === stripV(latest),
        installed,
        latest,
      };
    },
    update: async () => {
      console.log("==> Updating ripgrep");
      await $`cargo install --locked ripgrep`;
    },
  },
  {
    name: "atuin",
    check: async (): Promise<CheckResult> => {
      const out = await $`atuin --version`.text().catch(() => "");
      const installed = out.match(/atuin ([\d.]+)/)?.[1] ?? "";
      if (!installed) return { upToDate: false };
      const latest = await githubLatest("atuinsh/atuin");
      return {
        upToDate: stripV(installed) === stripV(latest),
        installed,
        latest,
      };
    },
    update: async () => {
      console.log("==> Updating atuin");
      await $`cargo install --locked atuin`;
    },
  },
  {
    name: "zellij",
    check: async (): Promise<CheckResult> => {
      const out = await $`zellij --version`.text().catch(() => "");
      const installed = out.match(/zellij ([\d.]+)/)?.[1] ?? "";
      if (!installed) return { upToDate: false };
      const latest = await githubLatest("zellij-org/zellij");
      return {
        upToDate: stripV(installed) === stripV(latest),
        installed,
        latest,
      };
    },
    update: async () => {
      console.log("==> Updating zellij");
      await $`cargo install --locked zellij`;
    },
  },
  {
    name: "fnm",
    check: async (): Promise<CheckResult> => {
      const installed = await $`fnm --version`
        .text()
        .catch(() => "")
        .then((s: string) => s.trim());
      if (!installed) return { upToDate: false };
      const latest = await githubLatest("Schniz/fnm");
      return {
        upToDate: stripV(installed) === stripV(latest),
        installed,
        latest,
      };
    },
    update: async () => {
      console.log("==> Updating fnm");
      await $`cargo install fnm`;
    },
  },
  {
    name: "node",
    update: async () => {
      console.log("==> Updating Node.js via fnm");
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
  },
  {
    name: "deno",
    check: async (): Promise<CheckResult> => {
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
    update: async () => {
      console.log("==> Updating Deno");
      await $`deno upgrade`;
    },
  },
  {
    name: "opencode",
    check: async (): Promise<CheckResult> => {
      const out = await $`opencode --version`.text().catch(() => "");
      const installed = out.trim();
      if (!installed) return { upToDate: false };
      const latest = await githubLatest("sst/opencode");
      return {
        upToDate: stripV(installed) === stripV(latest),
        installed,
        latest,
      };
    },
    update: async () => {
      console.log("==> Updating opencode");
      await $`opencode upgrade`;
    },
  },
  {
    name: "opencode-plugins",
    check: async (): Promise<CheckResult> => {
      const pkgPath = join(HOME, ".config", "opencode", "package.json");
      try {
        const pkg = JSON.parse(await Deno.readTextFile(pkgPath));
        const pluginDeps = Object.keys(pkg.dependencies ?? {});
        if (pluginDeps.length === 0) return { upToDate: true };

        const out =
          await $`npm outdated --json --prefix ${join(HOME, ".config", "opencode")}`
            .text()
            .catch(() => "");
        const outdated = out.trim();
        return { upToDate: !outdated || outdated === "{}" };
      } catch {
        return { upToDate: true };
      }
    },
    update: async () => {
      console.log("==> Updating opencode plugins");
      await $`npm update --prefix ${join(HOME, ".config", "opencode")}`;
    },
  },
];
