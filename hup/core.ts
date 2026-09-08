import { dirname, fromFileUrl, join } from "@std/path";
import { build$, type SelectionItem } from "@david/dax";

export const HOME = Deno.env.get("HOME")!;
export const REPO_ROOT = join(dirname(fromFileUrl(import.meta.url)), "..");
export const DOTFILES_CONFIG = join(REPO_ROOT, ".config");

export const extraPaths: string[] = [join(HOME, ".cargo", "bin")];

export const $ = build$({
  commandBuilder: (builder) =>
    builder.env("PATH", [...extraPaths, Deno.env.get("PATH") ?? ""].join(":")),
});

export type CheckResult = {
  upToDate: boolean;
  installed?: string;
  latest?: string;
};

export type PackageDef = {
  name: string;
  dependsOn?: string[];
  configDir?: string;
  check?: () => Promise<CheckResult>;
  ensure: () => Promise<void>;
};

export async function githubLatest(repo: string): Promise<string> {
  const { tag_name } = await (
    await fetch(`https://api.github.com/repos/${repo}/releases/latest`)
  ).json();
  return tag_name;
}

export function stripV(v: string): string {
  return v.trim().replace(/^v/, "");
}

export async function which(cmd: string): Promise<boolean> {
  const { success } = await new Deno.Command("which", {
    args: [cmd],
    stdout: "null",
    stderr: "null",
  }).output();
  return success;
}

export async function capture(
  cmd: string,
  args: string[] = [],
): Promise<string> {
  try {
    const { stdout } = await new Deno.Command(cmd, {
      args,
      stdout: "piped",
      stderr: "null",
    }).output();
    return new TextDecoder().decode(stdout).trim();
  } catch {
    return "";
  }
}

export async function runScript(
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
  }).spawn();
  const w = proc.stdin.getWriter();
  await w.write(new TextEncoder().encode(script));
  await w.close();
  const { success } = await proc.status;
  if (!success) throw new Error(`Script from ${url} failed`);
}

export type SymlinkState = "linked" | "missing" | "exists";

export async function symlinkState(dest: string): Promise<SymlinkState> {
  try {
    const st = await Deno.lstat(dest);
    return st.isSymlink ? "linked" : "exists";
  } catch {
    return "missing";
  }
}

export async function ensureSymlink(
  src: string,
  dest: string,
  label: string,
): Promise<boolean> {
  const state = await symlinkState(dest);
  if (state === "linked") {
    console.log(`skip: ${label} already linked`);
    return true;
  }
  if (state === "exists") {
    const ok = await $.confirm({
      message: `already exists: ${dest} — delete and relink?`,
      default: false,
    });
    if (!ok) {
      console.log(`skipped: ${label}`);
      return false;
    }
    await Deno.remove(dest, { recursive: true });
  }
  await Deno.symlink(src, dest);
  console.log(`linked: ${dest} -> ${src}`);
  return true;
}

export async function multiSelectNames(
  message: string,
  options: { name: string; selected?: boolean }[],
): Promise<Set<string>> {
  const picked = (await $.multiSelect({
    message,
    options: options.map((o) => ({
      text: o.name,
      selected: o.selected ?? true,
    })),
  })) as SelectionItem[];
  return new Set(picked.map((p) => p.value));
}

export function topoSort<T extends { name: string; dependsOn?: string[] }>(
  items: T[],
): T[] {
  const byName = new Map(items.map((i) => [i.name, i]));
  const inDegree = new Map<string, number>();
  for (const i of items) inDegree.set(i.name, 0);
  for (const i of items) {
    for (const dep of i.dependsOn ?? []) {
      if (!byName.has(dep)) continue;
      inDegree.set(i.name, (inDegree.get(i.name) ?? 0) + 1);
    }
  }
  const queue: string[] = [];
  for (const i of items) {
    if ((inDegree.get(i.name) ?? 0) === 0) queue.push(i.name);
  }
  const out: T[] = [];
  while (queue.length) {
    const name = queue.shift()!;
    out.push(byName.get(name)!);
    for (const i of items) {
      if ((i.dependsOn ?? []).includes(name)) {
        const d = (inDegree.get(i.name) ?? 0) - 1;
        inDegree.set(i.name, d);
        if (d === 0) queue.push(i.name);
      }
    }
  }
  return out;
}
