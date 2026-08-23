package com.karvin.app.domain.usecase.employer

import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.JobApplication
import com.karvin.app.domain.repository.EmployerRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetJobApplicantsUseCase @Inject constructor(
    private val employerRepository: EmployerRepository
) {
    operator fun invoke(employerId: String, jobId: String? = null): Flow<List<JobApplication>> {
        return employerRepository.getJobApplicants(employerId, jobId)
    }
}

class UpdateApplicantStatusUseCase @Inject constructor(
    private val employerRepository: EmployerRepository
) {
    suspend operator fun invoke(applicationId: String, status: ApplicationStatus): Resource<JobApplication> {
        return employerRepository.updateApplicationStatus(applicationId, status)
    }
}
