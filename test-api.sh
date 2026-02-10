#!/bin/bash

# Test token for tenant: test-corp
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRfaWQiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEifQ.signature"
API_URL="http://localhost:8000"

echo "🧪 Testing Agent Resources API"
echo "=============================="

# Test 1: Health check
echo ""
echo "1️⃣ Health check..."
curl -s $API_URL/health | jq '.'

# Test 2: List templates
echo ""
echo "2️⃣ List templates..."
curl -s -X GET $API_URL/v1/templates \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Test 3: Create a template
echo ""
echo "3️⃣ Create template..."
TEMPLATE_RESP=$(curl -s -X POST $API_URL/v1/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Agent", "description": "Test agent for API validation"}')

echo $TEMPLATE_RESP | jq '.'
TEMPLATE_ID=$(echo $TEMPLATE_RESP | jq -r '.template_id')

# Test 4: Create a version
echo ""
echo "4️⃣ Create version..."
VERSION_RESP=$(curl -s -X POST $API_URL/v1/templates/$TEMPLATE_ID/versions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version_label": "v1.0.0",
    "artifact_hash": "test123",
    "model_bundle": {"provider": "anthropic", "model": "claude-3-sonnet"},
    "prompt_bundle": {"system_prompt": "You are a helpful assistant"},
    "tool_manifest": {"tools": []}
  }')

echo $VERSION_RESP | jq '.'
VERSION_ID=$(echo $VERSION_RESP | jq -r '.version_id')

# Test 5: Get version details
echo ""
echo "5️⃣ Get version..."
curl -s -X GET $API_URL/v1/versions/$VERSION_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Test 6: List policies
echo ""
echo "6️⃣ List policies..."
curl -s -X GET $API_URL/v1/policies \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Test 7: Deploy instance
echo ""
echo "7️⃣ Deploy instance..."
curl -s -X POST $API_URL/v1/instances \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version_id": "'$VERSION_ID'",
    "environment": "dev",
    "policy_envelope_id": "22222222-2222-2222-2222-222222222222"
  }' | jq '.'

# Test 8: List instances
echo ""
echo "8️⃣ List instances..."
curl -s -X GET $API_URL/v1/instances \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "✅ API tests complete!"
