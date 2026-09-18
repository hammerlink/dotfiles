import type { ActionDef, PackageDef } from "../core.ts";
import { cargoBinstallPkg, cargoPackages, cargoToolsAction } from "./cargo.ts";
import { otherPackages } from "./packages.ts";

export const packages: PackageDef[] = [
  ...otherPackages,
  cargoBinstallPkg,
  ...cargoPackages,
];

export const actions: ActionDef[] = [cargoToolsAction];
