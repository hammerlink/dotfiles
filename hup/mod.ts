#!/usr/bin/env -S deno run --allow-all

import { join } from "@std/path";
import { $, updaters } from "./updaters.ts";

const HOME = Deno.env.get("HOME")!;
const CONFIG_PATH = join(HOME, ".config", "hup", "config.json");

type Config = {
  packages?: Record<string, boolean>;
};

function help() {
  console.log(`hup — hammer update
Keep your desired packages up to date on this machine.

Usage:
  hup                 Update all enabled packages (first run: interactive config)
  hup -p <name>...    Update specific packages (bypasses config)
  hup <name>...       Same as -p, positional shorthand
  hup list            List available packages and their state
  hup config          Interactively toggle which packages are kept up to date
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

function isEnabled(config: Config, name: string): boolean {
  return config.packages?.[name] !== false;
}

async function saveConfig(selectedNames: Set<string>) {
  const packages: Record<string, boolean> = {};
  for (const u of updaters) packages[u.name] = selectedNames.has(u.name);
  await Deno.mkdir(join(HOME, ".config", "hup"), { recursive: true });
  await Deno.writeTextFile(
    CONFIG_PATH,
    JSON.stringify({ packages }, null, 2) + "\n",
  );
}

async function interactiveConfig(): Promise<Set<string>> {
  const config = await loadConfig();
  const selected = await $.multiSelect({
    message: "Select packages to keep up to date:",
    options: updaters.map((u) => ({
      text: u.name,
      selected: isEnabled(config, u.name),
    })),
  });
  const names = new Set(selected.map((s) => s.value));
  await saveConfig(names);
  console.log(`\nSaved config to ${CONFIG_PATH}`);
  return names;
}

async function runUpdaters(selected: typeof updaters) {
  for (const u of selected) {
    if (u.check) {
      const { upToDate, installed, latest } = await u.check();
      if (upToDate) {
        console.log(
          `skip: ${u.name} is up to date${installed ? ` (${installed})` : ""}`,
        );
        continue;
      }
      if (installed && latest) {
        console.log(`==> ${u.name}: ${installed} -> ${latest}`);
      }
    }
    await u.update();
  }
  console.log("\nDone.");
}

function resolveNames(names: string[]) {
  return names.map((name) => {
    const u = updaters.find((u) => u.name === name);
    if (!u) {
      console.error(`Unknown package: ${name}`);
      console.error('Run "hup list" to see available packages.');
      Deno.exit(1);
    }
    return u;
  });
}

const args = Deno.args;

if (args.includes("--help") || args.includes("-h")) {
  help();
  Deno.exit(0);
}

if (args[0] === "list") {
  const config = await loadConfig();
  console.log("Updatable packages:");
  for (const u of updaters) {
    const mark = isEnabled(config, u.name) ? "x" : " ";
    console.log(`  [${mark}] ${u.name}`);
  }
  Deno.exit(0);
}

if (args[0] === "config") {
  await interactiveConfig();
  Deno.exit(0);
}

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
  await runUpdaters(resolveNames(positional));
  Deno.exit(0);
}

let enabled: Set<string>;
if (!(await configExists())) {
  console.log("No config found, setting up...\n");
  enabled = await interactiveConfig();
} else {
  const config = await loadConfig();
  const unknown = Object.keys(config.packages ?? {}).filter(
    (name) => !updaters.some((u) => u.name === name),
  );
  for (const name of unknown) {
    console.warn(`warning: unknown package in config: ${name}`);
  }
  enabled = new Set(
    updaters.filter((u) => isEnabled(config, u.name)).map((u) => u.name),
  );
}

if (enabled.size === 0) {
  console.log('No packages enabled. Run "hup config" to enable some.');
  Deno.exit(0);
}

await runUpdaters(updaters.filter((u) => enabled.has(u.name)));
