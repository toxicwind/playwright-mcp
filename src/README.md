# Where is the source?

This fork keeps a thin wrapper at the repo root (`cli.js`, `index.js`,
`config.d.ts`, `sovereign-launch.js`) over the `playwright-core` npm
bundle. The upstream Playwright MCP source it wraps lives in the
[Playwright monorepo](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/tools/mcp).
Please refer to the contributor's guide in [CONTRIBUTING.md](../CONTRIBUTING.md) for more details.
