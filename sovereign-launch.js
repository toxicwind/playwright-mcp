#!/usr/bin/env node
/**
 * Sovereign-optimized launcher for toxicwind/playwright-mcp fork.
 * Makes the MCP server reliably usable with local Browserless pool (CDP)
 * for the sovereign AI stack (14719 landing self-inspection, OpenClaw/legacy
 * agent UI mining, OpenFang agent browser loops, etc.).
 *
 * Usage (stdio MCP):
 *   node sovereign-launch.js
 *   or via .mcp.json / sovereign-maximal.sh
 *
 * Env / Flags for Chromium (default):
 *   CDP_ENDPOINT=ws://localhost:14724
 *
 * Firefox live control (cdp-like):
 *   - Start a controllable Firefox once:  node launch-firefox-remote.js
 *   - Then run MCP with:  PLAYWRIGHT_MCP_BROWSER=firefox PLAYWRIGHT_MCP_REMOTE_ENDPOINT=ws://127.0.0.1:PORT  node sovereign-launch.js
 *   - Or pass flags: node sovereign-launch.js --browser firefox --remote-endpoint ws://...
 *
 * See launch-firefox-remote.js in this directory for the one-command "keep a headed Firefox alive for the agent" helper.
 */

const { program } = require('playwright-core/lib/utilsBundle');
const { decorateMCPCommand } = require('playwright/lib/mcp/program');

const packageJSON = require('./packages/playwright-mcp/package.json');

const p = program
  .version('Sovereign ' + packageJSON.version)
  .name('toxicwind-playwright-mcp-sovereign')
  .description('Playwright MCP with sovereign-friendly defaults (local Browserless CDP)');

decorateMCPCommand(p, packageJSON.version);

// If no CDP/remote/bidi or other args provided, default to our local sovereign pool (Chromium CDP)
const hasBrowserAttach = process.argv.some(a => a.includes('--cdp') || a.includes('--remote') || a.includes('--bidi'));
const wantsFirefox = process.env.PLAYWRIGHT_MCP_BROWSER === 'firefox' || process.argv.some(a => a.includes('firefox'));

if (!hasBrowserAttach && process.argv.length <= 2 && !wantsFirefox) {
  const cdp = process.env.CDP_ENDPOINT || 'ws://localhost:14724?token=sovereign-browserless-2026-change-me';
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
