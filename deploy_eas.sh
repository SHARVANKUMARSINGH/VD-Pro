#!/usr/bin/env bash
# ==============================================================================
# deploy_eas.sh
#
# Expo Application Services (EAS) Deployment & Cloud Build Script for VDPro.
# Supports:
# 1. Android Preview Standalone APK (Install directly on phone for testing)
# 2. Android Production App Bundle (.aab for Google Play Store)
# 3. iOS Preview / Production Builds
# 4. EAS OTA (Over-the-Air) Instantaneous Updates
# ==============================================================================

set -e

# ANSI Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}      📦 VDPro - Expo EAS Cloud Build & Deploy        ${NC}"
echo -e "${CYAN}======================================================${NC}"

# 1. Determine EAS CLI runner
if command -v eas &> /dev/null; then
  EAS_CMD="eas"
else
  EAS_CMD="npx --yes eas-cli@latest"
fi

echo -e "${GREEN}Using EAS command:${NC} $EAS_CMD"

# 2. Check eas.json
if [ ! -f "eas.json" ]; then
  echo -e "${RED}[Error] eas.json not found in $(pwd)!${NC}"
  exit 1
fi

# 3. Check Authentication with Expo
echo -e "${GREEN}[1/3] Checking Expo EAS credentials...${NC}"

if [ -n "$EXPO_TOKEN" ]; then
  echo -e "${GREEN}✓ Using EXPO_TOKEN from environment.${NC}"
else
  WHOAMI_OUT=$($EAS_CMD whoami 2>/dev/null || true)
  if [ -z "$WHOAMI_OUT" ]; then
    echo -e "${YELLOW}Not logged in to Expo. Launching authentication...${NC}"
    echo -e "You can authenticate by running: ${CYAN}$EAS_CMD login${NC} or setting ${CYAN}export EXPO_TOKEN='your-token'${NC}"
    $EAS_CMD login || {
      echo -e "${RED}[Error] Expo login failed or cancelled.${NC}"
      exit 1
    }
  else
    echo -e "${GREEN}✓ Logged in as: ${CYAN}${WHOAMI_OUT}${NC}"
  fi
fi

# 4. Initialize EAS Project if needed
echo -e "${GREEN}[2/3] Verifying EAS project link in app.json...${NC}"
if ! grep -q '"projectId"' app.json 2>/dev/null; then
  echo -e "${YELLOW}Linking project to Expo cloud registry...${NC}"
  $EAS_CMD project:init || true
fi

# 5. Determine Build Target & Profile
PLATFORM="${EAS_PLATFORM:-}"
PROFILE="${EAS_PROFILE:-}"

if [ -z "$PLATFORM" ] || [ -z "$PROFILE" ]; then
  echo ""
  echo -e "${CYAN}Select Deployment Action:${NC}"
  echo "  1) Android Preview APK (Directly installable on any Android phone)"
  echo "  2) Android Production AAB (Google Play Store release bundle)"
  echo "  3) iOS Preview (Ad-Hoc / internal distribution)"
  echo "  4) iOS Production (Apple App Store release)"
  echo "  5) Dual Platform Preview (Android APK + iOS build)"
  echo "  6) EAS OTA Update (Instant JavaScript / asset update without rebuild)"
  echo ""
  read -r -p "Enter choice [1-6] (default: 1): " CHOICE
  CHOICE=${CHOICE:-1}

  case $CHOICE in
    1)
      PLATFORM="android"
      PROFILE="preview"
      ;;
    2)
      PLATFORM="android"
      PROFILE="production"
      ;;
    3)
      PLATFORM="ios"
      PROFILE="preview"
      ;;
    4)
      PLATFORM="ios"
      PROFILE="production"
      ;;
    5)
      PLATFORM="all"
      PROFILE="preview"
      ;;
    6)
      PLATFORM="update"
      PROFILE="production"
      ;;
    *)
      echo -e "${YELLOW}Invalid option, defaulting to Android Preview APK...${NC}"
      PLATFORM="android"
      PROFILE="preview"
      ;;
  esac
fi

# 6. Execute Build or Update
echo -e "${GREEN}[3/3] Triggering EAS operation: ${CYAN}Platform=${PLATFORM}, Profile=${PROFILE}${NC}"

if [ "$PLATFORM" = "update" ]; then
  echo -e "${CYAN}Publishing instant Over-The-Air (OTA) update via EAS Update...${NC}"
  $EAS_CMD update --branch production --message "Update deployed via deploy_eas.sh"
  echo -e "${GREEN}✓ OTA Update successfully published to production branch!${NC}"
else
  echo -e "${CYAN}Starting EAS cloud build... (logs will stream below)${NC}"
  $EAS_CMD build --platform "$PLATFORM" --profile "$PROFILE" --non-interactive
  echo ""
  echo -e "${GREEN}======================================================${NC}"
  echo -e "${GREEN}   🎉 EAS Build Dispatched Successfully!${NC}"
  echo -e "${GREEN}   Track build progress and download APK in Expo dashboard:${NC}"
  echo -e "${CYAN}   https://expo.dev/accounts/[your-account]/projects/vdpro/builds${NC}"
  echo -e "${GREEN}======================================================${NC}"
fi
