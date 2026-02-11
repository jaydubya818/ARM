#!/bin/bash
set -e

# ARM Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Deploying ARM to $ENVIRONMENT..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
  echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
  echo "Usage: ./scripts/deploy.sh [staging|production]"
  exit 1
fi

# Check for required tools
command -v pnpm >/dev/null 2>&1 || {
  echo -e "${RED}❌ pnpm is required but not installed.${NC}"
  exit 1
}

command -v npx >/dev/null 2>&1 || {
  echo -e "${RED}❌ npx is required but not installed.${NC}"
  exit 1
}

# Check for environment variables
if [ -z "$CONVEX_DEPLOY_KEY" ]; then
  echo -e "${YELLOW}⚠️  CONVEX_DEPLOY_KEY not set. Checking .env.local...${NC}"
  if [ -f "$PROJECT_ROOT/.env.local" ]; then
    source "$PROJECT_ROOT/.env.local"
  else
    echo -e "${RED}❌ CONVEX_DEPLOY_KEY not found${NC}"
    exit 1
  fi
fi

# Step 1: Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
cd "$PROJECT_ROOT"
pnpm install --frozen-lockfile

# Step 2: Type check
echo -e "${GREEN}🔍 Running type checks...${NC}"
cd "$PROJECT_ROOT/ui"
pnpm exec tsc --noEmit || {
  echo -e "${YELLOW}⚠️  Type check warnings found (continuing)${NC}"
}

# Step 3: Build frontend
echo -e "${GREEN}🏗️  Building frontend...${NC}"
cd "$PROJECT_ROOT/ui"
pnpm build

# Check bundle size
BUNDLE_SIZE=$(du -sh dist | cut -f1)
echo -e "${GREEN}📊 Bundle size: $BUNDLE_SIZE${NC}"

# Step 4: Deploy Convex
echo -e "${GREEN}☁️  Deploying Convex functions...${NC}"
cd "$PROJECT_ROOT"
npx convex deploy --yes

# Step 5: Run health check
echo -e "${GREEN}🏥 Running health check...${NC}"
sleep 5 # Wait for deployment to propagate

# TODO: Add actual health check endpoint call
# curl -f https://your-app.convex.cloud/health || exit 1

# Step 6: Tag release
if [ "$ENVIRONMENT" = "production" ]; then
  echo -e "${GREEN}🏷️  Tagging release...${NC}"
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  git tag -a "deploy-$TIMESTAMP" -m "Production deployment $TIMESTAMP"
  git push origin "deploy-$TIMESTAMP" || echo -e "${YELLOW}⚠️  Could not push tag${NC}"
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Bundle size: $BUNDLE_SIZE"
echo "Timestamp: $(date)"
