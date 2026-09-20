#!/usr/bin/env bash
set -e

echo "============================================================"
echo "AURXON EDUVAULT MOBILE ECOSYSTEM — S23 DEVICE DEPLOYER"
echo "============================================================"

# Ensure ADB is in PATH
export PATH="/home/karann/Android/Sdk/platform-tools:$PATH"

echo "[1/4] Checking attached Android device..."
DEVICES=$(adb devices | grep -v "List of devices attached" | grep "device" || true)

if [ -z "$DEVICES" ]; then
    echo "⚠️ No authorized Android device detected by ADB."
    echo ""
    echo "👉 On your Samsung Galaxy S23 5G:"
    echo "   1. Connect via USB-C cable."
    echo "   2. Unlock phone screen."
    echo "   3. Pull down notification shade -> Tap USB mode -> Select 'Transferring files / Android Auto'."
    echo "   4. In Settings -> Developer Options -> Turn ON 'USB debugging'."
    echo "   5. When prompted on screen: 'Allow USB debugging?' -> Check 'Always allow' and tap 'Allow'."
    echo ""
    echo "Waiting for device to connect..."
    adb wait-for-device
fi

echo "✅ Device detected:"
adb devices -l

EDU_APK="/home/karann/Documents/ERP/SchoolERP/android/AURXON_EDU/build/outputs/apk/debug/AURXON_EDU-debug.apk"
STAFF_APK="/home/karann/Documents/ERP/SchoolERP/android/AURXON_STAFF/build/outputs/apk/debug/AURXON_STAFF-debug.apk"

echo ""
echo "[2/4] Installing AURXON EDU (com.aurxon.edu)..."
adb install -r -d -g "$EDU_APK"
echo "✅ AURXON EDU installed successfully!"

echo ""
echo "[3/4] Installing AURXON STAFF (com.aurxon.staff)..."
adb install -r -d -g "$STAFF_APK"
echo "✅ AURXON STAFF installed successfully!"

echo ""
echo "[4/4] Launching AURXON EDU on device..."
adb shell am start -n com.aurxon.edu/com.aurxon.edu.MainActivity

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Both AURXON EDU and AURXON STAFF are installed and ready on your Samsung Galaxy S23."
echo "Connected live to ERP backend at: https://aurxon-erp.vercel.app/api/v1 (fallback: netlify)"
