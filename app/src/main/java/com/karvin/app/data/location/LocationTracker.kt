package com.karvin.app.data.location

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
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
    private val fusedLocationClient: FusedLocationProviderClient by lazy {
        LocationServices.getFusedLocationProviderClient(context)
    }

    @SuppressLint("MissingPermission")
    fun getCurrentLocation(): Flow<LocationPoint> = callbackFlow {
        try {
            fusedLocationClient.getCurrentLocation(
                Priority.PRIORITY_BALANCED_POWER_ACCURACY,
                null
            ).addOnSuccessListener { location: Location? ->
                if (location != null) {
                    trySend(
                        LocationPoint(
                            latitude = location.latitude,
                            longitude = location.longitude,
                            addressName = "موقعیت فعلی شما",
                            city = "تهران"
                        )
                    )
                } else {
                    // Fallback to default Tehran coordinate
                    trySend(LocationPoint.DEFAULT_TEHRAN)
                }
            }.addOnFailureListener {
                trySend(LocationPoint.DEFAULT_TEHRAN)
            }
        } catch (e: Exception) {
            trySend(LocationPoint.DEFAULT_TEHRAN)
        }

        awaitClose { }
    }
}
