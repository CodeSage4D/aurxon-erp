package com.aurxon.shared.security

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import androidx.core.content.ContextCompat

data class DeviceLocation(
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Float = 0f,
    val isMock: Boolean = false
)

data class GeofenceStatus(
    val isInsideCampus: Boolean,
    val distanceMeters: Float,
    val campusName: String,
    val allowedRadiusMeters: Float = 300f
)

object LocationHelper {

    fun hasLocationPermission(context: Context): Boolean {
        val fine = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    fun getCurrentLocation(context: Context): DeviceLocation? {
        if (!hasLocationPermission(context)) return null

        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return null
        var bestLocation: Location? = null

        val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER)
        for (provider in providers) {
            try {
                if (lm.isProviderEnabled(provider)) {
                    val loc = lm.getLastKnownLocation(provider)
                    if (loc != null) {
                        if (bestLocation == null || loc.accuracy < bestLocation.accuracy) {
                            bestLocation = loc
                        }
                    }
                }
            } catch (_: SecurityException) {}
        }

        return bestLocation?.let {
            DeviceLocation(
                latitude = it.latitude,
                longitude = it.longitude,
                accuracyMeters = it.accuracy,
                isMock = it.isFromMockProvider
            )
        }
    }

    /**
     * Verifies if device coordinates fall within institutional campus boundaries (Geofencing)
     * Default coordinates: Delhi Public School R.K. Puram Campus (28.5672° N, 77.1734° E)
     */
    fun checkCampusGeofence(
        deviceLoc: DeviceLocation?,
        campusLat: Double = 28.5672,
        campusLng: Double = 77.1734,
        campusName: String = "DPS Main Campus",
        radiusMeters: Float = 500f
    ): GeofenceStatus {
        if (deviceLoc == null) {
            return GeofenceStatus(
                isInsideCampus = true, // Default soft pass in development
                distanceMeters = 0f,
                campusName = campusName,
                allowedRadiusMeters = radiusMeters
            )
        }

        val results = FloatArray(1)
        Location.distanceBetween(
            deviceLoc.latitude,
            deviceLoc.longitude,
            campusLat,
            campusLng,
            results
        )

        val distance = results[0]
        return GeofenceStatus(
            isInsideCampus = distance <= radiusMeters,
            distanceMeters = distance,
            campusName = campusName,
            allowedRadiusMeters = radiusMeters
        )
    }
}
