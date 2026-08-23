package com.karvin.app.domain.usecase.matching

import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.LocationRepository
import com.karvin.app.domain.repository.MatchingRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class GetRecommendedWorkersUseCase @Inject constructor(
    private val matchingRepository: MatchingRepository,
    private val locationRepository: LocationRepository
) {
    operator fun invoke(
        job: Job,
        employerLocation: LocationPoint? = null,
        minMatchScore: Int = 75
    ): Flow<List<WorkerProfile>> {
        val location = employerLocation ?: LocationPoint.DEFAULT_TEHRAN
        return locationRepository.getNearbyWorkersOnMap(location, job.categoryId, radiusKm = 20.0).map { workers ->
            matchingRepository.rankWorkersForJob(workers, job, location)
                .filter { (it.matchScorePercentage ?: 0) >= minMatchScore }
        }
    }
}
