#!/bin/bash

cd /Users/benjaminshafii/git/NewDevVault/.obsidian/plugins/file-organizer-2000

# Array of used endpoints that should be kept
USED_ENDPOINTS=(
  "check-key"
  "check-premium"
  "concepts-and-chunks"
  "format"
  "format-stream"
  "classify1"
  "vision"
  "tags/v2"
  "folders/v2"
  "title/v2"
  "top-up"
  "usage"
  "fabric-classify"
  "chat"
  "modify"
  "transcribe"
  "upload"
  "process-file"
  "file-status"
  "folders"
  "redeploy"
  "cron/reset-tokens"
  "health"
  "tags"
  "title"
  "webhook"
)

# Helper function to check if an endpoint is used
is_endpoint_used() {
  local endpoint="$1"
  for used in "${USED_ENDPOINTS[@]}"; do
    if [[ "$endpoint" == "$used" || "$endpoint" == "$used/"* || "$endpoint" == *"/$used" || "$endpoint" == *"/$used/"* ]]; then
      return 0
    fi
  done
  return 1
}

# Remove unused endpoints in the (newai) directory
for dir in packages/web/app/api/\(newai\)/*; do
  if [ -d "$dir" ]; then
    endpoint=$(basename "$dir")
    if ! is_endpoint_used "$endpoint"; then
      echo "Removing unused endpoint: $dir"
      rm -rf "$dir"
    fi
  fi
done

# Remove unused endpoints in the (sync) directory
for dir in packages/web/app/api/\(sync\)/*; do
  if [ -d "$dir" ]; then
    endpoint=$(basename "$dir")
    if ! is_endpoint_used "$endpoint"; then
      echo "Removing unused endpoint: $dir"
      rm -rf "$dir"
    fi
  fi
done

# Remove unused endpoints at the top level
for dir in packages/web/app/api/*; do
  if [ -d "$dir" ] && [ $(basename "$dir") != "(newai)" ] && [ $(basename "$dir") != "(sync)" ] && [ $(basename "$dir") != "webhook" ]; then
    endpoint=$(basename "$dir")
    if ! is_endpoint_used "$endpoint"; then
      echo "Removing unused endpoint: $dir"
      rm -rf "$dir"
    fi
  fi
done

echo "Finished removing unused API endpoints"
