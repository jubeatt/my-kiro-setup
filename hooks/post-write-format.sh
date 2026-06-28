#!/bin/bash
# postToolUse hook: format after fs_write

FILE=$(cat | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.path || ''")
[ -z "$FILE" ] && exit 0

# Find the nearest package.json
PKG=""
DIR=$(dirname "$FILE")
while [ "$DIR" != "/" ]; do
  if [ -f "$DIR/package.json" ]; then
    PKG="$DIR/package.json"
    break
  fi
  DIR=$(dirname "$DIR")
done

# Format
if [ -n "$PKG" ] && grep -q '"format:write"' "$PKG" 2>/dev/null; then
  (cd "$(dirname "$PKG")" && pnpm format:write "$FILE" 2>/dev/null)
else
  biome format --write "$FILE" 2>/dev/null
fi

exit 0
