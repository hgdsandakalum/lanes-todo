#!/bin/bash
# Starts the app for the browser tests on a fresh, seeded database in e2e/.tmp. Playwright runs this; see playwright.config.ts.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf e2e/.tmp
mkdir -p e2e/.tmp
npx drizzle-kit push --config e2e/drizzle.config.ts > e2e/.tmp/push.log
npx tsx lib/db/seed.ts > e2e/.tmp/seed.log
npx next build > e2e/.tmp/build.log
exec npx next start -p "$PORT"
