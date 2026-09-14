## Playwright MCP

> Fork note: this fork is maintained at `toxicwind/playwright-mcp` for a headed rebrowser workflow.
> The current direction is: keep upstream compatibility, but optimize local operator flows around:
> - persistent headed Chromium sessions
> - CDP attach to already-running browser windows
> - rebrowser-friendly launch and session reuse
> - Codex/Apex/OpenClaw operator workflows
>
> Upstream remains the source of truth for the base server. This fork adds local operator ergonomics and auto-syncs from upstream `main`.

### Install

`@toxicwind/playwright-mcp` is **not on the npm registry yet** — npm trusted
publishing is not configured (the nightly canary job in
`.github/workflows/publish.yml` is gated on the `NPM_CANARY_ENABLED` repo
variable). Until publishing is enabled, `npx @toxicwind/playwright-mcp@latest`
returns 404. Install from git instead:

```bash
# zero-install: runs straight from GitHub (verified working)
npx -y github:toxicwind/playwright-mcp --help

# or clone for local development / config-file use
git clone https://github.com/toxicwind/playwright-mcp.git
cd playwright-mcp
npm install
node cli.js --help
```

Every `npx` example in this README uses the `github:toxicwind/playwright-mcp`
form so it works today. Once npm publishing is enabled,
`@toxicwind/playwright-mcp@latest` will work as a drop-in replacement.

### Fork-specific workflow

This fork is intended to work well with a live headed browser instead of always booting a fresh isolated instance.

Primary local model:

1. Start a headed rebrowser/Chromium session with remote debugging enabled.
2. Point Playwright MCP at that browser with `--cdp-endpoint`.
3. Reuse the real logged-in profile and tabs instead of reauthing inside a throwaway automation context.

Example:

```bash
npx -y github:toxicwind/playwright-mcp \
  --cdp-endpoint http://127.0.0.1:46677 \
  --caps vision,devtools
```

Codex config example:

```toml
[mcp_servers.playwright]
command = "npx"
args = [
  "-y",
  "github:toxicwind/playwright-mcp",
  "--cdp-endpoint",
  "http://127.0.0.1:46677",
  "--caps",
  "vision,devtools"
]
```

If you prefer the browser-extension bridge instead of CDP, the upstream extension mode remains supported. This fork does not remove that path.

### Firefox live control ("CDP-like" for Firefox)

Chromium has the beautiful `--cdp-endpoint` story for attaching to your already-running browser.

Firefox does **not** have a CDP equivalent (CDP is Chromium-only). However this fork adds first-class support for the practical equivalent:

**Recommended pattern (most reliable "live Firefox" experience):**

1. Start a dedicated controllable headed Firefox (one time or per session):
   ```bash
   git clone https://github.com/toxicwind/playwright-mcp.git
   cd playwright-mcp
   npm install   # once
   node launch-firefox-remote.js
   ```
   This prints a `ws://...` endpoint and keeps a real headed Firefox window open.

   Prefer your real daily profile instead of a throwaway one? Use the helper:
   ```bash
   ./launch-firefox-from-profile.sh        # auto-detects your default profile
   ./launch-firefox-from-profile.sh /path/to/firefox/xxxxx.default-release
   ```
   It gently closes Firefox instances on that profile, relaunches it headed
   under Playwright's `launchServer`, and prints the `ws://...` endpoint.
   (It will kill your running Firefox on that profile — session restore
   usually brings your tabs back, but save work first.)

2. Point the MCP server at it (in a separate terminal or via your MCP client config):
   ```bash
   PLAYWRIGHT_MCP_BROWSER=firefox \
   PLAYWRIGHT_MCP_REMOTE_ENDPOINT=ws://127.0.0.1:PORT \
     node sovereign-launch.js
   ```

   Or with flags:
   ```bash
   node sovereign-launch.js \
     --browser firefox \
     --remote-endpoint ws://127.0.0.1:PORT
   ```

3. (Optional but powerful) Use a persistent profile you pre-logged into GitHub / your tools:
   - Close your normal Firefox (or use a different profile).
   - Point `launch-firefox-remote.js` at your real profile dir via the
     `FIREFOX_AGENT_PROFILE` env var — or just run
     `./launch-firefox-from-profile.sh`, which does this for you.
   - The agent now sees your real cookies, logins, tabs, extensions, etc.

You can also use `--bidi-endpoint` for raw WebDriver BiDi endpoints if you have a stock Firefox listening on one (advanced, less reliable than the `launchServer` path above).

In your `.grok/config.toml` or Codex/etc config you can now do:

```toml
[mcp_servers.sovereign-playwright-fork]
command = "node"
args = [
  "/path/to/playwright-mcp/sovereign-launch.js",
  "--browser", "firefox",
  "--remote-endpoint", "ws://127.0.0.1:THE_PORT"
]
```

This is the closest thing to "live control my currently running Firefox" that exists in the Playwright ecosystem today.

### Upstream sync policy

This repository includes a GitHub Actions workflow that keeps `main` aligned with `microsoft/playwright-mcp` by fast-forwarding from upstream when possible.

Manual sync:

```bash
git remote add upstream https://github.com/microsoft/playwright-mcp.git
git fetch upstream
git checkout main
git merge --ff-only upstream/main
git push origin main
```

After any sync that touches `README.md`, re-apply this fork's additions:

```bash
node apply-fork-preamble.js  # restores the fork preamble (this section) at the top of README.md
node update-readme.js         # regenerates the tools/options/config reference sections
```

How it works: the canonical fork preamble lives in `.github/fork-preamble.md`.
`apply-fork-preamble.js` inserts it at the top of `README.md` between
`<!-- FORK-PREAMBLE-START -->` / `<!-- FORK-PREAMBLE-END -->` markers
(idempotent — safe to run any time). `update-readme.js` (upstream's generator, also wired as `npm run lint`)
regenerates the marked tools/options/config sections from the installed
`playwright-core` bundle and `config.d.ts`. The publish workflow runs both
scripts and then fails the job on any `README.md` drift, so a stale README
blocks publish instead of shipping.
