#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "✅  Running LedgerX tests"
sui move test --path contracts "$@"
