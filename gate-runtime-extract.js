// Primary pattern source: toxicwind/github-advanced-search-mcp packages/github-client (retry, supplemental when low yield) + stress_test (no blind sleep, waits)
// This version: keep the repo backoff for page, add supplemental OpenFang API call if page load fails (to keep producing real agent data for P1).

const { chromium } = require('playwright');

const CDP = process.env.CDP_ENDPOINT || 'ws://localhost:14724?token=sovereign-browserless-2026-change-me';
const CANDIDATE_GATES = [
  'http://host.docker.internal:14719/openfang/#runtime',
  'http://172.21.0.1:14719/openfang/#runtime',
  'http://localhost:14719/openfang/#runtime'
];

const RETRY_LIMIT = 4;
const BASE_RETRY_MS = 750;

async function gotoWithRescue(page, url, attempt = 1) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
    return true;
  } catch (e) {
    const msg = e.message.split('\n')[0];
    console.error(`Attempt ${attempt} for ${url} failed: ${msg}`);
    if (attempt >= RETRY_LIMIT) throw e;
    const wait = BASE_RETRY_MS * Math.pow(2, attempt > 4 ? 4 : attempt-1);
    console.error(`Rescue retry in ${wait}ms (repo backoff pattern)...`);
    await new Promise(r => setTimeout(r, wait));
    return gotoWithRescue(page, url, attempt + 1);
  }
}

(async () => {
  const browser = await chromium.connectOverCDP(CDP);
  const context = browser.contexts()[0] || await browser.newContext();
  const page = await context.newPage();

  let loaded = false;
  let finalUrl = '';
  for (const url of CANDIDATE_GATES) {
    try {
      console.error(`Trying gate (with repo retry/rescue): ${url}`);
      await gotoWithRescue(page, url);
      loaded = true;
      finalUrl = url;
      break;
    } catch (e) {
      console.error(`All retries failed for ${url}`);
    }
  }

  if (!loaded) {
    console.error('Page load failed on all candidates (container networking issue). Falling back to supplemental OpenFang API (repo supplemental pattern) for real agent data.');
    // Supplemental: direct API call for agent status (bypasses the UI scrape for now, keeps P1 producing data)
    const https = require('https');
    const options = {
      hostname: 'localhost',
      port: 14720,
      path: '/api/status',
      method: 'GET',
      rejectUnauthorized: false
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const report = {
          timestamp: new Date().toISOString(),
          used: "custom-toxicwind-playwright-mcp-fork + repo-primary-retry-rescue + supplemental API fallback (from github-advanced-search-mcp patterns)",
          success: true,
          note: "Page load failed due to container networking; used supplemental OpenFang API for real data",
          api_data: JSON.parse(data)
        };
        console.log(JSON.stringify(report, null, 2));
        process.exit(0);
      });
    });
    req.on('error', (e) => {
      console.log(JSON.stringify({ success: false, error: 'Both page and supplemental API failed: ' + e.message }));
      process.exit(1);
    });
    req.end();
    return;
  }

  await page.waitForTimeout(900);
  const content = await page.content();
  const title = await page.title();

  const report = {
    timestamp: new Date().toISOString(),
    used: "custom-toxicwind-playwright-mcp-fork + repo-primary-retry-rescue from github-advanced-search-mcp",
    gate: finalUrl,
    title,
    success: /runtime|agent|OpenFang/i.test(content),
    agent_mentions: (content.match(/agent|Agent/g) || []).length
  };
  console.log(JSON.stringify(report, null, 2));
  await page.screenshot({ path: '/tmp/gate-real-fixed.png' });
  await page.close();
  await browser.close();
})();
