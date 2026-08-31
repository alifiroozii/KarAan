package com.karvin.app.data.location

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.karvin.app.domain.model.LocationPoint
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationTracker @Inject constructor(
    @ApplicationContext private val context: Context
) {
    @SuppressLint("MissingPermission")
    fun getCurrentLocation(): Flow<LocationPoint> = callbackFlow {
        var dispatched = false

        // Try 1: Google Play Services Fused Location
        try {
            val fusedClient: FusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(context)
            fusedClient.getCurrentLocation(
                Priority.PRIORITY_BALANCED_POWER_ACCURACY,
                null
            ).addOnSuccessListener { location: Location? ->
                if (location != null) {
                    dispatched = true
                    trySend(
                        LocationPoint(
                            latitude = location.latitude,
                            longitude = location.longitude,
                            addressName = "موقعیت فعلی شما",
                            city = "تهران"
                        )
                    )
                } else {
                    fallbackToSystemLocationManager { locPoint ->
                        dispatched = true
                        trySend(locPoint)
                    }
                }
            }.addOnFailureListener {
                fallbackToSystemLocationManager { locPoint ->
                    dispatched = true
                    trySend(locPoint)
                }
            }
        } catch (t: Throwable) {
            fallbackToSystemLocationManager { locPoint ->
                dispatched = true
                trySend(locPoint)
            }
        }

        awaitClose { }
    }

    @SuppressLint("MissingPermission")
    private fun fallbackToSystemLocationManager(onResult: (LocationPoint) -> Unit) {
        try {
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            if (locationManager != null) {
                val gpsLoc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                val netLoc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                val best = gpsLoc ?: netLoc

                if (best != null) {
                    onResult(
                        LocationPoint(
                            latitude = best.latitude,
                            longitude = best.longitude,
                            addressName = "موقعیت فعلی شما",
                            city = "تهران"
                        )
                    )
                    return
                }
            }
        } catch (t: Throwable) {
            // Ignore security exception and fallback to default
        }
        onResult(LocationPoint.DEFAULT_TEHRAN)
    }
}
