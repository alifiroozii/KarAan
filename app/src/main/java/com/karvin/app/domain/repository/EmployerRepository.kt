package com.karvin.app.domain.repository

import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.EmployerProfile
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobApplication
import com.karvin.app.domain.model.Rating
import com.karvin.app.domain.model.Shift
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow

interface EmployerRepository {
    fun getEmployerProfile(userId: String): Flow<EmployerProfile?>
    suspend fun updateEmployerProfile(profile: EmployerProfile): Resource<EmployerProfile>
    suspend fun createJobPost(job: Job): Resource<Job>
    fun getEmployerJobs(employerId: String): Flow<List<Job>>
    fun getJobApplicants(employerId: String, jobId: String? = null): Flow<List<JobApplication>>
    suspend fun updateApplicationStatus(applicationId: String, status: ApplicationStatus): Resource<JobApplication>
    suspend fun rateWorker(rating: Rating): Resource<Rating>
    fun getEmployerShifts(employerId: String): Flow<List<Shift>>
}
