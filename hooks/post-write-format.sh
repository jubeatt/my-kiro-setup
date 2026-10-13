#!/bin/bash
# postToolUse hook: format the written file with the repo's own formatter.
#
# Walks up from the file to the git root; the nearest directory with a marker wins:
#   1. package.json "format:write" script -> pnpm format:write <file>
#   2. biome config                        -> biome (local bin preferred)
#   3. prettier config                     -> local prettier only (skip if not installed)
# No marker up to the git root -> global biome as the personal default.

# Resolve the written path to an absolute real path (follows symlinks such as ~/.kiro/*).
FILE=$(node -e '
  const fs = require("fs");
  const os = require("os");
  const path = require("path");
  const payload = JSON.parse(fs.readFileSync(0, "utf8"));
  const raw = payload.tool_input?.path || "";
  if (!raw) process.exit(0);
  const expanded = raw.replace(/^~(?=$|\/)/, os.homedir());
  const abs = path.resolve(payload.cwd || process.cwd(), expanded);
  try {
    process.stdout.write(fs.realpathSync(abs));
  } catch {
    process.stdout.write(abs);
  }
' 2>/dev/null)

if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

# Prints "script" or "prettier" based on package.json contents.
pkg_marker() {
  node -e '
    const pkg = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    if (pkg.scripts?.["format:write"]) console.log("script");
    else if (pkg.prettier !== undefined) console.log("prettier");
  ' "$1" 2>/dev/null
}

# Prints the formatter configured in directory $1, or nothing.
detect_formatter() {
  local dir="$1" marker="" f
  [ -f "$dir/package.json" ] && marker=$(pkg_marker "$dir/package.json")
  if [ "$marker" = "script" ]; then
    echo script
    return
  fi
  for f in biome.json biome.jsonc .biome.json .biome.jsonc; do
    if [ -f "$dir/$f" ]; then
      echo biome
      return
    fi
  done
  if [ "$marker" = "prettier" ]; then
    echo prettier
    return
  fi
  for f in "$dir"/.prettierrc "$dir"/.prettierrc.* "$dir"/prettier.config.*; do
    if [ -f "$f" ]; then
      echo prettier
      return
    fi
  done
}

# Prints the nearest node_modules/.bin/$2 walking up from $1.
find_local_bin() {
  local dir="$1"
  while :; do
    if [ -x "$dir/node_modules/.bin/$2" ]; then
      echo "$dir/node_modules/.bin/$2"
      return 0
    fi
    [ "$dir" = "/" ] && return 1
    dir=$(dirname "$dir")
  done
}

DIR=$(dirname "$FILE")
KIND=""
while :; do
  KIND=$(detect_formatter "$DIR")
  [ -n "$KIND" ] && break
  if [ -e "$DIR/.git" ] || [ "$DIR" = "/" ]; then
    break
  fi
  DIR=$(dirname "$DIR")
done

cd "$DIR" 2>/dev/null || exit 0

case "$KIND" in
  script)
    pnpm format:write "$FILE"
    ;;
  biome)
    BIN=$(find_local_bin "$DIR" biome) || BIN=biome
    "$BIN" format --write "$FILE"
    ;;
  prettier)
    BIN=$(find_local_bin "$DIR" prettier) || exit 0
    "$BIN" --write --ignore-unknown "$FILE"
    ;;
  *)
    biome format --write "$FILE"
    ;;
esac >/dev/null 2>&1

exit 0
