package com.karvin.app.domain.usecase.matching

import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.MatchResult
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.MatchingRepository
import javax.inject.Inject

class CalculateMatchScoreUseCase @Inject constructor(
    private val matchingRepository: MatchingRepository
) {
    operator fun invoke(job: Job, worker: WorkerProfile, userLocation: LocationPoint? = null): MatchResult {
        return matchingRepository.calculateJobWorkerMatch(job, worker, userLocation)
    }

    fun rankJobs(jobs: List<Job>, worker: WorkerProfile, userLocation: LocationPoint? = null): List<Job> {
        return matchingRepository.rankJobsForWorker(jobs, worker, userLocation)
    }

    fun rankWorkers(workers: List<WorkerProfile>, job: Job, employerLocation: LocationPoint? = null): List<WorkerProfile> {
        return matchingRepository.rankWorkersForJob(workers, job, employerLocation)
    }
}
