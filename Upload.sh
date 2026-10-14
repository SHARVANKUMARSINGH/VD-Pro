#!/usr/bin/env bash
# ==============================================================================
# github_upload.sh (also available as Upload.sh / upload.sh)
#
# Automates:
# 1. Initializing Git repository with main branch in /workspace/vd-pro
# 2. Creating a new GitHub repository named "VD-Pro" (or custom name)
#    - via GitHub CLI (`gh`) if logged in
#    - via GitHub REST API (Personal Access Token) if gh is not installed
# 3. Adding remote origin, staging files, committing, and pushing to GitHub.
# ==============================================================================

set -e

REPO_NAME="${REPO_NAME:-VD-Pro}"
REPO_DESC="${REPO_DESC:-VDPro - Professional Autonomous AI Video Editor & Director Studio (Expo SDK 57 / React Native)}"
REPO_VISIBILITY="${REPO_VISIBILITY:-public}" # public or private
BRANCH_NAME="${BRANCH_NAME:-main}"

# ANSI Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}   🚀 GitHub Repository Setup & Upload for '${REPO_NAME}'${NC}"
echo -e "${CYAN}======================================================${NC}"

# 1. Ensure Git is installed
if ! command -v git &> /dev/null; then
  echo -e "${RED}[Error] git is not installed. Please install git first.${NC}"
  exit 1
fi

# 2. Configure Git User if not set
GIT_USER_NAME=$(git config --get user.name || true)
GIT_USER_EMAIL=$(git config --get user.email || true)

if [ -z "$GIT_USER_NAME" ]; then
  DEFAULT_NAME="${GITHUB_USERNAME:-PocketDev-Developer}"
  echo -e "${YELLOW}[Notice] Git user.name not set. Configuring as '${DEFAULT_NAME}'...${NC}"
  git config user.name "$DEFAULT_NAME"
fi

if [ -z "$GIT_USER_EMAIL" ]; then
  DEFAULT_EMAIL="developer@pocketdev.io"
  echo -e "${YELLOW}[Notice] Git user.email not set. Configuring as '${DEFAULT_EMAIL}'...${NC}"
  git config user.email "$DEFAULT_EMAIL"
fi

# 3. Initialize Git if not initialized
if [ ! -d ".git" ]; then
  echo -e "${GREEN}[1/4] Initializing git repository with default branch '${BRANCH_NAME}'...${NC}"
  git init
  git checkout -b "$BRANCH_NAME" 2>/dev/null || git branch -m "$BRANCH_NAME" 2>/dev/null || true
else
  echo -e "${GREEN}[1/4] Git repository already initialized.${NC}"
  # Ensure branch name is main
  CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "$BRANCH_NAME")
  if [ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]; then
    git branch -m "$BRANCH_NAME" 2>/dev/null || true
  fi
fi

# 4. Stage and commit files
echo -e "${GREEN}[2/4] Staging and committing project files...${NC}"
git add .

if git diff --staged --quiet; then
  echo -e "${YELLOW}No changes to commit (working tree clean).${NC}"
else
  git commit -m "Initial commit: VDPro Autonomous AI Video Editor Studio" || true
fi

# 5. Create GitHub Repository
echo -e "${GREEN}[3/4] Preparing GitHub repository '${REPO_NAME}'...${NC}"

CREATED_REMOTE_URL=""

# Option A: Check if GitHub CLI (gh) is available and authenticated
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
  echo -e "${CYAN}Using authenticated GitHub CLI (gh)...${NC}"
  VISIBILITY_FLAG="--public"
  if [ "$REPO_VISIBILITY" = "private" ]; then
    VISIBILITY_FLAG="--private"
  fi

  echo "Creating repository on GitHub via gh..."
  gh repo create "$REPO_NAME" $VISIBILITY_FLAG --description "$REPO_DESC" --source=. --remote=origin --push || {
    echo -e "${YELLOW}Repo might already exist on GitHub, checking remote origin...${NC}"
  }
  CREATED_REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)

# Option B: Use GitHub REST API with GITHUB_TOKEN or prompt
else
  echo -e "${YELLOW}GitHub CLI (gh) not logged in. Using GitHub REST API...${NC}"

  # Check for token in environment or prompt
  TOKEN="${GITHUB_TOKEN:-}"
  if [ -z "$TOKEN" ]; then
    echo ""
    echo -e "${CYAN}To create and push to GitHub, a Personal Access Token (PAT) is required.${NC}"
    echo -e "You can create one at: ${YELLOW}https://github.com/settings/tokens/new${NC} (select 'repo' scope)."
    echo ""
    read -r -p "Enter your GitHub Personal Access Token (or GITHUB_TOKEN): " TOKEN
  fi

  if [ -z "$TOKEN" ]; then
    echo -e "${RED}[Error] No GitHub token provided. Cannot create remote repository.${NC}"
    echo "Tip: Set export GITHUB_TOKEN='ghp_xxxx' and rerun this script."
    exit 1
  fi

  # Fetch GitHub authenticated user details
  USER_RESPONSE=$(curl -s -H "Authorization: token $TOKEN" https://api.github.com/user)
  GH_USER=$(echo "$USER_RESPONSE" | grep -o '"login": *"[^"]*"' | head -n 1 | cut -d '"' -f 4)

  if [ -z "$GH_USER" ]; then
    echo -e "${RED}[Error] Failed to authenticate with GitHub API using provided token.${NC}"
    echo "$USER_RESPONSE"
    exit 1
  fi

  echo -e "${GREEN}Authenticated as GitHub user: ${CYAN}${GH_USER}${NC}"

  IS_PRIVATE="false"
  if [ "$REPO_VISIBILITY" = "private" ]; then
    IS_PRIVATE="true"
  fi

  # Call GitHub API to create repository
  API_PAYLOAD=$(cat <<EOF
{
  "name": "${REPO_NAME}",
  "description": "${REPO_DESC}",
  "private": ${IS_PRIVATE},
  "has_issues": true,
  "has_projects": true,
  "has_wiki": false
}
EOF
)

  echo -e "Creating GitHub repository '${GH_USER}/${REPO_NAME}'..."
  CREATE_RES=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/user/repos \
    -d "$API_PAYLOAD")

  HTTP_CODE=$(echo "$CREATE_RES" | tail -n 1)
  BODY=$(echo "$CREATE_RES" | sed '$d')

  if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Successfully created GitHub repository '${GH_USER}/${REPO_NAME}'!${NC}"
  elif [ "$HTTP_CODE" = "422" ]; then
    echo -e "${YELLOW}[Notice] Repository '${GH_USER}/${REPO_NAME}' already exists on GitHub. Linking to it...${NC}"
  else
    echo -e "${YELLOW}API response (HTTP $HTTP_CODE):${NC}"
    echo "$BODY"
  fi

  REMOTE_URL="https://${TOKEN}@github.com/${GH_USER}/${REPO_NAME}.git"
  CLEAN_REMOTE_URL="https://github.com/${GH_USER}/${REPO_NAME}.git"

  # Configure git remote
  if git remote | grep -q "^origin$"; then
    git remote set-url origin "$REMOTE_URL"
  else
    git remote add origin "$REMOTE_URL"
  fi

  CREATED_REMOTE_URL="$CLEAN_REMOTE_URL"
fi

# 6. Push to GitHub
echo -e "${GREEN}[4/4] Pushing code to GitHub (${BRANCH_NAME})...${NC}"
git push -u origin "$BRANCH_NAME"

# Reset origin URL to clean URL without embedded token for security
if [ -n "$CREATED_REMOTE_URL" ]; then
  git remote set-url origin "$CREATED_REMOTE_URL" || true
fi

echo ""
echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}   🎉 Successfully Uploaded to GitHub!${NC}"
echo -e "${GREEN}   Repository: ${CYAN}${CREATED_REMOTE_URL}${NC}"
echo -e "${GREEN}   Branch:     ${CYAN}${BRANCH_NAME}${NC}"
echo -e "${GREEN}======================================================${NC}"
