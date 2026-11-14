# Frontend and animation skills for Claude Code

This is the frontend and motion setup O1 uses in Claude Code. Install it to get the same skills and MCP servers on your laptop. Everything goes into your user folder (`~/.claude/`), not into this repo, so it works in every project.

Time: about 10 minutes. Sources were checked on 14 Nov 2026.

## Before you start

You need Claude Code, git, Node 18 or newer (for `npx`) and Python 3 (`ui-ux-pro-max` runs a Python search script). Check with:

```bash
node --version && python3 --version && git --version
```

## 1. Plugins (run inside Claude Code)

Type these in a Claude Code session, one line at a time:

```
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
/plugin marketplace add obra/superpowers
/plugin install superpowers@superpowers-dev
```

`example-skills` brings `frontend-design`, `canvas-design` and `webapp-testing`. Superpowers is not a frontend skill, but `CLAUDE.md` requires it (brainstorming, debugging, verification before "done").

## 2. impeccable (UI audit)

```bash
npx impeccable install
```

Choose global install and say yes to the design hook. It scans each UI file Claude edits and reports problems before Claude calls the work done.

## 3. Skills copied from GitHub

Each block clones a repo into a temp folder and copies the skill folders to `~/.claude/skills/`.

Motion and UI craft (Emil Kowalski, MIT):

```bash
mkdir -p ~/.claude/skills && T=$(mktemp -d) && git clone -q --depth 1 https://github.com/emilkowalski/skills.git "$T" && for n in animate animate-expo animation-vocabulary apple-design ask-sonner break-ui emil-design-eng find-animation-opportunities improve-animations mobile-native pick-ui-library prototype review-animations write-swift; do cp -R "$T/skills/$n" ~/.claude/skills/; done
```

The repo has a few newer skills too (`animation-performance`, `choreograph`, `gestures`, `remove-animations`, `learn-taste`). O1 has not tested them; copy them the same way if you want them.

Style skills (Leonxlnx/taste-skill, MIT). On 19 Oct 2026 the repo was cut down to one skill, so this pins the last commit that still has all of them:

```bash
T=$(mktemp -d) && git clone -q https://github.com/Leonxlnx/taste-skill.git "$T" && git -C "$T" checkout -q f6831c5 && for n in taste-skill minimalist-skill brutalist-skill soft-skill stitch-skill gpt-tasteskill redesign-skill brandkit imagegen-frontend-web imagegen-frontend-mobile image-to-code-skill; do cp -R "$T/skills/$n" ~/.claude/skills/; done
```

Component spec sheets (enesozturk/dimensional-drawing, MIT):

```bash
T=$(mktemp -d) && git clone -q --depth 1 https://github.com/enesozturk/dimensional-drawing.git "$T" && cp -R "$T/skills/dimensional-drawing" "$T/skills/dimensional-drawing-motion" ~/.claude/skills/
```

Optional, only if you need them:

```bash
T=$(mktemp -d) && git clone -q --depth 1 https://github.com/remotion-dev/skills.git "$T" && cp -R "$T/skills/remotion-best-practices" ~/.claude/skills/
```

```bash
T=$(mktemp -d) && git clone -q --depth 1 https://github.com/kelvinkn17/skills.git "$T" && cp -R "$T/skills/fun-isometric" ~/.claude/skills/
```

`fun-isometric` also needs `bun`, and ffmpeg for video export.

## 4. MCP servers

Run in a normal terminal. `--scope user` makes them available in every project.

```bash
claude mcp add --scope user --transport http context7 https://mcp.context7.com/mcp
```

```bash
claude mcp add --scope user shadcn -- npx -y shadcn@latest mcp
```

```bash
claude mcp add --scope user playwright -- npx @playwright/mcp@latest
```

```bash
claude mcp add --scope user chrome-devtools -- npx chrome-devtools-mcp@latest
```

```bash
claude mcp add --scope user nakkas -- npx -y nakkas@latest
```

```bash
claude mcp add --scope user photopea -- npx -y photopea-mcp-server
```

Magic (21st.dev components) needs your own free key from https://21st.dev/mcp. The key ends up in `~/.claude.json` on your laptop. Never put it in this repo, a PR or chat.

```bash
claude mcp add --scope user magic --env API_KEY=PASTE_YOUR_KEY -- npx -y @21st-dev/magic@latest
```

What each one is for: Context7 gives current library docs (check React, Tailwind or Leaflet APIs before writing code), shadcn pulls shadcn/ui component code from the live registry, Playwright takes screenshots and runs UI flows, Chrome DevTools reads console and network of a running app, Nakkas draws SVG icons and backgrounds, Photopea edits images.

On macOS 13 the Playwright MCP works because it uses your installed Google Chrome. `npx playwright install chromium` from Playwright 1.63 on fails there.

## 5. Check that it works

Restart Claude Code, then:

```bash
claude mcp list
```

All servers should show as connected. In a Claude Code session, `/plugin` lists the plugins. Ask "which frontend skills do you have?" and the skills from step 3 should be on the list.

## Which skill for which job

| Job | Skill |
|---|---|
| Plan, build or review any UI (default) | `ui-ux-pro-max` |
| New component from scratch | `frontend-design` |
| Audit before calling UI work done | `impeccable` |
| Redesign an existing screen | `redesign-skill` |
| General UI polish | `emil-design-eng` |
| Test a component with worst-case data | `break-ui` |
| Web app that should feel native on a phone | `mobile-native` |
| Build one animation (web) | `animate` |
| Animation in React Native / Expo | `animate-expo` |
| Critique existing motion | `review-animations` |
| Plan motion fixes across the codebase (no edits) | `improve-animations` |
| Find places that should animate (read only) | `find-animation-opportunities` |
| Name a motion effect | `animation-vocabulary` |
| Mockup image of a web page or app screen | `imagegen-frontend-web`, `imagegen-frontend-mobile` |
| Mockup image first, then code to match it | `image-to-code-skill` |
| Spec sheet of one component | `dimensional-drawing`, then `dimensional-drawing-motion` |

Style skills change the look of the whole result. Use them only when the team picked that look: `minimalist-skill`, `brutalist-skill`, `soft-skill`, `stitch-skill`, `gpt-tasteskill`, `taste-skill`, `apple-design`, `brandkit`. `ui-ux-pro-max` already covers these styles, so if nobody chose one, stay with it.

## Libraries

These are npm packages, not skills. Adding one to this project goes through a `[contract]` PR (see `CLAUDE.md`).

- anime.js v4 (`animejs`): animations in plain HTML. The v4 API differs from v3, so check Context7 first.
- d3 v7: custom interactive charts and maps.
- skullet: skeleton loaders that match the real content. Pre-1.0, so pin the version.
- Phosphor Icons (`@phosphor-icons/react`): icon set.
- Animista (https://animista.net): CSS animation generator, for reference only.

## Updating

Run the block from step 3 again; `cp -R` overwrites the old copy. For plugins use `/plugin` in Claude Code, for impeccable run `npx impeccable update`.
