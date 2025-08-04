#!/bin/bash

# Railway Frontend Testing Script
# Replace YOUR_FRONTEND_URL with your actual Railway frontend URL

FRONTEND_URL="https://your-frontend-url.railway.app"

echo "🧪 Testing Railway Frontend Deployment"
echo "======================================"

echo ""
echo "1. Testing frontend homepage..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$response" = "200" ]; then
    echo "✅ Frontend homepage accessible (HTTP $response)"
else
    echo "❌ Frontend homepage failed (HTTP $response)"
fi

echo ""
echo "2. Testing frontend content..."
content=$(curl -s "$FRONTEND_URL" | grep -o "<title>.*</title>")
if [[ "$content" == *"Cosynq"* ]]; then
    echo "✅ Frontend content loads correctly: $content"
else
    echo "❌ Frontend content not loading properly"
fi

echo ""
echo "3. Testing CORS headers..."
cors_header=$(curl -s -I "$FRONTEND_URL" | grep -i "access-control-allow-origin" || echo "No CORS header found")
echo "🔍 CORS header: $cors_header"

echo ""
echo "4. Testing static assets..."
assets_response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/assets/")
echo "🔍 Assets directory response: HTTP $assets_response"

echo ""
echo "5. Testing React app bootstrap..."
if curl -s "$FRONTEND_URL" | grep -q "root"; then
    echo "✅ React app div#root found in HTML"
else
    echo "❌ React app div#root not found"
fi

echo ""
echo "✅ Testing complete!"
echo ""
echo "🔍 If issues persist, check Railway logs for:"
echo "   - Server startup messages"
echo "   - Port binding confirmations"
echo "   - Any 'Blocked request' errors"
echo "   - Vite preview server status"