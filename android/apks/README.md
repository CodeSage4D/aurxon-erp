# AURXON EDUVAULT — Mobile Application Binaries & Deployment Guide

This directory holds the native Android build artifacts for the AURXON EDUVAULT mobile ecosystem.

---

## 1. Application Packages

| App | Package Name | APK File | Size | Target Audience | Key Features |
|---|---|---|---|---|---|
| **AURXON EDU** | `com.aurxon.edu` | [`AURXON_EDU_v1.0.apk`](file:///home/karann/Documents/ERP/SchoolERP/android/apks/AURXON_EDU_v1.0.apk) | ~7.9 MB | Parents & Students | Branded login, Multi-ward switching, Fee ledger, Live GPS transit telemetry, Biometric Fingerprint & PIN unlock |
| **AURXON STAFF** | `com.aurxon.staff` | [`AURXON_STAFF_v1.0.apk`](file:///home/karann/Documents/ERP/SchoolERP/android/apks/AURXON_STAFF_v1.0.apk) | ~7.9 MB | Teachers, Principals, Staff | Roll-call attendance with GPS campus geofence validation, SIS rosters, Medical leave approvals, Biometric Fingerprint & PIN unlock |

---

## 2. Quick Clean Reinstallation on Device

An automated installation script is provided in the `android/` root:

```bash
cd android
./clean_reinstall.sh
```

### What `clean_reinstall.sh` Does:
1. **Uninstalls Existing Versions**: Removes `com.aurxon.edu` and `com.aurxon.staff` from your device to clear any stale cache or old app state.
2. **Fresh APK Installation**: Installs the latest `AURXON_EDU_v1.0.apk` and `AURXON_STAFF_v1.0.apk`.
3. **Auto-grants Permissions**: Automatically grants `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, and Biometric access.

---

## 3. Manual Installation Commands

### If using USB or Wireless ADB:
```bash
# 1. Check your connected device
adb devices

# 2. Uninstall older builds
adb uninstall com.aurxon.edu
adb uninstall com.aurxon.staff

# 3. Install latest builds
adb install -r -d android/apks/AURXON_EDU_v1.0.apk
adb install -r -d android/apks/AURXON_STAFF_v1.0.apk

# 4. Grant runtime GPS permissions
adb shell pm grant com.aurxon.edu android.permission.ACCESS_FINE_LOCATION
adb shell pm grant com.aurxon.staff android.permission.ACCESS_FINE_LOCATION
```

---

## 4. Testing on Other Android Devices

To test on another physical phone or tablet:
1. Copy `AURXON_EDU_v1.0.apk` and `AURXON_STAFF_v1.0.apk` to the target device (via USB file transfer, Google Drive, WhatsApp, or local share).
2. Tap the APK file on your device to install (allow *"Install from unknown sources"* if prompted).
3. Open the app and log in using the demo credentials below.

---

## 5. Seeded Demo Accounts (Password: `Password@123`)

| Role | Email | App to Use |
|---|---|---|
| **Principal** | `principal.rkp@dps-society.edu` | AURXON STAFF |
| **Teacher** | `teacher.math@dps-society.edu` | AURXON STAFF |
| **Accountant** | `accountant@dps-society.edu` | AURXON STAFF |
| **Parent** | `parent.aarav@gmail.com` | AURXON EDU |
| **Student** | `student.aarav@dps-society.edu` | AURXON EDU |

---

## 6. Hardware & Security Features

* **Biometric Fingerprint**: Tap *"Unlock with Biometrics"* on the login screen to authenticate via the device's fingerprint sensor.
* **4-Digit Quick PIN**: Tap *"Use Quick 4-Digit PIN"* to set up and use a secure 4-digit PIN for rapid authentication.
* **GPS Geofence**: Verifies campus presence (300m radius) when teachers mark student attendance, and displays real-time transit telemetry on the parent home screen.
* **Cloud Failover**: Configured to connect to `https://aurxon-erp.vercel.app/api/v1` with automatic fallback to `https://aurxon-erp.netlify.app/api/v1`.
