package com.karvin.app.domain.usecase.worker

import com.karvin.app.domain.model.Job
import com.karvin.app.domain.repository.JobRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetNearbyJobsUseCase @Inject constructor(
    private val jobRepository: JobRepository
) {
    operator fun invoke(city: String? = null, categoryId: String? = null, query: String? = null): Flow<List<Job>> {
        return jobRepository.getNearbyJobs(city, categoryId, query)
    }

    fun getUrgentJobs(): Flow<List<Job>> {
        return jobRepository.getUrgentJobs()
    }

    fun getJobById(jobId: String): Flow<Job?> {
        return jobRepository.getJobById(jobId)
    }
}
