import type { PackageDef } from "../core.ts";
import { pkg as aptPackages } from "./apt-packages.ts";
import { pkg as fish } from "./fish.ts";
import { pkg as alacritty } from "./alacritty.ts";
import { pkg as nvim } from "./nvim.ts";
import { pkg as rust } from "./rust.ts";
import { pkg as cargoBinstall } from "./cargo-binstall.ts";
import { pkg as rg } from "./rg.ts";
import { pkg as atuin } from "./atuin.ts";
import { pkg as zellij } from "./zellij.ts";
import { pkg as fnm } from "./fnm.ts";
import { pkg as just } from "./just.ts";
import { pkg as node } from "./node.ts";
import { pkg as deno } from "./deno.ts";
import { pkg as opencode } from "./opencode.ts";
import { pkg as nix } from "./nix.ts";
import { pkg as cargoTools } from "./cargo-tools.ts";

export const packages: PackageDef[] = [
  aptPackages,
  fish,
  alacritty,
  nvim,
  rust,
  cargoTools,
  cargoBinstall,
  rg,
  atuin,
  zellij,
  fnm,
  just,
  node,
  deno,
  opencode,
  nix,
];
