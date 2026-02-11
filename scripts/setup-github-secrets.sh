#!/usr/bin/env bash
# Configure GitHub Actions secrets and variables for ARM deployment.
# Run from project root. Requires: gh CLI, Convex deploy key, Convex URL.
# Get CONVEX_DEPLOY_KEY from: https://dashboard.convex.dev → project → Settings → Deploy Keys

set -e

REPO="jaydubya818/ARM"

echo "=== ARM GitHub Secrets Setup ==="
echo "Repo: $REPO"
echo ""

# CONVEX_URL - try from .env.local first
if [ -f .env.local ] && grep -q CONVEX_URL .env.local; then
  DEFAULT_URL=$(grep CONVEX_URL .env.local | head -1 | cut -d= -f2)
  echo "Convex URL from .env.local: $DEFAULT_URL"
  read -p "Use this for CONVEX_URL? [Y/n] " use_default
  if [ "$use_default" != "n" ] && [ "$use_default" != "N" ]; then
    CONVEX_URL="$DEFAULT_URL"
  fi
fi
if [ -z "$CONVEX_URL" ]; then
  read -p "Enter CONVEX_URL (e.g. https://xxx.convex.cloud): " CONVEX_URL
fi
if [ -n "$CONVEX_URL" ]; then
  echo "$CONVEX_URL" | gh secret set CONVEX_URL --repo "$REPO"
  echo "✓ CONVEX_URL set"
fi

# CONVEX_DEPLOY_KEY - must be provided
echo ""
read -sp "Paste CONVEX_DEPLOY_KEY (from Convex Dashboard → Deploy Keys): " CONVEX_DEPLOY_KEY
echo ""
if [ -n "$CONVEX_DEPLOY_KEY" ]; then
  echo "$CONVEX_DEPLOY_KEY" | gh secret set CONVEX_DEPLOY_KEY --repo "$REPO"
  echo "✓ CONVEX_DEPLOY_KEY set"
else
  echo "Skipped (empty)"
fi

# VERCEL_TOKEN - optional
echo ""
read -p "Add VERCEL_TOKEN for frontend deploy? [y/N] " add_vercel
if [ "$add_vercel" = "y" ] || [ "$add_vercel" = "Y" ]; then
  read -sp "Paste VERCEL_TOKEN: " VERCEL_TOKEN
  echo ""
  if [ -n "$VERCEL_TOKEN" ]; then
    echo "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN --repo "$REPO"
    echo "✓ VERCEL_TOKEN set"
  fi
fi

# DEPLOYED_FRONTEND_URL variable (optional)
echo ""
read -p "Add DEPLOYED_FRONTEND_URL variable for post-deploy verify? [y/N] " add_var
if [ "$add_var" = "y" ] || [ "$add_var" = "Y" ]; then
  read -p "Enter frontend URL (e.g. https://arm.vercel.app): " FRONTEND_URL
  if [ -n "$FRONTEND_URL" ]; then
    gh variable set DEPLOYED_FRONTEND_URL --body "$FRONTEND_URL" --repo "$REPO"
    echo "✓ DEPLOYED_FRONTEND_URL set"
  fi
fi

echo ""
echo "Done. Run deploy: git push origin main"
echo "Or: gh workflow run deploy --repo $REPO"
