#!/bin/sh
#
# Setup script to install Git hooks
# Run this once after cloning the repository

HOOKS_DIR=".git/hooks"
SOURCE_DIR="hooks"

echo "Installing Git hooks..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "Error: Not a git repository. Run this from the project root."
    exit 1
fi

# Copy pre-commit hook
if [ -f "$SOURCE_DIR/pre-commit" ]; then
    cp "$SOURCE_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
    chmod +x "$HOOKS_DIR/pre-commit"
    echo "✅ Installed pre-commit hook"
else
    echo "❌ pre-commit hook not found in $SOURCE_DIR"
    exit 1
fi

echo ""
echo "Git hooks installed successfully!"
echo "The pre-commit hook will now check for CACHE_NAME updates."
