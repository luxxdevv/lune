#!/usr/bin/env sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
if ! command -v node >/dev/null 2>&1; then
  echo 'Install Node.js 24 from https://nodejs.org and run this file again.'
  exit 1
fi
if [ ! -d node_modules ]; then npm ci --no-audit --no-fund; fi
npm run setup
echo 'Open http://localhost:3100 when the server says Ready.'
npm run dev
