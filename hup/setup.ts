import { join } from "@std/path";
import { $, capture, HOME, type PackageDef, REPO_ROOT } from "./core.ts";

const GIT_EMAIL = "hendrik.hamerlinck@hammernet.be";
const GIT_NAME = "Hendrik Hamerlinck";

export const setups: PackageDef[] = [
  {
    name: "git-config",
    check: async () => {
      const email = await capture("git", ["config", "--global", "user.email"]);
      const name = await capture("git", ["config", "--global", "user.name"]);
      return {
        upToDate: Boolean(email && name),
        installed: email ? "git" : undefined,
      };
    },
    ensure: async () => {
      const email = await capture("git", ["config", "--global", "user.email"]);
      const name = await capture("git", ["config", "--global", "user.name"]);
      if (email && name) {
        console.log("skip: git already configured");
        return;
      }
      console.log("==> Configuring git");
      await $`git config --global user.email ${GIT_EMAIL}`;
      await $`git config --global user.name ${GIT_NAME}`;
    },
  },
  {
    name: "default-shell",
    dependsOn: ["fish"],
    check: async () => {
      const fishPath = await capture("which", ["fish"]);
      return { upToDate: Deno.env.get("SHELL") === fishPath };
    },
    ensure: async () => {
      const fishPath = await capture("which", ["fish"]);
      if (!fishPath) throw new Error("fish not found on PATH");
      if (Deno.env.get("SHELL") === fishPath) {
        console.log("skip: fish is already the default shell");
        return;
      }
      console.log("==> Setting fish as default shell");
      const shells = await Deno.readTextFile("/etc/shells");
      if (
        !shells.split("\n").map((s) => s.trim()).includes(fishPath)
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
      await $`chsh -s ${fishPath}`;
    },
  },
  {
    name: "agent-skills",
    check: async () => {
      const dest = join(HOME, ".agents", "skills");
      try {
        const st = await Deno.lstat(dest);
        if (!st.isSymlink) return { upToDate: false };
        const target = await Deno.readLink(dest);
        return { upToDate: target === join(REPO_ROOT, ".agents", "skills") };
      } catch {
        return { upToDate: false };
      }
    },
    ensure: async () => {
      const src = join(REPO_ROOT, ".agents", "skills");
      const dest = join(HOME, ".agents", "skills");
      await Deno.mkdir(join(HOME, ".agents"), { recursive: true });
      try {
        const st = await Deno.lstat(dest);
        if (st.isSymlink) {
          const target = await Deno.readLink(dest);
          if (target === src) {
            console.log("skip: agent skills already linked");
            return;
          }
        } else {
          const ok = await $.confirm({
            message: `already exists: ${dest} — delete and relink?`,
            default: false,
          });
          if (!ok) return;
          await Deno.remove(dest, { recursive: true });
        }
      } catch {
        // does not exist
      }
      await Deno.symlink(src, dest);
      console.log(`linked: ${dest} -> ${src}`);
    },
  },
  {
    name: "hammercert",
    check: async () => {
      const dest = "/usr/local/share/ca-certificates/hammer_root_ca.crt";
      try {
        await Deno.lstat(dest);
        return { upToDate: true };
      } catch {
        return { upToDate: false };
      }
    },
    ensure: async () => {
      const certSrc = join(REPO_ROOT, "certs", "hammer_root_ca.crt");
      const certDest = "/usr/local/share/ca-certificates/hammer_root_ca.crt";
      try {
        await Deno.lstat(certSrc);
      } catch {
        console.log("skip: no certificate found in repo");
        return;
      }
      console.log("==> Installing TLS certificate");
      await $`sudo cp ${certSrc} ${certDest}`;
      await $`sudo update-ca-certificates`;
    },
  },
];
