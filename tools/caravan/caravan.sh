#!/bin/sh
set -eu
command -v node >/dev/null 2>&1 || { echo 'Node.js 22 or later is required. See README.md.' >&2; exit 2; }
exec node "$(dirname "$0")/caravan.mjs" "$@"
