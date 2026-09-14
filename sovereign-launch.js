#!/usr/bin/env node
/**
 * Sovereign-optimized launcher for toxicwind/playwright-mcp fork.
 * Makes the MCP server reliably usable with a local Browserless pool (CDP)
 * or a live headed Firefox via remote endpoint.
 *
 * Usage (stdio MCP):
 *   node sovereign-launch.js
 *   or via your MCP client config (see README "Fork-specific workflow").
 *
 * Env / Flags for Chromium (default):
 *   CDP_ENDPOINT=ws://localhost:14724
 *   (append ?token=YOUR_TOKEN if your pool requires auth)
 *
 * Firefox live control (cdp-like):
 *   - Start a controllable Firefox once:  node launch-firefox-remote.js
 *     (or take over your real daily profile: ./launch-firefox-from-profile.sh)
 *   - Then run MCP with:  PLAYWRIGHT_MCP_BROWSER=firefox PLAYWRIGHT_MCP_REMOTE_ENDPOINT=ws://127.0.0.1:PORT  node sovereign-launch.js
 *   - Or pass flags: node sovereign-launch.js --browser firefox --remote-endpoint ws://...
 *
 * See launch-firefox-remote.js in this directory for the one-command "keep a headed Firefox alive for the agent" helper.
 */

const { program } = require('playwright-core/lib/utilsBundle');
const { tools } = require('playwright-core/lib/coreBundle');

const packageJSON = require('./package.json');

const p = program
  .version('Sovereign ' + packageJSON.version)
  .name('toxicwind-playwright-mcp-sovereign')
  .description('Playwright MCP with sovereign-friendly defaults (local Browserless CDP)');

tools.decorateMCPCommand(p, packageJSON.version);

// If no CDP/remote/bidi or other args provided, default to the local
// Browserless pool (Chromium CDP). Override with CDP_ENDPOINT, e.g.:
//   CDP_ENDPOINT='ws://localhost:14724?token=YOUR_TOKEN' node sovereign-launch.js
const hasBrowserAttach = process.argv.some(a => a.includes('--cdp') || a.includes('--remote') || a.includes('--bidi'));
const wantsFirefox = process.env.PLAYWRIGHT_MCP_BROWSER === 'firefox' || process.argv.some(a => a.includes('firefox'));

if (!hasBrowserAttach && process.argv.length <= 2 && !wantsFirefox) {
  const cdp = process.env.CDP_ENDPOINT || 'ws://localhost:14724';
  process.argv.push('--cdp-endpoint', cdp);
  console.error(`[sovereign-launch] Defaulting to CDP ${cdp}`);
}

if (wantsFirefox && !hasBrowserAttach) {
  console.error(`[sovereign-launch] Firefox mode requested. Use --remote-endpoint or PLAYWRIGHT_MCP_REMOTE_ENDPOINT (or --bidi-endpoint) to attach to a running Firefox.`);
  console.error(`[sovereign-launch] Example: launch a controllable one with: node launch-firefox-remote.js`);
}

void p.parseAsync(process.argv).catch(err => {
  console.error('[sovereign-launch] Fatal:', err);
  process.exit(1);
});
