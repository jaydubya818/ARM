#!/bin/bash

echo "🔧 Fixing Docker PATH..."

# Add Docker to PATH
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo ""
    echo "❌ Docker Desktop is not running yet"
    echo ""
    echo "Please:"
    echo "1. Check your menu bar for the whale icon (Docker Desktop)"
    echo "2. If you don't see it, open Docker Desktop: open -a Docker"
    echo "3. Wait for the whale icon to show (may take 30-60 seconds)"
    echo "4. Run this script again: ./fix-docker-path.sh"
    exit 1
fi

echo "✅ Docker is running!"
echo ""
echo "Now running setup..."
echo ""

./quick-start.sh
