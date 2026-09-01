#!/usr/bin/env bash
# Build the static bundle and sync it to the directory nginx serves.
# See README.md "Deploying" for the full workflow.
set -euo pipefail

TARGET_DIR="${GOTHAM_DEPLOY_DIR:-/var/www/gotham}"

cd "$(dirname "${BASH_SOURCE[0]}")"

npm ci
npm run build

if [ ! -d dist ]; then
  echo "error: dist/ was not created — build failed" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"
rsync -a --delete dist/ "$TARGET_DIR/"

echo "Deployed to $TARGET_DIR"
