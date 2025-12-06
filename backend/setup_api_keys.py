#!/usr/bin/env python3
"""
QuickFlip AI API Key Setup Script

This script helps you configure the necessary API keys for the QuickFlip AI system.
"""

import os
import sys
from pathlib import Path

def setup_api_keys():
    """Interactive setup for API keys"""
    
    print("🚀 QuickFlip AI API Key Setup")
    print("=" * 50)
    print()
    
    # Check if .env file exists
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env file not found. Please run 'cp env.example .env' first.")
        return False
    
    print("📋 Required API Keys:")
    print("1. OpenAI API Key - For AI-powered car analysis and listing generation")
    print("2. Gemini API Key - For market intelligence and pricing analysis")
    print()
    
    # Read current .env file
    with open(env_file, 'r') as f:
        env_content = f.read()
    
    # Get OpenAI API Key
    print("🔑 Step 1: OpenAI API Key")
    print("   Get your API key from: https://platform.openai.com/api-keys")
    openai_key = input("   Enter your OpenAI API key (or press Enter to skip): ").strip()
    
    if openai_key:
        env_content = env_content.replace("OPENAI_API_KEY=your-openai-api-key-here", f"OPENAI_API_KEY={openai_key}")
        print("   ✅ OpenAI API key configured")
    else:
        print("   ⚠️  Skipping OpenAI API key")
    
    print()
    
    # Get Gemini API Key
    print("🔑 Step 2: Gemini API Key")
    print("   Get your API key from: https://makersuite.google.com/app/apikey")
    gemini_key = input("   Enter your Gemini API key (or press Enter to skip): ").strip()
    
    if gemini_key:
        env_content = env_content.replace("GEMINI_API_KEY=your-gemini-api-key-here", f"GEMINI_API_KEY={gemini_key}")
        print("   ✅ Gemini API key configured")
    else:
        print("   ⚠️  Skipping Gemini API key")
    
    print()
    
    # Write updated .env file
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print("✅ Configuration complete!")
    print()
    print("📝 Next steps:")
    print("1. Restart your backend server to load the new API keys")
    print("2. Test the car listing generation endpoint")
    print("3. Access the frontend at http://localhost:3000")
    
    return True

def test_api_keys():
    """Test if API keys are working"""
    print("🧪 Testing API Keys...")
    print()
    
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if openai_key and openai_key != "your-openai-api-key-here":
        print("✅ OpenAI API key is configured")
    else:
        print("❌ OpenAI API key is not configured")
    
    if gemini_key and gemini_key != "your-gemini-api-key-here":
        print("✅ Gemini API key is configured")
    else:
        print("❌ Gemini API key is not configured")
    
    print()
    
    if (openai_key and openai_key != "your-openai-api-key-here") or \
       (gemini_key and gemini_key != "your-gemini-api-key-here"):
        print("🎉 Ready to generate AI-powered car listings!")
    else:
        print("⚠️  Please configure at least one API key to use AI features")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_api_keys()
    else:
        setup_api_keys() 