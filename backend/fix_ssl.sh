#!/bin/bash

# Fix SSL certificate issues on macOS for Python
echo "🔧 Fixing SSL certificate issues on macOS..."

# Update certificates
echo "📥 Updating certificates..."
if command -v /Applications/Python\ 3.11/Install\ Certificates.command &> /dev/null; then
    echo "Running Python certificate installer..."
    /Applications/Python\ 3.11/Install\ Certificates.command
elif command -v python3.11 &> /dev/null; then
    echo "Installing certificates via pip..."
    python3.11 -m pip install --upgrade certifi
fi

# Set environment variables
echo "🌍 Setting SSL environment variables..."
export SSL_CERT_FILE=$(python3 -m certifi)
export REQUESTS_CA_BUNDLE=$(python3 -m certifi)

echo "✅ SSL certificate fix applied!"
echo "💡 If you still have SSL issues, try running:"
echo "   pip install --upgrade certifi"
echo "   pip install --upgrade urllib3"