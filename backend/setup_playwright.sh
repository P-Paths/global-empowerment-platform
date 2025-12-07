#!/bin/bash
# Setup script for Playwright browsers
# Usage: ./setup_playwright.sh

set -e

echo "🎭 Setting up Playwright browsers..."

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found. Please create it first:"
    echo "   python3 -m venv .venv"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source .venv/bin/activate

# Check if Playwright is installed
echo "🔍 Checking Playwright installation..."
if ! python -c "import playwright" 2>/dev/null; then
    echo "📥 Installing Playwright..."
    pip install playwright==1.40.0
else
    echo "✅ Playwright already installed"
fi

# Install Chromium browser
echo "🌐 Installing Chromium browser..."
python -m playwright install chromium

echo ""
echo "✅ Playwright setup complete!"
echo ""
echo "To verify installation, run:"
echo "   source .venv/bin/activate"
echo "   python -c \"from playwright.async_api import async_playwright; print('✅ Playwright ready')\""

