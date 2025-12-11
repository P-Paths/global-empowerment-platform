#!/bin/bash
# Setup SSH authentication for GitHub (no token needed!)

cd /home/eaton/code/GEP

echo "🔑 Setting up SSH Authentication for GitHub"
echo "==========================================="
echo ""

# Check if SSH key exists
if [ -f ~/.ssh/id_ed25519 ] || [ -f ~/.ssh/id_rsa ]; then
    echo "✅ SSH key found!"
    if [ -f ~/.ssh/id_ed25519 ]; then
        KEY_FILE=~/.ssh/id_ed25519.pub
    else
        KEY_FILE=~/.ssh/id_rsa.pub
    fi
    echo ""
    echo "📋 Your public key:"
    cat $KEY_FILE
    echo ""
    echo "📝 Add this key to GitHub:"
    echo "   1. Go to: https://github.com/settings/keys"
    echo "   2. Click 'New SSH key'"
    echo "   3. Paste the key above"
    echo "   4. Click 'Add SSH key'"
    echo ""
    read -p "Have you added the key to GitHub? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please add the key first, then run this script again."
        exit 1
    fi
else
    echo "🔧 Generating SSH key..."
    echo ""
    read -p "Enter your GitHub email (preston@prestigiouspaths.com): " EMAIL
    EMAIL=${EMAIL:-preston@prestigiouspaths.com}
    
    ssh-keygen -t ed25519 -C "$EMAIL" -f ~/.ssh/id_ed25519 -N ""
    
    echo ""
    echo "✅ SSH key generated!"
    echo ""
    echo "📋 Your public key:"
    cat ~/.ssh/id_ed25519.pub
    echo ""
    echo "📝 Add this key to GitHub:"
    echo "   1. Go to: https://github.com/settings/keys"
    echo "   2. Click 'New SSH key'"
    echo "   3. Paste the key above"
    echo "   4. Click 'Add SSH key'"
    echo ""
    read -p "Have you added the key to GitHub? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please add the key first, then run this script again."
        exit 1
    fi
fi

# Test SSH connection
echo ""
echo "🧪 Testing SSH connection to GitHub..."
ssh -T git@github.com 2>&1 | head -3

# Change remote to SSH
echo ""
echo "📝 Changing remote URL to SSH..."
git remote set-url origin git@github.com:P-Paths/global-empowerment-platform.git

echo "✅ Remote configured to use SSH!"
echo ""
echo "🚀 You can now push without a token:"
echo "   git push origin main"
