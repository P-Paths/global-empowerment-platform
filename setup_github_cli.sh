#!/bin/bash
# Setup GitHub CLI for easy authentication

cd /home/eaton/code/GEP

echo "🔧 Setting up GitHub CLI"
echo "========================"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "📦 GitHub CLI not found. Installing..."
    echo ""
    
    # Detect OS and install
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux (WSL/Ubuntu)
        if command -v apt-get &> /dev/null; then
            echo "Installing via apt..."
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update
            sudo apt install gh -y
        else
            echo "Please install GitHub CLI manually:"
            echo "Visit: https://cli.github.com/manual/installation"
            exit 1
        fi
    else
        echo "Please install GitHub CLI manually:"
        echo "Visit: https://cli.github.com/manual/installation"
        exit 1
    fi
fi

echo "✅ GitHub CLI is installed!"
echo ""

# Authenticate with GitHub
echo "🔐 Authenticating with GitHub..."
echo "This will open a browser window for you to sign in."
echo ""
gh auth login

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Authentication successful!"
    echo ""
    
    # Configure git to use gh for authentication
    echo "📝 Configuring git to use GitHub CLI..."
    gh auth setup-git
    
    # Change remote to HTTPS (gh handles auth automatically)
    echo ""
    echo "📝 Setting remote URL..."
    git remote set-url origin https://github.com/P-Paths/global-empowerment-platform.git
    
    echo ""
    echo "✅ All set up!"
    echo ""
    echo "🚀 You can now push with:"
    echo "   git push origin main"
    echo ""
    echo "GitHub CLI will handle authentication automatically!"
else
    echo ""
    echo "❌ Authentication failed. Please try again."
    exit 1
fi
