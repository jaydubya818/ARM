#!/usr/bin/env bash
# ARM Production Deployment Script
set -e

echo "🚀 ARM Production Deployment"
echo "=============================="

# 1. Convex
echo ""
echo "1. Deploying Convex..."
npx convex deploy --prod
echo "✅ Convex deployed"

# 2. Seed (optional - uncomment to run)
# echo ""
# echo "2. Seeding production data..."
# npx convex run seedARM --prod
# echo "✅ Seed complete"

# 3. UI
echo ""
echo "3. Building UI..."
cd ui && pnpm build
echo "✅ UI built (dist/)"

echo ""
echo "=============================="
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  - Deploy dist/ to Vercel/Netlify: pnpm deploy:vercel"
echo "  - Or: vercel --prod (from ui/)"
echo "  - Set VITE_CONVEX_URL and VITE_CLERK_PUBLISHABLE_KEY in hosting env"
echo ""
