# AURXON EDUVAULT — Native Android Mobile Platform

This workspace contains the native Android application foundations for **AURXON EDUVAULT** (*The Education Operating Platform*).

---

## 1. Product Architecture

The mobile workspace is structured into two native Android applications and a shared library:

```
android/
├── shared/            # Common domain models, API client, and session security
├── AURXON_EDU/        # Parent & Student Native Android Application
├── AURXON_STAFF/      # Teacher, Faculty, Management & Admin Native Application
├── settings.gradle.kts
├── build.gradle.kts
├── gradle.properties
└── README.md
```

### Applications Overview

1. **AURXON EDU (`com.aurxon.edu`)**
   - **Target Users**: Parents, Students
   - **Core Scope**: Attendance tracking, fee payments, report cards, class schedules, bus tracking, library books, leave applications.
   - **Min SDK**: 24 (Android 7.0) | **Target SDK**: 35 (Android 15)

2. **AURXON STAFF (`com.aurxon.staff`)**
   - **Target Users**: Teachers, Faculty, Principals, HODs, Accountants, HR Managers, Administrators
   - **Core Scope**: Daily class attendance, exam marks entry, leave approvals, fee collection, student profiles, substitutions.
   - **Min SDK**: 24 (Android 7.0) | **Target SDK**: 35 (Android 15)

---

## 2. Toolchain & Environment Specifications

- **JDK Version**: OpenJDK / Eclipse Temurin 21.0.4 (`/home/karann/.jdks/jdk-21.0.4+7`)
- **Android SDK Path**: `/home/karann/Android/Sdk`
- **Android SDK Platform**: `android-35` (API Level 35)
- **Build Tools**: `35.0.0`
- **Gradle Version**: Gradle 8.7 (via Gradle Wrapper `./gradlew`)
- **Android Gradle Plugin (AGP)**: 8.5.2
- **Kotlin Version**: 1.9.24
- **UI Framework**: Jetpack Compose (`androidx.compose.bom:2024.06.00`, Material 3)

---

## 3. Build & CLI Commands

All build operations must be executed using the Gradle Wrapper from the `android/` directory:

```bash
# Set environment variables
export JAVA_HOME=/home/karann/.jdks/jdk-21.0.4+7
export ANDROID_HOME=/home/karann/Android/Sdk
export PATH=$JAVA_HOME/bin:$PATH

# Check Gradle Wrapper & JVM environment
./gradlew --version

# Build Debug APKs for both AURXON EDU and AURXON STAFF
./gradlew assembleDebug

# Build specific app
./gradlew :AURXON_EDU:assembleDebug
./gradlew :AURXON_STAFF:assembleDebug
```

---

## 4. Output APK Artifact Locations

- **AURXON EDU Debug APK**:
  `android/AURXON_EDU/build/outputs/apk/debug/AURXON_EDU-debug.apk` (Size: 7.6 MB)
- **AURXON STAFF Debug APK**:
  `android/AURXON_STAFF/build/outputs/apk/debug/AURXON_STAFF-debug.apk` (Size: 7.6 MB)

---

## 5. API Backend Connectivity & Security Rules

- **Development Base URL**: `http://10.0.2.2:3000/api/v1` (Android Emulator loopback to local Next.js server)
- **Staging Base URL**: `https://staging.aurxon.io/api/v1`
- **Production Base URL**: `https://aurxon.io/api/v1`

### Security Standards
1. **Server Authoritative**: All business rules (fees, permissions, attendance locks) remain strictly enforced by the backend API.
2. **Secure Token Storage**: Passwords are never stored on device. Session state is managed via secure token authentication (`SessionManager.kt`).
3. **No TLS Bypass**: Insecure HTTP bypass is prohibited in release builds. HTTPS with valid TLS certificates is mandatory.
