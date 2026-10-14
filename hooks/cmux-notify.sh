#!/bin/bash
# Stop hook: send a cmux notification with the head of the last assistant reply.
cmux ping >/dev/null 2>&1 || exit 0

EVENT=$(cat)
CWD=$(echo "$EVENT" | jq -r '.cwd // empty')
SESSION_ID=$(echo "$EVENT" | jq -r '.session_id // empty')

# The Stop payload carries no response text; read the last "Say" message
# from the session log at ~/.kiro/sessions/<hash>/<session_id>/messages.jsonl.
RESPONSE=""
if [ -n "$SESSION_ID" ]; then
  for LOG in "$HOME"/.kiro/sessions/*/"$SESSION_ID"/messages.jsonl; do
    [ -f "$LOG" ] || continue
    # Last "Say" after the most recent turn_start, truncated by code point (CJK-safe).
    RESPONSE=$(jq -rs '
      (map(.payload.type) | rindex("turn_start") // 0) as $start
      | .[$start:]
      | map(select(.payload.type == "assistant" and .payload.operationType == "Say"))
      | last | .payload.content // empty
      | gsub("\\s+"; " ") | .[0:80]
    ' "$LOG" 2>/dev/null)
    break
  done
fi

PROJECT=$(basename "$CWD")
if [ -n "$RESPONSE" ]; then
  BODY="${RESPONSE}…"
else
  BODY="Response completed"
fi

cmux notify \
  --title "Kiro CLI — $PROJECT" \
  --subtitle "$CWD" \
  --body "$BODY"
