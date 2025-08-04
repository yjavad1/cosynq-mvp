#!/bin/bash

# Railway Backend Testing Script
# Replace YOUR_BACKEND_URL with your actual Railway backend URL

BACKEND_URL="https://your-backend-url.railway.app"

echo "🧪 Testing Railway Backend Deployment"
echo "======================================="

echo ""
echo "1. Testing root endpoint..."
curl -s "$BACKEND_URL/" | jq '.' || echo "❌ Root endpoint failed"

echo ""
echo "2. Testing direct test route..."
curl -s "$BACKEND_URL/test" | jq '.' || echo "❌ Test route failed"

echo ""
echo "3. Testing API health endpoint..."
curl -s "$BACKEND_URL/api/health" | jq '.' || echo "❌ API health failed"

echo ""
echo "4. Testing API routes listing..."
curl -s "$BACKEND_URL/api/routes" | jq '.' || echo "❌ API routes failed"

echo ""
echo "5. Testing auth register endpoint..."
curl -s -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}' \
  | jq '.' || echo "❌ Auth register failed"

echo ""
echo "6. Testing auth login endpoint..."
curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq '.' || echo "❌ Auth login failed"

echo ""
echo "✅ Testing complete!"
echo ""
echo "🔍 Check Railway logs for detailed output including:"
echo "   - Route registration messages"
echo "   - CORS debugging output"
echo "   - Request logging"
echo "   - Any error messages"