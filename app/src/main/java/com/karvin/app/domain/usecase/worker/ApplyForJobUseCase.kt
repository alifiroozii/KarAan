package com.karvin.app.domain.usecase.worker

import com.karvin.app.domain.model.JobApplication
import com.karvin.app.domain.repository.WorkerRepository
import com.karvin.app.utils.Resource
import javax.inject.Inject

class ApplyForJobUseCase @Inject constructor(
    private val workerRepository: WorkerRepository
) {
    suspend operator fun invoke(workerId: String, jobId: String): Resource<JobApplication> {
        return workerRepository.applyForJob(workerId, jobId)
    }
}
