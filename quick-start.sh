#!/bin/bash
set -e

echo "🚀 Agent Resources Platform - Quick Start"
echo "=========================================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop first."
    exit 1
fi

echo "✅ Docker found"

# Start infrastructure
echo ""
echo "📦 Starting infrastructure services..."
cd infra/docker
docker-compose up -d

echo "⏳ Waiting for services to be ready (30 seconds)..."
sleep 30

# Check Postgres health
echo "🔍 Checking Postgres..."
docker exec ar-postgres pg_isready -U ar || {
    echo "❌ Postgres not ready"
    exit 1
}
echo "✅ Postgres ready"

# Run migrations
echo ""
echo "📊 Running database migrations..."
docker exec -i ar-postgres psql -U ar -d ar_dev < ../../services/control-plane/migrations/001_init_schema.sql
docker exec -i ar-postgres psql -U ar -d ar_dev < ../../services/control-plane/migrations/002_seed_data.sql
echo "✅ Migrations complete"

# Setup Python environment
echo ""
echo "🐍 Setting up Python environment..."
cd ../../services/control-plane

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt
echo "✅ Python dependencies installed"

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the API:"
echo "   cd services/control-plane"
echo "   source venv/bin/activate"
echo "   python api/main.py"
echo ""
echo "2. API will be available at: http://localhost:8000"
echo "3. Temporal UI: http://localhost:8080"
echo "4. MinIO UI: http://localhost:9001 (minioadmin/minioadmin)"
echo ""
echo "Test token (tenant: test-corp):"
echo "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRfaWQiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEifQ.signature"
