import { join } from "@std/path";
import {
  $,
  type CheckResult,
  DOTFILES_CONFIG,
  ensureSymlink,
  githubLatest,
  HOME,
  type PackageDef,
  runScript,
  stripV,
  which,
} from "../core.ts";

const OPENCODE_DIR = join(HOME, ".config", "opencode");

async function installPlugins(): Promise<void> {
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

export const pkg: PackageDef = {
  name: "opencode",
  dependsOn: ["node"],
  configDir: "opencode",
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
    await ensureSymlink(
      join(DOTFILES_CONFIG, "opencode"),
      OPENCODE_DIR,
      "opencode config",
    );
    await installPlugins();
  },
};
