package com.karvin.app.core.location

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult as FusedLocationResult
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
class LocationTracker @Inject constructor(@param:ApplicationContext private val context: Context) {
    private val client: FusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(context)
    private val _state = MutableStateFlow<LocationState>(LocationState.Loading)
    val state: StateFlow<LocationState> = _state.asStateFlow()

    fun refresh(onResult: (LocationResult) -> Unit) {
        if (!hasPermission()) return fail(LocationState.PermissionDenied, "دسترسی موقعیت مکانی فعال نیست.", onResult)
        if (!isLocationEnabled()) return fail(LocationState.LocationDisabled, "موقعیت مکانی گوشی خاموش است.", onResult)
        _state.value = LocationState.Loading
        fetchLocation(onResult)
    }

    @SuppressLint("MissingPermission")
    fun locationUpdates(intervalMillis: Long = 10_000L, onPoint: (GeoPoint) -> Unit): LocationCallback? {
        if (!hasPermission() || !isLocationEnabled()) {
            _state.value = if (!hasPermission()) LocationState.PermissionDenied else LocationState.LocationDisabled
            return null
        }
        val callback = object : LocationCallback() {
            override fun onLocationResult(result: FusedLocationResult) {
                result.lastLocation?.let { location ->
                    _state.value = LocationState.Available
                    onPoint(GeoPoint(location.latitude, location.longitude))
                }
            }
        }
        client.requestLocationUpdates(LocationRequest.Builder(Priority.PRIORITY_BALANCED_POWER_ACCURACY, intervalMillis).build(), callback, context.mainLooper)
        return callback
    }

    fun stopUpdates(callback: LocationCallback) { client.removeLocationUpdates(callback) }

    private fun hasPermission() = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED || ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
    private fun isLocationEnabled() = context.getSystemService(LocationManager::class.java)?.let { it.isProviderEnabled(LocationManager.GPS_PROVIDER) || it.isProviderEnabled(LocationManager.NETWORK_PROVIDER) } == true

    @SuppressLint("MissingPermission")
    private fun fetchLocation(onResult: (LocationResult) -> Unit) {
        client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, CancellationTokenSource().token)
            .addOnSuccessListener { location -> if (location == null) fail(LocationState.Error, "موقعیت فعلی پیدا نشد.", onResult) else { _state.value = LocationState.Available; onResult(LocationResult.Available(GeoPoint(location.latitude, location.longitude))) } }
            .addOnFailureListener { fail(LocationState.Error, "دریافت موقعیت با خطا مواجه شد.", onResult) }
    }

    private fun fail(state: LocationState, message: String, callback: (LocationResult) -> Unit) { _state.value = state; callback(LocationResult.Failed(state, message)) }
}
