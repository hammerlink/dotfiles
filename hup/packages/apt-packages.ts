import { $, capture, type PackageDef, which } from "../core.ts";

export const pkg: PackageDef = {
  name: "apt-packages",
  check: async () => {
    const missing: string[] = [];
    for (const p of ["unzip", "python3"]) {
      if (!(await which(p))) missing.push(p);
    }
    if (!missing.length) return { upToDate: true, installed: "apt" };
    return { upToDate: false, latest: missing.join(", ") };
  },
  ensure: async () => {
    const needed: string[] = [];
    for (const p of ["unzip", "python3"]) {
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
