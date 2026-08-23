package com.karvin.app.domain.usecase.worker

import com.karvin.app.domain.model.JobApplication
import com.karvin.app.domain.repository.WorkerRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetWorkerApplicationsUseCase @Inject constructor(
    private val workerRepository: WorkerRepository
) {
    operator fun invoke(workerId: String): Flow<List<JobApplication>> {
        return workerRepository.getWorkerApplications(workerId)
    }
}
