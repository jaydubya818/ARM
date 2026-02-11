#!/usr/bin/env bash
# Smoke test for deployed ARM frontend.
# Usage: ./scripts/verify-deploy.sh <frontend-url>
# Example: ./scripts/verify-deploy.sh https://arm.vercel.app

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <frontend-url>"
  echo "Example: $0 https://arm.vercel.app"
  exit 0
fi

URL="$1"
echo "Verifying deployment at $URL..."

# Normalize URL (remove trailing slash)
URL="${URL%/}"

# Check frontend loads
echo "Checking frontend..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$URL" || true)
if [ "$HTTP" != "200" ]; then
  echo "FAIL: Frontend returned HTTP $HTTP"
  exit 1
fi

# Check for ARM branding in HTML
echo "Checking ARM branding..."
if ! curl -sL "$URL" | grep -q "ARM"; then
  echo "WARN: 'ARM' not found in page (may be client-rendered)"
fi

# Check Convex health (if deployment URL is known)
# curl -s "$CONVEX_URL/api/health" would work for Convex HTTP API
# Skipping - requires CONVEX_URL and health endpoint

echo "OK: Deployment verified"
