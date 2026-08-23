package com.karvin.app.domain.repository

import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow

interface LocationRepository {
    fun getCurrentLocation(): Flow<LocationPoint>
    suspend fun updateCurrentLocation(point: LocationPoint): Resource<Boolean>
    fun getNearbyJobsOnMap(userLocation: LocationPoint, radiusKm: Double = 15.0): Flow<List<Job>>
    fun getNearbyWorkersOnMap(employerLocation: LocationPoint, categoryId: String? = null, radiusKm: Double = 15.0): Flow<List<WorkerProfile>>
    suspend fun toggleAvailableNow(userId: String, isAvailableNow: Boolean): Resource<Boolean>
    fun calculateDistance(point1: LocationPoint, point2: LocationPoint): Int
    fun formatDistanceFa(distanceMeters: Int): String
}
