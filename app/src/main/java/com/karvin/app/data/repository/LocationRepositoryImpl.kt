package com.karvin.app.data.repository

import com.karvin.app.data.location.DistanceCalculator
import com.karvin.app.data.location.LocationTracker
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.LocationRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationRepositoryImpl @Inject constructor(
    private val locationTracker: LocationTracker
) : LocationRepository {

    private var cachedUserLocation = LocationPoint.DEFAULT_TEHRAN
    private val allJobs = FakeDataGenerator.generate100Jobs()
    private val allWorkers = FakeDataGenerator.generate100Workers().toMutableList()

    override fun getCurrentLocation(): Flow<LocationPoint> {
        return locationTracker.getCurrentLocation()
    }

    override suspend fun updateCurrentLocation(point: LocationPoint): Resource<Boolean> {
        cachedUserLocation = point
        return Resource.Success(true)
    }

    override fun getNearbyJobsOnMap(
        userLocation: LocationPoint,
        radiusKm: Double
    ): Flow<List<Job>> = flow {
        val jobsWithDistance = allJobs.map { job ->
            val jobLat = job.latitude ?: userLocation.latitude
            val jobLon = job.longitude ?: userLocation.longitude
            val distance = DistanceCalculator.calculateDistanceMeters(userLocation.latitude, userLocation.longitude, jobLat, jobLon)
            val distanceFa = DistanceCalculator.formatDistanceFa(distance)

            job.copy(
                distanceMeters = distance,
                distanceTextFa = distanceFa,
                matchScorePercentage = calculateFastMatchScore(distance, job.employerRating)
            )
        }.filter {
            (it.distanceMeters ?: 0) <= (radiusKm * 1000)
        }.sortedBy { it.distanceMeters ?: Int.MAX_VALUE }

        emit(jobsWithDistance)
    }

    override fun getNearbyWorkersOnMap(
        employerLocation: LocationPoint,
        categoryId: String?,
        radiusKm: Double
    ): Flow<List<WorkerProfile>> = flow {
        val workersWithDistance = allWorkers.map { worker ->
            val wLat = worker.latitude ?: employerLocation.latitude
            val wLon = worker.longitude ?: employerLocation.longitude
            val distance = DistanceCalculator.calculateDistanceMeters(employerLocation.latitude, employerLocation.longitude, wLat, wLon)
            val distanceFa = DistanceCalculator.formatDistanceFa(distance)

            worker.copy(
                distanceMeters = distance,
                distanceTextFa = distanceFa,
                matchScorePercentage = calculateFastMatchScore(distance, worker.rating)
            )
        }.filter { worker ->
            val inRadius = (worker.distanceMeters ?: 0) <= (radiusKm * 1000)
            val matchesCategory = if (categoryId.isNullOrBlank() || categoryId == "all") true else worker.categories.any { it.id == categoryId }
            inRadius && matchesCategory && worker.isAvailableNow
        }.sortedBy { it.distanceMeters ?: Int.MAX_VALUE }

        emit(workersWithDistance)
    }

    override suspend fun toggleAvailableNow(userId: String, isAvailableNow: Boolean): Resource<Boolean> {
        val index = allWorkers.indexOfFirst { it.userId == userId }
        if (index != -1) {
            allWorkers[index] = allWorkers[index].copy(isAvailableNow = isAvailableNow)
        }
        return Resource.Success(isAvailableNow)
    }

    override fun calculateDistance(point1: LocationPoint, point2: LocationPoint): Int {
        return DistanceCalculator.calculateDistanceMeters(point1, point2)
    }

    override fun formatDistanceFa(distanceMeters: Int): String {
        return DistanceCalculator.formatDistanceFa(distanceMeters)
    }

    private fun calculateFastMatchScore(distanceMeters: Int, rating: Float): Int {
        val distWeight = when {
            distanceMeters <= 1000 -> 95
            distanceMeters <= 3000 -> 88
            distanceMeters <= 6000 -> 78
            else -> 68
        }
        val ratingWeight = ((rating / 5.0f) * 10).toInt()
        return (distWeight + ratingWeight).coerceIn(60, 99)
    }
}
