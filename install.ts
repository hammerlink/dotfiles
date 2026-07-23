#!/usr/bin/env -S deno run --allow-all

import { dirname, fromFileUrl, join } from "@std/path";

const HOME = Deno.env.get("HOME")!;
const SCRIPT_DIR = dirname(fromFileUrl(import.meta.url));

const extraPaths: string[] = [];

function getEnv(): Record<string, string> {
  const e = Deno.env.toObject();
  if (extraPaths.length) e.PATH = [...extraPaths, e.PATH].join(":");
  return e;
}

async function run(cmd: string, args: string[] = []): Promise<void> {
  const { success } = await new Deno.Command(cmd, {
    args,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: getEnv(),
  }).output();
  if (!success) throw new Error(`Command failed: ${[cmd, ...args].join(" ")}`);
}

async function capture(cmd: string, args: string[] = []): Promise<string> {
  try {
    const { stdout } = await new Deno.Command(cmd, {
      args,
      stdout: "piped",
      stderr: "null",
      env: getEnv(),
    }).output();
    return new TextDecoder().decode(stdout).trim();
  } catch {
    return "";
  }
}

async function installed(cmd: string): Promise<boolean> {
  const { success } = await new Deno.Command("which", {
    args: [cmd],
    stdout: "null",
    stderr: "null",
    env: getEnv(),
  }).output();
  return success;
}

async function tryRun(cmd: string, args: string[]): Promise<boolean> {
  try {
    const { success } = await new Deno.Command(cmd, {
      args,
      stdout: "null",
      stderr: "null",
      env: getEnv(),
    }).output();
    return success;
  } catch {
    return false;
  }
}

async function runScript(
  url: string,
  args: string[] = [],
  shell = "sh",
): Promise<void> {
  const script = await fetch(url).then((r) => r.text());
  const proc = new Deno.Command(shell, {
    args,
    stdin: "piped",
    stdout: "inherit",
    stderr: "inherit",
    env: getEnv(),
  }).spawn();
  const w = proc.stdin.getWriter();
  await w.write(new TextEncoder().encode(script));
  await w.close();
  const { success } = await proc.status;
  if (!success) throw new Error(`Script from ${url} failed`);
}

// ── apt packages ─────────────────────────────────────────────────────────────

const needed: string[] = [];
for (const pkg of ["fish", "unzip", "python3"]) {
  if (!(await installed(pkg))) needed.push(pkg);
}
if (!(await tryRun("python3", ["-m", "pip", "--version"])))
  needed.push("python3-pip");
if (!(await tryRun("python3", ["-m", "venv", "--help"])))
  needed.push("python3-venv");

if (needed.length === 0) {
  console.log(
    "skip: fish, unzip, python3, python3-pip, python3-venv already installed",
  );
} else {
  console.log(`==> Installing: ${needed.join(" ")}`);
  await run("sudo", ["apt-get", "update", "-q"]);
  await run("sudo", ["apt-get", "install", "-y", ...needed]);
}

// ── Neovim ───────────────────────────────────────────────────────────────────

await Deno.mkdir(join(HOME, ".local", "bin"), { recursive: true });
if (await installed("nvim")) {
  console.log("skip: nvim already installed");
} else {
  console.log("==> Installing Neovim (AppImage)");
  const release = await fetch(
    "https://api.github.com/repos/neovim/neovim/releases/latest",
  ).then((r) => r.json());
  const asset = release.assets.find(
    (a: { name: string; browser_download_url: string }) =>
      a.name === "nvim-linux-x86_64.appimage",
  );
  const nvimPath = join(HOME, ".local", "bin", "nvim");
  const bytes = await fetch(asset.browser_download_url).then((r) =>
    r.arrayBuffer(),
  );
  await Deno.writeFile(nvimPath, new Uint8Array(bytes));
  await Deno.chmod(nvimPath, 0o755);
}

// ── Rust ─────────────────────────────────────────────────────────────────────

if (await installed("cargo")) {
  console.log("skip: Rust already installed");
} else {
  console.log("==> Installing Rust");
  await runScript("https://sh.rustup.rs", ["-s", "--", "-y"]);
}
extraPaths.push(join(HOME, ".cargo", "bin"));

// ── cargo tools ──────────────────────────────────────────────────────────────

const cargoTools: [string, string, string[]][] = [
  ["rg", "ripgrep", ["--locked"]],
  ["atuin", "atuin", ["--locked"]],
  ["zellij", "zellij", ["--locked"]],
  ["fnm", "fnm", []],
];

for (const [cmd, pkg, flags] of cargoTools) {
  if (await installed(cmd)) {
    console.log(`skip: ${cmd} already installed`);
  } else {
    console.log(`==> Installing ${cmd}`);
    await run("cargo", ["install", ...flags, pkg]);
  }
}

// ── Node.js via fnm ──────────────────────────────────────────────────────────

if (await installed("node")) {
  console.log("skip: node already installed");
} else {
  console.log("==> Installing latest Node.js via fnm");
  const fnmEnv = await capture("fnm", ["env", "--shell", "bash"]);
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
  await run("fnm", ["install", "--lts"]);
  await run("fnm", ["default", "lts-latest"]);
}

// ── opencode ─────────────────────────────────────────────────────────────────

if (await installed("opencode")) {
  console.log("skip: opencode already installed");
} else {
  console.log("==> Installing opencode");
  await runScript("https://opencode.ai/install", [], "bash");
}

// ── Nix ──────────────────────────────────────────────────────────────────────

if (await installed("nix")) {
  console.log("skip: nix already installed");
} else {
  console.log("==> Installing Nix (single-user)");
  await runScript("https://nixos.org/nix/install", ["-s", "--", "--no-daemon"]);
}

// ── git config ───────────────────────────────────────────────────────────────

const gitEmail = await capture("git", ["config", "--global", "user.email"]);
const gitName = await capture("git", ["config", "--global", "user.name"]);
if (gitEmail && gitName) {
  console.log("skip: git already configured");
} else {
  console.log("==> Configuring git");
  await run("git", [
    "config",
    "--global",
    "user.email",
    "hendrik.hamerlinck@hammernet.be",
  ]);
  await run("git", ["config", "--global", "user.name", "Hendrik Hamerlinck"]);
}

// ── fish as default shell ────────────────────────────────────────────────────

const fishPath = await capture("which", ["fish"]);
if (Deno.env.get("SHELL") === fishPath) {
  console.log("skip: fish is already the default shell");
} else {
  console.log("==> Setting fish as default shell");
  const shells = await Deno.readTextFile("/etc/shells");
  if (
    !shells
      .split("\n")
      .map((s) => s.trim())
      .includes(fishPath)
  ) {
    const proc = new Deno.Command("sudo", {
      args: ["tee", "-a", "/etc/shells"],
      stdin: "piped",
      stdout: "null",
    }).spawn();
    const w = proc.stdin.getWriter();
    await w.write(new TextEncoder().encode(fishPath + "\n"));
    await w.close();
    await proc.status;
  }
  await run("chsh", ["-s", fishPath]);
}

// ── link dotfiles ────────────────────────────────────────────────────────────

console.log("\n==> Linking dotfiles");
const dotfilesConfig = join(SCRIPT_DIR, ".config");
const targetConfig = join(HOME, ".config");

await Deno.mkdir(targetConfig, { recursive: true });

for await (const entry of Deno.readDir(dotfilesConfig)) {
  const src = join(dotfilesConfig, entry.name);
  const dest = join(targetConfig, entry.name);

  let destExists = false;
  try {
    await Deno.lstat(dest);
    destExists = true;
  } catch {
    // dest does not exist
  }

  if (destExists) {
    const answer = prompt(`already exists: ${dest} — delete and relink? [y/N]`);
    if (answer?.toLowerCase() === "y") {
      await Deno.remove(dest, { recursive: true });
      await Deno.symlink(src, dest);
      console.log(`linked: ${dest} -> ${src}`);
    } else {
      console.log(`skipped: ${dest}`);
    }
  } else {
    await Deno.symlink(src, dest);
    console.log(`linked: ${dest} -> ${src}`);
  }
}

// ── opencode plugins ─────────────────────────────────────────────────

const opencodeTarget = join(targetConfig, "opencode");
const opencodePkg = join(opencodeTarget, "package.json");
let opencodeNeedsInstall = false;
try {
  await Deno.lstat(opencodePkg);
  opencodeNeedsInstall = true;
} catch {
  // no package.json, skip
}

if (opencodeNeedsInstall) {
  const nodeModules = join(opencodeTarget, "node_modules");
  let modulesExist = false;
  try {
    await Deno.lstat(nodeModules);
    modulesExist = true;
  } catch {
    // does not exist
  }
  if (modulesExist) {
    console.log("skip: opencode plugins already installed");
  } else {
    console.log("==> Installing opencode plugins");
    const { success } = await new Deno.Command("npm", {
      args: ["install"],
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
      env: getEnv(),
      cwd: opencodeTarget,
    }).output();
    if (!success) throw new Error("npm install failed for opencode plugins");
  }
}

console.log("\nDone. Make sure ~/.local/bin is in your PATH for nvim.");
