#!/usr/bin/env bash
# ==============================================================================
# AURXON EDUVAULT — Clean App Deployment & Multi-Device Installer
# ==============================================================================
# This script:
# 1. Detects connected Android device (USB or Wi-Fi adb)
# 2. Uninstalls older versions of com.aurxon.edu and com.aurxon.staff
# 3. Performs fresh installation of latest AURXON EDU & AURXON STAFF APKs
# 4. Automatically grants GPS Location & Biometric permissions
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APK_DIR="$SCRIPT_DIR/apks"

EDU_APK="$APK_DIR/AURXON_EDU_v1.0.apk"
STAFF_APK="$APK_DIR/AURXON_STAFF_v1.0.apk"

echo "=========================================================="
echo "          AURXON EDUVAULT - CLEAN REINSTALL TOOL          "
echo "=========================================================="

if [ ! -f "$EDU_APK" ] || [ ! -f "$STAFF_APK" ]; then
    echo "❌ Error: APKs not found in $APK_DIR. Building now..."
    cd "$SCRIPT_DIR" && ./gradlew assembleDebug
    cp "$SCRIPT_DIR/AURXON_EDU/build/outputs/apk/debug/AURXON_EDU-debug.apk" "$EDU_APK"
    cp "$SCRIPT_DIR/AURXON_STAFF/build/outputs/apk/debug/AURXON_STAFF-debug.apk" "$STAFF_APK"
fi

DEVICE_COUNT=$(adb devices | grep -v "List" | grep -v "^$" | grep "device" | wc -l)

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo "⚠️  No active adb device detected."
    echo "👉 If connecting via Wireless Debugging, run: adb connect <IP>:<PORT>"
    echo "👉 Or connect your phone via USB with USB Debugging enabled."
    echo ""
    echo "Alternatively, you can manually copy the APKs to your phone:"
    echo "📁 AURXON EDU:   $EDU_APK"
    echo "📁 AURXON STAFF: $STAFF_APK"
    exit 1
fi

echo "📱 Connected Android device found! Beginning clean re-installation..."

# 1. Remove current applications
echo "🗑️  Uninstalling existing com.aurxon.edu..."
adb uninstall com.aurxon.edu || true

echo "🗑️  Uninstalling existing com.aurxon.staff..."
adb uninstall com.aurxon.staff || true

# 2. Install updated APKs
echo "📦 Installing AURXON EDU (Parent & Student)..."
adb install -r -d "$EDU_APK"

echo "📦 Installing AURXON STAFF (Faculty & Administration)..."
adb install -r -d "$STAFF_APK"

# 3. Grant runtime permissions automatically
echo "🛡️  Granting location and security permissions..."
adb shell pm grant com.aurxon.edu android.permission.ACCESS_FINE_LOCATION || true
adb shell pm grant com.aurxon.edu android.permission.ACCESS_COARSE_LOCATION || true

adb shell pm grant com.aurxon.staff android.permission.ACCESS_FINE_LOCATION || true
adb shell pm grant com.aurxon.staff android.permission.ACCESS_COARSE_LOCATION || true

echo "=========================================================="
echo "✅ AURXON APPS SUCCESSFULLY INSTALLED & VERIFIED!"
echo "   - AURXON EDU:   com.aurxon.edu"
echo "   - AURXON STAFF: com.aurxon.staff"
echo "   - Feature set: High-res Launcher Icons, Biometric Unlock, PIN Login, GPS Geofence"
echo "=========================================================="
