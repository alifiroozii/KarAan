package com.karvin.app.core.location

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.LocationState
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

sealed interface LocationResult {
    data class Available(val point: GeoPoint) : LocationResult
    data class Failed(val state: LocationState, val message: String) : LocationResult
}

@Singleton
class LocationTracker @Inject constructor(
    @param:ApplicationContext private val context: Context,
) {
    private val client: FusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(context)
    private val _state = MutableStateFlow<LocationState>(LocationState.Loading)
    val state: StateFlow<LocationState> = _state.asStateFlow()

    fun refresh(onResult: (LocationResult) -> Unit) {
        if (!hasLocationPermission()) {
            _state.value = LocationState.PermissionDenied
            onResult(LocationResult.Failed(LocationState.PermissionDenied, "دسترسی موقعیت مکانی فعال نیست."))
            return
        }
        if (!isLocationEnabled()) {
            _state.value = LocationState.LocationDisabled
            onResult(LocationResult.Failed(LocationState.LocationDisabled, "موقعیت مکانی گوشی خاموش است."))
            return
        }
        _state.value = LocationState.Loading
        fetchLocation(onResult)
    }

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

    private fun isLocationEnabled(): Boolean =
        context.getSystemService(LocationManager::class.java)?.let {
            it.isProviderEnabled(LocationManager.GPS_PROVIDER) || it.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
        } ?: false

    @SuppressLint("MissingPermission")
    private fun fetchLocation(onResult: (LocationResult) -> Unit) {
        val cancellation = CancellationTokenSource()
        client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, cancellation.token)
            .addOnSuccessListener { location ->
                if (location == null) {
                    _state.value = LocationState.Error
                    onResult(LocationResult.Failed(LocationState.Error, "موقعیت فعلی پیدا نشد."))
                } else {
                    _state.value = LocationState.Available
                    onResult(LocationResult.Available(GeoPoint(location.latitude, location.longitude)))
                }
            }
            .addOnFailureListener {
                _state.value = LocationState.Error
                onResult(LocationResult.Failed(LocationState.Error, "دریافت موقعیت با خطا مواجه شد."))
            }
    }
}
