#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v sui >/dev/null 2>&1; then
  echo "Error: sui CLI required" >&2
  exit 1
fi

echo "🚀  Publishing LedgerX"
sui client publish --gas-budget 50000000 --path contracts "$@"
