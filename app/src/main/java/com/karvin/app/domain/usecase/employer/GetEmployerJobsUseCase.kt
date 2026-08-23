package com.karvin.app.domain.usecase.employer

import com.karvin.app.domain.model.Job
import com.karvin.app.domain.repository.EmployerRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetEmployerJobsUseCase @Inject constructor(
    private val employerRepository: EmployerRepository
) {
    operator fun invoke(employerId: String): Flow<List<Job>> {
        return employerRepository.getEmployerJobs(employerId)
    }
}
