package com.karvin.app.domain.repository

import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.JobApplication
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow

interface ApplicationRepository {
    fun getWorkerApplications(workerId: String): Flow<List<JobApplication>>
    fun getJobApplicants(jobId: String): Flow<List<JobApplication>>
    fun getEmployerAllApplications(employerId: String): Flow<List<JobApplication>>
    suspend fun applyForJob(workerId: String, jobId: String): Resource<JobApplication>
    suspend fun cancelApplication(applicationId: String): Resource<Boolean>
    suspend fun updateApplicationStatus(applicationId: String, status: ApplicationStatus): Resource<Boolean>
}
