package com.aurxon.shared.security

import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.biometrics.BiometricPrompt
import android.os.Build
import android.os.CancellationSignal

object BiometricHelper {

    fun isBiometricSupported(context: Context): Boolean {
        val pm = context.packageManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pm.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)
        } else {
            false
        }
    }

    fun authenticate(
        activity: Activity,
        title: String = "Biometric Verification",
        subtitle: String = "Scan your fingerprint to unlock",
        description: String = "Confirm your identity with AURXON EduOS security",
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val cancellationSignal = CancellationSignal()
            val executor = activity.mainExecutor

            val prompt = BiometricPrompt.Builder(activity)
                .setTitle(title)
                .setSubtitle(subtitle)
                .setDescription(description)
                .setNegativeButton("Use PIN / Password", executor) { _, _ ->
                    onError("User chose password/PIN unlock")
                }
                .build()

            prompt.authenticate(
                cancellationSignal,
                executor,
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult?) {
                        super.onAuthenticationSucceeded(result)
                        activity.runOnUiThread { onSuccess() }
                    }

                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence?) {
                        super.onAuthenticationError(errorCode, errString)
                        activity.runOnUiThread {
                            onError(errString?.toString() ?: "Biometric error: $errorCode")
                        }
                    }

                    override fun onAuthenticationFailed() {
                        super.onAuthenticationFailed()
                        activity.runOnUiThread {
                            onError("Fingerprint not recognized. Please try again.")
                        }
                    }
                }
            )
        } else {
            onError("Biometric authentication requires Android 9.0 or higher")
        }
    }
}
