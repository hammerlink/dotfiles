---
name: skill-creator
description: Use this when the user wants to create, write, edit, or organize an OpenCode skill (SKILL.md). Covers naming rules, frontmatter fields, where to place the skill (only global ~/.agents/skills/ or project .agents/skills/), description writing so the agent triggers on it correctly, and optional references/scripts/assets folders. Trigger on "create a skill", "write a SKILL.md", "make this a skill", "where should this skill live", or "global vs project skill".
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: skill-authoring
---

## What I do

Guide the creation of a new OpenCode skill: choosing a name, writing frontmatter,
picking the right file location (global or project only), writing a description that
triggers reliably, and structuring any supporting files.

## Placement — pick one (only two valid options)

Only two locations are valid:

**Global** (available in every project on this machine):

```
~/.agents/skills/<name>/SKILL.md
```

**Project** (only this repo, shareable via git, overrides a global skill of the same name):

```
.agents/skills/<name>/SKILL.md
```

Do not use `.config/opencode/skills/`, `.opencode/skills/`, `.claude/skills/`, or
`~/.claude/skills/`. For project paths, OpenCode walks up from the current working
directory to the git worktree root. If a project skill and a global skill share a
`name`, the project one wins.

Default: use `.agents/skills/<name>/SKILL.md` if the skill is specific to this repo's
conventions (its build system, its API patterns, its release process). Use
`~/.agents/skills/<name>/SKILL.md` if it's a workflow you want everywhere
(git conventions you always follow, a personal checklist, a general coding practice).

## Steps

1. **Pick the name.** Lowercase alphanumeric, single hyphens, 1–64 chars, no leading/
   trailing/double hyphens (regex: `^[a-z0-9]+(-[a-z0-9]+)*$`). The folder name must
   match `name` exactly.

2. **Create the folder and file:**

   ```
    mkdir -p ~/.agents/skills/<name>
    touch ~/.agents/skills/<name>/SKILL.md
   ```

3. **Write frontmatter.** Only these fields are recognized — anything else is ignored:
   - `name` (required) — matches the folder name
   - `description` (required, 1–1024 chars) — see below, this is the most important part
   - `license` (optional)
   - `compatibility` (optional, e.g. `opencode`)
   - `metadata` (optional, flat string-to-string map)

4. **Write the description to trigger correctly.** The agent only sees the `name` and
   `description` up front (in `<available_skills>`) and decides whether to load the full
   body based on that alone. A good description states:
   - what the skill covers/does
   - concrete trigger phrases or situations
   - 1-2 example user requests if it helps disambiguate
     Weak: `description: Helps with releases`
     Strong: `description: Use when preparing a tagged release — drafts release notes from
merged PRs, proposes a semver bump, and outputs a gh release create command. Trigger on
"cut a release", "prepare changelog", "bump version".`

5. **Write the body** (everything after the closing `---`). This is only loaded into
   context when the skill is actually invoked, so it can be as long and detailed as
   needed. Structure it like a runbook, not prose:
   - `## What I do` — a short capability summary
   - `## When to use me` — trigger conditions, edge cases, what NOT to use it for
   - `## Steps` or `## Workflow` — the actual instructions, concrete and ordered
   - Keep it scoped to one workflow per skill; split unrelated workflows into separate skills

6. **Add supporting files if needed** (optional, sit alongside SKILL.md):

   ```
   <name>/
     SKILL.md
     references/   # docs the agent reads on demand, e.g. a schema or API spec
     scripts/      # executable helpers, e.g. validate.sh, generate.py
     assets/       # templates, boilerplate, logos, etc.
   ```

   Point to these from the body (e.g. "see references/schema.md for the full format")
   rather than inlining large docs into SKILL.md itself — this keeps the always-visible
   description short while the detail loads only when needed.

7. **Verify discovery.** If the skill doesn't show up in `<available_skills>`:
    - Confirm the file is literally named `SKILL.md` (all caps)
    - Confirm `name` and `description` are both present in frontmatter
    - Confirm the skill name is unique across both global and project locations
    - Check `opencode.json` → `permission.skill` for a `deny` rule matching the name

8. **Optional: scope permissions.** In `opencode.json`, restrict which agents can load
   which skills:

   ```json
   {
     "permission": {
       "skill": {
         "*": "allow",
         "internal-*": "deny",
         "experimental-*": "ask"
       }
     }
   }
   ```

   Patterns support wildcards. Per-agent overrides go in agent frontmatter
   (`permission.skill`) or under `agent.<name>.permission.skill` in `opencode.json`.

## Example

```
---
name: commit-message
description: Use when writing or reviewing a git commit message. Enforces a consistent commit convention (type, scope, imperative summary, body) from the staged diff. Trigger on "write a commit message", "commit this", "how should I commit this", or before any `git commit`.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: git
---

## What I do
- Inspect the staged diff and summarize the change accurately
- Produce a commit message following Conventional Commits format
- Flag when a diff mixes unrelated changes that should be split into separate commits

## When to use me
Use this whenever a commit message is needed — after staging changes, or when reviewing
someone else's commit for convention compliance. Don't use this to write release notes
or changelogs (see a separate skill for that).

## Format
```

<type>(<scope>): <imperative summary, ≤50 chars, no trailing period>

<optional body: what changed and why, wrapped at ~72 chars>

<optional footer: BREAKING CHANGE:, Refs: #123>

```

`type` is one of: feat, fix, refactor, docs, test, chore, style, perf, build, ci
`scope` is the affected module/package/directory (omit if repo-wide)

## Steps
1. Run `git diff --staged` to see exactly what will be committed
2. If nothing is staged, say so and stop — don't guess from unstaged changes
3. Identify the single primary purpose of the diff. If there are two unrelated
   purposes (e.g. a bugfix plus an unrelated refactor), flag it and suggest splitting
   into separate commits before proceeding
4. Pick `type` and `scope` from the diff content, not from what the user says they did
5. Write the imperative summary line (e.g. "add", not "added" or "adds")
6. Add a body only if the summary line doesn't fully explain the "why"
7. Output the message in a fenced block ready to paste into `git commit -m` or
   `git commit -F -`
```

Save this at `.agents/skills/commit-message/SKILL.md` (project) or
`~/.agents/skills/commit-message/SKILL.md` (global) — this one's generic enough
to be worth having globally.
