# QA Assignment — Hotel Recommendation System

This repo contains:

- `ANALYSIS.md` — Part 1a (20 test scenarios + 8 clarifying questions) and Part 1b (bug report on the sample recommendation table).
- `tests/` — Part 2 Playwright automation (5 required specs).
- `playwright.config.ts`, `package.json` — run config.

## Running the tests

```bash
npm install
npx playwright install --with-deps
npx playwright test
```

## Note on selectors (Part 2)

The target app (`https://claude.ai/public/artifacts/1e02a9a5-...`) is a client-rendered SPA. I wrote the specs against the *behavioral* spec you gave (tab names, button labels, wait conditions) using role/text-based Playwright locators, which are the resilient choice regardless of markup. A few locators reference likely `data-testid` hooks (e.g. `list-item`, `status-badge`) or status text (`"active"`, `"pending"`) — if the real app uses different attribute names or copy, swap only the locator strings; the waiting/assertion logic doesn't need to change. I've commented every assumption inline.
