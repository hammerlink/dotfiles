#!/usr/bin/env -S deno run --allow-all

import { join } from "@std/path";
import {
  $,
  type ActionDef,
  type CheckResult,
  DOTFILES_CONFIG,
  ensureSymlink,
  HOME,
  multiSelectNames,
  type PackageDef,
  topoSort,
  which,
} from "./core.ts";
import { configs } from "./configs.ts";
import { actions, packages } from "./packages/index.ts";
import { setups } from "./setup.ts";

const CONFIG_PATH = join(HOME, ".config", "hup", "config.json");

type PkgConfig = { enabled?: boolean; linked?: boolean };
type Config = {
  packages?: Record<string, PkgConfig>;
  setup?: Record<string, boolean>;
};

function help() {
  console.log(`hup — hammer update
Keep your desired packages and machine setup in sync on this machine.

Usage:
  hup                 Ensure + update all enabled packages (fresh run: interactive setup & config)
  hup -p <name>...    Ensure + update specific packages (bypasses config)
  hup <name>...       Same as -p, positional shorthand
  hup list            List packages and setup tasks with their state
  hup config          Interactively toggle which packages are enabled
  hup config list     List packages and their state
  hup setup           Interactively select + apply machine setup tasks
  hup setup list      List setup tasks and their state
  hup --help, -h      Show this help

Config: ${CONFIG_PATH}`);
}

async function loadConfig(): Promise<Config> {
  try {
    return JSON.parse(await Deno.readTextFile(CONFIG_PATH)) as Config;
  } catch {
    return {};
  }
}

async function configExists(): Promise<boolean> {
  try {
    await Deno.stat(CONFIG_PATH);
    return true;
  } catch {
    return false;
  }
}

async function saveConfig(config: Config): Promise<void> {
  await Deno.mkdir(join(HOME, ".config", "hup"), { recursive: true });
  await Deno.writeTextFile(
    CONFIG_PATH,
    JSON.stringify(config, null, 2) + "\n",
  );
}

function pkgEnabled(config: Config, name: string): boolean {
  return config.packages?.[name]?.enabled !== false;
}

function setupEnabled(config: Config, name: string): boolean {
  return config.setup?.[name] !== false;
}

async function checkPkg(
  p: Extract<PackageDef, { kind: "package" }>,
): Promise<CheckResult> {
  if (!p.check) return { upToDate: true };
  try {
    return await p.check();
  } catch {
    return { upToDate: false };
  }
}

function describeLink(p: PackageDef, config: Config): string {
  const out = p.kind === "cargo-package" ? " [cargo]" : "";
  if (!configs.some((c) => c.name === p.name)) return out;
  const linked = config.packages?.[p.name]?.linked;
  if (linked === true) return out + " [linked]";
  if (linked === false) return out + " [not linked]";
  return out + " [link?]";
}

function linkMarker(config: Config, name: string): string {
  const linked = config.packages?.[name]?.linked;
  if (linked === true) return " [linked]";
  if (linked === false) return " [not linked]";
  return " [link?]";
}

async function runPkg(p: PackageDef): Promise<void> {
  if (p.kind === "cargo-package") {
    const bin = p.binary ?? p.name;
    if (!(await which(bin))) {
      console.log(`==> Installing ${bin} (cargo binstall)`);
      await $`cargo binstall ${p.tool ?? bin}`;
    }
    return;
  }
  const res = await checkPkg(p);
  if (res.upToDate) {
    console.log(
      `skip: ${p.name} is up to date${
        res.installed ? ` (${res.installed})` : ""
      }`,
    );
    return;
  }
  if (res.installed && res.latest) {
    console.log(`==> ${p.name}: ${res.installed} -> ${res.latest}`);
  } else {
    console.log(`==> ${p.name}`);
  }
  await p.ensure();
}

async function runConfigs(config: Config): Promise<void> {
  for (const c of configs) {
    if (!pkgEnabled(config, c.name)) continue;
    const dir = c.dir ?? c.name;
    const ok = await ensureSymlink(
      join(DOTFILES_CONFIG, dir),
      join(HOME, ".config", dir),
      `${c.name} config`,
    );
    config.packages ??= {};
    config.packages[c.name] ??= {};
    config.packages[c.name].linked = ok;
  }
}

async function runAction(a: ActionDef): Promise<void> {
  console.log(`==> ${a.name}`);
  await a.run();
}

async function runSetup(
  s: Extract<PackageDef, { kind: "package" }>,
): Promise<void> {
  const res = await checkPkg(s);
  if (res.upToDate) {
    console.log(`skip: ${s.name} already done`);
    return;
  }
  console.log(`==> ${s.name}`);
  await s.ensure();
}

async function interactiveConfig(config: Config): Promise<void> {
  const selected = await multiSelectNames(
    "Select packages and configs to keep in sync:",
    [
      ...packages.map((p) => ({
        name: p.name,
        selected: pkgEnabled(config, p.name),
      })),
      ...configs.map((c) => ({
        name: c.name,
        selected: pkgEnabled(config, c.name),
      })),
    ],
  );
  config.packages ??= {};
  for (const p of packages) {
    const entry: PkgConfig = config.packages[p.name] ?? {};
    entry.enabled = selected.has(p.name);
    config.packages[p.name] = entry;
  }
  for (const c of configs) {
    const entry: PkgConfig = config.packages[c.name] ?? {};
    entry.enabled = selected.has(c.name);
    if (entry.linked === undefined) entry.linked = false;
    config.packages[c.name] = entry;
  }
  await saveConfig(config);
  console.log(`\nSaved config to ${CONFIG_PATH}`);
}

async function interactiveSetup(config: Config): Promise<Set<string>> {
  const selected = await multiSelectNames(
    "Select machine setup tasks to apply:",
    setups.map((s) => ({
      name: s.name,
      selected: setupEnabled(config, s.name),
    })),
  );
  config.setup ??= {};
  for (const s of setups) config.setup[s.name] = selected.has(s.name);
  await saveConfig(config);
  console.log(`\nSaved config to ${CONFIG_PATH}`);
  return selected;
}

function resolvePackages(names: string[]): PackageDef[] {
  return names.map((name) => {
    const p = packages.find((p) => p.name === name);
    if (!p) {
      console.error(`Unknown package: ${name}`);
      console.error('Run "hup list" to see available packages.');
      Deno.exit(1);
    }
    return p;
  });
}

function listPackages(config: Config): void {
  console.log("Packages:");
  for (const p of packages) {
    const mark = pkgEnabled(config, p.name) ? "x" : " ";
    console.log(`  [${mark}] ${p.name}${describeLink(p, config)}`);
  }
}

function listConfigs(config: Config): void {
  console.log("Configs:");
  for (const c of configs) {
    const mark = pkgEnabled(config, c.name) ? "x" : " ";
    console.log(`  [${mark}] ${c.name}${linkMarker(config, c.name)}`);
  }
}

function listActions(): void {
  console.log("Actions:");
  for (const a of actions) {
    console.log(`  - ${a.name}`);
  }
}

function listSetups(): void {
  console.log("Setup tasks:");
  for (const s of setups) {
    console.log(`  - ${s.name}`);
  }
}

const args = Deno.args;

if (args.includes("--help") || args.includes("-h")) {
  help();
  Deno.exit(0);
}

const [cmd, sub] = args;

if (cmd === "list") {
  const config = await loadConfig();
  listPackages(config);
  console.log("");
  listConfigs(config);
  console.log("");
  listActions();
  console.log("");
  listSetups();
  Deno.exit(0);
}

if (cmd === "config") {
  if (sub === "list") {
    listPackages(await loadConfig());
    Deno.exit(0);
  }
  await interactiveConfig(await loadConfig());
  Deno.exit(0);
}

if (cmd === "setup") {
  if (sub === "list") {
    listSetups();
    Deno.exit(0);
  }
  const config = await loadConfig();
  const selected = await interactiveSetup(config);
  for (const s of topoSort(setups.filter((s) => selected.has(s.name)))) {
    await runSetup(s);
  }
  console.log("\nDone.");
  Deno.exit(0);
}

// positional / -p selection
const positional: string[] = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "-p") {
    const next = args[i + 1];
    if (!next) {
      console.error("-p requires a package name");
      Deno.exit(1);
    }
    positional.push(next);
    i++;
  } else {
    positional.push(args[i]);
  }
}

if (positional.length > 0) {
  const config = await loadConfig();
  for (const p of topoSort(resolvePackages(positional))) {
    await runPkg(p);
  }
  await runConfigs(config);
  if (Object.keys(config.packages ?? {}).length) await saveConfig(config);
  console.log("\nDone.");
  Deno.exit(0);
}

// default: fresh-machine detection
const config = await loadConfig();
const hasPackages = Object.keys(config.packages ?? {}).length > 0;
if (!(await configExists()) || !hasPackages) {
  console.log("No config found, setting up...\n");
  const setupSel = await interactiveSetup(config);
  await interactiveConfig(config);
  for (const s of topoSort(setups.filter((s) => setupSel.has(s.name)))) {
    await runSetup(s);
  }
} else {
  const knownNames = new Set([
    ...packages.map((p) => p.name),
    ...configs.map((c) => c.name),
  ]);
  const unknownPkg = Object.keys(config.packages ?? {}).filter(
    (n) => !knownNames.has(n),
  );
  for (const n of unknownPkg) {
    console.warn(`warning: unknown package in config: ${n}`);
  }
  const unknownSetup = Object.keys(config.setup ?? {}).filter(
    (n) => !setups.some((s) => s.name === n),
  );
  for (const n of unknownSetup) {
    console.warn(`warning: unknown setup in config: ${n}`);
  }
}

const enabled = packages.filter((p) => pkgEnabled(config, p.name));
if (enabled.length === 0) {
  console.log('No packages enabled. Run "hup config" to enable some.');
  Deno.exit(0);
}

for (const p of topoSort(enabled)) {
  await runPkg(p);
}
for (const a of topoSort(actions)) {
  await runAction(a);
}
await runConfigs(config);
await saveConfig(config);
console.log("\nDone.");
