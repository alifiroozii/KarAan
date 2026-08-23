package com.karvin.app.domain.usecase.location

import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.LocationRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetCurrentLocationUseCase @Inject constructor(
    private val locationRepository: LocationRepository
) {
    operator fun invoke(): Flow<LocationPoint> = locationRepository.getCurrentLocation()
}

class GetNearbyJobsOnMapUseCase @Inject constructor(
    private val locationRepository: LocationRepository
) {
    operator fun invoke(userLocation: LocationPoint, radiusKm: Double = 15.0): Flow<List<Job>> {
        return locationRepository.getNearbyJobsOnMap(userLocation, radiusKm)
    }
}

class GetNearbyWorkersOnMapUseCase @Inject constructor(
    private val locationRepository: LocationRepository
) {
    operator fun invoke(
        employerLocation: LocationPoint,
        categoryId: String? = null,
        radiusKm: Double = 15.0
    ): Flow<List<WorkerProfile>> {
        return locationRepository.getNearbyWorkersOnMap(employerLocation, categoryId, radiusKm)
    }
}

class ToggleAvailableNowUseCase @Inject constructor(
    private val locationRepository: LocationRepository
) {
    suspend operator fun invoke(userId: String, isAvailableNow: Boolean): Resource<Boolean> {
        return locationRepository.toggleAvailableNow(userId, isAvailableNow)
    }
}
