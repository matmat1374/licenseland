#!/bin/bash
# Secure auto-push to GitHub — token is read from .github-token (never committed)
# Usage: bash scripts/git-push.sh "commit message"

set -e
cd /home/z/my-project

TOKEN=$(cat .github-token)
REPO="matmat1374/licenseland"

# Configure remote with token (temporary, for this push only)
git remote set-url origin "https://matmat1374:${TOKEN}@github.com/${REPO}.git"

# Stage all changes (except secrets — .gitignore blocks them)
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
  echo "No changes to push."
  git remote set-url origin "https://github.com/${REPO}.git"
  exit 0
fi

# Commit with timestamp
MSG="${1:-auto: update $(date +%Y-%m-%d_%H:%M)}"
git commit -m "$MSG"

# Push
git push origin main

# CRITICAL: remove token from remote URL immediately after push
git remote set-url origin "https://github.com/${REPO}.git"

echo "✓ Pushed to GitHub: $MSG"
