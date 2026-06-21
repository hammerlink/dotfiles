#!/usr/bin/env -S deno run --allow-all

import { join } from "jsr:@std/path";

const HOME = Deno.env.get("HOME")!;

console.log("==> Fetching latest Neovim release");
const release = await fetch(
  "https://api.github.com/repos/neovim/neovim/releases/latest",
).then((r) => r.json());

const version: string = release.tag_name;
const asset = release.assets.find(
  (a: { name: string; browser_download_url: string }) =>
    a.name === "nvim-linux-x86_64.appimage",
);
if (!asset) throw new Error("nvim-linux-x86_64.appimage not found in release");

console.log(`==> Downloading Neovim ${version}`);
const nvimPath = join(HOME, ".local", "bin", "nvim");
await Deno.mkdir(join(HOME, ".local", "bin"), { recursive: true });
const bytes = await fetch(asset.browser_download_url).then((r) =>
  r.arrayBuffer()
);
await Deno.writeFile(nvimPath, new Uint8Array(bytes));
await Deno.chmod(nvimPath, 0o755);
console.log(`==> Neovim ${version} installed to ${nvimPath}`);
