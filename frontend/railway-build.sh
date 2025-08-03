#!/bin/bash
set -e

echo "🔧 Railway Frontend Build Script"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Clean install
echo "📦 Installing dependencies..."
npm install --prefer-offline --no-audit --progress=false --legacy-peer-deps

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Build completed successfully!"