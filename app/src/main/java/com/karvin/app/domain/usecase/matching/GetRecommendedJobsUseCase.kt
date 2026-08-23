package com.karvin.app.domain.usecase.matching

import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.MatchingRepository
import com.karvin.app.domain.repository.WorkerRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class GetRecommendedJobsUseCase @Inject constructor(
    private val matchingRepository: MatchingRepository,
    private val workerRepository: WorkerRepository
) {
    operator fun invoke(
        worker: WorkerProfile,
        userLocation: LocationPoint? = null,
        minMatchScore: Int = 75
    ): Flow<List<Job>> {
        return workerRepository.getNearbyJobs().map { allJobs ->
            matchingRepository.rankJobsForWorker(allJobs, worker, userLocation)
                .filter { (it.matchScorePercentage ?: 0) >= minMatchScore }
        }
    }
}
