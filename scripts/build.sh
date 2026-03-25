#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "🛠️  Building LedgerX"
sui move build --path contracts "$@"
