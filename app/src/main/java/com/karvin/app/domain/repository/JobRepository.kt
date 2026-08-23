package com.karvin.app.domain.repository

import com.karvin.app.domain.model.Job
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow

interface JobRepository {
    fun getNearbyJobs(city: String? = null, categoryId: String? = null, query: String? = null): Flow<List<Job>>
    fun getUrgentJobs(): Flow<List<Job>>
    fun getJobById(jobId: String): Flow<Job?>
    suspend fun refreshJobs(): Resource<Boolean>
}
